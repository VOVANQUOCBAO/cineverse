/* ============================================================
   /auth — đăng ký, đăng nhập, refresh token
   ============================================================ */
const router = require("express").Router();
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const { OAuth2Client } = require("google-auth-library");
const { pool } = require("../db");
const { asyncHandler, ApiError } = require("../utils/http");
const { signAccess, signRefresh, verify } = require("../utils/jwt");
const { uid } = require("../utils/ids");

const googleClient = new OAuth2Client();
const googleClientId = () => String(process.env.GOOGLE_CLIENT_ID || "").trim();
const normalizeEmail = (value) => String(value || "").trim().toLowerCase();
const avatarFromGoogleSub = (sub) => {
  const palette = ["#e9b949", "#38d39f", "#6ea8ff", "#a78bfa", "#f87171", "#f59e42"];
  let hash = 0;
  for (const ch of String(sub || "")) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
  return palette[hash % palette.length];
};

// Hồ sơ user trả về client (gộp customer + staff)
function customerProfile(row, tierCode) {
  return {
    id: uid(row.customer_id),
    name: row.full_name,
    email: row.email,
    phone: row.phone,
    role: "customer",
    points: row.points,
    tier: tierCode || null,
  };
}

// POST /auth/register — tạo tài khoản khách hàng
router.post(
  "/register",
  asyncHandler(async (req, res) => {
    const { name, phone, password } = req.body || {};
    const email = normalizeEmail(req.body && req.body.email);
    if (!name || !email || !password)
      throw new ApiError(400, "VALIDATION", "Thiếu name/email/password");
    if (String(password).length < 6)
      throw new ApiError(400, "VALIDATION", "Mật khẩu tối thiểu 6 ký tự");

    const [dup] = await pool.query("SELECT customer_id FROM customers WHERE email = ?", [email]);
    if (dup.length) throw new ApiError(409, "EMAIL_TAKEN", "Email đã được dùng");

    const hash = await bcrypt.hash(String(password), 10);
    const [r] = await pool.query(
      `INSERT INTO customers (full_name, email, phone, password_hash, tier_id, points, joined_date)
       VALUES (?, ?, ?, ?, 1, 0, CURDATE())`,
      [name, email, phone || null, hash]
    );
    const user = {
      id: uid(r.insertId),
      name,
      email,
      phone: phone || null,
      role: "customer",
      points: 0,
      tier: "bronze",
    };
    const claims = { sub: r.insertId, role: "customer", name };
    res.status(201).json({
      user,
      accessToken: signAccess(claims),
      refreshToken: signRefresh(claims),
    });
  })
);

// POST /auth/login — thử bảng customers trước, rồi staff
router.post(
  "/login",
  asyncHandler(async (req, res) => {
    const email = normalizeEmail(req.body && req.body.email);
    const { password } = req.body || {};
    if (!email || !password) throw new ApiError(400, "VALIDATION", "Thiếu email/password");

    // 1) Khách hàng
    const [custs] = await pool.query(
      `SELECT c.*, t.code AS tier_code
         FROM customers c LEFT JOIN membership_tiers t ON t.tier_id = c.tier_id
        WHERE c.email = ?`,
      [email]
    );
    if (custs.length) {
      const c = custs[0];
      const ok = await bcrypt.compare(String(password), c.password_hash);
      if (!ok) throw new ApiError(401, "BAD_CREDENTIALS", "Sai email hoặc mật khẩu");
      await pool.query("UPDATE customers SET last_visit = CURDATE() WHERE customer_id = ?", [
        c.customer_id,
      ]);
      const claims = { sub: c.customer_id, role: "customer", name: c.full_name };
      return res.json({
        user: customerProfile(c, c.tier_code),
        accessToken: signAccess(claims),
        refreshToken: signRefresh(claims),
      });
    }

    // 2) Nhân viên / quản lý / admin
    const [staffs] = await pool.query("SELECT * FROM staff WHERE email = ?", [email]);
    if (staffs.length) {
      const s = staffs[0];
      const ok = await bcrypt.compare(String(password), s.password_hash);
      if (!ok) throw new ApiError(401, "BAD_CREDENTIALS", "Sai email hoặc mật khẩu");
      if (s.status !== "active") throw new ApiError(403, "INACTIVE", "Tài khoản bị khoá");
      const claims = { sub: s.staff_id, role: s.role, name: s.full_name };
      return res.json({
        user: {
          id: "s" + s.staff_id,
          name: s.full_name,
          email: s.email,
          role: s.role,
          position: s.position,
          cinemaId: s.cinema_id ? "c" + s.cinema_id : null,
        },
        accessToken: signAccess(claims),
        refreshToken: signRefresh(claims),
      });
    }

    throw new ApiError(401, "BAD_CREDENTIALS", "Sai email hoặc mật khẩu");
  })
);

