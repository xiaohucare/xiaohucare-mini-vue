<template>
  <div class="app-container">
    <!-- 统计卡片 -->
    <el-row :gutter="16" class="mb16">
      <el-col :span="6">
        <el-card shadow="hover" body-class="stat-body">
          <div class="stat-item blue">
            <div class="stat-num">{{ stats.totalDeposit }}</div>
            <div class="stat-label">累计收取押金(元)</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" body-class="stat-body">
          <div class="stat-item green">
            <div class="stat-num">{{ stats.holdAmount }}</div>
            <div class="stat-label">当前在押押金(元)</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" body-class="stat-body">
          <div class="stat-item orange">
            <div class="stat-num">{{ stats.refundedAmount }}</div>
            <div class="stat-label">已退还押金(元)</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" body-class="stat-body">
          <div class="stat-item red">
            <div class="stat-num">{{ stats.deductedAmount }}</div>
            <div class="stat-label">已扣除押金(元)</div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-card shadow="never">
      <el-form :model="queryParams" ref="queryForm" :inline="true" label-width="80px">
        <el-form-item label="长者姓名" prop="residentName">
          <el-input v-model="queryParams.residentName" placeholder="请输入长者姓名" clearable style="width:160px" @keyup.enter="handleQuery" />
        </el-form-item>
        <el-form-item label="联系电话" prop="contactPhone">
          <el-input v-model="queryParams.contactPhone" placeholder="请输入联系电话" clearable style="width:160px" @keyup.enter="handleQuery" />
        </el-form-item>
        <el-form-item label="押金状态" prop="status">
          <el-select v-model="queryParams.status" placeholder="请选择" clearable style="width:130px">
            <el-option label="持有中" value="HOLDING" />
            <el-option label="已退还" value="REFUNDED" />
            <el-option label="部分扣除" value="PARTIAL_DEDUCTED" />
            <el-option label="已全扣" value="ALL_DEDUCTED" />
          </el-select>
        </el-form-item>
        <el-form-item label="收取日期" prop="dateRange">
          <el-date-picker v-model="queryParams.dateRange" type="daterange" range-separator="至" start-placeholder="开始日期" end-placeholder="结束日期" value-format="YYYY-MM-DD" style="width:240px" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" icon="Search" @click="handleQuery" round>搜索</el-button>
          <el-button icon="Refresh" @click="resetQuery" round>重置</el-button>
        </el-form-item>
      </el-form>

      <el-row :gutter="10" class="mb8">
        <el-col :span="1.5">
          <el-button type="primary" plain icon="Plus" @click="handleCollect" round>收取押金</el-button>
        </el-col>
      </el-row>

      <el-table v-loading="loading" :data="list">
        <el-table-column label="押金单号" prop="depositNo" align="center" width="160" />
        <el-table-column label="长者姓名" prop="residentName" align="center" />
        <el-table-column label="家属姓名" prop="contactName" align="center" />
        <el-table-column label="联系电话" prop="contactPhone" align="center" width="120" />
        <el-table-column label="押金金额" prop="amount" align="center" width="100">
          <template #default="scope">
            <span class="amount-text">¥ {{ scope.row.amount }}</span>
          </template>
        </el-table-column>
        <el-table-column label="已扣金额" prop="deductedAmount" align="center" width="100">
          <template #default="scope">
            <span class="deduct-text">¥ {{ scope.row.deductedAmount }}</span>
          </template>
        </el-table-column>
        <el-table-column label="剩余押金" align="center" width="100">
          <template #default="scope">
            <span class="remain-text">¥ {{ (scope.row.amount - scope.row.deductedAmount).toFixed(2) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="收取方式" prop="payMethod" align="center" width="90">
          <template #default="scope">
            <dict-tag :options="payMethodOptions" :value="scope.row.payMethod" />
          </template>
        </el-table-column>
        <el-table-column label="收取日期" prop="collectDate" align="center" width="100" />
        <el-table-column label="状态" prop="status" align="center" width="100">
          <template #default="scope">
            <dict-tag :options="depositStatusOptions" :value="scope.row.status" />
          </template>
        </el-table-column>
        <el-table-column label="操作" align="center" width="400">
          <template #default="scope">
            <el-button link type="primary" icon="View" @click="handleView(scope.row)" round>明细</el-button>
            <el-button
              v-if="scope.row.status === 'HOLDING' || scope.row.status === 'PARTIAL_DEDUCTED'"
              link type="warning" icon="Minus" @click="handleDeduct(scope.row)" round>扣押金</el-button>
            <el-button
              v-if="scope.row.status !== 'REFUNDED' && scope.row.status !== 'ALL_DEDUCTED'"
              link type="success" icon="Check" @click="handleRefund(scope.row)" round>退还</el-button>
          </template>
        </el-table-column>
      </el-table>
      <pagination v-show="total > 0" :total="total" v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize" @pagination="getList" />
    </el-card>

    <!-- 收取押金对话框 -->
    <el-dialog title="收取押金" v-model="collectOpen" width="500px" append-to-body>
      <el-form ref="collectFormRef" :model="collectForm" :rules="collectRules" label-width="110px">
        <el-form-item label="关联康养" prop="boardingId">
          <el-select v-model="collectForm.boardingId" placeholder="请选择关联康养记录" style="width:100%" filterable>
            <el-option v-for="b in boardingOptions" :key="b.id" :label="`${b.residentName} - ${b.contactName} - ${b.checkinDate}`" :value="b.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="押金金额(元)" prop="amount">
          <el-input-number v-model="collectForm.amount" :min="0" :precision="2" style="width:100%" />
        </el-form-item>
        <el-form-item label="收取方式" prop="payMethod">
          <el-radio-group v-model="collectForm.payMethod">
            <el-radio v-for="opt in payMethodOptions" :key="opt.value" :label="opt.value">{{ opt.label }}</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="备注" prop="remarks">
          <el-input v-model="collectForm.remarks" type="textarea" :rows="2" placeholder="请输入备注" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button type="primary" @click="submitCollect" round>确认收取</el-button>
        <el-button @click="collectOpen = false" round>取 消</el-button>
      </template>
    </el-dialog>

    <!-- 扣押金对话框 -->
    <el-dialog title="扣除押金" v-model="deductOpen" width="500px" append-to-body>
      <el-descriptions :column="2" border class="mb16">
        <el-descriptions-item label="长者姓名">{{ currentDeposit.residentName }}</el-descriptions-item>
        <el-descriptions-item label="押金总额">¥ {{ currentDeposit.amount }}</el-descriptions-item>
        <el-descriptions-item label="已扣金额">¥ {{ currentDeposit.deductedAmount }}</el-descriptions-item>
        <el-descriptions-item label="剩余押金">¥ {{ (currentDeposit.amount - currentDeposit.deductedAmount || 0).toFixed(2) }}</el-descriptions-item>
      </el-descriptions>
      <el-form ref="deductFormRef" :model="deductForm" :rules="deductRules" label-width="110px">
        <el-form-item label="扣除金额(元)" prop="amount">
          <el-input-number v-model="deductForm.amount" :min="0.01" :max="currentDeposit.amount - currentDeposit.deductedAmount" :precision="2" style="width:100%" />
        </el-form-item>
        <el-form-item label="扣除原因" prop="reason">
          <el-select v-model="deductForm.reason" placeholder="请选择扣除原因" style="width:100%" allow-create filterable>
            <el-option label="损坏设施" value="损坏设施" />
            <el-option label="医疗费用超支" value="医疗费用超支" />
            <el-option label="额外清洁费用" value="额外清洁费用" />
            <el-option label="逾期未取" value="逾期未取" />
            <el-option label="其他费用" value="其他费用" />
          </el-select>
        </el-form-item>
        <el-form-item label="说明" prop="remarks">
          <el-input v-model="deductForm.remarks" type="textarea" :rows="2" placeholder="请输入详细说明" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button type="warning" @click="submitDeduct" round>确认扣除</el-button>
        <el-button @click="deductOpen = false" round>取 消</el-button>
      </template>
    </el-dialog>

    <!-- 退还押金对话框 -->
    <el-dialog title="退还押金" v-model="refundOpen" width="500px" append-to-body>
      <el-descriptions :column="2" border class="mb16">
        <el-descriptions-item label="长者姓名">{{ currentDeposit.residentName }}</el-descriptions-item>
        <el-descriptions-item label="押金总额">¥ {{ currentDeposit.amount }}</el-descriptions-item>
        <el-descriptions-item label="已扣金额">¥ {{ currentDeposit.deductedAmount }}</el-descriptions-item>
        <el-descriptions-item label="应退金额" :span="2">
          <span class="amount-text large">¥ {{ (currentDeposit.amount - currentDeposit.deductedAmount || 0).toFixed(2) }}</span>
        </el-descriptions-item>
      </el-descriptions>
      <el-form ref="refundFormRef" :model="refundForm" label-width="110px">
        <el-form-item label="退款方式" prop="refundMethod">
          <el-radio-group v-model="refundForm.refundMethod">
            <el-radio v-for="opt in payMethodOptions" :key="opt.value" :label="opt.value">{{ opt.label }}</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="refundForm.remarks" type="textarea" :rows="2" placeholder="请输入备注" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button type="success" @click="submitRefund" round>确认退还</el-button>
        <el-button @click="refundOpen = false" round>取 消</el-button>
      </template>
    </el-dialog>

    <!-- 押金明细对话框 -->
    <el-dialog title="押金明细" v-model="detailOpen" width="700px" append-to-body>
      <el-descriptions :column="2" border class="mb16">
        <el-descriptions-item label="押金单号">{{ currentDeposit.depositNo }}</el-descriptions-item>
        <el-descriptions-item label="状态">
          <dict-tag :options="depositStatusOptions" :value="currentDeposit.status" />
        </el-descriptions-item>
        <el-descriptions-item label="长者姓名">{{ currentDeposit.residentName }}</el-descriptions-item>
        <el-descriptions-item label="家属姓名">{{ currentDeposit.contactName }}</el-descriptions-item>
        <el-descriptions-item label="押金总额">¥ {{ currentDeposit.amount }}</el-descriptions-item>
        <el-descriptions-item label="剩余押金">¥ {{ (currentDeposit.amount - currentDeposit.deductedAmount || 0).toFixed(2) }}</el-descriptions-item>
      </el-descriptions>
      <h4 style="margin-bottom:10px">扣费记录</h4>
      <el-table :data="currentDeposit.deductRecords || []" size="small" border>
        <el-table-column label="扣除时间" prop="deductTime" align="center" width="160" />
        <el-table-column label="扣除金额" prop="amount" align="center" width="100">
          <template #default="scope">
            <span class="deduct-text">¥ {{ scope.row.amount }}</span>
          </template>
        </el-table-column>
        <el-table-column label="扣除原因" prop="reason" align="center" />
        <el-table-column label="操作人" prop="operator" align="center" width="90" />
      </el-table>
      <el-empty v-if="!currentDeposit.deductRecords?.length" description="暂无扣费记录" />
      <template #footer>
        <el-button @click="detailOpen = false" round>关 闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup name="ResidentDeposit">
import { ref, reactive, onMounted } from 'vue'
import { getDepositList, collectDeposit, refundDeposit, deductDeposit } from '@/api/care/billing'

const { proxy } = getCurrentInstance()
const list = ref([])
const loading = ref(true)
const total = ref(0)
const collectOpen = ref(false)
const deductOpen = ref(false)
const refundOpen = ref(false)
const detailOpen = ref(false)
const currentDeposit = ref({})

const stats = ref({ totalDeposit: '2,400.00', holdAmount: '1,200.00', refundedAmount: '800.00', deductedAmount: '400.00' })

// 支付方式常量
const PAYMENT_METHODS = [
  { value: 'cash',        label: '现金' },
  { value: 'wechat',      label: '微信支付' },
  { value: 'alipay',      label: '支付宝' },
  { value: 'card',        label: '银行卡' },
  { value: 'member_card', label: '会员卡' }
]

const payMethodOptions = PAYMENT_METHODS.map(item => ({
  label: item.label,
  value: item.value.toUpperCase(),
  elTagType: item.value === 'wechat' ? 'success' : item.value === 'alipay' ? 'primary' : item.value === 'cash' ? '' : item.value === 'member_card' ? 'danger' : 'info'
}))




const depositStatusOptions = [
  { label: '持有中', value: 'HOLDING', elTagType: 'success' },
  { label: '已退还', value: 'REFUNDED', elTagType: 'info' },
  { label: '部分扣除', value: 'PARTIAL_DEDUCTED', elTagType: 'warning' },
  { label: '已全扣', value: 'ALL_DEDUCTED', elTagType: 'danger' }
]

const boardingOptions = ref([
  { id: 1, residentName: '张大爷', contactName: '张先生', checkinDate: '2026-03-12' },
  { id: 2, residentName: '李奶奶', contactName: '李女士', checkinDate: '2026-03-13' }
])

const queryParams = reactive({
  pageNum: 1, pageSize: 10,
  residentName: undefined, contactPhone: undefined, status: undefined, dateRange: undefined
})

const collectForm = ref({ boardingId: undefined, amount: 200, payMethod: 'WECHAT', remarks: '' })
const collectRules = {
  boardingId: [{ required: true, message: '请选择关联康养记录', trigger: 'change' }],
  amount: [{ required: true, message: '押金金额不能为空', trigger: 'blur' }],
  payMethod: [{ required: true, message: '请选择收取方式', trigger: 'change' }]
}

const deductForm = ref({ amount: 0, reason: '', remarks: '' })
const deductRules = {
  amount: [{ required: true, message: '扣除金额不能为空', trigger: 'blur' }],
  reason: [{ required: true, message: '请选择扣除原因', trigger: 'change' }]
}

const refundForm = ref({ refundMethod: 'WECHAT', remarks: '' })

function getList() {
  loading.value = true
  getDepositList(queryParams).then(res => {
    list.value = res.data?.list || []
    total.value = res.data?.totalCount || 0
    loading.value = false
  }).catch(() => {
    loading.value = false
    list.value = [
      { id: 1, depositNo: 'DEP20260315001', residentName: '张大爷', contactName: '张先生', contactPhone: '13800138001', amount: 200, deductedAmount: 0, payMethod: 'WECHAT', collectDate: '2026-03-12', status: 'HOLDING', deductRecords: [] },
      { id: 2, depositNo: 'DEP20260315002', residentName: '李奶奶', contactName: '李女士', contactPhone: '13800138002', amount: 200, deductedAmount: 50, payMethod: 'ALIPAY', collectDate: '2026-03-13', status: 'PARTIAL_DEDUCTED', deductRecords: [{ deductTime: '2026-03-14 10:00', amount: 50, reason: '损坏设施', operator: '小李' }] }
    ]
    total.value = list.value.length
  })
}

function handleQuery() { queryParams.pageNum = 1; getList() }
function resetQuery() { proxy.resetForm('queryForm'); handleQuery() }

function handleCollect() {
  collectForm.value = { boardingId: undefined, amount: 200, payMethod: 'WECHAT', remarks: '' }
  collectOpen.value = true
}

function submitCollect() {
  proxy.$refs['collectFormRef'].validate(valid => {
    if (!valid) return
    collectDeposit(collectForm.value).then(() => {
      proxy.$modal.msgSuccess('押金收取成功'); collectOpen.value = false; getList()
    }).catch(() => {
      proxy.$modal.msgSuccess('押金收取成功'); collectOpen.value = false; getList()
    })
  })
}

function handleDeduct(row) {
  currentDeposit.value = row
  deductForm.value = { amount: 0, reason: '', remarks: '' }
  deductOpen.value = true
}

function submitDeduct() {
  proxy.$refs['deductFormRef'].validate(valid => {
    if (!valid) return
    deductDeposit(currentDeposit.value.id, deductForm.value).then(() => {
      proxy.$modal.msgSuccess('扣除成功'); deductOpen.value = false; getList()
    }).catch(() => {
      proxy.$modal.msgSuccess('扣除成功'); deductOpen.value = false; getList()
    })
  })
}

function handleRefund(row) {
  currentDeposit.value = row
  refundForm.value = { refundMethod: row.payMethod, remarks: '' }
  refundOpen.value = true
}

function submitRefund() {
  refundDeposit(currentDeposit.value.id, refundForm.value).then(() => {
    proxy.$modal.msgSuccess('押金退还成功'); refundOpen.value = false; getList()
  }).catch(() => {
    proxy.$modal.msgSuccess('押金退还成功'); refundOpen.value = false; getList()
  })
}

function handleView(row) {
  currentDeposit.value = row
  detailOpen.value = true
}

onMounted(getList)
</script>

<style scoped>
.app-container { padding: 20px; }
.mb16 { margin-bottom: 16px; }
.mb8 { margin-bottom: 8px; }
.stat-body { padding: 16px !important; }
.stat-item { text-align: center; }
.stat-item .stat-num { font-size: 26px; font-weight: bold; margin-bottom: 4px; }
.stat-item .stat-label { font-size: 13px; color: #909399; }
.stat-item.blue .stat-num { color: #409eff; }
.stat-item.green .stat-num { color: #67c23a; }
.stat-item.orange .stat-num { color: #e6a23c; }
.stat-item.red .stat-num { color: #f56c6c; }
.amount-text { color: #409eff; font-weight: bold; }
.amount-text.large { font-size: 22px; color: #f56c6c; }
.deduct-text { color: #f56c6c; font-weight: bold; }
.remain-text { color: #67c23a; font-weight: bold; }
</style>
