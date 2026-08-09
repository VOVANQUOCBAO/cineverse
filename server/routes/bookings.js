/* ============================================================
   /bookings — đặt vé, tra cứu theo mã, soát vé, hoàn tiền
   Lưu ý đồ án: không có cổng thanh toán thật -> mô phỏng
   thành công ngay (status = 'confirmed'). Chống đặt trùng ghế
   dựa vào ràng buộc UNIQUE(showtime_id, seat_id) của DB.
   ============================================================ */
const router = require("express").Router();
const { pool } = require("../db");
const { asyncHandler, ApiError } = require("../utils/http");
const { requireAuth, requireRole, optionalAuth } = require("../middleware/auth");
const { parseId } = require("../utils/ids");
const holds = require("../utils/holds");
const { computeDiscount } = require("../utils/promo");

// Sinh mã vé kiểu AB1234
function genCode() {
  const L = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  return (
    L[Math.floor(Math.random() * L.length)] +
    L[Math.floor(Math.random() * L.length)] +
    String(Math.floor(1000 + Math.random() * 9000))
  );
}

// POST /bookings — tạo đơn đặt vé
router.post(
  "/",
  requireAuth,
  asyncHandler(async (req, res) => {
    if (req.user.kind !== "customer")
      throw new ApiError(403, "FORBIDDEN", "Chỉ khách hàng được đặt vé");
    const { showtimeId, seats, paymentMethod, concessions, promoCode } = req.body || {};
    const stId = parseId(showtimeId, "st");
    if (!stId || !Array.isArray(seats) || !seats.length)
      throw new ApiError(400, "VALIDATION", "Thiếu showtimeId hoặc danh sách ghế");
    const method = ["momo", "vnpay", "atm", "visa", "cash"].includes(paymentMethod)
      ? paymentMethod
      : "momo";

    // suất chiếu + phòng
    const [st] = await pool.query("SELECT * FROM showtimes WHERE showtime_id = ?", [stId]);
    if (!st.length) throw new ApiError(404, "NOT_FOUND", "Không có suất chiếu");
    const roomId = st[0].room_id;

    // map seat code -> seat_id + đơn giá theo loại ghế
    const codes = seats.map((s) => (typeof s === "string" ? s : s.code));
    const [seatRows] = await pool.query(
      `SELECT s.seat_id, s.seat_code, t.default_price
         FROM seats s JOIN seat_types t ON t.seat_type_id = s.seat_type_id
        WHERE s.room_id = ? AND s.seat_code IN (?)`,
      [roomId, codes]
    );
    if (seatRows.length !== codes.length)
      throw new ApiError(400, "BAD_SEATS", "Một số ghế không tồn tại trong phòng này");
    const total = seatRows.reduce((sum, s) => sum + Number(s.default_price), 0);

    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      // sinh mã vé không trùng
      let code, ok = false;
      for (let i = 0; i < 5 && !ok; i++) {
        code = genCode();
        const [dup] = await conn.query(
          "SELECT 1 FROM bookings WHERE booking_code = ?",
          [code]
        );
        if (!dup.length) ok = true;
      }

      // tính tiền bắp nước (nếu có)
      let concTotal = 0;
      const concRows = [];
      if (Array.isArray(concessions) && concessions.length) {
        for (const c of concessions) {
          const cId = parseId(c.id ?? c.concessionId, null);
          const qty = Math.max(1, Number(c.qty ?? c.quantity) || 1);
          if (!cId) continue;
          const [cr] = await conn.query(
            "SELECT price FROM concessions WHERE concession_id = ? AND is_active = 1",
            [cId]
          );
          if (cr.length) {
            concTotal += Number(cr[0].price) * qty;
            concRows.push({ cId, qty, price: Number(cr[0].price) });
          }
        }
      }

      // ƯU ĐÃI: giảm giá chỉ áp lên tiền vé (không áp lên bắp nước)
      const promo = computeDiscount({
        ticketSubtotal: total,
        seatPrices: seatRows.map((s) => Number(s.default_price)),
        date: st[0].show_date,
        time: st[0].show_time,
        code: promoCode,
      });
      if (promo.error) {
        await conn.rollback();
        throw new ApiError(400, "PROMO_INVALID", promo.error);
      }
      const discount = promo.discount || 0;
      const grand = total - discount + concTotal;
      const [bk] = await conn.query(
        `INSERT INTO bookings (booking_code, showtime_id, customer_id, total_amount, payment_method, status)
         VALUES (?, ?, ?, ?, ?, 'confirmed')`,
        [code, stId, req.user.id, grand, method]
      );
      const bookingId = bk.insertId;

      // chèn ghế — UNIQUE(showtime_id, seat_id) sẽ chặn đặt trùng
      try {
        for (const s of seatRows) {
          await conn.query(
            `INSERT INTO booking_seats (booking_id, showtime_id, seat_id, price)
             VALUES (?, ?, ?, ?)`,
            [bookingId, stId, s.seat_id, s.default_price]
          );
        }
      } catch (e) {
        if (e.code === "ER_DUP_ENTRY") {
          await conn.rollback();
          return res.status(409).json({ error: "SEAT_TAKEN", seats: codes });
        }
        throw e;
      }

      // bắp nước
      for (const c of concRows) {
        await conn.query(
          `INSERT INTO booking_concessions (booking_id, concession_id, quantity, unit_price)
           VALUES (?, ?, ?, ?)`,
          [bookingId, c.cId, c.qty, c.price]
        );
      }

      // cộng điểm tích luỹ (1 điểm / 1.000đ) + nâng hạng
      const earned = Math.floor(grand / 1000);
      await conn.query(
        `UPDATE customers SET points = points + ?,
            tier_id = (SELECT tier_id FROM membership_tiers
                        WHERE min_points <= (SELECT points FROM (SELECT points FROM customers WHERE customer_id = ?) x) + ?
                        ORDER BY min_points DESC LIMIT 1),
            last_visit = CURDATE()
          WHERE customer_id = ?`,
        [earned, req.user.id, earned, req.user.id]
      );

      await conn.commit();
      holds.clear(stId, codes);

      res.status(201).json({
        bookingId: "b" + bookingId,
        code,
        total: grand,
        ticketSubtotal: total,
        concessionTotal: concTotal,
        discount,
        promoLabel: promo.label || null,
        status: "confirmed",
        paymentUrl: null, // mô phỏng — không redirect cổng thật
        seats: codes,
      });
    } catch (e) {
      await conn.rollback();
      throw e;
    } finally {
      conn.release();
    }
  })
);

