/* ============================================================
   Logic ưu đãi/khuyến mãi — dùng cho POST /bookings.
   ⚠️ GIỮ ĐỒNG BỘ với hàm computePromo() trong booking.jsx (frontend),
   vì server là nguồn chân lý tính tổng tiền lưu vào DB.

   Quy tắc:
   - Mã (nhập tay) ĐÈ ưu đãi tự động (không cộng dồn):
       SV2026   → giảm 20% tiền vé (Combo Sinh Viên)
       TRIO2026 → tặng vé rẻ nhất (cần >= 3 vé)  (Mua 2 Tặng 1)
   - Không mã → tự động, lấy ưu đãi có lợi hơn:
       Thứ 4         → giảm 30% tiền vé
       Suất < 11:30  → giảm 15.000đ / vé
   - Giảm giá chỉ áp lên TIỀN VÉ, không áp lên bắp nước.
   ============================================================ */

// Chuẩn hoá về 'YYYY-MM-DD' rồi tính thứ trong tuần (0=CN ... 3=Thứ 4)
function weekdayOf(dateLike) {
  let s;
  if (dateLike instanceof Date) {
    s = `${dateLike.getFullYear()}-${String(dateLike.getMonth() + 1).padStart(2, "0")}-${String(dateLike.getDate()).padStart(2, "0")}`;
  } else {
    s = String(dateLike).slice(0, 10);
  }
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d).getDay();
}

// { ticketSubtotal, seatPrices:[number], date, time, code } -> { discount, label, code, error }
function computeDiscount({ ticketSubtotal, seatPrices, date, time, code }) {
  const norm = String(code || "").trim().toUpperCase();
  const n = seatPrices.length;

  if (norm) {
    if (norm === "SV2026")
      return { discount: Math.min(Math.round(ticketSubtotal * 0.2), ticketSubtotal), label: "Combo Sinh Viên (SV2026) −20%", code: norm };
    if (norm === "TRIO2026") {
      if (n < 3) return { discount: 0, code: norm, error: "Mã MUA 2 TẶNG 1 cần chọn ít nhất 3 vé." };
      return { discount: Math.min.apply(null, seatPrices), label: "Mua 2 Tặng 1 (TRIO2026) — tặng vé rẻ nhất", code: norm };
    }
    return { discount: 0, code: norm, error: "Mã ưu đãi không hợp lệ." };
  }

  // Tự động (không nhập mã)
  const wedDisc = weekdayOf(date) === 3 ? Math.round(ticketSubtotal * 0.3) : 0;
  const earlyDisc = String(time).slice(0, 5) < "11:30" ? 15000 * n : 0;
  if (wedDisc >= earlyDisc && wedDisc > 0)
    return { discount: Math.min(wedDisc, ticketSubtotal), label: "Thứ 4 Vui Vẻ −30%", code: null, auto: true };
  if (earlyDisc > 0)
    return { discount: Math.min(earlyDisc, ticketSubtotal), label: "Suất chiếu sớm −15k/vé", code: null, auto: true };
  return { discount: 0, code: null };
}

module.exports = { computeDiscount, weekdayOf };
