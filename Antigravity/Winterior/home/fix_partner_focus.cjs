const fs = require('fs');
const p = './components/PartnerManagement.tsx';
let t = fs.readFileSync(p, 'utf8');

// onFocus/onBlur가 없는 input/select/textarea에 추가
// 패턴: style={{ background: 'var(--admin-input-bg)', border: '1px solid var(--admin-border)', color: 'var(--admin-text)' }}
//   또는 style={{ background: 'var(--admin-input-bg)', border: '1px solid var(--admin-border)', color: 'var(--admin-text)', opacity: 0.7 }}  ← readOnly는 제외

const FOCUS_ATTRS = `\n                  onFocus={e => (e.currentTarget.style.borderColor = 'var(--theme-primary)')}\n                  onBlur={e => (e.currentTarget.style.borderColor = 'var(--admin-border)')}`;

// Regex: input/select/textarea 태그에서 onFocus 없이 --admin-border 스타일이 있는 경우, opacity 없는 경우
// "opacity" 가 없을 때만 추가 (readOnly 필드 제외)
t = t.replace(
    /(style=\{\{ background: 'var\(--admin-input-bg\)', border: '1px solid var\(--admin-border\)', color: 'var\(--admin-text\)' \}\})(?!\s*\n\s*onFocus)(\s*\/>|\s*\n\s*\/\>|\s*\n\s*onFocus)/g,
    (match, styleAttr, ending) => {
        if (ending.includes('onFocus')) return match;
        return styleAttr + FOCUS_ATTRS + (ending.trim() === '/>' ? '\n                ' + '/>' : ending);
    }
);

// 더 단순한 방식: 직접 string replace
// style={{ ... 'var(--admin-text)' }} 뒤에 /> 오는 패턴에 onFocus 추가
const TARGET = `style={{ background: 'var(--admin-input-bg)', border: '1px solid var(--admin-border)', color: 'var(--admin-text)' }}`;
const REPLACEMENT_INLINE = `style={{ background: 'var(--admin-input-bg)', border: '1px solid var(--admin-border)', color: 'var(--admin-text)' }}
                  onFocus={e => (e.currentTarget.style.borderColor = 'var(--theme-primary)')}
                  onBlur={e => (e.currentTarget.style.borderColor = 'var(--admin-border)')}`;

// 이미 onFocus가 있는 경우만 제외하고 교체
const lines = t.split('\n');
const result = [];
for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.includes(TARGET)) {
        // 다음 라인들을 확인하여 onFocus가 이미 있는지 확인
        let alreadyHasFocus = false;
        for (let j = i + 1; j < Math.min(i + 4, lines.length); j++) {
            if (lines[j].includes('onFocus')) { alreadyHasFocus = true; break; }
            if (lines[j].includes('/>') || lines[j].includes('</')) break;
        }
        if (!alreadyHasFocus && !line.includes('opacity')) {
            result.push(line.replace(TARGET, REPLACEMENT_INLINE));
        } else {
            result.push(line);
        }
    } else {
        result.push(line);
    }
}
t = result.join('\n');

fs.writeFileSync(p, t, 'utf8');
console.log('Done. Lines:', t.split('\n').length);

// 확인: onFocus 적용된 input 개수
const withFocus = (t.match(/onFocus.*borderColor.*theme-primary/g) || []).length;
console.log('onFocus applied count:', withFocus);
