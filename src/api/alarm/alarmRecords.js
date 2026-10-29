import request from "@/utils/request";

// 查询报警记录列表
export function getAlarmRecordsList(query) {
    return request({
        url: "/intra/alarm/alarmrecords/browse",
        method: "get",
        params: query,
    });
}

// 查询报警记录详细
export function getAlarmRecord(id) {
    return request({
        url: "/intra/alarm/alarmrecords/detail/" + id,
        method: "get",
    });
}

// 保存或更新报警记录
export function saveAlarmRecord(data) {
    return request({
        url: "/intra/alarm/alarmrecords/submit",
        method: "post",
        data: data,
    });
}

// 导出报警记录
export function exportAlarmRecords(query) {
    return request({
        url: "/intra/alarm/alarmrecords/toExport",
        method: "post",
        data: query,
        responseType: "blob",
    });
}

// 报警处置确认
export function submitAlarmConfirm(data) {
    return request({
        url: "/intra/alarm/alarmrecords/submitConfirm",
        method: "post",
        data: data,
    });
}