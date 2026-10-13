import * as THREE from 'three';

const STORAGE = { highScore: 'er_high_score', totalGold: 'er_total_gold' };
function loadNum(key) { try { return Number(localStorage.getItem(key)) || 0; } catch { return 0; } }
function saveNum(key, v) { try { localStorage.setItem(key, String(v)); } catch {} }

const $ = (id) => document.getElementById(id);
const startMenu = $('start-menu');
const gameOverScreen = $('game-over');
const hud = $('hud');
const controlsModal = $('controls-modal');
const newRecordBadge = $('new-record-badge');
$('menu-high-score').textContent = loadNum(STORAGE.highScore);
$('menu-total-coins').textContent = '🪙 ' + loadNum(STORAGE.totalGold);

const canvas = $('game-canvas');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0a0a0c);
scene.fog = new THREE.Fog(0x0a0a0c, 18, 70);

const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 120);
camera.position.set(0, 4.2, 8);
camera.lookAt(0, 1.5, 0);

scene.add(new THREE.AmbientLight(0xffffff, 0.45));
const sun = new THREE.DirectionalLight(0xffe6a0, 1.15);
sun.position.set(6, 14, 4);
sun.castShadow = true;
sun.shadow.mapSize.set(1024, 1024);
sun.shadow.camera.left = -12; sun.shadow.camera.right = 12;
sun.shadow.camera.top = 12; sun.shadow.camera.bottom = -12;
scene.add(sun);
const rim = new THREE.DirectionalLight(0x6080ff, 0.35);
rim.position.set(-4, 3, -6);
scene.add(rim);
const goldLight = new THREE.PointLight(0xf5c518, 0.6, 20);
goldLight.position.set(0, 3, 2);
scene.add(goldLight);

const matPath = new THREE.MeshStandardMaterial({ color: 0x2a2418, roughness: 0.9 });
const matPathEdge = new THREE.MeshStandardMaterial({ color: 0xf5c518, roughness: 0.4, metalness: 0.7, emissive: 0x3a2a00, emissiveIntensity: 0.3 });
const matRock = new THREE.MeshStandardMaterial({ color: 0x4a453c, roughness: 0.95 });
const matCoin = new THREE.MeshStandardMaterial({ color: 0xf5c518, metalness: 0.9, roughness: 0.25, emissive: 0x5a4000, emissiveIntensity: 0.4 });
const matSkin = new THREE.MeshStandardMaterial({ color: 0xc68642, roughness: 0.65 });
const matShirt = new THREE.MeshStandardMaterial({ color: 0x1a3a5c, roughness: 0.7 });
const matPants = new THREE.MeshStandardMaterial({ color: 0x2c2c30, roughness: 0.8 });
const matHair = new THREE.MeshStandardMaterial({ color: 0x1a120c, roughness: 0.9 });
const matShoe = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.6 });

const LANES = [-2.2, 0, 2.2];
const pathGroup = new THREE.Group();
scene.add(pathGroup);

function makePathSegment(z) {
  const g = new THREE.Group();
  const floor = new THREE.Mesh(new THREE.BoxGeometry(8, 0.3, 20), matPath);
  floor.position.y = -0.15; floor.receiveShadow = true; g.add(floor);
  [-4.1, 4.1].forEach((x) => {
    const rail = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.35, 20), matPathEdge);
    rail.position.set(x, 0.05, 0); rail.castShadow = true; g.add(rail);
  });
  [-4.5, 4.5].forEach((x) => {
    const wall = new THREE.Mesh(new THREE.BoxGeometry(0.4, 2.2, 20), matRock);
    wall.position.set(x, 1, 0); wall.castShadow = true; g.add(wall);
  });
  g.position.z = z; return g;
}
const segments = [];
for (let i = 0; i < 8; i++) { const seg = makePathSegment(-i * 20); pathGroup.add(seg); segments.push(seg); }

