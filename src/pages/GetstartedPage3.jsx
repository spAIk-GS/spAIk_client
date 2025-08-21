import React, { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import n1 from "../assets/n1.mp4";
import n2 from "../assets/n2.mp4";

export default function GetstartedPage3() {
  const containerRef = useRef(null);
  const isScrollingRef = useRef(false);
  const rootRef = useRef(null);
  const s3Ref = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!s3Ref.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          navigate("/login"); // s3 보이면 로그인 페이지로 이동
        }
      },
      { threshold: 0.6 } // 60% 이상 보이면 발동
    );

    observer.observe(s3Ref.current);

    return () => observer.disconnect();
  }, [navigate]);



  const SCROLL_MS = 900;      // 스크롤 이동 시간
  const ZOOM_SCALE = 1.03;    // 전환 시작 확대 배율
  const ZOOM_MS = 600;        // 줌 효과 지속 시간(ms)

  useEffect(() => {
    const container = containerRef.current;
    const root = rootRef.current;
    if (!container || !root) return;

    const sections = Array.from(container.querySelectorAll("section.panel"));
    const videos = Array.from(container.querySelectorAll("video.fullvideo"));

    // 현재 섹션 활성화
    function markActive() {
      const h = container.clientHeight;
      const i = Math.max(
        0,
        Math.min(sections.length - 1, Math.round(container.scrollTop / h))
      );
      videos.forEach((v, k) =>
        k === i ? v.play().catch(() => {}) : v.pause()
      );
    }
    container.addEventListener("scroll", markActive, { passive: true });

    // easing 함수
    const easeInOutCubic = (x) =>
      x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;

    // 스크롤 애니메이션
    function animateScroll(to, ms = SCROLL_MS) {
      const start = container.scrollTop;
      const diff = to - start;
      if (diff === 0) return;

      isScrollingRef.current = true;
      const t0 = performance.now();

      // 🔸 줌 효과 시작
      root.classList.remove("zooming");
      // 리플로우로 재시작 보장
      // eslint-disable-next-line no-unused-expressions
      root.offsetHeight;
      root.classList.add("zooming");

      function step(t) {
        const p = Math.min(1, (t - t0) / ms);
        container.scrollTop = start + diff * easeInOutCubic(p);
        if (p < 1) requestAnimationFrame(step);
        else setTimeout(() => (isScrollingRef.current = false), 80);
      }
      requestAnimationFrame(step);

      // 일정 시간 후 줌 클래스 제거
      setTimeout(() => root.classList.remove("zooming"), ZOOM_MS + 100);
    }

    const indexFromScroll = () => {
      const h = container.clientHeight;
      return Math.max(
        0,
        Math.min(sections.length - 1, Math.round(container.scrollTop / h))
      );
    };

    function scrollToIndex(i) {
      const h = container.clientHeight;
      animateScroll(i * h);
    }

    // 휠 이벤트
    function onWheel(e) {
      if (isScrollingRef.current) {
        e.preventDefault();
        return;
      }
      e.preventDefault();
      const cur = indexFromScroll();
      if (e.deltaY > 10 && cur < sections.length - 1) scrollToIndex(cur + 1);
      else if (e.deltaY < -10 && cur > 0) scrollToIndex(cur - 1);
    }
    container.addEventListener("wheel", onWheel, { passive: false });

    // 크기 보정
    const resize = () => {
      sections.forEach((s) => (s.style.minHeight = `${window.innerHeight}px`));
      markActive();
    };
    resize();
    window.addEventListener("resize", resize);

    return () => {
      container.removeEventListener("wheel", onWheel);
      container.removeEventListener("scroll", markActive);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <div className="getstarted3-root" ref={rootRef}>
      <main className="snap" ref={containerRef}>
        <section className="panel" id="s1">
          <video className="fullvideo" src={n1} autoPlay muted playsInline loop preload="auto" />
        </section>
        <section className="panel" id="s2">
          <video
            className="fullvideo"
            src={n2}
            autoPlay
            muted
            playsInline
            preload="auto"
            onEnded={(e) => {
              setTimeout(() => {
                try {
                  e.currentTarget.currentTime = 0;
                  e.currentTarget.play();
                } catch {}
              }, 3000);
            }}
          />
        </section>
        <section className="panel" id="s3" ref={s3Ref}>
        </section>
      </main>

      <style>{`
        *,*::before,*::after{ box-sizing:border-box; }
        html,body{ height:100%; margin:0; }
        .getstarted3-root{ background:#000; }

        .snap{
          height:100vh;
          overflow-y:auto;
          scroll-snap-type:y mandatory;
          overscroll-behavior-y:contain;
          background:#000;
        }
        .panel{
          position:relative;
          min-height:100vh;
          scroll-snap-align:start;
          overflow:hidden;
          background:#000;
          display:grid; place-items:center;
        }
        .fullvideo{
          position:absolute; inset:0;
          width:100%; height:100%;
          object-fit:cover;
          background:#000;
          transition: transform ${ZOOM_MS}ms ease;
        }
        /* 🔸 전환 시 살짝 확대 → 원래 크기로 */
        .getstarted3-root.zooming .fullvideo{
          transform: scale(${ZOOM_SCALE});
        }
      `}</style>
    </div>
  );
}
