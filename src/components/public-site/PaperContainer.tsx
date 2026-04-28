import type { CSSProperties, ReactNode } from 'react';

interface PaperContainerProps {
  children?: ReactNode;
  className?: string;
  style?: CSSProperties;
  as?: 'div' | 'section' | 'article' | 'main';
  narrow?: boolean;
}

export function PaperContainer({
  children,
  className,
  style,
  as: Tag = 'div',
  narrow = false,
}: PaperContainerProps) {
  return (
    <Tag
      className={className}
      style={{
        maxWidth: narrow ? '760px' : '1200px',
        marginLeft: 'auto',
        marginRight: 'auto',
        paddingLeft: '32px',
        paddingRight: '32px',
        ...style,
      }}
    >
      {children}
    </Tag>
  );
}
