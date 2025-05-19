import React, { useEffect, useState } from 'react';
import './VideoBackground.css';

const API_URL = process.env.REACT_APP_API_URL;
const PUBLIC_URL = process.env.PUBLIC_URL || '';

const VideoBackground = () => {
  const [videoPath, setVideoPath] = useState('');
  const [error, setError] = useState(false);

  useEffect(() => {
    fetch(`${API_URL}/api/config`)
      .then(res => res.json())
      .then(data => {
        let path = data.videoPath;
        if (path && path.startsWith('/')) {
          setVideoPath(PUBLIC_URL + path);
        } else {
          setVideoPath(path);
        }
        console.log('Chemin vidéo utilisé:', path);
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