import React, { useState, useMemo, useEffect } from 'react';
import { Search, Package, ChevronRight, X, CheckSquare, Square, FileText, User, Phone, DollarSign, Hash, Clock, CheckCircle2, AlertCircle, Truck, Calendar, MapPin, Edit3, ChevronDown, ShoppingCart } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// --- Types ---
interface OrderItem {
    id: string;
    productName: string;
    spec: string;
    quantity: number;
    price: number;
}

interface CompletedOrder {
    id: string;
    orderNo: string;
    estimateNo: string;
    customerName: string;
    orderAmount: number;
    status: '주문완료' | '생산시작' | '패킹완료' | '배송시작' | '매장도착' | '직출완료' | '배송완료' | '시공완료';
    items: OrderItem[];
    orderDate: string;
    deliveryType: '시공' | '배송' | '직출';
}

interface EstimateOrder {
    id: string;
    estimateNo: string;
    customerName: string;
    phone: string;
    estimatePrice: number;
    items: OrderItem[];
    orderDate: string;
    deliveryType: '시공' | '배송' | '직출';
}

interface StoreOrder {
    id: string;
    orderNo: string;
    productName: string;
    orderAmount: number;
    status: '주문완료' | '생산시작' | '패킹완료' | '배송시작' | '매장도착' | '직출완료' | '배송완료' | '시공완료';
    items: OrderItem[];
    orderDate: string;
    deliveryType: '시공' | '배송' | '직출';
}

interface Destination {
    id: string;
    type: 'freight' | 'parcel';
    carrier: string;
    branch: string;
    phone: string;
    address: string;
    addressDetail: string;
}

// --- Mock Data ---
const MOCK_COMPLETED_ORDERS: CompletedOrder[] = [
    {
        id: 'ord-1', orderNo: 'ORD-2026-001', estimateNo: 'EST-001', customerName: '김영수', orderAmount: 2850000, status: '주문완료',
        orderDate: '2026-02-22', deliveryType: '시공',
        items: [
            { id: 'oi-1', productName: '콤비블라인드 엘레강스', spec: '1200×1500', quantity: 3, price: 650000 },
            { id: 'oi-2', productName: '우드블라인드 50mm', spec: '1800×2000', quantity: 2, price: 480000 },
            { id: 'oi-3', productName: '롤스크린 암막', spec: '900×1200', quantity: 4, price: 350000 },
        ]
    },
    {
        id: 'ord-2', orderNo: 'ORD-2026-002', estimateNo: 'EST-003', customerName: '이민호', orderAmount: 4120000, status: '생산시작',
        orderDate: '2026-02-20', deliveryType: '배송',
        items: [
            { id: 'oi-4', productName: '허니콤셰이드 프리미엄', spec: '1400×1800', quantity: 5, price: 520000 },
            { id: 'oi-5', productName: '버티컬블라인드', spec: '2000×2400', quantity: 3, price: 380000 },
        ]
    },
    {
        id: 'ord-3', orderNo: 'ORD-2026-003', estimateNo: 'EST-005', customerName: '박지현', orderAmount: 1980000, status: '패킹완료',
        orderDate: '2026-02-18', deliveryType: '직출',
        items: [
            { id: 'oi-6', productName: '디자인롤스크린', spec: '1100×1400', quantity: 2, price: 290000 },
            { id: 'oi-7', productName: '콤비블라인드 일반', spec: '1500×1800', quantity: 4, price: 350000 },
        ]
    },
    {
        id: 'ord-4', orderNo: 'ORD-2026-004', estimateNo: 'EST-007', customerName: '최수진', orderAmount: 3450000, status: '배송시작',
        orderDate: '2026-02-15', deliveryType: '시공',
        items: [
            { id: 'oi-8', productName: '실사블라인드', spec: '1000×1200', quantity: 1, price: 450000 },
            { id: 'oi-9', productName: '우드블라인드 35mm', spec: '1600×1900', quantity: 3, price: 520000 },
            { id: 'oi-10', productName: '롤스크린 채광', spec: '1300×1600', quantity: 5, price: 280000 },
        ]
    },
    {
        id: 'ord-5', orderNo: 'ORD-2026-005', estimateNo: 'EST-009', customerName: '정민호', orderAmount: 2210000, status: '매장도착',
        orderDate: '2026-02-17', deliveryType: '배송',
        items: [
            { id: 'oi-11', productName: '콤비블라인드 프리미엄', spec: '1400×1700', quantity: 2, price: 580000 },
            { id: 'oi-12', productName: '허니콤셰이드 일반', spec: '1200×1500', quantity: 3, price: 350000 },
        ]
    },
    {
        id: 'ord-6', orderNo: 'ORD-2026-006', estimateNo: 'EST-011', customerName: '한소희', orderAmount: 1750000, status: '시공완료',
        orderDate: '2026-02-19', deliveryType: '직출',
        items: [
            { id: 'oi-13', productName: '버티컬블라인드 프리미엄', spec: '2200×2600', quantity: 2, price: 450000 },
            { id: 'oi-14', productName: '롤스크린 디자인', spec: '1000×1300', quantity: 3, price: 285000 },
        ]
    },
];

