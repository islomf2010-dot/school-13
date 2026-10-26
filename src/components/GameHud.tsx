import React from 'react';
import {
  BARRICADE_COST,
  getStyleProgressToNextRank,
  getStyleRankForPoints,
  MAX_WAVES,
  SCHOOL_EVENTS,
  SCHOOL_MAPS,
  SchoolEventId,
  SchoolMapId,
  StyleFeedItem,
  TURRET_COST,
  ULTIMATE_SPECS,
  UltimateId,
  WEAPON_SPECS,
  WeaponId,
} from '../game/types';
import { GadgetIconSvg, VitalityPipSvg, WeaponIconSvg } from './GameIcons';

export interface HudSnapshot {
  hp: number;
  maxHp: number;
  ghostHp: number;
  shield: number;
  maxShield: number;
  rage: number;
  maxRage: number;
  scrap: number;
  score: number;
  combo: number;
  stylePoints: number;
  styleFeed: StyleFeedItem[];
  wave: number;
  enemiesRemaining: number;
  activeWeapon: WeaponId;
  ammo: Record<WeaponId, number>;
  overdriveTimer: number;
  speedBoostTimer: number;
  freezeTimer: number;
  sandevistanTimer: number;
  frozenBulletsCount: number;
  ultimateId: UltimateId;
  waveBannerText: string | null;
  statusToast: string | null;
  autoAim: boolean;
  bossHp: number;
  bossMaxHp: number;
  bossPhase: 1 | 2 | 3;
  bossName?: string;
  mapId?: SchoolMapId;
  activeEvent?: SchoolEventId | null;
  activeEventTimer?: number;
}

interface GameHudProps {
  hud: HudSnapshot;
  muted: boolean;
  showTouchControls?: boolean;
  onSelectWeapon: (id: WeaponId) => void;
  onPlaceGadget: (kind: 'barricade' | 'turret') => void;
  onTriggerUltimate: () => void;
  onCycleUltimate: () => void;
  onToggleMute: () => void;
  onToggleAutoAim: () => void;
  onTogglePause: () => void;
  onRestart: () => void;
  onTouchMove?: (dx: number, dy: number) => void;
  onTouchFire?: (down: boolean) => void;
  onTouchDash?: () => void;
}

const WEAPON_ORDER: WeaponId[] = ['slingshot', 'shotgun', 'nailgun', 'acid', 'tesla'];

