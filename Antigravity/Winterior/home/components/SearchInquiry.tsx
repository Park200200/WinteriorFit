import React, { useState, useMemo } from 'react';
import { Search, ChevronRight, User, Phone, MapPin, Calendar, FileText, Package, Truck, DollarSign, Clock, CheckCircle2, AlertCircle, Filter, X, Eye } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// 주문 상태 타입
type OrderStatus = '접수' | '실측완료' | '제작중' | '배송중' | '시공완료' | '취소';

interface OrderItem {
    id: string;
    orderDate: string;
    customerName: string;
    phone: string;
    address: string;
    productName: string;
    spec: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    status: OrderStatus;
    deliveryType: string;
    constructionDate: string;
    memo: string;
}

// Mock data
const MOCK_ORDERS: OrderItem[] = [
    { id: 'ORD-2026-001', orderDate: '2026-02-01', customerName: '김영수', phone: '010-1234-5678', address: '서울 강남구 테헤란로 123', productName: '우드 블라인드 (오크)', spec: '120×150', quantity: 3, unitPrice: 85000, totalPrice: 255000, status: '시공완료', deliveryType: '시공', constructionDate: '2026-02-10', memo: '오전 방문 요청' },
    { id: 'ORD-2026-002', orderDate: '2026-02-03', customerName: '이미정', phone: '010-2345-6789', address: '서울 서초구 반포대로 45', productName: '롤 블라인드 (화이트)', spec: '90×200', quantity: 5, unitPrice: 45000, totalPrice: 225000, status: '배송중', deliveryType: '배달', constructionDate: '2026-02-15', memo: '' },
    { id: 'ORD-2026-003', orderDate: '2026-02-05', customerName: '박준호', phone: '010-3456-7890', address: '경기 성남시 분당구 판교로 67', productName: '허니콤 쉐이드 (베이지)', spec: '110×180', quantity: 2, unitPrice: 120000, totalPrice: 240000, status: '제작중', deliveryType: '시공', constructionDate: '2026-02-20', memo: '색상 재확인 필요' },
    { id: 'ORD-2026-004', orderDate: '2026-02-07', customerName: '최수진', phone: '010-4567-8901', address: '서울 마포구 월드컵북로 89', productName: '쉬폰 커튼 (아이보리)', spec: '200×240', quantity: 4, unitPrice: 65000, totalPrice: 260000, status: '접수', deliveryType: '배달', constructionDate: '2026-02-25', memo: '' },
    { id: 'ORD-2026-005', orderDate: '2026-02-08', customerName: '정민호', phone: '010-5678-9012', address: '서울 송파구 올림픽로 12', productName: '알루미늄 블라인드 25mm', spec: '80×150', quantity: 8, unitPrice: 35000, totalPrice: 280000, status: '실측완료', deliveryType: '시공', constructionDate: '2026-02-28', memo: '거실 4, 방 4' },
    { id: 'ORD-2026-006', orderDate: '2026-02-10', customerName: '한소희', phone: '010-6789-0123', address: '경기 용인시 수지구 성복로 34', productName: '듀오 쉐이드 (그레이)', spec: '130×200', quantity: 3, unitPrice: 95000, totalPrice: 285000, status: '제작중', deliveryType: '직출', constructionDate: '2026-03-01', memo: '' },
    { id: 'ORD-2026-007', orderDate: '2026-02-12', customerName: '임지우', phone: '010-7890-1234', address: '서울 강동구 천호대로 56', productName: '버티칼 블라인드 (네이비)', spec: '300×250', quantity: 1, unitPrice: 180000, totalPrice: 180000, status: '접수', deliveryType: '시공', constructionDate: '2026-03-05', memo: '대형 사이즈' },
    { id: 'ORD-2026-008', orderDate: '2026-02-14', customerName: '오세현', phone: '010-8901-2345', address: '서울 노원구 동일로 78', productName: '우드 블라인드 (월넛)', spec: '100×170', quantity: 6, unitPrice: 90000, totalPrice: 540000, status: '배송중', deliveryType: '시공', constructionDate: '2026-03-08', memo: '2층 전체' },
    { id: 'ORD-2026-009', orderDate: '2026-02-16', customerName: '강다은', phone: '010-9012-3456', address: '경기 고양시 일산서구 중앙로 90', productName: '롤 블라인드 (블랙아웃)', spec: '85×190', quantity: 4, unitPrice: 55000, totalPrice: 220000, status: '시공완료', deliveryType: '배달', constructionDate: '2026-02-22', memo: '' },
    { id: 'ORD-2026-010', orderDate: '2026-02-18', customerName: '윤재혁', phone: '010-0123-4567', address: '서울 관악구 관악로 11', productName: '암막 커튼 (차콜)', spec: '180×230', quantity: 2, unitPrice: 78000, totalPrice: 156000, status: '취소', deliveryType: '시공', constructionDate: '', memo: '고객 취소 요청' },
    { id: 'ORD-2026-011', orderDate: '2026-02-19', customerName: '배서연', phone: '010-1111-2222', address: '서울 동작구 상도로 22', productName: '쉬폰 커튼 (민트)', spec: '160×220', quantity: 3, unitPrice: 62000, totalPrice: 186000, status: '접수', deliveryType: '배달', constructionDate: '2026-03-10', memo: '' },
    { id: 'ORD-2026-012', orderDate: '2026-02-20', customerName: '송태민', phone: '010-3333-4444', address: '경기 파주시 운정로 55', productName: '우드 블라인드 (원목)', spec: '140×160', quantity: 5, unitPrice: 110000, totalPrice: 550000, status: '실측완료', deliveryType: '시공', constructionDate: '2026-03-12', memo: '거실+안방' },
];

