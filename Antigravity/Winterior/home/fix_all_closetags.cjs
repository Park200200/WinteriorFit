const fs = require('fs');
const parser = require('@babel/parser');
const p = './components/PartnerManagement.tsx';
let t = fs.readFileSync(p, 'utf8');

// 전략: 파일 전체에서 ?? + / + tag> 패턴을 </tag>로 교체
// 여기서 ?는 ASCII 63이나 U+FFFD (65533) 문자
// 그리고 \? 가 다수 올 수 있음

// 정규 표현식으로 패턴 매칭:
// [?]{1,5}\/([a-zA-Z]+)>  ->  </$1>
// 단, 이미 < 앞에 있는 경우는 제외

const patterns = [
    /(\?{1,5})\/(button>)/g,
    /(\?{1,5})\/(div>)/g,
    /(\?{1,5})\/(label>)/g,
    /(\?{1,5})\/(span>)/g,
    /(\?{1,5})\/(h[1-6]>)/g,
    /(\?{1,5})\/(input>)/g,
    /(\?{1,5})\/(select>)/g,
    /(\?{1,5})\/(option>)/g,
    /(\?{1,5})\/(a>)/g,
    /(\?{1,5})\/(p>)/g,
];

let totalFixed = 0;
for (const pattern of patterns) {
    const before = t;
    t = t.replace(pattern, (match, qs, tag) => {
        totalFixed++;
        return '</' + tag;
    });
}

// 또한 \uFFFD 포함 패턴도 처리
totalFixed += (() => {
    let c = 0;
    t = t.replace(/[\uFFFD?]{1,5}\/([a-zA-Z]+>)/g, (match, tag) => {
        c++;
        return '</' + tag;
    });
    return c;
})();

console.log('Total fixed ??/tag> patterns:', totalFixed);

fs.writeFileSync(p, t, 'utf8');

try {
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
