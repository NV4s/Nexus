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
