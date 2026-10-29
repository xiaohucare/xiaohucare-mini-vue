import request from "@/utils/request";
//获取视频列表
export function getVideo(data) {
    return request({
        url: '/intra/monitor/monitorvideo/list',
        method: 'get',
        params: data
    })
}
//获取视频列表
export function getVideoList(data) {
    return request({
        url: '/api/demo/showDeviceList',
        method: 'get',
        params: data
    })
}