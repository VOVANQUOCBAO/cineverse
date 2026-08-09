/* ============================================================
   /reports — báo cáo doanh thu & công suất (admin/manager)
   Dùng các VIEW v_revenue_daily / v_cinema_occupancy + truy vấn động.
   ============================================================ */
const router = require("express").Router();
const { pool } = require("../db");
const { asyncHandler } = require("../utils/http");
const { requireAuth, requireRole } = require("../middleware/auth");
const { cid } = require("../utils/ids");

router.use(requireAuth, requireRole("admin", "manager"));

// GET /reports/revenue?period=daily&from=&to=  |  ?period=monthly&year=
router.get(
  "/revenue",
  asyncHandler(async (req, res) => {
    const period = req.query.period === "monthly" ? "monthly" : "daily";
    if (period === "monthly") {
      const year = Number(req.query.year) || new Date().getFullYear();
      const [rows] = await pool.query(
        `SELECT DATE_FORMAT(s.show_date, '%Y-%m') AS month,
                COUNT(DISTINCT b.booking_id) AS tickets,
                COALESCE(SUM(b.total_amount),0) AS revenue
           FROM bookings b JOIN showtimes s ON s.showtime_id = b.showtime_id
          WHERE b.status='confirmed' AND YEAR(s.show_date) = ?
          GROUP BY month ORDER BY month`,
        [year]
      );
      return res.json({
        period,
        year,
        data: rows.map((r) => ({ month: r.month, revenue: Number(r.revenue), tickets: r.tickets })),
      });
    }
    const from = req.query.from || "2000-01-01";
    const to = req.query.to || "2999-12-31";
    const [rows] = await pool.query(
      `SELECT s.show_date AS date,
              COUNT(DISTINCT b.booking_id) AS tickets,
              COALESCE(SUM(b.total_amount),0) AS revenue
         FROM bookings b JOIN showtimes s ON s.showtime_id = b.showtime_id
        WHERE b.status='confirmed' AND s.show_date BETWEEN ? AND ?
        GROUP BY s.show_date ORDER BY s.show_date`,
      [from, to]
    );
    res.json({
      period,
      data: rows.map((r) => ({ date: r.date, revenue: Number(r.revenue), tickets: r.tickets })),
    });
  })
);

// GET /reports/occupancy — tỷ lệ lấp đầy theo rạp
router.get(
  "/occupancy",
  asyncHandler(async (req, res) => {
    const [rows] = await pool.query(
      `SELECT c.cinema_id, c.name,
              (SELECT COUNT(*) FROM seats s JOIN rooms r2 ON r2.room_id = s.room_id
                WHERE r2.cinema_id = c.cinema_id) AS total_seats_phys,
              (SELECT COUNT(*) FROM booking_seats bs
                 JOIN bookings b ON b.booking_id = bs.booking_id
                 JOIN showtimes st ON st.showtime_id = bs.showtime_id
                 JOIN rooms r3 ON r3.room_id = st.room_id
                WHERE r3.cinema_id = c.cinema_id AND b.status='confirmed') AS seats_sold,
              (SELECT COUNT(*) FROM showtimes st2 JOIN rooms r4 ON r4.room_id = st2.room_id
                WHERE r4.cinema_id = c.cinema_id) AS show_count
         FROM cinemas c ORDER BY c.cinema_id`
    );
    res.json({
      cinemas: rows.map((c) => {
        // tổng sức chứa = ghế vật lý * số suất chiếu
        const capacity = c.total_seats_phys * c.show_count || 1;
        return {
          cinemaId: cid(c.cinema_id),
          name: c.name,
          seatsSold: c.seats_sold,
          rate: Number((c.seats_sold / capacity).toFixed(3)),
        };
      }),
    });
  })
);

// GET /reports/top-movies — top phim theo vé bán (dùng VIEW)
router.get(
  "/top-movies",
  asyncHandler(async (req, res) => {
    const limit = Math.min(50, Number(req.query.limit) || 10);
    const [rows] = await pool.query(
      "SELECT * FROM v_top_movies LIMIT ?",
      [limit]
    );
    res.json({
      data: rows.map((r) => ({
        movieId: "m" + r.movie_id,
        title: r.title,
        seatsSold: r.seats_sold,
        revenue: Number(r.revenue),
      })),
    });
  })
);

module.exports = router;
