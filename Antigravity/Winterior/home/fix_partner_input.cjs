const fs = require('fs');
const p = './components/PartnerManagement.tsx';
let t = fs.readFileSync(p, 'utf8');

// ——— 1. 검색 입력박스 (좌측 리스트) - ADMIN 뷰 ———
// 검색 placeholder 텍스트
t = t.replace(
    /style={{ background: 'var\(--admin-input-bg\)', border: '1px solid var\(--admin-border\)', color: 'var\(--admin-text\)' }} \/>/g,
    `style={{ background: 'var(--admin-input-bg)', border: '1px solid var(--admin-border)', color: 'var(--admin-text)' }} />`
);

// ——— 2. 상세정보 카드들 — style 없는 순수 tailwind 클래스로 남은 것들 ———

// 기본정보 card 내 input들 (style 없이 className만 있는 것들)
// 거래처명, 코드, 관리자ID, 패스워드 입력
t = t.replace(
    /className="w-full rounded-xl px-4 py-2\.5 text-sm font-bold outline-none" style={{ background: 'var\(--admin-input-bg\)', border: '1px solid var\(--admin-border\)', color: 'var\(--admin-text\)' }}/g,
    `className="w-full rounded-xl px-4 py-2.5 text-sm font-bold outline-none" style={{ background: 'var(--admin-input-bg)', border: '1px solid var(--admin-border)', color: 'var(--admin-text)' }}`
);

// ——— 3. select (거래 등급) — 현재 style 없는 경우 ———
// 기존에 남아있는 bg-white border-gray 패턴들
const replacements = [
    // 거래처명 input (bg-gray-50 남은 경우)
    [
        /className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2\.5 text-sm font-bold focus:border-blue-500 outline-none"/g,
        `className="w-full rounded-xl px-4 py-2.5 text-sm font-bold outline-none" style={{ background: 'var(--admin-input-bg)', border: '1px solid var(--admin-border)', color: 'var(--admin-text)' }}`
    ],
    // 일반 input (bg-white)
    [
        /className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2\.5 text-sm font-medium focus:border-blue-500 outline-none"/g,
        `className="w-full rounded-xl px-4 py-2.5 text-sm font-medium outline-none" style={{ background: 'var(--admin-input-bg)', border: '1px solid var(--admin-border)', color: 'var(--admin-text)' }}`
    ],
    // select (거래등급)
    [
        /className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2\.5 text-sm font-bold focus:border-blue-500 outline-none appearance-none cursor-pointer"/g,
        `className="w-full rounded-xl px-4 py-2.5 text-sm font-bold outline-none appearance-none cursor-pointer" style={{ background: 'var(--admin-input-bg)', border: '1px solid var(--admin-border)', color: 'var(--admin-text)' }}`
    ],
    // 우편번호 readOnly (w-24)
    [
        /className="w-24 rounded-xl px-3 py-2\.5 text-sm outline-none cursor-not-allowed" style={{ background: 'var\(--admin-input-bg\)', border: '1px solid var\(--admin-border\)', color: 'var\(--admin-text-sub\)', opacity: 0\.7 }}/g,
        `className="w-24 rounded-xl px-3 py-2.5 text-sm outline-none cursor-not-allowed" style={{ background: 'var(--admin-input-bg)', border: '1px solid var(--admin-border)', color: 'var(--admin-text-sub)', opacity: 0.7 }}`
    ],
    // 읽기전용 주소 input (w-full readOnly)
    [
        /className="w-full rounded-xl px-4 py-2\.5 text-sm outline-none cursor-not-allowed" style={{ background: 'var\(--admin-input-bg\)', border: '1px solid var\(--admin-border\)', color: 'var\(--admin-text-sub\)', opacity: 0\.7 }} \/>/g,
        `className="w-full rounded-xl px-4 py-2.5 text-sm outline-none cursor-not-allowed" style={{ background: 'var(--admin-input-bg)', border: '1px solid var(--admin-border)', color: 'var(--admin-text-sub)', opacity: 0.7 }} />`
    ],
    // email input
    [
        /className="w-full rounded-xl pl-10 pr-4 py-2\.5 text-sm font-medium outline-none" style={{ background: 'var\(--admin-input-bg\)', border: '1px solid var\(--admin-border\)', color: 'var\(--admin-text\)' }}/g,
        `className="w-full rounded-xl pl-10 pr-4 py-2.5 text-sm font-medium outline-none" style={{ background: 'var(--admin-input-bg)', border: '1px solid var(--admin-border)', color: 'var(--admin-text)' }}`
    ],
    // 상세주소 (placeholder)
    [
        /className="w-full rounded-xl px-4 py-2\.5 text-sm font-medium outline-none" style={{ background: 'var\(--admin-input-bg\)', border: '1px solid var\(--admin-border\)', color: 'var\(--admin-text\)' }} placeholder="상세 주소 입력"/g,
        `className="w-full rounded-xl px-4 py-2.5 text-sm font-medium outline-none" style={{ background: 'var(--admin-input-bg)', border: '1px solid var(--admin-border)', color: 'var(--admin-text)' }} placeholder="상세 주소 입력"`
    ],
    // textarea (비고)
    [
        /className="w-full rounded-xl px-4 py-3 text-sm font-medium outline-none resize-none" rows={3} style={{ background: 'var\(--admin-input-bg\)', border: '1px solid var\(--admin-border\)', color: 'var\(--admin-text\)' }}/g,
        `className="w-full rounded-xl px-4 py-3 text-sm font-medium outline-none resize-none" rows={3} style={{ background: 'var(--admin-input-bg)', border: '1px solid var(--admin-border)', color: 'var(--admin-text)' }}`
    ],
];

