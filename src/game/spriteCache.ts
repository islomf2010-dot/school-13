import { TeacherArchetypeId } from './rules';

export type SpriteAssetKey =
  | 'player_torso'
  | 'skin_cyber_punk'
  | 'skin_shadow_shinobi'
  | 'skin_bio_chemist'
  | 'skin_golden_graduate'
  | 'school_crest'
  | 'supply_crate'
  | 'obs_locker'
  | 'obs_desk_cluster'
  | 'obs_lab_table'
  | 'obs_teacher_desk'
  | 'obs_chalk_pillar'
  | 'struct_barricade'
  | 'struct_turret'
  | 'secret_stash'
  | 'prop_extinguisher'
  | 'prop_chem_barrel'
  | 'bonus_medkit'
  | 'bonus_shield'
  | 'bonus_overdrive'
  | 'bonus_freeze'
  | 'bonus_ammo'
  | 'bonus_speed'
  | 'floor_corridor'
  | 'floor_parquet'
  | 'floor_gym'
  | 'floor_lab'
  | 'floor_library'
  | 'floor_basement'
  | TeacherArchetypeId;

const ASSET_PATHS: Record<SpriteAssetKey, string> = {
  player_torso: '/assets/characters/player/survivor_torso.png',
  skin_cyber_punk: '/assets/characters/player/skin_cyber_punk.png',
  skin_shadow_shinobi: '/assets/characters/player/skin_shadow_shinobi.png',
  skin_bio_chemist: '/assets/characters/player/skin_bio_chemist.png',
  skin_golden_graduate: '/assets/characters/player/skin_golden_graduate.png',
  school_crest: '/assets/environment/school_crest.png',
  supply_crate: '/assets/environment/supply_crate.png',
  obs_locker: '/assets/environment/obs_locker.png',
  obs_desk_cluster: '/assets/environment/obs_desk_cluster.png',
  obs_lab_table: '/assets/environment/obs_lab_table.png',
  obs_teacher_desk: '/assets/environment/obs_teacher_desk.png',
  obs_chalk_pillar: '/assets/environment/obs_chalk_pillar.png',
  struct_barricade: '/assets/environment/struct_barricade.png',
  struct_turret: '/assets/environment/struct_turret.png',
  secret_stash: '/assets/environment/secret_stash.png',
  prop_extinguisher: '/assets/environment/prop_extinguisher.png',
  prop_chem_barrel: '/assets/environment/prop_chem_barrel.png',
  bonus_medkit: '/assets/pickups/bonus_medkit.png',
  bonus_shield: '/assets/pickups/bonus_shield.png',
  bonus_overdrive: '/assets/pickups/bonus_overdrive.png',
  bonus_freeze: '/assets/pickups/bonus_freeze.png',
  bonus_ammo: '/assets/pickups/bonus_ammo.png',
  bonus_speed: '/assets/pickups/bonus_speed.png',
  floor_corridor: '/assets/floors/floor_corridor.png',
  floor_parquet: '/assets/floors/floor_parquet.png',
  floor_gym: '/assets/floors/floor_gym.png',
  floor_lab: '/assets/floors/floor_lab.png',
  floor_library: '/assets/floors/floor_library.png',
  floor_basement: '/assets/floors/floor_basement.png',
  literature_chaser: '/assets/characters/enemies/literature_chaser.png',
  math_sniper: '/assets/characters/enemies/math_sniper.png',
  pe_charger: '/assets/characters/enemies/pe_charger.png',
  chem_lobber: '/assets/characters/enemies/chem_lobber.png',
  history_shield: '/assets/characters/enemies/history_shield.png',
  vice_principal_boss: '/assets/characters/bosses/vice_principal_boss.png',
  pe_boss: '/assets/characters/bosses/pe_boss.png',
  lab_experiment_boss: '/assets/characters/bosses/lab_experiment_boss.png',
  principal_boss: '/assets/characters/bosses/principal_boss.png',
};

