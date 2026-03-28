// ============================================================

let sidebarTimer = null;

/* ?? 초기화?? */
document.addEventListener('DOMContentLoaded', () => {
  const saved = localStorage.getItem('ws_user');
  if (!saved) { window.location.href = 'login.html'; return; }
  WS.currentUser = JSON.parse(saved);
  WS.currentUser = JSON.parse(saved);
  // 로그인 시 당일 최초 출근 시간 자동 기록
  WS.checkIn(WS.currentUser.id);
  WS.updateUser(WS.currentUser.id, { status: '근무' });
  // ??λ맂 媛뺤“??蹂듭썝 ??--currentAccent 초기화(?щ젰 ?쎌빱 ?깆뿉 반영)
  const savedAccent = localStorage.getItem('ws_current_accent');
  if (savedAccent) applyAccent(savedAccent);
  initHeader();
  showPage('dashboard');
  setInterval(updateDateTime, 1000);
  updateDateTime();
  closeAllDropdowns();
  refreshIcons();
  renderAttendancePill();      // ??異쒗눜洹?위젯 초기화  
  // ?ъ씠?쒕컮 ??대㉧ 초기화  resetSidebarTimer();
});

function refreshIcons() {
  if (typeof lucide !== 'undefined') {
    lucide.createIcons();
  }
}

/* ?? ?ㅻ뜑 초기화?? */
function initHeader() {
  const u = WS.currentUser;
  document.getElementById('headerAvatar').textContent = u.avatar;
  document.getElementById('headerAvatar').style.background = `linear-gradient(135deg,${u.color},#9747ff)`;
  document.getElementById('headerName').textContent = u.name;
  document.getElementById('sidebarAvatar').textContent = u.avatar;
  document.getElementById('sidebarName').textContent = u.name;
  document.getElementById('sidebarRole').textContent = `${u.dept} · ${u.role}${u.pos ? ` | ${u.pos}` : ''}`;
  document.getElementById('sideTaskBadge').textContent = WS.getAssignedToMe().filter(t=>t.status!=='done').length;
  renderNotifBadge();
  renderNotifList();
}

/* ?? ?좎쭨?쒓컙 ?? */
function updateDateTime() {
  const el = document.getElementById('currentDateTime');
  if (!el) return;
  const now = new Date();
  const days = ['일','월','화','수','목','금','토'];
  el.textContent = `${now.getFullYear()}.${pad(now.getMonth()+1)}.${pad(now.getDate())} (${days[now.getDay()]}) ${pad(now.getHours())}:${pad(now.getMinutes())}`;
}
function pad(n){ return String(n).padStart(2,'0'); }

/* ?? ?섏씠吏 ?꾪솚 ?? */
function showPage(name, navEl) {
  document.querySelectorAll('.page').forEach(p => {
    p.classList.remove('active');
    p.style.display = 'none';
  });
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  document.querySelectorAll('.sub-item').forEach(n => n.classList.remove('active'));
  
  const page = document.getElementById('page-' + name);
  if (page) {
    page.classList.add('active');
    page.style.display = 'block';
  }
  if (navEl) navEl.classList.add('active');
  
  // ?섏씠吏蹂??곗씠??濡쒕뱶
  if (name === 'dashboard') renderDashboard();
  if (name === 'tasks') {
    // tasks ?섏씠吏 吏꾩엯 ??_taskViewMode 湲곕낯媛?蹂댁옣
    if (!window._taskViewMode) {
      window._taskViewMode = 'assignment';
      window._assignmentMode = window._assignmentMode || 'task';
    }
    // assignmentSubFilter ?쒖떆 상태 초기화
    const assSub = document.getElementById('assignmentSubFilter');
    const listSub = document.getElementById('taskListFilter');
    if (window._taskViewMode === 'assignment') {
      if (assSub) assSub.style.display = 'flex';
      if (listSub) listSub.style.display = 'none';
    } else {
      if (assSub) assSub.style.display = 'none';
      if (listSub) listSub.style.display = 'none';
    }
    renderPage_Tasks();
  }
  if (name === 'staff-mgmt') renderPage_StaffMgmt();
  if (name === 'settings') { window._settingsFilter = 'all'; renderPage_Settings(); }
  if (name === 'schedule') renderPage_Schedule();
  if (name === 'performance') renderPage_Performance();
  if (name === 'profile') renderPage_Profile();
  if (name === 'hq-info') renderPage_HQInfo();
  if (name === 'org-mgmt') renderPage_OrgMgmt();
  if (name === 'rank-mgmt') renderPage_RankMgmt();

  closeAllDropdowns();
}

/* ?? ?쒕툕硫붾돱 ?좉? ?? */
function toggleSubMenu(el) {
  const sb = document.getElementById('mainSidebar');
  // 異뺤냼 상태?쇰㈃ ?뺤옣 癒쇱?
  if (sb.classList.contains('collapsed')) {
    expandSidebar();
    // ?뺤옣???좊땲硫붿씠?섏쑝濡?吏꾪뻾?섎?濡??쎄컙??吏?????쇱묠
    setTimeout(() => el.classList.toggle('expanded'), 100);
  } else {
    el.classList.toggle('expanded');
  }
  resetSidebarTimer();
}

/* ?? ?뚮쭏 ?? */
function toggleTheme() {
  const cur = document.documentElement.getAttribute('data-theme') || 'light';
  const next = cur === 'light' ? 'dark' : 'light';
  applyTheme(next);
}
function applyTheme(t) {
  document.documentElement.setAttribute('data-theme', t);
  document.querySelector('.theme-toggle').innerHTML = t === 'dark' ? '<i data-lucide="sun"></i>' : '<i data-lucide="moon"></i>';
  localStorage.setItem('ws_theme', t);
  refreshIcons();
}

/* ?? 濡쒓렇?꾩썐 ?? */
function logout() {
  if (WS.currentUser) { WS.checkOut(WS.currentUser.id); WS.updateUser(WS.currentUser.id, { status: '근무(퇴근)' }); }
  localStorage.removeItem('ws_user');
  window.location.href = 'login.html';
}

/* ?? ?ъ씠?쒕컮 ?쒖뼱 (?좉퇋) ?? */
function resetSidebarTimer() {
  if (sidebarTimer) clearTimeout(sidebarTimer);
  sidebarTimer = setTimeout(() => {
    collapseSidebar();
  }, 10000); // 10초
}
function toggleSidebar() {
  const sb = document.getElementById('mainSidebar');
  if (!sb) return;
  if (sb.classList.contains('collapsed')) {
    expandSidebar();
  } else {
    collapseSidebar();
  }
}

function collapseSidebar() {
  const sb = document.getElementById('mainSidebar');
  if (sb) {
    sb.classList.add('collapsed');
  }
}

function expandSidebar() {
  const sb = document.getElementById('mainSidebar');
  if (sb) {
    sb.classList.remove('collapsed');
    resetSidebarTimer(); // 정상 범위 ?대㉧ ?ㅼ떆 ?쒖옉
  }
}

/* ?? 異쒗눜洹??? */
function checkIn() {
  WS.attendance.checkedIn = true;
  WS.attendance.checkInTime = new Date();
  document.getElementById('btnCheckin').style.display = 'none';
  document.getElementById('btnCheckout').style.display = 'flex';
  showToast('success','<i data-lucide="check-circle-2"></i> 異쒓렐 완료! 오늘???붿씠?낇븯?몄슂 ?삃');
}
function checkOut() {
  WS.attendance.checkedIn = false;
  WS.attendance.checkOutTime = new Date();
  document.getElementById('btnCheckout').style.display = 'none';
  document.getElementById('btnCheckin').style.display = 'flex';
  showToast('info','<i data-lucide="log-out"></i> 퇴근 泥섎━ 완료! 수고하셨습니다.');
}

/* ?? ?좎뒪???? */
function showToast(type, msg, duration=3000) {
  const icons = { success:'check-circle-2', error:'x-circle', info:'info' };
  const c = document.getElementById('toastContainer');
  const t = document.createElement('div');
  t.className = `toast ${type}`;
  t.innerHTML = `<span class="t-icon"><i data-lucide="${icons[type]||'message-square'}" class="icon-sm"></i></span><span class="t-msg">${msg}</span>`;
  c.appendChild(t);
  refreshIcons();
  setTimeout(() => { t.style.opacity='0'; t.style.transform='translateX(20px)'; t.style.transition='all .3s'; setTimeout(()=>t.remove(),300); }, duration);
}

/* ?? 초기화 ?? */
function toggleDropdown(id) {
  const el = document.getElementById(id);
  const isOpen = el.classList.contains('show');
  closeAllDropdowns();
  if (!isOpen) el.classList.add('show');
}
function closeAllDropdowns() {
  document.querySelectorAll('.dropdown-menu.show').forEach(d => d.classList.remove('show'));
}
document.addEventListener('click', e => {
  if (!e.target.closest('.dropdown-wrapper') && !e.target.closest('.btn-icon')) closeAllDropdowns();
});

/* ?? 紐⑤떖 ?? */
function closeModal(id, e) { if (e.target.classList.contains('modal-overlay')) closeModalDirect(id); }
function closeModalDirect(id) { document.getElementById(id).style.display = 'none'; }
function openModal(id) { document.getElementById(id).style.display = 'flex'; }

/* ?? 알림 ?? */
function renderNotifBadge() {
  const cnt = WS.unreadCount();
  const el = document.getElementById('notifBadge');
  el.textContent = cnt;
  el.style.display = cnt > 0 ? 'flex' : 'none';
}
function renderNotifList() {
  const icons = { delay:'alert-triangle', new:'plus-circle', progress:'trending-up', done:'check-circle-2', info:'info' };
  const list = document.getElementById('notifList');
  if (!list) return;
  list.innerHTML = WS.notifications.map(n => `
    <div class="dropdown-item" style="${n.read?'opacity:.5':''}">
      <span class="icon-${n.type}"><i data-lucide="${icons[n.type]||'bell'}" class="icon-sm"></i></span>
      <div>
        <div style="font-size:12px;font-weight:600;color:var(--text-primary)">${n.msg}</div>
        <div style="font-size:10.5px;color:var(--text-muted)">${n.time}</div>
      </div>
    </div>`).join('');
  refreshIcons();
}

/* ?? 寃???? */
function handleSearch(val) {
  if (!val.trim()) return;
  const results = WS.tasks.filter(t => {
    const ids = Array.isArray(t.assigneeIds) ? t.assigneeIds : (t.assigneeId ? [t.assigneeId] : []);
    return t.title.includes(val) || ids.some(uid => WS.getUser(uid)?.name.includes(val));
  });
  showToast('info', `<i data-lucide="search"></i> "${val}" 검색 결과: ${results.length}건`);
}

/* ?? ??쒕낫???뚮뜑留??? */
function renderDashboard() {
  const u = WS.currentUser;
  const sub = document.getElementById('dashSubtitle');
  if(sub) sub.textContent = `반갑습니다! ${u.name} ${u.role}님 오늘도 좋은 하루 되세요!`;
  renderStats();
  renderDashGrid();
}

function renderStats() {
  const el = document.getElementById('statsRow');
  if(!el) return;
  const all = WS.tasks;
  const mine = WS.getAssignedToMe();
  const delayed = all.filter(t=>t.status==='delay').length;
  const today = WS.getTodayTasks().length;
  const done = all.filter(t=>t.status==='done').length;
  el.innerHTML = `
    <div class="stat-card">
      <div class="stat-icon" style="background:rgba(79,110,247,.12);color:#4f6ef7"><i data-lucide="clipboard-list"></i></div>
      <div><div class="s-value">${all.length}</div><div class="s-label">전체 업무</div><div class="s-change" style="color:#22c55e">이번달 업무 현황</div></div>
    </div>
    <div class="stat-card">
      <div class="stat-icon" style="background:rgba(6,182,212,.12);color:#06b6d4"><i data-lucide="play-circle"></i></div>
      <div><div class="s-value">${all.filter(t=>t.status==='progress').length}</div><div class="s-label">진행 중</div><div class="s-change" style="color:#4f6ef7">현재 수행 업무</div></div>
    </div>
    <div class="stat-card">
      <div class="stat-icon" style="background:rgba(239,68,68,.12);color:#ef4444"><i data-lucide="alert-triangle"></i></div>
      <div><div class="s-value">${delayed}</div><div class="s-label">지연 업무</div><div class="s-change" style="color:${delayed>0?'#ef4444':'#22c55e'}">${delayed>0?'즉시 조치 필요':'정상 범위'}</div></div>
    </div>
    <div class="stat-card">
      <div class="stat-icon" style="background:rgba(245,158,11,.12);color:#f59e0b"><i data-lucide="zap"></i></div>
      <div><div class="s-value">${today}</div><div class="s-label">D-Day 업무</div><div class="s-change" style="color:${today>0?'#f59e0b':'#22c55e'}">${today>0?'오늘 마감!':'없음'}</div></div>
    </div>
    <div class="stat-card">
      <div class="stat-icon" style="background:rgba(34,197,94,.12);color:#22c55e"><i data-lucide="check-circle-2"></i></div>
      <div><div class="s-value">${done}</div><div class="s-label">완료 업무</div><div class="s-change" style="color:#22c55e">이번달 누적</div></div>
    </div>`;
  refreshIcons();
}

function renderDashGrid() {
  const el = document.getElementById('dashGrid');
  if(!el) return;
  window._dashAccordion = window._dashAccordion || 'byMe'; // 湲곕낯 열린?덈뒗 탭

  el.innerHTML = `
    ${buildGantt()}
    <div class="dash-main-grid">
      <!-- 醫뚯륫: 梨꾪똿李?-->
      <div class="dash-chat-area">
        ${buildChatWidget()}
      </div>
      <!-- ?곗륫: ?꾩퐫?붿뼵 3탭 -->
      <div class="dash-left-col" id="dashAccordionCol">
        ${buildAccordionCard('byMe',  '#4f6ef7', 'send',         '내가 지시한 업무',     getByMeCount(),   buildAssignedByMeBody())}
        ${buildAccordionCard('toMe',  '#9747ff', 'download',     '나에게 배정된 업무',   getToMeCount(),   buildAssignedToMeBody())}
        ${buildAccordionCard('today', '#ef4444', 'alert-circle', '오늘 완료해야 할 업무', getTodayCount(), buildTodayTasksBody())}
      </div>
    </div>
  `;

  // 梨꾪똿李?다크濡??섎떒
  const chatBody = document.getElementById('chatBody');
  if(chatBody) chatBody.scrollTop = chatBody.scrollHeight;
  // ?꾩퐫?붿뼵 ?믪씠 초기화  syncAccordionHeight();
  refreshIcons();
}

function getByMeCount()  { return WS.getAssignedByMe().length; }
function getToMeCount()  { return WS.getAssignedToMe().length; }
function getTodayCount() { return WS.getTodayTasks().length; }

