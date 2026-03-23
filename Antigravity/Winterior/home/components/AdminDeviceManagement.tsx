import React, { useState, useMemo, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Monitor, Play, Square, AlertTriangle, WifiOff, Volume2,
    Building2, Search, X, CalendarClock, Clock,
    Trash2, Pencil, Plus,
    ImageIcon, UploadCloud, Tag, Sparkles, Check, Eye, ExternalLink,
} from 'lucide-react';
import { AdminButton } from './ui/AdminButton';
import { AdminCard, AdminCardContent } from './ui/AdminCard';
import { AdminInput } from './ui/AdminInput';
import { AdminBadge } from './ui/AdminBadge';
import { usePartnerContext } from '../PartnerContext';
import { useAdminTheme } from './theme/AdminThemeContext';

// ─── 타입 ───────────────────────────────────────────────────────────────────────
type DeviceStatus = 'playing' | 'stopped' | 'error' | 'disconnected';
type DeviceOrientation = 'landscape' | 'portrait';

interface AdminDevice {
    id: string;
    name: string;
    partnerId: string;
    partnerName: string;
    status: DeviceStatus;
    location: string;
    installedAt: string;
    spec: string;
    resolution: string;
    orientation: DeviceOrientation;
    contactName: string;
    contactPhone: string;
    volume: number;
    currentContent?: string;
    lastSeen: string;
}

