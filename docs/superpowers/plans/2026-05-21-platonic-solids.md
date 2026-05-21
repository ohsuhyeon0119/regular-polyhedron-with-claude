# Platonic Solids Desktop App — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** macOS 데스크탑 앱으로 5개 정다면체를 홀로그래픽 3D로 렌더링하고, 클릭+드래그로 자유 회전.

**Architecture:** Electron이 BrowserWindow를 생성하고 Vite가 번들한 renderer HTML을 로드. Three.js가 WebGLRenderer로 장면을 그리고 EffectComposer로 bloom 후처리. 사이드바는 DOM, 3D 장면은 canvas로 분리.

**Tech Stack:** Electron 28, Vite 5, Three.js 0.162 (MeshPhysicalMaterial + iridescence, OrbitControls, UnrealBloomPass, RoomEnvironment)

---

## File Map

| 파일 | 역할 |
|------|------|
| `package.json` | 의존성 + 스크립트 |
| `vite.config.js` | Vite 빌드 설정 |
| `electron/main.js` | Electron 메인 프로세스 (BrowserWindow 생성) |
| `index.html` | 앱 HTML 쉘 (사이드바 + 캔버스 구조) |
| `src/style.css` | 레이아웃 + 사이드바 + 정보 패널 스타일 |
| `src/solids.js` | 5개 정다면체 설정 (이름, 면수, 색상, geometry factory) |
| `src/scene.js` | Three.js 장면 (renderer, camera, lights, materials, post-processing, animation) |
| `src/main.js` | 앱 진입점 (사이드바 렌더링, solid 선택 로직) |

---

## Task 1: 프로젝트 스캐폴드

**Files:**
- Create: `package.json`
- Create: `vite.config.js`
- Create: `electron/main.js`

- [ ] **Step 1: package.json 작성**

```json
{
  "name": "platonic-solids",
  "version": "1.0.0",
  "description": "5 Platonic Solids holographic 3D viewer",
  "main": "electron/main.js",
  "scripts": {
    "dev": "concurrently \"vite\" \"wait-on tcp:5173 && cross-env NODE_ENV=development electron .\"",
    "build": "vite build",
    "start": "cross-env NODE_ENV=production electron ."
  },
  "devDependencies": {
    "concurrently": "^8.2.0",
    "cross-env": "^7.0.3",
    "electron": "^28.0.0",
    "vite": "^5.0.0",
    "wait-on": "^7.2.0"
  },
  "dependencies": {
    "three": "^0.162.0"
  }
}
```

- [ ] **Step 2: vite.config.js 작성**

```js
import { defineConfig } from 'vite'

export default defineConfig({
  base: './',
  build: { outDir: 'dist' },
})
```

- [ ] **Step 3: electron/main.js 작성**

```js
const { app, BrowserWindow } = require('electron')
const path = require('path')

function createWindow() {
  const win = new BrowserWindow({
    width: 1100,
    height: 700,
    minWidth: 800,
    minHeight: 500,
    titleBarStyle: 'hiddenInset',
    backgroundColor: '#06000f',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
  })

  if (process.env.NODE_ENV === 'development') {
    win.loadURL('http://localhost:5173')
  } else {
    win.loadFile(path.join(__dirname, '../dist/index.html'))
  }
}

app.whenReady().then(() => {
  createWindow()
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
```

- [ ] **Step 4: 의존성 설치**

```bash
cd /Users/ohsuhyeon/Desktop/2026/cluade-practice
npm install
```

Expected: `node_modules/` 생성, electron/three/vite 설치 완료

---

## Task 2: HTML 쉘 + CSS 레이아웃

**Files:**
- Create: `index.html`
- Create: `src/style.css`

- [ ] **Step 1: index.html 작성**

```html
<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Platonic Solids</title>
  <link rel="stylesheet" href="/src/style.css" />
</head>
<body>
  <div id="app">
    <div id="sidebar">
      <div class="sidebar-title">PLATONIC SOLIDS</div>
    </div>
    <div id="canvas-container">
      <canvas id="canvas"></canvas>
      <div id="drag-hint">
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <circle cx="7" cy="7" r="6" stroke="currentColor" stroke-width="1"/>
          <path d="M7 2.5v2M7 9.5v2M2.5 7h2M9.5 7h2" stroke="currentColor" stroke-width="1" stroke-linecap="round"/>
        </svg>
        드래그하여 회전
      </div>
      <div id="info-panel">
        <div id="info-left">
          <div id="info-name"></div>
          <div id="info-sub"></div>
        </div>
        <div id="info-stats">
          <div class="stat"><div class="stat-value" id="stat-faces"></div><div class="stat-label">Faces</div></div>
          <div class="stat"><div class="stat-value" id="stat-edges"></div><div class="stat-label">Edges</div></div>
          <div class="stat"><div class="stat-value" id="stat-verts"></div><div class="stat-label">Vertices</div></div>
        </div>
      </div>
    </div>
  </div>
  <script type="module" src="/src/main.js"></script>
</body>
</html>
```