function buildAccordionCard(key, color, icon, title, count, bodyHTML) {
  const isOpen = window._dashAccordion === key;
  const countBadge = key === 'today' && count > 0
    ? `<span class="section-count" style="background:rgba(239,68,68,.12);color:#ef4444">${count}건</span>`
    : `<span class="section-count">${count}건</span>`;

  return `
    <div class="acc-card ${isOpen ? 'open' : ''}" id="accCard_${key}">
      <div class="acc-head" onclick="toggleDashAccordion('${key}')">
        <div class="section-title-group">
          <div class="section-dot" style="background:${color}"><i data-lucide="${icon}"></i></div>
          <div class="section-title">${title}</div>
          ${countBadge}
        </div>
        <span class="acc-chevron"><i data-lucide="${isOpen ? 'chevron-up' : 'chevron-down'}"></i></span>
      </div>
      <div class="acc-body" id="accBody_${key}">
        ${bodyHTML}
      </div>
    </div>
  `;
}

function toggleDashAccordion(key) {
  // ?대? ?대┛ 탭瑜??대┃되면 臾댁떆 ????긽 1媛쒕뒗 열린 없음
  if (window._dashAccordion === key) return;
  window._dashAccordion = key;
  // DOM 吏곸젒 업데이트 (전체 ?щ젋??없이)
  document.querySelectorAll('.acc-card').forEach(card => {
    const k = card.id.replace('accCard_','');
    const isOpen = k === key;
    card.classList.toggle('open', isOpen);
    const chev = card.querySelector('.acc-chevron');
    if(chev) chev.innerHTML = `<i data-lucide="${isOpen?'chevron-up':'chevron-down'}"></i>`;
  });
  refreshIcons();
}

function syncAccordionHeight() {
  /* flex ?덉씠?꾩썐?쇰줈 ?泥?- no-op */
}



/* ?? ?뱀뀡1: 내가 吏?쒗븳 업무 ?? */
function buildAssignedByMe() {
  const tasks = WS.getAssignedByMe();
  const rows = tasks.map(t => {
    const ids = Array.isArray(t.assigneeIds) ? t.assigneeIds : (t.assigneeId ? [t.assigneeId] : []);
    const assignee = WS.getUser(ids[0]);
    const dd = WS.getDdayBadge(t.dueDate);
    const fillCls = t.status==='delay'?'delay':t.status==='done'?'done':'';
    return `<tr onclick="openTaskDetail(${t.id})" style="cursor:pointer">
      <td>
        <div style="display:flex;align-items:center;gap:6px">
          ${t.isImportant?'<span class="star-icon"><i data-lucide="star"></i></span>':''}
          <span style="font-weight:600;font-size:12.5px">${t.title}</span>
        </div>
        <div style="font-size:11px;color:var(--text-muted);margin-top:2px">${t.team}</div>
      </td>
      <td>
        <div class="avatar-group">
          <div class="avatar" style="background:linear-gradient(135deg,${assignee?.color||'#4f6ef7'},#9747ff)" title="${assignee?.name}">${assignee?.avatar||'?'}</div>
        </div>
        <div style="font-size:11px;color:var(--text-muted);margin-top:2px">${assignee?.name}</div>
      </td>
      <td><span class="status-badge status-${t.status}">${WS.getStatusLabel(t.status)}</span></td>
      <td>
        <div class="progress-wrap">
          <div class="progress-bar"><div class="progress-fill ${fillCls}" style="width:${t.progress}%"></div></div>
          <span class="progress-label">${t.progress}%</span>
        </div>
      </td>
      <td><span class="dday-badge ${dd.cls}">${dd.label}</span></td>
      <td>
        <div class="quick-actions">
          <button class="qa-btn" onclick="event.stopPropagation();changeStatus(${t.id},'progress')">진행</button>
          <button class="qa-btn done" onclick="event.stopPropagation();changeStatus(${t.id},'done')">완료</button>
        </div>
      </td>
    </tr>`;
  }).join('');

  return `<div class="section-card">
    <div class="section-head">
      <div class="section-title-group">
        <div class="section-dot" style="background:#4f6ef7"><i data-lucide="send"></i></div>
        <div class="section-title">내가 지시한 업무</div>
        <span class="section-count">${tasks.length}건</span>
      </div>
      <div class="section-actions">
      <button class="btn-sm btn-primary" onclick="openNewTaskModal()">+ 등록</button>
      </div>
    </div>
    <div class="section-body">
      ${tasks.length===0?'<div class="empty-state"><div class="es-icon"><i data-lucide="inbox"></i></div><div class="es-text">吏?쒗븳 업무媛 없습니다</div></div>':
      `<table class="task-table">
        <thead><tr>
          <th>업무명</th><th>담당자</th><th>상태</th><th>진행률</th><th>마감일</th><th>액션</th>
        </tr></thead>
        <tbody>${rows}</tbody>
      </table>`}
    </div>
  </div>`;
}

/* ?꾩퐫?붿뼵??Body ?꾩슜 踰꾩쟾 */
function buildAssignedByMeBody() {
  const tasks = WS.getAssignedByMe();
  if(tasks.length===0) return '<div class="empty-state"><div class="es-icon"><i data-lucide="inbox"></i></div><div class="es-text">吏?쒗븳 업무媛 없습니다</div></div>';
  const rows = tasks.map(t => {
    const _ids2 = Array.isArray(t.assigneeIds) ? t.assigneeIds : (t.assigneeId ? [t.assigneeId] : []);
    const assignee = WS.getUser(_ids2[0]);
    const dd = WS.getDdayBadge(t.dueDate);
    const fillCls = t.status==='delay'?'delay':t.status==='done'?'done':'';
    return `<tr onclick="openTaskDetail(${t.id})" style="cursor:pointer">
      <td><div style="display:flex;align-items:center;gap:6px">${t.isImportant?'<span class="star-icon"><i data-lucide="star"></i></span>':''}<span style="font-weight:600;font-size:12.5px">${t.title}</span></div><div style="font-size:11px;color:var(--text-muted);margin-top:2px">${t.team}</div></td>
      <td><div class="avatar-group"><div class="avatar" style="background:linear-gradient(135deg,${assignee?.color||'#4f6ef7'},#9747ff)">${assignee?.avatar||'?'}</div></div><div style="font-size:11px;color:var(--text-muted);margin-top:2px">${assignee?.name}</div></td>
      <td><span class="status-badge status-${t.status}">${WS.getStatusLabel(t.status)}</span></td>
      <td><div class="progress-wrap"><div class="progress-bar"><div class="progress-fill ${fillCls}" style="width:${t.progress}%"></div></div><span class="progress-label">${t.progress}%</span></div></td>
      <td><span class="dday-badge ${dd.cls}">${dd.label}</span></td>
      <td><div class="quick-actions"><button class="qa-btn" onclick="event.stopPropagation();changeStatus(${t.id},'progress')">진행</button><button class="qa-btn done" onclick="event.stopPropagation();changeStatus(${t.id},'done')">완료</button></div></td>
    </tr>`;
  }).join('');
  return `<div style="padding:8px"><table class="task-table"><thead><tr><th>업무명</th><th>담당자</th><th>상태</th><th>진행률</th><th>마감일</th><th>액션</th></tr></thead><tbody>${rows}</tbody></table></div>`;
}


/* ?? ?뱀뀡2: 내가 吏?쒕컺? 업무 ?? */
function buildAssignedToMe() {
  const tasks = WS.getAssignedToMe().sort((a,b)=>{
    const po={high:0,medium:1,low:2};
    return po[a.priority]-po[b.priority];
  });
  const cards = tasks.map(t => {
    const assigner = WS.getUser(t.assignerId);
    const dd = WS.getDdayBadge(t.dueDate);
    const isToday = WS.getDday(t.dueDate) <= 0;
    const fillCls = t.status==='delay'?'delay':t.status==='done'?'done':'';
    return `<div class="task-card ${isToday&&t.status!=='done'?'urgent':t.isImportant?'important':''}" onclick="openTaskDetail(${t.id})">
      <div class="task-card-top">
        <div class="task-card-title">
          ${t.isImportant?'<span class="star-icon"><i data-lucide="star"></i></span>':''}${t.title}
        </div>
        <span class="dday-badge ${dd.cls}">${dd.label}</span>
      </div>
      <div class="task-card-meta">
        <span class="priority-badge priority-${t.priority}">${WS.getPriorityLabel(t.priority)}</span>
        <span class="status-badge status-${t.status}">${WS.getStatusLabel(t.status)}</span>
        <span style="font-size:11px;color:var(--text-muted)">from ${assigner?.name}</span>
      </div>
      <div style="margin-top:8px">
        <div class="progress-wrap">
          <div class="progress-bar"><div class="progress-fill ${fillCls}" style="width:${t.progress}%"></div></div>
          <span class="progress-label">${t.progress}%</span>
        </div>
      </div>
      <div class="quick-actions" style="margin-top:7px" onclick="event.stopPropagation()">
        <button class="qa-btn" onclick="changeStatus(${t.id},'progress')">진행중</button>
        <button class="qa-btn done" onclick="changeStatus(${t.id},'done')">완료</button>
        <button class="qa-btn delay" onclick="changeStatus(${t.id},'delay')">지연</button>
        <button class="qa-btn" onclick="openTaskDetail(${t.id})">상세</button>
      </div>
    </div>`;
  }).join('');

  return `<div class="section-card">
    <div class="section-head">
      <div class="section-title-group">
        <div class="section-dot" style="background:#9747ff"><i data-lucide="download"></i></div>
        <div class="section-title">나에게 배정된 업무</div>
        <span class="section-count">${tasks.length}건</span>
      </div>
      <div class="section-actions">
        <span style="font-size:11px;color:var(--text-muted)">우선순위 정렬</span>
      </div>
    </div>
    ${tasks.length===0?'<div class="empty-state"><div class="es-icon"><i data-lucide="sparkles"></i></div><div class="es-text">吏?쒕컺? 업무媛 없습니다</div></div>':
    `<div class="section-body">${cards}</div>`}
  </div>`;
}

/* ?? ?뱀뀡3: 오늘 완료해야 ??업무 ?? */
function buildTodayTasks() {
  const tasks = WS.getTodayTasks();
  const all_today = WS.tasks.filter(t=>{const d=WS.getDday(t.dueDate);return d<=0&&t.status!=='done';});

  const banner = all_today.length>0 ? `
    <div class="urgent-banner">
      <span style="font-size:20px"><i data-lucide="alert-circle" class="icon-lg" style="color:#ef4444"></i></span>
      <div>
        <div class="ub-text">오늘 留덇컧 업무 ${all_today.length}건/div>
        <div class="ub-sub">利됱떆 완료 泥섎━?섍굅??상태를업데이트하세요/div>
      </div>
    </div>` : '';

  const cards = tasks.map(t => {
    const assigner = WS.getUser(t.assignerId);
    const dday = WS.getDday(t.dueDate);
    const fillCls = t.status==='delay'?'delay':'';
    return `<div class="task-card urgent" onclick="openTaskDetail(${t.id})">
      <div class="task-card-top">
        <div class="task-card-title"><i data-lucide="alert-circle" class="icon-sm" style="color:#ef4444;margin-right:4px"></i>${t.title}</div>
        <span class="dday-badge dday-today">${dday===0?'D-DAY':`D+${Math.abs(dday)}초과`}</span>
      </div>
      <div class="task-card-meta">
        <span class="priority-badge priority-high">긴급</span>
        <span class="status-badge status-${t.status}">${WS.getStatusLabel(t.status)}</span>
        <span style="font-size:11px;color:var(--text-muted)">from ${assigner?.name}</span>
      </div>
      <div style="margin-top:8px">
        <div class="progress-wrap">
          <div class="progress-bar"><div class="progress-fill ${fillCls}" style="width:${t.progress}%"></div></div>
          <span class="progress-label">${t.progress}%</span>
        </div>
      </div>
      <div class="quick-actions" style="margin-top:7px" onclick="event.stopPropagation()">
        <button class="qa-btn done" onclick="changeStatus(${t.id},'done')"><i data-lucide="check-circle-2" class="icon-sm"></i> 완료처리</button>
        <button class="qa-btn delay" onclick="changeStatus(${t.id},'delay')"><i data-lucide="alert-triangle" class="icon-sm"></i> 지연처리</button>
      </div>
    </div>`;
  }).join('');

  return `<div class="section-card" style="height:100%">
    <div class="section-head">
      <div class="section-title-group">
        <div class="section-dot" style="background:#ef4444"><i data-lucide="alert-circle"></i></div>
        <div class="section-title">오늘 완료해야 할 업무</div>
        ${tasks.length>0?`<span class="section-count" style="background:rgba(239,68,68,.12);color:#ef4444">${tasks.length}건</span>>`:'<span class="section-count">?놁쓬</span>'}
      </div>
    </div>
    ${banner}
    ${tasks.length===0?'<div class="empty-state"><div class="es-icon"><i data-lucide="party-popper"></i></div><div class="es-text">오늘 留덇컧 업무媛 없습니다!</div></div>':
    `<div class="section-body">${cards}</div>`}
  </div>`;
}

/* ?꾩퐫?붿뼵??Body ?꾩슜 - 吏?쒕컺? 업무 */
function buildAssignedToMeBody() {
  const tasks = WS.getAssignedToMe().sort((a,b)=>{const po={high:0,medium:1,low:2};return po[a.priority]-po[b.priority];});
  if(tasks.length===0) return '<div class="empty-state"><div class="es-icon"><i data-lucide="sparkles"></i></div><div class="es-text">吏?쒕컺? 업무媛 없습니다</div></div>';
  const cards = tasks.map(t => {
    const assigner = WS.getUser(t.assignerId);
    const dd = WS.getDdayBadge(t.dueDate);
    const fillCls = t.status==='delay'?'delay':t.status==='done'?'done':'';
    return `<div class="task-card ${WS.getDday(t.dueDate)<=0&&t.status!=='done'?'urgent':t.isImportant?'important':''}" onclick="openTaskDetail(${t.id})">
      <div class="task-card-top"><div class="task-card-title">${t.isImportant?'<span class="star-icon"><i data-lucide="star"></i></span>':''}${t.title}</div><span class="dday-badge ${dd.cls}">${dd.label}</span></div>
      <div class="task-card-meta"><span class="priority-badge priority-${t.priority}">${WS.getPriorityLabel(t.priority)}</span><span class="status-badge status-${t.status}">${WS.getStatusLabel(t.status)}</span><span style="font-size:11px;color:var(--text-muted)">from ${assigner?.name}</span></div>
      <div style="margin-top:8px"><div class="progress-wrap"><div class="progress-bar"><div class="progress-fill ${fillCls}" style="width:${t.progress}%"></div></div><span class="progress-label">${t.progress}%</span></div></div>
      <div class="quick-actions" style="margin-top:7px" onclick="event.stopPropagation()">
        <button class="qa-btn" onclick="changeStatus(${t.id},'progress')">진행중</button>
        <button class="qa-btn done" onclick="changeStatus(${t.id},'done')">완료</button>
        <button class="qa-btn delay" onclick="changeStatus(${t.id},'delay')">지연</button>
        <button class="qa-btn" onclick="openTaskDetail(${t.id})">상세</button>
      </div>
    </div>`;
  }).join('');
  return `<div class="section-body" style="padding:8px;display:grid;grid-template-columns:1fr 1fr;gap:12px">${cards}</div>`;
}

