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
        const response = await fetch("https://adofaitools.top/api/get_tools.php")
        if (!response.ok) {
          throw new Error(t("tools.loadFailed"))
        }
        const data = await response.json()
        setTools(data.tools || [])
        // 默认选中第一个工具
        if (data.tools && data.tools.length > 0) {
          setSelectedTool(data.tools[0])
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



  const handleDownload = (tool) => {
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

    // 开始下载
    const downloadId = onStartDownload(tool)
    console.log("开始下载工具:", tool.name, "下载ID:", downloadId)
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
  const handleOpenExternal = async (url) => {
    if (window.electronAPI) {
      try {
        const success = await window.electronAPI.openExternal(url)
        if (!success) {
          alert(t("messages.error"))
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
                <div className="author-info">
                  <span className="author-name">{selectedTool.author.name}</span>
                  <a href={selectedTool.author.link} target="_blank" rel="noopener noreferrer" className="author-link">
                    {t("tools.viewHomepage")}
                  </a>
                </div>
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

              <div className="tool-actions">

                <div className="download-actions">
                  {isToolDownloaded(selectedTool) ? (
                    <div className="local-actions">
                      <button className="btn-open" onClick={() => handleOpenLocal(selectedTool)}>
                        {t("tools.open")}
                      </button>
                      <button className="btn-delete" onClick={() => handleDeleteLocal(selectedTool)}>
                        {t("tools.delete")}
                      </button>
                    </div>
                  ) : isDownloadableFile(selectedTool.downloadUrl) ? (
                    <button
                      className={`btn-download ${getDownloadButtonClass(selectedTool)}`}
                      onClick={() => handleDownload(selectedTool)}
                      disabled={isDownloading(selectedTool)}
                    >
                      {getDownloadButtonText(selectedTool)}
                    </button>
                  ) : selectedTool.downloadUrl ? (
                    <button
                      className="btn-external"
                      onClick={() => handleOpenExternal(selectedTool.downloadUrl)}
                    >
                      {t("tools.openInBrowser")}
                    </button>
                  ) : null}
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
                    isToolDownloaded(tool) ? "downloaded" : ""
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
                      {isToolDownloaded(tool) && <span className="local-badge">📁</span>}
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