import { CONSOLES } from '../data/consoles';
import { navigate } from '../lib/router';

export default function Consoles() {
  return (
    <section className="section">
      <header className="section-head">
        <div>
          <h2>Emulators</h2>
          <p>
            Console emulators that run in the tab. You supply the ROM — it is read on this device
            and never uploaded, and no games are hosted here.
          </p>
        </div>
      </header>

      <div className="panels">
        {CONSOLES.map((console_) => (
          <button
            className="panel achievement-row"
            key={console_.id}
            onClick={() => navigate(`/emulator/${console_.id}`)}
          >
            <h3>{console_.title}</h3>
            <p>{console_.note}</p>
            <p className="visually-hidden">Open the {console_.title} emulator</p>
          </button>
        ))}
      </div>

      <div className="panels">
        <div className="panel">
          <h3>Not on this list</h3>
          <p>
            PS5 has no emulator anywhere. PS4 and PS Vita have only early desktop projects, and
            3DS emulation is desktop-only too — all four need hardware access and far more memory
            than a browser tab is given, so a page for them would just fail.
          </p>
          <p>
            Sega CD and Saturn need their console&rsquo;s BIOS, which is not included here for the
            same reason no ROMs are.
          </p>
        </div>
      </div>
    </section>
  );
}
