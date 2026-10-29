<template>
  <div class="app-container">
    <el-form :model="queryParams" ref="queryRef" :inline="true" v-show="showSearch" label-width="68px">
      <el-form-item label="姓名" prop="name">
        <el-input v-model="queryParams.name" placeholder="请输入姓名" clearable style="width: 160px" @keyup.enter="handleQuery" />
      </el-form-item>
      <el-form-item label="老人类型" prop="elderType">
        <el-select v-model="queryParams.elderType" placeholder="全部" clearable style="width: 160px">
          <el-option v-for="d in elderTypeOptions" :key="d.value" :label="d.label" :value="d.value" />
        </el-select>
      </el-form-item>
      <el-form-item label="照护等级" prop="careLevel">
        <el-select v-model="queryParams.careLevel" placeholder="全部" clearable style="width: 130px">
          <el-option v-for="o in CARE_LEVEL_OPTIONS" :key="o.value" :label="o.label" :value="o.value" />
        </el-select>
      </el-form-item>
      <el-form-item label="风险等级" prop="riskLevel">
        <el-select v-model="queryParams.riskLevel" placeholder="全部" clearable style="width: 120px">
          <el-option v-for="o in LEDGER_RISK_LEVEL_OPTIONS" :key="o.value" :label="o.label" :value="o.value" />
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" icon="Search" @click="handleQuery">搜索</el-button>
        <el-button icon="Refresh" @click="resetQuery">重置</el-button>
      </el-form-item>
    </el-form>

    <el-row :gutter="10" class="mb8">
      <el-col :span="1.5">
        <el-button type="primary" plain icon="Plus" @click="handleAdd" v-hasPermi="['ledger:elder:add']">新增</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button type="danger" plain icon="Delete" :disabled="multiple" @click="handleDelete" v-hasPermi="['ledger:elder:remove']">删除</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button type="warning" plain icon="Download" @click="handleExport" v-hasPermi="['ledger:elder:export']">导出</el-button>
      </el-col>
      <right-toolbar v-model:showSearch="showSearch" @queryTable="getList" />
    </el-row>

    <el-table v-loading="loading" :data="elderList" @selection-change="handleSelectionChange">
      <el-table-column type="selection" width="50" align="center" />
      <el-table-column label="编号" prop="elderNo" width="130" show-overflow-tooltip />
      <el-table-column label="姓名" prop="name" min-width="90" />
      <el-table-column label="性别" min-width="60" align="center">
        <template #default="{ row }">{{ row.gender === 1 ? '男' : row.gender === 2 ? '女' : '-' }}</template>
      </el-table-column>
      <el-table-column label="年龄" min-width="60" align="center">
        <template #default="{ row }">{{ calcAge(row.birthday) }}</template>
      </el-table-column>
      <el-table-column label="电话" prop="phone" min-width="120" show-overflow-tooltip />
      <el-table-column label="老人类型" min-width="160" show-overflow-tooltip>
        <template #default="{ row }">{{ mapElderTypes(row.elderTypes) }}</template>
      </el-table-column>
      <el-table-column label="照护等级" width="90" align="center">
        <template #default="{ row }">{{ getCareLevelName(row.careLevel) }}</template>
      </el-table-column>
      <el-table-column label="风险" width="80" align="center">
        <template #default="{ row }">
          <el-tag :type="getLedgerRiskLevelTag(row.riskLevel)" size="small">{{ getLedgerRiskLevelName(row.riskLevel) }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="来源" width="90" align="center">
        <template #default="{ row }">{{ getLedgerElderSourceName(row.elderSource) }}</template>
      </el-table-column>
      <el-table-column label="状态" width="80" align="center">
        <template #default="{ row }">
          <el-tag :type="getLedgerElderStateTag(row.state)" size="small">{{ getLedgerElderStateName(row.state) }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="280" align="center" fixed="right">
        <template #default="{ row }">
          <el-button link type="primary" icon="View" @click="handleDetail(row)" v-hasPermi="['ledger:elder:query']">详情</el-button>
          <el-button link type="primary" icon="Edit" @click="handleUpdate(row)" v-hasPermi="['ledger:elder:edit']">修改</el-button>
          <el-button link type="danger" icon="Delete" @click="handleDelete(row)" v-hasPermi="['ledger:elder:remove']">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <pagination v-show="total > 0" :total="total" v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize" @pagination="getList" />

    <!-- 添加或修改 -->
    <el-dialog :title="title" v-model="open" width="820px" append-to-body>
      <el-form ref="elderRef" :model="form" :rules="rules" label-width="90px">
        <el-divider content-position="left">基本信息</el-divider>
        <el-row>
          <el-col :span="8"><el-form-item label="姓名" prop="name"><el-input v-model="form.name" placeholder="请输入姓名" /></el-form-item></el-col>
          <el-col :span="8"><el-form-item label="编号" prop="elderNo"><el-input v-model="form.elderNo" placeholder="留空系统生成" /></el-form-item></el-col>
          <el-col :span="8"><el-form-item label="性别" prop="gender">
            <el-radio-group v-model="form.gender"><el-radio :value="1">男</el-radio><el-radio :value="2">女</el-radio></el-radio-group>
          </el-form-item></el-col>
          <el-col :span="8"><el-form-item label="出生日期" prop="birthday"><el-date-picker v-model="form.birthday" type="date" value-format="YYYY-MM-DD" placeholder="选择日期" style="width:100%" /></el-form-item></el-col>
          <el-col :span="8"><el-form-item label="民族" prop="nation"><el-input v-model="form.nation" placeholder="如：汉族" /></el-form-item></el-col>
          <el-col :span="8"><el-form-item label="联系电话" prop="phone"><el-input v-model="form.phone" placeholder="请输入电话" /></el-form-item></el-col>
          <el-col :span="8"><el-form-item label="身份证号" prop="idCard"><el-input v-model="form.idCard" placeholder="请输入身份证号" /></el-form-item></el-col>
          <el-col :span="16"><el-form-item label="居住地址" prop="address"><el-input v-model="form.address" placeholder="请输入居住地址" /></el-form-item></el-col>
        </el-row>

        <el-divider content-position="left">评估信息</el-divider>
        <el-row>
          <el-col :span="12"><el-form-item label="老人类型" prop="elderTypeArr">
            <el-select v-model="form.elderTypeArr" multiple collapse-tags collapse-tags-tooltip placeholder="可多选" style="width:100%">
              <el-option v-for="d in elderTypeOptions" :key="d.value" :label="d.label" :value="d.value" />
            </el-select>
          </el-form-item></el-col>
          <el-col :span="6"><el-form-item label="照护等级" prop="careLevel">
            <el-select v-model="form.careLevel" placeholder="请选择" style="width:100%">
              <el-option v-for="o in CARE_LEVEL_OPTIONS" :key="o.value" :label="o.label" :value="o.value" />
            </el-select>
          </el-form-item></el-col>
          <el-col :span="6"><el-form-item label="风险等级" prop="riskLevel">
            <el-select v-model="form.riskLevel" placeholder="请选择" style="width:100%">
              <el-option v-for="o in LEDGER_RISK_LEVEL_OPTIONS" :key="o.value" :label="o.label" :value="o.value" />
            </el-select>
          </el-form-item></el-col>
          <el-col :span="8"><el-form-item label="自理能力" prop="selfCareAbility">
            <el-select v-model="form.selfCareAbility" placeholder="请选择" clearable style="width:100%">
              <el-option v-for="o in SELF_CARE_OPTIONS" :key="o.value" :label="o.label" :value="o.value" />
            </el-select>
          </el-form-item></el-col>
          <el-col :span="8"><el-form-item label="认知状况" prop="cognitiveStatus">
            <el-select v-model="form.cognitiveStatus" placeholder="请选择" clearable style="width:100%">
              <el-option v-for="o in COGNITIVE_OPTIONS" :key="o.value" :label="o.label" :value="o.value" />
            </el-select>
          </el-form-item></el-col>
          <el-col :span="8"><el-form-item label="跌倒风险" prop="fallRisk">
            <el-select v-model="form.fallRisk" placeholder="请选择" clearable style="width:100%">
              <el-option v-for="o in FALL_RISK_OPTIONS" :key="o.value" :label="o.label" :value="o.value" />
            </el-select>
          </el-form-item></el-col>
          <el-col :span="8"><el-form-item label="ADL评分" prop="adlScore"><el-input-number v-model="form.adlScore" :min="0" :max="100" controls-position="right" style="width:100%" /></el-form-item></el-col>
          <el-col :span="8"><el-form-item label="帮扶人" prop="helperName"><el-input v-model="form.helperName" placeholder="帮扶责任人姓名" /></el-form-item></el-col>
          <el-col :span="8"><el-form-item label="所属片区" prop="areaName"><el-input v-model="form.areaName" placeholder="如：东街片区" /></el-form-item></el-col>
          <el-col :span="24"><el-form-item label="慢性病" prop="chronicDisease"><el-input v-model="form.chronicDisease" type="textarea" :rows="2" placeholder="慢性病情况" /></el-form-item></el-col>
          <el-col :span="24"><el-form-item label="健康状况" prop="healthStatus"><el-input v-model="form.healthStatus" type="textarea" :rows="2" placeholder="健康状况说明" /></el-form-item></el-col>
        </el-row>

        <el-divider content-position="left">档案状态</el-divider>
        <el-row>
          <el-col :span="8"><el-form-item label="档案状态" prop="state">
            <el-select v-model="form.state" style="width:100%"><el-option v-for="o in LEDGER_ELDER_STATE_OPTIONS" :key="o.value" :label="o.label" :value="o.value" /></el-select>
          </el-form-item></el-col>
          <el-col :span="16"><el-form-item label="备注" prop="remark"><el-input v-model="form.remark" placeholder="备注" /></el-form-item></el-col>
        </el-row>
      </el-form>
      <template #footer><div class="dialog-footer"><el-button type="primary" @click="submitForm">确 定</el-button><el-button @click="cancel">取 消</el-button></div></template>
    </el-dialog>

    <!-- 详情 -->
    <el-drawer :title="'老人档案 - ' + detail.name" v-model="detailOpen" size="46%">
      <el-descriptions :column="2" border>
        <el-descriptions-item label="姓名">{{ detail.name }}</el-descriptions-item>
        <el-descriptions-item label="编号">{{ detail.elderNo }}</el-descriptions-item>
        <el-descriptions-item label="性别">{{ detail.gender === 1 ? '男' : '女' }}</el-descriptions-item>
        <el-descriptions-item label="年龄">{{ calcAge(detail.birthday) }}</el-descriptions-item>
        <el-descriptions-item label="电话">{{ detail.phone }}</el-descriptions-item>
        <el-descriptions-item label="身份证号">{{ detail.idCard }}</el-descriptions-item>
        <el-descriptions-item label="居住地址" :span="2">{{ detail.address }}</el-descriptions-item>
        <el-descriptions-item label="老人类型" :span="2">{{ mapElderTypes(detail.elderTypes) }}</el-descriptions-item>
        <el-descriptions-item label="照护等级">{{ getCareLevelName(detail.careLevel) }}</el-descriptions-item>
        <el-descriptions-item label="风险等级">{{ getLedgerRiskLevelName(detail.riskLevel) }}</el-descriptions-item>
        <el-descriptions-item label="自理能力">{{ enumName(SELF_CARE_OPTIONS, detail.selfCareAbility) }}</el-descriptions-item>
        <el-descriptions-item label="认知状况">{{ enumName(COGNITIVE_OPTIONS, detail.cognitiveStatus) }}</el-descriptions-item>
        <el-descriptions-item label="ADL评分">{{ detail.adlScore }}</el-descriptions-item>
        <el-descriptions-item label="帮扶人">{{ detail.helperName }}</el-descriptions-item>
        <el-descriptions-item label="慢性病" :span="2">{{ detail.chronicDisease }}</el-descriptions-item>
        <el-descriptions-item label="健康状况" :span="2">{{ detail.healthStatus }}</el-descriptions-item>
        <el-descriptions-item label="备注" :span="2">{{ detail.remark }}</el-descriptions-item>
      </el-descriptions>
    </el-drawer>
  </div>
</template>

<script setup name="LedgerElder">
import { listElder, getElder, submitElder, deleteElder, getDictData } from '@/api/care/ledger'
import {
  CARE_LEVEL_OPTIONS, SELF_CARE_OPTIONS, COGNITIVE_OPTIONS, FALL_RISK_OPTIONS, enumName, getCareLevelName,
  LEDGER_RISK_LEVEL_OPTIONS, LEDGER_ELDER_STATE_OPTIONS,
  getLedgerRiskLevelName, getLedgerRiskLevelTag, getLedgerElderSourceName, getLedgerElderStateName, getLedgerElderStateTag,
} from '@/utils/careEnums'

const { proxy } = getCurrentInstance()

const elderList = ref([])
const loading = ref(true)
const showSearch = ref(true)
const total = ref(0)
const title = ref('')
const open = ref(false)
const detailOpen = ref(false)
const detail = ref({})
const ids = ref([])
const multiple = ref(true)
const elderTypeOptions = ref([])

const data = reactive({
  form: { elderTypeArr: [] },
  queryParams: { pageNum: 1, pageSize: 10, name: undefined, elderType: undefined, careLevel: undefined, riskLevel: undefined },
  rules: {
    name: [{ required: true, message: '姓名不能为空', trigger: 'blur' }],
    careLevel: [{ required: true, message: '请选择照护等级', trigger: 'change' }],
  },
})
const { queryParams, form, rules } = toRefs(data)

/** csv(逗号串) -> 数组 */
function csvToArr(csv) {
  return csv ? String(csv).split(',').filter(s => s !== '') : []
}
function mapElderTypes(csv) {
  if (!csv) return '-'
  const dict = {}
  elderTypeOptions.value.forEach(o => (dict[o.value] = o.label))
  return csvToArr(csv).map(v => dict[v] || v).join('、')
}
function calcAge(birthday) {
  if (!birthday) return '-'
  const b = new Date(birthday)
  if (isNaN(b.getTime())) return '-'
  const now = new Date()
  let age = now.getFullYear() - b.getFullYear()
  if (now.getMonth() < b.getMonth() || (now.getMonth() === b.getMonth() && now.getDate() < b.getDate())) age--
  return age >= 0 ? age : '-'
}

function loadElderTypes() {
  getDictData('ledger_elder_type').then(res => {
    const list = (res && res.data) || []
    elderTypeOptions.value = list.map(d => ({ value: d.dictValue, label: d.dictLabel }))
  })
}

function getList() {
  loading.value = true
  listElder(queryParams.value).then(res => {
    const d = res.data || res
    elderList.value = d.list || []
    total.value = d.totalCount || 0
    loading.value = false
  }).catch(() => { loading.value = false })
}

function cancel() { open.value = false; reset() }
function reset() {
  form.value = { elderTypeArr: [], state: 1, gender: 1, elderSource: 1 }
  proxy.resetForm('elderRef')
}
function handleQuery() { queryParams.value.pageNum = 1; getList() }
function resetQuery() { proxy.resetForm('queryRef'); handleQuery() }
function handleSelectionChange(sel) { ids.value = sel.map(i => i.id); multiple.value = !sel.length }

function handleAdd() { reset(); open.value = true; title.value = '新增老人档案' }
function handleUpdate(row) {
  reset()
  getElder(row.id).then(res => {
    const f = res.data || res
    f.elderTypeArr = csvToArr(f.elderTypes)
    form.value = f
    open.value = true
    title.value = '修改老人档案'
  })
}
function handleDetail(row) {
  getElder(row.id).then(res => { detail.value = res.data || res; detailOpen.value = true })
}
function submitForm() {
  proxy.$refs.elderRef.validate(valid => {
    if (!valid) return
    const payload = { ...form.value, elderTypes: (form.value.elderTypeArr || []).join(',') }
    delete payload.elderTypeArr
    submitElder(payload).then(() => {
      proxy.$modal.msgSuccess('保存成功')
      open.value = false
      getList()
    })
  })
}
function handleDelete(row) {
  const delIds = row && row.id ? [row.id] : ids.value
  proxy.$modal.confirm('确认删除所选老人档案？').then(() => deleteElder(delIds)).then(() => { getList(); proxy.$modal.msgSuccess('删除成功') }).catch(() => {})
}
function handleExport() {
  proxy.download('/intra/care/ledger/elder/toExport', { ...queryParams.value }, `elder_${new Date().getTime()}.xlsx`)
}

onMounted(() => { loadElderTypes(); getList() })
</script>
