<template>
  <div class="login-viewport">
    <!-- 背景装饰银杏叶 -->
    <div class="ginkgo-leaf leaf-1"></div>
    <div class="ginkgo-leaf leaf-2"></div>
    <div class="ginkgo-leaf leaf-3"></div>
    <div class="ginkgo-leaf leaf-4"></div>
    <div class="ginkgo-leaf leaf-5"></div>

    <!-- 柔光光斑：给大面积渐变底一点空气感 -->
    <span class="glow glow-1"></span>
    <span class="glow glow-2"></span>
    <span class="glow glow-3"></span>

    <div class="login-page" :style="pageStyle">
      <!-- 顶部状态栏 -->
      <div class="top-status">
        <span class="ginkgo-dot" v-html="iconGinkgoSmall"></span>
        <span class="status-time">{{ currentTime }}</span>
      </div>

      <!-- 左侧品牌与功能 -->
      <div class="left-region">
        <!-- 包一层收窄到标题宽度，标语才能在标题下方真正居中，而不是居中于整块图标行 -->
        <div class="brand-group">
          <div class="brand-block">
            <span class="brand-logo" v-html="iconGinkgo"></span>
            <div class="brand-text">
              <h1 class="brand-title">小护康养 mini 版</h1>
              <!-- <span class="brand-tag">SAAS 平台</span> -->
            </div>
          </div>
          <p class="brand-slogan">智慧康养 · 全域感知 · 温情守护</p>
        </div>

        <div class="feature-row">
          <div v-for="item in featureList" :key="item.label" class="feature-item">
            <span class="feature-icon" v-html="item.icon"></span>
            <span class="feature-label">{{ item.label }}</span>
          </div>
        </div>
      </div>

      <!-- 右侧登录面板 -->
      <section class="login-panel">
        <div class="panel-inner">
          <div class="panel-header">
            <span class="header-line"></span>
            <div class="panel-heading">
              <span class="panel-title">用户登录</span>
              <span class="panel-subtitle">SIGN IN</span>
            </div>
            <span class="header-line"></span>
          </div>

          <el-form ref="loginRef" :model="loginForm" :rules="loginRules" class="login-form">
            <el-form-item prop="username">
              <div class="input-box">
                <span class="field-icon" v-html="iconUser"></span>
                <el-input
                  v-model="loginForm.username"
                  autofocus
                  autocomplete="username"
                  placeholder="请输入用户名"
                  @keyup.enter="handleLogin"
                />
              </div>
            </el-form-item>

            <el-form-item prop="password">
              <div class="input-box">
                <span class="field-icon" v-html="iconPassword"></span>
                <el-input
                  v-model="loginForm.password"
                  :type="passwordVisible ? 'text' : 'password'"
                  autocomplete="current-password"
                  placeholder="请输入密码"
                  @keyup.enter="handleLogin"
                />
                <button type="button" class="eye-btn" :aria-label="passwordVisible ? '隐藏密码' : '显示密码'" @click="passwordVisible = !passwordVisible">
                  <el-icon><component :is="passwordVisible ? 'View' : 'Hide'" /></el-icon>
                </button>
              </div>
            </el-form-item>

            <el-form-item v-if="captchaEnabled" prop="code">
              <div class="captcha-row">
                <div class="input-box captcha-input">
                  <span class="field-icon" v-html="iconCaptcha"></span>
                  <el-input
                    v-model="loginForm.code"
                    autocomplete="off"
                    placeholder="验证码"
                    @keyup.enter="handleLogin"
                  />
                </div>
                <div class="captcha-box" @click="getCode">
                  <!-- 必须用 v-if：v-show 会把 src="" 的 img 也挂上 DOM，浏览器对空 src 立即报 error，初始化时就会卡在“加载失败”态 -->
                  <img v-if="codeUrl && !codeError" :src="codeUrl" class="captcha-img" alt="验证码" @error="codeError = true" />
                  <div v-if="codeError" class="captcha-state is-error">加载失败<br />点击重试</div>
                  <div v-else-if="!codeUrl" class="captcha-state">加载中</div>
                  <span v-if="codeUrl && !codeError" class="captcha-mask">点击刷新</span>
                </div>
              </div>
            </el-form-item>

            <el-button :loading="loading" class="login-btn" @click.prevent="handleLogin">
              {{ loading ? '登录中' : '登录' }}
            </el-button>
          </el-form>

          <p class="panel-foot">欢迎使用小护康养智慧管控平台</p>
        </div>
      </section>

      <p class="page-copyright">© {{ year }} 小护康养 mini 版</p>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import useUserStore from '@/store/modules/user'
