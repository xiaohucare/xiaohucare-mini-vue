import request from '@/utils/request'

// 获取设备状态列表
export function getDeviceStateList(query) {
  return request({
    url: '/intra/iot/device/browseState',
    method: 'get',
    params: query
  })
}

// 获取设备状态统计数据
export function getDevicePieState() {
  return request({
    url: '/intra/iot/device/getPieState',
    method: 'get'
  })
}
