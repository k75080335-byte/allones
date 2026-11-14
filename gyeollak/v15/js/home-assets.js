/* 결락 v15 · 홈 소스 목록
   그록 소스가 오면 여기서 src / frames / video만 바꾸면 된다.
   status: 'placeholder' = Claude가 만든 대체 그림 (화면에 「대체」 표시)
           'interim'     = 기존 사이트 자료로 임시 사용
           'approved'    = 승인된 최종 소스
   frames: 연속 프레임(봉오리 → 개화 등). 2장이면 겹쳐 바뀌고, 많을수록 영상처럼 넘어간다.
   video : 반복 영상(바다·구름 등). 있으면 이미지 대신 재생, 화면 밖에서는 정지.
   blend : 'screen' = 검정 배경 소스를 물 위에 빛처럼 얹음 */
window.GY_HOME = {
  sky:       { status: 'interim',     src: 'img/v12/sky.webp', note: '흐린 청색 하늘 · 먹구름 (그록 반복 영상 예정)' },
  mark:      { status: 'interim',     src: 'img/v12/logo_base.png', note: '결 — 승인 원본으로 교체' },
  markI:     { status: 'interim',     src: 'img/v12/logo_i.png', note: '결의 ㅣ' },
  drop:      { status: 'placeholder', src: 'img/home/drop_ph.webp', blend: 'screen', note: '물방울 + 은백색 금붕어 (GPT 이미지 A → 그록 낙하 영상)' },
  sea:       { status: 'placeholder', src: 'img/home/sea_ph.webp', video: '', note: '바다 영상 (그록 반복 영상)' },
  under:     { status: 'placeholder', src: 'img/home/under_ph.webp', note: '수면 아래 · 빛줄기 (그록)' },
  fish:      { status: 'placeholder', frames: ['img/home/fish_ph.webp'], blend: 'screen', note: '은백색 금붕어 유영 (그록, 검정 배경)' },
  abyss:     { status: 'placeholder', src: 'img/home/abyss_ph.webp', note: '남색 → 먹빛 심연 (그록)' },
  hydrangea: { status: 'placeholder', frames: ['img/home/fl_hydrangea_bud.webp', 'img/home/fl_hydrangea_open.webp'], blend: 'screen', note: '수국 개화 (그록, 검정 배경)' },
  camellia:  { status: 'placeholder', frames: ['img/home/fl_camellia_bud.webp', 'img/home/fl_camellia_open.webp'], blend: 'screen', note: '동백 개화 (그록, 검정 배경)' },
  trumpet:   { status: 'placeholder', frames: ['img/home/fl_trumpet_bud.webp', 'img/home/fl_trumpet_open.webp'], blend: 'screen', note: '능소화 개화 (그록, 검정 배경)' },
  lily:      { status: 'placeholder', frames: ['img/home/fl_lily_bud.webp', 'img/home/fl_lily_open.webp'], blend: 'screen', note: '백합 개화 (GPT 이미지 B → 그록)' },
  petal:     { status: 'placeholder', src: 'img/home/petal_ph.webp', blend: 'screen', note: '꽃잎 흩날림 (그록 입자 소스)' },
  m_jinwoo:  { status: 'interim',     src: 'img/members/jinwoo_suit.webp', note: '승인 화보로 교체' },
  m_yuseong: { status: 'interim',     src: 'img/members/yuseong_suit.webp', note: '승인 화보로 교체' },
  m_ryuhyeon:{ status: 'interim',     src: 'img/members/ryuhyeon_suit.webp', note: '승인 화보로 교체' },
  m_taejun:  { status: 'interim',     src: 'img/members/taejun_suit.webp', note: '승인 화보로 교체' },
};
