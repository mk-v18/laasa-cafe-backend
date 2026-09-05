import express from "express";

import {
  createSale,
  getSales,
  getSale,
} from "../controllers/saleController.js";

import { verifyToken } from "../middleware/authMiddleware.js";

const router = express.Router();

// Admin authentication for all sales routes
router.use(verifyToken);

// Create bill
router.post("/", createSale);

// Get all sales
router.get("/", getSales);

// Get single sale
router.get("/:id", getSale);

export default router;