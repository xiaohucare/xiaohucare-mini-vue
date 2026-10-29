import request from '@/utils/request'
import { fi } from 'element-plus/es/locales.mjs'

// 生成模拟数据
function generateMockFeeItems(count = 20) {
  const mockData = []
  const itemTypes = ['住宿费', '餐费', '护理费', '医疗服务费', '其他']
  const itemNames = {
    '住宿费': ['标准单人间', '豪华单人间', '标准双人间', '豪华双人间', '套房'],
    '餐费': ['普通餐', '营养餐', '糖尿病餐', '高血压餐', '流食'],
    '护理费': ['一级护理', '二级护理', '三级护理', '特级护理', '康复护理'],
    '医疗服务费': ['常规体检', '药品费', '理疗费', '康复训练', '特殊护理'],
    '其他': ['水电费', '空调费', '洗衣费', '娱乐活动费', '其他杂费']
  }
  const units = {
    '住宿费': '月',
    '餐费': '天',
    '护理费': '月',
    '医疗服务费': '次',
    '其他': '月'
  }
  
  for (let i = 1; i <= count; i++) {
    const itemType = itemTypes[Math.floor(Math.random() * itemTypes.length)]
    const availableNames = itemNames[itemType]
    const itemName = availableNames[Math.floor(Math.random() * availableNames.length)]
    
    // 根据项目类型设置合理的价格范围
    let priceRange = { min: 0, max: 0 }
    switch (itemType) {
      case '住宿费':
        priceRange = { min: 2000, max: 8000 }
        break
      case '餐费':
        priceRange = { min: 30, max: 100 }
        break
      case '护理费':
        priceRange = { min: 1000, max: 5000 }
        break
      case '医疗服务费':
        priceRange = { min: 50, max: 500 }
        break
      case '其他':
        priceRange = { min: 100, max: 1000 }
        break
    }
    
    const unitPrice = (priceRange.min + Math.random() * (priceRange.max - priceRange.min)).toFixed(2)
    
    mockData.push({
      id: i,
      nursingHomeId: 1,
      itemName: itemName,
      itemType: itemType,
      unitPrice: parseFloat(unitPrice),
      unit: units[itemType],
      description: getItemDescription(itemType, itemName),
      status: Math.random() > 0.1 ? 1 : 0, // 90%启用，10%停用
      createAt: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString()
    })
  }
  
  return mockData
}

function getItemDescription(itemType, itemName) {
  const descriptions = {
    '住宿费': `${itemName}收费标准，包含基本设施使用`,
    '餐费': `${itemName}，营养均衡，适合老年人食用`,
    '护理费': `${itemName}服务，专业护理人员提供`,
    '医疗服务费': `${itemName}，专业医疗服务`,
    '其他': `${itemName}，其他相关费用`
  }
  return descriptions[itemType] || '收费项目描述'
}

// 生成收费记录模拟数据
function generateMockCharges(count = 100) {
  const mockData = []
  const paymentMethods = ['现金', '银行卡', '微信', '支付宝']
  const paymentStatuses = ['已缴', '未缴', '欠费']
  const chargePeriods = ['2024-01', '2024-02', '2024-03', '2024-04', '2024-05', '2024-06']
  
  for (let i = 1; i <= count; i++) {
    const residentId = Math.floor(Math.random() * 50) + 1
    const feeItemId = Math.floor(Math.random() * 20) + 1
    const chargeDate = new Date(Date.now() - Math.random() * 180 * 24 * 60 * 60 * 1000)
    const quantity = (1 + Math.random() * 10).toFixed(2)
    const unitPrice = (50 + Math.random() * 500).toFixed(2)
    const totalAmount = (parseFloat(quantity) * parseFloat(unitPrice)).toFixed(2)
    
    mockData.push({
      id: i,
      nursingHomeId: 1,
      residentId: residentId,
      feeItemId: feeItemId,
      chargeDate: chargeDate.toISOString().split('T')[0],
      quantity: parseFloat(quantity),
      unitPrice: parseFloat(unitPrice),
      totalAmount: parseFloat(totalAmount),
      chargePeriod: chargePeriods[Math.floor(Math.random() * chargePeriods.length)],
      remarks: getRandomRemarks(),
      create_at: new Date(Date.now() - Math.random() * 180 * 24 * 60 * 60 * 1000).toISOString()
    })
  }
  
  return mockData
}

