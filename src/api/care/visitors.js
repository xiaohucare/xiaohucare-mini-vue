import request from '@/utils/request'
// 来访记录管理
export function getVisitRecordsList(params) {


   return request({
          url: "/intra/ginkgo/visitrecord/browse",
          method: "get",
          params: params,
      });
}
export function getVisitRecordDetail(id) {
  return request({
              url: "/intra/ginkgo/visitrecord/detail/" + id,
              method: "get",
          });
}
export function addVisitRecord(data) {
  return request({
    url: '/intra/ginkgo/visitrecord/submit',
    method: 'post',
    data
  })
}

export function updateVisitRecord(data) {
  return request({
    url: '/intra/ginkgo/visitrecord/submit',
    method: 'post',
    data
  })
}
export function deleteVisitRecord(ids) {
  return request({
              url: "/intra/ginkgo/visitrecord/delete",
              method: "delete",
              data: Array.isArray(ids) ? ids : [ids],
          });
}
// 总统计：今日来访/今日外出/总来访/总外出
export function getVisitRecordTotalStat() {
  return request({
    url: '/intra/ginkgo/visitrecord/totalStat',
    method: 'get'
  })
}

// 近期趋势（最近30天，按天统计来访/外出数量）
export function getVisitRecordTrendStat() {
  return request({
    url: '/intra/ginkgo/visitrecord/trendStat',
    method: 'get'
  })
}

// 统计（组装：顶部卡片 + 趋势折线图）
// 后端 R 成功码为 0（Response.OK），兼容 200
export async function getVisitorStatistics(params = {}) {
  const days = params.days || 7
  const [totalRes, trendRes] = await Promise.all([
    getVisitRecordTotalStat(),
    getVisitRecordTrendStat()
  ])
  const isOk = (r) => r && (r.code === 0 || r.code === 200)
  const total = isOk(totalRes) && totalRes.data ? totalRes.data : {}
  const trendArr = isOk(trendRes) && Array.isArray(trendRes.data) ? trendRes.data : []
  return {
    code: 0,
    msg: 'success',
    data: {
      // 今日来访 / 今日外出 / 总来访 / 总外出（直接透传 totalStat 字段）
      todayVisitCount: total.todayVisitCount || 0,
      todayOutCount: total.todayOutCount || 0,
      totalVisitCount: total.totalVisitCount || 0,
      totalOutCount: total.totalOutCount || 0,
      // 最近 days 天趋势：[{ date, visitCount, outCount }]
      trend: trendArr.slice(-days)
    }
  }
}