export function GameHud({
  hud,
  muted,
  showTouchControls,
  onSelectWeapon,
  onPlaceGadget,
  onTriggerUltimate,
  onCycleUltimate,
  onToggleMute,
  onToggleAutoAim,
  onTogglePause,
  onRestart,
  onTouchMove,
  onTouchFire,
  onTouchDash,
}: GameHudProps) {
  const hpRatio = Math.max(0, Math.min(1, hud.hp / hud.maxHp));
  const ghostRatio = Math.max(hpRatio, Math.min(1, hud.ghostHp / hud.maxHp));
  const shieldRatio = Math.max(0, Math.min(1, hud.shield / hud.maxShield));
  const rageRatio = Math.max(0, Math.min(1, hud.rage / hud.maxRage));
  const activeSpec = WEAPON_SPECS[hud.activeWeapon];
  const ultSpec = ULTIMATE_SPECS[hud.ultimateId];

  const styleRank = getStyleRankForPoints(hud.stylePoints);
  const styleProgress = getStyleProgressToNextRank(hud.stylePoints);

  // 5 discrete vitality sockets (each represents 20 HP)
  const pips: Array<'full' | 'cracked' | 'empty'> = [0, 1, 2, 3, 4].map((idx) => {
    const threshold = (idx + 1) * 20;
    if (hud.hp >= threshold) return 'full';
    if (hud.hp > idx * 20) return 'cracked';
    return 'empty';
  });

  return (
    <div className="fixed inset-0 z-10 pointer-events-none flex flex-col justify-between p-2.5 sm:p-5">
      {/* Critical Low HP Peripheral Vignette */}
      {hud.hp <= 30 && (
        <div
          className="fixed inset-0 pointer-events-none"
          style={{
            boxShadow: 'inset 0 0 90px rgba(220, 38, 38, 0.55)',
          }}
        />
      )}

      {/* TOP ROW: Cluster 1 (Top-Left Vitality & Shield) + Center Boss/Wave Banner + Cluster 2 (Top-Right Wave, Score, Style Meter & Utility) */}
      <div className="flex items-start justify-between gap-2 sm:gap-4 w-full">
        {/* Cluster 1: Top-Left Vitality Pips, Ghost Health Bar & Active Bonus Timers */}
        <div className="bg-[#101c17]/95 border-2 border-[#2a4539] rounded-lg px-2 py-1.5 sm:px-3.5 sm:py-2.5 shadow-[0_4px_0_#09100d] w-[160px] sm:w-auto sm:min-w-[275px] shrink-0">
          <div className="flex items-center justify-between gap-1.5 sm:gap-3 mb-1.5">
            <div
              className="flex items-center gap-0.5 sm:gap-1"
              aria-label={`Здоровье: ${Math.round(hud.hp)} из ${hud.maxHp}`}
            >
              {pips.map((state, idx) => (
                <VitalityPipSvg key={idx} state={state} />
              ))}
            </div>
            <div className="text-right">
              <span className="text-[9px] sm:text-[10px] font-bold tracking-wider uppercase text-[#9db8ad] block leading-none">
                ОЗ
              </span>
              <span className="font-mono-num text-base sm:text-xl font-bold text-[#fef3c7] hud-stroke">
                {Math.round(hud.hp)}
              </span>
            </div>
          </div>

          {/* Continuous HP bar with delayed trailing damage ghost bar */}
          <div className="relative h-2 sm:h-2.5 w-full bg-[#09110e] rounded overflow-hidden border border-[#233b30]">
            <div
              className="absolute inset-y-0 left-0 bg-amber-300/70 transition-transform duration-150 origin-left"
              style={{ width: '100%', transform: `scaleX(${ghostRatio})` }}
            />
            <div
              className="absolute inset-y-0 left-0 bg-[#ef4444] transition-transform duration-75 origin-left"
              style={{ width: '100%', transform: `scaleX(${hpRatio})` }}
            />
          </div>

          {/* Shield & Scrap readout */}
          <div className="mt-1.5 sm:mt-2 flex items-center justify-between gap-2 sm:gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between text-[10px] sm:text-[11px] font-mono-num text-[#bae6fd] mb-0.5">
                <span className="truncate">ЩИТ</span>
                <span>{Math.round(hud.shield)}</span>
              </div>
              <div className="h-1.5 w-full bg-[#09110e] rounded overflow-hidden border border-[#1e3a4c]">
                <div
                  className="h-full bg-[#38bdf8] transition-transform duration-75 origin-left"
                  style={{ width: '100%', transform: `scaleX(${shieldRatio})` }}
                />
              </div>
            </div>

            <div className="pl-2 border-l border-[#2a4539] text-right shrink-0">
              <span className="text-[9px] sm:text-[10px] font-bold uppercase text-[#9db8ad] block leading-none">
                ДЕТАЛИ
              </span>
              <span className="font-mono-num text-sm sm:text-lg font-bold text-amber-400">
                {Math.round(hud.scrap)}
              </span>
            </div>
          </div>

          {/* Active Power-Up & Sandevistan Timers */}
          {(hud.sandevistanTimer > 0 ||
            hud.overdriveTimer > 0 ||
            hud.speedBoostTimer > 0 ||
            hud.freezeTimer > 0) && (
            <div className="mt-1.5 pt-1 border-t border-[#233b30] flex flex-wrap items-center gap-1.5 text-[10px] sm:text-xs font-mono-num">
              {hud.sandevistanTimer > 0 && (
                <span className="text-[#00ff9d] font-extrabold">
                  САНДЕВИСТАН {hud.sandevistanTimer.toFixed(1)}с · ПУЛЬ: {hud.frozenBulletsCount}
                </span>
              )}
              {hud.overdriveTimer > 0 && (
                <span className="text-rose-300 font-bold">
                  x2 УРОН {hud.overdriveTimer.toFixed(1)}с
                </span>
              )}
              {hud.speedBoostTimer > 0 && (
                <span className="text-amber-300 font-bold">
                  БЕГ {hud.speedBoostTimer.toFixed(1)}с
                </span>
              )}
              {hud.freezeTimer > 0 && (
                <span className="text-sky-300 font-bold">
                  ЗВОНОК {hud.freezeTimer.toFixed(1)}с
                </span>
              )}
            </div>
          )}
        </div>

        {/* Center Transient Wave Banner + Boss Multi-Phase Health Bar + Random Event Alert */}
        <div className="hidden lg:flex flex-col items-center gap-2 text-center pointer-events-none max-w-md">
          {hud.bossHp > 0 && (
            <div className="w-[370px] px-4 py-2 rounded-lg bg-[#1c1026]/95 border-2 border-[#c084fc] shadow-[0_4px_0_#09100d]">
              <div className="flex items-center justify-between text-xs font-mono-num font-bold text-[#f5d0fe] mb-1">
                <span>
                  {(hud.bossName ?? 'ДИРЕКТОР ШКОЛЫ').toUpperCase()} · ФАЗА {hud.bossPhase}/3
                </span>
                <span>
                  {Math.round(hud.bossHp)}/{hud.bossMaxHp}
                </span>
              </div>
              <div className="h-2.5 w-full bg-[#09050d] rounded overflow-hidden border border-[#581c87]">
                <div
                  className="h-full bg-gradient-to-r from-[#e879f9] to-[#ef4444] transition-transform duration-75 origin-left"
                  style={{
                    width: '100%',
                    transform: `scaleX(${Math.max(0, Math.min(1, hud.bossHp / Math.max(1, hud.bossMaxHp)))})`,
                  }}
                />
              </div>
            </div>
          )}

          {hud.activeEvent && SCHOOL_EVENTS[hud.activeEvent] && (
            <div
              className="px-4 py-1.5 rounded-lg bg-[#16101c]/95 border-2 shadow-[0_4px_0_#09100d]"
              style={{ borderColor: SCHOOL_EVENTS[hud.activeEvent].color }}
            >
              <div
                className="font-display text-xs sm:text-sm tracking-wide uppercase"
                style={{ color: SCHOOL_EVENTS[hud.activeEvent].color }}
              >
                ЧП: {SCHOOL_EVENTS[hud.activeEvent].title}{' '}
                {hud.activeEventTimer && hud.activeEventTimer > 0
                  ? `(${hud.activeEventTimer.toFixed(0)}с)`
                  : ''}
              </div>
              <div className="font-mono-num text-[10px] text-[#e2ece7]">
                {SCHOOL_EVENTS[hud.activeEvent].subtitle}
              </div>
            </div>
          )}

          {hud.sandevistanTimer > 0 && (
            <div className="px-4 py-1.5 rounded-lg bg-[#041a14]/95 border-2 border-[#00ff9d] shadow-[0_0_24px_rgba(0,255,157,0.4)]">
              <div className="font-display text-sm sm:text-base text-[#00ff9d] tracking-wider uppercase">
                ВРЕМЯ И ПУЛИ ЗАМЕРЛИ ({hud.sandevistanTimer.toFixed(1)}с) · В СТАЗИСЕ: {hud.frozenBulletsCount} ПУЛЬ
              </div>
              <div className="font-mono-num text-[10px] sm:text-xs text-[#00f0ff] font-bold">
                Стреляй во врагов! После ульты (или по [C / ПКМ]) все пули сорвутся разом!
              </div>
            </div>
          )}

          {hud.waveBannerText && hud.sandevistanTimer <= 0 && (
            <div className="px-5 py-2 rounded-lg bg-[#14261f]/95 border-2 border-amber-400 shadow-[0_4px_0_#09100d]">
              <div className="font-display text-lg text-amber-300 tracking-wide">
                {hud.waveBannerText}
              </div>
              {hud.mapId && SCHOOL_MAPS[hud.mapId] && (
                <div className="font-mono-num text-[11px] text-emerald-300">
                  Локация: {SCHOOL_MAPS[hud.mapId].name}
                </div>
              )}
            </div>
          )}
          {hud.statusToast && !hud.waveBannerText && (
            <div className="px-4 py-1.5 rounded bg-[#14261f]/95 border border-[#4ade80] text-xs font-mono-num text-[#bbf7d0]">
              {hud.statusToast}
            </div>
          )}
        </div>

        {/* Cluster 2: Top-Right Wave Progress, Score, Utility Controls & ULTRAKILL Style Rank Meter */}
        <div className="flex flex-col items-end gap-1.5 sm:gap-2 shrink-0">
          <div className="flex flex-col sm:flex-row items-end sm:items-start gap-1.5 sm:gap-2.5">
            <div className="bg-[#101c17]/95 border-2 border-[#2a4539] rounded-lg px-2.5 py-1.5 sm:px-4 sm:py-2 shadow-[0_4px_0_#09100d] flex items-center gap-2.5 sm:gap-5">
              <div>
                <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-[#9db8ad] block">
                  УРОК
                </span>
                <div className="font-mono-num text-base sm:text-2xl font-bold text-[#4ade80] leading-tight hud-stroke">
                  {hud.wave}/{MAX_WAVES}
                </div>
                <span className="text-[10px] sm:text-[11px] font-mono-num text-[#cbd5e1] block">
                  Зомби: {hud.enemiesRemaining}
                </span>
              </div>

              <div className="pl-2.5 sm:pl-4 border-l border-[#2a4539] text-right">
                <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-[#9db8ad] block">
                  ОЧКИ
                </span>
                <div className="font-mono-num text-base sm:text-2xl font-bold text-[#fef3c7] leading-tight hud-stroke">
                  {Math.round(hud.score)}
                </div>
                <span
                  className="text-[10px] sm:text-[11px] font-mono-num font-bold block"
                  style={{ color: styleRank.color }}
                >
                  [{styleRank.id}] x{styleRank.multiplier.toFixed(1)}
                </span>
              </div>
            </div>

            {/* Utility Icon Buttons: Auto-Aim [F], Mute [M], Pause [P], Restart [R] */}
            <div className="flex flex-row gap-1 sm:gap-1.5 pointer-events-auto">
              <button
                type="button"
                tabIndex={-1}
                aria-label={hud.autoAim ? 'Выключить авто-прицел [F]' : 'Включить авто-прицел [F]'}
                onClick={(e) => {
                  e.currentTarget.blur();
                  onToggleAutoAim();
                }}
                className={`px-1.5 sm:px-2.5 h-8 sm:h-10 rounded-lg border-2 flex items-center justify-center font-mono-num text-[10px] sm:text-xs font-bold shadow-[0_3px_0_#09100d] cursor-pointer whitespace-nowrap ${
                  hud.autoAim
                    ? 'bg-[#1b3329] border-[#4ade80] text-[#4ade80]'
                    : 'bg-[#101c17] border-[#2a4539] text-[#9db8ad] hover:border-amber-400'
                }`}
                title="Авто-прицел [F]"
              >
                <span className="hidden sm:inline">ПРИЦЕЛ </span>[F]: {hud.autoAim ? 'АВТО' : 'МЫШЬ'}
              </button>

              <button
                type="button"
                tabIndex={-1}
                aria-label={muted ? 'Включить звук [M]' : 'Выключить звук [M]'}
                onClick={(e) => {
                  e.currentTarget.blur();
                  onToggleMute();
                }}
                className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-[#101c17] border-2 border-[#2a4539] hover:border-amber-400 flex items-center justify-center text-[#e2ece7] shadow-[0_3px_0_#09100d] cursor-pointer"
                title="Звук [M]"
              >
                {muted ? (
                  <svg viewBox="0 0 24 24" className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" strokeWidth="2.2">
                    <path d="M11 5L6 9H2V15H6L11 19V5Z" />
                    <path d="M23 9L17 15M17 9L23 15" stroke="#fb7185" />
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" strokeWidth="2.2">
                    <path d="M11 5L6 9H2V15H6L11 19V5Z" />
                    <path d="M15.5 8.5C16.8 9.8 16.8 14.2 15.5 15.5M19 5C22 8 22 16 19 19" stroke="#4ade80" />
                  </svg>
                )}
              </button>

              <button
                type="button"
                tabIndex={-1}
                aria-label="Пауза [P]"
                onClick={(e) => {
                  e.currentTarget.blur();
                  onTogglePause();
                }}
                className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-[#101c17] border-2 border-[#2a4539] hover:border-amber-400 flex items-center justify-center text-[#e2ece7] shadow-[0_3px_0_#09100d] cursor-pointer"
                title="Пауза [P / Esc]"
              >
                <svg viewBox="0 0 24 24" className="w-4 h-4 sm:w-5 sm:h-5" fill="currentColor">
                  <rect x="6" y="5" width="4" height="14" rx="1" />
                  <rect x="14" y="5" width="4" height="14" rx="1" />
                </svg>
              </button>

              <button
                type="button"
                tabIndex={-1}
                aria-label="Заново [R]"
                onClick={(e) => {
                  e.currentTarget.blur();
                  onRestart();
                }}
                className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-[#101c17] border-2 border-[#2a4539] hover:border-amber-400 flex items-center justify-center text-[#e2ece7] shadow-[0_3px_0_#09100d] cursor-pointer"
                title="Начать заново [R]"
              >
                <svg viewBox="0 0 24 24" className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <path d="M3 12a9 9 0 1 0 3-6.7L3 8" />
                  <path d="M3 3v5h5" />
                </svg>
              </button>
            </div>
          </div>

          {/* ULTRAKILL Style Rank Box & Live Action Feed (Desktop/Tablet) */}
          <div
            className="hidden sm:flex flex-col w-[240px] rounded-lg bg-[#0d1612]/95 border-2 px-3 py-2 shadow-[0_4px_0_#09100d]"
            style={{ borderColor: styleRank.color }}
          >
            <div className="flex items-center justify-between gap-2">
              <span
                className="font-display text-sm tracking-wide truncate"
                style={{ color: styleRank.color }}
              >
                {styleRank.title}
              </span>
              <span className="font-mono-num text-xs font-extrabold text-[#fef3c7] shrink-0">
                x{styleRank.multiplier.toFixed(2)}
              </span>
            </div>

            <div className="mt-1 h-1.5 w-full bg-[#070b09] rounded overflow-hidden border border-[#1e2f28]">
              <div
                className="h-full transition-transform duration-75 origin-left"
                style={{
                  width: '100%',
                  backgroundColor: styleRank.color,
                  transform: `scaleX(${styleProgress})`,
                }}
              />
            </div>

            {hud.styleFeed.length > 0 && (
              <div className="mt-1.5 pt-1 border-t border-[#1e2f28] flex flex-col gap-0.5">
                {hud.styleFeed.slice(0, 3).map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between text-[10px] font-mono-num font-bold leading-tight"
                    style={{ color: item.color }}
                  >
                    <span className="truncate">{item.text}</span>
                    <span>+{item.points}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* BOTTOM ROW: Active Weapon Role Bar + Interactive Arsenal Dock [1-5] + Gadgets [E, Q] + Ultimate [C] */}
      <div className="flex flex-col items-center gap-1.5 w-full">
        {/* Compact Active Weapon Role Clue + Quick Ultimate Switcher [V] */}
        <div className="px-2.5 sm:px-3 py-1 rounded bg-[#101c17]/90 border border-[#2a4539] text-[10px] sm:text-xs font-mono-num text-[#d5e3dc] flex items-center gap-1.5 sm:gap-2.5 max-w-full overflow-hidden">
          <span className="font-bold text-amber-300 shrink-0">{activeSpec.name}</span>
          <span className="text-[#64748b] shrink-0">·</span>
          <span className="truncate">{activeSpec.role}</span>
          <button
            type="button"
            tabIndex={-1}
            onClick={(e) => {
              e.currentTarget.blur();
              onCycleUltimate();
            }}
            style={{ borderColor: ultSpec.accent, color: ultSpec.accent }}
            className="pointer-events-auto ml-1 px-1.5 py-0.5 rounded border bg-[#0c1612] hover:brightness-125 font-bold shrink-0 cursor-pointer"
            title="Сменить супер-способность [V]"
          >
            [V] Ульта: {ultSpec.shortName}
          </button>
        </div>

        {/* Interactive Weapon Slots [1-5] + Defensive Gadgets [E, Q] + Ultimate [C] */}
        <div className="pointer-events-auto flex flex-nowrap justify-center items-center gap-1 sm:gap-2 bg-[#101c17]/95 border-2 border-[#2a4539] rounded-xl p-1 sm:p-1.5 shadow-[0_4px_0_#09100d] max-w-full">
          {WEAPON_ORDER.map((wId) => {
            const spec = WEAPON_SPECS[wId];
            const isSelected = hud.activeWeapon === wId;
            const ammoCount = hud.ammo[wId];
            const isOut = ammoCount === 0;

            return (
              <button
                key={wId}
                type="button"
                tabIndex={-1}
                onClick={(e) => {
                  e.currentTarget.blur();
                  onSelectWeapon(wId);
                }}
                aria-label={`${spec.name} (клавиша ${spec.key})`}
                className={`relative flex flex-col items-center justify-between w-[40px] sm:w-[68px] h-[50px] sm:h-[60px] rounded-lg px-1 py-1 border-2 transition-colors cursor-pointer shrink-0 ${
                  isSelected
                    ? 'bg-[#1b3329] border-amber-400 text-[#fef3c7]'
                    : isOut
                    ? 'bg-[#0c1411] border-[#1c2e26] text-[#64748b] opacity-60'
                    : 'bg-[#12211b] border-[#264035] hover:border-[#4ade80] text-[#cbd5e1]'
                }`}
              >
                <div className="w-full flex items-center justify-between text-[9px] sm:text-[10px] font-mono-num leading-none">
                  <span className="font-bold text-amber-300">[{spec.key}]</span>
                  <span className={isOut ? 'text-rose-400 font-bold' : 'text-[#e2ece7]'}>
                    {ammoCount < 0 ? '∞' : ammoCount}
                  </span>
                </div>
                <WeaponIconSvg id={wId} />
                <span className="text-[8px] sm:text-[9px] font-semibold tracking-tight truncate w-full text-center leading-none">
                  {spec.name.split(' ')[0]}
                </span>
              </button>
            );
          })}

          <div className="hidden sm:block h-10 w-[2px] bg-[#2a4539] mx-0.5" />

          {/* Barricade Gadget [E] */}
          <button
            type="button"
            tabIndex={-1}
            onClick={(e) => {
              e.currentTarget.blur();
              onPlaceGadget('barricade');
            }}
            aria-label={`Поставить парту-баррикаду за ${BARRICADE_COST} деталей (клавиша E)`}
            className={`flex flex-col items-center justify-between w-[43px] sm:w-[68px] h-[50px] sm:h-[60px] rounded-lg px-1 py-1 border-2 cursor-pointer shrink-0 ${
              hud.scrap >= BARRICADE_COST
                ? 'bg-[#182921] border-amber-500/80 hover:border-amber-300 text-[#fef3c7]'
                : 'bg-[#0c1411] border-[#1c2e26] text-[#64748b] opacity-65'
            }`}
          >
            <div className="w-full flex items-center justify-between text-[9px] sm:text-[10px] font-mono-num leading-none">
              <span className="font-bold text-amber-300">[E]</span>
              <span className="text-amber-200">{BARRICADE_COST}д</span>
            </div>
            <GadgetIconSvg kind="barricade" />
            <span className="text-[8px] sm:text-[9px] font-semibold leading-none truncate w-full text-center">
              Парта
            </span>
          </button>

          {/* Globe Auto-Turret Gadget [Q] */}
          <button
            type="button"
            tabIndex={-1}
            onClick={(e) => {
              e.currentTarget.blur();
              onPlaceGadget('turret');
            }}
            aria-label={`Поставить глобус-турель за ${TURRET_COST} деталей (клавиша Q)`}
            className={`flex flex-col items-center justify-between w-[43px] sm:w-[68px] h-[50px] sm:h-[60px] rounded-lg px-1 py-1 border-2 cursor-pointer shrink-0 ${
              hud.scrap >= TURRET_COST
                ? 'bg-[#132833] border-sky-400/80 hover:border-sky-300 text-[#e0f2fe]'
                : 'bg-[#0c1411] border-[#1c2e26] text-[#64748b] opacity-65'
            }`}
          >
            <div className="w-full flex items-center justify-between text-[9px] sm:text-[10px] font-mono-num leading-none">
              <span className="font-bold text-sky-300">[Q]</span>
              <span className="text-sky-200">{TURRET_COST}д</span>
            </div>
            <GadgetIconSvg kind="turret" />
            <span className="text-[8px] sm:text-[9px] font-semibold leading-none truncate w-full text-center">
              Турель
            </span>
          </button>

          {/* Selectable Ultimate Slot [C / Right-Click] */}
          <button
            type="button"
            tabIndex={-1}
            onClick={(e) => {
              e.currentTarget.blur();
              onTriggerUltimate();
            }}
            aria-label={`Супер-способность ${ultSpec.shortName} (клавиша C или правая кнопка мыши)`}
            style={{
              borderColor:
                hud.sandevistanTimer > 0
                  ? '#00ff9d'
                  : rageRatio >= 1
                  ? ultSpec.accent
                  : '#3b2754',
              boxShadow:
                hud.sandevistanTimer > 0
                  ? '0 0 18px #00ff9d88'
                  : rageRatio >= 1
                  ? `0 0 14px ${ultSpec.accent}66`
                  : 'none',
            }}
            className={`relative overflow-hidden flex flex-col items-center justify-between w-[46px] sm:w-[76px] h-[50px] sm:h-[60px] rounded-lg px-1 py-1 border-2 cursor-pointer shrink-0 ${
              hud.sandevistanTimer > 0
                ? 'bg-[#06281e] text-[#00ff9d]'
                : rageRatio >= 1
                ? 'bg-[#172620] text-[#fef08a]'
                : 'bg-[#14101c] text-[#cbd5e1] opacity-80'
            }`}
            title={
              hud.sandevistanTimer > 0
                ? 'Запустить Хроно-Залп остановившихся пуль прямо сейчас! [C / ПКМ]'
                : `${ultSpec.title} [C / ПКМ]`
            }
          >
            <div
              className="absolute inset-x-0 bottom-0 pointer-events-none transition-all duration-100"
              style={{
                height:
                  hud.sandevistanTimer > 0
                    ? '100%'
                    : `${Math.round(rageRatio * 100)}%`,
                backgroundColor:
                  hud.sandevistanTimer > 0 ? '#00ff9d33' : `${ultSpec.accent}33`,
              }}
            />
            <div className="relative z-10 w-full flex items-center justify-between text-[9px] sm:text-[10px] font-mono-num leading-none">
              <span className="font-bold" style={{ color: ultSpec.accent }}>
                [C]
              </span>
              <span className="font-bold text-white">
                {hud.sandevistanTimer > 0
                  ? `${hud.frozenBulletsCount}п`
                  : `${Math.round(rageRatio * 100)}%`}
              </span>
            </div>
            <div className="relative z-10">
              <GadgetIconSvg kind={hud.ultimateId} />
            </div>
            <span className="relative z-10 text-[8px] sm:text-[9px] font-bold leading-none truncate w-full text-center">
              {hud.sandevistanTimer > 0 ? 'ЗАЛП!' : ultSpec.shortName}
            </span>
          </button>
        </div>

        {/* Mobile / Touch Virtual D-Pad & Action Buttons (Shown when enabled in Settings or on Touch Devices) */}
        {showTouchControls && onTouchMove && onTouchFire && onTouchDash && (
          <div className="w-full flex items-end justify-between px-2 pt-1 pointer-events-auto">
            {/* Left Virtual D-Pad */}
            <div className="grid grid-cols-3 gap-1 w-28 h-28 bg-[#0c1612]/85 border border-[#2a4539] rounded-xl p-1">
              <div />
              <button
                type="button"
                onPointerDown={() => onTouchMove(0, -1)}
                onPointerUp={() => onTouchMove(0, 0)}
                className="rounded bg-[#1a3027] active:bg-amber-400 text-xs font-bold text-white"
              >
                ▲
              </button>
              <div />
              <button
                type="button"
                onPointerDown={() => onTouchMove(-1, 0)}
                onPointerUp={() => onTouchMove(0, 0)}
                className="rounded bg-[#1a3027] active:bg-amber-400 text-xs font-bold text-white"
              >
                ◀
              </button>
              <button
                type="button"
                onPointerDown={() => onTouchMove(0, 0)}
                className="rounded bg-[#09100d] text-[9px] font-mono-num text-[#9db8ad]"
              >
                ХОД
              </button>
              <button
                type="button"
                onPointerDown={() => onTouchMove(1, 0)}
                onPointerUp={() => onTouchMove(0, 0)}
                className="rounded bg-[#1a3027] active:bg-amber-400 text-xs font-bold text-white"
              >
                ▶
              </button>
              <div />
              <button
                type="button"
                onPointerDown={() => onTouchMove(0, 1)}
                onPointerUp={() => onTouchMove(0, 0)}
                className="rounded bg-[#1a3027] active:bg-amber-400 text-xs font-bold text-white"
              >
                ▼
              </button>
              <div />
            </div>

            {/* Right Touch Combat Buttons */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onPointerDown={onTouchDash}
                className="w-14 h-14 rounded-full bg-[#132833]/90 border-2 border-sky-400 text-sky-200 font-display text-xs shadow-lg"
              >
                РЫВОК
              </button>
              <button
                type="button"
                onPointerDown={() => onTouchFire(true)}
                onPointerUp={() => onTouchFire(false)}
                onPointerCancel={() => onTouchFire(false)}
                className="w-16 h-16 rounded-full bg-amber-500/90 border-2 border-[#09100d] text-[#09100d] font-display text-xs shadow-lg"
              >
                ОГОНЬ
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
