<template>
  <div class="app-container">
     <!-- 统计卡片 -->
    <el-row :gutter="16" class="stat-row">
      <el-col :xs="12" :sm="6" :md="4">
        <div class="stat-card stat-card--blue">
          <div class="stat-icon"><el-icon><User /></el-icon></div>
          <div class="stat-body">
            <div class="stat-value">{{ statistics.totalCustomers }}</div>
            <div class="stat-label">客户总数</div>
          </div>
        </div>
      </el-col>
      <el-col :xs="12" :sm="6" :md="4">
        <div class="stat-card stat-card--green">
          <div class="stat-icon"><el-icon><CreditCard /></el-icon></div>
          <div class="stat-body">
            <div class="stat-value">{{ statistics.memberCount }}</div>
            <div class="stat-label">会员数量</div>
          </div>
        </div>
      </el-col>
      <el-col :xs="12" :sm="6" :md="4">
        <div class="stat-card stat-card--orange">
          <div class="stat-icon"><el-icon><Plus /></el-icon></div>
          <div class="stat-body">
            <div class="stat-value">{{ statistics.newCustomers }}</div>
            <div class="stat-label">本月新增</div>
          </div>
        </div>
      </el-col>
      <el-col :xs="12" :sm="6" :md="4">
        <div class="stat-card stat-card--purple">
          <div class="stat-icon"><el-icon><Wallet /></el-icon></div>
          <div class="stat-body">
            <div class="stat-value">{{ statistics.monthCheckin }}</div>
            <div class="stat-label">本月入住</div>
          </div>
        </div>
      </el-col>
      <el-col :xs="12" :sm="6" :md="4">
        <div class="stat-card stat-card--cyan">
          <div class="stat-icon"><el-icon><TrendCharts /></el-icon></div>
          <div class="stat-body">
            <div class="stat-value">¥{{ statistics.monthDeposit }}</div>
            <div class="stat-label">本月押金</div>
          </div>
        </div>
      </el-col>
      <el-col :xs="12" :sm="6" :md="4">
        <div class="stat-card stat-card--red">
          <div class="stat-icon"><el-icon><ShoppingCart /></el-icon></div>
          <div class="stat-body">
            <div class="stat-value">¥{{ statistics.monthConsume }}</div>
            <div class="stat-label">本月消费</div>
          </div>
        </div>
      </el-col>
    </el-row>
    <!-- 快捷导航 -->
    <el-card shadow="never" class="nav-card">
      <div class="quick-nav">
        <div class="nav-item" @click="goTo('/customer/residentCard')">
          <div class="nav-icon nav-icon--purple"><el-icon><CreditCard /></el-icon></div>
          <div class="nav-text">
            <div class="nav-title">会员卡管理</div>
            <div class="nav-desc">开卡、充值、消费管理</div>
          </div>
        </div>
        <div class="nav-item" @click="goTo('/customer/residentCard/records')">
          <div class="nav-icon nav-icon--cyan"><el-icon><List /></el-icon></div>
          <div class="nav-text">
            <div class="nav-title">消费记录</div>
            <div class="nav-desc">会员交易流水查询</div>
          </div>
        </div>
        <div class="nav-item" @click="goTo('/customer/pet')">
          <div class="nav-icon nav-icon--orange"><el-icon><Avatar /></el-icon></div>
          <div class="nav-text">
            <div class="nav-title">长者档案</div>
            <div class="nav-desc">长者信息与照护记录</div>
          </div>
        </div>
      </div>
 </el-card>
    <!-- 搜索区 + 操作按钮 -->
    <el-card shadow="never" class="search-card">
      <el-form :model="queryParams" ref="queryRef" :inline="true" v-show="showSearch">
        <el-form-item label="姓名/昵称" prop="name">
          <el-input v-model="queryParams.name" placeholder="姓名或昵称" clearable style="width:180px" @keyup.enter="handleQuery" />
        </el-form-item>
        <el-form-item label="手机号" prop="mobile">
          <el-input v-model="queryParams.mobile" placeholder="手机号" clearable style="width:160px" @keyup.enter="handleQuery" />
        </el-form-item>
      
        <el-form-item>
          <el-button type="primary" icon="Search" @click="handleQuery">搜索</el-button>
          <el-button icon="Refresh" @click="resetQuery">重置</el-button>
        </el-form-item>
      </el-form>
      <el-row :gutter="10">
        <el-col :span="1.5">
          <el-button type="primary" plain icon="Plus" @click="handleAdd">新增客户</el-button>
        </el-col>
        <el-col :span="1.5">
          <el-button type="danger" plain icon="Delete" :disabled="multiple" @click="handleDelete()">删除</el-button>
        </el-col>
        <el-col :span="1.5">
          <el-button type="warning" plain icon="Download" @click="handleExport">导出</el-button>
        </el-col>
        <right-toolbar v-model:showSearch="showSearch" @queryTable="getList" />
      </el-row>
    </el-card>

    <!-- 数据表格 -->
    <el-table v-loading="loading" :data="customerList" @selection-change="handleSelectionChange">
      <el-table-column type="selection" width="50" align="center" />
      <!-- <el-table-column label="ID" prop="id" width="80" align="center" /> -->
      <el-table-column label="头像" width="70" align="center">
        <template #default="{ row }">
          <el-avatar :size="36" :src="row.avatar" icon="UserFilled" />
        </template>
      </el-table-column>
      <el-table-column label="昵称" prop="nickname" min-width="110">
        <template #default="{ row }">
          <el-link type="primary" @click="handleView(row)">{{ row.nickname || row.certiName || '-' }}</el-link>
        </template>
      </el-table-column>
      <el-table-column label="真实姓名" prop="certiName" width="100" />
      <el-table-column label="手机号" prop="mobile" width="130" />
      <el-table-column label="性别" prop="gender" width="70" align="center">
        <template #default="{ row }">{{ row.gender === 'M' ? '男' : row.gender === 'F' ? '女' : '-' }}</template>
      </el-table-column>
      <el-table-column label="地址" prop="address" min-width="160" align="center" show-overflow-tooltip>
          <template #default="scope">
            {{ getFullAddress(scope.row) }}
          </template>
        </el-table-column>
    <!--  <el-table-column label="备用电话" prop="linkPhone" width="125" /> -->
      <el-table-column label="实名认证" prop="certiState" width="100" align="center">
        <template #default="{ row }">
          <el-tag v-if="row.certiState === 1" type="success" size="small">已认证</el-tag>
          <el-tag v-else type="info" size="small" effect="plain">未认证</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="长者数量" prop="petNum" width="100" align="center">
      </el-table-column>
      <el-table-column label="状态" prop="status" width="70" align="center">
        <template #default="{ row }">
          <el-tag v-if="row.status === 1" type="success" size="small">正常</el-tag>
          <el-tag v-else type="danger" size="small" effect="plain">禁用</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="注册时间" prop="createAt" width="115" align="center">
        <template #default="{ row }">{{ row.createAt ? row.createAt.slice(0, 10) : '-' }}</template>
      </el-table-column>
      <el-table-column label="操作" width="240" align="center" fixed="right">
        <template #default="{ row }">
          <el-button link type="primary" icon="Edit" @click="handleUpdate(row)">编辑</el-button>
          <el-button link type="success" icon="CreditCard" @click="handleQuickOpenCard(row)">开卡</el-button>
          <el-button link type="primary" icon="Avatar" @click="handleAddPet(row)">添加长者</el-button>
          <!-- <el-button link type="danger" icon="Delete" @click="handleDelete(row)">删除</el-button> -->
        </template>
      </el-table-column>
    </el-table>

    <pagination v-show="total > 0" :total="total"
      v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize"
      @pagination="getList" />

    <!-- 快捷开卡弹窗 -->
    <el-dialog title="快捷开卡" v-model="quickOpenCardDialog" width="580px" append-to-body destroy-on-close>
      <!-- 客户信息展示 -->
      <div class="quick-card-customer">
        <el-avatar :size="44" :src="quickCardCustomer.avatar" icon="UserFilled" />
        <div class="quick-card-customer-info">
          <div class="name">{{ quickCardCustomer.nickname || quickCardCustomer.certiName || '-' }}
            <el-tag v-if="quickCardCustomer.certiState === 1" type="success" size="small" style="margin-left:6px">已认证</el-tag>
          </div>
          <div class="phone">{{ quickCardCustomer.mobile }}</div>
        </div>
      </div>
      <el-divider style="margin:12px 0" />
      <el-form ref="quickCardRef" :model="quickCardForm" :rules="quickCardRules" label-width="100px">
        <el-form-item label="选择套餐" prop="packageId">
          <el-select v-model="quickCardForm.packageId" placeholder="请选择会员卡套餐" style="width:100%"
            @change="onQuickPackageChange" :loading="quickPackageLoading">
            <el-option v-for="p in quickEnabledPackages" :key="p.id" :label="p.name" :value="p.id">
              <div style="display:flex;align-items:center;gap:8px;width:100%">
                <span style="flex:1">{{ p.name }}</span>
                <span style="color:#409EFF;font-weight:600">¥{{ p.actualAmount }}</span>
                <el-tag v-if="p.giftAmount > 0" type="success" size="small">赠{{ p.giftAmount }}</el-tag>
              </div>
            </el-option>
          </el-select>
        </el-form-item>
        <!-- 套餐详情预览 -->
        <el-form-item v-if="quickSelectedPackage" label="套餐详情">
          <div class="quick-pkg-detail">
            <el-descriptions :column="3" size="small" border>
              <el-descriptions-item label="等级">
                <el-tag :type="getCardLevelType(quickSelectedPackage.cardLevel)" effect="dark" size="small">
                  {{ getCardLevelLabel(quickSelectedPackage.cardLevel) }}
                </el-tag>
              </el-descriptions-item>
              <el-descriptions-item label="实付"><span style="color:#409EFF;font-weight:700;font-size:15px">¥{{ quickSelectedPackage.actualAmount }}</span></el-descriptions-item>
              <el-descriptions-item label="赠送"><span style="color:#9747FF;font-weight:600">{{ quickSelectedPackage.giftAmount > 0 ? '+¥' + quickSelectedPackage.giftAmount : '-' }}</span></el-descriptions-item>
            </el-descriptions>
          </div>
        </el-form-item>
        <el-form-item label="支付方式" prop="payMethod">
          <el-radio-group v-model="quickCardForm.payMethod">
            <el-radio label="wechat">微信</el-radio>
            <el-radio label="alipay">支付宝</el-radio>
            <el-radio label="cash">现金</el-radio>
            <el-radio label="card">银行卡</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="quickCardForm.remark" type="textarea" :rows="2" placeholder="备注信息" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button type="primary" :loading="quickCardSubmitting" @click="submitQuickOpenCard">确认开卡</el-button>
        <el-button @click="quickOpenCardDialog = false">取消</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup name="Customer">
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getCustomerList, getCustomerStat, deleteCustomer, exportCustomer } from '@/api/customer'
import { openResidentCard } from '@/api/resident/residentCard'
import { getEnabledPackageList } from '@/api/resident/cardPackage'

