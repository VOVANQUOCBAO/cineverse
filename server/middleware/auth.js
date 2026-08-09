/* ============================================================
   Middleware xác thực JWT + phân quyền theo vai trò
   req.user = { id, role, name, kind }  (kind: 'customer' | 'staff')
   ============================================================ */
const { verify } = require("../utils/jwt");
const { ApiError } = require("../utils/http");

// Bắt buộc đăng nhập
function requireAuth(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return next(new ApiError(401, "UNAUTHORIZED", "Thiếu access token"));
  try {
    const payload = verify(token);
    if (payload.typ !== "access")
      return next(new ApiError(401, "INVALID_TOKEN", "Token không hợp lệ"));
    req.user = {
      id: payload.sub,
      role: payload.role,
      name: payload.name,
      kind: payload.role === "customer" ? "customer" : "staff",
    };
    next();
  } catch (e) {
    next(new ApiError(401, "INVALID_TOKEN", "Token hết hạn hoặc không hợp lệ"));
  }
}

// Cho phép không đăng nhập, nhưng nếu có token thì gắn req.user
function optionalAuth(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return next();
  try {
    const payload = verify(token);
    if (payload.typ === "access") {
      req.user = {
        id: payload.sub,
        role: payload.role,
        name: payload.name,
        kind: payload.role === "customer" ? "customer" : "staff",
      };
    }
  } catch (_) {
    /* token hỏng -> coi như khách */
  }
  next();
}

// Giới hạn theo vai trò: requireRole('admin','manager')
function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) return next(new ApiError(401, "UNAUTHORIZED"));
    if (!roles.includes(req.user.role))
      return next(new ApiError(403, "FORBIDDEN", "Không đủ quyền"));
    next();
  };
}

module.exports = { requireAuth, optionalAuth, requireRole };