const STATUS_CONFIG: Record<DeviceStatus, { label: string; color: string; bg: string; border: string; dotColor: string; icon: React.ElementType }> = {
    playing: { label: '재생중', color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200', dotColor: 'bg-emerald-500', icon: Play },
    stopped: { label: '비활성', color: 'text-gray-600', bg: 'bg-gray-50', border: 'border-gray-200', dotColor: 'bg-gray-400', icon: Square },
    error: { label: '고장', color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200', dotColor: 'bg-red-500', icon: AlertTriangle },
    disconnected: { label: '연결끊김', color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200', dotColor: 'bg-amber-500', icon: WifiOff },
};
const VALID_STATUSES: DeviceStatus[] = ['playing', 'stopped', 'error', 'disconnected'];
// status가 유효하지 않은 경우 'stopped'로 폴백
const getStatusConfig = (status: string) => STATUS_CONFIG[VALID_STATUSES.includes(status as DeviceStatus) ? (status as DeviceStatus) : 'stopped'];
const STATUS_ORDER: DeviceStatus[] = ['playing', 'stopped', 'disconnected', 'error'];

interface ManagedContent {
    id: string;
    title: string;
    tags: string[];
    duration: string;
    thumbnailColor: string;
    type: 'image' | 'video';
    source: 'ai' | 'upload';
    orientation: 'landscape' | 'portrait';
    imageUrl?: string;
}

// ─── 목 데이터 (가맹대리점 기반 샘플) ────────────────────────────────────────────
const MOCK_ADMIN_DEVICES: AdminDevice[] = [
    // 강남홈데코 (ag1) - 2대
    { id: 'dev-ag1-1', name: '쇼룸 메인 디스플레이', partnerId: 'ag1', partnerName: '강남홈데코', status: 'playing', location: '서울 강남구 도산대로 100 1층', installedAt: '2024-03-15', spec: '65" 4K OLED', resolution: '3840x2160', orientation: 'landscape', contactName: '이미나', contactPhone: '02-540-1111', volume: 70, currentContent: '봄맞이 블라인드 홍보', lastSeen: '방금 전' },
    { id: 'dev-ag1-2', name: '상담 대기석 화면', partnerId: 'ag1', partnerName: '강남홈데코', status: 'stopped', location: '서울 강남구 도산대로 100 2층', installedAt: '2024-05-01', spec: '55" FHD LED', resolution: '1920x1080', orientation: 'portrait', contactName: '이미나', contactPhone: '02-540-1111', volume: 50, lastSeen: '10분 전' },
    // 달빛드림 1호점 (ptn-d1-1) - 3대
    { id: 'dev-d1-1-1', name: '입구 홍보 스크린', partnerId: 'ptn-d1-1', partnerName: '달빛드림 1호점', status: 'playing', location: '서울 특별시 테스트구 테스트동 101길 A동', installedAt: '2024-02-10', spec: '75" 8K QLED', resolution: '7680x4320', orientation: 'landscape', contactName: '김민수', contactPhone: '02-555-1001', volume: 65, currentContent: '우드블라인드 시공영상', lastSeen: '방금 전' },
    { id: 'dev-d1-1-2', name: '주방 인테리어 섹션', partnerId: 'ptn-d1-1', partnerName: '달빛드림 1호점', status: 'playing', location: '서울 특별시 테스트구 테스트동 101길 A동', installedAt: '2024-04-22', spec: '65" 4K OLED', resolution: '3840x2160', orientation: 'landscape', contactName: '김민수', contactPhone: '02-555-1001', volume: 60, currentContent: '롤스크린 컬러 가이드', lastSeen: '3분 전' },
    { id: 'dev-d1-1-3', name: '계산대 옆 안내판', partnerId: 'ptn-d1-1', partnerName: '달빛드림 1호점', status: 'error', location: '서울 특별시 테스트구 테스트동 101길 A동', installedAt: '2023-11-15', spec: '43" FHD IPS', resolution: '1920x1080', orientation: 'portrait', contactName: '김민수', contactPhone: '02-555-1001', volume: 40, lastSeen: '2시간 전' },
    // 별빛앤 2호점 (ptn-d1-2) - 2대
    { id: 'dev-d1-2-1', name: '메인 쇼룸 스크린', partnerId: 'ptn-d1-2', partnerName: '별빛앤 2호점', status: 'playing', location: '서울 특별시 테스트구 테스트동 202길 A동', installedAt: '2024-01-30', spec: '85" 8K Neo QLED', resolution: '7680x4320', orientation: 'landscape', contactName: '이서준', contactPhone: '02-555-1002', volume: 75, currentContent: '봄맞이 블라인드 홍보', lastSeen: '방금 전' },
    { id: 'dev-d1-2-2', name: '침실 인테리어 존', partnerId: 'ptn-d1-2', partnerName: '별빛앤 2호점', status: 'disconnected', location: '서울 특별시 테스트구 테스트동 202길 A동', installedAt: '2024-03-05', spec: '55" FHD OLED', resolution: '1920x1080', orientation: 'landscape', contactName: '이서준', contactPhone: '02-555-1002', volume: 55, lastSeen: '1시간 전' },
    // 우주디자인 3호점 (ptn-d1-3) - 4대
    { id: 'dev-d1-3-1', name: '1층 외부 사이니지', partnerId: 'ptn-d1-3', partnerName: '우주디자인 3호점', status: 'playing', location: '서울 특별시 테스트구 테스트동 303길 A동', installedAt: '2024-06-01', spec: '65" 4K 야외용', resolution: '3840x2160', orientation: 'landscape', contactName: '박도현', contactPhone: '02-555-1003', volume: 80, currentContent: '롤스크린 컬러 가이드', lastSeen: '방금 전' },
    { id: 'dev-d1-3-2', name: '거실 인테리어 구역', partnerId: 'ptn-d1-3', partnerName: '우주디자인 3호점', status: 'playing', location: '서울 특별시 테스트구 테스트동 303길 A동', installedAt: '2024-05-12', spec: '75" 4K QLED', resolution: '3840x2160', orientation: 'landscape', contactName: '박도현', contactPhone: '02-555-1003', volume: 70, currentContent: '우드블라인드 시공영상', lastSeen: '5분 전' },
    { id: 'dev-d1-3-3', name: '커튼 시공사례 화면', partnerId: 'ptn-d1-3', partnerName: '우주디자인 3호점', status: 'stopped', location: '서울 특별시 테스트구 테스트동 303길 A동', installedAt: '2024-02-28', spec: '55" FHD OLED', resolution: '1920x1080', orientation: 'portrait', contactName: '박도현', contactPhone: '02-555-1003', volume: 45, lastSeen: '15분 전' },
    { id: 'dev-d1-3-4', name: '키즈룸 체험 존', partnerId: 'ptn-d1-3', partnerName: '우주디자인 3호점', status: 'error', location: '서울 특별시 테스트구 테스트동 303길 A동', installedAt: '2023-12-20', spec: '43" FHD IPS', resolution: '1920x1080', orientation: 'landscape', contactName: '박도현', contactPhone: '02-555-1003', volume: 30, lastSeen: '3시간 전' },
    // 은하블라인드 4호점 (ptn-d1-4) - 3대
    { id: 'dev-d1-4-1', name: '쇼룸 입구 사이니지', partnerId: 'ptn-d1-4', partnerName: '은하블라인드 4호점', status: 'playing', location: '서울 특별시 테스트구 테스트동 404길 A동', installedAt: '2024-04-10', spec: '75" 4K OLED', resolution: '3840x2160', orientation: 'landscape', contactName: '최예준', contactPhone: '02-555-1004', volume: 72, currentContent: '봄맞이 블라인드 홍보', lastSeen: '방금 전' },
    { id: 'dev-d1-4-2', name: '제품 비교 전시 화면', partnerId: 'ptn-d1-4', partnerName: '은하블라인드 4호점', status: 'stopped', location: '서울 특별시 테스트구 테스트동 404길 A동', installedAt: '2024-03-22', spec: '65" 4K QLED', resolution: '3840x2160', orientation: 'landscape', contactName: '최예준', contactPhone: '02-555-1004', volume: 60, lastSeen: '25분 전' },
    { id: 'dev-d1-4-3', name: '시공 포트폴리오 존', partnerId: 'ptn-d1-4', partnerName: '은하블라인드 4호점', status: 'disconnected', location: '서울 특별시 테스트구 테스트동 404길 A동', installedAt: '2024-01-08', spec: '55" FHD LED', resolution: '1920x1080', orientation: 'portrait', contactName: '최예준', contactPhone: '02-555-1004', volume: 50, lastSeen: '2시간 전' },
    // 혜성나라 5호점 (ptn-d1-5) - 2대
    { id: 'dev-d1-5-1', name: '메인 홍보 스크린', partnerId: 'ptn-d1-5', partnerName: '혜성나라 5호점', status: 'playing', location: '서울 특별시 테스트구 테스트동 501길 A동', installedAt: '2024-07-01', spec: '65" 4K OLED', resolution: '3840x2160', orientation: 'landscape', contactName: '정지훈', contactPhone: '02-555-1005', volume: 68, currentContent: '롤스크린 컬러 가이드', lastSeen: '방금 전' },
    { id: 'dev-d1-5-2', name: '신제품 체험 존', partnerId: 'ptn-d1-5', partnerName: '혜성나라 5호점', status: 'playing', location: '서울 특별시 테스트구 테스트동 501길 A동', installedAt: '2024-07-05', spec: '55" QLED', resolution: '3840x2160', orientation: 'portrait', contactName: '정지훈', contactPhone: '02-555-1005', volume: 65, currentContent: '우드블라인드 시공영상', lastSeen: '2분 전' },
    // 태양창 1호점 (ptn-ag1-1) - 3대
    { id: 'dev-ag1p-1-1', name: '쇼룸 A구역 스크린', partnerId: 'ptn-ag1-1', partnerName: '태양창 1호점', status: 'playing', location: '서울 특별시 테스트구 테스트동 101길 A동', installedAt: '2024-05-20', spec: '75" 4K QLED', resolution: '3840x2160', orientation: 'landscape', contactName: '이민수', contactPhone: '02-555-2001', volume: 70, currentContent: '봄맞이 블라인드 홍보', lastSeen: '방금 전' },
    { id: 'dev-ag1p-1-2', name: '제품라인 소개 화면', partnerId: 'ptn-ag1-1', partnerName: '태양창 1호점', status: 'stopped', location: '서울 특별시 테스트구 테스트동 101길 A동', installedAt: '2024-04-15', spec: '65" 4K OLED', resolution: '3840x2160', orientation: 'landscape', contactName: '이민수', contactPhone: '02-555-2001', volume: 50, lastSeen: '30분 전' },
    { id: 'dev-ag1p-1-3', name: '입구 안내 모니터', partnerId: 'ptn-ag1-1', partnerName: '태양창 1호점', status: 'disconnected', location: '서울 특별시 테스트구 테스트동 101길 A동', installedAt: '2023-10-01', spec: '43" FHD', resolution: '1920x1080', orientation: 'portrait', contactName: '이민수', contactPhone: '02-555-2001', volume: 40, lastSeen: '4시간 전' },
    // 달빛드림 2호점 (ptn-ag1-2) - 2대
    { id: 'dev-ag1p-2-1', name: '메인 홍보 디스플레이', partnerId: 'ptn-ag1-2', partnerName: '달빛드림 2호점', status: 'playing', location: '서울 특별시 테스트구 테스트동 202길 A동', installedAt: '2024-06-10', spec: '65" 4K OLED', resolution: '3840x2160', orientation: 'landscape', contactName: '박서준', contactPhone: '02-555-2002', volume: 75, currentContent: '우드블라인드 시공영상', lastSeen: '방금 전' },
    { id: 'dev-ag1p-2-2', name: '시공사례 포트폴리오', partnerId: 'ptn-ag1-2', partnerName: '달빛드림 2호점', status: 'error', location: '서울 특별시 테스트구 테스트동 202길 A동', installedAt: '2024-03-18', spec: '55" FHD LED', resolution: '1920x1080', orientation: 'landscape', contactName: '박서준', contactPhone: '02-555-2002', volume: 55, lastSeen: '1시간 30분 전' },
    // 별빛앤 3호점 (ptn-ag1-3) - 5대
    { id: 'dev-ag1p-3-1', name: '쇼룸 1존 대형 스크린', partnerId: 'ptn-ag1-3', partnerName: '별빛앤 3호점', status: 'playing', location: '서울 특별시 테스트구 테스트동 303길 A동', installedAt: '2024-04-01', spec: '98" 8K M-series', resolution: '7680x4320', orientation: 'landscape', contactName: '최도현', contactPhone: '02-555-2003', volume: 80, currentContent: '롤스크린 컬러 가이드', lastSeen: '방금 전' },
    { id: 'dev-ag1p-3-2', name: '커튼 체험 코너', partnerId: 'ptn-ag1-3', partnerName: '별빛앤 3호점', status: 'playing', location: '서울 특별시 테스트구 테스트동 303길 A동', installedAt: '2024-04-10', spec: '75" 4K QLED', resolution: '3840x2160', orientation: 'landscape', contactName: '최도현', contactPhone: '02-555-2003', volume: 70, currentContent: '봄맞이 블라인드 홍보', lastSeen: '5분 전' },
    { id: 'dev-ag1p-3-3', name: '블라인드 비교 전시', partnerId: 'ptn-ag1-3', partnerName: '별빛앤 3호점', status: 'stopped', location: '서울 특별시 테스트구 테스트동 303길 A동', installedAt: '2024-02-14', spec: '65" FHD OLED', resolution: '1920x1080', orientation: 'portrait', contactName: '최도현', contactPhone: '02-555-2003', volume: 45, lastSeen: '20분 전' },
    { id: 'dev-ag1p-3-4', name: '입구 안내 키오스크', partnerId: 'ptn-ag1-3', partnerName: '별빛앤 3호점', status: 'playing', location: '서울 특별시 테스트구 테스트동 303길 A동', installedAt: '2024-05-25', spec: '43" 4K 터치', resolution: '3840x2160', orientation: 'portrait', contactName: '최도현', contactPhone: '02-555-2003', volume: 60, currentContent: '우드블라인드 시공영상', lastSeen: '방금 전' },
    { id: 'dev-ag1p-3-5', name: '프리미엄 라인 전시관', partnerId: 'ptn-ag1-3', partnerName: '별빛앤 3호점', status: 'disconnected', location: '서울 특별시 테스트구 테스트동 303길 A동', installedAt: '2023-09-01', spec: '65" 8K OLED', resolution: '7680x4320', orientation: 'landscape', contactName: '최도현', contactPhone: '02-555-2003', volume: 35, lastSeen: '3시간 전' },
];

// ─ 샘플 콘텐츠: 3초 움짤 가로 7개 + 세로 7개 = 14개 ─
const INIT_CONTENTS: ManagedContent[] = [
    // ─ 가로 (landscape) 7개 ─
    { id: 'gif-h1', title: '블라인드 오픈 모션', tags: ['블라인드', '오픈', '애니'], duration: '00:03', thumbnailColor: 'from-sky-400 to-blue-600', type: 'video', source: 'upload', orientation: 'landscape' },
    { id: 'gif-h2', title: '세련 그라데이션 홈 인테리어', tags: ['그라데이션', '홈', '앱'], duration: '00:03', thumbnailColor: 'from-violet-500 to-purple-700', type: 'video', source: 'ai', orientation: 'landscape' },
    { id: 'gif-h3', title: '번질 미늘미니 움직이는 컴 블라인드', tags: ['컴블라인드', '움직임', '애니'], duration: '00:03', thumbnailColor: 'from-emerald-400 to-teal-600', type: 'video', source: 'upload', orientation: 'landscape' },
    { id: 'gif-h4', title: '봄 빨간 코리어 먹는 인테리어', tags: ['보헤시땈', '보헤머리', '시즌'], duration: '00:03', thumbnailColor: 'from-pink-400 to-rose-600', type: 'video', source: 'ai', orientation: 'landscape' },
    { id: 'gif-h5', title: '롤스크린 내려오는 순간', tags: ['롤스크린', '내려오기', '애니'], duration: '00:03', thumbnailColor: 'from-amber-400 to-orange-600', type: 'video', source: 'upload', orientation: 'landscape' },
    { id: 'gif-h6', title: '영상 품질 줅 설명 무비 블라인드', tags: ['요려한', '블라인드', '설명'], duration: '00:03', thumbnailColor: 'from-cyan-400 to-indigo-600', type: 'video', source: 'ai', orientation: 'landscape' },
    { id: 'gif-h7', title: '프리미엄 제품 펼침 모션', tags: ['프리미엄', '제품', '상품소개'], duration: '00:03', thumbnailColor: 'from-fuchsia-500 to-pink-700', type: 'video', source: 'upload', orientation: 'landscape' },
    // ─ 세로 (portrait) 7개 ─
    { id: 'gif-v1', title: '세로형 코튼 블러플러스 없비슈', tags: ['코튼', '세로', '블러플러스'], duration: '00:03', thumbnailColor: 'from-lime-400 to-green-600', type: 'video', source: 'upload', orientation: 'portrait' },
    { id: 'gif-v2', title: '세로 화면 로고 리밌 수직 패널', tags: ['로고', '리밌', '수직'], duration: '00:03', thumbnailColor: 'from-blue-400 to-violet-600', type: 'video', source: 'ai', orientation: 'portrait' },
    { id: 'gif-v3', title: '아카시아 투명 코팅 없비슈', tags: ['아카시아', '코러니네이션', '없비슈'], duration: '00:03', thumbnailColor: 'from-orange-400 to-red-600', type: 'video', source: 'upload', orientation: 'portrait' },
    { id: 'gif-v4', title: '쿠플 컰스 파티션 내려오는 모션', tags: ['쿠플', '컰스', '파티션'], duration: '00:03', thumbnailColor: 'from-rose-400 to-pink-600', type: 'video', source: 'ai', orientation: 'portrait' },
    { id: 'gif-v5', title: '그라데이션 헤더 배너 세로', tags: ['배너', '헤더', '그라데이션'], duration: '00:03', thumbnailColor: 'from-indigo-400 to-blue-700', type: 'video', source: 'upload', orientation: 'portrait' },
    { id: 'gif-v6', title: '신제품 코레오그래피 소개 열림', tags: ['코레오그래피', '신제품', 'ꔍ어늘기'], duration: '00:03', thumbnailColor: 'from-teal-400 to-cyan-600', type: 'video', source: 'ai', orientation: 'portrait' },
    { id: 'gif-v7', title: '세로 완성도 예야한 시공 홍보', tags: ['시공', '홍보', '세로'], duration: '00:03', thumbnailColor: 'from-purple-400 to-fuchsia-600', type: 'video', source: 'upload', orientation: 'portrait' },
];


// ─── 기기 상세 팝업 ─────────────────────────────────────────────────────────────

// --- 이미지 압축 헬퍼 ---
const compressImageFile = (file: File): Promise<string> => {
    return new Promise((resolve) => {
        if (file.type.startsWith('video/')) {
            const reader = new FileReader();
            reader.onload = ev => resolve(ev.target?.result as string);
            reader.readAsDataURL(file);
            return;
        }
        const reader = new FileReader();
        reader.onload = ev => {
            const img = new Image();
            img.onload = () => {
                const MAX = 1200;
                let { width, height } = img;
                if (width > MAX || height > MAX) {
                    if (width > height) { height = Math.round((height / width) * MAX); width = MAX; }
                    else { width = Math.round((width / height) * MAX); height = MAX; }
                }
                const canvas = document.createElement('canvas');
                canvas.width = width; canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx?.drawImage(img, 0, 0, width, height);
                resolve(canvas.toDataURL('image/jpeg', 0.75));
            };
            img.src = ev.target?.result as string;
        };
        reader.readAsDataURL(file);
    });
};
const DeviceDetailPopup: React.FC<{ device: AdminDevice; onClose: () => void }> = ({ device, onClose }) => {
    const cfg = getStatusConfig(device.status);
    const Icon = cfg.icon;
    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999] bg-black/50 backdrop-blur-sm flex items-center justify-center p-6"
            onClick={onClose}
        >
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
                onClick={e => e.stopPropagation()}
                className="w-full max-w-md"
            >
                <AdminCard>
                    <div className={`p-6 ${cfg.bg} border-b ${cfg.border}`}>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-2xl ${cfg.bg} border ${cfg.border} flex items-center justify-center`}>
                                    <Icon size={18} className={cfg.color} />
                                </div>
                                <div>
                                    <h2 className="font-black text-gray-800 text-lg">{device.name}</h2>
                                    <AdminBadge variant={device.status === 'playing' ? 'success' : device.status === 'error' ? 'danger' : device.status === 'disconnected' ? 'warning' : 'secondary'} dot>
                                        {cfg.label}
                                    </AdminBadge>
                                </div>
                            </div>
                            <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/60 flex items-center justify-center hover:bg-white/90"><X size={16} /></button>
                        </div>
                    </div>
                    <AdminCardContent className="space-y-3">
                        {([
                            ['거래처', device.partnerName],
                            ['설치 장소', device.location],
                            ['설치일', device.installedAt],
                            ['규격', device.spec],
                            ['해상도', device.resolution],
                            ['사용방향', device.orientation === 'landscape' ? '가로' : '세로'],
                            ['담당자', device.contactName],
                            ['연락처', device.contactPhone],
                            ['마지막 확인', device.lastSeen],
                        ] as [string, string][]).map(([k, v]) => (
                            <div key={k} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                                <span className="text-xs font-bold text-gray-500">{k}</span>
                                <span className="text-sm font-bold text-gray-800">{v}</span>
                            </div>
                        ))}
                    </AdminCardContent>
                </AdminCard>
            </motion.div>
        </motion.div>
    );
};

// ─── 메인 컴포넌트 ──────────────────────────────────────────────────────────────
const AdminDeviceManagement: React.FC = () => {
    const { partners } = usePartnerContext();
    const { theme } = useAdminTheme(); // 테마 변경 시 즉시 리렌더링 트리거
    const dark = theme.darkMode;
    const [selectedPartnerId, setSelectedPartnerId] = useState<string | null>(null);
    const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(null);
    const [devices] = useState<AdminDevice[]>(MOCK_ADMIN_DEVICES);
    const [popupDevice, setPopupDevice] = useState<AdminDevice | null>(null);
    const [activeTab, setActiveTab] = useState<'partner' | 'contents' | 'register'>('partner');

    // 단말기등록 폼
    const [regForm, setRegForm] = useState({
        deviceName: '', spec: '', resolution: '', orientation: 'landscape' as DeviceOrientation,
        installedAt: '', location: '', contactName: '', contactPhone: '',
    });
    const [registeredDevices, setRegisteredDevices] = useState<AdminDevice[]>(() => {
        try {
            const saved = localStorage.getItem('admin_registered_devices');
            if (!saved) return [];
            const parsed = JSON.parse(saved);
            if (!Array.isArray(parsed)) return [];
            // status 유효성 검사: 유효하지 않은 값은 'stopped'로 폴백
            return parsed.map((d: AdminDevice) => ({
                ...d,
                status: VALID_STATUSES.includes(d.status as DeviceStatus) ? d.status : 'stopped',
            }));
        } catch { return []; }
    });
    const [editingDeviceId, setEditingDeviceId] = useState<string | null>(null);

    // 컨텐츠관리
    const [contentSearch, setContentSearch] = useState('');
    const [tagInput, setTagInput] = useState('');
    const [contentTags, setContentTags] = useState<string[]>([]);
    const [contentPrompt, setContentPrompt] = useState('');
    const [contentDescription, setContentDescription] = useState('');
    const [contentResolution, setContentResolution] = useState('');
    const [contentOrientation, setContentOrientation] = useState<'landscape' | 'portrait'>('landscape');
    const [contentCardTab, setContentCardTab] = useState<'ai' | 'normal'>('ai');
    const [isGenAi, setIsGenAi] = useState(false);
    const [contentList, setContentList] = useState<ManagedContent[]>(() => {
        try {
            const saved = localStorage.getItem('admin_content_list_v3');
            if (!saved) return INIT_CONTENTS;
            const parsed = JSON.parse(saved);
            if (!Array.isArray(parsed)) return INIT_CONTENTS;
            // 이미지는 별도 키에서 복원
            let imageMap: Record<string, string> = {};
            try {
                const imgSaved = localStorage.getItem('admin_content_images_v3');
                if (imgSaved) imageMap = JSON.parse(imgSaved);
            } catch { }
            return parsed.map((c: ManagedContent) => ({
                ...c,
                tags: Array.isArray(c.tags) ? c.tags : [],
                type: (c.type === 'image' || c.type === 'video') ? c.type : 'image',
                source: (c.source === 'ai' || c.source === 'upload') ? c.source : 'upload',
                thumbnailColor: c.thumbnailColor || 'from-gray-400 to-gray-600',
                orientation: (c.orientation === 'landscape' || c.orientation === 'portrait') ? c.orientation : 'landscape',
                imageUrl: c.imageUrl || imageMap[c.id] || undefined,
            }));
        } catch { return INIT_CONTENTS; }
    });

    const [editingContentId, setEditingContentId] = useState<string | null>(null);
    const [editTitle, setEditTitle] = useState('');
    const [pendingAiContent, setPendingAiContent] = useState<{ color: string } | null>(null);
    const [uploadedFile, setUploadedFile] = useState<{ dataUrl: string; type: 'image' | 'video'; name: string } | null>(null);
    // 콘텐츠 미리보기 팝업 상태
    const [previewContent, setPreviewContent] = useState<ManagedContent | null>(null);
    const contentFileRef = useRef<HTMLInputElement>(null);

    // ─── 스케쥴관리 팝업 상태 ─────────────────────────────────────────
    const [schedulePopupDeviceId, setSchedulePopupDeviceId] = useState<string | null>(null);
    interface ScheduleItem { id: string; startTime: string; contentId: string; contentTitle: string; }
    const [deviceSchedules, setDeviceSchedules] = useState<Record<string, ScheduleItem[]>>(() => {
        try {
            const saved = localStorage.getItem('admin_device_schedules');
            return saved ? JSON.parse(saved) : {};
        } catch { return {}; }
    });
    const [scheduleTime, setScheduleTime] = useState('09:00');
    const [scheduleContentId, setScheduleContentId] = useState('');
    // 스케줄 미리보기 선택된 contentId
    const [schedulePreviewContentId, setSchedulePreviewContentId] = useState<string | null>(null);

    // ─── 거래처별 컨텐츠 사용 설정 (더블클릭 토글) ─────────────────────
    // partnerUsedContents: { [partnerId]: Set<contentId> }
    const [partnerUsedContents, setPartnerUsedContents] = useState<Record<string, string[]>>(() => {
        try {
            const saved = localStorage.getItem('admin_partner_used_contents');
            return saved ? JSON.parse(saved) : {};
        } catch { return {}; }
    });
    const [contentTabPartnerId, setContentTabPartnerId] = useState<string | null>(null);
    // 상단 거래처 검색 선택 → 컨텐츠 탭 자동 연동
    useEffect(() => {
        setContentTabPartnerId(selectedPartnerId);
    }, [selectedPartnerId]);

    // ─── 연결보기 팝업 상태 ──────────────────────────────────────────
    const [playbackContent, setPlaybackContent] = useState<ManagedContent | null>(null);

    // localStorage 영속화
    useEffect(() => {
        try { localStorage.setItem('admin_registered_devices', JSON.stringify(registeredDevices)); } catch { }
    }, [registeredDevices]);

    useEffect(() => {
        const saveContentList = () => {
            // 이미지(base64)를 별도 키에 분리 저장: 메타데이터는 항상 작은 크기로 유지
            const imageMap: Record<string, string> = {};
            const metaList = contentList.map(c => {
                const url = c.imageUrl?.startsWith('blob:') ? undefined : c.imageUrl;
                if (url) imageMap[c.id] = url;
                return { ...c, imageUrl: undefined }; // 메타데이터엔 이미지 제외
            });

            // 1. 메타데이터 저장 (항상 작아서 거의 실패 안 함)
            try {
                localStorage.setItem('admin_content_list_v3', JSON.stringify(metaList));
            } catch {
                // 메타데이터도 실패 시 최신 50개만
                try {
                    localStorage.setItem('admin_content_list_v3', JSON.stringify(metaList.slice(0, 50)));
                } catch { }
            }

            // 2. 이미지 별도 저장 (실패해도 메타데이터는 이미 저장됨)
            try {
                localStorage.setItem('admin_content_images_v3', JSON.stringify(imageMap));
                return;
            } catch { }

            // 2-1. 이미지 저장 실패 시: 기존 이미지 맵에서 새 항목만 추가 시도
            try {
                const existingImg = localStorage.getItem('admin_content_images_v3');
                const existing: Record<string, string> = existingImg ? JSON.parse(existingImg) : {};
                // 삭제된 컨텐츠의 이미지 제거 후 새 이미지만 추가
                const cleaned: Record<string, string> = {};
                contentList.forEach(c => {
                    if (existing[c.id]) cleaned[c.id] = existing[c.id];
                    if (imageMap[c.id]) cleaned[c.id] = imageMap[c.id];
                });
                localStorage.setItem('admin_content_images_v3', JSON.stringify(cleaned));
            } catch { }
        };
        saveContentList();
    }, [contentList]);

    useEffect(() => {
        try { localStorage.setItem('admin_partner_used_contents', JSON.stringify(partnerUsedContents)); } catch { }
    }, [partnerUsedContents]);

    useEffect(() => {
        try { localStorage.setItem('admin_device_schedules', JSON.stringify(deviceSchedules)); } catch { }
    }, [deviceSchedules]);

    // 거래처 검색
    const [partnerSearchInput, setPartnerSearchInput] = useState('');
    const [showPartnerDropdown, setShowPartnerDropdown] = useState(false);
    const partnerDropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (partnerDropdownRef.current && !partnerDropdownRef.current.contains(e.target as Node)) {
                setShowPartnerDropdown(false);
            }
        };
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                setShowPartnerDropdown(false);
            }
        };
        if (showPartnerDropdown) {
            document.addEventListener('mousedown', handleClickOutside);
            document.addEventListener('keydown', handleEscape);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('keydown', handleEscape);
        };
    }, [showPartnerDropdown]);

    const scrollRef = useRef<HTMLDivElement>(null);
    const [outputPanelWidth, setOutputPanelWidth] = React.useState(260);
    const outputDragRef = useRef<{ startX: number; startWidth: number } | null>(null);

    const handleOutputResizeStart = (e: React.MouseEvent) => {
        outputDragRef.current = { startX: e.clientX, startWidth: outputPanelWidth };
        const onMove = (ev: MouseEvent) => {
            if (!outputDragRef.current) return;
            const delta = outputDragRef.current.startX - ev.clientX; // 왼쪽으로 드래그 → 넓어짐
            const newW = Math.max(180, Math.min(500, outputDragRef.current.startWidth + delta));
            setOutputPanelWidth(newW);
        };
        const onUp = () => {
            outputDragRef.current = null;
            window.removeEventListener('mousemove', onMove);
            window.removeEventListener('mouseup', onUp);
        };
        window.addEventListener('mousemove', onMove);
        window.addEventListener('mouseup', onUp);
        e.preventDefault();
    };
    const isDragging = useRef(false);
    const startX = useRef(0);
    const scrollLeft = useRef(0);

    const selectedPartner = useMemo(() =>
        partners.find(p => p.id === selectedPartnerId) || null,
        [partners, selectedPartnerId]);

    const allDevices = useMemo(() => [...devices, ...registeredDevices], [devices, registeredDevices]);

    const filteredDevices = useMemo(() => {
        if (!selectedPartnerId) return allDevices;
        return allDevices.filter(d => d.partnerId === selectedPartnerId);
    }, [allDevices, selectedPartnerId]);

    const selectedDevice = useMemo(() =>
        selectedDeviceId ? filteredDevices.find(d => d.id === selectedDeviceId) || null : null,
        [filteredDevices, selectedDeviceId]);

    useEffect(() => {
        const devicesForPartner = selectedPartnerId
            ? allDevices.filter(d => d.partnerId === selectedPartnerId)
            : allDevices;
        if (devicesForPartner.length > 0) setSelectedDeviceId(devicesForPartner[0].id);
        else setSelectedDeviceId(null);
    }, [selectedPartnerId, allDevices]);

    const filteredPartners = useMemo(() =>
        partners
            .filter(p => p.type === 'AGENCY')
            .filter(p => (p.partnerName || '').includes(partnerSearchInput) || (p.partnerCode || '').includes(partnerSearchInput)),
        [partners, partnerSearchInput]);

    const formatPhone = (val: string) => {
        const d = val.replace(/\D/g, '');
        if (d.startsWith('02')) {
            if (d.length <= 2) return d;
            if (d.length <= 6) return d.slice(0, 2) + '-' + d.slice(2);
            if (d.length <= 10) return d.slice(0, 2) + '-' + d.slice(2, 6) + '-' + d.slice(6);
            return d.slice(0, 2) + '-' + d.slice(2, 6) + '-' + d.slice(6, 10);
        }
        if (d.length <= 3) return d;
        if (d.length <= 7) return d.slice(0, 3) + '-' + d.slice(3);
        if (d.length <= 11) return d.slice(0, 3) + '-' + d.slice(3, 7) + '-' + d.slice(7);
        return d.slice(0, 3) + '-' + d.slice(3, 7) + '-' + d.slice(7, 11);
    };

    // 해상도 입력: 숫자와 x(구분자) 만 허용, 스페이스바 누르면 x 자동 삽입
    const formatResolution = (val: string): string => {
        return val
            .replace(/[xX\u00d7 ]/g, 'x')
            .replace(/[^0-9x]/g, '')
            .replace(/x+/g, 'x');
    };
    const handleResolutionKeyDown = (
        e: React.KeyboardEvent<HTMLInputElement>,
        value: string,
        setter: (v: string) => void
    ) => {
        if (e.key === ' ') {
            e.preventDefault();
            if (value.includes('x')) return;
            if (!value.replace(/\D/g, '')) return;
            setter(value + 'x');
        }
    };

    const handleRegisterOrUpdate = () => {
        if (!regForm.deviceName.trim()) { alert('단말기명을 입력하세요.'); return; }
        if (editingDeviceId) {
            setRegisteredDevices(prev => prev.map(d =>
                d.id === editingDeviceId
                    ? { ...d, name: regForm.deviceName, spec: regForm.spec, resolution: regForm.resolution, orientation: regForm.orientation, installedAt: regForm.installedAt, location: regForm.location, contactName: regForm.contactName, contactPhone: regForm.contactPhone }
                    : d
            ));
            setEditingDeviceId(null);
        } else {
            const newDevice: AdminDevice = {
                id: 'reg-' + Date.now(), name: regForm.deviceName, partnerId: selectedPartnerId || '', partnerName: selectedPartner?.partnerName || '',
                status: 'stopped', location: regForm.location, installedAt: regForm.installedAt, spec: regForm.spec,
                resolution: regForm.resolution, orientation: regForm.orientation, contactName: regForm.contactName, contactPhone: regForm.contactPhone,
                volume: 50, lastSeen: '방금 전',
            };
            setRegisteredDevices(prev => [newDevice, ...prev]);
        }
        setRegForm({ deviceName: '', spec: '', resolution: '', orientation: 'landscape', installedAt: '', location: '', contactName: '', contactPhone: '' });
    };

    const handleEditDevice = (d: AdminDevice) => {
        setRegForm({ deviceName: d.name, spec: d.spec, resolution: d.resolution, orientation: d.orientation, installedAt: d.installedAt, location: d.location, contactName: d.contactName, contactPhone: d.contactPhone });
        setEditingDeviceId(d.id);
    };

    const handleMouseDown = useCallback((e: React.MouseEvent) => { isDragging.current = true; startX.current = e.pageX - (scrollRef.current?.offsetLeft || 0); scrollLeft.current = scrollRef.current?.scrollLeft || 0; }, []);
    const handleMouseMove = useCallback((e: React.MouseEvent) => { if (!isDragging.current) return; e.preventDefault(); const x = e.pageX - (scrollRef.current?.offsetLeft || 0); const walk = (x - startX.current) * 1.5; if (scrollRef.current) scrollRef.current.scrollLeft = scrollLeft.current - walk; }, []);
    const handleMouseUp = useCallback(() => { isDragging.current = false; }, []);

    const tabs = [
        { id: 'partner' as const, label: '업체별기기' },
        { id: 'contents' as const, label: '컨텐츠관리' },
        { id: 'register' as const, label: '단말기등록' },
    ];

    const editingContent = editingContentId ? contentList.find(c => c.id === editingContentId) || null : null;

    return (
        <div className="flex flex-col h-full" style={{ background: 'var(--admin-bg)' }}>
            {/* 헤더 */}
            <div className="px-6 py-4 flex-shrink-0 border-b" style={{ background: 'var(--admin-surface)', borderColor: 'var(--admin-border)' }}>
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-black flex items-center gap-2" style={{ color: 'var(--admin-text)' }}>
                        <Monitor size={20} style={{ color: 'var(--theme-primary)' }} />설치기기 관리
                    </h2>
                    <div className="flex items-center gap-2">
                        {STATUS_ORDER.map(s => {
                            const cfg = STATUS_CONFIG[s]; const Icon = cfg.icon;
                            const count = allDevices.filter(d => d.status === s).length;
                            return (
                                <div key={s} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-bold ${cfg.bg} ${cfg.border} ${cfg.color}`}>
                                    <Icon size={11} />{cfg.label} {count}
                                </div>
                            );
                        })}
                    </div>
                </div>
                {/* 거래처 검색 */}
                <div className="relative mt-2" ref={partnerDropdownRef}>
                    <AdminInput
                        isSearch
                        value={selectedPartnerId ? (selectedPartner?.partnerName || '') : partnerSearchInput}
                        onChange={e => { setPartnerSearchInput(e.target.value); setSelectedPartnerId(null); setShowPartnerDropdown(true); }}
                        onFocus={() => setShowPartnerDropdown(true)}
                        placeholder="거래처 검색 (미입력 시 전체)"
                        icon={<Building2 size={16} />}
                    />
                    {selectedPartnerId && (
                        <button onClick={() => { setSelectedPartnerId(null); setPartnerSearchInput(''); }} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"><X size={14} /></button>
                    )}
                    {showPartnerDropdown && !selectedPartnerId && filteredPartners.length > 0 && (
                        <AdminCard className="absolute top-full left-0 right-0 z-50 mt-1 shadow-xl max-h-60 overflow-y-auto">
                            {filteredPartners.slice(0, 6).map(p => (
                                <button key={p.id}
                                    className="w-full flex items-center gap-3 px-4 py-3 transition-colors text-left border-b border-gray-100 last:border-0"
                                    style={{ '--hover-bg': 'var(--theme-primary-bg)' } as React.CSSProperties}
                                    onMouseEnter={e => (e.currentTarget.style.background = 'var(--theme-primary-bg)')}
                                    onMouseLeave={e => (e.currentTarget.style.background = '')}
                                    onClick={() => { setSelectedPartnerId(p.id); setPartnerSearchInput(''); setShowPartnerDropdown(false); }}>
                                    <Building2 size={14} style={{ color: 'var(--theme-primary)' }} className="flex-shrink-0" />
                                    <span className="text-sm font-bold text-gray-700">{p.partnerName}</span>
                                </button>
                            ))}
                        </AdminCard>
                    )}
                </div>
                {/* 탭 */}
                <div className="flex gap-1 mt-4 rounded-2xl p-1" style={{ background: 'var(--theme-primary-bg)' }}>
                    {tabs.map(tab => (
                        <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                            className="flex-1 py-2.5 rounded-xl text-sm font-black transition-all"
                            style={activeTab === tab.id
                                ? { background: 'var(--theme-primary)', color: '#ffffff', boxShadow: '0 1px 4px rgba(0,0,0,0.18)' }
                                : { color: 'var(--theme-primary-text)', opacity: 0.6 }}>
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* ===== 업체별기기 탭 ===== */}
            {activeTab === 'partner' && (
                <>
                    {!selectedPartnerId ? (
                        <div className="flex-1 overflow-y-auto p-6">
                            <p className="text-xs text-gray-400 mb-4 font-medium">전체 단말기 {allDevices.length}대 · 클릭하면 상세 정보</p>
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                                {allDevices.map(device => {
                                    const cfg = getStatusConfig(device.status); const Icon = cfg.icon;
                                    return (
                                        <motion.div key={device.id}
                                            className={`rounded-2xl border-2 ${cfg.border} p-4 cursor-pointer hover:shadow-lg transition-all`}
                                            style={{ background: 'var(--admin-surface)' }}
                                            whileHover={{ y: -3 }} onClick={() => setPopupDevice(device)}>
                                            <div className={`w-10 h-10 rounded-xl ${cfg.bg} border ${cfg.border} flex items-center justify-center mb-3`}>
                                                <Icon size={16} className={cfg.color} />
                                            </div>
                                            <p className="text-xs font-black mb-1" style={{ color: 'var(--admin-text)' }}>{device.name}</p>
                                            <p className="text-[10px] mb-2" style={{ color: 'var(--admin-text-sub)' }}>{device.partnerName}</p>
                                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${cfg.bg} ${cfg.color} border ${cfg.border}`}>{cfg.label}</span>
                                        </motion.div>
                                    );
                                })}
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col flex-1 overflow-hidden">
                            <div className="flex-shrink-0 p-6 pb-0">
                                <p className="text-xs text-gray-400 mb-3 font-medium">{selectedPartner?.partnerName} · {filteredDevices.length}대</p>
                                <div ref={scrollRef} className="flex gap-3 overflow-x-auto pb-3 pt-1 cursor-grab active:cursor-grabbing select-none"
                                    style={{ scrollbarWidth: 'none' }}
                                    onMouseDown={handleMouseDown} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp}>
                                    {filteredDevices.map(device => {
                                        const cfg = getStatusConfig(device.status); const Icon = cfg.icon;
                                        const isSelected = device.id === selectedDeviceId;
                                        return (
                                            <motion.div key={device.id} onClick={() => setSelectedDeviceId(device.id)}
                                                className={`flex-shrink-0 w-44 rounded-2xl border-2 p-4 cursor-pointer transition-all ${isSelected ? `${cfg.border} ${cfg.bg} shadow-md` : 'border-gray-200 bg-white hover:shadow-md'}`}
                                            >
                                                <div className="flex items-center gap-2 mb-2">
                                                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${isSelected ? `${cfg.bg} border ${cfg.border}` : 'bg-gray-100'}`}>
                                                        <Icon size={14} className={isSelected ? cfg.color : 'text-gray-400'} />
                                                    </div>
                                                    <div className={`w-2 h-2 rounded-full ${cfg.dotColor}`} />
                                                </div>
                                                <p className="text-xs font-black leading-tight mb-1" style={{ color: 'var(--admin-text)' }}>{device.name}</p>
                                                <p className={`text-[10px] font-bold ${cfg.color}`}>{cfg.label}</p>
                                            </motion.div>
                                        );
                                    })}
                                </div>
                            </div>
                            <div className="flex-1 overflow-y-auto p-6">
                                {selectedDevice ? (
                                    <motion.div key={selectedDevice.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                                        className="rounded-3xl border-2 p-6 shadow-sm"
                                        style={{ background: 'var(--admin-surface)', borderColor: 'var(--admin-border)' }}>
                                        {(() => {
                                            const cfg = getStatusConfig(selectedDevice.status); const Icon = cfg.icon;
                                            const displayPartner = selectedPartner || partners.find(p => p.id === selectedDevice.partnerId);
                                            return (
                                                <div className="flex gap-6">
                                                    {/* 좌측: 업체 기본정보 + 단말기정보/출력스케줄 */}
                                                    <div className="flex-1 flex flex-col gap-4 min-w-0">
                                                        {/* 1. 업체 기본정보 */}
                                                        {displayPartner && (
                                                            <AdminCard elevated>
                                                                <AdminCardContent className="p-5">
                                                                    <div className="flex items-center justify-between mb-4">
                                                                        <h3 className="font-black text-gray-800 flex items-center gap-1.5"><Building2 size={16} className="text-violet-500" /> 업체 기본정보</h3>
                                                                        <AdminBadge variant="outline" className="text-[10px]">{displayPartner.partnerCode || '-'}</AdminBadge>
                                                                    </div>
                                                                    <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                                                                        <div className="flex items-center justify-between"><span className="text-xs font-bold text-gray-500 w-16">업체명</span><span className="text-sm font-black text-gray-800">{displayPartner.partnerName || '-'}</span></div>
                                                                        <div className="flex items-center justify-between"><span className="text-xs font-bold text-gray-500 w-16">대표자</span><span className="text-sm font-bold text-gray-800">{displayPartner.ceoName || '-'}</span></div>
                                                                        <div className="flex items-center justify-between"><span className="text-xs font-bold text-gray-500 w-16">전화</span><span className="text-sm font-bold text-gray-800">{formatPhone(displayPartner.companyPhone || '')}</span></div>
                                                                        <div className="flex justify-between gap-2 border-t border-gray-200 pt-3 mt-1">
                                                                            <span className="text-xs font-bold text-gray-500 w-16 flex-shrink-0">주소</span>
                                                                            <span className="text-xs text-gray-600 text-right leading-relaxed">{displayPartner.addresses?.[0]?.address || '주소 정보 없음'}</span>
                                                                        </div>
                                                                    </div>
                                                                </AdminCardContent>
                                                            </AdminCard>
                                                        )}

                                                        {/* 2. 단말기 정보 + 출력 스케줄 (나란히, 업체기본정보 가로범위 안) */}
                                                        <div className="flex gap-4">
                                                            {/* 단말기 정보 카드 */}
                                                            <AdminCard elevated className="flex-1 flex flex-col overflow-hidden min-w-0">
                                                                <AdminCardContent className="p-4 flex flex-col h-full">
                                                                    <div className="flex items-start justify-between mb-3">
                                                                        <div>
                                                                            <h3 className="font-black text-gray-800 flex items-center gap-1.5 mb-1"><Monitor size={15} className="text-violet-500" /> 단말기 정보</h3>
                                                                            <p className="text-[10px] text-gray-400 font-medium">ID: {selectedDevice.id}</p>
                                                                        </div>
                                                                        <AdminBadge variant={selectedDevice.status === 'playing' ? 'success' : selectedDevice.status === 'error' ? 'danger' : selectedDevice.status === 'disconnected' ? 'warning' : 'secondary'} dot>
                                                                            {cfg.label}
                                                                        </AdminBadge>
                                                                    </div>
                                                                    <div className="flex-1 bg-gray-50 rounded-xl p-3 overflow-y-auto" style={{ scrollbarWidth: 'none' }}>
                                                                        <div className="space-y-2">
                                                                            <div className="flex items-center justify-between pb-2 border-b border-gray-200">
                                                                                <span className="text-xs font-bold text-gray-500 w-12">기기명</span>
                                                                                <span className="text-sm font-black text-gray-800 truncate ml-1">{selectedDevice.name || '-'}</span>
                                                                            </div>
                                                                            <div className="grid grid-cols-2 gap-x-2 gap-y-2">
                                                                                <div className="flex flex-col gap-0.5"><span className="text-[10px] font-bold text-gray-400">설치일</span><span className="text-xs font-bold text-gray-700">{selectedDevice.installedAt || '-'}</span></div>
                                                                                <div className="flex flex-col gap-0.5"><span className="text-[10px] font-bold text-gray-400">규격</span><span className="text-xs font-bold text-gray-700">{selectedDevice.spec || '-'}</span></div>
                                                                                <div className="flex flex-col gap-0.5"><span className="text-[10px] font-bold text-gray-400">해상도</span><span className="text-xs font-bold text-gray-700">{selectedDevice.resolution || '-'}</span></div>
                                                                                <div className="flex flex-col gap-0.5"><span className="text-[10px] font-bold text-gray-400">방향</span><AdminBadge variant="outline" className="text-[10px] self-start py-0 px-1.5">{selectedDevice.orientation === 'landscape' ? '가로' : '세로'}</AdminBadge></div>
                                                                            </div>
                                                                            <div className="border-t border-gray-200 pt-2 mt-1 space-y-1.5">
                                                                                <div className="flex items-center justify-between"><span className="text-xs font-bold text-gray-500">담당자</span><span className="text-xs font-bold text-gray-700">{selectedDevice.contactName || '-'}</span></div>
                                                                                <div className="flex items-center justify-between"><span className="text-xs font-bold text-gray-500">연락처</span><span className="text-xs font-bold text-gray-700">{formatPhone(selectedDevice.contactPhone || '')}</span></div>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                    <div className="mt-3 flex gap-2">
                                                                        <AdminButton variant="outline" size="sm" className="flex-1" icon={Pencil} onClick={() => { setActiveTab('register'); handleEditDevice(selectedDevice); }}>수정</AdminButton>
                                                                        <AdminButton variant="danger" size="sm" className="flex-shrink-0" icon={Trash2} onClick={() => { if (window.confirm('정말 삭제하시겠습니까?')) { setRegisteredDevices(prev => prev.filter(d => d.id !== selectedDevice.id)); setSelectedDeviceId(null); } }}>삭제</AdminButton>
                                                                    </div>
                                                                </AdminCardContent>
                                                            </AdminCard>

                                                            {/* 출력 스케줄 카드 */}
                                                            <AdminCard elevated className="flex-1 flex flex-col overflow-hidden min-w-0">
                                                                <AdminCardContent className="p-4 flex flex-col h-full">
                                                                    <div className="flex items-center justify-between mb-3 flex-shrink-0">
                                                                        <h3 className="font-black text-gray-800 flex items-center gap-1.5"><CalendarClock size={14} className="text-violet-500" /> 출력 스케줄</h3>
                                                                        <button
                                                                            title="스케쥴 관리"
                                                                            onClick={() => setSchedulePopupDeviceId(selectedDevice.id)}
                                                                            className="w-7 h-7 rounded-lg flex items-center justify-center transition-all hover:scale-110"
                                                                            style={{ background: 'var(--theme-primary-bg)', color: 'var(--theme-primary)' }}
                                                                            onMouseEnter={e => { e.currentTarget.style.background = 'var(--theme-primary)'; (e.currentTarget.querySelector('svg') as HTMLElement).style.color = '#fff'; }}
                                                                            onMouseLeave={e => { e.currentTarget.style.background = 'var(--theme-primary-bg)'; (e.currentTarget.querySelector('svg') as HTMLElement).style.color = 'var(--theme-primary)'; }}
                                                                        >
                                                                            <CalendarClock size={14} />
                                                                        </button>
                                                                    </div>
                                                                    <div className="flex-1 overflow-y-auto space-y-2" style={{ scrollbarWidth: 'thin' }}>
                                                                        {(deviceSchedules[selectedDevice.id] || []).length === 0 ? (
                                                                            <div className="flex flex-col items-center justify-center h-full gap-2 text-gray-300 py-4">
                                                                                <CalendarClock size={24} strokeWidth={1} />
                                                                                <span className="text-[10px] font-bold">스케쥴 없음</span>
                                                                            </div>
                                                                        ) : (
                                                                            (deviceSchedules[selectedDevice.id] || [])
                                                                                .slice()
                                                                                .sort((a, b) => a.startTime.localeCompare(b.startTime))
                                                                                .map(s => {
                                                                                    const isPreview = schedulePreviewContentId === s.contentId;
                                                                                    return (
                                                                                        <div key={s.id}
                                                                                            className="rounded-xl p-2.5 flex items-center gap-2 border-l-2 border-violet-400 transition-all"
                                                                                            style={{ background: isPreview ? 'var(--theme-primary-bg)' : '#f9fafb', border: isPreview ? '1px solid var(--theme-primary)' : undefined, borderLeftWidth: 2, borderLeftColor: '#7c3aed' }}>
                                                                                            <div className="flex-1 min-w-0">
                                                                                                <span className="text-[10px] font-black text-violet-600">{s.startTime}</span>
                                                                                                <div className="text-xs font-bold text-gray-700 truncate">{s.contentTitle}</div>
                                                                                            </div>
                                                                                            <button
                                                                                                title="미리보기"
                                                                                                onClick={() => setSchedulePreviewContentId(prev => prev === s.contentId ? null : s.contentId)}
                                                                                                className="flex-shrink-0 w-6 h-6 rounded-lg flex items-center justify-center transition-all hover:scale-110"
                                                                                                style={{ background: isPreview ? 'var(--theme-primary)' : 'var(--theme-primary-bg)', color: isPreview ? '#fff' : 'var(--theme-primary)' }}>
                                                                                                <Eye size={11} />
                                                                                            </button>
                                                                                        </div>
                                                                                    );
                                                                                })
                                                                        )}
                                                                    </div>
                                                                </AdminCardContent>
                                                            </AdminCard>
                                                        </div>
                                                    </div>

                                                    {/* 우측: 현재 출력 화면 — 업체기본정보와 나란히 세로 전체 */}
                                                    <div className="flex-shrink-0 relative" style={{ width: outputPanelWidth, minHeight: '100%' }}>
                                                        {/* 리사이즈 핸들 */}
                                                        <div
                                                            className="absolute left-0 top-0 bottom-0 w-2 cursor-col-resize z-10 group flex items-center justify-center"
                                                            style={{ marginLeft: '-8px' }}
                                                            onMouseDown={handleOutputResizeStart}
                                                        >
                                                            <div className="w-1 h-12 rounded-full opacity-0 group-hover:opacity-100 transition-all"
                                                                style={{ background: 'var(--theme-primary)' }} />
                                                        </div>
                                                        <AdminCard elevated className="flex flex-col overflow-hidden" style={{ height: '100%' }}>
                                                            <AdminCardContent className="p-4 flex flex-col h-full">
                                                                <div className="flex items-center justify-between mb-3 flex-shrink-0">
                                                                    <h3 className="font-black text-gray-800 flex items-center gap-1.5">
                                                                        {schedulePreviewContentId
                                                                            ? <><Eye size={14} className="text-violet-500" /> 스케줄 미리보기</>
                                                                            : <><Monitor size={14} className="text-emerald-500" /> 현재 출력 화면</>}
                                                                    </h3>
                                                                    {schedulePreviewContentId
                                                                        ? <button onClick={() => setSchedulePreviewContentId(null)}
                                                                            className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                                                                            style={{ background: 'var(--theme-primary-bg)', color: 'var(--theme-primary)' }}>닫기</button>
                                                                        : <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100"><span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" /> 송출중</span>}
                                                                </div>
                                                                {(() => {
                                                                    // 해상도 파싱 및 비율 계산
                                                                    const resStr = selectedDevice?.resolution || '1920x1080';
                                                                    const [rw, rh] = resStr.toLowerCase().replace('x', '×').split(/[x×]/).map(Number);
                                                                    const orientation = selectedDevice?.orientation || 'landscape';
                                                                    const isPortrait = orientation === 'portrait';
                                                                    const dispW = isPortrait ? Math.min(rw, rh) : Math.max(rw, rh);
                                                                    const dispH = isPortrait ? Math.max(rw, rh) : Math.min(rw, rh);
                                                                    const aspect = dispH / dispW;
                                                                    // 미리보기할 컨텐츠 찾기
                                                                    const previewContent = schedulePreviewContentId
                                                                        ? contentList.find(c => c.id === schedulePreviewContentId)
                                                                        : null;
                                                                    return (
                                                                        <div className="flex-1 flex flex-col items-center justify-center overflow-hidden">
                                                                            <div className="relative flex items-center justify-center" style={{ width: '100%', maxHeight: '100%' }}>
                                                                                <div className="relative bg-gray-900 rounded-lg overflow-hidden shadow-2xl group"
                                                                                    style={{
                                                                                        width: isPortrait ? 'auto' : '100%',
                                                                                        height: isPortrait ? '100%' : 'auto',
                                                                                        aspectRatio: `${dispW} / ${dispH}`,
                                                                                        maxWidth: '100%',
                                                                                        maxHeight: isPortrait ? '360px' : 'none',
                                                                                    }}>
                                                                                    {previewContent ? (
                                                                                        <>
                                                                                            {/* 실제 이미지/영상 표시 */}
                                                                                            {previewContent.imageUrl ? (
                                                                                                previewContent.type === 'video'
                                                                                                    ? <video src={previewContent.imageUrl} className="absolute inset-0 w-full h-full object-contain" muted autoPlay loop style={{background:'#000'}} />
                                                                                                    : <img src={previewContent.imageUrl} alt={previewContent.title} className="absolute inset-0 w-full h-full object-contain" style={{background:'#111'}} />
                                                                                            ) : (
                                                                                                <div className={`absolute inset-0 bg-gradient-to-br ${previewContent.thumbnailColor}`} />
                                                                                            )}
                                                                                            {/* 오버레이: 제목 */}
                                                                                            <div className="absolute inset-0 bg-black/30 flex flex-col items-end justify-start p-2 gap-1 pointer-events-none">
                                                                                                <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-black/50 text-white">{previewContent.source === 'ai' ? '✦ AI' : '↑ UP'}</span>
                                                                                            </div>
                                                                                            <div className="absolute bottom-6 left-0 right-0 px-2 pointer-events-none">
                                                                                                <span className="block text-white font-black text-center text-[10px] break-words drop-shadow-md">{previewContent.title}</span>
                                                                                            </div>
                                                                                        </>
                                                                                    ) : selectedDevice?.status === 'playing' ? (
                                                                                        <>
                                                                                            <div className="absolute inset-0 bg-gradient-to-br from-pink-500/20 to-violet-600/20 mix-blend-overlay" />
                                                                                            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
                                                                                                <ImageIcon size={28} className="text-white/20" />
                                                                                                <span className="text-sm font-black text-white/70 break-all px-4 text-center">{selectedDevice?.currentContent || '재생 정보 없음'}</span>
                                                                                            </div>
                                                                                        </>
                                                                                    ) : (
                                                                                        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
                                                                                            <Square size={28} className="text-gray-700" />
                                                                                            <span className="text-xs font-bold text-gray-500">대기 중 화면</span>
                                                                                        </div>
                                                                                    )}
                                                                                    {/* 해상도·방향 라벨 */}
                                                                                    <div className="absolute bottom-1.5 left-1.5 text-[8px] font-bold px-1.5 py-0.5 rounded"
                                                                                        style={{ background: 'rgba(0,0,0,0.55)', color: '#fff' }}>
                                                                                        {dispW}×{dispH} / {isPortrait ? '세로' : '가로'}모드
                                                                                    </div>
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    );
                                                                })()}

                                                                {/* 연결보기 버튼 */}
                                                                <button
                                                                    className="mt-3 w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold transition-all active:scale-95"
                                                                    style={{ background: 'var(--theme-primary)', color: '#fff' }}
                                                                    onClick={() => {
                                                                        // 0순위: 현재 미리보기 패널에 표시 중인 컨텐츠 직접 사용
                                                                        const previewContent0 = schedulePreviewContentId ? contentList.find(c => c.id === schedulePreviewContentId) : null;
                                                                        if (previewContent0) { setPlaybackContent(previewContent0); return; }
                                                                        const devId = selectedDevice?.id;
                                                                        const schedules = devId ? (deviceSchedules[devId] || []) : [];

                                                                        // 1순위: 현재 시간 기준 가장 가까운(직전) 스케줄 항목의 contentId
                                                                        let targetContentId: string | undefined;
                                                                        if (schedules.length > 0) {
                                                                            const now = new Date();
                                                                            const nowMinutes = now.getHours() * 60 + now.getMinutes();
                                                                            const sorted = [...schedules].sort((a, b) => a.startTime.localeCompare(b.startTime));
                                                                            // 현재 시간 이하의 마지막 스케줄
                                                                            const past = sorted.filter(s => {
                                                                                const [h, m] = s.startTime.split(':').map(Number);
                                                                                return h * 60 + m <= nowMinutes;
                                                                            });
                                                                            const active = past.length > 0 ? past[past.length - 1] : sorted[0];
                                                                            targetContentId = active.contentId;
                                                                        }

                                                                        // 2순위: contentId로 contentList에서 직접 검색
                                                                        const foundById = targetContentId
                                                                            ? contentList.find(c => c.id === targetContentId)
                                                                            : undefined;

                                                                        // 3순위: currentContent 제목으로 검색 (기존 동작)
                                                                        const curContentTitle = selectedDevice?.currentContent;
                                                                        const foundByTitle = curContentTitle
                                                                            ? contentList.find(c => c.title === curContentTitle)
                                                                            : undefined;

                                                                        const found = foundById || foundByTitle;
                                                                        if (found) {
                                                                            setPlaybackContent(found);
                                                                        } else {
                                                                            setPlaybackContent({
                                                                                id: 'live-preview',
                                                                                title: curContentTitle || '연결된 컨텐츠 없음',
                                                                                tags: [],
                                                                                duration: '-',
                                                                                thumbnailColor: 'from-violet-500 to-indigo-700',
                                                                                type: 'video',
                                                                                source: 'ai',
                                                                                orientation: selectedDevice?.orientation || 'landscape',
                                                                            });
                                                                        }
                                                                    }}
                                                                >
                                                                    <ExternalLink size={12} /> 연결보기
                                                                </button>
                                                            </AdminCardContent>
                                                        </AdminCard>
                                                    </div>
                                                </div>
                                            );
                                        })()}
                                    </motion.div>
                                ) : (
                                    <div className="flex-1 flex items-center justify-center text-gray-400 bg-white rounded-2xl border border-gray-100 shadow-sm border-dashed">
                                        <div className="text-center">
                                            <Monitor size={48} className="mx-auto text-gray-200 mb-4 opacity-50" />
                                            <p className="text-sm font-bold text-gray-500">단말기를 선택하세요</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    <AnimatePresence>
                        {popupDevice && <DeviceDetailPopup device={popupDevice} onClose={() => setPopupDevice(null)} />}
                    </AnimatePresence>

                    {/* ─── 스케쥴관리 팝업 ─── */}
                    <AnimatePresence>
                        {schedulePopupDeviceId && (() => {
                            const devName = allDevices.find(d => d.id === schedulePopupDeviceId)?.name || '기기';
                            const schedItems = deviceSchedules[schedulePopupDeviceId] || [];
                            // 해당 기기의 거래처에 할당된 컨텐츠만 필터링
                            const scheduleDevice = allDevices.find(d => d.id === schedulePopupDeviceId);
                            const schedulePartnerId = scheduleDevice?.partnerId;
                            const assignedIds = schedulePartnerId ? (partnerUsedContents[schedulePartnerId] || []) : [];
                            const availableContents = assignedIds.length > 0
                                ? contentList.filter(c => assignedIds.includes(c.id))
                                : contentList;
                            return (
                                <motion.div
                                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                    className="fixed inset-0 z-[9999] bg-black/50 backdrop-blur-sm flex items-center justify-center p-6"
                                    onClick={() => setSchedulePopupDeviceId(null)}
                                >
                                    <motion.div
                                        initial={{ scale: 0.92, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.92, opacity: 0 }}
                                        className="w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden"
                                        onClick={e => e.stopPropagation()}
                                    >
                                        {/* 헤더 */}
                                        <div className="px-6 py-5 flex items-center justify-between border-b border-gray-100" style={{ background: 'var(--theme-primary-bg)' }}>
                                            <div className="flex items-center gap-3">
                                                <CalendarClock size={20} style={{ color: 'var(--theme-primary)' }} />
                                                <div>
                                                    <h2 className="font-black text-gray-800 text-base">스케쥴관리</h2>
                                                    <p className="text-[11px] text-gray-500 font-medium">{devName}</p>
                                                </div>
                                            </div>
                                            <button onClick={() => setSchedulePopupDeviceId(null)} className="w-8 h-8 rounded-full bg-white/70 flex items-center justify-center hover:bg-white transition-all">
                                                <X size={16} className="text-gray-500" />
                                            </button>
                                        </div>
                                        {/* 추가 영역 */}
                                        <div className="p-5 border-b border-gray-100 bg-gray-50">
                                            <p className="text-[11px] font-black text-gray-500 uppercase tracking-wide mb-3">새 스케쥴 추가</p>
                                            <div className="flex gap-2 items-center">
                                                <div className="flex items-center gap-1.5 border-2 border-gray-200 rounded-xl px-3 py-2 bg-white flex-shrink-0"
                                                    style={{ minWidth: '110px' }}
                                                    onFocus={() => {}} >
                                                    <Clock size={13} className="text-gray-400 flex-shrink-0" />
                                                    <input
                                                        type="time"
                                                        value={scheduleTime}
                                                        onChange={e => setScheduleTime(e.target.value)}
                                                        className="text-sm font-bold text-gray-700 outline-none bg-transparent"
                                                        style={{ width: '80px' }}
                                                    />
                                                </div>
                                                <select
                                                    value={scheduleContentId}
                                                    onChange={e => setScheduleContentId(e.target.value)}
                                                    className="flex-1 border-2 border-gray-200 rounded-xl px-3 py-2 text-sm font-bold text-gray-700 outline-none bg-white"
                                                    onFocus={e => (e.currentTarget.style.borderColor = 'var(--theme-primary)')}
                                                    onBlur={e => (e.currentTarget.style.borderColor = '')}
                                                >
                                                    <option value="">컨텐츠 선택...</option>
                                                    {availableContents.map(c => (
                                                        <option key={c.id} value={c.id}>{c.title}</option>
                                                    ))}
                                                </select>
                                                <button
                                                    onClick={() => {
                                                        if (!scheduleContentId) { alert('컨텐츠를 선택하세요.'); return; }
                                                        const ct = contentList.find(c => c.id === scheduleContentId);
                                                        const newItem: ScheduleItem = {
                                                            id: 'sch-' + Date.now(),
                                                            startTime: scheduleTime,
                                                            contentId: scheduleContentId,
                                                            contentTitle: ct?.title || '',
                                                        };
                                                        setDeviceSchedules(prev => ({
                                                            ...prev,
                                                            [schedulePopupDeviceId]: [...(prev[schedulePopupDeviceId] || []), newItem],
                                                        }));
                                                        setScheduleContentId('');
                                                    }}
                                                    className="flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold transition-all hover:scale-105 active:scale-95 shadow-md"
                                                    style={{ background: 'var(--theme-primary)' }}
                                                    title="추가"
                                                >
                                                    <Plus size={16} />
                                                </button>
                                            </div>
                                        </div>
                                        {/* 스케쥴 리스트 */}
                                        <div className="p-5 overflow-y-auto" style={{ maxHeight: '320px', scrollbarWidth: 'thin' }}>
                                            {schedItems.length === 0 ? (
                                                <div className="flex flex-col items-center justify-center py-8 gap-2 text-gray-300">
                                                    <CalendarClock size={32} strokeWidth={1} />
                                                    <p className="text-sm font-bold">등록된 스케쥴이 없습니다</p>
                                                </div>
                                            ) : (
                                                <div className="space-y-2">
                                                    {/* 그리드 헤더 */}
                                                    <div className="grid grid-cols-[90px_1fr_32px] gap-3 px-3 pb-1 border-b border-gray-100">
                                                        <span className="text-[10px] font-black text-gray-400 uppercase">시작시간</span>
                                                        <span className="text-[10px] font-black text-gray-400 uppercase">컨텐츠명</span>
                                                        <span />
                                                    </div>
                                                    {schedItems
                                                        .slice()
                                                        .sort((a, b) => a.startTime.localeCompare(b.startTime))
                                                        .map(sch => (
                                                            <div key={sch.id}
                                                                className="grid grid-cols-[90px_1fr_32px] gap-3 items-center px-3 py-2.5 rounded-xl border border-gray-100 hover:border-violet-200 hover:bg-violet-50/40 transition-all group">
                                                                <span className="text-sm font-black text-violet-600">{sch.startTime}</span>
                                                                <span className="text-sm font-bold text-gray-700 truncate">{sch.contentTitle}</span>
                                                                <button
                                                                    onClick={() => setDeviceSchedules(prev => ({
                                                                        ...prev,
                                                                        [schedulePopupDeviceId]: (prev[schedulePopupDeviceId] || []).filter(s => s.id !== sch.id),
                                                                    }))}
                                                                    className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-300 hover:text-red-500 hover:bg-red-50 transition-all"
                                                                    title="삭제"
                                                                >
                                                                    <Trash2 size={13} />
                                                                </button>
                                                            </div>
                                                        ))
                                                    }
                                                </div>
                                            )}
                                        </div>
                                        {/* 푸터 */}
                                        <div className="px-5 py-4 flex justify-end border-t border-gray-100">
                                            <button onClick={() => setSchedulePopupDeviceId(null)}
                                                className="px-5 py-2 rounded-xl text-sm font-bold text-white transition-all active:scale-95 shadow-md"
                                                style={{ background: 'var(--theme-primary)' }}>확인</button>
                                        </div>
                                    </motion.div>
                                </motion.div>
                            );
                        })()}
                    </AnimatePresence>

                    {/* ─── 연결보기 전체화면 팝업 ─── */}
                    <AnimatePresence>
                        {playbackContent && (
                            <motion.div
                                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                className="fixed inset-0 z-[9999] bg-black/90 flex items-center justify-center p-6"
                                onClick={() => setPlaybackContent(null)}
                            >
                                <motion.div
                                    initial={{ scale: 0.92 }} animate={{ scale: 1 }} exit={{ scale: 0.92 }}
                                    className="relative w-auto max-w-[90vw]"
                                    style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}
                                    onClick={e => e.stopPropagation()}
                                >
                                    {/* ── 키오스크 외곽 프레임 ── */}
                                    <div style={{
                                        background: 'linear-gradient(145deg, #3a3a3a 0%, #2a2a2a 40%, #1e1e1e 100%)',
                                        borderRadius: '20px',
                                        padding: '10px',
                                        boxShadow: '0 0 0 1px #555, 0 8px 40px rgba(0,0,0,0.8), inset 0 1px 0 rgba(255,255,255,0.08)',
                                        position: 'relative',
                                    }}>
                                        {/* 상단 카메라 + 상태 표시등 */}
                                        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                                            <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#222', boxShadow: 'inset 0 0 0 1.5px #444, 0 0 4px rgba(0,120,255,0.3)' }} />
                                            <div style={{ width: '28px', height: '3px', borderRadius: '2px', background: '#1a1a1a', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.04)' }} />
                                            <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#22c55e', boxShadow: '0 0 6px rgba(34,197,94,0.7)' }} />
                                        </div>
                                        {/* 내부 이너 베젤 */}
                                        <div style={{
                                            background: '#111',
                                            borderRadius: '10px',
                                            overflow: 'hidden',
                                            boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.6)',
                                            border: '1px solid #333',
                                        }}>
                                            {playbackContent.imageUrl ? (
                                                playbackContent.type === 'video'
                                                    ? <video src={playbackContent.imageUrl} controls autoPlay loop style={{ display: 'block', maxHeight: '72vh', maxWidth: '88vw', width: 'auto', height: 'auto' }} />
                                                    : <img src={playbackContent.imageUrl} alt={playbackContent.title} style={{ display: 'block', maxHeight: '72vh', maxWidth: '88vw', width: 'auto', height: 'auto' }} />
                                            ) : (
                                                <div className={`w-full bg-gradient-to-br ${playbackContent.thumbnailColor} flex flex-col items-center justify-center gap-4 py-24`}>
                                                    <Play size={56} className="text-white/60" fill="white" />
                                                    <p className="text-white text-2xl font-black">{playbackContent.title}</p>
                                                    <p className="text-white/60 text-sm">현재 송출 중인 컨텐츠</p>
                                                </div>
                                            )}
                                        </div>
                                        {/* 하단 스피커 그릴 */}
                                        <div style={{ display: 'flex', justifyContent: 'center', gap: '3px', marginTop: '6px' }}>
                                            {Array.from({ length: 9 }).map((_, i) => (
                                                <div key={i} style={{ width: '3px', height: '3px', borderRadius: '50%', background: '#333' }} />
                                            ))}
                                        </div>
                                        {/* 닫기 버튼 */}
                                        <button
                                            className="absolute -top-3 -right-3 w-8 h-8 rounded-full flex items-center justify-center text-white transition-all hover:scale-110"
                                            style={{ background: '#444', boxShadow: '0 2px 8px rgba(0,0,0,0.5), 0 0 0 1px #666' }}
                                            onClick={() => setPlaybackContent(null)}
                                        >
                                            <X size={14} />
                                        </button>
                                    </div>
                                    <div className="mt-3 px-1 flex items-center justify-between">
                                        <p className="text-white font-bold text-sm">{playbackContent.title}</p>
                                        <span className="text-white/60 text-xs">{playbackContent.orientation === 'landscape' ? '가로' : '세로'} · {playbackContent.duration}</span>
                                    </div>
                                </motion.div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </>
            )}

            {/* ===== 컨텐츠관리 탭 ===== */}
            {activeTab === 'contents' && (
                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                    {/* 검색바 */}
                    <AdminCard elevated>
                        <AdminCardContent className="px-4 py-3 flex items-center gap-3">
                            <Search size={16} className="text-gray-400 flex-shrink-0" />
                            <input value={contentSearch} onChange={e => setContentSearch(e.target.value)}
                                placeholder="컨텐츠 검색 (제목, 태그)..."
                                className="flex-1 text-sm text-gray-700 placeholder-gray-300 outline-none bg-transparent" />
                            {contentSearch && (
                                <button onClick={() => setContentSearch('')}
                                    className="text-gray-300 transition-colors"
                                    onMouseEnter={e => (e.currentTarget.style.color = 'var(--theme-primary)')}
                                    onMouseLeave={e => (e.currentTarget.style.color = '')}>
                                    <X size={14} />
                                </button>
                            )}
                        </AdminCardContent>
                    </AdminCard>

                    {/* ── 미리보기 팝업 ── */}
                    {previewContent && (
                        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-6" onClick={() => setPreviewContent(null)}>
                            <div className="relative max-w-2xl w-full bg-black rounded-2xl overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>
                                <button onClick={() => setPreviewContent(null)} className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full bg-white/20 hover:bg-white/40 flex items-center justify-center text-white transition-all">
                                    <X size={14} />
                                </button>
                                {'imageUrl' in previewContent && previewContent.imageUrl ? (
                                    previewContent.type === 'video'
                                        ? <video src={previewContent.imageUrl} className="w-full max-h-[70vh] object-contain" controls autoPlay />
                                        : <img src={previewContent.imageUrl} alt={previewContent.title} className="w-full max-h-[70vh] object-contain" />
                                ) : (
                                    <div className={`w-full h-64 bg-gradient-to-br ${previewContent.thumbnailColor} flex flex-col items-center justify-center gap-3`}>
                                        <ImageIcon size={48} className="text-white/60" />
                                        <span className="text-white font-bold text-lg">{previewContent.title}</span>
                                        <span className="text-white/60 text-sm">AI 생성 컨텐츠 미리보기</span>
                                    </div>
                                )}
                                <div className="p-4">
                                    <p className="text-white font-bold">{previewContent.title}</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* 생성·등록 카드 (3섹션) */}
                    <div className={`bg-white rounded-2xl border-2 shadow-sm p-5 transition-all ${editingContentId ? 'border-amber-300' : 'border-gray-200'}`}>
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <h3 className="text-sm font-black text-gray-700 flex items-center gap-2">
                                    {editingContentId
                                        ? (<><Pencil size={14} className="text-amber-500" />컨텐츠 수정</>)
                                        : (<><Sparkles size={14} style={{ color: 'var(--theme-primary)' }} />컨텐츠 생성</>)}
                                </h3>
                                {/* AI / 일반 탭 - 헤더 */}
                                <div className="flex gap-1 rounded-xl p-1" style={{ background: 'var(--theme-primary-bg)' }}>
                                    <button onClick={() => setContentCardTab('ai')}
                                        className={`px-3 py-1 rounded-lg text-xs font-black transition-all ${contentCardTab === 'ai' ? 'text-white shadow' : 'text-gray-400 hover:text-gray-600'}`}
                                        style={contentCardTab === 'ai' ? { background: 'var(--theme-primary)' } : {}}>
                                        AI 컨텐츠
                                    </button>
                                    <button onClick={() => setContentCardTab('normal')}
                                        className={`px-3 py-1 rounded-lg text-xs font-black transition-all ${contentCardTab === 'normal' ? 'bg-white text-gray-700 shadow' : 'text-gray-400 hover:text-gray-600'}`}>
                                        일반 컨텐츠
                                    </button>
                                </div>
                            </div>
                            {editingContentId && (
                                <button onClick={() => { setEditingContentId(null); setContentTags([]); setEditTitle(''); setContentPrompt(''); setContentDescription(''); setContentResolution(''); }}
                                    className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1 font-bold">
                                    <X size={11} />취소
                                </button>
                            )}
                        </div>

                        <div className="grid grid-cols-3 gap-5 items-start">
                            {/* ── 섹션1: 검색태그 + 해상도+방향 + 제목 ── */}
                            <div className="flex flex-col gap-3">
                                <div>
                                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-wide flex items-center gap-1 mb-2"><Tag size={9} />검색 태그</label>
                                    <div className="border-2 border-gray-200 rounded-xl px-3 py-2 min-h-[46px] flex flex-wrap gap-1.5 items-center focus-within:outline-none"
                                        style={{ transition: 'border-color 0.15s' }}
                                        onFocusCapture={e => (e.currentTarget.style.borderColor = 'var(--theme-primary)')}
                                        onBlurCapture={e => (e.currentTarget.style.borderColor = '')}>
                                        {contentTags.map(tag => (
                                            <span key={tag} className="flex items-center gap-1 text-[11px] font-bold rounded-full px-2 py-0.5"
                                                style={{ background: 'var(--theme-primary-bg)', color: 'var(--theme-primary-text)' }}>
                                                #{tag}
                                                <button onClick={() => setContentTags(prev => prev.filter(t => t !== tag))} style={{ color: 'var(--theme-primary)' }}><X size={9} /></button>
                                            </span>
                                        ))}
                                        <input value={tagInput} onChange={e => setTagInput(e.target.value)}
                                            onKeyDown={e => {
                                                if ((e.key === ' ' || e.key === 'Enter') && tagInput.trim()) {
                                                    e.preventDefault();
                                                    const t = tagInput.trim().replace(/^#/, '');
                                                    if (t && !contentTags.includes(t)) setContentTags(prev => [...prev, t]);
                                                    setTagInput('');
                                                } else if (e.key === 'Backspace' && !tagInput && contentTags.length > 0) {
                                                    setContentTags(prev => prev.slice(0, -1));
                                                }
                                            }}
                                            placeholder={contentTags.length === 0 ? '태그→Space/Enter' : ''}
                                            className="text-[11px] outline-none bg-transparent min-w-[70px] flex-1 placeholder-gray-300"
                                        />
                                    </div>
                                    <p className="text-[9px] text-gray-400 mt-1">Space·Enter 추가 / Backspace 삭제</p>
                                </div>

                                {/* 해상도 + 가로/세로 스위치 */}
                                <div>
                                    <label className="text-[10px] font-black text-gray-500 block mb-1">해상도</label>
                                    <div className="flex gap-2 items-center">
                                        <input
                                            value={contentResolution}
                                            onChange={e => setContentResolution(formatResolution(e.target.value))}
                                            onKeyDown={e => handleResolutionKeyDown(e, contentResolution, setContentResolution)}
                                            placeholder="1920x1080"
                                            className="flex-1 border-2 border-gray-200 rounded-xl px-3 py-2 text-sm outline-none"
                                            onFocus={e => (e.currentTarget.style.borderColor = 'var(--theme-primary)')}
                                            onBlur={e => (e.currentTarget.style.borderColor = '')} />
                                        {/* 가로/세로 스위치 */}
                                        <div className="flex bg-gray-100 rounded-lg p-0.5 shrink-0">
                                            <button onClick={() => setContentOrientation('landscape')}
                                                title="가로"
                                                className="px-2 py-1.5 rounded-md text-[10px] font-black transition-all flex items-center gap-1"
                                                style={contentOrientation === 'landscape' ? { background: 'var(--theme-primary)', color: '#ffffff' } : { color: '#9ca3af' }}>
                                                <svg width="14" height="10" viewBox="0 0 14 10" fill="currentColor"><rect x="1" y="1" width="12" height="8" rx="1" stroke="currentColor" strokeWidth="1.5" fill="none" /></svg>
                                                가로
                                            </button>
                                            <button onClick={() => setContentOrientation('portrait')}
                                                title="세로"
                                                className="px-2 py-1.5 rounded-md text-[10px] font-black transition-all flex items-center gap-1"
                                                style={contentOrientation === 'portrait' ? { background: 'var(--theme-primary)', color: '#ffffff' } : { color: '#9ca3af' }}>
                                                <svg width="10" height="14" viewBox="0 0 10 14" fill="currentColor"><rect x="1" y="1" width="8" height="12" rx="1" stroke="currentColor" strokeWidth="1.5" fill="none" /></svg>
                                                세로
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* 컨텐츠 제목 */}
                                <div>
                                    <label className="text-[10px] font-black text-gray-500 block mb-1">컨텐츠 제목</label>
                                    <input value={editTitle} onChange={e => setEditTitle(e.target.value)} placeholder="제목 입력"
                                        className={`w-full border-2 rounded-xl px-3 py-2 text-sm outline-none ${editingContentId ? 'border-amber-200' : 'border-gray-200'}`}
                                        onFocus={e => (e.currentTarget.style.borderColor = editingContentId ? '#f59e0b' : 'var(--theme-primary)')}
                                        onBlur={e => (e.currentTarget.style.borderColor = editingContentId ? '#fde68a' : '')} />
                                </div>
                            </div>

                            {/* ── 섹션2: AI 프롬프트 or 컨텐츠 설명 (flex-col로 높이 채움) ── */}
                            <div className="flex flex-col h-full">
                                {contentCardTab === 'ai' ? (
                                    <>
                                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-wide block mb-2">AI 생성 프롬프트</label>
                                        <textarea value={contentPrompt}
                                            onChange={e => setContentPrompt(e.target.value)}
                                            placeholder="예: 봄 인테리어 블라인드 홍보 이미지&#10;예: 세련된 그라데이션 배경, 우측에 제품 이미지"
                                            className="flex-1 w-full border-2 border-gray-200 rounded-xl px-3 py-2 text-sm focus:border-violet-400 outline-none resize-none mb-3"
                                            style={{ minHeight: '120px' }}
                                        />
                                        <button
                                            onClick={() => {
                                                setPendingAiContent(null);
                                                setIsGenAi(true);
                                                setTimeout(() => {
                                                    const cols = ['from-pink-400 to-fuchsia-600', 'from-violet-500 to-indigo-700', 'from-emerald-400 to-cyan-600', 'from-amber-400 to-orange-600'];
                                                    const newColor = cols[Math.floor(Math.random() * cols.length)];
                                                    if (editingContentId) {
                                                        setContentList(prev => prev.map(c => c.id === editingContentId
                                                            ? { ...c, thumbnailColor: newColor, source: 'ai', imageUrl: undefined } : c));
                                                    } else {
                                                        setPendingAiContent({ color: newColor });
                                                    }
                                                    setIsGenAi(false);
                                                }, 2000);
                                            }}
                                            disabled={isGenAi}
                                            className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all ${isGenAi ? 'cursor-not-allowed' : 'shadow-md hover:shadow-lg active:scale-95'}`}
                                            style={isGenAi
                                                ? { background: 'var(--theme-primary-bg)', color: 'var(--theme-primary)' }
                                                : { background: 'var(--theme-primary)', color: '#ffffff' }}
                                        >
                                            {isGenAi ? (
                                                <><motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}><Sparkles size={12} /></motion.div>AI 생성 중...</>
                                            ) : editingContentId ? (
                                                <><Sparkles size={12} />AI 컨텐츠 재생성</>
                                            ) : (
                                                <><Sparkles size={12} />AI 컨텐츠 생성</>
                                            )}
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-wide block mb-2">컨텐츠 설명</label>
                                        <textarea value={contentDescription}
                                            onChange={e => setContentDescription(e.target.value)}
                                            placeholder="예: 봄 인테리어 블라인드 홍보 이미지"
                                            className="flex-1 w-full border-2 border-gray-200 rounded-xl px-3 py-2 text-sm outline-none resize-none"
                                            style={{ minHeight: '120px' }}
                                            onFocus={e => (e.currentTarget.style.borderColor = 'var(--theme-primary)')}
                                            onBlur={e => (e.currentTarget.style.borderColor = '')}
                                        />
                                    </>
                                )}
                            </div>

                            {/* ── 섹션3: 썸네일 + 미리보기 + 저장/삭제 ── */}
                            <div className="flex flex-col h-full">
                                <label className="text-[10px] font-black text-gray-500 uppercase tracking-wide block mb-2">컨텐츠 (AI생성 or 업로드)</label>

                                {editingContentId ? (
                                    <div className="flex flex-col gap-2 flex-1">
                                        {/* 썸네일 */}
                                        <div className="relative h-[160px] rounded-xl overflow-hidden flex-shrink-0">
                                            {editingContent?.imageUrl ? (
                                                editingContent.type === 'video'
                                                    ? <video src={editingContent.imageUrl} className="w-full h-full object-cover" muted />
                                                    : <img src={editingContent.imageUrl} alt={editingContent.title} className="w-full h-full object-cover" />
                                            ) : (
                                                <div className={`w-full h-full bg-gradient-to-br ${editingContent?.thumbnailColor || 'from-gray-200 to-gray-300'} flex items-center justify-center`}>
                                                    {editingContent?.type === 'video' ? <Play size={32} className="text-white/70" fill="white" /> : <ImageIcon size={32} className="text-white/70" />}
                                                </div>
                                            )}
                                            <span className={`absolute top-2 left-2 text-[9px] font-black px-2 py-0.5 rounded-full ${editingContent?.source === 'ai' ? 'bg-violet-600 text-white' : 'bg-emerald-600 text-white'}`}>
                                                {editingContent?.source === 'ai' ? '✦ AI생성' : '↑ 업로드'}
                                            </span>
                                            {isGenAi && (
                                                <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center gap-2">
                                                    <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}><Sparkles size={24} className="text-white" /></motion.div>
                                                    <span className="text-white text-xs font-bold">AI 생성 중...</span>
                                                </div>
                                            )}
                                            {/* 일반탭: 업로드 오버레이 */}
                                            {contentCardTab === 'normal' && !isGenAi && (
                                                <label className="absolute inset-0 bg-black/30 flex flex-col items-center justify-center gap-1 cursor-pointer hover:bg-black/45 transition-all">
                                                    <input type="file" accept="image/*,video/*" className="hidden"
                                                        onChange={e => {
                                                            const file = e.target.files?.[0]; if (!file) return;
                                                            const url = URL.createObjectURL(file);
                                                            const isVideo = file.type.startsWith('video/');
                                                            setContentList(prev => prev.map(c => c.id === editingContentId
                                                                ? { ...c, imageUrl: url, type: isVideo ? 'video' : 'image', source: 'upload' } : c));
                                                            e.target.value = '';
                                                        }} />
                                                    <UploadCloud size={20} className="text-white" />
                                                    <span className="text-white text-[10px] font-bold">이미지 / 영상 업로드</span>
                                                </label>
                                            )}
                                        </div>
                                        {/* 미리보기 버튼 */}
                                        <button onClick={() => editingContent && setPreviewContent(editingContent)}
                                            className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold bg-gray-100 text-gray-600 hover:bg-gray-200 transition-all active:scale-95">
                                            <Play size={12} />미리보기
                                        </button>
                                        <div className="flex gap-1.5">
                                            <button onClick={() => {
                                                if (!editTitle.trim()) { alert('제목을 입력하세요.'); return; }
                                                setContentList(prev => prev.map(c => c.id === editingContentId ? { ...c, title: editTitle, tags: contentTags } : c));
                                                setEditingContentId(null); setContentTags([]); setEditTitle(''); setContentPrompt(''); setContentDescription(''); setContentResolution(''); setPendingAiContent(null);
                                            }} disabled={isGenAi}
                                                className="flex-1 flex items-center justify-center gap-1 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-amber-400 to-orange-500 text-white shadow active:scale-95 transition-all disabled:opacity-40">
                                                <Check size={12} />수정 저장
                                            </button>
                                            <button onClick={() => {
                                                if (window.confirm('삭제하시겠습니까?')) {
                                                    setContentList(prev => prev.filter(c => c.id !== editingContentId));
                                                    setEditingContentId(null); setContentTags([]); setEditTitle(''); setContentPrompt(''); setContentDescription(''); setContentResolution(''); setPendingAiContent(null);
                                                }
                                            }} disabled={isGenAi}
                                                className="flex-1 flex items-center justify-center gap-1 py-2 rounded-xl text-xs font-bold bg-red-50 text-red-500 border border-red-200 hover:bg-red-100 transition-all active:scale-95 disabled:opacity-30">
                                                <Trash2 size={12} />삭제
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    /* ── 등록 모드 ── */
                                    <div className="flex flex-col gap-2 flex-1">
                                        {/* AI생성 임시 썸네일 또는 업로드 드롭존 */}
                                        {pendingAiContent ? (
                                            <div className="relative h-[160px] rounded-xl overflow-hidden flex-shrink-0">
                                                <div className={`w-full h-full bg-gradient-to-br ${pendingAiContent.color} flex flex-col items-center justify-center gap-2`}>
                                                    <Sparkles size={28} className="text-white/80" />
                                                    <span className="text-white text-xs font-bold">AI 생성 완료</span>
                                                </div>
                                                <span className="absolute top-2 left-2 text-[9px] font-black px-2 py-0.5 rounded-full text-white" style={{ background: 'var(--theme-primary)' }}>✦ AI생성</span>
                                            </div>
                                         ) : uploadedFile ? (
                                             <div className="relative h-[160px] rounded-xl overflow-hidden flex-shrink-0">
                                                 {uploadedFile.type === 'video'
                                                     ? <video src={uploadedFile.dataUrl} className="w-full h-full object-cover" muted />
                                                     : <img src={uploadedFile.dataUrl} alt={uploadedFile.name} className="w-full h-full object-cover" />}
                                                 <span className="absolute top-2 left-2 text-[9px] font-black px-2 py-0.5 rounded-full bg-emerald-600 text-white">↑ 업로드</span>
                                                 <label className="absolute bottom-2 right-2 cursor-pointer text-[9px] font-bold px-2 py-0.5 rounded-full bg-white/80 text-gray-700 hover:bg-white transition-all">
                                                     변경
                                                     <input type="file" accept="image/*,video/*" className="hidden"
                                                         onChange={e => {
                                                             const file = e.target.files?.[0]; if (!file) return;
                                                             const isVideo = file.type.startsWith('video/');
                                                             compressImageFile(file).then(dataUrl => {
                                                                 setUploadedFile({ dataUrl, type: isVideo ? 'video' : 'image', name: file.name });
                                                                 if (!editTitle) setEditTitle(file.name.split('.')[0].slice(0, 30));
                                                             });
                                                             e.target.value = '';
                                                         }} />
                                                 </label>
                                             </div>
                                         ) : (
                                             <label className="flex flex-col items-center justify-center h-[160px] flex-shrink-0 rounded-xl border-2 border-dashed border-gray-300 cursor-pointer transition-all"
                                                 onMouseEnter={e => { (e.currentTarget as HTMLLabelElement).style.borderColor = 'var(--theme-primary)'; (e.currentTarget as HTMLLabelElement).style.background = 'color-mix(in srgb, var(--theme-primary-bg) 30%, transparent)'; }}
                                                 onMouseLeave={e => { (e.currentTarget as HTMLLabelElement).style.borderColor = ''; (e.currentTarget as HTMLLabelElement).style.background = ''; }}>
                                                 <input ref={contentFileRef} type="file" accept="image/*,video/*" className="hidden"
                                                     onChange={e => {
                                                          const file = e.target.files?.[0]; if (!file) return;
                                                          const isVideo = file.type.startsWith('video/');
                                                          compressImageFile(file).then(dataUrl => {
                                                              setUploadedFile({ dataUrl, type: isVideo ? 'video' : 'image', name: file.name });
                                                              if (!editTitle) setEditTitle(file.name.split('.')[0].slice(0, 30));
                                                          });
                                                          e.target.value = '';
                                                      }}
                                                  />
                                                 <UploadCloud size={22} className="text-gray-400 mb-2" />
                                                 <span className="text-[11px] font-bold text-gray-400">이미지 / 영상 업로드</span>
                                             </label>
                                         )}
                                        {/* 미리보기 버튼 (AI 생성 완료 후에만) */}
                                        {pendingAiContent && (
                                            <button onClick={() => setPreviewContent({ thumbnailColor: pendingAiContent.color, type: 'image', title: editTitle || 'AI 생성 컨텐츠' })}
                                                className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold bg-gray-100 text-gray-600 hover:bg-gray-200 transition-all active:scale-95">
                                                <Play size={12} />미리보기
                                            </button>
                                        )}
                                        <div className="flex gap-1.5">
                                             <button onClick={() => {
                                                 if (!editTitle.trim()) { alert('제목을 입력하세요.'); return; }
                                                 if (!pendingAiContent && !uploadedFile) { alert('AI 콘텐츠를 생성하거나 파일을 업로드하세요.'); return; }
                                                 const newItem: ManagedContent = uploadedFile ? {
                                                     id: 'up-' + Date.now(),
                                                     title: editTitle,
                                                     tags: [...contentTags],
                                                     duration: '00:00',
                                                     thumbnailColor: 'from-gray-400 to-gray-600',
                                                     type: uploadedFile.type,
                                                     source: 'upload',
                                                     orientation: (contentOrientation === 'portrait') ? 'portrait' : 'landscape',
                                                     imageUrl: uploadedFile.dataUrl,
                                                 } : {
                                                     id: 'ai-' + Date.now(),
                                                     title: editTitle,
                                                     tags: [...contentTags],
                                                     duration: '00:30',
                                                     thumbnailColor: pendingAiContent!.color,
                                                     type: 'image',
                                                     source: 'ai',
                                                     orientation: (contentOrientation === 'portrait') ? 'portrait' : 'landscape',
                                                 };
                                                 setContentList(prev => [newItem, ...prev]);
                                                 setEditTitle(''); setContentTags([]); setContentPrompt(''); setContentResolution(''); setPendingAiContent(null); setUploadedFile(null);
                                             }}
                                                 className="flex-1 flex items-center justify-center gap-1 py-2 rounded-xl text-xs font-bold text-white shadow active:scale-95 transition-all"
                                                 style={{ background: 'var(--theme-primary)' }}>
                                                 <Check size={12} />저장
                                             </button>
                                             <button onClick={() => { setEditTitle(''); setContentTags([]); setContentDescription(''); setContentPrompt(''); setContentResolution(''); setPendingAiContent(null); setUploadedFile(null); }}
                                                 className="flex-1 flex items-center justify-center gap-1 py-2 rounded-xl text-xs font-bold bg-red-50 text-red-500 border border-red-200 hover:bg-red-100 transition-all active:scale-95">
                                                 <Trash2 size={12} />초기화
                                             </button>
                                         </div>
                                    </div>
                                )}
                            </div>

                        </div>
                    </div>
                    {/* 거래처 선택 + 컨텐츠 그리드 */}
                    <div className="space-y-4">
                        {/* 컨텐츠 그리드 */}
                        {(() => {
                            const baseFilter = (c: ManagedContent) =>
                                !contentSearch || c.title.includes(contentSearch) || c.tags.some(t => t.includes(contentSearch));
                            const usedIds = contentTabPartnerId ? (partnerUsedContents[contentTabPartnerId] || []) : [];
                            const usedContents = contentTabPartnerId ? contentList.filter(c => usedIds.includes(c.id) && baseFilter(c)) : [];
                            const otherContents = contentTabPartnerId
                                ? contentList.filter(c => !usedIds.includes(c.id) && baseFilter(c))
                                : contentList.filter(baseFilter);

                            const renderCard = (content: ManagedContent, isUsed?: boolean) => (
                                <motion.div
                                    key={content.id}
                                    className={`rounded-2xl border-2 overflow-hidden hover:shadow-lg transition-all group cursor-pointer
                                        ${editingContentId === content.id ? 'border-amber-400 shadow-amber-100 shadow-md bg-white' :
                                        isUsed ? 'border-2 bg-white' : 'border-gray-200 bg-white hover:border-violet-300'}`}
                                    style={isUsed ? { borderColor: 'var(--theme-primary)', boxShadow: '0 0 0 2px var(--theme-primary-bg)' } : {}}
                                    onClick={() => {
                                        if (editingContentId === content.id) {
                                            setEditingContentId(null); setContentTags([]); setEditTitle('');
                                        } else {
                                            setEditingContentId(content.id);
                                            setContentTags([...content.tags]);
                                            setEditTitle(content.title);
                                            setContentPrompt('');
                                        }
                                    }}
                                    onDoubleClick={() => {
                                        if (!contentTabPartnerId) return;
                                        setPartnerUsedContents(prev => {
                                            const cur = prev[contentTabPartnerId] || [];
                                            return {
                                                ...prev,
                                                [contentTabPartnerId]: cur.includes(content.id)
                                                    ? cur.filter(id => id !== content.id)
                                                    : [...cur, content.id],
                                            };
                                        });
                                    }}
                                >
                                    <div className={`relative overflow-hidden flex items-center justify-center
                                        ${content.orientation === 'portrait' ? 'h-36' : 'h-28'}
                                        ${content.imageUrl ? '' : `bg-gradient-to-br ${content.thumbnailColor}`}`}>
                                        {content.imageUrl ? (
                                            content.type === 'video'
                                                ? <video src={content.imageUrl} className="absolute inset-0 w-full h-full object-contain" style={{background:'#111'}} muted />
                                                : <img src={content.imageUrl} alt={content.title} className="absolute inset-0 w-full h-full object-contain" style={{background:'#111'}} />
                                        ) : (
                                            <>
                                                <div className="absolute inset-0 opacity-20 animate-pulse" style={{ background: 'rgba(255,255,255,0.3)' }} />
                                                <div className="flex flex-col items-center gap-1.5">
                                                    <Play size={24} className="text-white/80" fill="white" />
                                                    <span className="text-white/70 text-[9px] font-bold">GIF · {content.duration}</span>
                                                </div>
                                            </>
                                        )}
                                        <span className={`absolute top-2 left-2 text-[8px] font-black px-1.5 py-0.5 rounded-full ${content.source === 'ai' ? 'bg-violet-600 text-white' : 'bg-emerald-600 text-white'}`}>
                                            {content.source === 'ai' ? 'AI' : 'UP'}
                                        </span>
                                        <span className="absolute top-2 right-2 text-[8px] font-black px-1.5 py-0.5 rounded-full bg-black/40 text-white">
                                            {content.orientation === 'portrait' ? '세로' : '가로'}
                                        </span>
                                        {/* 사용중 뱃지 */}
                                        {isUsed && (
                                            <span className="absolute bottom-2 left-2 text-[8px] font-black px-1.5 py-0.5 rounded-full text-white flex items-center gap-0.5" style={{ background: 'var(--theme-primary)' }}>
                                                <Check size={8} /> 사용중
                                            </span>
                                        )}
                                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center gap-2">
                                            <button
                                                className="opacity-0 group-hover:opacity-100 w-8 h-8 rounded-full bg-white/90 flex items-center justify-center transition-opacity hover:bg-white shadow-md"
                                                onClick={e => { e.stopPropagation(); setPreviewContent(content); }}
                                                title="미리보기"
                                            >
                                                <Eye size={14} className="text-gray-700" />
                                            </button>
                                            <button
                                                className="opacity-0 group-hover:opacity-100 w-8 h-8 rounded-full bg-white/90 flex items-center justify-center transition-opacity hover:bg-white shadow-md"
                                                onClick={e => {
                                                    e.stopPropagation();
                                                    if (editingContentId === content.id) { setEditingContentId(null); setContentTags([]); setEditTitle(''); }
                                                    else { setEditingContentId(content.id); setContentTags([...content.tags]); setEditTitle(content.title); setContentPrompt(''); }
                                                }}
                                                title="수정"
                                            >
                                                <Pencil size={13} className={editingContentId === content.id ? 'text-amber-600' : 'text-gray-700'} />
                                            </button>
                                        </div>
                                        {editingContentId === content.id && <div className="absolute bottom-0 inset-x-0 h-1 bg-amber-400" />}
                                    </div>
                                    <div className="p-3">
                                        <p className="text-xs font-black text-gray-800 mb-1 leading-tight">{content.title}</p>
                                        <div className="flex flex-wrap gap-1">
                                            {content.tags.slice(0, 3).map(tag => (
                                                <span key={tag} className="text-[9px] font-bold bg-violet-50 text-violet-600 rounded-md px-1.5 py-0.5">#{tag}</span>
                                            ))}
                                            {content.tags.length > 3 && <span className="text-[9px] text-gray-400">+{content.tags.length - 3}</span>}
                                        </div>
                                    </div>
                                </motion.div>
                            );

                            return (
                                <>
                                    {/* 거래처 사용 컨텐츠 */}
                                    {contentTabPartnerId && usedContents.length > 0 && (
                                        <div>
                                            <p className="text-[11px] font-black mb-3 flex items-center gap-2" style={{ color: 'var(--theme-primary)' }}>
                                                <Check size={11} />
                                                {partners.find(p => p.id === contentTabPartnerId)?.partnerName} 사용 컨텐츠 {usedContents.length}개
                                                <span className="text-gray-400 font-normal">(더블클릭으로 제외)</span>
                                            </p>
                                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                                                {usedContents.map(c => renderCard(c, true))}
                                            </div>
                                        </div>
                                    )}
                                    {/* 전체 컨텐츠 */}
                                    <div>
                                        {/* 선택된 거래처명 표시 (미선택 시 숨김) */}
                                        {contentTabPartnerId && (() => {
                                            const pName = partners.find(p => p.id === contentTabPartnerId)?.partnerName;
                                            return pName ? (
                                                <div className="flex items-center gap-2 mb-3">
                                                    <span className="text-xs font-extrabold px-3 py-1.5 rounded-xl flex items-center gap-1.5"
                                                        style={{ background: 'var(--theme-primary)', color: '#fff' }}>
                                                        <Building2 size={11} />
                                                        {pName}
                                                    </span>
                                                    {contentTabPartnerId && (
                                                        <span className="text-[10px] font-bold text-gray-400">더블클릭으로 사용/미사용 설정</span>
                                                    )}
                                                </div>
                                            ) : null;
                                        })()}
                                        <p className="text-[11px] text-gray-400 mb-3 font-medium">
                                            {contentTabPartnerId ? `전체 컨텐츠 ${otherContents.length}개` : `등록된 컨텐츠 ${otherContents.length}개`}
                                            {editingContentId && <span className="ml-2 text-amber-500 font-bold">· 수정 중</span>}
                                        </p>
                                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                                            {otherContents.map(c => renderCard(c, false))}
                                        </div>
                                    </div>
                                </>
                            );
                        })()}
                    </div>
                    {/* 미리보기 전체화면 팝업 */}
                    {previewContent && (
                        <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4" onClick={() => setPreviewContent(null)}>
                            <div className="relative max-w-full max-h-full" onClick={e => e.stopPropagation()}>
                                {previewContent.imageUrl ? (
                                    previewContent.type === 'video'
                                        ? <video src={previewContent.imageUrl} controls autoPlay loop className="max-w-full max-h-full rounded-lg shadow-lg" />
                                        : <img src={previewContent.imageUrl} alt={previewContent.title} className="max-w-full max-h-full rounded-lg shadow-lg" />
                                ) : (
                                    <div className={`w-[80vw] h-[80vh] max-w-[1200px] max-h-[800px] bg-gradient-to-br ${previewContent.thumbnailColor} rounded-lg shadow-lg flex flex-col items-center justify-center gap-4`}>
                                        <Sparkles size={48} className="text-white/80" />
                                        <p className="text-white text-xl font-bold">{previewContent.title}</p>
                                        <p className="text-white/70 text-sm">AI 생성 컨텐츠 (미리보기)</p>
                                    </div>
                                )}
                                <button
                                    className="absolute top-4 right-4 bg-white/30 backdrop-blur-sm text-white rounded-full p-2 hover:bg-white/50 transition-all"
                                    onClick={() => setPreviewContent(null)}
                                >
                                    <X size={20} />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )
            }

            {/* ===== 단말기등록 탭 ===== */}
            {activeTab === 'register' && (
                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                    <div className={`bg-white rounded-2xl border-2 shadow-sm p-5 transition-all ${editingDeviceId ? 'border-amber-300' : 'border-gray-200'}`}>
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-sm font-black text-gray-700 flex items-center gap-2">
                                {editingDeviceId
                                    ? (<><Pencil size={14} className="text-amber-500" />단말기 수정</>)
                                    : (<><Plus size={14} style={{ color: 'var(--theme-primary)' }} />단말기 등록</>)}
                            </h3>
                            {editingDeviceId && (
                                <button onClick={() => { setEditingDeviceId(null); setRegForm({ deviceName: '', spec: '', resolution: '', orientation: 'landscape', installedAt: '', location: '', contactName: '', contactPhone: '' }); }}
                                    className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1 font-bold"><X size={11} />취소</button>
                            )}
                        </div>
                        <div className="mb-4 p-3 bg-gray-50 rounded-xl border border-gray-200">
                            <p className="text-[10px] font-black text-gray-500 mb-1">거래처</p>
                            <p className="text-sm font-bold text-gray-700">{selectedPartner ? selectedPartner.partnerName : '상단에서 거래처를 먼저 검색하세요'}</p>
                        </div>
                        <div className="grid grid-cols-3 gap-3">
                            {/* 행1: 단말기명 | 규격 | 설치장소 */}
                            <div>
                                <label className="text-[10px] font-black text-gray-500 block mb-1">단말기명</label>
                                <input value={regForm.deviceName}
                                    onChange={e => setRegForm(prev => ({ ...prev, deviceName: e.target.value }))}
                                    placeholder="예: 강남 쇼룸 메인"
                                    className="w-full border-2 border-gray-200 rounded-xl px-3 py-2 text-sm outline-none"
                                    onFocus={e => (e.currentTarget.style.borderColor = 'var(--theme-primary)')}
                                    onBlur={e => (e.currentTarget.style.borderColor = '')} />
                            </div>
                            <div>
                                <label className="text-[10px] font-black text-gray-500 block mb-1">규격</label>
                                <input value={regForm.spec}
                                    onChange={e => setRegForm(prev => ({ ...prev, spec: e.target.value }))}
                                    placeholder='65" 4K OLED'
                                    className="w-full border-2 border-gray-200 rounded-xl px-3 py-2 text-sm outline-none"
                                    onFocus={e => (e.currentTarget.style.borderColor = 'var(--theme-primary)')}
                                    onBlur={e => (e.currentTarget.style.borderColor = '')} />
                            </div>
                            <div>
                                <label className="text-[10px] font-black text-gray-500 block mb-1">설치장소</label>
                                <input value={regForm.location}
                                    onChange={e => setRegForm(prev => ({ ...prev, location: e.target.value }))}
                                    placeholder="서울시 강남구"
                                    className="w-full border-2 border-gray-200 rounded-xl px-3 py-2 text-sm outline-none"
                                    onFocus={e => (e.currentTarget.style.borderColor = 'var(--theme-primary)')}
                                    onBlur={e => (e.currentTarget.style.borderColor = '')} />
                            </div>

                            {/* 행2: [해상도+사용방향] | [담당자+전화] | 설치일 - 모두 1칸 */}
                            <div className="border-2 border-gray-200 rounded-xl px-3 py-2"
                                onFocusCapture={e => (e.currentTarget.style.borderColor = 'var(--theme-primary)')}
                                onBlurCapture={e => (e.currentTarget.style.borderColor = '')}>
                                <label className="text-[10px] font-black text-gray-500 block mb-1.5">해상도 · 사용방향</label>
                                <div className="flex items-center gap-2">
                                    <input
                                        value={regForm.resolution}
                                        onChange={e => setRegForm(prev => ({ ...prev, resolution: formatResolution(e.target.value) }))}
                                        onKeyDown={e => handleResolutionKeyDown(e, regForm.resolution, v => setRegForm(prev => ({ ...prev, resolution: v })))}
                                        placeholder="3840x2160"
                                        className="flex-1 outline-none text-sm bg-transparent min-w-0" />
                                    <div className="h-5 w-px bg-gray-200 flex-shrink-0" />
                                    <span className="text-[10px] font-bold flex-shrink-0" style={{ color: regForm.orientation === 'landscape' ? 'var(--theme-primary)' : '#9ca3af' }}>가로</span>
                                    <button onClick={() => setRegForm(prev => ({ ...prev, orientation: prev.orientation === 'landscape' ? 'portrait' : 'landscape' }))}
                                        className="relative w-9 h-5 rounded-full transition-all flex-shrink-0"
                                        style={{ background: regForm.orientation === 'portrait' ? 'var(--theme-primary)' : '#d1d5db' }}>
                                        <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${regForm.orientation === 'portrait' ? 'left-[18px]' : 'left-0.5'}`} />
                                    </button>
                                    <span className="text-[10px] font-bold flex-shrink-0" style={{ color: regForm.orientation === 'portrait' ? 'var(--theme-primary)' : '#9ca3af' }}>세로</span>
                                </div>
                            </div>
                            <div className="border-2 border-gray-200 rounded-xl px-3 py-2"
                                onFocusCapture={e => (e.currentTarget.style.borderColor = 'var(--theme-primary)')}
                                onBlurCapture={e => (e.currentTarget.style.borderColor = '')}>
                                <label className="text-[10px] font-black text-gray-500 block mb-1.5">담당자 · 전화</label>
                                <div className="flex items-center gap-2">
                                    <input value={regForm.contactName}
                                        onChange={e => setRegForm(prev => ({ ...prev, contactName: e.target.value }))}
                                        placeholder="이름"
                                        className="w-[60px] outline-none text-sm bg-transparent flex-shrink-0" />
                                    <div className="h-5 w-px bg-gray-200 flex-shrink-0" />
                                    <input value={regForm.contactPhone}
                                        onChange={e => setRegForm(prev => ({ ...prev, contactPhone: formatPhone(e.target.value) }))}
                                        placeholder="010-0000-0000" maxLength={13}
                                        className="flex-1 outline-none text-sm bg-transparent min-w-0" />
                                </div>
                            </div>
                            <div>
                                <label className="text-[10px] font-black text-gray-500 block mb-1">설치일</label>
                                <input type="date" value={regForm.installedAt}
                                    onChange={e => setRegForm(prev => ({ ...prev, installedAt: e.target.value }))}
                                    className="w-full border-2 border-gray-200 rounded-xl px-3 py-2 text-sm outline-none"
                                    onFocus={e => (e.currentTarget.style.borderColor = 'var(--theme-primary)')}
                                    onBlur={e => (e.currentTarget.style.borderColor = '')} />
                            </div>
                        </div>
                        <button onClick={handleRegisterOrUpdate}
                            className={`w-full mt-4 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-black shadow-md active:scale-95 transition-all text-white ${editingDeviceId ? '' : 'hover:shadow-lg'}`}
                            style={{ background: editingDeviceId ? 'linear-gradient(to right, #f59e0b, #f97316)' : 'var(--theme-primary)' }}>
                            {editingDeviceId ? (<><Check size={15} />수정 저장</>) : (<><Plus size={15} />단말기 등록</>)}
                        </button>
                    </div>
                    {registeredDevices.length > 0 && (
                        <div>
                            <p className="text-[11px] text-gray-400 mb-3 font-medium">등록된 단말기 {registeredDevices.length}대</p>
                            <div className="space-y-2">
                                {registeredDevices.map(d => (
                                    <div key={d.id} className="rounded-2xl border-2 p-4 flex items-center justify-between" style={{ background: 'var(--admin-surface)', borderColor: 'var(--admin-border)' }}>
                                        <div>
                                            <p className="text-sm font-black text-gray-800">{d.name}</p>
                                            <p className="text-xs text-gray-500">{d.partnerName} · {d.location} · {d.installedAt}</p>
                                            <p className="text-xs text-gray-400">{d.spec} · {d.resolution} · {d.orientation === 'landscape' ? '가로' : '세로'}</p>
                                        </div>
                                        <div className="flex gap-2">
                                            <button onClick={() => handleEditDevice(d)} className="flex items-center gap-1 px-3 py-1.5 bg-amber-50 text-amber-600 rounded-xl text-xs font-bold border border-amber-200 hover:bg-amber-100">
                                                <Pencil size={11} />수정
                                            </button>
                                            <button onClick={() => setRegisteredDevices(prev => prev.filter(x => x.id !== d.id))} className="flex items-center gap-1 px-3 py-1.5 bg-red-50 text-red-500 rounded-xl text-xs font-bold border border-red-200 hover:bg-red-100">
                                                <Trash2 size={11} />삭제
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

// ─── Error Boundary ─────────────────────────────────────────────────────────
interface EBProps { children: React.ReactNode }
interface EBState { hasError: boolean; errorMsg: string }

class AdminDeviceErrorBoundary extends React.Component<EBProps, EBState> {
    constructor(props: EBProps) {
        super(props);
        this.state = { hasError: false, errorMsg: '' };
    }
    static getDerivedStateFromError(error: Error): EBState {
        return { hasError: true, errorMsg: error?.message || '알 수 없는 오류' };
    }
    componentDidCatch(error: Error, info: React.ErrorInfo) {
        console.error('[AdminDeviceManagement] 렌더 에러:', error, info);
    }
    render() {
        if (this.state.hasError) {
            return (
                <div className="flex-1 flex flex-col items-center justify-center gap-4 p-8 bg-gray-50">
                    <div className="w-16 h-16 rounded-2xl bg-red-50 border border-red-200 flex items-center justify-center">
                        <span className="text-2xl">⚠️</span>
                    </div>
                    <p className="text-sm font-bold text-red-600">설치기기 화면 로드 중 오류가 발생했습니다.</p>
                    <p className="text-xs text-gray-400">{this.state.errorMsg}</p>
                    <button
                        className="px-4 py-2 bg-violet-500 text-white rounded-xl text-sm font-bold"
                        onClick={() => {
                            localStorage.removeItem('admin_registered_devices');
                            localStorage.removeItem('admin_content_list');
                            this.setState({ hasError: false, errorMsg: '' });
                        }}
                    >
                        데이터 초기화 후 재시도
                    </button>
                </div>
            );
        }
        return this.props.children;
    }
}

const AdminDeviceManagementWithBoundary: React.FC = () => (
    <AdminDeviceErrorBoundary>
        <AdminDeviceManagement />
    </AdminDeviceErrorBoundary>
);

export default AdminDeviceManagementWithBoundary;
