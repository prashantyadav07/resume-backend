// --- START OF FILE routes/pdfRoute.js ---

import { Router } from "express";
import { upload } from "../middlewares/multer.js";
import { verifyFirebaseToken } from "../middlewares/auth.js";
import {
  uploadAndExtractPdf,
  getAllUserPdfDocuments,
  getPdfDocumentById,
  searchUserPdfText,
  deletePdfDocument
} from "../controllers/pdfController.js";

const router = Router();

// All PDF routes are protected and require a valid user
router.use(verifyFirebaseToken);

router.route("/upload").post(upload.single('pdf'), uploadAndExtractPdf);
router.route("/").get(getAllUserPdfDocuments);
router.route("/search").get(searchUserPdfText);
router.route("/:id").get(getPdfDocumentById).delete(deletePdfDocument);

export default router;