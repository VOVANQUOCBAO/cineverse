/* ============================================================
   CINEVERSE — MySQL connection pool (mysql2/promise)
   ============================================================ */
const mysql = require("mysql2/promise");
require("dotenv").config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || "127.0.0.1",
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "cineverse",
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
