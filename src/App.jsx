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
  const j = await r.json();
  return j.text || "";
};

// ── MOVING BACKGROUND ─────────────────────────────────────────────────────────
function AnimBG() {
  return (
    <div style={{ position:"fixed", inset:0, zIndex:0, overflow:"hidden", background:"#080808" }}>
      <style>{`
        @keyframes orb1 { 0%{transform:translate(0%,0%) scale(1)} 33%{transform:translate(15%,20%) scale(1.15)} 66%{transform:translate(-10%,10%) scale(0.9)} 100%{transform:translate(0%,0%) scale(1)} }
        @keyframes orb2 { 0%{transform:translate(0%,0%) scale(1)} 33%{transform:translate(-20%,-15%) scale(1.2)} 66%{transform:translate(10%,-5%) scale(0.85)} 100%{transform:translate(0%,0%) scale(1)} }
        @keyframes orb3 { 0%{transform:translate(0%,0%) scale(1)} 33%{transform:translate(8%,-18%) scale(1.1)} 66%{transform:translate(-15%,12%) scale(1.05)} 100%{transform:translate(0%,0%) scale(1)} }
        @keyframes orb4 { 0%{transform:translate(0%,0%) scale(1)} 50%{transform:translate(-12%,8%) scale(1.18)} 100%{transform:translate(0%,0%) scale(1)} }
      `}</style>
      <div style={{ position:"absolute", width:"70vw", height:"70vw", borderRadius:"50%", background:"radial-gradient(circle,rgba(120,120,130,0.55) 0%,transparent 70%)", top:"-20%", left:"-15%", animation:"orb1 18s ease-in-out infinite", filter:"blur(60px)" }}/>
      <div style={{ position:"absolute", width:"55vw", height:"55vw", borderRadius:"50%", background:"radial-gradient(circle,rgba(90,90,100,0.45) 0%,transparent 70%)", bottom:"-10%", right:"-10%", animation:"orb2 22s ease-in-out infinite", filter:"blur(80px)" }}/>
      <div style={{ position:"absolute", width:"40vw", height:"40vw", borderRadius:"50%", background:"radial-gradient(circle,rgba(180,180,200,0.2) 0%,transparent 70%)", top:"40%", left:"50%", animation:"orb3 26s ease-in-out infinite", filter:"blur(70px)" }}/>
      <div style={{ position:"absolute", width:"35vw", height:"35vw", borderRadius:"50%", background:"radial-gradient(circle,rgba(60,60,70,0.5) 0%,transparent 70%)", top:"10%", right:"20%", animation:"orb4 20s ease-in-out infinite", filter:"blur(50px)" }}/>
      <div style={{ position:"absolute", inset:0, background:"rgba(0,0,0,0.35)" }}/>
    </div>
  );
}

// ── GLASS PRIMITIVES ──────────────────────────────────────────────────────────
const glass = {
  background: "rgba(255,255,255,0.045)",
  backdropFilter: "blur(28px) saturate(180%)",
  WebkitBackdropFilter: "blur(28px) saturate(180%)",
  border: "1px solid rgba(255,255,255,0.12)",
  borderRadius: 16,
};
const glassCard = {
  ...glass,
  boxShadow: "0 4px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.1)",
};
const glassDeep = {
  background: "rgba(255,255,255,0.03)",
  backdropFilter: "blur(20px) saturate(160%)",
  WebkitBackdropFilter: "blur(20px) saturate(160%)",
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: 12,
  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.06), 0 2px 16px rgba(0,0,0,0.3)",
};

const C = {
  w: "#ffffff", w80:"rgba(255,255,255,0.8)", w60:"rgba(255,255,255,0.6)",
  w40:"rgba(255,255,255,0.4)", w20:"rgba(255,255,255,0.2)", w10:"rgba(255,255,255,0.1)",
  w05:"rgba(255,255,255,0.05)", w02:"rgba(255,255,255,0.02)",
  border:"rgba(255,255,255,0.1)", borderBright:"rgba(255,255,255,0.2)",
  teal:"rgba(0,210,170,0.85)", purple:"rgba(139,92,246,0.85)", amber:"rgba(245,158,11,0.85)", red:"rgba(239,68,68,0.85)", blue:"rgba(59,130,246,0.85)"
};
const DIV_C = { "NCAA D1":C.teal, "NCAA D2":C.purple, "NCAA D3":C.blue, "NAIA":C.amber, "JUCO":C.red };
const dC = d => DIV_C[d] || C.w40;
const sans = "-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif";
const mono = "'SF Mono','ui-monospace',monospace";

function Logo({ size=28 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <circle cx="16" cy="16" r="15" stroke="rgba(255,255,255,0.75)" strokeWidth="1.5"/>
      <path d="M7 16 Q16 6 25 16 Q16 26 7 16Z" stroke="rgba(255,255,255,0.75)" strokeWidth="1.5" fill="none"/>
      <line x1="1" y1="16" x2="31" y2="16" stroke="rgba(255,255,255,0.3)" strokeWidth="1"/>
      <line x1="16" y1="1" x2="16" y2="31" stroke="rgba(255,255,255,0.3)" strokeWidth="1"/>
      <circle cx="16" cy="16" r="2.5" fill="rgba(255,255,255,0.85)"/>
    </svg>
  );
}

// ── GLASS BUTTON ──────────────────────────────────────────────────────────────
function Btn({ children, onClick, variant="primary", size="md", disabled, full, style:sx={} }) {
  const [hover, setHover] = useState(false);
  const sizes = { sm:{padding:"6px 14px",fontSize:12}, md:{padding:"10px 20px",fontSize:13}, lg:{padding:"14px 30px",fontSize:15} };
  const base = { cursor:disabled?"default":"pointer", border:"none", borderRadius:10, fontWeight:500, fontFamily:sans, display:"inline-flex", alignItems:"center", justifyContent:"center", gap:8, opacity:disabled?0.4:1, width:full?"100%":"auto", transition:"all 0.2s", position:"relative", overflow:"hidden", backdropFilter:"blur(20px)", WebkitBackdropFilter:"blur(20px)", ...sizes[size] };
  const variants = {
    primary: { background: hover ? "rgba(255,255,255,0.22)" : "rgba(255,255,255,0.14)", color:C.w, border:"1px solid rgba(255,255,255,0.3)", boxShadow: hover?"0 8px 32px rgba(255,255,255,0.1),inset 0 1px 0 rgba(255,255,255,0.3)":"0 4px 16px rgba(0,0,0,0.3),inset 0 1px 0 rgba(255,255,255,0.2)" },
    ghost:   { background: hover ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.04)", color:C.w60, border:"1px solid rgba(255,255,255,0.12)", boxShadow:"inset 0 1px 0 rgba(255,255,255,0.06)" },
    solid:   { background: hover ? "rgba(255,255,255,0.95)" : "rgba(255,255,255,0.88)", color:"#0a0a0a", border:"1px solid rgba(255,255,255,0.6)", boxShadow: hover?"0 8px 32px rgba(255,255,255,0.25)":"0 4px 16px rgba(255,255,255,0.1)" },
    danger:  { background:"rgba(239,68,68,0.12)", color:"rgba(239,68,68,0.9)", border:"1px solid rgba(239,68,68,0.25)" },
  };
  return (
    <button onClick={onClick} disabled={disabled} onMouseEnter={()=>setHover(true)} onMouseLeave={()=>setHover(false)} style={{ ...base, ...variants[variant], ...sx }}>
      {hover && !disabled && <div style={{ position:"absolute", inset:0, background:"linear-gradient(135deg,rgba(255,255,255,0.08) 0%,transparent 60%)", pointerEvents:"none" }}/>}
      {children}
    </button>
  );
}

// ── GLASS INPUT ───────────────────────────────────────────────────────────────
function Field({ label, type="text", value, onChange, placeholder, textarea, half }) {
  const [show, setShow] = useState(false);
  const [focus, setFocus] = useState(false);
  const base = { ...glassDeep, padding:"10px 13px", fontSize:13, color:C.w, outline:"none", width:"100%", boxSizing:"border-box", fontFamily:sans, transition:"all 0.2s", background: focus?"rgba(255,255,255,0.07)":"rgba(255,255,255,0.04)", border:`1px solid ${focus?"rgba(255,255,255,0.25)":"rgba(255,255,255,0.1)"}` };
  return (
    <div style={{ flex:half?"1 1 45%":"1 1 100%", display:"flex", flexDirection:"column", gap:5 }}>
      {label && <label style={{ fontSize:11, color:C.w40, letterSpacing:0.6, textTransform:"uppercase" }}>{label}</label>}
      <div style={{ position:"relative" }}>
        {textarea
          ? <textarea value={value} onChange={onChange} placeholder={placeholder} rows={3} style={{ ...base, resize:"vertical" }} onFocus={()=>setFocus(true)} onBlur={()=>setFocus(false)}/>
          : <input type={type==="password"&&show?"text":type} value={value} onChange={onChange} placeholder={placeholder} style={{ ...base, paddingRight:type==="password"?38:13 }} onFocus={()=>setFocus(true)} onBlur={()=>setFocus(false)}/>}
        {type==="password" && <button onClick={()=>setShow(s=>!s)} style={{ position:"absolute", right:10, top:"50%", transform:"translateY(-50%)", background:"none", border:"none", color:C.w40, cursor:"pointer", fontSize:12 }}>{show?"○":"●"}</button>}
      </div>
    </div>
  );
}

