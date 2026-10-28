<template>
  <div class="app-container purchase-container">
    <el-row :gutter="20">
      <!-- 左侧：商品选择区 -->
      <el-col :span="16">
        <el-card shadow="never">
          <template #header>
            <div class="card-header">
              <span>选择商品</span>
              <el-input
                v-model="searchKey"
                placeholder="搜索商品名称/SKU编码"
                :prefix-icon="Search"
                clearable
                style="width: 300px"
                @input="filterProducts"
              />
            </div>
          </template>

          <!-- 分类Tab -->
          <el-tabs v-model="activeCategory" @tab-click="handleCategoryChange">
            <el-tab-pane label="全部" name="all" />
            <el-tab-pane
              v-for="cat in categories"
              :key="cat.id"
              :label="cat.categoryName"
              :name="String(cat.id)"
            />
          </el-tabs>

          <!-- 商品网格 -->
          <div class="product-grid" v-loading="loading">
            <div
              v-for="sku in skuList"
              :key="sku.id"
              class="product-card"
              @click="addToPurchaseList(sku)"
            >
              <div class="product-image">
                <el-image :src="sku.productImage || ''" fit="cover">
                  <template #error>
                    <div class="image-error">
                      <el-icon><Picture /></el-icon>
                    </div>
                  </template>
                </el-image>
              </div>
              <div class="product-info">
                <div class="product-name" :title="sku.skuName">{{ sku.skuName || '未命名商品' }}</div>
                <div class="product-meta">
                  <span class="product-price">进货价: ¥{{ sku.purchasePrice || '0.00' }}</span>
                  <span class="product-stock">库存: {{ sku.totalStock || 0 }}</span>
                </div>
              </div>
            </div>
            <el-empty v-if="skuList.length === 0 && !loading" description="暂无商品" />
          </div>

          <!-- 分页 -->
          <pagination
            v-show="total > 0"
            :total="total"
            v-model:page="queryParams.pageNum"
            v-model:limit="queryParams.pageSize"
            @pagination="loadSkus"
            class="product-pagination"
          />
        </el-card>
      </el-col>

      <!-- 右侧：进货单编辑区 -->
      <el-col :span="8">
        <el-card shadow="never" class="purchase-card">
          <template #header>
            <div class="card-header">
              <span>进货单</span>
              <el-button link type="danger" @click="clearPurchaseList" :disabled="purchaseItems.length === 0">清空</el-button>
            </div>
          </template>
          <!-- 进货单信息 -->

          <el-form :model="purchaseForm" label-width="80px">
            <el-form-item label="供应商" required>
              <div style="display: flex; gap: 8px; width: 100%">
                <el-select 
                  v-model="purchaseForm.customerId" 
                  filterable 
                  placeholder="选择供应商" 
                  style="flex: 1"
                  @change="handleSupplierChange"
                >
                  <el-option
                    v-for="supplier in supplierList"
                    :key="supplier.id"
                    :label="supplier.customerName + ' (' + supplier.customerPhone + ')'"
                    :value="supplier.id"
                  />
                </el-select>
                <el-button 
                round
                  type="primary" 
                  :icon="Plus" 
                  @click="handleAddSupplier"
                  title="新增供应商"
                />
              </div>
            </el-form-item>
            <el-form-item label="进货日期">
              <el-date-picker
                v-model="purchaseForm.purchaseDate"
                type="date"
                placeholder="选择日期"
                value-format="YYYY-MM-DD"
                style="width: 100%"
              />
            </el-form-item>
            <el-form-item label="备注">
              <el-input v-model="purchaseForm.remark" type="textarea" :rows="2" />
            </el-form-item>
          </el-form>

          <!-- 进货明细列表 -->
          <div class="purchase-list" v-if="purchaseItems.length > 0">
            <el-divider content-position="left">进货明细</el-divider>
            <div v-for="(item, index) in purchaseItems" :key="item.skuId" class="purchase-item">
              <div class="purchase-item-header">
                <div class="purchase-item-name">{{ item.skuName }}</div>
                <el-button link type="danger" :icon="Delete" @click="removeFromPurchaseList(index)" />
              </div>
              <div class="purchase-item-body">
                <div class="purchase-item-field">
                  <span class="field-label">数量:</span>
                  <el-input-number
                    v-model="item.quantity"
                    :min="1"
                    @change="calculateItemSubtotal(item)"
                  />
                </div>
                <div class="purchase-item-field">
                  <span class="field-label">进货价:</span>
                  <el-input-number
                    v-model="item.purchasePrice"
                    :min="0"
                    :precision="2"
                    @change="calculateItemSubtotal(item)"
                  />
                </div>
                <div class="purchase-item-field">
                  <span class="field-label">生产日期:</span>
                  <el-date-picker
                    v-model="item.productionDate"
                    type="date"
                    placeholder="选择生产日期"
                    value-format="YYYY-MM-DD"
                    style="width: 160px"
                  />
                </div>
                <div class="purchase-item-field">
                  <span class="field-label">有效期至:</span>
                  <el-date-picker
                    v-model="item.expirationDate"
                    type="date"
                    placeholder="选择有效期"
                    value-format="YYYY-MM-DD"
                    style="width: 160px"
                    :disabled-date="(d) => item.productionDate ? d < new Date(item.productionDate) : false"
                  />
                </div>
                <div class="purchase-item-subtotal">
                  小计: ¥{{ item.subtotal.toFixed(2) }}
                </div>
              </div>
            </div>
          </div>
          <el-empty v-else description="请添加进货商品" :image-size="80" />

          <!-- 结算信息 -->
          <div class="purchase-summary" v-if="purchaseItems.length > 0">
            <el-divider />
            <div class="summary-row">
              <span>商品种类:</span>
              <span class="summary-value">{{ purchaseItems.length }}</span>
            </div>
            <div class="summary-row">
              <span>总数量:</span>
              <span class="summary-value">{{ totalQuantity }}</span>
            </div>
            <div class="summary-row total">
              <span>总金额:</span>
              <span class="summary-value amount-large">¥{{ totalAmount }}</span>
            </div>

            <el-button
            round
              type="primary"
              size="large"
              style="width: 100%; margin-top: 10px"
              @click="handleConfirmPurchase"
              :loading="confirmLoading"
            >
              确认进货
            </el-button>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search, Delete, Picture, Plus } from '@element-plus/icons-vue'

