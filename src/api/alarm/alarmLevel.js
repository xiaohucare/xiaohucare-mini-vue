import request from "@/utils/request";

// 查询报警等级列表
export function getAlarmLevelList(query) {
    return request({
        url: "/intra/alarm/alarmrulelevel/browse",
        method: "get",
        params: query,
    });
}

// 查询报警等级详细
export function getAlarmLevel(id) {
    return request({
        url: "/intra/alarm/alarmrulelevel/detail/" + id,
        method: "get",
    });
}

// 保存或更新报警等级
export function saveAlarmLevel(data) {
    return request({
        url: "/intra/alarm/alarmrulelevel/submit",
        method: "post",
        data: data,
    });
}

// 删除报警等级
export function delAlarmLevel(ids) {
    return request({
        url: "/intra/alarm/alarmrulelevel/delete",
        method: "delete",
        data: ids,
    });
}

// 导出报警等级
export function exportAlarmLevel(query) {
    return request({
        url: "/intra/alarm/alarmrulelevel/toExport",
        method: "post",
        data: query,
        responseType: "blob",
    });
}