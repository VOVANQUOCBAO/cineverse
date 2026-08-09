/* ============================================================
   CINEVERSE — Auth system
   window.AUTH: state object
   LoginScreen: React component
   ============================================================ */
const AUTH_KEY = "cineverse_auth_v1";

/* Tài khoản demo (mật khẩu thật trong DB seed = "123456") */
const DEMO_ACCOUNTS = [
  { id:"u1", name:"Nguyễn Văn An",  email:"an.nguyen@email.com",   password:"123456", role:"customer", avatar:"#f6c445", phone:"0901 234 567" },
  { id:"st1", name:"Trần Thị Lan",  email:"lan.tran@cineverse.vn",  password:"123456", role:"staff",    avatar:"#38d39f", cinemaId:"c1", position:"Nhân viên bán vé" },
  { id:"a1", name:"Đức Hoàng",      email:"duc.hoang@cineverse.vn", password:"123456", role:"admin",    avatar:"#ff5a5f", position:"Quản trị hệ thống" },
];

const AUTH = (() => {
  let user = null;
  try { const s = localStorage.getItem(AUTH_KEY); if(s) user = JSON.parse(s); } catch(e){}
  return {
    get user() { return user; },
    get role() { return user?.role||null; },
    get isAdmin() { return user?.role==="admin"; },
    get isStaff() { return user?.role==="staff"; },
    get isCustomer() { return user?.role==="customer"; },
    get isLoggedIn() { return !!user; },
    // Đăng nhập THẬT qua backend: nhận JWT + hồ sơ user
    async signIn(email, password) {
      const res = await API.login(email, password);
      API.setToken(res.accessToken);
      user = res.user;
      try { localStorage.setItem(AUTH_KEY, JSON.stringify(user)); } catch(e){}
      return user;
    },
    async signInWithGoogle(credential) {
      const res = await API.googleLogin(credential);
      API.setToken(res.accessToken);
      user = res.user;
      try { localStorage.setItem(AUTH_KEY, JSON.stringify(user)); } catch(e){}
      return user;
    },
    // tương thích cũ: nạp sẵn 1 user đã xác thực
    login(account) { user=account; try{localStorage.setItem(AUTH_KEY, JSON.stringify(account));}catch(e){} },
    logout() { user=null; try{localStorage.removeItem(AUTH_KEY);}catch(e){} API.setToken(null); window.location.reload(); },
  };
})();
window.AUTH = AUTH;
window.DEMO_ACCOUNTS = DEMO_ACCOUNTS;

