import request from '@/utils/request'

// ==================== 门店文章报道管理 ====================

// 获取文章列表
export function getArticleList(params) {
  return request({
    url: '/intra/care/storearticle/browse',
    method: 'get',
    params
  })
}

// 获取文章详情
export function getArticleDetail(id) {
  return request({
    url: '/intra/care/storearticle/detail/' + id,
    method: 'get'
  })
}

// 新增/修改文章
export function submitArticle(data) {
  return request({
    url: '/intra/care/storearticle/submit',
    method: 'post',
    data
  })
}

// 删除文章
export function deleteArticle(ids) {
  return request({
    url: '/intra/care/storearticle/delete',
    method: 'post',
    data: Array.isArray(ids) ? ids : [ids]
  })
}

// 发布/下架文章
export function updateArticleStatus(data) {
  return request({
    url: '/intra/care/storearticle/updateStatus',
    method: 'post',
    data
  })
}

// 导出文章数据
export function exportArticle(params) {
  return request({
    url: '/intra/care/storearticle/toExport',
    method: 'post',
    data: params,
    responseType: 'blob'
  })
}

// 获取文章统计
export function getArticleStat(params) {
  return request({
    url: '/intra/care/storearticle/listStat',
    method: 'get',
    params
  })
}

// 获取文章分类列表
export function getArticleCategories() {
  return request({
    url: '/intra/care/storearticle/categories',
    method: 'get'
  })
}
