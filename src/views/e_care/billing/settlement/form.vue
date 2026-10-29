<template>
  <div class="app-container">
    <el-card shadow="never">
      <!-- 页面头部 -->
      <el-page-header @back="goBack" content="结算详情" style="margin-bottom: 20px" />

      <!-- 登记订单信息 -->
      <el-card shadow="never" class="info-card">
        <template #header>
          <div class="card-header">
            <span>
              <el-icon><Document /></el-icon>
              登记订单信息
            </span>
            <el-tag :type="getCheckinStatusTagType(orderInfo.checkinStatus)">{{ getCheckinStatusName(orderInfo.checkinStatus) }}</el-tag>
          </div>
        </template>
        <el-descriptions :column="4" border>
          <el-descriptions-item label="登记单号">{{ orderInfo.orderNo }}</el-descriptions-item>
          <el-descriptions-item label="登记日期">{{ orderInfo.checkinDate }}</el-descriptions-item>
           <el-descriptions-item label="入住长者">{{ resident.residentName || '-' }}</el-descriptions-item>
           <el-descriptions-item label="计划时长">
            <span style="color: #409EFF; font-weight: 600">{{ orderInfo.chargeNum }} {{ getChargeCycleName(orderInfo.chargeCycle) }}（约 {{ plannedDays(orderInfo.chargeNum, orderInfo.chargeCycle) }} 天）</span>
          </el-descriptions-item>
          <el-descriptions-item label="离店日期">{{ orderInfo.checkoutDate || '待定' }}</el-descriptions-item>
         
          <el-descriptions-item label="预约来源">
            <el-tag v-if="orderInfo.appointmentId" type="success" size="small">预约转登记</el-tag>
            <el-tag v-else type="info" size="small">直接登记</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="登记人员">{{ orderInfo.createBy }}</el-descriptions-item>
        <el-descriptions-item label="结算状态">
            <el-tag :type="getSettledType(orderInfo.settled)" size="small">
              {{ getSettledText(orderInfo.settled) }}
            </el-tag>
          </el-descriptions-item>
        </el-descriptions>
      </el-card>

      <!-- 家属/联系人信息 -->
      <el-card shadow="never" class="info-card">
        <template #header>
          <div class="card-header">
            <span>
              <el-icon><User /></el-icon>
              家属/联系人信息
            </span>
          </div>
        </template>
        <el-descriptions :column="4" border>
          <el-descriptions-item label="联系人姓名">
            <span style="font-weight: 600">{{ ownerInfo.nickname }}</span>
          </el-descriptions-item>
          <el-descriptions-item label="联系电话">{{ ownerInfo.mobile }}</el-descriptions-item>
          <el-descriptions-item label="备用电话">{{ ownerInfo.linkPhone || '-' }}</el-descriptions-item>
           <el-descriptions-item label="地址" :span="3">{{ ownerInfo.address || '-' }}</el-descriptions-item>
         <el-descriptions-item label="会员卡号">
            <span v-if="ownerCard.cardNo" style="color: #409EFF; font-weight: 600">{{ ownerCard.cardNo }}</span>
            <span v-else>-</span>
          </el-descriptions-item>
          <el-descriptions-item label="会员状态">
             <el-tag v-if="ownerCard.cardLevel>-1" :type="getCardLevelType(ownerCard.cardLevel)" effect="dark" size="small">
                  {{ getCardLevelLabel(ownerCard.cardLevel) }}
             </el-tag>
            <span v-else style="color: #909399">非会员</span>
          </el-descriptions-item>
          <el-descriptions-item label="会员卡余额">
            <span v-if="ownerCard.balance" style="color: #E6A23C; font-weight: 600">¥{{ ownerCard.balance }}</span>
            <span v-else>-</span>
          </el-descriptions-item>
         </el-descriptions>
      </el-card>

      
      <!-- 长者结算信息 -->
      <el-card shadow="never" class="info-card">
        <template #header>
          <div class="card-header">
            <span>
              <el-icon><UserFilled /></el-icon>
              长者结算信息
            </span>
          </div>
        </template>

        <!-- 入住长者（一人一单） -->
        <div class="pet-settlement-card">
          <div class="pet-header">
            <div class="pet-title">
              <el-tag :type="resident.gender === 1 ? 'primary' : resident.gender === 2 ? 'danger' : 'info'" size="small">
                {{ genderLabel(resident.gender) }}
              </el-tag>
              <span class="pet-name">{{ resident.residentName }}</span>
              <span class="pet-petTypeName">{{ resident.residentNo }}</span>
              <el-tag type="success" size="small">{{ resident.bedNo || '未分配' }}</el-tag>
            </div>
            <div class="pet-fee-summary">
              <span class="fee-label">小计：</span>
              <span class="fee-value">¥{{ calcResidentTotal().toFixed(2) }}</span>
            </div>
          </div>

          <!-- 详细信息 -->
          <div class="pet-detail">
            <!-- 基本信息 -->
            <div class="pet-section">
              <div class="section-title">基本信息</div>
              <el-row :gutter="20">
                <el-col :span="6">
                  <div class="info-item">
                    <span class="label">照护等级</span>
                    <span class="value">{{ resident.careLevel || '未评估' }}</span>
                  </div>
                </el-col>
                <el-col :span="6">
                  <div class="info-item">
                    <span class="label">入住日期</span>
                    <span class="value">{{ resident.checkinDate }}</span>
                  </div>
                </el-col>
                <el-col :span="6">
                  <div class="info-item">
                    <span class="label">离店日期</span>
                    <span class="value">{{ resident.checkoutDate || '待定' }}</span>
                  </div>
                </el-col>
                <el-col :span="6">
                  <div class="info-item">
                    <span class="label">实际天数</span>
                    <span class="value" style="color: #409EFF; font-weight: 600">{{ resident.actualDays }} 天</span>
                  </div>
                </el-col>
              </el-row>
            </div>

            <!-- 费用明细 -->
            <div class="pet-section">
              <div class="section-title">费用明细</div>
              <el-table :data="resident.feeItems" size="small" border>
                <el-table-column label="收费项目" prop="itemName" min-width="120" />
                <el-table-column label="类型" width="80" align="center">
                  <template #default="{ row }">
                    <el-tag :type="getItemTypeColor(row.itemType)" size="small" effect="plain">
                      {{ getItemTypeLabel(row.itemType) }}
                    </el-tag>
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
                <el-table-column label="数量" width="100" align="center">
                  <template #default="{ row }">
                    <el-input-number 
                      v-model="row.quantity" 
                      :min="0" 
                      :max="999" 
                      size="small" 
                      style="width: 80px"
                      controls-position="right"
                      :disabled="isSettled"
                      @change="recalcAll"
                    />
                  </template>
                </el-table-column>
                <el-table-column label="小计" width="100" align="right">
                  <template #default="{ row }">
                    <span class="price-text">¥{{ calcItemTotal(row, resident.actualDays).toFixed(2) }}</span>
                  </template>
                </el-table-column>
                <el-table-column label="操作" width="60" align="center">
                  <template #default="{ row, $index }">
                    <el-button 
                      v-if="!isSettled && !row.isOriginal" 
                      link 
                      type="danger" 
                      size="small" 
                      @click="removeFeeItem($index)"
                    >
                      <el-icon><Delete /></el-icon>
                    </el-button>
                  </template>
                </el-table-column>
              </el-table>

              <!-- 添加收费项目 -->
              <el-row :gutter="10" style="margin-top: 12px" v-if="!isSettled">
                <el-col :span="10">
                  <el-select v-model="resident.newFeeItem.itemId" placeholder="选择收费项目" style="width: 100%">
                    <el-option-group label="增值服务">
                      <el-option 
                        v-for="item in getAvailableFeeItems()" 
                        :key="item.id" 
                        :label="item.itemName + ' ¥' + item.unitPrice" 
                        :value="item.id" 
                      />
                    </el-option-group>
                  </el-select>
                </el-col>
                <el-col :span="6">
                  <el-input-number v-model="resident.newFeeItem.quantity" :min="1" style="width: 100%" placeholder="数量" />
                </el-col>
                <el-col :span="4">
                  <el-button type="primary" size="small" @click="addFeeItem()" :disabled="!resident.newFeeItem.itemId">
                    <el-icon><Plus /></el-icon>添加
                  </el-button>
                </el-col>
              </el-row>
            </div>

            <!-- 押金与备注 -->
            <div class="pet-section">
              <el-row :gutter="20">
                <el-col :span="8">
                  <div class="info-item">
                    <span class="label">已付押金</span>
                    <span class="value" style="color: #E6A23C; font-weight: 600">¥{{ resident.deposit }}</span>
                  </div>
                </el-col>
                <el-col :span="8">
                  <div class="info-item">
                    <span class="label">计费单价</span>
                    <span class="value">¥{{ resident.periodPrice }}{{ getChargeCycleUnit(resident.chargeCycle) }}</span>
                  </div>
                </el-col>
                <el-col :span="8">
                  <div class="info-item">
                    <span class="label">费用小计</span>
                    <span class="value" style="color: #f56c6c; font-weight: 600">¥{{ calcResidentTotal().toFixed(2) }}</span>
                  </div>
                </el-col>
              </el-row>
            </div>
          </div>
        </div>
      </el-card>

      <!-- 结算汇总 -->
      <el-card shadow="never" class="info-card">
        <template #header>
          <div class="card-header">
            <span>
              <el-icon><Wallet /></el-icon>
              结算汇总
            </span>
          </div>
        </template>
        <div class="settlement-summary">
          <el-row :gutter="40">
            <el-col :span="12">
              <div class="summary-section">
                <div class="summary-title">费用明细</div>
                <div class="summary-row">
                  <span class="label">康养费用</span>
                  <span class="value">¥{{ summary.bedFee.toFixed(2) }}</span>
                </div>
                <div class="summary-row">
                  <span class="label">增值服务</span>
                  <span class="value">¥{{ summary.serviceFee.toFixed(2) }}</span>
                </div>
                <div class="summary-row">
                  <span class="label">餐饮费用</span>
                  <span class="value">¥{{ summary.mealFee.toFixed(2) }}</span>
                </div>
                <div class="summary-row">
                  <span class="label">医疗照护</span>
                  <span class="value">¥{{ summary.careFee.toFixed(2) }}</span>
                </div>
                <div class="summary-row">
                  <span class="label">其他费用</span>
                  <span class="value">¥{{ summary.otherFee.toFixed(2) }}</span>
                </div>
                <div class="summary-row total">
                  <span class="label">费用小计</span>
                  <span class="value">¥{{ summary.subtotal.toFixed(2) }}</span>
                </div>
              </div>
            </el-col>
            <el-col :span="12">
              <div class="summary-section">
                <div class="summary-title">结算信息</div>
                <div class="summary-row">
                  <span class="label">费用总计</span>
                  <span class="value" style="color: #f56c6c; font-weight: 600">¥{{ summary.subtotal.toFixed(2) }}</span>
                </div>
                <div class="summary-row">
                  <span class="label">已付押金</span>
                  <span class="value" style="color: #E6A23C">¥{{ summary.totalDeposit.toFixed(2) }}</span>
                </div>
                <div class="summary-row">
                  <span class="label">优惠金额</span>
                  <el-input-number 
                    v-model="summary.discount" 
                    :min="0" 
                    :precision="2" 
                    size="small" 
                    style="width: 120px"
                    :disabled="isSettled"
                    @change="recalcAll"
                  />
                </div>
                <el-divider style="margin: 12px 0" />
                <div class="summary-row final">
                  <span class="label">{{ summary.finalAmount >= 0 ? '应收金额' : '应退金额' }}</span>
                  <span :class="summary.finalAmount >= 0 ? 'value amount-receivable' : 'value amount-refundable'">
                    ¥{{ Math.abs(summary.finalAmount).toFixed(2) }}
                  </span>
                </div>
              </div>
            </el-col>
          </el-row>
        </div>
      </el-card>

      <!-- 支付确认 -->
      <el-card shadow="never" class="info-card">
        <template #header>
          <div class="card-header">
            <span>
              <el-icon><CreditCard /></el-icon>
              支付确认
            </span>
          </div>
        </template>
        <el-alert
          v-if="summary.finalAmount < 0"
          :title="'本次结算应退押金 ¥' + Math.abs(summary.finalAmount).toFixed(2) + '，确认结算后押金状态将标记为已退款'"
          type="warning"
          :closable="false"
          style="margin-bottom: 16px"
        />
        <el-form :model="paymentForm" label-width="120px">
          <el-row :gutter="20">
            <el-col :span="8">
              <el-form-item label="支付方式">
                <el-select v-model="paymentForm.paymentMethod" placeholder="请选择" style="width: 100%" :disabled="isSettled">
                  <el-option label="现金" value="CASH" />
                  <el-option label="微信" value="WECHAT" />
                  <el-option label="支付宝" value="ALIPAY" />
                  <el-option label="银行卡" value="CARD" />
                  <el-option label="会员卡余额" value="MEMBER_CARD" :disabled="!(ownerCard.balance && Number(ownerCard.balance) > 0)" />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-form-item label="实收金额">
                <el-input-number v-model="paymentForm.actualPayment" :min="0" style="width: 100%" :disabled="isSettled" />
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-form-item label="找零/退款">
                <span :style="{ 
                  color: paymentForm.actualPayment > Math.max(0, summary.finalAmount) ? '#f56c6c' : '#67c23a', 
                  fontWeight: 'bold',
                  fontSize: '16px'
                }">
                  ¥{{ Math.abs(paymentForm.actualPayment - Math.max(0, summary.finalAmount)).toFixed(2) }}
                </span>
              </el-form-item>
            </el-col>
          </el-row>
          <el-form-item label="结算备注">
            <el-input v-model="paymentForm.remark" type="textarea" :rows="2" placeholder="结算备注信息" :disabled="isSettled" />
          </el-form-item>
        </el-form>
      </el-card>

      <!-- 底部操作栏 -->
      <div class="form-footer">
        <el-button @click="goBack" round>取 消</el-button>
        <el-button v-if="!isSettled" type="success" @click="submitSettlement" round :disabled="!canSubmit">
          <el-icon><Check /></el-icon>确认结算
        </el-button>
      </div>
    </el-card>
  </div>
