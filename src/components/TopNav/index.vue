<template>
  <el-menu
    :default-active="activeMenu"
    mode="horizontal"
    @select="handleSelect"
    :ellipsis="false"
  >
    <template v-for="(item, index) in topMenus">
      <el-menu-item :style="{'--theme': theme}" :index="item.path" :key="index" v-if="index < visibleNumber">
        <svg-icon
        v-if="item.meta && item.meta.icon && item.meta.icon !== '#'"
        :icon-class="item.meta.icon"/>
        {{ item.meta.title }}
      </el-menu-item>
    </template>

    <!-- 顶部菜单超出数量折叠 -->
    <el-sub-menu :style="{'--theme': theme}" index="more" v-if="topMenus.length > visibleNumber">
      <template #title>更多菜单</template>
      <template v-for="(item, index) in topMenus">
        <el-menu-item
          :index="item.path"
          :key="index"
          v-if="index >= visibleNumber">
        <svg-icon
          v-if="item.meta && item.meta.icon && item.meta.icon !== '#'"
          :icon-class="item.meta.icon"/>
        {{ item.meta.title }}
        </el-menu-item>
      </template>
    </el-sub-menu>
  </el-menu>
</template>

<script setup>
import { constantRoutes } from "@/router"
import { isHttp } from '@/utils/validate'
import useAppStore from '@/store/modules/app'
import useSettingsStore from '@/store/modules/settings'
import usePermissionStore from '@/store/modules/permission'

// 顶部栏初始数
const visibleNumber = ref(null)
// 当前激活菜单的 index
const currentIndex = ref(null)
// 隐藏侧边栏路由
const hideList = ['/index', '/user/profile']

const appStore = useAppStore()
const settingsStore = useSettingsStore()
const permissionStore = usePermissionStore()
const route = useRoute()
const router = useRouter()

// 主题颜色
const theme = computed(() => settingsStore.theme)
// 所有的路由信息
const routers = computed(() => permissionStore.topbarRouters)

// 顶部显示菜单
const topMenus = computed(() => {
  let topMenus = []
  routers.value.map((menu) => {
    if (menu.hidden !== true) {
      // 兼容顶部栏一级菜单内部跳转
      if (menu.path === '/' && menu.children) {
          topMenus.push(menu.children[0])
      } else {
          topMenus.push(menu)
      }
    }
  })
  return topMenus
})

// 设置子路由
const childrenMenus = computed(() => {
  let childrenMenus = []
  routers.value.map((router) => {
    for (let item in router.children) {
      if (router.children[item].parentPath === undefined) {
        if(router.path === "/") {
          router.children[item].path = "/" + router.children[item].path
        } else {
          if(!isHttp(router.children[item].path)) {
            router.children[item].path = router.path + "/" + router.children[item].path
          }
        }
        router.children[item].parentPath = router.path
      }
      childrenMenus.push(router.children[item])
    }
  })
  return constantRoutes.concat(childrenMenus)
})

// 默认激活的菜单
const activeMenu = computed(() => {
  const path = route.path
  let activePath = path
  if (path !== undefined && path.lastIndexOf("/") > 0 && hideList.indexOf(path) === -1) {
    const tmpPath = path.substring(1, path.length)
    if (!route.meta.link) {
      activePath = "/" + tmpPath.substring(0, tmpPath.indexOf("/"))
      appStore.toggleSideBarHide(false)
    }
  } else if(!route.children) {
    activePath = path
    appStore.toggleSideBarHide(true)
  }
  activeRoutes(activePath)
  return activePath
})

function setVisibleNumber() {
  const width = document.body.getBoundingClientRect().width / 2.5
  visibleNumber.value = parseInt(width / 85)
}

/** 查找一级菜单下第一个“可打开内容”的叶子菜单：
 * 递归跳过 hidden 隐藏项与无可见子项的空目录，叶子需持有 component 才算可打开；返回 { menu, fullPath }。
 * 注意：childrenMenus 计算属性已将一级子项 path 原地改写为带父前缀的绝对路径（如 /eyang/appointment），
 * 此类路径直接使用，否则与父路径重复拼接会得到 /eyang/eyang/appointment */
function findFirstLeaf(menu, parentPath = '') {
  const rawPath = String(menu.path || '')
  let fullPath
  if (isHttp(rawPath)) {
    fullPath = rawPath
  } else if (rawPath.startsWith('/')) {
    // 已是绝对路径（被 childrenMenus 补过父前缀或本身为顶层路径），不重复拼接
    fullPath = rawPath
  } else {
    fullPath = `${(parentPath || '').replace(/\/+$/, '')}/${rawPath}`
  }
  if (menu.children && menu.children.length > 0) {
    for (const child of menu.children) {
      if (child.hidden === true) continue
      const leaf = findFirstLeaf(child, fullPath)
      if (leaf) return leaf
    }
    return null
  }
  return menu.component ? { menu, fullPath } : null
}