interface CachedSpriteEntry {
  status: 'loading' | 'ready' | 'error';
  source: CanvasImageSource | null;
  hitSource: CanvasImageSource | null;
  frozenSource: CanvasImageSource | null;
  width: number;
  height: number;
}

const spriteRegistry = new Map<SpriteAssetKey, CachedSpriteEntry>();
let preloadInitialized = false;

function createTintedCanvas(
  img: HTMLImageElement | HTMLCanvasElement,
  w: number,
  h: number,
  tintColor: string
): HTMLCanvasElement | null {
  if (typeof document === 'undefined') return null;
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const ctx = c.getContext('2d');
  if (!ctx) return null;
  ctx.drawImage(img, 0, 0, w, h);
  ctx.globalCompositeOperation = 'source-atop';
  ctx.fillStyle = tintColor;
  ctx.fillRect(0, 0, w, h);
  ctx.globalCompositeOperation = 'source-over';
  return c;
}

/**
 * Initializes asynchronous local PNG sprite loading and caches offscreen Canvas surfaces
 * (including hit-flash and cryo-freeze tinted variants) for zero-overhead 60fps drawing.
 * Safely no-ops in non-browser environments (such as node:test unit tests).
 */
export function ensureSpritesPreloaded(): void {
  if (preloadInitialized || typeof window === 'undefined' || typeof Image === 'undefined') {
    return;
  }
  preloadInitialized = true;

  (Object.keys(ASSET_PATHS) as SpriteAssetKey[]).forEach((key) => {
    const url = ASSET_PATHS[key];
    const defaultSize = key.startsWith('floor_')
      ? 512
      : key.endsWith('_boss')
      ? 288
      : key.startsWith('bonus_')
      ? 128
      : 256;

    const entry: CachedSpriteEntry = {
      status: 'loading',
      source: null,
      hitSource: null,
      frozenSource: null,
      width: defaultSize,
      height: defaultSize,
    };
    spriteRegistry.set(key, entry);

    const img = new Image();
    img.decoding = 'async';
    img.onload = () => {
      try {
        const w = img.naturalWidth || defaultSize;
        const h = img.naturalHeight || defaultSize;
        entry.width = w;
        entry.height = h;

        if (typeof document !== 'undefined') {
          const offscreen = document.createElement('canvas');
          offscreen.width = w;
          offscreen.height = h;
          const octx = offscreen.getContext('2d');
          if (octx) {
            octx.drawImage(img, 0, 0, w, h);
            entry.source = offscreen;
            if (!key.startsWith('floor_') && !key.startsWith('bonus_')) {
              entry.hitSource = createTintedCanvas(offscreen, w, h, 'rgba(255, 250, 225, 0.78)');
              entry.frozenSource = createTintedCanvas(offscreen, w, h, 'rgba(56, 189, 248, 0.58)');
            }
            entry.status = 'ready';
            return;
          }
        }
        entry.source = img;
        entry.status = 'ready';
      } catch {
        entry.source = img;
        entry.status = 'ready';
      }
    };
    img.onerror = () => {
      entry.status = 'error';
    };
    img.src = url;
  });
}

/**
 * Retrieves a pre-rasterized sprite image (or its hit-flash / cryo-frozen variant) if loaded and ready.
 */
export function getCachedSprite(
  key: SpriteAssetKey,
  variant: 'normal' | 'hit' | 'frozen' = 'normal'
): CanvasImageSource | null {
  ensureSpritesPreloaded();
  const entry = spriteRegistry.get(key);
  if (entry && entry.status === 'ready' && entry.source) {
    if (variant === 'hit' && entry.hitSource) return entry.hitSource;
    if (variant === 'frozen' && entry.frozenSource) return entry.frozenSource;
    return entry.source;
  }
  return null;
}

export function getSpriteAssetManifest(): Record<SpriteAssetKey, string> {
  return { ...ASSET_PATHS };
}
