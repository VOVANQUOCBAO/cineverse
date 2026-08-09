/* CINEVERSE — điểm khởi động backend */
const app = require("./app");
const { ping } = require("./db");
require("dotenv").config();

const PORT = Number(process.env.PORT) || 5000;

(async () => {
  try {
    await ping();
    console.log("✓ Kết nối MySQL/MariaDB thành công (DB: " + (process.env.DB_NAME || "cineverse") + ")");
  } catch (e) {
    console.error("✗ Không kết nối được DB. Kiểm tra XAMPP/MySQL đang chạy?\n", e.message);
    process.exit(1);
  }
  app.listen(PORT, () => {
    console.log(`✓ CINEVERSE API chạy tại  http://localhost:${PORT}/api`);
    if (process.env.SERVE_FRONTEND === "true")
      console.log(`✓ Frontend phục vụ tại  http://localhost:${PORT}/CINEFILM.html`);
  });
})();
