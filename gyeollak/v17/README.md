# v17 — 스튜디오 무대 + 스크롤로 돌아서는 인물 (2026-11-16)

참고 영상(Novu 형식)대로: 고정된 스튜디오 배경, 스크롤에 묶여 돌아서는 인물 한 명, 번호 붙은 굵은 문단, 아래에서 올라오는 멤버 패널.

## 인물 영상 넣는 법
지금은 류현 턴어라운드 컷 4장(뒤·옆·¾·정면)을 임시로 섞어 쓴다. 영상이 오면:

1. 힉스필드에서 5–8초 영상 1개 (세로 9:16, 1080p 이상, 소리 없음).
   - 시작 프레임: 뒷모습 전신, 끝 프레임: 정면 전신 (start/end 프레임 지정 가능한 모델)
   - 프롬프트 골격:
     `Full-body fashion film of the same man standing on a seamless light grey studio cyclorama. He starts with his back to the camera, slowly turns around on the spot and ends facing the camera, hands in pockets. Locked-off camera, whole body in frame head to toe with margin, soft even studio light, soft contact shadow, no camera movement, no cuts, no text.`
2. 프레임으로 풀기 (배경이 무대색과 같으면 투명 처리 없이 써도 된다):
   `ffmpeg -i turn.mp4 -vf "fps=20,scale=-2:1440" -c:v libwebp -quality 82 assets/seq/%03d.webp`
3. `index.html`의 `SEQ`를 `{dir:'assets/seq/',count:<프레임 수>,ext:'webp',pad:3,blend:false}`로. ffmpeg 번호가 001부터면 000부터로 이름을 맞춘다.
4. 인물 위치·크기는 `CAM_D`(데스크톱), `CAM_M`(폰) 숫자로 조정.

미리듣기(`audio/`)는 v15 음원에서 자른 30초. SOUND는 임시 빗소리.
