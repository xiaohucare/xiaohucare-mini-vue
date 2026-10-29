import request from '@/utils/request'

// 合同分页列表（自动排除模板行）
export function getResidentContracts(params) {
  return request({
    url: '/intra/care/contract/browse',
    method: 'get',
    params: params
  })
}

// 合同详情
export function getResidentContractDetail(id) {
  return request({
    url: '/intra/care/contract/detail/' + id,
    method: 'get'
  })
}

// 保存 / 更新合同（无 id 为新增，后端自动生成合同编号）
export function submitContract(data) {
  return request({
    url: '/intra/care/contract/submit',
    method: 'post',
    data: data
  })
}

// 签署合同
export function signContract(data) {
  return request({
    url: '/intra/care/contract/sign',
    method: 'post',
    data: data
  })
}

// 删除合同（逻辑删除）
export function deleteContract(ids) {
  return request({
    url: '/intra/care/contract/delete',
    method: 'post',
    data: Array.isArray(ids) ? ids : [ids]
  })
}

// 模板列表（返回数组，不分页）
export function getResidentContractTemplates(params) {
  return request({
    url: '/intra/care/contract/templates',
    method: 'get',
    params: params
  })
}

// 保存 / 更新模板
export function submitContractTemplate(data) {
  return request({
    url: '/intra/care/contract/template/submit',
    method: 'post',
    data: data
  })
}

// 删除模板
export function deleteContractTemplate(ids) {
  return request({
    url: '/intra/care/contract/template/delete',
    method: 'post',
    data: Array.isArray(ids) ? ids : [ids]
  })
}
