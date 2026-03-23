import React, { forwardRef } from 'react';
import { Search } from 'lucide-react';

export interface AdminInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    icon?: React.ReactNode;
    isSearch?: boolean; // 검색창 스타일을 활성화
    error?: string; // 에러 메시지
}

export const AdminInput = forwardRef<HTMLInputElement, AdminInputProps>(
    ({ className = '', icon, isSearch, error, ...props }, ref) => {

        // 테마 컬러 및 곡률 변수를 활용하여 포커스 & 쉐입 설정
        const baseClass = "w-full text-sm outline-none bg-transparent transition-all disabled:opacity-50 disabled:cursor-not-allowed";

        // 외곽 컨테이너 스타일 (보더, 배경, 패딩 등)
        const containerBase = "flex items-center gap-2 border bg-white transition-all overflow-hidden";

        // --theme-radius 변수를 인라인 스타일로 주입하기 위해 따로 클래스 추출하지 않음.
        // 포커스 시 테마의 Primary 컬러 라인 적용 (CSS Variable을 Tailwind 임의값으로)
        const focusClass = error
            ? "border-red-500 focus-within:ring-1 focus-within:ring-red-500"
            : "border-gray-300 focus-within:border-[var(--theme-primary)] focus-within:ring-1 focus-within:ring-[var(--theme-primary)]";

        const searchClass = isSearch ? "bg-gray-50 focus-within:bg-white px-4 py-2.5" : "px-3 py-2";

        return (
            <div className="w-full flex flex-col gap-1.5">
                <div
                    className={`${containerBase} ${focusClass} ${searchClass} ${className}`}
                    style={{ borderRadius: 'var(--theme-radius)' }}
                >
                    {isSearch && !icon && <Search size={16} className="text-gray-400 flex-shrink-0" />}
                    {icon && <div className="text-gray-400 flex-shrink-0">{icon}</div>}

                    <input
                        ref={ref}
                        className={`${baseClass} text-gray-800 placeholder-gray-400`}
                        {...props}
                    />
                </div>

                {error && (
                    <span className="text-xs font-medium text-red-500 pl-1">{error}</span>
                )}
            </div>
        );
    }
);

AdminInput.displayName = 'AdminInput';
