# 결락 인트로 A — 45초 「달리는 비」 (모드 D 몽타주 + B 동작 감각)

곡: `GYEOLLAK intro v1` (Suno, 44.9초). 빗소리 + 기타 한 음 → 낮은 내레이션 → 빌드 → 메가폰 보컬 → 벽 같은 기타 → **하드컷 정적**.
느낌: 네 사람이 비를 맞으며 시간대 순서로 빠르게 움직이고, 얼굴이 스쳐 지나간다. 강하고 빠르다.

- 16:9, 1920×1080 이상. 컷 단위로 생성해서 편집에서 곡에 맞춰 붙인다. 한 번에 45초를 뽑지 않는다.
- 생성 오디오는 끈다(곡을 편집에서 얹음).
- 담배·총·무기 없음. 커플 연출(키스·포옹) 없음. 은은한 메이크업만(글로스·펄 없음).

## 곡 구간 (실측 RMS)

| 시간 | 소리 | 화면 리듬 |
| --- | --- | --- |
| 0.0–0.8 | 무음 | 검은 화면 → 빗방울 한 점 |
| 0.8–9.5 | 비 + 기타 한 음 + 내레이션 "They said it rained…" (5.3 · 7.8 · 8.3 숨) | 2~3초 컷, 접사 위주, 느림 |
| 9.5–18.4 | 베이스·탐 진입, 빌드 | 1~1.5초 컷, 달리기 시작 |
| 18.5–22.6 | 살짝 빠짐, 내레이션 "Then why am I still soaking wet" | 한 컷 길게(얼굴), 숨 |
| 22.7–41.0 | 메가폰 보컬 → 클라이맥스 | 0.3~1초 파편, 얼굴 스침, 시간대 순환 |
| 41.0–42.0 | 하드컷 | 한 프레임 정지 → 블랙 |
| 42.0–44.9 | 정적 | 블랙 위 結 한 획, 끝 |

## 공통 블록 (모든 컷 맨 위에 붙임)

```text
FORMAT: Cinematic band intro, generated per shot, cut to music in edit
ASPECT RATIO: 16:9 · RESOLUTION: 1920x1080 or higher · AUDIO: off
GENRE: Rain-soaked running montage. Urgent, physical, intimate without romance staging.
STYLE: Premium cinematic realism, 35mm analog grain, slight halation, imperfect exposure,
focus breathing, micro handheld instability, low-shutter smear on fast motion only.
Palette: ink-navy night, cold white streetlight, wet asphalt reflections,
one restrained teal glint. Flower colours are the only warm accents.
No beauty filter, no glossy skin, no lip gloss, no shimmer. Natural skin texture.

REFERENCE LOCK
@taejun / @yuseong / @jinwoo / @ryuhyun = exact face, hair, anatomy, skin. Never swap faces.
@wardrobe = black suit set (see sheet). Rain darkens the fabric; same garments every shot.

HEIGHT LOCK
Moon Taejun 195cm — the tallest, very long legs, small head.
Chae Yuseong 190cm. Ha Jinwoo 189cm. Chae Ryuhyun 188cm — the shortest of the four, still very tall.
When two or more share a frame: same ground plane, no forced perspective,
Taejun's head clearly above the others; Yuseong, Jinwoo, Ryuhyun nearly level, each ~1cm lower.
Never shrink, slim or re-proportion a body.

MOTIFS (fragments only): rain, water surface, ink bleed, goldfish afterimage
(faint body, tail dissolving into one brush line), lily / camellia (whole bloom falls) /
hydrangea / trumpet vine (blooms half a beat late), a single 結 brushstroke.

CAMERA MOTION (pick per shot): fast lateral track beside a runner, snap pan, foreground wipe
by a passing shoulder or umbrella-less rain sheet, low-angle splash creep, overhead fragment.
One action per shot. Cut before the action completes.
```

## 컷 리스트

시간대 순서 = 새벽(태준) → 아침 비(유성) → 해 질 녘(진우) → 밤(류현) → 넷이 함께(한밤).

