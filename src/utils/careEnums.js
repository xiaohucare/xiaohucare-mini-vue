/**
 * 养老业务通用枚举与编码映射
 *
 * 对应数据库中由 enum 升级为 tinyint 的编码列，集中维护「取值编码 / 下拉选项 / 名称映射 / 标签样式」，
 * 避免各组件重复定义。
 *
 * 使用示例：
 *
 * 1. 下拉选项 + 名称映射
 *    import { MEAL_TYPE_OPTIONS, getMealTypeName } from '@/utils/careEnums'
 *    <el-option v-for="opt in MEAL_TYPE_OPTIONS" :key="opt.value" :label="opt.label" :value="opt.value" />
 *    {{ getMealTypeName(row.mealType) }}
 *
 * 2. 需要兼容历史枚举字符串时（如 e_checkin_resident.care_level 仍为 '自理'），
 *    getCareLevelName 会原样透传字符串，数字编码则转标签。
 */

// ===== 餐次类型 meal_type：1早餐 2午餐 3晚餐 4加餐 =====
export const MEAL_TYPE = {
  BREAKFAST: 1,
  LUNCH: 2,
  DINNER: 3,
  SNACK: 4,
}

export const MEAL_TYPE_OPTIONS = [
  { value: 1, label: '早餐' },
  { value: 2, label: '午餐' },
  { value: 3, label: '晚餐' },
  { value: 4, label: '加餐' },
]

const MEAL_TYPE_TAG = { 1: 'success', 2: 'warning', 3: 'danger', 4: 'info' }

export function getMealTypeName(mealType) {
  if (mealType === '' || mealType == null) return ''
  const item = MEAL_TYPE_OPTIONS.find(o => o.value === Number(mealType))
  return item ? item.label : mealType
}

export function getMealTypeTagType(mealType) {
  return MEAL_TYPE_TAG[mealType] || 'info'
}

// ===== 参与状态 participation_status：1已参与 0未参与 2请假 =====
export const PARTICIPATION_STATUS = {
  JOINED: 1,
  NOT_JOINED: 0,
  LEAVE: 2,
}

export const PARTICIPATION_STATUS_OPTIONS = [
  { value: 1, label: '已参与' },
  { value: 0, label: '未参与' },
  { value: 2, label: '请假' },
]

const PARTICIPATION_STATUS_TAG = { 1: 'success', 0: 'info', 2: 'warning' }

export function getParticipationStatusName(status) {
  if (status === '' || status == null) return ''
  const item = PARTICIPATION_STATUS_OPTIONS.find(o => o.value === Number(status))
  return item ? item.label : status
}

export function getParticipationStatusTagType(status) {
  return PARTICIPATION_STATUS_TAG[status] || 'info'
}

// ===== 照护等级 care_level（e_resident）：1自理 2半自理 3失能 =====
export const CARE_LEVEL = {
  SELF: 1,
  SEMI: 2,
  DISABLED: 3,
}

export const CARE_LEVEL_OPTIONS = [
  { value: 1, label: '自理' },
  { value: 2, label: '半自理' },
  { value: 3, label: '失能' },
]

export function getCareLevelName(level) {
  if (level === '' || level == null) return ''
  // 兼容历史枚举字符串（如 e_checkin_resident.care_level 仍为 enum）
  if (level === '自理' || level === '半自理' || level === '失能') return level
  const item = CARE_LEVEL_OPTIONS.find(o => o.value === Number(level))
  return item ? item.label : level
}

// ===== 计费周期 charge_cycle（e_store_charge_combo）：0按年 1按月 2按天 =====
export const CHARGE_CYCLE = {
  YEAR: 0,
  MONTH: 1,
  DAY: 2,
}

export const CHARGE_CYCLE_OPTIONS = [
  { value: 0, label: '按年收费' },
  { value: 1, label: '按月收费' },
  { value: 2, label: '按天收费' },
]

const CHARGE_CYCLE_UNIT = { 0: '/年', 1: '/月', 2: '/天' }

export function getChargeCycleName(cycle) {
  if (cycle === '' || cycle == null) return ''
  const item = CHARGE_CYCLE_OPTIONS.find(o => o.value === Number(cycle))
  return item ? item.label : cycle
}

export function getChargeCycleUnit(cycle) {
  return CHARGE_CYCLE_UNIT[Number(cycle)] || '/天'
}

