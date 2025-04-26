import mongoose from "mongoose";

const PdfDocumentSchema = new mongoose.Schema(
  {
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
      pageCount: {
        type: Number,
        default: 0
      },
      info: {
        type: Object,
        default: {}
      },
      fileSize: {
        type: Number,
        default: 0
      },
      mimeType: {
        type: String,
        default: 'application/pdf'
      },
      uploadDate: {
        type: Date,
        default: Date.now
      }
    },
    status: {
      type: String,
      enum: ['processing', 'completed', 'error'],
      default: 'completed'
    }
  },
  {
    timestamps: true,
  }
);

// ✅ Fix the name here
PdfDocumentSchema.index({ title: 'text', extractedText: 'text' });
PdfDocumentSchema.index({ createdAt: -1 });

PdfDocumentSchema.methods.getSummary = function () {
  return {
    id: this._id,
    title: this.title,
    description: this.description,
    filename: this.filename,
    pageCount: this.metaData.pageCount,
    fileSize: this.metaData.fileSize,
    createdAt: this.createdAt
  };
};

PdfDocumentSchema.methods.getTextPreview = function (length = 500) {
  if (!this.extractedText) return '';
  return this.extractedText.substring(0, length) +
    (this.extractedText.length > length ? '...' : '');
};

PdfDocumentSchema.virtual('fileUrl').get(function () {
  return `/files/${this._id}/${this.filename}`;
});

export const PdfDocument = mongoose.model("PdfDocument", PdfDocumentSchema);
