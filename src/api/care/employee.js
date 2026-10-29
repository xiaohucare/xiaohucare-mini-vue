import request from '@/utils/request'

// ==================== 员工管理 ====================

// 获取员工列表
export function getEmployeeList(params) {
  return request({
    url: '/intra/care/employee/browse',
    method: 'get',
    params
  })
}

// 获取所有员工列表（不分页）
export function getAllEmployees(params) {
  return request({
    url: '/intra/care/employee/listAll',
    method: 'get',
    params
  })
}

// 获取员工详情
export function getEmployeeDetail(id) {
  return request({
    url: '/intra/care/employee/detail/' + id,
    method: 'get'
  })
}

// 新增/修改员工
export function submitEmployee(data) {
  return request({
    url: '/intra/care/employee/submit',
    method: 'post',
    data
  })
}

// 删除员工
export function deleteEmployee(ids) {
  return request({
    url: '/intra/care/employee/delete',
    method: 'post',
    data: Array.isArray(ids) ? ids : [ids]
  })
}

// 获取员工统计
export function getEmployeeStat(params) {
  return request({
    url: '/intra/care/employee/listStat',
    method: 'get',
    params
  })
}

// 导出员工数据
export function exportEmployee(params) {
  return request({
    url: '/intra/care/employee/toExport',
    method: 'post',
    data: params,
    responseType: 'blob'
  })
}
// 设置预约数量
export function modWash(data) {
  return request({
    url: '/intra/care/employee/modWash',
    method: 'post',
    data
  })
}
// 办理入职
export function hireEmployee(data) {
  return request({
    url: '/intra/care/employee/hire',
    method: 'post',
    data
  })
}

// 办理离职
export function leaveEmployee(data) {
  return request({
    url: '/intra/care/employee/leave',
    method: 'post',
    data
  })
}
