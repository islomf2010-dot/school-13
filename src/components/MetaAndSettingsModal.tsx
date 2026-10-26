import React, { useState } from 'react';
import {
  ACHIEVEMENT_SPECS,
  CharacterSkinId,
  GameSettings,
  getMetaUpgradeCost,
  META_UPGRADE_SPECS,
  MetaUpgradeId,
  SaveProfile,
  SKIN_SPECS,
} from '../game/types';

export type OverlayModalTab = 'shop' | 'achievements' | 'settings' | 'tutorial' | null;

interface MetaAndSettingsModalProps {
  activeTab: OverlayModalTab;
  onClose: () => void;
  saveProfile: SaveProfile;
  onBuyMetaUpgrade: (id: MetaUpgradeId) => void;
  onUnlockOrEquipSkin: (id: CharacterSkinId) => void;
  onUpdateSettings: (next: Partial<GameSettings>) => void;
  onResetSave: () => void;
  onCompleteTutorial: () => void;
}

const TUTORIAL_STEPS = [
  {
    step: 1,
    title: '1. ПЕРЕДВИЖЕНИЕ, РЫВОК И ОГОНЬ',
    subtitle: 'Основы выживания в карантинной зоне Школы №13',
    bullets: [
      'Передвигайтесь клавишами [WASD] или стрелками (на смартфонах — левый виртуальный джойстик).',
      'Целитесь курсором мыши и ведите огонь через [ЛКМ] или [Пробел]. Клавиша [F] включает авто-прицел.',
      'Нажмите [Shift] для стремительного Рывка с неуязвимостью! Рывок сквозь красную зону замаха учителя даёт бонус стиля +УКЛОНЕНИЕ В МИЛЛИМЕТРЕ.',
    ],
    badge: 'ДВИЖЕНИЕ И БОЙ',
    accent: '#4ade80',
  },
  {
    step: 2,
    title: '2. АРСЕНАЛ [1–5], МОДИФИКАЦИИ И КОМБО ОРУЖИЯ',
    subtitle: 'Быстрая смена оружия и элементальные синергии',
    bullets: [
      'Переключайте 5 видов школьного оружия клавишами [1–5] или колёсиком мыши: Рогатка [1], Дробовик-Тубус [2], Гвоздомёт [3], Хим-Распылитель [4] и Пушка Теслы [5].',
      'Смена оружия перед выстрелом даёт +25% урона и бонус стиля +БЫСТРАЯ СМЕНА!',
      'Выстрел из Дробовика [2] или Пушки Теслы [5] в лужу кислоты Хим-Распылителя [4] вызывает мощный +КАТАЛИЗАТОР ВЗРЫВА!',
      'На переменах между уроками выбирайте боевые модификации оружия (рикошет, пиро-патроны, гипер-привод, электро-шок).',
    ],
    badge: 'АРСЕНАЛ И СИНЕРГИИ',
    accent: '#38bdf8',
  },
  {
    step: 3,
    title: '3. ПАРИРОВАНИЕ И СУПЕРСПОСОБНОСТИ [C / ПКМ]',
    subtitle: 'Хроно-имплант «Сандевистан», Катана Шиноби и Большой Звонок',
    bullets: [
      'Когда учитель замахивается (вокруг него вспыхивает красный круг), выстрелите в него тяжёлым оружием или рогаткой либо сбейте вражескую линейку в полёте для +ПАРИРОВАНИЯ!',
      'При 100% шкалы ульты нажмите [C] или [ПКМ]:',
      '• «САНДЕВИСТАН» — останавливает время на 6.5с и включает хроматический след. Все выпущенные пули замирают и срываются в цель разом!',
      '• «КАТАНА ШИНОБИ» — персонаж обнажает проклятый клинок в стойке Иайдо и телепортируется за спины врагов!',
      '• «БОЛЬШОЙ ЗВОНОК» — золотой колокол оглушает и отбрасывает всех зомби вокруг!',
    ],
    badge: 'УЛЬТА И ПАРИРОВАНИЕ',
    accent: '#facc15',
  },
  {
    step: 4,
    title: '4. ИНЖЕНЕРИЯ [E, Q], КАРТЫ, ТАЙНИКИ И СОБЫТИЯ',
    subtitle: 'Турели, секретные сейфы и случайные ЧП',
    bullets: [
      'Собирайте Детали с поверженных учителей: [E] строит Парту-Баррикаду (25 деталей), а [Q] ставит автоматическую Глобус-Турель (40 деталей).',
      'В каждом из 6 отсеков школы спрятан Секретный Тайник (сейф с жёлтым радаром). Подойдите к нему вплотную, чтобы вскрыть архив и получить +45 деталей и Медали!',
      'Следите за случайными событиями (Отключение света, Карантинная тревога, Точка эвакуации) и побеждайте 4 уникальных Боссов педсовета!',
    ],
    badge: 'ТАКТИКА И ПРОГРЕССИЯ',
    accent: '#c084fc',
  },
];

