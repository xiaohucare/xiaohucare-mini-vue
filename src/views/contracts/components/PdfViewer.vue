<template>
  <div class="pdf-viewer">
    <!-- PDF控制工具栏 -->
    <div v-if="pdfSource" class="pdf-toolbar">
      <div class="toolbar-controls">
        <el-button-group>
          <el-button size="small" @click="prevPage" :disabled="pageNum <= 1" round>
            <el-icon><ArrowLeft /></el-icon> 上一页
          </el-button>
          <el-button size="small" round>第 {{ pageNum }} 页 / 共 {{ numPages || '-' }} 页</el-button>
          <el-button size="small" @click="nextPage" :disabled="pageNum >= numPages" round>
            下一页 <el-icon><ArrowRight /></el-icon>
          </el-button>
        </el-button-group>

        <div class="zoom-controls">
          <el-button size="small" @click="zoomOut" :disabled="scale <= MIN_SCALE" round>
            <el-icon><ZoomOut /></el-icon>
          </el-button>
          <span class="zoom-level">{{ zoomSlider }}%</span>
          <el-button size="small" @click="zoomIn" :disabled="scale >= MAX_SCALE" round>
            <el-icon><ZoomIn /></el-icon>
          </el-button>
          <el-slider
            v-model="zoomSlider"
            :min="MIN_SCALE * 100"
            :max="MAX_SCALE * 100"
            :step="10"
            class="zoom-slider"
            @change="handleZoomChange"
          />
        </div>
      </div>

      <div class="toolbar-actions">
        <el-button size="small" @click="fitToWidth" round>适合宽度</el-button>
        <el-button size="small" @click="fitToPage" round>适合页面</el-button>
        <el-button size="small" @click="rotatePdf" round>旋转 ↻</el-button>
        <el-button v-if="showDownload" size="small" @click="handleDownload" round>下载</el-button>
      </div>
    </div>

    <div ref="viewportEl" class="pdf-viewport">
      <div v-if="error" class="pdf-state state-error">
        <p>❌ {{ error }}</p>
        <el-button size="small" @click="reload" round>重试</el-button>
      </div>

      <div v-else-if="!pdfSource" class="pdf-state">
        <div class="welcome-content">
          <h2>📄 PDF 预览器</h2>
          <p>{{ pdfUrl || pdfFile ? 'PDF文件已准备就绪' : '选择一个PDF文件开始预览' }}</p>
          <label v-if="showFileInput" for="pdf-file" class="welcome-btn">选择PDF文件</label>
          <input v-if="showFileInput" id="pdf-file" type="file" accept=".pdf" class="file-input" @change="handleFileSelect" />
        </div>
      </div>

      <!-- 注意：有 source 就必须挂载嵌件，loading 只能用遮罩盖在上面；
           把嵌件写进 v-else 分支会造成“不渲染→不触发 loaded→永远转圈” -->
      <div v-else ref="pageEl" class="pdf-page" @touchstart="handleTouchStart" @touchmove="handleTouchMove" @touchend="handleTouchEnd" @wheel="handleWheel">
        <VuePdfEmbed
          :source="pdfSource"
          :page="pageNum"
          :scale="scale"
          :rotation="rotation"
          class="pdf-embed"
          @loaded="handleLoaded"
          @rendered="handleRendered"
          @progress="handleProgress"
          @loading-failed="handleLoadingFailed"
          @rendering-failed="handleRenderingFailed"
        />
      </div>

      <div v-if="loading && !error" class="pdf-loading-mask">
        <div class="spinner"></div>
        <p>{{ progressText }}</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import VuePdfEmbed from 'vue-pdf-embed'
import { ElMessage } from 'element-plus'

// 不额外引入 pdfjs-dist：vue-pdf-embed 自带 worker（内联为 data URL），
// 之前用 CDN 配置另一份 pdfjs 的 workerSrc，对本组件生效不了，还多打包了一份 pdf.js

