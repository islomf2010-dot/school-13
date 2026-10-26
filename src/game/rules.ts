export type GamePhase = 'title' | 'playing' | 'wave_clear' | 'paused' | 'gameover';

export type WeaponId = 'slingshot' | 'shotgun' | 'nailgun' | 'acid' | 'tesla';

export type UltimateId = 'sandevistan' | 'shadow_ninja' | 'sonic_bell';

export interface UltimateSpec {
  id: UltimateId;
  shortName: string;
  title: string;
  subtitle: string;
  cutsceneTitle: string;
  cutsceneSubtitle: string;
  accent: string;
  secondaryAccent: string;
}

export const ULTIMATE_SPECS: Record<UltimateId, UltimateSpec> = {
  sandevistan: {
    id: 'sandevistan',
    shortName: 'Сандевистан',
    title: 'САНДЕВИСТАН: ХРОНО-ИМПЛАНТ',
    subtitle: 'Остановка времени и пуль + След Киберпанк · После ульты все пули разом летят во врагов!',
    cutsceneTitle: 'САНДЕВИСТАН: АКТИВАЦИЯ!',
    cutsceneSubtitle: 'ВРЕМЯ И ПУЛИ ОСТАНОВЛЕНЫ · ГОТОВЬ ХРОНО-ЗАЛП',
    accent: '#00ff9d',
    secondaryAccent: '#00f0ff',
  },
  shadow_ninja: {
    id: 'shadow_ninja',
    shortName: 'Клинок Шиноби',
    title: 'КЛИНОК ШИНОБИ: ТЕНЕВАЯ КАЗНЬ',
    subtitle: 'Мгновенный телепорт за спину ко всем врагам и Боссу в радиусе + Смертельный разрез',
    cutsceneTitle: 'ДЫХАНИЕ ТЕНИ: КРОВАВЫЙ ЗАЧЁТ!',
    cutsceneSubtitle: 'ТЕЛЕПОРТАЦИЯ ЗА СПИНУ · КАЗНЬ ПЕДСОВЕТА',
    accent: '#f43f5e',
    secondaryAccent: '#38bdf8',
  },
  sonic_bell: {
    id: 'sonic_bell',
    shortName: 'Большой Звонок',
    title: 'БОЛЬШОЙ ЗВОНОК: МЕГА-РЕЗОНАНС',
    subtitle: 'Сокрушительная акустическая волна по всей арене, стирающая вражеские снаряды',
    cutsceneTitle: 'БОЛЬШОЙ ЗВОНОК: ПЕРЕМЕНА В АДУ!',
    cutsceneSubtitle: 'АКУСТИЧЕСКИЙ УДАР 200 ДЕЦИБЕЛ · ОГЛУШЕНИЕ',
    accent: '#facc15',
    secondaryAccent: '#e879f9',
  },
};

export type StyleRankId = 'D' | 'C' | 'B' | 'A' | 'S' | 'SS' | 'SSS' | 'ULTRAKILL';

export interface StyleRankSpec {
  id: StyleRankId;
  title: string;
  subtitle: string;
  minPoints: number;
  multiplier: number;
  color: string;
  bgColor: string;
}

export interface StyleFeedItem {
  id: number;
  text: string;
  points: number;
  color: string;
  ttl: number;
}

export interface WaveReport {
  wave: number;
  clearTimeSec: number;
  kills: number;
  shotsFired: number;
  shotsHit: number;
  accuracy: number;
  damageTaken: number;
  maxStyleRank: StyleRankId;
  finalGrade: StyleRankId;
}

export type WeaponModId =
  | 'slingshot_ricochet'
  | 'shotgun_incendiary'
  | 'nailgun_hyper'
  | 'acid_volatile'
  | 'tesla_overcharge';

export type UpgradeId =
  | 'vampirism'
  | 'rapid_reload'
  | 'scrap_engineer'
  | 'mod_slingshot_ricochet'
  | 'mod_shotgun_incendiary'
  | 'mod_nailgun_hyper'
  | 'mod_acid_volatile'
  | 'mod_tesla_overcharge'
  | WeaponModId;

export interface UpgradeSpec {
  id: UpgradeId;
  key: string;
  title: string;
  description: string;
  accent: string;
  category?: 'perk' | 'weapon_mod';
  weaponId?: WeaponId;
  weaponMod?: WeaponModId;
}

export const UPGRADE_SPECS: UpgradeSpec[] = [
  {
    id: 'vampirism',
    key: '1',
    title: 'АДРЕНАЛИН ОТЛИЧНИКА',
    description: '+25 ОЗ сразу · Убийства вблизи лечат +9 ОЗ и дают +20% к скорости рывка',
    accent: '#fb7185',
    category: 'perk',
  },
  {
    id: 'rapid_reload',
    key: '2',
    title: 'КАТАЛИЗАТОР ОРУЖИЯ',
    description: 'Полный боезапас ко всему оружию · +18% скорострельности и урона при смене пушек',
    accent: '#38bdf8',
    category: 'perk',
  },
  {
    id: 'scrap_engineer',
    key: '3',
    title: 'ИНЖЕНЕР ОБОРОНЫ',
    description: '+45 Деталей и +40 Щита · Полный заряд Супер-Способности [C]',
    accent: '#facc15',
    category: 'perk',
  },
  {
    id: 'mod_slingshot_ricochet',
    key: '4',
    title: 'МОД РОГАТКИ: АЛМАЗНЫЕ ГАЙКИ',
    description: 'Рогатка [1]: рикошет от стен, пробивает +2 цели насквозь и +35% к урону',
    accent: '#f59e0b',
    category: 'weapon_mod',
    weaponId: 'slingshot',
    weaponMod: 'slingshot_ricochet',
  },
  {
    id: 'mod_shotgun_incendiary',
    key: '5',
    title: 'МОД ДРОБОВИКА: ДЫХАНИЕ ДРАКОНА',
    description: 'Тубус-Дробовик [2]: +2 пиро-дробинки, поджигает пол при попадании и +25% урона',
    accent: '#fb7185',
    category: 'weapon_mod',
    weaponId: 'shotgun',
    weaponMod: 'shotgun_incendiary',
  },
  {
    id: 'mod_nailgun_hyper',
    key: '6',
    title: 'МОД ЦИРКУЛЕМЁТА: ДВОЙНОЙ ПРИВОД',
    description: 'Циркулемёт [3]: стреляет 2 иглами за выстрел, +22% скорострельности и +45 игл',
    accent: '#38bdf8',
    category: 'weapon_mod',
    weaponId: 'nailgun',
    weaponMod: 'nailgun_hyper',
  },
  {
    id: 'mod_acid_volatile',
    key: '7',
    title: 'МОД ХИМИИ: НИТРО-РЕАКТИВ',
    description: 'Хим-Опрыскиватель [4]: +35% радиус кислотных луж, +35% урона и +10 колб',
    accent: '#4ade80',
    category: 'weapon_mod',
    weaponId: 'acid',
    weaponMod: 'acid_volatile',
  },
  {
    id: 'mod_tesla_overcharge',
    key: '8',
    title: 'МОД ТЕСЛЫ: СВЕРХПРОВОДНИК',
    description: 'Катушка Физика [5]: цепная молния бьёт до 4 целей (80% урона) и +8 зарядов',
    accent: '#c084fc',
    category: 'weapon_mod',
    weaponId: 'tesla',
    weaponMod: 'tesla_overcharge',
  },
];

export const STYLE_RANKS: StyleRankSpec[] = [
  {
    id: 'D',
    title: 'D — ДВОЕЧНИК',
    subtitle: 'Disgraceful',
    minPoints: 0,
    multiplier: 1.0,
    color: '#94a3b8',
    bgColor: '#1e293b',
  },
  {
    id: 'C',
    title: 'C — ТРОЕЧНИК',
    subtitle: 'Crude',
    minPoints: 110,
    multiplier: 1.25,
    color: '#4ade80',
    bgColor: '#14532d',
  },
  {
    id: 'B',
    title: 'B — БУНТАРЬ',
    subtitle: 'Brutal',
    minPoints: 240,
    multiplier: 1.5,
    color: '#38bdf8',
    bgColor: '#0c4a6e',
  },
  {
    id: 'A',
    title: 'A — АНАРХИСТ',
    subtitle: 'Anarchic',
    minPoints: 400,
    multiplier: 2.0,
    color: '#facc15',
    bgColor: '#713f12',
  },
  {
    id: 'S',
    title: 'S — ОТЛИЧНИК',
    subtitle: 'Supreme',
    minPoints: 570,
    multiplier: 2.5,
    color: '#fb923c',
    bgColor: '#7c2d12',
  },
  {
    id: 'SS',
    title: 'SS — САДИСТ',
    subtitle: 'Savage',
    minPoints: 730,
    multiplier: 3.0,
    color: '#f43f5e',
    bgColor: '#881337',
  },
  {
    id: 'SSS',
    title: 'SSS — СТАРОСТА АДА',
    subtitle: 'Stylish',
    minPoints: 880,
    multiplier: 4.0,
    color: '#e879f9',
    bgColor: '#581c87',
  },
  {
    id: 'ULTRAKILL',
    title: 'УЛЬТРА-УРОК!',
    subtitle: 'ULTRAKILL',
    minPoints: 980,
    multiplier: 5.0,
    color: '#fef08a',
    bgColor: '#991b1b',
  },
];

