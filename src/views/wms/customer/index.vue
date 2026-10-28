<template>
  <div class="app-container">
    <el-card shadow="never">
      <!-- 类型切换 -->
      <el-tabs v-model="activeKind" @tab-click="handleKindChange" style="margin-bottom: 16px">
        <el-tab-pane label="客户管理" :name="0" />
        <el-tab-pane label="供应商管理" :name="1" />
      </el-tabs>

      <!-- 搜索栏 -->
      <el-form :model="queryParams" ref="queryFormRef" :inline="true" label-width="68px">
        <el-form-item label="客户姓名" prop="customerName">
          <el-input v-model="queryParams.customerName" :placeholder="activeKind === 1 ? '请输入供应商名称' : '请输入客户姓名'" clearable @keyup.enter="handleQuery" />
        </el-form-item>
        <el-form-item label="联系电话" prop="customerPhone">
          <el-input v-model="queryParams.customerPhone" placeholder="请输入联系电话" clearable @keyup.enter="handleQuery" />
        </el-form-item>
        <el-form-item label="客户类型" prop="customerType" v-if="activeKind === 0">
          <el-select v-model="queryParams.customerType" placeholder="全部" clearable style="width:120px">
            <el-option label="散客" value="WALK_IN" />
            <el-option label="会员" value="MEMBER" />
            <el-option label="家属" value="e_GUARDIAN" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleQuery">搜索</el-button>
          <el-button @click="resetQuery">重置</el-button>
        </el-form-item>
      </el-form>

      <!-- 操作按钮 -->
      <div class="toolbar mb8">
        <el-button type="primary" @click="handleAdd" v-hasPermi="['wms:customer:add']">
          <el-icon><Plus /></el-icon>{{ activeKind === 1 ? '新增供应商' : '新增客户' }}
        </el-button>
        <el-button type="danger" plain :disabled="!selectedIds.length" @click="handleDelete()" v-hasPermi="['wms:customer:remove']">
          <el-icon><Delete /></el-icon>删除
        </el-button>
      </div>

      <!-- 表格 -->
      <el-table v-loading="loading" :data="customerList" stripe border @selection-change="handleSelectionChange">
        <el-table-column type="selection" width="55" align="center" />
        <el-table-column label="客户姓名" prop="customerName" show-overflow-tooltip min-width="150">
          <template #default="{ row }">
            {{ activeKind === 1 ? '供应商名称' : '客户姓名' }}: {{ row.customerName }}
          </template>
        </el-table-column>
        <el-table-column label="联系电话" prop="customerPhone" min-width="130" />
        <el-table-column label="客户类型" min-width="100" align="center" v-if="activeKind === 0">
          <template #default="{ row }">
            <el-tag :type="getCustomerTypeTag(row.customerType)">{{ getCustomerTypeText(row.customerType) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="会员等级" prop="memberLevel" min-width="90" align="center" v-if="activeKind === 0" />
        <el-table-column label="会员余额" min-width="100" align="right" v-if="activeKind === 0">
          <template #default="{ row }">
            <span class="amount-green">¥{{ row.memberBalance || '0.00' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="累计消费" min-width="110" align="right" v-if="activeKind === 0">
          <template #default="{ row }">
            <span class="amount-blue">¥{{ row.totalConsumption || '0.00' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="订单数" prop="totalOrders" min-width="80" align="center" v-if="activeKind === 0" />
        <el-table-column label="最后购买" prop="lastPurchaseDate" min-width="110" v-if="activeKind === 0" />
        <el-table-column label="状态" min-width="80" align="center">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : 'danger'">{{ row.status === 1 ? '启用' : '禁用' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" align="center" width="150" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" size="small" @click="handleUpdate(row)" v-hasPermi="['wms:customer:edit']">修改</el-button>
            <el-button link type="danger" size="small" @click="handleDelete(row)" v-hasPermi="['wms:customer:remove']">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <pagination v-show="total > 0" :total="total" v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize" @pagination="getList" />
    </el-card>

    <!-- 新增/修改对话框 -->
    <el-dialog v-model="open" :title="title" width="700px" append-to-body :close-on-click-modal="false">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="客户姓名" prop="customerName">
              <el-input v-model="form.customerName" placeholder="请输入客户姓名" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="联系电话" prop="customerPhone">
              <el-input v-model="form.customerPhone" placeholder="请输入联系电话" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20" v-if="activeKind==0">
          <el-col :span="12">
            <el-form-item label="客户类型" prop="customerType">
              <el-select v-model="form.customerType" placeholder="请选择客户类型" style="width:100%">
                <el-option label="散客" value="WALK_IN" />
                <el-option label="会员" value="MEMBER" />
                <el-option label="家属" value="e_GUARDIAN" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="会员等级">
              <el-input v-model="form.memberLevel" placeholder="请输入会员等级" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <!-- <el-col :span="12" v-if="activeKind==0">
            <el-form-item label="会员余额">
              <el-input-number v-model="form.memberBalance" :precision="2" :min="0" style="width:100%" />
            </el-form-item>
          </el-col> -->
          <el-col :span="12">
            <el-form-item label="状态">
              <el-radio-group v-model="form.status">
                <el-radio :label="1">启用</el-radio>
                <el-radio :label="0">禁用</el-radio>
              </el-radio-group>
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="地址">
          <el-input v-model="form.address" placeholder="请输入地址" />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="form.remark" type="textarea" :rows="2" placeholder="请输入备注" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button type="primary" @click="submitForm">确 定</el-button>
        <el-button @click="open = false">取 消</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Delete } from '@element-plus/icons-vue'
import { getCustomerList, getCustomerDetail, submitCustomer, deleteCustomer } from '@/api/wms/customer'

const loading = ref(false)
const total = ref(0)
const customerList = ref([])
const selectedIds = ref([])
const open = ref(false)
const title = ref('')
const formRef = ref(null)
const activeKind = ref(0) // 0-客户 1-供应商
const route = useRoute()

const queryParams = reactive({ pageNum: 1, pageSize: 10, customerName: '', customerPhone: '', customerType: '', kind: 0 })
const form = reactive({ id: null, kind: 0, customerName: '', customerPhone: '', customerType: 'WALK_IN', memberLevel: '', memberBalance: 0, address: '', remark: '', status: 1 })

const rules = {
  customerName: [{ required: true, message: '客户姓名不能为空', trigger: 'blur' }],
  customerPhone: [{ required: true, message: '联系电话不能为空', trigger: 'blur' }],
  customerType: [{ required: true, message: '客户类型不能为空', trigger: 'change' }]
}

const typeTagMap = { WALK_IN: 'info', MEMBER: 'success', e_GUARDIAN: 'primary' }
const typeTextMap = { WALK_IN: '散客', MEMBER: '会员', e_GUARDIAN: '家属' }
function getCustomerTypeTag(type) { return typeTagMap[type] || 'info' }
function getCustomerTypeText(type) { return typeTextMap[type] || type }

function handleKindChange(tab) {
  activeKind.value = tab.paneName
  queryParams.kind = activeKind.value
  queryParams.pageNum = 1
  queryParams.customerName = ''
  queryParams.customerPhone = ''
  queryParams.customerType = ''
  getList()
}

function handleSelectionChange(selection) { selectedIds.value = selection.map(s => s.id) }

async function getList() {
  loading.value = true
  try {
    const res = await getCustomerList(queryParams)
    const data = res.data || res
    customerList.value = Array.isArray(data) ? data : (data.list || data.records || [])
    total.value = data.total || customerList.value.length
  } catch (e) {
    console.error('加载客户失败:', e)
    ElMessage.error('加载客户列表失败')
  } finally {
    loading.value = false
  }
}

function handleQuery() { queryParams.pageNum = 1; getList() }
function resetQuery() { Object.assign(queryParams, { pageNum: 1, customerName: '', customerPhone: '', customerType: '' }); getList() }

function handleAdd() {
  Object.assign(form, { id: null, kind: activeKind.value, customerName: '', customerPhone: '', customerType: 'WALK_IN', memberLevel: '', memberBalance: 0, address: '', remark: '', status: 1 })
  title.value = activeKind.value === 1 ? '添加供应商' : '添加客户'
  open.value = true
}

async function handleUpdate(row) {
  try {
    const res = await getCustomerDetail(row.id)
    const d = res.data || res
    Object.assign(form, { id: d.id, kind: d.kind ?? activeKind.value, customerName: d.customerName || '', customerPhone: d.customerPhone || '', customerType: d.customerType || 'WALK_IN', memberLevel: d.memberLevel || '', memberBalance: d.memberBalance || 0, address: d.address || '', remark: d.remark || '', status: d.status ?? 1 })
    title.value = activeKind.value === 1 ? '修改供应商' : '修改客户'
    open.value = true
  } catch (e) {
    ElMessage.error('获取信息失败')
  }
}

async function submitForm() {
  if (!formRef.value) return
  await formRef.value.validate()
  try {
    await submitCustomer({ ...form })
    ElMessage.success('操作成功')
    open.value = false
    getList()
  } catch (e) {
    ElMessage.error('操作失败')
  }
}

function handleDelete(row) {
  const ids = row?.id ? [row.id] : selectedIds.value
  if (!ids.length) { ElMessage.warning('请选择要删除的数据'); return }
  ElMessageBox.confirm('是否确认删除选中的客户？', '提示', { type: 'warning' }).then(async () => {
    await deleteCustomer(ids)
    ElMessage.success('删除成功')
    getList()
  }).catch(() => {})
}

onMounted(() => {
  // 检查路由参数，自动切换到供应商Tab
  const kindParam = route.query.kind
  if (kindParam !== undefined) {
    activeKind.value = parseInt(kindParam)
    queryParams.kind = activeKind.value
  }
  getList()
})
</script>

<style scoped>
.toolbar { margin-bottom: 12px; }
.amount-green { color: #67C23A; font-weight: 600; }
.amount-blue { color: #409EFF; font-weight: 600; }
</style>
