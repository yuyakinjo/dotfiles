import { KeyValue, type CmdProps } from 'decopin-cli';

export default function Command({ data }: CmdProps<'profile'>) {
  return <KeyValue data={{ profile: data.profile, device: data.name ?? '(unnamed)', file: data.file }} />;
}
