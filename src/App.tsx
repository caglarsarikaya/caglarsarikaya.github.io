import { useEffect } from 'react';
import './App.css';
import Footer from './components/layout/Footer';
import HeroSection from './components/sections/HeroSection';
import AboutMeSection from './components/sections/AboutMeSection';
import ProjectsSection from './components/sections/ProjectsSection';
import ContentSection from './components/sections/ContentSection';
import GoToTop from './components/layout/GoToTop';
import Header from './components/layout/Header';

function App() {
  // Force a re-render after component mount to ensure scroll listeners are attached
  useEffect(() => {
    // Wait for DOM to be fully loaded
    const timer = setTimeout(() => {
      // Force a re-render by touching the DOM
      const appElement = document.querySelector('.app');
      if (appElement) {
        appElement.scrollTop = appElement.scrollTop;
      }
    }, 100);
    
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="app">
      <main>
        <Header />
        <HeroSection />
        <AboutMeSection />
        <ProjectsSection />
        <ContentSection />
        <section className="footer-section" id="contact">
          <Footer />
        </section>
      </main>
      <GoToTop />
    </div>
  );
}

export default App;
