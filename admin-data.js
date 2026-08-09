/* ============================================================
   CINEVERSE — Admin data (B5b: API-backed)
   Chạy sau data.js. KHÔNG còn bịa số liệu ở client.
   Dữ liệu admin (khách hàng, vé, doanh thu, công suất, top phim)
   được TẢI THẬT từ /api sau khi đăng nhập admin/manager qua
   CINE.loadAdminData(). Nhân viên (staff) tạm giữ seed vì chưa
   có endpoint /staff.
   ============================================================ */
(function () {
  const C = window.CINE;

  // ── Nhân viên (seed — chưa có endpoint /staff) ────────────
  C.staff = [
    { id:"st1", name:"Trần Thị Lan", email:"lan.tran@cineverse.vn", phone:"0912 345 678", role:"staff", position:"Nhân viên bán vé", cinemaId:"c1", hireDate:"2024-03-15", avatar:"#38d39f", status:"active", salary:8500000 },
    { id:"st2", name:"Lê Văn Bình", email:"binh.le@cineverse.vn", phone:"0923 456 789", role:"staff", position:"Nhân viên soát vé", cinemaId:"c1", hireDate:"2023-11-20", avatar:"#6ea8ff", status:"active", salary:8000000 },
    { id:"st3", name:"Phạm Thị Hoa", email:"hoa.pham@cineverse.vn", phone:"0934 567 890", role:"manager", position:"Quản lý rạp", cinemaId:"c2", hireDate:"2022-06-01", avatar:"#a78bfa", status:"active", salary:18000000 },
    { id:"st4", name:"Nguyễn Minh Tuấn", email:"tuan.nguyen@cineverse.vn", phone:"0945 678 901", role:"staff", position:"Nhân viên bán vé", cinemaId:"c3", hireDate:"2025-01-10", avatar:"#f59e42", status:"active", salary:8500000 },
    { id:"st5", name:"Đỗ Thị Mai", email:"mai.do@cineverse.vn", phone:"0956 789 012", role:"staff", position:"Nhân viên phục vụ", cinemaId:"c2", hireDate:"2024-09-05", avatar:"#f87171", status:"inactive", salary:7500000 },
    { id:"st6", name:"Vũ Hoàng Long", email:"long.vu@cineverse.vn", phone:"0967 890 123", role:"staff", position:"Kỹ thuật viên chiếu phim", cinemaId:"c1", hireDate:"2023-04-18", avatar:"#60c0f0", status:"active", salary:11000000 },
    { id:"st7", name:"Bùi Thị Yến", email:"yen.bui@cineverse.vn", phone:"0978 901 234", role:"manager", position:"Quản lý rạp", cinemaId:"c4", hireDate:"2021-09-01", avatar:"#fbbf24", status:"active", salary:20000000 },
    { id:"st8", name:"Hoàng Văn Đức", email:"duc.hoang@cineverse.vn", phone:"0989 012 345", role:"admin", position:"Quản trị hệ thống", cinemaId:null, hireDate:"2021-01-05", avatar:"#ff5a5f", status:"active", salary:35000000 },
  ];

  // ── Khởi tạo rỗng để helper không lỗi trước khi load ──────
  C.customers = [];
  C.allBookings = [];
  C.revenueDaily = [];
  C.revenueMonthly = [];
  C.occupancy = {};
  C.topMovies = [];
  C.adminLoaded = false;

  // ── Tải dữ liệu admin THẬT từ API (cần token admin/manager) ──
  let _adminPromise = null;
  C.loadAdminData = function (force) {
    if (_adminPromise && !force) return _adminPromise;
    _adminPromise = (async () => {
      const [usersR, bkR, revD, revM, occR, topR, staffR] = await Promise.all([
        API.users().catch(() => ({ data: [] })),
        API.bookings("?limit=300").catch(() => ({ data: [] })),
        API.reportRevenue("?period=daily").catch(() => ({ data: [] })),
        API.reportRevenue("?period=monthly").catch(() => ({ data: [] })),
        API.reportOccupancy().catch(() => ({ cinemas: [] })),
        API.reportTopMovies("?limit=6").catch(() => ({ data: [] })),
        API.staff().catch(() => ({ data: null })),
      ]);

      // Nhân viên (từ DB; nếu lỗi giữ seed fallback đã set ở trên)
      if (staffR.data) C.staff = staffR.data;

      // Khách hàng (CRM)
      C.customers = (usersR.data || []).map((u) => ({
        id: u.id, name: u.name, email: u.email, phone: u.phone || "",
        avatar: u.avatar || "#6ea8ff",
        joined: u.joinedDate || "",
        lastVisit: u.lastVisit || u.joinedDate || "",
        totalBookings: u.bookings || 0,
        totalSpent: u.totalSpent || 0,
        points: u.points || 0,
        tier: u.tier || "Bronze",
      }));

      // Lịch sử đặt vé — API trả mới→cũ; lưu cũ→mới để khớp các màn cũ
      C.allBookings = (bkR.data || []).slice().reverse().map((b) => ({
        ...b,
        createdAt: b.createdAt || b.date,
      }));

      // Doanh thu theo ngày → {date,label,revenue,tickets}
      C.revenueDaily = (revD.data || []).map((d) => {
        const dt = new Date(d.date);
        return { date: d.date, label: dt.getDate() + "/" + (dt.getMonth() + 1), revenue: d.revenue, tickets: d.tickets };
      });
      // Doanh thu theo tháng → {label:"T6",revenue,tickets}
      C.revenueMonthly = (revM.data || []).map((d) => ({
        label: d.month ? "T" + Number(d.month.slice(5)) : "",
        revenue: d.revenue, tickets: d.tickets,
      }));

      // Công suất theo rạp → object keyed cinemaId {name,rate}
      C.occupancy = {};
      (occR.cinemas || []).forEach((c) => {
        C.occupancy[c.cinemaId] = { name: c.name, rate: c.rate, seatsSold: c.seatsSold };
      });

      // Top phim → {movieId,title,tickets,revenue}
      C.topMovies = (topR.data || []).map((m) => ({
        movieId: m.movieId, title: m.title, tickets: m.seatsSold, revenue: m.revenue,
      }));

      C.adminLoaded = true;
      return C;
    })();
    return _adminPromise;
  };

  // ── Helpers (đọc mảng live tại thời điểm gọi) ─────────────
  C.customerById = (id) => C.customers.find((c) => c.id === id);
  C.staffById = (id) => C.staff.find((s) => s.id === id);
  C.bookingsByMovie = (mid) => C.allBookings.filter((b) => b.movieId === mid);
  C.bookingsByCustomer = (uid) => C.allBookings.filter((b) => b.userId === uid);
  C.totalRevenue = () => C.allBookings.filter((b) => b.status === "confirmed").reduce((s, b) => s + b.total, 0);
  C.todayBookings = () => {
    const today = new Date().toISOString().slice(0, 10);
    return C.allBookings.filter((b) => b.date === today || (C.dates[0] && b.date === C.dates[0].key));
  };
  C.formatCompact = (n) => n >= 1e9 ? (n/1e9).toFixed(1)+"B" : n >= 1e6 ? (n/1e6).toFixed(0)+"M" : n >= 1e3 ? (n/1e3).toFixed(0)+"K" : n;
})();