| 컷 | 곡 시간 | 레퍼런스 | 생성 | 한 줄 동작 · 렌즈 |
| --- | --- | --- | --- | --- |
| A01 | 0.8–3.0 | 인물 없음 | 4s | 100mm 접사. 검은 수면에 빗방울 하나, 파문 두 겹. 두 번째 고리에서 컷 |
| A02 | 3.0–5.3 | @taejun | 4s | 새벽 푸른빛. 85mm. 젖은 눈썹에서 물이 떨어지고 눈을 뜬다. 뜨는 중간 컷 |
| A03 | 5.3–7.8 | @yuseong | 4s | 아침 비. 50mm 측면. 하늘을 보는 턱선, 동백 한 송이가 통째로 화면 앞을 지나며 와이프 |
| A04 | 7.8–9.5 | @jinwoo · @ryuhyun | 4s | 24mm 양끝 구도. 왼쪽 진우 선명, 오른쪽 류현 흐림. 둘 다 같은 방향으로 고개를 돌림 |
| A05 | 9.5–11.0 | @taejun | 5s | 첫 발. 발목 높이 로우 트래킹, 젖은 구두가 웅덩이를 찬다. 물보라 |
| A06 | 11.0–12.5 | @yuseong | 5s | 골목을 달림. 측면 빠른 트래킹, 젖은 머리가 이마에 붙음 |
| A07 | 12.5–14.0 | @jinwoo | 5s | 해 질 녘 다리 위. 망원 압축, 비 커튼 사이로 달려 나옴 |
| A08 | 14.0–15.5 | @ryuhyun | 5s | 밤 네온 없는 가로등 아래. 스냅 팬으로 들어와 뒤돌아봄. 돌아보는 중간 컷 |
| A09 | 15.5–18.4 | 넷 | 5s | 위에서 내려다본 젖은 교차로, 네 사람이 키 순 간격으로 가로지름. 금붕어 잔상 하나가 같은 방향으로 지나감 |
| A10 | 18.5–22.6 | @ryuhyun | 5s | 숨. 50mm 정면 근접, 비 맞는 얼굴, 숨을 고르며 눈을 감는다. 이 컷만 길게 |
| A11 | 22.7–23.5 | @taejun | 4s → 트림 | 0.4초 얼굴 스침, 오른쪽→왼쪽 |
| A12 | 23.5–24.3 | @yuseong | 4s → 트림 | 0.4초 얼굴 스침, 왼쪽→오른쪽 |
| A13 | 24.3–25.1 | @jinwoo | 4s → 트림 | 0.4초 얼굴 스침, 위→아래 |
| A14 | 25.1–26.0 | @ryuhyun | 4s → 트림 | 0.4초 얼굴 스침, 아래→위 |
| A15 | 26.0–30.0 | 넷 | 5s | 달리는 넷 측면 트래킹, 앞에서 류현 → 진우 → 유성 → 태준 순서로 화면을 지나감. 키 차이 읽히게 |
| A16 | 30.0–34.0 | 넷 각자 | 각 4s → 1초씩 | 꽃 컷 4개: 백합 위 빗방울 / 동백 통째 낙화 / 수국 위 물보라 / 능소화가 반 박자 늦게 핌 |
| A17 | 34.0–38.0 | 파편 | 편집 | 3~8프레임 스케일 충돌: 구두·눈·젖은 소매·물보라·먹 번짐·금붕어 선 |
| A18 | 38.0–41.0 | 넷 | 5s | 한밤 젖은 바닥, 넷이 동시에 멈춤. 반사된 물에 네 사람 거꾸로. 카메라 거의 안 보이게 밀기 |
| A19 | 41.0–42.0 | — | 편집 | 하드컷: A18 마지막 프레임 1프레임 정지 → 블랙 |
| A20 | 42.0–44.9 | 인물 없음 | 4s | 블랙 위 흰 먹으로 結 한 획이 써지고 번짐 |

### 대표 컷 프롬프트 (A15)

```text
[COMMON BLOCK]
SHOT A15 · 4 seconds · night street in heavy rain
Tracking shot at waist height, moving left to right alongside the runners.
All four members in @wardrobe run through rain on wet asphalt, one after another,
passing close to the lens: Chae Ryuhyun first, then Ha Jinwoo, Chae Yuseong, Moon Taejun last.
Height is readable as they pass: Taejun clearly tallest, the other three nearly level.
Rain streaks catch cold streetlight; splashes rise from each step; jackets swing with real weight.
Faces glimpsed in profile, not posing, not looking at camera.
Foreground rain sheet wipes the frame at the end. Cut as Taejun's shoulder fills the frame.
```

## 편집 메모

- 하드컷(41.0)은 곡의 정적과 정확히 맞춘다. 화면이 먼저 끊기면 안 된다.
- 얼굴 스침(A11–A14)은 움직임 방향을 매번 바꿔서 같은 프레이밍이 두 번 이어지지 않게.
- 사이트에서는 1080p H.264, 전 프레임 키프레임(스크럽용) 한 벌 + 일반 재생용 한 벌.
