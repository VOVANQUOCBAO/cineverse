/* ============================================================
   Danh mục tra cứu: rạp, phòng, bắp nước, thể loại, hạng thành viên
   ============================================================ */
const router = require("express").Router();
const { pool } = require("../db");
const { asyncHandler } = require("../utils/http");
const { cid, rid } = require("../utils/ids");

// GET /cinemas
router.get(
  "/cinemas",
  asyncHandler(async (req, res) => {
    const [rows] = await pool.query("SELECT * FROM cinemas ORDER BY cinema_id");
    res.json({
      data: rows.map((c) => ({
        id: cid(c.cinema_id),
        name: c.name,
        city: c.city,
        address: c.address,
      })),
    });
  })
);

// GET /rooms
router.get(
  "/rooms",
  asyncHandler(async (req, res) => {
    const [rows] = await pool.query("SELECT * FROM rooms ORDER BY room_id");
    res.json({
      data: rows.map((r) => ({
        id: rid(r.room_id),
        cinemaId: cid(r.cinema_id),
        name: r.name,
        type: r.room_type,
      })),
    });
  })
);

// GET /concessions
router.get(
  "/concessions",
  asyncHandler(async (req, res) => {
    const [rows] = await pool.query(
      "SELECT * FROM concessions WHERE is_active = 1 ORDER BY concession_id"
    );
    res.json({
      data: rows.map((c) => ({
        id: c.concession_id,
        name: c.name,
        category: c.category,
        price: Number(c.price),
        image: c.image_url,
      })),
    });
  })
);

// GET /reviews — toàn bộ đánh giá (frontend CINE.reviews là list phẳng)
router.get(
  "/reviews",
  asyncHandler(async (req, res) => {
    const [rows] = await pool.query(
      "SELECT * FROM reviews ORDER BY created_date DESC, review_id DESC"
    );
    res.json({
      data: rows.map((r) => ({
        id: "rv" + r.review_id,
        movieId: "m" + r.movie_id,
        user: r.reviewer_name,
        avatar: r.avatar_color,
        rating: r.rating,
        date: r.created_date,
        text: r.review_text,
        verified: !!r.is_verified,
      })),
    });
  })
);

// GET /genres
router.get(
  "/genres",
  asyncHandler(async (req, res) => {
    const [rows] = await pool.query("SELECT name FROM genres ORDER BY name");
    res.json({ data: rows.map((r) => r.name) });
  })
);

// GET /tiers
router.get(
  "/tiers",
  asyncHandler(async (req, res) => {
    const [rows] = await pool.query("SELECT * FROM membership_tiers ORDER BY min_points");
    res.json({
      data: rows.map((t) => ({
        code: t.code,
        name: t.name,
        minPoints: t.min_points,
        discount: Number(t.discount_rate),
      })),
    });
  })
);

module.exports = router;
