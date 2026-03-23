
import React, { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, TrendingUp, TrendingDown, Wrench, Ruler, Users, Truck, ArrowRightFromLine, Package, Send, Briefcase, MoreHorizontal, Phone, MapPin, Clock, CheckCircle2, AlertCircle, Minus } from 'lucide-react';

// --- Types ---
interface ScheduleItem {
    id: string;
    time: string;
    category: string;
    windowCount: number;
    customerName: string;
    phone: string;
    address: string;
    note: string;
    report: string;
    status: '완료' | '진행중' | '예정' | '취소';
}

interface DaySummary {
    시공: number;
    실측: number;
    미팅: number;
    배송: number;
    직출: number;
    수화물: number;
    송화물: number;
    출장: number;
    기타: number;
}

// --- Mock Data Generator ---
const CUSTOMER_NAMES = ['김민수', '이서준', '박도현', '최예준', '정지훈', '강우진', '조건우', '윤하준', '장주원', '임지우', '한소희', '송여진', '오지민', '서다은', '류재현'];
const ADDRESSES = [
    '서울 강남구 테헤란로 123', '서울 서초구 반포대로 45', '서울 송파구 올림픽로 67',
    '서울 마포구 월드컵로 89', '서울 영등포구 여의대로 12', '경기 성남시 분당구 판교로 34',
    '서울 강동구 천호대로 56', '서울 노원구 동일로 78', '경기 용인시 수지구 성복로 90',
    '서울 관악구 관악로 11', '서울 동작구 상도로 22', '경기 고양시 일산서구 중앙로 33'
];
const CATEGORIES = ['시공', '실측', '미팅', '배송', '직출', '수화물', '송화물', '출장', '기타'];
const STATUSES: Array<'완료' | '진행중' | '예정' | '취소'> = ['완료', '진행중', '예정', '취소'];
const TIMES = ['08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00'];

const generateScheduleForDay = (year: number, month: number, day: number): ScheduleItem[] => {
    // Seed-like deterministic generation based on date
    const seed = year * 10000 + month * 100 + day;
    const count = (seed % 5) + 2; // 2~6 items per day
    const items: ScheduleItem[] = [];

    for (let i = 0; i < count; i++) {
        const idx = (seed * (i + 1)) % CUSTOMER_NAMES.length;
        const catIdx = (seed + i * 3) % CATEGORIES.length;
        const statusIdx = (seed + i * 7) % STATUSES.length;
        const timeIdx = (seed + i * 2) % TIMES.length;

        items.push({
            id: `sch-${year}-${month}-${day}-${i}`,
            time: TIMES[timeIdx],
            category: CATEGORIES[catIdx],
            windowCount: ((seed + i) % 8) + 1,
            customerName: CUSTOMER_NAMES[idx],
            phone: `010-${String(1000 + (seed + i) % 9000).padStart(4, '0')}-${String(1000 + (seed * i) % 9000).padStart(4, '0')}`,
            address: ADDRESSES[(seed + i) % ADDRESSES.length],
            note: i % 3 === 0 ? '오전 방문 요청' : i % 3 === 1 ? '현장확인 필요' : '',
            report: statusIdx === 0 ? '정상 완료' : statusIdx === 1 ? '진행 중' : '',
            status: STATUSES[statusIdx],
        });
    }

    return items.sort((a, b) => a.time.localeCompare(b.time));
};

const getDaySummary = (items: ScheduleItem[]): DaySummary => {
    const summary: DaySummary = { 시공: 0, 실측: 0, 미팅: 0, 배송: 0, 직출: 0, 수화물: 0, 송화물: 0, 출장: 0, 기타: 0 };
    items.forEach(item => {
        if (item.category in summary) {
            summary[item.category as keyof DaySummary]++;
        }
    });
    return summary;
};

