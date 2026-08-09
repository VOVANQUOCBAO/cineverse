/* ============================================================
   CINEVERSE — Screens: Home (Browse) · Movie Detail · Reviews
   ============================================================ */
const CINE = window.CINE;
const { useState, useEffect, useRef, useMemo } = React;

/* ---------------- Shared-element poster flip ----------------
   Khi bấm poster ở lưới: nhân bản poster bay mượt (spring) và phóng to
   đúng vị trí poster lớn bên trang chi tiết, tạo cảm giác liền mạch. */
const CFFlip = {
  el: null, from: null,
  start(srcEl, movie) {
    try {
      this.cancel();
      if (!srcEl) return;
      const r = srcEl.getBoundingClientRect();
      if (!r.width) return;
      const d = document.createElement("div");
      d.style.cssText =
        "position:fixed;z-index:200;left:0;top:0;border-radius:14px;overflow:hidden;" +
        "transform-origin:top left;pointer-events:none;background:#0e1015;" +
        "box-shadow:0 40px 90px rgba(0,0,0,.6);will-change:transform,opacity;" +
        "transition:transform .62s cubic-bezier(.5,1.22,.36,1), opacity .28s ease .4s;";
      d.style.width = r.width + "px";
      d.style.height = r.height + "px";
      d.style.transform = "translate(" + r.left + "px," + r.top + "px)";
      if (movie && movie.poster) {
        const img = document.createElement("img");
        img.src = movie.poster;
        img.style.cssText = "width:100%;height:100%;object-fit:cover;object-position:center top;display:block;";
        d.appendChild(img);
      }
      document.body.appendChild(d);
      this.el = d; this.from = r;
    } catch (e) {}
  },
  finish(destEl) {
    const d = this.el; if (!d) return;
    const f = this.from;
    if (!destEl || !f) { this.cancel(); return; }
    const r = destEl.getBoundingClientRect();
    if (!r.width) { this.cancel(); return; }
    const sx = r.width / f.width, sy = r.height / f.height;
    requestAnimationFrame(() => {
      d.style.transform = "translate(" + r.left + "px," + r.top + "px) scale(" + sx + "," + sy + ")";
    });
    this.el = null; this.from = null;
    setTimeout(() => { d.style.opacity = "0"; }, 580);
    setTimeout(() => { d.remove(); }, 920);
  },
  cancel() { if (this.el) { try { this.el.remove(); } catch (e) {} this.el = null; this.from = null; } }
};

/* ---------------- Movie card ---------------- */
function MovieCard({ movie, onOpen, index = 0 }) {
  const avg = CINE.avgScore(movie.id);
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    let revealed = false;
    const show = () => { if (!revealed) { revealed = true; el.classList.add("cf-in"); } };
    if (typeof IntersectionObserver === "undefined") { show(); return; }
    const io = new IntersectionObserver((ents) => {
      ents.forEach((en) => { if (en.isIntersecting) { show(); io.unobserve(el); } });
    }, { threshold: 0.1, rootMargin: "0px 0px -6% 0px" });
    io.observe(el);
    const fb = setTimeout(show, 900);   // an toàn nếu IO không kích hoạt
    return () => { clearTimeout(fb); io.disconnect(); };
  }, []);
  return (
    <div ref={ref} className="mcard cf-card" style={{ transitionDelay: (index % 4) * 70 + "ms" }} onClick={() => onOpen(movie)}>
      <div className="poster-outer">
        <Poster movie={movie} titleSize={22} />
        <div className="mcard-play">
          <span className="play-btn">
            <Icon name="play" size={22} color="#211803" />
          </span>
        </div>
      </div>
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
          <AgeBadge age={movie.age} />
          {movie.score > 0 && (
            <span className="badge badge-score">
              <Icon name="star" size={12} color="var(--gold)" fill="var(--gold)" stroke={0} /> {movie.score.toFixed(1)}
            </span>
          )}
          {movie.formats.includes("IMAX") && <span className="badge badge-format">IMAX</span>}
          <span className="badge" style={{ background: "var(--surface-2)", color: "var(--muted)", border: "1px solid var(--line)" }}>{movie.duration}'</span>
        </div>
        <div className="mcard-title">{movie.title}</div>
      </div>
    </div>
  );
}

