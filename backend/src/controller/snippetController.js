import { Snippet } from "../model/snippetModel.js";

export const getSnippets = async (req, res) => {
  try {
    const snippets = await Snippet.find({ owner: req.user._id }).sort({
      updatedAt: -1,
    });
    return res.status(200).json({ snippets });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const createSnippet = async (req, res) => {
  try {
    const { title, code, language, description, tags } = req.body;
    if (!title || !title.trim()) {
      return res.status(400).json({ message: "Title is required" });
    }
    const snippet = await Snippet.create({
      title: title.trim(),
      code: code ?? "",
      language: language?.trim() || "javascript",
      description: description ?? "",
      tags: Array.isArray(tags) ? tags : [],
      owner: req.user._id,
    });
    return res.status(201).json({ snippet });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const updateSnippet = async (req, res) => {
  try {
    const snippet = await Snippet.findOne({
      _id: req.params.id,
      owner: req.user._id,
    });
    if (!snippet) {
      return res.status(404).json({ message: "Snippet not found" });
    }
    const { title, code, language, description, tags } = req.body;
    if (title !== undefined) snippet.title = title.trim();
    if (code !== undefined) snippet.code = code;
    if (language !== undefined) snippet.language = language.trim() || "javascript";
    if (description !== undefined) snippet.description = description;
    if (tags !== undefined)
      snippet.tags = Array.isArray(tags) ? tags : snippet.tags;
    await snippet.save();
    return res.status(200).json({ snippet });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const deleteSnippet = async (req, res) => {
  try {
    const snippet = await Snippet.findOneAndDelete({
      _id: req.params.id,
      owner: req.user._id,
    });
    if (!snippet) {
      return res.status(404).json({ message: "Snippet not found" });
    }
    return res.status(200).json({ message: "Snippet deleted" });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};