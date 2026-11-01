import mongoose from "mongoose";

const noteVersionSchema = new mongoose.Schema(
  {
    note: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Note",
      required: true,
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    title: String,
    content: String,
    category: String,
    favorite: Boolean,
    pinned: Boolean,
    archived: Boolean,
    trashed: Boolean,
    tags: [String],
    folder: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Folder",
      default: null,
    },
    checklist: [
      {
        text: String,
        done: Boolean,
      },
    ],
    reminder: Date,
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export const NoteVersion = mongoose.model("NoteVersion", noteVersionSchema);