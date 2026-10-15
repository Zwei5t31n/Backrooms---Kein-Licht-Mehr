import * as THREE from "three";

const CELL = 4;
const CHUNK_CELLS = 12;
const CHUNK_SIZE = CELL * CHUNK_CELLS;
const CHUNK_RADIUS = 2;
const SPAWN_COORD = (Math.floor(CHUNK_CELLS / 2) + 0.5) * CELL;
const BATTERY_MAX = 100;
const container = document.querySelector("#game");
const overlay = document.querySelector("#overlay");
const startButton = document.querySelector("#start-button");
const dialogKicker = document.querySelector("#dialog-kicker");
const dialogTitle = document.querySelector("#dialog-title");
const dialogCopy = document.querySelector("#dialog-copy");
const mapCanvas = document.querySelector("#minimap");
const mapContext = mapCanvas.getContext("2d");
const batteryDisplay = document.querySelector("#battery-level");
const batteryFill = document.querySelector("#battery-fill");
const phoneDisplay = document.querySelector("#spare-phones");
const towelDisplay = document.querySelector("#towel-count");
const hideVeil = document.querySelector("#hide-veil");
const hideStatus = document.querySelector("#hide-status");
const hideTimer = document.querySelector("#hide-timer");
const timerDisplay = document.querySelector("#survival-time");
const mapButton = document.querySelector("#map-toggle");
const mapCard = document.querySelector("#map-card");
const toast = document.querySelector("#message");
const loading = document.querySelector("#loading");

let renderer;
try {
  renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
} catch (error) {
  loading.textContent = "3D-RENDERING IST IN DIESEM BROWSER NICHT VERFÜGBAR";
  console.error("WebGL konnte nicht initialisiert werden.", error);
  throw error;
}

renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.7));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.15;
container.appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x020304);
scene.fog = new THREE.FogExp2(0x020304, 0.036);
const camera = new THREE.PerspectiveCamera(76, window.innerWidth / window.innerHeight, 0.1, 115);
camera.rotation.order = "YXZ";
scene.add(camera);

const textureLoader = new THREE.TextureLoader();
const maxAnisotropy = renderer.capabilities.getMaxAnisotropy();
const floorTexture = textureLoader.load("./textures/backrooms/carpet/carpet_color.png");
const wallTexture = textureLoader.load("./textures/backrooms/wallpaper/wallpaper_color.png");
const ceilingTexture = textureLoader.load("./textures/backrooms/ceiling_tiles_2/ceiling_tiles_2_color.png");
const poolTexture = textureLoader.load("./textures/backrooms/pool_tiles/pool_tiles_color.png");
const floorNormal = textureLoader.load("./textures/backrooms/carpet/carpet_normal.png");
const wallNormal = textureLoader.load("./textures/backrooms/wallpaper/wallpaper_normal.png");
const ceilingNormal = textureLoader.load("./textures/backrooms/ceiling_tiles_2/ceiling_tiles_2_normal.png");
const poolNormal = textureLoader.load("./textures/backrooms/pool_tiles/pool_tiles_normal.png");
const poolHeight = textureLoader.load("./textures/backrooms/pool_tiles/pool_tiles_height.png");
const floorRoughness = textureLoader.load("./textures/backrooms/carpet/carpet_rough.png");
const wallRoughness = textureLoader.load("./textures/backrooms/wallpaper/wallpaper_rough.png");
const ceilingRoughness = textureLoader.load("./textures/backrooms/ceiling_tiles_2/ceiling_tiles_2_rough.png");
const poolRoughness = textureLoader.load("./textures/backrooms/pool_tiles/pool_tiles_rough.png");
const colorTextures = [floorTexture, wallTexture, ceilingTexture, poolTexture];
const dataTextures = [
  floorNormal, wallNormal, ceilingNormal, poolNormal, poolHeight,
  floorRoughness, wallRoughness, ceilingRoughness, poolRoughness
];
[...colorTextures, ...dataTextures].forEach(texture => {
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.anisotropy = maxAnisotropy;
});
colorTextures.forEach(texture => { texture.colorSpace = THREE.SRGBColorSpace; });
dataTextures.forEach(texture => { texture.colorSpace = THREE.NoColorSpace; });
floorTexture.repeat.set(8, 8);
floorNormal.repeat.set(8, 8);
floorRoughness.repeat.set(8, 8);
wallTexture.repeat.set(2, 2.4);
wallNormal.repeat.set(2, 2.4);
wallRoughness.repeat.set(2, 2.4);
ceilingTexture.repeat.set(21, 21);
ceilingNormal.repeat.set(21, 21);
ceilingRoughness.repeat.set(21, 21);
poolTexture.repeat.set(12, 12);
poolNormal.repeat.set(12, 12);
poolHeight.repeat.set(12, 12);
poolRoughness.repeat.set(12, 12);

function loadPoolWallTexture(file, colorSpace) {
  const texture = textureLoader.load(`./textures/backrooms/pool_tiles/${file}`);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(1, 0.8);
  texture.anisotropy = maxAnisotropy;
  texture.colorSpace = colorSpace;
  return texture;
}

const poolWallColor = loadPoolWallTexture("pool_tiles_color.png", THREE.SRGBColorSpace);
const poolWallNormal = loadPoolWallTexture("pool_tiles_normal.png", THREE.NoColorSpace);
const poolWallHeight = loadPoolWallTexture("pool_tiles_height.png", THREE.NoColorSpace);
const poolWallRoughness = loadPoolWallTexture("pool_tiles_rough.png", THREE.NoColorSpace);

