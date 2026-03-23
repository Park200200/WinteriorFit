import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PremiumDatePickerProps {
    value: string;           // yyyy-MM-dd format
    onChange: (value: string) => void;
    className?: string;
    disabled?: boolean;
    placeholder?: string;
}

const DAYS_KR = ['일', '월', '화', '수', '목', '금', '토'];
const pad = (n: number) => String(n).padStart(2, '0');
const toStr = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

const TODAY = new Date();
TODAY.setHours(0, 0, 0, 0);

const formatKorean = (dateStr: string) => {
    if (!dateStr) return '';
    const [y, m, d] = dateStr.split('-');
    return `${y}년 ${Number(m)}월 ${Number(d)}일`;
};

const buildCells = (year: number, month: number) => {
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();
    const cells: { date: Date; isCurrentMonth: boolean }[] = [];

    for (let i = firstDay - 1; i >= 0; i--) {
        const d = daysInPrevMonth - i;
        const pm = month === 0 ? 11 : month - 1;
        const py = month === 0 ? year - 1 : year;
        cells.push({ date: new Date(py, pm, d), isCurrentMonth: false });
    }
    for (let d = 1; d <= daysInMonth; d++) {
        cells.push({ date: new Date(year, month, d), isCurrentMonth: true });
    }
    const remaining = 42 - cells.length;
    const nm = month === 11 ? 0 : month + 1;
    const ny = month === 11 ? year + 1 : year;
    for (let d = 1; d <= remaining; d++) {
        cells.push({ date: new Date(ny, nm, d), isCurrentMonth: false });
    }
    return cells;
};