// 위 replacements 불필요 — 이미 수정돼 있음
// 실제 문제 원인: rounded 클래스만 남아있고 style이 없는 경우

// 실제로 문제되는 패턴을 직접 확인
// 1) 코드(자동) input — theme-primary-bg
const codeInputOld = `className="w-full rounded-xl px-4 py-2.5 text-sm font-bold text-center uppercase tracking-widest outline-none cursor-not-allowed" style={{ background: 'var(--theme-primary-bg)', border: '1px solid var(--theme-primary)', color: 'var(--theme-primary)', opacity: 0.8 }}`;
const codeInputNew = `className="w-full rounded-xl px-4 py-2.5 text-sm font-bold text-center uppercase tracking-widest outline-none cursor-not-allowed" style={{ background: 'var(--theme-primary-bg)', border: '1px solid var(--theme-primary)', color: 'var(--theme-primary)', opacity: 0.8 }}`;

// ——— 사업자정보 아이콘들 (Mail icon 등) ———
// Mail icon color
t = t.replace(/<Mail size={16} className="absolute left-4 top-1\/2 -translate-y-1\/2 text-gray-400" \/>/g,
    `<Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: 'var(--admin-text-sub)' }} />`);

// MapPin icon in label
t = t.replace(/<MapPin size={12} \/>/g, `<MapPin size={12} style={{ color: 'var(--admin-text-sub)' }} />`);

// Hash icon
t = t.replace(/<Hash size={14} className="absolute right-3 top-1\/2 -translate-y-1\/2 text-blue-300" \/>/g,
    `<Hash size={14} className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--theme-primary)', opacity: 0.5 }} />`);

// Star icon (거래등급 select)
t = t.replace(/<Star size={14} className="absolute right-3 top-1\/2 -translate-y-1\/2 text-gray-400 pointer-events-none" \/>/g,
    `<Star size={14} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--admin-text-sub)' }} />`);

// ——— 메뉴 할당 관리 ———
// Shield icon
t = t.replace(/<Shield size={16} className="text-indigo-500" \/>/g,
    `<Shield size={16} style={{ color: 'var(--theme-primary)' }} />`);

// 설명 텍스트 (strong 태그 포함)
t = t.replace(
    `<p className="text-[10px] text-gray-400 mb-4">`,
    `<p className="text-[10px] mb-4" style={{ color: 'var(--admin-text-sub)' }}>`
);

