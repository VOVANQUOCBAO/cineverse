/* ============================================================
   CINEVERSE — Persistence layer (localStorage)
   Runs after data.js — provides STORE global
   All data survives page reload.
   ============================================================ */
(function () {
  const KEYS = {
    bookings:   "cf_bookings_v2",
    movies:     "cf_movies_v2",
    usedTickets:"cf_used_v2",
    reviews:    "cf_reviews_v2",
    staff:      "cf_staff_v2",
    customers:  "cf_customers_v2",
    adminBk:    "cf_admin_bk_v2",
  };

  function load(key, fallback) {
    try { const s = localStorage.getItem(key); return s ? JSON.parse(s) : fallback; }
    catch(e) { return fallback; }
  }
  function save(key, val) {
    try { localStorage.setItem(key, JSON.stringify(val)); } catch(e) {}
  }

  /* ── Merge admin booking history with localStorage ── */
  let adminBookings = load(KEYS.adminBk, null);
  if (!adminBookings) {
    // first run — seed from generated data
    adminBookings = window.CINE.allBookings;
    save(KEYS.adminBk, adminBookings);
  } else {
    // re-expose persisted bookings
    window.CINE.allBookings = adminBookings;
  }

  /* ── Merge movies ── */
  let savedMovies = load(KEYS.movies, null);
  if (savedMovies) window.CINE.movies = savedMovies;

  /* ── Merge reviews ── */
  let savedReviews = load(KEYS.reviews, null);
  if (savedReviews) window.CINE.reviews = savedReviews;

  /* ── Used tickets (soát vé) ── */
  const usedSet = new Set(load(KEYS.usedTickets, []));

  const STORE = {
    /* ─── Customer bookings (đặt vé từ trang khách hàng) ─── */
    loadCustomerBookings() {
      return load(KEYS.bookings, []);
    },
    saveCustomerBookings(arr) {
      save(KEYS.bookings, arr);
    },
    addCustomerBooking(booking) {
      const arr = this.loadCustomerBookings();
      arr.push(booking);
      save(KEYS.bookings, arr);
      // also push into admin allBookings
      const ab = [...window.CINE.allBookings, {
        id: "b_" + booking.code,
        code: booking.code,
        movieId: booking.showtime.movieId,
        cinemaId: booking.showtime.cinemaId,
        userId: "u1",
        date: booking.showtime.date,
        time: booking.showtime.time,
        format: booking.showtime.format,
        seatCount: booking.seats.length,
        seatType: booking.seats[0]?.type || "regular",
        total: booking.grand,
        status: "confirmed",
        createdAt: new Date(booking.createdAt).toISOString(),
        method: booking.method,
      }];
      window.CINE.allBookings = ab;
      save(KEYS.adminBk, ab);
    },

    /* ─── Lookup by QR code ─── */
    getBookingByCode(code) {
      // search admin allBookings first
      const ab = window.CINE.allBookings.find(b => b.code === code);
      if (ab) return { ...ab, _source: "admin" };
      // then customer bookings
      const cb = this.loadCustomerBookings().find(b => b.code === code);
      if (cb) return { ...cb, _source: "customer" };
      return null;
    },

    /* ─── Used tickets (QR soát vé) ─── */
    isUsed(code) { return usedSet.has(code); },
    markUsed(code) {
      usedSet.add(code);
      save(KEYS.usedTickets, [...usedSet]);
    },

    /* ─── Admin: movies CRUD ─── */
    saveMovies(movies) {
      window.CINE.movies = movies;
      save(KEYS.movies, movies);
    },

    /* ─── Admin: bookings update (refund/cancel) ─── */
    updateBookingStatus(id, status) {
      const arr = window.CINE.allBookings.map(b => b.id === id ? { ...b, status } : b);
      window.CINE.allBookings = arr;
      save(KEYS.adminBk, arr);
    },

    /* ─── Reviews ─── */
    saveReviews(reviews) {
      window.CINE.reviews = reviews;
      save(KEYS.reviews, reviews);
    },
    addReview(review) {
      const arr = [review, ...window.CINE.reviews];
      this.saveReviews(arr);
    },

    /* ─── Clear all (for dev/demo reset) ─── */
    reset() {
      Object.values(KEYS).forEach(k => localStorage.removeItem(k));
      window.location.reload();
    },
  };

  window.STORE = STORE;
})();
