/**
 * No `sandbox` attribute on purpose: pointer lock, which mouse-aimed games need,
 * is gated by the sandbox `allow-pointer-lock` token rather than by an `allow`
 * feature, and is permitted by default while the frame is unsandboxed.
 */
export default function EmbedPlayer({ url, title }: { url: string; title: string }) {
  return (
    <div className="stage">
      <iframe
        className="stage-surface"
        src={url}
        title={title}
        allow="fullscreen; autoplay; gamepad; clipboard-write"
        referrerPolicy="no-referrer"
      />
    </div>
  );
}