import { getCodeImg } from '@/api/login'

const userStore = useUserStore()
const route = useRoute()
const router = useRouter()
const loginRef = ref()
const loading = ref(false)
const passwordVisible = ref(false)
const codeUrl = ref('')
const codeError = ref(false)
const captchaEnabled = ref(true)
const currentTime = ref('')
const year = new Date().getFullYear()
const pageStyle = ref({})
let timer = null
let previousPageStyle = null

/* 银杏自然暖色风格的内联 SVG 图标 */
const GOLD = '#c9971a'
const GOLD_SOFT = '#f4e3b8'
const GREEN = '#7d9b76'

const iconGinkgo = `
  <svg viewBox="0 0 64 64">
    <g fill="none" stroke="${GOLD}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
      <path d="M32 60 C32 42 20 25 7 20 C14 8 25 4 32 11 C39 4 50 8 57 20 C44 25 32 42 32 60 Z" fill="${GOLD_SOFT}" fill-opacity="0.35"/>
      <path d="M32 24 V58"/>
      <path d="M22 24 C26 26 29 27 32 28"/>
      <path d="M42 24 C38 26 35 27 32 28"/>
    </g>
  </svg>
`
const iconGinkgoSmall = `
  <svg viewBox="0 0 24 24">
    <g fill="${GOLD}">
      <path d="M12 22 C12 15 7 9 2 7 C5 3 9 1.5 12 4 C15 1.5 19 3 22 7 C17 9 12 15 12 22 Z"/>
    </g>
  </svg>
`
const featureIcons = {
  health: `
    <svg viewBox="0 0 48 48">
      <path d="M24 14c-4-6-14-4-14 4 0 6 14 14 14 14s14-8 14-14c0-8-10-10-14-4z" fill="${GOLD_SOFT}" stroke="${GOLD}" stroke-width="1.8"/>
      <path d="M20 24h4l2-4 3 8 2-4h3" fill="none" stroke="${GREEN}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>`,
  elder: `
    <svg viewBox="0 0 48 48">
      <circle cx="24" cy="14" r="7" fill="${GOLD_SOFT}" stroke="${GOLD}" stroke-width="1.8"/>
      <path d="M12 40c0-8 5-12 12-12s12 4 12 12" fill="none" stroke="${GOLD}" stroke-width="1.8" stroke-linecap="round"/>
      <path d="M30 22v7" stroke="${GREEN}" stroke-width="2" stroke-linecap="round"/>
    </svg>`,
  org: `
    <svg viewBox="0 0 48 48">
      <path d="M12 22 L24 10 L36 22 Z" fill="${GOLD_SOFT}" stroke="${GOLD}" stroke-width="1.8" stroke-linejoin="round"/>
      <rect x="16" y="24" width="16" height="14" rx="2" fill="${GOLD_SOFT}" stroke="${GOLD}" stroke-width="1.8"/>
      <rect x="22" y="30" width="4" height="8" fill="${GREEN}"/>
    </svg>`,
  alert: `
    <svg viewBox="0 0 48 48">
      <path d="M24 8 L40 40 H8 Z" fill="${GOLD_SOFT}" stroke="${GOLD}" stroke-width="1.8" stroke-linejoin="round"/>
      <line x1="24" y1="18" x2="24" y2="29" stroke="${GREEN}" stroke-width="2.5" stroke-linecap="round"/>
      <circle cx="24" cy="34" r="2" fill="${GREEN}"/>
    </svg>`,
  data: `
    <svg viewBox="0 0 48 48">
      <rect x="10" y="24" width="6" height="12" rx="1.5" fill="${GOLD_SOFT}" stroke="${GOLD}" stroke-width="1.4"/>
      <rect x="20" y="16" width="6" height="20" rx="1.5" fill="${GOLD_SOFT}" stroke="${GOLD}" stroke-width="1.4"/>
      <rect x="30" y="8" width="6" height="28" rx="1.5" fill="${GOLD}" stroke="${GOLD}" stroke-width="1.4"/>
    </svg>`
}
const iconUser = `
  <svg viewBox="0 0 24 24">
    <circle cx="12" cy="8" r="4" fill="none" stroke="${GREEN}" stroke-width="1.8"/>
    <path d="M4 20c0-4 4-6 8-6s8 2 8 6" fill="none" stroke="${GREEN}" stroke-width="1.8" stroke-linecap="round"/>
  </svg>`
