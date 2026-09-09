# 흐름 연구소 · Navier–Stokes Lab

**[🌊 웹사이트 열기 — 모바일·PC 공통](https://navier-stokes-lab.pavy.chatgpt.site)**

수학을 처음 접하는 사람도 물의 움직임을 만지고, 방정식을 읽고, 밀레니엄 문제의 의미를 이해하는 한국어 교육 사이트입니다.

현재 소스 저장소와 실행 사이트는 비공개입니다. 실행 링크는 소유자의 ChatGPT 계정으로 로그인해 이용합니다. 별도 설치 없이 모바일·PC의 최신 브라우저에서 사용할 수 있습니다.

## 직접 해볼 수 있는 것

- **흐름 실험실:** 잉크 흘리기, 두 흐름 만나기, 소용돌이 만들기
- **움직임 조절:** 점성·미는 힘, 잉크 공급, 방향 화살표, 일시정지·초기화
- **세 가지 관찰:** 색 잉크, 빠르기, 회전 방향
- **방정식 탐색:** 다섯 항을 누르면 우리말 설명과 개념 애니메이션 표시
- **밀레니엄 문제:** 유한 시간 발산의 뜻을 슬라이더로 이해하고 OpenAI 발표와 공식 인정 상태 구분
- **이해 확인:** 피드백이 있는 세 문항

PC에서는 마우스로, 모바일에서는 손가락으로 실험 화면을 드래그합니다. 키보드는 Tab으로 실험 화면에 이동한 뒤 방향키로 저을 위치를 옮기고 Space로 회전을 추가합니다. 모션 감소 설정을 사용하면 유체 애니메이션은 일시정지 상태로 시작합니다.

## 과학적 범위

밀도·점성이 일정한 비압축성 뉴턴 유체를 교육 목적으로 근사합니다.

```math
\frac{\partial \mathbf u}{\partial t} + (\mathbf u\cdot\nabla)\mathbf u
= -\frac{1}{\rho}\nabla p + \nu\nabla^2\mathbf u + \mathbf f,
\qquad \nabla\cdot\mathbf u = 0
```

- 2차원 균일 격자, 반라그랑주 이류, 암시적 점성 확산, 압력 투영을 사용합니다.
- 벽은 비관통·자유 미끄럼 경계를 근사합니다. 압력 투영은 유한 반복이라 잔여 발산이 있습니다.
- 색 잉크는 수동 추적자이며 시각적 잔상 소멸을 위한 감쇠를 적용합니다. 물의 양을 뜻하지 않습니다.
- 격자 보간에 의한 수치적 확산도 있습니다. 점성·힘은 비교용 무차원 값입니다.
- 실제 물·꿀의 측정값이나 공학 설계용 CFD가 아니며, 3차원 난류 또는 밀레니엄 문제의 증명 결과를 재현하지 않습니다.
- 발산 그래프는 `y = 1/(1−t)`라는 별도 예시 함수입니다. 실제 Navier–Stokes 해와 구분해 표시합니다.

## OpenAI 발표: 2026년 9월 9일 확인

OpenAI는 2026년 9월 8일 매끄러운 외력이 있는 3차원 흐름의 유한 시간 특이점 구성과 Lean 형식화를 발표했습니다. 공개 자료는 공식 문제의 C·D에 해당한다고 설명합니다. 외력이 없는 A·B와 구분해야 합니다. 확인일의 Clay 문제 페이지는 **Unsolved**로 표시되어 있으며, 해결 발표와 공식 인정·상금 수여는 별도입니다.

1. [OpenAI 공식 발표](https://openai.com/index/navier-stokes-solution/)
2. [OpenAI 논문 — 정리 1.1 및 2절](https://cdn.openai.com/pdf/32d9f210-8b73-45e0-91bc-82a30aef8a9a/navier-stokes.pdf)
3. [OpenAI Lean 형식화](https://github.com/openai/NavierStokesAndEuler)
4. [Clay 공식 문제와 현재 상태](https://www.claymath.org/millennium/navier-stokes-equation/)
5. [Fefferman의 공식 문제 설명](https://www.claymath.org/wp-content/uploads/2022/06/navierstokes.pdf)
6. [Clay 상금 규정](https://www.claymath.org/millennium-problems/rules/)

## 로컬 실행

외부 라이브러리·API 키·설치·빌드가 필요 없는 정적 HTML/CSS/JavaScript 프로젝트입니다.

```bash
python -m http.server 8000 --directory dist
```

브라우저에서 `http://localhost:8000`을 엽니다. `dist/index.html`을 직접 열어도 동작합니다.

## 소스 구조

| 파일 | 역할 |
| --- | --- |
| `dist/index.html` | 학습 본문·출처·접근성 마크업 |
| `dist/style.css` | 모바일·PC 반응형 화면 |
| `dist/fluid.js` | 2D 유체 수치 계산 |
| `dist/app.js` | Canvas 렌더링·조작·방정식·퀴즈 |
| `dist/favicon.svg` | 아이콘 |
| `tests/physics.test.cjs` | 유체 수치모형 검증 |

수치 계산은 이해를 위한 직접 구현입니다. 외부 추적기·계정 수집·서버 API 호출은 포함하지 않습니다.

## 검증

```bash
node --test tests/physics.test.cjs
```

정지 유체의 보존, 압력 투영 후 발산 감소, 점성 증가에 따른 에너지 감소, 세 실험의 지속 외력 아래 유한값·비음수 잉크를 검증합니다. 4개 검증을 통과했습니다. JavaScript 문법, 내부 링크, UI 요소 연결, 로컬 자산 경로도 확인했습니다.

모바일에서는 실험 화면 아래로 제어판을 배치하고, 터치·키보드 입력과 모션 감소 설정을 지원합니다. 이 작업 환경에서는 실제 iOS/Android 기기와 PC 브라우저를 통한 화면 검증은 수행하지 않았습니다.
