import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';


export default function Scroller({
  children,
  loop = false,

  speed = 0,
  className = '',
  label,
}: {
  children: ReactNode;
  loop?: boolean;
  speed?: number;
  className?: string;
  label?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [held, setHeld] = useState(false);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(false);



  const paused = useRef(0);
  const drag = useRef<{ x: number; from: number; moved: number; captured: boolean } | null>(null);

  const draggedAt = useRef(0);

  const wrap = useCallback(
    (el: HTMLElement) => {
      if (!loop) return;
      const half = el.scrollWidth / 2;
      if (half < 1) return;
      if (el.scrollLeft >= half) el.scrollLeft -= half;
      else if (el.scrollLeft <= 0) el.scrollLeft += half;
    },
    [loop],
  );


  const readEdges = useCallback(() => {
    const el = ref.current;
    if (!el || loop) return;
    setAtStart(el.scrollLeft <= 1);
    setAtEnd(el.scrollLeft + el.clientWidth >= el.scrollWidth - 1);
  }, [loop]);

  useEffect(() => {
    const el = ref.current;
    if (!el || !speed) return;


    const still =
      document.documentElement.dataset.motion === 'reduced' ||
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (still) return;

    let frame = 0;
    let last = performance.now();
    const step = (now: number) => {
      const dt = Math.min(now - last, 100) / 1000;
      last = now;
      if (!held && now > paused.current && !drag.current) {
        el.scrollLeft += speed * dt;
        wrap(el);
      }
      frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [speed, held, wrap]);

  useEffect(readEdges, [readEdges, children]);

  const nudge = (direction: 1 | -1) => {
    const el = ref.current;
    if (!el) return;
    paused.current = performance.now() + 2000;
    el.scrollBy({ left: direction * el.clientWidth * 0.8, behavior: 'smooth' });
  };

  return (
    <div className={`scroller ${className}`}>
      <button
        type="button"
        className="scroller-arrow is-prev"
        aria-label={`Scroll ${label ?? 'left'} backwards`}
        hidden={!loop && atStart}
        onClick={() => nudge(-1)}
      >
        <ChevronLeft size={18} />
      </button>

      <div
        ref={ref}
        className="scroller-track"
        onMouseEnter={() => setHeld(true)}
        onMouseLeave={() => {
          setHeld(false);



          if (drag.current && !drag.current.captured) drag.current = null;
        }}
        onFocusCapture={() => setHeld(true)}
        onBlurCapture={() => setHeld(false)}
        onScroll={(event) => {
          wrap(event.currentTarget);
          readEdges();
        }}
        onWheel={() => {
          paused.current = performance.now() + 2000;
        }}
        onPointerDown={(event) => {

          if (event.pointerType === 'touch') return;
          drag.current = {
            x: event.clientX,
            from: event.currentTarget.scrollLeft,
            moved: 0,
            captured: false,
          };
        }}
        onPointerMove={(event) => {
          const state = drag.current;
          if (!state) return;
          const dx = event.clientX - state.x;
          state.moved = Math.max(state.moved, Math.abs(dx));





          if (!state.captured && state.moved > 5) {
            state.captured = true;
            event.currentTarget.setPointerCapture(event.pointerId);
          }
          event.currentTarget.scrollLeft = state.from - dx;
        }}
        onPointerUp={(event) => {
          const state = drag.current;
          drag.current = null;
          paused.current = performance.now() + 2000;
          if (!state) return;
          if (state.captured) event.currentTarget.releasePointerCapture(event.pointerId);




          if (state.moved > 5) draggedAt.current = performance.now();
        }}
        onClickCapture={(event) => {
          if (performance.now() - draggedAt.current > 300) return;
          event.stopPropagation();
          event.preventDefault();
        }}
        onPointerCancel={() => {
          drag.current = null;
        }}
      >
        {children}
      </div>

      <button
        type="button"
        className="scroller-arrow is-next"
        aria-label={`Scroll ${label ?? 'right'} forwards`}
        hidden={!loop && atEnd}
        onClick={() => nudge(1)}
      >
        <ChevronRight size={18} />
      </button>
    </div>
  );
}