export function MetaAndSettingsModal({
  activeTab,
  onClose,
  saveProfile,
  onBuyMetaUpgrade,
  onUnlockOrEquipSkin,
  onUpdateSettings,
  onResetSave,
  onCompleteTutorial,
}: MetaAndSettingsModalProps) {
  const [tutorialIdx, setTutorialIdx] = useState(0);
  const [confirmReset, setConfirmReset] = useState(false);

  if (!activeTab) return null;

  const toggleFullscreen = () => {
    if (typeof document === 'undefined') return;
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.().catch(() => {});
    } else {
      document.exitFullscreen?.().catch(() => {});
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 pointer-events-auto"
      style={{ backgroundColor: 'rgba(6, 11, 9, 0.88)' }}
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl bg-[#101e18] border-4 border-[#b45309] p-4 sm:p-6 shadow-[0_14px_0_#070d0a] text-[#f4f1ea] flex flex-col gap-4">
        {/* Top Modal Header & Navigation Tabs */}
        <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-[#264236]">
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
            <span className="px-3 py-1.5 rounded-lg bg-[#0a1410] border border-amber-400/60 font-mono-num text-xs sm:text-sm font-extrabold text-amber-300">
              МЕДАЛИ ШКОЛЫ: {saveProfile.medals}
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 rounded-lg bg-[#1c3228] hover:bg-[#274437] border border-[#3a6150] text-xs font-mono-num font-bold text-[#e2ece7] cursor-pointer"
          >
            ЗАКРЫТЬ [ESC]
          </button>
        </div>

        {/* TAB 1: META-PROGRESSION SHOP & CHARACTER SKINS */}
        {activeTab === 'shop' && (
          <div className="flex flex-col gap-5">
            <div>
              <div className="text-xs font-mono-num uppercase tracking-wider text-amber-300">
                ПОСТОЯННАЯ ПРОКАЧКА · СОХРАНЯЕТСЯ МЕЖДУ ЗАБЕГАМИ
              </div>
              <h2 className="font-display text-2xl sm:text-3xl text-[#fef3c7]">
                МАСТЕРСКАЯ И ГАРДЕРОБ ШКОЛЫ №13
              </h2>
            </div>

            {/* Permanent Stat Upgrades Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {META_UPGRADE_SPECS.map((spec) => {
                const currentLv = saveProfile.metaUpgrades[spec.id] ?? 0;
                const isMax = currentLv >= spec.maxLevel;
                const cost = getMetaUpgradeCost(spec, currentLv);
                const canAfford = !isMax && saveProfile.medals >= cost;

                return (
                  <div
                    key={spec.id}
                    className="rounded-xl bg-[#0b1511] border-2 border-[#254034] p-3.5 flex flex-col justify-between gap-2.5"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <span
                          className="font-display text-sm sm:text-base"
                          style={{ color: spec.accent }}
                        >
                          {spec.title}
                        </span>
                        <span className="font-mono-num text-xs font-bold px-2 py-0.5 rounded bg-[#14261f] text-[#e2ece7]">
                          УР. {currentLv}/{spec.maxLevel}
                        </span>
                      </div>
                      <p className="text-xs text-[#cbd5e1] mt-1">{spec.description}</p>
                    </div>

                    <div className="flex items-center justify-between gap-2 pt-2 border-t border-[#1b3027]">
                      <div className="flex gap-1">
                        {Array.from({ length: spec.maxLevel }).map((_, i) => (
                          <span
                            key={i}
                            className="w-4 h-2 rounded-sm"
                            style={{
                              backgroundColor: i < currentLv ? spec.accent : '#1e332a',
                            }}
                          />
                        ))}
                      </div>

                      <button
                        type="button"
                        disabled={!canAfford}
                        onClick={() => onBuyMetaUpgrade(spec.id)}
                        className={`px-3 py-1.5 rounded-lg font-mono-num text-xs font-bold border transition-colors cursor-pointer ${
                          isMax
                            ? 'bg-[#14261f] border-[#2d4a3e] text-[#4ade80] cursor-default'
                            : canAfford
                            ? 'bg-amber-400 hover:bg-amber-300 text-[#09100d] border-[#09100d]'
                            : 'bg-[#121f1a] border-[#23382f] text-[#64748b] cursor-not-allowed'
                        }`}
                      >
                        {isMax ? 'МАКСИМУМ' : `КУПИТЬ · ${cost} МЕД.`}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Character Skins Wardrobe */}
            <div>
              <h3 className="font-display text-lg text-amber-300 mb-2">
                ФОРМА И ОБЛИКИ ВЫЖИВШЕГО
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {SKIN_SPECS.map((skin) => {
                  const isUnlocked = saveProfile.unlockedSkins.includes(skin.id);
                  const isEquipped = saveProfile.equippedSkin === skin.id;
                  const canBuy = !isUnlocked && saveProfile.medals >= skin.costMedals;

                  return (
                    <div
                      key={skin.id}
                      style={{
                        borderColor: isEquipped ? '#facc15' : '#254034',
                      }}
                      className="rounded-xl bg-[#0b1511] border-2 p-3 flex flex-col justify-between gap-2"
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <span className="font-display text-sm text-[#fef3c7]">{skin.name}</span>
                          <div className="flex items-center gap-1">
                            <span
                              className="w-3.5 h-3.5 rounded-full border border-black"
                              style={{ backgroundColor: skin.jacketColor }}
                            />
                            <span
                              className="w-3.5 h-3.5 rounded-full border border-black"
                              style={{ backgroundColor: skin.headbandColor }}
                            />
                          </div>
                        </div>
                        <p className="text-[11px] text-[#cbd5e1] leading-snug">{skin.subtitle}</p>
                      </div>

                      <button
                        type="button"
                        disabled={!isUnlocked && !canBuy}
                        onClick={() => onUnlockOrEquipSkin(skin.id)}
                        className={`w-full py-1.5 px-2.5 rounded-lg font-mono-num text-xs font-bold border cursor-pointer ${
                          isEquipped
                            ? 'bg-[#1b3329] border-[#4ade80] text-[#4ade80]'
                            : isUnlocked
                            ? 'bg-[#192d24] hover:bg-[#223d31] border-[#385c4c] text-[#fef3c7]'
                            : canBuy
                            ? 'bg-amber-400 hover:bg-amber-300 text-[#09100d] border-[#09100d]'
                            : 'bg-[#111c17] border-[#1f332a] text-[#64748b] cursor-not-allowed'
                        }`}
                      >
                        {isEquipped
                          ? 'НАДЕТО [АКТИВНО]'
                          : isUnlocked
                          ? 'НАДЕТЬ ОБЛИК'
                          : `ОТКРЫТЬ · ${skin.costMedals} МЕД.`}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: ACHIEVEMENTS & CAREER RECORDS */}
        {activeTab === 'achievements' && (
          <div className="flex flex-col gap-5">
            <div>
              <div className="text-xs font-mono-num uppercase tracking-wider text-amber-300">
                ЛИЧНОЕ ДЕЛО УЧЕНИКА · СТАТИСТИКА И НАГРАДЫ
              </div>
              <h2 className="font-display text-2xl sm:text-3xl text-[#fef3c7]">
                ДОСТИЖЕНИЯ И РЕКОРДЫ ШКОЛЫ
              </h2>
            </div>

            {/* Career Stats Summary Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div className="rounded-lg bg-[#0b1511] border border-[#2a4539] p-2.5">
                <span className="text-[10px] font-bold uppercase text-[#9db8ad] block">
                  ЗАБЕГОВ / ПОБЕД
                </span>
                <span className="font-mono-num text-lg font-bold text-[#fef3c7]">
                  {saveProfile.stats.totalRuns} / {saveProfile.stats.victories}
                </span>
              </div>
              <div className="rounded-lg bg-[#0b1511] border border-[#2a4539] p-2.5">
                <span className="text-[10px] font-bold uppercase text-[#9db8ad] block">
                  УЧИТЕЛЕЙ / БОССОВ
                </span>
                <span className="font-mono-num text-lg font-bold text-[#4ade80]">
                  {saveProfile.stats.totalKills} / {saveProfile.stats.bossesDefeated}
                </span>
              </div>
              <div className="rounded-lg bg-[#0b1511] border border-[#2a4539] p-2.5">
                <span className="text-[10px] font-bold uppercase text-[#9db8ad] block">
                  ЛУЧШЕЕ КОМБО / РАНГ
                </span>
                <span className="font-mono-num text-lg font-bold text-amber-300">
                  x{saveProfile.stats.bestCombo} · [{saveProfile.stats.highestStyleRank}]
                </span>
              </div>
              <div className="rounded-lg bg-[#0b1511] border border-[#2a4539] p-2.5">
                <span className="text-[10px] font-bold uppercase text-[#9db8ad] block">
                  ТАЙНИКОВ НАЙДЕНО
                </span>
                <span className="font-mono-num text-lg font-bold text-[#38bdf8]">
                  {saveProfile.stats.secretRoomsFound}
                </span>
              </div>
            </div>

            {/* Achievements List */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {ACHIEVEMENT_SPECS.map((ach) => {
                const unlocked = saveProfile.achievements.includes(ach.id);
                return (
                  <div
                    key={ach.id}
                    style={{
                      borderColor: unlocked ? ach.accent : '#1f352b',
                      opacity: unlocked ? 1 : 0.72,
                    }}
                    className="rounded-xl bg-[#0b1511] border-2 p-3 flex items-center justify-between gap-3"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span
                          className="font-display text-sm"
                          style={{ color: unlocked ? ach.accent : '#cbd5e1' }}
                        >
                          {ach.title}
                        </span>
                        {unlocked && (
                          <span className="text-[10px] font-mono-num font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300">
                            ВЫПОЛНЕНО
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-[#9db8ad] mt-0.5">{ach.description}</p>
                    </div>
                    <div className="text-right font-mono-num text-xs font-extrabold text-amber-300 shrink-0">
                      +{ach.rewardMedals} МЕД.
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 3: SETTINGS & CONTROLS */}
        {activeTab === 'settings' && (
          <div className="flex flex-col gap-5">
            <div>
              <div className="text-xs font-mono-num uppercase tracking-wider text-amber-300">
                 КОНФИГУРАЦИЯ ЗВУКА, ЭКРАНА И УПРАВЛЕНИЯ
              </div>
              <h2 className="font-display text-2xl sm:text-3xl text-[#fef3c7]">
                НАСТРОЙКИ ИГРЫ
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Volume Sliders */}
              <div className="rounded-xl bg-[#0b1511] border border-[#2a4539] p-4 flex flex-col gap-3">
                <h3 className="font-display text-sm text-amber-300 uppercase">АУДИО И ГРОМКОСТЬ</h3>

                <label className="flex flex-col gap-1 text-xs font-mono-num">
                  <div className="flex justify-between">
                    <span>ОБЩАЯ ГРОМКОСТЬ</span>
                    <span className="text-amber-300">
                      {Math.round(saveProfile.settings.masterVolume * 100)}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.05}
                    value={saveProfile.settings.masterVolume}
                    onChange={(e) =>
                      onUpdateSettings({ masterVolume: parseFloat(e.target.value) })
                    }
                    className="accent-amber-400 cursor-pointer"
                  />
                </label>

                <label className="flex flex-col gap-1 text-xs font-mono-num">
                  <div className="flex justify-between">
                    <span>МУЗЫКА (САУНДТРЕК)</span>
                    <span className="text-emerald-300">
                      {Math.round(saveProfile.settings.musicVolume * 100)}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.05}
                    value={saveProfile.settings.musicVolume}
                    onChange={(e) =>
                      onUpdateSettings({ musicVolume: parseFloat(e.target.value) })
                    }
                    className="accent-emerald-400 cursor-pointer"
                  />
                </label>

                <label className="flex flex-col gap-1 text-xs font-mono-num">
                  <div className="flex justify-between">
                    <span>ЗВУКОВЫЕ ЭФФЕКТЫ И ГОЛОС</span>
                    <span className="text-sky-300">
                      {Math.round(saveProfile.settings.sfxVolume * 100)}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.05}
                    value={saveProfile.settings.sfxVolume}
                    onChange={(e) =>
                      onUpdateSettings({ sfxVolume: parseFloat(e.target.value) })
                    }
                    className="accent-sky-400 cursor-pointer"
                  />
                </label>
              </div>

              {/* Graphics, Screen Shake, Touch & Fullscreen */}
              <div className="rounded-xl bg-[#0b1511] border border-[#2a4539] p-4 flex flex-col justify-between gap-2.5">
                <h3 className="font-display text-sm text-amber-300 uppercase">
                  ЭКРАН И УПРАВЛЕНИЕ
                </h3>

                <button
                  type="button"
                  onClick={() =>
                    onUpdateSettings({ screenShake: !saveProfile.settings.screenShake })
                  }
                  className="w-full py-2 px-3 rounded-lg bg-[#14261f] hover:bg-[#1b3329] border border-[#2e4d3f] flex items-center justify-between text-xs font-mono-num cursor-pointer"
                >
                  <span>ТРЯСКА КАМЕРЫ (SCREEN SHAKE)</span>
                  <span
                    className={
                      saveProfile.settings.screenShake
                        ? 'text-[#4ade80] font-bold'
                        : 'text-rose-400 font-bold'
                    }
                  >
                    {saveProfile.settings.screenShake ? 'ВКЛ' : 'ВЫКЛ'}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    onUpdateSettings({
                      graphicsQuality:
                        saveProfile.settings.graphicsQuality === 'high' ? 'low' : 'high',
                    })
                  }
                  className="w-full py-2 px-3 rounded-lg bg-[#14261f] hover:bg-[#1b3329] border border-[#2e4d3f] flex items-center justify-between text-xs font-mono-num cursor-pointer"
                >
                  <span>КАЧЕСТВО ЧАСТИЦ И ЭФФЕКТОВ</span>
                  <span className="text-amber-300 font-bold">
                    {saveProfile.settings.graphicsQuality === 'high' ? 'ВЫСОКОЕ' : 'БЫСТРОЕ'}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    onUpdateSettings({
                      showTouchControls: !saveProfile.settings.showTouchControls,
                    })
                  }
                  className="w-full py-2 px-3 rounded-lg bg-[#14261f] hover:bg-[#1b3329] border border-[#2e4d3f] flex items-center justify-between text-xs font-mono-num cursor-pointer"
                >
                  <span>СЕНСОРНЫЙ ДЖОЙСТИК (МОБИЛЬНЫЙ)</span>
                  <span
                    className={
                      saveProfile.settings.showTouchControls
                        ? 'text-[#4ade80] font-bold'
                        : 'text-[#9db8ad]'
                    }
                  >
                    {saveProfile.settings.showTouchControls ? 'ВКЛ' : 'АВТО/СКРЫТ'}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={toggleFullscreen}
                  className="w-full py-2 px-3 rounded-lg bg-[#14261f] hover:bg-[#1b3329] border border-[#2e4d3f] flex items-center justify-between text-xs font-mono-num cursor-pointer"
                >
                  <span>ПОЛНОЭКРАННЫЙ РЕЖИМ</span>
                  <span className="text-sky-300 font-bold">ПЕРЕКЛЮЧИТЬ [F11]</span>
                </button>
              </div>
            </div>

            {/* Danger Zone: Reset Save Progress with Confirmation */}
            <div className="rounded-xl bg-[#1a1114] border border-rose-500/40 p-3.5 flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="text-xs font-bold text-rose-300">СБРОС СОХРАНЁННОГО ПРОГРЕССА</div>
                <p className="text-[11px] text-[#cbd5e1]">
                  Сбросить все медали, открытые облики, достижения и статистику до начальных значений.
                </p>
              </div>
              {!confirmReset ? (
                <button
                  type="button"
                  onClick={() => setConfirmReset(true)}
                  className="px-3.5 py-2 rounded-lg bg-rose-950 hover:bg-rose-900 border border-rose-500 text-xs font-mono-num font-bold text-rose-200 cursor-pointer"
                >
                  СБРОСИТЬ ПРОГРЕСС...
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      onResetSave();
                      setConfirmReset(false);
                    }}
                    className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-xs font-mono-num font-bold text-white cursor-pointer"
                  >
                    ПОДТВЕРДИТЬ СБРОС
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmReset(false)}
                    className="px-3 py-1.5 rounded-lg bg-[#1f2937] text-xs font-mono-num text-[#cbd5e1] cursor-pointer"
                  >
                    ОТМЕНА
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 4: INTERACTIVE ONBOARDING TUTORIAL */}
        {activeTab === 'tutorial' && (
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs font-mono-num uppercase tracking-wider text-amber-300">
                  ИНСТРУКТАЖ ПЕРЕД БОЕМ · ШАГ {tutorialIdx + 1} ИЗ {TUTORIAL_STEPS.length}
                </div>
                <h2
                  className="font-display text-xl sm:text-2xl mt-0.5"
                  style={{ color: TUTORIAL_STEPS[tutorialIdx].accent }}
                >
                  {TUTORIAL_STEPS[tutorialIdx].title}
                </h2>
              </div>

              <button
                type="button"
                onClick={() => {
                  onCompleteTutorial();
                  onClose();
                }}
                className="px-3 py-1.5 rounded-lg bg-[#182c23] hover:bg-[#223d31] border border-[#355949] text-xs font-mono-num text-amber-300 cursor-pointer"
              >
                ПРОПУСТИТЬ ОБУЧЕНИЕ →
              </button>
            </div>

            <div className="rounded-xl bg-[#0b1511] border-2 border-[#284538] p-4 sm:p-5 flex flex-col gap-3">
              <div className="text-xs font-mono-num font-bold text-[#9db8ad]">
                {TUTORIAL_STEPS[tutorialIdx].subtitle}
              </div>
              <ul className="flex flex-col gap-2.5 text-xs sm:text-sm text-[#e2ece7] leading-relaxed">
                {TUTORIAL_STEPS[tutorialIdx].bullets.map((b, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span
                      className="inline-block w-2 h-2 rounded-full mt-1.5 shrink-0"
                      style={{ backgroundColor: TUTORIAL_STEPS[tutorialIdx].accent }}
                    />
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Stepper Controls */}
            <div className="flex items-center justify-between pt-2">
              <div className="flex gap-1.5">
                {TUTORIAL_STEPS.map((st, idx) => (
                  <button
                    key={st.step}
                    type="button"
                    onClick={() => setTutorialIdx(idx)}
                    className={`px-2.5 py-1 rounded font-mono-num text-xs font-bold cursor-pointer ${
                      tutorialIdx === idx
                        ? 'bg-amber-400 text-[#09100d]'
                        : 'bg-[#14261f] text-[#9db8ad]'
                    }`}
                  >
                    {idx + 1}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2">
                {tutorialIdx > 0 && (
                  <button
                    type="button"
                    onClick={() => setTutorialIdx((i) => Math.max(0, i - 1))}
                    className="px-4 py-2 rounded-lg bg-[#182c23] hover:bg-[#223d31] text-xs font-mono-num font-bold text-[#e2ece7] cursor-pointer"
                  >
                    ← НАЗАД
                  </button>
                )}
                {tutorialIdx < TUTORIAL_STEPS.length - 1 ? (
                  <button
                    type="button"
                    onClick={() => setTutorialIdx((i) => i + 1)}
                    className="px-5 py-2 rounded-lg bg-amber-400 hover:bg-amber-300 text-xs font-mono-num font-extrabold text-[#09100d] cursor-pointer"
                  >
                    ДАЛЕЕ →
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      onCompleteTutorial();
                      onClose();
                    }}
                    className="px-5 py-2 rounded-lg bg-[#4ade80] hover:bg-[#86efac] text-xs font-mono-num font-extrabold text-[#09100d] cursor-pointer"
                  >
                    ГОТОВ К УРОКУ! ✓
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
