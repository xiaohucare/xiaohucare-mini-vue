<template>
  <div class="app-container">
    <!-- 返回按钮和页面标题 -->
    <el-row class="mb20">
      <el-col>
        <el-button @click="goBack" icon="ArrowLeft">返回列表</el-button>
        <span class="page-title">{{ isEditMode ? (isAddMode ? '新增客户' : '编辑客户') : '客户详情' }}</span>
      </el-col>
    </el-row>

    <!-- 客户档案卡片 -->
    <el-row :gutter="20" class="mb20">
      <el-col :span="24">
        <el-card shadow="never" v-loading="customerLoading">
          <template #header>
            <div class="card-header">
              <span>客户档案</span>
              <div v-if="!isEditMode">
                <el-button type="primary" icon="Edit" @click="handleEdit">编辑信息</el-button>
              </div>
              <div v-else>
                <el-button type="success" icon="Check" @click="submitEdit" :loading="submitLoading">保存</el-button>
                <el-button icon="Close" @click="handleCancel">取消</el-button>
              </div>
            </div>
          </template>

          <!-- 查看模式 -->
          <el-descriptions v-if="!isEditMode" :column="4" border>
            <el-descriptions-item label="头像" :span="4">
              <el-avatar :size="80" :src="customer.avatar" icon="UserFilled" />
            </el-descriptions-item>
            <el-descriptions-item label="昵称/姓名">
              {{ customer.nickname || customer.certiName || '-' }}
            </el-descriptions-item>
            <el-descriptions-item label="手机号">
              {{ customer.mobile || '-' }}
            </el-descriptions-item>
            <el-descriptions-item label="性别">
              {{ customer.gender === 'M' ? '男' : customer.gender === 'F' ? '女' : '-' }}
            </el-descriptions-item>
            <el-descriptions-item label="所在地区">
              {{ [customer.province, customer.city, customer.district].filter(Boolean).join(' ') || '-' }}
            </el-descriptions-item>
            <el-descriptions-item label="详细地址">
              {{ customer.detailAddress || '-' }}
            </el-descriptions-item>

            <el-descriptions-item label="实名认证">
              <el-tag v-if="customer.certiState === 1" type="success" size="small">已认证</el-tag>
              <el-tag v-else type="info" size="small">未认证</el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="真实姓名">
              {{ customer.certiName || '-' }}
            </el-descriptions-item>
            <el-descriptions-item label="会员类型" :span="2">
              <el-tag v-if="customer.memberType === 1" type="warning">开卡会员</el-tag>
              <el-tag v-else type="">普通用户</el-tag>
            </el-descriptions-item>

            <el-descriptions-item label="备用电话">
              {{ customer.linkPhone || '-' }}
            </el-descriptions-item>
            <el-descriptions-item label="生日">
              {{ formatDate(customer.birthday) }}
            </el-descriptions-item>
            <el-descriptions-item label="职业">
              {{ customer.profession || '-' }}
            </el-descriptions-item>
            <el-descriptions-item label="国家">
              {{ customer.country || '-' }}
            </el-descriptions-item>

            <el-descriptions-item label="注册时间" :span="2">
              {{ customer.createAt || '-' }}
            </el-descriptions-item>
            <el-descriptions-item label="状态" :span="2">
              <el-tag v-if="customer.status === 1" type="success" size="small">正常</el-tag>
              <el-tag v-else type="danger" size="small">禁用</el-tag>
            </el-descriptions-item>

            <el-descriptions-item label="备注" :span="4">
              {{ customer.remark || '暂无备注' }}
            </el-descriptions-item>
          </el-descriptions>

          <!-- 编辑模式 -->
          <el-form v-else ref="editRef" :model="editForm" :rules="rules" label-width="110px">
            <!-- 头像上传 -->
            <el-form-item label="头像">
              <el-upload
                class="avatar-uploader"
                :action="ossUploadUrl"
                :headers="ossUploadHeaders"
                :show-file-list="false"
                :on-success="handleAvatarSuccess"
                :on-error="handleAvatarError"
                accept="image/*"
              >
                <el-avatar v-if="editForm.avatar" :size="100" :src="editForm.avatar" />
                <div v-else class="avatar-placeholder">
                  <el-icon :size="40"><UserFilled /></el-icon>
                  <div class="upload-text">点击上传头像</div>
                </div>
              </el-upload>
              <el-button v-if="editForm.avatar" link type="danger" @click="removeAvatar" style="margin-top: 8px">
                删除头像
              </el-button>
            </el-form-item>

            <!-- 基本信息 -->
            <el-divider content-position="left">基本信息</el-divider>
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="昵称" prop="nickname">
                  <el-input v-model="editForm.nickname" placeholder="请输入昵称" />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="手机号" prop="mobile">
                  <el-input v-model="editForm.mobile" placeholder="请输入手机号" maxlength="11" />
                </el-form-item>
              </el-col>
            </el-row>
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="备用电话" prop="linkPhone">
                  <el-input v-model="editForm.linkPhone" placeholder="备用电话" maxlength="11" />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="性别" prop="gender">
                  <el-radio-group v-model="editForm.gender">
                    <el-radio value="M">男</el-radio>
                    <el-radio value="F">女</el-radio>
                  </el-radio-group>
                </el-form-item>
              </el-col>
            </el-row>
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="生日" prop="birthday">
                  <el-date-picker
                    v-model="editForm.birthday"
                    type="date"
                    value-format="YYYY-MM-DD"
                    placeholder="请选择生日"
                    style="width: 100%"
                  />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="职业" prop="profession">
                  <el-input v-model="editForm.profession" placeholder="请输入职业" />
                </el-form-item>
              </el-col>
            </el-row>

            <!-- 地址信息 -->
            <el-divider content-position="left">地址信息</el-divider>
            <el-row :gutter="20">
              <el-col :span="8">
                <el-form-item label="省份" prop="provinceId">
                  <el-select v-model="editForm.provinceId" placeholder="请选择省份" @change="handleProvinceChange" clearable>
                    <el-option
                      v-for="item in provinceList"
                      :key="item.id"
                      :label="item.name"
                      :value="item.id"
                    />
                  </el-select>
                </el-form-item>
              </el-col>
              <el-col :span="8">
                <el-form-item label="城市" prop="cityId">
                  <el-select v-model="editForm.cityId" placeholder="请选择城市" @change="handleCityChange" clearable :disabled="!editForm.provinceId">
                    <el-option
                      v-for="item in cityList"
                      :key="item.id"
                      :label="item.name"
                      :value="item.id"
                    />
                  </el-select>
                </el-form-item>
              </el-col>
              <el-col :span="8">
                <el-form-item label="区域" prop="districtId">
                  <el-select v-model="editForm.districtId" placeholder="请选择区域" @change="handleDistrictChange" clearable :disabled="!editForm.cityId">
                    <el-option
                      v-for="item in districtList"
                      :key="item.id"
                      :label="item.name"
                      :value="item.id"
                    />
                  </el-select>
                </el-form-item>
              </el-col>
            </el-row>
            <el-row :gutter="20">
              <el-col :span="24">
                <el-form-item label="详细地址" prop="detailAddress">
                  <el-input v-model="editForm.detailAddress" placeholder="请输入详细地址" />
                </el-form-item>
              </el-col>
            </el-row>

            <!-- 实名认证 -->
            <el-divider content-position="left">实名认证</el-divider>
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="真实姓名" prop="certiName">
                  <el-input v-model="editForm.certiName" placeholder="请输入真实姓名" />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="证件号码" prop="certiNumber">
                  <el-input v-model="editForm.certiNumber" placeholder="请输入证件号码" maxlength="18" />
                </el-form-item>
              </el-col>
            </el-row>
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="认证状态" prop="certiState">
                  <el-select v-model="editForm.certiState" placeholder="请选择" style="width: 100%">
                    <el-option label="未认证" :value="0" />
                    <el-option label="已认证" :value="1" />
                  </el-select>
                </el-form-item>
              </el-col>
            </el-row>

            <!-- 其他 -->
            <el-divider content-position="left">其他</el-divider>
            <el-form-item label="备注" prop="remark">
              <el-input v-model="editForm.remark" type="textarea" :rows="3" placeholder="请输入备注" />
            </el-form-item>
          </el-form>
        </el-card>
      </el-col>
    </el-row>

    <!-- 会员卡信息区域 -->
    <el-row :gutter="20" class="mb20">
      <el-col :span="24">
        <el-card shadow="never" v-loading="cardLoading">
          <template #header>
            <div class="card-header">
              <span>会员卡信息</span>
            </div>
          </template>

          <!-- 无会员卡时显示空状态 -->
          <el-empty v-if="!memberCard" description="暂未开卡" :image-size="80" />

          <!-- 有会员卡时展示详情 -->
          <template v-else>
            <el-descriptions :column="4" border>
              <el-descriptions-item label="卡号">
                <span class="card-no">{{ memberCard.cardNo }}</span>
              </el-descriptions-item>
              <el-descriptions-item label="卡等级">
                <el-tag :type="getCardLevelType(memberCard.cardLevel)" size="small">
                  {{ getCardLevelLabel(memberCard.cardLevel) }}
                </el-tag>
              </el-descriptions-item>
              <el-descriptions-item label="卡状态">
                <el-tag :type="getCardStatusType(memberCard.status)" size="small">
                  {{ getCardStatusLabel(memberCard.status) }}
                </el-tag>
              </el-descriptions-item>
              <el-descriptions-item label="开卡日期">
                {{ memberCard.openDate || '-' }}
              </el-descriptions-item>

              <el-descriptions-item label="现金余额">
                <span class="balance-text">¥{{ formatAmount(memberCard.balance) }}</span>
              </el-descriptions-item>
              <el-descriptions-item label="赠送余额">
                <span class="gift-balance-text">¥{{ formatAmount(memberCard.giftBalance) }}</span>
              </el-descriptions-item>
              <el-descriptions-item label="累计充值">
                ¥{{ formatAmount(memberCard.totalRecharge) }}
              </el-descriptions-item>
              <el-descriptions-item label="累计消费">
                ¥{{ formatAmount(memberCard.totalConsume) }}
              </el-descriptions-item>
            </el-descriptions>
          </template>
        </el-card>
      </el-col>
    </el-row>

    <!-- 消费记录 -->
    <el-row :gutter="20" class="mb20">
      <el-col :span="24">
        <el-card shadow="never" v-loading="consumptionLoading">
          <template #header>
            <div class="card-header">
              <span>消费记录</span>
            </div>
          </template>
          <el-empty v-if="consumptionList.length === 0" description="暂无消费记录" :image-size="80" />
          <el-timeline v-else>
            <el-timeline-item
              v-for="(record, index) in consumptionList"
              :key="index"
              :type="record.tradeType === 'recharge' ? 'success' : 'primary'"
              :timestamp="record.createAt"
            >
              <div class="consumption-item">
                <span class="consumption-title">
                  {{ record.tradeType === 'recharge' ? '充值' : '消费' }}
                </span>
                <span
                  class="consumption-amount"
                  :class="record.tradeType === 'recharge' ? 'amount-positive' : 'amount-negative'"
                >
                  {{ record.tradeType === 'recharge' ? '+' : '-' }}¥{{ formatAmount(record.tradeAmount) }}
                </span>
              </div>
              <div class="consumption-detail">
                <span v-if="record.afterBalance != null">余额：¥{{ formatAmount(record.afterBalance) }}</span>
                <span v-if="record.remark" class="ml10 record-remark">{{ record.remark }}</span>
              </div>
            </el-timeline-item>
          </el-timeline>
        </el-card>
      </el-col>
    </el-row>

    <!-- 编辑客户信息对话框 -->
    <el-dialog title="编辑客户信息" v-model="editOpen" width="680px" append-to-body>
      <el-form ref="editRef" :model="editForm" :rules="rules" label-width="110px">
        <!-- 基本信息 -->
        <el-divider content-position="left">基本信息</el-divider>
        <el-row>
          <el-col :span="12">
            <el-form-item label="昵称" prop="nickname">
              <el-input v-model="editForm.nickname" placeholder="请输入昵称" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="手机号" prop="mobile">
              <el-input v-model="editForm.mobile" placeholder="请输入手机号" maxlength="11" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row>
          <el-col :span="12">
            <el-form-item label="性别" prop="gender">
              <el-radio-group v-model="editForm.gender">
                <el-radio value="M">男</el-radio>
                <el-radio value="F">女</el-radio>
              </el-radio-group>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="生日" prop="birthday">
              <el-date-picker
                v-model="editForm.birthday"
                type="date"
                value-format="YYYY-MM-DD"
                placeholder="请选择生日"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
        </el-row>

        <!-- 地址 -->
        <el-divider content-position="left">地址信息</el-divider>
        <el-row>
          <el-col :span="8">
            <el-form-item label="省份" prop="provinceId">
              <el-select v-model="editForm.provinceId" placeholder="请选择省份" @change="handleProvinceChange" clearable>
                <el-option
                  v-for="item in provinceList"
                  :key="item.id"
                  :label="item.name"
                  :value="item.id"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="城市" prop="cityId">
              <el-select v-model="editForm.cityId" placeholder="请选择城市" @change="handleCityChange" clearable :disabled="!editForm.provinceId">
                <el-option
                  v-for="item in cityList"
                  :key="item.id"
                  :label="item.name"
                  :value="item.id"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="区域" prop="districtId">
              <el-select v-model="editForm.districtId" placeholder="请选择区域" @change="handleDistrictChange" clearable :disabled="!editForm.cityId">
                <el-option
                  v-for="item in districtList"
                  :key="item.id"
                  :label="item.name"
                  :value="item.id"
                />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row>
          <el-col :span="24">
            <el-form-item label="详细地址" prop="detailAddress">
              <el-input v-model="editForm.detailAddress" placeholder="请输入详细地址" />
            </el-form-item>
          </el-col>
        </el-row>

        <!-- 实名认证 -->
        <el-divider content-position="left">实名认证</el-divider>
        <el-row>
          <el-col :span="12">
            <el-form-item label="真实姓名" prop="certiName">
              <el-input v-model="editForm.certiName" placeholder="请输入真实姓名" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="证件号码" prop="certiNumber">
              <el-input v-model="editForm.certiNumber" placeholder="请输入证件号码" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row>
          <el-col :span="12">
            <el-form-item label="认证状态" prop="certiState">
              <el-select v-model="editForm.certiState" placeholder="请选择" style="width: 100%">
                <el-option label="未认证" :value="0" />
                <el-option label="已认证" :value="1" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <!-- 紧急联系人 -->
        <el-divider content-position="left">紧急联系人</el-divider>
        <el-row>
          <el-col :span="12">
            <el-form-item label="联系人姓名" prop="linkName">
              <el-input v-model="editForm.linkName" placeholder="请输入联系人姓名" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="联系人电话" prop="linkPhone">
              <el-input v-model="editForm.linkPhone" placeholder="请输入联系人电话" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row>
          <el-col :span="24">
            <el-form-item label="联系人地址" prop="linkAddr">
              <el-input v-model="editForm.linkAddr" placeholder="请输入联系人地址" />
            </el-form-item>
          </el-col>
        </el-row>

        <!-- 其他 -->
        <el-divider content-position="left">其他</el-divider>
        <el-form-item label="备注" prop="remark">
          <el-input v-model="editForm.remark" type="textarea" :rows="3" placeholder="请输入备注" />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button type="primary" @click="submitEdit" :loading="submitLoading">确 定</el-button>
          <el-button @click="editOpen = false">取 消</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup name="CustomerDetail">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getCustomerDetail, addCustomer, updateCustomer } from '@/api/customer'
