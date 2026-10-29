import request from '@/utils/request'

// 康养管理API

// 获取康养列表
export function getBoardingList(params) {
  return request({
    url: '/intra/hotel/boarding/list',
    method: 'get',
    params
  })
}

// 获取康养详情
export function getBoardingDetail(id) {
  return request({
    url: '/intra/hotel/boarding/detail/' + id,
    method: 'get'
  })
}

// 添加日常记录
export function addDailyRecord(boardingId, data) {
  return request({
    url: '/intra/hotel/boarding/record/' + boardingId,
    method: 'post',
    data
  })
}

// 获取日常记录列表
export function getDailyRecords(boardingId, params) {
  return request({
    url: '/intra/hotel/boarding/records/' + boardingId,
    method: 'get',
    params
  })
}

// 标记异常
export function markAbnormal(boardingId, data) {
  return request({
    url: '/intra/hotel/boarding/abnormal/' + boardingId,
    method: 'post',
    data
  })
}

// 解除异常
export function resolveAbnormal(boardingId) {
  return request({
    url: '/intra/hotel/boarding/resolve/' + boardingId,
    method: 'post'
  })
}

// 转至医疗隔离
export function transferToMedical(boardingId, data) {
  return request({
    url: '/intra/hotel/boarding/medical/' + boardingId,
    method: 'post',
    data
  })
}

// 发送消息给主人
export function sendMessageToOwner(boardingId, data) {
  return request({
    url: '/intra/hotel/boarding/message/' + boardingId,
    method: 'post',
    data
  })
}

// 更新健康监测数据
export function updateHealthData(checkinPetId, data) {
  return request({
    url: '/intra/hotel/boarding/health/' + checkinPetId,
    method: 'post',
    data
  })
}

// 更新物品交接状态
export function updateItemsCheck(checkinPetId, data) {
  return request({
    url: '/intra/hotel/boarding/items-check/' + checkinPetId,
    method: 'post',
    data
  })
}

// 上传照片/视频
export function uploadMedia(boardingId, data) {
  return request({
    url: '/intra/hotel/boarding/media/' + boardingId,
    method: 'post',
    data
  })
}

// 获取康养统计
export function getBoardingStatistics() {
  return request({
    url: '/intra/hotel/boarding/statistics',
    method: 'get'
  })
}