const iconPassword = `
  <svg viewBox="0 0 24 24">
    <rect x="5" y="10" width="14" height="10" rx="2" fill="none" stroke="${GREEN}" stroke-width="1.8"/>
    <path d="M8 10V7a4 4 0 0 1 8 0v3" fill="none" stroke="${GREEN}" stroke-width="1.8" stroke-linecap="round"/>
    <circle cx="12" cy="15" r="1.5" fill="${GOLD}"/>
  </svg>`
const iconCaptcha = `
  <svg viewBox="0 0 24 24">
    <path d="M12 5a7 7 0 0 1 7 7" fill="none" stroke="${GREEN}" stroke-width="1.8" stroke-linecap="round"/>
    <path d="M4 12a8 8 0 0 1 8-8" fill="none" stroke="${GREEN}" stroke-width="1.8" stroke-linecap="round"/>
    <circle cx="19" cy="12" r="1.7" fill="${GOLD}"/>
  </svg>`

const featureList = [
  { label: '健康监测', icon: featureIcons.health },
  { label: '长者管理', icon: featureIcons.elder },
  { label: '机构管理', icon: featureIcons.org },
  { label: '预警管理', icon: featureIcons.alert },
  { label: '数据分析', icon: featureIcons.data }
]

const loginForm = ref({
  username: 'admin',
  password: 'Admin@123456',
  code: '',
  uuid: ''
})

const loginRules = computed(() => ({
  username: [{ required: true, trigger: 'blur', message: '请输入用户名' }],
  password: [{ required: true, trigger: 'blur', message: '请输入密码' }],
  ...(captchaEnabled.value ? { code: [{ required: true, trigger: 'change', message: '请输入验证码' }] } : {})
}))

