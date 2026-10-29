<template>
  <div class="payments-management">
    <!-- 搜索和操作区域 -->
    <el-card class="mb-4" shadow="hover">
      <el-form :model="queryParams" ref="queryFormRef" :inline="true" label-width="80px">
        <el-form-item label="老人ID" prop="residentId">
          <el-input
            v-model="queryParams.residentId"
            placeholder="请输入老人ID"
            clearable
            style="width: 200px"
            @keyup.enter="handleQuery"
          />
        </el-form-item>
        <el-form-item label="缴费日期" prop="paymentDate">
          <el-date-picker
            v-model="queryParams.paymentDate"
            type="date"
            placeholder="选择缴费日期"
            style="width: 200px"
            value-format="YYYY-MM-DD"
          />
        </el-form-item>
        <el-form-item label="缴费状态" prop="paymentStatus">
          <el-select v-model="queryParams.paymentStatus" placeholder="请选择缴费状态" clearable style="width: 200px">
            <el-option label="已缴" value="已缴" />
            <el-option label="未缴" value="未缴" />
            <el-option label="欠费" value="欠费" />
          </el-select>
        </el-form-item>
        <el-form-item label="缴费方式" prop="paymentMethod">
          <el-select v-model="queryParams.paymentMethod" placeholder="请选择缴费方式" clearable style="width: 200px">
            <el-option label="现金" value="现金" />
            <el-option label="银行卡" value="银行卡" />
            <el-option label="微信" value="微信" />
            <el-option label="支付宝" value="支付宝" />
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
          <el-button type="primary" icon="plus" @click="handleAdd" round>新增缴费</el-button>
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
        :data="paymentsList"
        @selection-change="handleSelectionChange"
        @sort-change="handleSortChange"
      >
        <el-table-column type="selection" width="55" align="center" />
        <el-table-column label="记录ID" align="center" prop="id" width="80" />
        <el-table-column label="老人ID" align="center" prop="residentId" width="80" />
        <el-table-column label="老人姓名" align="center" prop="residentName" width="100">
          <template #default="scope">
            {{ getResidentName(scope.row.residentId) }}
          </template>
        </el-table-column>
        <el-table-column label="缴费日期" align="center" prop="payment_date" width="120" />
        <el-table-column label="缴费金额" align="center" prop="amount" width="100">
          <template #default="scope">
            ¥{{ scope.row.amount }}
          </template>
        </el-table-column>
        <el-table-column label="缴费方式" align="center" prop="payment_method" width="100">
          <template #default="scope">
            <el-tag :type="getPaymentMethodTagType(scope.row.paymentMethod)">
              {{ scope.row.paymentMethod }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="缴费状态" align="center" prop="payment_status" width="100">
          <template #default="scope">
            <el-tag :type="getPaymentStatusTagType(scope.row.payment_status)">
              {{ scope.row.paymentStatus }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作员" align="center" prop="operator" width="100" />
        <el-table-column label="备注" align="center" prop="remarks" min-width="150" show-overflow-tooltip />
        <el-table-column label="创建时间" align="center" prop="create_at" width="160">
          <template #default="scope">
            <span>{{ parseTime(scope.row.createAt) }}</span>
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

    <!-- 添加或修改缴费记录对话框 -->
    <el-dialog :title="title" v-model="open" width="600px" append-to-body>
      <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
        <el-form-item label="老人" prop="residentId">
          <el-select v-model="form.residentId" placeholder="请选择老人" style="width: 100%">
            <el-option
              v-for="resident in residentsOptions"
              :key="resident.id"
              :label="`${resident.name} (${resident.residentNumber})`"
              :value="resident.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="缴费日期" prop="paymentDate">
          <el-date-picker
            v-model="form.paymentDate"
            type="date"
            placeholder="选择缴费日期"
            style="width: 100%"
            value-format="YYYY-MM-DD"
          />
        </el-form-item>
        <el-form-item label="缴费金额" prop="amount">
          <el-input-number
            v-model="form.amount"
            :min="0"
            :precision="2"
            :step="0.1"
            style="width: 100%"
            placeholder="请输入缴费金额"
          />
        </el-form-item>
        <el-form-item label="缴费方式" prop="paymentMethod">
          <el-select v-model="form.paymentMethod" placeholder="请选择缴费方式" style="width: 100%">
            <el-option label="现金" value="现金" />
            <el-option label="银行卡" value="银行卡" />
            <el-option label="微信" value="微信" />
            <el-option label="支付宝" value="支付宝" />
          </el-select>
        </el-form-item>
        <el-form-item label="缴费状态" prop="paymentStatus">
          <el-select v-model="form.paymentStatus" placeholder="请选择缴费状态" style="width: 100%">
            <el-option label="已缴" value="已缴" />
            <el-option label="未缴" value="未缴" />
            <el-option label="欠费" value="欠费" />
          </el-select>
        </el-form-item>
        <el-form-item label="操作员" prop="operator">
          <el-input v-model="form.operator" placeholder="请输入操作员姓名" />
        </el-form-item>
        <el-form-item label="备注" prop="remarks">
          <el-input
            v-model="form.remarks"
            type="textarea"
            :rows="3"
            placeholder="请输入备注"
          />
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
import { getPaymentsList,getPaymentDetail,addPayment, updatePayment, deletePayment } from '@/api/fee'
import { getResidentsList } from '@/api/residents'

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

// 缴费记录列表
const paymentsList = ref([])

// 选项数据
const residentsOptions = ref([])

// 查询参数
const queryParams = reactive({
  pageNum: 1,
  pageSize: 10,
  residentId: undefined,
  paymentDate: undefined,
  paymentStatus: undefined,
  paymentMethod: undefined
})

// 表单数据
const form = reactive({
  id: undefined,
  residentId: '',
  paymentDate: '',
  amount: 0,
  paymentMethod: '',
  paymentStatus: '未缴',
  operator: '',
  remarks: ''
})

// 表单验证规则
const rules = {
  residentId: [{ required: true, message: '请选择老人', trigger: 'change' }],
  payment_date: [{ required: true, message: '请选择缴费日期', trigger: 'change' }],
  amount: [{ required: true, message: '请输入缴费金额', trigger: 'blur' }],
  payment_method: [{ required: true, message: '请选择缴费方式', trigger: 'change' }],
  payment_status: [{ required: true, message: '请选择缴费状态', trigger: 'change' }]
}

// 获取缴费方式标签样式
const getPaymentMethodTagType = (method) => {
  const typeMap = {
    '现金': 'success',
    '银行卡': 'primary',
    '微信': 'success',
    '支付宝': 'warning'
  }
  return typeMap[method] || 'info'
}

// 获取缴费状态标签样式
const getPaymentStatusTagType = (status) => {
  const typeMap = {
    '已缴': 'success',
    '未缴': 'warning',
    '欠费': 'danger'
  }
  return typeMap[status] || 'info'
}

// 获取老人姓名
const getResidentName = (residentId) => {
  const resident = residentsOptions.value.find(r => r.id === residentId)
  return resident ? resident.name : '未知'
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

// 加载选项数据
const loadOptions = async () => {
  try {
    // 加载老人列表
    const residentsResponse = await getResidentsList({ pageSize: 100 })
    if (residentsResponse.code === 200) {
      residentsOptions.value = residentsResponse.rows
    }
  } catch (error) {
    console.error('加载选项数据失败:', error)
  }
}

// 获取缴费记录列表
const getList = async () => {
  loading.value = true
  try {
    const response = await getPaymentsList(queryParams)
    if (response.code === 200) {
      paymentsList.value = response.data.list
      total.value = response.data.totalCount
    }
  } catch (error) {
    console.error('获取缴费记录列表失败:', error)
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

// 新增按钮操作
const handleAdd = () => {
  resetForm()
  open.value = true
  title.value = '添加缴费记录'
}

// 修改按钮操作
const handleUpdate = async (row) => {
  resetForm()
  try {
    const id = row.id ? row.id : ids.value
    const response = await getPaymentDetail(id)
    console.log('response:', response)  
    if (response.code === 200) {
      Object.assign(form, response.data)
      open.value = true
      title.value = '修改缴费记录'
    }
  } catch (error) {
    console.error('获取缴费记录详情失败:', error)
    ElMessage.error('获取缴费记录详情失败')
  }
  open.value = true
  title.value = '修改缴费记录记录'
}

// 删除按钮操作
const handleDelete = async (row) => {
  const paymentIds = row.id ? [row.id] : ids.value
  if (!paymentIds.length) {
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
    for (const id of paymentIds) {
      await deletePayment(id)
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
    residentId: '',
    payment_date: '',
    amount: 0,
    payment_method: '',
    payment_status: '未缴',
    operator: '',
    remarks: ''
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
          await updatePayment(form)
          ElMessage.success('修改成功')
        } else {
          await addPayment(form)
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
  loadOptions()
  getList()
})
</script>

<style scoped>
.payments-management {
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