const floorMaterial = new THREE.MeshStandardMaterial({
  map: floorTexture, normalMap: floorNormal, roughnessMap: floorRoughness, roughness: 1
});
const poolFloorMaterial = new THREE.MeshStandardMaterial({
  map: poolTexture, normalMap: poolNormal, roughnessMap: poolRoughness,
  bumpMap: poolHeight, bumpScale: 0.025, roughness: 1
});
const ceilingMaterial = new THREE.MeshStandardMaterial({
  map: ceilingTexture, normalMap: ceilingNormal, roughnessMap: ceilingRoughness, roughness: 1, side: THREE.DoubleSide
});
const poolCeilingMaterial = new THREE.MeshStandardMaterial({
  map: poolTexture, normalMap: poolNormal, roughnessMap: poolRoughness,
  bumpMap: poolHeight, bumpScale: 0.025, roughness: 1, side: THREE.DoubleSide
});
const wallMaterials = [
  new THREE.MeshStandardMaterial({
    map: wallTexture, normalMap: wallNormal, roughnessMap: wallRoughness,
    roughness: 1, side: THREE.DoubleSide
  }),
  new THREE.MeshStandardMaterial({
    map: poolWallColor, normalMap: poolWallNormal, roughnessMap: poolWallRoughness,
    bumpMap: poolWallHeight, bumpScale: 0.035, roughness: 1, side: THREE.DoubleSide
  })
];
const wallGeometry = new THREE.BoxGeometry(CELL, 3.2, CELL);
const floorGeometry = new THREE.PlaneGeometry(CHUNK_SIZE, CHUNK_SIZE);
const ceilingGeometry = new THREE.PlaneGeometry(CHUNK_SIZE, CHUNK_SIZE);

const flashlight = new THREE.SpotLight(0xe8f5ff, 21, 26, Math.PI / 5, 0.58, 1.15);
flashlight.position.set(0, -0.12, -0.1);
flashlight.target.position.set(0, 0, -1);
camera.add(flashlight, flashlight.target);

const principal = new THREE.Group();
const suitMaterial = new THREE.MeshStandardMaterial({ color: 0x161a21, roughness: 0.85 });
const shirtMaterial = new THREE.MeshStandardMaterial({ color: 0xc6c5bd, roughness: 0.9 });
const faceMaterial = new THREE.MeshStandardMaterial({ color: 0xb9a995, roughness: 0.95 });
const hairMaterial = new THREE.MeshStandardMaterial({ color: 0x17130f, roughness: 1 });
const tieMaterial = new THREE.MeshStandardMaterial({ color: 0x721c22, roughness: 0.75 });
const eyeMaterial = new THREE.MeshBasicMaterial({ color: 0xff332b });
const torso = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.92, 0.38), suitMaterial);
torso.position.y = 1.1;
principal.add(torso);
const shirt = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.72, 0.06), shirtMaterial);
shirt.position.set(0, 1.13, -0.22);
principal.add(shirt);
const tie = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.49, 0.035), tieMaterial);
tie.position.set(0, 0.99, -0.26);
principal.add(tie);
const head = new THREE.Mesh(new THREE.SphereGeometry(0.24, 12, 10), faceMaterial);
head.position.y = 1.82;
principal.add(head);
const hair = new THREE.Mesh(new THREE.SphereGeometry(0.245, 12, 6, 0, Math.PI * 2, 0, Math.PI * 0.52), hairMaterial);
hair.position.y = 1.9;
principal.add(hair);
for (const eyeX of [-0.09, 0.09]) {
  const eye = new THREE.Mesh(new THREE.SphereGeometry(0.026, 8, 6), eyeMaterial);
  eye.position.set(eyeX, 1.83, -0.222);
  principal.add(eye);
}
for (const side of [-1, 1]) {
  const arm = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.78, 0.23), suitMaterial);
  arm.position.set(side * 0.46, 1.08, 0);
  arm.rotation.z = side * -0.08;
  principal.add(arm);
  const leg = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.75, 0.28), suitMaterial);
  leg.position.set(side * 0.19, 0.38, 0);
  principal.add(leg);
  const shoe = new THREE.Mesh(new THREE.BoxGeometry(0.29, 0.14, 0.4), hairMaterial);
  shoe.position.set(side * 0.19, 0.08, -0.045);
  principal.add(shoe);
}
principal.visible = false;
scene.add(principal);

const chunks = new Map();
const collectedItems = new Set();
const usedChargers = new Set();
const wallCache = new Map();
const player = { x: SPAWN_COORD, z: SPAWN_COORD, yaw: 0, pitch: 0, radius: 0.32 };
const principalState = {
  x: 0, z: 0, path: [], refresh: 0, warning: false,
  hiddenTarget: null, passExitTarget: null, passWaypointReached: false
};
const keys = new Set();
let running = false;
let active = false;
let mapVisible = false;
let battery = BATTERY_MAX;
let sparePhones = 0;
let towelCount = 0;
let hiddenSeconds = 0;
let lightBeforeHide = true;
let pitchBeforeHide = 0;
let nextPrincipalAttack = 0;
let principalPhase = "inactive";
let elapsed = 0;
let previousTime = performance.now();
let messageTimeout;
let worldSeed = Math.floor(Math.random() * 0xffffffff);

