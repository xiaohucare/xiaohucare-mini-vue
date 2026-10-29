import request from '@/utils/request'

// 查询GPS设备列表
export function getGpsDeviceList(query) {
  return request({
    url: '/intra/gps/gpsdevice/browse',
    method: 'get',
    params: query
  })
}

// 查询GPS设备详情
export function getGpsDeviceDetail(id) {
  return request({
    url: '/intra/gps/gpsdevice/detail/' + id,
    method: 'get'
  })
}

// 新增/修改GPS设备
export function submitGpsDevice(data) {
  return request({
    url: '/intra/gps/gpsdevice/submit',
    method: 'post',
    data: data
  })
}

// 删除GPS设备
export function deleteGpsDevice(ids) {
  return request({
    url: '/intra/gps/gpsdevice/delete',
    method: 'post',
    data: ids
  })
}

// 获取GPS设备统计
export function getGpsDeviceStat(query) {
  return request({
    url: '/intra/gps/gpsdevice/listStat',
    method: 'get',
    params: query
  })
}
