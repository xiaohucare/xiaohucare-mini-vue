import request from '@/utils/request'

// 设施设备管理API
export const getFacilities = (params) => request({
  url: '/facilities',
  method: 'get',
  params
})

export const createFacility = (data) => request({
  url: '/facilities',
  method: 'post',
  data
})

export const updateFacility = (id, data) => request({
  url: `/facilities/${id}`,
  method: 'put',
  data
})

export const deleteFacility = (id) => request({
  url: `/facilities/${id}`,
  method: 'delete'
})

// 设施维护记录API
export const getFacilityMaintenanceRecords = (params) => request({
  url: '/facility-maintenance-records',
  method: 'get',
  params
})

export const createFacilityMaintenanceRecord = (data) => request({
  url: '/facility-maintenance-records',
  method: 'post',
  data
})

export const updateFacilityMaintenanceRecord = (id, data) => request({
  url: `/facility-maintenance-records/${id}`,
  method: 'put',
  data
})

export const deleteFacilityMaintenanceRecord = (id) => request({
  url: `/facility-maintenance-records/${id}`,
  method: 'delete'
})

// 智能设备类型API
export const getSmartDeviceTypes = (params) => request({
  url: '/smart-device-types',
  method: 'get',
  params
})

export const createSmartDeviceType = (data) => request({
  url: '/smart-device-types',
  method: 'post',
  data
})

export const updateSmartDeviceType = (id, data) => request({
  url: `/smart-device-types/${id}`,
  method: 'put',
  data
})

export const deleteSmartDeviceType = (id) => request({
  url: `/smart-device-types/${id}`,
  method: 'delete'
})

// 智能设备API
export const getSmartDevices = (params) => request({
  url: '/smart-devices',
  method: 'get',
  params
})

export const createSmartDevice = (data) => request({
  url: '/smart-devices',
  method: 'post',
  data
})

export const updateSmartDevice = (id, data) => request({
  url: `/smart-devices/${id}`,
  method: 'put',
  data
})

export const deleteSmartDevice = (id) => request({
  url: `/smart-devices/${id}`,
  method: 'delete'
})

// 监控视频记录API
export const getSurveillanceVideos = (params) => request({
  url: '/surveillance-videos',
  method: 'get',
  params
})

export const deleteSurveillanceVideo = (id) => request({
  url: `/surveillance-videos/${id}`,
  method: 'delete'
})

// 呼叫记录API
export const getCallRecords = (params) => request({
  url: '/call-records',
  method: 'get',
  params
})

export const updateCallRecord = (id, data) => request({
  url: `/call-records/${id}`,
  method: 'put',
  data
})

// 设备报警记录API
export const getDeviceAlerts = (params) => request({
  url: '/device-alerts',
  method: 'get',
  params
})

export const updateDeviceAlert = (id, data) => request({
  url: `/device-alerts/${id}`,
  method: 'put',
  data
})

// 设备数据记录API
export const getDeviceDataRecords = (params) => request({
  url: '/device-data-records',
  method: 'get',
  params
})

export const deleteDeviceDataRecord = (id) => request({
  url: `/device-data-records/${id}`,
  method: 'delete'
})

// 设备统计API
export const getDeviceStatistics = (params) => request({
  url: '/devices/statistics',
  method: 'get',
  params
})

// 批量操作API
export const batchUpdateDeviceStatus = (data) => request({
  url: '/devices/batch-status',
  method: 'put',
  data
})

export const batchHandleAlerts = (data) => request({
  url: '/device-alerts/batch-handle',
  method: 'put',
  data
})