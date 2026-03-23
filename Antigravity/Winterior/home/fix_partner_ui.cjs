const fs = require('fs');
const p = './components/PartnerManagement.tsx';
let t = fs.readFileSync(p, 'utf8');

// 1. filterType 상태를 단일 → 복수 배열로 변경
t = t.replace(
    `const [filterType, setFilterType] = useState<PartnerType | 'ALL'>('ALL'); // For Admin`,
    `const [filterTypes, setFilterTypes] = useState<PartnerType[]>([]); // For Admin (multi-select)`
);

// 2. filteredPartners에서 filterType 사용 부분 변경
t = t.replace(
    `            } else {\n                if (filterType !== 'ALL') {\n                    result = result.filter(p => p.type === filterType);\n                }\n            }`,
    `            } else {\n                if (filterTypes.length > 0) {\n                    result = result.filter(p => filterTypes.includes(p.type as PartnerType));\n                }\n            }`
);

// 3. ADMIN 뷰 헤더 — 멀티 토글 탭 추가 (기존 헤더에 필터 탭 삽입)
t = t.replace(
    `        <div ref={containerRef} className="flex flex-1 overflow-hidden">
            {/* Left List */}
            <div className="flex flex-col flex-shrink-0 overflow-hidden" style={{ width: leftWidth, background: 'var(--admin-surface)', borderRight: '1px solid var(--admin-border)' }}>
                {/* Search + Filter */}
                <div className="p-4 flex-shrink-0 space-y-2" style={{ borderBottom: '1px solid var(--admin-border)' }}>
                    <div className="relative">
                        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--admin-text-sub)' }} />
                        <input type="text" placeholder="거래처 검색..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                            className="w-full rounded-xl pl-9 pr-4 py-2 text-sm outline-none"
                            style={{ background: 'var(--admin-input-bg)', border: '1px solid var(--admin-border)', color: 'var(--admin-text)' }} />
                    </div>
                    <div className="flex gap-1">
                        {(['ALL','DISTRIBUTOR','AGENCY','MANUFACTURER','FABRIC_SUPPLIER'] as const).map(t => (
                            <button key={t} onClick={() => setFilterType(t)}
                                className="flex-1 py-1 text-[10px] font-bold rounded-lg transition-all"
                                style={{ background: filterType===t ? 'var(--theme-primary)' : 'transparent', color: filterType===t ? '#fff' : 'var(--admin-text-sub)' }}>
                                {t==='ALL' ? '전체' : t==='DISTRIBUTOR' ? '총판' : t==='AGENCY' ? '대리점' : t==='MANUFACTURER' ? '제조' : '원단'}
                            </button>
                        ))}
                    </div>
                </div>`,
    `        <div ref={containerRef} className="flex flex-1 overflow-hidden">
            {/* Left List */}
            <div className="flex flex-col flex-shrink-0 overflow-hidden" style={{ width: leftWidth, background: 'var(--admin-surface)', borderRight: '1px solid var(--admin-border)' }}>
                {/* Search Only */}
                <div className="p-4 flex-shrink-0" style={{ borderBottom: '1px solid var(--admin-border)' }}>
                    <div className="relative">
                        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--admin-text-sub)' }} />
                        <input type="text" placeholder="거래처 검색..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                            className="w-full rounded-xl pl-9 pr-4 py-2 text-sm outline-none"
                            style={{ background: 'var(--admin-input-bg)', border: '1px solid var(--admin-border)', color: 'var(--admin-text)' }} />
                    </div>
                </div>`
);

// 4. ADMIN 헤더에 멀티 토글 탭 추가
const TYPE_TABS = [
    { key: 'FABRIC_SUPPLIER', label: '원단공급사' },
    { key: 'MANUFACTURER', label: '제조공급사' },
    { key: 'DISTRIBUTOR', label: '유통관리사' },
    { key: 'AGENCY', label: '가맹대리점' },
];

