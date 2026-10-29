<template>
  <div class="app-container">
    <div class="main-layout">
      <div class="left-panel">
        <!-- 左侧树状菜单 -->
        <el-card shadow="never" class="tree-card">
          <template #header>
            <div class="card-header">
              <img src="../../assets/images/sxt.png" class="header-icon" />
              <h3>摄像头列表</h3>
            </div>
          </template>
          <el-input
            v-model="searchQuery"
            placeholder="请输入摄像头名称"
            clearable
            @input="filterTreeData"
            style="margin-bottom: 10px"
          />
          <el-tree
            :data="filteredTreeData"
            draggable
            node-key="id"
            @node-drag-start="handleDragStart"
            default-expand-all
          />
        </el-card>
      </div>

      <div class="right-panel">
        <el-card shadow="never" class="video-card">
          <template #header>
            <div class="card-header">
              <h3>视频监控</h3>
            </div>
          </template>

          <!-- 右侧视频分屏部分 -->
          <div class="video-area" ref="videoArea">
            <div class="control-bar">
              <div class="screen-buttons">
                <el-button
                  v-for="screen in screenOptions"
                  :key="screen"
                  :type="currentScreenMode === screen ? 'primary' : 'default'"
                  @click="setScreenMode(screen)"
                  round
                >
                  {{ screen }}分屏
                </el-button>
                <el-button type="primary" @click="toggle" round>
                  <el-icon style="margin-right: 5px">
                    <FullScreen />
                  </el-icon>
                  全屏
                </el-button>
              </div>
              <el-button plain @click="clearAllScreens" round>
                <el-icon style="margin-right: 5px">
                  <Delete />
                </el-icon>
                一键清除
              </el-button>
            </div>

            <!-- 使用flex布局来动态生成分屏 -->
            <div class="video-grid">
              <div
                v-for="(slot, index) in videoSlots"
                :key="index"
                class="video-slot"
                :style="`height:${getVideoBoxStyle().height};width:${getVideoBoxStyle().width}`"
                @drop.prevent="handleDrop(index)"
                @dragover.prevent
              >
                <div v-if="slot" class="video-container">
                  <Player 
                    :camera-url="slot.cameraUrl" 
                    :access-token="slot.accessToken || ysAccessToken" 
                    :container-id="`video-container-${index}`" 
                    :key="`player-${index}-${slot.id}`" />
                  <el-button
                    class="clear-btn"
                    type="danger"
                    :icon="Delete"
                    circle
                    size="small"
                    @click="clearSlot(index)"
                  />
                </div>
                <div v-else class="empty-slot">
                  <el-icon :size="40" color="#909399">
                    <VideoCamera />
                  </el-icon>
                  <p>拖拽摄像头到此处</p>
                </div>
              </div>
            </div>
          </div>
        </el-card>
      </div>
    </div>
  </div>
</template>
  
<script setup name="VideoMonitor">
import { ref, onMounted, getCurrentInstance, defineAsyncComponent, h } from 'vue'
import { Delete, FullScreen, VideoCamera, Loading } from '@element-plus/icons-vue'
import { useFullscreen } from '@vueuse/core'
import { getVideo, getVideoList } from '@/api/video'
import Player from '@/components/YsPlayer/Player.vue'

// 使用YS7直播播放器组件

// 萤石云 accessToken（从环境变量读取，请在 .env.* 中配置 VITE_YS_ACCESS_TOKEN）
const ysAccessToken = import.meta.env.VITE_YS_ACCESS_TOKEN || ''

const { proxy } = getCurrentInstance()
const videoArea = ref(null)
const { isFullscreen, toggle } = useFullscreen(videoArea)
const loading = ref(false)

// 树状菜单数据（示例设备，实际由后端接口下发）
const treeData = ref([
  {
    label: '示例监控区域',
    children: [
      {
        id: 1,
        label: 'YS7摄像头1',
        streamUrl: 'ezopen://open.ys7.com/替换为你的设备序列号/1.hd.live'
      },
      {
        id: 2,
        label: 'YS7摄像头2',
        streamUrl: 'ezopen://open.ys7.com/替换为你的设备序列号/2.hd.live'
      },
      {
        id: 3,
        label: 'YS7摄像头3',
        streamUrl: 'ezopen://open.ys7.com/替换为你的设备序列号/3.hd.live'
      }
    ]
  }
])

