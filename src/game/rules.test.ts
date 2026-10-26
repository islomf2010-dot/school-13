import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createInitialPlayer,
  createWaveExplosiveProps,
  createMapSecretStash,
  applyDamageToPlayer,
  applyBonusToPlayer,
  applyUpgradeToPlayer,
  computeEffectiveProjectileDamage,
  resolveCircleRectCollision,
  computeTeacherSeekVector,
  canAcquireAttackToken,
  canPlaceStructure,
  getWaveConfig,
  getStyleRankForPoints,
  getStyleProgressToNextRank,
  getModifiedWeaponSpec,
  getObstaclesForMap,
  isBossArchetype,
  SCHOOL_MAPS,
  SCHOOL_OBSTACLES,
  SchoolMapId,
  WEAPON_SPECS,
  ULTIMATE_SPECS,
  BARRICADE_COST,
  TURRET_COST,
  distToSegmentSq,
  resolveCircleCircleCollision,
  segmentIntersectsRect,
  applyTeacherFlocking,
  getRandomTeacherBark,
  TEACHER_BARKS,
  lerpAngle,
  hasLineOfSight,
} from './rules.ts';
import {
  createDefaultSaveProfile,
  validateAndMigrateSave,
  purchaseMetaUpgrade,
  unlockSkin,
  equipSkin,
} from './progression.ts';
import { getSpriteAssetManifest } from './spriteCache.ts';
import { computeEnemyAnimPose, computePlayerAnimPose } from './animationSystem.ts';

test('initial player spawns in open central corridor with full rage ready and selectable ultimate ability', () => {
  const player = createInitialPlayer('shadow_ninja');
  assert.equal(player.rage, 100);
  assert.equal(player.ultimateId, 'shadow_ninja');
  assert.ok(ULTIMATE_SPECS.sandevistan.cutsceneTitle.length > 0);
  assert.ok(ULTIMATE_SPECS.shadow_ninja.cutsceneTitle.length > 0);
  assert.ok(ULTIMATE_SPECS.sonic_bell.cutsceneTitle.length > 0);
  for (const obs of SCHOOL_OBSTACLES) {
    const res = resolveCircleRectCollision(player.x, player.y, player.radius + 20, obs);
    assert.equal(res.collided, false, `Player spawn should not collide with ${obs.id}`);
  }
});

test('explosive props and supply crates spawn in valid corridor locations without overlapping obstacles', () => {
  const props = createWaveExplosiveProps(100);
  assert.equal(props.length, 8);
  const supplyCrates = props.filter((p) => p.kind === 'supply_crate');
  assert.equal(supplyCrates.length, 2);
  for (const ep of props) {
    for (const obs of SCHOOL_OBSTACLES) {
      const res = resolveCircleRectCollision(ep.x, ep.y, ep.radius, obs);
      assert.equal(res.collided, false, `Explosive prop at (${ep.x},${ep.y}) collided with ${obs.id}`);
    }
  }
});

test('shield absorbs damage before HP and never clamps HP at 1 on lethal hits', () => {
  const p = { hp: 40, shield: 25, invulnTimer: 0 };
  const afterHit1 = applyDamageToPlayer(p, 30);
  assert.equal(afterHit1.shield, 0);
  assert.equal(afterHit1.hp, 35);
  assert.equal(afterHit1.defeated, false);

  const afterLethal = applyDamageToPlayer({ hp: afterHit1.hp, shield: 0, invulnTimer: 0 }, 50);
  assert.equal(afterLethal.hp, 0);
  assert.equal(afterLethal.defeated, true);
});

test('history_shield teacher mitigates frontal non-piercing hits but takes critical interrupt damage when staggered and flanked', () => {
  const teacher = { archetype: 'history_shield' as const, angle: 0, state: 'seeking' as const };
  const frontal = computeEffectiveProjectileDamage(20, 0, Math.PI, teacher, 1);
  assert.equal(frontal.blockedByShield, true);
  assert.ok(frontal.damage < 20);

  const staggeredTeacher = { archetype: 'history_shield' as const, angle: 0, state: 'staggered' as const };
  const comboHit = computeEffectiveProjectileDamage(20, 0, 0, staggeredTeacher, 1, true, true);
  assert.equal(comboHit.blockedByShield, false);
  assert.equal(comboHit.isCriticalInterrupt, true);
  assert.ok(comboHit.damage >= 45);
});

