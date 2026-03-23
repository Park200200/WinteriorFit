const fs = require('fs');
const p = './components/HeadquartersInfo.tsx';
let t = fs.readFileSync(p, 'utf8');

// 핵심 패턴: style={{ background: 'var(--admin-input-bg)', border: '1px solid var(--admin-border)', color: 'var(--admin-text)' }}
// 이 패턴 뒤에 onFocus가 없는 경우, 추가
// readOnly + opacity: 0.7 패턴은 제외 (이미 readonly 스타일)

const STYLE_TARGET = `style={{ background: 'var(--admin-input-bg)', border: '1px solid var(--admin-border)', color: 'var(--admin-text)' }}`;
const FOCUS_HANDLERS = `\n                  onFocus={e => (e.currentTarget.style.borderColor = 'var(--theme-primary)')}\n                  onBlur={e => (e.currentTarget.style.borderColor = 'var(--admin-border)')}`;

const lines = t.split('\n');
const result = [];

for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (line.includes(STYLE_TARGET)) {
        // opacity: 0.7 체크 (readOnly 필드)
        if (line.includes('opacity:') || line.includes('opacity :') || line.includes('0.7')) {
            result.push(line);
            continue;
        }
        // 이미 onFocus가 있는지 확인 (다음 3줄)
        let hasOnFocus = false;
        for (let j = i + 1; j <= Math.min(i + 4, lines.length - 1); j++) {
            if (lines[j].includes('onFocus') || lines[j].includes('onBlur')) {
                hasOnFocus = true;
                break;
            }
            // 만약 다음 태그 시작 또는 닫힘이면 중단
            const tr = lines[j].trim();
            if (tr.startsWith('<') && !tr.startsWith('<')) break;
        }

        if (!hasOnFocus) {
            // style 뒤에 onFocus/onBlur 삽입 (같은 줄 끝에)
            // 패턴: style={{ ... }} 이 줄 끝에, 또는 다음줄에 /> 가 있는 경우
            const newLine = line.replace(STYLE_TARGET, STYLE_TARGET + FOCUS_HANDLERS);
            result.push(newLine);
        } else {
            result.push(line);
        }
    } else {
        result.push(line);
    }
}

t = result.join('\n');
fs.writeFileSync(p, t, 'utf8');

// 검증
const withFocus = (t.match(/onFocus.*borderColor.*theme-primary/g) || []).length;
const withStyle = (t.match(/background: 'var\(--admin-input-bg\)', border: '1px solid var\(--admin-border\)', color: 'var\(--admin-text\)'/g) || []).length;
console.log('onFocus count:', withFocus, '| input-bg style count:', withStyle);
