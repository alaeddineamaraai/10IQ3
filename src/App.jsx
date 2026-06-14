import { useState, useEffect, useRef } from "react";

const APP = {
  name: "10IQ",
  tagline: "College tennis recruiting, automated",
  pricing: { baseRate: 50, emailsPerUnit: 150, freeTierEmails: 5, plans: { free: { label: "Free", discount: 0, emailLimit: 5 }, pro: { label: "Pro", discount: 0.20, emailLimit: null }, elite: { label: "Elite", discount: 0.35, emailLimit: null } } }
};
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_KEY;

const sb = async (path, opts={}) => {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, { headers:{ apikey:SUPABASE_KEY, Authorization:`Bearer ${SUPABASE_KEY}`, "Content-Type":"application/json", Prefer:"return=representation", ...opts.headers }, ...opts });
  const t = await r.text(); if (!r.ok) throw new Error(t); return t ? JSON.parse(t) : [];
};
const callClaude = async (messages, system) => {
  const r = await fetch("/api/claude", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ system, messages }) });
  const j = await r.json(); return j.text || "";
};

// ── STYLES ────────────────────────────────────────────────────────────────────
const sans = "-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif";
const mono = "'SF Mono','ui-monospace',monospace";
const C = {
  w:"#ffffff", w80:"rgba(255,255,255,0.8)", w60:"rgba(255,255,255,0.6)",
  w50:"rgba(255,255,255,0.5)", w40:"rgba(255,255,255,0.4)", w30:"rgba(255,255,255,0.3)",
  w20:"rgba(255,255,255,0.2)", w10:"rgba(255,255,255,0.1)", w05:"rgba(255,255,255,0.05)",
  tg:"#c8f020", tga:"rgba(200,240,32,",
  teal:"rgba(0,210,170,0.9)", purple:"rgba(139,92,246,0.9)", blue:"rgba(59,130,246,0.9)", amber:"rgba(245,158,11,0.9)", red:"rgba(239,68,68,0.9)"
};
const DIV_C = { "NCAA D1":C.teal, "NCAA D2":C.purple, "NCAA D3":C.blue, "NAIA":C.amber, "JUCO":C.red };
const dC = d => DIV_C[d] || C.w40;

const gc = (extra={}) => ({
  background:"linear-gradient(145deg,rgba(255,255,255,0.08) 0%,rgba(255,255,255,0.04) 100%)",
  border:"1px solid rgba(255,255,255,0.11)",
  borderRadius:18,
  boxShadow:"0 1px 0 rgba(255,255,255,0.08) inset, 0 8px 32px rgba(0,0,0,0.35)",
  backdropFilter:"blur(28px) saturate(180%)",
  WebkitBackdropFilter:"blur(28px) saturate(180%)",
  position:"relative",
  ...extra
});
const gcSm = (extra={}) => gc({ borderRadius:13, ...extra });
const gcDeep = (extra={}) => ({
  background:"rgba(255,255,255,0.04)",
  border:"1px solid rgba(255,255,255,0.08)",
  borderRadius:11,
  ...extra
});

// ── ANIMATED BACKGROUND ───────────────────────────────────────────────────────
function AnimBG() {
  return (
    <div style={{ position:"fixed", inset:0, zIndex:0, overflow:"hidden", background:"#07090d" }}>
      <style>{`
        @keyframes orb1{0%{transform:translate(0,0) scale(1)}33%{transform:translate(15%,20%) scale(1.15)}66%{transform:translate(-10%,10%) scale(0.9)}100%{transform:translate(0,0) scale(1)}}
        @keyframes orb2{0%{transform:translate(0,0) scale(1)}33%{transform:translate(-20%,-15%) scale(1.2)}66%{transform:translate(10%,-5%) scale(0.85)}100%{transform:translate(0,0) scale(1)}}
        @keyframes orb3{0%{transform:translate(0,0) scale(1)}33%{transform:translate(8%,-18%) scale(1.1)}66%{transform:translate(-15%,12%) scale(1.05)}100%{transform:translate(0,0) scale(1)}}
        *{box-sizing:border-box;}
      `}</style>
      <div style={{ position:"absolute", width:"70vw", height:"70vw", borderRadius:"50%", background:"radial-gradient(circle,rgba(100,110,80,0.4) 0%,transparent 70%)", top:"-20%", left:"-15%", animation:"orb1 18s ease-in-out infinite", filter:"blur(70px)" }}/>
      <div style={{ position:"absolute", width:"55vw", height:"55vw", borderRadius:"50%", background:"radial-gradient(circle,rgba(60,70,50,0.35) 0%,transparent 70%)", bottom:"-10%", right:"-10%", animation:"orb2 22s ease-in-out infinite", filter:"blur(80px)" }}/>
      <div style={{ position:"absolute", width:"40vw", height:"40vw", borderRadius:"50%", background:"radial-gradient(circle,rgba(200,240,32,0.06) 0%,transparent 70%)", top:"40%", left:"50%", animation:"orb3 26s ease-in-out infinite", filter:"blur(70px)" }}/>
      <div style={{ position:"absolute", inset:0, background:"rgba(0,0,0,0.25)" }}/>
    </div>
  );
}

// ── LOGO ──────────────────────────────────────────────────────────────────────
function Logo({ size=28, color="rgba(255,255,255,0.85)" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <circle cx="16" cy="16" r="15" stroke={color} strokeWidth="1.5"/>
      <path d="M7 16 Q16 6 25 16 Q16 26 7 16Z" stroke={color} strokeWidth="1.5" fill="none"/>
      <line x1="1" y1="16" x2="31" y2="16" stroke={color} strokeWidth="1" opacity="0.3"/>
      <line x1="16" y1="1" x2="16" y2="31" stroke={color} strokeWidth="1" opacity="0.3"/>
      <circle cx="16" cy="16" r="2.5" fill={color}/>
    </svg>
  );
}

// ── BUTTON ────────────────────────────────────────────────────────────────────
function Btn({ children, onClick, variant="primary", size="md", disabled, full, style:sx={} }) {
  const [hov, setHov] = useState(false);
  const sz = { sm:{padding:"6px 14px",fontSize:12,borderRadius:9}, md:{padding:"10px 20px",fontSize:13,borderRadius:11}, lg:{padding:"14px 30px",fontSize:15,borderRadius:13} };
  const base = { cursor:disabled?"default":"pointer", border:"none", fontWeight:600, fontFamily:sans, display:"inline-flex", alignItems:"center", justifyContent:"center", gap:8, opacity:disabled?0.4:1, width:full?"100%":"auto", transition:"all 0.2s", position:"relative", overflow:"hidden", backdropFilter:"blur(20px)", WebkitBackdropFilter:"blur(20px)", ...sz[size] };
  const v = {
    primary:{ background:hov?"rgba(255,255,255,0.2)":"rgba(255,255,255,0.12)", color:C.w, border:"1px solid rgba(255,255,255,0.25)", boxShadow:hov?"0 8px 32px rgba(255,255,255,0.08),inset 0 1px 0 rgba(255,255,255,0.25)":"0 4px 16px rgba(0,0,0,0.3),inset 0 1px 0 rgba(255,255,255,0.15)" },
    ghost:  { background:hov?"rgba(255,255,255,0.07)":"rgba(255,255,255,0.03)", color:C.w60, border:"1px solid rgba(255,255,255,0.1)", boxShadow:"inset 0 1px 0 rgba(255,255,255,0.05)" },
    solid:  { background:hov?"rgba(255,255,255,0.96)":"rgba(255,255,255,0.88)", color:"#07090d", border:"1px solid rgba(255,255,255,0.5)", boxShadow:hov?"0 8px 32px rgba(255,255,255,0.2)":"0 4px 16px rgba(255,255,255,0.08)" },
    tg:     { background:hov?"rgba(200,240,32,0.95)":"rgba(200,240,32,0.88)", color:"#07090d", border:"1px solid rgba(200,240,32,0.5)", boxShadow:hov?"0 8px 32px rgba(200,240,32,0.25)":"0 4px 16px rgba(200,240,32,0.1)" },
    danger: { background:"rgba(239,68,68,0.1)", color:"rgba(239,68,68,0.9)", border:"1px solid rgba(239,68,68,0.22)" },
  };
  return (
    <button onClick={onClick} disabled={disabled} onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)} style={{ ...base, ...v[variant], ...sx }}>
      {hov && !disabled && <div style={{ position:"absolute", inset:0, background:"linear-gradient(135deg,rgba(255,255,255,0.07) 0%,transparent 60%)", pointerEvents:"none" }}/>}
      {children}
    </button>
  );
}

// ── FIELD ─────────────────────────────────────────────────────────────────────
function Field({ label, type="text", value, onChange, placeholder, textarea, half, select, children }) {
  const [show, setShow] = useState(false);
  const [focus, setFocus] = useState(false);
  const inp = { ...gcDeep(), padding:"11px 14px", fontSize:13, color:C.w, outline:"none", width:"100%", fontFamily:sans, transition:"all 0.2s", background:focus?"rgba(255,255,255,0.07)":"rgba(255,255,255,0.04)", border:`1px solid ${focus?"rgba(255,255,255,0.22)":"rgba(255,255,255,0.1)"}`, paddingRight:type==="password"?38:14 };
  return (
    <div style={{ flex:half?"1 1 45%":"1 1 100%", display:"flex", flexDirection:"column", gap:5 }}>
      {label && <label style={{ fontSize:10, color:C.w40, letterSpacing:0.8, textTransform:"uppercase", fontWeight:600 }}>{label}</label>}
      <div style={{ position:"relative" }}>
        {textarea ? <textarea value={value} onChange={onChange} placeholder={placeholder} rows={4} style={{ ...inp, resize:"vertical" }} onFocus={()=>setFocus(true)} onBlur={()=>setFocus(false)}/>
         : select ? <select value={value} onChange={onChange} style={{ ...inp, appearance:"none", cursor:"pointer" }} onFocus={()=>setFocus(true)} onBlur={()=>setFocus(false)}>{children}</select>
         : <input type={type==="password"&&show?"text":type} value={value} onChange={onChange} placeholder={placeholder} style={inp} onFocus={()=>setFocus(true)} onBlur={()=>setFocus(false)}/>}
        {type==="password" && <button onClick={()=>setShow(s=>!s)} style={{ position:"absolute", right:10, top:"50%", transform:"translateY(-50%)", background:"none", border:"none", color:C.w40, cursor:"pointer", fontSize:12, lineHeight:1 }}>{show?"○":"●"}</button>}
      </div>
    </div>
  );
}

