import express from "express";

import {
  createItem,
  getItems,
  getItem,
  updateItem,
  deleteItem,
} from "../controllers/itemController.js";

import { verifyToken } from "../middleware/authMiddleware.js";
import upload from "../middleware/uploadMiddleware.js";

const router = express.Router();

router.use(verifyToken);

router.post("/", upload.single("image"), createItem);

router.get("/", getItems);

router.get("/:id", getItem);

router.put("/:id", upload.single("image"), updateItem);

router.delete("/:id", deleteItem);

export default router;