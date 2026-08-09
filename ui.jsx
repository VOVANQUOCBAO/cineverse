/* ============================================================
   CINEVERSE — Shared UI components (window globals)
   ============================================================ */
const { useState, useEffect, useRef, useMemo } = React;
const F = window.CINE.formatVND;

/* ---------------- Icons (inline SVG) ---------------- */
function Icon({ name, size = 18, stroke = 1.8, color = "currentColor", fill = "none" }) {
  const p = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: fill,
    stroke: color,
    strokeWidth: stroke,
    strokeLinecap: "round",
    strokeLinejoin: "round",
  };
  const paths = {
    search: <><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></>,
    play: <path d="M7 5v14l12-7z" fill={color} stroke="none" />,
    ticket: <><path d="M3 8a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v2a2 2 0 0 0 0 4v2a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-2a2 2 0 0 0 0-4z" /><path d="M14 6v12" strokeDasharray="2 3" /></>,
    star: <path d="M12 3l2.6 5.4 5.9.8-4.3 4.1 1 5.9-5.2-2.8-5.2 2.8 1-5.9-4.3-4.1 5.9-.8z" />,
    clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
    calendar: <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M3 9h18M8 3v4M16 3v4" /></>,
    location: <><path d="M12 21s-7-5.7-7-11a7 7 0 0 1 14 0c0 5.3-7 11-7 11z" /><circle cx="12" cy="10" r="2.5" /></>,
    chevron: <path d="m9 6 6 6-6 6" />,
    chevronL: <path d="m15 6-6 6 6 6" />,
    chevronDown: <path d="m6 9 6 6 6-6" />,
    check: <path d="M5 12l4.5 4.5L19 7" />,
    checkCircle: <><circle cx="12" cy="12" r="9" /><path d="m8.5 12 2.5 2.5 4.5-5" /></>,
    user: <><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4 3.6-6 8-6s8 2 8 6" /></>,
    close: <path d="M6 6l12 12M18 6L6 18" />,
    film: <><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M7 3v18M17 3v18M3 8h4M3 12h18M3 16h4M17 8h4M17 16h4" /></>,
    seat: <><path d="M5 11V7a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v4" /><path d="M4 11h16a1 1 0 0 1 1 1v4a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-4a1 1 0 0 1 1-1z" /><path d="M6 18v2M18 18v2" /></>,
    card: <><rect x="2" y="5" width="20" height="14" rx="2" /><path d="M2 10h20" /></>,
    shield: <path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6z" />,
    qr: <><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><path d="M14 14h3v3M21 14v7M17 21h4M14 21v-3" /></>,
    heart: <path d="M12 20s-7-4.5-9-9a4.5 4.5 0 0 1 8-3 4.5 4.5 0 0 1 8 3c-2 4.5-7 9-7 9z" />,
    info: <><circle cx="12" cy="12" r="9" /><path d="M12 11v5M12 8h.01" /></>,
    arrowRight: <path d="M5 12h14M13 6l6 6-6 6" />,
    bell: <><path d="M6 9a6 6 0 0 1 12 0c0 5 2 6 2 6H4s2-1 2-6z" /><path d="M10 19a2 2 0 0 0 4 0" /></>,
    sparkle: <path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z" />,
  };
  return <svg {...p}>{paths[name] || null}</svg>;
}

/* ---------------- Star rating (display) ---------------- */
function Stars({ value = 0, size = 15, gold = "#f6c445" }) {
  const full = Math.round(value);
  return (
    <span className="stars">
      {[1, 2, 3, 4, 5].map((i) => (
        <Icon key={i} name="star" size={size} color={i <= full ? gold : "#3a3e49"} fill={i <= full ? gold : "none"} stroke={1.5} />
      ))}
    </span>
  );
}

/* ---------------- Age badge ---------------- */
function AgeBadge({ age }) {
  const cls = age === "P" ? "p" : age === "T13" ? "t13" : "";
  return <span className={"badge badge-age " + cls}>{age}</span>;
}

