<template>
  <div class="app-container">
    <el-form :model="queryParams" ref="queryRef" :inline="true" v-show="showSearch" label-width="68px">
      <el-form-item label="计划名称" prop="planName">
        <el-input v-model="queryParams.planName" placeholder="计划名称" clearable style="width: 160px" @keyup.enter="handleQuery" />
      </el-form-item>
      <el-form-item label="计划类型" prop="planType">
        <el-select v-model="queryParams.planType" placeholder="全部" clearable style="width: 130px">
          <el-option :value="1" label="探访计划" />
          <el-option :value="2" label="巡访计划" />
        </el-select>
      </el-form-item>
      <el-form-item label="频次" prop="frequencyType">
        <el-select v-model="queryParams.frequencyType" placeholder="全部" clearable style="width: 120px">
          <el-option v-for="o in LEDGER_PLAN_FREQUENCY_OPTIONS" :key="o.value" :label="o.label" :value="o.value" />
        </el-select>
      </el-form-item>
      <el-form-item label="状态" prop="state">
        <el-select v-model="queryParams.state" placeholder="全部" clearable style="width: 110px">
          <el-option :value="1" label="启用" />
          <el-option :value="0" label="停用" />
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" icon="Search" @click="handleQuery">搜索</el-button>
        <el-button icon="Refresh" @click="resetQuery">重置</el-button>
      </el-form-item>
    </el-form>

    <el-row :gutter="10" class="mb8">
      <el-col :span="1.5"><el-button type="primary" plain icon="Plus" @click="handleAdd" v-hasPermi="['ledger:plan:add']">新增计划</el-button></el-col>
      <el-col :span="1.5"><el-button type="danger" plain icon="Delete" :disabled="multiple" @click="handleDelete()" v-hasPermi="['ledger:plan:remove']">删除</el-button></el-col>
      <right-toolbar v-model:showSearch="showSearch" @queryTable="getList" />
    </el-row>

    <el-table v-loading="loading" :data="planList" @selection-change="handleSelectionChange">
      <el-table-column type="selection" width="50" align="center" />
      <el-table-column label="计划名称" prop="planName" min-width="150" show-overflow-tooltip />
      <el-table-column label="类型" width="100" align="center">
        <template #default="{ row }">{{ row.planType === 2 ? '巡访计划' : '探访计划' }}</template>
      </el-table-column>
      <el-table-column label="目标老人类型" min-width="150" show-overflow-tooltip>
        <template #default="{ row }">{{ mapCsv(row.elderTypes, elderTypeOptions) }}</template>
      </el-table-column>
      <el-table-column label="照护等级" min-width="120" show-overflow-tooltip>
        <template #default="{ row }">{{ mapCsv(row.careLevels, CARE_LEVEL_OPTIONS) }}</template>
      </el-table-column>
      <el-table-column label="风险" width="80" align="center">
        <template #default="{ row }">{{ row.riskLevel ? getLedgerRiskLevelName(row.riskLevel) : '全部' }}</template>
      </el-table-column>
      <el-table-column label="频次" width="110" align="center">
        <template #default="{ row }">{{ getLedgerPlanFrequencyName(row.frequencyType) }}×{{ row.frequencyTimes || 1 }}</template>
      </el-table-column>
      <el-table-column label="自动指派" width="100" align="center">
        <template #default="{ row }">{{ empName(row.autoAssignEmployeeId) || '待分配' }}</template>
      </el-table-column>
      <el-table-column label="下次生成" width="150" align="center">
        <template #default="{ row }">{{ parseTime(row.nextGenTime, '{y}-{m}-{d} {h}:{i}') || '-' }}</template>
      </el-table-column>
      <el-table-column label="状态" width="80" align="center">
        <template #default="{ row }"><el-tag :type="row.state === 1 ? 'success' : 'info'" size="small">{{ row.state === 1 ? '启用' : '停用' }}</el-tag></template>
      </el-table-column>
      <el-table-column label="操作" width="250" align="center" fixed="right">
        <template #default="{ row }">
          <el-button link type="success" icon="Refresh" @click="handleGenerate(row)" v-hasPermi="['ledger:plan:edit']">立即生成</el-button>
          <el-button link type="primary" icon="Edit" @click="handleUpdate(row)" v-hasPermi="['ledger:plan:edit']">修改</el-button>
          <el-button link type="danger" icon="Delete" @click="handleDelete(row)" v-hasPermi="['ledger:plan:remove']">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <pagination v-show="total > 0" :total="total" v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize" @pagination="getList" />

    <el-dialog :title="title" v-model="open" width="680px" append-to-body>
      <el-form ref="planRef" :model="form" :rules="rules" label-width="110px">
        <el-row>
          <el-col :span="12"><el-form-item label="计划名称" prop="planName"><el-input v-model="form.planName" placeholder="请输入计划名称" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="计划类型" prop="planType">
            <el-select v-model="form.planType" style="width:100%"><el-option :value="1" label="探访计划" /><el-option :value="2" label="巡访计划" /></el-select>
          </el-form-item></el-col>
          <el-col :span="24"><el-form-item label="目标老人类型" prop="elderTypeArr">
            <el-select v-model="form.elderTypeArr" multiple collapse-tags collapse-tags-tooltip placeholder="留空为全部老人" style="width:100%">
              <el-option v-for="d in elderTypeOptions" :key="d.value" :label="d.label" :value="d.value" />
            </el-select>
          </el-form-item></el-col>
          <el-col :span="24"><el-form-item label="目标照护等级" prop="careLevelArr">
            <el-select v-model="form.careLevelArr" multiple collapse-tags collapse-tags-tooltip placeholder="留空为全部等级" style="width:100%">
              <el-option v-for="o in CARE_LEVEL_OPTIONS" :key="o.value" :label="o.label" :value="o.value" />
            </el-select>
          </el-form-item></el-col>
          <el-col :span="12"><el-form-item label="目标风险等级" prop="riskLevel">
            <el-select v-model="form.riskLevel" placeholder="留空为全部" clearable style="width:100%">
              <el-option v-for="o in LEDGER_RISK_LEVEL_OPTIONS" :key="o.value" :label="o.label" :value="o.value" />
            </el-select>
          </el-form-item></el-col>
          <el-col :span="12"><el-form-item label="生成工单类型" prop="defaultVisitType">
            <el-select v-model="form.defaultVisitType" placeholder="请选择" style="width:100%">
              <el-option v-for="o in LEDGER_VISIT_TYPE_OPTIONS" :key="o.value" :label="o.label" :value="o.value" />
            </el-select>
          </el-form-item></el-col>
          <el-col :span="12"><el-form-item label="频次周期" prop="frequencyType">
            <el-select v-model="form.frequencyType" style="width:100%">
              <el-option v-for="o in LEDGER_PLAN_FREQUENCY_OPTIONS" :key="o.value" :label="o.label" :value="o.value" />
            </el-select>
          </el-form-item></el-col>
          <el-col :span="12"><el-form-item label="周期内次数" prop="frequencyTimes"><el-input-number v-model="form.frequencyTimes" :min="1" :max="31" controls-position="right" style="width:100%" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="自动指派" prop="autoAssignEmployeeId">
            <el-select v-model="form.autoAssignEmployeeId" filterable clearable placeholder="留空生成待分配工单" style="width:100%">
              <el-option v-for="e in employeeOptions" :key="e.id" :label="e.name" :value="e.id" />
            </el-select>
          </el-form-item></el-col>
          <el-col :span="12"><el-form-item label="状态" prop="state">
            <el-radio-group v-model="form.state"><el-radio :value="1">启用</el-radio><el-radio :value="0">停用</el-radio></el-radio-group>
          </el-form-item></el-col>
          <el-col :span="24"><el-form-item label="备注" prop="remark"><el-input v-model="form.remark" type="textarea" :rows="2" placeholder="备注" /></el-form-item></el-col>
        </el-row>
      </el-form>
      <template #footer><div class="dialog-footer"><el-button type="primary" @click="submitForm">确 定</el-button><el-button @click="open = false">取 消</el-button></div></template>
    </el-dialog>
  </div>
