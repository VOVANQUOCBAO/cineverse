-- =====================================================================
--  CINEVERSE — CÂU LỆNH SQL DÙNG KHI DEMO BẢO VỆ (chứng minh Web ↔ DB)
--  Cách dùng: phpMyAdmin → chọn DB `cineverse` → tab SQL → dán câu cần →
--  đổi 'AB1234' thành mã vé thật vừa đặt → bấm Go.
--  Kèm theo file kịch bản: KICH-BAN-DEMO.md
-- =====================================================================
USE cineverse;

-- ───────── KB1: Vé đặt trên web có lưu DB không? ─────────
-- 1a) 5 vé mới nhất (vé bạn vừa đặt nằm trên cùng)
SELECT booking_id, booking_code, customer_id, total_amount, payment_method, status, created_at
FROM bookings ORDER BY booking_id DESC LIMIT 5;

-- 1b) Ghế chi tiết của 1 vé (đổi mã vé)
SELECT bs.booking_id, s.seat_code, t.name AS loai_ghe, bs.price
FROM booking_seats bs
JOIN seats s      ON s.seat_id = bs.seat_id
JOIN seat_types t ON t.seat_type_id = s.seat_type_id
WHERE bs.booking_id = (SELECT booking_id FROM bookings WHERE booking_code = 'AB1234');


-- ───────── KB2: Chống trùng ghế (ràng buộc toàn vẹn) ─────────
-- Xem ràng buộc UNIQUE(showtime_id, seat_id) ở dòng "UNIQUE KEY"
SHOW CREATE TABLE booking_seats;

-- Đếm số ghế đã bán của 1 suất (đổi st<id> -> số showtime_id)
SELECT bs.showtime_id, COUNT(*) AS ghe_da_ban
FROM booking_seats bs JOIN bookings b ON b.booking_id = bs.booking_id
WHERE b.status IN ('pending','confirmed') AND bs.showtime_id = 1
GROUP BY bs.showtime_id;


-- ───────── KB3: Tự động tích điểm ─────────
-- Chạy TRƯỚC và SAU khi khách đặt vé để so điểm
SELECT customer_id, full_name, points, tier_id, last_visit
FROM customers WHERE email = 'an.nguyen@email.com';


-- ───────── KB4: Soát vé (check-in) ─────────
SELECT booking_code, status, checked_in, checked_in_at, checked_in_by
FROM bookings WHERE booking_code = 'AB1234';


-- ───────── KB5: Hoàn tiền → ghế trả lại ─────────
-- Sau khi admin bấm Hoàn tiền: status='refunded' và số ghế còn = 0
SELECT booking_code, status FROM bookings WHERE booking_code = 'AB1234';
SELECT COUNT(*) AS so_ghe_con FROM booking_seats
WHERE booking_id = (SELECT booking_id FROM bookings WHERE booking_code = 'AB1234');


-- ───────── KB6: Báo cáo doanh thu = số thật từ DB ─────────
-- Khớp với "Tổng doanh thu" trên dashboard admin
SELECT COUNT(*) AS so_ve, SUM(total_amount) AS doanh_thu
FROM bookings WHERE status = 'confirmed';

-- Doanh thu theo phim (top phim)
SELECT m.title, COUNT(b.booking_id) AS so_ve, SUM(b.total_amount) AS doanh_thu
FROM bookings b
JOIN showtimes s ON s.showtime_id = b.showtime_id
JOIN movies m    ON m.movie_id = s.movie_id
WHERE b.status = 'confirmed'
GROUP BY m.movie_id ORDER BY doanh_thu DESC LIMIT 5;


-- ───────── KB7: Admin thêm phim/suất → khách thấy ngay ─────────
SELECT movie_id, title, status, release_date FROM movies ORDER BY movie_id DESC LIMIT 5;
SELECT showtime_id, movie_id, room_id, show_date, show_time FROM showtimes ORDER BY showtime_id DESC LIMIT 5;


-- ───────── Vòng đời 1 tấm vé (KB "hết phim rồi sau") ─────────
SELECT booking_code, status, checked_in, checked_in_at, created_at
FROM bookings WHERE booking_code = 'AB1234';

-- Tổng quan trạng thái tất cả vé (đặt/huỷ/hoàn/đã soát)
SELECT status, COUNT(*) AS so_luong, SUM(checked_in) AS da_soat
FROM bookings GROUP BY status;
