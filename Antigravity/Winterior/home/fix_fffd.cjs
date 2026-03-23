const fs = require('fs');
const parser = require('@babel/parser');
const p = './components/PartnerManagement.tsx';
let t = fs.readFileSync(p, 'utf8');

// U+FFFD (65533) + /tag> 패턴 제거 (이것이 진짜 손상 닫는 태그)
const before = t;
// U+FFFD 문자를 포함한 </tag> 패턴 교체
// \uFFFD+</tag>  -> </tag>
let count1 = 0;
t = t.replace(/[\?\uFFFD]+(<\/[a-zA-Z]+>)/g, (match, cap) => {
    count1++;
    return cap;
});

// 또한 U+FFFD가 JSX 텍스트에서 검색어로 표시되는 경우도 처리
// ?<FFFD>검<FFFD> 같은 손상 텍스트는 빌드에 영향을 주지 않음 (HTML text로 처리됨)
// 하지만 `button>` 직접 텍스트가 오는 경우는 문제
// </button> 이 아닌 그냥 button> 로 표시되는 패턴 체크
let count2 = 0;
t = t.replace(/([^\/<])button>/g, (match, before) => {
    // <button> 이 아닌 경우
    // 가능한 패턴: 손상된 </button> 이 button> 로만 남은 경우
    if (match.trim() === 'button>') {
        count2++;
        return before + '</button>';
    }
    return match;
});

console.log('Fixed FFFD+</tag>:', count1);
console.log('Fixed loose button>:', count2);

fs.writeFileSync(p, t, 'utf8');

// 파싱 확인
try {
    parser.parse(t, { sourceType: 'module', plugins: ['typescript', 'jsx'] });
    console.log('PARSE OK!');
} catch (e) {
    if (e.loc) {
        const lines = t.split('\n');
        const n = e.loc.line;
        console.log('Next error: L' + n + ': ' + e.message.substring(0, 80));
        for (let i = Math.max(0, n - 2); i < Math.min(lines.length, n + 1); i++) {
            console.log((i + 1) + ':' + lines[i].substring(0, 120));
        }
    }
}
