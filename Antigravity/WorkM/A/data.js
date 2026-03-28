// ============================================================
//  WorkM - 공용 데이터 & 상태 관리
// ============================================================

const WS = {
  // ── 현재 사용자 ──
  currentUser: null,

  // ── 본사 정보 ──
  hqInfo: JSON.parse(localStorage.getItem('ws_hq_info')) || {
    name: 'WorkM Headquarters',
    ceo: '김지훈',
    businessNum: '123-45-67890',
    phone: '02-1234-5678',
    email: 'contact@workm.kr',
    address: '서울시 강남구 테헤란로 123, 워크타워 15층',
    logoText: 'WorkM'
  },

  // ── 부서 관리 ──
  departments: JSON.parse(localStorage.getItem('ws_departments')) || [
    { id: 1, name: '개발팀' },
    { id: 2, name: '기획팀' },
    { id: 3, name: '디자인팀' },
    { id: 4, name: '마케팅팀' },
    { id: 5, name: '경영지원팀' }
  ],

  // ── 직급 관리 ──
  ranks: JSON.parse(localStorage.getItem('ws_ranks')) || [
    { id: 1, name: '사원', level: 1 },
    { id: 2, name: '주임', level: 2 },
    { id: 3, name: '대리', level: 3 },
    { id: 4, name: '과장', level: 4 },
    { id: 5, name: '차장', level: 5 },
    { id: 6, name: '부장', level: 6 },
    { id: 7, name: '이사', level: 7 },
  ],

  // ── 직책 관리 ──
  positions: JSON.parse(localStorage.getItem('ws_positions')) || [
    { id: 1, name: '팀원' },
    { id: 2, name: '팀장' },
    { id: 3, name: '파트장' },
    { id: 4, name: '실장' },
    { id: 5, name: '본부장' },
    { id: 6, name: 'CEO' },
  ],

  // ══ 조직 관리 CRUD ══

  /* ── 부서 ── */
  saveDepartments()  { localStorage.setItem('ws_departments', JSON.stringify(this.departments)); },
  addDepartment(name) {
    const id = (Math.max(0, ...this.departments.map(d=>d.id)) + 1);
    this.departments.push({ id, name: name.trim() });
    this.saveDepartments();
    return id;
  },
  updateDepartment(id, name) {
    const d = this.departments.find(d=>d.id===id);
    if(d) { d.name = name.trim(); this.saveDepartments(); }
  },
  deleteDepartment(id) {
    this.departments = this.departments.filter(d=>d.id!==id);
    this.saveDepartments();
  },

  /* ── 직급 ── */
  saveRanks()  { localStorage.setItem('ws_ranks', JSON.stringify(this.ranks)); },
  addRank(name) {
    const id = (Math.max(0, ...this.ranks.map(r=>r.id)) + 1);
    const level = this.ranks.length + 1;
    this.ranks.push({ id, name: name.trim(), level });
    this.saveRanks();
    return id;
  },
  updateRank(id, name) {
    const r = this.ranks.find(r=>r.id===id);
    if(r) { r.name = name.trim(); this.saveRanks(); }
  },
  deleteRank(id) {
    this.ranks = this.ranks.filter(r=>r.id!==id);
    // level 재정렬
    this.ranks.forEach((r,i) => r.level = i+1);
    this.saveRanks();
  },

  /* ── 직책 ── */
  savePositions()  { localStorage.setItem('ws_positions', JSON.stringify(this.positions)); },
  addPosition(name) {
    const id = (Math.max(0, ...this.positions.map(p=>p.id)) + 1);
    this.positions.push({ id, name: name.trim() });
    this.savePositions();
    return id;
  },
  updatePosition(id, name) {
    const p = this.positions.find(p=>p.id===id);
    if(p) { p.name = name.trim(); this.savePositions(); }
  },
  deletePosition(id) {
    this.positions = this.positions.filter(p=>p.id!==id);
    this.savePositions();
  },

  // ── 강조색 관리 ──
  accents: JSON.parse(localStorage.getItem('ws_accents')) || [
    '#4f6ef7','#9747ff','#06b6d4','#22c55e','#f59e0b','#6b7280','#ef4444'
  ],
  currentAccent: localStorage.getItem('ws_current_accent') || '#4f6ef7',
  saveAccents() { localStorage.setItem('ws_accents', JSON.stringify(this.accents)); },

  // ── 업무결과 관리 ──
  taskResults: JSON.parse(localStorage.getItem('ws_task_results')) || [
    { id:1, name:'미완료', icon:'❌' },
    { id:2, name:'진행중', icon:'🔄' },
    { id:3, name:'부분완료', icon:'🔶' },
    { id:4, name:'완료',   icon:'✅' },
    { id:5, name:'보류',   icon:'⏸' },
  ],
  saveTaskResults() { localStorage.setItem('ws_task_results', JSON.stringify(this.taskResults)); },
  addTaskResult(name, icon = '') {
    const id = (Math.max(0, ...this.taskResults.map(r => r.id)) + 1);
    this.taskResults.push({ id, name: name.trim(), icon });
    this.saveTaskResults();
    return id;
  },
  updateTaskResult(id, name, icon) {
    const item = this.taskResults.find(r => r.id === id);
    if(item) { item.name = name.trim(); if(icon !== undefined) item.icon = icon; this.saveTaskResults(); }
  },
  deleteTaskResult(id) {
    this.taskResults = this.taskResults.filter(r => r.id !== id);
    this.saveTaskResults();
  },

  users: JSON.parse(localStorage.getItem('ws_users')) || [
    { id:1, name:'김지훈', role:'팀장', dept:'개발팀', avatar:'KJ', color:'#4f6ef7', email:'kim@workm.kr', phone:'010-1234-5678', birthday:'1985-05-12', hiredAt:'2020-01-01', resignedAt:null, address:'서울시 강남구 테헤란로 123', loginId:'admin', password:'password123', status:'근무(퇴근)', note:'팀 총괄 관리자', photo:'' },
    { id:2, name:'이수진', role:'선임', dept:'개발팀', avatar:'LS', color:'#9747ff', email:'lee@workm.kr', phone:'010-2345-6789', birthday:'1990-08-22', hiredAt:'2021-03-15', resignedAt:null, address:'경기도 성남시 분당구 판교역로 456', loginId:'lee01', password:'password123', status:'근무', note:'Frontend 개발 리드', photo:'' },
    { id:3, name:'박민준', role:'주임', dept:'기획팀', avatar:'PM', color:'#06b6d4', email:'park@workm.kr', phone:'010-3456-7890', birthday:'1992-11-05', hiredAt:'2022-07-01', resignedAt:null, address:'서울시 마포구 독막로 789', loginId:'park02', password:'password123', status:'근무(출장)', note:'신규 서비스 기획 담당', photo:'' },
    { id:4, name:'최유리', role:'대리', dept:'디자인팀', avatar:'CY', color:'#f59e0b', email:'choi@workm.kr', phone:'010-4567-8901', birthday:'1991-02-14', hiredAt:'2021-11-10', resignedAt:null, address:'서울시 송파구 올림픽로 321', loginId:'choi03', password:'password123', status:'근무(휴가)', note:'UI/UX 디자인 총괄', photo:'' },
    { id:5, name:'정현수', role:'팀장', dept:'마케팅팀', avatar:'JH', color:'#22c55e', email:'jung@workm.kr', phone:'010-5678-9012', birthday:'1986-09-30', hiredAt:'2020-05-20', resignedAt:null, address:'안양시 동안구 시민대로 654', loginId:'jung04', password:'password123', status:'휴직', note:'육아휴직 중 (복귀 예정)', photo:'' },
    { id:6, name:'한소영', role:'선임', dept:'마케팅팀', avatar:'HS', color:'#ef4444', email:'han@workm.kr', phone:'010-6789-0123', birthday:'1989-12-25', hiredAt:'2021-06-01', resignedAt:null, address:'서울시 강서구 가양대로 987', loginId:'han05', password:'password123', status:'근무', note:'콘텐츠 마케팅 담당', photo:'' },
  ],

  // ── 샘플 업무 데이터 (로컬 스토리지 연동) ──
  tasks: JSON.parse(localStorage.getItem('ws_tasks')) || [
    {
      id:1, title:'신규 전체현황 UI 개발', 
      desc:'메인 전체현황 화면을 React로 재개발. 반응형 레이아웃 적용 필요.',
      assignerId:1, assigneeId:2, 
      status:'progress', priority:'high',
      progress:65, dueDate:'2026-03-25',
      createdAt:'2026-03-10', startedAt:'2026-03-11',
      isImportant:true, team:'개발팀',
      score: 15, spentTime: '12h', reportContent: 'React 컴포넌트 구조 설계 및 API 연동 준비 완료', hasAttachment: true,
      parentId: null,
      history:[
        { date:'2026-03-10', event:'업무 지시', detail:'김지훈 → 이수진', icon:'clipboard-list', color:'#4f6ef7' },
        { date:'2026-03-11', event:'업무 시작', detail:'진행중으로 상태 변경', icon:'play-circle', color:'#06b6d4' },
        { date:'2026-03-18', event:'진척 50%', detail:'기본 컴포넌트 구현 완료', icon:'zap', color:'#f59e0b' },
        { date:'2026-03-22', event:'진척 65%', detail:'API 연동 작업 진행 중', icon:'wrench', color:'#9747ff' },
      ]
    },
    {
      id:2, title:'Q1 마케팅 기획서 작성',
      desc:'2026년 1분기 SNS 캠페인 기획서 작성 및 예산 편성.',
      assignerId:5, assigneeId:6,
      status:'delay', priority:'high',
      progress:30, dueDate:'2026-03-24',
      createdAt:'2026-03-05', startedAt:'2026-03-06',
      isImportant:true, team:'마케팅팀',
      score: 10, spentTime: '8h', reportContent: '1분기 SNS 타겟 분석 및 예산안 초안 작성', hasAttachment: false,
      parentId: null,
      history:[
        { date:'2026-03-05', event:'업무 지시', detail:'정현수 → 한소영', icon:'clipboard-list', color:'#4f6ef7' },
        { date:'2026-03-06', event:'업무 시작', detail:'자료 수집 시작', icon:'play-circle', color:'#06b6d4' },
        { date:'2026-03-15', event:'지연 발생', detail:'외부 데이터 수급 지연', icon:'alert-triangle', color:'#ef4444' },
        { date:'2026-03-20', event:'진척 30%', detail:'기본 구조 작성 완료', icon:'file-text', color:'#f59e0b' },
      ]
    },
    {
      id:3, title:'서버 API 성능 최적화',
      desc:'응답속도 50% 개선 목표. 캐시 레이어 도입 및 쿼리 튜닝.',
      assignerId:1, assigneeId:3,
      status:'progress', priority:'medium',
      progress:80, dueDate:'2026-03-30',
      createdAt:'2026-03-12', startedAt:'2026-03-13',
      isImportant:false, team:'개발팀',
      score: 20, spentTime: '15h', reportContent: 'DB 인덱스 최적화 및 레디스 캐시 적용 완료', hasAttachment: true,
      parentId: null,
      history:[
        { date:'2026-03-12', event:'업무 지시', detail:'김지훈 → 박민준', icon:'clipboard-list', color:'#4f6ef7' },
        { date:'2026-03-13', event:'업무 시작', detail:'성능 프로파일링 시작', icon:'play-circle', color:'#06b6d4' },
        { date:'2026-03-19', event:'진척 60%', detail:'캐시 서버 구축 완료', icon:'zap', color:'#22c55e' },
        { date:'2026-03-23', event:'진척 80%', detail:'쿼리 최적화 작업 중', icon:'wrench', color:'#9747ff' },
      ]
    },
    {
      id:4, title:'UX 사용성 개선 리포트',
      desc:'사용자 인터뷰 5건 진행 후 개선 포인트 정리 및 보고.',
      assignerId:1, assigneeId:4,
      status:'waiting', priority:'low',
      progress:0, dueDate:'2026-04-05',
      createdAt:'2026-03-20', startedAt:null,
      isImportant:false, team:'디자인팀',
      score: 5, spentTime: '0h', reportContent: '인터뷰 대상자 섭외 진행 중', hasAttachment: false,
      parentId: null,
      history:[
        { date:'2026-03-20', event:'업무 지시', detail:'김지훈 → 최유리', icon:'clipboard-list', color:'#4f6ef7' },
      ]
    },
    {
      id:5, title:'월간 실적 보고서',
      desc:'2026년 2월 팀별 KPI 달성률 취합 및 경영진 보고 자료 작성.',
      assignerId:5, assigneeId:1,
      status:'progress', priority:'high',
      progress:45, dueDate:'2026-03-24',
      createdAt:'2026-03-18', startedAt:'2026-03-19',
      isImportant:true, team:'개발팀',
      score: 12, spentTime: '5h', reportContent: '2월 실적 데이터 추출 및 분석 보고서 작성 중', hasAttachment: true,
      parentId: null,
      history:[
        { date:'2026-03-18', event:'업무 지시', detail:'정현수 → 김지훈', icon:'clipboard-list', color:'#4f6ef7' },
        { date:'2026-03-19', event:'업무 시작', detail:'데이터 수집 시작', icon:'play-circle', color:'#06b6d4' },
        { date:'2026-03-22', event:'진척 45%', detail:'개발팀 데이터 취합 완료', icon:'bar-chart-3', color:'#f59e0b' },
      ]
    },
    {
      id:6, title:'고객 피드백 DB 정리',
      desc:'작년 하반기 CS 문의 내용 카테고리화 및 인사이트 도출.',
      assignerId:1, assigneeId:2,
      status:'done', priority:'low',
      progress:100, dueDate:'2026-03-20',
      createdAt:'2026-03-14', startedAt:'2026-03-15',
      isImportant:false, team:'개발팀',
      score: 8, spentTime: '10h', reportContent: 'CS 피드백 DB 마이그레이션 및 정제 완료', hasAttachment: false,
      parentId: null,
      history:[
        { date:'2026-03-14', event:'업무 지시', detail:'김지훈 → 이수진', icon:'clipboard-list', color:'#4f6ef7' },
        { date:'2026-03-15', event:'업무 시작', detail:'DB 접근 권한 확인', icon:'play-circle', color:'#06b6d4' },
        { date:'2026-03-19', event:'완료', detail:'보고서 공유 완료', icon:'check-circle-2', color:'#22c55e' },
      ]
    },
    {
      id:7, title:'랜딩페이지 리뉴얼',
      desc:'신규 브랜드 아이덴티티 기반으로 홈페이지 전면 재설계.',
      assignerId:5, assigneeId:4,
      status:'progress', priority:'medium',
      progress:55, dueDate:'2026-04-10',
      createdAt:'2026-03-15', startedAt:'2026-03-16',
      isImportant:true, team:'디자인팀',
      score: 18, spentTime: '20h', reportContent: '메인 비주얼 디자인 및 색상 가이드 확정', hasAttachment: true,
      parentId: null,
      history:[
        { date:'2026-03-15', event:'업무 지시', detail:'정현수 → 최유리', icon:'clipboard-list', color:'#4f6ef7' },
        { date:'2026-03-16', event:'업무 시작', detail:'디자인 시안 작업 시작', icon:'play-circle', color:'#06b6d4' },
        { date:'2026-03-22', event:'진척 55%', detail:'메인 페이지 디자인 완료', icon:'palette', color:'#9747ff' },
      ]
    },
    {
      id:8, title:'보안 취약점 점검',
      desc:'정기 보안 감사. OWASP Top 10 기준 전수 점검.',
      assignerId:1, assigneeId:3,
      status:'waiting', priority:'high',
      progress:0, dueDate:'2026-03-28',
      createdAt:'2026-03-22', startedAt:null,
      isImportant:true, team:'개발팀',
      score: 15, spentTime: '0h', reportContent: '취약점 진단 점검 항목 리스트 작성 중', hasAttachment: false,
      parentId: null,
      history:[
        { date:'2026-03-22', event:'업무 지시', detail:'김지훈 → 박민준', icon:'clipboard-list', color:'#4f6ef7' },
      ]
    },
  ],

  // ── 알림 목록 ──
  notifications: [
    { id:1, type:'delay', msg:'Q1 마케팅 기획서 - 오늘까지!', time:'방금 전', read:false },
    { id:2, type:'new', msg:'새 업무 지시: 보안 취약점 점검', time:'2시간 전', read:false },
    { id:3, type:'progress', msg:'이수진 - 전체현황 UI 65% 달성', time:'4시간 전', read:false },
    { id:4, type:'done', msg:'고객 피드백 DB 정리 완료됨', time:'1일 전', read:true },
    { id:5, type:'info', msg:'월간 실적 보고서 마감 D-1', time:'1일 전', read:true },
  ],

  // ── 메시지 목록 (로컬 스토리지 연동) ──
  messages: JSON.parse(localStorage.getItem('ws_messages')) || [
    { id: 1, senderId: 2, text: '팀장님, 신규 UI 시안 확인 부탁드립니다!', time: '10:25 AM' },
    { id: 2, senderId: 1, text: '네, 지금 바로 확인해볼게요. 고생 많으셨어요!', time: '10:30 AM' },
    { id: 3, senderId: 3, text: '서버 최적화 작업 80% 완료되었습니다. 오후에 배포 가능할 것 같아요.', time: '11:15 AM' },
    { id: 4, senderId: 4, text: '디자인 가이드 수정본 공유해두었습니다. 참고바랍니다.', time: '01:45 PM' }
  ],

  // ── 출퇴근 기록 ──
  attendance: { checkedIn: false, checkInTime: null, checkOutTime: null },

  // ── 유틸 함수 ──
  getUser(id){ return this.users.find(u => u.id === id); },
  getTask(id){ return this.tasks.find(t => t.id === id); },

  getDday(dueDate){
    const due = new Date(dueDate);
    due.setHours(23,59,59,0);
    const now = new Date();
    const diff = Math.ceil((due - now) / (1000*60*60*24));
    return diff;
  },

  getDdayBadge(dueDate){
    const d = this.getDday(dueDate);
    if(d < 0) return { cls:'dday-today', label:`D+${Math.abs(d)} 지연` };
    if(d === 0) return { cls:'dday-today', label:'D-DAY' };
    if(d <= 2) return { cls:'dday-urgent', label:`D-${d}` };
    if(d <= 7) return { cls:'dday-soon', label:`D-${d}` };
    if(d <= 14) return { cls:'dday-normal', label:`D-${d}` };
    return { cls:'dday-ok', label:`D-${d}` };
  },

  getStatusLabel(s){
    return { waiting:'대기', progress:'진행중', delay:'지연', done:'완료' }[s] || s;
  },

  getPriorityLabel(p){
    return { high:'긴급', medium:'중간', low:'낮음' }[p] || p;
  },

  formatDate(d){
    if(!d) return '-';
    const dt = new Date(d);
    return `${dt.getMonth()+1}/${dt.getDate()}`;
  },

  // 내가 지시한 업무
  getAssignedByMe(){
    if(!this.currentUser) return [];
    return this.tasks.filter(t => t.assignerId === this.currentUser.id);
  },

  // 내가 받은 업무
  getAssignedToMe(){
    if(!this.currentUser) return [];
    return this.tasks.filter(t => t.assigneeId === this.currentUser.id);
  },

  // 오늘 완료해야 할 업무
  getTodayTasks(){
    if(!this.currentUser) return [];
    return this.tasks.filter(t => {
      const d = this.getDday(t.dueDate);
      return d <= 0 && t.status !== 'done' && t.assigneeId === this.currentUser.id;
    });
  },

  // 마감일 기준 정렬
  getSortedByDue(){
    return [...this.tasks]
      .filter(t => t.status !== 'done')
      .sort((a,b) => new Date(a.dueDate) - new Date(b.dueDate));
  },

  // 상태 변경
  changeTaskStatus(taskId, newStatus){
    const t = this.getTask(taskId);
    if(!t) return;
    const now = new Date().toISOString().split('T')[0];
    t.status = newStatus;
    const label = this.getStatusLabel(newStatus);
    t.history.push({ date:now, event:`상태 변경: ${label}`, detail:'사용자 직접 변경', icon:'refresh-cw', color:'#06b6d4' });
    if(newStatus === 'done') t.progress = 100;
    this.saveTasks();
  },

  // 진척률 변경
  changeProgress(taskId, pct){
    const t = this.getTask(taskId);
    if(!t) return;
    t.progress = pct;
    const now = new Date().toISOString().split('T')[0];
    t.history.push({ date:now, event:`진척률 ${pct}%`, detail:'직접 업데이트', icon:'trending-up', color:'#22c55e' });
    this.saveTasks();
  },

  saveTasks(){
    localStorage.setItem('ws_tasks', JSON.stringify(this.tasks));
  },

  unreadCount(){
    return this.notifications.filter(n => !n.read).length;
  },

  // ── 사용자 관리 ──
  saveUsers(){
    localStorage.setItem('ws_users', JSON.stringify(this.users));
  },
  addUser(u){
    u.id = Date.now();
    this.users.push(u);
    this.saveUsers();
  },
  updateUser(id, data){
    const idx = this.users.findIndex(u=>u.id===id);
    if(idx!==-1) {
      this.users[idx] = { ...this.users[idx], ...data };
      this.saveUsers();
    }
  },
  deleteUser(id){
    this.users = this.users.filter(u=>u.id!==id);
    this.saveUsers();
    // 해당 사용자가 담당인 업무 처리 (null 처리 등)
    this.tasks.forEach(t=>{ if(t.assigneeId===id) t.assigneeId=null; });
  },

  // ── 강조색 관리 ──
  accents: JSON.parse(localStorage.getItem('ws_accents')) || ['#4f6ef7', '#9747ff', '#06b6d4', '#22c55e', '#f59e0b', '#ef4444'],
  currentAccent: localStorage.getItem('ws_current_accent') || '#4f6ef7',

  addAccent(color){
    if(this.accents.includes(color)) return false;
    this.accents.push(color);
    this.saveAccents();
    return true;
  },
  removeAccent(color){
    this.accents = this.accents.filter(a => a !== color);
    this.saveAccents();
  },
  saveAccents(){
    localStorage.setItem('ws_accents', JSON.stringify(this.accents));
  },
  applyAccent(color){
    this.currentAccent = color;
    localStorage.setItem('ws_current_accent', color);
    document.documentElement.style.setProperty('--accent-blue', color);
    // 보조 색상 (연한 배경 등) 자동 계산 (단순화)
    document.documentElement.style.setProperty('--accent-blue-light', color + '22'); 
  },

  saveHQInfo(){
    localStorage.setItem('ws_hq_info', JSON.stringify(this.hqInfo));
  },
  saveRanks(){ localStorage.setItem('ws_ranks', JSON.stringify(this.ranks)); },
  saveDepts(){ localStorage.setItem('ws_departments', JSON.stringify(this.departments)); },
  savePos(){ localStorage.setItem('ws_positions', JSON.stringify(this.positions)); },
  
  // CRUD - 부서
  addDept(name){ this.departments.push({ id:Date.now(), name }); this.saveDepts(); },
  updateDept(id, name){ const d=this.departments.find(x=>x.id===id); if(d) d.name=name; this.saveDepts(); },
  deleteDept(id){ this.departments=this.departments.filter(x=>x.id!==id); this.saveDepts(); },

  // CRUD - 직급
  addRank(name, level){ this.ranks.push({ id:Date.now(), name, level }); this.saveRanks(); },
  updateRank(id, name, level){ const r=this.ranks.find(x=>x.id===id); if(r){ r.name=name; r.level=level; } this.saveRanks(); },
  deleteRank(id){ this.ranks=this.ranks.filter(x=>x.id!==id); this.saveRanks(); },

  // CRUD - 직책
  addPos(name){ this.positions.push({ id:Date.now(), name }); this.savePos(); },
  updatePos(id, name){ const p=this.positions.find(x=>x.id===id); if(p) p.name=name; this.savePos(); },
  deletePos(id){ this.positions=this.positions.filter(x=>x.id!==id); this.savePos(); },

  // ── 출퇴근 기록  { userId: { "YYYY-MM-DD": { checkIn: "HH:MM", checkOut: "HH:MM" } } }
  get attendance() {
    return JSON.parse(localStorage.getItem('ws_attendance')) || {};
  },

  // 오늘 날짜 키 반환
  _todayKey() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  },

  // 오늘 이 사용자의 출퇴근 기록 가져오기
  getTodayAttendance(userId) {
    const all = this.attendance;
    const uid = String(userId);
    return (all[uid] && all[uid][this._todayKey()]) || null;
  },

  // 출근 기록
  checkIn(userId) {
    const all = this.attendance;
    const uid = String(userId);
    const today = this._todayKey();
    if (!all[uid]) all[uid] = {};
    const now = new Date();
    const hhmm = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
    const ampm = now.getHours() < 12 ? '오전' : '오후';
    const hh12 = now.getHours() % 12 || 12;
    const timeStr = `${ampm} ${String(hh12).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
    if (!all[uid][today]) all[uid][today] = {};
    // 출근 시간이 이미 기록되어 있으면 덮어쓰지 않음 (당일 최초 기록 고정)
    if (all[uid][today].checkIn) return;
    all[uid][today].checkIn = timeStr;
    all[uid][today].checkInRaw = hhmm;
    localStorage.setItem('ws_attendance', JSON.stringify(all));
  },

  // 퇴근 기록
  checkOut(userId) {
    const all = this.attendance;
    const uid = String(userId);
    const today = this._todayKey();
    if (!all[uid] || !all[uid][today]) return;
    const now = new Date();
    const ampm = now.getHours() < 12 ? '오전' : '오후';
    const hh12 = now.getHours() % 12 || 12;
    const timeStr = `${ampm} ${String(hh12).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
    all[uid][today].checkOut = timeStr;
    localStorage.setItem('ws_attendance', JSON.stringify(all));
  },

  saveMessages(){

    localStorage.setItem('ws_messages', JSON.stringify(this.messages));
  },
  addMessage(text){
    if(!this.currentUser) return;
    const now = new Date();
    const time = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
    this.messages.push({
      id: Date.now(),
      senderId: this.currentUser.id,
      text: text,
      time: time
    });
    this.saveMessages();
  }
};

// 로컬스토리지에서 테마 및 강조색 복원
document.addEventListener('DOMContentLoaded', () => {
  const theme = localStorage.getItem('ws_theme') || 'light';
  document.documentElement.setAttribute('data-theme', theme);
  const accent = localStorage.getItem('ws_current_accent') || '#4f6ef7';
  document.documentElement.style.setProperty('--accent-blue', accent);
  document.documentElement.style.setProperty('--accent-blue-light', accent + '22');
});