import { getCategoryList,getSkuList } from '@/api/wms/product'
import { submitPurchaseOrder, confirmPurchaseOrder } from '@/api/wms/purchase'
import { getCustomerList } from '@/api/wms/customer'
import { useRouter } from 'vue-router'

const loading = ref(false)
const confirmLoading = ref(false)
const searchKey = ref('')
const activeCategory = ref('all')
const categories = ref([])
const skuList = ref([])
const purchaseItems = ref([])
const total = ref(0)
const supplierList = ref([])
const router = useRouter()

const queryParams = reactive({
  pageNum: 1,
  pageSize: 20,
  categoryId: null,
  keyword: null
})

// 本地时区的 yyyy-MM-dd（toISOString 走 UTC，凌晨会得到昨天的日期）
function formatDate(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const purchaseForm = reactive({
  supplierId: null,
  supplier: '',
  purchaseDate: formatDate(new Date()),
  remark: ''
})

const totalQuantity = computed(() => purchaseItems.value.reduce((sum, item) => sum + item.quantity, 0))

const totalAmount = computed(() =>
  purchaseItems.value.reduce((sum, item) => sum + item.subtotal, 0).toFixed(2)
)

async function loadCategories() {
  try {
    const res = await getCategoryList({ pageNum: 1, pageSize: 100 })
    const data = res.data || res
    categories.value = Array.isArray(data) ? data : (data.list || data.records || data.rows || [])
  } catch (error) {
    console.error('加载分类失败:', error)
  }
}

async function loadSkus() {
  loading.value = true
  try {
    const params = {
      pageNum: queryParams.pageNum,
      pageSize: queryParams.pageSize
    }
    if (activeCategory.value !== 'all') {
      params.categoryId = activeCategory.value
    }
    if (searchKey.value) {
      params.keyword = searchKey.value
    }
    const res = await getSkuList(params)
    const data = res.data || res
    skuList.value = Array.isArray(data) ? data : (data.list || data.records || data.rows || [])
    total.value = data.total || 0
  } catch (error) {
    console.error('加载商品失败:', error)
    ElMessage.error('加载商品失败')
    skuList.value = []
    total.value = 0
  } finally {
    loading.value = false
  }
}

async function loadSuppliers() {
  try {
    const res = await getCustomerList({ pageNum: 1, pageSize: 1000, kind: 1 })
    const data = res.data || res
    supplierList.value = Array.isArray(data) ? data : (data.list || data.records || data.rows || [])
  } catch (error) {
    console.error('加载供应商失败:', error)
    supplierList.value = []
  }
}

let searchTimer = null
function filterProducts() {
  // 防抖处理
  if (searchTimer) clearTimeout(searchTimer)
  searchTimer = setTimeout(() => {
    queryParams.pageNum = 1
    loadSkus()
  }, 500)
}

function handleCategoryChange(tab) {
  activeCategory.value = tab.paneName || tab.name || 'all'
  searchKey.value = ''
  queryParams.pageNum = 1
  queryParams.categoryId = activeCategory.value === 'all' ? null : activeCategory.value
  loadSkus()
}

function addToPurchaseList(sku) {
  const existingItem = purchaseItems.value.find(item => item.skuId === sku.id)
  if (existingItem) {
    existingItem.quantity++
    calculateItemSubtotal(existingItem)
  } else {
    purchaseItems.value.push({
      skuId: sku.id,
      skuName: sku.skuName,
      purchasePrice: sku.purchasePrice || 0,
      quantity: 1,
      subtotal: sku.purchasePrice || 0,
      productionDate: null,
      expirationDate: null
    })
  }
}

function calculateItemSubtotal(item) {
  item.subtotal = (item.quantity || 0) * (item.purchasePrice || 0)
}

function removeFromPurchaseList(index) {
  purchaseItems.value.splice(index, 1)
}

function clearPurchaseList() {
  purchaseItems.value = []
  purchaseForm.customerId = null
  purchaseForm.customerName = ''
  purchaseForm.remark = ''
}

function handleSupplierChange(supplierId) {
  const supplier = supplierList.value.find(s => s.id === supplierId)
  if (supplier) {
    purchaseForm.customerName = supplier.customerName
  }
}

function handleAddSupplier() {
  // 跳转到客户管理页面（供应商Tab）
  router.push({ path: '/wms/wmscustomer', query: { kind: 1 } })
}

async function handleConfirmPurchase() {
  if (purchaseItems.value.length === 0) {
    ElMessage.warning('请先添加进货商品')
    return
  }
  if (!purchaseForm.customerName) {
    ElMessage.warning('请填写供应商')
    return
  }

  ElMessageBox.confirm('确认提交进货单并入库？', '提示', { type: 'warning' })
    .then(async () => {
      confirmLoading.value = true
      try {
        // 1. 提交进货单
        const orderData = {
          customerId: purchaseForm.customerId,
          supplier: purchaseForm.customerName,
          customerName: purchaseForm.customerName,
          purchaseDate: purchaseForm.purchaseDate,
          remark: purchaseForm.remark,
          totalAmount: parseFloat(totalAmount.value),
          purchaseItemVOList: purchaseItems.value.map(item => ({
            skuId: item.skuId,
            quantity: item.quantity,
            purchasePrice: item.purchasePrice,
            productionDate: item.productionDate || null,
            expirationDate: item.expirationDate || null
          }))
        }
        
        const orderRes = await submitPurchaseOrder(orderData)
        const orderId = orderRes.data?.id || orderRes.data
        
        // 2. 确认入库
        if (orderId) {
          await confirmPurchaseOrder(orderId)
        }
        
        ElMessage.success('进货成功，库存已更新')
        clearPurchaseList()
        loadSkus() // 刷新库存
      } catch (error) {
        console.error('进货失败:', error)
        ElMessage.error('进货失败')
      } finally {
        confirmLoading.value = false
      }
    })
    .catch(() => {})
}

onMounted(() => {
  loadCategories()
  loadSkus()
  loadSuppliers()
})
</script>

<style scoped>
.product-pagination {
  margin-top: 20px;
  display: flex;
  justify-content: center;
}

.purchase-container {
  height: calc(100vh - 120px);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.product-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 15px;
  max-height: calc(100vh - 380px);
  overflow-y: auto;
  padding: 10px 0;
}

.product-card {
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.3s;
}

.product-card:hover {
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}

.product-image {
  position: relative;
  height: 120px;
  background: #f5f7fa;
  display: flex;
  align-items: center;
  justify-content: center;
}

.product-image .el-image {
  width: 100%;
  height: 100%;
}

.image-error {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #c0c4cc;
  font-size: 40px;
}

.product-info {
  padding: 10px;
}

.product-name {
  font-size: 13px;
  color: #303133;
  margin-bottom: 5px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  text-align: center;
}

.product-price {
  font-size: 14px;
  color: #409eff;
  font-weight: 600;
}

.product-stock {
  font-size: 12px;
  color: #909399;
}

.product-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 8px;
}

