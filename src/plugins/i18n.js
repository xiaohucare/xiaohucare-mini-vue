import { getCurrentInstance } from 'vue'
import { useI18n } from 'vue-i18n'
import { elementLocaleMap } from '@/i18n/elementLang'

// 动态切换 Element Plus 语言
export function switchElementLocale(locale) {
  const app = getCurrentInstance()?.appContext.app
  if (app && elementLocaleMap[locale]) {
    // 重新配置 Element Plus 的语言
    app.config.globalProperties.$ELEMENT = {
      ...app.config.globalProperties.$ELEMENT,
      locale: elementLocaleMap[locale]
    }
  }
}

// 组合式函数
export function useGlobalI18n() {
  const { locale, t } = useI18n()

  const changeLanguage = (lang) => {
    locale.value = lang
    localStorage.setItem('language', lang)
    switchElementLocale(lang)
  }

  return {
    locale,
    t,
    changeLanguage
  }
}