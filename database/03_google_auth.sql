-- Chạy một lần cho database CINEVERSE/CINEFILM đã tồn tại trước khi có Google Sign-In.
ALTER TABLE customers
  ADD COLUMN google_sub VARCHAR(255) NULL AFTER password_hash;

CREATE UNIQUE INDEX ux_customers_google_sub ON customers (google_sub);
