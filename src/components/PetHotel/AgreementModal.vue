<template>
  <el-dialog 
    :title="title" 
    v-model="visible" 
    width="800px" 
    :close-on-click-modal="false"
    append-to-body
  >
    <div class="agreement-content">
      <h2 class="agreement-title">长者康养服务协议</h2>
      
      <div class="agreement-body">
        <h3>一、康养服务内容</h3>
        <p>1. 甲方（康养机构）为乙方（长者或其监护人）提供长者康养服务，包括但不限于：</p>
        <ul>
          <li>提供安全、卫生、适老的居住与康养环境</li>
          <li>按照约定提供餐饮、饮水及生活照料服务</li>
          <li>提供日常清洁、个人护理与卫生照护</li>
          <li>根据长者身体状况提供康复训练、文娱活动等服务</li>
        </ul>

        <h3>二、乙方责任与义务</h3>
        <p>1. 乙方应如实告知长者的健康状况、既往病史、生活习惯、特殊需求等信息。</p>
        <p>2. 乙方应提供有效的健康体检报告，确保长者已完成必要的健康评估。</p>
        <p>3. 乙方应自备长者的衣物、常用生活必需品、病历及药品等个人物品。</p>
        <p>4. 乙方应按时支付康养费用。</p>

        <h3>三、甲方责任与义务</h3>
        <p>1. 甲方应按照约定提供康养服务，确保长者的健康和安全。</p>
        <p>2. 甲方应定期向乙方反馈长者的情况，包括照护记录、照片、视频等。</p>
        <p>3. 如长者出现健康问题，甲方应及时通知乙方并采取必要的照护与就医措施。</p>

        <h3>四、免责条款</h3>
        <p>1. 因乙方隐瞒长者健康状况或提供虚假信息导致的后果，由乙方承担全部责任。</p>
        <p>2. 因长者自身疾病、年老体弱等自然原因导致的意外，甲方不承担责任。</p>
        <p>3. 因不可抗力因素导致的损失，双方互不承担责任。</p>

        <h3>五、紧急医疗授权</h3>
        <p>如长者在康养期间出现紧急健康问题，甲方有权采取必要的救护措施，包括但不限于送往合作医疗机构就诊。相关费用由乙方承担。</p>

        <h3>六、协议期限</h3>
        <p>本协议自长者入住之日起生效，至长者退住之日终止。</p>

        <h3>七、争议解决</h3>
        <p>本协议在履行过程中发生争议，双方应友好协商解决；协商不成的，可向甲方所在地人民法院提起诉讼。</p>
      </div>

      <el-divider />

      <div class="agreement-confirm">
        <el-checkbox v-model="agreed">
          我已仔细阅读并理解上述协议内容，同意遵守协议条款
        </el-checkbox>
      </div>

      <div class="agreement-sign" v-if="showSignature">
        <h4>电子签名</h4>
        <div class="sign-area" ref="signArea">
          <canvas ref="canvas" width="600" height="150"></canvas>
        </div>
        <div class="sign-actions">
          <el-button type="primary" size="small" @click="clearSign" round>清除签名</el-button>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="visible = false" round>取 消</el-button>
        <el-button type="primary" @click="confirmAgreement" :disabled="!canConfirm" round>
          确认签署
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, computed, watch, nextTick } from 'vue'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  title: {
    type: String,
    default: '长者康养服务协议'
  },
  showSignature: {
    type: Boolean,
    default: true
  },
  requireSignature: {
    type: Boolean,
    default: true
  }
})

const emit = defineEmits(['update:modelValue', 'confirm'])

const visible = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

const agreed = ref(false)
const canvas = ref(null)
const signArea = ref(null)
let ctx = null
let isDrawing = false
let hasSignature = false

const canConfirm = computed(() => {
  if (!agreed.value) return false
  if (props.requireSignature && !hasSignature) return false
  return true
})

watch(visible, (val) => {
  if (val && props.showSignature) {
    nextTick(() => {
      initCanvas()
    })
  }
})

function initCanvas() {
  if (!canvas.value) return
  
  ctx = canvas.value.getContext('2d')
  ctx.strokeStyle = '#000'
  ctx.lineWidth = 2
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  
  // 添加鼠标事件
  canvas.value.addEventListener('mousedown', startDrawing)
  canvas.value.addEventListener('mousemove', draw)
  canvas.value.addEventListener('mouseup', stopDrawing)
  canvas.value.addEventListener('mouseout', stopDrawing)
  
  // 添加触摸事件
  canvas.value.addEventListener('touchstart', handleTouch)
  canvas.value.addEventListener('touchmove', handleTouch)
  canvas.value.addEventListener('touchend', stopDrawing)
}

function startDrawing(e) {
  isDrawing = true
  const rect = canvas.value.getBoundingClientRect()
  ctx.beginPath()
  ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top)
}

function draw(e) {
  if (!isDrawing) return
  const rect = canvas.value.getBoundingClientRect()
  ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top)
  ctx.stroke()
  hasSignature = true
}

function stopDrawing() {
  isDrawing = false
}

function handleTouch(e) {
  e.preventDefault()
  const touch = e.touches[0]
  const mouseEvent = new MouseEvent(e.type === 'touchstart' ? 'mousedown' : 'mousemove', {
    clientX: touch.clientX,
    clientY: touch.clientY
  })
  canvas.value.dispatchEvent(mouseEvent)
}

function clearSign() {
  if (!ctx || !canvas.value) return
  ctx.clearRect(0, 0, canvas.value.width, canvas.value.height)
  hasSignature = false
}

function confirmAgreement() {
  const signatureData = hasSignature ? canvas.value?.toDataURL() : null
  emit('confirm', {
    agreed: agreed.value,
    signature: signatureData,
    timestamp: new Date().toISOString()
  })
  visible.value = false
  // 重置状态
  agreed.value = false
  clearSign()
}
</script>

<style scoped>
.agreement-content {
  max-height: 500px;
  overflow-y: auto;
  padding-right: 10px;
}

.agreement-title {
  text-align: center;
  margin-bottom: 20px;
  font-size: 20px;
}

.agreement-body {
  font-size: 14px;
  line-height: 1.8;
}

.agreement-body h3 {
  margin-top: 20px;
  margin-bottom: 10px;
  font-size: 16px;
  color: #303133;
}

.agreement-body p {
  margin-bottom: 8px;
  color: #606266;
}

.agreement-body ul {
  margin-left: 20px;
  margin-bottom: 10px;
}

.agreement-body li {
  margin-bottom: 5px;
  color: #606266;
}

.agreement-confirm {
  margin: 20px 0;
  padding: 15px;
  background: #f5f7fa;
  border-radius: 4px;
}

.agreement-sign {
  margin-top: 20px;
}

.agreement-sign h4 {
  margin-bottom: 10px;
}

.sign-area {
  border: 2px dashed #dcdfe6;
  border-radius: 4px;
  display: flex;
  justify-content: center;
  align-items: center;
  background: #fafafa;
}

.sign-area canvas {
  cursor: crosshair;
}

.sign-actions {
  margin-top: 10px;
  text-align: right;
}
</style>
