import request from "@/utils/request";

// 查询设备属性分组列表
export function getPropertyGroupList(query) {
    return request({
        url: "/intra/iot/devicepropertygroup/browse",
        method: "get",
        params: query,
    });
}

// 新增或编辑设备属性分组
export function savePropertyGroup(data) {
    return request({
        url: "/intra/iot/devicepropertygroup/submit",
        method: "post",
        data: data,
    });
}

// 删除设备属性分组
export function delPropertyGroup(ids) {
    return request({
        url: "/intra/iot/devicepropertygroup/delete",
        method: "post",
        data: ids,
    });
}