const fs = require('fs');
const p = './components/HeadquartersInfo.tsx';
let t = fs.readFileSync(p, 'utf8');

// 1. 등급마진 테이블 grade 입력박스 (line 803) - focus:border-blue-500 → onFocus/onBlur
t = t.replace(
    `className="w-full rounded border border-gray-200 rounded-lg px-3 py-2 text-sm font-bold text-black focus:border-blue-500 outline-none text-center" style={{ background: 'var(--admin-surface)' }}`,
    `className="w-full rounded-lg px-3 py-2 text-sm font-bold outline-none text-center"
              style={{ background: 'var(--admin-input-bg)', border: '1px solid var(--admin-border)', color: 'var(--admin-text)' }}
              onFocus={e => (e.currentTarget.style.borderColor = 'var(--theme-primary)')}
              onBlur={e => (e.currentTarget.style.borderColor = 'var(--admin-border)')}`
);

// 2. 등급마진 테이블 margin 입력박스 (line 813) - focus:border-blue-500 → onFocus/onBlur
t = t.replace(
    `className="w-full rounded border border-gray-200 rounded-lg pl-3 pr-8 py-2 text-sm font-medium text-black focus:border-blue-500 outline-none text-right" style={{ background: 'var(--admin-surface)' }}`,
    `className="w-full rounded-lg pl-3 pr-8 py-2 text-sm font-medium outline-none text-right"
                style={{ background: 'var(--admin-input-bg)', border: '1px solid var(--admin-border)', color: 'var(--admin-text)' }}
                onFocus={e => (e.currentTarget.style.borderColor = 'var(--theme-primary)')}
                onBlur={e => (e.currentTarget.style.borderColor = 'var(--admin-border)')}`
);

// 3. 관리비 표준항목설정 AI 건당 비용 (line 867) - bg-gray-50 + focus:border-blue 
t = t.replace(
    `className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-bold text-gray-800 focus:border-blue-500 outline-none text-right"`,
    `className="w-full rounded-xl px-4 py-2.5 text-sm font-bold outline-none text-right"
                      style={{ background: 'var(--admin-input-bg)', border: '1px solid var(--admin-border)', color: 'var(--admin-text)' }}
                      onFocus={e => (e.currentTarget.style.borderColor = 'var(--theme-primary)')}
                      onBlur={e => (e.currentTarget.style.borderColor = 'var(--admin-border)')}`
);

// 4. 관리비 저장 버튼 (line 838) - bg-blue-600 → var(--theme-primary)
t = t.replace(
    `className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-md active:scale-95 transition-all"`,
    `className="flex items-center gap-1.5 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-md active:scale-95 transition-all"
                  style={{ background: 'var(--theme-primary)' }}
                  onMouseEnter={e => (e.currentTarget.style.opacity='0.85')}
                  onMouseLeave={e => (e.currentTarget.style.opacity='1')}`
);

// 5. 수정이력 포인트 색상 (line 1033) - border-blue-400 → var(--theme-primary)
t = t.replace(
    `className="absolute -left-[5px] top-1.5 w-2.5 h-2.5 rounded-full rounded border-2 border-blue-400"`,
    `className="absolute -left-[5px] top-1.5 w-2.5 h-2.5 rounded-full border-2"
                   style={{ borderColor: 'var(--theme-primary)' }}`
);

// 6. 수정이력 카드 border-gray-200 → var(--admin-border)
t = t.replace(
    `id="card-history" className="rounded rounded-2xl shadow-sm border border-gray-200 p-6 flex-1"`,
    `id="card-history" className="rounded-2xl p-6 flex-1"`
);

// 7. 관리비 카드 border-gray 나머지 확인 후 교체 - 수직선 border-gray-200
t = t.replace(
    `className="relative pl-2 border-l border-gray-200 space-y-6"`,
    `className="relative pl-2 space-y-6" style={{ borderLeft: '1px solid var(--admin-border)' }}`
);

fs.writeFileSync(p, t, 'utf8');
console.log('Done');

// 검증
const remaining = t.split('\n').filter(l => l.includes('focus:border-blue') || l.includes('border-blue-400'));
console.log('Remaining focus:border-blue count:', remaining.length);
remaining.forEach((l, i) => console.log(i, l.trim().substring(0, 100)));