- [ ] **Step 2: src/style.css 작성**

```css
*, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }

body {
  background: #06000f;
  color: #fff;
  font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif;
  overflow: hidden;
  height: 100vh;
}

#app {
  display: flex;
  height: 100vh;
}

/* ── Sidebar ── */
#sidebar {
  width: 200px;
  flex-shrink: 0;
  background: rgba(4, 0, 12, 0.97);
  border-right: 1px solid rgba(255, 255, 255, 0.05);
  display: flex;
  flex-direction: column;
  padding: 60px 8px 16px;
  gap: 4px;
  overflow-y: auto;
}

.sidebar-title {
  font-size: 9px;
  letter-spacing: 2px;
  color: rgba(255, 255, 255, 0.2);
  padding: 0 10px 12px;
}

.solid-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 9px 10px;
  border-radius: 9px;
  cursor: pointer;
  border: 1px solid transparent;
  transition: background 0.2s, border-color 0.2s, box-shadow 0.2s;
}

.solid-item:hover:not(.active) { background: rgba(255, 255, 255, 0.04); }

.solid-item.active {
  background: rgba(180, 0, 255, 0.1);
  border-color: rgba(180, 0, 255, 0.28);
  box-shadow: 0 0 18px rgba(180, 0, 255, 0.1);
}

.solid-thumb {
  width: 40px;
  height: 40px;
  border-radius: 8px;
  border: 1px solid;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.thumb-dot {
  width: 14px;
  height: 14px;
  border-radius: 50%;
}

.solid-name  { font-size: 12px; font-weight: 500; color: rgba(255, 255, 255, 0.88); }
.solid-faces { font-size: 10px; color: rgba(255, 255, 255, 0.3); margin-top: 2px; }

/* ── Canvas ── */
#canvas-container {
  flex: 1;
  position: relative;
  overflow: hidden;
}

#canvas {
  width: 100%;
  height: 100%;
  display: block;
}

/* ── Drag hint ── */
#drag-hint {
  position: absolute;
  top: 20px;
  right: 22px;
  font-size: 10px;
  color: rgba(255, 255, 255, 0.18);
  display: flex;
  align-items: center;
  gap: 6px;
  letter-spacing: 0.5px;
  pointer-events: none;
  user-select: none;
}

/* ── Info panel ── */
#info-panel {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 24px 32px 28px;
  background: linear-gradient(transparent, rgba(0, 0, 15, 0.9));
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  pointer-events: none;
}

#info-name {
  font-size: 28px;
  font-weight: 700;
  letter-spacing: -0.5px;
  transition: color 0.4s;
}

#info-sub {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.35);
  margin-top: 5px;
}

#info-stats { display: flex; gap: 26px; }

.stat { text-align: center; }

.stat-value {
  font-size: 26px;
  font-weight: 700;
  color: rgba(255, 255, 255, 0.88);
  font-variant-numeric: tabular-nums;
}

.stat-label {
  font-size: 9px;
  letter-spacing: 1.2px;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.25);
  margin-top: 3px;
}
```

- [ ] **Step 3: 시각 확인**

```bash
# 브라우저에서 확인하려면 vite만 먼저 실행
npx vite
```

Expected: http://localhost:5173 에서 검은 화면 + 사이드바 레이아웃이 보임

---

## Task 3: 정다면체 설정 (`src/solids.js`)

**Files:**
- Create: `src/solids.js`

- [ ] **Step 1: src/solids.js 작성**

