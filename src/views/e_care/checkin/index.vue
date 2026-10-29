<template>
  <div class="app-container">
    <el-card shadow="never">
      <!-- 搜索区域 -->
      <el-form :model="queryParams" ref="queryForm" :inline="true" label-width="80px">
        <el-form-item label="登记编号" prop="checkinNo">
          <el-input
            v-model="queryParams.checkinNo"
            placeholder="请输入登记编号"
            clearable
            style="width: 180px"
            @keyup.enter="handleQuery"
          />
        </el-form-item>
        <el-form-item label="长者姓名" prop="residentName">
          <el-input
            v-model="queryParams.residentName"
            placeholder="请输入长者姓名"
            clearable
            style="width: 180px"
            @keyup.enter="handleQuery"
          />
        </el-form-item>
        <el-form-item label="家属电话" prop="contactPhone">
          <el-input
            v-model="queryParams.contactPhone"
            placeholder="请输入家属电话"
            clearable
            style="width: 180px"
            @keyup.enter="handleQuery"
          />
        </el-form-item>
        <el-form-item label="登记日期" prop="checkinDate">
          <el-date-picker
            v-model="queryParams.checkinDate"
            type="date"
            placeholder="选择登记日期"
            value-format="YYYY-MM-DD"
            style="width: 180px"
          />
        </el-form-item>
        <el-form-item label="状态" prop="checkinStatus">
          <el-select v-model="queryParams.checkinStatus" placeholder="请选择状态" clearable style="width: 180px">
            <el-option v-for="opt in statusOptions" :key="opt.value" :label="opt.label" :value="Number(opt.value)" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" icon="Search" @click="handleQuery" round>搜索</el-button>
          <el-button icon="Refresh" @click="resetQuery" round>重置</el-button>
        </el-form-item>
      </el-form>

      <!-- 操作按钮 -->
      <el-row :gutter="10" class="mb8">
        <el-col :span="1.5">
          <el-button type="primary" plain icon="Plus" @click="handleAdd" round>新增登记</el-button>
        </el-col>
        <el-col :span="1.5">
          <el-button type="danger" plain icon="Delete" :disabled="multiple" @click="handleDelete" round>删除</el-button>
        </el-col>
      </el-row>

      <!-- 数据表格 -->
      <el-table v-loading="loading" :data="checkinList" @selection-change="handleSelectionChange">
        <el-table-column type="selection" width="55" align="center" />
        <el-table-column label="登记编号" align="center" prop="checkinNo" width="200" />
        <el-table-column label="长者姓名" align="center" prop="residentName" min-width="120" />
        <el-table-column label="床位" align="center" min-width="140">
          <template #default="scope">
            <span v-if="scope.row.roomName || scope.row.bedNo">{{ scope.row.roomName || '-' }} · {{ scope.row.bedNo || '-' }}</span>
            <span v-else style="color: #909399">-</span>
          </template>
        </el-table-column>
        <el-table-column label="家属姓名" align="center" prop="contactName" min-width="120" />
        <el-table-column label="联系电话" align="center" prop="contactPhone" min-width="120" />
        <el-table-column label="押金金额" align="center" prop="totalDeposit" min-width="100">
          <template #default="scope">
            <span style="color: #f56c6c; font-weight: 600">¥{{ scope.row.totalDeposit || 0 }}</span>
          </template>
        </el-table-column>
        <el-table-column label="已付押金" align="center" prop="totalDepositPayMoney" min-width="100">
          <template #default="scope">
            <span :style="{ color: scope.row.totalDepositPayMoney >= scope.row.totalDeposit ? '#67c23a' : '#e6a23c', fontWeight: '600' }">
              ¥{{ scope.row.totalDepositPayMoney || 0 }}
            </span>
          </template>
        </el-table-column>
        <el-table-column label="支付方式" align="center" prop="totalDepositPaymentMethod" min-width="100">
          <template #default="scope">
            <span v-if="scope.row.totalDepositPaymentMethod">{{ getPaymentMethodName(scope.row.totalDepositPaymentMethod) }}</span>
            <span v-else style="color: #909399">-</span>
          </template>
        </el-table-column>
        <el-table-column label="押金状态" align="center" prop="totalDepositPayState" width="100">
          <template #default="scope">
            <dict-tag :options="depositPayStateOptions" :value="scope.row.totalDepositPayState" />
          </template>
        </el-table-column>
        <el-table-column label="登记日期" align="center" prop="checkinDate" min-width="200" />
       
        <el-table-column label="状态" align="center" prop="checkinStatus" width="90">
          <template #default="scope">
            <dict-tag :options="statusOptions" :value="String(scope.row.checkinStatus)" />
          </template>
        </el-table-column>
        <el-table-column fixed="right" label="操作" align="center" class-name="small-padding fixed-width" width="280">
          <template #default="scope">
            <el-button link type="primary" icon="View" @click="handleView(scope.row)" round>查看</el-button>
            <el-button link type="primary" icon="Edit" @click="handleUpdate(scope.row)" round>编辑</el-button>
            <el-button 
              v-if="scope.row.checkinStatus === 0" 
              link 
              type="success" 
              icon="Check" 
              @click="handleComplete(scope.row)" 
              round
            >完成</el-button>
            <el-button
              v-if="scope.row.checkinStatus === 0"
              link
              type="danger"
              icon="Close"
              @click="handleReject(scope.row)"
              round
            >拒收</el-button>
            <el-button
              v-if="scope.row.checkinStatus === 2"
              link
              type="warning"
              icon="SwitchButton"
              @click="handleCheckout(scope.row)"
              round
            >办理退住</el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <pagination
        v-show="total > 0"
        :total="total"
        v-model:page="queryParams.pageNum"
        v-model:limit="queryParams.pageSize"
        @pagination="getList"
      />
    </el-card>

   
    <!-- 拒收对话框 -->
    <el-dialog title="拒收登记" v-model="rejectOpen" width="500px" append-to-body>
      <el-form ref="rejectFormRef" :model="rejectForm" :rules="rejectRules" label-width="100px">
        <el-form-item label="拒收原因" prop="reason">
          <el-input v-model="rejectForm.reason" type="textarea" placeholder="请输入拒收原因" />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button type="primary" @click="submitReject" round>确 定</el-button>
          <el-button @click="rejectOpen = false" round>取 消</el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 押金支付确认对话框 -->
    <el-dialog 
      title="押金支付确认" 
      v-model="depositPayOpen" 
      width="600px" 
      append-to-body
      :close-on-click-modal="false"
    >
      <el-form ref="depositFormRef" :model="depositForm" :rules="depositRules" label-width="120px">
        <el-alert
          title="提示：完成登记前请确认押金支付情况"
          type="info"
          :closable="false"
          style="margin-bottom: 20px"
        />
        
        <el-form-item label="登记编号">
          <el-input v-model="currentCheckin.checkinNo" disabled />
        </el-form-item>
        
        <el-form-item label="押金总额">
          <el-input-number 
            v-model="depositForm.totalDeposit" 
            :min="0" 
            :precision="2"
            disabled
            style="width: 100%"
          />
        </el-form-item>
        
        <el-form-item label="已付押金" prop="payMoney">
          <el-input-number 
            v-model="depositForm.payMoney" 
            :min="0" 
            :max="depositForm.totalDeposit"
            :precision="2"
            :step="10"
            style="width: 100%"
          />
          <div style="margin-top: 8px; font-size: 12px; color: #909399">
            未付金额：<span :style="{ color: depositForm.totalDeposit - depositForm.payMoney > 0 ? '#f56c6c' : '#67c23a', fontWeight: 'bold' }">¥{{ (depositForm.totalDeposit - depositForm.payMoney).toFixed(2) }}</span>
          </div>
        </el-form-item>
        
        <el-form-item label="支付方式" prop="paymentMethod">
          <el-radio-group v-model="depositForm.paymentMethod" @change="onPaymentMethodChange">
            <el-radio label="cash">现金</el-radio>
            <el-radio label="wechat">微信</el-radio>
            <el-radio label="alipay">支付宝</el-radio>
            <el-radio label="card">刷卡</el-radio>
            <el-radio label="member_card">会员卡</el-radio>
          </el-radio-group>
        </el-form-item>
        
        <!-- 会员卡信息展示 -->
        <el-form-item v-if="depositForm.paymentMethod === 'member_card'" label="会员卡信息">
          <div v-loading="memberCardLoading" style="width: 100%">
            <el-card v-if="memberCardInfo" shadow="never" style="background: #f0f9eb">
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px">
                <div>
                  <span style="color: #909399; font-size: 12px">卡号</span>
                  <div style="font-weight: 600; color: #67c23a">{{ memberCardInfo.cardNo }}</div>
                </div>
                <div>
                  <span style="color: #909399; font-size: 12px">持卡人</span>
                  <div style="font-weight: 600">{{ memberCardInfo.residentName }}</div>
                </div>
                <div>
                  <span style="color: #909399; font-size: 12px">卡余额</span>
                  <div style="font-weight: 600; color: #f56c6c; font-size: 16px">¥{{ memberCardInfo.balance || 0 }}</div>
                </div>
                <div>
                  <span style="color: #909399; font-size: 12px">赠送余额</span>
                  <div style="font-weight: 600; color: #e6a23c">¥{{ memberCardInfo.giftBalance || 0 }}</div>
                </div>
              </div>
            </el-card>
            <el-alert 
              v-else 
              title="该客户没有有效的会员卡" 
              type="warning" 
              :closable="false" 
            />
          </div>
        </el-form-item>
      </el-form>
      
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="depositPayOpen = false" round>取 消</el-button>
          <el-button type="primary" @click="submitDepositAndComplete" round>确认完成</el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 登记详情查看（本页一页展示完整登记信息） -->
    <el-drawer v-model="viewOpen" title="登记详情" size="78%" append-to-body>
      <div v-loading="viewLoading" class="view-wrapper">
        <template v-if="viewData">
          <div class="view-section-title">登记信息</div>
          <el-descriptions :column="3" border>
            <el-descriptions-item label="登记编号">{{ viewData.checkinNo || '-' }}</el-descriptions-item>
            <el-descriptions-item label="登记日期">{{ viewData.checkinDate || '-' }}</el-descriptions-item>
            <el-descriptions-item label="状态">
              <dict-tag :options="statusOptions" :value="String(viewData.checkinStatus)" />
            </el-descriptions-item>
            <el-descriptions-item label="登记人">{{ viewData.operatorName || '-' }}</el-descriptions-item>
            <el-descriptions-item label="押金总额">
              <span style="color: #f56c6c; font-weight: 600">¥{{ viewData.totalDeposit || 0 }}</span>
            </el-descriptions-item>
            <el-descriptions-item label="已付押金">¥{{ viewData.totalDepositPayMoney || 0 }}</el-descriptions-item>
            <el-descriptions-item label="支付方式">
              {{ viewData.totalDepositPaymentMethod ? getPaymentMethodName(viewData.totalDepositPaymentMethod) : '-' }}
            </el-descriptions-item>
            <el-descriptions-item label="押金状态">
              <dict-tag v-if="viewData.totalDepositPayState != null" :options="depositPayStateOptions" :value="viewData.totalDepositPayState" />
              <span v-else>-</span>
            </el-descriptions-item>
            <el-descriptions-item label="计划时长">{{ viewData.chargeNum != null ? (viewData.chargeNum + ' ' + getChargeCycleName(viewData.chargeCycle) + '（约 ' + plannedDays(viewData.chargeNum, viewData.chargeCycle) + ' 天）') : '-' }}</el-descriptions-item>
            <el-descriptions-item label="特殊需求" :span="3">{{ viewData.specialNeeds || '-' }}</el-descriptions-item>
            <el-descriptions-item label="备注" :span="3">{{ viewData.remarks || '-' }}</el-descriptions-item>
          </el-descriptions>

          <div class="view-section-title">家属 / 联系人</div>
          <el-descriptions :column="3" border>
            <el-descriptions-item label="联系人姓名">{{ viewData.contactName || '-' }}</el-descriptions-item>
            <el-descriptions-item label="联系电话">{{ viewData.contactPhone || '-' }}</el-descriptions-item>
            <el-descriptions-item label="备用电话">{{ viewData.contactPhoneBackup || '-' }}</el-descriptions-item>
          </el-descriptions>

          <div class="view-section-title">入住长者与健康评估</div>
          <el-descriptions :column="4" border size="small">
            <el-descriptions-item label="长者姓名">{{ viewData.residentName || '-' }}</el-descriptions-item>
            <el-descriptions-item label="长者编号">{{ viewData.residentNo || '-' }}</el-descriptions-item>
            <el-descriptions-item label="性别">{{ genderName(viewData.gender) }}</el-descriptions-item>
            <el-descriptions-item label="出生日期">{{ viewData.birthDate || '-' }}</el-descriptions-item>
            <el-descriptions-item label="身份证号">{{ viewData.idCard || '-' }}</el-descriptions-item>
            <el-descriptions-item label="联系电话">{{ viewData.phone || '-' }}</el-descriptions-item>
            <el-descriptions-item label="房间">{{ viewData.roomName || '-' }}</el-descriptions-item>
            <el-descriptions-item label="床位">{{ viewData.bedNo || '-' }}</el-descriptions-item>
            <el-descriptions-item label="照护等级">{{ getCareLevelName(viewData.careLevel) || '-' }}</el-descriptions-item>
            <el-descriptions-item label="精神状态">{{ mentalStateName(viewData.mentalState) || '-' }}</el-descriptions-item>
            <el-descriptions-item label="认知筛查">{{ cognitionName(viewData.cognition) || '-' }}</el-descriptions-item>
            <el-descriptions-item label="跌倒风险">{{ fallRiskName(viewData.fallRisk) || '-' }}</el-descriptions-item>
            <el-descriptions-item label="体温(℃)">{{ viewData.temperature ?? '-' }}</el-descriptions-item>
            <el-descriptions-item label="脉搏(次/分)">{{ viewData.pulse ?? '-' }}</el-descriptions-item>
            <el-descriptions-item label="血压(mmHg)">
              {{ viewData.bloodPressureHigh ?? '-' }} / {{ viewData.bloodPressureLow ?? '-' }}
            </el-descriptions-item>
            <el-descriptions-item label="血氧(%)">{{ viewData.bloodOxygen ?? '-' }}</el-descriptions-item>
            <el-descriptions-item label="计费单价">
              ¥{{ viewData.periodPrice || 0 }}{{ getChargeCycleUnit(viewData.chargeCycle) }}
            </el-descriptions-item>
            <el-descriptions-item label="押金">¥{{ viewData.deposit || 0 }}</el-descriptions-item>
            <el-descriptions-item label="预计退住日期">{{ viewData.checkoutDate || '-' }}</el-descriptions-item>
            <el-descriptions-item label="实际退住日期">{{ viewData.actualCheckoutDate || '-' }}</el-descriptions-item>
            <el-descriptions-item label="慢性疾病" :span="2">{{ viewData.chronicDiseases || '-' }}</el-descriptions-item>
            <el-descriptions-item label="在服药物" :span="2">{{ viewData.medications || '-' }}</el-descriptions-item>
            <el-descriptions-item label="过敏史" :span="2">{{ viewData.allergies || '-' }}</el-descriptions-item>
            <el-descriptions-item label="膳食类型">{{ viewData.dietType || '-' }}</el-descriptions-item>
            <el-descriptions-item label="自带物品" :span="3">{{ viewData.broughtItems || '-' }}</el-descriptions-item>
          </el-descriptions>
          <div v-if="photoUrls(viewData.checkinPhotoList, viewData.checkinPhotos).length" class="view-photos">
            <div class="view-photos-title">入住近照</div>
            <el-image
              v-for="(url, i) in photoUrls(viewData.checkinPhotoList, viewData.checkinPhotos)"
              :key="i"
              :src="url"
              :preview-src-list="photoUrls(viewData.checkinPhotoList, viewData.checkinPhotos)"
              :initial-index="i"
              fit="cover"
              class="view-photo"
            />
          </div>
        </template>
      </div>
    </el-drawer>
  </div>
