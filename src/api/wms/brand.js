import request from '@/utils/request'

// ==================== 品牌管理 ====================

// 获取品牌列表
export function getBrandList(params) {
  return request({
    url: '/intra/wms/brand/browse',
    method: 'get',
    params
  })
}

// 获取品牌详情
export function getBrandDetail(id) {
  return request({
    url: '/intra/wms/brand/detail/' + id,
    method: 'get'
  })
}

// 新增/修改品牌
export function submitBrand(data) {
  return request({
    url: '/intra/wms/brand/submit',
    method: 'post',
    data
  })
}

// 删除品牌
export function deleteBrand(ids) {
  return request({
    url: '/intra/wms/brand/delete',
    method: 'post',
    data: Array.isArray(ids) ? ids : [ids]
  })
}

// 获取品牌统计
export function getBrandStat(params) {
  return request({
    url: '/intra/wms/brand/listStat',
    method: 'get',
    params
  })
}