export function getStyleRankForPoints(points: number): StyleRankSpec {
  const clamped = Math.max(0, Math.min(1200, points));
  for (let i = STYLE_RANKS.length - 1; i >= 0; i--) {
    if (clamped >= STYLE_RANKS[i].minPoints) {
      return STYLE_RANKS[i];
    }
  }
  return STYLE_RANKS[0];
}

export function getStyleProgressToNextRank(points: number): number {
  const clamped = Math.max(0, points);
  for (let i = 0; i < STYLE_RANKS.length - 1; i++) {
    const curr = STYLE_RANKS[i];
    const next = STYLE_RANKS[i + 1];
    if (clamped < next.minPoints) {
      return (clamped - curr.minPoints) / Math.max(1, next.minPoints - curr.minPoints);
    }
  }
  return 1;
}

export function computeWaveGrade(report: Omit<WaveReport, 'finalGrade'>): StyleRankId {
  let score = 0;
  if (report.accuracy >= 45) score += 2;
  else if (report.accuracy >= 25) score += 1;

  if (report.damageTaken === 0) score += 3;
  else if (report.damageTaken <= 25) score += 2;
  else if (report.damageTaken <= 55) score += 1;

  if (report.clearTimeSec <= 35) score += 2;
  else if (report.clearTimeSec <= 60) score += 1;

  const rankIndex = STYLE_RANKS.findIndex((r) => r.id === report.maxStyleRank);
  score += Math.floor(Math.max(0, rankIndex) / 2);

  if (score >= 8) return 'ULTRAKILL';
  if (score >= 7) return 'SSS';
  if (score >= 6) return 'SS';
  if (score >= 5) return 'S';
  if (score >= 4) return 'A';
  if (score >= 3) return 'B';
  if (score >= 2) return 'C';
  return 'D';
}

export interface WeaponSpec {
  id: WeaponId;
  key: string;
  name: string;
  role: string;
  damage: number;
  cooldown: number; // seconds between shots
  projectiles: number;
  spread: number; // radians
  speed: number; // px/s
  range: number; // px
  pierce: number;
  aoeRadius: number;
  maxAmmo: number; // -1 for infinite
  color: string;
  knockback: number;
  isHeavy: boolean;
}

export type TeacherArchetypeId =
  | 'literature_chaser' // Учитель Литературы (Chaser/Swarmer)
  | 'math_sniper' // Математичка с циркулем (Kiter/Ranged)
  | 'pe_charger' // Физрук-Таран (LOS Charger with whistle telegraph)
  | 'chem_lobber' // Химик-Токсик (Area-Denial Acid Lobber with floor target ring)
  | 'history_shield' // Историк с картой-щитом (Shielded Front)
  | 'vice_principal_boss' // Завуч Маргарита (Босс: призыв + зоны дисциплинарного ареста)
  | 'pe_boss' // Старший Физрук Титан (Босс: рывки + сейсмический прыжок с гирями)
  | 'lab_experiment_boss' // Лабораторный Мутант «Объект-13» (Босс: залпы кислоты + био-споры)
  | 'principal_boss'; // Директор со школьным мегафоном (3-Phase Final Boss)

export type MovementPolicy = 'chaser' | 'kiter' | 'charger' | 'lobber' | 'shielded' | 'boss_slam';

export interface TeacherSpec {
  id: TeacherArchetypeId;
  name: string;
  title: string;
  subject: string;
  policy: MovementPolicy;
  maxHp: number;
  speed: number;
  radius: number;
  damage: number;
  scoreValue: number;
  scrapDrop: number;
  color: string;
  accentColor: string;
  telegraphDuration: number; // seconds of visible windup before attack (>10% HP)
  attackRange: number;
  attackCooldown: number;
  frontShieldReduction?: number; // 0..1 multiplier applied to frontal hits
  isBoss?: boolean;
}

export function isBossArchetype(archetype: TeacherArchetypeId): boolean {
  return (
    archetype === 'principal_boss' ||
    archetype === 'vice_principal_boss' ||
    archetype === 'pe_boss' ||
    archetype === 'lab_experiment_boss'
  );
}

export type BonusType =
  | 'medkit' // Аптечка медпункта (+35 HP)
  | 'shield' // Учебник-Броня (+50 Shield)
  | 'overdrive' // Дневник Отличника (x2 урон на 10 сек)
  | 'freeze' // Школьный Звонок (Заморозка учителей на 6 сек)
  | 'ammo' // Ящик канцелярии (+патроны ко всему оружию и +25 деталей)
  | 'speed'; // Энергетик из буфета (+35% скорость и рывок)

export interface BonusDrop {
  id: number;
  type: BonusType;
  x: number;
  y: number;
  ttl: number;
  maxTtl: number;
}

export interface ObstacleRect {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  kind: 'locker' | 'desk_cluster' | 'lab_table' | 'chalk_pillar' | 'teacher_desk';
  label?: string;
}

export interface ExplosiveProp {
  id: number;
  kind: 'extinguisher' | 'chem_barrel' | 'supply_crate';
  x: number;
  y: number;
  radius: number;
  hp: number;
  maxHp: number;
  blastRadius: number;
  blastDamage: number;
  hitFlashTimer: number;
  destroyed?: boolean;
}

export interface BarricadeEntity {
  id: number;
  kind: 'barricade' | 'turret';
  x: number;
  y: number;
  radius: number;
  hp: number;
  maxHp: number;
  fireTimer: number;
  angle: number;
}

export interface AcidHazard {
  id: number;
  x: number;
  y: number;
  radius: number;
  ttl: number;
  maxTtl: number;
  dps: number;
  fromPlayer: boolean;
}

export interface TelegraphZone {
  id: number;
  kind: 'circle' | 'line';
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  radius: number;
  elapsed: number;
  duration: number;
  damage: number;
  ownerId: number;
}

export interface ZombieTeacher {
  id: number;
  archetype: TeacherArchetypeId;
  x: number;
  y: number;
  vx: number;
  vy: number;
  angle: number;
  hp: number;
  maxHp: number;
  speed: number;
  radius: number;
  state: 'seeking' | 'windup' | 'active_attack' | 'recovery' | 'staggered' | 'ko';
  stateTimer: number;
  attackCooldownTimer: number;
  hitFlashTimer: number;
  frozenTimer: number;
  chargeDirX: number;
  chargeDirY: number;
  koTimer: number;
  walkPhase: number;
  hasAttackToken: boolean;
  bossPhase?: 1 | 2 | 3;
  quote?: string;
  quoteTimer?: number;
}

export interface PlayerState {
  x: number;
  y: number;
  vx: number;
  vy: number;
  angle: number;
  hp: number;
  maxHp: number;
  ghostHp: number;
  shield: number;
  maxShield: number;
  rage: number; // 0..100 заряд супер-удара «Большой Звонок» [C / ПКМ]
  maxRage: number;
  speed: number;
  radius: number;
  activeWeapon: WeaponId;
  lastWeapon: WeaponId;
  weaponSwitchTimer: number; // >0 means next kill triggers +БЫСТРАЯ СМЕНА!
  ammo: Record<WeaponId, number>;
  scrap: number; // Детали для постройки парты-баррикады [E] или глобус-турели [Q]
  overdriveTimer: number;
  speedBoostTimer: number;
  invulnTimer: number;
  dashCooldown: number;
  dashTimer: number;
  fireCooldown: number;
  recoilOffset: number;
  muzzleFlashTimer: number;
  shockwaveVisualTimer: number;
  scaleX: number;
  scaleY: number;
  walkDistance: number;
  hitFlashTimer: number;
  knockbackTimer?: number;
  vampirismBonus: number;
  fireRateMultiplier: number;
  ultimateId: UltimateId;
  sandevistanTimer: number;
  ninjaSlashTimer: number;
  weaponMods: WeaponModId[];
  skinId?: string;
}

export type SchoolMapId =
  | 'corridor'
  | 'classroom'
  | 'gymnasium'
  | 'lab'
  | 'library'
  | 'basement';

export type SchoolEventId =
  | 'power_outage'
  | 'emergency_lockdown'
  | 'supply_drop'
  | 'toxic_spill'
  | 'evacuation_drill';

export interface SchoolEventSpec {
  id: SchoolEventId;
  title: string;
  subtitle: string;
  duration: number;
  accent: string;
  color: string;
}

export const SCHOOL_EVENTS: Record<SchoolEventId, SchoolEventSpec> = {
  power_outage: {
    id: 'power_outage',
    title: 'АВАРИЯ ЭЛЕКТРОСЕТИ',
    subtitle: 'Свет в школе погас! Полагайтесь на фонарик · Очки стиля +25%',
    duration: 14,
    accent: '#38bdf8',
    color: '#38bdf8',
  },
  emergency_lockdown: {
    id: 'emergency_lockdown',
    title: 'КАРАНТИННАЯ ТРЕВОГА',
    subtitle: 'Включены сирены и подкрепления педсовета!',
    duration: 14,
    accent: '#f43f5e',
    color: '#f43f5e',
  },
  supply_drop: {
    id: 'supply_drop',
    title: 'ЗАНАЧКА ЗАВХОЗА',
    subtitle: 'В центре зала сброшен спец-контейнер с боеприпасами и аптечкой!',
    duration: 10,
    accent: '#facc15',
    color: '#facc15',
  },
  toxic_spill: {
    id: 'toxic_spill',
    title: 'ВЫБРОС ХИМ-РЕАКТИВОВ',
    subtitle: 'По полу разлились нестабильные лужи — взрывайте их Дробовиком или Теслой!',
    duration: 12,
    accent: '#4ade80',
    color: '#4ade80',
  },
  evacuation_drill: {
    id: 'evacuation_drill',
    title: 'ТОЧКА ЭВАКУАЦИИ',
    subtitle: 'Удерживайте синий круг эвакуации 5 сек. для награды (+65 Деталей и Щит)!',
    duration: 15,
    accent: '#fef08a',
    color: '#38bdf8',
  },
};

