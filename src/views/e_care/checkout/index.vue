<template>
  <div class="app-container">
    <el-card shadow="never">
      <!-- 搜索区域 -->
      <el-form :model="queryParams" ref="queryForm" :inline="true" label-width="80px">
        <el-form-item label="状态">
          <el-radio-group v-model="queryParams.checkoutStatus" @change="handleQuery">
            <el-radio-button :label="-1">全部</el-radio-button>
            <el-radio-button :label="0">待退住</el-radio-button>
            <el-radio-button :label="1">交接中</el-radio-button>
            <el-radio-button :label="2">已完成</el-radio-button>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="长者姓名" prop="residentName">
          <el-input
            v-model="queryParams.residentName"
            placeholder="请输入长者姓名"
            clearable
            style="width: 180px"
            @keyup.enter="handleQuery"
          />
        </el-form-item>
        <el-form-item label="家属电话" prop="contactPhone">
          <el-input
            v-model="queryParams.contactPhone"
            placeholder="请输入家属电话"
            clearable
            style="width: 180px"
            @keyup.enter="handleQuery"
          />
        </el-form-item>
        <el-form-item label="入住日期" prop="checkinDate">
          <el-date-picker
            v-model="queryParams.checkinDate"
            type="date"
            placeholder="选择入住日期"
            value-format="YYYY-MM-DD"
            style="width: 180px"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" icon="Search" @click="handleQuery" round>搜索</el-button>
          <el-button icon="Refresh" @click="resetQuery" round>重置</el-button>
        </el-form-item>
      </el-form>

      <!-- 待退住提醒 -->
      <el-alert
        v-if="expiringCount > 0"
        :title="'今日有 ' + expiringCount + ' 位长者到期需退住'"
        type="warning"
        :closable="false"
        style="margin-bottom: 20px"
      />

      <!-- 数据表格 -->
      <el-table v-loading="loading" :data="checkoutList" @selection-change="handleSelectionChange">
        <el-table-column type="selection" width="55" align="center" />
        <el-table-column label="登记单号" align="center" prop="checkinNo" width="200" />
        <el-table-column label="长者" align="center"  min-width="100">
          <template #default="scope">
            <div>{{ scope.row.residentName }}</div>
            <el-tag  type="info" size="small">{{ scope.row.residentNo }}</el-tag>
          </template>
        </el-table-column>
         <el-table-column label="家属电话" align="center"  min-width="100">
          <template #default="scope">
            <span>{{ scope.row.contactPhone }}</span>
          </template>
        </el-table-column>
        <el-table-column label="床位编号" align="center" prop="bedNo"  min-width="90" />
        <el-table-column label="入住日期" align="center" prop="checkinDate"  min-width="100" />
        <el-table-column label="预计天数" align="center" prop="estimatedDays" width="100" />
        <el-table-column label="实际天数" align="center" prop="actualDays" width="80" />
        <el-table-column label="退住日期" align="center" prop="checkoutDate"  min-width="100">
          <template #default="scope">{{ scope.row.checkoutDate || '-' }}</template>
        </el-table-column>
       
        <el-table-column label="状态" align="center" prop="checkoutStatus" width="90">
          <template #default="scope">
            <el-tag v-if="scope.row.checkoutStatus === 0" type="warning" size="small">待退住</el-tag>
            <el-tag v-else-if="scope.row.checkoutStatus === 1" type="primary" size="small">交接中</el-tag>
            <el-tag v-else-if="scope.row.checkoutStatus === 2" type="success" size="small">已完成</el-tag>
            <el-tag v-else type="info" size="small">未知</el-tag>
          </template>
        </el-table-column>
      
        <el-table-column label="操作" align="center" class-name="small-padding fixed-width" width="200">
          <template #default="scope">
            <el-button 
              v-if="scope.row.checkoutStatus === 0" 
              link 
              type="primary" 
              icon="Right" 
              :loading="starting"
              @click="handleStartCheckout(scope.row)" 
              round
            >开始交接</el-button>
            <el-button 
              v-if="scope.row.checkoutStatus === 1" 
              link 
              type="success" 
              icon="Check" 
              @click="handleContinueCheckout(scope.row)" 
              round
            >继续交接</el-button>
            <el-button link type="primary" icon="View" @click="handleShowCheckout(scope.row)" round>查看</el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <pagination
        v-show="total > 0"
        :total="total"
        v-model:page="queryParams.pageNum"
        v-model:limit="queryParams.pageSize"
        @pagination="getList"
      />
    </el-card>
  </div>
