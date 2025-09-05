// Utility function to handle scrollbar auto-hide functionality
export const initScrollbarAutoHide = () => {
  let scrollTimer: NodeJS.Timeout | null = null;

  const handleScrollStart = () => {
    document.body.classList.add('scrolling');
  };

  const handleScrollEnd = () => {
    document.body.classList.remove('scrolling');
  };

  const handleScroll = () => {
    handleScrollStart();
    
    if (scrollTimer) {
      clearTimeout(scrollTimer);
    }
    
    scrollTimer = setTimeout(() => {
      handleScrollEnd();
    }, 1500); // Hide scrollbar 1.5 seconds after scrolling stops for smoother fade
  };

  // Add scroll event listener
  window.addEventListener('scroll', handleScroll, { passive: true });

  // Cleanup function
  return () => {
    window.removeEventListener('scroll', handleScroll);
    if (scrollTimer) {
      clearTimeout(scrollTimer);
    }
  };
};