/* ?꾩퐫?붿뼵??Body ?꾩슜 - 오늘 완료 업무 */
function buildTodayTasksBody() {
  const tasks = WS.getTodayTasks();
  if(tasks.length===0) return '<div class="empty-state"><div class="es-icon"><i data-lucide="party-popper"></i></div><div class="es-text">오늘 留덇컧 업무媛 없습니다!</div></div>';
  const cards = tasks.map(t => {
    const assigner = WS.getUser(t.assignerId);
    const dday = WS.getDday(t.dueDate);
    const fillCls = t.status==='delay'?'delay':'';
    return `<div class="task-card urgent" onclick="openTaskDetail(${t.id})">
      <div class="task-card-top"><div class="task-card-title"><i data-lucide="alert-circle" class="icon-sm" style="color:#ef4444;margin-right:4px"></i>${t.title}</div><span class="dday-badge dday-today">${dday===0?'D-DAY':`D+${Math.abs(dday)}초과`}</span></div>
      <div class="task-card-meta"><span class="priority-badge priority-high">긴급</span><span class="status-badge status-${t.status}">${WS.getStatusLabel(t.status)}</span><span style="font-size:11px;color:var(--text-muted)">from ${assigner?.name}</span></div>
      <div style="margin-top:8px"><div class="progress-wrap"><div class="progress-bar"><div class="progress-fill ${fillCls}" style="width:${t.progress}%"></div></div><span class="progress-label">${t.progress}%</span></div></div>
      <div class="quick-actions" style="margin-top:7px" onclick="event.stopPropagation()">
        <button class="qa-btn done" onclick="changeStatus(${t.id},'done')"><i data-lucide="check-circle-2" class="icon-sm"></i> 완료처리</button>
        <button class="qa-btn delay" onclick="changeStatus(${t.id},'delay')"><i data-lucide="alert-triangle" class="icon-sm"></i> 지연처리</button>
      </div>
    </div>`;
  }).join('');
  return `<div class="section-body" style="padding:8px">${cards}</div>`;
}


/* ?? ?뱀뀡4: ?ㅼ떆媛????위젯 ?? */
function buildChatWidget() {
  const msgs = WS.messages;
  const list = msgs.map(m => {
    const isMe = m.senderId === WS.currentUser.id;
    const sender = WS.getUser(m.senderId);
    return `
      <div class="chat-msg ${isMe?'me':''}">
        ${!isMe ? `<div class="avatar" style="background:linear-gradient(135deg,${sender?.color},#9747ff)">${sender?.avatar}</div>` : ''}
        <div style="display:flex; flex-direction:column; ${isMe?'align-items:flex-end':''}">
          ${!isMe ? `<div class="chat-name">${sender?.name}</div>` : ''}
          <div style="display:flex; gap:6px; ${isMe?'flex-direction:row-reverse':''}">
            <div class="chat-bubble">${m.text}</div>
            <div class="chat-time">${m.time}</div>
          </div>
        </div>
      </div>
    `;
  }).join('');

  return `
    <div class="chat-widget">
      <div class="chat-header">
        <div class="section-dot" style="background:var(--accent-blue)"><i data-lucide="message-square"></i></div>
        <h3>실시간 메시지 채널</h3>
        <div style="margin-left:auto; display:flex; align-items:center; gap:4px">
          <span class="status-indicator online"></span>
        <span style="font-size:11px; font-weight:700; color:var(--text-muted)">동료</span>
        </div>
      </div>
      <div class="chat-body" id="chatBody">
        ${list}
      </div>
      <div class="chat-input-area">
        <input type="text" class="chat-input" id="chatInput" placeholder="메시지를 입력하세요..." onkeypress="if(event.key==='Enter') sendMessage()">
        <button class="send-btn" onclick="sendMessage()"><i data-lucide="send" class="icon-sm"></i></button>
      </div>
    </div>
  `;
}

function sendMessage() {
  const input = document.getElementById('chatInput');
  const text = input.value.trim();
  if(!text) return;
  
  WS.addMessage(text);
  input.value = '';
  
  // 利됱떆 ?뚮뜑留?(??쒕낫??전체瑜?洹몃━湲곕낫??梨꾪똿 ?곸뿭留?업데이트되면 醫뗭?留??⑥닚???꾪빐 전체 由щ젋??
  renderDashboard();
}

/* ?? ?뱀뀡5: 媛꾪듃李⑦듃 (留덇컧??기준) ?? */
function buildGantt() {
  const tasks = WS.getSortedByDue().slice(0,6);
  const today = new Date();
  const startDate = new Date(today); startDate.setDate(startDate.getDate()-3);
  const days = 14;

  const dayHeaders = Array.from({length:days}, (_,i) => {
    const d = new Date(startDate); d.setDate(d.getDate()+i);
    const isToday = d.toDateString()===today.toDateString();
    return `<div class="gantt-day ${isToday?'today':''}">${d.getMonth()+1}/${d.getDate()}</div>`;
  }).join('');

  const todayOffset = ((today - startDate)/(1000*60*60*24)) / days * 100;

  const rows = tasks.map(t => {
    const _gIds = Array.isArray(t.assigneeIds) ? t.assigneeIds : (t.assigneeId ? [t.assigneeId] : []);
    const assignee = WS.getUser(_gIds[0]);

    const due = new Date(t.dueDate);
    const started = t.startedAt ? new Date(t.startedAt) : new Date(t.createdAt);

    const barStart = Math.max(0, ((started - startDate)/(1000*60*60*24)) / days * 100);
    const barEnd = Math.min(100, ((due - startDate)/(1000*60*60*24+1)) / days * 100);
    const barWidth = Math.max(3, barEnd - barStart);
    const barCls = t.status==='delay'?'red':t.status==='done'?'green':WS.getDday(t.dueDate)<=2?'orange':'blue';
    const dd = WS.getDdayBadge(t.dueDate);
    return `<div class="gantt-row" onclick="openTaskDetail(${t.id})" style="cursor:pointer">
      <div class="gantt-task-info">
        <div class="gantt-task-name" title="${t.title}">${t.isImportant?'<span class="star-icon"><i data-lucide="star"></i></span>':''} ${t.title}</div>
        <div class="gantt-task-assignee">${assignee?.name} · <span class="dday-badge ${dd.cls}" style="font-size:9.5px;padding:1px 5px">${dd.label}</span></div>
      </div>
      <div class="gantt-bar-area">
        <div class="gantt-today-line" style="left:${todayOffset}%"></div>
        <div class="gantt-bar ${barCls}" style="left:${barStart}%;width:${barWidth}%" title="${t.title} (${WS.formatDate(t.startedAt||t.createdAt)} ~ ${WS.formatDate(t.dueDate)})">
          ${barWidth>8?t.progress+'%':''}
        </div>
      </div>
    </div>`;
  }).join('');

  return `<div class="section-card full-width">
    <div class="section-head">
      <div class="section-title-group">
        <div class="section-dot" style="background:#f59e0b"><i data-lucide="calendar"></i></div>
        <div class="section-title">마감일 기준 진행 업무 · 간트차트</div>
        <span class="section-count">${tasks.length}건</span>>
      </div>
      <div class="section-actions">
        <span style="font-size:11px;color:var(--text-muted)">마감일 기준 정렬</span>
      </div>
    </div>
    <div class="gantt-wrap">
      <div class="gantt-header">
        <div class="gantt-task-col">업무</div>
        <div class="gantt-timeline-head">${dayHeaders}</div>
      </div>
      ${tasks.length===0?'<div class="empty-state"><div class="es-icon">?럦</div><div class="es-text">吏꾪뻾 以묒씤 업무媛 없습니다</div></div>':rows}
    </div>
  </div>`;
}

/* ?? 상태 蹂寃??? */
function changeStatus(taskId, newStatus) {
  WS.changeTaskStatus(taskId, newStatus);
  renderDashboard();
  renderPage_Tasks();
  showToast('success', `업무 상태媛 "${WS.getStatusLabel(newStatus)}"?쇰줈 蹂寃쎈릺됩니다.`);
}

/* ?? 업무 상세 紐⑤떖 ?? */
function openTaskDetail(taskId) {
  const t = WS.getTask(taskId);
  if (!t) return;
  const ids = Array.isArray(t.assigneeIds) ? t.assigneeIds : (t.assigneeId ? [t.assigneeId] : []);
  const assigneeNames = ids.map(i => WS.getUser(i)?.name).filter(Boolean).join(', ') || '-';
  const assigner = WS.getUser(t.assignerId);
  const dd = WS.getDdayBadge(t.dueDate);
  const fillCls = t.status==='delay'?'delay':t.status==='done'?'done':'';
  const progress = t.progress || 0;

  document.getElementById('tdModalTitle').textContent = t.title;
  document.getElementById('tdModalBody').innerHTML = `
    <!-- ??상태 탭 -->
    <div style="background:var(--bg-tertiary);border:1px solid var(--border-color);border-radius:14px;padding:16px;margin-bottom:18px">
      <div style="display:flex;align-items:flex-start;justify-content:space-between;flex-wrap:wrap;gap:10px;margin-bottom:14px">
        <div>
          <div style="font-size:10px;font-weight:700;color:var(--text-muted);text-transform:uppercase;margin-bottom:4px">업무紐?/div>
          <div style="font-size:15px;font-weight:800;color:var(--text-primary)">${t.isImportant?'??':''}${t.title}</div>
        </div>
        <div style="display:flex;gap:6px;flex-wrap:wrap;align-items:center">
          <span class="status-badge status-${t.status}">${WS.getStatusLabel(t.status)}</span>
          <span class="priority-badge priority-${t.priority}">${WS.getPriorityLabel(t.priority)}</span>
          <span class="dday-badge ${dd.cls}">${dd.label}</span>
        </div>
      </div>
      <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px">
        <div style="background:var(--bg-secondary);border-radius:10px;padding:10px 12px">
          <div style="font-size:10px;color:var(--text-muted);font-weight:600;margin-bottom:4px">?쒖옉??/div>
          <div style="font-size:13px;font-weight:700;color:var(--text-primary)">${t.startDate||'-'}</div>
        </div>
        <div style="background:var(--bg-secondary);border-radius:10px;padding:10px 12px">
          <div style="font-size:10px;color:var(--text-muted);font-weight:600;margin-bottom:4px">醫낅즺??/div>
          <div style="font-size:13px;font-weight:700;color:var(--text-primary)">${t.dueDate||'-'}</div>
        </div>
        <div style="background:var(--bg-secondary);border-radius:10px;padding:10px 12px">
          <div style="font-size:10px;color:var(--text-muted);font-weight:600;margin-bottom:4px">吏꾪뻾瑜?/div>
          <div style="display:flex;align-items:center;gap:6px;margin-top:4px">
            <div class="progress-bar" style="flex:1;height:5px">
              <div class="progress-fill ${fillCls}" style="width:${progress}%"></div>
            </div>
            <span style="font-size:12px;font-weight:800;color:var(--accent-blue)">${progress}%</span>
          </div>
        </div>
        <div style="background:var(--bg-secondary);border-radius:10px;padding:10px 12px">
          <div style="font-size:10px;color:var(--text-muted);font-weight:600;margin-bottom:4px">보고?댁슜</div>
          <div style="font-size:12px;font-weight:700;color:var(--text-primary)">${t.reportContent||'-'}</div>
        </div>
      </div>
    </div>

    <!-- ??吏꾪뻾??설정 -->
    <div style="margin-bottom:16px">
      <div style="font-size:11px;font-weight:700;color:var(--text-muted);text-transform:uppercase;margin-bottom:10px;display:flex;align-items:center;gap:6px">
        <i data-lucide="sliders-horizontal" style="width:13px;height:13px"></i> 吏꾪뻾??설정
      </div>
      <div style="display:flex;align-items:center;gap:12px">
        <input type="range" min="0" max="100" value="${progress}" id="progressSlider_${t.id}"
          style="flex:1;accent-color:var(--accent-blue)"
          oninput="document.getElementById('progVal_${t.id}').textContent=this.value+'%'; document.getElementById('progBar_live_${t.id}').style.width=this.value+'%'">
        <span id="progVal_${t.id}" style="font-size:15px;font-weight:800;color:var(--accent-blue);min-width:40px;text-align:right">${progress}%</span>
      </div>
      <div class="progress-bar" style="margin-top:8px;height:8px;border-radius:6px">
        <div class="progress-fill ${fillCls}" id="progBar_live_${t.id}" style="width:${progress}%;border-radius:6px"></div>
      </div>
    </div>

    <!-- ??설명 -->
    <div class="form-group" style="margin-bottom:0">
      <label class="form-label" style="display:flex;align-items:center;gap:6px">
        <i data-lucide="pencil-line" style="width:13px;height:13px"></i> 설명
      </label>
      <textarea class="form-input" id="td_desc" rows="3" style="resize:vertical">${t.desc||''}</textarea>
    </div>

    <!-- hidden 변경 -->
    <input type="hidden" id="td_report" value="${t.reportContent||''}">
    <input type="hidden" id="td_score"  value="${t.score||0}">
    <input type="hidden" id="td_title"  value="${t.title}">

    <!-- ??업무 히스토리 (?좉?) -->
    <div style="margin-top:18px;border-top:1px solid var(--border-color);padding-top:14px">
      <button class="btn" style="width:100%;justify-content:space-between;background:var(--bg-tertiary);border:none;font-size:12px;font-weight:700;height:36px"
        onclick="this.nextElementSibling.style.display=this.nextElementSibling.style.display==='none'?'block':'none';this.querySelector('.chev').textContent=this.nextElementSibling.style.display==='none'?'??:'??">
        <span style="display:flex;align-items:center;gap:6px">
          <i data-lucide="history" style="width:14px;height:14px"></i> 업무 히스토리
          <span style="font-size:10px;background:var(--bg-card);border-radius:8px;padding:1px 7px;color:var(--text-muted)">${(t.history||[]).length}건</span>>
        </span>
        <span class="chev">??/span>
      </button>
      <div style="display:none;margin-top:8px">
        <div class="history-timeline">
          ${[...(t.history||[])].reverse().map(h=>`
            <div class="timeline-item">
              <div class="timeline-dot" style="background:${h.color}22;border-color:${h.color}"><i data-lucide="${h.icon}"></i></div>
              <div class="timeline-content">
                <div class="t-date">${h.date}</div>
                <div class="t-text">${h.event}</div>
                <div class="t-sub">${h.detail}</div>
              </div>
            </div>`).join('')}
          ${(t.history||[]).length===0?'<div style="text-align:center;padding:16px;color:var(--text-muted);font-size:12px">?덉뒪?좊━媛 없습니다</div>':''}
        </div>
      </div>
    </div>
  `;

  window._editingTaskId = taskId;
  openModal('taskDetailModal');
  refreshIcons();
}

