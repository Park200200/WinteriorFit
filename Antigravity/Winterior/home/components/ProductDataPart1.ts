
import { NodeData } from '../types';

// --- SAMPLE DATA TEMPLATES ---
export const SAMPLE_ROLL_SPECS = JSON.stringify([
  { id: "sp-r1", title: "원단소재", content: "Polyester 100% / 친환경 무독성 코팅" },
  { id: "sp-r2", title: "기능성", content: "자외선 차단 90% 이상, 생활 방수 및 방오 가공" },
  { id: "sp-r3", title: "원단폭", content: "200cm / 240cm / 280cm (광폭 지원)" },
  { id: "sp-r4", title: "관리방법", content: "마른 걸레나 먼지떨이로 가볍게 먼지 제거 (세탁 불가)" }
]);

export const SAMPLE_ROLL_STYLES = JSON.stringify([
  { id: "st-r1", name: "모던 오피스", imageUrl: "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=600&q=80", imagePrompt: "Modern office with clean white roll screens", videoPrompt: "Sunlight filtering through roll screen in office" },
  { id: "st-r2", name: "심플 리빙", imageUrl: "https://images.unsplash.com/photo-1598928506311-c55ded91a20c?auto=format&fit=crop&w=600&q=80", imagePrompt: "Minimalist living room with beige roll blinds", videoPrompt: "Slow pan of living room window" }
]);

export const SAMPLE_ROLL_BLACKOUT_SPECS = JSON.stringify([
  { id: "sp-rb1", title: "암막률", content: "99.9% 완벽 암막 (Blackout Coating)" },
  { id: "sp-rb2", title: "단열효과", content: "여름철 열기 차단 및 겨울철 냉기 차단 효과 우수" },
  { id: "sp-rb3", title: "소재", content: "Polyester 100% + 3 Pass Foam Coating" },
  { id: "sp-rb4", title: "용도", content: "침실, 회의실, 시청각실 등 빛 차단이 필요한 공간" }
]);

export const SAMPLE_ROLL_BLACKOUT_STYLES = JSON.stringify([
  { id: "st-rb1", name: "호텔식 침실", imageUrl: "https://images.unsplash.com/photo-1616594039964-40891a9046c9?auto=format&fit=crop&w=600&q=80", imagePrompt: "Dark cozy bedroom with blackout blinds", videoPrompt: "Morning light blocked by blinds" },
  { id: "st-rb2", name: "홈 시네마", imageUrl: "https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?auto=format&fit=crop&w=600&q=80", imagePrompt: "Dark room with projector and blackout screens", videoPrompt: "Dimming lights in media room" }
]);

export const SAMPLE_COMBI_SPECS = JSON.stringify([
  { id: "sp-c1", title: "구조", content: "75mm 솔리드 + 50mm 쉬어망사 교차 이중 구조" },
  { id: "sp-c2", title: "소재", content: "High Quality Polyester 100%" },
  { id: "sp-c3", title: "특징", content: "채광 조절 용이, 통기성 우수, 사생활 보호 효과" },
  { id: "sp-c4", title: "원산지", content: "대한민국 (Made in Korea)" }
]);

export const SAMPLE_COMBI_STYLES = JSON.stringify([
  { id: "st-c1", name: "내추럴 우드톤", imageUrl: "https://images.unsplash.com/photo-1616486338812-3dadae4b4f9d?auto=format&fit=crop&w=600&q=80", imagePrompt: "Natural wood tone combi blinds in living room", videoPrompt: "Adjusting combi blinds open and close" },
  { id: "st-c2", name: "화사한 다이닝", imageUrl: "https://images.unsplash.com/photo-1617806118233-18e1de247200?auto=format&fit=crop&w=600&q=80", imagePrompt: "Bright dining room with white combi blinds", videoPrompt: "Sunlight patterns through combi blinds" }
]);

export const SAMPLE_COMBI_BLACKOUT_SPECS = JSON.stringify([
  { id: "sp-cb1", title: "기능", content: "암막 기능이 추가된 콤비 블라인드 (암막률 90%)" },
  { id: "sp-cb2", title: "구조", content: "암막 원단과 촘촘한 망사의 이중 교차" },
  { id: "sp-cb3", title: "디자인", content: "고급스러운 텍스처와 깊이감 있는 컬러 구현" },
  { id: "sp-cb4", title: "추천", content: "저층 세대, 침실, 서재" }
]);

