import React, { useRef } from 'react';
import IFrame from '../components/IFrame';
import './HomePage.css';

const HomePage = () => {
  const iframeRef = useRef(null);

  const handleLoad = () => {
    console.log('首页内容加载完成');
  };

  const handleError = () => {
    console.error('首页加载失败');
  };

  return (
    <div className="homepage-container">
      <IFrame
        ref={iframeRef}
        src="https://adofaitools.top/announcement/viewer.html"
        className="homepage-iframe"
        title="ADOFAI Tools 公告"
        onLoad={handleLoad}
        onError={handleError}
        allowFullScreen={false}
        loading="eager"
      />
    </div>
  );
};

export default HomePage;