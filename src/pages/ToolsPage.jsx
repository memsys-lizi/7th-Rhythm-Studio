"use client"

import { useState, useEffect, useRef } from "react"
import IFrame from "../components/IFrame"
import ExpandMoreIcon from "@material-ui/icons/ExpandMore"
import ExpandLessIcon from "@material-ui/icons/ExpandLess"
import SearchIcon from "@material-ui/icons/Search"
import ClearIcon from "@material-ui/icons/Clear"
import i18n, { t } from "../utils/i18n"
import { marked } from "marked"


import "./ToolsPage.css"

const ToolsPage = ({ onStartDownload, downloads }) => {
  const [tools, setTools] = useState([])
  const [selectedTool, setSelectedTool] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [localFiles, setLocalFiles] = useState([])
  const [language, setLanguage] = useState(i18n.getCurrentLanguage())
  const [rightPanelContent, setRightPanelContent] = useState("documentation") // "documentation" | "description" | "changelog"
  const [filter, setFilter] = useState("all") // 'all', 'downloaded', 'not-downloaded'
  const [searchTerm, setSearchTerm] = useState("")
  const [toolVersions, setToolVersions] = useState({}) // 存储工具版本信息
  const iframeRef = useRef(null)

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

  // 获取工具列表
  useEffect(() => {
    const fetchTools = async () => {
      try {
        setLoading(true)
        const response = await fetch("https://7th.rhythmdoctor.top/api/tools/get_tools.php")
        if (!response.ok) {
          throw new Error(t("tools.loadFailed"))
        }
        const result = await response.json()
        
        // 检查API响应是否成功
        if (!result.success) {
          throw new Error(result.message || t("tools.loadFailed"))
        }
        
        const tools = result.data?.tools || []
        setTools(tools)
        
        // 默认选中第一个工具
        if (tools.length > 0) {
          setSelectedTool(tools[0])
        }
      } catch (err) {
        setError(err.message)
        console.error("获取工具列表失败:", err)
      } finally {
        setLoading(false)
      }
    }

    fetchTools()
  }, [language])

  // 获取本地文件列表
  useEffect(() => {
    const fetchLocalFiles = async () => {
      if (window.electronAPI) {
        try {
          const files = await window.electronAPI.getLocalFiles()
          setLocalFiles(files)
        } catch (error) {
          console.error("获取本地文件失败:", error)
        }
      }
    }

    fetchLocalFiles()
  }, [downloads]) // 当下载状态变化时重新获取

  // 获取工具版本信息
  useEffect(() => {
    const fetchToolVersions = async () => {
      if (window.electronAPI) {
        try {
          const versions = await window.electronAPI.getAllToolVersions()
          setToolVersions(versions || {})
        } catch (error) {
          console.error("获取工具版本信息失败:", error)
        }
      }
    }

    fetchToolVersions()
  }, [localFiles]) // 当本地文件列表变化时重新获取版本信息

  const handleToolSelect = (tool) => {
    setSelectedTool(tool)
    setRightPanelContent("documentation") // 重置为默认显示文档
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString(language)
  }

  // 检查工具是否已下载 - 使用工具ID
  const isToolDownloaded = (tool) => {
    return localFiles.some((file) => file.toolId === tool.id.toString())
  }

  // 检查工具是否需要更新
  const isToolNeedUpdate = (tool) => {
    const toolId = tool.id.toString()
    const localVersionInfo = toolVersions[toolId]
    
    // 如果没有本地版本信息，或者工具未下载，不需要更新
    if (!localVersionInfo || !isToolDownloaded(tool)) {
      return false
    }
    
    // 比较版本号
    try {
      const remoteVersion = tool.version
      const localVersion = localVersionInfo.version
      
      // 如果远程版本更新，则需要更新
      return compareVersions(remoteVersion, localVersion) > 0
    } catch (error) {
      console.error("版本比较失败:", error)
      return false
    }
  }

  // 简单的版本比较函数（前端版本）
  const compareVersions = (version1, version2) => {
    const v1 = version1.split('.').map(Number)
    const v2 = version2.split('.').map(Number)
    for (let i = 0; i < Math.max(v1.length, v2.length); i++) {
      const num1 = v1[i] || 0
      const num2 = v2[i] || 0
      if (num1 > num2) return 1
      if (num1 < num2) return -1
    }
    return 0
  }

  // 获取工具状态 - 返回 'not-downloaded', 'downloaded', 'need-update'
  const getToolStatus = (tool) => {
    if (!isToolDownloaded(tool)) {
      return 'not-downloaded'
    } else if (isToolNeedUpdate(tool)) {
      return 'need-update'
    } else {
      return 'downloaded'
    }
  }

  // 筛选和搜索工具
  const getFilteredTools = () => {
    let filteredTools = tools

    // 应用筛选
    if (filter === "downloaded") {
      filteredTools = filteredTools.filter((tool) => isToolDownloaded(tool))
    } else if (filter === "not-downloaded") {
      filteredTools = filteredTools.filter((tool) => !isToolDownloaded(tool))
    }

    // 应用搜索
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase()
      filteredTools = filteredTools.filter(
        (tool) =>
          tool.name.toLowerCase().includes(searchLower) ||
          tool.description.toLowerCase().includes(searchLower) ||
          tool.author.name.toLowerCase().includes(searchLower),
      )
    }

    return filteredTools
  }

  // 清空搜索
  const clearSearch = () => {
    setSearchTerm("")
  }

  // 渲染Markdown文本为HTML
  const renderMarkdown = (text) => {
    return marked.parse(text)
  }

  // 处理右侧面板内容切换
  const handleRightPanelContent = (contentType) => {
    setRightPanelContent(contentType)
  }

  // 更新工具下载量
  const updateDownloadCount = async (toolId) => {
    try {
      const response = await fetch("https://7th.rhythmdoctor.top/api/tools/update_downloadsnum.php", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          tool_id: toolId.toString()
        })
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()
      
      if (result.success) {
        console.log("下载量更新成功:", result.data)
        
        // 更新本地工具列表中的下载量
        setTools(prevTools => 
          prevTools.map(tool => 
            tool.id === toolId 
              ? { ...tool, downloads: result.data.current_downloads }
              : tool
          )
        )
        
        // 如果当前选中的工具是被更新的工具，也更新选中的工具
        if (selectedTool && selectedTool.id === toolId) {
          setSelectedTool(prevTool => ({
            ...prevTool,
            downloads: result.data.current_downloads
          }))
        }
        
        return result.data.current_downloads
      } else {
        console.error("更新下载量失败:", result.message)
        return null
      }
    } catch (error) {
      console.error("更新下载量请求失败:", error)
      return null
    }
  }

  const handleDownload = async (tool) => {
    if (!tool.downloadUrl) {
      alert(t("messages.invalidUrl"))
      return
    }

    if (!onStartDownload) {
      alert(t("messages.downloadFailed"))
      return
    }

    // 检查是否已经在下载
    const existingDownload = downloads?.find(
      (d) => d.tool.id === tool.id && (d.status === "downloading" || d.status === "paused"),
    )

    if (existingDownload) {
      alert(t("download.downloading"))
      return
    }

    // 开始下载，传递工具名称和版本信息
    const downloadData = {
      ...tool,
      toolName: tool.name,
      toolVersion: tool.version
    }
    const downloadId = onStartDownload(downloadData)
    console.log("开始下载工具:", tool.name, "版本:", tool.version, "下载ID:", downloadId)
    
    // 更新下载量（异步执行，不阻塞下载）
    updateDownloadCount(tool.id).then((newDownloadCount) => {
      if (newDownloadCount !== null) {
        console.log(`工具 ${tool.name} 下载量已更新为: ${newDownloadCount}`)
      }
    }).catch((error) => {
      console.error(`更新工具 ${tool.name} 下载量时出错:`, error)
    })
  }

  // 处理工具更新
  const handleUpdate = async (tool) => {
    if (!tool.downloadUrl) {
      alert(t("messages.invalidUrl"))
      return
    }

    if (!onStartDownload) {
      alert(t("messages.downloadFailed"))
      return
    }

    // 确认更新操作
    const confirmMessage = `确定要更新 ${tool.name} 吗？这将删除旧版本并下载最新版本。`
    if (!confirm(confirmMessage)) {
      return
    }

    try {
      // 删除旧的工具文件
      const deleteSuccess = await window.electronAPI.deleteLocalFile(tool.id.toString())
      if (!deleteSuccess) {
        console.warn("删除旧版本失败，继续下载新版本")
      }

      // 更新本地文件列表
      const updatedFiles = await window.electronAPI.getLocalFiles()
      setLocalFiles(updatedFiles)

      // 开始下载新版本，传递工具名称和版本信息
      const downloadData = {
        ...tool,
        toolName: tool.name,
        toolVersion: tool.version
      }
      const downloadId = onStartDownload(downloadData)
      console.log("开始更新工具:", tool.name, "至版本:", tool.version, "下载ID:", downloadId)

      // 更新下载量（异步执行，不阻塞下载）
      updateDownloadCount(tool.id).then((newDownloadCount) => {
        if (newDownloadCount !== null) {
          console.log(`工具 ${tool.name} 下载量已更新为: ${newDownloadCount}`)
        }
      }).catch((error) => {
        console.error(`更新工具 ${tool.name} 下载量时出错:`, error)
      })

    } catch (error) {
      console.error("更新工具失败:", error)
      alert("更新失败: " + error.message)
    }
  }

  // 打开本地文件 - 使用工具ID
  const handleOpenLocal = async (tool) => {
    if (window.electronAPI) {
      try {
        const success = await window.electronAPI.openLocalFile(tool.id.toString())
        if (!success) {
          alert(t("tools.openFailed"))
          // 刷新本地文件列表
          const files = await window.electronAPI.getLocalFiles()
          setLocalFiles(files)
        }
      } catch (error) {
        console.error("打开文件失败:", error)
        alert(t("tools.openFailed"))
      }
    }
  }

  // 删除本地文件 - 使用工具ID
  const handleDeleteLocal = async (tool) => {
    if (!confirm(t("tools.confirmDelete"))) {
      return
    }

    if (window.electronAPI) {
      try {
        const success = await window.electronAPI.deleteLocalFile(tool.id.toString())
        if (success) {
          alert(t("tools.deleteSuccess"))
          // 刷新本地文件列表
          const files = await window.electronAPI.getLocalFiles()
          setLocalFiles(files)
        } else {
          alert(t("tools.deleteFailed"))
        }
      } catch (error) {
        console.error("删除文件失败:", error)
        alert(t("tools.deleteFailed"))
      }
    }
  }

  // 获取下载按钮样式类
  const getDownloadButtonClass = (tool) => {
    if (!downloads || !tool) return ""

    const download = downloads.find((d) => d.tool.id === tool.id)
    if (!download) return ""

    switch (download.status) {
      case "downloading":
        return "downloading"
      case "paused":
        return "paused"
      case "completed":
        return "completed"
      case "error":
        return "error"
      default:
        return ""
    }
  }

  // 获取下载按钮文本
  const getDownloadButtonText = (tool) => {
    if (!downloads || !tool) return t("tools.download")

    const download = downloads.find((d) => d.tool.id === tool.id)
    if (!download) return t("tools.download")

    switch (download.status) {
      case "downloading":
        return `${t("download.downloading")} ${download.progress}%`
      case "paused":
        return t("download.paused")
      case "completed":
        return t("download.completed")
      case "error":
        return t("download.error")
      default:
        return t("tools.download")
    }
  }

  // 检查是否正在下载
  const isDownloading = (tool) => {
    if (!downloads || !tool) return false

    const download = downloads.find((d) => d.tool.id === tool.id)
    return download && (download.status === "downloading" || download.status === "paused")
  }

  // 判断downloadUrl是否是文件下载链接还是网页链接
  const isDownloadableFile = (url) => {
    if (!url) return false
    
    // 常见的可下载文件扩展名
    const downloadableExtensions = ['.zip', '.rar', '.7z', '.exe', '.msi', '.dmg', '.pkg', '.deb', '.rpm', '.apk', '.jar', '.tar', '.gz', '.bz2', '.xz']
    
    // 检查URL是否以这些扩展名结尾
    const urlLower = url.toLowerCase()
    return downloadableExtensions.some(ext => urlLower.endsWith(ext))
  }

  // 打开外部链接
  const handleOpenExternal = async (url, tool = null) => {
    if (window.electronAPI) {
      try {
        const success = await window.electronAPI.openExternal(url)
        if (!success) {
          alert(t("messages.error"))
        } else if (tool) {
          // 如果成功打开外部链接且提供了工具信息，更新下载量
          updateDownloadCount(tool.id).then((newDownloadCount) => {
            if (newDownloadCount !== null) {
              console.log(`工具 ${tool.name} 下载量已更新为: ${newDownloadCount}`)
            }
          }).catch((error) => {
            console.error(`更新工具 ${tool.name} 下载量时出错:`, error)
          })
        }
      } catch (error) {
        console.error("打开外部链接失败:", error)
        alert(t("messages.error"))
      }
    }
  }

  // 获取筛选后的工具列表
  const filteredTools = getFilteredTools()

  if (loading) {
    return (
      <div className="tools-page">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>{t("tools.loadingTools")}</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="tools-page">
        <div className="error-container">
          <h2>{t("tools.loadFailed")}</h2>
          <p>{error}</p>
          <button onClick={() => window.location.reload()}>{t("tools.retry")}</button>
        </div>
      </div>
    )
  }

  return (
    <div className="tools-page">
      <div className="tools-left-panel">
        {/* 工具详情区域 */}
        <div className="tool-details">
          {selectedTool ? (
            <>
              <div className="tool-header">
                <img
                  src={selectedTool.icon || "/placeholder.svg"}
                  alt={selectedTool.name}
                  className="tool-icon"
                  onError={(e) => {
                    e.target.src =
                      "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHZpZXdCb3g9IjAgMCA2NCA2NCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjY0IiBoZWlnaHQ9IjY0IiByeD0iOCIgZmlsbD0iIzMzMzMzMyIvPgo8dGV4dCB4PSIzMiIgeT0iMzgiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iI2ZmZiIgdGV4dC1hbmNob3I9Im1pZGRsZSI+VG9vbDwvdGV4dD4KPHN2Zz4K"
                  }}
                />
                <div className="tool-info">
                  <h2>{selectedTool.name}</h2>
                  <div className="tool-meta">
                    <span className="version">{selectedTool.version}</span>
                    <span className="downloads">
                      {selectedTool.downloads} {t("tools.downloads")}
                    </span>
                    <span className="release-date">{formatDate(selectedTool.releaseDate)}</span>
                  </div>
                </div>
              </div>

              <div className="tool-author">
                <img
                  src={selectedTool.author.avatar || "/placeholder.svg"}
                  alt={selectedTool.author.name}
                  className="author-avatar"
                  onError={(e) => {
                    e.target.src =
                      "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHZpZXdCb3g9IjAgMCAzMiAzMiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMTYiIGN5PSIxNiIgcj0iMTYiIGZpbGw9IiM2NjY2NjYiLz4KPGNpcmNsZSBjeD0iMTYiIGN5PSIxMiIgcj0iNSIgZmlsbD0iI2ZmZiIvPgo8cGF0aCBkPSJNNiAyNmMwLTUuNSA0LjUtMTAgMTAtMTBzMTAgNC41IDEwIDEwIiBmaWxsPSIjZmZmIi8+Cjwvc3ZnPgo="
                  }}
                />
                <a 
                  href={selectedTool.author.link} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="author-name-link"
                  title={t("tools.viewHomepage")}
                >
                  {selectedTool.author.name}
                </a>
                <div className="author-buttons">
                  {selectedTool.description && (
                    <button 
                      className={`btn-description ${rightPanelContent === 'description' ? 'active' : ''}`}
                      onClick={() => handleRightPanelContent('description')}
                    >
                      {t("tools.description")}
                    </button>
                  )}
                  {selectedTool.changelog && (
                    <button 
                      className={`btn-changelog-compact ${rightPanelContent === 'changelog' ? 'active' : ''}`}
                      onClick={() => handleRightPanelContent('changelog')}
                    >
                      {t("tools.changelog")}
                    </button>
                  )}
                </div>
              </div>

              {/* 工具简介区域 */}
              {selectedTool.description && (
                <div className="tool-brief-description">
                  <div className="brief-description-content">
                    {selectedTool.description}
                  </div>
                </div>
              )}

              <div className="tool-actions">
                <div className="download-actions">
                  {(() => {
                    const toolStatus = getToolStatus(selectedTool)
                    
                    if (toolStatus === 'need-update') {
                      // 需要更新：显示更新按钮和管理按钮
                      return (
                        <div className="update-actions">
                          <button
                            className="btn-update"
                            onClick={() => handleUpdate(selectedTool)}
                            disabled={isDownloading(selectedTool)}
                          >
                            {isDownloading(selectedTool) ? getDownloadButtonText(selectedTool) : "更新"}
                          </button>
                          <div className="local-actions">
                            <button className="btn-open" onClick={() => handleOpenLocal(selectedTool)}>
                              {t("tools.open")}
                            </button>
                            <button className="btn-delete" onClick={() => handleDeleteLocal(selectedTool)}>
                              {t("tools.delete")}
                            </button>
                          </div>
                        </div>
                      )
                    } else if (toolStatus === 'downloaded') {
                      // 已下载且最新：显示打开和删除按钮
                      return (
                        <div className="local-actions">
                          <button className="btn-open" onClick={() => handleOpenLocal(selectedTool)}>
                            {t("tools.open")}
                          </button>
                          <button className="btn-delete" onClick={() => handleDeleteLocal(selectedTool)}>
                            {t("tools.delete")}
                          </button>
                        </div>
                      )
                    } else {
                      // 未下载：显示下载或外部链接按钮
                      if (isDownloadableFile(selectedTool.downloadUrl)) {
                        return (
                          <button
                            className={`btn-download ${getDownloadButtonClass(selectedTool)}`}
                            onClick={() => handleDownload(selectedTool)}
                            disabled={isDownloading(selectedTool)}
                          >
                            {getDownloadButtonText(selectedTool)}
                          </button>
                        )
                      } else if (selectedTool.downloadUrl) {
                        return (
                          <button
                            className="btn-external"
                            onClick={() => handleOpenExternal(selectedTool.downloadUrl, selectedTool)}
                          >
                            {t("tools.openInBrowser")}
                          </button>
                        )
                      }
                      return null
                    }
                  })()}
                </div>
              </div>
            </>
          ) : (
            <div className="no-tool-selected">
              <p>{t("tools.noToolSelected")}</p>
            </div>
          )}
        </div>

        {/* 工具列表区域 */}
        <div className="tools-list">
          <div className="tools-list-header">
            <div className="tools-list-title">
              <h3>{t("tools.toolsList")}</h3>
              <div className="filter-buttons">
                <button className={`filter-btn ${filter === "all" ? "active" : ""}`} onClick={() => setFilter("all")}>
                  {t("tools.filterAll")}
                </button>
                <button
                  className={`filter-btn ${filter === "downloaded" ? "active" : ""}`}
                  onClick={() => setFilter("downloaded")}
                >
                  {t("tools.filterDownloaded")}
                </button>
                <button
                  className={`filter-btn ${filter === "not-downloaded" ? "active" : ""}`}
                  onClick={() => setFilter("not-downloaded")}
                >
                  {t("tools.filterNotDownloaded")}
                </button>
              </div>
            </div>
            <div className="search-container">
              <div className="search-input-wrapper">
                <SearchIcon className="search-icon" />
                <input
                  type="text"
                  placeholder={t("tools.searchPlaceholder")}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="search-input"
                />
                {searchTerm && (
                  <button className="clear-search-btn" onClick={clearSearch}>
                    <ClearIcon />
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="tools-grid">
            {filteredTools.length === 0 ? (
              <div className="no-tools-found">
                <p>
                  {searchTerm
                    ? t("tools.noSearchResults")
                    : filter === "downloaded"
                      ? t("tools.noDownloadedTools")
                      : filter === "not-downloaded"
                        ? t("tools.noNotDownloadedTools")
                        : t("tools.noTools")}
                </p>
              </div>
            ) : (
              filteredTools.map((tool) => (
                <div
                  key={tool.id}
                  className={`tool-item ${selectedTool?.id === tool.id ? "selected" : ""} ${
                    getToolStatus(tool) === 'downloaded' ? "downloaded" : ""
                  } ${
                    getToolStatus(tool) === 'need-update' ? "need-update" : ""
                  }`}
                  onClick={() => handleToolSelect(tool)}
                >
                  <img
                    src={tool.icon || "/placeholder.svg"}
                    alt={tool.name}
                    className="tool-item-icon"
                    onError={(e) => {
                      e.target.src =
                        "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiByeD0iNCIgZmlsbD0iIzMzMzMzMyIvPgo8dGV4dCB4PSIyMCIgeT0iMjQiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxMCIgZmlsbD0iI2ZmZiIgdGV4dC1hbmNob3I9Im1pZGRsZSI+VG9vbDwvdGV4dD4KPHN2Zz4K"
                    }}
                  />
                  <div className="tool-item-info">
                    <h4>{tool.name}</h4>
                    <p>{tool.description}</p>
                    <div className="tool-item-meta">
                      <span>{tool.version}</span>
                      <span>
                        {tool.downloads} {t("tools.downloads")}
                      </span>
                      {(() => {
                        const status = getToolStatus(tool)
                        if (status === 'need-update') {
                          return <span className="update-badge">🔄 需要更新</span>
                        } else if (status === 'downloaded') {
                          return <span className="local-badge">📁 已下载</span>
                        }
                        return null
                      })()}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* 右侧面板区域 */}
      <div className="tools-right-panel">
        <div className="documentation-container">
          {selectedTool ? (
            rightPanelContent === "description" && selectedTool.description ? (
              // 显示工具描述
              <div className="changelog-display">
                <div className="changelog-header">
                  <h3>
                    {selectedTool.name} - {t("tools.description")}
                  </h3>
                </div>
                <div
                  className="changelog-content"
                  dangerouslySetInnerHTML={{
                    __html: renderMarkdown(selectedTool.description),
                  }}
                />
              </div>
            ) : rightPanelContent === "changelog" && selectedTool.changelog ? (
              // 显示更新日志
              <div className="changelog-display">
                <div className="changelog-header">
                  <h3>
                    {selectedTool.name} - {t("tools.changelog")}
                  </h3>
                </div>
                <div
                  className="changelog-content"
                  dangerouslySetInnerHTML={{
                    __html: renderMarkdown(selectedTool.changelog),
                  }}
                />
              </div>
            ) : selectedTool.documentation ? (
              // 显示文档
              <IFrame
                ref={iframeRef}
                src={selectedTool.documentation}
                className="documentation-iframe"
                title={`${selectedTool.name} ${t("tools.documentation")}`}
                onLoad={() => console.log("文档加载完成")}
                onError={() => console.error("文档加载失败")}
                allowFullScreen={false}
                loading="eager"
              />
            ) : (
              <div className="no-documentation">
                <h3>{t("tools.documentation")}</h3>
                <p>{t("tools.noDocumentation")}</p>
              </div>
            )
          ) : (
            <div className="no-documentation">
              <h3>{t("tools.documentation")}</h3>
              <p>{t("tools.noDocumentation")}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default ToolsPage