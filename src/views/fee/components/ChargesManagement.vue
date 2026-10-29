<template>
  <div class="charges-management">
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
        <el-form-item label="收费项目" prop="feeGroupId">
          <el-select v-model="queryParams.feeGroupId" placeholder="请选择收费项目" clearable style="width: 200px">
            <el-option
              v-for="item in feeGroupOptions"
              :key="item.id"
              :label="item.groupName"
              :value="item.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="收费日期" prop="chargeDate">
          <el-date-picker
            v-model="queryParams.chargeDate"
            type="date"
            placeholder="选择收费日期"
            style="width: 200px"
            value-format="YYYY-MM-DD"
          />
        </el-form-item>
        <el-form-item label="收费周期" prop="chargePeriod">
          <el-select v-model="queryParams.chargePeriod" placeholder="请选择收费周期" clearable style="width: 200px">
            <el-option
              v-for="period in chargePeriodOptions"
              :key="period"
              :label="period"
              :value="period"
            />
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
          <el-button type="primary" icon="plus" @click="handleAdd" round>新增收费</el-button>
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
        :data="chargesList"
        @selection-change="handleSelectionChange"
        @sort-change="handleSortChange"
      >
        <el-table-column type="selection" width="55" align="center" />
        <el-table-column label="记录ID" align="center" prop="id" width="80" />
        <!-- <el-table-column label="老人ID" align="center" prop="residentId" width="80" /> -->
        <el-table-column label="老人姓名" align="center" prop="residentName" width="80" />
        <el-table-column label="收费项目" align="center" prop="feeGroupName">
          <template #default="scope">
            {{ getFeeGroupName(scope.row.feeGroupId) }}
          </template>
        </el-table-column>
       
        <!-- <el-table-column label="数量" align="center" prop="quantity" width="80" />
        <el-table-column label="单价" align="center" prop="unitPrice" width="100">
          <template #default="scope">
            ¥{{ scope.row.unitPrice }}
          </template>
        </el-table-column> -->
        <el-table-column label="总金额" align="center" prop="totalAmount" width="100">
          <template #default="scope">
            ¥{{ scope.row.totalAmount }}
          </template>
        </el-table-column>
        <el-table-column label="支付金额" align="center" prop="totalAmount" width="100">
          <template #default="scope">
            ¥{{ scope.row.payMoney }}
          </template>
        </el-table-column>
         <el-table-column label="收费日期" align="center" prop="chargeDate" width="120" />
        <el-table-column label="收费周期" align="center" prop="chargePeriod" width="100" />
        <el-table-column label="备注" align="center" prop="remarks" min-width="150" show-overflow-tooltip />
        <el-table-column label="创建时间" align="center" prop="createAt" width="160">
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

    <!-- 添加或修改收费记录对话框 -->
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
        <el-form-item label="收费项目" prop="feeGroupId">
          <el-select v-model="form.feeGroupId" placeholder="请选择收费项目" style="width: 100%">
            <el-option
              v-for="item in feeGroupOptions"
              :key="item.id"
              :label="`${item.groupName} (¥${item.totalMoney}----${item.payMoney})`"
              :value="item.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="收费日期" prop="charge_date">
          <el-date-picker
            v-model="form.charge_date"
            type="date"
            placeholder="选择收费日期"
            style="width: 100%"
            value-format="YYYY-MM-DD"
          />
        </el-form-item>
        <el-form-item label="数量" prop="quantity">
          <el-input-number
            v-model="form.quantity"
            :min="0.01"
            :precision="2"
            :step="0.1"
            style="width: 100%"
            placeholder="请输入数量"
            @change="calculateTotalAmount"
          />
        </el-form-item>
        <el-form-item label="单价" prop="unit_price">
          <el-input-number
            v-model="form.unit_price"
            :min="0"
            :precision="2"
            :step="0.1"
            style="width: 100%"
            placeholder="请输入单价"
            @change="calculateTotalAmount"
          />
        </el-form-item>
        <el-form-item label="总金额" prop="total_amount">
          <el-input-number
            v-model="form.total_amount"
            :min="0"
            :precision="2"
            :step="0.1"
            style="width: 100%"
            placeholder="自动计算总金额"
            disabled
          />
        </el-form-item>
        <el-form-item label="收费周期" prop="charge_period">
          <el-select v-model="form.charge_period" placeholder="请选择收费周期" style="width: 100%">
            <el-option
              v-for="period in chargePeriodOptions"
              :key="period"
              :label="period"
              :value="period"
            />
          </el-select>
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
import { ref, reactive, onMounted, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getChargesList, addCharge, updateCharge, deleteCharge } from '@/api/fee'
import { getFeeGroupListAll } from '@/api/fee'
import { getResidentsList } from '@/api/residents'
import { get } from '@vueuse/core'

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

