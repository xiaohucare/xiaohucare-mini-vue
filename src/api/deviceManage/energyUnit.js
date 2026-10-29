import request from '@/utils/request'

// 查询用能单元列表
export function listEnergyUnit(query) {
  return request({
    url: '/intra/iot/group/listGroupTree',
    method: 'get',
    params: query
  })
}

// 查询用能单元详细
export function getEnergyUnit(groupId) {
  return request({
    url: '/intra/iot/group/detail/' + groupId,
    method: 'get'
  })
}

// 新增用能单元
export function addEnergyUnit(data) {
  return request({
    url: '/intra/iot/group/submit',
    method: 'post',
    data: data
  })
}

// 修改用能单元
export function updateEnergyUnit(data) {
  return request({
    url: '/intra/iot/group/submit',
    method: 'post',
    data: data
  })
}

// 删除用能单元
export function delEnergyUnit(groupIds) {
  return request({
    url: '/intra/iot/group/delete',
    method: 'post',
    data: groupIds
  })
}

// 获取分组下所有设备
export function getDeviceGroupList(groupId) {
  return request({
    url: `/intra/iot/group/getDeviceGroupList/${groupId}`,
    method: 'get'
  })
}

// 删除分组下设备
export function delDevice(deviceIds) {
  return request({
    url: '/intra/iot/group/delDevice',
    method: 'post',
    data: deviceIds
  })
}

// 添加设备到分组
export function addDevice(data) {
  return request({
    url: '/intra/iot/group/addDevice',
    method: 'post',
    data: data
  })
}