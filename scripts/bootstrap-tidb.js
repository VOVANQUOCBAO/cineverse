const fs = require("fs");
const path = require("path");
const mysql = require("mysql2/promise");

const ROOT = path.join(__dirname, "..");
const ENV_PATH = process.argv[2];

function loadEnv(filePath) {
  const text = fs.readFileSync(path.resolve(filePath), "utf8");
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const separator = line.indexOf("=");
    if (separator < 1) continue;
    const key = line.slice(0, separator).trim();
    let value = line.slice(separator + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    process.env[key] = value.replace(/\\n/g, "\n");
  }
}

function splitSql(source) {
  const statements = [];
  let delimiter = ";";
  let buffer = [];

  for (const rawLine of source.split(/\r?\n/)) {
    const delimiterMatch = rawLine.trim().match(/^DELIMITER\s+(.+)$/i);
    if (delimiterMatch) {
      delimiter = delimiterMatch[1];
      continue;
    }
    buffer.push(rawLine);
    const joined = buffer.join("\n").trim();
    if (joined.endsWith(delimiter)) {
      const statement = joined.slice(0, -delimiter.length).trim();
      if (statement) statements.push(statement);
      buffer = [];
    }
  }

  const tail = buffer.join("\n").trim();
  if (tail) statements.push(tail);
  return statements;
}

function isoDate(offsetDays) {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() + offsetDays);
  return date.toISOString().slice(0, 10);
}

async function executeStatements(connection, statements, label) {
  for (let index = 0; index < statements.length; index += 1) {
    let statement = statements[index];
    if (/^DROP\s+DATABASE\s+/i.test(statement)) continue;
    statement = statement.replace(/^CREATE\s+DATABASE\s+cineverse\b/i, "CREATE DATABASE IF NOT EXISTS cineverse");
    await connection.query(statement);
  }
  console.log(`${label}: ${statements.length} statements processed`);
}

async function seedGeneratedData(connection) {
  const [rooms] = await connection.query("SELECT room_id FROM rooms ORDER BY room_id");
  const seatRows = [];
  for (const { room_id: roomId } of rooms) {
    for (const row of ["A", "B", "C", "D", "E", "F", "G"]) {
      for (let column = 1; column <= 12; column += 1) {
        const isVip = ["D", "E", "F"].includes(row) && column >= 3 && column <= 10;
        seatRows.push([roomId, row, column, `${row}${column}`, isVip ? 2 : 1]);
      }
    }
    for (let column = 1; column <= 6; column += 1) {
      seatRows.push([roomId, "H", column, `H${column}`, 3]);
    }
  }
  await connection.query(
    "INSERT INTO seats (room_id, seat_row, seat_col, seat_code, seat_type_id) VALUES ?",
    [seatRows]
  );

  const [movieFormats] = await connection.query("SELECT movie_id, format_id FROM movie_formats");
  const formatSet = new Set(movieFormats.map((item) => `${item.movie_id}:${item.format_id}`));
  const times = ["09:15:00", "11:40:00", "14:20:00", "17:00:00", "19:30:00", "21:50:00"];
  const showtimeRows = [];
  let showtimeIndex = 0;
  for (const { room_id: roomId } of rooms) {
    for (let day = 0; day <= 4; day += 1) {
      for (const time of times) {
        showtimeIndex += 1;
        const movieId = ((showtimeIndex - 1) % 21) + 1;
        let formatId = 1;
        if (roomId === 2 && formatSet.has(`${movieId}:3`)) formatId = 3;
        else if (roomId === 4 && formatSet.has(`${movieId}:2`)) formatId = 2;
        showtimeRows.push([movieId, roomId, formatId, isoDate(day), time]);
      }
    }
  }
  await connection.query(
    "INSERT INTO showtimes (movie_id, room_id, format_id, show_date, show_time) VALUES ?",
    [showtimeRows]
  );

  const [showtimes] = await connection.query(
    "SELECT showtime_id, room_id FROM showtimes ORDER BY showtime_id LIMIT 40"
  );
  const methods = ["momo", "vnpay", "atm", "visa"];
  for (let index = 0; index < showtimes.length; index += 1) {
    const number = index + 1;
    const showtime = showtimes[index];
    const bookingCode = `BK${String(number).padStart(5, "0")}`;
    const [bookingResult] = await connection.query(
      `INSERT INTO bookings
        (booking_code, showtime_id, customer_id, total_amount, payment_method, status, created_at)
       VALUES (?, ?, ?, 0, ?, 'confirmed', DATE_SUB(CURDATE(), INTERVAL ${number % 30} DAY))`,
      [bookingCode, showtime.showtime_id, ((number - 1) % 12) + 1, methods[(number - 1) % methods.length]]
    );
    await connection.query(
      `INSERT INTO booking_seats (booking_id, showtime_id, seat_id, price)
       SELECT ?, ?, s.seat_id, st.default_price
       FROM seats s
       JOIN seat_types st ON st.seat_type_id = s.seat_type_id
       WHERE s.room_id = ?
         AND s.seat_id NOT IN (SELECT seat_id FROM booking_seats WHERE showtime_id = ?)
       ORDER BY s.seat_id LIMIT 2`,
      [bookingResult.insertId, showtime.showtime_id, showtime.room_id, showtime.showtime_id]
    );
    await connection.query(
      `UPDATE bookings SET total_amount =
        (SELECT COALESCE(SUM(price), 0) FROM booking_seats WHERE booking_id = ?)
       WHERE booking_id = ?`,
      [bookingResult.insertId, bookingResult.insertId]
    );
  }
}

