import request from '@/utils/request'

// ==================== 出货管理 ====================

// 获取出货单列表
export function getSalesOrderList(params) {
  return request({
    url: '/intra/wms/salesorder/browse',
    method: 'get',
    params
  })
}

// 获取出货单详情
export function getSalesOrderDetail(id) {
  return request({
    url: '/intra/wms/salesorder/detail/' + id,
    method: 'get'
  })
}

// 新增出货单（销售开单）
export function submitSalesOrder(data) {
  return request({
    url: '/intra/wms/salesorder/checkout',
    method: 'post',
    data
  })
}

// 删除出货单
export function deleteSalesOrder(ids) {
  return request({
    url: '/intra/wms/salesorder/delete',
    method: 'post',
    data: Array.isArray(ids) ? ids : [ids]
  })
}

// 获取出货单统计
export function getSalesOrderStat(params) {
  return request({
    url: '/intra/wms/salesorder/listStat',
    method: 'get',
    params
  })
}

// ==================== 出货台 ====================

// 获取可售SKU列表（有库存的）
export function getAvailableSkuList(params) {
  return request({
    url: '/intra/wms/sku/browse',
    method: 'get',
    params
  })
}

// 提交销售订单
export function checkoutSales(data) {
  return request({
    url: '/intra/wms/salesorder/checkout',
    method: 'post',
    data
  })
}
