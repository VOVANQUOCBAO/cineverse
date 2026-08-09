require("dotenv").config();
const { pool } = require("../db");

(async () => {
  await pool.query("ALTER TABLE customers ADD COLUMN IF NOT EXISTS google_sub VARCHAR(255) NULL AFTER password_hash");
  const [indexes] = await pool.query(
    "SELECT 1 FROM information_schema.statistics WHERE table_schema = DATABASE() AND table_name = 'customers' AND index_name = 'ux_customers_google_sub' LIMIT 1"
  );
  if (!indexes.length)
    await pool.query("CREATE UNIQUE INDEX ux_customers_google_sub ON customers (google_sub)");

  const [updated] = await pool.query(
    "UPDATE staff SET email = REPLACE(email, '@cinefilm.vn', '@cineverse.vn') WHERE email LIKE '%@cinefilm.vn'"
  );
  console.log(JSON.stringify({ staffEmailsUpdated: updated.affectedRows, googleColumnReady: true }));
  await pool.end();
})().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