function changeStatusFromModal(taskId, status) {
  changeStatus(taskId, status);
  openTaskDetail(taskId);
}

function saveTaskDetail() {
  const id = window._editingTaskId;
  if (!id) return;
  const t = WS.getTask(id);
  const slider = document.getElementById(`progressSlider_${id}`);
  const descEl = document.getElementById('td_desc');
  if (slider) t.progress = parseInt(slider.value);
  if (descEl) t.desc = descEl.value;

  // ?덉뒪?좊━ 湲곕줉
  const now = new Date();
  const dateStr = `${now.getFullYear()}.${String(now.getMonth()+1).padStart(2,'0')}.${String(now.getDate()).padStart(2,'0')}`;
  if (!t.history) t.history = [];
  t.history.push({
    date: dateStr, event: '吏꾪뻾??업데이트',
    detail: `吏꾪뻾瑜?${t.progress}% · ${t.desc ? '설명 수정' : ''}`,
    icon: 'refresh-cw', color: '#4f6ef7'
  });

  WS.saveTasks();
  renderDashboard();
  renderPage_Tasks();
  closeModalDirect('taskDetailModal');
  showToast('success', '<i data-lucide="check-circle-2"></i> 저장되었습니다.');
  refreshIcons();
}

/* ── 새 업무 모달 ── */
function openNewTaskModal(mode = null, parentId = null, assigneeId = null) {
  // simple 모드 판별 (업무목록 "+새 업무" 버튼)
  const isSimple = (mode === 'simple');
  if (!isSimple && mode !== null && typeof mode !== 'string') {
    // 기존 호출: openNewTaskModal(parentId, assigneeId) 호환
    parentId = mode;
    mode = null;
  }
  window._newParentId = parentId;
  // 과정등록 태그 초기화
  window._processTags = [];
  const tagWrap = document.getElementById('nt_process_tags');
  if(tagWrap) tagWrap.innerHTML = '';
  const tagInput = document.getElementById('nt_process_input');
  if(tagInput) tagInput.value = '';
  // ? 초기화 업데이트
  const teamSel = document.getElementById('nt_team');
  if(teamSel) teamSel.innerHTML = WS.departments.map(d=>`<option>${d.name}</option>`).join('');
  // ?좎쭨 초기화(而ㅼ뒪? ?쎌빱 諛⑹떇)
  const today = new Date().toISOString().split('T')[0];
  const todayLabel = (() => { const d = new Date(); return `${d.getFullYear()}년 ${d.getMonth()+1}월 ${d.getDate()}일`; })();
  const startEl = document.getElementById('nt_start');
  const dueEl   = document.getElementById('nt_due');
  const startLbl = document.getElementById('nt_start_label');
  const dueLbl   = document.getElementById('nt_due_label');
  if (startEl)  startEl.value = today;
  if (dueEl)    dueEl.value   = today;
  if (startLbl) startLbl.textContent = todayLabel;
  if (dueLbl)   dueLbl.textContent   = todayLabel;
  const scoreEl = document.getElementById('nt_score');
  if(scoreEl) scoreEl.value = '';
  const resultEl = document.getElementById('nt_result');
  if (resultEl) {
    const resultOpts = (WS.taskResults || []).map(r =>
      `<option value="${r.name}">${r.icon ? r.icon + ' ' : ''}${r.name}</option>`
    ).join('');
    resultEl.innerHTML = `<option value="">-- ?좏깮 --</option>${resultOpts}`;
    resultEl.value = '';
  }

  // simple 紐⑤뱶: ??댄?·?꾨뱶 蹂寃?  const modalTitle = document.querySelector('#newTaskModal .modal-title');
  const submitBtn  = document.querySelector('#newTaskModal .modal-foot .btn-blue');
  const rowPT   = document.getElementById('nt_row_priority_team');
  const rowDate = document.getElementById('nt_row_dates');
  const rowImp  = document.getElementById('nt_row_important');
  if (isSimple) {
    if(modalTitle) modalTitle.textContent = '업무추가';
    if(submitBtn)  { submitBtn.textContent = '추가'; submitBtn.onclick = createNewTask; }
    if(rowPT)   rowPT.style.display   = 'none';
    if(rowDate) rowDate.style.display  = 'none';
    if(rowImp)  rowImp.style.display   = 'none';
  } else if (mode === 'schedule') {
    if(modalTitle) modalTitle.textContent = '???ㅼ?伊?추가';
    if(submitBtn)  { submitBtn.textContent = '?ㅼ?伊댁텛媛'; submitBtn.onclick = createNewTask; }
    if(rowPT)   rowPT.style.display   = 'none';
    if(rowDate) rowDate.style.display  = '';
    if(rowImp)  rowImp.style.display   = 'none';
  } else if (mode === 'edit') {
    if(modalTitle) modalTitle.textContent = '업무 수정';
    if(submitBtn)  { submitBtn.textContent = '저장하기'; submitBtn.onclick = saveEditTask; }
    if(rowPT)   rowPT.style.display   = 'none';
    if(rowDate) rowDate.style.display  = 'none';
    if(rowImp)  rowImp.style.display   = 'none';
  } else {
    if(modalTitle) modalTitle.textContent = '새 업무 등록';
    if(submitBtn)  { submitBtn.textContent = '업무 등록'; submitBtn.onclick = createNewTask; }
    if(rowPT)   rowPT.style.display   = '';
    if(rowDate) rowDate.style.display  = '';
    if(rowImp)  rowImp.style.display   = '';
  }

  if(parentId) {
    const p = WS.getTask(parentId);
    if(p) showToast('info', `[${p.title}] 하위 업무를 추가했습니다.`);
  }
  openModal('newTaskModal');
}

function createNewTask() {
  const titleInput = document.getElementById('nt_title');
  const title = titleInput.value.trim();
  const due = document.getElementById('nt_due').value;

  if(!title || !due){
    showToast('error', '?쒕ぉ怨?留덇컧?쇱쓣 입력하세요');
    return;
  }

  const nt = {
    id: Date.now(),
    title: title,
    desc: document.getElementById('nt_desc').value,
    assignerId: WS.currentUser?.id || 1,
    assigneeIds: [],
    status: 'waiting',
    priority: document.getElementById('nt_priority')?.value || 'medium',
    progress: 0,
    dueDate: due,
    createdAt: new Date().toISOString().split('T')[0],
    startedAt: document.getElementById('nt_start')?.value || null,
    isImportant: document.getElementById('nt_important')?.checked || false,
    team: document.getElementById('nt_team')?.value || '',
    score: parseInt(document.getElementById('nt_score').value) || 0,
    reportContent: document.getElementById('nt_result').value || '',  // 업무결과
    processTags: window._processTags || [],                           // 怨쇱젙?깅줉
    spentTime: '0h',
    parentId: window._newParentId || null,
    history: [
      { 
        date: new Date().toISOString().split('T')[0], 
        event: '업무 등록',
        detail: `${WS.currentUser?.name}`,
        icon: 'clipboard-list', 
        color: '#4f6ef7' 
      }
    ]
  };

  WS.tasks.push(nt);
  WS.saveTasks();
  window._newParentId = null;
  window._processTags = [];

  renderDashboard();
  renderPage_Tasks();
  renderPage_Settings();
  closeModalDirect('newTaskModal');
  showToast('success', '????업무媛 吏?쒕릺됩니다.');
  titleInput.value = '';
  document.getElementById('nt_desc').value = '';
}

/* ?? 怨쇱젙?깅줉 ?쒓렇 ?? */
let _processTags = [];
function addProcessTag(e) {
  if(e.key !== 'Enter' && e.key !== ',') return;
  e.preventDefault();
  const input = document.getElementById('nt_process_input');
  const val = input.value.trim().replace(/,$/, '');
  if(!val) return;
  if(!window._processTags) window._processTags = [];
  if(window._processTags.includes(val)) { input.value = ''; return; }
  window._processTags.push(val);
  input.value = '';
  renderProcessTags();
}

function removeProcessTag(idx) {
  if(window._processTags) window._processTags.splice(idx, 1);
  renderProcessTags();
}

function renderProcessTags() {
  const wrap = document.getElementById('nt_process_tags');
  if(!wrap) return;
  wrap.innerHTML = (window._processTags || []).map((t, i) =>
    `<span class="process-tag">${t}<button onclick="removeProcessTag(${i})">??/button></span>`
  ).join('');
}

