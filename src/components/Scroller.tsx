import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

/**
 * A horizontal strip you can drift, drag, wheel or step through.
 *
 * The drift used to be a CSS transform, which looked right and could not be
 * touched: a transformed track has no scroll position, so the wheel did
 * nothing and there was no way to go back to a card that had gone past. This
 * moves the same motion onto `scrollLeft`, so the browser's own scrolling —
 * trackpad, touch, shift-wheel, keyboard — works for free, and the animation is
 * just something nudging the same number.
 *
 * With `loop`, the caller's children are rendered twice and the position wraps
 * at half the width, so the seam lands on an identical frame.
 */
export default function Scroller({
  children,
  loop = false,
  /** Pixels per second of drift. 0 for a strip that only moves when pushed. */
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

  // Set while a pointer is down, and briefly after any manual scroll, so the
  // drift does not fight the person using it.
  const paused = useRef(0);
  const drag = useRef<{ x: number; from: number; moved: number } | null>(null);
  /** When a drag last ended, so the click it produces can be ignored. */
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

  /** Arrow buttons only mean anything on a strip that ends. */
  const readEdges = useCallback(() => {
    const el = ref.current;
    if (!el || loop) return;
    setAtStart(el.scrollLeft <= 1);
    setAtEnd(el.scrollLeft + el.clientWidth >= el.scrollWidth - 1);
  }, [loop]);

  useEffect(() => {
    const el = ref.current;
    if (!el || !speed) return;

    // An explicit reduce-motion choice and the system one both stop the drift.
    const still =
      document.documentElement.dataset.motion === 'reduced' ||
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (still) return;

    let frame = 0;
    let last = performance.now();
    const step = (now: number) => {
      const dt = Math.min(now - last, 100) / 1000; // a backgrounded tab must not lurch
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
        onMouseLeave={() => setHeld(false)}
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
          // Touch already drags natively; hijacking it would break momentum.
          if (event.pointerType === 'touch') return;
          drag.current = { x: event.clientX, from: event.currentTarget.scrollLeft, moved: 0 };
          event.currentTarget.setPointerCapture(event.pointerId);
        }}
        onPointerMove={(event) => {
          const state = drag.current;
          if (!state) return;
          const dx = event.clientX - state.x;
          state.moved = Math.max(state.moved, Math.abs(dx));
          event.currentTarget.scrollLeft = state.from - dx;
        }}
        onPointerUp={(event) => {
          const state = drag.current;
          drag.current = null;
          paused.current = performance.now() + 2000;
          if (!state) return;
          event.currentTarget.releasePointerCapture(event.pointerId);
          // A drag that moved is not a click. Recording when it ended and
          // checking that below beats adding a one-shot window listener: the
          // listener has to be torn down if no click follows, and any timer
          // that does the tearing down races the click it was meant to catch.
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
