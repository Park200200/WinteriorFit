const fs = require('fs');
const p = './components/HeadquartersInfo.tsx';
let t = fs.readFileSync(p, 'utf8');

// useAdminTheme import 추가 (없으면)
if (!t.includes('useAdminTheme')) {
    t = t.replace(
        `import { usePartnerContext } from '../PartnerContext';`,
        `import { usePartnerContext } from '../PartnerContext';\nimport { useAdminTheme } from './theme/AdminThemeContext';`
    );
    t = t.replace(
        `const HeadquartersInfo: React.FC<HeadquartersInfoProps> = ({ role }) => {\n  // Use Context to get global partner data and STANDARD COSTS`,
        `const HeadquartersInfo: React.FC<HeadquartersInfoProps> = ({ role }) => {\n  const { theme } = useAdminTheme();\n  // Use Context to get global partner data and STANDARD COSTS`
    );
}

// ─── 컨테이너 배경 ───
t = t.replace(
    `<div id="hq-info-container" className="max-w-7xl mx-auto w-full pb-20 relative">`,
    `<div id="hq-info-container" className="max-w-7xl mx-auto w-full pb-20 relative" style={{ color: 'var(--admin-text)' }}>`
);

// ─── 헤더 h1 ───
t = t.replace(
    `<h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Building2 className="text-blue-600" />`,
    `<h1 className="text-2xl font-bold flex items-center gap-2" style={{ color: 'var(--admin-text)' }}>
            <Building2 style={{ color: 'var(--theme-primary)' }} />`
);

// ─── 헤더 설명 p ───
t = t.replace(
    `<p className="text-sm text-gray-500 mt-1">
            <span className="font-bold text-blue-600">`,
    `<p className="text-sm mt-1" style={{ color: 'var(--admin-text-sub)' }}>
            <span className="font-bold" style={{ color: 'var(--theme-primary)' }}>`
);

// ─── 메타 정보 ───
t = t.replace(
    `<div id="hq-meta-info" className="flex flex-col items-end text-xs text-gray-400 gap-1">`,
    `<div id="hq-meta-info" className="flex flex-col items-end text-xs gap-1" style={{ color: 'var(--admin-text-sub)' }}>`
);
t = t.replace(
    `<span className="font-bold bg-gray-100 px-2 py-0.5 rounded text-gray-600">최초 등록일</span>`,
    `<span className="font-bold px-2 py-0.5 rounded" style={{ background: 'var(--admin-input-bg)', color: 'var(--admin-text-sub)' }}>최초 등록일</span>`
);
t = t.replace(
    `<span className="font-bold bg-blue-50 px-2 py-0.5 rounded text-blue-600">마지막 업데이트</span>`,
    `<span className="font-bold px-2 py-0.5 rounded" style={{ background: 'var(--theme-primary-bg)', color: 'var(--theme-primary)' }}>마지막 업데이트</span>`
);

// ─── 카드 공통: bg-white rounded-2xl shadow-sm border border-gray-200 ───
t = t.replace(
    /className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 relative overflow-hidden"/g,
    'className="rounded-2xl p-6 relative overflow-hidden" style={{ background: \'var(--admin-surface)\', border: \'1px solid var(--admin-border)\' }}'
);
t = t.replace(
    /className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6"/g,
    'className="rounded-2xl p-6" style={{ background: \'var(--admin-surface)\', border: \'1px solid var(--admin-border)\' }}'
);
// right column cards
t = t.replace(
    /className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5"/g,
    'className="rounded-2xl p-5" style={{ background: \'var(--admin-surface)\', border: \'1px solid var(--admin-border)\' }}'
);
t = t.replace(
    /className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden"/g,
    'className="rounded-2xl overflow-hidden" style={{ background: \'var(--admin-surface)\', border: \'1px solid var(--admin-border)\' }}'
);