export const nodesPart1: Record<string, NodeData> = {
  "root": {
    "id": "root",
    "parentId": null,
    "type": "ROOT",
    "label": "표준상품",
    "isExpanded": true,
    "childrenIds": [
      "cat-blind",
      "cat-curtain"
    ]
  },
  "cat-blind": {
    "id": "cat-blind",
    "parentId": "root",
    "type": "CATEGORY",
    "label": "블라인드",
    "isExpanded": true,
    "childrenIds": [
      "sub-wood",
      "sub-roll",
      "sub-combi",
      "sub-honeycomb"
    ]
  },
  "cat-curtain": {
    "id": "cat-curtain",
    "parentId": "root",
    "type": "CATEGORY",
    "label": "커튼",
    "isExpanded": true,
    "childrenIds": [
      "sub-memory",
      "node-1768353677795",
      "node-hospital-curtain"
    ]
  },
  "node-hospital-curtain": {
    "id": "node-hospital-curtain",
    "parentId": "cat-curtain",
    "type": "CATEGORY",
    "label": "병원커튼",
    "isExpanded": true,
    "childrenIds": [
      "node-hospital-icu",
      "node-hospital-er",
      "node-hospital-gen",
      "node-hospital-vip"
    ],
    "attributes": {
      "nodeType": "category"
    }
  },
  "node-hospital-icu": {
    "id": "node-hospital-icu",
    "parentId": "node-hospital-curtain",
    "type": "DATA",
    "label": "중환자실^^",
    "isExpanded": true,
    "childrenIds": [],
    "attributes": {
      "nodeType": "product"
    }
  },
  "node-hospital-er": {
    "id": "node-hospital-er",
    "parentId": "node-hospital-curtain",
    "type": "DATA",
    "label": "응급실",
    "isExpanded": true,
    "childrenIds": [],
    "attributes": {
      "nodeType": "product"
    }
  },
  "node-hospital-gen": {
    "id": "node-hospital-gen",
    "parentId": "node-hospital-curtain",
    "type": "DATA",
    "label": "일반병실",
    "isExpanded": true,
    "childrenIds": [],
    "attributes": {
      "nodeType": "product"
    }
  },
  "node-hospital-vip": {
    "id": "node-hospital-vip",
    "parentId": "node-hospital-curtain",
    "type": "DATA",
    "label": "VIP병실",
    "isExpanded": true,
    "childrenIds": [],
    "attributes": {
      "nodeType": "product"
    }
  },
  "sub-wood": {
    "id": "sub-wood",
    "parentId": "cat-blind",
    "type": "CATEGORY",
    "label": "우드",
    "isExpanded": true,
    "childrenIds": [
      "size-25",
      "size-35",
      "size-55"
    ]
  },
  "sub-roll": {
    "id": "sub-roll",
    "parentId": "cat-blind",
    "type": "CATEGORY",
    "label": "롤",
    "isExpanded": false,
    "childrenIds": [
      "prod-roll-basic",
      "prod-roll-blackout"
    ]
  },
  "sub-combi": {
    "id": "sub-combi",
    "parentId": "cat-blind",
    "type": "CATEGORY",
    "label": "콤비",
    "isExpanded": true,
    "childrenIds": [
      "prod-combi-basic",
      "node-1768352478788"
    ]
  },
  "sub-honeycomb": {
    "id": "sub-honeycomb",
    "parentId": "cat-blind",
    "type": "CATEGORY",
    "label": "허니콤",
    "isExpanded": true,
    "childrenIds": [
      "node-1768352618881",
      "node-1768352627267"
    ]
  },
  "sub-memory": {
    "id": "sub-memory",
    "parentId": "cat-curtain",
    "type": "CATEGORY",
    "label": "속커튼",
    "isExpanded": true,
    "childrenIds": [
      "prod-std-curtain",
      "node-1768353947168",
      "node-1768353953653"
    ]
  },
  "prod-std-curtain": {
    "id": "prod-std-curtain",
    "parentId": "sub-memory",
    "type": "DATA",
    "label": "쉬폰",
    "isExpanded": true,
    "childrenIds": [
      "node-1768354769996",
      "node-1769237453062",
      "node-1769237458620"
    ],
    "attributes": {}
  },
  "size-25": {
    "id": "size-25",
    "parentId": "sub-wood",
    "type": "CATEGORY",
    "label": "25mm",
    "isExpanded": true,
    "childrenIds": [
      "prod-pine",
      "prod-bamboo",
      "prod-paulownia",
      "prod-woodchip"
    ]
  },
  "size-35": {
    "id": "size-35",
    "parentId": "sub-wood",
    "type": "CATEGORY",
    "label": "35mm",
    "isExpanded": true,
    "childrenIds": [
      "node-1768353464217",
      "node-1768353471025",
      "node-1768353483104"
    ]
  },
  "size-55": {
    "id": "size-55",
    "parentId": "sub-wood",
    "type": "CATEGORY",
    "label": "55mm",
    "isExpanded": true,
    "childrenIds": [
      "node-1768353492082",
      "node-1768353499080",
      "node-1768353507081"
    ]
  },
  "prod-pine": {
    "id": "prod-pine",
    "parentId": "size-25",
    "type": "DATA",
    "label": "소나무",
    "isExpanded": true,
    "childrenIds": [
      "opt-black",
      "opt-white",
      "opt-ivory"
    ],
    "attributes": {
      "product": "Pine"
    }
  },
  "prod-bamboo": {
    "id": "prod-bamboo",
    "parentId": "size-25",
    "type": "DATA",
    "label": "대나무",
    "isExpanded": true,
    "childrenIds": [
      "node-1768353306988",
      "node-1768353314350",
      "node-1768353321484",
      "node-1768353369893"
    ]
  },
  "prod-paulownia": {
    "id": "prod-paulownia",
    "parentId": "size-25",
    "type": "DATA",
    "label": "오동나무",
    "isExpanded": true,
    "childrenIds": [
      "node-1768353374519",
      "node-1768353378156",
      "node-1768353381125"
    ]
  },
  "prod-woodchip": {
    "id": "prod-woodchip",
    "parentId": "size-25",
    "type": "DATA",
    "label": "우드칩",
    "isExpanded": true,
    "childrenIds": [
      "node-1768353446213",
      "node-1768353449902",
      "node-1768353453529"
    ]
  },
  "prod-roll-basic": {
    "id": "prod-roll-basic",
    "parentId": "sub-roll",
    "type": "DATA",
    "label": "일반",
    "isExpanded": true,
    "childrenIds": [
      "node-1768352207184",
      "node-1768352223137",
      "node-1768352228611",
      "node-1768352236871"
    ],
    "attributes": {
      "nodeType": "category",
      "spec_cards": SAMPLE_ROLL_SPECS,
      "style_cards": SAMPLE_ROLL_STYLES
    }
  },
  "prod-roll-blackout": {
    "id": "prod-roll-blackout",
    "parentId": "sub-roll",
    "type": "DATA",
    "label": "암막",
    "isExpanded": true,
    "childrenIds": [
      "node-1768352243377",
      "node-1768352247189",
      "node-1768352262610"
    ],
    "attributes": {
      "nodeType": "category",
      "spec_cards": SAMPLE_ROLL_BLACKOUT_SPECS,
      "style_cards": SAMPLE_ROLL_BLACKOUT_STYLES
    }
  },
  "prod-combi-basic": {
    "id": "prod-combi-basic",
    "parentId": "sub-combi",
    "type": "DATA",
    "label": "일반콤비",
    "isExpanded": true,
    "childrenIds": [
      "node-1768352517295",
      "node-1768352551607",
      "node-1768352563937",
      "node-1768352573545"
    ],
    "attributes": {
      "nodeType": "category",
      "spec_cards": SAMPLE_COMBI_SPECS,
      "style_cards": SAMPLE_COMBI_STYLES
    }
  },
  "opt-black": {
    "id": "opt-black",
    "parentId": "prod-pine",
    "type": "DATA",
    "label": "블랙",
    "isExpanded": false,
    "childrenIds": [],
    "attributes": {
      "color": "#000000",
      "nodeType": "color"
    }
  },
  "opt-white": {
    "id": "opt-white",
    "parentId": "prod-pine",
    "type": "DATA",
    "label": "화이트",
    "isExpanded": false,
    "childrenIds": [],
    "attributes": {
      "color": "#FFFFFF",
      "nodeType": "color"
    }
  },
  "opt-ivory": {
    "id": "opt-ivory",
    "parentId": "prod-pine",
    "type": "DATA",
    "label": "아이보리",
    "isExpanded": false,
    "childrenIds": [],
    "attributes": {
      "color": "#FFFFF0",
      "nodeType": "color"
    }
  },
  "root-1768350630954": {
    "id": "root-1768350630954",
    "parentId": null,
    "type": "ROOT",
    "label": "세탁접수",
    "isExpanded": true,
    "childrenIds": [
      "node-1768351982172",
      "node-1768352000850",
      "node-1768352021870"
    ],
    "attributes": {
      "nodeType": "root"
    }
  },
  "root-1768350652484": {
    "id": "root-1768350652484",
    "parentId": null,
    "type": "ROOT",
    "label": "무료실측",
    "isExpanded": true,
    "childrenIds": [
      "node-1768350680564",
      "node-1768350943343",
      "node-1768351324318",
      "node-1768351455282",
      "node-1768351677980",
      "node-1768351821713"
    ],
    "attributes": {
      "nodeType": "root"
    }
  },
  "node-1768350680564": {
    "id": "node-1768350680564",
    "parentId": "root-1768350652484",
    "type": "CATEGORY",
    "label": "주거",
    "isExpanded": true,
    "childrenIds": [
      "node-1768350760184",
      "node-1768350768983",
      "node-1768350777035",
      "node-1768350787652",
      "node-1768350797752",
      "node-1768350805556"
    ],
    "attributes": {
      "nodeType": "option"
    }
  },
  "node-1768350760184": {
    "id": "node-1768350760184",
    "parentId": "node-1768350680564",
    "type": "DATA",
    "label": "아파트",
    "isExpanded": true,
    "childrenIds": [],
    "attributes": {
      "nodeType": "type-1768350738452"
    }
  },
  "node-1768350768983": {
    "id": "node-1768350768983",
    "parentId": "node-1768350680564",
    "type": "DATA",
    "label": "사무실",
    "isExpanded": true,
    "childrenIds": [],
    "attributes": {
      "nodeType": "type-1768350738452"
    }
  },
  "node-1768350777035": {
    "id": "node-1768350777035",
    "parentId": "node-1768350680564",
    "type": "DATA",
    "label": "빌라",
    "isExpanded": true,
    "childrenIds": [],
    "attributes": {
      "nodeType": "type-1768350738452"
    }
  },
  "node-1768350787652": {
    "id": "node-1768350787652",
    "parentId": "node-1768350680564",
    "type": "DATA",
    "label": "단독주택",
    "isExpanded": true,
    "childrenIds": [],
    "attributes": {
      "nodeType": "type-1768350738452"
    }
  },
  "node-1768350797752": {
    "id": "node-1768350797752",
    "parentId": "node-1768350680564",
    "type": "DATA",
    "label": "팬션",
    "isExpanded": true,
    "childrenIds": [],
    "attributes": {
      "nodeType": "type-1768350738452"
    }
  },
  "node-1768350805556": {
    "id": "node-1768350805556",
    "parentId": "node-1768350680564",
    "type": "DATA",
    "label": "호텔",
    "isExpanded": true,
    "childrenIds": [],
    "attributes": {
      "nodeType": "type-1768350738452"
    }
  },
  "node-1768350943343": {
    "id": "node-1768350943343",
    "parentId": "root-1768350652484",
    "type": "DATA",
    "label": "상품",
    "isExpanded": true,
    "childrenIds": [
      "node-1768350953477",
      "node-1768350959646",
      "node-1768350965516",
      "node-1768350977353"
    ],
    "attributes": {
      "nodeType": "option"
    }
  },
  "node-1768350953477": {
    "id": "node-1768350953477",
    "parentId": "node-1768350943343",
    "type": "DATA",
    "label": "블라인드",
    "isExpanded": true,
    "childrenIds": [],
    "attributes": {
      "nodeType": "type-1768350738452"
    }
  },
  "node-1768350959646": {
    "id": "node-1768350959646",
    "parentId": "node-1768350943343",
    "type": "DATA",
    "label": "커튼",
    "isExpanded": true,
    "childrenIds": [],
    "attributes": {
      "nodeType": "type-1768350738452"
    }
  },
  "node-1768350965516": {
    "id": "node-1768350965516",
    "parentId": "node-1768350943343",
    "type": "DATA",
    "label": "자바라",
    "isExpanded": true,
    "childrenIds": [],
    "attributes": {
      "nodeType": "type-1768350738452"
    }
  },
  "node-1768350977353": {
    "id": "node-1768350977353",
    "parentId": "node-1768350943343",
    "type": "DATA",
    "label": "폴딩도어",
    "isExpanded": true,
    "childrenIds": [],
    "attributes": {
      "nodeType": "type-1768350738452"
    }
  },
  "node-1768351324318": {
    "id": "node-1768351324318",
    "parentId": "root-1768350652484",
    "type": "DATA",
    "label": "층간연결시공",
    "isExpanded": true,
    "childrenIds": [
      "node-1768351411575",
      "node-1768351418253"
    ],
    "attributes": {
      "nodeType": "option"
    }
  },
  "node-1768351411575": {
    "id": "node-1768351411575",
    "parentId": "node-1768351324318",
    "type": "DATA",
    "label": "예",
    "isExpanded": true,
    "childrenIds": [],
    "attributes": {
      "nodeType": "type-1768350738452"
    }
  },
  "node-1768351418253": {
    "id": "node-1768351418253",
    "parentId": "node-1768351324318",
    "type": "DATA",
    "label": "아니요",
    "isExpanded": true,
    "childrenIds": [],
    "attributes": {
      "nodeType": "type-1768350738452"
    }
  },
  "node-1768351455282": {
    "id": "node-1768351455282",
    "parentId": "root-1768350652484",
    "type": "DATA",
    "label": "서비스종류",
    "isExpanded": true,
    "childrenIds": [
      "node-1768351484799",
      "node-1768351504828",
      "node-1768351526175",
      "node-1768351532534",
      "node-1768351537877"
    ],
    "attributes": {
      "nodeType": "option"
    }
  },
  "node-1768351484799": {
    "id": "node-1768351484799",
    "parentId": "node-1768351455282",
    "type": "DATA",
    "label": "맞춤제작",
    "isExpanded": true,
    "childrenIds": [],
    "attributes": {
      "nodeType": "type-1768350738452"
    }
  },
  "node-1768351504828": {
    "id": "node-1768351504828",
    "parentId": "node-1768351455282",
    "type": "DATA",
    "label": "맞품제작 및 시공",
    "isExpanded": true,
    "childrenIds": [],
    "attributes": {
      "nodeType": "type-1768350738452"
    }
  },
  "node-1768351526175": {
    "id": "node-1768351526175",
    "parentId": "node-1768351455282",
    "type": "DATA",
    "label": "시공",
    "isExpanded": true,
    "childrenIds": [],
    "attributes": {
      "nodeType": "type-1768350738452"
    }
  },
  "node-1768351532534": {
    "id": "node-1768351532534",
    "parentId": "node-1768351455282",
    "type": "DATA",
    "label": "수리",
    "isExpanded": true,
    "childrenIds": [],
    "attributes": {
      "nodeType": "type-1768350738452"
    }
  },
  "node-1768351537877": {
    "id": "node-1768351537877",
    "parentId": "node-1768351455282",
    "type": "DATA",
    "label": "기타",
    "isExpanded": true,
    "childrenIds": [],
    "attributes": {
      "nodeType": "type-1768350738452"
    }
  },
  "node-1768351677980": {
    "id": "node-1768351677980",
    "parentId": "root-1768350652484",
    "type": "DATA",
    "label": "지역선택",
    "isExpanded": true,
    "childrenIds": [],
    "attributes": {
      "nodeType": "option"
    }
  },
  "node-1768351821713": {
    "id": "node-1768351821713",
    "parentId": "root-1768350652484",
    "type": "DATA",
    "label": "고객연락처",
    "isExpanded": true,
    "childrenIds": [
      "node-1768351833799",
      "node-1768351844767",
      "node-1768351853808"
    ],
    "attributes": {
      "nodeType": "option"
    }
  },
  "node-1768351833799": {
    "id": "node-1768351833799",
    "parentId": "node-1768351821713",
    "type": "DATA",
    "label": "성함",
    "isExpanded": true,
    "childrenIds": [],
    "attributes": {
      "nodeType": "type-1768350738452"
    }
  },
  "node-1768351844767": {
    "id": "node-1768351844767",
    "parentId": "node-1768351821713",
    "type": "DATA",
    "label": "지역",
    "isExpanded": true,
    "childrenIds": [],
    "attributes": {
      "nodeType": "type-1768350738452"
    }
  },
  "node-1768351853808": {
    "id": "node-1768351853808",
    "parentId": "node-1768351821713",
    "type": "DATA",
    "label": "연락번호",
    "isExpanded": true,
    "childrenIds": [],
    "attributes": {
      "nodeType": "type-1768350738452"
    }
  },
  "node-1768351982172": {
    "id": "node-1768351982172",
    "parentId": "root-1768350630954",
    "type": "DATA",
    "label": "원단종류선택",
    "isExpanded": true,
    "childrenIds": [],
    "attributes": {
      "nodeType": "option"
    }
  },
  "node-1768352000850": {
    "id": "node-1768352000850",
    "parentId": "root-1768350630954",
    "type": "DATA",
    "label": "원단사이즈",
    "isExpanded": true,
    "childrenIds": [],
    "attributes": {
      "nodeType": "option"
    }
  },
  "node-1768352021870": {
    "id": "node-1768352021870",
    "parentId": "root-1768350630954",
    "type": "DATA",
    "label": "고객연락처",
    "isExpanded": true,
    "childrenIds": [],
    "attributes": {
      "nodeType": "option"
    }
  },
  "node-1768352207184": {
    "id": "node-1768352207184",
    "parentId": "prod-roll-basic",
    "type": "DATA",
    "label": "시드니",
    "isExpanded": true,
    "childrenIds": [
      "node-1768352277588",
      "node-1768352282732",
      "node-1768352287106",
      "node-1768352291033"
    ],
    "attributes": {
      "nodeType": "product"
    }
  },
  "node-1768352223137": {
    "id": "node-1768352223137",
    "parentId": "prod-roll-basic",
    "type": "DATA",
    "label": "방콕",
    "isExpanded": true,
    "childrenIds": [
      "node-1768352296168",
      "node-1768352301617",
      "node-1768352307504",
      "node-1768352312130"
    ],
    "attributes": {
      "nodeType": "product"
    }
  },
  "node-1768352228611": {
    "id": "node-1768352228611",
    "parentId": "prod-roll-basic",
    "type": "DATA",
    "label": "파리",
    "isExpanded": true,
    "childrenIds": [
      "node-1768352383651",
      "node-1768352387624",
      "node-1768352392418",
      "node-1768352399390"
    ],
    "attributes": {
      "nodeType": "product"
    }
  },
  "node-1768352236871": {
    "id": "node-1768352236871",
    "parentId": "prod-roll-basic",
    "type": "DATA",
    "label": "런던",
    "isExpanded": true,
    "childrenIds": [
      "node-1768352407462",
      "node-1768352412274",
      "node-1768352415251",
      "node-1768352418436"
    ],
    "attributes": {
      "nodeType": "product"
    }
  },
  "node-1768352243377": {
    "id": "node-1768352243377",
    "parentId": "prod-roll-blackout",
    "type": "DATA",
    "label": "홍콩",
    "isExpanded": true,
    "childrenIds": [
      "node-1768352425910",
      "node-1768352431033",
      "node-1768352434022"
    ],
    "attributes": {
      "nodeType": "product"
    }
  },
  "node-1768352247189": {
    "id": "node-1768352247189",
    "parentId": "prod-roll-blackout",
    "type": "DATA",
    "label": "두바이",
    "isExpanded": true,
    "childrenIds": [
      "node-1768352437811",
      "node-1768352441212",
      "node-1768352445924",
      "node-1768352448934"
    ],
    "attributes": {
      "nodeType": "product"
    }
  },
  "node-1768352262610": {
    "id": "node-1768352262610",
    "parentId": "prod-roll-blackout",
    "type": "DATA",
    "label": "바르셀로나",
    "isExpanded": true,
    "childrenIds": [
      "node-1768352452647",
      "node-1768352457895",
      "node-1768352461122"
    ],
    "attributes": {
      "nodeType": "product"
    }
  },
  "node-1768352277588": {
    "id": "node-1768352277588",
    "parentId": "node-1768352207184",
    "type": "DATA",
    "label": "아이보리",
    "isExpanded": true,
    "childrenIds": [],
    "attributes": {
      "nodeType": "color"
    }
  },
  "node-1768352282732": {
    "id": "node-1768352282732",
    "parentId": "node-1768352207184",
    "type": "DATA",
    "label": "버건디",
    "isExpanded": true,
    "childrenIds": [],
    "attributes": {
      "nodeType": "color"
    }
  },
  "node-1768352287106": {
    "id": "node-1768352287106",
    "parentId": "node-1768352207184",
    "type": "DATA",
    "label": "라벤더",
    "isExpanded": true,
    "childrenIds": [],
    "attributes": {
      "nodeType": "color"
    }
  },
  "node-1768352291033": {
    "id": "node-1768352291033",
    "parentId": "node-1768352207184",
    "type": "DATA",
    "label": "베이지",
    "isExpanded": true,
    "childrenIds": [],
    "attributes": {
      "nodeType": "color"
    }
  },
  "node-1768352296168": {
    "id": "node-1768352296168",
    "parentId": "node-1768352223137",
    "type": "DATA",
    "label": "차콜",
    "isExpanded": true,
    "childrenIds": [],
    "attributes": {
      "nodeType": "color"
    }
  },
  "node-1768352301617": {
    "id": "node-1768352301617",
    "parentId": "node-1768352223137",
    "type": "DATA",
    "label": "버건디",
    "isExpanded": true,
    "childrenIds": [],
    "attributes": {
      "nodeType": "color"
    }
  },
  "node-1768352307504": {
    "id": "node-1768352307504",
    "parentId": "node-1768352223137",
    "type": "DATA",
    "label": "민트",
    "isExpanded": true,
    "childrenIds": [],
    "attributes": {
      "nodeType": "color"
    }
  },
  "node-1768352312130": {
    "id": "node-1768352312130",
    "parentId": "node-1768352223137",
    "type": "DATA",
    "label": "스카이블루",
    "isExpanded": true,
    "childrenIds": [],
    "attributes": {
      "nodeType": "color"
    }
  },
  "node-1768352383651": {
    "id": "node-1768352383651",
    "parentId": "node-1768352228611",
    "type": "DATA",
    "label": "아이보리",
    "isExpanded": true,
    "childrenIds": [],
    "attributes": {
      "nodeType": "color"
    }
  },
  "node-1768352387624": {
    "id": "node-1768352387624",
    "parentId": "node-1768352228611",
    "type": "DATA",
    "label": "라벤더",
    "isExpanded": true,
    "childrenIds": [],
    "attributes": {
      "nodeType": "color"
    }
  },
  "node-1768352392418": {
    "id": "node-1768352392418",
    "parentId": "node-1768352228611",
    "type": "DATA",
    "label": "브라운",
    "isExpanded": true,
    "childrenIds": [],
    "attributes": {
      "nodeType": "color"
    }
  },
  "node-1768352399390": {
    "id": "node-1768352399390",
    "parentId": "node-1768352228611",
    "type": "DATA",
    "label": "라벤더",
    "isExpanded": true,
    "childrenIds": [],
    "attributes": {
      "nodeType": "color"
    }
  },
  "node-1768352407462": {
    "id": "node-1768352407462",
    "parentId": "node-1768352236871",
    "type": "DATA",
    "label": "피치",
    "isExpanded": true,
    "childrenIds": [],
    "attributes": {
      "nodeType": "color"
    }
  },
  "node-1768352412274": {
    "id": "node-1768352412274",
    "parentId": "node-1768352236871",
    "type": "DATA",
    "label": "화이트",
    "isExpanded": true,
    "childrenIds": [],
    "attributes": {
      "nodeType": "color"
    }
  },
  "node-1768352415251": {
    "id": "node-1768352415251",
    "parentId": "node-1768352236871",
    "type": "DATA",
    "label": "그레이",
    "isExpanded": true,
    "childrenIds": [],
    "attributes": {
      "nodeType": "color"
    }
  },
  "node-1768352418436": {
    "id": "node-1768352418436",
    "parentId": "node-1768352236871",
    "type": "DATA",
    "label": "민트",
    "isExpanded": true,
    "childrenIds": [],
    "attributes": {
      "nodeType": "color"
    }
  },
  "node-1768352425910": {
    "id": "node-1768352425910",
    "parentId": "node-1768352243377",
    "type": "DATA",
    "label": "버건디",
    "isExpanded": true,
    "childrenIds": [],
    "attributes": {
      "nodeType": "color"
    }
  },
  "node-1768352431033": {
    "id": "node-1768352431033",
    "parentId": "node-1768352243377",
    "type": "DATA",
    "label": "차콜",
    "isExpanded": true,
    "childrenIds": [],
    "attributes": {
      "nodeType": "color"
    }
  },
  "node-1768352434022": {
    "id": "node-1768352434022",
    "parentId": "node-1768352243377",
    "type": "DATA",
    "label": "베이지",
    "isExpanded": true,
    "childrenIds": [],
    "attributes": {
      "nodeType": "color"
    }
  },
  "node-1768352437811": {
    "id": "node-1768352437811",
    "parentId": "node-1768352247189",
    "type": "DATA",
    "label": "피치",
    "isExpanded": true,
    "childrenIds": [],
    "attributes": {
      "nodeType": "color"
    }
  },
  "node-1768352441212": {
    "id": "node-1768352441212",
    "parentId": "node-1768352247189",
    "type": "DATA",
    "label": "화이트",
    "isExpanded": true,
    "childrenIds": [],
    "attributes": {
      "nodeType": "color"
    }
  },
  "node-1768352445924": {
    "id": "node-1768352445924",
    "parentId": "node-1768352247189",
    "type": "DATA",
    "label": "브라운",
    "isExpanded": true,
    "childrenIds": [],
    "attributes": {
      "nodeType": "color"
    }
  },
  "node-1768352448934": {
    "id": "node-1768352448934",
    "parentId": "node-1768352247189",
    "type": "DATA",
    "label": "브라운",
    "isExpanded": true,
    "childrenIds": [],
    "attributes": {
      "nodeType": "color"
    }
  },
  "node-1768352452647": {
    "id": "node-1768352452647",
    "parentId": "node-1768352262610",
    "type": "DATA",
    "label": "브라운",
    "isExpanded": true,
    "childrenIds": [],
    "attributes": {
      "nodeType": "color"
    }
  },
  "node-1768352457895": {
    "id": "node-1768352457895",
    "parentId": "node-1768352262610",
    "type": "DATA",
    "label": "블랙",
    "isExpanded": true,
    "childrenIds": [],
    "attributes": {
      "nodeType": "color"
    }
  },
  "node-1768352461122": {
    "id": "node-1768352461122",
    "parentId": "node-1768352262610",
    "type": "DATA",
    "label": "차콜",
    "isExpanded": true,
    "childrenIds": [],
    "attributes": {
      "nodeType": "color"
    }
  },
  "node-1768352478788": {
    "id": "node-1768352478788",
    "parentId": "sub-combi",
    "type": "DATA",
    "label": "암막콤비",
    "isExpanded": true,
    "childrenIds": [
      "node-1768352591046",
      "node-1768352598781",
      "node-1768352603519"
    ],
    "attributes": {
      "nodeType": "category",
      "spec_cards": SAMPLE_COMBI_BLACKOUT_SPECS,
      "style_cards": SAMPLE_COMBI_STYLES
    }
  },
  "node-1768352517295": {
    "id": "node-1768352517295",
    "parentId": "prod-combi-basic",
    "type": "DATA",
    "label": "스핑크스",
    "isExpanded": true,
    "childrenIds": [
      "node-1768354591463",
      "node-1768354597052",
      "node-1768354603629"
    ],
    "attributes": {
      "nodeType": "product"
    }
  },
  "node-1768352551607": {
    "id": "node-1768352551607",
    "parentId": "prod-combi-basic",
    "type": "DATA",
    "label": "오피루스",
    "isExpanded": true,
    "childrenIds": [
      "node-1768354612322",
      "node-1768354618791",
      "node-1768354637984",
      "node-1768354640941",
      "node-1768354644606"
    ],
    "attributes": {
      "nodeType": "product"
    }
  },
  "node-1768352563937": {
    "id": "node-1768352563937",
    "parentId": "prod-combi-basic",
    "type": "DATA",
    "label": "엘사",
    "isExpanded": true,
    "childrenIds": [
      "node-1768354649024",
      "node-1768354652451"
    ],
    "attributes": {
      "nodeType": "product"
    }
  },
  "node-1768352573545": {
    "id": "node-1768352573545",
    "parentId": "prod-combi-basic",
    "type": "DATA",
    "label": "루돌프",
    "isExpanded": true,
    "childrenIds": [
      "node-1768354655969",
      "node-1768354659242",
      "node-1768354662696",
      "node-1768354665266"
    ],
    "attributes": {
      "nodeType": "product"
    }
  },
  "node-1768352591046": {
    "id": "node-1768352591046",
    "parentId": "node-1768352478788",
    "type": "DATA",
    "label": "아침정원",
    "isExpanded": true,
    "childrenIds": [
      "node-1768354673024",
      "node-1768354676821",
      "node-1768354679413",
      "node-1768354683256"
    ],
    "attributes": {
      "nodeType": "product"
    }
  },
  "node-1768352598781": {
    "id": "node-1768352598781",
    "parentId": "node-1768352478788",
    "type": "DATA",
    "label": "베를린",
    "isExpanded": true,
    "childrenIds": [
      "node-1768354687042",
      "node-1768354690573",
      "node-1768354695083"
    ],
    "attributes": {
      "nodeType": "product"
    }
  },
  "node-1768352603519": {
    "id": "node-1768352603519",
    "parentId": "node-1768352478788",
    "type": "DATA",
    "label": "로마",
    "isExpanded": true,
    "childrenIds": [
      "node-1768354698645",
      "node-1768354702008",
      "node-1768354704697"
    ],
    "attributes": {
      "nodeType": "product"
    }
  },
  "node-1768352618881": {
    "id": "node-1768352618881",
    "parentId": "sub-honeycomb",
    "type": "CATEGORY",
    "label": "일반",
    "isExpanded": true,
    "childrenIds": [
      "node-1768352648840",
      "node-1768352664017"
    ],
    "attributes": {
      "nodeType": "category"
    }
  },
  "node-1768352627267": {
    "id": "node-1768352627267",
    "parentId": "sub-honeycomb",
    "type": "CATEGORY",
    "label": "암막",
    "isExpanded": true,
    "childrenIds": [
      "node-1768352689316",
      "node-1768352697101"
    ],
    "attributes": {
      "nodeType": "category"
    }
  },
  "node-1768352648840": {
    "id": "node-1768352648840",
    "parentId": "node-1768352618881",
    "type": "CATEGORY",
    "label": "45mm",
    "isExpanded": true,
    "childrenIds": [
      "node-1768354711226",
      "node-1768354714316",
      "node-1768354716900",
      "node-1768354721481"
    ],
    "attributes": {
      "nodeType": "product"
    }
  },
  "node-1768352664017": {
    "id": "node-1768352664017",
    "parentId": "node-1768352618881",
    "type": "CATEGORY",
    "label": "66mm",
    "isExpanded": true,
    "childrenIds": [
      "node-1768354726524",
      "node-1768354730382",
      "node-1768354733521",
      "node-1768354736618"
    ],
    "attributes": {
      "nodeType": "product"
    }
  },
  "node-1768352689316": {
    "id": "node-1768352689316",
    "parentId": "node-1768352627267",
    "type": "CATEGORY",
    "label": "45mm",
    "isExpanded": true,
    "childrenIds": [
      "node-1768354742027",
      "node-1768354745762",
      "node-1768354748935"
    ],
    "attributes": {
      "nodeType": "product"
    }
  },
  "node-1768352697101": {
    "id": "node-1768352697101",
    "parentId": "node-1768352627267",
    "type": "DATA",
    "label": "66mm",
    "isExpanded": true,
    "childrenIds": [
      "node-1768354752483",
      "node-1768354755233",
      "node-1768354758172",
      "node-1768354761553"
    ],
    "attributes": {
      "nodeType": "product"
    }
  },
  "node-1768353306988": {
    "id": "node-1768353306988",
    "parentId": "prod-bamboo",
    "type": "DATA",
    "label": "블랙",
    "isExpanded": true,
    "childrenIds": [],
    "attributes": {
      "nodeType": "color"
    }
  },
  "node-1768353314350": {
    "id": "node-1768353314350",
    "parentId": "prod-bamboo",
    "type": "DATA",
    "label": "브라운",
    "isExpanded": true,
    "childrenIds": [],
    "attributes": {
      "nodeType": "color"
    }
  },
  "node-1768353321484": {
    "id": "node-1768353321484",
    "parentId": "prod-bamboo",
    "type": "DATA",
    "label": "아이보리",
    "isExpanded": true,
    "childrenIds": [],
    "attributes": {
      "nodeType": "color"
    }
  },
  "node-1768353369893": {
    "id": "node-1768353369893",
    "parentId": "prod-bamboo",
    "type": "DATA",
    "label": "네이비",
    "isExpanded": true,
    "childrenIds": [],
    "attributes": {
      "nodeType": "color"
    }
  },
  "node-sys-curtain": {
    "id": "node-sys-curtain",
    "parentId": "root-1769907476320",
    "type": "CATEGORY",
    "label": "커튼",
    "isExpanded": true,
    "childrenIds": ["node-sys-curtain-std", "node-sys-curtain-premium"],
    "attributes": { "nodeType": "category" }
  },
  "node-sys-curtain-std": {
    "id": "node-sys-curtain-std",
    "parentId": "node-sys-curtain",
    "type": "DATA",
    "label": "표준 가공비",
    "isExpanded": false,
    "childrenIds": [],
    "attributes": { "nodeType": "item" }
  },
  "node-sys-curtain-premium": {
    "id": "node-sys-curtain-premium",
    "parentId": "node-sys-curtain",
    "type": "DATA",
    "label": "수입 가공비",
    "isExpanded": false,
    "childrenIds": [],
    "attributes": { "nodeType": "item" }
  },
  "node-sys-curtain-hosp": {
    "id": "node-sys-curtain-hosp",
    "parentId": "root-1769907476320",
    "type": "CATEGORY",
    "label": "병원커튼",
    "isExpanded": true,
    "childrenIds": ["node-sys-hosp-mesh", "node-sys-hosp-standard"],
    "attributes": { "nodeType": "category" }
  },
  "node-sys-hosp-mesh": {
    "id": "node-sys-hosp-mesh",
    "parentId": "node-sys-curtain-hosp",
    "type": "DATA",
    "label": "상부 망사 가공비",
    "isExpanded": false,
    "childrenIds": [],
    "attributes": { "nodeType": "item" }
  },
  "node-sys-hosp-standard": {
    "id": "node-sys-hosp-standard",
    "parentId": "node-sys-curtain-hosp",
    "type": "DATA",
    "label": "병원용 표준 가공비",
    "isExpanded": false,
    "childrenIds": [],
    "attributes": { "nodeType": "item" }
  }
};