function hash(x, z, salt = 0) {
  let value = Math.imul(x ^ worldSeed ^ 0x45d9f3b, 0x27d4eb2d) ^ Math.imul(z ^ salt, 0x165667b1);
  value = Math.imul(value ^ (value >>> 15), 0x85ebca6b);
  value = Math.imul(value ^ (value >>> 13), 0xc2b2ae35);
  return (value ^ (value >>> 16)) >>> 0;
}

function seededRandom(seed) {
  let state = seed >>> 0;
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

function chunkKey(x, z) {
  return `${x},${z}`;
}

function chunkForCell(cell) {
  return Math.floor(cell / CHUNK_CELLS);
}

function isWallCell(cellX, cellZ) {
  const chunkX = chunkForCell(cellX);
  const chunkZ = chunkForCell(cellZ);
  const localX = cellX - chunkX * CHUNK_CELLS;
  const localZ = cellZ - chunkZ * CHUNK_CELLS;
  if (localX === 6 || localZ === 6) return false;
  const seed = hash(chunkX, chunkZ);
  if (seed % 3 === 0 && localX === 2) return false;
  if (seed % 5 === 0 && localZ === 9) return false;
  return hash(cellX, cellZ, 0x71a3) % 100 < 34;
}

function cellPosition(cellX, cellZ) {
  return { x: (cellX + 0.5) * CELL, z: (cellZ + 0.5) * CELL };
}

const towelCanvas = document.createElement("canvas");
towelCanvas.width = 256;
towelCanvas.height = 128;
const towelContext = towelCanvas.getContext("2d");
towelContext.fillStyle = "#d8d0bc";
towelContext.fillRect(0, 0, towelCanvas.width, towelCanvas.height);
towelContext.strokeStyle = "#8f8879";
towelContext.lineWidth = 5;
towelContext.strokeRect(4, 4, towelCanvas.width - 8, towelCanvas.height - 8);
towelContext.fillStyle = "#332d24";
towelContext.font = "bold 30px sans-serif";
towelContext.textAlign = "center";
towelContext.textBaseline = "middle";
towelContext.fillText("KEINE PANIK", towelCanvas.width / 2, towelCanvas.height / 2);
const towelTexture = new THREE.CanvasTexture(towelCanvas);
towelTexture.colorSpace = THREE.SRGBColorSpace;
towelTexture.anisotropy = maxAnisotropy;

function makePickup(type, position) {
  const group = new THREE.Group();
  const colors = { cell: 0x8deaff, phone: 0xc6d0e0, charger: 0xffca75, towel: 0xd8d0bc };
  const material = new THREE.MeshStandardMaterial({
    color: colors[type], metalness: type === "phone" ? 0.55 : 0.18, roughness: 0.36
  });
  if (type === "charger") {
    const base = new THREE.Mesh(new THREE.BoxGeometry(0.52, 1.25, 0.4), material);
    base.position.y = 0.62;
    group.add(base);
    const plug = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.18, 0.08), material);
    plug.position.set(0, 1.35, -0.2);
    group.add(plug);
  } else if (type === "towel") {
    const folded = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.2, 0.48), material);
    folded.position.y = 0.1;
    group.add(folded);
    const label = new THREE.Mesh(
      new THREE.PlaneGeometry(0.54, 0.27),
      new THREE.MeshBasicMaterial({ map: towelTexture, side: THREE.DoubleSide })
    );
    label.rotation.x = -Math.PI / 2;
    label.position.set(0, 0.205, 0);
    group.add(label);
  } else {
    const item = new THREE.Mesh(
      type === "phone" ? new THREE.BoxGeometry(0.32, 0.62, 0.08) : new THREE.OctahedronGeometry(0.35, 0),
      material
    );
    item.position.y = 0.48;
    if (type === "phone") item.rotation.x = -0.18;
    group.add(item);
  }
  group.position.set(position.x, 0, position.z);
  return group;
}

function addChunk(chunkX, chunkZ) {
  const key = chunkKey(chunkX, chunkZ);
  if (chunks.has(key)) return;
  const seed = hash(chunkX, chunkZ);
  const random = seededRandom(seed);
  const isPool = seed % 13 === 0;
  const group = new THREE.Group();
  group.position.set(chunkX * CHUNK_SIZE, 0, chunkZ * CHUNK_SIZE);

  const floor = new THREE.Mesh(floorGeometry, isPool ? poolFloorMaterial : floorMaterial);
  floor.rotation.x = -Math.PI / 2;
  floor.position.set(CHUNK_SIZE / 2, -0.13, CHUNK_SIZE / 2);
  group.add(floor);
  const ceiling = new THREE.Mesh(ceilingGeometry, isPool ? poolCeilingMaterial : ceilingMaterial);
  ceiling.rotation.x = Math.PI / 2;
  ceiling.position.set(CHUNK_SIZE / 2, 3.12, CHUNK_SIZE / 2);
  group.add(ceiling);

  const wallMeshes = new THREE.InstancedMesh(wallGeometry, wallMaterials[Number(isPool)], CHUNK_CELLS ** 2);
  const dummy = new THREE.Object3D();
  let wallCount = 0;
  for (let localZ = 0; localZ < CHUNK_CELLS; localZ += 1) {
    for (let localX = 0; localX < CHUNK_CELLS; localX += 1) {
      const cellX = chunkX * CHUNK_CELLS + localX;
      const cellZ = chunkZ * CHUNK_CELLS + localZ;
      if (!isWallCell(cellX, cellZ)) continue;
      dummy.position.set((localX + 0.5) * CELL, 1.47, (localZ + 0.5) * CELL);
      dummy.updateMatrix();
      wallMeshes.setMatrixAt(wallCount, dummy.matrix);
      wallCount += 1;
    }
  }
  wallMeshes.count = wallCount;
  group.add(wallMeshes);
  scene.add(group);

  const pickups = [];
  const itemRoll = random();
  const type = itemRoll < 0.07 ? "phone"
    : itemRoll < 0.24 ? "cell"
      : itemRoll < 0.31 ? "charger"
        : itemRoll < 0.47 ? "towel" : null;
  if (type) {
    let localX;
    let localZ;
    for (let attempt = 0; attempt < 80; attempt += 1) {
      localX = 1 + Math.floor(random() * (CHUNK_CELLS - 2));
      localZ = 1 + Math.floor(random() * (CHUNK_CELLS - 2));
      if (!isWallCell(chunkX * CHUNK_CELLS + localX, chunkZ * CHUNK_CELLS + localZ)) break;
    }
    const id = `${key}:${type}`;
    const alreadyUsed = type === "charger" ? usedChargers.has(id) : collectedItems.has(id);
    if (!alreadyUsed) {
      const position = cellPosition(chunkX * CHUNK_CELLS + localX, chunkZ * CHUNK_CELLS + localZ);
      const localPosition = { x: position.x - chunkX * CHUNK_SIZE, z: position.z - chunkZ * CHUNK_SIZE };
      const pickup = { id, type, position, group: makePickup(type, localPosition) };
      group.add(pickup.group);
      pickups.push(pickup);
    }
  }

  chunks.set(key, { group, pickups, pool: isPool });
}

