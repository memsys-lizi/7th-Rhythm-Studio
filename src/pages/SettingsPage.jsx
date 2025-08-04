"use client"

import { useState, useEffect } from "react"
import i18n, { 
  t, 
  setLanguage, 
  getSupportedLanguages, 
  selectAndImportLanguageFile,
  deleteExternalLanguage,
  refreshExternalLanguages,
  exportLanguageFile 
} from "../utils/i18n"
import { setTheme, getCurrentTheme, getThemeOptions } from "../utils/theme"
import VersionManager from "../utils/VersionManager"
import "./SettingsPage.css"

// Material-UI Icons
import LanguageIcon from '@material-ui/icons/Language'
import PaletteIcon from '@material-ui/icons/Palette'
import FolderIcon from '@material-ui/icons/Folder'
import InfoIcon from '@material-ui/icons/Info'
import RefreshIcon from '@material-ui/icons/Refresh'
import DeleteIcon from '@material-ui/icons/Delete'
import MusicNoteIcon from '@material-ui/icons/MusicNote'
import GetAppIcon from '@material-ui/icons/GetApp'
import CodeIcon from '@material-ui/icons/Code'
import BuildIcon from '@material-ui/icons/Build'
import PersonIcon from '@material-ui/icons/Person'

const SettingsPage = () => {
  const [currentLanguage, setCurrentLanguage] = useState(i18n.getCurrentLanguage())
  const [supportedLanguages, setSupportedLanguages] = useState(getSupportedLanguages())
  const [language, setLanguageState] = useState(i18n.getCurrentLanguage())
  const [currentTheme, setCurrentTheme] = useState(getCurrentTheme())
  const [themeOptions] = useState(getThemeOptions())
  const [downloadPath, setDownloadPath] = useState("")
  const [pathLoading, setPathLoading] = useState(false)
  const [languageLoading, setLanguageLoading] = useState(false)

  // 监听语言变化
  useEffect(() => {
    const handleLanguageChange = (event) => {
      setLanguageState(event.detail.language)
      setCurrentLanguage(event.detail.language)
    }

    window.addEventListener("languageChanged", handleLanguageChange)
    return () => {
      window.removeEventListener("languageChanged", handleLanguageChange)
    }
  }, [])

  // 监听主题变化
  useEffect(() => {
    const handleThemeChange = (event) => {
      setCurrentTheme(getCurrentTheme())
    }

    window.addEventListener("themeChanged", handleThemeChange)
    return () => {
      window.removeEventListener("themeChanged", handleThemeChange)
    }
  }, [])

  // 获取当前下载路径
  useEffect(() => {
    const loadDownloadPath = async () => {
      try {
        if (window.electronAPI) {
          const path = await window.electronAPI.getDownloadPath()
          setDownloadPath(path)
        }
      } catch (error) {
        console.error("Failed to load download path:", error)
      }
    }

    loadDownloadPath()
  }, [])

  // 刷新语言列表
  const refreshLanguageList = async () => {
    try {
      await refreshExternalLanguages()
      setSupportedLanguages(getSupportedLanguages())
    } catch (error) {
      console.error("Failed to refresh language list:", error)
    }
  }

  const handleLanguageChange = async (newLanguage) => {
    try {
      await setLanguage(newLanguage)
      setCurrentLanguage(newLanguage)
    } catch (error) {
      console.error("Failed to change language:", error)
      alert(t("messages.error"))
    }
  }

  const handleThemeChange = (newTheme) => {
    try {
      setTheme(newTheme)
      setCurrentTheme(newTheme)
    } catch (error) {
      console.error("Failed to change theme:", error)
      alert(t("messages.error"))
    }
  }

  const handleImportLanguage = async () => {
    try {
      setLanguageLoading(true)
      
      if (window.electronAPI) {
        // 使用新的electron API
        const language = await selectAndImportLanguageFile()
        if (language) {
          await refreshLanguageList()
          alert(`${t("messages.success")}: ${language}`)
        }
      } else {
        // 浏览器环境，使用文件选择器
        const input = document.createElement("input")
        input.type = "file"
        input.accept = ".json"
        input.onchange = async (e) => {
          const file = e.target.files[0]
          if (file) {
            try {
              const language = await i18n.importLanguageFile(file)
              await refreshLanguageList()
              alert(`${t("messages.success")}: ${language}`)
            } catch (error) {
              console.error("Import failed:", error)
              alert(`${t("messages.error")}: ${error.message}`)
            }
          }
        }
        input.click()
      }
    } catch (error) {
      console.error("Import failed:", error)
      alert(`${t("messages.error")}: ${error.message}`)
    } finally {
      setLanguageLoading(false)
    }
  }

  const handleExportLanguage = () => {
    try {
      exportLanguageFile(currentLanguage)
    } catch (error) {
      console.error("Export failed:", error)
      alert(`${t("messages.error")}: ${error.message}`)
    }
  }

  const handleDeleteLanguage = async (languageCode) => {
    if (!window.electronAPI) {
      alert("此功能仅在桌面应用中可用")
      return
    }

    const language = supportedLanguages.find(lang => lang.code === languageCode)
    if (!language || language.type !== "external") {
      alert("只能删除外部语言文件")
      return
    }

    if (confirm(`确定要删除语言文件 "${language.name}" 吗？`)) {
      try {
        setLanguageLoading(true)
        const success = await deleteExternalLanguage(languageCode)
        if (success) {
          await refreshLanguageList()
          alert("语言文件删除成功")
        } else {
          alert("删除失败")
        }
      } catch (error) {
        console.error("Delete failed:", error)
        alert(`删除失败: ${error.message}`)
      } finally {
        setLanguageLoading(false)
      }
    }
  }

  const handleSelectFolder = async () => {
    try {
      setPathLoading(true)
      if (window.electronAPI) {
        const result = await window.electronAPI.selectFolder()
        if (result.success) {
          const updateResult = await window.electronAPI.setDownloadPath(result.path)
          if (updateResult.success) {
            setDownloadPath(updateResult.path)
            alert(t("settings.pathUpdateSuccess"))
          } else {
            alert(t("settings.pathUpdateFailed") + ": " + updateResult.error)
          }
        }
      }
    } catch (error) {
      console.error("Select folder failed:", error)
      alert(t("settings.pathUpdateFailed") + ": " + error.message)
    } finally {
      setPathLoading(false)
    }
  }

  const handleResetPath = async () => {
    try {
      setPathLoading(true)
      if (window.electronAPI) {
        // 传递空字符串或null来重置为默认路径
        const result = await window.electronAPI.setDownloadPath("")
        if (result.success) {
          setDownloadPath(result.path)
          alert(t("settings.pathUpdateSuccess"))
        } else {
          alert(t("settings.pathUpdateFailed") + ": " + result.error)
        }
      }
    } catch (error) {
      console.error("Reset path failed:", error)
      alert(t("settings.pathUpdateFailed") + ": " + error.message)
    } finally {
      setPathLoading(false)
    }
  }

  const handleResetSettings = () => {
    if (confirm(t("settings.resetSettings") + "?")) {
      localStorage.clear()
      window.location.reload()
    }
  }

  return (
    <div className="settings-page">
      <div className="settings-container">
        <h1>{t("settings.title")}</h1>

        <div className="settings-section">
          <h2><LanguageIcon style={{ marginRight: '8px', verticalAlign: 'middle' }} /> {t("settings.language")}</h2>
          <div className="setting-item">
            <label>{t("settings.language")}:</label>
            <select
              value={currentLanguage}
              onChange={(e) => handleLanguageChange(e.target.value)}
              className="language-select"
              disabled={languageLoading}
            >
              {supportedLanguages.map((lang) => (
                <option key={lang.code} value={lang.code}>
                  {lang.name} {lang.type === "external" ? "(外部)" : ""}
                </option>
              ))}
            </select>
          </div>

          <div className="setting-item">
            <div className="button-group">
              <button 
                onClick={handleImportLanguage} 
                className="btn-secondary"
                disabled={languageLoading}
              >
                {languageLoading ? t("common.loading") : t("settings.importLanguage")}
              </button>
              <button 
                onClick={handleExportLanguage} 
                className="btn-secondary"
                disabled={languageLoading}
              >
                {t("settings.exportLanguage")}
              </button>
              <button 
                onClick={refreshLanguageList} 
                className="btn-secondary"
                disabled={languageLoading}
              >
                <RefreshIcon style={{ marginRight: '4px', fontSize: '16px' }} /> 刷新
              </button>
            </div>
          </div>

          {/* 外部语言文件管理 */}
          {window.electronAPI && supportedLanguages.some(lang => lang.type === "external") && (
            <div className="setting-item">
              <label>外部语言文件管理:</label>
              <div className="external-languages-list">
                {supportedLanguages
                  .filter(lang => lang.type === "external")
                  .map((lang) => (
                    <div key={lang.code} className="external-language-item">
                      <span className="language-name">{lang.name} ({lang.code})</span>
                      <button 
                        onClick={() => handleDeleteLanguage(lang.code)}
                        className="btn-danger-small"
                        disabled={languageLoading}
                        title="删除此语言文件"
                      >
                        <DeleteIcon style={{ fontSize: '16px' }} />
                      </button>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>

        <div className="settings-section">
          <h2><PaletteIcon style={{ marginRight: '8px', verticalAlign: 'middle' }} /> {t("settings.theme")}</h2>
          <div className="setting-item">
            <label>{t("settings.theme")}:</label>
            <select value={currentTheme} onChange={(e) => handleThemeChange(e.target.value)} className="theme-select">
              {themeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {t(option.label)}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="settings-section">
          <h2><FolderIcon style={{ marginRight: '8px', verticalAlign: 'middle' }} /> {t("settings.downloadPath")}</h2>
          <div className="setting-item">
            <label>{t("settings.currentPath")}:</label>
            <div className="path-display">
              <input
                type="text"
                value={downloadPath}
                readOnly
                className="path-input"
                title={downloadPath}
              />
            </div>
          </div>
          <div className="setting-item">
            <div className="button-group">
              <button 
                onClick={handleSelectFolder} 
                className="btn-secondary"
                disabled={pathLoading}
              >
                {pathLoading ? t("common.loading") : t("settings.selectFolder")}
              </button>
              <button 
                onClick={handleResetPath} 
                className="btn-secondary"
                disabled={pathLoading}
              >
                {t("settings.resetToDefault")}
              </button>
            </div>
          </div>
        </div>

        <div className="settings-section">
          <h2><InfoIcon style={{ marginRight: '8px', verticalAlign: 'middle' }} /> {t("settings.about")}</h2>
          <div className="about-info">
              <p>
                <strong><MusicNoteIcon style={{ marginRight: '4px', verticalAlign: 'middle' }} /> 7BG Rhythm Studio</strong>
              </p>
              <p><GetAppIcon style={{ marginRight: '4px', verticalAlign: 'middle' }} /> {t("settings.version")}: {VersionManager.version}</p>
              <p><PersonIcon style={{ marginRight: '4px', verticalAlign: 'middle' }} /> {t("settings.developer")}: lizi & XBodw</p>
              <p><BuildIcon style={{ marginRight: '4px', verticalAlign: 'middle' }} /> Powered by Electron + Vite + React</p>
          </div>
        </div>

        <div className="settings-section">
          <div className="setting-item">
            <button onClick={handleResetSettings} className="btn-danger">
              {t("settings.resetSettings")}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SettingsPage
