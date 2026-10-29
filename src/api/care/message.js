import request from '@/utils/request'

// ==================== 门店消息管理 ====================

// 获取消息列表
export function getMessageList(params) {
  return request({
    url: '/intra/care/storemessage/browse',
    method: 'get',
    params
  })
}

// 获取消息详情
export function getMessageDetail(id) {
  return request({
    url: '/intra/care/storemessage/detail/' + id,
    method: 'get'
  })
}

// 新增/修改消息
export function submitMessage(data) {
  return request({
    url: '/intra/care/storemessage/submit',
    method: 'post',
    data
  })
}

// 删除消息
export function deleteMessage(ids) {
  return request({
    url: '/intra/care/storemessage/delete',
    method: 'post',
    data: Array.isArray(ids) ? ids : [ids]
  })
}

// 更新消息状态：0=待处理 1=已处理 2=已关闭
export function updateMessageState(data) {
  return request({
    url: '/intra/care/storemessage/updateState',
    method: 'post',
    data
  })
}

// 导出消息数据
export function exportMessage(params) {
  return request({
    url: '/intra/care/storemessage/toExport',
    method: 'post',
    data: params,
    responseType: 'blob'
  })
}

// 获取消息统计
export function getMessageStat(params) {
  return request({
    url: '/intra/care/storemessage/listStat',
    method: 'get',
    params
  })
}

// 获取未读提示列表
export function getMessageTips() {
  return request({
    url: '/intra/care/storemessage/tips/browse',
    method: 'get'
  })
}

// 全部已读（按分类清零未读数，tipsType 为空则清零全部）
export function readMessageTips(data) {
  return request({
    url: '/intra/care/storemessage/tips/read',
    method: 'post',
    data
  })
}
