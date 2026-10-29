<template>
  <div :class="{ 'has-logo': showLogo || showTopTitle }" class="sidebar-container">
    <logo v-if="showLogo" :collapse="isCollapse" />
    <!-- TopNav 模式：顶部展示当前一级菜单名，下方为对应的二级目录；折叠时只显示首字 -->
    <div v-else-if="showTopTitle" class="sidebar-top-title" :title="activeTopTitle">
      <span class="title-text">{{ isCollapse ? activeTopTitle.charAt(0) : activeTopTitle }}</span>
    </div>
    <el-scrollbar wrap-class="scrollbar-wrapper">
      <el-menu
        :default-active="activeMenu"
        :collapse="isCollapse"
        :background-color="getMenuBackground"
        :text-color="getMenuTextColor"
        :unique-opened="true"
        :active-text-color="theme"
        :collapse-transition="false"
        mode="vertical"
        :class="sideTheme"
      >
        <sidebar-item
          v-for="(route, index) in sidebarRouters"
          :key="route.path + index"
          :item="route"
          :base-path="route.path"
        />
      </el-menu>
    </el-scrollbar>
  </div>
</template>

<script setup>
import Logo from './Logo'
import SidebarItem from './SidebarItem'
import variables from '@/assets/styles/variables.module.scss'
import useAppStore from '@/store/modules/app'
import useSettingsStore from '@/store/modules/settings'
import usePermissionStore from '@/store/modules/permission'

const route = useRoute()
const appStore = useAppStore()
const settingsStore = useSettingsStore()
const permissionStore = usePermissionStore()

const sidebarRouters = computed(() => permissionStore.sidebarRouters)
// TopNav 模式下 logo 由 Navbar 顶部统一展示，侧栏只承载二级导航，避免两个 logo 同时出现
const showLogo = computed(() => settingsStore.sidebarLogo && !settingsStore.topNav)
const sideTheme = computed(() => settingsStore.sideTheme)
const theme = computed(() => settingsStore.theme)
const isCollapse = computed(() => !appStore.sidebar.opened)

// 获取菜单背景色
const getMenuBackground = computed(() => {
  if (settingsStore.isDark) {
    return 'var(--sidebar-bg)'
  }
  return sideTheme.value === 'theme-dark' ? variables.menuBg : variables.menuLightBg
})

// 获取菜单文字颜色
const getMenuTextColor = computed(() => {
  if (settingsStore.isDark) {
    return 'var(--sidebar-text)'
  }
  return sideTheme.value === 'theme-dark' ? variables.menuText : variables.menuLightText
})

const activeMenu = computed(() => {
  const { meta, path } = route
  if (meta.activeMenu) {
    return meta.activeMenu
  }
  return path
})

// TopNav 模式下的一级菜单名直接读 permission store：
// 由 TopNav.activeRoutes 在点击一级菜单/路由变化推导时同步写入，点击切换分类时标题即时更新（不依赖路由跳转）
const activeTopTitle = computed(() => settingsStore.topNav ? (permissionStore.sidebarTopTitle || '') : '')
const showTopTitle = computed(() => settingsStore.topNav && activeTopTitle.value !== '')
</script>

<style lang="scss" scoped>
.sidebar-container {
  background-color: v-bind(getMenuBackground);

  /* TopNav 模式下侧栏顶部的一级菜单名 */
  .sidebar-top-title {
    height: 50px;
    line-height: 50px;
    padding: 0 15px;
    text-align: center;
    font-size: 15px;
    font-weight: 600;
    color: v-bind(getMenuTextColor);
    border-bottom: 1px solid rgba(128, 128, 128, 0.15);
    overflow: hidden;

    .title-text {
      text-overflow: ellipsis;
      text-align: left;
      display: block;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
  }
  
  .scrollbar-wrapper {
    background-color: v-bind(getMenuBackground);
  }

  .el-menu {
    border: none;
    height: 100%;
    width: 100% !important;
    
    .el-menu-item, .el-sub-menu__title {
      &:hover {
        background-color: var(--menu-hover, rgba(0, 0, 0, 0.06)) !important;
      }
    }

    .el-menu-item {
      color: v-bind(getMenuTextColor);
      
      &.is-active {
        color: var(--menu-active-text, #409eff);
        background-color: var(--menu-hover, rgba(0, 0, 0, 0.06)) !important;
      }
    }

    .el-sub-menu__title {
      color: v-bind(getMenuTextColor);
    }
  }
}
</style>
