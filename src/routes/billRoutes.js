import express from "express";

import { createBill, getBills } from "../controllers/billController.js";
import { verifyToken } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(verifyToken);

router.post("/", createBill);
router.get("/", getBills);

export default router;