function createRunner() {
  const root = new THREE.Group();
  const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.28, 0.55, 6, 12), matShirt);
  torso.position.y = 1.15; torso.castShadow = true; root.add(torso);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.22, 16, 16), matSkin);
  head.position.y = 1.72; head.castShadow = true; root.add(head);
  const hair = new THREE.Mesh(new THREE.SphereGeometry(0.23, 12, 12, 0, Math.PI * 2, 0, Math.PI * 0.55), matHair);
  hair.position.y = 1.78; hair.rotation.x = -0.15; root.add(hair);
  const eyeGeo = new THREE.SphereGeometry(0.035, 8, 8);
  const eyeMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a });
  const leftEye = new THREE.Mesh(eyeGeo, eyeMat); leftEye.position.set(-0.07, 1.74, 0.18); root.add(leftEye);
  const rightEye = leftEye.clone(); rightEye.position.x = 0.07; root.add(rightEye);
  const armGeo = new THREE.CapsuleGeometry(0.08, 0.4, 4, 8);
  const leftArm = new THREE.Mesh(armGeo, matSkin); leftArm.position.set(-0.4, 1.25, 0); leftArm.castShadow = true; root.add(leftArm);
  const rightArm = new THREE.Mesh(armGeo, matSkin); rightArm.position.set(0.4, 1.25, 0); rightArm.castShadow = true; root.add(rightArm);
  const legGeo = new THREE.CapsuleGeometry(0.1, 0.45, 4, 8);
  const leftLeg = new THREE.Mesh(legGeo, matPants); leftLeg.position.set(-0.14, 0.45, 0); leftLeg.castShadow = true; root.add(leftLeg);
  const rightLeg = new THREE.Mesh(legGeo, matPants); rightLeg.position.set(0.14, 0.45, 0); rightLeg.castShadow = true; root.add(rightLeg);
  const shoeGeo = new THREE.BoxGeometry(0.16, 0.1, 0.28);
  const leftShoe = new THREE.Mesh(shoeGeo, matShoe); leftShoe.position.set(-0.14, 0.08, 0.04); root.add(leftShoe);
  const rightShoe = new THREE.Mesh(shoeGeo, matShoe); rightShoe.position.set(0.14, 0.08, 0.04); root.add(rightShoe);
  root.userData = { leftArm, rightArm, leftLeg, rightLeg, leftShoe, rightShoe, torso, head };
  return root;
}
const runner = createRunner();
scene.add(runner);

const state = {
  playing: false, speed: 12, baseSpeed: 12, lane: 1, targetX: 0, y: 0, vy: 0,
  jumping: false, sliding: false, slideTimer: 0, distance: 0, score: 0, coins: 0,
  clock: 0, spawnZ: -40, obstacles: [], coins3d: [], dead: false
};

function clearWorld() {
  [...state.obstacles, ...state.coins3d].forEach((o) => scene.remove(o.mesh));
  state.obstacles = []; state.coins3d = [];
}

function spawnStuffAt(z) {
  const lane = Math.floor(Math.random() * 3);
  if (Math.random() < 0.5) {
    const tall = Math.random() > 0.45;
    const geo = tall ? new THREE.BoxGeometry(1.1, 1.5, 1.1) : new THREE.BoxGeometry(1.2, 0.75, 1.2);
    const mesh = new THREE.Mesh(geo, matRock);
    mesh.castShadow = true;
    mesh.position.set(LANES[lane], tall ? 0.75 : 0.38, z);
    scene.add(mesh);
    state.obstacles.push({ mesh, lane, type: tall ? 'high' : 'low', z });
  } else {
    for (let i = 0; i < 4; i++) {
      const mesh = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.05, 16), matCoin);
      mesh.rotation.x = Math.PI / 2;
      mesh.position.set(LANES[lane], 1.15, z - i * 1.3);
      scene.add(mesh);
      state.coins3d.push({ mesh, lane, z: z - i * 1.3, taken: false });
    }
  }
}

function resetGame() {
  state.playing = true; state.dead = false; state.speed = state.baseSpeed;
  state.lane = 1; state.targetX = LANES[1]; state.y = 0; state.vy = 0;
  state.jumping = false; state.sliding = false; state.slideTimer = 0;
  state.distance = 0; state.score = 0; state.coins = 0; state.clock = 0;
  runner.position.set(0, 0, 0); runner.scale.set(1, 1, 1); runner.rotation.x = 0;
  clearWorld();
  segments.forEach((s, i) => { s.position.z = -i * 20; });
  for (let i = 0; i < 10; i++) spawnStuffAt(-25 - i * 12);
  updateHud();
}