function formatNow() {
  const now = new Date()
  const weekMap = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六']
  const pad = n => String(n).padStart(2, '0')
  currentTime.value = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}   ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}   ${weekMap[now.getDay()]}`
}

function updatePageScale() {
  const designWidth = 1920
  const designHeight = 1080
  const scale = Math.min(window.innerWidth / designWidth, window.innerHeight / designHeight)
  pageStyle.value = {
    transform: `scale(${scale})`,
    left: `${(window.innerWidth - designWidth * scale) / 2}px`,
    top: `${(window.innerHeight - designHeight * scale) / 2}px`
  }
}

function lockPageScroll() {
  previousPageStyle = {
    htmlOverflow: document.documentElement.style.overflow,
    bodyOverflow: document.body.style.overflow,
    bodyMargin: document.body.style.margin
  }
  document.documentElement.style.overflow = 'hidden'
  document.body.style.overflow = 'hidden'
  document.body.style.margin = '0'
}

function unlockPageScroll() {
  if (!previousPageStyle) return
  document.documentElement.style.overflow = previousPageStyle.htmlOverflow
  document.body.style.overflow = previousPageStyle.bodyOverflow
  document.body.style.margin = previousPageStyle.bodyMargin
}

function getCode() {
  // 先回到等待态，避开上一张图的错误状态残留
  codeError.value = false
  codeUrl.value = ''
  getCodeImg().then(res => {
    captchaEnabled.value = res.captchaEnabled === undefined ? true : res.captchaEnabled
    if (captchaEnabled.value) {
      // 后端说验证码开着却没给图，直接进可重试的错态，不要拼出一张永远解码失败的碎图
      if (!res.img) {
        codeError.value = true
        return
      }
      codeUrl.value = 'data:image/jpeg;base64,' + res.img
      loginForm.value.uuid = res.uuid
    }
  }).catch(() => {
    codeError.value = true
  })
}

function handleLogin() {
  loginRef.value.validate(valid => {
    if (!valid) return
    loading.value = true
    userStore.login(loginForm.value).then(() => {
      router.push(route.query.redirect || '/home')
    }).catch(() => {
      if (captchaEnabled.value) {
        getCode()
      }
    }).finally(() => {
      loading.value = false
    })
  })
}

onMounted(() => {
  lockPageScroll()
  formatNow()
  updatePageScale()
  timer = setInterval(formatNow, 1000)
  window.addEventListener('resize', updatePageScale)
  getCode()
})

onUnmounted(() => {
  if (timer) clearInterval(timer)
  window.removeEventListener('resize', updatePageScale)
  unlockPageScroll()
})
</script>

<style scoped lang="scss">
/* ===== 小护康养 mini 版 · 登录页（自然暖色风格） ===== */
/* 设计稿基准 1920 x 1080，整体等比缩放避免元素被裁切 */

$gold: #c9971a;
$gold-deep: #a87a12;
$gold-soft: #f4e3b8;
$green: #7d9b76;
$ink: #5a4a32;

.login-viewport {
  position: fixed;
  inset: 0;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  /* 暖白 → 浅青 自然渐变底 + 极淡网格，避免大面积留白发空 */
  background:
    linear-gradient(rgba(201, 151, 26, 0.045) 1px, transparent 1px) 0 0 / 100% 48px,
    linear-gradient(90deg, rgba(201, 151, 26, 0.045) 1px, transparent 1px) 0 0 / 48px 100%,
    radial-gradient(1200px 700px at 82% 8%, rgba(244, 227, 184, 0.55), transparent 60%),
    radial-gradient(1000px 800px at 12% 100%, rgba(214, 228, 206, 0.65), transparent 55%),
    linear-gradient(135deg, #fdf9ee 0%, #f6f2e7 45%, #eef4ec 100%);
}

/* 柔光光斑：大圆形 + 大模糊，缓慢呼吸，不动也能看出层次 */
.glow {
  position: absolute;
  border-radius: 50%;
  filter: blur(70px);
  pointer-events: none;
  animation: glow-breathe 16s ease-in-out infinite alternate;
}
.glow-1 { width: 620px; height: 620px; top: -140px; left: 560px; background: rgba(244, 227, 184, 0.55); }
.glow-2 { width: 520px; height: 520px; bottom: -160px; right: 300px; background: rgba(214, 228, 206, 0.6); animation-duration: 19s; }
.glow-3 { width: 380px; height: 380px; top: 420px; right: -120px; background: rgba(240, 214, 190, 0.45); animation-duration: 22s; animation-delay: -6s; }

@keyframes glow-breathe {
  from { transform: translate3d(0, 0, 0) scale(1); opacity: 0.7; }
  to   { transform: translate3d(24px, -18px, 0) scale(1.08); opacity: 1; }
}

.login-page {
  position: absolute;
  width: 1920px;
  height: 1080px;
  transform-origin: left top;
}

/* 背景银杏叶装饰 */
.ginkgo-leaf {
  position: absolute;
  opacity: 0.5;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Cg fill='none' stroke='%23c9971a' stroke-width='2.6' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M32 60 C32 42 20 25 7 20 C14 8 25 4 32 11 C39 4 50 8 57 20 C44 25 32 42 32 60 Z' fill='%23f4e3b8' fill-opacity='0.4'/%3E%3Cpath d='M32 24 V58'/%3E%3Cpath d='M22 24 C26 26 29 27 32 28'/%3E%3Cpath d='M42 24 C38 26 35 27 32 28'/%3E%3C/g%3E%3C/svg%3E");
  background-size: contain;
  background-repeat: no-repeat;
  pointer-events: none;
  animation: leaf-drift 14s ease-in-out infinite;
}

/* 每片叶子用自己的 --r 存原始角度，关键帧里才能既保持旋转又叠加漂浮 */
@keyframes leaf-drift {
  0%, 100% { transform: rotate(var(--r, 0deg)) translate(0, 0); }
  50%      { transform: rotate(calc(var(--r, 0deg) + 5deg)) translate(10px, -18px); }
}

.leaf-1 { --r: -18deg; width: 120px; height: 120px; top: 120px; left: 260px; opacity: 0.28; animation-duration: 15s; }
.leaf-2 { --r: 30deg;  width: 70px;  height: 70px;  top: 470px; left: 92px;  opacity: 0.35; animation-duration: 11s; animation-delay: -3s; }
.leaf-3 { --r: 20deg;  width: 150px; height: 150px; bottom: 90px; left: 520px; opacity: 0.22; animation-duration: 18s; animation-delay: -6s; }
.leaf-4 { --r: -30deg; width: 80px;  height: 80px;  top: 210px; right: 96px; opacity: 0.3;  animation-duration: 13s; animation-delay: -2s; }
.leaf-5 { --r: -12deg; width: 110px; height: 110px; bottom: 200px; right: 430px; opacity: 0.25; animation-duration: 16s; animation-delay: -8s; }

/* 顶部状态栏 */
.top-status {
  position: absolute;
  top: 44px;
  left: 44px;
  z-index: 4;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 18px 8px 14px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.6);
  border: 1px solid rgba($gold, 0.22);
  box-shadow: 0 6px 18px rgba(150, 120, 60, 0.08);
  backdrop-filter: blur(6px);
}
.ginkgo-dot { display: inline-flex; width: 26px; height: 26px; }
/* v-html 注入的 SVG 拿不到 scoped 属性，尺寸必须走 :deep()，否则会按默认的 300x150 渲染溢出 */
.ginkgo-dot :deep(svg) { width: 100%; height: 100%; display: block; }
.status-time {
  color: $gold-deep;
  font-size: 18px;
  font-family: SourceHanSansCN-Regular, 'Microsoft YaHei', sans-serif;
  line-height: 24px;
  white-space: nowrap;
  letter-spacing: 0.4px;
  /* 秒数跳动不拉扯整体宽度 */
  font-variant-numeric: tabular-nums;
}

/* 左侧区域 */
.left-region {
  position: absolute;
  left: 176px;
  top: 218px;
  z-index: 2;
  animation: fade-up 0.7s ease-out both;
}
.brand-block {
  display: flex;
  align-items: center;
  gap: 22px;
}
.brand-group {
  width: fit-content;
}
.brand-logo {
  display: inline-flex;
  width: 82px;
  height: 82px;
  flex-shrink: 0;
}
.brand-logo :deep(svg) { width: 100%; height: 100%; display: block; }
.brand-text {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.brand-title {
  margin: 0;
  font-family: SourceHanSansCN-Medium, 'Microsoft YaHei', sans-serif;
  font-size: 56px;
  font-weight: 600;
  letter-spacing: 3px;
  line-height: 1;
  background: linear-gradient(90deg, #b98a12 0%, #7d9b76 90%);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  white-space: nowrap;
}
.brand-tag {
  display: inline-block;
  width: fit-content;
  padding: 4px 16px;
  border-radius: 14px;
  background: rgba($gold-soft, 0.55);
  border: 1px solid rgba($gold, 0.4);
  color: $gold-deep;
  font-size: 16px;
  letter-spacing: 2px;
  line-height: 1.4;
  font-family: SourceHanSansCN-Regular, 'Microsoft YaHei', sans-serif;
}
.brand-slogan {
  margin: 30px 0 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 14px;
  color: $ink;
  font-size: 20px;
  letter-spacing: 3px;
  line-height: 30px;
  font-family: SourceHanSansCN-Regular, 'Microsoft YaHei', sans-serif;

  /* 两侧各一根短金线，亮端都朝内，整体居中 */
  &::before,
  &::after {
    content: '';
    flex: none;
    width: 34px;
    height: 2px;
    border-radius: 2px;
  }
  &::before { background: linear-gradient(90deg, rgba($gold, 0), $gold); }
  &::after  { background: linear-gradient(90deg, $gold, rgba($gold, 0)); }
}

/* 功能图标行 */
.feature-row {
  margin-top: 52px;
  display: flex;
  align-items: flex-start;
  gap: 52px;
}
.feature-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 92px;
}
.feature-item:hover .feature-icon {
  border-color: rgba($gold, 0.6);
  box-shadow: 0 18px 34px rgba(150, 120, 60, 0.22), inset 0 1px 0 #fff;
  transform: translateY(-4px);
}
.feature-icon {
  display: inline-flex;
  width: 88px;
  height: 88px;
  align-items: center;
  justify-content: center;
  border-radius: 24px;
  background: linear-gradient(160deg, rgba(255, 255, 255, 0.95) 0%, rgba(255, 255, 255, 0.62) 100%);
  border: 1px solid rgba($gold, 0.3);
  box-shadow: 0 10px 24px rgba(150, 120, 60, 0.12), inset 0 1px 0 #fff;
  transition: border-color 0.22s, box-shadow 0.22s, transform 0.22s;
}
.feature-icon :deep(svg) {
  width: 52px;
  height: 52px;
  display: block;
}
.feature-label {
  margin-top: 14px;
  color: rgba($ink, 0.78);
  font-size: 15px;
  letter-spacing: 1px;
  line-height: 24px;
  font-family: SourceHanSansCN-Regular, 'Microsoft YaHei', sans-serif;
  white-space: nowrap;
}

/* 右侧登录面板 */
.login-panel {
  position: absolute;
  right: 216px;
  top: 216px;
  width: 452px;
  z-index: 2;
  animation: fade-up 0.7s 0.14s ease-out both;

  /* 背后错开 18px 的细描边框：卡片叠层感，比单张浮层更有厚度 */
  &::before {
    content: '';
    position: absolute;
    inset: 18px -18px -18px 18px;
    border: 1px solid rgba($gold, 0.22);
    border-radius: 26px;
    pointer-events: none;
  }
}
.panel-inner {
  position: relative;
  overflow: hidden;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.92) 0%, rgba(255, 253, 246, 0.88) 100%);
  border: 1px solid rgba($gold, 0.3);
  border-radius: 22px;
  padding: 46px 46px 30px;
  box-shadow: 0 24px 60px rgba(150, 120, 60, 0.18), 0 2px 8px rgba(150, 120, 60, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(6px);

  /* 顶部一道金色高光，让面板像被光打亮 */
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 12%;
    right: 12%;
    height: 2px;
    border-radius: 2px;
    background: linear-gradient(90deg, transparent, rgba($gold, 0.75), transparent);
  }

  /* 右下角一枚很淡的银杏水印，靠近才看得出，远看只是“有东西” */
  &::after {
    content: '';
    position: absolute;
    right: -30px;
    bottom: -44px;
    width: 188px;
    height: 188px;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Cg fill='none' stroke='%23c9971a' stroke-width='2.6' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M32 60 C32 42 20 25 7 20 C14 8 25 4 32 11 C39 4 50 8 57 20 C44 25 32 42 32 60 Z' fill='%23f4e3b8' fill-opacity='0.4'/%3E%3Cpath d='M32 24 V58'/%3E%3Cpath d='M22 24 C26 26 29 27 32 28'/%3E%3Cpath d='M42 24 C38 26 35 27 32 28'/%3E%3C/g%3E%3C/svg%3E");
    background-size: contain;
    background-repeat: no-repeat;
    opacity: 0.07;
    transform: rotate(-10deg);
    pointer-events: none;
  }
}
.panel-header {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  margin-bottom: 34px;
}
.panel-heading {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
}
.panel-title {
  color: $ink;
  font-size: 25px;
  font-weight: 500;
  letter-spacing: 2px;
  line-height: 1.2;
  font-family: SourceHanSansCN-Medium, 'Microsoft YaHei', sans-serif;
  white-space: nowrap;
}
.panel-subtitle {
  color: rgba($gold, 0.85);
  font-size: 11px;
  letter-spacing: 4px;
  line-height: 1;
  font-family: 'Helvetica Neue', Arial, sans-serif;
  /* 最后一个字母后面也带了字间距，向左提正好视觉居中 */
  text-indent: 4px;
}
.header-line {
  width: 56px;
  height: 2px;
  border-radius: 2px;
  background: linear-gradient(90deg, transparent, rgba($gold, 0.85));

  /* 右侧那条反向，两道光的亮端都朝标题收拢 */
  &:last-child {
    background: linear-gradient(90deg, rgba($gold, 0.85), transparent);
  }
}

.login-form {
  display: flex;
  flex-direction: column;

  :deep(.el-form-item) {
    margin-bottom: 24px;
  }
  :deep(.el-form-item__error) {
    padding-top: 4px;
  }
}

.input-box {
  display: flex;
  align-items: center;
  width: 100%;
  height: 50px;
  padding: 0 14px;
  box-sizing: border-box;
  background: rgba(#f6f2e7, 0.85);
  border: 1px solid rgba($gold, 0.35);
  border-radius: 12px;
  transition: border-color 0.2s, box-shadow 0.2s, background 0.2s;

  &:hover {
    border-color: rgba($gold, 0.55);
  }

  &:focus-within {
    background: rgba(255, 255, 255, 0.9);
    border-color: $gold;
    box-shadow: 0 0 0 3px rgba($gold, 0.15);
  }
}
.field-icon {
  display: inline-flex;
  width: 24px;
  height: 24px;
  flex-shrink: 0;
  margin-right: 12px;
}
.field-icon :deep(svg) { width: 100%; height: 100%; display: block; }
/* 聚焦时图标跟随高亮：只挑带 stroke 属性的图形，不误伤图里纯填充的小圆点 */
.input-box:focus-within .field-icon :deep(svg [stroke]) { stroke: $gold; }

.input-box :deep(.el-input) {
  flex: 1;
}
.input-box :deep(.el-input__wrapper) {
  background: transparent;
  border: 0;
  box-shadow: none !important;
  padding: 0;
}
.input-box :deep(.el-input__inner) {
  color: $ink;
  font-size: 17px;
  letter-spacing: 0.4px;
  font-family: SourceHanSansCN-Regular, 'Microsoft YaHei', sans-serif;
}
.input-box :deep(.el-input__inner::placeholder) {
  color: rgba(120, 108, 88, 0.5);
}

.eye-btn {
  border: 0;
  background: transparent;
  color: rgba($ink, 0.5);
  cursor: pointer;
  padding: 0;
  display: flex;
  align-items: center;
}

.captcha-row {
  display: flex;
  gap: 12px;
  width: 100%;
}
.captcha-input {
  width: calc(100% - 145px);
  flex: none;
}
/* 后端 captchaProducerMath 固定输出 160x60 的 JPEG，盒子按同比例取 133x50，
   否则 object-fit: cover 会把算术式左右各裁掉几像素（首尾数字看不清） */
.captcha-box {
  position: relative;
  box-sizing: border-box;
  width: 133px;
  height: 50px;
  flex-shrink: 0;
  border: 1px solid rgba($gold, 0.35);
  border-radius: 12px;
  background: #fff;
  overflow: hidden;
  cursor: pointer;
}
/* 边框和圆角都放到外层盒子上，img 自己再带一圈边框会被父级圆角裁得断角 */
.captcha-img {
  width: 100%;
  height: 100%;
  border: 0;
  background: #fff;
  cursor: pointer;
  object-fit: cover;
  display: block;
}
/* 遮罩平时隐藏，hover 浮现“点击刷新”，避免整个验证码区看不出可点 */
.captcha-mask {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  letter-spacing: 1px;
  color: #fff;
  background: rgba(90, 74, 50, 0.55);
  opacity: 0;
  cursor: pointer;
  transition: opacity 0.2s;
}
.captcha-box:hover .captcha-mask { opacity: 1; }
/* 占位态：等图（加载中）与图没回来（点击重试）共用一套定位 */
.captcha-state {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  font-size: 12px;
  line-height: 1.4;
  text-align: center;
  color: rgba($ink, 0.55);
  background: rgba(255, 255, 255, 0.7);
  cursor: pointer;
}
.captcha-state.is-error {
  color: $gold-deep;
  background: rgba($gold-soft, 0.5);
}

.login-btn {
  position: relative;
  overflow: hidden;
  width: 100%;
  height: 52px;
  margin-top: 14px;
  border: 0;
  border-radius: 14px;
  color: #fff;
  font-size: 18px;
  font-weight: 500;
  letter-spacing: 4px;
  font-family: SourceHanSansCN-Medium, 'Microsoft YaHei', sans-serif;
  background-image: linear-gradient(120deg, #d9a72a 0%, #c08a14 55%, #7d9b76 130%);
  box-shadow: 0 10px 24px rgba($gold, 0.28);
  transition: box-shadow 0.2s, transform 0.2s;

  /* 一道缓慢掠过的高光，提示这是可点击的主操作 */
  &::after {
    content: '';
    position: absolute;
    top: 0;
    left: -60%;
    width: 36%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.35), transparent);
    transform: skewX(-18deg);
    animation: btn-shine 3.6s ease-in-out infinite;
  }

  &:hover,
  &:focus {
    color: #fff;
    background-image: linear-gradient(120deg, #e0b23a 0%, #cf9518 55%, #8aa583 130%);
    box-shadow: 0 14px 30px rgba($gold, 0.36);
    transform: translateY(-1px);
  }

  &:active {
    transform: translateY(1px);
    box-shadow: 0 6px 16px rgba($gold, 0.24);
  }
}

@keyframes btn-shine {
  0%, 52% { left: -60%; opacity: 0; }
  60%     { opacity: 0.9; }
  100%    { left: 130%; opacity: 0; }
}

@keyframes fade-up {
  from { opacity: 0; transform: translateY(18px); }
  to   { opacity: 1; transform: translateY(0); }
}

.panel-foot {
  margin: 24px 0 0;
  text-align: center;
  color: rgba($ink, 0.6);
  font-size: 13px;
  letter-spacing: 1px;
  font-family: SourceHanSansCN-Regular, 'Microsoft YaHei', sans-serif;
}

.page-copyright {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 42px;
  margin: 0;
  text-align: center;
  color: rgba($ink, 0.4);
  font-size: 15px;
  letter-spacing: 1.5px;
  font-family: SourceHanSansCN-Regular, 'Microsoft YaHei', sans-serif;
}

/* 系统开启“减弱动态效果”时，漂浮、扫光、入场全部关掉 */
@media (prefers-reduced-motion: reduce) {
  .ginkgo-leaf,
  .glow,
  .left-region,
  .login-panel {
    animation: none !important;
  }
  .login-btn::after {
    display: none;
  }
}
</style>