</template>

<script setup name="ResidentCheckin">
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getCheckinList, getCheckinDetail, updateCheckin, deleteCheckin, submitDepositAndComplete as submitDepositAPI } from '@/api/care/checkin'
import { getPackageList } from '@/api/care/billing'
import { getCustomerResidentCard } from '@/api/resident/residentCard'
import { getCareLevelName, getChargeCycleUnit, getChargeCycleName, plannedDays, CHECKIN_STATUS_OPTIONS } from '@/utils/careEnums'

const router = useRouter()

const checkinList = ref([])
const loading = ref(true)
const ids = ref([])
const single = ref(true)
const multiple = ref(true)
const total = ref(0)
const rejectOpen = ref(false)
const currentId = ref(null)
const depositPayOpen = ref(false)
const currentCheckin = ref(null)
const memberCardInfo = ref(null)
const memberCardLoading = ref(false)

// 登记详情查看（本页抽屉）
const viewOpen = ref(false)
const viewLoading = ref(false)
const viewData = ref(null)
const viewPackageMap = ref({})
const depositPayStateOptions = ref([
  { label: '未支付', value: '0', elTagType: 'info' },
  { label: '已支付', value: '1', elTagType: 'success' },
  { label: '已退款', value: '2', elTagType: 'warning' }
])

