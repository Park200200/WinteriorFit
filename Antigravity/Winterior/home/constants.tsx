
import {
  Store, ShoppingCart, Shirt, Ruler, MessageCircle, Moon, LogIn, LogOut,
  User, ListOrdered, CreditCard, MapPin, HelpCircle, LayoutDashboard,
  DollarSign, Search, Users, Calendar, Monitor, UserCog, Building,
  Truck, Package, ClipboardList, Boxes, FileText, Factory, Settings,
  BarChart3, Palette, BookOpen, LayoutTemplate, Tag, Bell, Sliders, Scroll,
  Sparkles, Image, CheckCircle2, Camera, Link2
} from 'lucide-react';
import { MenuItem, UserRole, PartnerData, PartnerType } from './types';

// Role Definitions
export const ROLE_CONFIGS: Record<UserRole, { label: string; description: string; color: string }> = {
  [UserRole.GUEST]: { label: '홍보사이트', description: '로그인 전', color: 'bg-gray-500' },
  [UserRole.USER]: { label: '로그인유저', description: '일반 고객', color: 'bg-blue-500' },
  [UserRole.AGENCY]: { label: '가맹대리점', description: '가맹점 관리', color: 'bg-green-600' },
  [UserRole.DISTRIBUTOR]: { label: '유통관리사', description: '물류/유통', color: 'bg-orange-500' },
  [UserRole.MANUFACTURER]: { label: '제조공급사', description: '생산 관리', color: 'bg-purple-600' },
  [UserRole.FABRIC_SUPPLIER]: { label: '원단공급사', description: '자재/재고', color: 'bg-teal-600' },
  [UserRole.ADMIN]: { label: '총괄관리사', description: '시스템 총괄', color: 'bg-red-600' },
};

// SVG Helper: 투명 배경 inline SVG를 data URI로 변환
const svgToDataUri = (svg: string) => `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svg)))}`;

