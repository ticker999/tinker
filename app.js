/* 휴대폰 화면을 그리는 코드입니다. 내용은 data.js 에서 고치세요. */
(() => {
  "use strict";

  const P = window.PHONE || {};
  const S = window.STORY || { paragraphs: [] };
  for (const k of ["contacts", "calls", "messages", "memos", "gallery"]) P[k] = P[k] || [];
  P.calls.forEach(c => { if (!c.unseen) c.seen = true; });
  P.callScripts = P.callScripts || {};
  P.replies = P.replies || {};
  P.mail = P.mail || {};

  /* ---------- 도우미 ---------- */
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
  const nl = s => esc(s).replace(/\n/g, "<br>");
  const h = html => { const t = document.createElement("template"); t.innerHTML = html.trim(); return t.content.firstElementChild; };
  const rand = (a, b) => a + Math.random() * (b - a);

  /* ---------- 시간: 휴대폰 속 시각이 실제 시간만큼 흘러감 ---------- */
  const pad = n => String(n).padStart(2, "0");
  const START = new Date(`${P.today || "2026-01-01"}T${P.time || "12:00:00"}`);
  const T0 = Date.now();
  const now = () => new Date(START.getTime() + (Date.now() - T0));
  const WEEK = "일월화수목금토";
  const ampmWord = d => (d.getHours() < 12 ? "오전" : "오후");
  const ampm = d => `${ampmWord(d)} ${d.getHours() % 12 || 12}:${pad(d.getMinutes())}`;
  const clock = d => `${d.getHours() % 12 || 12}:${pad(d.getMinutes())}`;
  const dateLabel = d => `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일 ${WEEK[d.getDay()]}요일`;
  const mmss = s => `${pad(Math.floor(s / 60))}:${pad(s % 60)}`;
  const isYmd = s => /^\d{4}-\d{2}-\d{2}$/.test(String(s || ""));
  const ymd = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const dayLabel = s => {
    if (!isYmd(s)) return s;
    const d = new Date(`${s}T00:00:00`);
    return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일 ${WEEK[d.getDay()]}요일`;
  };
  /* 목록 오른쪽: 오늘이면 시각, 올해면 "2월 25일", 지난해면 "2012. 12. 17." */
  const shortDay = (s, time) => {
    if (!isYmd(s) || s === ymd(now())) return time;
    const [y, mo, da] = s.split("-").map(Number);
    return y === now().getFullYear() ? `${mo}월 ${da}일` : `${y}. ${mo}. ${da}.`;
  };

  /* ---------- 그림: 갤럭시 S4 시절 아이콘 ---------- */
  const grad = (id, a, b) => `<linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient>`;
  document.body.insertAdjacentHTML("afterbegin", `<svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs>
    ${grad("gAv", "#b9c0c8", "#7f8790")}${grad("gPhone", "#7ad856", "#239321")}${grad("gContact", "#ffb14f", "#ec640c")}
    ${grad("gMsgY", "#ffe46e", "#f3b000")}${grad("gWhite", "#ffffff", "#dedfe2")}${grad("gMemoY", "#ffd54a", "#f19a0e")}
    ${grad("gTeal", "#5fd2df", "#1683a9")}${grad("gSkyS", "#5ab4f2", "#bfe6ff")}${grad("gHill", "#7bcf3c", "#2f8f27")}
    ${grad("gBlue", "#7cc0ff", "#1854c0")}${grad("gCream", "#ffffff", "#e3dcc4")}${grad("gYellow", "#fff590", "#efc21a")}
    ${grad("gSilver", "#ffffff", "#c2c4c8")}${grad("gSky", "#6cb8ff", "#bfe4ff")}
    <linearGradient id="gGloss" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".75"/><stop offset="1" stop-color="#fff" stop-opacity=".08"/></linearGradient>
    <radialGradient id="gGlobe" cx=".35" cy=".3" r=".8"><stop offset="0" stop-color="#a6e6ff"/><stop offset=".45" stop-color="#2d8fe6"/><stop offset="1" stop-color="#0b47a3"/></radialGradient>
  </defs></svg>`);
  const HANDSET = "M6.6 10.8a15.1 15.1 0 0 0 6.6 6.6l2.2-2.2a1 1 0 0 1 1-.25 11.4 11.4 0 0 0 3.6.57 1 1 0 0 1 1 1V20a1 1 0 0 1-1 1A17 17 0 0 1 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1c0 1.25.2 2.45.57 3.57a1 1 0 0 1-.25 1L6.6 10.8z";
  const big = inner => `<svg viewBox="0 0 64 64">${inner}</svg>`;
  const tile = fill => `<rect x="6" y="6" width="52" height="52" rx="12" fill="${fill}"/>`;
  const GLOSS = `<path d="M7 19Q7 7 19 7H45Q57 7 57 19V28Q32 37 7 28Z" fill="url(#gGloss)"/>`; // 옛날 아이콘용 광택
  const SHINE = `<path d="M6 18a12 12 0 0 1 12-12h28a12 12 0 0 1 12 12v12Q32 25 6 30z" fill="#fff" opacity=".2"/>`;
  const APP_ICON = {
    phone: () => big(`${tile("url(#gPhone)")}<path transform="translate(14.5 14.5) scale(1.45)" d="${HANDSET}" fill="#fff"/>${SHINE}`),
    contacts: () => big(`${tile("url(#gContact)")}<circle cx="32" cy="25" r="8.5" fill="#fff"/><path d="M16.5 49c1.6-9.2 7.6-13.8 15.5-13.8s13.9 4.6 15.5 13.8z" fill="#fff"/>${SHINE}`),
    messages: () => big(`<rect x="5" y="13" width="54" height="39" rx="5" fill="url(#gMsgY)" stroke="#d99a00"/><path d="M8 49l18-15M56 49L38 34" stroke="#e3a300" stroke-width="2"/><path d="M8 16l24 18 24-18" fill="none" stroke="#fff7cf" stroke-width="3.2" stroke-linejoin="round"/><path d="M7 15h50v12Q32 22 7 28z" fill="#fff" opacity=".22"/>`),
    internet: () => big(`<circle cx="32" cy="32" r="25" fill="url(#gGlobe)"/><g fill="none" stroke="#fff" stroke-opacity=".6" stroke-width="1.8"><ellipse cx="32" cy="32" rx="11" ry="25"/><path d="M7 32h50M32 7v50M11 19.5q21 7 42 0M11 44.5q21-7 42 0"/></g><ellipse cx="24" cy="18" rx="12" ry="7" fill="#fff" opacity=".28"/>`),
    menu: () => big(`<rect x="6" y="6" width="52" height="52" rx="11" fill="url(#gBlue)" stroke="#123f93"/><rect x="16" y="16" width="14" height="14" rx="2.5" fill="#fff"/><rect x="34" y="16" width="14" height="14" rx="2.5" fill="#fff"/><rect x="16" y="34" width="14" height="14" rx="2.5" fill="#fff"/><rect x="34" y="34" width="14" height="14" rx="2.5" fill="#fff"/>${GLOSS}`),
    log: () => big(`<rect x="6" y="6" width="52" height="52" rx="11" fill="url(#gSilver)" stroke="#8e9094"/><path transform="translate(9 19) scale(1.45)" d="${HANDSET}" fill="#2f9a22"/><path d="M34 14h15v15" fill="none" stroke="#ef6a0c" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/><path d="M48 15L33 30" stroke="#ef6a0c" stroke-width="5" stroke-linecap="round"/>${GLOSS}`),
    gallery: () => big(`<g transform="rotate(-9 32 32)"><rect x="7" y="11" width="50" height="42" rx="2" fill="#fff" stroke="#9a9a9a"/><rect x="11" y="15" width="42" height="29" fill="url(#gSky)"/><path d="M11 44L24 29L32 37L41 26L53 40V44Z" fill="#3aa52f"/><circle cx="44" cy="21" r="4" fill="#ffe14d"/></g><path d="M8 14Q32 6 56 10V24Q32 30 8 28Z" fill="url(#gGloss)" opacity=".5"/>`),
    memo: () => big(`<path d="M9 7H55V45L43 57H9Z" fill="url(#gYellow)" stroke="#b8920c"/><path d="M55 45H43V57Z" fill="#d6ad16" stroke="#b8920c" stroke-linejoin="round"/><path d="M15 21H49M15 29H49M15 37H40" stroke="#c49d10" stroke-width="2.5" stroke-linecap="round"/><rect x="9" y="7" width="46" height="7" fill="#e7b812"/>`),
    mail: () => big(`<rect x="5" y="12" width="50" height="38" rx="4" fill="url(#gCream)" stroke="#8e94a0"/><path d="M6 14l24 19 24-19" fill="none" stroke="#6f86b8" stroke-width="3" stroke-linejoin="round"/><path d="M7 14H53L30 31Z" fill="url(#gBlue)" opacity=".85"/><circle cx="46" cy="44" r="13" fill="url(#gBlue)" stroke="#123f93"/><text x="46" y="50.5" text-anchor="middle" font-size="18" font-weight="700" font-family="Arial, sans-serif" fill="#fff">@</text><path d="M8 15H52L30 27Z" fill="url(#gGloss)" opacity=".6"/>`),
  };
  const APPS = {
    phone: { label: "전화", open: () => phoneApp("keypad") },
    contacts: { label: "전화번호부", open: () => phoneApp("contacts") },
    messages: { label: "메시지", open: () => messagesApp() },
    internet: { label: "인터넷", open: () => internetApp() },
    menu: { label: "메인메뉴", open: () => drawer() },
    log: { label: "최근기록", open: () => phoneApp("recent") },
    gallery: { label: "갤러리", open: () => galleryApp() },
    memo: { label: "메모", open: () => memoApp() },
    mail: { label: "메일", open: () => mailApp() },
  };

  /* 작은 아이콘 */
  const sv = (d, extra = "") => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" ${extra}>${d}</svg>`;
  const UI = {
    call: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="${HANDSET}"/></svg>`,
    msg: sv(`<rect x="3" y="5.5" width="18" height="13" rx="1.5"/><path d="M3.5 6.5L12 13l8.5-6.5"/>`),
    msgSm: `<svg viewBox="0 0 24 24"><rect x="2" y="5" width="20" height="14" rx="1.5" fill="#f3f3f3"/><path d="M2.5 6l9.5 7 9.5-7" fill="none" stroke="#e57c0c" stroke-width="2"/></svg>`,
    missedSm: `<svg viewBox="0 0 24 24"><path transform="translate(1 3) scale(.8)" d="${HANDSET}" fill="#fff"/><path d="M14 4l3.5 3.5L22 3" fill="none" stroke="#ff5a4a" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
    del: sv(`<path d="M9 5h11v14H9l-6-7z"/><path d="M12.5 9.5l5 5M17.5 9.5l-5 5"/>`),
    in: sv(`<path d="M18 6L6 18M6 9v9h9"/>`, `style="color:#4fb8ff"`),
    out: sv(`<path d="M6 18L18 6M9 6h9v9"/>`, `style="color:#57c84a"`),
    missed: sv(`<path d="M3 7l7.5 7.5L15 10l6 6"/>`, `style="color:#ff5a4a"`),
    keypad: sv(`<circle cx="6" cy="5" r="1.4"/><circle cx="12" cy="5" r="1.4"/><circle cx="18" cy="5" r="1.4"/><circle cx="6" cy="11" r="1.4"/><circle cx="12" cy="11" r="1.4"/><circle cx="18" cy="11" r="1.4"/><circle cx="6" cy="17" r="1.4"/><circle cx="12" cy="17" r="1.4"/><circle cx="18" cy="17" r="1.4"/><circle cx="12" cy="22" r="1.2"/>`),
    log: sv(`<circle cx="12" cy="12" r="8.5"/><path d="M12 7v5.5l3.5 2"/>`),
    person: sv(`<circle cx="12" cy="8" r="4"/><path d="M4 21c.6-4.4 3.7-7 8-7s7.4 2.6 8 7"/>`),
    arrow: sv(`<path d="M5 12h13M13 6l6 6-6 6"/>`, `stroke-width="2.6"`),
    add: sv(`<circle cx="10" cy="8" r="3.5"/><path d="M3.5 19c.5-3.6 3-5.6 6.5-5.6M18 12v7M14.5 15.5h7"/>`),
    spk: sv(`<path d="M4 9.5h3.5L12 6v12l-4.5-3.5H4z"/><path d="M15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11"/>`),
    mute: sv(`<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21M4 4l16 16"/>`),
    hs: sv(`<path d="M4 15v-3a8 8 0 0 1 16 0v3"/><rect x="3" y="14" width="4" height="6" rx="1.5"/><rect x="17" y="14" width="4" height="6" rx="1.5"/>`),
  };
  const SIL = `<svg viewBox="0 0 40 40" preserveAspectRatio="xMidYMid slice"><rect width="40" height="40" fill="url(#gAv)"/><circle cx="20" cy="15.5" r="7.5" fill="#545d66"/><path d="M4 41q1-14 16-14t16 14z" fill="#545d66"/></svg>`;

  /* ---------- 연락처 찾기 ---------- */
  const digits = s => String(s ?? "").replace(/\D/g, "");
  function person(key) {
    const k = String(key ?? "");
    const c = P.contacts.find(c => c.name === k) || P.contacts.find(c => digits(k) && digits(c.number) === digits(k));
    return c ? { name: c.name, number: c.number, saved: true, c } : { name: fmtNum(k), number: k, saved: false };
  }
  function fmtNum(n) {
    const d = String(n);
    if (/[^\d]/.test(d)) return d;
    const head = d.startsWith("02") ? 2 : 3;
    const rest = d.length - head;
    if (rest <= 0) return d;
    if (rest <= 3) return `${d.slice(0, head)}-${d.slice(head)}`;
    if (rest <= 7) return `${d.slice(0, head)}-${d.slice(head, d.length - 4)}-${d.slice(-4)}`.replace(/--/, "-");
    if (rest === 8) return `${d.slice(0, head)}-${d.slice(head, head + 4)}-${d.slice(head + 4)}`;
    return d;
  }
  /* 같은 이름이 여럿이어도 구분되도록 번호로 사람을 가림 */
  const idOf = p => digits(p.number) || p.name;
  const hue = s => { let x = 7; for (const ch of String(s)) x = (x * 31 + ch.codePointAt(0)) % 360; return x; };
  const avatar = (key, cls = "") => {
    const p = person(key);
    return `<span class="pic ${cls}">${p.c?.photo ? `<img src="${esc(p.c.photo)}" alt="">` : SIL}</span>`;
  };
  const CHO = "ㄱㄲㄴㄷㄸㄹㅁㅂㅃㅅㅆㅇㅈㅉㅊㅋㅌㅍㅎ";
  const SINGLE = { ㄲ: "ㄱ", ㄸ: "ㄷ", ㅃ: "ㅂ", ㅆ: "ㅅ", ㅉ: "ㅈ" };
  function groupOf(name) {
    const c = name.charCodeAt(0);
    if (c >= 0xac00 && c <= 0xd7a3) { const j = CHO[Math.floor((c - 0xac00) / 588)]; return SINGLE[j] || j; }
    if (/[a-z]/i.test(name[0])) return name[0].toUpperCase();
    return "#";
  }

  /* ---------- 소리 (키패드 · 연결음) ---------- */
  let ac = null;
  function tone(freqs, ms, vol = 0.05) {
    try {
      ac = ac || new (window.AudioContext || window.webkitAudioContext)();
      const g = ac.createGain();
      g.gain.value = vol;
      g.connect(ac.destination);
      const t = ac.currentTime;
      g.gain.setTargetAtTime(0, t + ms / 1000, 0.015);
      for (const f of freqs) { const o = ac.createOscillator(); o.frequency.value = f; o.connect(g); o.start(t); o.stop(t + ms / 1000 + 0.1); }
    } catch (e) { /* 소리가 안 되는 환경이면 무시 */ }
  }
  const DTMF = { 1: [697, 1209], 2: [697, 1336], 3: [697, 1477], 4: [770, 1209], 5: [770, 1336], 6: [770, 1477], 7: [852, 1209], 8: [852, 1336], 9: [852, 1477], "*": [941, 1209], 0: [941, 1336], "#": [941, 1477] };
  function ringback() {
    const beep = () => tone([440, 480], 1000, 0.03);
    beep();
    const id = setInterval(beep, 3000);
    return { stop: () => clearInterval(id) };
  }

  /* ---------- 화면 쌓기 ---------- */
  const screen = $("#screen");
  const screensEl = $("#screens");
  const stack = [];
  const top = () => stack[stack.length - 1];
  function push(el, opts = {}) {
    closeMenu();
    el.classList.add("scr");
    screensEl.appendChild(el);
    stack.push({ el, ...opts });
    void el.offsetWidth; // 처음 위치를 그린 뒤 나타나게
    el.classList.add("in");
    return el;
  }
  function pop(force = false) {
    const t = top();
    if (stack.length <= 1 || (t.modal && !force)) return false;
    stack.pop();
    t.onClose?.();
    t.el.classList.remove("in");
    t.el.classList.add("out");
    setTimeout(() => t.el.remove(), 200);
    top().onShow?.();
    return true;
  }
  function goHome() {
    if (top()?.modal) return toast("통화 중입니다");
    while (stack.length > 1) pop();
  }
  const tbar = (title, extra = "") => `<header class="tbar"><span>${esc(title)}</span>${extra}</header>`;
  const empty = text => `<div class="empty">${esc(text)}</div>`;
  const wall = () => (P.wallpaper ? `style="background:url('${esc(P.wallpaper)}') center / cover no-repeat"` : "");

  /* ---------- 알림 ---------- */
  let toastTimer = 0;
  function toast(text) {
    const t = $("#toast");
    t.textContent = text;
    t.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => (t.hidden = true), 2000);
  }
  /* 새 문자가 오면 상태 표시줄에 글자가 흘러감 (옛날 안드로이드 방식) */
  let tickerTimer = 0;
  function ticker(key, text, onTap) {
    const t = $("#ticker");
    const hide = () => { t.hidden = true; $("#sbLeft").hidden = false; };
    t.innerHTML = `${UI.msgSm}<span>${esc(person(key).name)}: ${esc(text)}</span>`;
    t.hidden = false;
    $("#sbLeft").hidden = true;
    t.onclick = () => { hide(); if (!locked) onTap?.(); };
    clearTimeout(tickerTimer);
    tickerTimer = setTimeout(hide, 4800);
  }

  /* ---------- 메뉴 키 ---------- */
  const optMenu = $("#optMenu");
  function closeMenu() { optMenu.hidden = true; }
  function openMenu() {
    if (!optMenu.hidden) return closeMenu();
    const t = top();
    const items = t.menu || (t.el.classList.contains("home") ? ["배경화면", "편집", "검색", "알림", "설정"] : ["검색", "설정"]);
    optMenu.innerHTML = items.map((it, i) => `<button data-o="${i}">${esc(Array.isArray(it) ? it[0] : it)}</button>`).join("");
    optMenu.onclick = e => {
      const b = e.target.closest("[data-o]");
      if (!b) return;
      closeMenu();
      const it = items[+b.dataset.o];
      Array.isArray(it) ? it[1]() : toast("지원하지 않는 기능입니다");
    };
    optMenu.hidden = false;
  }

  /* ---------- 상태 표시줄 ---------- */
  const missedCount = () => P.calls.filter(c => c.dir === "missed" && !c.seen).length;
  const unreadCount = () => P.messages.reduce((n, c) => n + (c.unread || 0), 0);
  let lastLeft = null;
  function tick() {
    const d = now();
    $("#sbTime").textContent = ampm(d);
    $$("[data-clock]").forEach(e => (e.textContent = clock(d)));
    $$("[data-ampm]").forEach(e => (e.textContent = ampmWord(d)));
    $$("[data-date]").forEach(e => (e.textContent = dateLabel(d)));
    $$("[data-sdate]").forEach(e => (e.textContent = `${d.getMonth() + 1}월 ${d.getDate()}일 (${WEEK[d.getDay()]})`));
    const missed = missedCount(), unread = unreadCount();
    const left = (unread ? UI.msgSm : "") + (missed ? UI.missedSm : "");
    if (left !== lastLeft) $("#sbLeft").innerHTML = lastLeft = left;
    $$("[data-badge]").forEach(b => {
      const n = b.dataset.badge === "messages" ? unread : ["phone", "log"].includes(b.dataset.badge) ? missed : 0;
      b.hidden = !n;
      b.textContent = n > 99 ? "99+" : n;
    });
  }
  function initStatus() {
    const b = Math.max(1, Math.min(100, P.battery ?? 64));
    $("#batFill").style.height = `max(2px, calc(${b}% - 2px))`;
    $(".bat").classList.toggle("low", b <= 15);
    $("#batPct").textContent = P.batteryPercent === false ? "" : `${b}%`;
    $("#sbNet").textContent = P.network || "3G";
    tick();
    setInterval(tick, 1000);
  }

  /* ---------- 잠금 화면 ---------- */
  let locked = true;
  function lockScreen() {
    const L = P.lock || { type: "swipe" };
    const stat = [];
    if (missedCount()) stat.push(`<span>${UI.missedSm}부재중 전화 ${missedCount()}</span>`);
    if (unreadCount()) stat.push(`<span>${UI.msgSm}새 메시지 ${unreadCount()}</span>`);
    const el = h(`<section class="lock wall" ${wall()}>
      <div class="lk-top"><div class="lk-time"><span data-clock></span><small data-ampm></small></div><div class="lk-date" data-date></div></div>
      <div class="lk-stat">${stat.join("")}</div>
      <div class="lk-slide"><div class="lk-track"><span class="lk-knob">${UI.arrow}</span><span class="lk-txt">밀어서 잠금 해제</span></div></div>
      <div class="pin" hidden></div>
    </section>`);
    screen.appendChild(el);
    screen.classList.add("locked");

    /* 손잡이를 오른쪽 끝까지 밀면 열림. 그냥 눌러도 저절로 밀려서 열림 */
    const track = $(".lk-track", el), knob = $(".lk-knob", el);
    let x0 = null, dx = 0;
    const max = () => track.clientWidth - knob.offsetWidth - 8;
    track.addEventListener("pointerdown", e => { x0 = e.clientX; dx = 0; knob.classList.remove("back"); track.setPointerCapture(e.pointerId); });
    track.addEventListener("pointermove", e => {
      if (x0 === null) return;
      dx = Math.max(0, Math.min(max(), e.clientX - x0));
      knob.style.transform = `translateX(${dx}px)`;
    });
    const release = () => {
      if (x0 === null) return;
      x0 = null;
      knob.classList.add("back");
      if (dx > max() * 0.6 || dx < 4) { knob.style.transform = `translateX(${max()}px)`; setTimeout(done, 200); }
      else knob.style.transform = "";
    };
    track.addEventListener("pointerup", release);
    track.addEventListener("pointercancel", release);
    const done = () => (L.type === "pin" ? showPin() : unlock());

    function showPin() {
      const code = String(L.code || "0000");
      let typed = "", wrong = 0;
      const pin = $(".pin", el);
      pin.hidden = false;
      pin.innerHTML = `<div class="pin-msg">PIN을 입력하세요</div><div class="pin-hint"></div><div class="pin-box"></div>
        <div class="pin-keys">${"123456789".split("").map(k => `<button data-p="${k}">${k}</button>`).join("")}
          <button class="txt" data-p="cancel">취소</button><button data-p="0">0</button><button class="txt" data-p="del">삭제</button></div>`;
      const box = $(".pin-box", pin);
      const draw = () => (box.textContent = "●".repeat(typed.length));
      pin.onclick = e => {
        const k = e.target.closest("[data-p]")?.dataset.p;
        if (!k) return;
        if (k === "cancel") { pin.hidden = true; knob.style.transform = ""; return; }
        if (k === "del") { typed = typed.slice(0, -1); draw(); return; }
        if (typed.length >= code.length) return;
        typed += k;
        draw();
        if (typed.length < code.length) return;
        if (typed === code) return setTimeout(unlock, 150);
        wrong++;
        box.classList.add("shake");
        $(".pin-msg", pin).textContent = `PIN이 틀렸습니다 (${wrong}회)`;
        if (L.hint && wrong >= (L.hintAfter ?? 2)) $(".pin-hint", pin).textContent = `힌트: ${L.hint}`;
        setTimeout(() => { box.classList.remove("shake"); typed = ""; draw(); }, 450);
      };
    }
    function unlock() {
      locked = false;
      screen.classList.remove("locked");
      el.classList.add("gone");
      setTimeout(() => el.remove(), 300);
    }
    tick();
  }

  /* ---------- 홈 · 메인메뉴 ---------- */
  const appBtn = id => `<button class="app" data-app="${id}"><span class="ic">${APP_ICON[id]()}</span><span class="lb">${APPS[id].label}</span><b class="badge" data-badge="${id}" hidden></b></button>`;
  /* 날씨 위젯 (data.js 의 weather). 밤에는 달, 낮에는 해 */
  function weatherHTML() {
    const W = P.weather;
    if (!W) return "";
    const hr = now().getHours(), night = hr < 6 || hr >= 18;
    const icon = night
      ? `<svg viewBox="0 0 48 48"><path d="M30 6a18 18 0 1 0 12 30A16 16 0 0 1 30 6z" fill="#fff6c9" stroke="#fff" stroke-width="1.5"/></svg>`
      : `<svg viewBox="0 0 48 48"><circle cx="24" cy="24" r="9" fill="#fff"/><g stroke="#fff" stroke-width="3" stroke-linecap="round">${[0, 45, 90, 135, 180, 225, 270, 315].map(a => `<path transform="rotate(${a} 24 24)" d="M24 4v6"/>`).join("")}</g></svg>`;
    return `<div class="s4-wx">${icon}<div class="wx-city">◉ ${esc(W.city || "")}</div><div class="wx-main"><span>${esc(W.text || "")}</span><b>${esc(W.temp ?? "")}°C</b></div>${W.updated ? `<div class="wx-up">${esc(W.updated)} ↻</div>` : ""}</div>`;
  }
  function homeScreen() {
    push(h(`<section class="home wall" ${wall()}>
      <div class="s4-top">
        <div class="s4-clock"><div class="s4-time"><span data-clock></span><small data-ampm></small></div><div class="s4-date" data-sdate></div></div>
        ${weatherHTML()}
      </div>
      <button class="g-bar" data-app="internet"><span>Google</span><svg viewBox="0 0 24 24"><rect x="9" y="3" width="6" height="11" rx="3" fill="#fff"/><path d="M6 11a6 6 0 0 0 12 0M12 17v4" fill="none" stroke="#fff" stroke-width="1.8" stroke-linecap="round"/></svg></button>
      <div class="hgrid">${["gallery", "mail", "memo", "log"].map(appBtn).join("")}</div>
      <div class="dots"><i></i><i></i><svg viewBox="0 0 16 16"><path d="M2 8l6-5.5L14 8M4 7v6.5h3V10h2v3.5h3V7" fill="none" stroke="#fff" stroke-width="1.6" stroke-linejoin="round"/></svg><i></i><i></i></div>
      <div class="dock">${["phone", "contacts", "messages", "internet", "menu"].map(appBtn).join("")}</div>
    </section>`));
    tick();
  }
  function drawer() {
    push(h(`<section class="drawer wall" ${wall()}>
      <div class="d-tabs"><b>앱스</b><span>위젯</span></div>
      <div class="dgrid">${["phone", "contacts", "messages", "internet", "log", "mail", "gallery", "memo"].map(appBtn).join("")}</div>
    </section>`));
    tick();
  }
  screensEl.addEventListener("click", e => { const b = e.target.closest("[data-app]"); if (b) APPS[b.dataset.app].open(); });

  /* ---------- 전화 ---------- */
  function phoneApp(tab = "keypad") {
    const TABS = [["keypad", "키패드", UI.keypad], ["recent", "최근기록", UI.log], ["contacts", "전화번호부", UI.person]];
    const el = h(`<section><nav class="ptabs">${TABS.map(([id, l, ic]) => `<button data-tab="${id}">${ic}<span>${l}</span></button>`).join("")}</nav><div class="body"></div></section>`);
    const body = $(".body", el);
    function show(t) {
      tab = t;
      $$("[data-tab]", el).forEach(b => b.classList.toggle("on", b.dataset.tab === t));
      body.innerHTML = "";
      if (t === "keypad") body.appendChild(keypad());
      if (t === "recent") { body.appendChild(recents()); P.calls.forEach(c => (c.seen = true)); tick(); }
      if (t === "contacts") body.appendChild(contactList());
    }
    el.addEventListener("click", e => { const b = e.target.closest("[data-tab]"); if (b) show(b.dataset.tab); });
    push(el, { onShow: () => tab === "recent" && show(tab) });
    show(tab);
  }

  function keypad() {
    let num = "";
    const KEYS = [["1", ""], ["2", "ABC"], ["3", "DEF"], ["4", "GHI"], ["5", "JKL"], ["6", "MNO"], ["7", "PQRS"], ["8", "TUV"], ["9", "WXYZ"], ["*", ""], ["0", "+"], ["#", ""]];
    const el = h(`<div class="kp">
      <div class="kp-disp"><div class="kp-num"></div><div class="kp-name"></div></div>
      <div class="kp-keys">${KEYS.map(([k, s]) => `<button data-k="${k}"><b>${k}</b><small>${s}</small></button>`).join("")}</div>
      <div class="kp-act"><button data-sms aria-label="메시지">${UI.msg}</button><button class="kp-call" data-call>${UI.call}통화</button><button data-del aria-label="지우기">${UI.del}</button></div>
    </div>`);
    const upd = () => {
      $(".kp-num", el).textContent = fmtNum(num);
      const p = num && person(num);
      $(".kp-name", el).textContent = p && p.saved ? p.name : "";
    };
    el.addEventListener("click", e => {
      const k = e.target.closest("[data-k]");
      if (k) { if (num.length < 15) num += k.dataset.k; tone(DTMF[k.dataset.k], 120); upd(); return; }
      if (e.target.closest("[data-del]")) { num = num.slice(0, -1); upd(); return; }
      if (e.target.closest("[data-sms]")) { if (num) openThread(num); return; }
      if (e.target.closest("[data-call]")) {
        if (num) return startCall(num);
        const last = P.calls.find(c => c.dir === "out");
        if (last) { num = digits(person(last.who).number); upd(); }
      }
    });
    upd();
    return el;
  }

  function recents() {
    if (!P.calls.length) return h(empty("통화 기록이 없습니다"));
    const DIR = { in: "수신", out: "발신", missed: "부재중" };
    const el = h(`<ul class="rows">${P.calls.map(c => {
      const p = person(c.who);
      return `<li class="${c.dir}" data-who="${esc(c.who)}"><span class="dir-ic">${UI[c.dir] || ""}</span>
        <div class="r-main"><b>${esc(p.name)}${c.count > 1 ? ` (${c.count})` : ""}</b><small>${esc([p.saved ? p.number : DIR[c.dir], c.dur].filter(Boolean).join(" · "))}</small></div>
        <div class="r-side">${c.date && c.date !== ymd(now()) ? `<span>${esc(shortDay(c.date, ""))}</span>` : ""}<span>${esc(c.time || "")}</span></div>
        <button class="r-call" data-dial="${esc(c.who)}" aria-label="전화 걸기">${UI.call}</button></li>`;
    }).join("")}</ul>`);
    el.addEventListener("click", e => {
      const d = e.target.closest("[data-dial]");
      if (d) return startCall(d.dataset.dial);
      const li = e.target.closest("[data-who]");
      if (li) contactDetail(li.dataset.who);
    });
    return el;
  }

  /* ---------- 전화번호부 ---------- */
  function contactList() {
    const sorted = [...P.contacts].sort((a, b) => a.name.localeCompare(b.name, "ko"));
    const el = h(`<div><div class="search"><input type="search" placeholder="검색"></div><div class="ct-list"></div></div>`);
    const listEl = $(".ct-list", el);
    function render(q = "") {
      const f = sorted.filter(c => !q || c.name.includes(q) || digits(c.number).includes(digits(q) || "\u0000"));
      if (!f.length) { listEl.innerHTML = empty(q ? "검색 결과가 없습니다" : "연락처가 없습니다"); return; }
      const groups = {};
      for (const c of f) (groups[groupOf(c.name)] ||= []).push(c);
      listEl.innerHTML = Object.entries(groups).map(([g, cs]) =>
        `<div class="idx-h">${esc(g)}</div><ul class="rows">${cs.map(c =>
          `<li data-who="${esc(c.number)}">${avatar(c.number, "sm")}<div class="r-main"><b>${esc(c.name)}</b></div></li>`).join("")}</ul>`).join("");
    }
    $("input", el).addEventListener("input", e => render(e.target.value.trim()));
    listEl.addEventListener("click", e => { const li = e.target.closest("[data-who]"); if (li) contactDetail(li.dataset.who); });
    render();
    return el;
  }
  function contactDetail(key) {
    const p = person(key);
    const c = p.c || {};
    const extra = [...Object.entries(c.info || {})];
    if (c.note) extra.push(["메모", c.note]);
    const el = h(`<section>${tbar("연락처 정보")}<div class="body">
      <div class="cd-head">${avatar(key, "xl")}<b>${esc(p.name)}</b></div>
      <div class="cd-row"><div><small>휴대폰</small><span>${esc(p.number)}</span></div>
        <button class="cd-btn call" data-act="call" aria-label="전화 걸기"${c.noCall ? " disabled" : ""}>${UI.call}</button><button class="cd-btn sms" data-act="sms" aria-label="문자 보내기">${UI.msg}</button></div>
      ${extra.map(([k, v]) => `<div class="cd-row"><div><small>${esc(k)}</small><span>${esc(v)}</span></div></div>`).join("")}
    </div></section>`);
    el.addEventListener("click", e => {
      const a = e.target.closest("[data-act]")?.dataset.act;
      if (a === "call") startCall(key);
      if (a === "sms") openThread(key);
    });
    push(el);
  }

  /* ---------- 통화 ---------- */
  const callCount = {};
  function scriptFor(p) {
    const keys = Object.keys(P.callScripts);
    const k = keys.find(k => digits(k) && digits(k) === digits(p.number)) || keys.find(k => k === p.name);
    return k ? P.callScripts[k] : null;
  }
  function startCall(key) {
    const p = person(key);
    if (p.c?.noCall) return; // data.js 에서 noCall: true 인 사람은 전화가 걸리지 않음
    const n = (callCount[idOf(p)] = (callCount[idOf(p)] || 0) + 1);
    let sc = scriptFor(p);
    if (sc && sc.again && n > 1) sc = sc.again;

    const el = h(`<section class="call ringing">
      <div class="call-st">발신 중</div>
      <div class="call-name">${esc(p.name)}</div>
      <div class="call-num">${p.saved ? esc(p.number) : ""}</div>
      ${avatar(key, "call")}
      <div class="call-time"></div>
      <div class="call-lines"></div>
      <div class="call-grid">
        <button data-cb="add">${UI.add}통화 추가</button><button data-cb="kp">${UI.keypad}키패드</button><button class="end" data-end>${UI.call}통화 종료</button>
        <button data-cb="spk">${UI.spk}스피커</button><button data-cb="mute">${UI.mute}소리 끄기</button><button data-cb="hs">${UI.hs}헤드셋</button>
      </div>
    </section>`);
    const st = $(".call-st", el), timeEl = $(".call-time", el), lines = $(".call-lines", el);
    const timers = [];
    const at = (ms, fn) => timers.push(setTimeout(fn, ms));
    let ring = ringback(), connectedAt = 0, clockId = 0, ended = false;

    const say = (cls, text) => { lines.appendChild(h(`<p class="${cls}">${nl(text)}</p>`)); lines.scrollTop = lines.scrollHeight; };
    const connect = () => {
      ring.stop();
      el.classList.remove("ringing");
      st.textContent = "통화 중";
      connectedAt = Date.now();
      timeEl.textContent = "00:00";
      clockId = setInterval(() => (timeEl.textContent = mmss(Math.floor((Date.now() - connectedAt) / 1000))), 500);
    };
    function end(msg) {
      if (ended) return;
      ended = true;
      timers.forEach(clearTimeout);
      ring.stop();
      clearInterval(clockId);
      if (msg) say("sys", msg);
      st.textContent = "통화 종료";
      el.classList.add("ringing");
      const sec = connectedAt ? Math.floor((Date.now() - connectedAt) / 1000) : 0;
      P.calls.unshift({ who: p.number, dir: "out", date: ymd(now()), time: ampm(now()), dur: sec ? mmss(sec) : "", seen: true });
      setTimeout(() => pop(true), msg ? 1600 : 800);
    }

    const ringMs = sc?.ring ?? (sc ? 4000 : 9000);
    if (!sc || sc.dead) {
      at(ringMs, () => {
        ring.stop();
        const text = sc?.dead || P.noAnswer || "고객님의 전화기가 꺼져 있어 소리샘으로 연결됩니다.";
        say("sys", text);
        at(1000, () => end()); // 안내 문구가 뜨고 1초 뒤 통화 종료
      });
    } else {
      at(ringMs, () => {
        connect();
        let t = 500;
        for (const ln of sc.lines || []) {
          if (ln.wait) { t += ln.wait; continue; }
          const [cls, text] = ln.me != null ? ["me", ln.me] : ln.sys != null ? ["sys", ln.sys] : ["them", ln.them ?? ""];
          at(t, () => say(cls, text));
          t += Math.max(1500, String(text).length * 95);
        }
        at(t + 600, () => end(sc.hangup === false ? "" : "상대방이 통화를 종료했습니다"));
      });
    }

    el.addEventListener("click", e => {
      if (e.target.closest("[data-end]")) return end();
      const b = e.target.closest("[data-cb]");
      if (!b) return;
      if (["spk", "mute"].includes(b.dataset.cb)) b.classList.toggle("on");
      else toast("지금은 사용할 수 없습니다");
    });
    push(el, { modal: true, onClose: () => { ended = true; timers.forEach(clearTimeout); ring.stop(); clearInterval(clockId); } });
  }

  /* ---------- 메시지 ---------- */
  function messagesApp() {
    const el = h(`<section>${tbar("메시지")}<div class="body"><ul class="rows"></ul></div></section>`);
    const ul = $("ul", el);
    const render = () => {
      const html = P.messages.map((c, i) => {
        if (!c.msgs.some(m => !m.date)) return ""; // 열어만 보고 아무것도 안 보낸 대화방은 숨김
        const p = person(c.with);
        const last = [...c.msgs].reverse().find(m => !m.date);
        const lastDay = [...c.msgs.slice(0, c.msgs.lastIndexOf(last) + 1)].reverse().find(m => m.date)?.date;
        return `<li data-i="${i}" class="${c.unread ? "unread" : ""}">${avatar(c.with)}<div class="r-main"><b>${esc(p.name)}</b><small>${last.img && !last.text ? "사진" : esc(last.text)}</small></div>
          <div class="r-side"><span>${esc(shortDay(lastDay, last.time || ""))}</span>${c.unread ? `<b class="cnt">${c.unread}</b>` : ""}</div></li>`;
      }).join("");
      ul.innerHTML = html || `<li style="pointer-events:none;background:none;border:0">${empty("메시지가 없습니다")}</li>`;
    };
    ul.addEventListener("click", e => { const li = e.target.closest("[data-i]"); if (li) thread(P.messages[+li.dataset.i]); });
    push(el, { onShow: render });
    render();
  }
  function openThread(key) {
    const p = person(key);
    let conv = P.messages.find(c => idOf(person(c.with)) === idOf(p));
    if (!conv) { conv = { with: p.number, msgs: [] }; P.messages.unshift(conv); }
    thread(conv);
  }
  /* 새 메시지를 넣기 전에, 마지막 날짜 구분선이 오늘이 아니면 오늘 날짜를 끼워 넣음 */
  function stampToday(conv) {
    const today = ymd(now());
    const lastDay = [...conv.msgs].reverse().find(m => m.date)?.date;
    if (lastDay === today) return null;
    const d = { date: today };
    conv.msgs.push(d);
    return d;
  }
  function bubble(m) {
    if (m.date) return h(`<div class="day">${esc(dayLabel(m.date))}</div>`);
    return h(`<div class="bub ${m.me ? "me" : "them"}"><div class="b">${m.img ? `<img src="${esc(m.img)}" alt="">` : ""}${m.text ? nl(m.text) : ""}<time>${esc(m.time || "")}</time></div></div>`);
  }
  function thread(conv) {
    conv.unread = 0;
    tick();
    const p = person(conv.with);
    const el = h(`<section class="thread">
      <header class="th-head">${avatar(conv.with)}<div><b>${esc(p.name)}</b><span>${esc(String(p.number).replace(/-/g, ""))}</span></div><button class="th-call" data-dial aria-label="전화 걸기">${UI.call}</button></header>
      <div class="msgs"></div>
      <form class="composer"><input placeholder="메시지 입력" enterkeyhint="send" autocomplete="off"><button>전송</button></form></section>`);
    const box = $(".msgs", el);
    const down = () => (box.scrollTop = box.scrollHeight);
    conv.msgs.forEach(m => box.appendChild(bubble(m)));
    let typingEl = null;
    conv._view = {
      add: m => { typingEl?.remove(); typingEl = null; box.appendChild(bubble(m)); down(); },
      typing: on => {
        if (on && !typingEl) { typingEl = h(`<div class="bub them typing"><div class="b"><i></i><i></i><i></i></div></div>`); box.appendChild(typingEl); down(); }
        if (!on && typingEl) { typingEl.remove(); typingEl = null; }
      },
    };
    $("[data-dial]", el).addEventListener("click", () => startCall(conv.with));
    /* 첨부 사진을 누르면 크게 보기 */
    box.addEventListener("click", e => {
      const img = e.target.closest(".b img");
      if (img) viewer([{ img: img.getAttribute("src") }], 0);
    });
    $("form", el).addEventListener("submit", e => {
      e.preventDefault();
      const input = $("input", el);
      const text = input.value.trim();
      if (!text) return;
      input.value = "";
      const day = stampToday(conv);
      if (day) conv._view.add(day);
      const m = { me: true, text, time: ampm(now()) };
      conv.msgs.push(m);
      conv._view.add(m);
      P.messages.splice(P.messages.indexOf(conv), 1);
      P.messages.unshift(conv);
      queueReplies(conv);
    });
    push(el, { onClose: () => { conv._view = null; } });
    down();
    $$("img", box).forEach(i => i.addEventListener("load", down, { once: true })); // 사진이 늦게 뜨면 다시 맨 아래로
  }

  const sentCount = {};
  function nextReplies(conv) {
    const p = person(conv.with);
    const r = P.replies[p.number] ?? P.replies[digits(p.number)] ?? P.replies[p.name];
    if (!r) return [];
    const seq = Array.isArray(r) ? r : r.seq || [];
    const loop = Array.isArray(r) ? null : r.loop;
    const k = (sentCount[idOf(p)] = (sentCount[idOf(p)] || 0) + 1) - 1;
    if (k < seq.length) return [].concat(seq[k]);
    if (loop && loop.length) return [].concat(loop[(k - seq.length) % loop.length]);
    return [];
  }
  function queueReplies(conv) {
    const replies = nextReplies(conv);
    let t = rand(1400, 2600);
    replies.forEach((text, i) => {
      setTimeout(() => conv._view?.typing(true), t - 1100);
      t += i ? Math.max(1200, String(text).length * 45) : 0;
      setTimeout(() => deliver(conv, { text, time: ampm(now()) }), t);
      t += 400;
    });
  }
  function deliver(conv, m) {
    const day = stampToday(conv);
    if (day && conv._view) conv._view.add(day);
    conv.msgs.push(m);
    P.messages.splice(P.messages.indexOf(conv), 1);
    P.messages.unshift(conv);
    if (conv._view) return conv._view.add(m);
    conv.unread = (conv.unread || 0) + 1;
    top().onShow?.();
    tick();
    ticker(conv.with, m.text, () => thread(conv));
    tone([880], 90, 0.03);
  }

  /* ---------- 갤러리 ---------- */
  /* 영상(video)은 첫 장면을 썸네일로 쓰고 ▶ 와 길이를 붙임 */
  const thumb = ph => ph.video
    ? `<video src="${esc(ph.video)}#t=0.1" muted playsinline preload="metadata"></video><span class="v-badge">▶${ph.duration ? ` ${esc(ph.duration)}` : ""}</span>`
    : ph.img ? `<img src="${esc(ph.img)}" alt="" loading="lazy">` : `<div class="ph-ph" style="--h:${hue(ph.caption || "")}"><span>${esc(ph.caption || "")}</span></div>`;
  function galleryApp() {
    const el = h(`<section>${tbar("갤러리")}<div class="body">${P.gallery.length ? `<div class="albums">${P.gallery.map((a, i) =>
      `<button class="album" data-a="${i}"><div class="th">${a.photos?.[0] ? thumb(a.photos[0]) : ""}</div><b>${esc(a.album)}</b><small>(${(a.photos || []).length})</small></button>`).join("")}</div>` : empty("사진이 없습니다")}</div></section>`);
    el.addEventListener("click", e => { const b = e.target.closest("[data-a]"); if (b) album(P.gallery[+b.dataset.a]); });
    push(el);
  }
  function album(a) {
    const photos = a.photos || [];
    const el = h(`<section>${tbar(a.album, `<small>${photos.length}</small>`)}<div class="body"><div class="photos">${photos.map((ph, i) => `<button data-p="${i}">${thumb(ph)}</button>`).join("")}</div></div></section>`);
    el.addEventListener("click", e => { const b = e.target.closest("[data-p]"); if (b) viewer(photos, +b.dataset.p); });
    push(el);
  }
  function viewer(list, i) {
    const el = h(`<section class="viewer"><div class="vw-top"></div><div class="vw-stage"></div><div class="vw-cap"></div></section>`);
    const stage = $(".vw-stage", el), cap = $(".vw-cap", el);
    const show = () => {
      const ph = list[i];
      stage.innerHTML = ph.video
        ? `<video src="${esc(ph.video)}" controls autoplay playsinline></video>`
        : `${ph.img ? `<img src="${esc(ph.img)}" alt="">` : thumb(ph)}<button class="vw-nav prev" aria-label="이전"></button><button class="vw-nav next" aria-label="다음"></button>`;
      cap.innerHTML = `${ph.date ? `<small>${esc(ph.date)}</small>` : ""}${(ph.img || ph.video) && ph.caption ? nl(ph.caption) : ""}`;
      $(".vw-top", el).textContent = `${i + 1}/${list.length}`;
    };
    const go = d => { const j = i + d; if (j >= 0 && j < list.length) { i = j; show(); } };
    stage.addEventListener("click", e => { if (e.target.closest(".prev")) go(-1); if (e.target.closest(".next")) go(1); });
    let x0 = null;
    stage.addEventListener("pointerdown", e => (x0 = e.clientX));
    stage.addEventListener("pointerup", e => { if (x0 !== null && Math.abs(e.clientX - x0) > 40) go(e.clientX < x0 ? 1 : -1); x0 = null; });
    push(el, { onClose: () => $("video", stage)?.pause() });
    show();
  }

  /* ---------- 메모 ---------- */
  function memoApp() {
    const el = h(`<section>${tbar("메모")}<div class="body">${P.memos.length ? `<div class="memos">${P.memos.map((m, i) => {
        /* 제목이 없으면 첫 줄을 제목처럼, 나머지를 미리보기로 */
        const lines = (m.body || "").split("\n");
        const title = m.title || lines[0];
        const rest = m.title ? m.body || "" : lines.slice(1).join("\n");
        return `<button class="memo" data-m="${i}"><b>${esc(title)}</b><p>${esc(rest)}</p><small>${esc(m.date || "")}</small></button>`;
      }).join("")}</div>` : empty("메모가 없습니다")}</div></section>`);
    el.addEventListener("click", e => {
      const b = e.target.closest("[data-m]");
      if (!b) return;
      const m = P.memos[+b.dataset.m];
      push(h(`<section>${tbar(m.title || "메모")}<div class="body memo-view"><small>${esc(m.date || "")}</small><div>${esc(m.body || "")}</div></div></section>`));
    });
    push(el);
  }

  /* ---------- 메일 (옛날 안드로이드 메일 앱 느낌) ---------- */
  const FOLDERS = [["inbox", "받은편지함"], ["sent", "보낸편지함"], ["trash", "휴지통"]];
  const ROBOT = `<svg viewBox="0 0 40 40"><rect width="40" height="40" fill="#e9e9ec"/><g fill="#a3a6ad"><path d="M11 17a9 8 0 0 1 18 0z"/><rect x="11" y="18.5" width="18" height="14" rx="2"/><rect x="6" y="18.5" width="3.6" height="10" rx="1.8"/><rect x="30.4" y="18.5" width="3.6" height="10" rx="1.8"/><rect x="14" y="31" width="3.6" height="7" rx="1.8"/><rect x="22.4" y="31" width="3.6" height="7" rx="1.8"/><path d="M14 8.5l2 3M26 8.5l-2 3" stroke="#a3a6ad" stroke-width="1.3" stroke-linecap="round"/></g><circle cx="16" cy="13.5" r="1" fill="#e9e9ec"/><circle cx="24" cy="13.5" r="1" fill="#e9e9ec"/></svg>`;
  const mailDay = m => { if (!isYmd(m.date)) return m.date || ""; const [, mo, da] = m.date.split("-").map(Number); return `${mo}월 ${da}일`; };
  function mailApp() {
    const el = h(`<section class="mail">${tbar("메일", P.mail.account ? `<small>${esc(P.mail.account)}</small>` : "")}<div class="body"><ul class="ml-folders">${FOLDERS.map(([id, label]) => {
      const n = (P.mail[id] || []).length;
      return `<li data-f="${id}"><span>${label}</span>${n ? `<b>${n}</b>` : ""}</li>`;
    }).join("")}</ul></div></section>`);
    el.addEventListener("click", e => { const li = e.target.closest("[data-f]"); if (li) mailFolder(li.dataset.f); });
    push(el);
  }
  function mailFolder(id) {
    const label = FOLDERS.find(f => f[0] === id)[1];
    const list = P.mail[id] || [];
    const el = h(`<section class="mail">${tbar(label)}<div class="body">${list.length ? `<ul class="ml-list">${list.map((m, i) =>
      `<li data-m="${i}"><div class="ml-row1"><b>${esc(id === "sent" ? m.to : m.fromName || m.from)}</b><span>${esc(mailDay(m))}</span></div><div class="ml-sub">${esc(m.subject || "(제목 없음)")}</div><div class="ml-snip">${esc((m.body || "").replace(/\s+/g, " "))}</div></li>`).join("")}</ul>` : `<div class="ml-empty">메일이 없습니다</div>`}</div></section>`);
    el.addEventListener("click", e => { const li = e.target.closest("[data-m]"); if (li) mailView(list[+li.dataset.m], label); });
    push(el);
  }
  function mailView(m, label) {
    const el = h(`<section class="mail"><div class="body">
      <div class="ml-subj"><b>${esc(m.subject || "(제목 없음)")}</b><small>${esc(label)}</small></div>
      <div class="ml-card">
        <div class="ml-from"><span class="ml-av">${ROBOT}</span><div class="ml-who"><b>${esc(m.fromName || m.from)}</b><span>${esc(m.fromName ? m.from : "")}</span></div>
          <div class="ml-btns"><button data-mb="star" aria-label="별표">★</button><button data-mb="reply" aria-label="답장"><svg viewBox="0 0 24 24"><path d="M10 6L4 11.5 10 17M4 11.5h10a6 5.5 0 0 1 6 5.5" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg></button><button data-mb="more" aria-label="더보기">◂</button></div></div>
        <div class="ml-meta"><span>받는사람: ${esc(m.to || "")}</span><div class="ml-date"><b>${esc(mailDay(m))}</b><small>${esc(m.time || "")}</small></div></div>
      </div>
      <div class="ml-body">${nl(m.body || "")}</div>
    </div></section>`);
    el.addEventListener("click", e => {
      const b = e.target.closest("[data-mb]");
      if (!b) return;
      if (b.dataset.mb === "star") b.classList.toggle("on");
      else toast("지금은 사용할 수 없습니다");
    });
    push(el);
  }

  /* ---------- 인터넷 (모바일 유튜브 화면) ---------- */
  const THUMB_UP = `<svg viewBox="0 0 24 24"><path d="M2 10h4v11H2zM8 21h9.5a2 2 0 0 0 2-1.6l1.4-7A2 2 0 0 0 19 10h-5.5l.8-4a2 2 0 0 0-3.6-1.5L8 10z" fill="currentColor"/></svg>`;
  function internetApp() {
    const I = P.internet || {};
    const v = I.video || {};
    const B = I.board;
    const rel = I.related || [];
    const likes = parseInt(String(v.likes || 0).replace(/\D/g, ""), 10) || 0;
    const dislikes = parseInt(String(v.dislikes || 0).replace(/\D/g, ""), 10) || 0;
    const ratio = likes + dislikes ? Math.round((likes / (likes + dislikes)) * 100) : 100;
    /* 탭: 0 유튜브, 1 게시판(data.js 의 board 가 있을 때) */
    const tabs = [{ url: I.url || "", fav: "yt-fav", label: v.title ? `${v.title} - YouTube` : "YouTube" }];
    if (B) tabs.push({ url: B.url || "", fav: "bd-fav", label: B.name || B.title || "" });
    const el = h(`<section class="browser">
      <div class="br-bar"><span class="br-url"><i class="br-fav"></i><span class="br-u"></span></span><button class="br-btn" data-br aria-label="새로고침">↻</button><span class="br-tabs">${tabs.length}</span></div>
      ${tabs.length > 1 ? `<div class="br-strip">${tabs.map((t, k) => `<button data-tab="${k}"><i class="${t.fav}"></i><span>${esc(t.label)}</span></button>`).join("")}</div>` : ""}
      <div class="br-pages">
      <div class="body yt" data-page="0">
        <header class="yt-head"><span class="yt-logo">You<b>Tube</b></span><span class="yt-hicons"><svg viewBox="0 0 24 24"><circle cx="10.5" cy="10.5" r="6" fill="none" stroke="currentColor" stroke-width="2.2"/><path d="M15 15l5 5" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/></svg><svg viewBox="0 0 24 24"><path d="M4 6h16M4 12h16M4 18h16" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg></span></header>
        <div class="yt-player" data-play>${v.poster ? `<img src="${esc(v.poster)}" alt="">` : ""}<span class="yt-big"><svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z" fill="#fff"/></svg></span>${v.duration ? `<span class="yt-dur">${esc(v.duration)}</span>` : ""}</div>
        <div class="yt-info"><h1>${esc(v.title || "")}</h1><div class="yt-views">조회수 ${esc(v.views || "0")}회</div></div>
        <div class="yt-rate"><span class="up">${THUMB_UP}${esc(v.likes ?? "")}</span><span class="down">${THUMB_UP}${esc(v.dislikes ?? "")}</span><div class="yt-ratio"><i style="width:${ratio}%"></i></div></div>
        <div class="yt-ch"><span class="yt-av">${SIL}</span><div><b>${esc(v.uploader || "")}</b>${v.subscribers ? `<small>구독자 ${esc(v.subscribers)}명</small>` : ""}</div><button class="yt-sub" data-yt>구독</button></div>
        <div class="yt-desc"><b>업로드된 날짜: ${esc(v.date || "")}</b>${v.desc ? `<p>${nl(v.desc)}</p>` : ""}</div>
        ${rel.length ? `<div class="yt-rel-h">관련 동영상</div><ul class="yt-rel">${rel.map(r => `<li data-yt><span class="yt-th">${r.thumb ? `<img src="${esc(r.thumb)}" alt="" loading="lazy">` : ""}${r.duration ? `<b>${esc(r.duration)}</b>` : ""}</span><div><b>${esc(r.title)}</b><small>${esc(r.uploader || "")}</small><small>조회수 ${esc(r.views || "0")}회</small></div></li>`).join("")}</ul>` : ""}
      </div>
      ${B ? boardHTML(B) : ""}
      </div>
    </section>`);
    const player = $(".yt-player", el);
    const pauseVideo = () => $("video", player)?.pause();
    function showTab(k) {
      $$("[data-page]", el).forEach(pg => (pg.hidden = +pg.dataset.page !== k));
      $$("[data-tab]", el).forEach(b => b.classList.toggle("on", +b.dataset.tab === k));
      $(".br-u", el).textContent = tabs[k].url;
      $(".br-fav", el).className = `br-fav ${tabs[k].fav}`;
      if (k !== 0) pauseVideo();
    }
    player.addEventListener("click", () => {
      if (!v.src) return toast("동영상을 재생할 수 없습니다.");
      if ($("video", player)) return;
      player.innerHTML = `<video src="${esc(v.src)}" ${v.poster ? `poster="${esc(v.poster)}"` : ""} controls autoplay playsinline></video>`;
    });
    el.addEventListener("click", e => {
      const t = e.target.closest("[data-tab]");
      if (t) return showTab(+t.dataset.tab);
      if (e.target.closest("[data-yt]")) toast("페이지를 불러올 수 없습니다.");
      if (e.target.closest("[data-br]")) toast("새로고침 중…");
      if (e.target.closest("[data-bd]")) toast("권한이 없습니다.");
    });
    push(el, { onClose: pauseVideo });
    showTab(0);
  }
  /* 게시판 (옛날 익명 커뮤니티 · 검은 화면) */
  function boardHTML(B) {
    const body = nl(B.body || "").replace(/([\w.+-]+@[\w-]+\.[\w.]+)/g, '<a class="bd-mail">$1</a>');
    const others = B.others ?? 4; // 아래 목록에 보일 '삭제된 게시물' 줄 수
    const no = +B.no || 1104;
    return `<div class="body bd" data-page="1" hidden>
      <div class="bd-top"><b>${esc(B.name || "")}</b>${B.sub ? `<small>${esc(B.sub)}</small>` : ""}</div>
      <div class="bd-view">
        <div class="bd-title">${esc(B.title || "")}</div>
        <div class="bd-meta"><span class="bd-nick">${esc(B.author || "")}</span>${B.date ? `<span>${esc(B.date)}</span>` : ""}<span>조회 ${esc(B.views ?? 0)}</span></div>
        <div class="bd-body">${body}</div>
      </div>
      <div class="bd-cmt">전체 댓글 <b>0</b>개<p>등록된 댓글이 없습니다.</p></div>
      <div class="bd-btns"><button data-bd>목록</button><button data-bd>글쓰기</button></div>
      <table class="bd-list"><tr><th>번호</th><th>제목</th><th>글쓴이</th></tr>
        <tr class="cur"><td>${no}</td><td>${esc(B.title || "")}</td><td>${esc(B.author || "")}</td></tr>
        ${Array.from({ length: others }, (_, k) => `<tr class="del"><td>${no - k - 1}</td><td>삭제된 게시물입니다.</td><td>-</td></tr>`).join("")}
      </table>
    </div>`;
  }

  /* ---------- 하드웨어 키 ---------- */
  $(".keys").addEventListener("click", e => {
    const k = e.target.closest("[data-key]")?.dataset.key;
    if (!k || locked) return;
    if (k === "menu") return openMenu();
    if (!optMenu.hidden) return closeMenu();
    if (k === "back") pop();
    if (k === "home") goHome();
  });
  screen.addEventListener("pointerdown", e => { if (!optMenu.hidden && !e.target.closest("#optMenu")) closeMenu(); }, true);

  /* ---------- 본문 · 휴대폰 열고 닫기 ---------- */
  const layer = $("#phoneLayer");
  const openPhone = () => { layer.classList.add("open"); tick(); };
  const closePhone = () => layer.classList.remove("open");

  function renderStory() {
    const st = $("#story");
    st.hidden = false;
    st.innerHTML = `${S.title ? `<h1>${esc(S.title)}</h1>` : ""}${S.paragraphs.map(p =>
      `<p>${nl(p).replace(/\[\[(.+?)\]\]/g, '<a href="#" class="phone-link">$1</a>')}</p>`).join("")}`;
    st.addEventListener("click", e => { if (e.target.closest(".phone-link")) { e.preventDefault(); openPhone(); } });
    $$("[data-close]", layer).forEach(b => b.addEventListener("click", closePhone));
    document.addEventListener("keydown", e => { if (e.key === "Escape") closePhone(); });
  }

  document.title = P.pageTitle || P.owner || document.title; // 브라우저 탭 이름: pageTitle, 없으면 주인 이름
  initStatus();
  homeScreen();
  lockScreen();
  if (S.paragraphs && S.paragraphs.length) renderStory();
  else { layer.classList.add("solo"); openPhone(); }

  /* 정해진 시각에 오는 문자·전화 (data.js 의 incoming) */
  for (const ev of P.incoming || []) {
    setTimeout(() => {
      const p = person(ev.from);
      if (ev.text) {
        let conv = P.messages.find(c => idOf(person(c.with)) === idOf(p));
        if (!conv) { conv = { with: ev.from, msgs: [] }; P.messages.unshift(conv); }
        deliver(conv, { text: ev.text, time: ampm(now()) });
      } else if (ev.missedCall) {
        P.calls.unshift({ who: ev.from, dir: "missed", date: ymd(now()), time: ampm(now()) });
        top().onShow?.();
        tick();
        toast(`부재중 전화: ${p.name}`);
      }
    }, (ev.after || 0) * 1000);
  }
})();