// 字典选项（与后端 checkin_status 口径一致）
const statusOptions = CHECKIN_STATUS_OPTIONS

// 查询参数
const queryParams = reactive({
  pageNum: 1,
  pageSize: 10,
  checkinNo: undefined,
  residentName: undefined,
  contactPhone: undefined,
  checkinDate: undefined,
  checkinStatus: undefined
})

const rejectForm = ref({})
const rejectFormRef = ref(null)
const depositFormRef = ref(null)

// 押金支付表单
const depositForm = reactive({
  id: null,
  totalDeposit: 0,
  payMoney: 0,
  paymentMethod: 'cash'
})

const depositRules = {
  payMoney: [
    { required: true, message: '请输入支付金额', trigger: 'blur' },
    { type: 'number', min: 0, message: '金额必须大于等于0', trigger: 'blur' }
  ],
  paymentMethod: [
    { required: true, message: '请选择支付方式', trigger: 'change' }
  ]
}

const rejectRules = ref({
  reason: [{ required: true, message: '请输入拒收原因', trigger: 'blur' }]
})

// 获取支付方式名称
function getPaymentMethodName(method) {
  const methodMap = {
    'cash': '现金',
    'wechat': '微信',
    'alipay': '支付宝',
    'card': '刷卡',
    'member_card': '会员卡'
  }
  return methodMap[method] || method
}

