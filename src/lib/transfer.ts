import { exportAchievements, importAchievements, type MergeResult } from './achievements';
import { exportSaves, importSaves } from './saves';



export type BackupKind = 'backup' | 'achievements' | 'saves' | 'unknown';

export type ImportSummary = {
  kind: BackupKind;
  saves: number;
  achievements: MergeResult | null;
};


export function exportEverything(): string {
  return JSON.stringify(
    {
      format: 'nexus-backup/1',
      exported: Date.now(),


      saves: JSON.parse(exportSaves()) as unknown,
      achievements: JSON.parse(exportAchievements()) as unknown,
    },
    null,
    2,
  );
}

type Shape = {
  format?: unknown;
  saves?: unknown;
  achievements?: unknown;
  saved?: unknown;
  unlocked?: unknown;
  playtime?: unknown;
};


export function identify(parsed: unknown): BackupKind {
  if (!parsed || typeof parsed !== 'object') return 'unknown';
  const body = parsed as Shape;
  if (typeof body.format === 'string' && body.format.startsWith('nexus-backup/')) return 'backup';
  if (body.saves && body.achievements) return 'backup';
  if (body.saved) return 'saves';
  if (body.unlocked || body.playtime) return 'achievements';
  return 'unknown';
}


export function importAnything(json: string): ImportSummary {
  const parsed: unknown = JSON.parse(json);
  const kind = identify(parsed);
  const body = parsed as Shape;

  if (kind === 'backup') {
    const saves = body.saves ? importSaves(JSON.stringify(body.saves)) : 0;
    const achievements = body.achievements
      ? importAchievements(JSON.stringify(body.achievements))
      : null;
    return { kind, saves, achievements };
  }

  if (kind === 'saves') return { kind, saves: importSaves(json), achievements: null };
  if (kind === 'achievements') return { kind, saves: 0, achievements: importAchievements(json) };

  throw new Error('That is not a Nexus backup file.');
}


export function describe(summary: ImportSummary): string {
  const parts: string[] = [];
  if (summary.achievements) {
    const { games, unlocked } = summary.achievements;
    parts.push(
      `${unlocked} new ${unlocked === 1 ? 'achievement' : 'achievements'} across ${games} ${
        games === 1 ? 'game' : 'games'
      }`,
    );
  }
  if (summary.saves) parts.push(`${summary.saves} save ${summary.saves === 1 ? 'file' : 'files'}`);
  if (!parts.length) return 'Nothing new in that file — this device was already up to date.';
  return `Imported ${parts.join(' and ')}. Reopen a game to load its save.`;
}
