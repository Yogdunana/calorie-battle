import { useEffect } from 'react';
import useAppStore from '@/app/store/appStore';

/**
 * 响应式布局 hook
 * 监听窗口大小变化，判断是否为移动端
 */
export default function useResponsive() {
  const { isMobile, setIsMobile } = useAppStore();

  useEffect(() => {
    const mediaQuery = window.matchMedia('(max-width: 768px)');

    // 初始设置
    setIsMobile(mediaQuery.matches);

    // 监听变化
    const handler = (e: MediaQueryListEvent) => {
      setIsMobile(e.matches);
    };

    mediaQuery.addEventListener('change', handler);

    return () => {
      mediaQuery.removeEventListener('change', handler);
    };
  }, [setIsMobile]);

  return { isMobile };
}