/**
 * 按套餐的年/月/天三价 + 预计天数解析计费周期与价格（与后端 ChargeCalcKit.fromCombo 同口径）。
 * 规则：满一年(>=365)按年、满月(>=30)按月、否则按天；选定周期缺价时回退更细粒度价并同步调整周期。
 *
 * @param {object} pkg 套餐对象（含 yearPrice/monthPrice/dayPrice/chargeCycle）
 * @param {number} estimatedDays 预计住养天数
 * @returns {{cycle:number, periodPrice:number, dailyPrice:number}} 周期 / 周期单价 / 折算日单价
 */
export function resolveComboPrice(pkg, estimatedDays) {
  if (!pkg) return { cycle: CHARGE_CYCLE.DAY, periodPrice: 0, dailyPrice: 0 }
  const year = Number(pkg.yearPrice) || 0
  const month = Number(pkg.monthPrice) || 0
  const day = Number(pkg.dayPrice) || 0
  const positive = (v) => v > 0
  if (!positive(year) && !positive(month) && !positive(day)) {
    const cycle = pkg.chargeCycle == null ? CHARGE_CYCLE.DAY : Number(pkg.chargeCycle)
    return { cycle, periodPrice: 0, dailyPrice: 0 }
  }
  const d = Number(estimatedDays) || 0
  let cycle = d >= 365 ? CHARGE_CYCLE.YEAR : d >= 30 ? CHARGE_CYCLE.MONTH : CHARGE_CYCLE.DAY
  let periodPrice
  if (cycle === CHARGE_CYCLE.YEAR) {
    if (positive(year)) periodPrice = year
    else if (positive(month)) { periodPrice = month; cycle = CHARGE_CYCLE.MONTH }
    else { periodPrice = day; cycle = CHARGE_CYCLE.DAY }
  } else if (cycle === CHARGE_CYCLE.MONTH) {
    if (positive(month)) periodPrice = month
    else if (positive(day)) { periodPrice = day; cycle = CHARGE_CYCLE.DAY }
    else { periodPrice = year; cycle = CHARGE_CYCLE.YEAR }
  } else {
    if (positive(day)) periodPrice = day
    else if (positive(month)) { periodPrice = month; cycle = CHARGE_CYCLE.MONTH }
    else { periodPrice = year; cycle = CHARGE_CYCLE.YEAR }
  }
  return { cycle, periodPrice, dailyPrice: Number(getComboDailyPrice(cycle, periodPrice).toFixed(2)) }
}

/** 周期单价折算日单价（年/365、月/30、天原值，与后端一致） */
export function getComboDailyPrice(cycle, periodPrice) {
  const p = Number(periodPrice) || 0
  if (Number(cycle) === CHARGE_CYCLE.YEAR) return p / 365
  if (Number(cycle) === CHARGE_CYCLE.MONTH) return p / 30
  return p
}

/** 计费周期单位对应天数（年365/月30/天1） */
export function unitDaysOfCycle(cycle) {
  if (Number(cycle) === CHARGE_CYCLE.YEAR) return 365
  if (Number(cycle) === CHARGE_CYCLE.MONTH) return 30
  return 1
}

/** 计划总天数 = 数量 × 周期单位天数（与后端 ChargeCalcKit.plannedDays 同口径） */
export function plannedDays(chargeNum, cycle) {
  const n = Math.max(0, Number(chargeNum) || 0)
  return n * unitDaysOfCycle(cycle)
}

/**
 * 按「已选计费周期」从套餐三价取周期单价（与后端 ChargeCalcKit.priceForCycle 同口径）：
 * 所选周期缺价时回退到更细粒度（年→月→天）可用价并同步调整周期；三价全空则周期沿用所选、价视为 0。
 * @returns {{cycle:number, periodPrice:number, dailyPrice:number}}
 */
export function resolveComboPriceByCycle(pkg, chosenCycle) {
  const cycle = chosenCycle == null ? CHARGE_CYCLE.DAY : Number(chosenCycle)
  if (!pkg) return { cycle, periodPrice: 0, dailyPrice: 0 }
  const year = Number(pkg.yearPrice) || 0
  const month = Number(pkg.monthPrice) || 0
  const day = Number(pkg.dayPrice) || 0
  const pos = (v) => v > 0
  if (!pos(year) && !pos(month) && !pos(day)) {
    return { cycle, periodPrice: 0, dailyPrice: 0 }
  }
  let c = cycle
  let periodPrice
  if (c === CHARGE_CYCLE.YEAR) {
    if (pos(year)) periodPrice = year
    else if (pos(month)) { periodPrice = month; c = CHARGE_CYCLE.MONTH }
    else { periodPrice = day; c = CHARGE_CYCLE.DAY }
  } else if (c === CHARGE_CYCLE.MONTH) {
    if (pos(month)) periodPrice = month
    else if (pos(day)) { periodPrice = day; c = CHARGE_CYCLE.DAY }
    else { periodPrice = year; c = CHARGE_CYCLE.YEAR }
  } else {
    if (pos(day)) periodPrice = day
    else if (pos(month)) { periodPrice = month; c = CHARGE_CYCLE.MONTH }
    else { periodPrice = year; c = CHARGE_CYCLE.YEAR }
  }
  return { cycle: c, periodPrice, dailyPrice: Number(getComboDailyPrice(c, periodPrice).toFixed(2)) }
}

