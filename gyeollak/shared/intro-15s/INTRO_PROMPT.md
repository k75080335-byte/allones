# 결락 사이트 인트로 15초 — 컷별 프롬프트 (모드 A/D 하이브리드)

홈 `05 / Intro · 15s` 자리용. 비트는 사이트에 이미 적힌 그대로: 0–2 먹비 · 2–5 태준 · 5–8 유성 · 8–11 진우 · 11–13 류현 · 13–15 넷.

- 음악: Drive 「연소 (Burn Out) (Edit)」 3.0s–18.0s 구간 (15초). 0–1.3 비/정적 → 1.3부터 빌드 → 11.5–12 잠깐 꺼짐 → **14.6s 밴드 풀 진입 = 파이널 컷**. 파일: `intro15_burnout.mp3` (페이드 인 0.5s / 아웃 0.5s, -16 LUFS)
- 16:9, 1920×1080 이상. 컷별 생성 → 편집에서 이어 붙임.
- 기본 의상: 흰 새틴. 담배·총 없음. 커플 연출 없음. 은은한 메이크업(글로스·펄 없음).

## 키 잠금 (모든 컷 공통 — 빼지 않는다)

| 멤버 | 키 | 꽃 | 머리 |
| --- | --- | --- | --- |
| 문태준 | **195cm** (제일 큼) | 백합 | 검정 |
| 채유성 | **190cm** | 동백 (송이째 짐) | 라벤더 실버 |
| 하진우 | **189cm** | 수국 | 애쉬 블론드 |
| 채류현 | **188cm** (제일 작음) | 능소화 (반 박자 늦게) | 검정 |

AI는 숫자 키를 그대로 못 읽어서, 세 가지로 동시에 잠근다.

1. **고정 기준물** — 모든 단독 컷에 같은 **높이 200cm짜리 얇은 세로 빛 기둥(light bar)** 을 인물 옆 같은 거리에 둔다. 머리끝이 기둥 끝에서 태준 5cm / 유성 10cm / 진우 11cm / 류현 12cm 아래.
2. **고정 카메라** — 전신 컷은 카메라 높이 120cm, 인물까지 거리 고정, 35mm. 그러면 화면 속 키 비율이 실제 키 비율이 된다 (전신이 프레임 높이에서 차지하는 비율: 태준 86% / 유성 83.8% / 진우 83.3% / 류현 82.9%).
3. **넷이 같이 나오는 컷** — 키 순서와 머리끝 차이를 문장으로 명시: "Taejun clearly tallest, head 5cm above Yuseong; Yuseong, Jinwoo, Ryuhyun nearly level, each 1cm lower than the last."

```text
HEIGHT LOCK (paste into every prompt)
Moon Taejun 195cm — the tallest, very long legs, small head, ~8.6 heads tall.
Chae Yuseong 190cm. Ha Jinwoo 189cm. Chae Ryuhyun 188cm — the shortest of the four,
still very tall. All four are lean but not skinny, broad shoulders, long legs.
A thin vertical light bar exactly 200cm tall stands beside the subject at the same
distance in every shot. The top of the head sits [5 / 10 / 11 / 12]cm below the top of the bar.
Never shrink, slim or re-proportion the body. Do not change height between shots.
```

## 공통 블록

```text
DURATION: 15 SECONDS (generated per shot, cut together)
FORMAT: Cinematic editorial site intro — not a music video
ASPECT RATIO: 16:9 · RESOLUTION: 1920x1080 or higher
GENRE: Quiet ink-and-water band editorial. Intimate without romance staging.
STYLE: Premium cinematic realism, tactile East Asian ink-and-hanji atmosphere,
soft 35mm grain, slight halation, restrained teal accent; pale hanji light at the
open deepening to ink-navy by the end. No beauty filter, no glossy skin, no lip gloss.

REFERENCE LOCK
@member = exact face, hair, anatomy, skin, HEIGHT (see HEIGHT LOCK).
@white_satin = white satin suit, natural drape and weight.
Style references define mood only; never replace a locked face.

CAMERA TEXTURE
35mm analog, organic grain, focus breathing, micro handheld drift, strong DOF.
AUDIO: none in generation (music added in edit). No whooshes.
```