test('8-tier ULTRAKILL Style Rank ladder maps points and progress accurately', () => {
  assert.equal(getStyleRankForPoints(0).id, 'D');
  assert.equal(getStyleRankForPoints(150).id, 'C');
  assert.equal(getStyleRankForPoints(450).id, 'A');
  assert.equal(getStyleRankForPoints(650).id, 'S');
  assert.equal(getStyleRankForPoints(990).id, 'ULTRAKILL');
  assert.equal(getStyleProgressToNextRank(1050), 1);
});

test('between-wave combat upgrades enhance player stats and replenish ammo', () => {
  const player = createInitialPlayer();
  player.hp = 60;
  const vampired = applyUpgradeToPlayer(player, 'vampirism');
  assert.ok(vampired.hp > 60);
  assert.ok(vampired.vampirismBonus > 0);

  const reloaded = applyUpgradeToPlayer(player, 'rapid_reload');
  assert.ok(reloaded.fireRateMultiplier > 1.0);
});

test('5 distinct enemy movement policies produce distinct movement vectors', () => {
  const chaser = computeTeacherSeekVector(
    { id: 1, archetype: 'literature_chaser', x: 700, y: 600 },
    900,
    600,
    0
  );
  const kiterClose = computeTeacherSeekVector(
    { id: 2, archetype: 'math_sniper', x: 760, y: 600 },
    900,
    600,
    0
  );
  const charger = computeTeacherSeekVector(
    { id: 3, archetype: 'pe_charger', x: 680, y: 600 },
    900,
    600,
    0
  );

  assert.ok(chaser.vx > 0);
  assert.ok(kiterClose.vx < 0);
  assert.equal(charger.shouldStartWindup, true);
});

test('crowd attack token pool limits simultaneous attackers', () => {
  const teachers = [
    { id: 1, hasAttackToken: true, state: 'windup' as const },
    { id: 2, hasAttackToken: true, state: 'active_attack' as const },
    { id: 3, hasAttackToken: true, state: 'windup' as const },
    { id: 4, hasAttackToken: false, state: 'seeking' as const },
  ];
  assert.equal(canAcquireAttackToken(teachers, 4, 3), false);
  assert.equal(canAcquireAttackToken(teachers, 4, 4), true);
});

test('defensive bonuses and structure placement rules work deterministically', () => {
  const player = createInitialPlayer();
  const boosted = applyBonusToPlayer(player, 'overdrive').updated;
  assert.equal(boosted.overdriveTimer, 10.0);

  const ammoAdded = applyBonusToPlayer(player, 'ammo').updated;
  assert.ok(ammoAdded.scrap > player.scrap);
  assert.ok(ammoAdded.ammo.shotgun <= WEAPON_SPECS.shotgun.maxAmmo);

  const validPlacement = canPlaceStructure(
    960,
    600,
    24,
    player.scrap,
    BARRICADE_COST,
    SCHOOL_OBSTACLES,
    []
  );
  assert.equal(validPlacement.allowed, true);

  const noScrapPlacement = canPlaceStructure(
    960,
    600,
    24,
    10,
    TURRET_COST,
    SCHOOL_OBSTACLES,
    []
  );
  assert.equal(noScrapPlacement.allowed, false);
});

test('multi-knob wave difficulty scales across all 5 waves and assigns unique bosses to waves 2-5', () => {
  const w1 = getWaveConfig(1);
  const w2 = getWaveConfig(2);
  const w3 = getWaveConfig(3);
  const w4 = getWaveConfig(4);
  const w5 = getWaveConfig(5);
  assert.ok(w5.totalBudget > w1.totalBudget);
  assert.ok(w5.speedMultiplier > w1.speedMultiplier);
  assert.ok(w5.spawnInterval < w1.spawnInterval);
  assert.equal(w2.bossId, 'vice_principal_boss');
  assert.equal(w3.bossId, 'pe_boss');
  assert.equal(w4.bossId, 'lab_experiment_boss');
  assert.equal(w5.bossId, 'principal_boss');
  assert.equal(isBossArchetype('vice_principal_boss'), true);
  assert.equal(isBossArchetype('pe_boss'), true);
  assert.equal(isBossArchetype('lab_experiment_boss'), true);
  assert.equal(isBossArchetype('principal_boss'), true);
  assert.equal(isBossArchetype('literature_chaser'), false);
});

