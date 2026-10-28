<template>
  <div class="app-container checkout-container">
    <el-row :gutter="20">
      <!-- 左侧：商品选择区 -->
      <el-col :span="16">
        <el-card shadow="never">
          <template #header>
            <div class="card-header">
              <span>选择商品</span>
              <el-input
                v-model="searchKey"
                placeholder="搜索商品名称/SKU编码/条形码"
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
              @click="addToCart(sku)"
            >
              <div class="product-image">
                <el-image :src="sku.productImage || ''" fit="cover">
                  <template #error>
                    <div class="image-error">
                      <el-icon><Picture /></el-icon>
                    </div>
                  </template>
                </el-image>
                <!-- <div class="stock-badge" :class="{ 'stock-low': sku.totalStock < 10 }">
                  库存: {{ sku.totalStock || 0 }}
                </div> -->
              </div>
              <div class="product-info">
                <div class="product-name" :title="sku.skuName">{{ sku.skuName || '未命名商品' }}</div>
                <!-- <div class="product-price">¥{{ sku.salePrice || '0.00' }}</div> -->
                <div class="product-meta">
                  <span class="product-price">进货价: ¥{{ sku.salePrice || '0.00' }}</span>
                  <span class="product-stock"  :class="{ 'stock-low': sku.totalStock < 10 }">库存: {{ sku.totalStock || 0 }}</span>
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

      <!-- 右侧：购物车/结算区 -->
      <el-col :span="8">
        <el-card shadow="never" class="cart-card">
          <template #header>
            <div class="card-header">
              <span>购物车</span>
              <el-button link type="danger" @click="clearCart" :disabled="cartItems.length === 0">清空</el-button>
            </div>
          </template>

          <!-- 购物车列表 -->
          <div class="cart-list" v-if="cartItems.length > 0">
            <div v-for="(item, index) in cartItems" :key="item.skuId" class="cart-item">
              <div class="cart-item-info">
                <div class="cart-item-name">{{ item.skuName }}</div>
                <div class="cart-item-price">¥{{ item.salePrice }}</div>
              </div>
              <div class="cart-item-actions">
                <el-input-number
                  v-model="item.quantity"
                  :min="1"
                  :max="item.totalStock"
                  size="small"
                />
                <el-button link type="danger" :icon="Delete" @click="removeFromCart(index)" />
              </div>
              <div class="cart-item-subtotal">
                小计: ¥{{ (item.salePrice * item.quantity).toFixed(2) }}
              </div>
            </div>
          </div>
          <el-empty v-else description="购物车为空" :image-size="80" />

          <!-- 结算信息 -->
          <div class="checkout-summary" v-if="cartItems.length > 0">
            <el-divider />
            <div class="summary-row">
              <span>商品数量:</span>
              <span class="summary-value">{{ totalQuantity }}</span>
            </div>
            <div class="summary-row">
              <span>商品总额:</span>
              <span class="summary-value amount">¥{{ totalAmount }}</span>
            </div>
            <div class="summary-row">
              <span>优惠金额:</span>
              <el-input-number v-model="discountAmount" :min="0" :max="Number(totalAmount)" :precision="2" size="small" />
            </div>
            <div class="summary-row total">
              <span>应收金额:</span>
              <span class="summary-value amount-large">¥{{ actualAmount }}</span>
            </div>

            <el-form :model="checkoutForm" label-width="80px">
              <el-form-item label="客户">
                <div style="display: flex; gap: 8px; width: 100%">
                  <el-select 
                    v-model="checkoutForm.customerId" 
                    filterable 
                    placeholder="选择客户" 
                    style="flex: 1"
                  >
                    <el-option
                      v-for="customer in customerList"
                      :key="customer.id"
                      :label="customer.customerName + ' (' + customer.customerPhone + ')'"
                      :value="customer.id"
                    />
                  </el-select>
                  <el-button 
                    round
                    type="primary" 
                    :icon="Plus" 
                    @click="handleAddCustomer"
                    title="新增客户"
                  />
                </div>
              </el-form-item>
              <el-form-item label="支付方式">
                <el-select v-model="checkoutForm.payMethod" placeholder="选择支付方式" style="width: 100%">
                  <el-option label="现金" value="CASH" />
                  <el-option label="微信支付" value="WECHAT" />
                  <el-option label="支付宝" value="ALIPAY" />
                  <el-option label="银行卡" value="CARD" />
                  <el-option label="会员卡" value="MEMBER_CARD" />
                </el-select>
              </el-form-item>
              <el-form-item label="备注">
                <el-input v-model="checkoutForm.remark" type="textarea" :rows="2" />
              </el-form-item>
            </el-form>

            <el-button
              type="primary"
              round
              size="large"
              style="width: 100%; margin-top: 10px"
              @click="handleCheckout"
              :loading="checkoutLoading"
            >
              结算收款
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
import { getAvailableSkuList, checkoutSales } from '@/api/wms/sales'
import { getCategoryList } from '@/api/wms/product'
import { getCustomerList } from '@/api/wms/customer'
import { useRouter } from 'vue-router'

