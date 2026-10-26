import { PlayerState, ZombieTeacher, isBossArchetype } from './rules';

export type PlayerAnimState =
  | 'idle'
  | 'walk'
  | 'run'
  | 'dash'
  | 'attack'
  | 'weapon_fire'
  | 'hurt'
  | 'knockback'
  | 'special_ability'
  | 'death';

export type EnemyAnimState =
  | 'idle'
  | 'walk'
  | 'run'
  | 'windup'
  | 'attack'
  | 'recovery'
  | 'hurt'
  | 'staggered'
  | 'death';

export interface PlayerAnimPose {
  state: PlayerAnimState;
  bodyOffsetX: number;
  bodyOffsetY: number;
  bodyLeanX: number;
  bodySwayY: number;
  bodyTilt: number;
  scaleX: number;
  scaleY: number;
  footStride: number;
  leftFootStride: number;
  rightFootStride: number;
  footLift: number;
  armRecoilX: number;
  armSwingY: number;
  headOffsetX: number;
  headTilt: number;
  weaponOffsetX: number;
  weaponAngle: number;
  weaponRaiseAngle: number;
  alpha: number;
}

export interface EnemyAnimPose {
  state: EnemyAnimState;
  lungeX: number;
  swayY: number;
  bodyLeanX: number;
  bodySwayY: number;
  bodyTilt: number;
  scaleX: number;
  scaleY: number;
  footStride: number;
  leftFootStride: number;
  rightFootStride: number;
  footSway: number;
  leftArmReach: number;
  rightArmReach: number;
  weaponRaiseAngle: number;
  headOffsetX: number;
  alpha: number;
}

function finalizePlayerPose(
  raw: Omit<
    PlayerAnimPose,
    'bodyLeanX' | 'bodySwayY' | 'leftFootStride' | 'rightFootStride' | 'weaponRaiseAngle'
  >
): PlayerAnimPose {
  return {
    ...raw,
    bodyLeanX: raw.bodyOffsetX,
    bodySwayY: raw.bodyOffsetY,
    leftFootStride: raw.footStride,
    rightFootStride: -raw.footStride,
    weaponRaiseAngle: raw.weaponAngle,
  };
}

function finalizeEnemyPose(
  raw: Omit<EnemyAnimPose, 'bodyLeanX' | 'bodySwayY' | 'leftFootStride' | 'rightFootStride'>
): EnemyAnimPose {
  return {
    ...raw,
    bodyLeanX: raw.lungeX,
    bodySwayY: raw.swayY,
    leftFootStride: raw.footStride,
    rightFootStride: -raw.footStride,
  };
}

/**
 * Deterministic, frame-rate independent animation state machine and pose solver for the Player.
 * Supports all 10 required gameplay states:
 * idle, walk, run, dash, attack, weapon_fire, hurt, knockback, special_ability, death.
 */
