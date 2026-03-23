
import React, { useMemo } from 'react';
import {
    LayoutDashboard, Calendar, Users, TrendingUp,
    UserPlus, UserMinus, Bell, Building2, ShoppingBag, Factory,
    Truck, Globe, Utensils, Store,
} from 'lucide-react';
import { usePartnerContext } from '../PartnerContext';
import { PartnerData, PartnerType } from '../types';
import { useAdminTheme } from './theme/AdminThemeContext';

// ─── 샘플 데이터 ──────────────────────────────────────────────
const now = new Date();
const currentYear = now.getFullYear();
const currentMonth = now.getMonth() + 1;
const prevMonth = currentMonth === 1 ? 12 : currentMonth - 1;
const prevYear = currentMonth === 1 ? currentYear - 1 : currentYear;

const SALES_DATA = {
    currentMonth: 450_000_000,
    prevMonth: 380_000_000,
    currentYearCumulative: 2_840_000_000,
    prevYearTotal: 4_120_000_000,
};

const NOTICES = [
    { id: 1, date: `${currentYear}-03-01`, title: '2026년 3월 시스템 점검 안내', important: true },
    { id: 2, date: `${currentYear}-02-28`, title: '신규 원단 공급사 등록 안내', important: false },
    { id: 3, date: `${currentYear}-02-25`, title: '거래처 계약 갱신 기한 알림', important: true },
    { id: 4, date: `${currentYear}-02-20`, title: '매출 정산 일정 변경 공지', important: false },
    { id: 5, date: `${currentYear}-02-15`, title: '앱 업데이트 배포 안내 v2.4.1', important: false },
];

type RoleKey = 'DISTRIBUTOR' | 'FABRIC_SUPPLIER' | 'MANUFACTURER' | 'AGENCY' | 'INTERNET_MEMBER' | 'FOOD_DISTRIBUTOR';

interface PartnerCategoryConfig {
    label: string;
    icon: React.ElementType;
    type?: PartnerType;
}

const CATEGORY_CONFIGS: Record<RoleKey, PartnerCategoryConfig> = {
    DISTRIBUTOR: { label: '유통관리사', icon: Truck, type: 'DISTRIBUTOR' },
    FABRIC_SUPPLIER: { label: '원단공급사', icon: Factory, type: 'FABRIC_SUPPLIER' },
    MANUFACTURER: { label: '제조공급사', icon: Building2, type: 'MANUFACTURER' },
    AGENCY: { label: '가맹대리점', icon: Store, type: 'AGENCY' },
    INTERNET_MEMBER: { label: '인터넷회원', icon: Globe },
    FOOD_DISTRIBUTOR: { label: '식자재유통', icon: Utensils },
};

const fmt = (v: number) =>
    v >= 100_000_000
        ? `${(v / 100_000_000).toFixed(1)}억`
        : v >= 10_000
            ? `${(v / 10_000).toLocaleString()}만`
            : v.toLocaleString();

const fmtFull = (v: number) => v.toLocaleString() + '원';

const ADDED_PARTNERS: { name: string; type: PartnerType; date: string }[] = [
    { name: '대전홈데코', type: 'AGENCY', date: `${currentYear}-0${currentMonth}-05` },
    { name: '(주)팬텍스', type: 'FABRIC_SUPPLIER', date: `${currentYear}-0${currentMonth}-08` },
    { name: '뷰티창호', type: 'MANUFACTURER', date: `${currentYear}-0${currentMonth}-12` },
    { name: '수원블라인드', type: 'AGENCY', date: `${currentYear}-0${currentMonth}-14` },
    { name: '경기유통', type: 'DISTRIBUTOR', date: `${currentYear}-0${currentMonth}-17` },
];
const REMOVED_PARTNERS: { name: string; type: PartnerType; date: string }[] = [
    { name: '구리인테리어', type: 'AGENCY', date: `${currentYear}-0${currentMonth}-03` },
    { name: '청주원단', type: 'FABRIC_SUPPLIER', date: `${currentYear}-0${currentMonth}-11` },
];

