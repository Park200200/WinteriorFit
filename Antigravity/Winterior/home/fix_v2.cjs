/**
 * 전략: 손상된 파일에서 "JSX 컨텐츠가 혼합된 긴 줄"을 찾아 분리
 * 손상 패턴: ></whatever_text><tag 또는 </tag><tag 가 같은 줄에 있는 경우
 */
const fs = require('fs');
const parser = require('@babel/parser');
const p = './components/PartnerManagement.tsx';

function tryParse(code) {
    try {
        parser.parse(code, { sourceType: 'module', plugins: ['typescript', 'jsx'] });
        return null;
    } catch (e) {
        return e.loc ? e : { loc: null, message: e.message };
    }
}

let lines = fs.readFileSync(p, 'utf8').split('\n');

// 접근: 각 줄에서 JSX 태그 열기/닫기 패턴을 찾아 적절히 분리
// 손상된 줄의 특징: 긴 줄에 여러 개의 JSX 태그가 붙어있음
function splitMergedLine(l) {
    // 이 함수는 하나의 줄을 여러 줄로 분리
    // 패턴: </tag>...next_content 에서 분리
    const indent = l.match(/^\s*/)[0];
    const result = [];
    let remaining = l;

    while (remaining.length > 0) {
        // 다음 </tag> 또는 />  위치 찾기 (선택적 공백 포함)
        // 그 이후에 <로 시작하는 태그가 오는 경우 분리
        const closeTagMatch = remaining.match(/^(.*?<\/[a-zA-Z]+>|.*?\/>)\s*(<[a-zA-Z])/);
        if (closeTagMatch) {
            const before = closeTagMatch[1];
            const rest = remaining.substring(before.length).trim();
            result.push(indent + before.trimStart());
            remaining = rest;
        } else {
            result.push(indent + remaining.trimStart());
            break;
        }
    }
    return result;
}

// babel 오류가 발생하는 줄을 찾아 처리
let maxIter = 100;
let totalFixed = 0;

for (let iter = 0; iter < maxIter; iter++) {
    const err = tryParse(lines.join('\n'));
    if (!err || !err.loc) {
        if (!err) console.log('PARSE OK after ' + iter + ' iterations! Total fixed: ' + totalFixed);
        else console.log('Unknown error:', err.message);
        break;
    }

    const errLine = err.loc.line;
    const errCol = err.loc.column;
    const idx = errLine - 1;
    const l = lines[idx];

    // 방법 1: errCol 위치에서 '>...<' 패턴으로 분리 시도
    let fixed = false;

    // 오류 위치 앞뒤로 > < 패턴 찾기
    for (let col = errCol; col >= 0; col--) {
        if (l[col] === '>') {
            // col 이후에 다시 내용이 있는 경우
            const afterGt = l.substring(col + 1).trim();
            if (afterGt.length > 0 && afterGt[0] !== '<' && afterGt[0] !== '/') {
                // 텍스트 또는 다른 내용이 있음
                // 여기서 분리
                const indent = l.match(/^\s*/)[0];
                lines[idx] = l.substring(0, col + 1);
                lines.splice(idx + 1, 0, indent + afterGt);
                totalFixed++;
                fixed = true;
                console.log('Iter' + iter + ' L' + errLine + ': Split at col ' + col + ': ...' + l.substring(col - 5, col + 1) + ' | ' + afterGt.substring(0, 50));
                break;
            }
        }
    }

    // 방법 2: 긴 줄에서 </tag> 다음 다른 내용이 오는 경우 분리
    if (!fixed && l.length > 200) {
        const closeTagAfterContent = /(<\/[a-zA-Z]+>)([^<\s][^<]{5,})/;
        const m = closeTagAfterContent.exec(l);
        if (m) {
            const pos = m.index + m[1].length;
            const indent = l.match(/^\s*/)[0];
            lines[idx] = l.substring(0, pos);
            lines.splice(idx + 1, 0, indent + l.substring(pos).trim());
            totalFixed++;
            fixed = true;
            console.log('Iter' + iter + ' L' + errLine + ': Method2 split');
        }
    }

    if (!fixed) {
        console.log('CANNOT FIX L' + errLine + 'C' + errCol + ': ' + err.message.substring(0, 60));
        console.log('  Line: ' + l.substring(0, 100));
        // 그냥 이 줄을 건너뛰고 다음 오류 찾기 위해 임시로 줄 제거 후 테스트
        break;
    }
}

fs.writeFileSync(p, lines.join('\n'), 'utf8');
console.log('Saved. Lines:', lines.length);
const finalErr = tryParse(lines.join('\n'));
if (!finalErr) console.log('ALL FIXED!');
else if (finalErr.loc) {
    console.log('Remaining: L' + finalErr.loc.line + 'C' + finalErr.loc.column + ': ' + finalErr.message.substring(0, 60));
}