// ─── 카드 h3 제목 ───
t = t.replace(
    /className="text-lg font-bold text-gray-800 flex items-center gap-2 mb-6"/g,
    'className="text-lg font-bold flex items-center gap-2 mb-6" style={{ color: \'var(--admin-text)\' }}'
);
t = t.replace(
    /className="text-lg font-bold text-gray-800 flex items-center gap-2"/g,
    'className="text-lg font-bold flex items-center gap-2" style={{ color: \'var(--admin-text)\' }}'
);
t = t.replace(
    /className="text-lg font-bold text-gray-800 flex items-center gap-2 mb-5"/g,
    'className="text-lg font-bold flex items-center gap-2 mb-5" style={{ color: \'var(--admin-text)\' }}'
);

// ─── 카드 아이콘 (text-gray-400) ───
t = t.replace(/<FileText size={20} className="text-gray-400" \/>/g, '<FileText size={20} style={{ color: \'var(--admin-text-sub)\' }} />');
t = t.replace(/<User size={20} className="text-gray-400" \/>/g, '<User size={20} style={{ color: \'var(--admin-text-sub)\' }} />');
t = t.replace(/<Package size={20} className="text-gray-400" \/>/g, '<Package size={20} style={{ color: \'var(--admin-text-sub)\' }} />');
t = t.replace(/<Percent size={20} className="text-gray-400" \/>/g, '<Percent size={20} style={{ color: \'var(--admin-text-sub)\' }} />');
t = t.replace(/<CreditCard size={20} className="text-gray-400" \/>/g, '<CreditCard size={20} style={{ color: \'var(--admin-text-sub)\' }} />');
t = t.replace(/<Monitor size={20} className="text-gray-400" \/>/g, '<Monitor size={20} style={{ color: \'var(--admin-text-sub)\' }} />');
t = t.replace(/<History size={16} className="text-gray-400" \/>/g, '<History size={16} style={{ color: \'var(--admin-text-sub)\' }} />');
t = t.replace(/<History size={20} className="text-gray-400" \/>/g, '<History size={20} style={{ color: \'var(--admin-text-sub)\' }} />');

// ─── 회사 코드 배지 ───
t = t.replace(
    `<div id="hq-company-code" className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">`,
    `<div id="hq-company-code" className="px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1" style={{ background: 'var(--admin-input-bg)', color: 'var(--admin-text-sub)' }}>`
);

// ─── label ───
t = t.replace(
    /className="text-\[11px\] font-bold text-gray-400 uppercase block mb-1\.5"/g,
    'className="text-[11px] font-bold uppercase block mb-1.5" style={{ color: \'var(--admin-text-sub)\' }}'
);
t = t.replace(
    /className="text-\[11px\] font-bold text-gray-400 uppercase block mb-1\.5 flex items-center gap-1"/g,
    'className="text-[11px] font-bold uppercase block mb-1.5 flex items-center gap-1" style={{ color: \'var(--admin-text-sub)\' }}'
);
t = t.replace(
    /className="text-\[10px\] font-bold text-gray-400 uppercase block mb-1"/g,
    'className="text-[10px] font-bold uppercase block mb-1" style={{ color: \'var(--admin-text-sub)\' }}'
);
t = t.replace(
    /className="text-\[10px\] font-bold text-gray-400 uppercase block mb-1 flex items-center gap-1"/g,
    'className="text-[10px] font-bold uppercase block mb-1 flex items-center gap-1" style={{ color: \'var(--admin-text-sub)\' }}'
);

