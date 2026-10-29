import request from '@/utils/request'

// ==================== 康养值班人员管理 ====================

// 分页列表
export function getStaffList(params) {
  return request({
    url: '/intra/hotel/boardingstaff/browse',
    method: 'get',
    params: { pageNum: 1, pageSize: 20, ...params }
  })
}

// 全量列表（用于值班设置下拉选择）
export function getStaffAll(params) {
  return request({
    url: '/intra/hotel/boardingstaff/listAll',
    method: 'get',
    params: params || {}
  })
}

// 详情
export function getStaffDetail(id) {
  return request({
    url: '/intra/hotel/boardingstaff/detail/' + id,
    method: 'get'
  })
}

// 新增 / 修改
export function submitStaff(data) {
  return request({
    url: '/intra/hotel/boardingstaff/submit',
    method: 'post',
    data
  })
}

// 删除
export function deleteStaff(ids) {
  return request({
    url: '/intra/hotel/boardingstaff/delete',
    method: 'post',
    data: Array.isArray(ids) ? ids : [ids]
  })
}

// 启用 / 禁用
export function toggleStaff(id) {
  return request({
    url: '/intra/hotel/boardingstaff/toggle/' + id,
    method: 'post'
  })
}

// ==================== 值班排班 ====================

// 查询某日值班列表
export function getDutyList(date) {
  return request({
    url: '/intra/hotel/boardingstaff/dutyList',
    method: 'get',
    params: { date }
  })
}

// 设置某日值班人员（覆盖方式）
export function setDuty(data) {
  return request({
    url: '/intra/hotel/boardingstaff/dutySet',
    method: 'post',
    data
  })
}

// 移除单条值班记录
export function removeDuty(id) {
  return request({
    url: '/intra/hotel/boardingstaff/dutyRemove/' + id,
    method: 'post'
  })
}
