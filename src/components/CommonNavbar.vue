<template>
  <header class="common-navbar" :class="{ 'scrolled': isScrolled, 'light': variant === 'light' }">
    <div class="nav-container">
      <div class="nav-logo" @click="goHome">
        <span class="logo-icon">
          <svg-icon icon-class="ginkgo" class="leaf-icon" style="font-size: 30px" />
        </span>
        <span class="logo-text">小护康养 mini 版</span>
      </div>
      
      <nav class="nav-menu" :class="{ 'mobile-open': mobileMenuOpen }">
        <router-link to="/website" class="nav-link" active-class="active" @click="closeMobileMenu">
          <span class="link-text">首页</span>
          <span class="link-line"></span>
        </router-link>
        <a href="/website#product" class="nav-link" @click="handleAnchorClick($event, 'product')">
          <span class="link-text">产品</span>
          <span class="link-line"></span>
        </a>
        <a href="/website#contact" class="nav-link" @click="handleAnchorClick($event, 'contact')">
          <span class="link-text">联系我们</span>
          <span class="link-line"></span>
        </a>
      </nav>
      
      <div class="nav-actions">
        <el-button 
          class="login-btn"
          :type="variant === 'light' ? 'primary' : 'default'" 
          round 
          @click="goToAdmin"
        >
          <el-icon><Monitor /></el-icon>
          <span class="btn-text">后台登录</span>
        </el-button>
        <el-button 
          class="mobile-toggle" 
          :class="{ 'is-active': mobileMenuOpen }"
          @click="mobileMenuOpen = !mobileMenuOpen"
        >
          <span class="hamburger-line"></span>
          <span class="hamburger-line"></span>
          <span class="hamburger-line"></span>
        </el-button>
      </div>
    </div>
  </header>
</template>

<script setup name="CommonNavbar">
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { Monitor } from '@element-plus/icons-vue'

const props = defineProps({
  // 导航栏样式变体：default（深色）或 light（浅色）
  variant: {
    type: String,
    default: 'default',
    validator: (value) => ['default', 'light'].includes(value)
  }
})

const router = useRouter()
const isScrolled = ref(false)
const mobileMenuOpen = ref(false)

// 处理滚动
function handleScroll() {
  isScrolled.value = window.scrollY > 50
}

// 关闭移动端菜单
function closeMobileMenu() {
  mobileMenuOpen.value = false
}

// 处理锚点点击
function handleAnchorClick(event, anchor) {
  event.preventDefault()
  closeMobileMenu()
  
  // 如果当前不在 /website 页面，先导航
  if (router.currentRoute.value.path !== '/website') {
    router.push('/website').then(() => {
      setTimeout(() => scrollToAnchor(anchor), 100)
    })
  } else {
    scrollToAnchor(anchor)
  }
}

// 滚动到锚点
function scrollToAnchor(anchor) {
  const element = document.getElementById(anchor)
  if (element) {
    element.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
}

// 回到首页
function goHome() {
  router.push('/website')
  mobileMenuOpen.value = false
}

// 跳转到后台
function goToAdmin() {
  router.push('/index')
}

// 生命周期
onMounted(() => {
  window.addEventListener('scroll', handleScroll)
})

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll)
})
</script>