function Avatar({ name, size=30, onClick }) {
  const i = (name||"?").split(" ").map(w=>w[0]).join("").slice(0,2).toUpperCase();
  return <div onClick={onClick} style={{ width:size, height:size, borderRadius:"50%", background:"rgba(200,240,32,0.12)", border:"1px solid rgba(200,240,32,0.28)", backdropFilter:"blur(10px)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:size*0.32, fontWeight:700, color:C.tg, cursor:"pointer", flexShrink:0, userSelect:"none", fontFamily:mono }}>{i}</div>;
}

function GlassBar({ pct, color=C.tg, height=4 }) {
  return (
    <div style={{ height, background:"rgba(255,255,255,0.06)", borderRadius:99, overflow:"hidden" }}>
      <div style={{ height:"100%", width:`${Math.min(pct,100)}%`, background:`linear-gradient(90deg,${color},rgba(255,255,255,0.7))`, borderRadius:99, transition:"width 0.8s ease" }}/>
    </div>
  );
}

// ── TOPBAR ────────────────────────────────────────────────────────────────────
function Topbar({ user, onHome, onProfile }) {
  return (
    <div style={{ position:"sticky", top:0, zIndex:100, background:"rgba(7,9,13,0.85)", backdropFilter:"blur(40px)", WebkitBackdropFilter:"blur(40px)", borderBottom:"1px solid rgba(255,255,255,0.07)", display:"grid", gridTemplateColumns:"1fr auto 1fr", alignItems:"center", height:58, padding:"0 24px" }}>
      <div style={{ display:"flex", alignItems:"center", gap:8 }}>
        <span style={{ fontSize:10, padding:"3px 11px", borderRadius:99, background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.1)", color:C.w50 }}>{APP.pricing.plans[user?.plan||"free"]?.label} Plan</span>
      </div>
      <div onClick={onHome} style={{ display:"flex", alignItems:"center", gap:9, cursor:"pointer", userSelect:"none" }}>
        <Logo size={22}/><span style={{ fontSize:16, fontWeight:800, color:C.w, letterSpacing:"-0.5px" }}>{APP.name}</span>
      </div>
      <div style={{ display:"flex", justifyContent:"flex-end" }}>
        <div onClick={onProfile} style={{ display:"flex", alignItems:"center", gap:8, padding:"5px 13px", borderRadius:99, background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.09)", cursor:"pointer", transition:"all 0.15s" }} onMouseEnter={e=>e.currentTarget.style.borderColor="rgba(200,240,32,0.3)"} onMouseLeave={e=>e.currentTarget.style.borderColor="rgba(255,255,255,0.09)"}>
          <Avatar name={user?.name} size={24}/>
          <span style={{ fontSize:12, color:C.w60 }}>{user?.name?.split(" ")[0]||"Profile"}</span>
          <span style={{ fontSize:9, color:C.w20 }}>▾</span>
        </div>
      </div>
    </div>
  );
}

// ── TABS ──────────────────────────────────────────────────────────────────────
function Tabs({ active, onChange }) {
  const tabs = ["Dashboard","Schools","Coaches","AI Advisor"];
  return (
    <div style={{ display:"flex", gap:2, padding:"0 24px 10px", justifyContent:"center", background:"rgba(7,9,13,0.85)", backdropFilter:"blur(40px)", WebkitBackdropFilter:"blur(40px)", borderBottom:"1px solid rgba(255,255,255,0.06)" }}>
      {tabs.map((t,i) => (
        <button key={t} onClick={()=>onChange(i)} style={{ padding:"7px 20px", fontSize:13, borderRadius:9, cursor:"pointer", border:`1px solid ${active===i?"rgba(200,240,32,0.3)":"transparent"}`, background:active===i?"rgba(200,240,32,0.09)":"transparent", color:active===i?C.tg:C.w40, fontFamily:sans, fontWeight:500, transition:"all 0.16s" }}>
          {t}
        </button>
      ))}
    </div>
  );
}

// ── COACH DRAWER ──────────────────────────────────────────────────────────────
function CoachDrawer({ coach, onClose, onGenerate, onSend, genEmails, generating, sending }) {
  if (!coach) return null;
  const em = genEmails?.[coach.email];
  const isSending = sending?.[coach.email];
  const isGenerating = generating === coach.email;
  const vO = coach.email_sent ? Math.floor(Math.random()*9) : 0;
  const eO = coach.email_opened ? Math.floor(Math.random()*4)+1 : 0;
  const pC = coach.email_sent ? Math.floor(Math.random()*4) : 0;
  return (
    <div onClick={onClose} style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.6)", backdropFilter:"blur(16px)", WebkitBackdropFilter:"blur(16px)", zIndex:1000, display:"flex", justifyContent:"flex-end", fontFamily:sans }}>
      <div onClick={e=>e.stopPropagation()} style={{ width:440, height:"100vh", background:"rgba(7,9,13,0.88)", backdropFilter:"blur(40px) saturate(200%)", WebkitBackdropFilter:"blur(40px) saturate(200%)", borderLeft:"1px solid rgba(255,255,255,0.09)", overflowY:"auto", padding:"1.75rem", display:"flex", flexDirection:"column", gap:14, boxShadow:"-20px 0 60px rgba(0,0,0,0.5)" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
          <div>
            <div style={{ fontSize:20, fontWeight:800, color:C.w, letterSpacing:"-0.5px" }}>{coach.school_name}</div>
            <div style={{ fontSize:13, color:C.w50, marginTop:3 }}>{coach.coach_name}</div>
            <div style={{ marginTop:10, display:"flex", gap:6, flexWrap:"wrap" }}>
              <span style={{ fontSize:10, padding:"3px 10px", borderRadius:99, background:"rgba(255,255,255,0.06)", border:"1px solid rgba(255,255,255,0.12)", color:dC(coach.division) }}>{coach.division||"—"}</span>
              {coach.team_utr && <span style={{ fontSize:10, padding:"3px 10px", borderRadius:99, background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.1)", color:C.w60 }}>UTR {Number(coach.team_utr).toFixed(1)}</span>}
              {coach.team_wtn && <span style={{ fontSize:10, padding:"3px 10px", borderRadius:99, background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.1)", color:C.w60 }}>WTN {Number(coach.team_wtn).toFixed(1)}</span>}
            </div>
          </div>
          <button onClick={onClose} style={{ ...gcDeep(), width:32, height:32, display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", color:C.w50, fontSize:14, border:"1px solid rgba(255,255,255,0.1)", borderRadius:9 }}>✕</button>
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:8 }}>
          {[["Sent",coach.email_sent],["Opened",coach.email_opened],["Replied",coach.replied]].map(([l,v])=>(
            <div key={l} style={{ ...gcSm(), padding:"12px 8px", textAlign:"center" }}>
              <div style={{ fontSize:18, marginBottom:4, color:v?C.tg:C.w20 }}>{v?"✓":"—"}</div>
              <div style={{ fontSize:10, color:v?C.w60:C.w20, textTransform:"uppercase", letterSpacing:0.7 }}>{l}</div>
            </div>
          ))}
        </div>
        <div style={{ ...gcSm(), padding:16 }}>
          <div style={{ fontSize:10, color:C.w30, textTransform:"uppercase", letterSpacing:1, marginBottom:14, fontWeight:600 }}>Engagement</div>
          {[["Email opens",eO,5],["Tape views",vO,10],["Profile clicks",pC,6]].map(([l,v,mx])=>(
            <div key={l} style={{ marginBottom:12 }}>
              <div style={{ display:"flex", justifyContent:"space-between", marginBottom:5 }}>
                <span style={{ fontSize:12, color:C.w50 }}>{l}</span>
                <span style={{ fontSize:12, color:v>0?C.w80:C.w20, fontFamily:mono }}>{v}</span>
              </div>
              <GlassBar pct={(v/mx)*100} color={v>0?C.tg:"rgba(255,255,255,0.15)"}/>
            </div>
          ))}
        </div>
        <div style={{ ...gcSm(), padding:16 }}>
          <div style={{ fontSize:10, color:C.w30, textTransform:"uppercase", letterSpacing:1, marginBottom:12, fontWeight:600 }}>AI Email</div>
          {em ? (
            <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
              <div style={{ ...gcDeep(), padding:"10px 12px" }}><div style={{ fontSize:10, color:C.w30, marginBottom:4 }}>SUBJECT</div><div style={{ fontSize:13, color:C.w80 }}>{em.subject}</div></div>
              <div style={{ ...gcDeep(), padding:"10px 12px" }}><div style={{ fontSize:10, color:C.w30, marginBottom:4 }}>BODY</div><div style={{ fontSize:12, color:C.w60, lineHeight:1.7, whiteSpace:"pre-wrap" }}>{em.body}</div></div>
              <div style={{ display:"flex", gap:8 }}>
                <Btn variant="ghost" size="sm" onClick={()=>onGenerate(coach)}>Regenerate</Btn>
                <Btn variant="tg" size="sm" full onClick={()=>onSend(coach)} disabled={isSending}>{isSending?"Sending...":"Send Email →"}</Btn>
              </div>
            </div>
          ) : (
            <Btn variant="primary" full onClick={()=>onGenerate(coach)} disabled={isGenerating}>{isGenerating?"Generating...":"Generate AI Email"}</Btn>
          )}
        </div>
      </div>
    </div>
  );
}

// ── PROFILE MODAL ─────────────────────────────────────────────────────────────
function ProfileModal({ user, videos, onClose, onSave, onLogout, onAddVideo, onRemoveVideo }) {
  const [ptab, setPtab] = useState("profile");
  const [form, setForm] = useState({ name:user.name||"", email:user.email||"", utr:user.utr||"", gradYear:user.gradYear||"", location:user.location||"", gpa:user.gpa||"", school:user.school||"", academy:user.academy||"", singlesRecord:user.singlesRecord||"", doublesRecord:user.doublesRecord||"", nationalRank:user.nationalRank||"", style:user.style||"" });
  const f = k => e => setForm(p=>({...p,[k]:e.target.value}));
  const plan = APP.pricing.plans[user.plan]||APP.pricing.plans.free;
  const [drag, setDrag] = useState(false); const [link, setLink] = useState(""); const ref = useRef();
  return (
    <div onClick={onClose} style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.7)", backdropFilter:"blur(16px)", WebkitBackdropFilter:"blur(16px)", zIndex:1000, display:"flex", alignItems:"center", justifyContent:"center", padding:"1rem", fontFamily:sans }}>
      <div onClick={e=>e.stopPropagation()} style={{ width:"100%", maxWidth:580, maxHeight:"92vh", overflowY:"auto", background:"rgba(7,9,13,0.88)", backdropFilter:"blur(40px) saturate(200%)", WebkitBackdropFilter:"blur(40px) saturate(200%)", border:"1px solid rgba(255,255,255,0.11)", borderRadius:22, boxShadow:"0 32px 80px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.08)" }}>
        <div style={{ padding:"1.5rem 1.75rem", borderBottom:"1px solid rgba(255,255,255,0.07)", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <div style={{ display:"flex", alignItems:"center", gap:12 }}>
            <Avatar name={form.name} size={46}/>
            <div>
              <div style={{ fontSize:15, fontWeight:700, color:C.w }}>{form.name||"Your profile"}</div>
              <div style={{ fontSize:12, color:C.w30, marginTop:2 }}>{form.email}</div>
              <span style={{ fontSize:11, background:"rgba(200,240,32,0.1)", border:"1px solid rgba(200,240,32,0.25)", borderRadius:6, padding:"3px 10px", color:C.tg, fontWeight:600, marginTop:6, display:"inline-block" }}>{plan.label} Plan</span>
            </div>
          </div>
          <button onClick={onClose} style={{ ...gcDeep(), width:32, height:32, display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", color:C.w50, fontSize:14, borderRadius:9, border:"1px solid rgba(255,255,255,0.1)" }}>✕</button>
        </div>
        <div style={{ display:"flex", gap:4, padding:"1rem 1.75rem", borderBottom:"1px solid rgba(255,255,255,0.06)" }}>
          {["profile","media","billing","security"].map(id=><button key={id} onClick={()=>setPtab(id)} style={{ background:ptab===id?"rgba(255,255,255,0.08)":"transparent", border:ptab===id?"1px solid rgba(255,255,255,0.15)":"1px solid transparent", borderRadius:8, padding:"7px 14px", fontSize:12, cursor:"pointer", color:ptab===id?C.w80:C.w40, fontFamily:sans, textTransform:"capitalize" }}>{id}</button>)}
        </div>
        <div style={{ padding:"1.5rem 1.75rem", display:"flex", flexDirection:"column", gap:14 }}>
          {ptab==="profile" && <>
            <div style={{ fontSize:10, color:C.w30, textTransform:"uppercase", letterSpacing:1, fontWeight:600 }}>Account</div>
            <div style={{ display:"flex", flexWrap:"wrap", gap:10 }}><Field label="Full name" value={form.name} onChange={f("name")} half/><Field label="Email" type="email" value={form.email} onChange={f("email")} half/></div>
            <div style={{ fontSize:10, color:C.w30, textTransform:"uppercase", letterSpacing:1, marginTop:4, fontWeight:600 }}>Athlete profile</div>
            <div style={{ display:"flex", flexWrap:"wrap", gap:10 }}>
              <Field label="UTR" value={form.utr} onChange={f("utr")} half/><Field label="Grad year" value={form.gradYear} onChange={f("gradYear")} half/>
              <Field label="Location" value={form.location} onChange={f("location")} half/><Field label="GPA" value={form.gpa} onChange={f("gpa")} half/>
              <Field label="Current school" value={form.school} onChange={f("school")} half/><Field label="Academy / Club" value={form.academy} onChange={f("academy")} half/>
              <Field label="Singles record" value={form.singlesRecord} onChange={f("singlesRecord")} half/><Field label="Doubles record" value={form.doublesRecord} onChange={f("doublesRecord")} half/>
            </div>
            <Field label="Playing style" value={form.style} onChange={f("style")} textarea/>
          </>}
          {ptab==="media" && <>
            <div style={{ fontSize:10, color:C.w30, textTransform:"uppercase", letterSpacing:1, fontWeight:600 }}>Highlight tapes & videos</div>
            <div onDragOver={e=>{e.preventDefault();setDrag(true);}} onDragLeave={()=>setDrag(false)} onDrop={e=>{e.preventDefault();setDrag(false);Array.from(e.dataTransfer.files).filter(f=>f.type.startsWith("video/")).forEach(f=>onAddVideo({type:"file",name:f.name,url:URL.createObjectURL(f),size:f.size,views:0}));}} onClick={()=>ref.current?.click()} style={{ ...gcSm(), padding:"28px 16px", textAlign:"center", cursor:"pointer", border:drag?"1px solid rgba(200,240,32,0.4)":"1px solid rgba(255,255,255,0.1)", transition:"all 0.2s" }}>
              <input ref={ref} type="file" accept="video/*" multiple style={{ display:"none" }} onChange={e=>Array.from(e.target.files).forEach(f=>onAddVideo({type:"file",name:f.name,url:URL.createObjectURL(f),size:f.size,views:0}))}/>
              <div style={{ fontSize:24, marginBottom:8 }}>🎬</div>
              <div style={{ fontSize:13, color:C.w60 }}>Drag & drop video files</div>
              <div style={{ fontSize:11, color:C.w30, marginTop:4 }}>or click to browse</div>
            </div>
            <div style={{ display:"flex", gap:8 }}>
              <input value={link} onChange={e=>setLink(e.target.value)} onKeyDown={e=>e.key==="Enter"&&link.trim()&&(onAddVideo({type:"link",name:link,url:link,views:0}),setLink(""))} placeholder="Paste Hudl, YouTube, or highlight link..." style={{ flex:1, ...gcDeep(), padding:"9px 12px", fontSize:12, color:C.w, outline:"none", fontFamily:sans }}/>
              <Btn variant="ghost" size="sm" onClick={()=>link.trim()&&(onAddVideo({type:"link",name:link,url:link,views:0}),setLink(""))}>Add</Btn>
            </div>
            {videos.map((v,i)=><div key={i} style={{ ...gcDeep(), display:"flex", alignItems:"center", gap:10, padding:"9px 12px" }}>
              <span style={{ fontSize:14 }}>{v.type==="file"?"📹":"🔗"}</span>
              <div style={{ flex:1, minWidth:0 }}><div style={{ fontSize:12, color:C.w80, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{v.name}</div></div>
              <span style={{ fontSize:11, color:C.w50, background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.09)", borderRadius:6, padding:"3px 8px" }}>👁 {v.views}</span>
              <button onClick={()=>onRemoveVideo(i)} style={{ background:"none", border:"none", color:C.w30, cursor:"pointer", fontSize:14 }}>✕</button>
            </div>)}
          </>}
          {ptab==="billing" && <>
            <div style={{ fontSize:10, color:C.w30, textTransform:"uppercase", letterSpacing:1, fontWeight:600 }}>Subscription</div>
            <div style={{ ...gcSm(), padding:18 }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14 }}>
                <div><div style={{ fontSize:16, fontWeight:700, color:C.w }}>{plan.label} Plan</div><div style={{ fontSize:12, color:C.w30, marginTop:2 }}>Active · renews monthly</div></div>
                <Btn variant="primary" size="sm">Upgrade</Btn>
              </div>
              {[["Emails used",`${user.emailsUsed||0}`],["Free included","5"],["Discount",`${plan.discount*100}%`],["Est. charges",`$${Math.max(0,((user.emailsUsed||0)-5)/150*50*(1-plan.discount)).toFixed(2)}`]].map(([l,v])=><div key={l} style={{ display:"flex", justifyContent:"space-between", padding:"7px 0", borderBottom:"1px solid rgba(255,255,255,0.05)" }}><span style={{ fontSize:12, color:C.w30 }}>{l}</span><span style={{ fontSize:12, color:C.w70, fontFamily:mono }}>{v}</span></div>)}
            </div>
          </>}
          {ptab==="security" && <>
            <div style={{ fontSize:10, color:C.w30, textTransform:"uppercase", letterSpacing:1, fontWeight:600 }}>Security</div>
            <Field label="Current password" type="password" value="" onChange={()=>{}} placeholder="••••••••"/>
            <Field label="New password" type="password" value="" onChange={()=>{}} placeholder="Min. 8 characters"/>
            <div style={{ borderTop:"1px solid rgba(255,255,255,0.06)", paddingTop:14, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
              <span style={{ fontSize:12, color:C.w30 }}>Danger zone</span>
              <Btn variant="danger" size="sm">Delete account</Btn>
            </div>
          </>}
          <div style={{ display:"flex", gap:8, marginTop:4 }}>
            <Btn variant="solid" full onClick={()=>{onSave(form);onClose();}}>Save changes</Btn>
            <Btn variant="ghost" onClick={()=>{onLogout();onClose();}}>Sign out ↩</Btn>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── AUTH PAGE ─────────────────────────────────────────────────────────────────
function AuthPage({ mode, onAuth, onSwitch }) {
  const [name,setName]=useState(""); const [email,setEmail]=useState(""); const [pass,setPass]=useState(""); const [loading,setLoading]=useState(false); const [err,setErr]=useState("");
  const handle = async () => {
    if(!email||!pass||(mode==="signup"&&!name)) return setErr("Please fill in all fields.");
    setLoading(true); setErr("");
    await new Promise(r=>setTimeout(r,700));
    onAuth({email,name:name||email.split("@")[0],plan:"free",emailsUsed:0,profileComplete:false});
    setLoading(false);
  };
  return (
    <div style={{ minHeight:"100vh", display:"flex", flexDirection:"column", fontFamily:sans, position:"relative" }}>
      <AnimBG/>
      <div style={{ position:"relative", zIndex:1, padding:"0 2rem", display:"flex", alignItems:"center", height:64 }}>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}><Logo size={24}/><span style={{ fontSize:15, fontWeight:700, color:C.w }}>{APP.name}</span></div>
      </div>
      <div style={{ position:"relative", zIndex:1, flex:1, display:"flex", alignItems:"center", justifyContent:"center", padding:"2rem" }}>
        <div style={{ width:"100%", maxWidth:420 }}>
          <div style={{ textAlign:"center", marginBottom:32 }}>
            <h2 style={{ fontSize:30, fontWeight:800, letterSpacing:"-1px", color:C.w, marginBottom:8 }}>{mode==="login"?"Welcome back":"Create account"}</h2>
            <p style={{ fontSize:13, color:C.w50 }}>{APP.tagline}</p>
          </div>
          <div style={{ ...gc(), padding:"2rem", borderRadius:20 }}>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:4, background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.09)", borderRadius:12, padding:4, marginBottom:24 }}>
              {["login","signup"].map(m=><button key={m} onClick={()=>onSwitch(m)} style={{ padding:"8px", borderRadius:9, border:"none", fontSize:13, fontWeight:600, cursor:"pointer", fontFamily:sans, transition:"all 0.2s", background:mode===m?"rgba(255,255,255,0.9)":"transparent", color:mode===m?"#07090d":C.w50 }}>{m==="login"?"Sign In":"Create Account"}</button>)}
            </div>
            <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
              {mode==="signup" && <Field label="Full name" value={name} onChange={e=>setName(e.target.value)} placeholder="Alex Johnson"/>}
              <Field label="Email" type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@email.com"/>
              <Field label="Password" type="password" value={pass} onChange={e=>setPass(e.target.value)} placeholder="••••••••"/>
              {err && <div style={{ fontSize:12, color:"rgba(239,68,68,0.9)", background:"rgba(239,68,68,0.08)", border:"1px solid rgba(239,68,68,0.18)", borderRadius:9, padding:"8px 12px" }}>{err}</div>}
              {mode==="login" && <div style={{ textAlign:"right" }}><span style={{ fontSize:12, color:C.w40, cursor:"pointer" }}>Forgot password?</span></div>}
              <Btn variant="solid" full onClick={handle} disabled={loading} style={{ padding:"13px", fontSize:14, borderRadius:12, marginTop:4 }}>{loading?"...":mode==="login"?"Sign In →":"Create Account →"}</Btn>
            </div>
          </div>
          <div style={{ display:"flex", justifyContent:"center", gap:20, marginTop:20 }}>
            {["1,820+ coaches","5 free emails","AI personalization"].map(t=><div key={t} style={{ fontSize:11, color:C.w30, display:"flex", alignItems:"center", gap:5 }}>✦ {t}</div>)}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── ONBOARDING ────────────────────────────────────────────────────────────────
function OnboardingPage({ user, onComplete }) {
  const [step,setStep]=useState(0);
  const [form,setForm]=useState({utr:"",gradYear:"",location:"",gpa:"",school:"",academy:"",singlesRecord:"",doublesRecord:"",nationalRank:"",style:"",targetDiv:"Any",region:"Any"});
  const f = k=>e=>setForm(p=>({...p,[k]:e.target.value}));
  const steps=[
    {title:"Tennis Stats",sub:"Key metrics coaches look at first"},
    {title:"School & Background",sub:"Where you're playing and training now"},
    {title:"Your Game",sub:"Help our AI write emails that sound like you"},
  ];
  const valid = form.utr&&form.gradYear&&form.school&&form.location;
  return (
    <div style={{ minHeight:"100vh", display:"flex", flexDirection:"column", fontFamily:sans, position:"relative" }}>
      <AnimBG/>
      <div style={{ position:"relative", zIndex:1, flex:1, display:"flex", alignItems:"center", justifyContent:"center", padding:"2rem" }}>
        <div style={{ width:"100%", maxWidth:540 }}>
          <div style={{ textAlign:"center", marginBottom:28 }}>
            <div style={{ display:"flex", justifyContent:"center", marginBottom:14 }}><Logo size={34}/></div>
            <div style={{ display:"flex", gap:6, justifyContent:"center", marginBottom:18 }}>
              {steps.map((_,i)=><div key={i} style={{ height:3, borderRadius:99, background:i<=step?"rgba(200,240,32,0.8)":"rgba(255,255,255,0.1)", transition:"all 0.3s", width:i===step?32:12 }}/>)}
            </div>
            <div style={{ fontSize:11, color:C.tg, textTransform:"uppercase", letterSpacing:1, marginBottom:6, fontWeight:700 }}>Step {step+1} of {steps.length}</div>
            <h2 style={{ fontSize:28, fontWeight:800, letterSpacing:"-1px", color:C.w, margin:"0 0 6px" }}>{steps[step].title}</h2>
            <p style={{ fontSize:13, color:C.w50, margin:0 }}>{steps[step].sub}</p>
          </div>
          <div style={{ ...gc(), padding:"2rem", borderRadius:20 }}>
            {step===0 && <div style={{ display:"flex", flexWrap:"wrap", gap:12, marginBottom:"1.5rem" }}>
              <Field label="UTR Rating *" value={form.utr} onChange={f("utr")} placeholder="e.g. 13.2" half/>
              <Field label="Graduation Year *" value={form.gradYear} onChange={f("gradYear")} placeholder="e.g. 2027" half/>
              <Field label="GPA" value={form.gpa} onChange={f("gpa")} placeholder="e.g. 3.8" half/>
              <Field label="National Ranking" value={form.nationalRank} onChange={f("nationalRank")} placeholder="e.g. 142" half/>
              <Field label="WTN Rating" value={form.wtn||""} onChange={f("wtn")} placeholder="e.g. 9.4" half/>
              <Field label="Gender" value={form.gender||""} onChange={f("gender")} select half>
                <option value="">Select...</option><option>Male</option><option>Female</option>
              </Field>
            </div>}
            {step===1 && <div style={{ display:"flex", flexWrap:"wrap", gap:12, marginBottom:"1.5rem" }}>
              <Field label="Current School *" value={form.school} onChange={f("school")} placeholder="High school name" half/>
              <Field label="Academy / Club" value={form.academy} onChange={f("academy")} placeholder="e.g. USTA Florida" half/>
              <Field label="City / State *" value={form.location} onChange={f("location")} placeholder="e.g. Miami, FL" half/>
              <Field label="Singles Record" value={form.singlesRecord} onChange={f("singlesRecord")} placeholder="e.g. 24-6" half/>
              <Field label="Doubles Record" value={form.doublesRecord} onChange={f("doublesRecord")} placeholder="e.g. 18-9" half/>
            </div>}
            {step===2 && <div style={{ display:"flex", flexDirection:"column", gap:12, marginBottom:"1.5rem" }}>
              <Field label="Describe Your Game — Style, Strengths, Surface, Goals" value={form.style} onChange={f("style")} textarea placeholder="e.g. Aggressive baseliner, strong forehand, best on hard courts. Looking for D1 programs with strong academics..."/>
              <div style={{ display:"flex", gap:12 }}>
                <Field label="Target Division" value={form.targetDiv} onChange={f("targetDiv")} select half>
                  {["Any","NCAA D1","NCAA D2","NCAA D3","NAIA","JUCO"].map(d=><option key={d}>{d}</option>)}
                </Field>
                <Field label="Preferred Region" value={form.region} onChange={f("region")} select half>
                  {["Any","Northeast","Southeast","Midwest","Southwest","West Coast"].map(r=><option key={r}>{r}</option>)}
                </Field>
              </div>
            </div>}
            <div style={{ display:"flex", gap:8 }}>
              {step>0 && <Btn variant="ghost" onClick={()=>setStep(s=>s-1)}>← Back</Btn>}
              {step<steps.length-1
                ? <Btn variant="solid" full onClick={()=>setStep(s=>s+1)} style={{ padding:"13px", fontSize:14 }}>Continue →</Btn>
                : <Btn variant={valid?"tg":"ghost"} full onClick={()=>onComplete(form)} disabled={!valid} style={{ padding:"13px", fontSize:14 }}>{valid?"Launch My Dashboard →":"Fill required fields *"}</Btn>}
            </div>
          </div>
          <div style={{ textAlign:"center", marginTop:14, fontSize:11, color:C.w20 }}>5 free emails · no credit card required</div>
        </div>
      </div>
    </div>
  );
}

// ── PAYWALL ───────────────────────────────────────────────────────────────────
function PaywallPage({ user, onUnlock }) {
  const [sel,setSel]=useState("pro"); const [loading,setLoading]=useState(false);
  const plans=[
    {id:"free",name:"Free",price:"$0",desc:"Try for free",features:["5 free emails","Coach browser","Basic filters","AI generator"]},
    {id:"pro",name:"Pro ✦",price:"$59",desc:"Most popular",popular:true,features:["Unlimited emails","20% discount","AI advisor","Full analytics","Follow-up automation"]},
    {id:"elite",name:"Elite",price:"$99",desc:"Full concierge",features:["Everything in Pro","35% discount","Done-for-you","Strategy call","Scholarship scoring"]},
  ];
  return (
    <div style={{ minHeight:"100vh", display:"flex", flexDirection:"column", fontFamily:sans, position:"relative" }}>
      <AnimBG/>
      <div style={{ position:"relative", zIndex:1, flex:1, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:"3rem 2rem" }}>
        <div style={{ display:"flex", justifyContent:"center", marginBottom:14 }}><Logo size={36}/></div>
        <div style={{ fontSize:11, color:C.w30, textTransform:"uppercase", letterSpacing:1.5, marginBottom:14 }}>You've used your 5 free emails</div>
        <h2 style={{ fontSize:"clamp(28px,5vw,48px)", fontWeight:800, letterSpacing:"-2px", color:C.w, marginBottom:8, textAlign:"center" }}>Choose Your Plan</h2>
        <p style={{ fontSize:14, color:C.w50, marginBottom:36, textAlign:"center" }}>Upgrade to keep reaching coaches.</p>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:12, maxWidth:740, width:"100%" }}>
          {plans.map(p=>(
            <div key={p.id} onClick={()=>setSel(p.id)} style={{ ...gc(), padding:"24px 20px", cursor:"pointer", borderColor:sel===p.id?"rgba(200,240,32,0.4)":"rgba(255,255,255,0.11)", transition:"all 0.2s", borderRadius:18 }}>
              {p.popular && <div style={{ position:"absolute", top:-10, left:"50%", transform:"translateX(-50%)", background:"rgba(200,240,32,0.12)", border:"1px solid rgba(200,240,32,0.3)", borderRadius:99, padding:"2px 12px", fontSize:9, fontWeight:700, color:C.tg, whiteSpace:"nowrap", letterSpacing:1 }}>RECRUITERS' CHOICE</div>}
              <div style={{ fontSize:11, color:p.popular?C.tg:C.w50, marginBottom:3, textTransform:"uppercase", letterSpacing:0.8, fontWeight:600 }}>{p.name}</div>
              <div style={{ fontSize:10, color:C.w30, marginBottom:14 }}>{p.desc}</div>
              <div style={{ fontSize:36, fontWeight:800, color:p.popular?C.tg:C.w, fontFamily:mono, letterSpacing:"-1.5px", marginBottom:18 }}>{p.price}<span style={{ fontSize:12, fontWeight:400, color:C.w30 }}>/mo</span></div>
              {p.features.map(ft=><div key={ft} style={{ display:"flex", gap:7, marginBottom:6 }}><span style={{ fontSize:11, color:p.popular?C.tg:C.w30 }}>✓</span><span style={{ fontSize:12, color:C.w60 }}>{ft}</span></div>)}
            </div>
          ))}
        </div>
        <div style={{ marginTop:28 }}>
          <Btn variant="solid" size="lg" onClick={async()=>{ setLoading(true); await new Promise(r=>setTimeout(r,800)); onUnlock(sel); setLoading(false); }} disabled={loading} style={{ padding:"14px 40px", fontSize:15, borderRadius:14 }}>{loading?"Processing...":`Continue with ${plans.find(p=>p.id===sel)?.name} →`}</Btn>
        </div>
        <div style={{ marginTop:12, fontSize:11, color:C.w20 }}>No credit card required · Cancel anytime</div>
      </div>
    </div>
  );
}

// ── HOME PAGE ─────────────────────────────────────────────────────────────────
function HomePage({ onEnter, onLogin }) {
  const [hov, setHov] = useState(null);
  const features = [
    {icon:"◎",title:"1,820+ Coaches",sub:"Every NCAA D1, D2, D3, NAIA & JUCO program in one database"},
    {icon:"✦",title:"AI Email Generator",sub:"Fully personalized emails for every coach, written in seconds"},
    {icon:"◈",title:"AI Advisor",sub:"Ask anything — best-fit schools, strategy, timing, roster needs"},
    {icon:"⊞",title:"Live Analytics",sub:"Track opens, tape views, replies, and response rates in real time"},
    {icon:"🎬",title:"Video Tracking",sub:"Know exactly when and how many times a coach watched your tape"},
    {icon:"◉",title:"Smart Filters",sub:"Filter by division, UTR, WTN, region, and reply status instantly"},
  ];
  const stats=[{n:"1,820+",l:"College coaches"},{n:"5",l:"Free emails to start"},{n:"AI",l:"Powered outreach"},{n:"100%",l:"Automated follow-ups"}];
  return (
    <div style={{ minHeight:"100vh", color:C.w, fontFamily:sans, position:"relative", overflowX:"hidden" }}>
      <AnimBG/>
      <div style={{ position:"relative", zIndex:10, maxWidth:1100, margin:"0 auto", padding:"0 2rem", display:"flex", alignItems:"center", justifyContent:"space-between", height:66 }}>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}><Logo size={26}/><span style={{ fontSize:17, fontWeight:800, color:C.w, letterSpacing:"-0.5px" }}>{APP.name}</span></div>
        <div style={{ display:"flex", gap:8 }}>
          <Btn variant="ghost" size="sm" onClick={onLogin}>Sign in</Btn>
          <Btn variant="solid" size="sm" onClick={onEnter}>Get started</Btn>
        </div>
      </div>
      <div style={{ position:"relative", zIndex:1, height:1, background:"rgba(255,255,255,0.07)" }}/>
      <div style={{ position:"relative", zIndex:1, maxWidth:1100, margin:"0 auto", padding:"110px 2rem 90px", textAlign:"center" }}>
        <div style={{ display:"inline-block", ...gcSm(), padding:"5px 18px", fontSize:11, color:C.w50, marginBottom:28, letterSpacing:1, textTransform:"uppercase", borderRadius:99 }}>College Tennis Recruiting Platform</div>
        <h1 style={{ fontSize:"clamp(42px,7vw,82px)", fontWeight:800, letterSpacing:"-3px", lineHeight:1.05, margin:"0 0 24px", color:C.w }}>Your All-in-One<br/><span style={{ color:C.w30 }}>Recruiting Companion</span></h1>
        <p style={{ fontSize:17, color:C.w50, maxWidth:520, margin:"0 auto 40px", lineHeight:1.65 }}>Reach every college tennis coach in the country with AI-personalized emails — automatically.</p>
        <div style={{ display:"flex", gap:12, justifyContent:"center", flexWrap:"wrap" }}>
          <Btn variant="solid" size="lg" onClick={onEnter} style={{ padding:"15px 32px", fontSize:15, borderRadius:14 }}>Get Started Now</Btn>
          <Btn variant="primary" size="lg" onClick={onLogin} style={{ padding:"15px 32px", fontSize:15, borderRadius:14 }}>Sign in →</Btn>
        </div>
        <div style={{ ...gc(), marginTop:64, padding:"24px", textAlign:"left", maxWidth:860, margin:"64px auto 0", borderRadius:20 }}>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr 1fr", gap:10, marginBottom:14 }}>
            {[["Total Coaches","1,820"],["Emails Sent","0"],["Open Rate","0%"],["Replies","0"]].map(([l,v])=>(
              <div key={l} style={{ ...gcDeep(), padding:"14px 16px", textAlign:"center", borderRadius:12 }}>
                <div style={{ fontSize:10, color:C.w30, marginBottom:6, textTransform:"uppercase", letterSpacing:0.8 }}>{l}</div>
                <div style={{ fontSize:22, fontWeight:800, color:C.w, fontFamily:mono }}>{v}</div>
              </div>
            ))}
          </div>
          <div style={{ ...gcDeep(), padding:"13px 16px", display:"flex", alignItems:"center", justifyContent:"space-between", borderRadius:12 }}>
            <span style={{ fontSize:12, color:C.w50 }}>Ready to send your first recruiting email?</span>
            <Btn variant="solid" size="sm" onClick={onEnter}>Start free →</Btn>
          </div>
        </div>
      </div>
      <div style={{ position:"relative", zIndex:1, borderTop:"1px solid rgba(255,255,255,0.06)", borderBottom:"1px solid rgba(255,255,255,0.06)" }}>
        <div style={{ maxWidth:1100, margin:"0 auto", display:"grid", gridTemplateColumns:"repeat(4,1fr)" }}>
          {stats.map((s,i)=>(
            <div key={i} style={{ padding:"28px 0", textAlign:"center", borderRight:i<stats.length-1?"1px solid rgba(255,255,255,0.06)":"none" }}>
              <div style={{ fontSize:32, fontWeight:800, color:C.w, fontFamily:mono, letterSpacing:"-1px" }}>{s.n}</div>
              <div style={{ fontSize:12, color:C.w40, marginTop:4 }}>{s.l}</div>
            </div>
          ))}
        </div>
      </div>
      <div style={{ position:"relative", zIndex:1, maxWidth:1100, margin:"0 auto", padding:"80px 2rem" }}>
        <div style={{ textAlign:"center", marginBottom:56 }}>
          <h2 style={{ fontSize:"clamp(28px,4vw,48px)", fontWeight:800, letterSpacing:"-2px", margin:"0 0 14px" }}>Features & Benefits</h2>
          <p style={{ fontSize:15, color:C.w50, maxWidth:480, margin:"0 auto" }}>Everything you need to run a world-class recruiting campaign.</p>
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:14 }}>
          {features.map((ft,i)=>(
            <div key={i} onMouseEnter={()=>setHov(i)} onMouseLeave={()=>setHov(null)} style={{ ...gc(), padding:"28px 24px", transition:"all 0.25s", borderColor:hov===i?"rgba(200,240,32,0.25)":"rgba(255,255,255,0.11)", transform:hov===i?"translateY(-2px)":"none", borderRadius:18 }}>
              <div style={{ fontSize:26, marginBottom:14 }}>{ft.icon}</div>
              <div style={{ fontSize:16, fontWeight:700, color:C.w, marginBottom:8 }}>{ft.title}</div>
              <div style={{ fontSize:13, color:C.w50, lineHeight:1.6 }}>{ft.sub}</div>
            </div>
          ))}
        </div>
      </div>
      <div style={{ position:"relative", zIndex:1, borderTop:"1px solid rgba(255,255,255,0.06)" }}>
        <div style={{ maxWidth:1100, margin:"0 auto", padding:"80px 2rem" }}>
          <div style={{ textAlign:"center", marginBottom:52 }}>
            <h2 style={{ fontSize:"clamp(28px,4vw,48px)", fontWeight:800, letterSpacing:"-2px", margin:"0 0 14px" }}>Choose Your Plan</h2>
            <p style={{ fontSize:15, color:C.w50, maxWidth:400, margin:"0 auto" }}>Start free, upgrade when you're ready.</p>
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:14, maxWidth:820, margin:"0 auto" }}>
            {[{n:"Free",p:"$0",d:"Try for free",f:["5 free emails","Coach browser","Basic filters","AI generator"],b:"Get started free"},{n:"Pro ✦",p:"$59",d:"Most popular",pop:true,f:["Unlimited emails","20% discount","AI advisor","Full analytics","Follow-ups"],b:"Get Pro Access"},{n:"Elite",p:"$99",d:"Full concierge",f:["Everything in Pro","35% discount","Done-for-you","Strategy call","Scholarship scoring"],b:"Get Elite Access"}].map((p,i)=>(
              <div key={i} style={{ ...gc(), padding:"28px 22px", position:"relative", borderColor:p.pop?"rgba(200,240,32,0.32)":"rgba(255,255,255,0.11)", borderRadius:18 }}>
                {p.pop && <div style={{ position:"absolute", top:-11, left:"50%", transform:"translateX(-50%)", background:"rgba(200,240,32,0.1)", border:"1px solid rgba(200,240,32,0.28)", borderRadius:99, padding:"3px 13px", fontSize:9, fontWeight:700, color:C.tg, whiteSpace:"nowrap", letterSpacing:1 }}>RECRUITERS' CHOICE</div>}
                <div style={{ fontSize:12, color:p.pop?C.tg:C.w50, marginBottom:3, textTransform:"uppercase", letterSpacing:0.6, fontWeight:600 }}>{p.n}</div>
                <div style={{ fontSize:10, color:C.w30, marginBottom:14 }}>{p.d}</div>
                <div style={{ fontSize:38, fontWeight:800, color:p.pop?C.tg:C.w, fontFamily:mono, letterSpacing:"-2px", marginBottom:20 }}>{p.p}<span style={{ fontSize:12, color:C.w30 }}>/mo</span></div>
                <div style={{ display:"flex", flexDirection:"column", gap:8, marginBottom:22 }}>{p.f.map(ft=><div key={ft} style={{ display:"flex", gap:8 }}><span style={{ fontSize:11, color:p.pop?C.tg:C.w30 }}>✓</span><span style={{ fontSize:12, color:C.w60 }}>{ft}</span></div>)}</div>
                <Btn variant={p.pop?"solid":"primary"} full onClick={onEnter} style={{ borderRadius:11 }}>{p.b}</Btn>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div style={{ position:"relative", zIndex:1, borderTop:"1px solid rgba(255,255,255,0.06)" }}>
        <div style={{ maxWidth:1100, margin:"0 auto", padding:"80px 2rem", textAlign:"center" }}>
          <h2 style={{ fontSize:"clamp(28px,5vw,60px)", fontWeight:800, letterSpacing:"-2px", margin:"0 0 20px", lineHeight:1.1 }}>Your All-in-One<br/><span style={{ color:C.w30 }}>Recruiting Companion</span></h2>
          <p style={{ fontSize:15, color:C.w50, maxWidth:400, margin:"0 auto 36px", lineHeight:1.65 }}>Stop sending emails one by one. Let 10IQ reach every coach — automatically.</p>
          <Btn variant="solid" size="lg" onClick={onEnter} style={{ padding:"15px 36px", fontSize:15, borderRadius:14 }}>Get Started Now</Btn>
        </div>
      </div>
      <div style={{ position:"relative", zIndex:1, borderTop:"1px solid rgba(255,255,255,0.06)", padding:"22px 2rem", textAlign:"center" }}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:8, marginBottom:6 }}><Logo size={16}/><span style={{ fontSize:13, fontWeight:700 }}>{APP.name}</span></div>
        <div style={{ fontSize:11, color:C.w20 }}>© 2026 {APP.name}. College tennis recruiting, automated.</div>
      </div>
    </div>
  );
}

// ── SCHOOLS TAB ───────────────────────────────────────────────────────────────
function SchoolsTab({ coaches }) {
  const [search,setSearch]=useState("");
  const [divFilter,setDivFilter]=useState("All");
  const [selected,setSelected]=useState(null);

  const schools = Object.values(
    coaches.reduce((acc,c)=>{
      const key=c.school_name;
      if(!acc[key]) acc[key]={ school:key, division:c.division, team_utr:c.team_utr, team_wtn:c.team_wtn, coaches:[] };
      acc[key].coaches.push(c);
      return acc;
    },{})
  );

  const divs=["All",...Array.from(new Set(schools.map(s=>s.division).filter(Boolean))).sort()];
  const filtered=schools.filter(s=>{
    const matchDiv=divFilter==="All"||s.division===divFilter;
    const matchSearch=!search||(s.school+s.division).toLowerCase().includes(search.toLowerCase());
    return matchDiv&&matchSearch;
  });

  if(selected) return <SchoolDetail school={selected} onBack={()=>setSelected(null)}/>;

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
      <div style={{ display:"flex", gap:8, alignItems:"center" }}>
        <div style={{ flex:1, position:"relative" }}>
          <span style={{ position:"absolute", left:12, top:"50%", transform:"translateY(-50%)", color:C.w30, fontSize:15 }}>⌕</span>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder={`Search ${schools.length} schools...`} style={{ ...gcDeep(), width:"100%", padding:"10px 14px 10px 36px", fontSize:13, color:C.w, outline:"none", fontFamily:sans, border:"1px solid rgba(255,255,255,0.1)" }}/>
        </div>
      </div>
      <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
        {divs.map(d=><button key={d} onClick={()=>setDivFilter(d)} style={{ padding:"5px 14px", fontSize:11, borderRadius:99, cursor:"pointer", border:`1px solid ${divFilter===d?"rgba(200,240,32,0.35)":"rgba(255,255,255,0.09)"}`, background:divFilter===d?"rgba(200,240,32,0.09)":"rgba(255,255,255,0.03)", color:divFilter===d?C.tg:C.w40, fontFamily:sans, transition:"all 0.14s" }}>{d}</button>)}
      </div>
      <div style={{ fontSize:12, color:C.w30, fontFamily:mono }}>{filtered.length} schools</div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))", gap:10 }}>
        {filtered.map(s=>(
          <div key={s.school} onClick={()=>setSelected(s)} style={{ ...gcSm(), padding:"16px", cursor:"pointer", transition:"all 0.18s", borderRadius:16 }} onMouseEnter={e=>{e.currentTarget.style.borderColor="rgba(200,240,32,0.3)";e.currentTarget.style.transform="translateY(-2px)";}} onMouseLeave={e=>{e.currentTarget.style.borderColor="rgba(255,255,255,0.11)";e.currentTarget.style.transform="";}}>
            <div style={{ fontSize:13, fontWeight:700, color:C.w, marginBottom:4, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{s.school}</div>
            <div style={{ fontSize:11, color:C.w50, marginBottom:7, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{s.coaches[0]?.coach_name||"—"}</div>
            <div style={{ fontSize:10, color:dC(s.division), marginBottom:8 }}>{s.division}</div>
            <div style={{ display:"flex", gap:5, flexWrap:"wrap" }}>
              {s.team_utr&&<span style={{ fontSize:9, color:C.w30, background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.08)", borderRadius:5, padding:"2px 7px", fontFamily:mono }}>UTR {Number(s.team_utr).toFixed(1)}</span>}
              {s.team_wtn&&<span style={{ fontSize:9, color:C.w30, background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.08)", borderRadius:5, padding:"2px 7px", fontFamily:mono }}>WTN {Number(s.team_wtn).toFixed(1)}</span>}
              <span style={{ fontSize:9, color:C.w30, background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.08)", borderRadius:5, padding:"2px 7px" }}>{s.coaches.length} coach{s.coaches.length!==1?"es":""}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SchoolDetail({ school, onBack }) {
  const ini=school.school.split(" ").map(w=>w[0]).join("").slice(0,2).toUpperCase();
  const sent=school.coaches.filter(c=>c.email_sent).length;
  const replied=school.coaches.filter(c=>c.replied).length;
  const utr=school.team_utr?Number(school.team_utr).toFixed(1):"—";
  const wtn=school.team_wtn?Number(school.team_wtn).toFixed(1):"—";
  const row=(l,v)=><div style={{ display:"flex", justifyContent:"space-between", padding:"9px 0", borderBottom:"1px solid rgba(255,255,255,0.05)", fontSize:12 }}><span style={{ color:C.w50 }}>{l}</span><span style={{ color:C.w, fontWeight:500 }}>{v}</span></div>;
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
      <div onClick={onBack} style={{ display:"inline-flex", alignItems:"center", gap:6, fontSize:12, color:C.w50, cursor:"pointer", marginBottom:4, transition:"color 0.14s" }} onMouseEnter={e=>e.currentTarget.style.color=C.tg} onMouseLeave={e=>e.currentTarget.style.color=C.w50}>← Back to schools</div>
      <div style={{ ...gc(), padding:"20px 22px", display:"flex", alignItems:"center", gap:16, borderRadius:18 }}>
        <div style={{ width:52, height:52, borderRadius:14, background:"rgba(200,240,32,0.09)", border:"1px solid rgba(200,240,32,0.2)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:18, fontWeight:800, color:C.tg, fontFamily:mono, flexShrink:0 }}>{ini}</div>
        <div style={{ flex:1 }}>
          <div style={{ fontSize:20, fontWeight:800, color:C.w, letterSpacing:"-0.5px" }}>{school.school}</div>
          <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginTop:8 }}>
            <span style={{ fontSize:10, padding:"3px 10px", borderRadius:99, border:`1px solid ${dC(school.division).replace("0.9","0.3")}`, color:dC(school.division), background:dC(school.division).replace("0.9","0.08") }}>{school.division}</span>
            {utr!=="—"&&<span style={{ fontSize:10, padding:"3px 10px", borderRadius:99, border:"1px solid rgba(255,255,255,0.1)", color:C.w50, background:"rgba(255,255,255,0.04)" }}>UTR {utr}</span>}
            {wtn!=="—"&&<span style={{ fontSize:10, padding:"3px 10px", borderRadius:99, border:"1px solid rgba(255,255,255,0.1)", color:C.w50, background:"rgba(255,255,255,0.04)" }}>WTN {wtn}</span>}
            <span style={{ fontSize:10, padding:"3px 10px", borderRadius:99, border:"1px solid rgba(255,255,255,0.1)", color:C.w50, background:"rgba(255,255,255,0.04)" }}>{school.coaches.length} coach{school.coaches.length!==1?"es":""}</span>
          </div>
        </div>
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:10 }}>
        {[["Team UTR",utr],["Team WTN",wtn],["Emails Sent",sent],["Replied",replied]].map(([l,v])=>(
          <div key={l} style={{ ...gcSm(), padding:"16px", textAlign:"center", borderRadius:14 }}>
            <div style={{ fontSize:9, color:C.w30, textTransform:"uppercase", letterSpacing:.9, marginBottom:6, fontWeight:600 }}>{l}</div>
            <div style={{ fontSize:22, fontWeight:800, color:C.w, fontFamily:mono, letterSpacing:"-1px" }}>{v}</div>
          </div>
        ))}
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
        <div style={{ ...gcSm(), padding:"18px", borderRadius:16 }}>
          <div style={{ fontSize:10, color:C.w30, textTransform:"uppercase", letterSpacing:1, marginBottom:14, fontWeight:600 }}>Program details</div>
          {row("Division",school.division||"—")}
          {row("Team UTR",utr)}
          {row("Team WTN",wtn)}
          {row("Total coaches",school.coaches.length)}
          {row("Emails sent",sent)}
          {row("Replied",replied)}
        </div>
        <div style={{ ...gcSm(), padding:"18px", borderRadius:16 }}>
          <div style={{ fontSize:10, color:C.w30, textTransform:"uppercase", letterSpacing:1, marginBottom:14, fontWeight:600 }}>Outreach metrics</div>
          {[["Emails sent",sent,school.coaches.length],["Opened",school.coaches.filter(c=>c.email_opened).length,school.coaches.length],["Replied",replied,school.coaches.length]].map(([l,v,t])=>(
            <div key={l} style={{ marginBottom:14 }}>
              <div style={{ display:"flex", justifyContent:"space-between", marginBottom:5 }}><span style={{ fontSize:12, color:C.w50 }}>{l}</span><span style={{ fontSize:12, color:C.w, fontFamily:mono }}>{v}/{t}</span></div>
              <GlassBar pct={t>0?(v/t)*100:0}/>
            </div>
          ))}
        </div>
      </div>
      <div style={{ ...gcSm(), padding:0, overflow:"hidden", borderRadius:16 }}>
        <div style={{ padding:"14px 18px", borderBottom:"1px solid rgba(255,255,255,0.06)", fontSize:10, color:C.w30, textTransform:"uppercase", letterSpacing:1, fontWeight:600 }}>All coaches at this school</div>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr 90px 80px", padding:"8px 16px", background:"rgba(255,255,255,0.02)", borderBottom:"1px solid rgba(255,255,255,0.05)" }}>
          {["Coach","Email","Role","Status","Replied"].map(h=><div key={h} style={{ fontSize:9, color:C.w20, textTransform:"uppercase", letterSpacing:.7 }}>{h}</div>)}
        </div>
        {school.coaches.map((c,i)=>(
          <div key={i} style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr 90px 80px", padding:"11px 16px", borderBottom:i<school.coaches.length-1?"1px solid rgba(255,255,255,0.04)":"none", alignItems:"center", fontSize:12 }}>
            <div style={{ color:C.w80, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", paddingRight:8 }}>{c.coach_name||"—"}</div>
            <div style={{ color:C.w40, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", paddingRight:8, fontSize:11 }}>{c.email||"—"}</div>
            <div style={{ color:C.w40, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", paddingRight:8, fontSize:11 }}>{c.notes||"—"}</div>
            <span style={{ fontSize:9, padding:"2px 9px", borderRadius:99, background:c.replied?"rgba(200,240,32,0.1)":c.email_sent?"rgba(255,255,255,0.06)":"rgba(255,255,255,0.02)", border:`1px solid ${c.replied?"rgba(200,240,32,0.28)":c.email_sent?"rgba(255,255,255,0.14)":"rgba(255,255,255,0.07)"}`, color:c.replied?C.tg:c.email_sent?C.w60:C.w30, display:"inline-block" }}>{c.replied?"Replied":c.email_sent?"Sent":"Pending"}</span>
            <span style={{ fontSize:11, color:c.replied?C.tg:C.w20, fontFamily:mono }}>{c.replied?"Yes":"—"}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── MAIN APP ──────────────────────────────────────────────────────────────────
const PAGE=40;

function MainApp({ user, onUpdateUser, onLogout, onNeedUpgrade, onHome }) {
  const [tab,setTab]=useState(0);
  const [coaches,setCoaches]=useState([]); const [filtered,setFiltered]=useState([]);
  const [loading,setLoading]=useState(true); const [loadErr,setLoadErr]=useState("");
  const [page,setPage]=useState(0); const [selected,setSelected]=useState([]);
  const [genEmails,setGenEmails]=useState({}); const [generating,setGenerating]=useState(null); const [sending,setSending]=useState({});
  const [selCoach,setSelCoach]=useState(null); const [showProfile,setShowProfile]=useState(false);
  const [videos,setVideos]=useState([]);
  const [aiChat,setAiChat]=useState([]); const [aiInput,setAiInput]=useState(""); const [aiLoading,setAiLoading]=useState(false);
  const chatRef=useRef(null);
  const [search,setSearch]=useState(""); const [fDiv,setFDiv]=useState("All"); const [fUtrMin,setFUtrMin]=useState(""); const [fUtrMax,setFUtrMax]=useState(""); const [fWtnMin,setFWtnMin]=useState(""); const [fWtnMax,setFWtnMax]=useState(""); const [fRegion,setFRegion]=useState(""); const [fEmail,setFEmail]=useState("All"); const [fReply,setFReply]=useState("All"); const [filtersOpen,setFiltersOpen]=useState(false);

  useEffect(()=>{loadCoaches();},[]);
  useEffect(()=>{
    let f=coaches;
    if(search) f=f.filter(c=>`${c.school_name}${c.coach_name}${c.email}${c.division}`.toLowerCase().includes(search.toLowerCase()));
    if(fDiv!=="All") f=f.filter(c=>c.division===fDiv);
    if(fUtrMin) f=f.filter(c=>c.team_utr&&+c.team_utr>=+fUtrMin);
    if(fUtrMax) f=f.filter(c=>c.team_utr&&+c.team_utr<=+fUtrMax);
    if(fWtnMin) f=f.filter(c=>c.team_wtn&&+c.team_wtn>=+fWtnMin);
    if(fWtnMax) f=f.filter(c=>c.team_wtn&&+c.team_wtn<=+fWtnMax);
    if(fRegion) f=f.filter(c=>(c.school_name||"").toLowerCase().includes(fRegion.toLowerCase()));
    if(fEmail==="Sent") f=f.filter(c=>c.email_sent);
    if(fEmail==="Not sent") f=f.filter(c=>!c.email_sent);
    if(fReply==="Replied") f=f.filter(c=>c.replied);
    if(fReply==="No reply") f=f.filter(c=>c.email_sent&&!c.replied);
    setFiltered(f); setPage(0);
  },[search,fDiv,fUtrMin,fUtrMax,fWtnMin,fWtnMax,fRegion,fEmail,fReply,coaches]);
  useEffect(()=>{ if(chatRef.current) chatRef.current.scrollTop=chatRef.current.scrollHeight; },[aiChat]);

  const loadCoaches=async()=>{
    setLoading(true); setLoadErr("");
    try {
      let all=[],from=0;
      while(true){
        const r=await fetch(`${SUPABASE_URL}/rest/v1/coaches_database?select=*&order=school_name.asc&limit=1000&offset=${from}`,{headers:{apikey:SUPABASE_KEY,Authorization:`Bearer ${SUPABASE_KEY}`,"Content-Type":"application/json",Accept:"application/json"}});
        if(!r.ok){ setLoadErr(`DB error ${r.status}`); break; }
        const chunk=await r.json(); all=[...all,...chunk];
        if(chunk.length<1000) break; from+=1000;
      }
      setCoaches(all); setFiltered(all);
    } catch(e){ setLoadErr(e.message); }
    setLoading(false);
  };

  const stats={total:coaches.length,sent:coaches.filter(c=>c.email_sent).length,opened:coaches.filter(c=>c.email_opened).length,replied:coaches.filter(c=>c.replied).length};
  const divs=["All",...Array.from(new Set(coaches.map(c=>c.division).filter(Boolean))).sort()];
  const paged=filtered.slice(page*PAGE,(page+1)*PAGE);
  const totalPages=Math.ceil(filtered.length/PAGE);
  const toggleSel=c=>setSelected(p=>p.find(x=>x.email===c.email)?p.filter(x=>x.email!==c.email):[...p,c]);
  const hasFilters=search||fDiv!=="All"||fUtrMin||fUtrMax||fWtnMin||fWtnMax||fRegion||fEmail!=="All"||fReply!=="All";
  const clearFilters=()=>{setSearch("");setFDiv("All");setFUtrMin("");setFUtrMax("");setFWtnMin("");setFWtnMax("");setFRegion("");setFEmail("All");setFReply("All");};
  const canSend=()=>{ const p=APP.pricing.plans[user.plan]||APP.pricing.plans.free; return p.emailLimit===null||(user.emailsUsed||0)<p.emailLimit; };

  const generateEmail=async coach=>{
    setGenerating(coach.email);
    try {
      const txt=await callClaude([{role:"user",content:`Recruiting email.\nATHLETE: ${JSON.stringify({...user,videos:videos.map(v=>v.url).join(", ")})}\nCOACH: ${coach.coach_name}, ${coach.school_name}, ${coach.division}, UTR:${coach.team_utr||"N/A"}\n150-200 words, confident, specific.`}],`Expert tennis recruiting email writer. Output JSON only: {"subject":"...","body":"..."}`);
      setGenEmails(p=>({...p,[coach.email]:JSON.parse(txt.replace(/```json|```/g,"").trim())}));
    } catch(e){ alert("Failed: "+e.message); }
    setGenerating(null);
  };
  const sendEmail=async coach=>{
    if(!canSend()) return onNeedUpgrade();
    const em=genEmails[coach.email]; if(!em) return;
    setSending(p=>({...p,[coach.email]:true}));
    try {
      await fetch("/api/send-email",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({to:coach.email,subject:em.subject,text:em.body})});
      await sb(`coaches_database?email=eq.${encodeURIComponent(coach.email)}`,{method:"PATCH",body:JSON.stringify({email_sent:true,email_sent_at:new Date().toISOString(),email_subject:em.subject,email_body:em.body})});
      setCoaches(p=>p.map(c=>c.email===coach.email?{...c,email_sent:true}:c));
      const n=(user.emailsUsed||0)+1; onUpdateUser({emailsUsed:n});
      if(n>=5&&user.plan==="free") onNeedUpgrade();
    } catch(e){ alert("Failed: "+e.message); }
    setSending(p=>({...p,[coach.email]:false}));
  };
  const sendAi=async()=>{
    if(!aiInput.trim()||aiLoading) return;
    const msg=aiInput.trim(); setAiInput(""); const next=[...aiChat,{role:"user",content:msg}]; setAiChat(next); setAiLoading(true);
    try { const r=await callClaude(next,`Elite tennis recruiting advisor. ${coaches.length} coaches loaded. Athlete: ${JSON.stringify(user)}. Be specific and helpful.`); setAiChat(p=>[...p,{role:"assistant",content:r}]); }
    catch(e){ setAiChat(p=>[...p,{role:"assistant",content:"Sorry, I encountered an error. Please try again."}]); }
    setAiLoading(false);
  };

  const page_content = { maxWidth:960, margin:"0 auto", padding:"22px 24px" };
  const selInp = { ...gcDeep(), padding:"8px 10px", fontSize:12, color:C.w, outline:"none", fontFamily:sans, border:"1px solid rgba(255,255,255,0.09)" };
  const gInp = { ...gcDeep(), padding:"10px 13px", fontSize:13, color:C.w, outline:"none", fontFamily:sans, border:"1px solid rgba(255,255,255,0.09)" };

  return (
    <div style={{ minHeight:"100vh", background:"#07090d", fontFamily:sans, color:C.w, position:"relative" }}>
      <AnimBG/>
      <div style={{ position:"relative", zIndex:1 }}>
        <Topbar user={user} onHome={onHome} onProfile={()=>setShowProfile(true)}/>
        <Tabs active={tab} onChange={setTab}/>
        <div style={page_content}>

          {/* ══ DASHBOARD ══ */}
          {tab===0 && <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(5,1fr)", gap:10 }}>
              {[["Coaches",stats.total.toLocaleString()],["Sent",stats.sent],["Opened",stats.opened],["Replied",stats.replied],["Pending",(stats.total-stats.sent).toLocaleString()]].map(([l,v])=>(
                <div key={l} style={{ ...gcSm(), padding:"16px", textAlign:"center", position:"relative", overflow:"hidden", borderRadius:14 }}>
                  <div style={{ position:"absolute", top:0, left:"50%", transform:"translateX(-50%)", width:"70%", height:1, background:"linear-gradient(90deg,transparent,rgba(255,255,255,0.2),transparent)" }}/>
                  <div style={{ fontSize:9, color:C.w30, textTransform:"uppercase", letterSpacing:1, marginBottom:6, fontWeight:600 }}>{l}</div>
                  <div style={{ fontSize:26, fontWeight:800, color:C.w, fontFamily:mono, letterSpacing:"-1px" }}>{v}</div>
                </div>
              ))}
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
              <div style={{ ...gcSm(), padding:18, borderRadius:16 }}>
                <div style={{ fontSize:10, color:C.w30, textTransform:"uppercase", letterSpacing:1, marginBottom:14, fontWeight:600 }}>Outreach funnel</div>
                {[["In database",stats.total,stats.total],["Emails sent",stats.sent,stats.total],["Opened",stats.opened,stats.total],["Replied",stats.replied,stats.total]].map(([l,v,t])=>(
                  <div key={l} style={{ marginBottom:12 }}>
                    <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}><span style={{ fontSize:12, color:C.w50 }}>{l}</span><span style={{ fontSize:12, color:C.w70, fontFamily:mono }}>{v.toLocaleString()}</span></div>
                    <GlassBar pct={t>0?(v/t)*100:0}/>
                  </div>
                ))}
              </div>
              <div style={{ ...gcSm(), padding:18, borderRadius:16 }}>
                <div style={{ fontSize:10, color:C.w30, textTransform:"uppercase", letterSpacing:1, marginBottom:14, fontWeight:600 }}>Performance metrics</div>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:10 }}>
                  {[["Open rate",stats.sent>0?Math.round((stats.opened/stats.sent)*100):0,"%"],["Reply rate",stats.sent>0?Math.round((stats.replied/stats.sent)*100):0,"%"],["Sent rate",stats.total>0?Math.round((stats.sent/stats.total)*100):0,"%"]].map(([l,v,u])=>(
                    <div key={l} style={{ textAlign:"center", ...gcDeep(), padding:"12px 8px", borderRadius:10 }}>
                      <div style={{ fontSize:22, fontWeight:800, color:C.tg, fontFamily:mono }}>{v}{u}</div>
                      <div style={{ fontSize:9, color:C.w30, textTransform:"uppercase", letterSpacing:.7, marginTop:4 }}>{l}</div>
                    </div>
                  ))}
                </div>
                <div style={{ marginTop:14 }}>
                  <div style={{ fontSize:9, color:C.w30, textTransform:"uppercase", letterSpacing:1, marginBottom:8, fontWeight:600 }}>Division breakdown</div>
                  {Object.entries(DIV_C).map(([d,col])=>{
                    const cnt=coaches.filter(c=>c.division===d).length;
                    return cnt>0 ? <div key={d} style={{ marginBottom:8 }}>
                      <div style={{ display:"flex", justifyContent:"space-between", marginBottom:3 }}><span style={{ fontSize:11, color:col }}>{d}</span><span style={{ fontSize:11, color:C.w40, fontFamily:mono }}>{cnt}</span></div>
                      <GlassBar pct={coaches.length>0?(cnt/coaches.length)*100:0} color={col}/>
                    </div> : null;
                  })}
                </div>
              </div>
            </div>
            {/* Selected coaches email panel */}
            {selected.length>0 && <div style={{ ...gcSm(), padding:18, borderRadius:16 }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14 }}>
                <div style={{ fontSize:10, color:C.w30, textTransform:"uppercase", letterSpacing:1, fontWeight:600 }}>{selected.length} coaches selected</div>
                <Btn variant="ghost" size="sm" onClick={()=>setSelected([])}>Clear selection</Btn>
              </div>
              <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                {selected.map(c=>(
                  <div key={c.email} style={{ ...gcDeep(), padding:"12px 14px", display:"flex", alignItems:"center", gap:10, borderRadius:11 }}>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:13, color:C.w80 }}>{c.school_name}</div>
                      <div style={{ fontSize:11, color:C.w40, marginTop:2 }}>{c.coach_name} · {c.email}</div>
                    </div>
                    <div style={{ display:"flex", gap:6 }}>
                      <Btn variant="ghost" size="sm" onClick={()=>generateEmail(c)} disabled={generating===c.email}>{generating===c.email?"Generating...":"Draft"}</Btn>
                      {genEmails[c.email] && <Btn variant="tg" size="sm" onClick={()=>sendEmail(c)} disabled={sending[c.email]}>{sending[c.email]?"Sending...":"Send"}</Btn>}
                    </div>
                  </div>
                ))}
              </div>
            </div>}
            {/* Sent emails table */}
            <div style={{ ...gcSm(), overflow:"hidden", borderRadius:16 }}>
              <div style={{ padding:"13px 18px", borderBottom:"1px solid rgba(255,255,255,0.06)", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                <div style={{ fontSize:10, color:C.w30, textTransform:"uppercase", letterSpacing:1, fontWeight:600 }}>All sent emails</div>
                <span style={{ fontSize:10, color:C.w20, fontFamily:mono }}>{stats.sent}</span>
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr 80px 60px 60px 65px", padding:"8px 16px", background:"rgba(255,255,255,0.02)", borderBottom:"1px solid rgba(255,255,255,0.05)" }}>
                {["School","Coach","Subject","Date","Opened","Video","Replied"].map(h=><div key={h} style={{ fontSize:9, color:C.w20, textTransform:"uppercase", letterSpacing:.7 }}>{h}</div>)}
              </div>
              {coaches.filter(c=>c.email_sent).length===0 ? <div style={{ padding:"2rem", textAlign:"center", color:C.w20, fontSize:13 }}>No emails sent yet</div>
              : coaches.filter(c=>c.email_sent).map((c,i)=>(
                <div key={i} style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr 80px 60px 60px 65px", padding:"10px 16px", borderBottom:"1px solid rgba(255,255,255,0.04)", alignItems:"center", fontSize:12, cursor:"pointer", transition:"background 0.1s" }} onClick={()=>setSelCoach(c)} onMouseEnter={e=>e.currentTarget.style.background="rgba(255,255,255,0.02)"} onMouseLeave={e=>e.currentTarget.style.background=""}>
                  <div style={{ color:C.w80, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", paddingRight:6 }}>{c.school_name}</div>
                  <div style={{ color:C.w50, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", paddingRight:6, fontSize:11 }}>{c.coach_name}</div>
                  <div style={{ color:C.w30, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", paddingRight:6, fontSize:11 }}>{c.email_subject||"Recruiting inquiry..."}</div>
                  <div style={{ color:C.w30, fontFamily:mono, fontSize:10 }}>{c.email_sent_at?new Date(c.email_sent_at).toLocaleDateString():"—"}</div>
                  <span style={{ fontSize:9, padding:"2px 7px", borderRadius:6, background:c.email_opened?"rgba(200,240,32,0.1)":"rgba(255,255,255,0.04)", border:`1px solid ${c.email_opened?"rgba(200,240,32,0.25)":"rgba(255,255,255,0.08)"}`, color:c.email_opened?C.tg:C.w30, display:"inline-block" }}>{c.email_opened?"Yes":"No"}</span>
                  <div style={{ color:C.w20, fontFamily:mono, fontSize:11 }}>—</div>
                  <span style={{ fontSize:9, padding:"2px 7px", borderRadius:6, background:c.replied?"rgba(200,240,32,0.1)":"transparent", border:`1px solid ${c.replied?"rgba(200,240,32,0.25)":"transparent"}`, color:c.replied?C.tg:C.w20, display:"inline-block" }}>{c.replied?"Yes":"—"}</span>
                </div>
              ))}
            </div>
          </div>}

          {/* ══ SCHOOLS ══ */}
          {tab===1 && <SchoolsTab coaches={coaches}/>}

          {/* ══ COACHES ══ */}
          {tab===2 && <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
            <div style={{ display:"flex", gap:8, alignItems:"center" }}>
              <div style={{ flex:1, position:"relative" }}>
                <span style={{ position:"absolute", left:12, top:"50%", transform:"translateY(-50%)", color:C.w30, fontSize:15 }}>⌕</span>
                <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search coaches, schools, divisions..." style={{ ...gInp, width:"100%", padding:"10px 14px 10px 36px" }}/>
              </div>
              <Btn variant="ghost" size="sm" onClick={()=>setFiltersOpen(f=>!f)}>⚙ Filters{hasFilters?" ✦":""}</Btn>
            </div>
            {filtersOpen && <div style={{ ...gcSm(), padding:16, borderRadius:14 }}>
              <div style={{ display:"flex", gap:8, flexWrap:"wrap", marginBottom:12 }}>
                {divs.map(d=><button key={d} onClick={()=>setFDiv(d)} style={{ padding:"5px 12px", fontSize:11, borderRadius:99, cursor:"pointer", border:`1px solid ${fDiv===d?"rgba(200,240,32,0.35)":"rgba(255,255,255,0.09)"}`, background:fDiv===d?"rgba(200,240,32,0.09)":"rgba(255,255,255,0.03)", color:fDiv===d?C.tg:C.w40, fontFamily:sans, transition:"all 0.14s" }}>{d}</button>)}
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:10, marginBottom:12 }}>
                {[["UTR min",fUtrMin,setFUtrMin,"8.0"],["UTR max",fUtrMax,setFUtrMax,"14.0"],["WTN min",fWtnMin,setFWtnMin,"5"],["WTN max",fWtnMax,setFWtnMax,"25"]].map(([l,v,sv,ph])=><div key={l} style={{ display:"flex", flexDirection:"column", gap:5 }}><label style={{ fontSize:10, color:C.w30, textTransform:"uppercase", letterSpacing:.8, fontWeight:600 }}>{l}</label><input style={selInp} type="number" placeholder={ph} value={v} onChange={e=>sv(e.target.value)}/></div>)}
              </div>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                <span style={{ fontSize:12, color:C.w50, fontFamily:mono }}>{filtered.length.toLocaleString()} coaches match</span>
                {hasFilters&&<button onClick={clearFilters} style={{ background:"none", border:"none", color:C.w50, cursor:"pointer", fontSize:12, fontFamily:sans }}>✕ Clear all</button>}
              </div>
            </div>}
            <div style={{ display:"flex", gap:8 }}>
              <span style={{ fontSize:12, color:C.w30, background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.08)", borderRadius:7, padding:"5px 12px", fontFamily:mono }}>{filtered.length.toLocaleString()} coaches</span>
              {selected.length>0&&<span onClick={()=>setTab(0)} style={{ fontSize:12, color:C.w70, background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.16)", borderRadius:7, padding:"5px 12px", cursor:"pointer" }}>{selected.length} selected → dashboard</span>}
            </div>
            {loadErr&&<div style={{ color:"rgba(245,158,11,0.9)", fontSize:12, background:"rgba(245,158,11,0.07)", border:"1px solid rgba(245,158,11,0.18)", borderRadius:10, padding:"12px 16px", lineHeight:1.6 }}>⚠ {loadErr}</div>}
            {loading ? <div style={{ textAlign:"center", padding:"4rem", color:C.w20 }}>Loading coaches...</div>
            : coaches.length===0&&!loadErr ? <div style={{ textAlign:"center", padding:"4rem", color:C.w20, fontSize:13 }}>No coaches loaded.</div>
            : <div style={{ ...gcSm(), overflow:"hidden", borderRadius:16 }}>
                <div style={{ display:"grid", gridTemplateColumns:"28px 1fr 1fr 100px 65px 65px 80px", padding:"9px 16px", borderBottom:"1px solid rgba(255,255,255,0.06)", background:"rgba(255,255,255,0.02)" }}>
                  {["","School","Coach","Division","UTR","WTN","Status"].map((h,i)=><div key={i} style={{ fontSize:9, color:C.w20, textTransform:"uppercase", letterSpacing:.7 }}>{h}</div>)}
                </div>
                {paged.length===0 ? <div style={{ padding:"2rem", textAlign:"center", color:C.w20, fontSize:13 }}>No coaches match</div>
                : paged.map((c,i)=>{ const isSel=!!selected.find(x=>x.email===c.email); return (
                  <div key={c.email+i} style={{ display:"grid", gridTemplateColumns:"28px 1fr 1fr 100px 65px 65px 80px", padding:"11px 16px", borderBottom:i<paged.length-1?"1px solid rgba(255,255,255,0.04)":"none", background:isSel?"rgba(255,255,255,0.04)":"transparent", cursor:"pointer", alignItems:"center", transition:"background 0.1s" }} onMouseEnter={e=>e.currentTarget.style.background=isSel?"rgba(255,255,255,0.04)":"rgba(255,255,255,0.02)"} onMouseLeave={e=>e.currentTarget.style.background=isSel?"rgba(255,255,255,0.04)":"transparent"}>
                    <div onClick={e=>{e.stopPropagation();toggleSel(c);}} style={{ width:14, height:14, borderRadius:3, border:`1.5px solid ${isSel?"rgba(200,240,32,0.8)":"rgba(255,255,255,0.2)"}`, background:isSel?"rgba(200,240,32,0.85)":"transparent", display:"flex", alignItems:"center", justifyContent:"center", fontSize:9, color:"#07090d", flexShrink:0 }}>{isSel?"✓":""}</div>
                    <div onClick={()=>setSelCoach(c)} style={{ fontSize:13, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", paddingRight:8 }}>{c.school_name||"—"}</div>
                    <div onClick={()=>setSelCoach(c)} style={{ fontSize:12, color:C.w50, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", paddingRight:8 }}>{c.coach_name||"—"}</div>
                    <div onClick={()=>setSelCoach(c)} style={{ fontSize:11, color:dC(c.division), fontWeight:500 }}>{c.division||"—"}</div>
                    <div onClick={()=>setSelCoach(c)} style={{ fontSize:12, color:C.w40, fontFamily:mono }}>{c.team_utr?Number(c.team_utr).toFixed(1):"—"}</div>
                    <div onClick={()=>setSelCoach(c)} style={{ fontSize:12, color:C.w40, fontFamily:mono }}>{c.team_wtn?Number(c.team_wtn).toFixed(1):"—"}</div>
                    <div onClick={()=>setSelCoach(c)}><span style={{ fontSize:10, padding:"3px 9px", borderRadius:99, background:c.replied?"rgba(200,240,32,0.1)":c.email_sent?"rgba(255,255,255,0.06)":"rgba(255,255,255,0.02)", border:`1px solid ${c.replied?"rgba(200,240,32,0.28)":c.email_sent?"rgba(255,255,255,0.14)":"rgba(255,255,255,0.07)"}`, color:c.replied?C.tg:c.email_sent?C.w60:C.w30 }}>{c.replied?"Replied":c.email_sent?"Sent":"Pending"}</span></div>
                  </div>
                );})}
              </div>}
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginTop:4 }}>
              <Btn variant="ghost" size="sm" onClick={()=>setPage(p=>Math.max(0,p-1))} disabled={page===0}>← Prev</Btn>
              <span style={{ fontSize:12, color:C.w30, fontFamily:mono }}>Page {page+1} / {Math.max(1,totalPages)}</span>
              <Btn variant="ghost" size="sm" onClick={()=>setPage(p=>Math.min(totalPages-1,p+1))} disabled={page>=totalPages-1}>Next →</Btn>
            </div>
          </div>}

          {/* ══ AI ADVISOR ══ */}
          {tab===3 && <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
            <div ref={chatRef} style={{ ...gcSm(), padding:16, minHeight:360, maxHeight:480, overflowY:"auto", display:"flex", flexDirection:"column", gap:12, borderRadius:16 }}>
              {aiChat.length===0 && <div style={{ textAlign:"center", padding:"3rem 1rem" }}>
                <div style={{ fontSize:32, marginBottom:12 }}>◈</div>
                <div style={{ fontSize:14, color:C.w40, marginBottom:20 }}>Ask about fit, schools, strategy, or recruiting timelines</div>
                <div style={{ display:"flex", flexWrap:"wrap", gap:8, justifyContent:"center" }}>
                  {["Which D1 schools match my UTR?","Best D3 outreach strategy?","When to start recruiting?","Roster needs by division?"].map(q=><button key={q} onClick={()=>setAiInput(q)} style={{ ...gcDeep(), borderRadius:9, padding:"8px 14px", fontSize:12, color:C.w50, cursor:"pointer", fontFamily:sans, border:"1px solid rgba(255,255,255,0.09)" }}>{q}</button>)}
                </div>
              </div>}
              {aiChat.map((m,i)=>(
                <div key={i} style={{ display:"flex", justifyContent:m.role==="user"?"flex-end":"flex-start", gap:10, alignItems:"flex-start" }}>
                  {m.role==="assistant" && <div style={{ width:28, height:28, borderRadius:8, ...gcDeep(), display:"flex", alignItems:"center", justifyContent:"center", fontSize:13, flexShrink:0, border:"1px solid rgba(255,255,255,0.09)" }}>◈</div>}
                  <div style={{ ...gcDeep(), padding:"11px 14px", maxWidth:"80%", fontSize:13, lineHeight:1.7, color:m.role==="user"?C.w80:C.w60, whiteSpace:"pre-wrap", background:m.role==="user"?"rgba(200,240,32,0.07)":"rgba(255,255,255,0.03)", border:`1px solid ${m.role==="user"?"rgba(200,240,32,0.18)":"rgba(255,255,255,0.08)"}`, borderRadius:m.role==="user"?"13px 13px 4px 13px":"13px 13px 13px 4px" }}>{m.content}</div>
                </div>
              ))}
              {aiLoading && <div style={{ display:"flex", gap:10 }}>
                <div style={{ width:28, height:28, borderRadius:8, ...gcDeep(), display:"flex", alignItems:"center", justifyContent:"center", fontSize:13, border:"1px solid rgba(255,255,255,0.09)" }}>◈</div>
                <div style={{ ...gcDeep(), padding:"11px 14px", fontSize:13, color:C.w30, borderRadius:"13px 13px 13px 4px" }}>Thinking...</div>
              </div>}
            </div>
            <div style={{ display:"flex", gap:8 }}>
              <input style={{ ...gInp, flex:1, borderRadius:12 }} placeholder="Ask about fit, schools, strategy..." value={aiInput} onChange={e=>setAiInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&sendAi()}/>
              <Btn variant="solid" onClick={sendAi} disabled={aiLoading} style={{ borderRadius:12 }}>Send →</Btn>
            </div>
          </div>}

        </div>
      </div>
      {selCoach && <CoachDrawer coach={selCoach} onClose={()=>setSelCoach(null)} onGenerate={generateEmail} onSend={sendEmail} genEmails={genEmails} generating={generating} sending={sending}/>}
      {showProfile && <ProfileModal user={user} videos={videos} onClose={()=>setShowProfile(false)} onSave={onUpdateUser} onLogout={onLogout} onAddVideo={v=>setVideos(p=>[...p,v])} onRemoveVideo={i=>setVideos(p=>p.filter((_,idx)=>idx!==i))}/>}
    </div>
  );
}

// ── ROOT ──────────────────────────────────────────────────────────────────────
export default function Root() {
  const [screen,setScreen]=useState("home");
  const [authMode,setAuthMode]=useState("login");
  const [user,setUser]=useState(null);
  const goEnter=()=>{ setAuthMode("signup"); setScreen("auth"); };
  const goLogin=()=>{ setAuthMode("login"); setScreen("auth"); };
  const handleAuth=u=>{ setUser(u); setScreen("onboard"); };
  const handleOnboard=p=>{ setUser(u=>({...u,...p,profileComplete:true})); setScreen("app"); };
  const handleUpgrade=()=>setScreen("paywall");
  const handleUnlock=pl=>{ setUser(u=>({...u,plan:pl})); setScreen("app"); };
  const handleLogout=()=>{ setUser(null); setScreen("home"); };
  const handleUpdate=upd=>setUser(u=>({...u,...upd}));
  if(screen==="home")    return <HomePage onEnter={goEnter} onLogin={goLogin}/>;
  if(screen==="auth")    return <AuthPage mode={authMode} onAuth={handleAuth} onSwitch={m=>setAuthMode(m)}/>;
  if(screen==="onboard") return <OnboardingPage user={user} onComplete={handleOnboard}/>;
  if(screen==="paywall") return <PaywallPage user={user} onUnlock={handleUnlock}/>;
  return <MainApp user={user} onUpdateUser={handleUpdate} onLogout={handleLogout} onNeedUpgrade={handleUpgrade} onHome={()=>setScreen("home")}/>;
}
