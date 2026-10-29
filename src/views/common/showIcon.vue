<template>
  <div class="icon-show-container">
    <h2>所有可用图标</h2>
    <el-input
      v-model="searchText"
      placeholder="搜索图标..."
      clearable
      style="width: 300px; margin-bottom: 20px;"
      @input="handleSearch"
      @clear="handleClear"
    >
      <template #prefix>
        <el-icon><Search /></el-icon>
      </template>
    </el-input>
    <div class="icon-grid">
      <div
        v-for="(icon, index) in filteredIcons"
        :key="index"
        class="icon-item"
        @click="handleIconClick(icon)"
      >
        <svg-icon :icon-class="icon" class="icon" />
        <span class="icon-name">{{ icon }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Search } from '@element-plus/icons-vue'
import icons from '@/components/IconSelect/requireIcons'

const allIcons = ref([])
const filteredIcons = ref([])
const searchText = ref('')

// 加载图标数据
onMounted(() => {
  allIcons.value = icons
  filteredIcons.value = [...icons]
})

// 搜索图标
const handleSearch = () => {
  if (searchText.value) {
    filteredIcons.value = allIcons.value.filter(icon =>
      icon.toLowerCase().includes(searchText.value.toLowerCase())
    )
  } else {
    filteredIcons.value = [...allIcons.value]
  }
}

// 清空搜索
const handleClear = () => {
  searchText.value = ''
  filteredIcons.value = [...allIcons.value]
}

// 点击图标复制名称
const handleIconClick = async (iconName) => {
  try {
    await navigator.clipboard.writeText(iconName)
    ElMessage.success(`已复制图标名称: ${iconName}`)
  } catch (error) {
    ElMessage.error('复制失败')
  }
}
</script>

<style lang="scss" scoped>
.icon-show-container {
  padding: 20px;
  background-color: #fff;
  border-radius: 4px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  
  h2 {
    margin-bottom: 20px;
    color: #333;
  }
  
  .icon-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
    gap: 20px;
    
    .icon-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 15px;
      border: 1px solid #ebeef5;
      border-radius: 4px;
      cursor: pointer;
      transition: all 0.3s;
      
      &:hover {
        border-color: #409eff;
        background-color: #ecf5ff;
        transform: translateY(-2px);
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      }
      
      .icon {
        font-size: 24px;
        margin-bottom: 10px;
        color: #606266;
      }
      
      .icon-name {
        font-size: 12px;
        color: #909399;
        text-align: center;
        word-break: break-all;
      }
    }
  }
}
</style>