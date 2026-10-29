import request from '@/utils/request'

// 会员卡套餐API — 对接 /intra/care/residentcardpackage/*

// 获取套餐列表
export function getCardPackageList(params) {
  return request({
    url: '/intra/care/residentcardpackage/browse',
    method: 'get',
    params
  })
}

// 获取套餐详情
export function getCardPackageDetail(id) {
  return request({
    url: '/intra/care/residentcardpackage/detail/' + id,
    method: 'get'
  })
}

// 新增套餐
export function addCardPackage(data) {
  return request({
    url: '/intra/care/residentcardpackage/submit',
    method: 'post',
    data
  })
}

// 修改套餐
export function updateCardPackage(data) {
  return request({
    url: '/intra/care/residentcardpackage/submit',
    method: 'post',
    data
  })
}

// 删除套餐
export function deleteCardPackage(ids) {
  return request({
    url: '/intra/care/residentcardpackage/delete',
    method: 'post',
    data: Array.isArray(ids) ? ids : [ids]
  })
}

// 更新套餐状态
export function updatePackageStatus(id, status) {
  return request({
    url: '/intra/care/residentcardpackage/updateStatus',
    method: 'post',
    data: { id, status }
  })
}

// 获取启用的套餐列表（下拉选择用）
export function getEnabledPackageList() {
  return request({
    url: '/intra/care/residentcardpackage/enabledList',
    method: 'get'
  })
}

