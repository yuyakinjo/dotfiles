import { DEVICE_FILE, readDevice } from '../_lib/profile.ts';

export default async function Data() {
  const device = await readDevice();
  return { ...device, file: DEVICE_FILE };
}
