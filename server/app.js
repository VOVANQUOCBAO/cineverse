/* ============================================================
   CINEVERSE — Express app
   Mount toàn bộ REST API dưới tiền tố /api, đồng thời (tuỳ chọn)
   phục vụ luôn frontend tĩnh trong D:\web để chạy 1 cổng duy nhất.
   ============================================================ */
const path = require("path");
const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
require("dotenv").config();

const app = express();
app.use((req, res, next) => {
  res.setHeader("Cross-Origin-Opener-Policy", "same-origin-allow-popups");
  res.setHeader("Referrer-Policy", "no-referrer-when-downgrade");
  next();
});
app.use(cors());
app.use(express.json({ limit: "2mb" }));
app.use(morgan("dev"));

// ─── REST API ───
app.get("/api/health", (req, res) => res.json({ ok: true, name: "CINEVERSE API", ts: Date.now() }));
app.use("/api/auth", require("./routes/auth"));
app.use("/api/movies", require("./routes/movies"));
app.use("/api/showtimes", require("./routes/showtimes"));
app.use("/api/bookings", require("./routes/bookings"));
app.use("/api/users", require("./routes/users"));
app.use("/api/reports", require("./routes/reports"));
app.use("/api/staff", require("./routes/staff"));
app.use("/api", require("./routes/lookups")); // /api/cinemas, /api/rooms, ...

// ─── Phục vụ frontend tĩnh (thay cho dev-server.js) ───
if (process.env.SERVE_FRONTEND === "true" || process.env.VERCEL) {
  const ROOT = path.join(__dirname, "..");
  app.use(
    express.static(ROOT, {
      index: "CINEFILM.html",
      setHeaders(res, filePath) {
        // Babel-in-browser tải .jsx -> ép kiểu JS cho chắc
        if (filePath.endsWith(".jsx")) res.setHeader("Content-Type", "text/javascript; charset=utf-8");
      },
    })
  );
}

// ─── 404 cho /api ───
app.use("/api", (req, res) => res.status(404).json({ error: "NOT_FOUND", path: req.path }));

// ─── Error handler tập trung ───
app.use((err, req, res, next) => {
  const status = err.status || 500;
  if (status >= 500) console.error(err);
  res.status(status).json({
    error: err.code || "INTERNAL",
    message: err.message || "Lỗi máy chủ",
  });
});

module.exports = app;
