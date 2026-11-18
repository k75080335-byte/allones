# 결락 · 시작 화면 v2 (hero-v2) — 2026-11-18

열기: `index.html` (GitHub Pages 또는 로컬 서버. `file://`로 열면 CSS mask 이미지가 CORS로 막힐 수 있음)
옵션: `?tier=high|low|static` 단계 고정 · `?debug` FPS/단계 표시 · `?capture` 결정적 프레임 캡처 API(`window.__cap.seek(t)`)

## 인트로 (~4.9초, 시간 기반 · 스크롤/키 입력 시 4배속)
| 시각 | 장면 | 기법 |
|---|---|---|
| 0.05s | 브랜드·키커 표시 (3초 규칙) | 혼합모드 difference로 종이/먹 위 어디서나 읽힘 |
| 0.15–0.95s | 먹선 한 획이 떨어짐 | SVG `stroke-dashoffset` + feTurbulence/feDisplacementMap 붓 질감 필터 |
| 0.95s | 수면에 닿음 — 물결 + 자개빛 **(색 1)** | WebGL2 높이장 물결 시뮬레이션(핑퐁 RGBA16F, soju22 Liquid Effect 방식 직접 구현) + 법선 굴절·스페큘러 |
| 1.0–2.35s | 먹이 가라앉으며 번짐 (잉크 베일) | 같은 셰이더의 fbm 번짐 경계 + 한지 섬유 텍스처 |
| 1.85–3.0s | '결'을 획순대로 씀 | typo-v2 붓털 엔진(Canvas2D) |
| 3.05–3.7s | 결이 4조각으로 쪼개졌다 붙음 + 자개 光 **(색 2)** | clip-path 슬라이스 + GSAP expo, GYEOLLAK은 SplitText 마스크 상승 |
| 3.5s~ | 결 안에서 먹 백합이 핌 | `<video>`를 거대 글자 모양 `mask-image`로 잘라 보여 줌 |
| 3.9–4.5s | 세로쓰기 슬로건 | 글자별 0.6초 안에 등장 (자리표시 서체 Song Myung → 확정 붓글씨 이미지로 교체 예정) |

## 스크롤
- 결 확대 통과(핀 150%): ScrollTrigger scrub, 레터박스 + 청묵 베일 → 12m 멤버
- 수심 게이지 0m→12m→0m (하단 고정)
- 12m 멤버: 아치 프레임 드러남 · 금붕어는 잔상(9% 투명)만 — CSS scroll-driven `view()`
- 0m: 한지가 아래에서 번져 올라옴(`clip-path` + `view()`), 네 꽃이 색을 되찾으며 핌 **(색 3)**
- 챕터: Shopify Editions식 카테고리 스크롤(데스크톱 왼쪽 고정 목록 / 모바일 상단 칩), `aria-current`
- 메뉴: 우상단 세로 4줄. 누르면 오른쪽 위 모서리에서 먹이 번지고 자개빛 테두리가 지나간 뒤 이동

## 품질 단계
high(WebGL2 + EXT_color_buffer_float) → low(CSS 번짐·고리, WebGL 없음) → static(모션 줄이기/GSAP 로드 실패/JS 없음: 정착 화면 그대로). 초당 프레임이 2초 연속 28 미만이면 실행 중 한 단계 낮춤.

## 출처·라이선스 메모
- GSAP 3.15.1(+ScrollTrigger, SplitText) jsDelivr — 2025-04-30부터 무료 표준 라이선스
- 물결: codepen soju22 "Liquid Effect"(threejs-components liquid1, **CC BY-NC-SA 4.0 = 비상업**)의 방식(높이장 파동 → 법선 → 굴절/스페큘러, attenuation·drop 셰이더)을 참고해 **코드는 직접 작성**. 라이브러리는 포함하지 않음. 상업 오픈 전 법무 확인 권장.
- 이미지/영상: 결락 기존 에셋(menu-scroll-v1, v15-tests/lily.mp4를 먹색 반전 처리)

## 스크립트
`shoot.js`(스킬 기본 점검) · `scenes.js`(스크롤 장면) · `capture.js`(인트로 프레임) · `contrast.js` + `contrast.py`(움직이는 배경 위 글자 대비, 0.2초 간격 전 프레임)
