/* ============================================================
   /movies — danh sách, chi tiết, CRUD (admin), poster, reviews
   Trả về ĐÚNG shape mà frontend data.js đang dùng để B5 thay
   localStorage bằng API với thay đổi tối thiểu.
   ============================================================ */
const router = require("express").Router();
const path = require("path");
const fs = require("fs");
const os = require("os");
const multer = require("multer");
const { pool } = require("../db");
const { asyncHandler, ApiError } = require("../utils/http");
const { requireAuth, requireRole, optionalAuth } = require("../middleware/auth");
const { mid, rvid, parseId } = require("../utils/ids");

const SEP = "||";
const split = (s) => (s ? s.split(SEP) : []);

// Vercel chỉ cho phép ghi tạm trong /tmp; local vẫn dùng thư mục uploads của dự án.
const UPLOAD_DIR = process.env.VERCEL
  ? path.join(os.tmpdir(), "cineverse-uploads")
  : path.join(__dirname, "..", "..", "uploads");
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });
const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, UPLOAD_DIR),
    filename: (req, file, cb) =>
      cb(null, "poster_" + Date.now() + path.extname(file.originalname || ".png")),
  }),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) =>
    cb(null, /image\/(jpe?g|png|webp)/.test(file.mimetype)),
});

// ─── SELECT phim kèm genres/cast/formats gộp chuỗi ───
const MOVIE_SELECT = `
  SELECT m.*,
    (SELECT GROUP_CONCAT(g.name ORDER BY g.name SEPARATOR '${SEP}')
       FROM movie_genres mg JOIN genres g ON g.genre_id = mg.genre_id
      WHERE mg.movie_id = m.movie_id) AS genres,
    (SELECT GROUP_CONCAT(a.full_name SEPARATOR '${SEP}')
       FROM movie_actors ma JOIN actors a ON a.actor_id = ma.actor_id
      WHERE ma.movie_id = m.movie_id) AS cast_list,
    (SELECT GROUP_CONCAT(f.code SEPARATOR '${SEP}')
       FROM movie_formats mf JOIN formats f ON f.format_id = mf.format_id
      WHERE mf.movie_id = m.movie_id) AS formats
  FROM movies m`;

function mapMovie(r) {
  return {
    id: mid(r.movie_id),
    title: r.title,
    titleEn: r.title_en,
    genres: split(r.genres),
    duration: r.duration_min,
    age: r.age_rating,
    score: Number(r.imdb_score),
    votes: r.votes,
    director: r.director,
    cast: split(r.cast_list),
    country: r.country,
    formats: split(r.formats),
    status: r.status,
    release: r.release_date,
    synopsis: r.synopsis,
    poster: r.poster_url,
    trailer: r.trailer_key,
    theme: [r.theme_dark, r.theme_light],
    accent: r.accent_color,
  };
}

// GET /movies — list (lọc status/genre/q, phân trang)
router.get(
  "/",
  asyncHandler(async (req, res) => {
    const { status, genre, q } = req.query;
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 100));
    const where = [];
    const params = [];
    if (status && status !== "all") {
      where.push("m.status = ?");
      params.push(status);
    }
    if (q) {
      where.push("(m.title LIKE ? OR m.title_en LIKE ?)");
      params.push(`%${q}%`, `%${q}%`);
    }
    if (genre) {
      where.push(
        `EXISTS (SELECT 1 FROM movie_genres mg JOIN genres g ON g.genre_id=mg.genre_id
                  WHERE mg.movie_id=m.movie_id AND g.name = ?)`
      );
      params.push(genre);
    }
    const whereSql = where.length ? "WHERE " + where.join(" AND ") : "";

    const [cnt] = await pool.query(`SELECT COUNT(*) AS n FROM movies m ${whereSql}`, params);
    const total = cnt[0].n;
    const [rows] = await pool.query(
      `${MOVIE_SELECT} ${whereSql} ORDER BY m.movie_id LIMIT ? OFFSET ?`,
      [...params, limit, (page - 1) * limit]
    );
    res.json({ data: rows.map(mapMovie), total, page, limit });
  })
);

// GET /movies/:id — chi tiết + thống kê review
router.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const movieId = parseId(req.params.id, "m");
    if (!movieId) throw new ApiError(400, "BAD_ID");
    const [rows] = await pool.query(`${MOVIE_SELECT} WHERE m.movie_id = ?`, [movieId]);
    if (!rows.length) throw new ApiError(404, "NOT_FOUND", "Không tìm thấy phim");
    const [agg] = await pool.query(
      "SELECT COUNT(*) AS n, AVG(rating) AS avg FROM reviews WHERE movie_id = ?",
      [movieId]
    );
    res.json({
      ...mapMovie(rows[0]),
      reviewCount: agg[0].n,
      avgScore: agg[0].avg ? Number(Number(agg[0].avg).toFixed(1)) : 0,
    });
  })
);