export interface SecretStashEntity {
  x: number;
  y: number;
  radius: number;
  hp: number;
  maxHp: number;
  discovered: boolean;
  title: string;
  loreNote: string;
  loreText: string;
  scrapReward: number;
  hitFlashTimer: number;
}

export interface RunSummary {
  victory: boolean;
  waveReached: number;
  maxWaves: number;
  score: number;
  bestScore: number;
  teachersDefeated: number;
  barricadesBuilt: number;
  clearTimeSec: number;
  bossHpRemaining: number;
  highestStyleRank?: StyleRankId;
  accuracy?: number;
  bossesDefeated?: number;
  damageDealt?: number;
  damageTaken?: number;
  bestCombo?: number;
  medalsEarned?: number;
  newlyUnlockedAchievements?: string[];
  mapId?: SchoolMapId;
}

export const ARENA_WIDTH = 1800;
export const ARENA_HEIGHT = 1200;
export const MAX_WAVES = 5;
export const MAX_CONCURRENT_ATTACK_TOKENS = 4;
export const BARRICADE_COST = 25;
export const TURRET_COST = 45;
export const ULTIMATE_RADIUS = 370;
export const ULTIMATE_DAMAGE = 105;

export const WEAPON_SPECS: Record<WeaponId, WeaponSpec> = {
  slingshot: {
    id: 'slingshot',
    key: '1',
    name: 'Рогатка с гайками',
    role: 'Точный рикошет · Париирует снаряды и сбивает каст',
    damage: 29,
    cooldown: 0.18,
    projectiles: 1,
    spread: 0.03,
    speed: 880,
    range: 740,
    pierce: 1,
    aoeRadius: 0,
    maxAmmo: -1,
    color: '#f59e0b',
    knockback: 165,
    isHeavy: false,
  },
  shotgun: {
    id: 'shotgun',
    key: '2',
    name: 'Тубус-Дробовик',
    role: 'Крит +40% в упор · Лечит кровью вблизи · Поджигает кислоту',
    damage: 22,
    cooldown: 0.48,
    projectiles: 7,
    spread: 0.42,
    speed: 750,
    range: 460,
    pierce: 1,
    aoeRadius: 0,
    maxAmmo: 42,
    color: '#fb7185',
    knockback: 310,
    isHeavy: true,
  },
  nailgun: {
    id: 'nailgun',
    key: '3',
    name: 'Циркулемёт',
    role: 'Шквальный поток · Прошивает дубовые щиты насквозь',
    damage: 20,
    cooldown: 0.088,
    projectiles: 1,
    spread: 0.095,
    speed: 960,
    range: 720,
    pierce: 2,
    aoeRadius: 0,
    maxAmmo: 150,
    color: '#38bdf8',
    knockback: 100,
    isHeavy: false,
  },
  acid: {
    id: 'acid',
    key: '4',
    name: 'Хим-Опрыскиватель',
    role: 'Токсичные колбы · Взрывается от выстрела Дробовика/Теслы!',
    damage: 48,
    cooldown: 0.62,
    projectiles: 1,
    spread: 0.035,
    speed: 600,
    range: 610,
    pierce: 1,
    aoeRadius: 110,
    maxAmmo: 30,
    color: '#4ade80',
    knockback: 195,
    isHeavy: true,
  },
  tesla: {
    id: 'tesla',
    key: '5',
    name: 'Катушка Физика',
    role: 'Цепной разряд · Бьёт 3 врагов и детонирует хим-лужи',
    damage: 68,
    cooldown: 0.54,
    projectiles: 1,
    spread: 0.012,
    speed: 1260,
    range: 700,
    pierce: 6,
    aoeRadius: 60,
    maxAmmo: 26,
    color: '#c084fc',
    knockback: 250,
    isHeavy: true,
  },
};

export const TEACHER_SPECS: Record<TeacherArchetypeId, TeacherSpec> = {
  literature_chaser: {
    id: 'literature_chaser',
    name: 'Литератор-Зомби',
    title: 'Литератор-Зомби',
    subject: 'Литература',
    policy: 'chaser',
    maxHp: 65,
    speed: 152,
    radius: 21,
    damage: 14,
    scoreValue: 100,
    scrapDrop: 8,
    color: '#65a30d',
    accentColor: '#fde047',
    telegraphDuration: 0.4,
    attackRange: 44,
    attackCooldown: 1.05,
  },
  math_sniper: {
    id: 'math_sniper',
    name: 'Алгебраистка',
    title: 'Алгебраистка',
    subject: 'Математика',
    policy: 'kiter',
    maxHp: 58,
    speed: 134,
    radius: 19,
    damage: 16,
    scoreValue: 150,
    scrapDrop: 10,
    color: '#0284c7',
    accentColor: '#e0f2fe',
    telegraphDuration: 0.54,
    attackRange: 440,
    attackCooldown: 2.0,
  },
  pe_charger: {
    id: 'pe_charger',
    name: 'Физрук-Таран',
    title: 'Физрук-Таран',
    subject: 'Физкультура',
    policy: 'charger',
    maxHp: 98,
    speed: 165,
    radius: 23,
    damage: 24,
    scoreValue: 180,
    scrapDrop: 13,
    color: '#dc2626',
    accentColor: '#fef08a',
    telegraphDuration: 0.56,
    attackRange: 350,
    attackCooldown: 2.4,
  },
  chem_lobber: {
    id: 'chem_lobber',
    name: 'Химик-Токсик',
    title: 'Химик-Токсик',
    subject: 'Химия',
    policy: 'lobber',
    maxHp: 82,
    speed: 118,
    radius: 21,
    damage: 20,
    scoreValue: 190,
    scrapDrop: 13,
    color: '#16a34a',
    accentColor: '#bbf7d0',
    telegraphDuration: 0.65,
    attackRange: 420,
    attackCooldown: 2.7,
  },
  history_shield: {
    id: 'history_shield',
    name: 'Историк со Щитом',
    title: 'Историк со Щитом',
    subject: 'История',
    policy: 'shielded',
    maxHp: 145,
    speed: 105,
    radius: 25,
    damage: 18,
    scoreValue: 220,
    scrapDrop: 16,
    color: '#b45309',
    accentColor: '#fed7aa',
    telegraphDuration: 0.48,
    attackRange: 50,
    attackCooldown: 1.45,
    frontShieldReduction: 0.25,
  },
  vice_principal_boss: {
    id: 'vice_principal_boss',
    name: 'Завуч Маргарита',
    title: 'Завуч Маргарита',
    subject: 'Дисциплина (Босс)',
    policy: 'boss_slam',
    maxHp: 460,
    speed: 126,
    radius: 31,
    damage: 22,
    scoreValue: 850,
    scrapDrop: 40,
    color: '#e11d48',
    accentColor: '#fda4af',
    telegraphDuration: 0.64,
    attackRange: 240,
    attackCooldown: 2.3,
    isBoss: true,
  },
  pe_boss: {
    id: 'pe_boss',
    name: 'Старший Физрук Титан',
    title: 'Старший Физрук Титан',
    subject: 'ГТО-Норматив (Босс)',
    policy: 'boss_slam',
    maxHp: 580,
    speed: 148,
    radius: 33,
    damage: 26,
    scoreValue: 1050,
    scrapDrop: 48,
    color: '#ea580c',
    accentColor: '#fed7aa',
    telegraphDuration: 0.6,
    attackRange: 210,
    attackCooldown: 2.0,
    isBoss: true,
  },
  lab_experiment_boss: {
    id: 'lab_experiment_boss',
    name: 'Мутант «Объект-13»',
    title: 'Мутант «Объект-13»',
    subject: 'Био-Карантин (Босс)',
    policy: 'boss_slam',
    maxHp: 660,
    speed: 122,
    radius: 34,
    damage: 25,
    scoreValue: 1250,
    scrapDrop: 55,
    color: '#15803d',
    accentColor: '#bef264',
    telegraphDuration: 0.65,
    attackRange: 260,
    attackCooldown: 2.2,
    isBoss: true,
  },
  principal_boss: {
    id: 'principal_boss',
    name: 'Директор Школы',
    title: 'Директор Школы',
    subject: 'Дирекция (Финал-Босс)',
    policy: 'boss_slam',
    maxHp: 780,
    speed: 128,
    radius: 35,
    damage: 28,
    scoreValue: 1500,
    scrapDrop: 60,
    color: '#7e22ce',
    accentColor: '#f5d0fe',
    telegraphDuration: 0.68,
    attackRange: 180,
    attackCooldown: 2.1,
    isBoss: true,
  },
};

