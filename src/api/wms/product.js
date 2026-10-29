import request from '@/utils/request'

// ==================== 商品管理 ====================

// 获取商品列表
export function getProductList(params) {
  return request({
    url: '/intra/wms/product/browse',
    method: 'get',
    params
  })
}

// 获取商品详情
export function getProductDetail(id) {
  return request({
    url: '/intra/wms/product/detail/' + id,
    method: 'get'
  })
}

// 新增/修改商品
export function submitProduct(data) {
  return request({
    url: '/intra/wms/product/submit',
    method: 'post',
    data
  })
}

// 删除商品
export function deleteProduct(ids) {
  return request({
    url: '/intra/wms/product/delete',
    method: 'post',
    data: Array.isArray(ids) ? ids : [ids]
  })
}

// 获取商品统计
export function getProductStat(params) {
  return request({
    url: '/intra/wms/product/listStat',
    method: 'get',
    params
  })
}

// ==================== 商品分类 ====================

// 获取分类列表
export function getCategoryList(params) {
  return request({
    url: '/intra/wms/category/browse',
    method: 'get',
    params
  })
}

// 获取分类详情
export function getCategoryDetail(id) {
  return request({
    url: '/intra/wms/category/detail/' + id,
    method: 'get'
  })
}

// 新增/修改分类
export function submitCategory(data) {
  return request({
    url: '/intra/wms/category/submit',
    method: 'post',
    data
  })
}

// 删除分类
export function deleteCategory(ids) {
  return request({
    url: '/intra/wms/category/delete',
    method: 'post',
    data: Array.isArray(ids) ? ids : [ids]
  })
}

// ==================== 商品SKU ====================

// 获取SKU列表
export function getSkuList(params) {
  return request({
    url: '/intra/wms/sku/list',
    method: 'get',
    params
  })
}

// 获取SKU详情
export function getSkuDetail(id) {
  return request({
    url: '/intra/wms/sku/detail/' + id,
    method: 'get'
  })
}

// 新增/修改SKU
export function submitSku(data) {
  return request({
    url: '/intra/wms/sku/submit',
    method: 'post',
    data
  })
}

// 删除SKU
export function deleteSku(ids) {
  return request({
    url: '/intra/wms/sku/delete',
    method: 'post',
    data: Array.isArray(ids) ? ids : [ids]
  })
}

// 根据商品ID获取SKU列表
export function getSkuByProductId(productId) {
  return request({
    url: '/intra/wms/sku/browse',
    method: 'get',
    params: { productId }
  })
}

// ==================== 库存查询 ====================

// 获取库存列表（使用StockController）
export function getStockList(params) {
  return request({
    url: '/intra/wms/stock/browse',
    method: 'get',
    params
  })
}

// 获取库存预警列表
export function getStockWarningList() {
  return request({
    url: '/intra/wms/stock/warning',
    method: 'get'
  })
}

// 获取库存详情（含批次）
export function getStockDetail(skuId) {
  return request({
    url: '/intra/wms/stock/detail/' + skuId,
    method: 'get'
  })
}

// 获取批次列表
export function getBatchList(params) {
  return request({
    url: '/intra/wms/stock/batch/browse',
    method: 'get',
    params
  })
}

// 获取库存日志
export function getStockLogList(params) {
  return request({
    url: '/intra/wms/stock/log/browse',
    method: 'get',
    params
  })
}

// 获取库存统计
export function getStockStat() {
  return request({
    url: '/intra/wms/stock/stat',
    method: 'get'
  })
}
