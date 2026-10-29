import request from '@/utils/request'

// ==================== 老人台账 ====================
export function listElder(params) {
  return request({ url: '/intra/care/ledger/elder/browse', method: 'get', params })
}
export function getElder(id) {
  return request({ url: '/intra/care/ledger/elder/detail/' + id, method: 'get' })
}
export function submitElder(data) {
  return request({ url: '/intra/care/ledger/elder/submit', method: 'post', data })
}
export function deleteElder(ids) {
  return request({ url: '/intra/care/ledger/elder/delete', method: 'post', data: Array.isArray(ids) ? ids : [ids] })
}

// ==================== 探访工单 ====================
export function listVisitOrder(params) {
  return request({ url: '/intra/care/ledger/visit/browse', method: 'get', params })
}
export function getVisitOrder(id) {
  return request({ url: '/intra/care/ledger/visit/detail/' + id, method: 'get' })
}
export function submitVisitOrder(data) {
  return request({ url: '/intra/care/ledger/visit/submit', method: 'post', data })
}
export function deleteVisitOrder(ids) {
  return request({ url: '/intra/care/ledger/visit/delete', method: 'post', data: Array.isArray(ids) ? ids : [ids] })
}
export function dispatchVisitOrder(orderId, employeeId, employeeName) {
  return request({ url: '/intra/care/ledger/visit/dispatch', method: 'post', params: { orderId, employeeId, employeeName } })
}
export function transferVisitOrder(orderId, employeeId, employeeName) {
  return request({ url: '/intra/care/ledger/visit/transfer', method: 'post', params: { orderId, employeeId, employeeName } })
}
export function revokeVisitOrder(orderId) {
  return request({ url: '/intra/care/ledger/visit/revoke', method: 'post', params: { orderId } })
}
export function signVisitOrder(orderId, signLocation) {
  return request({ url: '/intra/care/ledger/visit/sign', method: 'post', params: { orderId, signLocation } })
}
export function finishVisitOrder(orderId) {
  return request({ url: '/intra/care/ledger/visit/finish', method: 'post', params: { orderId } })
}
export function delayVisitOrder(orderId, delayReason) {
  return request({ url: '/intra/care/ledger/visit/delay', method: 'post', params: { orderId, delayReason } })
}
export function cancelVisitOrder(orderId, cancelReason) {
  return request({ url: '/intra/care/ledger/visit/cancel', method: 'post', params: { orderId, cancelReason } })
}
export function autoGenerateVisit() {
  return request({ url: '/intra/care/ledger/visit/autoGenerate', method: 'post' })
}
// 探访记录
export function getVisitRecord(orderId) {
  return request({ url: '/intra/care/ledger/visit/record/' + orderId, method: 'get' })
}
export function submitVisitRecord(data, finish) {
  return request({ url: '/intra/care/ledger/visit/record/submit', method: 'post', params: { finish }, data })
}
// 流转日志
export function listVisitLogs(orderId) {
  return request({ url: '/intra/care/ledger/visit/logs/' + orderId, method: 'get' })
}

// ==================== 巡访计划 ====================
export function listPlan(params) {
  return request({ url: '/intra/care/ledger/plan/browse', method: 'get', params })
}
export function getPlan(id) {
  return request({ url: '/intra/care/ledger/plan/detail/' + id, method: 'get' })
}
export function submitPlan(data) {
  return request({ url: '/intra/care/ledger/plan/submit', method: 'post', data })
}
export function deletePlan(ids) {
  return request({ url: '/intra/care/ledger/plan/delete', method: 'post', data: Array.isArray(ids) ? ids : [ids] })
}
export function generatePlan(id) {
  return request({ url: '/intra/care/ledger/plan/generate/' + id, method: 'post' })
}
export function planOptions() {
  return request({ url: '/intra/care/ledger/plan/options', method: 'get' })
}

// ==================== 字典（单店版统一走系统字典 sys_dict_type / sys_dict_data，对接 /system/dict/*）====================
// 说明：已移除机构级 e_store_dict_* 字典拷贝，下拉数据源统一为系统字典。
// getDictData 返回 res.data 为 SysDictData 数组（含 dictLabel / dictValue），与旧接口结构一致，调用页无需改动。
export function getDictData(dictType) {
  return request({ url: '/system/dict/data/type/' + dictType, method: 'get' })
}
// 字典类型列表（分页，返回 res.rows / res.total）
export function listDictTypes(query) {
  return request({ url: '/system/dict/type/list', method: 'get', params: query })
}
// 某类型下的字典数据列表（query: { dictType, ... }，返回 res.rows / res.total）
export function listDictData(query) {
  return request({ url: '/system/dict/data/list', method: 'get', params: query })
}
// 保存字典数据：含 dictCode 走修改(PUT)，否则新增(POST)
export function submitDictData(data) {
  return data && data.dictCode
    ? request({ url: '/system/dict/data', method: 'put', data })
    : request({ url: '/system/dict/data', method: 'post', data })
}
// 删除字典数据（支持单个或数组 dictCode，多个以逗号拼接为路径参数）
export function deleteDictData(dictCodes) {
  const codes = Array.isArray(dictCodes) ? dictCodes.join(',') : dictCodes
  return request({ url: '/system/dict/data/' + codes, method: 'delete' })
}
// 刷新字典缓存
export function refreshDictCache() {
  return request({ url: '/system/dict/type/refreshCache', method: 'delete' })
}