/** 总天数拆为 {years, months, days}（1年=365天、1月=30天），与后端 calcBedFee 拆分口径一致 */
export function decomposeDuration(totalDays) {
  const total = Math.max(0, Number(totalDays) || 0)
  const years = Math.floor(total / 365)
  const rem = total % 365
  const months = Math.floor(rem / 30)
  const days = rem % 30
  return { years, months, days }
}

/**
 * 套餐基础费（康养费）逐段累加：年价×年 + 月价×月 + 日价×天（与后端 ChargeCalcKit.calcBedFee 同口径）。
 * 缺某档价时向更细粒度降级（年→12月、月→30天、无日价时按月/年价折算日价）。
 */
export function calcBedFee(yearPrice, monthPrice, dayPrice, totalDays) {
  const year = Number(yearPrice) || 0
  const month = Number(monthPrice) || 0
  const day = Number(dayPrice) || 0
  const pos = (v) => v > 0
  let { years, months, days } = decomposeDuration(totalDays)
  let fee = 0
  if (pos(year)) {
    fee += year * years
  } else {
    months += years * 12
  }
  if (pos(month)) {
    fee += month * months
  } else {
    days += months * 30
  }
  if (pos(day)) {
    fee += day * days
  } else {
    const daily = pos(month) ? month / 30 : pos(year) ? year / 365 : 0
    fee += daily * days
  }
  return Math.round((fee + Number.EPSILON) * 100) / 100
}

// ===== 房间类型 room_type（e_store_room）：1单人间 2双人间 3多人间 4夫妻房 =====
export const ROOM_TYPE = {
  SINGLE: 1,
  DOUBLE: 2,
  MULTI: 3,
  COUPLE: 4,
}

export const ROOM_TYPE_OPTIONS = [
  { value: 1, label: '单人间' },
  { value: 2, label: '双人间' },
  { value: 3, label: '多人间' },
  { value: 4, label: '夫妻房' },
]

export function getRoomTypeName(type) {
  if (type === '' || type == null) return ''
  // 兼容历史自由文本（如旧数据仍为 '单人间'）
  if (typeof type === 'string' && isNaN(Number(type))) return type
  const item = ROOM_TYPE_OPTIONS.find(o => o.value === Number(type))
  return item ? item.label : type
}

// ===== 房间等级 room_level（e_store_room）：1普通 2高级 3豪华 4豪华+ =====
export const ROOM_LEVEL = {
  NORMAL: 1,
  SUPERIOR: 2,
  DELUXE: 3,
  DELUXE_PLUS: 4,
}

export const ROOM_LEVEL_OPTIONS = [
  { value: 1, label: '普通' },
  { value: 2, label: '高级' },
  { value: 3, label: '豪华' },
  { value: 4, label: '豪华+' },
]

export function getRoomLevelName(level) {
  if (level === '' || level == null) return ''
  const item = ROOM_LEVEL_OPTIONS.find(o => o.value === Number(level))
  return item ? item.label : level
}

// ==================== 长者档案枚举（e_resident）====================
// 通用：根据 options 取 label（兼容空值与历史文本）
export function enumName(options, val) {
  if (val === '' || val == null) return ''
  const item = options.find(o => o.value === Number(val))
  return item ? item.label : val
}

// 婚姻状况 marital_status：1未婚 2已婚 3丧偶 4离异 5再婚
export const MARITAL_STATUS_OPTIONS = [
  { value: 1, label: '未婚' }, { value: 2, label: '已婚' }, { value: 3, label: '丧偶' },
  { value: 4, label: '离异' }, { value: 5, label: '再婚' },
]