// ─── 메인 컴포넌트 ────────────────────────────────────────────
const AdminDashboard: React.FC = () => {
    const { partners } = usePartnerContext();
    const { primaryColor } = useAdminTheme();

    const formattedDate = `${now.getFullYear()}. ${String(now.getMonth() + 1).padStart(2, '0')}. ${String(now.getDate()).padStart(2, '0')}`;

    const statsByType = useMemo(() => {
        const total = partners.length;
        const byType: Record<string, number> = {};
        partners.forEach(p => { byType[p.type] = (byType[p.type] || 0) + 1; });
        return { total, byType };
    }, [partners]);

    const categoryCards = (Object.entries(CATEGORY_CONFIGS) as [RoleKey, PartnerCategoryConfig][]).map(([key, cfg]) => {
        const curr = statsByType.byType[cfg.type ?? ''] ?? 0;
        const added = Math.floor(Math.random() * 5) + 1;
        const removed = Math.floor(Math.random() * 2);
        const prev = curr - added + removed;
        const prevAdded = Math.floor(Math.random() * 4);
        const prevRemoved = Math.floor(Math.random() * 2);
        return { key, cfg, curr, added, removed, prev, prevAdded, prevRemoved };
    });

    const salesChange = ((SALES_DATA.currentMonth - SALES_DATA.prevMonth) / SALES_DATA.prevMonth * 100).toFixed(1);
    const isUp = SALES_DATA.currentMonth >= SALES_DATA.prevMonth;

    return (
        <div className="flex-1 flex flex-col h-full overflow-hidden font-sans" style={{ background: 'var(--admin-bg)' }}>
            {/* ── 헤더 ── */}
            <div className="flex-shrink-0 border-b px-8 py-5 shadow-sm z-20 flex items-center justify-between h-20"
                style={{ background: 'var(--admin-surface)', borderColor: 'var(--admin-border)' }}>
                <div className="flex items-center gap-3">
                    <LayoutDashboard size={28} style={{ color: 'var(--theme-primary)' }} />
                    <div>
                        <h1 className="text-2xl font-bold" style={{ color: 'var(--admin-text)' }}>기본현황</h1>
                        <p className="text-xs mt-0.5 flex items-center gap-1.5" style={{ color: 'var(--admin-text-sub)' }}>
                            <Calendar size={11} /> {formattedDate} &nbsp;·&nbsp; 총괄관리사 대시보드
                        </p>
                    </div>
                </div>
                <div className="text-right">
                    <p className="text-xs mb-0.5" style={{ color: 'var(--admin-text-sub)' }}>총 거래처 수</p>
                    <p className="text-3xl font-black" style={{ color: 'var(--theme-primary)' }}>
                        {statsByType.total}<span className="text-lg font-semibold ml-1" style={{ color: 'var(--admin-text-sub)' }}>사</span>
                    </p>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6" style={{ scrollbarWidth: 'thin' }}>

                {/* ── 1. 종류별 거래처 카드 ── */}
                <section>
                    <h2 className="text-sm font-bold mb-3 flex items-center gap-2" style={{ color: 'var(--admin-text-sub)' }}>
                        <Users size={15} style={{ color: 'var(--theme-primary)' }} /> 종류별 거래처 현황
                    </h2>
                    <div className="grid grid-cols-3 gap-4">
                        {categoryCards.map(({ key, cfg, curr, added, removed, prev, prevAdded, prevRemoved }) => {
                            const Icon = cfg.icon;
                            return (
                                <div key={key} className="rounded-2xl shadow-sm overflow-hidden"
                                    style={{ background: 'var(--admin-surface)', border: '1.5px solid var(--admin-border)' }}>
                                    {/* 카드 헤더 */}
                                    <div className="px-4 py-3 flex items-center gap-2 border-b"
                                        style={{ background: 'var(--theme-primary-bg)', borderColor: 'var(--admin-border)' }}>
                                        <div className="p-1.5 rounded-lg" style={{ background: 'var(--admin-surface)', color: 'var(--theme-primary)' }}>
                                            <Icon size={15} />
                                        </div>
                                        <span className="text-sm font-bold" style={{ color: 'var(--theme-primary)' }}>{cfg.label}</span>
                                        <span className="ml-auto text-2xl font-black" style={{ color: 'var(--admin-text)' }}>{curr}</span>
                                        <span className="text-xs font-normal" style={{ color: 'var(--admin-text-sub)' }}>사</span>
                                    </div>
                                    {/* 카드 바디 */}
                                    <div className="grid grid-cols-2 divide-x" style={{ borderColor: 'var(--admin-border)' }}>
                                        {/* 당월 */}
                                        <div className="px-4 py-3">
                                            <p className="text-[10px] font-bold mb-2" style={{ color: 'var(--theme-primary)' }}>당월</p>
                                            <div className="space-y-1">
                                                <div className="flex justify-between text-xs">
                                                    <span style={{ color: 'var(--admin-text-sub)' }}>추가</span>
                                                    <span className="font-bold text-emerald-600">+{added}</span>
                                                </div>
                                                <div className="flex justify-between text-xs">
                                                    <span style={{ color: 'var(--admin-text-sub)' }}>탈퇴</span>
                                                    <span className="font-bold text-red-400">-{removed}</span>
                                                </div>
                                            </div>
                                        </div>
                                        {/* 전월 */}
                                        <div className="px-4 py-3">
                                            <p className="text-[10px] font-bold mb-2" style={{ color: 'var(--admin-text-sub)' }}>전월 ({prev}사)</p>
                                            <div className="space-y-1">
                                                <div className="flex justify-between text-xs">
                                                    <span style={{ color: 'var(--admin-text-sub)' }}>추가</span>
                                                    <span className="font-bold" style={{ color: 'var(--admin-text)' }}>+{prevAdded}</span>
                                                </div>
                                                <div className="flex justify-between text-xs">
                                                    <span style={{ color: 'var(--admin-text-sub)' }}>탈퇴</span>
                                                    <span className="font-bold" style={{ color: 'var(--admin-text-sub)' }}>-{prevRemoved}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </section>

                {/* ── 2. 매출 현황 ── */}
                <section>
                    <h2 className="text-sm font-bold mb-3 flex items-center gap-2" style={{ color: 'var(--admin-text-sub)' }}>
                        <TrendingUp size={15} style={{ color: 'var(--theme-primary)' }} /> 매출 현황
                    </h2>
                    <div className="grid grid-cols-4 gap-4">
                        {[
                            {
                                label: '당월 매출',
                                sublabel: `${currentYear}년 ${currentMonth}월`,
                                value: SALES_DATA.currentMonth,
                                isPrimary: true,
                                badge: isUp ? `▲ ${salesChange}%` : `▼ ${Math.abs(Number(salesChange))}%`,
                                badgeUp: isUp,
                            },
                            {
                                label: '전월 매출',
                                sublabel: `${prevYear}년 ${prevMonth}월`,
                                value: SALES_DATA.prevMonth,
                                isPrimary: false,
                            },
                            {
                                label: '당해년 누적',
                                sublabel: `${currentYear}년 1~${currentMonth}월`,
                                value: SALES_DATA.currentYearCumulative,
                                isPrimary: false,
                                isAccent: true,
                            },
                            {
                                label: '전년 연간',
                                sublabel: `${currentYear - 1}년 전체`,
                                value: SALES_DATA.prevYearTotal,
                                isPrimary: false,
                            },
                        ].map(card => (
                            <div key={card.label}
                                className="rounded-2xl shadow-sm p-5 transition-all"
                                style={{
                                    background: card.isPrimary ? 'var(--theme-primary-bg)' : 'var(--admin-surface)',
                                    border: card.isPrimary
                                        ? '1.5px solid var(--theme-primary)'
                                        : '1.5px solid var(--admin-border)',
                                    boxShadow: card.isPrimary ? '0 0 0 3px color-mix(in srgb, var(--theme-primary) 10%, transparent)' : undefined,
                                }}>
                                <div className="flex items-center justify-between mb-1">
                                    <span className="text-xs font-bold"
                                        style={{ color: card.isPrimary ? 'var(--theme-primary)' : 'var(--admin-text-sub)' }}>
                                        {card.label}
                                    </span>
                                    {card.badge && (
                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${card.badgeUp ? 'text-emerald-600 bg-emerald-50' : 'text-red-500 bg-red-50'}`}>
                                            {card.badge}
                                        </span>
                                    )}
                                </div>
                                <p className="text-[10px] mb-3" style={{ color: 'var(--admin-text-sub)' }}>{card.sublabel}</p>
                                <p className="text-xl font-black font-mono" style={{ color: card.isPrimary ? 'var(--theme-primary)' : 'var(--admin-text)' }}>
                                    {fmt(card.value)}
                                </p>
                                <p className="text-[10px] mt-1 font-mono" style={{ color: 'var(--admin-text-sub)' }}>{fmtFull(card.value)}</p>
                            </div>
                        ))}
                    </div>
                </section>

                {/* ── 3. 당월 추가/탈퇴 리스트 ── */}
                <div className="grid grid-cols-2 gap-4">
                    {/* 추가된 거래처 */}
                    <section className="rounded-2xl shadow-sm overflow-hidden"
                        style={{ background: 'var(--admin-surface)', border: '1.5px solid var(--admin-border)' }}>
                        <div className="px-5 py-3 border-b flex items-center gap-2"
                            style={{ background: 'var(--theme-primary-bg)', borderColor: 'var(--admin-border)' }}>
                            <UserPlus size={15} style={{ color: 'var(--theme-primary)' }} />
                            <h2 className="text-sm font-bold" style={{ color: 'var(--theme-primary)' }}>당월 추가 거래처</h2>
                            <span className="ml-auto text-xs font-bold px-2 py-0.5 rounded-full"
                                style={{ color: 'var(--theme-primary)', background: 'var(--admin-surface)', border: '1px solid var(--theme-primary)' }}>
                                {ADDED_PARTNERS.length}건
                            </span>
                        </div>
                        <div className="divide-y" style={{ borderColor: 'var(--admin-border)' }}>
                            {ADDED_PARTNERS.map((p, i) => {
                                const cfg = CATEGORY_CONFIGS[p.type as RoleKey];
                                const Icon = cfg?.icon ?? Store;
                                return (
                                    <div key={i} className="flex items-center px-5 py-3 transition-colors"
                                        onMouseEnter={e => (e.currentTarget.style.background = 'var(--theme-primary-bg)')}
                                        onMouseLeave={e => (e.currentTarget.style.background = '')}>
                                        <span className="p-1.5 rounded-lg mr-3"
                                            style={{ background: 'var(--theme-primary-bg)', color: 'var(--theme-primary)' }}>
                                            <Icon size={12} />
                                        </span>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-bold truncate" style={{ color: 'var(--admin-text)' }}>{p.name}</p>
                                            <p className="text-[10px]" style={{ color: 'var(--admin-text-sub)' }}>{cfg?.label ?? p.type}</p>
                                        </div>
                                        <span className="text-xs font-mono whitespace-nowrap" style={{ color: 'var(--admin-text-sub)' }}>{p.date}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </section>

                    {/* 탈퇴한 거래처 */}
                    <section className="rounded-2xl shadow-sm overflow-hidden"
                        style={{ background: 'var(--admin-surface)', border: '1.5px solid var(--admin-border)' }}>
                        <div className="px-5 py-3 bg-red-50 border-b border-red-100 flex items-center gap-2">
                            <UserMinus size={15} className="text-red-500" />
                            <h2 className="text-sm font-bold text-red-600">당월 탈퇴 거래처</h2>
                            <span className="ml-auto text-xs font-bold text-red-500 bg-white px-2 py-0.5 rounded-full border border-red-200">
                                {REMOVED_PARTNERS.length}건
                            </span>
                        </div>
                        <div className="divide-y divide-gray-50">
                            {REMOVED_PARTNERS.length === 0 ? (
                                <div className="flex items-center justify-center h-24 text-sm" style={{ color: 'var(--admin-text-sub)' }}>
                                    탈퇴 거래처 없음
                                </div>
                            ) : REMOVED_PARTNERS.map((p, i) => {
                                const cfg = CATEGORY_CONFIGS[p.type as RoleKey];
                                const Icon = cfg?.icon ?? Store;
                                return (
                                    <div key={i} className="flex items-center px-5 py-3 hover:bg-gray-50 transition-colors">
                                        <span className="p-1.5 rounded-lg bg-gray-100 mr-3">
                                            <Icon size={12} className="text-gray-400" />
                                        </span>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-bold text-gray-400 truncate line-through">{p.name}</p>
                                            <p className="text-[10px] text-gray-300">{cfg?.label ?? p.type}</p>
                                        </div>
                                        <span className="text-xs text-gray-300 font-mono whitespace-nowrap">{p.date}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </section>
                </div>

                {/* ── 4. 공지리스트 ── */}
                <section className="rounded-2xl shadow-sm overflow-hidden"
                    style={{ background: 'var(--admin-surface)', border: '1.5px solid var(--admin-border)' }}>
                    <div className="px-5 py-3 border-b flex items-center gap-2"
                        style={{ background: 'var(--theme-primary-bg)', borderColor: 'var(--admin-border)' }}>
                        <Bell size={15} style={{ color: 'var(--theme-primary)' }} />
                        <h2 className="text-sm font-bold" style={{ color: 'var(--admin-text)' }}>공지 리스트</h2>
                        <span className="ml-auto text-xs" style={{ color: 'var(--admin-text-sub)' }}>{NOTICES.length}건</span>
                    </div>
                    <div className="divide-y" style={{ borderColor: 'var(--admin-border)' }}>
                        {NOTICES.map(n => (
                            <div key={n.id}
                                className="flex items-center px-5 py-3.5 cursor-pointer group transition-colors"
                                onMouseEnter={e => (e.currentTarget.style.background = 'var(--theme-primary-bg)')}
                                onMouseLeave={e => (e.currentTarget.style.background = '')}>
                                {n.important && (
                                    <span className="text-[10px] font-black text-red-500 bg-red-50 border border-red-200 px-1.5 py-0.5 rounded mr-3 whitespace-nowrap">중요</span>
                                )}
                                <span className="text-sm flex-1 font-medium transition-colors" style={{ color: 'var(--admin-text)' }}>
                                    {n.title}
                                </span>
                                <span className="text-xs font-mono whitespace-nowrap ml-4" style={{ color: 'var(--admin-text-sub)' }}>{n.date}</span>
                            </div>
                        ))}
                    </div>
                </section>

            </div>
        </div>
    );
};

export default AdminDashboard;