export const TEACHER_BARKS: Record<TeacherArchetypeId, string[]> = {
  literature_chaser: [
    'А голову дома не забыл?!',
    'Тема сочинения: СТРАДАНИЕ!',
    'В гробу перевернулся Толстой!',
    'Кто не выучил стих наизусть?!',
    'Читай с выражением!',
    'Двойка в четверти!',
  ],
  math_sniper: [
    'Пифагоровы штаны!',
    'Лес рук! К доске пойдёшь!',
    'Минус на минус даёт ДВОЙКУ!',
    'Чему равен дискриминант?!',
    'Считай в уме, без калькулятора!',
    'Звонок звенит ДЛЯ УЧИТЕЛЯ!',
  ],
  pe_charger: [
    'Упал — отжался!',
    'Кто разрешил без сменки?!',
    'Два круга вокруг школы, марш!',
    'В темпе, в темпе!',
    'Форму дома забыл?!',
    'Не срезай углы на нормативе!',
  ],
  chem_lobber: [
    'Не суй нос в пробирку!',
    'Кто разбил мерную колбу?!',
    'H2O плюс сера — и нет примера!',
    'Реакция нейтрализации пошла!',
    'Технику безопасности не учили?!',
  ],
  history_shield: [
    'Кто взял Бастилию?!',
    'Историю Отечества надо знать!',
    'Иван Грозный покарает!',
    'В каком году крестили Русь?!',
    'За такой ответ — кол в журнал!',
  ],
  vice_principal_boss: [
    'Завуч в классе! Всем встать!',
    'Записываю в Чёрный Журнал!',
    'Вызываю дежурных учителей!',
    'После уроков останешься навечно!',
    'Дисциплина превыше выживания!',
  ],
  pe_boss: [
    'Сдача ГТО на выживание!',
    'Лови пудовую гирю, салага!',
    'Сто отжиманий на битом стекле!',
    'От моего свистка стены дрожат!',
    'Спортзал — моя арена!',
  ],
  lab_experiment_boss: [
    'ОБЪЕКТ-13 ВЫРВАЛСЯ ИЗ КОЛБЫ!',
    'КИСЛОТНЫЙ СИНТЕЗ ЗАВЕРШЁН!',
    'БИО-КАРАНТИН НЕ УДЕРЖИТ МЕНЯ!',
    'РАСТВОРИСЬ В ЦАРСКОЙ ВОДКЕ!',
    'ЭКСПЕРИМЕНТ ПРОДОЛЖАЕТСЯ!',
  ],
  principal_boss: [
    'В кабинет директора! Срочно!',
    'Приказ об отчислении подписан!',
    'Родителей в школу с дневником!',
    'Смирно на торжественной линейке!',
    'Никаких пересдач!',
    'Школа №13 не прощает ошибок!',
  ],
};

export function getRandomTeacherBark(archetype: TeacherArchetypeId): string {
  const pool = TEACHER_BARKS[archetype] ?? TEACHER_BARKS.literature_chaser;
  return pool[Math.floor(Math.random() * pool.length)];
}

export const SCHOOL_OBSTACLES: ObstacleRect[] = [
  { id: 'locker_tl', x: 220, y: 150, w: 220, h: 48, kind: 'locker', label: 'Шкафчики 9А' },
  { id: 'locker_tr', x: 1360, y: 150, w: 220, h: 48, kind: 'locker', label: 'Шкафчики 11Б' },
  { id: 'locker_bl', x: 220, y: 1000, w: 220, h: 48, kind: 'locker', label: 'Раздевалка' },
  { id: 'locker_br', x: 1360, y: 1000, w: 220, h: 48, kind: 'locker', label: 'Архив' },
  { id: 'desk_nw', x: 430, y: 340, w: 150, h: 90, kind: 'desk_cluster', label: 'Кабинет Алгебры' },
  { id: 'desk_ne', x: 1220, y: 340, w: 150, h: 90, kind: 'lab_table', label: 'Химлаборатория' },
  { id: 'desk_sw', x: 430, y: 770, w: 150, h: 90, kind: 'desk_cluster', label: 'Кабинет Истории' },
  { id: 'desk_se', x: 1220, y: 770, w: 150, h: 90, kind: 'lab_table', label: 'Кабинет Физики' },
  { id: 'pillar_w', x: 680, y: 565, w: 56, h: 70, kind: 'chalk_pillar' },
  { id: 'pillar_e', x: 1064, y: 565, w: 56, h: 70, kind: 'chalk_pillar' },
];

export interface SchoolMapSpec {
  id: SchoolMapId;
  name: string;
  shortName: string;
  title: string;
  subtitle: string;
  hazardHint: string;
  floorPrimary: string;
  floorSecondary: string;
  floorBaseColor: string;
  parquetColor: string;
  trimColor: string;
  rugColors: [string, string, string, string];
  accent: string;
  accentColor: string;
  obstacles: ObstacleRect[];
  explosiveSpots: Array<{
    x: number;
    y: number;
    kind: 'extinguisher' | 'chem_barrel' | 'supply_crate';
  }>;
  secretStash: { x: number; y: number; title: string; loreNote: string; scrapReward: number };
}

