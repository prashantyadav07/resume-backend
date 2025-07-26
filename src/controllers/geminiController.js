// --- START OF FILE src/controllers/geminiController.js ---

import { GoogleGenerativeAI } from "@google/generative-ai";
import { PdfDocument } from "../models/documentSchema.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";

// Initialize genAI variable (will be set when first used)
let genAI = null;

// Function to get or initialize genAI
const getGenAI = () => {
  if (!genAI) {
    if (!process.env.GEMINI_API_KEY) {
      console.error("❌ GEMINI_API_KEY is not set in environment variables");
      throw new Error("GEMINI_API_KEY is required but not found in environment variables");
    }
    genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  }
  return genAI;
};

export const analyzeResume = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userUID = req.user.uid;

  if (!id) throw new ApiError(400, "Document ID is required.");
  
  const pdfDocument = await PdfDocument.findById(id);

  if (!pdfDocument) throw new ApiError(404, "Resume not found.");
  
  if (pdfDocument.user.toString() !== userUID) {
    throw new ApiError(403, "Forbidden: You do not have permission to analyze this document.");
  }
  
  const resumeText = pdfDocument.extractedText;
  if (!resumeText || resumeText.trim() === '') {
    throw new ApiError(400, "Could not analyze. No text found in this PDF.");
  }

  const model = getGenAI().getGenerativeModel({ model: "gemini-1.5-flash" });

  const prompt = `
    You are an ATS (Applicant Tracking System) scanner. Analyze this resume like an ATS would and provide concise feedback.

    ATS SCORING (0-100):
    - Keywords & Skills Match: 40%
    - Format & Structure: 30% 
    - Experience Relevance: 20%
    - Contact & Basic Info: 10%

    Respond with EXACTLY this JSON (keep all text concise and under 15 words per item):
    {
      "overallScore": number,
      "keyStrengths": [
        "Brief strength 1",
        "Brief strength 2", 
        "Brief strength 3"
      ],
      "priorityImprovements": [
        "Quick fix 1",
        "Quick fix 2",
        "Quick fix 3"
      ],
      "overallAssessment": "One sentence ATS summary"
    }

    Resume: ${resumeText.substring(0, 2000)}
  `;

  try {
    // Optimized config for speed and conciseness
    const generationConfig = {
      temperature: 0.1,  // Very focused responses
      topK: 1,
      topP: 0.5,
      maxOutputTokens: 400,  // Much smaller limit
    };

    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig,
    });
    
    const response = await result.response;
    const analysisText = response.text();

    // Better JSON extraction
    let cleanedText = analysisText.replace(/```json|```/g, '').trim();
    
    // Remove any text before the first { and after the last }
    const firstBrace = cleanedText.indexOf('{');
    const lastBrace = cleanedText.lastIndexOf('}');
    
    if (firstBrace !== -1 && lastBrace !== -1) {
      cleanedText = cleanedText.substring(firstBrace, lastBrace + 1);
    }

    const analysisData = JSON.parse(cleanedText);

    // Validate the response structure
    if (!analysisData.overallScore || !Array.isArray(analysisData.keyStrengths) || 
        !Array.isArray(analysisData.priorityImprovements)) {
      throw new Error("Invalid analysis structure received from AI");
    }

    // Ensure score is within valid range
    analysisData.overallScore = Math.max(0, Math.min(100, analysisData.overallScore));

    return res.status(200).json(new ApiResponse(
        200, 
        { 
          resumeId: id, 
          resumeName: pdfDocument.filename, 
          analysis: analysisData,
          analysisTimestamp: new Date().toISOString()
        }, 
        "Analysis completed successfully"
      )
    );
  } catch (error) {
    console.error("Error during Gemini analysis or parsing:", error);
    
    // Handle different types of errors
    if (error.message && error.message.includes('API key not valid')) {
      throw new ApiError(401, "Invalid Gemini API key. Please check your API key configuration.");
    }
    
    if (error.message && error.message.includes('quota')) {
      throw new ApiError(429, "API quota exceeded. Please try again later.");
    }
    
    if (error.status === 400) {
      throw new ApiError(400, "Bad request to Gemini API. Please check the request format.");
    }
    
    if (error.status === 403) {
      throw new ApiError(403, "Access forbidden. Please check your API key permissions.");
    }
    
    // JSON parsing error
    if (error instanceof SyntaxError && error.message.includes('JSON')) {
      throw new ApiError(500, "Failed to parse AI response. The AI service returned invalid data.");
    }
    
    // Generic network/API errors
    if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
      throw new ApiError(503, "Unable to connect to AI service. Please check your internet connection.");
    }
    
    // Fallback for any other errors
    console.error("Unhandled error type:", error.constructor.name, error.message);
    throw new ApiError(500, "The AI service failed. This might be a temporary issue.");
  }
});