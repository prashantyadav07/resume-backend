// --- START OF FILE models/documentSchema.js ---

import mongoose from "mongoose";

const PdfDocumentSchema = new mongoose.Schema(
  {
    user: {
      type: String, // This will store the Firebase UID
      required: true,
      index: true,
    },
    title: {
      type: String,
      trim: true,
      maxlength: [100, "Title cannot be more than 100 characters"]
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, "Description cannot be more than 500 characters"]
    },
    filename: {
      type: String,
      required: [true, "Filename is required"]
    },
    filePath: {
      type: String,
      required: [true, "File path is required"]
    },
    extractedText: {
      type: String,
      required: [true, "Extracted text is required"]
    },
    metaData: {
      pageCount: { type: Number, default: 0 },
      info: { type: Object, default: {} },
      fileSize: { type: Number, default: 0 },
    },
  },
  {
    timestamps: true,
  }
);

PdfDocumentSchema.index({ user: 1, createdAt: -1 });

export const PdfDocument = mongoose.model("PdfDocument", PdfDocumentSchema);