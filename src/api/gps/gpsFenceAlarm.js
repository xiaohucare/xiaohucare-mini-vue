import request from '@/utils/request'

// 查询围栏报警列表
export function getFenceAlarmList(query) {
  return request({
    url: '/intra/gps/gpsfencealarmrecord/browse',
    method: 'get',
    params: query
  })
}

// 查询围栏报警详情
export function getFenceAlarmDetail(id) {
  return request({
    url: '/intra/gps/gpsfencealarmrecord/detail/' + id,
    method: 'get'
  })
}

// 处理围栏报警
export function handleFenceAlarm(data) {
  return request({
    url: '/intra/gps/gpsfencealarmrecord/handle',
    method: 'post',
    data: data
  })
}

// 获取围栏报警统计
export function getFenceAlarmStat(query) {
  return request({
    url: '/intra/gps/gpsfencealarmrecord/listStat',
    method: 'get',
    params: query
  })
}
