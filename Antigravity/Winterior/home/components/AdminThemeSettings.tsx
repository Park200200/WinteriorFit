import React from 'react';
import { motion } from 'framer-motion';
import { Palette, Check, LayoutTemplate, Settings2, Trash2, Edit2, Plus, RefreshCw, Sun, Moon, Layers } from 'lucide-react';
import { useAdminTheme } from './theme/AdminThemeContext';
import { AdminButton } from './ui/AdminButton';

const THEME_COLORS = [
    { id: 'violet',  label: '퍼플 (기본)', hex: '#7c3aed' },
    { id: 'blue',    label: '블루',        hex: '#3b82f6' },
    { id: 'emerald', label: '에메랄드',    hex: '#10b981' },
    { id: 'gray',    label: '차콜',        hex: '#4b5563' },
    { id: 'rose',    label: '로즈',        hex: '#e11d48' },
    { id: 'amber',   label: '앰버',        hex: '#f59e0b' },
];

const BORDER_RADII = [
    { id: '0rem', label: '직각 (0px)' },
    { id: '0.25rem', label: '약간 (4px)' },
    { id: '0.5rem', label: '보통 (8px)' },
    { id: '1rem', label: '둥글게 (16px)' },
    { id: '9999px', label: 'Pill' },
];

const BG_PALETTE_BASE = [
    {
        cssVar: '--admin-bg',
        label: '기본 바탕',
        desc: '페이지·화면 전체 배경',
        palettes: {
            violet:  { light: '#f9fafb', dark: '#0f172a' },
            blue:    { light: '#f9fafb', dark: '#0f172a' },
            emerald: { light: '#f9fafb', dark: '#0f172a' },
            gray:    { light: '#f9fafb', dark: '#0f172a' },
            rose:    { light: '#f9fafb', dark: '#0f172a' },
            amber:   { light: '#f9fafb', dark: '#0f172a' },
        },
    },
    {
        cssVar: '--admin-surface',
        label: '카드 바탕',
        desc: '카드·패널 배경',
        palettes: {
            violet:  { light: '#ffffff', dark: '#1e293b' },
            blue:    { light: '#ffffff', dark: '#1e293b' },
            emerald: { light: '#ffffff', dark: '#1e293b' },
            gray:    { light: '#ffffff', dark: '#1e293b' },
            rose:    { light: '#ffffff', dark: '#1e293b' },
            amber:   { light: '#ffffff', dark: '#1e293b' },
        },
    },
    {
        cssVar: '--admin-input-bg',
        label: '입력박스 바탕',
        desc: '텍스트 인풋 배경',
        palettes: {
            violet:  { light: '#ffffff', dark: '#0f172a' },
            blue:    { light: '#ffffff', dark: '#0f172a' },
            emerald: { light: '#ffffff', dark: '#0f172a' },
            gray:    { light: '#ffffff', dark: '#0f172a' },
            rose:    { light: '#ffffff', dark: '#0f172a' },
            amber:   { light: '#ffffff', dark: '#0f172a' },
        },
    },
    {
        cssVar: '--admin-grid-header',
        label: '그리드 헤더 바탕',
        desc: '테이블 thead 배경 (메인컬러 반영)',
        palettes: {
            violet:  { light: '#ede9fe', dark: '#2e1065' },
            blue:    { light: '#dbeafe', dark: '#1e3a5f' },
            emerald: { light: '#d1fae5', dark: '#064e3b' },
            gray:    { light: '#e5e7eb', dark: '#1f2937' },
            rose:    { light: '#ffe4e6', dark: '#4c0519' },
            amber:   { light: '#fef3c7', dark: '#451a03' },
        },
    },
    {
        cssVar: '--admin-list-bg',
        label: '리스트 행 바탕',
        desc: '목록·테이블 일반 행 배경',
        palettes: {
            violet:  { light: '#ffffff', dark: '#1e293b' },
            blue:    { light: '#ffffff', dark: '#1e293b' },
            emerald: { light: '#ffffff', dark: '#1e293b' },
            gray:    { light: '#ffffff', dark: '#1e293b' },
            rose:    { light: '#ffffff', dark: '#1e293b' },
            amber:   { light: '#ffffff', dark: '#1e293b' },
        },
    },
    {
        cssVar: '--admin-list-alt',
        label: '리스트 짝수행 바탕',
        desc: '얼터네이트(홀짝) 행 배경',
        palettes: {
            violet:  { light: '#f5f3ff', dark: '#172033' },
            blue:    { light: '#eff6ff', dark: '#172033' },
            emerald: { light: '#ecfdf5', dark: '#172033' },
            gray:    { light: '#f9fafb', dark: '#172033' },
            rose:    { light: '#fff1f2', dark: '#172033' },
            amber:   { light: '#fffbeb', dark: '#172033' },
        },
    },
    {
        cssVar: '--admin-list-hover',
        label: '리스트 호버 바탕',
        desc: '행 마우스오버 시 배경',
        palettes: {
            violet:  { light: '#ede9fe', dark: '#334155' },
            blue:    { light: '#dbeafe', dark: '#334155' },
            emerald: { light: '#d1fae5', dark: '#334155' },
            gray:    { light: '#f3f4f6', dark: '#334155' },
            rose:    { light: '#ffe4e6', dark: '#334155' },
            amber:   { light: '#fef3c7', dark: '#334155' },
        },
    },
    {
        cssVar: '--admin-sidebar-bg',
        label: '사이드바 바탕',
        desc: '좌측 네비게이션 배경',
        palettes: {
            violet:  { light: '#ffffff', dark: '#1e293b' },
            blue:    { light: '#ffffff', dark: '#1e293b' },
            emerald: { light: '#ffffff', dark: '#1e293b' },
            gray:    { light: '#ffffff', dark: '#1e293b' },
            rose:    { light: '#ffffff', dark: '#1e293b' },
            amber:   { light: '#ffffff', dark: '#1e293b' },
        },
    },
    {
        cssVar: '--admin-modal-bg',
        label: '모달·팝업 바탕',
        desc: '다이얼로그·드롭다운 배경',
        palettes: {
            violet:  { light: '#ffffff', dark: '#1e293b' },
            blue:    { light: '#ffffff', dark: '#1e293b' },
            emerald: { light: '#ffffff', dark: '#1e293b' },
            gray:    { light: '#ffffff', dark: '#1e293b' },
            rose:    { light: '#ffffff', dark: '#1e293b' },
            amber:   { light: '#ffffff', dark: '#1e293b' },
        },
    },
];