import { getCustomerResidentCard, getResidentCardConsumeRecords } from '@/api/resident/residentCard'
import { listRegionByParentId } from '@/api/system/region'
import { getToken } from '@/utils/auth'

const route = useRoute()
const router = useRouter()
const customerId = route.params.id

// 判断是否为新增模式（没有 customerId 或者是 'add'）
const isAddMode = computed(() => !customerId || customerId === 'add')
const isEditMode = ref(false)

// OSS上传配置

const ossUploadUrl = import.meta.env.VITE_APP_BASE_API + '/common/oss/upload'
const ossUploadHeaders = computed(() => ({
  Authorization: 'Bearer ' + getToken()
}))

// ==================== 响应式数据 ====================
const customer = ref({})           // 客户基本信息
const memberCard = ref(null)       // 会员卡信息（可能为null）
const consumptionList = ref([])    // 消费记录列表

// 各区域加载状态
const customerLoading = ref(false)
const cardLoading = ref(false)
const consumptionLoading = ref(false)

// 编辑对话框
const editOpen = ref(false)
const editForm = ref({})
const editRef = ref(null)
const submitLoading = ref(false)

// 地区联动数据
const provinceList = ref([])
const cityList = ref([])
const districtList = ref([])

// 表单校验规则
const rules = {
  mobile: [
    { required: true, message: '手机号不能为空', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号', trigger: 'blur' }
  ]
}

// ==================== 数据加载函数 ====================

/** 加载客户详情 */
async function loadCustomerDetail() {
  if (!customerId) return
  customerLoading.value = true
  try {
    const res = await getCustomerDetail(customerId)
    customer.value = res.data || {}
  } catch (err) {
    ElMessage.error('加载客户信息失败')
  } finally {
    customerLoading.value = false
  }
}

/** 加载会员卡信息，成功后加载消费记录 */
async function loadResidentCard() {
  if (!customerId) return
  cardLoading.value = true
  try {
    const res = await getCustomerResidentCard(customerId)
    memberCard.value = res.data || null
    // 有会员卡则加载消费记录
    if (memberCard.value && memberCard.value.id) {
      loadConsumption(memberCard.value.id)
    }
  } catch (err) {
    memberCard.value = null
  } finally {
    cardLoading.value = false
  }
}

/** 加载消费记录（需要会员卡ID） */
async function loadConsumption(cardId) {
  if (!cardId) return
  consumptionLoading.value = true
  try {
    const res = await getResidentCardConsumeRecords({ cardId, pageNum: 1, pageSize: 10 })
    // 兼容分页结构和数组结构
    const rows = res.data?.rows || res.data?.list || res.data || []
    consumptionList.value = Array.isArray(rows) ? rows : []
  } catch (err) {
    consumptionList.value = []
  } finally {
    consumptionLoading.value = false
  }
}

// ==================== 会员卡辅助函数 ====================

/** 卡等级标签类型：0=默认 1=info 2=warning 3=danger */
function getCardLevelType(level) {
  const map = { 0: '', 1: 'info', 2: 'warning', 3: 'danger' }
  return map[level] ?? ''
}

/** 卡等级标签文字 */
function getCardLevelLabel(level) {
  const map = { 0: '普通卡', 1: '银卡', 2: '金卡', 3: '钻石卡' }
  return map[level] ?? '未知'
}

/** 卡状态标签类型：0=注销(info) 1=正常(success) 2=挂失(warning) */
function getCardStatusType(status) {
  const map = { 0: 'info', 1: 'success', 2: 'warning' }
  return map[status] ?? ''
}

/** 卡状态标签文字 */
function getCardStatusLabel(status) {
  const map = { 0: '已注销', 1: '正常', 2: '挂失' }
  return map[status] ?? '未知'
}

// ==================== 通用辅助函数 ====================

/** 格式化金额，保留两位小数 */
function formatAmount(val) {
  if (val == null) return '0.00'
  return Number(val).toFixed(2)
}

/** 格式化日期，只显示 YYYY-MM-DD */
function formatDate(date) {
  if (!date) return '-'
  // 处理 ISO 8601 格式：2026-04-28T00:00:00.000+08:00
  // 或普通日期时间格式：2026-04-28 00:00:00
  // 或纯日期格式：2026-04-28
  if (typeof date === 'string') {
    return date.split('T')[0].split(' ')[0]
  }
  return date
}

// ==================== 操作函数 ====================

/** 返回客户列表 */
function goBack() {
  router.push('/customer')
}

/** 初始化表单数据 */
const initForm = () => ({
  id: undefined,
  nickname: undefined,
  mobile: undefined,
  avatar: undefined,
  memberType: 0,
  petNum: 0,
  gender: undefined,
  birthday: undefined,
  profession: undefined,
  country: undefined,
  province: undefined,
  city: undefined,
  district: undefined,
  provinceId: undefined,
  cityId: undefined,
  districtId: undefined,
  detailAddress: undefined,
  certiName: undefined,
  certiNumber: undefined,
  certiState: 0,
  linkName: undefined,
  linkPhone: undefined,
  linkAddr: undefined,
  remark: undefined
})

/** 打开编辑模式 */
function handleEdit() {
  editForm.value = { ...customer.value }
  isEditMode.value = true
  // 初始化地区数据
  loadProvinces()
  if (editForm.value.provinceId) {
    loadCities(editForm.value.provinceId)
  }
  if (editForm.value.cityId) {
    loadDistricts(editForm.value.cityId)
  }
}

/** 取消编辑 */
function handleCancel() {
  isEditMode.value = false
  if (isAddMode.value) {
    goBack()
  }
}

/** 提交编辑 */
function submitEdit() {
  editRef.value?.validate(async valid => {
    if (!valid) return
    submitLoading.value = true
    try {
      if (isAddMode.value || !editForm.value.id) {
        // 新增模式
        await addCustomer(editForm.value)
        ElMessage.success('新增成功')
      } else {
        // 编辑模式
        await updateCustomer(editForm.value)
        ElMessage.success('修改成功')
      }
      isEditMode.value = false
      // 重新加载客户信息
      loadCustomerDetail()
    } catch (err) {
      ElMessage.error(isAddMode.value ? '新增失败，请稍后重试' : '修改失败，请稍后重试')
    } finally {
      submitLoading.value = false
    }
  })
}

/** 头像上传成功 */
function handleAvatarSuccess(response, file) {
  console.log('上传响应:', response)
  if (response.code === 200) {
    // 尝试多种可能的响应数据格式
    editForm.value.avatar = response.data || response.url || response.ossUrl || response.fileName
    ElMessage.success('头像上传成功')
  } else {
    ElMessage.error(response.msg || '上传失败')
  }
}

/** 头像上传失败 */
function handleAvatarError(error) {
  console.error('上传失败:', error)
  ElMessage.error('头像上传失败：' + (error.message || '未知错误'))
}

/** 删除头像 */
function removeAvatar() {
  ElMessageBox.confirm('确认删除头像吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    editForm.value.avatar = ''
    ElMessage.success('头像已删除')
  }).catch(() => {})
}

