import { FaGithub, FaExternalLinkAlt } from 'react-icons/fa';
import './ProjectsSection.css';
import content from '../../data/content.json';

const ProjectsSection = () => {
  const { projects } = content;

  return (
    <section className="projects" id="projects">
      <div className="container">
        <h2 className="section-title">{projects.title}</h2>
        
        <div className="projects-grid">
          {projects.items.map(project => (
            <div className="project-card" key={project.id}>
              <div className="project-content">
                <h3 className="project-title">{project.title}</h3>
                <p className="project-description">{project.description}</p>
                
                <div className="project-tech">
                  {project.tech.map((tech, index) => (
                    <span key={index} className="tech-tag">{tech}</span>
                  ))}
                </div>
              </div>
              
              <div className="project-links">
                <a href={project.github} target="_blank" rel="noopener noreferrer" className="project-link">
                  <FaGithub /> Code
                </a>
                {project.demoLink && (
                  <a href={project.demoLink} target="_blank" rel="noopener noreferrer" className="project-link">
                    <FaExternalLinkAlt /> Demo
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ProjectsSection; 