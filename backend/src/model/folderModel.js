import mongoose from "mongoose";

const folderSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Folder name is required"],
      trim: true,
      maxlength: [80, "Folder name cannot exceed 80 characters"],
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

folderSchema.index({ owner: 1, name: 1 }, { unique: true });

export const Folder = mongoose.model("Folder", folderSchema);