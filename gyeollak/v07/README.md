# 결락 사이트 디자인 초안 v07

밴드 **결락(GYEOLLAK)** 전시 사이트 디자인 초안이다. 클로드·GPT·제미나이 등에서 이 폴더만 클론하거나 GitHub Pages로 열어 보면 된다.

## 바로 보기

- 사이트(Pages): https://k75080335-byte.github.io/allones/gyeollak/v07/
- 투명 아크릴 로고 첫 화면: https://k75080335-byte.github.io/allones/gyeollak/v07/index-droplogo.html
- 이전 초안(이 커밋이 덮어쓰지 않음): https://k75080335-byte.github.io/allones/gyeollak/
- 노션 기록: https://app.notion.com/p/4179ce6e789281d99327c5aa86b6acd8
- 레포: https://github.com/k75080335-byte/allones/tree/main/gyeollak/v07

로컬: 이 폴더에서 `python3 -m http.server` 후 `http://localhost:8000/` 으로 연다. 외부 CDN은 없고, 폰트·이미지·오디오는 전부 이 폴더 안에 있다. `file://`로 열면 오디오·모듈 경로가 막힐 수 있다.

`index.html`은 잉크 로고(`img/logo/mark-ink.png`) 첫 화면, `index-droplogo.html`은 같은 사이트에 물방울·아크릴 투명 마크(`img/logo/mark-droplet.png`)만 바꾼 시안이다.

## 섹션 구성

고정 헤더 네비게이션: `01 SURFACE` · `02 OBJECTS` · `03 MEMBERS` · `04 LISTEN`.

### 01 SURFACE — 은빛 수면

첫 화면. 굿즈·키링은 넣지 않는다. 흰빛에서 파스텔 블루로 넘어가는 은빛 수면(`#F3F6FA`) 위에 결락 로고 마크만 두고, 나선처럼 흐르는 물결·구름 모션 그래픽이 돌아간다. 모서리에 제품 스펙 라벨(SURFACE / SPEC / MAT. / ACCENT `#174BFF`). 가운데 작은 **TOUCH**를 누르면 물결이 퍼지면서 게이트가 열리고, 스크롤로 다음 섹션에 들어간다. 커서가 지나가면 수면에 파문이 생긴다.

### 02 OBJECTS — 굿즈 · CD · 패키지 진열장

투명 아크릴 진열장 3단 선반. 물건을 누르거나 목록·화살표 키로 고르면 앞으로 꺼내져 턴테이블에 오른다. 드래그하면 360° 회전, 튕기면 관성으로 돌다가 제자리로 돌아온다. 아래 블리스터 레일은 CD 케이스 8종 변주(v06 §16)를 가로로 밀며 본다.

### 03 MEMBERS — 사선 라인업

채류현 · 채유성 · 문태준 · 하진우, 사선으로 한 줄. 밀면(마우스·터치) 한 명씩 앞으로 걸어 나오고, 앞사람을 잡고 돌리면 회전, 탭하면 포즈가 바뀐다. **SUIT / CASUAL / Y2K** 버튼으로 의상이 바뀐다. 바닥에는 마이크 케이블 모티프(1px 선). 문태준은 항상 195cm 라인. 메이크업 룩은 쓰지 않는다. 구도 레퍼런스만 참고했고, 다른 그룹 인물 사진은 쓰지 않았다.

### 04 LISTEN — 음악 듣기

투명 CD 플레이어(클리어 시리즈)처럼 보이는 듣기 화면. 결락 실제 BGM 8곡. 재생하면 디스크가 돌고, 곡을 바꾸면 뚜껑이 열렸다 닫힌다. 원형 링이나 파형을 끌어 탐색한다. 미니 플레이어는 LISTEN 섹션 밖으로 나가도 따라온다.

| # | 파일 | 곡 |
|---|---|---|
| 01 | `audio/00_intro.mp3` | 비가 맺지 못한 것들 (Intro) |
| 02 | `audio/02_gyeolro.mp3` | 결로 |
| 03 | `audio/03_amnesia.mp3` | Amnesia (하진우) |
| 04 | `audio/04_rewind.mp3` | Rewind (문태준) |
| 05 | `audio/05_sangsahwa.mp3` | 상사화 (채유성) |
| 06 | `audio/06_sodapop.mp3` | Soda Pop |
| 07 | `audio/07_chija.mp3` | 치자 (Hidden) |
| 08 | `audio/08_firstsnow.mp3` | 첫눈이 오면 |

