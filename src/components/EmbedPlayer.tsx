import { useEffect, useState } from 'react';
import { ExternalLink } from 'lucide-react';


export default function EmbedPlayer({ url, title }: { url: string; title: string }) {
  const [slow, setSlow] = useState(false);


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
