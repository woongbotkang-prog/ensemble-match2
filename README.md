# Ensemble Match MVP

## 요구 구조
- `/apps/web`: Vite + React 프론트
- `/functions`: Firebase Functions (TypeScript)
- `/firestore.rules`, `/firestore.indexes.json`, `/firebase.json`
- `/.env.example`

## 로컬 실행
### 1) 환경 변수
`.env.example`를 참고해 `/apps/web/.env`를 생성하세요.

```bash
cp .env.example apps/web/.env
```

필수 값:
- `VITE_FIREBASE_*`
- `VITE_ALGOLIA_APP_ID`, `VITE_ALGOLIA_SEARCH_KEY`

Functions에서 Algolia 동기화용 Admin Key는 Firebase config 또는 환경변수로 주입합니다.

```bash
firebase functions:config:set algolia.app_id=YOUR_APP_ID algolia.admin_key=YOUR_ADMIN_KEY algolia.index_name=postings
```

### 2) 프론트 실행
```bash
cd apps/web
npm install
npm run dev
```

### 3) Functions 로컬 빌드
```bash
cd functions
npm install
npm run build
```

## Firebase 에뮬레이터
```bash
firebase emulators:start
```

## 배포
### Firestore rules/indexes
```bash
firebase deploy --only firestore
```

### Functions
```bash
cd functions
npm run deploy
```

### Vercel
- `apps/web`를 Vercel 프로젝트로 연결
- 환경 변수 `VITE_*`와 Algolia 키 추가
- `npm run build` 출력물 배포

## 주요 시나리오
1) 공고 생성 → 2) 북마크 → 3) 지원 → 4) 취소 → 5) 재지원 후 수락 → 6) 채팅방 생성 → 7) 알림/검색 확인
