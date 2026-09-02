import { computeDrift } from '../_lib/drift.ts';

export default async function Data() {
  const { profile, drifts } = await computeDrift();
  return {
    profile,
    files: drifts.map((d) => ({ path: d.path, kind: d.kind })),
    drifted: drifts.filter((d) => d.kind !== 'same').length,
  };
}
