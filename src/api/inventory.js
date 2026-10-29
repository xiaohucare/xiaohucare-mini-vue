import request from '@/utils/request'

// 库存物品管理API
export const getInventoryItems = (params) => request({
  url: '/intra/ginkgo/inventoryitems/browse',
  method: 'get',
  params
})

export const createInventoryItem = (data) => request({
  url: '/intra/ginkgo/inventoryitems/submit',
  method: 'post',
  data
})

export const updateInventoryItem = (data) => request({
  url: `/intra/ginkgo/inventoryitems/submit`,
  method: 'post',
  data
})

export const deleteInventoryItem = (id) => request({
  url: `/intra/ginkgo/inventoryitems/delete`,
  method: 'post',
  data: [id]
})

export const getInventoryItemDetail = (id) => request({
  url: `/intra/ginkgo/inventoryitems/detail/${id}`,
  method: 'get'
})

// 库存交易记录API
export const getInventoryTransactions = (params) => request({
  url: '/intra/ginkgo/inventorytransactions/browse',
  method: 'get',
  params
})

export const createInventoryTransaction = (data) => request({
  url: '/intra/ginkgo/inventorytransactions/submit',
  method: 'post',
  data
})

export const updateInventoryTransaction = (data) => request({
  url: '/intra/ginkgo/inventorytransactions/submit',
  method: 'post',
  data
})

export const deleteInventoryTransaction = (id) => request({
  url: '/intra/ginkgo/inventorytransactions/delete',
  method: 'post',
  data: [id]
})

// 库存统计API
export const getInventoryStatistics = (params) => request({
  url: '/inventory/statistics',
  method: 'get',
  params
})

// 批量操作API
export const batchUpdateInventoryStatus = (data) => request({
  url: '/inventory-items/batch-status',
  method: 'put',
  data
})

export const batchImportInventoryItems = (data) => request({
  url: '/inventory-items/batch-import',
  method: 'post',
  data
})