/* ---------------- Login Screen ---------------- */
function LoginScreen({ onLogin }) {
  const { useState, useEffect, useRef } = React;
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleConfig, setGoogleConfig] = useState(null);
  const [googleState, setGoogleState] = useState("loading");
  const googleButtonRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    API.googleConfig()
      .then((config) => {
        if (cancelled) return;
        setGoogleConfig(config);
        if (!config.enabled) setGoogleState("disabled");
      })
      .catch(() => { if (!cancelled) setGoogleState("disabled"); });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!googleConfig?.enabled || !googleButtonRef.current) return;
    let cancelled = false;
    let attempts = 0;
    const renderGoogleButton = () => {
      if (cancelled) return;
      if (!window.google?.accounts?.id) {
        attempts += 1;
        if (attempts >= 80) { setGoogleState("unavailable"); return; }
        window.setTimeout(renderGoogleButton, 150);
        return;
      }
      try {
        window.google.accounts.id.initialize({
          client_id: googleConfig.clientId,
          callback: async (response) => {
            if (!response?.credential) return;
            setErr("");
            setLoading(true);
            try {
              const user = await AUTH.signInWithGoogle(response.credential);
              onLogin(user);
            } catch (e) {
              setLoading(false);
              setErr(e.message || "Không thể đăng nhập bằng Google.");
            }
          },
          ux_mode: "popup",
          use_fedcm_for_prompt: true,
        });
        googleButtonRef.current.innerHTML = "";
        window.google.accounts.id.renderButton(googleButtonRef.current, {
          type: "standard",
          theme: "filled_black",
          size: "large",
          text: "continue_with",
          shape: "rectangular",
          logo_alignment: "left",
          width: Math.min(360, googleButtonRef.current.clientWidth || 360),
        });
        setGoogleState("ready");
      } catch (e) {
        setGoogleState("unavailable");
      }
    };
    renderGoogleButton();
    return () => { cancelled = true; };
  }, [googleConfig, onLogin]);

  const doLogin = async (emailArg, passArg) => {
    setErr("");
    setLoading(true);
    try {
      const user = await AUTH.signIn(emailArg, passArg);
      onLogin(user);
    } catch (e) {
      setLoading(false);
      setErr(e.status === 401 ? "Sai email hoặc mật khẩu." : (e.message || "Lỗi đăng nhập."));
    }
  };

  const submit = (e) => {
    e.preventDefault();
    if (!email) { setErr("Vui lòng nhập email."); return; }
    if (pass.length < 1) { setErr("Vui lòng nhập mật khẩu."); return; }
    doLogin(email, pass);
  };

  const roleLabel = { customer:"Khách hàng", staff:"Nhân viên", admin:"Quản trị" };
  const roleColor = { customer:"var(--gold)", staff:"var(--mint)", admin:"var(--coral)" };

  return (
    <div style={{ minHeight:"100vh", background:"var(--bg)", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:24 }}>
      {/* Logo */}
      <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:40 }}>
        <div style={{ width:42, height:42, borderRadius:12, background:"linear-gradient(150deg,var(--gold),var(--coral))", display:"grid", placeItems:"center" }}>
          <Icon name="film" size={24} color="#1a1404" stroke={2} />
        </div>
        <span style={{ fontFamily:"var(--ff-head)", fontSize:26, fontWeight:700, letterSpacing:"0.06em", textTransform:"uppercase" }}>
          CINE<span style={{ color:"var(--gold)" }}>VERSE</span>
        </span>
      </div>

      <div className="card" style={{ width:"100%", maxWidth:440, padding:36 }}>
        <h2 style={{ fontSize:26, textTransform:"uppercase", marginBottom:6, textAlign:"center" }}>Đăng nhập</h2>
        <p className="muted" style={{ textAlign:"center", marginTop:0, marginBottom:28 }}>Hệ thống quản lý rạp chiếu phim</p>

        {/* Demo quick-login */}
        <div style={{ marginBottom:24 }}>
          <p style={{ fontSize:12, color:"var(--muted-2)", textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:10 }}>Tài khoản demo</p>
          <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
            {DEMO_ACCOUNTS.map(a => (
              <button key={a.id} className="btn btn-ghost" style={{ justifyContent:"flex-start", gap:12, padding:"11px 14px" }} disabled={loading} onClick={() => doLogin(a.email, a.password)}>
                <div style={{ width:32, height:32, borderRadius:"50%", background:a.avatar, display:"grid", placeItems:"center", fontWeight:700, color:"#fff", fontSize:13, flex:"none" }}>
                  {a.name[0]}
                </div>
                <div style={{ textAlign:"left", flex:1 }}>
                  <div style={{ fontWeight:600, fontSize:13.5 }}>{a.name}</div>
                  <div style={{ fontSize:11.5, color:"var(--muted-2)" }}>{a.email}</div>
                </div>
                <span style={{ fontSize:11.5, fontWeight:600, padding:"3px 9px", borderRadius:6, background:roleColor[a.role]+"22", color:roleColor[a.role] }}>
                  {roleLabel[a.role]}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:20 }}>
          <div style={{ flex:1, height:1, background:"var(--line)" }} />
          <span className="muted-2" style={{ fontSize:12 }}>đăng nhập hoặc đăng ký bằng Google</span>
          <div style={{ flex:1, height:1, background:"var(--line)" }} />
        </div>

        <div className="google-auth-area">
          <div ref={googleButtonRef} className="google-auth-button" aria-live="polite" />
          {googleState === "loading" && <div className="google-auth-placeholder"><span className="spin" />Đang tải Google…</div>}
          {googleState === "disabled" && <div className="google-auth-placeholder is-disabled">Google Sign-In chưa được cấu hình trên máy chủ.</div>}
          {googleState === "unavailable" && <div className="google-auth-placeholder is-disabled">Không tải được Google Sign-In. Kiểm tra kết nối hoặc cấu hình domain.</div>}
        </div>

        <div style={{ display:"flex", alignItems:"center", gap:12, margin:"20px 0" }}>
          <div style={{ flex:1, height:1, background:"var(--line)" }} />
          <span className="muted-2" style={{ fontSize:12 }}>hoặc đăng nhập bằng mật khẩu</span>
          <div style={{ flex:1, height:1, background:"var(--line)" }} />
        </div>

        <form onSubmit={submit}>
          <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
            <label>
              <div style={{ fontSize:12, color:"var(--muted-2)", textTransform:"uppercase", letterSpacing:"0.05em", marginBottom:6 }}>Email</div>
              <div style={{ display:"flex", alignItems:"center", gap:10, background:"var(--bg)", border:"1px solid var(--line-2)", borderRadius:10, padding:"11px 13px" }}>
                <Icon name="user" size={16} color="var(--muted)" />
                <input value={email} onChange={e=>setEmail(e.target.value)} placeholder="your@email.com" type="email"
                  style={{ flex:1, background:"none", border:"none", color:"var(--text)", fontFamily:"inherit", fontSize:14, outline:"none" }} />
              </div>
            </label>
            <label>
              <div style={{ fontSize:12, color:"var(--muted-2)", textTransform:"uppercase", letterSpacing:"0.05em", marginBottom:6 }}>Mật khẩu</div>
              <div style={{ display:"flex", alignItems:"center", gap:10, background:"var(--bg)", border:"1px solid var(--line-2)", borderRadius:10, padding:"11px 13px" }}>
                <Icon name="shield" size={16} color="var(--muted)" />
                <input value={pass} onChange={e=>setPass(e.target.value)} placeholder="••••••••" type="password"
                  style={{ flex:1, background:"none", border:"none", color:"var(--text)", fontFamily:"inherit", fontSize:14, outline:"none" }} />
              </div>
            </label>
            {err && <div style={{ color:"var(--coral)", fontSize:13, display:"flex", alignItems:"center", gap:8 }}><Icon name="info" size={15} color="var(--coral)" />{err}</div>}
            <button className="btn btn-gold btn-lg" type="submit" disabled={loading} style={{ marginTop:4, width:"100%" }}>
              {loading ? <><span className="spin" style={{ width:18, height:18, borderWidth:2 }} />Đang đăng nhập…</> : "Đăng nhập"}
            </button>
          </div>
        </form>
        <p className="muted-2" style={{ fontSize:12, textAlign:"center", marginTop:20 }}>Mật khẩu mọi tài khoản demo: <b>123456</b></p>
      </div>
    </div>
  );
}

Object.assign(window, { AUTH, DEMO_ACCOUNTS, LoginScreen });
