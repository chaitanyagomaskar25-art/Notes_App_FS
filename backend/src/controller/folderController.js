import { Folder } from "../model/folderModel.js";
import { Note } from "../model/notesModel.js";

export const getFolders = async (req, res) => {
  try {
    const folders = await Folder.find({ owner: req.user._id }).sort({ name: 1 });
    return res.status(200).json({ folders });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const createFolder = async (req, res) => {
  try {
    const name = (req.body?.name || "").trim();
    if (!name) {
      return res.status(400).json({ message: "Folder name is required" });
    }
    const existing = await Folder.findOne({ owner: req.user._id, name });
    if (existing) {
      return res.status(400).json({ message: "Folder already exists" });
    }
    const folder = await Folder.create({ name, owner: req.user._id });
    return res.status(201).json({ folder });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const renameFolder = async (req, res) => {
  try {
    const folder = await Folder.findOne({
      _id: req.params.id,
      owner: req.user._id,
    });
    if (!folder) {
      return res.status(404).json({ message: "Folder not found" });
    }
    const name = (req.body?.name || "").trim();
    if (!name) {
      return res.status(400).json({ message: "Folder name is required" });
    }
    const duplicate = await Folder.findOne({
      owner: req.user._id,
      name,
      _id: { $ne: folder._id },
    });
    if (duplicate) {
      return res.status(400).json({ message: "Folder already exists" });
    }
    folder.name = name;
    await folder.save();
    return res.status(200).json({ folder });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const deleteFolder = async (req, res) => {
  try {
    const folder = await Folder.findOne({
      _id: req.params.id,
      owner: req.user._id,
    });
    if (!folder) {
      return res.status(404).json({ message: "Folder not found" });
    }
    // Move notes out of the folder
    await Note.updateMany(
      { owner: req.user._id, folder: folder._id },
      { $set: { folder: null } }
    );
    await folder.deleteOne();
    return res.status(200).json({ message: "Folder deleted" });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};