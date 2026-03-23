const fs = require('fs');
const parser = require('@babel/parser');
const p = './components/PartnerManagement.tsx';
let t = fs.readFileSync(p, 'utf8');

// 손상된 닫는 태그 패턴: ?(개수) + /tag> 를 </tag> 로 교체
// 예: ??/button> -> </button>
// 예: ?/label> -> </label>
// 예: ???/div> -> </div>
const before = t;
t = t.replace(/\?{1,5}(<\/[a-zA-Z]+>)/g, '$1');
const count = (before.match(/\?{1,5}<\/[a-zA-Z]+>/g) || []).length;
console.log('Fixed ?*/tag> count:', count);

// 추가로 ?+> (손상된 >) 패턴도 처리
// 예: -gray-50">  -> 정상이지만 ?> 로 손상된 경우
// 이런 패턴은 위험할 수 있으므로 특정 태그만 처리

fs.writeFileSync(p, t, 'utf8');

// Babel 파싱 테스트
try {
    const lines = t.split('\n');
    parser.parse(t, { sourceType: 'module', plugins: ['typescript', 'jsx'] });
    console.log('PARSE OK!');
} catch (e) {
    if (e.loc) {
        const lines = t.split('\n');
        const n = e.loc.line;
        console.log('Next error: L' + n + ': ' + e.message.substring(0, 80));
        for (let i = Math.max(0, n - 2); i < Math.min(lines.length, n + 1); i++) {
            console.log((i + 1) + '(' + lines[i].length + '): ' + lines[i].substring(0, 120));
        }
    }
}
