<template>
  <div class="app-container">
    <el-card shadow="never">
      <!-- 搜索栏 -->
      <el-form :model="queryParams" ref="queryFormRef" :inline="true">
        <el-form-item label="进货单号" prop="orderNo">
          <el-input v-model="queryParams.orderNo" placeholder="请输入进货单号" clearable @keyup.enter="handleQuery" />
        </el-form-item>
        <el-form-item label="供应商" prop="customerName">
          <el-input v-model="queryParams.customerName" placeholder="请输入供应商" clearable @keyup.enter="handleQuery" />
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-select v-model="queryParams.status" placeholder="请选择状态" clearable style="width: 140px">
            <el-option label="待入库" value="0" />
            <el-option label="已入库" value="1" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleQuery">搜索</el-button>
          <el-button @click="resetQuery">重置</el-button>
        </el-form-item>
      </el-form>

      <!-- 操作按钮 -->
      <div class="mb8">
        <el-button type="primary" :icon="Plus" @click="handleGoCheckout">新增进货</el-button>
      </div>

      <!-- 表格 -->
      <el-table v-loading="loading" :data="purchaseList" border>
        <el-table-column label="进货单号" prop="orderNo" min-width="160" />
        <el-table-column label="供应商" prop="customerName" min-width="120" />
        <el-table-column label="商品种类" prop="totalSkuCount" min-width="90" align="center" />
        <el-table-column label="总数量" prop="totalCount" min-width="90" align="center" />
        <el-table-column label="总金额" prop="totalAmount" min-width="110" align="right">
          <template #default="{ row }">
            <span class="amount-text">¥{{ row.totalAmount }}</span>
          </template>
        </el-table-column>
        <el-table-column label="进货日期" prop="purchaseDate" min-width="110" />
        <el-table-column label="状态" width="90" align="center">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : 'warning'">
              {{ row.status === 1 ? '已入库' : '待入库' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="创建时间" prop="createAt" width="160" />
        <el-table-column label="操作" align="center" width="240">
          <template #default="{ row }">
            <el-button link type="primary" @click="handleViewDetail(row)">详情</el-button>
            <el-button v-if="row.status === 1" link type="success" @click="handlePrint(row)">打印</el-button>
            <el-button v-if="row.status === 0" link type="primary" @click="handleConfirm(row)">入库</el-button>
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

    <!-- 详情对话框 -->
    <el-dialog v-model="detailVisible" title="进货单详情" width="800px" append-to-body>
      <el-descriptions :column="2" border>
        <el-descriptions-item label="进货单号">{{ detail.orderNo }}</el-descriptions-item>
        <el-descriptions-item label="供应商">{{ detail.customerName }}</el-descriptions-item>
        <el-descriptions-item label="进货日期">{{ detail.purchaseDate }}</el-descriptions-item>
        <el-descriptions-item label="商品种类">{{ detail.totalSkuCount || 0 }}</el-descriptions-item>
        <el-descriptions-item label="总数量">{{ detail.totalCount || 0 }}</el-descriptions-item>
        <el-descriptions-item label="总金额"><span class="amount-text">¥{{ detail.totalAmount }}</span></el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag :type="detail.status === 1 ? 'success' : 'warning'">
            {{ detail.status === 1 ? '已入库' : '待入库' }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="创建时间">{{ detail.createAt }}</el-descriptions-item>
      </el-descriptions>

      <el-divider content-position="left">商品明细</el-divider>
      <el-table :data="detail.purchaseItemVOList || []" stripe border>
        <el-table-column label="SKU编码" prop="skuCode" width="120" />
        <el-table-column label="商品名称" prop="skuName" show-overflow-tooltip />
        <el-table-column label="进货价" prop="purchasePrice" width="90" align="right">
          <template #default="{ row }">¥{{ row.purchasePrice }}</template>
        </el-table-column>
        <el-table-column label="数量" prop="quantity" width="80" align="center" />
        <el-table-column label="小计" width="100" align="right">
          <template #default="{ row }"><span class="amount-text">¥{{ row.subtotal }}</span></template>
        </el-table-column>
        <el-table-column label="生产日期" prop="productionDate" width="110" />
        <el-table-column label="有效期至" prop="expiryDate" width="110" />
      </el-table>

      <div v-if="detail.remark" style="margin-top:15px">
        <strong>备注：</strong>{{ detail.remark }}
      </div>

      <template #footer>
        <el-button @click="detailVisible = false">关 闭</el-button>
        <el-button type="primary" @click="handlePrint(detail)" v-if="detail.status === 1">打印进货单</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import { getPurchaseOrderList, getPurchaseOrderDetail, deletePurchaseOrder, confirmPurchaseOrder } from '@/api/wms/purchase'
import { useRouter } from 'vue-router'

const router = useRouter()
const loading = ref(false)
const total = ref(0)
const purchaseList = ref([])
const queryFormRef = ref(null)
const detailVisible = ref(false)
const detail = ref({})

const queryParams = reactive({
  pageNum: 1,
  pageSize: 10,
  orderNo: null,
  supplier: null,
  status: null
})

async function getList() {
  loading.value = true
  try {
    const res = await getPurchaseOrderList(queryParams)
    const data = res.data || res
    purchaseList.value = Array.isArray(data) ? data : (data.list || data.records || data.rows || [])
    total.value = data.total || purchaseList.value.length
  } catch (error) {
    console.error('加载进货单失败:', error)
  } finally {
    loading.value = false
  }
}

function handleGoCheckout() {
  // 跳转到进货台
  router.push('/wms/purchase-checkout')
}

async function handleViewDetail(row) {
  try {
    const res = await getPurchaseOrderDetail(row.id)
    detail.value = res.data || res
    detailVisible.value = true
  } catch (e) {
    ElMessage.error('加载详情失败')
  }
}

function handlePrint(row) {
  // 加载完整数据（如果是从表格直接打印）
  if (!row.purchaseItemVOList) {
    getPurchaseOrderDetail(row.id).then(res => {
      const data = res.data || res
      printPurchaseOrder(data)
    }).catch(() => {
      ElMessage.error('加载数据失败')
    })
  } else {
    printPurchaseOrder(row)
  }
}

function printPurchaseOrder(order) {
  const printContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>进货单 - ${order.orderNo}</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
          font-family: 'Microsoft YaHei', 'PingFang SC', Arial, sans-serif; 
          padding: 30px; 
          color: #2c3e50;
          background: #fff;
          line-height: 1.6;
        }
        .print-container {
          max-width: 800px;
          margin: 0 auto;
          border: 2px solid #2c3e50;
          padding: 30px;
          background: #fff;
        }
        .print-header { 
          text-align: center; 
          margin-bottom: 30px; 
          padding-bottom: 20px;
          border-bottom: 3px double #2c3e50;
        }
        .print-header h1 { 
          font-size: 32px; 
          margin-bottom: 10px;
          color: #2c3e50;
          letter-spacing: 8px;
          font-weight: bold;
        }
        .print-header .subtitle {
          font-size: 12px;
          color: #7f8c8d;
          letter-spacing: 2px;
        }
        .info-section { 
          margin-bottom: 25px;
          background: #f8f9fa;
          padding: 15px;
          border-radius: 4px;
        }
        .info-grid { 
          display: grid; 
          grid-template-columns: 1fr 1fr; 
          gap: 12px;
        }
        .info-item { 
          display: flex;
          align-items: baseline;
        }
        .info-label { 
          font-weight: 600; 
          min-width: 90px; 
          color: #34495e;
          font-size: 13px;
        }
        .info-value { 
          flex: 1;
          color: #2c3e50;
          font-size: 13px;
        }
        .items-table { 
          width: 100%; 
          border-collapse: collapse; 
          margin: 25px 0;
          font-size: 13px;
        }
        .items-table thead {
          background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);
          color: white;
        }
        .items-table th { 
          padding: 12px 10px; 
          text-align: left;
          font-weight: 600;
          letter-spacing: 1px;
        }
        .items-table td { 
          padding: 10px;
          border-bottom: 1px solid #e9ecef;
        }
        .items-table tbody tr:hover {
          background: #f8f9fa;
        }
        .items-table .text-right { text-align: right; }
        .items-table .text-center { text-align: center; }
        .summary-section { 
          margin-top: 25px; 
          border-top: 2px solid #2c3e50; 
          padding-top: 20px;
          background: #f8f9fa;
          padding: 20px;
          border-radius: 4px;
        }
        .summary-row { 
          display: flex; 
          justify-content: space-between; 
          margin-bottom: 10px; 
          font-size: 14px;
          color: #34495e;
        }
        .summary-row.total { 
          font-size: 20px; 
          font-weight: bold; 
          color: #11998e;
          margin-top: 15px;
          padding-top: 15px;
          border-top: 2px dashed #bdc3c7;
        }
        .summary-row .label {
          color: #7f8c8d;
          font-size: 13px;
        }
        .summary-row .value {
          font-weight: 600;
        }
        .remark-section {
          margin-top: 20px;
          padding: 15px;
          background: #fff9e6;
          border-left: 4px solid #f39c12;
          border-radius: 4px;
        }
        .remark-section strong {
          color: #f39c12;
          font-size: 13px;
        }
        .remark-section p {
          margin-top: 8px;
          color: #2c3e50;
          font-size: 13px;
        }
        .footer { 
          margin-top: 40px; 
          text-align: center; 
          color: #95a5a6; 
          font-size: 12px; 
          border-top: 1px dashed #bdc3c7; 
          padding-top: 20px;
        }
        .footer .shop-name {
          font-size: 14px;
          color: #7f8c8d;
          font-weight: 600;
          margin-bottom: 8px;
        }
        .footer p {
          margin: 5px 0;
        }
        @media print {
          body { 
            padding: 0;
            background: #fff;
          }
          .print-container {
            border: none;
            padding: 20px;
          }
          .items-table thead {
            background: #2c3e50 !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .info-section,
          .summary-section {
            background: #f8f9fa !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
        }
      </style>
    </head>
    <body>
      <div class="print-container">
        <div class="print-header">
          <h1>进 货 单</h1>
          <div class="subtitle">PURCHASE ORDER</div>
        </div>
        
        <div class="info-section">
          <div class="info-grid">
            <div class="info-item">
              <span class="info-label">单号：</span>
              <span class="info-value" style="font-weight: 600; color: #11998e;">${order.orderNo || '-'}</span>
            </div>
            <div class="info-item">
              <span class="info-label">时间：</span>
              <span class="info-value">${order.createAt || '-'}</span>
            </div>
            <div class="info-item">
              <span class="info-label">供应商：</span>
              <span class="info-value">${order.customerName || '-'}</span>
            </div>
            <div class="info-item">
              <span class="info-label">进货日期：</span>
              <span class="info-value">${order.purchaseDate || '-'}</span>
            </div>
            <div class="info-item">
              <span class="info-label">商品种类：</span>
              <span class="info-value">${order.totalSkuCount || 0} 种</span>
            </div>
            <div class="info-item">
              <span class="info-label">总数量：</span>
              <span class="info-value">${order.totalCount || 0} 件</span>
            </div>
          </div>
        </div>
        
        <table class="items-table">
          <thead>
            <tr>
              <th style="width: 120px;">SKU编码</th>
              <th>商品名称</th>
              <th class="text-right" style="width: 90px;">进货价</th>
              <th class="text-center" style="width: 70px;">数量</th>
              <th class="text-right" style="width: 100px;">小计</th>
              <th style="width: 110px;">生产日期</th>
              <th style="width: 110px;">有效期至</th>
            </tr>
          </thead>
          <tbody>
            ${(order.purchaseItemVOList || []).map((item, index) => `
              <tr style="${index % 2 === 0 ? 'background: #fafbfc;' : ''}">
                <td style="font-family: monospace;">${item.skuCode || '-'}</td>
                <td>${item.skuName || '-'}</td>
                <td class="text-right">¥${item.purchasePrice || '0.00'}</td>
                <td class="text-center">${item.quantity || 0}</td>
                <td class="text-right" style="font-weight: 600; color: #11998e;">¥${item.subtotal || '0.00'}</td>
                <td>${item.productionDate || '-'}</td>
                <td>${item.expiryDate || '-'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        
        <div class="summary-section">
          <div class="summary-row total">
            <span>进货总额：</span>
            <span>¥${order.totalAmount || '0.00'}</span>
          </div>
        </div>
        
        ${order.remark ? `
          <div class="remark-section">
            <strong>📝 备注：</strong>
            <p>${order.remark}</p>
          </div>
        ` : ''}
        
        <div class="footer">
          <div class="shop-name">感谢您的支持！</div>
          <p>打印时间：${new Date().toLocaleString('zh-CN')}</p>
          <p style="margin-top: 8px; font-size: 11px; color: #bdc3c7;">本单据作为进货凭证，请妥善保管</p>
        </div>
      </div>
    </body>
    </html>
  `
  
  const printWindow = window.open('', '_blank', 'width=900,height=700')
  printWindow.document.write(printContent)
  printWindow.document.close()
  printWindow.onload = () => {
    printWindow.print()
  }
}

function handleConfirm(row) {
  ElMessageBox.confirm('确认入库？入库后将增加库存数量', '提示', { type: 'warning' })
    .then(async () => {
      try {
        await confirmPurchaseOrder(row.id)
        ElMessage.success('入库成功')
        getList()
      } catch (error) {
        console.error('入库失败:', error)
      }
    })
    .catch(() => {})
}

function handleDelete(row) {
  ElMessageBox.confirm('是否确认删除进货单？', '提示', { type: 'warning' })
    .then(async () => {
      await deletePurchaseOrder(row.id)
      ElMessage.success('删除成功')
      getList()
    })
    .catch(() => {})
}

function handleQuery() {
  queryParams.pageNum = 1
  getList()
}

function resetQuery() {
  queryFormRef.value?.resetFields()
  handleQuery()
}

onMounted(() => {
  getList()
})
</script>

<style scoped>
.amount-text {
  color: #67c23a;
  font-weight: 600;
}
</style>
