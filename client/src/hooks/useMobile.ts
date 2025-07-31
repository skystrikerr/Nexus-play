import { useState, useEffect } from 'react';

export function useMobile() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkIsMobile();
    window.addEventListener('resize', checkIsMobile);

    return () => window.removeEventListener('resize', checkIsMobile);
  }, []);

  return isMobile;
}

export function useCapacitor() {
  const [isCapacitor, setIsCapacitor] = useState(false);

  useEffect(() => {
    // Check if we're running in Capacitor
    import('@capacitor/core').then(({ Capacitor }) => {
      setIsCapacitor(Capacitor.isNativePlatform());
    }).catch(() => {
      setIsCapacitor(false);
    });
  }, []);

  return isCapacitor;
}