import request from '@/utils/request'

// 楼层分页列表
export function listFloor(params) {
  return request({
    url: '/intra/hotel/floorplan/browse',
    method: 'get',
    params
  })
}

// 按楼栋查询楼层（房态树/下拉）
export function listFloorByBuilding(buildingId) {
  return request({
    url: '/intra/hotel/floorplan/listByBuilding/' + buildingId,
    method: 'get'
  })
}

// 楼层详情
export function getFloor(id) {
  return request({
    url: '/intra/hotel/floorplan/detail/' + id,
    method: 'get'
  })
}

// 新增/修改楼层
export function submitFloor(data) {
  return request({
    url: '/intra/hotel/floorplan/submit',
    method: 'post',
    data
  })
}

// 删除楼层
export function deleteFloor(id) {
  return request({
    url: '/intra/hotel/floorplan/delete',
    method: 'post',
    data: Array.isArray(id) ? id : [id]
  })
}