</template>

<script setup name="ResidentCheckout">
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { getCheckoutList, getTodayCheckoutStat, submitDraftCheckout } from '@/api/care/checkout'

const router = useRouter()

const checkoutList = ref([])
const loading = ref(true)
const ids = ref([])
const single = ref(true)
const multiple = ref(true)
const total = ref(0)
const expiringCount = ref(0)
const starting = ref(false)

// 查询参数
const queryParams = reactive({
  pageNum: 1,
  pageSize: 10,
  residentName: undefined,
  contactPhone: undefined,
  checkinDate: undefined,
  checkoutStatus: 0
})

// 交接表单

// 计算住宿天数（退住日 - 入住日，同一天记 1 天）
function calcDays(startDate, endDate) {
  if (!startDate) return 1
  const toDay = (value) => {
    const d = new Date(String(value).substring(0, 10).replace(/-/g, '/'))
    return new Date(d.getFullYear(), d.getMonth(), d.getDate())
  }
  const start = toDay(startDate)
  const end = endDate ? toDay(endDate) : toDay(new Date())
  return Math.max(1, Math.round((end - start) / (1000 * 60 * 60 * 24)))
}

// 获取列表
function getList() {
  loading.value = true

  // 全部（-1）不传 checkoutStatus，保持 radio 选中状态
  const params = { ...queryParams }
  if (params.checkoutStatus === -1) {
    delete params.checkoutStatus
  }
  getCheckoutList(params).then(response => {
    checkoutList.value = response.data?.list || []
    total.value = response.data?.totalCount || 0
    
    // 未完成交接时按入住日期预估实际天数
    checkoutList.value.forEach(row => {
      if (!row.actualDays) {
        row.actualDays = calcDays(row.checkinDate, row.checkoutDate)
      }
    })
    
    loading.value = false
  }).catch(() => {
    loading.value = false
  })
}

// 获取今天离店统计
function getTodayStat() {
  getTodayCheckoutStat().then(response => {
    const data = response.data
    // expiringCount 表示待离店的数量（status0）
    expiringCount.value = data.status0 || 0
  }).catch(() => {
    expiringCount.value = 0
  })
}

function handleQuery() {
  queryParams.pageNum = 1
  getList()
}

function resetQuery() {
  queryParams.residentName = undefined
  queryParams.contactPhone = undefined
  queryParams.checkinDate = undefined
  queryParams.checkoutStatus = 0
  handleQuery()
}

function handleSelectionChange(selection) {
  ids.value = selection.map(item => item.id)
  single.value = selection.length !== 1
  multiple.value = !selection.length
}

// 开始交接：先落草稿把状态置为交接中，再进入交接页
async function handleStartCheckout(row) {
  if (starting.value) return
  starting.value = true
  try {
    await submitDraftCheckout({ id: row.id })
    ElMessage.success('已开始交接')
  } catch (e) {
    ElMessage.error('开始交接失败')
    // 状态未成功流转时不进入交接页，避免用户以为已开始交接
    return
  } finally {
    starting.value = false
  }
  router.push({
    path: '/eyang/checkout/form',
    query: { id: row.id }
  })
}
function handleShowCheckout(row){
  router.push({
    path: '/eyang/checkout/form',
    query: { id: row.id, viewOnly: '1' }
  })
}
function handleContinueCheckout(row) {
  router.push({
    path: '/eyang/checkout/form',
    query: { id: row.id }
  })
}

onMounted(() => {
  getList()
  getTodayStat()
})
</script>

<style scoped>
.app-container {
  padding: 20px;
}
</style>