function updateChunks() {
  const centerX = Math.floor(player.x / CHUNK_SIZE);
  const centerZ = Math.floor(player.z / CHUNK_SIZE);
  for (let z = centerZ - CHUNK_RADIUS; z <= centerZ + CHUNK_RADIUS; z += 1) {
    for (let x = centerX - CHUNK_RADIUS; x <= centerX + CHUNK_RADIUS; x += 1) addChunk(x, z);
  }
  for (const [key, chunk] of chunks) {
    const [x, z] = key.split(",").map(Number);
    if (Math.abs(x - centerX) <= CHUNK_RADIUS && Math.abs(z - centerZ) <= CHUNK_RADIUS) continue;
    scene.remove(chunk.group);
    chunks.delete(key);
  }
}

function isWallAtWorld(x, z) {
  const cellX = Math.floor(x / CELL);
  const cellZ = Math.floor(z / CELL);
  const key = `${cellX},${cellZ}`;
  if (!wallCache.has(key)) wallCache.set(key, isWallCell(cellX, cellZ));
  return wallCache.get(key);
}

function canOccupy(x, z) {
  const radius = player.radius;
  return !isWallAtWorld(x - radius, z - radius) && !isWallAtWorld(x + radius, z - radius)
    && !isWallAtWorld(x - radius, z + radius) && !isWallAtWorld(x + radius, z + radius);
}

function formatTime(seconds) {
  const wholeSeconds = Math.floor(seconds);
  return `${String(Math.floor(wholeSeconds / 60)).padStart(2, "0")}:${String(wholeSeconds % 60).padStart(2, "0")}`;
}

function setHUD() {
  const percentage = Math.ceil(battery);
  batteryDisplay.textContent = `${percentage}%`;
  batteryFill.style.width = `${percentage}%`;
  batteryFill.classList.toggle("low", percentage <= 20);
  batteryDisplay.classList.toggle("low", percentage <= 20);
  phoneDisplay.textContent = String(sparePhones).padStart(2, "0");
  towelDisplay.textContent = String(towelCount).padStart(2, "0");
  hideVeil.hidden = hiddenSeconds <= 0;
  hideStatus.hidden = hiddenSeconds <= 0;
  hideTimer.textContent = `${Math.ceil(hiddenSeconds)} s`;
  timerDisplay.textContent = formatTime(elapsed);
  mapButton.setAttribute("aria-pressed", String(mapVisible));
  mapButton.textContent = mapVisible ? "KARTE AUS" : "KARTE AN";
}

function showMessage(text) {
  toast.textContent = text;
  toast.classList.add("visible");
  clearTimeout(messageTimeout);
  messageTimeout = setTimeout(() => toast.classList.remove("visible"), 2600);
}

function toggleMap() {
  mapVisible = !mapVisible;
  mapCard.hidden = !mapVisible;
  setHUD();
  if (mapVisible) drawMinimap();
}

