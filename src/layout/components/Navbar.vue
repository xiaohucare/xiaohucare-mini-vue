<template>
  <div class="navbar">
    <!-- 左区：TopNav 且有二级侧栏时宽度固定为侧栏宽(210/54px)，使一级菜单左边缘与 app-main 内容区对齐 -->
    <div class="navbar-left" :class="{ 'nav-left-docked': topNavSideShow, 'nav-left-mini': topNavSideShow && !appStore.sidebar.opened }">
      <!-- Logo区域 -->
      <div class="logo-container" v-if="settingsStore.topNav">
        <router-link to="/" class="logo-link">
          <img :src="logo" class="navbar-logo" />
          
          <span class="navbar-title">{{ title }}</span>
        </router-link>
      </div>
      
      <!-- 侧栏隐藏（如 TopNav 下当前一级菜单无二级导航）时不渲染折叠按钮：toggleSideBar 在 hide 时无效，避免死按钮 -->
      <hamburger v-if="!appStore.sidebar.hide" id="hamburger-container" :is-active="appStore.sidebar.opened" class="hamburger-container" @toggleClick="toggleSideBar" />
      <breadcrumb v-if="!settingsStore.topNav" id="breadcrumb-container" class="breadcrumb-container" />
    
    </div>
    <top-nav v-if="settingsStore.topNav" id="topmenu-container" class="topmenu-container" />

    <div class="right-menu" style="line-height: 50px;align-items: center !important;">
      <template v-if="appStore.device !== 'mobile'">
         <message-center v-if="showMsgCenter" />
        <header-search id="header-search" class="right-menu-item" />

        <screenfull id="screenfull" class="right-menu-item hover-effect" />
       

        <el-tooltip :content="t('navbar.layoutSize')" effect="dark" placement="bottom">
          <size-select id="size-select" class="right-menu-item hover-effect" />
        </el-tooltip>


      </template>

      <el-dropdown @command="handleCommand" class="avatar-container right-menu-item hover-effect" trigger="hover">
        <div class="avatar-wrapper">
          <img :src="userStore.avatar" class="user-avatar" />
          <span class="user-nickname"> {{ userStore.nickName }} </span>
        </div>
        <template #dropdown>
          <el-dropdown-menu>
            <router-link to="/user/profile">
              <el-dropdown-item>{{ t('navbar.personalCenter') }}</el-dropdown-item>
            </router-link>
            <a :href="router.resolve('/index').href" target="_blank" rel="noopener">
              <el-dropdown-item>官网首页</el-dropdown-item>
            </a>
            <el-dropdown-item command="setLayout" v-if="settingsStore.showSettings">
                <span>{{ t('navbar.layoutSettings') }}</span>
              </el-dropdown-item>
            <el-dropdown-item divided command="logout">
              <span>{{ t('navbar.logout') }}</span>
            </el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </div>
  </div>
</template>

<script setup>
import { ElMessageBox } from 'element-plus'
import { useRouter } from 'vue-router'
import Breadcrumb from '@/components/Breadcrumb'
import TopNav from '@/components/TopNav'
import Hamburger from '@/components/Hamburger'
import Screenfull from '@/components/Screenfull'
import SizeSelect from '@/components/SizeSelect'
import HeaderSearch from '@/components/HeaderSearch'
import RuoYiGit from '@/components/RuoYi/Git'
import RuoYiDoc from '@/components/RuoYi/Doc'
import MessageCenter from '@/layout/components/MessageCenter'
import logo from '@/assets/logo/logo.png'
import useAppStore from '@/store/modules/app'
import useUserStore from '@/store/modules/user'
import useSettingsStore from '@/store/modules/settings'
import { checkPermi } from '@/utils/permission'
import { computed } from 'vue'
import { useLanguage } from '@/composables/useI18n'

const title = import.meta.env.VITE_APP_TITLE
const { currentLanguage, switchLanguage, t } = useLanguage()

const appStore = useAppStore()
const userStore = useUserStore()
const settingsStore = useSettingsStore()

// 顶栏菜单与内容区对齐：TopNav 且二级侧栏可见（非移动端）时，左区宽度钉为侧栏宽，
// 一级菜单恰好从 210px(展开)/54px(迷你) 开始，与 app-main 的 margin-left 一致
const topNavSideShow = computed(() => settingsStore.topNav && !appStore.sidebar.hide && appStore.device !== 'mobile')

// 消息中心入口权限：拥有门店消息列表权限（或超管 *:*:*）才显示铃铛
const showMsgCenter = computed(() => checkPermi(['care:storemessage:list']))

// 语言切换相关
const currentLanguageLabel = computed(() => {
  return t('navbar.switchToEnglish')
})

function toggleSideBar() {
  appStore.toggleSideBar()
}

function handleCommand(command) {
  switch (command) {
    case "setLayout":
      setLayout()
      break
    case "logout":
      logout()
      break
    default:
      break
  }
}

