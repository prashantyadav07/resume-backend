import { Router } from "express";
import { upload } from "../middlewares/multer.js"; // Import the upload middleware
import {
  uploadAndExtractPdf,
  getAllPdfDocuments,
  getPdfDocumentById,
  searchPdfText,
  deletePdfDocument
} from "../controllers/pdfController.js";

const router = Router();

// Use upload middleware before the controller function
router.post("/upload", upload.single('pdf'), uploadAndExtractPdf);
router.get("/", getAllPdfDocuments);
router.get("/search", searchPdfText);
router.get("/:id", getPdfDocumentById);
router.delete("/:id", deletePdfDocument); // New delete route

export default router;