// Vercel serverless entry point.
// Vercel doesn't run a long-lived server via app.listen(); instead it calls
// this file as a function for each incoming request. Exporting the Express
// app directly (no .listen()) lets @vercel/node handle that for us.
// This file lives in backend/api/index.js — Vercel auto-detects anything
// in an "api" folder at the project root as a serverless function.

import app from "../src/app.js";

export default app;