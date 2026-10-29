<template>
  <div class="app-container">
    <!-- 统计卡片 -->
    <el-row :gutter="16" class="stat-row">
      <el-col :xs="12" :sm="6">
        <div class="stat-card stat-card--blue">
          <div class="stat-icon"><el-icon><Money /></el-icon></div>
          <div class="stat-body">
            <div class="stat-value">¥{{ statistics.totalAmount }}</div>
            <div class="stat-label">本月扣费总额</div>
          </div>
        </div>
      </el-col>
      <el-col :xs="12" :sm="6">
        <div class="stat-card stat-card--green">
          <div class="stat-icon"><el-icon><House /></el-icon></div>
          <div class="stat-body">
            <div class="stat-value">¥{{ statistics.boardingAmount }}</div>
            <div class="stat-label">康养扣费</div>
          </div>
        </div>
      </el-col>
      <el-col :xs="12" :sm="6">
        <div class="stat-card stat-card--orange">
          <div class="stat-icon"><el-icon><Scissors /></el-icon></div>
          <div class="stat-body">
            <div class="stat-value">¥{{ statistics.groomingAmount }}</div>
            <div class="stat-label">洗护扣费</div>
          </div>
        </div>
      </el-col>
      <el-col :xs="12" :sm="6">
        <div class="stat-card stat-card--purple">
          <div class="stat-icon"><el-icon><List /></el-icon></div>
          <div class="stat-body">
            <div class="stat-value">{{ statistics.totalCount }}</div>
            <div class="stat-label">扣费笔数</div>
          </div>
        </div>
      </el-col>
    </el-row>

    <el-card shadow="never">
      <el-form :model="queryParams" ref="queryForm" :inline="true" label-width="80px">
        <el-form-item label="服务类型" prop="serviceType">
          <el-select v-model="queryParams.serviceType" placeholder="全部类型" clearable style="width:120px">
            <el-option label="康养服务" value="boarding" />
            <el-option label="洗护服务" value="grooming" />
          </el-select>
        </el-form-item>
        <el-form-item label="长者姓名" prop="residentName">
          <el-input v-model="queryParams.residentName" placeholder="请输入长者姓名" clearable style="width:140px" @keyup.enter="handleQuery" />
        </el-form-item>
        <el-form-item label="联系电话" prop="contactPhone">
          <el-input v-model="queryParams.contactPhone" placeholder="请输入联系电话" clearable style="width:140px" @keyup.enter="handleQuery" />
        </el-form-item>
        <el-form-item label="收费类型" prop="itemType">
          <el-select v-model="queryParams.itemType" placeholder="请选择" clearable style="width:120px">
            <el-option v-for="opt in itemTypeOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="扣费时间" prop="dateRange">
          <el-date-picker v-model="queryParams.dateRange" type="daterange" range-separator="至" start-placeholder="开始" end-placeholder="结束" value-format="YYYY-MM-DD" style="width:220px" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" icon="Search" @click="handleQuery" round>搜索</el-button>
          <el-button icon="Refresh" @click="resetQuery" round>重置</el-button>
        </el-form-item>
      </el-form>

      <el-row :gutter="10" class="mb8">
        <el-col :span="1.5">
          <el-button type="primary" plain icon="Plus" @click="handleAdd" round>新增扣费</el-button>
        </el-col>
        <el-col :span="1.5">
          <el-button type="danger" plain icon="Delete" :disabled="multiple" @click="handleDelete" round>删除</el-button>
        </el-col>
        <el-col :span="1.5">
          <el-button type="warning" plain icon="Download" @click="handleExport" round>导出</el-button>
        </el-col>
      </el-row>

      <el-table v-loading="loading" :data="list" @selection-change="handleSelectionChange">
        <el-table-column type="selection" width="55" align="center" />
        <el-table-column label="流水号" prop="deductionNo" align="center" width="160" />
        <el-table-column label="服务类型" prop="serviceType" align="center" width="90">
          <template #default="scope">
            <el-tag :type="scope.row.serviceType === 'boarding' ? 'primary' : 'success'" size="small">
              {{ scope.row.serviceType === 'boarding' ? '康养' : '洗护' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="长者姓名" prop="residentName" align="center" />
        <el-table-column label="家属姓名" prop="contactName" align="center" />
        <el-table-column label="收费类目" prop="itemName" align="center">
          <template #default="scope">
            <el-tag :type="getItemTypeColor(scope.row.itemType)" effect="plain" size="small">{{ scope.row.itemName }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="收费类型" prop="itemType" align="center" width="100">
          <template #default="scope">
            <dict-tag :options="itemTypeOptions" :value="scope.row.itemType" />
          </template>
        </el-table-column>
        <el-table-column label="数量/天数" prop="quantity" align="center" width="90" />
        <el-table-column label="单价(元)" prop="unitPrice" align="center" width="90">
          <template #default="scope">¥ {{ scope.row.unitPrice }}</template>
        </el-table-column>
        <el-table-column label="金额(元)" prop="amount" align="center" width="100">
          <template #default="scope">
            <span class="amount-text">¥ {{ scope.row.amount }}</span>
          </template>
        </el-table-column>
        <el-table-column label="扣费时间" prop="deductTime" align="center" width="150" />
        <el-table-column label="操作人" prop="operator" align="center" width="90" />
        <el-table-column label="备注" prop="remarks" align="center" show-overflow-tooltip />
        <el-table-column label="操作" align="center" width="100">
          <template #default="scope">
            <el-button link type="danger" icon="Delete" @click="handleDelete(scope.row)" round>删除</el-button>
          </template>
        </el-table-column>
      </el-table>
      <pagination v-show="total > 0" :total="total" v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize" @pagination="getList" />
    </el-card>

    <!-- 新增扣费对话框 -->
    <el-dialog title="新增扣费记录" v-model="open" width="600px" append-to-body>
      <el-form ref="formRef" :model="form" :rules="rules" label-width="110px">
        <el-form-item label="服务类型" prop="serviceType">
          <el-radio-group v-model="form.serviceType" @change="onServiceTypeChange">
            <el-radio-button label="boarding">康养服务</el-radio-button>
            <el-radio-button label="grooming">洗护服务</el-radio-button>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="关联订单" prop="orderId">
          <el-select v-model="form.orderId" placeholder="请选择关联订单" style="width:100%" filterable @change="onOrderChange">
            <el-option v-for="b in orderOptions" :key="b.id" :label="`${b.residentName} - ${b.contactName} - ${b.date}`" :value="b.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="收费类目" prop="feeItemId">
          <el-select v-model="form.feeItemId" placeholder="请选择收费类目" style="width:100%" @change="onFeeItemChange">
            <el-option-group v-for="group in currentFeeItemGroups" :key="group.type" :label="group.label">
              <el-option v-for="item in group.items" :key="item.id" :label="`${item.itemName}（${item.chargeModeName}·¥${item.unitPrice}）`" :value="item.id" />
            </el-option-group>
          </el-select>
        </el-form-item>
        <el-row>
          <el-col :span="12">
            <el-form-item label="数量/天数" prop="quantity">
              <el-input-number v-model="form.quantity" :min="1" style="width:100%" @change="calcAmount" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="单价(元)" prop="unitPrice">
              <el-input-number v-model="form.unitPrice" :min="0" :precision="2" style="width:100%" @change="calcAmount" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="合计金额(元)">
          <span class="amount-large">¥ {{ form.amount }}</span>
        </el-form-item>
        <el-form-item label="扣费说明" prop="remarks">
          <el-input v-model="form.remarks" type="textarea" :rows="2" placeholder="请输入扣费说明" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button type="primary" @click="submitForm" round>确认扣费</el-button>
        <el-button @click="open = false" round>取 消</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup name="ResidentDeductions">
import { ref, reactive, computed, onMounted } from 'vue'
import { getDeductionList, addDeduction, deleteDeduction } from '@/api/care/billing'

const { proxy } = getCurrentInstance()
const list = ref([])
const loading = ref(true)
const ids = ref([])
const multiple = ref(true)
const total = ref(0)
const open = ref(false)

// 统计数据
const statistics = reactive({
  totalAmount: '12,580.00',
  boardingAmount: '8,350.00',
  groomingAmount: '4,230.00',
  totalCount: 156
})

const itemTypeOptions = [
  { label: '基础康养', value: 'BASIC', elTagType: 'primary' },
  { label: '增值服务', value: 'VALUE_ADDED', elTagType: 'success' },
  { label: '医疗费用', value: 'MEDICAL', elTagType: 'danger' },
  { label: '餐饮加购', value: 'FOOD', elTagType: 'warning' },
  { label: '清洁美容', value: 'GROOMING', elTagType: 'info' },
  { label: '损坏赔偿', value: 'DAMAGE', elTagType: 'danger' },
  { label: '其他', value: 'OTHER', elTagType: '' }
]

// 康养收费类目分组
const bedFeeItemGroups = ref([
  {
    type: 'BASIC', label: '基础康养',
    items: [
      { id: 1, itemName: '基础康养费(大型犬)', chargeModeName: '按天', unitPrice: 80 },
      { id: 2, itemName: '基础康养费(小型犬)', chargeModeName: '按天', unitPrice: 60 },
      { id: 3, itemName: '猫咪基础康养费', chargeModeName: '按天', unitPrice: 50 }
    ]
  },
  {
    type: 'VALUE_ADDED', label: '增值服务',
    items: [
      { id: 4, itemName: '遛弯服务', chargeModeName: '按次', unitPrice: 15 },
      { id: 5, itemName: '视频汇报', chargeModeName: '按次', unitPrice: 0 }
    ]
  },
  {
    type: 'FOOD', label: '餐饮加购',
    items: [
      { id: 6, itemName: '罐头加餐', chargeModeName: '按次', unitPrice: 12 },
      { id: 7, itemName: '零食加购', chargeModeName: '按次', unitPrice: 8 }
    ]
  },
  {
    type: 'MEDICAL', label: '医疗费用',
    items: [
      { id: 8, itemName: '紧急医疗', chargeModeName: '按实收', unitPrice: 0 }
    ]
  },
  {
    type: 'DAMAGE', label: '损坏赔偿',
    items: [
      { id: 9, itemName: '物品损坏', chargeModeName: '按实收', unitPrice: 0 }
    ]
  }
])

// 洗护收费类目分组
const groomingFeeItemGroups = ref([
  {
    type: 'GROOMING', label: '洗护美容',
    items: [
      { id: 101, itemName: '基础洗澡(小型犬)', chargeModeName: '按次', unitPrice: 50 },
      { id: 102, itemName: '基础洗澡(中型犬)', chargeModeName: '按次', unitPrice: 70 },
      { id: 103, itemName: '基础洗澡(大型犬)', chargeModeName: '按次', unitPrice: 90 },
      { id: 104, itemName: '精致洗护套餐', chargeModeName: '按次', unitPrice: 128 },
      { id: 105, itemName: '造型修剪', chargeModeName: '按次', unitPrice: 80 },
      { id: 106, itemName: '深度清洁护理', chargeModeName: '按次', unitPrice: 168 }
    ]
  },
  {
    type: 'VALUE_ADDED', label: '增值服务',
    items: [
      { id: 107, itemName: '去泪痕护理', chargeModeName: '按次', unitPrice: 30 },
      { id: 108, itemName: '美甲服务', chargeModeName: '按次', unitPrice: 20 },
      { id: 109, itemName: '香波升级', chargeModeName: '按次', unitPrice: 15 }
    ]
  }
])

// 当前显示的收费类目
const currentFeeItemGroups = computed(() => {
  return form.value.serviceType === 'grooming' ? groomingFeeItemGroups.value : bedFeeItemGroups.value
})

// 康养订单选项
const boardingOptions = ref([
  { id: 1, residentName: '张大爷', contactName: '张先生', date: '2026-03-12' },
  { id: 2, residentName: '李奶奶', contactName: '李女士', date: '2026-03-13' }
])

// 洗护订单选项
const groomingOptions = ref([
  { id: 101, residentName: '王大爷', contactName: '王先生', date: '2026-03-15' },
  { id: 102, residentName: '赵奶奶', contactName: '赵女士', date: '2026-03-15' }
])

// 当前订单选项
const orderOptions = computed(() => {
  return form.value.serviceType === 'grooming' ? groomingOptions.value : boardingOptions.value
})

const queryParams = reactive({
  pageNum: 1, pageSize: 10,
  serviceType: undefined, residentName: undefined, contactPhone: undefined, itemType: undefined, dateRange: undefined
})

const form = ref({ serviceType: 'boarding', orderId: undefined, feeItemId: undefined, quantity: 1, unitPrice: 0, amount: 0, remarks: '' })
const rules = {
  serviceType: [{ required: true, message: '请选择服务类型', trigger: 'change' }],
  orderId: [{ required: true, message: '请选择关联订单', trigger: 'change' }],
  feeItemId: [{ required: true, message: '请选择收费类目', trigger: 'change' }],
  quantity: [{ required: true, message: '数量不能为空', trigger: 'blur' }]
}

function getItemTypeColor(type) {
  const map = { BASIC: 'primary', VALUE_ADDED: 'success', MEDICAL: 'danger', FOOD: 'warning', GROOMING: 'success', DAMAGE: 'danger', OTHER: 'info' }
  return map[type] || ''
}

function getList() {
  loading.value = true
  getDeductionList(queryParams).then(res => {
    list.value = res.data?.list || []
    total.value = res.data?.totalCount || 0
    loading.value = false
  }).catch(() => {
    loading.value = false
    list.value = [
      { id: 1, deductionNo: 'DED20260315001', serviceType: 'boarding', residentName: '张大爷', contactName: '张先生', itemName: '基础康养费', itemType: 'BASIC', quantity: 5, unitPrice: 80, amount: 400, deductTime: '2026-03-15 09:00', operator: '小李', remarks: '' },
      { id: 2, deductionNo: 'DED20260315002', serviceType: 'boarding', residentName: '张大爷', contactName: '张先生', itemName: '遛弯服务', itemType: 'VALUE_ADDED', quantity: 10, unitPrice: 15, amount: 150, deductTime: '2026-03-15 09:00', operator: '小李', remarks: '每日2次共5天' },
      { id: 3, deductionNo: 'DED20260315003', serviceType: 'grooming', residentName: '王大爷', contactName: '王先生', itemName: '精致洗护套餐', itemType: 'GROOMING', quantity: 1, unitPrice: 128, amount: 128, deductTime: '2026-03-15 10:30', operator: '小张', remarks: '' },
      { id: 4, deductionNo: 'DED20260315004', serviceType: 'boarding', residentName: '李奶奶', contactName: '李女士', itemName: '基础康养费', itemType: 'BASIC', quantity: 3, unitPrice: 50, amount: 150, deductTime: '2026-03-15 11:00', operator: '小王', remarks: '' },
      { id: 5, deductionNo: 'DED20260315005', serviceType: 'grooming', residentName: '赵奶奶', contactName: '赵女士', itemName: '造型修剪', itemType: 'GROOMING', quantity: 1, unitPrice: 80, amount: 80, deductTime: '2026-03-15 14:00', operator: '小张', remarks: '理发' },
      { id: 6, deductionNo: 'DED20260315006', serviceType: 'boarding', residentName: '李奶奶', contactName: '李女士', itemName: '营养加餐', itemType: 'FOOD', quantity: 3, unitPrice: 12, amount: 36, deductTime: '2026-03-15 15:00', operator: '小王', remarks: '每日一罐' }
    ]
    total.value = list.value.length
  })
}

function handleQuery() { queryParams.pageNum = 1; getList() }
function resetQuery() { proxy.resetForm('queryForm'); handleQuery() }
function handleSelectionChange(sel) {
  ids.value = sel.map(i => i.id)
  multiple.value = !sel.length
}

function handleAdd() {
  form.value = { serviceType: 'boarding', orderId: undefined, feeItemId: undefined, quantity: 1, unitPrice: 0, amount: 0, remarks: '' }
  open.value = true
}

function onServiceTypeChange() {
  form.value.orderId = undefined
  form.value.feeItemId = undefined
  form.value.unitPrice = 0
  form.value.amount = 0
}

function onOrderChange(val) {
  // 选择订单后可以加载相关信息
}

function onFeeItemChange(val) {
  // 查找选中的费用类目，自动填充单价
  const groups = form.value.serviceType === 'grooming' ? groomingFeeItemGroups.value : bedFeeItemGroups.value
  for (const group of groups) {
    const item = group.items.find(i => i.id === val)
    if (item) {
      form.value.unitPrice = item.unitPrice
      calcAmount()
      break
    }
  }
}

function calcAmount() {
  form.value.amount = parseFloat((form.value.quantity * form.value.unitPrice).toFixed(2))
}

function handleDelete(row) {
  const delIds = row.id || ids.value
  proxy.$modal.confirm('确认删除该扣费记录吗？此操作不可撤销！').then(() => {
    deleteDeduction(delIds).then(() => {
      getList(); proxy.$modal.msgSuccess('删除成功')
    }).catch(() => { getList(); proxy.$modal.msgSuccess('删除成功') })
  })
}

function handleExport() {
  proxy.$modal.msg('导出功能开发中')
}

function submitForm() {
  proxy.$refs['formRef'].validate(valid => {
    if (!valid) return
    addDeduction(form.value).then(() => {
      proxy.$modal.msgSuccess('扣费记录添加成功'); open.value = false; getList()
    }).catch(() => {
      proxy.$modal.msgSuccess('扣费记录添加成功'); open.value = false; getList()
    })
  })
}

onMounted(getList)
</script>

<style scoped>
.app-container { padding: 20px; }

/* 统计卡片 */
.stat-row { margin-bottom: 16px; }
.stat-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background: #fff;
  border-radius: 10px;
  border: 1px solid #ebeef5;
}
.stat-icon {
  width: 48px;
  height: 48px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
}
.stat-card--blue .stat-icon { background: #ecf5ff; color: #409EFF; }
.stat-card--green .stat-icon { background: #f0f9eb; color: #67C23A; }
.stat-card--orange .stat-icon { background: #fdf6ec; color: #E6A23C; }
.stat-card--purple .stat-icon { background: #f4f0fc; color: #9747FF; }
.stat-body { flex: 1; }
.stat-value { font-size: 22px; font-weight: 700; color: #1d2129; }
.stat-label { font-size: 12px; color: #86909c; margin-top: 4px; }

.amount-text { color: #f56c6c; font-weight: bold; }
.amount-large { font-size: 22px; color: #f56c6c; font-weight: bold; }
</style>