export const SCHOOL_MAPS: Record<SchoolMapId, SchoolMapSpec> = {
  corridor: {
    id: 'corridor',
    name: 'Главный Коридор',
    shortName: 'Коридор',
    title: 'Главный Коридор',
    subtitle: 'Шкафчики, колонны, кубки и буфет-автомат · Классическая арена',
    hazardHint: 'Широкие проходы + 6 взрывоопасных баллонов',
    floorPrimary: '#13221c',
    floorSecondary: '#162720',
    floorBaseColor: '#13221c',
    parquetColor: '#291f16',
    trimColor: '#453222',
    rugColors: ['#0284c7', '#16a34a', '#b45309', '#7e22ce'],
    accent: '#4ade80',
    accentColor: '#4ade80',
    obstacles: SCHOOL_OBSTACLES,
    explosiveSpots: [
      { x: 755, y: 440, kind: 'extinguisher' },
      { x: 1045, y: 440, kind: 'chem_barrel' },
      { x: 755, y: 760, kind: 'chem_barrel' },
      { x: 1045, y: 760, kind: 'extinguisher' },
      { x: 580, y: 600, kind: 'extinguisher' },
      { x: 1220, y: 600, kind: 'chem_barrel' },
      { x: 890, y: 260, kind: 'supply_crate' },
      { x: 890, y: 940, kind: 'supply_crate' },
    ],
    secretStash: {
      x: 1540,
      y: 260,
      title: 'Сейф Завхоза №13',
      loreNote: 'Записка Завхоза: «Педсовет пил зелёный реактив из подвала... Бегите!»',
      scrapReward: 50,
    },
  },
  classroom: {
    id: 'classroom',
    name: 'Учебные Классы',
    shortName: 'Классы',
    title: 'Учебный Блок (Кабинеты)',
    subtitle: 'Ряды парт, учительские кафедры и узкие проходы для рикошетов',
    hazardHint: 'Плотные ряды парт · Идеально для рикошетов и турелей',
    floorPrimary: '#1b2016',
    floorSecondary: '#22281b',
    floorBaseColor: '#1b2016',
    parquetColor: '#312316',
    trimColor: '#523b26',
    rugColors: ['#0284c7', '#eab308', '#dc2626', '#0284c7'],
    accent: '#facc15',
    accentColor: '#facc15',
    obstacles: [
      { id: 'cls_podium_w', x: 240, y: 510, w: 90, h: 180, kind: 'teacher_desk', label: 'Кафедра Физики' },
      { id: 'cls_podium_e', x: 1470, y: 510, w: 90, h: 180, kind: 'teacher_desk', label: 'Кафедра Алгебры' },
      { id: 'cls_desk_1', x: 460, y: 260, w: 140, h: 80, kind: 'desk_cluster', label: 'Ряд 1А' },
      { id: 'cls_desk_2', x: 740, y: 260, w: 140, h: 80, kind: 'desk_cluster', label: 'Ряд 2А' },
      { id: 'cls_desk_3', x: 1020, y: 260, w: 140, h: 80, kind: 'desk_cluster', label: 'Ряд 3А' },
      { id: 'cls_desk_4', x: 460, y: 860, w: 140, h: 80, kind: 'desk_cluster', label: 'Ряд 1Б' },
      { id: 'cls_desk_5', x: 740, y: 860, w: 140, h: 80, kind: 'desk_cluster', label: 'Ряд 2Б' },
      { id: 'cls_desk_6', x: 1020, y: 860, w: 140, h: 80, kind: 'desk_cluster', label: 'Ряд 3Б' },
    ],
    explosiveSpots: [
      { x: 640, y: 420, kind: 'extinguisher' },
      { x: 1160, y: 420, kind: 'extinguisher' },
      { x: 640, y: 780, kind: 'chem_barrel' },
      { x: 1160, y: 780, kind: 'chem_barrel' },
      { x: 380, y: 600, kind: 'extinguisher' },
      { x: 1400, y: 600, kind: 'extinguisher' },
      { x: 900, y: 420, kind: 'supply_crate' },
      { x: 900, y: 780, kind: 'supply_crate' },
    ],
    secretStash: {
      x: 240,
      y: 230,
      title: 'Тайник за Глобусом',
      loreNote: 'Дневник Старосты: «Завуч Маргарита прячет медали отличников под кафедрой!»',
      scrapReward: 55,
    },
  },
  gymnasium: {
    id: 'gymnasium',
    name: 'Спортивный Зал',
    shortName: 'Спортзал',
    title: 'Спортивный Зал',
    subtitle: 'Паркетная площадка, гимнастические козлы и простор для манёвров',
    hazardHint: 'Открытый паркет · Простор для рывков и дуэли с Физруком',
    floorPrimary: '#241b12',
    floorSecondary: '#2d2217',
    floorBaseColor: '#241b12',
    parquetColor: '#3a2614',
    trimColor: '#d97706',
    rugColors: ['#dc2626', '#2563eb', '#dc2626', '#2563eb'],
    accent: '#fb923c',
    accentColor: '#fb923c',
    obstacles: [
      { id: 'gym_locker_n', x: 300, y: 140, w: 240, h: 46, kind: 'locker', label: 'Мужская Раздевалка' },
      { id: 'gym_locker_s', x: 1260, y: 1014, w: 240, h: 46, kind: 'locker', label: 'Инвентарная' },
      { id: 'gym_vault_nw', x: 540, y: 380, w: 110, h: 64, kind: 'desk_cluster', label: 'Козёл ГТО' },
      { id: 'gym_vault_ne', x: 1150, y: 380, w: 110, h: 64, kind: 'desk_cluster', label: 'Маты' },
      { id: 'gym_vault_sw', x: 540, y: 756, w: 110, h: 64, kind: 'desk_cluster', label: 'Брусья' },
      { id: 'gym_vault_se', x: 1150, y: 756, w: 110, h: 64, kind: 'desk_cluster', label: 'Скамья' },
    ],
    explosiveSpots: [
      { x: 890, y: 310, kind: 'extinguisher' },
      { x: 890, y: 890, kind: 'extinguisher' },
      { x: 440, y: 600, kind: 'chem_barrel' },
      { x: 1360, y: 600, kind: 'chem_barrel' },
      { x: 700, y: 500, kind: 'extinguisher' },
      { x: 1100, y: 700, kind: 'extinguisher' },
      { x: 340, y: 420, kind: 'supply_crate' },
      { x: 1460, y: 780, kind: 'supply_crate' },
    ],
    secretStash: {
      x: 1520,
      y: 240,
      title: 'Кубковый Шкаф Физрука',
      loreNote: 'Грамота 1988 г.: «Кто переживёт бросок гири Титана — получит освобождение от физры!»',
      scrapReward: 50,
    },
  },
  lab: {
    id: 'lab',
    name: 'Химлаборатория',
    shortName: 'Химлаб',
    title: 'Научная Химлаборатория',
    subtitle: 'Керамические столы, вытяжные шкафы и повышенный запас хим-бочек',
    hazardHint: 'Много бочек с реактивами для цепных хим-взрывов',
    floorPrimary: '#0d211d',
    floorSecondary: '#112a25',
    floorBaseColor: '#0d211d',
    parquetColor: '#132e27',
    trimColor: '#10b981',
    rugColors: ['#16a34a', '#06b6d4', '#84cc16', '#10b981'],
    accent: '#a3e635',
    accentColor: '#a3e635',
    obstacles: [
      { id: 'lab_bench_1', x: 380, y: 300, w: 180, h: 84, kind: 'lab_table', label: 'Сектор Кислот' },
      { id: 'lab_bench_2', x: 1240, y: 300, w: 180, h: 84, kind: 'lab_table', label: 'Сектор Щелочей' },
      { id: 'lab_bench_3', x: 380, y: 816, w: 180, h: 84, kind: 'lab_table', label: 'Центрифуга' },
      { id: 'lab_bench_4', x: 1240, y: 816, w: 180, h: 84, kind: 'lab_table', label: 'Автоклав' },
      { id: 'lab_pillar_n', x: 865, y: 260, w: 70, h: 70, kind: 'chalk_pillar' },
      { id: 'lab_pillar_s', x: 865, y: 870, w: 70, h: 70, kind: 'chalk_pillar' },
    ],
    explosiveSpots: [
      { x: 680, y: 420, kind: 'chem_barrel' },
      { x: 1120, y: 420, kind: 'chem_barrel' },
      { x: 680, y: 780, kind: 'chem_barrel' },
      { x: 1120, y: 780, kind: 'chem_barrel' },
      { x: 560, y: 600, kind: 'extinguisher' },
      { x: 1240, y: 600, kind: 'chem_barrel' },
      { x: 900, y: 420, kind: 'supply_crate' },
      { x: 900, y: 780, kind: 'supply_crate' },
    ],
    secretStash: {
      x: 250,
      y: 940,
      title: 'Капсула «Проект-13»',
      loreNote: 'Протокол Лаборатории: «Выстрел Дробовика или Теслы в кислотную лужу вызывает цепной термо-взрыв!»',
      scrapReward: 60,
    },
  },
  library: {
    id: 'library',
    name: 'Школьная Библиотека',
    shortName: 'Библиотека',
    title: 'Школьная Библиотека',
    subtitle: 'Высокие книжные стеллажи, читальные столы и лабиринты знаний',
    hazardHint: 'Высокие книжные стеллажи укрывают от снайперов',
    floorPrimary: '#1d1624',
    floorSecondary: '#241b2d',
    floorBaseColor: '#1d1624',
    parquetColor: '#2d1e2f',
    trimColor: '#9333ea',
    rugColors: ['#7e22ce', '#b45309', '#be123c', '#6d28d9'],
    accent: '#c084fc',
    accentColor: '#c084fc',
    obstacles: [
      { id: 'lib_shelf_nw', x: 340, y: 240, w: 70, h: 240, kind: 'locker', label: 'Классика' },
      { id: 'lib_shelf_ne', x: 1390, y: 240, w: 70, h: 240, kind: 'locker', label: 'Энциклопедии' },
      { id: 'lib_shelf_sw', x: 340, y: 720, w: 70, h: 240, kind: 'locker', label: 'Архив Редких Книг' },
      { id: 'lib_shelf_se', x: 1390, y: 720, w: 70, h: 240, kind: 'locker', label: 'Фантастика' },
      { id: 'lib_table_w', x: 600, y: 460, w: 110, h: 100, kind: 'teacher_desk', label: 'Читальный Стол' },
      { id: 'lib_table_e', x: 1090, y: 640, w: 110, h: 100, kind: 'teacher_desk', label: 'Картотека' },
    ],
    explosiveSpots: [
      { x: 780, y: 360, kind: 'extinguisher' },
      { x: 1020, y: 840, kind: 'extinguisher' },
      { x: 500, y: 600, kind: 'chem_barrel' },
      { x: 1300, y: 600, kind: 'chem_barrel' },
      { x: 740, y: 760, kind: 'extinguisher' },
      { x: 1060, y: 440, kind: 'chem_barrel' },
      { x: 900, y: 240, kind: 'supply_crate' },
      { x: 900, y: 960, kind: 'supply_crate' },
    ],
    secretStash: {
      x: 230,
      y: 600,
      title: 'Секретный Архив Дирекции',
      loreNote: 'Тайный указ: «Истинный Староста Ада использует быструю смену оружия каждые 2 секунды!»',
      scrapReward: 55,
    },
  },
  basement: {
    id: 'basement',
    name: 'Карантин-Бункер',
    shortName: 'Подвал',
    title: 'Подвал Карантина (Зона №13)',
    subtitle: 'Бойлерная, паровые колонны и эпицентр мутации педсовета',
    hazardHint: 'Зона повышенного риска · Секретный бункер с наградой +65 деталей',
    floorPrimary: '#181115',
    floorSecondary: '#21151b',
    floorBaseColor: '#181115',
    parquetColor: '#29151c',
    trimColor: '#e11d48',
    rugColors: ['#be123c', '#9f1239', '#b91c1c', '#881337'],
    accent: '#f43f5e',
    accentColor: '#f43f5e',
    obstacles: [
      { id: 'base_boiler_nw', x: 400, y: 300, w: 140, h: 100, kind: 'lab_table', label: 'Котельная №1' },
      { id: 'base_boiler_ne', x: 1260, y: 300, w: 140, h: 100, kind: 'lab_table', label: 'Генератор' },
      { id: 'base_boiler_sw', x: 400, y: 800, w: 140, h: 100, kind: 'lab_table', label: 'Теплоузел' },
      { id: 'base_boiler_se', x: 1260, y: 800, w: 140, h: 100, kind: 'lab_table', label: 'Фильтр-Блок' },
      { id: 'base_pipe_w', x: 660, y: 550, w: 68, h: 90, kind: 'chalk_pillar' },
      { id: 'base_pipe_e', x: 1072, y: 550, w: 68, h: 90, kind: 'chalk_pillar' },
    ],
    explosiveSpots: [
      { x: 770, y: 410, kind: 'chem_barrel' },
      { x: 1030, y: 410, kind: 'chem_barrel' },
      { x: 770, y: 790, kind: 'chem_barrel' },
      { x: 1030, y: 790, kind: 'chem_barrel' },
      { x: 560, y: 600, kind: 'extinguisher' },
      { x: 1240, y: 600, kind: 'extinguisher' },
      { x: 900, y: 280, kind: 'supply_crate' },
      { x: 900, y: 920, kind: 'supply_crate' },
    ],
    secretStash: {
      x: 1550,
      y: 930,
      title: 'Бункер Нулевого Пациента',
      loreNote: 'Журнал Наблюдений: «Подвал — место, где Директор обрёл силу Трёх Фаз...»',
      scrapReward: 65,
    },
  },
};

