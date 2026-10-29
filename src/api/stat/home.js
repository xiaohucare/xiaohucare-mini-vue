import request from "@/utils/request";

// 获取能耗占比看板数据
export function getStatisticsGroupPie(params) {
  return request({
    url: "/intra/stat/home/statisticsGroupPie",
    method: "get",
    params,
  });
}

// 获取能耗统计汇总数据
export function getStatisticsSummary(params) {
  return request({
    url: "/intra/stat/home/statisticsSummary",
    method: "get",
    params,
  });
}
// top5数据
export function getTop5(params) {
  return request({
    url: "/intra/stat/home/statisticsRanking",
    method: "get",
    params,
  });
}
// 尖峰平谷占比
export function getsharpValley(params) {
  return request({
    url: "/intra/stat/home/getHourElectricityCostTypePieStatistics",
    method: "get",
    params,
  });
}

// 重点设备能耗统计
export function getStatisticsDevice(params) {
  return request({
    url: "/intra/stat/home/statisticsDevice",
    method: "get",
    params,
  });
}

// 碳排放数据
export function getHourlyStatisticsCarbon(params) {
  return request({
    url: "/intra/stat/home/getHourlyStatisticsCarbon",
    method: "get",
    params,
  });
}

// 能源流向分析
export function getflowAnalysis(params) {
  return request({
    url: "/intra/stat/home/flowAnalysis",
    method: "get",
    params,
  });
}

// 用能单元用能统计分析
export function getHourListStatistics(params) {
  return request({
    url: "/intra/stat/home/getHourListStatistics",
    method: "get",
    params,
  });
}

// 成本分析数据
export function getHourDeepStatCost(params) {
  return request({
    url: "/intra/stat/home/getHourDeepStatCost",
    method: "get",
    params,
  });
}


