<template>
  <div class="app-container">
    <el-card shadow="never">
      <!-- 页面头部 -->
      <el-page-header @back="goBack" content="退住交接" style="margin-bottom: 20px" />
      
      <!-- 长者基本信息卡片 -->
      <el-card shadow="never" class="info-card">
        <template #header>
          <div class="card-header">
            <span>
              <el-icon><UserFilled /></el-icon>
              住养信息
            </span>
            <el-tag :type="getStatusType(petInfo.status)">{{ getStatusLabel(petInfo.status) }}</el-tag>
          </div>
        </template>
        <el-descriptions :column="4" border>
          <el-descriptions-item label="长者姓名">
            <span style="font-weight: 600">{{ petInfo.residentName }}</span>
          </el-descriptions-item>
          <el-descriptions-item label="长者编号">{{ petInfo.residentNo }}</el-descriptions-item>
          <el-descriptions-item label="性别">{{ genderLabel(petInfo.gender) }}</el-descriptions-item>
          <el-descriptions-item label="照护等级">
            <el-tag size="small">{{ petInfo.careLevel || '未评估' }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="联系电话">{{ petInfo.contactPhone }}</el-descriptions-item>
          <el-descriptions-item label="入住日期">{{ petInfo.checkinDate }}</el-descriptions-item>
          <el-descriptions-item label="退住日期">{{ petInfo.checkoutDate || '待定' }}</el-descriptions-item>
          <el-descriptions-item label="房间">{{ petInfo.roomName || '未分配' }}</el-descriptions-item>
          <el-descriptions-item label="床位">
            <el-tag type="success">{{ petInfo.bedNo || '未分配' }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="实际天数">
            <span style="color: #409EFF; font-weight: 600">{{ petInfo.actualDays }} 天</span>
          </el-descriptions-item>
          <el-descriptions-item label="已付押金">
            <span style="color: #E6A23C">¥{{ petInfo.deposit }}</span>
          </el-descriptions-item>
        </el-descriptions>
      </el-card>

      <!-- Tab区域 -->
      <el-tabs v-model="activeTab" class="checkout-tabs">
        <!-- Tab1: 长者交接信息和意见叮嘱 -->
        <el-tab-pane label="交接信息" name="handover">
          <div class="tab-content">
            <!-- 入住时照片对比 -->
            <div class="form-section">
              <div class="section-title">
                <el-icon><Camera /></el-icon>
                <span>照片对比</span>
              </div>
              <el-row :gutter="20">
                <el-col :span="12">
                  <el-card shadow="never">
                    <template #header>入住时照片</template>
                    <div class="photo-box">
                      <el-image 
                        v-if="petInfo.checkinPhotoList?.length"
                        :src="petInfo.checkinPhotoList[0]" 
                        :preview-src-list="petInfo.checkinPhotoList"
                        fit="cover"
                        style="width: 200px; height: 200px;"
                      />
                      <el-empty v-else description="暂无照片" :image-size="80" />
                    </div>
                  </el-card>
                </el-col>
                <el-col :span="12">
                  <el-card shadow="never">
                    <template #header>退住时照片</template>
                    <div class="photo-box">
                      <el-upload
                        :action="uploadAction"
                        :headers="uploadHeaders"
                        list-type="picture-card"
                        v-model:file-list="checkoutPhotoList"
                        :on-success="handleCheckoutPhotoUploadSuccess"
                        :on-error="handleCheckoutPhotoUploadError"
                        :on-remove="handleCheckoutPhotoRemove"
                        :limit="3"
                        :disabled="viewOnly"
                        accept="image/*"
                      >
                        <el-icon><Plus /></el-icon>
                      </el-upload>
                    </div>
                  </el-card>
                </el-col>
              </el-row>
            </div>

            <!-- 身体状况检查 -->
            <div class="form-section">
              <div class="section-title">
                <el-icon><View /></el-icon>
                <span>身体状况检查</span>
              </div>
              <el-form :model="form" label-width="120px">
                <el-row :gutter="20">
                  <el-col :span="12">
                    <el-form-item label="身体状况">
                      <el-radio-group v-model="form.healthChangeDesc" :disabled="viewOnly">
                        <el-radio :label="0">正常无变化</el-radio>
                        <el-radio :label="1">有变化</el-radio>
                      </el-radio-group>
                    </el-form-item>
                  </el-col>
                  <el-col :span="12">
                    <el-form-item label="个人卫生">
                      <el-select v-model="form.careSummary" placeholder="请选择" style="width: 100%" :disabled="viewOnly">
                        <el-option label="整洁" :value="0" />
                        <el-option label="一般" :value="1" />
                        <el-option label="需清洁" :value="2" />
                      </el-select>
                    </el-form-item>
                  </el-col>
                </el-row>
                <el-form-item label="变化说明" v-if="form.healthChangeDesc === 1">
                  <el-input v-model="form.appearanceChanges" type="textarea" :rows="2" placeholder="请详细描述身体状况变化（如新伤、体重变化等）" :disabled="viewOnly" />
                </el-form-item>
              </el-form>
            </div>

            <!-- 物品清点 -->
            <div class="form-section">
              <div class="section-title">
                <el-icon><Box /></el-icon>
                <span>物品清点</span>
              </div>
              <el-form :model="form" label-width="120px">
                <el-form-item label="带入物品">
                  <el-input v-model="petInfo.broughtItems" disabled placeholder="入住时登记的物品" />
                </el-form-item>
                <el-form-item label="归还物品">
                  <el-checkbox-group v-model="form.returnedItems" :disabled="viewOnly">
                    <el-checkbox 
                      v-for="(item, index) in returnedItemOptions" 
                      :key="index" 
                      :label="item"
                    >
                      {{ item }}
                    </el-checkbox>
                  </el-checkbox-group>
                </el-form-item>
                <el-form-item label="物品状态">
                  <el-select v-model="form.itemsStatus" placeholder="请选择" style="width: 50%" :disabled="viewOnly">
                    <el-option label="完好" :value="0" />
                    <el-option label="有损耗" :value="1" />
                    <el-option label="有损坏" :value="2" />
                  </el-select>
                </el-form-item>

               

                <el-form-item label="物品备注" v-if="form.itemsStatus !== 0">
                  <el-input v-model="form.itemsRemark" type="textarea" :rows="2" placeholder="如有损坏或丢失请说明" :disabled="viewOnly" />
                </el-form-item>
                <el-form-item label="物品确认">
                  <el-checkbox v-model="form.itemsConfirmed" :true-label="1" :false-label="0" :disabled="viewOnly">已与家属确认所有物品已归还</el-checkbox>
                </el-form-item>
              </el-form>

              <el-row :gutter="20" v-if="petInfo.broughtPhotoList?.length">
                <el-col :span="24">
                  <el-card shadow="never">
                    <template #header>入住物品照片</template>
                    <div class="photo-box">
                      <el-image 
                        v-if="petInfo.broughtPhotoList?.length"
                        :src="petInfo.broughtPhotoList[0]" 
                        :preview-src-list="petInfo.broughtPhotoList"
                        fit="cover"
                        style="width: 200px; height: 200px;"
                      />
                      <el-empty v-else description="暂无照片" :image-size="80" />
                    </div>
                  </el-card>
                </el-col>
              </el-row>
            </div>

            <!-- 意见叮嘱 -->
            <div class="form-section">
              <div class="section-title">
                <el-icon><ChatDotRound /></el-icon>
                <span>意见叮嘱</span>
              </div>
              <el-form :model="form" label-width="120px">
                <el-form-item label="康养表现">
                  <el-input v-model="form.performance" type="textarea" :rows="3" placeholder="简单告知家属长者在康养期间的表现（趣事或小问题）" :disabled="viewOnly" />
                </el-form-item>
                <el-form-item label="健康提醒">
                  <el-input v-model="form.healthReminder" type="textarea" :rows="2" placeholder="如发现健康问题，请在此提醒家属" :disabled="viewOnly" />
                </el-form-item>
                <el-form-item label="下次建议">
                  <el-input v-model="form.suggestions" type="textarea" :rows="2" placeholder="下次康养建议" :disabled="viewOnly" />
                </el-form-item>
                <el-form-item label="满意度评分">
                  <el-rate v-model="form.customerSatisfaction" :disabled="viewOnly" />
                </el-form-item>
                <el-form-item label="家属反馈">
                  <el-input v-model="form.customerFeedback" type="textarea" :rows="2" placeholder="长者/家属对本次康养的反馈" :disabled="viewOnly" />
                </el-form-item>
              </el-form>
            </div>
          </div>
        </el-tab-pane>

        <!-- Tab2: 结算信息费用确认 -->
        <el-tab-pane label="费用结算" name="billing">
          <div class="tab-content">
            <!-- 康养天数调整 -->
            <div class="form-section">
              <div class="section-title">
                <el-icon><Calendar /></el-icon>
                <span>康养周期</span>
              </div>
              <el-form :model="feeForm" label-width="120px">
                <el-row :gutter="20">
                  <el-col :span="8">
                    <el-form-item label="入住日期">
                      <el-date-picker v-model="feeForm.checkinDate" type="date" value-format="YYYY-MM-DD" disabled style="width: 100%" />
                    </el-form-item>
                  </el-col>
                  <el-col :span="8">
                    <el-form-item label="退住日期">
                      <el-date-picker v-model="feeForm.checkoutDate" type="date" value-format="YYYY-MM-DD" style="width: 100%" :disabled="viewOnly" @change="recalcDays" />
                    </el-form-item>
                  </el-col>
                  <el-col :span="8">
                    <el-form-item label="实际天数">
                      <el-input-number v-model="feeForm.actualDays" :min="1" style="width: 100%" :disabled="viewOnly" @change="recalcFee" />
                    </el-form-item>
                  </el-col>
                </el-row>
              </el-form>
            </div>

            <!-- 收费项目 -->
            <div class="form-section">
              <div class="section-title">
                <el-icon><List /></el-icon>
                <span>收费项目</span>
              </div>
              
              <el-table :data="feeForm.feeItems" size="small" border style="margin-bottom: 16px">
                <el-table-column label="收费项目" prop="itemName" min-width="120">
                  <template #default="{ row }">
                    <span>{{ row.itemName }}</span>
                    <el-tag v-if="row.isOriginal" size="small" type="info" effect="plain" style="margin-left: 4px">原套餐</el-tag>
                  </template>
                </el-table-column>
                <el-table-column label="类型" min-width="120" align="center">
                  <template #default="{ row }">
                    <el-tag size="small" :type="getItemTypeColor(row.itemType)" effect="plain">{{ getItemTypeLabel(row.itemType) }}</el-tag>
                  </template>
                </el-table-column>
                <el-table-column label="计费方式" width="90" align="center">
                  <template #default="{ row }">
                    <span class="text-muted">{{ getChargeModeLabel(row.chargeMode) }}</span>
                  </template>
                </el-table-column>
                <el-table-column label="单价" width="80" align="right">
                  <template #default="{ row }">¥{{ row.unitPrice }}</template>
                </el-table-column>
                <el-table-column label="数量" width="150" align="center">
                  <template #default="{ row }">
                    <el-input-number v-model="row.quantity" :min="0" :max="999" size="small" style="width: 80px" controls-position="right" :disabled="viewOnly" @change="recalcFee" />
                  </template>
                </el-table-column>
                <el-table-column label="小计" width="150" align="right">
                  <template #default="{ row }">
                    <span class="price-text">¥{{ calcItemTotal(row).toFixed(2) }}</span>
                  </template>
                </el-table-column>
                <el-table-column label="操作" width="60" align="center">
                  <template #default="{ $index }">
                    <el-button v-if="!feeForm.feeItems[$index].isOriginal && !viewOnly" link type="danger" size="small" @click="removeFeeItem($index)">
                      <el-icon><Delete /></el-icon>
                    </el-button>
                  </template>
                </el-table-column>
              </el-table>

              <!-- 添加收费项目 -->
              <el-row :gutter="10" v-if="!viewOnly">
                <el-col :span="10">
                  <el-select v-model="newFeeItem.itemId" placeholder="选择收费项目" style="width: 100%">
                    <el-option-group label="增值服务">
                      <el-option v-for="item in availableFeeItems.filter(i => i.itemType === 1)" :key="item.id" :label="item.itemName + ' ¥' + item.unitPrice" :value="item.id" />
                    </el-option-group>
                    <el-option-group label="餐饮">
                      <el-option v-for="item in availableFeeItems.filter(i => i.itemType ===2)" :key="item.id" :label="item.itemName + ' ¥' + item.unitPrice" :value="item.id" />
                    </el-option-group>
                    <el-option-group label="医疗">
                      <el-option v-for="item in availableFeeItems.filter(i => i.itemType === 3)" :key="item.id" :label="item.itemName + ' ¥' + item.unitPrice" :value="item.id" />
                    </el-option-group>
                    <el-option-group label="清洁照护">
                      <el-option v-for="item in availableFeeItems.filter(i => i.itemType === 4)" :key="item.id" :label="item.itemName + ' ¥' + item.unitPrice" :value="item.id" />
                    </el-option-group>
                    <el-option-group label="损坏赔偿">
                      <el-option v-for="item in availableFeeItems.filter(i => i.itemType === 5)" :key="item.id" :label="item.itemName + ' ¥' + item.unitPrice" :value="item.id" />
                    </el-option-group>
                    <el-option-group label="其他">
                      <el-option v-for="item in availableFeeItems.filter(i => i.itemType === 6)" :key="item.id" :label="item.itemName + ' ¥' + item.unitPrice" :value="item.id" />
                    </el-option-group>
                  </el-select>
                </el-col>
                <el-col :span="6">
                  <el-input-number v-model="newFeeItem.quantity" :min="1" style="width: 100%" placeholder="数量" />
                </el-col>
                <el-col :span="4">
                  <el-button type="primary" @click="addFeeItem" :disabled="!newFeeItem.itemId">
                    <el-icon><Plus /></el-icon>添加
                  </el-button>
                </el-col>
              </el-row>
            </div>

            <!-- 费用汇总 -->
            <div class="form-section">
              <div class="section-title">
                <el-icon><Wallet /></el-icon>
                <span>费用汇总</span>
              </div>
              <div class="fee-summary-card">
                <el-row :gutter="40">
                  <el-col :span="12">
                    <div class="fee-row">
                      <span class="fee-label">康养费用（{{ feeForm.actualDays }}天，按年/月/日逐段）</span>
                      <span class="fee-value">¥{{ calcBedFeeTotal().toFixed(2) }}</span>
                    </div>
                    <div class="fee-row">
                      <span class="fee-label">其他项目费用</span>
                      <span class="fee-value">¥{{ calcOtherItemsTotal().toFixed(2) }}</span>
                    </div>
                    <div class="fee-row">
                      <span class="fee-label">小计</span>
                      <span class="fee-value" style="font-weight: 600">¥{{ calcSubtotal().toFixed(2) }}</span>
                    </div>
                  </el-col>
                  <el-col :span="12">
                    <div class="fee-row">
                      <span class="fee-label">已付押金</span>
                      <span class="fee-value" style="color: #E6A23C">¥{{ feeForm.deposit.toFixed(2) }}</span>
                    </div>
                    <el-divider style="margin: 12px 0" />
                    <div class="fee-row fee-total-row">
                      <span class="fee-label">{{ feeForm.finalAmount >= 0 ? '应收金额' : '应退金额' }}</span>
                      <span class="fee-value" :class="feeForm.finalAmount >= 0 ? 'amount-receivable' : 'amount-refundable'">
                        ¥{{ Math.abs(feeForm.finalAmount).toFixed(2) }}
                      </span>
                    </div>
                  </el-col>
                </el-row>
              </div>
            </div>
          </div>
        </el-tab-pane>
      </el-tabs>

      <!-- 底部操作栏 -->
      <div class="form-footer" v-if="!viewOnly">
        <el-button @click="goBack" round>取 消</el-button>
        <el-button type="primary" @click="saveDraft" round :loading="submitting">保存草稿</el-button>
        <el-button type="success" @click="completeCheckout" round :loading="submitting">
          <el-icon><Check /></el-icon>完成交接
        </el-button>
      </div>
    </el-card>
  </div>
</template>

<script setup name="ResidentCheckoutForm">
import { ref, reactive, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import { getCheckoutDetail, completeCheckout as completeCheckoutApi, submitDraftCheckout as submitDraftCheckoutApi } from '@/api/care/checkout'
import { getFeeItemList } from '@/api/care/billing'
import { getToken } from '@/utils/auth'
import { calcBedFee } from '@/utils/careEnums'

const route = useRoute()
const router = useRouter()

// 照片上传地址（OSS 上传）
const uploadAction = import.meta.env.VITE_APP_BASE_API + '/common/oss/upload'
// 上传请求头：统一携带登录凭证，避免网关或后续收紧鉴权导致上传失败
const uploadHeaders = computed(() => ({ Authorization: 'Bearer ' + getToken() }))

// 获取路由参数
const checkoutId = route.query.id

// Tab状态
const activeTab = ref('handover')

// 长者住养信息（一人一单：id 即登记单 e_store_checkin.id）
const petInfo = ref({
  id: undefined,
  residentName: '',
  residentNo: '',
  gender: 0,
  careLevel: '',
  contactPhone: '',
  roomName: '',
  bedNo: '',
  checkinDate: '',
  checkoutDate: '',
  actualDays: 0,
  deposit: 0,
  status: 0,
  broughtItems: '',
  checkinPhotoList: [],
  broughtPhotoList: [],
  checkoutPhotoList: []
})

// 查看模式：显式 viewOnly=1，或该记录已完成交接时自动只读
const viewOnly = computed(() => route.query.viewOnly === '1' || petInfo.value.status === 2)

// 交接表单
const form = ref({
  checkoutPhotos: "",
  healthChangeDesc: 0,
  appearanceChanges: '',
  careSummary: 0,
  returnedItems: [],
  itemsStatus: 0,
  itemsRemark: '',
  itemsConfirmed: 0,
  performance: '',
  healthReminder: '',
  suggestions: '',
  customerSatisfaction: 5,
  customerFeedback: ''
})

// 费用表单
const feeForm = reactive({
  checkinDate: '',
  checkoutDate: '',
  actualDays: 1,
  comboYearPrice: 0,
  comboMonthPrice: 0,
  comboDayPrice: 0,
  deposit: 0,
  feeItems: [],
  finalAmount: 0
})

// 离店照片列表（用于 el-upload）
const checkoutPhotoList = ref([])

// 收费项目
const allFeeItems = ref([])
const newFeeItem = ref({ itemId: undefined, quantity: 1 })

// 可用收费项目：基础康养费（itemType=0）已按床位日单价计算，不允许重复添加
const availableFeeItems = computed(() => {
  const existingItemIds = feeForm.feeItems.map(i => i.itemId)
  return allFeeItems.value.filter(item => item.status === 1 && item.itemType !== 0 && !existingItemIds.includes(item.id))
})

// 收费项目枚举值可能是数字或数字字符串，统一转数字后再比较/展示
function toFeeCode(value) {
  const num = Number(value)
  return Number.isFinite(num) ? num : value
}

// 归还物品选项（从带入物品解析）
const returnedItemOptions = computed(() => splitItems(petInfo.value.broughtItems))

// 提交中标记，防止重复提交
const submitting = ref(false)

// 本地日期字符串，避免 toISOString 在凌晨返回前一天
function todayStr() {
  const d = new Date()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${month}-${day}`
}

// 自然天数差（退住日 - 入住日，同一天记 1 天）
function dayDiff(startDate, endDate) {
  if (!startDate) return 1
  const toDay = (value) => {
    const d = new Date(String(value).substring(0, 10).replace(/-/g, '/'))
    return new Date(d.getFullYear(), d.getMonth(), d.getDate())
  }
  const start = toDay(startDate)
  const end = toDay(endDate || todayStr())
  return Math.max(1, Math.round((end - start) / (1000 * 60 * 60 * 24)))
}

// 拆分逗号分隔的物品文本，兼容中文逗号与顿号
function splitItems(text) {
  if (Array.isArray(text)) return text.filter(Boolean)
  if (typeof text !== 'string' || !text.trim()) return []
  return text.split(/[,，、]/).map(item => item.trim()).filter(Boolean)
}

// 从 el-upload 文件对象中提取 OSS 地址
function extractUrl(file) {
  if (!file) return ''
  if (typeof file === 'string') return file
  if (typeof file.url === 'string' && file.url) return file.url
  const data = file.response?.data
  if (typeof data === 'string') return data
  if (data && typeof data.url === 'string') return data.url
  return ''
}

// 后端返回的离店照片：逗号字符串优先，其次 wrapper 填充的列表
function toPhotoUrls(str, list) {
  const fromStr = typeof str === 'string' ? str.split(',').filter(Boolean) : []
  const fromList = Array.isArray(list) ? list : []
  return (fromStr.length ? fromStr : fromList)
    .map(item => (typeof item === 'string' ? item : item?.url || ''))
    .filter(Boolean)
}

// 工具函数
function getStatusType(status) {
  const map = { 0: 'warning', 1: 'primary', 2: 'success' }
  return map[status] || 'info'
}

function getStatusLabel(status) {
  const map = { 0: '待退住', 1: '交接中', 2: '已完成' }
  return map[status] || status
}

// 性别：0未知 1男 2女
function genderLabel(gender) {
  const map = { 0: '未知', 1: '男', 2: '女' }
  return map[gender] ?? '未知'
}

// 收费项目类型（0基础 1增值 2餐饮 3医疗 4照护 5赔偿 6其他），兼容数字与枚举字符串
const ITEM_TYPE_MAP = {
  0: { label: '基础', color: 'primary', code: 'BASIC' },
  1: { label: '增值', color: 'success', code: 'VALUE_ADDED' },
  2: { label: '餐饮', color: 'warning', code: 'FOOD' },
  3: { label: '医疗', color: 'danger', code: 'MEDICAL' },
  4: { label: '照护', color: '', code: 'GROOMING' },
  5: { label: '赔偿', color: 'danger', code: 'COMPENSATION' },
  6: { label: '其他', color: 'info', code: 'OTHER' }
}

// 计费方式（0按天 1按次 2固定 3按重 4按年 5按月），兼容数字与枚举字符串
const CHARGE_MODE_MAP = {
  0: { label: '按天', code: 'PER_DAY' },
  1: { label: '按次', code: 'PER_TIME' },
  2: { label: '固定', code: 'FIXED' },
  3: { label: '按重', code: 'PER_WEIGHT' },
  4: { label: '按年', code: 'PER_YEAR' },
  5: { label: '按月', code: 'PER_MONTH' }
}

function findEnumMeta(map, value) {
  const normalized = toFeeCode(value)
  if (map[normalized]) return map[normalized]
  // 兼容历史数据中以枚举名保存的值（如 MEDICAL / PER_DAY）
  return Object.values(map).find(meta => meta.code === value)
}

function getItemTypeColor(type) {
  return findEnumMeta(ITEM_TYPE_MAP, type)?.color || ''
}

function getItemTypeLabel(type) {
  return findEnumMeta(ITEM_TYPE_MAP, type)?.label || type
}

function getChargeModeLabel(mode) {
  return findEnumMeta(CHARGE_MODE_MAP, mode)?.label || mode
}

// 保留 2 位小数（HALF_UP），与后端 ChargeCalcKit 同口径
function round2(x) {
  return Math.round((Number(x) + Number.EPSILON) * 100) / 100
}

// 计算单项总价（与后端 ChargeCalcKit.calcItemAmount 同口径：
// 0按天=单价×量×天；4按年=单价/365×量×天；5按月=单价/30×量×天；1/2/3=单价×量）
function calcItemTotal(item) {
  const unitPrice = Number(item.unitPrice) || 0
  const quantity = Number(item.quantity) || 0
  const days = Number(feeForm.actualDays) || 0
  const mode = toFeeCode(item.chargeMode)
  if (mode === 0) return round2(unitPrice * quantity * days)
  if (mode === 4) return round2((unitPrice / 365) * quantity * days)
  if (mode === 5) return round2((unitPrice / 30) * quantity * days)
  return round2(unitPrice * quantity)
}

// 计算其他项目总价
function calcOtherItemsTotal() {
  return feeForm.feeItems
    .filter(i => !i.isBaseBoarding)
    .reduce((sum, item) => sum + calcItemTotal(item), 0)
}

// 基础康养费：有套餐三价快照时按实际天数逐段重算（与后端 CheckOutController 同口径）；无快照（异常数据）计 0
function calcBedFeeTotal() {
  const hasSnapshot = (Number(feeForm.comboYearPrice) || 0) > 0
      || (Number(feeForm.comboMonthPrice) || 0) > 0
      || (Number(feeForm.comboDayPrice) || 0) > 0
  if (hasSnapshot) {
    return round2(calcBedFee(feeForm.comboYearPrice, feeForm.comboMonthPrice, feeForm.comboDayPrice, Number(feeForm.actualDays) || 0))
  }
  return 0
}

// 计算小计
function calcSubtotal() {
  return calcBedFeeTotal() + calcOtherItemsTotal()
}

// 重新计算天数
function recalcDays() {
  feeForm.actualDays = dayDiff(feeForm.checkinDate, feeForm.checkoutDate)
  recalcFee()
}

// 重新计算费用
function recalcFee() {
  const subtotal = calcSubtotal()
  feeForm.finalAmount = round2(subtotal - feeForm.deposit)
  form.value.actualPayment = Math.max(0, feeForm.finalAmount)
}

// 添加收费项目
function addFeeItem() {
  const item = allFeeItems.value.find(i => i.id === newFeeItem.value.itemId)
  if (!item) return
  // 显式构造业务字段，避免把收费项目档案 ID 当成费用项记录 ID 随表单提交
  feeForm.feeItems.push({
    id: undefined,
    checkinId: petInfo.value.id,
    itemId: item.id,
    itemName: item.itemName,
    itemType: toFeeCode(item.itemType),
    chargeMode: toFeeCode(item.chargeMode),
    unitPrice: Number(item.unitPrice) || 0,
    quantity: newFeeItem.value.quantity,
    isOriginal: false,
    isBaseBoarding: false
  })

  newFeeItem.value = { itemId: undefined, quantity: 1 }
  recalcFee()
}

// 移除收费项目
function removeFeeItem(index) {
  feeForm.feeItems.splice(index, 1)
  recalcFee()
}

// 加载详情
async function loadDetail() {
  if (!checkoutId) return
  
  try {
    const res = await getCheckoutDetail(checkoutId)
    if (res.data) {
      const data = res.data
      // 后端未返回实际天数时，按入住日期到退住日期（或今天）预估
      const photos = toPhotoUrls(data.checkoutPhotos, data.checkoutPhotoList)
      petInfo.value = {
        id: data.id,
        checkoutNo: data.checkoutNo || '',
        residentName: data.residentName || '',
        residentNo: data.residentNo || '',
        gender: data.gender !== undefined && data.gender !== null ? data.gender : 0,
        careLevel: data.careLevel || '',
        contactPhone: data.contactPhone || '',
        roomName: data.roomName || '',
        bedNo: data.bedNo || '',
        checkinDate: data.checkinDate || '',
        checkoutDate: data.checkoutDate || '',
        actualDays: Number(data.actualDays) || dayDiff(data.checkinDate, data.checkoutDate),
        deposit: Number(data.deposit) || 0,
        status: data.checkoutStatus !== undefined && data.checkoutStatus !== null ? data.checkoutStatus : 0,
        itemsConfirmed: data.itemsConfirmed || 0,
        broughtItems: data.broughtItems || '',
        checkinPhotoList: data.checkinPhotoList || [],
        checkoutPhotoList: photos,
        broughtPhotoList: data.broughtPhotoList || []
      }
      
      // 离店照片转为 el-upload 需要的对象格式
      checkoutPhotoList.value = photos.map((url, index) => ({
        uid: Date.now() + index,
        name: url.split('/').pop() || 'image',
        status: 'success',
        url
      }))

      // 回显已保存的交接内容
      form.value.returnedItems = splitItems(data.returnedItems)
      form.value.itemsConfirmed = data.itemsConfirmed || 0
      form.value.itemsRemark = data.itemsRemark || ''
      form.value.itemsStatus = data.itemsStatus !== undefined && data.itemsStatus !== null ? data.itemsStatus : 0
      form.value.performance = data.performance || ''
      form.value.healthReminder = data.healthReminder || ''
      form.value.suggestions = data.suggestions || ''
      form.value.healthChangeDesc = data.healthChangeDesc !== undefined && data.healthChangeDesc !== null ? data.healthChangeDesc : 0
      form.value.careSummary = data.careSummary !== undefined && data.careSummary !== null ? data.careSummary : 0
      form.value.appearanceChanges = data.appearanceChanges || ''
      form.value.customerSatisfaction = data.customerSatisfaction || 5
      form.value.customerFeedback = data.customerFeedback || ''

      // 初始化费用
      initFeeForm(data)
    }
  } catch (error) {
    console.error('加载离店交接详情失败:', error)
    ElMessage.error('加载离店交接详情失败')
  }
}

// 初始化费用表单
function initFeeForm(data) {
  feeForm.checkinDate = data.checkinDate || ''
  // 查看模式下不默认填入今天，避免展示不存在的退住日期
  feeForm.checkoutDate = data.checkoutDate || (viewOnly.value ? '' : todayStr())
  feeForm.actualDays = Number(data.actualDays) || dayDiff(data.checkinDate, feeForm.checkoutDate)
  feeForm.comboYearPrice = Number(data.comboYearPrice) || 0
  feeForm.comboMonthPrice = Number(data.comboMonthPrice) || 0
  feeForm.comboDayPrice = Number(data.comboDayPrice) || 0
  feeForm.deposit = Number(data.deposit) || 0
  // 统一枚举值为数字，避免字符串数字导致类型标签/计费方式显示异常
  feeForm.feeItems = (data.feeItemList || []).map(item => ({
    ...item,
    itemId: item.itemId,
    itemType: toFeeCode(item.itemType),
    chargeMode: toFeeCode(item.chargeMode),
    unitPrice: Number(item.unitPrice) || 0,
    isOriginal: true,
    isBaseBoarding: toFeeCode(item.itemType) === 0 // 基础康养费
  }))
  recalcFee()
}

// 加载收费项目
async function loadFeeItems() {
  try {
    const res = await getFeeItemList({ pageSize: 999, enabled: true })
    allFeeItems.value = (res.data?.list || []).map(item => ({
      ...item,
      itemType: toFeeCode(item.itemType),
      chargeMode: toFeeCode(item.chargeMode),
      unitPrice: Number(item.unitPrice) || 0
    }))
  } catch {
    allFeeItems.value = []
  }
}

// 同步 el-upload 文件列表为已上传图片地址
function syncCheckoutPhotos(fileList) {
  checkoutPhotoList.value = (fileList || []).map(f => ({
    uid: f.uid || Date.now() + Math.random(),
    name: f.name || 'image',
    status: 'success',
    url: extractUrl(f)
  })).filter(f => f.url)
}

// 离店照片上传成功（兼容 data 为字符串或 { url } 对象两种返回格式）
function handleCheckoutPhotoUploadSuccess(res, file, fileList) {
  if (res?.code === 0) {
    const uploadedUrl = typeof res.data === 'string' ? res.data : (res.data?.url || '')
    if (uploadedUrl) {
      file.url = uploadedUrl
      file.response = res
    } else {
      ElMessage.error('退住照片上传失败：返回数据缺少图片地址')
    }
  } else {
    ElMessage.error(res?.msg || '退住照片上传失败')
  }
  syncCheckoutPhotos(fileList)
}

// 离店照片上传失败
function handleCheckoutPhotoUploadError() {
  ElMessage.error('退住照片上传失败，请重试')
}

// 离店照片移除
function handleCheckoutPhotoRemove(file, fileList) {
  syncCheckoutPhotos(fileList)
}

// 返回
function goBack() {
  router.push('/eyang/checkout')
}

// 组装提交数据（保存草稿与完成交接共用；一人一单只传登记单 id）
function buildSubmitData() {
  return {
    id: petInfo.value.id,  // 登记单 e_store_checkin.id
    // 身体状况检查
    healthChangeDesc: form.value.healthChangeDesc,
    careSummary: form.value.careSummary,
    appearanceChanges: form.value.appearanceChanges,

    // 物品清点
    returnedItems: Array.isArray(form.value.returnedItems) ? form.value.returnedItems.join(',') : '',
    itemsStatus: form.value.itemsStatus,
    itemsRemark: form.value.itemsRemark,

    // 意见叮嘱
    performance: form.value.performance,
    healthReminder: form.value.healthReminder,
    suggestions: form.value.suggestions,
    itemsConfirmed: form.value.itemsConfirmed,

    // 离店照片（转为逗号分隔）
    checkoutPhotos: checkoutPhotoList.value.map(extractUrl).filter(Boolean).join(','),

    // 费用信息
    checkoutDate: feeForm.checkoutDate || undefined,
    actualDays: feeForm.actualDays,

    // 满意度与反馈
    customerSatisfaction: form.value.customerSatisfaction,
    customerFeedback: form.value.customerFeedback,

    // 收费项目列表（基础康养费按日单价计算，不重复提交）
    feeItemList: feeForm.feeItems
      .filter(item => !item.isBaseBoarding)
      .map(item => ({
        id: item.id,
        checkinId: petInfo.value.id,
        itemId: item.itemId,
        itemName: item.itemName,
        itemType: item.itemType,
        chargeMode: item.chargeMode,
        unitPrice: item.unitPrice,
        quantity: item.quantity
      }))
  }
}

// 保存成功后回写主键与费用项 id，避免连续保存草稿重复插入收费项目
function applySavedResult(saved) {
  if (!saved) return
  petInfo.value.id = saved.id || petInfo.value.id
  petInfo.value.checkoutNo = saved.checkoutNo || petInfo.value.checkoutNo
  if (saved.checkoutStatus !== undefined && saved.checkoutStatus !== null) {
    petInfo.value.status = saved.checkoutStatus
  }
  const submittedItems = feeForm.feeItems.filter(item => !item.isBaseBoarding)
  const savedItems = saved.feeItemList || []
  savedItems.forEach((item, index) => {
    if (submittedItems[index] && submittedItems[index].id == null && item.id != null) {
      submittedItems[index].id = item.id
    }
  })
}

// 保存草稿
async function saveDraft() {
  if (submitting.value) return
  submitting.value = true
  try {
    const res = await submitDraftCheckoutApi(buildSubmitData())
    applySavedResult(res.data)
    ElMessage.success('草稿保存成功')
  } catch (error) {
    console.error('保存草稿失败:', error)
    ElMessage.error('保存草稿失败')
  } finally {
    submitting.value = false
  }
}

// 完成交接
async function completeCheckout() {
  const missing = []
  if (!feeForm.checkoutDate) missing.push('退住日期')
  if (!checkoutPhotoList.value.length) missing.push('退住时照片')
  if (form.value.itemsConfirmed !== 1) missing.push('物品交接确认')
  if (missing.length) {
    ElMessage.warning('请先完成：' + missing.join('、'))
    return
  }
  if (submitting.value) return
  submitting.value = true
  try {
    await completeCheckoutApi(buildSubmitData())
    ElMessage.success('退住交接完成，已生成待结算单')
    goBack()
  } catch (error) {
    console.error('提交失败:', error)
    ElMessage.error('提交失败')
  } finally {
    submitting.value = false
  }
}

onMounted(() => {
  loadDetail()
  loadFeeItems()
})
</script>

<style scoped>
.app-container {
  padding: 20px;
}

.info-card {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-header span {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
}

.checkout-tabs {
  margin-top: 20px;
}

.tab-content {
  padding: 10px 0;
}

.form-section {
  margin-bottom: 24px;
  padding-bottom: 20px;
  border-bottom: 1px dashed #dcdfe6;
}

.form-section:last-child {
  border-bottom: none;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 15px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 16px;
  padding-left: 10px;
  border-left: 3px solid #409EFF;
}

.photo-box {
  background: #f5f7fa;
  border-radius: 8px;
  padding: 10px;
  min-height: 200px;
}

/* 费用汇总卡片 */
.fee-summary-card {
  background: linear-gradient(135deg, #f5f7fa 0%, #e4e7ed 100%);
  border-radius: 12px;
  padding: 20px;
}

.fee-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  font-size: 14px;
}

.fee-label {
  color: #606266;
}

.fee-value {
  font-weight: 500;
  color: #303133;
}

.fee-total-row {
  font-size: 18px;
  font-weight: 700;
}

.amount-receivable {
  color: #f56c6c;
  font-size: 24px;
}

.amount-refundable {
  color: #67c23a;
  font-size: 24px;
}

.price-text {
  color: #f56c6c;
  font-weight: 600;
}

.text-muted {
  color: #909399;
  font-size: 12px;
}

/* 底部操作栏 */
.form-footer {
  display: flex;
  justify-content: center;
  gap: 16px;
  padding-top: 24px;
  border-top: 1px solid #ebeef5;
  margin-top: 20px;
}
</style>
