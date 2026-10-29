<template>
  <div class="app-container about-page">
    <!-- 顶部导航 -->
    <div class="site-nav">
      <div class="site-nav-inner">
        <div class="nav-brand" @click="goTarget('/index')">
          <svg-icon icon-class="ginkgo" class="nav-logo" />
          <span class="nav-title">小护康养 mini</span>
        </div>
        <div class="nav-links">
          <a class="nav-link" @click="goTarget('/index')">首页</a>
          <a class="nav-link" @click="openExternal('http://xiaohucare.com/')">官网</a>
          <el-dropdown trigger="hover" @command="openExternal">
            <span class="nav-link repo-trigger">
              开源仓库
              <el-icon class="repo-arrow"><ArrowDown /></el-icon>
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="https://github.com/xiaohucare/xiaohucare-mini-vue">前端 · GitHub</el-dropdown-item>
                <el-dropdown-item command="https://gitee.com/chongkelai/xiaohucare-mini-vue">前端 · Gitee</el-dropdown-item>
                <el-dropdown-item divided command="https://github.com/xiaohucare/xiaohucare-mini">后端 · GitHub</el-dropdown-item>
                <el-dropdown-item command="https://gitee.com/chongkelai/xiaohucare-mini">后端 · Gitee</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
          <el-button type="primary" round @click="goTarget('/login')">
            <el-icon><UserFilled /></el-icon>
            登录入口
          </el-button>
        </div>
      </div>
    </div>

    <!-- 头部欢迎区域 -->
    <div class="welcome-section">
      <div class="welcome-content">
        <div class="logo-container">
          <div class="logo-icon">
            <svg-icon icon-class="ginkgo" class="leaf-icon" style="font-size: 48px" />
          </div>
        </div>
        <h1 class="welcome-title">
          <span class="logo-text">小护康养</span>mini · 开源项目
        </h1>
        <p class="welcome-subtitle">基于 Vue 3 + Element Plus + Vite 的养老机构数字化运营管理系统，MIT 协议开源，代码公开、自由使用、欢迎社区共建</p>
        <div class="version-badge">
          <el-tag type="success" size="large" round>v{{ version }}</el-tag>
          <el-tag size="large" round class="badge-license">MIT License</el-tag>
          <el-tag size="large" round class="badge-checkin">Vue 3</el-tag>
          <el-tag size="large" round class="badge-care">Element Plus</el-tag>
          <el-tag size="large" round class="badge-monitor">Vite</el-tag>
          <el-tag size="large" round class="badge-meals">Pinia</el-tag>
        </div>
      </div>
    </div>

    <!-- 项目定位 -->
    <div class="section-block">
      <h2 class="section-main-title">一个开源的康养管理系统</h2>
      <p class="section-main-desc">以 RuoYi-Vue3 骨架为底座二次开发，入住、照护、膳食等核心场景开源可用，智能监护为 Pro 版能力</p>
      <el-row :gutter="20" justify="center" class="main-content">
        <el-col :xs="24" :sm="12" :md="8" :lg="6" v-for="module in modules" :key="module.key">
          <div class="module-card card-animate" :class="[module.key + '-card', { 'is-pro': module.pro }]">
            <div v-if="module.pro" class="pro-badge">
              <el-icon><Lock /></el-icon> Pro
            </div>
            <div class="card-header">
              <div class="header-icon">{{ module.icon }}</div>
              <div class="header-text">
                <h2 class="section-title">{{ module.name }}</h2>
                <span class="section-tag">{{ module.tag }}</span>
              </div>
            </div>
            <div class="card-body">
              <p class="module-desc">{{ module.desc }}</p>

              <div class="feature-list">
                <div class="feature-item" v-for="(item, index) in module.features" :key="index">
                  <el-icon class="feature-icon"><component :is="item.icon" /></el-icon>
                  <div class="feature-info">
                    <h4>{{ item.title }}</h4>
                    <p>{{ item.desc }}</p>
                  </div>
                </div>
              </div>

              <div class="module-stats">
                <div class="stat-box" v-for="(stat, index) in module.stats" :key="index">
                  <span class="stat-num">{{ stat.num }}</span>
                  <span class="stat-label">{{ stat.label }}</span>
                </div>
              </div>
            </div>
          </div>
        </el-col>
      </el-row>
    </div>

    <!-- 技术栈 + 快速开始 -->
    <div class="section-block">
      <h2 class="section-main-title">开箱即用的技术底座</h2>
      <p class="section-main-desc">主流前端技术栈组合，工程规范与文档齐备，三步即可跑起属于你的实例</p>
      <el-row :gutter="20" class="main-content">
      <el-col :xs="24" :lg="16">
        <div class="module-card ability-card card-animate">
          <div class="card-header">
            <div class="header-icon">🧰</div>
            <h2 class="section-title">技术栈与工程能力</h2>
          </div>
          <div class="card-body">
            <p class="module-desc">主流前端技术组合，模块划分清晰，注释与 README 齐备，方便二次开发与定制扩展</p>
            <div class="ability-grid">
              <div class="ability-item" v-for="(item, index) in abilities" :key="index">
                <el-icon class="ability-icon"><component :is="item.icon" /></el-icon>
                <div class="ability-info">
                  <h4>{{ item.title }}</h4>
                  <p>{{ item.desc }}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </el-col>

      <el-col :xs="24" :lg="8">
        <div class="module-card quick-card card-animate">
          <div class="card-header">
            <div class="header-icon">🚀</div>
            <h2 class="section-title">快速开始</h2>
          </div>
          <div class="card-body">
            <p class="module-desc">三步跑起属于你的实例，也欢迎提 Issue 与 PR 参与共建</p>

            <div class="cmd-list">
              <div class="cmd-item" v-for="(cmd, index) in quickStart" :key="index">
                <div class="cmd-step">{{ index + 1 }}</div>
                <code class="cmd-code">{{ cmd }}</code>
                <el-button class="cmd-copy" link type="primary" @click="copyCmd(cmd)">
                  <el-icon><CopyDocument /></el-icon>
                </el-button>
              </div>
            </div>

            <div class="quick-actions">
              <el-button type="primary" size="large" @click="goTarget('/login')" round>
                <el-icon><UserFilled /></el-icon>
                在线体验
              </el-button>
              <el-button type="success" size="large" @click="goTarget('/register')" round>
                <el-icon><EditPen /></el-icon>
                注册账号
              </el-button>
            </div>

            <div class="contact-info">
              <h4>开源信息</h4>
              <p><el-icon><Document /></el-icon> 许可证：MIT · 可免费商用</p>
              <div class="repo-list">
                <div class="repo-group">
                  <span class="repo-label"><el-icon><EditPen /></el-icon> 前端 (Vue3)</span>
                  <div class="repo-links">
                    <a class="repo-link" href="https://github.com/xiaohucare/xiaohucare-mini-vue" target="_blank" rel="noopener"><el-icon><Link /></el-icon> GitHub</a>
                    <a class="repo-link" href="https://gitee.com/chongkelai/xiaohucare-mini-vue" target="_blank" rel="noopener"><el-icon><Link /></el-icon> Gitee</a>
                  </div>
                </div>
                <div class="repo-group">
                  <span class="repo-label"><el-icon><EditPen /></el-icon> 后端 (Java)</span>
                  <div class="repo-links">
                    <a class="repo-link" href="https://github.com/xiaohucare/xiaohucare-mini" target="_blank" rel="noopener"><el-icon><Link /></el-icon> GitHub</a>
                    <a class="repo-link" href="https://gitee.com/chongkelai/xiaohucare-mini" target="_blank" rel="noopener"><el-icon><Link /></el-icon> Gitee</a>
                  </div>
                </div>
              </div>
              <p><el-icon><Operation /></el-icon> 分支：主分支保持稳定，特性走独立分支</p>
            </div>
          </div>
        </div>
      </el-col>
      </el-row>
    </div>

    <!-- 开源优势 -->
    <div class="section-block">
      <h2 class="section-main-title">为什么值得使用与参与</h2>
      <el-row :gutter="20">
        <el-col :xs="12" :sm="6" v-for="(adv, index) in advantages" :key="index">
          <div class="advantage-item">
            <div class="adv-icon">{{ adv.icon }}</div>
            <h4>{{ adv.title }}</h4>
            <p>{{ adv.desc }}</p>
          </div>
        </el-col>
      </el-row>
    </div>

    <!-- 技术咨询 -->
    <div class="section-block contact-section">
      <h2 class="section-main-title">技术咨询与合作</h2>
      <p class="section-main-desc">部署实施、功能定制、私有化或 Pro 版能力咨询，扫码添加微信，备注来意更快通过</p>
      <div class="contact-card card-animate">
        <div class="qr-box">
          <img src="@/assets/images/xhc_wx.jpg" alt="微信二维码" class="qr-img" />
          <p class="qr-tip">微信扫一扫 · 技术咨询</p>
        </div>
        <div class="contact-info-list">
          <div class="contact-line">
            <el-icon><ChatDotRound /></el-icon>
            <span>微信咨询</span>
            <em>扫描左侧二维码添加技术顾问</em>
          </div>
          <div class="contact-line">
            <el-icon><Link /></el-icon>
            <span>官方网站</span>
            <a class="contact-link" @click="openExternal('http://xiaohucare.com/')">xiaohucare.com</a>
          </div>
          <div class="contact-line">
            <el-icon><Promotion /></el-icon>
            <span>开源仓库</span>
            <em>GitHub / Gitee 检索 xiaohucare-mini</em>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup name="About">