// --- 투명 배경 실사 샘플 SVG 이미지 ---
const SAMPLE_SVGS = {
  monstera: svgToDataUri(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" fill="none">
    <g opacity="0.9">
      <path d="M200 380 C200 380 120 300 100 220 C80 140 130 60 200 40 C270 60 320 140 300 220 C280 300 200 380 200 380Z" fill="#2D8B4E" stroke="#1a6b38" stroke-width="2"/>
      <path d="M200 40 L200 380" stroke="#1a6b38" stroke-width="3"/>
      <path d="M200 100 L140 140" stroke="#1a6b38" stroke-width="2"/>
      <path d="M200 160 L130 200" stroke="#1a6b38" stroke-width="2"/>
      <path d="M200 220 L140 260" stroke="#1a6b38" stroke-width="2"/>
      <path d="M200 100 L260 140" stroke="#1a6b38" stroke-width="2"/>
      <path d="M200 160 L270 200" stroke="#1a6b38" stroke-width="2"/>
      <path d="M200 220 L260 260" stroke="#1a6b38" stroke-width="2"/>
      <ellipse cx="160" cy="120" rx="25" ry="35" fill="none" stroke="#1a6b38" stroke-width="1.5" transform="rotate(-30 160 120)"/>
      <ellipse cx="240" cy="120" rx="25" ry="35" fill="none" stroke="#1a6b38" stroke-width="1.5" transform="rotate(30 240 120)"/>
      <ellipse cx="150" cy="190" rx="20" ry="30" fill="none" stroke="#1a6b38" stroke-width="1.5" transform="rotate(-20 150 190)"/>
      <ellipse cx="250" cy="190" rx="20" ry="30" fill="none" stroke="#1a6b38" stroke-width="1.5" transform="rotate(20 250 190)"/>
    </g>
  </svg>`),

  cherry_blossom: svgToDataUri(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" fill="none">
    <g>
      <path d="M60 380 Q80 300 100 250 Q130 180 160 150 Q180 130 200 110 Q220 90 250 80 Q280 70 310 65" stroke="#8B6F47" stroke-width="4" fill="none" stroke-linecap="round"/>
      <path d="M160 150 Q140 120 120 100" stroke="#8B6F47" stroke-width="3" fill="none" stroke-linecap="round"/>
      <path d="M250 80 Q270 50 290 30" stroke="#8B6F47" stroke-width="3" fill="none" stroke-linecap="round"/>
      ${[{ x: 120, y: 95 }, { x: 200, y: 105 }, { x: 260, y: 72 }, { x: 295, y: 28 }, { x: 310, y: 60 }, { x: 170, y: 140 }, { x: 140, y: 170 }, { x: 100, y: 240 }, { x: 240, y: 95 }, { x: 330, y: 50 }].map(p =>
    `<g transform="translate(${p.x},${p.y})">
          <circle r="12" fill="#FFB7C5" opacity="0.9"/>
          <circle r="8" fill="#FFC8D6" opacity="0.8"/>
          <circle r="3" fill="#FFE0E8"/>
          <circle r="1.5" fill="#CC8899"/>
        </g>`
  ).join('')}
    </g>
  </svg>`),

  geometric: svgToDataUri(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" fill="none">
    <defs>
      <linearGradient id="g1" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#4F46E5"/><stop offset="100%" stop-color="#7C3AED"/></linearGradient>
      <linearGradient id="g2" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#06B6D4"/><stop offset="100%" stop-color="#3B82F6"/></linearGradient>
    </defs>
    <polygon points="200,40 350,130 350,310 200,400 50,310 50,130" stroke="url(#g1)" stroke-width="3" fill="none"/>
    <polygon points="200,80 320,150 320,290 200,360 80,290 80,150" stroke="url(#g2)" stroke-width="2" fill="none"/>
    <polygon points="200,120 290,170 290,270 200,320 110,270 110,170" stroke="url(#g1)" stroke-width="2" fill="url(#g1)" fill-opacity="0.08"/>
    <circle cx="200" cy="200" r="50" stroke="url(#g2)" stroke-width="2" fill="url(#g2)" fill-opacity="0.1"/>
    <circle cx="200" cy="200" r="25" stroke="url(#g1)" stroke-width="2" fill="url(#g1)" fill-opacity="0.15"/>
    <line x1="200" y1="40" x2="200" y2="400" stroke="url(#g1)" stroke-width="0.5" opacity="0.3"/>
    <line x1="50" y1="220" x2="350" y2="220" stroke="url(#g2)" stroke-width="0.5" opacity="0.3"/>
  </svg>`),

  cloud_pattern: svgToDataUri(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" fill="none">
    <g opacity="0.85">
      <g transform="translate(80,120)">
        <circle cx="0" cy="0" r="40" fill="#E0E7FF"/><circle cx="35" cy="-10" r="35" fill="#C7D2FE"/>
        <circle cx="65" cy="0" r="45" fill="#DDD6FE"/><circle cx="30" cy="10" r="35" fill="#E0E7FF"/>
      </g>
      <g transform="translate(240,80)">
        <circle cx="0" cy="0" r="30" fill="#DBEAFE"/><circle cx="28" cy="-8" r="28" fill="#BFDBFE"/>
        <circle cx="50" cy="0" r="35" fill="#E0E7FF"/><circle cx="24" cy="8" r="28" fill="#DBEAFE"/>
      </g>
      <g transform="translate(150,250)">
        <circle cx="0" cy="0" r="50" fill="#E8DAEF"/><circle cx="45" cy="-12" r="42" fill="#D5C6E0"/>
        <circle cx="85" cy="0" r="55" fill="#E0D4F5"/><circle cx="40" cy="14" r="42" fill="#E8DAEF"/>
      </g>
      <g transform="translate(300,220)">
        <circle cx="0" cy="0" r="25" fill="#FCE7F3"/><circle cx="22" cy="-6" r="22" fill="#FBCFE8"/>
        <circle cx="40" cy="0" r="28" fill="#FCE7F3"/><circle cx="18" cy="6" r="22" fill="#FECDD3"/>
      </g>
    </g>
  </svg>`),

  stars: svgToDataUri(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" fill="none">
    ${[{ x: 70, y: 60, s: 1.2, c: '#FFD700' }, { x: 200, y: 40, s: 1.5, c: '#FFA500' }, { x: 320, y: 80, s: 1, c: '#FFD700' },
    { x: 50, y: 180, s: 0.8, c: '#FFEC8B' }, { x: 150, y: 150, s: 1.3, c: '#FFA500' }, { x: 280, y: 160, s: 0.9, c: '#FFD700' },
    { x: 350, y: 200, s: 1.1, c: '#FFEC8B' }, { x: 100, y: 280, s: 1.4, c: '#FFD700' }, { x: 230, y: 260, s: 1, c: '#FFA500' },
    { x: 330, y: 300, s: 0.7, c: '#FFEC8B' }, { x: 180, y: 340, s: 1.2, c: '#FFD700' }, { x: 60, y: 350, s: 0.6, c: '#FFA500' }
    ].map(s =>
      `<g transform="translate(${s.x},${s.y}) scale(${s.s})">
        <polygon points="0,-20 5,-7 19,-7 8,3 12,17 0,9 -12,17 -8,3 -19,-7 -5,-7" fill="${s.c}" opacity="0.9"/>
      </g>`
    ).join('')}
  </svg>`),

  bamboo: svgToDataUri(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" fill="none">
    <g>
      <rect x="85" y="20" width="16" height="370" rx="8" fill="#6B8E23" opacity="0.85"/>
      <rect x="85" y="80" width="16" height="4" rx="2" fill="#4A6B12"/>
      <rect x="85" y="160" width="16" height="4" rx="2" fill="#4A6B12"/>
      <rect x="85" y="250" width="16" height="4" rx="2" fill="#4A6B12"/>
      <rect x="85" y="330" width="16" height="4" rx="2" fill="#4A6B12"/>
      <rect x="195" y="40" width="14" height="350" rx="7" fill="#7BA428" opacity="0.8"/>
      <rect x="195" y="110" width="14" height="4" rx="2" fill="#5A8318"/>
      <rect x="195" y="200" width="14" height="4" rx="2" fill="#5A8318"/>
      <rect x="195" y="290" width="14" height="4" rx="2" fill="#5A8318"/>
      <rect x="295" y="10" width="12" height="380" rx="6" fill="#8FBC3E" opacity="0.75"/>
      <rect x="295" y="70" width="12" height="3" rx="1.5" fill="#6B9B22"/>
      <rect x="295" y="150" width="12" height="3" rx="1.5" fill="#6B9B22"/>
      <rect x="295" y="240" width="12" height="3" rx="1.5" fill="#6B9B22"/>
      <rect x="295" y="320" width="12" height="3" rx="1.5" fill="#6B9B22"/>
      <path d="M101 80 Q130 55 155 70" stroke="#6B8E23" stroke-width="1.5" fill="none"/>
      <ellipse cx="155" cy="65" rx="30" ry="12" fill="#6B8E23" opacity="0.4" transform="rotate(-15 155 65)"/>
      <path d="M85 160 Q55 140 30 150" stroke="#6B8E23" stroke-width="1.5" fill="none"/>
      <ellipse cx="30" cy="145" rx="28" ry="10" fill="#7BA428" opacity="0.4" transform="rotate(10 30 145)"/>
      <path d="M209 110 Q240 85 265 100" stroke="#7BA428" stroke-width="1.5" fill="none"/>
      <ellipse cx="265" cy="95" rx="25" ry="10" fill="#7BA428" opacity="0.35" transform="rotate(-10 265 95)"/>
      <path d="M195 200 Q165 175 140 190" stroke="#7BA428" stroke-width="1.5" fill="none"/>
      <ellipse cx="140" cy="185" rx="25" ry="10" fill="#8FBC3E" opacity="0.35" transform="rotate(10 140 185)"/>
      <path d="M307 70 Q335 45 360 60" stroke="#8FBC3E" stroke-width="1.5" fill="none"/>
      <ellipse cx="360" cy="55" rx="22" ry="9" fill="#8FBC3E" opacity="0.3" transform="rotate(-10 360 55)"/>
    </g>
  </svg>`),

  butterfly: svgToDataUri(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" fill="none">
    <g transform="translate(200,200)">
      <g opacity="0.9">
        <path d="M0,0 C-30,-50 -100,-80 -120,-30 C-140,20 -80,60 -40,40 C-20,30 -5,15 0,0Z" fill="#E879A8" stroke="#D45F8C" stroke-width="1.5"/>
        <path d="M0,0 C30,-50 100,-80 120,-30 C140,20 80,60 40,40 C20,30 5,15 0,0Z" fill="#E879A8" stroke="#D45F8C" stroke-width="1.5"/>
        <path d="M0,0 C-20,30 -70,70 -80,40 C-90,10 -50,-10 -25,10 C-10,20 -3,12 0,0Z" fill="#F0A4C4" stroke="#D45F8C" stroke-width="1"/>
        <path d="M0,0 C20,30 70,70 80,40 C90,10 50,-10 25,10 C10,20 3,12 0,0Z" fill="#F0A4C4" stroke="#D45F8C" stroke-width="1"/>
        <circle cx="-80" cy="-40" r="12" fill="#F8D7E8" opacity="0.7"/>
        <circle cx="80" cy="-40" r="12" fill="#F8D7E8" opacity="0.7"/>
        <circle cx="-55" cy="-20" r="8" fill="#F0C8DC" opacity="0.6"/>
        <circle cx="55" cy="-20" r="8" fill="#F0C8DC" opacity="0.6"/>
        <line x1="0" y1="-10" x2="0" y2="80" stroke="#8B4F6F" stroke-width="2.5" stroke-linecap="round"/>
        <path d="M0,-10 Q-15,-35 -20,-50" stroke="#8B4F6F" stroke-width="1.5" fill="none" stroke-linecap="round"/>
        <path d="M0,-10 Q15,-35 20,-50" stroke="#8B4F6F" stroke-width="1.5" fill="none" stroke-linecap="round"/>
        <circle cx="-20" cy="-50" r="3" fill="#8B4F6F"/>
        <circle cx="20" cy="-50" r="3" fill="#8B4F6F"/>
      </g>
    </g>
  </svg>`),

  mountain: svgToDataUri(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" fill="none">
    <g opacity="0.9">
      <polygon points="200,60 350,320 50,320" fill="#5B7F95" opacity="0.8"/>
      <polygon points="200,60 280,200 120,200" fill="#7BA3BC" opacity="0.5"/>
      <polygon points="200,60 240,130 160,130" fill="white" opacity="0.7"/>
      <polygon points="120,140 250,320 0,320" fill="#4A6B7D" opacity="0.6"/>
      <polygon points="310,180 400,320 220,320" fill="#6B9AAF" opacity="0.5"/>
      <circle cx="320" cy="70" r="30" fill="#FFD93D" opacity="0.8"/>
      <circle cx="320" cy="70" r="22" fill="#FFE066" opacity="0.6"/>
      <path d="M50,340 Q100,325 150,335 Q200,345 250,330 Q300,315 350,340 L350,400 L50,400Z" fill="#3D8B37" opacity="0.7"/>
      <path d="M0,355 Q60,340 120,350 Q180,360 240,345 Q300,330 400,360 L400,400 L0,400Z" fill="#2D6B27" opacity="0.6"/>
    </g>
  </svg>`)
};