function logout() {
  ElMessageBox.confirm(t('navbar.logoutConfirm'), t('navbar.logoutTitle'), {
    confirmButtonText: t('navbar.confirmBtn'),
    cancelButtonText: t('navbar.cancelBtn'),
    type: 'warning'
  }).then(() => {
    userStore.logOut().then(() => {
      // 绝对路径跳登录页并携带当前真实路由，避免相对跳转 'index'
      // 在 /e_living/livingIndex 等深层路径下被解析成 /e_living/index，
      // 把不存在的路径塞进 redirect 导致重新登录后 404 找不到页面
      const redirect = encodeURIComponent(router.currentRoute.value.fullPath)
      location.href = `${import.meta.env.BASE_URL}login?redirect=${redirect}`
    })
  }).catch(() => { })
}

const emits = defineEmits(['setLayout'])
function setLayout() {
  emits('setLayout')
}

function toggleLanguage() {
  const newLocale = currentLanguage.value === 'zh' ? 'en' : 'zh'
  switchLanguage(newLocale)
  console.log('切换语言到:', newLocale === 'zh' ? '中文' : 'English')
}
// function toggleTheme() {
//   settingsStore.toggleTheme()
// }
const router = useRouter()

function toShowIconTap(){
  router.push("showIcon")
}

function toShowWebSiteTap(){
   router.push("/website")
}

</script>

<style lang='scss' scoped>
@use "@/assets/styles/variables.module.scss" as vars;

.navbar-left {
  display: flex;
  align-items: center;
  flex-shrink: 0;
  min-width: 0;

  /* 二级侧栏可见：左区总宽=侧栏宽，logo 过长省略，汉堡靠右补齐到 210px 边界 */
  &.nav-left-docked {
    width: vars.$base-sidebar-width;
    box-sizing: border-box;

    .logo-container {
      flex-shrink: 1;
      min-width: 0;
      overflow: hidden;

      .logo-link .navbar-title {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
    }

    .hamburger-container {
      margin-left: auto;
    }
  }

  /* 迷你侧栏(54px)时左区同步收缩并隐藏 logo，与下方迷你栏对齐；声明在后优先于 docked */
  &.nav-left-mini {
    width: 54px;

    .logo-container {
      display: none;
    }
  }
}

/* 对齐时去掉菜单区自身左边距，保证左边缘精确落在侧栏宽度处 */
.navbar-left.nav-left-docked + .topmenu-container {
  margin-left: 0;
}

.navbar {
  height: 50px;
  overflow: hidden;
  position: relative;
  background: var(--navbar-bg);
  box-shadow: 0 1px 4px rgba(0, 21, 41, 0.08);
  /* flex 横向布局：logo、汉堡、菜单区、right-menu 同行排列，避免块级元素折行 */
  display: flex;
  align-items: center;

  .logo-container {
    height: 100%;
    display: flex;
    align-items: center;
    flex-shrink: 0;
    padding: 0 15px;
    border-right: 1px solid #e6e6e6;
    
    .logo-link {
      display: flex;
      align-items: center;
      text-decoration: none;
      color: inherit;
      
      .navbar-logo {
        width: 28px;
        height: 28px;
        margin-right: 8px;
      }
      
      .navbar-title {
        font-size: 16px;
        font-weight: 600;
        color: #333;
      }
    }
  }

  .hamburger-container {
    line-height: 46px;
    height: 100%;
    flex-shrink: 0;
    cursor: pointer;
    transition: background 0.3s;
    -webkit-tap-highlight-color: transparent;
    margin-left: 10px;

    &:hover {
      background: rgba(0, 0, 0, 0.025);
    }
  }

  .breadcrumb-container {
    flex-shrink: 0;
    min-width: 0;
  }

  .topmenu-container {
    flex: 1;
    /* min-width:0 允许 flex 子项收缩，防止菜单项过多时撑破一行 */
    min-width: 0;
    overflow: hidden;
    margin-left: 10px;
  }

  .errLog-container {
    display: inline-block;
    vertical-align: top;
  }

  .right-menu {
    /* flex 布局下 float 失效，用 margin-left:auto 靠右 */
    margin-left: auto;
    flex-shrink: 0;
    height: 100%;
    line-height: 50px;
    display: flex;

    &:focus {
      outline: none;
    }

    .right-menu-item {
      display: inline-block;
      padding: 0 8px;
      height: 100%;
      font-size: 18px;
      color: #5a5e66;
      vertical-align: text-bottom;

      &.hover-effect {
        cursor: pointer;
        transition: background 0.3s;

        &:hover {
          background: rgba(0, 0, 0, 0.025);
        }
      }

      &.theme-switch-wrapper, &.language-switch-wrapper {
        display: flex;
        align-items: center;
        gap: 4px;

        svg {
          transition: transform 0.3s;
          
          &:hover {
            transform: scale(1.15);
          }
        }

        .language-text {
          font-size: 12px;
          font-weight: bold;
          color: #5a5e66;
        }
      }
    }

    .avatar-container {
      margin-right: 0px;
      padding-right: 0px;

      .avatar-wrapper {
        margin-top: 10px;
        right: 8px;
        position: relative;

        .user-avatar {
          cursor: pointer;
          width: 30px;
          height: 30px;
          margin-right: 8px;
          border-radius: 50%;
        }

        .user-nickname{
          position: relative;
          left: 0px;
          bottom: 10px;
          font-size: 14px;
          font-weight: bold;
        }

        i {
          cursor: pointer;
          position: absolute;
          right: -20px;
          top: 25px;
          font-size: 12px;
        }
      }
    }
  }
}
</style>
