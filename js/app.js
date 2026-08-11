import {
  auth,onAuthStateChanged,registerUser,loginUser,logoutUser,getProfile,
  ensureFamily,createPartnerInvite,joinFamilyWithInvite,removePartner,leaveFamily,
  loadFamilyMembers,saveFamily,addCheckin,addBabyActivity,loadCheckins,loadBabyActivity
} from "./firebase.js";

const KEY="bloom_ui_preferences_v1";
let state=JSON.parse(localStorage.getItem(KEY)||"null")||{
  user:null,profile:null,family:null,page:"dashboard",
  pregnancy:{dueDate:"2026-11-28",status:"pregnancy"},
  baby:{arrived:false,name:"Baby",birthDate:"",birthWeight:""},
  sharing:{mood:true,symptoms:true,sleep:true,babyActivity:true},
  checkIns:[],babyLogs:[],notifications:[]
};
let firebaseReady=false;

// Bloom no longer has a demo/guest account. Any old local demo session is ignored.
try {
  localStorage.removeItem("bloom_ui_state_v3");
  localStorage.removeItem("bloom_demo_user");
  localStorage.removeItem("bloom_demo_mode");
  localStorage.removeItem("bloom_logged_in");
} catch (_) {}

function saveUI(){localStorage.setItem(KEY,JSON.stringify(state))}
function esc(v){return String(v??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]))}
function now(){return new Date()}
function fmt(d){return new Intl.DateTimeFormat("en-GB",{day:"numeric",month:"short",year:"numeric"}).format(d)}
function daysUntil(date){return Math.ceil((new Date(date+"T12:00:00")-now())/86400000)}
function pregnancyWeeks(due){
  const days=280-daysUntil(due);
  return {week:Math.max(1,Math.min(40,Math.floor(days/7)+1)),day:Math.max(0,Math.min(6,days%7))}
}
function isBabyMode(){return state.pregnancy.status==="baby"||state.baby.arrived}
function isMum(){ return state?.profile?.role === "mum"; }
function isPartner(){ return state?.profile?.role === "partner"; }
function familyConnected(){return Array.isArray(state.family?.memberIds) && state.family.memberIds.length===2;}
function toast(message){
  const el=document.createElement("div");el.className="toast";el.textContent=message;
  document.body.appendChild(el);setTimeout(()=>el.remove(),2800)
}
function friendlyError(e){
  const map={
    "auth/email-already-in-use":"An account with this email already exists.",
    "auth/invalid-credential":"Email or password is incorrect.",
    "auth/weak-password":"Choose a stronger password.",
    "auth/invalid-email":"Please enter a valid email address.",
    "auth/too-many-requests":"Too many attempts. Please wait and try again."
  };
  return map[e.code]||e.message||"Something went wrong."
}
function moodEmoji(m){return {Great:"😊",Good:"🙂",Okay:"😐",Exhausted:"😫",Anxious:"😰",Stressed:"😤",Emotional:"😭",Low:"😔",Irritable:"😡",Loved:"🥰",Calm:"🧘",Overwhelmed:"🤯",Sleepy:"🥱",Energised:"💪"}[m]||"🙂"}

function loginScreen(mode="login"){
  return `<main class="login-screen"><section class="login-card">
    <img class="login-logo" src="./assets/bloom-logo-full.png" alt="Bloom — For you. For baby. For each other.">
    <h1>${mode==="register"?"Create your Bloom account":"Welcome back to Bloom"}</h1>
    <p class="subtitle">For you. For baby. For each other.</p>
    ${mode==="register"?`<div class="form-group"><label>Your name</label><input id="authName" placeholder="e.g. Sarah"></div>
      <label>I'm joining Bloom as...</label>
      <div class="role-picker"><button class="role selected" data-role="mum">🤰 Mum</button><button class="role" data-role="partner">❤️ Partner</button></div>`:""}
    <div class="form-group"><label>Email address</label><input id="authEmail" type="email" autocomplete="email" placeholder="you@example.com"></div>
    <div class="form-group"><label>Password</label><input id="authPassword" type="password" autocomplete="${mode==="register"?"new-password":"current-password"}" placeholder="At least 6 characters"></div>
    <button id="authSubmit" class="btn btn-primary" style="width:100%">${mode==="register"?"Create my Bloom account":"Log in to Bloom"}</button>
    <div id="authError" class="notice warn" style="display:none;margin-top:12px"></div>
    <button id="switchAuth" class="btn btn-ghost" style="width:100%;margin-top:10px">${mode==="register"?"Already have an account? Log in":"New to Bloom? Create an account"}</button>
    <p class="mini" style="margin-top:14px">Your Bloom account is private. Shared information is limited to your connected family.</p>
  </section></main>`;
}
function render(){
  // Firebase Auth is the source of truth. LocalStorage can only hold UI preferences.
  const firebaseUser = auth.currentUser;
  if (!firebaseUser) {
    state.user=null;
    state.profile=null;
    document.getElementById("app").innerHTML=loginScreen(window.authMode||"login");
    bindAuth();
    return;
  }
  document.getElementById("app").innerHTML=state.user?shell():loginScreen(window.authMode||"login");
  if(state.user) bindApp(); else bindAuth();
}

