import { bySlug, gameUrl } from '../data/games';
import { useGameSession } from '../lib/achievements';
import RufflePlayer from './RufflePlayer';
import EmbedPlayer from './EmbedPlayer';

/**
 * The game and nothing else, filling the whole viewport — no navbar, no header,
 * no page padding. This is what the blank-tab launcher loads, so the second tab
 * is the game rather than a shrunk copy of the site.
 */
export default function GameEmbed({ slug }: { slug: string }) {
  const game = bySlug(slug);
  // Playing here counts exactly as it does on the game page.
  useGameSession(game ? slug : null);

  if (!game) return <div className="embed-stage" />;

  const url = gameUrl(game);
  return (
    <div className="embed-stage">
      {game.runtime === 'flash' ? (
        <RufflePlayer url={url} parts={game.parts} title={game.title} />
      ) : (
        <EmbedPlayer url={url} title={game.title} />
      )}
    </div>
  );
}
