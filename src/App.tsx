import React, { useCallback, useEffect, useRef, useState } from 'react';
import { GameHud, HudSnapshot } from './components/GameHud';
import { MetaAndSettingsModal, OverlayModalTab } from './components/MetaAndSettingsModal';
import { StatusModal } from './components/StatusModal';
import { TitleScreen } from './components/TitleScreen';
import {
  ACHIEVEMENT_SPECS,
  AchievementId,
  CharacterSkinId,
  createDefaultSaveProfile,
  equipSkin,
  GameSettings,
  loadSaveProfile,
  MetaUpgradeId,
  purchaseMetaUpgrade,
  SaveProfile,
  unlockSkin,
  writeSaveProfile,
} from './game/progression';
import {
  createAfterimagePool,
  createDecalPool,
  createParticlePool,
  createPopupPool,
  createProjectilePool,
  renderSchoolArena,
} from './game/renderer';
import {
  AcidHazard,
  applyBonusToPlayer,
  applyDamageToPlayer,
  applyTeacherFlocking,
  applyUpgradeToPlayer,
  ARENA_HEIGHT,
  ARENA_WIDTH,
  BARRICADE_COST,
  BarricadeEntity,
  BonusDrop,
  BonusType,
  canAcquireAttackToken,
  canPlaceStructure,
  computeEffectiveProjectileDamage,
  computeTeacherSeekVector,
  computeWaveGrade,
  createInitialPlayer,
  createMapSecretStash,
  createWaveExplosiveProps,
  distToSegmentSq,
  ExplosiveProp,
  GamePhase,
  getBossPhaseForHp,
  getModifiedWeaponSpec,
  getObstaclesForMap,
  getRandomTeacherBark,
  getStyleRankForPoints,
  getWaveConfig,
  hasLineOfSight,
  isBossArchetype,
  lerpAngle,
  MAX_WAVES,
  resolveCircleCircleCollision,
  resolveCircleRectCollision,
  RunSummary,
  SCHOOL_EVENTS,
  SCHOOL_MAPS,
  SchoolEventId,
  SchoolMapId,
  SecretStashEntity,
  segmentIntersectsRect,
  STYLE_RANKS,
  StyleFeedItem,
  StyleRankId,
  TEACHER_SPECS,
  TeacherArchetypeId,
  TelegraphZone,
  TURRET_COST,
  ULTIMATE_DAMAGE,
  ULTIMATE_RADIUS,
  ULTIMATE_SPECS,
  UltimateId,
  UPGRADE_SPECS,
  UpgradeId,
  WaveReport,
  WEAPON_SPECS,
  WeaponId,
  ZombieTeacher,
} from './game/rules';
import { sound } from './game/sound';

const BEST_SCORE_STORAGE_KEY = 'school13_ultrakill_best_score';

const SANDEVISTAN_TRAIL_COLORS = ['#00ff9d', '#00f0ff', '#ff007f', '#facc15', '#a855f7'];

const TEACHER_QUOTES: Record<TeacherArchetypeId, string[]> = {
  literature_chaser: ['Дневник на стол!', 'Кто не прочитал том?!', 'К доске без очереди!'],
  math_sniper: ['Делить на ноль нельзя!', 'Достаём двойные листочки!', 'Где чертёж?!'],
  pe_charger: ['Сто кругов вокруг школы!', 'Свисток для кого?!', 'Норматив не сдан!'],
  chem_lobber: ['Опыт с кислотой!', 'Не смешивать реактивы!', 'Халат где?!'],
  history_shield: ['В каком году была битва?!', 'Щит древних веков!', 'Параграф 42 наизусть!'],
  vice_principal_boss: ['ЗАВУЧ ЗДЕСЬ! ВСЕМ ДВОЙКИ!', 'ВСЕХ В ЧЁРНЫЙ ЖУРНАЛ!', 'ПЕДСОВЕТ, КО МНЕ!'],
  pe_boss: ['СДАЁМ ГТО НА ВЫЖИВАНИЕ!', 'ГИРИ ПО 32 КГ НА ПЛЕЧИ!', 'РАЗМИНКА ОКОНЧЕНА!'],
  lab_experiment_boss: ['ОБЪЕКТ-13 ВЫШЕЛ ИЗ КОЛБЫ!', 'КИСЛОТНЫЙ РЕАКТОР!', 'МУТАЦИЯ ЗАВЕРШЕНА!'],
  principal_boss: ['ВСЕМ ВЫГОВОР С ЗАНЕСЕНИЕМ!', 'РОДИТЕЛЕЙ В ШКОЛУ!', 'КАРАНТИН ОТМЕНЯЕТСЯ!'],
};

const INITIAL_HUD: HudSnapshot = {
  hp: 100,
  maxHp: 100,
  ghostHp: 100,
  shield: 35,
  maxShield: 100,
  rage: 100,
  maxRage: 100,
  scrap: 55,
  score: 0,
  combo: 1,
  stylePoints: 0,
  styleFeed: [],
  wave: 1,
  enemiesRemaining: 10,
  activeWeapon: 'slingshot',
  ammo: {
    slingshot: -1,
    shotgun: 30,
    nailgun: 110,
    acid: 18,
    tesla: 16,
  },
  overdriveTimer: 0,
  speedBoostTimer: 0,
  freezeTimer: 0,
  sandevistanTimer: 0,
  frozenBulletsCount: 0,
  ultimateId: 'sandevistan',
  waveBannerText: '1-й Урок: Проверка посещаемости',
  statusToast: null,
  autoAim: false,
  bossHp: 0,
  bossMaxHp: 780,
  bossPhase: 1,
  bossName: 'Директор школы',
  mapId: 'corridor',
  activeEvent: null,
  activeEventTimer: 0,
};

function mapKeyToCode(e: KeyboardEvent): string {
  if (e.code) return e.code;
  const k = e.key.toLowerCase();
  if (k === 'w' || k === 'ц') return 'KeyW';
  if (k === 'a' || k === 'ф') return 'KeyA';
  if (k === 's' || k === 'ы') return 'KeyS';
  if (k === 'd' || k === 'в') return 'KeyD';
  if (k === 'e' || k === 'у') return 'KeyE';
  if (k === 'q' || k === 'й') return 'KeyQ';
  if (k === 'c' || k === 'с') return 'KeyC';
  if (k === 'v' || k === 'м') return 'KeyV';
  if (k === 'f' || k === 'а') return 'KeyF';
  if (k === 'p' || k === 'з') return 'KeyP';
  if (k === 'r' || k === 'к') return 'KeyR';
  if (k === 'm' || k === 'ь') return 'KeyM';
  if (k === '1') return 'Digit1';
  if (k === '2') return 'Digit2';
  if (k === '3') return 'Digit3';
  if (k === '4') return 'Digit4';
  if (k === '5') return 'Digit5';
  if (k === ' ') return 'Space';
  return '';
}

const GAMEPLAY_PREVENT_DEFAULT_CODES = new Set([
  'KeyW',
  'KeyA',
  'KeyS',
  'KeyD',
  'ArrowUp',
  'ArrowDown',
  'ArrowLeft',
  'ArrowRight',
  'Space',
  'ShiftLeft',
  'ShiftRight',
  'KeyE',
  'KeyQ',
  'KeyC',
  'KeyV',
  'KeyF',
  'Digit1',
  'Digit2',
  'Digit3',
  'Digit4',
  'Digit5',
]);