const loading = ref(false)
const checkoutLoading = ref(false)
const searchKey = ref('')
const activeCategory = ref('all')
const categories = ref([])
const skuList = ref([])
const cartItems = ref([])
const customerList = ref([])
const discountAmount = ref(0)
const total = ref(0)
const router = useRouter()

const queryParams = reactive({
  pageNum: 1,
  pageSize: 20,
  categoryId: null,
  keyword: null
})

const checkoutForm = reactive({
  customerId: null,
  payMethod: 'WECHAT',
  remark: ''
})

const totalQuantity = computed(() => cartItems.value.reduce((sum, item) => sum + item.quantity, 0))

const totalAmount = computed(() =>
  cartItems.value.reduce((sum, item) => sum + item.salePrice * item.quantity, 0).toFixed(2)
)

const actualAmount = computed(() =>
  (Number(totalAmount.value) - discountAmount.value).toFixed(2)
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
    const res = await getAvailableSkuList(params)
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

async function loadCustomers() {
  try {
    const res = await getCustomerList({kind:0,pageNum: 1, pageSize: 100 })
    const data = res.data || res
    customerList.value = Array.isArray(data) ? data : (data.list || data.records || data.rows || [])
  } catch (error) {
    console.error('加载客户失败:', error)
    customerList.value = []
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

function addToCart(sku) {
  const existingItem = cartItems.value.find(item => item.skuId === sku.id)
  if (existingItem) {
    if (existingItem.quantity < sku.totalStock) {
      existingItem.quantity++
    } else {
      ElMessage.warning('库存不足')
    }
  } else {
    cartItems.value.push({
      skuId: sku.id,
      skuName: sku.skuName,
      salePrice: sku.salePrice,
      totalStock: sku.totalStock,
      quantity: 1
    })
  }
}

function removeFromCart(index) {
  cartItems.value.splice(index, 1)
}

function clearCart() {
  cartItems.value = []
  discountAmount.value = 0
}

function handleAddCustomer() {
  // 跳转到客户管理页面（客户Tab）
  router.push({ path: '/wms/wmscustomer', query: { kind: 0 } })
}

function handleCheckout() {
  if (cartItems.value.length === 0) {
    ElMessage.warning('请先选择商品')
    return
  }
  if (!checkoutForm.customerId) {
    ElMessage.warning('请选择客户')
    return
  }

  ElMessageBox.confirm('确认结算？', '提示', { type: 'warning' })
    .then(async () => {
      checkoutLoading.value = true
      try {
        const data = {
          customerId: checkoutForm.customerId,
          items: cartItems.value.map(item => ({
            skuId: item.skuId,
            quantity: item.quantity,
            salePrice: item.salePrice
          })),
          discountAmount: discountAmount.value,
          payMethod: checkoutForm.payMethod,
          remark: checkoutForm.remark
        }
        await checkoutSales(data)
        ElMessage.success('结算成功')
        clearCart()
        loadSkus() // 刷新库存
      } catch (error) {
        console.error('结算失败:', error)
      } finally {
        checkoutLoading.value = false
      }
    })
    .catch(() => {})
}

onMounted(() => {
  loadCategories()
  loadSkus()
  loadCustomers()
})
</script>

<style scoped>
.product-pagination {
  margin-top: 20px;
  display: flex;
  justify-content: center;
}

.checkout-container {
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

.stock-badge {
  position: absolute;
  bottom: 5px;
  right: 5px;
  background: rgba(103, 194, 58, 0.9);
  color: white;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 12px;
}

.stock-badge.stock-low {
  background: rgba(245, 108, 108, 0.9);
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
  font-size: 12px;
  color: #409eff;
  font-weight: 600;
  
}

.product-stock {
  font-size: 12px;
  color: #909399;
   background: rgba(103, 194, 58, 0.9);
  color: white;
  border-radius: 12px;
  padding: 2px 8px;
}
.product-stock.stock-low {
  background: rgba(245, 108, 108, 0.9);
}

.product-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 8px;
}
.cart-card {
  position: sticky;
  top: 20px;
  max-height: calc(100vh - 140px);
  display: flex;
  flex-direction: column;
}

.cart-list {
  flex: 1;
  overflow-y: auto;
  max-height: 400px;
}

.cart-item {
  padding: 10px 0;
  border-bottom: 1px solid #ebeef5;
}

.cart-item-info {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
}

.cart-item-name {
  font-size: 13px;
  color: #303133;
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.cart-item-price {
  color: #f56c6c;
  font-weight: 600;
  margin-left: 10px;
}

.cart-item-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 5px;
}

.cart-item-subtotal {
  text-align: right;
  font-size: 12px;
  color: #909399;
}

.checkout-summary {
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

.summary-value.amount {
  color: #409eff;
  font-weight: 600;
}

.summary-value.amount-large {
  color: #f56c6c;
  font-size: 24px;
  font-weight: 700;
}
</style>