// ─── input (bg-gray-50) ───
t = t.replace(
    /className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2\.5 text-sm font-bold text-gray-800 focus:border-blue-500 outline-none"/g,
    'className="w-full rounded-xl px-4 py-2.5 text-sm font-bold outline-none" style={{ background: \'var(--admin-input-bg)\', border: \'1px solid var(--admin-border)\', color: \'var(--admin-text)\' }}'
);
t = t.replace(
    /className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2\.5 text-sm font-medium focus:border-blue-500 outline-none"/g,
    'className="w-full rounded-xl px-4 py-2.5 text-sm font-medium outline-none" style={{ background: \'var(--admin-input-bg)\', border: \'1px solid var(--admin-border)\', color: \'var(--admin-text)\' }}'
);
// input (bg-white)
t = t.replace(
    /className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2\.5 text-sm font-medium focus:border-blue-500 outline-none placeholder-gray-300"/g,
    'className="w-full rounded-xl px-4 py-2.5 text-sm font-medium outline-none" style={{ background: \'var(--admin-input-bg)\', border: \'1px solid var(--admin-border)\', color: \'var(--admin-text)\' }}'
);
// readOnly input (bg-gray-100)
t = t.replace(
    /className="w-full bg-gray-100 border border-gray-200 rounded-xl px-4 py-2\.5 text-sm font-medium text-gray-500 cursor-not-allowed"/g,
    'className="w-full rounded-xl px-4 py-2.5 text-sm font-medium cursor-not-allowed" style={{ background: \'var(--admin-input-bg)\', border: \'1px solid var(--admin-border)\', color: \'var(--admin-text-sub)\', opacity: 0.7 }}'
);
// readOnly zip input
t = t.replace(
    /className="w-24 bg-gray-100 border border-gray-200 rounded-xl px-3 py-2\.5 text-sm text-gray-500 outline-none cursor-not-allowed"/g,
    'className="w-24 rounded-xl px-3 py-2.5 text-sm outline-none cursor-not-allowed" style={{ background: \'var(--admin-input-bg)\', border: \'1px solid var(--admin-border)\', color: \'var(--admin-text-sub)\', opacity: 0.7 }}'
);
// readOnly addr-main
t = t.replace(
    /className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2\.5 text-sm font-medium focus:border-blue-500 outline-none"/g,
    'className="w-full rounded-xl px-4 py-2.5 text-sm font-medium outline-none" style={{ background: \'var(--admin-input-bg)\', border: \'1px solid var(--admin-border)\', color: \'var(--admin-text)\' }}'
);

// ─── 우편번호 검색 버튼 ───
t = t.replace(
    /className="bg-gray-700 hover:bg-gray-800 text-white rounded-xl px-4 py-2 text-xs font-bold transition-colors whitespace-nowrap"/g,
    'className="text-white rounded-xl px-4 py-2 text-xs font-bold transition-all whitespace-nowrap" style={{ background: \'var(--theme-primary)\' }} onMouseEnter={e => (e.currentTarget.style.opacity=\'0.85\')} onMouseLeave={e => (e.currentTarget.style.opacity=\'1\')}'
);

// ─── 프로필 사진 영역 ───
t = t.replace(
    `<div id="manager-profile-pic" className="w-32 h-32 bg-gray-100 rounded-full flex items-center justify-center overflow-hidden border-2 border-gray-100 relative group cursor-pointer">`,
    `<div id="manager-profile-pic" className="w-32 h-32 rounded-full flex items-center justify-center overflow-hidden relative group cursor-pointer" style={{ background: 'var(--admin-input-bg)', border: '2px solid var(--admin-border)' }}>`
);
t = t.replace(
    `<User size={48} className="text-gray-300" />`,
    `<User size={48} style={{ color: 'var(--admin-border)' }} />`
);

// ─── 프로필 캡션 ───
t = t.replace(
    `<span className="text-xs text-gray-400 font-medium">프로필 사진</span>`,
    `<span className="text-xs font-medium" style={{ color: 'var(--admin-text-sub)' }}>프로필 사진</span>`
);

// ─── 비밀번호 input ───
t = t.replace(
    /className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2\.5 text-sm font-bold focus:border-blue-500 outline-none"/g,
    'className="w-full rounded-xl px-4 py-2.5 text-sm font-bold outline-none" style={{ background: \'var(--admin-input-bg)\', border: \'1px solid var(--admin-border)\', color: \'var(--admin-text)\' }}'
);

