import request from "@/utils/request";

export const getDeviceList = (data) => {
    return request({
        url: "/intra/iot/device/browse",
        method: "get",
        params: data,
    });
};
export const delDevice = (data) => {
    return request({
        url: "/intra/iot/device/delete",
        method: "delete",
        data,
    });
};
export const getDeviceDetailById = (id) => {
    return request({
        url: `/intra/iot/device/detail/${id}`,
        method: "get",
    });
};
export const saveDevice = (data) => {
    return request({
        url: `/intra/iot/device/submit`,
        method: "post",
        data,
    });
};
