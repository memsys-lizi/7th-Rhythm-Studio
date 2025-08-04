"use client"

import { useState, useEffect, useRef } from "react"
import IFrame from "../components/IFrame"
import i18n, { t } from "../utils/i18n"
import "./CommunityPage.css"

const CommunityPage = () => {
  const [communityData, setCommunityData] = useState([])
  const [hotPages, setHotPages] = useState([])
  const [selectedSite, setSelectedSite] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [language, setLanguage] = useState(i18n.getCurrentLanguage())
  const [activeTab, setActiveTab] = useState("community") // "community" or "hotpages"
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

  // 获取社区数据
  useEffect(() => {
    const fetchCommunityData = async () => {
      try {
        setLoading(true)

        // 获取社区数据
        if (window.electronAPI) {
          const communityResponse = await window.electronAPI.fetch("https://7th.rhythmdoctor.top/api/community/get_community.php")
          const communityText = await communityResponse
          const communityResult = JSON.parse(communityText)
          
          // 检查社区API响应是否成功
          if (!communityResult.success) {
            throw new Error(communityResult.message || "获取社区列表失败")
          }
          
          const communityDownloads = communityResult.data?.downloads || []
          setCommunityData(communityDownloads)

          // 获取热门页面数据
          const hotPagesResponse = await window.electronAPI.fetch("https://7th.rhythmdoctor.top/api/hotpages/get_hotpages.php")
          const hotPagesText = await hotPagesResponse
          const hotPagesResult = JSON.parse(hotPagesText)
          
          // 检查热门页面API响应是否成功
          if (!hotPagesResult.success) {
            throw new Error(hotPagesResult.message || "获取热门页面失败")
          }
          
          const hotPagesData = hotPagesResult.data || []
          setHotPages(hotPagesData)

          // 默认选中第一个社区网站
          if (communityDownloads.length > 0) {
            setSelectedSite(communityDownloads[0])
          }
        } else {
          throw new Error("Electron API not available")
        }
      } catch (err) {
        setError(err.message)
        console.error("获取社区数据失败:", err)
      } finally {
        setLoading(false)
      }
    }

    fetchCommunityData()
  }, [])

  const handleSiteSelect = (site) => {
    setSelectedSite(site)
  }

  const handleTabChange = (tab) => {
    setActiveTab(tab)
    // 切换标签时选择对应数据的第一项
    if (tab === "community" && communityData.length > 0) {
      setSelectedSite(communityData[0])
    } else if (tab === "hotpages" && hotPages.length > 0) {
      setSelectedSite(hotPages[0])
    }
  }

  const getCurrentData = () => {
    return activeTab === "community" ? communityData : hotPages
  }

  const handleOpenExternal = (url) => {
    if (window.electronAPI && window.electronAPI.openExternal) {
      window.electronAPI.openExternal(url)
    } else {
      // 备用方案
      window.open(url, "_blank")
    }
  }

  if (loading) {
    return (
      <div className="community-page">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>{t("community.loadingCommunity")}</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="community-page">
        <div className="error-container">
          <h2>{t("community.loadFailed")}</h2>
          <p>{error}</p>
          <button onClick={() => window.location.reload()}>{t("tools.retry")}</button>
        </div>
      </div>
    )
  }

  const currentData = getCurrentData()

  return (
    <div className="community-page">
      {/* 左侧导航栏 */}
      <div className="community-sidebar">
        {/* 标签切换 */}
        <div className="tab-switcher">
          <button
            className={`tab-button ${activeTab === "community" ? "active" : ""}`}
            onClick={() => handleTabChange("community")}
          >
            {t("community.communityTab")}
          </button>
          <button
            className={`tab-button ${activeTab === "hotpages" ? "active" : ""}`}
            onClick={() => handleTabChange("hotpages")}
          >
            {t("community.hotPagesTab")}
          </button>
        </div>

        {/* 网站列表 */}
        <div className="sites-list">
          {currentData.length === 0 ? (
            <div className="no-sites">
              <p>{t("community.noSites")}</p>
            </div>
          ) : (
            currentData.map((site, index) => (
              <div
                key={`${activeTab}-${index}`}
                className={`site-item ${selectedSite?.url === site.url ? "selected" : ""}`}
                onClick={() => handleSiteSelect(site)}
              >
                <img
                  src={site.icon || "/placeholder.svg"}
                  alt={site.name}
                  className="site-icon"
                  onError={(e) => {
                    e.target.src =
                      "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiByeD0iOCIgZmlsbD0iIzMzMzMzMyIvPgo8dGV4dCB4PSIyMCIgeT0iMjQiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxMCIgZmlsbD0iI2ZmZiIgdGV4dC1hbmNob3I9Im1pZGRsZSI+V2ViPC90ZXh0Pgo8L3N2Zz4K"
                  }}
                />
                <div className="site-info-text">
                  <h4 className="site-name">{site.name}</h4>
                  <p className="site-url-text">{site.url}</p>
                </div>
              </div>
            ))
          )}
        </div>

        {/* 选中网站的操作按钮 */}
        {selectedSite && (
          <div className="site-actions">
            <button
              className="open-external-btn"
              onClick={() => handleOpenExternal(selectedSite.url)}
              title={t("community.openExternal")}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M14,3V5H17.59L7.76,14.83L9.17,16.24L19,6.41V10H21V3M19,19H5V5H12V3H5C3.89,3 3,3.9 3,5V19A2,2 0 0,0 5,21H19A2,2 0 0,0 21,19V12H19V19Z" />
              </svg>
              {t("community.openExternal")}
            </button>
          </div>
        )}
      </div>

      {/* 右侧内容区域 */}
      <div className="community-content">
        {selectedSite ? (
          <div className="website-container">
            <div className="website-header">
              <h2>{selectedSite.name}</h2>
              <div className="website-actions">
                <button
                  className="refresh-btn"
                  onClick={() => iframeRef.current?.reload()}
                  title={t("titleBar.refresh")}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z" />
                  </svg>
                </button>
                <button
                  className="external-btn"
                  onClick={() => handleOpenExternal(selectedSite.url)}
                  title={t("community.openExternal")}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M14,3V5H17.59L7.76,14.83L9.17,16.24L19,6.41V10H21V3M19,19H5V5H12V3H5C3.89,3 3,3.9 3,5V19A2,2 0 0,0 5,21H19A2,2 0 0,0 21,19V12H19V19Z" />
                  </svg>
                </button>
              </div>
            </div>
            <IFrame
              ref={iframeRef}
              src={selectedSite.url}
              className="community-iframe"
              title={selectedSite.name}
              onLoad={() => console.log("社区网站加载完成")}
              onError={() => console.error("社区网站加载失败")}
              allowFullScreen={false}
              loading="eager"
            />
          </div>
        ) : (
          <div className="no-site-selected">
            <div className="placeholder-content">
              <div className="placeholder-icon">🌐</div>
              <h3>{t("community.noSiteSelected")}</h3>
              <p>{t("community.selectSitePrompt")}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default CommunityPage
