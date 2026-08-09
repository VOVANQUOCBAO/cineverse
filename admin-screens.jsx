/* ============================================================
   CINEVERSE — Admin Screens: Layout · Dashboard · Movies · Showtimes · Rooms
   ============================================================ */
const { useState, useEffect, useMemo, useRef } = React;
const C = window.CINE;
const F = C.formatVND;
const FC = C.formatCompact;

/* ─── Admin sidebar layout ──────────────────────────────────── */
const ADMIN_NAV = [
  { k:"dashboard", label:"Dashboard",     icon:"sparkle" },
  { k:"movies",    label:"Quản lý phim",  icon:"film" },
  { k:"showtimes", label:"Lịch chiếu",    icon:"calendar" },
  { k:"rooms",     label:"Phòng chiếu",   icon:"seat" },
  { k:"bookings",  label:"Đặt vé",        icon:"ticket" },
  { k:"customers", label:"Khách hàng",    icon:"user" },
  { k:"staff",     label:"Nhân viên",     icon:"shield" },
  { k:"reports",   label:"Báo cáo",       icon:"star" },
];

function AdminLayout({ page, setPage, children }) {
  const user = AUTH.user;
  return (
    <div style={{ display:"flex", minHeight:"100vh", background:"var(--bg-2)" }}>
      {/* Sidebar */}
      <aside style={{ width:240, background:"var(--bg)", borderRight:"1px solid var(--line)", display:"flex", flexDirection:"column", position:"sticky", top:0, height:"100vh", flexShrink:0 }}>
        <div style={{ padding:"22px 20px 18px", borderBottom:"1px solid var(--line)" }}>
          <div style={{ display:"flex", alignItems:"center", gap:9 }}>
            <div style={{ width:32, height:32, borderRadius:9, background:"linear-gradient(150deg,var(--gold),var(--coral))", display:"grid", placeItems:"center" }}>
              <Icon name="film" size={18} color="#1a1404" stroke={2} />
            </div>
            <span style={{ fontFamily:"var(--ff-head)", fontSize:17, fontWeight:700, letterSpacing:"0.06em", textTransform:"uppercase" }}>
              CINE<span style={{ color:"var(--gold)" }}>VERSE</span>
            </span>
          </div>
          <div style={{ fontSize:11, color:"var(--muted-2)", marginTop:6, paddingLeft:2 }}>Admin Panel</div>
        </div>

        <nav style={{ flex:1, padding:"12px 10px", display:"flex", flexDirection:"column", gap:2, overflowY:"auto" }}>
          {ADMIN_NAV.map(n => (
            <button key={n.k} onClick={() => setPage(n.k)}
              style={{ display:"flex", alignItems:"center", gap:11, padding:"10px 12px", borderRadius:10, border:"none",
                background: page===n.k ? "var(--gold-soft)" : "transparent",
                color: page===n.k ? "var(--gold)" : "var(--muted)",
                fontFamily:"inherit", fontSize:14, fontWeight: page===n.k ? 600 : 400,
                cursor:"pointer", textAlign:"left", transition:"all 0.14s" }}>
              <Icon name={n.icon} size={17} color={page===n.k ? "var(--gold)" : "var(--muted-2)"} />
              {n.label}
            </button>
          ))}
        </nav>

        <div style={{ padding:"14px 16px", borderTop:"1px solid var(--line)" }}>
          <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:10 }}>
            <div style={{ width:34, height:34, borderRadius:"50%", background:user?.avatar||"#888", display:"grid", placeItems:"center", fontWeight:700, fontSize:13, color:"#fff", flex:"none" }}>
              {user?.name?.[0]}
            </div>
            <div>
              <div style={{ fontSize:13.5, fontWeight:600 }}>{user?.name}</div>
              <div style={{ fontSize:11.5, color:"var(--muted-2)" }}>Quản trị viên</div>
            </div>
          </div>
          <button className="btn btn-ghost btn-sm" style={{ width:"100%", justifyContent:"center" }} onClick={() => AUTH.logout()}>
            <Icon name="close" size={14} /> Đăng xuất
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main style={{ flex:1, overflowY:"auto", padding:"28px 32px" }}>
        {children}
      </main>
    </div>
  );
}

