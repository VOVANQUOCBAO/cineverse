/* ============================================================
   CINEVERSE — Staff Panel: Layout · Ticket Scanner · Schedule
   ============================================================ */
const { useState: uSS, useEffect: uES, useRef: uRS } = React;
const CS = window.CINE;
const FS = CS.formatVND;

/* ─── Staff Layout ───────────────────────────────────────────── */
const STAFF_NAV = [
  { k:"scanner",  label:"Soát vé QR",     icon:"qr" },
  { k:"schedule", label:"Lịch chiếu hôm nay", icon:"calendar" },
  { k:"today",    label:"Vé hôm nay",     icon:"ticket" },
];

function StaffLayout({ page, setPage, children }) {
  const user = AUTH.user;
  const cinema = user?.cinemaId ? CS.cinemaById(user.cinemaId) : null;
  return (
    <div style={{ display:"flex", minHeight:"100vh", background:"var(--bg-2)" }}>
      <aside style={{ width:220, background:"var(--bg)", borderRight:"1px solid var(--line)", display:"flex", flexDirection:"column", position:"sticky", top:0, height:"100vh" }}>
        <div style={{ padding:"20px 16px 16px", borderBottom:"1px solid var(--line)" }}>
          <div style={{ display:"flex", alignItems:"center", gap:9, marginBottom:10 }}>
            <div style={{ width:30, height:30, borderRadius:8, background:"linear-gradient(150deg,var(--gold),var(--coral))", display:"grid", placeItems:"center" }}>
              <Icon name="film" size={16} color="#1a1404" stroke={2} />
            </div>
            <span style={{ fontFamily:"var(--ff-head)", fontSize:15, fontWeight:700, letterSpacing:"0.06em", textTransform:"uppercase" }}>
              CINE<span style={{ color:"var(--gold)" }}>VERSE</span>
            </span>
          </div>
          {cinema && (
            <div style={{ fontSize:12, color:"var(--muted-2)", display:"flex", alignItems:"center", gap:6 }}>
              <Icon name="location" size={13} color="var(--muted-2)" />
              {cinema.name.split(" ").slice(-2).join(" ")}
            </div>
          )}
        </div>
        <nav style={{ flex:1, padding:"10px 8px", display:"flex", flexDirection:"column", gap:2 }}>
          {STAFF_NAV.map(n=>(
            <button key={n.k} onClick={()=>setPage(n.k)}
              style={{ display:"flex", alignItems:"center", gap:10, padding:"10px 12px", borderRadius:10, border:"none",
                background:page===n.k?"var(--gold-soft)":"transparent",
                color:page===n.k?"var(--gold)":"var(--muted)",
                fontFamily:"inherit", fontSize:13.5, fontWeight:page===n.k?600:400,
                cursor:"pointer", textAlign:"left", transition:"all 0.14s" }}>
              <Icon name={n.icon} size={17} color={page===n.k?"var(--gold)":"var(--muted-2)"} />
              {n.label}
            </button>
          ))}
        </nav>
        <div style={{ padding:"14px 14px", borderTop:"1px solid var(--line)" }}>
          <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:10 }}>
            <div style={{ width:34, height:34, borderRadius:"50%", background:user?.avatar||"#888", display:"grid", placeItems:"center", fontWeight:700, color:"#fff", fontSize:13, flex:"none" }}>
              {user?.name?.[0]}
            </div>
            <div>
              <div style={{ fontSize:13, fontWeight:600 }}>{user?.name}</div>
              <div style={{ fontSize:11, color:"var(--muted-2)" }}>{user?.position||"Nhân viên"}</div>
            </div>
          </div>
          <button className="btn btn-ghost btn-sm" style={{ width:"100%", justifyContent:"center" }} onClick={()=>AUTH.logout()}>
            <Icon name="close" size={13} /> Đăng xuất
          </button>
        </div>
      </aside>
      <main style={{ flex:1, overflowY:"auto", padding:"28px 32px" }}>
        {children}
      </main>
    </div>
  );
}

