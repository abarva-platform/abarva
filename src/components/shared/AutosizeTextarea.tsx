'use client';

import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  type TextareaHTMLAttributes,
} from 'react';

type AutosizeTextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  minRows?: number;
  maxRows?: number;
};

export const AutosizeTextarea = forwardRef<HTMLTextAreaElement, AutosizeTextareaProps>(
  function AutosizeTextarea(
    {
      minRows = 1,
      maxRows = 6,
      style,
      value,
      onChange,
      spellCheck = true,
      autoCorrect = 'on',
      autoCapitalize = 'sentences',
      ...props
    },
    forwardedRef,
  ) {
    const innerRef = useRef<HTMLTextAreaElement | null>(null);

    useImperativeHandle(forwardedRef, () => innerRef.current as HTMLTextAreaElement);

    useEffect(() => {
      const el = innerRef.current;
      if (!el) return;

      el.rows = minRows;
      el.style.height = 'auto';

      const computed = window.getComputedStyle(el);
      const lineHeight = Number.parseFloat(computed.lineHeight) || 22;
      const padding =
        Number.parseFloat(computed.paddingTop) +
        Number.parseFloat(computed.paddingBottom) +
        Number.parseFloat(computed.borderTopWidth) +
        Number.parseFloat(computed.borderBottomWidth);

      const minHeight = lineHeight * minRows + padding;
      const maxHeight = lineHeight * maxRows + padding;
      const nextHeight = Math.min(Math.max(el.scrollHeight, minHeight), maxHeight);

      el.style.height = `${nextHeight}px`;
      el.style.overflowY = el.scrollHeight > maxHeight ? 'auto' : 'hidden';
    }, [maxRows, minRows, value]);

    return (
      <textarea
        {...props}
        ref={innerRef}
        rows={minRows}
        value={value}
        onChange={onChange}
        spellCheck={spellCheck}
        autoCorrect={autoCorrect}
        autoCapitalize={autoCapitalize}
        style={{
          resize: 'none',
          whiteSpace: 'pre-wrap',
          overflowWrap: 'break-word',
          ...style,
        }}
      />
    );
  },
);