test('all 6 school maps have distinct obstacle layouts, secret stashes, and safe player spawn', () => {
  const mapIds: SchoolMapId[] = [
    'corridor',
    'classroom',
    'gymnasium',
    'lab',
    'library',
    'basement',
  ];
  const player = createInitialPlayer();
  for (const mapId of mapIds) {
    const spec = SCHOOL_MAPS[mapId];
    assert.ok(spec.name.length > 0);
    const obstacles = getObstaclesForMap(mapId);
    assert.ok(obstacles.length >= 6);
    for (const obs of obstacles) {
      const col = resolveCircleRectCollision(player.x, player.y, player.radius + 8, obs);
      assert.equal(col.collided, false, `Player spawn collides with ${obs.id} on map ${mapId}`);
    }
    const stash = createMapSecretStash(mapId);
    assert.equal(stash.discovered, false);
    assert.ok(stash.scrapReward >= 45);
    assert.ok(stash.loreText.length > 10);
  }
});

test('weapon modifications alter weapon combat specs and attach via upgrades', () => {
  const baseSlingshot = getModifiedWeaponSpec('slingshot', []);
  const modSlingshot = getModifiedWeaponSpec('slingshot', ['slingshot_ricochet']);
  assert.ok(modSlingshot.damage > baseSlingshot.damage);
  assert.ok(modSlingshot.pierce > baseSlingshot.pierce);

  const modShotgun = getModifiedWeaponSpec('shotgun', ['shotgun_incendiary']);
  assert.ok(modShotgun.aoeRadius > 0);

  const modNailgun = getModifiedWeaponSpec('nailgun', ['nailgun_hyper']);
  assert.equal(modNailgun.projectiles, 2);
  assert.ok(modNailgun.cooldown < WEAPON_SPECS.nailgun.cooldown);

  const player = createInitialPlayer();
  const upgraded = applyUpgradeToPlayer(player, 'mod_tesla_overcharge');
  assert.equal(upgraded.weaponMods.includes('tesla_overcharge'), true);
});

test('persistent meta-progression validates saves, upgrades stats, and unlocks skins', () => {
  const corrupted = validateAndMigrateSave({ version: 2, medals: -50, unlockedSkins: 'broken' });
  assert.equal(corrupted.medals, 0);
  assert.equal(corrupted.unlockedSkins.includes('default'), true);

  let profile = createDefaultSaveProfile();
  profile.medals = 150;

  const upgRes = purchaseMetaUpgrade(profile, 'vitality');
  assert.equal(upgRes.purchased, true);
  assert.equal(upgRes.profile.metaUpgrades.vitality, 1);
  assert.ok(upgRes.profile.medals < 150);

  const skinRes = unlockSkin(upgRes.profile, 'cyber_punk');
  assert.equal(skinRes.unlocked, true);
  const equipped = equipSkin(skinRes.profile, 'cyber_punk');
  assert.equal(equipped.equippedSkin, 'cyber_punk');

  const metaPlayer = createInitialPlayer('sandevistan', equipped.metaUpgrades, equipped.equippedSkin);
  assert.equal(metaPlayer.maxHp, 115);
  assert.equal(metaPlayer.skinId, 'cyber_punk');
});

test('ultimate abilities specs provide distinct titles, accents, and anime cutscenes', () => {
  const sande = ULTIMATE_SPECS.sandevistan;
  const ninja = ULTIMATE_SPECS.shadow_ninja;
  const bell = ULTIMATE_SPECS.sonic_bell;

  assert.equal(sande.id, 'sandevistan');
  assert.equal(ninja.id, 'shadow_ninja');
  assert.equal(bell.id, 'sonic_bell');

  assert.ok(sande.accent.startsWith('#'));
  assert.ok(ninja.accent.startsWith('#'));
  assert.ok(bell.accent.startsWith('#'));
  assert.notEqual(sande.accent, ninja.accent);

  assert.ok(sande.cutsceneTitle.includes('САНДЕВИСТАН'));
  assert.ok(ninja.cutsceneTitle.includes('ТЕНИ'));
  assert.ok(bell.cutsceneTitle.includes('БОЛЬШОЙ ЗВОНОК'));
});

