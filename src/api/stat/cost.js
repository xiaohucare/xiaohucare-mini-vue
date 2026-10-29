import request from "@/utils/request";

// 获取成本汇总数据
export function getStatisticsCost(params) {
    return request({
      url: "/intra/stat/home/getHourlyStatisticsCost",
      method: "get",
      params,
    });
  }
  // 电力峰谷时段成本分布
export function getHourElectricityCostTypePieStatistics(params) {
    return request({
      url: "/intra/stat/home/getHourElectricityCostTypePieStatistics",
      method: "get",
      params,
    });
  }
  // 电力峰谷时段成本分析
export function getHourElectricityCostTypeListStatistics(params) {
    return request({
      url: "/intra/stat/home/getHourElectricityCostTypeListStatistics",
      method: "get",
      params,
    });
  }
  // 能源成本堆叠趋势分析
export function getHourStatisticsTypeGroupListStatistics(params) {
    return request({
      url: "/intra/stat/home/getHourStatisticsTypeGroupListStatistics",
      method: "get",
      params,
    });
  }
  // 能源成本明细
export function getHourStatisticsTypePieStatistics(params) {
    return request({
      url: "/intra/stat/home/getHourStatisticsTypePieStatistics",
      method: "get",
      params,
    });
  }
