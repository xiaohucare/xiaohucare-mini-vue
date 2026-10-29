import request from '@/utils/request'

// ==================== 收费总览统计 ====================

// 获取收费统计汇总数据
export function getBillingStatistics(params) {
  return request({
    url: '/intra/care/bill/statistics',
    method: 'get',
    params
  })
}

// ==================== 收费类目管理 ====================

// 获取收费类目列表
export function getFeeItemList(params) {
  return request({
    url: '/intra/care/feeitem/list',
    method: 'get',
    params
  })
}

// 获取收费类目详情
export function getFeeItemDetail(id) {
  return request({
    url: '/intra/care/feeitem/detail/' + id,
    method: 'get'
  })
}

// 新增收费类目
export function addFeeItem(data) {
  return request({
    url: '/intra/care/feeitem/submit',
    method: 'post',
    data
  })
}

// 修改收费类目
export function updateFeeItem(data) {
  return request({
    url: '/intra/care/feeitem/submit',
    method: 'post',
    data
  })
}

// 删除收费类目
export function deleteFeeItem(id) {
  return request({
    url: '/intra/care/feeitem/delete',
    method: 'post',
    data: Array.isArray(id) ? id : [id]
  })
}

// 启用/禁用收费类目
export function toggleFeeItem(id, enabled) {
  return request({
    url: '/intra/care/feeitem/toggle/' + id,
    method: 'post',
    data: { enabled }
  })
}

// ==================== 收费套餐管理 ====================

// 获取套餐列表
export function getPackageList(params) {
  return request({
    url: '/intra/care/chargecombo/list',
    method: 'get',
    params
  })
}

// 获取套餐详情（含类目列表）
export function getPackageDetail(id) {
  return request({
    url: '/intra/care/chargecombo/detail/' + id,
    method: 'get'
  })
}

// 新增套餐
export function addPackage(data) {
  return request({
    url: '/intra/care/chargecombo/submit',
    method: 'post',
    data
  })
}

// 修改套餐
export function updatePackage(data) {
  return request({
    url: '/intra/care/chargecombo/submit',
    method: 'post',
    data
  })
}

// 删除套餐
export function deletePackage(id) {
  return request({
    url: '/intra/care/chargecombo/delete',
    method: 'post',
    data: Array.isArray(id) ? id : [id]
  })
}

// 启用/禁用套餐
export function togglePackage(id, enabled) {
  return request({
    url: '/intra/care/chargecombo/toggle/' + id,
    method: 'post',
    data: { enabled }
  })
}

// ==================== 押金管理 ====================

// 获取押金记录列表
export function getDepositList(params) {
  return request({
    url: '/intra/hotel/deposit/list',
    method: 'get',
    params
  })
}

// 获取押金详情
export function getDepositDetail(id) {
  return request({
    url: '/intra/hotel/deposit/detail/' + id,
    method: 'get'
  })
}

// 收取押金
export function collectDeposit(data) {
  return request({
    url: '/intra/hotel/deposit/collect',
    method: 'post',
    data
  })
}

// 退还押金
export function refundDeposit(id, data) {
  return request({
    url: '/intra/hotel/deposit/refund/' + id,
    method: 'post',
    data
  })
}

// 扣押金
export function deductDeposit(id, data) {
  return request({
    url: '/intra/hotel/deposit/deduct/' + id,
    method: 'post',
    data
  })
}

// ==================== 扣费记录 ====================

// 获取扣费记录列表
export function getDeductionList(params) {
  return request({
    url: '/intra/hotel/deduction/browse',
    method: 'get',
    params
  })
}

// 添加扣费记录
export function addDeduction(data) {
  return request({
    url: '/intra/hotel/deduction/add',
    method: 'post',
    data
  })
}

// 删除扣费记录
export function deleteDeduction(id) {
  return request({
    url: '/intra/hotel/deduction/delete',
    method: 'post',
    data: Array.isArray(id) ? id : [id]
  })
}

// ==================== 离店结算 ====================

// 获取待结算登记列表（分页）
export function getSettlementList(params) {
  return request({
    url: '/intra/hotel/checkin/browseSettle',
    method: 'get',
    params
  })
}

// 获取结算统计
export function getSettlementStat(params) {
  return request({
    url: '/intra/hotel/checkin/getSettleStat',
    method: 'get',
    params
  })
}

// 获取结算详情（含费用明细）
export function getSettlementDetail(boardingId) {
  return request({
    url: '/intra/hotel/checkin/getSettleDetail/' + boardingId,
    method: 'get'
  })
}

// 获取结算费用逐笔明细（按登记单）
export function getSettlementItems(checkinId) {
  return request({
    url: '/intra/hotel/checkin/settlementItems/' + checkinId,
    method: 'get'
  })
}

// 预计算结算金额
export function previewSettlement(boardingId) {
  return request({
    url: '/intra/hotel/checkin/preview/' + boardingId,
    method: 'get'
  })
}

// 提交结算
export function submitSettlement(data) {
  return request({
    url: '/intra/hotel/checkin/submitSettle',
    method: 'post',
    data
  })
}

// 获取结算账单PDF/打印数据
export function getBillDetail(settlementId) {
  return request({
    url: '/intra/hotel/checkin/bill/' + settlementId,
    method: 'get'
  })
}

// ==================== 统计 ====================

// 获取今日收款汇总
export function getTodayIncome() {
  return request({
    url: '/intra/hotel/billing/today',
    method: 'get'
  })
}
