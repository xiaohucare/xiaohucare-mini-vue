<template>
  <div :class="classObj" class="app-wrapper" :style="{ '--current-color': theme }">
    <div v-if="device === 'mobile' && sidebar.opened" class="drawer-bg" @click="handleClickOutside"/>
    <!-- TopNav 模式：侧栏紧贴 navbar 底部（top 50px），不随 tags-view 下移（页签内容已左缩进让出侧栏列，无重叠）；普通模式下仍为通高左侧栏 -->
    <sidebar v-if="!sidebar.hide" class="sidebar-container" :class="{ 'sidebar-below-nav': settingsStore.topNav }" />
    <!-- TopNav 模式下顶栏始终整宽且不动：sidebarHide(宽度铺满)与是否有二级侧栏无关，二级栏仅偏移 app-main -->
    <div :class="{ hasTagsView: needTagsView, sidebarHide: sidebar.hide || settingsStore.topNav }" class="main-container">
      <div :class="{ 'fixed-header': fixedHeader }">
        <navbar @setLayout="setLayout" />
        <tags-view v-if="needTagsView" />
      </div>
      <app-main />
      <settings ref="settingRef" />
    </div>
  </div>
</template>

<script setup>
import { useWindowSize } from '@vueuse/core'
import Sidebar from './components/Sidebar/index.vue'
import { AppMain, Navbar, Settings, TagsView } from './components'
import useAppStore from '@/store/modules/app'
import useSettingsStore from '@/store/modules/settings'

const settingsStore = useSettingsStore()
const theme = computed(() => settingsStore.theme)
const sideTheme = computed(() => settingsStore.sideTheme)
const sidebar = computed(() => useAppStore().sidebar)
const device = computed(() => useAppStore().device)
const needTagsView = computed(() => settingsStore.tagsView)
// 开启 TopNav 时强制顶栏吸顶固定（不随页面滚动），与「固定 Header」开关无关
const fixedHeader = computed(() => settingsStore.fixedHeader || settingsStore.topNav)

const classObj = computed(() => ({
  hideSidebar: !sidebar.value.opened,
  openSidebar: sidebar.value.opened,
  withoutAnimation: sidebar.value.withoutAnimation,
  mobile: device.value === 'mobile',
  // TopNav 且二级侧栏可见（非移动端）时，内容区需为悬挂侧栏让出左侧宽度
  topNavSideShow: settingsStore.topNav && !sidebar.value.hide && device.value !== 'mobile'
}))

const { width, height } = useWindowSize()
const WIDTH = 992 // refer to Bootstrap's responsive design

watch(() => device.value, () => {
  if (device.value === 'mobile' && sidebar.value.opened) {
    useAppStore().closeSideBar({ withoutAnimation: false })
  }
})

watchEffect(() => {
  if (width.value - 1 < WIDTH) {
    useAppStore().toggleDevice('mobile')
    useAppStore().closeSideBar({ withoutAnimation: true })
  } else {
    useAppStore().toggleDevice('desktop')
  }
})

function handleClickOutside() {
  useAppStore().closeSideBar({ withoutAnimation: false })
}

const settingRef = ref(null)
function setLayout() {
  settingRef.value.openSetting()
}

// 顶部菜单模式下的侧边栏显隐完全交由 TopNav 根据当前一级菜单是否存在二级导航动态计算：
// 有二级导航 -> sidebar.hide=false 显示二级菜单；无二级导航(含首页 /index) -> sidebar.hide=true 隐藏并铺满主区
// 此处不再强制 toggleSideBarHide(false)，否则会在无二级导航时渲染出空白侧栏
</script>

<style lang="scss" scoped>
@use "@/assets/styles/mixin.scss" as mix;
@use "@/assets/styles/variables.module.scss" as vars;

.app-wrapper {
  @include mix.clearfix;
  position: relative;
  height: 100%;
  width: 100%;

  &.mobile.openSidebar {
    position: fixed;
    top: 0;
  }
}

.main-container:has(.fixed-header) {
  height: 100vh;
  overflow: hidden;
}

.drawer-bg {
  background: #000;
  opacity: 0.3;
  width: 100%;
  top: 0;
  height: 100%;
  position: absolute;
  z-index: 999;
}

.fixed-header {
  position: fixed;
  top: 0;
  right: 0;
  z-index: 9;
  width: calc(100% - #{vars.$base-sidebar-width});
  transition: width 0.28s;
}

.hideSidebar .fixed-header {
  width: calc(100% - 54px);
}

.sidebarHide .fixed-header {
  width: 100%;
}

.mobile .fixed-header {
  width: 100%;
}

/* TopNav 模式：侧栏顶到 navbar 正下方（50px），高度相应缩减；
   页签栏虽有 50~84px 区域但内容已按 topNavSideShow 左缩进，侧栏列不会被页签占用，无需下移到 84px */
.sidebar-below-nav {
  top: 50px !important;
  height: calc(100% - 50px) !important;
}

/* 二级侧栏可见时只平移内容区，顶栏不受影响；同时收缩宽度避免 100%+margin 横向溢出 */
.app-wrapper.topNavSideShow :deep(.app-main) {
  margin-left: vars.$base-sidebar-width;
  width: calc(100% - #{vars.$base-sidebar-width});
  transition: margin-left .28s, width .28s;
}

.app-wrapper.topNavSideShow.hideSidebar :deep(.app-main) {
  margin-left: 54px;
  width: calc(100% - 54px);
}

/* 页签栏与 app-main 左对齐：用等宽左内边距缩进（迷你态 54px），背景仍整宽不断色 */
.app-wrapper.topNavSideShow :deep(.tags-view-container) {
  padding-left: vars.$base-sidebar-width;
  box-sizing: border-box;
  transition: padding-left .28s;
}

.app-wrapper.topNavSideShow.hideSidebar :deep(.tags-view-container) {
  padding-left: 54px;
}

/* 顶部菜单模式下的样式调整 */
:deep(.main-container) {
  &.sidebarHide {
    margin-left: 0;
  }
}

/* 顶部菜单模式下的左侧边栏样式调整 */
:deep(.sidebar-container) {
  &.sidebarHide {
    display: none;
  }
  
  &:not(.sidebarHide) {
    display: block;
  }
}
</style>