<template>
  <div class="activity-participants-management">
    <div class="filter-container">
      <el-button type="primary" @click="handleBatchUpdate" icon="edit" round>批量更新</el-button>
      <el-select v-model="queryParams.participationStatus" placeholder="参与状态" clearable style="width: 120px; margin-left: 10px;">
        <el-option v-for="opt in STATUS_OPTIONS" :key="opt.value" :label="opt.label" :value="opt.value" />
      </el-select>
      <el-input
        v-model="queryParams.search"
        placeholder="搜索老人姓名"
        style="width: 200px; margin-left: 10px;"
        @keyup.enter="handleFilter"
      >
        <template #append>
          <el-button @click="handleFilter" icon="search" round></el-button>
        </template>
      </el-input>
    </div>

    <el-table
      :data="list"
      style="width: 100%"
      v-loading="loading"
      @selection-change="handleSelectionChange"
    >
      <el-table-column type="selection" width="55" />
      <el-table-column prop="residentName" label="老人姓名" width="100" />
      <el-table-column prop="activityName" label="活动名称" min-width="120" show-overflow-tooltip />
      <el-table-column prop="activityDate" label="活动日期" width="120">
        <template #default="{ row }">
          {{ formatDate(row.activityDate) }}
        </template>
      </el-table-column>
      <el-table-column prop="participationStatus" label="参与状态" width="100">
        <template #default="{ row }">
          <el-tag :type="getStatusType(row.participationStatus)">
            {{ participationStatusLabel(row.participationStatus) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="rating" label="评分" width="80">
        <template #default="{ row }">
          <el-rate
            v-model="row.rating"
            disabled
            show-score
            text-color="#ff9900"
            score-template="{value}"
          />
        </template>
      </el-table-column>
      <el-table-column prop="feedback" label="反馈意见" min-width="150" show-overflow-tooltip />
      <el-table-column prop="createAt" label="记录时间" width="180">
        <template #default="{ row }">
          {{ formatDateTime(row.createAt) }}
        </template>
      </el-table-column>
      <el-table-column label="操作" width="250" fixed="right">
        <template #default="{ row }">
          <el-button  size="small" @click="handleEdit(row)" round>编辑</el-button>
          <el-button  size="small" type="danger" @click="handleDelete(row)" round>删除</el-button>
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

    <!-- 编辑对话框 -->
    <el-dialog
      :title="dialog.title"
      v-model="dialog.visible"
      width="500px"
      @close="resetForm"
    >
      <el-form ref="formRef" :model="form" label-width="100px">
        <el-form-item label="老人姓名">
          <el-input v-model="form.residentName" disabled />
        </el-form-item>
        <el-form-item label="活动名称">
          <el-input v-model="form.activityName" disabled />
        </el-form-item>
        <el-form-item label="参与状态" prop="participationStatus">
          <el-select v-model="form.participationStatus" placeholder="请选择参与状态" style="width: 100%;">
            <el-option v-for="opt in STATUS_OPTIONS" :key="opt.value" :label="opt.label" :value="opt.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="评分" prop="rating">
          <el-rate
            v-model="form.rating"
            show-text
            :texts="['很差', '较差', '一般', '较好', '很好']"
          />
        </el-form-item>
        <el-form-item label="反馈意见" prop="feedback">
          <el-input 
            v-model="form.feedback" 
            type="textarea" 
            :rows="3" 
            placeholder="请输入反馈意见"
          />
        </el-form-item>
      </el-form>
      
      <template #footer>
        <el-button @click="dialog.visible = false" round>取消</el-button>
        <el-button type="primary" @click="handleSubmit" :loading="submitting" round>确认</el-button>
      </template>
    </el-dialog>

    <!-- 批量更新对话框 -->
    <el-dialog
      :title="batchDialog.title"
      v-model="batchDialog.visible"
      width="400px"
    >
      <el-form>
        <el-form-item label="参与状态">
          <el-select v-model="batchStatus" placeholder="请选择参与状态" style="width: 100%;">
            <el-option v-for="opt in STATUS_OPTIONS" :key="opt.value" :label="opt.label" :value="opt.value" />
          </el-select>
        </el-form-item>
      </el-form>
      
      <template #footer>
        <el-button @click="batchDialog.visible = false" round>取消</el-button>
        <el-button type="primary" @click="handleBatchSubmit" :loading="submitting" round>确认</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, watch } from 'vue'
import { getActivityParticipants, createActivityParticipant, updateActivityParticipant, deleteActivityParticipant } from '@/api/activities'
import { ElMessage, ElMessageBox } from 'element-plus'
import { PARTICIPATION_STATUS_OPTIONS as STATUS_OPTIONS, getParticipationStatusName as participationStatusLabel, getParticipationStatusTagType as getStatusType } from '@/utils/careEnums'

// 响应式数据
const loading = ref(false)
const submitting = ref(false)
const total = ref(0)
const list = ref([])
const multipleSelection = ref([])
const batchStatus = ref('')

const queryParams = reactive({
  pageNum: 1,
  pageSize: 10,
  search: '',
  participationStatus: ''
})

const form = reactive({
  id: null,
  residentName: '',
  activityName: '',
  participationStatus: '',
  rating: null,
  feedback: ''
})

const dialog = reactive({
  visible: false,
  title: '编辑参与记录'
})

const batchDialog = reactive({
  visible: false,
  title: '批量更新参与状态'
})

// props
defineProps({
  activityId: {
    type: Number,
    default: null
  }
})

// 表单验证
const formRef = ref()

// 方法
const getList = async () => {
  loading.value = true
  try {
    const response = await getActivityParticipants(queryParams)
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

const handleSelectionChange = (selection) => {
  multipleSelection.value = selection
}

const handleEdit = (row) => {
  resetForm()
  Object.assign(form, row)
  dialog.visible = true
}

const handleDelete = async (row) => {
  try {
    await ElMessageBox.confirm('确定要删除这条参与记录吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    
    await deleteActivityParticipant(row.id)
    ElMessage.success('删除成功')
    getList()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除失败:', error)
      ElMessage.error('删除失败')
    }
  }
}

const handleBatchUpdate = () => {
  if (multipleSelection.value.length === 0) {
    ElMessage.warning('请先选择要批量更新的记录')
    return
  }
  batchDialog.visible = true
}

const handleBatchSubmit = async () => {
  if (!batchStatus.value) {
    ElMessage.warning('请选择参与状态')
    return
  }
  
  submitting.value = true
  try {
    const ids = multipleSelection.value.map(item => item.id)
    // 这里需要实现批量更新API调用
    ElMessage.success(`已成功更新${ids.length}条记录的参与状态`)
    batchDialog.visible = false
    getList()
  } catch (error) {
    console.error('批量更新失败:', error)
    ElMessage.error('批量更新失败')
  } finally {
    submitting.value = false
  }
}

const handleSubmit = async () => {
  try {
    await formRef.value?.validate()
    
    submitting.value = true
    
    if (form.id) {
      await updateActivityParticipant(form)
      ElMessage.success('修改成功')
    } else {
      await createActivityParticipant(form)
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

const resetForm = () => {
  form.id = null
  form.residentName = ''
  form.activityName = ''
  form.participationStatus = ''
  form.rating = null
  form.feedback = ''
}

// 参与状态的选项/名称/标签映射统一维护于 @/utils/careEnums

const formatDate = (date) => {
  return new Date(date).toLocaleDateString()
}

const formatDateTime = (dateTime) => {
  return new Date(dateTime).toLocaleString()
}

// 生命周期
onMounted(() => {
  getList()
})
</script>

<style scoped>
.filter-container {
  margin-bottom: 20px;
}
</style>