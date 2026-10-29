import request from "@/utils/request";

// 获取设备属性和最新数据
export function getDeviceRealtimeData(deviceId) {
    return request({
        url: "/intra/stat/realtime/device",
        method: "get",
        params: { deviceId },
    });
}

// 获取设备历史数据
export function getDeviceHistoryData(params) {
    return request({
        url: "/intra/stat/realtime/browsedevicePoint",
        method: "get",
        params: params,
    });
}