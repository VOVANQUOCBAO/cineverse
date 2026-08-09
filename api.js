/* ============================================================
   CINEVERSE — API client (gọi backend Express tại /api)
   window.API — wrapper fetch + quản lý JWT access token.
   Load TRƯỚC data.js / auth.jsx.
   ============================================================ */
(function () {
  const BASE = "/api";
  const TOKEN_KEY = "cineverse_token_v1";
  let accessToken = null;
  try { accessToken = localStorage.getItem(TOKEN_KEY) || null; } catch (e) {}

  function setToken(t) {
    accessToken = t || null;
    try {
      if (t) localStorage.setItem(TOKEN_KEY, t);
      else localStorage.removeItem(TOKEN_KEY);
    } catch (e) {}
  }

  // Gắn token vào URL ảnh/tài nguyên khi cần (preview serving)
  const withT = window.__withT || ((u) => u);

  async function req(method, path, body) {
    const res = await fetch(withT(BASE + path), {
      method,
      headers: {
        "Content-Type": "application/json",
        ...(accessToken ? { Authorization: "Bearer " + accessToken } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    let data = null;
    try { data = await res.json(); } catch (e) {}
    if (!res.ok) {
      if (res.status === 401) {
        setToken(null);
        try { localStorage.removeItem("cineverse_auth_v1"); } catch (e) {}
        const err = new Error("Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.");
        err.status = 401;
        err.code = (data && data.error) || "INVALID_TOKEN";
        err.data = data;
        throw err;
      }
      const err = new Error((data && (data.message || data.error)) || "HTTP " + res.status);
      err.status = res.status;
      err.code = data && data.error;
      err.data = data;
      throw err;
    }
    return data;
  }

  // Gửi multipart/form-data (upload file) — KHÔNG set Content-Type để browser tự gắn boundary
  async function upload(path, formData) {
    const res = await fetch(withT(BASE + path), {
      method: "POST",
      headers: { ...(accessToken ? { Authorization: "Bearer " + accessToken } : {}) },
      body: formData,
    });
    let data = null;
    try { data = await res.json(); } catch (e) {}
    if (!res.ok) {
      const err = new Error((data && (data.message || data.error)) || "HTTP " + res.status);
      err.status = res.status; err.code = data && data.error; err.data = data;
      throw err;
    }
    return data;
  }

  const API = {
    get token() { return accessToken; },
    setToken,

    // Auth
    login: (email, password) => req("POST", "/auth/login", { email, password }),
    register: (b) => req("POST", "/auth/register", b),
    googleConfig: () => req("GET", "/auth/google/config"),
    googleLogin: (credential) => req("POST", "/auth/google", { credential }),

    // Movies + reviews
    movies: (qs) => req("GET", "/movies" + (qs || "")),
    movie: (id) => req("GET", "/movies/" + id),
    movieReviews: (id, sort) => req("GET", "/movies/" + id + "/reviews" + (sort ? "?sort=" + sort : "")),
    addReview: (id, b) => req("POST", "/movies/" + id + "/reviews", b),
    reviews: () => req("GET", "/reviews"),
    // Movies CRUD (admin/manager)
    createMovie: (b) => req("POST", "/movies", b),
    updateMovie: (id, b) => req("PUT", "/movies/" + id, b),
    deleteMovie: (id) => req("DELETE", "/movies/" + id),
    uploadPoster: (id, file) => {
      const fd = new FormData();
      fd.append("poster", file);
      return upload("/movies/" + id + "/poster", fd);
    },

    // Showtimes + seats
    showtimes: (qs) => req("GET", "/showtimes" + (qs || "")),
    seats: (id) => req("GET", "/showtimes/" + id + "/seats"),
    holdSeats: (id, seats) => req("POST", "/showtimes/" + id + "/hold-seats", { seats }),
    releaseSeats: (id, seats) => req("POST", "/showtimes/" + id + "/release-seats", { seats }),

    // Bookings
    createBooking: (b) => req("POST", "/bookings", b),
    booking: (code) => req("GET", "/bookings/" + code),
    checkin: (code) => req("POST", "/bookings/" + code + "/checkin", {}),
    refund: (id) => req("PATCH", "/bookings/" + id + "/refund", {}),
    cancelBooking: (id) => req("PATCH", "/bookings/" + id + "/cancel", {}),
    bookings: (qs) => req("GET", "/bookings" + (qs || "")), // danh sách vé (admin/manager)

    // Showtimes CRUD (admin/manager)
    createShowtime: (b) => req("POST", "/showtimes", b),
    updateShowtime: (id, b) => req("PUT", "/showtimes/" + id, b),
    deleteShowtime: (id) => req("DELETE", "/showtimes/" + id),

    // User
    me: () => req("GET", "/users/me"),
    myBookings: () => req("GET", "/users/me/bookings"),
    users: (qs) => req("GET", "/users" + (qs || "")), // CRM (admin/manager)
    staff: () => req("GET", "/staff"),                 // danh sách nhân viên (admin/manager)
    createStaff: (b) => req("POST", "/staff", b),
    updateStaff: (id, b) => req("PUT", "/staff/" + id, b),
    deleteStaff: (id) => req("DELETE", "/staff/" + id),

    // Reports (admin/manager)
    reportRevenue: (qs) => req("GET", "/reports/revenue" + (qs || "")),
    reportOccupancy: () => req("GET", "/reports/occupancy"),
    reportTopMovies: (qs) => req("GET", "/reports/top-movies" + (qs || "")),

    // Danh mục
    cinemas: () => req("GET", "/cinemas"),
    rooms: () => req("GET", "/rooms"),
    concessions: () => req("GET", "/concessions"),
    genres: () => req("GET", "/genres"),
    tiers: () => req("GET", "/tiers"),
  };

  window.API = API;
})();
