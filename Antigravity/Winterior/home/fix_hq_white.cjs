const fs = require('fs');
const p = './components/HeadquartersInfo.tsx';
let t = fs.readFileSync(p, 'utf8');

// L802: 테이블 내 grade input
t = t.replace(
    /className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm font-bold text-center focus:border-indigo-400 outline-none"/g,
    'className="w-full rounded-lg px-3 py-2 text-sm font-bold text-center outline-none" style={{ background: \'var(--admin-input-bg)\', border: \'1px solid var(--admin-border)\', color: \'var(--admin-text)\' }}'
);
t = t.replace(
    /className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm font-medium text-right focus:border-indigo-400 outline-none"/g,
    'className="w-full rounded-lg px-3 py-2 text-sm font-medium text-right outline-none" style={{ background: \'var(--admin-input-bg)\', border: \'1px solid var(--admin-border)\', color: \'var(--admin-text)\' }}'
);

// 남은 right column 카드 (사업자등록증, 솔루션 이미지 등)
// 실제로 남은 bg-white 패턴들 전부 교체
t = t.replace(
    /className="([^"]*?)bg-white([^"]*?)"/g,
    (match, before, after) => {
        // postcodeRef div (우편번호 내부 white 배경)는 유지
        if (match.includes('postcodeRef') || match.includes('z-20') || match.includes('relative z-10')) return match;
        return `className="${before}rounded${after}" style={{ background: 'var(--admin-surface)' }}`;
    }
);

// 우편번호 모달은 그냥 두기
// Right column 카드들 — "bg-white z-20" 패턴
// 나머지 원본 패턴의 bg-white가 있는 것들
const remainingBgWhite = (t.match(/bg-white/g) || []);
console.log('Remaining bg-white:', remainingBgWhite.length);

fs.writeFileSync(p, t, 'utf8');
console.log('Done.');
