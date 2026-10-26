import React from 'react';
import {
  ACHIEVEMENT_SPECS,
  GamePhase,
  RunSummary,
  STYLE_RANKS,
  UPGRADE_SPECS,
  UpgradeId,
  WaveReport,
} from '../game/types';

interface StatusModalProps {
  phase: GamePhase;
  summary: RunSummary | null;
  waveReport: WaveReport | null;
  availableUpgrades?: UpgradeId[];
  onSelectUpgrade: (id: UpgradeId) => void;
  onResume: () => void;
  onRestart: () => void;
  onReturnTitle: () => void;
  onOpenSettings?: () => void;
}

export function StatusModal({
  phase,
  summary,
  waveReport,
  availableUpgrades,
  onSelectUpgrade,
  onResume,
  onRestart,
  onReturnTitle,
  onOpenSettings,
}: StatusModalProps) {
  if (phase !== 'paused' && phase !== 'gameover' && phase !== 'wave_clear') return null;

  if (phase === 'wave_clear' && waveReport) {
    const gradeSpec =
      STYLE_RANKS.find((r) => r.id === waveReport.finalGrade) ?? STYLE_RANKS[0];

    const upgradeChoices =
      availableUpgrades && availableUpgrades.length > 0
        ? availableUpgrades
            .map((id) => UPGRADE_SPECS.find((u) => u.id === id))
            .filter((u): u is NonNullable<typeof u> => Boolean(u))
        : UPGRADE_SPECS.slice(0, 3);

    return (
      <div
        className="fixed inset-0 z-30 flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
        style={{ backgroundColor: 'rgba(9, 15, 13, 0.85)' }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="wave-clear-title"
      >
        <div className="w-full max-w-xl rounded-xl bg-[#11201a] border-4 border-[#b45309] p-5 sm:p-6 shadow-[0_12px_0_#09100d] text-[#f4f1ea]">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div>
              <div className="text-xs font-mono-num uppercase tracking-wider text-amber-300">
                ПЕРЕМЕНА · ИТОГИ {waveReport.wave}-ГО УРОКА
              </div>
              <h2 id="wave-clear-title" className="font-display text-2xl sm:text-3xl text-[#fef3c7]">
                УРОК ЗАЧИЩЕН!
              </h2>
            </div>

            <div
              className="px-3.5 py-1.5 rounded-lg border-2 text-right shrink-0"
              style={{
                borderColor: gradeSpec.color,
                backgroundColor: gradeSpec.bgColor,
              }}
            >
              <span className="text-[10px] font-mono-num uppercase text-[#e2ece7] block">
                ИТОГОВЫЙ РАНГ
              </span>
              <span
                className="font-display text-xl sm:text-2xl leading-none"
                style={{ color: gradeSpec.color }}
              >
                {gradeSpec.id}
              </span>
            </div>
          </div>

          {/* 4 Tabular-Nums Wave Performance Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-5">
            <div className="rounded-lg bg-[#0b1511] border border-[#2a4539] p-2.5">
              <span className="text-[10px] font-bold uppercase text-[#9db8ad] block">ВРЕМЯ</span>
              <span className="font-mono-num text-lg sm:text-xl font-bold text-[#fef3c7]">
                {waveReport.clearTimeSec.toFixed(1)}с
              </span>
            </div>
            <div className="rounded-lg bg-[#0b1511] border border-[#2a4539] p-2.5">
              <span className="text-[10px] font-bold uppercase text-[#9db8ad] block">ТОЧНОСТЬ</span>
              <span className="font-mono-num text-lg sm:text-xl font-bold text-[#38bdf8]">
                {waveReport.accuracy}%
              </span>
            </div>
            <div className="rounded-lg bg-[#0b1511] border border-[#2a4539] p-2.5">
              <span className="text-[10px] font-bold uppercase text-[#9db8ad] block">УБИТО</span>
              <span className="font-mono-num text-lg sm:text-xl font-bold text-[#4ade80]">
                {waveReport.kills}
              </span>
            </div>
            <div className="rounded-lg bg-[#0b1511] border border-[#2a4539] p-2.5">
              <span className="text-[10px] font-bold uppercase text-[#9db8ad] block">УРОН ПОЛУЧЕН</span>
              <span className="font-mono-num text-lg sm:text-xl font-bold text-[#fb7185]">
                {waveReport.damageTaken}
              </span>
            </div>
          </div>

          <div className="text-xs font-mono-num uppercase tracking-wider text-amber-300 mb-2">
            ВЫБЕРИТЕ УЛУЧШЕНИЕ ИЛИ МОДИФИКАЦИЮ ОРУЖИЯ [1 / 2 / 3 ИЛИ ENTER]:
          </div>

          <div className="flex flex-col gap-2.5">
            {upgradeChoices.map((upg, idx) => (
              <button
                key={upg.id}
                type="button"
                onClick={() => onSelectUpgrade(upg.id)}
                className="w-full text-left p-3 rounded-lg bg-[#162921] hover:bg-[#1f3a2f] border-2 border-[#2e4d3f] hover:border-amber-400 transition-colors cursor-pointer flex items-center justify-between gap-3"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span
                      className="font-mono-num text-xs font-bold px-1.5 py-0.5 rounded bg-[#09100d]"
                      style={{ color: upg.accent }}
                    >
                      [{idx + 1}]
                    </span>
                    <span className="font-display text-sm sm:text-base text-[#fef3c7]">
                      {upg.title}
                    </span>
                    {upg.weaponMod && (
                      <span className="text-[10px] font-mono-num font-bold px-1.5 py-0.5 rounded bg-amber-400/20 text-amber-300">
                        МОД ОРУЖИЯ
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[#cbd5e1] mt-1">{upg.description}</p>
                </div>
                <span className="font-mono-num text-xs font-bold text-amber-300 shrink-0">
                  ВЫБРАТЬ →
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (phase === 'paused') {
    return (
      <div
        className="fixed inset-0 z-30 flex items-center justify-center p-4"
        style={{ backgroundColor: 'rgba(9, 15, 13, 0.82)' }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="pause-modal-title"
      >
        <div className="w-full max-w-md rounded-xl bg-[#13241d] border-4 border-[#b45309] p-6 shadow-[0_12px_0_#09100d] text-[#f4f1ea]">
          <div className="text-xs font-mono-num uppercase tracking-wider text-amber-300 mb-1">
            ПЕРЕМЕНА · ИГРА НА ПАУЗЕ
          </div>
          <h2 id="pause-modal-title" className="font-display text-3xl text-[#fef3c7] mb-3">
            ПАУЗА
          </h2>
          <p className="text-sm text-[#cbd5e1] mb-5">
            Меняйте оружие [1-5] между выстрелами для бонуса +БЫСТРАЯ СМЕНА, сбивайте замах учителей выстрелом (+ПАРИРОВАНИЕ!) и ищите Секретные Тайники в каждом отсеке школы!
          </p>

          <div className="flex flex-col gap-2.5">
            <button
              type="button"
              onClick={onResume}
              className="w-full py-3 px-5 rounded-lg bg-[#4ade80] hover:bg-[#86efac] text-[#09100d] font-display text-base tracking-wide border-2 border-[#09100d] shadow-[0_3px_0_#14532d] cursor-pointer whitespace-nowrap"
            >
              ПРОДОЛЖИТЬ УРОК [ESC / P]
            </button>
            {onOpenSettings && (
              <button
                type="button"
                onClick={onOpenSettings}
                className="w-full py-2.5 px-5 rounded-lg bg-[#182c23] hover:bg-[#223d31] text-amber-300 font-bold text-sm border border-[#355949] cursor-pointer whitespace-nowrap"
              >
                НАСТРОЙКИ ЗВУКА И ЭКРАНА
              </button>
            )}
            <button
              type="button"
              onClick={onRestart}
              className="w-full py-2.5 px-5 rounded-lg bg-[#f59e0b] hover:bg-[#fbbf24] text-[#09100d] font-bold text-sm border-2 border-[#09100d] cursor-pointer whitespace-nowrap"
            >
              НАЧАТЬ ЗАНОВО [R]
            </button>
            <button
              type="button"
              onClick={onReturnTitle}
              className="w-full py-2.5 px-5 rounded-lg bg-[#1a3027] hover:bg-[#244034] text-[#d5e3dc] font-semibold text-sm border border-[#355949] cursor-pointer whitespace-nowrap"
            >
              В ГЛАВНОЕ МЕНЮ
            </button>
          </div>
        </div>
      </div>
    );
  }

  const isVictory = summary?.victory ?? false;
  const highestRankSpec =
    STYLE_RANKS.find((r) => r.id === (summary?.highestStyleRank ?? 'D')) ?? STYLE_RANKS[0];
  const unlockedList = (summary?.newlyUnlockedAchievements ?? [])
    .map((id) => ACHIEVEMENT_SPECS.find((a) => a.id === id))
    .filter((a): a is NonNullable<typeof a> => Boolean(a));

  return (
    <div
      className="fixed inset-0 z-30 flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
      style={{ backgroundColor: 'rgba(9, 15, 13, 0.88)' }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="gameover-modal-title"
    >
      <div className="w-full max-w-xl rounded-xl bg-[#13241d] border-4 border-[#b45309] p-5 sm:p-7 shadow-[0_12px_0_#09100d] text-[#f4f1ea]">
        <div className="flex items-start justify-between gap-3 mb-2">
          <div>
            <div className="text-xs font-mono-num uppercase tracking-wider text-amber-300 mb-1">
              {isVictory
                ? 'ШКОЛЬНЫЙ ЗВОНОК · ЭКЗАМЕН СДАН!'
                : 'НЕУДОВЛЕТВОРИТЕЛЬНО · ИТОГИ ВЫЖИВАНИЯ'}
            </div>
            <h2
              id="gameover-modal-title"
              className={`font-display text-2xl sm:text-4xl ${
                isVictory ? 'text-[#4ade80]' : 'text-[#fb7185]'
              }`}
            >
              {isVictory ? 'БОЛЬШАЯ ПЕРЕМЕНА!' : 'КАРАНТИН ПРОРВАН'}
            </h2>
          </div>

          <div
            className="px-3 py-1.5 rounded-lg border-2 text-right shrink-0"
            style={{
              borderColor: highestRankSpec.color,
              backgroundColor: highestRankSpec.bgColor,
            }}
          >
            <span className="text-[10px] font-mono-num uppercase text-[#e2ece7] block">
              МАКС. СТИЛЬ
            </span>
            <span
              className="font-display text-xl leading-none"
              style={{ color: highestRankSpec.color }}
            >
              {highestRankSpec.id}
            </span>
          </div>
        </div>

        <p className="text-xs sm:text-sm text-[#cbd5e1] mb-4">
          {isVictory
            ? 'Вы сокрушили всех 4 Боссов педсовета и освободили Школу №13 от карантина!'
            : 'Учителя-зомби окружили вас. Заработанные Медали сохранены — прокачайте навыки в Мастерской!'}
        </p>

        {/* Detailed 6-Card End-of-Run Telemetry Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 mb-4">
          <div className="rounded-lg bg-[#0d1814] border border-[#2a4539] p-2.5">
            <span className="text-[10px] font-bold uppercase text-[#9db8ad] block">
              УРОКИ / ВРЕМЯ
            </span>
            <span className="font-mono-num text-lg sm:text-xl font-bold text-[#fef3c7]">
              {summary?.waveReached ?? 1}/{summary?.maxWaves ?? 5} · {Math.round(summary?.clearTimeSec ?? 0)}с
            </span>
          </div>

          <div className="rounded-lg bg-[#0d1814] border border-[#2a4539] p-2.5">
            <span className="text-[10px] font-bold uppercase text-[#9db8ad] block">
              СЧЁТ / РЕКОРД
            </span>
            <span className="font-mono-num text-lg sm:text-xl font-bold text-amber-300">
              {Math.round(summary?.score ?? 0)}
            </span>
            <span className="text-[10px] font-mono-num text-[#9db8ad] block">
              Рекорд: {Math.round(summary?.bestScore ?? 0)}
            </span>
          </div>

          <div className="rounded-lg bg-[#0d1814] border border-[#2a4539] p-2.5">
            <span className="text-[10px] font-bold uppercase text-[#9db8ad] block">
              ВРАГИ / БОССЫ
            </span>
            <span className="font-mono-num text-lg sm:text-xl font-bold text-[#4ade80]">
              {summary?.teachersDefeated ?? 0} / Боссов: {summary?.bossesDefeated ?? 0}
            </span>
          </div>

          <div className="rounded-lg bg-[#0d1814] border border-[#2a4539] p-2.5">
            <span className="text-[10px] font-bold uppercase text-[#9db8ad] block">
              НАНЕСЁННЫЙ / ПОЛУЧЕННЫЙ УРОН
            </span>
            <span className="font-mono-num text-base sm:text-lg font-bold text-[#38bdf8]">
              {Math.round(summary?.damageDealt ?? 0)} /{' '}
              <span className="text-rose-400">{Math.round(summary?.damageTaken ?? 0)}</span>
            </span>
          </div>

          <div className="rounded-lg bg-[#0d1814] border border-[#2a4539] p-2.5">
            <span className="text-[10px] font-bold uppercase text-[#9db8ad] block">
              МЕТКОСТЬ / ЛУЧШЕЕ КОМБО
            </span>
            <span className="font-mono-num text-base sm:text-lg font-bold text-[#fef3c7]">
              {summary?.accuracy ?? 100}% · x{summary?.bestCombo ?? 1}
            </span>
          </div>

          <div className="rounded-lg bg-[#0d1814] border border-amber-400/60 p-2.5">
            <span className="text-[10px] font-bold uppercase text-amber-300 block">
              НАГРАДА ЗА ЗАБЕГ
            </span>
            <span className="font-mono-num text-lg sm:text-xl font-extrabold text-amber-300">
              +{summary?.medalsEarned ?? 0} МЕДАЛЕЙ
            </span>
          </div>
        </div>

        {/* Newly Unlocked Achievements Banner */}
        {unlockedList.length > 0 && (
          <div className="mb-4 rounded-xl bg-[#0b1511] border-2 border-[#4ade80] p-3">
            <div className="text-[11px] font-mono-num font-bold uppercase text-[#4ade80] mb-1.5">
              НОВЫЕ ДОСТИЖЕНИЯ РАЗБЛОКИРОВАНЫ ({unlockedList.length}):
            </div>
            <div className="flex flex-wrap gap-2">
              {unlockedList.map((ach) => (
                <span
                  key={ach.id}
                  className="px-2.5 py-1 rounded bg-[#14261f] border border-emerald-400/50 text-xs font-mono-num text-[#fef3c7]"
                >
                  {ach.title} (+{ach.rewardMedals} МЕД.)
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3">
          <button
            type="button"
            data-start="true"
            onClick={onRestart}
            className="flex-1 py-3.5 px-6 rounded-lg bg-[#f59e0b] hover:bg-[#fbbf24] text-[#09100d] font-display text-base tracking-wide border-2 border-[#09100d] shadow-[0_4px_0_#78350f] cursor-pointer whitespace-nowrap"
          >
            {isVictory ? 'СЫГРАТЬ ЕЩЁ РАЗ [ENTER]' : 'ПОПРОБОВАТЬ СНОВА [ENTER]'}
          </button>
          <button
            type="button"
            onClick={onReturnTitle}
            className="py-3.5 px-5 rounded-lg bg-[#1a3027] hover:bg-[#244034] text-[#d5e3dc] font-semibold text-sm border border-[#355949] cursor-pointer whitespace-nowrap"
          >
            В МЕНЮ И МАСТЕРСКУЮ
          </button>
        </div>
      </div>
    </div>
  );
}
