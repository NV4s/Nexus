/*
 * ===========================================================================
 *  WAD SLOTS — the only file you edit to put a Doom WAD on the site
 * ===========================================================================
 *
 * Two slots are set up below, called "1" and "2". Each one already has:
 *   - a player page at  #/emulator/wad1  and  #/emulator/wad2
 *   - a card in the Library that opens it, at  #/game/wad-1  and  #/game/wad-2
 *
 * Both are live right now and both say "no file set yet". The only thing
 * missing is the link. Nothing else needs touching.
 *
 * ---------------------------------------------------------------------------
 *  HOW TO FILL A SLOT (the short version)
 * ---------------------------------------------------------------------------
 *
 * 1. Open the WAD's page on GitHub in a browser and click the .wad file
 *    itself, so you are looking at that one file and not the repository's
 *    front page.
 * 2. Copy the address out of the address bar.
 * 3. Paste it between the quotes after `link:` in slot 1 below.
 * 4. Change `title:` from '1' to the name you want people to see.
 * 5. Save the file. That is it — the player picks the file up on its own.
 *
 * ---------------------------------------------------------------------------
 *  THE FOUR KINDS OF LINK THAT WORK
 * ---------------------------------------------------------------------------
 *
 * A. The file's page in a repository (the normal one, what step 1 gives you):
 *      https://github.com/freedoom/freedoom/blob/master/wads/freedoom1.wad
 *    Put it in `link:` and leave `file:` alone.
 *
 * B. A "raw" link, if you clicked the Raw button first:
 *      https://raw.githubusercontent.com/freedoom/freedoom/master/wads/freedoom1.wad
 *    Same thing — put it in `link:`.
 *
 * C. A release download, from a repository's Releases page. Right-click the
 *    .wad (or .zip) under Assets and copy the link address:
 *      https://github.com/freedoom/freedoom/releases/download/v0.13.0/freedoom-0.13.0.zip
 *    Same thing — put it in `link:`.
 *
 * D. Just the repository's front page, with the file named separately:
 *      link: 'https://github.com/freedoom/freedoom'
 *      file: 'wads/freedoom1.wad'
 *    `file:` is the path inside the repository, exactly as GitHub shows it,
 *    with the folders included and no leading slash. Use this one only if you
 *    cannot get a link to the file itself.
 *
 * ---------------------------------------------------------------------------
 *  THINGS THAT WILL BITE
 * ---------------------------------------------------------------------------
 *
 * - A link to the repository front page with no `file:` cannot work. The site
 *   has no way to guess which of the files in there is the WAD, so the page
 *   will say so instead of loading something random.
 * - A .zip is fine as long as the WAD is inside it. The player opens the zip
 *   itself. A .7z or .rar is not.
 * - Freeware only. Keep the retail DOOM.WAD and DOOM2.WAD off the site: those
 *   are still sold, and the Systems pages exist so people can open their own
 *   copy from their own device. Freedoom, FreeDM, the shareware DOOM1.WAD and
 *   the many freely licensed megawads are all fine.
 * - Links go through this domain, so nothing in a visitor's network log says
 *   github.com. That part is automatic; see src/lib/wad.ts.
 * - GitHub serves files from a repository up to 100 MB. Anything larger has to
 *   come from a release download (kind C above).
 */

export type WadSlot = {
  /** Shows up in the url: #/emulator/wad1 and #/game/wad-1. Do not change. */
  id: string;
  /** What people see on the card and above the player. Change this. */
  title: string;
  /** The GitHub link. See the four kinds above. */
  link: string;
  /** Only for kind D: the path to the file inside the repository. */
  file?: string;
  /** One line under the title. Optional. */
  note?: string;
  /** Cover art, if you add one to public/i/. Optional. */
  thumb?: string;
};

export const WAD_SLOTS: WadSlot[] = [
  {
    id: 'wad1',
    title: 'DOOM',
    link: 'https://github.com/NV4s/swfdump/blob/main/DOOM.WAD',
    file: '',
    note: '',
  },
  {
    id: 'wad2',
    title: 'DOOM 2 - Hell on Earth',
    link: 'https://github.com/NV4s/swfdump/blob/main/DOOM2.WAD',
    file: '',
    note: '',
  },
];

export const wadSlotById = (id: string) => WAD_SLOTS.find((slot) => slot.id === id);

/** '#/game/wad-1' for slot 'wad1', so the card and the player page line up. */
export const wadGameSlug = (slot: WadSlot) => slot.id.replace(/^wad/, 'wad-');
