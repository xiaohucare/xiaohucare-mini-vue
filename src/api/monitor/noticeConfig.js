import request from '@/utils/request'

// 监控通知配置（后端 /intra/monitor/monitornoticeconfig/**）
// 原为 src/api/alerm.js（文件名拼写有误），已并入 monitor 目录并规范函数命名；当前暂无页面引用
export function getNoticeConfigList(params) {
  return request({
    url: '/intra/monitor/monitornoticeconfig/list',
    method: 'get',
    params
  })
}

export function getNoticeConfigDetail(id) {
  return request({
    url: '/intra/monitor/monitornoticeconfig/detail/' + id,
    method: 'get'
  })
}

export function submitNoticeConfig(data) {
  return request({
    url: '/intra/monitor/monitornoticeconfig/submit',
    method: 'post',
    data
  })
}

export function deleteNoticeConfig(data) {
  return request({
    url: '/intra/monitor/monitornoticeconfig/delete',
    method: 'delete',
    data
  })
}