// ToggleLeft/ToggleRight 색상은 이미 allOn 조건부로 설정돼 있으나 버튼 스타일 확인
// 메뉴 아이템 버튼 (비활성)
t = t.replace(
    /`text-\[11px\] font-bold px-3 py-1\.5 rounded-lg transition-all \`\${allowed\.includes\(item\.id\) \? 'bg-indigo-600 text-white shadow-sm' : 'bg-white text-gray-500 border border-gray-200 hover:border-indigo-300'}\`/g,
    '`text-[11px] font-bold px-3 py-1.5 rounded-lg transition-all`'
);

// 메뉴 itme 버튼 - style로 조건부 적용
t = t.replace(
    /className=\{\`text-\[11px\] font-bold px-3 py-1\.5 rounded-lg transition-all \$\{allowed\.includes\(item\.id\) \? 'bg-indigo-600 text-white shadow-sm' : 'bg-white text-gray-500 border border-gray-200 hover:border-indigo-300'\}\`\}/g,
    `className="text-[11px] font-bold px-3 py-1.5 rounded-lg transition-all"
                                                            style={{
                                                                background: allowed.includes(item.id) ? 'var(--theme-primary)' : 'var(--admin-input-bg)',
                                                                color: allowed.includes(item.id) ? '#fff' : 'var(--admin-text-sub)',
                                                                border: allowed.includes(item.id) ? 'none' : '1px solid var(--admin-border)'
                                                            }}`
);

// 메뉴 그룹 전체허용/해제 버튼
t = t.replace(
    /className=\{\`flex items-center gap-1 text-\[10px\] font-bold px-2\.5 py-1 rounded-lg transition-all \$\{allOn \? 'bg-indigo-600 text-white' : 'bg-white text-indigo-500 border border-indigo-200'\}\`\}/g,
    `className="flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-lg transition-all"
                                                        style={{
                                                            background: allOn ? 'var(--theme-primary)' : 'var(--admin-input-bg)',
                                                            color: allOn ? '#fff' : 'var(--theme-primary)',
                                                            border: allOn ? 'none' : '1px solid var(--admin-border)'
                                                        }}`
);

// ——— StickyNote 아이콘 ———
t = t.replace(/<StickyNote size={14} className="text-gray-400" \/>/g,
    `<StickyNote size={14} style={{ color: 'var(--admin-text-sub)' }} />`);

// ——— 카드 헤더 divider line h-px ———
// 이미 border로 변환됐을 것이지만 혹시 남은 경우
// 사업자 정보 icon box 색상 (bg-blue-50, bg-green-50, bg-orange-50)
// 이것들은 accent 색상이므로 테마 변수로 매핑
t = t.replace(/<div className="p-1\.5 bg-blue-50 rounded-lg"><User size={16} className="text-blue-600" \/><\/div>/g,
    '<div className="p-1.5 rounded-lg" style={{ background: \'var(--theme-primary-bg)\' }}><User size={16} style={{ color: \'var(--theme-primary)\' }} /></div>');
t = t.replace(/<div className="p-1\.5 bg-green-50 rounded-lg"><Phone size={16} className="text-green-600" \/><\/div>/g,
    '<div className="p-1.5 rounded-lg" style={{ background: \'var(--admin-input-bg)\' }}><Phone size={16} style={{ color: \'var(--admin-text-sub)\' }} /></div>');
t = t.replace(/<div className="p-1\.5 bg-orange-50 rounded-lg"><Briefcase size={16} className="text-orange-600" \/><\/div>/g,
    '<div className="p-1.5 rounded-lg" style={{ background: \'var(--admin-input-bg)\' }}><Briefcase size={16} style={{ color: \'var(--admin-text-sub)\' }} /></div>');
t = t.replace(/<div className="p-1\.5 bg-purple-50 rounded-lg"><Truck size={16} className="text-purple-600" \/><\/div>/g,
    '<div className="p-1.5 rounded-lg" style={{ background: \'var(--admin-input-bg)\' }}><Truck size={16} style={{ color: \'var(--admin-text-sub)\' }} /></div>');

// ——— SUPPLIER 뷰의 입력 필드들도 동일하게 처리 ———
// 화물도착정보의 textarea/input들은 이미 위 패턴과 같으므로 OK

// ——— 좌측 검색박스 ———
// SUPPLIER 뷰 검색박스는 이미 style로 처리됨
// ADMIN 뷰 검색박스도 이미 style로 처리됨

// ——— 담당자 전화 placeholder ———
t = t.replace(
    /className="w-full rounded-xl px-4 py-2\.5 text-sm font-medium outline-none" style={{ background: 'var\(--admin-input-bg\)', border: '1px solid var\(--admin-border\)', color: 'var\(--admin-text\)' }} placeholder="010-0000-0000" maxLength=\{13\}/g,
    `className="w-full rounded-xl px-4 py-2.5 text-sm font-medium outline-none" placeholder="010-0000-0000" maxLength={13} style={{ background: 'var(--admin-input-bg)', border: '1px solid var(--admin-border)', color: 'var(--admin-text)' }}`
);

// ——— hover:bg-gray-100 모달 닫기 버튼 ———
t = t.replace(
    `className="p-2 hover:bg-gray-100 rounded-lg transition-colors" style={{ color: 'var(--admin-text-sub)' }} onMouseEnter={e => (e.currentTarget.style.background='var(--admin-input-bg)')} onMouseLeave={e => (e.currentTarget.style.background='transparent')}><X size={18} />`,
    `className="p-2 rounded-lg transition-colors" style={{ color: 'var(--admin-text-sub)' }} onMouseEnter={e => (e.currentTarget.style.background='var(--admin-input-bg)')} onMouseLeave={e => (e.currentTarget.style.background='transparent')}><X size={18} />`
);

fs.writeFileSync(p, t, 'utf8');
console.log('Done. Lines:', t.split('\n').length);