function bindAuth(){
  let role="mum";
  document.querySelectorAll(".role").forEach(b=>b.onclick=()=>{role=b.dataset.role;document.querySelectorAll(".role").forEach(x=>x.classList.remove("selected"));b.classList.add("selected")});
  document.getElementById("switchAuth").onclick=()=>{window.authMode=window.authMode==="register"?"login":"register";render()};
  document.getElementById("authSubmit").onclick=async()=>{
    const email=document.getElementById("authEmail").value.trim();
    const password=document.getElementById("authPassword").value;
    const err=document.getElementById("authError");
    try{
      if(window.authMode==="register"){
        const name=document.getElementById("authName").value.trim()||"Bloom User";
        await registerUser({name,email,password,role});
        toast("Account created successfully. You can now use Bloom.");
      }else{
        await loginUser(email,password);
      }
    }catch(e){err.textContent=friendlyError(e);err.style.display="block"}
  }
}

function nav(){
  const items=[["dashboard","⌂",isPartner()?"Partner home":"Today"]];
  if(isMum()) items.push(["checkin","❤","My check-in"]);
  if(isBabyMode()) items.push(["baby","👶","Baby tracker"]);
  items.push(["updates","↗",isPartner()?"Mum's updates":"Shared updates"]);
  items.push(["timeline","◷",isBabyMode()?"Baby timeline":"Pregnancy timeline"]);
  items.push(["settings","⚙","Settings"]);
  return items.map(x=>`<button class="nav-btn ${state.page===x[0]?"active":""}" data-page="${x[0]}"><span>${x[1]}</span>${x[2]}</button>`).join("");
}
function mobileNav(){
  const items=[["dashboard","⌂","Home"]];
  if(isMum()) items.push(["checkin","❤","My check-in"]);
  if(isBabyMode()) items.push(["baby","👶","Baby"]);
  items.push(["updates","↗",isPartner()?"Mum's updates":"Updates"]);
  items.push(["settings","⚙","Settings"]);
  return items.map(x=>`<button class="${state.page===x[0]?"active":""}" data-page="${x[0]}"><span style="font-size:20px">${x[1]}</span>${x[2]}</button>`).join("");
}

