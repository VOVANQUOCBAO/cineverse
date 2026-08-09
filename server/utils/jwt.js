/* JWT phát hành / xác thực token */
const jwt = require("jsonwebtoken");
require("dotenv").config();

const SECRET = process.env.JWT_SECRET || "cineverse_dev_secret";
const ACCESS_TTL = process.env.JWT_ACCESS_TTL || "7d";
const REFRESH_TTL = process.env.JWT_REFRESH_TTL || "30d";

// payload: { sub: <dbId>, role: 'customer'|'staff'|'manager'|'admin', name }
function signAccess(payload) {
  return jwt.sign({ ...payload, typ: "access" }, SECRET, { expiresIn: ACCESS_TTL });
}
function signRefresh(payload) {
  return jwt.sign({ sub: payload.sub, role: payload.role, typ: "refresh" }, SECRET, {
    expiresIn: REFRESH_TTL,
  });
}
function verify(token) {
  return jwt.verify(token, SECRET);
}

module.exports = { signAccess, signRefresh, verify };