const PremiumDatePicker: React.FC<PremiumDatePickerProps> = ({
    value,
    onChange,
    className = '',
    disabled = false,
    placeholder = '날짜 선택',
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [viewYear, setViewYear] = useState(() => value ? parseInt(value.split('-')[0]) : new Date().getFullYear());
    const [viewMonth, setViewMonth] = useState(() => value ? parseInt(value.split('-')[1]) - 1 : new Date().getMonth());
    const [tempSelected, setTempSelected] = useState<string>(value || '');
    const [buttonRect, setButtonRect] = useState<{ top: number; left: number; width: number } | null>(null);

    const containerRef = useRef<HTMLDivElement>(null);

    // Sync when value changes externally
    useEffect(() => {
        if (value) {
            setTempSelected(value);
            setViewYear(parseInt(value.split('-')[0]));
            setViewMonth(parseInt(value.split('-')[1]) - 1);
        }
    }, [value]);

    const handleOpen = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
        if (disabled) return;
        const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
        setButtonRect({ top: rect.top, left: rect.left, width: rect.width });
        setTempSelected(value || toStr(new Date()));
        if (value) {
            setViewYear(parseInt(value.split('-')[0]));
            setViewMonth(parseInt(value.split('-')[1]) - 1);
        } else {
            setViewYear(new Date().getFullYear());
            setViewMonth(new Date().getMonth());
        }
        setIsOpen(true);
    }, [disabled, value]);

    const handleConfirm = () => {
        if (tempSelected) onChange(tempSelected);
        setIsOpen(false);
    };

    const handleCancel = () => {
        setTempSelected(value || '');
        setIsOpen(false);
    };

    const goToday = () => {
        const t = new Date();
        setTempSelected(toStr(t));
        setViewYear(t.getFullYear());
        setViewMonth(t.getMonth());
    };

    const prevMonth = () => {
        if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
        else setViewMonth(m => m - 1);
    };
    const nextMonth = () => {
        if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
        else setViewMonth(m => m + 1);
    };

    const cells = isOpen ? buildCells(viewYear, viewMonth) : [];

    // Calendar popup 위치 계산 (스마트 포지셔닝: 공간에 따라 위/아래)
    const calWidth = 300;
    const calHeight = 420;
    const calLeft = buttonRect ? Math.min(buttonRect.left, window.innerWidth - calWidth - 8) : 0;
    const spaceBelow = buttonRect ? window.innerHeight - (buttonRect.top + 40) : 0;
    const showAbove = spaceBelow < calHeight;
    const calTop = buttonRect
        ? showAbove
            ? buttonRect.top - calHeight - 8
            : buttonRect.top + 40 + 8
        : 0;

    return (
        <div ref={containerRef} className={`relative ${className}`}>
            {/* Trigger Input */}
            <div
                onClick={handleOpen}
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '8px 12px',
                    background: isOpen ? 'var(--admin-surface)' : 'var(--admin-input-bg)',
                    border: `1px solid ${isOpen ? 'var(--theme-primary)' : 'var(--admin-border)'}`,
                    borderRadius: '8px',
                    cursor: disabled ? 'not-allowed' : 'pointer',
                    opacity: disabled ? 0.5 : 1,
                    transition: 'all 0.2s',
                    boxShadow: isOpen ? '0 0 0 3px var(--theme-primary-bg)' : 'none',
                }}
            >
                <span style={{
                    flex: 1,
                    fontSize: '14px',
                    color: value ? 'var(--admin-text)' : 'var(--admin-text-sub)',
                    fontWeight: value ? 500 : 400,
                }}>
                    {value ? formatKorean(value) : placeholder}
                </span>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                    style={{ color: isOpen ? 'var(--theme-primary)' : 'var(--admin-text-sub)', flexShrink: 0, transition: 'color 0.2s' }}>
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                    <line x1="16" y1="2" x2="16" y2="6" />
                    <line x1="8" y1="2" x2="8" y2="6" />
                    <line x1="3" y1="10" x2="21" y2="10" />
                </svg>
            </div>

            {/* Calendar Popup (Portal-style, fixed position above trigger) */}
            {isOpen && buttonRect && (
                <>
                    {/* Backdrop */}
                    <div className="fixed inset-0 z-[290]" onClick={handleCancel} />

                    <div
                        className="fixed z-[300] rounded-2xl shadow-2xl"
                        style={{
                            background: 'var(--admin-modal-bg)',
                            border: 'none',
                            borderRadius: '16px',
                            width: `${calWidth}px`,
                            left: `${calLeft}px`,
                            top: `${Math.max(8, calTop)}px`,
                            animation: 'calFadeInDown 0.18s ease-out',
                        }}
                        onClick={e => e.stopPropagation()}
                    >
                        {/* Header - 날짜 크게 표시 */}
                        <div style={{
                            padding: '20px 20px 16px',
                            borderBottom: '1px solid var(--admin-border)',
                            background: 'var(--admin-surface)',
                        }}>
                            <p style={{ fontSize: '11px', fontWeight: 700, color: 'var(--admin-text-sub)', marginBottom: '4px', letterSpacing: '0.5px' }}>날짜 선택</p>
                            <p style={{ fontSize: '22px', fontWeight: 900, color: 'var(--admin-text)', lineHeight: 1.2 }}>
                                {tempSelected ? formatKorean(tempSelected) : '날짜를 선택하세요'}
                            </p>
                        </div>

                        {/* Month navigation */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px 8px' }}>
                            <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--admin-text)' }}>{viewYear}년 {viewMonth + 1}월</span>
                            <div style={{ display: 'flex', gap: '4px' }}>
                                <button
                                    onClick={e => { e.stopPropagation(); prevMonth(); }}
                                    style={{ padding: '6px', borderRadius: '8px', border: 'none', background: 'transparent', color: 'var(--admin-text-sub)', cursor: 'pointer', transition: 'background 0.15s' }}
                                    onMouseEnter={e => (e.currentTarget.style.background = 'var(--admin-bg)')}
                                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                                >
                                    <ChevronLeft size={16} />
                                </button>
                                <button
                                    onClick={e => { e.stopPropagation(); nextMonth(); }}
                                    style={{ padding: '6px', borderRadius: '8px', border: 'none', background: 'transparent', color: 'var(--admin-text-sub)', cursor: 'pointer', transition: 'background 0.15s' }}
                                    onMouseEnter={e => (e.currentTarget.style.background = 'var(--admin-bg)')}
                                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                                >
                                    <ChevronRight size={16} />
                                </button>
                            </div>
                        </div>

                        {/* Day headers */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', padding: '0 16px 4px' }}>
                            {DAYS_KR.map((d, i) => (
                                <div key={d} style={{
                                    textAlign: 'center',
                                    fontSize: '11px',
                                    fontWeight: 700,
                                    padding: '4px 0',
                                    color: i === 0 ? '#ef4444' : i === 6 ? 'var(--theme-primary)' : 'var(--admin-text-sub)',
                                }}>
                                    {d}
                                </div>
                            ))}
                        </div>

                        {/* Day grid */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', padding: '0 12px 12px', gap: '2px' }}>
                            {cells.map((cell, idx) => {
                                const ds = toStr(cell.date);
                                const isSelected = ds === tempSelected;
                                const isToday = cell.date.getTime() === TODAY.getTime();
                                const dow = cell.date.getDay();
                                let textColor = cell.isCurrentMonth ? 'var(--admin-text)' : 'var(--admin-text-sub)';
                                if (cell.isCurrentMonth && dow === 0) textColor = '#ef4444';
                                if (cell.isCurrentMonth && dow === 6) textColor = 'var(--theme-primary)';
                                if (isSelected) textColor = '#ffffff';

                                return (
                                    <button
                                        key={idx}
                                        onClick={e => { e.stopPropagation(); setTempSelected(ds); }}
                                        onDoubleClick={e => { e.stopPropagation(); setTempSelected(ds); onChange(ds); setIsOpen(false); }}
                                        style={{
                                            display: 'flex',
                                            flexDirection: 'column',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            height: '34px',
                                            fontSize: '13px',
                                            fontWeight: 600,
                                            borderRadius: '50%',
                                            border: 'none',
                                            cursor: 'pointer',
                                            position: 'relative',
                                            background: isSelected ? 'var(--theme-primary)' : 'transparent',
                                            color: textColor,
                                            opacity: cell.isCurrentMonth ? 1 : 0.35,
                                            transition: 'all 0.12s',
                                            outline: isToday && !isSelected ? '2px solid var(--theme-primary)' : 'none',
                                            outlineOffset: '-2px',
                                            boxShadow: isSelected ? '0 4px 12px rgba(0,0,0,0.2)' : 'none',
                                        }}
                                        onMouseEnter={e => { if (!isSelected) (e.currentTarget as HTMLButtonElement).style.background = 'var(--theme-primary-bg)'; }}
                                        onMouseLeave={e => { if (!isSelected) (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
                                    >
                                        {cell.date.getDate()}
                                        {isToday && !isSelected && (
                                            <span style={{ position: 'absolute', bottom: '3px', width: '4px', height: '4px', borderRadius: '50%', background: 'var(--theme-primary)' }} />
                                        )}
                                    </button>
                                );
                            })}
                        </div>

                        {/* Footer */}
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '12px 20px 16px',
                            borderTop: '1px solid var(--admin-border)',
                            background: 'var(--admin-surface)',
                        }}>
                            <button
                                onClick={e => { e.stopPropagation(); goToday(); }}
                                style={{ fontSize: '13px', fontWeight: 700, color: 'var(--theme-primary)', background: 'transparent', border: 'none', cursor: 'pointer', padding: '0' }}
                            >
                                오늘
                            </button>
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <button
                                    onClick={e => { e.stopPropagation(); handleCancel(); }}
                                    style={{
                                        padding: '8px 16px', fontSize: '13px', fontWeight: 700,
                                        color: 'var(--admin-text-sub)', background: 'var(--admin-bg)',
                                        border: '1px solid var(--admin-border)', borderRadius: '10px', cursor: 'pointer',
                                    }}
                                    onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--admin-text)'; }}
                                    onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--admin-text-sub)'; }}
                                >
                                    취소
                                </button>
                                <button
                                    onClick={e => { e.stopPropagation(); handleConfirm(); }}
                                    style={{
                                        padding: '8px 16px', fontSize: '13px', fontWeight: 700,
                                        color: 'var(--theme-btn-label, #ffffff)',
                                        background: 'var(--theme-primary)',
                                        border: 'none', borderRadius: '10px', cursor: 'pointer',
                                        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                                        transition: 'opacity 0.15s',
                                    }}
                                    onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.opacity = '0.85'; }}
                                    onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.opacity = '1'; }}
                                >
                                    적용
                                </button>
                            </div>
                        </div>
                    </div>
                </>
            )}

            <style>{`
                @keyframes calFadeInDown {
                    from { opacity: 0; transform: translateY(-6px) scale(0.97); }
                    to { opacity: 1; transform: translateY(0) scale(1); }
                }
                @keyframes calFadeUp {
                    from { opacity: 0; transform: translateY(8px) scale(0.97); }
                    to { opacity: 1; transform: translateY(0) scale(1); }
                }
            `}</style>
        </div>
    );
};

export default PremiumDatePicker;
