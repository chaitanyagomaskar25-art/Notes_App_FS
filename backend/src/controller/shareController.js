import jwt from "jsonwebtoken";
import { User } from "../model/userModel.js";
import { Note } from "../model/notesModel.js";
import { NoteShare } from "../model/shareModel.js";

const getAuthUser = async (req) => {
  try {
    const token = req.cookies?.access_token;
    if (!token) return null;
    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN);
    return await User.findById(decoded.userId);
  } catch {
    return null;
  }
};

export const createShare = async (req, res) => {
  try {
    const note = await Note.findById(req.params.id);
    if (!note) return res.status(404).json({ message: "Note not found" });
    if (String(note.owner) !== String(req.user._id)) {
      return res.status(403).json({ message: "Only the owner can share this note" });
    }
    const { access = "public", expiresAt } = req.body || {};
    if (!["public", "private"].includes(access)) {
      return res.status(400).json({ message: "Invalid access type" });
    }
    const share = await NoteShare.create({
      note: note._id,
      owner: req.user._id,
      access,
      expiresAt: expiresAt ? new Date(expiresAt) : null,
    });
    return res.status(201).json({ share });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const listShares = async (req, res) => {
  try {
    const note = await Note.findById(req.params.id);
    if (!note) return res.status(404).json({ message: "Note not found" });
    if (String(note.owner) !== String(req.user._id)) {
      return res.status(403).json({ message: "Not authorized" });
    }
    const shares = await NoteShare.find({
      note: note._id,
      owner: req.user._id,
      revoked: false,
    }).sort({ createdAt: -1 });
    return res.status(200).json({ shares });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const revokeShare = async (req, res) => {
  try {
    const share = await NoteShare.findOne({
      _id: req.params.id,
      owner: req.user._id,
    });
    if (!share) return res.status(404).json({ message: "Share not found" });
    share.revoked = true;
    await share.save();
    return res.status(200).json({ message: "Share revoked" });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const viewShare = async (req, res) => {
  try {
    const share = await NoteShare.findOne({ token: req.params.token }).populate(
      "note"
    );
    if (!share || share.revoked) {
      return res.status(404).json({ message: "Share not found or revoked" });
    }
    if (share.expiresAt && share.expiresAt < new Date()) {
      return res.status(410).json({ message: "Share link has expired" });
    }
    if (share.access === "private") {
      const user = await getAuthUser(req);
      if (!user) {
        return res.status(401).json({ message: "Authentication required" });
      }
    }
    return res.status(200).json({
      note: share.note,
      share: { access: share.access, expiresAt: share.expiresAt },
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};