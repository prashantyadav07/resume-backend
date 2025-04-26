import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import { PdfDocument } from "../models/documentSchema.js";
import fs from "fs";
import path from "path";

export const uploadAndExtractPdf = asyncHandler(async (req, res) => {
  try {
    // Check if file exists in the request
    if (!req.file) {
      throw new ApiError(400, "PDF file is required");
    }

    const pdfFile = req.file;
    const pdfLocalPath = pdfFile.path;

    // Check file extension
    const fileExt = path.extname(pdfLocalPath).toLowerCase();
    if (fileExt !== '.pdf') {
      // Remove the uploaded file
      fs.unlinkSync(pdfLocalPath);
      throw new ApiError(400, "Uploaded file must be a PDF");
    }

    
    // Extract text from PDF
    let pdfData;
    let extractedText = "";
    
    try {
      // Read file as buffer
      const pdfBuffer = fs.readFileSync(pdfLocalPath);
      
      // Dynamically import pdf-parse only when needed
      const pdfParse = await import("pdf-parse");
      
      // Use pdf-parse to extract text
      pdfData = await pdfParse.default(pdfBuffer);
      extractedText = pdfData.text;
    } catch (error) {
      console.error("Error extracting text from PDF:", error);
      // Remove the uploaded file
      fs.unlinkSync(pdfLocalPath);
      throw new ApiError(500, "Failed to extract text from PDF file");
    }

    // Store the original filename
    const originalFilename = pdfFile.originalname;
    
    // Create document in MongoDB
    const pdfDocument = await PdfDocument.create({
      
      filename: originalFilename,
      filePath: pdfLocalPath, // Store the file path for reference
      extractedText,
      metaData: {
        pageCount: pdfData.numpages || 0,
        info: pdfData.info || {},
        fileSize: fs.statSync(pdfLocalPath).size
      }
    });

    // Return response with the extracted text
    return res.status(201).json(
      new ApiResponse(
        201, 
        {
          document: pdfDocument,
          textPreview: extractedText.substring(0, 500) + (extractedText.length > 500 ? '...' : '')
        }, 
        "PDF text extracted and saved successfully"
      )
    );
  } catch (error) {
    console.error("Error in PDF processing:", error);
    // Error handling is done by the asyncHandler wrapper
    throw new ApiError(error.statusCode || 500, error.message || "Failed to process PDF document");
  }
});

export const getAllPdfDocuments = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;
  
  const pdfDocuments = await PdfDocument.find()
    .skip(skip)
    .limit(limit)
    .sort({ createdAt: -1 })
    .select("title description filename metaData.pageCount createdAt");
  
  const totalDocuments = await PdfDocument.countDocuments();
  
  return res.status(200).json(
    new ApiResponse(
      200,
      {
        documents: pdfDocuments,
        pagination: {
          total: totalDocuments,
          page,
          limit,
          pages: Math.ceil(totalDocuments / limit)
        }
      },
      "PDF documents fetched successfully"
    )
  );
});

export const getPdfDocumentById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  if (!id) {
    throw new ApiError(400, "Document ID is required");
  }
  
  const pdfDocument = await PdfDocument.findById(id);
  
  if (!pdfDocument) {
    throw new ApiError(404, "PDF document not found");
  }
  
  return res.status(200).json(
    new ApiResponse(
      200,
      pdfDocument,
      "PDF document fetched successfully"
    )
  );
});

export const searchPdfText = asyncHandler(async (req, res) => {
  const { query } = req.query;
  
  if (!query) {
    throw new ApiError(400, "Search query is required");
  }
  
  const pdfDocuments = await PdfDocument.find({
    $or: [
      { title: { $regex: query, $options: 'i' } },
      { extractedText: { $regex: query, $options: 'i' } }
    ]
  }).select("title description filename createdAt");
  
  return res.status(200).json(
    new ApiResponse(
      200,
      pdfDocuments,
      "Search results fetched successfully"
    )
  );
});

export const deletePdfDocument = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  if (!id) {
    throw new ApiError(400, "Document ID is required");
  }
  
  // Find the document to get the file path
  const pdfDocument = await PdfDocument.findById(id);
  
  if (!pdfDocument) {
    throw new ApiError(404, "PDF document not found");
  }
  
  // Delete the physical file if it exists
  if (pdfDocument.filePath && fs.existsSync(pdfDocument.filePath)) {
    try {
      fs.unlinkSync(pdfDocument.filePath);
    } catch (error) {
      console.error("Error deleting file:", error);
      // Continue with deletion from database even if file deletion fails
    }
  }
  
  // Delete the document from database
  await PdfDocument.findByIdAndDelete(id);
  
  return res.status(200).json(
    new ApiResponse(
      200,
      { deletedDocumentId: id },
      "PDF document deleted successfully"
    )
  );
});