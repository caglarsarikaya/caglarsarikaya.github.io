import './HeroSection.css';
import content from '../../data/content.json';

const HeroSection = () => {
  const { heroSection } = content;
  
  return (
    <section className="hero" id="home">
      <div className="container">
        <div className="hero-content">
          <div className="hero-text">
            <h1>{heroSection.name}</h1>
            <h2>{heroSection.title}</h2>
            <p dangerouslySetInnerHTML={{ __html: heroSection.description }} />
            <div className="cta-buttons">
              <a href="#contact" className="btn btn-primary">Let's Connect</a>
              <a href="#projects" className="btn btn-secondary">View My Work</a>
            </div>
          </div>
          <div className="hero-image">
            <div className="placeholder-img">
              <span>C.S.</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection; 