</template>

<script setup name="ResidentSettlementForm">
import { ref, reactive, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { getSettlementDetail, submitSettlement as submitSettlementApi } from '@/api/care/billing'
import { getFeeItemList } from '@/api/care/billing'
import { FEE_CHARGE_MODE, getChargeModeLabel, getCheckinStatusName, getCheckinStatusTagType, calcBedFee, getChargeCycleName, getChargeCycleUnit, plannedDays } from '@/utils/careEnums'

const route = useRoute()
const router = useRouter()

const orderId = route.query.id

// 登记订单信息
const orderInfo = ref({
  orderNo: '',
  checkinDate: '',
  checkoutDate: '',
  actualDays: 0,
  checkinStatus: 0,
  appointmentId: null,
  createBy: '',
  packageName: '',
  chargeNum: 0,
  chargeCycle: undefined,
  settled: false
})

// 主人信息
const ownerInfo = ref({
  ownerName: '',
  ownerPhone: '',
  ownerPhoneBackup: '',
  memberLevel: '',
  cardBalance: 0,
  address: ''
})

const ownerCard = ref({
  balance: '',
  cardNo: '',
  cardLevel: '',
  memberLevel: '',
  cardBalance: 0,
  address: ''
})

// 入住长者（一人一单）
const resident = ref({
  id: null,
  residentName: '',
  residentNo: '',
  gender: 0,
  careLevel: '',
  checkinDate: '',
  checkoutDate: '',
  actualDays: 0,
  periodPrice: 0,
  chargeCycle: undefined,
  comboYearPrice: 0,
  comboMonthPrice: 0,
  comboDayPrice: 0,
  deposit: 0,
  bedNo: '',
  feeItems: [],
  newFeeItem: { itemId: undefined, quantity: 1 }
})

// 所有收费项目
const allFeeItems = ref([])

// 结算汇总
const summary = reactive({
  bedFee: 0,
  serviceFee: 0,
  mealFee: 0,
  careFee: 0,
  otherFee: 0,
  subtotal: 0,
  totalDeposit: 0,
  discount: 0,
  finalAmount: 0
})

// 支付表单
const paymentForm = reactive({
  paymentMethod: 'WECHAT',
  actualPayment: 0,
  remark: ''
})

// 是否已结算（已结算后只读查看）
const isSettled = computed(() => orderInfo.value.settled === 2)

// 是否可提交
const canSubmit = computed(() => {
  if (isSettled.value || !resident.value.id) return false
  // 退款场景（应退押金）无需选择收款方式
  if (summary.finalAmount < 0) return true
  return !!paymentForm.paymentMethod
})

// 工具函数
function getSettledType(settled) {
  const map = { 0: 'info', 1: 'warning', 2: 'success' }
  return map[settled] || 'info'
}

function getSettledText(settled) {
  const map = { 0: '未结算', 1: '待结算', 2: '已结算' }
  return map[settled] ?? '未知'
}
function getCardLevelType(level) {
  const map = { 0: '', 1: 'info', 2: 'warning', 3: 'danger' }
  return map[level] ?? ''
}
function getCardLevelLabel(level) {
  const map = { 0: '普通卡', 1: '银卡', 2: '金卡', 3: '钻石卡' }
  return map[level] ?? '未知'
}

// 性别：0未知 1男 2女
function genderLabel(gender) {
  const map = { 0: '未知', 1: '男', 2: '女' }
  return map[gender] ?? '未知'
}

function getItemTypeColor(type) {
  // 支持数字和字符串两种类型（后端 itemType：0基础 1增值 2餐饮 3医疗 4照护 5赔偿 6其他）
  const typeMap = {
    0: 'BASIC',
    1: 'VALUE_ADDED',
    2: 'FOOD',
    3: 'MEDICAL',
    4: 'GROOMING',
    5: 'COMPENSATION',
    6: 'OTHER'
  }
  const normalizedType = typeof type === 'number' ? (typeMap[type] || type) : type
  const map = { BASIC: 'primary', VALUE_ADDED: 'success', FOOD: 'warning', MEDICAL: 'danger', GROOMING: '', COMPENSATION: 'danger', OTHER: 'info' }
  return map[normalizedType] || ''
}

function getItemTypeLabel(type) {
  // 后端 itemType：0基础 1增值 2餐饮 3医疗 4照护 5赔偿 6其他
  const typeMap = {
    0: '基础',
    1: '增值',
    2: '餐饮',
    3: '医疗',
    4: '照护',
    5: '赔偿',
    6: '其他'
  }
  const normalizedType = typeof type === 'number' ? (typeMap[type] || type) : type
  const map = { BASIC: '基础', VALUE_ADDED: '增值', FOOD: '餐饮', MEDICAL: '医疗', GROOMING: '照护', COMPENSATION: '赔偿', OTHER: '其他' }
  return map[normalizedType] || type
}

// 保留 2 位小数（HALF_UP，与后端 ChargeCalcKit 一致）
function round2(x) {
  return Math.round((Number(x) + Number.EPSILON) * 100) / 100
}

// 计算单项总价（0按天/4按年/5按月 按实际天数折算，其余按单价×数量）
function calcItemTotal(item, days) {
  const unitPrice = Number(item.unitPrice) || 0
  const quantity = Number(item.quantity) || 0
  const d = Number(days) || 0
  const mode = Number(item.chargeMode)
  if (mode === FEE_CHARGE_MODE.PER_DAY) return round2(unitPrice * quantity * d)
  if (mode === FEE_CHARGE_MODE.PER_YEAR) return round2((unitPrice / 365) * quantity * d)
  if (mode === FEE_CHARGE_MODE.PER_MONTH) return round2((unitPrice / 30) * quantity * d)
  return round2(unitPrice * quantity)
}

// 计算长者总费用
function calcResidentTotal() {
  const r = resident.value
  return r.feeItems.reduce((sum, item) => sum + calcItemTotal(item, r.actualDays), 0)
}

// 获取可用收费项目
function getAvailableFeeItems() {
  const existingIds = resident.value.feeItems.map(i => i.itemId)
  return allFeeItems.value.filter(item => {
    // 仅启用状态、未添加过、且非基础康养费（0）的项目可选
    return item.status === 1 && !existingIds.includes(item.id) && item.itemType !== 0
  })
}

// 添加收费项目
function addFeeItem() {
  const r = resident.value
  const item = allFeeItems.value.find(i => i.id === r.newFeeItem.itemId)
  if (!item) return

  r.feeItems.push({
    id: undefined,
    itemId: item.id,
    itemName: item.itemName,
    itemType: item.itemType,
    chargeMode: item.chargeMode,
    unitPrice: item.unitPrice,
    quantity: r.newFeeItem.quantity,
    isOriginal: false
  })

  r.newFeeItem = { itemId: undefined, quantity: 1 }
  recalcAll()
}

// 移除收费项目
function removeFeeItem(itemIndex) {
  resident.value.feeItems.splice(itemIndex, 1)
  recalcAll()
}

// 重新计算所有费用
function recalcAll() {
  const r = resident.value
  // 基础康养费：有套餐三价快照时按实际天数逐段重算（与后端 CheckOutController 同口径）；无快照（异常数据）计 0
  let bedFee
  const hasSnapshot = (Number(r.comboYearPrice) || 0) > 0
      || (Number(r.comboMonthPrice) || 0) > 0
      || (Number(r.comboDayPrice) || 0) > 0
  if (hasSnapshot) {
    bedFee = calcBedFee(r.comboYearPrice, r.comboMonthPrice, r.comboDayPrice, Number(r.actualDays) || 0)
  } else {
    bedFee = 0
  }
  let serviceFee = 0
  let mealFee = 0
  let careFee = 0
  let otherFee = 0

  r.feeItems.forEach(item => {
    const itemTotal = calcItemTotal(item, r.actualDays)
    const type = item.itemType
    if (type === 1 || type === 4) {
      serviceFee += itemTotal
    } else if (type === 2) {
      mealFee += itemTotal
    } else if (type === 3) {
      careFee += itemTotal
    } else {
      otherFee += itemTotal
    }
  })

  bedFee = round2(bedFee)
  summary.bedFee = bedFee
  summary.serviceFee = serviceFee
  summary.mealFee = mealFee
  summary.careFee = careFee
  summary.otherFee = otherFee
  summary.subtotal = round2(bedFee + serviceFee + mealFee + careFee + otherFee - summary.discount)
  summary.totalDeposit = Number(r.deposit) || 0
  summary.finalAmount = round2(summary.subtotal - summary.totalDeposit)

  paymentForm.actualPayment = Math.max(0, summary.finalAmount)
}

// 加载详情
async function loadDetail() {
  if (!orderId) return
  
  try {
    const res = await getSettlementDetail(orderId)
    if (res.data) {
      const data = res.data
      
      // 填充订单信息
      orderInfo.value = {
        orderNo: data.checkinNo || '',
        checkinDate: data.checkinDate || '',
        checkoutDate: data.checkoutDate || '',
        actualDays: data.actualDays || 0,
        checkinStatus: data.checkinStatus || 0,
        appointmentId: data.appointmentId || null,
        createBy: data.createBy || '',
        chargeNum: data.chargeNum || 0,
        chargeCycle: data.chargeCycle,
        settled: data.settled || 0
      }
      
      // 填充家属/联系人信息
      ownerInfo.value = { nickname: data.contactName || '', mobile: data.contactPhone || '', linkPhone: data.contactPhoneBackup || '', address: '' };
      ownerCard.value = data.cardVO || {};
      
      // 填充入住长者（一人一单，字段直接挂在登记单本行）
      resident.value = {
        id: data.id,
        residentName: data.residentName || '',
        residentNo: data.residentNo || '',
        gender: data.gender !== undefined && data.gender !== null ? data.gender : 0,
        careLevel: data.careLevel || '',
        checkinDate: data.checkinDate || '',
        checkoutDate: data.checkoutDate || '',
        actualDays: data.actualDays || 0,
        periodPrice: data.periodPrice || 0,
        chargeCycle: data.chargeCycle,
        comboYearPrice: data.comboYearPrice || 0,
        comboMonthPrice: data.comboMonthPrice || 0,
        comboDayPrice: data.comboDayPrice || 0,
        deposit: data.deposit || 0,
        bedNo: data.bedNo || '',
        feeItems: (data.feeItemList || []).map(item => ({
          id: item.id,
          itemId: item.itemId,
          itemName: item.itemName || '',
          itemType: item.itemType,
          chargeMode: item.chargeMode,
          unitPrice: item.unitPrice || 0,
          quantity: item.quantity || 1,
          isOriginal: item.isOriginal === 1 || item.isOriginal === true
        })),
        newFeeItem: { itemId: undefined, quantity: 1 }
      }
      
      recalcAll()
      // 回显后端结算单费用（退住预生成/已结算），优先于前端重算结果
      if (data.bedFee !== undefined && data.bedFee !== null) {
        summary.bedFee = Number(data.bedFee) || 0
        summary.serviceFee = Number(data.serviceFee) || 0
        summary.mealFee = Number(data.mealFee) || 0
        summary.careFee = Number(data.careFee) || 0
        summary.otherFee = Number(data.otherFee) || 0
        summary.subtotal = Number(data.subtotal) || 0
        summary.totalDeposit = Number(data.totalDeposit) || summary.totalDeposit
        summary.discount = Number(data.settledDiscount) || 0
        if (data.settledFinalAmount !== undefined && data.settledFinalAmount !== null) {
          summary.finalAmount = Number(data.settledFinalAmount)
        }
        paymentForm.actualPayment = Number(data.settledActualPayment) || 0
        paymentForm.paymentMethod = data.settledPaymentMethod || 'WECHAT'
      }
    }
  } catch (error) {
    console.error('加载结算详情失败:', error)
    ElMessage.error('加载结算详情失败')
  }
}

// 返回
function goBack() {
  router.push('/eyang/settlement')
}

// 提交结算
async function submitSettlement() {
  if (!canSubmit.value) {
    ElMessage.warning('请完成必填项')
    return
  }
  
  // 构建提交数据 - 与后端 CheckinVO 字段匹配（一人一单，feeItemList 扁平挂本单）
  const submitData = {
    id: orderId,  // 登记ID
    bedFee: summary.bedFee,
    serviceFee: summary.serviceFee,
    mealFee: summary.mealFee,
    careFee: summary.careFee,
    otherFee: summary.otherFee,
    subtotal: summary.subtotal,
    totalAmount: summary.subtotal,
    settledDiscount: summary.discount,
    settledFinalAmount: summary.finalAmount,
    settledPaymentMethod: paymentForm.paymentMethod,
    settledActualPayment: paymentForm.actualPayment,
    remarks: paymentForm.remark,
    feeItemList: resident.value.feeItems.map(item => ({
      id: item.id,
      checkinId: resident.value.id,
      itemId: item.itemId,
      itemName: item.itemName,
      itemType: item.itemType,
      chargeMode: item.chargeMode,
      quantity: item.quantity,
      unitPrice: item.unitPrice
    }))
  }
  
  try {
    await submitSettlementApi(submitData)
    ElMessage.success('结算成功')
    goBack()
  } catch (error) {
    console.error('结算失败:', error)
    ElMessage.error(error.message || '结算失败')
  }
}

onMounted(() => {
  loadDetail()
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

/* 宠物结算卡片 */
.pet-settlement-card {
  background: #f7f8fa;
  border-radius: 8px;
  margin-bottom: 16px;
  overflow: hidden;
}

.pet-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  background: #fff;
  border-bottom: 1px solid #e4e7ed;
  cursor: pointer;
}

.pet-header:hover {
  background: #f5f7fa;
}

.pet-title {
  display: flex;
  align-items: center;
  gap: 8px;
}

.pet-title .expand-icon {
  transition: transform 0.3s;
}

.pet-title .expand-icon.is-expanded {
  transform: rotate(90deg);
}

.pet-title .pet-name {
  font-weight: 600;
  font-size: 15px;
}

.pet-title .pet-petTypeName {
  color: #909399;
  font-size: 13px;
}

.pet-fee-summary .fee-label {
  color: #909399;
  font-size: 13px;
}

.pet-fee-summary .fee-value {
  color: #f56c6c;
  font-weight: 600;
  font-size: 16px;
}

.pet-detail {
  padding: 16px;
}

.pet-section {
  margin-bottom: 16px;
  padding-bottom: 16px;
  border-bottom: 1px dashed #dcdfe6;
}

.pet-section:last-child {
  border-bottom: none;
  margin-bottom: 0;
  padding-bottom: 0;
}

.section-title {
  font-size: 13px;
  font-weight: 600;
  color: #606266;
  margin-bottom: 12px;
  padding-left: 8px;
  border-left: 3px solid #409EFF;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.info-item .label {
  font-size: 12px;
  color: #909399;
}

.info-item .value {
  font-size: 14px;
  color: #303133;
}

/* 结算汇总 */
.settlement-summary {
  padding: 8px 0;
}

.summary-section {
  background: #f5f7fa;
  border-radius: 8px;
  padding: 16px;
}

.summary-title {
  font-weight: 600;
  color: #303133;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid #e4e7ed;
}

.summary-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  font-size: 14px;
}

.summary-row .label {
  color: #606266;
}

.summary-row .value {
  font-weight: 500;
}

.summary-row.total {
  border-top: 1px dashed #dcdfe6;
  margin-top: 8px;
  padding-top: 12px;
  font-weight: 600;
}

.summary-row.final {
  font-size: 18px;
}

.amount-receivable {
  color: #f56c6c;
  font-size: 24px;
  font-weight: 700;
}

.amount-refundable {
  color: #67c23a;
  font-size: 24px;
  font-weight: 700;
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
}
</style>