// ==================== 台账汇总报表 ====================
// 概况 + 多维分布 + 近 N 天生成趋势
export function reportOverview(trendDays = 14) {
  return request({ url: '/intra/care/ledger/report/overview', method: 'get', params: { trendDays } })
}

// ==================== 巡访工单 ====================
export function listPatrolOrder(params) {
  return request({ url: '/intra/care/ledger/patrol/browse', method: 'get', params })
}
export function getPatrolOrder(id) {
  return request({ url: '/intra/care/ledger/patrol/detail/' + id, method: 'get' })
}
export function submitPatrolOrder(data) {
  return request({ url: '/intra/care/ledger/patrol/submit', method: 'post', data })
}
export function deletePatrolOrder(ids) {
  return request({ url: '/intra/care/ledger/patrol/delete', method: 'post', data: Array.isArray(ids) ? ids : [ids] })
}
export function dispatchPatrol(orderId, employeeId, employeeName) {
  return request({ url: '/intra/care/ledger/patrol/dispatch', method: 'post', params: { orderId, employeeId, employeeName } })
}
export function transferPatrol(orderId, employeeId, employeeName) {
  return request({ url: '/intra/care/ledger/patrol/transfer', method: 'post', params: { orderId, employeeId, employeeName } })
}
export function revokePatrol(orderId) {
  return request({ url: '/intra/care/ledger/patrol/revoke', method: 'post', params: { orderId } })
}
export function signPatrol(orderId, patrolPlace) {
  return request({ url: '/intra/care/ledger/patrol/sign', method: 'post', params: { orderId, patrolPlace } })
}
export function startPatrol(orderId) {
  return request({ url: '/intra/care/ledger/patrol/start', method: 'post', params: { orderId } })
}
export function disposePatrol(data) {
  // data: { orderId, disposeOpinion, rectifyEmployeeId, rectifyEmployeeName, rectifyDeadline }
  return request({ url: '/intra/care/ledger/patrol/dispose', method: 'post', params: data })
}
export function reviewPatrol(orderId, pass, reviewResult) {
  return request({ url: '/intra/care/ledger/patrol/review', method: 'post', params: { orderId, pass, reviewResult } })
}
export function closePatrol(orderId, reviewResult) {
  return request({ url: '/intra/care/ledger/patrol/close', method: 'post', params: { orderId, reviewResult } })
}
export function cancelPatrol(orderId, cancelReason) {
  return request({ url: '/intra/care/ledger/patrol/cancel', method: 'post', params: { orderId, cancelReason } })
}
// 延期：调整计划巡访时间(记录原因/次数)
export function delayPatrol(orderId, planPatrolTime, delayReason) {
  return request({ url: '/intra/care/ledger/patrol/delay', method: 'post', params: { orderId, planPatrolTime, delayReason } })
}
export function autoGeneratePatrol() {
  return request({ url: '/intra/care/ledger/patrol/autoGenerate', method: 'post' })
}
// 隐患明细
export function listRiskItems(orderId) {
  return request({ url: '/intra/care/ledger/patrol/riskItems/' + orderId, method: 'get' })
}
export function submitRiskItem(data) {
  return request({ url: '/intra/care/ledger/patrol/riskItem/submit', method: 'post', data })
}
export function deleteRiskItem(ids) {
  return request({ url: '/intra/care/ledger/patrol/riskItem/delete', method: 'post', data: Array.isArray(ids) ? ids : [ids] })
}
export function fixRiskItem(data) {
  // data: { id, fixDesc, fixImages, fixBy }
  return request({ url: '/intra/care/ledger/patrol/riskItem/fix', method: 'post', data })
}
// 回访
export function listRevisits(orderId) {
  return request({ url: '/intra/care/ledger/patrol/revisit/' + orderId, method: 'get' })
}
export function submitRevisit(data) {
  return request({ url: '/intra/care/ledger/patrol/revisit/submit', method: 'post', data })
}
// 流转日志
export function listPatrolLogs(orderId) {
  return request({ url: '/intra/care/ledger/patrol/logs/' + orderId, method: 'get' })
}
