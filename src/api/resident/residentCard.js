import request from '@/utils/request'

// 会员卡API — 对接 ResidentCardController /intra/care/residentcard/*

// 获取会员卡列表（分页）
export function getResidentCardList(params) {
  return request({
    url: '/intra/care/residentcard/browse',
    method: 'get',
    params
  })
}
// 获取会员卡详情
export function getResidentCardDetail(id) {
  return request({
    url: '/intra/care/residentcard/detail/' + id,
    method: 'get'
  })
}

// 根据客户ID查询会员卡
export function getCustomerResidentCard(ownerId) {
  return request({
    url: '/intra/care/residentcard/byOwner/' + ownerId,
    method: 'get'
  })
}

// 获取会员卡统计
export function getResidentCardStatistics(params) {
  return request({
    url: '/intra/care/residentcard/listStat',
    method: 'get',
    params
  })
}

// 开卡
export function openResidentCard(data) {
  return request({
    url: '/intra/care/residentcard/open',
    method: 'post',
    data
  })
}

// 充值
export function rechargeResidentCard(data) {
  return request({
    url: '/intra/care/residentcard/recharge',
    method: 'post',
    data
  })
}

// 消费
export function consumeResidentCard(data) {
  return request({
    url: '/intra/care/residentcard/consume',
    method: 'post',
    data
  })
}

// 修改卡状态（挂失 2 / 解挂 1 / 注销 0）
export function toggleResidentCardStatus(id, status) {
  return request({
    url: '/intra/care/residentcard/toggleStatus',
    method: 'post',
    data: { id, status }
  })
}

// 新增/更新会员卡
export function addResidentCard(data) {
  return request({
    url: '/intra/care/residentcard/submit',
    method: 'post',
    data
  })
}

export function updateResidentCard(data) {
  return request({
    url: '/intra/care/residentcard/submit',
    method: 'post',
    data
  })
}

// 删除会员卡
export function deleteResidentCard(ids) {
  return request({
    url: '/intra/care/residentcard/delete',
    method: 'post',
    data: Array.isArray(ids) ? ids : [ids]
  })
}

// 获取会员卡消费/充值记录
export function getResidentCardConsumeRecords(params) {
  return request({
    url: '/intra/care/residentcardrecord/browse',
    method: 'get',
    params
  })
}

export function getResidentCardRechargeRecords(params) {
  return request({
    url: '/intra/care/residentcardrecord/browse',
    method: 'get',
    params: { ...params, tradeType: 'recharge' }
  })
}

// 获取消费统计
export function getConsumeStatistics(params) {
  return request({
    url: '/intra/care/residentcardrecord/consumeStat',
    method: 'get',
    params
  })
}
// 导出
export function exportResidentCard(params) {
  return request({
    url: '/intra/care/residentcard/toExport',
    method: 'post',
    params,
    responseType: 'blob'
  })
}