import { ref, getCurrentInstance } from 'vue'
import {
  UserFilled,
  EditPen,
  CopyDocument,
  Document,
  Link,
  Operation,
  ArrowDown,
  ChatDotRound,
  Promotion
} from '@element-plus/icons-vue'

const { proxy } = getCurrentInstance()

const version = ref('3.9.0')

// 快速开始命令
const quickStart = ref([
  'git clone https://gitee.com/chongkelai/xiaohucare-mini-vue.git',
  'cd xiaohucare-vue && npm install',
  'npm run dev'
])

// 核心业务模块（feature 图标使用全局注册的 element-plus 图标名）
const modules = ref([
  {
    key: 'checkin',
    name: '入住管理',
    tag: '开源模块',
    icon: '🏠',
    desc: '从入住评估、床位分配到退住结算，长者入住全流程在线管理',
    features: [
      { title: '入住评估', desc: '健康评估与护理等级评定，一人一档', icon: 'DocumentChecked' },
      { title: '房态床位', desc: '床位可视化，入住率、预留、调换一目了然', icon: 'House' },
      { title: '离住结算', desc: '押金、费用明细一键结算，退住交接规范', icon: 'Wallet' }
    ],
    stats: [
      { num: '全流程', label: '入住闭环' },
      { num: '1v1', label: '长者档案' },
      { num: '实时', label: '床位状态' }
    ]
  },
  {
    key: 'care',
    name: '康养照护',
    tag: '开源模块',
    icon: '🩺',
    desc: '按护理等级定制照护计划，日常照护与交接班全程留痕',
    features: [
      { title: '护理计划', desc: '按等级定制照护任务，责任到人', icon: 'List' },
      { title: '照护记录', desc: '喂食喂药、清洁体征打卡，家属可查', icon: 'Finished' },
      { title: '交接班管理', desc: '护理员排班值班，交接内容自动同步', icon: 'Clock' }
    ],
    stats: [
      { num: '等级化', label: '护理方案' },
      { num: '全留痕', label: '照护记录' },
      { num: '24h', label: '值班覆盖' }
    ]
  },
  
  {
    key: 'meals',
    name: '老年膳食',
    tag: '开源模块',
    icon: '🍲',
    desc: '贴合长者体质的营养配餐，每日餐单与特殊膳食科学管理',
    features: [
      { title: '营养配餐', desc: '依据慢病与体质定制均衡食谱', icon: 'Dish' },
      { title: '每日餐单', desc: '周/月餐单排布，备餐用量自动汇总', icon: 'Tickets' },
      { title: '特殊膳食', desc: '低糖、低盐、流食等分级供餐', icon: 'FirstAidKit' }
    ],
    stats: [
      { num: '个性化', label: '营养方案' },
      { num: '周/月', label: '餐单管理' },
      { num: '多类', label: '治疗膳食' }
    ]
  },
  {
    key: 'wms',
    name: '机构 WMS 管理',
    tag: '开源模块',
    icon: '📦',
    desc: '面向机构自采物资的仓储管理，商品、出入库、盘点与库存预警一体化',
    features: [
      { title: '商品与库存', desc: '物资档案、批次库存实时可查', icon: 'Goods' },
      { title: '出入库管理', desc: '采购入库、领用出库单据全程留痕', icon: 'Sell' },
      { title: '盘点与预警', desc: '库存盘点、临期与低库存自动预警', icon: 'Box' }
    ],
    stats: [
      { num: '批次', label: '库存台账' },
      { num: '单据化', label: '出入库' },
      { num: '实时', label: '预警提醒' }
    ]
  },
  {
    key: 'patrol',
    name: '巡访工单',
    tag: '开源模块',
    icon: '📝',
    desc: '面向社区与机构的巡访探访工单管理，计划排期、现场记录、隐患闭环全程可追溯',
    features: [
      { title: '巡访计划', desc: '周期排期与任务派发，人员对象一一对应', icon: 'Compass' },
      { title: '现场记录', desc: '走访打卡与拍照留痕，状况实时回传', icon: 'Camera' },
      { title: '隐患闭环', desc: '风险等级上报，处置与回访形成闭环', icon: 'Warning' }
    ],
    stats: [
      { num: '周期化', label: '巡访排期' },
      { num: '全留痕', label: '现场记录' },
      { num: '分级', label: '隐患处置' }
    ]
  },

  {
    key: 'monitor',
    name: '智能监护',
    tag: 'Pro 版',
    pro: true,
    icon: '📡',
    desc: '电子围栏、跌倒报警、一键呼叫与视频监控，构筑安全防线',
    features: [
      { title: '电子围栏', desc: '防走失定位，越界自动告警', icon: 'MapLocation' },
      { title: '跌倒/离床报警', desc: '智能设备感知异常，秒级推送', icon: 'Bell' },
      { title: '一键呼叫', desc: '床头/腕带呼叫，护理站即时响应', icon: 'Service' }
    ],
    stats: [
      { num: '24h', label: '实时监护' },
      { num: '秒级', label: '告警响应' },
      { num: '多端', label: '联动推送' }
    ]
  },
  {
    key: 'mobile',
    name: '机构移动管理端',
    tag: 'Pro 版',
    pro: true,
    icon: '📱',
    desc: '手机端随时处理机构日常，审批、告警、看板随身可控，与 PC 后台数据实时同步',
    features: [
      { title: '移动审批', desc: '入退住、费用、工单随身发起与审批', icon: 'Tickets' },
      { title: '告警推送', desc: '呼叫与监护告警实时推送到人', icon: 'Bell' },
      { title: '运营看板', desc: '入住率、照护质量移动端随时查看', icon: 'Odometer' }
    ],
    stats: [
      { num: '多端', label: '数据同步' },
      { num: '实时', label: '移动审批' },
      { num: '随身', label: '告警推送' }
    ]
  },
  {
    key: 'miniprogram',
    name: '小程序客户端',
    tag: 'Pro 版',
    pro: true,
    icon: '💙',
    desc: '面向家属与长者的微信小程序，照护透明、随时互动，让不在身边也能安心牵挂',
    features: [
      { title: '照护动态', desc: '每日照护、体征与相册家属可查', icon: 'PictureFilled' },
      { title: '在线缴费', desc: '账单、续费与消费明细手机端直达', icon: 'Wallet' },
      { title: '探视互动', desc: '视频探视、留言与一键呼叫连线', icon: 'VideoCamera' }
    ],
    stats: [
      { num: '透明', label: '照护可见' },
      { num: '手机端', label: '在线缴费' },
      { num: '实时', label: '视频探视' }
    ]
  },
])