t = t.replace(
    `        <div className="flex-shrink-0 px-8 h-20 flex items-center justify-between shadow-sm z-20" style={{ background: 'var(--admin-surface)', borderBottom: '1px solid var(--admin-border)' }}>
            <h1 className="text-2xl font-bold flex items-center gap-2" style={{ color: 'var(--admin-text)' }}>
                <Building2 style={{ color: 'var(--theme-primary)' }} size={28} /> 거래처관리
            </h1>
        </div>`,
    `        <div className="flex-shrink-0 px-8 flex items-center justify-between shadow-sm z-20" style={{ background: 'var(--admin-surface)', borderBottom: '1px solid var(--admin-border)', minHeight: '69px' }}>
            <h1 className="text-2xl font-bold flex items-center gap-2 flex-shrink-0" style={{ color: 'var(--admin-text)' }}>
                <Building2 style={{ color: 'var(--theme-primary)' }} size={28} /> 거래처관리
            </h1>
            {/* Multi-toggle filter tabs */}
            <div className="flex items-center gap-1.5 flex-shrink-0">
                {([
                    { key: 'FABRIC_SUPPLIER', label: '원단공급사' },
                    { key: 'MANUFACTURER', label: '제조공급사' },
                    { key: 'DISTRIBUTOR', label: '유통관리사' },
                    { key: 'AGENCY', label: '가맹대리점' },
                ] as const).map(tab => {
                    const isOn = filterTypes.includes(tab.key as PartnerType);
                    return (
                        <button
                            key={tab.key}
                            onClick={() => setFilterTypes(prev =>
                                prev.includes(tab.key as PartnerType)
                                    ? prev.filter(x => x !== tab.key)
                                    : [...prev, tab.key as PartnerType]
                            )}
                            className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all border"
                            style={{
                                background: isOn ? 'var(--theme-primary)' : 'var(--admin-input-bg)',
                                color: isOn ? '#fff' : 'var(--admin-text-sub)',
                                borderColor: isOn ? 'var(--theme-primary)' : 'var(--admin-border)',
                            }}
                        >
                            {tab.label}
                        </button>
                    );
                })}
            </div>
        </div>`
);

// 5. 상세정보 카드 섹션 — 하드코딩 색상을 CSS 변수로 교체 (ADMIN 뷰 + SUPPLIER 뷰 공통)
// bg-white -> var(--admin-surface)
// border-gray-200 -> var(--admin-border)
// text-gray-800 -> var(--admin-text)
// text-gray-400 -> var(--admin-text-sub)
// bg-gray-50 -> var(--admin-input-bg)
// focus:border-blue-500 -> theme-primary (동적이라 style로)

// 카드 배경 및 테두리
t = t.replace(/className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200"/g,
    'className="rounded-2xl p-6 shadow-sm" style={{ background: \'var(--admin-surface)\', border: \'1px solid var(--admin-border)\' }}');

// h4 텍스트 색
t = t.replace(/className="text-sm font-bold text-gray-800 mb-5 flex items-center gap-2 border-b border-gray-100 pb-3"/g,
    'className="text-sm font-bold mb-5 flex items-center gap-2 pb-3" style={{ color: \'var(--admin-text)\', borderBottom: \'1px solid var(--admin-border)\' }}');

t = t.replace(/className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2"/g,
    'className="text-sm font-bold mb-3 flex items-center gap-2" style={{ color: \'var(--admin-text)\' }}');

// label 색
t = t.replace(/className="text-\[11px\] font-bold text-gray-400 uppercase block mb-1\.5"/g,
    'className="text-[11px] font-bold uppercase block mb-1.5" style={{ color: \'var(--admin-text-sub)\' }}');

// label + icon 포함 버전
t = t.replace(/className="text-\[11px\] font-bold text-gray-400 uppercase block mb-2 flex items-center gap-1"/g,
    'className="text-[11px] font-bold uppercase block mb-2 flex items-center gap-1" style={{ color: \'var(--admin-text-sub)\' }}');