// 收费记录列表
const chargesList = ref([])

// 选项数据
const feeGroupOptions = ref([])
const residentsOptions = ref([])

// 收费周期选项
const chargePeriodOptions = ['2024-01', '2024-02', '2024-03', '2024-04', '2024-05', '2024-06', '2024-07', '2024-08', '2024-09', '2024-10', '2024-11', '2024-12']

// 查询参数
const queryParams = reactive({
  pageNum: 1,
  pageSize: 10,
  residentId: undefined,
  feeItemId: undefined,
  chargeDate: undefined,
  chargePeriod: undefined
})

// 表单数据
const form = reactive({
  id: undefined,
  residentId: '',
  fee_item_id: '',
  charge_date: '',
  quantity: 1,
  unit_price: 0,
  total_amount: 0,
  charge_period: '',
  remarks: ''
})

// 表单验证规则
const rules = {
  residentId: [{ required: true, message: '请选择老人', trigger: 'change' }],
  fee_item_id: [{ required: true, message: '请选择收费项目', trigger: 'change' }],
  charge_date: [{ required: true, message: '请选择收费日期', trigger: 'change' }],
  quantity: [{ required: true, message: '请输入数量', trigger: 'blur' }],
  unit_price: [{ required: true, message: '请输入单价', trigger: 'blur' }]
}

// 计算总金额
const calculateTotalAmount = () => {
  form.total_amount = (form.quantity * form.unit_price).toFixed(2)
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
// 获取老人姓名
const getFeeGroupName = (groupId) => {
  const feeGroup = feeGroupOptions.value.find(r => r.id === groupId)
  return feeGroup ? feeGroup.groupName : '未知'
}
// 加载收费项目选项
const loadOptions = async () => {
  try {
    const response = await getFeeGroupListAll({ pageSize: 100 })
    if (response.code === 200) {
      feeGroupOptions.value = response.data;
    }
  } catch (error) {
    console.error('加载收费套餐选项失败:', error)
    ElMessage.error('加载收费套餐选项失败')
  }
}
// 获取收费记录列表
const getList = async () => {
  loading.value = true
  try {
    const response = await getChargesList(queryParams)
    if (response.code === 200) {
      chargesList.value = response.data.list
      total.value = response.data.totalCount
    }
  } catch (error) {
    console.error('获取收费记录列表失败:', error)
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
  title.value = '添加收费记录'
}

// 修改按钮操作
const handleUpdate = (row) => {
  resetForm()
  const chargeId = row.id || ids.value[0]
  // 这里应该调用获取详情的API，暂时直接使用行数据
  Object.assign(form, row)
  open.value = true
  title.value = '修改收费记录'
}

// 删除按钮操作
const handleDelete = async (row) => {
  const chargeIds = row.id ? [row.id] : ids.value
  if (!chargeIds.length) {
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
    for (const id of chargeIds) {
      await deleteCharge(id)
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
    fee_item_id: '',
    charge_date: '',
    quantity: 1,
    unit_price: 0,
    total_amount: 0,
    charge_period: '',
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
          await updateCharge(form)
          ElMessage.success('修改成功')
        } else {
          await addCharge(form)
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
.charges-management {
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