/** 加载省份列表 */
function loadProvinces() {
  listRegionByParentId(1).then(response => {
    provinceList.value = response.data || []
  })
}

/** 加载城市列表 */
function loadCities(provinceId) {
  if (!provinceId) {
    cityList.value = []
    return
  }
  listRegionByParentId(provinceId).then(response => {
    cityList.value = response.data || []
  })
}

/** 加载区域列表 */
function loadDistricts(cityId) {
  if (!cityId) {
    districtList.value = []
    return
  }
  listRegionByParentId(cityId).then(response => {
    districtList.value = response.data || []
  })
}

/** 省份改变 */
function handleProvinceChange(provinceId) {
  // 清空城市和区域
  editForm.value.cityId = undefined
  editForm.value.districtId = undefined
  editForm.value.city = ''
  editForm.value.district = ''
  cityList.value = []
  districtList.value = []
  
  // 加载城市列表
  if (provinceId) {
    loadCities(provinceId)
    // 设置省份名称
    const province = provinceList.value.find(item => item.id === provinceId)
    editForm.value.province = province ? province.name : ''
  } else {
    editForm.value.province = ''
  }
}

/** 城市改变 */
function handleCityChange(cityId) {
  // 清空区域
  editForm.value.districtId = undefined
  editForm.value.district = ''
  districtList.value = []
  
  // 加载区域列表
  if (cityId) {
    loadDistricts(cityId)
    // 设置城市名称
    const city = cityList.value.find(item => item.id === cityId)
    editForm.value.city = city ? city.name : ''
  } else {
    editForm.value.city = ''
  }
}