function changeLane(dir) {
  const next = Math.max(0, Math.min(2, state.lane + dir));
  if (next === state.lane) return;
  state.lane = next; state.targetX = LANES[next];
}
function jump() {
  if (state.jumping || state.sliding) return;
  state.jumping = true; state.vy = 9.5;
}
function slide() {
  if (state.jumping || state.sliding) return;
  state.sliding = true; state.slideTimer = 0.55;
}

window.addEventListener('keydown', (e) => {
  if (!state.playing) return;
  if (e.code === 'ArrowLeft' || e.code === 'KeyA') changeLane(-1);
  if (e.code === 'ArrowRight' || e.code === 'KeyD') changeLane(1);
  if (e.code === 'ArrowUp' || e.code === 'KeyW' || e.code === 'Space') jump();
  if (e.code === 'ArrowDown' || e.code === 'KeyS') slide();
  e.preventDefault();
});

let touchStartX = 0, touchStartY = 0;
canvas.addEventListener('touchstart', (e) => {
  const t = e.changedTouches[0]; touchStartX = t.clientX; touchStartY = t.clientY;
}, { passive: true });
canvas.addEventListener('touchend', (e) => {
  if (!state.playing) return;
  const t = e.changedTouches[0];
  const dx = t.clientX - touchStartX, dy = t.clientY - touchStartY;
  if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 30) changeLane(dx > 0 ? 1 : -1);
  else if (Math.abs(dy) > 30) { if (dy < 0) jump(); else slide(); }
}, { passive: true });

$('btn-play').addEventListener('click', () => {
  startMenu.classList.remove('active'); startMenu.classList.add('hidden');
  gameOverScreen.classList.add('hidden'); hud.classList.remove('hidden'); resetGame();
});
$('btn-retry').addEventListener('click', () => {
  gameOverScreen.classList.add('hidden'); hud.classList.remove('hidden'); resetGame();
});
$('btn-go-menu').addEventListener('click', () => {
  gameOverScreen.classList.add('hidden'); hud.classList.add('hidden');
  startMenu.classList.remove('hidden'); startMenu.classList.add('active');
  state.playing = false;
  $('menu-high-score').textContent = loadNum(STORAGE.highScore);
  $('menu-total-coins').textContent = '🪙 ' + loadNum(STORAGE.totalGold);
});
$('btn-controls').addEventListener('click', () => controlsModal.classList.remove('hidden'));
$('btn-close-controls').addEventListener('click', () => controlsModal.classList.add('hidden'));
$('btn-controls-ok').addEventListener('click', () => controlsModal.classList.add('hidden'));

function updateHud() {
  $('hud-score-val').textContent = Math.floor(state.score);
  $('hud-coins-val').textContent = '🪙 ' + state.coins;
  $('hud-dist-val').textContent = Math.floor(state.distance) + 'm';
}

function die(reason) {
  if (state.dead) return;
  state.dead = true; state.playing = false; hud.classList.add('hidden');
  const score = Math.floor(state.score);
  const high = loadNum(STORAGE.highScore);
  const isNew = score > high;
  if (isNew) saveNum(STORAGE.highScore, score);
  saveNum(STORAGE.totalGold, loadNum(STORAGE.totalGold) + state.coins);
  $('go-score').textContent = score;
  $('go-coins').textContent = '🪙 ' + state.coins;
  $('go-distance').textContent = Math.floor(state.distance) + 'm';
  $('game-over-reason').textContent = reason || 'You hit an obstacle';
  newRecordBadge.classList.toggle('hidden', !isNew);
  gameOverScreen.classList.remove('hidden');
}

