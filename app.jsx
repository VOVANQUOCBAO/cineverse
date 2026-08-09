/* ============================================================
   CINEVERSE — App shell v2: Auth routing + all role apps
   ============================================================ */

function genCode() {
  const a = "ABCDEFGHJKLMNPQRSTUVWXYZ", n = "0123456789";
  let s = "";
  for (let i=0;i<3;i++) s+=a[Math.floor(Math.random()*a.length)];
  for (let i=0;i<4;i++) s+=n[Math.floor(Math.random()*n.length)];
  return s;
}

/* ─── Error Boundary ──────────────────────────────────────────── */
function SystemState({ title, message, detail, onRetry, icon = "info" }) {
  return (
    <main className="system-state">
      <section className="system-state-card" aria-live="polite">
        <div className="system-state-brand">
          <span className="logo-mark"><Icon name="film" size={20} color="#1a1404" stroke={2} /></span>
          <span>CINE<b>VERSE</b></span>
        </div>
        <div className="system-state-icon"><Icon name={icon} size={28} color="var(--gold)" /></div>
        <p className="system-state-kicker">Trạng thái hệ thống</p>
        <h1>{title}</h1>
        <p className="system-state-message">{message}</p>
        {detail && <code className="system-state-detail">{detail}</code>}
        <div className="system-state-actions">
          <button className="btn btn-gold" onClick={onRetry || (() => window.location.reload())}>Thử kết nối lại</button>
          {onRetry && <button className="btn btn-ghost" onClick={() => window.location.reload()}>Tải lại trang</button>}
        </div>
        <p className="system-state-help">Nếu lỗi vẫn lặp lại, hãy kiểm tra MySQL/XAMPP và tiến trình <code>node server/index.js</code>.</p>
      </section>
    </main>
  );
}

class ErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { error:null }; }
  static getDerivedStateFromError(e) { return { error:e }; }
  componentDidCatch(e,info) { console.error("CINEVERSE error:",e,info); }
  render() {
    if (this.state.error) {
      return (
        <SystemState
          title="Màn hình này chưa thể hiển thị"
          message="CINEVERSE gặp lỗi khi dựng giao diện. Dữ liệu và tài khoản của bạn vẫn được giữ nguyên."
          detail={String(this.state.error.message || this.state.error)}
          onRetry={() => this.setState({ error:null })}
        />
      );
    }
    return this.props.children;
  }
}

/* ─── Search modal ────────────────────────────────────────────── */
function SearchModal({ onClose, onOpen }) {
  const [q, setQ] = React.useState("");
  const res = CINE.movies.filter(m =>
    (m.title+" "+m.titleEn+" "+m.genres.join(" ")).toLowerCase().includes(q.toLowerCase())
  );
  return (
    <Modal onClose={onClose} width={560}>
      <div style={{ padding:20 }}>
        <div style={{ display:"flex", alignItems:"center", gap:12, background:"var(--bg)", border:"1px solid var(--line-2)", borderRadius:12, padding:"13px 16px" }}>
          <Icon name="search" size={20} color="var(--muted)" />
          <input autoFocus value={q} onChange={e=>setQ(e.target.value)} placeholder="Tìm phim, thể loại..."
            style={{ flex:1, background:"none", border:"none", color:"var(--text)", fontFamily:"inherit", fontSize:16, outline:"none" }} />
          <button className="chip" onClick={onClose} style={{ padding:"5px 10px" }}>Esc</button>
        </div>
        <div style={{ marginTop:16, maxHeight:380, overflowY:"auto" }}>
          {res.map(m=>(
            <div key={m.id} onClick={()=>{ onOpen(m); onClose(); }}
              style={{ display:"flex", gap:14, padding:10, borderRadius:12, cursor:"pointer", alignItems:"center" }}
              onMouseEnter={e=>e.currentTarget.style.background="var(--surface-2)"}
              onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
              <div style={{ width:44, flex:"none" }}><Poster movie={m} titleSize={10} /></div>
              <div style={{ flex:1 }}>
                <div style={{ fontWeight:600 }}>{m.title}</div>
                <div className="muted" style={{ fontSize:12.5 }}>{m.genres.join(", ")} · {m.duration}'</div>
              </div>
              <span className="badge badge-format">{m.status==="now"?"Đang chiếu":"Sắp chiếu"}</span>
            </div>
          ))}
          {res.length===0 && <div className="empty" style={{ padding:30 }}>Không tìm thấy phim phù hợp.</div>}
        </div>
      </div>
    </Modal>
  );
}

