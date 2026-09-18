import { CONSOLES } from '../data/consoles';
import { navigate } from '../lib/router';

export default function Consoles() {
  return (
    <section className="section">
      <header className="section-head">
        <div>
          <h2>Systems</h2>
          <p>
            Systems that run in the tab. You supply the file — it is read on this device and
            never uploaded, and nothing is hosted here.
          </p>
        </div>
      </header>

      <div className="panels console-grid">
        {CONSOLES.map((console_) => (
          <button
            className="panel achievement-row"
            key={console_.id}
            onClick={() => navigate(`/emulator/${console_.id}`)}
          >
            <h3>{console_.title}</h3>
            <p>{console_.note}</p>
            <p className="visually-hidden">Open {console_.title}</p>
          </button>
        ))}
      </div>

      <div className="panels">
        <div className="panel">
          <h3>Not on this list</h3>
          <p>
            PS5 has nothing that runs anywhere. PS4 and PS Vita have only early desktop
            projects, and the 3DS is desktop-only too — all four need hardware access and far
            more memory than a browser tab is given, so a page for them would just fail.
          </p>
          <p>
            Sega CD and Saturn need their own BIOS, which is not included here for the same
            reason no files are.
          </p>
        </div>
      </div>
    </section>
  );
}