// ─── 도착지 카드 배경 ───
t = t.replace(
    /`rounded-xl border p-4 relative group transition-all\s*\$\{dest\.type === 'freight' \? 'bg-blue-50\/30 border-blue-200' : 'bg-amber-50\/30 border-amber-200'\}`/g,
    '`rounded-xl p-4 relative group transition-all ${dest.type === \'freight\' ? \'\' : \'\'}`'
);
// 도착지 내부 소형 input
t = t.replace(
    /className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm font-medium focus:border-blue-500 outline-none"/g,
    'className="w-full rounded-lg px-3 py-2 text-sm font-medium outline-none" style={{ background: \'var(--admin-input-bg)\', border: \'1px solid var(--admin-border)\', color: \'var(--admin-text)\' }}'
);
t = t.replace(
    /className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm font-medium outline-none cursor-not-allowed text-gray-600"/g,
    'className="flex-1 rounded-lg px-3 py-2 text-sm font-medium outline-none cursor-not-allowed" style={{ background: \'var(--admin-input-bg)\', border: \'1px solid var(--admin-border)\', color: \'var(--admin-text-sub)\', opacity: 0.7 }}'
);
t = t.replace(
    /className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm font-medium focus:border-amber-500 outline-none"/g,
    'className="w-full rounded-lg px-3 py-2 text-sm font-medium outline-none" style={{ background: \'var(--admin-input-bg)\', border: \'1px solid var(--admin-border)\', color: \'var(--admin-text)\' }}'
);
// 도착지 주소검색 버튼
t = t.replace(
    /className="flex items-center gap-1 bg-gray-700 hover:bg-gray-800 text-white px-3 py-2 rounded-lg text-xs font-bold transition-colors whitespace-nowrap"/g,
    'className="flex items-center gap-1 text-white px-3 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap" style={{ background: \'var(--theme-primary)\' }} onMouseEnter={e => (e.currentTarget.style.opacity=\'0.85\')} onMouseLeave={e => (e.currentTarget.style.opacity=\'1\')}'
);

// ─── 등급별 판매가 테이블 ───
t = t.replace(
    `<div className="overflow-hidden border border-gray-200 rounded-xl">
                <table className="w-full text-sm text-left">
                  <thead className="bg-gray-50 text-gray-500 font-bold uppercase text-[10px]">`,
    `<div className="overflow-hidden rounded-xl" style={{ border: '1px solid var(--admin-border)' }}>
                <table className="w-full text-sm text-left">
                  <thead className="font-bold uppercase text-[10px]" style={{ background: 'var(--admin-input-bg)', color: 'var(--admin-text-sub)' }}>`
);
t = t.replace(
    `<tbody className="divide-y divide-gray-100">`,
    `<tbody className="divide-y" style={{ '--tw-divide-opacity': 1 }}>`
);
t = t.replace(
    /className="group hover:bg-gray-50 transition-colors"/g,
    'className="group transition-colors" style={{ borderTop: \'1px solid var(--admin-border)\' }}'
);
t = t.replace(
    /<td colSpan={3} className="px-4 py-6 text-center text-gray-400 text-xs">설정된 등급이 없습니다.<\/td>/g,
    '<td colSpan={3} className="px-4 py-6 text-center text-xs" style={{ color: \'var(--admin-text-sub)\' }}>설정된 등급이 없습니다.</td>'
);

// ─── 등급 추가 버튼 ───
t = t.replace(
    `className="flex items-center gap-1 bg-gray-100 hover:bg-gray-200 text-gray-600 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors"
                >
                  <Plus size={14} /> 등급 추가`,
    `className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-all" style={{ background: 'var(--admin-input-bg)', color: 'var(--admin-text-sub)', border: '1px solid var(--admin-border)' }} onMouseEnter={e => { (e.currentTarget).style.color='var(--theme-primary)'; (e.currentTarget).style.borderColor='var(--theme-primary)'; }} onMouseLeave={e => { (e.currentTarget).style.color='var(--admin-text-sub)'; (e.currentTarget).style.borderColor='var(--admin-border)'; }}
                >
                  <Plus size={14} /> 등급 추가`
);

