import request from '@/utils/request'

// 获取康养概况统计数据
export function getBoardingStats() {
  return request({
    url: '/intra/care/home/boardingStats',
    method: 'get'
  })
}

// 获取今日预约列表
export function getTodayAppointments() {
  return request({
    url: '/intra/care/home/todayAppointments',
    method: 'get'
  })
}

// 获取当前在住长者列表
export function getCurrentResidents() {
  return request({
    url: '/intra/care/home/currentResidents',
    method: 'get'
  })
}

// 获取空间使用情况
export function getSpaceUsage() {
  return request({
    url: '/intra/care/home/spaceUsage',
    method: 'get'
  })
}

// 首页在住长者精简列表
export function getBoardingResidents() {
  return request({
    url: '/intra/care/home/boardingResidents',
    method: 'get'
  })
}

// 某日值班人员列表（不传默认今天）
export function getTodayDuty(date) {
  const d = date || new Date()
  const pad = n => String(n).padStart(2, '0')
  const dateStr = typeof d === 'string' ? d : `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
  return request({
    url: '/intra/care/home/dutyList',
    method: 'get',
    params: { date: dateStr }
  })
}

// 最新生效通知公告（后端最多返回 5 条）
export function getNotices() {
  return request({
    url: '/intra/care/home/listNotice',
    method: 'get'
  })
}

// 通知公告分页列表（StoreNoticeController /intra/care/notice/list，返回 TableDataInfo：rows/total）
export function getStoreNoticeList(query) {
  return request({
    url: '/intra/care/notice/list',
    method: 'get',
    params: query
  })
}

// 首页合同统计（各状态份数 + 本月新签 + 近期到期/已逾期）
export function getContractStats() {
  return request({
    url: '/intra/care/home/contractStats',
    method: 'get'
  })
}
