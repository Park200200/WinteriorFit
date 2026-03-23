const fs = require('fs');
const parser = require('@babel/parser');
const p = './components/PartnerManagement.tsx';
let lines = fs.readFileSync(p, 'utf8').split('\n');

// 670번 (idx 669): 손상된 한글 복원
// 지???화번호 -> 지점전화번호 (업체 전화 관련 필드)
lines[669] = lines[669].replace(/지\?{1,5}화번호/, '지점전화번호');
// 그래도 남아있으면 직접 교체
if (lines[669].includes('???') || lines[669].includes('?화번호')) {
    const original = lines[669];
    lines[669] = '                                                <label className="text-[11px] font-bold text-gray-400 uppercase block mb-1.5">지점전화번호</label>';
    console.log('Replaced 670 fully');
}

// 767번 까지의 모든 label/h3/h4 손상된 콘텐츠 수정
// 패턴: <label ...>?텍스트?</label> 에서 ? 일부 교체

fs.writeFileSync(p, lines.join('\n'), 'utf8');

try {
    parser.parse(lines.join('\n'), { sourceType: 'module', plugins: ['typescript', 'jsx'] });
    console.log('PARSE OK!');
} catch (e) {
    if (e.loc) {
        const n = e.loc.line;
        console.log('Next error: L' + n + 'C' + e.loc.column + ': ' + e.message.substring(0, 80));
        for (let i = Math.max(0, n - 2); i < Math.min(lines.length, n + 1); i++) {
            console.log((i + 1) + ': ' + lines[i].substring(0, 120));
        }
    }
}