// ─── 등급 테이블 내 input ───
t = t.replace(
    /className="w-full bg-white border border-gray-200 rounded-lg px-2 py-1 text-sm font-bold focus:border-indigo-400 outline-none text-center"/g,
    'className="w-full rounded-lg px-2 py-1 text-sm font-bold outline-none text-center" style={{ background: \'var(--admin-input-bg)\', border: \'1px solid var(--admin-border)\', color: \'var(--admin-text)\' }}'
);
t = t.replace(
    /className="w-full bg-white border border-gray-200 rounded-lg px-2 py-1 text-sm font-medium focus:border-indigo-400 outline-none text-right"/g,
    'className="w-full rounded-lg px-2 py-1 text-sm font-medium outline-none text-right" style={{ background: \'var(--admin-input-bg)\', border: \'1px solid var(--admin-border)\', color: \'var(--admin-text)\' }}'
);

// ─── 저장 버튼들 ───
// handleSave button (기본 저장)
t = t.replace(
    `<button
      id="btn-hq-save"
      onClick={handleSave}
      className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-bold px-6 py-2.5 rounded-xl shadow-md transition-all"
    >`,
    `<button
      id="btn-hq-save"
      onClick={handleSave}
      className="flex items-center gap-2 text-white font-bold px-6 py-2.5 rounded-xl shadow-md transition-all active:scale-95"
      style={{ background: 'var(--theme-primary)' }}
      onMouseEnter={e => (e.currentTarget.style.opacity='0.85')}
      onMouseLeave={e => (e.currentTarget.style.opacity='1')}
    >`
);
// grade save button
t = t.replace(
    `className="flex items-center gap-1.5 bg-teal-500 hover:bg-teal-600 text-white px-4 py-2 rounded-lg text-sm font-bold transition-colors"`,
    `className="flex items-center gap-1.5 text-white px-4 py-2 rounded-lg text-sm font-bold transition-all" style={{ background: 'var(--theme-primary)' }} onMouseEnter={e => (e.currentTarget.style.opacity='0.85')} onMouseLeave={e => (e.currentTarget.style.opacity='1')}`
);

// ─── 이력 로그 카드 ───
t = t.replace(
    `<div className="overflow-y-auto max-h-48 space-y-2">\n                {historyLogs.map(log => (\n                  <div key={log.id} className="flex items-start gap-3 text-xs p-2 rounded-lg hover:bg-gray-50 transition-colors">`,
    `<div className="overflow-y-auto max-h-48 space-y-2">\n                {historyLogs.map(log => (\n                  <div key={log.id} className="flex items-start gap-3 text-xs p-2 rounded-lg transition-colors" onMouseEnter={e => (e.currentTarget.style.background='var(--admin-input-bg)')} onMouseLeave={e => (e.currentTarget.style.background='transparent')}>`
);
t = t.replace(
    /<div className="text-gray-400 mt-0\.5">/g,
    '<div className="mt-0.5" style={{ color: \'var(--admin-text-sub)\' }}>'
);
t = t.replace(
    /<span className="font-bold text-gray-700">/g,
    '<span className="font-bold" style={{ color: \'var(--admin-text)\' }}>'
);
t = t.replace(
    /<span className="text-gray-400">/g,
    '<span style={{ color: \'var(--admin-text-sub)\' }}>'
);

// ─── 결제 정보 카드 ───
t = t.replace(
    /className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0"/g,
    'className="flex justify-between items-center py-2" style={{ borderBottom: \'1px solid var(--admin-border)\' }}'
);
t = t.replace(
    /<span className="text-sm text-gray-500">/g,
    '<span className="text-sm" style={{ color: \'var(--admin-text-sub)\' }}>'
);
t = t.replace(
    /<span className="text-sm font-bold text-gray-800">/g,
    '<span className="text-sm font-bold" style={{ color: \'var(--admin-text)\' }}>'
);
t = t.replace(
    /<span className="text-base font-bold text-blue-600">/g,
    '<span className="text-base font-bold" style={{ color: \'var(--theme-primary)\' }}>'
);

