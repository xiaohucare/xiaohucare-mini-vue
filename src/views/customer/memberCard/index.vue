<template>
  <div class="app-container">
    <!-- Tab切换 -->
    <el-tabs v-model="activeTab" class="main-tabs" @tab-change="handleTabChange">
      <el-tab-pane label="会员卡列表" name="cards">
        <!-- 统计卡片 -->
        <el-row :gutter="16" class="stat-row">
          <el-col :xs="12" :sm="6">
            <div class="stat-card stat-card--blue">
              <div class="stat-icon"><el-icon><CreditCard /></el-icon></div>
              <div class="stat-body">
                <div class="stat-value">{{ statistics.totalCards }}</div>
                <div class="stat-label">会员卡总数</div>
              </div>
            </div>
          </el-col>
          <el-col :xs="12" :sm="6">
            <div class="stat-card stat-card--green">
              <div class="stat-icon"><el-icon><User /></el-icon></div>
              <div class="stat-body">
                <div class="stat-value">{{ statistics.activeCards }}</div>
                <div class="stat-label">活跃会员</div>
              </div>
            </div>
          </el-col>
          <el-col :xs="12" :sm="6">
            <div class="stat-card stat-card--orange">
              <div class="stat-icon"><el-icon><Wallet /></el-icon></div>
              <div class="stat-body">
                <div class="stat-value">¥{{ statistics.totalBalance }}</div>
                <div class="stat-label">会员余额</div>
              </div>
            </div>
          </el-col>
          <el-col :xs="12" :sm="6">
            <div class="stat-card stat-card--purple">
              <div class="stat-icon"><el-icon><TrendCharts /></el-icon></div>
              <div class="stat-body">
                <div class="stat-value">¥{{ statistics.monthRecharge }}</div>
                <div class="stat-label">本月充值</div>
              </div>
            </div>
          </el-col>
        </el-row>

        <el-card shadow="never">
          <!-- 搜索区域 -->
          <el-form :model="queryParams" ref="queryRef" :inline="true" label-width="80px">
            <el-form-item label="会员卡号" prop="cardNo">
              <el-input v-model="queryParams.cardNo" placeholder="请输入卡号" clearable style="width:160px" @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="客户姓名" prop="ownerName">
              <el-input v-model="queryParams.ownerName" placeholder="请输入客户姓名" clearable style="width:140px" @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="会员等级" prop="cardLevel">
              <el-select v-model="queryParams.cardLevel" placeholder="请选择" clearable style="width:120px">
                <el-option label="普通卡" :value="0" />
                <el-option label="银卡" :value="1" />
                <el-option label="金卡" :value="2" />
                <el-option label="钻石卡" :value="3" />
              </el-select>
            </el-form-item>
            <el-form-item label="状态" prop="status">
              <el-select v-model="queryParams.status" placeholder="请选择" clearable style="width:100px">
                <el-option label="正常" :value="1" />
                <el-option label="挂失" :value="2" />
                <el-option label="注销" :value="0" />
              </el-select>
            </el-form-item>
            <el-form-item>
              <el-button type="primary" icon="Search" @click="handleQuery">搜索</el-button>
              <el-button icon="Refresh" @click="resetQuery">重置</el-button>
            </el-form-item>
          </el-form>

          <!-- 操作按钮 -->
          <el-row :gutter="10" class="mb8">
            <el-col :span="1.5">
              <el-button type="primary" plain icon="Plus" @click="handleOpenCard">客户开卡</el-button>
            </el-col>
            <el-col :span="1.5">
              <el-button type="success" plain icon="Wallet" @click="handleRecharge">会员充值</el-button>
            </el-col>
            <el-col :span="1.5">
              <el-button type="warning" plain icon="Download" @click="handleExport">导出</el-button>
            </el-col>
          </el-row>

          <!-- 数据表格 -->
          <el-table v-loading="loading" :data="cardList" @selection-change="handleSelectionChange">
            <el-table-column type="selection" width="55" align="center" />
            <el-table-column label="会员卡号" prop="cardNo" align="center" min-width="180"/>
            <el-table-column label="客户姓名" prop="ownerName" align="center" min-width="120">
              <template #default="scope">
                <el-link type="primary" @click="viewCustomer(scope.row)">{{ scope.row.ownerName }}</el-link>
              </template>
            </el-table-column>
            <el-table-column label="手机号" prop="ownerPhone" align="center" min-width="120"/>
            <el-table-column label="会员等级" prop="cardLevel" align="center" min-width="100">
              <template #default="scope">
                <el-tag :type="getCardLevelType(scope.row.cardLevel)" effect="dark" size="small">
                  {{ getCardLevelLabel(scope.row.cardLevel) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="卡内余额" prop="balance" align="center" min-width="100">
              <template #default="scope">
                <span class="balance-text">¥{{ scope.row.balance?.toFixed(2) || '0.00' }}</span>
              </template>
            </el-table-column>
            <el-table-column label="赠送余额" prop="giftBalance" align="center" min-width="100">
              <template #default="scope">¥{{ scope.row.giftBalance?.toFixed(2) || '0.00' }}</template>
            </el-table-column>
            <el-table-column label="累计消费" prop="totalConsume" align="center" min-width="100">
              <template #default="scope">¥{{ scope.row.totalConsume?.toFixed(2) || '0.00' }}</template>
            </el-table-column>
            <el-table-column label="累计充值" prop="totalRecharge" align="center" min-width="100">
              <template #default="scope">¥{{ scope.row.totalRecharge?.toFixed(2) || '0.00' }}</template>
            </el-table-column>
            <el-table-column label="开卡日期" prop="openDate" align="center" min-width="110" />
            <el-table-column label="状态" prop="status" align="center" min-width="80">
              <template #default="scope">
                <el-tag :type="getStatusType(scope.row.status)" size="small">
                  {{ getStatusLabel(scope.row.status) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" align="center" width="360" fixed="right">
              <template #default="scope">
                <el-button link type="primary" icon="View" @click="handleView(scope.row)">详情</el-button>
                <el-button link type="success" icon="Wallet" @click="handleRechargeRow(scope.row)">充值</el-button>
                <el-button link type="success" icon="Document" @click="viewRecords(scope.row)">消费记录</el-button>
                <el-dropdown @command="(cmd) => handleCommand(cmd, scope.row)">
                  <el-button link type="primary">
                    更多<el-icon class="el-icon--right"><ArrowDown /></el-icon>
                  </el-button>
                  <template #dropdown>
                    <el-dropdown-menu>
                      <el-dropdown-item command="consume" :disabled="scope.row.status !== 1">消费</el-dropdown-item>
                      <el-dropdown-item command="loss" :disabled="scope.row.status !== 1">挂失</el-dropdown-item>
                      <el-dropdown-item command="unloss" :disabled="scope.row.status !== 2">解挂</el-dropdown-item>
                      <el-dropdown-item command="cancel" :disabled="scope.row.status === 0">注销</el-dropdown-item>
                    </el-dropdown-menu>
                  </template>
                </el-dropdown>
              </template>
            </el-table-column>
          </el-table>

          <pagination v-show="total > 0" :total="total" v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize" @pagination="getList" />
        </el-card>
      </el-tab-pane>

      <!-- 卡套餐设置 -->
      <el-tab-pane label="卡套餐设置" name="packages">
        <el-card shadow="never">
          <!-- 操作按钮 -->
          <el-row :gutter="10" class="mb8">
            <el-col :span="1.5">
              <el-button type="primary" plain icon="Plus" @click="handleAddPackage">新增套餐</el-button>
            </el-col>
          </el-row>

          <!-- 套餐表格 -->
          <el-table v-loading="packageLoading" :data="packageList">
            <el-table-column label="套餐名称" prop="name" align="center">
              <template #default="scope">
                <div class="package-name">
                  <span>{{ scope.row.name }}</span>
                  <el-tag v-if="scope.row.isHot" type="danger" size="small" effect="dark" class="hot-tag">热销</el-tag>
                </div>
              </template>
            </el-table-column>
            <el-table-column label="会员等级" prop="cardLevel" align="center" width="100">
              <template #default="scope">
                <el-tag :type="getCardLevelType(scope.row.cardLevel)" effect="dark" size="small">
                  {{ getCardLevelLabel(scope.row.cardLevel) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="原始金额" prop="originalAmount" align="center" width="120">
              <template #default="scope">
                <span class="original-price">¥{{ scope.row.originalAmount }}</span>
              </template>
            </el-table-column>
            <el-table-column label="优惠金额" prop="discountAmount" align="center" width="120">
              <template #default="scope">
                <span class="discount-price">¥{{ scope.row.discountAmount }}</span>
              </template>
            </el-table-column>
            <el-table-column label="实际金额" prop="actualAmount" align="center" width="120">
              <template #default="scope">
                <span class="actual-price">¥{{ scope.row.actualAmount }}</span>
              </template>
            </el-table-column>
            <el-table-column label="赠送金额" prop="giftAmount" align="center" width="100">
              <template #default="scope">
                <span v-if="scope.row.giftAmount > 0" class="gift-text">+¥{{ scope.row.giftAmount }}</span>
                <span v-else>-</span>
              </template>
            </el-table-column>
            <el-table-column label="卡服务说明" prop="description" align="center" show-overflow-tooltip />
            <el-table-column label="状态" prop="status" align="center" width="80">
              <template #default="scope">
                <el-switch v-model="scope.row.status" :active-value="1" :inactive-value="0" @change="handlePackageStatusChange(scope.row)" />
              </template>
            </el-table-column>
            <el-table-column label="操作" align="center" width="250" fixed="right">
              <template #default="scope">
                <el-button link type="primary" icon="Edit" @click="handleEditPackage(scope.row)">编辑</el-button>
                <el-button link type="danger" icon="Delete" @click="handleDeletePackage(scope.row)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-tab-pane>
    </el-tabs>

    <!-- 开卡对话框 -->
    <el-dialog title="客户开卡" v-model="openCardDialog" width="600px" append-to-body>
      <el-form ref="openCardRef" :model="openCardForm" :rules="openCardRules" label-width="100px">
        <el-form-item label="选择客户" prop="ownerId">
          <el-select v-model="openCardForm.ownerId" placeholder="请输入姓名或手机号搜索" style="width:100%"
            filterable remote :remote-method="remoteSearchCustomer" :loading="customerLoading">
            <el-option v-for="c in customerOptions" :key="c.id"
              :label="`${c.nickname || c.certiName || '-'} (${c.mobile})`" :value="c.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="选择套餐" prop="packageId">
          <el-select v-model="openCardForm.packageId" placeholder="请选择会员卡套餐" style="width:100%" @change="onPackageChange">
            <el-option v-for="p in enabledPackages" :key="p.id" :label="p.name" :value="p.id">
              <div class="package-option">
                <span class="name">{{ p.name }}</span>
                <span class="price">¥{{ p.actualAmount }}</span>
                <el-tag v-if="p.giftAmount > 0" type="success" size="small">赠{{ p.giftAmount }}</el-tag>
              </div>
            </el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="套餐详情" v-if="selectedPackage">
          <div class="package-detail">
            <div class="detail-row">
              <span class="label">会员等级：</span>
              <el-tag :type="getCardLevelType(selectedPackage.cardLevel)" effect="dark" size="small">
                {{ getCardLevelLabel(selectedPackage.cardLevel) }}
              </el-tag>
            </div>
            <div class="detail-row">
              <span class="label">原始金额：</span>
              <span class="original-price">¥{{ selectedPackage.originalAmount }}</span>
            </div>
            <div class="detail-row">
              <span class="label">优惠金额：</span>
              <span class="discount-price">-¥{{ selectedPackage.discountAmount }}</span>
            </div>
            <div class="detail-row highlight">
              <span class="label">实付金额：</span>
              <span class="actual-price">¥{{ selectedPackage.actualAmount }}</span>
            </div>
            <div class="detail-row" v-if="selectedPackage.giftAmount > 0">
              <span class="label">赠送金额：</span>
              <span class="gift-text">+¥{{ selectedPackage.giftAmount }}</span>
            </div>
            <div class="detail-row" v-if="selectedPackage.description">
              <span class="label">服务说明：</span>
              <span class="desc">{{ selectedPackage.description }}</span>
            </div>
          </div>
        </el-form-item>
        <el-form-item label="支付方式" prop="payMethod">
          <el-radio-group v-model="openCardForm.payMethod">
            <el-radio label="wechat">微信</el-radio>
            <el-radio label="alipay">支付宝</el-radio>
            <el-radio label="cash">现金</el-radio>
            <el-radio label="card">银行卡</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="openCardForm.remark" type="textarea" :rows="2" placeholder="备注信息" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button type="primary" @click="submitOpenCard">确认开卡</el-button>
        <el-button @click="openCardDialog = false">取消</el-button>
      </template>
    </el-dialog>

    <!-- 充值卡号搜索弹窗 -->
    <el-dialog title="会员充值" v-model="rechargeSearchDialog" width="360px" append-to-body>
      <el-form @submit.prevent="confirmRechargeSearch">
        <el-form-item label="会员卡号" label-width="80px">
          <el-input v-model="rechargeSearchCardNo" placeholder="请输入会员卡号" clearable @keyup.enter="confirmRechargeSearch">
            <template #append><el-button icon="Search" @click="confirmRechargeSearch" /></template>
          </el-input>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button type="primary" @click="confirmRechargeSearch">查询并充值</el-button>
        <el-button @click="rechargeSearchDialog = false">取消</el-button>
      </template>
    </el-dialog>

    <!-- 消费弹窗 -->
    <el-dialog title="会员消费" v-model="consumeDialog" width="500px" append-to-body>
      <el-form ref="consumeRef" :model="consumeForm" :rules="consumeRules" label-width="100px">
        <el-form-item label="会员卡号">
          <el-input :value="consumeForm.cardNo" disabled />
        </el-form-item>
        <el-form-item label="客户姓名">
          <el-input :value="consumeForm.customerName" disabled />
        </el-form-item>
        <el-form-item label="当前余额">
          <span class="balance-text">¥{{ consumeForm.currentBalance }}</span>
          <span style="margin-left:16px;color:#9747FF;font-size:13px" v-if="Number(consumeForm.giftBalance) > 0">赠送余额: ¥{{ consumeForm.giftBalance }}</span>
        </el-form-item>
        <el-form-item label="消费金额" prop="amount">
          <el-input-number v-model="consumeForm.amount" :min="0.01" :precision="2" style="width:200px" />
        </el-form-item>
        <el-form-item label="服务类型" prop="serviceType">
          <el-radio-group v-model="consumeForm.serviceType">
            <el-radio label="boarding">康养服务</el-radio>
            <el-radio label="grooming">照护服务</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="使用赠送金">
          <el-switch v-model="consumeForm.useGift" :disabled="Number(consumeForm.giftBalance) <= 0" />
          <span class="form-tip">（可用赠送余额: ¥{{ consumeForm.giftBalance }}）</span>
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="consumeForm.remark" type="textarea" :rows="2" placeholder="备注信息" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button type="primary" @click="submitConsume">确认消费</el-button>
        <el-button @click="consumeDialog = false">取消</el-button>
      </template>
    </el-dialog>

    <!-- 充值对话框 -->
    <el-dialog title="会员充值" v-model="rechargeDialog" width="450px" append-to-body>
      <el-form ref="rechargeRef" :model="rechargeForm" :rules="rechargeRules" label-width="100px">
        <el-form-item label="会员卡号">
          <el-input :value="rechargeForm.cardNo" disabled />
        </el-form-item>
        <el-form-item label="客户姓名">
          <el-input :value="rechargeForm.customerName" disabled />
        </el-form-item>
        <el-form-item label="当前余额">
          <span class="balance-text">¥{{ rechargeForm.currentBalance }}</span>
        </el-form-item>
        <el-form-item label="充值金额" prop="amount">
          <el-input-number v-model="rechargeForm.amount" :min="1" :precision="2" style="width:200px" />
        </el-form-item>
        <el-form-item label="赠送金额">
          <el-input-number v-model="rechargeForm.giftAmount" :min="0" :precision="2" style="width:200px" />
        </el-form-item>
        <el-form-item label="支付方式" prop="payMethod">
          <el-radio-group v-model="rechargeForm.payMethod">
            <el-radio label="wechat">微信</el-radio>
            <el-radio label="alipay">支付宝</el-radio>
            <el-radio label="cash">现金</el-radio>
            <el-radio label="card">银行卡</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="rechargeForm.remark" type="textarea" :rows="2" placeholder="备注信息" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button type="primary" @click="submitRecharge">确认充值</el-button>
        <el-button @click="rechargeDialog = false">取消</el-button>
      </template>
    </el-dialog>

    <!-- 套餐编辑对话框 -->
    <el-dialog :title="packageDialogTitle" v-model="packageDialog" width="550px" append-to-body>
      <el-form ref="packageRef" :model="packageForm" :rules="packageRules" label-width="100px">
        <el-form-item label="套餐名称" prop="name">
          <el-input v-model="packageForm.name" placeholder="如：金卡充值套餐A" />
        </el-form-item>
        <el-form-item label="会员等级" prop="cardLevel">
          <el-select v-model="packageForm.cardLevel" placeholder="请选择" style="width:100%">
            <el-option label="普通卡" :value="0" />
            <el-option label="银卡" :value="1" />
            <el-option label="金卡" :value="2" />
            <el-option label="钻石卡" :value="3" />
          </el-select>
        </el-form-item>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="原始金额" prop="originalAmount">
              <el-input-number v-model="packageForm.originalAmount" :min="0" :precision="2" style="width:100%" @change="calculateActual" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="优惠金额" prop="discountAmount">
              <el-input-number v-model="packageForm.discountAmount" :min="0" :precision="2" style="width:100%" @change="calculateActual" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="实际金额">
              <span class="actual-price large">¥{{ packageForm.actualAmount }}</span>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="赠送金额">
              <el-input-number v-model="packageForm.giftAmount" :min="0" :precision="2" style="width:100%" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="服务说明" prop="description">
          <el-input v-model="packageForm.description" type="textarea" :rows="3" placeholder="如：有效期12个月，可叠加使用，不可退换等" />
        </el-form-item>
        <el-form-item label="热销推荐">
          <el-switch v-model="packageForm.isHot" :active-value="1" :inactive-value="0" />
        </el-form-item>
        <el-form-item label="状态">
          <el-radio-group v-model="packageForm.status">
            <el-radio :label="1">启用</el-radio>
            <el-radio :label="0">禁用</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button type="primary" @click="submitPackage">确定</el-button>
        <el-button @click="packageDialog = false">取消</el-button>
      </template>
    </el-dialog>

    <!-- 详情对话框 -->
    <el-dialog title="会员卡详情" v-model="detailDialog" width="700px" append-to-body>
      <el-descriptions :column="2" border>
        <el-descriptions-item label="会员卡号">{{ cardDetail.cardNo }}</el-descriptions-item>
        <el-descriptions-item label="会员等级">
          <el-tag :type="getCardLevelType(cardDetail.cardLevel)" effect="dark">{{ getCardLevelLabel(cardDetail.cardLevel) }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="客户姓名">{{ cardDetail.ownerName }}</el-descriptions-item>
        <el-descriptions-item label="手机号">{{ cardDetail.ownerPhone }}</el-descriptions-item>
        <el-descriptions-item label="卡内余额">
          <span class="balance-text">¥{{ cardDetail.balance }}</span>
        </el-descriptions-item>
        <el-descriptions-item label="赠送余额">¥{{ cardDetail.giftBalance }}</el-descriptions-item>
        <el-descriptions-item label="累计充值">¥{{ cardDetail.totalRecharge }}</el-descriptions-item>
        <el-descriptions-item label="累计消费">¥{{ cardDetail.totalConsume }}</el-descriptions-item>
        <el-descriptions-item label="开卡日期">{{ cardDetail.openDate }}</el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag :type="getStatusType(cardDetail.status)">{{ getStatusLabel(cardDetail.status) }}</el-tag>
        </el-descriptions-item>
      </el-descriptions>
    </el-dialog>
  </div>
</template>

<script setup name="ResidentCard">
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getResidentCardList, getResidentCardStatistics, openResidentCard, rechargeResidentCard, consumeResidentCard, toggleResidentCardStatus, exportResidentCard } from '@/api/resident/residentCard'
import { getCardPackageList, addCardPackage, updateCardPackage, deleteCardPackage, updatePackageStatus, getEnabledPackageList } from '@/api/resident/cardPackage'
import { getCustomerList } from '@/api/customer'

const router = useRouter()

// Tab状态
const activeTab = ref('cards')

// 统计数据
const statistics = reactive({
  totalCards: 0,
  activeCards: 0,
  totalBalance: '0.00',
  monthRecharge: '0.00'
})

// 列表数据
const loading = ref(false)
const cardList = ref([])
const total = ref(0)
const queryParams = reactive({
  pageNum: 1, pageSize: 10,
  cardNo: undefined, ownerName: undefined, cardLevel: undefined, status: undefined
})

// 客户选项（远程搜索）
const customerOptions = ref([])
const customerLoading = ref(false)
function remoteSearchCustomer(query) {
  if (!query) return
  customerLoading.value = true
  getCustomerList({ pageNum: 1, pageSize: 20, name: query }).then(res => {
    const list = (res.data?.list || res.data?.records || [])
    customerOptions.value = list.map(c => ({
      id: c.id,
      nickname: c.nickname,
      certiName: c.certiName,
      mobile: c.mobile
    }))
  }).finally(() => { customerLoading.value = false })
}

// 启用的套餐列表
const enabledPackages = ref([])

// 开卡对话框
const openCardDialog = ref(false)
const openCardRef = ref(null)
const openCardForm = ref({
  ownerId: undefined,
  packageId: undefined,
  payMethod: 'wechat',
  remark: ''
})
const openCardRules = {
  ownerId: [{ required: true, message: '请选择客户', trigger: 'change' }],
  packageId: [{ required: true, message: '请选择会员卡套餐', trigger: 'change' }],
  payMethod: [{ required: true, message: '请选择支付方式', trigger: 'change' }]
}

// 选中的套餐
const selectedPackage = computed(() => {
  if (!openCardForm.value.packageId) return null
  return enabledPackages.value.find(p => p.id === openCardForm.value.packageId)
})

// 套餐变化
function onPackageChange(packageId) {
  // 套餐选中后自动填充信息
}

// 充值对话框
const rechargeDialog = ref(false)
const rechargeRef = ref(null)
const rechargeForm = ref({
  cardId: undefined,
  cardNo: '',
  customerName: '',
  currentBalance: '0.00',
  amount: 0,
  giftAmount: 0,
  payMethod: 'wechat',
  remark: ''
})
const rechargeRules = {
  amount: [{ required: true, message: '请输入充值金额', trigger: 'blur' }],
  payMethod: [{ required: true, message: '请选择支付方式', trigger: 'change' }]
}

// 详情对话框
const detailDialog = ref(false)
const cardDetail = ref({})

// 套餐管理
const packageLoading = ref(false)
const packageList = ref([])
const packageDialog = ref(false)
const packageDialogTitle = ref('新增套餐')
const packageRef = ref(null)
const packageForm = ref({
  id: undefined,
  name: '',
  cardLevel: 0,
  originalAmount: 1000,
  discountAmount: 0,
  actualAmount: 1000,
  giftAmount: 0,
  description: '',
  isHot: 0,
  status: 1
})
const packageRules = {
  name: [{ required: true, message: '请输入套餐名称', trigger: 'blur' }],
  cardLevel: [{ required: true, message: '请选择会员等级', trigger: 'change' }],
  originalAmount: [{ required: true, message: '请输入原始金额', trigger: 'blur' }]
}

// 计算实际金额
function calculateActual() {
  packageForm.value.actualAmount = packageForm.value.originalAmount - packageForm.value.discountAmount
}

// Tab切换
function handleTabChange(tab) {
  if (tab === 'packages') {
    getPackageList()
  }
}

// 获取列表
function getList() {
  loading.value = true
  getResidentCardList(queryParams).then(res => {
    const d = res.data || {}
    cardList.value = d.list || []
    total.value = d.total || 0
    loading.value = false
  }).catch(() => {
    loading.value = false
  })
}

// 获取统计
function getStatistics() {
  getResidentCardStatistics().then(res => {
    const d = res.data || {}
    statistics.totalCards = d.totalCards || 0
    statistics.activeCards = d.activeCards || 0
    statistics.totalBalance = Number(d.totalBalance || 0).toFixed(2)
    statistics.monthRecharge = Number(d.monthRecharge || 0).toFixed(2)
  })
}

// 获取套餐列表
function getPackageList() {
  packageLoading.value = true
  getCardPackageList({chargeKind: 0, pageNum: 1, pageSize: 100 }).then(res => {
    const d = res.data || {}
    packageList.value = d.list || []
    packageLoading.value = false
    enabledPackages.value = packageList.value.filter(p => p.status === 1)
  }).catch(() => {
    packageLoading.value = false
  })
}

// 加载启用套餐列表
function loadEnabledPackages() {
  getEnabledPackageList().then(res => {
    enabledPackages.value = res.data || []
  }).catch(() => {})
}

// 搜索
function handleQuery() {
  queryParams.pageNum = 1
  getList()
}

// 重置
function resetQuery() {
  queryParams.cardNo = undefined
  queryParams.ownerName = undefined
  queryParams.cardLevel = undefined
  queryParams.status = undefined
  handleQuery()
}

// 多选
function handleSelectionChange() {}

// 开卡
function handleOpenCard() {
  openCardForm.value = {
    ownerId: undefined,
    packageId: undefined,
    payMethod: 'wechat',
    remark: ''
  }
  // 加载启用的套餐
  loadEnabledPackages()
  openCardDialog.value = true
}

// 提交开卡
function submitOpenCard() {
  openCardRef.value?.validate(valid => {
    if (valid) {
      const pkg = selectedPackage.value
      const data = {
        ownerId: openCardForm.value.ownerId,
        packageId: openCardForm.value.packageId,
        cardLevel: pkg ? pkg.cardLevel : 0,
        openAmount: pkg ? pkg.actualAmount : 0,
        giftBalance: pkg ? pkg.giftAmount : 0,
        payMethod: openCardForm.value.payMethod,
        remark: openCardForm.value.remark
      }
      openResidentCard(data).then(() => {
        ElMessage.success('开卡成功')
        openCardDialog.value = false
        getList()
        getStatistics()
      }).catch(() => {
        ElMessage.error('开卡失败')
      })
    }
  })
}

// 充值（顶部按钮：弹出输入卡号搜索框）
const rechargeSearchDialog = ref(false)
const rechargeSearchCardNo = ref('')
function handleRecharge() {
  rechargeSearchCardNo.value = ''
  rechargeSearchDialog.value = true
}
function confirmRechargeSearch() {
  if (!rechargeSearchCardNo.value) {
    ElMessage.warning('请输入会员卡号')
    return
  }
  getResidentCardList({ cardNo: rechargeSearchCardNo.value, pageNum: 1, pageSize: 1 }).then(res => {
    const records = (res.data || {}).list || []
    if (records.length > 0) {
      rechargeSearchDialog.value = false
      handleRechargeRow(records[0])
    } else {
      ElMessage.warning('未找到对应会员卡')
    }
  }).catch(() => ElMessage.error('查询失败'))
}

function handleRechargeRow(row) {
  rechargeForm.value = {
    cardId: row.id,
    cardNo: row.cardNo,
    customerName: row.ownerName,
    currentBalance: row.balance?.toFixed(2) || '0.00',
    amount: 0,
    giftAmount: 0,
    payMethod: 'wechat',
    remark: ''
  }
  rechargeDialog.value = true
}

// 提交充値
function submitRecharge() {
  rechargeRef.value?.validate(valid => {
    if (valid) {
      rechargeResidentCard(rechargeForm.value).then(() => {
        ElMessage.success('充値成功')
        rechargeDialog.value = false
        getList()
        getStatistics()
      }).catch(() => {
        ElMessage.error('充値失败')
      })
    }
  })
}

// 查看详情
function handleView(row) {
  cardDetail.value = {
    ...row,
    balance: row.balance?.toFixed(2),
    giftBalance: row.giftBalance?.toFixed(2),
    totalRecharge: row.totalRecharge?.toFixed(2),
    totalConsume: row.totalConsume?.toFixed(2),
    recentRecords: []
  }
  detailDialog.value = true
}

// 查看客户
function viewCustomer(row) {
  router.push('/customer/detail/' + row.ownerId)
}

// 查看消费记录
function viewRecords(row) {
  router.push(`/customer/residentCard/records?cardId=${row.id}&cardNo=${row.cardNo}&ownerName=${row.ownerName}`)
}

// 消费弹窗
const consumeDialog = ref(false)
const consumeRef = ref(null)
const consumeForm = ref({
  cardId: undefined,
  cardNo: '',
  customerName: '',
  currentBalance: '0.00',
  giftBalance: '0.00',
  amount: 0,
  serviceType: 'boarding',
  useGift: false,
  remark: ''
})
const consumeRules = {
  amount: [{ required: true, type: 'number', min: 0.01, message: '请输入消费金额', trigger: 'blur' }],
  serviceType: [{ required: true, message: '请选择服务类型', trigger: 'change' }]
}
function openConsumeDialog(row) {
  consumeForm.value = {
    cardId: row.id,
    cardNo: row.cardNo,
    customerName: row.ownerName,
    currentBalance: row.balance?.toFixed(2) || '0.00',
    giftBalance: row.giftBalance?.toFixed(2) || '0.00',
    amount: 0,
    serviceType: 'boarding',
    useGift: false,
    remark: ''
  }
  consumeDialog.value = true
}
function submitConsume() {
  consumeRef.value?.validate(valid => {
    if (valid) {
      consumeResidentCard(consumeForm.value).then(() => {
        ElMessage.success('消费成功')
        consumeDialog.value = false
        getList()
        getStatistics()
      }).catch(() => ElMessage.error('消费失败'))
    }
  })
}

// 下拉命令
function handleCommand(cmd, row) {
  switch (cmd) {
    case 'consume':
      openConsumeDialog(row)
      break
    case 'loss':
      ElMessageBox.confirm('确认挂失该会员卡吗？', '提示', { type: 'warning' }).then(() => {
        toggleResidentCardStatus(row.id, 2).then(() => {
          ElMessage.success('挂失成功')
          getList()
        })
      })
      break
    case 'unloss':
      ElMessageBox.confirm('确认解挂该会员卡吗？', '提示', { type: 'warning' }).then(() => {
        toggleResidentCardStatus(row.id, 1).then(() => {
          ElMessage.success('解挂成功')
          getList()
        })
      })
      break
    case 'cancel':
      ElMessageBox.confirm('确认注销该会员卡吗？此操作不可恢复！', '警告', { type: 'warning' }).then(() => {
        toggleResidentCardStatus(row.id, 0).then(() => {
          ElMessage.success('注销成功')
          getList()
        })
      })
      break
  }
}

// 导出
function handleExport() {
  exportResidentCard(queryParams).then(res => {
    const blob = new Blob([res], { type: 'application/vnd.ms-excel' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = '会员卡列表.xlsx'; a.click()
    URL.revokeObjectURL(url)
  }).catch(() => ElMessage.warning('导出失败'))
}

// 新增套餐
function handleAddPackage() {
  packageDialogTitle.value = '新增套餐'
  packageForm.value = {
    id: undefined,
    name: '',
    chargeKind: 0,
    cardLevel: 0,
    originalAmount: 1000,
    discountAmount: 0,
    actualAmount: 1000,
    giftAmount: 0,
    description: '',
    isHot: 0,
    status: 1
  }
  packageDialog.value = true
}

// 编辑套餐
function handleEditPackage(row) {
  packageDialogTitle.value = '编辑套餐'
  packageForm.value = { ...row }
  packageDialog.value = true
}

// 删除套餐
function handleDeletePackage(row) {
  ElMessageBox.confirm(`确认删除套餐"${row.name}"吗？`, '提示', { type: 'warning' }).then(() => {
    deleteCardPackage(row.id).then(() => {
      ElMessage.success('删除成功')
      getPackageList()
    }).catch(() => {
      ElMessage.success('删除成功')
      packageList.value = packageList.value.filter(p => p.id !== row.id)
    })
  })
}

// 套餐状态变化
function handlePackageStatusChange(row) {
  updatePackageStatus(row.id, row.status).then(() => {
    ElMessage.success(row.status === 1 ? '已启用' : '已禁用')
  }).catch(() => {
    row.status = row.status === 1 ? 0 : 1 // 回滚
    ElMessage.error('操作失败')
  })
}

// 提交套餐
function submitPackage() {
  packageRef.value?.validate(valid => {
    if (valid) {
      const api = packageForm.value.id ? updateCardPackage : addCardPackage
      api(packageForm.value).then(() => {
        ElMessage.success(packageForm.value.id ? '修改成功' : '新增成功')
        packageDialog.value = false
        getPackageList()
      }).catch(() => {
        ElMessage.error('操作失败')
      })
    }
  })
}

// 等级类型
function getCardLevelType(level) {
  const map = { 0: '', 1: 'info', 2: 'warning', 3: 'danger' }
  return map[level] ?? ''
}

function getCardLevelLabel(level) {
  const map = { 0: '普通卡', 1: '银卡', 2: '金卡', 3: '钻石卡' }
  return map[level] ?? '未知'
}

// 状态类型
function getStatusType(status) {
  const map = { 1: 'success', 2: 'warning', 0: 'info' }
  return map[status] || 'info'
}

function getStatusLabel(status) {
  const map = { 1: '正常', 2: '挂失', 0: '注销' }
  return map[status] || '未知'
}

onMounted(() => {
  getList()
  getStatistics()
  getPackageList()
})
</script>

<style scoped>
.app-container { padding: 20px; }

/* Tab样式 */
.main-tabs { margin-bottom: 0; }
.main-tabs :deep(.el-tabs__header) { margin-bottom: 16px; }

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

.balance-text { color: #409EFF; font-weight: 600; }
.text-success { color: #67C23A; }
.text-danger { color: #F56C6C; }

/* 套餐名称 */
.package-name { }
.hot-tag { font-size: 10px; margin-left: 6px;}

/* 价格样式 */
.original-price { color: #909399; text-decoration: line-through; }
.discount-price { color: #F56C6C; }
.actual-price { color: #409EFF; font-weight: 600; }
.actual-price.large { font-size: 18px; }
.gift-text { color: #9747FF; font-weight: 600; }

/* 套餐下拉选项 */
.package-option { display: flex; align-items: center; gap: 8px; width: 100%; }
.package-option .name { flex: 1; }
.package-option .price { color: #409EFF; font-weight: 600; }

/* 套餐详情 */
.package-detail {
  background: #f7f8fa;
  border-radius: 8px;
  padding: 12px 16px;
}
.detail-row {
  display: flex;
  align-items: center;
  padding: 6px 0;
}
.detail-row .label { color: #86909c; width: 80px; }
.detail-row.highlight { background: #e8f4ff; margin: 8px -16px; padding: 8px 16px; border-radius: 4px; }
.detail-row .desc { color: #1d2129; flex: 1; }
.form-tip { color: #909399; font-size: 12px; margin-left: 8px; }
</style>