// ─── Reviews ───
function mapReview(r) {
  return {
    id: rvid(r.review_id),
    movieId: mid(r.movie_id),
    user: r.reviewer_name,
    avatar: r.avatar_color,
    rating: r.rating,
    date: r.created_date,
    text: r.review_text,
    verified: !!r.is_verified,
  };
}

// GET /movies/:id/reviews?sort=newest|highest|lowest
router.get(
  "/:id/reviews",
  asyncHandler(async (req, res) => {
    const movieId = parseId(req.params.id, "m");
    if (!movieId) throw new ApiError(400, "BAD_ID");
    const order =
      { highest: "rating DESC", lowest: "rating ASC" }[req.query.sort] ||
      "created_date DESC, review_id DESC";
    const [rows] = await pool.query(
      `SELECT * FROM reviews WHERE movie_id = ? ORDER BY ${order}`,
      [movieId]
    );
    res.json({ data: rows.map(mapReview) });
  })
);

// POST /movies/:id/reviews — chỉ khách đã mua vé phim này (verified) mới được
router.post(
  "/:id/reviews",
  requireAuth,
  asyncHandler(async (req, res) => {
    const movieId = parseId(req.params.id, "m");
    if (!movieId) throw new ApiError(400, "BAD_ID");
    if (req.user.kind !== "customer")
      throw new ApiError(403, "FORBIDDEN", "Chỉ khách hàng được đánh giá");
    const { rating, text } = req.body || {};
    if (!rating || rating < 1 || rating > 5)
      throw new ApiError(400, "VALIDATION", "rating 1..5");

    // đã mua vé phim này chưa?
    const [bought] = await pool.query(
      `SELECT 1 FROM bookings b JOIN showtimes s ON s.showtime_id=b.showtime_id
        WHERE b.customer_id = ? AND s.movie_id = ? AND b.status='confirmed' LIMIT 1`,
      [req.user.id, movieId]
    );
    const verified = bought.length ? 1 : 0;
    if (!verified)
      throw new ApiError(403, "NOT_PURCHASED", "Cần mua vé phim này trước khi đánh giá");

    const [c] = await pool.query(
      "SELECT full_name, avatar_color FROM customers WHERE customer_id = ?",
      [req.user.id]
    );
    const [r] = await pool.query(
      `INSERT INTO reviews (movie_id, customer_id, reviewer_name, avatar_color, rating, review_text, is_verified, created_date)
       VALUES (?, ?, ?, ?, ?, ?, 1, CURDATE())`,
      [movieId, req.user.id, c[0].full_name, c[0].avatar_color, rating, text || null]
    );
    const [row] = await pool.query("SELECT * FROM reviews WHERE review_id = ?", [r.insertId]);
    res.status(201).json(mapReview(row[0]));
  })
);