export function getObstaclesForMap(mapId: SchoolMapId = 'corridor'): ObstacleRect[] {
  return SCHOOL_MAPS[mapId]?.obstacles ?? SCHOOL_OBSTACLES;
}

export function createWaveExplosiveProps(
  startId: number,
  mapId: SchoolMapId = 'corridor'
): ExplosiveProp[] {
  const spots = SCHOOL_MAPS[mapId]?.explosiveSpots ?? SCHOOL_MAPS.corridor.explosiveSpots;
  return spots.map((s, idx) => ({
    id: startId + idx,
    kind: s.kind,
    x: s.x,
    y: s.y,
    radius: s.kind === 'supply_crate' ? 18 : 17,
    hp: s.kind === 'supply_crate' ? 26 : 35,
    maxHp: s.kind === 'supply_crate' ? 26 : 35,
    blastRadius: s.kind === 'supply_crate' ? 75 : 165,
    blastDamage: s.kind === 'supply_crate' ? 35 : 125,
    hitFlashTimer: 0,
  }));
}

export function createMapSecretStash(mapId: SchoolMapId = 'corridor'): SecretStashEntity {
  const spec = SCHOOL_MAPS[mapId]?.secretStash ?? SCHOOL_MAPS.corridor.secretStash;
  return {
    x: spec.x,
    y: spec.y,
    radius: 26,
    hp: 60,
    maxHp: 60,
    discovered: false,
    title: spec.title,
    loreNote: spec.loreNote,
    loreText: spec.loreNote,
    scrapReward: spec.scrapReward,
    hitFlashTimer: 0,
  };
}

export function getModifiedWeaponSpec(
  weaponId: WeaponId,
  mods: ReadonlyArray<WeaponModId> = []
): WeaponSpec {
  const base = { ...WEAPON_SPECS[weaponId] };
  if (weaponId === 'slingshot' && mods.includes('slingshot_ricochet')) {
    base.damage = Math.round(base.damage * 1.35);
    base.pierce += 2;
    base.speed = Math.round(base.speed * 1.25);
  }
  if (weaponId === 'shotgun' && mods.includes('shotgun_incendiary')) {
    base.projectiles += 2;
    base.damage = Math.round(base.damage * 1.25);
    base.aoeRadius = 65;
  }
  if (weaponId === 'nailgun' && mods.includes('nailgun_hyper')) {
    base.projectiles = 2;
    base.cooldown = Number((base.cooldown * 0.78).toFixed(3));
    base.pierce += 1;
    base.maxAmmo += 45;
  }
  if (weaponId === 'acid' && mods.includes('acid_volatile')) {
    base.aoeRadius = Math.round(base.aoeRadius * 1.35);
    base.damage = Math.round(base.damage * 1.35);
    base.maxAmmo += 10;
  }
  if (weaponId === 'tesla' && mods.includes('tesla_overcharge')) {
    base.damage = Math.round(base.damage * 1.25);
    base.pierce += 2;
    base.maxAmmo += 8;
  }
  return base;
}

export function createInitialPlayer(
  ultimateId: UltimateId = 'sandevistan',
  metaLevels?: {
    vitality?: number;
    shield_battery?: number;
    starting_scrap?: number;
    rapid_mechanism?: number;
    vitality_grade?: number;
    shield_textbook?: number;
    scrap_stipend?: number;
    ammo_pouch?: number;
  },
  skinId = 'default'
): PlayerState {
  const vitLv = metaLevels?.vitality ?? metaLevels?.vitality_grade ?? 0;
  const shdLv = metaLevels?.shield_battery ?? metaLevels?.shield_textbook ?? 0;
  const scrLv = metaLevels?.starting_scrap ?? metaLevels?.scrap_stipend ?? 0;
  const rapLv = metaLevels?.rapid_mechanism ?? metaLevels?.ammo_pouch ?? 0;

  const hpBonus = vitLv * 15;
  const shieldBonus = shdLv * 15;
  const scrapBonus = scrLv * 20;
  const ammoMult = 1 + rapLv * 0.15;
  const fireRateMult = 1.0 + rapLv * 0.06;

  return {
    x: ARENA_WIDTH / 2,
    y: ARENA_HEIGHT / 2,
    vx: 0,
    vy: 0,
    angle: 0,
    hp: 100 + hpBonus,
    maxHp: 100 + hpBonus,
    ghostHp: 100 + hpBonus,
    shield: 35 + shieldBonus,
    maxShield: 100 + shieldBonus,
    rage: 100,
    maxRage: 100,
    speed: 295,
    radius: 18,
    activeWeapon: 'slingshot',
    lastWeapon: 'slingshot',
    weaponSwitchTimer: 0,
    ammo: {
      slingshot: -1,
      shotgun: Math.round(30 * ammoMult),
      nailgun: Math.round(110 * ammoMult),
      acid: Math.round(18 * ammoMult),
      tesla: Math.round(16 * ammoMult),
    },
    scrap: 55 + scrapBonus,
    overdriveTimer: 0,
    speedBoostTimer: 0,
    invulnTimer: 0,
    dashCooldown: 0,
    dashTimer: 0,
    fireCooldown: 0,
    recoilOffset: 0,
    muzzleFlashTimer: 0,
    shockwaveVisualTimer: 0,
    scaleX: 1,
    scaleY: 1,
    walkDistance: 0,
    hitFlashTimer: 0,
    vampirismBonus: 0,
    fireRateMultiplier: fireRateMult,
    ultimateId,
    sandevistanTimer: 0,
    ninjaSlashTimer: 0,
    weaponMods: [],
    skinId,
  };
}

export function applyUpgradeToPlayer(player: PlayerState, upgradeId: UpgradeId): PlayerState {
  const next: PlayerState = {
    ...player,
    ammo: { ...player.ammo },
    weaponMods: [...(player.weaponMods ?? [])],
  };
  if (upgradeId === 'vampirism') {
    next.hp = Math.min(next.maxHp, next.hp + 25);
    next.vampirismBonus += 4;
    next.speed += 15;
  } else if (upgradeId === 'rapid_reload') {
    next.ammo.shotgun = getModifiedWeaponSpec('shotgun', next.weaponMods).maxAmmo;
    next.ammo.nailgun = getModifiedWeaponSpec('nailgun', next.weaponMods).maxAmmo;
    next.ammo.acid = getModifiedWeaponSpec('acid', next.weaponMods).maxAmmo;
    next.ammo.tesla = getModifiedWeaponSpec('tesla', next.weaponMods).maxAmmo;
    next.fireRateMultiplier *= 1.18;
  } else if (upgradeId === 'scrap_engineer') {
    next.scrap += 45;
    next.shield = Math.min(next.maxShield, next.shield + 40);
    next.rage = next.maxRage;
  } else {
    const modId: WeaponModId = (
      upgradeId.startsWith('mod_') ? upgradeId.slice(4) : upgradeId
    ) as WeaponModId;
    if (!next.weaponMods.includes(modId)) {
      next.weaponMods.push(modId);
    }
    if (modId === 'shotgun_incendiary') {
      next.ammo.shotgun = getModifiedWeaponSpec('shotgun', next.weaponMods).maxAmmo;
    } else if (modId === 'nailgun_hyper') {
      next.ammo.nailgun = getModifiedWeaponSpec('nailgun', next.weaponMods).maxAmmo;
    } else if (modId === 'acid_volatile') {
      next.ammo.acid = getModifiedWeaponSpec('acid', next.weaponMods).maxAmmo;
    } else if (modId === 'tesla_overcharge') {
      next.ammo.tesla = getModifiedWeaponSpec('tesla', next.weaponMods).maxAmmo;
    }
  }
  return next;
}

export function getBossPhaseForHp(hp: number, maxHp: number): 1 | 2 | 3 {
  const ratio = hp / Math.max(1, maxHp);
  if (ratio <= 0.32) return 3;
  if (ratio <= 0.66) return 2;
  return 1;
}

export interface WaveConfig {
  wave: number;
  title: string;
  subtitle: string;
  totalBudget: number;
  spawnInterval: number;
  speedMultiplier: number;
  archetypePool: TeacherArchetypeId[];
  spawnBoss: boolean;
  bossId?: TeacherArchetypeId;
  bossArchetype?: TeacherArchetypeId;
  recommendedMap?: SchoolMapId;
}

