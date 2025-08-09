
'use client';

import { useSyncExternalStore } from 'react';

const MOBILE_BREAKPOINT = 768;

function subscribe(callback: () => void) {
  window.addEventListener('resize', callback);
  return () => {
    window.removeEventListener('resize', callback);
  };
}

function getSnapshot() {
  if (typeof window === 'undefined') {
    return false; 
  }
  return window.innerWidth < MOBILE_BREAKPOINT;
}

function getServerSnapshot() {
  return false; // Always render for desktop on the server
}

export function useIsMobile() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
