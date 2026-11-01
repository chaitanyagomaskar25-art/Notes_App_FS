import mongoose from "mongoose";

const snippetSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Snippet title is required"],
      trim: true,
      maxlength: [150, "Title cannot exceed 150 characters"],
    },
    code: {
      type: String,
      default: "",
    },
    language: {
      type: String,
      default: "javascript",
      trim: true,
    },
    description: {
      type: String,
      default: "",
    },
    tags: {
      type: [String],
      default: [],
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

export const Snippet = mongoose.model("Snippet", snippetSchema);