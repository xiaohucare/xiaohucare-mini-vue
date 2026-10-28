<template>
  <div class="app-container">
    <el-card shadow="never">
      <!-- 搜索栏 -->
      <el-form :model="queryParams" ref="queryFormRef" :inline="true" label-width="68px">
        <el-form-item label="出货单号" prop="orderNo">
          <el-input v-model="queryParams.orderNo" placeholder="请输入出货单号" clearable @keyup.enter="handleQuery" />
        </el-form-item>
        <el-form-item label="客户" prop="customerName">
          <el-input v-model="queryParams.customerName" placeholder="请输入客户姓名" clearable @keyup.enter="handleQuery" />
        </el-form-item>
        <el-form-item label="支付方式" prop="payMethod">
          <el-select v-model="queryParams.payMethod" placeholder="全部" clearable style="width:120px">
            <el-option label="现金" value="CASH" />
            <el-option label="微信" value="WECHAT" />
            <el-option label="支付宝" value="ALIPAY" />
            <el-option label="银行卡" value="CARD" />
            <el-option label="会员卡" value="MEMBER_CARD" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleQuery">搜索</el-button>
          <el-button @click="resetQuery">重置</el-button>
        </el-form-item>
      </el-form>

      <!-- 表格 -->
      <el-table v-loading="loading" :data="salesList" stripe border>
        <el-table-column label="出货单号" prop="orderNo" min-width="160" />
        <el-table-column label="客户" prop="customerName" min-width="100" />
        <el-table-column label="客户电话" prop="customerPhone" min-width="120" />
        <el-table-column label="商品数量" prop="totalCount" min-width="90" align="center" />
        <el-table-column label="总金额" prop="totalAmount" min-width="100" align="right">
          <template #default="{ row }">¥{{ row.totalAmount }}</template>
        </el-table-column>
        <el-table-column label="优惠" prop="discountAmount" width="80" align="right">
          <template #default="{ row }">¥{{ row.discountAmount || '0.00' }}</template>
        </el-table-column>
        <el-table-column label="实收" width="100" align="right">
          <template #default="{ row }">
            <span class="amount-text">¥{{ row.actualAmount }}</span>
          </template>
        </el-table-column>
        <el-table-column label="支付方式" width="90" align="center">
          <template #default="{ row }">
            <el-tag :type="getPayMethodType(row.payMethod)">{{ getPayMethodText(row.payMethod) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="120" align="center">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : row.status === 2 ? 'danger' : 'info'">
              {{ row.status === 1 ? '已完成' : row.status === 2 ? '已退货' : '已取消' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="创建时间" prop="createAt" width="160" />
        <el-table-column label="操作" align="center" width="180" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" size="small" @click="handleViewDetail(row)">详情</el-button>
            <el-button link type="success" size="small" @click="handlePrint(row)" v-if="row.status === 1">打印</el-button>
            <el-button link type="danger" size="small" @click="handleDelete(row)" v-hasPermi="['wms:salesorder:remove']">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <pagination v-show="total > 0" :total="total" v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize" @pagination="getList" />
    </el-card>

    <!-- 详情对话框 -->
    <el-dialog v-model="detailVisible" title="出货单详情" width="800px" append-to-body>
      <el-descriptions :column="2" border>
        <el-descriptions-item label="出货单号">{{ detail.orderNo }}</el-descriptions-item>
        <el-descriptions-item label="客户">{{ detail.customerName }}</el-descriptions-item>
        <el-descriptions-item label="客户电话">{{ detail.customerPhone }}</el-descriptions-item>
        <el-descriptions-item label="支付方式">{{ getPayMethodText(detail.payMethod) }}</el-descriptions-item>
        <el-descriptions-item label="总金额">¥{{ detail.totalAmount }}</el-descriptions-item>
        <el-descriptions-item label="优惠金额">¥{{ detail.discountAmount || '0.00' }}</el-descriptions-item>
        <el-descriptions-item label="实收金额"><span class="amount-text">¥{{ detail.actualAmount }}</span></el-descriptions-item>
        <el-descriptions-item label="创建时间">{{ detail.createAt }}</el-descriptions-item>
      </el-descriptions>

      <el-divider content-position="left">商品明细</el-divider>
      <el-table :data="detail.salesItemVOList || []" stripe border>
        <el-table-column label="SKU编码" prop="skuCode" width="120" />
        <el-table-column label="商品名称" prop="skuName" show-overflow-tooltip />
        <el-table-column label="销售价" prop="salePrice" width="90" align="right">
          <template #default="{ row }">¥{{ row.salePrice }}</template>
        </el-table-column>
        <el-table-column label="数量" prop="quantity" width="80" align="center" />
        <el-table-column label="小计" width="100" align="right">
          <template #default="{ row }"><span class="amount-text">¥{{ row.subtotal }}</span></template>
        </el-table-column>
      </el-table>

      <div v-if="detail.remark" style="margin-top:15px">
        <strong>备注：</strong>{{ detail.remark }}
      </div>

      <template #footer>
        <el-button @click="detailVisible = false">关 闭</el-button>
        <el-button type="primary" @click="handlePrint(detail)" v-if="detail.status === 1">打印出货单</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getSalesOrderList, getSalesOrderDetail, deleteSalesOrder } from '@/api/wms/sales'

const loading = ref(false)
const total = ref(0)
const salesList = ref([])
const detailVisible = ref(false)
const detail = ref({})

const queryParams = reactive({ pageNum: 1, pageSize: 10, orderNo: '', customerName: '', payMethod: '' })

const payTagMap = { WECHAT: 'success', ALIPAY: 'primary', CASH: 'warning', CARD: 'info', MEMBER_CARD: 'danger' }
const payTextMap = { WECHAT: '微信', ALIPAY: '支付宝', CASH: '现金', CARD: '银行卡', MEMBER_CARD: '会员卡' }
function getPayMethodType(m) { return payTagMap[m] || 'info' }
function getPayMethodText(m) { return payTextMap[m] || m }

async function getList() {
  loading.value = true
  try {
    const res = await getSalesOrderList(queryParams)
    const data = res.data || res
    salesList.value = Array.isArray(data) ? data : (data.list || data.records || [])
    total.value = data.total || salesList.value.length
  } catch (e) {
    console.error('加载出货记录失败:', e)
    ElMessage.error('加载出货记录失败')
  } finally {
    loading.value = false
  }
}

async function handleViewDetail(row) {
  try {
    const res = await getSalesOrderDetail(row.id)
    detail.value = res.data || res
    detailVisible.value = true
  } catch (e) {
    ElMessage.error('加载详情失败')
  }
}

function handlePrint(row) {
  // 加载完整数据（如果是从表格直接打印）
  if (!row.salesItemVOList) {
    getSalesOrderDetail(row.id).then(res => {
      const data = res.data || res
      printSalesOrder(data)
    }).catch(() => {
      ElMessage.error('加载数据失败')
    })
  } else {
    printSalesOrder(row)
  }
}

function printSalesOrder(order) {
  const printContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>出货单 - ${order.orderNo}</title>
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
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
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
          color: #e74c3c;
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
          <h1>出 货 单</h1>
          <div class="subtitle">DELIVERY NOTE</div>
        </div>
        
        <div class="info-section">
          <div class="info-grid">
            <div class="info-item">
              <span class="info-label">单号：</span>
              <span class="info-value" style="font-weight: 600; color: #667eea;">${order.orderNo || '-'}</span>
            </div>
            <div class="info-item">
              <span class="info-label">时间：</span>
              <span class="info-value">${order.createAt || '-'}</span>
            </div>
            <div class="info-item">
              <span class="info-label">客户：</span>
              <span class="info-value">${order.customerName || '-'}</span>
            </div>
            <div class="info-item">
              <span class="info-label">电话：</span>
              <span class="info-value">${order.customerPhone || '-'}</span>
            </div>
            <div class="info-item">
              <span class="info-label">支付方式：</span>
              <span class="info-value">${getPayMethodText(order.payMethod)}</span>
            </div>
            <div class="info-item">
              <span class="info-label">商品数量：</span>
              <span class="info-value">${order.totalCount || 0} 件</span>
            </div>
          </div>
        </div>
        
        <table class="items-table">
          <thead>
            <tr>
              <th style="width: 120px;">SKU编码</th>
              <th>商品名称</th>
              <th class="text-right" style="width: 90px;">销售价</th>
              <th class="text-center" style="width: 70px;">数量</th>
              <th class="text-right" style="width: 100px;">小计</th>
            </tr>
          </thead>
          <tbody>
            ${(order.salesItemVOList || []).map((item, index) => `
              <tr style="${index % 2 === 0 ? 'background: #fafbfc;' : ''}">
                <td style="font-family: monospace;">${item.skuCode || '-'}</td>
                <td>${item.skuName || '-'}</td>
                <td class="text-right">¥${item.salePrice || '0.00'}</td>
                <td class="text-center">${item.quantity || 0}</td>
                <td class="text-right" style="font-weight: 600; color: #667eea;">¥${item.subtotal || '0.00'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        
        <div class="summary-section">
          <div class="summary-row">
            <span class="label">总金额：</span>
            <span class="value">¥${order.totalAmount || '0.00'}</span>
          </div>
          <div class="summary-row">
            <span class="label">优惠金额：</span>
            <span class="value" style="color: #e67e22;">-¥${order.discountAmount || '0.00'}</span>
          </div>
          <div class="summary-row total">
            <span>实收金额：</span>
            <span>¥${order.actualAmount || '0.00'}</span>
          </div>
        </div>
        
        ${order.remark ? `
          <div class="remark-section">
            <strong>📝 备注：</strong>
            <p>${order.remark}</p>
          </div>
        ` : ''}
        
        <div class="footer">
          <div class="shop-name">感谢您的惠顾！</div>
          <p>打印时间：${new Date().toLocaleString('zh-CN')}</p>
          <p style="margin-top: 8px; font-size: 11px; color: #bdc3c7;">本单据作为交易凭证，请妥善保管</p>
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

function handleDelete(row) {
  ElMessageBox.confirm('是否确认删除出货单？', '提示', { type: 'warning' }).then(async () => {
    await deleteSalesOrder(row.id)
    ElMessage.success('删除成功')
    getList()
  }).catch(() => {})
}

function handleQuery() { queryParams.pageNum = 1; getList() }
function resetQuery() { Object.assign(queryParams, { pageNum: 1, orderNo: '', customerName: '', payMethod: '' }); getList() }

onMounted(getList)
</script>

<style scoped>
.amount-text { color: #67c23a; font-weight: 600; }
</style>
