import { useState, useEffect } from 'react';

const MOBILE_QUERY = '(max-width: 768px)';
const TABLET_QUERY = '(min-width: 769px) and (max-width: 1024px)';

export const useViewport = () => {
  const getState = () => ({
    isMobile: window.matchMedia(MOBILE_QUERY).matches,
    isTablet: window.matchMedia(TABLET_QUERY).matches
  });

  const [viewport, setViewport] = useState(getState);

  useEffect(() => {
    const mobileMql = window.matchMedia(MOBILE_QUERY);
    const tabletMql = window.matchMedia(TABLET_QUERY);
    const update = () => setViewport({ isMobile: mobileMql.matches, isTablet: tabletMql.matches });
    mobileMql.addEventListener('change', update);
    tabletMql.addEventListener('change', update);
    return () => {
      mobileMql.removeEventListener('change', update);
      tabletMql.removeEventListener('change', update);
    };
  }, []);

  return viewport;
};
