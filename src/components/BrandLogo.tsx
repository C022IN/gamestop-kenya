import Image from 'next/image';
import { cn } from '@/lib/utils';

type BrandLogoSize = 'sm' | 'md' | 'lg';

interface BrandLogoProps {
  className?: string;
  logoClassName?: string;
  size?: BrandLogoSize;
}

const sizeClasses: Record<BrandLogoSize, string> = {
  sm: 'h-6 sm:h-7',
  md: 'h-7 sm:h-8',
  lg: 'h-8 sm:h-10',
};

export default function BrandLogo({
  className,
  logoClassName,
  size = 'md',
}: BrandLogoProps) {
  return (
    <span className={cn('inline-flex items-center', className)}>
      <Image
        src="/brand/gamestop-kenya-logo.svg"
        alt="GameStop Kenya"
        width={560}
        height={120}
        className={cn('block w-auto max-w-none', sizeClasses[size], logoClassName)}
      />
    </span>
  );
}
