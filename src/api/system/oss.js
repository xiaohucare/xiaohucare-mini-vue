import request from '@/utils/request'

// 查询OSS文件列表
export function listOss(query) {
  return request({
    url: '/system/sysoss/list',
    method: 'get',
    params: query
  })
}

// 查询OSS文件详细
export function getOss(id) {
  return request({
    url: '/system/sysoss/detail/' + id,
    method: 'get'
  })
}

// 新增OSS文件记录
export function addOss(data) {
  return request({
    url: '/system/sysoss/submit',
    method: 'post',
    data: data
  })
}

// 修改OSS文件记录
export function updateOss(data) {
  return request({
    url: '/system/sysoss/submit',
    method: 'post',
    data: data
  })
}

// 删除OSS文件记录
export function delOss(ids) {
  return request({
    url: '/system/sysoss/delete',
    method: 'post',
    data: ids
  })
}

// 导出OSS文件列表
export function exportOss(query) {
  return request({
    url: '/system/sysoss/toExport',
    method: 'post',
    params: query,
    responseType: 'blob'
  })
}
