const fs = require('fs');
const parser = require('@babel/parser');
const p = './components/PartnerManagement.tsx';
let lines = fs.readFileSync(p, 'utf8').split('\n');

let iterations = 0;
const maxIterations = 30;

while (iterations < maxIterations) {
    iterations++;
    const code = lines.join('\n');

    let errorLine;
    try {
        parser.parse(code, { sourceType: 'module', plugins: ['typescript', 'jsx'] });
        console.log('PARSE OK after ' + iterations + ' iterations!');
        fs.writeFileSync(p, code, 'utf8');
        process.exit(0);
    } catch (e) {
        if (!e.loc) { console.log('Unknown error:', e.message); break; }
        errorLine = e.loc.line;
        console.log('Iter ' + iterations + ': L' + errorLine + ': ' + e.message.substring(0, 80));
    }

    const idx = errorLine - 1;
    const l = lines[idx];
    console.log('  Raw: ' + l.substring(0, 100));

    // 패턴 1: </tag>   <another> 합쳐진 것을 분리
    // 더 넓은 패턴으로 탐지
    const closeTagIdx = l.lastIndexOf('</');
    if (closeTagIdx >= 0) {
        const closeTagEnd = l.indexOf('>', closeTagIdx);
        if (closeTagEnd >= 0 && closeTagEnd < l.length - 1) {
            const afterClose = l.substring(closeTagEnd + 1).trim();
            if (afterClose.startsWith('<') && !afterClose.startsWith('</')) {
                const indent = l.match(/^\s*/)[0];
                lines[idx] = l.substring(0, closeTagEnd + 1);
                lines.splice(idx + 1, 0, indent + afterClose);
                console.log('  -> Split at close tag');
                continue;
            }
        }
    }

    // 패턴 2: 닫히지 않은 label/h3 - 해당 줄 분석
    // 손상된 </label> 등을 수동 수정
    if (l.includes('<label') && !l.includes('</label>')) {
        // label 태그가 닫히지 않음 - </label> 추가
        // 하지만 어디에 추가할지 모르므로 줄 전체를 확인
        console.log('  -> Unclosed label at line ' + errorLine + ', manual inspection needed');
        console.log('  Full line:', l);
        // 줄 끝에 </label> 추가 시도
        if (!l.trim().endsWith('>')) {
            lines[idx] = l + '</label>';
            continue;
        }
        // 내부 패턴 수정 시도
        break;
    }

    console.log('  -> Unhandled pattern, stopping');
    break;
}

// 저장
fs.writeFileSync(p, lines.join('\n'), 'utf8');
console.log('Saved. Total lines:', lines.length);
