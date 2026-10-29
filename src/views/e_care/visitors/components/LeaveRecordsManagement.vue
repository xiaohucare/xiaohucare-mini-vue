<template>
  <div class="leave-records-management">
    <!-- 搜索和操作区域 -->
    <el-card class="mb-4" shadow="hover">
      <el-form :model="queryParams" ref="queryFormRef" :inline="true" label-width="80px">
        <el-form-item label="外出日期" prop="leaveDate">
          <el-date-picker
            v-model="queryParams.leaveDate"
            type="date"
            placeholder="选择外出日期"
            style="width: 200px"
            value-format="YYYY-MM-DD"
          />
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-select v-model="queryParams.status" placeholder="请选择状态" clearable style="width: 200px">
            <el-option label="外出中" :value="1" />
            <el-option label="已返回" :value="0" />
          </el-select>
        </el-form-item>
        <el-form-item label="外出事由" prop="reason">
          <el-select v-model="queryParams.reason" placeholder="请选择外出事由" clearable style="width: 200px">
            <el-option
              v-for="item in reasonOptions"
              :key="item"
              :label="item"
              :value="item"
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
          <el-button type="primary" icon="plus" @click="handleAdd" round>新增外出登记</el-button>
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
        :data="leaveRecordsList"
        @selection-change="handleSelectionChange"
        @sort-change="handleSortChange"
      >
        <el-table-column type="selection" width="55" align="center" />
        <el-table-column label="记录ID" align="center" prop="id" width="80" />
        <el-table-column label="老人" align="center" prop="residentName" width="100">
          <template #default="scope">
            {{ scope.row.residentName || getResidentName(scope.row.residentId) }}
          </template>
        </el-table-column>
        <el-table-column label="外出日期" align="center" prop="visitDate" width="120" />
        <el-table-column label="外出时间" align="center" prop="visitTime" width="100" />
        <el-table-column label="预计返回" align="center" prop="expectedReturnTime" width="160" />
        <el-table-column label="实际返回" align="center" prop="actualReturnTime" width="160">
          <template #default="scope">
            {{ scope.row.actualReturnTime || '未返回' }}
          </template>
        </el-table-column>
        <el-table-column label="外出事由" align="center" prop="reason" width="120">
          <template #default="scope">
            <el-tag :type="getReasonTagType(scope.row.reason)">
              {{ scope.row.reason }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="陪同人员" align="center" prop="companion" width="100" />
        <el-table-column label="批准人" align="center" prop="approver" width="100" />
        <el-table-column label="状态" align="center" prop="status" width="80">
          <template #default="scope">
            <el-tag :type="scope.row.status === 1 ? 'warning' : 'success'">
              {{ scope.row.status === 1 ? '外出中' : '已返回' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="备注" align="center" prop="remarks" min-width="150" show-overflow-tooltip />
        <el-table-column label="创建时间" align="center" prop="createAt" width="160">
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

    <!-- 添加或修改外出记录对话框 -->
    <el-dialog :title="title" v-model="open" width="600px" append-to-body>
      <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
        <el-form-item label="老人" prop="residentId">
          <el-select v-model="form.residentId" placeholder="请选择老人" style="width: 100%">
            <el-option
              v-for="resident in residentsOptions"
              :key="resident.id"
              :label="`${resident.name} (${resident.residentNo})`"
              :value="resident.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="外出日期" prop="visitDate">
          <el-date-picker
            v-model="form.visitDate"
            type="date"
            placeholder="选择外出日期"
            style="width: 100%"
            value-format="YYYY-MM-DD"
          />
        </el-form-item>
        <el-form-item label="外出时间" prop="visitTime">
          <el-time-picker
            v-model="form.visitTime"
            placeholder="选择外出时间"
            style="width: 100%"
            value-format="HH:mm:ss"
          />
        </el-form-item>
        <el-form-item label="预计返回" prop="expectedReturnTime">
          <el-date-picker
            v-model="form.expectedReturnTime"
            type="datetime"
            placeholder="选择预计返回时间"
            style="width: 100%"
            value-format="YYYY-MM-DD HH:mm:ss"
          />
        </el-form-item>
        <el-form-item label="实际返回" prop="actualReturnTime">
          <el-date-picker
            v-model="form.actualReturnTime"
            type="datetime"
            placeholder="选择实际返回时间（填写即视为已返回）"
            style="width: 100%"
            value-format="YYYY-MM-DD HH:mm:ss"
          />
        </el-form-item>
        <el-form-item label="外出事由" prop="reason">
          <el-select v-model="form.reason" placeholder="请选择外出事由" style="width: 100%">
            <el-option
              v-for="reason in reasonOptions"
              :key="reason"
              :label="reason"
              :value="reason"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="陪同人员" prop="companion">
          <el-select v-model="form.companion" placeholder="请选择陪同人员" style="width: 100%">
            <el-option
              v-for="companion in companionOptions"
              :key="companion"
              :label="companion"
              :value="companion"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="批准人" prop="approver">
          <el-input v-model="form.approver" placeholder="请输入批准人姓名" />
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
import {getVisitRecordsList, addVisitRecord, updateVisitRecord, deleteVisitRecord } from '@/api/care/visitors'
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

// 外出记录列表
const leaveRecordsList = ref([])

// 选项数据
const residentsOptions = ref([])

// 外出事由选项
const reasonOptions = ['回家探亲', '医院就诊', '外出购物', '参加活动', '办理事务', '旅游', '其他']

// 陪同人员选项
const companionOptions = ['家属陪同', '护工陪同', '自行外出', '朋友陪同', '无陪同']

// 查询参数
const queryParams = reactive({
  pageNum: 1,
  pageSize: 10,
  visitType:1,
  residentId: undefined,
  leaveDate: undefined,
  status: undefined,
  reason: undefined
})

// 当前时间格式化（新增记录时默认日期/时间）
const pad2 = (n) => String(n).padStart(2, '0')
const nowDate = () => { const d = new Date(); return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}` }
const nowTime = () => { const d = new Date(); return `${pad2(d.getHours())}:${pad2(d.getMinutes())}:${pad2(d.getSeconds())}` }
const nowDateTime = () => `${nowDate()} ${nowTime()}`

// 表单数据
const form = reactive({
  id: undefined,
  visitType:1,
  residentId: '',
  visitDate: nowDate(),
  visitTime: nowTime(),
  expectedReturnTime: nowDateTime(),
  actualReturnTime: '',
  reason: '',
  companion: '',
  companionPhone: '',
  approver: '',
  remarks: ''
})

// 表单验证规则
const rules = {
  residentId: [{ required: true, message: '请选择老人', trigger: 'change' }],
  visitDate: [{ required: true, message: '请选择外出日期', trigger: 'change' }],
  visitTime: [{ required: true, message: '请选择外出时间', trigger: 'change' }],
  expectedReturnTime: [{ required: true, message: '请选择预计返回时间', trigger: 'change' }],
  reason: [{ required: true, message: '请选择外出事由', trigger: 'change' }],
  companion: [{ required: true, message: '请选择陪同人员', trigger: 'change' }],
  approver: [{ required: true, message: '请输入批准人', trigger: 'blur' }]
}

// 获取外出事由标签样式
const getReasonTagType = (reason) => {
  const typeMap = {
    '回家探亲': 'primary',
    '医院就诊': 'success',
    '外出购物': 'warning',
    '参加活动': 'danger',
    '办理事务': 'info',
    '旅游': 'primary',
    '其他': 'success'
  }
  return typeMap[reason] || 'info'
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
    if (residentsResponse.code === 0) {
      residentsOptions.value = residentsResponse.data.list;
    }
  } catch (error) {
    console.error('加载选项数据失败:', error)
  }
}

// 获取外出记录列表
const getList = async () => {
  loading.value = true
  try {
    const response = await getVisitRecordsList(queryParams)
    //  const response = await getLeaveRecordsList(queryParams)
    if (response.code === 0) {
      leaveRecordsList.value = response.data.list
      total.value = response.data.totalCount
    }
  } catch (error) {
    console.error('获取外出记录列表失败:', error)
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
  title.value = '添加外出记录'
}

// 修改按钮操作
const handleUpdate = (row) => {
  resetForm()
  const recordId = row.id || ids.value[0]
  // 这里应该调用获取详情的API，暂时直接使用行数据
  Object.assign(form, row)
  open.value = true
  title.value = '修改外出记录'
}

// 删除按钮操作
const handleDelete = async (row) => {
  const recordIds = row.id ? [row.id] : ids.value
  if (!recordIds.length) {
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
    for (const id of recordIds) {
      await deleteVisitRecord(id)
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
    visitType:1,
    residentId: '',
    visitDate: nowDate(),
    visitTime: nowTime(),
    expectedReturnTime: nowDateTime(),
    actualReturnTime: '',
    reason: '',
    companion: '',
    companionPhone: '',
    approver: '',
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
          await updateVisitRecord(form)
          ElMessage.success('修改成功')
        } else {
          await addVisitRecord(form)
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
.leave-records-management {
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