/* ─── Page header ───────────────────────────────────────────── */
function PageHeader({ title, sub, action }) {
  return (
    <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", marginBottom:28, gap:16 }}>
      <div>
        <h1 style={{ fontSize:30, textTransform:"uppercase", marginBottom:4 }}>{title}</h1>
        {sub && <p className="muted" style={{ margin:0, fontSize:14 }}>{sub}</p>}
      </div>
      {action}
    </div>
  );
}

/* ─── Reusable table ────────────────────────────────────────── */
function Table({ cols, rows, emptyMsg="Không có dữ liệu" }) {
  return (
    <div style={{ overflowX:"auto" }}>
      <table style={{ width:"100%", borderCollapse:"collapse", fontSize:13.5 }}>
        <thead>
          <tr style={{ borderBottom:"2px solid var(--line-2)" }}>
            {cols.map(c => (
              <th key={c.key} style={{ textAlign:c.right?"right":"left", padding:"10px 14px", color:"var(--muted-2)", fontWeight:600, fontSize:12, textTransform:"uppercase", letterSpacing:"0.05em", whiteSpace:"nowrap" }}>
                {c.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length===0 && (
            <tr><td colSpan={cols.length} style={{ textAlign:"center", padding:40, color:"var(--muted-2)" }}>{emptyMsg}</td></tr>
          )}
          {rows.map((row, i) => (
            <tr key={i} style={{ borderBottom:"1px solid var(--line)" }}
              onMouseEnter={e=>e.currentTarget.style.background="var(--surface)"}
              onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
              {cols.map(c => (
                <td key={c.key} style={{ padding:"12px 14px", textAlign:c.right?"right":"left", whiteSpace:c.wrap?"normal":"nowrap" }}>
                  {typeof c.render==="function" ? c.render(row, i) : row[c.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ─── Status badge ──────────────────────────────────────────── */
function StatusBadge({ status }) {
  const map = { active:["var(--mint)","Hoạt động"], inactive:["var(--coral)","Ngừng"], confirmed:["var(--mint)","Đã xác nhận"], cancelled:["var(--coral)","Huỷ"], refunded:["var(--gold)","Hoàn tiền"], now:["var(--mint)","Đang chiếu"], coming:["var(--gold)","Sắp chiếu"] };
  const [color, label] = map[status]||["var(--muted)","—"];
  return <span style={{ display:"inline-block", padding:"3px 9px", borderRadius:6, background:color+"22", color, fontWeight:600, fontSize:12 }}>{label}</span>;
}

/* ─── Dashboard ─────────────────────────────────────────────── */
function DashboardPage() {
  const totalRev = C.allBookings.filter(b=>b.status==="confirmed").reduce((s,b)=>s+b.total,0);
  const totalTickets = C.allBookings.filter(b=>b.status==="confirmed").reduce((s,b)=>s+b.seatCount,0);
  const totalCustomers = C.customers.length;
  const avgOcc = Object.values(C.occupancy).reduce((s,o)=>s+o.rate,0)/Object.keys(C.occupancy).length;

  const lineData = C.revenueDaily.map(d=>({ label:d.label, value:d.revenue }));
  const barData = C.topMovies.map(m=>({ label:m.title.split(":")[0].split(" ").slice(-1)[0], value:m.tickets }));
  const donutSegs = Object.values(C.occupancy).map((o,i)=>({
    label:o.name, value:o.rate, color:["var(--gold)","var(--mint)","var(--coral)","var(--violet)"][i]
  }));

  const kpis = [
    { label:"Tổng doanh thu", value:FC(totalRev)+"đ", icon:"sparkle", color:"var(--gold)", trend:12.4, sub:"so với tháng trước", spark:C.revenueDaily.slice(-10).map(d=>d.revenue) },
    { label:"Vé đã bán", value:totalTickets.toLocaleString(), icon:"ticket", color:"var(--mint)", trend:8.1, sub:"so với tháng trước", spark:C.revenueDaily.slice(-10).map(d=>d.tickets) },
    { label:"Khách hàng", value:totalCustomers, icon:"user", color:"var(--violet)", trend:5.3, sub:"so với tháng trước" },
    { label:"Công suất TB", value:Math.round(avgOcc*100)+"%", icon:"seat", color:"var(--coral)", trend:-2.1, sub:"so với tháng trước" },
  ];

  const recent = C.allBookings.slice(-8).reverse();

  return (
    <div className="fade-up">
      <PageHeader title="Dashboard" sub="Tổng quan hoạt động kinh doanh" />

      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:18, marginBottom:28 }}>
        {kpis.map((k,i) => <KPICard key={i} {...k} />)}
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"2fr 1fr", gap:18, marginBottom:28 }}>
        <div className="card" style={{ padding:24 }}>
          <div style={{ marginBottom:16 }}>
            <h3 style={{ fontSize:17, textTransform:"uppercase" }}>Doanh thu 30 ngày</h3>
            <p className="muted" style={{ margin:0, fontSize:13 }}>Tổng doanh thu theo ngày</p>
          </div>
          <LineChart data={lineData} height={200} width={700} color="var(--gold)" />
        </div>
        <div className="card" style={{ padding:24 }}>
          <div style={{ marginBottom:16 }}>
            <h3 style={{ fontSize:17, textTransform:"uppercase" }}>Công suất theo rạp</h3>
          </div>
          <DonutChart segments={donutSegs} size={130} thickness={28} />
        </div>
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:18 }}>
        <div className="card" style={{ padding:24 }}>
          <div style={{ marginBottom:16 }}>
            <h3 style={{ fontSize:17, textTransform:"uppercase" }}>Top phim (vé bán)</h3>
          </div>
          <BarChart data={barData} height={160} color="var(--coral)" />
        </div>
        <div className="card" style={{ padding:24 }}>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:16 }}>
            <h3 style={{ fontSize:17, textTransform:"uppercase" }}>Đặt vé gần đây</h3>
          </div>
          <Table
            cols={[
              { key:"code", label:"Mã vé" },
              { key:"movieId", label:"Phim", render:r=>{ const m=C.movieById(r.movieId); return m?m.title.split(":")[0].slice(0,18):"—"; } },
              { key:"total", label:"Tiền", right:true, render:r=>FC(r.total)+"đ" },
              { key:"status", label:"Trạng thái", render:r=><StatusBadge status={r.status} /> },
            ]}
            rows={recent}
          />
        </div>
      </div>
    </div>
  );
}

/* ─── Movies Management ─────────────────────────────────────── */
function MoviesPage() {
  const [movies, setMovies] = useState([...C.movies]);
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState("all");
  const [editing, setEditing] = useState(null); // null | movie object | "new"
  const [del, setDel] = useState(null);

  const filtered = movies.filter(m =>
    (tab==="all"||m.status===tab) &&
    (m.title+m.titleEn+m.genres.join()).toLowerCase().includes(search.toLowerCase())
  );

  const save = async (m) => {
    try {
      const file = m._posterFile; delete m._posterFile;
      let saved = m.id ? await window.API.updateMovie(m.id, m) : await window.API.createMovie(m);
      if (file) { await window.API.uploadPoster(saved.id, file); saved = await window.API.movie(saved.id); }
      // đồng bộ store + state để dashboard/khách thấy ngay
      const i = C.movies.findIndex(x => x.id===saved.id);
      if (i>=0) C.movies[i] = saved; else C.movies.push(saved);
      setMovies(m.id ? movies.map(x => x.id===saved.id ? saved : x) : [...movies, saved]);
      setEditing(null);
    } catch (e) { alert("Lưu phim thất bại: " + (e.message || e)); }
  };
  const remove = async (id) => {
    try {
      await window.API.deleteMovie(id);               // DELETE /movies/:id (chặn nếu còn suất chiếu)
      const i = C.movies.findIndex(x => x.id===id); if (i>=0) C.movies.splice(i,1);
      setMovies(prev => prev.filter(x => x.id!==id));
      setDel(null);
    } catch (e) { alert((e.data && e.data.message) || "Không xoá được phim: " + (e.message||e)); }
  };

  return (
    <div className="fade-up">
      <PageHeader title="Quản lý phim" sub={`${movies.length} phim trong hệ thống`}
        action={<button className="btn btn-gold" onClick={()=>setEditing({title:"",titleEn:"",genres:[],duration:120,age:"T13",score:0,votes:0,director:"",cast:[],country:"",formats:["2D"],status:"coming",release:"",synopsis:"",theme:["#14122E","#6D28D9"],accent:"#A78BFA"})}>
          <Icon name="sparkle" size={16} color="#211803" /> Thêm phim
        </button>}
      />

      <div className="card" style={{ padding:20 }}>
        <div style={{ display:"flex", gap:12, marginBottom:18, flexWrap:"wrap" }}>
          <div style={{ display:"flex", alignItems:"center", gap:10, background:"var(--bg)", border:"1px solid var(--line-2)", borderRadius:10, padding:"9px 13px", flex:1, minWidth:220 }}>
            <Icon name="search" size={16} color="var(--muted)" />
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Tìm phim..." style={{ flex:1, background:"none", border:"none", color:"var(--text)", fontFamily:"inherit", fontSize:14, outline:"none" }} />
          </div>
          <div className="tabs">
            {[["all","Tất cả"],["now","Đang chiếu"],["coming","Sắp chiếu"]].map(([k,l])=>(
              <button key={k} className={"tab "+(tab===k?"on":"")} onClick={()=>setTab(k)}>{l}</button>
            ))}
          </div>
        </div>

        <Table
          cols={[
            { key:"poster", label:"", render:r=>(
              <div style={{ width:36, height:54, borderRadius:6, overflow:"hidden", flexShrink:0, background:`linear-gradient(${r.theme[0]},${r.theme[1]})` }}>
                {r.poster && <img src={r.poster} alt="" style={{ width:"100%", height:"100%", objectFit:"cover" }} />}
              </div>
            )},
            { key:"title", label:"Tên phim", wrap:true, render:r=>(
              <div>
                <div style={{ fontWeight:600 }}>{r.title}</div>
                <div className="muted-2" style={{ fontSize:12 }}>{r.genres.join(", ")}</div>
              </div>
            )},
            { key:"director", label:"Đạo diễn" },
            { key:"duration", label:"Thời lượng", right:true, render:r=>r.duration+"'" },
            { key:"age", label:"Độ tuổi", render:r=><AgeBadge age={r.age} /> },
            { key:"status", label:"Trạng thái", render:r=><StatusBadge status={r.status} /> },
            { key:"score", label:"Điểm", right:true, render:r=>r.score>0?r.score.toFixed(1):"—" },
            { key:"actions", label:"", render:r=>(
              <div style={{ display:"flex", gap:6 }}>
                <button className="btn btn-ghost btn-sm" onClick={()=>setEditing({...r})}><Icon name="info" size={14} /></button>
                <button className="btn btn-sm" style={{ background:"var(--coral-soft)", color:"var(--coral)", border:"1px solid var(--coral)" }} onClick={()=>setDel(r)}><Icon name="close" size={14} /></button>
              </div>
            )},
          ]}
          rows={filtered}
        />
      </div>

      {/* Edit Modal */}
      {editing && <MovieModal movie={editing} onSave={save} onClose={()=>setEditing(null)} />}
      {/* Delete confirm */}
      {del && (
        <Modal onClose={()=>setDel(null)}>
          <div style={{ padding:28, textAlign:"center" }}>
            <Icon name="info" size={36} color="var(--coral)" />
            <h3 style={{ fontSize:20, textTransform:"uppercase", margin:"14px 0 8px" }}>Xoá phim?</h3>
            <p className="muted">Bạn chắc chắn muốn xoá <b style={{ color:"var(--text)" }}>{del.title}</b>?</p>
            <div style={{ display:"flex", gap:10, justifyContent:"center", marginTop:20 }}>
              <button className="btn btn-ghost" onClick={()=>setDel(null)}>Huỷ</button>
              <button className="btn btn-coral" onClick={()=>remove(del.id)}>Xoá</button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

function MovieModal({ movie, onSave, onClose }) {
  const [form, setForm] = useState({ ...movie });
  const set = (k,v) => setForm(p=>({ ...p, [k]:v }));
  return (
    <Modal onClose={onClose} width={600}>
      <div style={{ padding:26, maxHeight:"85vh", overflowY:"auto" }}>
        <h3 style={{ fontSize:22, textTransform:"uppercase", marginBottom:20 }}>{form.id?"Chỉnh sửa":"Thêm phim mới"}</h3>
        <div style={{ display:"grid", gap:14 }}>
          {[["title","Tên phim (TV)"],["titleEn","Tên phim (EN)"],["director","Đạo diễn"],["country","Quốc gia"]].map(([k,l])=>(
            <label key={k}>
              <div style={{ fontSize:12, color:"var(--muted-2)", textTransform:"uppercase", marginBottom:5 }}>{l}</div>
              <input value={form[k]||""} onChange={e=>set(k,e.target.value)}
                style={{ width:"100%", background:"var(--bg)", border:"1px solid var(--line-2)", borderRadius:9, color:"var(--text)", fontFamily:"inherit", fontSize:14, padding:"10px 12px", outline:"none" }} />
            </label>
          ))}
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:12 }}>
            <label>
              <div style={{ fontSize:12, color:"var(--muted-2)", textTransform:"uppercase", marginBottom:5 }}>Thời lượng (phút)</div>
              <input type="number" value={form.duration||""} onChange={e=>set("duration",+e.target.value)}
                style={{ width:"100%", background:"var(--bg)", border:"1px solid var(--line-2)", borderRadius:9, color:"var(--text)", fontFamily:"inherit", fontSize:14, padding:"10px 12px", outline:"none" }} />
            </label>
            <label>
              <div style={{ fontSize:12, color:"var(--muted-2)", textTransform:"uppercase", marginBottom:5 }}>Độ tuổi</div>
              <select value={form.age||"T13"} onChange={e=>set("age",e.target.value)}
                style={{ width:"100%", background:"var(--bg)", border:"1px solid var(--line-2)", borderRadius:9, color:"var(--text)", fontFamily:"inherit", fontSize:14, padding:"10px 12px", outline:"none" }}>
                {["P","T13","T16","T18"].map(a=><option key={a}>{a}</option>)}
              </select>
            </label>
            <label>
              <div style={{ fontSize:12, color:"var(--muted-2)", textTransform:"uppercase", marginBottom:5 }}>Trạng thái</div>
              <select value={form.status} onChange={e=>set("status",e.target.value)}
                style={{ width:"100%", background:"var(--bg)", border:"1px solid var(--line-2)", borderRadius:9, color:"var(--text)", fontFamily:"inherit", fontSize:14, padding:"10px 12px", outline:"none" }}>
                <option value="now">Đang chiếu</option>
                <option value="coming">Sắp chiếu</option>
              </select>
            </label>
          </div>
          <label>
            <div style={{ fontSize:12, color:"var(--muted-2)", textTransform:"uppercase", marginBottom:5 }}>Ngày khởi chiếu</div>
            <input type="date" value={form.release||""} onChange={e=>set("release",e.target.value)}
              style={{ background:"var(--bg)", border:"1px solid var(--line-2)", borderRadius:9, color:"var(--text)", fontFamily:"inherit", fontSize:14, padding:"10px 12px", outline:"none" }} />
          </label>
          <label>
            <div style={{ fontSize:12, color:"var(--muted-2)", textTransform:"uppercase", marginBottom:5 }}>Mô tả</div>
            <textarea value={form.synopsis||""} onChange={e=>set("synopsis",e.target.value)} rows={3}
              style={{ width:"100%", background:"var(--bg)", border:"1px solid var(--line-2)", borderRadius:9, color:"var(--text)", fontFamily:"inherit", fontSize:14, padding:"10px 12px", outline:"none", resize:"vertical" }} />
          </label>
          <label>
            <div style={{ fontSize:12, color:"var(--muted-2)", textTransform:"uppercase", marginBottom:5 }}>Poster {form.id?"(chọn file để thay)":"(tuỳ chọn)"}</div>
            <input type="file" accept="image/png,image/jpeg,image/webp" onChange={e=>set("_posterFile", e.target.files[0]||null)}
              style={{ width:"100%", background:"var(--bg)", border:"1px solid var(--line-2)", borderRadius:9, color:"var(--text)", fontFamily:"inherit", fontSize:13, padding:"9px 12px", outline:"none" }} />
            {form._posterFile && <div className="muted-2" style={{ fontSize:12, marginTop:4 }}>Đã chọn: {form._posterFile.name}</div>}
          </label>
        </div>
        <div style={{ display:"flex", gap:10, justifyContent:"flex-end", marginTop:22 }}>
          <button className="btn btn-ghost" onClick={onClose}>Huỷ</button>
          <button className="btn btn-gold" onClick={()=>onSave(form)}><Icon name="check" size={16} color="#211803" /> Lưu</button>
        </div>
      </div>
    </Modal>
  );
}

/* ─── Showtimes ─────────────────────────────────────────────── */
function ShowtimesAdminPage() {
  const [dateIdx, setDateIdx] = useState(0);
  const [cinemaFilter, setCinemaFilter] = useState("all");
  const [editing, setEditing] = useState(null); // null | showtime | object mới
  const [del, setDel] = useState(null);
  const [busy, setBusy] = useState(false);
  const [, setTick] = useState(0);

  const date = C.dates[dateIdx] || C.dates[0];
  const sts = C.showtimes.filter(s =>
    date && s.date===date.key && (cinemaFilter==="all"||s.cinemaId===cinemaFilter)
  );
  const byCinema = {};
  sts.forEach(s=>(byCinema[s.cinemaId]=byCinema[s.cinemaId]||[]).push(s));

  // Tải lại lịch chiếu THẬT từ API sau mỗi thao tác ghi
  const refresh = async () => {
    const r = await window.API.showtimes();
    C.showtimes = r.data;
    C.dates = C.buildDatesFromShowtimes(r.data);
    setTick(t=>t+1);
  };
  const saveShowtime = async (f) => {
    setBusy(true);
    try {
      if (f.id) await window.API.updateShowtime(f.id, f);
      else await window.API.createShowtime(f);
      await refresh();
      setEditing(null);
    } catch (e) {
      const c = e.data && e.data.conflict;
      alert(c ? `Trùng lịch với suất ${c.time} – ${c.title} trong phòng này (đã tính giờ nghỉ giữa suất).`
              : (e.data && e.data.message) || "Lưu suất chiếu thất bại: " + (e.message||e));
    } finally { setBusy(false); }
  };
  const removeShowtime = async (id) => {
    setBusy(true);
    try { await window.API.deleteShowtime(id); await refresh(); setDel(null); }
    catch (e) { alert((e.data && e.data.message) || "Không xoá được suất: " + (e.message||e)); }
    finally { setBusy(false); }
  };

  return (
    <div className="fade-up">
      <PageHeader title="Lịch chiếu" sub={`${sts.length} suất chiếu trong ngày`}
        action={<button className="btn btn-gold" onClick={()=>setEditing({ movieId:(C.movies[0]||{}).id, roomId:(C.rooms[0]||{}).id, date:date?date.key:"", time:"", format:"2D" })}>
          <Icon name="sparkle" size={16} color="#211803" /> Thêm suất chiếu
        </button>}
      />

      <div style={{ display:"flex", gap:12, marginBottom:24, flexWrap:"wrap", alignItems:"center" }}>
        <div className="date-strip">
          {C.dates.map((d,i)=>(
            <div key={d.key} className={"date-pill "+(dateIdx===i?"on":"")} onClick={()=>setDateIdx(i)}>
              <div className="wd">{d.wd}</div><div className="dd">{d.dd}</div><div className="wd">/{d.mm}</div>
            </div>
          ))}
        </div>
        <div style={{ display:"flex", gap:8 }}>
          {[["all","Tất cả rạp"],...C.cinemas.map(c=>[c.id,c.name.split(" ").slice(-2).join(" ")])].map(([k,l])=>(
            <button key={k} className={"chip "+(cinemaFilter===k?"active":"")} onClick={()=>setCinemaFilter(k)}>{l}</button>
          ))}
        </div>
      </div>

      {Object.keys(byCinema).length===0
        ? <div className="empty">Không có suất chiếu nào.</div>
        : Object.keys(byCinema).map(cid=>{
            const cinema=C.cinemaById(cid); if(!cinema) return null;
            return (
              <div key={cid} className="card" style={{ padding:22, marginBottom:16 }}>
                <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:16 }}>
                  <Icon name="location" size={18} color="var(--gold)" />
                  <h3 style={{ fontSize:18, textTransform:"uppercase" }}>{cinema.name}</h3>
                  <span className="muted" style={{ fontSize:13 }}>{cinema.address}</span>
                </div>
                <Table
                  cols={[
                    { key:"time", label:"Giờ", render:r=><span style={{ fontFamily:"var(--ff-head)", fontSize:18 }}>{r.time}</span> },
                    { key:"movieId", label:"Phim", render:r=>{ const m=C.movieById(r.movieId); return m?m.title:"—"; } },
                    { key:"format", label:"Định dạng", render:r=><span className="badge badge-format">{r.format}</span> },
                    { key:"roomId", label:"Phòng", render:r=>{ const rm=C.roomById(r.roomId); return rm?rm.name:"—"; } },
                    { key:"price", label:"Giá vé", right:true, render:r=>F(r.price.regular) },
                    { key:"actions", label:"", render:r=>(
                      <div style={{ display:"flex", gap:6 }}>
                        <button className="btn btn-ghost btn-sm" onClick={()=>setEditing({...r})}><Icon name="info" size={14} /></button>
                        <button className="btn btn-sm" style={{ background:"var(--coral-soft)", color:"var(--coral)", border:"1px solid var(--coral)" }} onClick={()=>setDel(r)}><Icon name="close" size={14} /></button>
                      </div>
                    )},
                  ]}
                  rows={byCinema[cid].sort((a,b)=>a.time.localeCompare(b.time))}
                />
              </div>
            );
          })
      }

      {editing && <ShowtimeModal data={editing} busy={busy} onSave={saveShowtime} onClose={()=>setEditing(null)} />}
      {del && (
        <Modal onClose={()=>setDel(null)}>
          <div style={{ padding:28, textAlign:"center" }}>
            <Icon name="info" size={36} color="var(--coral)" />
            <h3 style={{ fontSize:20, textTransform:"uppercase", margin:"14px 0 8px" }}>Huỷ suất chiếu?</h3>
            <p className="muted">Xoá suất <b style={{ color:"var(--text)" }}>{del.time}</b> – {C.movieById(del.movieId)?.title||""}? (Suất đã có vé sẽ bị backend chặn.)</p>
            <div style={{ display:"flex", gap:10, justifyContent:"center", marginTop:20 }}>
              <button className="btn btn-ghost" onClick={()=>setDel(null)} disabled={busy}>Đóng</button>
              <button className="btn btn-coral" onClick={()=>removeShowtime(del.id)} disabled={busy}>{busy?"Đang xoá…":"Xoá suất"}</button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

function ShowtimeModal({ data, busy, onSave, onClose }) {
  const [f, setF] = useState({ ...data });
  const set = (k,v) => setF(p=>({ ...p, [k]:v }));
  const inp = { width:"100%", background:"var(--bg)", border:"1px solid var(--line-2)", borderRadius:9, color:"var(--text)", fontFamily:"inherit", fontSize:14, padding:"10px 12px", outline:"none" };
  const lbl = { fontSize:12, color:"var(--muted-2)", textTransform:"uppercase", marginBottom:5 };
  return (
    <Modal onClose={onClose} width={520}>
      <div style={{ padding:26 }}>
        <h3 style={{ fontSize:22, textTransform:"uppercase", marginBottom:20 }}>{f.id?"Chỉnh sửa suất chiếu":"Thêm suất chiếu"}</h3>
        <div style={{ display:"grid", gap:14 }}>
          <label><div style={lbl}>Phim</div>
            <select value={f.movieId} onChange={e=>set("movieId",e.target.value)} style={inp}>
              {C.movies.map(m=><option key={m.id} value={m.id}>{m.title}</option>)}
            </select>
          </label>
          <label><div style={lbl}>Phòng chiếu (theo rạp)</div>
            <select value={f.roomId} onChange={e=>set("roomId",e.target.value)} style={inp}>
              {C.rooms.map(r=>{ const c=C.cinemaById(r.cinemaId); return <option key={r.id} value={r.id}>{(c?c.name+" — ":"")+r.name}</option>; })}
            </select>
          </label>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:12 }}>
            <label><div style={lbl}>Ngày</div>
              <input type="date" value={f.date||""} onChange={e=>set("date",e.target.value)} style={inp} />
            </label>
            <label><div style={lbl}>Giờ</div>
              <input type="time" value={f.time||""} onChange={e=>set("time",e.target.value)} style={inp} />
            </label>
            <label><div style={lbl}>Định dạng</div>
              <select value={f.format||"2D"} onChange={e=>set("format",e.target.value)} style={inp}>
                {["2D","3D","IMAX"].map(x=><option key={x}>{x}</option>)}
              </select>
            </label>
          </div>
        </div>
        <div style={{ display:"flex", gap:10, justifyContent:"flex-end", marginTop:22 }}>
          <button className="btn btn-ghost" onClick={onClose} disabled={busy}>Huỷ</button>
          <button className="btn btn-gold" onClick={()=>onSave(f)} disabled={busy || !f.date || !f.time}>
            <Icon name="check" size={16} color="#211803" /> {busy?"Đang lưu…":"Lưu suất"}
          </button>
        </div>
      </div>
    </Modal>
  );
}

/* ─── Rooms ─────────────────────────────────────────────────── */
function RoomsPage() {
  return (
    <div className="fade-up">
      <PageHeader title="Phòng chiếu" sub="Quản lý phòng chiếu và sơ đồ ghế"
        action={<button className="btn btn-gold"><Icon name="sparkle" size={16} color="#211803" /> Thêm phòng</button>}
      />
      <div style={{ display:"grid", gridTemplateColumns:"repeat(2,1fr)", gap:18 }}>
        {C.cinemas.map(cinema=>(
          <div key={cinema.id} className="card" style={{ padding:22 }}>
            <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:16 }}>
              <Icon name="location" size={18} color="var(--gold)" />
              <div>
                <div style={{ fontWeight:700, fontSize:16 }}>{cinema.name}</div>
                <div className="muted" style={{ fontSize:12.5 }}>{cinema.address}</div>
              </div>
            </div>
            {C.rooms.filter(r=>r.cinemaId===cinema.id).map(room=>(
              <div key={room.id} style={{ display:"flex", alignItems:"center", gap:12, padding:"12px 0", borderTop:"1px solid var(--line)" }}>
                <Icon name="seat" size={20} color="var(--muted-2)" />
                <div style={{ flex:1 }}>
                  <div style={{ fontWeight:600 }}>{room.name}</div>
                  <div className="muted-2" style={{ fontSize:12 }}>96 ghế · {room.type}</div>
                </div>
                <span className="badge badge-format">{room.type}</span>
                <span className="badge" style={{ background:"var(--mint-soft)", color:"var(--mint)" }}>Hoạt động</span>
                <button className="btn btn-ghost btn-sm"><Icon name="info" size={14} /></button>
              </div>
            ))}
            {C.rooms.filter(r=>r.cinemaId===cinema.id).length===0 && (
              <p className="muted" style={{ fontSize:13 }}>Chưa có phòng chiếu nào.</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

Object.assign(window, { AdminLayout, DashboardPage, MoviesPage, ShowtimesAdminPage, RoomsPage, Table, StatusBadge, PageHeader });