function animateRunner() {
  const u = runner.userData;
  const runCycle = Math.sin(state.clock * 14);
  if (state.sliding) {
    runner.scale.y = 0.55;
    u.leftArm.rotation.x = -0.8; u.rightArm.rotation.x = -0.8;
    u.leftLeg.rotation.x = 0.3; u.rightLeg.rotation.x = 0.3;
  } else {
    runner.scale.y = 1;
    const swing = runCycle * 0.7;
    u.leftArm.rotation.x = swing; u.rightArm.rotation.x = -swing;
    u.leftLeg.rotation.x = -swing * 0.9; u.rightLeg.rotation.x = swing * 0.9;
    u.torso.position.y = 1.15 + Math.abs(runCycle) * 0.03;
    u.head.position.y = 1.72 + Math.abs(runCycle) * 0.03;
  }
  runner.position.y = state.y;
  runner.rotation.z = -(state.targetX - runner.position.x) * 0.15;
}

function checkCollisions() {
  const px = runner.position.x, py = state.y, sliding = state.sliding;
  for (const o of state.obstacles) {
    if (o.z < -1 || o.z > 2.2) continue;
    if (Math.abs(o.mesh.position.x - px) > 0.95) continue;
    if (o.type === 'low') { if (py < 0.85) { die('Tripped over a rock'); return; } }
    else { if (!sliding && py < 0.3) { die('Hit a barrier'); return; } }
  }
  for (const c of state.coins3d) {
    if (c.taken) continue;
    if (c.z < -0.5 || c.z > 2) continue;
    if (Math.abs(c.mesh.position.x - px) < 0.75 && c.z > -0.3 && c.z < 1.8) {
      c.taken = true; state.coins += 1; scene.remove(c.mesh);
    }
  }
}

const clock = new THREE.Clock();
function tick() {
  requestAnimationFrame(tick);
  const dt = Math.min(clock.getDelta(), 0.05);
  if (state.playing && !state.dead) {
    state.clock += dt;
    state.speed = state.baseSpeed + state.distance * 0.015;
    state.distance += state.speed * dt;
    state.score = state.distance * 2 + state.coins * 10;
    const move = state.speed * dt;
    segments.forEach((s) => { s.position.z += move; if (s.position.z > 20) s.position.z -= 160; });
    runner.position.x += (state.targetX - runner.position.x) * Math.min(1, 12 * dt);
    if (state.jumping) {
      state.vy -= 28 * dt; state.y += state.vy * dt;
      if (state.y <= 0) { state.y = 0; state.vy = 0; state.jumping = false; }
    }
    if (state.sliding) { state.slideTimer -= dt; if (state.slideTimer <= 0) state.sliding = false; }
    animateRunner();
    for (const o of state.obstacles) { o.mesh.position.z += move; o.z = o.mesh.position.z; }
    for (const c of state.coins3d) { c.mesh.position.z += move; c.z = c.mesh.position.z; c.mesh.rotation.z += dt * 3; }
    state.obstacles = state.obstacles.filter((o) => { if (o.z > 12) { scene.remove(o.mesh); return false; } return true; });
    state.coins3d = state.coins3d.filter((c) => { if (c.z > 12 || c.taken) { if (!c.taken) scene.remove(c.mesh); return false; } return true; });
    const lastObs = state.obstacles[state.obstacles.length - 1];
    const lastCoin = state.coins3d[state.coins3d.length - 1];
    const lastZ = Math.min(lastObs ? lastObs.z : -40, lastCoin ? lastCoin.z : -40);
    if (lastZ > -55 && Math.random() < 0.04) spawnStuffAt(lastZ - (10 + Math.random() * 8));
    checkCollisions();
    updateHud();
    camera.position.x += (runner.position.x * 0.35 - camera.position.x) * 0.08;
    camera.position.y = 4.2 + state.y * 0.15;
    camera.lookAt(runner.position.x * 0.3, 1.2 + state.y * 0.3, -4);
  } else if (!state.playing) {
    state.clock += dt; animateRunner(); runner.position.y = Math.sin(state.clock * 2) * 0.05;
  }
  renderer.render(scene, camera);
}

for (let i = 0; i < 6; i++) spawnStuffAt(-20 - i * 14);
animateRunner();
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
tick();
