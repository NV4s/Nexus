import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { ExternalLink } from 'lucide-react';

type Frame = [width: number, height: number];

function useFit(frame: Frame | undefined) {
  const stage = useRef<HTMLDivElement>(null);
  const [fit, setFit] = useState({ scale: 1, x: 0, y: 0 });

  useEffect(() => {
    if (!frame) return;
    const [width, height] = frame;
    const measure = () => {
      const el = stage.current;
      if (!el) return;
      const box = el.getBoundingClientRect();
      const scale = Math.min(box.width / width, box.height / height);
      setFit({ scale, x: (box.width - width * scale) / 2, y: (box.height - height * scale) / 2 });
    };
    measure();
    window.addEventListener('resize', measure);
    document.addEventListener('fullscreenchange', measure);
    return () => {
      window.removeEventListener('resize', measure);
      document.removeEventListener('fullscreenchange', measure);
    };
  }, [frame]);

  return { stage, fit };
}

export default function EmbedPlayer({
  url,
  title,
  frame,
}: {
  url: string;
  title: string;
  frame?: Frame;
}) {
  const [slow, setSlow] = useState(false);
  const { stage, fit } = useFit(frame);

  useEffect(() => {
    setSlow(false);
    const timer = window.setTimeout(() => setSlow(true), 4000);
    return () => window.clearTimeout(timer);
  }, [url]);

  const stageStyle: CSSProperties | undefined = frame
    ? { aspectRatio: `${frame[0]} / ${frame[1]}`, overflow: 'hidden' }
    : undefined;

  const surfaceStyle: CSSProperties | undefined = frame
    ? {
        position: 'absolute',
        left: 0,
        top: 0,
        width: frame[0],
        height: frame[1],
        transform: `translate(${fit.x}px, ${fit.y}px) scale(${fit.scale})`,
        transformOrigin: '0 0',
      }
    : undefined;

  return (
    <div className="stage" ref={stage} style={stageStyle}>
      <iframe
        className="stage-surface"
        style={surfaceStyle}
        src={url}
        title={title}
        allow="fullscreen; autoplay; gamepad; clipboard-write"
        referrerPolicy="no-referrer"
      />

      {slow && (
        <div className="embed-escape">
          <span>Blank or stuck? Some sites refuse to load inside another page.</span>
          <button
            className="button ghost"
            onClick={() => window.open(url, '_blank', 'noopener')}
          >
            <ExternalLink size={14} /> Open in a tab
          </button>
        </div>
      )}
    </div>
  );
}
