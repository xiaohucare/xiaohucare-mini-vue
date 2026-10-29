import request from '@/utils/request'

// 房间分页列表
export function listRoom(params) {
  return request({
    url: '/intra/hotel/room/browse',
    method: 'get',
    params
  })
}

// 按楼层查询房间（房态视图）
export function listRoomByFloor(floorId) {
  return request({
    url: '/intra/hotel/room/listByFloor/' + floorId,
    method: 'get'
  })
}

// 房态统计（按楼栋/楼层聚合各状态房间数）
export function getRoomUsage(params) {
  return request({
    url: '/intra/hotel/room/roomUsage',
    method: 'get',
    params
  })
}

// 房间详情
export function getRoom(id) {
  return request({
    url: '/intra/hotel/room/detail/' + id,
    method: 'get'
  })
}

// 新增/修改房间
export function submitRoom(data) {
  return request({
    url: '/intra/hotel/room/submit',
    method: 'post',
    data
  })
}

// 删除房间
export function deleteRoom(id) {
  return request({
    url: '/intra/hotel/room/delete',
    method: 'post',
    data: Array.isArray(id) ? id : [id]
  })
}