## 컷 리스트

| 샷 | 시간 | 레퍼런스 | 생성 | 한 줄 동작 |
| --- | --- | --- | --- | --- |
| S01 | 0–2 | 인물 없음 | 3s | 먹 붓질이 한지색 수면에 닿아 옆으로 번지고, 빗방울이 같은 점을 친다. 두 번째 물결에서 컷 |
| S02 | 2–5 | 태준 + 흰 새틴 + 200cm 기둥 | 4s | 28mm 수면 높이. 왼쪽 끝에 태준(195), 오른쪽은 빈 물. 손가락 두 개가 수면에 닿고 물결이 렌즈로 온다. 닿기 전 컷 |
| S03 | 5–8 | 유성 + 흰 새틴 + 기둥 | 4s | 동백이 송이째 떨어진다. 유성(190)이 올려다보며 손을 뻗고 몇 cm 차이로 놓친다. 꽃이 물에 닿기 전 컷 |
| S04 | 8–11 | 진우 + 흰 새틴 + 기둥 | 4s | 위에서 본 금붕어 잔상(몸통 흐림, 꼬리는 먹선)이 지나가고, 진우(189)가 소리 따라가듯 고개를 돌린다. 돌리는 중간에 컷 |
| S05 | 11–13 | 류현 + 흰 새틴 + 기둥 | 3s | 먹남색 깊이. 젖은 새틴 소매 접사 → 류현(188)의 손이 위쪽 빛으로 올라간다. 닿기 직전 컷 |
| S06 | 13–14.4 | S01–S05 파편 | 편집 | 3–8프레임 스케일 충돌 (붓질 / 물결 / 동백 / 금붕어 선 / 손끝 / 눈) |
| S07 | 14.4–15 | 넷 + 흰 새틴 | 4s → 트림 | **음악 풀 진입 순간**. 얕은 물 위 넷, 키 순 (태준 195 › 유성 190 › 진우 189 › 류현 188), 카메라 안 봄, 거의 안 보이는 푸시. 드롭 프레임 하나 → 블랙 |

### S07 프롬프트 핵심

```text
All four members in white satin standing in shallow dark water, ink-navy depth behind.
HEIGHT ORDER, clearly readable: Moon Taejun (195cm) is unmistakably the tallest,
his head about 5cm above Chae Yuseong (190cm); Yuseong, Ha Jinwoo (189cm) and
Chae Ryuhyun (188cm) are nearly level, each about 1cm lower than the last.
Same ground plane, same distance from camera, feet on the same water line —
no forced perspective. Not a centered catalog lineup: staggered, partial bilateral
framing, they look across the water, not at the camera. A faint 결 brushstroke settles
on the water between them. Almost imperceptible push. Focus drifts near eye → dark
space between → farther eye. One dropped frame. Cut to black.
```

## 걷기 모션 재생성 (사이트 `v/*_a.mp4`, `walk_band_a.mp4` 대체)

이전 문제: 720p 생성 + 저해상 시작 이미지 + 배경 제거 매트가 거칠었음.

- 시작 이미지: 2K 이상 새로 뽑기 (밝은 회색 무지 스튜디오, 머리~신발 전체, 위아래 여백).
- 영상: Kling 3.0 `4k` 모드 (또는 `pro` 1080p), 사운드 off, 9:16, 5초.
- 키: 위 HEIGHT LOCK + 고정 카메라(120cm, 35mm, 같은 거리). 사이트는 `--h:100 / 97.4 / 96.9 / 96.4` 로 이미 키 비율 스케일 중이라, 영상 안에서는 **전신 프레이밍을 네 명 다 똑같이** 맞추는 게 핵심.
- 그 뒤 배경 제거 → 컬러+알파 세로 스택(기존 형식) 으로 인코딩.
