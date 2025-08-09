import * as React from 'react';

const MOBILE_BREAKPOINT = 768;

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean>(false);
  const [hasMounted, setHasMounted] = React.useState(false);

  React.useEffect(() => {
    setHasMounted(true);
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    };

    // Check on initial client render and add listener
    checkIsMobile();
    window.addEventListener('resize', checkIsMobile);

    // Cleanup listener on component unmount
    return () => window.removeEventListener('resize', checkIsMobile);
  }, []);

  return hasMounted ? isMobile : false;
}
