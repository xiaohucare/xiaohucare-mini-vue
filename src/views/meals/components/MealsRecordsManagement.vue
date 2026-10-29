<template>
  <div class="meals-records-management">
    <!-- 搜索和操作区域 -->
    <el-card class="mb-4" shadow="hover">
      <el-form :model="queryParams" ref="queryFormRef" :inline="true" label-width="80px">
        <el-form-item label="用餐日期" prop="mealDate">
          <el-date-picker
            v-model="queryParams.mealDate"
            type="date"
            placeholder="选择用餐日期"
            style="width: 200px"
            value-format="YYYY-MM-DD"
          />
        </el-form-item>
        <el-form-item label="餐次类型" prop="mealType">
          <el-select v-model="queryParams.mealType" placeholder="请选择餐次类型" clearable style="width: 200px">
            <el-option v-for="opt in MEAL_TYPE_OPTIONS" :key="opt.value" :label="opt.label" :value="opt.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="老人ID" prop="residentId">
          <el-input
            v-model="queryParams.residentId"
            placeholder="请输入老人ID"
            clearable
            style="width: 200px"
            @keyup.enter="handleQuery"
          />
        </el-form-item>
        <el-form-item label="菜名" prop="dishName">
          <el-input
            v-model="queryParams.dishName"
            placeholder="请输入菜名"
            clearable
            style="width: 200px"
            @keyup.enter="handleQuery"
          />
        </el-form-item>
        <el-form-item label="满意度" prop="satisfactionLevel">
          <el-select v-model="queryParams.satisfactionLevel" placeholder="请选择满意度" clearable style="width: 200px">
            <el-option label="很满意" value="很满意" />
            <el-option label="满意" value="满意" />
            <el-option label="一般" value="一般" />
            <el-option label="不满意" value="不满意" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" icon="search" @click="handleQuery" round>搜索</el-button>
          <el-button icon="refresh" @click="resetQuery" round>重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 操作按钮区域 -->
    <el-card class="mb-4" shadow="hover">
      <el-row :gutter="10" class="mb-2">
        <el-col :span="16">
          <el-button type="primary" icon="plus" @click="handleAdd" round>新增记录</el-button>
          <el-button type="success" icon="edit" :disabled="single" @click="handleUpdate" round>修改</el-button>
          <el-button type="danger" icon="delete" :disabled="multiple" @click="handleDelete" round>删除</el-button>
          <el-button type="warning" icon="download" @click="handleExport" round>导出</el-button>
          <el-button type="info" icon="copy-document" @click="handleBatchAdd" round>批量记录</el-button>
        </el-col>
      </el-row>
    </el-card>

    <!-- 数据表格 -->
    <el-card shadow="hover">
      <el-table
        v-loading="loading"
        :data="recordsList"
        @selection-change="handleSelectionChange"
        @sort-change="handleSortChange"
      >
        <el-table-column type="selection" width="50" align="center" />
        <el-table-column label="ID" align="center" prop="id" width="80" sortable="custom" />
        <el-table-column label="用餐日期" align="center" prop="mealDate" width="120" sortable="custom">
          <template #default="scope">
            <span>{{ parseTime(scope.row.mealDate, '{y}-{m}-{d}') }}</span>
          </template>
        </el-table-column>
        <el-table-column label="餐次类型" align="center" prop="mealType" width="100">
          <template #default="scope">
            <el-tag :type="getMealTypeTagType(scope.row.mealType)">
              {{ mealTypeLabel(scope.row.mealType) }}
            </el-tag>
          </template>
        </el-table-column>
       
        <el-table-column label="用餐对象" align="center" prop="mealTargetType" width="100">
          <template #default="scope">
            <el-tag :type="scope.row.mealTargetType === '专人专餐' ? 'warning' : 'success'">
              {{ scope.row.mealTargetType || '所有人' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="老人姓名" align="center" prop="residentName" width="100">
          <template #default="scope">
            <span>{{ scope.row.residentName || '-' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="套餐" align="center" prop="packageName" min-width="120" show-overflow-tooltip>
          <template #default="scope">
            <span>{{ scope.row.packageName || '-' }}</span>
          </template>
        </el-table-column>
        <!-- <el-table-column label="菜名" align="center" prop="dishName" min-width="120" /> -->
        <el-table-column label="份量" align="center" prop="quantity" width="80">
          <template #default="scope">
            <span>{{ scope.row.quantity }}份</span>
          </template>
        </el-table-column>
        <el-table-column label="满意度" align="center" prop="satisfactionLevel" width="100">
          <template #default="scope">
            <el-rate
              v-model="scope.row.satisfactionLevel"
              :colors="['#99A9BF', '#F7BA2A', '#FF9900']"
              disabled
              show-text
            >
              <template #default="{ value }">
                {{ getSatisfactionText(value) }}
              </template>
            </el-rate>
          </template>
        </el-table-column>
        <el-table-column label="反馈意见" align="center" prop="feedback" min-width="150" show-overflow-tooltip />
        <el-table-column label="照片记录" align="center" prop="mealPhotos" width="120">
          <template #default="scope">
            <image-preview v-if="scope.row.mealPhotos" :src="scope.row.mealPhotos" :width="50" :height="50" />
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column label="供餐时间" align="center" prop="servedTime" width="120" />
        <el-table-column label="服务人员" align="center" prop="servedByName" width="100" />
        <el-table-column label="状态" align="center" prop="status" width="80">
          <template #default="scope">
            <el-tag :type="scope.row.status === 1 ? 'success' : 'danger'">
              {{ scope.row.status === 1 ? '正常' : '取消' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="创建时间" align="center" prop="createAt" width="160" sortable="custom">
          <template #default="scope">
            <span>{{ parseTime(scope.row.createAt) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" align="center" width="200" class-name="small-padding fixed-width" fixed="right">
          <template #default="scope">
            <el-button
               size="small"
              type="text"
              icon="edit"
              @click="handleUpdate(scope.row)"
              round
            >修改</el-button>
            <el-button
               size="small"
              type="text"
              icon="delete"
              @click="handleDelete(scope.row)"
              round
            >删除</el-button>
            <el-button
               size="small"
              type="text"
              icon="view"
              @click="handleView(scope.row)"
              round
            >详情</el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页组件 -->
      <pagination
        v-show="total > 0"
        :total="total"
        v-model:page="queryParams.pageNum"
        v-model:limit="queryParams.pageSize"
        @pagination="getList"
      />
    </el-card>

    <!-- 添加/修改对话框 -->
    <el-dialog :title="dialog.title" v-model="dialog.visible" width="800px" append-to-body>
      <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
        <el-row>
          <el-col :span="12">
            <el-form-item label="用餐日期" prop="mealDate">
              <el-date-picker
                v-model="form.mealDate"
                type="date"
                placeholder="选择用餐日期"
                style="width: 100%"
                value-format="YYYY-MM-DD"
              />
            </el-form-item>
          </el-col>
           <el-col :span="12">
            <el-form-item label="供餐时间" prop="servedTime">
              <el-time-picker
                v-model="form.servedTime"
                placeholder="选择供餐时间"
                style="width: 100%"
                value-format="HH:mm:ss"
              />
            </el-form-item>
          </el-col>
        </el-row>
         <el-form-item label="餐次类型" prop="mealType">
               <el-radio-group v-model="form.mealType" placeholder="请选择餐次类型" style="width: 100%">
                <el-radio v-for="opt in MEAL_TYPE_OPTIONS" :key="opt.value" :label="opt.value">{{ opt.label }}</el-radio>
              </el-radio-group>
            </el-form-item>
        <el-form-item label="用餐对象" prop="mealTargetType">
          <el-radio-group v-model="form.mealTargetType">
            <el-radio label="所有人">所有人</el-radio>
            <el-radio label="专人专餐">专人专餐</el-radio>
          </el-radio-group>
        </el-form-item>

        <el-form-item v-if="form.mealTargetType === '专人专餐'" label="用餐老人" prop="residentIds">
          <el-select v-model="form.residentIds" multiple filterable placeholder="请选择用餐老人" style="width: 100%">
            <el-option v-for="r in residentOptions" :key="r.id" :label="r.name" :value="r.id" />
          </el-select>
        </el-form-item>

        <el-row>
          <el-col :span="24">
            <el-form-item label="选择套餐" prop="packageId">
              <el-select v-model="form.packageId" filterable clearable placeholder="请选择套餐" style="width: 100%" @change="handlePackageChange">
                <el-option v-for="p in filteredPackageOptions" :key="p.id" :label="p.packageName" :value="p.id" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row>
          <el-col :span="12">
            <el-form-item label="份量" prop="quantity">
              <el-input-number
                v-model="form.quantity"
                :min="0.5"
                :max="3"
                :step="0.5"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
        </el-row>

        <!-- <el-form-item label="满意度" prop="satisfactionLevel">
          <el-rate
            v-model="form.satisfactionLevel"
            :colors="['#99A9BF', '#F7BA2A', '#FF9900']"
            show-text
          >
            <template #default="{ value }">
              {{ getSatisfactionText(value) }}
            </template>
          </el-rate>
        </el-form-item>

        <el-form-item label="反馈意见" prop="feedback">
          <el-input
            v-model="form.feedback"
            type="textarea"
            :rows="3"
            placeholder="请输入反馈意见"
          />
        </el-form-item> -->

        <el-form-item label="照片记录" prop="mealPhotos">
          <image-upload v-model="form.mealPhotos" :limit="5" />
        </el-form-item>

        <el-row>
          <el-col :span="24">
            <el-form-item label="服务人员" prop="servedBy">
              <el-select v-model="form.servedBy" filterable clearable placeholder="请选择服务人员" style="width: 100%">
                <el-option v-for="e in employeeOptions" :key="e.id" :label="e.name" :value="e.id" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="状态" prop="status">
              <el-radio-group v-model="form.status">
                <el-radio :label="1">正常</el-radio>
                <el-radio :label="0">取消</el-radio>
              </el-radio-group>
            </el-form-item>
       </el-form>

      <template #footer>
        <div class="dialog-footer">
          <el-button type="primary" @click="submitForm" round>确 定</el-button>
          <el-button @click="cancel" round>取 消</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { listMealsRecords, addMealsRecord, updateMealsRecord, delMealsRecord, batchAddMealsRecords, listAllMealsPackages } from '@/api/meals'
import { getResidentsList } from '@/api/residents'
import { getAllEmployees } from '@/api/care/employee'
import { ElMessage, ElMessageBox } from 'element-plus'
import { get } from '@vueuse/core'
import { MEAL_TYPE_OPTIONS, getMealTypeName as mealTypeLabel, getMealTypeTagType } from '@/utils/careEnums'

// 响应式数据
const loading = ref(true)
const ids = ref([])
const single = ref(true)
const multiple = ref(true)
const total = ref(0)
const recordsList = ref([])
const residentOptions = ref([])
const packageOptions = ref([])
const employeeOptions = ref([])
// 表单验证
const formRef = ref()
const queryParams = reactive({
  pageNum: 1,
  pageSize: 10,
  mealDate: null,
  mealType: null,
  residentId: null,
  dishName: null,
  satisfactionLevel: null
})

const form = reactive({
  id: null,
  mealDate: today(),
  mealType: null,
  mealTargetType: '所有人',
  residentIds: [],
  packageId: null,
  packageName: '',
  dishName: '',
  quantity: 1,
  satisfactionLevel: 3,
  feedback: '',
  mealPhotos: '',
  servedBy: '',
  servedTime: nowTime(),
  status: 1
})

const rules = reactive({
  mealDate: [{ required: true, message: '用餐日期不能为空', trigger: 'blur' }],
  mealType: [{ required: true, message: '餐次类型不能为空', trigger: 'change' }],
  mealTargetType: [{ required: true, message: '请选择用餐对象', trigger: 'change' }],
  residentIds: [{
    validator: (rule, value, callback) => {
      if (form.mealTargetType === '专人专餐' && (!value || !value.length)) {
        callback(new Error('专人专餐时请至少选择一位用餐老人'))
      } else {
        callback()
      }
    },
    trigger: 'change'
  }],
  dishName: [{ required: true, message: '菜名不能为空', trigger: 'blur' }]
})

const dialog = reactive({
  visible: false,
  title: ''
})

// 方法
const getList = async () => {
  loading.value = true
  try {
    const response = await listMealsRecords(queryParams)
    recordsList.value = response.data.list || []
    total.value = response.data.totalCount || 0
  } catch (error) {
    console.error('获取记录列表失败:', error)
  } finally {
    loading.value = false
  }
}

const handleQuery = () => {
  queryParams.pageNum = 1
  getList()
}

const resetQuery = () => {
  queryFormRef.value?.resetFields()
  handleQuery()
}

const handleSelectionChange = (selection) => {
  ids.value = selection.map(item => item.id)
  single.value = selection.length !== 1
  multiple.value = !selection.length
}

const handleSortChange = (column) => {
  if (column.prop) {
    queryParams.orderByColumn = column.prop
    queryParams.isAsc = column.order === 'ascending' ? 'asc' : 'desc'
    getList()
  }
}

const handleAdd = () => {
  resetForm()
  // 打开新增时刷新套餐列表，确保拿到最新可选项
  loadPackages()
  dialog.visible = true
  dialog.title = '添加记录'
}

const handleUpdate = (row) => {
  resetForm()
  // 模拟获取记录详情
  Object.assign(form, row)
  form.mealTargetType = row.mealTargetType || '所有人'
  form.residentIds = row.residentIds ? [...row.residentIds] : (row.residentId ? [row.residentId] : [])
  dialog.visible = true
  dialog.title = '修改记录'
}

const handleDelete = (row) => {
  const recordIds = row.id || ids.value
  ElMessageBox.confirm('是否确认删除记录编号为"' + recordIds + '"的数据项？', '警告', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    try {
      await delMealsRecord(recordIds)
      getList()
      ElMessage.success('删除成功')
    } catch (error) {
      console.error('删除失败:', error)
    }
  })
}

const handleExport = () => {
  // 导出功能实现
  ElMessage.info('导出功能开发中')
}

const handleBatchAdd = () => {
  ElMessage.info('批量记录功能开发中')
}

const submitForm = async () => {
  await formRef.value?.validate()
  try {
    if (form.id) {
      await updateMealsRecord(form)
      ElMessage.success('修改成功')
    } else {
      await addMealsRecord(form)
      ElMessage.success('新增成功')
    }
    dialog.visible = false
    getList()
  } catch (error) {
    console.error('操作失败:', error)
  }
}

const cancel = () => {
  dialog.visible = false
  resetForm()
}

const resetForm = () => {
  form.id = null
  // 用餐日期默认当天
  form.mealDate = today()
  form.mealType = null
  form.mealTargetType = '所有人'
  form.residentIds = []
  form.packageId = null
  form.packageName = ''
  form.dishName = ''
  form.quantity = 1
  form.satisfactionLevel = 3
  form.feedback = ''
  form.mealPhotos = ''
  form.servedBy = ''
  // 供餐时间默认当前时间
  form.servedTime = nowTime()
  form.status = 1
}

// 当天日期字符串（YYYY-MM-DD）
function today() {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

// 当前时间字符串（HH:mm:ss）
function nowTime() {
  const d = new Date()
  const hh = String(d.getHours()).padStart(2, '0')
  const mm = String(d.getMinutes()).padStart(2, '0')
  const ss = String(d.getSeconds()).padStart(2, '0')
  return `${hh}:${mm}:${ss}`
}

// 根据所选餐次类型过滤套餐下拉选项（未选餐次时展示全部）
const filteredPackageOptions = computed(() => {
  if (!form.mealType) return packageOptions.value
  return packageOptions.value.filter(p => p.mealType === form.mealType)
})

// 加载老人下拉选项
const loadResidents = async () => {
  try {
    const response = await getResidentsList({ pageNum: 1, pageSize: 1000 })
    const list = response.data.list || []
    residentOptions.value = list.map(r => ({
      id: r.id || r.residentId,
      name: r.name || r.residentName
    }))
  } catch (error) {
    console.error('获取老人列表失败:', error)
  }
}

// 加载套餐下拉选项
const loadPackages = async () => {
  try {
    const response = await listAllMealsPackages({ status: 1 })
    packageOptions.value = response.data || []
  } catch (error) {
    console.error('获取套餐列表失败:', error)
  }
}

// 加载服务人员下拉选项
const loadEmployees = async () => {
  try {
    const response = await getAllEmployees()
    employeeOptions.value = response.data || []
  } catch (error) {
    console.error('获取员工列表失败:', error)
  }
}

// 选择套餐后回填套餐名称与菜名
const handlePackageChange = (packageId) => {
  const pkg = packageOptions.value.find(p => p.id === packageId)
  if (pkg) {
    form.packageName = pkg.packageName
    if (!form.dishName) {
      form.dishName = pkg.packageName
    }
  } else {
    form.packageName = ''
  }
}

// 餐次类型的选项/名称/标签映射统一维护于 @/utils/careEnums

const getSatisfactionText = (value) => {
  const textMap = {
    1: '不满意',
    2: '一般',
    3: '满意',
    4: '很满意',
    5: '非常满意'
  }
  return textMap[value] || '一般'
}

// 生命周期
onMounted(() => {
  loadResidents()
  loadPackages()
  loadEmployees()
  getList();
})
</script>

<style scoped>
.meals-records-management {
  padding: 20px;
}

:deep(.el-rate) {
  display: inline-flex;
  align-items: center;
}

:deep(.el-rate__text) {
  margin-left: 10px;
  font-size: 14px;
}
</style>