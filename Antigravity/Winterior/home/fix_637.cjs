const fs = require('fs');
const parser = require('@babel/parser');
const p = './components/PartnerManagement.tsx';
let lines = fs.readFileSync(p, 'utf8').split('\n');

// 637번 줄 (index 636): button 닫기 오류
// 현재 상태 확인
console.log('Lines 634-640:');
for (let i = 633; i < 641 && i < lines.length; i++) {
    console.log((i + 1) + '(' + lines[i].length + '):' + lines[i].substring(0, 120));
}

// 637번 줄 수정 - "button" 닫기가 없는 합쳐진 줄
// babel: button 닫기가 636번 col 607 에서 기대됨
const l637 = lines[636];
if (l637) {
    const opens = (l637.match(/<button/g) || []).length;
    const closes = (l637.match(/<\/button>/g) || []).length;
    console.log('Line 637 button opens:', opens, 'closes:', closes);

    // </div> 합쳐진 패턴 처리
    // 패턴: 줄에 </div>iv className or </div>           <span 등이 있는 경우
    // 더 포괄적: 줄 끝에 태그가 합쳐진 경우를 찾아 분리

    // col-span-1 부분이 합쳐진 것을 찾아 분리
    if (l637.includes('col-span-1') && l637.includes('</div>')) {
        const divIdx = l637.lastIndexOf('</div>');
        const afterDiv = l637.substring(divIdx + 6);
        if (afterDiv.trim().length > 0) {
            const indent = l637.match(/^\s*/)[0];
            lines[636] = l637.substring(0, divIdx + 6);
            lines.splice(637, 0, indent + afterDiv.trim());
            console.log('Split 637 at col-span-1 pattern');
        }
    }
}

// 저장
fs.writeFileSync(p, lines.join('\n'), 'utf8');
console.log('Saved, total lines:', lines.length);

// 파싱 테스트
try {
    parser.parse(lines.join('\n'), { sourceType: 'module', plugins: ['typescript', 'jsx'] });
    console.log('PARSE OK!');
} catch (e) {
    if (e.loc) {
        console.log('Next err: L' + e.loc.line + ': ' + e.message.substring(0, 80));
        const n = e.loc.line;
        for (let i = Math.max(0, n - 2); i < Math.min(lines.length, n + 1); i++) {
            console.log((i + 1) + '(' + lines[i].length + '): ' + lines[i].substring(0, 120));
        }
    }
}
