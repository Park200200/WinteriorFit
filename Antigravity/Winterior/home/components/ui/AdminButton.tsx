import React from 'react';
import { LucideIcon } from 'lucide-react';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'success';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface AdminButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: ButtonVariant;
    size?: ButtonSize;
    icon?: LucideIcon;
    iconPosition?: 'left' | 'right';
    isLoading?: boolean;
    fullWidth?: boolean;
    children: React.ReactNode;
}

export const AdminButton: React.FC<AdminButtonProps> = ({
    variant = 'primary',
    size = 'md',
    icon: Icon,
    iconPosition = 'left',
    isLoading = false,
    fullWidth = false,
    className = '',
    disabled,
    children,
    ...props
}) => {
    // 1. Base styles & Layout (Flex, Focus, Transition)
    const baseClasses = "inline-flex items-center justify-center font-bold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-1 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100";

    // 2. Size styles mapping
    const sizeClasses = {
        sm: "h-8 px-3 text-xs gap-1.5",
        md: "h-10 px-4 text-sm gap-2",
        lg: "h-12 px-6 text-base gap-2.5",
    };

    // 3. Variant styles mapping (Using Global CSS Variables applied from ThemeContext)
    const variantClasses = {
        primary: "bg-[var(--theme-primary)] text-white hover:bg-[var(--theme-primary-hover)] focus:ring-[var(--theme-primary-bg)] shadow-sm",
        secondary: "bg-gray-100 text-gray-800 hover:bg-gray-200 focus:ring-gray-200",
        outline: "bg-transparent border border-gray-200 text-gray-700 hover:bg-gray-50 focus:ring-gray-100",
        ghost: "bg-transparent text-gray-600 hover:bg-gray-100 hover:text-gray-900 focus:ring-gray-100",
        danger: "bg-red-500 text-white hover:bg-red-600 focus:ring-red-100 shadow-sm",
        success: "bg-emerald-500 text-white hover:bg-emerald-600 focus:ring-emerald-100 shadow-sm",
    };

    const widthClass = fullWidth ? "w-full" : "";
    const radiusClass = "rounded-[var(--theme-radius)]"; // CSS Variable for dynamic radius

    const classes = [
        baseClasses,
        sizeClasses[size],
        variantClasses[variant],
        widthClass,
        radiusClass,
        className
    ].filter(Boolean).join(' ');

    const iconSize = size === 'sm' ? 14 : size === 'md' ? 16 : 20;

    return (
        <button
            className={classes}
            disabled={disabled || isLoading}
            {...props}
        >
            {isLoading && (
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
            )}
            {!isLoading && Icon && iconPosition === 'left' && <Icon size={iconSize} className="flex-shrink-0" />}
            <span>{children}</span>
            {!isLoading && Icon && iconPosition === 'right' && <Icon size={iconSize} className="flex-shrink-0" />}
        </button>
    );
};