// 文化程度 education：1文盲 2小学 3初中 4高中/中专 5大专 6本科及以上
export const EDUCATION_OPTIONS = [
  { value: 1, label: '文盲' }, { value: 2, label: '小学' }, { value: 3, label: '初中' },
  { value: 4, label: '高中/中专' }, { value: 5, label: '大专' }, { value: 6, label: '本科及以上' },
]

// 自理能力 self_care_ability：1完全自理 2部分自理 3不能自理
export const SELF_CARE_OPTIONS = [
  { value: 1, label: '完全自理' }, { value: 2, label: '部分自理' }, { value: 3, label: '不能自理' },
]

// 认知状况 cognitive_status：1正常 2疑似障碍 3确诊障碍
export const COGNITIVE_OPTIONS = [
  { value: 1, label: '正常' }, { value: 2, label: '疑似障碍' }, { value: 3, label: '确诊障碍' },
]

// 跌倒风险 fall_risk：1低 2中 3高
export const FALL_RISK_OPTIONS = [
  { value: 1, label: '低' }, { value: 2, label: '中' }, { value: 3, label: '高' },
]

// 入住性质 check_in_type：1长期入住 2短期托养 3日间照料 4试住
export const CHECK_IN_TYPE_OPTIONS = [
  { value: 1, label: '长期入住' }, { value: 2, label: '短期托养' },
  { value: 3, label: '日间照料' }, { value: 4, label: '试住' },
]

// 医保类型 medical_insurance_type：1城镇职工 2城乡居民 3新农合 4自费
export const MEDICAL_INSURANCE_OPTIONS = [
  { value: 1, label: '城镇职工' }, { value: 2, label: '城乡居民' },
  { value: 3, label: '新农合' }, { value: 4, label: '自费' },
]

// 结算状态 settlement_status：0未结算 1已结算
export const SETTLEMENT_OPTIONS = [
  { value: 0, label: '未结算' }, { value: 1, label: '已结算' },
]

// 入住状态 check_in_status（e_resident）：0未入住 1在住 2已退住
export const CHECK_IN_STATUS_OPTIONS = [
  { value: 0, label: '未入住' }, { value: 1, label: '在住' }, { value: 2, label: '已退住' },
]

const CHECK_IN_STATUS_TAG = { 0: 'info', 1: 'success', 2: 'warning' }

export function getCheckInStatusName(status) {
  if (status === '' || status == null) return ''
  const item = CHECK_IN_STATUS_OPTIONS.find(o => o.value === Number(status))
  return item ? item.label : status
}

export function getCheckInStatusTagType(status) {
  return CHECK_IN_STATUS_TAG[Number(status)] || 'info'
}

// ===== 费用项计费方式 charge_mode（e_fee_item / e_store_checkin_fee_item）
// 0按天 1按次 2固定 3按重 4按年 5按月 =====
export const FEE_CHARGE_MODE = {
  PER_DAY: 0,
  PER_TIME: 1,
  FIXED: 2,
  PER_WEIGHT: 3,
  PER_YEAR: 4,
  PER_MONTH: 5,
}

export const FEE_CHARGE_MODE_OPTIONS = [
  { value: 0, label: '按天' },
  { value: 1, label: '按次' },
  { value: 2, label: '固定' },
  { value: 3, label: '按重' },
  { value: 4, label: '按年' },
  { value: 5, label: '按月' },
]

const FEE_CHARGE_MODE_UNIT = { 0: '/天', 1: '/次', 2: '', 3: '/kg', 4: '/年', 5: '/月' }

export function getChargeModeLabel(mode) {
  if (mode === '' || mode == null) return ''
  const item = FEE_CHARGE_MODE_OPTIONS.find(o => o.value === Number(mode))
  return item ? item.label : mode
}

export function getChargeModeUnit(mode) {
  return FEE_CHARGE_MODE_UNIT[Number(mode)] || ''
}

// ===== 登记状态 checkin_status（e_store_checkin）
// 0登记中 1待入住 2康养中 3已退住 9已拒收 =====
export const CHECKIN_STATUS = {
  REGISTERING: 0,
  PENDING: 1,
  IN_CARE: 2,
  CHECKED_OUT: 3,
  REJECTED: 9,
}

export const CHECKIN_STATUS_OPTIONS = [
  { value: 0, label: '登记中' },
  { value: 1, label: '待入住' },
  { value: 2, label: '康养中' },
  { value: 3, label: '已退住' },
  { value: 9, label: '已拒收' },
]

const CHECKIN_STATUS_TAG = { 0: 'info', 1: 'warning', 2: 'success', 3: '', 9: 'danger' }

