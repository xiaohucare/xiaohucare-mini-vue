import request from '@/utils/request'

// 床位分页列表
export function listBed(params) {
  return request({
    url: '/intra/hotel/bed/browse',
    method: 'get',
    params
  })
}

// 按房间查询床位（房态视图床位格）
export function listBedByRoom(roomId) {
  return request({
    url: '/intra/hotel/bed/listByRoom/' + roomId,
    method: 'get'
  })
}

// 查询空闲床位（可按楼栋/楼层/房间/床位类型过滤）
export function listFreeBeds(params) {
  return request({
    url: '/intra/hotel/bed/freeBeds',
    method: 'get',
    params
  })
}

// 换床
export function changeBed(data) {
  return request({
    url: '/intra/hotel/bed/changeBed',
    method: 'post',
    params: data
  })
}

// 床位详情
export function getBed(id) {
  return request({
    url: '/intra/hotel/bed/detail/' + id,
    method: 'get'
  })
}

// 新增/修改床位
export function submitBed(data) {
  return request({
    url: '/intra/hotel/bed/submit',
    method: 'post',
    data
  })
}

// 删除床位
export function deleteBed(id) {
  return request({
    url: '/intra/hotel/bed/delete',
    method: 'post',
    data: Array.isArray(id) ? id : [id]
  })
}
