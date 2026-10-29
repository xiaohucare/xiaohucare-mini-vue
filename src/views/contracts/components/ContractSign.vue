<template>
  <div class="contract-sign">
    <el-card shadow="never">
      <template #header>
        <div class="card-header">
          <span>合同签署</span>
          <el-button type="primary" :loading="submitting" @click="handleSign" round>确认签署</el-button>
        </div>
      </template>
      
      <!-- 签署信息 -->
      <el-descriptions title="签署信息" :column="2" border style="margin-bottom: 20px;">
        <el-descriptions-item label="合同编号">{{ contract.contractNo || '-' }}</el-descriptions-item>
        <el-descriptions-item label="长者姓名">{{ contract.residentName || '-' }}</el-descriptions-item>
        <el-descriptions-item label="协议名称">{{ contract.templateName || '-' }}</el-descriptions-item>
        <el-descriptions-item label="当前状态">
          <el-tag :type="getContractStatusTagType(contract.status)" effect="plain" round>
            {{ getContractStatusName(contract.status) || '-' }}
          </el-tag>
        </el-descriptions-item>
      </el-descriptions>
      
      <el-row :gutter="20">
        <!-- 左侧：合同预览 -->
        <el-col :span="16">
          <div class="pdf-preview" style="border: 1px solid #ddd; padding: 20px; background: #fff; height: 600px; overflow: hidden;">
            <PdfViewer 
              v-if="pdfUrl"
              :pdf-url="pdfUrl"
              :show-download="true"
              :show-file-input="false"
              :initial-scale="1.0"
            />
            <el-empty v-else description="该合同暂未上传 PDF 文件" />
          </div>
        </el-col>
        
        <!-- 右侧：签署操作 -->
        <el-col :span="8">
          <el-card shadow="never">
            <template #header>
              <span>签署操作</span>
            </template>
            
            <!-- 签名区域 -->
            <div class="sign-block">
              <h4>老人签名</h4>
              <div 
                ref="signaturePad" 
                class="signature-pad"
                @pointerdown="startDrawing"
                @pointermove="draw"
                @pointerup="stopDrawing"
                @pointercancel="stopDrawing"
              >
                <canvas ref="signatureCanvas" class="signature-canvas"></canvas>
                <div v-if="!hasSignature" class="signature-placeholder">请在此处签名</div>
              </div>
              <div class="sign-actions">
                <el-button size="small" :disabled="!hasSignature" @click="undoStroke" round>撤销上一笔</el-button>
                <el-button size="small" :disabled="!hasSignature" @click="clearSignature" round>清除签名</el-button>
              </div>
            </div>
            
            <!-- 签署确认 -->
            <div style="margin-bottom: 20px;">
              <h4>签署确认</h4>
              <el-form :model="signForm" :rules="signRules" ref="signFormRef">
                <el-form-item label="签署日期" prop="signDate">
                  <el-date-picker
                    v-model="signForm.signDate"
                    type="date"
                    placeholder="选择签署日期"
                    value-format="YYYY-MM-DD"
                    style="width: 100%"
                  />
                </el-form-item>
                <el-form-item label="签署备注" prop="remarks">
                  <el-input
                    v-model="signForm.remarks"
                    type="textarea"
                    placeholder="请输入签署备注（可选）"
                    :rows="3"
                  />
                </el-form-item>
              </el-form>
            </div>
            
            <!-- 签署提示 -->
            <el-alert
              title="签署提示"
              type="info"
              description="请仔细阅读合同内容，确认无误后再进行签署。签署后合同将具有法律效力。"
              :closable="false"
              show-icon
            />
          </el-card>
        </el-col>
      </el-row>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onUnmounted, nextTick, getCurrentInstance } from 'vue'
import PdfViewer from './PdfViewer.vue'
import { signContract } from '@/api/contracts'
import { getContractStatusName, getContractStatusTagType } from '@/utils/careEnums'

const props = defineProps({
  contract: {
    type: Object,
    required: true,
    default: () => ({})
  }
})

const emit = defineEmits(['success'])
const { proxy } = getCurrentInstance()

// 合同 PDF：签署文件优先，其次 pdfUrl
const pdfUrl = computed(() => props.contract.signPdfurl || props.contract.pdfUrl || '')
const submitting = ref(false)

// 签名相关
const signaturePad = ref(null)
const signatureCanvas = ref(null)
const signatureData = ref(null)
const isDrawing = ref(false)
// 每一笔的点集（画布内 CSS 像素）：尺寸变化后据此重绘，不像重置位图那样会抹掉已写内容
const strokes = ref([])
const currentStroke = ref(null)
const hasSignature = computed(() => strokes.value.length > 0 || currentStroke.value !== null)

// 签署表单
const signForm = reactive({
  signDate: new Date().toISOString().split('T')[0],
  remarks: ''
})

const signRules = {
  signDate: [{ required: true, message: '请选择签署日期', trigger: 'change' }]
}

const signFormRef = ref(null)

// 画布位图尺寸 = CSS 尺寸 × 设备像素比，并将绘制单位对齐到 CSS 像素，否则笔迹被拉伸、落点与光标不一致
const fitCanvas = () => {
  const pad = signaturePad.value
  const canvas = signatureCanvas.value
  if (!pad || !canvas) return
  // clientWidth/clientHeight 取的是边框以内的区域，与画布 inset:0 的覆盖范围一致（offsetWidth 会把 2px 虚线框也算进去）
  const width = pad.clientWidth
  const height = pad.clientHeight
  if (!width || !height) return
  const dpr = window.devicePixelRatio || 1
  canvas.style.width = width + 'px'
  canvas.style.height = height + 'px'
  canvas.width = Math.round(width * dpr)
  canvas.height = Math.round(height * dpr)
  const ctx = canvas.getContext('2d')
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  ctx.strokeStyle = '#1d2129'
  ctx.lineWidth = 2.5
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  redraw()
}

