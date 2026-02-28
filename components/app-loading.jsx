'use client';

import * as React from 'react';
import { usePathname } from 'next/navigation';
import { Spinner } from '@/components/ui/spinner';

/**
 * Covers the page with a semi‑opaque overlay and spinner whenever the
 * current pathname changes. The overlay remains visible for at least two
 * seconds, giving a uniform loading experience during navigation.
 *
 * Place this component in a layout so it wraps all pages.
 */
export function AppLoading() {
  const pathname = usePathname();
  const [visible, setVisible] = React.useState(false);
  const timerRef = React.useRef();
  const previous = React.useRef(pathname);

  React.useEffect(() => {
    if (previous.current !== pathname) {
      // navigation happened
      setVisible(true);
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        setVisible(false);
        timerRef.current = null;
      }, 2000);
      previous.current = pathname;
    }
  }, [pathname]);

  if (!visible) return null;

  return (
    // parent element must be positioned (relative) so that absolute overlay
    // covers only its contents rather than the whole viewport.
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-muted">
      <Spinner className="size-10 text-primary" />
    </div>
  );
}
