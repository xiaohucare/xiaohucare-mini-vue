<template>
  <div class="daily-activities-management">
    <div class="filter-container">
      <el-button type="primary" @click="handleCreate" icon="plus" round>新增活动</el-button>
      <el-date-picker
        v-model="queryParams.dateRange"
        type="daterange"
        range-separator="至"
        start-placeholder="开始日期"
        end-placeholder="结束日期"
        style="width: 240px; margin-left: 10px;"
      />
      <el-select v-model="queryParams.activityTypeId" placeholder="活动类型" clearable style="width: 120px; margin-left: 10px;">
        <el-option v-for="type in activityTypes" :key="type.id" :label="type.typeName" :value="type.id" />
      </el-select>
      <el-input
        v-model="queryParams.search"
        placeholder="搜索活动名称"
        style="width: 200px; margin-left: 10px;"
        @keyup.enter="handleFilter"
      >
        <template #append>
          <el-button @click="handleFilter" icon="Search" round></el-button>
        </template>
      </el-input>
    </div>

    <el-table
      :data="list"
      style="width: 100%"
      v-loading="loading"
    >
      <el-table-column prop="activityName" label="活动名称" min-width="120" />
      <el-table-column prop="activityTypeId" label="活动类型" width="100">
              <template #default="{ row }">
                {{ getActivityTypeName(row.activityTypeId) }}
              </template>
            </el-table-column>
      <el-table-column prop="activityDate" label="活动日期" width="120">
        <template #default="{ row }">
          {{ formatDate(row.activityDate) }}
        </template>
      </el-table-column>
      <el-table-column label="活动时间" width="150">
        <template #default="{ row }">
          {{ row.startTime }} - {{ row.endTime }}
        </template>
      </el-table-column>
      <el-table-column prop="location" label="活动地点" width="120" />
      <el-table-column prop="organizerName" label="组织者" width="100" />
      <el-table-column prop="participantCount" label="参与人数" width="100" />
      <el-table-column prop="status" label="状态" width="80">
        <template #default="{ row }">
          <el-tag :type="row.status ? 'success' : 'danger'">
            {{ row.status ? '正常' : '取消' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="350" fixed="right">
        <template #default="{ row }">
          <el-button  size="small" @click="handleEdit(row)" round>编辑</el-button>
          <el-button  size="small" type="success" @click="handleManageParticipants(row)" round>参与记录</el-button>
          <el-button 
             size="small" 
            :type="row.status ? 'danger' : 'success'" 
            @click="handleToggleStatus(row)"
            round
          >
            {{ row.status ? '取消' : '恢复' }}
          </el-button>
          <el-button 
             size="small" 
            type="danger" 
            @click="handleDelete(row)"
            round
          >
            删除
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <pagination 
      v-show="total > 0"
      :total="total"
      v-model:page="queryParams.pageNum"
      v-model:limit="queryParams.pageSize"
      @pagination="getList"
    />

    <!-- 新增/编辑对话框 -->
    <el-dialog
      :title="dialog.title"
      v-model="dialog.visible"
      width="600px"
      @close="resetForm"
    >
      <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
        <el-form-item label="活动名称" prop="activityName">
          <el-input v-model="form.activityName" placeholder="请输入活动名称" />
        </el-form-item>
        <el-form-item label="活动类型" prop="activityTypeId">
          <el-select v-model="form.activityTypeId" placeholder="请选择活动类型" style="width: 100%;">
            <el-option v-for="type in activityTypes" :key="type.id" :label="type.typeName" :value="type.id" />
          </el-select>
        </el-form-item>
         <el-form-item label="组织者" prop="organizerId">
          <el-select v-model="form.organizerId" placeholder="请选择组织者" style="width: 100%;">
            <el-option v-for="staff in staffList" :key="staff.id" :label="staff.name" :value="staff.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="活动日期" prop="activityDate">
          <el-date-picker
            v-model="form.activityDate"
            type="date"
            placeholder="选择活动日期"
            style="width: 100%;"
          />
        </el-form-item>
        <el-form-item label="活动时间" required>
          <el-col :span="11">
            <el-form-item prop="startTime">
              <el-time-picker
                v-model="form.startTime"
                placeholder="开始时间"
                style="width: 100%;"
              />
            </el-form-item>
          </el-col>
          <el-col :span="2" style="text-align: center;">-</el-col>
          <el-col :span="11">
            <el-form-item prop="endTime">
              <el-time-picker
                v-model="form.endTime"
                placeholder="结束时间"
                style="width: 100%;"
              />
            </el-form-item>
          </el-col>
        </el-form-item>
        <el-form-item label="活动地点" prop="location">
          <el-input v-model="form.location" placeholder="请输入活动地点" />
        </el-form-item>
       
        <el-form-item label="活动描述" prop="description">
          <el-input 
            v-model="form.description" 
            type="textarea" 
            :rows="3" 
            placeholder="请输入活动描述"
          />
        </el-form-item>
        <el-form-item label="备注" prop="remarks">
          <el-input 
            v-model="form.remarks" 
            type="textarea" 
            :rows="2" 
            placeholder="请输入备注信息"
          />
        </el-form-item>
      </el-form>
      
      <template #footer>
        <el-button @click="dialog.visible = false" round>取消</el-button>
        <el-button type="primary" @click="handleSubmit" :loading="submitting" round>确认</el-button>
      </template>
    </el-dialog>

    <!-- 参与记录管理对话框 -->
    <el-dialog
      title="活动参与记录管理"
      v-model="participantDialog.visible"
      width="90%"
    >
      <ActivityParticipantsManagement 
        :activity-id="currentActivityId" 
        v-if="participantDialog.visible" 
      />
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import Pagination from '@/components/Pagination'
import ActivityParticipantsManagement from './ActivityParticipantsManagement.vue'
import { listActivityTypes, getDailyActivities, createDailyActivity, updateDailyActivity, deleteDailyActivity } from '@/api/activities'
import { getEmployeeList } from '@/api/care/employee'

// 活动类型和员工列表应该从API获取
// 这里保留模拟数据作为示例
// 响应式数据
const loading = ref(false)
const submitting = ref(false)
const total = ref(0)
const list = ref([])
const activityTypes = ref([])
const staffList = ref([])
const currentActivityId = ref(null)

const queryParams = reactive({
  pageNum: 1,
  pageSize: 10,
  search: '',
  dateRange: [],
  activityTypeId: null
})

const form = reactive({
  id: null,
  activityName: '',
  activityTypeId: null,
  activityDate: '',
  startTime: '',
  endTime: '',
  location: '',
  organizerId: null,
  description: '',
  remarks: '',
  status: true
})

const rules = reactive({
  activityName: [
    { required: true, message: '请输入活动名称', trigger: 'blur' }
  ],
  activityTypeId: [
    { required: true, message: '请选择活动类型', trigger: 'change' }
  ],
  activityDate: [
    { required: true, message: '请选择活动日期', trigger: 'change' }
  ],
  startTime: [
    { required: true, message: '请选择开始时间', trigger: 'change' }
  ],
  endTime: [
    { required: true, message: '请选择结束时间', trigger: 'change' }
  ]
})

const dialog = reactive({
  visible: false,
  title: ''
})

const participantDialog = reactive({
  visible: false
})

// 表单引用
const formRef = ref()

// 方法
const loadActivityTypes = async () => {
  try {
    const response = await listActivityTypes()
    activityTypes.value = response.data?.list || []
  } catch (error) {
    console.error('获取活动类型失败:', error)
    ElMessage.error('获取活动类型失败')
  }
}

const loadStaffList = async () => {
  try {
    // 调用实际API获取员工列表
    const response = await getEmployeeList({ pageNum: 1, pageSize: 1000 })
    // 假设返回的数据结构中有 id 和 name 字段
    staffList.value = response.data?.list?.map(item => ({
      id: item.id,
      name: item.name || item.employeeName || item.staffName
    })) || []
  } catch (error) {
    console.error('获取员工列表失败:', error)
    ElMessage.error('获取员工列表失败')
    
    // 出错时使用模拟数据
    const mockStaffList = [
      { id: 1, name: '张老师' },
      { id: 2, name: '李医生' },
      { id: 3, name: '王阿姨' },
      { id: 4, name: '赵护士' }
    ]
    staffList.value = mockStaffList
  }
}

// 方法
const getList = async () => {
  loading.value = true
  try {
    const response = await getDailyActivities(queryParams)
    list.value = response.data?.list || []
    total.value = response.data?.totalCount || 0
  } catch (error) {
    console.error('获取活动参与记录失败:', error)
    ElMessage.error('获取数据失败')
  } finally {
    loading.value = false
  }
}

const handleFilter = () => {
  queryParams.pageNum = 1
  getList()
}

const handleCreate = () => {
  resetForm()
  dialog.visible = true
  dialog.title = '新增活动'
}

const handleEdit = (row) => {
  resetForm()
  Object.assign(form, {
    ...row,
    status: !!row.status,
    activityDate: row.activityDate,
    startTime: row.startTime,
    endTime: row.endTime
  })
  dialog.visible = true
  dialog.title = '编辑活动'
}

const handleManageParticipants = (row) => {
  currentActivityId.value = row.id
  participantDialog.visible = true
}

const handleToggleStatus = async (row) => {
  const action = row.status ? '取消' : '恢复'
  try {
    await ElMessageBox.confirm(`确定要${action}该活动吗？`, '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    
    // 调用API更新状态
    // 这里需要根据实际API接口调整
    const updateData = {
      id: row.id,
      status: row.status ? 0 : 1
    }
    await updateDailyActivity(updateData)
    row.status = updateData.status
    ElMessage.success(`${action}成功`)
    getList()
  } catch (error) {
    console.error('操作失败:', error)
  }
}

const handleSubmit = async () => {
  try {
    await formRef.value?.validate()
    
    submitting.value = true
    
    if (form.id) {
      await updateDailyActivity(form)
      ElMessage.success('修改成功')
    } else {
      await createDailyActivity(form)
      ElMessage.success('新增成功')
    }
  
    dialog.visible = false
    getList()
  } catch (error) {
    if (error?.errors) {
      // 表单验证错误
      return
    }
    console.error('操作失败:', error)
    ElMessage.error('操作失败')
  } finally {
    submitting.value = false
  }
}

const handleDelete = async (row) => {
  try {
    await ElMessageBox.confirm('确定要删除这条参与记录吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    
    await deleteDailyActivity(row.id)
    ElMessage.success('删除成功')
    getList()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除失败:', error)
      ElMessage.error('删除失败')
    }
  }
}

const resetForm = () => {
  form.id = null
  form.activityName = ''
  form.activityTypeId = null
  form.activityDate = ''
  form.startTime = ''
  form.endTime = ''
  form.location = ''
  form.organizerId = null
  form.description = ''
  form.remarks = ''
  form.status = true
  formRef.value?.clearValidate()
}

const formatDate = (date) => {
  if (!date) return ''
  try {
    return new Date(date).toLocaleDateString()
  } catch (error) {
    console.error('日期格式化错误:', error)
    return date
  }
}

// 根据活动类型ID获取活动类型名称
const getActivityTypeName = (typeId) => {
  const type = activityTypes.value.find(item => item.id === typeId)
  return type ? type.typeName : ''
}

// 生命周期
onMounted(() => {
  loadActivityTypes()
  loadStaffList()
  getList()
})
</script>

<style scoped>
.filter-container {
  margin-bottom: 20px;
}
</style>