// 일반 input
t = t.replace(/className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2\.5 text-sm font-medium focus:border-blue-500 outline-none"/g,
    'className="w-full rounded-xl px-4 py-2.5 text-sm font-medium outline-none" style={{ background: \'var(--admin-input-bg)\', border: \'1px solid var(--admin-border)\', color: \'var(--admin-text)\' }}');

// 읽기전용 input (bg-gray-50)
t = t.replace(/className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2\.5 text-sm font-bold focus:border-blue-500 outline-none"/g,
    'className="w-full rounded-xl px-4 py-2.5 text-sm font-bold outline-none" style={{ background: \'var(--admin-input-bg)\', border: \'1px solid var(--admin-border)\', color: \'var(--admin-text)\' }}');

// readOnly input (bg-gray-100)
t = t.replace(/className="w-full bg-gray-100 border border-gray-200 rounded-xl px-4 py-2\.5 text-sm text-gray-600 outline-none"/g,
    'className="w-full rounded-xl px-4 py-2.5 text-sm outline-none cursor-not-allowed" style={{ background: \'var(--admin-input-bg)\', border: \'1px solid var(--admin-border)\', color: \'var(--admin-text-sub)\', opacity: 0.7 }}');

// 우편번호 readOnly
t = t.replace(/className="w-24 bg-gray-100 border border-gray-200 rounded-xl px-3 py-2\.5 text-sm text-gray-600 outline-none"/g,
    'className="w-24 rounded-xl px-3 py-2.5 text-sm outline-none cursor-not-allowed" style={{ background: \'var(--admin-input-bg)\', border: \'1px solid var(--admin-border)\', color: \'var(--admin-text-sub)\', opacity: 0.7 }}');

// email input (pl-10)
t = t.replace(/className="w-full bg-white border border-gray-200 rounded-xl pl-10 pr-4 py-2\.5 text-sm font-medium focus:border-blue-500 outline-none"/g,
    'className="w-full rounded-xl pl-10 pr-4 py-2.5 text-sm font-medium outline-none" style={{ background: \'var(--admin-input-bg)\', border: \'1px solid var(--admin-border)\', color: \'var(--admin-text)\' }}');

// select
t = t.replace(/className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2\.5 text-sm font-bold focus:border-blue-500 outline-none appearance-none cursor-pointer"/g,
    'className="w-full rounded-xl px-4 py-2.5 text-sm font-bold outline-none appearance-none cursor-pointer" style={{ background: \'var(--admin-input-bg)\', border: \'1px solid var(--admin-border)\', color: \'var(--admin-text)\' }}');

// textarea
t = t.replace(/className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-medium focus:border-blue-500 outline-none resize-none" rows={3} style={{ color: '#374151' }}/g,
    'className="w-full rounded-xl px-4 py-3 text-sm font-medium outline-none resize-none" rows={3} style={{ background: \'var(--admin-input-bg)\', border: \'1px solid var(--admin-border)\', color: \'var(--admin-text)\' }}');

// textarea (without color style)
t = t.replace(/className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-medium focus:border-blue-500 outline-none resize-none" rows={3}/g,
    'className="w-full rounded-xl px-4 py-3 text-sm font-medium outline-none resize-none" rows={3} style={{ background: \'var(--admin-input-bg)\', border: \'1px solid var(--admin-border)\', color: \'var(--admin-text)\' }}');

// 우편번호 검색 버튼 (bg-gray-700)
t = t.replace(/className="bg-gray-700 text-white rounded-xl px-4 py-2 text-xs font-bold hover:bg-gray-800 transition-colors"/g,
    'className="text-white rounded-xl px-4 py-2 text-xs font-bold transition-all" style={{ background: \'var(--theme-primary)\' }} onMouseEnter={e => (e.currentTarget.style.opacity=\'0.85\')} onMouseLeave={e => (e.currentTarget.style.opacity=\'1\')}');

