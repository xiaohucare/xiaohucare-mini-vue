import request from "@/utils/request";

// 列表查询
export function listAlarmRules(query) {
    return request({
        url: "/intra/alarm/alarmrules/browse",
        method: "get",
        params: query,
    });
}

// 新增/编辑提交
export function submitAlarmRule(data) {
    return request({
        url: "/intra/alarm/alarmrules/submit",
        method: "post",
        data,
    });
}

// 删除
export function deleteAlarmRules(ids) {
    return request({
        url: "/intra/alarm/alarmrules/delete",
        method: "delete",
        data: ids,
    });
}