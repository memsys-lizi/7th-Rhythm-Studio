import React, { useState, useEffect } from 'react';
import i18n, { t } from '../utils/i18n';
import VersionManager from '../utils/VersionManager';
import AppsIcon from '@material-ui/icons/Apps';
import TollIcon from '@material-ui/icons/Toll';
import ForumIcon from '@material-ui/icons/Forum';
import SettingsIcon from '@material-ui/icons/Settings';
import DeveloperModeIcon from '@material-ui/icons/DeveloperMode';
import './HomePage.css';

const HomePage = ({ onNavigate }) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [language, setLanguage] = useState(i18n.getCurrentLanguage());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // 监听语言变化
  useEffect(() => {
    const handleLanguageChange = (event) => {
      setLanguage(event.detail.language);
    };

    window.addEventListener("languageChanged", handleLanguageChange);
    return () => {
      window.removeEventListener("languageChanged", handleLanguageChange);
    };
  }, []);

  const formatTime = (date) => {
    return date.toLocaleString(language, {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });
  };

  const quickActions = [
    {
      id: 'tools',
      title: t('home.actions.tools.title') || t('sidebar.tools') || '工具',
      description: t('home.actions.tools.description') || '浏览和下载节奏游戏工具',
      icon: <AppsIcon />,
      color: '#667eea'
    },
    {
      id: 'online_tools',
      title: t('home.actions.onlineTools.title') || t('sidebar.onlinetools') || '在线工具',
      description: t('home.actions.onlineTools.description') || '使用在线工具和服务',
      icon: <TollIcon />,
      color: '#764ba2'
    },
    {
      id: 'community',
      title: t('home.actions.community.title') || t('sidebar.community') || '社区',
      description: t('home.actions.community.description') || '探索社区资源和内容',
      icon: <ForumIcon />,
      color: '#f093fb'
    },
    {
      id: 'developer',
      title: t('home.actions.developer.title') || t('sidebar.developer') || '开发者控制台',
      description: t('home.actions.developer.description') || '访问开发者工具和调试功能',
      icon: <DeveloperModeIcon />,
      color: '#4facfe'
    }
  ];

  const handleQuickAction = (actionId) => {
    if (onNavigate) {
      onNavigate(actionId);
    }
  };

  return (
    <div className="homepage-container">
      <div className="homepage-content">
        {/* 欢迎区域 */}
        <div className="welcome-section">
          <div className="app-logo">
            <div className="logo-icon">🎵</div>
            <h1 className="app-title">7th Rhythm Studio</h1>
          </div>
          <p className="app-description">
            {t('home.description') || '节奏游戏工具集合，为ADOFAI等节奏游戏提供丰富的工具和资源'}
          </p>
          <div className="app-info">
            <span className="version">v{VersionManager.version}</span>
            <span className="separator">•</span>
            <span className="time">{formatTime(currentTime)}</span>
          </div>
        </div>

        {/* 快速操作区域 */}
        <div className="quick-actions-section">
          <h2 className="section-title">{t('home.quickStart') || '快速开始'}</h2>
          <div className="quick-actions-grid">
            {quickActions.map((action) => (
              <div
                key={action.id}
                className="quick-action-card"
                onClick={() => handleQuickAction(action.id)}
                style={{ '--card-color': action.color }}
              >
                <div className="card-icon">
                  {action.icon}
                </div>
                <div className="card-content">
                  <h3 className="card-title">{action.title}</h3>
                  <p className="card-description">{action.description}</p>
                </div>
                <div className="card-arrow">→</div>
              </div>
            ))}
          </div>
        </div>

        {/* 底部信息 */}
        <div className="footer-section">
          <p className="footer-text">
            {t('home.developedBy') || '由 lizi & Xbodw 开发维护'}
          </p>
        </div>
      </div>
    </div>
  );
};

export default HomePage;