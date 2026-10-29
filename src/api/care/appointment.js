import request from '@/utils/request'

// 获取预约列表
export function getAppointmentList(params) {
  return request({
    url: '/intra/hotel/appointment/list',
    method: 'get',
    params
  })
}

// 获取预约详情
export function getAppointmentDetail(id) {
  return request({
    url: '/intra/hotel/appointment/detail/' + id,
    method: 'get'
  })
}

// 新增预约
export function addAppointment(data) {
  return request({
    url: '/intra/hotel/appointment/submit',
    method: 'post',
    data
  })
}

// 更新预约
export function updateAppointment(data) {
  return request({
    url: '/intra/hotel/appointment/submit',
    method: 'post',
    data
  })
}

// 确认预约
export function confirmAppointment(id) {
  return request({
    url: '/intra/hotel/appointment/confirm/' + id,
    method: 'post'
  })
}

// 转为到店登记
export function convertToCheckin(id) {
  return request({
    url: '/intra/hotel/appointment/convert/' + id,
    method: 'post'
  })
}

// 取消预约
export function cancelAppointment(id) {
  return request({
    url: '/intra/hotel/appointment/cancel/' + id,
    method: 'post'
  })
}

// 删除预约
export function deleteAppointment(id) {
  return request({
    url: '/intra/hotel/appointment/delete',
    method: 'post',
    data: Array.isArray(id) ? id : [id]
  })
}