export function computePlayerAnimPose(
  player: Pick<
    PlayerState,
    | 'hp'
    | 'vx'
    | 'vy'
    | 'walkDistance'
    | 'scaleX'
    | 'scaleY'
    | 'dashTimer'
    | 'hitFlashTimer'
    | 'muzzleFlashTimer'
    | 'recoilOffset'
    | 'ninjaSlashTimer'
    | 'shockwaveVisualTimer'
    | 'sandevistanTimer'
    | 'speedBoostTimer'
  > & { knockbackTimer?: number },
  elapsedTime: number,
  defeatProgress = 0
): PlayerAnimPose {
  const speed = Math.hypot(player.vx, player.vy);

  // 1. Priority State Resolution across all 10 Player Animation States
  let state: PlayerAnimState = 'idle';
  if (player.hp <= 0 || defeatProgress > 0) {
    state = 'death';
  } else if ((player.knockbackTimer ?? 0) > 0) {
    state = 'knockback';
  } else if (player.hitFlashTimer > 0) {
    state = 'hurt';
  } else if (player.dashTimer > 0) {
    state = 'dash';
  } else if (player.ninjaSlashTimer > 0) {
    state = 'attack';
  } else if (player.shockwaveVisualTimer > 0 || player.sandevistanTimer > 0) {
    state = 'special_ability';
  } else if (player.muzzleFlashTimer > 0 || player.recoilOffset > 1.8) {
    state = 'weapon_fire';
  } else if (speed > 210 || player.speedBoostTimer > 0) {
    state = 'run';
  } else if (speed > 12) {
    state = 'walk';
  } else {
    state = 'idle';
  }

  // 2. Pose Articulation Solver per State
  if (state === 'death') {
    const p = Math.min(1, Math.max(0.25, defeatProgress || 0.55));
    return finalizePlayerPose({
      state,
      bodyOffsetX: -p * 12,
      bodyOffsetY: p * 6,
      bodyTilt: -p * 0.85,
      scaleX: 1 + p * 0.16,
      scaleY: Math.max(0.42, 1 - p * 0.52),
      footStride: -6,
      footLift: 0,
      armRecoilX: -8 * p,
      armSwingY: 6 * p,
      headOffsetX: -4 * p,
      headTilt: -0.45 * p,
      weaponOffsetX: -10 * p,
      weaponAngle: 0.55 * p,
      alpha: Math.max(0.25, 1 - p * 0.6),
    });
  }

  if (state === 'knockback') {
    return finalizePlayerPose({
      state,
      bodyOffsetX: -6.5,
      bodyOffsetY: 0,
      bodyTilt: -0.18,
      scaleX: 0.88,
      scaleY: 1.12,
      footStride: -8,
      footLift: -2,
      armRecoilX: -5,
      armSwingY: 3,
      headOffsetX: -3,
      headTilt: -0.22,
      weaponOffsetX: -5,
      weaponAngle: -0.2,
      alpha: 1,
    });
  }

  if (state === 'hurt') {
    const flinch = Math.sin(elapsedTime * 55) * 2.5;
    return finalizePlayerPose({
      state,
      bodyOffsetX: -4.5,
      bodyOffsetY: flinch,
      bodyTilt: -0.14,
      scaleX: 0.91,
      scaleY: 1.09,
      footStride: -4,
      footLift: 0,
      armRecoilX: -4,
      armSwingY: flinch * 0.5,
      headOffsetX: -2.5,
      headTilt: -0.18,
      weaponOffsetX: -4,
      weaponAngle: -0.15,
      alpha: 1,
    });
  }

  if (state === 'dash') {
    return finalizePlayerPose({
      state,
      bodyOffsetX: 7.5,
      bodyOffsetY: 0,
      bodyTilt: 0.14,
      scaleX: Math.max(player.scaleX, 1.24),
      scaleY: Math.min(player.scaleY, 0.78),
      footStride: 14,
      footLift: 3.5,
      armRecoilX: 4,
      armSwingY: 0,
      headOffsetX: 4.5,
      headTilt: 0.08,
      weaponOffsetX: 5,
      weaponAngle: 0.05,
      alpha: 1,
    });
  }

  if (state === 'attack') {
    const slashSpin = Math.sin(elapsedTime * 34) * 0.08;
    return finalizePlayerPose({
      state,
      bodyOffsetX: 5.5,
      bodyOffsetY: 0,
      bodyTilt: 0.12 + slashSpin,
      scaleX: 1.1 + slashSpin * 0.5,
      scaleY: 0.92 - slashSpin * 0.5,
      footStride: 12,
      footLift: 2.5,
      armRecoilX: 7,
      armSwingY: 0,
      headOffsetX: 3.5,
      headTilt: 0.06,
      weaponOffsetX: 7,
      weaponAngle: 0.12,
      alpha: 1,
    });
  }

  if (state === 'special_ability') {
    const pulse = Math.sin(elapsedTime * 28) * 0.05;
    return finalizePlayerPose({
      state,
      bodyOffsetX: 4,
      bodyOffsetY: 0,
      bodyTilt: 0.08,
      scaleX: 1.08 + pulse,
      scaleY: 0.94 - pulse,
      footStride: 11,
      footLift: 2,
      armRecoilX: 6,
      armSwingY: 0,
      headOffsetX: 3,
      headTilt: 0,
      weaponOffsetX: 6,
      weaponAngle: 0,
      alpha: 1,
    });
  }

  const walkCycle = player.walkDistance * 0.11;
  const isMoving = speed > 12;
  const isRun = state === 'run';
  const strideAmp = isRun ? 13 : isMoving ? 9.5 : 0;
  const footStride = isMoving ? Math.sin(walkCycle) * strideAmp : 0;
  const footLift = isMoving ? Math.cos(walkCycle) * (isRun ? 3.2 : 2.0) : 0;
  const walkBob = isMoving
    ? Math.sin(player.walkDistance * 0.08) * (isRun ? 0.082 : 0.062)
    : Math.sin(elapsedTime * 3.8) * 0.028;

  if (state === 'weapon_fire') {
    const kick = Math.max(1.5, Math.min(9, player.recoilOffset));
    return finalizePlayerPose({
      state,
      bodyOffsetX: -kick * 0.45,
      bodyOffsetY: 0,
      bodyTilt: -kick * 0.012,
      scaleX: 1 + walkBob,
      scaleY: 1 - walkBob,
      footStride,
      footLift,
      armRecoilX: -kick,
      armSwingY: 0,
      headOffsetX: -kick * 0.2,
      headTilt: -0.04,
      weaponOffsetX: -kick,
      weaponAngle: -kick * 0.018,
      alpha: 1,
    });
  }

  if (state === 'run') {
    return finalizePlayerPose({
      state,
      bodyOffsetX: 3.8,
      bodyOffsetY: Math.sin(walkCycle) * 1.6,
      bodyTilt: Math.sin(walkCycle) * 0.06,
      scaleX: 1 + walkBob,
      scaleY: 1 - walkBob,
      footStride,
      footLift,
      armRecoilX: Math.cos(walkCycle) * 2.2,
      armSwingY: Math.sin(walkCycle) * 2.0,
      headOffsetX: 2.5,
      headTilt: Math.sin(walkCycle) * 0.04,
      weaponOffsetX: 1.5,
      weaponAngle: Math.sin(walkCycle) * 0.03,
      alpha: 1,
    });
  }

  if (state === 'walk') {
    return finalizePlayerPose({
      state,
      bodyOffsetX: 1.5,
      bodyOffsetY: Math.sin(walkCycle) * 1.1,
      bodyTilt: Math.sin(walkCycle) * 0.04,
      scaleX: 1 + walkBob,
      scaleY: 1 - walkBob,
      footStride,
      footLift,
      armRecoilX: Math.cos(walkCycle) * 1.4,
      armSwingY: Math.sin(walkCycle) * 1.4,
      headOffsetX: 1.0,
      headTilt: Math.sin(walkCycle) * 0.025,
      weaponOffsetX: 0.5,
      weaponAngle: Math.sin(walkCycle) * 0.02,
      alpha: 1,
    });
  }

  // Idle breathing state
  const breathe = Math.sin(elapsedTime * 3.8);
  return finalizePlayerPose({
    state: 'idle',
    bodyOffsetX: 0,
    bodyOffsetY: 0,
    bodyTilt: breathe * 0.015,
    scaleX: 1 + breathe * 0.026,
    scaleY: 1 - breathe * 0.022,
    footStride: 0,
    footLift: 0,
    armRecoilX: breathe * 0.8,
    armSwingY: 0,
    headOffsetX: breathe * 0.5,
    headTilt: Math.sin(elapsedTime * 1.9) * 0.03,
    weaponOffsetX: breathe * 0.8,
    weaponAngle: breathe * 0.015,
    alpha: 1,
  });
}

