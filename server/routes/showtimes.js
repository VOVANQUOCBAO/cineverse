/* ============================================================
   /showtimes — lịch chiếu + sơ đồ ghế + giữ ghế tạm
   ============================================================ */
const router = require("express").Router();
const { pool } = require("../db");
const { asyncHandler, ApiError } = require("../utils/http");
const { requireAuth, requireRole } = require("../middleware/auth");
const { mid, cid, rid, sid, parseId } = require("../utils/ids");
const holds = require("../utils/holds");

const BUFFER_MIN = 15; // thời gian nghỉ tối thiểu giữa 2 suất cùng phòng (vệ sinh/chuẩn bị)

// Chuyển "HH:MM[:SS]" -> số phút trong ngày
function toMin(t) {
  const [h, m] = String(t).split(":");
  return Number(h) * 60 + Number(m);
}

// Kiểm tra suất mới có đè lên suất nào trong cùng phòng + ngày không.
// Mỗi suất chiếm [start, start + duration + BUFFER). excludeId: bỏ qua khi sửa.
async function findConflict(roomId, date, startMin, durationMin, excludeId) {
  const [rows] = await pool.query(
    `SELECT st.showtime_id, st.show_time, m.duration_min, m.title
       FROM showtimes st JOIN movies m ON m.movie_id = st.movie_id
      WHERE st.room_id = ? AND st.show_date = ?` +
      (excludeId ? " AND st.showtime_id <> ?" : ""),
    excludeId ? [roomId, date, excludeId] : [roomId, date]
  );
  const newEnd = startMin + durationMin + BUFFER_MIN;
  for (const r of rows) {
    const s = toMin(r.show_time);
    const e = s + r.duration_min + BUFFER_MIN;
    if (startMin < e && s < newEnd)
      return { showtimeId: sid(r.showtime_id), title: r.title, time: String(r.show_time).slice(0, 5) };
  }
  return null;
}

// Lấy duration phim + format_id từ code
async function resolveRefs(movieId, formatCode) {
  const [m] = await pool.query("SELECT duration_min FROM movies WHERE movie_id = ?", [movieId]);
  if (!m.length) throw new ApiError(404, "MOVIE_NOT_FOUND", "Không có phim");
  const [f] = await pool.query("SELECT format_id FROM formats WHERE code = ?", [formatCode || "2D"]);
  if (!f.length) throw new ApiError(400, "BAD_FORMAT", "Định dạng không hợp lệ");
  return { duration: m[0].duration_min, formatId: f[0].format_id };
}

const PRICE = { regular: 75000, vip: 110000, couple: 220000 };

// SELECT suất chiếu kèm rạp/phòng + đếm ghế đã bán / tổng ghế
const ST_SELECT = `
  SELECT st.showtime_id, st.movie_id, st.room_id, st.show_date, st.show_time,
         f.code AS format, r.cinema_id,
         (SELECT COUNT(*) FROM seats s WHERE s.room_id = st.room_id) AS total_seats,
         (SELECT COUNT(*) FROM booking_seats bs
            JOIN bookings b ON b.booking_id = bs.booking_id
           WHERE bs.showtime_id = st.showtime_id
             AND b.status IN ('pending','confirmed')) AS sold_seats
    FROM showtimes st
    JOIN rooms r   ON r.room_id  = st.room_id
    JOIN formats f ON f.format_id = st.format_id`;

function mapShowtime(r) {
  return {
    id: sid(r.showtime_id),
    movieId: mid(r.movie_id),
    cinemaId: cid(r.cinema_id),
    roomId: rid(r.room_id),
    date: r.show_date,
    time: String(r.show_time).slice(0, 5),
    format: r.format,
    price: PRICE,
    totalSeats: r.total_seats,
    availableSeats: r.total_seats - r.sold_seats,
  };
}

// GET /showtimes?movieId=&cinemaId=&date=&format=
router.get(
  "/",
  asyncHandler(async (req, res) => {
    const where = [], params = [];
    const movieId = req.query.movieId && parseId(req.query.movieId, "m");
    const cinemaId = req.query.cinemaId && parseId(req.query.cinemaId, "c");
    if (movieId) { where.push("st.movie_id = ?"); params.push(movieId); }
    if (cinemaId) { where.push("r.cinema_id = ?"); params.push(cinemaId); }
    if (req.query.date) { where.push("st.show_date = ?"); params.push(req.query.date); }
    if (req.query.format) { where.push("f.code = ?"); params.push(req.query.format); }
    const whereSql = where.length ? "WHERE " + where.join(" AND ") : "";
    const [rows] = await pool.query(
      `${ST_SELECT} ${whereSql} ORDER BY st.show_date, st.show_time`,
      params
    );
    res.json({ data: rows.map(mapShowtime) });
  })
);