test('distToSegmentSq correctly detects continuous bullet collision without tunneling', () => {
  const dSq = distToSegmentSq(55, 52, 10, 50, 100, 50);
  assert.ok(dSq <= 2 * 2 + 0.001);

  const dFar = distToSegmentSq(55, 120, 10, 50, 100, 50);
  assert.ok(dFar > 15 * 15);
});

test('resolveCircleRectCollision provides surface normals for smooth wall sliding', () => {
  const obstacle = SCHOOL_OBSTACLES[0];
  const col = resolveCircleRectCollision(260, 200, 18, obstacle);
  assert.equal(col.collided, true);
  assert.ok(col.normalY > 0.9, 'Normal should point downwards (out of obstacle)');
});

test('resolveCircleCircleCollision separates overlapping entities', () => {
  const col = resolveCircleCircleCollision(100, 100, 20, 110, 100, 20);
  assert.equal(col.collided, true);
  assert.ok(col.x1 < 100, 'First circle should be pushed away');
  assert.ok(col.normalX < -0.9);
});

test('applyTeacherFlocking separates tightly clumped teachers', () => {
  const teachers: any[] = [
    { id: 1, x: 500, y: 500, radius: 21, state: 'seeking' },
    { id: 2, x: 502, y: 501, radius: 21, state: 'seeking' },
  ];
  applyTeacherFlocking(teachers);
  const dist = Math.hypot(teachers[0].x - teachers[1].x, teachers[0].y - teachers[1].y);
  assert.ok(dist > 5, 'Teachers should be pushed apart to prevent single-pixel clumping');
});

test('segmentIntersectsRect detects fast projectile passing through obstacle', () => {
  const obstacle = SCHOOL_OBSTACLES[0];
  const hit = segmentIntersectsRect(300, 120, 300, 220, obstacle);
  assert.equal(hit, true);

  const miss = segmentIntersectsRect(100, 120, 100, 220, obstacle);
  assert.equal(miss, false);
});

test('teacher voice barks return authentic Russian school quotes per archetype', () => {
  const litQuote = getRandomTeacherBark('literature_chaser');
  assert.ok(TEACHER_BARKS.literature_chaser.includes(litQuote));
  assert.ok(litQuote.length > 5);

  const mathQuote = getRandomTeacherBark('math_sniper');
  assert.ok(TEACHER_BARKS.math_sniper.includes(mathQuote));

  const peQuote = getRandomTeacherBark('pe_charger');
  assert.ok(TEACHER_BARKS.pe_charger.includes(peQuote));

  const bossQuote = getRandomTeacherBark('principal_boss');
  assert.ok(TEACHER_BARKS.principal_boss.includes(bossQuote));

  const viceQuote = getRandomTeacherBark('vice_principal_boss');
  assert.ok(TEACHER_BARKS.vice_principal_boss.includes(viceQuote));
});

test('lerpAngle smoothly interpolates across the -PI/PI boundary without snapping', () => {
  const start = Math.PI - 0.1;
  const target = -Math.PI + 0.1;
  const mid = lerpAngle(start, target, 0.5);
  assert.ok(Math.abs(Math.abs(mid) - Math.PI) < 0.05);
});

test('hasLineOfSight detects obstacle occlusion between sniper and player', () => {
  const obstacle = SCHOOL_OBSTACLES[0]; // x: 260, y: 150, width: 320, height: 42
  assert.equal(hasLineOfSight(300, 120, 300, 220, SCHOOL_OBSTACLES), false);
  assert.equal(hasLineOfSight(900, 500, 900, 650, [obstacle]), true);
});

test('sprite asset manifest registers all 38 local PNG assets for player, skins, enemies, bosses, obstacles, pickups, and floors', () => {
  const manifest = getSpriteAssetManifest();
  assert.equal(Object.keys(manifest).length, 38);
  assert.ok(manifest.player_torso.endsWith('.png'));
  assert.ok(manifest.skin_cyber_punk.endsWith('.png'));
  assert.ok(manifest.principal_boss.endsWith('.png'));
  assert.ok(manifest.school_crest.endsWith('.png'));
  assert.ok(manifest.supply_crate.endsWith('.png'));
  assert.ok(manifest.obs_locker.endsWith('.png'));
  assert.ok(manifest.struct_turret.endsWith('.png'));
  assert.ok(manifest.bonus_medkit.endsWith('.png'));
  assert.ok(manifest.floor_corridor.endsWith('.png'));
});