export function getCheckinStatusName(status) {
  if (status === '' || status == null) return ''
  const item = CHECKIN_STATUS_OPTIONS.find(o => o.value === Number(status))
  return item ? item.label : status
}

export function getCheckinStatusTagType(status) {
  return CHECKIN_STATUS_TAG[Number(status)] || 'info'
}

// ===== 退住交接状态 checkout_status（e_store_checkin）
// 0未开始 1交接中 2已完成 =====
export const CHECKOUT_STATUS = {
  NOT_STARTED: 0,
  HANDOVER: 1,
  COMPLETED: 2,
}

export const CHECKOUT_STATUS_OPTIONS = [
  { value: 0, label: '未开始' },
  { value: 1, label: '交接中' },
  { value: 2, label: '已完成' },
]

const CHECKOUT_STATUS_TAG = { 0: 'info', 1: 'warning', 2: 'success' }

export function getCheckoutStatusName(status) {
  if (status === '' || status == null) return ''
  const item = CHECKOUT_STATUS_OPTIONS.find(o => o.value === Number(status))
  return item ? item.label : status
}

export function getCheckoutStatusTagType(status) {
  return CHECKOUT_STATUS_TAG[Number(status)] || 'info'
}

// ===== 合同状态 status（e_store_resident_contract）
// 0待签署 1已签署 2已完成 3已作废 =====
export const CONTRACT_STATUS = {
  PENDING: 0,
  SIGNED: 1,
  COMPLETED: 2,
  VOIDED: 3,
}

export const CONTRACT_STATUS_OPTIONS = [
  { value: 0, label: '待签署' },
  { value: 1, label: '已签署' },
  { value: 2, label: '已完成' },
  { value: 3, label: '已作废' },
]

const CONTRACT_STATUS_TAG = { 0: 'warning', 1: 'success', 2: 'info', 3: 'danger' }

export function getContractStatusName(status) {
  if (status === '' || status == null) return ''
  const item = CONTRACT_STATUS_OPTIONS.find(o => o.value === Number(status))
  return item ? item.label : status
}

export function getContractStatusTagType(status) {
  return CONTRACT_STATUS_TAG[Number(status)] || 'info'
}


// ==================== 养老智慧台账 / 巡访工单枚举（e_ledger_*）====================
// 仅“固定编码类”放这里（与后端 LedgerConstants 对齐）；
// 老人类型/服务需求项/隐患项走系统字典动态加载（/system/dict/data/type/{dictType}，对应 sys_dict_data）。

// 探访类型 visit_type：1常规关爱 2需求评估 3服务跟进 4回访重访
export const LEDGER_VISIT_TYPE_OPTIONS = [
  { value: 1, label: '常规关爱' }, { value: 2, label: '需求评估' },
  { value: 3, label: '服务跟进' }, { value: 4, label: '回访重访' },
]

// 探访工单状态 visit_order_status：1待分配 2待上门 3已完成 4延期 5取消 6重访
export const LEDGER_VISIT_ORDER_STATUS_OPTIONS = [
  { value: 1, label: '待分配' }, { value: 2, label: '待上门' }, { value: 3, label: '已完成' },
  { value: 4, label: '延期' }, { value: 5, label: '取消' }, { value: 6, label: '重访' },
]
const LEDGER_VISIT_ORDER_STATUS_TAG = { 1: 'info', 2: 'warning', 3: 'success', 4: 'danger', 5: 'info', 6: 'warning' }

// 档案来源 elder_source：1社区居家登记 2机构在住长者同步
export const LEDGER_ELDER_SOURCE_OPTIONS = [
  { value: 1, label: '社区居家' }, { value: 2, label: '机构同步' },
]

// 档案状态 state：0注销 1正常 2停用
export const LEDGER_ELDER_STATE_OPTIONS = [
  { value: 0, label: '注销' }, { value: 1, label: '正常' }, { value: 2, label: '停用' },
]
const LEDGER_ELDER_STATE_TAG = { 0: 'info', 1: 'success', 2: 'warning' }

// 风险等级 risk_level：1低/一般 2关注 3高
export const LEDGER_RISK_LEVEL_OPTIONS = [
  { value: 1, label: '低' }, { value: 2, label: '关注' }, { value: 3, label: '高' },
]
const LEDGER_RISK_LEVEL_TAG = { 1: 'success', 2: 'warning', 3: 'danger' }

// 频次周期 frequency_type：1每天 2每周 3每月
export const LEDGER_PLAN_FREQUENCY_OPTIONS = [
  { value: 1, label: '每天' }, { value: 2, label: '每周' }, { value: 3, label: '每月' },
]

