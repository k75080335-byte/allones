# GYEOLLAK ㄱㄹ 결 · 물방울 투명 로고

2026-11-13. 공식 마크(438×390, `d-refs/결락사이트/결락로고` 01 보드 · `draft-v07/img/logo/mark-ink.png`) 형태를 그대로 두고, 재질만 물방울·액체 유리로 렌더한 시안.

## 원본
- 벡터: `src/gyeollak-mark.svg` (공식 보드에서 스냅한 사각형 합집합, 원본 대비 IoU 0.9915)
- ㄱ 줄기와 ㄹ 윗획 사이 15유닛 간격은 유지. 모서리 접점만 2×2 유닛을 겹쳐 메쉬가 이어지게 함.

## 결과 (모두 2048×2048 PNG, 영상만 16:9)
| 파일 | 내용 |
|---|---|
| `front-transparent.png` | 정면, 투명 배경 (알파 — 배경이 비침) |
| `front-transparent-shadow.png` | 위 + 콘택트 섀도 |
| `quarter-transparent.png` | 3/4, 투명 배경 |
| `quarter-transparent-shadow.png` | 위 + 콘택트 섀도 |
| `front-white.png` | 정면, 흰 스튜디오 |
| `front-pastel.png` | 정면, 사이트 파스텔 `#DCE6F2` |
| `quarter-pastel.png` | 3/4, 파스텔 — 두께·굴절이 가장 잘 보임 |
| `front-black.png` | 정면, 스튜디오 네이비 (물리 유리) |
| `front-transparent-on-ink.png` | 정면 투명 PNG를 `#0B0D12` 위에 합성 (핀 3 읽기) |
| `contact.png` | 핀 3장 + 결과 한 장 요약 |
| `site-surface-droplogo.png` | `draft-v07/index-droplogo.html` 첫 화면 스크린샷 (원본 index.html은 그대로) |
| `spin-16x9.mp4` | 5초 360° 루프 |

렌더: Blender 4.5.9 Cycles (스틸), EEVEE Next (턴테이블). 스크립트 `src/render_logo.py`.
