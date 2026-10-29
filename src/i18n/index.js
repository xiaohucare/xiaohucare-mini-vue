import { createI18n } from 'vue-i18n'
import zh from './langs/zh'
import en from './langs/en'

const i18n = createI18n({
  legacy: false, // 使用 Composition API 模式
  locale: localStorage.getItem('language') || 'zh', // 默认使用中文
  fallbackLocale: 'zh', // 回退语言
  messages: {
    zh,
    en
  }
})

export default i18n