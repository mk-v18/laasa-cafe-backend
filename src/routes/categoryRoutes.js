import express from "express";

import {
  createCategory,
  getCategories,
  getCategory,
  updateCategory,
  deleteCategory,
} from "../controllers/categoryController.js";

import { verifyToken } from "../middleware/authMiddleware.js";

const router = express.Router();

// All category APIs require admin authentication
router.use(verifyToken);

// Create category
router.post("/", createCategory);

// Get all categories
router.get("/", getCategories);

// Get single category
router.get("/:id", getCategory);

// Update category
router.put("/:id", updateCategory);

// Delete category
router.delete("/:id", deleteCategory);

export default router;