// 获取列表
function getList() {
  loading.value = true
  getCheckinList(queryParams).then(response => {
    checkinList.value = response.data?.list || []
    total.value = response.data?.totalCount || 0
    loading.value = false
  }).catch(() => {
    loading.value = false
})
}

function handleQuery() {
  queryParams.pageNum = 1
  getList()
}

function resetQuery() {
  queryParams.checkinNo = undefined
  queryParams.residentName = undefined
  queryParams.contactPhone = undefined
  queryParams.checkinDate = undefined
  queryParams.checkinStatus = undefined
  handleQuery()
}

function handleSelectionChange(selection) {
  ids.value = selection.map(item => item.id)
  single.value = selection.length !== 1
  multiple.value = !selection.length
}

function handleAdd() {
  router.push('/eyang/checkin/form')
  // router.push('/e_care/checkin/form')
}

function handleUpdate(row) {
  router.push({
    path: '/eyang/checkin/form',
    query: { id: row.id }
  })
}

function handleView(row) {
  viewOpen.value = true
  viewLoading.value = true
  viewData.value = null
  Promise.all([getCheckinDetail(row.id), loadViewPackages()]).then(([res]) => {
    viewData.value = res.data || null
  }).catch(() => {
    ElMessage.error('加载登记详情失败')
  }).finally(() => {
    viewLoading.value = false
  })
}

