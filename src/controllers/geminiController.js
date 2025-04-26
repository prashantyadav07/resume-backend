import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { PdfDocument } from "../models/documentSchema.js";

dotenv.config();

// Initialize Gemini AI with your API key
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * Analyze and rate a resume with Gemini AI
 * @param {Object} req - Express request object with resume ID
 * @param {Object} res - Express response object
 */
export const analyzeResume = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid resume ID format"
      });
    }

    // Fetch the document directly from the database using the model
    const pdfDocument = await PdfDocument.findById(id);

    if (!pdfDocument) {
      return res.status(404).json({
        success: false,
        message: "Resume not found"
      });
    }

    // Get extracted text from the document
    const resumeText = pdfDocument.extractedText;

    if (!resumeText || resumeText.trim() === '') {
      return res.status(400).json({
        success: false,
        message: "No text content found in resume"
      });
    }

    // Initialize Gemini model
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    // Create the prompt for resume analysis
    const prompt = `
You are a professional resume evaluator specializing in tech industry resumes. Analyze the following resume for a tech position and rate it on a scale of 0-100.

Evaluate these criteria:
1. Technical Skills (25 points): Relevance and depth of technical skills
2. Projects & Experience (25 points): Quality of projects, real-world experience
3. Education & Certifications (15 points): Relevant education and certifications
4. Resume Format & Clarity (15 points): Organization, readability, professional presentation
5. Impact & Achievements (20 points): Quantifiable achievements, impact statements

For each criterion, provide:
- Score (out of allocated points)
- Analysis (2-3 sentences)
- Improvement suggestions (1-2 specific recommendations)

Then provide:
- Overall Score (sum of all criteria, out of 100)
- Key Strengths (3 bullet points)
- Priority Improvements (3 bullet points)
- Brief overall assessment (2-3 sentences)

Format as clean JSON with this structure:
{
  "criteria": [
    {
      "name": "Technical Skills",
      "score": 20,
      "analysis": "string",
      "improvements": "string"
    },
    ...other criteria
  ],
  "overallScore": 85,
  "keyStrengths": ["strength1", "strength2", "strength3"],
  "priorityImprovements": ["improvement1", "improvement2", "improvement3"],
  "overallAssessment": "string"
}

Here is the resume:
${resumeText}
`;

    // Generate analysis with Gemini
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const analysisText = response.text();

    // Remove the markdown formatting (```json and ```)
    const cleanedText = analysisText.replace(/```json|```/g, '').trim();

    try {
      // Parse the cleaned response as JSON
      const analysisData = JSON.parse(cleanedText);

      // Return the analysis results
      return res.status(200).json({
        success: true,
        resumeId: id,
        resumeName: pdfDocument.filename,
        analysis: analysisData
      });
    } catch (parseError) {
      console.error("Error parsing Gemini response:", parseError);

      // Return raw text if JSON parsing fails
      return res.status(200).json({
        success: true,
        resumeId: id,
        resumeName: pdfDocument.filename,
        analysis: {
          raw: cleanedText,
          parseError: "Could not parse response as JSON"
        }
      });
    }

  } catch (error) {
    console.error("Error analyzing resume:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to analyze resume",
      error: error.message
    });
  }
};
