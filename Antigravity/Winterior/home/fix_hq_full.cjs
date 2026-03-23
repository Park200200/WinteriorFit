const fs = require('fs');
const p = './components/HeadquartersInfo.tsx';
let t = fs.readFileSync(p, 'utf8');

// ─── 1. 카드 상단 색상 라인들 → 테마 컬러로 교체 ───
t = t.replace(
    `<div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-indigo-500" />`,
    `<div className="absolute top-0 left-0 w-full h-1" style={{ background: 'var(--theme-primary)' }} />`
);
t = t.replace(
    `<div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-400 to-teal-500" />`,
    `<div className="absolute top-0 left-0 w-full h-1" style={{ background: 'var(--theme-primary)' }} />`
);
t = t.replace(
    `<div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-teal-400 to-green-500" />`,
    `<div className="absolute top-0 left-0 w-full h-1" style={{ background: 'var(--theme-primary)' }} />`
);
// 혹시 남은 gradient top lines
t = t.replace(
    /className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r [^"]+"/g,
    `className="absolute top-0 left-0 w-full h-1" style={{ background: 'var(--theme-primary)' }}`
);

// ─── 2. 입력박스 onFocus/onBlur 스타일 추가 ───
// 현재 입력박스 패턴: outline-none 만 있고 focus style이 없음
// style={{ background: 'var(--admin-input-bg)', border: '1px solid var(--admin-border)', color: 'var(--admin-text)' }}
// → onFocus 이벤트로 border-color를 theme-primary로 변경, onBlur로 복원

const inputStyle = `{ background: 'var(--admin-input-bg)', border: '1px solid var(--admin-border)', color: 'var(--admin-text)' }`;
const inputStyleFocusable = `{ background: 'var(--admin-input-bg)', border: '1px solid var(--admin-border)', color: 'var(--admin-text)' }
                  onFocus={e => (e.currentTarget.style.borderColor = 'var(--theme-primary)')}
                  onBlur={e => (e.currentTarget.style.borderColor = 'var(--admin-border)')}`;

// 일반 input/textarea에 onFocus/onBlur 추가 (outline-none 뒤에 있는 style 패턴)
// 패턴: className="...outline-none" style={{ background: 'var(--admin-input-bg)', ... }}
// → 동일하게 유지하고 onFocus/onBlur를 추가

// 먼저 id가 있는 input들에 적용
t = t.replace(
    /(<input\s[^>]*?style=\{\{ background: 'var\(--admin-input-bg\)', border: '1px solid var\(--admin-border\)', color: 'var\(--admin-text\)' \}\})\s*(\/?>)/g,
    (match, before, end) => {
        // 이미 onFocus가 있으면 추가하지 않음
        if (match.includes('onFocus')) return match;
        return before + `\n                  onFocus={e => (e.currentTarget.style.borderColor = 'var(--theme-primary)')}\n                  onBlur={e => (e.currentTarget.style.borderColor = 'var(--admin-border)')}` + '\n                ' + end;
    }
);

// textarea도 같은 방식으로
t = t.replace(
    /(<textarea\s[^>]*?style=\{\{ background: 'var\(--admin-input-bg\)', border: '1px solid var\(--admin-border\)', color: 'var\(--admin-text\)' \}\})\s*(\/?>)/g,
    (match, before, end) => {
        if (match.includes('onFocus')) return match;
        return before + `\n                  onFocus={e => (e.currentTarget.style.borderColor = 'var(--theme-primary)')}\n                  onBlur={e => (e.currentTarget.style.borderColor = 'var(--admin-border)')}` + '\n                ' + end;
    }
);

// ─── 3. readOnly 입력박스는 포커스 X — 우편번호, 기본주소 ───
// opacity: 0.7 인 것들은 readOnly이므로 그대로 유지

// ─── 4. 관리비 테이블 내부 input (rounded-lg) ───
t = t.replace(
    /(<input[^>]*?style=\{\{ background: 'var\(--admin-input-bg\)', border: '1px solid var\(--admin-border\)', color: 'var\(--admin-text\)' \}\})\s*(\/?>)/g,
    (match, before, end) => {
        if (match.includes('onFocus')) return match;
        return before + `\n                  onFocus={e => (e.currentTarget.style.borderColor = 'var(--theme-primary)')}\n                  onBlur={e => (e.currentTarget.style.borderColor = 'var(--admin-border)')}` + '\n                  ' + end;
    }
);

// ─── 5. 사업자 코드 배지 ───
// 이미 처리됨

// ─── 6. 제품도착지 카드 배경색 (배경이 아직 blue/amber hardcoded) ───
t = t.replace(
    /`rounded-xl border p-4 relative group transition-all\s*\$\{dest\.type === 'freight' \? '' : ''\}`/,
    `"rounded-xl p-4 relative group transition-all"`
);
// 도착지 개별 카드 배경 → admin-input-bg 적용
t = t.replace(
    /className=\{\`rounded-xl p-4 relative group transition-all \$\{dest\.type === 'freight' \? '' : ''\}\`\}/g,
    `className="rounded-xl p-4 relative group transition-all" style={{ background: 'var(--admin-input-bg)', border: '1px solid var(--admin-border)' }}`
);
// 도착지 타입 badge (화물/택배) — blue/amber 유지하되 배경만 조정
t = t.replace(
    /`inline-flex items-center gap-1\.5 px-2\.5 py-1 rounded-full text-\[11px\] font-bold\s*\$\{dest\.type === 'freight' \? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'\}`/g,
    `\`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold \${dest.type === 'freight' ? '' : ''}\``
);
// 도착지 타입 배지 style 적용
t = t.replace(
    /className=\{\`inline-flex items-center gap-1\.5 px-2\.5 py-1 rounded-full text-\[11px\] font-bold \$\{dest\.type === 'freight' \? '' : ''\}\`\}/g,
    `className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold" style={{ background: 'var(--theme-primary-bg)', color: 'var(--theme-primary)' }}`
);

// ─── 7. 등급별 표 hover 행 ───
// 이미 처리됨

// ─── 8. 관리비 설정 label들 ───
t = t.replace(
    /<span className="text-sm font-medium text-gray-700">([^<]+)<\/span>/g,
    `<span className="text-sm font-medium" style={{ color: 'var(--admin-text)' }}>$1</span>`
);

// ─── 9. 사업자 등록증 오류 영역 ───
// text-red-500은 유지

// ─── 10. 남은 하드코딩 text-gray 계열 ───
t = t.replace(/<p className="text-sm font-medium text-gray-600">([^<]+)<\/p>/g,
    `<p className="text-sm font-medium" style={{ color: 'var(--admin-text)' }}>$1</p>`);
t = t.replace(/<p className="text-xs text-gray-500">([^<]+)<\/p>/g,
    `<p className="text-xs" style={{ color: 'var(--admin-text-sub)' }}>$1</p>`);

fs.writeFileSync(p, t, 'utf8');
console.log('Done. Lines:', t.split('\n').length);
