import request from "@/utils/request";

// 报警等级占比统计信息
export function getAlarmLevelStatistics(query) {
    return request({
        url: "/intra/alarm/alarmrecords/alarmLevelStatistics",
        method: "get",
        params: query,
    });
}
// 报警处理状态占比统计信息
export function getAlarmStatusStatistics(query) {
    return request({
        url: "/intra/alarm/alarmrecords/alarmStatusStatistics",
        method: "get",
        params: query,
    });
}
// 统计汇总数据:天，月，年
export function getAlarmStatistics(query) {
    return request({
        url: "/intra/alarm/alarmrecords/statistics",
        method: "get",
        params: query,
    });
}
// 报警列表类型统计
export function getAlarmStatisticsByTime(query) {
    return request({
        url: "/intra/alarm/alarmrecords/statisticsByTime",
        method: "get",
        params: query,
    });
}