// GET /showtimes/:id/seats — sơ đồ ghế (available | booked | held)
router.get(
  "/:id/seats",
  asyncHandler(async (req, res) => {
    const stId = parseId(req.params.id, "st");
    if (!stId) throw new ApiError(400, "BAD_ID");

    const [st] = await pool.query("SELECT room_id FROM showtimes WHERE showtime_id = ?", [stId]);
    if (!st.length) throw new ApiError(404, "NOT_FOUND", "Không có suất chiếu");

    // ghế vật lý của phòng + loại ghế
    const [seats] = await pool.query(
      `SELECT s.seat_id, s.seat_row, s.seat_col, s.seat_code, t.code AS type
         FROM seats s JOIN seat_types t ON t.seat_type_id = s.seat_type_id
        WHERE s.room_id = ? ORDER BY s.seat_row, s.seat_col`,
      [st[0].room_id]
    );
    // ghế đã đặt cho suất này
    const [booked] = await pool.query(
      `SELECT s.seat_code FROM booking_seats bs
         JOIN seats s ON s.seat_id = bs.seat_id
         JOIN bookings b ON b.booking_id = bs.booking_id
        WHERE bs.showtime_id = ? AND b.status IN ('pending','confirmed')`,
      [stId]
    );
    const bookedSet = new Set(booked.map((b) => b.seat_code));
    const heldSet = new Set(holds.heldByOthers(stId, req.query.userId || "_"));

    const byRow = new Map();
    for (const s of seats) {
      const status = bookedSet.has(s.seat_code)
        ? "booked"
        : heldSet.has(s.seat_code)
        ? "held"
        : "available";
      if (!byRow.has(s.seat_row))
        byRow.set(s.seat_row, { row: s.seat_row, isCouple: s.type === "couple", seats: [] });
      byRow.get(s.seat_row).seats.push({
        code: s.seat_code,
        row: s.seat_row,
        col: s.seat_col,
        type: s.type,
        status,
      });
    }
    res.json({ rows: [...byRow.values()] });
  })
);

// ─── CRUD lịch chiếu (admin / manager) ───
// POST /showtimes — tạo suất chiếu mới (kiểm tra trùng phòng + buffer)
router.post(
  "/",
  requireAuth,
  requireRole("admin", "manager"),
  asyncHandler(async (req, res) => {
    const b = req.body || {};
    const movieId = parseId(b.movieId, "m");
    const roomId = parseId(b.roomId, "r");
    if (!movieId || !roomId || !b.date || !b.time)
      throw new ApiError(400, "VALIDATION", "Thiếu movieId / roomId / date / time");
    const { duration, formatId } = await resolveRefs(movieId, b.format);
    const conflict = await findConflict(roomId, b.date, toMin(b.time), duration, null);
    if (conflict)
      return res.status(409).json({ error: "SHOWTIME_CONFLICT", conflict });
    try {
      const [r] = await pool.query(
        `INSERT INTO showtimes (movie_id, room_id, format_id, show_date, show_time)
         VALUES (?, ?, ?, ?, ?)`,
        [movieId, roomId, formatId, b.date, b.time]
      );
      const [rows] = await pool.query(`${ST_SELECT} WHERE st.showtime_id = ?`, [r.insertId]);
      res.status(201).json(mapShowtime(rows[0]));
    } catch (e) {
      if (e.code === "ER_DUP_ENTRY")
        return res.status(409).json({ error: "SHOWTIME_CONFLICT", message: "Phòng đã có suất đúng giờ này" });
      throw e;
    }
  })
);