/* ─── Showtimes overview (customer nav) ───────────────────────── */
function ShowtimesPage({ onPick }) {
  const [date, setDate] = React.useState(CINE.dates[0]?.key || "");
  const [cinemaId, setCinemaId] = React.useState(CINE.cinemas[0]?.id || "");
  React.useEffect(() => { window.scrollTo(0,0); }, []);
  const sts = CINE.showtimes.filter(s=>s.date===date&&s.cinemaId===cinemaId);
  const byMovie = {};
  sts.forEach(s=>(byMovie[s.movieId]=byMovie[s.movieId]||[]).push(s));
  return (
    <div className="wrap section fade-up">
      <div className="section-head"><h2 className="section-title"><span className="bar" />Lịch chiếu theo rạp</h2></div>
      <div style={{ display:"flex", gap:9, flexWrap:"wrap", marginBottom:20 }}>
        {CINE.cinemas.map(c=>(
          <button key={c.id} className={"chip "+(cinemaId===c.id?"active":"")} onClick={()=>setCinemaId(c.id)}>
            <Icon name="location" size={14} />{c.name}
          </button>
        ))}
      </div>
      <div className="date-strip" style={{ marginBottom:30 }}>
        {CINE.dates.map(d=>(
          <div key={d.key} className={"date-pill "+(date===d.key?"on":"")} onClick={()=>setDate(d.key)}>
            <div className="wd">{d.wd}</div><div className="dd">{d.dd}</div><div className="wd">/{d.mm}</div>
          </div>
        ))}
      </div>
      {Object.keys(byMovie).length===0 && <div className="empty">Không có suất chiếu cho lựa chọn này.</div>}
      {Object.keys(byMovie).map(mid=>{ const m=CINE.movieById(mid); if(!m) return null; return (
        <div key={mid} className="card" style={{ padding:22, marginBottom:18, display:"flex", gap:20 }}>
          <div style={{ width:92, flex:"none" }}><Poster movie={m} titleSize={14} /></div>
          <div style={{ flex:1 }}>
            <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:4 }}>
              <AgeBadge age={m.age} />
              <h3 style={{ fontSize:22, textTransform:"uppercase" }}>{m.title}</h3>
            </div>
            <div className="mcard-meta" style={{ marginBottom:14 }}><span>{m.genres.join(", ")}</span><span className="dot" /><span>{m.duration}'</span></div>
            <div className="st-grid">
              {byMovie[mid].map(s=>(
                <div key={s.id} className="st-pill" onClick={()=>onPick(s)}>
                  <div className="t">{s.time}</div><div className="p">{s.format}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      );})}
    </div>
  );
}

/* ─── Promo page ──────────────────────────────────────────────── */
const PROMOS = [
  {
    id: "p1",
    tag: "-30%",
    title: "Thứ 4 Vui Vẻ",
    short: "Giảm 30% toàn bộ vé 2D mỗi thứ 4 hàng tuần.",
    c: ["#2A1A12","#C2410C"],
    category: "Giảm giá",
    code: null,
    validity: "Mỗi thứ 4 hàng tuần",
    applies: "Vé 2D tất cả phim đang chiếu",
    howToUse: "Giảm giá tự động khi đặt vé vào thứ 4. Không cần nhập mã — hệ thống áp dụng tự động lúc thanh toán.",
    conditions: [
      "Chỉ áp dụng vé 2D tiêu chuẩn",
      "Không áp dụng vé IMAX, 3D, Gold Class",
      "Tối đa 4 vé/tài khoản/tuần",
      "Không kết hợp với ưu đãi khác",
    ],
    icon: "🎬",
  },
  {
    id: "p2",
    tag: "79K",
    title: "Combo Sinh Viên",
    short: "Vé + bắp lớn + nước chỉ 79.000đ khi xuất trình thẻ sinh viên.",
    c: ["#101A2E","#3B5BA9"],
    category: "Combo",
    code: "SV2026",
    validity: "Đến 31/12/2026",
    applies: "Vé 2D + bắp lớn + nước lớn",
    howToUse: "Nhập mã SV2026 ở bước thanh toán. Xuất trình thẻ sinh viên hợp lệ tại quầy khi nhận vé.",
    conditions: [
      "Áp dụng cho học sinh, sinh viên có thẻ hợp lệ",
      "Mỗi thẻ sinh viên dùng tối đa 2 lần/tuần",
      "Chỉ áp dụng suất chiếu trước 17:00",
      "Không áp dụng ngày lễ, Tết",
    ],
    icon: "🎓",
  },
  {
    id: "p3",
    tag: "x2",
    title: "Thành Viên Bạc — Điểm Đôi",
    short: "Tích gấp đôi điểm mỗi giao dịch trong tháng 6. Đổi vé miễn phí khi đủ 100 điểm.",
    c: ["#14122E","#6D28D9"],
    category: "Thành viên",
    code: null,
    validity: "Tháng 6/2026",
    applies: "Tất cả giao dịch đặt vé online",
    howToUse: "Điểm tự động nhân đôi khi đăng nhập tài khoản thành viên. Đổi điểm lấy vé tại mục 'Vé của tôi → Đổi điểm'.",
    conditions: [
      "Chỉ áp dụng tài khoản Thành Viên Bạc trở lên",
      "1 vé = 10 điểm thường, tháng 6 = 20 điểm",
      "100 điểm = 1 vé 2D miễn phí",
      "Điểm có hiệu lực 12 tháng từ ngày tích",
    ],
    icon: "⭐",
  },
  {
    id: "p4",
    tag: "-15K",
    title: "Suất Chiếu Sớm",
    short: "Đặt vé trước 10:00 sáng giảm ngay 15.000đ mỗi vé.",
    c: ["#0E2620","#0D9488"],
    category: "Giảm giá",
    code: null,
    validity: "Tất cả các ngày",
    applies: "Suất chiếu 9:00 – 11:30, mọi định dạng",
    howToUse: "Chọn suất chiếu trước 11:30 sáng — giá vé tự động giảm 15.000đ/vé khi thanh toán. Không cần mã.",
    conditions: [
      "Áp dụng suất chiếu bắt đầu trước 11:30",
      "Phải đặt vé trước 10:00 cùng ngày",
      "Áp dụng tất cả định dạng 2D, IMAX, 3D",
      "Không giới hạn số lượng vé",
    ],
    icon: "🌅",
  },
  {
    id: "p5",
    tag: "2+1",
    title: "Mua 2 Tặng 1",
    short: "Mua 2 vé cùng suất chiếu, tặng ngay 1 vé cùng loại miễn phí.",
    c: ["#1A1208","#92400E"],
    category: "Combo",
    code: "TRIO2026",
    validity: "Cuối tuần (T7, CN)",
    applies: "Vé 2D, tối đa 1 vé tặng/giao dịch",
    howToUse: "Nhập mã TRIO2026 khi chọn 3 vé trong cùng 1 suất chiếu. Hệ thống tự động miễn phí vé rẻ nhất trong 3 vé.",
    conditions: [
      "Chỉ áp dụng thứ 7 và Chủ Nhật",
      "Tối thiểu 2 vé, tối đa 1 vé tặng/giao dịch",
      "Chỉ vé cùng loại (cùng định dạng, cùng hạng ghế)",
      "Không áp dụng Gold Class, Couple seat",
    ],
    icon: "🎁",
  },
  {
    id: "p6",
    tag: "FREE",
    title: "Sinh Nhật Vàng",
    short: "Tặng 1 vé xem phim miễn phí vào đúng ngày sinh nhật của bạn.",
    c: ["#1A1004","#B45309"],
    category: "Thành viên",
    code: null,
    validity: "Đúng ngày sinh nhật",
    applies: "1 vé 2D bất kỳ phim đang chiếu",
    howToUse: "Cập nhật ngày sinh trong hồ sơ tài khoản trước 7 ngày. Vé miễn phí tự động xuất hiện trong 'Vé của tôi' vào đúng ngày sinh nhật.",
    conditions: [
      "Tài khoản cần xác minh ngày sinh trước 7 ngày",
      "1 vé/năm, chỉ vé 2D tiêu chuẩn",
      "Hiệu lực trong 3 ngày (trước/trong/sau sinh nhật)",
      "Cần đặt trực tuyến, không áp dụng tại quầy",
    ],
    icon: "🎂",
  },
];

function PromoDetailModal({ promo, onClose }) {
  return (
    <Modal onClose={onClose}>
      <div style={{ padding: 0, maxWidth: 520, width: "90vw" }}>
        {/* Header */}
        <div style={{
          background: `linear-gradient(140deg, ${promo.c[0]}, ${promo.c[1]})`,
          padding: "28px 28px 24px",
          position: "relative",
          overflow: "hidden",
          borderRadius: "var(--r-lg) var(--r-lg) 0 0",
        }}>
          <div style={{ position: "absolute", inset: 0, background: "radial-gradient(circle at 80% 20%, rgba(255,255,255,.18), transparent 60%)" }} />
          <div style={{ position: "relative", display: "flex", alignItems: "center", gap: 16 }}>
            <span style={{ fontSize: 40 }}>{promo.icon}</span>
            <div>
              <div style={{ fontSize: 12, letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(255,255,255,.65)", marginBottom: 4 }}>{promo.category}</div>
              <h2 style={{ margin: 0, fontSize: 26, textTransform: "uppercase", color: "#fff" }}>{promo.title}</h2>
            </div>
            <span style={{ marginLeft: "auto", fontFamily: "var(--ff-head)", fontSize: 38, fontWeight: 700, color: "#fff", opacity: 0.9 }}>{promo.tag}</span>
          </div>
        </div>

        {/* Body */}
        <div style={{ padding: "22px 28px 28px", display: "flex", flexDirection: "column", gap: 18 }}>
          <p style={{ margin: 0, fontSize: 15, lineHeight: 1.65 }}>{promo.short}</p>

          {/* Promo code */}
          {promo.code && (
            <div style={{ background: "var(--surface-2)", border: "1.5px dashed var(--gold)", borderRadius: 10, padding: "14px 18px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
              <div>
                <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--muted-2)", marginBottom: 4 }}>Mã ưu đãi</div>
                <span style={{ fontFamily: "var(--ff-head)", fontSize: 24, letterSpacing: "0.14em", color: "var(--gold)" }}>{promo.code}</span>
              </div>
              <button className="btn btn-ghost btn-sm" onClick={() => { navigator.clipboard?.writeText(promo.code); }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                Sao chép
              </button>
            </div>
          )}

          {/* Info grid */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div style={{ background: "var(--surface)", borderRadius: 10, padding: "12px 14px" }}>
              <div style={{ fontSize: 11, color: "var(--muted-2)", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 5 }}>Hiệu lực</div>
              <div style={{ fontWeight: 600, fontSize: 14 }}>{promo.validity}</div>
            </div>
            <div style={{ background: "var(--surface)", borderRadius: 10, padding: "12px 14px" }}>
              <div style={{ fontSize: 11, color: "var(--muted-2)", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 5 }}>Áp dụng cho</div>
              <div style={{ fontWeight: 600, fontSize: 14 }}>{promo.applies}</div>
            </div>
          </div>

          {/* How to use */}
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--muted-2)", marginBottom: 8 }}>Cách sử dụng</div>
            <p style={{ margin: 0, fontSize: 14.5, lineHeight: 1.7, color: "var(--text)" }}>{promo.howToUse}</p>
          </div>

          {/* Conditions */}
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--muted-2)", marginBottom: 10 }}>Điều kiện áp dụng</div>
            <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 8 }}>
              {promo.conditions.map((c, i) => (
                <li key={i} style={{ display: "flex", gap: 10, fontSize: 14, lineHeight: 1.5 }}>
                  <span style={{ color: "var(--coral)", flexShrink: 0, marginTop: 1 }}>✕</span>
                  <span className="muted">{c}</span>
                </li>
              ))}
            </ul>
          </div>

          <button className="btn btn-gold btn-lg" style={{ width: "100%" }} onClick={onClose}>
            <Icon name="ticket" size={18} color="#211803" /> Đặt vé ngay để dùng ưu đãi
          </button>
        </div>
      </div>
    </Modal>
  );
}

function PromoPage() {
  React.useEffect(() => { window.scrollTo(0, 0); }, []);
  const [selected, setSelected] = React.useState(null);
  const cats = ["Tất cả", "Giảm giá", "Combo", "Thành viên"];
  const [cat, setCat] = React.useState("Tất cả");
  const list = cat === "Tất cả" ? PROMOS : PROMOS.filter(p => p.category === cat);

  return (
    <div className="wrap section fade-up">
      <div className="section-head">
        <h2 className="section-title"><span className="bar" />Ưu đãi & Khuyến mãi</h2>
      </div>

      {/* Category filter */}
      <div style={{ display: "flex", gap: 9, marginBottom: 28, flexWrap: "wrap" }}>
        {cats.map(c => (
          <button key={c} className={"chip " + (cat === c ? "active" : "")} onClick={() => setCat(c)}>{c}</button>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(440px, 1fr))", gap: 18 }}>
        {list.map(p => (
          <div key={p.id} className="card" style={{ overflow: "hidden", display: "flex", minHeight: 160 }}>
            <div style={{
              width: 140, flex: "none",
              background: `linear-gradient(150deg, ${p.c[0]}, ${p.c[1]})`,
              display: "grid", placeItems: "center", position: "relative",
            }}>
              <div style={{ position: "absolute", inset: 0, background: "radial-gradient(circle at 70% 20%, rgba(255,255,255,.2), transparent 60%)" }} />
              <div style={{ position: "relative", textAlign: "center" }}>
                <div style={{ fontSize: 28, marginBottom: 2 }}>{p.icon}</div>
                <span style={{ fontFamily: "var(--ff-head)", fontSize: 26, fontWeight: 700, color: "#fff" }}>{p.tag}</span>
              </div>
            </div>
            <div style={{ padding: "18px 22px", display: "flex", flexDirection: "column", justifyContent: "center", gap: 6, flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span className="badge" style={{ background: "var(--surface-2)", color: "var(--muted)", border: "1px solid var(--line)", fontSize: 11 }}>{p.category}</span>
                {p.code && <span className="badge" style={{ background: "var(--gold-soft)", color: "var(--gold)", border: "1px solid rgba(246,196,69,.25)", fontSize: 11 }}>Có mã</span>}
              </div>
              <h3 style={{ fontSize: 19, textTransform: "uppercase", margin: 0 }}>{p.title}</h3>
              <p className="muted" style={{ margin: 0, fontSize: 13.5, lineHeight: 1.55 }}>{p.short}</p>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 4 }}>
                <button className="btn btn-gold btn-sm" onClick={() => setSelected(p)}>Xem chi tiết</button>
                <span className="muted-2" style={{ fontSize: 12 }}>📅 {p.validity}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {selected && <PromoDetailModal promo={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}

/* ─── Customer App ────────────────────────────────────────────── */
function CustomerApp() {
  const [route, setRoute] = React.useState("home");
  const [activeMovie, setActiveMovie] = React.useState(null);
  const [order, setOrder] = React.useState(null);
  const [lastBooking, setLastBooking] = React.useState(null);
  const [bookings, setBookings] = React.useState([]);
  const [reviews, setReviews] = React.useState(CINE.reviews);
  const [searchOpen, setSearchOpen] = React.useState(false);
  const [push, toastNode] = useToasts();
  const bookedMovieIds = new Set(bookings.map(b=>b.showtime?.movieId));
  const user = AUTH.user || CINE.user;

  /* Nạp lịch sử vé thật từ API */
  React.useEffect(() => {
    API.myBookings().then(r => setBookings(r.data)).catch(() => {});
  }, []);

  /* ── Điều hướng tích hợp lịch sử trình duyệt ──────────────────
     Mỗi lần đi tới một màn mới, lưu lại "ảnh chụp" màn hiện tại rồi
     pushState. Nút Back (của trình duyệt hoặc trong app) gọi
     history.back() → sự kiện popstate khôi phục lại màn trước đó. */
  const histRef = React.useRef([]);
  const snapshot = () => ({ route, activeMovie, order, lastBooking });
  const applySnap = s => { setRoute(s.route); setActiveMovie(s.activeMovie); setOrder(s.order); setLastBooking(s.lastBooking); };
  const pushScreen = () => { histRef.current.push(snapshot()); window.history.pushState({ cf: histRef.current.length }, ""); };
  const navTo = mutate => { pushScreen(); mutate(); window.scrollTo(0,0); };
  const goBack = () => window.history.back();

  React.useEffect(() => {
    const onPop = () => {
      const prev = histRef.current.pop();
      if (prev) { applySnap(prev); window.scrollTo(0,0); }
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  const nav = r => navTo(() => setRoute(r));
  const openMovie = m => navTo(() => { setActiveMovie(m); setRoute("detail"); });
  const pickShowtime = st => navTo(() => { setActiveMovie(CINE.movieById(st.movieId)); setOrder({ showtime:st }); setRoute("seats"); });
  const confirmSeats = o => navTo(() => { setOrder(o); setRoute("payment"); });
  /* Vé đã được PaymentScreen tạo THẬT qua API — chỉ lưu vào state + điều hướng */
  const onPaid = booking => {
    setBookings(b=>[booking, ...b]);
    navTo(() => { setLastBooking(booking); setRoute("confirm"); });
    push("Thanh toán thành công — vé đã được tạo!");
  };
  const addReview = async ({ movieId, rating, text }) => {
    try {
      const r = await API.addReview(movieId, { rating, text });
      setReviews(rs=>[r,...rs]);
      push("Cảm ơn bạn đã đánh giá!");
    } catch (e) {
      push(e.status===403 ? "Bạn cần mua vé phim này trước khi đánh giá." : (e.message||"Lỗi gửi đánh giá."), "warn");
    }
  };

  let screen;
  if (route==="home") screen=<HomeScreen onOpen={openMovie} onBook={openMovie} />;
  else if (route==="detail"&&activeMovie) screen=<DetailScreen movie={activeMovie} reviews={reviews} canReview={bookedMovieIds.has(activeMovie.id)} onAddReview={addReview} onPickShowtime={pickShowtime} onBack={goBack} onOpen={openMovie} push={push} />;
  else if (route==="seats"&&order) screen=<SeatScreen showtime={order.showtime} onConfirm={confirmSeats} onBack={goBack} push={push} />;
  else if (route==="payment"&&order) screen=<PaymentScreen order={order} onPaid={onPaid} onBack={goBack} push={push} />;
  else if (route==="confirm"&&lastBooking) screen=<ConfirmScreen booking={lastBooking} onHome={()=>nav("home")} onTickets={()=>nav("tickets")} />;
  else if (route==="tickets") screen=<TicketsScreen bookings={bookings} onBrowse={()=>nav("home")} />;
  else if (route==="showtimes") screen=<ShowtimesPage onPick={pickShowtime} />;
  else if (route==="promo") screen=<PromoPage />;
  else screen=<HomeScreen onOpen={openMovie} onBook={openMovie} />;

  const hideChrome = ["seats","payment","confirm"].includes(route);
  return (
    <div>
      <Header route={route} onNav={nav} canBack={route!=="home"} onBack={goBack} ticketCount={bookings.length} user={user} onSearch={()=>setSearchOpen(true)} onLogout={()=>AUTH.logout()} />
      {screen}
      {!hideChrome && <Footer />}
      {searchOpen && <SearchModal onClose={()=>setSearchOpen(false)} onOpen={openMovie} />}
      {toastNode}
    </div>
  );
}

/* ─── Admin App ───────────────────────────────────────────────── */
function AdminApp() {
  const [page, setPage] = React.useState("dashboard");
  // Tải dữ liệu quản trị THẬT từ API (cần token admin/manager) trước khi render
  const [ready, setReady] = React.useState(window.CINE.adminLoaded);
  const [err, setErr] = React.useState(null);
  React.useEffect(() => {
    if (ready) return;
    window.CINE.loadAdminData()
      .then(() => setReady(true))
      .catch((e) => { setErr(e); setReady(true); });
  }, []);
  if (!ready)
    return <div style={{ minHeight:"100vh", display:"grid", placeItems:"center", color:"var(--muted)", fontFamily:"sans-serif" }}>Đang tải dữ liệu quản trị…</div>;
  const pages = { dashboard:<DashboardPage />, movies:<MoviesPage />, showtimes:<ShowtimesAdminPage />, rooms:<RoomsPage />, bookings:<BookingsPage />, customers:<CustomersPage />, staff:<StaffPage />, reports:<ReportsPage /> };
  return (
    <AdminLayout page={page} setPage={setPage}>
      <ErrorBoundary>{pages[page]||<DashboardPage />}</ErrorBoundary>
    </AdminLayout>
  );
}

/* ─── Staff App ───────────────────────────────────────────────── */
function StaffApp() {
  const [page, setPage] = React.useState("scanner");
  const pages = { scanner:<TicketScanner />, schedule:<TodaySchedule />, today:<TodayTickets /> };
  return (
    <StaffLayout page={page} setPage={setPage}>
      <ErrorBoundary>{pages[page]||<TicketScanner />}</ErrorBoundary>
    </StaffLayout>
  );
}

/* ─── Root App ────────────────────────────────────────────────── */
function App() {
  const [user, setUser] = React.useState(AUTH.user);
  // LoginScreen đã xác thực qua AUTH.signIn và truyền user đã đăng nhập
  const login = (account) => { setUser(account); };

  if (!user) return <LoginScreen onLogin={login} />;
  if (user.role==="admin" || user.role==="manager") return <AdminApp />;
  if (user.role==="staff") return <StaffApp />;
  return <CustomerApp />;
}

/* Chờ tải xong dữ liệu từ API rồi mới render (boot bất đồng bộ) */
window.CINE.ready
  .then(() => {
    ReactDOM.createRoot(document.getElementById("root")).render(
      <ErrorBoundary><App /></ErrorBoundary>
    );
  })
  .catch((err) => {
    ReactDOM.createRoot(document.getElementById("root")).render(
      <SystemState
        title="Chưa kết nối được kho dữ liệu"
        message="Giao diện đã sẵn sàng nhưng máy chủ CINEVERSE chưa trả về danh sách phim và lịch chiếu."
        detail={String(err && err.message || err)}
      />
    );
  });
