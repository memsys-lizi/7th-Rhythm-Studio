"use client"

import { useState, useEffect, useRef } from "react"
import IFrame from "../components/IFrame"
import i18n, { t } from "../utils/i18n"
import "./Dev.css"

const DevPage = () => {
  const [language, setLanguage] = useState(i18n.getCurrentLanguage())
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

  return (
    <div className="dev-page">
      <div className="dev-content">
        <IFrame
          ref={iframeRef}
          src="https://7th.rhythmdoctor.top/Development/"
          className="dev-iframe"
          title="Developer Console"
        />
      </div>
    </div>
  )
}

export default DevPage
