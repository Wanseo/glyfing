# glyfing

Vite vanilla-ts 기반 웹 프로젝트입니다.

핑크 글리터 배경 위의 작은 3D 봉제 캐릭터를 방향키(↑ ↓ ← →)로 움직일 수 있습니다. 좌우 이동 시 완전히 옆으로 돌아서며, 발을 번갈아 내딛고 가끔 눈을 깜빡입니다. 화면 크기에 맞춰 캐릭터 크기와 이동 경계를 조정합니다. 글리터 배경은 밝은 핫핑크 레퍼런스에서 영감을 받아 독립적으로 생성한 텍스처입니다. 미세한 글리터와 부드러운 빛점을 사용하고 강한 눈부심은 줄였습니다.

캐릭터는 Three.js로 직접 구성한 입체 모델이며, 레퍼런스의 따뜻한 회색 털과 세 개의 졸린 눈, 작은 이빨, 아이보리 바탕에 여러 개의 핑크 하트가 있는 하의와 빨간 허리 밴드를 표현했습니다. WebGL을 지원하는 브라우저와 키보드가 필요합니다.

## 개발 및 빌드

Node.js 24와 npm을 사용합니다.

```sh
npm ci
npm run dev
npm run build
```

빌드 결과는 `dist/`에 생성됩니다.

## GitHub Pages 배포

1. `Wanseo/glyfing` 저장소의 **Settings → Pages → Build and deployment → Source**에서 **GitHub Actions**를 선택합니다.
2. 변경 파일을 커밋하고 `main` 브랜치에 푸시합니다.
3. **Actions → Deploy to GitHub Pages**에서 배포 성공 여부를 확인합니다. **Run workflow**로 수동 배포도 가능합니다.

배포 주소: https://wanseo.github.io/glyfing/

`main`에 푸시할 때마다 의존성을 설치하고 빌드한 뒤 `dist/`를 자동 배포합니다. 별도의 배포 토큰이나 `gh-pages` 브랜치는 필요하지 않습니다.

## 파일 경로

`vite.config.ts`의 `base`는 저장소 경로인 `/glyfing/`으로 설정되어 있습니다. 저장소 이름을 변경하면 이 값도 수정하세요. 사용자 사이트(`wanseo.github.io`) 또는 커스텀 도메인으로 배포하면 `/`로 변경하세요.

- `src/assets/` 파일은 TypeScript에서 `import`하여 사용합니다.
- `public/` 파일은 TypeScript에서 `${import.meta.env.BASE_URL}파일명`으로 참조합니다.
- HTML에서 `public/` 파일을 참조할 때는 `%BASE_URL%파일명`을 사용합니다.

예: `public/icons.svg`는 `${import.meta.env.BASE_URL}icons.svg`로 참조합니다. 문자열 안에 `/icons.svg`처럼 루트 경로를 직접 쓰면 저장소 하위 경로가 빠집니다.

공식 안내: [Vite GitHub Pages](https://vite.dev/guide/static-deploy.html#github-pages)