function drawMinimap() {
  const size = mapCanvas.width;
  const cells = 19;
  const tile = size / cells;
  const centerX = Math.floor(player.x / CELL);
  const centerZ = Math.floor(player.z / CELL);
  mapContext.fillStyle = "#080b0d";
  mapContext.fillRect(0, 0, size, size);
  for (let row = 0; row < cells; row += 1) {
    for (let col = 0; col < cells; col += 1) {
      const cellX = centerX + col - Math.floor(cells / 2);
      const cellZ = centerZ + row - Math.floor(cells / 2);
      mapContext.fillStyle = isWallAtWorld((cellX + 0.5) * CELL, (cellZ + 0.5) * CELL) ? "#555247" : "#18201c";
      mapContext.fillRect(col * tile, row * tile, tile + 0.4, tile + 0.4);
      const chunkX = chunkForCell(cellX);
      const chunkZ = chunkForCell(cellZ);
      const chunk = chunks.get(chunkKey(chunkX, chunkZ));
      if (chunk) {
        for (const pickup of chunk.pickups) {
          if (!pickup.group.visible) continue;
          const px = pickup.position.x / CELL;
          const pz = pickup.position.z / CELL;
          if (Math.floor(px) === cellX && Math.floor(pz) === cellZ) {
            mapContext.fillStyle = pickup.type === "phone" ? "#ddd8ff"
              : pickup.type === "charger" ? "#ffc76f"
                : pickup.type === "towel" ? "#dfd4b9" : "#68e9ff";
            mapContext.fillRect(col * tile + tile * 0.3, row * tile + tile * 0.3, tile * 0.4, tile * 0.4);
          }
        }
      }
    }
  }
  mapContext.fillStyle = "#fff";
  mapContext.beginPath();
  mapContext.arc(size / 2, size / 2, tile * 0.38, 0, Math.PI * 2);
  mapContext.fill();
  mapContext.strokeStyle = "#fff";
  mapContext.lineWidth = 1.5;
  mapContext.beginPath();
  mapContext.moveTo(size / 2, size / 2);
  mapContext.lineTo(size / 2 - Math.sin(player.yaw) * tile * 1.6, size / 2 - Math.cos(player.yaw) * tile * 1.6);
  mapContext.stroke();
  const principalCellX = Math.floor(principalState.x / CELL);
  const principalCellZ = Math.floor(principalState.z / CELL);
  const principalCol = principalCellX - centerX + Math.floor(cells / 2);
  const principalRow = principalCellZ - centerZ + Math.floor(cells / 2);
  if (principal.visible && principalCol >= 0 && principalCol < cells && principalRow >= 0 && principalRow < cells) {
    mapContext.fillStyle = "#ff5148";
    mapContext.beginPath();
    mapContext.arc((principalCol + 0.5) * tile, (principalRow + 0.5) * tile, tile * 0.38, 0, Math.PI * 2);
    mapContext.fill();
  }
}

function findPrincipalPath(targetCell = {
  x: Math.floor(player.x / CELL),
  z: Math.floor(player.z / CELL)
}) {
  const from = { x: Math.floor(principalState.x / CELL), z: Math.floor(principalState.z / CELL) };
  const to = targetCell;
  if (from.x === to.x && from.z === to.z) return [to];
  const minX = Math.min(from.x, to.x) - 2;
  const maxX = Math.max(from.x, to.x) + 2;
  const minZ = Math.min(from.z, to.z) - 2;
  const maxZ = Math.max(from.z, to.z) + 2;
  if ((maxX - minX + 1) * (maxZ - minZ + 1) > 6400) return [];

  const cellKey = cell => `${cell.x},${cell.z}`;
  const previous = new Map([[cellKey(from), null]]);
  const queue = [from];
  for (let head = 0; head < queue.length; head += 1) {
    const current = queue[head];
    if (current.x === to.x && current.z === to.z) break;
    for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const next = { x: current.x + dx, z: current.z + dz };
      const key = cellKey(next);
      if (next.x < minX || next.x > maxX || next.z < minZ || next.z > maxZ
        || previous.has(key) || isWallCell(next.x, next.z)) continue;
      previous.set(key, cellKey(current));
      queue.push(next);
    }
  }

  const goalKey = cellKey(to);
  if (!previous.has(goalKey)) return [];
  const path = [];
  let key = goalKey;
  while (key !== cellKey(from)) {
    const [x, z] = key.split(",").map(Number);
    path.push({ x, z });
    key = previous.get(key);
  }
  return path.reverse();
}

function placePrincipalAtSpawn() {
  principalState.path = [];
  principalState.refresh = 0;
  principalState.warning = false;
  principalState.hiddenTarget = null;
  principalState.passExitTarget = null;
  principalState.passWaypointReached = false;
  principalPhase = "inactive";
  principal.visible = false;
  schedulePrincipalAttack();
}

function schedulePrincipalAttack() {
  nextPrincipalAttack = elapsed + 18 + Math.random() * 22;
}

function isPoolAreaAtPlayer() {
  const cellX = Math.floor(player.x / CELL);
  const cellZ = Math.floor(player.z / CELL);
  const chunk = chunks.get(chunkKey(chunkForCell(cellX), chunkForCell(cellZ)));
  return Boolean(chunk && chunk.pool);
}

function trySpawnPrincipal() {
  const encounterChance = isPoolAreaAtPlayer() ? 0.98 : 0.36;
  schedulePrincipalAttack();
  if (Math.random() >= encounterChance) return;

  const playerCellX = Math.floor(player.x / CELL);
  const playerCellZ = Math.floor(player.z / CELL);
  const spawnCells = [];
  for (let z = playerCellZ - 9; z <= playerCellZ + 9; z += 1) {
    for (let x = playerCellX - 9; x <= playerCellX + 9; x += 1) {
      const distance = Math.abs(x - playerCellX) + Math.abs(z - playerCellZ);
      const localX = x - chunkForCell(x) * CHUNK_CELLS;
      const localZ = z - chunkForCell(z) * CHUNK_CELLS;
      if (distance < 5 || distance > 9 || (localX !== 6 && localZ !== 6) || isWallCell(x, z)) continue;
      const position = cellPosition(x, z);
      if (canOccupy(position.x, position.z)) spawnCells.push(position);
    }
  }
  if (!spawnCells.length) return;
  const spawn = spawnCells[Math.floor(Math.random() * spawnCells.length)];
  principalState.x = spawn.x;
  principalState.z = spawn.z;
  principalState.path = [];
  principalState.refresh = 0;
  principalState.warning = false;
  principalState.hiddenTarget = null;
  principalState.passExitTarget = null;
  principalState.passWaypointReached = false;
  principal.position.set(spawn.x, 0, spawn.z);
  principalPhase = "attack";
  principal.visible = true;
  showMessage(isPoolAreaAtPlayer()
    ? "Im Poolbereich ist der Schulleiter aufgetaucht! Versteck dich!"
    : "Der Schulleiter ist aufgetaucht! Lauf oder versteck dich unter einem Handtuch.");
}