// 상세정보 addrMain readOnly (grid)
t = t.replace(/className="w-full bg-gray-100 border border-gray-200 rounded-xl px-4 py-2\.5 text-sm text-gray-600 outline-none" \/>/g,
    'className="w-full rounded-xl px-4 py-2.5 text-sm outline-none cursor-not-allowed" style={{ background: \'var(--admin-input-bg)\', border: \'1px solid var(--admin-border)\', color: \'var(--admin-text-sub)\', opacity: 0.7 }} />');

// 상세주소 input
t = t.replace(/className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2\.5 text-sm font-medium focus:border-blue-500 outline-none" placeholder="상세 주소 입력"/g,
    'className="w-full rounded-xl px-4 py-2.5 text-sm font-medium outline-none" style={{ background: \'var(--admin-input-bg)\', border: \'1px solid var(--admin-border)\', color: \'var(--admin-text)\' }} placeholder="상세 주소 입력"');

// border-t 구분선 (border-gray-50 -> border-admin)
t = t.replace(/className="col-span-1 xl:col-span-2 pt-2 border-t border-gray-50"/g,
    'className="col-span-1 xl:col-span-2 pt-2" style={{ borderTop: \'1px solid var(--admin-border)\' }}');

// 코드 input (blue)
t = t.replace(/className="w-full bg-blue-50 border border-blue-100 rounded-xl px-4 py-2\.5 text-sm font-bold text-blue-600 text-center uppercase tracking-widest outline-none cursor-not-allowed"/g,
    'className="w-full rounded-xl px-4 py-2.5 text-sm font-bold text-center uppercase tracking-widest outline-none cursor-not-allowed" style={{ background: \'var(--theme-primary-bg)\', border: \'1px solid var(--theme-primary)\', color: \'var(--theme-primary)\', opacity: 0.8 }}');

// 메뉴 할당 섹션 divider
t = t.replace('className="h-px bg-gray-100"',
    'className="h-px" style={{ background: \'var(--admin-border)\' }}');

// 메뉴 그룹 배경
t = t.replace(/className="bg-indigo-50\/50 rounded-xl border border-indigo-100 overflow-hidden"/g,
    'className="rounded-xl overflow-hidden" style={{ background: \'var(--theme-primary-bg, rgba(99,102,241,0.06))\', border: \'1px solid var(--admin-border)\' }}');

t = t.replace(/className="flex items-center justify-between px-4 py-2\.5 bg-indigo-50 border-b border-indigo-100"/g,
    'className="flex items-center justify-between px-4 py-2.5" style={{ background: \'var(--theme-primary-bg)\', borderBottom: \'1px solid var(--admin-border)\' }}');

t = t.replace(/className="text-xs font-bold text-indigo-700"/g,
    'className="text-xs font-bold" style={{ color: \'var(--theme-primary)\' }}');

// Postcode modal 테마화
t = t.replace(/className="flex items-center justify-between p-4 border-b border-gray-100"/g,
    'className="flex items-center justify-between p-4" style={{ borderBottom: \'1px solid var(--admin-border)\' }}');

t = t.replace(/className="font-bold text-gray-800 flex items-center gap-2"><MapPin size={18} className="text-blue-500" \/>우편번호 검색/g,
    'className="font-bold flex items-center gap-2" style={{ color: \'var(--admin-text)\' }}><MapPin size={18} style={{ color: \'var(--theme-primary)\' }} />우편번호 검색');

t = t.replace(/className="p-2 hover:bg-gray-100 rounded-lg transition-colors"><X size={18} className="text-gray-500" \/>/g,
    'className="p-2 rounded-lg transition-colors" style={{ color: \'var(--admin-text-sub)\' }} onMouseEnter={e => (e.currentTarget.style.background=\'var(--admin-input-bg)\')} onMouseLeave={e => (e.currentTarget.style.background=\'transparent\')}><X size={18} />');

fs.writeFileSync(p, t, 'utf8');
console.log('Done. Lines:', t.split('\n').length);