const STATUS_CONFIG: Record<OrderStatus, { color: string; bg: string; icon: typeof CheckCircle2 }> = {
    '접수': { color: 'text-blue-600', bg: 'bg-blue-50 border-blue-200', icon: Clock },
    '실측완료': { color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-200', icon: Eye },
    '제작중': { color: 'text-amber-600', bg: 'bg-amber-50 border-amber-200', icon: Package },
    '배송중': { color: 'text-violet-600', bg: 'bg-violet-50 border-violet-200', icon: Truck },
    '시공완료': { color: 'text-green-600', bg: 'bg-green-50 border-green-200', icon: CheckCircle2 },
    '취소': { color: 'text-red-500', bg: 'bg-red-50 border-red-200', icon: AlertCircle },
};

const ALL_STATUSES: OrderStatus[] = ['접수', '실측완료', '제작중', '배송중', '시공완료', '취소'];

const SearchInquiry: React.FC = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedOrderId, setSelectedOrderId] = useState<string | null>(MOCK_ORDERS[0]?.id || null);
    const [statusFilter, setStatusFilter] = useState<OrderStatus | '전체'>('전체');

    const filteredOrders = useMemo(() => {
        let result = MOCK_ORDERS;
        if (statusFilter !== '전체') {
            result = result.filter(o => o.status === statusFilter);
        }
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            result = result.filter(o =>
                o.customerName.toLowerCase().includes(q) ||
                o.phone.includes(q) ||
                o.id.toLowerCase().includes(q) ||
                o.productName.toLowerCase().includes(q) ||
                o.address.toLowerCase().includes(q)
            );
        }
        return result;
    }, [searchQuery, statusFilter]);

    const selectedOrder = useMemo(() => {
        return MOCK_ORDERS.find(o => o.id === selectedOrderId) || null;
    }, [selectedOrderId]);

    return (
        <div className="flex flex-col h-full w-full bg-gray-50 overflow-hidden font-sans">
            {/* TOP: Search Bar */}
            <div className="flex-shrink-0 bg-white border-b border-gray-200 px-6 py-4 shadow-sm z-20">
                <div className="flex items-center gap-4">
                    <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2 min-w-fit">
                        <Search className="text-blue-600" size={22} /> 조회
                    </h1>
                    {/* Search Input */}
                    <div className="flex-1 max-w-2xl relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            placeholder="고객명, 전화번호, 주문번호, 상품명, 주소로 검색..."
                            className="w-full pl-11 pr-10 py-2.5 rounded-xl bg-gray-100 border border-gray-200 text-sm font-medium
                                       focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-300 focus:bg-white transition-all"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                        {searchQuery && (
                            <button
                                onClick={() => setSearchQuery('')}
                                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded-full transition-all"
                            >
                                <X size={14} />
                            </button>
                        )}
                    </div>
                    {/* Status Filter */}
                    <div className="flex items-center gap-1.5">
                        <Filter size={14} className="text-gray-400" />
                        <button
                            onClick={() => setStatusFilter('전체')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${statusFilter === '전체' ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
                        >
                            전체
                        </button>
                        {ALL_STATUSES.map(s => {
                            const cfg = STATUS_CONFIG[s];
                            return (
                                <button
                                    key={s}
                                    onClick={() => setStatusFilter(s)}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${statusFilter === s ? `${cfg.bg} ${cfg.color} border` : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
                                >
                                    {s}
                                </button>
                            );
                        })}
                    </div>
                    <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-100">
                        {filteredOrders.length}건
                    </span>
                </div>
            </div>

            {/* BOTTOM: Left Results + Right Detail */}
            <div className="flex-1 flex min-h-0 overflow-hidden">

                {/* LEFT: Search Results List */}
                <div className="w-[480px] bg-white border-r border-gray-200 flex flex-col flex-shrink-0 overflow-hidden">
                    {/* List Header */}
                    <div className="flex items-center bg-gray-50 border-b border-gray-200 text-[10px] font-bold text-gray-400 uppercase tracking-wider px-4 py-2.5 flex-shrink-0">
                        <div className="w-[100px]">주문번호</div>
                        <div className="w-[70px]">고객명</div>
                        <div className="w-[100px]">전화번호</div>
                        <div className="flex-1">상품명</div>
                        <div className="w-[70px] text-right">금액</div>
                        <div className="w-[70px] text-center">상태</div>
                    </div>

                    {/* List Body */}
                    <div className="flex-1 overflow-y-auto">
                        {filteredOrders.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                                <Search size={40} strokeWidth={1.5} />
                                <p className="text-sm font-medium mt-3">검색 결과가 없습니다</p>
                            </div>
                        ) : (
                            <AnimatePresence>
                                {filteredOrders.map((order) => {
                                    const stCfg = STATUS_CONFIG[order.status];
                                    const StIcon = stCfg.icon;
                                    return (
                                        <motion.div
                                            key={order.id}
                                            onClick={() => setSelectedOrderId(order.id)}
                                            className={`flex items-center px-4 py-3 border-b border-gray-100 cursor-pointer transition-all
                                                ${selectedOrderId === order.id
                                                    ? 'bg-blue-50 border-l-[3px] border-l-blue-500'
                                                    : 'hover:bg-gray-50 border-l-[3px] border-l-transparent'
                                                }`}
                                            whileHover={{ x: 2 }}
                                            transition={{ duration: 0.15 }}
                                        >
                                            <div className="w-[100px]">
                                                <span className="text-[11px] text-gray-500 font-mono">{order.id}</span>
                                            </div>
                                            <div className="w-[70px]">
                                                <span className={`text-sm font-bold ${selectedOrderId === order.id ? 'text-blue-700' : 'text-gray-800'}`}>
                                                    {order.customerName}
                                                </span>
                                            </div>
                                            <div className="w-[100px]">
                                                <span className="text-xs text-gray-500 font-mono">{order.phone}</span>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <span className="text-xs text-gray-600 truncate block">{order.productName}</span>
                                            </div>
                                            <div className="w-[70px] text-right">
                                                <span className={`text-xs font-bold font-mono ${selectedOrderId === order.id ? 'text-blue-600' : 'text-gray-700'}`}>
                                                    {order.totalPrice.toLocaleString()}
                                                </span>
                                            </div>
                                            <div className="w-[70px] flex justify-center">
                                                <span className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-bold border ${stCfg.bg} ${stCfg.color}`}>
                                                    <StIcon size={10} />
                                                    {order.status}
                                                </span>
                                            </div>
                                        </motion.div>
                                    );
                                })}
                            </AnimatePresence>
                        )}
                    </div>
                </div>

                {/* RIGHT: Detail View */}
                <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
                    {!selectedOrder ? (
                        <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-3">
                            <FileText size={48} strokeWidth={1.5} />
                            <p className="text-sm font-medium">좌측 목록에서 항목을 선택하세요</p>
                        </div>
                    ) : (
                        <div className="flex-1 overflow-y-auto p-6 space-y-5">
                            {/* Order Header */}
                            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                                <div className="px-6 py-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-100 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-blue-100 text-blue-600 rounded-xl">
                                            <FileText size={20} />
                                        </div>
                                        <div>
                                            <h2 className="text-lg font-bold text-gray-800">{selectedOrder.id}</h2>
                                            <span className="text-xs text-gray-500">주문일: {selectedOrder.orderDate}</span>
                                        </div>
                                    </div>
                                    {(() => {
                                        const stCfg = STATUS_CONFIG[selectedOrder.status];
                                        const StIcon = stCfg.icon;
                                        return (
                                            <span className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold border ${stCfg.bg} ${stCfg.color}`}>
                                                <StIcon size={16} />
                                                {selectedOrder.status}
                                            </span>
                                        );
                                    })()}
                                </div>

                                {/* Customer Info */}
                                <div className="px-6 py-5 grid grid-cols-2 gap-4">
                                    <div className="flex items-start gap-3">
                                        <div className="p-1.5 bg-gray-100 rounded-lg text-gray-500 mt-0.5">
                                            <User size={14} />
                                        </div>
                                        <div>
                                            <span className="text-[10px] font-bold text-gray-400 uppercase block">고객명</span>
                                            <span className="text-sm font-bold text-gray-800">{selectedOrder.customerName}</span>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <div className="p-1.5 bg-gray-100 rounded-lg text-gray-500 mt-0.5">
                                            <Phone size={14} />
                                        </div>
                                        <div>
                                            <span className="text-[10px] font-bold text-gray-400 uppercase block">전화번호</span>
                                            <span className="text-sm font-bold text-gray-800 font-mono">{selectedOrder.phone}</span>
                                        </div>
                                    </div>
                                    <div className="col-span-2 flex items-start gap-3">
                                        <div className="p-1.5 bg-gray-100 rounded-lg text-gray-500 mt-0.5">
                                            <MapPin size={14} />
                                        </div>
                                        <div>
                                            <span className="text-[10px] font-bold text-gray-400 uppercase block">주소</span>
                                            <span className="text-sm font-bold text-gray-800">{selectedOrder.address}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Order Details */}
                            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                                <div className="px-6 py-3 bg-gradient-to-r from-emerald-50 to-teal-50 border-b border-gray-100 flex items-center gap-2">
                                    <div className="p-1.5 bg-emerald-100 text-emerald-600 rounded-lg">
                                        <Package size={16} />
                                    </div>
                                    <h3 className="font-bold text-gray-800">상품 정보</h3>
                                </div>
                                <div className="px-6 py-5">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <span className="text-[10px] font-bold text-gray-400 uppercase block mb-1">상품명</span>
                                            <span className="text-sm font-bold text-gray-800">{selectedOrder.productName}</span>
                                        </div>
                                        <div>
                                            <span className="text-[10px] font-bold text-gray-400 uppercase block mb-1">규격</span>
                                            <span className="text-sm font-mono text-gray-700 bg-gray-100 px-2 py-0.5 rounded">{selectedOrder.spec}</span>
                                        </div>
                                        <div>
                                            <span className="text-[10px] font-bold text-gray-400 uppercase block mb-1">수량</span>
                                            <span className="text-sm font-bold text-gray-800">{selectedOrder.quantity}개</span>
                                        </div>
                                        <div>
                                            <span className="text-[10px] font-bold text-gray-400 uppercase block mb-1">단가</span>
                                            <span className="text-sm font-mono text-gray-700">{selectedOrder.unitPrice.toLocaleString()}</span>
                                        </div>
                                    </div>
                                    {/* Total */}
                                    <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
                                        <span className="text-sm font-bold text-gray-500">합계금액</span>
                                        <span className="text-xl font-extrabold text-blue-700 font-mono">
                                            {selectedOrder.totalPrice.toLocaleString()}
                                            <span className="text-sm font-bold text-blue-400 ml-0.5">원</span>
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Schedule & Delivery */}
                            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                                <div className="px-6 py-3 bg-gradient-to-r from-violet-50 to-purple-50 border-b border-gray-100 flex items-center gap-2">
                                    <div className="p-1.5 bg-violet-100 text-violet-600 rounded-lg">
                                        <Calendar size={16} />
                                    </div>
                                    <h3 className="font-bold text-gray-800">일정 & 배송</h3>
                                </div>
                                <div className="px-6 py-5 grid grid-cols-3 gap-4">
                                    <div>
                                        <span className="text-[10px] font-bold text-gray-400 uppercase block mb-1">주문일</span>
                                        <span className="text-sm font-bold text-gray-800">{selectedOrder.orderDate}</span>
                                    </div>
                                    <div>
                                        <span className="text-[10px] font-bold text-gray-400 uppercase block mb-1">시공일</span>
                                        <span className="text-sm font-bold text-gray-800">{selectedOrder.constructionDate || '-'}</span>
                                    </div>
                                    <div>
                                        <span className="text-[10px] font-bold text-gray-400 uppercase block mb-1">배송유형</span>
                                        <span className="text-sm font-bold text-gray-800">{selectedOrder.deliveryType}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Memo */}
                            {selectedOrder.memo && (
                                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                                    <div className="px-6 py-3 bg-gradient-to-r from-amber-50 to-orange-50 border-b border-gray-100 flex items-center gap-2">
                                        <div className="p-1.5 bg-amber-100 text-amber-600 rounded-lg">
                                            <FileText size={16} />
                                        </div>
                                        <h3 className="font-bold text-gray-800">비고</h3>
                                    </div>
                                    <div className="px-6 py-4">
                                        <p className="text-sm text-gray-700">{selectedOrder.memo}</p>
                                    </div>
                                </div>
                            )}

                            {/* Progress Timeline */}
                            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                                <div className="px-6 py-3 bg-gradient-to-r from-gray-50 to-slate-50 border-b border-gray-100 flex items-center gap-2">
                                    <div className="p-1.5 bg-gray-200 text-gray-600 rounded-lg">
                                        <Clock size={16} />
                                    </div>
                                    <h3 className="font-bold text-gray-800">진행 상태</h3>
                                </div>
                                <div className="px-6 py-5">
                                    <div className="flex items-center gap-0">
                                        {ALL_STATUSES.filter(s => s !== '취소').map((status, idx) => {
                                            const stCfg = STATUS_CONFIG[status];
                                            const StIcon = stCfg.icon;
                                            const orderIdx = ALL_STATUSES.filter(s => s !== '취소').indexOf(selectedOrder.status === '취소' ? '접수' : selectedOrder.status);
                                            const isActive = idx <= orderIdx && selectedOrder.status !== '취소';
                                            const isCurrent = status === selectedOrder.status;
                                            return (
                                                <React.Fragment key={status}>
                                                    <div className={`flex flex-col items-center gap-1.5 ${idx > 0 ? 'flex-1' : ''}`}>
                                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${isActive ? `${stCfg.bg} ${stCfg.color} border` : 'bg-gray-100 text-gray-300'} ${isCurrent ? 'ring-2 ring-offset-2 ring-blue-300 scale-110' : ''}`}>
                                                            <StIcon size={14} />
                                                        </div>
                                                        <span className={`text-[10px] font-bold ${isActive ? 'text-gray-700' : 'text-gray-300'}`}>{status}</span>
                                                    </div>
                                                    {idx < ALL_STATUSES.filter(s => s !== '취소').length - 1 && (
                                                        <div className={`flex-1 h-0.5 rounded-full mt-[-18px] ${idx < orderIdx && selectedOrder.status !== '취소' ? 'bg-blue-300' : 'bg-gray-200'}`} />
                                                    )}
                                                </React.Fragment>
                                            );
                                        })}
                                    </div>
                                    {selectedOrder.status === '취소' && (
                                        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-xl text-center">
                                            <span className="text-sm font-bold text-red-600">⚠ 이 주문은 취소되었습니다</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SearchInquiry;
