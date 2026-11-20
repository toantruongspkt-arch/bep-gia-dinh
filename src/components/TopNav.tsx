import React from 'react';
import { Plus } from 'lucide-react';
import { AppTab } from '../types';
import { PWAInstallButton } from './PWAInstallButton';
import {
  AvocadoIcon,
  BroccoliIcon,
  CarrotIcon,
  PumpkinIcon,
  SproutPotIcon,
  TomatoIcon,
} from './VeggieIcons';

interface TopNavProps {
  activeTab: AppTab;
  onSelectTab: (tab: AppTab) => void;
  onOpenCustomRecipe: () => void;
  shoppingCount: number;
  lowStockCount: number;
}

export const TopNav: React.FC<TopNavProps> = ({
  activeTab,
  onSelectTab,
  onOpenCustomRecipe,
  shoppingCount,
  lowStockCount,
}) => {
  const navItems: {
    id: AppTab;
    label: string;
    mobileLabel: string;
    count?: number;
    icon: React.ReactNode;
  }[] = [
    {
      id: 'recipes',
      label: 'Gợi ý món',
      mobileLabel: 'Gợi ý',
      icon: <BroccoliIcon className="w-5 h-5 shrink-0" />,
    },
    {
      id: 'pantry',
      label: 'Kho bếp',
      mobileLabel: 'Kho bếp',
      count: lowStockCount > 0 ? lowStockCount : undefined,
      icon: <CarrotIcon className="w-5 h-5 shrink-0" />,
    },
    {
      id: 'diet',
      label: 'Ăn kiêng',
      mobileLabel: 'Ăn kiêng',
      icon: <AvocadoIcon className="w-5 h-5 shrink-0" />,
    },
    {
      id: 'shopping',
      label: 'Đi chợ',
      mobileLabel: 'Đi chợ',
      count: shoppingCount > 0 ? shoppingCount : undefined,
      icon: <TomatoIcon className="w-5 h-5 shrink-0" />,
    },
    {
      id: 'history',
      label: 'Lịch sử',
      mobileLabel: 'Lịch sử',
      icon: <PumpkinIcon className="w-5 h-5 shrink-0" />,
    },
  ];

  return (
    <>
      <header className="bg-white/95 backdrop-blur-md border-b border-stone-200 md:sticky md:top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 md:h-[72px] flex items-center justify-between gap-4">
          <button
            type="button"
            onClick={() => onSelectTab('recipes')}
            className="inline-flex items-center gap-2.5 font-display text-lg md:text-xl font-bold tracking-tight text-stone-900 whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#15803D]"
          >
            <SproutPotIcon className="w-7 h-7 shrink-0" />
            <span>BẾP CỦA TÒN</span>
          </button>

          {/* Main 3D tactile block tabs on desktop */}
          <nav
            aria-label="Điều hướng chính"
            className="hidden md:flex items-center gap-2.5"
          >
            {navItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onSelectTab(item.id)}
                  className={`inline-flex items-center gap-2 px-3.5 py-2 min-h-[42px] rounded-xl text-sm font-semibold whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#15803D] ${
                    isActive
                      ? 'tab-block-3d-active text-white'
                      : 'tab-block-3d text-stone-700 hover:text-stone-900'
                  }`}
                >
                  {item.icon}
                  <span>{item.label}</span>
                  {typeof item.count === 'number' && (
                    <span
                      className={`font-mono-num text-xs px-1.5 py-0.5 rounded-md ${
                        isActive
                          ? 'bg-white/20 text-white'
                          : 'bg-stone-100 text-stone-600'
                      }`}
                    >
                      {item.count}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          <div className="flex items-center gap-2 shrink-0">
            <PWAInstallButton />

            <button
              type="button"
              onClick={onOpenCustomRecipe}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 min-h-[40px] rounded-lg bg-[#15803D] hover:bg-[#166534] text-white text-xs sm:text-sm font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#15803D]"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Thiết kế món</span>
              <span className="sm:hidden">Món mới</span>
            </button>
          </div>
        </div>
      </header>

      {/* Mobile bottom thumb-zone 3D block navigation with iOS safe area */}
      <nav
        aria-label="Menu di động"
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-stone-200 px-2 pt-1.5 pb-1.5 safe-bottom-nav grid grid-cols-5 gap-1.5"
      >
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelectTab(item.id)}
              className={`relative flex flex-col items-center justify-center min-h-[50px] rounded-xl px-1 py-1 cursor-pointer ${
                isActive
                  ? 'tab-block-3d-active text-white'
                  : 'tab-block-3d text-stone-600'
              }`}
            >
              {item.icon}
              <span className="text-[10px] font-semibold mt-0.5 whitespace-nowrap leading-none">
                {item.mobileLabel}
              </span>
              {typeof item.count === 'number' && (
                <span
                  className={`absolute top-0.5 right-1 font-mono-num text-[9px] font-bold px-1 rounded ${
                    isActive
                      ? 'bg-white/25 text-white'
                      : 'bg-emerald-50 text-[#15803D]'
                  }`}
                >
                  {item.count}
                </span>
              )}
            </button>
          );
        })}
      </nav>
    </>
  );
};
