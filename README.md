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

## 제품 이미지

Glue Gloss 상자와 참이 달린 크롬 튜브는 `src/assets/gloss-cutouts.png`의 투명 이미지를 사용합니다. 첨부 레퍼런스를 이미지 편집 도구로 배경 제거한 결과이며, 원본 픽셀을 그대로 추출한 파일은 아닙니다. `src/gloss-props.ts`에서 두 제품을 분리해 조명 영향을 받지 않는 평면으로 표시하고, 데스크톱에서는 캐릭터 양옆에, 좁은 화면에서는 위아래에 배치합니다.

사원증(목줄과 참 포함)과 젤리는 `src/assets/badge-candies.png`의 투명 이미지에서 가져옵니다. 이 파일도 첨부 사진을 이미지 편집 도구로 처리한 결과입니다. `src/badge-candies.ts`에서 사원증과 12개 젤리를 잘라 배치하며, 모바일에서는 사원증을 왼쪽 위에 두고 기존 상자를 오른쪽 위로 옮겨 캐릭터 공간을 확보합니다.

브랜드 로고는 `src/assets/glyf-logo.png`를 사용하며 왼쪽 위에 고정 표시합니다. 첨부 로고의 검은 배경을 이미지 편집 도구로 투명 처리한 파일로, 원본 픽셀을 그대로 추출한 파일은 아닙니다.

## GLYF 플레이 화면

메인 화면(`#home`)에서 **GUMMY RUSH**와 **PHOTOBOOTH**로 이동할 수 있습니다. 게임과 포토부스에서도 상단 메뉴를 통해 메인으로 돌아갈 수 있고, 브라우저의 뒤로 가기를 지원합니다. 배경음악은 화면 이동 중에도 유지됩니다.

- **게임(`#game`)**: 20초 동안 떨어지는 젤리를 받습니다. 방향키·A/D 또는 마우스·터치 드래그로 조작합니다. 젤리 10점, 별 20점, 치아 25점이며 최고 점수는 해당 브라우저에 저장됩니다. 결과 화면에서 점수가 들어간 포토카드를 만들 수 있습니다.
- **포토부스(`#photo`)**: 카메라 촬영(3초 카운트다운)이나 사진 업로드를 지원합니다. 핑크 글리터·블루·바닐라 프레임, 문구, 닉네임, 스티커를 골라 1080×1920 PNG를 저장합니다. 사진은 서버로 전송하지 않으며, 화면을 나가면 카메라 스트림을 중지합니다. 카메라 권한을 허용하지 않아도 업로드나 캐릭터 카드로 사용할 수 있습니다.

게임과 카드에 쓰는 캐릭터는 기존 Three.js 모델을 투명 배경으로 렌더링하며, 젤리·제품 이미지는 기존 에셋을 재사용합니다. 관련 코드는 `src/experiences.ts`, `src/gummy-game.ts`, `src/photo-booth.ts`, `src/play-assets.ts`에 있습니다.