/* ?? 업무목록 ?섏씠吏 (전체 ?쒖뼱) ?? */
function switchTaskView(view, btn) {
  window._taskViewMode = view;
  document.querySelectorAll('.view-switcher .switch-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  
  const title = document.getElementById('tasksPageTitle');
  const sub = document.getElementById('tasksPageSubtitle');
  const assSub = document.getElementById('assignmentSubFilter');
  const listSub = document.getElementById('taskListFilter');

  if (view === 'assignment') {
    title.textContent = '업무배정';
    sub.textContent = '내 담당 업무 배정 현황을 확인하세요.';
    assSub.style.display = 'flex';
    listSub.style.display = 'none';
  } else {
    title.textContent = '업무목록';
    sub.textContent = '전체 업무 목록 및 현황을 확인하세요.';
    assSub.style.display = 'none';
    listSub.style.display = 'none'; // ?꾪꽣 移??곸뿭 ?④? (?ъ슜???붿껌: 상태援щ텇 삭제)
  }
  renderPage_Tasks();
}

function setAssignmentMode(mode, btn) {
  window._assignmentMode = mode;
  document.querySelectorAll('#assignmentSubFilter .chip').forEach(c => c.classList.remove('active'));
  btn.classList.add('active');
  
  // 吏곸썝 愿由?踰꾪듉 ?쒖떆 ?щ? ?쒖뼱
  const staffActions = document.getElementById('staffManageActions');
  if(staffActions) staffActions.style.display = mode==='staff' ? 'block' : 'none';
  
  renderPage_Tasks();
}

function renderPage_Tasks(filter='all') {
  updateStatusCounters();
  const el = document.getElementById('taskListArea');
  if(!el) return;

  const titleEl = document.getElementById('taskListTitle');

  if (window._taskViewMode === 'assignment') {
    // 업무목록 酉? ??댄? 諛곗? ?④?
    if (titleEl) titleEl.style.display = 'none';
    el.innerHTML = '<div id="taskSubContentArea"></div>';
    const subArea = document.getElementById('taskSubContentArea');
    if (window._assignmentMode === 'task') renderAssignmentByTask(subArea);
    else renderAssignmentByStaff(subArea);
  } else {
    // 업무紐⑸줉 酉? ??댄???諛뺤뒪 諛붽묑??諭껋?濡??쒖떆
    if (titleEl) {
      titleEl.style.display = 'block';
      titleEl.innerHTML = `
        <span style="display:inline-flex;align-items:center;gap:6px;
              background:var(--bg-secondary);border:1.5px solid var(--border-color);
              border-radius:20px;padding:5px 14px 5px 10px;
              font-size:13px;font-weight:800;color:var(--text-secondary)">
          <i data-lucide="list-checks" style="width:14px;height:14px;color:var(--accent-blue)"></i>
          업무紐⑸줉 由ъ뒪??        </span>`;
      refreshIcons();
    }
    el.innerHTML = '<div id="taskSubContentArea"></div>';
    const subArea = document.getElementById('taskSubContentArea');
    renderTaskListView(subArea);
  }
  refreshIcons();
}

/* ?? 업무목록: 업무蹂?由ъ뒪???? */
function renderAssignmentByTask(targetEl) {
  const el = targetEl || document.getElementById('taskListArea');
  if(!el) return;
  const tasks = WS.tasks;
  const rows = tasks.map(t => {
    const ids = Array.isArray(t.assigneeIds) ? t.assigneeIds : (t.assigneeId ? [t.assigneeId] : []);
    const assigneeHtml = ids.length > 0
      ? ids.map(uid => {
          const u = WS.getUser(uid);
          return u ? `<div class="staff-badge"><div class="avatar-sm" style="background:linear-gradient(135deg,${u.color||'#4f6ef7'},#9747ff)">${u.avatar}</div>${u.name}</div>` : '';
        }).join('')
      : `<span style="color:var(--text-muted);font-size:11.5px">誘몃같??/span>`;
    return `<tr>
      <td style="width:40%"><div style="font-weight:700;font-size:13.5px">${t.title}</div><div style="font-size:11px;color:var(--text-muted)">${t.team}</div></td>
      <td><div class="badge-list">${assigneeHtml}</div></td>
      <td><div class="score-tag">${t.score || 0}<span>pt</span></div></td>
      <td style="width:80px">
        <div class="manage-actions">
          <button class="btn-icon-sm edit" onclick="openTaskAssignModal(${t.id})" title="담당吏곸썝 諛곗젙">
            <i data-lucide="user-plus" class="icon-sm"></i>
          </button>
        </div>
      </td>
    </tr>`;
  }).join('');

  el.innerHTML = `<table class="task-table">
    <thead><tr><th>업무紐?/th><th>담당 吏곸썝</th><th>媛??/th><th>愿由?/th></tr></thead>
    <tbody>${rows || '<tr><td colspan="4" class="empty-state">?곗씠?곌? 없습니다.</td></tr>'}</tbody>
  </table>`;
  refreshIcons();
}

/* ?? 업무목록: 吏곸썝蹂?由ъ뒪???? */
function renderAssignmentByStaff(targetEl) {
  const el = targetEl || document.getElementById('taskListArea');
  if(!el) return;
  const users = WS.users;
  const rows = users.map(u => {
    const myTasks = WS.tasks.filter(t => {
      const ids = Array.isArray(t.assigneeIds) ? t.assigneeIds : (t.assigneeId ? [t.assigneeId] : []);
      return ids.includes(u.id);
    });
    const badges = myTasks.map(t => `<span class="task-badge">${t.title}</span>`).join('');
    return `<tr>
      <td style="width:200px">
        <div style="display:flex;align-items:center;gap:10px">
          <div class="avatar" style="width:32px;height:32px;background:linear-gradient(135deg,${u.color},#9747ff);color:#fff;font-size:12px;font-weight:800;border-radius:50%;display:flex;align-items:center;justify-content:center">${u.avatar}</div>
          <div>
            <div style="font-weight:700;font-size:13px">${u.name}</div>
            <div style="font-size:10.5px;color:var(--text-muted)">${u.role} · ${u.dept}</div>
          </div>
        </div>
      </td>
      <td><div class="badge-list">${badges || '<span style="color:var(--text-muted);font-size:11px">諛곗젙??업무 ?놁쓬</span>'}</div></td>
      <td style="width:100px">
        <div class="manage-actions">
          <button class="btn-icon-sm edit" onclick="openAssignmentManageModal(${u.id})" title="업무 諛곗젙 愿由?><i data-lucide="settings-2" class="icon-sm"></i></button>
          <!-- 삭제 ?꾩씠肄??쒓굅??-->
        </div>
      </td>
    </tr>`;
  }).join('');

  el.innerHTML = `<table class="task-table">
    <thead><tr><th>吏곸썝 ?뺣낫</th><th>諛곗젙 업무</th><th>愿由?/th></tr></thead>
    <tbody>${rows}</tbody>
  </table>`;
  refreshIcons();
}

/* ?? 업무紐⑸줉: 怨좊룄?붾맂 怨꾩링??由ъ뒪???? */
function renderTaskListView(targetEl) {
  const el = targetEl || document.getElementById('taskListArea');
  if(!el) return;

  const renderNode = (parentId = null, level = 0) => {
    const tasks = WS.tasks.filter(t => t.parentId === (parentId === null ? null : Number(parentId)));
    let html = '';
    tasks.forEach(t => {
      const indent = level * 24;
      html += `<tr>
        <td>
          <div class="tree-node" style="padding-left:${indent}px">
            ${level > 0 ? '<div class="tree-line"></div>' : ''}
            <div class="tree-title">${t.isImportant?'<span class="star-icon"><i data-lucide="star"></i></span>':''} ${t.title}</div>
            <button class="btn-sub-add" onclick="openNewTaskModal(${t.id})" title="?섏쐞 遺꾨쪟 추가"><i data-lucide="plus" style="width:12px;height:12px"></i></button>
          </div>
          <div style="font-size:11px;color:var(--text-muted);padding-left:${indent}px">${t.team}</div>
        </td>
        <td style="width:110px">
          ${(() => {
            const rc = t.reportContent || '';
            return rc ? `<span class="report-status-badge">${rc}</span>` : '<span style="color:var(--text-muted);font-size:11px">-</span>';
          })()}
        </td>
        <td>
          ${(() => {
            const tags = Array.isArray(t.processTags) && t.processTags.length > 0
              ? t.processTags.map(tag => `<span class="task-badge" style="margin-right:3px">${tag}</span>`).join('')
              : '<span style="color:var(--text-muted);font-size:11px">-</span>';
            return tags;
          })()}
        </td>
        <td style="width:80px"><div class="score-tag">${t.score || 0}<span>pt</span></div></td>
        <td style="color:var(--text-muted);font-size:11.5px;max-width:260px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${t.desc || '-'}</td>
        <td style="width:80px">
          <div class="manage-actions">
            <button class="btn-icon-sm edit" onclick="openEditTaskModal(${t.id})" title="수정"><i data-lucide="edit-3" class="icon-sm"></i></button>
            <button class="btn-icon-sm delete" onclick="deleteTask(${t.id})" title="삭제"><i data-lucide="trash-2" class="icon-sm"></i></button>
          </div>
        </td>
      </tr>`;
      html += renderNode(t.id, level + 1);
    });
    return html;
  };

  const rowsHtml = renderNode(null, 0);

  el.innerHTML = `<table class="task-table">
    <thead><tr><th>업무紐?/th><th>업무결과</th><th>怨쇱젙?뺤씤</th><th>?먯닔</th><th>설명</th><th>愿由?/th></tr></thead>
    <tbody>${rowsHtml || '<tr><td colspan="6" class="empty-state">업무媛 없습니다.</td></tr>'}</tbody>
  </table>`;
  refreshIcons();
}

/* ?? 업무紐⑸줉 수정 紐⑤떖 ?? */
function openEditTaskModal(id) {
  const t = WS.getTask(id);
  if(!t) return;
  window._editingTaskId = id;

  // 紐⑤떖??'?좏깮업무 수정' 紐⑤뱶濡??닿린
  openNewTaskModal('edit');

  // ?좎떆 ???꾨뱶 ?곗씠??梨꾩슦湲?(openNewTaskModal??珥덇린?뷀븳 ??
  setTimeout(() => {
    const set = (elId, val) => { const el = document.getElementById(elId); if(el) el.value = val ?? ''; };
    set('nt_title',    t.title);
    set('nt_desc',     t.desc);
    set('nt_priority', t.priority || 'medium');
    set('nt_team',     t.team);
    set('nt_start',    t.startedAt || '');
    set('nt_due',      t.dueDate);
    set('nt_result',   t.reportContent || '');   // reportContent ??nt_result
    set('nt_score',    t.score ?? 0);
    const impEl = document.getElementById('nt_important');
    if(impEl) impEl.checked = !!t.isImportant;

    // 怨쇱젙?깅줉 ?쒓렇
    window._processTags = Array.isArray(t.processTags) ? [...t.processTags] : [];
    renderProcessTags();
  }, 0);
}

function saveEditTask() {
  const id = window._editingTaskId;
  if(!id) return;
  const title = document.getElementById('nt_title')?.value.trim();
  if(!title) { showToast('error', '?쒕ぉ??입력하세요'); return; }
  WS.tasks = WS.tasks.map(t => {
    if(t.id !== id) return t;
    return {
      ...t,
      title,
      desc:          document.getElementById('nt_desc')?.value || t.desc,
      priority:      document.getElementById('nt_priority')?.value || t.priority,
      team:          document.getElementById('nt_team')?.value || t.team,
      startedAt:     document.getElementById('nt_start')?.value || t.startedAt,
      dueDate:       document.getElementById('nt_due')?.value || t.dueDate,
      reportContent: document.getElementById('nt_result')?.value || '',  // nt_result ??reportContent
      score:         parseInt(document.getElementById('nt_score')?.value) || 0,
      isImportant:   document.getElementById('nt_important')?.checked ?? t.isImportant,
      processTags:   window._processTags || t.processTags,
    };
  });
  WS.saveTasks();
  window._editingTaskId = null;
  window._processTags = [];
  closeModalDirect('newTaskModal');
  renderPage_Tasks();
  showToast('success', '업무가 저장되었습니다.');
}

function deleteTask(id) {
  if(!confirm('정말 삭제하시겠습니까?')) return;
  WS.tasks = WS.tasks.filter(task => task.id !== id);
  WS.saveTasks();
  renderPage_Tasks();
  showToast('info', '<i data-lucide="trash-2"></i> 업무가 삭제되었습니다.');
}

/* ?? 업무 현황 담당吏곸썝 諛곗젙 紐⑤떖 ?? */
function openTaskAssignModal(taskId) {
  const t = WS.getTask(taskId);
  if(!t) return;
  window._assigningTaskId = taskId;

  // 紐⑤떖 ??댄? 업데이트
  const title = document.getElementById('tam_task_title');
  const team  = document.getElementById('tam_task_team');
  if(title) title.textContent = t.title;
  if(team)  team.textContent  = t.team;

  // 吏곸썝 ?좏깮 由ъ뒪???뚮뜑留?  renderTaskAssignStaffList(taskId);
  openModal('taskAssignModal');
  refreshIcons();
}

function renderTaskAssignStaffList(taskId) {
  const t = WS.getTask(taskId);
  const container = document.getElementById('tam_staff_list');
  if(!container || !t) return;

  if (!Array.isArray(t.assigneeIds)) {
    t.assigneeIds = t.assigneeId ? [t.assigneeId] : [];
  }

  const users = WS.users;
  container.innerHTML = users.map(u => {
    const isSelected = t.assigneeIds.includes(u.id);
    return `
      <div onclick="selectTaskAssignee(${taskId}, ${u.id})" 
           style="padding:12px 14px;border-radius:10px;border:2px solid ${isSelected ? 'var(--accent-blue)' : 'transparent'};
                  background:${isSelected ? 'rgba(79,110,247,0.08)' : 'var(--bg-tertiary)'};
                  cursor:pointer;transition:all 0.2s;display:flex;align-items:center;gap:12px;
                  box-shadow:${isSelected ? '0 4px 12px rgba(79,110,247,0.15)' : 'none'};margin-bottom:8px">
        <div class="avatar" style="width:38px;height:38px;background:linear-gradient(135deg,${u.color||'#4f6ef7'},#9747ff);color:#fff;font-size:14px;font-weight:800;border-radius:50%;display:flex;align-items:center;justify-content:center;flex-shrink:0">${u.avatar}</div>
        <div style="flex:1">
          <div style="font-weight:700;font-size:13px;color:var(--text-primary)">${u.name}</div>
          <div style="font-size:10.5px;color:var(--text-muted)">${u.role} · ${u.dept}</div>
        </div>
        <div style="width:22px;height:22px;border-radius:50%;background:${isSelected ? 'var(--accent-blue)' : 'var(--border-color)'};
                    display:flex;align-items:center;justify-content:center;flex-shrink:0">
          <i data-lucide="${isSelected ? 'check' : 'user'}" style="width:13px;height:13px;color:#fff"></i>
        </div>
      </div>
    `;
  }).join('');
  refreshIcons();
}

function selectTaskAssignee(taskId, staffId) {
  const t = WS.getTask(taskId);
  if(!t) return;

  if (!Array.isArray(t.assigneeIds)) {
    t.assigneeIds = t.assigneeId ? [t.assigneeId] : [];
  }

  const idx = t.assigneeIds.indexOf(staffId);
  if (idx !== -1) {
    t.assigneeIds.splice(idx, 1);
    showToast('info', '담당吏곸썝 諛곗젙???댁젣되었습니다.');
  } else {
    t.assigneeIds.push(staffId);
    const u = WS.getUser(staffId);
    showToast('success', `[${t.title}] 업무媛 ${u?.name}?섏뿉寃?諛곗젙되었습니다.`);
  }
  WS.saveTasks();
  renderTaskAssignStaffList(taskId);
  renderPage_Tasks();
}

/* ?? 업무 諛곗젙 愿由??꾩슜 紐⑤떖 (?좉퇋) ?? */
function openAssignmentManageModal(id) {
  const u = WS.getUser(id);
  if(!u) return;

  // ?곷떒 吏곸썝 탭 ?뚮뜑留?  const card = document.getElementById('amm_staff_card');
  if(card) {
    card.innerHTML = `
      <div style="width:60px;height:60px;border-radius:12px;background:linear-gradient(135deg,${u.color},#9747ff);display:flex;align-items:center;justify-content:center;color:#fff;font-size:20px;font-weight:800;border:2px solid #fff;box-shadow:0 4px 10px rgba(0,0,0,0.1)">${u.avatar}</div>
      <div>
        <div style="font-size:18px;font-weight:800;color:var(--text-primary);margin-bottom:2px">${u.name}</div>
        <div style="font-size:13px;color:var(--text-secondary);font-weight:600">${u.role} · ${u.dept}</div>
        <div style="font-size:11.5px;color:var(--text-muted);margin-top:2px">${u.email || ''}</div>
      </div>
      <div style="margin-left:auto;text-align:right">
        <div style="font-size:11px;color:var(--text-muted);margin-bottom:4px">?꾩옱 담당 업무</div>
        <div style="font-size:20px;font-weight:800;color:var(--accent-blue)">${WS.tasks.filter(t => {
          const ids = Array.isArray(t.assigneeIds) ? t.assigneeIds : (t.assigneeId ? [t.assigneeId] : []);
          return ids.includes(id);
        }).length}건/div>
      </div>
    `;
  }

  // 업무 由ъ뒪??(?좉?) ?뚮뜑留?  renderAssignmentManageTasks(id);
  
  openModal('assignmentManageModal');
  refreshIcons();
}

function renderAssignmentManageTasks(staffId) {
  const container = document.getElementById('amm_task_list');
  if(!container) return;

  const tasks = WS.tasks;
  container.innerHTML = tasks.map(t => {
    if (!Array.isArray(t.assigneeIds)) {
      t.assigneeIds = t.assigneeId ? [t.assigneeId] : [];
    }
    const isAssigned = t.assigneeIds.includes(staffId);
    return `
      <div onclick="toggleTaskAssignment(${staffId}, ${t.id})" 
           style="padding:12px;border-radius:10px;border:2px solid ${isAssigned?'var(--accent-blue)':'transparent'};
                  background:${isAssigned?'rgba(79,110,247,0.08)':'var(--bg-tertiary)'};
                  opacity:${isAssigned?'1':'0.5'};
                  cursor:pointer;transition:all 0.2s;display:flex;align-items:center;gap:10px;
                  box-shadow:${isAssigned?'0 4px 12px rgba(79,110,247,0.15)':'none'}">
        <div style="width:24px;height:24px;border-radius:50%;background:${isAssigned?'var(--accent-blue)':'var(--border-color)'};
                    display:flex;align-items:center;justify-content:center;color:#fff">
          <i data-lucide="${isAssigned?'check':'plus'}" style="width:14px;height:14px"></i>
        </div>
        <div style="flex:1">
          <div style="font-size:12.5px;font-weight:700;color:var(--text-primary);margin-bottom:2px">${t.title}</div>
          <div style="font-size:10px;color:var(--text-muted)">${t.team}</div>
        </div>
      </div>
    `;
  }).join('');
  refreshIcons();
}

function toggleTaskAssignment(staffId, taskId) {
  const t = WS.getTask(taskId);
  if(!t) return;

  if (!Array.isArray(t.assigneeIds)) {
    t.assigneeIds = t.assigneeId ? [t.assigneeId] : [];
  }

  const idx = t.assigneeIds.indexOf(staffId);
  if (idx !== -1) {
    t.assigneeIds.splice(idx, 1);
    showToast('info', `[${t.title}] 諛곗젙???댁젣되었습니다.`);
  } else {
    t.assigneeIds.push(staffId);
    showToast('success', `[${t.title}] 업무媛 諛곗젙되었습니다.`);
  }

  WS.saveTasks();
  renderAssignmentManageTasks(staffId);
  renderPage_Tasks(); // 諛곌꼍 由ъ뒪?몃룄 媛깆떊
}

function filterTasks(f, el) {
  document.querySelectorAll('#taskFilterChips .chip').forEach(c=>c.classList.remove('active'));
  el.classList.add('active');
  renderPage_Tasks(f);
}

function updateStatusCounters() {
  const tasks = WS.tasks;
  const counts = {
    all: tasks.length,
    waiting: tasks.filter(t=>t.status==='waiting').length,
    progress: tasks.filter(t=>t.status==='progress').length,
    delay: tasks.filter(t=>t.status==='delay').length,
    done: tasks.filter(t=>t.status==='done').length
  };

  // 업무목록/紐⑸줉 ?섏씠吏 移?업데이트
  Object.keys(counts).forEach(k => {
    const el = document.getElementById(`cnt_${k}`);
    if(el) el.textContent = counts[k];
  });

  // 업무설정 ?섏씠吏 移?업데이트
  Object.keys(counts).forEach(k => {
    const el = document.getElementById(`scnt_${k}`);
    if(el) el.textContent = counts[k];
  });
}

function filterSettings(filter, el) {
  window._settingsFilter = filter;
  document.querySelectorAll('#settingsFilterChips .chip').forEach(c=>c.classList.remove('active'));
  el.classList.add('active');
  renderPage_Settings();
}

/* ?? 업무설정 ?섏씠吏 ?? */
function renderPage_Settings() {
  updateStatusCounters();
  // 최초 진입 시 전체 필터로 강제 초기화
  if (!window._settingsFilter) {
    window._settingsFilter = 'all';
    const chips = document.querySelectorAll('#settingsFilterChips .chip');
    chips.forEach(c => c.classList.remove('active'));
    if (chips[0]) chips[0].classList.add('active');
  }
  const el = document.getElementById('settingsArea');
  if(!el) return;
  const filtered = (!window._settingsFilter || window._settingsFilter === 'all') ? WS.tasks : WS.tasks.filter(t=>t.status===window._settingsFilter);
  const byTeam = {};
  filtered.forEach(t => {
    if(!byTeam[t.team]) byTeam[t.team]=[];
    byTeam[t.team].push(t);
  });
  el.innerHTML = Object.entries(byTeam).map(([team, tasks])=>`
    <div class="section-card" style="margin-bottom:14px;padding:0">
      <div class="section-head" style="padding:14px 18px">
        <div class="section-title-group">
          <div class="section-dot" style="background:var(--accent-blue)"><i data-lucide="users"></i></div>
          <div class="section-title">${team}</div>
          <span class="section-count">${tasks.length}건</span>>
        </div>
      </div>
      <table class="task-table">
        <thead>
          <tr>
            <th>업무명</th>
            <th>지시자</th>
            <th>담당자</th>
            <th>우선순위</th>
            <th>상태</th>
            <th>진행률</th>
            <th>마감일</th>
          </tr>
        </thead>
        <tbody>
          ${tasks.map(t => {
            const _sIds = Array.isArray(t.assigneeIds) ? t.assigneeIds : (t.assigneeId ? [t.assigneeId] : []);
            const assignee = WS.getUser(_sIds[0]);
            const assigner = WS.getUser(t.assignerId);
            const fillCls = t.status==='delay'?'delay':t.status==='done'?'done':'';
            return `<tr onclick="openTaskDetail(${t.id})" style="cursor:pointer">
            <td style="width:30%">
              <div style="font-weight:700;font-size:13px">${t.isImportant?'<span class="star-icon"><i data-lucide="star"></i></span>':''} ${t.title}</div>
            </td>
            <td><div style="font-size:11.5px">${assigner?.name||'-'}</div></td>
            <td>
              <div style="display:flex;align-items:center;gap:6px">
                <div style="width:22px;height:22px;border-radius:50%;background:linear-gradient(135deg,${assignee?.color||'#4f6ef7'},#9747ff);display:flex;align-items:center;justify-content:center;color:#fff;font-size:9px;font-weight:700">${assignee?.avatar||'?'}</div>
                ${assignee?.name||'-'}
              </div>
            </td>
            <td><span class="priority-badge priority-${t.priority}">${WS.getPriorityLabel(t.priority)}</span></td>
            <td><span class="status-badge status-${t.status}">${WS.getStatusLabel(t.status)}</span></td>
            <td>
              <div class="progress-wrap">
                <div class="progress-bar"><div class="progress-fill ${fillCls}" style="width:${t.progress}%"></div></div>
                <span class="progress-label">${t.progress}%</span>
              </div>
            </td>
            <td>${t.dueDate}</td>
          </tr>`;
          }).join('')}</tbody>
      </table>
    </div>`).join('') || '<div class="empty-state">해당 상태의 업무가 없습니다.</div>';
  refreshIcons();
}

/* ?? 일정蹂닿린 ?섏씠吏 ?? */
function renderPage_Schedule() {
  const el = document.getElementById('scheduleArea');
  if(!el) return;
  const today = new Date();
  const year = today.getFullYear(), month = today.getMonth();
  const firstDay = new Date(year,month,1).getDay();
  const lastDate = new Date(year,month+1,0).getDate();
  const days=['일','월','화','수','목','금','토'];
  let cal = `<div class="section-card"><div class="section-head">
    <div class="section-title-group">
      <div class="section-dot" style="background:#06b6d4"><i data-lucide="calendar"></i></div>
      <div class="section-title">${year}년 ${month+1}월 업무 일정</div>
    </div>
  </div>
  <div style="padding:16px">
    <div style="display:grid;grid-template-columns:repeat(7,1fr);gap:4px;margin-bottom:8px">
      ${days.map((d,i)=>`<div style="text-align:center;font-size:11px;font-weight:700;padding:6px;color:${i===0?'#ef4444':i===6?'#4f6ef7':'var(--text-muted)'}">${d}</div>`).join('')}
    </div>
    <div style="display:grid;grid-template-columns:repeat(7,1fr);gap:4px">`;
  for(let i=0;i<firstDay;i++) cal+=`<div style="min-height:70px;border-radius:6px;background:var(--bg-tertiary);opacity:.3"></div>`;
  for(let d=1;d<=lastDate;d++){
    const dt = `${year}-${String(month+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
    const dueTasks = WS.tasks.filter(t=>t.dueDate===dt);
    const isToday2 = d===today.getDate();
    cal+=`<div style="min-height:70px;border-radius:6px;padding:6px;background:var(--bg-tertiary);border:1.5px solid ${isToday2?'var(--accent-blue)':'transparent'};position:relative">
      <div style="font-size:12px;font-weight:${isToday2?'800':'500'};color:${isToday2?'var(--accent-blue)':'var(--text-secondary)'};margin-bottom:3px">${d}</div>
      ${dueTasks.slice(0,2).map(t=>`<div onclick="openTaskDetail(${t.id})" style="font-size:10px;font-weight:600;padding:2px 5px;border-radius:3px;background:${t.status==='delay'?'rgba(239,68,68,.2)':t.status==='done'?'rgba(34,197,94,.2)':'rgba(79,110,247,.2)'};color:${t.status==='delay'?'#ef4444':t.status==='done'?'#22c55e':'#4f6ef7'};cursor:pointer;margin-bottom:2px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${t.title}</div>`).join('')}
      ${dueTasks.length>2?`<div style="font-size:9.5px;color:var(--text-muted)">+${dueTasks.length-2}건</div>`:''}
    </div>`;
  }
  cal+=`</div></div></div>`;
  el.innerHTML = cal;
  refreshIcons();
}

/* ?? 吏곸썝愿由??섏씠吏 (?좉퇋) ?? */
function renderPage_StaffMgmt() {
  const el = document.getElementById('staffListArea');
  if(!el) return;
  
  const users = WS.users;
  const rows = users.map(u => {
    return `<tr>
      <td style="width:180px">
        <div style="display:flex;align-items:center;gap:10px">
          <div class="avatar" style="width:36px;height:36px;background:linear-gradient(135deg,${u.color},#9747ff);color:#fff;font-size:13px;font-weight:800;border-radius:50%;display:flex;align-items:center;justify-content:center">${u.avatar}</div>
          <div>
            <div style="font-weight:700;font-size:13.5px">${u.name}</div>
            <div style="font-size:11px;color:var(--text-muted)">${u.dept}</div>
          </div>
        </div>
      </td>
      <td><div style="font-size:13px;font-weight:600">${u.role}</div></td>
      <td><div style="font-size:13px;font-weight:500;color:var(--accent-blue)">${u.pos || '-'}</div></td>
      <td><div style="font-size:12.5px">${u.phone || '-'}</div></td>
      <td><div style="font-size:12px;color:var(--text-secondary);max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap" title="${u.address||''}">${u.address || '-'}</div></td>
      <td>${renderStaffStatusBadge(u.status)}</td>
      <td style="width:100px">
        <div class="manage-actions">
          <button class="btn-icon-sm edit" onclick="openStaffModal(${u.id})" title="상세/수정"><i data-lucide="edit-3" class="icon-sm"></i></button>
          <button class="btn-icon-sm delete" onclick="deleteStaff(${u.id})" title="삭제"><i data-lucide="trash-2" class="icon-sm"></i></button>
        </div>
      </td>
    </tr>`;
  }).join('');

  el.innerHTML = `<table class="task-table">
    <thead>
      <tr>
        <th>이름</th>
        <th>직급</th>
        <th>직책</th>
        <th>전화번호</th>
        <th>주소</th>
        <th>상태</th>
        <th>관리</th>
      </tr>
    </thead>
    <tbody>${rows || '<tr><td colspan="7" class="empty-state">등록된 직원이 없습니다.</td></tr>'}</tbody>
  </table>`;
  refreshIcons();
}

function renderStaffStatusBadge(status) {
  if(!status) return '<span class="status-badge status-waiting">미정</span>';
  let type = 'waiting';
  if(status.includes('근무')) type = 'progress';
  if(status.includes('휴직')) type = 'delay';
  if(status === '퇴사') type = 'done';
  
  return `<span class="status-badge status-${type}">${status}</span>`;
}

/* ?? 실적보기 ?섏씠吏 ?? */
function renderPage_Performance() {
  const el = document.getElementById('performanceArea');
  if(!el) return;
  const cards = WS.users.map(u => {
    const myTasks = WS.tasks.filter(t => {
      const _pIds = Array.isArray(t.assigneeIds) ? t.assigneeIds : (t.assigneeId ? [t.assigneeId] : []);
      return _pIds.includes(u.id);
    });
    const done = myTasks.filter(t=>t.status==='done').length;
    const delay = myTasks.filter(t=>t.status==='delay').length;
    const progress = myTasks.filter(t=>t.status==='progress').length;
    const rate = myTasks.length>0?Math.round(done/myTasks.length*100):0;
    const avgProg = myTasks.length>0?Math.round(myTasks.reduce((a,t)=>a+t.progress,0)/myTasks.length):0;
    return `<div class="section-card" style="padding:0">
      <div style="padding:18px 18px 14px">
        <div style="display:flex;align-items:center;gap:12px;margin-bottom:14px">
          <div style="width:44px;height:44px;border-radius:50%;background:linear-gradient(135deg,${u.color},#9747ff);display:flex;align-items:center;justify-content:center;color:#fff;font-size:16px;font-weight:800">${u.avatar}</div>
          <div>
            <div style="font-size:14px;font-weight:700">${u.name}</div>
            <div style="font-size:11.5px;color:var(--text-muted)">${u.role} · ${u.dept}</div>
          </div>
          <div style="margin-left:auto;text-align:right">
            <div style="font-size:22px;font-weight:800;color:${rate>=80?'#22c55e':rate>=50?'#f59e0b':'#ef4444'}">${rate}%</div>
            <div style="font-size:10.5px;color:var(--text-muted)">완료율</div>
          </div>
        </div>
        <div class="progress-bar" style="height:8px;margin-bottom:14px">
          <div class="progress-fill ${rate>=80?'done':rate<30?'delay':''}" style="width:${rate}%"></div>
        </div>
        <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px">
          ${[{label:'전체',val:myTasks.length,color:'#4f6ef7'},{label:'진행중',val:progress,color:'#06b6d4'},{label:'완료',val:done,color:'#22c55e'},{label:'지연',val:delay,color:'#ef4444'}].map(s=>`
            <div style="background:var(--bg-tertiary);border-radius:8px;padding:8px;text-align:center">
              <div style="font-size:18px;font-weight:800;color:${s.color}">${s.val}</div>
              <div style="font-size:10.5px;color:var(--text-muted)">${s.label}</div>
            </div>`).join('')}
        </div>
        <div style="margin-top:12px;font-size:11.5px;color:var(--text-muted)">평균 진행률: <strong style="color:var(--text-primary)">${avgProg}%</strong></div>
      </div>
    </div>`;
  }).join('');
  el.innerHTML = `<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:14px">${cards}</div>`;
  refreshIcons();
}

/* ?? 媛쒖씤설정 ?섏씠吏 ?? */
function renderPage_Profile() {
  const el = document.getElementById('profileArea');
  if(!el) return;
  const u = WS.currentUser || WS.users[0];
  el.innerHTML = `
    <div style="display:grid;grid-template-columns:320px minmax(0,1fr);gap:16px">
      <!-- 프로필탭 -->
      <div class="section-card" style="padding:24px;align-items:center;text-align:center">
        <div style="width:80px;height:80px;border-radius:50%;background:linear-gradient(135deg,${u.color},#9747ff);display:flex;align-items:center;justify-content:center;color:#fff;font-size:28px;font-weight:800;margin:0 auto 14px">${u.avatar}</div>
        <div style="font-size:18px;font-weight:800;margin-bottom:4px">${u.name}</div>
        <div style="font-size:13px;color:var(--text-secondary);margin-bottom:4px">${u.dept} · ${u.role}${u.pos ? ` | ${u.pos}` : ''}</div>
        <div style="font-size:12px;color:var(--text-muted);margin-bottom:20px">${u.email}</div>
        <div style="display:flex;gap:8px;justify-content:center;margin-bottom:16px">
          <div style="text-align:center"><div style="font-size:18px;font-weight:800;color:var(--accent-blue)">${WS.tasks.filter(t=>{const _prIds=Array.isArray(t.assigneeIds)?t.assigneeIds:(t.assigneeId?[t.assigneeId]:[]);return _prIds.includes(u.id);}).length}</div><div style="font-size:11px;color:var(--text-muted)">담당 업무</div></div>
          <div style="width:1px;background:var(--border-color);margin:0 8px"></div>
          <div style="text-align:center"><div style="font-size:18px;font-weight:800;color:#22c55e">${WS.tasks.filter(t=>{const _prIds=Array.isArray(t.assigneeIds)?t.assigneeIds:(t.assigneeId?[t.assigneeId]:[]);return _prIds.includes(u.id)&&t.status==='done';}).length}</div><div style="font-size:11px;color:var(--text-muted)">완료</div></div>
          <div style="width:1px;background:var(--border-color);margin:0 8px"></div>
          <div style="text-align:center"><div style="font-size:18px;font-weight:800;color:#4f6ef7">${WS.tasks.filter(t=>t.assignerId===u.id).length}</div><div style="font-size:11px;color:var(--text-muted)">지시</div></div>
        </div>
        <button class="btn btn-blue" style="width:100%" onclick="logout()"><i data-lucide="log-out" class="icon-sm"></i> 로그아웃</button>
      </div>

      <!-- 설정 ?⑤꼸 -->
      <div class="section-card" style="min-width:0;overflow-x:hidden">
        <div class="tab-bar">
          <div class="tab-item active" onclick="switchProfileTab('profile-tab',this)">프로필 설정</div>
          <div class="tab-item" onclick="switchProfileTab('notif-tab',this)">알림 설정</div>
          <div class="tab-item" onclick="switchProfileTab('theme-tab',this)">UI 테마</div>
        </div>

        <div id="profile-tab" style="padding:20px">
          <div class="form-row">
            <div class="form-group"><label class="form-label">이름</label><input class="form-input" value="${u.name}" readonly></div>
            <div class="form-group"><label class="form-label">부서</label><input class="form-input" value="${u.dept}" readonly></div>
          </div>
          <div class="form-row">
            <div class="form-group"><label class="form-label">직급</label><input class="form-input" value="${u.role}" readonly></div>
            <div class="form-group"><label class="form-label">직책</label><input class="form-input" value="${u.pos || '-'}" readonly></div>
          </div>
          <div class="form-row">
            <div class="form-group"><label class="form-label">이메일</label><input class="form-input" value="${u.email}" readonly></div>
            <div class="form-group"><label class="form-label">상태</label><input class="form-input" value="${u.status}" readonly></div>
          </div>
          <button class="btn btn-blue" onclick="showToast('success', '<i data-lucide=&quot;check-circle-2&quot;></i> 프로필이 저장되었습니다.')">저장</button>
        </div>

        <div id="notif-tab" style="padding:20px;display:none">
          ${[{id:'n1',label:'신규 업무 지시 알림',desc:'업무를 할당받으면 즉시 알림'},
             {id:'n2',label:'마감 D-3 사전 알림',desc:'마감 3일 전 자동 알림'},
             {id:'n3',label:'상태 변경 알림',desc:'담당 업무 상태 변경 시 알림'},
             {id:'n4',label:'지시 결과 알림',desc:'업무 지시 완료 후 즉시 알림'},
             {id:'n5',label:'완료 보고 알림',desc:'지시한 업무가 완료되면 알림'},
          ].map(n=>`
            <div style="display:flex;justify-content:space-between;align-items:center;padding:12px 0;border-bottom:1px solid var(--border-color)">
              <div>
                <div style="font-size:13px;font-weight:600">${n.label}</div>
                <div style="font-size:11.5px;color:var(--text-muted)">${n.desc}</div>
              </div>
              <label style="position:relative;display:inline-block;width:42px;height:24px;cursor:pointer">
                <input type="checkbox" checked style="display:none" id="${n.id}" onchange="showToast('info','알림 설정이 변경되었습니다.')">
                <span style="position:absolute;inset:0;background:#4f6ef7;border-radius:12px;transition:.3s;display:flex;align-items:center;padding:2px">
                  <span id="${n.id}_knob" style="width:20px;height:20px;background:#fff;border-radius:50%;margin-left:auto"></span>
                </span>
              </label>
            </div>`).join('')}
          <button class="btn btn-blue" style="margin-top:16px" onclick="showToast('success','알림 설정이 저장되었습니다.')">설정 저장</button>
        </div>

        <div id="theme-tab" style="padding:20px;display:none">
          <div style="font-size:13px;font-weight:600;margin-bottom:14px">UI 테마 선택</div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:20px">
            <div onclick="applyTheme('light');showToast('info','라이트 모드로 변경됨')" style="padding:20px;border-radius:12px;border:2px solid var(--border-color);cursor:pointer;background:#f0f2f7;transition:var(--transition)" onmouseover="this.style.borderColor='#4f6ef7'" onmouseout="this.style.borderColor='var(--border-color)'">
              <div style="width:32px;height:32px;border-radius:50%;background:rgba(245,158,11,.2);display:flex;align-items:center;justify-content:center;margin-bottom:8px;color:#f59e0b"><i data-lucide="sun" style="width:20px;height:20px"></i></div>
              <div style="font-size:13px;font-weight:700;color:#1a1d2e">라이트 모드</div>
              <div style="font-size:11.5px;color:#5a6072">밝고 깔끔한 테마</div>
            </div>
            <div onclick="applyTheme('dark');showToast('info','다크 모드로 변경됨')" style="padding:20px;border-radius:12px;border:2px solid var(--border-color);cursor:pointer;background:#252840;transition:var(--transition)" onmouseover="this.style.borderColor='#4f6ef7'" onmouseout="this.style.borderColor='var(--border-color)'">
              <div style="width:32px;height:32px;border-radius:50%;background:rgba(151,71,255,.25);display:flex;align-items:center;justify-content:center;margin-bottom:8px;color:#9747ff"><i data-lucide="moon" style="width:20px;height:20px"></i></div>
              <div style="font-size:13px;font-weight:700;color:#e8eaf0">다크 모드</div>
              <div style="font-size:11.5px;color:#8b93a8">눈이 편한 어두운 테마</div>
            </div>
          </div>
          <div style="background:var(--bg-tertiary);border-radius:var(--radius-md);padding:14px">
            <div style="font-size:12px;font-weight:600;color:var(--text-secondary);margin-bottom:12px">강조색 설정</div>
            <div class="accent-list" id="accentList">
              ${WS.accents.map(c => `
                <div class="accent-chip-wrapper">
                  <div class="accent-chip ${WS.currentAccent===c?'active':''}" 
                       style="background:${c}" 
                       onclick="applyAccent('${c}')"></div>
                  <div class="accent-delete-btn" onclick="deleteAccent('${c}', event)">×</div>
                </div>`).join('')}
              <button class="btn-add-accent" onclick="triggerAddAccent()" title="새 강조색 추가">+</button>
              <input type="color" id="accentColorPicker" onchange="addAccentFromPicker(this.value)">
            </div>
            <div style="font-size:10.5px;color:var(--text-muted);margin-top:10px">색상에 마우스를 올려 삭제할 수 있습니다.</div>
          </div>
        </div>
      </div>
    </div>`;
}

function switchProfileTab(tabId, el) {
  document.querySelectorAll('#page-profile .tab-item').forEach(t=>t.classList.remove('active'));
  el.classList.add('active');
  ['profile-tab','notif-tab','theme-tab'].forEach(id=>{
    const t=document.getElementById(id);
    if(t) t.style.display = id===tabId?'block':'none';
  });
}

// switchTab ?꾩뿭 ?몄텧 (?ㅻ뜑 프로필초기화?먯꽌 ?몄텧)
function switchTab(tabId) {
  showPage('profile', document.querySelector('[data-page=profile]'));
  setTimeout(()=>{
    const tab = document.querySelector(`[onclick*="${tabId}"]`);
    if(tab) tab.click();
  },100);
}

/* ??? 媛뺤“??愿???⑥닔 ??? */
function applyAccent(color) {
  WS.currentAccent = color;
  localStorage.setItem('ws_current_accent', color);
  // CSS 蹂??援먯껜
  const root = document.documentElement;
  root.style.setProperty('--accent-blue', color);
  root.style.setProperty('--currentAccent', color);  // ?щ젰 ?쎌빱 ??媛뺤“??초기화  // 諛앹? 踰꾩쟾(tint) ?앹꽦
  root.style.setProperty('--accent-blue-light', color + '22');
  // ?ъ씠?쒕컮 active 커스텀??초기화  root.style.setProperty('--text-sidebar-active', color);
  root.style.setProperty('--bg-sidebar-active', color + '1a');
  // 媛뺤“??移?active 상태 媛깆떊
  document.querySelectorAll('.accent-chip').forEach(chip => {
    chip.classList.toggle('active', chip.style.background === color || chip.dataset.color === color);
  });
  showToast('success', '<i data-lucide="check-circle-2"></i> 강조색이 변경되었습니다.');
  refreshIcons();
  // 異쒗눜洹?위젯 커스텀 초기화  renderAttendancePill();
}

function deleteAccent(color, e) {
  e.stopPropagation();
  // 湲곕낯 커스텀? 삭제 遺덇?
  const defaults = ['#4f6ef7'];
  if (defaults.includes(color)) { showToast('warn', '기본 강조색은 삭제할 수 없습니다.'); return; }
  WS.accents = WS.accents.filter(c => c !== color);
  WS.saveAccents();
  if (WS.currentAccent === color) applyAccent('#4f6ef7');
  // 移?紐⑸줉 ?덈줈怨좎묠
  renderAccentList();
  showToast('info', '<i data-lucide="trash-2"></i> 강조색이 삭제되었습니다.');
}

function triggerAddAccent() {
  const panel = document.getElementById('colorPickerPanel');
  if (!panel) return;
  const vis = panel.style.display !== 'none';
  panel.style.display = vis ? 'none' : 'block';
  if (!vis) { window._cpHue = window._cpHue || 200; setTimeout(cpDraw, 30); }
}

var _cpHue = 200, _cpColor = '#4f6ef7';

function cpDraw() {
  const canvas = document.getElementById('cpCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const w = canvas.width, h = canvas.height;
  ctx.fillStyle = `hsl(${_cpHue},100%,50%)`;
  ctx.fillRect(0, 0, w, h);
  const wg = ctx.createLinearGradient(0,0,w,0);
  wg.addColorStop(0,'rgba(255,255,255,1)'); wg.addColorStop(1,'rgba(255,255,255,0)');
  ctx.fillStyle = wg; ctx.fillRect(0,0,w,h);
  const bg = ctx.createLinearGradient(0,0,0,h);
  bg.addColorStop(0,'rgba(0,0,0,0)'); bg.addColorStop(1,'rgba(0,0,0,1)');
  ctx.fillStyle = bg; ctx.fillRect(0,0,w,h);
}

function cpUpdateHue(val) { _cpHue = parseInt(val); cpDraw(); }

function cpPickColor(e) {
  const canvas = document.getElementById('cpCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const r = canvas.getBoundingClientRect();
  const sx = canvas.width / r.width, sy = canvas.height / r.height;
  const x = Math.max(0, Math.min(canvas.width-1, Math.floor((e.clientX-r.left)*sx)));
  const y = Math.max(0, Math.min(canvas.height-1, Math.floor((e.clientY-r.top)*sy)));
  const d = ctx.getImageData(x, y, 1, 1).data;
  _cpColor = '#' + [d[0],d[1],d[2]].map(v=>v.toString(16).padStart(2,'0')).join('');
  const prev = document.getElementById('cpPreview');
  if (prev) prev.style.background = _cpColor;
}

function cpAddColor(e) {
  cpPickColor(e);
  addAccentFromPicker(_cpColor);
  const panel = document.getElementById('colorPickerPanel');
  if (panel) panel.style.display = 'none';
}

function previewAccentColor(v) { _cpColor = v; const p = document.getElementById('cpPreview'); if(p) p.style.background = v; }
function addAccentFromPicker(value) {
  if (!value || WS.accents.includes(value)) return;
  WS.accents.push(value);
  WS.saveAccents();
  renderAccentList();
  applyAccent(value);
}

function renderAccentList() {
  const list = document.getElementById('accentList');
  if (!list) return;
  list.innerHTML = WS.accents.map(c => `
    <div class="accent-chip-wrapper">
      <div class="accent-chip ${WS.currentAccent===c?'active':''}" 
           style="background:${c}" 
           data-color="${c}"
           onclick="applyAccent('${c}')"></div>
      <div class="accent-delete-btn" onclick="deleteAccent('${c}', event)">×</div>
    </div>`).join('');
  list.insertAdjacentHTML('beforeend', `
    <button class="btn-add-accent" id="accentAddBtn" onclick="triggerAddAccent()" title="강조색 추가">+</button><div id="colorPickerPanel" style="display:none;flex-basis:100%;background:var(--bg-card);border:1px solid var(--border-color);border-radius:14px;padding:12px;box-shadow:0 8px 32px rgba(0,0,0,0.2);margin-top:8px;max-width:220px"><canvas id="cpCanvas" width="186" height="130" style="border-radius:8px;cursor:crosshair;display:block;margin-bottom:8px;width:100%" onclick="cpPickColor(event)" ondblclick="cpAddColor(event)"></canvas><input type="range" id="cpHue" min="0" max="360" value="200" style="width:100%;margin-bottom:8px" oninput="cpUpdateHue(this.value)"><div style="display:flex;align-items:center;gap:8px"><div id="cpPreview" style="width:28px;height:28px;border-radius:50%;background:hsl(200,100%,50%);border:2px solid var(--border-color);flex-shrink:0"></div><span style="font-size:10px;color:var(--text-muted)">클릭: 선택 | 더블클릭: 추가</span></div></div>`);
}


/* ??? 議곗쭅 愿由??섏씠吏 (遺??吏곴툒/吏곸콉) ??? */
window._currentOrgTab = 'dept';

function switchOrgTab(tab, el) {
  window._currentOrgTab = tab;
  const parent = el.closest('.tab-bar');
  parent.querySelectorAll('.tab-item').forEach(item => item.classList.remove('active'));
  el.classList.add('active');
  renderPage_OrgMgmt();
}

function renderPage_OrgMgmt() {
  const el = document.getElementById('orgMgmtContent');
  if(!el) return;

  const tab = window._currentOrgTab;
  let title = '', desc = '', btnText = '', addFn = '';
  let list = [];

  if(tab === 'dept') {
    title = '遺??紐⑸줉'; desc = '議곗쭅???몃? 遺?쒕? ?뺤쓽?⑸땲??'; btnText = '遺??추가'; addFn = 'addOrgItem("dept")';
    list = WS.departments;
  } else if(tab === 'rank') {
    title = '吏곴툒 紐⑸줉'; desc = '吏곴툒 泥닿퀎? 沅뚰븳 ?덈꺼???뺤쓽?⑸땲??'; btnText = '吏곴툒 추가'; addFn = 'addOrgItem("rank")';
    list = WS.ranks;
  } else {
    title = '吏곸콉 紐⑸줉'; desc = '遺???댁뿉?쒖쓽 援ъ껜?곸씤 ??븷???뺤쓽?⑸땲??'; btnText = '吏곸콉 추가'; addFn = 'addOrgItem("pos")';
    list = WS.positions;
  }

  const items = list.map(item => `
    <div class="section-card" style="display:flex; justify-content:space-between; align-items:center; padding:16px 20px; margin-bottom:12px">
      <div>
        <div style="font-size:14px; font-weight:700; color:var(--text-primary)">${item.name}</div>
        ${tab === 'rank' ? `<div style="font-size:11px; color:var(--text-muted)">?덈꺼: ${item.level}</div>` : ''}
      </div>
      <div class="manage-actions">
        <button class="btn-icon-sm edit" onclick="editOrgItem('${tab}', ${item.id})"><i data-lucide="edit-2"></i></button>
        <button class="btn-icon-sm delete" onclick="deleteOrgItem('${tab}', ${item.id})"><i data-lucide="trash-2"></i></button>
      </div>
    </div>
  `).join('');

  el.innerHTML = `
    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px">
      <div>
        <h2 style="font-size:16px; font-weight:800">${title}</h2>
        <p style="font-size:12px; color:var(--text-muted)">${desc}</p>
      </div>
      <button class="btn btn-blue" onclick="${addFn}"><i data-lucide="plus"></i> ${btnText}</button>
    </div>
    <div style="display:grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap:16px">
      ${items || '<div class="empty-state">?곗씠?곌? 없습니다.</div>'}
    </div>
  `;
  refreshIcons();
}

function addOrgItem(type) {
  const name = prompt(`${type === 'dept' ? '부서' : type === 'rank' ? '직급' : '직책'} 이름을 입력하세요.`);
  if(!name) return;
  if(type === 'dept') WS.addDept(name);
  else if(type === 'rank') {
    const lv = prompt('레벨을 입력하세요 (숫자).', '1');
    WS.addRank(name, parseInt(lv) || 1);
  } else WS.addPos(name);
  renderPage_OrgMgmt();
  showToast('success', '추가되었습니다.');
}

function editOrgItem(type, id) {
  const list = type === 'dept' ? WS.departments : type === 'rank' ? WS.ranks : WS.positions;
  const item = list.find(x => x.id === id);
  if(!item) return;

  const newName = prompt('수정??이름??입력하세요', item.name);
  if(!newName) return;

  if(type === 'dept') WS.updateDept(id, newName);
  else if(type === 'rank') {
    const newLv = prompt('수정???덈꺼??입력하세요', item.level);
    WS.updateRank(id, newName, parseInt(newLv) || item.level);
  } else WS.updatePos(id, newName);

  renderPage_OrgMgmt();
  showToast('info', '수정되었습니다.');
}

function deleteOrgItem(type, id) {
  if(!confirm('?뺣쭚 삭제하시겠습니까? 愿???뺣낫媛 ?덈뒗 寃쎌슦 臾몄젣媛 諛쒖깮????됩니다.')) return;
  if(type === 'dept') WS.deleteDept(id);
  else if(type === 'rank') WS.deleteRank(id);
  else WS.deletePos(id);
  renderPage_OrgMgmt();
  showToast('info', '삭제되었습니다.');
}

/* ?? 吏곸썝 紐낅? 愿由??? */
function openStaffModal(id) {
  window._editingStaffId = id || null;
  const title = document.getElementById('staffModalTitle');
  const taskSection = document.getElementById('staffTasksSection');
  const taskContainer = document.getElementById('st_tasks_container');
  const addBtn = document.getElementById('st_add_task_btn');

  // ?꾨뱶 紐⑸줉
  const fields = ['name','dept','role','pos','phone','address','email','status','birthday','hiredAt','resignedAt','loginId','password','avatar','color','note'];

  // 초기화 梨꾩슦湲?  const deptSel = document.getElementById('st_dept');
  const roleSel = document.getElementById('st_role');
  const posSel = document.getElementById('st_pos');
  if(deptSel) deptSel.innerHTML = WS.departments.map(d=>`<option value="${d.name}">${d.name}</option>`).join('');
  if(roleSel) roleSel.innerHTML = WS.ranks.map(r=>`<option value="${r.name}">${r.name}</option>`).join('');
  if(posSel) posSel.innerHTML = WS.positions.map(p=>`<option value="${p.name}">${p.name}</option>`).join('');

  if(id) {
    title.textContent = '吏곸썝 ?뺣낫 상세';
    const u = WS.getUser(id);
    fields.forEach(f => {
      const el = document.getElementById('st_' + f);
      if(el) el.value = u[f] || '';
    });
    // ?좎쭨 ?꾨뱶 ?쇰꺼 초기화(而ㅼ뒪? ?쎌빱)
    ['birthday','hiredAt','resignedAt'].forEach(f => {
      const lbl = document.getElementById('st_' + f + '_label');
      if (lbl) lbl.textContent = _dpFormatLabel(u[f]) || '?좎쭨 ?좏깮';
    });
    // ?ъ쭊 誘몃━蹂닿린 蹂듭썝
    const prev = document.getElementById('st_photo_preview');
    if(prev) {
      if(u.photo) {
        prev.style.backgroundImage = `url(${u.photo})`;
        prev.style.backgroundSize = 'cover';
        prev.style.backgroundPosition = 'center';
        prev.innerHTML = '';
      } else {
        prev.style.backgroundImage = '';
        prev.innerHTML = '<i data-lucide="camera" style="width:28px;height:28px;color:var(--text-muted)"></i><span style="font-size:10px;color:var(--text-muted);margin-top:6px;text-align:center;line-height:1.3">사진<br>등록</span>';
        refreshIcons();
      }
    }

    // 담당 업무 목록 렌더링
    if(taskSection && taskContainer) {
      taskSection.style.display = 'block';
      const myTasks = WS.tasks.filter(t => {
        const _smIds = Array.isArray(t.assigneeIds) ? t.assigneeIds : (t.assigneeId ? [t.assigneeId] : []);
        return _smIds.includes(id);
      });
      taskContainer.innerHTML = myTasks.map(t => `<span class="task-badge" onclick="closeModalDirect('staffModal');openTaskDetail(${t.id})" style="cursor:pointer">${t.title}</span>`).join('') || '<div style="font-size:11px;color:var(--text-muted)">諛곗젙??업무媛 없습니다.</div>';
      
      // ??업무 諛곗젙 踰꾪듉 ?곕룞
      if(addBtn) {
        addBtn.onclick = () => {
          closeModalDirect('staffModal');
          openNewTaskModal(null, id);
        };
      }
    }
  } else {
    title.textContent = '직원 등록';
    fields.forEach(f => {
      const el = document.getElementById('st_' + f);
      if(el) el.value = (f==='color'?'#4f6ef7':(f==='status'?'재직':''));
    });
    // ?좎쭨 ?쇰꺼 초기화
    ['birthday','hiredAt','resignedAt'].forEach(f => {
      const lbl = document.getElementById('st_' + f + '_label');
      if (lbl) lbl.textContent = '날짜 미입력';
    });
    if(taskSection) taskSection.style.display = 'none';
    // ?ъ쭊 초기화
    const prev2 = document.getElementById('st_photo_preview');
    if(prev2) {
      prev2.style.backgroundImage = '';
      prev2.innerHTML = '<i data-lucide="camera" style="width:28px;height:28px;color:var(--text-muted)"></i><span style="font-size:10px;color:var(--text-muted);margin-top:6px;text-align:center;line-height:1.3">?ъ쭊<br>?깅줉</span>';
      refreshIcons();
    }
    // ?뚯씪 입력 초기화
    const fileInput = document.getElementById('st_photo_file');
    if(fileInput) fileInput.value = '';
  }
  openModal('staffModal');
  refreshIcons();
}

function saveStaff() {
  const name = document.getElementById('st_name').value.trim();
  if(!name) { showToast('error', '이름??입력하세요'); return; }
  
  const fields = ['name','role','dept','pos','phone','address','email','status','birthday','hiredAt','resignedAt','loginId','password','avatar','color','note'];
  const data = {};
  fields.forEach(f => {
    const el = document.getElementById('st_' + f);
    if(el) data[f] = el.value;
  });
  
  // ?ъ쭊 ?곗씠??(base64)
  data.photo = window._staffPhotoBase64 || (window._editingStaffId ? (WS.getUser(window._editingStaffId)?.photo || '') : '');
  
  if(!data.avatar) data.avatar = name.substring(0,2);

  if(window._editingStaffId) {
    WS.updateUser(window._editingStaffId, data);
    showToast('success', '吏곸썝 ?뺣낫媛 수정되었습니다.');
  } else {
    WS.addUser(data);
    showToast('success', '??吏곸썝???깅줉되었습니다.');
  }
  
  closeModalDirect('staffModal');
  window._staffPhotoBase64 = null;
  renderPage_StaffMgmt();
  renderPage_Tasks();
  initHeader();
}

/* ?? ?ъ쭊 ?낅줈??泥섎━ ?? */
function handleStaffPhotoUpload(input) {
  const file = input.files[0];
  if (!file) return;
  if (file.size > 5 * 1024 * 1024) {
    showToast('warn', '5MB ?댄븯 ?대?吏留??깅줉 媛?ν빀?덈떎.');
    return;
  }
  const reader = new FileReader();
  reader.onload = function(e) {
    const base64 = e.target.result;
    window._staffPhotoBase64 = base64;
    // 誘몃━蹂닿린
    const prev = document.getElementById('st_photo_preview');
    if (prev) {
      prev.style.backgroundImage = `url(${base64})`;
      prev.style.backgroundSize = 'cover';
      prev.style.backgroundPosition = 'center';
      prev.innerHTML = '';
    }
  };
  reader.readAsDataURL(file);
}

function deleteStaff(id) {
  if(id === WS.currentUser?.id) {
    showToast('error', '?먭린 ?먯떊? 삭제????없습니다.');
    return;
  }
  if(!confirm('?뺣쭚 ??吏곸썝??紐낅??먯꽌 삭제하시겠습니까?\n담당 以묒씤 업무??담당자誘몄???상태媛 ?⑸땲??')) return;
  WS.deleteUser(id);
  renderPage_StaffMgmt();
  renderPage_Tasks();
  showToast('info', '吏곸썝??삭제되었습니다.');
}

/* ?? 蹂몄궗?뺣낫 ?섏씠吏 ?? */
function renderPage_HQInfo() {
  const info = WS.hqInfo;
  const container = document.getElementById('hqInfoContent');
  if(!container) return;
  container.innerHTML = `
    <div class="card" style="max-width:800px; margin:20px auto">
      <div class="card-body">
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">?뚯궗紐?/label>
            <input type="text" class="form-input" id="hq_name" value="${info.name}">
          </div>
          <div class="form-group">
            <label class="form-label">??쒖옄紐?/label>
            <input type="text" class="form-input" id="hq_ceo" value="${info.ceo}">
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">?ъ뾽?먮벑濡앸쾲??/label>
            <input type="text" class="form-input" id="hq_businessNum" value="${info.businessNum}">
          </div>
          <div class="form-group">
            <label class="form-label">??쒖쟾??/label>
            <input type="text" class="form-input" id="hq_phone" value="${info.phone}">
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">?대찓??/label>
          <input type="email" class="form-input" id="hq_email" value="${info.email}">
        </div>
        <div class="form-group">
          <label class="form-label">蹂몄궗 二쇱냼</label>
          <input type="text" class="form-input" id="hq_address" value="${info.address}">
        </div>
        <div class="form-group" style="margin-bottom:0">
          <label class="form-label">濡쒓퀬 ?띿뒪??(?ъ씠?쒕컮 ?쒖떆)</label>
          <input type="text" class="form-input" id="hq_logoText" value="${info.logoText}">
        </div>
      </div>
    </div>
  `;
}

function saveHQInfo() {
  WS.hqInfo = {
    name: document.getElementById('hq_name').value,
    ceo: document.getElementById('hq_ceo').value,
    businessNum: document.getElementById('hq_businessNum').value,
    phone: document.getElementById('hq_phone').value,
    email: document.getElementById('hq_email').value,
    address: document.getElementById('hq_address').value,
    logoText: document.getElementById('hq_logoText').value,
  };
  WS.saveHQInfo();
  showToast('success', '<i data-lucide="check-circle"></i> 蹂몄궗 ?뺣낫媛 ??λ릺됩니다.');
  // 濡쒓퀬 ?띿뒪???ㅼ떆媛?반영
  document.querySelector('.logo-text').textContent = WS.hqInfo.logoText;
}

/* ?? 吏곴툒愿由??섏씠吏 ?? */
function renderPage_RankMgmt() {
  const ranks = WS.ranks;
  const container = document.getElementById('rankMgmtContent');
  if(!container) return;
  container.innerHTML = `
    <div class="card" style="margin-top:20px">
      <table class="table">
        <thead>
          <tr>
            <th style="width:100px">?쒖쐞(Level)</th>
            <th>吏곴툒紐?/th>
            <th>?쎌묶</th>
            <th style="width:80px; text-align:center">愿由?/th>
          </tr>
        </thead>
        <tbody>
          ${ranks.sort((a,b)=>b.level-a.level).map(r => `
            <tr>
              <td><span class="badge badge-outline" style="color:var(--accent-blue); border-color:var(--accent-blue)">Lv.${r.level}</span></td>
              <td><strong>${r.name}</strong></td>
              <td><span style="color:var(--text-muted)">${r.short || r.name[0]}</span></td>
              <td style="text-align:center">
                <button class="btn-icon text-red" onclick="deleteRank(${r.id})"><i data-lucide="trash-2"></i></button>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
      ${ranks.length === 0 ? '<div style="padding:40px; text-align:center; color:var(--text-muted)">?깅줉??吏곴툒??없습니다.</div>' : ''}
    </div>
  `;
  refreshIcons();
}

function addRank() {
  const name = prompt('?덈줈??吏곴툒紐낆쓣 입력하세요');
  if(!name) return;
  const level = prompt('吏곴툒 ?덈꺼(?レ옄)??입력하세요(?? 1=?ъ썝, 5=???:', '1');
  if(!level) return;
  
  WS.ranks.push({
    id: Date.now(),
    name: name,
    level: parseInt(level),
    short: name.substring(0, 2)
  });
  WS.saveRanks();
  renderPage_RankMgmt();
  showToast('success', `<i data-lucide="plus-circle"></i> ${name} 吏곴툒??추가되었습니다.`);
}

function deleteRank(id) {
  if(!confirm('?뺣쭚 삭제하시겠습니까?')) return;
  WS.ranks = WS.ranks.filter(r => r.id !== id);
  WS.saveRanks();
  renderPage_RankMgmt();
  showToast('info', '吏곴툒??삭제되었습니다.');
}

/* ?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧
   異쒗눜洹?위젯
?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧 */
function renderAttendancePill() {
  if (!WS.currentUser) return;
  const pill   = document.getElementById('attendancePill');
  const inEl   = document.getElementById('attCheckInTime');
  const outEl  = document.getElementById('attCheckOutTime');
  const btnIcon= document.getElementById('attBtnIcon');
  const btn    = document.getElementById('attBtn');
  if (!pill) return;

  const rec = WS.getTodayAttendance(WS.currentUser.id);
  const accent = WS.currentAccent || '#4f6ef7';

  if (!rec || !rec.checkIn) {
    // 미출근 상태
    inEl.textContent  = '--:--';
    outEl.textContent = '--:--';
    btnIcon.textContent = '근무전';
    if (btn) { btn.onclick = null; btn.style.cursor = 'default'; btn.style.background = 'rgba(255,255,255,0.18)'; btn.style.borderColor = 'rgba(255,255,255,0.35)'; btn.style.color = '#fff'; }

