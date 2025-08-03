"use client"

import { useState, useEffect } from "react"
import i18n, { t, setLanguage, getSupportedLanguages } from "../utils/i18n"
import { setTheme, getCurrentTheme, getThemeOptions } from "../utils/theme"
import "./SettingsPage.css"

const SettingsPage = () => {
  const [currentLanguage, setCurrentLanguage] = useState(i18n.getCurrentLanguage())
  const [supportedLanguages] = useState(getSupportedLanguages())
  const [language, setLanguageState] = useState(i18n.getCurrentLanguage())
  const [currentTheme, setCurrentTheme] = useState(getCurrentTheme())
  const [themeOptions] = useState(getThemeOptions())
  const [downloadPath, setDownloadPath] = useState("")
  const [pathLoading, setPathLoading] = useState(false)

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

  const handleImportLanguage = () => {
    const input = document.createElement("input")
    input.type = "file"
    input.accept = ".json"
    input.onchange = async (e) => {
      const file = e.target.files[0]
      if (file) {
        try {
          const language = await i18n.importLanguageFile(file)
          alert(`${t("messages.success")}: ${language}`)
        } catch (error) {
          console.error("Import failed:", error)
          alert(`${t("messages.error")}: ${error.message}`)
        }
      }
    }
    input.click()
  }

  const handleExportLanguage = () => {
    try {
      i18n.exportLanguageFile(currentLanguage)
    } catch (error) {
      console.error("Export failed:", error)
      alert(`${t("messages.error")}: ${error.message}`)
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
          <h2>🌐 {t("settings.language")}</h2>
          <div className="setting-item">
            <label>{t("settings.language")}:</label>
            <select
              value={currentLanguage}
              onChange={(e) => handleLanguageChange(e.target.value)}
              className="language-select"
            >
              {supportedLanguages.map((lang) => (
                <option key={lang.code} value={lang.code}>
                  {lang.name}
                </option>
              ))}
            </select>
          </div>

          <div className="setting-item">
            <div className="button-group">
              <button onClick={handleImportLanguage} className="btn-secondary">
                {t("settings.importLanguage")}
              </button>
              <button onClick={handleExportLanguage} className="btn-secondary">
                {t("settings.exportLanguage")}
              </button>
            </div>
          </div>
        </div>

        <div className="settings-section">
          <h2>🎨 {t("settings.theme")}</h2>
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
          <h2>📁 {t("settings.downloadPath")}</h2>
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
          <h2>ℹ️ {t("settings.about")}</h2>
          <div className="about-info">
            <p>
              <strong>🎵 {t("app.title")}</strong>
            </p>
            <p>📦 Version: 1.9.0</p>
            <p>🎮 A comprehensive rhythm game toolset</p>
            <p>🔧 Professional tools for ADOFAI creators</p>
            <p>👨‍💻 Author: lizi & Xbodw</p>
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
