// 国际化使用示例

import { getCurrentLanguage, getErrorMessage, getLocalizedDateTime, getLocalizedNumber, getLocalizedCurrency } from './i18n'

// 在 JavaScript 文件中使用国际化的示例

// 1. 获取错误信息
export function showErrorMessage(errorKey) {
  // 根据当前语言显示相应的错误信息
  const message = getErrorMessage(errorKey)
  console.log(message)
  return message
}

// 2. 在 API 调用中使用
export async function apiWithErrorHandling() {
  try {
    // API 调用逻辑
    const response = await fetch('/api/data')
    return response
  } catch (error) {
    // 使用国际化的错误信息
    const errorMsg = getErrorMessage('networkError')
    throw new Error(errorMsg)
  }
}

// 3. 表单验证国际化
export function validateForm(formData) {
  const errors = []
  
  if (!formData.name) {
    errors.push(getErrorMessage('nameRequired'))
  }
  
  if (!formData.email) {
    errors.push(getErrorMessage('emailRequired'))
  }
  
  return errors
}

// 4. 日期时间格式化
export function formatDateForDisplay(date) {
  return getLocalizedDateTime(new Date(date))
}

// 5. 数字格式化
export function formatNumberForDisplay(num) {
  return getLocalizedNumber(num)
}

// 6. 货币格式化
export function formatCurrencyForDisplay(amount) {
  return getLocalizedCurrency(amount)
}

// 7. 条件渲染
export function getLocalizedContent() {
  const lang = getCurrentLanguage()
  
  if (lang === 'zh') {
    return {
      greeting: '你好，欢迎访问我们的系统！',
      description: '这是一个功能强大的管理系统。',
      features: ['用户管理', '数据分析', '报表生成']
    }
  } else {
    return {
      greeting: 'Hello, welcome to our system!',
      description: 'This is a powerful management system.',
      features: ['User Management', 'Data Analysis', 'Report Generation']
    }
  }
}

// 8. 确认对话框国际化
export function showDeleteConfirm(itemName) {
  const message = getErrorMessage('confirmDelete', { item: itemName })
  return confirm(message)
}

// 9. 成功消息国际化
export function showSuccessMessage(operation) {
  const message = getErrorMessage('operationSuccess')
  console.log(`${operation}: ${message}`)
}

// 10. 复杂消息模板
export function getComplexMessage(type, params = {}) {
  const lang = getCurrentLanguage()
  
  const templates = {
    zh: {
      welcome: '欢迎 {name}，您现在是第 {count} 位访问者',
      deadline: '任务截止日期为 {date}，还剩 {days} 天',
      quota: '您已使用 {used}GB，总共 {total}GB，剩余 {remaining}GB'
    },
    en: {
      welcome: 'Welcome {name}, you are the {count}th visitor',
      deadline: 'Task deadline is {date}, {days} days remaining',
      quota: 'You have used {used}GB of {total}GB, {remaining}GB remaining'
    }
  }
  
  let template = templates[lang][type] || type
  
  // 替换参数
  Object.keys(params).forEach(key => {
    template = template.replace(`{${key}}`, params[key])
  })
  
  return template
}

// 使用示例
export function exampleUsage() {
  // 基本错误信息
  console.log(getErrorMessage('networkError'))
  
  // 带参数的错误信息
  console.log(getComplexMessage('welcome', { name: 'John', count: 100 }))
  
  // 日期格式化
  console.log(formatDateForDisplay('2023-12-25'))
  
  // 数字格式化
  console.log(formatNumberForDisplay(1234567))
  
  // 货币格式化
  console.log(formatCurrencyForDisplay(1234.56))
  
  // 条件内容
  console.log(getLocalizedContent())
  
  // 确认对话框
  showDeleteConfirm('用户记录')
}