// --- Category Icon & Color Mapping ---
const CATEGORY_CONFIG: Record<string, { icon: React.ElementType; color: string; bg: string }> = {
    '시공': { icon: Wrench, color: 'text-blue-600', bg: 'bg-blue-50' },
    '실측': { icon: Ruler, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    '미팅': { icon: Users, color: 'text-violet-600', bg: 'bg-violet-50' },
    '배송': { icon: Truck, color: 'text-orange-600', bg: 'bg-orange-50' },
    '직출': { icon: ArrowRightFromLine, color: 'text-rose-600', bg: 'bg-rose-50' },
    '수화물': { icon: Package, color: 'text-amber-600', bg: 'bg-amber-50' },
    '송화물': { icon: Send, color: 'text-cyan-600', bg: 'bg-cyan-50' },
    '출장': { icon: Briefcase, color: 'text-indigo-600', bg: 'bg-indigo-50' },
    '기타': { icon: MoreHorizontal, color: 'text-gray-600', bg: 'bg-gray-100' },
};

const STATUS_STYLE: Record<string, string> = {
    '완료': 'bg-green-100 text-green-700',
    '진행중': 'bg-blue-100 text-blue-700',
    '예정': 'bg-yellow-100 text-yellow-700',
    '취소': 'bg-red-100 text-red-700',
};

// --- Component ---
const ScheduleManagement: React.FC = () => {
    const today = new Date();
    const [currentYear, setCurrentYear] = useState(today.getFullYear());
    const [currentMonth, setCurrentMonth] = useState(today.getMonth() + 1); // 1-indexed
    const [selectedDay, setSelectedDay] = useState(today.getDate());

    // Month offset relative to the current real month
    const monthOffset = useMemo(() => {
        const realMonth = today.getFullYear() * 12 + today.getMonth();
        const viewMonth = currentYear * 12 + (currentMonth - 1);
        return viewMonth - realMonth;
    }, [currentYear, currentMonth]);

    const goToPrevMonth = () => {
        if (currentMonth === 1) {
            setCurrentYear(y => y - 1);
            setCurrentMonth(12);
        } else {
            setCurrentMonth(m => m - 1);
        }
        setSelectedDay(1);
    };

    const goToNextMonth = () => {
        if (currentMonth === 12) {
            setCurrentYear(y => y + 1);
            setCurrentMonth(1);
        } else {
            setCurrentMonth(m => m + 1);
        }
        setSelectedDay(1);
    };

    const goToThisMonth = () => {
        setCurrentYear(today.getFullYear());
        setCurrentMonth(today.getMonth() + 1);
        setSelectedDay(today.getDate());
    };

    // Calendar data
    const daysInMonth = new Date(currentYear, currentMonth, 0).getDate();
    const firstDayOfWeek = new Date(currentYear, currentMonth - 1, 1).getDay(); // 0=Sun
    const prevMonthDays = new Date(currentYear, currentMonth - 1, 0).getDate();

    const calendarCells = useMemo(() => {
        const cells: { day: number; isCurrentMonth: boolean; isToday: boolean }[] = [];

        // Previous month trailing days
        for (let i = firstDayOfWeek - 1; i >= 0; i--) {
            cells.push({ day: prevMonthDays - i, isCurrentMonth: false, isToday: false });
        }

        // Current month days
        for (let d = 1; d <= daysInMonth; d++) {
            const isToday = d === today.getDate() && currentMonth === today.getMonth() + 1 && currentYear === today.getFullYear();
            cells.push({ day: d, isCurrentMonth: true, isToday });
        }

        // Next month leading days
        const remaining = 7 - (cells.length % 7);
        if (remaining < 7) {
            for (let d = 1; d <= remaining; d++) {
                cells.push({ day: d, isCurrentMonth: false, isToday: false });
            }
        }

        return cells;
    }, [currentYear, currentMonth, daysInMonth, firstDayOfWeek, prevMonthDays]);

    // Schedule for the selected day
    const selectedSchedule = useMemo(() => {
        return generateScheduleForDay(currentYear, currentMonth, selectedDay);
    }, [currentYear, currentMonth, selectedDay]);

    const selectedSummary = useMemo(() => getDaySummary(selectedSchedule), [selectedSchedule]);

    // Mock sales data
    const prevMonthSales = 1345252;
    const currentMonthSales = 1287282;
    const prevMonthChange = -52;
    const currentMonthChange = 632;
    const thisMonthTarget = 0;
    const thisMonthActual = 0;

    const formatMoney = (val: number) => {
        if (val === 0) return '0원';
        return val.toLocaleString() + '원';
    };

    const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];

    return (
        <div className="flex-1 flex flex-col h-full bg-gray-50 overflow-hidden font-sans">
            {/* ===== Top Navigation Bar ===== */}
            <div className="flex-shrink-0 bg-white border-b border-gray-200 px-6 py-3 shadow-sm z-20">
                <div className="flex items-center justify-between">
                    {/* Left: This Month Button + Month Nav */}
                    <div className="flex items-center gap-3">
                        <button
                            onClick={goToThisMonth}
                            className="px-4 py-1.5 bg-white border border-gray-300 rounded-lg text-sm font-bold text-gray-700 hover:bg-gray-50 transition-colors shadow-sm"
                        >
                            이번달
                        </button>
                        <div className="flex items-center gap-2">
                            <button onClick={goToPrevMonth} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors text-gray-500">
                                <ChevronLeft size={20} />
                            </button>
                            <div className="text-center min-w-[120px]">
                                <span className="text-lg font-bold text-gray-800">
                                    {currentYear}. {String(currentMonth).padStart(2, '0')}
                                </span>
                            </div>
                            <button onClick={goToNextMonth} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors text-gray-500">
                                <ChevronRight size={20} />
                            </button>
                        </div>
                    </div>

                    {/* Right: Sales Summary */}
                    <div className="flex items-center gap-6">
                        <div className="text-right">
                            <div className="flex items-center gap-4">
                                <div>
                                    <span className="text-[11px] text-gray-400 block">전월매출</span>
                                    <span className="text-sm font-bold text-gray-800">{formatMoney(prevMonthSales)}</span>
                                </div>
                                <div>
                                    <span className="text-[11px] text-gray-400 block">당월매출</span>
                                    <span className="text-sm font-bold text-gray-800">{formatMoney(currentMonthSales)}</span>
                                </div>
                                <div>
                                    <span className="text-[11px] text-gray-400 block">예상매출</span>
                                    <span className="text-sm font-bold text-gray-800">{formatMoney(thisMonthTarget)}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* ===== Main Content (Scrollable) ===== */}
            <div className="flex-1 overflow-y-auto p-6 scrollbar-hide">
                {/* ===== Calendar Grid ===== */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden mb-6">
                    {/* Weekday Header */}
                    <div className="grid grid-cols-7 border-b border-gray-200">
                        {WEEKDAYS.map((wd, i) => (
                            <div
                                key={wd}
                                className={`py-2.5 text-right pr-2 text-xs font-bold uppercase tracking-wide ${i === 0 ? 'text-red-400' : i === 6 ? 'text-blue-400' : 'text-gray-400'
                                    }`}
                            >
                                {wd}
                            </div>
                        ))}
                    </div>

                    {/* Calendar Days */}
                    <div className="grid grid-cols-7">
                        {calendarCells.map((cell, idx) => {
                            const isSelected = cell.isCurrentMonth && cell.day === selectedDay;
                            const dayOfWeek = idx % 7;
                            const isSunday = dayOfWeek === 0;
                            const isSaturday = dayOfWeek === 6;

                            return (
                                <div
                                    key={idx}
                                    onClick={() => {
                                        if (cell.isCurrentMonth) setSelectedDay(cell.day);
                                    }}
                                    className={`
                                        relative min-h-[110px] p-1.5 border-b border-r border-gray-100 cursor-pointer transition-all duration-150
                                        ${!cell.isCurrentMonth ? 'bg-gray-50/60 text-gray-300' : isSunday ? 'bg-red-50/50 hover:bg-red-50/80' : isSaturday ? 'bg-blue-50/50 hover:bg-blue-50/80' : 'hover:bg-blue-50/40'}
                                        ${cell.isToday ? 'bg-blue-50/80' : ''}
                                        ${isSelected ? 'ring-2 ring-inset ring-blue-400 bg-blue-50' : ''}
                                    `}
                                >
                                    {/* Day number - right aligned */}
                                    <div className="flex justify-end mb-1">
                                        <span
                                            className={`
                                                text-sm font-bold
                                                ${!cell.isCurrentMonth ? 'text-gray-300' : ''}
                                                ${cell.isCurrentMonth && isSunday ? 'text-red-500' : ''}
                                                ${cell.isCurrentMonth && isSaturday ? 'text-blue-500' : ''}
                                                ${cell.isCurrentMonth && !isSunday && !isSaturday ? 'text-gray-700' : ''}
                                                ${cell.isToday ? 'bg-blue-500 text-white w-5 h-5 rounded-full flex items-center justify-center text-[11px]' : ''}
                                            `}
                                        >
                                            {cell.day}
                                        </span>
                                    </div>
                                    {/* Category bars: icon + progress bar + count */}
                                    {cell.isCurrentMonth && (() => {
                                        const daySchedule = generateScheduleForDay(currentYear, currentMonth, cell.day);
                                        const 시공 = daySchedule.filter(s => s.category === '시공').length;
                                        const 배송 = daySchedule.filter(s => s.category === '배송').length;
                                        const 미팅 = daySchedule.filter(s => s.category === '미팅').length;
                                        const 기타 = daySchedule.length - 시공 - 배송 - 미팅;

                                        const maxCount = 6;
                                        const getBarColor = (count: number) => {
                                            if (count === 0) return 'bg-red-400';
                                            if (count <= 1) return 'bg-orange-400';
                                            if (count <= 2) return 'bg-yellow-400';
                                            if (count <= 3) return 'bg-lime-400';
                                            return 'bg-green-500';
                                        };
                                        const getTextColor = (count: number) => {
                                            if (count === 0) return 'text-red-500';
                                            if (count <= 1) return 'text-orange-500';
                                            if (count <= 2) return 'text-yellow-600';
                                            if (count <= 3) return 'text-lime-600';
                                            return 'text-green-600';
                                        };

                                        const bars = [
                                            { label: '시공', count: 시공, Icon: Wrench },
                                            { label: '배송', count: 배송, Icon: Truck },
                                            { label: '미팅', count: 미팅, Icon: Users },
                                            { label: '기타', count: 기타, Icon: MoreHorizontal },
                                        ];

                                        return (
                                            <div className="flex flex-col gap-[3px]">
                                                {bars.map(b => (
                                                    <div key={b.label} className="flex items-center gap-1">
                                                        <b.Icon size={13} className="text-gray-400 flex-shrink-0" />
                                                        <span className={`text-[11px] font-bold w-3 text-right ${getTextColor(b.count)}`}>
                                                            {b.count}
                                                        </span>
                                                        <div className="flex-1 h-[6px] bg-gray-100 rounded-full overflow-hidden">
                                                            <div
                                                                className={`h-full rounded-full ${getBarColor(b.count)}`}
                                                                style={{ width: `${Math.max((b.count / maxCount) * 100, b.count > 0 ? 15 : 0)}%` }}
                                                            />
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        );
                                    })()}
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* ===== Selected Day Detail Section ===== */}
                <div className="mb-6">
                    {/* Date Header */}
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-1 h-6 bg-blue-500 rounded-full" />
                        <h2 className="text-lg font-bold text-gray-800">
                            {currentMonth}월 {selectedDay}일 현황
                        </h2>
                        <span className="text-sm text-gray-400">
                            {currentYear}.{String(currentMonth).padStart(2, '0')}.{String(selectedDay).padStart(2, '0')}
                        </span>
                    </div>

                    {/* Summary Cards Row */}
                    <div className="grid grid-cols-9 gap-2 mb-5">
                        {(Object.keys(CATEGORY_CONFIG) as Array<keyof typeof CATEGORY_CONFIG>).map(cat => {
                            const config = CATEGORY_CONFIG[cat];
                            const Icon = config.icon;
                            const count = selectedSummary[cat as keyof DaySummary] || 0;

                            return (
                                <div
                                    key={cat}
                                    className={`${config.bg} rounded-xl p-3 flex flex-col items-center gap-1.5 border border-white/50 shadow-sm transition-transform hover:scale-105`}
                                >
                                    <Icon size={18} className={config.color} />
                                    <span className="text-[11px] font-bold text-gray-600">{cat}</span>
                                    <span className={`text-lg font-extrabold ${count > 0 ? config.color : 'text-gray-300'}`}>
                                        {count}
                                    </span>
                                </div>
                            );
                        })}
                    </div>

                    {/* Detail Table */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="bg-gray-50 border-b border-gray-200">
                                    <th className="py-3 px-3 text-left font-bold text-gray-500 text-xs w-[70px]">
                                        <div className="flex items-center gap-1"><Clock size={12} /> 시간</div>
                                    </th>
                                    <th className="py-3 px-3 text-left font-bold text-gray-500 text-xs w-[100px]">구분</th>
                                    <th className="py-3 px-3 text-center font-bold text-gray-500 text-xs w-[50px]">창수</th>
                                    <th className="py-3 px-3 text-left font-bold text-gray-500 text-xs w-[80px]">고객명</th>
                                    <th className="py-3 px-3 text-left font-bold text-gray-500 text-xs w-[130px]">
                                        <div className="flex items-center gap-1"><Phone size={12} /> 전화번호</div>
                                    </th>
                                    <th className="py-3 px-3 text-left font-bold text-gray-500 text-xs">
                                        <div className="flex items-center gap-1"><MapPin size={12} /> 주소</div>
                                    </th>
                                    <th className="py-3 px-3 text-left font-bold text-gray-500 text-xs w-[150px]">비고</th>
                                    <th className="py-3 px-3 text-left font-bold text-gray-500 text-xs w-[90px]">결과보고</th>
                                    <th className="py-3 px-3 text-center font-bold text-gray-500 text-xs w-[80px]">상태</th>
                                </tr>
                            </thead>
                            <tbody>
                                {selectedSchedule.length === 0 ? (
                                    <tr>
                                        <td colSpan={9} className="py-12 text-center text-gray-300">
                                            <div className="flex flex-col items-center gap-2">
                                                <Minus size={32} />
                                                <span className="text-sm">이 날의 스케쥴이 없습니다</span>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    selectedSchedule.map((item, idx) => {
                                        const catConfig = CATEGORY_CONFIG[item.category] || CATEGORY_CONFIG['기타'];
                                        const CatIcon = catConfig.icon;

                                        return (
                                            <tr
                                                key={item.id}
                                                className={`border-b border-gray-100 hover:bg-blue-50/40 transition-colors ${idx % 2 === 1 ? 'bg-gray-50/40' : ''}`}
                                            >
                                                <td className="py-3 px-3 font-mono text-gray-700 font-semibold">{item.time}</td>
                                                <td className="py-3 px-3">
                                                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold ${catConfig.bg} ${catConfig.color}`}>
                                                        <CatIcon size={12} />
                                                        {item.category}
                                                    </span>
                                                </td>
                                                <td className="py-3 px-3 text-center font-bold text-gray-700">{item.windowCount}</td>
                                                <td className="py-3 px-3 font-semibold text-gray-800">{item.customerName}</td>
                                                <td className="py-3 px-3 text-gray-600 font-mono text-xs">{item.phone}</td>
                                                <td className="py-3 px-3 text-gray-600 text-xs truncate max-w-[200px]">{item.address}</td>
                                                <td className="py-3 px-3 text-gray-500 text-xs whitespace-nowrap">{item.note || '-'}</td>
                                                <td className="py-3 px-3 text-gray-500 text-xs">{item.report || '-'}</td>
                                                <td className="py-3 px-3 text-center whitespace-nowrap">
                                                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold ${STATUS_STYLE[item.status]}`}>
                                                        {item.status === '완료' && <CheckCircle2 size={11} />}
                                                        {item.status === '진행중' && <Clock size={11} />}
                                                        {item.status === '예정' && <AlertCircle size={11} />}
                                                        {item.status === '취소' && <Minus size={11} />}
                                                        {item.status}
                                                    </span>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ScheduleManagement;