```js
import * as THREE from 'three'

export const SOLIDS = [
  {
    id: 'tetrahedron',
    nameKo: '정사면체',
    nameEn: 'Tetrahedron',
    element: '불 (Fire)',
    faces: 4,
    edges: 6,
    vertices: 4,
    color: '#ff00cc',
    accentColor: '#ff88ff',
    geometry: () => new THREE.TetrahedronGeometry(2.4, 0),
  },
  {
    id: 'cube',
    nameKo: '정육면체',
    nameEn: 'Cube',
    element: '땅 (Earth)',
    faces: 6,
    edges: 12,
    vertices: 8,
    color: '#00ccff',
    accentColor: '#88eeff',
    geometry: () => new THREE.BoxGeometry(3.4, 3.4, 3.4),
  },
  {
    id: 'octahedron',
    nameKo: '정팔면체',
    nameEn: 'Octahedron',
    element: '공기 (Air)',
    faces: 8,
    edges: 12,
    vertices: 6,
    color: '#00ff88',
    accentColor: '#88ffcc',
    geometry: () => new THREE.OctahedronGeometry(2.6, 0),
  },
  {
    id: 'dodecahedron',
    nameKo: '정십이면체',
    nameEn: 'Dodecahedron',
    element: '우주 (Cosmos)',
    faces: 12,
    edges: 30,
    vertices: 20,
    color: '#ffcc00',
    accentColor: '#ffe066',
    geometry: () => new THREE.DodecahedronGeometry(2.4, 0),
  },
  {
    id: 'icosahedron',
    nameKo: '정이십면체',
    nameEn: 'Icosahedron',
    element: '물 (Water)',
    faces: 20,
    edges: 30,
    vertices: 12,
    color: '#aa44ff',
    accentColor: '#cc88ff',
    geometry: () => new THREE.IcosahedronGeometry(2.5, 0),
  },
]
```

---

## Task 4: Three.js 장면 (`src/scene.js`)

**Files:**
- Create: `src/scene.js`

Three.js의 `MeshPhysicalMaterial`은 `iridescence` 속성으로 홀로그래픽 변색 효과를 냄. `RoomEnvironment`는 반사맵을 만드는 헬퍼. `UnrealBloomPass`로 엣지와 꼭짓점에 빛 번짐 추가.

- [ ] **Step 1: src/scene.js 작성**

```js
import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js'
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js'
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js'

export function createScene(canvas) {
  // ── Renderer ──────────────────────────────────────────────────────────────
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  renderer.toneMappingExposure = 1.2
  renderer.outputColorSpace = THREE.SRGBColorSpace

  // ── Scene + Camera ────────────────────────────────────────────────────────
  const scene = new THREE.Scene()
  scene.background = new THREE.Color('#06000f')

  const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100)
  camera.position.set(0, 0, 9)

  // ── Environment map (required for MeshPhysicalMaterial reflections) ───────
  const pmrem = new THREE.PMREMGenerator(renderer)
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture
  pmrem.dispose()

  // ── Lights ────────────────────────────────────────────────────────────────
  scene.add(new THREE.AmbientLight(0xffffff, 0.4))

  const lightDefs = [
    { color: '#ff00ff', intensity: 5, r: 6, phase: 0 },
    { color: '#00ffff', intensity: 5, r: 6, phase: Math.PI },
    { color: '#ffffff', intensity: 3, r: 5, phase: Math.PI / 2 },
    { color: '#aa44ff', intensity: 3, r: 5, phase: (3 * Math.PI) / 2 },
  ]
  const pointLights = lightDefs.map(({ color, intensity, r, phase }) => {
    const light = new THREE.PointLight(color, intensity, 20)
    light.userData = { r, phase }
    scene.add(light)
    return light
  })

  // ── Controls ──────────────────────────────────────────────────────────────
  const controls = new OrbitControls(camera, canvas)
  controls.enableZoom = false
  controls.enablePan = false
  controls.autoRotate = true
  controls.autoRotateSpeed = 1.2
  controls.enableDamping = true
  controls.dampingFactor = 0.06

  canvas.addEventListener('mousedown', () => { controls.autoRotate = false })
  canvas.addEventListener('mouseup',   () => { controls.autoRotate = true })
  canvas.addEventListener('mouseleave',() => { controls.autoRotate = true })

  // ── Post-processing ───────────────────────────────────────────────────────
  const composer = new EffectComposer(renderer)
  composer.addPass(new RenderPass(scene, camera))
  const bloom = new UnrealBloomPass(
    new THREE.Vector2(window.innerWidth, window.innerHeight),
    1.6,   // strength
    0.8,   // radius
    0.1    // threshold
  )
  composer.addPass(bloom)

  // ── Resize ────────────────────────────────────────────────────────────────
  function resize() {
    const container = canvas.parentElement
    const w = container.clientWidth
    const h = container.clientHeight
    renderer.setSize(w, h)
    composer.setSize(w, h)
    camera.aspect = w / h
    camera.updateProjectionMatrix()
    bloom.resolution.set(w, h)
  }
  resize()
  window.addEventListener('resize', resize)

  // ── Solid state ───────────────────────────────────────────────────────────
  let mesh = null
  let edges = null

  function setSolid(solidConfig) {
    // Dispose previous
    if (mesh)  { scene.remove(mesh);  mesh.geometry.dispose();  mesh.material.dispose() }
    if (edges) { scene.remove(edges); edges.geometry.dispose(); edges.material.dispose() }

    const geo = solidConfig.geometry()

    const mat = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color(solidConfig.color),
      metalness: 0.05,
      roughness: 0.04,
      transmission: 0.12,
      thickness: 0.5,
      iridescence: 1.0,
      iridescenceIOR: 1.5,
      iridescenceThicknessRange: [100, 800],
      envMapIntensity: 3.0,
      transparent: true,
      opacity: 0.92,
    })

    mesh = new THREE.Mesh(geo, mat)
    scene.add(mesh)

    // Glowing edges
    const edgesGeo = new THREE.EdgesGeometry(geo)
    const edgesMat = new THREE.LineBasicMaterial({
      color: new THREE.Color(solidConfig.accentColor),
      transparent: true,
      opacity: 0.85,
    })
    edges = new THREE.LineSegments(edgesGeo, edgesMat)
    scene.add(edges)

    // Recolor orbiting lights to match the solid
    pointLights[0].color.set(solidConfig.color)
    pointLights[1].color.set(solidConfig.accentColor)
    pointLights[2].color.set('#ffffff')
    pointLights[3].color.set(solidConfig.color)

    // Reset camera
    controls.reset()
    camera.position.set(0, 0, 9)
  }

  // ── Animation loop ────────────────────────────────────────────────────────
  let t = 0
  function animate() {
    requestAnimationFrame(animate)
    t += 0.008

    // Orbit the colored lights around the solid
    pointLights.forEach(light => {
      const { r, phase } = light.userData
      light.position.set(
        Math.cos(t + phase) * r,
        Math.sin(t * 0.7 + phase) * 3,
        Math.sin(t + phase) * r
      )
    })

    controls.update()
    composer.render()
  }
  animate()

  return { setSolid }
}
```

