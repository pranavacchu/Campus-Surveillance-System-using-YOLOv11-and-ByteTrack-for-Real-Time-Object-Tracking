import React, { useRef, useEffect, useState } from 'react';
import './VideoResultPlayer.css';

const VideoResultPlayer = ({ result, index }) => {
  const videoRef = useRef(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);

  // Generate Cloudinary URL with start offset for instant loading at timestamp
  const getVideoUrlWithTimestamp = (cloudinaryUrl, timestamp) => {
    if (!cloudinaryUrl || !timestamp || timestamp < 0.5) {
      // For timestamps < 0.5s, use original URL (no transformation needed)
      return cloudinaryUrl;
    }

    // Parse Cloudinary URL to inject transformation
    // Format: https://res.cloudinary.com/{cloud_name}/video/upload/{public_id}.mp4
    // Target: https://res.cloudinary.com/{cloud_name}/video/upload/so_{seconds}/{public_id}.mp4
    try {
      const urlParts = cloudinaryUrl.split('/upload/');
      if (urlParts.length === 2) {
        // Round timestamp to nearest second for Cloudinary transformation
        const startOffset = Math.floor(timestamp);
        const transformedUrl = `${urlParts[0]}/upload/so_${startOffset}/${urlParts[1]}`;
        console.log(`⏱️ Using Cloudinary start offset: ${startOffset}s`);
        return transformedUrl;
      }
    } catch (e) {
      console.warn('Failed to transform Cloudinary URL:', e);
    }
    
    return cloudinaryUrl;
  };

  const videoUrl = getVideoUrlWithTimestamp(result.cloudinary_url, result.timestamp);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !result.cloudinary_url) return;

    const handleLoadedMetadata = () => {
      setIsLoading(false);
      // For small timestamps (<0.5s), still do client-side seeking
      const timestamp = result.timestamp || 0;
      if (timestamp > 0 && timestamp < 0.5) {
        video.currentTime = timestamp;
        console.log(`⏱️ Video seeked to ${timestamp}s (client-side)`);
      }
    };

    const handleError = (e) => {
      setIsLoading(false);
      setError('Failed to load video');
      console.error('Video load error:', e);
    };

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);

    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('error', handleError);
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);

    return () => {
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('error', handleError);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
    };
  }, [result]);

  const handlePlayClick = () => {
    const video = videoRef.current;
    if (video) {
      video.play().catch(err => {
        console.warn('Autoplay prevented:', err);
        setError('Click play button to start video');
      });
    }
  };

  const formatConfidence = (score) => {
    return (score * 100).toFixed(1);
  };

  const getConfidenceColor = (score) => {
    if (score >= 0.8) return '#28a745';
    if (score >= 0.6) return '#ffc107';
    return '#17a2b8';
  };

  return (
    <div className="video-result-player">
      <div className="result-header">
        <div className="header-left">
          <span className="result-number">#{index + 1}</span>
          <h3>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M23 7l-7 5 7 5V7z" />
              <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
            </svg>
            {result.video_name}
          </h3>
        </div>
        <div className="header-right">
          <span className="timestamp-badge">
            ⏱️ {result.time_formatted}
          </span>
          <span 
            className="confidence-badge"
            style={{ 
              background: getConfidenceColor(result.similarity_score)
            }}
          >
            {formatConfidence(result.similarity_score)}% match
          </span>
        </div>
      </div>

      {result.cloudinary_url ? (
        <div className="video-container">
          {isLoading && (
            <div className="loading-overlay">
              <div className="spinner"></div>
              <p>Loading video...</p>
            </div>
          )}
          
          {error && (
            <div className="error-overlay">
              <p>⚠️ {error}</p>
              <button onClick={handlePlayClick} className="retry-btn">
                Try Again
              </button>
            </div>
          )}

          <video
            ref={videoRef}
            className="result-video"
            controls
            preload="metadata"
            crossOrigin="anonymous"
          >
            <source src={videoUrl} type="video/mp4" />
            Your browser does not support video playback.
          </video>

          {!isPlaying && !isLoading && !error && (
            <div className="play-overlay" onClick={handlePlayClick}>
              <svg width="64" height="64" viewBox="0 0 24 24" fill="white" opacity="0.9">
                <circle cx="12" cy="12" r="10" stroke="white" strokeWidth="2" fill="rgba(0,0,0,0.5)" />
                <polygon points="10 8 16 12 10 16" fill="white" />
              </svg>
            </div>
          )}
        </div>
      ) : (
        <div className="no-video-message">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="15" y1="9" x2="9" y2="15" />
            <line x1="9" y1="9" x2="15" y2="15" />
          </svg>
          <p>Video URL not available</p>
          <p className="hint">This video may not have been uploaded to Cloudinary</p>
        </div>
      )}

      <div className="result-details">
        <p className="caption">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{display: 'inline', marginRight: '6px'}}>
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
          <strong>Caption:</strong> {result.caption}
        </p>
        
        <div className="metadata">
          {result.video_date && (
            <span className="meta-item">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{display: 'inline', marginRight: '4px'}}>
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
              {result.video_date}
            </span>
          )}
          <span className="meta-item">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{display: 'inline', marginRight: '4px'}}>
              <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
              <line x1="7" y1="7" x2="7.01" y2="7" />
            </svg>
            {result.frame_id}
          </span>
        </div>
      </div>
    </div>
  );
};

export default VideoResultPlayer;
