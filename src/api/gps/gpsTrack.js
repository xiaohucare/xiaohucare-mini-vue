import request from '@/utils/request'

// 查询GPS轨迹列表
export function getGpsTrackList(query) {
  return request({
    url: '/intra/gps/gpstrack/browse',
    method: 'get',
    params: query
  })
}

// 查询GPS轨迹详情
export function getGpsTrackDetail(id) {
  return request({
    url: '/intra/gps/gpstrack/detail/' + id,
    method: 'get'
  })
}

// 获取指定宠物的轨迹
export function getPetTrackList(params) {
  return request({
    url: '/intra/gps/gpstrack/listByPet',
    method: 'get',
    params: params
  })
}

// 获取轨迹统计
export function getGpsTrackStat(query) {
  return request({
    url: '/intra/gps/gpstrack/listStat',
    method: 'get',
    params: query
  })
}
