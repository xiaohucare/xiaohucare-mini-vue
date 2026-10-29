<template>
  <div class="contract-config">
    <el-row :gutter="20">
      <!-- 左侧：PDF预览和拖拽区域 -->
      <el-col :span="16">
        <el-card shadow="never">
          <template #header>
            <div class="card-header">
              <span>合同模板预览</span>
              <div>
                <el-button type="primary" size="small" @click="addField" round>添加字段</el-button>
                <el-button size="small" @click="loadDefaultPdf" v-if="!pdfUrl" round>加载默认PDF</el-button>
                <el-button size="small" @click="uploadPdf" round>上传PDF</el-button>
                <el-button size="small" @click="reloadPdf" v-if="pdfUrl" round>重新加载</el-button>
                <el-button size="small" @click="loadTestPdf" round>加载测试PDF</el-button>
                <el-tag v-if="loading" type="info" size="small" style="margin-left: 10px;">加载中...</el-tag>
              </div>
            </div>
          </template>
          
          <!-- PDF预览区域 -->
          <div class="pdf-preview" ref="pdfPreview">
            <!-- PDF文档显示 -->
            <div v-if="pdfUrl" class="pdf-container">
              <!-- 使用PdfViewer组件 -->
              <PdfViewer
                :pdf-url="pdfUrl"
                :show-download="false"
                :show-file-input="false"
                :initial-scale="zoom / 100"
                @loaded="onPdfLoaded"
                @error="onPdfError"
                class="pdf-viewer-container"
                ref="pdfViewerRef"
              />
              
              <!-- 动态字段显示 -->
              <div 
                v-for="field in fields" 
                :key="field.id"
                class="field-element"
                :style="getFieldStyle(field)"
                @mousedown="startDrag(field, $event)"
                @click="selectField(field)"
              >
                <div class="field-label" :class="getFieldLabelClass(field)">
                  {{ field.label }}
                </div>
                <div class="field-content" :class="getFieldContentClass(field)">
                  {{ field.type === 'text' ? field.value : '签名区域' }}
                </div>
              </div>
            </div>
            
            <!-- 上传提示 -->
            <div v-else class="upload-prompt">
              <el-empty description="请加载或上传PDF合同模板">
                <el-button type="primary" @click="loadDefaultPdf" round>加载默认PDF</el-button>
                <el-button @click="uploadPdf" style="margin-left: 10px;" round>上传PDF</el-button>
              </el-empty>
              <!-- 错误提示 -->
              <div v-if="loadError || (loading === false && pdfUrl && !pdfDoc)" style="color: #F56C6C; text-align: center; margin-top: 10px;">
                PDF加载失败，请检查文件格式或尝试重新加载
              </div>
            </div>
          </div>
          
          <!-- 文件上传对话框 -->
          <el-dialog v-model="uploadDialogVisible" title="上传PDF合同模板" width="500px">
            <el-upload
              class="upload-demo"
              drag
              action="#"
              :auto-upload="false"
              :on-change="handleFileChange"
              accept=".pdf"
            >
              <el-icon class="el-icon--upload"><upload-filled /></el-icon>
              <div class="el-upload__text">
                将PDF文件拖到此处，或<em>点击上传</em>
              </div>
              <template #tip>
                <div class="el-upload__tip">
                  只能上传PDF文件，且不超过10MB
                </div>
              </template>
            </el-upload>
            <template #footer>
              <el-button @click="uploadDialogVisible = false" round>取消</el-button>
              <el-button type="primary" @click="confirmUpload" :disabled="!selectedFile" round>确认上传</el-button>
            </template>
          </el-dialog>
        </el-card>
      </el-col>
      
      <!-- 右侧：字段配置面板 -->
      <el-col :span="8">
        <el-card shadow="never">
          <template #header>
            <span>字段配置</span>
          </template>
          
          <el-form v-if="currentField" :model="currentField" label-width="80px">
            <el-form-item label="字段类型">
              <el-select v-model="currentField.type" placeholder="请选择字段类型">
                <el-option label="文本" value="text" />
                <el-option label="签名" value="signature" />
                <el-option label="日期" value="date" />
                <el-option label="图片" value="image" />
              </el-select>
            </el-form-item>
            
            <el-form-item label="字段标签">
              <el-input v-model="currentField.label" placeholder="请输入字段标签" />
            </el-form-item>
            
            <el-form-item label="字段值" v-if="currentField.type === 'text'">
              <el-input v-model="currentField.value" placeholder="请输入字段值" />
            </el-form-item>
            
            <el-form-item label="位置坐标">
              <el-row :gutter="10">
                <el-col :span="12">
                  <el-input-number 
                    v-model="currentField.x" 
                    :min="0" 
                    :max="1000" 
                    controls-position="right" 
                    placeholder="X坐标" 
                  />
                </el-col>
                <el-col :span="12">
                  <el-input-number 
                    v-model="currentField.y" 
                    :min="0" 
                    :max="1000" 
                    controls-position="right" 
                    placeholder="Y坐标" 
                  />
                </el-col>
              </el-row>
            </el-form-item>
            
            <el-form-item label="尺寸">
              <el-row :gutter="10">
                <el-col :span="12">
                  <el-input-number 
                    v-model="currentField.width" 
                    :min="50" 
                    :max="500" 
                    controls-position="right" 
                    placeholder="宽度" 
                  />
                </el-col>
                <el-col :span="12">
                  <el-input-number 
                    v-model="currentField.height" 
                    :min="30" 
                    :max="200" 
                    controls-position="right" 
                    placeholder="高度" 
                  />
                </el-col>
              </el-row>
            </el-form-item>
            
            <el-form-item label="字体大小" v-if="currentField.type === 'text'">
              <el-input-number 
                v-model="currentField.fontSize" 
                :min="10" 
                :max="36" 
                controls-position="right" 
              />
            </el-form-item>
            
            <el-form-item>
              <el-button type="danger" @click="removeField" round>删除字段</el-button>
              <el-button type="primary" @click="saveConfig" round>保存配置</el-button>
            </el-form-item>
          </el-form>
          
          <div v-else style="text-align: center; color: #909399; padding: 20px;">
            <el-icon><InfoFilled /></el-icon>
            <p>请选择一个字段进行配置</p>
          </div>
        </el-card>
        
        <!-- 字段列表 -->
        <el-card shadow="never" style="margin-top: 20px;">
          <template #header>
            <span>字段列表</span>
          </template>
          
          <el-table :data="fields" size="small" @row-click="selectField">
            <el-table-column prop="label" label="字段名称" />
            <el-table-column prop="type" label="类型" width="80">
              <template #default="scope">
                <el-tag :type="scope.row.type === 'signature' ? 'primary' : 'success'" size="small">
                  {{ scope.row.type === 'signature' ? '签名' : '文本' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="60">
              <template #default="scope">
                <el-button link type="danger" size="small" @click="removeField(scope.row)" round>删除</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, nextTick } from 'vue'
import { InfoFilled, UploadFilled } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import PdfViewer from '../../components/PdfViewer.vue'

const props = defineProps({
  templateId: {
    type: [Number, String],
    required: true
  }
})

// PDF相关状态
const pdfUrl = ref('')
const zoom = ref(100)
const uploadDialogVisible = ref(false)
const selectedFile = ref(null)
const loading = ref(false) // 添加加载状态
const loadError = ref(false) // 添加加载错误状态
const pdfDoc = ref(null) // 添加PDF文档引用

// 默认PDF URL
const defaultPdfUrl = 'http://www.xinqishi.com.cn/statics/common/pdf/demo.pdf' // 使用公开可访问的测试PDF

// 组件引用
const pdfViewerRef = ref(null)
const pdfPreview = ref(null)

// PdfViewer事件处理
const onPdfLoaded = (pdfInfo) => {
  console.log('PDF加载完成:', pdfInfo)
  loading.value = false
  loadError.value = false
  pdfDoc.value = pdfInfo
}

const onPdfError = (error) => {
  console.error('PDF加载错误:', error)
  loading.value = false
  loadError.value = true
  pdfDoc.value = null
  
  // 特殊错误处理
  let errorMessage = error.message || '未知错误'
  if (errorMessage.includes('CORS')) {
    errorMessage = '跨域访问被拒绝，请检查服务器配置或尝试上传本地PDF文件'
  } else if (errorMessage.includes('network error')) {
    errorMessage = '网络连接失败，请检查网络设置'
  } else if (errorMessage.includes('Missing PDF')) {
    errorMessage = 'PDF文件不存在或无法访问'
  } else if (errorMessage.includes('Unexpected server response')) {
    errorMessage = '服务器响应异常，请检查PDF文件链接'
  }
  
  ElMessage.error(`PDF加载失败: ${errorMessage}`)
}

// 字段数据
const fields = ref([])
const currentField = ref(null)
const isDragging = ref(false)
const dragOffset = ref({ x: 0, y: 0 })

// 初始化字段数据
const initFields = () => {
  fields.value = [
    {
      id: 1,
      type: 'text',
      label: '老人姓名',
      value: '张三',
      x: 200,
      y: 100,
      width: 150,
      height: 40,
      fontSize: 14,
      active: false
    },
    {
      id: 2,
      type: 'text',
      label: '身份证号',
      value: '11010519800101001X',
      x: 400,
      y: 100,
      width: 200,
      height: 40,
      fontSize: 14,
      active: false
    },
    {
      id: 3,
      type: 'signature',
      label: '老人签名',
      x: 200,
      y: 600,
      width: 150,
      height: 60,
      active: false
    },
    {
      id: 4,
      type: 'signature',
      label: '机构盖章',
      x: 400,
      y: 600,
      width: 150,
      height: 60,
      active: false
    }
  ]
}

// 获取字段样式
const getFieldStyle = (field) => {
  return {
    position: 'absolute',
    left: field.x + 'px',
    top: field.y + 'px',
    width: field.width + 'px',
    height: field.height + 'px',
    border: field.type === 'signature' ? '2px dashed #409EFF' : '1px solid #67C23A',
    background: field.type === 'signature' ? 'rgba(64, 158, 255, 0.1)' : 'rgba(103, 194, 58, 0.1)',
    cursor: 'move',
    zIndex: field.active ? 10 : 1,
    boxSizing: 'border-box'
  }
}

// 获取字段标签样式类
const getFieldLabelClass = (field) => {
  return {
    'field-label': true,
    'signature-label': field.type === 'signature',
    'text-label': field.type === 'text'
  }
}

// 获取字段内容样式类
const getFieldContentClass = (field) => {
  return {
    'field-content': true,
    'signature-content': field.type === 'signature',
    'text-content': field.type === 'text'
  }
}

// 选择字段
const selectField = (field) => {
  fields.value.forEach(f => f.active = false)
  field.active = true
  currentField.value = field
}

// 开始拖拽
const startDrag = (field, event) => {
  isDragging.value = true
  selectField(field)
  
  const rect = event.target.getBoundingClientRect()
  dragOffset.value = {
    x: event.clientX - rect.left,
    y: event.clientY - rect.top
  }
  
  document.addEventListener('mousemove', onDrag)
  document.addEventListener('mouseup', stopDrag)
  event.preventDefault() // 阻止默认行为
}

// 拖拽中
const onDrag = (event) => {
  if (!isDragging.value || !currentField.value) return
  
  // 获取PDF容器的边界信息
  const pdfContainer = document.querySelector('.pdf-container')
  if (!pdfContainer) return
  
  const containerRect = pdfContainer.getBoundingClientRect()
  
  // 计算字段在容器中的位置
  let newX = event.clientX - containerRect.left - dragOffset.value.x
  let newY = event.clientY - containerRect.top - dragOffset.value.y
  
  // 限制在PDF容器区域内
  newX = Math.max(0, Math.min(newX, containerRect.width - currentField.value.width))
  newY = Math.max(0, Math.min(newY, containerRect.height - currentField.value.height))
  
  // 更新字段位置
  currentField.value.x = newX
  currentField.value.y = newY
}

// 停止拖拽
const stopDrag = () => {
  isDragging.value = false
  document.removeEventListener('mousemove', onDrag)
  document.removeEventListener('mouseup', stopDrag)
}

// 添加字段
const addField = () => {
  const newField = {
    id: Date.now(),
    type: 'text',
    label: `字段${fields.value.length + 1}`,
    value: '',
    x: 100,
    y: 200,
    width: 150,
    height: 40,
    fontSize: 14,
    active: true
  }
  
  fields.value.push(newField)
  currentField.value = newField
}

// 删除字段
const removeField = (field) => {
  const fieldToRemove = field || currentField.value
  if (!fieldToRemove) return
  
  const index = fields.value.findIndex(f => f.id === fieldToRemove.id)
  if (index !== -1) {
    fields.value.splice(index, 1)
    currentField.value = fields.value.length > 0 ? fields.value[0] : null
    if (currentField.value) {
      currentField.value.active = true
    }
  }
}

// 保存配置
const saveConfig = () => {
  // 这里调用API保存配置
  console.log('保存配置:', fields.value)
  // 调用保存API
  // saveContractConfig({
  //   templateId: props.templateId,
  //   fields: fields.value
  // }).then(response => {
  //   // 保存成功处理
  // })
}

// 重置错误状态
const resetErrorState = () => {
  loadError.value = false
}

// PDF相关方法
// 加载默认PDF
const loadDefaultPdf = async () => {
  try {
    // 检查网络连接
    if (!navigator.onLine) {
      ElMessage.error('网络连接不可用，请检查网络设置')
      return
    }
    
    resetErrorState()
    loading.value = true
    pdfUrl.value = defaultPdfUrl
    
    // 设置5秒超时
    setTimeout(() => {
      if (loading.value) {
        loading.value = false
        ElMessage.warning('PDF加载超时，请检查网络连接或尝试其他方式')
      }
    }, 5000)
  } catch (error) {
    console.error('默认PDF加载失败:', error)
    loading.value = false
    loadError.value = true
    ElMessage.warning('默认PDF加载失败，您可以上传本地PDF文件')
  }
}

// 上传PDF
const uploadPdf = () => {
  uploadDialogVisible.value = true
}

// 加载测试PDF
const loadTestPdf = async () => {
  try {
    // 使用一个公开可用的测试PDF文件
    let testPdfUrl = 'http://www.xinqishi.com.cn/statics/common/pdf/demo.pdf';
    // 备用测试URL
    // testPdfUrl = 'https://raw.githubusercontent.com/mozilla/pdf.js/ba2edeae/examples/learning/helloworld.pdf';
    resetErrorState()
    loading.value = true
    pdfUrl.value = testPdfUrl
    
    // 设置5秒超时
    setTimeout(() => {
      if (loading.value) {
        loading.value = false
        ElMessage.warning('PDF加载超时，请检查网络连接或尝试其他方式')
      }
    }, 5000)
  } catch (error) {
    console.error('测试PDF加载失败:', error)
    loading.value = false
    loadError.value = true
    ElMessage.error('测试PDF加载失败: ' + (error.message || '未知错误'))
  }
}

// 处理文件选择
const handleFileChange = (file) => {
  selectedFile.value = file.raw
}

// 确认上传
const confirmUpload = async () => {
  if (!selectedFile.value) return
  
  try {
    // 创建临时URL
    const url = URL.createObjectURL(selectedFile.value)
    resetErrorState()
    loading.value = true
    pdfUrl.value = url
    uploadDialogVisible.value = false
    
    // 设置5秒超时
    setTimeout(() => {
      if (loading.value) {
        loading.value = false
        ElMessage.warning('PDF加载超时，请检查文件格式')
      }
    }, 5000)
  } catch (error) {
    console.error('PDF加载失败:', error)
    loading.value = false
    loadError.value = true
    ElMessage.error('PDF文件加载失败: ' + (error.message || '未知错误'))
  }
}

// 重新加载PDF
const reloadPdf = () => {
  if (pdfUrl.value) {
    const url = pdfUrl.value
    pdfUrl.value = ''
    resetErrorState()
    loading.value = true
    setTimeout(() => {
      pdfUrl.value = url
    }, 100)
  }
}

// 监听缩放变化
watch(zoom, () => {
  // 缩放变化时只需要更新canvas的transform，不需要重新渲染页面
  // transform样式已经在模板中绑定，这里不需要额外处理
})

// 监听模板ID变化
watch(() => props.templateId, (newVal) => {
  if (newVal) {
    // 加载该模板的配置
    initFields()
  }
})

onMounted(() => {
  initFields()
  if (fields.value.length > 0) {
    selectField(fields.value[0])
  }
  
  // 自动加载默认PDF
  loadDefaultPdf().catch(error => {
    console.error('组件初始化失败:', error)
    ElMessage.error('组件初始化失败，请刷新页面重试')
  })
})
</script>

<style scoped>
.contract-config {
  padding: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.pdf-preview {
  position: relative;
  overflow: auto;
  min-height: 600px;
  border: 1px solid #e4e7ed;
  border-radius: 4px;
  background: #f5f7fa;
}

.pdf-container {
  position: relative;
  min-height: 600px;
  width: 100%;
}

.pdf-viewer-container {
  width: 100%;
  height: 100%;
  min-height: 600px;
}

.upload-prompt {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 600px;
}

.upload-demo {
  width: 100%;
}

.field-element {
  position: absolute;
  border-radius: 4px;
  transition: all 0.2s;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
}

.field-element:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.field-element.active {
  border-color: #E6A23C;
  box-shadow: 0 2px 8px rgba(230, 162, 60, 0.3);
}

.field-label {
  font-size: 12px;
  text-align: center;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  padding: 2px 4px;
  color: #fff;
}

.signature-label {
  background: #409EFF;
}

.text-label {
  background: #67C23A;
}

.field-content {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  word-break: break-all;
  overflow: hidden;
  flex: 1;
  padding: 4px;
}

.signature-content {
  background: rgba(64, 158, 255, 0.1);
}

.text-content {
  background: rgba(103, 194, 58, 0.1);
}
</style>