// GET /auth/google/config — client ID là cấu hình công khai, dùng để render nút GIS.
router.get("/google/config", (req, res) => {
  const clientId = googleClientId();
  res.json({ enabled: !!clientId, clientId: clientId || null });
});

// POST /auth/google — xác minh Google ID token, đăng nhập hoặc tạo khách hàng mới.
// Tài khoản nội bộ không được tự đăng nhập Google để tránh nâng quyền theo email.
router.post(
  "/google",
  asyncHandler(async (req, res) => {
    const clientId = googleClientId();
    if (!clientId)
      throw new ApiError(503, "GOOGLE_AUTH_DISABLED", "Đăng nhập Google chưa được cấu hình");

    const credential = String((req.body && req.body.credential) || "");
    if (!credential) throw new ApiError(400, "VALIDATION", "Thiếu Google credential");

    let payload;
    try {
      const ticket = await googleClient.verifyIdToken({ idToken: credential, audience: clientId });
      payload = ticket.getPayload();
    } catch (e) {
      throw new ApiError(401, "GOOGLE_TOKEN_INVALID", "Phiên đăng nhập Google không hợp lệ hoặc đã hết hạn");
    }

    const email = normalizeEmail(payload && payload.email);
    const googleSub = String((payload && payload.sub) || "");
    if (!email || !googleSub || payload.email_verified !== true)
      throw new ApiError(401, "GOOGLE_EMAIL_UNVERIFIED", "Google chưa xác minh địa chỉ email này");

    const [internal] = await pool.query("SELECT staff_id FROM staff WHERE LOWER(email) = ? LIMIT 1", [email]);
    if (internal.length)
      throw new ApiError(409, "STAFF_GOOGLE_DISABLED", "Tài khoản nhân viên và quản trị phải đăng nhập bằng mật khẩu");

    const [customers] = await pool.query(
      `SELECT c.*, t.code AS tier_code
         FROM customers c LEFT JOIN membership_tiers t ON t.tier_id = c.tier_id
        WHERE c.google_sub = ? OR LOWER(c.email) = ?
        ORDER BY (c.google_sub = ?) DESC LIMIT 1`,
      [googleSub, email, googleSub]
    );

    let customer;
    let isNew = false;
    if (customers.length) {
      customer = customers[0];
      if (customer.google_sub && customer.google_sub !== googleSub)
        throw new ApiError(409, "EMAIL_TAKEN", "Email này đã liên kết với một tài khoản Google khác");
      if (!customer.google_sub) {
        await pool.query("UPDATE customers SET google_sub = ?, last_visit = CURDATE() WHERE customer_id = ?", [googleSub, customer.customer_id]);
        customer.google_sub = googleSub;
      } else {
        await pool.query("UPDATE customers SET last_visit = CURDATE() WHERE customer_id = ?", [customer.customer_id]);
      }
    } else {
      const randomPasswordHash = await bcrypt.hash(crypto.randomBytes(32).toString("hex"), 10);
      const name = String(payload.name || email.split("@")[0]).slice(0, 120);
      const [created] = await pool.query(
        `INSERT INTO customers
          (full_name, email, phone, password_hash, google_sub, avatar_color, tier_id, points, joined_date, last_visit)
         VALUES (?, ?, NULL, ?, ?, ?, 1, 0, CURDATE(), CURDATE())`,
        [name, email, randomPasswordHash, googleSub, avatarFromGoogleSub(googleSub)]
      );
      customer = {
        customer_id: created.insertId,
        full_name: name,
        email,
        phone: null,
        points: 0,
      };
      isNew = true;
    }

    const claims = { sub: customer.customer_id, role: "customer", name: customer.full_name };
    res.status(isNew ? 201 : 200).json({
      user: customerProfile(customer, customer.tier_code || "bronze"),
      accessToken: signAccess(claims),
      refreshToken: signRefresh(claims),
      isNew,
    });
  })
);

// POST /auth/refresh — cấp access token mới
router.post(
  "/refresh",
  asyncHandler(async (req, res) => {
    const { refreshToken } = req.body || {};
    if (!refreshToken) throw new ApiError(400, "VALIDATION", "Thiếu refreshToken");
    let payload;
    try {
      payload = verify(refreshToken);
    } catch (e) {
      throw new ApiError(401, "INVALID_TOKEN", "Refresh token không hợp lệ");
    }
    if (payload.typ !== "refresh")
      throw new ApiError(401, "INVALID_TOKEN", "Không phải refresh token");
    const claims = { sub: payload.sub, role: payload.role, name: payload.name };
    res.json({ accessToken: signAccess(claims) });
  })
);

module.exports = router;
