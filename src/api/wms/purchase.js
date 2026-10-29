import request from '@/utils/request'

// ==================== 进货管理 ====================

// 获取进货单列表
export function getPurchaseOrderList(params) {
  return request({
    url: '/intra/wms/purchaseorder/browse',
    method: 'get',
    params
  })
}

// 获取进货单详情
export function getPurchaseOrderDetail(id) {
  return request({
    url: '/intra/wms/purchaseorder/detail/' + id,
    method: 'get'
  })
}

// 新增/修改进货单
export function submitPurchaseOrder(data) {
  return request({
    url: '/intra/wms/purchaseorder/submit',
    method: 'post',
    data
  })
}

// 删除进货单
export function deletePurchaseOrder(ids) {
  return request({
    url: '/intra/wms/purchaseorder/delete',
    method: 'post',
    data: Array.isArray(ids) ? ids : [ids]
  })
}

// 获取进货单统计
export function getPurchaseOrderStat(params) {
  return request({
    url: '/intra/wms/purchaseorder/listStat',
    method: 'get',
    params
  })
}

// 入库确认
export function confirmPurchaseOrder(id) {
  return request({
    url: '/intra/wms/purchaseorder/confirm/' + id,
    method: 'post'
  })
}
