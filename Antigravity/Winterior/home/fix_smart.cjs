const fs = require('fs');
const parser = require('@babel/parser');
const p = './components/PartnerManagement.tsx';

function tryParse(code) {
    try {
        parser.parse(code, { sourceType: 'module', plugins: ['typescript', 'jsx'] });
        return null;
    } catch (e) {
        return e.loc ? e : null;
    }
}

let lines = fs.readFileSync(p, 'utf8').split('\n');
let maxIter = 60;

for (let iter = 0; iter < maxIter; iter++) {
    const err = tryParse(lines.join('\n'));
    if (!err) {
        console.log('PARSE OK after ' + iter + ' iterations!');
        break;
    }

    const errLine = err.loc.line;
    const errCol = err.loc.column;
    const errMsg = err.message;
    const idx = errLine - 1;
    const l = lines[idx];

    console.log('Iter ' + iter + ' L' + errLine + 'C' + errCol + ': ' + errMsg.substring(0, 50));

    let fixed = false;

    // 닫히지 않은 태그 오류: errCol 위치 이상 분석
    // 방법: errCol 위치에서 가장 가까운 </xxx> 찾아 분리

    // 전략 A: errCol 이전의 마지막 </xxx> 위치에서 분리
    const code = l;
    let splitPos = -1;

    // errCol 이전에 </something> 이 있는 경우 그곳에서 분리
    let lastClose = -1;
    const closeRex = /<\/[a-zA-Z]+>/g;
    let m;
    while ((m = closeRex.exec(code)) !== null) {
        if (m.index + m[0].length <= errCol + 1) {
            lastClose = m.index + m[0].length;
        }
    }

    if (lastClose > 0 && lastClose < code.length) {
        const indent = code.match(/^\s*/)[0];
        const before = code.substring(0, lastClose);
        const after = code.substring(lastClose).trim();
        if (after.length > 0 && after[0] === '<') {
            lines[idx] = before;
            lines.splice(idx + 1, 0, indent + after);
            console.log('  A: Split at lastClose=' + lastClose + ': ' + before.trim().substring(0, 50) + ' | ' + after.substring(0, 50));
            fixed = true;
        }
    }

    // 전략 B: 줄이 너무 긴 경우 errCol 근처에서 강제 분리
    if (!fixed && code.length > 300 && errCol < code.length) {
        // col 위치에서 분리 포인트 찾기
        // 가장 안전한 방법: errCol 이전에 </ 를 찾아 분리
        let cutAt = errCol;
        for (let ci = errCol; ci >= 0; ci--) {
            if (code[ci] === '>') {
                cutAt = ci + 1;
                break;
            }
        }
        if (cutAt > 0 && cutAt < code.length) {
            const indent = code.match(/^\s*/)[0];
            const before = code.substring(0, cutAt);
            const after = code.substring(cutAt).trim();
            if (after.length > 0) {
                lines[idx] = before;
                lines.splice(idx + 1, 0, indent + after);
                console.log('  B: Split at cutAt=' + cutAt);
                fixed = true;
            }
        }
    }

    if (!fixed) {
        console.log('  Cannot fix, stopping. L' + errLine + ': ' + l.substring(0, 80));
        break;
    }
}

fs.writeFileSync(p, lines.join('\n'), 'utf8');
console.log('Saved. Lines:', lines.length);
const finalErr = tryParse(lines.join('\n'));
if (!finalErr) {
    console.log('ALL ERRORS FIXED!');
} else if (finalErr.loc) {
    console.log('REMAINING:', 'L' + finalErr.loc.line + ': ' + finalErr.message.substring(0, 80));
}