const props = defineProps({
  // PDF文件URL
  pdfUrl: {
    type: String,
    default: ''
  },
  // PDF文件对象
  pdfFile: {
    type: File,
    default: null
  },
  // 是否显示下载按钮
  showDownload: {
    type: Boolean,
    default: true
  },
  // 是否显示文件选择器
  showFileInput: {
    type: Boolean,
    default: true
  },
  // 初始缩放比例
  initialScale: {
    type: Number,
    default: 1.2
  }
})

// 模板配置页依赖这两个事件感知文档加载结果
const emit = defineEmits(['loaded', 'error'])

// 缩放上下限：滑块、按钮、键盘、双指共用同一套。上限给到 3 倍，
// 2 倍时合同正文的小字在窄列里基本没法看，会误认为“放大没生效”
const MIN_SCALE = 0.5
const MAX_SCALE = 3

const pageNum = ref(1)
const numPages = ref(0)
const scale = ref(clampScale(props.initialScale))
const rotation = ref(0)
const loading = ref(false)
const error = ref('')
const pdfSource = ref('')
const localPdfUrl = ref('')
const zoomSlider = ref(Math.round(scale.value * 100))
const viewportEl = ref(null)
const pageEl = ref(null)
// vue-pdf-embed 会 emit progress（没有 error 事件），用下载字节数给出真实加载反馈
const progress = ref(null)

function clampScale(value) {
  const n = Number(value) || 1
  return Math.min(MAX_SCALE, Math.max(MIN_SCALE, Math.round(n * 10) / 10))
}

// 有字节进度就显示百分比，没进度时不要假装加载完成
const progressText = computed(() => {
  const p = progress.value
  if (!p || !p.total) return '正在加载PDF...'
  return `正在加载PDF... ${Math.min(99, Math.round((p.loaded / p.total) * 100))}%`
})

// ── 锚点缩放：放大后 “正在看的位置” 保持不动 ──────────────────────
// DOM 当前真正呈现的缩放值。pdf.js 重绘是异步的，连续滚动滚轮/双指缩放时
// scale 已经变了但画面还是旧尺寸，用 scale 反推页面坐标会算错、导致视野飘移
const renderedScale = ref(scale.value)
// 待还原的锚点：{ 页面内 1:1 坐标, 采集时的屏幕坐标, 采集时间 }
const pendingAnchor = ref(null)
const ANCHOR_TTL = 1200

// 不传坐标就锁定视口中心（按钮/键盘/滑块）；传入指针位则锁定光标（滚轮/双指）
const captureAnchor = (clientX, clientY) => {
  const page = pageEl.value
  const viewport = viewportEl.value
  if (!page || !viewport) return null
  const pageRect = page.getBoundingClientRect()
  const vpRect = viewport.getBoundingClientRect()
  const x = clientX !== undefined ? clientX : vpRect.left + vpRect.width / 2
  const y = clientY !== undefined ? clientY : vpRect.top + vpRect.height / 2
  return {
    px: (x - pageRect.left) / renderedScale.value,
    py: (y - pageRect.top) / renderedScale.value,
    clientX: x,
    clientY: y,
    at: performance.now()
  }
}

const restoreAnchor = () => {
  const anchor = pendingAnchor.value
  const page = pageEl.value
  const viewport = viewportEl.value
  pendingAnchor.value = null
  if (!anchor || !page || !viewport) return
  // 重绘跟不上就放弃还原，避免之后的渲染事件拿着旧锚点乱跳
  if (performance.now() - anchor.at > ANCHOR_TTL) return
  const pageRect = page.getBoundingClientRect()
  // 直接把差值加到滚动量上：内容比视口窄时浏览器会自然归位到 0
  viewport.scrollLeft += pageRect.left + anchor.px * scale.value - anchor.clientX
  viewport.scrollTop += pageRect.top + anchor.py * scale.value - anchor.clientY
}

// value 为目标缩放；anchor 为触发缩放的屏幕坐标（可选）
function applyScale(value, anchor) {
  const next = clampScale(value)
  if (next === scale.value) {
    // 被上下限或取整拉回原值时也要把滑块对回来，否则读数会停在拖拽中间值
    zoomSlider.value = Math.round(next * 100)
    return
  }
  // 先按当前已呈现的缩放采集锚点，新尺寸渲染完成后在 handleRendered 里还原
  pendingAnchor.value = captureAnchor(anchor && anchor.x, anchor && anchor.y)
  scale.value = next
  zoomSlider.value = Math.round(next * 100)
}