// 满意度 satisfaction：1满意 2一般 3不满意
export const LEDGER_SATISFACTION_OPTIONS = [
  { value: 1, label: '满意' }, { value: 2, label: '一般' }, { value: 3, label: '不满意' },
]

// 工单来源 source_type：1计划生成 2人工新建
export const LEDGER_ORDER_SOURCE_OPTIONS = [
  { value: 1, label: '计划生成' }, { value: 2, label: '人工新建' },
]

// 流转动作 action（与 LedgerConstants 一致）
export const LEDGER_ORDER_ACTION_MAP = {
  assign: '分派', transfer: '转派', revoke: '撤回', sign: '签到', start: '开始',
  rectify: '处置', review: '复查', close: '结案', cancel: '取消', delay: '延期',
  finish: '完成', reject: '驳回', revisit: '重访',
}

export function getLedgerVisitTypeName(v) { return enumName(LEDGER_VISIT_TYPE_OPTIONS, v) }
export function getLedgerVisitOrderStatusName(v) { return enumName(LEDGER_VISIT_ORDER_STATUS_OPTIONS, v) }
export function getLedgerVisitOrderStatusTag(v) { return LEDGER_VISIT_ORDER_STATUS_TAG[Number(v)] || 'info' }
export function getLedgerElderSourceName(v) { return enumName(LEDGER_ELDER_SOURCE_OPTIONS, v) }
export function getLedgerElderStateName(v) { return enumName(LEDGER_ELDER_STATE_OPTIONS, v) }
export function getLedgerElderStateTag(v) { return LEDGER_ELDER_STATE_TAG[Number(v)] || 'info' }
export function getLedgerRiskLevelName(v) { return enumName(LEDGER_RISK_LEVEL_OPTIONS, v) }
export function getLedgerRiskLevelTag(v) { return LEDGER_RISK_LEVEL_TAG[Number(v)] || 'info' }
export function getLedgerPlanFrequencyName(v) { return enumName(LEDGER_PLAN_FREQUENCY_OPTIONS, v) }
export function getLedgerSatisfactionName(v) { return enumName(LEDGER_SATISFACTION_OPTIONS, v) }
export function getLedgerOrderSourceName(v) { return enumName(LEDGER_ORDER_SOURCE_OPTIONS, v) }
export function getLedgerActionName(a) { return LEDGER_ORDER_ACTION_MAP[a] || a }

// ===== 巡访工单 patrol =====
// 巡访类型 patrol_type：1日常安全 2高危专项 3投诉巡访 4隐患复查
export const LEDGER_PATROL_TYPE_OPTIONS = [
  { value: 1, label: '日常安全' }, { value: 2, label: '高危专项' },
  { value: 3, label: '投诉巡访' }, { value: 4, label: '隐患复查' },
]
// 巡访工单状态：1待分派 2待巡访 3处置中 4待复查 5已结案 6取消
export const LEDGER_PATROL_ORDER_STATUS_OPTIONS = [
  { value: 1, label: '待分派' }, { value: 2, label: '待巡访' }, { value: 3, label: '处置中' },
  { value: 4, label: '待复查' }, { value: 5, label: '已结案' }, { value: 6, label: '取消' },
]
const LEDGER_PATROL_ORDER_STATUS_TAG = { 1: 'info', 2: 'warning', 3: 'primary', 4: 'warning', 5: 'success', 6: 'info' }
// 巡访来源 source_type：1计划生成 2人工上报 3风险预警
export const LEDGER_PATROL_SOURCE_OPTIONS = [
  { value: 1, label: '计划生成' }, { value: 2, label: '人工上报' }, { value: 3, label: '风险预警' },
]
// 隐患是否整改 is_fixed：0否 1是
export const LEDGER_FIXED_OPTIONS = [
  { value: 0, label: '未整改' }, { value: 1, label: '已整改' },
]

export function getLedgerPatrolTypeName(v) { return enumName(LEDGER_PATROL_TYPE_OPTIONS, v) }
export function getLedgerPatrolOrderStatusName(v) { return enumName(LEDGER_PATROL_ORDER_STATUS_OPTIONS, v) }
export function getLedgerPatrolOrderStatusTag(v) { return LEDGER_PATROL_ORDER_STATUS_TAG[Number(v)] || 'info' }
export function getLedgerPatrolSourceName(v) { return enumName(LEDGER_PATROL_SOURCE_OPTIONS, v) }
