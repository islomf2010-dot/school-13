import {
  AcidHazard,
  ARENA_HEIGHT,
  ARENA_WIDTH,
  BarricadeEntity,
  BonusDrop,
  ExplosiveProp,
  getObstaclesForMap,
  isBossArchetype,
  ObstacleRect,
  PlayerState,
  SCHOOL_MAPS,
  SchoolEventId,
  SchoolMapId,
  SecretStashEntity,
  SKIN_SPECS,
  TEACHER_SPECS,
  TelegraphZone,
  ULTIMATE_RADIUS,
  WEAPON_SPECS,
  ZombieTeacher,
} from './types';
import { ensureSpritesPreloaded, getCachedSprite } from './spriteCache';
import { computeEnemyAnimPose, computePlayerAnimPose } from './animationSystem';

export interface ProjectileEntity {
  active: boolean;
  x: number;
  y: number;
  prevX: number;
  prevY: number;
  vx: number;
  vy: number;
  angle: number;
  spin: number;
  radius: number;
  damage: number;
  color: string;
  traveled: number;
  maxRange: number;
  pierce: number;
  aoeRadius: number;
  knockback: number;
  fromPlayer: boolean;
  isHeavy: boolean;
  weaponKind: string;
  hitIds: number[];
  stasisLaunchDist?: number;
  wasTimeStopped?: boolean;
}

export interface PooledParticle {
  active: boolean;
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  life: number;
  maxLife: number;
  shape: 'circle' | 'spark' | 'shell' | 'paper' | 'ring' | 'lightning' | 'katana_slash';
  angle: number;
  vRot: number;
  targetX?: number;
  targetY?: number;
}

export interface FloorDecal {
  active: boolean;
  x: number;
  y: number;
  radius: number;
  kind: 'slime' | 'scorch' | 'chalk';
  color: string;
  alpha: number;
  angle: number;
}

export interface FloatingPopup {
  active: boolean;
  x: number;
  y: number;
  vy: number;
  text: string;
  color: string;
  life: number;
  maxLife: number;
  scale?: number;
}

export interface DashAfterimage {
  active: boolean;
  x: number;
  y: number;
  angle: number;
  alpha: number;
  color: string;
  kind?: 'dash' | 'sandevistan' | 'ninja_clone';
}

export const MAX_PARTICLES = 420;
export const MAX_DECALS = 110;
export const MAX_POPUPS = 64;
export const MAX_PROJECTILES = 420;
export const MAX_AFTERIMAGES = 64;

// Deterministic scattered notebook sheets, broken rulers & books on the floor
const FLOOR_PAPERS = [
  { x: 780, y: 520, angle: 0.35, grade: '2!', kind: 'exam' },
  { x: 1020, y: 670, angle: -0.42, grade: '5+', kind: 'exam' },
  { x: 860, y: 740, angle: 0.18, grade: 'F', kind: 'exam' },
  { x: 960, y: 470, angle: -0.25, grade: '2!', kind: 'exam' },
  { x: 610, y: 490, angle: 0.6, grade: '', kind: 'book' },
  { x: 1180, y: 510, angle: -0.55, grade: '3-', kind: 'exam' },
  { x: 640, y: 710, angle: 0.22, grade: '', kind: 'ruler' },
  { x: 1140, y: 690, angle: -0.3, grade: '2!', kind: 'exam' },
  { x: 350, y: 560, angle: 0.4, grade: '', kind: 'book' },
  { x: 1450, y: 620, angle: -0.35, grade: '2!', kind: 'exam' },
  { x: 520, y: 260, angle: -0.2, grade: '2!', kind: 'exam' },
  { x: 1290, y: 270, angle: 0.48, grade: '', kind: 'ruler' },
  { x: 530, y: 920, angle: 0.31, grade: '', kind: 'book' },
  { x: 1310, y: 910, angle: -0.44, grade: '2!', kind: 'exam' },
];

const FLOOR_CRACKS = [
  { x: 830, y: 560, angle: 0.4, len: 38 },
  { x: 970, y: 640, angle: -0.7, len: 44 },
  { x: 720, y: 630, angle: 1.1, len: 32 },
  { x: 1080, y: 550, angle: -0.3, len: 40 },
  { x: 890, y: 390, angle: 0.8, len: 36 },
  { x: 910, y: 820, angle: -0.5, len: 42 },
];

export function createParticlePool(): PooledParticle[] {
  return Array.from({ length: MAX_PARTICLES }, () => ({
    active: false,
    x: 0,
    y: 0,
    vx: 0,
    vy: 0,
    size: 3,
    color: '#ffffff',
    life: 0,
    maxLife: 0.4,
    shape: 'circle',
    angle: 0,
    vRot: 0,
  }));
}

export function createDecalPool(): FloorDecal[] {
  return Array.from({ length: MAX_DECALS }, () => ({
    active: false,
    x: 0,
    y: 0,
    radius: 16,
    kind: 'slime',
    color: '#84cc16',
    alpha: 0.5,
    angle: 0,
  }));
}

export function createPopupPool(): FloatingPopup[] {
  return Array.from({ length: MAX_POPUPS }, () => ({
    active: false,
    x: 0,
    y: 0,
    vy: -40,
    text: '',
    color: '#fef3c7',
    life: 0,
    maxLife: 0.7,
    scale: 1,
  }));
}

export function createProjectilePool(): ProjectileEntity[] {
  return Array.from({ length: MAX_PROJECTILES }, () => ({
    active: false,
    x: 0,
    y: 0,
    prevX: 0,
    prevY: 0,
    vx: 0,
    vy: 0,
    angle: 0,
    spin: 0,
    radius: 5,
    damage: 10,
    color: '#f59e0b',
    traveled: 0,
    maxRange: 500,
    pierce: 1,
    aoeRadius: 0,
    knockback: 100,
    fromPlayer: true,
    isHeavy: false,
    weaponKind: 'slingshot',
    hitIds: [],
    stasisLaunchDist: 0,
    wasTimeStopped: false,
  }));
}

export function createAfterimagePool(): DashAfterimage[] {
  return Array.from({ length: MAX_AFTERIMAGES }, () => ({
    active: false,
    x: 0,
    y: 0,
    angle: 0,
    alpha: 0,
    color: '#38bdf8',
  }));
}

export interface RenderSceneState {
  player: PlayerState;
  teachers: ZombieTeacher[];
  projectiles: ProjectileEntity[];
  barricades: BarricadeEntity[];
  explosives: ExplosiveProp[];
  bonuses: BonusDrop[];
  hazards: AcidHazard[];
  telegraphs: TelegraphZone[];
  particles: PooledParticle[];
  decals: FloorDecal[];
  popups: FloatingPopup[];
  afterimages?: DashAfterimage[];
  mapId?: SchoolMapId;
  secretStash?: SecretStashEntity;
  activeEvent?: SchoolEventId | null;
  evacZone?: { x: number; y: number; radius: number; progress: number } | null;
  cameraX: number;
  cameraY: number;
  shakeOffsetX: number;
  shakeOffsetY: number;
  mouseWorldX: number;
  mouseWorldY: number;
  globalFreezeTimer: number;
  isTitleMode: boolean;
  elapsedTime: number;
  graphicsQuality?: 'high' | 'low';
}

