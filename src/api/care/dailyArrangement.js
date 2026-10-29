import request from '@/utils/request'

// ==================== 日常安排管理 ====================

// 获取日常安排列表
export function getDailyArrangementList(params) {
  return request({
    url: '/intra/care/dailyarrangement/browse',
    method: 'get',
    params
  })
}

// 获取日常安排详情
export function getDailyArrangementDetail(id) {
  return request({
    url: '/intra/care/dailyarrangement/detail/' + id,
    method: 'get'
  })
}

// 新增日常安排
export function addDailyArrangement(data) {
  return request({
    url: '/intra/care/dailyarrangement/submit',
    method: 'post',
    data
  })
}

// 修改日常安排
export function updateDailyArrangement(data) {
  return request({
    url: '/intra/care/dailyarrangement/submit',
    method: 'post',
    data
  })
}

// 删除日常安排
export function deleteDailyArrangement(id) {
  return request({
    url: '/intra/care/dailyarrangement/delete',
    method: 'post',
    data: Array.isArray(id) ? id : [id]
  })
}

// 获取一周日程安排（优先获取特定日程，不存在则获取通用日程）
export function getWeekSchedule() {
  return request({
    url: '/intra/care/dailyarrangement/getWeekSchedule',
    method: 'get'
  })
}

// 获取指定日期的日程安排
export function getDaySchedule(arrangementDate) {
  return request({
    url: '/intra/care/dailyarrangement/getDaySchedule',
    method: 'get',
    params: { arrangementDate }
  })
}

// 获取指定周几的通用日程（kind=0）
export function getGeneralScheduleByWeek(week) {
  return request({
    url: '/intra/care/dailyarrangement/getGeneralSchedule',
    method: 'get',
    params: { week }
  })
}

export function getDayScheduleByDate(arrangementDate) {
  return request({
    url: '/intra/care/dailyarrangement/getDayScheduleByDate',
    method: 'get',
    params: { arrangementDate }
  })
}