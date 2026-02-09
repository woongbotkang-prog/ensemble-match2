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
### 0) Firebase 프로젝트 생성
1. [Firebase Console](https://console.firebase.google.com/)에서 새 프로젝트 생성
2. 프로젝트 설정 → 일반 → "앱 추가"에서 Web 앱 생성
3. 생성된 Firebase SDK 설정값의 `apiKey`, `authDomain`, `projectId` 등 확인

### 1) Firebase CLI 로그인
```bash
firebase login
firebase use --add
```
- `firebase use --add`에서 위에서 만든 프로젝트를 선택합니다.

### 2) `.env` 설정
1. `.env.example`를 참고해 `/apps/web/.env` 생성
2. Firebase 콘솔에서 확인한 값을 입력

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

### 3) Firestore Rules/Indexes 배포
```bash
firebase deploy --only firestore
```

### 4) Functions 배포
```bash
cd functions
npm install
npm run deploy
```

### 5) Vercel 배포
1. Vercel에서 `apps/web`를 새 프로젝트로 연결
2. 환경 변수에 `VITE_*`와 Algolia 키 추가
3. 빌드/배포:
   - Build Command: `npm run build`
   - Output Directory: `dist`

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

## Firebase 에뮬레이터 설정/실행
### firebase.json 예시
아래는 에뮬레이터를 사용할 때 필요한 `firebase.json`의 예시입니다(경로는 레포 구조에 맞게 수정).

```json
{
  "firestore": {
    "rules": "firestore.rules",
    "indexes": "firestore.indexes.json"
  },
  "functions": {
    "source": "functions"
  },
  "emulators": {
    "firestore": {
      "port": 8080
    },
    "functions": {
      "port": 5001
    },
    "ui": {
      "enabled": true,
      "port": 4000
    }
  }
}
```

### 에뮬레이터 실행 순서
1. Functions 의존성 설치 및 빌드
   ```bash
   cd functions
   npm install
   npm run build
   ```
2. 프로젝트 루트에서 에뮬레이터 실행
   ```bash
   cd ..
   firebase emulators:start
   ```
3. 프론트 실행(필요 시 별도 터미널)
   ```bash
   cd apps/web
   npm install
   npm run dev
   ```
