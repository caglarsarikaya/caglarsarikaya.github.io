import React, { useState, useEffect, useRef } from 'react';
import './GoToTop.css';

const GoToTop: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);
  const appContainerRef = useRef<HTMLElement | null>(null);

  // Find the app container element with the scroll
  useEffect(() => {
    appContainerRef.current = document.querySelector('.app') as HTMLElement;
  }, []);

  // Show button when page is scrolled down
  const toggleVisibility = () => {
    if (appContainerRef.current) {
      const scrollTop = appContainerRef.current.scrollTop;
      setIsVisible(scrollTop > 300);
    }
  };

  // Scroll to top function
  const scrollToTop = () => {
    if (appContainerRef.current) {
      appContainerRef.current.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    }
  };

  useEffect(() => {
    const appContainer = appContainerRef.current;
    if (appContainer) {
      appContainer.addEventListener('scroll', toggleVisibility);
      return () => appContainer.removeEventListener('scroll', toggleVisibility);
    }
    
    // Fallback to window scroll if app container not found
    window.addEventListener('scroll', toggleVisibility);
    return () => window.removeEventListener('scroll', toggleVisibility);
  }, [appContainerRef.current]);

  return (
    <button 
      className={`go-to-top ${isVisible ? 'show' : 'hide'}`}
      onClick={scrollToTop}
      aria-label="Go to top"
    >
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 15l-6-6-6 6"/>
      </svg>
    </button>
  );
};

export default GoToTop; 