// 加载套餐列表，用于详情中展示套餐名称与计费单位
function loadViewPackages() {
  return getPackageList({ chargeKind: 0, pageSize: 999 }).then(res => {
    const map = {}
    ;(res.data?.list || res.data?.records || []).forEach(p => { map[p.id] = p })
    viewPackageMap.value = map
  }).catch(() => {
    viewPackageMap.value = {}
  })
}

// 详情字段格式化
function genderName(gender) {
  if (gender === 1) return '男'
  if (gender === 2) return '女'
  return '未知'
}

function mentalStateName(state) {
  return { GOOD: '良好', NORMAL: '一般', POOR: '差' }[state] || ''
}

function cognitionName(cognition) {
  return { NORMAL: '正常', SUSPECTED: '疑似失智', CONFIRMED: '确诊失智' }[cognition] || ''
}

function fallRiskName(risk) {
  return { LOW: '低', MEDIUM: '中', HIGH: '高' }[risk] || ''
}

function checkinStatusName(status) {
  return { 1: '待入住', 2: '康养中', 3: '已退住' }[status] || ''
}

function comboNameOf(r) {
  return viewPackageMap.value[r.comboId]?.comboName || ''
}

function broughtItemsText(r) {
  return r.broughtItems || ''
}

function photoUrls(list, str) {
  if (Array.isArray(list) && list.length) return list
  if (typeof str === 'string' && str) return str.split(',').filter(Boolean)
  return []
}

