<template>
  <div class="facility-maintenance-records">
    <div class="header">
      <h3>设施维护记录</h3>
      <div class="statistics">
        <el-row :gutter="20">
          <el-col :span="6">
            <el-statistic title="本月维护" :value="monthlyMaintenanceCount" />
          </el-col>
          <el-col :span="6">
            <el-statistic title="待处理" :value="pendingMaintenanceCount" />
          </el-col>
          <el-col :span="6">
            <el-statistic title="已完成" :value="completedMaintenanceCount" />
          </el-col>
          <el-col :span="6">
            <el-statistic title="维护费用" :value="totalMaintenanceCost" prefix="¥" />
          </el-col>
        </el-row>
      </div>
    </div>

    <div class="filter-section">
      <el-form :inline="true" :model="filterForm" class="demo-form-inline">
        <el-form-item label="维护类型">
          <el-select v-model="filterForm.maintenanceType" placeholder="维护类型" clearable>
            <el-option label="定期维护" value="定期维护" />
            <el-option label="故障维修" value="故障维修" />
            <el-option label="升级改装" value="升级改装" />
          </el-select>
        </el-form-item>
        <el-form-item label="维护日期">
          <el-date-picker
            v-model="filterForm.dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            value-format="yyyy-MM-dd"
          />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="filterForm.status" placeholder="状态" clearable>
            <el-option label="完成" value="1" />
            <el-option label="未完成" value="0" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch" round>查询</el-button>
          <el-button @click="handleReset" round>重置</el-button>
          <el-button type="success" @click="handleCreate" icon="plus" round>新增记录</el-button>
        </el-form-item>
      </el-form>
    </div>

    <div class="table-section">
      <el-table :data="tableData" stripe style="width: 100%">
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="facilityName" label="设施名称" width="150" />
        <el-table-column prop="maintenanceDate" label="维护日期" width="120">
          <template #default="{ row }">
            {{ formatDate(row.maintenanceDate) }}
          </template>
        </el-table-column>
        <el-table-column prop="maintenanceType" label="维护类型" width="100">
          <template #default="{ row }">
            <el-tag :type="getTypeTagType(row.maintenanceType)">
              {{ row.maintenanceType }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="maintainer" label="维护人员" width="120" />
        <el-table-column prop="cost" label="维护费用" width="100">
          <template #default="{ row }">
            <span>¥{{ row.cost || 0 }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="description" label="维护描述" show-overflow-tooltip />
        <el-table-column prop="nextMaintenanceDate" label="下次维护" width="120">
          <template #default="{ row }">
            {{ formatDate(row.nextMaintenanceDate) }}
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="80">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : 'warning'">
              {{ row.status === 1 ? '完成' : '未完成' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="{ row }">
            <el-button size="small" @click="handleEdit(row)" round>编辑</el-button>
            <el-button size="small" type="danger" @click="handleDelete(row)" round>删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination">
        <el-pagination
          v-model:current-page="pagination.currentPage"
          v-model:page-size="pagination.pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="pagination.total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </div>

    <!-- 新增/编辑对话框 -->
    <el-dialog
      :title="dialogTitle"
      v-model="dialogVisible"
      width="600px"
      @close="resetForm"
    >
      <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
        <el-form-item label="设施名称" prop="facilityId">
          <el-select v-model="form.facilityId" placeholder="选择设施" style="width: 100%;">
            <el-option
              v-for="facility in facilityList"
              :key="facility.id"
              :label="facility.facilityName"
              :value="facility.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="维护日期" prop="maintenanceDate">
          <el-date-picker
            v-model="form.maintenanceDate"
            type="date"
            placeholder="选择维护日期"
            style="width: 100%;"
          />
        </el-form-item>
        <el-form-item label="维护类型" prop="maintenanceType">
          <el-select v-model="form.maintenanceType" placeholder="选择维护类型" style="width: 100%;">
            <el-option label="定期维护" value="定期维护" />
            <el-option label="故障维修" value="故障维修" />
            <el-option label="升级改装" value="升级改装" />
          </el-select>
        </el-form-item>
        <el-form-item label="维护人员" prop="maintainer">
          <el-input v-model="form.maintainer" placeholder="请输入维护人员" />
        </el-form-item>
        <el-form-item label="维护费用" prop="cost">
          <el-input-number v-model="form.cost" :min="0" :precision="2" style="width: 100%;" />
        </el-form-item>
        <el-form-item label="维护描述" prop="description">
          <el-input
            v-model="form.description"
            type="textarea"
            :rows="3"
            placeholder="请输入维护描述"
          />
        </el-form-item>
        <el-form-item label="下次维护" prop="nextMaintenanceDate">
          <el-date-picker
            v-model="form.nextMaintenanceDate"
            type="date"
            placeholder="选择下次维护日期"
            style="width: 100%;"
          />
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-radio-group v-model="form.status">
            <el-radio :label="1">完成</el-radio>
            <el-radio :label="0">未完成</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      
      <template #footer>
        <el-button @click="dialogVisible = false" round>取消</el-button>
        <el-button type="primary" @click="handleSubmit" :loading="submitting" round>确认</el-button>
      </template>
    </el-dialog>

    <!-- 维护趋势图表 -->
    <div class="chart-section">
      <el-card>
        <template #header>
          <span>维护记录趋势分析</span>
        </template>
        <div ref="maintenanceTrendChart" style="height: 300px;"></div>
      </el-card>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, nextTick, defineProps } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import * as echarts from 'echarts'

// 模拟 API 数据，替换原有的 API 调用
const mockFacilityMaintenanceRecords = [
  {
    id: 1,
    facilityId: 1,
    facilityName: '空调系统',
    maintenanceDate: '2024-01-15',
    maintenanceType: '定期维护',
    maintainer: '张三',
    cost: 1500.00,
    description: '定期清洁空调滤网，检查制冷系统',
    nextMaintenanceDate: '2024-04-15',
    status: 1
  },
  {
    id: 2,
    facilityId: 2,
    facilityName: '电梯',
    maintenanceDate: '2024-01-18',
    maintenanceType: '故障维修',
    maintainer: '李四',
    cost: 3200.50,
    description: '更换电梯按钮面板，修复楼层显示问题',
    nextMaintenanceDate: '2024-04-18',
    status: 0
  },
  {
    id: 3,
    facilityId: 3,
    facilityName: '监控系统',
    maintenanceDate: '2024-01-20',
    maintenanceType: '升级改装',
    maintainer: '王五',
    cost: 8500.00,
    description: '升级监控摄像头到高清版本，安装新存储系统',
    nextMaintenanceDate: '2024-07-20',
    status: 1
  }
]

const mockFacilities = [
  { id: 1, facilityName: '空调系统' },
  { id: 2, facilityName: '电梯' },
  { id: 3, facilityName: '监控系统' },
  { id: 4, facilityName: '消防系统' },
  { id: 5, facilityName: '给排水系统' }
]

const props = defineProps({
  facilityId: {
    type: Number,
    default: null
  }
})

const filterForm = reactive({
  maintenanceType: '',
  dateRange: [],
  status: ''
})

const tableData = ref([])
const facilityList = ref([])
const pagination = reactive({
  currentPage: 1,
  pageSize: 10,
  total: 0
})

const dialogVisible = ref(false)
const dialogTitle = ref('')
const submitting = ref(false)
const formRef = ref(null)
const maintenanceTrendChart = ref(null)

// 统计数据
const monthlyMaintenanceCount = ref(0)
const pendingMaintenanceCount = ref(0)
const completedMaintenanceCount = ref(0)
const totalMaintenanceCost = ref(0)

const form = reactive({
  id: null,
  facilityId: null,
  maintenanceDate: '',
  maintenanceType: '',
  maintainer: '',
  cost: 0,
  description: '',
  nextMaintenanceDate: '',
  status: 1
})

const rules = {
  facilityId: [
    { required: true, message: '请选择设施', trigger: 'change' }
  ],
  maintenanceDate: [
    { required: true, message: '请选择维护日期', trigger: 'change' }
  ],
  maintenanceType: [
    { required: true, message: '请选择维护类型', trigger: 'change' }
  ]
}

// 加载设施列表
const loadFacilities = async () => {
  try {
    // 模拟 API 调用
    facilityList.value = mockFacilities
  } catch (error) {
    console.error('加载设施列表失败:', error)
  }
}

// 加载维护记录
const loadMaintenanceRecords = async () => {
  try {
    // 模拟 API 调用
    setTimeout(() => {
      let filteredList = mockFacilityMaintenanceRecords
      
      if (filterForm.maintenanceType) {
        filteredList = filteredList.filter(item => 
          item.maintenanceType === filterForm.maintenanceType
        )
      }
      
      if (filterForm.status) {
        filteredList = filteredList.filter(item => 
          item.status.toString() === filterForm.status
        )
      }
      
      if (props.facilityId) {
        filteredList = filteredList.filter(item => 
          item.facilityId === props.facilityId
        )
      }
      
      tableData.value = filteredList
      pagination.total = filteredList.length
      
      // 更新统计数据
      updateStatistics(filteredList)
    }, 500)
  } catch (error) {
    console.error('加载维护记录失败:', error)
  }
}

// 更新统计数据
const updateStatistics = (data) => {
  const currentMonth = new Date().getMonth() + 1
  const currentYear = new Date().getFullYear()
  
  monthlyMaintenanceCount.value = data.filter(item => {
    const date = new Date(item.maintenanceDate)
    return date.getMonth() + 1 === currentMonth && date.getFullYear() === currentYear
  }).length
  
  pendingMaintenanceCount.value = data.filter(item => item.status === 0).length
  completedMaintenanceCount.value = data.filter(item => item.status === 1).length
  totalMaintenanceCost.value = data.reduce((sum, item) => sum + (item.cost || 0), 0)
}

// 搜索
const handleSearch = () => {
  pagination.currentPage = 1
  loadMaintenanceRecords()
}

// 重置
const handleReset = () => {
  Object.keys(filterForm).forEach(key => {
    if (Array.isArray(filterForm[key])) {
      filterForm[key] = []
    } else {
      filterForm[key] = ''
    }
  })
  pagination.currentPage = 1
  loadMaintenanceRecords()
}

// 新增记录
const handleCreate = () => {
  dialogTitle.value = '新增维护记录'
  dialogVisible.value = true
}

// 编辑记录
const handleEdit = (record) => {
  dialogTitle.value = '编辑维护记录'
  Object.assign(form, record)
  dialogVisible.value = true
}

// 删除记录
const handleDelete = async (record) => {
  try {
    await ElMessageBox.confirm('确定要删除这条维护记录吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    
    // 模拟 API 调用
    tableData.value = tableData.value.filter(item => item.id !== record.id)
    ElMessage.success('删除成功')
    loadMaintenanceRecords()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除失败:', error)
      ElMessage.error('删除失败')
    }
  }
}

// 提交表单
const handleSubmit = async () => {
  if (!formRef.value) return
  
  try {
    const valid = await formRef.value.validate()
    if (valid) {
      submitting.value = true
      
      // 模拟 API 调用
      setTimeout(() => {
        if (form.id) {
          // 编辑
          const index = tableData.value.findIndex(item => item.id === form.id)
          if (index !== -1) {
            const facility = facilityList.value.find(f => f.id === form.facilityId)
            tableData.value[index] = { 
              ...form,
              facilityName: facility?.facilityName || ''
            }
          }
        } else {
          // 新增
          const facility = facilityList.value.find(f => f.id === form.facilityId)
          const newItem = {
            id: Date.now(),
            ...form,
            facilityName: facility?.facilityName || ''
          }
          tableData.value.unshift(newItem)
        }
        
        submitting.value = false
        dialogVisible.value = false
        ElMessage.success(form.id ? '编辑成功' : '新增成功')
        loadMaintenanceRecords()
      }, 500)
    }
  } catch (error) {
    console.error('提交失败:', error)
    ElMessage.error('提交失败')
    submitting.value = false
  }
}

// 重置表单
const resetForm = () => {
  Object.keys(form).forEach(key => {
    if (key === 'status') {
      form[key] = 1
    } else if (key === 'cost') {
      form[key] = 0
    } else {
      form[key] = ''
    }
  })
  form.id = null
  
  if (formRef.value) {
    formRef.value.clearValidate()
  }
}

// 分页处理
const handleSizeChange = (size) => {
  pagination.pageSize = size
  pagination.currentPage = 1
  loadMaintenanceRecords()
}

const handleCurrentChange = (page) => {
  pagination.currentPage = page
  loadMaintenanceRecords()
}

// 格式化日期
const formatDate = (date) => {
  if (!date) return '-'
  return new Date(date).toLocaleDateString()
}

// 获取类型标签样式
const getTypeTagType = (type) => {
  const typeMap = {
    '定期维护': 'primary',
    '故障维修': 'danger',
    '升级改装': 'success'
  }
  return typeMap[type] || ''
}

// 初始化图表
const initChart = () => {
  nextTick(() => {
    if (maintenanceTrendChart.value) {
      const chart = echarts.init(maintenanceTrendChart.value)
      
      // 模拟维护趋势数据
      const option = {
        title: {
          text: '月度维护趋势'
        },
        tooltip: {
          trigger: 'axis'
        },
        legend: {
          data: ['定期维护', '故障维修', '升级改装']
        },
        grid: {
          left: '3%',
          right: '4%',
          bottom: '3%',
          containLabel: true
        },
        xAxis: {
          type: 'category',
          data: ['1月', '2月', '3月', '4月', '5月', '6月']
        },
        yAxis: {
          type: 'value'
        },
        series: [
          {
            name: '定期维护',
            type: 'line',
            data: [12, 15, 18, 20, 22, 25],
            smooth: true
          },
          {
            name: '故障维修',
            type: 'line',
            data: [5, 8, 6, 10, 7, 9],
            smooth: true
          },
          {
            name: '升级改装',
            type: 'line',
            data: [2, 3, 5, 4, 6, 8],
            smooth: true
          }
        ]
      }
      
      chart.setOption(option)
      
      // 响应式调整
      window.addEventListener('resize', () => {
        chart.resize()
      })
    }
  })
}

onMounted(() => {
  loadFacilities()
  loadMaintenanceRecords()
  initChart()
})
</script>

<style scoped>
.facility-maintenance-records {
  padding: 20px;
}

.header {
  margin-bottom: 20px;
}

.header h3 {
  margin-bottom: 20px;
  color: #303133;
}

.filter-section {
  background: #f5f7fa;
  padding: 20px;
  border-radius: 4px;
  margin-bottom: 20px;
}

.table-section {
  margin-bottom: 20px;
}

.pagination {
  margin-top: 20px;
  text-align: right;
}

.chart-section {
  margin-top: 30px;
}
</style>