<template>
  <footer v-if="visible" class="copyright">
    <span class="copyright-text">{{ content }}</span>
    <span class="copyright-links">
      <a class="copyright-link" href="https://github.com/xiaohucare/xiaohucare-mini-vue" target="_blank" rel="noopener">
        <el-icon><Link /></el-icon>开源地址
      </a>
      <em class="copyright-divider">|</em>
      <a class="copyright-link" href="https://xiaohucare.github.io//" target="_blank" rel="noopener">
        <el-icon><Position /></el-icon>官网地址
      </a>
    </span>
  </footer>
</template>

<script setup>
import useSettingsStore from '@/store/modules/settings'

const settingsStore = useSettingsStore()

const visible = computed(() => settingsStore.footerVisible)
const content = computed(() => settingsStore.footerContent)
</script>

<style scoped>
.copyright {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 36px;
  padding: 10px 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 8px;
  background-color: #f8f8f8;
  color: #666;
  font-size: 14px;
  border-top: 1px solid #e7e7e7;
  z-index: 999;
}
.copyright-text { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.copyright-links { display: inline-flex; align-items: center; flex-shrink: 0; }
.copyright-link {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  color: #666;
  text-decoration: none;
  transition: color 0.15s;
}
.copyright-link:hover { color: #409EFF; }
.copyright-divider { font-style: normal; margin: 0 8px; color: #dcdfe6; }
</style>