function handleComplete(row) {
  currentCheckin.value = row
  // 初始化表单，默认已付押金等于总押金
  depositForm.id = row.id
  depositForm.totalDeposit = row.totalDeposit || 0
  depositForm.payMoney = row.totalDepositPayMoney || row.totalDeposit || 0
  depositForm.paymentMethod = row.totalDepositPaymentMethod || 'cash'
  
  // 查询长者会员卡信息
  memberCardInfo.value = null
  if (row.residentId) {
    memberCardLoading.value = true
    getCustomerResidentCard(row.residentId).then(res => {
      memberCardInfo.value = res.data || null
    }).catch(() => {
      memberCardInfo.value = null
    }).finally(() => {
      memberCardLoading.value = false
    })
  }
  
  depositPayOpen.value = true
}

// 提交押金支付并完成登记
function submitDepositAndComplete() {
  depositFormRef.value?.validate(valid => {
    if (valid) {
      // 检查会员卡余额
      if (depositForm.paymentMethod === 'member_card') {
        if (!memberCardInfo.value) {
          ElMessage.warning('该客户没有有效的会员卡')
          return
        }
        const balance = memberCardInfo.value.balance || 0
        if (balance < depositForm.payMoney) {
          ElMessage.warning(`会员卡余额不足，当前余额：¥${balance}，需要支付：¥${depositForm.payMoney}`)
          return
        }
      }
      
      // 调用后端接口，后端会处理会员卡消费和登记更新
      const submitData = {
        id: depositForm.id,
        totalDepositPayMoney: depositForm.payMoney,
        totalDepositPaymentMethod: depositForm.paymentMethod,
        totalDepositPayState: depositForm.payMoney >= depositForm.totalDeposit ? 1 : 0
      }
      
      submitDepositAPI(submitData).then(() => {
        ElMessage.success('押金支付成功，登记已完成')
        depositPayOpen.value = false
        getList()
      }).catch(err => {
        ElMessage.error(err.message || '操作失败')
      })
    }
  })
}

// 支付方式改变时，如果是会员卡则重新加载
function onPaymentMethodChange(method) {
  if (method === 'member_card' && currentCheckin.value?.residentId && !memberCardInfo.value) {
    memberCardLoading.value = true
    getCustomerResidentCard(currentCheckin.value.residentId).then(res => {
      memberCardInfo.value = res.data || null
      if (!memberCardInfo.value) {
        ElMessage.warning('该客户没有有效的会员卡')
      }
    }).catch(() => {
      memberCardInfo.value = null
    }).finally(() => {
      memberCardLoading.value = false
    })
  }
}

function handleReject(row) {
  currentId.value = row.id
  rejectForm.value = { reason: '' }
  rejectOpen.value = true
}

// 办理退住：进入退住交接列表（按登记下长者明细交接）
function handleCheckout(row) {
  router.push('/eyang/checkout')
}

function submitReject() {
  rejectFormRef.value?.validate(valid => {
    if (valid) {
      updateCheckin({ id: currentId.value, checkinStatus: 9, remarks: rejectForm.value.reason }).then(() => {
        ElMessage.success('拒收成功')
        rejectOpen.value = false
        getList()
      }).catch(() => {
        ElMessage.error('操作失败')
      })
    }
  })
}

function handleDelete(row) {
  const checkinIds = row.id || ids.value
  ElMessageBox.confirm('是否确认删除登记编号为"' + checkinIds + '"的数据项？', '提示').then(() => {
    deleteCheckin(checkinIds).then(() => {
      getList()
      ElMessage.success('删除成功')
    }).catch(() => {
      getList()
      ElMessage.success('删除成功')
    })
  })
}


onMounted(() => {
  getList()
})
</script>

<style scoped>
.app-container {
  padding: 20px;
}

/* 登记详情抽屉 */
.view-wrapper {
  min-height: 300px;
}
.view-section-title {
  font-size: 15px;
  font-weight: 600;
  color: #1d2129;
  margin: 20px 0 12px;
  padding-left: 10px;
  border-left: 4px solid #409eff;
}
.view-section-title:first-child {
  margin-top: 0;
}
.view-resident-card {
  margin-bottom: 16px;
}
.view-resident-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.view-resident-title {
  display: flex;
  align-items: center;
  gap: 8px;
}
.view-resident-name {
  font-size: 15px;
  font-weight: 600;
}
.view-photos {
  margin-top: 12px;
}
.view-photos-title {
  font-size: 13px;
  color: #606266;
  margin-bottom: 8px;
}
.view-photo {
  width: 90px;
  height: 90px;
  margin-right: 8px;
  border-radius: 6px;
  cursor: pointer;
}
</style>
