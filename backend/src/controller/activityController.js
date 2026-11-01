import { Activity } from "../model/activityModel.js";

export const logActivity = async (req, res) => {
  try {
    const { action, noteId, metadata } = req.body || {};
    if (!action) {
      return res.status(400).json({ message: "Action is required" });
    }
    const activity = await Activity.create({
      user: req.user._id,
      action,
      note: noteId || null,
      metadata: metadata || {},
    });
    return res.status(201).json({ activity });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const getActivities = async (req, res) => {
  try {
    const activities = await Activity.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .limit(100)
      .populate("note", "title");
    return res.status(200).json({ activities });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};