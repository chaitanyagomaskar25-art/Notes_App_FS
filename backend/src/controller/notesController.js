import * as noteService from "../services/noteService.js";

export const getNotes = async (req, res, next) => {
  try {
    const result = await noteService.getNotes(req.user._id, req.query);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export const getNote = async (req, res, next) => {
  try {
    const note = await noteService.getNote(req.user._id, req.params.id);
    return res.status(200).json({ note });
  } catch (error) {
    next(error);
  }
};

export const createNote = async (req, res, next) => {
  try {
    const note = await noteService.createNote(req.user._id, req.body);
    return res.status(201).json({ note, data: note });
  } catch (error) {
    next(error);
  }
};

export const updateNote = async (req, res, next) => {
  try {
    const note = await noteService.updateNote(req.user._id, req.params.id, req.body);
    return res.status(200).json({ note, data: note });
  } catch (error) {
    next(error);
  }
};

export const deleteNote = async (req, res, next) => {
  try {
    const note = await noteService.deleteNote(req.user._id, req.params.id);
    return res.status(200).json({ message: "Note moved to trash", note });
  } catch (error) {
    next(error);
  }
};

export const restoreNote = async (req, res, next) => {
  try {
    const note = await noteService.restoreNote(req.user._id, req.params.id);
    return res.status(200).json({ message: "Note restored", note });
  } catch (error) {
    next(error);
  }
};

export const permanentDeleteNote = async (req, res, next) => {
  try {
    const result = await noteService.permanentDeleteNote(req.user._id, req.params.id);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export const emptyTrash = async (req, res, next) => {
  try {
    const result = await noteService.emptyTrash(req.user._id);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export const updateCollaborators = async (req, res, next) => {
  try {
    const note = await noteService.updateCollaborators(
      req.user._id,
      req.params.id,
      req.body?.collaborators
    );
    return res.status(200).json({ note, data: note });
  } catch (error) {
    next(error);
  }
};

export const getVersions = async (req, res, next) => {
  try {
    const versions = await noteService.getVersions(req.user._id, req.params.id);
    return res.status(200).json({ versions });
  } catch (error) {
    next(error);
  }
};

export const restoreVersion = async (req, res, next) => {
  try {
    const note = await noteService.restoreVersion(
      req.user._id,
      req.params.id,
      req.params.versionId
    );
    return res.status(200).json({ message: "Version restored", note });
  } catch (error) {
    next(error);
  }
};