## 인터랙션 요약

- **SURFACE:** 커서/터치 파문, TOUCH로 입장, 입장 후 물결이 로고 위를 한 번 스친다.
- **OBJECTS:** 클릭=꺼내기, 드래그=360°, 플릭=관성 회전, ← → 키로 아이템 전환.
- **MEMBERS:** 가로 밀기=다음 사람, 앞사람 드래그=회전, 탭=포즈, SUIT/CASUAL/Y2K=의상.
- **LISTEN:** 재생/이전/다음/정지, 뚜껑 열기, 링·파형 시크, 볼륨 드래그, REPEAT.

## 색 토큰

`css/style.css` `:root`에 정의되어 있다. 팔레트는 흰색→파스텔 블루, 악센트는 코발트 하나, 검정은 본문·작은 악센트만.

| 토큰 | 값 | 용도 |
|---|---|---|
| `--ink` | `#0B0D12` | 본문, 작은 악센트 |
| `--sub` | `#5D6678` | 보조 글자 |
| `--cobalt` | `#174BFF` | 유일한 포인트 컬러 |
| `--bg` | `#F6F8FB` | 페이지 배경 |
| `--ice` | `#EEF3FA` | 밝은 얼음 |
| `--pale` | `#DCE6F2` | 파스텔 베이스 |
| `--pastel` | `#C3D3E6` | 파스텔 블루 |
| `--deep` | `#9FB5D3` | 깊은 파스텔 |
| `--chrome` | 은빛 메탈 그라디언트 | 크롬·수면 하이라이트 |
| `--ryu` | `#FF7A1A` | 채류현 |
| `--yu` | `#E5294B` | 채유성 |
| `--tae` | `#1B2A4A` | 문태준 |
| `--jin` | `#8EC9F2` | 하진우 |

재질 키워드: 프로스트 아크릴, 은 밴드, 블리스터, 카라비너 기하 문양. 톤은 유치하지 않게, Ordinary People / 후영후 쪽.

## 파일 위치

```
gyeollak/v07/
  index.html              본편 (잉크 로고 첫 화면)
  index-droplogo.html     투명 아크릴 로고 첫 화면 시안
  css/style.css           토큰·레이아웃
  js/app.js               인터랙션
  js/audio-features.js    파형 프리컴퓨팅 데이터
  fonts/                  Pretendard / Unbounded / DM Mono / Instrument Serif
  img/                    사이트 런타임 에셋 (webp + 로고 png)
    goods/                진열 굿즈·키링
    members/              라인업 의상·포즈
    logo/                 mark-ink / mark-droplet / mark-cobalt / mark-red
  audio/                  듣기용 mp3 8곡
  videos/web/             섹션 프리뷰 압축 mp4 (16:9)
  screenshots/            데스크톱·모바일 캡처 일부
  refs/                   섹션 레퍼런스 시트
  cutouts/                누끼 연락 시트만 (원본 PNG는 용량 때문에 생략)
  logo-droplet/           ㄱㄹ 결 마크 투명·스튜디오 PNG + 5초 스핀 영상
  README.md               이 파일
```

사이트 런타임은 `img/*.webp`를 쓴다. 박스에 있는 원본 투명 PNG 누끼(`draft-v07/cutouts/`, 약 73MB)와 원본 16:9/9:16 녹화 mp4(`draft-v07/videos/`, 약 40MB)는 Pages 용량을 위해 올리지 않았다. 로고 `frames/` 렌더 중간 이미지도 생략했고, 결과 PNG와 `spin-16x9.mp4`만 넣었다.

## 로고 투명 버전

`logo-droplet/README.md` 참고. 공식 마크 형태는 그대로 두고 재질만 맑은 아크릴(물방울 굴절)로 렌더한 시안이다. 정면·3/4, 투명/섀도/흰 배경/파스텔/네이비 버전이 있다. 사이트에 쓰려면 `index-droplogo.html`을 연다.

## 주의

- 기존 `gyeollak/index.html`, `gyeollak/img/`, `gyeollak/pocket/`은 그대로 둔다. 이 초안은 `gyeollak/v07/` 아래에만 있다.
- 콘셉트 전시 시안이다. 판매·가격·재고 정보는 없다.
- 음원은 시안용 112kbps 변환본이다.