function hideUnderTowel() {
  if (towelCount <= 0) {
    showMessage("Du hast kein „Keine Panik“-Handtuch mehr.");
    return;
  }
  if (principalPhase !== "attack") {
    showMessage("Warte, bis der Schulleiter auftaucht – dann schützt dich das Handtuch.");
    return;
  }
  towelCount -= 1;
  hiddenSeconds = 8;
  lightBeforeHide = flashlight.visible;
  pitchBeforeHide = player.pitch;
  keys.clear();
  const dx = player.x - principalState.x;
  const dz = player.z - principalState.z;
  const distance = Math.max(1, Math.hypot(dx, dz));
  const targetX = Math.floor((player.x + dx / distance * CELL * 5) / CELL);
  const targetZ = Math.floor((player.z + dz / distance * CELL * 5) / CELL);
  const playerCell = { x: Math.floor(player.x / CELL), z: Math.floor(player.z / CELL) };
  principalState.hiddenTarget = playerCell;
  principalState.passExitTarget = { x: targetX, z: targetZ };
  principalState.passWaypointReached = false;
  const targetLocalX = targetX - chunkForCell(targetX) * CHUNK_CELLS;
  const targetLocalZ = targetZ - chunkForCell(targetZ) * CHUNK_CELLS;
  if (isWallCell(targetX, targetZ) || (targetLocalX !== 6 && targetLocalZ !== 6)) {
    let foundOpenCell = false;
    for (let radius = 1; radius <= CHUNK_CELLS && !foundOpenCell; radius += 1) {
      for (let z = -radius; z <= radius && !foundOpenCell; z += 1) {
        for (let x = -radius; x <= radius; x += 1) {
          if (Math.abs(x) !== radius && Math.abs(z) !== radius) continue;
          const candidate = { x: targetX + x, z: targetZ + z };
          const candidateLocalX = candidate.x - chunkForCell(candidate.x) * CHUNK_CELLS;
          const candidateLocalZ = candidate.z - chunkForCell(candidate.z) * CHUNK_CELLS;
          if ((candidateLocalX !== 6 && candidateLocalZ !== 6) || isWallCell(candidate.x, candidate.z)) continue;
          principalState.passExitTarget = candidate;
          foundOpenCell = true;
          break;
        }
      }
    }
  }
  principalPhase = "pass";
  principalState.path = [];
  principalState.passWaypointReached = false;
  principalState.refresh = 0;
  setHUD();
  showMessage("Du versteckst dich. Der Schulleiter läuft an dir vorbei …");
}

function principalCaught() {
  if (hiddenSeconds > 0) return;
  if (sparePhones === 0) {
    flashlight.visible = false;
    battery = 0;
    principal.visible = false;
    principalPhase = "inactive";
    setHUD();
    showOverlay("caught");
    return;
  }
  sparePhones -= 1;
  principalState.path = [];
  principalState.hiddenTarget = null;
  principalState.passExitTarget = null;
  principalState.passWaypointReached = false;
  principalState.passExitTarget = null;
  principalState.passWaypointReached = false;
  principalPhase = "inactive";
  principal.visible = false;
  schedulePrincipalAttack();
  setHUD();
  showMessage("Der Schulleiter hat dir ein Ersatzhandy abgenommen und ist wieder verschwunden.");
}

function hasClearPathToPlayer() {
  const dx = player.x - principalState.x;
  const dz = player.z - principalState.z;
  const distance = Math.hypot(dx, dz);
  const steps = Math.ceil(distance / 0.4);
  for (let step = 1; step < steps; step += 1) {
    const progress = step / steps;
    if (isWallAtWorld(principalState.x + dx * progress, principalState.z + dz * progress)) return false;
  }
  return true;
}