// ─── 솔루션 이미지 업로드 영역 ───
t = t.replace(
    /className="w-full aspect-video bg-gray-100 rounded-xl flex items-center justify-center overflow-hidden relative group cursor-pointer border-2 border-dashed border-gray-300"/g,
    'className="w-full aspect-video rounded-xl flex items-center justify-center overflow-hidden relative group cursor-pointer border-2 border-dashed" style={{ background: \'var(--admin-input-bg)\', borderColor: \'var(--admin-border)\' }}'
);
t = t.replace(
    /<ImageIcon size={40} className="text-gray-300 mb-2" \/>/g,
    '<ImageIcon size={40} className="mb-2" style={{ color: \'var(--admin-border)\' }} />'
);
t = t.replace(
    /<p className="text-xs text-gray-400 font-bold">메인 이미지 업로드<\/p>/g,
    '<p className="text-xs font-bold" style={{ color: \'var(--admin-text-sub)\' }}>메인 이미지 업로드</p>'
);
t = t.replace(
    /<p className="text-\[10px\] text-gray-300 mt-1">권장: 1920×1080<\/p>/g,
    '<p className="text-[10px] mt-1" style={{ color: \'var(--admin-border)\' }}>권장: 1920×1080</p>'
);

// ─── 관리비 정보 카드 ───
t = t.replace(
    /className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm font-medium focus:border-blue-500 outline-none text-right"/g,
    'className="w-full rounded-lg px-3 py-2 text-sm font-medium outline-none text-right" style={{ background: \'var(--admin-input-bg)\', border: \'1px solid var(--admin-border)\', color: \'var(--admin-text)\' }}'
);

// ─── 우편번호 모달 ───
t = t.replace(
    `<div className="rounded-2xl bg-white shadow-2xl w-full max-w-lg overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="font-bold text-gray-800 flex items-center gap-2">
                <MapPin size={18} className="text-blue-500" />
                우편번호 검색
              </h3>
              <button
                onClick={() => { setIsPostcodeOpen(false); setPostcodeError(null); }}
                className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={18} />
              </button>
            </div>`,
    `<div className="rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden" style={{ background: 'var(--admin-surface)' }}>
            <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: '1px solid var(--admin-border)' }}>
              <h3 className="font-bold flex items-center gap-2" style={{ color: 'var(--admin-text)' }}>
                <MapPin size={18} style={{ color: 'var(--theme-primary)' }} />
                우편번호 검색
              </h3>
              <button
                onClick={() => { setIsPostcodeOpen(false); setPostcodeError(null); }}
                className="p-1.5 rounded-lg transition-colors"
                style={{ color: 'var(--admin-text-sub)' }}
                onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background='var(--admin-input-bg)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background='transparent'; }}
              >
                <X size={18} />
              </button>
            </div>`
);

// ─── 도착지 화물 추가 버튼 ───
t = t.replace(
    `className="flex items-center gap-1 bg-blue-50 hover:bg-blue-100 text-blue-600 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors border border-blue-200"`,
    `className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-all" style={{ background: 'var(--theme-primary-bg)', color: 'var(--theme-primary)', border: '1px solid var(--theme-primary)' }}`
);
t = t.replace(
    `className="flex items-center gap-1 bg-amber-50 hover:bg-amber-100 text-amber-600 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors border border-amber-200"`,
    `className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-all" style={{ background: 'var(--admin-input-bg)', color: 'var(--admin-text-sub)', border: '1px solid var(--admin-border)' }}`
);

// ─── 도착지 빈 상태 ───
t = t.replace(
    `<div className="text-center py-12 text-gray-400">
                <Truck size={40} className="mx-auto mb-3 text-gray-300" />
                <p className="text-sm font-medium">등록된 도착지가 없습니다.</p>
                <p className="text-xs mt-1">위의 버튼으로 화물 또는 택배 도착지를 추가하세요.</p>`,
    `<div className="text-center py-12" style={{ color: 'var(--admin-text-sub)' }}>
                <Truck size={40} className="mx-auto mb-3" style={{ color: 'var(--admin-border)' }} />
                <p className="text-sm font-medium">등록된 도착지가 없습니다.</p>
                <p className="text-xs mt-1">위의 버튼으로 화물 또는 택배 도착지를 추가하세요.</p>`
);

fs.writeFileSync(p, t, 'utf8');
console.log('Done. Lines:', t.split('\n').length);
