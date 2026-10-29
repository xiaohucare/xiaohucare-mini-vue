import request from "@/utils/request";

// 查询能源单价列表
export function getCostUnitList(query) {
    return request({
        url: "/intra/config/costunit/browse",
        method: "get",
        params: query,
    });
}

// 查询能源单价详细
export function getCostUnit(id) {
    return request({
        url: "/intra/config/costunit/detail/" + id,
        method: "get",
    });
}

// 新增能源单价
export function addCostUnit(data) {
    return request({
        url: "/intra/config/costunit/add",
        method: "post",
        data: data,
    });
}

// 修改能源单价
export function updateCostUnit(data) {
    return request({
        url: "/intra/config/costunit/edit",
        method: "post",
        data: data,
    });
}

// 保存或更新能源单价
export function saveCostUnit(data) {
    return request({
        url: "/intra/config/costunit/submit",
        method: "post",
        data: data,
    });
}

// 删除能源单价
export function delCostUnit(ids) {
    return request({
        url: "/intra/config/costunit/delete",
        method: "delete",
        data: ids,
    });
}

// 导出能源单价
export function exportCostUnit(query) {
    return request({
        url: "/intra/config/costunit/toExport",
        method: "post",
        data: query,
        responseType: "blob",
    });
}