// 生成缴费记录模拟数据
function generateMockPayments(count = 80) {
  const mockData = []
  const paymentMethods = ['现金', '银行卡', '微信', '支付宝']
  const paymentStatuses = ['已缴', '未缴', '欠费']
  
  for (let i = 1; i <= count; i++) {
    const residentId = Math.floor(Math.random() * 50) + 1
    const paymentDate = new Date(Date.now() - Math.random() * 180 * 24 * 60 * 60 * 1000)
    const amount = (100 + Math.random() * 2000).toFixed(2)
    const paymentMethod = paymentMethods[Math.floor(Math.random() * paymentMethods.length)]
    const paymentStatus = paymentStatuses[Math.floor(Math.random() * paymentStatuses.length)]
    
    mockData.push({
      id: i,
      nursingHomeId: 1,
      residentId: residentId,
      payment_date: paymentDate.toISOString().split('T')[0],
      amount: parseFloat(amount),
      payment_method: paymentMethod,
      payment_status: paymentStatus,
      operator: `操作员${Math.floor(Math.random() * 5) + 1}`,
      remarks: getRandomPaymentRemarks(paymentStatus),
      create_at: new Date(Date.now() - Math.random() * 180 * 24 * 60 * 60 * 1000).toISOString()
    })
  }
  
  return mockData
}

function getRandomRemarks() {
  const remarks = [
    '正常收费',
    '月度结算',
    '季度收费',
    '特殊护理费用',
    '医疗附加费',
    '餐费调整',
    '住宿费优惠',
    '护理费调整'
  ]
  return remarks[Math.floor(Math.random() * remarks.length)]
}

function getRandomPaymentRemarks(status) {
  const remarks = {
    '已缴': ['正常缴费', '提前缴费', '季度结算', '年度缴费'],
    '未缴': ['待缴费', '账单已出', '催缴中', '延期缴费'],
    '欠费': ['逾期未缴', '欠费催缴', '部分缴费', '协商处理中']
  }
  const statusRemarks = remarks[status] || ['正常缴费']
  return statusRemarks[Math.floor(Math.random() * statusRemarks.length)]
}

// 模拟数据缓存
let mockFeeItemsData = generateMockFeeItems(20)
let mockChargesData = generateMockCharges(100)
let mockPaymentsData = generateMockPayments(80)

// 收费项目管理
export function getFeeItemsList(params) {
  return request({
    url: "/intra/charge/chargefeeitems/browse",
    method: "get",
    params: params,
  });
}
export function getFeeItemListTplAll(params) {
  return request({
    url: "/intra/charge/chargefeeitems/listTplAll",
    method: "get",
    params: params,
  });
}
export function getFeeItemDetail(id) {
  return request({
             url: "/intra/charge/chargefeeitems/detail/" + id,
             method: "get",
         });
}
export function addFeeItem(data) {
 return request({
             url: "/intra/charge/chargefeeitems/submit",
             method: "post",
             data,
         });
}

export function updateFeeItem(data) {
  return request({
             url: "/intra/charge/chargefeeitems/submit",
             method: "post",
             data,
         });
}

export function deleteFeeItem(id) {
   return request({
            url: "/intra/charge/chargefeeitems/delete",
            method: "delete",
            data: Array.isArray(id) ? id : [id]
        });
}
// 收费记录管理
export function getChargesList(params) {
   return request({
    url: "/intra/charge/charge/browse",
    method: "get",
    params: params,
  });
}


export function getChargeDetail(id) {
  return request({
             url: "/intra/charge/charge/detail/" + id,
             method: "get",
         });
}
export function addCharge(data) {
 return request({
             url: "/intra/charge/charge/submit",
             method: "post",
             data,
         });
}

