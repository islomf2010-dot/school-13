import React from 'react';
import {
  SCHOOL_MAPS,
  SchoolMapId,
  ULTIMATE_SPECS,
  UltimateId,
} from '../game/types';
import { OverlayModalTab } from './MetaAndSettingsModal';

interface TitleScreenProps {
  onStart: () => void;
  bestScore: number;
  medals: number;
  unlockedAchievementsCount: number;
  muted: boolean;
  onToggleMute: () => void;
  selectedUltimate: UltimateId;
  onSelectUltimate: (id: UltimateId) => void;
  selectedMap: SchoolMapId;
  onSelectMap: (id: SchoolMapId) => void;
  onOpenModal: (tab: OverlayModalTab) => void;
}

const MAP_ORDER: SchoolMapId[] = [
  'corridor',
  'classroom',
  'gymnasium',
  'lab',
  'library',
  'basement',
];

export function TitleScreen({
  onStart,
  bestScore,
  medals,
  unlockedAchievementsCount,
  muted,
  onToggleMute,
  selectedUltimate,
  onSelectUltimate,
  selectedMap,
  onSelectMap,
  onOpenModal,
}: TitleScreenProps) {
  const ultOrder: UltimateId[] = ['sandevistan', 'shadow_ninja', 'sonic_bell'];

  return (
    <div
      className="fixed inset-0 z-20 flex flex-col justify-between p-3 sm:p-6 md:p-8 pointer-events-none overflow-y-auto"
      style={{
        backgroundImage:
          'linear-gradient(90deg, rgba(8, 14, 11, 0.94) 0%, rgba(9, 16, 13, 0.82) 52%, rgba(8, 14, 11, 0.45) 100%), url("/assets/ui/title_key_art.png")',
        backgroundSize: 'cover',
        backgroundPosition: 'center right',
      }}
    >
      {/* Top utility row with Meta-Shop, Achievements, Tutorial, Settings & Mute */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <div className="text-xs font-mono-num tracking-wider uppercase text-amber-300/90">
            ШКОЛА №13 · ИНДИ-ЭКШЕН НА ВЫЖИВАНИЕ
          </div>
          <span className="px-2.5 py-1 rounded bg-[#11201a] border border-amber-400/60 font-mono-num text-xs font-extrabold text-amber-300">
            МЕДАЛИ: {medals}
          </span>
        </div>

        <div className="pointer-events-auto flex flex-wrap items-center gap-1.5 sm:gap-2">
          <button
            type="button"
            onClick={() => onOpenModal('shop')}
            className="px-3 py-1.5 rounded-md border border-amber-400/70 bg-[#14261f] text-amber-300 hover:bg-[#1c362c] transition-colors text-xs font-mono-num font-bold cursor-pointer"
          >
            МАСТЕРСКАЯ И ОБЛИКИ
          </button>
          <button
            type="button"
            onClick={() => onOpenModal('achievements')}
            className="px-3 py-1.5 rounded-md border border-[#2d4a3e] bg-[#111c17] text-[#e2ece7] hover:border-emerald-400 transition-colors text-xs font-mono-num font-semibold cursor-pointer"
          >
            ДОСТИЖЕНИЯ ({unlockedAchievementsCount}/10)
          </button>
          <button
            type="button"
            onClick={() => onOpenModal('tutorial')}
            className="px-3 py-1.5 rounded-md border border-[#2d4a3e] bg-[#111c17] text-[#bae6fd] hover:border-sky-400 transition-colors text-xs font-mono-num font-semibold cursor-pointer"
          >
            УЧЕБНИК
          </button>
          <button
            type="button"
            onClick={() => onOpenModal('settings')}
            className="px-3 py-1.5 rounded-md border border-[#2d4a3e] bg-[#111c17] text-[#e2ece7] hover:border-amber-400 transition-colors text-xs font-mono-num font-semibold cursor-pointer"
          >
            НАСТРОЙКИ
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.currentTarget.blur();
              onToggleMute();
            }}
            aria-label={muted ? 'Включить звук' : 'Выключить звук'}
            className="px-3 py-1.5 rounded-md border border-[#2d4a3e] bg-[#111c17] text-[#e2ece7] hover:border-amber-400 transition-colors text-xs font-mono-num font-semibold cursor-pointer"
          >
            {muted ? 'ЗВУК: ВЫКЛ [M]' : 'ЗВУК: ВКЛ [M]'}
          </button>
        </div>
      </div>

      {/* Main Focal Content */}
      <div className="my-auto max-w-3xl flex flex-col items-start gap-3 sm:gap-4 py-2">
        {/* Hand-painted School #13 Crest & Hero Game Banner */}
        <div
          role="img"
          aria-label="Урок Выживания: Школа №13"
          className="w-full max-w-[600px] rounded-2xl border-2 border-amber-500/80 bg-[#0d1914]/92 p-3.5 sm:p-4 shadow-[0_14px_34px_rgba(0,0,0,0.88)] flex items-center gap-3.5 sm:gap-5 relative overflow-hidden"
        >
          <img
            src="/assets/environment/school_crest.png"
            alt=""
            aria-hidden="true"
            className="w-16 h-16 sm:w-22 sm:h-22 object-contain drop-shadow-[0_4px_12px_rgba(0,0,0,0.85)] shrink-0 select-none"
            draggable={false}
          />
          <div className="flex flex-col min-w-0">
            <div className="inline-flex items-center gap-2 mb-0.5">
              <span className="px-2 py-0.5 rounded bg-amber-400 text-[#09100d] font-mono-num text-[10px] font-extrabold tracking-wider uppercase">
                ШКОЛА №13 · ЗОМБИ-ПЕДСОВЕТ
              </span>
            </div>
            <h1 className="font-display text-2xl sm:text-4xl tracking-wide text-amber-100 drop-shadow-[0_3px_0_#09100d] leading-tight">
              УРОК ВЫЖИВАНИЯ
            </h1>
            <p className="text-[11px] sm:text-xs font-bold tracking-wide text-emerald-300 mt-1">
              6 ЛОКАЦИЙ ШКОЛЫ · 4 БОССА · МОДИФИКАЦИИ ОРУЖИЯ · СЕКРЕТНЫЕ ТАЙНИКИ
            </p>
          </div>
        </div>

        {/* Map / School Sector Selector */}
        <div className="w-full pointer-events-auto bg-[#0c1612]/95 border-2 border-[#2a4539] rounded-xl p-2.5 sm:p-3.5 shadow-[0_8px_24px_rgba(0,0,0,0.75)]">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-display tracking-wider uppercase text-emerald-300">
              СТАРТОВАЯ ЛОКАЦИЯ ШКОЛЫ (6 ОТСЕКОВ С ТАЙНИКАМИ):
            </span>
            <span className="text-[11px] font-mono-num text-[#9db8ad] hidden sm:inline">
              {SCHOOL_MAPS[selectedMap].hazardHint}
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-1.5">
            {MAP_ORDER.map((mId) => {
              const mSpec = SCHOOL_MAPS[mId];
              const isSelected = selectedMap === mId;
              return (
                <button
                  key={mId}
                  type="button"
                  data-map={mId}
                  onClick={(e) => {
                    e.currentTarget.blur();
                    onSelectMap(mId);
                  }}
                  style={{
                    borderColor: isSelected ? mSpec.accentColor : '#243c32',
                    backgroundColor: isSelected
                      ? 'rgba(20, 38, 31, 0.96)'
                      : 'rgba(12, 21, 17, 0.85)',
                  }}
                  className="text-left p-2 rounded-lg border-2 transition-all cursor-pointer flex flex-col justify-between hover:brightness-110"
                >
                  <span
                    className="font-display text-[11px] leading-tight truncate"
                    style={{ color: isSelected ? mSpec.accentColor : '#e2ece7' }}
                  >
                    {mSpec.shortName}
                  </span>
                  <span className="text-[9px] font-mono-num text-[#9db8ad] truncate mt-0.5">
                    Тайник + Бой
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Ultimate Ability Selector before battle */}
        <div className="w-full pointer-events-auto bg-[#0c1612]/95 border-2 border-[#2a4539] rounded-xl p-2.5 sm:p-3.5 shadow-[0_8px_24px_rgba(0,0,0,0.75)]">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs sm:text-sm font-display tracking-wider uppercase text-amber-300">
              СУПЕРСПОСОБНОСТЬ УЧЕНИКА [C / ПКМ]:
            </span>
            <span className="text-[11px] font-mono-num text-emerald-300/90 hidden sm:inline">
              Готова со старта · Можно менять в бою на [V]!
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {ultOrder.map((id) => {
              const spec = ULTIMATE_SPECS[id];
              const isSelected = selectedUltimate === id;
              return (
                <button
                  key={id}
                  type="button"
                  data-ult={id}
                  onClick={(e) => {
                    e.currentTarget.blur();
                    onSelectUltimate(id);
                  }}
                  style={{
                    borderColor: isSelected ? spec.accent : '#263e34',
                    backgroundColor: isSelected
                      ? 'rgba(20, 38, 31, 0.96)'
                      : 'rgba(13, 23, 19, 0.85)',
                    boxShadow: isSelected ? `0 0 18px ${spec.accent}33` : 'none',
                  }}
                  className="text-left p-2.5 rounded-lg border-2 transition-all cursor-pointer flex flex-col justify-between gap-1 hover:brightness-110"
                >
                  <div className="flex items-center justify-between gap-1">
                    <span
                      className="font-display text-xs sm:text-sm tracking-wide"
                      style={{ color: spec.accent }}
                    >
                      {spec.shortName}
                    </span>
                    {isSelected && (
                      <span
                        className="text-[10px] font-mono-num font-extrabold px-1.5 py-0.5 rounded text-[#09100d]"
                        style={{ backgroundColor: spec.accent }}
                      >
                        ВЫБРАНО
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-[#cbd5e1] leading-snug">{spec.subtitle}</p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Primary CTA & Best Score */}
        <div className="flex flex-wrap items-center gap-3 pointer-events-auto">
          <button
            type="button"
            data-start="true"
            onClick={(e) => {
              e.currentTarget.blur();
              onStart();
            }}
            className="px-7 py-3.5 rounded-lg bg-[#f59e0b] hover:bg-[#fbbf24] active:translate-y-0.5 text-[#0b110e] font-display text-lg tracking-wide border-2 border-[#0b110e] shadow-[0_4px_0_#78350f] transition-transform cursor-pointer whitespace-nowrap shrink-0"
          >
            НАЧАТЬ УРОК [ENTER]
          </button>

          {bestScore > 0 && (
            <div className="px-4 py-2.5 rounded-lg bg-[#111e18] border border-[#2d4a3e] text-sm font-mono-num text-[#e2ece7]">
              РЕКОРД ШКОЛЫ: <span className="text-amber-300 font-bold">{Math.round(bestScore)}</span>
            </div>
          )}
        </div>
      </div>

      {/* Bottom control hint line */}
      <div className="text-xs font-mono-num text-[#b8cec4] tracking-wide">
        WASD Ходьба · ЛКМ / Пробел Огонь · 1–5 Оружие · Shift Рывок · ПКМ / C Ульта · E Парта · Q Турель
      </div>
    </div>
  );
}
