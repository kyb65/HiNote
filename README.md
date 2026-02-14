# HiNote

**Windows용 무한 캔버스 마크다운 노트 앱.** 원노트처럼 자유롭게 배치하고, 마크다운으로 구조적으로 편집하는 데스크탑 앱의 MVP입니다. Tauri + React + TypeScript로 구현했으며, WebView2를 활용해 윈도우에서 가볍고 부드럽게 동작하는 것을 목표로 합니다.

- **무한 캔버스**: 원점 십자가, 휠 확대/축소(마우스 기준), 스페이스+드래그 패닝
- **텍스트박스**: 클릭 시 생성, 독립 오브젝트 관리, 확대/축소 시 자간·행간·개행 비례 유지
- **기술 스택**: Tauri 1.x, React 18, TypeScript, Vite

## 1단계 구현 내용

- **무한 캔버스 + 원점 십자가**: 원점 (0, 0)에 십자(+) 표시, 휠 확대/축소, 스페이스+드래그 패닝
- **클릭 시 텍스트박스 생성**: 캔버스 빈 곳 클릭 시 해당 위치에 텍스트박스 생성
- **독립 오브젝트 관리**: 각 텍스트박스는 `TextBoxObject`(id, x, y, text)로 상태에 독립 관리

## 실행 방법

### 필수 요구사항

- Node.js 18+
- Rust (rustup)
- Windows: Visual Studio Build Tools 또는 C++ 빌드 도구

### 설치 및 실행

```bash
npm install
npm run tauri dev
```

첫 실행 시 Rust 빌드로 시간이 걸릴 수 있습니다.  
웹만 확인하려면:

```bash
npm install
npm run dev
```

브라우저에서 http://localhost:5173 접속.

## 프로젝트 구조

```
HiNote/
├── PRD.md                 # 제품 요구사항
├── src/                   # React 프론트엔드
│   ├── components/        # OriginCross, TextBox
│   ├── types.ts           # TextBoxObject 등 데이터 모델
│   ├── App.tsx
│   └── main.tsx
└── src-tauri/             # Tauri(Rust) 백엔드
```

## 조작법

| 동작 | 방법 |
|------|------|
| 확대/축소 | 마우스 휠 |
| 패닝(평행이동) | 휠 클릭 후 드래그 (또는 스페이스+드래그) |
| 텍스트박스 추가 | 캔버스 빈 곳 **좌클릭** |

---

**GitHub 저장소 About에 넣을 한 줄 설명 (복사용):**

> Windows용 무한 캔버스 마크다운 노트 앱. 원노트 스타일 자유 배치 + 마크다운 편집. Tauri · React · TypeScript.
