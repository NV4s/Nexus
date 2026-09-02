import { useState } from 'react';
import GameGrid from './GameGrid';

type Tab = 'tools' | 'courses';
type Track = 'school' | 'extra';

/**
 * Study is two different things sharing a tab: the calculators and reference
 * tools you reach for mid-homework, and courses you sit down with. Splitting
 * them keeps a search for "Desmos" from returning a forty-hour curriculum.
 *
 * The tabs are state rather than routes, so the URL stays /study and the back
 * button still means "leave Study" rather than "go up one tab".
 */
export default function Study() {
  const [tab, setTab] = useState<Tab>('tools');
  const [track, setTrack] = useState<Track>('school');

  return (
    <>
      <div className="section subnav-wrap">
        <div className="subnav" role="tablist" aria-label="Study">
          <button
            role="tab"
            aria-selected={tab === 'tools'}
            className={`subnav-tab ${tab === 'tools' ? 'is-active' : ''}`}
            onClick={() => setTab('tools')}
          >
            Tools
          </button>
          <button
            role="tab"
            aria-selected={tab === 'courses'}
            className={`subnav-tab ${tab === 'courses' ? 'is-active' : ''}`}
            onClick={() => setTab('courses')}
          >
            Courses
          </button>
        </div>

        {tab === 'courses' && (
          <div className="subnav is-nested" role="tablist" aria-label="Courses">
            {([
              ['school', 'School/Tests'],
              ['extra', 'Extra'],
            ] as const).map(([id, label]) => (
              <button
                key={id}
                role="tab"
                aria-selected={track === id}
                className={`subnav-tab ${track === id ? 'is-active' : ''}`}
                onClick={() => setTrack(id)}
              >
                {label}
              </button>
            ))}
          </div>
        )}
      </div>

      {tab === 'tools' ? (
        <GameGrid section="study" title="Study" lede="Calculators, reference and note tools." />
      ) : (
        <GameGrid
          key={track}
          section="courses"
          track={track}
          title="Courses"
          lede={
            track === 'school'
              ? 'Exam prep, certifications and university material. All free to study.'
              : 'Programming, languages and everything else worth learning for nothing.'
          }
        />
      )}
    </>
  );
}
