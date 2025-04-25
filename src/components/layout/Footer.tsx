import React from 'react';
import { FaGithub, FaLinkedin, FaYoutube, FaMedium, FaEnvelope } from 'react-icons/fa';
import './Footer.css';
import content from '../../data/content.json';

const Footer = () => {
  const { footer } = content;
  
  // Map icon names to components
  const iconMap: Record<string, React.ReactNode> = {
    FaGithub: <FaGithub />,
    FaLinkedin: <FaLinkedin />,
    FaYoutube: <FaYoutube />,
    FaMedium: <FaMedium />
  };

  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-content">
          <div className="contact-info">
            <h3>{footer.contact.title}</h3>
            <div className="contact-item">
              <FaEnvelope className="contact-icon" />
              <a href={`mailto:${footer.contact.email}`}>{footer.contact.email}</a>
            </div>
          </div>
          
          <div className="social-container">
            <h3>{footer.social.title}</h3>
            <div className="social-links">
              {footer.social.links.map((link, index) => (
                <a 
                  key={index}
                  href={link.url} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  aria-label={link.platform} 
                  className="social-btn"
                >
                  {iconMap[link.icon]}
                </a>
              ))}
            </div>
          </div>
        </div>
        
        <div className="copyright">
          <p>&copy; {new Date().getFullYear()} {footer.copyright}</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer; 