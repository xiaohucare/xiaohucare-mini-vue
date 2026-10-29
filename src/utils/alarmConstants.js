/**
 * 报警相关常量和枚举
 * 
 * 使用示例：
 * 
 * 1. 导入枚举和选项
 *    import { ALARM_KIND, ALARM_KIND_OPTIONS, getAlarmKindName } from "@/utils/alarmConstants";
 * 
 * 2. 在模板中使用枚举值
 *    <el-col v-if="form.alarmKind === ALARM_KIND.INDICATOR">
 * 
 * 3. 使用选项数组
 *    const alarmKindOptions = ALARM_KIND_OPTIONS;
 * 
 * 4. 格式化显示
 *    {{ getAlarmKindName(row.alarmKind) }}
 */

// 报警类型枚举
export const ALARM_KIND = {
  INDICATOR: 0, // 指标报警
  BUSINESS: 1, // 业务报警
  OFFLINE: 2, // 设备离线报警
}

// 报警类型选项
export const ALARM_KIND_OPTIONS = [
  { label: '指标报警', value: ALARM_KIND.INDICATOR },
  { label: '业务报警', value: ALARM_KIND.BUSINESS },
  { label: '设备离线报警', value: ALARM_KIND.OFFLINE },
]

// 获取报警类型名称
export function getAlarmKindName(value) {
  const item = ALARM_KIND_OPTIONS.find(opt => opt.value === value)
  return item ? item.label : '-'
}

// 比较类型枚举
export const COMPARE_TYPE = {
  MAX: 0, // 上限报警
  MIN: 1, // 下限报警
  MAX_MIN: 2, // 上下限报警
  RANGE: 3, // 区间报警
}

// 比较类型选项
export const COMPARE_TYPE_OPTIONS = [
  { label: '上限报警', value: COMPARE_TYPE.MAX },
  { label: '下限报警', value: COMPARE_TYPE.MIN },
  { label: '上下限报警', value: COMPARE_TYPE.MAX_MIN },
  { label: '区间报警', value: COMPARE_TYPE.RANGE },
]

// 获取比较类型名称
export function getCompareTypeName(value) {
  const item = COMPARE_TYPE_OPTIONS.find(opt => opt.value === value)
  return item ? item.label : '-'
}

// 业务类型枚举
export const DATA_TYPE = {
  ENERGY: 0, // 综合能耗
  CARBON: 1, // 碳排放量
  COST: 2, // 费用总量
}

// 业务类型选项
export const DATA_TYPE_OPTIONS = [
  { label: '综合能耗', value: DATA_TYPE.ENERGY },
  { label: '碳排放量', value: DATA_TYPE.CARBON },
  { label: '费用总量', value: DATA_TYPE.COST },
]

// 获取业务类型名称
export function getDataTypeName(value) {
  const item = DATA_TYPE_OPTIONS.find(opt => opt.value === value)
  return item ? item.label : '-'
}

// 报警状态枚举
export const ALARM_STATUS = {
  PENDING: 0, // 待处理
  PROCESSED: 1, // 已处理
  IGNORED: 2, // 已忽略
}

// 报警状态选项
export const ALARM_STATUS_OPTIONS = [
  { label: '待处理', value: ALARM_STATUS.PENDING },
  { label: '已处理', value: ALARM_STATUS.PROCESSED },
  { label: '已忽略', value: ALARM_STATUS.IGNORED },
]

// 获取报警状态名称
export function getAlarmStatusName(value) {
  const item = ALARM_STATUS_OPTIONS.find(opt => opt.value === value)
  return item ? item.label : '-'
}

