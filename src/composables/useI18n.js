import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

export function useLanguage() {
  const { locale, t } = useI18n()

  // 当前语言
  const currentLanguage = computed(() => locale.value)

  // 切换语言
  const switchLanguage = (lang) => {
    locale.value = lang
    localStorage.setItem('language', lang)
  }

  // 获取翻译文本
  const translate = (key, params = {}) => {
    return t(key, params)
  }

  // 切换到英文
  const switchToEnglish = () => {
    switchLanguage('en')
  }

  // 切换到中文
  const switchToChinese = () => {
    switchLanguage('zh')
  }

  // 是否为中文
  const isChinese = computed(() => locale.value === 'zh')

  // 是否为英文
  const isEnglish = computed(() => locale.value === 'en')

  return {
    currentLanguage,
    switchLanguage,
    translate: t,
    switchToEnglish,
    switchToChinese,
    isChinese,
    isEnglish,
    t
  }
}