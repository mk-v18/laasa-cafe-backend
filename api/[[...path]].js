// Vercel catch-all function. The filename [[...path]].js (double brackets =
// "optional catch-all") means this single function handles every request
// under /api/ -- /api, /api/items, /api/categories/anything/nested, etc.
// No custom rewrite is needed for these paths; Vercel routes them here
// automatically based on the filename alone.

import app from "../src/app.js";

export default app;