export function getWaveConfig(wave: number): WaveConfig {
  const clamped = Math.max(1, Math.min(MAX_WAVES, Math.floor(wave)));
  switch (clamped) {
    case 1:
      return {
        wave: 1,
        title: '1-й Урок: Проверка посещаемости',
        subtitle: 'Разминка в коридоре · Ищите Секретный Тайник и взрывайте баллоны!',
        totalBudget: 10,
        spawnInterval: 1.4,
        speedMultiplier: 0.95,
        archetypePool: ['literature_chaser', 'literature_chaser', 'math_sniper', 'pe_charger'],
        spawnBoss: false,
        recommendedMap: 'corridor',
      };
    case 2:
      return {
        wave: 2,
        title: '2-й Урок: Дисциплинарный Контроль Завуча',
        subtitle: 'Босс урока: Завуч Маргарита · Призывает дежурных и ставит зоны ареста!',
        totalBudget: 14,
        spawnInterval: 1.2,
        speedMultiplier: 1.02,
        archetypePool: ['literature_chaser', 'math_sniper', 'pe_charger', 'pe_charger'],
        spawnBoss: true,
        bossId: 'vice_principal_boss',
        bossArchetype: 'vice_principal_boss',
        recommendedMap: 'classroom',
      };
    case 3:
      return {
        wave: 3,
        title: '3-й Урок: Олимпийский Таран Физрука',
        subtitle: 'Босс урока: Старший Физрук Титан · Прыжки с гирями и свисток!',
        totalBudget: 17,
        spawnInterval: 1.08,
        speedMultiplier: 1.07,
        archetypePool: ['literature_chaser', 'math_sniper', 'pe_charger', 'chem_lobber', 'chem_lobber'],
        spawnBoss: true,
        bossId: 'pe_boss',
        bossArchetype: 'pe_boss',
        recommendedMap: 'gymnasium',
      };
    case 4:
      return {
        wave: 4,
        title: '4-й Урок: Прорыв Хим-Лаборатории',
        subtitle: 'Босс урока: Лабораторный Мутант «Объект-13» · Взрывайте кислоту Дробовиком/Теслой!',
        totalBudget: 20,
        spawnInterval: 0.96,
        speedMultiplier: 1.12,
        archetypePool: ['math_sniper', 'pe_charger', 'chem_lobber', 'history_shield', 'history_shield'],
        spawnBoss: true,
        bossId: 'lab_experiment_boss',
        bossArchetype: 'lab_experiment_boss',
        recommendedMap: 'lab',
      };
    default:
      return {
        wave: 5,
        title: 'Педсовет: Экзамен у Директора',
        subtitle: 'Финальный Босс: 3 Фазы Директора Школы · Максимальный ранг ULTRAKILL!',
        totalBudget: 24,
        spawnInterval: 0.88,
        speedMultiplier: 1.16,
        archetypePool: [
          'literature_chaser',
          'math_sniper',
          'pe_charger',
          'chem_lobber',
          'history_shield',
        ],
        spawnBoss: true,
        bossId: 'principal_boss',
        bossArchetype: 'principal_boss',
        recommendedMap: 'basement',
      };
  }
}

export function normalizeAngle(angle: number): number {
  let a = angle;
  while (a > Math.PI) a -= Math.PI * 2;
  while (a < -Math.PI) a += Math.PI * 2;
  return a;
}

export function lerpAngle(current: number, target: number, factor: number): number {
  const diff = normalizeAngle(target - current);
  return normalizeAngle(current + diff * Math.max(0, Math.min(1, factor)));
}

export function hasLineOfSight(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  obstacles: ReadonlyArray<ObstacleRect>
): boolean {
  for (const obs of obstacles) {
    if (segmentIntersectsRect(x1, y1, x2, y2, obs)) {
      return false;
    }
  }
  return true;
}

export function computeEffectiveProjectileDamage(
  baseDamage: number,
  playerOverdriveTimer: number,
  projectileAngle: number,
  target: Pick<ZombieTeacher, 'archetype' | 'angle' | 'state'>,
  pierceCount: number,
  isPointBlank = false,
  isQuickSwap = false
): { damage: number; blockedByShield: boolean; isCriticalInterrupt: boolean } {
  let mult = playerOverdriveTimer > 0 ? 2.0 : 1.0;
  if (isPointBlank) mult *= 1.4;
  if (isQuickSwap) mult *= 1.2;

  let isCriticalInterrupt = false;
  if (target.state === 'windup' || target.state === 'staggered') {
    mult *= 1.45;
    isCriticalInterrupt = true;
  }

  let dmg = baseDamage * mult;
  let blockedByShield = false;

  const spec = TEACHER_SPECS[target.archetype];
  if (spec.frontShieldReduction !== undefined && pierceCount <= 1) {
    const incomingAngle = normalizeAngle(projectileAngle + Math.PI);
    const angleDiff = Math.abs(normalizeAngle(incomingAngle - target.angle));
    if (angleDiff <= Math.PI * 0.48) {
      dmg = Math.max(1, Math.round(dmg * spec.frontShieldReduction));
      blockedByShield = true;
      isCriticalInterrupt = false;
    }
  }

  return { damage: Math.round(dmg), blockedByShield, isCriticalInterrupt };
}

export function applyDamageToPlayer(
  player: Pick<PlayerState, 'hp' | 'shield' | 'invulnTimer'>,
  rawDamage: number
): { hp: number; shield: number; actualDamageTaken: number; defeated: boolean } {
  if (player.invulnTimer > 0 || rawDamage <= 0) {
    return {
      hp: player.hp,
      shield: player.shield,
      actualDamageTaken: 0,
      defeated: player.hp <= 0,
    };
  }

  let remaining = Math.round(rawDamage);
  let newShield = player.shield;
  let newHp = player.hp;

  if (newShield > 0) {
    const absorbed = Math.min(newShield, remaining);
    newShield -= absorbed;
    remaining -= absorbed;
  }

  if (remaining > 0) {
    newHp = Math.max(0, newHp - remaining);
  }

  return {
    hp: newHp,
    shield: newShield,
    actualDamageTaken: Math.round(rawDamage),
    defeated: newHp <= 0,
  };
}

export function applyBonusToPlayer(
  player: PlayerState,
  bonus: BonusType
): { updated: PlayerState; label: string } {
  const next: PlayerState = {
    ...player,
    ammo: { ...player.ammo },
  };

  switch (bonus) {
    case 'medkit':
      next.hp = Math.min(next.maxHp, next.hp + 35);
      return { updated: next, label: '+35 ОЗ (Аптечка)' };
    case 'shield':
      next.shield = Math.min(next.maxShield, next.shield + 50);
      return { updated: next, label: '+50 Щит (Учебник)' };
    case 'overdrive':
      next.overdriveTimer = Math.max(next.overdriveTimer, 10.0);
      return { updated: next, label: 'x2 УРОН (Отличник!)' };
    case 'speed':
      next.speedBoostTimer = Math.max(next.speedBoostTimer, 9.0);
      return { updated: next, label: '+35% СКОРОСТЬ (Буфет)' };
    case 'freeze':
      next.rage = Math.min(next.maxRage, next.rage + 35);
      return { updated: next, label: 'ЗВОНОК! Зомби заморожены' };
    case 'ammo':
      next.ammo.shotgun = Math.min(WEAPON_SPECS.shotgun.maxAmmo, next.ammo.shotgun + 14);
      next.ammo.nailgun = Math.min(WEAPON_SPECS.nailgun.maxAmmo, next.ammo.nailgun + 45);
      next.ammo.acid = Math.min(WEAPON_SPECS.acid.maxAmmo, next.ammo.acid + 8);
      next.ammo.tesla = Math.min(WEAPON_SPECS.tesla.maxAmmo, next.ammo.tesla + 7);
      next.scrap += 25;
      return { updated: next, label: '+Боезапас и +25 Деталей' };
  }
}

export function resolveCircleRectCollision(
  cx: number,
  cy: number,
  radius: number,
  rect: ObstacleRect
): { x: number; y: number; collided: boolean; normalX: number; normalY: number } {
  const closestX = Math.max(rect.x, Math.min(cx, rect.x + rect.w));
  const closestY = Math.max(rect.y, Math.min(cy, rect.y + rect.h));
  const dx = cx - closestX;
  const dy = cy - closestY;
  const distSq = dx * dx + dy * dy;

  if (distSq >= radius * radius) {
    return { x: cx, y: cy, collided: false, normalX: 0, normalY: 0 };
  }

  const dist = Math.sqrt(distSq);
  if (dist > 0.0001) {
    const overlap = radius - dist;
    const nx = dx / dist;
    const ny = dy / dist;
    return {
      x: cx + nx * overlap,
      y: cy + ny * overlap,
      collided: true,
      normalX: nx,
      normalY: ny,
    };
  }

  const leftPen = cx - rect.x;
  const rightPen = rect.x + rect.w - cx;
  const topPen = cy - rect.y;
  const bottomPen = rect.y + rect.h - cy;
  const minPen = Math.min(leftPen, rightPen, topPen, bottomPen);

  if (minPen === leftPen) return { x: rect.x - radius, y: cy, collided: true, normalX: -1, normalY: 0 };
  if (minPen === rightPen) return { x: rect.x + rect.w + radius, y: cy, collided: true, normalX: 1, normalY: 0 };
  if (minPen === topPen) return { x: cx, y: rect.y - radius, collided: true, normalX: 0, normalY: -1 };
  return { x: cx, y: rect.y + rect.h + radius, collided: true, normalX: 0, normalY: 1 };
}