// 滑块值 → 缩放（scale 反向同步滑块，保证两条路径都只有一份真相）
watch(scale, value => {
  zoomSlider.value = Math.round(value * 100)
})

watch(() => props.initialScale, value => {
  applyScale(value)
})

watch(() => props.pdfUrl, (newUrl, oldUrl) => {
  if (!newUrl || newUrl === oldUrl) {
    // URL 被清空时要主动复位，否则会一直显示上一份文档
    if (!newUrl) reset()
    return
  }
  loadPdfFromUrl(newUrl)
})

watch(() => props.pdfFile, (newFile, oldFile) => {
  if (newFile && newFile !== oldFile) loadPdfFromFile(newFile)
})

// 导航功能
const prevPage = () => {
  if (pageNum.value > 1) pageNum.value--
}

const nextPage = () => {
  if (pageNum.value < numPages.value) pageNum.value++
}

// 缩放功能
const zoomIn = () => applyScale(scale.value + 0.1)
const zoomOut = () => applyScale(scale.value - 0.1)
const handleZoomChange = (value) => applyScale(value / 100)

// 以渲染结果反推 1:1 的页面尺寸：纸张尺寸五花八门，按 A4 估算会算错（而且旋转后的宽高是互换的）
const measurePage = () => {
  const canvas = viewportEl.value && viewportEl.value.querySelector('canvas')
  if (!canvas || !canvas.clientWidth || !canvas.clientHeight) return null
  return {
    width: canvas.clientWidth / scale.value,
    height: canvas.clientHeight / scale.value
  }
}

// 适合页面宽度
const fitToWidth = () => {
  const page = measurePage()
  const viewport = viewportEl.value
  if (!page || !viewport) return
  applyScale((viewport.clientWidth - 32) / page.width)
}

// 适合整个页面
const fitToPage = () => {
  const page = measurePage()
  const viewport = viewportEl.value
  if (!page || !viewport) return
  const ratio = Math.min((viewport.clientWidth - 32) / page.width, (viewport.clientHeight - 32) / page.height)
  applyScale(ratio * 0.98)
}

// 旋转PDF
const rotatePdf = () => {
  rotation.value = (rotation.value + 90) % 360
}

// 释放本地对象URL
const revokeLocalUrl = () => {
  if (localPdfUrl.value) {
    URL.revokeObjectURL(localPdfUrl.value)
    localPdfUrl.value = ''
  }
}

