import request from '@/utils/request'

// ==================== 统计报表 ====================

// 销售统计
export function getSalesStatistics(params) {
  return request({
    url: '/intra/wms/statistics/sales',
    method: 'get',
    params
  }).catch(err => {
    console.error('获取销售统计失败:', err)
    return { data: {} }
  })
}

// 库存统计
export function getInventoryStatistics() {
  return request({
    url: '/intra/wms/statistics/inventory',
    method: 'get'
  }).catch(err => {
    console.error('获取库存统计失败:', err)
    return { data: {} }
  })
}

// 进货统计
export function getPurchaseStatistics(params) {
  return request({
    url: '/intra/wms/statistics/purchase',
    method: 'get',
    params
  }).catch(err => {
    console.error('获取进货统计失败:', err)
    return { data: {} }
  })
}

// 品牌统计
export function getBrandStatistics(params) {
  return request({
    url: '/intra/wms/statistics/brand',
    method: 'get',
    params
  }).catch(err => {
    console.error('获取品牌统计失败:', err)
    return { data: { brandRanking: [], productRanking: [] } }
  })
}

// 过期预警
export function getExpiryWarning() {
  return request({
    url: '/intra/wms/statistics/expiry',
    method: 'get'
  }).catch(err => {
    console.error('获取过期预警失败:', err)
    return { data: [] }
  })
}

// 出货数据统计分析
export function getSalesAnalysis(params) {
  return request({
    url: '/intra/wms/statistics/sales-analysis',
    method: 'get',
    params
  }).catch(err => {
    console.error('获取出货数据统计失败:', err)
    return { data: { data: [], summary: {} } }
  })
}

// 客户时间交叉统计
export function getCustomerTimeCrossStats(params) {
  return request({
    url: '/intra/wms/statistics/customer-time-cross',
    method: 'get',
    params
  }).catch(err => {
    console.error('获取客户时间交叉统计失败:', err)
    return { data: { customers: [], periods: [], data: {}, summary: {} } }
  })
}
