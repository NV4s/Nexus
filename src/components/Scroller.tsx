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
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(false);

  const held = useRef(false);
  const paused = useRef(0);
  const drag = useRef<{ x: number; from: number; moved: number; captured: boolean } | null>(null);

  const draggedAt = useRef(0);

  const pause = (ms = 2000) => {
    paused.current = Math.max(paused.current, performance.now() + ms);
  };

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

    let position = el.scrollLeft;
    let frame = 0;
    let last = performance.now();
    const step = (now: number) => {
      const dt = Math.min(now - last, 100) / 1000;
      last = now;
      if (Math.abs(el.scrollLeft - position) > 1.5) position = el.scrollLeft;
      if (!held.current && now > paused.current && !drag.current) {
        position += speed * dt;
        const half = el.scrollWidth / 2;
        if (loop && half >= 1 && position >= half) position -= half;
        el.scrollLeft = position;
      }
      frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [speed, loop]);

  useEffect(() => {
    readEdges();
    window.addEventListener('resize', readEdges);
    return () => window.removeEventListener('resize', readEdges);
  }, [readEdges, children]);

  const nudge = (direction: 1 | -1) => {
    const el = ref.current;
    if (!el) return;
    pause();
    el.scrollBy({ left: direction * el.clientWidth * 0.8, behavior: 'smooth' });
  };

  const edges = loop ? '' : `${atStart ? ' is-at-start' : ''}${atEnd ? ' is-at-end' : ''}`;

  return (
    <div className={`scroller ${className}${edges}`}>
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
        onPointerEnter={(event) => {
          if (event.pointerType === 'mouse') held.current = true;
        }}
        onPointerLeave={(event) => {
          if (event.pointerType === 'mouse') held.current = false;
          if (drag.current && !drag.current.captured) drag.current = null;
        }}
        onFocusCapture={(event) => {
          if ((event.target as Element).matches(':focus-visible')) held.current = true;
        }}
        onBlurCapture={() => {
          held.current = false;
        }}
        onScroll={(event) => {
          wrap(event.currentTarget);
          readEdges();
        }}
        onWheel={() => pause()}
        onTouchStart={() => pause(3000)}
        onTouchMove={() => pause(3000)}
        onTouchEnd={() => pause(3000)}
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
          pause();
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
