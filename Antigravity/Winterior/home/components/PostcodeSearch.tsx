
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Search, MapPin, X, Building2, Navigation } from 'lucide-react';
import { motion } from 'framer-motion';

interface AddressData {
    zonecode: string;
    roadAddress: string;
    jibunAddress: string;
    region: string;
}

interface PostcodeSearchProps {
    onComplete: (data: { zonecode: string; roadAddress: string; jibunAddress: string }) => void;
    onClose: () => void;
}

// Korean Address Mock Dataset (~100 entries covering major cities)
const KOREAN_ADDRESSES: AddressData[] = [
    // 서울 강남구
    { zonecode: '06123', roadAddress: '서울특별시 강남구 테헤란로 152', jibunAddress: '서울특별시 강남구 역삼동 737', region: '서울' },
    { zonecode: '06134', roadAddress: '서울특별시 강남구 테헤란로 521', jibunAddress: '서울특별시 강남구 삼성동 159', region: '서울' },
    { zonecode: '06164', roadAddress: '서울특별시 강남구 영동대로 513', jibunAddress: '서울특별시 강남구 삼성동 159-1', region: '서울' },
    { zonecode: '06141', roadAddress: '서울특별시 강남구 봉은사로 524', jibunAddress: '서울특별시 강남구 삼성동 72', region: '서울' },
    { zonecode: '06180', roadAddress: '서울특별시 강남구 언주로 332', jibunAddress: '서울특별시 강남구 역삼동 828-5', region: '서울' },
    { zonecode: '06235', roadAddress: '서울특별시 강남구 강남대로 390', jibunAddress: '서울특별시 강남구 역삼동 825', region: '서울' },
    // 서울 서초구
    { zonecode: '06621', roadAddress: '서울특별시 서초구 서초대로 398', jibunAddress: '서울특별시 서초구 서초동 1685-8', region: '서울' },
    { zonecode: '06595', roadAddress: '서울특별시 서초구 방배로 226', jibunAddress: '서울특별시 서초구 방배동 447-1', region: '서울' },
    { zonecode: '06694', roadAddress: '서울특별시 서초구 반포대로 201', jibunAddress: '서울특별시 서초구 반포동 19-3', region: '서울' },
    // 서울 송파구
    { zonecode: '05836', roadAddress: '서울특별시 송파구 법원로 11길 7', jibunAddress: '서울특별시 송파구 문정동 642', region: '서울' },
    { zonecode: '05551', roadAddress: '서울특별시 송파구 올림픽로 300', jibunAddress: '서울특별시 송파구 신천동 29', region: '서울' },
    { zonecode: '05505', roadAddress: '서울특별시 송파구 충민로 66', jibunAddress: '서울특별시 송파구 장지동 930', region: '서울' },
    { zonecode: '05854', roadAddress: '서울특별시 송파구 위례성대로 20', jibunAddress: '서울특별시 송파구 거여동 233-3', region: '서울' },
    // 서울 마포구
    { zonecode: '04177', roadAddress: '서울특별시 마포구 마포대로 45', jibunAddress: '서울특별시 마포구 도화동 559', region: '서울' },
    { zonecode: '04104', roadAddress: '서울특별시 마포구 월드컵북로 396', jibunAddress: '서울특별시 마포구 상암동 1600', region: '서울' },
    { zonecode: '04066', roadAddress: '서울특별시 마포구 양화로 186', jibunAddress: '서울특별시 마포구 동교동 169-1', region: '서울' },
    // 서울 종로구
    { zonecode: '03045', roadAddress: '서울특별시 종로구 사직로 161', jibunAddress: '서울특별시 종로구 세종로 1', region: '서울' },
    { zonecode: '03060', roadAddress: '서울특별시 종로구 세종대로 209', jibunAddress: '서울특별시 종로구 세종로 81-3', region: '서울' },
    { zonecode: '03131', roadAddress: '서울특별시 종로구 종로 1', jibunAddress: '서울특별시 종로구 종로1가 1', region: '서울' },
    // 서울 중구
    { zonecode: '04523', roadAddress: '서울특별시 중구 세종대로 110', jibunAddress: '서울특별시 중구 태평로1가 31', region: '서울' },
    { zonecode: '04637', roadAddress: '서울특별시 중구 남대문로 120', jibunAddress: '서울특별시 중구 남대문로4가 1', region: '서울' },
    { zonecode: '04533', roadAddress: '서울특별시 중구 을지로 30', jibunAddress: '서울특별시 중구 을지로1가 50', region: '서울' },
    // 서울 용산구
    { zonecode: '04383', roadAddress: '서울특별시 용산구 이태원로 22', jibunAddress: '서울특별시 용산구 이태원동 119-1', region: '서울' },
    { zonecode: '04353', roadAddress: '서울특별시 용산구 녹사평대로 150', jibunAddress: '서울특별시 용산구 한남동 795-5', region: '서울' },
    // 서울 영등포구
    { zonecode: '07241', roadAddress: '서울특별시 영등포구 국제금융로 10', jibunAddress: '서울특별시 영등포구 여의도동 23', region: '서울' },
    { zonecode: '07208', roadAddress: '서울특별시 영등포구 여의공원로 101', jibunAddress: '서울특별시 영등포구 여의도동 16-1', region: '서울' },
    // 서울 성동구
    { zonecode: '04770', roadAddress: '서울특별시 성동구 왕십리로 115', jibunAddress: '서울특별시 성동구 성수동1가 685', region: '서울' },
    { zonecode: '04781', roadAddress: '서울특별시 성동구 뚝섬로 273', jibunAddress: '서울특별시 성동구 성수동2가 269-1', region: '서울' },
    // 서울 광진구
    { zonecode: '05029', roadAddress: '서울특별시 광진구 능동로 120', jibunAddress: '서울특별시 광진구 능동 18', region: '서울' },
    { zonecode: '04998', roadAddress: '서울특별시 광진구 아차산로 200', jibunAddress: '서울특별시 광진구 구의동 546-4', region: '서울' },
    // 서울 강동구
    { zonecode: '05393', roadAddress: '서울특별시 강동구 천호대로 1073', jibunAddress: '서울특별시 강동구 천호동 455-20', region: '서울' },
    // 서울 강서구
    { zonecode: '07803', roadAddress: '서울특별시 강서구 공항대로 247', jibunAddress: '서울특별시 강서구 공항동 1373', region: '서울' },
    // 서울 노원구
    { zonecode: '01811', roadAddress: '서울특별시 노원구 상계로 70', jibunAddress: '서울특별시 노원구 상계동 735', region: '서울' },
    // 서울 구로구
    { zonecode: '08390', roadAddress: '서울특별시 구로구 디지털로 300', jibunAddress: '서울특별시 구로구 구로동 197-5', region: '서울' },

    // 경기도
    { zonecode: '13529', roadAddress: '경기도 성남시 분당구 판교역로 235', jibunAddress: '경기도 성남시 분당구 삼평동 681', region: '경기' },
    { zonecode: '13494', roadAddress: '경기도 성남시 분당구 불정로 6', jibunAddress: '경기도 성남시 분당구 정자동 178-1', region: '경기' },
    { zonecode: '13561', roadAddress: '경기도 성남시 분당구 대왕판교로 660', jibunAddress: '경기도 성남시 분당구 삼평동 670', region: '경기' },
    { zonecode: '16677', roadAddress: '경기도 수원시 영통구 광교중앙로 145', jibunAddress: '경기도 수원시 영통구 이의동 906-5', region: '경기' },
    { zonecode: '16508', roadAddress: '경기도 수원시 팔달구 효원로 1', jibunAddress: '경기도 수원시 팔달구 인계동 1111', region: '경기' },
    { zonecode: '10408', roadAddress: '경기도 고양시 일산동구 중앙로 1036', jibunAddress: '경기도 고양시 일산동구 장항동 856', region: '경기' },
    { zonecode: '10232', roadAddress: '경기도 고양시 일산서구 킨텍스로 217', jibunAddress: '경기도 고양시 일산서구 대화동 2600', region: '경기' },
    { zonecode: '14547', roadAddress: '경기도 부천시 길주로 210', jibunAddress: '경기도 부천시 중동 1033', region: '경기' },
    { zonecode: '11780', roadAddress: '경기도 의정부시 시민로 1', jibunAddress: '경기도 의정부시 의정부동 222', region: '경기' },
    { zonecode: '12109', roadAddress: '경기도 남양주시 경춘로 522', jibunAddress: '경기도 남양주시 금곡동 185-7', region: '경기' },
    { zonecode: '17104', roadAddress: '경기도 용인시 처인구 금학로 27', jibunAddress: '경기도 용인시 처인구 김량장동 349-1', region: '경기' },
    { zonecode: '15073', roadAddress: '경기도 시흥시 마유로 230', jibunAddress: '경기도 시흥시 정왕동 1689-2', region: '경기' },
    { zonecode: '10223', roadAddress: '경기도 고양시 일산서구 호수로 731', jibunAddress: '경기도 고양시 일산서구 주엽동 18-1', region: '경기' },
    { zonecode: '18464', roadAddress: '경기도 화성시 동탄순환대로 830', jibunAddress: '경기도 화성시 청계동 산52', region: '경기' },
    { zonecode: '17547', roadAddress: '경기도 안성시 공도읍 서동대로 4060', jibunAddress: '경기도 안성시 공도읍 만정리 640-1', region: '경기' },
    { zonecode: '10594', roadAddress: '경기도 파주시 회동길 159', jibunAddress: '경기도 파주시 문발동 522-1', region: '경기' },

    // 인천
    { zonecode: '21999', roadAddress: '인천광역시 연수구 센트럴로 350', jibunAddress: '인천광역시 연수구 송도동 24-5', region: '인천' },
    { zonecode: '22320', roadAddress: '인천광역시 중구 영종해안남로 321번길 186', jibunAddress: '인천광역시 중구 운서동 2850', region: '인천' },
    { zonecode: '21388', roadAddress: '인천광역시 부평구 부평대로 283', jibunAddress: '인천광역시 부평구 부평동 524-1', region: '인천' },

    // 부산
    { zonecode: '48058', roadAddress: '부산광역시 해운대구 해운대해변로 264', jibunAddress: '부산광역시 해운대구 우동 1408', region: '부산' },
    { zonecode: '48060', roadAddress: '부산광역시 해운대구 센텀중앙로 79', jibunAddress: '부산광역시 해운대구 우동 1495', region: '부산' },
    { zonecode: '48726', roadAddress: '부산광역시 동구 충장대로 206', jibunAddress: '부산광역시 동구 초량동 1187-1', region: '부산' },
    { zonecode: '48094', roadAddress: '부산광역시 해운대구 마린시티2로 38', jibunAddress: '부산광역시 해운대구 우동 1407', region: '부산' },
    { zonecode: '46241', roadAddress: '부산광역시 금정구 부산대학로 63번길 2', jibunAddress: '부산광역시 금정구 장전동 산30', region: '부산' },
    { zonecode: '48513', roadAddress: '부산광역시 남구 용소로 45', jibunAddress: '부산광역시 남구 대연동 1', region: '부산' },
    { zonecode: '47340', roadAddress: '부산광역시 부산진구 전포대로 199', jibunAddress: '부산광역시 부산진구 부전동 503-15', region: '부산' },

    // 대구
    { zonecode: '41000', roadAddress: '대구광역시 서구 국채보상로 100', jibunAddress: '대구광역시 서구 내당동 222', region: '대구' },
    { zonecode: '41911', roadAddress: '대구광역시 중구 동성로2길 55', jibunAddress: '대구광역시 중구 동성로3가 111', region: '대구' },
    { zonecode: '42020', roadAddress: '대구광역시 수성구 수성로 100', jibunAddress: '대구광역시 수성구 만촌동 12', region: '대구' },
    { zonecode: '42988', roadAddress: '대구광역시 달서구 달구벌대로 1611', jibunAddress: '대구광역시 달서구 감삼동 232', region: '대구' },
    { zonecode: '41061', roadAddress: '대구광역시 동구 동대구로 550', jibunAddress: '대구광역시 동구 신천동 388', region: '대구' },

    // 대전
    { zonecode: '35208', roadAddress: '대전광역시 서구 둔산로 100', jibunAddress: '대전광역시 서구 둔산동 1420', region: '대전' },
    { zonecode: '34126', roadAddress: '대전광역시 유성구 대학로 99', jibunAddress: '대전광역시 유성구 궁동 220', region: '대전' },
    { zonecode: '35242', roadAddress: '대전광역시 서구 대덕대로 179', jibunAddress: '대전광역시 서구 탄방동 1390', region: '대전' },

    // 광주
    { zonecode: '61186', roadAddress: '광주광역시 북구 용봉로 77', jibunAddress: '광주광역시 북구 용봉동 300', region: '광주' },
    { zonecode: '62271', roadAddress: '광주광역시 광산구 무진대로 282', jibunAddress: '광주광역시 광산구 송정동 863', region: '광주' },
    { zonecode: '61467', roadAddress: '광주광역시 동구 금남로 245', jibunAddress: '광주광역시 동구 충장로1가 1', region: '광주' },

    // 울산
    { zonecode: '44677', roadAddress: '울산광역시 남구 삼산로 273', jibunAddress: '울산광역시 남구 삼산동 1580-1', region: '울산' },
    { zonecode: '44211', roadAddress: '울산광역시 중구 번영로 55', jibunAddress: '울산광역시 중구 성남동 240-2', region: '울산' },

    // 세종
    { zonecode: '30151', roadAddress: '세종특별자치시 한누리대로 2130', jibunAddress: '세종특별자치시 어진동 551', region: '세종' },
    { zonecode: '30121', roadAddress: '세종특별자치시 도움4로 52', jibunAddress: '세종특별자치시 나성동 738', region: '세종' },

    // 제주
    { zonecode: '63122', roadAddress: '제주특별자치도 제주시 관덕로 25', jibunAddress: '제주특별자치도 제주시 삼도2동 984-1', region: '제주' },
    { zonecode: '63565', roadAddress: '제주특별자치도 서귀포시 중문관광로 72번길 75', jibunAddress: '제주특별자치도 서귀포시 중문동 2700-2', region: '제주' },
    { zonecode: '63085', roadAddress: '제주특별자치도 제주시 연삼로 473', jibunAddress: '제주특별자치도 제주시 연동 312-10', region: '제주' },

    // 충남
    { zonecode: '31065', roadAddress: '충청남도 천안시 동남구 만남로 43', jibunAddress: '충청남도 천안시 동남구 신부동 463', region: '충남' },
    { zonecode: '32700', roadAddress: '충청남도 아산시 배미로 1', jibunAddress: '충청남도 아산시 온천동 540', region: '충남' },
    // 충북
    { zonecode: '28644', roadAddress: '충청북도 청주시 상당구 상당로 82', jibunAddress: '충청북도 청주시 상당구 북문로2가 63', region: '충북' },
    // 전남
    { zonecode: '58564', roadAddress: '전라남도 목포시 원산로 12길 18', jibunAddress: '전라남도 목포시 용당동 1073-1', region: '전남' },
    { zonecode: '57922', roadAddress: '전라남도 순천시 장천3길 72', jibunAddress: '전라남도 순천시 장천동 18', region: '전남' },
    // 전북
    { zonecode: '54896', roadAddress: '전북특별자치도 전주시 완산구 전주객사3길 22', jibunAddress: '전북특별자치도 전주시 완산구 중앙동3가 1', region: '전북' },
    // 경남
    { zonecode: '51394', roadAddress: '경상남도 창원시 의창구 중앙대로 151', jibunAddress: '경상남도 창원시 의창구 용호동 6', region: '경남' },
    { zonecode: '50924', roadAddress: '경상남도 김해시 김해대로 2401', jibunAddress: '경상남도 김해시 부원동 559', region: '경남' },
    // 경북
    { zonecode: '36729', roadAddress: '경상북도 안동시 경동로 402', jibunAddress: '경상북도 안동시 옥동 922', region: '경북' },
    { zonecode: '38542', roadAddress: '경상북도 경산시 대학로 280', jibunAddress: '경상북도 경산시 대동 214', region: '경북' },
    // 강원
    { zonecode: '24408', roadAddress: '강원특별자치도 춘천시 금강로 1', jibunAddress: '강원특별자치도 춘천시 봉의동 15', region: '강원' },
    { zonecode: '25440', roadAddress: '강원특별자치도 강릉시 강릉대로 33', jibunAddress: '강원특별자치도 강릉시 교동 233', region: '강원' },
];