/**
 * Deterministic, frame-rate independent animation state machine and pose solver
 * for all 5 Enemy Archetypes and 4 Unique School Bosses.
 */
export function computeEnemyAnimPose(
  t: Pick<
    ZombieTeacher,
    | 'id'
    | 'archetype'
    | 'vx'
    | 'vy'
    | 'state'
    | 'stateTimer'
    | 'koTimer'
    | 'hitFlashTimer'
    | 'walkPhase'
    | 'bossPhase'
  >,
  elapsedTime: number
): EnemyAnimPose {
  const speed = Math.hypot(t.vx, t.vy);
  const isBoss = isBossArchetype(t.archetype);

  let state: EnemyAnimState = 'idle';
  if (t.state === 'ko') {
    state = 'death';
  } else if (t.state === 'staggered') {
    state = 'staggered';
  } else if (t.hitFlashTimer > 0 && t.state !== 'active_attack') {
    state = 'hurt';
  } else if (t.state === 'windup') {
    state = 'windup';
  } else if (t.state === 'active_attack') {
    state = 'attack';
  } else if (t.state === 'recovery') {
    state = 'recovery';
  } else if (speed > 130) {
    state = 'run';
  } else if (speed > 8) {
    state = 'walk';
  } else {
    state = 'idle';
  }

  if (state === 'death') {
    const koProgress = 1 - Math.max(0, Math.min(1, t.koTimer / 0.35));
    return finalizeEnemyPose({
      state,
      lungeX: -koProgress * 14,
      swayY: koProgress * 6,
      bodyTilt: koProgress * Math.PI * 1.25,
      scaleX: 1 + koProgress * 0.18,
      scaleY: Math.max(0.25, 1 - koProgress * 0.65),
      footStride: -6,
      footSway: 0,
      leftArmReach: -8 * koProgress,
      rightArmReach: -8 * koProgress,
      weaponRaiseAngle: 0.75 * koProgress,
      headOffsetX: -4 * koProgress,
      alpha: Math.max(0, 1 - koProgress),
    });
  }

  if (state === 'staggered') {
    const wobble = Math.sin(elapsedTime * 22) * 0.09;
    return finalizeEnemyPose({
      state,
      lungeX: -3.5,
      swayY: Math.cos(elapsedTime * 18) * 2.5,
      bodyTilt: wobble,
      scaleX: 1 + wobble * 0.45,
      scaleY: 1 - wobble * 0.45,
      footStride: -3,
      footSway: wobble * 12,
      leftArmReach: -5,
      rightArmReach: -5,
      weaponRaiseAngle: -0.35,
      headOffsetX: -2.5,
      alpha: 1,
    });
  }

  if (state === 'hurt') {
    return finalizeEnemyPose({
      state,
      lungeX: -4.5,
      swayY: Math.sin(elapsedTime * 45) * 2,
      bodyTilt: -0.12,
      scaleX: 0.9,
      scaleY: 1.1,
      footStride: -2,
      footSway: 0,
      leftArmReach: -4,
      rightArmReach: -4,
      weaponRaiseAngle: -0.22,
      headOffsetX: -3,
      alpha: 1,
    });
  }

  if (state === 'windup') {
    const tremor = Math.sin(elapsedTime * 38) * 1.4;
    const coilScale = Math.sin(elapsedTime * 32) * 0.05;
    const raiseAngle =
      t.archetype === 'math_sniper' || t.archetype === 'vice_principal_boss'
        ? 0.04
        : isBoss
        ? -0.48
        : -0.32;
    return finalizeEnemyPose({
      state,
      lungeX: (isBoss ? -6.5 : -5.0) + tremor,
      swayY: tremor * 0.5,
      bodyTilt: -0.08,
      scaleX: 0.91 + coilScale,
      scaleY: 1.1 - coilScale,
      footStride: -5,
      footSway: 0,
      leftArmReach: -6,
      rightArmReach: -7.5,
      weaponRaiseAngle: raiseAngle,
      headOffsetX: -2,
      alpha: 1,
    });
  }

  if (state === 'attack') {
    const isCharger = t.archetype === 'pe_charger' || t.archetype === 'pe_boss';
    const chargeStride = isCharger ? Math.sin(t.walkPhase) * 14 : 8;
    return finalizeEnemyPose({
      state,
      lungeX: isBoss ? 9.5 : 7.5,
      swayY: 0,
      bodyTilt: 0.1,
      scaleX: 1.18,
      scaleY: 0.86,
      footStride: chargeStride,
      footSway: 0,
      leftArmReach: 11,
      rightArmReach: 14,
      weaponRaiseAngle: 0.28,
      headOffsetX: 4.5,
      alpha: 1,
    });
  }

  if (state === 'recovery') {
    return finalizeEnemyPose({
      state,
      lungeX: 2.5,
      swayY: 0,
      bodyTilt: 0.04,
      scaleX: 0.95,
      scaleY: 1.04,
      footStride: 3,
      footSway: 0,
      leftArmReach: 3,
      rightArmReach: 4,
      weaponRaiseAngle: 0.1,
      headOffsetX: 1.5,
      alpha: 1,
    });
  }

  if (state === 'run' || state === 'walk') {
    const isRun = state === 'run';
    const strideAmp = isRun ? 12.5 : 9.5;
    const footStride = Math.sin(t.walkPhase) * strideAmp;
    const footSway = Math.cos(t.walkPhase) * 1.8;
    const bob = Math.sin(t.walkPhase) * (isRun ? 0.095 : 0.075);
    const armSwing = Math.sin(t.walkPhase * 1.2) * (isRun ? 7.5 : 5.5);
    const forwardLean =
      t.archetype === 'pe_charger' || t.archetype === 'literature_chaser'
        ? isRun
          ? 4.0
          : 2.5
        : 1.5;

    return finalizeEnemyPose({
      state,
      lungeX: forwardLean,
      swayY: footSway * 0.6,
      bodyTilt: Math.sin(t.walkPhase * 0.5) * 0.05,
      scaleX: 1 + bob,
      scaleY: 1 - bob,
      footStride,
      footSway,
      leftArmReach: armSwing * 0.55,
      rightArmReach: -armSwing * 0.55,
      weaponRaiseAngle: Math.sin(t.walkPhase) * 0.06,
      headOffsetX: forwardLean * 0.5,
      alpha: 1,
    });
  }

  // Idle state
  const breathe = Math.sin(elapsedTime * 3.6 + t.id);
  return finalizeEnemyPose({
    state: 'idle',
    lungeX: 0,
    swayY: 0,
    bodyTilt: breathe * 0.02,
    scaleX: 1 + breathe * 0.035,
    scaleY: 1 - breathe * 0.028,
    footStride: 0,
    footSway: 0,
    leftArmReach: breathe * 1.2,
    rightArmReach: -breathe * 1.2,
    weaponRaiseAngle: breathe * 0.03,
    headOffsetX: breathe * 0.6,
    alpha: 1,
  });
}