/* ---------------- Poster (image or CSS fallback) ---------------- */
function Poster({ movie, titleSize = 26 }) {
  const [from, to] = movie.theme;
  const small = titleSize < 15;

  if (movie.poster) {
    return (
      <div
        className="poster"
        style={{ background: `linear-gradient(160deg, ${from} 0%, ${to} 120%)` }}
      >
        <img
          src={movie.poster}
          alt={movie.title}
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
            objectPosition: "center top",
            zIndex: 1,
            display: "block",
          }}
        />
        {/* subtle bottom gradient so badges/text remain legible */}
        <div style={{
          position: "absolute",
          inset: 0,
          zIndex: 2,
          background: "linear-gradient(0deg, rgba(0,0,0,0.55) 0%, transparent 45%)",
          pointerEvents: "none",
        }} />
      </div>
    );
  }

  /* CSS-only fallback (no real poster) */
  return (
    <div
      className="poster"
      style={{ background: `linear-gradient(160deg, ${from} 0%, ${to} 120%)` }}
    >
      <div className="poster-streak" />
      {!small && <div className="poster-emblem" style={{ color: movie.accent }}>CINEVERSE</div>}
      <div
        className="poster-title"
        style={{ fontSize: titleSize, color: "#fff", padding: small ? "0 8px 8px" : undefined }}
      >
        {!small && (
          <span style={{ color: movie.accent, display: "block", fontSize: titleSize * 0.42, letterSpacing: "0.12em", marginBottom: 4 }}>
            {movie.genres[0]}
          </span>
        )}
        <span style={{ display: "-webkit-box", WebkitLineClamp: small ? 3 : 4, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
          {movie.title}
        </span>
      </div>
      {/* unified gold corner marks */}
    </div>
  );
}

/* ---------------- Real QR (qrcode.js) ---------------- */
function QR({ value = "", size = 132 }) {
  const ref = useRef(null);
  useEffect(() => {
    if (!ref.current) return;
    ref.current.innerHTML = "";
    const qrVal = value || "CINEVERSE";
    if (window.QRCode) {
      try {
        new window.QRCode(ref.current, {
          text: qrVal,
          width: size,
          height: size,
          colorDark: "#000000",
          colorLight: "#ffffff",
          correctLevel: window.QRCode.CorrectLevel.H,
        });
      } catch(e) { ref.current.innerHTML = "<div style='background:#fff;padding:8px;font-size:10px;color:#000'>QR</div>"; }
    } else {
      // fallback: show code text in white box
      ref.current.innerHTML = `<div style="background:#fff;width:${size}px;height:${size}px;display:grid;place-items:center;font-family:monospace;font-size:11px;color:#000;padding:8px;text-align:center;word-break:break-all">${qrVal}</div>`;
    }
  }, [value, size]);
  return (
    <div ref={ref} style={{ borderRadius: 10, overflow: "hidden", display: "inline-block", lineHeight: 0 }} />
  );
}

/* ---------------- Modal ---------------- */
function Modal({ children, onClose, width }) {
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose && onClose();
    window.addEventListener("keydown", onKey);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [onClose]);
  return ReactDOM.createPortal(
    <div className="modal-veil" onClick={onClose}>
      <div className="modal" role="dialog" aria-modal="true" style={width ? { maxWidth: width } : null} onClick={(e) => e.stopPropagation()}>
        {children}
      </div>
    </div>,
    document.body
  );
}