function shell(){
  const initials=(state.profile?.name||"B").slice(0,1).toUpperCase();
  return `<div class="app-shell"><header class="topbar"><div class="brand"><span class="brand-mark">B</span> Bloom</div><div class="user-pill"><span>${esc(state.profile?.role==="partner"?"Partner":"Mum")}</span><span class="avatar">${initials}</span></div></header>
  <div class="layout"><aside class="sidebar">${nav()}</aside><main class="main">${content()}</main></div><nav class="mobile-nav">${mobileNav()}</nav></div>`
}
function content(){
  if(state.page==="checkin")return isMum()?checkin():partnerReadOnly();
  if(state.page==="baby")return babyTracker();
  if(state.page==="updates")return updates();
  if(state.page==="timeline")return timeline();
  if(state.page==="settings")return settings();
  return dashboard()
}
function partnerReadOnly(){
  return `<div class="page-title"><div><h1>Partner view ❤️</h1><p class="subtitle">This area is read-only for partners.</p></div></div><section class="card"><div class="notice success">Only Mum can submit wellbeing check-ins or record baby activity. You can view the latest shared information from your Partner home and Updates.</div><button class="btn btn-primary" data-page="dashboard" style="margin-top:14px">Back to Partner home</button></section>`;
}
function dashboard(){
  if(isPartner()) return partnerDashboard();
  return isBabyMode()?babyDashboard():pregnancyDashboard()
}
function partnerDashboard(){
  const latest=state.checkIns[0];
  return `<div class="page-title"><div><div class="eyebrow">Bloom · Partner view</div><h1>Partner home ❤️</h1><p class="subtitle">View Mum's latest shared wellbeing information. Only Mum can submit a check-in.</p></div></div>
  <section class="card hero"><div class="hero-inner"><div><div class="eyebrow">Mum's latest check-in</div>${latest?`<div class="big-week">${(latest.moods||[]).map(moodEmoji).join(" ")||"🙂"}</div><p class="subtitle">${esc((latest.moods||[]).join(" · ")||"No mood selected")} · ${fmt(new Date(latest.date||Date.now()))}</p>`:`<div class="big-week">💗</div><p class="subtitle">Mum hasn't shared a check-in yet.</p>`}</div><div style="font-size:80px">❤️</div></div></section>
  <div style="height:18px"></div><div class="grid grid-2"><section class="card"><h2>Latest wellbeing</h2>${latest?checkinSummary(latest):`<div class="empty">No shared check-in yet.</div>`}</section><section class="card"><h2>Shared updates</h2>${recentUpdates(true)}</section></div>
  ${isBabyMode()?`<div style="height:18px"></div><section class="card"><h2>👶 Recent baby activity</h2>${babyRecent()}</section>`:""}
  <div class="action-row" style="margin-top:18px"><button class="btn btn-primary" data-page="baby">👶 Open Baby Tracker</button><button class="btn btn-secondary" data-page="updates">View Mum's Updates</button></div>
  <div class="action-row" style="margin-top:18px">
    <button class="btn btn-primary" data-page="baby">👶 Open Baby Tracker</button>
    <button class="btn btn-secondary" data-page="updates">View Mum's Updates</button>
  </div>
  <div class="notice success" style="margin-top:18px">❤️ Mum's wellbeing is private. The Baby Tracker is shared — both Mum and Partner can add and manage baby information.</div>`;
}
function pregnancyDashboard(){
  const p=pregnancyWeeks(state.pregnancy.dueDate),pct=Math.round(p.week/40*100),last=state.checkIns[0];
  return `<div class="page-title"><div><h1>Good morning, ${esc(state.profile.name)} 👋</h1><p class="subtitle">${fmt(now())} · ${state.profile.partnerUid?"Partner connected":"No partner connected yet"}</p></div></div>
  <section class="card hero"><div class="hero-inner"><div><div class="eyebrow">Pregnancy</div><div class="big-week">${p.week}<span style="font-size:20px"> weeks</span></div><p class="subtitle">${p.day} days · ${daysUntil(state.pregnancy.dueDate)} days until due date</p><div class="progress"><span style="width:${pct}%"></span></div><span class="mini">${pct}% of the way there · Due ${fmt(new Date(state.pregnancy.dueDate+"T12:00:00"))}</span></div><div style="font-size:80px">🤰</div></div></section>
  <div style="height:18px"></div><div class="grid grid-2"><section class="card"><h2>How are you feeling?</h2><p class="subtitle">Choose multiple moods in your check-in.</p><div class="mood-grid" style="margin:15px 0">${moodButtons()}</div><button class="btn btn-primary" id="openCheckin">Complete check-in</button></section>
  <section class="card"><h2>Partner connection</h2>${state.profile.partnerUid?`<div class="notice success">❤️ Your partner is connected to this Bloom family.</div>`:`<div class="notice warn">Your family has one member. Add your partner from Settings.</div>`}<button class="btn btn-secondary" id="goSettings" style="margin-top:12px">Manage family</button></section></div>
  <div style="height:18px"></div><div class="grid grid-2"><section class="card"><h2>Latest check-in</h2>${last?checkinSummary(last):`<div class="empty">No check-in yet.</div>`}</section><section class="card"><h2>Shared activity</h2>${recentUpdates()}</section></div>`
}
function babyDashboard(){
  const today=state.babyLogs.filter(x=>new Date(x.date).toDateString()===now().toDateString());
  return `<div class="page-title"><div><div class="eyebrow">Bloom · Mum & Baby</div><h1>Good morning, ${esc(state.profile.name)} 👋</h1><p class="subtitle">${esc(state.baby.name||"Baby")}</p></div></div>
  <section class="card hero baby-hero"><div class="hero-inner"><div><div class="eyebrow">Today with ${esc(state.baby.name||"Baby")}</div><div class="big-week">👶</div><p class="subtitle">${today.filter(x=>x.type==="feeding").length} feeds · ${today.filter(x=>x.type==="sleep").length} sleep events · ${today.filter(x=>x.type==="nappy").length} nappies</p><button class="btn btn-primary" data-page="baby">Open baby tracker</button></div><div style="font-size:90px">🍼</div></div></section>
  <div style="height:18px"></div><div class="grid grid-2"><section class="card"><h2>Mum's latest check-in</h2>${state.checkIns[0]?checkinSummary(state.checkIns[0]):`<div class="empty">No check-in yet.</div>`}</section><section class="card"><h2>Recent baby activity</h2>${babyRecent()}</section></div>`
}
function moodButtons(){
  const moods=[["😊","Great"],["🙂","Good"],["😐","Okay"],["😫","Exhausted"],["😰","Anxious"],["😤","Stressed"],["😭","Emotional"],["😔","Low"],["😡","Irritable"],["🥰","Loved"],["🧘","Calm"],["🤯","Overwhelmed"],["🥱","Sleepy"],["💪","Energised"]];
  return moods.map(m=>`<button class="mood-btn" data-mood="${m[1]}"><span class="emoji">${m[0]}</span><span class="label">${m[1]}</span></button>`).join("")
}