// GET /bookings — danh sách vé (admin/manager, CRM & dashboard)
// ?status=confirmed|cancelled|refunded  ?limit=  (mặc định 200 vé gần nhất)
router.get(
  "/",
  requireAuth,
  requireRole("admin", "manager"),
  asyncHandler(async (req, res) => {
    const limit = Math.min(500, Number(req.query.limit) || 200);
    const where = [], params = [];
    if (req.query.status) { where.push("b.status = ?"); params.push(req.query.status); }
    const whereSql = where.length ? "WHERE " + where.join(" AND ") : "";
    const [rows] = await pool.query(
      `SELECT b.booking_id, b.booking_code, b.total_amount, b.status, b.payment_method,
              b.created_at, b.customer_id,
              s.show_date, s.show_time, m.movie_id, r.cinema_id,
              (SELECT COUNT(*) FROM booking_seats bs WHERE bs.booking_id = b.booking_id) AS seat_count,
              (SELECT t.code FROM booking_seats bs2 JOIN seats se ON se.seat_id = bs2.seat_id
                 JOIN seat_types t ON t.seat_type_id = se.seat_type_id
                WHERE bs2.booking_id = b.booking_id LIMIT 1) AS seat_type
         FROM bookings b
         JOIN showtimes s ON s.showtime_id = b.showtime_id
         JOIN movies m    ON m.movie_id    = s.movie_id
         JOIN rooms r     ON r.room_id     = s.room_id
         ${whereSql}
        ORDER BY b.created_at DESC, b.booking_id DESC
        LIMIT ?`,
      [...params, limit]
    );
    res.json({
      data: rows.map((b) => ({
        id: "b" + b.booking_id,
        code: b.booking_code,
        movieId: "m" + b.movie_id,
        cinemaId: "c" + b.cinema_id,
        userId: b.customer_id ? "u" + b.customer_id : null,
        date: b.show_date,
        time: String(b.show_time).slice(0, 5),
        seatCount: b.seat_count,
        seatType: b.seat_type || "regular",
        total: Number(b.total_amount),
        method: b.payment_method,
        status: b.status,
        createdAt: b.created_at,
      })),
    });
  })
);