const REGIONS = ['전체', '서울', '경기', '인천', '부산', '대구', '대전', '광주', '울산', '세종', '제주', '충남', '충북', '전남', '전북', '경남', '경북', '강원'];

const PostcodeSearch: React.FC<PostcodeSearchProps> = ({ onComplete, onClose }) => {
    const [query, setQuery] = useState('');
    const [selectedRegion, setSelectedRegion] = useState('전체');
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        setTimeout(() => inputRef.current?.focus(), 200);
    }, []);

    const results = useMemo(() => {
        let filtered = KOREAN_ADDRESSES;

        if (selectedRegion !== '전체') {
            filtered = filtered.filter(a => a.region === selectedRegion);
        }

        if (!query.trim()) return filtered;

        const q = query.trim().toLowerCase();
        return filtered.filter(a =>
            a.zonecode.includes(q) ||
            a.roadAddress.toLowerCase().includes(q) ||
            a.jibunAddress.toLowerCase().includes(q)
        );
    }, [query, selectedRegion]);

    const handleSelect = (addr: AddressData) => {
        onComplete({
            zonecode: addr.zonecode,
            roadAddress: addr.roadAddress,
            jibunAddress: addr.jibunAddress,
        });
    };

    return (
        <div className="flex flex-col h-full">
            {/* Search Header */}
            <div className="p-4 border-b border-gray-100 bg-gradient-to-b from-blue-50/80 to-white space-y-3">
                <div className="relative">
                    <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-400" />
                    <input
                        ref={inputRef}
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="도로명, 지번, 동이름, 우편번호 검색..."
                        className="w-full pl-11 pr-10 py-3 bg-white border-2 border-blue-100 rounded-xl text-sm font-medium outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-50 transition-all shadow-sm"
                    />
                    {query && (
                        <button
                            onClick={() => setQuery('')}
                            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 rounded-full text-gray-400"
                        >
                            <X size={14} />
                        </button>
                    )}
                </div>
                {/* Region Filter */}
                <div className="flex flex-wrap gap-1">
                    {REGIONS.map(r => (
                        <button
                            key={r}
                            onClick={() => setSelectedRegion(r)}
                            className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-all
                                ${selectedRegion === r
                                    ? 'bg-blue-600 text-white shadow-sm'
                                    : 'bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-gray-700'
                                }`}
                        >
                            {r}
                        </button>
                    ))}
                </div>
            </div>

            {/* Results Count */}
            <div className="px-4 py-2 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
                <span className="text-xs text-gray-400 font-medium">
                    검색결과 <span className="font-bold text-blue-600">{results.length}</span>건
                </span>
                <span className="text-[10px] text-gray-400">클릭하여 주소를 선택하세요</span>
            </div>

            {/* Results List */}
            <div className="flex-1 overflow-y-auto">
                {results.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-3 py-12">
                        <MapPin size={40} className="opacity-20" />
                        <div className="text-center">
                            <p className="text-sm font-bold text-gray-500">검색 결과가 없습니다</p>
                            <p className="text-xs text-gray-400 mt-1">다른 키워드로 검색해 보세요</p>
                        </div>
                    </div>
                ) : (
                    results.map((addr, idx) => (
                        <motion.div
                            key={`${addr.zonecode}-${idx}`}
                            initial={{ opacity: 0, y: 4 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: Math.min(idx * 0.02, 0.3) }}
                            onClick={() => handleSelect(addr)}
                            className="flex items-start gap-3 px-4 py-3.5 border-b border-gray-50 cursor-pointer hover:bg-blue-50/70 transition-colors group"
                        >
                            {/* Postal Code Badge */}
                            <div className="flex-shrink-0 mt-0.5">
                                <div className="bg-blue-100 text-blue-700 px-2.5 py-1 rounded-lg text-xs font-bold min-w-[56px] text-center group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                    {addr.zonecode}
                                </div>
                            </div>

                            {/* Address Info */}
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1.5 mb-1">
                                    <Navigation size={11} className="text-blue-500 flex-shrink-0" />
                                    <span className="text-sm font-bold text-gray-800 truncate">{addr.roadAddress}</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <Building2 size={11} className="text-gray-400 flex-shrink-0" />
                                    <span className="text-xs text-gray-500 truncate">{addr.jibunAddress}</span>
                                </div>
                            </div>
                        </motion.div>
                    ))
                )}
            </div>

            {/* Footer */}
            <div className="px-4 py-2.5 bg-gray-50 border-t border-gray-100 flex-shrink-0">
                <p className="text-[10px] text-gray-400 text-center">
                    💡 동이름, 도로명, 건물명 또는 우편번호로 검색하세요
                </p>
            </div>
        </div>
    );
};

export default PostcodeSearch;
