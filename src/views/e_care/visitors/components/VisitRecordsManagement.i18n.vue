<!-- 这是一个示例文件，展示如何在 VisitRecordsManagement 组件中集成国际化 -->
<template>
  <div class="visit-records-management-i18n-example">
    <!-- 搜索和操作区域 -->
    <el-card class="mb-4" shadow="hover">
      <el-form :model="queryParams" ref="queryFormRef" :inline="true" label-width="80px">
        <el-form-item :label="$t('visitors.visitorName')" prop="visitorName">
          <el-input
            v-model="queryParams.visitorName"
            :placeholder="$t('visitors.pleaseSelectVisitor')"
            clearable
            style="width: 200px"
            @keyup.enter="handleQuery"
          />
        </el-form-item>
        <el-form-item :label="$t('visitors.elderName')" prop="residentName">
          <el-input
            v-model="queryParams.residentName"
            :placeholder="$t('visitors.pleaseSelectElder')"
            clearable
            style="width: 200px"
            @keyup.enter="handleQuery"
          />
        </el-form-item>
        <el-form-item :label="$t('visitors.visitDate')" prop="visitDate">
          <el-date-picker
            v-model="queryParams.visitDate"
            type="date"
            :placeholder="$t('visitors.pleaseSelectVisitDate')"
            style="width: 200px"
            value-format="YYYY-MM-DD"
          />
        </el-form-item>
        <el-form-item :label="$t('visitors.purpose')" prop="purpose">
          <el-select v-model="queryParams.purpose" :placeholder="$t('visitors.pleaseSelectPurpose')" clearable style="width: 200px">
            <el-option
              v-for="item in purposeOptions"
              :key="item.value"
              :label="$t(`visitPurposes.${item.key}`)"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" icon="Search" @click="handleQuery" round>{{ $t('common.search') }}</el-button>
          <el-button icon="Refresh" @click="resetQuery" round>{{ $t('common.reset') }}</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 操作按钮区域 -->
    <el-card class="mb-4" shadow="hover">
      <el-row :gutter="10" class="mb-2">
        <el-col :span="16">
          <el-button type="primary" icon="Plus" @click="handleAdd" round>{{ $t('visitors.newVisitRecord') }}</el-button>
          <el-button type="success" icon="Edit" :disabled="single" @click="handleUpdate" round>{{ $t('common.edit') }}</el-button>
          <el-button type="danger" icon="Delete" :disabled="multiple" @click="handleDelete" round>{{ $t('common.delete') }}</el-button>
          <el-button type="warning" icon="Download" @click="handleExport" round>{{ $t('common.export') }}</el-button>
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
        <el-table-column :label="$t('common.operation')" align="center" prop="id" width="80" />
        <el-table-column :label="$t('visitors.visitorName')" align="center" prop="visitorName" />
        <el-table-column :label="$t('visitors.elder')" align="center" prop="residentName" />
        <el-table-column :label="$t('visitors.visitDate')" align="center" prop="visitDate" />
        <el-table-column :label="$t('visitors.visitTime')" align="center" prop="visitTime" width="100" />
        <el-table-column :label="$t('visitors.leaveTime')" align="center" prop="leaveTime" width="100">
          <template #default="scope">
            {{ scope.row.leaveTime || $t('visitors.notLeft') }}
          </template>
        </el-table-column>
        <el-table-column :label="$t('visitors.purpose')" align="center" prop="purpose" width="120">
          <template #default="scope">
            <el-tag :type="getPurposeTagType(scope.row.purpose)">
              {{ $t(`visitPurposes.${scope.row.purposeKey}`) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column :label="$t('common.remark')" align="center" prop="remarks" min-width="150" show-overflow-tooltip />
        <el-table-column :label="$t('common.createTime')" align="center" prop="createAt" width="160">
          <template #default="scope">
            <span>{{ parseTime(scope.row.createAt) }}</span>
          </template>
        </el-table-column>
        <el-table-column :label="$t('common.operation')" align="center" width="200" class-name="small-padding fixed-width">
          <template #default="scope">
            <el-button
               size="small"
              type="text"
              icon="Edit"
              @click="handleUpdate(scope.row)"
              round
            >{{ $t('common.edit') }}</el-button>
            <el-button
               size="small"
              type="text"
              icon="Delete"
              @click="handleDelete(scope.row)"
              round
            >{{ $t('common.delete') }}</el-button>
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
    <el-dialog :title="dialogTitle" v-model="open" width="600px" append-to-body>
      <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
        <el-form-item :label="$t('visitors.visitorName')" prop="visitorName">
          <el-input
            v-model="form.visitorName"
            :placeholder="$t('visitors.pleaseSelectVisitor')"
          />
        </el-form-item>
        <el-form-item :label="$t('visitors.elder')" prop="residentId">
          <el-select v-model="form.residentId" :placeholder="$t('visitors.pleaseSelectElder')" style="width: 100%">
            <el-option
              v-for="resident in residentsOptions"
              :key="resident.id"
              :label="`${resident.name} (${resident.residentNo})`"
              :value="resident.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item :label="$t('visitors.relationship')" prop="relationship">
          <el-input
            v-model="form.relationship"
            :placeholder="$t('visitors.pleaseInput')"
          />
        </el-form-item>
        <el-form-item :label="$t('visitors.visitDate')" prop="visit_date">
          <el-date-picker
            v-model="form.visitDate"
            type="date"
            :placeholder="$t('visitors.pleaseSelectVisitDate')"
            style="width: 100%"
            value-format="YYYY-MM-DD"
          />
        </el-form-item>
        <el-form-item :label="$t('visitors.visitTime')" prop="visit_time">
          <el-time-picker
            v-model="form.visitTime"
            :placeholder="$t('visitors.pleaseSelectVisitTime')"
            style="width: 100%"
            value-format="HH:mm:ss"
          />
        </el-form-item>
        <el-form-item :label="$t('visitors.purpose')" prop="purpose">
          <el-select v-model="form.purpose" :placeholder="$t('visitors.pleaseSelectPurpose')" style="width: 100%">
            <el-option
              v-for="purpose in purposeOptions"
              :key="purpose.value"
              :label="$t(`visitPurposes.${purpose.key}`)"
              :value="purpose.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item :label="$t('common.remark')" prop="remarks">
          <el-input
            v-model="form.remarks"
            type="textarea"
            :rows="3"
            :placeholder="$t('visitors.pleaseInputRemark')"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button type="primary" @click="submitForm" round>{{ $t('common.confirm') }}</el-button>
          <el-button @click="cancel" round>{{ $t('common.cancel') }}</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

// 组件引用
const queryFormRef = ref()
const formRef = ref()

// 响应式数据
const loading = ref(true)
const open = ref(false)
const total = ref(0)

// 来访记录列表
const visitRecordsList = ref([])
const residentsOptions = ref([])

// 来访目的选项（映射到国际化键值）
const purposeOptions = computed(() => [
  { key: 'visitElder', value: '探望老人' },
  { key: 'deliverItems', value: '送物品' },
  { key: 'handleProcedures', value: '办理手续' },
  { key: 'consultInfo', value: '咨询信息' },
  { key: 'holidayVisit', value: '节日探望' },
  { key: 'dailyVisit', value: '日常探望' },
  { key: 'urgentMatters', value: '紧急事务' },
  { key: 'other', value: '其他' }
])

// 查询参数
const queryParams = reactive({
  pageNum: 1,
  pageSize: 10,
  visitorName: undefined,
  residentId: undefined,
  visitDate: undefined,
  purpose: undefined
})

// 表单数据
const form = reactive({
  id: undefined,
  visitorName: '',
  residentId: '',
  visitDate: '',
  visitTime: '',
  purpose: '',
  remarks: ''
})

// 表单验证规则
const rules = {
  visitorName: [{ required: true, message: t('visitors.pleaseSelectVisitor'), trigger: 'change' }],
  residentId: [{ required: true, message: t('visitors.pleaseSelectElder'), trigger: 'change' }],
  visitDate: [{ required: true, message: t('visitors.pleaseSelectVisitDate'), trigger: 'change' }],
  visitTime: [{ required: true, message: t('visitors.pleaseSelectVisitTime'), trigger: 'change' }],
  purpose: [{ required: true, message: t('visitors.pleaseSelectPurpose'), trigger: 'change' }]
}

// 计算属性
const dialogTitle = computed(() => {
  return form.id ? t('visitors.editVisitRecord') : t('visitors.newVisitRecord')
})

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

// 模拟数据
const getList = async () => {
  loading.value = true
  try {
    // 模拟 API 调用
    await new Promise(resolve => setTimeout(resolve, 1000))
    visitRecordsList.value = []
    total.value = 0
  } catch (error) {
    console.error('获取来访记录列表失败:', error)
  } finally {
    loading.value = false
  }
}

const handleQuery = () => {
  queryParams.pageNum = 1
  getList()
}

const resetQuery = () => {
  queryFormRef.value.resetFields()
  handleQuery()
}

const handleSelectionChange = (selection) => {
  console.log('选择的数据:', selection)
}

const handleSortChange = (column) => {
  console.log('排序:', column)
}

const handleAdd = () => {
  Object.assign(form, {
    id: undefined,
    visitorName: '',
    residentId: '',
    visitDate: '',
    visitTime: '',
    purpose: '',
    remarks: ''
  })
  open.value = true
}

const handleUpdate = (row) => {
  Object.assign(form, row)
  open.value = true
}

const handleDelete = async (row) => {
  try {
    await ElMessageBox.confirm(t('visitors.confirmDelete'), t('common.warning'), {
      confirmButtonText: t('common.confirm'),
      cancelButtonText: t('common.cancel'),
      type: 'warning'
    })

    ElMessage.success(t('common.success'))
    getList()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除失败:', error)
      ElMessage.error(t('common.error'))
    }
  }
}

const handleExport = () => {
  ElMessage.info(t('common.info'))
}

const cancel = () => {
  open.value = false
}

const submitForm = async () => {
  if (!formRef.value) return
  
  await formRef.value.validate(async (valid) => {
    if (valid) {
      try {
        ElMessage.success(t('common.success'))
        open.value = false
        getList()
      } catch (error) {
        console.error('操作失败:', error)
        ElMessage.error(t('common.error'))
      }
    }
  })
}

onMounted(() => {
  getList()
})
</script>

<style scoped>
.visit-records-management-i18n-example {
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