import { bySlug, gameFallback, gameUrl } from '../data/games';
import { useGameSession } from '../lib/achievements';
import RufflePlayer from './RufflePlayer';
import EmbedPlayer from './EmbedPlayer';


export default function GameEmbed({ slug }: { slug: string }) {
  const game = bySlug(slug);

  useGameSession(game ? slug : null);

  if (!game) return <div className="embed-stage" />;

  const url = gameUrl(game);
  const fallback = gameFallback(game);
  return (
    <div className="embed-stage">
      {game.runtime === 'flash' ? (
        <RufflePlayer url={url} fallback={fallback} title={game.title} slug={game.slug} />
      ) : (
        <EmbedPlayer url={url} title={game.title} frame={game.frame} />
      )}
    </div>
  );
}
