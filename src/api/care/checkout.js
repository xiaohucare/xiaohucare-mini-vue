import request from '@/utils/request'

// 退住交接 API

// 获取待退住列表（使用 browseCheckOut 接口）
export function getCheckoutList(params) {
  return request({
    url: '/intra/hotel/checkin/browseCheckOut',
    method: 'get',
    params
  })
}

// 获取退住交接详情
export function getCheckoutDetail(id) {
  return request({
    url: '/intra/hotel/checkin/getPetCheckOut/' + id,
    method: 'get'
  })
}

// 保存退住交接草稿
export function submitDraftCheckout(data) {
  return request({
    url: '/intra/hotel/checkin/submitDraftCheckOut',
    method: 'post',
    data
  })
}

// 完成退住交接（放床、更新档案、生成待结算单）
export function completeCheckout(data) {
  return request({
    url: '/intra/hotel/checkin/submitCheckOut',
    method: 'post',
    data
  })
}

// 获取今天退住统计
export function getTodayCheckoutStat() {
  return request({
    url: '/intra/hotel/checkin/getTodayChechoutStat',
    method: 'get'
  })
}