const router = useRouter()



// ── 统计卡片 ──────────────────────────────────────────
const statistics = reactive({
  totalCustomers: 0,
  memberCount: 0,
  newCustomers: 0,
  monthCheckin: 0,
  monthDeposit: '0.00',
  monthConsume: '0.00'
})

// ── 列表状态 ──────────────────────────────────────────
const loading = ref(false)
const customerList = ref([])
const total = ref(0)
const showSearch = ref(true)
const ids = ref([])
const multiple = ref(true)

const queryParams = ref({ pageNum: 1, pageSize: 10, name: undefined, mobile: undefined, memberType: undefined })
const queryRef = ref(null)

// ── 接口调用 ──────────────────────────────────────────
async function getList() {
  loading.value = true
  try {
    const res = await getCustomerList(queryParams.value)
    customerList.value = res.data?.list || res.data?.list || []
    total.value = res.data?.totalCount || 0
  } finally {
    loading.value = false
  }
}
/** 获取完整地址 */
function getFullAddress(customerInfo) {
  const parts = []
  if (customerInfo.province) parts.push(customerInfo.province)
  if (customerInfo.city) parts.push(customerInfo.city)
  if (customerInfo.district) parts.push(customerInfo.district)
  if (customerInfo.detailAddress) parts.push(customerInfo.detailAddress)
  return parts.join('') || '-'
}
async function loadStat() {
  try {
    const res = await getCustomerStat({})
    const d = res.data || {}
    statistics.totalCustomers = d.totalCustomers || 0
    statistics.memberCount    = d.memberCount    || 0
    statistics.newCustomers   = d.newCustomers   || 0
    statistics.monthCheckin   = d.monthCheckin   || 0
    statistics.monthDeposit   = Number(d.monthDeposit  || 0).toFixed(2)
    statistics.monthConsume   = Number(d.monthConsume  || 0).toFixed(2)
  } catch {}
}

