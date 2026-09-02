import { Argv, Option } from 'decopin-cli';

export default function DefineArgv() {
  return (
    <Argv description="Delete developer caches (Homebrew, uv, npm, bun, pnpm) to get disk back. --dry-run only shows sizes.">
      <Option name="aerials" type="boolean" default={false} description="also drop the macOS aerial wallpaper videos" />
    </Argv>
  );
}
