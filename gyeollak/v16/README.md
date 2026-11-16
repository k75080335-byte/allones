# v16 — 레퍼런스 형식으로 새로 짠 메인 (2026-11-16)

한 페이지, 7개 챕터: SURFACE → 결·락 → FILM(수조 액자) → BLOOM(네 송이) → MEMBERS(가로 필름 스트립) → MUSIC → WORLD.

- 라이브러리 없음. `index.html` 하나에 CSS·JS가 들어 있다.
- 소스 교체: `index.html` 스크립트 맨 위 `SOURCES`에 경로를 적는다.
  - `film.video` / `film.videoMobile`: 인트로 필름. 비우면 단체 스틸.
  - `loops.{taejun,yuseong,jinwoo,ryuhyeon}`: 멤버 4초 루프. FOOTAGE 모드에서 재생. 비우면 사진.
- `assets/`는 기존 테스트 소스 복사본(흰 옷 컷, 프로필, 풀밭 단체컷, 꽃). 꽃은 검은 배경을 투명으로 바꿨다.
- `audio/`는 v15 음원에서 잘라 낸 30초 미리듣기. 음원이 없는 곡은 '준비 중'.
- SOUND는 코드로 만든 임시 빗소리다.
