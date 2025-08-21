(function () {
  // ===== viewport 보정 =====
  const setVH = () => {
    const vh = window.innerHeight * 0.01;
    document.documentElement.style.setProperty('--vh', `${vh}px`);
  };
  setVH();
  window.addEventListener('resize', setVH);

  // ===== 데이터 =====
  const { questions, profiles, RESULT_PAGES } = window.TEST_DATA;

  // ===== 상태 =====
  let idx = 0;
  const answers = new Map(); // q.id -> 'A' | 'B'

  // ===== DOM =====
  const $screenStart = document.getElementById("screen-start");
  const $screenTest  = document.getElementById("screen-test");
  const $screenR1    = document.getElementById("screen-result-1");
  const $screenR2    = document.getElementById("screen-result-2"); // 있을 수도/없을 수도

  const $btnStart = document.getElementById("btn-start");
  const $btnPrev  = document.getElementById("btn-prev");
  const $optA     = document.getElementById("opt-A");
  const $optB     = document.getElementById("opt-B");

  const $qNo      = document.getElementById("q-number");
  const $qTitle   = document.getElementById("q-title");
  const $qVisual  = document.getElementById("q-visual");

  const $optA_main = document.getElementById("optA-main");
  const $optA_sub  = document.getElementById("optA-sub");
  const $optB_main = document.getElementById("optB-main");
  const $optB_sub  = document.getElementById("optB-sub");

  const $progress  = document.getElementById("progress");

  // 결과1
  const $r1Type = document.getElementById("r1-type");
  const $r1Title = document.getElementById("r1-title");
  const $r1Sub = document.getElementById("r1-sub");
  const $r1Paragraph = document.getElementById("r1-paragraph");
  const $r1Img = document.getElementById("r1-img");
  const $r1Gauges = document.getElementById("r1-gauges");
  const $btnResultNext = document.getElementById("btn-result-next");

  // 결과2(선택)
  const $btnHome = document.getElementById("btn-home");

  // ===== 질문번호별 30% 가중치 매핑 (Q1~Q12 고정) =====
  const QUESTION_WEIGHT = 30;
  const QUESTION_MAP = {
    1:  { dim: 'EI', A: 'E', B: 'I' },
    2:  { dim: 'SN', A: 'S', B: 'N' },
    3:  { dim: 'TF', A: 'F', B: 'T' },
    4:  { dim: 'JP', A: 'J', B: 'P' },
    5:  { dim: 'SN', A: 'S', B: 'N' },
    6:  { dim: 'EI', A: 'E', B: 'I' },
    7:  { dim: 'TF', A: 'F', B: 'T' },
    8:  { dim: 'JP', A: 'J', B: 'P' },
    9:  { dim: 'EI', A: 'E', B: 'I' },
    10: { dim: 'TF', A: 'F', B: 'T' },
    11: { dim: 'SN', A: 'S', B: 'N' },
    12: { dim: 'JP', A: 'J', B: 'P' },
  };

  // 각 차원의 좌/우 라벨(게이지 표기용)
  const PAIRS = {
    EI: ['E', 'I'],
    SN: ['S', 'N'],
    TF: ['T', 'F'],
    JP: ['J', 'P'],
  };

  // ===== 이벤트 =====
  $btnStart.addEventListener("click", () => {
    $screenStart.classList.add("hidden");
    $screenTest.classList.remove("hidden");
    render();
  });

  $btnPrev.addEventListener("click", () => {
    if (idx > 0) { idx--; render(); }
  });

  // 결과2를 쓰지 않는 레이아웃에서도 안전하게 동작
  if ($btnResultNext) {
    $btnResultNext.addEventListener("click", () => {
      // 결과1 → 처음으로
      $screenR1.classList.add('hidden');
      $screenStart.classList.remove('hidden');
      answers.clear(); idx = 0;
      $progress.style.width = '0%';
    });
  }
  if ($btnHome && $screenR2) {
    $btnHome.addEventListener("click", () => {
      $screenR2.classList.add("hidden");
      $screenStart.classList.remove("hidden");
      answers.clear(); idx = 0;
      $progress.style.width = "0%";
    });
  }

  // ===== 렌더 =====
  function render() {
    const q = questions[idx];

    $qNo.textContent = String(idx + 1);
    $qTitle.textContent = q.title;

    if (q.img) { $qVisual.src = q.img; $qVisual.style.display = "block"; }
    else { $qVisual.removeAttribute("src"); $qVisual.style.display = "none"; }

    $optA_main.textContent = q.A.main;
    setList($optA_sub, q.A.subs);
    $optB_main.textContent = q.B.main;
    setList($optB_sub, q.B.subs);

    $progress.style.width = `${(idx / questions.length) * 100}%`;

    highlight($optA, answers.get(q.id) === "A");
    highlight($optB, answers.get(q.id) === "B");

    $optA.onclick = () => choose("A");
    $optB.onclick = () => choose("B");
  }

  function setList($ul, arr = []) {
    $ul.innerHTML = "";
    (arr || []).forEach(t => {
      const li = document.createElement("li");
      li.textContent = t;
      $ul.appendChild(li);
    });
  }
  function highlight($btn, on) {
    $btn.style.filter = on ? "brightness(0.97)" : "none";
    $btn.style.transform = on ? "translateY(1px)" : "none";
  }

  function choose(letter) {
    const q = questions[idx];
    answers.set(q.id, letter);
    if (idx >= questions.length - 1) showResult();
    else { idx++; render(); }
  }

  // ===== 결과 계산: 질문별 30% 누적 + 게이지 스냅(0/33/66/99) =====
  function calcScores() {
    // 누적 점수(각 차원 좌/우 문자별)
    const score = {
      EI: { E: 0, I: 0 },
      SN: { S: 0, N: 0 },
      TF: { T: 0, F: 0 },
      JP: { J: 0, P: 0 },
    };

    questions.forEach((q, i) => {
      const pick = answers.get(q.id);
      if (!pick) return;
      const no = i + 1;
      const map = QUESTION_MAP[no];
      if (!map) return;

      // A → map.A 에 +30, B → map.B 에 +30
      const target = (pick === 'A') ? map.A : map.B;
      score[map.dim][target] += QUESTION_WEIGHT;
    });

    // 게이지 퍼센트 산출 → 0/33/66/99 네 단계로 스냅
    const gauges = {};
    (['EI','SN','TF','JP']).forEach(dim => {
      const [L, R] = PAIRS[dim];
      const Lval = score[dim][L];
      const Rval = score[dim][R];
      const total = Lval + Rval || 1;

      let leftPct = (Lval / total) * 100;

      // 스냅 규칙
      if (leftPct < 16.5)      leftPct = 0;
      else if (leftPct < 50)   leftPct = 33;
      else if (leftPct < 83.5) leftPct = 66;
      else                     leftPct = 99;

      const rightPct = 100 - leftPct;
      gauges[dim] = { L, R, leftPct, rightPct };
    });

    return { score, gauges };
  }

  // ===== MBTI 결정: 각 차원 과반(동률은 좌측 우선) =====
  function decideMBTI(score) {
    const letter = (dim) => {
      const [L, R] = PAIRS[dim];
      const Lval = score[dim][L];
      const Rval = score[dim][R];
      return (Lval >= Rval) ? L : R;
    };
    return [
      letter('EI'),
      letter('SN'),
      letter('TF'),
      letter('JP'),
    ].join('');
  }

  // ===== 결과 페이지 표시 =====
  function showResult() {
    const { score, gauges } = calcScores();
    const letters = decideMBTI(score);

    // 페이지 전환
    $screenTest.classList.add("hidden");
    if ($screenR2) $screenR2.classList.add("hidden");
    $screenR1.classList.remove("hidden");

    // 텍스트/이미지
    const prof = profiles[letters] || { title: "결과", summary: "" };
    $r1Type.textContent = letters;
    $r1Title.textContent = prof.title || "";
    $r1Sub.textContent = prof.summary || "";

    const cfg = (RESULT_PAGES[letters] || RESULT_PAGES.DEFAULT) || {};
    if (cfg.img1) $r1Img.src = cfg.img1;
    if (cfg.page1 && cfg.page1.paragraph) $r1Paragraph.textContent = cfg.page1.paragraph;

    // 게이지(좌측 라벨 기준)
    $r1Gauges.innerHTML = "";
    ['EI','SN','TF','JP'].forEach(dim => {
      const { L, R, leftPct, rightPct } = gauges[dim];
      const card = document.createElement("div");
      card.className = "gauge";
      card.innerHTML = `
        <h4>${L} ${leftPct}% · ${R} ${rightPct}%</h4>
        <div class="track"><div class="fill" style="width:${leftPct}%"></div></div>
      `;
      $r1Gauges.appendChild(card);
    });

    // 진행바 100%
    $progress.style.width = "100%";
  }
})();