const searchQuery = ref('') // 查询框的内容
const filteredTreeData = ref(treeData.value) // 过滤后的树数据

// 分屏模式
const screenOptions = [1, 4, 6, 9, 16]
const currentScreenMode = ref(1) // 默认1分屏
const videoSlots = ref(new Array(currentScreenMode.value).fill(null))
const draggedNode = ref(null) // 被拖拽的节点

// 获取视频盒子样式
const getVideoBoxStyle = () => {
  if (currentScreenMode.value === 1) {
    return { height: '100%', width: '100%' }
  } else if (currentScreenMode.value === 4) {
    return { height: '48%', width: '48%' }
  } else if (currentScreenMode.value === 6) {
    return { height: '31%', width: '31%' }
  } else if (currentScreenMode.value === 9) {
    return { height: '31%', width: '31%' }
  } else if (currentScreenMode.value === 16) {
    return { height: '23%', width: '23%' }
  } else {
    return { height: '100%', width: '100%' }
  }
}

// 根据查询过滤树数据
const filterTreeData = () => {
  if (!searchQuery.value) {
    filteredTreeData.value = treeData.value
    return
  }
  const query = searchQuery.value.toLowerCase()
  const filterNode = (node) => {
    if (node.label && node.label.toLowerCase().includes(query)) return true
    if (node.children) {
      const filteredChildren = node.children.filter(filterNode)
      if (filteredChildren.length) return true
    }
    return false
  }
  filteredTreeData.value = treeData.value
    .map((node) => ({
      ...node,
      children: node.children ? node.children.filter(filterNode) : []
    }))
    .filter(filterNode)
}

// 设置分屏模式
const setScreenMode = (mode) => {
  currentScreenMode.value = mode
  videoSlots.value = new Array(mode).fill(null) // 根据分屏模式更新槽数量
}

// 拖拽开始
const handleDragStart = (node) => {
  draggedNode.value = node
}

// 拖拽落下
const handleDrop = (index) => {
  if (draggedNode.value && draggedNode.value.data) {
    videoSlots.value[index] = {
      cameraUrl: draggedNode.value.data.streamUrl,
      name: draggedNode.value.data.label,
      id: draggedNode.value.data.id,
      accessToken: ysAccessToken
    }
    draggedNode.value = null // 清空拖拽状态
  }
}

// 清除单个分屏槽位
const clearSlot = (index) => {
  videoSlots.value[index] = null
}

// 清除所有分屏
const clearAllScreens = () => {
  videoSlots.value = new Array(currentScreenMode.value).fill(null)
}

// 加载视频列表
const loadVideoList = () => {
  loading.value = true
  getVideoList()
    .then((res) => {
      // 如果API返回数据，可以在这里处理并更新treeData
      // treeData.value = processVideoData(res.data)
    })
    .catch((error) => {
      console.error('获取视频列表失败:', error)
    })
    .finally(() => {
      loading.value = false
    })
}

onMounted(() => {
  // 页面加载时默认显示第一个摄像头
  if (treeData.value && treeData.value.length > 0 && treeData.value[0].children && treeData.value[0].children.length > 0) {
    const firstCamera = treeData.value[0].children[0];
    videoSlots.value[0] = {
      cameraUrl: firstCamera.streamUrl,
      name: firstCamera.label,
      id: firstCamera.id,
      accessToken: ysAccessToken
    };
  }
  
  // 页面加载时获取视频列表
  // loadVideoList()
})
</script>
  
<style lang="scss" scoped>
.app-container {
  padding: 20px;
  background: #f1f2f5;
  height: 100%;
  min-height: 800px;
}
.main-layout {
  display: flex;
  gap: 20px;
  height: 100%;
}

