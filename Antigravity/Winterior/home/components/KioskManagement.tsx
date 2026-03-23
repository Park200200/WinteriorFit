import React, { useState, useMemo, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Monitor, Play, Square, AlertTriangle, WifiOff, Volume2, VolumeX,
    Calendar, MapPin, Info, ChevronRight, Pause, SkipForward, SkipBack,
    Maximize2, RotateCcw, Clock, Tag, Tv, Settings, Wifi, CheckCircle2, X,
    Pencil, Plus, Trash2, Check, Image
} from 'lucide-react';

// ====== Types ======
type DeviceStatus = 'playing' | 'stopped' | 'error' | 'disconnected';
type DeviceOrientation = 'portrait' | 'landscape';

interface ContentItem {
    id: string;
    title: string;
    tags: string[];
    duration: string; // e.g., "00:30"
    thumbnailColor: string; // gradient colors for mock thumbnail
    type: 'image' | 'video';
}

interface TimeSlot {
    id: string;
    startTime: string;
    endTime: string;
    content: ContentItem;
    isActive: boolean;
}

interface KioskDevice {
    id: string;
    name: string;
    status: DeviceStatus;
    spec: string;
    resolution: string;
    orientation: DeviceOrientation;
    location: string;
    speakerOn: boolean;
    installDate: string;
    note: string;
    timeSlots: TimeSlot[];
}