export function renderSchoolArena(
  ctx: CanvasRenderingContext2D,
  viewW: number,
  viewH: number,
  scene: RenderSceneState
): void {
  ensureSpritesPreloaded();
  ctx.save();
  ctx.fillStyle = '#09100d';
  ctx.fillRect(0, 0, viewW, viewH);

  // Smooth Cinematic Camera Zoom onto the Character during Ultimate Animation!
  const ultZoom =
    !scene.isTitleMode && scene.player.ninjaSlashTimer > 0
      ? 1 + 0.28 * Math.sin(Math.min(1, scene.player.ninjaSlashTimer / 1.65) * Math.PI)
      : !scene.isTitleMode && scene.player.shockwaveVisualTimer > 0
      ? 1 + 0.22 * Math.sin(Math.min(1, scene.player.shockwaveVisualTimer / 1.1) * Math.PI)
      : !scene.isTitleMode && scene.player.sandevistanTimer > 5.55
      ? 1 + 0.25 * Math.sin(Math.min(1, (6.5 - scene.player.sandevistanTimer) / 0.95) * Math.PI)
      : 1;
  if (ultZoom !== 1) {
    ctx.translate(viewW / 2, viewH / 2);
    ctx.scale(ultZoom, ultZoom);
    ctx.translate(-viewW / 2, -viewH / 2);
  }

  const camLeft = scene.cameraX - viewW / 2 + scene.shakeOffsetX;
  const camTop = scene.cameraY - viewH / 2 + scene.shakeOffsetY;

  ctx.translate(-camLeft, -camTop);

  const activeMapId: SchoolMapId = scene.mapId ?? 'corridor';
  const lowQuality = scene.graphicsQuality === 'low';

  // 1. Mega-Detailed School Floor Tiles, Parquet Planks, Rugs, Cracks & Scattered Exam Papers
  drawSchoolFloor(
    ctx,
    camLeft,
    camTop,
    viewW,
    viewH,
    scene.elapsedTime,
    activeMapId,
    lowQuality
  );

  // 1b. Secret Room / Stash & Evacuation Drill Zone on Floor
  if (scene.secretStash) {
    drawSecretStash(ctx, scene.secretStash, scene.elapsedTime);
  }
  if (scene.evacZone) {
    drawEvacZone(ctx, scene.evacZone, scene.elapsedTime);
  }

  // 2. Persistent Battle Floor Decals (Scorch craters, zombie slime, chalk splatters)
  for (const dec of scene.decals) {
    if (!dec.active) continue;
    ctx.save();
    ctx.translate(dec.x, dec.y);
    ctx.rotate(dec.angle);
    ctx.globalAlpha = dec.alpha;
    if (dec.kind === 'scorch') {
      // Multi-ring blast crater with radiating soot streaks
      ctx.fillStyle = '#050807';
      ctx.beginPath();
      ctx.arc(0, 0, dec.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = 'rgba(245, 158, 11, 0.38)';
      ctx.lineWidth = 2.5;
      ctx.stroke();
      for (let i = 0; i < 6; i++) {
        const a = (i * Math.PI) / 3;
        ctx.beginPath();
        ctx.moveTo(Math.cos(a) * (dec.radius * 0.6), Math.sin(a) * (dec.radius * 0.6));
        ctx.lineTo(Math.cos(a) * (dec.radius * 1.35), Math.sin(a) * (dec.radius * 1.35));
        ctx.stroke();
      }
    } else {
      ctx.fillStyle = dec.color;
      ctx.beginPath();
      ctx.ellipse(0, 0, dec.radius, dec.radius * 0.68, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(dec.radius * 0.68, dec.radius * 0.28, dec.radius * 0.34, 0, Math.PI * 2);
      ctx.arc(-dec.radius * 0.55, -dec.radius * 0.35, dec.radius * 0.24, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  // 3. Wall Chalkboards, Vending Machine, Trophy Case, Clock & Emergency Beacons
  drawPerimeterWalls(ctx, scene.elapsedTime);

  // 4. Directional Flashlight Cone & Laser Sight Line from Player
  if (!scene.isTitleMode) {
    drawPlayerFlashlightCone(ctx, scene.player, scene.elapsedTime);
  }

  // 5. Persistent Acid Hazards on Floor with Animated Rising Bubbles & Toxic Ripples
  for (const hz of scene.hazards) {
    const pulse = 0.9 + 0.1 * Math.sin(scene.elapsedTime * 8 + hz.id);
    ctx.save();
    ctx.fillStyle = hz.fromPlayer ? 'rgba(74, 222, 128, 0.38)' : 'rgba(163, 230, 53, 0.44)';
    ctx.strokeStyle = hz.fromPlayer ? '#4ade80' : '#bef264';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(hz.x, hz.y, hz.radius * pulse, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Inner toxic swirl ring
    ctx.strokeStyle = 'rgba(236, 252, 203, 0.45)';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([8, 6]);
    ctx.beginPath();
    ctx.arc(hz.x, hz.y, hz.radius * 0.62 * pulse, scene.elapsedTime * 2, scene.elapsedTime * 2 + Math.PI * 1.6);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = '#ecfccb';
    for (let i = 0; i < 6; i++) {
      const bx = hz.x + Math.cos(scene.elapsedTime * 2.6 + i * 1.1) * (hz.radius * 0.56);
      const by = hz.y + Math.sin(scene.elapsedTime * 3.1 + i * 1.7) * (hz.radius * 0.56);
      const bRad = 2.5 + 1.8 * Math.abs(Math.sin(scene.elapsedTime * 5 + i));
      ctx.beginPath();
      ctx.arc(bx, by, bRad, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  // 6. Enemy Attack Windup Telegraphs
  for (const tg of scene.telegraphs) {
    const progress = Math.min(1, tg.elapsed / Math.max(0.01, tg.duration));
    ctx.save();
    if (tg.kind === 'circle') {
      ctx.fillStyle = `rgba(239, 68, 68, ${0.15 + progress * 0.28})`;
      ctx.strokeStyle = '#fca5a5';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(tg.targetX, tg.targetY, tg.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(tg.targetX, tg.targetY, Math.max(4, tg.radius * progress), 0, Math.PI * 2);
      ctx.stroke();
    } else {
      ctx.strokeStyle = `rgba(251, 113, 133, ${0.55 + progress * 0.45})`;
      ctx.lineWidth = 2.5 + progress * 3;
      ctx.setLineDash([12, 6]);
      ctx.beginPath();
      ctx.moveTo(tg.x, tg.y);
      ctx.lineTo(tg.targetX, tg.targetY);
      ctx.stroke();
    }
    ctx.restore();
  }

  // 7. School Obstacles (Detailed Lockers, Desks, Lab Benches, Columns for Active Map)
  const mapObstacles = getObstaclesForMap(activeMapId);
  for (const obs of mapObstacles) {
    drawSchoolObstacle(ctx, obs, scene.elapsedTime);
  }

  // 8. Explosive Fire Extinguishers & Chemical Barrels
  for (const ep of scene.explosives) {
    drawExplosiveProp(ctx, ep, scene.elapsedTime);
  }

  // 9. Dropped Bonuses / Power-Ups
  for (const b of scene.bonuses) {
    drawBonusDrop(ctx, b, scene.elapsedTime);
  }

  // 10. Player-Built Defensive Barricades & Globe Auto-Turrets
  for (const st of scene.barricades) {
    drawDefensiveStructure(ctx, st, scene.elapsedTime);
  }

  // 11. Dash, Cyberpunk Sandevistan Chromatic Trail & Shadow Ninja Clone Afterimages
  if (scene.afterimages) {
    // Draw connecting neural plasma streams (Sandevistan) and dimensional katana threads (Shadow Ninja)
    let prevSande: Afterimage | null = null;
    let prevNinja: Afterimage | null = null;
    for (const img of scene.afterimages) {
      if (!img.active) continue;
      if (img.kind === 'sandevistan') {
        if (prevSande && Math.hypot(img.x - prevSande.x, img.y - prevSande.y) < 160) {
          ctx.save();
          ctx.globalAlpha = Math.min(img.alpha, prevSande.alpha) * 0.65;
          ctx.strokeStyle = img.color;
          ctx.lineWidth = 3.5;
          ctx.beginPath();
          ctx.moveTo(prevSande.x, prevSande.y);
          ctx.lineTo(img.x, img.y);
          ctx.stroke();
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 1.2;
          ctx.stroke();
          ctx.restore();
        }
        prevSande = img;
      } else if (img.kind === 'ninja_clone') {
        if (prevNinja) {
          ctx.save();
          ctx.globalAlpha = Math.min(img.alpha, prevNinja.alpha) * 0.85;
          ctx.strokeStyle = '#f43f5e';
          ctx.lineWidth = 6;
          ctx.beginPath();
          ctx.moveTo(prevNinja.x, prevNinja.y);
          ctx.lineTo(img.x, img.y);
          ctx.stroke();
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 2;
          ctx.stroke();
          ctx.restore();
        }
        prevNinja = img;
      }
    }

    for (const img of scene.afterimages) {
      if (!img.active) continue;
      ctx.save();
      ctx.translate(img.x, img.y);
      ctx.rotate(img.angle);

      if (img.kind === 'sandevistan') {
        // Full Cyberpunk Edgerunners Chromatic Hologram Silhouette Pose (Spine + Backpack + Torso + Head + Bandana + Weapon)
        ctx.globalAlpha = Math.min(0.88, img.alpha * 0.9);

        // Outer neon chromatic aura
        const sandGrad = ctx.createRadialGradient(0, 0, 2, 0, 0, 28);
        sandGrad.addColorStop(0, `${img.color}88`);
        sandGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = sandGrad;
        ctx.beginPath();
        ctx.arc(0, 0, 28, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = img.color;
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.5;

        // Flowing headband tails in motion
        ctx.beginPath();
        ctx.moveTo(-14, -4);
        ctx.lineTo(-34, -11);
        ctx.moveTo(-14, 4);
        ctx.lineTo(-34, 11);
        ctx.stroke();

        // Backpack silhouette + glowing spine vertebrae
        ctx.beginPath();
        ctx.roundRect(-24, -11, 12, 22, 3);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        for (let vy = -7; vy <= 7; vy += 3.5) {
          ctx.fillRect(-20, vy - 1, 4, 2);
        }

        // Torso & shoulders silhouette
        ctx.fillStyle = img.color;
        ctx.beginPath();
        ctx.ellipse(-1, 0, 15, 19, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Extended weapon arm silhouette
        ctx.fillRect(4, -9, 24, 6);
        ctx.fillRect(4, 3, 24, 6);

        // Head silhouette
        ctx.beginPath();
        ctx.arc(2, 0, 13, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      } else if (img.kind === 'ninja_clone') {
        // Epic Shadow Shinobi Assassin Clone behind enemy back with Cursed Katana & Crescent Blood Moon Wave!
        ctx.globalAlpha = Math.min(0.96, img.alpha * 0.98);

        // 1. Dark Shadow Smoke Pool beneath Clone
        const smokeGrad = ctx.createRadialGradient(0, 0, 4, 0, 0, 36);
        smokeGrad.addColorStop(0, 'rgba(225, 29, 72, 0.55)');
        smokeGrad.addColorStop(0.55, 'rgba(9, 13, 22, 0.75)');
        smokeGrad.addColorStop(1, 'rgba(9, 13, 22, 0)');
        ctx.fillStyle = smokeGrad;
        ctx.beginPath();
        ctx.arc(0, 0, 36, 0, Math.PI * 2);
        ctx.fill();

        // 2. Billowing Crimson Shinobi Scarf Tails
        ctx.strokeStyle = '#e11d48';
        ctx.lineWidth = 5;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(-10, -5);
        ctx.quadraticCurveTo(-26, -16, -42, -12);
        ctx.moveTo(-10, 5);
        ctx.quadraticCurveTo(-26, 16, -40, 14);
        ctx.stroke();

        // 3. Armored Shadow Shinobi Torso & Shoulders
        ctx.fillStyle = '#090d16';
        ctx.strokeStyle = img.color;
        ctx.lineWidth = 2.4;
        ctx.beginPath();
        ctx.ellipse(-1, 0, 15.5, 19.5, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Diagonal Shinobi Chest Sash
        ctx.strokeStyle = '#be123c';
        ctx.lineWidth = 3.5;
        ctx.beginPath();
        ctx.moveTo(-9, -13);
        ctx.lineTo(8, 13);
        ctx.stroke();

        // 4. Shinobi Hooded Head & Spiky Hair Locks
        ctx.fillStyle = '#090d16';
        ctx.strokeStyle = '#f43f5e';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(2, 0, 13, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Glowing Demon / Sharingan Eyes with Flare Trail
        ctx.fillStyle = '#fef08a';
        ctx.beginPath();
        ctx.arc(8.5, -4.5, 2.8, 0, Math.PI * 2);
        ctx.arc(8.5, 4.5, 2.8, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#f43f5e';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(2, -4.5);
        ctx.lineTo(17, -4.5);
        ctx.moveTo(2, 4.5);
        ctx.lineTo(17, 4.5);
        ctx.stroke();

        // 5. Giant Sweeping Blood-Moon Crescent Blade Wave in front of Clone
        ctx.save();
        // Outer crimson crescent arc
        ctx.strokeStyle = 'rgba(244, 63, 94, 0.88)';
        ctx.lineWidth = 14;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.arc(10, 0, 38, -Math.PI * 0.58, Math.PI * 0.48);
        ctx.stroke();

        // Inner neon rose/cyan crescent edge
        ctx.strokeStyle = '#fda4af';
        ctx.lineWidth = 6.5;
        ctx.beginPath();
        ctx.arc(11, 0, 39, -Math.PI * 0.54, Math.PI * 0.44);
        ctx.stroke();

        // Razor-sharp white cutting arc
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2.6;
        ctx.beginPath();
        ctx.arc(12, 0, 40, -Math.PI * 0.5, Math.PI * 0.4);
        ctx.stroke();

        // 6. Detailed Cursed Katana Blade & Golden Dragon Tsuba in Hand
        // Tsuka (handle)
        ctx.strokeStyle = '#be123c';
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.moveTo(0, 14);
        ctx.lineTo(10, 6);
        ctx.stroke();

        // Golden Tsuba (handguard)
        ctx.fillStyle = '#facc15';
        ctx.strokeStyle = '#090d16';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(11, 5, 4.8, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Curved Cursed Katana Blade
        ctx.strokeStyle = '#f43f5e';
        ctx.lineWidth = 7;
        ctx.beginPath();
        ctx.moveTo(11, 5);
        ctx.quadraticCurveTo(32, -8, 56, -30);
        ctx.stroke();

        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(11, 5);
        ctx.quadraticCurveTo(32, -8, 56, -30);
        ctx.stroke();
        ctx.restore();
      } else {
        ctx.globalAlpha = img.alpha * 0.55;
        ctx.fillStyle = img.color;
        ctx.beginPath();
        ctx.arc(0, 0, 17, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }
  }

  // 12. Articulated Zombie Teachers with Striding Feet & Unique Animated Props
  for (const t of scene.teachers) {
    drawZombieTeacher(
      ctx,
      t,
      scene.elapsedTime,
      scene.globalFreezeTimer > 0 || scene.player.sandevistanTimer > 0
    );
  }

  // 13. Articulated Player Character + Flowing Headband + Sonic Bell Shockwave
  if (!scene.isTitleMode) {
    drawPlayerSurvivor(ctx, scene.player, scene.elapsedTime);
    drawOffscreenThreatIndicators(ctx, scene.player, scene.teachers, viewW, viewH, scene.cameraX, scene.cameraY);
  }

  // 14. Custom Weapon Projectiles with Motion Tracer Trails, Stasis Locks & Electric Lightning Arcs
  const isTimeStopped = scene.player.sandevistanTimer > 0;
  for (const p of scene.projectiles) {
    if (!p.active) continue;
    drawProjectileWithTrail(ctx, p, scene.elapsedTime, isTimeStopped);
  }

  // 15. Pooled Particles (Sparks, Brass Shells, Flying Exam Papers, Expanding Shockwave Rings, Lightning, Katana Slashes)
  for (const pt of scene.particles) {
    if (!pt.active) continue;
    const progress = 1 - pt.life / pt.maxLife;
    const alpha = Math.max(0, pt.life / pt.maxLife);
    ctx.save();
    ctx.globalAlpha = alpha;

    if (pt.shape === 'ring') {
      const currentRadius = pt.size * (0.25 + progress * 0.95);
      ctx.strokeStyle = pt.color;
      ctx.lineWidth = Math.max(1.5, 6 * alpha);
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, currentRadius, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
      continue;
    }

    if (pt.shape === 'katana_slash') {
      // Epic Curved Dimensional Anime X-Slash & Crescent Blade Wave over executed target!
      ctx.translate(pt.x, pt.y);
      ctx.rotate(pt.angle);
      const len = pt.size * (0.85 + progress * 0.72);

      // 1. Crimson / Cyan Dimensional Rift Halo
      const slashHalo = ctx.createRadialGradient(0, 0, 2, 0, 0, len * 0.95);
      slashHalo.addColorStop(0, '#ffffff');
      slashHalo.addColorStop(0.35, `${pt.color}99`);
      slashHalo.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = slashHalo;
      ctx.beginPath();
      ctx.arc(0, 0, len * 0.95, 0, Math.PI * 2);
      ctx.fill();

      // 2. Sweeping Outer Crescent Energy Wave
      ctx.strokeStyle = pt.color;
      ctx.lineWidth = (11 * alpha + 3);
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(-len * 1.15, -len * 0.48);
      ctx.quadraticCurveTo(0, -len * 0.16, len * 1.15, len * 0.48);
      ctx.moveTo(-len * 0.95, len * 0.62);
      ctx.quadraticCurveTo(0, len * 0.14, len * 0.95, -len * 0.62);
      ctx.stroke();

      // 3. Secondary Neon Rose / Cyan Edge Glow
      ctx.strokeStyle = pt.color === '#38bdf8' ? '#a5f3fc' : '#fda4af';
      ctx.lineWidth = (5.5 * alpha + 1.5);
      ctx.beginPath();
      ctx.moveTo(-len * 1.15, -len * 0.48);
      ctx.quadraticCurveTo(0, -len * 0.16, len * 1.15, len * 0.48);
      ctx.moveTo(-len * 0.95, len * 0.62);
      ctx.quadraticCurveTo(0, len * 0.14, len * 0.95, -len * 0.62);
      ctx.stroke();

      // 4. Blinding White-Hot Razor Core
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = Math.max(1.8, 3.2 * alpha);
      ctx.beginPath();
      ctx.moveTo(-len * 1.18, -len * 0.5);
      ctx.quadraticCurveTo(0, -len * 0.16, len * 1.18, len * 0.5);
      ctx.moveTo(-len * 0.98, len * 0.64);
      ctx.quadraticCurveTo(0, len * 0.14, len * 0.98, -len * 0.64);
      ctx.stroke();

      // 5. Center Impact Starburst, 4-Point Tsuba Glint & Floating Sakura/Blood Sparks
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2.4 * alpha;
      const starArm = len * 0.42 * (1 - progress * 0.35);
      ctx.beginPath();
      ctx.moveTo(-starArm, 0);
      ctx.lineTo(starArm, 0);
      ctx.moveTo(0, -starArm);
      ctx.lineTo(0, starArm);
      ctx.stroke();

      ctx.fillStyle = '#fef08a';
      ctx.beginPath();
      ctx.arc(0, 0, 6.5 * alpha, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = pt.color;
      for (let sp = 0; sp < 6; sp++) {
        const sang = sp * (Math.PI / 3) + progress * 2.8;
        const sdist = len * 0.54 * progress;
        ctx.beginPath();
        ctx.ellipse(
          Math.cos(sang) * sdist,
          Math.sin(sang) * sdist,
          5.2 * alpha,
          2.2 * alpha,
          sang,
          0,
          Math.PI * 2
        );
        ctx.fill();
      }

      ctx.restore();
      continue;
    }

    if (pt.shape === 'lightning' && pt.targetX !== undefined && pt.targetY !== undefined) {
      drawJaggedLightning(ctx, pt.x, pt.y, pt.targetX, pt.targetY, pt.color, 3);
      ctx.restore();
      continue;
    }

    ctx.translate(pt.x, pt.y);
    if (pt.shape === 'spark') {
      ctx.rotate(Math.atan2(pt.vy, pt.vx));
      ctx.fillStyle = pt.color;
      ctx.fillRect(-pt.size * 2.1, -pt.size * 0.45, pt.size * 4.2, pt.size * 0.9);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(-pt.size * 0.9, -pt.size * 0.25, pt.size * 1.8, pt.size * 0.5);
    } else if (pt.shape === 'shell') {
      ctx.rotate(pt.angle);
      ctx.fillStyle = '#fbbf24';
      ctx.strokeStyle = '#09100d';
      ctx.lineWidth = 1.2;
      ctx.fillRect(-4, -2, 8, 4);
      ctx.strokeRect(-4, -2, 8, 4);
      ctx.fillStyle = '#fef08a';
      ctx.fillRect(-3, -1, 3, 2);
    } else if (pt.shape === 'paper') {
      ctx.rotate(pt.angle);
      ctx.fillStyle = '#f8fafc';
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 1.2;
      ctx.fillRect(-6, -8, 12, 16);
      ctx.strokeRect(-6, -8, 12, 16);
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(-2, -2, 4, 2);
    } else {
      ctx.fillStyle = pt.color;
      ctx.beginPath();
      ctx.arc(0, 0, pt.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  // 16. Floating Combat Chalk Popups with Pop Scale Animation
  ctx.textAlign = 'center';
  for (const pop of scene.popups) {
    if (!pop.active) continue;
    const lifeRatio = pop.life / pop.maxLife;
    const alpha = Math.max(0, Math.min(1, lifeRatio * 1.45));
    const popScale = (pop.scale ?? 1) * (lifeRatio > 0.8 ? 1.22 : 1.0);
    ctx.save();
    ctx.translate(pop.x, pop.y);
    ctx.scale(popScale, popScale);
    ctx.globalAlpha = alpha;
    ctx.font = "800 14px 'JetBrains Mono', monospace";
    ctx.strokeStyle = '#09100d';
    ctx.lineWidth = 4;
    ctx.strokeText(pop.text, 0, 0);
    ctx.fillStyle = pop.color;
    ctx.fillText(pop.text, 0, 0);
    ctx.restore();
  }

  // 17. Tactical Animated Crosshair with Gaze-Routed Cooldown & Rage Ring
  if (!scene.isTitleMode) {
    drawCrosshair(ctx, scene.mouseWorldX, scene.mouseWorldY, scene.player, scene.elapsedTime);
  }

  ctx.restore();

  // 18. Screen-Space Cyberpunk Sandevistan Time-Stop, Shadow Ninja & Sonic Bell Atmosphere Filter
  if (!scene.isTitleMode && scene.player.sandevistanTimer > 0) {
    ctx.save();
    const timeInStop = 6.5 - scene.player.sandevistanTimer;
    const initFlash = timeInStop < 0.35 ? (1 - timeInStop / 0.35) * 0.22 : 0;

    // Radial Cyberpunk Emerald-Cyan Peripheral Vignette
    const sandVig = ctx.createRadialGradient(
      viewW * 0.5,
      viewH * 0.5,
      viewW * 0.28,
      viewW * 0.5,
      viewH * 0.5,
      viewW * 0.75
    );
    sandVig.addColorStop(0, `rgba(0, 255, 157, ${0.03 + initFlash})`);
    sandVig.addColorStop(1, `rgba(0, 240, 255, ${0.24 + initFlash})`);
    ctx.fillStyle = sandVig;
    ctx.fillRect(0, 0, viewW, viewH);

    // Anime Radial Speed Lines around screen periphery
    ctx.strokeStyle = 'rgba(0, 255, 157, 0.28)';
    ctx.lineWidth = 2;
    const cx = viewW * 0.5;
    const cy = viewH * 0.5;
    const outerR = Math.hypot(cx, cy);
    for (let sl = 0; sl < 28; sl++) {
      const ang = (sl * Math.PI * 2) / 28 + Math.sin(scene.elapsedTime * 8 + sl) * 0.02;
      const innerR = outerR * (0.72 + (sl % 3) * 0.06);
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(ang) * innerR, cy + Math.sin(ang) * innerR);
      ctx.lineTo(cx + Math.cos(ang) * outerR, cy + Math.sin(ang) * outerR);
      ctx.stroke();
    }

    // Neon Cyberpunk peripheral border vignette & scanlines
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.65)';
    ctx.lineWidth = 6;
    ctx.strokeRect(3, 3, viewW - 6, viewH - 6);

    ctx.fillStyle = 'rgba(0, 240, 255, 0.035)';
    for (let y = 0; y < viewH; y += 8) {
      ctx.fillRect(0, y, viewW, 2);
    }
    ctx.restore();
  } else if (!scene.isTitleMode && scene.player.ninjaSlashTimer > 0) {
    // Peripheral Crimson Blood-Moon Vignette & Diagonal Anime Speed-Slash Streaks
    ctx.save();
    const slashRatio = Math.min(1, scene.player.ninjaSlashTimer / 1.65);
    const vig = ctx.createRadialGradient(
      viewW * 0.5,
      viewH * 0.5,
      viewW * 0.3,
      viewW * 0.5,
      viewH * 0.5,
      viewW * 0.76
    );
    vig.addColorStop(0, 'rgba(0, 0, 0, 0)');
    vig.addColorStop(1, `rgba(190, 18, 60, ${0.42 * slashRatio})`);
    ctx.fillStyle = vig;
    ctx.fillRect(0, 0, viewW, viewH);

    // Peripheral radial katana speed lines
    const cx = viewW * 0.5;
    const cy = viewH * 0.5;
    const outerR = Math.hypot(cx, cy);
    for (let sl = 0; sl < 24; sl++) {
      const ang = (sl * Math.PI * 2) / 24 + scene.elapsedTime * 1.5;
      const innerR = outerR * (0.7 + (sl % 2) * 0.08);
      ctx.strokeStyle = sl % 3 === 0 ? `rgba(56, 189, 248, ${0.38 * slashRatio})` : `rgba(244, 63, 94, ${0.42 * slashRatio})`;
      ctx.lineWidth = sl % 2 === 0 ? 2.5 : 1.5;
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(ang) * innerR, cy + Math.sin(ang) * innerR);
      ctx.lineTo(cx + Math.cos(ang) * outerR, cy + Math.sin(ang) * outerR);
      ctx.stroke();
    }

    ctx.strokeStyle = `rgba(244, 63, 94, ${0.75 * slashRatio})`;
    ctx.lineWidth = 5;
    ctx.strokeRect(2, 2, viewW - 4, viewH - 4);
    ctx.restore();
  } else if (!scene.isTitleMode && scene.player.shockwaveVisualTimer > 0) {
    // Screen-Space 200dB Golden & Electric Violet Acoustic Resonance Edge Pulse
    ctx.save();
    const bellRatio = Math.min(1, scene.player.shockwaveVisualTimer / 1.1);
    const vig = ctx.createRadialGradient(
      viewW * 0.5,
      viewH * 0.5,
      viewW * 0.32,
      viewW * 0.5,
      viewH * 0.5,
      viewW * 0.78
    );
    vig.addColorStop(0, 'rgba(0, 0, 0, 0)');
    vig.addColorStop(0.75, `rgba(232, 121, 249, ${0.18 * bellRatio})`);
    vig.addColorStop(1, `rgba(250, 204, 21, ${0.38 * bellRatio})`);
    ctx.fillStyle = vig;
    ctx.fillRect(0, 0, viewW, viewH);

    ctx.strokeStyle = `rgba(250, 204, 21, ${0.75 * bellRatio})`;
    ctx.lineWidth = 5;
    ctx.strokeRect(2, 2, viewW - 4, viewH - 4);
    ctx.restore();
  }

  // 19. Dynamic Random Event Atmosphere Overlay (Power Outage Spotlight / Emergency Lockdown Beacon)
  if (!scene.isTitleMode && scene.activeEvent === 'power_outage') {
    ctx.save();
    const playerScreenX = scene.player.x - camLeft;
    const playerScreenY = scene.player.y - camTop;
    const darkGrad = ctx.createRadialGradient(
      playerScreenX,
      playerScreenY,
      90,
      playerScreenX,
      playerScreenY,
      390
    );
    darkGrad.addColorStop(0, 'rgba(5, 8, 12, 0)');
    darkGrad.addColorStop(0.55, 'rgba(5, 8, 12, 0.52)');
    darkGrad.addColorStop(1, 'rgba(3, 5, 9, 0.86)');
    ctx.fillStyle = darkGrad;
    ctx.fillRect(0, 0, viewW, viewH);
    ctx.restore();
  } else if (!scene.isTitleMode && scene.activeEvent === 'emergency_lockdown') {
    ctx.save();
    const sirenPulse = 0.08 + 0.08 * Math.abs(Math.sin(scene.elapsedTime * 7));
    ctx.fillStyle = `rgba(239, 68, 68, ${sirenPulse})`;
    ctx.fillRect(0, 0, viewW, viewH);
    ctx.restore();
  }
}

function drawJaggedLightning(
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  color: string,
  width: number
): void {
  const segments = 6;
  const dx = (x2 - x1) / segments;
  const dy = (y2 - y1) / segments;
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  for (let i = 1; i < segments; i++) {
    const jitterX = (Math.random() - 0.5) * 18;
    const jitterY = (Math.random() - 0.5) * 18;
    ctx.lineTo(x1 + dx * i + jitterX, y1 + dy * i + jitterY);
  }
  ctx.lineTo(x2, y2);
  ctx.stroke();

  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = Math.max(1, width * 0.45);
  ctx.stroke();
}

function drawSecretStash(
  ctx: CanvasRenderingContext2D,
  stash: SecretStashEntity,
  elapsedTime: number
): void {
  ctx.save();
  ctx.translate(stash.x, stash.y);
  const pulse = 0.75 + 0.25 * Math.sin(elapsedTime * 6);

  // Outer discovery radar ring
  ctx.strokeStyle = stash.discovered
    ? 'rgba(74, 222, 128, 0.45)'
    : `rgba(250, 204, 21, ${0.55 * pulse})`;
  ctx.lineWidth = 2.5;
  ctx.setLineDash(stash.discovered ? [] : [8, 6]);
  ctx.beginPath();
  ctx.arc(0, 0, stash.radius + 8, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);

  // Secret Floor Hatch / Armored School Safe Sprite
  const stashSprite = getCachedSprite('secret_stash');
  if (stashSprite) {
    const sSize = stash.radius * 2.8;
    ctx.drawImage(stashSprite, -sSize * 0.5, -sSize * 0.5, sSize, sSize);
  } else {
    ctx.fillStyle = '#09100d';
    ctx.beginPath();
    ctx.roundRect(-24, -20, 48, 40, 6);
    ctx.fill();

    ctx.fillStyle = stash.discovered ? '#14532d' : '#1e293b';
    ctx.strokeStyle = stash.discovered ? '#4ade80' : '#facc15';
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.roundRect(-21, -17, 42, 34, 4);
    ctx.fill();
    ctx.stroke();
  }

  // Safe combination dial / open golden stash label
  if (!stash.discovered) {
    ctx.font = "800 10px 'JetBrains Mono', monospace";
    ctx.textAlign = 'center';
    ctx.fillStyle = '#fef08a';
    ctx.strokeStyle = '#09100d';
    ctx.lineWidth = 3;
    ctx.strokeText('СЕКРЕТНЫЙ ТАЙНИК', 0, -stash.radius - 10);
    ctx.fillText('СЕКРЕТНЫЙ ТАЙНИК', 0, -stash.radius - 10);
  } else {
    ctx.fillStyle = '#4ade80';
    ctx.strokeStyle = '#09100d';
    ctx.lineWidth = 3;
    ctx.font = "800 9px 'JetBrains Mono', monospace";
    ctx.textAlign = 'center';
    ctx.strokeText('ОТКРЫТО', 0, 3);
    ctx.fillText('ОТКРЫТО', 0, 3);
  }

  ctx.restore();
}

function drawEvacZone(
  ctx: CanvasRenderingContext2D,
  zone: { x: number; y: number; radius: number; progress: number },
  elapsedTime: number
): void {
  ctx.save();
  ctx.translate(zone.x, zone.y);
  const pulse = 0.85 + 0.15 * Math.sin(elapsedTime * 8);

  ctx.fillStyle = 'rgba(56, 189, 248, 0.14)';
  ctx.strokeStyle = '#38bdf8';
  ctx.lineWidth = 3;
  ctx.setLineDash([12, 8]);
  ctx.beginPath();
  ctx.arc(0, 0, zone.radius * pulse, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.setLineDash([]);

  // Progress arc
  ctx.strokeStyle = '#4ade80';
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.arc(0, 0, zone.radius + 6, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * Math.min(1, zone.progress));
  ctx.stroke();

  ctx.font = "800 12px 'Russo One', sans-serif";
  ctx.textAlign = 'center';
  ctx.fillStyle = '#e0f2fe';
  ctx.strokeStyle = '#09100d';
  ctx.lineWidth = 3;
  const pct = Math.round(zone.progress * 100);
  ctx.strokeText(`ТОЧКА ЭВАКУАЦИИ: ${pct}%`, 0, -zone.radius - 14);
  ctx.fillText(`ТОЧКА ЭВАКУАЦИИ: ${pct}%`, 0, -zone.radius - 14);

  ctx.restore();
}

function drawSchoolFloor(
  ctx: CanvasRenderingContext2D,
  camLeft: number,
  camTop: number,
  viewW: number,
  viewH: number,
  elapsedTime: number,
  mapId: SchoolMapId = 'corridor',
  lowQuality = false
): void {
  const mapSpec = SCHOOL_MAPS[mapId] ?? SCHOOL_MAPS.corridor;
  ctx.fillStyle = mapSpec.floorBaseColor;
  ctx.fillRect(0, 0, ARENA_WIDTH, ARENA_HEIGHT);

  const floorKeyMap: Record<SchoolMapId, 'floor_corridor' | 'floor_parquet' | 'floor_gym' | 'floor_lab' | 'floor_library' | 'floor_basement'> = {
    corridor: 'floor_corridor',
    classroom: 'floor_parquet',
    gymnasium: 'floor_gym',
    lab: 'floor_lab',
    library: 'floor_library',
    basement: 'floor_basement',
  };
  const mainFloorSprite = getCachedSprite(floorKeyMap[mapId]);
  if (mainFloorSprite) {
    const texSize = 512;
    const txStart = Math.max(0, Math.floor(camLeft / texSize) * texSize);
    const txEnd = Math.min(ARENA_WIDTH, Math.ceil((camLeft + viewW) / texSize) * texSize);
    const tyStart = Math.max(0, Math.floor(camTop / texSize) * texSize);
    const tyEnd = Math.min(ARENA_HEIGHT, Math.ceil((camTop + viewH) / texSize) * texSize);
    for (let ty = tyStart; ty < tyEnd; ty += texSize) {
      for (let tx = txStart; tx < txEnd; tx += texSize) {
        ctx.drawImage(mainFloorSprite, tx, ty, texSize, texSize);
      }
    }
  }

  // 4 Classroom / Zone wooden or laboratory zones with custom map palette & seamless parquet texture
  const zoneFloorSprite = getCachedSprite(mapId === 'lab' ? 'floor_lab' : mapId === 'basement' ? 'floor_basement' : 'floor_parquet');
  const parquetZones = [
    { x: 60, y: 80, w: 620, h: 390, rugColor: mapSpec.rugColors[0] },
    { x: 1120, y: 80, w: 620, h: 390, rugColor: mapSpec.rugColors[1] },
    { x: 60, y: 730, w: 620, h: 390, rugColor: mapSpec.rugColors[2] },
    { x: 1120, y: 730, w: 620, h: 390, rugColor: mapSpec.rugColors[3] },
  ];
  for (const z of parquetZones) {
    if (zoneFloorSprite) {
      ctx.save();
      ctx.beginPath();
      ctx.rect(z.x, z.y, z.w, z.h);
      ctx.clip();
      for (let ty = z.y; ty < z.y + z.h; ty += 512) {
        for (let tx = z.x; tx < z.x + z.w; tx += 512) {
          ctx.drawImage(zoneFloorSprite, tx, ty, 512, 512);
        }
      }
      ctx.restore();
    } else {
      ctx.fillStyle = mapSpec.parquetColor;
      ctx.fillRect(z.x, z.y, z.w, z.h);
    }

    // Classroom woven rug under desk island
    ctx.fillStyle = z.rugColor;
    ctx.globalAlpha = 0.24;
    ctx.fillRect(z.x + 280, z.y + 210, 250, 140);
    ctx.globalAlpha = 1;

    ctx.strokeStyle = mapSpec.trimColor;
    ctx.lineWidth = 4;
    ctx.strokeRect(z.x, z.y, z.w, z.h);
  }

  // Map-specific architectural floor layouts & lighting details
  if (mapId === 'gymnasium') {
    ctx.strokeStyle = 'rgba(254, 240, 138, 0.38)';
    ctx.lineWidth = 4;
    ctx.strokeRect(140, 120, ARENA_WIDTH - 280, ARENA_HEIGHT - 240);
    // Center court line & jump circle
    ctx.beginPath();
    ctx.moveTo(ARENA_WIDTH / 2, 120);
    ctx.lineTo(ARENA_WIDTH / 2, ARENA_HEIGHT - 120);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(ARENA_WIDTH / 2, ARENA_HEIGHT / 2, 155, 0, Math.PI * 2);
    ctx.stroke();
    // Left & right free-throw lanes
    ctx.strokeRect(140, 440, 240, 320);
    ctx.strokeRect(ARENA_WIDTH - 380, 440, 240, 320);
  } else if (mapId === 'lab') {
    ctx.strokeStyle = 'rgba(34, 197, 94, 0.24)';
    ctx.lineWidth = 3;
    ctx.setLineDash([18, 12]);
    ctx.strokeRect(220, 180, ARENA_WIDTH - 440, ARENA_HEIGHT - 360);
    ctx.setLineDash([]);
    // Stainless chemical floor drainage grates
    ctx.fillStyle = '#091411';
    ctx.strokeStyle = '#10b981';
    ctx.lineWidth = 1.5;
    for (const gx of [650, 900, 1150]) {
      ctx.fillRect(gx - 28, 582, 56, 36);
      ctx.strokeRect(gx - 28, 582, 56, 36);
    }
  } else if (mapId === 'library') {
    // Velvet reading aisle carpet runner & warm reading lamp light pools
    ctx.fillStyle = 'rgba(126, 34, 206, 0.22)';
    ctx.fillRect(240, 535, ARENA_WIDTH - 480, 130);
    ctx.strokeStyle = 'rgba(250, 204, 21, 0.32)';
    ctx.lineWidth = 2;
    ctx.strokeRect(240, 535, ARENA_WIDTH - 480, 130);
    for (const lx of [655, 1145]) {
      const lampPool = ctx.createRadialGradient(lx, 550, 8, lx, 550, 150);
      lampPool.addColorStop(0, 'rgba(254, 240, 138, 0.16)');
      lampPool.addColorStop(1, 'rgba(254, 240, 138, 0)');
      ctx.fillStyle = lampPool;
      ctx.beginPath();
      ctx.arc(lx, 550, 150, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (mapId === 'basement') {
    ctx.strokeStyle = 'rgba(239, 68, 68, 0.25)';
    ctx.lineWidth = 3;
    ctx.setLineDash([18, 12]);
    ctx.strokeRect(220, 180, ARENA_WIDTH - 440, ARENA_HEIGHT - 360);
    ctx.setLineDash([]);
    // Rusted boiler room floor grates
    ctx.fillStyle = '#120b0e';
    ctx.strokeStyle = '#be123c';
    ctx.lineWidth = 1.5;
    for (const gx of [760, 1040]) {
      ctx.fillRect(gx - 32, 576, 64, 48);
      ctx.strokeRect(gx - 32, 576, 64, 48);
    }
  }

  // Checkerboard tiles in visible viewport
  const tileSize = 60;
  const startX = Math.max(0, Math.floor(camLeft / tileSize) * tileSize);
  const endX = Math.min(ARENA_WIDTH, Math.ceil((camLeft + viewW) / tileSize) * tileSize);
  const startY = Math.max(0, Math.floor(camTop / tileSize) * tileSize);
  const endY = Math.min(ARENA_HEIGHT, Math.ceil((camTop + viewH) / tileSize) * tileSize);

  ctx.fillStyle = 'rgba(255, 255, 255, 0.03)';
  for (let x = startX; x < endX; x += tileSize) {
    for (let y = startY; y < endY; y += tileSize) {
      if (((x / tileSize) + (y / tileSize)) % 2 === 0) {
        ctx.fillRect(x, y, tileSize, tileSize);
      }
    }
  }

  // Floor cracks in the battle-scarred corridor
  if (!lowQuality) {
    ctx.strokeStyle = 'rgba(9, 16, 13, 0.75)';
    ctx.lineWidth = 2;
    for (const cr of FLOOR_CRACKS) {
      ctx.save();
      ctx.translate(cr.x, cr.y);
      ctx.rotate(cr.angle);
      ctx.beginPath();
      ctx.moveTo(-cr.len / 2, 0);
      ctx.lineTo(-cr.len * 0.15, 6);
      ctx.lineTo(cr.len * 0.2, -5);
      ctx.lineTo(cr.len / 2, 2);
      ctx.stroke();
      ctx.restore();
    }
  }

  // Corridor hazard quarantine stripes along central cross-walkway
  ctx.strokeStyle = 'rgba(245, 158, 11, 0.16)';
  ctx.lineWidth = 2;
  ctx.setLineDash([16, 12]);
  ctx.strokeRect(700, 80, 400, 1040);
  ctx.strokeRect(80, 480, 1640, 240);
  ctx.setLineDash([]);

  // Central School Emblem painted on the atrium floor at (900, 600) with SVG Crest + subtle pulse
  ctx.save();
  ctx.translate(ARENA_WIDTH / 2, ARENA_HEIGHT / 2);
  const crestSprite = getCachedSprite('school_crest');
  if (crestSprite) {
    ctx.drawImage(crestSprite, -120, -120, 240, 240);
  }
  const crestPulse = 0.22 + 0.05 * Math.sin(elapsedTime * 3);
  ctx.strokeStyle = `rgba(245, 158, 11, ${crestPulse})`;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(0, 0, 116, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(0, 0, 86, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = 'rgba(245, 158, 11, 0.16)';
  ctx.font = "700 22px 'Russo One', sans-serif";
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('ШКОЛА №13', 0, -8);
  ctx.font = "700 11px 'JetBrains Mono', monospace";
  ctx.fillText(mapSpec.name.toUpperCase(), 0, 16);
  ctx.restore();

  // Scattered notebook sheets, rulers & books on the floor
  if (!lowQuality) {
    for (const p of FLOOR_PAPERS) {
    if (
      p.x < camLeft - 45 ||
      p.x > camLeft + viewW + 45 ||
      p.y < camTop - 45 ||
      p.y > camTop + viewH + 45
    ) {
      continue;
    }
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(p.angle);
    if (p.kind === 'book') {
      ctx.fillStyle = '#991b1b';
      ctx.strokeStyle = '#09100d';
      ctx.lineWidth = 2;
      ctx.fillRect(-14, -11, 28, 22);
      ctx.strokeRect(-14, -11, 28, 22);
      ctx.fillStyle = '#fef3c7';
      ctx.fillRect(-11, -8, 22, 4);
    } else if (p.kind === 'ruler') {
      ctx.fillStyle = '#f59e0b';
      ctx.strokeStyle = '#09100d';
      ctx.lineWidth = 1.5;
      ctx.fillRect(-18, -4, 36, 8);
      ctx.strokeRect(-18, -4, 36, 8);
    } else {
      ctx.fillStyle = '#e2e8f0';
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 1.5;
      ctx.fillRect(-12, -15, 24, 30);
      ctx.strokeRect(-12, -15, 24, 30);
      ctx.strokeStyle = '#93c5fd';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(-9, -7);
      ctx.lineTo(9, -7);
      ctx.moveTo(-9, 0);
      ctx.lineTo(9, 0);
      ctx.moveTo(-9, 7);
      ctx.lineTo(9, 7);
      ctx.stroke();
      if (p.grade) {
        ctx.fillStyle = '#dc2626';
        ctx.font = "800 11px 'JetBrains Mono', monospace";
        ctx.fillText(p.grade, 2, 8);
      }
    }
    ctx.restore();
    }
  }
}

function drawPerimeterWalls(ctx: CanvasRenderingContext2D, elapsedTime: number): void {
  ctx.lineWidth = 18;
  ctx.strokeStyle = '#09100d';
  ctx.strokeRect(9, 9, ARENA_WIDTH - 18, ARENA_HEIGHT - 18);

  ctx.lineWidth = 4;
  ctx.strokeStyle = '#355949';
  ctx.strokeRect(20, 20, ARENA_WIDTH - 40, ARENA_HEIGHT - 40);

  // Mounted green chalkboards with formulas and emergency red beacon lights
  const boards = [
    { x: 610, y: 18, w: 240, h: 28, text: 'SIN²α + COS²α = 1 · E = MC²' },
    { x: 950, y: 18, w: 240, h: 28, text: 'КОНТРОЛЬНАЯ БЕЗ ПЕРЕМЕНЫ!' },
    { x: 610, y: ARENA_HEIGHT - 46, w: 240, h: 28, text: 'НЕ БЕГАТЬ ПО КОРИДОРРУ!' },
    { x: 950, y: ARENA_HEIGHT - 46, w: 240, h: 28, text: 'КАБИНЕТ ДИРЕКТОРА — №13' },
  ];
  const beaconPulse = 0.5 + 0.5 * Math.sin(elapsedTime * 7);
  for (const b of boards) {
    ctx.fillStyle = '#143327';
    ctx.fillRect(b.x, b.y, b.w, b.h);
    ctx.strokeStyle = '#b45309';
    ctx.lineWidth = 3;
    ctx.strokeRect(b.x, b.y, b.w, b.h);
    ctx.fillStyle = '#d1fae5';
    ctx.font = "700 10px 'JetBrains Mono', monospace";
    ctx.textAlign = 'center';
    ctx.fillText(b.text, b.x + b.w / 2, b.y + 18);

    // Rotating red emergency beacon light + glow halo
    ctx.fillStyle = `rgba(239, 68, 68, ${0.15 + beaconPulse * 0.25})`;
    ctx.beginPath();
    ctx.arc(b.x - 18, b.y + 14, 16, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = `rgba(239, 68, 68, ${0.45 + beaconPulse * 0.55})`;
    ctx.beginPath();
    ctx.arc(b.x - 18, b.y + 14, 6, 0, Math.PI * 2);
    ctx.fill();
  }

  // Animated Ticking School Clock in top-center atrium wall (900, 32)
  ctx.save();
  ctx.translate(ARENA_WIDTH / 2, 32);
  ctx.fillStyle = '#f8fafc';
  ctx.strokeStyle = '#09100d';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(0, 0, 16, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.strokeStyle = '#dc2626';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(Math.cos(elapsedTime * 3) * 11, Math.sin(elapsedTime * 3) * 11);
  ctx.stroke();
  ctx.restore();
}

function drawPlayerFlashlightCone(
  ctx: CanvasRenderingContext2D,
  player: PlayerState,
  elapsedTime: number
): void {
  const wSpec = WEAPON_SPECS[player.activeWeapon];
  ctx.save();
  ctx.translate(player.x, player.y);
  ctx.rotate(player.angle);

  // Subtle tactical flashlight cone illuminating the school corridor ahead
  const grad = ctx.createRadialGradient(18, 0, 8, 230, 0, 310);
  grad.addColorStop(0, 'rgba(254, 243, 199, 0.16)');
  grad.addColorStop(0.6, 'rgba(254, 243, 199, 0.05)');
  grad.addColorStop(1, 'rgba(254, 243, 199, 0)');

  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.moveTo(12, 0);
  ctx.arc(12, 0, 310, -0.36, 0.36);
  ctx.closePath();
  ctx.fill();

  // Crisp laser sight line matched to active weapon hue with animated dash offset
  ctx.strokeStyle = wSpec.color;
  ctx.globalAlpha = 0.34;
  ctx.lineWidth = 1.6;
  ctx.setLineDash([10, 8]);
  ctx.lineDashOffset = -elapsedTime * 45;
  ctx.beginPath();
  ctx.moveTo(player.radius + 14, 5);
  ctx.lineTo(280, 5);
  ctx.stroke();

  ctx.restore();
}

function drawSchoolObstacle(
  ctx: CanvasRenderingContext2D,
  obs: ObstacleRect,
  elapsedTime: number
): void {
  ctx.save();
  // Deep soft drop shadow
  ctx.fillStyle = 'rgba(0, 0, 0, 0.58)';
  ctx.beginPath();
  ctx.roundRect(obs.x + 6, obs.y + 10, obs.w, obs.h, 6);
  ctx.fill();

  const obsKeyMap = {
    locker: 'obs_locker',
    desk_cluster: 'obs_desk_cluster',
    lab_table: 'obs_lab_table',
    teacher_desk: 'obs_teacher_desk',
    chalk_pillar: 'obs_chalk_pillar',
  } as const;
  const spriteKey = obsKeyMap[obs.kind as keyof typeof obsKeyMap] ?? 'obs_chalk_pillar';
  const obsSprite = getCachedSprite(spriteKey);

  if (obsSprite) {
    const padX = obs.kind === 'desk_cluster' || obs.kind === 'teacher_desk' ? 8 : 4;
    const padY = obs.kind === 'desk_cluster' || obs.kind === 'teacher_desk' ? 12 : 6;
    ctx.drawImage(
      obsSprite,
      obs.x - padX,
      obs.y - padY,
      obs.w + padX * 2,
      obs.h + padY * 2
    );

    // Subtle animated chemical glow on lab_table
    if (obs.kind === 'lab_table') {
      const pulse = 0.2 + 0.1 * Math.sin(elapsedTime * 8);
      ctx.fillStyle = `rgba(74, 222, 128, ${pulse})`;
      ctx.beginPath();
      ctx.arc(obs.x + obs.w * 0.78, obs.y + obs.h * 0.42, 22, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (obs.kind === 'locker') {
    // Heavy Industrial Steel Locker Bank with Metallic Beveling & Louvers
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.roundRect(obs.x - 2, obs.y - 2, obs.w + 4, obs.h + 4, 4);
    ctx.fill();

    ctx.fillStyle = '#334155';
    ctx.fillRect(obs.x, obs.y, obs.w, obs.h);

    const cols = 5;
    const colW = obs.w / cols;
    for (let i = 0; i < cols; i++) {
      const lx = obs.x + i * colW;
      // Locker door bevel & outline
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(lx + 2, obs.y + 2, colW - 4, obs.h - 4);
      ctx.fillStyle = '#475569';
      ctx.fillRect(lx + 3, obs.y + 3, colW - 6, 2);
      ctx.fillRect(lx + 3, obs.y + 3, 2, obs.h - 6);

      // Louver ventilation slots
      ctx.fillStyle = '#09100d';
      for (let s = 10; s <= 26; s += 5) {
        ctx.fillRect(lx + 7, obs.y + s, colW - 14, 2.5);
      }

      // Brass number plate
      ctx.fillStyle = '#facc15';
      ctx.fillRect(lx + colW / 2 - 7, obs.y + 4, 14, 4.5);
      ctx.fillStyle = '#09100d';
      ctx.font = "800 6px 'JetBrains Mono', monospace";
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`${101 + i}`, lx + colW / 2, obs.y + 6.5);

      // Chrome padlock latch & dial
      ctx.fillStyle = '#94a3b8';
      ctx.beginPath();
      ctx.arc(lx + colW - 9, obs.y + obs.h - 12, 3.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(lx + colW - 11, obs.y + obs.h - 11, 4, 5);
    }
    // Top highlight rim
    ctx.fillStyle = '#64748b';
    ctx.fillRect(obs.x, obs.y, obs.w, 2);
  } else if (obs.kind === 'desk_cluster') {
    // Tucked green tubular school chairs around the desk island
    ctx.fillStyle = '#14532d';
    ctx.strokeStyle = '#09100d';
    ctx.lineWidth = 1.8;
    const chairOffsets = [24, 74, 124];
    for (const cx of chairOffsets) {
      // Chair backrests with dark green molded plastic
      ctx.beginPath();
      ctx.roundRect(obs.x + cx - 11, obs.y - 11, 22, 10, 3);
      ctx.fill();
      ctx.stroke();

      ctx.beginPath();
      ctx.roundRect(obs.x + cx - 11, obs.y + obs.h + 1, 22, 10, 3);
      ctx.fill();
      ctx.stroke();
    }

    // Heavy Birch Wood Tabletop with Beveled Rim
    ctx.fillStyle = '#09100d';
    ctx.beginPath();
    ctx.roundRect(obs.x - 2, obs.y - 2, obs.w + 4, obs.h + 4, 4);
    ctx.fill();

    // Natural wood grain base
    ctx.fillStyle = '#cca47c';
    ctx.fillRect(obs.x, obs.y, obs.w, obs.h);

    // Warm wood plank highlights & subtle grain lines
    ctx.fillStyle = '#deb887';
    ctx.fillRect(obs.x + 3, obs.y + 3, obs.w - 6, obs.h / 2 - 4);
    ctx.fillRect(obs.x + 3, obs.y + obs.h / 2 + 1, obs.w - 6, obs.h / 2 - 4);

    ctx.strokeStyle = 'rgba(160, 116, 74, 0.45)';
    ctx.lineWidth = 1.2;
    for (let gy = 8; gy < obs.h - 4; gy += 12) {
      ctx.beginPath();
      ctx.moveTo(obs.x + 5, obs.y + gy);
      ctx.lineTo(obs.x + obs.w - 5, obs.y + gy);
      ctx.stroke();
    }

    // Center desk seam divider
    ctx.strokeStyle = '#78350f';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(obs.x + obs.w / 2, obs.y);
    ctx.lineTo(obs.x + obs.w / 2, obs.y + obs.h);
    ctx.stroke();

    // Left Desk: Open Math Notebook with lined paper, red margin line & student grade "5-"
    ctx.fillStyle = '#f8fafc';
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.roundRect(obs.x + 14, obs.y + 14, 34, 24, 2);
    ctx.fill();
    ctx.stroke();

    // Red notebook margin line
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(obs.x + 22, obs.y + 15);
    ctx.lineTo(obs.x + 22, obs.y + 37);
    ctx.stroke();

    // Pencil groove with yellow pencil & pink eraser
    ctx.fillStyle = '#78350f';
    ctx.fillRect(obs.x + 14, obs.y + 44, 40, 4);
    ctx.fillStyle = '#facc15';
    ctx.fillRect(obs.x + 16, obs.y + 45, 28, 2);
    ctx.fillStyle = '#fb7185';
    ctx.fillRect(obs.x + 44, obs.y + 45, 6, 2);

    // Carved pupil graffiti on desk surface
    ctx.fillStyle = 'rgba(120, 53, 15, 0.85)';
    ctx.font = "800 8.5px 'JetBrains Mono', monospace";
    ctx.textAlign = 'left';
    ctx.fillText('№13', obs.x + 18, obs.y + 64);
    ctx.fillText('ЦОЙ', obs.x + obs.w / 2 + 16, obs.y + 22);

    // Right Desk: Hardcover Textbook & Desktop Globe
    ctx.fillStyle = '#1e3a8a';
    ctx.strokeStyle = '#09100d';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.roundRect(obs.x + obs.w - 54, obs.y + 16, 22, 28, 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#facc15';
    ctx.fillRect(obs.x + obs.w - 51, obs.y + 20, 16, 2.5);

    // Mini classroom globe on swivel stand
    const globeX = obs.x + obs.w - 24;
    const globeY = obs.y + 54;
    ctx.fillStyle = '#09100d';
    ctx.beginPath();
    ctx.arc(globeX, globeY, 11, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#0284c7';
    ctx.beginPath();
    ctx.arc(globeX, globeY, 9.5, 0, Math.PI * 2);
    ctx.fill();

    // Spinning green continents
    ctx.fillStyle = '#4ade80';
    ctx.beginPath();
    ctx.arc(globeX + Math.sin(elapsedTime * 2) * 3, globeY - 1, 4.5, 0, Math.PI * 2);
    ctx.arc(globeX - Math.sin(elapsedTime * 2) * 2.5, globeY + 3, 3.2, 0, Math.PI * 2);
    ctx.fill();

    // Brass swivel arc
    ctx.strokeStyle = '#facc15';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.arc(globeX, globeY, 11.5, -Math.PI * 0.4, Math.PI * 0.6);
    ctx.stroke();
  } else if (obs.kind === 'lab_table') {
    // Chemical-Resistant Dark Slate Lab Bench with Porcelain Sink & Glassware
    ctx.fillStyle = '#09100d';
    ctx.beginPath();
    ctx.roundRect(obs.x - 2, obs.y - 2, obs.w + 4, obs.h + 4, 4);
    ctx.fill();

    // Dark graphite slate surface
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(obs.x, obs.y, obs.w, obs.h);

    // White ceramic bevel rim
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 2;
    ctx.strokeRect(obs.x + 2, obs.y + 2, obs.w - 4, obs.h - 4);

    // Left side: Stainless Lab Sink with Chrome Gooseneck Faucet
    ctx.fillStyle = '#09100d';
    ctx.fillRect(obs.x + 12, obs.y + 14, 28, 38);
    ctx.fillStyle = '#334155';
    ctx.fillRect(obs.x + 14, obs.y + 16, 24, 34);
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.arc(obs.x + 26, obs.y + 33, 4, 0, Math.PI * 2);
    ctx.fill();

    // Chrome faucet
    ctx.fillStyle = '#cbd5e1';
    ctx.fillRect(obs.x + 24, obs.y + 8, 4, 9);
    ctx.beginPath();
    ctx.arc(obs.x + 26, obs.y + 8, 3.5, 0, Math.PI * 2);
    ctx.fill();

    // Center: Wooden Test Tube Rack with 4 colorful reagent tubes
    ctx.fillStyle = '#b45309';
    ctx.fillRect(obs.x + 48, obs.y + 20, 36, 12);
    const vialColors = ['#4ade80', '#38bdf8', '#fb7185', '#facc15'];
    vialColors.forEach((vc, vi) => {
      ctx.fillStyle = vc;
      ctx.fillRect(obs.x + 52 + vi * 8, obs.y + 16, 4.5, 14);
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(obs.x + 52 + vi * 8, obs.y + 14, 4.5, 2);
    });

    // Right: Bubbling Glass Erlenmeyer Flask & Bunsen Burner
    const flicker = Math.sin(elapsedTime * 22) * 2;
    const flaskX = obs.x + obs.w - 42;
    const flaskY = obs.y + 36;

    // Glowing green chemical flask
    ctx.fillStyle = 'rgba(74, 222, 128, 0.32)';
    ctx.beginPath();
    ctx.arc(flaskX, flaskY, 14 + flicker, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#4ade80';
    ctx.beginPath();
    ctx.arc(flaskX, flaskY, 8.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#dcfce7';
    ctx.beginPath();
    ctx.arc(flaskX + 2, flaskY - 2, 2.5, 0, Math.PI * 2);
    ctx.fill();

    // Bunsen burner stand & blue flame
    const burnerX = obs.x + obs.w - 18;
    const burnerY = obs.y + 38;
    ctx.fillStyle = '#64748b';
    ctx.fillRect(burnerX - 5, burnerY + 4, 10, 8);

    ctx.fillStyle = '#38bdf8';
    ctx.beginPath();
    ctx.arc(burnerX, burnerY - 2, 6 + flicker * 0.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fef08a';
    ctx.beginPath();
    ctx.arc(burnerX, burnerY - 1, 2.8, 0, Math.PI * 2);
    ctx.fill();
  } else {
    // chalk_pillar with green wainscoting, white plaster & fire-alarm station
    ctx.fillStyle = '#09100d';
    ctx.beginPath();
    ctx.roundRect(obs.x - 2, obs.y - 2, obs.w + 4, obs.h + 4, 4);
    ctx.fill();

    // Dark Soviet institutional green lower half
    ctx.fillStyle = '#14532d';
    ctx.fillRect(obs.x, obs.y + obs.h * 0.45, obs.w, obs.h * 0.55);

    // Pale upper plaster
    ctx.fillStyle = '#f1f5f9';
    ctx.fillRect(obs.x, obs.y, obs.w, obs.h * 0.45);

    // Border trim separating colors
    ctx.fillStyle = '#09100d';
    ctx.fillRect(obs.x, obs.y + obs.h * 0.45 - 2, obs.w, 3);

    // Wall-mounted Red Fire Emergency Box with glass window
    ctx.fillStyle = '#dc2626';
    ctx.fillRect(obs.x + obs.w / 2 - 12, obs.y + 16, 24, 28);
    ctx.strokeStyle = '#fef2f2';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(obs.x + obs.w / 2 - 12, obs.y + 16, 24, 28);

    ctx.fillStyle = '#fef2f2';
    ctx.font = "900 7px 'JetBrains Mono', monospace";
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('ПК-13', obs.x + obs.w / 2, obs.y + 24);

    // Blinking green/yellow emergency LED
    if (Math.sin(elapsedTime * 8) > 0) {
      ctx.fillStyle = '#facc15';
      ctx.beginPath();
      ctx.arc(obs.x + obs.w / 2, obs.y + 36, 2.8, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  if (obs.label) {
    ctx.fillStyle = 'rgba(254, 243, 199, 0.95)';
    ctx.font = "800 11px 'Plus Jakarta Sans', sans-serif";
    ctx.textAlign = 'center';
    ctx.strokeStyle = '#09100d';
    ctx.lineWidth = 3;
    ctx.strokeText(obs.label, obs.x + obs.w / 2, obs.y - 10);
    ctx.fillText(obs.label, obs.x + obs.w / 2, obs.y - 10);
  }
  ctx.restore();
}

function drawExplosiveProp(
  ctx: CanvasRenderingContext2D,
  ep: ExplosiveProp,
  elapsedTime: number
): void {
  ctx.save();
  ctx.translate(ep.x, ep.y);

  // Subtle warning hazard ring on floor
  const pulse = 0.8 + 0.2 * Math.sin(elapsedTime * 7 + ep.id);
  ctx.strokeStyle =
    ep.kind === 'extinguisher'
      ? `rgba(239, 68, 68, ${0.46 * pulse})`
      : `rgba(163, 230, 53, ${0.46 * pulse})`;
  ctx.lineWidth = 2;
  ctx.setLineDash([5, 5]);
  ctx.beginPath();
  ctx.arc(0, 0, ep.radius + 11, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);

  // Shadow
  ctx.fillStyle = 'rgba(0, 0, 0, 0.56)';
  ctx.beginPath();
  ctx.ellipse(3, 7, ep.radius * 1.05, ep.radius * 0.68, 0, 0, Math.PI * 2);
  ctx.fill();

  // Render hand-painted 2.5D explosive prop / crate sprite
  const propKey =
    ep.kind === 'supply_crate'
      ? 'supply_crate'
      : ep.kind === 'extinguisher'
      ? 'prop_extinguisher'
      : 'prop_chem_barrel';
  const propSprite = getCachedSprite(propKey, ep.hitFlashTimer > 0 ? 'hit' : 'normal');
  if (propSprite) {
    const pSize = ep.radius * 2.85;
    ctx.drawImage(propSprite, -pSize * 0.5, -pSize * 0.5, pSize, pSize);
    ctx.restore();
    return;
  }

  if (ep.kind === 'supply_crate') {

    ctx.fillStyle = '#09100d';
    ctx.beginPath();
    ctx.roundRect(-ep.radius - 2, -ep.radius - 2, (ep.radius + 2) * 2, (ep.radius + 2) * 2, 4);
    ctx.fill();

    ctx.fillStyle = ep.hitFlashTimer > 0 ? '#ffffff' : '#b45309';
    ctx.strokeStyle = '#78350f';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(-ep.radius, -ep.radius, ep.radius * 2, ep.radius * 2, 3);
    ctx.fill();
    ctx.stroke();

    // Inner wooden slats & diagonal brace
    ctx.fillStyle = ep.hitFlashTimer > 0 ? '#fef3c7' : '#d97706';
    ctx.fillRect(-ep.radius + 3, -ep.radius + 3, ep.radius * 2 - 6, ep.radius * 2 - 6);
    ctx.strokeStyle = '#78350f';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(-ep.radius + 3, -ep.radius + 3);
    ctx.lineTo(ep.radius - 3, ep.radius - 3);
    ctx.moveTo(-ep.radius + 3, 0);
    ctx.lineTo(ep.radius - 3, 0);
    ctx.stroke();

    // Steel corner brackets
    ctx.fillStyle = '#94a3b8';
    const c = ep.radius - 1;
    ctx.fillRect(-c, -c, 5, 5);
    ctx.fillRect(c - 5, -c, 5, 5);
    ctx.fillRect(-c, c - 5, 5, 5);
    ctx.fillRect(c - 5, c - 5, 5, 5);

    ctx.fillStyle = '#fef08a';
    ctx.font = "900 7.5px 'JetBrains Mono', monospace";
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('ЗАПАС', 0, 0.5);
    ctx.restore();
    return;
  }

  // Outer dark silhouette
  ctx.fillStyle = '#09100d';
  ctx.beginPath();
  ctx.arc(0, 0, ep.radius + 3, 0, Math.PI * 2);
  ctx.fill();

  if (ep.kind === 'extinguisher') {
    // Detailed Fire Extinguisher Cylinder with Hose, Valve Lever & Pressure Gauge
    ctx.fillStyle = ep.hitFlashTimer > 0 ? '#ffffff' : '#dc2626';
    ctx.beginPath();
    ctx.arc(0, 0, ep.radius, 0, Math.PI * 2);
    ctx.fill();

    // Specular cylinder highlight
    ctx.fillStyle = '#f87171';
    ctx.beginPath();
    ctx.arc(-4, -4, ep.radius * 0.55, 0, Math.PI * 2);
    ctx.fill();

    // White inspection collar band & instruction label
    ctx.strokeStyle = '#fef2f2';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(0, 0, ep.radius * 0.68, -0.8, 2.3);
    ctx.stroke();

    // Black rubber discharge hose & horn nozzle on side
    ctx.strokeStyle = '#18181b';
    ctx.lineWidth = 3.5;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(4, -4);
    ctx.quadraticCurveTo(ep.radius + 3, -2, ep.radius - 1, 9);
    ctx.stroke();

    // Chrome valve assembly, pull pin & green pressure gauge
    ctx.fillStyle = '#cbd5e1';
    ctx.strokeStyle = '#09100d';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(-6, -6, 12, 8, 2);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#4ade80';
    ctx.beginPath();
    ctx.arc(0, -2, 2.6, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#facc15';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.arc(-6, -5, 3, 0, Math.PI * 2);
    ctx.stroke();
  } else {
    // Ribbed Bio-Chemical Drum with Toxic Slime Rim & Hazard Trefoil
    ctx.fillStyle = ep.hitFlashTimer > 0 ? '#ffffff' : '#3f6212';
    ctx.beginPath();
    ctx.arc(0, 0, ep.radius, 0, Math.PI * 2);
    ctx.fill();

    // Metallic drum rim chime
    ctx.strokeStyle = '#a3e635';
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.arc(0, 0, ep.radius - 2, 0, Math.PI * 2);
    ctx.stroke();

    // Bubbling acid puddle on top of drum lid
    ctx.fillStyle = '#84cc16';
    ctx.beginPath();
    ctx.arc(-2, -2, ep.radius * 0.68, 0, Math.PI * 2);
    ctx.fill();

    // Yellow warning diamond / hazard badge
    ctx.fillStyle = '#facc15';
    ctx.strokeStyle = '#09100d';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(0, 0, ep.radius * 0.48, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Biohazard / Skull cross symbol
    ctx.fillStyle = '#09100d';
    ctx.font = "900 8.5px 'JetBrains Mono', monospace";
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('ХИМ', 0, 0.5);
  }

  ctx.restore();
}

function drawBonusDrop(ctx: CanvasRenderingContext2D, b: BonusDrop, elapsedTime: number): void {
  const bob = Math.sin(elapsedTime * 5.5 + b.id) * 3.5;
  ctx.save();
  ctx.translate(b.x, b.y + bob);

  const colors: Record<BonusDrop['type'], string> = {
    medkit: '#ef4444',
    shield: '#38bdf8',
    overdrive: '#f43f5e',
    freeze: '#22d3ee',
    ammo: '#f59e0b',
    speed: '#a3e635',
  };
  const col = colors[b.type];

  // Ground shadow
  ctx.fillStyle = 'rgba(0, 0, 0, 0.42)';
  ctx.beginPath();
  ctx.ellipse(0, 14 - bob * 0.5, 14, 7, 0, 0, Math.PI * 2);
  ctx.fill();

  // Rotating halo ring + orbiting sparkles
  ctx.strokeStyle = col;
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  ctx.arc(0, 0, 20 + Math.sin(elapsedTime * 7) * 2, 0, Math.PI * 2);
  ctx.stroke();

  for (let i = 0; i < 3; i++) {
    const a = elapsedTime * 3.2 + (i * Math.PI * 2) / 3;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(Math.cos(a) * 20, Math.sin(a) * 20, 2.2, 0, Math.PI * 2);
    ctx.fill();
  }

  // Render hand-painted 2.5D pickup sprite
  const bonusKeyMap = {
    medkit: 'bonus_medkit',
    shield: 'bonus_shield',
    overdrive: 'bonus_overdrive',
    freeze: 'bonus_freeze',
    ammo: 'bonus_ammo',
    speed: 'bonus_speed',
  } as const;
  const bonusSprite = getCachedSprite(bonusKeyMap[b.type]);
  if (bonusSprite) {
    const bSize = 42;
    ctx.drawImage(bonusSprite, -bSize * 0.5, -bSize * 0.5, bSize, bSize);
    ctx.restore();
    return;
  }

  // Detailed miniature 3D prop per bonus type
  ctx.strokeStyle = '#09100d';
  ctx.lineWidth = 2.5;

  if (b.type === 'medkit') {
    // First-Aid Satchel Case with Handle & Red Cross
    ctx.fillStyle = '#f8fafc';
    ctx.beginPath();
    ctx.roundRect(-13, -10, 26, 20, 5);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#ef4444';
    ctx.fillRect(-3, -7, 6, 14);
    ctx.fillRect(-7, -3, 14, 6);
  } else if (b.type === 'shield') {
    // Hardcover Armored Textbook with Gold Crest
    ctx.fillStyle = '#0284c7';
    ctx.beginPath();
    ctx.roundRect(-12, -13, 24, 26, 3);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(8, -11, 3, 22);

    ctx.fillStyle = '#facc15';
    ctx.beginPath();
    ctx.moveTo(-1, -6);
    ctx.lineTo(5, -3);
    ctx.lineTo(5, 3);
    ctx.lineTo(-1, 7);
    ctx.lineTo(-7, 3);
    ctx.lineTo(-7, -3);
    ctx.closePath();
    ctx.fill();
  } else if (b.type === 'overdrive') {
    // Glowing Crimson Honor Badge «x2»
    ctx.fillStyle = '#e11d48';
    ctx.beginPath();
    ctx.arc(0, 0, 14, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.strokeStyle = '#fde047';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, 10.5, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = '#fef08a';
    ctx.font = "900 11px 'JetBrains Mono', monospace";
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('x2', 0, 0.5);
  } else if (b.type === 'freeze') {
    // Cryo School Bell with Ice Ring
    ctx.fillStyle = '#0891b2';
    ctx.beginPath();
    ctx.arc(0, 0, 14, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#fef08a';
    ctx.beginPath();
    ctx.moveTo(0, -8);
    ctx.lineTo(7, 5);
    ctx.lineTo(-7, 5);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(0, 7, 2.5, 0, Math.PI * 2);
    ctx.fill();
  } else if (b.type === 'ammo') {
    // Tactical Workshop Ammo & Scrap Crate
    ctx.fillStyle = '#d97706';
    ctx.beginPath();
    ctx.roundRect(-13, -10, 26, 20, 4);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#fef08a';
    ctx.fillRect(-9, -6, 4, 12);
    ctx.fillRect(-2, -6, 4, 12);
    ctx.fillRect(5, -6, 4, 12);
  } else {
    // Cafeteria Energy Drink Can («БЕГ»)
    ctx.fillStyle = '#65a30d';
    ctx.beginPath();
    ctx.roundRect(-9, -13, 18, 26, 5);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#cbd5e1';
    ctx.fillRect(-7, -12, 14, 3);

    ctx.fillStyle = '#fef08a';
    ctx.beginPath();
    ctx.moveTo(2, -6);
    ctx.lineTo(-4, 1);
    ctx.lineTo(1, 1);
    ctx.lineTo(-2, 8);
    ctx.lineTo(5, 0);
    ctx.lineTo(0, 0);
    ctx.closePath();
    ctx.fill();
  }

  ctx.restore();
}

function drawDefensiveStructure(
  ctx: CanvasRenderingContext2D,
  st: BarricadeEntity,
  elapsedTime: number
): void {
  ctx.save();
  ctx.translate(st.x, st.y);

  const hpRatio = Math.max(0, st.hp / st.maxHp);

  // Drop shadow
  ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
  ctx.beginPath();
  ctx.ellipse(2, 6, st.radius + 3, st.radius * 0.72, 0, 0, Math.PI * 2);
  ctx.fill();

  if (st.kind === 'barricade') {
    const barSprite = getCachedSprite('struct_barricade');
    if (barSprite) {
      const bw = st.radius * 2.65;
      const bh = st.radius * 1.95;
      ctx.drawImage(barSprite, -bw * 0.5, -bh * 0.5, bw, bh);
    } else {
      ctx.fillStyle = '#b45309';
      ctx.strokeStyle = '#09100d';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.roundRect(-st.radius, -st.radius * 0.82, st.radius * 2, st.radius * 1.64, 5);
      ctx.fill();
      ctx.stroke();
    }
  } else {
    // High-Tech Automated Classroom Globe Turret on Heavy Tripod
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.38)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, st.radius + 10, elapsedTime * 4, elapsedTime * 4 + Math.PI * 1.35);
    ctx.stroke();

    const turretSprite = getCachedSprite('struct_turret');
    if (turretSprite) {
      ctx.save();
      ctx.rotate(st.angle);
      const tSize = st.radius * 2.95;
      ctx.drawImage(turretSprite, -tSize * 0.5, -tSize * 0.5, tSize, tSize);
      ctx.restore();
    } else {
      ctx.fillStyle = '#0284c7';
      ctx.strokeStyle = '#bae6fd';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, st.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }
  }

  // Mini HP bar below structure
  ctx.fillStyle = '#09100d';
  ctx.fillRect(-19, st.radius + 6, 38, 5);
  ctx.fillStyle = st.kind === 'barricade' ? '#f59e0b' : '#38bdf8';
  ctx.fillRect(-18, st.radius + 7, 36 * hpRatio, 3);

  ctx.restore();
}

function drawZombieTeacher(
  ctx: CanvasRenderingContext2D,
  t: ZombieTeacher,
  elapsedTime: number,
  isFrozen: boolean
): void {
  const spec = TEACHER_SPECS[t.archetype];
  ctx.save();
  ctx.translate(t.x, t.y);

  const pose = computeEnemyAnimPose(t, elapsedTime);
  const speed = Math.hypot(t.vx, t.vy);
  const isWalking = speed > 8;

  ctx.globalAlpha = pose.alpha;
  if (pose.state === 'death') {
    const koProgress = 1 - pose.alpha;
    ctx.translate(-Math.cos(t.angle) * koProgress * 12, -Math.sin(t.angle) * koProgress * 12);
  }
  ctx.rotate(pose.bodyTilt);
  ctx.scale(pose.scaleX, pose.scaleY);

  // Layered Ground Contact Shadow (Soft penumbra + dense contact core)
  ctx.fillStyle = 'rgba(0, 0, 0, 0.28)';
  ctx.beginPath();
  ctx.ellipse(0, t.radius * 0.9, t.radius * 1.25, t.radius * 0.65, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(0, 0, 0, 0.52)';
  ctx.beginPath();
  ctx.ellipse(0, t.radius * 0.82, t.radius * 0.95, t.radius * 0.48, 0, 0, Math.PI * 2);
  ctx.fill();

  // Attack Windup Danger Aura & Stagger Stars
  if (t.state === 'windup') {
    ctx.strokeStyle = '#fb7185';
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.arc(0, 0, t.radius + 10 + Math.sin(elapsedTime * 28) * 3, 0, Math.PI * 2);
    ctx.stroke();

    // Pulsing inner warning ring
    ctx.strokeStyle = 'rgba(251, 113, 133, 0.4)';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.arc(0, 0, t.radius + 6, 0, Math.PI * 2);
    ctx.stroke();
  } else if (t.state === 'staggered') {
    ctx.strokeStyle = '#facc15';
    ctx.lineWidth = 3;
    ctx.setLineDash([6, 6]);
    ctx.beginPath();
    ctx.arc(0, 0, t.radius + 11, elapsedTime * 8, elapsedTime * 8 + Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);

    // Dizzy orbiting stars around head
    for (let si = 0; si < 3; si++) {
      const sa = elapsedTime * 6 + (si * Math.PI * 2) / 3;
      const sx = Math.cos(sa) * (t.radius + 12);
      const sy = Math.sin(sa) * (t.radius + 12);
      ctx.fillStyle = '#fef08a';
      ctx.beginPath();
      ctx.arc(sx, sy, 3, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Multi-Phase Boss Aura & Unique Phase Effects (for all 4 Bosses!)
  if (isBossArchetype(t.archetype) && (t.bossPhase ?? 1) >= 2 && t.state !== 'ko') {
    if (t.bossPhase === 3) {
      // Phase 3 Demonic Blazing Crimson Rage Aura
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(0, 0, t.radius + 16 + Math.sin(elapsedTime * 24) * 4, 0, Math.PI * 2);
      ctx.stroke();

      ctx.fillStyle = 'rgba(239, 68, 68, 0.18)';
      ctx.beginPath();
      ctx.arc(0, 0, t.radius + 14, 0, Math.PI * 2);
      ctx.fill();

      // Flame wisps
      for (let fi = 0; fi < 5; fi++) {
        const fa = elapsedTime * 4 + (fi * Math.PI * 2) / 5;
        const fr = t.radius + 14 + Math.sin(elapsedTime * 15 + fi) * 6;
        ctx.fillStyle = '#facc15';
        ctx.beginPath();
        ctx.arc(Math.cos(fa) * fr, Math.sin(fa) * fr, 3.5, 0, Math.PI * 2);
        ctx.fill();
      }
    } else {
      // Phase 2 Golden Authority Aura with electric sparks
      ctx.strokeStyle = '#facc15';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(0, 0, t.radius + 14 + Math.sin(elapsedTime * 16) * 3, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Vice Principal Boss: Orbiting Red-Graded Exam Sheets («2!») in Phase 2/3
    if (t.archetype === 'vice_principal_boss') {
      const sheetCount = t.bossPhase === 3 ? 4 : 2;
      for (let si = 0; si < sheetCount; si++) {
        const sa = elapsedTime * 3.2 + (si * Math.PI * 2) / sheetCount;
        const sx = Math.cos(sa) * (t.radius + 20);
        const sy = Math.sin(sa) * (t.radius + 20);
        ctx.save();
        ctx.translate(sx, sy);
        ctx.rotate(sa + Math.PI * 0.25);
        ctx.fillStyle = '#f8fafc';
        ctx.strokeStyle = '#be123c';
        ctx.lineWidth = 1.4;
        ctx.fillRect(-5, -6.5, 10, 13);
        ctx.strokeRect(-5, -6.5, 10, 13);
        ctx.fillStyle = '#e11d48';
        ctx.font = "900 7px 'JetBrains Mono', monospace";
        ctx.textAlign = 'center';
        ctx.fillText('2!', 0, 2.5);
        ctx.restore();
      }
    }
  }

  ctx.save();
  ctx.rotate(t.angle + pose.weaponRaiseAngle * 0.35);

  // State-driven body lean/lunge & lateral sway from Unified Animation System
  ctx.translate(pose.bodyLeanX, pose.bodySwayY);

  // 1. High-Detail Walking Footwear & Articulated Stride Dynamics
  const footStride = pose.leftFootStride;
  const footSway = isWalking ? Math.cos(t.walkPhase) * 1.5 : 0;

  // Shoes outline & base
  ctx.fillStyle = '#09100d';
  ctx.beginPath();
  ctx.roundRect(footStride - 6, -t.radius * 0.62 - 4 + footSway, 14, 8, 3.5);
  ctx.roundRect(pose.rightFootStride - 6, t.radius * 0.62 - 4 - footSway, 14, 8, 3.5);
  ctx.fill();

  // Shoe leather / canvas uppers
  const shoeColor =
    t.archetype === 'pe_charger'
      ? '#ef4444'
      : t.archetype === 'literature_chaser'
      ? '#451a03'
      : t.archetype === 'principal_boss'
      ? '#1e1b4b'
      : '#1e293b';
  ctx.fillStyle = shoeColor;
  ctx.beginPath();
  ctx.roundRect(footStride - 4.5, -t.radius * 0.62 - 2.5 + footSway, 11, 5.5, 2.5);
  ctx.roundRect(pose.rightFootStride - 4.5, t.radius * 0.62 - 2.5 - footSway, 11, 5.5, 2.5);
  ctx.fill();

  // Toe caps & rubber heel trim
  ctx.fillStyle = t.archetype === 'pe_charger' ? '#f8fafc' : '#78716c';
  ctx.fillRect(footStride + 3.5, -t.radius * 0.62 - 2.5 + footSway, 3, 5.5);
  ctx.fillRect(pose.rightFootStride + 3.5, t.radius * 0.62 - 2.5 - footSway, 3, 5.5);

  const armSwing = pose.rightArmReach;

  // Zombie skin tone gradients
  const hitFlash = t.hitFlashTimer > 0;
  const frozen = isFrozen || t.frozenTimer > 0;
  const skinColor = hitFlash ? '#ffffff' : frozen ? '#bae6fd' : '#84cc16';
  const skinShade = hitFlash ? '#f1f5f9' : frozen ? '#38bdf8' : '#4d7c0f';
  const skinHighlight = hitFlash ? '#ffffff' : frozen ? '#e0f2fe' : '#bef264';

  // Render pre-cached Full-Body 2.5D Hand-Painted PNG Character / Boss Sprite (including Hit-Flash & Cryo-Frozen variants!)
  const spriteVariant = hitFlash ? 'hit' : frozen ? 'frozen' : 'normal';
  const archetypeSprite = getCachedSprite(t.archetype, spriteVariant);
  if (archetypeSprite) {
    if (t.archetype === 'math_sniper' && t.state === 'windup') {
      ctx.save();
      ctx.strokeStyle = 'rgba(239, 68, 68, 0.85)';
      ctx.lineWidth = 2.2;
      ctx.setLineDash([8, 6]);
      ctx.beginPath();
      ctx.moveTo(t.radius * 0.8, 0);
      ctx.lineTo(440, 0);
      ctx.stroke();
      ctx.restore();
    }
    const spriteSize = isBossArchetype(t.archetype) ? t.radius * 3.15 : t.radius * 3.25;
    ctx.drawImage(
      archetypeSprite,
      -spriteSize * 0.5 + armSwing * 0.35,
      -spriteSize * 0.5,
      spriteSize,
      spriteSize
    );
  } else {
    // 2. VOLUMETRIC TORSO & DISTINCT ARCHETYPE SILHOUETTE PROPORTIONS
    const torsoX = -t.radius * 0.3;
    const shoulderW =
      t.archetype === 'pe_boss'
        ? t.radius * 1.32
        : t.archetype === 'lab_experiment_boss'
        ? t.radius * 1.26
        : t.archetype === 'pe_charger' || t.archetype === 'principal_boss'
        ? t.radius * 1.2
        : t.archetype === 'history_shield'
        ? t.radius * 1.14
        : t.archetype === 'math_sniper'
        ? t.radius * 0.86
        : t.radius * 0.98;
    const torsoLength =
      t.archetype === 'math_sniper'
        ? t.radius * 0.74
        : t.archetype === 'pe_boss' || t.archetype === 'lab_experiment_boss'
        ? t.radius * 0.92
        : t.radius * 0.82;

    // Torso dark boundary stroke
    ctx.fillStyle = '#09100d';
    ctx.beginPath();
    ctx.ellipse(torsoX, 0, torsoLength + 3, shoulderW + 3, 0, 0, Math.PI * 2);
    ctx.fill();

    // Torso Volumetric Shaded Body
    const baseSuitColor = hitFlash ? '#ffffff' : frozen ? '#0284c7' : spec.color;
    const torsoGrad = ctx.createRadialGradient(
      torsoX - torsoLength * 0.3,
      -shoulderW * 0.3,
      2,
      torsoX,
      0,
      shoulderW * 1.1
    );
    torsoGrad.addColorStop(0, hitFlash ? '#ffffff' : spec.accentColor);
    torsoGrad.addColorStop(0.55, baseSuitColor);
    torsoGrad.addColorStop(1, '#09100d');
    ctx.fillStyle = torsoGrad;
    ctx.beginPath();
    ctx.ellipse(torsoX, 0, torsoLength, shoulderW, 0, 0, Math.PI * 2);
    ctx.fill();

  // ARCHETYPE-SPECIFIC HIGH-FIDELITY CLOTHING & TEXTURE
  if (t.archetype === 'pe_charger') {
    // Soviet Olympiad Red Tracksuit with bold double racing stripes & «СССР / 13» emblem
    ctx.fillStyle = '#ffffff';
    // Double stripes along shoulders
    ctx.fillRect(torsoX - 8, -shoulderW + 3, 14, 2.5);
    ctx.fillRect(torsoX - 8, -shoulderW + 7.5, 14, 2.5);
    ctx.fillRect(torsoX - 8, shoulderW - 5.5, 14, 2.5);
    ctx.fillRect(torsoX - 8, shoulderW - 10, 14, 2.5);

    // Front white zipper track with silver pull tab
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(torsoX - 7, 0);
    ctx.lineTo(torsoX + torsoLength * 0.75, 0);
    ctx.stroke();

    ctx.fillStyle = '#cbd5e1';
    ctx.fillRect(torsoX + 3, -2, 3.5, 4);

    // Soviet athletic badge on back: yellow hammer & sickle / star badge
    ctx.fillStyle = '#facc15';
    ctx.beginPath();
    ctx.arc(torsoX - 3, -shoulderW * 0.45, 3.8, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#dc2626';
    ctx.beginPath();
    ctx.arc(torsoX - 3, -shoulderW * 0.45, 2.2, 0, Math.PI * 2);
    ctx.fill();

    // Bold stencil «СССР 13» across back
    ctx.fillStyle = '#ffffff';
    ctx.font = "900 8.5px 'JetBrains Mono', monospace";
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('СССР', torsoX - 2, 0);
  } else if (t.archetype === 'literature_chaser') {
    // Cozy knitted wool shawl with cross-hatch houndstooth pattern over shoulders
    ctx.strokeStyle = 'rgba(254, 243, 199, 0.35)';
    ctx.lineWidth = 1;
    for (let lx = -torsoLength; lx <= torsoLength; lx += 4) {
      ctx.beginPath();
      ctx.moveTo(torsoX + lx, -shoulderW * 0.75);
      ctx.lineTo(torsoX + lx + 5, shoulderW * 0.75);
      ctx.stroke();
    }
    for (let lx = -torsoLength; lx <= torsoLength; lx += 4) {
      ctx.beginPath();
      ctx.moveTo(torsoX + lx + 5, -shoulderW * 0.75);
      ctx.lineTo(torsoX + lx, shoulderW * 0.75);
      ctx.stroke();
    }

    // High lace-collared blouse with ruffled neckline
    ctx.fillStyle = '#f8fafc';
    ctx.beginPath();
    ctx.ellipse(torsoX + 4, 0, 7, 9, 0, 0, Math.PI * 2);
    ctx.fill();

    // Vintage amber cameo brooch at throat
    ctx.fillStyle = '#b45309';
    ctx.beginPath();
    ctx.ellipse(torsoX + 7, 0, 3.5, 4.5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#facc15';
    ctx.beginPath();
    ctx.arc(torsoX + 7, 0, 2, 0, Math.PI * 2);
    ctx.fill();

    // Dangling reading glasses neck chain on shoulders
    ctx.strokeStyle = '#facc15';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.arc(torsoX + 5, 0, shoulderW * 0.65, -Math.PI * 0.45, Math.PI * 0.45);
    ctx.stroke();
  } else if (t.archetype === 'math_sniper') {
    // Sharp high-neck ribbed black turtleneck sweater
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 1.4;
    for (let rx = torsoX - 5; rx <= torsoX + 7; rx += 3.5) {
      ctx.beginPath();
      ctx.moveTo(rx, -shoulderW * 0.7);
      ctx.lineTo(rx, shoulderW * 0.7);
      ctx.stroke();
    }

    // White shirt cuff tips & geometric golden brooch (compass motif)
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(torsoX + 8, -shoulderW * 0.75, 3, 5);
    ctx.fillRect(torsoX + 8, shoulderW * 0.75 - 5, 3, 5);

    ctx.fillStyle = '#38bdf8';
    ctx.beginPath();
    ctx.moveTo(torsoX + 7, -3);
    ctx.lineTo(torsoX + 11, 0);
    ctx.lineTo(torsoX + 7, 3);
    ctx.closePath();
    ctx.fill();
  } else if (t.archetype === 'chem_lobber') {
    // Heavy rubberized acid safety apron over discolored lab coat
    ctx.fillStyle = '#84cc16';
    ctx.beginPath();
    ctx.ellipse(torsoX, 0, torsoLength * 0.85, shoulderW * 0.85, 0, 0, Math.PI * 2);
    ctx.fill();

    // Dark corroded chemical burn holes & toxic drips
    ctx.fillStyle = '#14532d';
    ctx.beginPath();
    ctx.arc(torsoX - 5, -8, 4.5, 0, Math.PI * 2);
    ctx.arc(torsoX + 2, 6, 3.5, 0, Math.PI * 2);
    ctx.arc(torsoX - 8, 3, 2.5, 0, Math.PI * 2);
    ctx.fill();

    // Yellow hazard bio-symbol warning triangle patch on chest
    ctx.fillStyle = '#facc15';
    ctx.beginPath();
    ctx.moveTo(torsoX - 2, -6);
    ctx.lineTo(torsoX + 6, -1);
    ctx.lineTo(torsoX - 2, 4);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#09100d';
    ctx.beginPath();
    ctx.arc(torsoX + 0.5, -1, 1.8, 0, Math.PI * 2);
    ctx.fill();
  } else if (t.archetype === 'history_shield') {
    // Soviet historical teacher uniform jacket: olive-drab with brass buttons & ribbon rack
    ctx.fillStyle = '#3f4f34';
    ctx.beginPath();
    ctx.ellipse(torsoX, 0, torsoLength * 0.88, shoulderW * 0.9, 0, 0, Math.PI * 2);
    ctx.fill();

    // Polished gold dome buttons down front
    ctx.fillStyle = '#facc15';
    ctx.strokeStyle = '#78350f';
    ctx.lineWidth = 1;
    for (let by = -8; by <= 8; by += 4) {
      ctx.beginPath();
      ctx.arc(torsoX + 4, by, 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }

    // Historical ribbon bar on left chest (Red, Gold, Blue honors)
    ctx.fillStyle = '#dc2626';
    ctx.fillRect(torsoX - 3, -11, 4, 3.5);
    ctx.fillStyle = '#f59e0b';
    ctx.fillRect(torsoX + 1, -11, 4, 3.5);
    ctx.fillStyle = '#0284c7';
    ctx.fillRect(torsoX + 5, -11, 4, 3.5);
  } else if (t.archetype === 'principal_boss') {
    // Executive double-breasted royal burgundy suit with satin peaked lapels
    ctx.fillStyle = '#4c0519';
    ctx.beginPath();
    ctx.moveTo(torsoX + 2, -shoulderW * 0.85);
    ctx.lineTo(torsoX + torsoLength * 0.75, -5);
    ctx.lineTo(torsoX + 2, -2);
    ctx.closePath();
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(torsoX + 2, shoulderW * 0.85);
    ctx.lineTo(torsoX + torsoLength * 0.75, 5);
    ctx.lineTo(torsoX + 2, 2);
    ctx.closePath();
    ctx.fill();

    // Braided golden aiguillette shoulder epaulets (аксельбанты)
    ctx.strokeStyle = '#facc15';
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.arc(torsoX, -shoulderW + 2, 7, 0, Math.PI);
    ctx.arc(torsoX, shoulderW - 2, 7, 0, Math.PI);
    ctx.stroke();

    // Gold presidential medal badge with ruby gemstone
    ctx.fillStyle = '#facc15';
    ctx.beginPath();
    ctx.arc(torsoX + 5, -9, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(torsoX + 5, -9, 2.2, 0, Math.PI * 2);
    ctx.fill();

    // Gold pocket watch chain looping across the waistcoat
    ctx.strokeStyle = '#fde047';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.arc(torsoX - 1, 3, 6, -0.4, Math.PI * 0.8);
    ctx.stroke();
  } else if (t.archetype === 'vice_principal_boss') {
    // Завуч Маргарита: Strict tailored crimson suit with white pearl necklace & golden Honor Pin
    ctx.fillStyle = '#881337';
    ctx.beginPath();
    ctx.ellipse(torsoX, 0, torsoLength * 0.9, shoulderW * 0.92, 0, 0, Math.PI * 2);
    ctx.fill();

    // Pearl necklace beads around collar
    ctx.fillStyle = '#f8fafc';
    for (let pa = -0.8; pa <= 0.8; pa += 0.32) {
      ctx.beginPath();
      ctx.arc(torsoX + 5 + Math.cos(pa) * 5, Math.sin(pa) * 8, 2, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (t.archetype === 'pe_boss') {
    // Старший Физрук «Титан»: Royal blue Olympiad tracksuit with triple gold stripes & Olympic Gold Medal
    ctx.fillStyle = '#facc15';
    ctx.fillRect(torsoX - 9, -shoulderW + 3, 16, 3);
    ctx.fillRect(torsoX - 9, shoulderW - 6, 16, 3);

    // Champion Gold Medal on Red Ribbon
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(torsoX + 2, -6);
    ctx.lineTo(torsoX + 9, 0);
    ctx.lineTo(torsoX + 2, 6);
    ctx.stroke();
    ctx.fillStyle = '#facc15';
    ctx.beginPath();
    ctx.arc(torsoX + 9, 0, 4.5, 0, Math.PI * 2);
    ctx.fill();
  } else if (t.archetype === 'lab_experiment_boss') {
    // Мутант «Объект-13»: Pressurized Bio-Chemical Glass Tank strapped to back with glowing green mutagen veins!
    ctx.fillStyle = '#052e16';
    ctx.strokeStyle = '#4ade80';
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.roundRect(torsoX - 14, -12, 14, 24, 5);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#a3e635';
    ctx.beginPath();
    ctx.roundRect(torsoX - 12, -9, 10, 18, 3);
    ctx.fill();
  }

  // 3. ARTICULATED ARMS, MUSCLES, SLEEVES & HANDS
  const leftHandX = t.radius * 0.96 + armSwing * 0.5;
  const leftHandY = -shoulderW * 0.82;
  const rightHandX = t.radius * 0.96 - armSwing * 0.5;
  const rightHandY = shoulderW * 0.82;

  // Sleeve contours
  ctx.fillStyle = '#09100d';
  ctx.beginPath();
  ctx.roundRect(torsoX - 2, -shoulderW - 2, t.radius * 1.15, 9.5, 4.5);
  ctx.roundRect(torsoX - 2, shoulderW - 7.5, t.radius * 1.15, 9.5, 4.5);
  ctx.fill();

  // Sleeve cloth with directional lighting
  ctx.fillStyle = baseSuitColor;
  ctx.beginPath();
  ctx.roundRect(torsoX, -shoulderW - 0.5, t.radius * 1.05, 7, 3.5);
  ctx.roundRect(torsoX, shoulderW - 6.5, t.radius * 1.05, 7, 3.5);
  ctx.fill();

  // Highlight along upper arm
  ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
  ctx.fillRect(torsoX + 2, -shoulderW, t.radius * 0.7, 2);

  // Forearms & Hands
  const handSkin = t.archetype === 'chem_lobber' ? '#eab308' : skinColor; // Chemical rubber gloves on chem teacher!
  ctx.fillStyle = '#09100d';
  ctx.beginPath();
  ctx.arc(leftHandX, leftHandY, 5.5, 0, Math.PI * 2);
  ctx.arc(rightHandX, rightHandY, 5.5, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = handSkin;
  ctx.beginPath();
  ctx.arc(leftHandX, leftHandY, 4.5, 0, Math.PI * 2);
  ctx.arc(rightHandX, rightHandY, 4.5, 0, Math.PI * 2);
  ctx.fill();

  // Knuckle & finger details
  ctx.fillStyle = '#09100d';
  ctx.fillRect(leftHandX + 1, leftHandY - 3, 2, 6);
  ctx.fillRect(rightHandX + 1, rightHandY - 3, 2, 6);

  // 4. SIGNATURE HIGH-FIDELITY ARCHETYPE WEAPONS & ACCESSORIES
  if (t.archetype === 'literature_chaser') {
    // Massive Antique Hardcover Volume: «ВОЙНА И МИР: ТОМ II» + Red Correction Pen
    ctx.save();
    ctx.translate(t.radius * 0.92, 0);
    ctx.rotate(-0.06);

    // Book drop shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
    ctx.fillRect(2, -14, 25, 30);

    // Battered dark maroon leather binding
    ctx.fillStyle = '#09100d';
    ctx.fillRect(-2, -15, 26, 30);

    ctx.fillStyle = '#831843';
    ctx.fillRect(0, -14, 23, 28);

    // Embossed gold corner filigree brackets
    ctx.fillStyle = '#facc15';
    ctx.fillRect(0, -14, 4, 4);
    ctx.fillRect(19, -14, 4, 4);
    ctx.fillRect(0, 10, 4, 4);
    ctx.fillRect(19, 10, 4, 4);

    // Gilded page edges
    ctx.fillStyle = '#fef3c7';
    ctx.fillRect(2, -12, 18, 11);
    ctx.fillRect(2, 1, 18, 11);

    // Lined text lines on open pages
    ctx.fillStyle = '#94a3b8';
    for (let py = -10; py <= -3; py += 2.5) {
      ctx.fillRect(4, py, 14, 1);
    }
    for (let py = 3; py <= 10; py += 2.5) {
      ctx.fillRect(4, py, 14, 1);
    }

    // Red silk bookmark ribbon trailing
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.moveTo(11, 0);
    ctx.lineTo(26, 3 + Math.sin(elapsedTime * 8) * 2.5);
    ctx.lineTo(24, 6);
    ctx.closePath();
    ctx.fill();

    // Red grading pen clamped in right hand, dripping red ink!
    ctx.fillStyle = '#dc2626';
    ctx.fillRect(rightHandX - t.radius * 0.92, rightHandY - 1.5, 14, 3);
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(rightHandX - t.radius * 0.92 + 10, rightHandY - 1.5, 3, 3);
    // Red ink drip
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(rightHandX - t.radius * 0.92 + 15, rightHandY, 2, 0, Math.PI * 2);
    ctx.fill();

    // Gold Cyrillic title stamp
    ctx.fillStyle = '#facc15';
    ctx.font = "900 6.5px 'JetBrains Mono', monospace";
    ctx.textAlign = 'center';
    ctx.fillText('ТОМ II', 11, -5.5);
    ctx.restore();
  } else if (t.archetype === 'math_sniper') {
    // 1-Meter Heavy Wooden Classroom Ruler with Brass Corner Bindings & Caliper Marks
    ctx.save();
    ctx.translate(rightHandX - 2, rightHandY);
    ctx.rotate(0.04);

    // Ruler shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    ctx.fillRect(2, -2.5, 34, 8);

    // Ruler outline
    ctx.fillStyle = '#09100d';
    ctx.fillRect(0, -4.5, 36, 9);

    // Polished yellow varnished beech wood
    ctx.fillStyle = '#f59e0b';
    ctx.fillRect(1, -3.5, 34, 7);

    // Brass protective cap at tip
    ctx.fillStyle = '#fde047';
    ctx.fillRect(30, -3.5, 5, 7);

    // Millimeter and Centimeter calibration marks
    ctx.fillStyle = '#09100d';
    for (let m = 3; m < 30; m += 2.5) {
      const isMajor = m % 5 < 2.5;
      ctx.fillRect(m, -3.5, 1, isMajor ? 3.5 : 2);
    }

    // Cyrillic calibration brand «ГОСТ 1-МЕТР»
    ctx.fillStyle = '#78350f';
    ctx.font = "800 4.5px 'JetBrains Mono', monospace";
    ctx.fillText('100см', 14, 1.5);
    ctx.restore();

    // Giant Steel Chalkboard Drafting Compass in Left Hand
    ctx.save();
    ctx.translate(leftHandX, leftHandY);
    ctx.strokeStyle = '#09100d';
    ctx.lineWidth = 4.5;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(26, 6);
    ctx.moveTo(0, 0);
    ctx.lineTo(26, -5);
    ctx.stroke();

    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 2.6;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(26, 6);
    ctx.moveTo(0, 0);
    ctx.lineTo(26, -5);
    ctx.stroke();

    // Compass hinge knob in brass
    ctx.fillStyle = '#facc15';
    ctx.beginPath();
    ctx.arc(0, 0, 4.5, 0, Math.PI * 2);
    ctx.fill();

    // Piece of white chalkboard chalk clamped in tip
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(24, 4.5, 6, 3);
    ctx.restore();

    // Windup Laser Sight Beam
    if (t.state === 'windup') {
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.85)';
      ctx.lineWidth = 1.8;
      ctx.setLineDash([5, 4]);
      ctx.beginPath();
      ctx.moveTo(rightHandX + 32, rightHandY);
      ctx.lineTo(rightHandX + 460, rightHandY);
      ctx.stroke();
      ctx.setLineDash([]);
    }
  } else if (t.archetype === 'pe_charger') {
    // Chrome Metal Referee Whistle with reflective highlights & red neck cord
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.arc(torsoX + 7, 0, 8, -Math.PI * 0.45, Math.PI * 0.45);
    ctx.stroke();

    // Whistle body in mouth with metallic shine
    const whistleGrad = ctx.createLinearGradient(t.radius * 0.75, -4, t.radius * 0.75 + 11, 4);
    whistleGrad.addColorStop(0, '#f8fafc');
    whistleGrad.addColorStop(0.5, '#94a3b8');
    whistleGrad.addColorStop(1, '#334155');
    ctx.fillStyle = '#09100d';
    ctx.fillRect(t.radius * 0.72 - 1, -4, 12, 8);
    ctx.fillStyle = whistleGrad;
    ctx.fillRect(t.radius * 0.72, -3, 10, 6);
    ctx.fillStyle = '#09100d';
    ctx.fillRect(t.radius * 0.72 + 5, -2, 2.5, 4);

    // Charging steam/frost puffs snorting from nostrils when winding up / charging
    if (t.state === 'active_attack' || t.state === 'windup') {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
      ctx.beginPath();
      ctx.arc(t.radius * 0.72 + 14, -3 + Math.sin(elapsedTime * 20) * 2, 4, 0, Math.PI * 2);
      ctx.arc(t.radius * 0.72 + 19, 2 + Math.cos(elapsedTime * 20) * 2, 5.5, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (t.archetype === 'chem_lobber') {
    // Volumetric Glowing Erlenmeyer Flask with sloshing radioactive green fluid & bubbles
    ctx.save();
    ctx.translate(rightHandX + 2, rightHandY);

    // Toxic radioactive aura
    ctx.fillStyle = 'rgba(74, 222, 128, 0.38)';
    ctx.beginPath();
    ctx.arc(6, 0, 16 + Math.sin(elapsedTime * 14) * 2.5, 0, Math.PI * 2);
    ctx.fill();

    // Flask glass contour
    ctx.fillStyle = '#09100d';
    ctx.beginPath();
    ctx.moveTo(-5, -5);
    ctx.lineTo(14, -11);
    ctx.lineTo(14, 11);
    ctx.lineTo(-5, 5);
    ctx.closePath();
    ctx.fill();

    // Sloshing fluorescent toxic brew
    const acidGrad = ctx.createLinearGradient(0, -10, 14, 10);
    acidGrad.addColorStop(0, '#bef264');
    acidGrad.addColorStop(0.5, '#4ade80');
    acidGrad.addColorStop(1, '#15803d');
    ctx.fillStyle = acidGrad;
    ctx.beginPath();
    ctx.moveTo(-3, -3.5);
    ctx.lineTo(12, -9);
    ctx.lineTo(12, 9);
    ctx.lineTo(-3, 3.5);
    ctx.closePath();
    ctx.fill();

    // Glass specular curve & boiling bubbles
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(4, -4, 2.2, 0, Math.PI * 2);
    ctx.arc(8, 2, 1.8, 0, Math.PI * 2);
    ctx.fill();

    // Green toxic vapor wisps drifting off neck
    ctx.fillStyle = 'rgba(190, 242, 100, 0.6)';
    ctx.beginPath();
    ctx.arc(15, -6 + Math.sin(elapsedTime * 12) * 3, 3, 0, Math.PI * 2);
    ctx.arc(19, -9 + Math.cos(elapsedTime * 10) * 3, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  } else if (t.archetype === 'history_shield') {
    // Colossal Roman Scutum / Wooden Classroom Pavise Shield
    const shieldAngle = Math.PI * 0.64;
    const shieldRad = t.radius + 9;

    // Heavy riveted black iron outer rim
    ctx.strokeStyle = '#09100d';
    ctx.lineWidth = 11;
    ctx.beginPath();
    ctx.arc(torsoX + 5, 0, shieldRad, -shieldAngle, shieldAngle);
    ctx.stroke();

    // Aged oak planks
    ctx.strokeStyle = '#78350f';
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.arc(torsoX + 5, 0, shieldRad, -shieldAngle, shieldAngle);
    ctx.stroke();

    // Front historical map parchment overlay
    ctx.strokeStyle = '#fef3c7';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.arc(torsoX + 5, 0, shieldRad, -shieldAngle * 0.88, shieldAngle * 0.88);
    ctx.stroke();

    // Iron reinforcement band cross
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.arc(torsoX + 5, 0, shieldRad, -shieldAngle * 0.85, shieldAngle * 0.85);
    ctx.stroke();

    // Heavy bronze central shield boss (umbo) with silver studs
    ctx.fillStyle = '#09100d';
    ctx.beginPath();
    ctx.arc(torsoX + 5 + shieldRad, 0, 7, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#facc15';
    ctx.beginPath();
    ctx.arc(torsoX + 5 + shieldRad, 0, 5.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(torsoX + 5 + shieldRad - 1.5, -1.5, 1.8, 0, Math.PI * 2);
    ctx.fill();
  } else if (t.archetype === 'principal_boss') {
    // Giant Polished Brass School Megaphone with Red Horn & Dynamic Audio VU-Meter
    ctx.save();
    ctx.translate(rightHandX - 2, rightHandY - 2);

    // Megaphone outline
    ctx.fillStyle = '#09100d';
    ctx.beginPath();
    ctx.moveTo(0, -7);
    ctx.lineTo(28, -20);
    ctx.lineTo(28, 20);
    ctx.lineTo(0, 7);
    ctx.closePath();
    ctx.fill();

    // Polished gold megaphone flare
    const megaGrad = ctx.createLinearGradient(0, -15, 28, 15);
    megaGrad.addColorStop(0, '#fef08a');
    megaGrad.addColorStop(0.5, '#eab308');
    megaGrad.addColorStop(1, '#854d0e');
    ctx.fillStyle = megaGrad;
    ctx.beginPath();
    ctx.moveTo(2, -5.5);
    ctx.lineTo(26, -18);
    ctx.lineTo(26, 18);
    ctx.lineTo(2, 5.5);
    ctx.closePath();
    ctx.fill();

    // Crimson speaker rim & sound grille
    ctx.fillStyle = '#dc2626';
    ctx.fillRect(24, -18, 5, 36);

    ctx.fillStyle = '#1e293b';
    ctx.fillRect(26, -15, 2, 30);

    // Audio VU-meter lights along top: green -> yellow -> red
    ctx.fillStyle = '#4ade80';
    ctx.fillRect(8, -10, 3, 2);
    ctx.fillStyle = '#facc15';
    ctx.fillRect(13, -13, 3, 2);
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(18, -16, 3, 2);

    // Sonic shockwave arcs during attack/windup
    if (t.state === 'windup' || t.state === 'active_attack') {
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 3;
      for (let ri = 1; ri <= 3; ri++) {
        const rad = 20 + ri * 9 + Math.sin(elapsedTime * 16 + ri) * 4;
        ctx.beginPath();
        ctx.arc(28, 0, rad, -0.65, 0.65);
        ctx.stroke();
      }
    }
    ctx.restore();
  } else if (t.archetype === 'vice_principal_boss') {
    // Giant Open Black Gradebook «КЛАССНЫЙ ЖУРНАЛ 13-Б» in Left Hand + Giant Red Fountain Pen Spear in Right Hand
    ctx.save();
    ctx.translate(leftHandX + 2, leftHandY - 2);
    ctx.fillStyle = '#09100d';
    ctx.fillRect(-4, -14, 22, 28);
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(-2, -12, 18, 24);
    ctx.fillStyle = '#dc2626';
    ctx.font = "900 10px 'JetBrains Mono', monospace";
    ctx.fillText('2!', 4, 4);
    ctx.restore();

    ctx.save();
    ctx.translate(rightHandX, rightHandY);
    ctx.fillStyle = '#e11d48';
    ctx.fillRect(0, -3, 28, 6);
    ctx.fillStyle = '#facc15';
    ctx.beginPath();
    ctx.moveTo(28, -3);
    ctx.lineTo(38, 0);
    ctx.lineTo(28, 3);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  } else if (t.archetype === 'pe_boss') {
    // Dual Cast-Iron 32kg Kettlebells («ГИРИ 32 КГ») in Both Hands!
    for (const [hx, hy] of [
      [leftHandX + 4, leftHandY],
      [rightHandX + 4, rightHandY],
    ]) {
      ctx.save();
      ctx.translate(hx, hy);
      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(-4, 0, 6, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = '#0f172a';
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.arc(5, 0, 10.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#facc15';
      ctx.font = "900 6.5px 'JetBrains Mono', monospace";
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('32', 5, 0.5);
      ctx.restore();
    }
  } else if (t.archetype === 'lab_experiment_boss') {
    // Asymmetrical Mutated Bio-Horror: Left Acid-Vat Launcher + Colossal Right Bone-Crusher Mutated Claw!
    ctx.save();
    ctx.translate(leftHandX + 4, leftHandY);
    ctx.fillStyle = 'rgba(74, 222, 128, 0.4)';
    ctx.beginPath();
    ctx.arc(6, 0, 13 + Math.sin(elapsedTime * 16) * 2.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#22c55e';
    ctx.strokeStyle = '#09100d';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(6, 0, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.restore();

    // Giant Right Mutated Crusher Claw with 3 Chitin Pincers
    ctx.save();
    ctx.translate(rightHandX + 8, rightHandY + 2);
    ctx.fillStyle = 'rgba(163, 230, 53, 0.35)';
    ctx.beginPath();
    ctx.arc(8, 0, 18 + Math.sin(elapsedTime * 18) * 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#15803d';
    ctx.strokeStyle = '#09100d';
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.ellipse(6, 0, 13, 9.5, 0.15, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    // 3 Razor Bone-Spikes on Right Claw
    ctx.fillStyle = '#ecfccb';
    for (const cy of [-6, 0, 6]) {
      ctx.beginPath();
      ctx.moveTo(15, cy - 2.2);
      ctx.lineTo(26, cy);
      ctx.lineTo(15, cy + 2.2);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }
    ctx.restore();
  }

  // 5. VOLUMETRIC SCULPTED HEAD, FACE, EYES & ARCHETYPE HAIRSTYLES
  const headX = t.radius * 0.36;
  const headRadius =
    t.archetype === 'math_sniper'
      ? t.radius * 0.48
      : t.archetype === 'pe_boss' || t.archetype === 'principal_boss'
      ? t.radius * 0.58
      : t.radius * 0.54;

  // Sculpted Ears
  ctx.fillStyle = '#09100d';
  ctx.beginPath();
  ctx.arc(headX, -headRadius - 2, 4, 0, Math.PI * 2);
  ctx.arc(headX, headRadius + 2, 4, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = skinShade;
  ctx.beginPath();
  ctx.arc(headX, -headRadius - 2, 3, 0, Math.PI * 2);
  ctx.arc(headX, headRadius + 2, 3, 0, Math.PI * 2);
  ctx.fill();

  // Head base outline
  ctx.fillStyle = '#09100d';
  ctx.beginPath();
  ctx.arc(headX, 0, headRadius + 2.8, 0, Math.PI * 2);
  ctx.fill();

  // Head Volumetric Shading
  const headGrad = ctx.createRadialGradient(
    headX + headRadius * 0.3,
    -headRadius * 0.3,
    1,
    headX,
    0,
    headRadius
  );
  headGrad.addColorStop(0, skinHighlight);
  headGrad.addColorStop(0.65, skinColor);
  headGrad.addColorStop(1, skinShade);
  ctx.fillStyle = headGrad;
  ctx.beginPath();
  ctx.arc(headX, 0, headRadius, 0, Math.PI * 2);
  ctx.fill();

  // ARCHETYPE HAIR & HEADGEAR
  if (t.archetype === 'literature_chaser') {
    // Styled salt-and-pepper bun with curling strands
    ctx.fillStyle = '#09100d';
    ctx.beginPath();
    ctx.arc(headX - headRadius * 0.65, 0, 7.5, 0, Math.PI * 2);
    ctx.fill();

    const hairGrad = ctx.createRadialGradient(headX - 6, -2, 1, headX - 6, 0, 8);
    hairGrad.addColorStop(0, '#f1f5f9');
    hairGrad.addColorStop(0.7, '#94a3b8');
    hairGrad.addColorStop(1, '#475569');
    ctx.fillStyle = hairGrad;
    ctx.beginPath();
    ctx.arc(headX - headRadius * 0.65, 0, 6.5, 0, Math.PI * 2);
    ctx.fill();

    // Loose curly strands at temples
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.arc(headX - 2, -headRadius + 1, 4, 0, Math.PI * 0.8);
    ctx.arc(headX - 2, headRadius - 1, 4, -Math.PI * 0.8, 0);
    ctx.stroke();
  } else if (t.archetype === 'math_sniper') {
    // Sleek geometric black bun pierced by two crossed sharpened yellow pencils
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.arc(headX - headRadius * 0.8, 0, 6.5, 0, Math.PI * 2);
    ctx.fill();

    // Two crossed yellow pencils through bun
    ctx.strokeStyle = '#facc15';
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.moveTo(headX - headRadius * 0.8 - 7, -7);
    ctx.lineTo(headX - headRadius * 0.8 + 7, 7);
    ctx.moveTo(headX - headRadius * 0.8 + 7, -7);
    ctx.lineTo(headX - headRadius * 0.8 - 7, 7);
    ctx.stroke();

    // Pink eraser tips on pencils
    ctx.fillStyle = '#fb7185';
    ctx.beginPath();
    ctx.arc(headX - headRadius * 0.8 - 7, -7, 1.8, 0, Math.PI * 2);
    ctx.arc(headX - headRadius * 0.8 + 7, -7, 1.8, 0, Math.PI * 2);
    ctx.fill();
  } else if (t.archetype === 'pe_charger') {
    // Military buzzcut + thick red athletic sweatband
    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.arc(headX - 2, 0, headRadius * 0.88, Math.PI * 0.45, -Math.PI * 0.45);
    ctx.fill();

    // Sweatband with cloth creases
    ctx.fillStyle = '#dc2626';
    ctx.strokeStyle = '#09100d';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(headX - 1, -headRadius - 1, 4.5, (headRadius + 1) * 2, 2);
    ctx.fill();
    ctx.stroke();

    // Sweat beads during rage/sprint
    ctx.fillStyle = '#38bdf8';
    ctx.beginPath();
    ctx.arc(headX + 2, -headRadius + 2, 1.4, 0, Math.PI * 2);
    ctx.arc(headX + 3, headRadius - 2, 1.2, 0, Math.PI * 2);
    ctx.fill();

    // Heavy Soviet 5 o'clock stubble shadow and thick mustache
    ctx.fillStyle = 'rgba(30, 41, 59, 0.45)';
    ctx.beginPath();
    ctx.arc(headX + 4, 0, 6, -Math.PI * 0.5, Math.PI * 0.5);
    ctx.fill();

    // Soviet walrus mustache
    ctx.fillStyle = '#09100d';
    ctx.beginPath();
    ctx.ellipse(headX + 6, 0, 3, 5.5, 0, 0, Math.PI * 2);
    ctx.fill();
  } else if (t.archetype === 'chem_lobber') {
    // Wild frizzy electrified Einstein/Doc Brown hair shock
    ctx.fillStyle = '#f8fafc';
    ctx.strokeStyle = '#09100d';
    ctx.lineWidth = 1.4;
    const hairSpikes = [-8, -5, -2, 2, 5, 8];
    for (const hy of hairSpikes) {
      ctx.beginPath();
      ctx.arc(headX - 6, hy, 4.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }
  } else if (t.archetype === 'history_shield') {
    // Bushy mutton-chops sideburns and gray temple hair
    ctx.fillStyle = '#64748b';
    ctx.beginPath();
    ctx.arc(headX - 3, -headRadius * 0.7, 4.5, 0, Math.PI * 2);
    ctx.arc(headX - 3, headRadius * 0.7, 4.5, 0, Math.PI * 2);
    ctx.fill();
  } else if (t.archetype === 'principal_boss') {
    // Polished slicked-back executive silver hair with sheen
    const silverGrad = ctx.createLinearGradient(headX - 8, -6, headX, 6);
    silverGrad.addColorStop(0, '#f8fafc');
    silverGrad.addColorStop(0.5, '#cbd5e1');
    silverGrad.addColorStop(1, '#475569');
    ctx.fillStyle = silverGrad;
    ctx.beginPath();
    ctx.arc(headX - 3, 0, headRadius * 0.9, Math.PI * 0.45, -Math.PI * 0.45);
    ctx.fill();

    // Golden executive comb hair crest
    ctx.fillStyle = '#facc15';
    ctx.fillRect(headX + 2, -3.5, 3.5, 7);
  } else if (t.archetype === 'vice_principal_boss') {
    // Tall sculpted crimson-black beehive hairdo («Хала на голове») with golden hairpin
    ctx.fillStyle = '#09100d';
    ctx.beginPath();
    ctx.arc(headX - headRadius * 0.75, 0, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#4c0519';
    ctx.beginPath();
    ctx.arc(headX - headRadius * 0.75, 0, 8.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#facc15';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(headX - headRadius * 0.75, -11);
    ctx.lineTo(headX - headRadius * 0.75, 11);
    ctx.stroke();
  } else if (t.archetype === 'pe_boss') {
    // Golden Champion Headband & Heavy handlebar mustache
    ctx.fillStyle = '#facc15';
    ctx.strokeStyle = '#09100d';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.roundRect(headX - 1, -headRadius - 1, 5, (headRadius + 1) * 2, 2);
    ctx.fill();
    ctx.stroke();
  } else if (t.archetype === 'lab_experiment_boss') {
    // Glowing triple bio-goggles & bubbling green brain dome
    ctx.fillStyle = '#4ade80';
    ctx.strokeStyle = '#09100d';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.arc(headX - 3, 0, headRadius * 0.75, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }

  // 6. HIGH-EXPRESSION ZOMBIE EYES & MOUTH
  const eyeX = headX + headRadius * 0.46;
  const eyeColor =
    t.archetype === 'principal_boss'
      ? t.bossPhase === 3
        ? '#ef4444'
        : '#f43f5e'
      : t.archetype === 'chem_lobber'
      ? '#22c55e'
      : '#ef4444';

  // Eye Sockets (Dark depth)
  ctx.fillStyle = '#09100d';
  ctx.beginPath();
  ctx.arc(eyeX, -4.5, 3.2, 0, Math.PI * 2);
  ctx.arc(eyeX, 4.5, 3.2, 0, Math.PI * 2);
  ctx.fill();

  // Glowing Zombie Iris
  ctx.fillStyle = eyeColor;
  ctx.beginPath();
  ctx.arc(eyeX, -4.5, 2.4, 0, Math.PI * 2);
  ctx.arc(eyeX, 4.5, 2.4, 0, Math.PI * 2);
  ctx.fill();

  // White specular pupil glint
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(eyeX + 0.8, -4.5, 1, 0, Math.PI * 2);
  ctx.arc(eyeX + 0.8, 4.5, 1, 0, Math.PI * 2);
  ctx.fill();

  // Furrowed Angry Eyebrows
  ctx.strokeStyle = '#09100d';
  ctx.lineWidth = 2.2;
  ctx.beginPath();
  ctx.moveTo(eyeX - 3, -7.5);
  ctx.lineTo(eyeX + 2, -2.5);
  ctx.moveTo(eyeX + 2, 2.5);
  ctx.lineTo(eyeX - 3, 7.5);
  ctx.stroke();

  // Distinct Archetype Glasses & Protective Eyewear
  if (t.archetype === 'literature_chaser') {
    // Round tortoiseshell reading glasses with reflective glass glare
    ctx.strokeStyle = '#b45309';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.arc(eyeX, -4.5, 4.4, 0, Math.PI * 2);
    ctx.arc(eyeX, 4.5, 4.4, 0, Math.PI * 2);
    ctx.stroke();

    // Glasses bridge
    ctx.beginPath();
    ctx.moveTo(eyeX, -0.5);
    ctx.lineTo(eyeX, 0.5);
    ctx.stroke();

    // White glare glint across lenses
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(eyeX - 2, -6);
    ctx.lineTo(eyeX + 2, -3);
    ctx.moveTo(eyeX - 2, 3);
    ctx.lineTo(eyeX + 2, 6);
    ctx.stroke();
  } else if (t.archetype === 'math_sniper') {
    // Sharp angular cat-eye glasses with cyan targeting reticle glare
    ctx.strokeStyle = '#0284c7';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(eyeX - 2, -7.5);
    ctx.lineTo(eyeX + 3.5, -4.5);
    ctx.lineTo(eyeX - 2, -1.5);
    ctx.closePath();
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(eyeX - 2, 1.5);
    ctx.lineTo(eyeX + 3.5, 4.5);
    ctx.lineTo(eyeX - 2, 7.5);
    ctx.closePath();
    ctx.stroke();
  } else if (t.archetype === 'chem_lobber') {
    // Chunky industrial brass protective goggles with bubbling green lenses
    ctx.strokeStyle = '#78350f';
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.arc(eyeX, -4.5, 4.8, 0, Math.PI * 2);
    ctx.arc(eyeX, 4.5, 4.8, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = '#4ade80';
    ctx.beginPath();
    ctx.arc(eyeX, -4.5, 3.2, 0, Math.PI * 2);
    ctx.arc(eyeX, 4.5, 3.2, 0, Math.PI * 2);
    ctx.fill();
  }

  // Snarl / Grimacing Zombie Mouth with Rotten Teeth during Attack / Windup
  const isAttacking = t.state === 'windup' || t.state === 'active_attack';
  ctx.fillStyle = '#09100d';
  ctx.beginPath();
  if (isAttacking) {
    ctx.ellipse(headX + 5.5, 0, 3, 5, 0, 0, Math.PI * 2);
    ctx.fill();

    // Sharp jagged zombie teeth
    ctx.fillStyle = '#fef3c7';
    ctx.fillRect(headX + 4.5, -3, 2, 2);
    ctx.fillRect(headX + 4.5, 1, 2, 2);
  } else {
    // Stern grimace
    ctx.strokeStyle = '#09100d';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(headX + 4.5, -3);
    ctx.lineTo(headX + 6, 0);
    ctx.lineTo(headX + 4.5, 3);
    ctx.stroke();
  }
  }

  ctx.restore();

  // Health bar above damaged teacher / boss
  const isBoss = isBossArchetype(t.archetype);
  if (t.state !== 'ko' && (t.hp < t.maxHp || isBoss)) {
    const barW = isBoss ? 76 : 42;
    const ratio = Math.max(0, t.hp / t.maxHp);
    ctx.fillStyle = '#09100d';
    ctx.fillRect(-barW / 2 - 1, -t.radius - 17, barW + 2, 7);
    ctx.fillStyle = '#334155';
    ctx.fillRect(-barW / 2, -t.radius - 16, barW, 5);

    ctx.fillStyle = isBoss ? (t.bossPhase === 3 ? '#ef4444' : spec.accentColor) : '#ef4444';
    ctx.fillRect(-barW / 2, -t.radius - 16, barW * ratio, 5);
  }

  // Comic Speech Balloon for Teacher Barks
  if (t.quote && (t.quoteTimer ?? 0) > 0 && t.state !== 'ko') {
    ctx.save();
    ctx.font = "800 11px 'Russo One', sans-serif";
    const textW = ctx.measureText(t.quote).width;
    const bubbleW = textW + 18;
    const bubbleH = 22;
    const bubbleX = -bubbleW / 2;
    const bubbleY = -t.radius - 38;

    // Speech bubble background & amber border
    ctx.fillStyle = '#0f172a';
    ctx.strokeStyle = t.archetype === 'principal_boss' ? '#c084fc' : '#facc15';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(bubbleX, bubbleY, bubbleW, bubbleH, 6);
    ctx.fill();
    ctx.stroke();

    // Little triangular comic pointer beak pointing down at the teacher
    ctx.beginPath();
    ctx.moveTo(-4, bubbleY + bubbleH);
    ctx.lineTo(0, bubbleY + bubbleH + 6);
    ctx.lineTo(5, bubbleY + bubbleH);
    ctx.closePath();
    ctx.fillStyle = '#0f172a';
    ctx.fill();
    ctx.stroke();

    // Clean legible text inside bubble
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#fef08a';
    ctx.fillText(t.quote, 0, bubbleY + bubbleH / 2);
    ctx.restore();
  }

  ctx.restore();
}

function drawPlayerSurvivor(
  ctx: CanvasRenderingContext2D,
  player: PlayerState,
  elapsedTime: number
): void {
  ctx.save();
  ctx.translate(player.x, player.y);

  // Expanding Sonic School Bell Ultimate Shockwave Rings + Equalizer Bars + Shattering Glass + Tesla Arcs
  if (player.shockwaveVisualTimer > 0) {
    const progress = 1 - Math.min(1, player.shockwaveVisualTimer / 1.1); // 0.0 -> 1.0
    const fade = Math.max(0, 1 - progress);
    const rad = Math.max(28, ULTIMATE_RADIUS * Math.pow(progress, 0.72));
    ctx.save();

    // Outer Golden Acoustic Blast Wave
    ctx.strokeStyle = `rgba(250, 204, 21, ${fade * 0.96})`;
    ctx.fillStyle = `rgba(250, 204, 21, ${fade * 0.18})`;
    ctx.lineWidth = 11 * fade + 2.5;
    ctx.beginPath();
    ctx.arc(0, 0, rad, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // 32 Radial Acoustic Equalizer Spikes around the Shockwave Perimeter
    for (let eq = 0; eq < 32; eq++) {
      const eqAng = (eq * Math.PI * 2) / 32 + elapsedTime * 3.2;
      const barLen = 16 + Math.abs(Math.sin(elapsedTime * 32 + eq * 1.7)) * 30 * fade;
      ctx.strokeStyle = eq % 2 === 0 ? `rgba(254, 240, 138, ${fade * 0.92})` : `rgba(232, 121, 249, ${fade * 0.88})`;
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.moveTo(Math.cos(eqAng) * (rad - barLen * 0.4), Math.sin(eqAng) * (rad - barLen * 0.4));
      ctx.lineTo(Math.cos(eqAng) * (rad + barLen * 0.65), Math.sin(eqAng) * (rad + barLen * 0.65));
      ctx.stroke();
    }

    // Inner Magenta & Cyan Harmonic Ripple Rings
    ctx.strokeStyle = `rgba(232, 121, 249, ${fade * 0.92})`;
    ctx.lineWidth = 6 * fade + 1.5;
    ctx.beginPath();
    ctx.arc(0, 0, rad * 0.74, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = `rgba(56, 189, 248, ${fade * 0.88})`;
    ctx.lineWidth = 3.5 * fade + 1;
    ctx.beginPath();
    ctx.arc(0, 0, rad * 0.46, 0, Math.PI * 2);
    ctx.stroke();

    // Spinning Shattered Glass Shards flying outward from the 200dB shockwave
    for (let gs = 0; gs < 12; gs++) {
      const gAng = (gs * Math.PI * 2) / 12 + progress * 1.4;
      const gDist = 35 + progress * (ULTIMATE_RADIUS * 0.88);
      const gx = Math.cos(gAng) * gDist;
      const gy = Math.sin(gAng) * gDist;
      ctx.save();
      ctx.translate(gx, gy);
      ctx.rotate(gAng + elapsedTime * 9 + gs);
      ctx.fillStyle = `rgba(224, 242, 254, ${fade * 0.78})`;
      ctx.strokeStyle = `rgba(254, 240, 138, ${fade * 0.9})`;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(0, -8 * fade);
      ctx.lineTo(7 * fade, 4 * fade);
      ctx.lineTo(-6 * fade, 6 * fade);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }

    // Floating Golden Musical Notes ("♪", "♫", "𝄞") orbiting outward
    ctx.font = "900 20px 'Russo One', sans-serif";
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const notes = ['♪', '♫', '𝄞', '♬', '♪', '♫'];
    for (let n = 0; n < notes.length; n++) {
      const nAng = (n * Math.PI * 2) / notes.length + progress * 2.4;
      const nDist = 42 + progress * 165;
      const nx = Math.cos(nAng) * nDist;
      const ny = Math.sin(nAng) * nDist - Math.sin(elapsedTime * 16 + n) * 8;
      ctx.fillStyle = '#09100d';
      ctx.fillText(notes[n], nx + 2, ny + 2);
      ctx.fillStyle = n % 2 === 0 ? '#fef08a' : '#f472b6';
      ctx.fillText(notes[n], nx, ny);
    }

    ctx.restore();
  }

  // CYBERPUNK SANDEVISTAN NEURAL CHRONO-FIELD AURA & HOLOGRAPHIC CLOCK DIAL
  if (player.sandevistanTimer > 0) {
    const timeElapsedInStop = 6.5 - player.sandevistanTimer;
    const isActivating = timeElapsedInStop < 0.65;
    const actP = Math.min(1, timeElapsedInStop / 0.65);

    ctx.save();
    if (isActivating) {
      const pulseRad = 24 + actP * 280;
      ctx.strokeStyle = `rgba(0, 255, 157, ${(1 - actP) * 0.88})`;
      ctx.lineWidth = 6 * (1 - actP) + 1.5;
      ctx.beginPath();
      ctx.arc(0, 0, pulseRad, 0, Math.PI * 2);
      ctx.stroke();

      ctx.strokeStyle = `rgba(0, 240, 255, ${(1 - actP) * 0.72})`;
      ctx.lineWidth = 3 * (1 - actP) + 1;
      ctx.beginPath();
      ctx.arc(0, 0, pulseRad * 0.68, 0, Math.PI * 2);
      ctx.stroke();
    }

    const fieldRad = 52 + Math.sin(elapsedTime * 10) * 3;
    const fieldGrad = ctx.createRadialGradient(0, 0, 6, 0, 0, fieldRad);
    fieldGrad.addColorStop(0, 'rgba(0, 255, 157, 0.28)');
    fieldGrad.addColorStop(0.65, 'rgba(0, 240, 255, 0.16)');
    fieldGrad.addColorStop(1, 'rgba(0, 240, 255, 0)');
    ctx.fillStyle = fieldGrad;
    ctx.beginPath();
    ctx.arc(0, 0, fieldRad, 0, Math.PI * 2);
    ctx.fill();

    // Holographic Chrono-Clock Dial ticks (12 hour markers) + frozen clock hands beneath player
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.65)';
    ctx.lineWidth = 1.8;
    for (let h = 0; h < 12; h++) {
      const hAng = (h * Math.PI * 2) / 12;
      const innerT = h % 3 === 0 ? fieldRad - 13 : fieldRad - 9;
      ctx.beginPath();
      ctx.moveTo(Math.cos(hAng) * innerT, Math.sin(hAng) * innerT);
      ctx.lineTo(Math.cos(hAng) * (fieldRad - 3), Math.sin(hAng) * (fieldRad - 3));
      ctx.stroke();
    }
    // Frozen minute & second hands twitching with chrono tension
    const secAng = -Math.PI / 2 + Math.floor(timeElapsedInStop * 4) * (Math.PI / 6);
    ctx.strokeStyle = 'rgba(0, 255, 157, 0.85)';
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(Math.cos(secAng) * (fieldRad - 10), Math.sin(secAng) * (fieldRad - 10));
    ctx.stroke();

    ctx.strokeStyle = 'rgba(0, 255, 157, 0.82)';
    ctx.lineWidth = 2.2;
    ctx.setLineDash([8, 6]);
    ctx.lineDashOffset = -elapsedTime * 36;
    ctx.beginPath();
    ctx.arc(0, 0, fieldRad - 3, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();
  }

  // Shield energy aura with rotating segments
  if (player.shield > 0) {
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.82)';
    ctx.fillStyle = 'rgba(56, 189, 248, 0.14)';
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.arc(0, 0, player.radius + 9.5 + Math.sin(elapsedTime * 6) * 1.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }

  if (player.overdriveTimer > 0) {
    ctx.strokeStyle = '#fb7185';
    ctx.lineWidth = 2.8;
    ctx.beginPath();
    ctx.arc(0, 0, player.radius + 13.5, 0, Math.PI * 2);
    ctx.stroke();
  }

  const playerPose = computePlayerAnimPose(player, elapsedTime);
  const playerSpeed = Math.hypot(player.vx, player.vy);
  const isMoving = playerSpeed > 12;

  ctx.globalAlpha = playerPose.alpha;
  ctx.rotate(playerPose.bodyTilt);
  ctx.scale(player.scaleX * playerPose.scaleX, player.scaleY * playerPose.scaleY);

  // Ground drop shadow
  ctx.fillStyle = 'rgba(0, 0, 0, 0.56)';
  ctx.beginPath();
  ctx.ellipse(0, player.radius * 0.84, player.radius * 1.12, player.radius * 0.58, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.rotate(player.angle + playerPose.weaponRaiseAngle * 0.4);
  ctx.translate(playerPose.bodyLeanX, playerPose.bodySwayY);

  // 1. High-Detail Retro Sneakers with Articulated Stride Dynamics from Animation Pose Engine
  const footSwing = playerPose.leftFootStride;
  const rightFootSwing = playerPose.rightFootStride;

  // Left & Right Shoes Drop Shadows
  ctx.fillStyle = 'rgba(0, 0, 0, 0.42)';
  ctx.beginPath();
  ctx.ellipse(footSwing - 1, -player.radius * 0.72 + 2, 8, 4.5, 0, 0, Math.PI * 2);
  ctx.ellipse(rightFootSwing - 1, player.radius * 0.72 - 2, 8, 4.5, 0, 0, Math.PI * 2);
  ctx.fill();

  // Shoe base black contours
  ctx.fillStyle = '#09100d';
  ctx.beginPath();
  ctx.roundRect(footSwing - 6, -player.radius * 0.72 - 2, 14, 8, 3.5);
  ctx.roundRect(rightFootSwing - 6, player.radius * 0.72 - 6, 14, 8, 3.5);
  ctx.fill();

  // Red canvas uppers
  ctx.fillStyle = '#dc2626';
  ctx.beginPath();
  ctx.roundRect(footSwing - 5, -player.radius * 0.72 - 1, 9, 6, 2.5);
  ctx.roundRect(-footSwing - 5, player.radius * 0.72 - 5, 9, 6, 2.5);
  ctx.fill();

  // White rubber toe caps
  ctx.fillStyle = '#f8fafc';
  ctx.beginPath();
  ctx.roundRect(footSwing + 2.5, -player.radius * 0.72 - 1, 4.5, 6, 2);
  ctx.roundRect(-footSwing + 2.5, player.radius * 0.72 - 5, 4.5, 6, 2);
  ctx.fill();

  // White criss-cross laces
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(footSwing - 3, -player.radius * 0.72 + 0.5);
  ctx.lineTo(footSwing + 1, -player.radius * 0.72 + 3.5);
  ctx.moveTo(footSwing + 1, -player.radius * 0.72 + 0.5);
  ctx.lineTo(footSwing - 3, -player.radius * 0.72 + 3.5);

  ctx.moveTo(-footSwing - 3, player.radius * 0.72 - 3.5);
  ctx.lineTo(-footSwing + 1, player.radius * 0.72 - 0.5);
  ctx.moveTo(-footSwing + 1, player.radius * 0.72 - 3.5);
  ctx.lineTo(-footSwing - 3, player.radius * 0.72 - 0.5);
  ctx.stroke();

  // 2. Flowing Action Headband Ribbon Tails with Custom Skin Color
  const activeSkin = SKIN_SPECS.find((s) => s.id === player.skinId) ?? SKIN_SPECS[0];
  const wave1 = Math.sin(elapsedTime * 14 - player.walkDistance * 0.12) * 5.5;
  const wave2 = Math.cos(elapsedTime * 12 - player.walkDistance * 0.12) * 5.5;

  // Dark shadow ribbon underneath
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.45)';
  ctx.lineWidth = 5;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(-player.radius * 0.55, -2);
  ctx.quadraticCurveTo(-player.radius - 10, -6 + wave1, -player.radius - 23, -8 + wave2);
  ctx.moveTo(-player.radius * 0.55, 4);
  ctx.quadraticCurveTo(-player.radius - 10, 10 + wave2, -player.radius - 22, 13 + wave1);
  ctx.stroke();

  // Black ink outline
  ctx.strokeStyle = '#09100d';
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.moveTo(-player.radius * 0.55, -3.5);
  ctx.quadraticCurveTo(-player.radius - 10, -8 + wave1, -player.radius - 22, -10 + wave2);
  ctx.moveTo(-player.radius * 0.55, 3.5);
  ctx.quadraticCurveTo(-player.radius - 10, 8 + wave2, -player.radius - 21, 11 + wave1);
  ctx.stroke();

  // Silk ribbon in equipped skin headband color
  ctx.strokeStyle = activeSkin.headbandColor;
  ctx.lineWidth = 3.8;
  ctx.beginPath();
  ctx.moveTo(-player.radius * 0.55, -3.5);
  ctx.quadraticCurveTo(-player.radius - 10, -8 + wave1, -player.radius - 22, -10 + wave2);
  ctx.moveTo(-player.radius * 0.55, 3.5);
  ctx.quadraticCurveTo(-player.radius - 10, 8 + wave2, -player.radius - 21, 11 + wave1);
  ctx.stroke();

  // Light cloth sheen line
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 1.0;
  ctx.beginPath();
  ctx.moveTo(-player.radius * 0.55, -4);
  ctx.quadraticCurveTo(-player.radius - 10, -8.5 + wave1, -player.radius - 18, -10.5 + wave2);
  ctx.stroke();

  // 3. Tactical School Backpack + Ultimate Equipment Lockups
  if (player.ultimateId === 'shadow_ninja') {
    // Detailed Lacquered Black & Crimson Katana Scabbard (Saya) strapped diagonally across back
    ctx.save();
    ctx.lineCap = 'round';
    // Outer black ink outline of Saya
    ctx.strokeStyle = '#09100d';
    ctx.lineWidth = 7.5;
    ctx.beginPath();
    ctx.moveTo(-player.radius - 13, -20);
    ctx.lineTo(-player.radius + 5, 21);
    ctx.stroke();

    // Deep crimson lacquered wood Saya body
    ctx.strokeStyle = '#be123c';
    ctx.lineWidth = 4.6;
    ctx.beginPath();
    ctx.moveTo(-player.radius - 13, -20);
    ctx.lineTo(-player.radius + 5, 21);
    ctx.stroke();

    // Golden Kojiri (scabbard tip cap) & Kurikata (cord ring)
    ctx.strokeStyle = '#facc15';
    ctx.lineWidth = 4.6;
    ctx.beginPath();
    ctx.moveTo(-player.radius + 3, 17);
    ctx.lineTo(-player.radius + 5, 21);
    ctx.moveTo(-player.radius - 6, -5);
    ctx.lineTo(-player.radius - 5, -2.5);
    ctx.stroke();

    // Only draw the Katana Tsuka (handle) & Tsuba in the scabbard when NOT actively unsheathed!
    if (player.ninjaSlashTimer <= 0) {
      // Golden Dragon Tsuba (handguard)
      ctx.fillStyle = '#09100d';
      ctx.beginPath();
      ctx.arc(-player.radius - 13, -20, 5.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#facc15';
      ctx.beginPath();
      ctx.arc(-player.radius - 13, -20, 4.2, 0, Math.PI * 2);
      ctx.fill();

      // Diamond-braided Crimson & Black Tsuka Hilt protruding above shoulder
      ctx.strokeStyle = '#09100d';
      ctx.lineWidth = 6.2;
      ctx.beginPath();
      ctx.moveTo(-player.radius - 13, -20);
      ctx.lineTo(-player.radius - 21, -30);
      ctx.stroke();

      ctx.strokeStyle = '#f43f5e';
      ctx.lineWidth = 3.8;
      ctx.beginPath();
      ctx.moveTo(-player.radius - 13, -20);
      ctx.lineTo(-player.radius - 21, -30);
      ctx.stroke();

      // White Ito diamond wrap knots & golden Kashira pommel
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(-player.radius - 17, -25, 2.5, 2.5);
      ctx.fillRect(-player.radius - 20, -28.5, 2.5, 2.5);
      ctx.fillStyle = '#facc15';
      ctx.beginPath();
      ctx.arc(-player.radius - 21.5, -30.5, 2.6, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  } else if (player.ultimateId === 'sonic_bell') {
    // Golden School Bell talisman dangling from backpack strap
    ctx.fillStyle = '#facc15';
    ctx.strokeStyle = '#09100d';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(-player.radius - 9, -15, 4.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(-player.radius - 10, -16, 1.5, 0, Math.PI * 2);
    ctx.fill();
  }

  // 4. Hand-Painted 2.5D Top-Down ("вид с головы") Survivor Character Sprite (with Unlockable Skin Variants & Hit-Flash!)
  const skinSpriteKey =
    player.skinId === 'cyber_punk'
      ? 'skin_cyber_punk'
      : player.skinId === 'shadow_shinobi'
      ? 'skin_shadow_shinobi'
      : player.skinId === 'bio_chemist'
      ? 'skin_bio_chemist'
      : player.skinId === 'golden_graduate'
      ? 'skin_golden_graduate'
      : 'player_torso';
  const playerTorsoSprite = getCachedSprite(
    skinSpriteKey,
    player.hitFlashTimer > 0 ? 'hit' : 'normal'
  );
  const rec = -player.recoilOffset;
  const hasMod = (modId: string) => player.weaponMods?.includes(modId as never) ?? false;

  if (playerTorsoSprite) {
    ctx.save();
    const pSize = player.radius * 3.25;
    ctx.drawImage(
      playerTorsoSprite,
      -pSize * 0.5 + rec * 0.35,
      -pSize * 0.5,
      pSize,
      pSize
    );
    ctx.restore();
  } else {
    // Fallback Backpack & Torso only when sprite is still loading
    ctx.fillStyle = '#09100d';
    ctx.beginPath();
    ctx.roundRect(-player.radius - 8, -13.5, 15, 27, 5);
    ctx.fill();

    ctx.fillStyle = '#be123c';
    ctx.beginPath();
    ctx.roundRect(-player.radius - 7, -12.5, 13.5, 25, 4.5);
    ctx.fill();

    ctx.fillStyle = '#09100d';
    ctx.beginPath();
    ctx.ellipse(-1, 0, player.radius * 0.9 + 2.5, player.radius + 3, 0, 0, Math.PI * 2);
    ctx.fill();

    const jacketGrad = ctx.createRadialGradient(-3, -4, 2, -1, 0, player.radius + 2);
    jacketGrad.addColorStop(0, activeSkin.sleeveColor);
    jacketGrad.addColorStop(0.5, activeSkin.jacketColor);
    jacketGrad.addColorStop(1, '#09100d');
    ctx.fillStyle = jacketGrad;
    ctx.beginPath();
    ctx.ellipse(-1, 0, player.radius * 0.9, player.radius + 2, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  if (player.ninjaSlashTimer > 0) {
    // =========================================================================
    // FULL-BODY IN-WORLD CHARACTER ANIMATION: SHADOW NINJA CURSED KATANA!
    // =========================================================================
    const totalDur = 1.65;
    const animT = 1 - Math.min(1, player.ninjaSlashTimer / totalDur); // 0.0 -> 1.0

    // 1. Swirling Dark Crimson Shadow Vortex & Rising Flame Aura under the Character
    ctx.save();
    const vortexGrad = ctx.createRadialGradient(0, 0, 4, 0, 0, 56);
    vortexGrad.addColorStop(0, 'rgba(244, 63, 94, 0.48)');
    vortexGrad.addColorStop(0.55, 'rgba(15, 23, 42, 0.65)');
    vortexGrad.addColorStop(1, 'rgba(15, 23, 42, 0)');
    ctx.fillStyle = vortexGrad;
    ctx.beginPath();
    ctx.arc(0, 0, 56, 0, Math.PI * 2);
    ctx.fill();

    // Rotating shadow flame blades & Crimson Blood-Moon ring around character's feet
    ctx.strokeStyle = 'rgba(244, 63, 94, 0.55)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, 44, 0, Math.PI * 2);
    ctx.stroke();

    for (let fb = 0; fb < 8; fb++) {
      const fang = elapsedTime * 11 + (fb * Math.PI * 2) / 8;
      const fr = 28 + Math.sin(elapsedTime * 18 + fb) * 6;
      ctx.strokeStyle = fb % 2 === 0 ? '#f43f5e' : '#38bdf8';
      ctx.lineWidth = 2.8;
      ctx.beginPath();
      ctx.arc(0, 0, fr, fang, fang + 0.55);
      ctx.stroke();

      // Orbiting Crimson Sakura Petals
      const px = Math.cos(-fang * 1.2) * (36 + (fb % 3) * 6);
      const py = Math.sin(-fang * 1.2) * (36 + (fb % 3) * 6);
      ctx.fillStyle = fb % 3 === 0 ? '#fda4af' : '#f43f5e';
      ctx.beginPath();
      ctx.ellipse(px, py, 4.2, 2, fang, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    if (animT < 0.22) {
      // -----------------------------------------------------------------------
      // PHASE 1 (0.00 .. 0.22): IAIDO UNSHEATHING STANCE ("Стойка Иайдо")
      // Left hand grips scabbard at hip; Right hand pulls Katana out with Tsuba glint!
      // -----------------------------------------------------------------------
      const drawP = animT / 0.22; // 0 -> 1
      ctx.save();

      // Left arm gripping scabbard at left hip
      ctx.fillStyle = '#f8fafc';
      ctx.strokeStyle = '#09100d';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(-6, -18, 12, 6, 3);
      ctx.fill();
      ctx.stroke();

      // Lacquered Crimson Scabbard (Saya) held at left side
      ctx.strokeStyle = '#09100d';
      ctx.lineWidth = 7;
      ctx.beginPath();
      ctx.moveTo(-22, -22);
      ctx.lineTo(14, -14);
      ctx.stroke();
      ctx.strokeStyle = '#be123c';
      ctx.lineWidth = 4.2;
      ctx.beginPath();
      ctx.moveTo(-22, -22);
      ctx.lineTo(14, -14);
      ctx.stroke();

      // Emerging glowing Katana blade sliding out of the scabbard!
      const pullDist = drawP * 38;
      ctx.strokeStyle = '#f43f5e';
      ctx.lineWidth = 6.5;
      ctx.beginPath();
      ctx.moveTo(14, -14);
      ctx.lineTo(14 + pullDist, -14 + pullDist * 0.25);
      ctx.stroke();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2.8;
      ctx.beginPath();
      ctx.moveTo(14, -14);
      ctx.lineTo(14 + pullDist, -14 + pullDist * 0.25);
      ctx.stroke();

      // Right arm reaching across chest to pull the Tsuka handle
      const handX = 14 + pullDist;
      const handY = -14 + pullDist * 0.25;
      ctx.fillStyle = '#f8fafc';
      ctx.strokeStyle = '#09100d';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(4, 11);
      ctx.lineTo(handX, handY);
      ctx.stroke();

      // Golden Dragon Tsuba & Tsuka Handle in Right Hand
      ctx.fillStyle = '#facc15';
      ctx.beginPath();
      ctx.arc(handX, handY, 4.5, 0, Math.PI * 2);
      ctx.fill();

      // Spinning Golden Starburst Glint on the Scabbard Mouth!
      ctx.save();
      ctx.translate(14, -14);
      ctx.rotate(drawP * Math.PI * 2);
      const starScale = Math.sin(drawP * Math.PI) * 1.65;
      ctx.scale(starScale, starScale);
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.moveTo(-22, 0);
      ctx.lineTo(0, -4);
      ctx.lineTo(22, 0);
      ctx.lineTo(0, 4);
      ctx.closePath();
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(0, -22);
      ctx.lineTo(4, 0);
      ctx.lineTo(0, 22);
      ctx.lineTo(-4, 0);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#fef08a';
      ctx.beginPath();
      ctx.arc(0, 0, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      ctx.restore();
    } else if (animT < 0.82) {
      // -----------------------------------------------------------------------
      // PHASE 2 (0.22 .. 0.82): TWO-HANDED CURSED KATANA COMBO SWINGS!
      // Character swings the giant Cursed Katana in wide 250-degree arcs!
      // -----------------------------------------------------------------------
      const comboP = (animT - 0.22) / 0.6; // 0 -> 1
      // 4 rapid full-arc slashes during the combo window
      const slashCycle = comboP * 4;
      const slashIndex = Math.floor(slashCycle);
      const localP = slashCycle - slashIndex; // 0 -> 1 per slash
      const dir = slashIndex % 2 === 0 ? 1 : -1;
      const swingAngle =
        slashIndex === 3
          ? localP * Math.PI * 2 // 4th hit is a full 360-degree whirlwind spin!
          : dir * (-1.45 + localP * 2.9); // Wide 165-degree slash arc

      ctx.save();

      // Giant Sweeping Multi-Layered Blood-Moon Crescent Blade Wave around Character!
      const waveRadius = slashIndex === 3 ? 68 : 58;
      ctx.lineCap = 'round';
      ctx.strokeStyle = 'rgba(244, 63, 94, 0.85)';
      ctx.lineWidth = 22;
      ctx.beginPath();
      ctx.arc(6, 0, waveRadius, swingAngle - 1.35, swingAngle + 0.55);
      ctx.stroke();

      ctx.strokeStyle = slashIndex % 2 === 0 ? '#fda4af' : '#38bdf8';
      ctx.lineWidth = 9;
      ctx.beginPath();
      ctx.arc(8, 0, waveRadius + 2, swingAngle - 1.2, swingAngle + 0.5);
      ctx.stroke();

      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.arc(9, 0, waveRadius + 3, swingAngle - 1.05, swingAngle + 0.45);
      ctx.stroke();

      // Rotate character's arms & Cursed Katana with the swingAngle!
      ctx.rotate(swingAngle);

      // Both articulated arms extended forward gripping the Katana Tsuka
      ctx.fillStyle = '#09100d';
      ctx.beginPath();
      ctx.roundRect(2, -10, 16, 6.5, 3);
      ctx.roundRect(2, 3.5, 16, 6.5, 3);
      ctx.fill();
      ctx.fillStyle = '#f8fafc';
      ctx.beginPath();
      ctx.roundRect(3, -9, 13, 4.5, 2.5);
      ctx.roundRect(3, 4.5, 13, 4.5, 2.5);
      ctx.fill();

      // Gloved hands gripping the Tsuka handle together
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(14, -7, 5, 14);
      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.arc(18, -3.5, 2.8, 0, Math.PI * 2);
      ctx.arc(18, 3.5, 2.8, 0, Math.PI * 2);
      ctx.fill();

      // Diamond-Wrapped Crimson & Black Tsuka Handle
      ctx.fillStyle = '#be123c';
      ctx.strokeStyle = '#09100d';
      ctx.lineWidth = 2.2;
      ctx.fillRect(10, -3.2, 16, 6.4);
      ctx.strokeRect(10, -3.2, 16, 6.4);

      // Golden Kashira pommel & Dragon Tsuba Handguard
      ctx.fillStyle = '#facc15';
      ctx.fillRect(8, -3.5, 3, 7);
      ctx.fillRect(25, -10, 4.5, 20);
      ctx.strokeRect(25, -10, 4.5, 20);

      // Long Curved Cursed Katana Blade (66px long!) with Crimson Aura & White Edge
      ctx.fillStyle = 'rgba(244, 63, 94, 0.45)';
      ctx.beginPath();
      ctx.moveTo(29, -8);
      ctx.quadraticCurveTo(60, -12, 92, -18);
      ctx.lineTo(96, -8);
      ctx.quadraticCurveTo(60, 2, 29, 6);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = '#f43f5e';
      ctx.strokeStyle = '#09100d';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(29, -4.5);
      ctx.quadraticCurveTo(60, -7, 90, -13);
      ctx.lineTo(94, -7.5);
      ctx.quadraticCurveTo(60, -0.5, 29, 3.5);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Blinding White-Hot Razor Edge & Wavy Hamon Line
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.moveTo(29, -2.2);
      ctx.quadraticCurveTo(60, -4.5, 92, -10);
      ctx.lineTo(93.5, -7.5);
      ctx.quadraticCurveTo(60, -1, 29, 2.8);
      ctx.closePath();
      ctx.fill();

      ctx.restore();
    } else {
      // -----------------------------------------------------------------------
      // PHASE 3 (0.82 .. 1.00): CHIBURI & NOTO SHEATHING CLICK ("Возврат в Ножны")
      // Character smoothly slides the Katana back into the scabbard with a Tsuba star-flash!
      // -----------------------------------------------------------------------
      const sheatheP = (animT - 0.82) / 0.18; // 0 -> 1
      const remainLen = (1 - sheatheP) * 44;
      ctx.save();

      // Scabbard at left shoulder/hip
      ctx.strokeStyle = '#09100d';
      ctx.lineWidth = 7;
      ctx.beginPath();
      ctx.moveTo(-18, -20);
      ctx.lineTo(12, -14);
      ctx.stroke();
      ctx.strokeStyle = '#be123c';
      ctx.lineWidth = 4.2;
      ctx.beginPath();
      ctx.moveTo(-18, -20);
      ctx.lineTo(12, -14);
      ctx.stroke();

      // Blade sliding into scabbard
      if (remainLen > 2) {
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(12, -14);
        ctx.lineTo(12 + remainLen, -14 + remainLen * 0.2);
        ctx.stroke();
      }

      // Golden Tsuba clicking against scabbard mouth at end of sheathe
      const tsubaX = 12 + remainLen;
      const tsubaY = -14 + remainLen * 0.2;
      ctx.fillStyle = '#facc15';
      ctx.beginPath();
      ctx.arc(tsubaX, tsubaY, 4.8, 0, Math.PI * 2);
      ctx.fill();

      // Final "Clink!" Starburst when Tsuba locks into Scabbard
      if (sheatheP > 0.55) {
        const clickScale = Math.sin(((sheatheP - 0.55) / 0.45) * Math.PI) * 1.8;
        ctx.save();
        ctx.translate(12, -14);
        ctx.scale(clickScale, clickScale);
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.moveTo(-20, 0);
        ctx.lineTo(0, -3.5);
        ctx.lineTo(20, 0);
        ctx.lineTo(0, 3.5);
        ctx.closePath();
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(0, -20);
        ctx.lineTo(3.5, 0);
        ctx.lineTo(0, 20);
        ctx.lineTo(-3.5, 0);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      }

      ctx.restore();
    }
  } else if (player.shockwaveVisualTimer > 0) {
    // =========================================================================
    // FULL-BODY IN-WORLD CHARACTER ANIMATION: IMPERIAL SONIC SCHOOL BELL!
    // Character strikes a Conductor Stance and swings an Ornate 3D Ceremonial
    // Cast-Bronze & Gold School Bell with Crimson Velvet Bow & Acoustic Waves!
    // =========================================================================
    const bellProgress = 1 - Math.min(1, player.shockwaveVisualTimer / 1.1);
    const bellSwing = Math.sin(elapsedTime * 52) * 0.65;

    // 1. Left Arm braced in Heroic Conductor Pose near Ear/Headband
    ctx.save();
    ctx.fillStyle = '#09100d';
    ctx.beginPath();
    ctx.roundRect(-2, -19, 14, 7.5, 3.8);
    ctx.fill();
    ctx.fillStyle = '#f8fafc';
    ctx.beginPath();
    ctx.roundRect(-1, -18, 12, 5.5, 3);
    ctx.fill();
    ctx.fillStyle = '#f59e0b';
    ctx.beginPath();
    ctx.arc(11, -15.5, 3.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // 2. Right Arm Extended Swinging the Giant Ornate Ceremonial School Bell
    ctx.save();
    ctx.rotate(bellSwing);

    // Articulated right sleeve & glove
    ctx.fillStyle = '#09100d';
    ctx.beginPath();
    ctx.roundRect(2, 1, 19, 8.5, 4);
    ctx.fill();
    ctx.fillStyle = '#f8fafc';
    ctx.beginPath();
    ctx.roundRect(3, 2, 16, 6.5, 3);
    ctx.fill();
    ctx.fillStyle = '#0284c7';
    ctx.fillRect(15, 2, 2.5, 6.5);
    ctx.fillStyle = '#f59e0b';
    ctx.beginPath();
    ctx.arc(20, 5.2, 3.4, 0, Math.PI * 2);
    ctx.fill();

    // Translate to Bell Pivot in Hand
    ctx.translate(23, 5.2);

    // Ornate Turned Mahogany & Gold Handle (Baluster)
    ctx.fillStyle = '#7f1d1d';
    ctx.strokeStyle = '#09100d';
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.roundRect(-10, -3.5, 11, 7, 3);
    ctx.fill();
    ctx.stroke();

    // Golden handle pommel knob
    ctx.fillStyle = '#facc15';
    ctx.beginPath();
    ctx.arc(-10.5, 0, 3.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Flowing Crimson Velvet Ribbon Bow tied to the Bell Crown!
    const bowWave = Math.sin(elapsedTime * 36) * 4;
    ctx.fillStyle = '#e11d48';
    ctx.strokeStyle = '#09100d';
    ctx.lineWidth = 1.8;
    // Bow loops
    ctx.beginPath();
    ctx.ellipse(-1, -8, 6, 3.5, -0.4, 0, Math.PI * 2);
    ctx.ellipse(-1, 8, 6, 3.5, 0.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    // Flowing ribbon tails
    ctx.strokeStyle = '#f43f5e';
    ctx.lineWidth = 3.2;
    ctx.beginPath();
    ctx.moveTo(-1, -6);
    ctx.quadraticCurveTo(-8, -16 + bowWave, -15, -19 - bowWave);
    ctx.moveTo(-1, 6);
    ctx.quadraticCurveTo(-8, 16 - bowWave, -15, 19 + bowWave);
    ctx.stroke();

    // 3D Sculpted Cast-Bronze & Gold Flared Bell Body
    const bellGrad = ctx.createLinearGradient(0, -20, 0, 20);
    bellGrad.addColorStop(0, '#fef08a');
    bellGrad.addColorStop(0.28, '#facc15');
    bellGrad.addColorStop(0.65, '#ca8a04');
    bellGrad.addColorStop(1, '#854d0e');

    ctx.fillStyle = bellGrad;
    ctx.strokeStyle = '#09100d';
    ctx.lineWidth = 2.6;
    ctx.beginPath();
    ctx.moveTo(0, -8);
    ctx.quadraticCurveTo(10, -9, 22, -21);
    ctx.lineTo(24, -22);
    ctx.lineTo(24, 22);
    ctx.lineTo(22, 21);
    ctx.quadraticCurveTo(10, 9, 0, 8);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Engraved Filigree Gold Rim Bands & Specular Highlight Stripe
    ctx.strokeStyle = '#fef9c3';
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.moveTo(2, -4.5);
    ctx.quadraticCurveTo(11, -5.5, 21, -13);
    ctx.moveTo(18, -17);
    ctx.lineTo(18, 17);
    ctx.stroke();

    // Dark hollow acoustic interior of bell mouth
    ctx.fillStyle = '#451a03';
    ctx.beginPath();
    ctx.ellipse(23.5, 0, 3.5, 20, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#09100d';
    ctx.lineWidth = 1.8;
    ctx.stroke();

    // Swinging Inner Brass & Ruby Clapper Ball ("Язычок колокольчика")
    const clapperY = Math.sin(elapsedTime * 75) * 12;
    ctx.strokeStyle = '#fef08a';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(12, 0);
    ctx.lineTo(26, clapperY);
    ctx.stroke();

    ctx.fillStyle = '#f43f5e';
    ctx.strokeStyle = '#09100d';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(26.5, clapperY, 5.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(25, clapperY - 1.8, 1.8, 0, Math.PI * 2);
    ctx.fill();

    // Directional Golden Acoustic Soundwave Arcs Blasting Out of Bell Mouth!
    for (let w = 1; w <= 3; w++) {
      const waveDist = 28 + w * 11 + ((elapsedTime * 60) % 10);
      ctx.strokeStyle = w % 2 === 0 ? '#e879f9' : '#fef08a';
      ctx.lineWidth = 3.5 - w * 0.6;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.arc(18, 0, waveDist, -0.68, 0.68);
      ctx.stroke();
    }

    // Impact Star-Sparks when Clapper strikes Bell Rim
    if (Math.abs(clapperY) > 9.5 && bellProgress < 0.95) {
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(24, clapperY > 0 ? 18 : -18, 6, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  } else {
    {
      // =======================================================================
      // ARTICULATED ARMS, HANDS & HIGH-DETAIL 2.5D CUSTOM WEAPON MODELS
      // =======================================================================
      if (!playerTorsoSprite) {
        ctx.fillStyle = '#09100d';
        ctx.beginPath();
        ctx.roundRect(1 + rec, -13.5, 12.5, 7.5, 3.8);
        ctx.roundRect(1 + rec, 3.5, 13.5, 7.5, 3.8);
        ctx.fill();

        ctx.fillStyle = '#f8fafc';
        ctx.beginPath();
        ctx.roundRect(1.5 + rec, -12.5, 11, 5.5, 3);
        ctx.roundRect(1.5 + rec, 4.5, 12, 5.5, 3);
        ctx.fill();
      }

      ctx.save();
      ctx.translate(rec + (playerTorsoSprite ? 5 : 0), playerTorsoSprite ? -4.5 : 0);
      if (player.activeWeapon === 'slingshot') {
        // =====================================================================
        // 1. TURBO-SLINGSHOT "АРХИМЕД": Tactical Wrist-Brace Carbon/Birch Y-Frame,
        //    Stabilizer Weights, Holographic Crosshair Optic & Plasma Steel Nut!
        // =====================================================================
        // Forearm Carbon-Fiber Wrist Brace Support Struts
        ctx.strokeStyle = '#334155';
        ctx.lineWidth = 2.6;
        ctx.beginPath();
        ctx.moveTo(6, 0.5);
        ctx.lineTo(14, 4.5);
        ctx.moveTo(6, 9);
        ctx.lineTo(14, 4.5);
        ctx.stroke();

        // Heavy Sculpted Y-Fork Frame (Black Ink Contour + Laminated Birch/Carbon)
        ctx.strokeStyle = '#09100d';
        ctx.lineWidth = 7.5;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(11, 4.8);
        ctx.lineTo(26, -2.5);
        ctx.moveTo(11, 4.8);
        ctx.lineTo(26, 12.1);
        ctx.stroke();

        const forkGrad = ctx.createLinearGradient(11, -2, 26, 12);
        forkGrad.addColorStop(0, '#f59e0b');
        forkGrad.addColorStop(0.5, '#b45309');
        forkGrad.addColorStop(1, '#78350f');
        ctx.strokeStyle = forkGrad;
        ctx.lineWidth = 4.4;
        ctx.beginPath();
        ctx.moveTo(11, 4.8);
        ctx.lineTo(26, -2.5);
        ctx.moveTo(11, 4.8);
        ctx.lineTo(26, 12.1);
        ctx.stroke();

        // Forward Counter-Balance Stabilizer Rod & Brass Weight
        ctx.strokeStyle = '#64748b';
        ctx.lineWidth = 2.2;
        ctx.beginPath();
        ctx.moveTo(16, 4.8);
        ctx.lineTo(31, 4.8);
        ctx.stroke();
        ctx.fillStyle = '#facc15';
        ctx.strokeStyle = '#09100d';
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.arc(31.5, 4.8, 2.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Golden Anodized Cam Locks at Fork Tips
        ctx.fillStyle = '#facc15';
        ctx.beginPath();
        ctx.arc(26, -2.5, 3, 0, Math.PI * 2);
        ctx.arc(26, 12.1, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Dynamic Elastic Power-Bands (Snap forward when firing!)
        const pouchX = player.muzzleFlashTimer > 0 ? 25 : 14.5;
        ctx.strokeStyle = '#fef08a';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(26, -2.5);
        ctx.lineTo(pouchX, 4.8);
        ctx.lineTo(26, 12.1);
        ctx.stroke();

        // Leather Ammo Pouch & Glowing Heavy Steel Hex-Nut
        ctx.fillStyle = '#451a03';
        ctx.fillRect(pouchX - 2, 1.8, 4, 6);

        ctx.fillStyle = '#e2e8f0';
        ctx.strokeStyle = '#09100d';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(pouchX + 1.5, 4.8, 3.6, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Glowing cyan holographic sight dot on top of frame
        ctx.fillStyle = '#38bdf8';
        ctx.beginPath();
        ctx.arc(18, 1.2, 1.8, 0, Math.PI * 2);
        ctx.fill();

        // MOD VISUAL: slingshot_ricochet -> Golden Magnetic Ricochet Coils & Cyan Energy Band
        if (hasMod('slingshot_ricochet')) {
          ctx.strokeStyle = '#38bdf8';
          ctx.lineWidth = 2.2;
          ctx.beginPath();
          ctx.arc(26, -2.5, 4.8, 0, Math.PI * 2);
          ctx.arc(26, 12.1, 4.8, 0, Math.PI * 2);
          ctx.stroke();
          ctx.fillStyle = '#fde047';
          ctx.beginPath();
          ctx.arc(pouchX + 1.5, 4.8, 2.2, 0, Math.PI * 2);
          ctx.fill();
        }
      } else if (player.activeWeapon === 'shotgun') {
        // =====================================================================
        // 2. TWIN-BARREL BLUEPRINT SHOTGUN "ЧЕРТЕЖНИК-12": Heavy Over/Under &
        //    Side-by-Side Blued Steel Barrels, Walnut Stock, Shell Saddle & Brake!
        // =====================================================================
        // Outer Heavy Silhouette Outline
        ctx.fillStyle = '#09100d';
        ctx.beginPath();
        ctx.roundRect(2, -2.2, 32, 14, 3.2);
        ctx.fill();

        // Checkered Walnut Rear Stock & Receiver Grip
        ctx.fillStyle = '#78350f';
        ctx.fillRect(3.5, 0.5, 7, 8.6);

        // Brushed Gunmetal Receiver Box with Ejection Port
        const recGrad = ctx.createLinearGradient(9, -1, 9, 10);
        recGrad.addColorStop(0, '#94a3b8');
        recGrad.addColorStop(0.5, '#334155');
        recGrad.addColorStop(1, '#0f172a');
        ctx.fillStyle = recGrad;
        ctx.fillRect(9.5, -0.5, 8.5, 10.6);

        // 3 Red/Brass 12-Gauge Shotgun Shells mounted on Side Saddle!
        for (let sh = 0; sh < 3; sh++) {
          const sx = 10.5 + sh * 2.4;
          ctx.fillStyle = hasMod('shotgun_incendiary') ? '#f97316' : '#ef4444';
          ctx.fillRect(sx, 1.2, 1.7, 3.2);
          ctx.fillStyle = '#facc15';
          ctx.fillRect(sx, 4.4, 1.7, 1.4);
        }

        // Twin Heavy Blued-Steel Drafting Barrels with Top Ventilated Rib
        const barrelGrad = ctx.createLinearGradient(17, -1, 17, 10.5);
        barrelGrad.addColorStop(0, '#64748b');
        barrelGrad.addColorStop(0.35, '#1e293b');
        barrelGrad.addColorStop(0.65, '#475569');
        barrelGrad.addColorStop(1, '#0f172a');
        ctx.fillStyle = barrelGrad;
        ctx.fillRect(17.5, -0.4, 14.5, 4.8);
        ctx.fillRect(17.5, 5.2, 14.5, 4.8);

        // Ribbed Walnut Pump Forend (slides back on recoil!)
        const pumpShift = player.muzzleFlashTimer > 0 ? -2.8 : 0;
        ctx.fillStyle = '#92400e';
        ctx.strokeStyle = '#09100d';
        ctx.lineWidth = 1.4;
        ctx.fillRect(18.5 + pumpShift, -1.2, 8.5, 12);
        ctx.strokeRect(18.5 + pumpShift, -1.2, 8.5, 12);
        // Pump grip grooves
        ctx.strokeStyle = '#451a03';
        ctx.lineWidth = 1;
        for (let gx = 20 + pumpShift; gx <= 25 + pumpShift; gx += 2) {
          ctx.beginPath();
          ctx.moveTo(gx, -0.5);
          ctx.lineTo(gx, 10);
          ctx.stroke();
        }

        // Brass Drafting-Tube Barrel Clamps & Perforated Muzzle Brake at x=32
        ctx.fillStyle = '#facc15';
        ctx.fillRect(28, -0.6, 2.5, 10.8);
        ctx.fillStyle = hasMod('shotgun_incendiary') ? '#fb923c' : '#cbd5e1';
        ctx.fillRect(30.5, -0.2, 3, 10);

        // MOD VISUAL: shotgun_incendiary -> Red-Hot Thermal Heat Shield & Glowing Muzzle Ports
        if (hasMod('shotgun_incendiary')) {
          ctx.fillStyle = 'rgba(249, 115, 22, 0.55)';
          ctx.fillRect(26, -1.2, 7.5, 12);
          ctx.fillStyle = '#fef08a';
          ctx.fillRect(31.2, 1.0, 2, 2);
          ctx.fillRect(31.2, 6.6, 2, 2);
        }

        // Glowing Red Fiber-Optic Front Sight Bead
        ctx.fillStyle = '#fb7185';
        ctx.beginPath();
        ctx.arc(31, 4.8, 1.6, 0, Math.PI * 2);
        ctx.fill();
      } else if (player.activeWeapon === 'nailgun') {
        // =====================================================================
        // 3. HEAVY PNEUMATIC NAILGUN "ЦИРКУЛЬ-ПРО": Pressurized Air Tank,
        //    Hazard Yellow/Black Body, Rotary Spike Drum & Red Laser Sight!
        // =====================================================================
        // Red Under-Barrel Tactical Laser Sight Beam
        ctx.save();
        const laserGrad = ctx.createLinearGradient(32, 4.8, 95, 4.8);
        laserGrad.addColorStop(0, 'rgba(244, 63, 94, 0.75)');
        laserGrad.addColorStop(1, 'rgba(244, 63, 94, 0)');
        ctx.strokeStyle = laserGrad;
        ctx.lineWidth = hasMod('nailgun_hyper') ? 2.4 : 1.6;
        ctx.beginPath();
        ctx.moveTo(30, 4.8);
        ctx.lineTo(95, 4.8);
        ctx.stroke();
        ctx.restore();

        // Heavy Industrial Silhouette
        ctx.fillStyle = '#09100d';
        ctx.beginPath();
        ctx.roundRect(3, -1.8, 30, 13.2, 3);
        ctx.fill();

        // Rear High-Pressure Cyan Air Cylinder & Pressure Gauge
        ctx.fillStyle = hasMod('nailgun_hyper') ? '#e11d48' : '#0284c7';
        ctx.beginPath();
        ctx.roundRect(4.5, 0, 7.5, 9.6, 2.5);
        ctx.fill();
        ctx.fillStyle = '#e0f2fe';
        ctx.beginPath();
        ctx.arc(8, 4.8, 2.4, 0, Math.PI * 2);
        ctx.fill();

        // Industrial Yellow Receiver with Black Diagonal Hazard Stripes
        ctx.fillStyle = '#facc15';
        ctx.fillRect(12, 0.2, 15.5, 9.2);
        ctx.fillStyle = '#09100d';
        for (let hx = 13.5; hx <= 24; hx += 3.5) {
          ctx.beginPath();
          ctx.moveTo(hx, 0.2);
          ctx.lineTo(hx + 1.8, 0.2);
          ctx.lineTo(hx + 0.5, 9.4);
          ctx.lineTo(hx - 1.3, 9.4);
          ctx.closePath();
          ctx.fill();
        }

        // Top Transparent Rotary Compass-Spike Drum Magazine (spins when shooting!)
        const drumRot = elapsedTime * (hasMod('nailgun_hyper') ? 16 : 8) + (player.muzzleFlashTimer > 0 ? 1.5 : 0);
        ctx.fillStyle = '#09100d';
        ctx.beginPath();
        ctx.arc(18.5, 4.8, 6.2, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#1e293b';
        ctx.beginPath();
        ctx.arc(18.5, 4.8, 4.8, 0, Math.PI * 2);
        ctx.fill();

        // Copper-gold compass spikes visible inside rotary drum
        ctx.strokeStyle = '#fbbf24';
        ctx.lineWidth = 1.5;
        for (let sp = 0; sp < 6; sp++) {
          const sa = drumRot + (sp * Math.PI) / 3;
          ctx.beginPath();
          ctx.moveTo(18.5 + Math.cos(sa) * 1.5, 4.8 + Math.sin(sa) * 1.5);
          ctx.lineTo(18.5 + Math.cos(sa) * 4.4, 4.8 + Math.sin(sa) * 4.4);
          ctx.stroke();
        }
        ctx.fillStyle = hasMod('nailgun_hyper') ? '#f43f5e' : '#38bdf8';
        ctx.beginPath();
        ctx.arc(18.5, 4.8, 1.8, 0, Math.PI * 2);
        ctx.fill();

        // Reciprocating Steel Piston Muzzle Jaws at x=27..34
        const jawRec = player.muzzleFlashTimer > 0 ? -2.2 : 0;
        ctx.fillStyle = '#cbd5e1';
        ctx.fillRect(26.5 + jawRec, 1.0, 7.5, 2.4);
        ctx.fillRect(26.5 + jawRec, 6.2, 7.5, 2.4);
        // Loaded gleaming steel spike in chamber
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(28, 4.0, 6, 1.6);
      } else if (player.activeWeapon === 'acid') {
        // =====================================================================
        // 4. CHEM-LAB BIO-SPRAYER "ЦАРСКАЯ ВОДКА": Ribbed Borosilicate Glass Tank,
        //    Boiling Neon Acid, Pressure Regulator Dial & Brass Atomizer Nozzle!
        // =====================================================================
        // Outer Heavy Silhouette
        ctx.fillStyle = '#09100d';
        ctx.beginPath();
        ctx.roundRect(3, -2.5, 30, 14.6, 4);
        ctx.fill();

        // Corrugated Black Rubber Feed Hose from Backpack to Sprayer
        ctx.strokeStyle = hasMod('acid_volatile') ? '#a855f7' : '#1e293b';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(-2, 8);
        ctx.quadraticCurveTo(3, 12, 7, 8);
        ctx.stroke();

        // Borosilicate Glass Cylinder Tank Housing
        ctx.fillStyle = '#052e16';
        ctx.beginPath();
        ctx.roundRect(5.5, -1, 17, 11.6, 3);
        ctx.fill();

        // Sloshing Boiling Neon-Green Acid Fluid inside Glass Tank
        const slosh = Math.sin(elapsedTime * 10) * 1.2;
        const acidGrad = ctx.createLinearGradient(6, -0.5, 6, 10);
        acidGrad.addColorStop(0, '#ecfccb');
        acidGrad.addColorStop(0.35, hasMod('acid_volatile') ? '#d946ef' : '#a3e635');
        acidGrad.addColorStop(0.75, '#22c55e');
        acidGrad.addColorStop(1, '#15803d');
        ctx.fillStyle = acidGrad;
        ctx.beginPath();
        ctx.roundRect(6.5, 0 + slosh * 0.3, 15, 9.6, 2);
        ctx.fill();

        // Animated Rising Acid Bubbles inside Tank
        ctx.fillStyle = '#ffffff';
        for (let b = 0; b < 4; b++) {
          const bx = 8.5 + b * 3.3;
          const by = 4.8 + Math.sin(elapsedTime * 14 + b * 1.9) * 2.8;
          ctx.beginPath();
          ctx.arc(bx, by, 1.4 + (b % 2) * 0.5, 0, Math.PI * 2);
          ctx.fill();
        }

        // Steel Tank Reinforcement Ribs & specular glass reflection bar
        ctx.fillStyle = '#334155';
        ctx.fillRect(10.5, -1.2, 1.8, 12);
        ctx.fillRect(16.5, -1.2, 1.8, 12);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
        ctx.fillRect(7.5, 0.6, 13, 1.6);

        // Top Red Pressure-Release Valve Wheel
        ctx.fillStyle = '#ef4444';
        ctx.strokeStyle = '#09100d';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.arc(13.8, -2.2, 2.8, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Flared Brass Multi-Jet Dispersion Bell Nozzle at x=22.5..32.5
        const brassGrad = ctx.createLinearGradient(22, 0, 32, 10);
        brassGrad.addColorStop(0, '#fef08a');
        brassGrad.addColorStop(0.5, '#eab308');
        brassGrad.addColorStop(1, '#a16207');
        ctx.fillStyle = brassGrad;
        ctx.strokeStyle = '#09100d';
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.moveTo(22.5, 2.0);
        ctx.lineTo(32, -0.5);
        ctx.lineTo(32, 10.1);
        ctx.lineTo(22.5, 7.6);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Glowing Toxic Green Plasma-Slime Bead at Muzzle Tip (x=32.5, y=4.8)
        ctx.fillStyle = hasMod('acid_volatile') ? '#f0abfc' : '#bef264';
        ctx.beginPath();
        ctx.arc(32.5, 4.8, 2.6 + Math.sin(elapsedTime * 18) * 0.6, 0, Math.PI * 2);
        ctx.fill();
      } else {
        // =====================================================================
        // 5. HIGH-VOLTAGE GAUSS/TESLA CANNON "КАБИНЕТ ФИЗИКИ": Violet Plasma
        //    Vacuum Core, 4 Wound Copper Coils, Voltmeter & Twin Arc Claws!
        // =====================================================================
        // Outer Heavy Silhouette
        ctx.fillStyle = '#09100d';
        ctx.beginPath();
        ctx.roundRect(3, -2.5, 31, 14.6, 3.8);
        ctx.fill();

        // Heavy Dark-Steel & Deep-Violet Insulation Chassis
        const teslaChassis = ctx.createLinearGradient(5, -1.5, 5, 11);
        teslaChassis.addColorStop(0, '#4c1d95');
        teslaChassis.addColorStop(0.5, '#1e1b4b');
        teslaChassis.addColorStop(1, '#0f172a');
        ctx.fillStyle = teslaChassis;
        ctx.beginPath();
        ctx.roundRect(4.5, -1, 23.5, 11.6, 2.5);
        ctx.fill();

        // Blazing Central Cyan-Violet Plasma Vacuum Tube
        const coreGrad = ctx.createLinearGradient(7, 2, 7, 7.6);
        coreGrad.addColorStop(0, '#ffffff');
        coreGrad.addColorStop(0.5, '#38bdf8');
        coreGrad.addColorStop(1, '#c084fc');
        ctx.fillStyle = coreGrad;
        ctx.fillRect(7, 2.0, 20, 5.6);

        // 4 Heavy Wound Copper Solenoid Induction Coils with Gold Specular Rim
        for (const cx of [9.5, 14.2, 18.9, 23.6]) {
          ctx.fillStyle = hasMod('tesla_overcharge') ? '#38bdf8' : '#d97706';
          ctx.strokeStyle = '#09100d';
          ctx.lineWidth = 1.2;
          ctx.fillRect(cx - 1.4, -1.4, 2.8, 12.4);
          ctx.strokeRect(cx - 1.4, -1.4, 2.8, 12.4);
          ctx.fillStyle = '#fef08a';
          ctx.fillRect(cx - 0.6, 0, 1.2, 4);
        }

        // Rear Analog Voltmeter Dial on Top of Receiver
        ctx.fillStyle = '#fef9c3';
        ctx.strokeStyle = '#09100d';
        ctx.lineWidth = 1.3;
        ctx.beginPath();
        ctx.arc(6.8, 4.8, 2.6, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Twin Forward Chrome Electrode Claws at Muzzle (x=28..35)
        ctx.strokeStyle = '#e2e8f0';
        ctx.lineWidth = 2.6;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(27.5, 1.5);
        ctx.lineTo(34.5, -0.5);
        ctx.moveTo(27.5, 8.1);
        ctx.lineTo(34.5, 10.1);
        ctx.stroke();

        // Glowing Cyan Capacitor Tips on Claws
        ctx.fillStyle = '#38bdf8';
        ctx.beginPath();
        ctx.arc(34.5, -0.5, 2, 0, Math.PI * 2);
        ctx.arc(34.5, 10.1, 2, 0, Math.PI * 2);
        ctx.fill();

        // MOD VISUAL: tesla_overcharge -> Crackling High-Voltage Arc across Muzzle Claws
        if (hasMod('tesla_overcharge')) {
          ctx.strokeStyle = '#f0abfc';
          ctx.lineWidth = 1.8;
          ctx.beginPath();
          ctx.moveTo(34.5, -0.5);
          ctx.lineTo(36.5, 4.8 + Math.sin(elapsedTime * 45) * 2.5);
          ctx.lineTo(34.5, 10.1);
          ctx.stroke();
        }

        // Animated Crackling High-Voltage Lightning Arcs jumping between Claws!
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.moveTo(34, -0.2);
        ctx.lineTo(32.5 + Math.sin(elapsedTime * 38) * 3, 2.6);
        ctx.lineTo(35.5 - Math.cos(elapsedTime * 42) * 3, 6.8);
        ctx.lineTo(34, 9.8);
        ctx.stroke();

        ctx.strokeStyle = '#e879f9';
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.moveTo(33.5, 0.2);
        ctx.lineTo(35 + Math.cos(elapsedTime * 34) * 2.5, 4.8);
        ctx.lineTo(33.5, 9.4);
        ctx.stroke();
      }

      // Multi-Spike Muzzle Flash Starburst on Shot (Aligned with Barrel Tip x=32, y=4.8)
      if (player.muzzleFlashTimer > 0) {
        ctx.fillStyle = '#fef08a';
        ctx.beginPath();
        ctx.moveTo(31, 4.8);
        ctx.lineTo(49, -4.5);
        ctx.lineTo(41, 4.8);
        ctx.lineTo(54, 4.8);
        ctx.lineTo(41, 4.8);
        ctx.lineTo(49, 14.1);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(34.5, 4.8, 6.2, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    }
  }

  // 7. Volumetric Hero Head fallback (only when sprite is not yet loaded) + Ultimate Visor/Mask Overlays
  if (!playerTorsoSprite) {
    // Sculpted Ears
    ctx.fillStyle = '#09100d';
    ctx.beginPath();
    ctx.arc(0, -player.radius * 0.74, 4, 0, Math.PI * 2);
    ctx.arc(0, player.radius * 0.74, 4, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = player.hitFlashTimer > 0 ? '#ffffff' : '#f59e0b';
    ctx.beginPath();
    ctx.arc(0, -player.radius * 0.74, 3, 0, Math.PI * 2);
    ctx.arc(0, player.radius * 0.74, 3, 0, Math.PI * 2);
    ctx.fill();

    // Head base outline
    ctx.fillStyle = '#09100d';
    ctx.beginPath();
    ctx.arc(1, 0, player.radius * 0.76 + 2.5, 0, Math.PI * 2);
    ctx.fill();

    // Volumetric Face Shading
    const playerSkinGrad = ctx.createRadialGradient(3, -2, 1, 1, 0, player.radius * 0.76);
    playerSkinGrad.addColorStop(0, player.hitFlashTimer > 0 ? '#ffffff' : '#fef08a');
    playerSkinGrad.addColorStop(0.6, player.hitFlashTimer > 0 ? '#ffffff' : '#fcd34d');
    playerSkinGrad.addColorStop(1, player.hitFlashTimer > 0 ? '#f1f5f9' : '#d97706');
    ctx.fillStyle = playerSkinGrad;
    ctx.beginPath();
    ctx.arc(1, 0, player.radius * 0.76, 0, Math.PI * 2);
    ctx.fill();
  }

  const heroEyeX = 7.8;
  if (player.ninjaSlashTimer > 0) {
    // Streaming crimson Sharingan eye-glow trails during Cursed Katana Ultimate
    ctx.fillStyle = '#f43f5e';
    ctx.beginPath();
    ctx.arc(heroEyeX + 0.4, -4.6, 3.0, 0, Math.PI * 2);
    ctx.arc(heroEyeX + 0.4, 4.6, 3.0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#f43f5e';
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.moveTo(heroEyeX, -4.6);
    ctx.lineTo(-8, -9 - Math.sin(elapsedTime * 28) * 3);
    ctx.moveTo(heroEyeX, 4.6);
    ctx.lineTo(-8, 9 + Math.cos(elapsedTime * 28) * 3);
    ctx.stroke();
  } else if (player.sandevistanTimer > 0) {
    // Streaming neon emerald/cyan optic trails during Sandevistan Time-Stop
    ctx.strokeStyle = '#00ff9d';
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.moveTo(7, -5);
    ctx.lineTo(-9, -8 - Math.sin(elapsedTime * 30) * 2.5);
    ctx.moveTo(7, 5);
    ctx.lineTo(-9, 8 + Math.cos(elapsedTime * 30) * 2.5);
    ctx.stroke();
  }

  ctx.restore();
}

function drawOffscreenThreatIndicators(
  ctx: CanvasRenderingContext2D,
  player: PlayerState,
  teachers: ZombieTeacher[],
  viewW: number,
  viewH: number,
  camX: number,
  camY: number
): void {
  const halfW = viewW / 2 - 36;
  const halfH = viewH / 2 - 36;
  for (const t of teachers) {
    if (t.state === 'ko') continue;
    const dx = t.x - camX;
    const dy = t.y - camY;
    if (Math.abs(dx) > halfW || Math.abs(dy) > halfH) {
      const ang = Math.atan2(t.y - player.y, t.x - player.x);
      const indX = player.x + Math.cos(ang) * 74;
      const indY = player.y + Math.sin(ang) * 74;
      ctx.save();
      ctx.translate(indX, indY);
      ctx.rotate(ang);
      ctx.fillStyle = t.archetype === 'principal_boss' ? '#c084fc' : '#fb7185';
      ctx.strokeStyle = '#09100d';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(7, 0);
      ctx.lineTo(-5, -5);
      ctx.lineTo(-2, 0);
      ctx.lineTo(-5, 5);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }
  }
}

function drawProjectileWithTrail(
  ctx: CanvasRenderingContext2D,
  p: ProjectileEntity,
  elapsedTime: number,
  isTimeStopped = false
): void {
  ctx.save();

  if (isTimeStopped) {
    // Frozen in Sandevistan Time-Stop: draw holographic trajectory vector line & pulsing stasis ring!
    if (p.fromPlayer) {
      const aimLen = p.weaponKind === 'shotgun' ? 110 : 160;
      const aimX = p.x + Math.cos(p.angle) * aimLen;
      const aimY = p.y + Math.sin(p.angle) * aimLen;

      ctx.save();
      ctx.strokeStyle = '#00ff9d';
      ctx.globalAlpha = 0.65;
      ctx.lineWidth = 2.2;
      ctx.setLineDash([8, 6]);
      ctx.lineDashOffset = -elapsedTime * 40;
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
      ctx.lineTo(aimX, aimY);
      ctx.stroke();
      ctx.setLineDash([]);

      // Targeting arrow at tip of trajectory preview
      ctx.translate(aimX, aimY);
      ctx.rotate(p.angle);
      ctx.fillStyle = '#00f0ff';
      ctx.globalAlpha = 0.9;
      ctx.beginPath();
      ctx.moveTo(6, 0);
      ctx.lineTo(-4, -4);
      ctx.lineTo(-4, 4);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }

    // Pulsing Chrono-Stasis Ring around the suspended bullet
    const pulse = 1 + 0.18 * Math.sin(elapsedTime * 14 + p.spin);
    ctx.strokeStyle = p.fromPlayer ? '#00ff9d' : '#ff007f';
    ctx.lineWidth = 2.4;
    ctx.globalAlpha = 0.95;
    ctx.beginPath();
    ctx.arc(p.x, p.y, (p.radius + 6) * pulse, 0, Math.PI * 2);
    ctx.stroke();
    ctx.globalAlpha = 1;
  } else {
    // ULTRA-VISIBLE MULTI-LAYERED LUMINOUS TRACER BEAM (High-Contrast for fast tracking)
    const baseTail =
      p.weaponKind === 'tesla'
        ? 88
        : p.weaponKind === 'nailgun'
        ? 74
        : p.weaponKind === 'shotgun'
        ? 48
        : p.weaponKind === 'enemy_ruler'
        ? 62
        : p.isHeavy
        ? 58
        : 52;
    const tailLen = p.wasTimeStopped ? baseTail * 1.85 : baseTail;
    const tx = p.x - Math.cos(p.angle) * tailLen;
    const ty = p.y - Math.sin(p.angle) * tailLen;

    if (p.weaponKind === 'tesla') {
      // Crackling continuous electric lightning discharge beam
      drawJaggedLightning(ctx, tx, ty, p.x, p.y, '#f5d0fe', 5);
      drawJaggedLightning(ctx, tx, ty, p.x, p.y, '#c084fc', 3.5);
      drawJaggedLightning(ctx, tx, ty, p.x, p.y, '#ffffff', 1.8);
    } else {
      const trailColor = p.wasTimeStopped ? '#00ff9d' : p.color;

      // Layer 1: Wide Soft Ambient Glow Trail
      ctx.save();
      ctx.strokeStyle = trailColor;
      ctx.lineWidth = Math.max(9, p.radius * 2.6);
      ctx.lineCap = 'round';
      ctx.globalAlpha = 0.42;
      ctx.beginPath();
      ctx.moveTo(tx, ty);
      ctx.lineTo(p.x, p.y);
      ctx.stroke();

      // Layer 2: Core Saturated Laser Beam
      ctx.strokeStyle = p.wasTimeStopped ? '#00f0ff' : trailColor;
      ctx.lineWidth = Math.max(4.5, p.radius * 1.35);
      ctx.globalAlpha = 0.92;
      ctx.beginPath();
      ctx.moveTo(tx, ty);
      ctx.lineTo(p.x, p.y);
      ctx.stroke();

      // Layer 3: High-Intensity Pure White-Hot Core Filament (Unmissable against any floor!)
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = Math.max(2.2, p.radius * 0.55);
      ctx.globalAlpha = 1.0;
      ctx.beginPath();
      ctx.moveTo(tx + Math.cos(p.angle) * (tailLen * 0.35), ty + Math.sin(p.angle) * (tailLen * 0.35));
      ctx.lineTo(p.x, p.y);
      ctx.stroke();
      ctx.restore();
    }
  }

  // LUMINOUS RADIAL BLOOM CORONA (Glowing orb around every bullet)
  const haloRadius = Math.max(16, p.radius * 2.8);
  const haloGrad = ctx.createRadialGradient(p.x, p.y, 1, p.x, p.y, haloRadius);
  haloGrad.addColorStop(0, 'rgba(255, 255, 255, 0.95)');
  haloGrad.addColorStop(0.32, p.color);
  haloGrad.addColorStop(0.68, p.color);
  haloGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.save();
  ctx.globalAlpha = 0.78;
  ctx.fillStyle = haloGrad;
  ctx.beginPath();
  ctx.arc(p.x, p.y, haloRadius, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  ctx.translate(p.x, p.y);

  // HIGH-CONTRAST BULLET SPRITES PER WEAPON
  if (p.weaponKind === 'slingshot') {
    // Large Spinning Golden Hex Nut (гайка) with Metallic Sheen & White Spark
    ctx.rotate(p.spin);

    // Golden metallic faceted hex nut
    ctx.fillStyle = '#fde047';
    ctx.strokeStyle = '#09100d';
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const a = (i * Math.PI) / 3;
      const rx = Math.cos(a) * (p.radius + 2);
      const ry = Math.sin(a) * (p.radius + 2);
      if (i === 0) ctx.moveTo(rx, ry);
      else ctx.lineTo(rx, ry);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Inner bevel rim
    ctx.fillStyle = '#f59e0b';
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const a = (i * Math.PI) / 3;
      const rx = Math.cos(a) * p.radius;
      const ry = Math.sin(a) * p.radius;
      if (i === 0) ctx.moveTo(rx, ry);
      else ctx.lineTo(rx, ry);
    }
    ctx.closePath();
    ctx.fill();

    // Center threaded hole with brilliant white spark
    ctx.fillStyle = '#09100d';
    ctx.beginPath();
    ctx.arc(0, 0, p.radius * 0.42, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(-1, -1, p.radius * 0.35, 0, Math.PI * 2);
    ctx.fill();
  } else if (p.weaponKind === 'shotgun') {
    // Blazing Rose-Orange Fiery Buckshot Pellet with White-Hot Core
    ctx.rotate(p.spin);

    // Outer flame aura
    ctx.fillStyle = '#f43f5e';
    ctx.strokeStyle = '#09100d';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, p.radius + 1.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Fiery amber core
    ctx.fillStyle = '#f59e0b';
    ctx.beginPath();
    ctx.arc(0, 0, p.radius * 0.75, 0, Math.PI * 2);
    ctx.fill();

    // Pure white-hot center
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(-0.8, -0.8, p.radius * 0.45, 0, Math.PI * 2);
    ctx.fill();
  } else if (p.weaponKind === 'nailgun') {
    // Razor-Sharp High-Tech Cyan Drafting Compass Dart (24px Length)
    ctx.rotate(p.angle);

    // Dart outer silhouette
    ctx.fillStyle = '#0284c7';
    ctx.strokeStyle = '#09100d';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(13, 0);
    ctx.lineTo(-9, -6.5);
    ctx.lineTo(-5, 0);
    ctx.lineTo(-9, 6.5);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Glowing cyan body
    ctx.fillStyle = '#38bdf8';
    ctx.beginPath();
    ctx.moveTo(11, 0);
    ctx.lineTo(-7, -4.5);
    ctx.lineTo(-4, 0);
    ctx.lineTo(-7, 4.5);
    ctx.closePath();
    ctx.fill();

    // Center white laser core
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(9, 0);
    ctx.lineTo(-4, -1.8);
    ctx.lineTo(-4, 1.8);
    ctx.closePath();
    ctx.fill();
  } else if (p.weaponKind === 'enemy_ruler') {
    // Massive Spinning Golden Classroom Ruler with Red Hazard Warning Border
    ctx.rotate(elapsedTime * 18 + p.spin);

    // Outer dark stroke
    ctx.fillStyle = '#09100d';
    ctx.fillRect(-14, -5.5, 28, 11);

    // Golden yellow varnished wood
    ctx.fillStyle = '#facc15';
    ctx.fillRect(-12.5, -4, 25, 8);

    // Red warning edge strips
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(-12.5, -4, 25, 2);
    ctx.fillRect(-12.5, 2, 25, 2);

    // Black calibration tick marks
    ctx.fillStyle = '#09100d';
    for (let m = -10; m <= 10; m += 3) {
      ctx.fillRect(m, -3, 1, 3);
    }
  } else if (p.weaponKind === 'acid') {
    // Bubbling Glowing Radioactive Acid Orb with Toxic Droplets
    ctx.rotate(p.spin);

    // Outer neon green slime
    ctx.fillStyle = '#4ade80';
    ctx.strokeStyle = '#09100d';
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.arc(0, 0, p.radius + 1.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Inner bright lime acid
    ctx.fillStyle = '#a3e635';
    ctx.beginPath();
    ctx.arc(0, 0, p.radius * 0.8, 0, Math.PI * 2);
    ctx.fill();

    // Boiling acid bubbles
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(-p.radius * 0.35, -p.radius * 0.35, p.radius * 0.4, 0, Math.PI * 2);
    ctx.arc(p.radius * 0.35, p.radius * 0.25, p.radius * 0.25, 0, Math.PI * 2);
    ctx.fill();
  } else if (p.weaponKind === 'tesla') {
    // High-Voltage Violet Plasma Orb with Forked Discharge Sparks
    ctx.rotate(p.spin);

    ctx.fillStyle = '#c084fc';
    ctx.strokeStyle = '#09100d';
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.arc(0, 0, p.radius + 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#f5d0fe';
    ctx.beginPath();
    ctx.arc(0, 0, p.radius * 0.75, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(-1, -1, p.radius * 0.42, 0, Math.PI * 2);
    ctx.fill();

    // Orbiting mini electric discharge arcs
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 1.8;
    for (let si = 0; si < 3; si++) {
      const sa = elapsedTime * 20 + (si * Math.PI * 2) / 3;
      ctx.beginPath();
      ctx.moveTo(Math.cos(sa) * (p.radius + 3), Math.sin(sa) * (p.radius + 3));
      ctx.lineTo(Math.cos(sa + 0.5) * (p.radius + 8), Math.sin(sa + 0.5) * (p.radius + 8));
      ctx.stroke();
    }
  } else {
    // General / Turret / Boss Glowing Energy Sphere
    ctx.fillStyle = p.fromPlayer ? '#38bdf8' : '#ef4444';
    ctx.strokeStyle = '#09100d';
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.arc(0, 0, p.radius + 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(0, 0, p.radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(-p.radius * 0.25, -p.radius * 0.25, p.radius * 0.5, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

function drawCrosshair(
  ctx: CanvasRenderingContext2D,
  wx: number,
  wy: number,
  player: PlayerState,
  elapsedTime: number
): void {
  const spec = WEAPON_SPECS[player.activeWeapon];
  ctx.save();
  ctx.translate(wx, wy);

  // Outer rotating reticle brackets
  ctx.save();
  ctx.rotate(elapsedTime * 1.2);
  ctx.strokeStyle = spec.color;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(0, 0, 12, 0, Math.PI * 2);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(-17, 0);
  ctx.lineTo(-7, 0);
  ctx.moveTo(7, 0);
  ctx.lineTo(17, 0);
  ctx.moveTo(0, -17);
  ctx.lineTo(0, -7);
  ctx.moveTo(0, 7);
  ctx.lineTo(0, 17);
  ctx.stroke();
  ctx.restore();

  if (player.dashCooldown > 0) {
    const ratio = 1 - Math.min(1, player.dashCooldown / 1.35);
    ctx.strokeStyle = '#fef08a';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(0, 0, 17, -Math.PI / 2, -Math.PI / 2 + ratio * Math.PI * 2);
    ctx.stroke();
  }

  ctx.restore();
}
