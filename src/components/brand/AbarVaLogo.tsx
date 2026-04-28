import Image from 'next/image';

export function AbarVaLogo({ width = 120, height = 32 }: { width?: number; height?: number }) {
  return (
    <Image
      src="/brand/abarva-logo.svg"
      alt="AbarVa"
      width={width}
      height={height}
      priority
    />
  );
}