// 单笔落笔：只点一下也画出圆点，不留空白
const drawStroke = (ctx, stroke) => {
  if (!stroke.length) return
  if (stroke.length === 1) {
    ctx.beginPath()
    ctx.arc(stroke[0].x, stroke[0].y, ctx.lineWidth / 2, 0, Math.PI * 2)
    ctx.fillStyle = ctx.strokeStyle
    ctx.fill()
    return
  }
  ctx.beginPath()
  ctx.moveTo(stroke[0].x, stroke[0].y)
  stroke.slice(1).forEach(p => ctx.lineTo(p.x, p.y))
  ctx.stroke()
}

// 按笔迹集合整体重绘，并刷新签名快照
const redraw = () => {
  const canvas = signatureCanvas.value
  if (!canvas) return
  const dpr = window.devicePixelRatio || 1
  const ctx = canvas.getContext('2d')
  ctx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr)
  strokes.value.forEach(stroke => drawStroke(ctx, stroke))
  // 正在写的一笔也带上：尺寸重新适配时当前笔不会突然消失
  if (currentStroke.value) drawStroke(ctx, currentStroke.value)
  signatureData.value = strokes.value.length ? canvas.toDataURL('image/png') : null
}

// 事件坐标 → 画布坐标：以画布自身的 rect 归一化，弹窗打开动画或祖先 transform 也不会跑偏
const getPoint = (e) => {
  const canvas = signatureCanvas.value
  const rect = canvas.getBoundingClientRect()
  return {
    x: (e.clientX - rect.left) * (canvas.clientWidth / (rect.width || 1)),
    y: (e.clientY - rect.top) * (canvas.clientHeight / (rect.height || 1))
  }
}

// 开始绘制
const startDrawing = (e) => {
  if (e.pointerType === 'mouse' && e.button !== 0) return
  e.preventDefault()
  isDrawing.value = true
  currentStroke.value = [getPoint(e)]
  // 捕获指针：笔迹划出虚线框也不中断（原 mouseleave 会把一笔直接截断）
  signaturePad.value?.setPointerCapture?.(e.pointerId)
}

// 绘制：只补新增的一小段，避免每帧整幅重绘
const draw = (e) => {
  if (!isDrawing.value || !currentStroke.value) return
  const point = getPoint(e)
  const last = currentStroke.value[currentStroke.value.length - 1]
  // 滤掉手抖产生的重复点
  if (Math.abs(point.x - last.x) < 0.5 && Math.abs(point.y - last.y) < 0.5) return
  currentStroke.value.push(point)
  drawStroke(signatureCanvas.value.getContext('2d'), [last, point])
}

// 停止绘制：当前笔归档
const stopDrawing = (e) => {
  if (!isDrawing.value) return
  isDrawing.value = false
  try {
    signaturePad.value?.releasePointerCapture?.(e.pointerId)
  } catch { /* 指针未被捕获时 release 会抛错，忽略 */ }
  if (currentStroke.value?.length) strokes.value.push(currentStroke.value)
  currentStroke.value = null
  redraw()
}

// 撤销上一笔
const undoStroke = () => {
  strokes.value.pop()
  redraw()
}

// 清除签名
const clearSignature = () => {
  strokes.value = []
  currentStroke.value = null
  redraw()
}

// 处理签署：签名作为签署前的确认，后端置为已签署
const handleSign = async () => {
  if (!hasSignature.value) {
    proxy.$modal.msgWarning('请先完成签名')
    return
  }

  try {
    await signFormRef.value.validate()
  } catch (error) {
    return
  }

  submitting.value = true
  // 签名图片仅作签署前的确认，表格无对应字段，不随请求提交
  signContract({
    id: props.contract.id,
    signDate: signForm.signDate,
    remark: signForm.remarks
  }).then(() => {
    proxy.$modal.msgSuccess('合同签署成功')
    emit('success')
  }).finally(() => {
    submitting.value = false
  })
}

let resizeObserver = null

onMounted(() => {
  // 签署弹窗带打开动画，尺寸稳定前量到的宽高不准；ResizeObserver 能在尺寸变化后重新适配并重绘笔迹
  nextTick(fitCanvas)
  if (window.ResizeObserver && signaturePad.value) {
    resizeObserver = new ResizeObserver(() => fitCanvas())
    resizeObserver.observe(signaturePad.value)
  } else {
    window.addEventListener('resize', fitCanvas)
  }
})

onUnmounted(() => {
  resizeObserver?.disconnect()
  resizeObserver = null
  window.removeEventListener('resize', fitCanvas)
})
</script>

<style scoped>
.contract-sign {
  padding: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.pdf-preview {
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

/* 签名板：画布与占位文字都绝对定位铺满内容区，不再把 canvas 顶到虚线框外面 */
.sign-block {
  margin-bottom: 20px;
}

.signature-pad {
  position: relative;
  height: 160px;
  border: 2px dashed #409EFF;
  border-radius: 6px;
  background: #f8f9fa;
  cursor: crosshair;
  overflow: hidden;
  touch-action: none;
  user-select: none;
}

.signature-canvas {
  position: absolute;
  inset: 0;
  display: block;
}

.signature-placeholder {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #909399;
  font-size: 13px;
  pointer-events: none;
  user-select: none;
}

.sign-actions {
  display: flex;
  gap: 8px;
  margin-top: 10px;
}
</style>