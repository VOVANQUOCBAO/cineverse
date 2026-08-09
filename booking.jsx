/* ============================================================
   CINEVERSE — Booking flow: Seat selection (real-time lock) ·
   Payment · Ticket+QR confirmation · My Tickets
   ============================================================ */

/* Logic ưu đãi — GIỮ ĐỒNG BỘ với server/utils/promo.js (backend là nguồn chân lý).
   Mã đè ưu đãi tự động. Giảm giá chỉ áp lên tiền vé. */
function computePromo({ ticketSubtotal, seatPrices, date, time, code }) {
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
  const wd = new Date(date + "T00:00:00").getDay();
  const wedDisc = wd === 3 ? Math.round(ticketSubtotal * 0.3) : 0;
  const earlyDisc = String(time).slice(0, 5) < "11:30" ? 15000 * n : 0;
  if (wedDisc >= earlyDisc && wedDisc > 0)
    return { discount: Math.min(wedDisc, ticketSubtotal), label: "Thứ 4 Vui Vẻ −30%", auto: true };
  if (earlyDisc > 0)
    return { discount: Math.min(earlyDisc, ticketSubtotal), label: "Suất chiếu sớm −15k/vé", auto: true };
  return { discount: 0 };
}

/* ---------------- Seat Selection ---------------- */
function SeatScreen({ showtime, onConfirm, onBack, push }) {
  // ALL hooks must be called unconditionally (Rules of Hooks)
  const [layout, setLayout] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState([]);
  const [conc, setConc] = useState({}); // { concessionId: qty } — bắp nước
  const [hold, setHold] = useState(8 * 60);

  useEffect(() => { window.scrollTo(0, 0); }, []);

  // Tải sơ đồ ghế THẬT từ API (available | booked | held)
  useEffect(() => {
    let alive = true;
    setLoading(true);
    setSelected([]);
    API.seats(showtime.id)
      .then((r) => { if (alive) { setLayout(r.rows); setLoading(false); } })
      .catch(() => { if (alive) { setLayout(CINE.buildSeatLayout(showtime.id)); setLoading(false); } });
    return () => { alive = false; };
  }, [showtime.id]);

  // hold countdown
  useEffect(() => {
    if (selected.length === 0) { setHold(8 * 60); return; }
    const t = setInterval(() => {
      setHold((h) => {
        if (h <= 1) {
          clearInterval(t);
          push("Hết thời gian giữ ghế. Vui lòng chọn lại.", "warn");
          setSelected([]);
          return 8 * 60;
        }
        return h - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [selected.length === 0]);

  // Data lookups after hooks
  const movie = CINE.movieById(showtime.movieId);
  const cinema = CINE.cinemaById(showtime.cinemaId);
  const room = CINE.roomById(showtime.roomId);
  const dateObj = CINE.dates.find((d) => d.key === showtime.date) || { wd: "", dd: "--", mm: "--" };
  if (!movie || !cinema) return <div className="empty" style={{ padding: 60 }}><p>Không tìm thấy thông tin suất chiếu.</p><button className="btn btn-ghost" onClick={onBack}>Quay lại</button></div>;
  if (loading || !layout) return <div className="empty" style={{ padding: 80, textAlign: "center" }}><span className="spin" /><p style={{ marginTop: 14 }}>Đang tải sơ đồ ghế…</p></div>;

  const seatPrice = (type) => showtime.price[type];

  const toggle = (seat) => {
    if (seat.status === "booked" || seat.status === "held") return;
    setSelected((sel) => {
      if (sel.includes(seat.code)) return sel.filter((c) => c !== seat.code);
      if (sel.length >= 8) { push("Tối đa 8 ghế mỗi lần đặt.", "warn"); return sel; }
      return [...sel, seat.code];
    });
  };

  const allSeats = layout.flatMap((r) => r.seats);
  const chosen = allSeats.filter((s) => selected.includes(s.code));
  const total = chosen.reduce((sum, s) => sum + seatPrice(s.type) / (s.type === "couple" ? 1 : 1), 0);
  // bắp nước (tuỳ chọn)
  const concList = (CINE.concessions || []).map((c) => ({ ...c, qty: conc[c.id] || 0 }));
  const concChosen = concList.filter((c) => c.qty > 0);
  const concSubtotal = concChosen.reduce((a, c) => a + c.price * c.qty, 0);
  const grandSeat = total + concSubtotal;
  const setQty = (id, d) =>
    setConc((m) => {
      const q = Math.max(0, Math.min(20, (m[id] || 0) + d));
      const n = { ...m };
      if (q) n[id] = q; else delete n[id];
      return n;
    });
  const mm = String(Math.floor(hold / 60)).padStart(2, "0");
  const ss = String(hold % 60).padStart(2, "0");

  return (
    <div className="fade-up">
      <div className="wrap" style={{ paddingTop: 26 }}>
        <button className="chip" onClick={onBack}><Icon name="chevronL" size={15} /> Quay lại</button>
        <div style={{ margin: "18px 0 26px" }}><Stepper step={1} /></div>
      </div>

      <div className="wrap" style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 34, alignItems: "start", paddingBottom: 50 }}>
        {/* seat map */}
        <div className="card" style={{ padding: "34px 28px" }}>
          <div className="screen-arc">
            <div className="screen-bar" />
            <div className="screen-label">Màn hình</div>
          </div>

          <div className="seat-rows">
            {layout.map((row) => (
              <div className="seat-row" key={row.row}>
                <span className="row-label">{row.row}</span>
                {row.seats.map((s, idx) => (
                  <React.Fragment key={s.code}>
                    {!row.isCouple && idx === 6 && <span className="seat-aisle" />}
                    <button
                      className={
                        "seat " + s.type +
                        (selected.includes(s.code) ? " selected" : "") +
                        (s.status === "booked" ? " booked" : "") +
                        (s.status === "held" ? " held" : "")
                      }
                      onClick={() => toggle(s)}
                      title={`${s.code} · ${s.type === "vip" ? "VIP" : s.type === "couple" ? "Ghế đôi" : "Thường"} · ${F(seatPrice(s.type))}`}
                    >
                      {s.status === "booked" ? "" : s.code.slice(1)}
                    </button>
                  </React.Fragment>
                ))}
                <span className="row-label">{row.row}</span>
              </div>
            ))}
          </div>

          <div className="legend">
            {[
              ["Thường", "var(--surface-2)", "var(--line-2)"],
              ["VIP", "var(--surface-2)", "rgba(246,196,69,.5)"],
              ["Ghế đôi", "var(--surface-2)", "rgba(157,139,255,.6)"],
              ["Đang chọn", "var(--mint)", "var(--mint)"],
              ["Đã bán", "#0c0d11", "transparent"],
              ["Đang giữ", "var(--coral-soft)", "var(--coral)"],
            ].map(([label, bg, bd]) => (
              <span className="legend-item" key={label}>
                <span className="legend-swatch" style={{ background: bg, borderColor: bd }} />
                {label}
              </span>
            ))}
          </div>
        </div>

        {/* summary */}
        <div className="summary">
          <div className="card" style={{ padding: 22 }}>
            <div style={{ display: "flex", gap: 14, marginBottom: 16 }}>
              <div style={{ width: 64, flex: "none" }}><Poster movie={movie} titleSize={13} /></div>
              <div>
                <div style={{ fontFamily: "var(--ff-head)", fontSize: 17, textTransform: "uppercase", lineHeight: 1.18 }}>{movie.title}</div>
                <div className="muted" style={{ fontSize: 12.5, marginTop: 4 }}>{showtime.format} · {movie.age}</div>
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 8, fontSize: 13, marginBottom: 14 }}>
              <div style={{ display: "flex", gap: 9 }}><Icon name="location" size={15} color="var(--gold)" /> <span>{cinema.name} · {room.name}</span></div>
              <div style={{ display: "flex", gap: 9 }}><Icon name="calendar" size={15} color="var(--gold)" /> <span>{dateObj.wd}, {dateObj.dd}/{dateObj.mm} · <b style={{ color: "var(--text)" }}>{showtime.time}</b></span></div>
            </div>

            <div className="divider" style={{ margin: "4px 0 12px" }} />

            <div className="hold-timer" style={{ marginBottom: 14, opacity: selected.length ? 1 : 0.5 }}>
              <Icon name="clock" size={17} color="var(--coral)" />
              <span>Giữ ghế trong</span>
              <b style={{ marginLeft: "auto" }}>{mm}:{ss}</b>
            </div>

            <div className="k" style={{ fontSize: 12, color: "var(--muted-2)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 }}>Ghế đã chọn</div>
            {chosen.length === 0 ? (
              <p className="muted" style={{ fontSize: 13.5, margin: "0 0 10px" }}>Chưa chọn ghế nào. Hãy chọn trên sơ đồ.</p>
            ) : (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 10 }}>
                {chosen.map((s) => (
                  <span key={s.code} className="badge" style={{ background: "var(--mint-soft)", color: "var(--mint)", fontSize: 12.5, padding: "5px 9px" }}>{s.code}</span>
                ))}
              </div>
            )}

            <div className="divider" style={{ margin: "8px 0" }} />
            <div className="row-line"><span className="muted">Vé ({chosen.length} ghế)</span><span>{F(total)}</span></div>
            {concChosen.map((c) => (
              <div className="row-line" key={c.id}><span className="muted">{c.name} × {c.qty}</span><span>{F(c.price * c.qty)}</span></div>
            ))}
            <div className="row-line total"><span>Tổng cộng</span><b>{F(grandSeat)}</b></div>

            <button className="btn btn-gold btn-lg" style={{ width: "100%", marginTop: 14 }} disabled={chosen.length === 0}
              onClick={() => onConfirm({
                showtime,
                seats: chosen.map((s) => ({ code: s.code, type: s.type, price: seatPrice(s.type) })),
                total,
                concessions: concChosen.map((c) => ({ id: c.id, name: c.name, price: c.price, qty: c.qty })),
                concSubtotal,
              })}>
              Tiếp tục <Icon name="arrowRight" size={18} color="#211803" />
            </button>
          </div>
        </div>

        {/* Bắp nước & combo — chọn kèm khi đặt vé */}
        <div className="card" style={{ padding: "26px 28px" }}>
          <h3 style={{ fontFamily: "var(--ff-head)", fontSize: 18, textTransform: "uppercase", margin: "0 0 4px" }}>
            <Icon name="sparkle" size={18} color="var(--gold)" /> Bắp nước & Combo
          </h3>
          <p className="muted" style={{ fontSize: 13, margin: "0 0 16px" }}>Tuỳ chọn — mua kèm để thanh toán một lần, nhận tại quầy.</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {concList.map((c) => (
              <div key={c.id} style={{ display: "flex", alignItems: "center", gap: 14, padding: "10px 0", borderBottom: "1px solid var(--line)" }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 14.5 }}>{c.name}</div>
                  <div className="muted" style={{ fontSize: 12.5, marginTop: 2 }}>{F(c.price)}</div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <button className="seat-step" onClick={() => setQty(c.id, -1)} disabled={!c.qty}
                    style={{ width: 30, height: 30, borderRadius: 8, border: "1px solid var(--line-2)", background: "var(--surface-2)", color: "var(--text)", fontSize: 18, cursor: c.qty ? "pointer" : "not-allowed", opacity: c.qty ? 1 : 0.4 }}>−</button>
                  <b style={{ minWidth: 18, textAlign: "center" }}>{c.qty}</b>
                  <button className="seat-step" onClick={() => setQty(c.id, 1)}
                    style={{ width: 30, height: 30, borderRadius: 8, border: "1px solid var(--line-2)", background: "var(--surface-2)", color: "var(--text)", fontSize: 18, cursor: "pointer" }}>+</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------------- Payment ---------------- */
const PAY_METHODS = [
  { id: "momo", name: "Ví MoMo", desc: "Thanh toán qua ứng dụng MoMo", color: "#a50064", abbr: "MoMo" },
  { id: "vnpay", name: "VNPAY-QR", desc: "Quét mã QR ngân hàng / ví", color: "#0a5dad", abbr: "VNPAY" },
  { id: "atm", name: "Thẻ ATM nội địa", desc: "Internet Banking", color: "#1f8a5b", abbr: "ATM" },
  { id: "visa", name: "Thẻ quốc tế", desc: "Visa · Mastercard · JCB", color: "#3a3e49", abbr: "VISA" },
];

function PaymentScreen({ order, onPaid, onBack, push }) {
  // ALL hooks first (Rules of Hooks)
  const [method, setMethod] = useState("momo");
  const [processing, setProcessing] = useState(false);
  const [codeInput, setCodeInput] = useState("");
  const [appliedCode, setAppliedCode] = useState("");
  const [hold, setHold] = useState(8 * 60);
  useEffect(() => { window.scrollTo(0, 0); }, []);
  useEffect(() => {
    const t = setInterval(() => setHold((h) => (h <= 1 ? (clearInterval(t), 0) : h - 1)), 1000);
    return () => clearInterval(t);
  }, []);

  // Data lookups after hooks
  const movie = CINE.movieById(order.showtime.movieId);
  const cinema = CINE.cinemaById(order.showtime.cinemaId);
  const dateObj = CINE.dates.find((d) => d.key === order.showtime.date) || { wd: "", dd: "--", mm: "--" };
  if (!movie || !cinema) return <div className="empty" style={{ padding: 60 }}><p>Không tìm thấy thông tin đặt vé.</p><button className="btn btn-ghost" onClick={onBack}>Quay lại</button></div>;

  const ticketSubtotal = order.total;
  const concSubtotal = order.concSubtotal || 0;
  const promo = computePromo({
    ticketSubtotal,
    seatPrices: order.seats.map((s) => s.price),
    date: order.showtime.date,
    time: order.showtime.time,
    code: appliedCode,
  });
  const discount = promo.error ? 0 : (promo.discount || 0);
  const grand = ticketSubtotal - discount + concSubtotal;
  const mm = String(Math.floor(hold / 60)).padStart(2, "0");
  const ss = String(hold % 60).padStart(2, "0");

  const pay = async () => {
    setProcessing(true);
    try {
      const res = await API.createBooking({
        showtimeId: order.showtime.id,
        seats: order.seats.map((s) => ({ code: s.code, type: s.type })),
        paymentMethod: method,
        concessions: (order.concessions || []).map((c) => ({ id: c.id, qty: c.qty })),
        promoCode: (!promo.error && promo.code) ? promo.code : undefined,
      });
      setProcessing(false);
      // vé đã được tạo THẬT trong DB — dùng tổng tiền server trả về (đã trừ ưu đãi)
      onPaid({ ...order, method, grand: res.total, discount: res.discount, promoLabel: res.promoLabel, code: res.code, createdAt: Date.now() });
    } catch (e) {
      setProcessing(false);
      if (e.status === 409) {
        push("Rất tiếc, ghế vừa có người khác đặt. Vui lòng chọn lại.", "warn");
        onBack();
      } else {
        push(e.message || "Thanh toán thất bại. Vui lòng thử lại.", "warn");
      }
    }
  };

  return (
    <div className="fade-up">
      <div className="wrap" style={{ paddingTop: 26 }}>
        <button className="chip" onClick={onBack}><Icon name="chevronL" size={15} /> Quay lại chọn ghế</button>
        <div style={{ margin: "18px 0 26px" }}><Stepper step={2} /></div>
      </div>

      <div className="wrap" style={{ display: "grid", gridTemplateColumns: "1fr 360px", gap: 34, alignItems: "start", paddingBottom: 50 }}>
        <div>
          <div className="hold-timer" style={{ marginBottom: 20, display: "inline-flex" }}>
            <Icon name="clock" size={17} color="var(--coral)" /> Hoàn tất thanh toán trong <b>{mm}:{ss}</b>
          </div>

          <h2 className="section-title" style={{ fontSize: 22, marginBottom: 16 }}><span className="bar" />Phương thức thanh toán</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {PAY_METHODS.map((p) => (
              <div key={p.id} className={"pay-method " + (method === p.id ? "on" : "")} onClick={() => setMethod(p.id)}>
                <span className="pay-logo" style={{ background: p.color }}>{p.abbr}</span>
                <div>
                  <div style={{ fontWeight: 600 }}>{p.name}</div>
                  <div className="muted" style={{ fontSize: 12.5 }}>{p.desc}</div>
                </div>
                <span className="pay-radio" />
              </div>
            ))}
          </div>

          {/* mock QR for momo/vnpay */}
          {(method === "momo" || method === "vnpay") && (
            <div className="card" style={{ marginTop: 18, padding: 22, display: "flex", gap: 20, alignItems: "center" }}>
              <div className="qr"><QR value={"CINEVERSE-" + method + "-" + order.total} size={120} /></div>
              <div>
                <div style={{ fontWeight: 600, marginBottom: 4 }}>Quét mã để thanh toán</div>
                <p className="muted" style={{ fontSize: 13.5, margin: 0, maxWidth: 280 }}>Mở ứng dụng {PAY_METHODS.find((x) => x.id === method).name} và quét mã QR, hoặc bấm “Thanh toán” bên dưới để giả lập giao dịch thành công.</p>
              </div>
            </div>
          )}

          {(method === "atm" || method === "visa") && (
            <div className="card" style={{ marginTop: 18, padding: 22 }}>
              <div style={{ display: "grid", gap: 12 }}>
                <Field label="Số thẻ" placeholder="•••• •••• •••• 4242" icon="card" />
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <Field label="Hết hạn" placeholder="MM/YY" />
                  <Field label="CVV" placeholder="•••" />
                </div>
                <Field label="Tên chủ thẻ" placeholder="NGUYEN VAN AN" />
              </div>
            </div>
          )}
        </div>

        {/* order summary */}
        <div className="summary">
          <div className="card" style={{ padding: 22 }}>
            <div style={{ display: "flex", gap: 14, marginBottom: 14 }}>
              <div style={{ width: 60, flex: "none" }}><Poster movie={movie} titleSize={12} /></div>
              <div>
                <div style={{ fontFamily: "var(--ff-head)", fontSize: 16, textTransform: "uppercase", lineHeight: 1.18 }}>{movie.title}</div>
                <div className="muted" style={{ fontSize: 12.5, marginTop: 3 }}>{order.showtime.format} · {movie.age}</div>
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 7, fontSize: 13, marginBottom: 12 }}>
              <div className="muted">{cinema.name}</div>
              <div>{dateObj.wd}, {dateObj.dd}/{dateObj.mm} · <b>{order.showtime.time}</b></div>
            </div>
            <div className="divider" style={{ margin: "4px 0 10px" }} />
            <div className="row-line"><span className="muted">Ghế ({order.seats.length})</span><span>{order.seats.map((s) => s.code).join(", ")}</span></div>
            {["regular", "vip", "couple"].map((t) => {
              const items = order.seats.filter((s) => s.type === t);
              if (!items.length) return null;
              const label = t === "vip" ? "Ghế VIP" : t === "couple" ? "Ghế đôi" : "Ghế thường";
              return <div className="row-line" key={t}><span className="muted">{label} × {items.length}</span><span>{F(items.reduce((a, b) => a + b.price, 0))}</span></div>;
            })}
            {(order.concessions || []).map((c) => (
              <div className="row-line" key={"c" + c.id}><span className="muted">{c.name} × {c.qty}</span><span>{F(c.price * c.qty)}</span></div>
            ))}

            <div className="divider" style={{ margin: "10px 0" }} />
            {/* Mã ưu đãi */}
            <div className="k" style={{ fontSize: 12, color: "var(--muted-2)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 }}>Mã ưu đãi</div>
            <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
              <input value={codeInput} onChange={(e) => setCodeInput(e.target.value)} placeholder="VD: SV2026, TRIO2026"
                onKeyDown={(e) => { if (e.key === "Enter") setAppliedCode(codeInput.trim()); }}
                style={{ flex: 1, background: "var(--bg)", border: "1px solid var(--line-2)", borderRadius: 9, padding: "9px 12px", color: "var(--text)", fontFamily: "inherit", fontSize: 13.5, textTransform: "uppercase", outline: "none" }} />
              <button className="btn btn-ghost" style={{ padding: "0 16px" }} onClick={() => setAppliedCode(codeInput.trim())}>Áp dụng</button>
            </div>
            {promo.error && <p style={{ color: "var(--coral)", fontSize: 12.5, margin: "0 0 8px" }}>{promo.error}</p>}
            {!promo.error && discount > 0 && (
              <div className="row-line" style={{ color: "var(--mint)" }}>
                <span>{promo.label}</span><span>−{F(discount)}</span>
              </div>
            )}

            <div className="row-line total"><span>Thanh toán</span><b>{F(grand)}</b></div>
            <button className="btn btn-gold btn-lg" style={{ width: "100%", marginTop: 14 }} onClick={pay} disabled={processing || !!promo.error}>
              {processing ? <><span className="spin" style={{ width: 18, height: 18, borderWidth: 2 }} /> Đang xử lý…</> : <>Thanh toán {F(grand)}</>}
            </button>
            <div style={{ display: "flex", alignItems: "center", gap: 7, justifyContent: "center", marginTop: 12, color: "var(--muted-2)", fontSize: 12 }}>
              <Icon name="shield" size={14} color="var(--mint)" /> Giao dịch được mã hoá & bảo mật
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, placeholder, icon }) {
  return (
    <label style={{ display: "block" }}>
      <div className="k" style={{ fontSize: 12, color: "var(--muted-2)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>{label}</div>
      <div style={{ display: "flex", alignItems: "center", gap: 10, background: "var(--bg)", border: "1px solid var(--line-2)", borderRadius: 10, padding: "11px 13px" }}>
        {icon && <Icon name={icon} size={16} color="var(--muted)" />}
        <input placeholder={placeholder} style={{ flex: 1, background: "none", border: "none", color: "var(--text)", fontFamily: "inherit", fontSize: 14, outline: "none" }} />
      </div>
    </label>
  );
}

/* ---------------- Ticket confirmation ---------------- */
function TicketCard({ booking, compact }) {
  const movie = CINE.movieById(booking.showtime.movieId);
  const cinema = CINE.cinemaById(booking.showtime.cinemaId);
  const room = CINE.roomById(booking.showtime.roomId);
  const dateObj = CINE.dates.find((d) => d.key === booking.showtime.date) || { wd: "", dd: "--", mm: "--" };
  if (!movie || !cinema) return null;
  return (
    <div className="ticket" style={{ maxWidth: compact ? "none" : 440 }}>
      <div className="ticket-top" style={{ display: "flex", gap: 18 }}>
        <div style={{ width: compact ? 64 : 88, flex: "none" }}><Poster movie={movie} titleSize={compact ? 13 : 16} /></div>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
            <AgeBadge age={movie.age} />
            <span className="badge badge-format">{booking.showtime.format}</span>
          </div>
          <div style={{ fontFamily: "var(--ff-head)", fontSize: compact ? 18 : 22, textTransform: "uppercase", lineHeight: 1.05 }}>{movie.title}</div>
          <div className="muted" style={{ fontSize: 12.5, marginTop: 8, display: "flex", flexDirection: "column", gap: 4 }}>
            <span><Icon name="location" size={13} color="var(--gold)" /> {cinema.name} · {room.name}</span>
            <span><Icon name="calendar" size={13} color="var(--gold)" /> {dateObj.wd}, {dateObj.dd}/{dateObj.mm} · {booking.showtime.time}</span>
            <span><Icon name="seat" size={13} color="var(--gold)" /> Ghế: <b style={{ color: "var(--text)" }}>{booking.seats.map((s) => s.code).join(", ")}</b></span>
            {booking.concessions && booking.concessions.length > 0 && (
              <span><Icon name="sparkle" size={13} color="var(--gold)" /> Bắp nước: <b style={{ color: "var(--text)" }}>{booking.concessions.map((c) => `${c.name}×${c.qty}`).join(", ")}</b></span>
            )}
          </div>
        </div>
      </div>
      <div className="ticket-perf" />
      <div className="ticket-top" style={{ display: "flex", alignItems: "center", gap: 18, paddingTop: 20 }}>
        <div className="qr"><QR value={`CINEVERSE|${booking.code}|${booking.showtime?.movieId||""}`} size={compact ? 96 : 116} /></div>
        <div style={{ flex: 1 }}>
          <div className="k" style={{ fontSize: 11, color: "var(--muted-2)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Mã vé</div>
          <div style={{ fontFamily: "var(--ff-head)", fontSize: 20, letterSpacing: "0.12em", color: "var(--gold)" }}>{booking.code}</div>
          <div className="k" style={{ fontSize: 11, color: "var(--muted-2)", textTransform: "uppercase", letterSpacing: "0.05em", marginTop: 10 }}>Đã thanh toán</div>
          <div style={{ fontWeight: 600 }}>{F(booking.grand)} · {PAY_METHODS.find((p) => p.id === booking.method)?.name || booking.method}</div>
          <div className="muted-2" style={{ fontSize: 11.5, marginTop: 8 }}>Xuất trình mã QR này cho nhân viên tại cổng soát vé.</div>
        </div>
      </div>
    </div>
  );
}

function ConfirmScreen({ booking, onHome, onTickets }) {
  useEffect(() => { window.scrollTo(0, 0); }, []);
  return (
    <div className="fade-up">
      <div className="wrap" style={{ paddingTop: 26 }}>
        <div style={{ margin: "0 0 30px" }}><Stepper step={3} /></div>
        <div style={{ textAlign: "center", marginBottom: 26 }}>
          <div style={{ width: 72, height: 72, borderRadius: "50%", background: "var(--mint-soft)", display: "grid", placeItems: "center", margin: "0 auto 16px" }}>
            <Icon name="checkCircle" size={40} color="var(--mint)" stroke={1.6} />
          </div>
          <h1 style={{ fontSize: 34, textTransform: "uppercase" }}>Đặt vé thành công!</h1>
          <p className="muted" style={{ fontSize: 15 }}>Vé điện tử đã được lưu vào mục “Vé của tôi”. Mã QR dùng để vào cổng rạp.</p>
        </div>
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 26 }}>
          <TicketCard booking={booking} />
        </div>
        <div style={{ display: "flex", gap: 12, justifyContent: "center", paddingBottom: 40 }}>
          <button className="btn btn-ghost btn-lg" onClick={onHome}>Về trang chủ</button>
          <button className="btn btn-gold btn-lg" onClick={onTickets}><Icon name="ticket" size={18} color="#211803" /> Xem vé của tôi</button>
        </div>
      </div>
    </div>
  );
}

/* ---------------- My Tickets ---------------- */
function TicketsScreen({ bookings, onBrowse }) {
  useEffect(() => { window.scrollTo(0, 0); }, []);
  return (
    <div className="wrap section fade-up">
      <div className="section-head">
        <h2 className="section-title"><span className="bar" />Vé của tôi</h2>
        <span className="muted">{bookings.length} vé</span>
      </div>
      {bookings.length === 0 ? (
        <div className="empty">
          <Icon name="ticket" size={36} color="var(--muted-2)" />
          <p style={{ marginTop: 12 }}>Bạn chưa có vé nào. Hãy đặt vé bộ phim yêu thích!</p>
          <button className="btn btn-gold" style={{ marginTop: 10 }} onClick={onBrowse}>Khám phá phim</button>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 22 }}>
          {bookings.slice().reverse().map((b) => (
            <TicketCard key={b.code} booking={b} compact />
          ))}
        </div>
      )}
    </div>
  );
}

Object.assign(window, { SeatScreen, PaymentScreen, ConfirmScreen, TicketsScreen, TicketCard, PAY_METHODS });