/* ─── Ticket Scanner (real camera + jsQR) ──────────────────── */
function TicketScanner() {
  const [code, setCode] = uSS("");
  const [result, setResult] = uSS(null);
  const [booking, setBooking] = uSS(null);
  const [cameraOn, setCameraOn] = uSS(false);
  const [cameraErr, setCameraErr] = uSS("");
  const videoRef = uRS(null);
  const canvasRef = uRS(null);
  const rafRef = uRS(null);
  const streamRef = uRS(null);
  const inputRef = uRS(null);

  uES(() => { inputRef.current?.focus(); }, []);
  uES(() => () => stopCamera(), []);

  const stopCamera = () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
    setCameraOn(false);
  };

  const startCamera = async () => {
    setCameraErr("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment", width:{ ideal:640 }, height:{ ideal:480 } } });
      streamRef.current = stream;
      if (videoRef.current) { videoRef.current.srcObject = stream; await videoRef.current.play(); }
      setCameraOn(true);
      scanLoop();
    } catch(e) {
      setCameraErr("Không thể truy cập camera: " + e.message + ". Vui lòng nhập mã thủ công.");
    }
  };

  const scanLoop = () => {
    const video = videoRef.current, canvas = canvasRef.current;
    if (!video || !canvas || video.readyState < 2) { rafRef.current = requestAnimationFrame(scanLoop); return; }
    canvas.width = video.videoWidth; canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(video, 0, 0);
    if (window.jsQR) {
      const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const qr = window.jsQR(img.data, img.width, img.height, { inversionAttempts:"dontInvert" });
      if (qr?.data) { handleScan(qr.data); stopCamera(); return; }
    }
    rafRef.current = requestAnimationFrame(scanLoop);
  };

  const handleScan = async (raw) => {
    // hỗ trợ cả mã thô lẫn dạng "CINEVERSE|CODE|..."
    let code = raw.trim().toUpperCase();
    if (code.startsWith("CINEVERSE|")) code = code.split("|")[1];
    setCode(code);
    try {
      const b = await window.API.booking(code);          // GET /bookings/:code (DB thật)
      const shaped = {
        code: b.code,
        status: b.status,
        movieId: b.movie && b.movie.id,
        movieTitle: b.movie && b.movie.title,
        cinemaName: b.cinema,
        date: b.showtime && b.showtime.date,
        time: b.showtime && b.showtime.time,
        seatCount: (b.seats || []).length,
        isUsed: b.isUsed,
      };
      setBooking(shaped);
      if (b.isUsed) setResult("used");
      else if (b.status !== "confirmed") setResult("notfound");
      else setResult("found");
    } catch (e) {
      setBooking(null);
      setResult("notfound");
    }
  };

  const admit = async () => {
    if (!booking) return;
    try {
      await window.API.checkin(booking.code);            // POST /bookings/:code/checkin
      setResult("admitted");
    } catch (e) {
      if (e.code === "ALREADY_USED") setResult("used");
      else alert("Soát vé thất bại: " + (e.message || e));
    }
  };

  const reset = () => { setCode(""); setResult(null); setBooking(null); inputRef.current?.focus(); };

  const movie = booking ? (CS.movieById(booking.movieId) || { title: booking.movieTitle }) : null;
  const cinema = booking ? { name: booking.cinemaName } : null;
  const bDate = booking?.date || "";
  const bTime = booking?.time || "";
  const bCount = booking?.seatCount || 0;

  return (
    <div className="fade-up">
      <div style={{ marginBottom:28 }}>
        <h1 style={{ fontSize:30, textTransform:"uppercase", marginBottom:4 }}>Soát vé QR</h1>
        <p className="muted" style={{ fontSize:14, margin:0 }}>Quét QR từ camera hoặc nhập mã vé thủ công</p>
      </div>

      {/* Camera viewport */}
      <div className="card" style={{ padding:0, overflow:"hidden", maxWidth:480, marginBottom:20, position:"relative" }}>
        <video ref={videoRef} playsInline muted style={{ width:"100%", display:cameraOn?"block":"none", maxHeight:320, objectFit:"cover" }} />
        <canvas ref={canvasRef} style={{ display:"none" }} />
        {cameraOn && (
          <div style={{ position:"absolute", inset:0, display:"grid", placeItems:"center", pointerEvents:"none" }}>
            <div style={{ width:220, height:220, position:"relative" }}>
              {["tl","tr","bl","br"].map(pos=>(
                <div key={pos} style={{ position:"absolute", width:28, height:28, borderColor:"var(--gold)", borderStyle:"solid", borderWidth:0,
                  ...(pos==="tl"?{top:-2,left:-2,borderTopWidth:4,borderLeftWidth:4,borderRadius:"8px 0 0 0"}:
                     pos==="tr"?{top:-2,right:-2,borderTopWidth:4,borderRightWidth:4,borderRadius:"0 8px 0 0"}:
                     pos==="bl"?{bottom:-2,left:-2,borderBottomWidth:4,borderLeftWidth:4,borderRadius:"0 0 0 8px"}:
                     {bottom:-2,right:-2,borderBottomWidth:4,borderRightWidth:4,borderRadius:"0 0 8px 0"})}} />
              ))}
              <div style={{ position:"absolute", left:4, right:4, height:2, background:"var(--gold)", opacity:0.8, animation:"scanLine 2s linear infinite" }} />
            </div>
          </div>
        )}
        {!cameraOn && (
          <div style={{ padding:32, display:"flex", flexDirection:"column", alignItems:"center", gap:16, background:"var(--surface)" }}>
            <Icon name="qr" size={44} color="var(--muted-2)" />
            <button className="btn btn-gold btn-lg" onClick={startCamera}>
              <Icon name="sparkle" size={18} color="#211803" /> Bật camera quét QR
            </button>
            {cameraErr && <p style={{ color:"var(--coral)", fontSize:13, textAlign:"center", margin:0 }}>{cameraErr}</p>}
          </div>
        )}
        {cameraOn && (
          <button className="btn btn-ghost btn-sm" onClick={stopCamera} style={{ position:"absolute", top:10, right:10 }}>
            <Icon name="close" size={14} /> Tắt
          </button>
        )}
      </div>

      {/* Manual input */}
      <div className="card" style={{ padding:24, maxWidth:480, marginBottom:20 }}>
        <p style={{ fontSize:13, color:"var(--muted-2)", margin:"0 0 12px" }}>Hoặc nhập mã vé thủ công</p>
        <div style={{ display:"flex", gap:10 }}>
          <div style={{ flex:1, display:"flex", alignItems:"center", gap:10, background:"var(--bg)", border:"2px solid var(--line-2)", borderRadius:12, padding:"11px 14px" }}>
            <Icon name="ticket" size={20} color="var(--gold)" />
            <input ref={inputRef} value={code} onChange={e=>setCode(e.target.value.toUpperCase())}
              onKeyDown={e=>e.key==="Enter"&&handleScan(code)}
              placeholder="VD: AB1234" maxLength={8}
              style={{ flex:1, background:"none", border:"none", color:"var(--text)", fontFamily:"var(--ff-head)", fontSize:22, letterSpacing:"0.15em", outline:"none" }} />
          </div>
          <button className="btn btn-gold btn-lg" onClick={()=>handleScan(code)}>
            <Icon name="search" size={18} color="#211803" />
          </button>
        </div>
      </div>

      {/* Result */}
      {result && (
        <div className="card" style={{ padding:26, maxWidth:480,
          borderColor:result==="found"||result==="admitted"?"var(--mint)":result==="used"||result==="notfound"?"var(--coral)":undefined }}>
          {result==="found" && movie && (
            <div>
              <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:16, color:"var(--mint)" }}>
                <Icon name="checkCircle" size={28} color="var(--mint)" />
                <span style={{ fontWeight:700, fontSize:18 }}>Vé hợp lệ!</span>
              </div>
              {[["Phim",movie?.title||"—"],["Rạp",cinema?.name||"—"],["Ngày · Giờ",bDate.split("-").reverse().join("/")+" · "+bTime],["Số ghế",bCount+" ghế"],["Mã vé",booking.code]].map(([k,v])=>(
                <div key={k} style={{ display:"flex", justifyContent:"space-between", borderBottom:"1px solid var(--line)", padding:"8px 0", fontSize:14 }}>
                  <span className="muted">{k}</span><b>{v}</b>
                </div>
              ))}
              <div style={{ display:"flex", gap:10, marginTop:18 }}>
                <button className="btn btn-ghost" onClick={reset}>Huỷ</button>
                <button className="btn btn-gold btn-lg" style={{ flex:1 }} onClick={admit}>
                  <Icon name="checkCircle" size={18} color="#211803" /> Cho vào
                </button>
              </div>
            </div>
          )}
          {result==="admitted" && (
            <div style={{ textAlign:"center", padding:"10px 0" }}>
              <Icon name="checkCircle" size={52} color="var(--mint)" />
              <h3 style={{ fontSize:24, textTransform:"uppercase", marginTop:12 }}>Đã vào cổng!</h3>
              <p className="muted">Vé <b style={{ color:"var(--gold)" }}>{booking?.code}</b> đã xác nhận.</p>
              <button className="btn btn-gold btn-lg" onClick={reset} style={{ marginTop:14 }}>Soát vé tiếp</button>
            </div>
          )}
          {result==="used" && (
            <div style={{ textAlign:"center" }}>
              <Icon name="info" size={40} color="var(--coral)" />
              <h3 style={{ fontSize:20, textTransform:"uppercase", marginTop:10, color:"var(--coral)" }}>Vé đã sử dụng!</h3>
              <p className="muted">Mã <b style={{ color:"var(--text)" }}>{code}</b> đã được soát trước đó.</p>
              <button className="btn btn-ghost" onClick={reset} style={{ marginTop:12 }}>Thử lại</button>
            </div>
          )}
          {result==="notfound" && (
            <div style={{ textAlign:"center" }}>
              <Icon name="info" size={40} color="var(--coral)" />
              <h3 style={{ fontSize:20, textTransform:"uppercase", marginTop:10, color:"var(--coral)" }}>Không tìm thấy vé!</h3>
              <p className="muted">Mã <b style={{ color:"var(--text)" }}>{code}</b> không tồn tại hoặc đã bị huỷ.</p>
              <button className="btn btn-ghost" onClick={reset} style={{ marginTop:12 }}>Thử lại</button>
            </div>
          )}
        </div>
      )}
      <style>{`@keyframes scanLine{0%{top:8%}50%{top:88%}100%{top:8%}}`}</style>
    </div>
  );
}