// Mock Data for Measure Images (Shared) - 투명 배경 블라인드 프린팅용 샘플 이미지
export const MOCK_MEASURE_IMAGES = [
  { id: 1, tags: ['몬스테라', '식물', '투명배경', '누끼', 'PNG'], fileType: 'png', size: '400x400', updatedAt: '2024-12-01', imageUrl: SAMPLE_SVGS.monstera },
  { id: 2, tags: ['벚꽃', '봄', '꽃나무', '투명배경', '누끼'], fileType: 'png', size: '400x400', updatedAt: '2024-12-01', imageUrl: SAMPLE_SVGS.cherry_blossom },
  { id: 3, tags: ['기하학', '헥사곤', '모던', '투명배경', '패턴'], fileType: 'png', size: '400x400', updatedAt: '2024-12-01', imageUrl: SAMPLE_SVGS.geometric },
  { id: 4, tags: ['구름', '파스텔', '몽환', '투명배경', '누끼'], fileType: 'png', size: '400x400', updatedAt: '2024-12-01', imageUrl: SAMPLE_SVGS.cloud_pattern },
  { id: 5, tags: ['별', '골드', '야간', '투명배경', '누끼'], fileType: 'png', size: '400x400', updatedAt: '2024-12-01', imageUrl: SAMPLE_SVGS.stars },
  { id: 6, tags: ['대나무', '동양', '자연', '투명배경', '누끼'], fileType: 'png', size: '400x400', updatedAt: '2024-12-01', imageUrl: SAMPLE_SVGS.bamboo },
  { id: 7, tags: ['나비', '핑크', '캐릭터', '투명배경', '누끼'], fileType: 'png', size: '400x400', updatedAt: '2024-12-01', imageUrl: SAMPLE_SVGS.butterfly },
  { id: 8, tags: ['산', '풍경', '자연', '투명배경', '누끼'], fileType: 'png', size: '400x400', updatedAt: '2024-12-01', imageUrl: SAMPLE_SVGS.mountain },
];

