import React, { useEffect, useState } from 'react';
import './VideoBackground.css';

const API_URL = 'http://localhost:3001';

const VideoBackground = () => {
  const [videoPath, setVideoPath] = useState('');
  const [error, setError] = useState(false);

  useEffect(() => {
    fetch(`${API_URL}/api/config`)
      .then(res => res.json())
      .then(data => {
        setVideoPath(data.videoPath);
        console.log('Chemin vidéo utilisé:', data.videoPath);
      })
      .catch(() => setError(true));
  }, []);

  if (error) {
    return <div className="video-background" style={{background: '#222'}} />;
  }

  if (!videoPath) return null;

  return (
    <div className="video-background">
      <video
        autoPlay
        muted
        loop
        playsInline
        className="background-video"
        onError={() => setError(true)}
      >
        <source src={videoPath} type="video/mp4" />
      </video>
    </div>
  );
};

export default VideoBackground; 