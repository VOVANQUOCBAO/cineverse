/* ============================================================
   CINEVERSE — MySQL connection pool (mysql2/promise)
   ============================================================ */
const mysql = require("mysql2/promise");
require("dotenv").config();

const host = process.env.DB_HOST || process.env.TIDB_HOST || "127.0.0.1";
const useTls =
  process.env.DB_SSL === "true" ||
  Boolean(process.env.TIDB_HOST) ||
  host.endsWith(".tidbcloud.com");

const pool = mysql.createPool({
  host,
  port: Number(process.env.DB_PORT || process.env.TIDB_PORT) || 3306,
  user: process.env.DB_USER || process.env.TIDB_USER || "root",
  password: process.env.DB_PASSWORD || process.env.TIDB_PASSWORD || "",
  database: process.env.DB_NAME || process.env.TIDB_DATABASE || "cineverse",
  ...(useTls ? { ssl: { minVersion: "TLSv1.2", rejectUnauthorized: true } } : {}),
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  charset: "utf8mb4_unicode_ci",
  dateStrings: true, // trả DATE/DATETIME dạng chuỗi, tránh lệch timezone
});

// Kiểm tra kết nối lúc khởi động
async function ping() {
  const conn = await pool.getConnection();
  try {
    await conn.query("SELECT 1");
  } finally {
    conn.release();
  }
}

module.exports = { pool, ping };
