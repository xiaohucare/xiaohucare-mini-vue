<template>
  <div class="app-container">
    <el-tabs v-model="activeTab" class="wms-tabs">
      <!-- ===== 商品管理 ===== -->
      <el-tab-pane label="商品管理" name="product">
    <el-card shadow="never">
      <!-- 搜索栏 -->
      <el-form :model="queryParams" ref="queryFormRef" :inline="true">
        <el-form-item label="商品名称" prop="productName">
          <el-input v-model="queryParams.productName" placeholder="请输入商品名称" clearable @keyup.enter="handleQuery" />
        </el-form-item>
        <el-form-item label="商品类型" prop="productType">
          <el-select v-model="queryParams.productType" placeholder="请选择" clearable style="width: 140px">
            <el-option label="食品" value="FOOD" />
            <el-option label="用品" value="SUPPLY" />
            <el-option label="药品" value="MEDICINE" />
            <el-option label="玩具" value="TOY" />
            <el-option label="零食" value="SNACK" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleQuery">搜索</el-button>
          <el-button @click="resetQuery">重置</el-button>
        </el-form-item>
      </el-form>

      <!-- 操作按钮 -->
      <div class="mb8">
        <el-button type="primary" :icon="Plus" @click="handleAdd">新增商品</el-button>
      </div>

      <!-- 表格 -->
      <el-table v-loading="loading" :data="productList" border>
        <el-table-column label="商品ID" prop="id" min-width="80" align="center" />
        <el-table-column label="商品图片" min-width="80" align="center">
          <template #default="{ row }">
            <el-image v-if="row.logo" :src="row.logo.split(',')[0]" style="width: 50px; height: 50px" fit="cover" />
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column label="商品名称" prop="productName" show-overflow-tooltip />
        <el-table-column label="品牌" prop="brandName" min-width="100" />
        <el-table-column label="分类" prop="categoryName" min-width="100" />
        <el-table-column label="类型" prop="productType" min-width="80" align="center">
          <template #default="{ row }">
            <el-tag :type="getProductTypeTag(row.productType)">{{ getProductTypeText(row.productType) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="单位" prop="unit" min-width="60" align="center" />
        <el-table-column label="市场价" prop="marketPrice" min-width="90" align="right">
          <template #default="{ row }">¥{{ row.marketPrice }}</template>
        </el-table-column>
        <el-table-column label="SKU数量" prop="skuCount" min-width="90" align="center" />
        <el-table-column label="状态" min-width="80" align="center">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : 'info'">{{ row.status === 1 ? '上架' : '下架' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" align="center" width="180">
          <template #default="{ row }">
            <el-button link type="primary" @click="handleUpdate(row)">编辑</el-button>
            <el-button link type="primary" @click="handleManageSku(row)">SKU</el-button>
            <el-button link type="danger" @click="handleDelete(row)">删除</el-button>
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
      </el-tab-pane>

      <!-- ===== SKU 管理 ===== -->
      <el-tab-pane label="SKU管理" name="sku">
        <el-card shadow="never">
          <el-form :inline="true" class="sku-toolbar">
            <el-form-item label="选择商品">
              <el-select
                v-model="selectedProductId"
                filterable
                placeholder="请选择商品（可按名称搜索）"
                style="width: 320px"
                @change="handleSelectProduct"
              >
                <el-option
                  v-for="p in allProducts"
                  :key="p.id"
                  :label="p.productName + (p.brandName ? '（' + p.brandName + '）' : '')"
                  :value="p.id"
                />
              </el-select>
            </el-form-item>
            <el-form-item>
              <el-button type="primary" :icon="Plus" :disabled="!selectedProductId" @click="addSku">添加SKU</el-button>
              <el-button type="success" :disabled="!skuList.length" @click="saveSkus">保存全部</el-button>
              <el-button type="warning" plain :icon="Goods" @click="activeTab = 'product'">产品管理</el-button>
            </el-form-item>
          </el-form>

          <el-alert
            v-if="!selectedProductId"
            title="请先选择要维护的商品；若列表中没有需要的商品，请先点右侧「产品管理」新增商品。"
            type="info"
            :closable="false"
            show-icon
            style="margin: 4px 0 8px"
          />

          <el-table v-loading="skuLoading" :data="skuList" border>
            <el-table-column label="图片" min-width="80" align="center">
              <template #default="{ row }">
                <el-upload
                  :action="uploadUrl"
                  :headers="uploadHeaders"
                  :show-file-list="false"
                  :before-upload="beforeUpload"
                  :on-success="(res) => handleSkuImageSuccess(res, row)"
                  accept="image/*"
                >
                  <el-image v-if="row.productImage" :src="row.productImage" fit="cover" style="width: 56px; height: 56px; border-radius: 4px" />
                  <div v-else class="sku-image-placeholder"><el-icon :size="20"><Plus /></el-icon></div>
                </el-upload>
              </template>
            </el-table-column>
            <el-table-column label="SKU编码" min-width="130">
              <template #default="{ row }">
                <el-input v-model="row.skuCode" />
              </template>
            </el-table-column>
            <el-table-column label="SKU名称" min-width="150">
              <template #default="{ row }">
                <el-input v-model="row.skuName" />
              </template>
            </el-table-column>
            <el-table-column label="规格" min-width="120">
              <template #default="{ row }">
                <el-input v-model="row.specifications" placeholder="JSON格式" />
              </template>
            </el-table-column>
            <el-table-column label="进货价" min-width="120">
              <template #default="{ row }">
                <el-input-number v-model="row.purchasePrice" :min="0" :precision="2" style="width: 100%" />
              </template>
            </el-table-column>
            <el-table-column label="销售价" min-width="120">
              <template #default="{ row }">
                <el-input-number v-model="row.salePrice" :min="0" :precision="2" style="width: 100%" />
              </template>
            </el-table-column>
            <el-table-column label="预警库存" min-width="110">
              <template #default="{ row }">
                <el-input-number v-model="row.warningStock" :min="0" style="width: 100%" />
              </template>
            </el-table-column>
            <el-table-column label="状态" min-width="80" align="center">
              <template #default="{ row }">
                <el-switch v-model="row.status" :active-value="1" :inactive-value="0" />
              </template>
            </el-table-column>
            <el-table-column label="操作" min-width="70" align="center">
              <template #default="{ $index }">
                <el-button link type="danger" :icon="Delete" @click="removeSku($index)" />
              </template>
            </el-table-column>
          </el-table>
          <el-empty v-if="selectedProductId && !skuLoading && !skuList.length" description="该商品暂无 SKU，点击上方「添加SKU」创建" :image-size="80" />
        </el-card>
      </el-tab-pane>
    </el-tabs>

    <!-- 添加/编辑商品对话框 -->
    <el-dialog v-model="open" :title="title" width="900px" append-to-body :close-on-click-modal="false">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
        <el-row>
          <el-col :span="12">
            <el-form-item label="商品名称" prop="productName">
              <el-input v-model="form.productName" placeholder="请输入商品名称" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="品牌" prop="brandId">
              <el-select v-model="form.brandId" filterable placeholder="选择品牌" style="width: 100%">
                <el-option v-for="brand in brandList" :key="brand.id" :label="brand.brandName" :value="brand.id" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row>
          <el-col :span="12">
            <el-form-item label="分类" prop="categoryId">
              <el-select v-model="form.categoryId" filterable placeholder="选择分类" style="width: 100%">
                <el-option v-for="cat in categoryList" :key="cat.id" :label="cat.categoryName" :value="cat.id" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="商品类型" prop="productType">
              <el-select v-model="form.productType" placeholder="选择类型" style="width: 100%">
                <el-option label="食品" value="FOOD" />
                <el-option label="用品" value="SUPPLY" />
                <el-option label="药品" value="MEDICINE" />
                <el-option label="玩具" value="TOY" />
                <el-option label="零食" value="SNACK" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row>
          <el-col :span="12">
            <el-form-item label="单位" prop="unit">
              <el-input v-model="form.unit" placeholder="个/袋/瓶/盒" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="条形码" prop="barcode">
              <el-input v-model="form.barcode" placeholder="请输入条形码" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row>
          <el-col :span="12">
            <el-form-item label="市场价" prop="marketPrice">
              <el-input-number v-model="form.marketPrice" :min="0" :precision="2" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="状态" prop="status">
              <el-radio-group v-model="form.status">
                <el-radio :value="1">上架</el-radio>
                <el-radio :value="0">下架</el-radio>
              </el-radio-group>
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="商品LOGO" prop="logo">
          <el-upload
            :action="uploadUrl"
            :headers="uploadHeaders"
            list-type="picture-card"
            :limit="1"
            :on-success="handleLogoSuccess"
            :on-error="handleUploadError"
            :before-upload="beforeUpload"
            accept="image/*"
          >
            <el-icon v-if="!form.logo" :size="20"><Plus /></el-icon>
            <el-image v-else :src="form.logo" fit="cover" style="width: 100%; height: 100%" />
          </el-upload>
          <div class="upload-tip">建议尺寸：200x200，仅支持一张图片</div>
        </el-form-item>
        <el-form-item label="商品图片" prop="images">
          <el-upload
            :action="uploadUrl"
            :headers="uploadHeaders"
            list-type="picture-card"
            :limit="10"
            :file-list="imageFileList"
            :on-success="handleImageSuccess"
            :on-remove="handleImageRemove"
            :on-error="handleUploadError"
            :before-upload="beforeUpload"
            accept="image/*"
          >
            <el-icon :size="20"><Plus /></el-icon>
            <template #file="{ file }">
              <el-image :src="file.url" fit="cover" style="width: 100%; height: 100%" />
            </template>
          </el-upload>
          <div class="upload-tip">最多10张图片，支持jpg/png格式</div>
        </el-form-item>
        <el-form-item label="商品描述" prop="description">
          <el-input v-model="form.description" type="textarea" :rows="3" />
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
import { ref, reactive, onMounted, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Delete, Goods } from '@element-plus/icons-vue'
import { getProductList, getProductDetail, submitProduct, deleteProduct, getCategoryList } from '@/api/wms/product'
import { getBrandList } from '@/api/wms/brand'
import { getSkuList, submitSku } from '@/api/wms/product'
import { getToken } from '@/utils/auth'

const uploadUrl = import.meta.env.VITE_APP_BASE_API + '/common/oss/upload'
const uploadHeaders = computed(() => ({ Authorization: 'Bearer ' + getToken() }))

const loading = ref(false)
const total = ref(0)
const productList = ref([])
const open = ref(false)
const title = ref('')
const activeTab = ref('product')
const selectedProductId = ref(null)
const allProducts = ref([])
const skuLoading = ref(false)
const brandList = ref([])
const categoryList = ref([])
const skuList = ref([])
const formRef = ref(null)
const queryFormRef = ref(null)

const queryParams = reactive({
  pageNum: 1,
  pageSize: 10,
  productName: null,
  productType: null
})

const form = reactive({
  id: null,
  productName: null,
  brandId: null,
  categoryId: null,
  barcode: null,
  unit: null,
  productType: null,
  marketPrice: null,
  description: null,
  images: null,
  logo: null,
  status: 1
})

const imageFileList = ref([])

const rules = {
  productName: [{ required: true, message: '商品名称不能为空', trigger: 'blur' }],
  brandId: [{ required: true, message: '品牌不能为空', trigger: 'change' }],
  categoryId: [{ required: true, message: '分类不能为空', trigger: 'change' }],
  productType: [{ required: true, message: '商品类型不能为空', trigger: 'change' }],
  unit: [{ required: true, message: '单位不能为空', trigger: 'blur' }]
}

function getProductTypeTag(type) {
  const map = { FOOD: 'success', SUPPLY: 'primary', MEDICINE: 'danger', TOY: 'warning', SNACK: 'info' }
  return map[type] || 'info'
}

function getProductTypeText(type) {
  const map = { FOOD: '食品', SUPPLY: '用品', MEDICINE: '药品', TOY: '玩具', SNACK: '零食' }
  return map[type] || type
}

async function getList() {
  loading.value = true
  try {
    const res = await getProductList(queryParams)
    const data = res.data || res
    productList.value = Array.isArray(data) ? data : (data.list || data.records || data.rows || [])
    total.value = data.total || productList.value.length
  } catch (error) {
    console.error('加载商品失败:', error)
  } finally {
    loading.value = false
  }
}

async function loadBrands() {
  try {
    const res = await getBrandList({ pageNum: 1, pageSize: 100 })
    const data = res.data || res
    brandList.value = Array.isArray(data) ? data : (data.list || data.records || [])
  } catch (error) {
    console.error('加载品牌失败:', error)
  }
}

async function loadCategories() {
  try {
    const res = await getCategoryList({ pageNum: 1, pageSize: 100 })
    const data = res.data || res
    categoryList.value = Array.isArray(data) ? data : (data.list || data.records || [])
  } catch (error) {
    console.error('加载分类失败:', error)
  }
}

function resetForm() {
  Object.assign(form, {
    id: null,
    productName: null,
    brandId: null,
    categoryId: null,
    barcode: null,
    unit: null,
    productType: null,
    marketPrice: null,
    description: null,
    images: null,
    logo: null,
    status: 1
  })
  imageFileList.value = []
  formRef.value?.resetFields()
}

function handleAdd() {
  resetForm()
  title.value = '添加商品'
  open.value = true
}

async function handleUpdate(row) {
  resetForm()
  try {
    const res = await getProductDetail(row.id)
    const data = res.data || res
    Object.assign(form, data)
    // 构建图片文件列表
    if (data.images) {
      imageFileList.value = data.images.split(',').filter(url => url).map((url, index) => ({
        uid: index,
        name: `image-${index}`,
        url: url
      }))
    } else {
      imageFileList.value = []
    }
    title.value = '编辑商品'
    open.value = true
  } catch (error) {
    console.error('加载详情失败:', error)
  }
}

async function loadAllProducts() {
  try {
    const res = await getProductList({ pageNum: 1, pageSize: 1000 })
    const data = res.data || res
    allProducts.value = Array.isArray(data) ? data : (data.list || data.records || data.rows || [])
  } catch (error) {
    console.error('加载商品列表失败:', error)
  }
}

async function loadSkus() {
  if (!selectedProductId.value) {
    skuList.value = []
    return
  }
  skuLoading.value = true
  try {
    const res = await getSkuList({ productId: selectedProductId.value, pageNum: 1, pageSize: 200 })
    const data = res.data || res
    skuList.value = Array.isArray(data) ? data : (data.list || data.records || [])
  } catch (error) {
    console.error('加载SKU失败:', error)
    skuList.value = []
  } finally {
    skuLoading.value = false
  }
}

function handleSelectProduct() {
  loadSkus()
}

/** 从商品行点击“SKU”：跳转到 SKU 管理页签并选中该商品 */
function handleManageSku(row) {
  selectedProductId.value = row.id
  activeTab.value = 'sku'
  loadSkus()
}

function handleDelete(row) {
  ElMessageBox.confirm('是否确认删除商品？', '提示', { type: 'warning' })
    .then(async () => {
      await deleteProduct(row.id)
      ElMessage.success('删除成功')
      getList()
    })
    .catch(() => {})
}

function addSku() {
  skuList.value.push({
    productId: selectedProductId.value,
    skuCode: '',
    skuName: '',
    productImage: '',
    specifications: null,
    purchasePrice: 0,
    salePrice: 0,
    warningStock: 10,
    status: 1
  })
}

function removeSku(index) {
  skuList.value.splice(index, 1)
}

async function saveSkus() {
  try {
    for (const sku of skuList.value) {
      await submitSku(sku)
    }
    ElMessage.success('保存成功')
    loadSkus()
    getList()
  } catch (error) {
    console.error('保存SKU失败:', error)
  }
}

function handleQuery() {
  queryParams.pageNum = 1
  getList()
}

function resetQuery() {
  queryFormRef.value?.resetFields()
  handleQuery()
}

function submitForm() {
  formRef.value?.validate(async valid => {
    if (valid) {
      try {
        await submitProduct(form)
        ElMessage.success('操作成功')
        open.value = false
        getList()
        loadAllProducts()
      } catch (error) {
        console.error('提交失败:', error)
      }
    }
  })
}

function beforeUpload(file) {
  const isImage = file.type.startsWith('image/')
  if (!isImage) {
    ElMessage.error('只能上传图片文件！')
    return false
  }
  const isLt5M = file.size / 1024 / 1024 < 5
  if (!isLt5M) {
    ElMessage.error('图片大小不能超过5MB！')
    return false
  }
  return true
}

function handleLogoSuccess(response, file) {
  if (response.code === 0) {
    form.logo = response.data?.url || response.data
    ElMessage.success('LOGO上传成功')
  } else {
    ElMessage.error(response.msg || '上传失败')
  }
}

function handleImageSuccess(response, file, fileList) {
  if (response.code === 0) {
    const url = response.data?.url || response.data
    file.url = url
    imageFileList.value = fileList
    // 同步更新 form.images
    form.images = fileList.map(f => f.url).filter(url => url).join(',')
    ElMessage.success('图片上传成功')
  } else {
    ElMessage.error(response.msg || '上传失败')
  }
}

function handleImageRemove(file, fileList) {
  imageFileList.value = fileList
  form.images = fileList.map(f => f.url).filter(url => url).join(',')
}

/** SKU图片上传成功 */
function handleSkuImageSuccess(response, row) {
  if (response.code === 0) {
    row.productImage = response.data?.url || response.data
    ElMessage.success('图片上传成功')
  } else {
    ElMessage.error(response.msg || '上传失败')
  }
}

function handleUploadError(error) {
  console.error('上传失败:', error)
  ElMessage.error('图片上传失败')
}

onMounted(() => {
  getList()
  loadAllProducts()
  loadBrands()
  loadCategories()
})
</script>

<style scoped>
.upload-tip {
  font-size: 12px;
  color: #909399;
  margin-top: 5px;
}

:deep(.el-upload--picture-card) {
  width: 100px;
  height: 100px;
}

:deep(.el-upload-list--picture-card .el-upload-list__item) {
  width: 100px;
  height: 100px;
}

.sku-image-placeholder {
  width: 56px;
  height: 56px;
  margin: 0 auto;
  border: 1px dashed #d9d9d9;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #8c939d;
  cursor: pointer;
}
</style>