function checkin(){
  const symptoms=["Nausea","Headache","Cramping","Backache","Heartburn","Bloating","Swollen","Pelvic discomfort","Breast discomfort","Hot","Cold","Thirsty","Increased appetite"];
  const mental=["Calm","Confident","Overwhelmed","Worried","Anxious","Stressed","Lonely","Supported","Frustrated","Motivated","Struggling"];
  const needs=["Reassurance","A cuddle","A little help","Time to rest","Someone to talk to","Help with dinner","A break from baby","Just check in with me"];
  return `<div class="page-title"><div><h1>How are you feeling?</h1><p class="subtitle">Choose everything that applies — nothing is required.</p></div></div>
  <section class="card checkin-section"><div class="section-number">1</div><div><h2>How are you feeling?</h2><p class="mini">You can choose more than one.</p></div><div class="mood-grid">${moodButtons()}</div></section><div style="height:14px"></div>
  <section class="card checkin-section"><div class="section-number">2</div><div><h2>How does your body feel?</h2><p class="mini">Select symptoms and their intensity.</p></div><div class="symptom-grid">${symptoms.map(s=>`<button class="symptom-btn" data-symptom="${s}">${s}<span class="severity" data-severity-for="${s}"></span></button>`).join("")}</div><div class="severity-picker" id="severityPicker" hidden><span id="severityLabel">Select intensity</span><button class="severity-btn" data-severity="Mild">Mild</button><button class="severity-btn" data-severity="Moderate">Moderate</button><button class="severity-btn" data-severity="Severe">Severe</button></div></section><div style="height:14px"></div>
  <section class="card checkin-section"><div class="section-number">3</div><div><h2>How did you sleep?</h2><p class="mini">Optional.</p></div><div class="option-row" id="sleepQuality">${["Very poorly","Poorly","Okay","Well","Very well"].map(x=>`<button class="choice-btn" data-sleep="${x}">${x}</button>`).join("")}</div><div class="form-group compact-form"><label>Approximate hours slept</label><input id="sleepHours" type="number" min="0" max="24" step="0.25" placeholder="e.g. 5.5"></div><div class="option-row" id="energyLevel">${["Empty","Low","Okay","Good","Full"].map(x=>`<button class="choice-btn" data-energy="${x}">🔋 ${x}</button>`).join("")}</div></section><div style="height:14px"></div>
  <section class="card checkin-section"><div class="section-number">4</div><div><h2>How are you doing emotionally?</h2><p class="mini">Choose anything that describes today.</p></div><div class="symptom-grid">${mental.map(x=>`<button class="symptom-btn" data-mental="${x}">${x}</button>`).join("")}</div></section><div style="height:14px"></div>
  <section class="card checkin-section"><div class="section-number">5</div><div><h2>Pregnancy & body check</h2><p class="mini">Optional observations.</p></div><div class="form-group"><label>Baby movement</label><div class="option-row" id="babyMovement">${["Normal","More than usual","Less than usual","Not noticed"].map(x=>`<button class="choice-btn" data-movement="${x}">${x}</button>`).join("")}</div></div><div class="form-group"><label>Appetite</label><div class="option-row" id="appetite">${["Normal","Increased","Reduced"].map(x=>`<button class="choice-btn" data-appetite="${x}">${x}</button>`).join("")}</div></div><div class="form-group"><label>Cravings <span class="mini">(optional)</span></label><input id="cravings" placeholder="e.g. chocolate, oranges"></div></section><div style="height:14px"></div>
  <section class="card checkin-section"><div class="section-number">6</div><div><h2>What do you need today?</h2><p class="mini">Optional support requests.</p></div><div class="symptom-grid">${needs.map(x=>`<button class="symptom-btn" data-need="${x}">${x}</button>`).join("")}</div></section><div style="height:14px"></div>
  <section class="card checkin-section"><div class="section-number">7</div><div><h2>Anything else?</h2></div><textarea id="checkNote" rows="4" style="width:100%;border:1px solid var(--border);border-radius:12px;padding:12px;resize:vertical" placeholder="Optional note..."></textarea>
  <div class="setting-row"><div><b>Share this check-in with your partner</b><div class="mini">Only family members can access shared family data.</div></div><label class="switch"><input id="shareCheck" type="checkbox" checked><span class="slider"></span></label></div>
  <div class="action-row"><button class="btn btn-primary" id="saveCheckin">Save check-in ❤️</button><button class="btn btn-ghost" id="previewCheckin">Preview</button></div></section>
  <div class="notice warn" style="margin-top:14px">Bloom is a wellbeing tracker, not a medical diagnostic service.</div>`
}
function updates(){
  return `<div class="page-title"><div><h1>${isPartner()?"Mum's updates":"Shared updates"}</h1><p class="subtitle">${isPartner()?"The latest wellbeing information Mum has chosen to share with you.":"Activity from your Bloom family."}</p></div></div><section class="card"><h2>${isPartner()?"Latest shared wellbeing":"Family activity"}</h2>${recentUpdates(true)}</section>${isPartner()&&state.checkIns[0]?`<div style="height:18px"></div><section class="card"><h2>Mum's most recent check-in</h2>${checkinSummary(state.checkIns[0])}</section>`:""}`;
}

