/* ============================================================
   CINEVERSE — quy ước ID giữa frontend (chuỗi) và DB (INT)
   Frontend dùng "m1", "c1", "st1", "r1", "u1", "rv1"...
   DB dùng surrogate INT auto-increment.
   Ta map theo prefix + số: "m" + movie_id, "c" + cinema_id...
   ============================================================ */

// Tạo ID chuỗi từ số DB
const mid = (n) => "m" + n; // movie
const cid = (n) => "c" + n; // cinema
const rid = (n) => "r" + n; // room
const sid = (n) => "st" + n; // showtime
const uid = (n) => "u" + n; // customer/user
const rvid = (n) => "rv" + n; // review

// Bóc số INT từ ID chuỗi. Trả null nếu không hợp lệ.
function parseId(str, prefix) {
  if (str == null) return null;
  const s = String(str);
  if (prefix && !s.startsWith(prefix)) {
    // cho phép truyền thẳng số
    const n = Number(s);
    return Number.isInteger(n) && n > 0 ? n : null;
  }
  const num = Number(s.slice(prefix ? prefix.length : 0));
  return Number.isInteger(num) && num > 0 ? num : null;
}

module.exports = { mid, cid, rid, sid, uid, rvid, parseId };