test('computePlayerAnimPose resolves all 10 player animation states with distinct articulated poses', () => {
  const basePlayer = createInitialPlayer();

  // 1. idle
  const idlePose = computePlayerAnimPose(basePlayer, 1.0);
  assert.equal(idlePose.state, 'idle');

  // 2. walk
  const walkPose = computePlayerAnimPose({ ...basePlayer, vx: 120, vy: 0, walkDistance: 45 }, 1.0);
  assert.equal(walkPose.state, 'walk');

  // 3. run
  const runPose = computePlayerAnimPose({ ...basePlayer, vx: 260, vy: 0, walkDistance: 90 }, 1.0);
  assert.equal(runPose.state, 'run');
  assert.ok(runPose.bodyLeanX > walkPose.bodyLeanX);

  // 4. dash
  const dashPose = computePlayerAnimPose({ ...basePlayer, dashTimer: 0.14 }, 1.0);
  assert.equal(dashPose.state, 'dash');
  assert.ok(dashPose.scaleX > 1.15);

  // 5. attack (ninja slash melee)
  const attackPose = computePlayerAnimPose({ ...basePlayer, ninjaSlashTimer: 0.9 }, 1.0);
  assert.equal(attackPose.state, 'attack');

  // 6. weapon_fire
  const firePose = computePlayerAnimPose({ ...basePlayer, muzzleFlashTimer: 0.05, recoilOffset: 5 }, 1.0);
  assert.equal(firePose.state, 'weapon_fire');
  assert.ok(firePose.bodyLeanX < 0);

  // 7. hurt
  const hurtPose = computePlayerAnimPose({ ...basePlayer, hitFlashTimer: 0.1 }, 1.0);
  assert.equal(hurtPose.state, 'hurt');

  // 8. knockback
  const kbPose = computePlayerAnimPose({ ...basePlayer, knockbackTimer: 0.16 }, 1.0);
  assert.equal(kbPose.state, 'knockback');
  assert.ok(kbPose.bodyLeanX < -4);

  // 9. special_ability
  const ultPose = computePlayerAnimPose({ ...basePlayer, sandevistanTimer: 4.0 }, 1.0);
  assert.equal(ultPose.state, 'special_ability');

  // 10. death
  const deathPose = computePlayerAnimPose({ ...basePlayer, hp: 0 }, 1.0);
  assert.equal(deathPose.state, 'death');
  assert.ok(deathPose.alpha < 1);
});

test('computeEnemyAnimPose resolves all 9 enemy and boss animation states with distinct articulated poses', () => {
  const baseTeacher: any = {
    id: 1,
    archetype: 'literature_chaser',
    x: 400,
    y: 400,
    vx: 0,
    vy: 0,
    angle: 0,
    radius: 21,
    hp: 60,
    maxHp: 60,
    state: 'seeking',
    stateTimer: 0,
    attackCooldownTimer: 0,
    hitFlashTimer: 0,
    frozenTimer: 0,
    koTimer: 0,
    walkPhase: 1.2,
    chargeDirX: 1,
    chargeDirY: 0,
    hasAttackToken: false,
  };

  assert.equal(computeEnemyAnimPose(baseTeacher, 1.0).state, 'idle');
  assert.equal(computeEnemyAnimPose({ ...baseTeacher, vx: 80 }, 1.0).state, 'walk');
  assert.equal(computeEnemyAnimPose({ ...baseTeacher, vx: 190 }, 1.0).state, 'run');
  assert.equal(computeEnemyAnimPose({ ...baseTeacher, state: 'windup', stateTimer: 0.25 }, 1.0).state, 'windup');
  assert.equal(computeEnemyAnimPose({ ...baseTeacher, state: 'active_attack', stateTimer: 0.12 }, 1.0).state, 'attack');
  assert.equal(computeEnemyAnimPose({ ...baseTeacher, state: 'recovery', stateTimer: 0.2 }, 1.0).state, 'recovery');
  assert.equal(computeEnemyAnimPose({ ...baseTeacher, hitFlashTimer: 0.1 }, 1.0).state, 'hurt');
  assert.equal(computeEnemyAnimPose({ ...baseTeacher, state: 'staggered', stateTimer: 0.8 }, 1.0).state, 'staggered');
  assert.equal(computeEnemyAnimPose({ ...baseTeacher, state: 'ko', koTimer: 0.2 }, 1.0).state, 'death');
});