<style scoped lang="scss">
.common-navbar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 1000;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);

  &.scrolled {
    background: rgba(255, 255, 255, 0.98);
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
    transform: translateY(0);
  }

  &.light {
    background: rgba(255, 255, 255, 0.95);
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
  }

  .nav-container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 24px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    height: 70px;
  }

  .nav-logo {
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 20px;
    font-weight: 700;
    cursor: pointer;
    transition: all 0.3s;
    position: relative;
    z-index: 1001;

    &:hover {
      transform: translateX(4px);
    }

    .logo-icon {
      display: flex;
      align-items: center;
      justify-content: center;
      animation: logoFloat 3s ease-in-out infinite;
    }

    .logo-text {
      background: linear-gradient(135deg, #C77800 0%, #9C5E00 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      font-size: 20px;
      letter-spacing: -0.5px;
    }
  }

  .nav-menu {
    display: flex;
    align-items: center;
    gap: 8px;

    .nav-link {
      color: #4a5568;
      text-decoration: none;
      font-weight: 500;
      font-size: 15px;
      padding: 10px 18px;
      border-radius: 12px;
      transition: all 0.3s;
      position: relative;
      overflow: hidden;

      .link-text {
        position: relative;
        z-index: 1;
      }

      .link-line {
        position: absolute;
        bottom: 6px;
        left: 50%;
        width: 0;
        height: 2px;
        background: linear-gradient(135deg, #C77800, #9C5E00);
        border-radius: 1px;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        transform: translateX(-50%);
      }

      &:hover {
        color: #C77800;

        .link-line {
          width: calc(100% - 36px);
        }
      }

      &.active {
        color: #C77800;
        font-weight: 600;

        .link-line {
          width: calc(100% - 36px);
        }
      }
    }
  }

  .nav-actions {
    display: flex;
    align-items: center;
    gap: 12px;
    position: relative;
    z-index: 1001;

    .login-btn {
      font-weight: 500;
      transition: all 0.3s;
      border: none;
      background: linear-gradient(135deg, #C77800 0%, #9C5E00 100%);
      color: white;
      box-shadow: 0 2px 8px rgba(199, 120, 0, 0.3);

      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(199, 120, 0, 0.4);
      }

      .el-icon {
        margin-right: 6px;
      }
    }

    .mobile-toggle {
      display: none;
      width: 40px;
      height: 40px;
      padding: 0;
      background: transparent;
      border: none;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 5px;
      cursor: pointer;
      transition: all 0.3s;

      .hamburger-line {
        width: 22px;
        height: 2px;
        background: #4a5568;
        border-radius: 2px;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      }

      &.is-active {
        .hamburger-line:nth-child(1) {
          transform: rotate(45deg) translate(5px, 5px);
        }
        .hamburger-line:nth-child(2) {
          opacity: 0;
        }
        .hamburger-line:nth-child(3) {
          transform: rotate(-45deg) translate(5px, -5px);
        }
      }
    }
  }

  // 响应式
  @media (max-width: 768px) {
    .nav-container {
      padding: 0 16px;
      height: 60px;
    }

    .nav-logo {
      .logo-text {
        font-size: 16px;
      }
    }

    .nav-menu {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(255, 255, 255, 0.98);
      backdrop-filter: blur(20px);
      flex-direction: column;
      justify-content: center;
      gap: 16px;
      opacity: 0;
      visibility: hidden;
      transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
      z-index: 1000;

      &.mobile-open {
        opacity: 1;
        visibility: visible;

        .nav-link {
          animation: slideIn 0.4s ease forwards;
          
          &:nth-child(1) { animation-delay: 0.1s; }
          &:nth-child(2) { animation-delay: 0.15s; }
          &:nth-child(3) { animation-delay: 0.2s; }
          &:nth-child(4) { animation-delay: 0.25s; }
          &:nth-child(5) { animation-delay: 0.3s; }
        }
      }

      .nav-link {
        font-size: 18px;
        padding: 16px 32px;
        width: 100%;
        text-align: center;
        opacity: 0;
        transform: translateY(20px);

        .link-line {
          bottom: 10px;
        }

        &:hover .link-line,
        &.active .link-line {
          width: calc(100% - 64px);
        }
      }
    }

    .nav-actions {
      .login-btn {
        .btn-text {
          display: none;
        }
        
        .el-icon {
          margin-right: 0;
        }
      }

      .mobile-toggle {
        display: flex;
      }
    }
  }

  @media (max-width: 480px) {
    .nav-logo {
      .logo-text {
        font-size: 14px;
      }

      .logo-icon svg {
        width: 28px;
        height: 28px;
      }
    }
  }
}

@keyframes logoFloat {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-3px);
  }
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
