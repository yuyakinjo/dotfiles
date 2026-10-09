import { afterEach, beforeEach, describe, expect, test } from 'bun:test';
import { chmod, mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';

const wrapper = join(import.meta.dir, 'brew.zsh');
let directory: string;
let bin: string;
let source: string;
let root: string;
let log: string;

// 実際の brew / zb / chezmoi を絶対に呼ばない。失敗時には部分的な dump も再現する。
const manager = `#!/bin/sh
tool=\${0##*/}
printf '%s' "$tool" >> "$TEST_LOG"
printf '\\t%s' "$@" >> "$TEST_LOG"
printf '\\n' >> "$TEST_LOG"
if [ "$1" = bundle ] && [ "$2" = dump ]; then
  file=
  for arg in "$@"; do
    case "$arg" in --file=*) file=\${arg#--file=} ;; esac
  done
  if [ "$tool" = brew ]; then
    printf 'tap "example/tap"\\nbrew "homebrew-only"\\ncask "homebrew-app"\\n' > "$file"
    exit "\${BREW_DUMP_EXIT:-0}"
  fi
  printf 'brew "zerobrew-only"\\n' > "$file"
  exit "\${ZB_DUMP_EXIT:-0}"
fi
if [ "$tool" = brew ]; then exit "\${BREW_EXIT:-0}"; fi
exit "\${ZB_EXIT:-0}"
`;

beforeEach(async () => {
  directory = await mkdtemp(join(tmpdir(), 'my-brew-'));
  bin = join(directory, 'bin');
  source = join(directory, 'source with spaces');
  root = join(directory, 'zerobrew root');
  log = join(directory, 'commands.log');
  await Promise.all([mkdir(bin), mkdir(source), mkdir(join(root, 'db'), { recursive: true })]);
  await Promise.all([
    writeFile(log, ''),
    writeFile(join(source, 'Brewfile'), '# original Homebrew backup\n'),
    writeFile(join(source, 'Brewfile.zerobrew'), '# original zerobrew backup\n'),
    writeFile(join(root, 'db/zb.sqlite3'), ''),
  ]);
  for (const tool of ['brew', 'zb']) {
    await writeFile(join(bin, tool), manager);
    await chmod(join(bin, tool), 0o755);
  }
  await writeFile(join(bin, 'chezmoi'), '#!/bin/sh\nprintf "%s\\n" "$TEST_SOURCE"\n');
  await chmod(join(bin, 'chezmoi'), 0o755);
});

afterEach(async () => {
  await rm(directory, { recursive: true, force: true });
});

function run(args: string[], environment: Record<string, string> = {}) {
  return spawnSync('/bin/zsh', ['-f', '-c', 'source "$TEST_WRAPPER"; brew "$@"', 'test', ...args], {
    cwd: directory,
    encoding: 'utf8',
    env: {
      PATH: `${bin}:/usr/bin:/bin`,
      HOME: directory,
      TEST_WRAPPER: wrapper,
      TEST_LOG: log,
      TEST_SOURCE: source,
      ZEROBREW_ROOT: root,
      ...environment,
    },
  });
}

async function commands() {
  return (await readFile(log, 'utf8')).trim().split('\n').map((line) => line.split('\t'));
}

describe('brew routing', () => {
  for (const args of [
    ['install', 'jq'], ['uninstall', 'jq'], ['remove', 'jq'], ['rm', 'jq'],
    ['list'], ['ls'], ['info', 'jq'], ['doctor'], ['gc'], ['reset', '--yes'],
    ['init', '--no-modify-path'], ['completion', 'zsh'], ['update'], ['outdated'],
    ['outdated', '--json'], ['upgrade', 'jq'], ['migrate', '--yes'], ['help'],
    ['help', 'install'], ['run', 'jq', '--version'], ['install', '-s', 'jq'],
  ]) {
    test(`zb: ${args.join(' ')}`, async () => {
      expect(run(args).status).toBe(0);
      const canonical = ['remove', 'rm'].includes(args[0]!) ? 'uninstall' : args[0] === 'ls' ? 'list' : args[0];
      expect((await commands())[0]).toEqual(['zb', canonical!, ...args.slice(1)]);
    });
  }

  for (const args of [
    [], ['--prefix'], ['services', 'list'], ['tap', 'example/tap'], ['reinstall', 'jq'],
    ['bundle', 'check'], ['bundle', 'cleanup'], ['bundle', 'help', 'check'],
    ['list', '--versions'], ['list', 'jq'], ['info'], ['info', 'jq', 'wget'],
    ['info', '--json=v2', 'jq'], ['install', '--cask', 'firefox'], ['uninstall', '--force', 'jq'],
    ['bundle', 'install', '--no-upgrade'], ['bundle', 'install', '--file'], ['help', 'services'],
  ]) {
    test(`Homebrew: ${args.join(' ') || '(no args)'}`, async () => {
      expect(run(args).status).toBe(0);
      expect((await commands())[0]).toEqual(['brew', ...args]);
    });
  }

  test('explicit Homebrew also keeps automatic backup', async () => {
    expect(run(['--homebrew', 'install', 'jq']).status).toBe(0);
    expect((await commands())[0]).toEqual(['brew', 'install', 'jq']);
    expect((await commands()).map((args) => args.slice(0, 3))).toEqual([
      ['brew', 'install', 'jq'], ['brew', 'bundle', 'dump'], ['zb', 'bundle', 'dump'],
    ]);
  });

  test('without zb, all commands go to Homebrew', async () => {
    await rm(join(bin, 'zb'));
    expect(run(['install', 'jq']).status).toBe(0);
    expect((await commands()).map((args) => args[0])).toEqual(['brew', 'brew']);
    expect(await readFile(join(source, 'Brewfile.zerobrew'), 'utf8')).toBe('# original zerobrew backup\n');
  });

  for (const args of [[], ['install'], ['dump'], ['--no-link']]) {
    test(`bundle defaults to the zerobrew manifest: ${args.join(' ')}`, async () => {
      expect(run(['bundle', ...args]).status).toBe(0);
      const operation = args[0] === 'dump' ? 'dump' : 'install';
      const options = args[0] === '--no-link' ? args : [];
      expect((await commands())[0]).toEqual(['zb', 'bundle', operation, ...options, '--file=Brewfile.zerobrew']);
    });
  }

  test('an explicit bundle file is preserved', async () => {
    expect(run(['bundle', '--file', 'custom file']).status).toBe(0);
    expect((await commands())[0]).toEqual(['zb', 'bundle', 'install', '--file', 'custom file']);
  });

  test('attached short bundle file is preserved', async () => {
    expect(run(['bundle', 'install', '-fcustom']).status).toBe(0);
    expect((await commands())[0]).toEqual(['zb', 'bundle', 'install', '-fcustom']);
  });
});

describe('independent package backups', () => {
  test('both managers retain their own packages and Homebrew metadata', async () => {
    expect(run(['install', 'jq']).status).toBe(0);
    expect(await readFile(join(source, 'Brewfile'), 'utf8')).toBe('tap "example/tap"\nbrew "homebrew-only"\ncask "homebrew-app"\n');
    expect(await readFile(join(source, 'Brewfile.zerobrew'), 'utf8')).toBe('brew "zerobrew-only"\n');
  });

  test('a failed package operation keeps its exit code and never retries or dumps', async () => {
    expect(run(['install', 'jq'], { ZB_EXIT: '7' }).status).toBe(7);
    expect(await commands()).toEqual([['zb', 'install', 'jq']]);
    expect(await readFile(join(source, 'Brewfile'), 'utf8')).toBe('# original Homebrew backup\n');
  });

  test('a failed Homebrew operation keeps its exit code', async () => {
    expect(run(['reinstall', 'jq'], { BREW_EXIT: '9' }).status).toBe(9);
    expect(await commands()).toEqual([['brew', 'reinstall', 'jq']]);
  });

  for (const tool of ['BREW', 'ZB']) {
    test(`a partial ${tool} dump never overwrites the previous backup`, async () => {
      const result = run(['install', 'jq'], { [`${tool}_DUMP_EXIT`]: '3' });
      expect(result.status).toBe(0);
      expect(result.stderr).toContain('以前の内容を保持');
      const file = tool === 'BREW' ? 'Brewfile' : 'Brewfile.zerobrew';
      const owner = tool === 'BREW' ? 'Homebrew' : 'zerobrew';
      expect(await readFile(join(source, file), 'utf8')).toBe(`# original ${owner} backup\n`);
    });
  }

  test('an uninitialized zb does not erase its repository backup', async () => {
    await rm(root, { recursive: true });
    expect(run(['--homebrew', 'install', 'jq']).status).toBe(0);
    expect((await commands()).map((args) => args[0])).toEqual(['brew', 'brew']);
    expect(await readFile(join(source, 'Brewfile.zerobrew'), 'utf8')).toBe('# original zerobrew backup\n');
  });

  test('a successful reset saves an empty zerobrew manifest without reopening the DB', async () => {
    await rm(root, { recursive: true });
    expect(run(['reset', '--yes']).status).toBe(0);
    expect(await readFile(join(source, 'Brewfile.zerobrew'), 'utf8')).toBe('');
    expect((await commands()).map((args) => args.slice(0, 3))).toEqual([
      ['zb', 'reset', '--yes'], ['brew', 'bundle', 'dump'],
    ]);
  });

  test('without chezmoi, the package operation still succeeds', async () => {
    await rm(join(bin, 'chezmoi'));
    expect(run(['install', 'jq']).status).toBe(0);
    expect(await commands()).toEqual([['zb', 'install', 'jq']]);
  });

  test('a missing Homebrew manifest is not implicitly created', async () => {
    await rm(join(source, 'Brewfile'));
    expect(run(['install', 'jq']).status).toBe(0);
    expect(await commands()).toEqual([['zb', 'install', 'jq']]);
  });

  for (const args of [['install', '--help'], ['install', '--dry-run', 'jq'], ['list'], ['bundle', 'help']]) {
    test(`read-only invocations do not update backups: ${args.join(' ')}`, async () => {
      expect(run(args).status).toBe(0);
      expect((await commands()).length).toBe(1);
      expect(await readFile(join(source, 'Brewfile'), 'utf8')).toBe('# original Homebrew backup\n');
    });
  }
});