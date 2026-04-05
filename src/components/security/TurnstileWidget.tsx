'use client';

import { useEffect, useRef, useState } from 'react';
import Script from 'next/script';

type TurnstileTheme = 'auto' | 'light' | 'dark';

interface TurnstileWidgetProps {
  action?: string;
  className?: string;
  onTokenChange: (token: string | null) => void;
  siteKey: string;
  theme?: TurnstileTheme;
}

export function TurnstileWidget({
  action = 'submit',
  className,
  onTokenChange,
  siteKey,
  theme = 'auto',
}: TurnstileWidgetProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const widgetIdRef = useRef<string | number | null>(null);
  const [scriptReady, setScriptReady] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.turnstile) {
      setScriptReady(true);
    }
  }, []);

  useEffect(() => {
    if (!siteKey || !scriptReady || !containerRef.current || !window.turnstile) {
      return;
    }

    const container = containerRef.current;
    container.innerHTML = '';
    onTokenChange(null);

    widgetIdRef.current = window.turnstile.render(container, {
      sitekey: siteKey,
      action,
      theme,
      callback: (token: string) => onTokenChange(token),
      'expired-callback': () => onTokenChange(null),
      'error-callback': () => onTokenChange(null),
    });

    return () => {
      onTokenChange(null);

      if (widgetIdRef.current !== null && window.turnstile) {
        window.turnstile.remove(widgetIdRef.current);
        widgetIdRef.current = null;
      }
    };
  }, [action, onTokenChange, scriptReady, siteKey, theme]);

  if (!siteKey) {
    return null;
  }

  return (
    <>
      <Script
        src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
        strategy="afterInteractive"
        onLoad={() => setScriptReady(true)}
      />
      <div className={className}>
        <div ref={containerRef} />
      </div>
    </>
  );
}
