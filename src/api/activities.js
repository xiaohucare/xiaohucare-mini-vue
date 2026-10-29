import request from '@/utils/request'

// 活动类型管理API
export const listActivityTypes = (params) => request({
  url: '/intra/activity/activitytype/browse',
  method: 'get',
  params
})

export const createActivityType = (data) => request({
  url: '/intra/activity/activitytype/submit',
  method: 'post',
  data
})

export const updateActivityType = (data) => request({
   url: '/intra/activity/activitytype/submit',
   method: 'post',
   data
})

export const deleteActivityType = (id) => request({
  url: `/intra/activity/activitytype/delete`,
  method: 'delete',
  data: [id]
})

// 日常活动管理API
export const getDailyActivities = (params) => request({
  url: '/intra/activity/activitydaily/browse',
  method: 'get',
  params
})

export const createDailyActivity = (data) => request({
  url: '/intra/activity/activitydaily/submit',
  method: 'post',
  data
})

export const updateDailyActivity = (data) => request({
  url: '/intra/activity/activitydaily/submit',
  method: 'post',
  data
})

export const deleteDailyActivity = (id) => request({
 url: `/intra/activity/activitydaily/delete`,
  method: 'delete',
  data: [id]
})

// 活动参与记录API
export const getActivityParticipants = (params) => request({
  url: '/intra/activity/activityparticipant/browse',
  method: 'get',
  params
})

export const createActivityParticipant = (data) => request({
  url: '/intra/activity/activityparticipant/submit',
  method: 'post',
  data
})

export const updateActivityParticipant = (data) => request({
 url: '/intra/activity/activityparticipant/submit',
  method: 'post',
  data
})

export const deleteActivityParticipant = (id) => request({
  url: `/intra/activity/activityparticipant/delete`,
  method: 'delete',
  data: [id]
})

// 批量更新参与状态
export const batchUpdateParticipants = (data) => request({
  url: '/activity-participants/batch',
  method: 'put',
  data
})

// 活动统计API
export const getActivityStatistics = (params) => request({
  url: '/activities/statistics',
  method: 'get',
  params
})