import request from '@/utils/request'

// 楼栋分页列表
export function listBuilding(params) {
  return request({
    url: '/intra/hotel/building/browse',
    method: 'get',
    params
  })
}

// 楼栋全量列表（下拉/房态树）
export function listAllBuildings() {
  return request({
    url: '/intra/hotel/building/list',
    method: 'get'
  })
}

// 楼栋详情
export function getBuilding(id) {
  return request({
    url: '/intra/hotel/building/detail/' + id,
    method: 'get'
  })
}

// 新增/修改楼栋
export function submitBuilding(data) {
  return request({
    url: '/intra/hotel/building/submit',
    method: 'post',
    data
  })
}

// 删除楼栋
export function deleteBuilding(id) {
  return request({
    url: '/intra/hotel/building/delete',
    method: 'post',
    data: Array.isArray(id) ? id : [id]
  })
}
