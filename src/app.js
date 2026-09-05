import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";

import { db } from "./config/firebase.js";
import { verifyToken } from "./middleware/authMiddleware.js";

import categoryRoutes from "./routes/categoryRoutes.js";
import itemRoutes from "./routes/itemRoutes.js";
import saleRoutes from "./routes/saleRoutes.js";
import billRoutes from "./routes/billRoutes.js";

const app = express();

// ===============================
// MIDDLEWARE
// ===============================

// Secure HTTP headers
app.use(helmet());

// Restrict CORS to known frontend origin(s) only.
// Set FRONTEND_URL in your .env (e.g. https://laasacafe.com).
// ALLOWED_ORIGINS can hold a comma-separated list if you have more than one
// (e.g. a staging URL alongside production).
const allowedOrigins = (
  process.env.ALLOWED_ORIGINS ||
  process.env.FRONTEND_URL ||
  "http://localhost:5173"
)
  .split(",")
  .map((origin) => origin.trim());

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow non-browser requests (curl, server-to-server, health checks)
      // that don't send an Origin header at all.
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error("Not allowed by CORS"));
    },
  })
);

app.use(express.json());

// General rate limit: applies to every /api/* route.
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300, // requests per IP per window
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many requests, please try again later.",
  },
});

app.use("/api", apiLimiter);

// Stricter limit for the auth-check/admin endpoints, since these are the
// ones most worth slowing down against brute-force / token-guessing.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // requests per IP per window
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many authentication attempts, please try again later.",
  },
});

// ===============================
// API ROUTES
// ===============================

app.use("/api/categories", categoryRoutes);
app.use("/api/items", itemRoutes);
app.use("/api/sales", saleRoutes);
app.use("/api/bills", billRoutes);

// ===============================
// HOME
// ===============================

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Cafe backend is running",
  });
});

// ===============================
// FIREBASE TEST
// ===============================

app.get("/api/test-firebase", async (req, res) => {
  try {
    await db.collection("test").limit(1).get();

    res.json({
      success: true,
      message: "Firebase connection successful",
    });
  } catch (error) {
    console.error("Firebase test error:", error);

    res.status(500).json({
      success: false,
      message: "Firebase connection failed",
      error: error.message,
    });
  }
});

// ===============================
// ADMIN AUTH TEST
// ===============================

app.get("/api/admin/test", authLimiter, verifyToken, (req, res) => {
  res.json({
    success: true,
    message: "Admin authentication successful",

    user: {
      uid: req.user.uid,
      email: req.user.email,
    },
  });
});

export default app;