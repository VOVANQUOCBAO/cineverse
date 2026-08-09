-- =====================================================================
--  CINEVERSE — Cơ sở dữ liệu hệ thống quản lý rạp chiếu phim
--  DBMS: MySQL / MariaDB 10.4+ (XAMPP)   |   Engine: InnoDB   |   utf8mb4
--  Chuẩn hoá: 3NF. Khoá chính dùng surrogate key INT AUTO_INCREMENT.
--  Mã nghiệp vụ (booking_code, seat_code...) để ở cột UNIQUE riêng.
-- =====================================================================

DROP DATABASE IF EXISTS cineverse;
CREATE DATABASE cineverse CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE cineverse;

-- ---------------------------------------------------------------------
-- 1) DANH MỤC / LOOKUP
-- ---------------------------------------------------------------------

-- Hạng thành viên: Bronze / Silver / Gold / Platinum
CREATE TABLE membership_tiers (
    tier_id       INT AUTO_INCREMENT PRIMARY KEY,
    code          VARCHAR(20)  NOT NULL UNIQUE,        -- bronze/silver/gold/platinum
    name          VARCHAR(50)  NOT NULL,
    min_points    INT          NOT NULL DEFAULT 0,     -- điểm tối thiểu để đạt hạng
    discount_rate DECIMAL(4,3) NOT NULL DEFAULT 0.000  -- % giảm giá (0.05 = 5%)
) ENGINE=InnoDB;

-- Loại ghế: thường / VIP / đôi
CREATE TABLE seat_types (
    seat_type_id  INT AUTO_INCREMENT PRIMARY KEY,
    code          VARCHAR(20)  NOT NULL UNIQUE,        -- regular/vip/couple
    name          VARCHAR(50)  NOT NULL,
    default_price DECIMAL(12,0) NOT NULL               -- VND, không phần lẻ
) ENGINE=InnoDB;

-- Định dạng chiếu: 2D / 3D / IMAX
CREATE TABLE formats (
    format_id     INT AUTO_INCREMENT PRIMARY KEY,
    code          VARCHAR(10)  NOT NULL UNIQUE,        -- 2D/3D/IMAX
    name          VARCHAR(50)  NOT NULL
) ENGINE=InnoDB;

CREATE TABLE genres (
    genre_id      INT AUTO_INCREMENT PRIMARY KEY,
    name          VARCHAR(80)  NOT NULL UNIQUE
) ENGINE=InnoDB;

