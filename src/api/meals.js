import request from '@/utils/request'

// 餐饮菜单管理API
export function listMealsMenus(query) {
  return request({
    url: '/intra/meal/mealsmenus/browse',
    method: 'get',
    params: query
  })
}

export function getMealsMenu(menuId) {
  return request({
    url: '/intra/meal/mealsmenus/detail/' + menuId,
    method: 'get'
  })
}

export function addMealsMenu(data) {
  return request({
    url: '/intra/meal/mealsmenus/submit',
    method: 'post',
    data: data
  })
}

export function updateMealsMenu(data) {
  return request({
    url: '/intra/meal/mealsmenus/submit',
    method: 'post',
    data: data
  })
}

export function delMealsMenu(menuId) {
  return request({
    url: '/intra/meal/mealsmenus/delete',
    method: 'delete',
    params: [menuId]
  })
}

// 餐饮记录管理API
export function listMealsRecords(query) {
  return request({
    url: '/intra/meal/mealsrecord/browse',
    method: 'get',
    params: query
  })
}

export function getMealsRecord(recordId) {
  return request({
    url: '/intra/meal/mealsrecord/detail/' + recordId,
    method: 'get'
  })
}

export function addMealsRecord(data) {
  return request({
    url: '/intra/meal/mealsrecord/submit',
    method: 'post',
    data: data
  })
}

export function updateMealsRecord(data) {
  return request({
    url: '/intra/meal/mealsrecord/submit',
    method: 'post',
    data: data
  })
}

export function delMealsRecord(recordId) {
  return request({
    url: '/intra/meal/mealsrecord/delete',
    method: 'delete',
    params: [recordId]
  })
}

// 统计API
export function getMealsStatistics() {
  return request({
    url: '/meals/statistics',
    method: 'get'
  })
}
// 批量操作API
export function batchAddMealsMenus(data) {
  return request({
    url: '/meals/menus/batch',
    method: 'post',
    data: data
  })
}

export function batchAddMealsRecords(data) {
  return request({
    url: '/meals/records/batch',
    method: 'post',
    data: data
  })
}

// 餐饮套餐管理API
export function listMealsPackages(query) {
  return request({
    url: '/intra/meal/mealspackage/browse',
    method: 'get',
    params: query
  })
}

// 获取全部套餐（不分页，用于下拉选择）
export function listAllMealsPackages(query) {
  return request({
    url: '/intra/meal/mealspackage/listAll',
    method: 'get',
    params: query
  })
}

export function getMealsPackage(packageId) {
  return request({
    url: '/intra/meal/mealspackage/detail/' + packageId,
    method: 'get'
  })
}

export function addMealsPackage(data) {
  return request({
    url: '/intra/meal/mealspackage/submit',
    method: 'post',
    data: data
  })
}

export function updateMealsPackage(data) {
  return request({
    url: '/intra/meal/mealspackage/submit',
    method: 'post',
    data: data
  })
}

export function delMealsPackage(packageId) {
  return request({
    url: '/intra/meal/mealspackage/delete',
    method: 'delete',
    params: [packageId]
  })
}