.left-panel {
  flex: 0 0 280px;
  min-width: 280px;
  min-height: 800px;
  .tree-card {
    height: 100%;
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);

    :deep(.el-card__header) {
      padding: 15px 20px;
      background: linear-gradient(135deg, #4fdaca 0%, #32b7cb 100%);
      border-bottom: none;

      .card-header {
        display: flex;
        align-items: center;
        gap: 10px;

        .header-icon {
          width: 22px;
          height: 22px;
        }

        h3 {
          margin: 0;
          font-size: 16px;
          font-weight: 600;
          color: #ffffff;
        }
      }
    }

    :deep(.el-card__body) {
      padding: 20px;
      height: calc(100% - 60px);
      overflow-y: auto;
    }
  }
}

.right-panel {
  flex: 1;
  min-width: 0;

  .video-card {
    height: 100%;
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);

    :deep(.el-card__header) {
      padding: 15px 20px;
      background: linear-gradient(135deg, #4fdaca 0%, #32b7cb 100%);
      border-bottom: none;

      .card-header {
        h3 {
          margin: 0;
          font-size: 16px;
          font-weight: 600;
          color: #ffffff;
        }
      }
    }

    :deep(.el-card__body) {
      padding: 20px;
      height: calc(100% - 60px);
    }
  }
}

.video-area {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.control-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
  padding-bottom: 15px;
  border-bottom: 1px solid #e4e7ed;

  .screen-buttons {
    display: flex;
    gap: 10px;
  }

  .el-button {
    border-radius: 6px;
    font-weight: 500;
  }
}

.video-grid {
  flex: 1;
  display: flex;
  justify-content: space-around;
  align-content: center;
  flex-wrap: wrap;
  gap: 10px;
  overflow-y: auto;
  padding: 10px;
  background: #fafafa;
  border-radius: 8px;
}

.video-slot {
  position: relative;
  background: #ffffff;
  border: 2px dashed #d9d9d9;
  border-radius: 8px;
  overflow: hidden;
  transition: all 0.3s ease;

  &:hover {
    border-color: #16a5b7;
    box-shadow: 0 2px 12px rgba(22, 165, 183, 0.2);
  }
}

.video-container {
  width: 100%;
  height: 100%;
  position: relative;
  background: #000;
  border-radius: 8px;
  overflow: hidden;

  :deep(.video-wrapper) {
    width: 100%;
    height: 100%;
  }
}

.empty-slot {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  color: #909399;

  p {
    margin-top: 10px;
    font-size: 14px;
  }
}

.clear-btn {
  position: absolute;
  top: 10px;
  right: 10px;
  z-index: 10;
  opacity: 0.8;
  transition: opacity 0.3s;

  &:hover {
    opacity: 1;
  }
}

.loading-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  background: rgba(0, 0, 0, 0.5);
  color: #ffffff;

  p {
    margin-top: 10px;
    font-size: 14px;
  }
}

// Element Plus 树组件样式覆盖
:deep(.el-tree) {
  background: transparent;

  .el-tree-node {
    &:hover {
      background-color: rgba(22, 165, 183, 0.1);
    }

    &.is-current {
      > .el-tree-node__content {
        background-color: rgba(22, 165, 183, 0.2);
      }
    }
  }

  .el-tree-node__content {
    height: 36px;
    border-radius: 4px;
    transition: background-color 0.3s;

    &:hover {
      background-color: rgba(22, 165, 183, 0.1);
    }
  }

  .el-tree-node__label {
    color: #606266;
    font-size: 14px;
  }

  .el-tree-node__expand-icon {
    color: #909399;
  }
}

// 输入框样式
:deep(.el-input) {
  .el-input__wrapper {
    border-radius: 6px;
  }
}

// 按钮样式
:deep(.el-button) {
  &.el-button--primary {
    background: linear-gradient(135deg, #4fdaca 0%, #32b7cb 100%);
    border: none;

    &:hover {
      background: linear-gradient(135deg, #3bc4b3 0%, #2aa3b8 100%);
    }
  }

  &.el-button--danger {
    background: linear-gradient(135deg, #ff6b6b 0%, #ee5a52 100%);
    border: none;

    &:hover {
      background: linear-gradient(135deg, #ff5252 0%, #e74c3c 100%);
    }
  }
}
</style>
  