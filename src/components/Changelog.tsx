import { RELEASES } from '../data/changelog';

export default function Changelog() {
  return (
    <section className="section">
      <header className="section-head">
        <div>
          <h2>Changelog</h2>
          <p>Newest first.</p>
        </div>
      </header>

      <ol className="releases">
        {RELEASES.map((release) => (
          <li key={release.version} className="release">
            <div className="release-head">
              <h3>{release.version}</h3>
              <time dateTime={release.date}>{release.date}</time>
            </div>
            <ul>
              {release.changes.map((change) => (
                <li key={change}>{change}</li>
              ))}
            </ul>
          </li>
        ))}
      </ol>
    </section>
  );
}