// 技术栈与工程能力
const abilities = ref([
  { title: 'Vue 3.5 + Pinia', desc: '组合式 API 编写，状态管理轻量直观', icon: 'ChromeFilled' },
  { title: 'Vite 6 构建', desc: '秒级冷启动与热更新，构建产物自动分块', icon: 'Lightning' },
  { title: 'Element Plus 2.10', desc: '全站组件库支撑，图标全局注册开箱即用', icon: 'Grid' },
  { title: 'ECharts 5 可视化', desc: '经营看板、统计报表、大屏图表复用', icon: 'TrendCharts' },
  { title: '动态路由权限', desc: 'RBAC 菜单由后端下发，按钮级 v-hasPermi 控制', icon: 'Lock' },
  { title: '国际化 i18n', desc: '内置中英文语言包，扩展新语言成本低', icon: 'Message' },
  { title: 'RESTful API 层', desc: 'src/api 按业务域分目录，与后端 Controller 一一对应', icon: 'Connection' },
  { title: '工程规范', desc: 'README 详尽记录编码约定、环境变量与已知坑', icon: 'Collection' }
])

// 开源优势
const advantages = ref([
  { icon: '📜', title: 'MIT 协议', desc: '许可宽松，可自由使用、修改与商用' },
  { icon: '👀', title: '代码透明', desc: '全量源码开放，可自行审计与裁剪' },
  { icon: '🧱', title: '骨架成熟', desc: '源自 RuoYi-Vue3，社区验证、稳定可靠' },
  { icon: '🤝', title: '社区共建', desc: '欢迎 Issue / PR，持续迭代演进' }
])

