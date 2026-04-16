/* ══════════════════════════════════════════════
   기존 앱과 동일한 샘플 데이터 시드
   ══════════════════════════════════════════════ */
import { getItem, setItem } from './storage'

const SEED_VERSION = 'v3'

export function seedIfEmpty() {
  // 이미 시드된 경우 스킵
  if (getItem<string>('ws_seed_version', '') === SEED_VERSION) return

  // ── 부서 ──
  if (!getItem('ws_departments', null)) {
    setItem('ws_departments', [
      { id: 1, name: '개발팀' },
      { id: 2, name: '마케팅팀' },
      { id: 3, name: '디자인팀' },
      { id: 4, name: '영업팀' },
      { id: 5, name: '경영지원팀' },
    ])
  }

  // ── 직급 ──
  if (!getItem('ws_ranks', null)) {
    setItem('ws_ranks', [
      { id: 1, name: '인턴', level: 1 },
      { id: 2, name: '사원', level: 2 },
      { id: 3, name: '주임', level: 3 },
      { id: 4, name: '대리', level: 4 },
      { id: 5, name: '과장', level: 5 },
      { id: 6, name: '차장', level: 6 },
      { id: 7, name: '팀장', level: 7 },
      { id: 8, name: '부장', level: 8 },
      { id: 9, name: '이사', level: 9 },
      { id: 10, name: '대표', level: 10 },
    ])
  }

  // ── 직책 ──
  if (!getItem('ws_positions', null)) {
    setItem('ws_positions', [
      { id: 1, name: '팀원' },
      { id: 2, name: '팀장' },
      { id: 3, name: '프로젝트매니저' },
      { id: 4, name: '선임' },
      { id: 5, name: '수석' },
      { id: 6, name: 'CEO' },
    ])
  }

  // ── 업무결과 ──
  if (!getItem('ws_task_results', null)) {
    setItem('ws_task_results', [
      { id: 1, name: '정상완료', icon: 'check-circle-2', color: '#22c55e' },
      { id: 2, name: '진행중', icon: 'activity', color: '#06b6d4' },
      { id: 3, name: '부분완료', icon: 'circle-dot', color: '#f59e0b' },
      { id: 4, name: '보류', icon: 'pause-circle', color: '#9ca3af' },
      { id: 5, name: '취소', icon: 'x-circle', color: '#ef4444' },
    ])
  }

  // ── 진행보고 유형 ──
  if (!getItem('ws_report_types', null)) {
    setItem('ws_report_types', [
      { id: 1, label: '업무시작', icon: 'play-circle', color: '#4f6ef7' },
      { id: 2, label: '시장조사', icon: 'search', color: '#06b6d4' },
      { id: 3, label: '작업중', icon: 'wrench', color: '#9747ff' },
      { id: 4, label: '작업완료', icon: 'check-circle', color: '#22c55e' },
      { id: 5, label: '협의완료', icon: 'message-circle', color: '#f59e0b' },
      { id: 6, label: '이슈발생', icon: 'alert-triangle', color: '#ef4444' },
      { id: 7, label: '업무취소', icon: 'x-circle', color: '#6b7280' },
      { id: 8, label: '보고서작성', icon: 'file-text', color: '#8b5cf6' },
    ])
  }

  // ── 지시 중요도 ──
  if (!getItem('ws_instr_importances', null)) {
    setItem('ws_instr_importances', [
      { id: 1, name: '최상', icon: 'zap', color: '#ef4444' },
      { id: 2, name: '상', icon: 'alert-triangle', color: '#f59e0b' },
      { id: 3, name: '중', icon: 'circle-dot', color: '#eab308' },
      { id: 4, name: '하', icon: 'check-circle-2', color: '#22c55e' },
      { id: 5, name: '참고', icon: 'eye', color: '#06b6d4' },
    ])
  }

  // ── 진행상태 ──
  if (!getItem('ws_task_statuses', null)) {
    setItem('ws_task_statuses', [
      { id: 1, name: '준비', icon: 'clipboard-list', color: '#9ca3af' },
      { id: 2, name: '시작', icon: 'play-circle', color: '#06b6d4' },
      { id: 3, name: '진행중', icon: 'activity', color: '#3b82f6' },
      { id: 4, name: '대기', icon: 'clock', color: '#8b5cf6' },
      { id: 5, name: '보류', icon: 'pause-circle', color: '#f59e0b' },
      { id: 6, name: '일부완료', icon: 'circle-dot', color: '#22c55e' },
      { id: 7, name: '지연중', icon: 'alert-triangle', color: '#ef4444' },
      { id: 8, name: '포기', icon: 'x-circle', color: '#dc2626' },
      { id: 9, name: '완료', icon: 'check-circle-2', color: '#10b981' },
      { id: 10, name: '검토중', icon: 'eye', color: '#6366f1' },
    ])
  }

  // ── 직원 (사용자) ──
  if (!getItem('ws_users', null)) {
    setItem('ws_users', [
      {
        id: 1, name: '김지훈', role: '팀장', rank: '팀장', dept: '개발팀', avatar: 'KJ', color: '#4f6ef7',
        email: 'kim@workm.kr', phone: '010-1234-5678', birthday: '1985-05-12',
        hiredAt: '2020-01-01', resignedAt: null, address: '서울시 강남구 테헤란로 123',
        loginId: 'admin', pw: '1234', status: '근무', note: '앱 개발 관리자', photo: '',
        position: '팀장', approverType: 'approver'
      },
      {
        id: 2, name: '이수진', role: '선임', rank: '선임', dept: '개발팀', avatar: 'LS', color: '#9747ff',
        email: 'lee@workm.kr', phone: '010-2345-6789', birthday: '1990-08-22',
        hiredAt: '2021-03-15', resignedAt: null, address: '경기도 성남시 분당구 판교로 456',
        loginId: 'lee01', pw: '1234', status: '근무', note: 'Frontend 개발팀 리드', photo: '',
        position: '선임', approverType: 'requester'
      },
      {
        id: 3, name: '박민수', role: '대리', rank: '대리', dept: '마케팅팀', avatar: 'PM', color: '#06b6d4',
        email: 'park@workm.kr', phone: '010-3456-7890', birthday: '1992-11-05',
        hiredAt: '2022-07-01', resignedAt: null, address: '서울시 마포구 월드컵로 789',
        loginId: 'park02', pw: '1234', status: '근무', note: '일정 관리 및 마케팅 담당', photo: '',
        position: '팀원', approverType: 'requester'
      },
      {
        id: 4, name: '최유리', role: '주임', rank: '주임', dept: '디자인팀', avatar: 'CY', color: '#f59e0b',
        email: 'choi@workm.kr', phone: '010-4567-8901', birthday: '1991-02-14',
        hiredAt: '2021-11-10', resignedAt: null, address: '서울시 서초구 서초대로 321',
        loginId: 'choi03', pw: '1234', status: '근무', note: 'UI/UX 디자인 전담', photo: '',
        position: '팀원', approverType: 'requester'
      },
      {
        id: 5, name: '정현수', role: '팀장', rank: '팀장', dept: '마케팅팀', avatar: 'JH', color: '#22c55e',
        email: 'jung@workm.kr', phone: '010-5678-9012', birthday: '1986-09-30',
        hiredAt: '2020-05-20', resignedAt: null, address: '인천시 연수구 컨벤시아대로 654',
        loginId: 'jung04', pw: '1234', status: '휴직', note: '육아휴직 중 (복직 예정)', photo: '',
        position: '팀장', approverType: 'approver'
      },
      {
        id: 6, name: '한소희', role: '선임', rank: '선임', dept: '영업팀', avatar: 'HS', color: '#ef4444',
        email: 'han@workm.kr', phone: '010-6789-0123', birthday: '1989-12-25',
        hiredAt: '2021-06-01', resignedAt: null, address: '서울시 강남구 학동로 987',
        loginId: 'han05', pw: '1234', status: '근무', note: '영업 실적 담당', photo: '',
        position: '선임', approverType: 'requester'
      },
    ])
  }

  // ── 업무 (tasks) ──
  if (!getItem('ws_tasks', null)) {
    setItem('ws_tasks', [
      {
        id: 1, title: '메인 대시보드 UI 개발',
        desc: '메인 대시보드 페이지를 React로 개발하고 다양한 화면 크기 적용 필요.',
        assignerId: 1, assigneeIds: [2],
        status: 'progress', priority: 'high',
        progress: 65, dueDate: '2026-04-28',
        createdAt: '2026-04-10', startedAt: '2026-04-11',
        isImportant: true, team: '개발팀',
        score: 15, spentTime: '12h', reportContent: 'React 컴포넌트 완성 및 API 연동 완료', hasAttachment: true,
        history: [
          { date: '2026-04-10', event: '업무 등록', detail: '김지훈 → 이수진', icon: 'clipboard-list', color: '#4f6ef7' },
          { date: '2026-04-11', event: '업무 시작', detail: '진행중 상태로 변경', icon: 'play-circle', color: '#06b6d4' },
          { date: '2026-04-22', event: '진행율 65%', detail: 'API 연동 작업 진행 중', icon: 'wrench', color: '#9747ff' },
        ]
      },
      {
        id: 2, title: 'Q1 마케팅 기획서 작성',
        desc: '2026년 1분기 SNS 캠페인 기획서 작성 및 예산 책정.',
        assignerId: 5, assigneeIds: [5],
        status: 'delay', priority: 'high',
        progress: 30, dueDate: '2026-04-10',
        createdAt: '2026-04-05', startedAt: '2026-04-06',
        isImportant: true, team: '마케팅팀',
        score: 10, spentTime: '8h', reportContent: '1분기 SNS 타겟 분석 및 예산안 기본 작성', hasAttachment: false,
        history: [
          { date: '2026-04-05', event: '업무 등록', detail: '정현수 → 정현수', icon: 'clipboard-list', color: '#4f6ef7' },
          { date: '2026-04-10', event: '진행율 30%', detail: '기본 자료 수집 완료', icon: 'file-text', color: '#f59e0b' },
        ]
      },
      {
        id: 3, title: '보안 API 성능 최적화',
        desc: '응답시간 50% 개선 목표. 캐시 레이어 도입 및 쿼리 최적화.',
        assignerId: 1, assigneeIds: [3],
        status: 'progress', priority: 'medium',
        progress: 80, dueDate: '2026-04-30',
        createdAt: '2026-04-12', startedAt: '2026-04-13',
        isImportant: false, team: '개발팀',
        score: 20, spentTime: '15h', reportContent: 'DB 인덱스 최적화 및 캐시 레이어 적용 완료', hasAttachment: true,
        history: [
          { date: '2026-04-12', event: '업무 등록', detail: '김지훈 → 박민수', icon: 'clipboard-list', color: '#4f6ef7' },
          { date: '2026-04-15', event: '진행율 80%', detail: '쿼리 최적화 작업 완료', icon: 'zap', color: '#22c55e' },
        ]
      },
      {
        id: 4, title: 'UX 사용성 개선 보고서',
        desc: '사용자 설문조사 5명 이상 진행 후 개선 사항 정리 및 보고.',
        assignerId: 1, assigneeIds: [4],
        status: 'waiting', priority: 'low',
        progress: 0, dueDate: '2026-05-05',
        createdAt: '2026-04-20', startedAt: null,
        isImportant: false, team: '디자인팀',
        score: 5, spentTime: '0h', reportContent: '설문 대상자 선정 작업 진행 중', hasAttachment: false,
        history: [
          { date: '2026-04-20', event: '업무 등록', detail: '김지훈 → 최유리', icon: 'clipboard-list', color: '#4f6ef7' },
        ]
      },
    ])
  }

  // ── 메시지 ──
  if (!getItem('ws_messages', null)) {
    setItem('ws_messages', [
      { id: 1, senderId: 2, text: '팀장님, 대시보드 UI 진행상황 확인 요청드립니다.', time: '10:25 AM' },
      { id: 2, senderId: 1, text: '네, 내일까지로 확인하겠습니다.', time: '10:30 AM' },
    ])
  }

  setItem('ws_seed_version', SEED_VERSION)
}
