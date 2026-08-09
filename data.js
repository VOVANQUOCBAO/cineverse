/* ============================================================
   CINEVERSE — Data layer v3 (API-backed)
   Dữ liệu lấy TỪ BACKEND (/api) thay vì hardcode/localStorage.
   Giữ nguyên shape window.CINE + helpers để các màn hình cũ
   không phải đổi. Boot bất đồng bộ; chờ qua CINE.ready.
   ============================================================ */
(function () {
  const PRICE = { regular: 75000, vip: 110000, couple: 220000 };

  // ─── Sơ đồ ghế dự phòng (chỉ dùng nếu API ghế lỗi) ───
  function buildSeatLayout(seed) {
    const rows = ["A", "B", "C", "D", "E", "F", "G", "H"];
    function hash(s) {
      let h = 2166136261;
      for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
      return h >>> 0;
    }
    return rows.map((row, ri) => {
      const isCouple = row === "H";
      const seatCols = isCouple ? 6 : 12;
      const seats = Array.from({ length: seatCols }, (_, ci) => {
        let type = isCouple ? "couple" : (ri >= 3 && ri <= 5 && ci >= 2 && ci <= 9) ? "vip" : "regular";
        const code = row + (ci + 1);
        const h = hash(String(seed) + code);
        const status = h % 7 === 0 ? "booked" : h % 23 === 0 ? "held" : "available";
        return { code, row, col: ci + 1, type, status };
      });
      return { row, isCouple, seats };
    });
  }

  // ─── Dựng dải ngày từ các suất chiếu thật trong DB ───
  function buildDatesFromShowtimes(showtimes) {
    const wd = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];
    const now = new Date();
    const today = [
      now.getFullYear(),
      String(now.getMonth() + 1).padStart(2, "0"),
      String(now.getDate()).padStart(2, "0"),
    ].join("-");
    const keys = [...new Set(showtimes.map((s) => s.date))].sort();
    return keys.map((key) => {
      const d = new Date(key + "T09:00:00");
      return {
        key,
        wd: key === today ? "Hôm nay" : wd[d.getDay()],
        dd: String(d.getDate()).padStart(2, "0"),
        mm: String(d.getMonth() + 1).padStart(2, "0"),
      };
    });
  }

  // ─── Helpers (đọc mảng live của CINE tại thời điểm gọi) ───
  const formatVND = (n) => Number(n || 0).toLocaleString("vi-VN") + "đ";
  const F = formatVND;
  const movieById = (id) => CINE.movies.find((m) => m.id === id);
  const cinemaById = (id) => CINE.cinemas.find((c) => c.id === id);
  const roomById = (id) => CINE.rooms.find((r) => r.id === id);
  const reviewsFor = (movieId) => CINE.reviews.filter((r) => r.movieId === movieId);
  const avgScore = (movieId) => {
    const rs = reviewsFor(movieId);
    return rs.length ? rs.reduce((a, b) => a + b.rating, 0) / rs.length : 0;
  };

  // CINE khởi tạo rỗng, được đổ đầy khi boot() xong
  const CINE = {
    movies: [], cinemas: [], rooms: [], showtimes: [], dates: [],
    reviews: [], concessions: [], user: null,
    PRICE, buildSeatLayout, buildDatesFromShowtimes,
    formatVND, F, movieById, cinemaById, roomById, reviewsFor, avgScore,
    reload: boot, // gọi lại để làm mới dữ liệu
  };

  async function boot() {
    const [mv, cn, rm, st, rv, cc] = await Promise.all([
      API.movies("?status=all&limit=100"),
      API.cinemas(),
      API.rooms(),
      API.showtimes(),
      API.reviews(),
      API.concessions(),
    ]);
    CINE.movies = mv.data;
    CINE.cinemas = cn.data;
    CINE.rooms = rm.data;
    CINE.showtimes = st.data;
    CINE.reviews = rv.data;
    CINE.concessions = cc.data;
    CINE.dates = buildDatesFromShowtimes(st.data);

    // patch đường dẫn poster với token (preview serving)
    if (window.__withT) {
      CINE.movies.forEach((m) => {
        if (m.poster && m.poster.indexOf("?t=") < 0 && m.poster.indexOf("&t=") < 0)
          m.poster = window.__withT(m.poster);
      });
    }
    return CINE;
  }

  CINE.ready = boot();
  window.CINE = CINE;
})();
