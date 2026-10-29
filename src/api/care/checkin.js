import request from '@/utils/request'

// 到店登记API（对接 /intra/hotel/checkin）

// 获取登记列表（分页）
export function getCheckinList(params) {
  return request({
    url: '/intra/hotel/checkin/browse',
    method: 'get',
    params
  })
}

// 统计数据
export function getCheckinStat(params) {
  return request({
    url: '/intra/hotel/checkin/listStat',
    method: 'get',
    params
  })
}

// 获取登记详情
export function getCheckinDetail(id) {
  return request({
    url: '/intra/hotel/checkin/detail/' + id,
    method: 'get'
  })
}

// 新增/修改登记（同一接口）
export function addCheckin(data) {
  return request({
    url: '/intra/hotel/checkin/submit',
    method: 'post',
    data
  })
}

export function updateCheckin(data) {
  return request({
    url: '/intra/hotel/checkin/submit',
    method: 'post',
    data
  })
}

// 删除登记
export function deleteCheckin(ids) {
  return request({
    url: '/intra/hotel/checkin/delete',
    method: 'post',
    data: Array.isArray(ids) ? ids : [ids]
  })
}

// 导出
export function exportCheckin(params) {
  return request({
    url: '/intra/hotel/checkin/toExport',
    method: 'post',
    params,
    responseType: 'blob'
  })
}

// 押金支付并完成登记（登记完成，转入康养中）
// 退住交接（退住列表/详情/草稿/完成/统计见 careHotel/checkout.js）

export function submitDepositAndComplete(data) {
  return request({
    url: '/intra/hotel/checkin/submitDepositAndComplete',
    method: 'post',
    data
  })
}
