<template>
  <div class="app-container">
    <el-card shadow="never">
      <!-- 搜索栏 -->
      <el-form :model="queryParams" ref="queryFormRef" :inline="true" label-width="88px">
        <el-form-item label="商品名称" prop="productName">
          <el-input v-model="queryParams.productName" placeholder="请输入商品名称" clearable @keyup.enter="handleQuery" />
        </el-form-item>
        <el-form-item label="SKU编码" prop="skuCode">
          <el-input v-model="queryParams.skuCode" placeholder="请输入SKU编码" clearable @keyup.enter="handleQuery" />
        </el-form-item>
        <el-form-item label="库存状态" prop="stockStatus">
          <el-select v-model="queryParams.stockStatus" placeholder="全部" clearable style="width:120px">
            <el-option label="正常" value="normal" />
            <el-option label="预警" value="warning" />
            <el-option label="缺货" value="out_of_stock" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleQuery">搜索</el-button>
          <el-button @click="resetQuery">重置</el-button>
        </el-form-item>
      </el-form>
      <el-tabs v-model="activeCategory" @tab-click="handleCategoryChange">
            <el-tab-pane label="全部" name="all" />
            <el-tab-pane
              v-for="cat in categories"
              :key="cat.id"
              :label="cat.categoryName"
              :name="String(cat.id)"
            />
          </el-tabs>

      <!-- 预警提示 -->
      <el-alert
        v-if="warningCount > 0"
        :title="`库存预警: ${warningCount} 个SKU库存不足，请及时补货`"
        type="warning"
        :closable="false"
        style="margin-bottom: 16px"
      />

      <!-- 表格 -->
      <el-table v-loading="loading" :data="stockList" stripe border>
        <el-table-column label="SKU编码" prop="skuCode" min-width="120" />
        <el-table-column label="商品名称" prop="productName" show-overflow-tooltip min-width="220"/>
        <el-table-column label="规格" prop="specText" min-width="150" show-overflow-tooltip />
        <el-table-column label="单位" prop="unit" width="60" align="center" />
        <el-table-column label="当前库存" prop="totalStock" min-width="120" align="center" sortable>
          <template #default="{ row }">
            <span :class="getStockClass(row)">{{ row.totalStock }}</span>
          </template>
        </el-table-column>
        <el-table-column label="预警库存" prop="warningStock" min-width="100" align="center" />
        <el-table-column label="进货价" prop="purchasePrice" min-width="90" align="right">
          <template #default="{ row }">¥{{ row.purchasePrice }}</template>
        </el-table-column>
        <el-table-column label="销售价" prop="salePrice" width="90" align="right">
          <template #default="{ row }">¥{{ row.salePrice }}</template>
        </el-table-column>
        <el-table-column label="库存状态" width="120" align="center">
          <template #default="{ row }">
            <el-tag :type="getStockStatusType(row)">{{ getStockStatusText(row) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" align="center" width="140" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" size="small" @click="handleViewBatches(row)">查看批次</el-button>
            <el-button link type="warning" size="small" @click="handleStockIn(row)">入库</el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <pagination v-show="total > 0" :total="total" v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize" @pagination="getList" />
    </el-card>

    <!-- 批次详情对话框 -->
    <el-dialog v-model="batchDialogVisible" title="批次详情" width="90%" append-to-body>
      <el-table :data="batchList" stripe border>
        <el-table-column label="批次号" prop="batchNo" min-width="150" />
        <el-table-column label="库存" prop="stockQuantity" min-width="80" align="center" />
        <el-table-column label="进货价" prop="purchasePrice" min-width="90" align="right">
          <template #default="{ row }">¥{{ row.purchasePrice }}</template>
        </el-table-column>
        <el-table-column label="进货日期" prop="purchaseDate" min-width="110" />
        <el-table-column label="生产日期" prop="productionDate" min-width="110" />
        <el-table-column label="过期日期" width="110">
          <template #default="{ row }">
            <span :class="{ 'text-danger': isExpiring(row.expiryDate) }">{{ row.expiryDate || '-' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="供应商" prop="customerName" show-overflow-tooltip />
        <el-table-column label="状态" width="120" align="center">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : row.status === 2 ? 'danger' : 'info'">
              {{ row.status === 1 ? '在库' : row.status === 2 ? '已过期' : '已耗尽' }}
            </el-tag>
          </template>
        </el-table-column>
      </el-table>
      <template #footer>
        <el-button @click="batchDialogVisible = false">关 闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { useRouter } from 'vue-router'
import { getStockList, getBatchList } from '@/api/wms/product'
import { getCategoryList } from '@/api/wms/product'
const router = useRouter()
const activeCategory = ref('all')
const loading = ref(false)
const total = ref(0)
const stockList = ref([])
const warningCount = ref(0)
const batchDialogVisible = ref(false)
const batchList = ref([])
const categories = ref([])
const queryParams = reactive({ pageNum: 1, pageSize: 10, productName: '', skuCode: '', stockStatus: '' })
async function loadCategories() {
  try {
    const res = await getCategoryList({ pageNum: 1, pageSize: 100 })
    const data = res.data || res
    categories.value = Array.isArray(data) ? data : (data.list || data.records || data.rows || [])
  } catch (error) {
    console.error('加载分类失败:', error)
  }
}
async function getList() {
  loading.value = true
  try {
    const res = await getStockList(queryParams)
    const data = res.data || res
    stockList.value = Array.isArray(data) ? data : (data.list || data.records || [])
    total.value = data.total || stockList.value.length
    warningCount.value = stockList.value.filter(item => item.totalStock <= item.warningStock && item.totalStock > 0).length
  } catch (e) {
    console.error('加载库存失败:', e)
    ElMessage.error('加载库存失败')
  } finally {
    loading.value = false
  }
}
function handleCategoryChange(tab) {
  activeCategory.value = tab.paneName || tab.name || 'all'
  queryParams.pageNum = 1
  queryParams.categoryId = activeCategory.value === 'all' ? null : activeCategory.value
  getList()
}

function getStockClass(row) {
  if (row.totalStock === 0) return 'text-danger'
  if (row.totalStock <= row.warningStock) return 'text-warning'
  return ''
}
function getStockStatusType(row) {
  if (row.totalStock === 0) return 'danger'
  if (row.totalStock <= row.warningStock) return 'warning'
  return 'success'
}
function getStockStatusText(row) {
  if (row.totalStock === 0) return '缺货'
  if (row.totalStock <= row.warningStock) return '预警'
  return '正常'
}
function isExpiring(expiryDate) {
  if (!expiryDate) return false
  const diffDays = Math.ceil((new Date(expiryDate) - new Date()) / 86400000)
  return diffDays <= 30
}

async function handleViewBatches(row) {
  try {
    const res = await getBatchList({ skuId: row.id, pageNum: 1, pageSize: 100 })
    const data = res.data || res
    batchList.value = Array.isArray(data) ? data : (data.list || data.records || [])
    batchDialogVisible.value = true
  } catch (e) {
    ElMessage.error('加载批次失败')
  }
}

function handleStockIn(row) {
  // 跳转到进货台进行入库，携带当前SKU便于预填
  router.push({ path: '/wms/purchase-checkout', query: { skuId: row?.id } })
}

function handleQuery() { queryParams.pageNum = 1; getList() }
function resetQuery() { Object.assign(queryParams, { pageNum: 1, productName: '', skuCode: '', stockStatus: '' }); getList() }



onMounted(() => {
  loadCategories()
  getList()
})

</script>

<style scoped>
.text-danger { color: #f56c6c; font-weight: 600; }
.text-warning { color: #e6a23c; font-weight: 600; }
</style>
