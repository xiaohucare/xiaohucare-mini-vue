import request from '@/utils/request'

// ==================== 门店文章报道管理 ====================

// 获取文章列表
export function getArticleList(params) {
  return request({
    url: '/web/article/browse',
    method: 'get',
    params
  })
}

// 获取文章详情
export function getArticleDetail(id) {
  return request({
    url: '/web/article/detail/' + id,
    method: 'get'
  })
}