const fs = require('fs');
const parser = require('@babel/parser');
const p = './components/PartnerManagement.tsx';

function tryParse(code) {
    try {
        parser.parse(code, { sourceType: 'module', plugins: ['typescript', 'jsx'] });
        return null;
    } catch (e) {
        return e;
    }
}

let lines = fs.readFileSync(p, 'utf8').split('\n');
let maxIter = 50;

for (let iter = 0; iter < maxIter; iter++) {
    const err = tryParse(lines.join('\n'));
    if (!err) {
        console.log('PARSE OK after ' + iter + ' iterations!');
        fs.writeFileSync(p, lines.join('\n'), 'utf8');
        break;
    }
    if (!err.loc) {
        console.log('Unknown err (no loc):', err.message.substring(0, 100));
        break;
    }

    const errLine = err.loc.line;
    const errCol = err.loc.column;
    const errMsg = err.message;
    const idx = errLine - 1;
    const l = lines[idx];

    console.log('Iter ' + iter + ' L' + errLine + ':' + errMsg.substring(0, 60));

    let fixed = false;

    // 전략 1: 줄이 너무 길고 내부에 닫히지 않은 태그가 있는 경우
    // errCol 위치에서 JSX 태그를 찾아 분리
    if (errCol > 100 && l.length > 200) {
        // 오류 발생 위치 근처에서 태그 경계 찾기
        // 가장 마지막 </div>, </span>, </label> 등의 위치에서 분리
        const candidates = [];
        const tagPattern = /<\/[a-zA-Z]+>/g;
        let m;
        while ((m = tagPattern.exec(l)) !== null) {
            candidates.push(m.index + m[0].length);
        }

        // errCol 이후의 첫 번째 닫는 > 위치를 찾아 분리
        // 또는 errCol 이전의 마지막 </tag> 위치에서 분리
        const splitAt = candidates.filter(c => c < errCol).pop();

        if (splitAt && splitAt < l.length) {
            const indent = l.match(/^\s*/)[0];
            const before = l.substring(0, splitAt);
            const after = l.substring(splitAt).trim();
            if (after.length > 0) {
                lines[idx] = before;
                lines.splice(idx + 1, 0, indent + after);
                console.log('  Split at col ' + splitAt + ': ' + before.trim().substring(0, 50) + ' | ' + after.substring(0, 50));
                fixed = true;
            }
        }
    }

    // 전략 2: 줄에서 합쳐진 </xtag> <ytag 패턴 찾아 분리
    if (!fixed) {
        const mergeMatch = l.match(/(<\/[a-zA-Z]+>)\s+(<[a-zA-Z])/);
        if (mergeMatch) {
            const pos = l.indexOf(mergeMatch[0]);
            const splitAt = pos + mergeMatch[1].length;
            const indent = l.match(/^\s*/)[0];
            const before = l.substring(0, splitAt);
            const after = l.substring(splitAt).trim();
            lines[idx] = before;
            lines.splice(idx + 1, 0, indent + after);
            console.log('  MergePattern split: ' + before.trim().substring(0, 50) + ' | ' + after.substring(0, 50));
            fixed = true;
        }
    }

    if (!fixed) {
        console.log('  Cannot fix L' + errLine + ': ' + l.substring(0, 80));
        console.log('  Stopping.');
        break;
    }
}

fs.writeFileSync(p, lines.join('\n'), 'utf8');
console.log('Final lines:', lines.length);
const finalErr = tryParse(lines.join('\n'));
if (finalErr && finalErr.loc) {
    console.log('Remaining error: L' + finalErr.loc.line + ': ' + finalErr.message.substring(0, 80));
} else if (!finalErr) {
    console.log('All errors fixed!');
}
