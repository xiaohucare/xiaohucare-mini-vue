<template>
  <div class="fee-items-management">
    <!-- 搜索和操作区域 -->
    <el-card class="mb-4" shadow="hover">
      <el-form :model="queryParams" ref="queryFormRef" :inline="true" label-width="80px">
        <el-form-item label="项目名称" prop="itemName">
          <el-input
            v-model="queryParams.itemName"
            placeholder="请输入项目名称"
            clearable
            style="width: 200px"
            @keyup.enter="handleQuery"
          />
        </el-form-item>
        <el-form-item label="项目类型" prop="itemType">
          <el-select v-model="queryParams.itemType" placeholder="请选择项目类型" clearable style="width: 200px">
            <el-option
              v-for="item in itemTypeOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-select v-model="queryParams.status" placeholder="请选择状态" clearable style="width: 200px">
            <el-option label="启用" :value="1" />
            <el-option label="停用" :value="0" />
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
          <el-button type="primary" icon="plus" @click="handleAdd" round>新增</el-button>
          <el-button type="success" icon="edit" :disabled="single" @click="handleUpdate" round>修改</el-button>
          <el-button type="danger" icon="delete" :disabled="multiple" @click="handleDelete" round>删除</el-button>
          <el-button type="warning" icon="download" @click="handleExport" round>导出</el-button>
        </el-col>
      </el-row>
    </el-card>

    <!-- 数据表格 -->
    <el-card shadow="hover">
      <el-table
        v-loading="loading"
        :data="feeItemsList"
        @selection-change="handleSelectionChange"
        @sort-change="handleSortChange"
      >
        <el-table-column type="selection" width="55" align="center" />
        <el-table-column label="项目ID" align="center" prop="id" width="80" />
        <el-table-column label="项目名称" align="center" prop="itemName" min-width="120" />
        <el-table-column label="项目类型" align="center" prop="itemType" width="100">
          <template #default="scope">
            <el-tag :type="getItemTypeTagType(scope.row.itemType)">
              {{ scope.row.itemType }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="单价" align="center" prop="unitPrice" width="100">
          <template #default="scope">
            ¥{{ scope.row.unitPrice }}
          </template>
        </el-table-column>
        <el-table-column label="单位" align="center" prop="unit" width="80" />
        <el-table-column label="描述" align="center" prop="description" min-width="150" show-overflow-tooltip />
        <el-table-column label="状态" align="center" prop="status" width="80">
          <template #default="scope">
            <el-switch
              v-model="scope.row.status"
              :active-value="1"
              :inactive-value="0"
              @change="handleStatusChange(scope.row)"
            />
          </template>
        </el-table-column>
        <el-table-column label="创建时间" align="center" prop="create_at" width="160">
          <template #default="scope">
            <span>{{ parseTime(scope.row.create_at) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" align="center" width="200" class-name="small-padding fixed-width">
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

    <!-- 添加或修改收费项目对话框 -->
    <el-dialog :title="title" v-model="open" width="500px" append-to-body>
      <el-form ref="formRef" :model="form" :rules="rules" label-width="80px">
        <el-form-item label="项目名称" prop="itemName">
          <el-input v-model="form.itemName" placeholder="请输入项目名称" />
        </el-form-item>
        <el-form-item label="项目类型" prop="itemType">
          <el-select v-model="form.itemType" placeholder="请选择项目类型">
            <el-option
              v-for="item in itemTypeOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="单价" prop="unitPrice">
          <el-input-number
            v-model="form.unitPrice"
            :min="0"
            :precision="2"
            :step="0.1"
            style="width: 100%"
            placeholder="请输入单价"
          />
        </el-form-item>
        <el-form-item label="单位" prop="unit">
          <el-input v-model="form.unit" placeholder="请输入单位" />
        </el-form-item>
        <el-form-item label="描述" prop="description">
          <el-input
            v-model="form.description"
            type="textarea"
            :rows="3"
            placeholder="请输入描述"
          />
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-radio-group v-model="form.status">
            <el-radio :label="1">启用</el-radio>
            <el-radio :label="0">停用</el-radio>
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
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getFeeItemsList, addFeeItem, updateFeeItem, deleteFeeItem } from '@/api/fee'

// 组件引用
const queryFormRef = ref()
const formRef = ref()

// 响应式数据
const loading = ref(true)
const ids = ref([])
const single = ref(true)
const multiple = ref(true)
const total = ref(0)
const title = ref('')
const open = ref(false)

// 收费项目列表
const feeItemsList = ref([])

// 项目类型选项
const itemTypeOptions = [
  { value: '住宿费', label: '住宿费' },
  { value: '餐费', label: '餐费' },
  { value: '护理费', label: '护理费' },
  { value: '医疗服务费', label: '医疗服务费' },
  { value: '其他', label: '其他' }
]

// 查询参数
const queryParams = reactive({
  itemTpl:1,
  pageNum: 1,
  pageSize: 10,
  itemName: undefined,
  itemType: undefined,
  status: undefined
})

// 表单数据
const form = reactive({
  id: undefined,
  itemName: '',
  itemType: '',
  unitPrice: 0,
  unit: '',
  description: '',
  status: 1,
  itemTpl:1,
  groupId:0,
})

// 表单验证规则
const rules = {
  itemName: [{ required: true, message: '项目名称不能为空', trigger: 'blur' }],
  itemType: [{ required: true, message: '项目类型不能为空', trigger: 'change' }],
  unitPrice: [{ required: true, message: '单价不能为空', trigger: 'blur' }],
  unit: [{ required: true, message: '单位不能为空', trigger: 'blur' }]
}

// 获取项目类型标签样式
const getItemTypeTagType = (type) => {
  const typeMap = {
    '住宿费': 'primary',
    '餐费': 'success',
    '护理费': 'warning',
    '医疗服务费': 'danger',
    '其他': 'info'
  }
  return typeMap[type] || 'info'
}

// 时间格式化
const parseTime = (time) => {
  if (!time) return ''
  const date = new Date(time)
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
}

// 获取收费项目列表
const getList = async () => {
  loading.value = true
  try {
    const response = await getFeeItemsList(queryParams)
    if (response.code === 200) {
      feeItemsList.value = response.data.list;
      total.value = response.data.totalCount
    }
  } catch (error) {
    console.error('获取收费项目列表失败:', error)
  } finally {
    loading.value = false
  }
}

// 搜索按钮操作
const handleQuery = () => {
  queryParams.pageNum = 1
  getList()
}

// 重置按钮操作
const resetQuery = () => {
  queryFormRef.value.resetFields()
  handleQuery()
}

// 多选框选中数据
const handleSelectionChange = (selection) => {
  ids.value = selection.map(item => item.id)
  single.value = selection.length !== 1
  multiple.value = !selection.length
}

// 排序触发
const handleSortChange = (column) => {
  // 这里可以添加排序逻辑
  console.log('排序:', column)
}

// 状态开关变化
const handleStatusChange = async (row) => {
  try {
    await updateFeeItem(row)
    ElMessage.success('状态修改成功')
    getList()
  } catch (error) {
    console.error('状态修改失败:', error)
    ElMessage.error('状态修改失败')
    // 恢复原状态
    row.status = row.status === 1 ? 0 : 1
  }
}

// 新增按钮操作
const handleAdd = () => {
  resetForm()
  open.value = true
  title.value = '添加收费项目'
}

// 修改按钮操作
const handleUpdate = (row) => {
  resetForm()
  const feeItemId = row.id || ids.value[0]
  // 这里应该调用获取详情的API，暂时直接使用行数据
  Object.assign(form, row)
  open.value = true
  title.value = '修改收费项目'
}

// 删除按钮操作
const handleDelete = async (row) => {
  const feeItemIds = row.id ? [row.id] : ids.value
  if (!feeItemIds.length) {
    ElMessage.warning('请选择要删除的数据')
    return
  }

  try {
    await ElMessageBox.confirm('是否确认删除选中的数据？', '警告', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })

    // 批量删除
    for (const id of feeItemIds) {
      await deleteFeeItem(id)
    }

    ElMessage.success('删除成功')
    getList()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除失败:', error)
      ElMessage.error('删除失败')
    }
  }
}

// 导出按钮操作
const handleExport = () => {
  // 这里可以添加导出逻辑
  ElMessage.info('导出功能待实现')
}

// 表单重置
const resetForm = () => {
  formRef.value?.resetFields()
  Object.assign(form, {
    id: undefined,
    itemName: '',
    itemType: '',
    unitPrice: 0,
    unit: '',
    description: '',
    status: 1
  })
}

// 取消按钮
const cancel = () => {
  open.value = false
  resetForm()
}

// 提交表单
const submitForm = async () => {
  if (!formRef.value) return
  
  await formRef.value.validate(async (valid) => {
    if (valid) {
      try {
        if (form.id) {
          await updateFeeItem(form)
          ElMessage.success('修改成功')
        } else {
          await addFeeItem(form)
          ElMessage.success('新增成功')
        }
        open.value = false
        getList()
      } catch (error) {
        console.error('操作失败:', error)
        ElMessage.error('操作失败')
      }
    }
  })
}

onMounted(() => {
  getList()
})
</script>

<style scoped>
.fee-items-management {
  padding: 0;
}

.mb-4 {
  margin-bottom: 20px;
}

.mb-2 {
  margin-bottom: 10px;
}

.dialog-footer {
  text-align: right;
}
</style>