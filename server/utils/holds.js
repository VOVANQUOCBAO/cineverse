/* ============================================================
   Giữ ghế tạm thời (in-memory, TTL 8 phút).
   Đủ cho đồ án — production sẽ thay bằng Redis + WebSocket.
   Cấu trúc: holds[showtimeId] = Map(seatCode -> { userId, expiresAt })
   ============================================================ */
const TTL_MS = 8 * 60 * 1000;
const holds = new Map();

function bucket(showtimeId) {
  if (!holds.has(showtimeId)) holds.set(showtimeId, new Map());
  return holds.get(showtimeId);
}

function purge(b) {
  const now = Date.now();
  for (const [code, h] of b) if (h.expiresAt <= now) b.delete(code);
}

// Ghế đang bị người KHÁC giữ (còn hạn)
function heldByOthers(showtimeId, userId) {
  const b = bucket(showtimeId);
  purge(b);
  const out = [];
  for (const [code, h] of b) if (h.userId !== userId) out.push(code);
  return out;
}

// Thử giữ. Trả { ok, taken[], expiresAt }
function hold(showtimeId, seatCodes, userId) {
  const b = bucket(showtimeId);
  purge(b);
  const taken = seatCodes.filter((c) => b.has(c) && b.get(c).userId !== userId);
  if (taken.length) return { ok: false, taken };
  const expiresAt = Date.now() + TTL_MS;
  seatCodes.forEach((c) => b.set(c, { userId, expiresAt }));
  return { ok: true, expiresAt: new Date(expiresAt).toISOString() };
}

function release(showtimeId, seatCodes, userId) {
  const b = bucket(showtimeId);
  seatCodes.forEach((c) => {
    if (b.has(c) && b.get(c).userId === userId) b.delete(c);
  });
}

// Gỡ hold sau khi đã đặt thành công
function clear(showtimeId, seatCodes) {
  const b = bucket(showtimeId);
  seatCodes.forEach((c) => b.delete(c));
}

module.exports = { hold, release, clear, heldByOthers, TTL_MS };