.purchase-card {
  position: sticky;
  top: 20px;
  max-height: calc(100vh - 140px);
  display: flex;
  flex-direction: column;
}

.purchase-list {
  flex: 1;
  overflow-y: auto;
  max-height: 400px;
}

.purchase-item {
  padding: 10px;
  margin-bottom: 10px;
  border: 1px solid #ebeef5;
  border-radius: 4px;
  background: #fafafa;
}

.purchase-item-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.purchase-item-name {
  font-size: 13px;
  color: #303133;
  font-weight: 600;
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.purchase-item-body {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.purchase-item-field {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.field-label {
  font-size: 12px;
  color: #606266;
  margin-right: 10px;
}

.purchase-item-subtotal {
  text-align: right;
  font-size: 13px;
  color: #409eff;
  font-weight: 600;
  padding-top: 5px;
  border-top: 1px dashed #dcdfe6;
}

.purchase-summary {
  padding-top: 10px;
}

.summary-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
  font-size: 14px;
}

.summary-row.total {
  font-size: 16px;
  font-weight: 600;
  padding-top: 10px;
  border-top: 2px solid #ebeef5;
}

.summary-value {
  color: #303133;
}

.summary-value.amount-large {
  color: #409eff;
  font-size: 24px;
  font-weight: 700;
}
</style>
