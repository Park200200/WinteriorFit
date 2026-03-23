
import React, { createContext, useState, useContext, ReactNode, useEffect, useCallback } from 'react';
import { PartnerData, PartnerCostSettings } from './types';
import { MOCK_PARTNERS } from './constants';

// Default Global Standards
const DEFAULT_STANDARD_COSTS: PartnerCostSettings = {
  aiCost: '50',
  dbManagementCost: '100,000',
  dbUsageCost: '50,000',
  transactionFee: '3.5'
};

// LocalStorage Keys
const PARTNERS_STORAGE_KEY = 'winterior_partners_data_v2';
const STANDARD_COSTS_STORAGE_KEY = 'winterior_standard_costs_v1';
const SOLUTION_IMAGE_MAP_KEY = 'winterior_solution_image_map_v1';

const DEFAULT_SOLUTION_IMAGE = 'https://images.unsplash.com/photo-1616486338812-3dadae4b4f9d?auto=format&fit=crop&w=1600&q=80';

// 역할별 이미지 맵 타입: { 'ADMIN': url, 'FABRIC_SUPPLIER': url, ... }
type SolutionImageMap = Record<string, string | null>;

interface PartnerContextType {
  partners: PartnerData[];
  setPartners: React.Dispatch<React.SetStateAction<PartnerData[]>>;
  updatePartner: (id: string, data: Partial<PartnerData>) => void;
  standardCosts: PartnerCostSettings;
  setStandardCosts: React.Dispatch<React.SetStateAction<PartnerCostSettings>>;
  // 역할별 독립 솔루션 이미지 API
  getSolutionImage: (roleKey: string) => string | null;
  setSolutionImage: (roleKey: string, url: string | null) => void;
  // 하위 호환성: ADMIN 이미지 (기존 Dashboard.tsx 사용분)
  solutionMainImage: string | null;
  setSolutionMainImage: React.Dispatch<React.SetStateAction<string | null>>;
}

const PartnerContext = createContext<PartnerContextType | undefined>(undefined);

export const PartnerProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Load partners from localStorage or use default
  const [partners, setPartners] = useState<PartnerData[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(PARTNERS_STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            return parsed;
          }
        }
      } catch (e) {
        console.error('[PartnerContext] Failed to load partners from localStorage', e);
      }
    }
    return MOCK_PARTNERS;
  });

  // Load standard costs from localStorage or use default
  const [standardCosts, setStandardCosts] = useState<PartnerCostSettings>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(STANDARD_COSTS_STORAGE_KEY);
        if (saved) return JSON.parse(saved);
      } catch (e) {
        console.error('[PartnerContext] Failed to load standard costs from localStorage', e);
      }
    }
    return DEFAULT_STANDARD_COSTS;
  });

  // ── 역할별 솔루션 이미지 맵 ──────────────────────────────────
  const [solutionImageMap, setSolutionImageMap] = useState<SolutionImageMap>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(SOLUTION_IMAGE_MAP_KEY);
        if (saved) return JSON.parse(saved);
      } catch (e) {
        console.error('[PartnerContext] Failed to load solution image map', e);
      }
    }
    // 각 역할 기본값 = 공통 기본 이미지
    return {
      ADMIN: DEFAULT_SOLUTION_IMAGE,
      FABRIC_SUPPLIER: DEFAULT_SOLUTION_IMAGE,
      MANUFACTURER: DEFAULT_SOLUTION_IMAGE,
      DISTRIBUTOR: DEFAULT_SOLUTION_IMAGE,
      AGENCY: DEFAULT_SOLUTION_IMAGE,
    };
  });

  // 역할별 이미지 맵 localStorage 동기화
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(SOLUTION_IMAGE_MAP_KEY, JSON.stringify(solutionImageMap));
      } catch (e) {
        console.warn('[PartnerContext] 솔루션 이미지 맵 localStorage 저장 실패 (용량 초과).', e);
      }
    }
  }, [solutionImageMap]);

  // 헬퍼: 역할 키로 이미지 가져오기
  const getSolutionImage = useCallback((roleKey: string): string | null => {
    return solutionImageMap[roleKey] ?? DEFAULT_SOLUTION_IMAGE;
  }, [solutionImageMap]);

  // 헬퍼: 역할 키로 이미지 설정
  const setSolutionImage = useCallback((roleKey: string, url: string | null) => {
    setSolutionImageMap(prev => ({ ...prev, [roleKey]: url }));
  }, []);

  // 하위 호환성용: ADMIN 이미지 단일 상태 (Dashboard.tsx 기존 사용)
  // 내부적으로는 맵의 ADMIN 슬롯을 읽음
  const solutionMainImage = solutionImageMap['ADMIN'] ?? DEFAULT_SOLUTION_IMAGE;
  const setSolutionMainImage: React.Dispatch<React.SetStateAction<string | null>> = (action) => {
    setSolutionImageMap(prev => {
      const next = typeof action === 'function' ? action(prev['ADMIN'] ?? DEFAULT_SOLUTION_IMAGE) : action;
      return { ...prev, ADMIN: next };
    });
  };

  // Save partners to localStorage whenever they change
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(PARTNERS_STORAGE_KEY, JSON.stringify(partners));
      } catch (e) {
        console.error('[PartnerContext] Failed to save partners to localStorage', e);
      }
    }
  }, [partners]);

  // Save standard costs to localStorage whenever they change
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STANDARD_COSTS_STORAGE_KEY, JSON.stringify(standardCosts));
      } catch (e) {
        console.error('[PartnerContext] Failed to save standard costs to localStorage', e);
      }
    }
  }, [standardCosts]);

  const updatePartner = (id: string, data: Partial<PartnerData>) => {
    setPartners(prev => prev.map(p => p.id === id ? { ...p, ...data } : p));
  };

  return (
    <PartnerContext.Provider value={{
      partners,
      setPartners,
      updatePartner,
      standardCosts,
      setStandardCosts,
      getSolutionImage,
      setSolutionImage,
      solutionMainImage,
      setSolutionMainImage,
    }}>
      {children}
    </PartnerContext.Provider>
  );
};

export const usePartnerContext = () => {
  const context = useContext(PartnerContext);
  if (!context) {
    throw new Error('usePartnerContext must be used within a PartnerProvider');
  }
  return context;
};
