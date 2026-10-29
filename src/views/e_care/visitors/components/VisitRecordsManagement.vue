<template>
  <div class="visit-records-management">
    <!-- 搜索和操作区域 -->
    <el-card class="mb-4" shadow="hover">
      <el-form :model="queryParams" ref="queryFormRef" :inline="true" label-width="80px">
        <el-form-item label="来访者" prop="visitorName">
          <el-input
            v-model="queryParams.visitorName"
            placeholder="请输入来访者姓名"
            clearable
            style="width: 200px"
            @keyup.enter="handleQuery"
          />
        </el-form-item>
        <el-form-item label="老人名字" prop="residentName">
          <el-input
            v-model="queryParams.residentName"
            placeholder="请输入老人名字"
            clearable
            style="width: 200px"
            @keyup.enter="handleQuery"
          />
        </el-form-item>
        <el-form-item label="来访日期" prop="visitDate">
          <el-date-picker
            v-model="queryParams.visitDate"
            type="date"
            placeholder="选择来访日期"
            style="width: 200px"
            value-format="YYYY-MM-DD"
          />
        </el-form-item>
        <el-form-item label="来访目的" prop="purpose">
          <el-select v-model="queryParams.purpose" placeholder="请选择来访目的" clearable style="width: 200px">
            <el-option
              v-for="item in purposeOptions"
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
          <el-button type="primary" icon="plus" @click="handleAdd" round>新增来访记录</el-button>
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
        :data="visitRecordsList"
        @selection-change="handleSelectionChange"
        @sort-change="handleSortChange"
      >
        <el-table-column type="selection" width="55" align="center" />
        <el-table-column label="记录ID" align="center" prop="id" width="80" />
        <el-table-column label="来访者" align="center" prop="visitorName" />
        <el-table-column label="老人" align="center" prop="residentName" >
          <template #default="scope">
            {{ scope.row.residentName || getResidentName(scope.row.residentId) }}
          </template>
        </el-table-column>
        <el-table-column label="来访日期" align="center" prop="visitDate" />
        <el-table-column label="来访时间" align="center" prop="visitTime" width="100" />
        <el-table-column label="离开时间" align="center" prop="leaveTime" width="100">
          <template #default="scope">
            {{ scope.row.leaveTime || '未离开' }}
          </template>
        </el-table-column>
        <el-table-column label="来访目的" align="center" prop="purpose" width="120">
          <template #default="scope">
            <el-tag :type="getPurposeTagType(scope.row.purpose)">
              {{ scope.row.purpose }}
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

    <!-- 添加或修改来访记录对话框 -->
    <el-dialog :title="title" v-model="open" width="600px" append-to-body>
      <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
         <el-form-item label="来访者" prop="visitorName">
          <el-input
            v-model="form.visitorName"
            placeholder="请输入来访者名称"
          />
        </el-form-item>
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
         <el-form-item label="关系" prop="relationship">
          <el-input
            v-model="form.relationship"
            placeholder="请输入来访者关系"
          />
        </el-form-item>
        <el-form-item label="联系电话" prop="phone">
          <el-input
            v-model="form.phone"
            placeholder="请输入来访者联系电话"
          />
        </el-form-item>
        <el-form-item label="来访日期" prop="visitDate">
          <el-date-picker
            v-model="form.visitDate"
            type="date"
            placeholder="选择来访日期"
            style="width: 100%"
            value-format="YYYY-MM-DD"
          />
        </el-form-item>
        <el-form-item label="来访时间" prop="visitTime">
          <el-time-picker
            v-model="form.visitTime"
            placeholder="选择来访时间"
            style="width: 100%"
            value-format="HH:mm:ss"
          />
        </el-form-item>
        <el-form-item label="离开时间" prop="leaveTime">
          <el-time-picker
            v-model="form.leaveTime"
            placeholder="选择离开时间"
            style="width: 100%"
            value-format="HH:mm:ss"
          />
        </el-form-item>
        <el-form-item label="来访目的" prop="purpose">
          <el-select v-model="form.purpose" placeholder="请选择来访目的" style="width: 100%">
            <el-option
              v-for="purpose in purposeOptions"
              :key="purpose"
              :label="purpose"
              :value="purpose"
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
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getVisitRecordsList, addVisitRecord, updateVisitRecord, deleteVisitRecord } from '@/api/care/visitors'
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

// 来访记录列表
const visitRecordsList = ref([])

// 选项数据
const visitorsOptions = ref([])
const residentsOptions = ref([])

// 来访目的选项
const purposeOptions = ['探望老人', '送物品', '办理手续', '咨询信息', '节日探望', '日常探望', '紧急事务', '其他']

// 当前时间格式化（新增记录时默认日期/时间）
const pad2 = (n) => String(n).padStart(2, '0')
const nowDate = () => { const d = new Date(); return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}` }
const nowTime = () => { const d = new Date(); return `${pad2(d.getHours())}:${pad2(d.getMinutes())}:${pad2(d.getSeconds())}` }

// 查询参数
const queryParams = reactive({
  pageNum: 1,
  pageSize: 10,
   visitType:0,
  visitorName: undefined,
  residentId: undefined,
  visitDate: undefined,
  purpose: undefined
})

// 表单数据
const form = reactive({
  id: undefined,
  visitType:0,
  visitorId: '',
  visitorName: '',
  residentId: '',
  relationship: '',
  phone: '',
  idCard: '',
  visitDate: nowDate(),
  visitTime: nowTime(),
  leaveTime: '',
  purpose: '',
  remarks: ''
})

// 表单验证规则
const rules = {
  visitorName: [{ required: true, message: '请选择来访者', trigger: 'change' }],
  residentId: [{ required: true, message: '请选择老人', trigger: 'change' }],
  visitDate: [{ required: true, message: '请选择来访日期', trigger: 'change' }],
  visitTime: [{ required: true, message: '请选择来访时间', trigger: 'change' }],
  purpose: [{ required: true, message: '请选择来访目的', trigger: 'change' }]
}

// 获取来访目的标签样式
const getPurposeTagType = (purpose) => {
  const typeMap = {
    '探望老人': 'primary',
    '送物品': 'success',
    '办理手续': 'warning',
    '咨询信息': 'danger',
    '节日探望': 'info',
    '日常探望': 'primary',
    '紧急事务': 'success',
    '其他': 'warning'
  }
  return typeMap[purpose] || 'info'
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
      residentsOptions.value = residentsResponse.data.list
    }
  } catch (error) {
    console.error('加载选项数据失败:', error)
  }
}

// 获取来访记录列表
const getList = async () => {
  loading.value = true
  try {
    const response = await getVisitRecordsList(queryParams)
    if (response.code === 0) {
      visitRecordsList.value = response.data.list
      total.value = response.data.totalCount
    }
  } catch (error) {
    console.error('获取来访记录列表失败:', error)
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
  title.value = '添加来访记录'
}

// 修改按钮操作
const handleUpdate = (row) => {
  resetForm()
  const recordId = row.id || ids.value[0]
  // 这里应该调用获取详情的API，暂时直接使用行数据
  Object.assign(form, row)
  open.value = true
  title.value = '修改来访记录'
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
    visitType:0,
    visitorId: '',
    visitorName: '',
    residentId: '',
    relationship: '',
    phone: '',
    idCard: '',
    visitDate: nowDate(),
    visitTime: nowTime(),
    leaveTime: '',
    purpose: '',
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
.visit-records-management {
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