function copyCmd(cmd) {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(cmd).then(() => {
      proxy.$modal.msgSuccess('命令已复制')
    }).catch(() => {
      proxy.$modal.msgError('复制失败，请手动选择复制')
    })
  } else {
    proxy.$modal.msgWarning('当前浏览器不支持自动复制，请手动选择命令文本')
  }
}

function goTarget(url) {
  window.open(url, '_self')
}

// 打开外链（官网 / 开源仓库），新标签页
function openExternal(url) {
  window.open(url, '_blank', 'noopener')
}
</script>

<style scoped lang="scss">
.about-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #f5f7fa 0%, #e4e8ec 100%);
  padding-bottom: 40px;

  // 顶部导航
  .site-nav {
    position: sticky;
    top: -20px;
    z-index: 100;
    margin: -20px -20px 0;
    background: rgba(15, 23, 42, 0.92);
    backdrop-filter: blur(10px);
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.15);

    .site-nav-inner {
      max-width: 1400px;
      margin: 0 auto;
      padding: 0 20px;
      height: 60px;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .nav-brand {
      display: flex;
      align-items: center;
      gap: 10px;
      cursor: pointer;

      .nav-logo {
        font-size: 30px;
        color: #41b883;
      }

      .nav-title {
        font-size: 1.15rem;
        font-weight: 700;
        color: #fff;
        letter-spacing: 0.5px;
      }
    }

    .nav-links {
      display: flex;
      align-items: center;
      gap: 24px;

      .nav-link {
        color: rgba(255, 255, 255, 0.85);
        font-size: 0.95rem;
        cursor: pointer;
        transition: color 0.2s ease;

        &:hover {
          color: #41b883;
        }
      }

      .repo-trigger {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        outline: none;

        .repo-arrow {
          font-size: 0.8em;
          transition: transform 0.2s ease;
        }

        &:hover .repo-arrow {
          transform: translateY(1px);
        }
      }
    }
  }

  // 欢迎区域
  .welcome-section {
    background: linear-gradient(135deg, #1b2a4a 0%, #2f6b4f 100%);
    color: white;
    padding: 50px 0;
    text-align: center;
    margin: 0 -20px 30px;
    position: relative;
    overflow: hidden;

    &::before {
      content: "";
      position: absolute;
      top: -50%;
      left: -50%;
      width: 200%;
      height: 200%;
      background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0) 70%);
      transform: rotate(30deg);
    }

    .logo-container {
      margin-bottom: 15px;
      display: flex;
      justify-content: center;

      .logo-icon {
        width: 80px;
        height: 80px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: rgba(255, 255, 255, 0.15);
        border-radius: 50%;
        font-size: 40px;
        backdrop-filter: blur(10px);
        animation: float 3s ease-in-out infinite;
      }
    }

    .welcome-content {
      max-width: 1200px;
      margin: 0 auto;
      padding: 0 20px;
      position: relative;
      z-index: 1;

      .welcome-title {
        font-size: 2.8rem;
        font-weight: 700;
        margin-bottom: 15px;
        text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.2);

        .logo-text {
          color: #ffd700;
        }
      }

      .welcome-subtitle {
        font-size: 1.2rem;
        margin-bottom: 25px;
        opacity: 0.9;
        font-weight: 300;
        max-width: 800px;
        margin-left: auto;
        margin-right: auto;
      }

      .version-badge {
        display: flex;
        justify-content: center;
        gap: 12px;
        flex-wrap: wrap;

        .el-tag {
          border: none;
        }
        .badge-license { background: #f0a020; color: #fff; }
        .badge-checkin { background: #2f8bfd; color: #fff; }
        .badge-care { background: #7C3AED; color: #fff; }
        .badge-monitor { background: #0ea5e9; color: #fff; }
        .badge-meals { background: #41b883; color: #fff; }
      }
    }
  }

  // 区块通用
  .section-block {
    max-width: 1200px;
    margin: 0 auto 40px;
  }

  .section-main-title {
    text-align: center;
    font-size: 1.8rem;
    font-weight: 700;
    color: #333;
    margin-bottom: 8px;
  }

  .section-main-desc {
    text-align: center;
    color: #888;
    font-size: 0.95rem;
    margin: 0 auto 24px;
  }

  // 主要内容
  .main-content {
    margin: 0 auto;
    padding: 0 4px;
    row-gap: 20px;
  }

  .mid-row {
    max-width: 1200px;
    margin: 0 auto 40px;
  }

  // 卡片通用样式
  .module-card {
    position: relative;
    background: white;
    border-radius: 16px;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
    overflow: hidden;
    transition: all 0.3s ease;
    height: 100%;
    margin-bottom: 20px;

    &:hover {
      transform: translateY(-5px);
      box-shadow: 0 16px 40px rgba(0, 0, 0, 0.12);
    }

    .card-header {
      padding: 20px 24px;
      display: flex;
      align-items: center;
      gap: 12px;

      .header-icon {
        font-size: 32px;
      }

      .header-text {
        display: flex;
        flex-direction: column;
      }

      .section-title {
        font-size: 1.35rem;
        font-weight: 600;
        margin: 0;
        color: white;
      }

      .section-tag {
        font-size: 0.78rem;
        color: rgba(255, 255, 255, 0.85);
        margin-top: 2px;
      }
    }

    .card-body {
      padding: 24px;

      .module-desc {
        color: #666;
        font-size: 0.95rem;
        margin-bottom: 20px;
        line-height: 1.6;
      }
    }
  }

  // 四大模块卡片配色
  .checkin-card .card-header { background: linear-gradient(135deg, #2f8bfd 0%, #53a8ff 100%); }
  .care-card .card-header { background: linear-gradient(135deg, #7C3AED 0%, #a855f7 100%); }
  .monitor-card .card-header { background: linear-gradient(135deg, #0ea5e9 0%, #38bdf8 100%); }
  .meals-card .card-header { background: linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%); }
  .wms-card .card-header { background: linear-gradient(135deg, #0f766e 0%, #14b8a6 100%); }
  .patrol-card .card-header { background: linear-gradient(135deg, #db2777 0%, #f472b6 100%); }
  .mobile-card .card-header { background: linear-gradient(135deg, #475569 0%, #64748b 100%); }
  .miniprogram-card .card-header { background: linear-gradient(135deg, #2563eb 0%, #60a5fa 100%); }

  // Pro 专属模块标识
  .module-card.is-pro {
    border: 1px solid #f0a020;
    box-shadow: 0 8px 24px rgba(240, 160, 32, 0.18);

    .pro-badge {
      position: absolute;
      top: 12px;
      right: 12px;
      z-index: 2;
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 3px 10px;
      border-radius: 999px;
      background: linear-gradient(135deg, #f0a020 0%, #f7c948 100%);
      color: #fff;
      font-size: 0.75rem;
      font-weight: 700;
      box-shadow: 0 2px 8px rgba(240, 160, 32, 0.4);

      .el-icon {
        font-size: 0.85em;
      }
    }
  }

  // 技术栈卡片
  .ability-card {
    .card-header {
      background: linear-gradient(135deg, #4b6cb7 0%, #182848 100%);
    }

    .ability-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 14px;

      .ability-item {
        display: flex;
        align-items: flex-start;
        gap: 12px;
        padding: 14px;
        background: #f8fafc;
        border-radius: 10px;
        transition: all 0.2s ease;

        &:hover {
          background: #eef2f7;
          transform: translateX(3px);
        }

        .ability-icon {
          width: 38px;
          height: 38px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: white;
          border-radius: 8px;
          color: #4b6cb7;
          font-size: 1.2rem;
          flex-shrink: 0;
        }

        .ability-info {
          flex: 1;

          h4 {
            font-size: 0.95rem;
            font-weight: 600;
            color: #333;
            margin: 0 0 4px 0;
          }

          p {
            font-size: 0.82rem;
            color: #666;
            margin: 0;
            line-height: 1.4;
          }
        }
      }
    }
  }

  // 快速开始卡片
  .quick-card {
    .card-header {
      background: linear-gradient(135deg, #10b981 0%, #34d399 100%);
    }

    .cmd-list {
      display: flex;
      flex-direction: column;
      gap: 10px;
      margin-bottom: 20px;

      .cmd-item {
        display: flex;
        align-items: center;
        gap: 10px;
        background: #0f172a;
        border-radius: 10px;
        padding: 8px 12px;

        .cmd-step {
          width: 22px;
          height: 22px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #10b981;
          color: white;
          border-radius: 50%;
          font-size: 0.75rem;
          font-weight: 700;
          flex-shrink: 0;
        }

        .cmd-code {
          flex: 1;
          color: #a5f3fc;
          font-family: Menlo, Consolas, monospace;
          font-size: 0.82rem;
          white-space: nowrap;
          overflow-x: auto;
        }

        .cmd-copy {
          color: #94a3b8;
          flex-shrink: 0;

          &:hover {
            color: #10b981;
          }
        }
      }
    }

    .quick-actions {
      display: flex;
      flex-direction: column;
      gap: 12px;
      margin-bottom: 24px;

      .el-button {
        justify-content: center;
        width: 100%;
        margin-left: 0;
      }
    }

    .contact-info {
      padding-top: 20px;
      border-top: 1px solid #e5e7eb;

      h4 {
        font-size: 1rem;
        color: #333;
        margin-bottom: 12px;
      }

      p {
        display: flex;
        align-items: center;
        gap: 8px;
        color: #666;
        font-size: 0.9rem;
        margin: 8px 0;

        .el-icon {
          color: #409EFF;
        }
      }

      .repo-list {
        display: flex;
        flex-direction: column;
        gap: 8px;
        margin: 8px 0;

        .repo-group {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;

          .repo-label {
            display: flex;
            align-items: center;
            gap: 8px;
            color: #666;
            font-size: 0.9rem;
            flex-shrink: 0;

            .el-icon {
              color: #409EFF;
            }
          }

          .repo-links {
            display: flex;
            gap: 8px;
          }
        }

        .repo-link {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 2px 10px;
          border-radius: 6px;
          background: #f0f7ff;
          color: #409EFF;
          font-size: 0.82rem;
          text-decoration: none;
          white-space: nowrap;
          transition: all 0.2s ease;

          &:hover {
            background: #409EFF;
            color: #fff;
          }
        }
      }
    }
  }

  // 功能列表
  .feature-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
    margin-bottom: 20px;

    .feature-item {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      padding: 12px;
      background: #f8fafc;
      border-radius: 10px;
      transition: all 0.2s ease;

      &:hover {
        background: #f1f5f9;
        transform: translateX(3px);
      }

      .feature-icon {
        width: 36px;
        height: 36px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: white;
        border-radius: 8px;
        color: #409EFF;
        font-size: 1.1rem;
        flex-shrink: 0;
      }

      .feature-info {
        flex: 1;

        h4 {
          font-size: 0.95rem;
          font-weight: 600;
          color: #333;
          margin: 0 0 4px 0;
        }

        p {
          font-size: 0.85rem;
          color: #666;
          margin: 0;
          line-height: 1.4;
        }
      }
    }
  }

  // 模块统计
  .module-stats {
    display: flex;
    justify-content: space-around;
    background: #f8fafc;
    border-radius: 12px;
    padding: 16px;

    .stat-box {
      display: flex;
      flex-direction: column;
      align-items: center;

      .stat-num {
        font-size: 1.15rem;
        font-weight: 700;
        color: #333;
        margin-bottom: 4px;
      }

      .stat-label {
        font-size: 0.78rem;
        color: #888;
        text-align: center;
      }
    }
  }

  // 参与共建卡片
  .contribute-section {
    .contribute-card {
      text-align: center;

      .card-body {
        padding: 30px 20px;
      }

      .contribute-icon {
        font-size: 40px;
        margin-bottom: 12px;
      }

      h4 {
        font-size: 1.1rem;
        font-weight: 600;
        color: #333;
        margin-bottom: 8px;
      }

      p {
        font-size: 0.85rem;
        color: #666;
        margin: 0;
        line-height: 1.6;
      }
    }
  }

  // 开源优势
  .advantage-item {
    background: white;
    border-radius: 16px;
    padding: 30px 20px;
    text-align: center;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.06);
    transition: all 0.3s ease;
    margin-bottom: 20px;

    &:hover {
      transform: translateY(-3px);
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
    }

    .adv-icon {
      font-size: 40px;
      margin-bottom: 12px;
    }

    h4 {
      font-size: 1.1rem;
      font-weight: 600;
      color: #333;
      margin-bottom: 8px;
    }

    p {
      font-size: 0.85rem;
      color: #666;
      margin: 0;
    }
  }

  // 技术咨询
  .contact-section {
    .contact-card {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 44px;
      flex-wrap: wrap;
      background: white;
      border-radius: 16px;
      padding: 32px 28px;
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);

      .qr-box {
        text-align: center;

        .qr-img {
          width: 180px;
          height: 180px;
          object-fit: contain;
          border-radius: 12px;
          border: 1px solid #eef2f7;
          padding: 8px;
          background: #fff;
        }

        .qr-tip {
          margin: 10px 0 0;
          font-size: 0.85rem;
          color: #888;
        }
      }

      .contact-info-list {
        display: flex;
        flex-direction: column;
        gap: 16px;

        .contact-line {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 0.95rem;
          color: #333;

          .el-icon {
            color: #41b883;
            font-size: 1.2rem;
          }

          span {
            font-weight: 600;
            min-width: 72px;
          }

          em {
            font-style: normal;
            color: #888;
            font-size: 0.9rem;
          }

          .contact-link {
            color: #409EFF;
            cursor: pointer;

            &:hover {
              text-decoration: underline;
            }
          }
        }
      }
    }
  }

  // 卡片动画
  .card-animate {
    animation: slideUp 0.6s ease-out forwards;
    opacity: 0;
    transform: translateY(30px);

    &:nth-child(1) { animation-delay: 0.1s; }
    &:nth-child(2) { animation-delay: 0.2s; }
    &:nth-child(3) { animation-delay: 0.3s; }
    &:nth-child(4) { animation-delay: 0.4s; }
    &:nth-child(5) { animation-delay: 0.5s; }
    &:nth-child(6) { animation-delay: 0.6s; }
    &:nth-child(7) { animation-delay: 0.7s; }
    &:nth-child(8) { animation-delay: 0.8s; }
  }

  // 动画定义
  @keyframes float {
    0% { transform: translateY(0px); }
    50% { transform: translateY(-10px); }
    100% { transform: translateY(0px); }
  }

  @keyframes slideUp {
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  // 响应式
  @media (max-width: 768px) {
    .site-nav .nav-links {
      gap: 14px;
    }

    .welcome-section {
      padding: 40px 0;

      .welcome-title {
        font-size: 2rem;
      }

      .welcome-subtitle {
        font-size: 1rem;
      }
    }

    .ability-card .ability-grid {
      grid-template-columns: 1fr;
    }

    .advantage-item {
      margin-bottom: 16px;
    }
  }
}
</style>
