const mysql = require("mysql2/promise");

async function main() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT || 4000),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || "cineverse",
    ssl: {
      minVersion: "TLSv1.2",
      rejectUnauthorized: true,
    },
  });

  const [tables] = await connection.query(
    "SELECT COUNT(*) AS count FROM information_schema.tables WHERE table_schema = DATABASE()",
  );
  const [counts] = await connection.query(`
    SELECT
      (SELECT COUNT(*) FROM movies) AS movies,
      (SELECT COUNT(*) FROM users) AS users,
      (SELECT COUNT(*) FROM staff) AS staff,
      (SELECT COUNT(*) FROM cinemas) AS cinemas,
      (SELECT COUNT(*) FROM rooms) AS rooms,
      (SELECT COUNT(*) FROM seats) AS seats,
      (SELECT COUNT(*) FROM showtimes) AS showtimes,
      (SELECT COUNT(*) FROM bookings) AS bookings
  `);

  console.log(JSON.stringify({ tables: tables[0].count, ...counts[0] }));
  await connection.end();
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