/* ─── Today's Schedule ───────────────────────────────────────── */
function TodaySchedule() {
  const user = AUTH.user;
  const todayKey = CS.dates[0]?.key||"";
  const cinemaId = user?.cinemaId;
  const sts = CS.showtimes.filter(s => s.date===todayKey && (!cinemaId||s.cinemaId===cinemaId))
    .sort((a,b)=>a.time.localeCompare(b.time));
  const now = new Date();
  const nowMin = now.getHours()*60+now.getMinutes();

  return (
    <div className="fade-up">
      <h1 style={{ fontSize:30, textTransform:"uppercase", marginBottom:4 }}>Lịch chiếu hôm nay</h1>
      <p className="muted" style={{ marginTop:0, marginBottom:24, fontSize:14 }}>
        {CS.dates[0]?.wd}, {CS.dates[0]?.dd}/{CS.dates[0]?.mm} · {sts.length} suất chiếu
      </p>
      {sts.length===0 && <div className="empty">Không có suất chiếu hôm nay.</div>}
      <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
        {sts.map(s=>{
          const m=CS.movieById(s.movieId); if(!m) return null;
          const rm=CS.roomById(s.roomId);
          const [h,min]=s.time.split(":").map(Number);
          const startMin=h*60+min;
          const endMin=startMin+(m.duration||120);
          const ongoing=nowMin>=startMin&&nowMin<endMin;
          const past=nowMin>=endMin;
          return (
            <div key={s.id} className="card" style={{ padding:20, display:"flex", gap:16, alignItems:"center", borderColor:ongoing?"var(--gold)":past?"transparent":undefined, opacity:past?0.55:1 }}>
              <div style={{ width:56, flex:"none", textAlign:"center" }}>
                <div style={{ fontFamily:"var(--ff-head)", fontSize:22, fontWeight:700, color:ongoing?"var(--gold)":"var(--text)" }}>{s.time}</div>
                {ongoing && <div style={{ fontSize:11, color:"var(--gold)", fontWeight:700 }}>● ĐANG CHIẾU</div>}
                {past && <div style={{ fontSize:11, color:"var(--muted-2)" }}>Đã chiếu</div>}
              </div>
              <div style={{ width:52, flex:"none" }}><Poster movie={m} titleSize={11} /></div>
              <div style={{ flex:1 }}>
                <div style={{ fontFamily:"var(--ff-head)", fontSize:17, textTransform:"uppercase" }}>{m.title}</div>
                <div className="muted" style={{ fontSize:13, marginTop:3 }}>{rm?.name||"—"} · {s.format} · {m.duration}'</div>
              </div>
              <div style={{ textAlign:"right" }}>
                <div style={{ fontSize:13, color:"var(--muted-2)" }}>Kết thúc</div>
                <div style={{ fontFamily:"var(--ff-head)", fontSize:16 }}>
                  {String(Math.floor(endMin/60)).padStart(2,"0")}:{String(endMin%60).padStart(2,"0")}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ─── Today's Tickets ───────────────────────────────────────── */
function TodayTickets() {
  const todayKey = CS.dates[0]?.key||"";
  const todayB = CS.allBookings.filter(b=>b.date===todayKey);
  const confirmed = todayB.filter(b=>b.status==="confirmed");
  const totalRev = confirmed.reduce((s,b)=>s+b.total,0);
  return (
    <div className="fade-up">
      <h1 style={{ fontSize:30, textTransform:"uppercase", marginBottom:4 }}>Vé hôm nay</h1>
      <p className="muted" style={{ marginTop:0, marginBottom:24, fontSize:14 }}>{confirmed.length} vé xác nhận · Doanh thu: {FS(totalRev)}</p>
      <div className="card">
        {confirmed.length===0 ? <div className="empty" style={{ padding:40 }}>Chưa có vé nào hôm nay.</div> : (
          <table style={{ width:"100%", borderCollapse:"collapse", fontSize:13.5 }}>
            <thead>
              <tr style={{ borderBottom:"2px solid var(--line-2)" }}>
                {["Mã vé","Phim","Giờ chiếu","Ghế","Tổng tiền"].map(h=>(
                  <th key={h} style={{ padding:"10px 14px", color:"var(--muted-2)", fontSize:12, textTransform:"uppercase", letterSpacing:"0.05em", textAlign:"left" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {confirmed.map(b=>{
                const m=CS.movieById(b.movieId);
                return (
                  <tr key={b.id} style={{ borderBottom:"1px solid var(--line)" }}>
                    <td style={{ padding:"12px 14px", fontFamily:"var(--ff-head)", fontWeight:700, letterSpacing:"0.1em", color:"var(--gold)" }}>{b.code}</td>
                    <td style={{ padding:"12px 14px" }}>{m?.title.slice(0,20)||"—"}</td>
                    <td style={{ padding:"12px 14px" }}>{b.time}</td>
                    <td style={{ padding:"12px 14px" }}>{b.seatCount} ghế</td>
                    <td style={{ padding:"12px 14px", fontWeight:600 }}>{FS(b.total)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

Object.assign(window, { StaffLayout, TicketScanner, TodaySchedule, TodayTickets });
