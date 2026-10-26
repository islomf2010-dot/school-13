import { StyleRankId } from './rules';

export const SAVE_STORAGE_KEY = 'school13_indie_save_v2';
export const CURRENT_SAVE_VERSION = 2;

export type CharacterSkinId =
  | 'default'
  | 'cyber_punk'
  | 'shadow_shinobi'
  | 'bio_chemist'
  | 'golden_graduate';

export type SkinId = CharacterSkinId;

export interface CharacterSkinSpec {
  id: CharacterSkinId;
  name: string;
  subtitle: string;
  costMedals: number;
  jacketColor: string;
  sleeveColor: string;
  headbandColor: string;
}

export type SkinSpec = CharacterSkinSpec;

export const SKIN_SPECS: CharacterSkinSpec[] = [
  {
    id: 'default',
    name: 'Бомбер Выжившего',
    subtitle: 'Классическая куртка сборной Школы №13 с алой банданой',
    costMedals: 0,
    jacketColor: '#334155',
    sleeveColor: '#f8fafc',
    headbandColor: '#dc2626',
  },
  {
    id: 'cyber_punk',
    name: 'Кибер-Куртка «Эджраннер»',
    subtitle: 'Ярко-жёлтый неоновый бомбер с изумрудной лентой Сандевистана',
    costMedals: 45,
    jacketColor: '#eab308',
    sleeveColor: '#fde047',
    headbandColor: '#00ff9d',
  },
  {
    id: 'shadow_shinobi',
    name: 'Доспех Ночного Шиноби',
    subtitle: 'Обсидиановая форма клана Тени с багровой повязкой Иайдо',
    costMedals: 65,
    jacketColor: '#1e1b4b',
    sleeveColor: '#4338ca',
    headbandColor: '#f43f5e',
  },
  {
    id: 'bio_chemist',
    name: 'Химзащита «Зона-13»',
    subtitle: 'Лабораторный костюм против мутантов и токсичных реактивов',
    costMedals: 80,
    jacketColor: '#15803d',
    sleeveColor: '#bef264',
    headbandColor: '#a855f7',
  },
  {
    id: 'golden_graduate',
    name: 'Золотой Мундир Медалиста',
    subtitle: 'Парадный бело-золотой китель лучшего выпускника школы',
    costMedals: 110,
    jacketColor: '#d97706',
    sleeveColor: '#fef08a',
    headbandColor: '#38bdf8',
  },
];

export type MetaUpgradeId =
  | 'vitality'
  | 'shield_battery'
  | 'starting_scrap'
  | 'rapid_mechanism';

export interface MetaUpgradeSpec {
  id: MetaUpgradeId;
  title: string;
  description: string;
  maxLevel: number;
  baseCost: number;
  costStep: number;
  accent: string;
}

export const META_UPGRADE_SPECS: MetaUpgradeSpec[] = [
  {
    id: 'vitality',
    title: 'ИММУНИТЕТ ОТЛИЧНИКА',
    description: '+15 к максимальному и стартовому здоровью (ОЗ) за каждый уровень',
    maxLevel: 5,
    baseCost: 25,
    costStep: 20,
    accent: '#4ade80',
  },
  {
    id: 'shield_battery',
    title: 'ЭНЦИКЛОПЕДИЧЕСКАЯ БРОНЯ',
    description: '+15 к стартовому и максимальному щиту за каждый уровень',
    maxLevel: 5,
    baseCost: 25,
    costStep: 20,
    accent: '#38bdf8',
  },
  {
    id: 'starting_scrap',
    title: 'ЗАНАЧКА ЗАВХОЗА',
    description: '+20 стартовых деталей на постройку турелей и парт в начале урока',
    maxLevel: 5,
    baseCost: 20,
    costStep: 18,
    accent: '#facc15',
  },
  {
    id: 'rapid_mechanism',
    title: 'КАЛИБРОВКА ОРУЖИЯ',
    description: '+6% к базовой скорострельности и +15% к стартовому боезапасу за уровень',
    maxLevel: 5,
    baseCost: 30,
    costStep: 25,
    accent: '#c084fc',
  },
];

export type AchievementId =
  | 'first_bell'
  | 'graduate'
  | 'boss_hunter'
  | 'ultrakill_rank'
  | 'secret_finder'
  | 'parry_master'
  | 'architect'
  | 'exterminator'
  | 'untouchable'
  | 'custom_style';