/* ---------------- Header ---------------- */
function Header({ route, onNav, canBack, onBack, ticketCount, user, onSearch, onLogout }) {
  const links = [
    { k: "home", label: "Phim" },
    { k: "showtimes", label: "Lịch chiếu" },
    { k: "tickets", label: "Vé của tôi" },
    { k: "promo", label: "Ưu đãi" },
  ];
  return (
    <header className="hdr">
      <div className="wrap hdr-inner">
        {canBack && onBack && (
          <button className="chip" onClick={onBack} title="Quay lại trang trước" style={{ marginRight: 4, paddingLeft: 10 }}>
            <Icon name="chevronL" size={15} /> Quay lại
          </button>
        )}
        <div className="logo" style={{ cursor: "pointer" }} onClick={() => onNav("home")}>
          <span className="logo-mark">
            <Icon name="film" size={20} color="#1a1404" stroke={2} />
          </span>
          CINE<b>VERSE</b>
        </div>
        <nav className="nav">
          {links.map((l) => (
            <a key={l.k} className={route === l.k ? "on" : ""} aria-current={route === l.k ? "page" : undefined} onClick={() => onNav(l.k)}>
              {l.label}
            </a>
          ))}
        </nav>
        <div className="hdr-right">
          <button className="chip hdr-search" onClick={onSearch} style={{ paddingLeft: 12 }} aria-label="Tìm phim">
            <Icon name="search" size={16} /> <span>Tìm phim</span>
          </button>
          <button className="btn btn-gold btn-sm hdr-ticket" onClick={() => onNav("tickets")}>
            <Icon name="ticket" size={16} color="#211803" />
            <span>Vé {ticketCount ? `(${ticketCount})` : ""}</span>
          </button>
          {onLogout && (
            <button className="btn btn-ghost btn-sm hdr-logout" onClick={onLogout} title="Đăng xuất" aria-label="Đăng xuất">
              <Icon name="close" size={15} />
            </button>
          )}
          <div className="avatar" style={{ background: user.avatar }} title={user.name}>
            {user.name.split(" ").slice(-1)[0][0]}
          </div>
        </div>
      </div>
    </header>
  );
}

/* ---------------- Footer ---------------- */
function Footer() {
  return (
    <footer className="footer">
      <div className="wrap" style={{ display: "flex", justifyContent: "space-between", gap: 20, flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span className="logo-mark" style={{ width: 28, height: 28 }}>
            <Icon name="film" size={16} color="#1a1404" stroke={2} />
          </span>
          <span className="head-up" style={{ fontFamily: "var(--ff-head)", fontWeight: 700, letterSpacing: "0.06em" }}>
            CINEVERSE
          </span>
          <span style={{ marginLeft: 8 }}>· Hệ thống đặt vé xem phim trực tuyến</span>
        </div>
        <div>© 2026 CINEVERSE — Đồ án Phân tích & Thiết kế hệ thống · Bản demo MVP</div>
      </div>
    </footer>
  );
}

/* ---------------- Toast host ---------------- */
function useToasts() {
  const [toasts, setToasts] = useState([]);
  const push = (msg, kind = "ok") => {
    const id = Math.random().toString(36).slice(2);
    setToasts((t) => [...t, { id, msg, kind }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3200);
  };
  const node = (
    <div className="toast-wrap">
      {toasts.map((t) => (
        <div key={t.id} className={"toast " + (t.kind === "warn" ? "warn" : "")}>
          <Icon name={t.kind === "warn" ? "bell" : "checkCircle"} size={16} color={t.kind === "warn" ? "var(--coral)" : "var(--mint)"} />
          {t.msg}
        </div>
      ))}
    </div>
  );
  return [push, node];
}

/* ---------------- Stepper ---------------- */
function Stepper({ step }) {
  // 1 seats, 2 payment, 3 done
  const steps = ["Chọn ghế", "Thanh toán", "Hoàn tất"];
  return (
    <div className="stepper">
      {steps.map((s, i) => {
        const n = i + 1;
        const cls = n < step ? "done" : n === step ? "on" : "";
        return (
          <React.Fragment key={s}>
            <div className={"step " + cls}>
              <span className="num">{n < step ? <Icon name="check" size={14} color="var(--mint)" /> : n}</span>
              {s}
            </div>
            {i < steps.length - 1 && <span className="step-line" />}
          </React.Fragment>
        );
      })}
    </div>
  );
}

Object.assign(window, {
  Icon, Stars, AgeBadge, Poster, QR, Modal, Header, Footer, useToasts, Stepper,
});
