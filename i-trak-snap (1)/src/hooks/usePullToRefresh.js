import { useState, useRef, useCallback } from 'react';

const THRESHOLD = 72; // px to pull before triggering

export default function usePullToRefresh(onRefresh) {
  const [pulling, setPulling] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const startY = useRef(null);

  const onTouchStart = useCallback((e) => {
    const scrollEl = e.currentTarget;
    if (scrollEl.scrollTop === 0) {
      startY.current = e.touches[0].clientY;
    }
  }, []);

  const onTouchMove = useCallback((e) => {
    if (startY.current === null || refreshing) return;
    const delta = e.touches[0].clientY - startY.current;
    if (delta > 0) {
      e.preventDefault();
      setPulling(true);
      setPullDistance(Math.min(delta * 0.5, THRESHOLD * 1.2));
    }
  }, [refreshing]);

  const onTouchEnd = useCallback(async () => {
    if (pulling && pullDistance >= THRESHOLD) {
      setRefreshing(true);
      await onRefresh();
      setRefreshing(false);
    }
    startY.current = null;
    setPulling(false);
    setPullDistance(0);
  }, [pulling, pullDistance, onRefresh]);

  return { pulling, pullDistance, refreshing, threshold: THRESHOLD, onTouchStart, onTouchMove, onTouchEnd };
}