import request from '@/utils/request'

// 查询摄像头报警列表
export function getCameraAlarmList(query) {
  return request({
    url: '/intra/iot/cameraalarm/browse',
    method: 'get',
    params: query
  })
}

// 查询摄像头报警详情
export function getCameraAlarmDetail(id) {
  return request({
    url: '/intra/iot/cameraalarm/detail/' + id,
    method: 'get'
  })
}

// 处理摄像头报警
export function handleCameraAlarm(data) {
  return request({
    url: '/intra/iot/cameraalarm/handle',
    method: 'post',
    data: data
  })
}

// 获取摄像头报警统计
export function getCameraAlarmStat(query) {
  return request({
    url: '/intra/iot/cameraalarm/listStat',
    method: 'get',
    params: query
  })
}
