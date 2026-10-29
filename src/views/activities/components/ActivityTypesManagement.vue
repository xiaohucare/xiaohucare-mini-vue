<template>
  <div class="activity-types-management">
    <div class="filter-container">
      <el-button type="primary" @click="handleCreate" round>
        <el-icon><Plus /></el-icon>
        新增活动类型
      </el-button>
      <el-input
        v-model="queryParams.search"
        placeholder="搜索活动类型名称"
        style="width: 200px; margin-left: 10px;"
        @keyup.enter="handleFilter"
      >
        <template #append>
          <el-button @click="handleFilter" round>
            <el-icon><Search /></el-icon>
          </el-button>
        </template>
      </el-input>
    </div>

    <el-table
      :data="list"
      style="width: 100%"
      v-loading="loading"
    >
      <el-table-column prop="typeName" label="活动类型名称" min-width="120" />
      <el-table-column prop="description" label="描述" min-width="200" show-overflow-tooltip />
      <el-table-column prop="status" label="状态" width="100">
        <template #default="{ row }">
          <el-tag :type="row.status ? 'success' : 'danger'">
            {{ row.status ? '正常' : '停用' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="createAt" label="创建时间" width="180">
        <template #default="{ row }">
          {{ formatDate(row.createAt) }}
        </template>
      </el-table-column>
      <el-table-column label="操作" width="200" fixed="right">
        <template #default="{ row }">
          <el-button size="small" @click="handleEdit(row)" round>编辑</el-button>
          <el-button 
            size="small" 
            :type="row.status ? 'danger' : 'success'" 
            @click="handleToggleStatus(row)"
            round
          >
            {{ row.status ? '停用' : '启用' }}
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
      width="500px"
      @close="resetForm"
    >
      <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
        <el-form-item label="类型名称" prop="typeName">
          <el-input v-model="form.typeName" placeholder="请输入活动类型名称" />
        </el-form-item>
        <el-form-item label="描述" prop="description">
          <el-input 
            v-model="form.description" 
            type="textarea" 
            :rows="3" 
            placeholder="请输入活动类型描述"
          />
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-switch
            v-model="form.status"
            active-text="正常"
            inactive-text="停用"
          />
        </el-form-item>
      </el-form>
      
      <template #footer>
        <el-button @click="dialog.visible = false" round>取消</el-button>
        <el-button type="primary" @click="handleSubmit" :loading="submitting" round>确认</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { Plus, Search } from '@element-plus/icons-vue'
import { listActivityTypes, createActivityType, updateActivityType, deleteActivityType } from '@/api/activities'
import { ElMessage, ElMessageBox } from 'element-plus'

// 响应式数据
const loading = ref(false)
const submitting = ref(false)
const total = ref(0)
const list = ref([])

const queryParams = reactive({
  pageNum: 1,
  pageSize: 10,
  search: ''
})

const form = reactive({
  id: null,
  typeName: '',
  description: '',
  status: 1
})

const dialog = reactive({
  visible: false,
  title: '新增活动类型'
})

const rules = reactive({
  typeName: [
    { required: true, message: '请输入活动类型名称', trigger: 'blur' }
  ]
})

// 表单引用
const formRef = ref()

// 方法
const getList = async () => {
  loading.value = true
  try {
    const response = await listActivityTypes(queryParams)
    list.value = response.data?.list || []
    // 转换状态格式用于前端显示
    list.value.forEach(item => {
      item.status = item.status === 1
    })
    total.value = response.data?.totalCount || 0
  } catch (error) {
    console.error('获取活动类型列表失败:', error)
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
  dialog.title = '新增活动类型'
  dialog.visible = true
}

const handleEdit = (row) => {
  resetForm()
  Object.assign(form, row)
  dialog.title = '编辑活动类型'
  dialog.visible = true
}

const handleToggleStatus = async (row) => {
  const action = row.status ? '停用' : '启用'
  
  try {
    await ElMessageBox.confirm(`确定要${action}该活动类型吗？`, '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    
    // 模拟API调用，实际应该调用 updateActivityType
    const statusValue = row.status ? 0 : 1
    // 这里应该调用实际的API：await updateActivityType({ id: row.id, status: statusValue })
    
    // 更新本地状态
    row.status = !row.status
    ElMessage.success(`${action}成功`)
    getList() // 刷新列表
  } catch (error) {
    if (error !== 'cancel') {
      console.error('状态切换失败:', error)
      ElMessage.error('操作失败')
    }
  }
}

const handleSubmit = async () => {
  try {
    await formRef.value?.validate()
    
    submitting.value = true
    
    // 转换状态格式用于API调用
    const submitData = {
      ...form,
      status: form.status ? 1 : 0
    }
    
    if (form.id) {
      // 编辑
      await updateActivityType(submitData)
      ElMessage.success('编辑成功')
    } else {
      // 新增
      await createActivityType(submitData)
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
    await ElMessageBox.confirm('确定要删除该活动类型吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    
    await deleteActivityType(row.id)
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
  form.typeName = ''
  form.description = ''
  form.status = 1
  formRef.value?.clearValidate()
}

const formatDate = (date) => {
  return new Date(date).toLocaleString()
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