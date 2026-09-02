/**
 * profile: このマシンがどの顔か (VSCode の settings sync の profile と同じ発想)。
 * 分岐はテンプレート言語ではなく、ただの TS (spread)。
 */
import { homedir } from 'node:os';
import { join } from 'node:path';

export const PROFILES = ['personal', 'work', 'server'] as const;
export type Profile = (typeof PROFILES)[number];

/** リポジトリの外に置く、このデバイスだけの情報 */
export interface Device {
  profile: Profile;
  /** 表示名など、任意 */
  name?: string;
}

export const DEVICE_FILE = join(homedir(), '.config', 'my', 'device.json');

export async function readDevice(): Promise<Device> {
  const file = Bun.file(DEVICE_FILE);
  if (!(await file.exists())) return { profile: 'personal' };
  const json = (await file.json()) as Partial<Device>;
  const profile = (PROFILES as readonly string[]).includes(json.profile ?? '')
    ? (json.profile as Profile)
    : 'personal';
  return { ...json, profile };
}