// ====== Status Config ======
const STATUS_CONFIG: Record<DeviceStatus, { label: string; color: string; bg: string; border: string; icon: typeof Play; dotColor: string }> = {
    playing: { label: '플레이', color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200', icon: Play, dotColor: 'bg-emerald-500' },
    stopped: { label: '스톱', color: 'text-gray-600', bg: 'bg-gray-50', border: 'border-gray-200', icon: Square, dotColor: 'bg-gray-400' },
    error: { label: '오류', color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200', icon: AlertTriangle, dotColor: 'bg-red-500' },
    disconnected: { label: '연결끊김', color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200', icon: WifiOff, dotColor: 'bg-amber-500' },
};

// ====== Mock Contents ======
const MOCK_CONTENTS: ContentItem[] = [
    { id: 'c1', title: '봄 신상 컬렉션', tags: ['시즌', '신상품'], duration: '00:30', thumbnailColor: 'from-pink-400 via-rose-500 to-fuchsia-600', type: 'image' },
    { id: 'c2', title: '우드블라인드 시공영상', tags: ['시공', '블라인드'], duration: '01:20', thumbnailColor: 'from-amber-500 via-orange-500 to-yellow-600', type: 'video' },
    { id: 'c3', title: '허니콤 에너지절약 안내', tags: ['에너지', '허니콤'], duration: '00:45', thumbnailColor: 'from-emerald-400 via-teal-500 to-cyan-600', type: 'image' },
    { id: 'c4', title: '매장 프로모션 이벤트', tags: ['프로모션', '할인'], duration: '00:20', thumbnailColor: 'from-violet-500 via-purple-600 to-indigo-700', type: 'image' },
    { id: 'c5', title: '커튼 스타일 가이드', tags: ['커튼', '인테리어'], duration: '02:00', thumbnailColor: 'from-sky-400 via-blue-500 to-indigo-600', type: 'video' },
    { id: 'c6', title: '롤스크린 제품 소개', tags: ['롤스크린', '신상품'], duration: '01:00', thumbnailColor: 'from-lime-400 via-green-500 to-emerald-600', type: 'video' },
    { id: 'c7', title: '여름 시즌 블라인드', tags: ['시즌', '여름'], duration: '00:35', thumbnailColor: 'from-cyan-400 via-sky-500 to-blue-600', type: 'image' },
    { id: 'c8', title: '고객 시공후기 모음', tags: ['후기', '시공'], duration: '01:45', thumbnailColor: 'from-orange-400 via-red-500 to-pink-600', type: 'video' },
];

// ====== Mock Devices ======
const MOCK_DEVICES: KioskDevice[] = [
    {
        id: 'dev-1', name: '메인 윈도우 디스플레이', status: 'playing',
        spec: '55인치 4K UHD', resolution: '3840×2160', orientation: 'portrait',
        location: '매장 윈도우 안쪽', speakerOn: true, installDate: '2025-06-15',
        note: '메인 전시용 대형 디스플레이',
        timeSlots: [
            { id: 'ts-1-1', startTime: '09:00', endTime: '10:00', content: MOCK_CONTENTS[0], isActive: true },
            { id: 'ts-1-2', startTime: '10:00', endTime: '11:30', content: MOCK_CONTENTS[1], isActive: false },
            { id: 'ts-1-3', startTime: '11:30', endTime: '12:00', content: MOCK_CONTENTS[2], isActive: false },
            { id: 'ts-1-4', startTime: '13:00', endTime: '14:00', content: MOCK_CONTENTS[3], isActive: false },
            { id: 'ts-1-5', startTime: '14:00', endTime: '15:30', content: MOCK_CONTENTS[4], isActive: false },
            { id: 'ts-1-6', startTime: '15:30', endTime: '17:00', content: MOCK_CONTENTS[5], isActive: false },
        ]
    },
    {
        id: 'dev-2', name: '입구 안내 키오스크', status: 'playing',
        spec: '43인치 FHD', resolution: '1920×1080', orientation: 'landscape',
        location: '매장 입구 좌측', speakerOn: false, installDate: '2025-08-20',
        note: '고객 응대용 터치 키오스크',
        timeSlots: [
            { id: 'ts-2-1', startTime: '09:00', endTime: '12:00', content: MOCK_CONTENTS[4], isActive: true },
            { id: 'ts-2-2', startTime: '12:00', endTime: '15:00', content: MOCK_CONTENTS[5], isActive: false },
            { id: 'ts-2-3', startTime: '15:00', endTime: '18:00', content: MOCK_CONTENTS[6], isActive: false },
        ]
    },
    {
        id: 'dev-3', name: '상담 데스크 모니터', status: 'stopped',
        spec: '32인치 FHD', resolution: '1920×1080', orientation: 'landscape',
        location: '상담 데스크 뒤편', speakerOn: true, installDate: '2025-10-05',
        note: '상담 시 고객 대면용',
        timeSlots: [
            { id: 'ts-3-1', startTime: '09:00', endTime: '11:00', content: MOCK_CONTENTS[7], isActive: false },
            { id: 'ts-3-2', startTime: '11:00', endTime: '14:00', content: MOCK_CONTENTS[0], isActive: false },
            { id: 'ts-3-3', startTime: '14:00', endTime: '17:00', content: MOCK_CONTENTS[2], isActive: false },
            { id: 'ts-3-4', startTime: '17:00', endTime: '18:00', content: MOCK_CONTENTS[3], isActive: false },
        ]
    },
    {
        id: 'dev-4', name: '쇼룸 벽면 대형', status: 'error',
        spec: '65인치 4K UHD', resolution: '3840×2160', orientation: 'portrait',
        location: '2층 쇼룸 벽면', speakerOn: false, installDate: '2025-04-10',
        note: '⚠ HDMI 커넥터 접촉불량 - 수리 필요',
        timeSlots: [
            { id: 'ts-4-1', startTime: '09:00', endTime: '12:00', content: MOCK_CONTENTS[1], isActive: false },
            { id: 'ts-4-2', startTime: '12:00', endTime: '18:00', content: MOCK_CONTENTS[6], isActive: false },
        ]
    },
    {
        id: 'dev-5', name: '외부 전광판', status: 'disconnected',
        spec: '75인치 4K HDR', resolution: '3840×2160', orientation: 'landscape',
        location: '건물 외벽 1층', speakerOn: false, installDate: '2025-02-28',
        note: '네트워크 점검 중 - 2/25 복구 예정',
        timeSlots: [
            { id: 'ts-5-1', startTime: '06:00', endTime: '12:00', content: MOCK_CONTENTS[3], isActive: false },
            { id: 'ts-5-2', startTime: '12:00', endTime: '22:00', content: MOCK_CONTENTS[7], isActive: false },
        ]
    },
];

// ====== Component ======
const KioskManagement: React.FC = () => {
    const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(null);
    const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [progress, setProgress] = useState(35); // mock progress %
    const [isFullscreen, setIsFullscreen] = useState(false);

    // === Schedule Edit/Add Modal ===
    const [editingSlot, setEditingSlot] = useState<TimeSlot | null>(null);
    const [isAddingSlot, setIsAddingSlot] = useState(false);
    const [editForm, setEditForm] = useState({
        startTime: '',
        endTime: '',
        contentId: '',
        isActive: false,
    });

    // === ESC key handler for fullscreen ===
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isFullscreen) {
                setIsFullscreen(false);
            }
        };
        if (isFullscreen) {
            document.addEventListener('keydown', handleKeyDown);
        }
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [isFullscreen]);

    // === Drag scroll ===
    const scrollRef = useRef<HTMLDivElement>(null);
    const isDragging = useRef(false);
    const dragStartX = useRef(0);
    const scrollStartLeft = useRef(0);
    const hasDragged = useRef(false);

    const handleMouseDown = useCallback((e: React.MouseEvent) => {
        if (!scrollRef.current) return;
        isDragging.current = true;
        hasDragged.current = false;
        dragStartX.current = e.pageX;
        scrollStartLeft.current = scrollRef.current.scrollLeft;
        scrollRef.current.style.cursor = 'grabbing';
        scrollRef.current.style.userSelect = 'none';
    }, []);

    const handleMouseMove = useCallback((e: React.MouseEvent) => {
        if (!isDragging.current || !scrollRef.current) return;
        const dx = e.pageX - dragStartX.current;
        if (Math.abs(dx) > 3) hasDragged.current = true;
        scrollRef.current.scrollLeft = scrollStartLeft.current - dx;
    }, []);

    const handleMouseUp = useCallback(() => {
        if (!scrollRef.current) return;
        isDragging.current = false;
        scrollRef.current.style.cursor = 'grab';
        scrollRef.current.style.userSelect = '';
    }, []);

    const handleWheel = useCallback((e: React.WheelEvent) => {
        if (!scrollRef.current) return;
        // 세로 휠을 가로 스크롤로 변환
        if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
            e.preventDefault();
            scrollRef.current.scrollLeft += e.deltaY;
        }
    }, []);

    const selectedDevice = useMemo(() => MOCK_DEVICES.find(d => d.id === selectedDeviceId), [selectedDeviceId]);
    const selectedSlot = useMemo(() => selectedDevice?.timeSlots.find(ts => ts.id === selectedSlotId), [selectedDevice, selectedSlotId]);

    const handleDeviceSelect = (deviceId: string) => {
        setSelectedDeviceId(deviceId);
        const device = MOCK_DEVICES.find(d => d.id === deviceId);
        // Auto-select first active slot, or first slot
        const activeSlot = device?.timeSlots.find(ts => ts.isActive) || device?.timeSlots[0];
        setSelectedSlotId(activeSlot?.id || null);
        setIsPlaying(device?.status === 'playing');
        setProgress(35);
    };

    const handleSlotSelect = (slotId: string) => {
        setSelectedSlotId(slotId);
        setProgress(0);
    };

    const handleEditSlot = (slot: TimeSlot, e: React.MouseEvent) => {
        e.stopPropagation();
        setEditingSlot(slot);
        setIsAddingSlot(false);
        setEditForm({
            startTime: slot.startTime,
            endTime: slot.endTime,
            contentId: slot.content.id,
            isActive: slot.isActive,
        });
    };

    const handleAddSlot = () => {
        setEditingSlot(null);
        setIsAddingSlot(true);
        // 마지막 슬롯의 끝 시간 기준으로 다음 슬롯 자동 설정
        const lastSlot = selectedDevice?.timeSlots[selectedDevice.timeSlots.length - 1];
        setEditForm({
            startTime: lastSlot ? lastSlot.endTime : '09:00',
            endTime: lastSlot ? `${String(parseInt(lastSlot.endTime.split(':')[0]) + 2).padStart(2, '0')}:00` : '11:00',
            contentId: MOCK_CONTENTS[0].id,
            isActive: false,
        });
    };

    const handleCloseModal = () => {
        setEditingSlot(null);
        setIsAddingSlot(false);
    };

    const handleSaveSlot = () => {
        // Mock save - 실제로는 API 호출
        console.log('Saving slot:', editForm, editingSlot ? 'EDIT' : 'ADD');
        handleCloseModal();
    };

    const handleDeleteSlot = () => {
        if (editingSlot) {
            console.log('Deleting slot:', editingSlot.id);
        }
        handleCloseModal();
    };

    const activeCount = MOCK_DEVICES.filter(d => d.status === 'playing').length;
    const errorCount = MOCK_DEVICES.filter(d => d.status === 'error' || d.status === 'disconnected').length;

    return (
        <div className="flex-1 flex flex-col h-full bg-gradient-to-br from-slate-50 via-gray-50 to-blue-50/30 overflow-hidden">
            {/* ===== Header ===== */}
            <div className="flex-shrink-0 px-6 pt-5 pb-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-violet-200">
                            <Tv size={20} className="text-white" />
                        </div>
                        <div>
                            <h1 className="text-lg font-black text-gray-800 tracking-tight">키오스크 관리</h1>
                            <p className="text-xs text-gray-400">매장 디스플레이 단말기 및 콘텐츠 관리</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-1.5">
                            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                            <span className="text-xs font-bold text-emerald-700">{activeCount}대 활성</span>
                        </div>
                        {errorCount > 0 && (
                            <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-3 py-1.5">
                                <AlertTriangle size={12} className="text-red-500" />
                                <span className="text-xs font-bold text-red-600">{errorCount}대 이상</span>
                            </div>
                        )}
                        <span className="text-xs text-gray-400 bg-white border border-gray-200 rounded-lg px-3 py-1.5">
                            총 {MOCK_DEVICES.length}대 등록
                        </span>
                    </div>
                </div>
            </div>

            {/* ===== Device Cards (Top) ===== */}
            <div className="flex-shrink-0 px-6 pt-[20px] pb-4">
                <div
                    ref={scrollRef}
                    className="flex gap-5 overflow-x-auto pt-2 pb-3 px-1 scrollbar-hide"
                    style={{ cursor: 'grab', scrollBehavior: 'auto' }}
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseUp}
                    onWheel={handleWheel}
                >
                    {MOCK_DEVICES.map(device => {
                        const sc = STATUS_CONFIG[device.status];
                        const isSelected = selectedDeviceId === device.id;
                        const StatusIcon = sc.icon;
                        return (
                            <motion.div
                                key={device.id}
                                onClick={() => { if (!hasDragged.current) handleDeviceSelect(device.id); }}
                                className={`flex-shrink-0 w-[280px] rounded-2xl border-2 cursor-pointer overflow-hidden transition-shadow duration-200
                                    ${isSelected
                                        ? 'border-violet-500 shadow-xl shadow-violet-200/60 bg-white ring-4 ring-violet-100 relative z-10 scale-[1.03]'
                                        : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-md'
                                    }`}
                                style={isSelected ? { transform: 'scale(1.03) translateY(-4px)' } : {}}
                                whileHover={isSelected ? {} : { y: -2 }}
                                whileTap={isSelected ? {} : { scale: 0.98 }}
                            >
                                {/* Card Header */}
                                <div className={`px-4 py-2.5 ${isSelected ? 'bg-gradient-to-r from-violet-100 to-indigo-100' : 'bg-gray-50'} border-b ${isSelected ? 'border-violet-200' : 'border-gray-100'}`}>
                                    <div className="flex items-center gap-2 min-w-0">
                                        <Monitor size={14} className={isSelected ? 'text-violet-600' : 'text-gray-400'} />
                                        <span className={`text-sm font-bold truncate ${isSelected ? 'text-violet-800' : 'text-gray-800'}`}>{device.name}</span>
                                    </div>
                                    <div className="flex justify-end mt-1.5">
                                        <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold ${sc.bg} ${sc.color} border ${sc.border}`}>
                                            <div className={`w-1.5 h-1.5 rounded-full ${sc.dotColor} ${device.status === 'playing' ? 'animate-pulse' : ''}`} />
                                            {sc.label}
                                        </div>
                                    </div>
                                </div>

                                {/* Card Body */}
                                <div className="px-4 py-3 space-y-2">
                                    <div className="flex items-center justify-between">
                                        <span className="text-[10px] font-bold text-gray-400 uppercase">규격</span>
                                        <span className="text-xs font-bold text-gray-700">{device.spec}</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-[10px] font-bold text-gray-400 uppercase">형태</span>
                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${device.orientation === 'portrait' ? 'bg-blue-50 text-blue-600' : 'bg-amber-50 text-amber-600'}`}>
                                            {device.orientation === 'portrait' ? '⬜ 세로' : '⬛ 가로'}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-[10px] font-bold text-gray-400 uppercase">위치</span>
                                        <span className="text-xs text-gray-600 truncate max-w-[150px]">{device.location}</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-[10px] font-bold text-gray-400 uppercase">스피커</span>
                                        <div className="flex items-center gap-1">
                                            {device.speakerOn ? (
                                                <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-0.5"><Volume2 size={10} /> ON</span>
                                            ) : (
                                                <span className="text-[10px] font-bold text-gray-400 flex items-center gap-0.5"><VolumeX size={10} /> OFF</span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between pt-1 border-t border-gray-100">
                                        <span className="text-[10px] text-gray-400 flex items-center gap-0.5"><Calendar size={9} /> {device.installDate}</span>
                                        {device.note && (
                                            <span className="text-[10px] text-gray-400 flex items-center gap-0.5 truncate max-w-[130px]" title={device.note}>
                                                <Info size={9} /> {device.note.substring(0, 12)}...
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            </div>

            {/* ===== Bottom Panel: Timeline + Player ===== */}
            <div className="flex-1 px-6 pb-5 overflow-hidden">
                <AnimatePresence mode="wait">
                    {!selectedDevice ? (
                        <motion.div
                            key="empty"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="h-full flex items-center justify-center"
                        >
                            <div className="text-center">
                                <div className="w-20 h-20 bg-gray-100 rounded-3xl flex items-center justify-center mx-auto mb-4">
                                    <Monitor size={36} className="text-gray-300" />
                                </div>
                                <p className="text-gray-400 font-medium">단말기를 선택하면 콘텐츠 스케줄이 표시됩니다</p>
                                <p className="text-gray-300 text-sm mt-1">상단 카드를 클릭하세요</p>
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div
                            key={selectedDevice.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="h-full flex gap-4 overflow-hidden"
                        >
                            {/* === Left: Content Timeline === */}
                            <div className="w-[380px] flex-shrink-0 bg-white rounded-2xl border border-gray-200 shadow-sm flex flex-col overflow-hidden">
                                {/* Timeline Header */}
                                <div className="px-5 py-3.5 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-100 flex items-center justify-between">
                                    <div className="flex items-center gap-2.5">
                                        <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center">
                                            <Clock size={16} />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-gray-800 text-sm">콘텐츠 스케줄</h3>
                                            <span className="text-[10px] text-gray-400">{selectedDevice.name} · {selectedDevice.timeSlots.length}개 슬롯</span>
                                        </div>
                                    </div>
                                    <button
                                        onClick={handleAddSlot}
                                        className="text-[10px] font-bold text-blue-600 bg-blue-50 border border-blue-200 rounded-lg px-2.5 py-1 hover:bg-blue-100 transition-colors flex items-center gap-1"
                                    >
                                        <Plus size={10} /> 추가
                                    </button>
                                </div>

                                {/* Timeline List */}
                                <div className="flex-1 overflow-y-auto p-3 space-y-2">
                                    {selectedDevice.timeSlots.map((slot, idx) => {
                                        const isActive = selectedSlotId === slot.id;
                                        return (
                                            <motion.div
                                                key={slot.id}
                                                onClick={() => handleSlotSelect(slot.id)}
                                                className={`rounded-xl border-2 cursor-pointer transition-all overflow-hidden
                                                    ${isActive
                                                        ? 'border-blue-400 bg-blue-50/50 shadow-sm'
                                                        : 'border-transparent bg-gray-50 hover:bg-gray-100 hover:border-gray-200'
                                                    }`}
                                                whileHover={{ scale: 1.01 }}
                                                whileTap={{ scale: 0.99 }}
                                            >
                                                <div className="px-4 py-3">
                                                    {/* Time range */}
                                                    <div className="flex items-center justify-between mb-2">
                                                        <div className="flex items-center gap-2">
                                                            <span className={`text-xs font-mono font-bold ${isActive ? 'text-blue-700' : 'text-gray-500'}`}>
                                                                {slot.startTime}
                                                            </span>
                                                            <ChevronRight size={10} className="text-gray-300" />
                                                            <span className={`text-xs font-mono font-bold ${isActive ? 'text-blue-700' : 'text-gray-500'}`}>
                                                                {slot.endTime}
                                                            </span>
                                                        </div>
                                                        <div className="flex items-center gap-1.5">
                                                            {slot.isActive && selectedDevice.status === 'playing' && (
                                                                <div className="flex items-center gap-1 bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">
                                                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                                                    <span className="text-[9px] font-bold">NOW</span>
                                                                </div>
                                                            )}
                                                            <button
                                                                onClick={(e) => handleEditSlot(slot, e)}
                                                                className="w-6 h-6 rounded-md flex items-center justify-center text-gray-400 hover:text-violet-600 hover:bg-violet-50 transition-all"
                                                                title="설정"
                                                            >
                                                                <Pencil size={11} />
                                                            </button>
                                                        </div>
                                                    </div>

                                                    {/* Content info */}
                                                    <div className="flex items-center gap-3">
                                                        {/* Mini thumbnail */}
                                                        <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${slot.content.thumbnailColor} flex items-center justify-center flex-shrink-0`}>
                                                            {slot.content.type === 'video' ? (
                                                                <Play size={14} className="text-white/90" fill="white" />
                                                            ) : (
                                                                <Monitor size={14} className="text-white/90" />
                                                            )}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <p className={`text-sm font-bold truncate ${isActive ? 'text-gray-800' : 'text-gray-600'}`}>
                                                                {slot.content.title}
                                                            </p>
                                                            <div className="flex items-center gap-1.5 mt-1">
                                                                {slot.content.tags.map(tag => (
                                                                    <span key={tag} className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md ${isActive ? 'bg-blue-100 text-blue-600' : 'bg-gray-200 text-gray-500'}`}>
                                                                        #{tag}
                                                                    </span>
                                                                ))}
                                                                <span className="text-[9px] text-gray-400 ml-1">{slot.content.duration}</span>
                                                            </div>
                                                        </div>
                                                        {/* Play button */}
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); handleSlotSelect(slot.id); setIsPlaying(true); }}
                                                            className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-all
                                                                ${isActive && isPlaying
                                                                    ? 'bg-blue-600 text-white shadow-md shadow-blue-200'
                                                                    : 'bg-gray-200 text-gray-500 hover:bg-gray-300'
                                                                }`}
                                                        >
                                                            <Play size={12} fill="currentColor" />
                                                        </button>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* === Right: Content Player === */}
                            <div className="flex-1 bg-white rounded-2xl border border-gray-200 shadow-sm flex flex-col overflow-hidden">
                                {/* Player Header */}
                                <div className="px-5 py-3.5 bg-gradient-to-r from-violet-50 to-purple-50 border-b border-gray-100 flex items-center justify-between">
                                    <div className="flex items-center gap-2.5">
                                        <div className="w-8 h-8 bg-violet-100 text-violet-600 rounded-lg flex items-center justify-center">
                                            <Tv size={16} />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-gray-800 text-sm">콘텐츠 미리보기</h3>
                                            <span className="text-[10px] text-gray-400">
                                                {selectedSlot ? selectedSlot.content.title : '콘텐츠를 선택하세요'}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${selectedDevice.orientation === 'portrait' ? 'bg-blue-50 text-blue-600' : 'bg-amber-50 text-amber-600'}`}>
                                            {selectedDevice.orientation === 'portrait' ? '세로 모드' : '가로 모드'}
                                        </span>
                                        <span className="text-[10px] text-gray-400">{selectedDevice.resolution}</span>
                                    </div>
                                </div>

                                {/* Player Body */}
                                <div className="flex-1 flex items-center justify-center p-6 bg-gray-900/[0.03]">
                                    {selectedSlot ? (
                                        <div className={`relative rounded-2xl overflow-hidden shadow-2xl border-4 border-gray-800 bg-gray-900
                                            ${selectedDevice.orientation === 'portrait'
                                                ? 'w-[160px] h-[280px]'
                                                : 'w-[480px] h-[270px]'
                                            }`}
                                        >
                                            {/* Screen content */}
                                            <div className={`absolute inset-0 bg-gradient-to-br ${selectedSlot.content.thumbnailColor} flex flex-col items-center justify-center`}>
                                                {/* Mock content display */}
                                                <div className="text-center text-white/90 px-4">
                                                    {selectedSlot.content.type === 'video' ? (
                                                        <>
                                                            <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center mx-auto mb-4">
                                                                {isPlaying ? (
                                                                    <Pause size={28} className="text-white" />
                                                                ) : (
                                                                    <Play size={28} className="text-white ml-1" fill="white" />
                                                                )}
                                                            </div>
                                                            <p className="font-bold text-lg drop-shadow-lg">{selectedSlot.content.title}</p>
                                                            <p className="text-white/60 text-xs mt-1">{selectedSlot.content.duration}</p>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Monitor size={40} className="text-white/50 mx-auto mb-3" />
                                                            <p className="font-bold text-lg drop-shadow-lg">{selectedSlot.content.title}</p>
                                                            <div className="flex items-center justify-center gap-2 mt-2">
                                                                {selectedSlot.content.tags.map(t => (
                                                                    <span key={t} className="text-[10px] bg-white/20 backdrop-blur-sm rounded-full px-2 py-0.5">#{t}</span>
                                                                ))}
                                                            </div>
                                                        </>
                                                    )}
                                                </div>

                                                {/* Playing indicator */}
                                                {isPlaying && (
                                                    <div className="absolute top-3 right-3 flex items-center gap-1.5 bg-black/30 backdrop-blur-sm rounded-full px-2 py-1">
                                                        <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                                                        <span className="text-[9px] text-white font-bold">LIVE</span>
                                                    </div>
                                                )}

                                                {/* Device frame bezel indicator */}
                                                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-8 h-1 bg-white/20 rounded-full" />
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="text-center">
                                            <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                                                <Play size={28} className="text-gray-300" />
                                            </div>
                                            <p className="text-gray-400 font-medium text-sm">좌측 스케줄에서 콘텐츠를 선택하세요</p>
                                        </div>
                                    )}
                                </div>

                                {/* Player Controls */}
                                {selectedSlot && (
                                    <div className="px-5 py-3 border-t border-gray-100 bg-white">
                                        {/* Progress bar */}
                                        <div className="flex items-center gap-3 mb-3">
                                            <span className="text-[10px] font-mono text-gray-400 w-10 text-right">
                                                {Math.floor(progress * 0.6)}:{(progress % 60).toString().padStart(2, '0')}
                                            </span>
                                            <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                                                <motion.div
                                                    className="h-full bg-gradient-to-r from-violet-500 to-indigo-500 rounded-full"
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${progress}%` }}
                                                    transition={{ duration: 0.3 }}
                                                />
                                            </div>
                                            <span className="text-[10px] font-mono text-gray-400 w-10">
                                                {selectedSlot.content.duration}
                                            </span>
                                        </div>

                                        {/* Controls */}
                                        <div className="flex items-center justify-center gap-4">
                                            <button
                                                onClick={() => { const prevIdx = selectedDevice.timeSlots.findIndex(ts => ts.id === selectedSlotId) - 1; if (prevIdx >= 0) handleSlotSelect(selectedDevice.timeSlots[prevIdx].id); }}
                                                className="w-9 h-9 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 transition-colors"
                                            >
                                                <SkipBack size={16} />
                                            </button>
                                            <button
                                                onClick={() => setIsPlaying(!isPlaying)}
                                                className="w-12 h-12 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 shadow-lg shadow-violet-200 flex items-center justify-center text-white hover:shadow-xl transition-all active:scale-95"
                                            >
                                                {isPlaying ? <Pause size={20} /> : <Play size={20} className="ml-0.5" fill="white" />}
                                            </button>
                                            <button
                                                onClick={() => { const nextIdx = selectedDevice.timeSlots.findIndex(ts => ts.id === selectedSlotId) + 1; if (nextIdx < selectedDevice.timeSlots.length) handleSlotSelect(selectedDevice.timeSlots[nextIdx].id); }}
                                                className="w-9 h-9 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 transition-colors"
                                            >
                                                <SkipForward size={16} />
                                            </button>
                                            <div className="w-px h-6 bg-gray-200 mx-2" />
                                            <button onClick={() => setIsFullscreen(true)} className="w-9 h-9 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 transition-colors" title="전체화면">
                                                <Maximize2 size={14} />
                                            </button>
                                            <button className="w-9 h-9 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 transition-colors" title="새로고침">
                                                <RotateCcw size={14} />
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
            {/* ===== Fullscreen Popup ===== */}
            <AnimatePresence>
                {isFullscreen && selectedSlot && selectedDevice && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[9999] bg-black/90 flex items-center justify-center"
                        onClick={() => setIsFullscreen(false)}
                    >
                        {/* Close button */}
                        <button
                            onClick={() => setIsFullscreen(false)}
                            className="absolute top-5 right-5 z-10 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md flex items-center justify-center text-white transition-all group"
                        >
                            <X size={24} className="group-hover:scale-110 transition-transform" />
                        </button>

                        {/* ESC hint */}
                        <div className="absolute top-6 left-1/2 -translate-x-1/2 bg-white/10 backdrop-blur-md rounded-lg px-4 py-1.5 text-white/60 text-xs font-medium">
                            ESC 키를 눌러 닫기
                        </div>

                        {/* Fullscreen content */}
                        <motion.div
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.8, opacity: 0 }}
                            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                            className={`relative rounded-2xl overflow-hidden shadow-2xl border-4 border-gray-700 bg-gray-900
                                ${selectedDevice.orientation === 'portrait'
                                    ? 'w-[45vh] h-[80vh]'
                                    : 'w-[85vw] h-[75vh] max-w-[1400px]'
                                }`}
                            onClick={e => e.stopPropagation()}
                        >
                            {/* Screen content */}
                            <div className={`absolute inset-0 bg-gradient-to-br ${selectedSlot.content.thumbnailColor} flex flex-col items-center justify-center`}>
                                <div className="text-center text-white/90 px-8">
                                    {selectedSlot.content.type === 'video' ? (
                                        <>
                                            <div className="w-24 h-24 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center mx-auto mb-6 cursor-pointer hover:bg-white/30 transition-colors"
                                                onClick={() => setIsPlaying(!isPlaying)}
                                            >
                                                {isPlaying ? (
                                                    <Pause size={44} className="text-white" />
                                                ) : (
                                                    <Play size={44} className="text-white ml-2" fill="white" />
                                                )}
                                            </div>
                                            <p className="font-bold text-3xl drop-shadow-lg">{selectedSlot.content.title}</p>
                                            <p className="text-white/60 text-base mt-2">{selectedSlot.content.duration}</p>
                                        </>
                                    ) : (
                                        <>
                                            <Monitor size={64} className="text-white/50 mx-auto mb-5" />
                                            <p className="font-bold text-3xl drop-shadow-lg">{selectedSlot.content.title}</p>
                                            <div className="flex items-center justify-center gap-3 mt-4">
                                                {selectedSlot.content.tags.map(t => (
                                                    <span key={t} className="text-sm bg-white/20 backdrop-blur-sm rounded-full px-4 py-1">#{t}</span>
                                                ))}
                                            </div>
                                        </>
                                    )}
                                </div>

                                {/* Playing indicator */}
                                {isPlaying && (
                                    <div className="absolute top-5 right-5 flex items-center gap-2 bg-black/30 backdrop-blur-sm rounded-full px-3 py-1.5">
                                        <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                                        <span className="text-xs text-white font-bold">LIVE</span>
                                    </div>
                                )}

                                {/* Device info */}
                                <div className="absolute bottom-5 left-1/2 -translate-x-1/2 bg-black/30 backdrop-blur-sm rounded-xl px-5 py-2 flex items-center gap-4 text-white/70">
                                    <span className="text-xs font-bold">{selectedDevice.name}</span>
                                    <span className="text-[10px]">{selectedDevice.spec}</span>
                                    <span className="text-[10px]">{selectedDevice.resolution}</span>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
            {/* ===== Schedule Edit/Add Modal ===== */}
            <AnimatePresence>
                {(editingSlot || isAddingSlot) && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[9999] bg-black/50 backdrop-blur-sm flex items-center justify-center"
                        onClick={handleCloseModal}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                            className="bg-white rounded-2xl shadow-2xl w-[480px] max-h-[85vh] overflow-hidden"
                            onClick={e => e.stopPropagation()}
                        >
                            {/* Modal Header */}
                            <div className="px-6 py-4 bg-gradient-to-r from-violet-50 to-indigo-50 border-b border-gray-100 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${editingSlot ? 'bg-violet-100 text-violet-600' : 'bg-emerald-100 text-emerald-600'}`}>
                                        {editingSlot ? <Pencil size={16} /> : <Plus size={16} />}
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-gray-800 text-sm">
                                            {editingSlot ? '스케줄 편집' : '새 스케줄 추가'}
                                        </h3>
                                        <span className="text-[10px] text-gray-400">
                                            {selectedDevice?.name} · 콘텐츠 스케줄 설정
                                        </span>
                                    </div>
                                </div>
                                <button
                                    onClick={handleCloseModal}
                                    className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors"
                                >
                                    <X size={18} />
                                </button>
                            </div>

                            {/* Modal Body */}
                            <div className="px-6 py-5 space-y-5 overflow-y-auto max-h-[60vh]">
                                {/* Time Settings */}
                                <div>
                                    <label className="text-xs font-bold text-gray-500 uppercase mb-2 block">재생 시간</label>
                                    <div className="flex items-center gap-3">
                                        <div className="flex-1">
                                            <label className="text-[10px] text-gray-400 mb-1 block">시작 시간</label>
                                            <input
                                                type="time"
                                                value={editForm.startTime}
                                                onChange={e => setEditForm(prev => ({ ...prev, startTime: e.target.value }))}
                                                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-violet-200 focus:border-violet-400 transition-all"
                                            />
                                        </div>
                                        <ChevronRight size={16} className="text-gray-300 mt-5" />
                                        <div className="flex-1">
                                            <label className="text-[10px] text-gray-400 mb-1 block">종료 시간</label>
                                            <input
                                                type="time"
                                                value={editForm.endTime}
                                                onChange={e => setEditForm(prev => ({ ...prev, endTime: e.target.value }))}
                                                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-violet-200 focus:border-violet-400 transition-all"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Content Selection */}
                                <div>
                                    <label className="text-xs font-bold text-gray-500 uppercase mb-2 block">콘텐츠 선택</label>
                                    <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                                        {MOCK_CONTENTS.map(content => {
                                            const isChosen = editForm.contentId === content.id;
                                            return (
                                                <div
                                                    key={content.id}
                                                    onClick={() => setEditForm(prev => ({ ...prev, contentId: content.id }))}
                                                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border-2 cursor-pointer transition-all
                                                        ${isChosen
                                                            ? 'border-violet-400 bg-violet-50/50 ring-2 ring-violet-100'
                                                            : 'border-gray-100 bg-gray-50 hover:border-gray-200 hover:bg-gray-100'
                                                        }`}
                                                >
                                                    <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${content.thumbnailColor} flex items-center justify-center flex-shrink-0`}>
                                                        {content.type === 'video' ? (
                                                            <Play size={12} className="text-white/90" fill="white" />
                                                        ) : (
                                                            <Image size={12} className="text-white/90" />
                                                        )}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className={`text-xs font-bold truncate ${isChosen ? 'text-violet-800' : 'text-gray-700'}`}>
                                                            {content.title}
                                                        </p>
                                                        <div className="flex items-center gap-1 mt-0.5">
                                                            {content.tags.map(tag => (
                                                                <span key={tag} className="text-[8px] font-bold px-1 py-0.5 rounded bg-gray-200 text-gray-500">#{tag}</span>
                                                            ))}
                                                            <span className="text-[8px] text-gray-400 ml-1">{content.duration}</span>
                                                        </div>
                                                    </div>
                                                    {isChosen && (
                                                        <div className="w-6 h-6 rounded-full bg-violet-500 flex items-center justify-center flex-shrink-0">
                                                            <Check size={12} className="text-white" />
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Active Toggle */}
                                <div className="flex items-center justify-between py-3 border-t border-gray-100">
                                    <div>
                                        <p className="text-xs font-bold text-gray-700">활성화 상태</p>
                                        <p className="text-[10px] text-gray-400">활성화하면 해당 시간에 자동 재생됩니다</p>
                                    </div>
                                    <button
                                        onClick={() => setEditForm(prev => ({ ...prev, isActive: !prev.isActive }))}
                                        className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${editForm.isActive ? 'bg-violet-500' : 'bg-gray-300'}`}
                                    >
                                        <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-md transition-transform duration-200
                                            ${editForm.isActive ? 'translate-x-[22px]' : 'translate-x-0.5'}`}
                                        />
                                    </button>
                                </div>
                            </div>

                            {/* Modal Footer */}
                            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
                                {editingSlot ? (
                                    <button
                                        onClick={handleDeleteSlot}
                                        className="flex items-center gap-1.5 text-xs font-bold text-red-500 hover:text-red-600 hover:bg-red-50 px-3 py-2 rounded-lg transition-colors"
                                    >
                                        <Trash2 size={13} /> 삭제
                                    </button>
                                ) : (
                                    <div />
                                )}
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={handleCloseModal}
                                        className="text-xs font-bold text-gray-500 hover:text-gray-700 bg-white border border-gray-200 rounded-xl px-4 py-2.5 hover:bg-gray-50 transition-colors"
                                    >
                                        취소
                                    </button>
                                    <button
                                        onClick={handleSaveSlot}
                                        className="text-xs font-bold text-white bg-gradient-to-r from-violet-500 to-indigo-600 rounded-xl px-5 py-2.5 hover:shadow-lg hover:shadow-violet-200 transition-all flex items-center gap-1.5"
                                    >
                                        <Check size={13} /> {editingSlot ? '수정 완료' : '추가 완료'}
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default KioskManagement;
