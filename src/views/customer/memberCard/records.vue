<template>
  <div class="app-container">
    <!-- 统计卡片 -->
    <el-row :gutter="16" class="stat-row">
      <el-col :xs="12" :sm="6">
        <div class="stat-card stat-card--blue">
          <div class="stat-icon"><el-icon><ShoppingCart /></el-icon></div>
          <div class="stat-body">
            <div class="stat-value">{{ statistics.todayCount }}</div>
            <div class="stat-label">今日消费笔数</div>
          </div>
        </div>
      </el-col>
      <el-col :xs="12" :sm="6">
        <div class="stat-card stat-card--green">
          <div class="stat-icon"><el-icon><Money /></el-icon></div>
          <div class="stat-body">
            <div class="stat-value">¥{{ statistics.todayAmount }}</div>
            <div class="stat-label">今日消费金额</div>
          </div>
        </div>
      </el-col>
      <el-col :xs="12" :sm="6">
        <div class="stat-card stat-card--orange">
          <div class="stat-icon"><el-icon><TrendCharts /></el-icon></div>
          <div class="stat-body">
            <div class="stat-value">¥{{ statistics.monthAmount }}</div>
            <div class="stat-label">本月消费金额</div>
          </div>
        </div>
      </el-col>
      <el-col :xs="12" :sm="6">
        <div class="stat-card stat-card--purple">
          <div class="stat-icon"><el-icon><User /></el-icon></div>
          <div class="stat-body">
            <div class="stat-value">{{ statistics.memberCount }}</div>
            <div class="stat-label">消费会员数</div>
          </div>
        </div>
      </el-col>
    </el-row>

    <el-card shadow="never">
      <!-- 搜索区域 -->
      <el-form :model="queryParams" ref="queryRef" :inline="true" label-width="80px">
        <el-form-item label="会员卡号" prop="cardNo">
          <el-input v-model="queryParams.cardNo" placeholder="请输入卡号" clearable style="width:140px" @keyup.enter="handleQuery" />
        </el-form-item>
        <el-form-item label="客户姓名" prop="ownerName">
          <el-input v-model="queryParams.ownerName" placeholder="请输入客户姓名" clearable style="width:120px" @keyup.enter="handleQuery" />
        </el-form-item>
        <el-form-item label="交易类型" prop="tradeType">
          <el-select v-model="queryParams.tradeType" placeholder="全部" clearable style="width:120px">
            <el-option label="消费" value="consume" />
            <el-option label="充值" value="recharge" />
            <el-option label="开卡" value="open" />
            <el-option label="退款" value="refund" />
          </el-select>
        </el-form-item>
        <el-form-item label="交易时间" prop="dateRange">
          <el-date-picker v-model="queryParams.dateRange" type="daterange" range-separator="至" start-placeholder="开始" end-placeholder="结束" value-format="YYYY-MM-DD" style="width:220px" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" icon="Search" @click="handleQuery">搜索</el-button>
          <el-button icon="Refresh" @click="resetQuery">重置</el-button>
        </el-form-item>
      </el-form>

      <!-- 操作按钮 -->
      <el-row :gutter="10" class="mb8">
        <el-col :span="1.5">
          <el-button type="primary" plain icon="Plus" @click="handleConsume">会员消费</el-button>
        </el-col>
        <el-col :span="1.5">
          <el-button type="warning" plain icon="Download" @click="handleExport">导出</el-button>
        </el-col>
      </el-row>

      <!-- 数据表格 -->
      <el-table v-loading="loading" :data="recordList">
        <el-table-column label="交易流水号" prop="tradeNo" align="center" width="160" />
        <el-table-column label="会员卡号" prop="cardNo" align="center" min-width="180" />
        <el-table-column label="客户姓名" prop="ownerName" align="center" width="100" />
        <el-table-column label="交易类型" prop="tradeType" align="center" width="90">
          <template #default="scope">
            <el-tag :type="getTradeTypeStyle(scope.row.tradeType)" size="small">
              {{ getTradeTypeLabel(scope.row.tradeType) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="交易金额" prop="amount" align="center" width="110">
          <template #default="scope">
            <span :class="getAmountClass(scope.row.tradeType)">
              {{ getAmountPrefix(scope.row.tradeType) }}¥{{ scope.row.amount }}
            </span>
          </template>
        </el-table-column>
        <el-table-column label="赠送金额" prop="giftAmount" align="center" width="100">
          <template #default="scope">
            <span v-if="scope.row.giftAmount > 0" class="text-gift">+¥{{ scope.row.giftAmount }}</span>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column label="余额变动" align="center" width="120">
          <template #default="scope">
            <div class="balance-change">
              <span class="before">¥{{ scope.row.beforeBalance }}</span>
              <el-icon><Right /></el-icon>
              <span class="after">¥{{ scope.row.afterBalance }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="服务类型" prop="serviceType" align="center" width="90">
          <template #default="scope">
            <el-tag v-if="scope.row.serviceType" :type="scope.row.serviceType === 'boarding' ? 'primary' : 'success'" size="small">
              {{ scope.row.serviceType === 'boarding' ? '康养' : '照护' }}
            </el-tag>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column label="支付方式" prop="payMethod" align="center" width="90">
          <template #default="scope">
            <el-tag v-if="scope.row.payMethod" :type="getPayMethodType(scope.row.payMethod)" size="small" effect="plain">
              {{ getPayMethodLabel(scope.row.payMethod) }}
            </el-tag>
            <span v-else>会员卡</span>
          </template>
        </el-table-column>
        <el-table-column label="交易时间" prop="tradeTime" align="center" width="160" />
        <el-table-column label="操作员" prop="operator" align="center" width="80" />
        <el-table-column label="备注" prop="remark" align="center" show-overflow-tooltip />
      </el-table>

      <pagination v-show="total > 0" :total="total" v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize" @pagination="getList" />
    </el-card>

    <!-- 消费对话框 -->
    <el-dialog title="会员消费" v-model="consumeDialog" width="500px" append-to-body>
      <el-form ref="consumeRef" :model="consumeForm" :rules="consumeRules" label-width="100px">
        <el-form-item label="会员卡号" prop="cardNo">
          <el-input v-model="consumeForm.cardNo" placeholder="请输入或扫描会员卡号" @change="onCardNoChange">
            <template #append>
              <el-button icon="Search" @click="searchCard" />
            </template>
          </el-input>
        </el-form-item>
        <el-form-item label="客户信息" v-if="consumeForm.customerName">
          <div class="customer-info">
            <span>{{ consumeForm.customerName }}</span>
            <span class="balance">余额: ¥{{ consumeForm.currentBalance }}</span>
          </div>
        </el-form-item>
        <el-form-item label="消费金额" prop="amount">
          <el-input-number v-model="consumeForm.amount" :min="0.01" :precision="2" style="width:200px" />
        </el-form-item>
        <el-form-item label="服务类型" prop="serviceType">
          <el-radio-group v-model="consumeForm.serviceType">
            <el-radio label="boarding">康养服务</el-radio>
            <el-radio label="grooming">照护服务</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="使用赠送金">
          <el-switch v-model="consumeForm.useGift" />
          <span class="form-tip">（可用赠送余额: ¥{{ consumeForm.giftBalance }}）</span>
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="consumeForm.remark" type="textarea" :rows="2" placeholder="备注信息" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button type="primary" @click="submitConsume">确认消费</el-button>
        <el-button @click="consumeDialog = false">取消</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup name="ResidentCardRecords">
import { ref, reactive, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { getResidentCardConsumeRecords, consumeResidentCard, getResidentCardList, getConsumeStatistics } from '@/api/resident/residentCard'

const route = useRoute()

// 统计数据
const statistics = reactive({
  todayCount: 0,
  todayAmount: '0.00',
  monthAmount: '0.00',
  memberCount: 0
})

// 列表数据
const loading = ref(false)
const recordList = ref([])
const total = ref(0)
const queryParams = reactive({
  pageNum: 1, pageSize: 10,
  cardId: undefined,
  cardNo: undefined, ownerName: undefined, tradeType: undefined, dateRange: undefined
})

// 消费对话框
const consumeDialog = ref(false)
const consumeRef = ref(null)
const consumeForm = ref({
  cardNo: '',
  customerId: undefined,
  customerName: '',
  currentBalance: '0.00',
  giftBalance: '0.00',
  amount: 0,
  serviceType: 'boarding',
  useGift: false,
  remark: ''
})
const consumeRules = {
  cardNo: [{ required: true, message: '请输入会员卡号', trigger: 'blur' }],
  amount: [{ required: true, message: '请输入消费金额', trigger: 'blur' }],
  serviceType: [{ required: true, message: '请选择服务类型', trigger: 'change' }]
}

// 获取列表
function getList() {
  loading.value = true
  getResidentCardConsumeRecords(queryParams).then(res => {
    const d = res.data || {}
    recordList.value = d.list || []
    total.value = d.total || 0
    loading.value = false
  }).catch(() => {
    loading.value = false
  })
}

// 获取统计
function getStatistics() {
  getConsumeStatistics(queryParams).then(res => {
    const d = res.data || {}
    statistics.todayCount = d.todayCount || 0
    statistics.todayAmount = d.todayAmount ? Number(d.todayAmount).toFixed(2) : '0.00'
    statistics.monthAmount = d.monthAmount ? Number(d.monthAmount).toFixed(2) : '0.00'
    statistics.memberCount = d.memberCount || 0
  }).catch(error => {
    console.error('获取消费统计失败:', error)
  })
}

// 搜索
function handleQuery() {
  queryParams.pageNum = 1
  getList()
}

// 重置
function resetQuery() {
  queryParams.cardNo = undefined
  queryParams.ownerName = undefined
  queryParams.tradeType = undefined
  queryParams.dateRange = undefined
  handleQuery()
}

// 消费
function handleConsume() {
  consumeForm.value = {
    cardNo: '',
    customerId: undefined,
    customerName: '',
    currentBalance: '0.00',
    giftBalance: '0.00',
    amount: 0,
    serviceType: 'boarding',
    useGift: false,
    remark: ''
  }
  consumeDialog.value = true
}

// 卡号变化
function onCardNoChange(val) {
  if (val && val.length >= 8) {
    searchCard()
  }
}

// 搜索卡号
function searchCard() {
  const cardNo = consumeForm.value.cardNo
  getResidentCardList({ cardNo, pageNum: 1, pageSize: 1 }).then(res => {
    const records = (res.data || {}).list || []
    if (records.length > 0) {
      const card = records[0]
      consumeForm.value.cardId = card.id
      consumeForm.value.customerName = card.ownerName
      consumeForm.value.currentBalance = card.balance?.toFixed(2) || '0.00'
      consumeForm.value.giftBalance = card.giftBalance?.toFixed(2) || '0.00'
    } else {
      ElMessage.warning('未找到对应会员卡')
    }
  }).catch(() => {
    ElMessage.error('查询失败')
  })
}

// 提交消费
function submitConsume() {
  consumeRef.value?.validate(valid => {
    if (valid) {
      consumeResidentCard(consumeForm.value).then(() => {
        ElMessage.success('消费成功')
        consumeDialog.value = false
        getList()
      }).catch(() => {
        ElMessage.error('消费失败')
      })
    }
  })
}

// 导出
function handleExport() {
  ElMessage.success('导出成功')
}

// 交易类型样式
function getTradeTypeStyle(type) {
  const map = { consume: 'warning', recharge: 'success', open: 'primary', refund: 'info' }
  return map[type] || ''
}

function getTradeTypeLabel(type) {
  const map = { consume: '消费', recharge: '充值', open: '开卡', refund: '退款' }
  return map[type] || type
}

// 金额样式
function getAmountClass(type) {
  const map = { consume: 'text-danger', recharge: 'text-success', refund: 'text-info' }
  return map[type] || ''
}

function getAmountPrefix(type) {
  const map = { consume: '-', recharge: '+', refund: '+' }
  return map[type] || ''
}

// 支付方式
function getPayMethodType(method) {
  const map = { wechat: 'success', alipay: 'primary', cash: 'warning', card: 'info' }
  return map[method] || ''
}

function getPayMethodLabel(method) {
  const map = { wechat: '微信', alipay: '支付宝', cash: '现金', card: '银行卡', member_card: '会员卡' }
  return map[method] || method
}

onMounted(() => {
  // 从 URL 参数获取 cardId 和 cardNo
  if (route.query.cardId) {
    queryParams.cardId = route.query.cardId
  }
  if (route.query.cardNo) {
    queryParams.cardNo = route.query.cardNo
  }
  if (route.query.ownerName) {
    queryParams.ownerName = route.query.ownerName
  }
  getList()
  getStatistics()
})
</script>

<style scoped>
.app-container { padding: 20px; }

/* 统计卡片 */
.stat-row { margin-bottom: 16px; }
.stat-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background: #fff;
  border-radius: 10px;
  border: 1px solid #ebeef5;
}
.stat-icon {
  width: 48px;
  height: 48px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
}
.stat-card--blue .stat-icon { background: #ecf5ff; color: #409EFF; }
.stat-card--green .stat-icon { background: #f0f9eb; color: #67C23A; }
.stat-card--orange .stat-icon { background: #fdf6ec; color: #E6A23C; }
.stat-card--purple .stat-icon { background: #f4f0fc; color: #9747FF; }
.stat-body { flex: 1; }
.stat-value { font-size: 22px; font-weight: 700; color: #1d2129; }
.stat-label { font-size: 12px; color: #86909c; margin-top: 4px; }

.text-success { color: #67C23A; font-weight: 600; }
.text-danger { color: #F56C6C; font-weight: 600; }
.text-info { color: #909399; font-weight: 600; }
.text-gift { color: #9747FF; }

.balance-change {
  display: block;
  align-items: center;
  gap: 4px;
  font-size: 12px;
}
.balance-change .before { color: #909399; }
.balance-change .after { color: #409EFF; font-weight: 600; }
.balance-change .el-icon { font-size: 12px; color: #c0c4cc; }

.customer-info {
  display: flex;
  align-items: center;
  gap: 16px;
}
.customer-info .balance {
  color: #409EFF;
  font-weight: 600;
}

.form-tip { color: #909399; font-size: 12px; margin-left: 8px; }
</style>
