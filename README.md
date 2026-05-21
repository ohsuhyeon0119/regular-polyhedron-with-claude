# Platonic Solids Viewer

5개의 정다면체를 홀로그래픽 3D로 렌더링하는 macOS 데스크탑 앱


https://github.com/user-attachments/assets/bcbedbc6-82ed-47e4-8be7-d7196d4f02bb



## 기능

- 정사면체 · 정육면체 · 정팔면체 · 정십이면체 · 정이십면체 3D 렌더링
- 홀로그래픽 iridescence 재질 + Bloom 후처리
- 클릭 + 드래그로 자유 회전, 손 떼면 자동 회전 재개
- 사이드바에서 면체 전환 (면 · 모서리 · 꼭짓점 수 표시)
- macOS 네이티브 타이틀바 (hiddenInset)

## 기술 스택

| 역할 | 기술 |
|------|------|
| 데스크탑 런타임 | Electron 28 |
| 번들러 | Vite 5 |
| 3D 렌더링 | Three.js 0.162 |
| 재질 | MeshPhysicalMaterial (iridescence) |
| 후처리 | UnrealBloomPass |
| 카메라 | OrbitControls |

## 실행

```bash
npm install
npm run dev     # Electron 개발 모드 (Vite HMR 포함)
```

## 빌드

```bash
npm run build   # dist/ 폴더에 번들
npm run start   # 번들된 앱 실행
```

## 프로젝트 구조

```
platonic-solids/
├── electron/main.js      # Electron 메인 프로세스
├── index.html            # 앱 HTML 쉘
└── src/
    ├── main.js           # 앱 진입점 · 사이드바 로직
    ├── scene.js          # Three.js 장면 · 조명 · 후처리
    ├── solids.js         # 5개 정다면체 설정
    └── style.css         # 레이아웃 스타일
```

---

> **Note:** 이 프로젝트는 [Claude Code](https://claude.ai/code)의 **Superpowers 플러그인**을 활용한 실습 목적으로 제작되었습니다. Superpowers의 `brainstorming` → `writing-plans` → `executing-plans` 워크플로우를 따라 설계부터 구현까지 진행했습니다.
