"use client"

import { useRef, useState, forwardRef, useImperativeHandle, useEffect } from "react"
import i18n, { t } from "../utils/i18n"
import "./IFrame.css"

// 全局当前活跃的 IFrame 引用
let currentActiveIFrame = null

// 全局 API 函数
export const navigateIFrame = (action) => {
  if (!currentActiveIFrame) {
    console.log("当前页面没有活跃的 IFrame")
    return false
  }

  try {
    switch (action) {
      case "back":
        const contentWindow = currentActiveIFrame.getContentWindow()
        if (contentWindow && contentWindow.history) {
          contentWindow.history.back()
          return true
        }
        break
      case "forward":
        const forwardWindow = currentActiveIFrame.getContentWindow()
        if (forwardWindow && forwardWindow.history) {
          forwardWindow.history.forward()
          return true
        }
        break
      case "refresh":
        currentActiveIFrame.reload()
        return true
      default:
        console.log("未知的导航操作:", action)
        return false
    }
  } catch (error) {
    console.log("导航操作失败:", error.message)
    // 如果跨域限制导致操作失败，至少可以刷新
    if (action === "refresh") {
      currentActiveIFrame.reload()
      return true
    }
    return false
  }
}

// 获取当前活跃的 IFrame 信息
export const getCurrentIFrameInfo = () => {
  if (!currentActiveIFrame) {
    return null
  }

  try {
    return {
      url: currentActiveIFrame.getCurrentURL(),
      canGoBack: true, // 简化处理，实际可以通过 history 检查
      canGoForward: true, // 简化处理，实际可以通过 history 检查
    }
  } catch (error) {
    return {
      url: "Unknown (Cross-origin)",
      canGoBack: false,
      canGoForward: false,
    }
  }
}

const IFrame = forwardRef(
  (
    {
      src,
      className = "",
      style = {},
      onLoad,
      onError,
      title = "",
      allowFullScreen = false,
      sandbox = "",
      loading = "lazy",
    },
    ref,
  ) => {
    const iframeRef = useRef(null)
    const [isLoading, setIsLoading] = useState(true)
    const [hasError, setHasError] = useState(false)
    const [errorMessage, setErrorMessage] = useState("")
    const [language, setLanguage] = useState(i18n.getCurrentLanguage())

    // 设置安全的sandbox权限，防止iframe操作顶层窗口
    const getSafeSandbox = (customSandbox) => {
      // 默认安全权限：允许脚本、同源请求、表单、弹窗，但禁止顶层导航
      const defaultSandbox = "allow-scripts allow-same-origin allow-forms allow-popups allow-presentation"
      
      // 如果用户自定义了sandbox，使用用户的设置
      if (customSandbox) {
        return customSandbox
      }
      
      return defaultSandbox
    }

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

    const handleLoad = () => {
      setIsLoading(false)
      setHasError(false)
      onLoad && onLoad()
    }

    const handleError = () => {
      setIsLoading(false)
      setHasError(true)
      setErrorMessage(t("messages.networkError"))
      onError && onError()
    }

    // 重新加载方法
    const reload = () => {
      const iframe = iframeRef.current
      if (iframe) {
        setIsLoading(true)
        setHasError(false)
        iframe.src = iframe.src
      }
    }

    // 获取当前 URL
    const getCurrentURL = () => {
      const iframe = iframeRef.current
      try {
        return iframe ? iframe.contentWindow.location.href : src
      } catch (e) {
        // 跨域时无法访问，返回原始 src
        return src
      }
    }

    // 获取 iframe 的 contentWindow
    const getContentWindow = () => {
      const iframe = iframeRef.current
      return iframe ? iframe.contentWindow : null
    }

    // 获取 iframe 的 contentDocument
    const getContentDocument = () => {
      const iframe = iframeRef.current
      return iframe ? iframe.contentDocument : null
    }

    // 创建控制对象
    const controlObject = {
      reload,
      getCurrentURL,
      getContentWindow,
      getContentDocument,
      iframe: iframeRef.current,
    }

    // 将方法暴露给父组件
    useImperativeHandle(ref, () => controlObject)

    // 组件挂载时设置为当前活跃的 IFrame，卸载时清除
    useEffect(() => {
      currentActiveIFrame = controlObject

      return () => {
        if (currentActiveIFrame === controlObject) {
          currentActiveIFrame = null
        }
      }
    }, [])

    // 当 iframe 元素变化时更新控制对象
    useEffect(() => {
      controlObject.iframe = iframeRef.current
      if (currentActiveIFrame === controlObject) {
        currentActiveIFrame = controlObject
      }
    }, [iframeRef.current])

    return (
      <div className={`iframe-container ${className}`} style={style}>
        {/* 加载指示器 */}
        {isLoading && (
          <div className="iframe-loading">
            <div className="loading-spinner"></div>
            <span>{t("common.loading")}</span>
          </div>
        )}

        {/* 错误显示 */}
        {hasError && (
          <div className="iframe-error">
            <div className="error-icon">⚠️</div>
            <h3>{t("common.error")}</h3>
            <p>{errorMessage}</p>
            <button onClick={reload} className="retry-button">
              {t("tools.retry")}
            </button>
          </div>
        )}

        {/* IFrame 元素 */}
        <iframe
          ref={iframeRef}
          src={src}
          title={title}
          className={`iframe-element ${isLoading ? "loading" : ""} ${hasError ? "error" : ""}`}
          onLoad={handleLoad}
          onError={handleError}
          allowFullScreen={allowFullScreen}
          sandbox={getSafeSandbox(sandbox)}
          loading={loading}
          cache="no-cache"
          style={{
            width: "100%",
            height: "100%",
            border: "none",
            display: hasError ? "none" : "block",
            opacity: isLoading ? 0 : 1,
            transition: "opacity 0.3s ease",
          }}
        />
      </div>
    )
  },
)

IFrame.displayName = "IFrame"

export default IFrame
