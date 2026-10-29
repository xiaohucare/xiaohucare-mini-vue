import request from "@/utils/request";

// 查询电价配置列表
export function getElectricitySettingList(query) {
    return request({
        url: "/intra/config/electricitytypesetting/browse",
        method: "get",
        params: query,
    });
}

// 查询电价配置详细
export function getElectricitySettingDetail(id) {
    return request({
        url: "/intra/config/electricitytypesetting/detail/" + id,
        method: "get",
    });
}

// 新增电价配置
export function addElectricitySetting(data) {
    return request({
        url: "/intra/config/electricitytypesetting/add",
        method: "post",
        data: data,
    });
}

// 修改电价配置
export function updateElectricitySetting(data) {
    return request({
        url: "/intra/config/electricitytypesetting/edit",
        method: "post",
        data: data,
    });
}

// 保存或更新电价配置
export function saveElectricitySetting(data) {
    return request({
        url: "/intra/config/electricitytypesetting/submit",
        method: "post",
        data: data,
    });
}

// 删除电价配置
export function delElectricitySetting(ids) {
    return request({
        url: "/intra/config/electricitytypesetting/delete",
        method: "delete",
        data: ids,
    });
}

// 设置生效配置
export function setActiveElectricitySetting(id) {
    // 按需通过编辑接口将 isbase 置为 1
    return request({
        url: "/intra/config/electricitytypesetting/edit",
        method: "post",
        data: {
            id: id,
            // 后端字段兼容：同时传递 isBase 与 isbase
            isBase: 1,
        },
    });
}

// 导出电价配置
export function exportElectricitySetting(query) {
    return request({
        url: "/intra/config/electricitytypesetting/toExport",
        method: "post",
        data: query,
        responseType: "blob",
    });
}