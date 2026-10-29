import request from '@/utils/request'

// 查询电子围栏列表
export function getFenceList(query) {
  return request({
    url: '/intra/gps/gpselectronicfence/browse',
    method: 'get',
    params: query
  })
}

// 查询电子围栏详情
export function getFenceDetail(id) {
  return request({
    url: '/intra/gps/gpselectronicfence/detail/' + id,
    method: 'get'
  })
}

// 新增/修改电子围栏
export function submitFence(data) {
  return request({
    url: '/intra/gps/gpselectronicfence/submit',
    method: 'post',
    data: data
  })
}

// 删除电子围栏
export function deleteFence(ids) {
  return request({
    url: '/intra/gps/gpselectronicfence/delete',
    method: 'post',
    data: ids
  })
}

// 获取围栏统计
export function getFenceStat(query) {
  return request({
    url: '/intra/gps/gpselectronicfence/listStat',
    method: 'get',
    params: query
  })
}
