<template>
  <div class="contract-detail">
    <el-card shadow="never">
      <template #header>
        <div class="card-header">
          <span>合同详情</span>
          <el-button type="primary" :disabled="!pdfUrl" @click="handleDownload" round>下载合同</el-button>
        </div>
      </template>

      <!-- 合同基本信息：默认收起，把竖向空间让给合同正文 -->
      <div class="info-section">
        <div
          class="info-header"
          role="button"
          tabindex="0"
          :aria-expanded="expanded ? 'true' : 'false'"
          @click="expanded = !expanded"
          @keydown.enter.prevent="expanded = !expanded"
          @keydown.space.prevent="expanded = !expanded"
        >
          <span class="info-title">合同基本信息</span>
          <!-- 收起时才显示摘要，展开后表格里已有同样的字段 -->
          <div v-if="!expanded" class="info-summary">
            <span class="summary-item">{{ contract.contractNo || '-' }}</span>
            <span class="summary-item">{{ contract.residentName || '-' }}</span>
            <el-tag :type="getContractStatusTagType(contract.status)" effect="plain" size="small" round>
              {{ getContractStatusName(contract.status) || '-' }}
            </el-tag>
            <span class="summary-date">生效 {{ contract.effectiveDate || '-' }} · 到期 {{ contract.expiryDate || '-' }}</span>
          </div>
          <span class="info-toggle">
            {{ expanded ? '收起' : '展开' }}
            <el-icon class="toggle-icon" :class="{ 'is-expanded': expanded }"><ArrowDown /></el-icon>
          </span>
        </div>

        <el-collapse-transition>
          <div v-show="expanded">
            <el-descriptions :column="2" border class="info-body">
              <el-descriptions-item label="合同编号">{{ contract.contractNo || '-' }}</el-descriptions-item>
              <el-descriptions-item label="长者编号">{{ contract.residentNo || '-' }}</el-descriptions-item>
              <el-descriptions-item label="长者姓名">{{ contract.residentName || '-' }}</el-descriptions-item>
              <el-descriptions-item label="协议名称">{{ contract.templateName || '-' }}</el-descriptions-item>
              <el-descriptions-item label="合同状态">
                <el-tag :type="getContractStatusTagType(contract.status)" effect="plain" round>
                  {{ getContractStatusName(contract.status) || '-' }}
                </el-tag>
              </el-descriptions-item>
              <el-descriptions-item label="签署日期">{{ contract.signDate || '-' }}</el-descriptions-item>
              <el-descriptions-item label="生效日期">{{ contract.effectiveDate || '-' }}</el-descriptions-item>
              <el-descriptions-item label="到期日期">{{ contract.expiryDate || '-' }}</el-descriptions-item>
              <el-descriptions-item label="创建时间">{{ contract.createAt || '-' }}</el-descriptions-item>
              <el-descriptions-item label="备注" :span="2">{{ contract.remark || '-' }}</el-descriptions-item>
            </el-descriptions>
          </div>
        </el-collapse-transition>
      </div>

      <!-- PDF预览区域 -->
      <div class="pdf-section">
        <h3>合同预览</h3>
        <div class="pdf-container">
          <PdfViewer
            v-if="pdfUrl"
            :pdf-url="pdfUrl"
            :show-file-input="false"
            :show-download="true"
            :initial-scale="1.0"
          />
          <el-empty v-else description="该合同暂未上传 PDF 文件" />
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import PdfViewer from './PdfViewer.vue'
import { getContractStatusName, getContractStatusTagType } from '@/utils/careEnums'

const props = defineProps({
  contract: {
    type: Object,
    required: true,
    default: () => ({})
  }
})

const emit = defineEmits(['download'])

// 签署后的 PDF 地址优先，其次回落到后端返回的 pdfUrl
const pdfUrl = computed(() => props.contract.signPdfurl || props.contract.pdfUrl || '')

// 有 PDF 时默认收起（正文才是主角）；没 PDF 时基本信息就是全部内容，保持展开
const expanded = ref(!pdfUrl.value)

// 下载合同：交由列表页统一处理（支持新窗口打开）
const handleDownload = () => {
  emit('download', props.contract)
}
</script>

<style scoped>
.contract-detail {
  padding: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

/* 基本信息可收缩区：收起后只留一行摘要，竖向空间让给合同正文 */
.info-header {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  padding: 10px 14px;
  background: #f8f9fa;
  border: 1px solid #eef0f3;
  border-radius: 8px;
  cursor: pointer;
  user-select: none;
}

.info-header:hover {
  background: #f1f3f6;
}

.info-header:focus-visible {
  outline: 2px solid #409EFF;
  outline-offset: 1px;
}

.info-title {
  flex: none;
  font-size: 14px;
  font-weight: 600;
  color: #1d2129;
}

.info-summary {
  display: flex;
  align-items: center;
  gap: 10px;
  flex: 1;
  flex-wrap: wrap;
  font-size: 13px;
  color: #4e5969;
}

.summary-item {
  font-weight: 500;
}

.summary-date {
  color: #86909c;
}

.info-toggle {
  display: flex;
  align-items: center;
  gap: 4px;
  flex: none;
  margin-left: auto;
  font-size: 13px;
  color: #409EFF;
}

.toggle-icon {
  transition: transform 0.24s ease;
}

.toggle-icon.is-expanded {
  transform: rotate(180deg);
}

.info-body {
  margin-top: 12px;
}

/* PDF部分样式 */
.pdf-section {
  position: relative;
  margin-top: 18px;
}

/* PDF容器样式 */
.pdf-container {
  position: relative;
  background: #f8f9fa;
  border-radius: 8px;
  /* 写死 600px 时收起信息块也开不了多少空间；改成跟随视口，收起后基本能一屏看完整份合同 */
  height: 68vh;
  min-height: 520px;
  overflow: hidden;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .pdf-container {
    height: 62vh;
    min-height: 400px;
  }

  .info-summary {
    font-size: 12px;
  }
}

@media (max-width: 480px) {
  .pdf-container {
    min-height: 300px;
  }

  .summary-date {
    display: none;
  }
}

/* 横屏优化 */
@media (max-width: 768px) and (orientation: landscape) {
  .pdf-container {
    height: 56vh;
    min-height: 300px;
  }
}
</style>
