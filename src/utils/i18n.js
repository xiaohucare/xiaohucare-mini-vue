// 国际化工具函数

// 获取当前语言设置
export const getCurrentLanguage = () => {
  return localStorage.getItem('language') || 'zh'
}

// 设置语言
export const setCurrentLanguage = (lang) => {
  localStorage.setItem('language', lang)
}

// 判断是否为中文
export const isChinese = () => {
  return getCurrentLanguage() === 'zh'
}

// 判断是否为英文
export const isEnglish = () => {
  return getCurrentLanguage() === 'en'
}

// 获取错误信息
export const getErrorMessage = (key, params = {}) => {
  const lang = getCurrentLanguage()
  const errorMessages = {
    zh: {
      sessionExpired: '登录状态已过期，您可以继续留在该页面，或者重新登录',
      systemTip: '系统提示',
      reloginBtn: '重新登录',
      cancelBtn: '取消',
      invalidSession: '无效的会话，或者会话已过期，请重新登录。',
      networkError: '后端接口连接异常',
      requestTimeout: '系统接口请求超时',
      downloadError: '下载文件出现错误，请联系管理员！',
      downloading: '正在下载数据，请稍候',
      operationSuccess: '操作成功',
      operationFailed: '操作失败',
      confirmDelete: '确定要删除这条记录吗？',
      deleteSuccess: '删除成功',
      dataProcessing: '数据正在处理，请勿重复提交',
      fileTooLarge: '请求数据大小超出允许的5M限制，无法进行防重复提交验证。'
    },
    en: {
      sessionExpired: 'Your login has expired, you can stay on this page or log in again',
      systemTip: 'System Notice',
      reloginBtn: 'Re-login',
      cancelBtn: 'Cancel',
      invalidSession: 'Invalid session or session has expired, please log in again.',
      networkError: 'Backend API connection error',
      requestTimeout: 'System API request timeout',
      downloadError: 'Error occurred while downloading file, please contact administrator!',
      downloading: 'Downloading data, please wait...',
      operationSuccess: 'Operation successful',
      operationFailed: 'Operation failed',
      confirmDelete: 'Are you sure to delete this record?',
      deleteSuccess: 'Delete successful',
      dataProcessing: 'Data is being processed, please do not submit repeatedly',
      fileTooLarge: 'Request data size exceeds the allowed 5M limit, cannot perform duplicate submission verification.'
    }
  }
  
  let message = errorMessages[lang][key] || key
  
  // 支持参数替换
  if (params && Object.keys(params).length > 0) {
    Object.keys(params).forEach(param => {
      message = message.replace(`{${param}}`, params[param])
    })
  }
  
  return message
}

// 获取格式化的日期时间
export const getLocalizedDateTime = (date) => {
  const lang = getCurrentLanguage()
  const options = {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  }
  
  if (lang === 'en') {
    return date.toLocaleString('en-US', options)
  } else {
    return date.toLocaleString('zh-CN', options)
  }
}

// 获取格式化的数字
export const getLocalizedNumber = (num) => {
  const lang = getCurrentLanguage()
  return new Intl.NumberFormat(lang === 'en' ? 'en-US' : 'zh-CN').format(num)
}

// 获取格式化的货币
export const getLocalizedCurrency = (amount, currency = 'CNY') => {
  const lang = getCurrentLanguage()
  const options = {
    style: 'currency',
    currency: currency
  }
  
  if (lang === 'en' && currency === 'CNY') {
    options.currency = 'USD' // 英文环境默认显示美元
  }
  
  return new Intl.NumberFormat(lang === 'en' ? 'en-US' : 'zh-CN', options).format(amount)
}