class I18n {
  constructor() {
    this.currentLanguage = "zh-CN"
    this.translations = {}
    this.fallbackLanguage = "en-US"
    this.loadedLanguages = new Set()

    // 初始化默认语言
    this.init()
  }

  async init() {
    // 从本地存储获取用户设置的语言
    const savedLanguage = localStorage.getItem("app-language")
    if (savedLanguage) {
      this.currentLanguage = savedLanguage
    } else {
      // 自动检测系统语言
      const systemLanguage = this.detectSystemLanguage()
      this.currentLanguage = systemLanguage
    }

    // 加载默认语言
    await this.loadLanguage(this.currentLanguage)

    // 如果当前语言不是fallback语言，也加载fallback语言
    if (this.currentLanguage !== this.fallbackLanguage) {
      await this.loadLanguage(this.fallbackLanguage)
    }
  }

  detectSystemLanguage() {
    const systemLang = navigator.language || navigator.userLanguage
    const supportedLanguages = ["zh-CN", "en-US", "ja-JP", "ko-KR"]

    // 精确匹配
    if (supportedLanguages.includes(systemLang)) {
      return systemLang
    }

    // 语言代码匹配
    const langCode = systemLang.split("-")[0]
    const langMap = {
      zh: "zh-CN",
      en: "en-US",
      ja: "ja-JP",
      ko: "ko-KR",
    }

    return langMap[langCode] || "en-US"
  }

  async loadLanguage(language) {
    if (this.loadedLanguages.has(language)) {
      return
    }

    try {
      // 尝试从内置语言文件加载
      const response = await fetch(`/src/locales/${language}.json`)
      if (response.ok) {
        const translations = await response.json()
        this.translations[language] = translations
        this.loadedLanguages.add(language)
        return
      }
    } catch (error) {
      console.warn(`Failed to load built-in language ${language}:`, error)
    }

    // 尝试从外部语言文件加载
    try {
      const externalPath = `./languages/${language}.json`
      const response = await fetch(externalPath)
      if (response.ok) {
        const translations = await response.json()
        this.translations[language] = translations
        this.loadedLanguages.add(language)
        console.log(`Loaded external language file: ${language}`)
        return
      }
    } catch (error) {
      console.warn(`Failed to load external language ${language}:`, error)
    }

    console.error(`Failed to load language: ${language}`)
  }

  async setLanguage(language) {
    if (language === this.currentLanguage) {
      return
    }

    await this.loadLanguage(language)
    this.currentLanguage = language
    localStorage.setItem("app-language", language)

    // 触发语言变更事件
    window.dispatchEvent(
      new CustomEvent("languageChanged", {
        detail: { language },
      }),
    )
  }

  t(key, params = {}) {
    const keys = key.split(".")
    let value = this.translations[this.currentLanguage]

    // 尝试从当前语言获取翻译
    for (const k of keys) {
      if (value && typeof value === "object" && k in value) {
        value = value[k]
      } else {
        value = null
        break
      }
    }

    // 如果当前语言没有找到，尝试从fallback语言获取
    if (value === null && this.currentLanguage !== this.fallbackLanguage) {
      value = this.translations[this.fallbackLanguage]
      for (const k of keys) {
        if (value && typeof value === "object" && k in value) {
          value = value[k]
        } else {
          value = null
          break
        }
      }
    }

    // 如果还是没找到，返回key本身
    if (value === null) {
      console.warn(`Translation not found for key: ${key}`)
      return key
    }

    // 参数替换
    if (typeof value === "string" && Object.keys(params).length > 0) {
      return value.replace(/\{\{(\w+)\}\}/g, (match, param) => {
        return params[param] || match
      })
    }

    return value
  }

  getCurrentLanguage() {
    return this.currentLanguage
  }

  getSupportedLanguages() {
    return [
      { code: "zh-CN", name: "简体中文" },
      { code: "en-US", name: "English" },
      { code: "ja-JP", name: "日本語" },
      { code: "ko-KR", name: "한국어" },
    ]
  }

  async importLanguageFile(file) {
    try {
      const text = await file.text()
      const translations = JSON.parse(text)

      // 验证文件格式
      if (!this.validateLanguageFile(translations)) {
        throw new Error("Invalid language file format")
      }

      // 从文件名推断语言代码
      const fileName = file.name.replace(".json", "")
      const language = fileName.includes("-") ? fileName : `${fileName}-CUSTOM`

      this.translations[language] = translations
      this.loadedLanguages.add(language)

      console.log(`Imported language file: ${language}`)
      return language
    } catch (error) {
      console.error("Failed to import language file:", error)
      throw error
    }
  }

  validateLanguageFile(translations) {
    // 基本结构验证
    const requiredKeys = ["common", "app", "tools"]
    return requiredKeys.every((key) => key in translations)
  }

  exportLanguageFile(language = this.currentLanguage) {
    const translations = this.translations[language]
    if (!translations) {
      throw new Error(`Language ${language} not found`)
    }

    const blob = new Blob([JSON.stringify(translations, null, 2)], {
      type: "application/json",
    })

    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${language}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }
}

// 创建全局实例
const i18n = new I18n()

// 导出实例和便捷函数
export default i18n
export const t = (key, params) => i18n.t(key, params)
export const setLanguage = (language) => i18n.setLanguage(language)
export const getCurrentLanguage = () => i18n.getCurrentLanguage()
export const getSupportedLanguages = () => i18n.getSupportedLanguages()