export interface AchievementSpec {
  id: AchievementId;
  title: string;
  description: string;
  rewardMedals: number;
  accent: string;
}

export const ACHIEVEMENT_SPECS: AchievementSpec[] = [
  {
    id: 'first_bell',
    title: 'Первый Звонок',
    description: 'Завершить хотя бы 1-й урок выживания',
    rewardMedals: 15,
    accent: '#4ade80',
  },
  {
    id: 'graduate',
    title: 'Аттестат Выжившего',
    description: 'Пройти все 5 уроков и победить Финального Директора',
    rewardMedals: 60,
    accent: '#facc15',
  },
  {
    id: 'boss_hunter',
    title: 'Гроза Педсовета',
    description: 'Победить 3 боссов школы (Завуча, Физрука, Мутанта или Директора)',
    rewardMedals: 35,
    accent: '#fb7185',
  },
  {
    id: 'ultrakill_rank',
    title: 'Староста Ада (ULTRAKILL)',
    description: 'Достичь максимального ранга стиля ULTRAKILL в бою',
    rewardMedals: 45,
    accent: '#fef08a',
  },
  {
    id: 'secret_finder',
    title: 'Ключ от Тайной Кладовки',
    description: 'Найти и вскрыть секретный тайник Завхоза на любой карте',
    rewardMedals: 25,
    accent: '#38bdf8',
  },
  {
    id: 'parry_master',
    title: 'Мастер Контратаки',
    description: 'Парировать 5 вражеских снарядов выстрелами в воздухе',
    rewardMedals: 30,
    accent: '#c084fc',
  },
  {
    id: 'architect',
    title: 'Главный Инженер',
    description: 'Построить 15 парт-баррикад или глобус-турелей за карьеру',
    rewardMedals: 25,
    accent: '#fb923c',
  },
  {
    id: 'exterminator',
    title: 'Санитар Карантина',
    description: 'Обезвредить 100 зомби-учителей за карьеру',
    rewardMedals: 40,
    accent: '#a3e635',
  },
  {
    id: 'untouchable',
    title: 'Без Единой Царапины',
    description: 'Завершить урок, не получив урона по здоровью',
    rewardMedals: 35,
    accent: '#38bdf8',
  },
  {
    id: 'custom_style',
    title: 'Модник Школы №13',
    description: 'Открыть новый облик выжившего в Мастерской школы',
    rewardMedals: 20,
    accent: '#e879f9',
  },
];

export interface GameSettings {
  masterVolume: number; // 0..1
  musicVolume: number; // 0..1
  sfxVolume: number; // 0..1
  screenShake: boolean;
  graphicsQuality: 'high' | 'low';
  showTouchControls: boolean;
}

export interface CareerStats {
  totalRuns: number;
  victories: number;
  totalKills: number;
  totalEnemiesDefeated: number;
  bossesDefeated: number;
  totalBossesDefeated: number;
  totalWavesCompleted: number;
  totalPlayTimeSec: number;
  bestCombo: number;
  highestStyleRank: StyleRankId;
  secretRoomsFound: number;
  barricadesBuilt: number;
  projectilesParried: number;
}

export interface SaveProfile {
  version: number;
  bestScore: number;
  medals: number;
  equippedSkin: CharacterSkinId;
  unlockedSkins: CharacterSkinId[];
  metaUpgrades: Record<MetaUpgradeId, number>;
  achievements: AchievementId[];
  unlockedAchievements: AchievementId[];
  tutorialCompleted: boolean;
  stats: CareerStats;
  settings: GameSettings;
}

export function createDefaultSaveProfile(): SaveProfile {
  return {
    version: CURRENT_SAVE_VERSION,
    bestScore: 0,
    medals: 50,
    equippedSkin: 'default',
    unlockedSkins: ['default'],
    metaUpgrades: {
      vitality: 0,
      shield_battery: 0,
      starting_scrap: 0,
      rapid_mechanism: 0,
    },
    achievements: [],
    unlockedAchievements: [],
    tutorialCompleted: false,
    stats: {
      totalRuns: 0,
      victories: 0,
      totalKills: 0,
      totalEnemiesDefeated: 0,
      bossesDefeated: 0,
      totalBossesDefeated: 0,
      totalWavesCompleted: 0,
      totalPlayTimeSec: 0,
      bestCombo: 1,
      highestStyleRank: 'D',
      secretRoomsFound: 0,
      barricadesBuilt: 0,
      projectilesParried: 0,
    },
    settings: {
      masterVolume: 0.85,
      musicVolume: 0.7,
      sfxVolume: 0.9,
      screenShake: true,
      graphicsQuality: 'high',
      showTouchControls: false,
    },
  };
}

