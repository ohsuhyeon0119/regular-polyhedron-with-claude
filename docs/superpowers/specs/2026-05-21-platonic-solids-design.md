# Platonic Solids Desktop App — Design Spec
Date: 2026-05-21

## Overview
5개의 정다면체를 홀로그래픽 3D로 렌더링하는 macOS 데스크탑 앱.
사이드바에서 면체를 선택하고, 메인 캔버스에서 클릭+드래그로 자유 회전.

## Tech Stack
- **Runtime**: Electron (macOS 네이티브 앱)
- **Bundler**: Vite
- **3D**: Three.js (WebGLRenderer)
- **언어**: JavaScript (ES modules)

## Layout
```
┌─────────────────────────────────────────────┐
│ ● ● ●          Platonic Solids              │  ← macOS titlebar
├──────────┬──────────────────────────────────┤
│ Sidebar  │        Main Canvas               │
│  190px   │    (fills remaining space)       │
│          │                                  │
│ [4면]   │   [BIG holographic solid]        │
│ [6면]   │                                  │
│ [8면]   │   ← OrbitControls drag rotate →  │
│ [12면]  │                                  │
│ [20면]  │  ──────────────────────────────  │
│          │  이름 · 원소   Faces Edges Verts │
└──────────┴──────────────────────────────────┘
```

## 5 Platonic Solids
| 이름 | 영문 | 면 수 | 모서리 | 꼭짓점 | Three.js Geometry | 색상 테마 |
|------|------|-------|--------|--------|-------------------|-----------|
| 정사면체 | Tetrahedron | 4 | 6 | 4 | TetrahedronGeometry | 핑크/마젠타 |
| 정육면체 | Cube | 6 | 12 | 8 | BoxGeometry | 시안/블루 |
| 정팔면체 | Octahedron | 8 | 12 | 6 | OctahedronGeometry | 민트/그린 |
| 정십이면체 | Dodecahedron | 12 | 30 | 20 | DodecahedronGeometry | 골드/옐로우 |
| 정이십면체 | Icosahedron | 20 | 30 | 12 | IcosahedronGeometry | 퍼플/바이올렛 |

## Rendering
- **Material**: `MeshPhysicalMaterial` with iridescence=1, transmission=0.3, roughness=0.05, metalness=0.1
- **Lighting**: AmbientLight + 4 colored PointLights (orbiting)
- **Post-processing**: `UnrealBloomPass` (strength=1.5, radius=0.8)
- **Environment**: PMREMGenerator + neutral HDR environment map
- **Edge highlight**: EdgesGeometry + LineSegments with emissive color
- **Auto-rotation**: slow Y-axis rotation when not dragging
- **Size**: solid radius fills ~80% of canvas height

## Interaction
- **Drag rotate**: mousedown + mousemove → OrbitControls (enableZoom=false, enablePan=false)
- **Solid switch**: sidebar click → smooth camera reset + solid swap
- **Hover**: sidebar item highlight

## Project Structure
```
platonic-solids/
├── package.json
├── vite.config.js
├── electron/
│   └── main.js          # Electron main process
├── index.html           # App entry
└── src/
    ├── main.js          # App init, sidebar logic
    ├── scene.js         # Three.js scene, camera, renderer, post-processing
    ├── solids.js        # Solid configs + geometry factory
    └── style.css        # App layout styles
```

## Window Config
- Size: 1100 × 700 (resizable)
- `titleBarStyle: 'hiddenInset'` (macOS 네이티브 신호등 버튼)
- `vibrancy: 'under-window'` (macOS 배경 블러)
- `backgroundColor: '#06000f'`
