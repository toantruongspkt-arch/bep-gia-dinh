import React from 'react';

interface IconProps {
  className?: string;
}

/** Cute sprouted cooking pot logo for BẾP CỦA TÒN */
export const SproutPotIcon: React.FC<IconProps> = ({ className = 'w-6 h-6' }) => (
  <svg viewBox="0 0 32 32" fill="none" className={className} aria-hidden="true">
    <path
      d="M16 11C16 7.5 19 5 22.5 5.3C22.5 8.8 19.8 11.4 16 11.4V11Z"
      fill="#86EFAC"
      stroke="#14532D"
      strokeWidth="1.5"
      strokeLinejoin="round"
    />
    <path
      d="M16 11.5C16 8.2 13.2 6 9.8 6.3C9.8 9.6 12.4 11.9 16 11.9V11.5Z"
      fill="#4ADE80"
      stroke="#14532D"
      strokeWidth="1.5"
      strokeLinejoin="round"
    />
    <path d="M16 10.5V14.5" stroke="#14532D" strokeWidth="1.6" strokeLinecap="round" />
    <path
      d="M7 15.5H25C25 22 21.6 26.5 16 26.5C10.4 26.5 7 22 7 15.5Z"
      fill="#FFFFFF"
      stroke="#14532D"
      strokeWidth="1.7"
      strokeLinejoin="round"
    />
    <rect
      x="5.5"
      y="14"
      width="21"
      height="2.6"
      rx="1.3"
      fill="#DCFCE7"
      stroke="#14532D"
      strokeWidth="1.4"
    />
    <path d="M4.2 16.5H6.5" stroke="#14532D" strokeWidth="1.6" strokeLinecap="round" />
    <path d="M25.5 16.5H27.8" stroke="#14532D" strokeWidth="1.6" strokeLinecap="round" />
    <path
      d="M13 20.5C13.9 21.7 14.9 22.2 16 22.2C17.1 22.2 18.1 21.7 19 20.5"
      stroke="#15803D"
      strokeWidth="1.6"
      strokeLinecap="round"
    />
  </svg>
);

/** Cute broccoli icon for Gợi ý món */
export const BroccoliIcon: React.FC<IconProps> = ({ className = 'w-5 h-5' }) => (
  <svg viewBox="0 0 28 28" fill="none" className={className} aria-hidden="true">
    <path
      d="M11.5 16.5L10.5 23.5C10.4 24.3 11 25 11.8 25H16.2C17 25 17.6 24.3 17.5 23.5L16.5 16.5"
      fill="#BBF7D0"
      stroke="#14532D"
      strokeWidth="1.6"
      strokeLinejoin="round"
    />
    <path
      d="M8.5 17.5C6 17.5 4.2 15.6 4.2 13.2C4.2 11.2 5.6 9.5 7.5 9C7.8 6.4 10 4.5 12.7 4.5C13.7 4.5 14.6 4.8 15.4 5.3C16.2 4.8 17.2 4.5 18.2 4.6C20.7 4.8 22.6 6.8 22.8 9.3C24.4 9.9 25.5 11.5 25.5 13.3C25.5 15.6 23.6 17.5 21.2 17.5H8.5Z"
      fill="#4ADE80"
      stroke="#14532D"
      strokeWidth="1.6"
      strokeLinejoin="round"
    />
    <circle cx="11.2" cy="12.2" r="0.9" fill="#14532D" />
    <circle cx="16.8" cy="12.2" r="0.9" fill="#14532D" />
    <path d="M12.8 14C13.5 14.7 14.5 14.7 15.2 14" stroke="#14532D" strokeWidth="1.3" strokeLinecap="round" />
  </svg>
);

/** Cute carrot icon for Kho bếp & Nguyên liệu tươi */
export const CarrotIcon: React.FC<IconProps> = ({ className = 'w-5 h-5' }) => (
  <svg viewBox="0 0 28 28" fill="none" className={className} aria-hidden="true">
    <path
      d="M14 7.5C14 5 15.8 3.2 18 3.5C18 5.8 16.2 7.5 14 7.5Z"
      fill="#4ADE80"
      stroke="#14532D"
      strokeWidth="1.4"
      strokeLinejoin="round"
    />
    <path
      d="M14 7.8C14 5.2 12.2 3.4 10 3.7C10 6 11.8 7.8 14 7.8Z"
      fill="#86EFAC"
      stroke="#14532D"
      strokeWidth="1.4"
      strokeLinejoin="round"
    />
    <path
      d="M9 11.5C9 9.2 11.2 7.8 14 7.8C16.8 7.8 19 9.2 19 11.5C19 15.8 16.2 24 14 24.5C11.8 24 9 15.8 9 11.5Z"
      fill="#FB923C"
      stroke="#7C2D12"
      strokeWidth="1.6"
      strokeLinejoin="round"
    />
    <path d="M11 12.5H13.2" stroke="#7C2D12" strokeWidth="1.3" strokeLinecap="round" />
    <path d="M15.2 16.2H17.2" stroke="#7C2D12" strokeWidth="1.3" strokeLinecap="round" />
  </svg>
);

/** Cute avocado icon for Ăn kiêng */
export const AvocadoIcon: React.FC<IconProps> = ({ className = 'w-5 h-5' }) => (
  <svg viewBox="0 0 28 28" fill="none" className={className} aria-hidden="true">
    <path
      d="M14 4C10.8 4 8.5 8.2 7.5 13C6.5 17.8 8.8 23.8 14 23.8C19.2 23.8 21.5 17.8 20.5 13C19.5 8.2 17.2 4 14 4Z"
      fill="#BEF264"
      stroke="#14532D"
      strokeWidth="1.6"
      strokeLinejoin="round"
    />
    <circle
      cx="14"
      cy="16.5"
      r="4"
      fill="#B45309"
      stroke="#78350F"
      strokeWidth="1.4"
    />
    <circle cx="12.7" cy="15.3" r="0.9" fill="#FDE68A" opacity="0.85" />
    <circle cx="12" cy="10.2" r="0.8" fill="#14532D" />
    <circle cx="16" cy="10.2" r="0.8" fill="#14532D" />
  </svg>
);