async function bootstrapTiDB(config = {}) {
  if (
    !ENV_PATH &&
    Object.keys(config).length === 0 &&
    !process.env.DB_HOST &&
    !process.env.TIDB_HOST
  ) {
    throw new Error("Provide a Vercel env file or DB_HOST/DB_USER/DB_PASSWORD environment variables");
  }
  if (ENV_PATH && Object.keys(config).length === 0) loadEnv(ENV_PATH);
  const host = config.host || process.env.DB_HOST || process.env.TIDB_HOST;
  if (!host || !host.endsWith(".tidbcloud.com")) {
    throw new Error("Refusing to bootstrap: DB_HOST is not a TiDB Cloud host");
  }

  const connection = await mysql.createConnection({
    host,
    port: Number(config.port || process.env.DB_PORT || process.env.TIDB_PORT || 4000),
    user: config.user || process.env.DB_USER || process.env.TIDB_USER,
    password: config.password || process.env.DB_PASSWORD || process.env.TIDB_PASSWORD,
    ssl: { minVersion: "TLSv1.2", rejectUnauthorized: true },
    charset: "utf8mb4",
  });

  try {
    await connection.query("CREATE DATABASE IF NOT EXISTS cineverse CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
    const [[{ table_count: tableCount }]] = await connection.query(
      "SELECT COUNT(*) AS table_count FROM information_schema.tables WHERE table_schema = 'cineverse'"
    );
    if (Number(tableCount) > 0) {
      throw new Error(`Refusing to bootstrap non-empty cineverse database (${tableCount} tables)`);
    }

    const schema = fs.readFileSync(path.join(ROOT, "database", "01_schema.sql"), "utf8");
    await executeStatements(connection, splitSql(schema), "schema");

    const seed = fs.readFileSync(path.join(ROOT, "database", "02_seed.sql"), "utf8");
    const seedWithoutProcedures = seed.split("DROP PROCEDURE IF EXISTS seed_seats;")[0];
    await executeStatements(connection, splitSql(seedWithoutProcedures), "base seed");

    await connection.query("USE cineverse");
    await connection.beginTransaction();
    try {
      await seedGeneratedData(connection);
      await connection.commit();
    } catch (error) {
      await connection.rollback();
      throw error;
    }

    const [[counts]] = await connection.query(`SELECT
      (SELECT COUNT(*) FROM movies) AS movies,
      (SELECT COUNT(*) FROM seats) AS seats,
      (SELECT COUNT(*) FROM showtimes) AS showtimes,
      (SELECT COUNT(*) FROM bookings) AS bookings,
      (SELECT COUNT(*) FROM staff) AS staff`);
    console.log(JSON.stringify({ ready: true, ...counts }));
  } finally {
    await connection.end();
  }
}

module.exports = { bootstrapTiDB };

if (require.main === module) {
  bootstrapTiDB().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
