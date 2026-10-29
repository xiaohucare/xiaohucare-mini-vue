# 国际化 (i18n) 使用指南

## 项目结构

```
src/
├── i18n/
│   ├── index.js          # i18n 配置文件
│   ├── elementLang.js    # Element Plus 语言配置
│   ├── langs/           # 语言资源文件夹
│   │   ├── zh.js        # 中文语言包
│   │   └── en.js        # 英文语言包
│   └── README.md        # 使用说明
├── composables/
│   └── useI18n.js      # 国际化组合式函数
└── plugins/
    └── i18n.js         # i18n 插件
```

## 基本使用

### 1. 在组件中使用

```vue
<template>
  <div>
    <!-- 方式1：直接使用 $t -->
    <h1>{{ $t('common.title') }}</h1>
    
    <!-- 方式2：在属性中使用 -->
    <el-button :placeholder="$t('common.pleaseInput')">
      {{ $t('common.save') }}
    </el-button>
    
    <!-- 方式3：带参数 -->
    <p>{{ $t('common.welcome', { name: 'John' }) }}</p>
  </div>
</template>

<script setup>
import { useI18n } from 'vue-i18n'
import { useLanguage } from '@/composables/useI18n'

const { t } = useI18n()
const { switchLanguage, currentLanguage } = useLanguage()

// 调用切换语言
const changeToEnglish = () => {
  switchLanguage('en')
}
</script>
```

### 2. 在 JavaScript/TypeScript 文件中使用

```javascript
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

// 在函数中使用
function showMessage() {
  ElMessage.success(t('common.success'))
  ElMessage.error(t('common.error'))
}
```

## 语言包结构

语言包按功能模块组织，支持嵌套结构：

```javascript
// zh.js
export default {
  // 通用
  common: {
    confirm: '确定',
    cancel: '取消',
    save: '保存',
    // ...
  },
  
  // 导航栏
  navbar: {
    sourceCode: '源码地址',
    documentation: '文档地址',
    // ...
  },
  
  // 访客管理
  visitors: {
    title: '访客管理',
    todayVisits: '今日来访',
    // ...
  }
}
```

## 切换语言

### 方式1：使用组合式函数

```javascript
import { useLanguage } from '@/composables/useI18n'

const { switchLanguage } = useLanguage()

// 切换到英文
switchLanguage('en')

// 切换到中文
switchLanguage('zh')
```

### 方式2：直接操作 locale

```javascript
import { useI18n } from 'vue-i18n'

const { locale } = useI18n()

locale.value = 'en'
```

## 添加新的翻译文本

### 1. 在语言包中添加

```javascript
// zh.js
export default {
  // 添加新的模块
  newModule: {
    title: '新模块',
    description: '这是新模块的描述'
  }
}

// en.js
export default {
  // 对应的英文翻译
  newModule: {
    title: 'New Module',
    description: 'This is the description of the new module'
  }
}
```

### 2. 在组件中使用

```vue
<template>
  <h2>{{ $t('newModule.title') }}</h2>
  <p>{{ $t('newModule.description') }}</p>
</template>
```

## Element Plus 组件国际化

Element Plus 组件会根据当前语言自动切换显示文本：

```javascript
// 中文环境
<el-date-picker :placeholder="$t('common.pleaseSelectDate')" />

// 英文环境会自动显示英文的日期选择器界面
```

## 最佳实践

### 1. 命名规范

- 使用小驼峰命名：`userName` 而不是 `user_name`
- 按功能模块组织：`navbar.title`, `visitors.list`
- 使用有意义的名称：`confirmDelete` 而不是 `btn1`

### 2. 参数化文本

```javascript
// ❌ 不推荐
welcomeMessage: '欢迎 John'

// ✅ 推荐
welcomeMessage: '欢迎 {name}',

// 使用时
$t('welcomeMessage', { name: 'John' })
```

### 3. 复数形式处理

```javascript
// 英文需要处理复数
items: 'no items | {n} item | {n} items',

// 使用时
$t('items', 0)  // no items
$t('items', 1)  // 1 item
$t('items', 5)  // 5 items
```

### 4. 文本长度考虑

- 中文通常比英文短
- 英文文本可能需要更多的空间
- 考虑 UI 布局的适应性

## 调试技巧

### 1. 查看缺失的翻译

```javascript
// 在浏览器控制台查看
console.log(this.$t('non.existent.key'))
// 输出: non.existent.key
```

### 2. 列出所有可用的翻译键

```javascript
import { useI18n } from 'vue-i18n'

const { messages } = useI18n()
console.log(Object.keys(messages.value.zh))
```

## 已配置的请求拦截器国际化

### 自动功能

项目已配置以下国际化功能：

1. **请求头自动添加语言参数**
   ```javascript
   // 每个请求自动添加
   Accept-Language: 'zh' // 或 'en'
   ```

2. **错误信息国际化**
   - 登录过期提示
   - 网络连接错误
   - 请求超时
   - 下载错误
   - 系统提示信息

3. **使用工具函数**
   ```javascript
   import { getErrorMessage, getCurrentLanguage } from '@/utils/i18n'
   
   // 获取当前语言的错误信息
   const errorMsg = getErrorMessage('networkError')
   ```

### 支持的错误信息类型

| 键值 | 中文 | 英文 |
|------|------|------|
| sessionExpired | 登录状态已过期... | Your login has expired... |
| networkError | 后端接口连接异常 | Backend API connection error |
| requestTimeout | 系统接口请求超时 | System API request timeout |
| downloadError | 下载文件出现错误... | Error occurred while downloading... |
| operationSuccess | 操作成功 | Operation successful |
| operationFailed | 操作失败 | Operation failed |

## 常见问题

### Q: 如何处理动态导入的语言包？

A: 可以使用动态 import 来按需加载语言包：

```javascript
const loadLanguageAsync = async (lang) => {
  const messages = await import(`./langs/${lang}.js`)
  i18n.global.setLocaleMessage(lang, messages.default)
  i18n.global.locale.value = lang
}
```

### Q: 如何处理日期和数字格式化？

A: 使用提供的工具函数或 Intl API：

```javascript
import { getLocalizedDateTime, getLocalizedNumber } from '@/utils/i18n'

// 格式化日期时间
const formattedDate = getLocalizedDateTime(new Date())

// 格式化数字
const formattedNumber = getLocalizedNumber(1234.56)

// 或者直接使用 Intl API
new Intl.DateTimeFormat(locale.value).format(new Date())
new Intl.NumberFormat(locale.value).format(1234.56)
```

### Q: 如何添加新的错误信息？

A: 在 `utils/i18n.js` 中的 `errorMessages` 对象中添加：

```javascript
const errorMessages = {
  zh: {
    // 添加新的中文错误信息
    newError: '新的错误信息'
  },
  en: {
    // 添加对应的英文错误信息
    newError: 'New error message'
  }
}
```