function recentUpdates(all=false){
  const items=state.notifications.slice(0,all?50:5);
  return items.length?items.map(n=>`<div class="update"><div class="update-icon">${n.icon||"🔔"}</div><div><b>${esc(n.text)}</b><div class="update-meta">${esc(n.time||"Recently")}</div></div></div>`).join(""):`<div class="empty">No shared activity yet.</div>`
}
function timeline(){
  if(isBabyMode()){
    const events=state.babyLogs;
    return `<div class="page-title"><div><h1>Baby timeline</h1><p class="subtitle">A shared record of ${esc(state.baby.name||"Baby")}'s journey.</p></div></div><section class="card"><div class="timeline">${events.length?events.map(e=>`<div class="timeline-item"><span class="dot"></span><h3>${esc(e.title)}</h3><p class="subtitle">${fmt(new Date(e.date))}</p></div>`).join(""):`<div class="empty">Your baby timeline will appear here.</div>`}</div></section>`
  }
  const p=pregnancyWeeks(state.pregnancy.dueDate);
  const milestones=[[4,"Pregnancy begins","A new chapter starts."],[8,"Early development","The pregnancy is progressing."],[12,"First trimester","Many early symptoms may begin to settle."],[20,"Halfway point","You are around halfway through pregnancy."],[28,"Third trimester approaching","Baby is growing quickly."],[32,"Third trimester","Rest, support and preparation become increasingly important."],[36,"Getting close","Start thinking about final preparations."],[40,"Due date","Your estimated due date."]];
  return `<div class="page-title"><div><h1>Pregnancy timeline</h1><p class="subtitle">You're currently around week ${p.week}.</p></div></div><section class="card"><div class="timeline">${milestones.map(m=>`<div class="timeline-item"><span class="dot"></span><h3>Week ${m[0]} · ${m[1]}</h3><p class="subtitle">${m[2]}</p></div>`).join("")}</div><div class="notice warn">This timeline is a prototype and should not be treated as medical guidance.</div></section>`
}
function babyTracker(){
  return `<div class="page-title"><div><h1>Baby tracker 👶</h1><p class="subtitle">A shared space for Mum and Partner to log and manage baby's day.</p></div></div>
  ${isPartner()?`<div class="notice success" style="margin-bottom:18px">❤️ You can add and manage baby information here. Mum's mood and wellbeing check-ins remain private to Mum.</div>`:""}<section class="card"><div class="baby-profile"><div class="baby-avatar">👶</div><div><div class="eyebrow">Baby profile</div><h2>${esc(state.baby.name||"Baby")}</h2><p class="subtitle">${state.baby.birthDate?`Born ${fmt(new Date(state.baby.birthDate+"T12:00:00"))}`:"Birth date not set"}</p></div></div></section><div style="height:18px"></div>
  <div class="grid grid-2"><section class="card"><h2>🍼 Feeding</h2><div class="form-group"><label>Feed type</label><select id="feedType"><option>Bottle</option><option>Breastfeed</option><option>Other</option></select></div><div class="form-group"><label>Amount / duration</label><input id="feedAmount" placeholder="e.g. 7 oz or 15 mins"></div><button class="btn btn-primary" id="addFeed">Log feed</button></section>
  <section class="card"><h2>😴 Sleep</h2><div class="form-group"><label>Sleep type</label><select id="sleepType"><option>Nap</option><option>Night sleep</option></select></div><div class="form-group"><label>Duration</label><input id="sleepDuration" placeholder="e.g. 1h 20m"></div><button class="btn btn-primary" id="addSleep">Log sleep</button></section>
  <section class="card"><h2>💧 Nappies</h2><div class="option-row" id="nappyType"><button class="choice-btn selected" data-nappy="Wet">💧 Wet</button><button class="choice-btn" data-nappy="Dirty">💩 Dirty</button><button class="choice-btn" data-nappy="Wet & dirty">💧💩 Both</button></div><button class="btn btn-primary" id="addNappy">Log nappy</button></section>
  <section class="card"><h2>📝 Baby note</h2><textarea id="babyNote" rows="5" style="width:100%;border:1px solid var(--border);border-radius:12px;padding:12px;resize:vertical" placeholder="e.g. Baby was unsettled this afternoon..."></textarea><button class="btn btn-primary" id="addBabyNote" style="margin-top:10px">Add note</button></section></div><div style="height:18px"></div><section class="card"><h2>Recent activity</h2>${babyRecent()}</section>`
}
function babyRecent(){
  const list=state.babyLogs.slice(0,10),icons={feeding:"🍼",sleep:"😴",nappy:"💧",note:"📝"};
  return list.length?list.map(x=>`<div class="update"><div class="update-icon">${icons[x.type]||"👶"}</div><div><b>${esc(x.title)}</b><div class="update-meta">${fmt(new Date(x.date))}</div></div></div>`).join(""):`<div class="empty">No baby activity logged yet.</div>`
}
function checkinSummary(c){
  const moods=c.moods||[];
  return `<div class="notice">${moods.map(moodEmoji).join(" ")} <b>${esc(moods.join(" · ")||"No mood selected")}</b> · ${fmt(new Date(c.date||Date.now()))}</div><div class="summary-grid"><div><b>Physical</b><p class="subtitle">${(c.symptoms||[]).map(s=>`${esc(s)}${c.severities?.[s]?" — "+esc(c.severities[s]):""}`).join(" · ")||"None"}</p></div><div><b>Sleep & energy</b><p class="subtitle">${esc(c.sleep||"Not selected")}${c.sleepHours?` · ${esc(c.sleepHours)}h`:""} · ${esc(c.energy||"Not selected")}</p></div><div><b>Emotional</b><p class="subtitle">${(c.mental||[]).map(esc).join(" · ")||"None"}</p></div><div><b>What I need</b><p class="subtitle">${(c.needs||[]).map(esc).join(" · ")||"None"}</p></div></div>${c.note?`<p class="subtitle"><b>Note:</b> ${esc(c.note)}</p>`:""}<div class="mini">${c.shared?"✓ Shared with family":"Private"}</div>`
}

function settings(){
  const owner=state.family?.ownerUid===auth.currentUser?.uid;
  const members=state.familyMembers||[];
  const connected=members.length===2 || familyConnected();
  const memberCards=members.length?members.map(m=>`<div class="family-member"><div class="member-avatar">${m.role==="mum"?"🤰":"❤️"}</div><div class="member-info"><b>${esc(m.name||"Bloom member")}</b><div class="mini">${m.role==="mum"?"Mum":"Partner"} · ${esc(m.email||"")}</div></div>${owner&&m.role==="partner"?`<button class="btn btn-danger btn-small remove-member" data-remove-member="${m.uid}">Remove</button>`:""}${!owner&&m.uid===auth.currentUser?.uid?`<button class="btn btn-danger btn-small" id="leaveFamily">Leave family</button>`:""}</div>`).join(""):`<div class="empty">No family members found.</div>`;
  return `<div class="page-title"><div><h1>Settings</h1><p class="subtitle">Account, family and app settings.</p></div></div>
  <div class="grid grid-2"><section class="card"><h2>Account</h2><div class="notice success">✓ Signed in as ${esc(state.profile.email)}</div><p class="mini" style="margin-top:10px">${isPartner()?"Partner account · read-only wellbeing view":"Mum account · can submit check-ins and manage family"}</p></section>
  <section class="card"><h2>Family</h2>
    <div class="family-list">${memberCards}</div>
    ${connected?`<div class="notice success" style="margin-top:12px">❤️ Your Bloom family has 1 Mum and 1 Partner.</div>`:`<div class="notice warn" style="margin-top:12px">Your family has one member. You can add one Partner.</div>`}
    ${owner&&!connected?`<button class="btn btn-primary" id="createInvite" style="margin-top:12px">Add Partner</button><div id="inviteResult"></div>`:""}
    ${state.profile.role==="partner"&&!state.profile.familyId?`<div class="form-group" style="margin-top:12px"><label>Partner invitation code</label><input id="inviteCode" placeholder="e.g. AB12CD34"></div><button class="btn btn-primary" id="joinInvite">Join Bloom family</button>`:""}
  </section></div>
  <div style="height:18px"></div>${isMum()?`<section class="card"><h2>App stage</h2><div class="notice ${isBabyMode()?"success":"warn"}">${isBabyMode()?"👶 Mum & Baby mode is active.":"🤰 Pregnancy mode is active."}</div><div class="action-row" style="margin-top:14px"><button class="btn ${!isBabyMode()?"btn-primary":"btn-secondary"}" id="pregnancyMode">🤰 Pregnancy mode</button><button class="btn ${isBabyMode()?"btn-primary":"btn-secondary"}" id="babyMode">👶 Baby mode</button></div></section>`:`<section class="card"><h2>App stage</h2><div class="notice success">❤️ Mum controls the pregnancy/baby stage. You can view the latest shared information.</div></section>`}
  ${isBabyMode()?`<div style="height:18px"></div><section class="card"><h2>Baby profile</h2><div class="grid grid-2"><div class="form-group"><label>Baby name</label><input id="babyName" value="${esc(state.baby.name)}"></div><div class="form-group"><label>Birth date</label><input id="birthDate" type="date" value="${esc(state.baby.birthDate)}"></div><div class="form-group"><label>Birth weight</label><input id="birthWeight" value="${esc(state.baby.birthWeight)}"></div></div><button class="btn btn-primary" id="saveBabyProfile">Save baby profile</button><p class="mini" style="margin-top:8px">Both Mum and Partner can manage the shared baby profile.</p></section>`:""}
  ${isMum()?`<div style="height:18px"></div><section class="card"><h2>Sharing</h2>${setting("mood","Mood updates","Share selected moods with your partner.")}${setting("symptoms","Symptom updates","Share selected symptoms.")}${setting("sleep","Sleep updates","Share sleep information.")}${setting("babyActivity","Baby activity","Share baby activity with your partner.")}</section>`:`<div style="height:18px"></div><section class="card"><h2>Partner permissions</h2><div class="notice success">❤️ You can view Mum's latest shared wellbeing results and family updates. You cannot submit or edit Mum's check-ins.</div></section>`}
  <div style="height:18px"></div><section class="card"><button class="btn btn-danger" id="logout">Sign out</button></section></div>`;
}
function setting(key,title,desc){return `<div class="setting-row"><div><b>${title}</b><div class="mini">${desc}</div></div><label class="switch"><input class="share-toggle" data-key="${key}" type="checkbox" ${state.sharing[key]?"checked":""}><span class="slider"></span></label></div>`}

function collectCheckin(){
  const moods=[...document.querySelectorAll(".mood-btn.selected")].map(x=>x.dataset.mood);
  const symptoms=[...document.querySelectorAll("[data-symptom].selected")].map(x=>x.dataset.symptom);
  const mental=[...document.querySelectorAll("[data-mental].selected")].map(x=>x.dataset.mental);
  const needs=[...document.querySelectorAll("[data-need].selected")].map(x=>x.dataset.need);
  const pick=s=>document.querySelector(`${s}.selected`)?.dataset;
  return {
    moods,symptoms,severities:{...(window.selectedSeverities||{})},mental,
    sleep:pick("[data-sleep]")?.sleep||null,sleepHours:document.getElementById("sleepHours")?.value||"",
    energy:pick("[data-energy]")?.energy||null,movement:pick("[data-movement]")?.movement||null,
    appetite:pick("[data-appetite]")?.appetite||null,cravings:document.getElementById("cravings")?.value.trim()||"",
    needs,note:document.getElementById("checkNote")?.value.trim()||"",
    shared:document.getElementById("shareCheck")?.checked??true
  }
}
function bindApp(){
  document.querySelectorAll("[data-page]").forEach(b=>b.onclick=()=>{
  const target=b.dataset.page;
  if(isPartner() && target==="checkin") state.page="dashboard";
  else state.page=target;
  saveUI();render();
});
  document.getElementById("openCheckin")?.addEventListener("click",()=>{state.page="checkin";saveUI();render()});
  document.getElementById("goSettings")?.addEventListener("click",()=>{state.page="settings";saveUI();render()});
  document.querySelectorAll(".mood-btn").forEach(b=>b.onclick=()=>b.classList.toggle("selected"));
  document.querySelectorAll("[data-symptom]").forEach(b=>b.onclick=()=>{b.classList.toggle("selected");window.activeSymptom=b.dataset.symptom;document.getElementById("severityPicker").hidden=false;document.getElementById("severityLabel").textContent=`Intensity for ${b.dataset.symptom}`});
  document.querySelectorAll(".severity-btn").forEach(b=>b.onclick=()=>{window.selectedSeverities=window.selectedSeverities||{};window.selectedSeverities[window.activeSymptom]=b.dataset.severity;document.querySelector(`[data-symptom="${CSS.escape(window.activeSymptom)}"] .severity`).textContent=` · ${b.dataset.severity}`;document.querySelectorAll(".severity-btn").forEach(x=>x.classList.remove("selected"));b.classList.add("selected")});
  document.querySelectorAll("[data-mental],[data-need]").forEach(b=>b.onclick=()=>b.classList.toggle("selected"));
  document.querySelectorAll(".choice-btn").forEach(b=>b.onclick=()=>{const g=b.parentElement;g.querySelectorAll(".choice-btn").forEach(x=>x.classList.remove("selected"));b.classList.add("selected")});
  document.getElementById("previewCheckin")?.addEventListener("click",()=>alert(JSON.stringify(collectCheckin(),null,2)));
  document.getElementById("saveCheckin")?.addEventListener("click",async()=>{
    const c=collectCheckin();c.date=new Date().toISOString();
    try{
      await addCheckin(auth.currentUser.uid,c);
      state.checkIns.unshift(c);saveUI();toast(c.shared?"Check-in saved to your Bloom family.":"Private check-in saved.");state.page="dashboard";render();
    }catch(e){toast(friendlyError(e))}
  });
  document.getElementById("addFeed")?.addEventListener("click",async()=>{await addBaby("feeding",`${document.getElementById("feedType").value}${document.getElementById("feedAmount").value.trim()?" · "+document.getElementById("feedAmount").value.trim():""}`)});
  document.getElementById("addSleep")?.addEventListener("click",async()=>{await addBaby("sleep",`${document.getElementById("sleepType").value}${document.getElementById("sleepDuration").value.trim()?" · "+document.getElementById("sleepDuration").value.trim():""}`)});
  document.querySelectorAll("[data-nappy]").forEach(b=>b.onclick=()=>{document.querySelectorAll("[data-nappy]").forEach(x=>x.classList.remove("selected"));b.classList.add("selected")});
  document.getElementById("addNappy")?.addEventListener("click",async()=>{await addBaby("nappy",`${document.querySelector("[data-nappy].selected")?.dataset.nappy||"Wet"} nappy`)});
  document.getElementById("addBabyNote")?.addEventListener("click",async()=>{const n=document.getElementById("babyNote").value.trim();if(!n){toast("Add a note first.");return}await addBaby("note",n)});
  document.getElementById("saveDue")?.addEventListener("click",async()=>{state.pregnancy.dueDate=document.getElementById("dueDate").value;await saveFamily(auth.currentUser.uid,{pregnancy:state.pregnancy});saveUI();toast("Due date saved.")});
  document.getElementById("pregnancyMode")?.addEventListener("click",async()=>{state.pregnancy.status="pregnancy";state.baby.arrived=false;await saveFamily(auth.currentUser.uid,{stage:"pregnancy",pregnancy:state.pregnancy});saveUI();render()});
  document.getElementById("babyMode")?.addEventListener("click",async()=>{state.pregnancy.status="baby";state.baby.arrived=true;await saveFamily(auth.currentUser.uid,{stage:"baby",pregnancy:state.pregnancy,baby:state.baby});saveUI();render()});
  document.getElementById("saveBabyProfile")?.addEventListener("click",async()=>{state.baby.name=document.getElementById("babyName").value.trim()||"Baby";state.baby.birthDate=document.getElementById("birthDate").value;state.baby.birthWeight=document.getElementById("birthWeight").value.trim();await saveFamily(auth.currentUser.uid,{baby:state.baby});saveUI();toast("Baby profile saved.");render()});
  document.getElementById("createInvite")?.addEventListener("click",async()=>{try{const code=await createPartnerInvite(auth.currentUser.uid);document.getElementById("inviteResult").innerHTML=`<div class="notice success" style="margin-top:12px"><b>Partner invitation</b><div style="font-size:24px;font-weight:900;letter-spacing:.12em;margin:8px 0">${code}</div>Ask your partner to create their Bloom account and enter this code.</div>`}catch(e){toast(friendlyError(e))}});
  document.getElementById("joinInvite")?.addEventListener("click",async()=>{try{await joinFamilyWithInvite(auth.currentUser.uid,document.getElementById("inviteCode").value);toast("You've joined the Bloom family.");await bootUser(auth.currentUser);state.page="dashboard";saveUI();render()}catch(e){toast(friendlyError(e))}});
  document.querySelectorAll("[data-remove-member]").forEach(btn=>btn.addEventListener("click",async()=>{if(!confirm("Remove this partner from your Bloom family? They will keep their Bloom account but will no longer have access to this family."))return;try{await removePartner(auth.currentUser.uid);await bootUser(auth.currentUser);toast("Partner removed from your Bloom family.");render()}catch(e){toast(friendlyError(e))}}));
  document.getElementById("leaveFamily")?.addEventListener("click",async()=>{if(!confirm("Leave this Bloom family? You will need a new invitation to join a family again."))return;try{await leaveFamily(auth.currentUser.uid);await bootUser(auth.currentUser);toast("You have left the Bloom family.");render()}catch(e){toast(friendlyError(e))}});
  document.querySelectorAll(".share-toggle").forEach(t=>t.onchange=()=>{state.sharing[t.dataset.key]=t.checked;saveUI()});
  document.getElementById("logout")?.addEventListener("click",async()=>{await logoutUser();state={...state,user:null,profile:null,family:null};saveUI();render()});
}
async function addBaby(type,title){
  try{
    const data={type,title,date:new Date().toISOString()};
    await addBabyActivity(auth.currentUser.uid,data);state.babyLogs.unshift(data);saveUI();toast("Baby activity saved.");render();
  }catch(e){toast(friendlyError(e))}
}
function hydrateDates(data){
  if(data?.createdAt?.toDate)return data.createdAt.toDate().toISOString();
  return data?.date||new Date().toISOString();
}
async function bootUser(user){
  state.user={uid:user.uid,email:user.email};
  state.profile=await getProfile(user.uid);
  if(!state.profile){toast("Bloom profile could not be found.");return}
  if(!state.profile.familyId && state.profile.role==="mum") await ensureFamily(user.uid);
  state.family=state.profile.familyId?await ensureFamily(user.uid):null;
  state.familyMembers=state.family?await loadFamilyMembers(user.uid):[];
  if(state.family?.pregnancy)state.pregnancy={...state.pregnancy,...state.family.pregnancy};
  if(state.family?.baby)state.baby={...state.baby,...state.family.baby};
  if(state.family?.stage)state.pregnancy.status=state.family.stage;
  try{
    const [checks,baby]=await Promise.all([loadCheckins(user.uid),loadBabyActivity(user.uid)]);
    state.checkIns=checks.map(x=>({...x,date:hydrateDates(x)}));
    state.babyLogs=baby.map(x=>({...x,date:hydrateDates(x)}));
  }catch(e){console.warn(e)}
  saveUI();
}

onAuthStateChanged(auth,async user=>{
  if(user){
    try{
      await bootUser(user);
      render();
    }catch(e){
      console.error(e);
      state.user=null;
      state.profile=null;
      state.family=null;
      render();
      toast(friendlyError(e));
    }
  }else{
    state.user=null;
    state.profile=null;
    state.family=null;
    render();
  }
});