---

## Task 5: 앱 진입점 (`src/main.js`)

**Files:**
- Create: `src/main.js`

- [ ] **Step 1: src/main.js 작성**

```js
import './style.css'
import { SOLIDS } from './solids.js'
import { createScene } from './scene.js'

const sidebar   = document.getElementById('sidebar')
const canvas    = document.getElementById('canvas')
const infoName  = document.getElementById('info-name')
const infoSub   = document.getElementById('info-sub')
const statFaces = document.getElementById('stat-faces')
const statEdges = document.getElementById('stat-edges')
const statVerts = document.getElementById('stat-verts')

const scene = createScene(canvas)

function select(solid, itemEl) {
  document.querySelectorAll('.solid-item').forEach(el => el.classList.remove('active'))
  itemEl.classList.add('active')

  scene.setSolid(solid)

  infoName.textContent  = solid.nameKo
  infoName.style.color  = solid.accentColor
  infoSub.textContent   = `${solid.nameEn} — 플라톤의 ${solid.element}`
  statFaces.textContent = solid.faces
  statEdges.textContent = solid.edges
  statVerts.textContent = solid.vertices
}

SOLIDS.forEach((solid, i) => {
  const item = document.createElement('div')
  item.className = 'solid-item' + (i === 0 ? ' active' : '')
  item.innerHTML = `
    <div class="solid-thumb" style="border-color:${solid.color}55;background:${solid.color}18">
      <div class="thumb-dot" style="background:${solid.color};box-shadow:0 0 10px ${solid.color}"></div>
    </div>
    <div class="solid-info">
      <div class="solid-name">${solid.nameKo}</div>
      <div class="solid-faces">${solid.nameEn} · ${solid.faces}면</div>
    </div>
  `
  item.addEventListener('click', () => select(solid, item))
  sidebar.appendChild(item)
})

// Initialize with first solid
select(SOLIDS[0], sidebar.querySelector('.solid-item'))
```

---

## Task 6: 실행 및 검증

- [ ] **Step 1: 개발 서버 + Electron 실행**

```bash
npm run dev
```

Expected:
- Vite 서버가 http://localhost:5173 에서 시작
- Electron 창이 열리며 정사면체가 화면을 가득 채운 상태로 표시
- 홀로그래픽 색상 변색이 보임
- 블룸 효과로 엣지가 빛남

- [ ] **Step 2: 인터랙션 검증**

수동 확인:
1. 메인 캔버스를 클릭+드래그 → 3D 자유 회전
2. 드래그 멈추면 자동 회전 재개
3. 사이드바에서 각 면체 클릭 → 즉시 전환, 색상 변경
4. 윈도우 크기 조절 → 레이아웃과 3D 모두 반응형 조정

- [ ] **Step 3: 빌드 확인 (선택)**

```bash
npm run build
npm run start
```

Expected: dist/ 폴더 생성 후 Electron이 번들된 파일 로드
