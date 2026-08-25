import { useEffect, useState } from 'react';
import { Check, Lock } from 'lucide-react';
import {
  achievementsFor,
  markPlayed,
  readProgress,
  toggleManual,
  trackPlay,
} from '../lib/achievements';

const minutes = (seconds: number) =>
  seconds < 60 ? 'under a minute' : `${Math.round(seconds / 60)} min`;

export default function GameAchievements({ slug }: { slug: string }) {
  const list = achievementsFor(slug);
  const [unlocked, setUnlocked] = useState<Set<string>>(() => new Set());

  useEffect(() => {
    // Opening the game is itself the first objective, so land it immediately
    // rather than making the player leave to see anything happen.
    setUnlocked(new Set(markPlayed(slug)));
    return trackPlay(slug);
  }, [slug]);

  const progress = readProgress(slug);
  const done = list.filter((achievement) => unlocked.has(achievement.id)).length;

  return (
    <div className="panel achievements">
      <h3>
        Achievements <span className="card-chip">{done}/{list.length}</span>
      </h3>
      <p>
        Flash games cannot report their own progress, so the ticks are yours to keep. Time played
        and sessions are counted automatically — {minutes(progress.seconds)} so far.
      </p>

      <ul className="achievement-list">
        {list.map((achievement) => {
          const isDone = unlocked.has(achievement.id);
          const isAuto = !!achievement.auto;
          return (
            <li key={achievement.id} className={isDone ? 'is-done' : ''}>
              <button
                type="button"
                className="achievement"
                disabled={isAuto}
                aria-pressed={isDone}
                title={isAuto ? 'Unlocks on its own' : isDone ? 'Mark as not done' : 'Mark as done'}
                onClick={() => setUnlocked(new Set(toggleManual(slug, achievement.id)))}
              >
                <span className="achievement-mark">
                  {isDone ? <Check size={14} /> : isAuto ? <Lock size={14} /> : null}
                </span>
                <span>
                  <strong>{achievement.name}</strong>
                  <em>{achievement.hint}</em>
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
