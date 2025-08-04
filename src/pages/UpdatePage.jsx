import React, { useState, useEffect } from 'react';
import VersionManager from '../utils/VersionManager';
import './UpdatePage.css';

// 确定平台
const getPlatform = () => {
  if (window.navigator.platform.toLowerCase().includes('win')) {
    return 'windows';
  } else if (window.navigator.platform.toLowerCase().includes('mac')) {
    return 'macos';
  }
  return 'windows'; // 默认
};

const UpdatePage = () => {
  const [status, setStatus] = useState('checking'); // checking, app-update, completed, error
  const [message, setMessage] = useState('正在检查更新...');
  const [updateInfo, setUpdateInfo] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    console.log('UpdatePage mounted');
    console.log('window.electronAPI available:', !!window.electronAPI);
    console.log('VersionManager:', {
      appVersion: VersionManager.appVersion
    });
    
    // 延迟检查，确保API完全加载
    setTimeout(() => {
      checkForUpdates();
    }, 100);
  }, []);

  const checkForUpdates = async () => {
    try {
      setStatus('checking');
      setMessage('正在检查更新...');
      
      if (!window.electronAPI) {
        throw new Error('Electron API 不可用');
      }

      // 请求更新信息
      const updateData = await window.electronAPI.checkUpdate();
      setUpdateInfo(updateData);

      const platform = getPlatform();
      const needsAppUpdate = VersionManager.needsAppUpdate(updateData.version);

      console.log('Version check:', {
        current: { app: VersionManager.appVersion },
        remote: { app: updateData.version },
        needsAppUpdate
      });

      if (needsAppUpdate) {
        // 需要软件更新
        setStatus('app-update');
        setMessage(`发现新版本 ${updateData.version}`);
      } else {
        // 无更新
        setStatus('completed');
        setMessage('已是最新版本');
        setTimeout(() => finishUpdate(), 1500);
      }
    } catch (error) {
      console.error('Check update error:', error);
      setStatus('error');
      setError(error.message || '未知错误');
      setMessage(`检查更新失败: ${error.message || '未知错误'}`);
      // 即使检查失败也要启动主应用
      setTimeout(() => finishUpdate(), 5000);
    }
  };

  const handleAppUpdate = async () => {
    try {
      const platform = getPlatform();
      const updateUrl = updateInfo.update[platform];
      
      if (updateUrl) {
        setMessage('正在打开下载页面...');
        await window.electronAPI.handleAppUpdate(updateUrl);
      } else {
        throw new Error('找不到对应平台的更新包');
      }
    } catch (error) {
      console.error('Handle app update error:', error);
      setStatus('error');
      setError(error.message);
      setMessage('打开下载页面失败');
    }
  };

  const finishUpdate = async () => {
    try {
      await window.electronAPI.finishUpdate();
    } catch (error) {
      console.error('Finish update error:', error);
      // 强制关闭更新窗口
      if (window.electronAPI) {
        window.electronAPI.windowControl('close');
      }
    }
  };

  const renderContent = () => {
    switch (status) {
      case 'checking':
        return (
          <div className="update-content">
            <div className="update-icon">
              <div className="updatepage-loading-spinner"></div>
            </div>
            <h2>检查更新</h2>
            <p className="update-message">{message}</p>
          </div>
        );

      case 'app-update':
        return (
          <div className="update-content">
            <div className="update-icon app-update">📦</div>
            <h2>发现新版本</h2>
            <p className="update-message">{message}</p>
            <p className="version-info">
              {VersionManager.appVersion} → {updateInfo?.version}
            </p>
            <div className="update-actions">
              <button className="update-btn primary" onClick={handleAppUpdate}>
                立即下载
              </button>
              <button className="update-btn secondary" onClick={finishUpdate}>
                稍后更新
              </button>
            </div>
          </div>
        );

      case 'completed':
        return (
          <div className="update-content">
            <div className="update-icon completed">✅</div>
            <h2>启动应用</h2>
            <p className="update-message">{message}</p>
          </div>
        );

      case 'error':
        return (
          <div className="update-content">
            <div className="update-icon error">⚠️</div>
            <h2>出现错误</h2>
            <p className="update-message">{message}</p>
            {error && <p className="error-detail">{error}</p>}
            <div className="update-actions">
              <button className="update-btn primary" onClick={checkForUpdates}>
                重试
              </button>
              <button className="update-btn secondary" onClick={finishUpdate}>
                跳过
              </button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="update-page">
      <div className="update-header">
        <img src="https://7th.rhythmdoctor.top/Resource/icon.png" alt="7th Rhythm Studio" className="updatepage-app-logo" />
        <h1>7th Rhythm Studio</h1>
      </div>
      {renderContent()}
    </div>
  );
};

export default UpdatePage;