function handleQuery() {
  queryParams.value.pageNum = 1
  getList()
}
function resetQuery() {
  queryRef.value?.resetFields()
  handleQuery()
}

function handleSelectionChange(sel) {
  ids.value = sel.map(r => r.id)
  multiple.value = !sel.length
}

function handleAdd() {
  router.push('/customer/detail/add')
}

function handleUpdate(row) {
  router.push('/customer/detail/' + row.id)
}

function handleView(row) {
  router.push('/customer/detail/' + row.id)
}

// 添加长者
function handleAddPet(row) {
  router.push('/customer/pet/form?ownerId=' + row.id)
}

function handleDelete(row) {
  const delIds = row?.id ? [row.id] : ids.value
  ElMessageBox.confirm(`确认删除选中的 ${delIds.length} 条客户数据？`, '提示', { type: 'warning' }).then(() => {
    deleteCustomer(delIds).then(() => {
      ElMessage.success('删除成功')
      getList()
    })
  })
}

function handleExport() {
  exportCustomer(queryParams.value).then(res => {
    const blob = new Blob([res], { type: 'application/vnd.ms-excel' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = '客户列表.xlsx'; a.click()
    URL.revokeObjectURL(url)
  }).catch(() => ElMessage.warning('导出失败'))
}

// 快捷导航
function goTo(path) {
  router.push(path)
}

// ── 快捷开卡 ──────────────────────────────────────────
const quickOpenCardDialog = ref(false)
const quickCardRef = ref(null)
const quickCardCustomer = ref({})
const quickCardSubmitting = ref(false)
const quickEnabledPackages = ref([])
const quickPackageLoading = ref(false)
const quickCardForm = ref({ packageId: undefined, payMethod: 'wechat', remark: '' })
const quickCardRules = {
  packageId: [{ required: true, message: '请选择会员卡套餐', trigger: 'change' }],
  payMethod: [{ required: true, message: '请选择支付方式', trigger: 'change' }]
}
const quickSelectedPackage = computed(() => {
  if (!quickCardForm.value.packageId) return null
  return quickEnabledPackages.value.find(p => p.id === quickCardForm.value.packageId)
})

function getCardLevelType(level) {
  return { 0: '', 1: 'info', 2: 'warning', 3: 'danger' }[level] ?? ''
}
function getCardLevelLabel(level) {
  return { 0: '普通卡', 1: '银卡', 2: '金卡', 3: '钻石卡' }[level] ?? '未知'
}

function handleQuickOpenCard(row) {
  quickCardCustomer.value = row
  quickCardForm.value = { packageId: undefined, payMethod: 'wechat', remark: '' }
  quickPackageLoading.value = true
  quickOpenCardDialog.value = true
  getEnabledPackageList().then(res => {
    quickEnabledPackages.value = res.data || []
  }).finally(() => { quickPackageLoading.value = false })
}

function onQuickPackageChange() {}

function submitQuickOpenCard() {
  quickCardRef.value?.validate(valid => {
    if (!valid) return
    quickCardSubmitting.value = true
    const pkg = quickSelectedPackage.value
    const data = {
      ownerId: quickCardCustomer.value.id,
      ownerName: quickCardCustomer.value.certiName || quickCardCustomer.value.nickname,
      ownerPhone: quickCardCustomer.value.mobile,
      packageId: quickCardForm.value.packageId,
      cardLevel: pkg ? pkg.cardLevel : 0,
      openAmount: pkg ? pkg.actualAmount : 0,
      giftBalance: pkg ? pkg.giftAmount : 0,
      payMethod: quickCardForm.value.payMethod,
      remark: quickCardForm.value.remark
    }
    openResidentCard(data).then(() => {
      ElMessage.success('开卡成功！')
      quickOpenCardDialog.value = false
      loadStat()
    }).catch(() => {
      ElMessage.error('开卡失败，请重试')
    }).finally(() => { quickCardSubmitting.value = false })
  })
}

onMounted(() => { getList(); loadStat() })
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
 width: 44px;
  height: 44px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
}
.stat-card--blue .stat-icon { background: #ecf5ff; color: #409EFF; }
.stat-card--green .stat-icon { background: #f0f9eb; color: #67C23A; }
.stat-card--orange .stat-icon { background: #fdf6ec; color: #E6A23C; }
.stat-card--purple .stat-icon { background: #f4f0fc; color: #9747FF; }
.stat-card--cyan .stat-icon { background: #e6fffb; color: #13C2C2; }
.stat-card--red .stat-icon { background: #fef0f0; color: #F56C6C; }
.stat-body { flex: 1; }
.stat-value { font-size: 20px; font-weight: 700; color: #1d2129; }
.stat-label { font-size: 12px; color: #86909c; margin-top: 4px; }
/* 快捷导航 */
.nav-card { margin-bottom: 16px; }
.quick-nav {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
}
.nav-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 20px;
  background: #f7f8fa;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s;
  min-width: 200px;
}
.nav-item:hover {
  background: #e8f4ff;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}
.nav-icon {
  width: 40px;
  height: 40px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
}
.nav-icon--purple { background: #f4f0fc; color: #9747FF; }
.nav-icon--cyan { background: #e6fffb; color: #13C2C2; }
.nav-icon--orange { background: #fdf6ec; color: #E6A23C; }
.nav-text { flex: 1; }
.nav-title { font-size: 14px; font-weight: 600; color: #1d2129; }
.nav-desc { font-size: 12px; color: #86909c; margin-top: 2px; }

/* 开卡相关 */
.open-card-check { font-weight: 600; }
.customer-desc { margin-bottom: 16px; }
.open-card-form { margin-top: 16px; }

/* 套餐下拉选项 */
.package-option { display: flex; align-items: center; gap: 8px; width: 100%; }
.package-option .name { flex: 1; }
.package-option .price { color: #409EFF; font-weight: 600; }

/* 套餐详情 */
.package-detail {
  background: #f7f8fa;
  border-radius: 8px;
  padding: 12px 16px;
  width: 100%;
}
.detail-row {
  display: flex;
  align-items: center;
  padding: 6px 0;
}
.detail-row .label { color: #86909c; width: 80px; }
.detail-row.highlight { background: #e8f4ff; margin: 8px -16px; padding: 8px 16px; border-radius: 4px; }
.detail-row .desc { color: #1d2129; flex: 1; }

/* 价格样式 */
.original-price { color: #909399; text-decoration: line-through; }
.discount-price { color: #F56C6C; }
.actual-price { color: #409EFF; font-weight: 600; font-size: 16px; }
.gift-text { color: #9747FF; font-weight: 600; }
/* 搜索卡片 */
.search-card { margin-bottom: 16px; }
.search-card :deep(.el-card__body) { padding-bottom: 6px; }

/* 快捷开卡弹窗 */
.quick-card-customer {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 12px 16px;
  background: #f7f8fa;
  border-radius: 8px;
}
.quick-card-customer-info .name {
  font-size: 15px;
  font-weight: 600;
  color: #1d2129;
  display: flex;
  align-items: center;
}
.quick-card-customer-info .phone {
  font-size: 13px;
  color: #86909c;
  margin-top: 4px;
}
.quick-pkg-detail { width: 100%; }
</style>