function updatePrincipal(delta) {
  if (principalPhase === "inactive") {
    if (elapsed >= nextPrincipalAttack) trySpawnPrincipal();
    return;
  }
  if (hiddenSeconds > 0) hiddenSeconds = Math.max(0, hiddenSeconds - delta);

  principalState.refresh -= delta;
  if (principalState.refresh <= 0) {
    principalState.refresh = 0.55;
    const passTarget = principalPhase === "pass"
      ? (principalState.passWaypointReached ? principalState.passExitTarget : principalState.hiddenTarget)
      : undefined;
    principalState.path = findPrincipalPath(passTarget);
  }
  if (principalState.path.length) {
    const targetCell = principalState.path[0];
    const playerCellX = Math.floor(player.x / CELL);
    const playerCellZ = Math.floor(player.z / CELL);
    const targetsPlayer = (principalPhase === "attack"
      || (principalPhase === "pass" && !principalState.passWaypointReached))
      && targetCell.x === playerCellX && targetCell.z === playerCellZ;
    const target = targetsPlayer ? player : cellPosition(targetCell.x, targetCell.z);
    const dx = target.x - principalState.x;
    const dz = target.z - principalState.z;
    const distance = Math.hypot(dx, dz);
    if (distance < 0.28) {
      principalState.path.shift();
    } else {
      const step = Math.min(distance, 5.4 * delta);
      const nextX = principalState.x + dx / distance * step;
      const nextZ = principalState.z + dz / distance * step;
      if (canOccupy(nextX, nextZ)) {
        principalState.x = nextX;
        principalState.z = nextZ;
      } else {
        principalState.path = [];
      }
    }
  }

  const dx = player.x - principalState.x;
  const dz = player.z - principalState.z;
  const distance = Math.hypot(dx, dz);
  principal.position.set(principalState.x, Math.sin(elapsed * 5) * 0.035, principalState.z);
  if (distance > 0.01) principal.rotation.y = Math.atan2(-dx, -dz);
  if (principalPhase === "pass") {
    if (!principalState.passWaypointReached && distance < 1) {
      principalState.passWaypointReached = true;
      principalState.path = [];
      principalState.refresh = 0;
    }
    const passTarget = cellPosition(principalState.passExitTarget.x, principalState.passExitTarget.z);
    if (Math.hypot(principalState.x - passTarget.x, principalState.z - passTarget.z) < 0.35
      || hiddenSeconds <= 0) {
      principal.visible = false;
      principalPhase = "inactive";
      principalState.path = [];
      principalState.hiddenTarget = null;
      hiddenSeconds = 0;
      flashlight.visible = lightBeforeHide;
      player.pitch = pitchBeforeHide;
      principalState.refresh = 0;
      showMessage("Der Schulleiter ist vorbeigelaufen und verschwunden.");
    }
    return;
  }
  if (distance < 1.25 && hasClearPathToPlayer()) {
    principalCaught();
    return;
  } else if (distance < 14 && !principalState.warning) {
    principalState.warning = true;
    showMessage("Der Schulleiter ist ganz in der Nähe! Versteck dich unter einem Handtuch.");
  } else if (distance > 20) {
    principalState.warning = false;
  }
}

function showOverlay(kind) {
  active = false;
  if (kind !== "pause") running = false;
  overlay.hidden = false;
  if (document.pointerLockElement) document.exitPointerLock();
  if (kind === "pause") {
    dialogKicker.textContent = "ÜBERLEBEN PAUSIERT";
    dialogTitle.innerHTML = "STAY<br><span>ALIVE</span>";
    dialogCopy.textContent = `Du hast ${formatTime(elapsed)} überlebt. Dein Handy wartet auf dich.`;
    startButton.textContent = "WEITERSPIELEN →";
  } else if (kind === "dead") {
    const best = Math.max(elapsed, Number(localStorage.getItem("backrooms-best-time") || 0));
    localStorage.setItem("backrooms-best-time", String(best));
    dialogKicker.textContent = "AKKU LEER · LICHT AUS";
    dialogTitle.innerHTML = "LOST IN<br><span>THE DARK</span>";
    dialogCopy.textContent = `Du hast ${formatTime(elapsed)} überlebt. Dein bester Lauf: ${formatTime(best)}.`;
    startButton.textContent = "NOCH EIN VERSUCH →";
  } else if (kind === "caught") {
    const best = Math.max(elapsed, Number(localStorage.getItem("backrooms-best-time") || 0));
    localStorage.setItem("backrooms-best-time", String(best));
    dialogKicker.textContent = "ERWISCHT · HANDY EINGEZOGEN";
    dialogTitle.innerHTML = "DER SCHULLEITER<br><span>HAT DICH</span>";
    dialogCopy.textContent = `Er hat dir dein letztes Handy abgenommen. Du hast ${formatTime(elapsed)} überlebt. Bester Lauf: ${formatTime(best)}.`;
    startButton.textContent = "NOCH EIN VERSUCH →";
  }
}

function startGame() {
  if (running) {
    active = true;
  } else {
    running = true;
    active = true;
    battery = BATTERY_MAX;
    sparePhones = 0;
    towelCount = 0;
    hiddenSeconds = 0;
    elapsed = 0;
    player.x = SPAWN_COORD;
    player.z = SPAWN_COORD;
    player.yaw = 0;
    player.pitch = 0;
    flashlight.visible = true;
    mapVisible = false;
    mapCard.hidden = true;
    keys.clear();
    for (const chunk of chunks.values()) scene.remove(chunk.group);
    chunks.clear();
    collectedItems.clear();
    usedChargers.clear();
    wallCache.clear();
    worldSeed = Math.floor(Math.random() * 0xffffffff);
    updateChunks();
    placePrincipalAtSpawn();
  }
  overlay.hidden = true;
  setHUD();
  renderer.domElement.requestPointerLock();
}

function interact() {
  let closest = null;
  let closestDistance = 2.4;
  for (const chunk of chunks.values()) {
    for (const pickup of chunk.pickups) {
      if (pickup.type !== "charger" || usedChargers.has(pickup.id)) continue;
      const distance = Math.hypot(player.x - pickup.position.x, player.z - pickup.position.z);
      if (distance < closestDistance) {
        closest = pickup;
        closestDistance = distance;
      }
    }
  }
  if (closest) {
    usedChargers.add(closest.id);
    closest.group.visible = false;
    battery = BATTERY_MAX;
    setHUD();
    showMessage("Handy an der Ladestation vollständig geladen.");
    return;
  }
  hideUnderTowel();
}

