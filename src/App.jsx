"use client"

import { useState, useEffect } from "react"
import TitleBar from "./components/TitleBar"
import Sidebar from "./components/Sidebar"
import HomePage from "./pages/HomePage"
import ToolsPage from "./pages/ToolsPage"
import SettingsPage from "./pages/SettingsPage"
import CommunityPage from "./pages/CommunityPage"
import OnlineToolsPage from "./pages/OnlineToolsPage"
import DevPage from "./pages/Dev"
import UpdatePage from "./pages/UpdatePage"
import DownloadPanel from "./components/DownloadPanel"
import { navigateIFrame } from "./components/IFrame"
import i18n, { t } from "./utils/i18n"
import GetAppIcon from "@material-ui/icons/GetApp"
import VersionManager from './utils/VersionManager'

import "./App.css"

function App() {
  const [currentTime, setCurrentTime] = useState(new Date())
  const [activeTab, setActiveTab] = useState("home") // 当前激活的标签页
  const [downloads, setDownloads] = useState([]) // 下载列表
  const [showDownloads, setShowDownloads] = useState(false) // 是否显示下载面板
  const [language, setLanguage] = useState(i18n.getCurrentLanguage())
  const [currentRoute, setCurrentRoute] = useState(window.location.hash.replace('#', '') || 'main')

  // 监听路由变化
  useEffect(() => {
    const handleHashChange = () => {
      setCurrentRoute(window.location.hash.replace('#', '') || 'main')
    }
    
    window.addEventListener('hashchange', handleHashChange)
    return () => {
      window.removeEventListener('hashchange', handleHashChange)
    }
  }, [])

  // 监听语言变化
  useEffect(() => {
    const handleLanguageChange = (event) => {
      setLanguage(event.detail.language)
    }

    window.addEventListener("languageChanged", handleLanguageChange)
    return () => {
      window.removeEventListener("languageChanged", handleLanguageChange)
    }
  }, [])

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)

    return () => clearInterval(timer)
  }, [])



  const formatTime = (date) => {
    return date.toLocaleString(language, {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    })
  }

  const handleTabChange = (tabId) => {
    setActiveTab(tabId)
    console.log("切换到标签页:", tabId)
  }

  // 导航控制函数 - 直接调用 IFrame 组件的 API
  const handleNavigate = (action) => {
    const success = navigateIFrame(action)
    if (success) {
      console.log(`导航操作 ${action} 执行成功`)
    } else {
      console.log(`导航操作 ${action} 执行失败`)
    }
  }

  // 开始下载
  const startDownload = (tool) => {
    const downloadId = Date.now().toString()
    const newDownload = {
      id: downloadId,
      tool,
      progress: 0,
      status: "downloading", // downloading, paused, completed, error
      speed: 0,
      downloaded: 0,
      total: 0,
      error: null,
    }

    setDownloads((prev) => [...prev, newDownload])

    // 开始实际下载
    performDownload(downloadId, tool)

    return downloadId
  }

  // 暂停下载
  const pauseDownload = (downloadId) => {
    // 只通知主进程暂停下载，状态更新由主进程事件处理
    if (window.electronAPI) {
      window.electronAPI.pauseDownload(downloadId)
    }
  }

  // 恢复下载
  const resumeDownload = (downloadId) => {
    // 只通知主进程恢复下载，状态更新由主进程事件处理
    if (window.electronAPI) {
      window.electronAPI.resumeDownload(downloadId)
    }
  }

  // 取消下载
  const cancelDownload = (downloadId) => {
    setDownloads((prev) => prev.filter((download) => download.id !== downloadId))

    // 通知主进程取消下载
    if (window.electronAPI) {
      window.electronAPI.cancelDownload(downloadId)
    }
  }

  // 执行下载
  const performDownload = async (downloadId, tool) => {
    try {
      if (!window.electronAPI) {
        throw new Error("Electron API 不可用")
      }

      // 清理之前的监听器
      window.electronAPI.removeAllListeners("download-progress")
      window.electronAPI.removeAllListeners("download-complete")
      window.electronAPI.removeAllListeners("download-error")
      window.electronAPI.removeAllListeners("download-paused")
      window.electronAPI.removeAllListeners("download-resumed")

      // 监听下载进度
      window.electronAPI.onDownloadProgress((data) => {
        if (data.downloadId === downloadId) {
          setDownloads((prev) =>
            prev.map((download) =>
              download.id === downloadId
                ? {
                    ...download,
                    progress: data.progress,
                    speed: data.speed,
                    downloaded: data.downloaded,
                    total: data.total,
                  }
                : download,
            ),
          )
        }
      })

      // 监听下载完成
      window.electronAPI.onDownloadComplete((data) => {
        if (data.downloadId === downloadId) {
          setDownloads((prev) =>
            prev.map((download) =>
              download.id === downloadId ? { ...download, status: "completed", progress: 100 } : download,
            ),
          )

          // 显示成功通知
          console.log(`下载完成: ${data.filename || tool.name}`)
        }
      })

      // 监听下载错误
      window.electronAPI.onDownloadError((data) => {
        if (data.downloadId === downloadId) {
          console.error("下载错误:", data.error)

          setDownloads((prev) =>
            prev.map((download) =>
              download.id === downloadId ? { ...download, status: "error", error: data.error } : download,
            ),
          )
        }
      })

      // 监听下载暂停
      window.electronAPI.onDownloadPaused((data) => {
        if (data.downloadId === downloadId) {
          setDownloads((prev) =>
            prev.map((download) =>
              download.id === downloadId ? { ...download, status: "paused" } : download,
            ),
          )
        }
      })

      // 监听下载恢复
      window.electronAPI.onDownloadResumed((data) => {
        if (data.downloadId === downloadId) {
          setDownloads((prev) =>
            prev.map((download) =>
              download.id === downloadId ? { ...download, status: "downloading" } : download,
            ),
          )
        }
      })

      // 开始下载 - 使用工具ID作为文件名，并传递工具名称和版本信息
      const result = await window.electronAPI.startDownload({
        downloadId,
        url: tool.downloadUrl,
        toolId: tool.id.toString(),
        toolName: tool.toolName || tool.name, // 优先使用 toolName，回退到 name
        toolVersion: tool.toolVersion || tool.version, // 优先使用 toolVersion，回退到 version
      })

      if (!result) {
        throw new Error("下载启动失败")
      }
    } catch (error) {
      console.error("下载失败:", error)
      setDownloads((prev) =>
        prev.map((download) =>
          download.id === downloadId ? { ...download, status: "error", error: error.message } : download,
        ),
      )
    }
  }

  const renderMainContent = () => {
    // 根据activeTab渲染不同的内容
    switch (activeTab) {
      case "home":
        return <HomePage onNavigate={handleTabChange} />
      case "tools":
        return <ToolsPage onStartDownload={startDownload} downloads={downloads} />
      case "community":
        return <CommunityPage />
      case "online_tools":
        return <OnlineToolsPage />
      case "developer":
        return <DevPage />
      case "settings":
        return <SettingsPage />
      default:
        return <HomePage onNavigate={handleTabChange} />
    }
  }

  // 如果是更新页面，只渲染更新组件
  if (currentRoute === '/update' || currentRoute === 'update') {
    return <UpdatePage />
  }

  return (
    <div className="App">
      <TitleBar onNavigate={handleNavigate} />
      <div className="app-body">
        <Sidebar activeTab={activeTab} onTabChange={handleTabChange} />
        <div className="main-content">{renderMainContent()}</div>
      </div>
      {showDownloads && (
        <DownloadPanel
          downloads={downloads}
          onPause={pauseDownload}
          onResume={resumeDownload}
          onCancel={cancelDownload}
          onClose={() => setShowDownloads(false)}
        />
      )}
      {downloads.length > 0 && (
        <button
          className="download-toggle-btn"
          onClick={() => setShowDownloads(!showDownloads)}
          title={t("download.downloadManager")}
        >
          <span className="download-count">{downloads.length}</span>
          <GetAppIcon />
        </button>
      )}

    </div>
  )
}

export default App