export function validateAndMigrateSave(raw: unknown): SaveProfile {
  const def = createDefaultSaveProfile();
  if (!raw || typeof raw !== 'object') return def;
  const obj = raw as Record<string, unknown>;

  const validSkinIds = new Set(SKIN_SPECS.map((s) => s.id));
  const unlockedSkins: CharacterSkinId[] = Array.isArray(obj.unlockedSkins)
    ? obj.unlockedSkins.filter((s): s is CharacterSkinId =>
        typeof s === 'string' && validSkinIds.has(s as CharacterSkinId)
      )
    : ['default'];
  if (!unlockedSkins.includes('default')) unlockedSkins.unshift('default');

  const rawEquipped = (obj.equippedSkin ?? obj.selectedSkin) as CharacterSkinId | undefined;
  const equippedSkin: CharacterSkinId =
    rawEquipped && validSkinIds.has(rawEquipped) && unlockedSkins.includes(rawEquipped)
      ? rawEquipped
      : 'default';

  const metaUpgrades: Record<MetaUpgradeId, number> = { ...def.metaUpgrades };
  const rawMeta = (obj.metaUpgrades ?? obj.metaLevels) as Record<string, unknown> | undefined;
  if (rawMeta && typeof rawMeta === 'object') {
    for (const spec of META_UPGRADE_SPECS) {
      const val = rawMeta[spec.id];
      if (typeof val === 'number' && Number.isFinite(val)) {
        metaUpgrades[spec.id] = Math.max(0, Math.min(spec.maxLevel, Math.floor(val)));
      }
    }
  }

  const validAchIds = new Set(ACHIEVEMENT_SPECS.map((a) => a.id));
  const rawAchList = Array.isArray(obj.unlockedAchievements)
    ? obj.unlockedAchievements
    : Array.isArray(obj.achievements)
    ? obj.achievements
    : [];
  const achievements: AchievementId[] = rawAchList.filter(
    (a): a is AchievementId => typeof a === 'string' && validAchIds.has(a as AchievementId)
  );

  const rawStats = (obj.stats ?? {}) as Record<string, unknown>;
  const totalEnemies = Math.max(
    0,
    Number(rawStats.totalEnemiesDefeated ?? rawStats.totalKills) || 0
  );
  const totalBosses = Math.max(
    0,
    Number(rawStats.totalBossesDefeated ?? rawStats.bossesDefeated) || 0
  );

  const stats: CareerStats = {
    totalRuns: Math.max(0, Number(rawStats.totalRuns) || 0),
    victories: Math.max(0, Number(rawStats.victories) || 0),
    totalKills: totalEnemies,
    totalEnemiesDefeated: totalEnemies,
    bossesDefeated: totalBosses,
    totalBossesDefeated: totalBosses,
    totalWavesCompleted: Math.max(0, Number(rawStats.totalWavesCompleted) || 0),
    totalPlayTimeSec: Math.max(0, Number(rawStats.totalPlayTimeSec) || 0),
    bestCombo: Math.max(1, Number(rawStats.bestCombo) || 1),
    highestStyleRank: (rawStats.highestStyleRank as StyleRankId) ?? 'D',
    secretRoomsFound: Math.max(0, Number(rawStats.secretRoomsFound ?? rawStats.secretsFound) || 0),
    barricadesBuilt: Math.max(0, Number(rawStats.barricadesBuilt) || 0),
    projectilesParried: Math.max(0, Number(rawStats.projectilesParried) || 0),
  };

  const rawSettings = (obj.settings ?? {}) as Record<string, unknown>;
  const normalizeVol = (val: unknown, fallback: number) => {
    if (typeof val !== 'number' || !Number.isFinite(val)) return fallback;
    if (val > 1) return Math.max(0, Math.min(1, val / 100));
    return Math.max(0, Math.min(1, val));
  };

  const settings: GameSettings = {
    masterVolume: normalizeVol(rawSettings.masterVolume, def.settings.masterVolume),
    musicVolume: normalizeVol(rawSettings.musicVolume, def.settings.musicVolume),
    sfxVolume: normalizeVol(rawSettings.sfxVolume, def.settings.sfxVolume),
    screenShake:
      typeof rawSettings.screenShake === 'boolean'
        ? rawSettings.screenShake
        : def.settings.screenShake,
    graphicsQuality: rawSettings.graphicsQuality === 'low' ? 'low' : 'high',
    showTouchControls: Boolean(rawSettings.showTouchControls),
  };

  return {
    version: CURRENT_SAVE_VERSION,
    bestScore: Math.max(0, Number(obj.bestScore) || 0),
    medals: typeof obj.medals === 'number' && Number.isFinite(obj.medals) ? Math.max(0, Math.floor(obj.medals)) : 0,
    equippedSkin,
    unlockedSkins,
    metaUpgrades,
    achievements,
    unlockedAchievements: achievements,
    tutorialCompleted: Boolean(obj.tutorialCompleted),
    stats,
    settings,
  };
}