startButton.addEventListener("click", startGame);
mapButton.addEventListener("click", toggleMap);
document.addEventListener("pointerlockchange", () => {
  const hasLock = document.pointerLockElement === renderer.domElement;
  if (!hasLock && running && active) showOverlay("pause");
  else if (hasLock) active = true;
});
document.addEventListener("pointerlockerror", () => {
  active = running;
  if (active) {
    overlay.hidden = true;
    showMessage("Mausmodus nicht verfügbar – bewege die Maus zum Umsehen.");
  }
});
document.addEventListener("mousemove", event => {
  if (!active) return;
  player.yaw -= event.movementX * 0.0022;
  if (hiddenSeconds <= 0) {
    player.pitch = THREE.MathUtils.clamp(player.pitch - event.movementY * 0.0018, -1.35, 1.35);
  }
});
document.addEventListener("keydown", event => {
  if (["KeyW", "KeyA", "KeyS", "KeyD", "ShiftLeft", "ShiftRight", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(event.code)) {
    event.preventDefault();
    keys.add(event.code);
  }
  if (event.code === "Escape" && active) showOverlay("pause");
  if (event.code === "KeyF" && active && hiddenSeconds <= 0 && !event.repeat) flashlight.visible = !flashlight.visible;
  if (event.code === "KeyM" && active && hiddenSeconds <= 0 && !event.repeat) toggleMap();
  if (event.code === "KeyE" && active && hiddenSeconds <= 0 && !event.repeat) interact();
});
document.addEventListener("keyup", event => keys.delete(event.code));
window.addEventListener("blur", () => { if (active) showOverlay("pause"); });
window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.7));
  renderer.setSize(window.innerWidth, window.innerHeight);
});

function updatePlayer(delta) {
  let forward = Number(keys.has("KeyW") || keys.has("ArrowUp")) - Number(keys.has("KeyS") || keys.has("ArrowDown"));
  let strafe = Number(keys.has("KeyD") || keys.has("ArrowRight")) - Number(keys.has("KeyA") || keys.has("ArrowLeft"));
  const length = Math.hypot(forward, strafe);
  if (!length) return false;
  forward /= length;
  strafe /= length;
  const sprinting = keys.has("ShiftLeft") || keys.has("ShiftRight");
  const speed = sprinting ? 7 : 4.6;
  const dx = (-Math.sin(player.yaw) * forward + Math.cos(player.yaw) * strafe) * speed * delta;
  const dz = (-Math.cos(player.yaw) * forward - Math.sin(player.yaw) * strafe) * speed * delta;
  const nextX = player.x + dx;
  const nextZ = player.z + dz;
  if (canOccupy(nextX, player.z)) player.x = nextX;
  if (canOccupy(player.x, nextZ)) player.z = nextZ;
  return sprinting;
}

function collectNearbyItems() {
  for (const chunk of chunks.values()) {
    for (const pickup of chunk.pickups) {
      if (pickup.type === "charger" || collectedItems.has(pickup.id)) continue;
      if (Math.hypot(player.x - pickup.position.x, player.z - pickup.position.z) > 1.15) continue;
      collectedItems.add(pickup.id);
      pickup.group.visible = false;
      if (pickup.type === "phone") {
        sparePhones += 1;
        showMessage("Ersatzhandy gefunden. Es wechselt bei leerem Akku automatisch.");
      } else if (pickup.type === "towel") {
        towelCount += 1;
        showMessage("„Keine Panik“-Handtuch gefunden. Drücke E, um dich darunter zu verstecken.");
      } else {
        battery = Math.min(BATTERY_MAX, battery + 35);
        showMessage("Akku-Zelle gefunden: +35 % Ladung.");
      }
      setHUD();
    }
  }
}

function update(delta) {
  elapsed += delta;
  const sprinting = hiddenSeconds > 0 ? false : updatePlayer(delta);
  updateChunks();
  const crouched = hiddenSeconds > 0;
  camera.position.set(player.x, crouched ? 0.42 : 1.62 + Math.sin(elapsed * 11) * (keys.size ? 0.025 : 0), player.z);
  camera.rotation.set(crouched ? 0.18 : player.pitch, player.yaw, 0);
  updatePrincipal(delta);
  if (!active) return;
  hideVeil.hidden = hiddenSeconds <= 0;
  hideStatus.hidden = hiddenSeconds <= 0;
  hideTimer.textContent = `${Math.ceil(hiddenSeconds)} s`;
  if (hiddenSeconds > 0) setHUD();
  if (flashlight.visible) {
    battery -= delta * (0.18 + (mapVisible ? 1.00 : 0) + (sprinting ? 0.07 : 0));
  } else {
    battery -= delta * 0.025;
  }
  flashlight.intensity = battery <= 20 ? 7 + Math.max(0, battery) * 0.55 : 21;
  collectNearbyItems();
  if (battery <= 0) {
    if (sparePhones > 0) {
      sparePhones -= 1;
      battery = BATTERY_MAX;
      showMessage("Akku leer – Ersatzhandy aktiviert.");
      setHUD();
    } else {
      battery = 0;
      flashlight.visible = false;
      setHUD();
      showOverlay("dead");
      return;
    }
  }
  if (mapVisible) drawMinimap();
  if (Math.floor(elapsed) !== Math.floor(elapsed - delta) || battery <= 20) setHUD();
}

function animate(now) {
  requestAnimationFrame(animate);
  const delta = Math.min((now - previousTime) / 1000, 0.05);
  previousTime = now;
  if (active) update(delta);
  renderer.render(scene, camera);
}

updateChunks();
setHUD();
loading.hidden = true;
requestAnimationFrame(animate);