/** Cute tomato icon for Đi chợ */
export const TomatoIcon: React.FC<IconProps> = ({ className = 'w-5 h-5' }) => (
  <svg viewBox="0 0 28 28" fill="none" className={className} aria-hidden="true">
    <circle
      cx="14"
      cy="15.8"
      r="8.5"
      fill="#F87171"
      stroke="#7F1D1D"
      strokeWidth="1.6"
    />
    <path
      d="M14 7.5C12.3 5.5 10 5.5 8.8 6.8C10.5 7.7 12.2 8 14 7.5Z"
      fill="#4ADE80"
      stroke="#14532D"
      strokeWidth="1.3"
      strokeLinejoin="round"
    />
    <path
      d="M14 7.5C15.7 5.5 18 5.5 19.2 6.8C17.5 7.7 15.8 8 14 7.5Z"
      fill="#4ADE80"
      stroke="#14532D"
      strokeWidth="1.3"
      strokeLinejoin="round"
    />
    <path d="M14 4.8V8.2" stroke="#14532D" strokeWidth="1.6" strokeLinecap="round" />
    <circle cx="11.5" cy="15.2" r="0.85" fill="#7F1D1D" />
    <circle cx="16.5" cy="15.2" r="0.85" fill="#7F1D1D" />
    <path d="M12.5 17.5C13.3 18.3 14.7 18.3 15.5 17.5" stroke="#7F1D1D" strokeWidth="1.3" strokeLinecap="round" />
  </svg>
);

/** Cute pumpkin / warm memory bowl icon for Lịch sử */
export const PumpkinIcon: React.FC<IconProps> = ({ className = 'w-5 h-5' }) => (
  <svg viewBox="0 0 28 28" fill="none" className={className} aria-hidden="true">
    <path d="M14 4.5C14.5 5.8 14.4 7.2 14 8.2" stroke="#14532D" strokeWidth="1.8" strokeLinecap="round" />
    <path
      d="M14 8.2C9.5 8.2 5.2 11.2 5.2 16C5.2 20.8 8.8 23.8 14 23.8C19.2 23.8 22.8 20.8 22.8 16C22.8 11.2 18.5 8.2 14 8.2Z"
      fill="#FDBA74"
      stroke="#7C2D12"
      strokeWidth="1.6"
    />
    <ellipse cx="14" cy="16" rx="4.2" ry="7.6" fill="#FED7AA" stroke="#7C2D12" strokeWidth="1.3" />
    <circle cx="12.2" cy="15.2" r="0.85" fill="#7C2D12" />
    <circle cx="15.8" cy="15.2" r="0.85" fill="#7C2D12" />
    <path d="M12.8 17.5C13.5 18.2 14.5 18.2 15.2 17.5" stroke="#7C2D12" strokeWidth="1.3" strokeLinecap="round" />
  </svg>
);

/** Cute pepper / herb icon for Gia vị khô */
export const HerbChiliIcon: React.FC<IconProps> = ({ className = 'w-4 h-4' }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
    <path
      d="M14 6.5C14 4.6 15.4 3.5 17 3.5"
      stroke="#14532D"
      strokeWidth="1.6"
      strokeLinecap="round"
    />
    <path
      d="M14.2 6.5C11.2 6.5 8.5 9.2 7.5 13.2C6.8 16.2 7.8 19 9.5 19.8C11.5 20.6 15 17.8 16.4 13.6C17.4 10.6 16.6 6.5 14.2 6.5Z"
      fill="#FCA5A5"
      stroke="#7F1D1D"
      strokeWidth="1.5"
      strokeLinejoin="round"
    />
  </svg>
);

/** Cute olive leaf droplet for Gia vị lỏng */
export const LiquidHerbIcon: React.FC<IconProps> = ({ className = 'w-4 h-4' }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
    <path
      d="M12 4.2C12 4.2 6.5 10.8 6.5 14.8C6.5 17.9 9 20.2 12 20.2C15 20.2 17.5 17.9 17.5 14.8C17.5 10.8 12 4.2 12 4.2Z"
      fill="#FDE68A"
      stroke="#78350F"
      strokeWidth="1.5"
      strokeLinejoin="round"
    />
    <path d="M10.2 14.5C10.2 16 11 17 12.2 17.3" stroke="#78350F" strokeWidth="1.3" strokeLinecap="round" />
  </svg>
);

/** Cute bean sprout / grain pod for Nguyên liệu khô */
export const GrainPodIcon: React.FC<IconProps> = ({ className = 'w-4 h-4' }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
    <path
      d="M5.5 16.5C5.5 11.2 10.2 6.5 17.8 6.2C18 13.2 13.6 18.2 7.2 18.2C6.1 18.2 5.5 17.5 5.5 16.5Z"
      fill="#A7F3D0"
      stroke="#14532D"
      strokeWidth="1.5"
      strokeLinejoin="round"
    />
    <circle cx="9.8" cy="14.5" r="1.4" fill="#34D399" stroke="#14532D" strokeWidth="1.1" />
    <circle cx="13.5" cy="11.2" r="1.4" fill="#34D399" stroke="#14532D" strokeWidth="1.1" />
  </svg>
);
