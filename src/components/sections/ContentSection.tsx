import { useState } from 'react';
import { FaYoutube, FaMedium, FaPlay } from 'react-icons/fa';
import './ContentSection.css';
import contentData from '../../data/content.json';

interface VideoContent {
  id: string;
  isShort: boolean;
  title: string;
  description: string;
  thumbnail: string;
  publishedAt: string;
  url: string;
}

interface BlogContent {
  id: number;
  title: string;
  description: string;
  publishedAt: string;
  url: string;
}

const ContentSection = () => {
  const [activeTab, setActiveTab] = useState('youtube');
  const [activeVideo, setActiveVideo] = useState<string | null>(null);
  
  // Load data from our JSON file
  const { content, youtubeVideos, mediumBlogs } = contentData;
  const videos = youtubeVideos as VideoContent[];
  const articles = mediumBlogs as BlogContent[];
  
  // Format the date string to a more readable format
  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };
  
  // When clicking on a different tab, close any active video
  const handleTabChange = (tab: string) => {
    setActiveVideo(null);
    setActiveTab(tab);
  };
  
  const getEmbedUrl = (videoId: string, isShort: boolean) => {
    if (isShort) {
      // For YouTube Shorts
      return `https://www.youtube.com/embed/${videoId}?autoplay=1&loop=1&modestbranding=1&rel=0`;
    }
    // For regular videos
    return `https://www.youtube.com/embed/${videoId}?autoplay=1&modestbranding=1&rel=0`;
  };

  return (
    <section className="content" id="content">
      <div className="container">
        <h2 className="section-title">{content.title}</h2>
        
        <div className="content-tabs">
          <button 
            className={`tab-button ${activeTab === 'youtube' ? 'active' : ''}`}
            onClick={() => handleTabChange('youtube')}
          >
            <FaYoutube /> YouTube Videos
          </button>
          <button 
            className={`tab-button ${activeTab === 'medium' ? 'active' : ''}`}
            onClick={() => handleTabChange('medium')}
          >
            <FaMedium /> Medium Blogs
          </button>
        </div>
        
        <div className="tab-content">
          {activeTab === 'youtube' && (
            <div className="videos-container">
              {videos.length === 0 ? (
                <div className="no-content">No videos found. Check back later!</div>
              ) : (
                <>
                  {videos.map(video => (
                    <div className="video-card" key={video.id}>
                      <div className="video-thumbnail">
                        {activeVideo === video.id ? (
                          <iframe 
                            width="100%" 
                            height="100%" 
                            src={getEmbedUrl(video.id, video.isShort)} 
                            title={video.title}
                            frameBorder="0"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                            style={{position: 'absolute', top: 0, left: 0}}
                          ></iframe>
                        ) : (
                          <>
                            <img src={video.thumbnail} alt={video.title} />
                            <button 
                              className="play-button" 
                              onClick={() => setActiveVideo(video.id)}
                              aria-label="Play video"
                            >
                              <FaPlay />
                            </button>
                          </>
                        )}
                      </div>
                      <div className="video-info">
                        <h3>{video.title}</h3>
                        <p className="video-date">{formatDate(video.publishedAt)}</p>
                        <p className="video-description">{video.description}</p>
                        <a href={video.url} target="_blank" rel="noopener noreferrer" className="video-link">
                          Watch on YouTube
                        </a>
                      </div>
                    </div>
                  ))}
                  <div className="channel-link">
                    <a href={content.youtubeChannelUrl} target="_blank" rel="noopener noreferrer">
                      Visit my YouTube Channel
                    </a>
                  </div>
                </>
              )}
            </div>
          )}
          
          {activeTab === 'medium' && (
            <div className="articles-container">
              {articles.length === 0 ? (
                <div className="no-content">No articles found. Check back later!</div>
              ) : (
                <>
                  {articles.map(article => (
                    <div className="article-card" key={article.id}>
                      <h3 className="article-title">{article.title}</h3>
                      <p className="article-date">{formatDate(article.publishedAt)}</p>
                      <p className="article-description">{article.description}</p>
                      <a href={article.url} target="_blank" rel="noopener noreferrer" className="article-link">
                        Read on Medium
                      </a>
                    </div>
                  ))}
                  <div className="profile-link">
                    <a href={content.mediumProfileUrl} target="_blank" rel="noopener noreferrer">
                      See all blogs on Medium
                    </a>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default ContentSection; 