export function resolveCircleCircleCollision(
  x1: number,
  y1: number,
  r1: number,
  x2: number,
  y2: number,
  r2: number
): { x1: number; y1: number; collided: boolean; normalX: number; normalY: number } {
  const dx = x1 - x2;
  const dy = y1 - y2;
  const distSq = dx * dx + dy * dy;
  const minDist = r1 + r2;
  if (distSq >= minDist * minDist) {
    return { x1, y1, collided: false, normalX: 0, normalY: 0 };
  }
  const dist = Math.sqrt(distSq) || 0.001;
  const overlap = minDist - dist;
  const nx = dx / dist;
  const ny = dy / dist;
  return {
    x1: x1 + nx * overlap,
    y1: y1 + ny * overlap,
    collided: true,
    normalX: nx,
    normalY: ny,
  };
}

export function distToSegmentSq(
  px: number,
  py: number,
  x1: number,
  y1: number,
  x2: number,
  y2: number
): number {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const l2 = dx * dx + dy * dy;
  if (l2 < 0.0001) {
    const dpx = px - x1;
    const dpy = py - y1;
    return dpx * dpx + dpy * dpy;
  }
  const t = Math.max(0, Math.min(1, ((px - x1) * dx + (py - y1) * dy) / l2));
  const projX = x1 + t * dx;
  const projY = y1 + t * dy;
  const distX = px - projX;
  const distY = py - projY;
  return distX * distX + distY * distY;
}

function lineSegmentsIntersect(
  p0x: number,
  p0y: number,
  p1x: number,
  p1y: number,
  p2x: number,
  p2y: number,
  p3x: number,
  p3y: number
): boolean {
  const s1x = p1x - p0x;
  const s1y = p1y - p0y;
  const s2x = p3x - p2x;
  const s2y = p3y - p2y;

  const denom = -s2x * s1y + s1x * s2y;
  if (Math.abs(denom) < 0.0001) return false;

  const s = (-s1y * (p0x - p2x) + s1x * (p0y - p2y)) / denom;
  const t = (s2x * (p0y - p2y) - s2y * (p0x - p2x)) / denom;

  return s >= 0 && s <= 1 && t >= 0 && t <= 1;
}

export function segmentIntersectsRect(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  rect: ObstacleRect
): boolean {
  if (
    (x1 >= rect.x && x1 <= rect.x + rect.w && y1 >= rect.y && y1 <= rect.y + rect.h) ||
    (x2 >= rect.x && x2 <= rect.x + rect.w && y2 >= rect.y && y2 <= rect.y + rect.h)
  ) {
    return true;
  }
  const minX = Math.min(x1, x2);
  const maxX = Math.max(x1, x2);
  const minY = Math.min(y1, y2);
  const maxY = Math.max(y1, y2);
  if (maxX < rect.x || minX > rect.x + rect.w || maxY < rect.y || minY > rect.y + rect.h) {
    return false;
  }
  return (
    lineSegmentsIntersect(x1, y1, x2, y2, rect.x, rect.y, rect.x + rect.w, rect.y) ||
    lineSegmentsIntersect(x1, y1, x2, y2, rect.x + rect.w, rect.y, rect.x + rect.w, rect.y + rect.h) ||
    lineSegmentsIntersect(x1, y1, x2, y2, rect.x + rect.w, rect.y + rect.h, rect.x, rect.y + rect.h) ||
    lineSegmentsIntersect(x1, y1, x2, y2, rect.x, rect.y + rect.h, rect.x, rect.y)
  );
}

export function applyTeacherFlocking(teachers: ZombieTeacher[]): void {
  const count = teachers.length;
  for (let i = 0; i < count; i++) {
    const t1 = teachers[i];
    if (t1.state === 'ko') continue;
    for (let j = i + 1; j < count; j++) {
      const t2 = teachers[j];
      if (t2.state === 'ko') continue;
      const dx = t1.x - t2.x;
      const dy = t1.y - t2.y;
      const distSq = dx * dx + dy * dy;
      const minDist = t1.radius + t2.radius + 6;
      if (distSq < minDist * minDist && distSq > 0.0001) {
        const dist = Math.sqrt(distSq);
        const overlap = (minDist - dist) * 0.5;
        const nx = dx / dist;
        const ny = dy / dist;
        t1.x += nx * overlap;
        t1.y += ny * overlap;
        t2.x -= nx * overlap;
        t2.y -= ny * overlap;
      }
    }
  }
}

export function computeTeacherSeekVector(
  teacher: Pick<ZombieTeacher, 'id' | 'archetype' | 'x' | 'y' | 'bossPhase'>,
  targetX: number,
  targetY: number,
  elapsedTime: number
): { vx: number; vy: number; desiredAngle: number; shouldStartWindup: boolean } {
  const spec = TEACHER_SPECS[teacher.archetype];
  const dx = targetX - teacher.x;
  const dy = targetY - teacher.y;
  const dist = Math.hypot(dx, dy) || 1;
  const nx = dx / dist;
  const ny = dy / dist;
  const desiredAngle = Math.atan2(dy, dx);

  switch (spec.policy) {
    case 'chaser': {
      const flank = Math.sin(elapsedTime * 3.2 + teacher.id * 1.7) * 0.28;
      const fx = nx * Math.cos(flank) - ny * Math.sin(flank);
      const fy = nx * Math.sin(flank) + ny * Math.cos(flank);
      return {
        vx: fx * spec.speed,
        vy: fy * spec.speed,
        desiredAngle,
        shouldStartWindup: dist <= spec.attackRange,
      };
    }
    case 'kiter': {
      const preferredMin = 230;
      const preferredMax = 370;
      const strafeDir = teacher.id % 2 === 0 ? 1 : -1;
      const tx = -ny * strafeDir;
      const ty = nx * strafeDir;
      if (dist < preferredMin) {
        return {
          vx: (-nx * 0.8 + tx * 0.5) * spec.speed,
          vy: (-ny * 0.8 + ty * 0.5) * spec.speed,
          desiredAngle,
          shouldStartWindup: true,
        };
      }
      if (dist <= preferredMax) {
        return {
          vx: tx * spec.speed * 0.85,
          vy: ty * spec.speed * 0.85,
          desiredAngle,
          shouldStartWindup: true,
        };
      }
      return {
        vx: nx * spec.speed,
        vy: ny * spec.speed,
        desiredAngle,
        shouldStartWindup: dist <= spec.attackRange,
      };
    }
    case 'charger': {
      return {
        vx: nx * spec.speed,
        vy: ny * spec.speed,
        desiredAngle,
        shouldStartWindup: dist <= spec.attackRange && dist >= 95,
      };
    }
    case 'lobber': {
      const orbitSign = teacher.id % 2 === 0 ? 1 : -1;
      const ox = -ny * orbitSign * 0.65 + (dist > 340 ? nx * 0.75 : -nx * 0.35);
      const oy = nx * orbitSign * 0.65 + (dist > 340 ? ny * 0.75 : -ny * 0.35);
      const mag = Math.hypot(ox, oy) || 1;
      return {
        vx: (ox / mag) * spec.speed,
        vy: (oy / mag) * spec.speed,
        desiredAngle,
        shouldStartWindup: dist <= spec.attackRange,
      };
    }
    case 'shielded': {
      return {
        vx: nx * spec.speed,
        vy: ny * spec.speed,
        desiredAngle,
        shouldStartWindup: dist <= spec.attackRange,
      };
    }
    case 'boss_slam': {
      const phaseMult = teacher.bossPhase === 3 ? 1.48 : teacher.bossPhase === 2 ? 1.22 : 1.0;
      const effectiveRange =
        teacher.bossPhase === 3
          ? spec.attackRange * 1.45
          : teacher.bossPhase === 2
          ? spec.attackRange * 1.25
          : spec.attackRange;
      return {
        vx: nx * spec.speed * phaseMult,
        vy: ny * spec.speed * phaseMult,
        desiredAngle,
        shouldStartWindup: dist <= effectiveRange,
      };
    }
  }
}

export function canAcquireAttackToken(
  teachers: ReadonlyArray<Pick<ZombieTeacher, 'id' | 'hasAttackToken' | 'state'>>,
  candidateId: number,
  maxTokens: number = MAX_CONCURRENT_ATTACK_TOKENS
): boolean {
  let activeCount = 0;
  for (const t of teachers) {
    if (t.id === candidateId && t.hasAttackToken) return true;
    if (t.hasAttackToken && (t.state === 'windup' || t.state === 'active_attack')) {
      activeCount++;
    }
  }
  return activeCount < maxTokens;
}

export function canPlaceStructure(
  x: number,
  y: number,
  radius: number,
  scrap: number,
  cost: number,
  obstacles: ReadonlyArray<ObstacleRect>,
  existingStructures: ReadonlyArray<Pick<BarricadeEntity, 'x' | 'y' | 'radius'>>
): { allowed: boolean; reason?: string } {
  if (scrap < cost) {
    return { allowed: false, reason: 'Недостаточно деталей' };
  }
  if (x < 80 || x > ARENA_WIDTH - 80 || y < 80 || y > ARENA_HEIGHT - 80) {
    return { allowed: false, reason: 'Слишком близко к стене' };
  }
  for (const obs of obstacles) {
    const check = resolveCircleRectCollision(x, y, radius + 6, obs);
    if (check.collided) {
      return { allowed: false, reason: 'Мешает школьная мебель' };
    }
  }
  for (const st of existingStructures) {
    if (Math.hypot(x - st.x, y - st.y) < radius + st.radius + 14) {
      return { allowed: false, reason: 'Слишком близко к другой постройке' };
    }
  }
  return { allowed: true };
}