CREATE TABLE actors (
    actor_id      INT AUTO_INCREMENT PRIMARY KEY,
    full_name     VARCHAR(120) NOT NULL UNIQUE
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- 2) PHIM
-- ---------------------------------------------------------------------
CREATE TABLE movies (
    movie_id      INT AUTO_INCREMENT PRIMARY KEY,
    title         VARCHAR(200) NOT NULL,
    title_en      VARCHAR(200),
    duration_min  SMALLINT     NOT NULL,               -- thời lượng (phút)
    age_rating    VARCHAR(10),                          -- P/T13/T16/T18/K
    imdb_score    DECIMAL(3,1) DEFAULT 0,
    votes         INT          DEFAULT 0,
    director      VARCHAR(120),
    country       VARCHAR(120),
    status        ENUM('now','coming','ended') NOT NULL DEFAULT 'coming',
    release_date  DATE,
    synopsis      TEXT,
    poster_url    VARCHAR(255),
    trailer_key   VARCHAR(40),                          -- mã YouTube
    theme_dark    VARCHAR(9),                           -- màu giao diện #rrggbb
    theme_light   VARCHAR(9),
    accent_color  VARCHAR(9),
    created_at    DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- M:N  phim ↔ thể loại
CREATE TABLE movie_genres (
    movie_id  INT NOT NULL,
    genre_id  INT NOT NULL,
    PRIMARY KEY (movie_id, genre_id),
    FOREIGN KEY (movie_id) REFERENCES movies(movie_id)  ON DELETE CASCADE,
    FOREIGN KEY (genre_id) REFERENCES genres(genre_id)  ON DELETE CASCADE
) ENGINE=InnoDB;

-- M:N  phim ↔ diễn viên
CREATE TABLE movie_actors (
    movie_id  INT NOT NULL,
    actor_id  INT NOT NULL,
    PRIMARY KEY (movie_id, actor_id),
    FOREIGN KEY (movie_id) REFERENCES movies(movie_id)  ON DELETE CASCADE,
    FOREIGN KEY (actor_id) REFERENCES actors(actor_id)  ON DELETE CASCADE
) ENGINE=InnoDB;

-- M:N  phim ↔ định dạng hỗ trợ
CREATE TABLE movie_formats (
    movie_id   INT NOT NULL,
    format_id  INT NOT NULL,
    PRIMARY KEY (movie_id, format_id),
    FOREIGN KEY (movie_id)  REFERENCES movies(movie_id)   ON DELETE CASCADE,
    FOREIGN KEY (format_id) REFERENCES formats(format_id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- 3) RẠP — PHÒNG — GHẾ
-- ---------------------------------------------------------------------
CREATE TABLE cinemas (
    cinema_id  INT AUTO_INCREMENT PRIMARY KEY,
    name       VARCHAR(150) NOT NULL,
    city       VARCHAR(100) NOT NULL,
    address    VARCHAR(255) NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE rooms (
    room_id    INT AUTO_INCREMENT PRIMARY KEY,
    cinema_id  INT NOT NULL,
    name       VARCHAR(80) NOT NULL,
    room_type  VARCHAR(10) NOT NULL DEFAULT '2D',       -- 2D/3D/IMAX/Gold
    UNIQUE (cinema_id, name),
    FOREIGN KEY (cinema_id) REFERENCES cinemas(cinema_id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Mỗi ghế vật lý thuộc 1 phòng (sơ đồ ghế cố định của phòng)
CREATE TABLE seats (
    seat_id       INT AUTO_INCREMENT PRIMARY KEY,
    room_id       INT NOT NULL,
    seat_row      CHAR(2)  NOT NULL,                    -- A..H
    seat_col      SMALLINT NOT NULL,                    -- 1..12
    seat_code     VARCHAR(5) NOT NULL,                  -- A1, B12...
    seat_type_id  INT NOT NULL,
    UNIQUE (room_id, seat_code),
    FOREIGN KEY (room_id)      REFERENCES rooms(room_id)           ON DELETE CASCADE,
    FOREIGN KEY (seat_type_id) REFERENCES seat_types(seat_type_id)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- 4) SUẤT CHIẾU
--    (rạp suy ra từ phòng -> không lưu cinema_id ở đây, tránh trùng lặp)
-- ---------------------------------------------------------------------
CREATE TABLE showtimes (
    showtime_id  INT AUTO_INCREMENT PRIMARY KEY,
    movie_id     INT  NOT NULL,
    room_id      INT  NOT NULL,
    format_id    INT  NOT NULL,
    show_date    DATE NOT NULL,
    show_time    TIME NOT NULL,
    UNIQUE (room_id, show_date, show_time),             -- 1 phòng không 2 suất cùng giờ
    FOREIGN KEY (movie_id)  REFERENCES movies(movie_id),
    FOREIGN KEY (room_id)   REFERENCES rooms(room_id),
    FOREIGN KEY (format_id) REFERENCES formats(format_id)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- 5) KHÁCH HÀNG & NHÂN VIÊN (tài khoản đăng nhập)
-- ---------------------------------------------------------------------
CREATE TABLE customers (
    customer_id    INT AUTO_INCREMENT PRIMARY KEY,
    full_name      VARCHAR(120) NOT NULL,
    email          VARCHAR(150) NOT NULL UNIQUE,
    phone          VARCHAR(20),
    password_hash  VARCHAR(255) NOT NULL,
    google_sub     VARCHAR(255) UNIQUE,                 -- Google Account ID (sub), không dùng email làm ID
    avatar_color   VARCHAR(9),
    tier_id        INT,
    points         INT NOT NULL DEFAULT 0,              -- điểm tích luỹ hiện có
    joined_date    DATE,
    last_visit     DATE,
    created_at     DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (tier_id) REFERENCES membership_tiers(tier_id)
) ENGINE=InnoDB;

CREATE TABLE staff (
    staff_id       INT AUTO_INCREMENT PRIMARY KEY,
    full_name      VARCHAR(120) NOT NULL,
    email          VARCHAR(150) NOT NULL UNIQUE,
    phone          VARCHAR(20),
    password_hash  VARCHAR(255) NOT NULL,
    role           ENUM('admin','manager','staff') NOT NULL DEFAULT 'staff',
    position       VARCHAR(100),
    cinema_id      INT,                                 -- admin có thể NULL (toàn hệ thống)
    hire_date      DATE,
    status         ENUM('active','inactive') NOT NULL DEFAULT 'active',
    salary         DECIMAL(12,0),
    avatar_color   VARCHAR(9),
    FOREIGN KEY (cinema_id) REFERENCES cinemas(cinema_id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- 6) ĐẶT VÉ (hoá đơn) — CHI TIẾT GHẾ — BẮP NƯỚC
-- ---------------------------------------------------------------------
CREATE TABLE bookings (
    booking_id      INT AUTO_INCREMENT PRIMARY KEY,
    booking_code    VARCHAR(12) NOT NULL UNIQUE,        -- mã QR/vé: AB1234
    showtime_id     INT NOT NULL,
    customer_id     INT NOT NULL,
    total_amount    DECIMAL(12,0) NOT NULL DEFAULT 0,
    payment_method  ENUM('momo','vnpay','atm','visa','cash') NOT NULL,
    status          ENUM('pending','confirmed','cancelled','refunded') NOT NULL DEFAULT 'pending',
    checked_in      TINYINT(1) NOT NULL DEFAULT 0,      -- đã soát vé chưa
    checked_in_at   DATETIME,
    checked_in_by   INT,                                -- nhân viên soát vé
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (showtime_id)   REFERENCES showtimes(showtime_id),
    FOREIGN KEY (customer_id)   REFERENCES customers(customer_id),
    FOREIGN KEY (checked_in_by) REFERENCES staff(staff_id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- Mỗi vé giữ nhiều ghế. Giá lưu snapshot tại thời điểm đặt.
-- UNIQUE(showtime_id, seat_id): KHOÁ chống đặt trùng 1 ghế / 1 suất.
-- (showtime_id lặp lại ở đây có chủ đích — để DB tự cưỡng chế ràng buộc này.)
CREATE TABLE booking_seats (
    booking_seat_id INT AUTO_INCREMENT PRIMARY KEY,
    booking_id      INT NOT NULL,
    showtime_id     INT NOT NULL,
    seat_id         INT NOT NULL,
    price           DECIMAL(12,0) NOT NULL,
    UNIQUE (showtime_id, seat_id),
    FOREIGN KEY (booking_id)  REFERENCES bookings(booking_id) ON DELETE CASCADE,
    FOREIGN KEY (showtime_id) REFERENCES showtimes(showtime_id),
    FOREIGN KEY (seat_id)     REFERENCES seats(seat_id)
) ENGINE=InnoDB;

CREATE TABLE concessions (
    concession_id INT AUTO_INCREMENT PRIMARY KEY,
    name          VARCHAR(120) NOT NULL,
    category      VARCHAR(50),                          -- bắp / nước / combo
    price         DECIMAL(12,0) NOT NULL,
    image_url     VARCHAR(255),
    is_active     TINYINT(1) NOT NULL DEFAULT 1
) ENGINE=InnoDB;

CREATE TABLE booking_concessions (
    id            INT AUTO_INCREMENT PRIMARY KEY,
    booking_id    INT NOT NULL,
    concession_id INT NOT NULL,
    quantity      SMALLINT NOT NULL DEFAULT 1,
    unit_price    DECIMAL(12,0) NOT NULL,
    FOREIGN KEY (booking_id)    REFERENCES bookings(booking_id) ON DELETE CASCADE,
    FOREIGN KEY (concession_id) REFERENCES concessions(concession_id)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- 7) ĐÁNH GIÁ PHIM
-- ---------------------------------------------------------------------
CREATE TABLE reviews (
    review_id     INT AUTO_INCREMENT PRIMARY KEY,
    movie_id      INT NOT NULL,
    customer_id   INT,                                  -- có thể NULL (khách vãng lai)
    reviewer_name VARCHAR(120) NOT NULL,
    avatar_color  VARCHAR(9),
    rating        TINYINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
    review_text   TEXT,
    is_verified   TINYINT(1) NOT NULL DEFAULT 0,        -- đã mua vé mới được verified
    created_date  DATE,
    FOREIGN KEY (movie_id)    REFERENCES movies(movie_id)       ON DELETE CASCADE,
    FOREIGN KEY (customer_id) REFERENCES customers(customer_id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- =====================================================================
--  VIEW phục vụ báo cáo / dashboard admin (doanh thu, công suất, top phim)
-- =====================================================================

-- Doanh thu theo ngày (chỉ tính vé confirmed)
CREATE OR REPLACE VIEW v_revenue_daily AS
SELECT s.show_date           AS report_date,
       COUNT(DISTINCT b.booking_id) AS tickets,
       SUM(b.total_amount)   AS revenue
FROM bookings b
JOIN showtimes s ON s.showtime_id = b.showtime_id
WHERE b.status = 'confirmed'
GROUP BY s.show_date;

-- Top phim theo số vé bán
CREATE OR REPLACE VIEW v_top_movies AS
SELECT m.movie_id, m.title,
       COUNT(bs.booking_seat_id) AS seats_sold,
       SUM(bs.price)             AS revenue
FROM movies m
JOIN showtimes s     ON s.movie_id   = m.movie_id
JOIN bookings  b     ON b.showtime_id = s.showtime_id AND b.status = 'confirmed'
JOIN booking_seats bs ON bs.booking_id = b.booking_id
GROUP BY m.movie_id, m.title
ORDER BY seats_sold DESC;

-- Công suất ghế đã bán theo rạp (số ghế bán / tổng ghế các phòng)
CREATE OR REPLACE VIEW v_cinema_occupancy AS
SELECT c.cinema_id, c.name,
       COUNT(bs.booking_seat_id) AS seats_sold
FROM cinemas c
JOIN rooms r          ON r.cinema_id = c.cinema_id
JOIN showtimes s      ON s.room_id   = r.room_id
JOIN bookings b       ON b.showtime_id = s.showtime_id AND b.status = 'confirmed'
JOIN booking_seats bs ON bs.booking_id = b.booking_id
GROUP BY c.cinema_id, c.name;
