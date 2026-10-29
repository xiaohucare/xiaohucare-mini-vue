import request from '@/utils/request'

// ==================== 客户管理 ====================

// 获取客户列表
export function getCustomerList(params) {
  return request({
    url: '/intra/wms/customer/browse',
    method: 'get',
    params
  })
}

// 获取客户详情
export function getCustomerDetail(id) {
  return request({
    url: '/intra/wms/customer/detail/' + id,
    method: 'get'
  })
}

// 新增/修改客户
export function submitCustomer(data) {
  return request({
    url: '/intra/wms/customer/submit',
    method: 'post',
    data
  })
}

// 删除客户
export function deleteCustomer(ids) {
  return request({
    url: '/intra/wms/customer/delete',
    method: 'post',
    data: Array.isArray(ids) ? ids : [ids]
  })
}

// 获取客户统计
export function getCustomerStat(params) {
  return request({
    url: '/intra/wms/customer/listStat',
    method: 'get',
    params
  })
}

// 根据手机号查询客户
export function getCustomerByPhone(phone) {
  return request({
    url: '/intra/wms/customer/browse',
    method: 'get',
    params: { phone }
  })
}
