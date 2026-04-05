export {};

declare global {
  interface Window {
    turnstile?: {
      remove: (widgetId: string | number) => void;
      render: (
        container: HTMLElement,
        options: {
          action?: string;
          callback?: (token: string) => void;
          'error-callback'?: () => void;
          'expired-callback'?: () => void;
          sitekey: string;
          theme?: 'auto' | 'light' | 'dark';
        }
      ) => string | number;
    };
  }
}
