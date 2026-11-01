import mongoose from "mongoose";
import { Note } from "../model/notesModel.js";
import { NoteVersion } from "../model/noteVersionModel.js";
import { Activity } from "../model/activityModel.js";

const createError = (message, statusCode = 400) => {
  const err = new Error(message);
  err.statusCode = statusCode;
  return err;
};

const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);

export const getNotes = async (userId, query = {}) => {
  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit, 10) || 50));
  const skip = (page - 1) * limit;
  const filter = { $or: [{ owner: userId }, { collaborators: userId }] };
  const [notes, total] = await Promise.all([
    Note.find(filter).sort({ updatedAt: -1 }).skip(skip).limit(limit),
    Note.countDocuments(filter),
  ]);
  return { notes, pagination: { page, limit, total, pages: Math.ceil(total / limit) || 1 } };
};

export const createNote = async (userId, data) => {
  const { title, content, category, favorite, pinned, archived, trashed, tags, folder, checklist, reminder } = data || {};
  if (!title || !title.trim()) throw createError("Title is required", 400);
  if (title.trim().length > 150) throw createError("Title cannot exceed 150 characters", 400);
  const note = await Note.create({
    title: title.trim(),
    content: content ?? "",
    category: category?.trim() || "General",
    favorite: Boolean(favorite),
    pinned: Boolean(pinned),
    archived: Boolean(archived),
    trashed: Boolean(trashed),
    tags: Array.isArray(tags) ? tags : [],
    folder: folder || null,
    checklist: Array.isArray(checklist) ? checklist : [],
    reminder: reminder ? new Date(reminder) : null,
    owner: userId,
    collaborators: [],
  });
  await Activity.create({ user: userId, action: "created", note: note._id, metadata: { title: note.title } });
  return note;
};

export const getNote = async (userId, id) => {
  if (!isValidId(id)) throw createError("Invalid note id", 400);
  const note = await Note.findById(id);
  if (!note) throw createError("Note not found", 404);
  const isOwner = String(note.owner) === String(userId);
  const isCollab = (note.collaborators || []).some((c) => String(c) === String(userId));
  if (!isOwner && !isCollab) throw createError("Not authorized", 403);
  return note;
};

export const updateNote = async (userId, id, data) => {
  if (!isValidId(id)) throw createError("Invalid note id", 400);
  const note = await Note.findById(id);
  if (!note) throw createError("Note not found", 404);
  const isOwner = String(note.owner) === String(userId);
  const isCollab = (note.collaborators || []).some((c) => String(c) === String(userId));
  if (!isOwner && !isCollab) throw createError("Not authorized", 403);

  await NoteVersion.create({
    note: note._id, owner: userId, title: note.title, content: note.content,
    category: note.category, favorite: note.favorite, pinned: note.pinned,
    archived: note.archived, trashed: note.trashed, tags: note.tags,
    folder: note.folder, checklist: note.checklist, reminder: note.reminder,
  });
  const versions = await NoteVersion.find({ note: note._id }).sort({ createdAt: -1 }).skip(20).select("_id");
  if (versions.length) {
    await NoteVersion.deleteMany({ _id: { $in: versions.map((v) => v._id) } });
  }

  const { title, content, category, favorite, pinned, archived, trashed, tags, folder, checklist, reminder } = data || {};
  if (title !== undefined) {
    if (!title.trim()) throw createError("Title is required", 400);
    if (title.trim().length > 150) throw createError("Title cannot exceed 150 characters", 400);
    note.title = title.trim();
  }
  if (content !== undefined) note.content = content;
  if (category !== undefined) note.category = category.trim() || "General";
  if (favorite !== undefined) note.favorite = Boolean(favorite);
  if (pinned !== undefined) note.pinned = Boolean(pinned);
  if (archived !== undefined) note.archived = Boolean(archived);
  if (trashed !== undefined) note.trashed = Boolean(trashed);
  if (tags !== undefined) note.tags = Array.isArray(tags) ? tags : note.tags;
  if (folder !== undefined) note.folder = folder || null;
  if (checklist !== undefined) note.checklist = Array.isArray(checklist) ? checklist : note.checklist;
  if (reminder !== undefined) note.reminder = reminder ? new Date(reminder) : null;

  await note.save();
  await Activity.create({ user: userId, action: "updated", note: note._id, metadata: { title: note.title } });
  return note;
};