</template>

<script setup name="LedgerPlan">
import { listPlan, getPlan, submitPlan, deletePlan, generatePlan, getDictData } from '@/api/care/ledger'
import { getAllEmployees } from '@/api/care/employee'
import {
  CARE_LEVEL_OPTIONS, LEDGER_VISIT_TYPE_OPTIONS, LEDGER_PLAN_FREQUENCY_OPTIONS, LEDGER_RISK_LEVEL_OPTIONS,
  getLedgerPlanFrequencyName, getLedgerRiskLevelName,
} from '@/utils/careEnums'

const { proxy } = getCurrentInstance()
const parseTime = proxy.parseTime

const planList = ref([])
const loading = ref(true)
const showSearch = ref(true)
const total = ref(0)
const title = ref('')
const open = ref(false)
const ids = ref([])
const multiple = ref(true)
const elderTypeOptions = ref([])
const employeeOptions = ref([])

const data = reactive({
  form: { elderTypeArr: [], careLevelArr: [] },
  queryParams: { pageNum: 1, pageSize: 10, planName: undefined, planType: undefined, frequencyType: undefined, state: undefined },
  rules: {
    planName: [{ required: true, message: '请输入计划名称', trigger: 'blur' }],
    planType: [{ required: true, message: '请选择计划类型', trigger: 'change' }],
    frequencyType: [{ required: true, message: '请选择频次周期', trigger: 'change' }],
    defaultVisitType: [{ required: true, message: '请选择生成工单类型', trigger: 'change' }],
  },
})
const { queryParams, form, rules } = toRefs(data)

