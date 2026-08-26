import { useEffect, useState } from 'react';
import { ExternalLink } from 'lucide-react';

/**
 * No `sandbox` attribute on purpose: pointer lock, which mouse-aimed games need,
 * is gated by the sandbox `allow-pointer-lock` token rather than by an `allow`
 * feature, and is permitted by default while the frame is unsandboxed.
 */
export default function EmbedPlayer({ url, title }: { url: string; title: string }) {
  const [slow, setSlow] = useState(false);

  /**
   * A site that refuses framing cannot be detected from here — the frame is
   * cross-origin, and X-Frame-Options produces a load event like any other. So
   * rather than guessing which sites block, offer the way out to anyone still
   * looking at nothing after a few seconds. That covers sites whose headers say
   * one thing and whose edge does another, which is how Khan Academy behaved.
   */
  useEffect(() => {
    setSlow(false);
    const timer = window.setTimeout(() => setSlow(true), 4000);
    return () => window.clearTimeout(timer);
  }, [url]);

  return (
    <div className="stage">
      <iframe
        className="stage-surface"
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