// Mock Data for Space Images - 50 Interior Scenes with Prominent Windows
export const MOCK_SPACE_IMAGES = [
  // --- Theme: Living Room (1-15) ---
  { id: 101, tags: ['거실', '화이트', '모던', '통창'], fileType: 'jpg', size: '1920x1080', updatedAt: '2024-05-20', imageUrl: 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1000&q=80' },
  { id: 102, tags: ['거실', '우드', '내추럴', '베란다'], fileType: 'jpg', size: '1920x1080', updatedAt: '2024-05-19', imageUrl: 'https://images.unsplash.com/photo-1616486338812-3dadae4b4f9d?auto=format&fit=crop&w=1000&q=80' },
  { id: 103, tags: ['거실', '그레이', '심플', '아파트'], fileType: 'jpg', size: '1920x1080', updatedAt: '2024-05-18', imageUrl: 'https://images.unsplash.com/photo-1567016432779-094069958ea5?auto=format&fit=crop&w=1000&q=80' },
  { id: 104, tags: ['거실', '북유럽', '식물', '채광'], fileType: 'jpg', size: '1920x1080', updatedAt: '2024-05-17', imageUrl: 'https://images.unsplash.com/photo-1583847268964-b28dc8f51f92?auto=format&fit=crop&w=1000&q=80' },
  { id: 105, tags: ['거실', '럭셔리', '대리석', '전망'], fileType: 'jpg', size: '1920x1080', updatedAt: '2024-05-16', imageUrl: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1000&q=80' },
  { id: 106, tags: ['거실', '미니멀', '화이트', '커튼박스'], fileType: 'jpg', size: '1920x1080', updatedAt: '2024-05-15', imageUrl: 'https://images.unsplash.com/photo-1598928506311-c55ded91a20c?auto=format&fit=crop&w=1000&q=80' },
  { id: 107, tags: ['거실', '클래식', '엔틱', '샹들리에'], fileType: 'jpg', size: '1920x1080', updatedAt: '2024-05-14', imageUrl: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=1000&q=80' },
  { id: 108, tags: ['거실', '빈티지', '러그', '소파'], fileType: 'jpg', size: '1920x1080', updatedAt: '2024-05-13', imageUrl: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=1000&q=80' },
  { id: 109, tags: ['거실', '스튜디오', '높은천장', '창문'], fileType: 'jpg', size: '1920x1080', updatedAt: '2024-05-12', imageUrl: 'https://images.unsplash.com/photo-1502005229762-cf1b2da7c5d6?auto=format&fit=crop&w=1000&q=80' },
  { id: 110, tags: ['거실', '복층', '계단', '큰창'], fileType: 'jpg', size: '1920x1080', updatedAt: '2024-05-11', imageUrl: 'https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?auto=format&fit=crop&w=1000&q=80' },
  { id: 111, tags: ['거실', '오션뷰', '휴양지', '리조트'], fileType: 'jpg', size: '1920x1080', updatedAt: '2024-05-10', imageUrl: 'https://images.unsplash.com/photo-1512918760534-d7f780dc975a?auto=format&fit=crop&w=1000&q=80' },
  { id: 112, tags: ['거실', '숲뷰', '전원주택', '평상'], fileType: 'jpg', size: '1920x1080', updatedAt: '2024-05-09', imageUrl: 'https://images.unsplash.com/photo-1600210491892-03d54c0aaf87?auto=format&fit=crop&w=1000&q=80' },
  { id: 113, tags: ['거실', '작은집', '원룸', '효율'], fileType: 'jpg', size: '1920x1080', updatedAt: '2024-05-08', imageUrl: 'https://images.unsplash.com/photo-1484154218962-a1c002085d2f?auto=format&fit=crop&w=1000&q=80' },
  { id: 114, tags: ['거실', '갤러리', '액자', '조명'], fileType: 'jpg', size: '1920x1080', updatedAt: '2024-05-07', imageUrl: 'https://images.unsplash.com/photo-1554995207-c18c203602cb?auto=format&fit=crop&w=1000&q=80' },
  { id: 115, tags: ['거실', '서재형', '책장', '테이블'], fileType: 'jpg', size: '1920x1080', updatedAt: '2024-05-06', imageUrl: 'https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?auto=format&fit=crop&w=1000&q=80' },

  // --- Theme: Bedroom (16-30) ---
  { id: 116, tags: ['침실', '호텔식', '화이트', '암막'], fileType: 'jpg', size: '1920x1080', updatedAt: '2024-05-05', imageUrl: 'https://images.unsplash.com/photo-1616594039964-40891a9046c9?auto=format&fit=crop&w=1000&q=80' },
  { id: 117, tags: ['침실', '코지', '따뜻한', '조명'], fileType: 'jpg', size: '1920x1080', updatedAt: '2024-05-04', imageUrl: 'https://images.unsplash.com/photo-1505693416388-503980203c65?auto=format&fit=crop&w=1000&q=80' },
  { id: 118, tags: ['침실', '모던', '그레이', '심플'], fileType: 'jpg', size: '1920x1080', updatedAt: '2024-05-03', imageUrl: 'https://images.unsplash.com/photo-1560185127-6a6a45b89245?auto=format&fit=crop&w=1000&q=80' },
  { id: 119, tags: ['침실', '내추럴', '식물', '아침'], fileType: 'jpg', size: '1920x1080', updatedAt: '2024-05-02', imageUrl: 'https://images.unsplash.com/photo-1522771753035-0a1539503ed5?auto=format&fit=crop&w=1000&q=80' },
  { id: 120, tags: ['침실', '키즈룸', '아이방', '컬러풀'], fileType: 'jpg', size: '1920x1080', updatedAt: '2024-05-01', imageUrl: 'https://images.unsplash.com/photo-1558603668-6570496b66f8?auto=format&fit=crop&w=1000&q=80' },
  { id: 121, tags: ['침실', '럭셔리', '마스터룸', '파우더'], fileType: 'jpg', size: '1920x1080', updatedAt: '2024-04-30', imageUrl: 'https://images.unsplash.com/photo-1617325247661-675ab4b64ae2?auto=format&fit=crop&w=1000&q=80' },
  { id: 122, tags: ['침실', '미니멀', '저상형', '창가'], fileType: 'jpg', size: '1920x1080', updatedAt: '2024-04-29', imageUrl: 'https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?auto=format&fit=crop&w=1000&q=80' },
  { id: 123, tags: ['침실', '엔틱', '고풍', '커튼'], fileType: 'jpg', size: '1920x1080', updatedAt: '2024-04-28', imageUrl: 'https://images.unsplash.com/photo-1540518614846-7eded433c457?auto=format&fit=crop&w=1000&q=80' },
  { id: 124, tags: ['침실', '뷰', '통창', '시티뷰'], fileType: 'jpg', size: '1920x1080', updatedAt: '2024-04-27', imageUrl: 'https://images.unsplash.com/photo-1594026112284-02bb6f3352fe?auto=format&fit=crop&w=1000&q=80' },
  { id: 125, tags: ['침실', '다락방', '아늑', '창문'], fileType: 'jpg', size: '1920x1080', updatedAt: '2024-04-26', imageUrl: 'https://images.unsplash.com/photo-1595846519845-68e298c2edd8?auto=format&fit=crop&w=1000&q=80' },
  { id: 126, tags: ['침실', '보헤미안', '패턴', '감성'], fileType: 'jpg', size: '1920x1080', updatedAt: '2024-04-25', imageUrl: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1000&q=80' },
  { id: 127, tags: ['침실', '화이트우드', '깔끔', '수납'], fileType: 'jpg', size: '1920x1080', updatedAt: '2024-04-24', imageUrl: 'https://images.unsplash.com/photo-1598928636135-d146006ff4be?auto=format&fit=crop&w=1000&q=80' },
  { id: 128, tags: ['침실', '남성', '다크', '모던'], fileType: 'jpg', size: '1920x1080', updatedAt: '2024-04-23', imageUrl: 'https://images.unsplash.com/photo-1556020685-ae79c95eda07?auto=format&fit=crop&w=1000&q=80' },
  { id: 129, tags: ['침실', '여성', '파스텔', '화사'], fileType: 'jpg', size: '1920x1080', updatedAt: '2024-04-22', imageUrl: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=1000&q=80' },
  { id: 130, tags: ['침실', '게스트', '트윈', '호텔'], fileType: 'jpg', size: '1920x1080', updatedAt: '2024-04-21', imageUrl: 'https://images.unsplash.com/photo-1566665797739-1674de7a421a?auto=format&fit=crop&w=1000&q=80' },

  // --- Theme: Kitchen & Dining (31-40) ---
  { id: 131, tags: ['주방', '다이닝', '창문', '식탁'], fileType: 'jpg', size: '1920x1080', updatedAt: '2024-04-20', imageUrl: 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=1000&q=80' },
  { id: 132, tags: ['주방', '모던', '아일랜드', '화이트'], fileType: 'jpg', size: '1920x1080', updatedAt: '2024-04-19', imageUrl: 'https://images.unsplash.com/photo-1556909212-d5b604d0c90d?auto=format&fit=crop&w=1000&q=80' },
  { id: 133, tags: ['주방', '우드', '따뜻한', '카페'], fileType: 'jpg', size: '1920x1080', updatedAt: '2024-04-18', imageUrl: 'https://images.unsplash.com/photo-1556910103-1c02745a30bf?auto=format&fit=crop&w=1000&q=80' },
  { id: 134, tags: ['주방', '창가', '싱크대', '뷰'], fileType: 'jpg', size: '1920x1080', updatedAt: '2024-04-17', imageUrl: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?auto=format&fit=crop&w=1000&q=80' },
  { id: 135, tags: ['다이닝', '파티', '큰식탁', '조명'], fileType: 'jpg', size: '1920x1080', updatedAt: '2024-04-16', imageUrl: 'https://images.unsplash.com/photo-1617806118233-18e1de247200?auto=format&fit=crop&w=1000&q=80' },
  { id: 136, tags: ['다이닝', '심플', '2인', '아담'], fileType: 'jpg', size: '1920x1080', updatedAt: '2024-04-15', imageUrl: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1000&q=80' },
  { id: 137, tags: ['주방', '클래식', '웨인스코팅', '고급'], fileType: 'jpg', size: '1920x1080', updatedAt: '2024-04-14', imageUrl: 'https://images.unsplash.com/photo-1484154218962-a1c002085d2f?auto=format&fit=crop&w=1000&q=80' },
  { id: 138, tags: ['주방', '블랙', '시크', '모던'], fileType: 'jpg', size: '1920x1080', updatedAt: '2024-04-13', imageUrl: 'https://images.unsplash.com/photo-1507089947368-19c1da9775ae?auto=format&fit=crop&w=1000&q=80' },
  { id: 139, tags: ['주방', '컨트리', '전원', '아늑'], fileType: 'jpg', size: '1920x1080', updatedAt: '2024-04-12', imageUrl: 'https://images.unsplash.com/photo-1556912173-3db996e7fa8e?auto=format&fit=crop&w=1000&q=80' },
  { id: 140, tags: ['다이닝', '테라스', '야외', '개방'], fileType: 'jpg', size: '1920x1080', updatedAt: '2024-04-11', imageUrl: 'https://images.unsplash.com/photo-1600210492493-0946911123ea?auto=format&fit=crop&w=1000&q=80' },

  // --- Theme: Office & Study (41-50) ---
  { id: 141, tags: ['오피스', '회의실', '글라스', '블라인드'], fileType: 'jpg', size: '1920x1080', updatedAt: '2024-04-10', imageUrl: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1000&q=80' },
  { id: 142, tags: ['서재', '홈오피스', '데스크', '집중'], fileType: 'jpg', size: '1920x1080', updatedAt: '2024-04-09', imageUrl: 'https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=1000&q=80' },
  { id: 143, tags: ['오피스', '공유오피스', '개방', '창가'], fileType: 'jpg', size: '1920x1080', updatedAt: '2024-04-08', imageUrl: 'https://images.unsplash.com/photo-1497215728101-856f4ea42174?auto=format&fit=crop&w=1000&q=80' },
  { id: 144, tags: ['서재', '클래식', '책장', '중후'], fileType: 'jpg', size: '1920x1080', updatedAt: '2024-04-07', imageUrl: 'https://images.unsplash.com/photo-1507089947368-19c1da9775ae?auto=format&fit=crop&w=1000&q=80' },
  { id: 145, tags: ['오피스', '휴게실', '라운지', '편안'], fileType: 'jpg', size: '1920x1080', updatedAt: '2024-04-06', imageUrl: 'https://images.unsplash.com/photo-1527192491265-7e15c55b1ed2?auto=format&fit=crop&w=1000&q=80' },
  { id: 146, tags: ['서재', '미니멀', '화이트', '맥'], fileType: 'jpg', size: '1920x1080', updatedAt: '2024-04-05', imageUrl: 'https://images.unsplash.com/photo-1499951360447-b19be8fe80f5?auto=format&fit=crop&w=1000&q=80' },
  { id: 147, tags: ['오피스', '임원실', '전망', '고급'], fileType: 'jpg', size: '1920x1080', updatedAt: '2024-04-04', imageUrl: 'https://images.unsplash.com/photo-1504384308090-c54be3852f92?auto=format&fit=crop&w=1000&q=80' },
  { id: 148, tags: ['공부방', '학생', '책상', '밝은'], fileType: 'jpg', size: '1920x1080', updatedAt: '2024-04-03', imageUrl: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=1000&q=80' },
  { id: 149, tags: ['오피스', '로비', '접견', '소파'], fileType: 'jpg', size: '1920x1080', updatedAt: '2024-04-02', imageUrl: 'https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&w=1000&q=80' },
  { id: 150, tags: ['라운지', '휴식', '소파', '전망'], fileType: 'jpg', size: '1920x1080', updatedAt: '2024-04-02', imageUrl: 'https://images.unsplash.com/photo-1600607686527-6fb886090705?auto=format&fit=crop&w=1000&q=80' },
];

// ... (Helper functions generateMockPartners, MOCK_PARTNERS remain same)
// Helper to generate mock partners by grade
const generateMockPartners = (creatorId: string, defaultType: PartnerType, count: number): PartnerData[] => {
  const grades = ['A', 'B', 'C', 'D'];
  const partners: PartnerData[] = [];

  const companies = [
    "태양창", "달빛드림", "별빛앤", "우주디자인", "은하블라인드",
    "혜성나라", "유성갤러리", "바람창", "구름스타일링", "바다창",
    "호수하우스", "강물블라인드", "빛과창", "드림커튼", "네이처창",
    "스타일윈도우", "행복한창", "굿모닝데코", "예쁜창", "퍼스트창"
  ];

  const firstNames = ["김", "이", "박", "최", "정", "강", "조", "윤", "장", "임"];
  const lastNames = ["민수", "서준", "도현", "예준", "지훈", "우진", "건우", "하준", "주원", "지우"];

  for (let i = 1; i <= count; i++) {
    const grade = grades[i % 4];
    const code = `${grade}${i.toString().padStart(3, '0')}`;
    const companyName = `${companies[i % companies.length]} ${i}호점`;
    const ceoName = `${firstNames[i % firstNames.length]}${lastNames[i % lastNames.length]}`;

    partners.push({
      id: `ptn-${creatorId}-${i}`,
      partnerName: companyName,
      partnerCode: code,
      adminId: `user_${creatorId}_${i}`,
      password: 'password',
      ceoName: ceoName,
      addresses: [{ id: `addr-${creatorId}-${i}`, address: `(12345) 서울 특별시 테스트구 테스트동 ${i}0${i}길 ${grade}동` }],
      companyPhone: `02-555-${1000 + i}`,
      ceoPhone: `010-1234-${1000 + i}`,
      managerName: `담당${i}`,
      managerPhone: `010-5678-${1000 + i}`,
      businessNo: `123-45-${67890 + i}`,
      businessType: '도/소매',
      businessItem: '커튼/블라인드',
      taxEmail: `tax${creatorId}${i}@example.com`,
      type: defaultType,
      grade: grade,
      note: `${grade}등급 샘플 거래처입니다.`,
      creatorId: creatorId
    });
  }
  return partners;
};

// Mock Partners Data
export const MOCK_PARTNERS: PartnerData[] = [
  // --- 1. 유통관리사 (DISTRIBUTOR) ---
  {
    id: 'd1', partnerName: '(주)경동물류', partnerCode: 'D001', adminId: 'kd_logis', password: 'pass', ceoName: '김준호',
    addresses: [{ id: 'a1', address: '(05836) 서울 송파구 법원로 11길 7' }],
    companyPhone: '02-1234-5678', ceoPhone: '010-1111-2222',
    managerName: '박대리', managerPhone: '010-3333-4444', businessNo: '101-81-12345', businessType: '도매 및 소매업', businessItem: '창호장식재',
    taxEmail: 'tax@kd.com', type: 'DISTRIBUTOR', grade: 'A', creatorId: 'd1'
  },

  // --- 2. 가맹대리점 (AGENCY) - Linked to Distributors ---
  {
    id: 'ag1', partnerName: '강남홈데코', partnerCode: 'A001', adminId: 'kn_deco', password: 'pass', ceoName: '이미나',
    addresses: [{ id: 'a6', address: '(06000) 서울 강남구 도산대로 100' }],
    companyPhone: '02-540-1111', ceoPhone: '010-1212-3434',
    managerName: '윤매니저', managerPhone: '010-9876-5432', businessNo: '211-05-12345', businessType: '소매', businessItem: '홈데코',
    taxEmail: 'kn@agency.com', type: 'AGENCY', parentPartnerId: 'd1', grade: 'A', creatorId: 'ag1'
  },

  // --- 3. 제조공급사 (MANUFACTURER) ---
  {
    id: 'm1', partnerName: '(주)선샤인', partnerCode: 'M001', adminId: 'sunshine', password: 'pass', ceoName: '박태양',
    addresses: [{ id: 'a7', address: '(12345) 경기도 김포시 양촌읍 황금로 123' }],
    companyPhone: '031-999-8888', ceoPhone: '010-9999-8888',
    managerName: '정생산', managerPhone: '010-8888-9999', businessNo: '333-22-11111', businessType: '제조', businessItem: '블라인드',
    taxEmail: 'fact@sun.com', type: 'MANUFACTURER', grade: 'A', creatorId: 'm1'
  },

  // --- 4. 원단공급사 (FABRIC_SUPPLIER) ---
  {
    id: 'f1', partnerName: '대구원단', partnerCode: 'F001', adminId: 'daegu_tex', password: 'pass', ceoName: '최성우',
    addresses: [{ id: 'a8', address: '(41000) 대구광역시 서구 국채보상로 100' }],
    companyPhone: '053-555-1234', ceoPhone: '010-7777-1234',
    managerName: '이소장', managerPhone: '010-1234-7777', businessNo: '505-81-33333', businessType: '도매', businessItem: '원단',
    taxEmail: 'tax@daegu.com', type: 'FABRIC_SUPPLIER', grade: 'A', creatorId: 'f1'
  },

  // ... Include Generated Data ...
  ...generateMockPartners('d1', 'AGENCY', 10),
  ...generateMockPartners('m1', 'DISTRIBUTOR', 10),
  ...generateMockPartners('f1', 'MANUFACTURER', 10),
  ...generateMockPartners('ag1', 'AGENCY', 10),
];

// Menu Items Generator
export const getMenusForRole = (role: UserRole): MenuItem[] => {
  switch (role) {
    case UserRole.GUEST:
      return [
        { id: 'notification', label: '알림', icon: Bell, badge: '1', isPersistent: true },
        { id: 'cart', label: '장바구니', icon: ShoppingCart, isPersistent: true, badge: '2' },
        { id: 'store', label: '취급점소개', icon: Store },
        { id: 'laundry', label: '세탁 접수', icon: Shirt },
        { id: 'measure', label: '무료 실측', icon: Ruler },
        { id: 'chat', label: '상담톡', icon: MessageCircle },
        { id: 'theme', label: '모드 설정', icon: Moon, action: 'TOGGLE_THEME' },
        { id: 'login', label: '로그인', icon: LogIn, action: 'LOGIN' },
      ];
    case UserRole.USER:
      return [
        { id: 'notification', label: '알림', icon: Bell, badge: '1' },
        { id: 'cart', label: '장바구니', icon: ShoppingCart, badge: '5' },
        { id: 'payment', label: '결제하기', icon: CreditCard },
        { id: 'store', label: '취급점소개', icon: Store },
        { id: 'myinfo', label: '내정보', icon: User },
        { id: 'orders', label: '주문내역', icon: ListOrdered },
        { id: 'laundry', label: '세탁접수', icon: Shirt },
        { id: 'measure', label: '무료실측', icon: Ruler },
        { id: 'chat', label: '상담톡', icon: MessageCircle, badge: '2' },
        { id: 'theme', label: '모드설정', icon: Moon, action: 'TOGGLE_THEME' },
        { id: 'logout', label: '로그아웃', icon: LogOut, action: 'LOGOUT' },
      ];
    case UserRole.AGENCY:
      return [
        { id: 'dashboard', label: '기본현황', icon: LayoutDashboard }, // Default active
        { id: 'ai_catalog', label: 'Ai카다록', icon: BookOpen },
        { id: 'pricing', label: '단가설정', icon: DollarSign },
        { id: 'estimate', label: '견적관리', icon: FileText },
        { id: 'mfg_order', label: '제작주문', icon: ClipboardList },
        { id: 'search', label: '조회', icon: Search },
        { id: 'schedule', label: '스케줄', icon: Calendar },
        { id: 'customer', label: '고객관리', icon: Users },
        { id: 'kiosk', label: '키오스크', icon: Monitor },
        { id: 'user_mgmt', label: '사용자관리', icon: UserCog },
        { id: 'hq_info', label: '본사정보', icon: Building },
        { id: 'logout', label: '로그아웃', icon: LogOut, action: 'LOGOUT' },
      ];
    case UserRole.DISTRIBUTOR:
      return [
        { id: 'dashboard', label: '기본현황', icon: LayoutDashboard },
        {
          id: 'dist_basic_settings',
          label: '표준설정',
          icon: Settings,
          subItems: [
            { id: 'dist_std_product_config', label: '표준상품', icon: Package },
            { id: 'dist_std_products', label: '상품원가', icon: Boxes },
            { id: 'dist_std_measure', label: '실사등록', icon: Ruler },
            { id: 'dist_purchase_products', label: '매입설정', icon: ShoppingCart },
            { id: 'sales_settings', label: '매출설정', icon: BarChart3 }
          ]
        },
        { id: 'order_proc', label: '접수/발주', icon: Truck },
        { id: 'status_by_store', label: '접수처별 상태조회', icon: ClipboardList },
        { id: 'system_view', label: '상품/시스템 보기', icon: Boxes },
        { id: 'sales_mgmt', label: '매출/실사/매입', icon: BarChart3 },
        { id: 'partners', label: '거래처관리', icon: UserCog },
        { id: 'user_mgmt', label: '사용자관리', icon: Users },
        { id: 'hq_info', label: '본사정보', icon: Building },
        { id: 'logout', label: '로그아웃', icon: LogOut, action: 'LOGOUT' },
      ];
    case UserRole.MANUFACTURER:
      return [
        { id: 'dashboard', label: '기본현황', icon: LayoutDashboard },
        {
          id: 'standard_settings',
          label: '표준설정',
          icon: Settings,
          subItems: [
            { id: 'standard_product', label: '표준상품', icon: Package },
            { id: 'product_price', label: '상품원가', icon: DollarSign },
            { id: 'measure_registration', label: '실사등록', icon: Camera },
            { id: 'purchase_settings', label: '매입설정', icon: ShoppingCart },
            { id: 'sales_settings', label: '매출설정', icon: BarChart3 }
          ]
        },
        { id: 'order_reception', label: '주문접수', icon: FileText },
        {
          id: 'stock_in',
          label: '입고관리',
          icon: ClipboardList,
          subItems: [
            { id: 'stock_in_reservation', label: '입고예약', icon: Calendar },
            { id: 'stock_in_confirmation', label: '입고확인', icon: CheckCircle2 }
          ]
        },
        { id: 'stock_adjust', label: '재고조정', icon: Sliders },
        { id: 'work_mgmt', label: '생산관리', icon: Factory },
        { id: 'shipping', label: '패킹배송', icon: Package },
        { id: 'sales_ledger', label: '매출원장', icon: BookOpen },
        { id: 'partners', label: '거래처관리', icon: Users },
        { id: 'user_mgmt', label: '사용자관리', icon: UserCog },
        { id: 'hq_info', label: '본사정보', icon: Building },
        { id: 'logout', label: '로그아웃', icon: LogOut, action: 'LOGOUT' },
      ];
    case UserRole.FABRIC_SUPPLIER:
      return [
        {
          id: 'basic_overview',
          label: '기본현황',
          icon: LayoutDashboard,
          subItems: [
            { id: 'dashboard', label: '기본현황', icon: LayoutDashboard },
            { id: 'admin_settings', label: 'UI 설정', icon: LayoutTemplate },
          ]
        },
        {
          id: 'standard_settings',
          label: '표준설정',
          icon: Settings,
          subItems: [
            { id: 'standard_product', label: '표준상품', icon: Package },
            { id: 'product_price', label: '상품원가', icon: DollarSign },
            { id: 'sales_price', label: '판매단가', icon: DollarSign }
          ]
        },
        {
          id: 'stock_in',
          label: '입고관리',
          icon: ClipboardList,
          subItems: [
            { id: 'stock_in_reservation', label: '입고예약', icon: Calendar },
            { id: 'stock_in_confirmation', label: '입고확인', icon: CheckCircle2 }
          ]
        },
        { id: 'stock_adjust', label: '재고조정', icon: Sliders },
        { id: 'order_reception', label: '주문접수', icon: FileText },
        { id: 'shipping', label: '출고관리', icon: Truck },
        { id: 'ledger', label: '거래원장', icon: BookOpen },
        { id: 'deposit', label: '입금관리', icon: CreditCard },
        { id: 'partners', label: '거래처관리', icon: Users },
        { id: 'user_mgmt', label: '사용자관리', icon: UserCog },
        { id: 'hq_info', label: '본사정보', icon: Building },
        { id: 'logout', label: '로그아웃', icon: LogOut, action: 'LOGOUT' },
      ];
    case UserRole.ADMIN:
      return [
        { id: 'dashboard', label: '기본현황', icon: LayoutDashboard },
        {
          id: 'basic_mgmt',
          label: '기본관리',
          icon: Settings,
          subItems: [
            { id: 'admin_settings', label: 'UI 설정', icon: LayoutTemplate },
            { id: 'basic_config', label: '기본설정', icon: Sliders },
            { id: 'product_summary', label: '상품개요', icon: ClipboardList },
            { id: 'product_config', label: '상품스팩', icon: Boxes },
            { id: 'product_detail', label: '표준원가', icon: Package },
            { id: 'color_config', label: '상품칼라', icon: Palette },
            { id: 'tree_linker', label: '트리연결', icon: Link2 },
          ]
        },
        {
          id: 'image_mgmt',
          label: '이미지관리',
          icon: Image,
          subItems: [
            { id: 'real_images', label: '실사관리', icon: Image },
            { id: 'space_images', label: '공간관리', icon: LayoutTemplate },
            { id: 'ai_contents', label: 'Ai컨텐츠', icon: Sparkles },
          ]
        },
        { id: 'user_mgmt', label: '회원관리', icon: UserCog },
        { id: 'partner_mgmt', label: '거래처관리', icon: Users },
        { id: 'kiosk', label: '설치기기', icon: Monitor },
        { id: 'hq_info', label: '본사정보', icon: Building },
        { id: 'logout', label: '로그아웃', icon: LogOut, action: 'LOGOUT' },
      ];
    default:
      return [];
  }
};
