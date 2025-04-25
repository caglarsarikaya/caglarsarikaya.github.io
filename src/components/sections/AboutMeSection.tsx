import React from 'react';
import './AboutMeSection.css';
import content from '../../data/content.json';

const AboutMeSection: React.FC = () => {
  const { aboutMe } = content;
  
  return (
    <section className="about-me" id="about-me">
      <div className="container">
        <h2 className="section-title">{aboutMe.title}</h2>
        
        <div className="summary-content">
          {aboutMe.paragraphs.map((paragraph) => (
            <p key={paragraph.id} dangerouslySetInnerHTML={{ __html: paragraph.content }} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default AboutMeSection; 