const MOCK_ESTIMATE_ORDERS: EstimateOrder[] = [
    {
        id: 'eord-1', estimateNo: 'EST-002', customerName: '이미정', phone: '010-2345-6789', estimatePrice: 3200000,
        orderDate: '2026-02-23', deliveryType: '시공',
        items: [
            { id: 'ei-1', productName: '콤비블라인드 일반', spec: '1500×1800', quantity: 4, price: 185000 },
            { id: 'ei-2', productName: '우드블라인드 63mm', spec: '2000×2200', quantity: 2, price: 680000 },
            { id: 'ei-3', productName: '롤스크린 암막', spec: '1200×1500', quantity: 3, price: 320000 },
        ]
    },
    {
        id: 'eord-2', estimateNo: 'EST-004', customerName: '최수아', phone: '010-3333-4444', estimatePrice: 2850000,
        orderDate: '2026-02-22', deliveryType: '배송',
        items: [
            { id: 'ei-4', productName: '허니콤셰이드', spec: '1100×1400', quantity: 5, price: 235000 },
            { id: 'ei-5', productName: '콤비블라인드 프리미엄', spec: '1300×1600', quantity: 3, price: 420000 },
        ]
    },
    {
        id: 'eord-3', estimateNo: 'EST-006', customerName: '강다은', phone: '010-9012-3456', estimatePrice: 1980000,
        orderDate: '2026-02-21', deliveryType: '직출',
        items: [
            { id: 'ei-6', productName: '디자인롤스크린', spec: '900×1100', quantity: 4, price: 195000 },
            { id: 'ei-7', productName: '우드블라인드 50mm', spec: '1700×2000', quantity: 1, price: 580000 },
            { id: 'ei-8', productName: '실사블라인드 미니', spec: '800×1000', quantity: 2, price: 310000 },
        ]
    },
    {
        id: 'eord-4', estimateNo: 'EST-008', customerName: '윤재혁', phone: '010-0123-4567', estimatePrice: 4150000,
        orderDate: '2026-02-24', deliveryType: '시공',
        items: [
            { id: 'ei-9', productName: '버티컬블라인드', spec: '2400×2800', quantity: 3, price: 520000 },
            { id: 'ei-10', productName: '콤비블라인드 엘레강스', spec: '1400×1700', quantity: 4, price: 390000 },
            { id: 'ei-11', productName: '롤스크린 채광', spec: '1100×1400', quantity: 5, price: 245000 },
        ]
    },
    {
        id: 'eord-5', estimateNo: 'EST-010', customerName: '오세현', phone: '010-8901-2345', estimatePrice: 2680000,
        orderDate: '2026-02-23', deliveryType: '배송',
        items: [
            { id: 'ei-12', productName: '허니콤셰이드 프리미엄', spec: '1300×1500', quantity: 2, price: 480000 },
            { id: 'ei-13', productName: '우드블라인드 35mm', spec: '1500×1800', quantity: 3, price: 410000 },
        ]
    },
    {
        id: 'eord-6', estimateNo: 'EST-012', customerName: '임지우', phone: '010-7890-1234', estimatePrice: 1560000,
        orderDate: '2026-02-22', deliveryType: '직출',
        items: [
            { id: 'ei-14', productName: '롤스크린 일반', spec: '1200×1500', quantity: 6, price: 260000 },
        ]
    },
];

const MOCK_STORE_ORDERS: StoreOrder[] = [
    {
        id: 'sord-1', orderNo: 'STO-2026-001', productName: '콤비블라인드 엘레강스', orderAmount: 1850000, status: '주문완료',
        orderDate: '2026-02-24', deliveryType: '배송',
        items: [
            { id: 'si-1', productName: '콤비블라인드 엘레강스', spec: '1200×1500', quantity: 3, price: 450000 },
            { id: 'si-2', productName: '롤스크린 암막', spec: '900×1200', quantity: 2, price: 250000 },
        ]
    },
    {
        id: 'sord-2', orderNo: 'STO-2026-002', productName: '우드블라인드 프리미엄 50mm', orderAmount: 2340000, status: '생산시작',
        orderDate: '2026-02-23', deliveryType: '시공',
        items: [
            { id: 'si-3', productName: '우드블라인드 프리미엄 50mm', spec: '1800×2000', quantity: 4, price: 585000 },
        ]
    },
    {
        id: 'sord-3', orderNo: 'STO-2026-003', productName: '허니콤셰이드 일반', orderAmount: 1560000, status: '패킹완료',
        orderDate: '2026-02-22', deliveryType: '직출',
        items: [
            { id: 'si-4', productName: '허니콤셰이드 일반', spec: '1100×1400', quantity: 3, price: 320000 },
            { id: 'si-5', productName: '버티컬블라인드', spec: '2000×2400', quantity: 2, price: 300000 },
        ]
    },
    {
        id: 'sord-4', orderNo: 'STO-2026-004', productName: '디자인롤스크린 프리미엄', orderAmount: 980000, status: '배송시작',
        orderDate: '2026-02-21', deliveryType: '배송',
        items: [
            { id: 'si-6', productName: '디자인롤스크린 프리미엄', spec: '1300×1600', quantity: 2, price: 490000 },
        ]
    },
    {
        id: 'sord-5', orderNo: 'STO-2026-005', productName: '실사블라인드 미니 타입', orderAmount: 3200000, status: '매장도착',
        orderDate: '2026-02-20', deliveryType: '시공',
        items: [
            { id: 'si-7', productName: '실사블라인드 미니 타입', spec: '1000×1200', quantity: 5, price: 640000 },
        ]
    },
];

