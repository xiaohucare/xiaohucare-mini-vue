import request from "@/utils/request";

// 查询电价时段配置列表
export function getElectricityItemList(query) {
    return request({
        url: "/intra/config/electricitytypesettingitem/browse",
        method: "get",
        params: query,
    });
}

// 查询电价时段配置详细
export function getElectricityItemDetail(id) {
    return request({
        url: "/intra/config/electricitytypesettingitem/detail/" + id,
        method: "get",
    });
}

// 新增电价时段配置
export function addElectricityItem(data) {
    return request({
        url: "/intra/config/electricitytypesettingitem/add",
        method: "post",
        data: data,
    });
}

// 修改电价时段配置
export function updateElectricityItem(data) {
    return request({
        url: "/intra/config/electricitytypesettingitem/edit",
        method: "post",
        data: data,
    });
}

// 保存或更新电价时段配置
export function saveElectricityItem(data) {
    return request({
        url: "/intra/config/electricitytypesettingitem/submit",
        method: "post",
        data: data,
    });
}

// 删除电价时段配置
export function delElectricityItem(ids) {
    return request({
        url: "/intra/config/electricitytypesettingitem/delete",
        method: "delete",
        data: ids,
    });
}

// 批量保存时段配置
export function batchSaveElectricityItems(data) {
    return request({
        url: "/intra/config/electricitytypesettingitem/batchSave",
        method: "post",
        data: data,
    });
}

// 根据配置ID查询时段列表
export function getElectricityItemsBySettingId(settingId) {
    return request({
        url: "/intra/config/electricitytypesettingitem/listBySettingId/" + settingId,
        method: "get",
    });
}
// 根据所有电价配置
export function getElectricityAllItems() {
    return request({
        url: "/dev-api/intra/config/electricitytypesettingitem/listAll",
        method: "get",
    });
}
// 批量新增电价配置
export function batchAddElectricitySetting(data) {
    return request({
        url: "/intra/config/electricitytypesettingitem/submitBatch",
        method: "post",
        data: data,
    });
}