export const deleteNote = async (userId, id) => {
  if (!isValidId(id)) throw createError("Invalid note id", 400);
  const note = await Note.findById(id);
  if (!note) throw createError("Note not found", 404);
  if (String(note.owner) !== String(userId)) throw createError("Only the owner can delete this note", 403);
  note.trashed = true;
  note.archived = false;
  await note.save();
  await Activity.create({ user: userId, action: "trashed", note: note._id, metadata: { title: note.title } });
  return note;
};

export const restoreNote = async (userId, id) => {
  if (!isValidId(id)) throw createError("Invalid note id", 400);
  const note = await Note.findById(id);
  if (!note) throw createError("Note not found", 404);
  if (String(note.owner) !== String(userId)) throw createError("Only the owner can restore this note", 403);
  note.trashed = false;
  await note.save();
  await Activity.create({ user: userId, action: "restored", note: note._id, metadata: { title: note.title } });
  return note;
};

export const permanentDeleteNote = async (userId, id) => {
  if (!isValidId(id)) throw createError("Invalid note id", 400);
  const note = await Note.findById(id);
  if (!note) throw createError("Note not found", 404);
  if (String(note.owner) !== String(userId)) throw createError("Only the owner can delete this note", 403);
  await Activity.create({ user: userId, action: "permanently_deleted", note: note._id, metadata: { title: note.title } });
  await note.deleteOne();
  return { message: "Note permanently deleted" };
};

export const emptyTrash = async (userId) => {
  await Note.deleteMany({ owner: userId, trashed: true });
  return { message: "Trash emptied" };
};

export const updateCollaborators = async (userId, id, collaborators) => {
  if (!isValidId(id)) throw createError("Invalid note id", 400);
  const note = await Note.findById(id);
  if (!note) throw createError("Note not found", 404);
  if (String(note.owner) !== String(userId)) throw createError("Only the owner can manage collaborators", 403);
  note.collaborators = Array.isArray(collaborators) ? collaborators : [];
  await note.save();
  return note;
};

export const getVersions = async (userId, id) => {
  if (!isValidId(id)) throw createError("Invalid note id", 400);
  const note = await Note.findById(id);
  if (!note) throw createError("Note not found", 404);
  if (String(note.owner) !== String(userId)) throw createError("Not authorized", 403);
  return NoteVersion.find({ note: note._id }).sort({ createdAt: -1 }).limit(20);
};

export const restoreVersion = async (userId, id, versionId) => {
  if (!isValidId(id) || !isValidId(versionId)) throw createError("Invalid id", 400);
  const note = await Note.findById(id);
  if (!note) throw createError("Note not found", 404);
  if (String(note.owner) !== String(userId)) throw createError("Not authorized", 403);
  const version = await NoteVersion.findById(versionId);
  if (!version || String(version.note) !== String(note._id)) throw createError("Version not found", 404);

  await NoteVersion.create({
    note: note._id, owner: userId, title: note.title, content: note.content,
    category: note.category, favorite: note.favorite, pinned: note.pinned,
    archived: note.archived, trashed: note.trashed, tags: note.tags,
    folder: note.folder, checklist: note.checklist, reminder: note.reminder,
  });

  note.title = version.title;
  note.content = version.content;
  note.category = version.category;
  note.favorite = version.favorite;
  note.pinned = version.pinned;
  note.archived = version.archived;
  note.trashed = version.trashed;
  note.tags = version.tags;
  note.folder = version.folder;
  note.checklist = version.checklist;
  note.reminder = version.reminder;
  await note.save();

  await Activity.create({ user: userId, action: "restored_version", note: note._id, metadata: { title: note.title } });
  return note;
};