function handleSelect(key, keyPath) {
  currentIndex.value = key
  const route = routers.value.find(item => item.path === key)
  if (isHttp(key)) {
    // http(s):// 路径新窗口打开
    window.open(key, "_blank")
  } else if (!route || !route.children) {
    // 没有子路由路径内部打开
    const routeMenu = childrenMenus.value.find(item => item.path === key)
    if (routeMenu && routeMenu.query) {
      let query = JSON.parse(routeMenu.query)
      router.push({ path: key, query: query })
    } else {
      router.push({ path: key })
    }
    appStore.toggleSideBarHide(true)
  } else {
    // 显示左侧联动菜单
    activeRoutes(key)
    appStore.toggleSideBarHide(false)
    // 存在二级菜单时，默认打开第一个可打开内容的菜单；重复点击当前页的 NavigationDuplicated 由 catch 容错
    const leaf = findFirstLeaf(route)
    if (leaf) {
      let query
      if (leaf.menu.query) {
        try { query = JSON.parse(leaf.menu.query) } catch (e) { query = undefined }
      }
      router.push(query ? { path: leaf.fullPath, query } : { path: leaf.fullPath }).catch(() => {})
    }
  }
}

function activeRoutes(key) {
  let routes = []
  if (childrenMenus.value && childrenMenus.value.length > 0) {
    childrenMenus.value.map((item) => {
      if (key == item.parentPath || (key == "index" && "" == item.path)) {
        routes.push(item)
      }
    })
  }
  if(routes.length > 0) {
    permissionStore.setSidebarRouters(routes)
    // 同步当前一级菜单标题：点击切换一级分类时侧栏顶部标题立即更新，无需等待路由跳转
    const hit = topMenus.value.find(item => item.path === key)
    permissionStore.setSidebarTopTitle((hit && hit.meta && hit.meta.title) || '')
  } else {
    appStore.toggleSideBarHide(true)
    permissionStore.setSidebarTopTitle('')
  }
  return routes
}

onMounted(() => {
  window.addEventListener('resize', setVisibleNumber)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', setVisibleNumber)
})

onMounted(() => {
  setVisibleNumber()
  // 不在首页 /index 强制展示某个一级菜单的二级导航：
  // activeMenu 计算属性已按当前路由自动推导侧栏显隐，首页等无二级导航的场景应保持隐藏
})
</script>

<style lang="scss">
.topmenu-container.el-menu--horizontal > .el-menu-item {
  height: 65px !important;
  line-height: 65px !important;
  color: #999093 !important;
  padding: 0 5px !important;
  margin: 0 10px !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;

  --el-menu-horizontal-height: 50px !important;
}

/* 让折叠的「更多菜单」与普通菜单项对齐：同样的 50px 盒模型，内容垂直居中，底边框处于同一基线 */
.topmenu-container.el-menu--horizontal > .el-sub-menu {
  height: 65px !important;
  display: flex !important;
  align-items: center !important;
}

.topmenu-container.el-menu--horizontal > .el-menu-item.is-active, .el-menu--horizontal > .el-sub-menu.is-active .el-sub-menu__title {
  border-bottom: 2px solid #{'var(--theme)'} !important;
  color: #303133;
}

/* sub-menu item */
.topmenu-container.el-menu--horizontal > .el-sub-menu .el-sub-menu__title {
  height: 50px !important;
  line-height: 50px !important;
  color: #999093 !important;
  padding: 0 5px !important;
  margin: 0 10px !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  border-bottom: none !important;
}

/* 背景色隐藏 */
.topmenu-container.el-menu--horizontal>.el-menu-item:not(.is-disabled):focus, .topmenu-container.el-menu--horizontal>.el-menu-item:not(.is-disabled):hover, .topmenu-container.el-menu--horizontal>.el-submenu .el-submenu__title:hover {
  background-color: #ffffff;
}

/* 图标右间距 */
.topmenu-container .svg-icon {
  margin-right: 4px;
  display: flex !important;
  align-items: center !important;
}

/* 确保所有菜单项内容垂直居中 */
.topmenu-container .el-menu-item,
.topmenu-container .el-sub-menu__title {
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
}

/* topmenu more arrow */
.topmenu-container .el-sub-menu .el-sub-menu__icon-arrow {
  position: static;
  vertical-align: middle;
  margin-left: 8px;
  margin-top: 0px;
}


</style>
