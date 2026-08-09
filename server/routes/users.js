/* ============================================================
   /users — hồ sơ cá nhân, lịch sử đặt vé, CRM (admin)
   ============================================================ */
const router = require("express").Router();
const { pool } = require("../db");
const { asyncHandler, ApiError } = require("../utils/http");
const { requireAuth, requireRole } = require("../middleware/auth");
const { uid } = require("../utils/ids");

// GET /users/me — thông tin tài khoản hiện tại
router.get(
  "/me",
  requireAuth,
  asyncHandler(async (req, res) => {
    if (req.user.kind !== "customer")
      throw new ApiError(403, "FORBIDDEN", "Chỉ dành cho khách hàng");
    const [rows] = await pool.query(
      `SELECT c.*, t.name AS tier_name, t.code AS tier_code
         FROM customers c LEFT JOIN membership_tiers t ON t.tier_id = c.tier_id
        WHERE c.customer_id = ?`,
      [req.user.id]
    );
    if (!rows.length) throw new ApiError(404, "NOT_FOUND");
    const c = rows[0];
    const [cnt] = await pool.query(
      "SELECT COUNT(*) AS n FROM bookings WHERE customer_id = ? AND status='confirmed'",
      [req.user.id]
    );
    res.json({
      id: uid(c.customer_id),
      name: c.full_name,
      email: c.email,
      phone: c.phone,
      avatar: c.avatar_color,
      points: c.points,
      tier: c.tier_name,
      tierCode: c.tier_code,
      totalBookings: cnt[0].n,
    });
  })
);

// GET /users/me/bookings — lịch sử đặt vé
router.get(
  "/me/bookings",
  requireAuth,
  asyncHandler(async (req, res) => {
    if (req.user.kind !== "customer") throw new ApiError(403, "FORBIDDEN");
    const [rows] = await pool.query(
      `SELECT b.booking_id, b.booking_code, b.total_amount, b.status, b.payment_method,
              b.checked_in, b.created_at, b.showtime_id,
              m.movie_id, m.title, m.poster_url,
              s.show_date, s.show_time, f.code AS format,
              r.room_id, r.cinema_id, c.name AS cinema_name,
              (SELECT GROUP_CONCAT(CONCAT(s2.seat_code, ':', t.code) ORDER BY s2.seat_code SEPARATOR ',')
                 FROM booking_seats bs JOIN seats s2 ON s2.seat_id = bs.seat_id
                 JOIN seat_types t ON t.seat_type_id = s2.seat_type_id
                WHERE bs.booking_id = b.booking_id) AS seat_pairs
         FROM bookings b
         JOIN showtimes s ON s.showtime_id = b.showtime_id
         JOIN movies m    ON m.movie_id    = s.movie_id
         JOIN formats f   ON f.format_id   = s.format_id
         JOIN rooms r     ON r.room_id     = s.room_id
         JOIN cinemas c   ON c.cinema_id   = r.cinema_id
        WHERE b.customer_id = ?
        ORDER BY b.created_at DESC`,
      [req.user.id]
    );
    res.json({
      data: rows.map((b) => ({
        id: "b" + b.booking_id,
        code: b.booking_code,
        // shape khớp TicketCard: booking.showtime.{movieId,cinemaId,roomId,date,time,format}
        showtime: {
          id: "st" + b.showtime_id,
          movieId: "m" + b.movie_id,
          cinemaId: "c" + b.cinema_id,
          roomId: "r" + b.room_id,
          date: b.show_date,
          time: String(b.show_time).slice(0, 5),
          format: b.format,
        },
        movie: { id: "m" + b.movie_id, title: b.title, poster: b.poster_url },
        cinema: b.cinema_name,
        seats: (b.seat_pairs ? b.seat_pairs.split(",") : []).map((p) => {
          const [code, type] = p.split(":");
          return { code, type };
        }),
        total: Number(b.total_amount),
        grand: Number(b.total_amount),
        method: b.payment_method,
        status: b.status,
        isUsed: !!b.checked_in,
        createdAt: b.created_at,
      })),
    });
  })
);

// GET /users — danh sách khách hàng (CRM, admin)
router.get(
  "/",
  requireAuth,
  requireRole("admin", "manager"),
  asyncHandler(async (req, res) => {
    const { q, tier } = req.query;
    const where = [], params = [];
    if (q) {
      where.push("(c.full_name LIKE ? OR c.email LIKE ? OR c.phone LIKE ?)");
      params.push(`%${q}%`, `%${q}%`, `%${q}%`);
    }
    if (tier) { where.push("t.code = ?"); params.push(String(tier).toLowerCase()); }
    const whereSql = where.length ? "WHERE " + where.join(" AND ") : "";
    const [rows] = await pool.query(
      `SELECT c.customer_id, c.full_name, c.email, c.phone, c.points, c.joined_date,
              c.last_visit, c.avatar_color, t.name AS tier_name,
              (SELECT COUNT(*) FROM bookings b WHERE b.customer_id = c.customer_id
                 AND b.status='confirmed') AS bookings_count,
              (SELECT COALESCE(SUM(b.total_amount),0) FROM bookings b
                WHERE b.customer_id = c.customer_id AND b.status='confirmed') AS total_spent
         FROM customers c LEFT JOIN membership_tiers t ON t.tier_id = c.tier_id
         ${whereSql}
        ORDER BY total_spent DESC`,
      params
    );
    res.json({
      data: rows.map((c) => ({
        id: uid(c.customer_id),
        name: c.full_name,
        email: c.email,
        phone: c.phone,
        avatar: c.avatar_color,
        points: c.points,
        tier: c.tier_name,
        joinedDate: c.joined_date,
        lastVisit: c.last_visit,
        bookings: c.bookings_count,
        totalSpent: Number(c.total_spent),
      })),
    });
  })
);

module.exports = router;