export default function App() {
  const urlParams =
    typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
  const isAutostart = urlParams?.get('autostart') === '1';
  const initialUltParam = urlParams?.get('ult') as UltimateId | null;
  const initialUlt: UltimateId =
    initialUltParam === 'shadow_ninja' ||
    initialUltParam === 'sonic_bell' ||
    initialUltParam === 'sandevistan'
      ? initialUltParam
      : 'sandevistan';

  const [saveProfile, setSaveProfile] = useState<SaveProfile>(() => loadSaveProfile());
  const saveRef = useRef<SaveProfile>(saveProfile);

  const [phase, setPhase] = useState<GamePhase>(isAutostart ? 'playing' : 'title');
  const [selectedUltimate, setSelectedUltimate] = useState<UltimateId>(initialUlt);
  const [selectedMap, setSelectedMap] = useState<SchoolMapId>('corridor');
  const selectedMapRef = useRef<SchoolMapId>('corridor');
  const [overlayModal, setOverlayModal] = useState<OverlayModalTab>(null);
  const [availableUpgrades, setAvailableUpgrades] = useState<UpgradeId[]>([
    'vampirism',
    'rapid_reload',
    'scrap_engineer',
  ]);
  const availableUpgradesRef = useRef<UpgradeId[]>(availableUpgrades);

  const [hud, setHud] = useState<HudSnapshot>({ ...INITIAL_HUD, ultimateId: initialUlt });
  const [summary, setSummary] = useState<RunSummary | null>(null);
  const [waveReport, setWaveReport] = useState<WaveReport | null>(null);
  const [bestScore, setBestScore] = useState<number>(() => {
    try {
      const saved = window.localStorage.getItem(BEST_SCORE_STORAGE_KEY);
      const localBest = saved ? Math.max(0, parseInt(saved, 10) || 0) : 0;
      return Math.max(localBest, saveProfile.bestScore);
    } catch {
      return saveProfile.bestScore;
    }
  });
  const [muted, setMuted] = useState<boolean>(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const phaseRef = useRef<GamePhase>(phase);
  const selectedUltRef = useRef<UltimateId>(selectedUltimate);
  const bestScoreRef = useRef<number>(bestScore);

  // Sync audio volumes from saved settings on mount and whenever settings change
  useEffect(() => {
    saveRef.current = saveProfile;
    sound.setVolumes(
      saveProfile.settings.masterVolume,
      saveProfile.settings.musicVolume,
      saveProfile.settings.sfxVolume
    );
  }, [saveProfile]);

  const updateSave = useCallback((updater: (prev: SaveProfile) => SaveProfile) => {
    setSaveProfile((prev) => {
      const next = updater(prev);
      saveRef.current = next;
      writeSaveProfile(next);
      return next;
    });
  }, []);

  const handleBuyMetaUpgrade = useCallback(
    (id: MetaUpgradeId) => {
      updateSave((prev) => {
        const res = purchaseMetaUpgrade(prev, id);
        if (res.purchased) sound.playPickup();
        return res.profile;
      });
    },
    [updateSave]
  );

  const handleUnlockOrEquipSkin = useCallback(
    (id: CharacterSkinId) => {
      updateSave((prev) => {
        if (prev.unlockedSkins.includes(id)) {
          sound.playPickup();
          return equipSkin(prev, id);
        }
        const res = unlockSkin(prev, id);
        if (res.unlocked) sound.playRankUp();
        return res.profile;
      });
    },
    [updateSave]
  );

  const handleUpdateSettings = useCallback(
    (next: Partial<GameSettings>) => {
      updateSave((prev) => ({
        ...prev,
        settings: {
          ...prev.settings,
          ...next,
        },
      }));
    },
    [updateSave]
  );

  const handleResetSave = useCallback(() => {
    const fresh = createDefaultSaveProfile();
    saveRef.current = fresh;
    setSaveProfile(fresh);
    writeSaveProfile(fresh);
    setBestScore(0);
    bestScoreRef.current = 0;
  }, []);

  const handleCompleteTutorial = useCallback(() => {
    updateSave((prev) => ({ ...prev, tutorialCompleted: true }));
  }, [updateSave]);

  const simRef = useRef({
    player: createInitialPlayer(initialUlt, saveProfile.metaUpgrades, saveProfile.equippedSkin),
    mapId: 'corridor' as SchoolMapId,
    secretStash: createMapSecretStash('corridor') as SecretStashEntity,
    activeEvent: null as SchoolEventId | null,
    activeEventTimer: 0,
    eventTriggeredInWave: false,
    evacZone: null as { x: number; y: number; radius: number; progress: number } | null,
    teachers: [] as ZombieTeacher[],
    projectiles: createProjectilePool(),
    particles: createParticlePool(),
    decals: createDecalPool(),
    popups: createPopupPool(),
    afterimages: createAfterimagePool(),
    barricades: [] as BarricadeEntity[],
    explosives: [] as ExplosiveProp[],
    bonuses: [] as BonusDrop[],
    hazards: [] as AcidHazard[],
    telegraphs: [] as TelegraphZone[],
    nextEntityId: 1,
    wave: 1,
    waveToSpawn: 10,
    spawnTimer: 1.2,
    bossSpawnedInWave: false,
    score: 0,
    combo: 1,
    bestCombo: 1,
    comboTimer: 0,
    stylePoints: 0,
    styleFeed: [] as StyleFeedItem[],
    highestRankIndex: 0,
    waveHighestRankIndex: 0,
    waveStartTime: 0,
    waveKills: 0,
    waveShotsFired: 0,
    waveShotsHit: 0,
    waveDamageTaken: 0,
    totalShotsFired: 0,
    totalShotsHit: 0,
    totalDamageDealt: 0,
    totalDamageTaken: 0,
    teachersDefeated: 0,
    bossesDefeated: 0,
    barricadesBuilt: 0,
    secretStashesOpenedInRun: 0,
    parriesInRun: 0,
    runTimeSec: 0,
    globalFreezeTimer: 0,
    ninjaTargetQueue: [] as number[],
    ninjaStepTimer: 0,
    sandevistanColorIdx: 0,
    hitstopTimer: 0,
    trauma: 0,
    cameraX: ARENA_WIDTH / 2,
    cameraY: ARENA_HEIGHT / 2,
    mouseClientX: 720,
    mouseClientY: 450,
    mouseWorldX: ARENA_WIDTH / 2 + 120,
    mouseWorldY: ARENA_HEIGHT / 2,
    lastMouseMoveTime: 0,
    autoAim: false,
    mouseDown: false,
    touchMoveX: 0,
    touchMoveY: 0,
    keysHeld: new Set<string>(),
    justPressed: new Set<string>(),
    dashBufferTimer: 0,
    afterimageSpawnTimer: 0,
    waveBannerText: '1-й Урок: Проверка посещаемости' as string | null,
    waveBannerTimer: 3.0,
    statusToast: null as string | null,
    statusToastTimer: 0,
    defeatDelayTimer: 0,
    chronoTickTimer: 0,
    elapsedTime: 0,
    hudSyncAccum: 0,
  });

  const saveBestScore = useCallback((nextBest: number) => {
    bestScoreRef.current = nextBest;
    setBestScore(nextBest);
    try {
      window.localStorage.setItem(BEST_SCORE_STORAGE_KEY, String(nextBest));
    } catch {
      // ignore storage errors in restricted iframes
    }
  }, []);

  const syncBodyPhase = useCallback((nextPhase: GamePhase) => {
    phaseRef.current = nextPhase;
    setPhase(nextPhase);
    if (typeof document !== 'undefined') {
      document.body.dataset.state = nextPhase;
      if (nextPhase !== 'playing') {
        document.exitPointerLock?.();
      }
    }
  }, []);

  const addStyleBonus = useCallback((text: string, points: number, color: string) => {
    const s = simRef.current;
    const prevRank = getStyleRankForPoints(s.stylePoints);
    s.stylePoints = Math.min(1150, s.stylePoints + points);
    const nextRank = getStyleRankForPoints(s.stylePoints);

    const nextIdx = STYLE_RANKS.findIndex((r) => r.id === nextRank.id);
    const prevIdx = STYLE_RANKS.findIndex((r) => r.id === prevRank.id);
    if (nextIdx > prevIdx && nextIdx >= 2) {
      sound.playRankUp();
    }
    if (nextIdx > s.highestRankIndex) s.highestRankIndex = nextIdx;
    if (nextIdx > s.waveHighestRankIndex) s.waveHighestRankIndex = nextIdx;

    s.styleFeed.unshift({
      id: s.nextEntityId++,
      text,
      points,
      color,
      ttl: 3.2,
    });
    if (s.styleFeed.length > 4) {
      s.styleFeed.length = 4;
    }
  }, []);

  const spawnParticleBurst = useCallback(
    (
      x: number,
      y: number,
      color: string,
      count: number,
      speedScale = 1,
      shape: 'circle' | 'spark' | 'shell' | 'paper' = 'circle'
    ) => {
      const pool = simRef.current.particles;
      const isLowGraphics = saveRef.current.settings.graphicsQuality === 'low';
      const effectiveCount = isLowGraphics ? Math.max(2, Math.ceil(count * 0.55)) : count;
      let spawned = 0;
      for (let i = 0; i < pool.length && spawned < effectiveCount; i++) {
        const pt = pool[i];
        if (!pt.active) {
          const ang = Math.random() * Math.PI * 2;
          const spd = (45 + Math.random() * 175) * speedScale;
          pt.active = true;
          pt.x = x;
          pt.y = y;
          pt.vx = Math.cos(ang) * spd;
          pt.vy = Math.sin(ang) * spd;
          pt.size = shape === 'shell' ? 4 : 2.5 + Math.random() * 3.8;
          pt.color = color;
          pt.maxLife =
            shape === 'shell' || shape === 'paper' ? 0.65 : 0.25 + Math.random() * 0.32;
          pt.life = pt.maxLife;
          pt.shape = shape;
          pt.angle = ang;
          pt.vRot = (Math.random() - 0.5) * 18;
          pt.targetX = undefined;
          pt.targetY = undefined;
          spawned++;
        }
      }
    },
    []
  );

  const spawnShockwaveRing = useCallback(
    (x: number, y: number, maxRadius: number, color: string, duration = 0.38) => {
      const pool = simRef.current.particles;
      for (let i = 0; i < pool.length; i++) {
        const pt = pool[i];
        if (!pt.active) {
          pt.active = true;
          pt.x = x;
          pt.y = y;
          pt.vx = 0;
          pt.vy = 0;
          pt.size = maxRadius;
          pt.color = color;
          pt.maxLife = duration;
          pt.life = duration;
          pt.shape = 'ring';
          pt.angle = 0;
          pt.vRot = 0;
          pt.targetX = undefined;
          pt.targetY = undefined;
          return;
        }
      }
    },
    []
  );

  const spawnLightningArc = useCallback(
    (x1: number, y1: number, x2: number, y2: number, color = '#e879f9') => {
      const pool = simRef.current.particles;
      for (let i = 0; i < pool.length; i++) {
        const pt = pool[i];
        if (!pt.active) {
          pt.active = true;
          pt.x = x1;
          pt.y = y1;
          pt.targetX = x2;
          pt.targetY = y2;
          pt.vx = 0;
          pt.vy = 0;
          pt.size = 3;
          pt.color = color;
          pt.maxLife = 0.18;
          pt.life = 0.18;
          pt.shape = 'lightning';
          pt.angle = 0;
          pt.vRot = 0;
          return;
        }
      }
    },
    []
  );

  const spawnDecal = useCallback(
    (
      x: number,
      y: number,
      radius: number,
      kind: 'slime' | 'scorch' | 'chalk',
      color: string
    ) => {
      const pool = simRef.current.decals;
      let target = pool.find((d) => !d.active);
      if (!target) {
        target = pool[Math.floor(Math.random() * pool.length)];
      }
      target.active = true;
      target.x = x;
      target.y = y;
      target.radius = radius;
      target.kind = kind;
      target.color = color;
      target.alpha = kind === 'scorch' ? 0.65 : 0.42;
      target.angle = Math.random() * Math.PI * 2;
    },
    []
  );

  const spawnPopup = useCallback(
    (x: number, y: number, text: string, color: string, scale = 1) => {
      const pool = simRef.current.popups;
      for (let i = 0; i < pool.length; i++) {
        const pop = pool[i];
        if (!pop.active) {
          pop.active = true;
          pop.x = x;
          pop.y = y;
          pop.vy = -54;
          pop.text = text;
          pop.color = color;
          pop.maxLife = 0.78;
          pop.life = 0.78;
          pop.scale = scale;
          return;
        }
      }
    },
    []
  );

  const spawnTeacherForWave = useCallback((archetype: TeacherArchetypeId) => {
    const s = simRef.current;
    const spec = TEACHER_SPECS[archetype];
    const waveCfg = getWaveConfig(s.wave);

    const doorways = [
      { x: 900, y: 240 },
      { x: 900, y: 960 },
      { x: 460, y: 600 },
      { x: 1340, y: 600 },
      { x: 620, y: 260 },
      { x: 1180, y: 260 },
      { x: 620, y: 940 },
      { x: 1180, y: 940 },
    ];
    const validDoors = doorways.filter(
      (d) => Math.hypot(d.x - s.player.x, d.y - s.player.y) > 260
    );
    const door =
      validDoors[Math.floor(Math.random() * validDoors.length)] || doorways[0];

    const quotes = TEACHER_QUOTES[archetype];
    const quote = quotes[Math.floor(Math.random() * quotes.length)];

    s.teachers.push({
      id: s.nextEntityId++,
      archetype,
      x: door.x + (Math.random() * 40 - 20),
      y: door.y + (Math.random() * 40 - 20),
      vx: 0,
      vy: 0,
      angle: Math.atan2(s.player.y - door.y, s.player.x - door.x),
      hp: Math.round(spec.maxHp * (1 + (s.wave - 1) * 0.08)),
      maxHp: Math.round(spec.maxHp * (1 + (s.wave - 1) * 0.08)),
      speed: spec.speed * waveCfg.speedMultiplier,
      radius: spec.radius,
      state: 'seeking',
      stateTimer: 0,
      attackCooldownTimer: 0.7 + Math.random() * 0.6,
      hitFlashTimer: 0,
      frozenTimer: 0,
      chargeDirX: 0,
      chargeDirY: 0,
      koTimer: 0,
      walkPhase: Math.random() * Math.PI * 2,
      hasAttackToken: false,
      bossPhase: isBossArchetype(archetype) ? 1 : undefined,
      quote,
      quoteTimer: 2.5,
    });
  }, []);

  const spawnKatanaSlash = useCallback(
    (x: number, y: number, angle: number, color = '#f43f5e', size = 48) => {
      const pool = simRef.current.particles;
      for (let i = 0; i < pool.length; i++) {
        const pt = pool[i];
        if (!pt.active) {
          pt.active = true;
          pt.x = x;
          pt.y = y;
          pt.vx = 0;
          pt.vy = 0;
          pt.size = size;
          pt.color = color;
          pt.maxLife = 0.42;
          pt.life = 0.42;
          pt.shape = 'katana_slash';
          pt.angle = angle;
          pt.vRot = 0;
          pt.targetX = undefined;
          pt.targetY = undefined;
          return;
        }
      }
    },
    []
  );

  const handleSelectUltimate = useCallback((id: UltimateId) => {
    selectedUltRef.current = id;
    setSelectedUltimate(id);
    const s = simRef.current;
    s.player.ultimateId = id;
    s.player.rage = s.player.maxRage;
    s.statusToast = `Выбрана ульта: ${ULTIMATE_SPECS[id].title} [C / ПКМ]`;
    s.statusToastTimer = 2.2;
    setHud((prev) => ({
      ...prev,
      ultimateId: id,
      rage: s.player.maxRage,
      statusToast: s.statusToast,
    }));
  }, []);

  const cycleUltimate = useCallback(() => {
    const order: UltimateId[] = ['sandevistan', 'shadow_ninja', 'sonic_bell'];
    const s = simRef.current;
    const nextIdx = (order.indexOf(s.player.ultimateId) + 1) % order.length;
    handleSelectUltimate(order[nextIdx]);
    canvasRef.current?.focus({ preventScroll: true });
  }, [handleSelectUltimate]);

  const triggerUltimate = useCallback(() => {
    const s = simRef.current;
    if (phaseRef.current !== 'playing') return;
    canvasRef.current?.focus({ preventScroll: true });

    const p = s.player;
    const ultSpec = ULTIMATE_SPECS[p.ultimateId];

    // If Sandevistan is active, pressing [C] prematurely unlocks time and launches all frozen bullets immediately!
    if (p.sandevistanTimer > 0) {
      p.sandevistanTimer = 0.001; // triggers stasis release on next tick
      s.statusToast = 'ХРОНО-ВСПЛЕСК: ЗАПУСК ПУЛЬ!';
      s.statusToastTimer = 1.4;
      return;
    }

    if (p.rage < p.maxRage) {
      s.statusToast = `${ultSpec.shortName} заряжается: ${Math.round(p.rage)}%`;
      s.statusToastTimer = 1.4;
      return;
    }

    p.rage = 0;
    p.invulnTimer = Math.max(p.invulnTimer, 1.4);
    p.scaleX = 1.35;
    p.scaleY = 0.7;

    s.statusToast = ultSpec.cutsceneTitle;
    s.statusToastTimer = 1.8;
    s.hudSyncAccum = 0.2;
    s.trauma = Math.min(0.95, s.trauma + 0.72);
    s.hitstopTimer = Math.max(s.hitstopTimer, 0.08);

    if (p.ultimateId === 'sandevistan') {
      // 1. CYBERPUNK SANDEVISTAN: 6.5s Time-Stop + Chromatic Trail!
      sound.playSandevistan();
      p.sandevistanTimer = 6.5;
      spawnShockwaveRing(p.x, p.y, 420, '#00ff9d', 0.52);
      spawnShockwaveRing(p.x, p.y, 300, '#00f0ff', 0.42);
      spawnShockwaveRing(p.x, p.y, 190, '#ffffff', 0.32);
      spawnParticleBurst(p.x, p.y, '#00ff9d', 24, 1.5, 'spark');
      spawnParticleBurst(p.x, p.y, '#00f0ff', 20, 1.4, 'spark');
      spawnPopup(p.x, p.y - 46, 'САНДЕВИСТАН: ХРОНО-СТАЗИС!', '#00ff9d', 1.45);
      addStyleBonus('+САНДЕВИСТАН: ХРОНО-СТАЗИС', 195, '#00ff9d');

      // Seed immediate rainbow trail fan behind player so it's visible on frame 1
      for (let k = 0; k < 5; k++) {
        const slot = s.afterimages.find((a) => !a.active);
        if (slot) {
          slot.active = true;
          slot.x = p.x - Math.cos(p.angle) * (k * 16);
          slot.y = p.y - Math.sin(p.angle) * (k * 16);
          slot.angle = p.angle;
          slot.alpha = 0.95 - k * 0.12;
          slot.color = SANDEVISTAN_TRAIL_COLORS[k % SANDEVISTAN_TRAIL_COLORS.length];
          slot.kind = 'sandevistan';
        }
      }
    } else if (p.ultimateId === 'shadow_ninja') {
      // 2. SHADOW NINJA OMNISLASH: Character enters Iaido stance, then sequentially dashes behind enemies on the arena!
      sound.playNinjaExecute();
      p.ninjaSlashTimer = 1.65;
      p.invulnTimer = Math.max(p.invulnTimer, 1.85);
      s.globalFreezeTimer = Math.max(s.globalFreezeTimer, 1.55);
      spawnShockwaveRing(p.x, p.y, 300, '#f43f5e', 0.45);
      spawnShockwaveRing(p.x, p.y, 190, '#38bdf8', 0.35);
      spawnKatanaSlash(p.x, p.y, p.angle, '#f43f5e', 68);
      spawnPopup(p.x, p.y - 38, 'ИАЙДО: ТЕНЕВАЯ КАТАНА!', '#f43f5e', 1.45);

      // Gather all live targets in 780px sorted by distance from player
      const targetsInRange = s.teachers
        .filter((t) => t.state !== 'ko' && Math.hypot(t.x - p.x, t.y - p.y) <= 780)
        .sort((a, b) => Math.hypot(a.x - p.x, a.y - p.y) - Math.hypot(b.x - p.x, b.y - p.y));

      s.ninjaTargetQueue = targetsInRange.map((t) => t.id);
      // Wait 0.30s in Iaido Unsheathing Stance before first dash-slash!
      s.ninjaStepTimer = 0.30;

      addStyleBonus(
        '+ТЕНЕВАЯ КАЗНЬ ШИНОБИ!',
        200 + targetsInRange.length * 45,
        '#f43f5e'
      );
    } else {
      // 3. SONIC SCHOOL BELL: 370px Acoustic Resonance Wave + Projectile Wipe + Stun
      sound.playUltimateBell();
      p.shockwaveVisualTimer = 1.1;
      spawnShockwaveRing(p.x, p.y, ULTIMATE_RADIUS, '#facc15', 0.45);
      spawnShockwaveRing(p.x, p.y, ULTIMATE_RADIUS * 0.75, '#e879f9', 0.35);
      spawnParticleBurst(p.x, p.y, '#c084fc', 28, 1.55, 'spark');
      spawnParticleBurst(p.x, p.y, '#ffffff', 12, 1.2, 'paper');
      spawnPopup(p.x, p.y - 34, 'БОЛЬШОЙ ЗВОНОК!', '#f5d0fe', 1.25);

      // Erase enemy projectiles in radius
      for (const proj of s.projectiles) {
        if (proj.active && !proj.fromPlayer) {
          proj.active = false;
          spawnParticleBurst(proj.x, proj.y, '#fef08a', 6, 0.8, 'spark');
        }
      }

      let hitCount = 0;
      for (const t of s.teachers) {
        if (t.state === 'ko') continue;
        const dist = Math.hypot(t.x - p.x, t.y - p.y);
        if (dist <= ULTIMATE_RADIUS + t.radius) {
          hitCount++;
          const ang = Math.atan2(t.y - p.y, t.x - p.x);
          t.hp -= ULTIMATE_DAMAGE;
          t.hitFlashTimer = 0.14;
          t.frozenTimer = Math.max(t.frozenTimer, 2.5);
          t.x = Math.max(45, Math.min(ARENA_WIDTH - 45, t.x + Math.cos(ang) * 95));
          t.y = Math.max(45, Math.min(ARENA_HEIGHT - 45, t.y + Math.sin(ang) * 95));
          spawnLightningArc(p.x, p.y, t.x, t.y, '#facc15');
          spawnParticleBurst(t.x, t.y, '#e879f9', 10, 1.1, 'spark');
          spawnPopup(t.x, t.y - 20, `-${ULTIMATE_DAMAGE} ЗВОНОК!`, '#f5d0fe', 1.15);

          if (t.hp <= 0) {
            t.state = 'ko';
            t.koTimer = 0.35;
            t.hasAttackToken = false;
            t.vx = Math.cos(ang) * 280;
            t.vy = Math.sin(ang) * 280;
            s.telegraphs = s.telegraphs.filter((z) => z.ownerId !== t.id);
            const spec = TEACHER_SPECS[t.archetype];
            s.teachersDefeated += 1;
            if (isBossArchetype(t.archetype)) s.bossesDefeated += 1;
            s.waveKills += 1;
            s.combo = Math.min(10, s.combo + 1);
            s.bestCombo = Math.max(s.bestCombo, s.combo);
            s.comboTimer = 4.5;
            const styleMult = getStyleRankForPoints(s.stylePoints).multiplier;
            s.score += Math.round(spec.scoreValue * styleMult);
            p.scrap += spec.scrapDrop;
            spawnDecal(t.x, t.y, 20, 'slime', spec.color);
            spawnParticleBurst(t.x, t.y, '#ffffff', 5, 1.0, 'paper');
          }
        }
      }
      addStyleBonus('+БОЛЬШОЙ ЗВОНОК!', 140 + hitCount * 35, '#facc15');
    }

    // Immediate HUD state sync on ultimate activation
    setHud((prev) => ({
      ...prev,
      rage: 0,
      sandevistanTimer: p.sandevistanTimer,
      statusToast: s.statusToast,
      stylePoints: s.stylePoints,
      styleFeed: [...s.styleFeed],
      score: s.score,
    }));
  }, [
    addStyleBonus,
    spawnDecal,
    spawnKatanaSlash,
    spawnLightningArc,
    spawnParticleBurst,
    spawnPopup,
    spawnShockwaveRing,
  ]);

  const handleSelectMap = useCallback((mapId: SchoolMapId) => {
    selectedMapRef.current = mapId;
    setSelectedMap(mapId);
    const s = simRef.current;
    s.mapId = mapId;
    s.secretStash = createMapSecretStash(mapId);
    s.explosives = createWaveExplosiveProps(500, mapId);
  }, []);

  const rollBetweenWaveUpgrades = useCallback((ownedMods: string[]): UpgradeId[] => {
    const baseIds: UpgradeId[] = ['vampirism', 'rapid_reload', 'scrap_engineer'];
    const allMods: UpgradeId[] = [
      'mod_slingshot_ricochet',
      'mod_shotgun_incendiary',
      'mod_nailgun_hyper',
      'mod_acid_volatile',
      'mod_tesla_overcharge',
    ];
    const unownedMods = allMods.filter((u) => {
      const modId = UPGRADE_SPECS.find((spec) => spec.id === u)?.weaponMod;
      return modId && !ownedMods.includes(modId);
    });
    if (unownedMods.length > 0) {
      const pickedMod = unownedMods[Math.floor(Math.random() * unownedMods.length)];
      const next: UpgradeId[] = ['vampirism', 'rapid_reload', pickedMod];
      availableUpgradesRef.current = next;
      setAvailableUpgrades(next);
      return next;
    }
    availableUpgradesRef.current = baseIds;
    setAvailableUpgrades(baseIds);
    return baseIds;
  }, []);

  const handleSelectUpgrade = useCallback(
    (upgradeId: UpgradeId) => {
      const s = simRef.current;
      s.player = applyUpgradeToPlayer(s.player, upgradeId);
      s.wave += 1;
      const nextCfg = getWaveConfig(s.wave);
      s.waveToSpawn = nextCfg.totalBudget;
      s.spawnTimer = 1.4;
      s.bossSpawnedInWave = false;
      s.activeEvent = null;
      s.activeEventTimer = 0;
      s.eventTriggeredInWave = false;
      s.evacZone = null;
      s.waveBannerText = `${nextCfg.title}`;
      s.waveBannerTimer = 3.2;
      s.waveStartTime = s.runTimeSec;
      s.waveKills = 0;
      s.waveShotsFired = 0;
      s.waveShotsHit = 0;
      s.waveDamageTaken = 0;
      s.waveHighestRankIndex = STYLE_RANKS.findIndex(
        (r) => r.id === getStyleRankForPoints(s.stylePoints).id
      );

      s.explosives = createWaveExplosiveProps(s.nextEntityId, s.mapId);
      s.nextEntityId += 10;
      s.keysHeld.clear();
      s.justPressed.clear();
      s.mouseDown = false;

      sound.playPickup();
      sound.playSchoolBell();
      spawnShockwaveRing(s.player.x, s.player.y, 130, '#4ade80', 0.35);
      setWaveReport(null);
      syncBodyPhase('playing');
      canvasRef.current?.focus({ preventScroll: true });
    },
    [spawnShockwaveRing, syncBodyPhase]
  );

  const resetAndStartGame = useCallback(() => {
    const s = simRef.current;
    const mapId = selectedMapRef.current;
    s.mapId = mapId;
    s.player = createInitialPlayer(
      selectedUltRef.current,
      saveRef.current.metaUpgrades,
      saveRef.current.equippedSkin
    );
    s.secretStash = createMapSecretStash(mapId);
    s.activeEvent = null;
    s.activeEventTimer = 0;
    s.eventTriggeredInWave = false;
    s.evacZone = null;
    s.teachers = [];
    s.barricades = [
      {
        id: s.nextEntityId++,
        kind: 'barricade',
        x: ARENA_WIDTH / 2 + 110,
        y: ARENA_HEIGHT / 2 - 70,
        radius: 26,
        hp: 160,
        maxHp: 160,
        fireTimer: 0,
        angle: 0,
      },
    ];
    s.explosives = createWaveExplosiveProps(s.nextEntityId, mapId);
    s.nextEntityId += 10;

    s.bonuses = [
      {
        id: s.nextEntityId++,
        type: 'shield',
        x: ARENA_WIDTH / 2 - 140,
        y: ARENA_HEIGHT / 2 - 90,
        ttl: 25,
        maxTtl: 25,
      },
      {
        id: s.nextEntityId++,
        type: 'overdrive',
        x: ARENA_WIDTH / 2 + 150,
        y: ARENA_HEIGHT / 2 + 95,
        ttl: 25,
        maxTtl: 25,
      },
    ];
    s.hazards = [];
    s.telegraphs = [];
    for (const p of s.projectiles) p.active = false;
    for (const pt of s.particles) pt.active = false;
    for (const dec of s.decals) dec.active = false;
    for (const pop of s.popups) pop.active = false;
    for (const img of s.afterimages) img.active = false;

    const w1 = getWaveConfig(1);
    s.wave = 1;
    s.waveToSpawn = w1.totalBudget;
    s.spawnTimer = 1.25;
    s.bossSpawnedInWave = false;
    s.score = 0;
    s.combo = 1;
    s.bestCombo = 1;
    s.comboTimer = 0;
    s.stylePoints = 120; // Start in C — ТРОЕЧНИК so style bar is immediately visible and alive!
    s.styleFeed = [
      { id: s.nextEntityId++, text: '+УРОК НАЧАЛСЯ', points: 120, color: '#4ade80', ttl: 3.5 },
    ];
    s.highestRankIndex = 1;
    s.waveHighestRankIndex = 1;
    s.waveStartTime = 0;
    s.waveKills = 0;
    s.waveShotsFired = 0;
    s.waveShotsHit = 0;
    s.waveDamageTaken = 0;
    s.totalShotsFired = 0;
    s.totalShotsHit = 0;
    s.totalDamageDealt = 0;
    s.totalDamageTaken = 0;
    s.teachersDefeated = 0;
    s.bossesDefeated = 0;
    s.barricadesBuilt = 0;
    s.secretStashesOpenedInRun = 0;
    s.parriesInRun = 0;
    s.runTimeSec = 0;
    s.globalFreezeTimer = 0;
    s.hitstopTimer = 0;
    s.trauma = 0;
    s.cameraX = s.player.x;
    s.cameraY = s.player.y;
    s.keysHeld.clear();
    s.justPressed.clear();
    s.mouseDown = false;
    s.touchMoveX = 0;
    s.touchMoveY = 0;
    s.defeatDelayTimer = 0;
    s.waveBannerText = `${SCHOOL_MAPS[mapId].name} · ${w1.title}`;
    s.waveBannerTimer = 3.2;
    s.statusToast = `Ульта готова: ${ULTIMATE_SPECS[s.player.ultimateId].shortName} [C / ПКМ] · Смена ульты [V]`;
    s.statusToastTimer = 4.0;

    spawnTeacherForWave('literature_chaser');
    spawnTeacherForWave('math_sniper');
    spawnTeacherForWave('pe_charger');
    s.waveToSpawn -= 3;

    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
    canvasRef.current?.focus({ preventScroll: true });
    sound.startMusic();
    sound.playSchoolBell();
    setSummary(null);
    setWaveReport(null);
    syncBodyPhase('playing');
  }, [spawnTeacherForWave, syncBodyPhase]);

  const selectWeapon = useCallback((id: WeaponId) => {
    const s = simRef.current;
    if (s.player.activeWeapon !== id) {
      s.player.lastWeapon = s.player.activeWeapon;
      s.player.activeWeapon = id;
      s.player.weaponSwitchTimer = 1.85;
    }
    s.statusToast = `Оружие: ${WEAPON_SPECS[id].name}`;
    s.statusToastTimer = 1.5;
    canvasRef.current?.focus({ preventScroll: true });
    setHud((prev) => ({ ...prev, activeWeapon: id, statusToast: s.statusToast }));
  }, []);

  const toggleAutoAim = useCallback(() => {
    const s = simRef.current;
    s.autoAim = !s.autoAim;
    s.statusToast = s.autoAim
      ? 'Авто-прицел ВКЛЮЧЁН (помощь при ходьбе)'
      : 'Авто-прицел ВЫКЛЮЧЕН (только мышь)';
    s.statusToastTimer = 1.8;
    canvasRef.current?.focus({ preventScroll: true });
    setHud((prev) => ({ ...prev, autoAim: s.autoAim, statusToast: s.statusToast }));
  }, []);

  const placeDefensiveGadget = useCallback(
    (kind: 'barricade' | 'turret') => {
      const s = simRef.current;
      if (phaseRef.current !== 'playing') return;
      canvasRef.current?.focus({ preventScroll: true });

      const cost = kind === 'barricade' ? BARRICADE_COST : TURRET_COST;
      const dist = 58;
      const placeX = s.player.x + Math.cos(s.player.angle) * dist;
      const placeY = s.player.y + Math.sin(s.player.angle) * dist;
      const radius = kind === 'barricade' ? 26 : 22;

      const check = canPlaceStructure(
        placeX,
        placeY,
        radius,
        s.player.scrap,
        cost,
        getObstaclesForMap(s.mapId),
        s.barricades
      );

      if (!check.allowed) {
        s.statusToast = check.reason ?? 'Нельзя построить здесь';
        s.statusToastTimer = 1.6;
        return;
      }

      s.player.scrap -= cost;
      s.barricadesBuilt += 1;
      s.barricades.push({
        id: s.nextEntityId++,
        kind,
        x: placeX,
        y: placeY,
        radius,
        hp: kind === 'barricade' ? 180 : 130,
        maxHp: kind === 'barricade' ? 180 : 130,
        fireTimer: 0.25,
        angle: s.player.angle,
      });

      sound.playBuild();
      addStyleBonus(kind === 'barricade' ? '+ПАРТА-ЩИТ' : '+ГЛОБУС-ТУРЕЛЬ', 35, '#38bdf8');
      spawnShockwaveRing(
        placeX,
        placeY,
        46,
        kind === 'barricade' ? '#f59e0b' : '#38bdf8',
        0.25
      );
      spawnParticleBurst(
        placeX,
        placeY,
        kind === 'barricade' ? '#f59e0b' : '#38bdf8',
        12,
        0.85,
        'spark'
      );
      spawnPopup(
        placeX,
        placeY - 18,
        kind === 'barricade' ? 'ПАРТА-ЩИТ!' : 'ГЛОБУС-ТУРЕЛЬ!',
        kind === 'barricade' ? '#fef08a' : '#bae6fd',
        1.15
      );
    },
    [addStyleBonus, spawnParticleBurst, spawnPopup, spawnShockwaveRing]
  );

  const toggleMute = useCallback(() => {
    const nextMuted = sound.toggleMute();
    setMuted(nextMuted);
    canvasRef.current?.focus({ preventScroll: true });
  }, []);

  const togglePause = useCallback(() => {
    if (phaseRef.current === 'playing') {
      simRef.current.keysHeld.clear();
      simRef.current.mouseDown = false;
      syncBodyPhase('paused');
    } else if (phaseRef.current === 'paused') {
      simRef.current.keysHeld.clear();
      simRef.current.mouseDown = false;
      canvasRef.current?.focus({ preventScroll: true });
      syncBodyPhase('playing');
    }
  }, [syncBodyPhase]);

  useEffect(() => {
    document.body.dataset.state = phaseRef.current;
    if (phaseRef.current === 'playing') {
      resetAndStartGame();
    } else {
      const s = simRef.current;
      s.teachers = [];
      s.explosives = createWaveExplosiveProps(500);
      spawnTeacherForWave('literature_chaser');
      spawnTeacherForWave('math_sniper');
      spawnTeacherForWave('pe_charger');
      spawnTeacherForWave('chem_lobber');
      spawnTeacherForWave('history_shield');
    }
  }, [resetAndStartGame, spawnTeacherForWave]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const code = mapKeyToCode(e);
      if (!code) return;
      const s = simRef.current;

      if (phaseRef.current === 'title' || phaseRef.current === 'gameover') {
        if (code === 'Enter' || code === 'Space') {
          e.preventDefault();
          resetAndStartGame();
          return;
        }
      }

      if (phaseRef.current === 'wave_clear') {
        if (code === 'Digit1' || code === 'Enter' || code === 'Space') {
          e.preventDefault();
          handleSelectUpgrade(availableUpgradesRef.current[0] ?? 'vampirism');
          return;
        }
        if (code === 'Digit2') {
          e.preventDefault();
          handleSelectUpgrade(availableUpgradesRef.current[1] ?? 'rapid_reload');
          return;
        }
        if (code === 'Digit3') {
          e.preventDefault();
          handleSelectUpgrade(availableUpgradesRef.current[2] ?? 'scrap_engineer');
          return;
        }
        return;
      }

      if (code === 'KeyM') {
        e.preventDefault();
        if (!e.repeat) toggleMute();
        return;
      }

      if (code === 'Escape' || code === 'KeyP') {
        if (phaseRef.current === 'playing' || phaseRef.current === 'paused') {
          e.preventDefault();
          if (!e.repeat) togglePause();
          return;
        }
      }

      if (code === 'KeyR' && (phaseRef.current === 'playing' || phaseRef.current === 'paused')) {
        e.preventDefault();
        if (!e.repeat) resetAndStartGame();
        return;
      }

      if (phaseRef.current !== 'playing') return;

      if (GAMEPLAY_PREVENT_DEFAULT_CODES.has(code)) {
        e.preventDefault();
      }

      if (e.repeat) {
        s.keysHeld.add(code);
        return;
      }

      if (!s.keysHeld.has(code)) {
        s.justPressed.add(code);
      }
      s.keysHeld.add(code);

      if (code === 'Digit1') selectWeapon('slingshot');
      if (code === 'Digit2') selectWeapon('shotgun');
      if (code === 'Digit3') selectWeapon('nailgun');
      if (code === 'Digit4') selectWeapon('acid');
      if (code === 'Digit5') selectWeapon('tesla');
      if (code === 'KeyE') placeDefensiveGadget('barricade');
      if (code === 'KeyQ') placeDefensiveGadget('turret');
      if (code === 'KeyC') triggerUltimate();
      if (code === 'KeyV') cycleUltimate();
      if (code === 'KeyF') toggleAutoAim();
      if (code === 'ShiftLeft' || code === 'ShiftRight') {
        s.dashBufferTimer = 0.14;
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      const code = mapKeyToCode(e);
      if (code) {
        simRef.current.keysHeld.delete(code);
      }
    };

    const clearInputs = () => {
      simRef.current.keysHeld.clear();
      simRef.current.justPressed.clear();
      simRef.current.mouseDown = false;
    };

    window.addEventListener('keydown', onKeyDown, { passive: false });
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('blur', clearInputs);
    document.addEventListener('visibilitychange', clearInputs);

    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('blur', clearInputs);
      document.removeEventListener('visibilitychange', clearInputs);
    };
  }, [
    cycleUltimate,
    handleSelectUpgrade,
    placeDefensiveGadget,
    resetAndStartGame,
    selectWeapon,
    toggleAutoAim,
    toggleMute,
    togglePause,
    triggerUltimate,
  ]);

  // Isolated 60fps Canvas Simulation & Render Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const isHeadless =
      typeof navigator !== 'undefined' &&
      (navigator.webdriver || /HeadlessChrome/i.test(navigator.userAgent));

    let viewW = window.innerWidth;
    let viewH = window.innerHeight;
    let cachedRectLeft = 0;
    let cachedRectTop = 0;

    const updateCanvasSize = () => {
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      cachedRectLeft = rect.left;
      cachedRectTop = rect.top;
      viewW = Math.max(320, rect.width || window.innerWidth);
      viewH = Math.max(240, rect.height || window.innerHeight);
      const dpr = isHeadless ? 1 : Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(viewW * dpr);
      canvas.height = Math.round(viewH * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    updateCanvasSize();
    const ro = new ResizeObserver(updateCanvasSize);
    ro.observe(canvas);
    window.addEventListener('resize', updateCanvasSize);
    window.addEventListener('scroll', updateCanvasSize, { passive: true });

    const screenToWorld = (clientX: number, clientY: number) => {
      const sx = clientX - cachedRectLeft;
      const sy = clientY - cachedRectTop;
      const s = simRef.current;
      return {
        wx: s.cameraX - viewW / 2 + sx,
        wy: s.cameraY - viewH / 2 + sy,
      };
    };

    const updateAimFromPointer = (clientX: number, clientY: number) => {
      const s = simRef.current;
      s.mouseClientX = clientX;
      s.mouseClientY = clientY;
      s.lastMouseMoveTime = performance.now();
      const { wx, wy } = screenToWorld(clientX, clientY);
      s.mouseWorldX = wx;
      s.mouseWorldY = wy;
      if (phaseRef.current === 'playing' && !s.autoAim) {
        s.player.angle = Math.atan2(wy - s.player.y, wx - s.player.x);
      }
    };

    const onPointerMove = (e: PointerEvent) => {
      updateAimFromPointer(e.clientX, e.clientY);
    };

    const onMouseMove = (e: MouseEvent) => {
      updateAimFromPointer(e.clientX, e.clientY);
    };

    const onPointerDown = (e: PointerEvent) => {
      if (phaseRef.current !== 'playing') return;
      updateAimFromPointer(e.clientX, e.clientY);
      if (e.button === 2 && e.target === canvas) {
        e.preventDefault();
        triggerUltimate();
        return;
      }
      if (e.button === 0 && e.target === canvas) {
        e.preventDefault();
        canvas.focus({ preventScroll: true });
        try {
          canvas.setPointerCapture(e.pointerId);
        } catch {
          // ignore
        }
        simRef.current.mouseDown = true;
      }
    };

    const onMouseDown = (e: MouseEvent) => {
      if (phaseRef.current !== 'playing' || e.target !== canvas) return;
      if (e.button === 2) {
        e.preventDefault();
        triggerUltimate();
        return;
      }
      if (e.button === 0) {
        e.preventDefault();
        simRef.current.mouseDown = true;
      }
    };

    const onPointerUp = (e: PointerEvent) => {
      if (e.button === 0) {
        simRef.current.mouseDown = false;
      }
      if (e.target === canvas) {
        try {
          if (canvas.hasPointerCapture(e.pointerId)) {
            canvas.releasePointerCapture(e.pointerId);
          }
        } catch {
          // ignore
        }
      }
    };

    const onMouseUp = (e: MouseEvent) => {
      if (e.button === 0) {
        simRef.current.mouseDown = false;
      }
    };

    let lastWheelTime = 0;
    const onWheel = (e: WheelEvent) => {
      if (phaseRef.current !== 'playing') return;
      const now = performance.now();
      if (now - lastWheelTime < 65) return;
      lastWheelTime = now;
      const weapons: WeaponId[] = ['slingshot', 'shotgun', 'nailgun', 'acid', 'tesla'];
      const curIdx = weapons.indexOf(simRef.current.player.activeWeapon);
      const nextIdx =
        e.deltaY > 0
          ? (curIdx + 1) % weapons.length
          : (curIdx - 1 + weapons.length) % weapons.length;
      selectWeapon(weapons[nextIdx]);
    };

    window.addEventListener('pointermove', onPointerMove, { passive: true });
    window.addEventListener('mousemove', onMouseMove, { passive: true });
    window.addEventListener('pointerdown', onPointerDown, { passive: false });
    window.addEventListener('mousedown', onMouseDown, { passive: false });
    window.addEventListener('pointerup', onPointerUp, { passive: true });
    window.addEventListener('pointercancel', onMouseUp as EventListener, { passive: true });
    window.addEventListener('mouseup', onMouseUp, { passive: true });
    window.addEventListener('wheel', onWheel, { passive: true });

    const fireProjectile = (
      x: number,
      y: number,
      angle: number,
      damage: number,
      speed: number,
      range: number,
      color: string,
      pierce: number,
      aoeRadius: number,
      knockback: number,
      fromPlayer: boolean,
      isHeavy: boolean,
      weaponKind: string,
      radius = 5.5
    ) => {
      const pool = simRef.current.projectiles;
      for (let i = 0; i < pool.length; i++) {
        const p = pool[i];
        if (!p.active) {
          p.active = true;
          p.x = x;
          p.y = y;
          p.prevX = x;
          p.prevY = y;
          p.vx = Math.cos(angle) * speed;
          p.vy = Math.sin(angle) * speed;
          p.angle = angle;
          p.spin = Math.random() * Math.PI * 2;
          p.radius = radius;
          p.damage = damage;
          p.color = color;
          p.traveled = 0;
          p.maxRange = range;
          p.pierce = pierce;
          p.aoeRadius = aoeRadius;
          p.knockback = knockback;
          p.fromPlayer = fromPlayer;
          p.isHeavy = isHeavy;
          p.weaponKind = weaponKind;
          p.hitIds.length = 0;
          p.wasTimeStopped = false;
          if (fromPlayer && simRef.current.player.sandevistanTimer > 0) {
            // Bullet moves forward slightly so it hovers just in front of the gun muzzle in stasis
            p.stasisLaunchDist = Math.min(range * 0.45, 55 + Math.random() * 45);
          } else {
            p.stasisLaunchDist = undefined;
          }
          return;
        }
      }
    };

    const detonateExplosiveProp = (exp: ExplosiveProp) => {
      if (exp.destroyed) return;
      exp.destroyed = true;
      exp.hp = 0;
      const s = simRef.current;

      // Destructible Wooden School Supply Crate («ЯЩИК СНАБЖЕНИЯ»)
      if (exp.kind === 'supply_crate') {
        sound.playWoodImpact();
        sound.playPickup();
        s.trauma = Math.min(0.45, s.trauma + 0.16);
        spawnShockwaveRing(exp.x, exp.y, 68, '#facc15', 0.26);
        spawnParticleBurst(exp.x, exp.y, '#d97706', 14, 1.1, 'spark');
        spawnParticleBurst(exp.x, exp.y, '#fef08a', 8, 0.95, 'paper');
        s.player.scrap += 18;
        addStyleBonus('+ЯЩИК СНАБЖЕНИЯ', 55, '#facc15');
        spawnPopup(exp.x, exp.y - 22, '+18 ДЕТАЛЕЙ · ПРИПАСЫ!', '#facc15', 1.18);

        const crateLootPool: BonusType[] = ['ammo', 'medkit', 'shield', 'overdrive'];
        const pickedLoot = crateLootPool[Math.floor(Math.random() * crateLootPool.length)];
        s.bonuses.push({
          id: s.nextEntityId++,
          type: pickedLoot,
          x: exp.x,
          y: exp.y,
          ttl: 20,
          maxTtl: 20,
        });
        return;
      }

      sound.playExplosion();
      s.trauma = Math.min(0.85, s.trauma + 0.5);
      s.hitstopTimer = Math.max(s.hitstopTimer, 0.05);

      const blastColor = exp.kind === 'extinguisher' ? '#fb923c' : '#a3e635';
      spawnShockwaveRing(exp.x, exp.y, exp.blastRadius, blastColor, 0.38);
      spawnShockwaveRing(exp.x, exp.y, exp.blastRadius * 0.65, '#fef08a', 0.28);
      spawnParticleBurst(exp.x, exp.y, blastColor, 28, 1.5, 'spark');
      spawnParticleBurst(exp.x, exp.y, '#fef08a', 14, 1.15, 'circle');
      spawnParticleBurst(exp.x, exp.y, '#ffffff', 6, 1.2, 'paper');
      spawnDecal(exp.x, exp.y, 46, 'scorch', '#070a09');
      spawnPopup(
        exp.x,
        exp.y - 24,
        exp.kind === 'extinguisher' ? 'ВЗРЫВ БАЛЛОНА!' : 'ХИМ-ВЗРЫВ!',
        '#fde047',
        1.25
      );
      addStyleBonus('+ВЗРЫВ ОКРУЖЕНИЯ!', 95, '#fb923c');

      if (exp.kind === 'chem_barrel') {
        s.hazards.push({
          id: s.nextEntityId++,
          x: exp.x,
          y: exp.y,
          radius: 95,
          ttl: 6.0,
          maxTtl: 6.0,
          dps: 32,
          fromPlayer: true,
        });
      }

      // Chain-detonate or shatter nearby crates/barrels within blast radius
      for (const other of s.explosives) {
        if (!other.destroyed && other.id !== exp.id) {
          const distOther = Math.hypot(other.x - exp.x, other.y - exp.y);
          if (distOther <= exp.blastRadius + other.radius) {
            detonateExplosiveProp(other);
          }
        }
      }

      for (const t of s.teachers) {
        if (t.state === 'ko') continue;
        const d = Math.hypot(t.x - exp.x, t.y - exp.y);
        if (d <= exp.blastRadius + t.radius) {
          const ang = Math.atan2(t.y - exp.y, t.x - exp.x);
          t.hp -= exp.blastDamage;
          t.hitFlashTimer = 0.12;
          t.x = Math.max(45, Math.min(ARENA_WIDTH - 45, t.x + Math.cos(ang) * 78));
          t.y = Math.max(45, Math.min(ARENA_HEIGHT - 45, t.y + Math.sin(ang) * 78));
          spawnPopup(t.x, t.y - 18, `-${exp.blastDamage} ВЗРЫВ!`, '#fb923c', 1.15);

          if (t.hp <= 0) {
            t.state = 'ko';
            t.koTimer = 0.35;
            t.hasAttackToken = false;
            t.vx = Math.cos(ang) * 260;
            t.vy = Math.sin(ang) * 260;
            s.telegraphs = s.telegraphs.filter((z) => z.ownerId !== t.id);
            const spec = TEACHER_SPECS[t.archetype];
            s.teachersDefeated += 1;
            if (isBossArchetype(t.archetype)) s.bossesDefeated += 1;
            s.waveKills += 1;
            s.combo = Math.min(10, s.combo + 1);
            s.bestCombo = Math.max(s.bestCombo, s.combo);
            s.comboTimer = 4.5;
            const styleMult = getStyleRankForPoints(s.stylePoints).multiplier;
            s.score += Math.round(spec.scoreValue * styleMult);
            s.player.scrap += spec.scrapDrop;
            s.player.rage = Math.min(s.player.maxRage, s.player.rage + 18);
            spawnDecal(t.x, t.y, 20, 'slime', spec.color);
          }
        }
      }
    };

    let rafId = 0;
    let lastTime = performance.now();
    let headlessAccum = 0;

    const tick = (now: number) => {
      rafId = requestAnimationFrame(tick);
      const rawDt = Math.max(0.001, (now - lastTime) / 1000);
      lastTime = now;

      if (isHeadless) {
        headlessAccum += rawDt;
        if (headlessAccum < 0.055) return;
        headlessAccum = 0;
      }

      const dt = Math.min(rawDt, 0.05);
      const s = simRef.current;
      s.elapsedTime += dt;

      s.trauma = Math.max(0, s.trauma - dt * 1.8);
      const shakeMag = saveRef.current.settings.screenShake ? s.trauma * s.trauma * 16 : 0;
      const shakeOffsetX = (Math.random() * 2 - 1) * shakeMag;
      const shakeOffsetY = (Math.random() * 2 - 1) * shakeMag;

      if (s.player.hitFlashTimer > 0)
        s.player.hitFlashTimer = Math.max(0, s.player.hitFlashTimer - dt);
      if (s.player.muzzleFlashTimer > 0)
        s.player.muzzleFlashTimer = Math.max(0, s.player.muzzleFlashTimer - dt);
      if (s.player.shockwaveVisualTimer > 0)
        s.player.shockwaveVisualTimer = Math.max(0, s.player.shockwaveVisualTimer - dt);
      s.player.recoilOffset = Math.max(0, s.player.recoilOffset - dt * 38);

      for (const t of s.teachers) {
        if (t.hitFlashTimer > 0) t.hitFlashTimer = Math.max(0, t.hitFlashTimer - dt);
      }
      for (const exp of s.explosives) {
        if (exp.hitFlashTimer > 0) exp.hitFlashTimer = Math.max(0, exp.hitFlashTimer - dt);
      }

      if (phaseRef.current === 'title') {
        s.cameraX = ARENA_WIDTH / 2 + Math.cos(s.elapsedTime * 0.35) * 260;
        s.cameraY = ARENA_HEIGHT / 2 + Math.sin(s.elapsedTime * 0.25) * 150;
        for (const t of s.teachers) {
          t.walkPhase += dt * 5;
          t.x += Math.cos(t.angle) * 45 * dt;
          t.y += Math.sin(t.angle) * 45 * dt;
          if (t.x < 120 || t.x > ARENA_WIDTH - 120) t.angle = Math.PI - t.angle;
          if (t.y < 120 || t.y > ARENA_HEIGHT - 120) t.angle = -t.angle;
        }
        renderSchoolArena(ctx, viewW, viewH, {
          player: s.player,
          teachers: s.teachers,
          projectiles: s.projectiles,
          barricades: s.barricades,
          explosives: s.explosives,
          bonuses: s.bonuses,
          hazards: s.hazards,
          telegraphs: s.telegraphs,
          particles: s.particles,
          decals: s.decals,
          popups: s.popups,
          afterimages: s.afterimages,
          cameraX: s.cameraX,
          cameraY: s.cameraY,
          shakeOffsetX: 0,
          shakeOffsetY: 0,
          mouseWorldX: s.mouseWorldX,
          mouseWorldY: s.mouseWorldY,
          globalFreezeTimer: 0,
          isTitleMode: true,
          elapsedTime: s.elapsedTime,
          mapId: s.mapId,
          secretStash: s.secretStash,
          activeEvent: s.activeEvent,
          evacZone: s.evacZone,
          graphicsQuality: saveRef.current.settings.graphicsQuality,
        });
        return;
      }

      if (phaseRef.current !== 'playing') {
        renderSchoolArena(ctx, viewW, viewH, {
          player: s.player,
          teachers: s.teachers,
          projectiles: s.projectiles,
          barricades: s.barricades,
          explosives: s.explosives,
          bonuses: s.bonuses,
          hazards: s.hazards,
          telegraphs: s.telegraphs,
          particles: s.particles,
          decals: s.decals,
          popups: s.popups,
          afterimages: s.afterimages,
          cameraX: s.cameraX,
          cameraY: s.cameraY,
          shakeOffsetX: 0,
          shakeOffsetY: 0,
          mouseWorldX: s.mouseWorldX,
          mouseWorldY: s.mouseWorldY,
          globalFreezeTimer: s.globalFreezeTimer,
          isTitleMode: false,
          elapsedTime: s.elapsedTime,
          mapId: s.mapId,
          secretStash: s.secretStash,
          activeEvent: s.activeEvent,
          evacZone: s.evacZone,
          graphicsQuality: saveRef.current.settings.graphicsQuality,
        });
        return;
      }

      const simDt = dt;
      s.runTimeSec += simDt;
      const mapObstacles = getObstaclesForMap(s.mapId);

      const finishRunWithSummary = (victory: boolean) => {
        const activeBoss = s.teachers.find((t) => isBossArchetype(t.archetype));
        const finalScore = Math.round(victory ? s.score + s.player.hp * 15 : s.score);
        const nextBest = Math.max(bestScoreRef.current, finalScore);
        saveBestScore(nextBest);
        sound.playBellOutcome(victory);
        const highestRankId: StyleRankId =
          STYLE_RANKS[s.highestRankIndex]?.id ?? (victory ? 'S' : 'D');
        const acc =
          s.totalShotsFired > 0
            ? Math.min(100, Math.round((s.totalShotsHit / s.totalShotsFired) * 100))
            : 100;

        let medalsEarned =
          Math.max(5, Math.floor(s.teachersDefeated * 1.5)) +
          s.bossesDefeated * 20 +
          (victory ? 45 : Math.max(0, (s.wave - 1) * 8));

        const prevSave = saveRef.current;
        const nextTotalEnemies = prevSave.stats.totalEnemiesDefeated + s.teachersDefeated;
        const nextTotalBosses = prevSave.stats.totalBossesDefeated + s.bossesDefeated;
        const prevRankIdx = STYLE_RANKS.findIndex(
          (r) => r.id === prevSave.stats.highestStyleRank
        );
        const bestCareerRankId: StyleRankId =
          s.highestRankIndex > prevRankIdx
            ? highestRankId
            : prevSave.stats.highestStyleRank;

        const nextStats = {
          totalRuns: prevSave.stats.totalRuns + 1,
          victories: prevSave.stats.victories + (victory ? 1 : 0),
          totalKills: nextTotalEnemies,
          totalEnemiesDefeated: nextTotalEnemies,
          bossesDefeated: nextTotalBosses,
          totalBossesDefeated: nextTotalBosses,
          totalWavesCompleted:
            prevSave.stats.totalWavesCompleted + (victory ? MAX_WAVES : Math.max(0, s.wave - 1)),
          totalPlayTimeSec: prevSave.stats.totalPlayTimeSec + s.runTimeSec,
          bestCombo: Math.max(prevSave.stats.bestCombo, s.bestCombo),
          highestStyleRank: bestCareerRankId,
          secretRoomsFound: prevSave.stats.secretRoomsFound + s.secretStashesOpenedInRun,
          barricadesBuilt: prevSave.stats.barricadesBuilt + s.barricadesBuilt,
          projectilesParried: prevSave.stats.projectilesParried + s.parriesInRun,
        };

        const newAchievements: string[] = [];
        const nextUnlocked = [...prevSave.unlockedAchievements];
        const tryUnlock = (id: AchievementId, condition: boolean) => {
          if (condition && !nextUnlocked.includes(id)) {
            nextUnlocked.push(id);
            newAchievements.push(id);
            const achSpec = ACHIEVEMENT_SPECS.find((a) => a.id === id);
            medalsEarned += achSpec ? achSpec.rewardMedals : 25;
          }
        };

        tryUnlock('first_bell', victory || s.wave >= 2);
        tryUnlock('graduate', victory);
        tryUnlock('boss_hunter', nextStats.totalBossesDefeated >= 3);
        tryUnlock('ultrakill_rank', highestRankId === 'ULTRAKILL');
        tryUnlock('secret_finder', nextStats.secretRoomsFound >= 1);
        tryUnlock('parry_master', nextStats.projectilesParried >= 5);
        tryUnlock('architect', nextStats.barricadesBuilt >= 15);
        tryUnlock('exterminator', nextStats.totalEnemiesDefeated >= 100);
        tryUnlock('untouchable', (victory || s.wave >= 2) && s.waveDamageTaken === 0);
        tryUnlock('custom_style', prevSave.unlockedSkins.length >= 2);

        updateSave((prev) => ({
          ...prev,
          medals: prev.medals + medalsEarned,
          bestScore: Math.max(prev.bestScore, nextBest),
          achievements: nextUnlocked,
          unlockedAchievements: nextUnlocked,
          stats: nextStats,
        }));

        setSummary({
          victory,
          waveReached: victory ? MAX_WAVES : s.wave,
          maxWaves: MAX_WAVES,
          score: finalScore,
          bestScore: nextBest,
          teachersDefeated: s.teachersDefeated,
          bossesDefeated: s.bossesDefeated,
          barricadesBuilt: s.barricadesBuilt,
          clearTimeSec: s.runTimeSec,
          bossHpRemaining: activeBoss ? Math.max(0, Math.round(activeBoss.hp)) : 0,
          highestStyleRank: highestRankId,
          accuracy: acc,
          damageDealt: Math.round(s.totalDamageDealt),
          damageTaken: Math.round(s.totalDamageTaken),
          bestCombo: s.bestCombo,
          medalsEarned,
          newlyUnlockedAchievements: newAchievements,
          mapId: s.mapId,
        });
        syncBodyPhase('gameover');
      };

      if (s.player.hp <= 0) {
        s.defeatDelayTimer += simDt;
        renderSchoolArena(ctx, viewW, viewH, {
          player: s.player,
          teachers: s.teachers,
          projectiles: s.projectiles,
          barricades: s.barricades,
          explosives: s.explosives,
          bonuses: s.bonuses,
          hazards: s.hazards,
          telegraphs: s.telegraphs,
          particles: s.particles,
          decals: s.decals,
          popups: s.popups,
          afterimages: s.afterimages,
          cameraX: s.cameraX,
          cameraY: s.cameraY,
          shakeOffsetX,
          shakeOffsetY,
          mouseWorldX: s.mouseWorldX,
          mouseWorldY: s.mouseWorldY,
          globalFreezeTimer: s.globalFreezeTimer,
          isTitleMode: false,
          elapsedTime: s.elapsedTime,
          mapId: s.mapId,
          secretStash: s.secretStash,
          activeEvent: s.activeEvent,
          evacZone: s.evacZone,
          graphicsQuality: saveRef.current.settings.graphicsQuality,
        });
        if (s.defeatDelayTimer >= 0.45) {
          finishRunWithSummary(false);
        }
        return;
      }

      const p = s.player;
      p.ghostHp = Math.max(p.hp, p.ghostHp - simDt * 28);
      p.rage = Math.min(p.maxRage, p.rage + simDt * 2.4);
      if (p.weaponSwitchTimer > 0)
        p.weaponSwitchTimer = Math.max(0, p.weaponSwitchTimer - simDt);
      if (p.overdriveTimer > 0) p.overdriveTimer = Math.max(0, p.overdriveTimer - simDt);
      if (p.speedBoostTimer > 0) p.speedBoostTimer = Math.max(0, p.speedBoostTimer - simDt);
      if (p.invulnTimer > 0) p.invulnTimer = Math.max(0, p.invulnTimer - simDt);
      if (p.knockbackTimer && p.knockbackTimer > 0)
        p.knockbackTimer = Math.max(0, p.knockbackTimer - simDt);
      if (p.dashCooldown > 0) p.dashCooldown = Math.max(0, p.dashCooldown - simDt);
      if (p.dashTimer > 0) p.dashTimer = Math.max(0, p.dashTimer - simDt);
      if (p.fireCooldown > 0) p.fireCooldown = Math.max(0, p.fireCooldown - simDt);
      if (p.sandevistanTimer > 0) {
        s.chronoTickTimer -= simDt;
        if (s.chronoTickTimer <= 0) {
          s.chronoTickTimer = 0.65;
          sound.playChronoTick();
        }
        const prevTimer = p.sandevistanTimer;
        p.sandevistanTimer = Math.max(0, p.sandevistanTimer - simDt);
        if (p.sandevistanTimer === 0 && prevTimer > 0) {
          // TIME RESUMES! Release all time-frozen projectiles in an explosive simultaneous barrage!
          let launchedBulletsCount = 0;
          for (const proj of s.projectiles) {
            if (proj.active && proj.fromPlayer) {
              launchedBulletsCount++;
              proj.stasisLaunchDist = undefined;
              proj.wasTimeStopped = true;
              proj.traveled = 0; // Fresh travel distance so they reach target
              proj.damage = Math.round(proj.damage * 1.5); // +50% Chrono Damage bonus!

              // Smart Micro-guidance toward nearest live enemy in forward cone
              let bestTarget: ZombieTeacher | null = null;
              let bestAngleDiff = 0.6; // ~34 degrees
              for (const t of s.teachers) {
                if (t.state === 'ko') continue;
                const toEnemyAngle = Math.atan2(t.y - proj.y, t.x - proj.x);
                let diff = Math.abs(toEnemyAngle - proj.angle);
                while (diff > Math.PI) diff = Math.abs(diff - Math.PI * 2);
                if (diff < bestAngleDiff) {
                  bestAngleDiff = diff;
                  bestTarget = t;
                }
              }
              if (bestTarget) {
                const targetAng = Math.atan2(bestTarget.y - proj.y, bestTarget.x - proj.x);
                proj.angle = proj.angle + (targetAng - proj.angle) * 0.55;
              }

              const curSpeed = Math.hypot(proj.vx, proj.vy) || 800;
              const newSpeed = curSpeed * 1.45;
              proj.vx = Math.cos(proj.angle) * newSpeed;
              proj.vy = Math.sin(proj.angle) * newSpeed;
              spawnParticleBurst(proj.x, proj.y, '#00ff9d', 6, 1.2, 'spark');
            }
          }

          sound.playTimeResume();
          sound.playExplosion();
          sound.playParry();
          s.trauma = Math.min(0.9, s.trauma + 0.55);
          s.hitstopTimer = Math.max(s.hitstopTimer, 0.055);
          spawnShockwaveRing(p.x, p.y, 420, '#facc15', 0.45);
          spawnShockwaveRing(p.x, p.y, 300, '#00ff9d', 0.38);

          if (launchedBulletsCount > 0) {
            spawnPopup(
              p.x,
              p.y - 48,
              `ВРЕМЯ ПОШЛО! ЗАЛП x${launchedBulletsCount}!`,
              '#facc15',
              1.45
            );
            addStyleBonus(
              `+ХРОНО-ШКВАЛ x${launchedBulletsCount}!`,
              120 + launchedBulletsCount * 18,
              '#00ff9d'
            );
          } else {
            spawnPopup(p.x, p.y - 36, 'ТОКИ ВА УГОКИДАСУ: ВРЕМЯ ПОШЛО!', '#facc15', 1.3);
          }
        }
      }
      if (p.ninjaSlashTimer > 0) {
        p.ninjaSlashTimer = Math.max(0, p.ninjaSlashTimer - simDt);

        // Sequential Dash-Slash Execution choreography across targets during Phase 2!
        if (s.ninjaTargetQueue.length > 0) {
          s.ninjaStepTimer -= simDt;
          // Execute next target every ~0.11s, or flush all remaining when entering Phase 3 (sheathing)
          const flushAll = p.ninjaSlashTimer <= 0.34;
          while (s.ninjaTargetQueue.length > 0 && (s.ninjaStepTimer <= 0 || flushAll)) {
            const nextId = s.ninjaTargetQueue.shift()!;
            const t = s.teachers.find((teacher) => teacher.id === nextId && teacher.state !== 'ko');
            if (!t) continue;

            s.ninjaStepTimer = Math.max(0.06, Math.min(0.13, 0.85 / Math.max(1, s.ninjaTargetQueue.length + 1)));

            const prevX = p.x;
            const prevY = p.y;
            let behindX = Math.max(
              50,
              Math.min(ARENA_WIDTH - 50, t.x - Math.cos(t.angle) * (t.radius + 24))
            );
            let behindY = Math.max(
              50,
              Math.min(ARENA_HEIGHT - 50, t.y - Math.sin(t.angle) * (t.radius + 24))
            );
            for (const obs of mapObstacles) {
              const col = resolveCircleRectCollision(behindX, behindY, p.radius + 4, obs);
              behindX = col.x;
              behindY = col.y;
            }

            // Spawn crimson lightning warp trail from player's previous position to behind this target
            spawnLightningArc(prevX, prevY, behindX, behindY, '#f43f5e');

            // Leave a Shadow Ninja Clone at previous position
            const cloneSlot = s.afterimages.find((a) => !a.active);
            if (cloneSlot) {
              cloneSlot.active = true;
              cloneSlot.x = prevX;
              cloneSlot.y = prevY;
              cloneSlot.angle = Math.atan2(behindY - prevY, behindX - prevX);
              cloneSlot.alpha = 0.98;
              cloneSlot.color = '#f43f5e';
              cloneSlot.kind = 'ninja_clone';
            }

            // Physically move the player character behind the target and orient towards them!
            p.x = behindX;
            p.y = behindY;
            p.angle = t.angle;
            p.scaleX = 1.32;
            p.scaleY = 0.74;
            s.trauma = Math.min(0.95, s.trauma + 0.25);

            // Giant glowing X-Katana slash across target
            const isBossTarget = isBossArchetype(t.archetype);
            spawnKatanaSlash(
              t.x,
              t.y,
              t.angle + 0.35,
              isBossTarget ? '#38bdf8' : '#f43f5e',
              isBossTarget ? 88 : 66
            );
            spawnParticleBurst(t.x, t.y, '#f43f5e', 18, 1.5, 'spark');
            spawnParticleBurst(t.x, t.y, '#ffffff', 6, 1.15, 'paper');

            const execDmg = isBossTarget ? 320 : 999;
            t.hp -= execDmg;
            s.totalDamageDealt += execDmg;
            t.hitFlashTimer = 0.22;
            t.state = 'staggered';
            t.stateTimer = 1.4;
            s.telegraphs = s.telegraphs.filter((z) => z.ownerId !== t.id);

            spawnPopup(
              t.x,
              t.y - t.radius - 12,
              isBossTarget ? `КАЗНЬ БОССА -${execDmg}!` : 'КАЗНЬ КАТАНОЙ!',
              '#f43f5e',
              1.25
            );

            if (t.hp <= 0) {
              t.state = 'ko';
              t.koTimer = 0.35;
              t.hasAttackToken = false;
              t.vx = Math.cos(t.angle) * 260;
              t.vy = Math.sin(t.angle) * 260;
              const spec = TEACHER_SPECS[t.archetype];
              s.teachersDefeated += 1;
              if (isBossTarget) s.bossesDefeated += 1;
              s.waveKills += 1;
              s.combo = Math.min(10, s.combo + 1);
              s.bestCombo = Math.max(s.bestCombo, s.combo);
              s.comboTimer = 4.5;
              const styleMult = getStyleRankForPoints(s.stylePoints).multiplier;
              s.score += Math.round(spec.scoreValue * styleMult);
              p.scrap += spec.scrapDrop;
              p.hp = Math.min(p.maxHp, p.hp + 7);
              spawnDecal(t.x, t.y, 22, 'slime', spec.color);
            }
          }
        }
      }
      if (s.globalFreezeTimer > 0) s.globalFreezeTimer = Math.max(0, s.globalFreezeTimer - simDt);
      if (s.dashBufferTimer > 0) s.dashBufferTimer = Math.max(0, s.dashBufferTimer - simDt);

      // Decay style points when passive
      const decayRate = s.stylePoints > 600 ? 34 : s.stylePoints > 300 ? 22 : 12;
      s.stylePoints = Math.max(0, s.stylePoints - decayRate * simDt);
      for (let i = s.styleFeed.length - 1; i >= 0; i--) {
        s.styleFeed[i].ttl -= simDt;
        if (s.styleFeed[i].ttl <= 0) {
          s.styleFeed.splice(i, 1);
        }
      }

      if (s.waveBannerTimer > 0) {
        s.waveBannerTimer = Math.max(0, s.waveBannerTimer - simDt);
        if (s.waveBannerTimer === 0) s.waveBannerText = null;
      }
      if (s.statusToastTimer > 0) {
        s.statusToastTimer = Math.max(0, s.statusToastTimer - simDt);
        if (s.statusToastTimer === 0) s.statusToast = null;
      }
      if (s.comboTimer > 0) {
        s.comboTimer = Math.max(0, s.comboTimer - simDt);
        if (s.comboTimer === 0) s.combo = 1;
      }

      // Update Dash, Cyberpunk Sandevistan & Shadow Ninja Afterimage Ghosts
      for (const img of s.afterimages) {
        if (!img.active) continue;
        const fadeSpeed =
          img.kind === 'sandevistan' ? 1.55 : img.kind === 'ninja_clone' ? 1.4 : 4.2;
        img.alpha -= simDt * fadeSpeed;
        if (img.alpha <= 0) img.active = false;
      }
      if (p.sandevistanTimer > 0 || p.dashTimer > 0 || p.speedBoostTimer > 0) {
        s.afterimageSpawnTimer -= simDt;
        if (s.afterimageSpawnTimer <= 0) {
          s.afterimageSpawnTimer = p.sandevistanTimer > 0 ? 0.025 : 0.035;
          const slot = s.afterimages.find((a) => !a.active);
          if (slot) {
            slot.active = true;
            slot.x = p.x;
            slot.y = p.y;
            slot.angle = p.angle;
            slot.alpha = p.sandevistanTimer > 0 ? 0.92 : 0.85;
            if (p.sandevistanTimer > 0) {
              slot.kind = 'sandevistan';
              slot.color =
                SANDEVISTAN_TRAIL_COLORS[
                  s.sandevistanColorIdx % SANDEVISTAN_TRAIL_COLORS.length
                ];
              s.sandevistanColorIdx += 1;
            } else {
              slot.kind = 'dash';
              slot.color = p.dashTimer > 0 ? '#38bdf8' : '#a3e635';
            }
          }
        }
      }

      p.scaleX += (1 - p.scaleX) * Math.min(1, simDt * 14);
      p.scaleY += (1 - p.scaleY) * Math.min(1, simDt * 14);

      // Player Movement (WASD / Arrow Keys + Touch Virtual D-Pad)
      let moveX = s.touchMoveX;
      let moveY = s.touchMoveY;
      if (s.keysHeld.has('KeyW') || s.keysHeld.has('ArrowUp')) moveY -= 1;
      if (s.keysHeld.has('KeyS') || s.keysHeld.has('ArrowDown')) moveY += 1;
      if (s.keysHeld.has('KeyA') || s.keysHeld.has('ArrowLeft')) moveX -= 1;
      if (s.keysHeld.has('KeyD') || s.keysHeld.has('ArrowRight')) moveX += 1;

      if (moveX !== 0 || moveY !== 0) {
        const mag = Math.hypot(moveX, moveY);
        moveX /= mag;
        moveY /= mag;
      }

      // Buffered Dash execution
      if (s.dashBufferTimer > 0 && p.dashCooldown <= 0) {
        s.dashBufferTimer = 0;
        p.dashCooldown = 1.25;
        p.dashTimer = 0.17;
        p.invulnTimer = Math.max(p.invulnTimer, 0.25);
        p.scaleX = 1.3;
        p.scaleY = 0.74;
        const dashDirX = moveX !== 0 || moveY !== 0 ? moveX : Math.cos(p.angle);
        const dashDirY = moveX !== 0 || moveY !== 0 ? moveY : Math.sin(p.angle);
        p.vx = dashDirX * 810;
        p.vy = dashDirY * 810;
        sound.playDash();
        spawnShockwaveRing(p.x, p.y, 44, '#38bdf8', 0.22);
        spawnParticleBurst(p.x, p.y, '#fef08a', 12, 0.95, 'spark');

        // Check if dashing narrowly through an active enemy attack telegraph!
        for (const tg of s.telegraphs) {
          if (Math.hypot(p.x - tg.targetX, p.y - tg.targetY) <= tg.radius + 45) {
            addStyleBonus('+УКЛОНЕНИЕ В МИЛЛИМЕТРЕ!', 65, '#38bdf8');
            spawnPopup(p.x, p.y - 26, '+УКЛОНЕНИЕ!', '#38bdf8', 1.15);
            break;
          }
        }
      }

      const speedMult =
        (p.sandevistanTimer > 0 ? 1.65 : 1.0) *
        (p.speedBoostTimer > 0 ? 1.35 : 1.0) *
        (p.dashTimer > 0 ? 2.4 : 1.0);
      const targetVx = moveX * p.speed * speedMult;
      const targetVy = moveY * p.speed * speedMult;
      p.vx += (targetVx - p.vx) * Math.min(1, simDt * 16);
      p.vy += (targetVy - p.vy) * Math.min(1, simDt * 16);

      const stepDist = Math.hypot(p.vx, p.vy) * simDt;
      p.walkDistance += stepDist;
      p.x = Math.max(40, Math.min(ARENA_WIDTH - 40, p.x + p.vx * simDt));
      p.y = Math.max(40, Math.min(ARENA_HEIGHT - 40, p.y + p.vy * simDt));

      for (const obs of mapObstacles) {
        const col = resolveCircleRectCollision(p.x, p.y, p.radius, obs);
        if (col.collided) {
          p.x = col.x;
          p.y = col.y;
          const dot = p.vx * col.normalX + p.vy * col.normalY;
          if (dot < 0) {
            p.vx -= dot * col.normalX;
            p.vy -= dot * col.normalY;
          }
        }
      }

      for (const st of s.barricades) {
        const bCol = resolveCircleCircleCollision(p.x, p.y, p.radius, st.x, st.y, st.radius);
        if (bCol.collided) {
          p.x = bCol.x1;
          p.y = bCol.y1;
          const dot = p.vx * bCol.normalX + p.vy * bCol.normalY;
          if (dot < 0) {
            p.vx -= dot * bCol.normalX;
            p.vy -= dot * bCol.normalY;
          }
        }
      }

      for (let ei = s.explosives.length - 1; ei >= 0; ei--) {
        const exp = s.explosives[ei];
        if (exp.destroyed) {
          s.explosives.splice(ei, 1);
          continue;
        }
        const eCol = resolveCircleCircleCollision(p.x, p.y, p.radius, exp.x, exp.y, exp.radius);
        if (eCol.collided) {
          if (p.dashTimer > 0 && exp.kind === 'supply_crate') {
            detonateExplosiveProp(exp);
            s.explosives.splice(ei, 1);
            continue;
          }
          p.x = eCol.x1;
          p.y = eCol.y1;
          const dot = p.vx * eCol.normalX + p.vy * eCol.normalY;
          if (dot < 0) {
            p.vx -= dot * eCol.normalX;
            p.vy -= dot * eCol.normalY;
          }
        }
      }

      // Check Secret Stash Discovery & Environmental Lore!
      if (
        s.secretStash &&
        !s.secretStash.discovered &&
        Math.hypot(p.x - s.secretStash.x, p.y - s.secretStash.y) <=
          p.radius + s.secretStash.radius + 14
      ) {
        s.secretStash.discovered = true;
        s.secretStashesOpenedInRun += 1;
        p.scrap += s.secretStash.scrapReward;
        p.shield = Math.min(p.maxShield, p.shield + 45);
        p.hp = Math.min(p.maxHp, p.hp + 25);
        p.ammo.shotgun = Math.min(WEAPON_SPECS.shotgun.maxAmmo, p.ammo.shotgun + 10);
        p.ammo.tesla = Math.min(WEAPON_SPECS.tesla.maxAmmo, p.ammo.tesla + 8);
        sound.playPickup();
        sound.playRankUp();
        spawnShockwaveRing(s.secretStash.x, s.secretStash.y, 110, '#facc15', 0.4);
        spawnParticleBurst(s.secretStash.x, s.secretStash.y, '#fde047', 22, 1.3, 'spark');
        spawnPopup(
          s.secretStash.x,
          s.secretStash.y - 26,
          `ТАЙНИК ВСКРЫТ! +${s.secretStash.scrapReward} ДЕТАЛЕЙ!`,
          '#fde047',
          1.3
        );
        addStyleBonus(`+СЕКРЕТ: ${s.secretStash.title}`, 150, '#facc15');
        s.statusToast = `${s.secretStash.title}: ${s.secretStash.loreText}`;
        s.statusToastTimer = 5.5;
      }

      // Update Active Random Event & Evacuation Drill Zone
      if (s.activeEvent && s.activeEventTimer > 0) {
        s.activeEventTimer = Math.max(0, s.activeEventTimer - simDt);
        if (s.evacZone) {
          if (Math.hypot(p.x - s.evacZone.x, p.y - s.evacZone.y) <= s.evacZone.radius) {
            s.evacZone.progress = Math.min(1, s.evacZone.progress + simDt / 5.0);
            if (s.evacZone.progress >= 1) {
              sound.playRankUp();
              p.scrap += 65;
              p.shield = p.maxShield;
              p.overdriveTimer = Math.max(p.overdriveTimer, 8.0);
              spawnShockwaveRing(s.evacZone.x, s.evacZone.y, 160, '#38bdf8', 0.45);
              spawnPopup(p.x, p.y - 32, 'ЭВАКУАЦИЯ ВЫПОЛНЕНА! +65 ДЕТАЛЕЙ!', '#38bdf8', 1.35);
              addStyleBonus('+ЭВАКУАЦИЯ ВЫПОЛНЕНА!', 175, '#38bdf8');
              s.evacZone = null;
              s.activeEvent = null;
              s.activeEventTimer = 0;
            }
          }
        }
        if (s.activeEventTimer === 0) {
          s.activeEvent = null;
          s.evacZone = null;
        }
      }

      // Safe Camera Clamping
      s.cameraX += (p.x - s.cameraX) * Math.min(1, simDt * 9);
      s.cameraY += (p.y - s.cameraY) * Math.min(1, simDt * 9);
      if (viewW >= ARENA_WIDTH) {
        s.cameraX = ARENA_WIDTH / 2;
      } else {
        s.cameraX = Math.max(viewW / 2, Math.min(ARENA_WIDTH - viewW / 2, s.cameraX));
      }
      if (viewH >= ARENA_HEIGHT) {
        s.cameraY = ARENA_HEIGHT / 2;
      } else {
        s.cameraY = Math.max(viewH / 2, Math.min(ARENA_HEIGHT - viewH / 2, s.cameraY));
      }

      // Update Mouse World Coordinates & Smart Auto-Aim
      const worldAim = screenToWorld(s.mouseClientX, s.mouseClientY);
      const timeSinceMouseMoved = now - s.lastMouseMoveTime;
      const touchpadIdleWhileWalking =
        (moveX !== 0 || moveY !== 0) &&
        s.keysHeld.has('Space') &&
        timeSinceMouseMoved > 380;

      let lockedTarget: ZombieTeacher | null = null;
      if (s.autoAim || touchpadIdleWhileWalking) {
        let bestDist = 680;
        for (const t of s.teachers) {
          if (t.state === 'ko') continue;
          const d = Math.hypot(t.x - p.x, t.y - p.y);
          if (d < bestDist) {
            bestDist = d;
            lockedTarget = t;
          }
        }
      }

      if (lockedTarget) {
        s.mouseWorldX = lockedTarget.x;
        s.mouseWorldY = lockedTarget.y;
        p.angle = Math.atan2(lockedTarget.y - p.y, lockedTarget.x - p.x);
      } else {
        s.mouseWorldX = worldAim.wx;
        s.mouseWorldY = worldAim.wy;
        p.angle = Math.atan2(s.mouseWorldY - p.y, s.mouseWorldX - p.x);
      }

      if (s.hitstopTimer > 0) {
        s.hitstopTimer = Math.max(0, s.hitstopTimer - dt);
        renderSchoolArena(ctx, viewW, viewH, {
          player: s.player,
          teachers: s.teachers,
          projectiles: s.projectiles,
          barricades: s.barricades,
          explosives: s.explosives,
          bonuses: s.bonuses,
          hazards: s.hazards,
          telegraphs: s.telegraphs,
          particles: s.particles,
          decals: s.decals,
          popups: s.popups,
          afterimages: s.afterimages,
          cameraX: s.cameraX,
          cameraY: s.cameraY,
          shakeOffsetX,
          shakeOffsetY,
          mouseWorldX: s.mouseWorldX,
          mouseWorldY: s.mouseWorldY,
          globalFreezeTimer: s.globalFreezeTimer,
          isTitleMode: false,
          elapsedTime: s.elapsedTime,
          mapId: s.mapId,
          secretStash: s.secretStash,
          activeEvent: s.activeEvent,
          evacZone: s.evacZone,
        });
        return;
      }

      // Player Shooting (with Weapon Modifications applied)
      const wantsToFire = s.mouseDown || s.keysHeld.has('Space');
      if (wantsToFire && p.fireCooldown <= 0) {
        if (p.ammo[p.activeWeapon] === 0) {
          p.activeWeapon = 'slingshot';
          s.statusToast = 'Патроны кончились -> Рогатка!';
          s.statusToastTimer = 1.5;
        }
        const wSpec = getModifiedWeaponSpec(p.activeWeapon, p.weaponMods);

        if (p.ammo[p.activeWeapon] > 0) {
          p.ammo[p.activeWeapon] -= 1;
        }

        s.waveShotsFired += 1;
        s.totalShotsFired += 1;

        p.fireCooldown =
          (wSpec.cooldown / p.fireRateMultiplier) * (p.overdriveTimer > 0 ? 0.75 : 1.0);
        p.scaleX = 0.85;
        p.scaleY = 1.16;
        p.recoilOffset = wSpec.isHeavy ? 8 : 4.5;
        p.muzzleFlashTimer = 0.06;
        const recoilImpulse = wSpec.isHeavy ? 110 : 38;
        p.vx -= Math.cos(p.angle) * recoilImpulse;
        p.vy -= Math.sin(p.angle) * recoilImpulse;
        sound.playShoot(wSpec.id);
        if (wSpec.isHeavy) {
          s.trauma = Math.min(0.48, s.trauma + 0.16);
        }

        // Exact world coordinates of the weapon barrel tip (local x = 32, local y = +4.8)
        const cosA = Math.cos(p.angle);
        const sinA = Math.sin(p.angle);
        const muzzleX = p.x + cosA * 32 - sinA * 4.8;
        const muzzleY = p.y + sinA * 32 + cosA * 4.8;
        const distToCrosshair = Math.hypot(s.mouseWorldX - p.x, s.mouseWorldY - p.y);
        const baseBulletAngle =
          distToCrosshair > 44
            ? Math.atan2(s.mouseWorldY - muzzleY, s.mouseWorldX - muzzleX)
            : p.angle;

        spawnParticleBurst(
          muzzleX,
          muzzleY,
          wSpec.color,
          wSpec.isHeavy ? 8 : 4,
          0.8,
          'spark'
        );
        if (wSpec.id === 'shotgun' || wSpec.id === 'nailgun') {
          const breechX = p.x + cosA * 12 - sinA * 6;
          const breechY = p.y + sinA * 12 + cosA * 6;
          spawnParticleBurst(breechX, breechY, '#fbbf24', 1, 0.55, 'shell');
        }

        const projRadius =
          wSpec.id === 'acid'
            ? 12.0
            : wSpec.id === 'tesla'
            ? 10.5
            : wSpec.id === 'slingshot'
            ? 8.5
            : wSpec.id === 'nailgun'
            ? 7.5
            : 7.0;

        for (let i = 0; i < wSpec.projectiles; i++) {
          const offset =
            wSpec.projectiles === 1
              ? (Math.random() - 0.5) * wSpec.spread
              : (i / (wSpec.projectiles - 1) - 0.5) * wSpec.spread;
          fireProjectile(
            muzzleX,
            muzzleY,
            baseBulletAngle + offset,
            wSpec.damage,
            wSpec.speed,
            wSpec.range,
            wSpec.color,
            wSpec.pierce,
            wSpec.aoeRadius,
            wSpec.knockback,
            true,
            wSpec.isHeavy,
            wSpec.id,
            projRadius
          );
        }
      }

      s.justPressed.clear();

      // Wave Spawner, Mid-Wave Random Events & Wave Clear Check
      if (s.waveToSpawn > 0) {
        s.spawnTimer -= simDt;
        const wCfg = getWaveConfig(s.wave);

        // Trigger a random dynamic School Event once per wave around 60% remaining spawns
        if (
          !s.eventTriggeredInWave &&
          s.waveToSpawn <= Math.ceil(wCfg.totalBudget * 0.65)
        ) {
          s.eventTriggeredInWave = true;
          const eventOrder: SchoolEventId[] = [
            'supply_drop',
            'power_outage',
            'evacuation_drill',
            'toxic_spill',
            'emergency_lockdown',
          ];
          const pickedEv =
            eventOrder[(s.wave + Math.floor(s.runTimeSec)) % eventOrder.length];
          const evSpec = SCHOOL_EVENTS[pickedEv];
          s.activeEvent = pickedEv;
          s.activeEventTimer = evSpec.duration;
          s.statusToast = `${evSpec.title}: ${evSpec.subtitle}`;
          s.statusToastTimer = 4.0;
          sound.playSchoolBell();

          if (pickedEv === 'supply_drop') {
            s.bonuses.push(
              {
                id: s.nextEntityId++,
                type: 'ammo',
                x: ARENA_WIDTH / 2 - 80,
                y: ARENA_HEIGHT / 2,
                ttl: 22,
                maxTtl: 22,
              },
              {
                id: s.nextEntityId++,
                type: 'medkit',
                x: ARENA_WIDTH / 2 + 80,
                y: ARENA_HEIGHT / 2,
                ttl: 22,
                maxTtl: 22,
              },
              {
                id: s.nextEntityId++,
                type: 'overdrive',
                x: ARENA_WIDTH / 2,
                y: ARENA_HEIGHT / 2 + 65,
                ttl: 22,
                maxTtl: 22,
              }
            );
            spawnShockwaveRing(ARENA_WIDTH / 2, ARENA_HEIGHT / 2, 160, '#4ade80', 0.45);
          } else if (pickedEv === 'evacuation_drill') {
            s.evacZone = {
              x: ARENA_WIDTH / 2,
              y: ARENA_HEIGHT / 2,
              radius: 105,
              progress: 0,
            };
          } else if (pickedEv === 'toxic_spill') {
            const spillSpots = [
              { x: 640, y: 460 },
              { x: 1160, y: 460 },
              { x: 900, y: 760 },
            ];
            for (const sp of spillSpots) {
              s.hazards.push({
                id: s.nextEntityId++,
                x: sp.x,
                y: sp.y,
                radius: 85,
                ttl: evSpec.duration,
                maxTtl: evSpec.duration,
                dps: 14,
                fromPlayer: false,
              });
            }
          } else if (pickedEv === 'emergency_lockdown') {
            spawnTeacherForWave('pe_charger');
            spawnTeacherForWave('history_shield');
          }
        }

        if (s.spawnTimer <= 0) {
          s.spawnTimer = wCfg.spawnInterval;
          if (
            wCfg.spawnBoss &&
            !s.bossSpawnedInWave &&
            s.waveToSpawn <= Math.ceil(wCfg.totalBudget / 2)
          ) {
            s.bossSpawnedInWave = true;
            const bossArchetype = wCfg.bossId ?? 'principal_boss';
            spawnTeacherForWave(bossArchetype);
            sound.playBossPhase();
            s.waveBannerText = `${TEACHER_SPECS[bossArchetype].name.toUpperCase()} ВЫШЕЛ В КОРИДОР!`;
            s.waveBannerTimer = 3.2;
          } else {
            const pick =
              wCfg.archetypePool[Math.floor(Math.random() * wCfg.archetypePool.length)];
            spawnTeacherForWave(pick);
          }
          s.waveToSpawn -= 1;
        }
      } else if (s.teachers.length === 0) {
        if (s.wave >= MAX_WAVES) {
          finishRunWithSummary(true);
          return;
        } else {
          // Open ULTRAKILL Wave Clear Report & Upgrade Selector!
          rollBetweenWaveUpgrades(p.weaponMods);
          const waveTime = Math.max(1, s.runTimeSec - s.waveStartTime);
          const acc =
            s.waveShotsFired > 0
              ? Math.min(100, Math.round((s.waveShotsHit / s.waveShotsFired) * 100))
              : 100;
          const maxRankId: StyleRankId =
            STYLE_RANKS[s.waveHighestRankIndex]?.id ?? 'C';
          const baseReport = {
            wave: s.wave,
            clearTimeSec: waveTime,
            kills: s.waveKills,
            shotsFired: s.waveShotsFired,
            shotsHit: s.waveShotsHit,
            accuracy: acc,
            damageTaken: Math.round(s.waveDamageTaken),
            maxStyleRank: maxRankId,
          };
          setWaveReport({
            ...baseReport,
            finalGrade: computeWaveGrade(baseReport),
          });
          sound.playBellOutcome(true);
          s.keysHeld.clear();
          s.mouseDown = false;
          syncBodyPhase('wave_clear');
          return;
        }
      }

      // Update Globe Auto-Turrets
      for (const st of s.barricades) {
        if (st.kind === 'turret') {
          st.fireTimer -= simDt;
          let nearest: ZombieTeacher | null = null;
          let bestDist = 440;
          for (const t of s.teachers) {
            if (t.state === 'ko') continue;
            const d = Math.hypot(t.x - st.x, t.y - st.y);
            if (d < bestDist) {
              bestDist = d;
              nearest = t;
            }
          }
          if (nearest) {
            st.angle = Math.atan2(nearest.y - st.y, nearest.x - st.x);
            if (st.fireTimer <= 0) {
              st.fireTimer = 0.38;
              sound.playTurretShoot();
              fireProjectile(
                st.x + Math.cos(st.angle) * (st.radius + 8),
                st.y + Math.sin(st.angle) * (st.radius + 8),
                st.angle,
                18,
                760,
                440,
                '#38bdf8',
                1,
                0,
                65,
                true,
                false,
                'turret',
                7.5
              );
            }
          }
        }
      }

      // Apply soft-body flocking repulsion so teachers don't merge into a single overlapping sprite
      applyTeacherFlocking(s.teachers);

      // Update Zombie Teachers AI, Stagger Windows, Multi-Phase Boss & KO Transitions
      for (let i = s.teachers.length - 1; i >= 0; i--) {
        const t = s.teachers[i];
        const spec = TEACHER_SPECS[t.archetype];

        if (t.quoteTimer && t.quoteTimer > 0) {
          t.quoteTimer = Math.max(0, t.quoteTimer - simDt);
        }

        if (t.state === 'ko') {
          t.koTimer -= simDt;
          t.x += t.vx * simDt;
          t.y += t.vy * simDt;
          if (t.koTimer <= 0) {
            s.teachers.splice(i, 1);
          }
          continue;
        }

        // Check Boss Phase Transitions (Phase 1 -> Phase 2 -> Phase 3) for all 4 Bosses!
        if (isBossArchetype(t.archetype)) {
          const desiredPhase = getBossPhaseForHp(t.hp, t.maxHp);
          if ((t.bossPhase ?? 1) < desiredPhase) {
            t.bossPhase = desiredPhase;
            sound.playBossPhase();
            s.trauma = Math.min(0.85, s.trauma + 0.45);
            spawnShockwaveRing(
              t.x,
              t.y,
              220,
              desiredPhase === 3 ? '#ef4444' : '#facc15',
              0.42
            );
            t.quote =
              desiredPhase === 3
                ? `${spec.name.toUpperCase()} · ФАЗА 3: БЕЗУМИЕ!`
                : `${spec.name.toUpperCase()} · ФАЗА 2: УСИЛЕНИЕ!`;
            t.quoteTimer = 3.5;
            s.waveBannerText = t.quote;
            s.waveBannerTimer = 2.8;

            // Vice Principal summons reinforcements on Phase transition!
            if (t.archetype === 'vice_principal_boss') {
              spawnTeacherForWave('literature_chaser');
              spawnTeacherForWave('math_sniper');
            }
          }
        }

        if (s.globalFreezeTimer > 0 || p.sandevistanTimer > 0 || t.frozenTimer > 0) {
          t.frozenTimer = Math.max(0, t.frozenTimer - simDt);
          continue;
        }

        if (t.state === 'staggered') {
          t.vx *= 0.82;
          t.vy *= 0.82;
          t.stateTimer -= simDt;
          if (t.stateTimer <= 0) {
            t.state = 'seeking';
          }
          t.x = Math.max(36, Math.min(ARENA_WIDTH - 36, t.x + t.vx * simDt));
          t.y = Math.max(36, Math.min(ARENA_HEIGHT - 36, t.y + t.vy * simDt));
          continue;
        }

        if (t.attackCooldownTimer > 0) {
          t.attackCooldownTimer = Math.max(0, t.attackCooldownTimer - simDt);
        }

        let targetX = p.x;
        let targetY = p.y;
        let targetBarricade: BarricadeEntity | null = null;
        for (const st of s.barricades) {
          const d = Math.hypot(st.x - t.x, st.y - t.y);
          if (d < 130 && d < Math.hypot(p.x - t.x, p.y - t.y)) {
            targetX = st.x;
            targetY = st.y;
            targetBarricade = st;
            break;
          }
        }

        if (t.state === 'seeking') {
          const seek = computeTeacherSeekVector(t, targetX, targetY, s.elapsedTime);
          t.vx = seek.vx;
          t.vy = seek.vy;
          t.angle = lerpAngle(t.angle, seek.desiredAngle, Math.min(1, simDt * 14));
          t.walkPhase += Math.hypot(t.vx, t.vy) * simDt * 0.09;

          if ((t.quoteTimer ?? 0) > 0) {
            t.quoteTimer = Math.max(0, (t.quoteTimer ?? 0) - simDt);
          }

          const requiresLoS = t.archetype === 'math_sniper';
          const clearShot = !requiresLoS || hasLineOfSight(t.x, t.y, targetX, targetY, mapObstacles);

          if (
            seek.shouldStartWindup &&
            clearShot &&
            t.attackCooldownTimer <= 0 &&
            canAcquireAttackToken(s.teachers, t.id)
          ) {
            t.state = 'windup';
            t.angle = seek.desiredAngle;
            if (!t.quote || (t.quoteTimer ?? 0) <= 0) {
              t.quote = getRandomTeacherBark(t.archetype);
              t.quoteTimer = 2.4;
            }
            const bossWindupMult =
              isBossArchetype(t.archetype) && t.bossPhase === 3 ? 0.72 : 1.0;
            t.stateTimer = spec.telegraphDuration * bossWindupMult;
            t.hasAttackToken = true;
            t.chargeDirX = Math.cos(t.angle);
            t.chargeDirY = Math.sin(t.angle);
            sound.playTelegraph();

            const bossSlamRadius =
              isBossArchetype(t.archetype)
                ? t.bossPhase === 3
                  ? spec.attackRange * 1.35
                  : t.bossPhase === 2
                  ? spec.attackRange * 1.18
                  : spec.attackRange
                : spec.attackRange;

            if (
              t.archetype === 'chem_lobber' ||
              t.archetype === 'principal_boss' ||
              t.archetype === 'vice_principal_boss' ||
              t.archetype === 'lab_experiment_boss'
            ) {
              s.telegraphs.push({
                id: s.nextEntityId++,
                kind: 'circle',
                x: t.x,
                y: t.y,
                targetX: t.archetype === 'principal_boss' ? t.x : targetX,
                targetY: t.archetype === 'principal_boss' ? t.y : targetY,
                radius:
                  t.archetype === 'principal_boss'
                    ? bossSlamRadius
                    : t.archetype === 'lab_experiment_boss'
                    ? 105
                    : 86,
                elapsed: 0,
                duration: t.stateTimer,
                damage: spec.damage,
                ownerId: t.id,
              });
            } else if (
              t.archetype === 'math_sniper' ||
              t.archetype === 'pe_charger' ||
              t.archetype === 'pe_boss'
            ) {
              s.telegraphs.push({
                id: s.nextEntityId++,
                kind: 'line',
                x: t.x,
                y: t.y,
                targetX: t.x + t.chargeDirX * spec.attackRange,
                targetY: t.y + t.chargeDirY * spec.attackRange,
                radius: t.archetype === 'pe_boss' ? 36 : 24,
                elapsed: 0,
                duration: t.stateTimer,
                damage: spec.damage,
                ownerId: t.id,
              });
            }
          }
        } else if (t.state === 'windup') {
          if (isBossArchetype(t.archetype) && (t.bossPhase ?? 1) >= 2) {
            const lungeSpeed = t.bossPhase === 3 ? 140 : 95;
            t.vx = t.chargeDirX * lungeSpeed;
            t.vy = t.chargeDirY * lungeSpeed;
          } else {
            t.vx *= 0.8;
            t.vy *= 0.8;
          }
          t.stateTimer -= simDt;
          if (t.stateTimer <= 0) {
            t.state = 'active_attack';
            t.stateTimer =
              t.archetype === 'pe_charger' || t.archetype === 'pe_boss' ? 0.45 : 0.14;

            if (t.archetype === 'math_sniper') {
              fireProjectile(
                t.x + t.chargeDirX * (t.radius + 10),
                t.y + t.chargeDirY * (t.radius + 10),
                Math.atan2(t.chargeDirY, t.chargeDirX),
                spec.damage,
                560,
                520,
                '#38bdf8',
                1,
                0,
                90,
                false,
                false,
                'enemy_ruler',
                9.0
              );
            } else if (t.archetype === 'vice_principal_boss') {
              // Vice Principal fires a 3-way fan of disciplinary rulers + spawns a zone!
              const baseAng = Math.atan2(t.chargeDirY, t.chargeDirX);
              const fanCount = (t.bossPhase ?? 1) >= 2 ? 5 : 3;
              for (let k = 0; k < fanCount; k++) {
                const offset = (k - Math.floor(fanCount / 2)) * 0.22;
                fireProjectile(
                  t.x + Math.cos(baseAng + offset) * (t.radius + 10),
                  t.y + Math.sin(baseAng + offset) * (t.radius + 10),
                  baseAng + offset,
                  spec.damage,
                  520,
                  540,
                  '#f43f5e',
                  1,
                  0,
                  85,
                  false,
                  false,
                  'enemy_ruler',
                  9.5
                );
              }
            } else if (
              t.archetype === 'chem_lobber' ||
              t.archetype === 'lab_experiment_boss'
            ) {
              const tg = s.telegraphs.find((z) => z.ownerId === t.id);
              const hx = tg ? tg.targetX : targetX;
              const hy = tg ? tg.targetY : targetY;
              const hazRadius = t.archetype === 'lab_experiment_boss' ? 105 : 82;
              s.hazards.push({
                id: s.nextEntityId++,
                x: hx,
                y: hy,
                radius: hazRadius,
                ttl: 5.5,
                maxTtl: 5.5,
                dps: t.archetype === 'lab_experiment_boss' ? 22 : 18,
                fromPlayer: false,
              });
              spawnShockwaveRing(hx, hy, hazRadius, '#a3e635', 0.3);
              spawnParticleBurst(hx, hy, '#a3e635', 14, 0.9, 'circle');
              if (t.archetype === 'lab_experiment_boss') {
                // Also fire mutagenic globules radially!
                const blobs = (t.bossPhase ?? 1) >= 2 ? 6 : 4;
                for (let bIdx = 0; bIdx < blobs; bIdx++) {
                  const bAng = (bIdx * Math.PI * 2) / blobs + s.elapsedTime;
                  fireProjectile(
                    t.x + Math.cos(bAng) * (t.radius + 8),
                    t.y + Math.sin(bAng) * (t.radius + 8),
                    bAng,
                    16,
                    440,
                    460,
                    '#4ade80',
                    1,
                    0,
                    70,
                    false,
                    false,
                    'enemy_ruler',
                    10.0
                  );
                }
              }
            } else if (t.archetype === 'principal_boss') {
              // Boss Megaphone Slam AoE + Phase 2/3 Radial Ruler Barrage!
              const slamRadius =
                t.bossPhase === 3
                  ? spec.attackRange * 1.35
                  : t.bossPhase === 2
                  ? spec.attackRange * 1.18
                  : spec.attackRange;
              spawnShockwaveRing(t.x, t.y, slamRadius, '#c084fc', 0.4);
              spawnParticleBurst(t.x, t.y, '#c084fc', 24, 1.35, 'spark');
              s.trauma = Math.min(0.68, s.trauma + 0.35);
              if (Math.hypot(p.x - t.x, p.y - t.y) <= slamRadius + p.radius) {
                const res = applyDamageToPlayer(p, spec.damage);
                if (res.actualDamageTaken > 0) {
                  p.hp = res.hp;
                  p.shield = res.shield;
                  p.invulnTimer = 0.45;
                  p.hitFlashTimer = 0.12;
                  p.knockbackTimer = 0.2;
                  const kbAng = Math.atan2(p.y - t.y, p.x - t.x);
                  p.vx += Math.cos(kbAng) * 340;
                  p.vy += Math.sin(kbAng) * 340;
                  s.waveDamageTaken += res.actualDamageTaken;
                  s.totalDamageTaken += res.actualDamageTaken;
                  s.stylePoints = Math.max(0, s.stylePoints - 90);
                  sound.playPlayerHurt();
                  spawnPopup(p.x, p.y - 24, `-${res.actualDamageTaken}`, '#fb7185', 1.2);
                }
              }

              // Phase 2 & Phase 3 Boss Radial Projectile Ring
              if ((t.bossPhase ?? 1) >= 2) {
                const count = t.bossPhase === 3 ? 10 : 6;
                for (let k = 0; k < count; k++) {
                  const a = (k * Math.PI * 2) / count + s.elapsedTime;
                  fireProjectile(
                    t.x + Math.cos(a) * (t.radius + 8),
                    t.y + Math.sin(a) * (t.radius + 8),
                    a,
                    16,
                    480,
                    520,
                    '#e879f9',
                    1,
                    0,
                    80,
                    false,
                    false,
                    'enemy_ruler',
                    9.0
                  );
                }
              }
            }
            s.telegraphs = s.telegraphs.filter((z) => z.ownerId !== t.id);
          }
        } else if (t.state === 'active_attack') {
          t.stateTimer -= simDt;
          if (t.archetype === 'pe_charger' || t.archetype === 'pe_boss') {
            const mult = t.archetype === 'pe_boss' ? 3.1 : 2.85;
            t.vx = t.chargeDirX * spec.speed * mult;
            t.vy = t.chargeDirY * spec.speed * mult;
            t.walkPhase += simDt * 24;
          } else {
            t.vx = t.chargeDirX * spec.speed * 1.35;
            t.vy = t.chargeDirY * spec.speed * 1.35;
          }

          if (targetBarricade) {
            if (
              Math.hypot(targetBarricade.x - t.x, targetBarricade.y - t.y) <=
              targetBarricade.radius + t.radius + 8
            ) {
              targetBarricade.hp -= spec.damage;
              sound.playWoodImpact();
              spawnParticleBurst(targetBarricade.x, targetBarricade.y, '#f59e0b', 6, 0.7, 'spark');
              t.state = 'recovery';
              t.stateTimer = 0.35;
              t.hasAttackToken = false;
              t.attackCooldownTimer = spec.attackCooldown;
            }
          } else if (Math.hypot(p.x - t.x, p.y - t.y) <= p.radius + t.radius + 10) {
            const res = applyDamageToPlayer(p, spec.damage);
            if (res.actualDamageTaken > 0) {
              p.hp = res.hp;
              p.shield = res.shield;
              p.invulnTimer = 0.45;
              p.hitFlashTimer = 0.12;
              p.knockbackTimer = 0.18;
              const kbAng = Math.atan2(p.y - t.y, p.x - t.x);
              p.vx += Math.cos(kbAng) * 280;
              p.vy += Math.sin(kbAng) * 280;
              s.waveDamageTaken += res.actualDamageTaken;
              s.totalDamageTaken += res.actualDamageTaken;
              s.stylePoints = Math.max(0, s.stylePoints - 85);
              s.trauma = Math.min(0.65, s.trauma + 0.28);
              s.hitstopTimer = 0.045;
              sound.playPlayerHurt();
              spawnPopup(p.x, p.y - 24, `-${res.actualDamageTaken}`, '#fb7185', 1.2);
            }
            t.state = 'recovery';
            t.stateTimer = 0.4;
            t.hasAttackToken = false;
            t.attackCooldownTimer = spec.attackCooldown;
          }

          if (t.stateTimer <= 0) {
            if (t.archetype === 'pe_boss') {
              // PE Boss finishes charge with a heavy shockwave slam that damages & knocks back nearby player!
              const peSlamRadius = 135;
              spawnShockwaveRing(t.x, t.y, peSlamRadius, '#fb923c', 0.35);
              spawnParticleBurst(t.x, t.y, '#fb923c', 18, 1.15, 'spark');
              s.trauma = Math.min(0.65, s.trauma + 0.25);
              if (Math.hypot(p.x - t.x, p.y - t.y) <= peSlamRadius + p.radius) {
                const slamDmg = Math.round(spec.damage * 0.8);
                const res = applyDamageToPlayer(p, slamDmg);
                if (res.actualDamageTaken > 0) {
                  p.hp = res.hp;
                  p.shield = res.shield;
                  p.invulnTimer = 0.45;
                  p.hitFlashTimer = 0.12;
                  p.knockbackTimer = 0.22;
                  const kbAng = Math.atan2(p.y - t.y, p.x - t.x);
                  p.vx += Math.cos(kbAng) * 360;
                  p.vy += Math.sin(kbAng) * 360;
                  s.waveDamageTaken += res.actualDamageTaken;
                  s.totalDamageTaken += res.actualDamageTaken;
                  s.stylePoints = Math.max(0, s.stylePoints - 75);
                  sound.playPlayerHurt();
                  spawnPopup(p.x, p.y - 24, `-${res.actualDamageTaken} УДАР ГИРЕЙ!`, '#fb923c', 1.2);
                }
              }
            }
            t.state = 'recovery';
            t.stateTimer = 0.35;
            t.hasAttackToken = false;
            t.attackCooldownTimer = spec.attackCooldown;
          }
        } else if (t.state === 'recovery') {
          t.vx *= 0.75;
          t.vy *= 0.75;
          t.stateTimer -= simDt;
          if (t.stateTimer <= 0) {
            t.state = 'seeking';
          }
        }

        t.x = Math.max(36, Math.min(ARENA_WIDTH - 36, t.x + t.vx * simDt));
        t.y = Math.max(36, Math.min(ARENA_HEIGHT - 36, t.y + t.vy * simDt));
        for (const obs of mapObstacles) {
          const col = resolveCircleRectCollision(t.x, t.y, t.radius, obs);
          if (col.collided) {
            t.x = col.x;
            t.y = col.y;
            const dot = t.vx * col.normalX + t.vy * col.normalY;
            if (dot < 0) {
              t.vx -= dot * col.normalX;
              t.vy -= dot * col.normalY;
            }
          }
        }
        for (const st of s.barricades) {
          const bCol = resolveCircleCircleCollision(t.x, t.y, t.radius, st.x, st.y, st.radius);
          if (bCol.collided) {
            t.x = bCol.x1;
            t.y = bCol.y1;
            const dot = t.vx * bCol.normalX + t.vy * bCol.normalY;
            if (dot < 0) {
              t.vx -= dot * bCol.normalX;
              t.vy -= dot * bCol.normalY;
            }
          }
        }
      }

      // Remove destroyed barricades
      for (let i = s.barricades.length - 1; i >= 0; i--) {
        if (s.barricades[i].hp <= 0) {
          spawnShockwaveRing(s.barricades[i].x, s.barricades[i].y, 48, '#d97706', 0.25);
          spawnParticleBurst(s.barricades[i].x, s.barricades[i].y, '#d97706', 14, 1.0, 'spark');
          s.barricades.splice(i, 1);
        }
      }

      // Update Telegraphs
      for (let i = s.telegraphs.length - 1; i >= 0; i--) {
        s.telegraphs[i].elapsed += simDt;
        if (s.telegraphs[i].elapsed >= s.telegraphs[i].duration + 0.1) {
          s.telegraphs.splice(i, 1);
        }
      }

      // Update Projectiles & ULTRAKILL Synergies / Hit Detection
      for (const proj of s.projectiles) {
        if (!proj.active) continue;

        // SANDEVISTAN TIME STASIS LOGIC:
        // During Sandevistan, player projectiles step forward up to their stasis distance (hovering in front of gun)
        // and then freeze completely in mid-air awaiting the Chrono-Barrage launch!
        // Enemy projectiles are frozen 100% in place.
        if (p.sandevistanTimer > 0) {
          if (!proj.fromPlayer) {
            // Enemy bullets are frozen in time completely
            continue;
          }
          if (proj.stasisLaunchDist !== undefined && proj.traveled >= proj.stasisLaunchDist) {
            // Reached stasis suspension distance, freeze in air!
            proj.spin += simDt * 5;
            continue;
          }
        }

        proj.prevX = proj.x;
        proj.prevY = proj.y;
        proj.spin += simDt * 18;
        const stepX = proj.vx * simDt;
        const stepY = proj.vy * simDt;
        proj.x += stepX;
        proj.y += stepY;
        proj.traveled += Math.hypot(stepX, stepY);

        if (
          proj.traveled >= proj.maxRange ||
          proj.x < 20 ||
          proj.x > ARENA_WIDTH - 20 ||
          proj.y < 20 ||
          proj.y > ARENA_HEIGHT - 20
        ) {
          proj.active = false;
          continue;
        }

        let hitWall = false;
        for (const obs of mapObstacles) {
          if (segmentIntersectsRect(proj.prevX, proj.prevY, proj.x, proj.y, obs)) {
            hitWall = true;
            break;
          }
        }
        if (hitWall) {
          // Weapon Mod: Slingshot Ricochet bounces off walls!
          if (
            proj.fromPlayer &&
            proj.weaponKind === 'slingshot' &&
            p.weaponMods.includes('slingshot_ricochet') &&
            proj.pierce > 1
          ) {
            proj.pierce -= 1;
            proj.x = proj.prevX;
            proj.y = proj.prevY;
            proj.vx = -proj.vx;
            proj.vy = -proj.vy;
            proj.angle = Math.atan2(proj.vy, proj.vx);
            spawnParticleBurst(proj.x, proj.y, '#facc15', 5, 0.7, 'spark');
            continue;
          }
          if (proj.aoeRadius > 0 && proj.fromPlayer) {
            s.hazards.push({
              id: s.nextEntityId++,
              x: proj.x,
              y: proj.y,
              radius: proj.aoeRadius,
              ttl: 4.0,
              maxTtl: 4.0,
              dps: proj.weaponKind === 'shotgun' ? 24 : 28,
              fromPlayer: true,
            });
            spawnShockwaveRing(proj.x, proj.y, proj.aoeRadius, '#4ade80', 0.25);
          }
          spawnParticleBurst(proj.x, proj.y, proj.color, 5, 0.55, 'spark');
          proj.active = false;
          continue;
        }

        if (!proj.fromPlayer) {
          for (const st of s.barricades) {
            const bDistSq = distToSegmentSq(st.x, st.y, proj.prevX, proj.prevY, proj.x, proj.y);
            if (bDistSq <= (proj.radius + st.radius) ** 2) {
              st.hp -= proj.damage;
              sound.playWoodImpact();
              spawnParticleBurst(proj.x, proj.y, '#38bdf8', 5, 0.6, 'spark');
              proj.active = false;
              break;
            }
          }
          if (!proj.active) continue;

          const pDistSq = distToSegmentSq(p.x, p.y, proj.prevX, proj.prevY, proj.x, proj.y);
          if (pDistSq <= (proj.radius + p.radius) ** 2) {
            const res = applyDamageToPlayer(p, proj.damage);
            if (res.actualDamageTaken > 0) {
              p.hp = res.hp;
              p.shield = res.shield;
              p.invulnTimer = 0.35;
              p.hitFlashTimer = 0.12;
              s.waveDamageTaken += res.actualDamageTaken;
              s.stylePoints = Math.max(0, s.stylePoints - 75);
              s.trauma = Math.min(0.6, s.trauma + 0.22);
              sound.playPlayerHurt();
              spawnPopup(p.x, p.y - 24, `-${res.actualDamageTaken}`, '#fb7185', 1.15);
            }
            proj.active = false;
          }
          continue;
        }

        // Player Projectile Parrying an Enemy Projectile in mid-air!
        for (const otherProj of s.projectiles) {
          if (otherProj.active && !otherProj.fromPlayer) {
            const parryDistSq = distToSegmentSq(
              otherProj.x,
              otherProj.y,
              proj.prevX,
              proj.prevY,
              proj.x,
              proj.y
            );
            if (parryDistSq <= (proj.radius + otherProj.radius + 10) ** 2) {
              otherProj.active = false;
              proj.active = false;
              s.parriesInRun += 1;
              sound.playParry();
              s.hitstopTimer = Math.max(s.hitstopTimer, 0.045);
              p.hp = Math.min(p.maxHp, p.hp + 6);
              addStyleBonus('+ПАРИРОВАНИЕ СНАРЯДА!', 110, '#facc15');
              spawnShockwaveRing(proj.x, proj.y, 55, '#facc15', 0.26);
              spawnParticleBurst(proj.x, proj.y, '#fef08a', 14, 1.2, 'spark');
              spawnPopup(proj.x, proj.y - 16, '+ПАРИРОВАНИЕ!', '#fef08a', 1.25);
              break;
            }
          }
        }
        if (!proj.active) continue;

        // Weapon Combo Synergy: Shotgun or Tesla shot detonating an active Acid Hazard puddle!
        if (proj.weaponKind === 'shotgun' || proj.weaponKind === 'tesla') {
          for (let hi = s.hazards.length - 1; hi >= 0; hi--) {
            const hz = s.hazards[hi];
            const hzDistSq = distToSegmentSq(hz.x, hz.y, proj.prevX, proj.prevY, proj.x, proj.y);
            if (hzDistSq <= (hz.radius * 0.75) ** 2) {
              s.hazards.splice(hi, 1);
              proj.active = false;
              sound.playExplosion();
              s.trauma = Math.min(0.8, s.trauma + 0.42);
              s.hitstopTimer = Math.max(s.hitstopTimer, 0.045);
              spawnShockwaveRing(hz.x, hz.y, 155, '#4ade80', 0.35);
              spawnParticleBurst(hz.x, hz.y, '#a3e635', 22, 1.4, 'spark');
              spawnDecal(hz.x, hz.y, 38, 'scorch', '#070a09');
              addStyleBonus('+КАТАЛИЗАТОР ВЗРЫВА!', 120, '#4ade80');
              spawnPopup(hz.x, hz.y - 24, 'КАТАЛИЗАТОР!', '#4ade80', 1.25);

              for (const t of s.teachers) {
                if (t.state === 'ko') continue;
                if (Math.hypot(t.x - hz.x, t.y - hz.y) <= 155 + t.radius) {
                  t.hp -= 95;
                  t.hitFlashTimer = 0.12;
                  spawnPopup(t.x, t.y - 18, '-95 ХИМ-ВЗРЫВ!', '#a3e635', 1.15);
                  if (t.hp <= 0) {
                    t.state = 'ko';
                    t.koTimer = 0.35;
                    t.hasAttackToken = false;
                    s.telegraphs = s.telegraphs.filter((z) => z.ownerId !== t.id);
                    s.teachersDefeated += 1;
                    if (isBossArchetype(t.archetype)) s.bossesDefeated += 1;
                    s.waveKills += 1;
                    s.combo = Math.min(10, s.combo + 1);
                    s.bestCombo = Math.max(s.bestCombo, s.combo);
                    s.comboTimer = 4.5;
                    const spec = TEACHER_SPECS[t.archetype];
                    const styleMult = getStyleRankForPoints(s.stylePoints).multiplier;
                    s.score += Math.round(spec.scoreValue * styleMult);
                    p.scrap += spec.scrapDrop;
                  }
                }
              }
              break;
            }
          }
        }
        if (!proj.active) continue;

        // Player projectile hitting Explosive Props
        for (let ei = s.explosives.length - 1; ei >= 0; ei--) {
          const exp = s.explosives[ei];
          const expDistSq = distToSegmentSq(exp.x, exp.y, proj.prevX, proj.prevY, proj.x, proj.y);
          if (expDistSq <= (proj.radius + exp.radius) ** 2) {
            exp.hp -= proj.damage;
            exp.hitFlashTimer = 0.08;
            spawnParticleBurst(exp.x, exp.y, '#fde047', 6, 0.7, 'spark');
            proj.active = false;
            if (exp.hp <= 0) {
              s.explosives.splice(ei, 1);
              detonateExplosiveProp(exp);
            }
            break;
          }
        }
        if (!proj.active) continue;

        // Player projectile hitting zombie teachers
        for (const t of s.teachers) {
          if (t.state === 'ko' || proj.hitIds.includes(t.id)) continue;
          const tDistSq = distToSegmentSq(t.x, t.y, proj.prevX, proj.prevY, proj.x, proj.y);
          if (tDistSq <= (proj.radius + t.radius) ** 2) {
            proj.hitIds.push(t.id);
            s.waveShotsHit += 1;
            s.totalShotsHit += 1;

            const distToPlayer = Math.hypot(t.x - p.x, t.y - p.y);
            const isPointBlank = proj.weaponKind === 'shotgun' && distToPlayer <= 145;
            const isQuickSwap = p.weaponSwitchTimer > 0;

            const wasWindup = t.state === 'windup';
            const dmgRes = computeEffectiveProjectileDamage(
              proj.damage,
              p.overdriveTimer,
              proj.angle,
              t,
              proj.pierce,
              isPointBlank,
              isQuickSwap
            );
            t.hp -= dmgRes.damage;
            s.totalDamageDealt += dmgRes.damage;
            t.hitFlashTimer = 0.06;
            p.rage = Math.min(p.maxRage, p.rage + 3.8);

            // Interrupt & Stagger enemy if hit with heavy/slingshot during windup!
            if (wasWindup && !dmgRes.blockedByShield && (proj.isHeavy || proj.weaponKind === 'slingshot')) {
              t.state = 'staggered';
              t.stateTimer = 0.85;
              t.hasAttackToken = false;
              s.telegraphs = s.telegraphs.filter((z) => z.ownerId !== t.id);
              sound.playParry();
              s.hitstopTimer = Math.max(s.hitstopTimer, 0.045);
              addStyleBonus('+ПРЕРЫВАНИЕ АТАКИ!', 85, '#facc15');
              spawnShockwaveRing(t.x, t.y, 48, '#facc15', 0.25);
            } else {
              sound.playHit(proj.isHeavy, dmgRes.blockedByShield);
            }

            if (isPointBlank && !dmgRes.blockedByShield) {
              addStyleBonus('+В УПОР!', 55, '#fb7185');
            }

            const kbScale = dmgRes.blockedByShield ? 0.25 : isPointBlank ? 1.45 : 1.0;
            t.x += Math.cos(proj.angle) * (proj.knockback * 0.08 * kbScale);
            t.y += Math.sin(proj.angle) * (proj.knockback * 0.08 * kbScale);

            spawnParticleBurst(
              t.x,
              t.y,
              dmgRes.blockedByShield ? '#fef08a' : proj.color,
              proj.isHeavy ? 11 : 6,
              proj.isHeavy ? 1.05 : 0.75,
              'spark'
            );
            spawnPopup(
              t.x,
              t.y - t.radius - 6,
              dmgRes.blockedByShield
                ? `ЩИТ -${dmgRes.damage}`
                : dmgRes.isCriticalInterrupt
                ? `КРИТ -${dmgRes.damage}!`
                : `-${dmgRes.damage}`,
              dmgRes.blockedByShield
                ? '#fde047'
                : dmgRes.isCriticalInterrupt
                ? '#facc15'
                : '#fef3c7',
              dmgRes.isCriticalInterrupt ? 1.2 : 1.0
            );

            // Tesla Cannon chains lightning arc to nearby teachers (4 targets with tesla_overcharge mod)!
            if (proj.weaponKind === 'tesla') {
              const hasOvercharge = p.weaponMods.includes('tesla_overcharge');
              const maxChain = hasOvercharge ? 4 : 2;
              const chainMult = hasOvercharge ? 0.8 : 0.6;
              let chained = 0;
              for (const other of s.teachers) {
                if (other.id !== t.id && other.state !== 'ko') {
                  if (Math.hypot(other.x - t.x, other.y - t.y) <= (hasOvercharge ? 260 : 220)) {
                    const chainDmg = Math.round(dmgRes.damage * chainMult);
                    other.hp -= chainDmg;
                    s.totalDamageDealt += chainDmg;
                    other.hitFlashTimer = 0.08;
                    spawnLightningArc(t.x, t.y, other.x, other.y, '#e879f9');
                    if (other.hp <= 0) {
                      const chainAng = Math.atan2(other.y - t.y, other.x - t.x);
                      other.state = 'ko';
                      other.koTimer = 0.35;
                      other.hasAttackToken = false;
                      other.vx = Math.cos(chainAng) * 210;
                      other.vy = Math.sin(chainAng) * 210;
                      s.telegraphs = s.telegraphs.filter((z) => z.ownerId !== other.id);
                      const otherSpec = TEACHER_SPECS[other.archetype];
                      s.teachersDefeated += 1;
                      if (isBossArchetype(other.archetype)) s.bossesDefeated += 1;
                      s.waveKills += 1;
                      s.combo = Math.min(10, s.combo + 1);
                      s.bestCombo = Math.max(s.bestCombo, s.combo);
                      s.comboTimer = 4.5;
                      const styleMult = getStyleRankForPoints(s.stylePoints).multiplier;
                      s.score += Math.round(otherSpec.scoreValue * styleMult);
                      p.scrap += otherSpec.scrapDrop;
                      spawnDecal(other.x, other.y, 18, 'slime', otherSpec.color);
                    }
                    chained++;
                    if (chained >= maxChain) break;
                  }
                }
              }
              if (chained > 0) {
                addStyleBonus('+ЦЕПНОЙ РАЗРЯД', 50 * chained, '#c084fc');
              }
            }

            if (proj.aoeRadius > 0) {
              s.hazards.push({
                id: s.nextEntityId++,
                x: t.x,
                y: t.y,
                radius: proj.aoeRadius,
                ttl: 4.2,
                maxTtl: 4.2,
                dps: proj.weaponKind === 'shotgun' ? 24 : 30,
                fromPlayer: true,
              });
              spawnShockwaveRing(t.x, t.y, proj.aoeRadius, '#4ade80', 0.28);
            }

            if (t.hp <= 0) {
              t.state = 'ko';
              t.koTimer = 0.35;
              t.hasAttackToken = false;
              t.vx = Math.cos(proj.angle) * 235;
              t.vy = Math.sin(proj.angle) * 235;
              s.telegraphs = s.telegraphs.filter((z) => z.ownerId !== t.id);

              const spec = TEACHER_SPECS[t.archetype];
              s.teachersDefeated += 1;
              if (isBossArchetype(t.archetype)) s.bossesDefeated += 1;
              s.waveKills += 1;
              s.combo = Math.min(10, s.combo + 1);
              s.bestCombo = Math.max(s.bestCombo, s.combo);
              s.comboTimer = 4.5;

              if (isQuickSwap) {
                addStyleBonus('+БЫСТРАЯ СМЕНА', 70, '#38bdf8');
                p.weaponSwitchTimer = 0;
              }
              if (p.dashTimer > 0) {
                addStyleBonus('+УБИЙСТВО В РЫВКЕ', 80, '#fef08a');
              } else {
                addStyleBonus(`+УБИТ: ${spec.subject.toUpperCase()}`, 45, spec.accentColor);
              }

              // ULTRAKILL Blood-Fuel Close-Range Heal (<180px)!
              if (distToPlayer <= 180) {
                const healAmt = 6 + p.vampirismBonus;
                p.hp = Math.min(p.maxHp, p.hp + healAmt);
                spawnPopup(p.x, p.y - 28, `+${healAmt} ОЗ КРОВЬ-ТОПЛИВО!`, '#4ade80', 1.15);
              }

              const styleMult = getStyleRankForPoints(s.stylePoints).multiplier;
              const pts = Math.round(spec.scoreValue * styleMult);
              s.score += pts;
              p.scrap += spec.scrapDrop;
              p.rage = Math.min(p.maxRage, p.rage + 15);

              sound.playTeacherDeath();
              s.hitstopTimer = Math.max(s.hitstopTimer, 0.048);
              s.trauma = Math.min(0.72, s.trauma + 0.24);
              spawnShockwaveRing(t.x, t.y, 58, spec.color, 0.28);
              spawnParticleBurst(t.x, t.y, spec.color, 20, 1.3, 'circle');
              spawnParticleBurst(t.x, t.y, '#ffffff', 8, 1.1, 'paper');
              spawnDecal(t.x, t.y, 22, 'slime', spec.color);
              spawnPopup(t.x, t.y - 20, `+${pts}`, '#4ade80', 1.15);

              if (Math.random() < 0.38 || isBossArchetype(t.archetype)) {
                const bonusPool: BonusType[] = [
                  'medkit',
                  'shield',
                  'overdrive',
                  'freeze',
                  'ammo',
                  'speed',
                ];
                const bType = bonusPool[Math.floor(Math.random() * bonusPool.length)];
                s.bonuses.push({
                  id: s.nextEntityId++,
                  type: bType,
                  x: t.x,
                  y: t.y,
                  ttl: 18,
                  maxTtl: 18,
                });
              }
            }

            proj.pierce -= 1;
            if (proj.pierce <= 0) {
              proj.active = false;
              break;
            }
          }
        }
      }

      // Update Acid Hazards on Floor
      for (let i = s.hazards.length - 1; i >= 0; i--) {
        const hz = s.hazards[i];
        hz.ttl -= simDt;
        if (hz.ttl <= 0) {
          s.hazards.splice(i, 1);
          continue;
        }
        if (hz.fromPlayer) {
          for (const t of s.teachers) {
            if (t.state === 'ko') continue;
            if (Math.hypot(t.x - hz.x, t.y - hz.y) <= hz.radius + t.radius) {
              t.hp -= hz.dps * simDt;
              if (t.hp <= 0) {
                t.state = 'ko';
                t.koTimer = 0.35;
                t.hasAttackToken = false;
                s.telegraphs = s.telegraphs.filter((z) => z.ownerId !== t.id);
                s.teachersDefeated += 1;
                if (isBossArchetype(t.archetype)) s.bossesDefeated += 1;
                s.waveKills += 1;
                s.combo = Math.min(10, s.combo + 1);
                s.bestCombo = Math.max(s.bestCombo, s.combo);
                s.comboTimer = 4.5;
                const spec = TEACHER_SPECS[t.archetype];
                const styleMult = getStyleRankForPoints(s.stylePoints).multiplier;
                s.score += Math.round(spec.scoreValue * styleMult);
                p.scrap += spec.scrapDrop;
                p.rage = Math.min(p.maxRage, p.rage + 12);
                addStyleBonus('+РАСТВОРЁН В КИСЛОТЕ', 55, '#4ade80');
                spawnParticleBurst(t.x, t.y, '#4ade80', 14, 1.0, 'circle');
                spawnDecal(t.x, t.y, 18, 'slime', spec.color);
              }
            }
          }
        } else {
          if (Math.hypot(p.x - hz.x, p.y - hz.y) <= hz.radius + p.radius && p.invulnTimer <= 0) {
            const res = applyDamageToPlayer(p, 8);
            p.hp = res.hp;
            p.shield = res.shield;
            p.invulnTimer = 0.45;
            p.hitFlashTimer = 0.1;
            s.waveDamageTaken += res.actualDamageTaken;
            s.stylePoints = Math.max(0, s.stylePoints - 45);
            sound.playPlayerHurt();
            spawnPopup(p.x, p.y - 20, '-8 КИСЛОТА', '#bef264');
          }
        }
      }

      // Update & Collect Bonus Pickups
      for (let i = s.bonuses.length - 1; i >= 0; i--) {
        const b = s.bonuses[i];
        b.ttl -= simDt;
        if (b.ttl <= 0) {
          s.bonuses.splice(i, 1);
          continue;
        }
        if (Math.hypot(p.x - b.x, p.y - b.y) <= p.radius + 20) {
          const applied = applyBonusToPlayer(p, b.type);
          s.player = applied.updated;
          if (b.type === 'freeze') {
            s.globalFreezeTimer = 6.0;
          }
          sound.playPickup();
          addStyleBonus(`+БОНУС: ${applied.label}`, 30, '#fef08a');
          spawnShockwaveRing(b.x, b.y, 50, '#fef08a', 0.25);
          spawnParticleBurst(b.x, b.y, '#fef08a', 12, 0.9, 'spark');
          spawnPopup(b.x, b.y - 18, applied.label, '#fef08a', 1.15);
          s.bonuses.splice(i, 1);
        }
      }

      // Update Pooled Particles & Popups in-place
      for (const pt of s.particles) {
        if (!pt.active) continue;
        pt.life -= simDt;
        if (pt.life <= 0) {
          pt.active = false;
          continue;
        }
        pt.x += pt.vx * simDt;
        pt.y += pt.vy * simDt;
        pt.angle += pt.vRot * simDt;
        pt.vx *= 0.92;
        pt.vy *= 0.92;
      }

      for (const pop of s.popups) {
        if (!pop.active) continue;
        pop.life -= simDt;
        if (pop.life <= 0) {
          pop.active = false;
          continue;
        }
        pop.y += pop.vy * simDt;
      }

      // Render Scene
      renderSchoolArena(ctx, viewW, viewH, {
        player: s.player,
        teachers: s.teachers,
        projectiles: s.projectiles,
        barricades: s.barricades,
        explosives: s.explosives,
        bonuses: s.bonuses,
        hazards: s.hazards,
        telegraphs: s.telegraphs,
        particles: s.particles,
        decals: s.decals,
        popups: s.popups,
        afterimages: s.afterimages,
        cameraX: s.cameraX,
        cameraY: s.cameraY,
        shakeOffsetX,
        shakeOffsetY,
        mouseWorldX: s.mouseWorldX,
        mouseWorldY: s.mouseWorldY,
        globalFreezeTimer: s.globalFreezeTimer,
        isTitleMode: false,
        elapsedTime: s.elapsedTime,
        mapId: s.mapId,
        secretStash: s.secretStash,
        activeEvent: s.activeEvent,
        evacZone: s.evacZone,
        graphicsQuality: saveRef.current.settings.graphicsQuality,
      });

      // Throttle HUD React state sync to ~10Hz
      s.hudSyncAccum += simDt;
      if (s.hudSyncAccum >= 0.1) {
        s.hudSyncAccum = 0;
        const liveEnemies =
          s.waveToSpawn + s.teachers.filter((t) => t.state !== 'ko').length;
        const activeBoss = s.teachers.find(
          (t) => isBossArchetype(t.archetype) && t.state !== 'ko'
        );
        setHud({
          hp: s.player.hp,
          maxHp: s.player.maxHp,
          ghostHp: s.player.ghostHp,
          shield: s.player.shield,
          maxShield: s.player.maxShield,
          rage: s.player.rage,
          maxRage: s.player.maxRage,
          scrap: s.player.scrap,
          score: s.score,
          combo: s.combo,
          stylePoints: s.stylePoints,
          styleFeed: [...s.styleFeed],
          wave: s.wave,
          enemiesRemaining: liveEnemies,
          activeWeapon: s.player.activeWeapon,
          ammo: { ...s.player.ammo },
          overdriveTimer: s.player.overdriveTimer,
          speedBoostTimer: s.player.speedBoostTimer,
          freezeTimer: s.globalFreezeTimer,
          sandevistanTimer: s.player.sandevistanTimer,
          frozenBulletsCount:
            s.player.sandevistanTimer > 0
              ? s.projectiles.filter((pr) => pr.active && pr.fromPlayer).length
              : 0,
          ultimateId: s.player.ultimateId,
          waveBannerText: s.waveBannerText,
          statusToast: s.statusToast,
          autoAim: s.autoAim,
          bossHp: activeBoss ? activeBoss.hp : 0,
          bossMaxHp: activeBoss ? activeBoss.maxHp : 780,
          bossPhase: activeBoss?.bossPhase ?? 1,
          bossName: activeBoss ? TEACHER_SPECS[activeBoss.archetype].name : 'Директор школы',
          mapId: s.mapId,
          activeEvent: s.activeEvent,
          activeEventTimer: s.activeEventTimer,
        });
      }
    };

    rafId = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(rafId);
      ro.disconnect();
      window.removeEventListener('resize', updateCanvasSize);
      window.removeEventListener('scroll', updateCanvasSize);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('pointercancel', onMouseUp as EventListener);
      window.removeEventListener('mouseup', onMouseUp);
      window.removeEventListener('wheel', onWheel);
    };
  }, [
    addStyleBonus,
    rollBetweenWaveUpgrades,
    saveBestScore,
    selectWeapon,
    spawnDecal,
    spawnKatanaSlash,
    spawnLightningArc,
    spawnParticleBurst,
    spawnPopup,
    spawnShockwaveRing,
    spawnTeacherForWave,
    syncBodyPhase,
    triggerUltimate,
    updateSave,
  ]);

  return (
    <main
      onDragStart={(e) => e.preventDefault()}
      onContextMenu={(e) => e.preventDefault()}
      className="relative w-screen h-screen overflow-hidden bg-[#0b120f] select-none"
    >
      {/* Isolated Canvas Mount */}
      <canvas
        ref={canvasRef}
        tabIndex={0}
        data-testid="game-canvas"
        aria-label="Игровое поле: Школа №13"
        onDragStart={(e) => e.preventDefault()}
        onContextMenu={(e) => e.preventDefault()}
        style={{ touchAction: 'none' }}
        className="block w-full h-full outline-none cursor-crosshair"
      />

      {/* Title Screen Overlay */}
      {phase === 'title' && (
        <TitleScreen
          onStart={resetAndStartGame}
          bestScore={bestScore}
          medals={saveProfile.medals}
          unlockedAchievementsCount={saveProfile.unlockedAchievements.length}
          muted={muted}
          onToggleMute={toggleMute}
          selectedUltimate={selectedUltimate}
          onSelectUltimate={handleSelectUltimate}
          selectedMap={selectedMap}
          onSelectMap={handleSelectMap}
          onOpenModal={(tab) => setOverlayModal(tab)}
        />
      )}

      {/* World-Matched Low-Occlusion Gameplay HUD */}
      {phase === 'playing' && (
        <GameHud
          hud={hud}
          muted={muted}
          showTouchControls={saveProfile.settings.showTouchControls}
          onSelectWeapon={selectWeapon}
          onPlaceGadget={placeDefensiveGadget}
          onTriggerUltimate={triggerUltimate}
          onCycleUltimate={cycleUltimate}
          onToggleMute={toggleMute}
          onToggleAutoAim={toggleAutoAim}
          onTogglePause={togglePause}
          onRestart={resetAndStartGame}
          onTouchMove={(dx, dy) => {
            simRef.current.touchMoveX = dx;
            simRef.current.touchMoveY = dy;
          }}
          onTouchFire={(firing) => {
            simRef.current.mouseDown = firing;
          }}
          onTouchDash={() => {
            simRef.current.dashBufferTimer = 0.14;
          }}
        />
      )}

      {/* Single Focused Status Modal for Wave Clear / Pause / Victory / Game Over */}
      <StatusModal
        phase={phase}
        summary={summary}
        waveReport={waveReport}
        availableUpgrades={availableUpgrades}
        onSelectUpgrade={handleSelectUpgrade}
        onResume={togglePause}
        onRestart={resetAndStartGame}
        onReturnTitle={() => syncBodyPhase('title')}
        onOpenSettings={() => setOverlayModal('settings')}
      />

      {/* Meta-Progression, Skins, Achievements, Settings & Interactive Tutorial Modal */}
      <MetaAndSettingsModal
        activeTab={overlayModal}
        saveProfile={saveProfile}
        onClose={() => setOverlayModal(null)}
        onBuyMetaUpgrade={handleBuyMetaUpgrade}
        onUnlockOrEquipSkin={handleUnlockOrEquipSkin}
        onUpdateSettings={handleUpdateSettings}
        onResetSave={handleResetSave}
        onCompleteTutorial={handleCompleteTutorial}
      />
    </main>
  );
}