// GET /bookings/:code — tra cứu vé (soát vé QR)
router.get(
  "/:code",
  optionalAuth,
  asyncHandler(async (req, res) => {
    const code = req.params.code;
    const [rows] = await pool.query(
      `SELECT b.*, m.movie_id, m.title, s.show_date, s.show_time, f.code AS format,
              c.name AS cinema_name
         FROM bookings b
         JOIN showtimes s ON s.showtime_id = b.showtime_id
         JOIN movies m    ON m.movie_id    = s.movie_id
         JOIN formats f   ON f.format_id   = s.format_id
         JOIN rooms r     ON r.room_id     = s.room_id
         JOIN cinemas c   ON c.cinema_id   = r.cinema_id
        WHERE b.booking_code = ?`,
      [code]
    );
    if (!rows.length) throw new ApiError(404, "NOT_FOUND", "Không tìm thấy vé");
    const b = rows[0];
    const [seatRows] = await pool.query(
      `SELECT s.seat_code, t.code AS type FROM booking_seats bs
         JOIN seats s ON s.seat_id = bs.seat_id
         JOIN seat_types t ON t.seat_type_id = s.seat_type_id
        WHERE bs.booking_id = ?`,
      [b.booking_id]
    );
    res.json({
      code: b.booking_code,
      status: b.status,
      total: Number(b.total_amount),
      movie: { id: "m" + b.movie_id, title: b.title },
      cinema: b.cinema_name,
      showtime: { date: b.show_date, time: String(b.show_time).slice(0, 5), format: b.format },
      seats: seatRows.map((s) => ({ code: s.seat_code, type: s.type })),
      isUsed: !!b.checked_in,
      checkedInAt: b.checked_in_at,
    });
  })
);

// POST /bookings/:code/checkin — soát vé (staff)
router.post(
  "/:code/checkin",
  requireAuth,
  requireRole("staff", "manager", "admin"),
  asyncHandler(async (req, res) => {
    const [rows] = await pool.query("SELECT * FROM bookings WHERE booking_code = ?", [
      req.params.code,
    ]);
    if (!rows.length) throw new ApiError(404, "NOT_FOUND", "Không tìm thấy vé");
    const b = rows[0];
    if (b.status !== "confirmed")
      return res.status(400).json({ error: "NOT_CONFIRMED", status: b.status });
    if (b.checked_in) return res.status(409).json({ error: "ALREADY_USED" });
    const now = new Date();
    await pool.query(
      "UPDATE bookings SET checked_in = 1, checked_in_at = NOW(), checked_in_by = ? WHERE booking_id = ?",
      [req.user.id, b.booking_id]
    );
    res.json({ success: true, checkedInAt: now.toISOString() });
  })
);

// PATCH /bookings/:id/refund — hoàn tiền (admin/manager)
router.patch(
  "/:id/refund",
  requireAuth,
  requireRole("admin", "manager"),
  asyncHandler(async (req, res) => {
    const bookingId = parseId(req.params.id, "b");
    if (!bookingId) throw new ApiError(400, "BAD_ID");
    const [rows] = await pool.query("SELECT * FROM bookings WHERE booking_id = ?", [bookingId]);
    if (!rows.length) throw new ApiError(404, "NOT_FOUND");
    if (rows[0].status === "refunded")
      return res.status(409).json({ error: "ALREADY_REFUNDED" });
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();
      await conn.query("UPDATE bookings SET status = 'refunded' WHERE booking_id = ?", [bookingId]);
      // GIẢI PHÓNG ghế: vé hoàn tiền thì ghế phải bán lại được.
      // (UNIQUE(showtime_id,seat_id) sẽ chặn nếu còn giữ booking_seats cũ.)
      await conn.query("DELETE FROM booking_seats WHERE booking_id = ?", [bookingId]);
      await conn.commit();
    } catch (e) {
      await conn.rollback();
      throw e;
    } finally {
      conn.release();
    }
    res.json({ status: "refunded", refundedAt: new Date().toISOString() });
  })
);

// PATCH /bookings/:id/cancel — huỷ vé (admin/manager) + giải phóng ghế
router.patch(
  "/:id/cancel",
  requireAuth,
  requireRole("admin", "manager"),
  asyncHandler(async (req, res) => {
    const bookingId = parseId(req.params.id, "b");
    if (!bookingId) throw new ApiError(400, "BAD_ID");
    const [rows] = await pool.query("SELECT status FROM bookings WHERE booking_id = ?", [bookingId]);
    if (!rows.length) throw new ApiError(404, "NOT_FOUND");
    if (rows[0].status === "cancelled" || rows[0].status === "refunded")
      return res.status(409).json({ error: "ALREADY_CLOSED", status: rows[0].status });
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();
      await conn.query("UPDATE bookings SET status = 'cancelled' WHERE booking_id = ?", [bookingId]);
      await conn.query("DELETE FROM booking_seats WHERE booking_id = ?", [bookingId]); // trả ghế lại
      await conn.commit();
    } catch (e) {
      await conn.rollback();
      throw e;
    } finally {
      conn.release();
    }
    res.json({ status: "cancelled", cancelledAt: new Date().toISOString() });
  })
);

module.exports = router;
