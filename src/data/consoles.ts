/**
 * Consoles the browser can actually emulate, via EmulatorJS (RetroArch cores
 * compiled to WebAssembly).
 *
 * Not here, and not omissions:
 *
 * - **PS5** has no emulator at all, on any platform.
 * - **PS4** has only early native projects (shadPS4, fpPS4); nothing runs in a
 *   browser.
 * - **PS Vita** emulation (Vita3K) is desktop-only.
 * - **3DS** (Citra and its forks) is likewise desktop-only; the WebAssembly
 *   builds that exist are experiments, not something to put in front of people.
 *
 * Those four need native hardware access and far more memory than a browser tab
 * gets, so listing them would be four dead pages.
 */

export type ConsoleId =
  | 'nes'
  | 'snes'
  | 'n64'
  | 'gb'
  | 'gba'
  | 'nds'
  | 'psx'
  | 'segaMD'
  | 'segaMS'
  | 'segaCD'
  | 'segaSaturn'
  | 'atari2600'
  | 'arcade';

export type Console = {
  id: ConsoleId;
  title: string;
  /** EmulatorJS core name. */
  core: string;
  extensions: string[];
  note: string;
};

export const CONSOLES: Console[] = [
  {
    id: 'nes',
    title: 'NES',
    core: 'nes',
    extensions: ['nes', 'zip'],
    note: 'Nintendo Entertainment System. Runs comfortably on anything.',
  },
  {
    id: 'snes',
    title: 'SNES',
    core: 'snes',
    extensions: ['sfc', 'smc', 'zip'],
    note: 'Super Nintendo. Also fine on a low-powered laptop.',
  },
  {
    id: 'n64',
    title: 'Nintendo 64',
    core: 'n64',
    extensions: ['z64', 'n64', 'v64', 'zip'],
    note: 'Heaviest of the set. Expect a slow machine to struggle.',
  },
  {
    id: 'gb',
    title: 'Game Boy / Color',
    core: 'gb',
    extensions: ['gb', 'gbc', 'zip'],
    note: 'Game Boy and Game Boy Color.',
  },
  {
    id: 'gba',
    title: 'Game Boy Advance',
    core: 'gba',
    extensions: ['gba', 'zip'],
    note: 'Runs well almost anywhere.',
  },
  {
    id: 'nds',
    title: 'Nintendo DS',
    core: 'nds',
    extensions: ['nds', 'zip'],
    note: 'Two screens, stacked. Demanding on a Chromebook.',
  },
  {
    id: 'psx',
    title: 'PlayStation',
    core: 'psx',
    extensions: ['bin', 'cue', 'iso', 'pbp', 'chd', 'zip'],
    note: 'The original PlayStation. A .cue with its .bin, or a single .chd.',
  },
  {
    id: 'segaMD',
    title: 'Sega Genesis / Mega Drive',
    core: 'segaMD',
    extensions: ['md', 'gen', 'bin', 'smd', 'zip'],
    note: 'Genesis in North America, Mega Drive everywhere else.',
  },
  {
    id: 'segaMS',
    title: 'Sega Master System / Game Gear',
    core: 'segaMS',
    extensions: ['sms', 'gg', 'zip'],
    note: 'Master System and Game Gear.',
  },
  {
    id: 'segaCD',
    title: 'Sega CD',
    core: 'segaCD',
    extensions: ['bin', 'cue', 'chd', 'iso', 'zip'],
    note: 'Needs the matching BIOS, which is not supplied here.',
  },
  {
    id: 'segaSaturn',
    title: 'Sega Saturn',
    core: 'segaSaturn',
    extensions: ['bin', 'cue', 'chd', 'iso', 'zip'],
    note: 'Demanding, and needs a BIOS. Expect trouble on weak hardware.',
  },
  {
    id: 'atari2600',
    title: 'Atari 2600',
    core: 'atari2600',
    extensions: ['a26', 'bin', 'zip'],
    note: 'Tiny and fast.',
  },
  {
    id: 'arcade',
    title: 'Arcade',
    core: 'arcade',
    extensions: ['zip'],
    note: 'MAME-style arcade ROM sets, which must match the core’s expected version.',
  },
];

export const consoleById = (id: ConsoleId | string) =>
  CONSOLES.find((console_) => console_.id === id);