// 从URL加载PDF
const loadPdfFromUrl = async (url) => {
  error.value = ''
  if (!url) {
    reset()
    return
  }
  try {
    // 相对地址（如 /profile/upload/xxx.pdf）也允许：交给浏览器按当前站点解析
    if (!/^(https?:)?\/\//.test(url) && !url.startsWith('/')) throw new Error('无效的PDF URL格式')
    revokeLocalUrl()
    pdfSource.value = url
    numPages.value = 0
    pageNum.value = 1
    progress.value = null
    loading.value = true
  } catch (err) {
    error.value = '加载PDF失败: ' + (err.message || String(err))
    emit('error', err)
  }
}

// 文件处理
const handleFileSelect = (event) => {
  const file = event.target.files[0]
  if (file && file.type === 'application/pdf') {
    loadPdfFromFile(file)
  } else {
    error.value = '请选择有效的PDF文件'
    ElMessage.error('请选择有效的PDF文件')
  }
}

const loadPdfFromFile = async (file) => {
  error.value = ''
  try {
    revokeLocalUrl()
    localPdfUrl.value = URL.createObjectURL(file)
    pdfSource.value = localPdfUrl.value
    numPages.value = 0
    pageNum.value = 1
    progress.value = null
    loading.value = true
  } catch (err) {
    error.value = '加载PDF失败: ' + (err.message || String(err))
    ElMessage.error('PDF文件加载失败')
    emit('error', err)
  }
}

// 文档加载完成
const handleLoaded = (pdf) => {
  numPages.value = pdf.numPages
  loading.value = false
  error.value = ''
  progress.value = null
  pendingAnchor.value = null
  renderedScale.value = scale.value
  emit('loaded', pdf)
}

// 某一页渲染完成：此时才能量到真实页面尺寸
const handleRendered = () => {
  loading.value = false
  // 新缩放刚落到 DOM 上，先校正视野，再更新“已呈现缩放”
  restoreAnchor()
  renderedScale.value = scale.value
}

const handleProgress = (event) => {
  progress.value = event && event.total ? event : null
}

const describeError = (payload, fallback) => {
  if (!payload) return fallback
  if (typeof payload === 'string') return payload
  return payload.message || (payload.error && payload.error.message) || fallback
}

// 文档拉取失败（404、跨域、不是 PDF 等）
const handleLoadingFailed = (payload) => {
  loading.value = false
  progress.value = null
  pendingAnchor.value = null
  error.value = 'PDF加载失败: ' + describeError(payload, '未知错误')
  emit('error', (payload && payload.error) || payload || new Error(error.value))
}

// 页面绘制失败
const handleRenderingFailed = (payload) => {
  loading.value = false
  progress.value = null
  pendingAnchor.value = null
  error.value = 'PDF渲染失败: ' + describeError(payload, '未知错误')
  emit('error', (payload && payload.error) || payload || new Error(error.value))
}

// 下载功能
const handleDownload = () => {
  const href = localPdfUrl.value || pdfSource.value
  if (!href) {
    ElMessage.warning('没有可下载的PDF文件')
    return
  }
  const link = document.createElement('a')
  link.href = href
  link.download = 'contract.pdf'
  // 跨域地址 download 属性会被浏览器忽略，退化为打开/下载由服务端 Content-Disposition 决定
  if (/^https?:\/\//.test(href) && !localPdfUrl.value) link.target = '_blank'
  link.click()
}

// 重置功能
const reset = () => {
  pdfSource.value = ''
  numPages.value = 0
  pageNum.value = 1
  rotation.value = 0
  error.value = ''
  loading.value = false
  progress.value = null
  pendingAnchor.value = null
  revokeLocalUrl()
}

// 重试：优先按原来源重新加载
const reload = () => {
  if (props.pdfUrl) loadPdfFromUrl(props.pdfUrl)
  else if (props.pdfFile) loadPdfFromFile(props.pdfFile)
  else reset()
}

// 触摸缩放支持
const touchData = { startDistance: 0, startScale: 1 }

const handleTouchStart = (event) => {
  if (event.touches.length !== 2) return
  const [t1, t2] = event.touches
  touchData.startDistance = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY)
  touchData.startScale = scale.value
}

const handleTouchMove = (event) => {
  if (event.touches.length !== 2 || !pdfSource.value) return
  event.preventDefault()
  const [t1, t2] = event.touches
  const distance = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY)
  if (touchData.startDistance > 0) {
    // 两指中心作为锚点，捏合时不会“跑出两指中间的内容”
    const mid = { x: (t1.clientX + t2.clientX) / 2, y: (t1.clientY + t2.clientY) / 2 }
    applyScale(touchData.startScale * (distance / touchData.startDistance), mid)
  }
}

const handleTouchEnd = () => {
  touchData.startDistance = 0
}

// 触控板双指/Ctrl+滚轮缩放，普通滚动不受影响；以光标为锚点，指哪放大哪
const handleWheel = (event) => {
  if (!pdfSource.value || !event.ctrlKey) return
  event.preventDefault()
  applyScale(scale.value + (event.deltaY < 0 ? 0.1 : -0.1), { x: event.clientX, y: event.clientY })
}

