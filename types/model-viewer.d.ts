// JSX typing for Google's <model-viewer> web component (loaded client-side
// in components/home/simplified/HeroRackets.tsx).
import 'react';

declare module 'react' {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace JSX {
    interface IntrinsicElements {
      'model-viewer': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
        [attr: string]: unknown;
      };
    }
  }
}
