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
  const [status, setStatus] = useState('checking'); // checking, app-update, hot-update, completed, error
  const [message, setMessage] = useState('正在检查更新...');
  const [updateInfo, setUpdateInfo] = useState(null);
  const [error, setError] = useState(null);
  const [countdown, setCountdown] = useState(3);

  useEffect(() => {
    checkForUpdates();
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
      const needsHotUpdate = updateData.Hotupdate && 
        VersionManager.needsHotUpdate(updateData.Hotupdate.version);

      console.log('Version check:', {
        current: { app: VersionManager.appVersion, asar: VersionManager.asarVersion },
        remote: { app: updateData.version, asar: updateData.Hotupdate?.version },
        needsAppUpdate,
        needsHotUpdate
      });

      if (needsAppUpdate) {
        // 需要软件更新
        setStatus('app-update');
        setMessage(`发现新版本 ${updateData.version}`);
      } else if (needsHotUpdate) {
        // 需要热更新
        setStatus('hot-update');
        setMessage(`发现热更新 ${updateData.Hotupdate.version}`);
        startCountdown();
      } else {
        // 无更新
        setStatus('completed');
        setMessage('已是最新版本');
        setTimeout(() => finishUpdate(), 1500);
      }
    } catch (error) {
      console.error('Check update error:', error);
      setStatus('error');
      setError(error.message);
      setMessage('检查更新失败，将直接启动应用');
      // 即使检查失败也要启动主应用
      setTimeout(() => finishUpdate(), 3000);
    }
  };

  const startCountdown = () => {
    setCountdown(3);
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          performHotUpdate();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
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

  const performHotUpdate = async () => {
    try {
      setStatus('hot-updating');
      setMessage('正在启动热更新程序...');

      const result = await window.electronAPI.startHotupdate();
      
      if (result) {
        setMessage('热更新程序已启动，应用即将重启');
        // UpdateScript.exe 会自动处理后续流程
      } else {
        throw new Error('启动热更新程序失败');
      }
    } catch (error) {
      console.error('Hot update error:', error);
      setStatus('error');
      setError(error.message);
      setMessage('热更新失败，将直接启动应用');
      setTimeout(() => finishUpdate(), 3000);
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
              <div className="loading-spinner"></div>
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

      case 'hot-update':
        return (
          <div className="update-content">
            <div className="update-icon hot-update">🔄</div>
            <h2>热更新</h2>
            <p className="update-message">{message}</p>
            <p className="version-info">
              {VersionManager.asarVersion} → {updateInfo?.Hotupdate?.version}
            </p>
            <div className="countdown">
              <div className="countdown-circle">
                <span className="countdown-number">{countdown}</span>
              </div>
              <p>秒后自动开始更新</p>
            </div>
            <div className="update-actions">
              <button className="update-btn primary" onClick={performHotUpdate}>
                立即更新
              </button>
              <button className="update-btn secondary" onClick={finishUpdate}>
                跳过更新
              </button>
            </div>
          </div>
        );

      case 'hot-updating':
        return (
          <div className="update-content">
            <div className="update-icon">
              <div className="updating-spinner"></div>
            </div>
            <h2>正在更新</h2>
            <p className="update-message">{message}</p>
            <p className="update-hint">请稍候，应用将自动重启</p>
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
        <img src="https://7th.rhythmdoctor.top/Resource/icon.png" alt="7th Rhythm Studio" className="app-logo" />
        <h1>7th Rhythm Studio</h1>
      </div>
      {renderContent()}
    </div>
  );
};

export default UpdatePage;