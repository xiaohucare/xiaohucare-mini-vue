import request from '@/utils/request'

// ==================== 设备类型相关API ====================
// 查询设备类型列表
export function getDeviceTypeList(query) {
  return request({
    url: '/intra/iot/devicetype/browse',
    method: 'get',
    params: query
  })
}

// 查询设备类型详细
export function getDeviceTypeDetailById(id) {
  return request({
    url: '/intra/iot/devicetype/detail/' + id,
    method: 'get'
  })
}

// 新增设备类型
export function addDeviceType(data) {
  return request({
    url: '/intra/iot/devicetype/add',
    method: 'post',
    data: data
  })
}

// 修改设备类型
export function updateDeviceType(data) {
  return request({
    url: '/intra/iot/devicetype/edit',
    method: 'post',
    data: data
  })
}

// 保存或更新设备类型（统一接口）
export function saveDeviceType(data) {
  return request({
    url: '/intra/iot/devicetype/submit',
    method: 'post',
    data: data
  })
}

// 删除设备类型
export function delDeviceType(ids) {
  return request({
    url: '/intra/iot/devicetype/delete',
    method: 'post',
    data: ids
  })
}

// 导出设备类型
export function exportDeviceType(data) {
  return request({
    url: '/intra/iot/devicetype/toExport',
    method: 'post',
    data: data
  })
}

// ==================== 设备类型属性相关API ====================
// 查询设备类型属性列表
export function getDevicePropertyList(query) {
  return request({
    url: '/intra/iot/deviceproperty/browse',
    method: 'get',
    params: query
  })
}

// 查询设备类型属性详细
export function getDevicePropertyDetail(id) {
  return request({
    url: '/intra/iot/deviceproperty/detail/' + id,
    method: 'get'
  })
}

// 新增设备类型属性
export function addDeviceProperty(data) {
  return request({
    url: '/intra/iot/deviceproperty/add',
    method: 'post',
    data: data
  })
}

// 修改设备类型属性
export function updateDeviceProperty(data) {
  return request({
    url: '/intra/iot/deviceproperty/edit',
    method: 'post',
    data: data
  })
}

// 保存或更新设备类型属性（统一接口）
export function saveDeviceProperty(data) {
  return request({
    url: '/intra/iot/deviceproperty/submit',
    method: 'post',
    data: data
  })
}

// 删除设备类型属性
export function delDeviceProperty(ids) {
  return request({
    url: '/intra/iot/deviceproperty/delete',
    method: 'post',
    data: ids
  })
}

// 导出设备类型属性
export function exportDeviceProperty(data) {
  return request({
    url: '/intra/iot/deviceproperty/toExport',
    method: 'post',
    data: data
  })
}

// ==================== 设备类型属性数据相关API ====================
// 查询设备类型属性数据列表
export function getDevicePropertyDataList(query) {
  return request({
    url: '/intra/iot/devicepropertydata/browse',
    method: 'get',
    params: query
  })
}

// 查询设备类型属性数据详细
export function getDevicePropertyDataDetail(id) {
  return request({
    url: '/intra/iot/devicepropertydata/detail/' + id,
    method: 'get'
  })
}

// 新增设备类型属性数据
export function addDevicePropertyData(data) {
  return request({
    url: '/intra/iot/devicepropertydata/add',
    method: 'post',
    data: data
  })
}

// 修改设备类型属性数据
export function updateDevicePropertyData(data) {
  return request({
    url: '/intra/iot/devicepropertydata/edit',
    method: 'post',
    data: data
  })
}

// 保存或更新设备类型属性数据（统一接口）
export function saveDevicePropertyData(data) {
  return request({
    url: '/intra/iot/devicepropertydata/submit',
    method: 'post',
    data: data
  })
}

// 删除设备类型属性数据
export function delDevicePropertyData(ids) {
  return request({
    url: '/intra/iot/devicepropertydata/delete',
    method: 'post',
    data: ids
  })
}

// 导出设备类型属性数据
export function exportDevicePropertyData(data) {
  return request({
    url: '/intra/iot/devicepropertydata/toExport',
    method: 'post',
    data: data
  })
}
export const getEmptyByType = (data) => {
  return request({
    url: `/intra/iot/device/getEmptyByType`,
    method: "get",
    params: data,
  });
};