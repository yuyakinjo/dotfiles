import { KeyValue, type CommandProps } from 'decopin-cli';

export default function Command({ data }: CommandProps<'profile'>) {
  return <KeyValue data={{ profile: data.profile, device: data.name ?? '(unnamed)', file: data.file }} />;
}