/* ---------------- Hero carousel ---------------- */
function Hero({ movies, onOpen, onBook }) {
  const [i, setI] = useState(0);
  const [trailerMovie, setTrailerMovie] = useState(null);
  const feat = movies.slice(0, 4);
  useEffect(() => {
    if (trailerMovie) return;   // dừng xoay khi đang mở trailer → iframe không bị remount/tua lại
    const t = setInterval(() => setI((x) => (x + 1) % feat.length), 5500);
    return () => clearInterval(t);
  }, [feat.length, trailerMovie]);
  const m = feat[i];
  const [from, to] = m.theme;
  return (
    <section className="hero">
      <div className="hero-bg" key={m.id}>
        {m.poster ? (
          <>
            <img
              src={m.poster}
              alt=""
              style={{
                position: "absolute", inset: 0, width: "100%", height: "100%",
                objectFit: "cover", objectPosition: "center 20%",
                filter: "brightness(0.55) saturate(1.2)",
                transform: "scale(1.04)", zIndex: 0,
              }}
            />
            <div style={{
              position: "absolute", inset: 0, zIndex: 1,
              background: "linear-gradient(0deg, var(--bg) 4%, rgba(14,16,21,0.35) 55%, rgba(14,16,21,0.65)), linear-gradient(90deg, var(--bg) 2%, transparent 55%)",
            }} />
          </>
        ) : (
          <div style={{
            position: "absolute", inset: 0,
            background: `radial-gradient(80% 120% at 78% 20%, ${to}88, transparent 60%), linear-gradient(120deg, ${from}, ${to}55)`,
          }} />
        )}
      </div>
      <div className="wrap" style={{ width: "100%" }}>
        <div className="hero-inner fade-up" key={"c" + m.id}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
            <span className="chip active" style={{ background: m.accent, borderColor: m.accent, color: "#1a1404" }}>
              <Icon name="sparkle" size={14} color="#1a1404" /> Phim nổi bật
            </span>
            {m.status === "coming" && <span className="chip">Khởi chiếu {m.release.slice(8, 10)}/{m.release.slice(5, 7)}</span>}
          </div>
          <h1 className="hero-title">{m.title}</h1>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14, flexWrap: "wrap" }}>
            <AgeBadge age={m.age} />
            {m.score > 0 && <span className="badge badge-score"><Icon name="star" size={12} color="var(--gold)" fill="var(--gold)" stroke={0} /> {m.score.toFixed(1)}</span>}
            <span className="muted" style={{ fontSize: 13.5 }}>{m.genres.join(" · ")} · {m.duration} phút</span>
          </div>
          <p className="muted" style={{ fontSize: 15.5, maxWidth: 540, marginBottom: 22 }}>{m.synopsis}</p>
          <div className="hero-actions">
            <button className="btn btn-gold btn-lg" onClick={() => onBook(m)}>
              <Icon name="ticket" size={18} color="#211803" /> Đặt vé ngay
            </button>
            <button className="btn btn-ghost btn-lg" onClick={() => onOpen(m)}>
              <Icon name="info" size={18} /> Chi tiết
            </button>
            {m.trailer && (
              <button className="btn btn-ghost btn-lg" onClick={() => setTrailerMovie(m)}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
                Trailer
              </button>
            )}
          </div>
          {trailerMovie && <TrailerModal movie={trailerMovie} onClose={() => setTrailerMovie(null)} />}</div>
      </div>
      <div className="wrap" style={{ position: "absolute", left: "50%", transform: "translateX(-50%)", bottom: 0 }}>
        <div className="hero-dots">
          {feat.map((_, k) => (
            <span key={k} className={"hero-dot " + (k === i ? "on" : "")} onClick={() => setI(k)} />
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------------- Home / Browse ---------------- */
function HomeScreen({ onOpen, onBook }) {
  const [tab, setTab] = useState("now");

  return (
    <div>
      <Hero movies={CINE.movies.filter((m) => m.status === "now")} onOpen={onOpen} onBook={onBook} />

      <div className="wrap section">
        <div className="section-head">
          <h2 className="section-title"><span className="bar" />{tab === "now" ? "Phim đang chiếu" : "Phim sắp chiếu"}</h2>
          <div className="tabs">
            <button className={"tab " + (tab === "now" ? "on" : "")} onClick={() => setTab("now")}>Đang chiếu</button>
            <button className={"tab " + (tab === "coming" ? "on" : "")} onClick={() => setTab("coming")}>Sắp chiếu</button>
          </div>
        </div>

        <div className="grid-movies">
          {CINE.movies.filter((m) => m.status === tab).map((m, i) => (
            <MovieCard key={m.id} movie={m} onOpen={onOpen} index={i} />
          ))}
        </div>
      </div>

      {/* promo strip */}
      <div className="wrap" style={{ marginBottom: 20 }}>
        <div className="card" style={{ padding: "28px 34px", display: "flex", alignItems: "center", gap: 24, background: "linear-gradient(110deg, var(--surface), rgba(246,196,69,0.08))", flexWrap: "wrap" }}>
          <div style={{ flex: 1, minWidth: 280 }}>
            <h3 style={{ fontSize: 24, textTransform: "uppercase", marginBottom: 6 }}>Thành viên CINEVERSE — Tích điểm đổi vé</h3>
            <p className="muted" style={{ margin: 0 }}>Đặt vé online tích luỹ điểm, đổi bắp nước & vé xem phim miễn phí. Ưu đãi thứ 4 vui vẻ giảm 30%.</p>
          </div>
          <button className="btn btn-outline btn-lg"><Icon name="heart" size={18} /> Tìm hiểu thêm</button>
        </div>
      </div>
    </div>
  );
}

/* ---------------- Showtime selector block ---------------- */
function ShowtimePicker({ movie, onPick }) {
  const [date, setDate] = useState(CINE.dates[0]?.key || "");
  const sts = CINE.showtimes.filter((s) => s.movieId === movie.id && s.date === date);
  const byCinema = {};
  sts.forEach((s) => {
    (byCinema[s.cinemaId] = byCinema[s.cinemaId] || []).push(s);
  });
  const cinemaIds = Object.keys(byCinema);

  return (
    <div>
      <div className="date-strip" style={{ marginBottom: 26 }}>
        {CINE.dates.map((d) => (
          <div key={d.key} className={"date-pill " + (date === d.key ? "on" : "")} onClick={() => setDate(d.key)}>
            <div className="wd">{d.wd}</div>
            <div className="dd">{d.dd}</div>
            <div className="wd">/{d.mm}</div>
          </div>
        ))}
      </div>

      {movie.status === "coming" ? (
        <div className="empty" style={{ padding: 40 }}>
          <Icon name="clock" size={28} color="var(--muted-2)" />
          <p style={{ marginTop: 10 }}>Phim sắp khởi chiếu ngày {movie.release.slice(8, 10)}/{movie.release.slice(5, 7)}. Lịch chiếu sẽ sớm cập nhật.</p>
        </div>
      ) : cinemaIds.length === 0 ? (
        <div className="empty">Không có suất chiếu cho ngày này.</div>
      ) : (
        cinemaIds.map((cid) => {
          const c = CINE.cinemaById(cid);
          if (!c) return null;
          return (
            <div key={cid} style={{ marginBottom: 22 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 12 }}>
                <Icon name="location" size={17} color="var(--gold)" />
                <div>
                  <div style={{ fontWeight: 600 }}>{c.name}</div>
                  <div className="muted" style={{ fontSize: 12.5 }}>{c.address}</div>
                </div>
              </div>
              <div className="st-grid">
                {byCinema[cid].map((s) => (
                  <div key={s.id} className="st-pill" onClick={() => onPick(s)}>
                    <div className="t">{s.time}</div>
                    <div className="p">{s.format} · {F(s.price.regular)}</div>
                  </div>
                ))}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}

/* ---------------- Reviews block ---------------- */
function ReviewsBlock({ movie, reviews, canReview, onAddReview, push }) {
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [text, setText] = useState("");
  const avg = CINE.avgScore(movie.id) || movie.score;
  const list = reviews.filter((r) => r.movieId === movie.id);

  const submit = () => {
    if (!rating) return push("Vui lòng chọn số sao đánh giá.", "warn");
    onAddReview({ movieId: movie.id, rating, text: text.trim() || "(Không có nhận xét)" });
    setOpen(false);
    setRating(0);
    setText("");
    push("Cảm ơn bạn đã đánh giá phim!");
  };

  return (
    <div className="section" style={{ paddingTop: 30 }}>
      <div className="section-head">
        <h2 className="section-title" style={{ fontSize: 24 }}><span className="bar" />Đánh giá & Bình luận</h2>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ textAlign: "right" }}>
            <span style={{ fontFamily: "var(--ff-head)", fontSize: 28, color: "var(--gold)" }}>{avg ? avg.toFixed(1) : "—"}</span>
            <span className="muted" style={{ fontSize: 13 }}> /5 · {list.length} đánh giá</span>
          </div>
        </div>
      </div>

      {canReview ? (
        <button className="btn btn-gold" onClick={() => setOpen(true)} style={{ marginBottom: 8 }}>
          <Icon name="star" size={16} color="#211803" fill="#211803" stroke={0} /> Viết đánh giá
        </button>
      ) : (
        <div className="chip" style={{ marginBottom: 8 }}>
          <Icon name="info" size={14} /> Chỉ khách đã đặt vé phim này mới có thể đánh giá
        </div>
      )}

      <div style={{ marginTop: 16 }}>
        {list.length === 0 && <div className="empty" style={{ padding: 36 }}>Chưa có đánh giá nào. Hãy là người đầu tiên!</div>}
        {list.map((r) => (
          <div className="review" key={r.id}>
            <div className="rev-avatar" style={{ background: r.avatar }}>{r.user[0]}</div>
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
                <b style={{ fontSize: 14.5 }}>{r.user}</b>
                {r.verified && (
                  <span className="badge" style={{ background: "var(--mint-soft)", color: "var(--mint)" }}>
                    <Icon name="checkCircle" size={12} color="var(--mint)" /> Đã xem phim
                  </span>
                )}
                <span className="muted-2" style={{ fontSize: 12, marginLeft: "auto" }}>{r.date.split("-").reverse().join("/")}</span>
              </div>
              <Stars value={r.rating} size={14} />
              <p style={{ margin: "6px 0 0", fontSize: 14.5 }}>{r.text}</p>
            </div>
          </div>
        ))}
      </div>

      {open && (
        <Modal onClose={() => setOpen(false)}>
          <div style={{ padding: 26 }}>
            <h3 style={{ fontSize: 22, textTransform: "uppercase", marginBottom: 4 }}>Đánh giá phim</h3>
            <p className="muted" style={{ marginTop: 0 }}>{movie.title}</p>
            <div className="star-input" style={{ display: "flex", gap: 6, margin: "18px 0" }}>
              {[1, 2, 3, 4, 5].map((i) => (
                <span key={i} onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(0)} onClick={() => setRating(i)}>
                  <Icon name="star" size={34} color={i <= (hover || rating) ? "var(--gold)" : "#3a3e49"} fill={i <= (hover || rating) ? "var(--gold)" : "none"} stroke={1.5} />
                </span>
              ))}
            </div>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Chia sẻ cảm nhận của bạn về bộ phim..."
              style={{ width: "100%", minHeight: 110, background: "var(--bg)", border: "1px solid var(--line-2)", borderRadius: 12, color: "var(--text)", padding: 14, fontFamily: "inherit", fontSize: 14.5, resize: "vertical" }}
            />
            <div style={{ display: "flex", gap: 10, marginTop: 18, justifyContent: "flex-end" }}>
              <button className="btn btn-ghost" onClick={() => setOpen(false)}>Huỷ</button>
              <button className="btn btn-gold" onClick={submit}>Gửi đánh giá</button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

/* ---------------- Trailer Embed (inline player) ---------------- */
function TrailerEmbed({ movie, hero, autoPlay, sound, fluid, onEnded }) {
  const [playing, setPlaying] = useState(!!autoPlay);
  const [embedError, setEmbedError] = useState(false);
  const [muted, setMuted] = useState(!!autoPlay);
  const hostRef = useRef(null);
  const playerRef = useRef(null);
  const wrapRef = useRef(null);
  const [from, to] = movie.theme;

  /* Ảnh thumbnail xem trước (trước khi bấm phát):
     - maxresdefault (1280×720): still HD nét của trailer chính thức → ưu tiên.
     - Nếu video không có bản HD (404) hoặc YouTube trả ảnh xám "no preview"
       (naturalWidth ≤ 120) → dùng thẳng POSTER phim làm nền điện ảnh.
       (bỏ qua hqdefault 480p vì khung đó mờ, kém đẹp). */
  const [thumbSrc, setThumbSrc] = useState(`https://img.youtube.com/vi/${movie.trailer}/maxresdefault.jpg`);
  const [thumbKind, setThumbKind] = useState("yt"); // "yt" | "poster" | "none"
  const thumbStepRef = useRef("max");
  const thumb = thumbSrc; // dùng làm poster cho thẻ <video> (trường hợp có MP4 nội bộ)
  const degradeThumb = () => {
    if (thumbStepRef.current === "max" && movie.poster) {
      thumbStepRef.current = "poster";
      setThumbKind("poster");
      setThumbSrc(movie.poster);
    } else if (thumbStepRef.current === "max") {
      thumbStepRef.current = "hq";
      setThumbSrc(`https://img.youtube.com/vi/${movie.trailer}/hqdefault.jpg`);
    } else {
      setThumbKind("none");
    }
  };

  /* A self-hosted MP4 (movie.trailerFile) is the most reliable: native <video>,
     never blocked, no Error 153. Token-aware so it loads in preview. */
  const localSrc = movie.trailerFile
    ? (window.__withT ? window.__withT(movie.trailerFile) : movie.trailerFile)
    : null;

  /* Use the official YouTube IFrame Player API so onError (e.g. 101/150/153 =
     embedding disabled) fires reliably → we auto-show a clean fallback.
     Only used when there's no local MP4. */
  useEffect(() => {
    if (!playing || localSrc) return;
    let cancelled = false;

    const build = () => {
      if (cancelled || !hostRef.current || !window.YT || !window.YT.Player) return;
      const target = document.createElement("div");
      hostRef.current.innerHTML = "";
      hostRef.current.appendChild(target);
      try {
        playerRef.current = new window.YT.Player(target, {
          width: "100%", height: "100%",
          videoId: movie.trailer,
          // autoplay → tắt tiếng để chắc chắn chạy & hiện ngay (trình duyệt không
          // chặn). Người dùng tự bấm play thì có tiếng bình thường. Bật tiếng cho
          // autoplay được thử lại trong onReady.
          playerVars: { autoplay: 1, rel: 0, modestbranding: 1, playsinline: 1, mute: autoPlay ? 1 : 0 },
          events: {
            onReady: (e) => {
              try {
                e.target.playVideo();
                // sound: thử bật tiếng (thành công nếu cú click mở phim còn hiệu lực gesture)
                if (sound) { e.target.unMute(); e.target.setVolume(100); }
                setMuted(e.target.isMuted ? e.target.isMuted() : !sound);
                const lv = e.target.getAvailableQualityLevels && e.target.getAvailableQualityLevels();
                e.target.setPlaybackQuality && e.target.setPlaybackQuality(lv && lv.length ? lv[0] : "hd1080");
              } catch (err) {}
            },
            onStateChange: (e) => {
              if (!window.YT) return;
              // Xem hết trailer → báo ra ngoài (đóng lightbox + nhảy xuống mua vé)
              if (e.data === window.YT.PlayerState.ENDED) { onEnded && onEnded(); return; }
              // Khi bắt đầu phát: đồng bộ trạng thái loa + ép phân giải cao nhất
              if (e.data === window.YT.PlayerState.PLAYING) {
                try {
                  setMuted(e.target.isMuted());
                  const lv = e.target.getAvailableQualityLevels();
                  if (lv && lv.length) e.target.setPlaybackQuality(lv[0]);
                } catch (err) {}
              }
            },
            onError: () => { if (!cancelled) setEmbedError(true); },
          },
        });
      } catch (e) { setEmbedError(true); }
    };

    if (window.YT && window.YT.Player) {
      build();
    } else {
      if (!document.getElementById("yt-iframe-api")) {
        const s = document.createElement("script");
        s.id = "yt-iframe-api";
        s.src = "https://www.youtube.com/iframe_api";
        document.head.appendChild(s);
      }
      const poll = setInterval(() => {
        if (window.YT && window.YT.Player) { clearInterval(poll); build(); }
      }, 150);
      return () => { cancelled = true; clearInterval(poll); try { playerRef.current?.destroy?.(); } catch (e) {} };
    }
    return () => { cancelled = true; try { playerRef.current?.destroy?.(); } catch (e) {} };
  }, [playing, movie.trailer, localSrc]);

  /* Autoplay buộc phải muted (chính sách trình duyệt) → video tự chạy nhưng tắt
     tiếng. Người dùng tự chủ động bật tiếng bằng nút loa (kiểu Netflix/Galaxy). */
  const toggleMute = () => {
    const p = playerRef.current;
    if (!p) return;
    try {
      if (muted) { p.unMute(); p.setVolume(100); setMuted(false); }
      else { p.mute(); setMuted(true); }
    } catch (e) {}
  };


  /* Hero = dải banner TRÀN VIỀN toàn màn hình (full-bleed), bo góc 0, không viền.
     Chiều cao cinematic co giãn theo bề rộng (clamp) nên gọn, không cao như 16:9 full. */
  const outer = hero
    ? { position: "relative", width: "100%", borderRadius: 0, overflow: "hidden", border: "none", background: "#000", height: "clamp(300px, 46vw, 600px)" }
    : fluid
    ? { position: "relative", width: "100%", borderRadius: 14, overflow: "hidden", border: "1px solid var(--line-2)", background: "#000", boxShadow: "0 30px 90px rgba(0,0,0,0.6)" }
    : { position: "relative", marginTop: 20, maxWidth: 640, borderRadius: 14, overflow: "hidden", border: "1px solid var(--line-2)", background: "#000" };

  /* Cover-crop để KHÔNG bị viền đen: video luôn đúng tỉ lệ 16:9 của bề rộng màn
     hình (height = 56.25vw), canh giữa theo trục dọc rồi để outer cắt phần thừa. */
  const fill = hero
    ? { position: "absolute", left: 0, top: "50%", width: "100%", height: "56.25vw", transform: "translateY(-50%)" }
    : { aspectRatio: "16/9" };

  /* Fallback: YouTube video blocks embedding → open on YouTube */
  if (embedError) {
    return (
      <div style={{ ...outer, position: "relative", ...(hero ? {} : { aspectRatio: "16/9" }), background: `linear-gradient(120deg,${from},${to})` }}>
        <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.6)" }} />
        <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16, textAlign: "center", padding: 20 }}>
          <div style={{ fontSize: 13.5, color: "rgba(255,255,255,0.75)" }}>Trailer này bị chặn nhúng — xem trực tiếp trên YouTube</div>
          <a href={`https://www.youtube.com/watch?v=${movie.trailer}`} target="_blank" rel="noreferrer"
            style={{ display: "inline-flex", alignItems: "center", gap: 9, padding: "12px 24px", borderRadius: 10, background: "#ff0000", color: "#fff", fontWeight: 700, fontSize: 14.5, textDecoration: "none" }}>
            <svg width="22" height="15" viewBox="0 0 20 14" fill="white"><path d="M19.6 2.2C19.4 1.4 18.8.8 18 .6 16.4.2 10 .2 10 .2S3.6.2 2 .6C1.2.8.6 1.4.4 2.2 0 3.8 0 7 0 7s0 3.2.4 4.8c.2.8.8 1.4 1.6 1.6C3.6 13.8 10 13.8 10 13.8s6.4 0 8-.4c.8-.2 1.4-.8 1.6-1.6.4-1.6.4-4.8.4-4.8s0-3.2-.4-4.8zM8 10V4l5.3 3L8 10z"/></svg>
            Xem trên YouTube
          </a>
        </div>
      </div>
    );
  }

  return (
    <div ref={wrapRef} style={outer}>
      {playing && (
        <button
          onClick={() => { const el = wrapRef.current; if (!el) return; const fn = el.requestFullscreen || el.webkitRequestFullscreen || el.msRequestFullscreen; fn && fn.call(el); }}
          title="Phóng to toàn màn hình"
          style={{ position: "absolute", top: 10, right: 12, zIndex: 6, background: "rgba(0,0,0,0.5)", border: "1px solid rgba(255,255,255,0.25)", color: "#fff", borderRadius: 8, padding: "6px 11px", fontSize: 12, fontWeight: 600, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6 }}>
          ⤢ Toàn màn hình
        </button>
      )}
      {/* Nút bật / tắt tiếng — autoplay luôn muted, user tự bật (kiểu Netflix/Galaxy) */}
      {playing && !localSrc && (
        <button
          onClick={toggleMute}
          title={muted ? "Bật tiếng" : "Tắt tiếng"}
          style={{ position: "absolute", bottom: 14, right: 14, zIndex: 6, background: muted ? "var(--gold)" : "rgba(0,0,0,0.5)", border: muted ? "none" : "1px solid rgba(255,255,255,0.25)", color: muted ? "#1a1404" : "#fff", borderRadius: 999, padding: "9px 16px", fontSize: 13, fontWeight: 700, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 8, boxShadow: muted ? "0 4px 18px rgba(246,196,69,0.45)" : "none" }}>
          {muted ? (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M3 9v6h4l5 5V4L7 9H3z" /><path d="M16 9.5l4 5m0-5l-4 5" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" /></svg>
          ) : (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M3 9v6h4l5 5V4L7 9H3z" /><path d="M16 8.5a4.5 4.5 0 010 7M18.5 6a8 8 0 010 12" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" /></svg>
          )}
          {muted ? "Bật tiếng" : "Tắt tiếng"}
        </button>
      )}
      {!playing ? (
        <div onClick={() => setPlaying(true)}
          style={{ position: "relative", ...fill, cursor: "pointer", background: `linear-gradient(120deg,${from},${to})`, minHeight: 200 }}>
          {thumbKind === "poster" ? (
            <>
              {/* nền điện ảnh: poster làm mờ phủ kín 16:9 + poster nguyên vẹn ở giữa */}
              <div style={{ position: "absolute", inset: 0, backgroundImage: `url(${thumbSrc})`, backgroundSize: "cover", backgroundPosition: "center", filter: "blur(26px) brightness(0.5)", transform: "scale(1.15)" }} />
              <img src={thumbSrc} alt={`Trailer ${movie.title}`}
                style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "contain" }}
                onError={degradeThumb} />
            </>
          ) : thumbKind === "yt" ? (
            <img src={thumbSrc} alt={`Trailer ${movie.title}`}
              style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", opacity: 0.85 }}
              onError={degradeThumb}
              onLoad={(e) => { if (e.target.naturalWidth <= 120) degradeThumb(); }} />
          ) : null}
          <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.38)" }} />
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(0deg,rgba(0,0,0,0.55) 0%,transparent 55%)" }} />
          <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 14 }}>
            <span style={{ width: 76, height: 76, borderRadius: "50%", background: "var(--gold)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 0 0 8px rgba(246,196,69,0.18), 0 6px 28px rgba(246,196,69,0.5)" }}>
              <svg width="30" height="30" viewBox="0 0 24 24" fill="#1a1404"><path d="M8 5v14l11-7z"/></svg>
            </span>
            <div style={{ color: "#fff", fontFamily: "var(--ff-head)", fontSize: 14, textTransform: "uppercase", letterSpacing: "0.12em", fontWeight: 700, textShadow: "0 2px 8px rgba(0,0,0,.8)" }}>Xem Trailer</div>
          </div>
          <div style={{ position: "absolute", bottom: 12, left: 16, color: "rgba(255,255,255,0.8)", fontSize: 13, fontWeight: 600, textShadow: "0 1px 4px rgba(0,0,0,.7)" }}>{movie.title}</div>
          <div style={{ position: "absolute", top: 12, right: 14, background: "rgba(246,196,69,0.15)", border: "1px solid rgba(246,196,69,0.35)", borderRadius: 6, padding: "3px 10px", fontSize: 11, color: "var(--gold)", fontWeight: 600, letterSpacing: "0.06em" }}>{localSrc ? "TRAILER HD" : "TRAILER"}</div>
        </div>
      ) : localSrc ? (
        <div style={{ position: "relative", ...fill, width: "100%" }}>
          <video
            src={localSrc}
            controls
            autoPlay
            playsInline
            muted={!sound}
            poster={thumb}
            onEnded={onEnded}
            style={{ position: "absolute", inset: 0, width: "100%", height: "100%", background: "#000" }}
          />
        </div>
      ) : (
        <div ref={hostRef} style={{ position: "relative", ...fill, width: "100%" }} />
      )}
    </div>
  );
}

/* Sân khấu trailer "không điểm dừng" — 3 chế độ điều khiển bởi prop `mode`:
   "loading"  : chiếu loading.mp4 ở giữa (chỉ lần đầu vào phim)
   "fg"       : trailer ra giữa (16:9), có tiếng, có nút điều khiển
   "bg"       : trailer phủ FULL màn hình làm NỀN mờ/tối phía sau nội dung, lặp vô tận
   Player YouTube được tạo MỘT LẦN và giữ nguyên khi chuyển fg↔bg → không tải lại,
   nên các lần mở lại không cần loading. */
function TrailerLightbox({ movie, mode, onLoadingEnd, onEnded, onMinimize }) {
  const hostRef = useRef(null);     // khung chứa player YouTube
  const playerRef = useRef(null);   // instance YT.Player
  const builtRef = useRef(false);   // đã tạo player chưa (chỉ tạo 1 lần)
  const modeRef = useRef(mode);     // mode hiện tại cho callback onStateChange
  modeRef.current = mode;
  const [muted, setMuted] = useState(true);
  const [vp, setVp] = useState({ w: window.innerWidth, h: window.innerHeight });

  const ctrl = (fn) => { try { fn && fn(playerRef.current); } catch (e) {} };
  const isBg = mode === "bg";

  useEffect(() => {
    const onResize = () => setVp({ w: window.innerWidth, h: window.innerHeight });
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // Khoá cuộn khi trailer ở giữa (loading/fg); cho cuộn khi đã lùi về nền.
  useEffect(() => {
    document.body.style.overflow = isBg ? "" : "hidden";
    return () => { document.body.style.overflow = ""; };
  }, [isBg]);

  // Đánh dấu body khi trailer làm nền → ẩn ảnh nền tĩnh của hero để lộ trailer.
  useEffect(() => {
    if (isBg) document.body.classList.add("cf-amb");
    else document.body.classList.remove("cf-amb");
    return () => document.body.classList.remove("cf-amb");
  }, [isBg]);

  // ESC khi đang xem trailer ở giữa → lùi về nền (không biến mất).
  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape" && mode === "fg") onMinimize && onMinimize(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [mode, onMinimize]);

  // Tạo player YouTube MỘT LẦN (khi rời "loading"). Giữ nguyên player khi chuyển
  // fg↔bg → không tải lại, không cần loading ở lần mở sau. onStateChange bắt
  // "hết video": ở fg → báo ra ngoài (lùi về nền + hiện nội dung); ở bg → tự lặp.
  useEffect(() => {
    if (mode === "loading" || builtRef.current) return;
    builtRef.current = true;
    let cancelled = false;
    const build = () => {
      if (cancelled || !hostRef.current || !window.YT || !window.YT.Player) return;
      const target = document.createElement("div");
      hostRef.current.innerHTML = "";
      hostRef.current.appendChild(target);
      try {
        playerRef.current = new window.YT.Player(target, {
          width: "100%", height: "100%",
          videoId: movie.trailer,
          playerVars: { autoplay: 1, rel: 0, modestbranding: 1, playsinline: 1, controls: 0, mute: 1 },
          events: {
            onReady: (e) => {
              try {
                e.target.playVideo();
                if (modeRef.current === "fg") { e.target.unMute(); e.target.setVolume(100); }
                setMuted(e.target.isMuted ? e.target.isMuted() : true);
              } catch (err) {}
            },
            onStateChange: (e) => {
              if (!window.YT) return;
              if (e.data === window.YT.PlayerState.ENDED) {
                if (modeRef.current === "fg") { onEnded && onEnded(); }                 // hết → lùi về nền
                else { try { e.target.seekTo(0, true); e.target.playVideo(); } catch (err) {} } // ở nền → tự lặp
              }
            },
          },
        });
      } catch (e) {}
    };
    if (window.YT && window.YT.Player) { build(); }
    else {
      if (!document.getElementById("yt-iframe-api")) {
        const s = document.createElement("script");
        s.id = "yt-iframe-api";
        s.src = "https://www.youtube.com/iframe_api";
        document.head.appendChild(s);
      }
      const poll = setInterval(() => { if (window.YT && window.YT.Player) { clearInterval(poll); build(); } }, 150);
      return () => { cancelled = true; clearInterval(poll); };
    }
    return () => { cancelled = true; };
  }, [mode, movie.trailer]);

  // Huỷ player khi rời trang chi tiết.
  useEffect(() => () => { try { playerRef.current && playerRef.current.destroy && playerRef.current.destroy(); } catch (e) {} }, []);

  // Đồng bộ phát/tiếng theo chế độ: ra giữa (fg) → phát + bật tiếng; lùi nền → tắt tiếng.
  useEffect(() => {
    if (mode === "fg") {
      ctrl((p) => { if (p) { p.playVideo && p.playVideo(); p.unMute && p.unMute(); p.setVolume && p.setVolume(100); } });
      setMuted(false);
    } else if (mode === "bg") {
      ctrl((p) => p && p.mute && p.mute());
      setMuted(true);
    }
  }, [mode]);

  const toggleMute = () => {
    if (muted) { ctrl((p) => { if (p) { p.unMute && p.unMute(); p.setVolume && p.setVolume(100); } }); setMuted(false); }
    else { ctrl((p) => p && p.mute && p.mute()); setMuted(true); }
  };

  // ---- Hình học: khung 16:9 ở giữa (loading/fg) ↔ FULL màn hình làm nền (bg) ----
  let bigW = Math.min(940, vp.w * 0.92);
  let bigH = bigW * 9 / 16;
  if (bigH > vp.h * 0.82) { bigH = vp.h * 0.82; bigW = bigH * 16 / 9; }
  const box = isBg
    ? { w: vp.w, h: vp.h, left: 0, top: 0, radius: 0 }
    : { w: bigW, h: bigH, left: (vp.w - bigW) / 2, top: (vp.h - bigH) / 2, radius: 16 };

  // media phủ kín khung kiểu "cover"
  let mW = box.w, mH = box.w * 9 / 16;
  if (mH < box.h) { mH = box.h; mW = box.h * 16 / 9; }
  // Chuyển động "không điểm dừng": phóng/thu từ từ, đủ chậm để mắt theo kịp.
  const T = "1.15s cubic-bezier(.32,1.04,.32,1)";
  const mediaStyle = {
    position: "absolute", border: "none",
    width: mW + "px", height: mH + "px",
    left: (box.w - mW) / 2 + "px", top: (box.h - mH) / 2 + "px",
    transition: "width " + T + ", height " + T + ", left " + T + ", top " + T + ", filter .9s ease",
    filter: isBg ? "blur(16px) brightness(.42) saturate(1.18)" : "none",
  };
  const stageStyle = {
    position: "fixed", left: box.left + "px", top: box.top + "px",
    width: box.w + "px", height: box.h + "px", borderRadius: box.radius + "px",
    overflow: "hidden", background: "#000",
    zIndex: isBg ? 0 : 1200,               // bg: nằm sau nội dung (#root z-index:1) | fg: phủ lên trên
    boxShadow: isBg ? "none" : "0 40px 120px rgba(0,0,0,.7)",
    pointerEvents: isBg ? "none" : "auto",
    transition: "left " + T + ", top " + T + ", width " + T + ", height " + T + ", border-radius " + T + ", box-shadow .6s ease",
  };
  const loadSrc = (window.__withT ? window.__withT("loading.mp4") : "loading.mp4");

  // Portal ra thẳng document.body để thoát mọi transform/overflow của trang.
  return ReactDOM.createPortal(
    <>
      {/* nền tối khi trailer ở giữa; trong suốt & không chặn khi đã lùi về nền.
          Bấm ra nền lúc đang xem → đưa trailer về nền (không biến mất đột ngột). */}
      <div onClick={isBg ? undefined : (mode === "loading" ? onLoadingEnd : onMinimize)}
        style={{
          position: "fixed", inset: 0, zIndex: 1190,
          background: isBg ? "rgba(0,0,0,0)" : "rgba(6,7,10,0.92)",
          backdropFilter: isBg ? "none" : "blur(6px)",
          WebkitBackdropFilter: isBg ? "none" : "blur(6px)",
          transition: "background .8s ease, backdrop-filter .8s ease",
          pointerEvents: isBg ? "none" : "auto",
        }} />

      {/* sân khấu: loading → trailer (giữa) → nền full màn hình (mờ/tối, lặp) */}
      <div className="cf-stage" style={stageStyle}>
        {mode === "loading" ? (
          <video src={loadSrc} autoPlay muted playsInline preload="auto"
            ref={(el) => { if (el) { el.muted = true; const p = el.play(); if (p && p.catch) p.catch(() => {}); } }}
            onCanPlay={(e) => { e.currentTarget.muted = true; const p = e.currentTarget.play(); if (p && p.catch) p.catch(() => {}); }}
            onEnded={() => onLoadingEnd && onLoadingEnd()}
            style={{ ...mediaStyle, objectFit: "cover" }} />
        ) : (
          <div ref={hostRef}
            title={`Trailer — ${movie.title}`}
            style={{ ...mediaStyle, animation: "cfTrailerIn .55s ease both" }} />
        )}

        {/* lớp tối khi làm nền → giữ độ tương phản cho nội dung phía trên */}
        {isBg && (
          <div style={{ position: "absolute", inset: 0, pointerEvents: "none",
            background: "linear-gradient(180deg, rgba(10,11,15,.55), rgba(10,11,15,.74))" }} />
        )}

        {mode === "fg" && (
          <>
            <button onClick={(e) => { e.stopPropagation(); onMinimize && onMinimize(); }} title="Đưa trailer về nền (Esc)"
              style={{ position: "absolute", top: 12, right: 12, zIndex: 3, background: "rgba(0,0,0,.5)", border: "1px solid rgba(255,255,255,.25)", color: "#fff", borderRadius: 8, padding: "6px 11px", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>✕ Thu nhỏ</button>
            <button onClick={(e) => { e.stopPropagation(); toggleMute(); }} title={muted ? "Bật tiếng" : "Tắt tiếng"}
              style={{ position: "absolute", bottom: 14, right: 14, zIndex: 3, background: muted ? "var(--gold)" : "rgba(0,0,0,.5)", border: muted ? "none" : "1px solid rgba(255,255,255,.25)", color: muted ? "#1a1404" : "#fff", borderRadius: 999, padding: "9px 16px", fontSize: 13, fontWeight: 700, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 8, boxShadow: muted ? "0 4px 18px rgba(246,196,69,.45)" : "none" }}>
              {muted ? "🔇 Bật tiếng" : "🔊 Tắt tiếng"}
            </button>
          </>
        )}
      </div>
    </>,
    document.body
  );
}

/* ---------------- Trailer Modal ---------------- */
function TrailerModal({ movie, onClose }) {
  const hostRef = useRef(null);
  const playerRef = useRef(null);
  const [status, setStatus] = useState("loading");
  const [errorCode, setErrorCode] = useState(null);
  const watchUrl = `https://www.youtube.com/watch?v=${encodeURIComponent(movie.trailer || "")}`;

  useEffect(() => {
    if (!movie.trailer) {
      setStatus("error");
      return;
    }

    let cancelled = false;
    let pollTimer = null;
    let timeoutTimer = null;

    const fail = (code) => {
      if (cancelled) return;
      setErrorCode(code || null);
      setStatus("error");
    };

    const buildPlayer = () => {
      if (cancelled || !hostRef.current || !window.YT?.Player || playerRef.current) return;
      const mount = document.createElement("div");
      hostRef.current.innerHTML = "";
      hostRef.current.appendChild(mount);
      try {
        playerRef.current = new window.YT.Player(mount, {
          width: "100%",
          height: "100%",
          videoId: movie.trailer,
          playerVars: {
            autoplay: 1,
            mute: 1,
            controls: 1,
            playsinline: 1,
            rel: 0,
            modestbranding: 1,
            ...(location.protocol.startsWith("http") ? { origin: location.origin } : {}),
          },
          events: {
            onReady: (event) => {
              if (cancelled) return;
              clearTimeout(timeoutTimer);
              setStatus("ready");
              try { event.target.playVideo(); } catch (e) {}
            },
            onError: (event) => fail(event.data),
          },
        });
      } catch (e) {
        fail("PLAYER_INIT");
      }
    };

    if (window.YT?.Player) {
      buildPlayer();
    } else {
      if (!document.getElementById("yt-iframe-api")) {
        const script = document.createElement("script");
        script.id = "yt-iframe-api";
        script.src = "https://www.youtube.com/iframe_api";
        script.async = true;
        script.onerror = () => fail("API_LOAD");
        document.head.appendChild(script);
      }
      pollTimer = window.setInterval(() => {
        if (window.YT?.Player) {
          clearInterval(pollTimer);
          buildPlayer();
        }
      }, 120);
    }

    timeoutTimer = window.setTimeout(() => fail("TIMEOUT"), 12000);
    return () => {
      cancelled = true;
      clearInterval(pollTimer);
      clearTimeout(timeoutTimer);
      try { playerRef.current?.destroy?.(); } catch (e) {}
      playerRef.current = null;
    };
  }, [movie.trailer]);

  return (
    <Modal onClose={onClose} width={1040}>
      <div className="trailer-player">
        <div className="trailer-player-head">
          <div>
            <span className="trailer-kicker">Trailer chính thức</span>
            <h2>{movie.title}</h2>
          </div>
          <button onClick={onClose} className="trailer-close" aria-label="Đóng trailer">
            <Icon name="close" size={18} />
          </button>
        </div>
        <div className="trailer-stage">
          <div ref={hostRef} className={status === "error" ? "trailer-host is-hidden" : "trailer-host"} />
          {status === "loading" && (
            <div className="trailer-state" role="status">
              <span className="spin" />
              <strong>Đang mở trailer</strong>
              <span>Kết nối tới trình phát YouTube…</span>
            </div>
          )}
          {status === "error" && (
            <div className="trailer-state trailer-fallback">
              {movie.poster && <img src={movie.poster} alt="" />}
              <div className="trailer-fallback-shade" />
              <div className="trailer-fallback-copy">
                <span className="trailer-fallback-icon"><Icon name="play" size={24} color="#211803" /></span>
                <strong>Không thể phát trailer ngay trong trang</strong>
                <span>YouTube có thể chặn nhúng video này{errorCode ? ` (mã ${errorCode})` : ""}. Bạn vẫn có thể xem bằng liên kết chính thức.</span>
                <a className="btn btn-gold" href={watchUrl} target="_blank" rel="noreferrer">
                  Mở trên YouTube
                </a>
              </div>
            </div>
          )}
        </div>
        <div className="trailer-player-foot">
          <span>Video tự phát ở chế độ tắt tiếng. Dùng thanh điều khiển để bật âm thanh hoặc toàn màn hình.</span>
          <a href={watchUrl} target="_blank" rel="noreferrer">Xem trên YouTube ↗</a>
        </div>
      </div>
    </Modal>
  );
}

/* ---------------- Now-showing sidebar ---------------- */
function NowShowingSidebar({ current, onOpen }) {
  const list = CINE.movies.filter((m) => m.status === "now" && m.id !== current.id).slice(0, 6);
  return (
    <aside className="detail-sidebar">
      <div className="sidebar-head"><span className="bar" /> Phim đang chiếu</div>
      <div className="sidebar-list">
        {list.map((m) => (
          <div key={m.id} className="sidebar-card" onClick={() => onOpen && onOpen(m)}>
            <div className="sidebar-poster">
              <Poster movie={m} titleSize={11} />
              {m.score > 0 && (
                <span className="sidebar-score">
                  <Icon name="star" size={10} color="var(--gold)" fill="var(--gold)" stroke={0} /> {m.score.toFixed(1)}
                </span>
              )}
            </div>
            <div className="sidebar-meta">
              <div className="sidebar-title">{m.title}</div>
              <div className="sidebar-genre">{m.genres.slice(0, 2).join(" · ")}</div>
            </div>
          </div>
        ))}
      </div>
    </aside>
  );
}

/* ---------------- Movie Detail ---------------- */
function DetailScreen({ movie, reviews, canReview, onAddReview, onPickShowtime, onBack, onOpen, push }) {
  const [from, to] = movie.theme;
  const showRef = useRef(null);
  const [trailerOpen, setTrailerOpen] = useState(false);
  useEffect(() => {
    window.scrollTo(0, 0);
    setTrailerOpen(false);
  }, [movie.id]);

  const scrollToShowtimes = () => {
    if (showRef.current) window.scrollTo({ top: showRef.current.getBoundingClientRect().top + window.scrollY - 80, behavior: "smooth" });
  };
  const openTrailer = () => setTrailerOpen(true);

  return (
    <div className="fade-up">
      <div className="detail-hero">
        {movie.poster ? (
          <>
            <img className="dh-poster" src={movie.poster} alt="" style={{
              position: "absolute", inset: 0, width: "100%", height: "100%",
              objectFit: "cover", objectPosition: "center 15%",
              filter: "blur(32px) brightness(0.45) saturate(1.3)",
              transform: "scale(1.12)", zIndex: 0,
            }} />
            <div className="dh-poster" style={{
              position: "absolute", inset: 0, zIndex: 1,
              background: "linear-gradient(0deg, var(--bg) 0%, rgba(14,16,21,0.72) 100%)",
            }} />
          </>
        ) : (
          <div className="detail-hero-bg" style={{ background: `linear-gradient(120deg, ${from}, ${to})` }} />
        )}
        <div className="wrap">
          <button className="chip" onClick={onBack} style={{ marginBottom: 18 }}>
            <Icon name="chevronL" size={15} /> Quay lại
          </button>

          <div className="detail-body cf-rev">
            {/* Cột poster */}
            <div className="detail-poster-col">
              <div className="detail-poster-frame">
                <Poster movie={movie} titleSize={24} />
              </div>
              <button className="btn btn-gold btn-lg" style={{ width: "100%", marginTop: 16 }} onClick={scrollToShowtimes}>
                <Icon name="ticket" size={18} color="#211803" /> Đặt vé
              </button>
              {movie.trailer && (
                <button className="btn btn-ghost btn-lg" style={{ width: "100%", marginTop: 10 }} onClick={openTrailer}>
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor" style={{ flexShrink: 0 }}><path d="M8 5v14l11-7z" /></svg>
                  Xem Trailer
                </button>
              )}
            </div>

            {/* Cột thông tin */}
            <div className="detail-info">
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12, flexWrap: "wrap" }}>
                <AgeBadge age={movie.age} />
                {movie.formats.map((f) => <span key={f} className="badge badge-format">{f}</span>)}
              </div>
              <h1 style={{ fontSize: 44, textTransform: "uppercase", lineHeight: 0.95 }}>{movie.title}</h1>
              <p className="muted" style={{ fontSize: 14, marginTop: 4 }}>{movie.titleEn}</p>

              {movie.score > 0 && (
                <div className="detail-rating">
                  <Icon name="star" size={22} color="var(--gold)" fill="var(--gold)" stroke={0} />
                  <span className="score">{movie.score.toFixed(1)}</span>
                  <span className="denom">/ 10</span>
                  {movie.votes > 0 && <span className="votes">({movie.votes.toLocaleString("vi-VN")} đánh giá)</span>}
                </div>
              )}

              <div className="meta-row">
                <div><div className="k">Thời lượng</div><div className="v">{movie.duration} phút</div></div>
                <div><div className="k">Quốc gia</div><div className="v">{movie.country}</div></div>
                <div><div className="k">Khởi chiếu</div><div className="v">{movie.release.split("-").reverse().join("/")}</div></div>
              </div>

              <div style={{ marginBottom: 18 }}>
                <div className="detail-label">Thể loại</div>
                <div className="genre-pills">
                  {movie.genres.map((g) => <span key={g} className="genre-pill">{g}</span>)}
                </div>
              </div>

              <div style={{ marginBottom: 18 }}>
                <div className="detail-label">Đạo diễn</div>
                <div className="v" style={{ fontWeight: 600 }}>{movie.director}</div>
                <div className="detail-label" style={{ marginTop: 14 }}>Diễn viên</div>
                <div className="v" style={{ fontWeight: 600 }}>{movie.cast.join(", ")}</div>
              </div>

              <div style={{ marginBottom: 20 }}>
                <div className="detail-label">Nội dung phim</div>
                <p style={{ fontSize: 15.5, lineHeight: 1.7 }}>{movie.synopsis}</p>
              </div>

              {/* CTA ngay trong vùng nội dung */}
              <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                <button className="btn btn-gold btn-lg" onClick={scrollToShowtimes}>
                  <Icon name="ticket" size={18} color="#211803" /> Đặt vé ngay
                </button>
                {movie.trailer && (
                  <button className="btn btn-ghost btn-lg" onClick={openTrailer}>
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor" style={{ flexShrink: 0 }}><path d="M8 5v14l11-7z" /></svg>
                    Xem trailer
                  </button>
                )}
              </div>
            </div>

            {/* Sidebar gợi ý phim */}
            <NowShowingSidebar current={movie} onOpen={onOpen} />
          </div>
        </div>
      </div>

      {/* showtimes */}
      <div className="wrap section" ref={showRef}>
        <div className="section-head">
          <h2 className="section-title" style={{ fontSize: 24 }}><span className="bar" />Lịch chiếu</h2>
        </div>
        <ShowtimePicker movie={movie} onPick={onPickShowtime} />

        <ReviewsBlock movie={movie} reviews={reviews} canReview={canReview} onAddReview={onAddReview} push={push} />
      </div>

      {movie.trailer && trailerOpen && <TrailerModal movie={movie} onClose={() => setTrailerOpen(false)} />}
    </div>
  );
}

Object.assign(window, { HomeScreen, DetailScreen, MovieCard });