export function loadSaveProfile(): SaveProfile {
  try {
    if (typeof window === 'undefined') return createDefaultSaveProfile();
    const rawStr = window.localStorage.getItem(SAVE_STORAGE_KEY);
    if (!rawStr) {
      const legacyBest = window.localStorage.getItem('school13_ultrakill_best_score');
      const profile = createDefaultSaveProfile();
      if (legacyBest) {
        profile.bestScore = Math.max(0, parseInt(legacyBest, 10) || 0);
      }
      return profile;
    }
    const parsed = JSON.parse(rawStr);
    return validateAndMigrateSave(parsed);
  } catch {
    return createDefaultSaveProfile();
  }
}

export function writeSaveProfile(profile: SaveProfile): void {
  try {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(SAVE_STORAGE_KEY, JSON.stringify(profile));
    window.localStorage.setItem('school13_ultrakill_best_score', String(profile.bestScore));
  } catch {
    // ignore storage quota errors
  }
}

export function getMetaUpgradeCost(
  specOrId: MetaUpgradeSpec | MetaUpgradeId,
  currentLevel: number
): number {
  const spec =
    typeof specOrId === 'string'
      ? META_UPGRADE_SPECS.find((m) => m.id === specOrId)!
      : specOrId;
  return spec.baseCost + currentLevel * spec.costStep;
}

export function purchaseMetaUpgrade(
  profile: SaveProfile,
  id: MetaUpgradeId
): { profile: SaveProfile; purchased: boolean } {
  const spec = META_UPGRADE_SPECS.find((m) => m.id === id);
  if (!spec) return { profile, purchased: false };
  const curLevel = profile.metaUpgrades[id] ?? 0;
  if (curLevel >= spec.maxLevel) return { profile, purchased: false };
  const cost = getMetaUpgradeCost(spec, curLevel);
  if (profile.medals < cost) return { profile, purchased: false };

  const next: SaveProfile = {
    ...profile,
    medals: profile.medals - cost,
    metaUpgrades: {
      ...profile.metaUpgrades,
      [id]: curLevel + 1,
    },
  };
  return { profile: next, purchased: true };
}

export function unlockSkin(
  profile: SaveProfile,
  id: CharacterSkinId
): { profile: SaveProfile; unlocked: boolean } {
  const spec = SKIN_SPECS.find((s) => s.id === id);
  if (!spec) return { profile, unlocked: false };
  if (profile.unlockedSkins.includes(id)) {
    return { profile: equipSkin(profile, id), unlocked: false };
  }
  if (profile.medals < spec.costMedals) {
    return { profile, unlocked: false };
  }
  const nextUnlocked = [...profile.unlockedSkins, id];
  const next: SaveProfile = {
    ...profile,
    medals: profile.medals - spec.costMedals,
    unlockedSkins: nextUnlocked,
    equippedSkin: id,
  };
  return { profile: next, unlocked: true };
}

export function equipSkin(profile: SaveProfile, id: CharacterSkinId): SaveProfile {
  if (!profile.unlockedSkins.includes(id)) return profile;
  return {
    ...profile,
    equippedSkin: id,
  };
}
