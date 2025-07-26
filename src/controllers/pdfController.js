// --- START OF FILE controllers/pdfController.js (UPDATED & SMARTER) ---

import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import { PdfDocument } from "../models/documentSchema.js";
import fs from "fs";
import path from "path";

// Helper function to remove local file safely
const removeLocalFile = (filePath) => {
    if (filePath && fs.existsSync(filePath)) {
        fs.unlink(filePath, (err) => {
            if (err) console.error(`Failed to delete temporary file: ${filePath}`, err);
        });
    }
};

export const uploadAndExtractPdf = asyncHandler(async (req, res) => {
  if (!req.file) {
    throw new ApiError(400, "PDF file is required");
  }

  const pdfLocalPath = req.file.path;
  const userUID = req.user.uid; 

  try {
    const fileExt = path.extname(pdfLocalPath).toLowerCase();
    if (fileExt !== '.pdf') {
      throw new ApiError(400, "Uploaded file must be a PDF");
    }

    // Dynamic import for pdf-parse
    const pdfParse = await import("pdf-parse");
    const pdfBuffer = fs.readFileSync(pdfLocalPath);
    const pdfData = await pdfParse.default(pdfBuffer);
    const extractedText = pdfData.text;

    // --- SMART CHECK YAHAN ADD KIYA HAI ---
    // Agar text khaali hai, toh error do
    if (!extractedText || extractedText.trim() === '') {
        throw new ApiError(400, "Could not extract any text from this PDF. It might be an image-only or scanned PDF.");
    }
    
    const pdfDocument = await PdfDocument.create({
      user: userUID,
      filename: req.file.originalname,
      filePath: pdfLocalPath,
      extractedText, // Text will only be saved if it exists
      metaData: {
        pageCount: pdfData.numpages || 0,
        info: pdfData.info || {},
        fileSize: req.file.size
      }
    });

    removeLocalFile(pdfLocalPath); // Temp file delete kar do

    return res.status(201).json(
      new ApiResponse(201, { document: pdfDocument }, "PDF uploaded and processed")
    );
  } catch (error) {
    removeLocalFile(pdfLocalPath); // Error aane par bhi temp file delete karo
    // Pehle se ApiError hai to usko use karo, nahi to naya banao
    if (error instanceof ApiError) {
        throw error;
    }
    throw new ApiError(500, error.message || "Failed to process PDF");
  }
});


export const getAllUserPdfDocuments = asyncHandler(async (req, res) => {
  const userUID = req.user.uid;
  
  const documents = await PdfDocument.find({ user: userUID })
    .sort({ createdAt: -1 })
    .select("_id filename metaData.pageCount createdAt");
  
  return res.status(200).json(new ApiResponse(200, documents, "User's PDF documents fetched successfully"));
});

export const getPdfDocumentById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userUID = req.user.uid;

  const pdfDocument = await PdfDocument.findById(id);

  if (!pdfDocument) {
    throw new ApiError(404, "PDF document not found");
  }
  
  if (pdfDocument.user.toString() !== userUID) {
      throw new ApiError(403, "Forbidden: You do not have permission to access this document.");
  }

  return res.status(200).json(new ApiResponse(200, pdfDocument, "PDF document fetched successfully"));
});

export const searchUserPdfText = asyncHandler(async (req, res) => {
  const { query } = req.query;
  const userUID = req.user.uid;
  
  if (!query) {
    throw new ApiError(400, "Search query is required");
  }

  const documents = await PdfDocument.find({
    user: userUID, 
    $or: [
      { filename: { $regex: query, $options: 'i' } },
      { extractedText: { $regex: query, $options: 'i' } }
    ]
  }).select("_id filename createdAt");

  return res.status(200).json(new ApiResponse(200, documents, "Search results fetched successfully"));
});

export const deletePdfDocument = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const userUID = req.user.uid;
  
    const pdfDocument = await PdfDocument.findById(id);
  
    if (!pdfDocument) {
      throw new ApiError(404, "PDF document not found");
    }

    if (pdfDocument.user.toString() !== userUID) {
        throw new ApiError(403, "Forbidden: You do not have permission to delete this document.");
    }
    
    // Yahan Cloudinary ya local se file delete karne ka code daal sakte ho agar zaroorat ho
    
    await PdfDocument.findByIdAndDelete(id);
  
    return res.status(200).json(new ApiResponse(200, { deletedDocumentId: id }, "PDF document deleted successfully"));
});

// geminiController se copy kar liya hai (reference ke liye)
import { GoogleGenerativeAI } from "@google/generative-ai";
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export const analyzeResume = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userUID = req.user.uid;

  const pdfDocument = await PdfDocument.findById(id);

  if (!pdfDocument) {
    throw new ApiError(404, "Resume not found");
  }
  
  if (pdfDocument.user.toString() !== userUID) {
    throw new ApiError(403, "Forbidden: You do not have permission to analyze this document.");
  }
  
  const resumeText = pdfDocument.extractedText;

  // Ye check abhi bhi zaroori hai purane documents ke liye
  if (!resumeText || resumeText.trim() === '') {
    throw new ApiError(400, "No text content found in resume to analyze. Please re-upload.");
  }

  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  const prompt = `
    You are an expert HR Tech Resume Evaluator. Analyze the following resume text.
    Provide a detailed analysis in a clean JSON format. The JSON should have these fields:
    - "overallScore": A score from 0 to 100.
    - "keyStrengths": An array of 3-4 strings highlighting the candidate's strengths.
    - "priorityImprovements": An array of 3-4 strings with actionable suggestions for improvement.
    - "overallAssessment": A brief 2-3 sentence summary.
    
    Here is the resume text:
    ---
    ${resumeText}
    ---
  `;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const analysisText = response.text();
    const cleanedText = analysisText.replace(/```json|```/g, '').trim();
    const analysisData = JSON.parse(cleanedText);

    return res.status(200).json(new ApiResponse(200, {
      resumeId: id,
      resumeName: pdfDocument.filename,
      analysis: analysisData
    }, "Analysis complete"));

  } catch (error) {
      console.error("Error during Gemini analysis:", error);
      throw new ApiError(500, "AI service failed to generate a valid analysis. Please try again.");
  }
});