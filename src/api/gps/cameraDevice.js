import request from '@/utils/request'

// 查询摄像头设备列表
export function getCameraDeviceList(query) {
  return request({
    url: '/intra/iot/cameradevice/browse',
    method: 'get',
    params: query
  })
}

// 查询摄像头设备详情
export function getCameraDeviceDetail(id) {
  return request({
    url: '/intra/iot/cameradevice/detail/' + id,
    method: 'get'
  })
}

// 新增/修改摄像头设备
export function submitCameraDevice(data) {
  return request({
    url: '/intra/iot/cameradevice/submit',
    method: 'post',
    data: data
  })
}

// 删除摄像头设备
export function deleteCameraDevice(ids) {
  return request({
    url: '/intra/iot/cameradevice/delete',
    method: 'post',
    data: ids
  })
}

// 获取摄像头统计
export function getCameraDeviceStat(query) {
  return request({
    url: '/intra/iot/cameradevice/listStat',
    method: 'get',
    params: query
  })
}
