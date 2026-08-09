/* ============================================================
   /staff — danh sách nhân viên (admin/manager). Ẩn password_hash.
   ============================================================ */
const router = require("express").Router();
const bcrypt = require("bcryptjs");
const { pool } = require("../db");
const { asyncHandler, ApiError } = require("../utils/http");
const { requireAuth, requireRole } = require("../middleware/auth");
const { cid, parseId } = require("../utils/ids");

const ROLES = ["admin", "manager", "staff"];
const STATUSES = ["active", "inactive"];

router.use(requireAuth, requireRole("admin", "manager"));

// GET /staff — danh sách nhân viên
router.get(
  "/",
  asyncHandler(async (req, res) => {
    const [rows] = await pool.query(
      `SELECT staff_id, full_name, email, phone, role, position, cinema_id,
              hire_date, status, salary, avatar_color
         FROM staff ORDER BY FIELD(role,'admin','manager','staff'), staff_id`
    );
    res.json({
      data: rows.map((s) => ({
        id: "st" + s.staff_id,
        name: s.full_name,
        email: s.email,
        phone: s.phone || "",
        role: s.role,
        position: s.position || "",
        cinemaId: s.cinema_id ? cid(s.cinema_id) : null,
        hireDate: s.hire_date || "",
        status: s.status,
        salary: Number(s.salary || 0),
        avatar: s.avatar_color || "#6ea8ff",
      })),
    });
  })
);

// Chỉ admin được thêm/sửa/xoá nhân viên
const adminOnly = requireRole("admin");

// POST /staff — thêm nhân viên (mật khẩu mặc định "123456")
router.post(
  "/",
  adminOnly,
  asyncHandler(async (req, res) => {
    const b = req.body || {};
    if (!b.name || !b.email) throw new ApiError(400, "VALIDATION", "Thiếu họ tên / email");
    const role = ROLES.includes(b.role) ? b.role : "staff";
    const status = STATUSES.includes(b.status) ? b.status : "active";
    const cinemaId = b.cinemaId ? parseId(b.cinemaId, "c") : null;
    const hash = await bcrypt.hash(String(b.password || "123456"), 10);
    try {
      const [r] = await pool.query(
        `INSERT INTO staff (full_name, email, phone, password_hash, role, position, cinema_id, hire_date, status, salary, avatar_color)
         VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
        [b.name, b.email, b.phone || null, hash, role, b.position || null, cinemaId,
         b.hireDate || null, status, b.salary || 0, b.avatar || "#6ea8ff"]
      );
      res.status(201).json({ id: "st" + r.insertId });
    } catch (e) {
      if (e.code === "ER_DUP_ENTRY")
        return res.status(409).json({ error: "EMAIL_EXISTS", message: "Email đã tồn tại" });
      throw e;
    }
  })
);

// PUT /staff/:id — cập nhật nhân viên (không đổi mật khẩu)
router.put(
  "/:id",
  adminOnly,
  asyncHandler(async (req, res) => {
    const staffId = parseId(req.params.id, "st");
    if (!staffId) throw new ApiError(400, "BAD_ID");
    const b = req.body || {};
    const fields = {
      full_name: b.name, email: b.email, phone: b.phone,
      role: ROLES.includes(b.role) ? b.role : undefined,
      position: b.position,
      cinema_id: b.cinemaId !== undefined ? (b.cinemaId ? parseId(b.cinemaId, "c") : null) : undefined,
      hire_date: b.hireDate, status: STATUSES.includes(b.status) ? b.status : undefined,
      salary: b.salary, avatar_color: b.avatar,
    };
    const sets = [], params = [];
    for (const [k, v] of Object.entries(fields)) {
      if (v !== undefined) { sets.push(`${k} = ?`); params.push(v); }
    }
    if (!sets.length) throw new ApiError(400, "VALIDATION", "Không có trường nào để cập nhật");
    const [r] = await pool.query(`UPDATE staff SET ${sets.join(", ")} WHERE staff_id = ?`, [...params, staffId]);
    if (!r.affectedRows) throw new ApiError(404, "NOT_FOUND");
    res.json({ id: "st" + staffId, updated: true });
  })
);

// DELETE /staff/:id — xoá nhân viên (checked_in_by tự SET NULL)
router.delete(
  "/:id",
  adminOnly,
  asyncHandler(async (req, res) => {
    const staffId = parseId(req.params.id, "st");
    if (!staffId) throw new ApiError(400, "BAD_ID");
    if (req.user.kind === "staff" && req.user.id === staffId)
      return res.status(409).json({ error: "SELF_DELETE", message: "Không thể tự xoá tài khoản đang đăng nhập" });
    const [r] = await pool.query("DELETE FROM staff WHERE staff_id = ?", [staffId]);
    if (!r.affectedRows) throw new ApiError(404, "NOT_FOUND");
    res.json({ deleted: true });
  })
);

module.exports = router;