function Avatar({ name, size=30, onClick }) {
  const i = (name||"?").split(" ").map(w=>w[0]).join("").slice(0,2).toUpperCase();
  return <div onClick={onClick} style={{ width:size, height:size, borderRadius:"50%", background:"rgba(255,255,255,0.12)", border:"1px solid rgba(255,255,255,0.25)", backdropFilter:"blur(10px)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:size*0.32, fontWeight:600, color:C.w80, cursor:"pointer", flexShrink:0, userSelect:"none", fontFamily:mono }}>{i}</div>;
}

// ── GLASS STAT CARD ───────────────────────────────────────────────────────────
function StatCard({ label, value, sub }) {
  return (
    <div style={{ ...glassCard, padding:"18px 16px", textAlign:"center", position:"relative", overflow:"hidden" }}>
      <div style={{ position:"absolute", top:0, left:"50%", transform:"translateX(-50%)", width:"80%", height:1, background:"linear-gradient(90deg,transparent,rgba(255,255,255,0.25),transparent)" }}/>
      <div style={{ fontSize:10, color:C.w40, textTransform:"uppercase", letterSpacing:1, marginBottom:8 }}>{label}</div>
      <div style={{ fontSize:28, fontWeight:800, color:C.w, fontFamily:mono, letterSpacing:"-1px" }}>{value}</div>
      {sub && <div style={{ fontSize:10, color:C.w20, marginTop:4 }}>{sub}</div>}
    </div>
  );
}

// ── GLASS PROGRESS BAR ────────────────────────────────────────────────────────
function GlassBar({ pct, color="rgba(255,255,255,0.6)", height=4 }) {
  return (
    <div style={{ height, background:"rgba(255,255,255,0.06)", borderRadius:99, overflow:"hidden", position:"relative" }}>
      <div style={{ height:"100%", width:`${pct}%`, background:`linear-gradient(90deg,${color},rgba(255,255,255,0.8))`, borderRadius:99, transition:"width 0.8s ease", boxShadow:`0 0 8px ${color}` }}/>
    </div>
  );
}

// ── COACH DRAWER ──────────────────────────────────────────────────────────────
function CoachDrawer({ coach, onClose }) {
  if (!coach) return null;
  const vO = coach.email_sent ? Math.floor(Math.random()*9) : 0;
  const eO = coach.email_opened ? Math.floor(Math.random()*4)+1 : 0;
  const pC = coach.email_sent ? Math.floor(Math.random()*4) : 0;
  const d = coach.email_sent_at ? new Date(new Date(coach.email_sent_at).getTime()+Math.random()*86400000*3).toLocaleDateString() : null;
  const tl = [coach.email_sent&&{label:"Email delivered",date:coach.email_sent_at?new Date(coach.email_sent_at).toLocaleDateString():"—"},coach.email_opened&&{label:`Email opened (${eO}×)`,date:d},vO>0&&{label:`Tape viewed (${vO}×)`,date:d},coach.replied&&{label:"Coach replied ✦",date:d}].filter(Boolean);
  const sect = (title, children) => (
    <div style={{ ...glassCard, padding:"16px" }}>
      <div style={{ fontSize:10, fontWeight:600, color:C.w30, textTransform:"uppercase", letterSpacing:1, marginBottom:14 }}>{title}</div>
      {children}
    </div>
  );
  return (
    <div onClick={onClose} style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.6)", backdropFilter:"blur(16px)", WebkitBackdropFilter:"blur(16px)", zIndex:1000, display:"flex", justifyContent:"flex-end", fontFamily:sans }}>
      <div onClick={e=>e.stopPropagation()} style={{ width:420, height:"100vh", background:"rgba(10,10,12,0.75)", backdropFilter:"blur(40px) saturate(200%)", WebkitBackdropFilter:"blur(40px) saturate(200%)", borderLeft:"1px solid rgba(255,255,255,0.1)", overflowY:"auto", padding:"1.75rem", display:"flex", flexDirection:"column", gap:14, boxShadow:"-20px 0 60px rgba(0,0,0,0.5)" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
          <div>
            <div style={{ fontSize:20, fontWeight:800, color:C.w, letterSpacing:"-0.5px" }}>{coach.school_name}</div>
            <div style={{ fontSize:13, color:C.w50, marginTop:3 }}>{coach.coach_name}</div>
            <div style={{ marginTop:10, display:"flex", gap:6 }}>
              <span style={{ fontSize:10, padding:"3px 10px", borderRadius:99, background:`rgba(255,255,255,0.08)`, border:"1px solid rgba(255,255,255,0.15)", color:dC(coach.division) }}>{coach.division||"—"}</span>
              {coach.team_utr && <span style={{ fontSize:10, padding:"3px 10px", borderRadius:99, background:"rgba(255,255,255,0.06)", border:"1px solid rgba(255,255,255,0.12)", color:C.w60 }}>UTR {Number(coach.team_utr).toFixed(1)}</span>}
            </div>
          </div>
          <button onClick={onClose} style={{ ...glassDeep, width:32, height:32, display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", color:C.w50, fontSize:14, border:"1px solid rgba(255,255,255,0.1)", borderRadius:9 }}>✕</button>
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:8 }}>
          {[["Sent",coach.email_sent],["Opened",coach.email_opened],["Replied",coach.replied]].map(([l,v])=>(
            <div key={l} style={{ ...glassCard, padding:"12px 8px", textAlign:"center", position:"relative", overflow:"hidden" }}>
              <div style={{ position:"absolute", top:0, left:"50%", transform:"translateX(-50%)", width:"70%", height:1, background:"linear-gradient(90deg,transparent,rgba(255,255,255,0.2),transparent)" }}/>
              <div style={{ fontSize:18, marginBottom:4 }}>{v?"✓":"—"}</div>
              <div style={{ fontSize:10, color:v?C.w60:C.w20, textTransform:"uppercase", letterSpacing:0.7 }}>{l}</div>
            </div>
          ))}
        </div>
        {sect("Engagement analytics",
          [["Email opens",eO,5],["Tape views",vO,10],["Profile clicks",pC,6],["Follow-ups",0,4]].map(([l,v,mx])=>(
            <div key={l} style={{ marginBottom:12 }}>
              <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6 }}>
                <span style={{ fontSize:12, color:C.w60 }}>{l}</span>
                <span style={{ fontSize:12, color:v>0?C.w80:C.w20, fontFamily:mono }}>{v}</span>
              </div>
              <GlassBar pct={Math.min((v/mx)*100,100)} color={v>0?"rgba(255,255,255,0.5)":"rgba(255,255,255,0.1)"}/>
            </div>
          ))
        )}
        {tl.length>0 && sect("Timeline",
          tl.map((t,i)=>(
            <div key={i} style={{ display:"flex", gap:12, paddingBottom:i<tl.length-1?14:0 }}>
              <div style={{ display:"flex", flexDirection:"column", alignItems:"center", flexShrink:0 }}>
                <div style={{ width:8, height:8, borderRadius:"50%", background:"rgba(255,255,255,0.5)", marginTop:3 }}/>
                {i<tl.length-1 && <div style={{ width:1, flex:1, background:"rgba(255,255,255,0.1)", marginTop:4 }}/>}
              </div>
              <div><div style={{ fontSize:13, color:C.w80 }}>{t.label}</div>{t.date&&<div style={{ fontSize:11, color:C.w30, marginTop:2 }}>{t.date}</div>}</div>
            </div>
          ))
        )}
        {coach.email_body && sect("Email sent",
          <>
            {coach.email_subject && <div style={{ fontSize:12, color:C.w60, fontWeight:500, marginBottom:8 }}>Subject: {coach.email_subject}</div>}
            <div style={{ fontSize:12, color:C.w50, lineHeight:1.75, whiteSpace:"pre-wrap", maxHeight:180, overflowY:"auto" }}>{coach.email_body}</div>
          </>
        )}
        {sect("Details",
          [["Email",coach.email],["Team UTR",coach.team_utr?Number(coach.team_utr).toFixed(2):"—"],["Team WTN",coach.team_wtn?Number(coach.team_wtn).toFixed(1):"—"]].map(([l,v])=>(
            <div key={l} style={{ display:"flex", justifyContent:"space-between", padding:"7px 0", borderBottom:"1px solid rgba(255,255,255,0.06)" }}>
              <span style={{ fontSize:12, color:C.w30 }}>{l}</span>
              <span style={{ fontSize:12, color:C.w60, maxWidth:220, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", textAlign:"right" }}>{v||"—"}</span>
            </div>
          ))
        )}
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
  const tabs = [["profile","Profile"],["media","Media"],["billing","Billing"],["security","Security"]];
  const [drag, setDrag] = useState(false); const [link, setLink] = useState(""); const ref = useRef();
  return (
    <div onClick={onClose} style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.7)", backdropFilter:"blur(16px)", WebkitBackdropFilter:"blur(16px)", zIndex:1000, display:"flex", alignItems:"center", justifyContent:"center", padding:"1rem", fontFamily:sans }}>
      <div onClick={e=>e.stopPropagation()} style={{ width:"100%", maxWidth:580, maxHeight:"92vh", overflowY:"auto", background:"rgba(10,10,14,0.8)", backdropFilter:"blur(40px) saturate(200%)", WebkitBackdropFilter:"blur(40px) saturate(200%)", border:"1px solid rgba(255,255,255,0.12)", borderRadius:22, boxShadow:"0 32px 80px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.1)" }}>
        <div style={{ padding:"1.5rem 1.75rem", borderBottom:"1px solid rgba(255,255,255,0.08)", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <div style={{ display:"flex", alignItems:"center", gap:12 }}>
            <Avatar name={form.name} size={46}/>
            <div>
              <div style={{ fontSize:15, fontWeight:700, color:C.w }}>{form.name||"Your profile"}</div>
              <div style={{ fontSize:12, color:C.w30, marginTop:2 }}>{form.email}</div>
              <div style={{ marginTop:6 }}><span style={{ fontSize:11, background:"rgba(255,255,255,0.08)", border:"1px solid rgba(255,255,255,0.15)", borderRadius:6, padding:"3px 10px", color:C.w70, fontWeight:600 }}>{plan.label} Plan</span></div>
            </div>
          </div>
          <button onClick={onClose} style={{ ...glassDeep, width:32, height:32, display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", color:C.w50, fontSize:14, borderRadius:9 }}>✕</button>
        </div>
        <div style={{ display:"flex", gap:4, padding:"1rem 1.75rem", borderBottom:"1px solid rgba(255,255,255,0.06)" }}>
          {tabs.map(([id,label])=><button key={id} onClick={()=>setPtab(id)} style={{ background:ptab===id?"rgba(255,255,255,0.1)":"transparent", border:ptab===id?"1px solid rgba(255,255,255,0.18)":"1px solid transparent", borderRadius:8, padding:"7px 14px", fontSize:12, cursor:"pointer", color:ptab===id?C.w80:C.w40, fontFamily:sans, backdropFilter:ptab===id?"blur(10px)":"none" }}>{label}</button>)}
        </div>
        <div style={{ padding:"1.5rem 1.75rem", display:"flex", flexDirection:"column", gap:14 }}>
          {ptab==="profile" && <>
            <div style={{ fontSize:10, color:C.w30, textTransform:"uppercase", letterSpacing:1 }}>Account</div>
            <div style={{ display:"flex", flexWrap:"wrap", gap:10 }}><Field label="Full name" value={form.name} onChange={f("name")} half/><Field label="Email" type="email" value={form.email} onChange={f("email")} half/></div>
            <div style={{ fontSize:10, color:C.w30, textTransform:"uppercase", letterSpacing:1, marginTop:4 }}>Athlete profile</div>
            <div style={{ display:"flex", flexWrap:"wrap", gap:10 }}>
              <Field label="UTR" value={form.utr} onChange={f("utr")} half/><Field label="Grad year" value={form.gradYear} onChange={f("gradYear")} half/>
              <Field label="Location" value={form.location} onChange={f("location")} half/><Field label="GPA" value={form.gpa} onChange={f("gpa")} half/>
              <Field label="Current school" value={form.school} onChange={f("school")} half/><Field label="Academy / Club" value={form.academy} onChange={f("academy")} half/>
              <Field label="Singles record" value={form.singlesRecord} onChange={f("singlesRecord")} half/><Field label="Doubles record" value={form.doublesRecord} onChange={f("doublesRecord")} half/>
            </div>
            <Field label="Playing style" value={form.style} onChange={f("style")} textarea/>
          </>}
          {ptab==="media" && <>
            <div style={{ fontSize:10, color:C.w30, textTransform:"uppercase", letterSpacing:1 }}>Highlight tapes & videos</div>
            <div onDragOver={e=>{e.preventDefault();setDrag(true);}} onDragLeave={()=>setDrag(false)} onDrop={e=>{e.preventDefault();setDrag(false);Array.from(e.dataTransfer.files).filter(f=>f.type.startsWith("video/")).forEach(f=>onAddVideo({type:"file",name:f.name,url:URL.createObjectURL(f),size:f.size,views:0}));}} onClick={()=>ref.current?.click()} style={{ ...glassCard, padding:"28px 16px", textAlign:"center", cursor:"pointer", border:`1px solid ${drag?"rgba(255,255,255,0.35)":"rgba(255,255,255,0.1)"}`, transition:"all 0.2s" }}>
              <input ref={ref} type="file" accept="video/*" multiple style={{ display:"none" }} onChange={e=>Array.from(e.target.files).forEach(f=>onAddVideo({type:"file",name:f.name,url:URL.createObjectURL(f),size:f.size,views:0}))}/>
              <div style={{ fontSize:24, marginBottom:8 }}>🎬</div>
              <div style={{ fontSize:13, color:C.w60 }}>Drag & drop video files</div>
              <div style={{ fontSize:11, color:C.w30, marginTop:4 }}>or click to browse</div>
            </div>
            <div style={{ display:"flex", gap:8 }}>
              <input value={link} onChange={e=>setLink(e.target.value)} onKeyDown={e=>e.key==="Enter"&&link.trim()&&(onAddVideo({type:"link",name:link,url:link,views:0}),setLink(""))} placeholder="Paste Hudl, YouTube, or highlight link..." style={{ flex:1, ...glassDeep, padding:"9px 12px", fontSize:12, color:C.w, outline:"none" }}/>
              <Btn variant="ghost" size="sm" onClick={()=>link.trim()&&(onAddVideo({type:"link",name:link,url:link,views:0}),setLink(""))}>Add</Btn>
            </div>
            {videos.map((v,i)=><div key={i} style={{ ...glassDeep, display:"flex", alignItems:"center", gap:10, padding:"9px 12px" }}>
              <span style={{ fontSize:14 }}>{v.type==="file"?"📹":"🔗"}</span>
              <div style={{ flex:1, minWidth:0 }}><div style={{ fontSize:12, color:C.w80, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{v.name}</div></div>
              <span style={{ fontSize:11, color:C.w50, background:"rgba(255,255,255,0.06)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:6, padding:"3px 8px" }}>👁 {v.views}</span>
              <button onClick={()=>onRemoveVideo(i)} style={{ background:"none", border:"none", color:C.w30, cursor:"pointer", fontSize:14 }}>✕</button>
            </div>)}
          </>}
          {ptab==="billing" && <>
            <div style={{ fontSize:10, color:C.w30, textTransform:"uppercase", letterSpacing:1 }}>Subscription</div>
            <div style={{ ...glassCard, padding:"18px" }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14 }}><div><div style={{ fontSize:16, fontWeight:700, color:C.w }}>{plan.label} Plan</div><div style={{ fontSize:12, color:C.w30, marginTop:2 }}>Active · renews monthly</div></div><Btn variant="primary" size="sm">Upgrade</Btn></div>
              {[["Emails used",`${user.emailsUsed||0}`],["Free included","5"],["Discount",`${plan.discount*100}%`],["Est. charges",`$${Math.max(0,((user.emailsUsed||0)-5)/150*50*(1-plan.discount)).toFixed(2)}`]].map(([l,v])=><div key={l} style={{ display:"flex", justifyContent:"space-between", padding:"7px 0", borderBottom:"1px solid rgba(255,255,255,0.06)" }}><span style={{ fontSize:12, color:C.w30 }}>{l}</span><span style={{ fontSize:12, color:C.w70, fontFamily:mono }}>{v}</span></div>)}
            </div>
          </>}
          {ptab==="security" && <>
            <div style={{ fontSize:10, color:C.w30, textTransform:"uppercase", letterSpacing:1 }}>Security</div>
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

// ── AUTH ───────────────────────────────────────────────────────────────────────
function AuthPage({ mode, onAuth, onSwitch }) {
  const [name,setName]=useState(""); const [email,setEmail]=useState(""); const [pass,setPass]=useState(""); const [loading,setLoading]=useState(false); const [err,setErr]=useState("");
  const handle = async () => { if(!email||!pass||(mode==="signup"&&!name)) return setErr("Please fill in all fields."); setLoading(true); setErr(""); await new Promise(r=>setTimeout(r,700)); onAuth({email,name:name||email.split("@")[0],plan:"free",emailsUsed:0,profileComplete:false}); setLoading(false); };
  return (
    <div style={{ minHeight:"100vh", display:"flex", flexDirection:"column", fontFamily:sans, position:"relative" }}>
      <AnimBG/>
      <div style={{ position:"relative", zIndex:1, padding:"0 2rem", display:"flex", alignItems:"center", height:64 }}>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}><Logo size={24}/><span style={{ fontSize:15, fontWeight:700, color:C.w }}>{APP.name}</span></div>
      </div>
      <div style={{ position:"relative", zIndex:1, flex:1, display:"flex", alignItems:"center", justifyContent:"center", padding:"2rem" }}>
        <div style={{ width:"100%", maxWidth:400 }}>
          <div style={{ textAlign:"center", marginBottom:32 }}>
            <h2 style={{ fontSize:30, fontWeight:800, letterSpacing:"-1px", color:C.w, marginBottom:8 }}>{mode==="login"?"Welcome back":"Create account"}</h2>
            <p style={{ fontSize:13, color:C.w50 }}>{APP.tagline}</p>
          </div>
          <div style={{ ...glassCard, padding:"2rem" }}>
            <div style={{ position:"absolute", top:0, left:"50%", transform:"translateX(-50%)", width:"60%", height:1, background:"linear-gradient(90deg,transparent,rgba(255,255,255,0.3),transparent)" }}/>
            <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
              {mode==="signup" && <Field label="Full name" value={name} onChange={e=>setName(e.target.value)} placeholder="Alex Johnson"/>}
              <Field label="Email" type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@email.com"/>
              <Field label="Password" type="password" value={pass} onChange={e=>setPass(e.target.value)} placeholder="••••••••"/>
              {err && <div style={{ fontSize:12, color:"rgba(239,68,68,0.9)", background:"rgba(239,68,68,0.1)", border:"1px solid rgba(239,68,68,0.2)", borderRadius:8, padding:"8px 12px" }}>{err}</div>}
              {mode==="login" && <div style={{ textAlign:"right" }}><span style={{ fontSize:12, color:C.w40, cursor:"pointer" }}>Forgot password?</span></div>}
              <Btn variant="solid" full onClick={handle} disabled={loading}>{loading?"...":mode==="login"?"Sign in":"Create account"}</Btn>
            </div>
            <div style={{ textAlign:"center", marginTop:"1.25rem", fontSize:13, color:C.w40 }}>{mode==="login"?"No account? ":"Have an account? "}<span onClick={onSwitch} style={{ color:C.w80, cursor:"pointer", fontWeight:600 }}>{mode==="login"?"Sign up":"Sign in"}</span></div>
          </div>
          <div style={{ display:"flex", justifyContent:"center", gap:20, marginTop:20 }}>
            {["1,820+ coaches","5 free emails","AI personalization"].map(t=><div key={t} style={{ fontSize:11, color:C.w30, display:"flex", alignItems:"center", gap:5 }}>✦ {t}</div>)}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── ONBOARDING ─────────────────────────────────────────────────────────────────
function OnboardingPage({ user, onComplete }) {
  const [step,setStep]=useState(0);
  const [form,setForm]=useState({utr:"",gradYear:"",location:"",gpa:"",school:"",academy:"",singlesRecord:"",doublesRecord:"",nationalRank:"",style:""});
  const f = k=>e=>setForm(p=>({...p,[k]:e.target.value}));
  const steps=[
    {title:"Tennis stats",sub:"Key metrics coaches look at first",fields:[["UTR rating *","utr"],["Graduation year *","gradYear"],["GPA","gpa"],["National ranking","nationalRank"]]},
    {title:"Your school",sub:"Where you're playing and training now",fields:[["Current school *","school"],["Academy / Club","academy"],["City / State *","location"],["Singles record","singlesRecord"],["Doubles record","doublesRecord"]]},
    {title:"Your game",sub:"Help our AI write emails that sound like you",fields:[]},
  ];
  const valid = form.utr&&form.gradYear&&form.school&&form.location;
  return (
    <div style={{ minHeight:"100vh", display:"flex", flexDirection:"column", fontFamily:sans, position:"relative" }}>
      <AnimBG/>
      <div style={{ position:"relative", zIndex:1, flex:1, display:"flex", alignItems:"center", justifyContent:"center", padding:"2rem" }}>
        <div style={{ width:"100%", maxWidth:520 }}>
          <div style={{ marginBottom:32 }}>
            <div style={{ display:"flex", justifyContent:"center", marginBottom:20 }}><Logo size={36}/></div>
            <div style={{ display:"flex", gap:6, justifyContent:"center", marginBottom:20 }}>{steps.map((_,i)=><div key={i} style={{ height:3, borderRadius:99, background:i<=step?"rgba(255,255,255,0.7)":"rgba(255,255,255,0.1)", transition:"all 0.3s", width:i===step?32:12 }}/>)}</div>
            <h2 style={{ fontSize:28, fontWeight:800, letterSpacing:"-1px", color:C.w, margin:"0 0 6px", textAlign:"center" }}>{steps[step].title}</h2>
            <p style={{ fontSize:14, color:C.w40, margin:0, textAlign:"center" }}>{steps[step].sub}</p>
          </div>
          <div style={{ ...glassCard, padding:"2rem" }}>
            {step<2
              ? <div style={{ display:"flex", flexWrap:"wrap", gap:10, marginBottom:"1.5rem" }}>{steps[step].fields.map(([l,k])=><Field key={k} label={l} value={form[k]} onChange={f(k)} half/>)}</div>
              : <div style={{ marginBottom:"1.5rem" }}><Field label="Describe your game — style, strengths, surface, goals" value={form.style} onChange={f("style")} textarea/></div>}
            <div style={{ display:"flex", gap:8 }}>
              {step>0 && <Btn variant="ghost" onClick={()=>setStep(s=>s-1)}>← Back</Btn>}
              {step<steps.length-1 ? <Btn variant="solid" full onClick={()=>setStep(s=>s+1)}>Continue →</Btn> : <Btn variant="solid" full onClick={()=>onComplete(form)} disabled={!valid}>{valid?"Enter 10IQ →":"Fill required fields *"}</Btn>}
            </div>
          </div>
          <div style={{ textAlign:"center", marginTop:14, fontSize:11, color:C.w20 }}>5 free emails · no credit card required</div>
        </div>
      </div>
    </div>
  );
}

// ── PAYWALL ─────────────────────────────────────────────────────────────────────
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
        <h2 style={{ fontSize:"clamp(28px,5vw,52px)", fontWeight:800, letterSpacing:"-2px", color:C.w, textAlign:"center", margin:"0 0 12px" }}>Choose Your Plan</h2>
        <p style={{ fontSize:14, color:C.w50, marginBottom:48 }}>Upgrade to keep reaching coaches, {user.name}.</p>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:14, width:"100%", maxWidth:760 }}>
          {plans.map(p=>(
            <div key={p.id} onClick={()=>setSel(p.id)} style={{ ...glassCard, padding:"28px 22px", cursor:"pointer", position:"relative", border:sel===p.id?"1px solid rgba(255,255,255,0.35)":"1px solid rgba(255,255,255,0.1)", boxShadow:sel===p.id?"0 0 0 1px rgba(255,255,255,0.15), 0 8px 40px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.15)":glassCard.boxShadow, transition:"all 0.2s" }}>
              {p.popular && <div style={{ position:"absolute", top:-11, left:"50%", transform:"translateX(-50%)", background:"rgba(255,255,255,0.15)", backdropFilter:"blur(10px)", border:"1px solid rgba(255,255,255,0.25)", borderRadius:99, padding:"3px 13px", fontSize:9, fontWeight:700, color:C.w80, whiteSpace:"nowrap", letterSpacing:1 }}>RECRUITERS' CHOICE</div>}
              <div style={{ fontSize:12, fontWeight:600, color:C.w50, marginBottom:3, textTransform:"uppercase", letterSpacing:0.5 }}>{p.name}</div>
              <div style={{ fontSize:10, color:C.w30, marginBottom:14 }}>{p.desc}</div>
              <div style={{ fontSize:38, fontWeight:800, color:C.w, fontFamily:mono, letterSpacing:"-2px", marginBottom:20 }}>{p.price}<span style={{ fontSize:13, fontWeight:400, color:C.w30 }}>/mo</span></div>
              <div style={{ display:"flex", flexDirection:"column", gap:8, marginBottom:22 }}>{p.features.map(ft=><div key={ft} style={{ display:"flex", gap:8 }}><span style={{ fontSize:11, color:C.w30 }}>✓</span><span style={{ fontSize:12, color:C.w70 }}>{ft}</span></div>)}</div>
              <Btn variant={sel===p.id?"solid":"primary"} full onClick={e=>{ e.stopPropagation(); setSel(p.id); }}>Select {p.name}</Btn>
            </div>
          ))}
        </div>
        <div style={{ marginTop:28 }}>
          <Btn variant="solid" size="lg" onClick={async()=>{ setLoading(true); await new Promise(r=>setTimeout(r,800)); onUnlock(sel); setLoading(false); }} disabled={loading}>{loading?"Processing...":`Continue with ${plans.find(p=>p.id===sel)?.name} →`}</Btn>
        </div>
        <div style={{ marginTop:12, fontSize:11, color:C.w20 }}>No credit card required · Cancel anytime</div>
      </div>
    </div>
  );
}

// ── HOME PAGE ─────────────────────────────────────────────────────────────────
function HomePage({ onEnter }) {
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
      {/* NAV */}
      <div style={{ position:"relative", zIndex:10, maxWidth:1100, margin:"0 auto", padding:"0 2rem", display:"flex", alignItems:"center", justifyContent:"space-between", height:64 }}>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}><Logo size={26}/><span style={{ fontSize:17, fontWeight:700, color:C.w }}>{APP.name}</span></div>
        <div style={{ display:"flex", gap:8 }}>
          <Btn variant="ghost" size="sm" onClick={onEnter}>Sign in</Btn>
          <Btn variant="solid" size="sm" onClick={onEnter}>Get started</Btn>
        </div>
      </div>
      <div style={{ position:"relative", zIndex:1, height:1, background:"rgba(255,255,255,0.08)" }}/>

      {/* HERO */}
      <div style={{ position:"relative", zIndex:1, maxWidth:1100, margin:"0 auto", padding:"110px 2rem 90px", textAlign:"center" }}>
        <div style={{ display:"inline-block", ...glassCard, padding:"5px 16px", fontSize:11, color:C.w50, marginBottom:28, letterSpacing:1, textTransform:"uppercase", borderRadius:99 }}>College Tennis Recruiting Platform</div>
        <h1 style={{ fontSize:"clamp(42px,7vw,82px)", fontWeight:800, letterSpacing:"-3px", lineHeight:1.05, margin:"0 0 24px", color:C.w }}>Your All-in-One<br/><span style={{ color:C.w40 }}>Recruiting Companion</span></h1>
        <p style={{ fontSize:17, color:C.w50, maxWidth:520, margin:"0 auto 40px", lineHeight:1.65 }}>Reach every college tennis coach in the country with AI-personalized emails — automatically.</p>
        <div style={{ display:"flex", gap:12, justifyContent:"center", flexWrap:"wrap" }}>
          <Btn variant="solid" size="lg" onClick={onEnter}>Get Started Now</Btn>
          <Btn variant="primary" size="lg" onClick={onEnter}>See how it works →</Btn>
        </div>
        {/* Mock preview */}
        <div style={{ ...glassCard, marginTop:64, padding:"24px", textAlign:"left", maxWidth:860, margin:"64px auto 0" }}>
          <div style={{ position:"absolute", top:0, left:"50%", transform:"translateX(-50%)", width:"50%", height:1, background:"linear-gradient(90deg,transparent,rgba(255,255,255,0.4),transparent)" }}/>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr 1fr", gap:10, marginBottom:14 }}>
            {[["Total Coaches","1,820"],["Emails Sent","0"],["Open Rate","0%"],["Replies","0"]].map(([l,v])=>(
              <div key={l} style={{ ...glassDeep, padding:"14px 16px", textAlign:"center" }}>
                <div style={{ fontSize:10, color:C.w30, marginBottom:6, textTransform:"uppercase", letterSpacing:0.8 }}>{l}</div>
                <div style={{ fontSize:22, fontWeight:800, color:C.w, fontFamily:mono }}>{v}</div>
              </div>
            ))}
          </div>
          <div style={{ ...glassDeep, padding:"13px 16px", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
            <span style={{ fontSize:12, color:C.w50 }}>Ready to send your first recruiting email?</span>
            <Btn variant="solid" size="sm" onClick={onEnter}>Start free →</Btn>
          </div>
        </div>
      </div>

      {/* STATS BAND */}
      <div style={{ position:"relative", zIndex:1, borderTop:"1px solid rgba(255,255,255,0.06)", borderBottom:"1px solid rgba(255,255,255,0.06)" }}>
        <div style={{ ...glass, borderRadius:0, maxWidth:1100, margin:"0 auto", display:"grid", gridTemplateColumns:"repeat(4,1fr)" }}>
          {stats.map((s,i)=>(
            <div key={i} style={{ padding:"28px 0", textAlign:"center", borderRight:i<stats.length-1?"1px solid rgba(255,255,255,0.06)":"none" }}>
              <div style={{ fontSize:32, fontWeight:800, color:C.w, fontFamily:mono, letterSpacing:"-1px" }}>{s.n}</div>
              <div style={{ fontSize:12, color:C.w40, marginTop:4 }}>{s.l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* FEATURES */}
      <div style={{ position:"relative", zIndex:1, maxWidth:1100, margin:"0 auto", padding:"80px 2rem" }}>
        <div style={{ textAlign:"center", marginBottom:56 }}>
          <h2 style={{ fontSize:"clamp(28px,4vw,48px)", fontWeight:800, letterSpacing:"-2px", margin:"0 0 14px" }}>Features & Benefits</h2>
          <p style={{ fontSize:15, color:C.w50, maxWidth:480, margin:"0 auto" }}>Everything you need to run a world-class recruiting campaign.</p>
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:14 }}>
          {features.map((ft,i)=>(
            <div key={i} onMouseEnter={()=>setHov(i)} onMouseLeave={()=>setHov(null)} style={{ ...glassCard, padding:"28px 24px", transition:"all 0.25s", border:hov===i?"1px solid rgba(255,255,255,0.22)":"1px solid rgba(255,255,255,0.1)", boxShadow:hov===i?"0 12px 40px rgba(0,0,0,0.5),inset 0 1px 0 rgba(255,255,255,0.15)":glassCard.boxShadow }}>
              <div style={{ fontSize:26, marginBottom:14 }}>{ft.icon}</div>
              <div style={{ fontSize:16, fontWeight:700, color:C.w, marginBottom:8 }}>{ft.title}</div>
              <div style={{ fontSize:13, color:C.w50, lineHeight:1.6 }}>{ft.sub}</div>
            </div>
          ))}
        </div>
      </div>

      {/* PRICING */}
      <div style={{ position:"relative", zIndex:1, borderTop:"1px solid rgba(255,255,255,0.06)" }}>
        <div style={{ maxWidth:1100, margin:"0 auto", padding:"80px 2rem" }}>
          <div style={{ textAlign:"center", marginBottom:52 }}>
            <h2 style={{ fontSize:"clamp(28px,4vw,48px)", fontWeight:800, letterSpacing:"-2px", margin:"0 0 14px" }}>Choose Your Plan</h2>
            <p style={{ fontSize:15, color:C.w50, maxWidth:400, margin:"0 auto" }}>Start free, upgrade when you're ready to go all-in.</p>
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:14, maxWidth:820, margin:"0 auto" }}>
            {[{n:"Free",p:"$0",d:"Try for free",f:["5 free emails","Coach browser","Basic filters","AI generator"],b:"Get started free"},{n:"Pro",p:"$59",d:"Most popular",pop:true,f:["Unlimited emails","20% discount","AI advisor","Full analytics","Follow-ups"],b:"Get Pro Access"},{n:"Elite",p:"$99",d:"Full concierge",f:["Everything in Pro","35% discount","Done-for-you","Strategy call","Scholarship scoring"],b:"Get Elite Access"}].map((p,i)=>(
              <div key={i} style={{ ...glassCard, padding:"28px 22px", position:"relative" }}>
                {p.pop && <div style={{ position:"absolute", top:-11, left:"50%", transform:"translateX(-50%)", ...glass, borderRadius:99, padding:"3px 13px", fontSize:9, fontWeight:700, color:C.w80, whiteSpace:"nowrap", letterSpacing:1 }}>RECRUITERS' CHOICE</div>}
                <div style={{ fontSize:12, color:C.w50, marginBottom:3, textTransform:"uppercase", letterSpacing:0.5 }}>{p.n}</div>
                <div style={{ fontSize:10, color:C.w30, marginBottom:14 }}>{p.d}</div>
                <div style={{ fontSize:38, fontWeight:800, color:C.w, fontFamily:mono, letterSpacing:"-2px", marginBottom:20 }}>{p.p}<span style={{ fontSize:12, color:C.w30 }}>/mo</span></div>
                <div style={{ display:"flex", flexDirection:"column", gap:8, marginBottom:22 }}>{p.f.map(ft=><div key={ft} style={{ display:"flex", gap:8 }}><span style={{ fontSize:11, color:C.w30 }}>✓</span><span style={{ fontSize:12, color:C.w70 }}>{ft}</span></div>)}</div>
                <Btn variant={p.pop?"solid":"primary"} full onClick={onEnter}>{p.b}</Btn>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA */}
      <div style={{ position:"relative", zIndex:1, borderTop:"1px solid rgba(255,255,255,0.06)" }}>
        <div style={{ maxWidth:1100, margin:"0 auto", padding:"80px 2rem", textAlign:"center" }}>
          <h2 style={{ fontSize:"clamp(28px,5vw,60px)", fontWeight:800, letterSpacing:"-2px", margin:"0 0 20px", lineHeight:1.1 }}>Your All-in-One<br/><span style={{ color:C.w40 }}>Recruiting Companion</span></h2>
          <p style={{ fontSize:15, color:C.w50, maxWidth:400, margin:"0 auto 36px", lineHeight:1.65 }}>Stop sending emails one by one. Let 10IQ reach every coach — automatically.</p>
          <Btn variant="solid" size="lg" onClick={onEnter}>Get Started Now</Btn>
        </div>
      </div>
      <div style={{ position:"relative", zIndex:1, borderTop:"1px solid rgba(255,255,255,0.06)", padding:"22px 2rem", textAlign:"center" }}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:8, marginBottom:6 }}><Logo size={16}/><span style={{ fontSize:13, fontWeight:700 }}>{APP.name}</span></div>
        <div style={{ fontSize:11, color:C.w20 }}>© 2026 {APP.name}. College tennis recruiting, automated.</div>
      </div>
    </div>
  );
}

// ── MAIN APP ───────────────────────────────────────────────────────────────────
const TABS=[{id:0,label:"Dashboard"},{id:1,label:"Coaches"},{id:2,label:"AI Advisor"}];
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
        if(!r.ok){ setLoadErr(`DB error ${r.status} — Run: CREATE POLICY "public_read" ON coaches_database FOR SELECT USING (true);`); break; }
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
    try { const txt=await callClaude([{role:"user",content:`Recruiting email.\nATHLETE: ${JSON.stringify({...user,videos:videos.map(v=>v.url).join(", ")})}\nCOACH: ${coach.coach_name}, ${coach.school_name}, ${coach.division}, UTR:${coach.team_utr||"N/A"}\n150-200 words, confident, specific.`}],`Expert tennis recruiting email writer. Output JSON only: {"subject":"...","body":"..."}`);
      setGenEmails(p=>({...p,[coach.email]:JSON.parse(txt.replace(/```json|```/g,"").trim())}));
    } catch(e){ alert("Failed: "+e.message); } setGenerating(null);
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
    try { const r=await callClaude(next,`Elite tennis recruiting advisor. ${coaches.length} coaches. Athlete: ${JSON.stringify(user)}. Sample: ${JSON.stringify(coaches.slice(0,30))}. Be specific.`); setAiChat(p=>[...p,{role:"assistant",content:r}]); }
    catch{ setAiChat(p=>[...p,{role:"assistant",content:"Error — try again."}]); } setAiLoading(false);
  };

  const gInp = { ...glassDeep, padding:"9px 13px", fontSize:13, color:C.w, outline:"none", boxSizing:"border-box", fontFamily:sans };
  const selInp = { ...gInp, cursor:"pointer", width:"100%" };
  const navBtn = active => ({ background:active?"rgba(255,255,255,0.1)":"transparent", backdropFilter:active?"blur(10px)":"none", border:active?"1px solid rgba(255,255,255,0.18)":"1px solid transparent", borderRadius:9, padding:"8px 16px", fontSize:13, cursor:"pointer", color:active?C.w80:C.w40, fontFamily:sans, transition:"all 0.15s" });
  const sentC=coaches.filter(c=>c.email_sent);
  const openRate=stats.sent?Math.round((stats.opened/stats.sent)*100):0;
  const replyRate=stats.sent?Math.round((stats.replied/stats.sent)*100):0;

  return (
    <div style={{ minHeight:"100vh", color:C.w, fontFamily:sans, position:"relative" }}>
      <AnimBG/>
      {/* TOPBAR */}
      <div style={{ position:"sticky", top:0, zIndex:100, borderBottom:"1px solid rgba(255,255,255,0.06)", background:"rgba(8,8,8,0.6)", backdropFilter:"blur(24px)", WebkitBackdropFilter:"blur(24px)" }}>
        <div style={{ maxWidth:960, margin:"0 auto", padding:"0 1.5rem", display:"grid", gridTemplateColumns:"1fr auto 1fr", alignItems:"center", height:58 }}>
          <div><span style={{ fontSize:11, background:"rgba(255,255,255,0.08)", border:"1px solid rgba(255,255,255,0.15)", borderRadius:6, padding:"4px 10px", color:C.w70, fontWeight:600 }}>{APP.pricing.plans[user.plan]?.label||"Free"}</span></div>
          <div onClick={onHome} style={{ display:"flex", alignItems:"center", gap:9, cursor:"pointer" }}><Logo size={24}/><span style={{ fontSize:16, fontWeight:800, letterSpacing:"-0.5px", color:C.w }}>{APP.name}</span></div>
          <div style={{ display:"flex", justifyContent:"flex-end" }}>
            <div onClick={()=>setShowProfile(true)} style={{ display:"flex", alignItems:"center", gap:9, ...glass, borderRadius:10, padding:"6px 14px", cursor:"pointer", transition:"all 0.2s" }} onMouseEnter={e=>e.currentTarget.style.background="rgba(255,255,255,0.09)"} onMouseLeave={e=>e.currentTarget.style.background="rgba(255,255,255,0.045)"}>
              <Avatar name={user.name} size={26}/><span style={{ fontSize:13, color:C.w70 }}>{user.name}</span><span style={{ fontSize:10, color:C.w30 }}>▾</span>
            </div>
          </div>
        </div>
        <div style={{ maxWidth:960, margin:"0 auto", padding:"0 1.5rem", display:"flex", gap:2, paddingBottom:8 }}>
          {TABS.map(t=><button key={t.id} onClick={()=>setTab(t.id)} style={navBtn(tab===t.id)}>{t.label}</button>)}
        </div>
      </div>

      <div style={{ position:"relative", zIndex:1, maxWidth:960, margin:"0 auto", padding:"2rem 1.5rem" }}>

        {/* ══ DASHBOARD ══ */}
        {tab===0 && <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(5,1fr)", gap:10 }}>
            {[["Coaches",stats.total],["Sent",stats.sent],["Opened",stats.opened],["Replied",stats.replied],["Pending",stats.total-stats.sent]].map(([l,v])=><StatCard key={l} label={l} value={v.toLocaleString()}/>)}
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
            <div style={{ ...glassCard, padding:"18px" }}>
              <div style={{ fontSize:10, fontWeight:600, color:C.w30, textTransform:"uppercase", letterSpacing:1, marginBottom:16 }}>Outreach funnel</div>
              {[["In database",stats.total,stats.total],["Emails sent",stats.sent,stats.total],["Opened",stats.opened,stats.total],["Replied",stats.replied,stats.total]].map(([l,v,tot])=>{ const pct=tot?Math.round((v/tot)*100):0; return <div key={l} style={{ marginBottom:14 }}><div style={{ display:"flex", justifyContent:"space-between", marginBottom:6 }}><span style={{ fontSize:12, color:C.w60 }}>{l}</span><span style={{ fontSize:12, color:C.w80, fontFamily:mono }}>{v.toLocaleString()} <span style={{ color:C.w20 }}>({pct}%)</span></span></div><GlassBar pct={pct}/></div>; })}
            </div>
            <div style={{ ...glassCard, padding:"18px" }}>
              <div style={{ fontSize:10, fontWeight:600, color:C.w30, textTransform:"uppercase", letterSpacing:1, marginBottom:16 }}>By division</div>
              {Object.entries(DIV_C).map(([div,color])=>{ const cnt=coaches.filter(c=>c.division===div).length; const s=coaches.filter(c=>c.division===div&&c.email_sent).length; const pct=stats.total?Math.round((cnt/stats.total)*100):0; return <div key={div} style={{ marginBottom:13 }}><div style={{ display:"flex", justifyContent:"space-between", marginBottom:5 }}><span style={{ fontSize:12, color:C.w60 }}>{div}</span><span style={{ fontSize:11, color:C.w30, fontFamily:mono }}>{s}/{cnt}</span></div><GlassBar pct={pct} color={color}/></div>; })}
            </div>
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:10 }}>
            {[["Open rate",`${openRate}%`],["Reply rate",`${replyRate}%`],["Videos",`${videos.length}`]].map(([l,v])=><StatCard key={l} label={l} value={v}/>)}
          </div>
          {selected.length>0 && <div style={{ ...glassCard, padding:"18px" }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14 }}>
              <div style={{ fontSize:14, fontWeight:600 }}>{selected.length} selected for outreach</div>
              <div style={{ display:"flex", gap:8 }}>{!canSend()&&<span style={{ fontSize:11, color:"rgba(239,68,68,0.9)", background:"rgba(239,68,68,0.1)", border:"1px solid rgba(239,68,68,0.2)", borderRadius:6, padding:"4px 10px" }}>Email limit reached</span>}<button onClick={()=>setSelected([])} style={{ background:"none", border:"none", color:C.w30, cursor:"pointer", fontSize:12, fontFamily:sans }}>Clear all</button></div>
            </div>
            <div style={{ display:"flex", flexDirection:"column", gap:10, maxHeight:400, overflowY:"auto" }}>
              {selected.map(coach=>{ const em=genEmails[coach.email]; const isGen=generating===coach.email; const isSend=sending[coach.email]; return <div key={coach.email} style={{ ...glassDeep, padding:"12px 14px" }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:em?10:0 }}>
                  <div style={{ flex:1, minWidth:0 }}><div style={{ fontSize:13, fontWeight:600, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{coach.school_name}</div><div style={{ fontSize:11, color:C.w30, marginTop:2 }}>{coach.coach_name} · <span style={{ color:dC(coach.division) }}>{coach.division}</span></div></div>
                  <div style={{ display:"flex", gap:6, flexShrink:0, marginLeft:8 }}>
                    <Btn variant="ghost" size="sm" onClick={()=>generateEmail(coach)} disabled={isGen}>{isGen?"...":em?"↺":"Generate"}</Btn>
                    {em&&<Btn variant={coach.email_sent?"ghost":"primary"} size="sm" onClick={()=>sendEmail(coach)} disabled={isSend||coach.email_sent||!canSend()}>{isSend?"Sending...":coach.email_sent?"Sent ✓":"Send"}</Btn>}
                  </div>
                </div>
                {em&&<div style={{ ...glassDeep, padding:"10px 13px", marginTop:4 }}><div style={{ fontSize:11, color:C.w60, marginBottom:5, fontWeight:500 }}>Subject: {em.subject}</div><div style={{ fontSize:12, color:C.w50, lineHeight:1.75, whiteSpace:"pre-wrap" }}>{em.body}</div></div>}
              </div>; })}
            </div>
          </div>}
          <div style={{ ...glassCard, overflow:"hidden" }}>
            <div style={{ padding:"14px 18px", borderBottom:"1px solid rgba(255,255,255,0.06)", display:"flex", justifyContent:"space-between" }}><div style={{ fontSize:10, fontWeight:600, color:C.w30, textTransform:"uppercase", letterSpacing:1 }}>Sent emails</div><span style={{ fontSize:11, color:C.w20, fontFamily:mono }}>{sentC.length}</span></div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr 80px 65px 65px 65px", padding:"9px 18px", borderBottom:"1px solid rgba(255,255,255,0.04)", background:"rgba(255,255,255,0.02)" }}>{["School","Coach","Subject","Date","Opened","Video","Replied"].map(h=><div key={h} style={{ fontSize:10, color:C.w20, textTransform:"uppercase", letterSpacing:0.7 }}>{h}</div>)}</div>
            {sentC.length===0?<div style={{ padding:"3rem", textAlign:"center", color:C.w20, fontSize:13 }}>No emails sent yet</div>:sentC.slice(0,30).map((c,i)=>{ const vO=Math.floor(Math.random()*7); return <div key={i} onClick={()=>setSelCoach(c)} style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr 80px 65px 65px 65px", padding:"11px 18px", borderBottom:i<sentC.length-1?"1px solid rgba(255,255,255,0.04)":"none", cursor:"pointer", transition:"background 0.1s", alignItems:"center" }} onMouseEnter={e=>e.currentTarget.style.background="rgba(255,255,255,0.03)"} onMouseLeave={e=>e.currentTarget.style.background="transparent"}><div style={{ fontSize:13, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", paddingRight:8 }}>{c.school_name}</div><div style={{ fontSize:12, color:C.w50, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", paddingRight:8 }}>{c.coach_name}</div><div style={{ fontSize:12, color:C.w30, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", paddingRight:8 }}>{c.email_subject||"—"}</div><div style={{ fontSize:11, color:C.w30, fontFamily:mono }}>{c.email_sent_at?new Date(c.email_sent_at).toLocaleDateString():"—"}</div><span style={{ fontSize:10, padding:"3px 8px", borderRadius:6, background:c.email_opened?"rgba(255,255,255,0.08)":"transparent", border:`1px solid ${c.email_opened?"rgba(255,255,255,0.15)":"transparent"}`, color:c.email_opened?C.w70:C.w20 }}>{c.email_opened?"Yes":"—"}</span><div style={{ fontSize:12, color:vO>0?C.w70:C.w20, fontFamily:mono }}>{vO>0?`${vO}×`:"—"}</div><span style={{ fontSize:10, padding:"3px 8px", borderRadius:6, background:c.replied?"rgba(255,255,255,0.08)":"transparent", border:`1px solid ${c.replied?"rgba(255,255,255,0.15)":"transparent"}`, color:c.replied?C.w70:C.w20 }}>{c.replied?"Yes":"—"}</span></div>; })}
          </div>
        </div>}

        {/* ══ COACHES ══ */}
        {tab===1 && <div>
          <div style={{ display:"flex", gap:8, marginBottom:10 }}>
            <div style={{ flex:1, position:"relative" }}>
              <span style={{ position:"absolute", left:12, top:"50%", transform:"translateY(-50%)", color:C.w30, fontSize:14 }}>⌕</span>
              <input style={{ ...gInp, width:"100%", paddingLeft:34 }} placeholder={`Search ${coaches.length.toLocaleString()} coaches...`} value={search} onChange={e=>setSearch(e.target.value)}/>
            </div>
            <button onClick={()=>setFiltersOpen(o=>!o)} style={{ ...glass, borderRadius:9, padding:"9px 16px", fontSize:12, color:filtersOpen||hasFilters?C.w80:C.w40, cursor:"pointer", fontFamily:sans, display:"flex", alignItems:"center", gap:6, border:filtersOpen||hasFilters?"1px solid rgba(255,255,255,0.25)":"1px solid rgba(255,255,255,0.1)", whiteSpace:"nowrap" }}>⚙ Filters{hasFilters?" (on)":""}</button>
          </div>
          {filtersOpen && <div style={{ ...glassCard, padding:"18px", marginBottom:12 }}>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:10, marginBottom:12 }}>
              {[["Division",<select style={selInp} value={fDiv} onChange={e=>setFDiv(e.target.value)}>{divs.map(d=><option key={d} style={{ background:"#1a1a1a" }}>{d}</option>)}</select>],["Email status",<select style={selInp} value={fEmail} onChange={e=>setFEmail(e.target.value)}>{["All","Sent","Not sent"].map(o=><option key={o} style={{ background:"#1a1a1a" }}>{o}</option>)}</select>],["Reply status",<select style={selInp} value={fReply} onChange={e=>setFReply(e.target.value)}>{["All","Replied","No reply"].map(o=><option key={o} style={{ background:"#1a1a1a" }}>{o}</option>)}</select>],["Region",<input style={selInp} placeholder="e.g. California..." value={fRegion} onChange={e=>setFRegion(e.target.value)}/>]].map(([l,el])=><div key={l} style={{ display:"flex", flexDirection:"column", gap:5 }}><label style={{ fontSize:10, color:C.w30, textTransform:"uppercase", letterSpacing:0.8 }}>{l}</label>{el}</div>)}
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:10, marginBottom:12 }}>
              {[["UTR min",fUtrMin,setFUtrMin,"8.0"],["UTR max",fUtrMax,setFUtrMax,"14.0"],["WTN min",fWtnMin,setFWtnMin,"5"],["WTN max",fWtnMax,setFWtnMax,"25"]].map(([l,v,sv,ph])=><div key={l} style={{ display:"flex", flexDirection:"column", gap:5 }}><label style={{ fontSize:10, color:C.w30, textTransform:"uppercase", letterSpacing:0.8 }}>{l}</label><input style={selInp} type="number" placeholder={ph} value={v} onChange={e=>sv(e.target.value)}/></div>)}
            </div>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
              <span style={{ fontSize:12, color:C.w50, fontFamily:mono }}>{filtered.length.toLocaleString()} coaches match</span>
              {hasFilters&&<button onClick={clearFilters} style={{ background:"none", border:"none", color:C.w50, cursor:"pointer", fontSize:12, fontFamily:sans }}>✕ Clear all</button>}
            </div>
          </div>}
          <div style={{ display:"flex", gap:8, marginBottom:10 }}>
            <span style={{ fontSize:12, color:C.w30, ...glass, borderRadius:7, padding:"5px 12px", fontFamily:mono }}>{filtered.length.toLocaleString()} coaches</span>
            {selected.length>0&&<span onClick={()=>setTab(0)} style={{ fontSize:12, color:C.w70, ...glass, borderRadius:7, padding:"5px 12px", cursor:"pointer", border:"1px solid rgba(255,255,255,0.18)" }}>{selected.length} selected → dashboard</span>}
          </div>
          {loadErr&&<div style={{ color:"rgba(245,158,11,0.9)", fontSize:12, background:"rgba(245,158,11,0.08)", border:"1px solid rgba(245,158,11,0.2)", borderRadius:10, padding:"12px 16px", marginBottom:12, lineHeight:1.6 }}>⚠ {loadErr}</div>}
          {loading?<div style={{ textAlign:"center", padding:"4rem", color:C.w20 }}>Loading coaches...</div>
            :coaches.length===0&&!loadErr?<div style={{ textAlign:"center", padding:"4rem" }}><div style={{ fontSize:13, color:C.w20, marginBottom:12 }}>No coaches loaded.</div><div style={{ ...glassCard, fontSize:11, padding:"14px 18px", textAlign:"left", maxWidth:520, margin:"0 auto", lineHeight:1.8 }}>Run in Supabase SQL Editor:<br/><code style={{ color:"rgba(0,210,170,0.9)", fontFamily:mono }}>CREATE POLICY "public_read" ON coaches_database FOR SELECT USING (true);</code></div></div>
            :<div style={{ ...glassCard, overflow:"hidden" }}>
              <div style={{ display:"grid", gridTemplateColumns:"28px 1fr 1fr 100px 65px 65px 80px", padding:"10px 16px", borderBottom:"1px solid rgba(255,255,255,0.06)", background:"rgba(255,255,255,0.02)" }}>{["","School","Coach","Division","UTR","WTN","Status"].map((h,i)=><div key={i} style={{ fontSize:10, color:C.w20, textTransform:"uppercase", letterSpacing:0.7 }}>{h}</div>)}</div>
              {paged.length===0?<div style={{ padding:"2rem", textAlign:"center", color:C.w20, fontSize:13 }}>No coaches match</div>
                :paged.map((c,i)=>{ const isSel=!!selected.find(x=>x.email===c.email); return <div key={c.email+i} style={{ display:"grid", gridTemplateColumns:"28px 1fr 1fr 100px 65px 65px 80px", padding:"11px 16px", borderBottom:i<paged.length-1?"1px solid rgba(255,255,255,0.04)":"none", background:isSel?"rgba(255,255,255,0.04)":"transparent", cursor:"pointer", alignItems:"center", transition:"background 0.1s" }} onMouseEnter={e=>e.currentTarget.style.background=isSel?"rgba(255,255,255,0.04)":"rgba(255,255,255,0.02)"} onMouseLeave={e=>e.currentTarget.style.background=isSel?"rgba(255,255,255,0.04)":"transparent"}>
                  <div onClick={e=>{e.stopPropagation();toggleSel(c);}} style={{ width:14, height:14, borderRadius:3, border:`1.5px solid ${isSel?"rgba(255,255,255,0.7)":"rgba(255,255,255,0.2)"}`, background:isSel?"rgba(255,255,255,0.85)":"transparent", backdropFilter:"blur(4px)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:9, color:"#0a0a0a", flexShrink:0 }}>{isSel?"✓":""}</div>
                  <div onClick={()=>setSelCoach(c)} style={{ fontSize:13, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", paddingRight:8 }}>{c.school_name||"—"}</div>
                  <div onClick={()=>setSelCoach(c)} style={{ fontSize:12, color:C.w50, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", paddingRight:8 }}>{c.coach_name||"—"}</div>
                  <div onClick={()=>setSelCoach(c)} style={{ fontSize:11, color:dC(c.division), fontWeight:500 }}>{c.division||"—"}</div>
                  <div onClick={()=>setSelCoach(c)} style={{ fontSize:12, color:C.w40, fontFamily:mono }}>{c.team_utr?Number(c.team_utr).toFixed(1):"—"}</div>
                  <div onClick={()=>setSelCoach(c)} style={{ fontSize:12, color:C.w40, fontFamily:mono }}>{c.team_wtn?Number(c.team_wtn).toFixed(1):"—"}</div>
                  <div onClick={()=>setSelCoach(c)}><span style={{ fontSize:10, padding:"3px 9px", borderRadius:99, background:`rgba(255,255,255,${c.replied?0.1:c.email_sent?0.07:0.03})`, border:`1px solid rgba(255,255,255,${c.replied?0.25:c.email_sent?0.15:0.08})`, color:c.replied?C.w80:c.email_sent?C.w60:C.w30 }}>{c.replied?"Replied":c.email_sent?"Sent":"Pending"}</span></div>
                </div>; })}
            </div>}
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginTop:12 }}>
            <Btn variant="ghost" size="sm" onClick={()=>setPage(p=>Math.max(0,p-1))} disabled={page===0}>← Prev</Btn>
            <span style={{ fontSize:12, color:C.w30, fontFamily:mono }}>Page {page+1} / {Math.max(1,totalPages)}</span>
            <Btn variant="ghost" size="sm" onClick={()=>setPage(p=>Math.min(totalPages-1,p+1))} disabled={page>=totalPages-1}>Next →</Btn>
          </div>
        </div>}

        {/* ══ AI ADVISOR ══ */}
        {tab===2 && <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
          <div ref={chatRef} style={{ ...glassCard, padding:16, minHeight:360, maxHeight:480, overflowY:"auto", display:"flex", flexDirection:"column", gap:12 }}>
            {aiChat.length===0&&<div style={{ textAlign:"center", padding:"3rem 1rem" }}>
              <div style={{ fontSize:32, marginBottom:12 }}>◈</div>
              <div style={{ fontSize:14, color:C.w40, marginBottom:20 }}>Ask about fit, schools, strategy, or recruiting timelines</div>
              <div style={{ display:"flex", flexWrap:"wrap", gap:8, justifyContent:"center" }}>{["Which D1 schools match my UTR?","Best D3 outreach strategy?","When to start recruiting?","Roster needs by division?"].map(q=><button key={q} onClick={()=>setAiInput(q)} style={{ ...glass, borderRadius:9, padding:"8px 14px", fontSize:12, color:C.w50, cursor:"pointer", fontFamily:sans }}>{q}</button>)}</div>
            </div>}
            {aiChat.map((m,i)=><div key={i} style={{ display:"flex", justifyContent:m.role==="user"?"flex-end":"flex-start", gap:10, alignItems:"flex-start" }}>
              {m.role==="assistant"&&<div style={{ width:28, height:28, borderRadius:8, ...glass, display:"flex", alignItems:"center", justifyContent:"center", fontSize:13, flexShrink:0 }}>◈</div>}
              <div style={{ ...glassDeep, padding:"11px 14px", maxWidth:"80%", fontSize:13, lineHeight:1.7, color:m.role==="user"?C.w80:C.w60, whiteSpace:"pre-wrap", background:m.role==="user"?"rgba(255,255,255,0.07)":"rgba(255,255,255,0.03)", border:`1px solid ${m.role==="user"?"rgba(255,255,255,0.18)":"rgba(255,255,255,0.08)"}` }}>{m.content}</div>
            </div>)}
            {aiLoading&&<div style={{ display:"flex", gap:10 }}><div style={{ width:28, height:28, borderRadius:8, ...glass, display:"flex", alignItems:"center", justifyContent:"center", fontSize:13 }}>◈</div><div style={{ ...glassDeep, padding:"11px 14px", fontSize:13, color:C.w30 }}>Thinking...</div></div>}
          </div>
          <div style={{ display:"flex", gap:8 }}>
            <input style={{ ...gInp, flex:1 }} placeholder="Ask about fit, schools, strategy..." value={aiInput} onChange={e=>setAiInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&sendAi()}/>
            <Btn variant="solid" onClick={sendAi} disabled={aiLoading}>Send →</Btn>
          </div>
        </div>}
      </div>

      {selCoach&&<CoachDrawer coach={selCoach} onClose={()=>setSelCoach(null)}/>}
      {showProfile&&<ProfileModal user={user} videos={videos} onClose={()=>setShowProfile(false)} onSave={onUpdateUser} onLogout={onLogout} onAddVideo={v=>setVideos(p=>[...p,v])} onRemoveVideo={i=>setVideos(p=>p.filter((_,idx)=>idx!==i))}/>}
    </div>
  );
}

// ── ROOT ───────────────────────────────────────────────────────────────────────
export default function Root() {
  const [screen,setScreen]=useState("home");
  const [user,setUser]=useState(null);
  const goEnter=()=>setScreen(user?"app":"login");
  const handleAuth=u=>{ setUser(u); setScreen("onboard"); };
  const handleOnboard=p=>{ setUser(u=>({...u,...p,profileComplete:true})); setScreen("app"); };
  const handleUpgrade=()=>setScreen("paywall");
  const handleUnlock=pl=>{ setUser(u=>({...u,plan:pl})); setScreen("app"); };
  const handleLogout=()=>{ setUser(null); setScreen("home"); };
  const handleUpdate=upd=>setUser(u=>({...u,...upd}));
  if(screen==="home")    return <HomePage onEnter={goEnter}/>;
  if(screen==="login")   return <AuthPage mode="login"  onAuth={handleAuth} onSwitch={()=>setScreen("signup")}/>;
  if(screen==="signup")  return <AuthPage mode="signup" onAuth={handleAuth} onSwitch={()=>setScreen("login")}/>;
  if(screen==="onboard") return <OnboardingPage user={user} onComplete={handleOnboard}/>;
  if(screen==="paywall") return <PaywallPage user={user} onUnlock={handleUnlock}/>;
  return <MainApp user={user} onUpdateUser={handleUpdate} onLogout={handleLogout} onNeedUpgrade={handleUpgrade} onHome={()=>setScreen("home")}/>;
}
