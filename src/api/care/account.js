import request from '@/utils/request'

// ==================== 员工登录账号 ====================

// 查询员工登录账号信息
export function getAccountDetail(employeeId) {
  return request({
    url: '/intra/care/employee/account/detail/' + employeeId,
    method: 'get'
  })
}

// 开通登录账号
export function openAccount(data) {
  return request({
    url: '/intra/care/employee/account/open',
    method: 'post',
    data
  })
}

// 重置登录密码
export function resetAccountPwd(data) {
  return request({
    url: '/intra/care/employee/account/resetPwd',
    method: 'post',
    data
  })
}

// 停用/启用登录账号
export function changeAccountState(data) {
  return request({
    url: '/intra/care/employee/account/state',
    method: 'post',
    data
  })
}

// 为员工分配角色
export function assignAccountRoles(data) {
  return request({
    url: '/intra/care/employee/account/assignRole',
    method: 'post',
    data
  })
}

// 本机构可分配角色列表
export function getAssignableRoles() {
  return request({
    url: '/intra/care/employee/account/roles',
    method: 'get'
  })
}
