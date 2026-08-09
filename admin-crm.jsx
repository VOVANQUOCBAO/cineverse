/* ============================================================
   CINEVERSE — Admin CRM: Bookings · Customers · Staff · Reports
   ============================================================ */
const { useState: uS2, useEffect: uE2, useMemo: uM2 } = React;
const C2 = window.CINE;
const F2 = C2.formatVND;
const FC2 = C2.formatCompact;

/* ─── Bookings Management ───────────────────────────────────── */
function BookingsPage() {
  const [bookings, setBookings] = uS2([...C2.allBookings].reverse());
  const [statusFilter, setStatusFilter] = uS2("all");
  const [search, setSearch] = uS2("");
  const [selected, setSelected] = uS2(null);

  const filtered = bookings.filter(b =>
    (statusFilter==="all"||b.status===statusFilter) &&
    (b.code+b.userId+(C2.movieById(b.movieId)?.title||"")).toLowerCase().includes(search.toLowerCase())
  );

  const [busy, setBusy] = uS2(false);
  const doRefund = async (id) => {
    setBusy(true);
    try {
      await window.API.refund(id);                 // PATCH /bookings/:id/refund (giải phóng ghế ở backend)
      setBookings(prev => prev.map(b => b.id===id ? { ...b, status:"refunded" } : b));
      const idx = C2.allBookings.findIndex(b => b.id===id);   // đồng bộ store để dashboard cập nhật
      if (idx>=0) C2.allBookings[idx].status = "refunded";
      setSelected(null);
    } catch (e) {
      alert("Hoàn tiền thất bại: " + (e.message || e));
    } finally { setBusy(false); }
  };
  const doCancel = async (id) => {
    setBusy(true);
    try {
      await window.API.cancelBooking(id);             // PATCH /bookings/:id/cancel (trả ghế lại)
      setBookings(prev => prev.map(b => b.id===id ? { ...b, status:"cancelled" } : b));
      const idx = C2.allBookings.findIndex(b => b.id===id);
      if (idx>=0) C2.allBookings[idx].status = "cancelled";
      setSelected(null);
    } catch (e) {
      alert("Huỷ vé thất bại: " + (e.message || e));
    } finally { setBusy(false); }
  };

  const stats = { all:bookings.length, confirmed:bookings.filter(b=>b.status==="confirmed").length, cancelled:bookings.filter(b=>b.status==="cancelled").length, refunded:bookings.filter(b=>b.status==="refunded").length };

  return (
    <div className="fade-up">
      <PageHeader title="Quản lý đặt vé" sub={`${stats.confirmed} xác nhận · ${stats.cancelled} huỷ · ${stats.refunded} hoàn tiền`} />

      <div style={{ display:"flex", gap:10, marginBottom:18, flexWrap:"wrap", alignItems:"center" }}>
        <div style={{ display:"flex", alignItems:"center", gap:10, background:"var(--bg)", border:"1px solid var(--line-2)", borderRadius:10, padding:"9px 13px", flex:1, minWidth:220 }}>
          <Icon name="search" size={16} color="var(--muted)" />
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Tìm mã vé, tên khách..." style={{ flex:1, background:"none", border:"none", color:"var(--text)", fontFamily:"inherit", fontSize:14, outline:"none" }} />
        </div>
        <div className="tabs">
          {[["all","Tất cả"],["confirmed","Xác nhận"],["cancelled","Huỷ"],["refunded","Hoàn tiền"]].map(([k,l])=>(
            <button key={k} className={"tab "+(statusFilter===k?"on":"")} onClick={()=>setStatusFilter(k)}>{l}<span style={{ marginLeft:6, fontSize:11, opacity:0.7 }}>{stats[k]}</span></button>
          ))}
        </div>
      </div>

      <div className="card" style={{ padding:0, overflow:"hidden" }}>
        <Table
          cols={[
            { key:"code", label:"Mã vé", render:r=><span style={{ fontFamily:"var(--ff-head)", fontWeight:700, letterSpacing:"0.1em", color:"var(--gold)" }}>{r.code}</span> },
            { key:"movieId", label:"Phim", render:r=>{ const m=C2.movieById(r.movieId); return m?m.title.slice(0,22)+(m.title.length>22?"…":""):"—"; } },
            { key:"userId", label:"Khách", render:r=>{ const u=C2.customerById(r.userId); return u?u.name:"Khách vãng lai"; } },
            { key:"date", label:"Ngày chiếu", render:r=>r.date.split("-").reverse().join("/")+" "+r.time },
            { key:"seatCount", label:"Ghế", right:true },
            { key:"total", label:"Tổng tiền", right:true, render:r=>F2(r.total) },
            { key:"method", label:"Thanh toán", render:r=><span style={{ textTransform:"uppercase", fontSize:12, fontWeight:600, color:"var(--muted)" }}>{r.method}</span> },
            { key:"status", label:"Trạng thái", render:r=><StatusBadge status={r.status} /> },
            { key:"actions", label:"", render:r=>(
              <button className="btn btn-ghost btn-sm" onClick={()=>setSelected(r)}><Icon name="info" size={14} /></button>
            )},
          ]}
          rows={filtered.slice(0,30)}
          emptyMsg="Không có đặt vé nào."
        />
      </div>

      {selected && (
        <Modal onClose={()=>setSelected(null)} width={480}>
          <div style={{ padding:26 }}>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:18 }}>
              <h3 style={{ fontSize:20, textTransform:"uppercase" }}>Chi tiết vé #{selected.code}</h3>
              <StatusBadge status={selected.status} />
            </div>
            <div style={{ display:"flex", flexDirection:"column", gap:8, fontSize:14 }}>
              {[
                ["Phim", C2.movieById(selected.movieId)?.title||"—"],
                ["Khách hàng", C2.customerById(selected.userId)?.name||"Khách vãng lai"],
                ["Rạp", C2.cinemaById(selected.cinemaId)?.name||"—"],
                ["Ngày chiếu", selected.date.split("-").reverse().join("/")+" · "+selected.time],
                ["Số ghế", selected.seatCount+" ghế ("+selected.seatType+")"],
                ["Phương thức", selected.method.toUpperCase()],
                ["Tổng tiền", F2(selected.total)],
                ["Ngày đặt", new Date(selected.createdAt).toLocaleDateString("vi-VN")],
              ].map(([k,v])=>(
                <div key={k} style={{ display:"flex", justifyContent:"space-between", borderBottom:"1px solid var(--line)", paddingBottom:8 }}>
                  <span className="muted">{k}</span><span style={{ fontWeight:600 }}>{v}</span>
                </div>
              ))}
            </div>
            {selected.status==="confirmed" && (
              <div style={{ display:"flex", gap:10, marginTop:20 }}>
                <button className="btn btn-ghost" style={{ flex:1 }} disabled={busy} onClick={()=>doCancel(selected.id)}>Huỷ vé</button>
                <button className="btn btn-gold" style={{ flex:1 }} disabled={busy} onClick={()=>doRefund(selected.id)}><Icon name="arrowRight" size={16} color="#211803" /> {busy?"Đang xử lý…":"Hoàn tiền"}</button>
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}

/* ─── Customer CRM ──────────────────────────────────────────── */
const TIER_COLOR = { Bronze:"#b45309", Silver:"#94a3b8", Gold:"var(--gold)", Platinum:"#a78bfa" };

function CustomersPage() {
  const [search, setSearch] = uS2("");
  const [tier, setTier] = uS2("all");
  const [detail, setDetail] = uS2(null);

  const filtered = C2.customers.filter(c =>
    (tier==="all"||c.tier===tier) &&
    (c.name+c.email+c.phone).toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="fade-up">
      <PageHeader title="Khách hàng" sub={`${C2.customers.length} khách hàng đã đăng ký`} />

      <div style={{ display:"flex", gap:10, marginBottom:18, flexWrap:"wrap" }}>
        <div style={{ display:"flex", alignItems:"center", gap:10, background:"var(--bg)", border:"1px solid var(--line-2)", borderRadius:10, padding:"9px 13px", flex:1, minWidth:220 }}>
          <Icon name="search" size={16} color="var(--muted)" />
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Tìm khách hàng..." style={{ flex:1, background:"none", border:"none", color:"var(--text)", fontFamily:"inherit", fontSize:14, outline:"none" }} />
        </div>
        <div style={{ display:"flex", gap:8 }}>
          {["all","Bronze","Silver","Gold","Platinum"].map(t=>(
            <button key={t} className={"chip "+(tier===t?"active":"")} onClick={()=>setTier(t)}
              style={tier===t&&t!=="all"?{ background:TIER_COLOR[t], borderColor:TIER_COLOR[t], color:"#1a1404" }:{}}>
              {t==="all"?"Tất cả":t}
            </button>
          ))}
        </div>
      </div>

      <div className="card">
        <Table
          cols={[
            { key:"name", label:"Khách hàng", render:r=>(
              <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                <div style={{ width:34, height:34, borderRadius:"50%", background:r.avatar, display:"grid", placeItems:"center", fontWeight:700, color:"#fff", fontSize:13, flex:"none" }}>{r.name[0]}</div>
                <div><div style={{ fontWeight:600 }}>{r.name}</div><div className="muted-2" style={{ fontSize:12 }}>{r.email}</div></div>
              </div>
            )},
            { key:"phone", label:"SĐT" },
            { key:"tier", label:"Hạng", render:r=>(
              <span style={{ fontWeight:700, fontSize:13, color:TIER_COLOR[r.tier] }}>{r.tier}</span>
            )},
            { key:"points", label:"Điểm", right:true, render:r=><b style={{ color:"var(--gold)" }}>{r.points.toLocaleString()}</b> },
            { key:"totalBookings", label:"Số lần đặt", right:true },
            { key:"totalSpent", label:"Tổng chi", right:true, render:r=>FC2(r.totalSpent)+"đ" },
            { key:"lastVisit", label:"Lần cuối", render:r=>r.lastVisit.split("-").reverse().join("/") },
            { key:"actions", label:"", render:r=><button className="btn btn-ghost btn-sm" onClick={()=>setDetail(r)}><Icon name="info" size={14} /></button> },
          ]}
          rows={filtered}
        />
      </div>

      {detail && (
        <Modal onClose={()=>setDetail(null)} width={460}>
          <div style={{ padding:26 }}>
            <div style={{ display:"flex", alignItems:"center", gap:14, marginBottom:20 }}>
              <div style={{ width:52, height:52, borderRadius:"50%", background:detail.avatar, display:"grid", placeItems:"center", fontWeight:700, color:"#fff", fontSize:20 }}>{detail.name[0]}</div>
              <div>
                <div style={{ fontWeight:700, fontSize:18 }}>{detail.name}</div>
                <span style={{ fontWeight:700, fontSize:12, color:TIER_COLOR[detail.tier] }}>{detail.tier} · {detail.points} điểm</span>
              </div>
            </div>
            <div style={{ display:"flex", flexDirection:"column", gap:8, fontSize:14, marginBottom:16 }}>
              {[["Email",detail.email],["SĐT",detail.phone],["Ngày tham gia",detail.joined.split("-").reverse().join("/")],["Tổng đặt vé",detail.totalBookings+" lần"],["Tổng chi",F2(detail.totalSpent)],["Lần ghé cuối",detail.lastVisit.split("-").reverse().join("/")]].map(([k,v])=>(
                <div key={k} style={{ display:"flex", justifyContent:"space-between", borderBottom:"1px solid var(--line)", paddingBottom:8 }}>
                  <span className="muted">{k}</span><span style={{ fontWeight:600 }}>{v}</span>
                </div>
              ))}
            </div>
            <button className="btn btn-ghost" onClick={()=>setDetail(null)} style={{ width:"100%" }}>Đóng</button>
          </div>
        </Modal>
      )}
    </div>
  );
}

/* ─── Staff Management ──────────────────────────────────────── */
function StaffPage() {
  const [staff, setStaff] = uS2([...C2.staff]);
  const [editing, setEditing] = uS2(null);
  const [search, setSearch] = uS2("");

  const filtered = staff.filter(s =>
    (s.name+s.email+s.position).toLowerCase().includes(search.toLowerCase())
  );

  const reloadStaff = async () => { const r = await window.API.staff(); C2.staff = r.data; setStaff(r.data); };
  const save = async (s) => {
    try {
      if (s.id) await window.API.updateStaff(s.id, s);  // PUT /staff/:id
      else await window.API.createStaff(s);             // POST /staff (mật khẩu mặc định 123456)
      await reloadStaff();
      setEditing(null);
    } catch (e) { alert((e.data && e.data.message) || "Lưu nhân viên thất bại: " + (e.message||e)); }
  };
  const removeStaff = async (id) => {
    try { await window.API.deleteStaff(id); await reloadStaff(); setEditing(null); }
    catch (e) { alert((e.data && e.data.message) || "Không xoá được nhân viên: " + (e.message||e)); }
  };

  const ROLES = { staff:"Nhân viên", manager:"Quản lý rạp", admin:"Quản trị" };

  return (
    <div className="fade-up">
      <PageHeader title="Nhân viên" sub={`${staff.filter(s=>s.status==="active").length} đang làm việc`}
        action={<button className="btn btn-gold" onClick={()=>setEditing({ name:"", email:"", phone:"", role:"staff", position:"", cinemaId:"c1", hireDate:"", avatar:"#60a8e0", status:"active", salary:8000000 })}>
          <Icon name="sparkle" size={16} color="#211803" /> Thêm nhân viên
        </button>}
      />
      <div style={{ display:"flex", alignItems:"center", gap:10, background:"var(--bg)", border:"1px solid var(--line-2)", borderRadius:10, padding:"9px 13px", marginBottom:18, maxWidth:360 }}>
        <Icon name="search" size={16} color="var(--muted)" />
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Tìm nhân viên..." style={{ flex:1, background:"none", border:"none", color:"var(--text)", fontFamily:"inherit", fontSize:14, outline:"none" }} />
      </div>

      <div className="card">
        <Table
          cols={[
            { key:"name", label:"Nhân viên", render:r=>(
              <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                <div style={{ width:34, height:34, borderRadius:"50%", background:r.avatar, display:"grid", placeItems:"center", fontWeight:700, color:"#fff", fontSize:13, flex:"none" }}>{r.name[0]}</div>
                <div><div style={{ fontWeight:600 }}>{r.name}</div><div className="muted-2" style={{ fontSize:12 }}>{r.email}</div></div>
              </div>
            )},
            { key:"position", label:"Chức vụ" },
            { key:"role", label:"Quyền", render:r=>(
              <span style={{ fontSize:12, fontWeight:600, padding:"3px 9px", borderRadius:6, background:r.role==="admin"?"var(--coral-soft)":r.role==="manager"?"var(--violet-soft)":"var(--mint-soft)", color:r.role==="admin"?"var(--coral)":r.role==="manager"?"var(--violet)":"var(--mint)" }}>
                {ROLES[r.role]||r.role}
              </span>
            )},
            { key:"cinemaId", label:"Rạp", render:r=>r.cinemaId?C2.cinemaById(r.cinemaId)?.name.split(" ").slice(-2).join(" ")||"—":"Toàn hệ thống" },
            { key:"hireDate", label:"Ngày vào", render:r=>r.hireDate.split("-").reverse().join("/") },
            { key:"salary", label:"Lương", right:true, render:r=>FC2(r.salary)+"đ" },
            { key:"status", label:"Trạng thái", render:r=><StatusBadge status={r.status} /> },
            { key:"actions", label:"", render:r=>(
              <button className="btn btn-ghost btn-sm" onClick={()=>setEditing({...r})}><Icon name="info" size={14} /></button>
            )},
          ]}
          rows={filtered}
        />
      </div>

      {editing && (
        <Modal onClose={()=>setEditing(null)} width={520}>
          <div style={{ padding:26 }}>
            <h3 style={{ fontSize:20, textTransform:"uppercase", marginBottom:18 }}>{editing.id?"Chỉnh sửa nhân viên":"Thêm nhân viên mới"}</h3>
            <div style={{ display:"grid", gap:12 }}>
              {[["name","Họ tên"],["email","Email"],["phone","Số điện thoại"],["position","Chức vụ"]].map(([k,l])=>(
                <label key={k}>
                  <div style={{ fontSize:12, color:"var(--muted-2)", textTransform:"uppercase", marginBottom:5 }}>{l}</div>
                  <input value={editing[k]||""} onChange={e=>setEditing(p=>({...p,[k]:e.target.value}))}
                    style={{ width:"100%", background:"var(--bg)", border:"1px solid var(--line-2)", borderRadius:9, color:"var(--text)", fontFamily:"inherit", fontSize:14, padding:"10px 12px", outline:"none" }} />
                </label>
              ))}
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
                <label>
                  <div style={{ fontSize:12, color:"var(--muted-2)", textTransform:"uppercase", marginBottom:5 }}>Quyền hạn</div>
                  <select value={editing.role} onChange={e=>setEditing(p=>({...p,role:e.target.value}))}
                    style={{ width:"100%", background:"var(--bg)", border:"1px solid var(--line-2)", borderRadius:9, color:"var(--text)", fontFamily:"inherit", fontSize:14, padding:"10px 12px", outline:"none" }}>
                    <option value="staff">Nhân viên</option>
                    <option value="manager">Quản lý rạp</option>
                    <option value="admin">Quản trị</option>
                  </select>
                </label>
                <label>
                  <div style={{ fontSize:12, color:"var(--muted-2)", textTransform:"uppercase", marginBottom:5 }}>Trạng thái</div>
                  <select value={editing.status} onChange={e=>setEditing(p=>({...p,status:e.target.value}))}
                    style={{ width:"100%", background:"var(--bg)", border:"1px solid var(--line-2)", borderRadius:9, color:"var(--text)", fontFamily:"inherit", fontSize:14, padding:"10px 12px", outline:"none" }}>
                    <option value="active">Hoạt động</option>
                    <option value="inactive">Ngừng</option>
                  </select>
                </label>
              </div>
            </div>
            <div style={{ display:"flex", gap:10, justifyContent:"flex-end", marginTop:20 }}>
              {editing.id && <button className="btn btn-coral" style={{ marginRight:"auto" }} onClick={()=>removeStaff(editing.id)}><Icon name="close" size={16} /> Xoá</button>}
              <button className="btn btn-ghost" onClick={()=>setEditing(null)}>Huỷ</button>
              <button className="btn btn-gold" onClick={()=>save(editing)}><Icon name="check" size={16} color="#211803" /> Lưu</button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

/* ─── Reports ───────────────────────────────────────────────── */
function ReportsPage() {
  const [period, setPeriod] = uS2("monthly");
  const data = period==="daily"
    ? C2.revenueDaily.map(d=>({ label:d.label, value:d.revenue }))
    : C2.revenueMonthly.map(d=>({ label:d.label, value:d.revenue }));
  const totalRev = C2.allBookings.filter(b=>b.status==="confirmed").reduce((s,b)=>s+b.total,0);
  const totalTickets = C2.allBookings.filter(b=>b.status==="confirmed").reduce((s,b)=>s+b.seatCount,0);
  const cancelRate = C2.allBookings.length>0 ? Math.round(C2.allBookings.filter(b=>b.status==="cancelled").length/C2.allBookings.length*100) : 0;

  return (
    <div className="fade-up">
      <PageHeader title="Báo cáo & Thống kê"
        action={<button className="btn btn-ghost"><Icon name="arrowRight" size={16} /> Xuất Excel</button>}
      />

      <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:18, marginBottom:28 }}>
        <KPICard label="Tổng doanh thu" value={FC2(totalRev)+"đ"} icon="sparkle" color="var(--gold)" trend={12.4} sub="so với kỳ trước" spark={C2.revenueDaily.slice(-8).map(d=>d.revenue)} />
        <KPICard label="Tổng vé bán" value={totalTickets.toLocaleString()} icon="ticket" color="var(--mint)" trend={8.1} sub="so với kỳ trước" spark={C2.revenueDaily.slice(-8).map(d=>d.tickets)} />
        <KPICard label="Tỷ lệ huỷ vé" value={cancelRate+"%"} icon="close" color="var(--coral)" trend={-1.2} sub="so với kỳ trước" />
      </div>

      <div className="card" style={{ padding:26, marginBottom:20 }}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:20 }}>
          <h3 style={{ fontSize:18, textTransform:"uppercase" }}>Doanh thu theo thời gian</h3>
          <div className="tabs">
            <button className={"tab "+(period==="daily"?"on":"")} onClick={()=>setPeriod("daily")}>Ngày</button>
            <button className={"tab "+(period==="monthly"?"on":"")} onClick={()=>setPeriod("monthly")}>Tháng</button>
          </div>
        </div>
        <LineChart data={data} height={220} width={900} color="var(--gold)" />
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:18 }}>
        <div className="card" style={{ padding:24 }}>
          <h3 style={{ fontSize:17, textTransform:"uppercase", marginBottom:16 }}>Top phim doanh thu</h3>
          <Table
            cols={[
              { key:"rank", label:"#", render:(_,i)=>i+1 },
              { key:"title", label:"Phim", wrap:true },
              { key:"tickets", label:"Vé", right:true, render:r=>r.tickets.toLocaleString() },
              { key:"revenue", label:"Doanh thu", right:true, render:r=>FC2(r.revenue)+"đ" },
            ]}
            rows={C2.topMovies.map((m,i)=>({ ...m, rank:i+1 }))}
          />
        </div>
        <div className="card" style={{ padding:24 }}>
          <h3 style={{ fontSize:17, textTransform:"uppercase", marginBottom:16 }}>Công suất theo rạp</h3>
          <BarChart data={Object.values(C2.occupancy).map(o=>({ label:o.name.split(" ").slice(-1)[0], value:Math.round(o.rate*100) }))} height={160} color="var(--mint)" />
          <div style={{ display:"flex", justifyContent:"center", gap:24, marginTop:8 }}>
            {Object.values(C2.occupancy).map(o=>(
              <div key={o.name} style={{ textAlign:"center" }}>
                <div style={{ fontFamily:"var(--ff-head)", fontSize:22, color:"var(--mint)" }}>{Math.round(o.rate*100)}%</div>
                <div className="muted-2" style={{ fontSize:11.5 }}>{o.name.split(" ").slice(-1)[0]}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { BookingsPage, CustomersPage, StaffPage, ReportsPage });