export const AdminThemeSettings: React.FC = () => {
    const { theme, setTheme, resetTheme, toggleDarkMode } = useAdminTheme();
    const dark = theme.darkMode;
    const colorId = theme.primaryColor as keyof typeof BG_PALETTE_BASE[0]['palettes'];

    // 현재 선택 컬러 기준으로 팔레트 hex 가져오기
    const getBgHex = (item: typeof BG_PALETTE_BASE[0]) => {
        const col = item.palettes[colorId] ?? Object.values(item.palettes)[0];
        return dark ? col.dark : col.light;
    };

    const cardStyle = {
        background: dark ? '#1e293b' : '#ffffff',
        borderColor: dark ? '#334155' : '#e5e7eb',
    };

    const sectionTitle = (label: string) => (
        <h4 className="text-xs font-black mb-4 uppercase tracking-wider" style={{ color: dark ? '#64748b' : '#9ca3af' }}>
            {label}
        </h4>
    );

    const subLabel = (label: string) => (
        <p className="text-[10px] font-bold mb-2" style={{ color: dark ? '#94a3b8' : '#6b7280' }}>{label}</p>
    );

    return (
        <div className="flex-1 overflow-y-auto h-full" style={{ background: dark ? '#0f172a' : '#f9fafb' }}>
            <div className="max-w-6xl mx-auto p-8 py-10">
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-3xl font-black tracking-tight" style={{ color: dark ? '#f1f5f9' : '#111827' }}>
                            UI 디자인 시스템
                        </h1>
                        <p className="mt-2 font-medium" style={{ color: dark ? '#94a3b8' : '#6b7280' }}>
                            관리자(Admin) 공통 화면의 컬러·둥글기·다크모드를 커스터마이징합니다.
                        </p>
                    </div>
                </div>

                {/* ─── 설정 패널: 3열 같은 행 ─── */}
                <div className="grid grid-cols-3 gap-4 mb-4">

                    {/* 화면 모드 */}
                    <div className="rounded-[var(--theme-radius)] border p-5 shadow-sm" style={cardStyle}>
                        <h3 className="text-xs font-bold mb-3 flex items-center gap-1.5" style={{ color: dark ? '#f1f5f9' : '#111827' }}>
                            {dark ? <Moon size={13} className="text-indigo-400" /> : <Sun size={13} className="text-amber-400" />}
                            화면 모드
                        </h3>
                        <button
                            onClick={toggleDarkMode}
                            className="w-full flex items-center justify-between p-3 rounded-xl border-2 transition-all"
                            style={{ background: dark ? '#0f172a' : '#f8fafc', borderColor: dark ? '#6366f1' : '#e2e8f0' }}
                        >
                            <div className="flex items-center gap-2">
                                <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${dark ? 'bg-indigo-500/20' : 'bg-amber-400/20'}`}>
                                    {dark ? <Moon size={15} className="text-indigo-400" /> : <Sun size={15} className="text-amber-500" />}
                                </div>
                                <div className="text-left">
                                    <p className="text-xs font-black" style={{ color: dark ? '#f1f5f9' : '#1e293b' }}>
                                        {dark ? 'Night' : 'Day'}
                                    </p>
                                    <p className="text-[9px]" style={{ color: dark ? '#94a3b8' : '#64748b' }}>
                                        {dark ? '다크 모드' : '라이트 모드'}
                                    </p>
                                </div>
                            </div>
                            <div className="relative w-11 h-6 rounded-full transition-all duration-300 flex-shrink-0"
                                style={{ background: dark ? '#6366f1' : '#d1d5db' }}>
                                <motion.div layout transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                                    className="absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-md"
                                    style={{ left: dark ? '22px' : '2px' }} />
                            </div>
                        </button>
                    </div>

                    {/* 메인 컬러 */}
                    <div className="rounded-[var(--theme-radius)] border p-5 shadow-sm" style={cardStyle}>
                        <h3 className="text-xs font-bold mb-3 flex items-center gap-1.5" style={{ color: dark ? '#f1f5f9' : '#111827' }}>
                            <Palette size={13} className="text-gray-400" />
                            메인 컬러
                        </h3>
                    <div className="grid grid-cols-3 gap-2">
                            {THEME_COLORS.map(c => (
                                <button
                                    key={c.id}
                                    onClick={() => setTheme(prev => ({ ...prev, primaryColor: c.id }))}
                                    className="flex items-center gap-2 p-2 rounded-xl border-2 transition-all"
                                    style={{
                                        borderColor: theme.primaryColor === c.id ? c.hex : 'transparent',
                                        background: theme.primaryColor === c.id ? (dark ? '#334155' : '#f9fafb') : (dark ? '#1e293b' : 'transparent'),
                                        boxShadow: theme.primaryColor === c.id ? `0 0 0 1px ${c.hex}22` : 'none',
                                    }}
                                >
                                    <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: c.hex }}>
                                        {theme.primaryColor === c.id && <Check size={10} className="text-white" />}
                                    </div>
                                    <span className="text-xs font-bold truncate" style={{ color: dark ? '#e2e8f0' : '#374151' }}>{c.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* 모서리 곡률 */}
                    <div className="rounded-[var(--theme-radius)] border p-5 shadow-sm" style={cardStyle}>
                        <h3 className="text-xs font-bold mb-3 flex items-center gap-1.5" style={{ color: dark ? '#f1f5f9' : '#111827' }}>
                            <LayoutTemplate size={13} className="text-gray-400" />
                            모서리 곡률 (Border Radius)
                        </h3>
                        <div className="grid grid-cols-5 gap-1.5">
                            {BORDER_RADII.map(r => (
                                <button
                                    key={r.id}
                                    onClick={() => setTheme(prev => ({ ...prev, borderRadius: r.id }))}
                                    className="flex flex-col items-center gap-1.5 p-2 rounded-xl border-2 transition-all"
                                    style={{
                                        borderColor: theme.borderRadius === r.id ? 'var(--theme-primary)' : (dark ? '#334155' : '#f3f4f6'),
                                        background: theme.borderRadius === r.id ? 'var(--theme-primary-bg)' : (dark ? '#0f172a' : '#ffffff'),
                                    }}
                                >
                                    <div className="w-7 h-7 border-2" style={{ borderRadius: r.id, borderColor: dark ? '#475569' : '#d1d5db' }} />
                                    <span className="text-[9px] font-bold text-center leading-tight" style={{ color: dark ? '#e2e8f0' : '#374151' }}>{r.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* 초기화 버튼 */}
                <div className="mb-8">
                    <AdminButton variant="outline" icon={RefreshCw} onClick={resetTheme}>
                        시스템 초기화
                    </AdminButton>
                </div>

                {/* ─── 배경색 팔레트 ─── */}
                <div className="rounded-[var(--theme-radius)] border p-6 shadow-sm mb-6" style={cardStyle}>
                    <h2 className="text-lg font-black mb-1 flex items-center gap-2"
                        style={{ color: dark ? '#f1f5f9' : '#111827' }}>
                        <Layers size={20} className="text-gray-400" />
                        배경색 팔레트
                    </h2>
                    <p className="text-xs mb-5" style={{ color: dark ? '#64748b' : '#9ca3af' }}>
                        현재 화면 모드 (<strong>{dark ? 'Night · 다크' : 'Day · 라이트'}</strong>)에서 적용되는 바탕색 목록입니다.
                        항목을 추가하려면 <code>AdminThemeContext.tsx</code>와 <code>BG_PALETTE</code> 배열을 함께 수정하세요.
                    </p>

                    {/* 배경색 그리드 — 3컬럼 */}
                    <div className="grid grid-cols-3 gap-3">
                        {BG_PALETTE_BASE.map(bg => {
                            const hexVal = getBgHex(bg);
                            return (
                            <div
                                key={bg.cssVar}
                                className="rounded-xl border overflow-hidden shadow-sm"
                                style={{ borderColor: dark ? '#334155' : '#e5e7eb' }}
                            >
                                {/* 색상 스와치 */}
                                <div
                                    className="h-14 w-full border-b relative"
                                    style={{
                                        backgroundColor: `var(${bg.cssVar})`,
                                        borderColor: dark ? '#334155' : '#e5e7eb',
                                    }}
                                >
                                    {/* hex 값 오버레이 */}
                                    <span
                                        className="absolute bottom-1.5 right-2 text-[10px] font-mono font-bold px-1.5 py-0.5 rounded"
                                        style={{
                                            background: dark ? 'rgba(15,23,42,0.6)' : 'rgba(255,255,255,0.7)',
                                            color: dark ? '#cbd5e1' : '#374151',
                                        }}
                                    >
                                        {hexVal}
                                    </span>
                                </div>
                                {/* 설명 */}
                                <div className="px-3 py-2" style={{ background: dark ? '#1e293b' : '#ffffff' }}>
                                    <p className="text-[11px] font-black truncate" style={{ color: dark ? '#e2e8f0' : '#1f2937' }}>
                                        {bg.label}
                                    </p>
                                    <p className="text-[9px] truncate mt-0.5" style={{ color: dark ? '#475569' : '#9ca3af' }}>
                                        {bg.desc}
                                    </p>
                                    <code className="text-[9px] font-mono" style={{ color: dark ? '#64748b' : '#c4b5fd' }}>
                                        {bg.cssVar}
                                    </code>
                                </div>
                            </div>
                        )})}
                    </div>
                </div>

                {/* ─── UI 공통 컴포넌트 미리보기 ─── */}
                <div
                    className="rounded-[var(--theme-radius)] border p-8 shadow-sm"
                    style={cardStyle}
                >
                    <h2 className="text-lg font-black mb-6 pb-4 border-b flex items-center gap-2"
                        style={{ color: dark ? '#f1f5f9' : '#111827', borderColor: dark ? '#334155' : '#f3f4f6' }}>
                        <Settings2 className="text-gray-400" />
                        UI 공통 컴포넌트 미리보기
                    </h2>

                    <div className="grid grid-cols-2 gap-10">

                        {/* ── 왼쪽 컬럼 ── */}
                        <div className="flex flex-col gap-10">

                            {/* Button System */}
                            <section>
                                {sectionTitle('Button System')}
                                <div className="flex flex-col gap-4">
                                    <div className="flex flex-wrap gap-3 items-end">
                                        {[
                                            { v: 'primary' as const, icon: Plus, label: '추가' },
                                            { v: 'success' as const, icon: Check, label: '저장' },
                                            { v: 'danger' as const, icon: Trash2, label: '삭제' },
                                            { v: 'outline' as const, icon: Edit2, label: '수정' },
                                            { v: 'secondary' as const, icon: undefined, label: '목록' },
                                        ].map(({ v, icon, label }) => (
                                            <div key={v} className="flex flex-col gap-1.5">
                                                <span className="text-[10px] font-bold capitalize" style={{ color: dark ? '#94a3b8' : '#6b7280' }}>{v}</span>
                                                <AdminButton variant={v} icon={icon}>{label}</AdminButton>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="p-3 rounded-xl flex items-center gap-3" style={{ background: dark ? '#0f172a' : '#f9fafb' }}>
                                        <AdminButton size="sm">Small</AdminButton>
                                        <AdminButton size="md">Medium</AdminButton>
                                        <AdminButton size="lg">Large</AdminButton>
                                    </div>
                                    <div>
                                        {subLabel('탭 바 (Tab Bar)')}
                                        <div className="flex gap-1 rounded-2xl p-1 w-full" style={{ background: 'var(--theme-primary-bg)' }}>
                                            {['업체별기기', '컨텐츠관리', '단말기등록'].map((label, i) => (
                                                <button key={label}
                                                    className="flex-1 py-2 rounded-xl text-xs font-black transition-all"
                                                    style={i === 0 ? {
                                                        background: 'var(--theme-primary)',
                                                        color: '#ffffff',
                                                        boxShadow: '0 1px 3px rgba(0,0,0,0.18)'
                                                    } : {
                                                        color: 'var(--theme-primary-text)',
                                                        opacity: 0.6
                                                    }}>
                                                    {label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    <div>
                                        {subLabel('방향 토글 스위치')}
                                        <div className="flex items-center gap-3">
                                            <span className="text-xs font-bold" style={{ color: 'var(--theme-primary)' }}>가로</span>
                                            <div className="relative w-10 h-5 rounded-full" style={{ background: 'var(--theme-primary)' }}>
                                                <span className="absolute top-0.5 right-0.5 w-4 h-4 bg-white rounded-full shadow" />
                                            </div>
                                            <span className="text-xs font-bold text-gray-400">세로</span>
                                        </div>
                                    </div>
                                    <div>
                                        {subLabel('컨텐츠 유형 탭 (AI / 일반)')}
                                        <div className="flex gap-1 bg-gray-100 rounded-xl p-1 w-fit">
                                            <button className="px-4 py-1.5 rounded-lg text-xs font-black text-white shadow"
                                                style={{ background: 'var(--theme-primary)' }}>AI 컨텐츠</button>
                                            <button className="px-4 py-1.5 rounded-lg text-xs font-black text-gray-400">일반 컨텐츠</button>
                                        </div>
                                    </div>
                                </div>
                            </section>

                            {/* Form Elements */}
                            <section>
                                {sectionTitle('Form Elements')}
                                <div className="flex flex-col gap-4">
                                    <div>
                                        {subLabel('텍스트 인풋 (기본)')}
                                        <input
                                            className="w-full border rounded-[var(--theme-radius)] px-3 py-2 text-sm outline-none"
                                            style={{ background: 'var(--admin-input-bg)', borderColor: dark ? '#334155' : '#d1d5db', color: dark ? '#f1f5f9' : '#111827' }}
                                            placeholder="여기에 입력하세요..."
                                            readOnly
                                        />
                                    </div>
                                    <div>
                                        {subLabel('포커스 상태')}
                                        <input
                                            className="w-full border-2 rounded-[var(--theme-radius)] px-3 py-2 text-sm outline-none"
                                            style={{ background: 'var(--admin-input-bg)', borderColor: 'var(--theme-primary)', color: dark ? '#f1f5f9' : '#111827' }}
                                            defaultValue="포커스된 인풋"
                                            readOnly
                                        />
                                    </div>
                                    <div>
                                        {subLabel('태그 칩 (Tag Chip)')}
                                        <div className="flex flex-wrap gap-1.5">
                                            {['블라인드', '홍보', '봄', '시공영상', '컬러'].map(tag => (
                                                <span key={tag}
                                                    className="flex items-center gap-1 text-[11px] font-bold rounded-full px-2.5 py-1"
                                                    style={{ background: 'var(--theme-primary-bg)', color: 'var(--theme-primary-text)' }}>
                                                    #{tag}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </section>
                        </div>

                        {/* ── 오른쪽 컬럼 ── */}
                        <div className="flex flex-col gap-10">

                            {/* Container Shape */}
                            <section>
                                {sectionTitle('Container Shape')}
                                <div className="flex flex-col gap-4">
                                    <div className="p-5 border" style={{ borderRadius: 'var(--theme-radius)', background: 'var(--admin-surface)', borderColor: dark ? '#334155' : '#e5e7eb' }}>
                                        <h5 className="font-bold mb-2" style={{ color: dark ? '#f1f5f9' : '#1f2937' }}>기본 패널</h5>
                                        <p className="text-sm mb-4" style={{ color: dark ? '#94a3b8' : '#6b7280' }}>Radius + admin-surface 배경</p>
                                        <AdminButton size="sm" variant="primary">자세히 보기</AdminButton>
                                    </div>
                                    <div className="p-5 border" style={{ borderRadius: 'var(--theme-radius)', background: 'var(--theme-primary-bg)', borderColor: 'var(--theme-primary)' }}>
                                        <h5 className="font-bold text-[var(--theme-primary-text)] mb-2">강조 패널</h5>
                                        <p className="text-sm text-[var(--theme-primary-text)] opacity-80">메인 컬러 강조 알림 예시</p>
                                    </div>
                                    {/* 그리드 헤더 예시 */}
                                    <div>
                                        {subLabel('그리드 헤더 (Grid Header)')}
                                        <div className="overflow-hidden rounded-xl border" style={{ borderColor: dark ? '#334155' : '#e5e7eb' }}>
                                            <div className="grid grid-cols-3 text-[11px] font-black px-3 py-2" style={{ background: 'var(--admin-grid-header)', color: dark ? '#94a3b8' : '#6b7280' }}>
                                                <span>단말기명</span><span>상태</span><span>등록일</span>
                                            </div>
                                            {[['키오스크 A', '재생중', '2024-01'], ['키오스크 B', '비활성', '2024-02']].map(([name, status, date], i) => (
                                                <div key={name} className="grid grid-cols-3 text-xs px-3 py-2 border-t"
                                                    style={{ background: i % 2 === 0 ? 'var(--admin-list-bg)' : 'var(--admin-list-alt)', borderColor: dark ? '#334155' : '#f3f4f6', color: dark ? '#e2e8f0' : '#374151' }}>
                                                    <span>{name}</span><span>{status}</span><span>{date}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </section>

                            {/* Status & Badge */}
                            <section>
                                {sectionTitle('Status & Badge')}
                                <div className="flex flex-col gap-4">
                                    <div>
                                        {subLabel('단말기 상태 배지')}
                                        <div className="flex flex-wrap gap-2">
                                            {[
                                                { label: '재생중', bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-200', dot: 'bg-emerald-500' },
                                                { label: '비활성', bg: 'bg-gray-50', text: 'text-gray-600', border: 'border-gray-200', dot: 'bg-gray-400' },
                                                { label: '고장', bg: 'bg-red-50', text: 'text-red-600', border: 'border-red-200', dot: 'bg-red-500' },
                                                { label: '연결끊김', bg: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-200', dot: 'bg-amber-500' },
                                            ].map(s => (
                                                <span key={s.label} className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full border ${s.bg} ${s.text} ${s.border}`}>
                                                    <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
                                                    {s.label}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                    <div>
                                        {subLabel('사이드바 메뉴 활성 상태')}
                                        <div className="flex flex-col gap-1 p-2 rounded-xl" style={{ background: 'var(--admin-sidebar-bg)', border: `1px solid ${dark ? '#334155' : '#e5e7eb'}` }}>
                                            {['기본설정', '기기관리', 'UI 설정'].map((label, i) => (
                                                <div key={label}
                                                    className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-bold"
                                                    style={i === 0 ? { color: 'var(--theme-primary)', background: 'var(--theme-primary-bg)' }
                                                        : { color: dark ? '#64748b' : '#9ca3af' }}>
                                                    <span className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                                                        style={{ background: i === 0 ? 'var(--theme-primary)' : '#d1d5db' }} />
                                                    {label}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </section>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};