// PUT /showtimes/:id — cập nhật suất chiếu
router.put(
  "/:id",
  requireAuth,
  requireRole("admin", "manager"),
  asyncHandler(async (req, res) => {
    const stId = parseId(req.params.id, "st");
    if (!stId) throw new ApiError(400, "BAD_ID");
    const [cur] = await pool.query("SELECT * FROM showtimes WHERE showtime_id = ?", [stId]);
    if (!cur.length) throw new ApiError(404, "NOT_FOUND", "Không có suất chiếu");
    const b = req.body || {};
    const movieId = b.movieId ? parseId(b.movieId, "m") : cur[0].movie_id;
    const roomId = b.roomId ? parseId(b.roomId, "r") : cur[0].room_id;
    const date = b.date || cur[0].show_date;
    const time = b.time || String(cur[0].show_time).slice(0, 5);
    const { duration, formatId } = await resolveRefs(
      movieId,
      b.format // nếu không truyền format giữ nguyên format cũ
    ).catch(async () => {
      const [m] = await pool.query("SELECT duration_min FROM movies WHERE movie_id = ?", [movieId]);
      return { duration: m[0].duration_min, formatId: cur[0].format_id };
    });
    const conflict = await findConflict(roomId, date, toMin(time), duration, stId);
    if (conflict) return res.status(409).json({ error: "SHOWTIME_CONFLICT", conflict });
    await pool.query(
      `UPDATE showtimes SET movie_id=?, room_id=?, format_id=?, show_date=?, show_time=?
        WHERE showtime_id=?`,
      [movieId, roomId, formatId, date, time, stId]
    );
    const [rows] = await pool.query(`${ST_SELECT} WHERE st.showtime_id = ?`, [stId]);
    res.json(mapShowtime(rows[0]));
  })
);

// DELETE /showtimes/:id — hủy suất (chặn nếu đã có vé confirmed)
router.delete(
  "/:id",
  requireAuth,
  requireRole("admin", "manager"),
  asyncHandler(async (req, res) => {
    const stId = parseId(req.params.id, "st");
    if (!stId) throw new ApiError(400, "BAD_ID");
    const [sold] = await pool.query(
      `SELECT COUNT(*) AS n FROM booking_seats bs
         JOIN bookings b ON b.booking_id = bs.booking_id
        WHERE bs.showtime_id = ? AND b.status IN ('pending','confirmed')`,
      [stId]
    );
    if (sold[0].n > 0)
      return res.status(409).json({ error: "HAS_BOOKINGS", count: sold[0].n,
        message: "Suất đã có vé đặt — cần hoàn tiền khách trước khi hủy" });
    const [r] = await pool.query("DELETE FROM showtimes WHERE showtime_id = ?", [stId]);
    if (!r.affectedRows) throw new ApiError(404, "NOT_FOUND");
    res.json({ deleted: true });
  })
);

// POST /showtimes/:id/hold-seats — giữ ghế 8 phút
router.post(
  "/:id/hold-seats",
  requireAuth,
  asyncHandler(async (req, res) => {
    const stId = parseId(req.params.id, "st");
    if (!stId) throw new ApiError(400, "BAD_ID");
    const seats = (req.body && req.body.seats) || [];
    if (!seats.length) throw new ApiError(400, "VALIDATION", "Thiếu danh sách ghế");

    // ghế đã bán không thể giữ
    const [booked] = await pool.query(
      `SELECT s.seat_code FROM booking_seats bs
         JOIN seats s ON s.seat_id = bs.seat_id
         JOIN bookings b ON b.booking_id = bs.booking_id
        WHERE bs.showtime_id = ? AND b.status IN ('pending','confirmed')
          AND s.seat_code IN (?)`,
      [stId, seats]
    );
    if (booked.length)
      return res.status(409).json({ error: "SEAT_TAKEN", seats: booked.map((b) => b.seat_code) });

    const r = holds.hold(stId, seats, req.user.id);
    if (!r.ok) return res.status(409).json({ error: "SEAT_TAKEN", seats: r.taken });
    res.json({ held: true, expiresAt: r.expiresAt });
  })
);

// POST /showtimes/:id/release-seats — giải phóng ghế đang giữ
router.post(
  "/:id/release-seats",
  requireAuth,
  asyncHandler(async (req, res) => {
    const stId = parseId(req.params.id, "st");
    if (!stId) throw new ApiError(400, "BAD_ID");
    const seats = (req.body && req.body.seats) || [];
    holds.release(stId, seats, req.user.id);
    res.json({ released: true });
  })
);

module.exports = router;