// 键盘快捷键
const handleKeydown = (event) => {
  if (!pdfSource.value) return
  // 输入框/文本域里按方向键应该移动光标，不能被当成翻页
  const tag = event.target && event.target.tagName
  if (tag === 'INPUT' || tag === 'TEXTAREA' || (event.target && event.target.isContentEditable)) return

  switch (event.key) {
    case 'ArrowLeft':
      prevPage()
      break
    case 'ArrowRight':
      nextPage()
      break
    case '+':
    case '=':
      event.preventDefault()
      zoomIn()
      break
    case '-':
      event.preventDefault()
      zoomOut()
      break
  }
}

// 生命周期
onMounted(() => {
  window.addEventListener('keydown', handleKeydown)
  if (props.pdfUrl) {
    loadPdfFromUrl(props.pdfUrl)
  } else if (props.pdfFile) {
    loadPdfFromFile(props.pdfFile)
  }
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown)
  revokeLocalUrl()
})
</script>

<style scoped>
.pdf-viewer {
  display: flex;
  flex-direction: column;
  /* 由父容器决定高度：写死 100vh 会撑破 600px 的预览区（溢出弹窗）或被 overflow:hidden 裁掉 */
  height: 100%;
  min-height: 480px;
  background: #f5f5f5;
  -webkit-overflow-scrolling: touch;
}

.pdf-toolbar {
  flex: none;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
  padding: 10px 12px;
  background: #fff;
  border-bottom: 1px solid #eef0f3;
}

.toolbar-controls,
.toolbar-actions {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
}

.toolbar-controls {
  flex: 1;
}

.zoom-controls {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 2px 8px;
  background: #f8f9fa;
  border-radius: 6px;
}

.zoom-slider {
  width: 140px;
  margin: 0 4px;
}

.zoom-level {
  min-width: 44px;
  text-align: center;
  font-size: 13px;
  font-weight: 600;
  color: #333;
}

/* 类名刻意避开 .pdf-container：外部宿主容器同名会让尺寸计算拿到别人的容器 */
.pdf-viewport {
  flex: 1;
  min-height: 0;
  overflow: auto;
  display: flex;
  /* 两个轴都不能用居中对齐：内容超出容器时，flex 居中会把多出来的部分推到
     scrollLeft/scrollTop < 0 的不可达区域，放大后左边和上边直接被裁掉 */
  justify-content: flex-start;
  align-items: flex-start;
  padding: 16px;
  position: relative;
}

.pdf-loading-mask {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: rgba(245, 245, 245, 0.9);
  color: #666;
}

.pdf-state {
  margin: auto;
  text-align: center;
  color: #666;
  padding: 24px;
}

.state-error {
  color: #e74c3c;
  background: #fef0f0;
  border-radius: 10px;
}

.spinner {
  width: 44px;
  height: 44px;
  margin: 0 auto 14px;
  border: 4px solid #f3f3f3;
  border-top-color: #667eea;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.welcome-content {
  background: #fff;
  padding: 28px 24px;
  border-radius: 14px;
  box-shadow: 0 6px 22px rgba(0, 0, 0, 0.08);
  max-width: 90%;
}

.welcome-content h2 {
  color: #333;
  margin-bottom: 10px;
  font-size: 20px;
  font-weight: 600;
}

.welcome-content p {
  color: #666;
  margin-bottom: 18px;
  font-size: 14px;
}

.welcome-btn {
  display: inline-block;
  padding: 8px 18px;
  border-radius: 8px;
  background: #667eea;
  color: #fff;
  font-size: 14px;
  cursor: pointer;
}

.file-input {
  display: none;
}

.pdf-page {
  flex: none;
  /* 宽度未被撑满时靠 auto 外边距居中；放大超出容器后 auto 归零，回到左对齐并能正常横向滚动 */
  margin-inline: auto;
}

.pdf-embed {
  background: #fff;
  border-radius: 6px;
  box-shadow: 0 4px 18px rgba(0, 0, 0, 0.08);
}

@media (max-width: 768px) {
  .pdf-toolbar {
    padding: 8px;
  }

  .toolbar-controls,
  .toolbar-actions {
    width: 100%;
    justify-content: space-between;
  }

  .zoom-slider {
    width: 90px;
  }

  .pdf-viewport {
    padding: 8px;
  }
}
</style>