/** 区域改变 */
function handleDistrictChange(districtId) {
  if (districtId) {
    const district = districtList.value.find(item => item.id === districtId)
    editForm.value.district = district ? district.name : ''
  } else {
    editForm.value.district = ''
  }
}

// ==================== 生命周期 ====================
onMounted(() => {
  if (isAddMode.value) {
    // 新增模式：初始化空表单并进入编辑模式
    customer.value = initForm()
    editForm.value = initForm()
    isEditMode.value = true
    // 加载省份列表
    loadProvinces()
  } else {
    // 详情/编辑模式：加载数据
    loadCustomerDetail()
    loadResidentCard()
  }
})
</script>

<style scoped>
.app-container {
  padding: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.mb20 {
  margin-bottom: 20px;
}

.ml10 {
  margin-left: 10px;
}

/* 会员卡样式 */
.card-no {
  font-family: monospace;
  font-size: 14px;
  font-weight: bold;
  letter-spacing: 1px;
  color: #303133;
}

.balance-text {
  font-size: 16px;
  font-weight: bold;
  color: #f56c6c;
}

.gift-balance-text {
  font-size: 16px;
  font-weight: bold;
  color: #e6a23c;
}

/* 消费记录样式 */
.consumption-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
}

.consumption-title {
  font-weight: bold;
  color: #303133;
}

.consumption-amount {
  font-weight: bold;
}

.amount-positive {
  color: #67c23a;
}

.amount-negative {
  color: #f56c6c;
}

.consumption-detail {
  font-size: 12px;
  color: #909399;
}

.record-remark {
  color: #606266;
}

/* 页面标题 */
.page-title {
  margin-left: 16px;
  font-size: 18px;
  font-weight: bold;
  color: #303133;
}

/* 头像上传样式 */
.avatar-uploader :deep(.el-upload) {
  border: 2px dashed #d9d9d9;
  border-radius: 50%;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  transition: all 0.3s;
  display: inline-block;
}

.avatar-uploader :deep(.el-upload:hover) {
  border-color: #409EFF;
}

.avatar-placeholder {
  width: 100px;
  height: 100px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: #f7f8fa;
  border-radius: 50%;
  color: #909399;
}

.avatar-placeholder .upload-text {
  font-size: 12px;
  margin-top: 4px;
}
</style>