const STATUS_CONFIG: Record<string, { color: string; bg: string; border: string; icon: typeof Clock }> = {
    '주문완료': { color: 'text-sky-700', bg: 'bg-sky-50', border: 'border-sky-200', icon: CheckCircle2 },
    '생산시작': { color: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-200', icon: Clock },
    '패킹완료': { color: 'text-orange-700', bg: 'bg-orange-50', border: 'border-orange-200', icon: Package },
    '배송시작': { color: 'text-violet-700', bg: 'bg-violet-50', border: 'border-violet-200', icon: Truck },
    '매장도착': { color: 'text-blue-700', bg: 'bg-blue-50', border: 'border-blue-200', icon: MapPin },
    '직출완료': { color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200', icon: CheckCircle2 },
    '배송완료': { color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200', icon: CheckCircle2 },
    '시공완료': { color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200', icon: CheckCircle2 },
};

const ManufacturingOrder: React.FC = () => {
    const [viewMode, setViewMode] = useState<'completed' | 'estimate' | 'store'>('estimate');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [selectedItemIds, setSelectedItemIds] = useState<Set<string>>(new Set());

    // --- Arrival Info State ---
    const [destinations, setDestinations] = useState<Destination[]>([]);
    const [selectedDestId, setSelectedDestId] = useState<string>('');
    const [shipRequestDate, setShipRequestDate] = useState('');
    const [deliveryTypeDate, setDeliveryTypeDate] = useState('');
    const [arrivalRemark, setArrivalRemark] = useState('');
    const [destDropdownOpen, setDestDropdownOpen] = useState(false);

    // Load destinations from HeadquartersInfo (localStorage or fallback)
    useEffect(() => {
        // Try to read from HeadquartersInfo's localStorage
        // Fallback to default destinations
        const defaultDests: Destination[] = [
            { id: 'dest-1', type: 'freight', carrier: '대한통운', branch: '강남지점', phone: '02-555-1234', address: '서울시 강남구 테헤란로 123', addressDetail: '' },
            { id: 'dest-2', type: 'parcel', carrier: '', branch: '', phone: '', address: '서울시 서초구 반포대로 45', addressDetail: '201호' },
        ];
        setDestinations(defaultDests);
    }, []);

    // Helper: format date
    const formatDate = (dateStr: string) => {
        if (!dateStr) return '';
        const d = new Date(dateStr);
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    };

    // Helper: add days to date string
    const addDays = (dateStr: string, days: number) => {
        const d = new Date(dateStr);
        d.setDate(d.getDate() + days);
        return formatDate(d.toISOString());
    };

    // Get current order's delivery type and order date
    const currentOrderInfo = useMemo(() => {
        if (viewMode === 'completed') {
            const order = MOCK_COMPLETED_ORDERS.find(o => o.id === selectedId);
            return order ? { deliveryType: order.deliveryType, orderDate: order.orderDate } : null;
        } else if (viewMode === 'store') {
            const order = MOCK_STORE_ORDERS.find(o => o.id === selectedId);
            return order ? { deliveryType: order.deliveryType, orderDate: order.orderDate } : null;
        } else {
            const order = MOCK_ESTIMATE_ORDERS.find(o => o.id === selectedId);
            return order ? { deliveryType: order.deliveryType, orderDate: order.orderDate } : null;
        }
    }, [selectedId, viewMode]);

    // Filtered data
    const filteredCompleted = useMemo(() => {
        if (!searchQuery.trim()) return MOCK_COMPLETED_ORDERS;
        const q = searchQuery.toLowerCase();
        return MOCK_COMPLETED_ORDERS.filter(o =>
            o.customerName.includes(q) || o.orderNo.toLowerCase().includes(q) || o.estimateNo.toLowerCase().includes(q)
        );
    }, [searchQuery]);

    const filteredEstimate = useMemo(() => {
        if (!searchQuery.trim()) return MOCK_ESTIMATE_ORDERS;
        const q = searchQuery.toLowerCase();
        return MOCK_ESTIMATE_ORDERS.filter(o =>
            o.customerName.includes(q) || o.estimateNo.toLowerCase().includes(q) || o.phone.includes(q)
        );
    }, [searchQuery]);

    const totalCount = viewMode === 'completed' ? filteredCompleted.length : filteredEstimate.length;

    // Selected order items
    const currentItems: OrderItem[] = useMemo(() => {
        if (viewMode === 'completed') {
            const order = MOCK_COMPLETED_ORDERS.find(o => o.id === selectedId);
            return order?.items || [];
        } else if (viewMode === 'store') {
            const order = MOCK_STORE_ORDERS.find(o => o.id === selectedId);
            return order?.items || [];
        } else {
            const order = MOCK_ESTIMATE_ORDERS.find(o => o.id === selectedId);
            return order?.items || [];
        }
    }, [selectedId, viewMode]);

    // Auto-select first item on mode change
    const handleModeChange = (mode: 'completed' | 'estimate' | 'store') => {
        if (mode === 'store') {
            // 매장주문: 좌측 리스트 유지, 오른쪽만 초기화
            setViewMode(mode);
            setSelectedId(null);
            setSelectedItemIds(new Set());
            setShipRequestDate(addDays(formatDate(new Date().toISOString()), 2));
            setDeliveryTypeDate('');
            setArrivalRemark('');
            setSelectedDestId(destinations.length > 0 ? destinations[0].id : '');
        } else {
            setViewMode(mode);
            setSelectedId(null);
            setSelectedItemIds(new Set());
            setSearchQuery('');
        }
    };

    const handleSelect = (id: string, items: OrderItem[]) => {
        setSelectedId(id);
        // Select all items by default
        setSelectedItemIds(new Set(items.map(i => i.id)));

        // Set arrival info defaults
        const order = viewMode === 'completed'
            ? MOCK_COMPLETED_ORDERS.find(o => o.id === id)
            : viewMode === 'store'
                ? MOCK_STORE_ORDERS.find(o => o.id === id)
                : MOCK_ESTIMATE_ORDERS.find(o => o.id === id);
        if (order) {
            setShipRequestDate(addDays(order.orderDate, 2));
            // Delivery type date: based on delivery type
            // 시공: +5일, 배송: +3일, 직출: +1일 from ship request
            const shipReq = addDays(order.orderDate, 2);
            if (order.deliveryType === '시공') {
                setDeliveryTypeDate(addDays(shipReq, 5));
            } else if (order.deliveryType === '배송') {
                setDeliveryTypeDate(addDays(shipReq, 3));
            } else {
                setDeliveryTypeDate(addDays(shipReq, 1));
            }
        }
        setArrivalRemark('');
        if (destinations.length > 0 && !selectedDestId) {
            setSelectedDestId(destinations[0].id);
        }
    };

    const toggleItemSelection = (itemId: string) => {
        setSelectedItemIds(prev => {
            const next = new Set(prev);
            if (next.has(itemId)) next.delete(itemId);
            else next.add(itemId);
            return next;
        });
    };

    const selectAll = () => setSelectedItemIds(new Set(currentItems.map(i => i.id)));
    const deselectAll = () => setSelectedItemIds(new Set());

    const selectedTotal = useMemo(() => {
        return currentItems.filter(i => selectedItemIds.has(i.id)).reduce((s, i) => s + i.price * i.quantity, 0);
    }, [currentItems, selectedItemIds]);

    const allSelected = currentItems.length > 0 && currentItems.every(i => selectedItemIds.has(i.id));

    // 선택된 주문의 상태가 '주문완료'일 때만 수정 가능
    const isEditable = useMemo(() => {
        if (viewMode === 'estimate') return true; // 견적주문은 항상 수정 가능
        if (!selectedId) return false;
        if (viewMode === 'completed') {
            const order = MOCK_COMPLETED_ORDERS.find(o => o.id === selectedId);
            return order?.status === '주문완료';
        } else if (viewMode === 'store') {
            const order = MOCK_STORE_ORDERS.find(o => o.id === selectedId);
            return order?.status === '주문완료';
        }
        return false;
    }, [selectedId, viewMode]);

    // 선택된 주문의 상태 텍스트
    const selectedOrderStatus = useMemo(() => {
        if (!selectedId) return '';
        if (viewMode === 'completed') {
            const order = MOCK_COMPLETED_ORDERS.find(o => o.id === selectedId);
            return order?.status || '';
        } else if (viewMode === 'store') {
            const order = MOCK_STORE_ORDERS.find(o => o.id === selectedId);
            return order?.status || '';
        }
        return '';
    }, [selectedId, viewMode]);

    return (
        <div className="flex flex-col h-full w-full bg-gray-50 overflow-hidden font-sans">
            {/* HEADER */}
            <div className="flex-shrink-0 bg-white border-b border-gray-200 px-6 py-4 shadow-sm z-20">
                <div className="flex items-center gap-4">
                    <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2 min-w-fit">
                        <Package className="text-blue-600" size={22} /> 제작주문
                    </h1>
                    <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-100">
                        진행건 총 : {totalCount}건
                    </span>

                    {/* Search */}
                    <div className="flex-1 max-w-lg relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            placeholder="주문번호, 고객명, 전화번호로 검색..."
                            className="w-full pl-11 pr-10 py-2.5 rounded-xl bg-gray-100 border border-gray-200 text-sm font-medium
                                       focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-300 focus:bg-white transition-all"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                        {searchQuery && (
                            <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded-full transition-all">
                                <X size={14} />
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* BODY */}
            <div className="flex-1 flex min-h-0 overflow-hidden">

                {/* LEFT: Order List */}
                <div className="w-[440px] bg-white border-r border-gray-200 flex flex-col flex-shrink-0 overflow-hidden">

                    {/* View Mode Switch */}
                    <div className="px-4 py-3 border-b border-gray-200 flex-shrink-0">
                        <div className="flex bg-gray-100 rounded-xl p-1 gap-1">
                            <button
                                onClick={() => handleModeChange('completed')}
                                className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all
                                    ${viewMode === 'completed'
                                        ? 'bg-white text-blue-700 shadow-sm'
                                        : 'text-gray-500 hover:text-gray-700'
                                    }`}
                            >
                                주문완료
                            </button>
                            <button
                                onClick={() => handleModeChange('estimate')}
                                className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all
                                    ${viewMode === 'estimate'
                                        ? 'bg-white text-blue-700 shadow-sm'
                                        : 'text-gray-500 hover:text-gray-700'
                                    }`}
                            >
                                견적주문
                            </button>
                            <button
                                onClick={() => handleModeChange('store')}
                                className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all
                                    ${viewMode === 'store'
                                        ? 'bg-white text-blue-700 shadow-sm'
                                        : 'text-gray-500 hover:text-gray-700'
                                    }`}
                            >
                                매장주문
                            </button>
                        </div>
                    </div>

                    {/* List Header */}
                    {viewMode === 'completed' ? (
                        <div className="flex items-center bg-gray-50 border-b border-gray-200 text-[10px] font-bold text-gray-400 uppercase tracking-wider px-4 py-2.5 flex-shrink-0">
                            <div className="w-[130px]">주문번호(견적번호)</div>
                            <div className="w-[60px]">고객명</div>
                            <div className="w-[90px] text-right">주문금액</div>
                            <div className="flex-1 text-right">상태</div>
                        </div>
                    ) : viewMode === 'store' ? (
                        <div className="flex items-center bg-gray-50 border-b border-gray-200 text-[10px] font-bold text-gray-400 uppercase tracking-wider px-4 py-2.5 flex-shrink-0">
                            <div className="w-[120px]">주문번호</div>
                            <div className="w-[80px]">상품명</div>
                            <div className="w-[90px] text-right">주문금액</div>
                            <div className="flex-1 text-right">상태</div>
                        </div>
                    ) : (
                        <div className="flex items-center bg-gray-50 border-b border-gray-200 text-[10px] font-bold text-gray-400 uppercase tracking-wider px-4 py-2.5 flex-shrink-0">
                            <div className="w-[80px]">견적번호</div>
                            <div className="w-[60px]">고객명</div>
                            <div className="w-[110px]">전화번호</div>
                            <div className="flex-1 text-right">견적가</div>
                        </div>
                    )}

                    {/* List Body */}
                    <div className="flex-1 overflow-y-auto">
                        <AnimatePresence mode="wait">
                            {viewMode === 'completed' ? (
                                <motion.div key="completed" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                                    {filteredCompleted.length === 0 ? (
                                        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                                            <Package size={40} strokeWidth={1.5} />
                                            <p className="text-sm font-medium mt-3">주문이 없습니다</p>
                                        </div>
                                    ) : (
                                        filteredCompleted.map(order => {
                                            const sc = STATUS_CONFIG[order.status] || STATUS_CONFIG['생산중'];
                                            const StatusIcon = sc.icon;
                                            return (
                                                <motion.div
                                                    key={order.id}
                                                    onClick={() => handleSelect(order.id, order.items)}
                                                    className={`flex items-center px-4 py-3.5 border-b border-gray-100 cursor-pointer transition-all
                                                        ${selectedId === order.id
                                                            ? 'bg-blue-50 border-l-[3px] border-l-blue-500'
                                                            : 'hover:bg-gray-50 border-l-[3px] border-l-transparent'
                                                        }`}
                                                    whileHover={{ x: 2 }}
                                                    transition={{ duration: 0.15 }}
                                                >
                                                    <div className="w-[130px]">
                                                        <div className={`text-xs font-bold ${selectedId === order.id ? 'text-blue-700' : 'text-gray-800'}`}>
                                                            {order.orderNo}
                                                        </div>
                                                        <div className="text-[10px] text-gray-400 font-mono">({order.estimateNo})</div>
                                                    </div>
                                                    <div className="w-[60px]">
                                                        <span className="text-sm font-bold text-gray-800">{order.customerName}</span>
                                                    </div>
                                                    <div className="w-[90px] text-right">
                                                        <span className="text-xs font-bold font-mono text-gray-700">{order.orderAmount.toLocaleString()}</span>
                                                    </div>
                                                    <div className="flex-1 flex justify-end">
                                                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${sc.color} ${sc.bg} border ${sc.border}`}>
                                                            <StatusIcon size={10} /> {order.status}
                                                        </span>
                                                    </div>
                                                    <ChevronRight size={14} className="text-gray-300 ml-2 flex-shrink-0" />
                                                </motion.div>
                                            );
                                        })
                                    )}
                                </motion.div>
                            ) : viewMode === 'store' ? (
                                <motion.div key="store" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                                    {MOCK_STORE_ORDERS.length === 0 ? (
                                        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                                            <ShoppingCart size={40} strokeWidth={1.5} />
                                            <p className="text-sm font-medium mt-3">매장주문이 없습니다</p>
                                        </div>
                                    ) : (
                                        MOCK_STORE_ORDERS.map(order => {
                                            const sc = STATUS_CONFIG[order.status] || STATUS_CONFIG['주문접수'];
                                            const StatusIcon = sc.icon;
                                            const truncatedName = order.productName.length > 6
                                                ? order.productName.slice(0, 6) + '...'
                                                : order.productName;
                                            return (
                                                <motion.div
                                                    key={order.id}
                                                    onClick={() => handleSelect(order.id, order.items)}
                                                    className={`flex items-center px-4 py-3.5 border-b border-gray-100 cursor-pointer transition-all
                                                        ${selectedId === order.id
                                                            ? 'bg-blue-50 border-l-[3px] border-l-blue-500'
                                                            : 'hover:bg-gray-50 border-l-[3px] border-l-transparent'
                                                        }`}
                                                    whileHover={{ x: 2 }}
                                                    transition={{ duration: 0.15 }}
                                                >
                                                    <div className="w-[120px]">
                                                        <span className={`text-xs font-bold ${selectedId === order.id ? 'text-blue-700' : 'text-gray-800'}`}>
                                                            {order.orderNo}
                                                        </span>
                                                    </div>
                                                    <div className="w-[80px]">
                                                        <span className="text-xs font-medium text-gray-600" title={order.productName}>
                                                            {truncatedName}
                                                        </span>
                                                    </div>
                                                    <div className="w-[90px] text-right">
                                                        <span className="text-xs font-bold font-mono text-gray-700">{order.orderAmount.toLocaleString()}</span>
                                                    </div>
                                                    <div className="flex-1 flex justify-end">
                                                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${sc.color} ${sc.bg} border ${sc.border}`}>
                                                            <StatusIcon size={10} /> {order.status}
                                                        </span>
                                                    </div>
                                                    <ChevronRight size={14} className="text-gray-300 ml-2 flex-shrink-0" />
                                                </motion.div>
                                            );
                                        })
                                    )}
                                </motion.div>
                            ) : (
                                <motion.div key="estimate" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                                    {filteredEstimate.length === 0 ? (
                                        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                                            <FileText size={40} strokeWidth={1.5} />
                                            <p className="text-sm font-medium mt-3">견적이 없습니다</p>
                                        </div>
                                    ) : (
                                        filteredEstimate.map(order => (
                                            <motion.div
                                                key={order.id}
                                                onClick={() => handleSelect(order.id, order.items)}
                                                className={`flex items-center px-4 py-3.5 border-b border-gray-100 cursor-pointer transition-all
                                                    ${selectedId === order.id
                                                        ? 'bg-blue-50 border-l-[3px] border-l-blue-500'
                                                        : 'hover:bg-gray-50 border-l-[3px] border-l-transparent'
                                                    }`}
                                                whileHover={{ x: 2 }}
                                                transition={{ duration: 0.15 }}
                                            >
                                                <div className="w-[80px]">
                                                    <span className={`text-xs font-bold ${selectedId === order.id ? 'text-blue-700' : 'text-gray-800'}`}>
                                                        {order.estimateNo}
                                                    </span>
                                                </div>
                                                <div className="w-[60px]">
                                                    <span className="text-sm font-bold text-gray-800">{order.customerName}</span>
                                                </div>
                                                <div className="w-[110px]">
                                                    <span className="text-xs text-gray-500 font-mono">{order.phone}</span>
                                                </div>
                                                <div className="flex-1 text-right">
                                                    <span className={`text-sm font-bold font-mono ${selectedId === order.id ? 'text-blue-600' : 'text-gray-700'}`}>
                                                        {order.estimatePrice.toLocaleString()}
                                                    </span>
                                                </div>
                                                <ChevronRight size={14} className="text-gray-300 ml-2 flex-shrink-0" />
                                            </motion.div>
                                        ))
                                    )}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>

                {/* RIGHT: Item Detail Card */}
                <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
                    {viewMode === 'store' && !selectedId ? (
                        /* === 매장주문 모드: 초기화된 상태 (아이템 미선택) === */
                        <div className="flex-1 overflow-y-auto p-6 space-y-4">
                            {/* Order Card */}
                            <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-800 rounded-2xl shadow-lg overflow-hidden text-white">
                                <div className="flex items-center gap-3 px-4 py-3">
                                    <div className="flex items-center gap-3 flex-1 min-w-0">
                                        <div className="bg-white/15 rounded-lg px-3 py-1.5 text-center flex-shrink-0">
                                            <div className="text-[9px] font-medium text-blue-200 leading-tight">주문총금액</div>
                                            <div className="text-sm font-black font-mono leading-tight">0<span className="text-[10px] text-blue-200 ml-0.5">원</span></div>
                                        </div>
                                        <div className="bg-white/15 rounded-lg px-3 py-1.5 text-center flex-shrink-0">
                                            <div className="text-[9px] font-medium text-blue-200 leading-tight">상품수량</div>
                                            <div className="text-sm font-black leading-tight">0<span className="text-[10px] text-blue-200 ml-0.5">개</span></div>
                                        </div>
                                        <div className="bg-white/15 rounded-lg px-3 py-1.5 text-center flex-shrink-0">
                                            <div className="text-[9px] font-medium text-blue-200 leading-tight">주문일</div>
                                            <div className="text-xs font-bold font-mono leading-tight">{formatDate(new Date().toISOString())}</div>
                                        </div>
                                        <div className="bg-white/15 rounded-lg px-3 py-1.5 text-center flex-shrink-0">
                                            <div className="text-[9px] font-medium text-blue-200 leading-tight">출고요청일</div>
                                            <div className="text-xs font-bold font-mono leading-tight">{shipRequestDate || '-'}</div>
                                        </div>
                                        <div className="flex items-center gap-1 bg-white/15 rounded-lg px-3 py-2.5 flex-shrink-0">
                                            <MapPin size={11} className="text-blue-200" />
                                            <span className="text-[9px] text-blue-200">도착:</span>
                                            <span className="text-xs font-bold">
                                                {(() => {
                                                    const dest = destinations.find(d => d.id === selectedDestId);
                                                    if (!dest) return '미선택';
                                                    if (dest.type === 'freight') return '화물';
                                                    return '택배';
                                                })()}
                                            </span>
                                        </div>
                                    </div>
                                    <button
                                        className="flex items-center gap-1.5 bg-white text-blue-700 font-bold text-xs px-4 py-2.5 rounded-xl hover:bg-blue-50 transition-all shadow-sm active:scale-[0.97] flex-shrink-0 whitespace-nowrap"
                                        onClick={() => alert('매장주문이 접수되었습니다.')}
                                    >
                                        <ShoppingCart size={14} />
                                        매장주문하기
                                    </button>
                                </div>
                            </div>

                            {/* Arrival Info Card */}
                            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                                <div className="px-5 py-3.5 bg-gradient-to-r from-emerald-50 to-teal-50 border-b border-gray-100 flex items-center gap-3">
                                    <div className="w-9 h-9 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center">
                                        <MapPin size={18} />
                                    </div>
                                    <h3 className="font-bold text-gray-800 text-sm">도착정보</h3>
                                </div>
                                <div className="px-5 py-4 space-y-3">
                                    <div>
                                        <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1.5">도착정보</label>
                                        <div className="relative">
                                            <button
                                                onClick={() => setDestDropdownOpen(!destDropdownOpen)}
                                                className="w-full flex items-center justify-between bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-medium text-gray-700 hover:border-blue-300 transition-colors"
                                            >
                                                <span className="truncate">
                                                    {(() => {
                                                        const dest = destinations.find(d => d.id === selectedDestId);
                                                        if (!dest) return '도착지를 선택하세요';
                                                        if (dest.type === 'freight') return `[화물] ${dest.carrier} ${dest.branch} - ${dest.address}`;
                                                        return `[택배] ${dest.address} ${dest.addressDetail}`;
                                                    })()}
                                                </span>
                                                <ChevronDown size={16} className={`text-gray-400 transition-transform ${destDropdownOpen ? 'rotate-180' : ''}`} />
                                            </button>
                                            <AnimatePresence>
                                                {destDropdownOpen && (
                                                    <motion.div
                                                        initial={{ opacity: 0, y: -4 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        exit={{ opacity: 0, y: -4 }}
                                                        className="absolute z-30 top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden max-h-[200px] overflow-y-auto"
                                                    >
                                                        {destinations.map(dest => (
                                                            <button
                                                                key={dest.id}
                                                                onClick={() => { setSelectedDestId(dest.id); setDestDropdownOpen(false); }}
                                                                className={`w-full text-left px-4 py-2.5 text-sm hover:bg-blue-50 transition-colors flex items-center gap-2
                                                                    ${selectedDestId === dest.id ? 'bg-blue-50 font-bold text-blue-700' : 'text-gray-700'}`}
                                                            >
                                                                <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold
                                                                    ${dest.type === 'freight' ? 'bg-blue-100 text-blue-600' : 'bg-amber-100 text-amber-600'}`}>
                                                                    {dest.type === 'freight' ? <><Truck size={9} /> 화물</> : <><Package size={9} /> 택배</>}
                                                                </span>
                                                                <span className="truncate">
                                                                    {dest.type === 'freight'
                                                                        ? `${dest.carrier} ${dest.branch} - ${dest.address}`
                                                                        : `${dest.address} ${dest.addressDetail}`}
                                                                </span>
                                                            </button>
                                                        ))}
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1.5 flex items-center gap-1">
                                                <Calendar size={9} /> 출고요청일
                                            </label>
                                            <input
                                                type="date"
                                                value={shipRequestDate}
                                                onChange={e => setShipRequestDate(e.target.value)}
                                                className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm font-medium focus:border-blue-500 outline-none"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1.5 flex items-center gap-1">
                                                <Calendar size={9} /> 배송/시공/직출일
                                            </label>
                                            <input
                                                type="date"
                                                value={deliveryTypeDate}
                                                onChange={e => setDeliveryTypeDate(e.target.value)}
                                                className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm font-medium outline-none text-gray-600"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1.5 flex items-center gap-1">
                                            <Edit3 size={9} /> 비고
                                        </label>
                                        <input
                                            type="text"
                                            value={arrivalRemark}
                                            onChange={e => setArrivalRemark(e.target.value)}
                                            placeholder="비고 사항을 입력하세요"
                                            className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm font-medium focus:border-blue-500 outline-none placeholder-gray-300"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Empty Order List */}
                            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                                <div className="px-6 py-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-100 flex items-center gap-3">
                                    <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center">
                                        <Package size={20} />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-gray-800">주문 리스트</h3>
                                        <span className="text-xs text-gray-400">0개 상품</span>
                                    </div>
                                </div>
                                <div className="flex items-center bg-gray-50 border-b border-gray-200 text-[10px] font-bold text-gray-400 uppercase tracking-wider px-6 py-2.5">
                                    <div className="flex-1">상품명</div>
                                    <div className="w-[100px] text-center">규격</div>
                                    <div className="w-[60px] text-center">수량</div>
                                    <div className="w-[100px] text-right">금액</div>
                                </div>
                                <div className="flex flex-col items-center justify-center py-12 text-gray-300">
                                    <Package size={36} strokeWidth={1.5} />
                                    <p className="text-sm font-medium mt-2">상품을 추가하세요</p>
                                </div>
                            </div>
                        </div>
                    ) : !selectedId ? (
                        <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-3">
                            <Package size={48} strokeWidth={1.5} />
                            <p className="text-sm font-medium">좌측 목록에서 주문을 선택하세요</p>
                        </div>
                    ) : (
                        <div className="flex-1 overflow-y-auto p-6 space-y-4">

                            {/* ===== Order Summary Card (all modes when selectedId exists) ===== */}
                            <div className={`rounded-2xl shadow-lg overflow-hidden text-white ${!isEditable && viewMode !== 'estimate' ? 'bg-gradient-to-r from-gray-500 via-gray-600 to-gray-700' : viewMode === 'estimate' ? 'bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-800' : 'bg-gradient-to-r from-amber-500 via-orange-600 to-red-600'}`}>
                                <div className="flex items-center gap-3 px-4 py-3">
                                    <div className="flex items-center gap-3 flex-1 min-w-0">
                                        <div className="bg-white/15 rounded-lg px-3 py-1.5 text-center flex-shrink-0">
                                            <div className="text-[9px] font-medium text-white/70 leading-tight">주문총금액</div>
                                            <div className="text-sm font-black font-mono leading-tight">{selectedTotal.toLocaleString()}<span className="text-[10px] text-white/70 ml-0.5">원</span></div>
                                        </div>
                                        <div className="bg-white/15 rounded-lg px-3 py-1.5 text-center flex-shrink-0">
                                            <div className="text-[9px] font-medium text-white/70 leading-tight">상품수량</div>
                                            <div className="text-sm font-black leading-tight">{currentItems.filter(i => selectedItemIds.has(i.id)).length}<span className="text-[10px] text-white/70 ml-0.5">개</span></div>
                                        </div>
                                        <div className="bg-white/15 rounded-lg px-3 py-1.5 text-center flex-shrink-0">
                                            <div className="text-[9px] font-medium text-white/70 leading-tight">주문일</div>
                                            <div className="text-xs font-bold font-mono leading-tight">{formatDate(new Date().toISOString())}</div>
                                        </div>
                                        <div className="bg-white/15 rounded-lg px-3 py-1.5 text-center flex-shrink-0">
                                            <div className="text-[9px] font-medium text-white/70 leading-tight">출고요청일</div>
                                            <div className="text-xs font-bold font-mono leading-tight">{shipRequestDate || '-'}</div>
                                        </div>
                                        <div className="flex items-center gap-1 bg-white/15 rounded-lg px-3 py-2.5 flex-shrink-0">
                                            <MapPin size={11} className="text-white/70" />
                                            <span className="text-[9px] text-white/70">도착:</span>
                                            <span className="text-xs font-bold">
                                                {(() => {
                                                    const dest = destinations.find(d => d.id === selectedDestId);
                                                    if (!dest) return '미선택';
                                                    if (dest.type === 'freight') return '화물';
                                                    return '택배';
                                                })()}
                                            </span>
                                        </div>
                                    </div>
                                    {isEditable ? (
                                        <button
                                            className={`flex items-center gap-1.5 font-bold text-xs px-4 py-2.5 rounded-xl transition-all shadow-sm active:scale-[0.97] flex-shrink-0 whitespace-nowrap ${viewMode === 'estimate' ? 'bg-white text-blue-700 hover:bg-blue-50' : 'bg-white text-orange-700 hover:bg-orange-50'}`}
                                            onClick={() => {
                                                if (viewMode === 'estimate') {
                                                    alert('견적주문이 접수되었습니다.');
                                                } else {
                                                    alert('주문이 수정되었습니다.');
                                                }
                                            }}
                                        >
                                            <Edit3 size={14} />
                                            {viewMode === 'estimate' ? '견적주문하기' : '주문수정하기'}
                                        </button>
                                    ) : (
                                        <div className={`flex items-center gap-1.5 font-bold text-xs px-4 py-2.5 rounded-xl flex-shrink-0 whitespace-nowrap ${(() => { const sc = STATUS_CONFIG[selectedOrderStatus] || STATUS_CONFIG['주문완료']; return sc.bg + ' ' + sc.color + ' border ' + sc.border; })()}`}>
                                            {(() => { const sc = STATUS_CONFIG[selectedOrderStatus] || STATUS_CONFIG['주문완료']; const Icon = sc.icon; return <Icon size={14} />; })()}
                                            {selectedOrderStatus}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* ===== Arrival Info Card ===== */}
                            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                                <div className="px-5 py-3.5 bg-gradient-to-r from-emerald-50 to-teal-50 border-b border-gray-100 flex items-center gap-3">
                                    <div className="w-9 h-9 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center">
                                        <MapPin size={18} />
                                    </div>
                                    <h3 className="font-bold text-gray-800 text-sm">도착정보</h3>
                                </div>
                                <div className="px-5 py-4 space-y-3">
                                    {/* Row 1: Destination selector */}
                                    <div>
                                        <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1.5">도착정보</label>
                                        <div className="relative">
                                            <button
                                                onClick={() => isEditable && setDestDropdownOpen(!destDropdownOpen)}
                                                className={`w-full flex items-center justify-between bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors ${isEditable ? 'hover:border-blue-300 cursor-pointer' : 'cursor-default opacity-70'}`}
                                            >
                                                <span className="truncate">
                                                    {(() => {
                                                        const dest = destinations.find(d => d.id === selectedDestId);
                                                        if (!dest) return '도착지를 선택하세요';
                                                        if (dest.type === 'freight') return `[화물] ${dest.carrier} ${dest.branch} - ${dest.address}`;
                                                        return `[택배] ${dest.address} ${dest.addressDetail}`;
                                                    })()}
                                                </span>
                                                <ChevronDown size={16} className={`text-gray-400 transition-transform ${destDropdownOpen ? 'rotate-180' : ''}`} />
                                            </button>
                                            <AnimatePresence>
                                                {destDropdownOpen && (
                                                    <motion.div
                                                        initial={{ opacity: 0, y: -4 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        exit={{ opacity: 0, y: -4 }}
                                                        className="absolute z-30 top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden max-h-[200px] overflow-y-auto"
                                                    >
                                                        {destinations.map(dest => (
                                                            <button
                                                                key={dest.id}
                                                                onClick={() => { setSelectedDestId(dest.id); setDestDropdownOpen(false); }}
                                                                className={`w-full text-left px-4 py-2.5 text-sm hover:bg-blue-50 transition-colors flex items-center gap-2
                                                                    ${selectedDestId === dest.id ? 'bg-blue-50 font-bold text-blue-700' : 'text-gray-700'}`}
                                                            >
                                                                <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold
                                                                    ${dest.type === 'freight' ? 'bg-blue-100 text-blue-600' : 'bg-amber-100 text-amber-600'}`}>
                                                                    {dest.type === 'freight' ? <><Truck size={9} /> 화물</> : <><Package size={9} /> 택배</>}
                                                                </span>
                                                                <span className="truncate">
                                                                    {dest.type === 'freight'
                                                                        ? `${dest.carrier} ${dest.branch} - ${dest.address}`
                                                                        : `${dest.address} ${dest.addressDetail}`}
                                                                </span>
                                                            </button>
                                                        ))}
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </div>
                                    </div>

                                    {/* Row 2: Dates */}
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1.5 flex items-center gap-1">
                                                <Calendar size={9} /> 출고요청일
                                            </label>
                                            <input
                                                type="date"
                                                value={shipRequestDate}
                                                onChange={e => isEditable && setShipRequestDate(e.target.value)}
                                                readOnly={!isEditable}
                                                className={`w-full border border-gray-200 rounded-lg px-3 py-2 text-sm font-medium outline-none ${isEditable ? 'bg-white focus:border-blue-500' : 'bg-gray-100 text-gray-500 cursor-default'}`}
                                            />
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1.5 flex items-center gap-1">
                                                <Calendar size={9} />
                                                {currentOrderInfo?.deliveryType === '시공' && '시공일'}
                                                {currentOrderInfo?.deliveryType === '배송' && '배송일'}
                                                {currentOrderInfo?.deliveryType === '직출' && '직출일'}
                                                {!currentOrderInfo && '배송/시공/직출일'}
                                            </label>
                                            <div className="flex items-center gap-2">
                                                <span className={`inline-flex items-center px-2 py-1 rounded-md text-[10px] font-bold
                                                    ${currentOrderInfo?.deliveryType === '시공' ? 'bg-emerald-100 text-emerald-700'
                                                        : currentOrderInfo?.deliveryType === '배송' ? 'bg-violet-100 text-violet-700'
                                                            : 'bg-orange-100 text-orange-700'}`}>
                                                    {currentOrderInfo?.deliveryType || '-'}
                                                </span>
                                                <input
                                                    type="date"
                                                    value={deliveryTypeDate}
                                                    onChange={e => setDeliveryTypeDate(e.target.value)}
                                                    className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm font-medium outline-none text-gray-600"
                                                    readOnly
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Row 3: Remarks */}
                                    <div>
                                        <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1.5 flex items-center gap-1">
                                            <Edit3 size={9} /> 비고
                                        </label>
                                        <input
                                            type="text"
                                            value={arrivalRemark}
                                            onChange={e => isEditable && setArrivalRemark(e.target.value)}
                                            readOnly={!isEditable}
                                            placeholder="비고 사항을 입력하세요"
                                            className={`w-full border border-gray-200 rounded-lg px-3 py-2 text-sm font-medium outline-none placeholder-gray-300 ${isEditable ? 'bg-gray-50 focus:border-blue-500' : 'bg-gray-100 text-gray-500 cursor-default'}`}
                                        />
                                    </div>
                                </div>
                            </div>
                            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                                {/* Card Header */}
                                <div className="px-6 py-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-100 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center">
                                            <Package size={20} />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-gray-800">주문 리스트</h3>
                                            <span className="text-xs text-gray-400">{currentItems.length}개 상품</span>
                                        </div>
                                    </div>
                                    {/* Select All / Deselect All */}
                                    {isEditable && (
                                        <button
                                            onClick={allSelected ? deselectAll : selectAll}
                                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all border
                                                ${allSelected
                                                    ? 'bg-gray-100 text-gray-600 border-gray-200 hover:bg-gray-200'
                                                    : 'bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-100'
                                                }`}
                                        >
                                            {allSelected ? <Square size={14} /> : <CheckSquare size={14} />}
                                            {allSelected ? '전체취소' : '전체선택'}
                                        </button>
                                    )}
                                </div>

                                {/* Item Table Header */}
                                <div className="flex items-center bg-gray-50 border-b border-gray-200 text-[10px] font-bold text-gray-400 uppercase tracking-wider px-6 py-2.5">
                                    <div className="w-8"></div>
                                    <div className="flex-1">상품명</div>
                                    <div className="w-[100px] text-center">규격</div>
                                    <div className="w-[60px] text-center">수량</div>
                                    <div className="w-[100px] text-right">금액</div>
                                </div>

                                {/* Item Rows */}
                                <div>
                                    {currentItems.map(item => {
                                        const isSelected = selectedItemIds.has(item.id);
                                        return (
                                            <motion.div
                                                key={item.id}
                                                onClick={() => isEditable && toggleItemSelection(item.id)}
                                                className={`flex items-center px-6 py-3.5 border-b border-gray-100 transition-all ${isEditable ? 'cursor-pointer' : 'cursor-default'}
                                                    ${isEditable ? (isSelected ? 'bg-white' : 'bg-gray-50/70') : 'bg-white'}`}
                                                whileHover={isEditable ? { backgroundColor: isSelected ? '#f0f4ff' : '#f5f5f5' } : {}}
                                            >
                                                {isEditable && (
                                                    <div className="w-8">
                                                        {isSelected ? (
                                                            <CheckSquare size={16} className="text-blue-600" />
                                                        ) : (
                                                            <Square size={16} className="text-gray-300" />
                                                        )}
                                                    </div>
                                                )}
                                                <div className="flex-1">
                                                    <span className={`text-sm font-bold transition-all ${isSelected ? 'text-gray-800' : 'text-gray-400'}`}>
                                                        {item.productName}
                                                    </span>
                                                </div>
                                                <div className="w-[100px] text-center">
                                                    <span className={`text-xs font-mono transition-all ${isSelected ? 'text-gray-600' : 'text-gray-300'}`}>
                                                        {item.spec}
                                                    </span>
                                                </div>
                                                <div className="w-[60px] text-center">
                                                    <span className={`text-sm font-bold transition-all ${isSelected ? 'text-gray-700' : 'text-gray-300'}`}>
                                                        {item.quantity}
                                                    </span>
                                                </div>
                                                <div className="w-[100px] text-right">
                                                    <span className={`text-sm font-bold font-mono transition-all ${isSelected ? 'text-blue-700' : 'text-gray-300'}`}>
                                                        {(item.price * item.quantity).toLocaleString()}
                                                    </span>
                                                </div>
                                            </motion.div>
                                        );
                                    })}
                                </div>

                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ManufacturingOrder;