// ─── CRUD admin ───
// POST /movies — thêm phim
router.post(
  "/",
  requireAuth,
  requireRole("admin", "manager"),
  asyncHandler(async (req, res) => {
    const b = req.body || {};
    if (!b.title || !b.duration) throw new ApiError(400, "VALIDATION", "Thiếu title/duration");
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();
      const [r] = await conn.query(
        `INSERT INTO movies (title, title_en, duration_min, age_rating, imdb_score, votes,
            director, country, status, release_date, synopsis, poster_url, trailer_key,
            theme_dark, theme_light, accent_color)
         VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
        [
          b.title, b.titleEn || null, b.duration, b.age || b.ageRating || null,
          b.score || 0, b.votes || 0, b.director || null, b.country || null,
          b.status || "coming", b.release || b.releaseDate || null, b.synopsis || null,
          b.poster || null, b.trailer || null,
          (b.theme && b.theme[0]) || null, (b.theme && b.theme[1]) || null, b.accent || null,
        ]
      );
      await linkMovieRelations(conn, r.insertId, b);
      await conn.commit();
      const [rows] = await pool.query(`${MOVIE_SELECT} WHERE m.movie_id = ?`, [r.insertId]);
      res.status(201).json(mapMovie(rows[0]));
    } catch (e) {
      await conn.rollback();
      throw e;
    } finally {
      conn.release();
    }
  })
);

// PUT /movies/:id — cập nhật
router.put(
  "/:id",
  requireAuth,
  requireRole("admin", "manager"),
  asyncHandler(async (req, res) => {
    const movieId = parseId(req.params.id, "m");
    if (!movieId) throw new ApiError(400, "BAD_ID");
    const b = req.body || {};
    const fields = {
      title: b.title, title_en: b.titleEn, duration_min: b.duration,
      age_rating: b.age ?? b.ageRating, imdb_score: b.score, votes: b.votes,
      director: b.director, country: b.country, status: b.status,
      release_date: b.release ?? b.releaseDate, synopsis: b.synopsis,
      poster_url: b.poster, trailer_key: b.trailer,
      theme_dark: b.theme && b.theme[0], theme_light: b.theme && b.theme[1],
      accent_color: b.accent,
    };
    const sets = [], params = [];
    for (const [k, v] of Object.entries(fields)) {
      if (v !== undefined) {
        sets.push(`${k} = ?`);
        params.push(v);
      }
    }
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();
      if (sets.length) {
        await conn.query(`UPDATE movies SET ${sets.join(", ")} WHERE movie_id = ?`, [
          ...params, movieId,
        ]);
      }
      await linkMovieRelations(conn, movieId, b, true);
      await conn.commit();
      const [rows] = await pool.query(`${MOVIE_SELECT} WHERE m.movie_id = ?`, [movieId]);
      if (!rows.length) throw new ApiError(404, "NOT_FOUND");
      res.json(mapMovie(rows[0]));
    } catch (e) {
      await conn.rollback();
      throw e;
    } finally {
      conn.release();
    }
  })
);

// POST /movies/:id/poster — upload ảnh
router.post(
  "/:id/poster",
  requireAuth,
  requireRole("admin", "manager"),
  upload.single("poster"),
  asyncHandler(async (req, res) => {
    const movieId = parseId(req.params.id, "m");
    if (!movieId) throw new ApiError(400, "BAD_ID");
    if (!req.file) throw new ApiError(400, "NO_FILE", "Thiếu file ảnh");
    const posterUrl = "uploads/" + req.file.filename;
    await pool.query("UPDATE movies SET poster_url = ? WHERE movie_id = ?", [posterUrl, movieId]);
    res.json({ posterUrl });
  })
);

// DELETE /movies/:id — xoá phim (chặn nếu còn suất chiếu; cascade gỡ genres/cast/formats/reviews)
router.delete(
  "/:id",
  requireAuth,
  requireRole("admin", "manager"),
  asyncHandler(async (req, res) => {
    const movieId = parseId(req.params.id, "m");
    if (!movieId) throw new ApiError(400, "BAD_ID");
    const [st] = await pool.query(
      "SELECT COUNT(*) AS n FROM showtimes WHERE movie_id = ?",
      [movieId]
    );
    if (st[0].n > 0)
      return res.status(409).json({ error: "HAS_SHOWTIMES", count: st[0].n,
        message: "Phim đang có suất chiếu — cần xoá/đổi các suất chiếu trước." });
    const [r] = await pool.query("DELETE FROM movies WHERE movie_id = ?", [movieId]);
    if (!r.affectedRows) throw new ApiError(404, "NOT_FOUND");
    res.json({ deleted: true });
  })
);

// Gắn M:N genres / actors / formats. replace=true thì xoá cũ trước.
async function linkMovieRelations(conn, movieId, b, replace = false) {
  if (Array.isArray(b.genres)) {
    if (replace) await conn.query("DELETE FROM movie_genres WHERE movie_id = ?", [movieId]);
    for (const name of b.genres) {
      await conn.query("INSERT IGNORE INTO genres (name) VALUES (?)", [name]);
      const [g] = await conn.query("SELECT genre_id FROM genres WHERE name = ?", [name]);
      await conn.query(
        "INSERT IGNORE INTO movie_genres (movie_id, genre_id) VALUES (?, ?)",
        [movieId, g[0].genre_id]
      );
    }
  }
  if (Array.isArray(b.cast)) {
    if (replace) await conn.query("DELETE FROM movie_actors WHERE movie_id = ?", [movieId]);
    for (const name of b.cast) {
      await conn.query("INSERT IGNORE INTO actors (full_name) VALUES (?)", [name]);
      const [a] = await conn.query("SELECT actor_id FROM actors WHERE full_name = ?", [name]);
      await conn.query(
        "INSERT IGNORE INTO movie_actors (movie_id, actor_id) VALUES (?, ?)",
        [movieId, a[0].actor_id]
      );
    }
  }
  if (Array.isArray(b.formats)) {
    if (replace) await conn.query("DELETE FROM movie_formats WHERE movie_id = ?", [movieId]);
    for (const code of b.formats) {
      const [f] = await conn.query("SELECT format_id FROM formats WHERE code = ?", [code]);
      if (f.length)
        await conn.query(
          "INSERT IGNORE INTO movie_formats (movie_id, format_id) VALUES (?, ?)",
          [movieId, f[0].format_id]
        );
    }
  }
}

module.exports = router;