export function updateCharge(data) {
  return request({
             url: "/intra/charge/charge/submit",
             method: "post",
             data,
         });
}

export function deleteCharge(id) {
   return request({
            url: "/intra/charge/charge/delete",
            method: "delete",
            data: Array.isArray(id) ? id : [id]
        });
}

// 缴费记录管理
export function getPaymentsList(params) {
  // mockPaymentsData.map(item => {
  //   item.id = null;
  //   item.nursingHomeId = 1;
  //   item.residentId=1
  //   item.paymentDate = new Date().toISOString();
  //   addPayment(item);
  // })
  return request({
    url: "/intra/charge/chargepayment/browse",
    method: "get",
    params: params,
  });
}
export function getPaymentDetail(id) {
  return request({
             url: "/intra/charge/chargepayment/detail/" + id,
             method: "get",
         });
}
export function addPayment(data) {
 return request({
             url: "/intra/charge/chargepayment/submit",
             method: "post",
             data,
         });
}

export function updatePayment(data) {
  return request({
             url: "/intra/charge/chargepayment/submit",
             method: "post",
             data,
         });
}

export function deletePayment(id) {
   return request({
            url: "/intra/charge/chargepayment/delete",
            method: "delete",
            data: Array.isArray(id) ? id : [id]
        });
}

// 收费套餐管理
export function getFeeGroupList(params) {
 return request({
          url: "/intra/charge/chargefeegroup/browse",
          method: "get",
          params: params,
      });
}
export function getFeeGroupListAll(params) {
 return request({
          url: "/intra/charge/chargefeegroup/listAll",
          method: "get",
          params: params,
      });
}

export function getFeeGroupDetail(id) {
  return request({
              url: "/intra/charge/chargefeegroup/detail/" + id,
              method: "get",
          });
}

export function addFeeGroup(data) {
  return request({
             url: "/intra/charge/chargefeegroup/submit",
             method: "post",
             data,
         });
}

export function updateFeeGroup(data) {
   return request({
             url: "/intra/charge/chargefeegroup/submit",
             method: "post",
             data,
         });
}

export function deleteFeeGroup(id) {
  return request({
            url: "/intra/charge/chargefeegroup/delete",
            method: "delete",
            data: Array.isArray(id) ? id : [id]
        });
}

// 统计功能
export function getFeeStatistics(params) {
  return new Promise((resolve) => {
    setTimeout(() => {
      const { startDate, endDate } = params || {}
      
      // 计算总收入
      const totalIncome = mockPaymentsData
        .filter(payment => payment.payment_status === '已缴')
        .reduce((sum, payment) => sum + payment.amount, 0)
      
      // 计算欠费总额
      const totalArrears = mockPaymentsData
        .filter(payment => payment.payment_status === '欠费')
        .reduce((sum, payment) => sum + payment.amount, 0)
      
      // 按收费项目统计
      const feeItemStats = {}
      mockChargesData.forEach(charge => {
        const feeItem = mockFeeItemsData.find(item => item.id === charge.fee_item_id)
        if (feeItem) {
          if (!feeItemStats[feeItem.item_type]) {
            feeItemStats[feeItem.item_type] = {
              type: feeItem.item_type,
              amount: 0,
              count: 0
            }
          }
          feeItemStats[feeItem.item_type].amount += charge.total_amount
          feeItemStats[feeItem.item_type].count += 1
        }
      })
      
      // 按月统计收入
      const monthlyStats = {}
      mockPaymentsData.forEach(payment => {
        if (payment.payment_status === '已缴') {
          const month = payment.payment_date.substring(0, 7) // YYYY-MM
          if (!monthlyStats[month]) {
            monthlyStats[month] = 0
          }
          monthlyStats[month] += payment.amount
        }
      })
      
      resolve({
        code: 200,
        msg: 'success',
        data: {
          totalIncome: totalIncome.toFixed(2),
          totalArrears: totalArrears.toFixed(2),
          feeItemStats: Object.values(feeItemStats),
          monthlyStats: monthlyStats
        }
      })
    }, 500)
  })
}