function csvToArr(csv) { return csv ? String(csv).split(',').filter(Boolean) : [] }
function mapCsv(csv, options) {
  if (!csv) return '全部'
  const dict = {}
  options.forEach(o => (dict[o.value] = o.label))
  return csvToArr(csv).map(v => dict[v] != null ? dict[v] : v).join('、') || '全部'
}
function empName(id) { const e = employeeOptions.value.find(x => x.id === id); return e ? e.name : '' }

function loadRefs() {
  getDictData('ledger_elder_type').then(res => { elderTypeOptions.value = (res.data || []).map(d => ({ value: d.dictValue, label: d.dictLabel })) })
  getAllEmployees().then(res => { employeeOptions.value = res.data || res.rows || [] })
}

function getList() {
  loading.value = true
  listPlan(queryParams.value).then(res => {
    const d = res.data || res
    planList.value = d.list || []
    total.value = d.totalCount || 0
    loading.value = false
  }).catch(() => { loading.value = false })
}
function handleQuery() { queryParams.value.pageNum = 1; getList() }
function resetQuery() { proxy.resetForm('queryRef'); handleQuery() }
function handleSelectionChange(sel) { ids.value = sel.map(i => i.id); multiple.value = !sel.length }

function reset() { form.value = { elderTypeArr: [], careLevelArr: [], planType: 1, frequencyType: 2, frequencyTimes: 1, state: 1 }; proxy.resetForm('planRef') }
function handleAdd() { reset(); open.value = true; title.value = '新增巡访计划' }
function handleUpdate(row) {
  reset()
  getPlan(row.id).then(res => {
    const f = res.data || res
    f.elderTypeArr = csvToArr(f.elderTypes)
    f.careLevelArr = csvToArr(f.careLevels)
    form.value = f
    open.value = true; title.value = '修改巡访计划'
  })
}
function submitForm() {
  proxy.$refs.planRef.validate(valid => {
    if (!valid) return
    const payload = {
      ...form.value,
      elderTypes: (form.value.elderTypeArr || []).join(','),
      careLevels: (form.value.careLevelArr || []).join(','),
    }
    delete payload.elderTypeArr; delete payload.careLevelArr
    submitPlan(payload).then(() => { proxy.$modal.msgSuccess('保存成功'); open.value = false; getList() })
  })
}
function handleDelete(row) {
  const delIds = row && row.id ? [row.id] : ids.value
  proxy.$modal.confirm('确认删除所选计划？').then(() => deletePlan(delIds)).then(() => { getList(); proxy.$modal.msgSuccess('删除成功') }).catch(() => {})
}
function handleGenerate(row) {
  proxy.$modal.confirm('立即按该计划生成到期探访工单？').then(() => generatePlan(row.id)).then(res => {
    proxy.$modal.msgSuccess('生成工单 ' + (res.data || 0) + ' 条'); getList()
  }).catch(() => {})
}

onMounted(() => { loadRefs(); getList() })
</script>
