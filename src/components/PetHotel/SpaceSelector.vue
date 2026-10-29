<template>
  <div class="space-selector">
    <el-row :gutter="20">
      <!-- 推荐空间 -->
      <el-col :span="24" v-if="recommendedSpaces.length > 0">
        <div class="section-title">
          <el-icon><Star /></el-icon>
          <span>推荐空间</span>
          <el-tag type="success" size="small" effect="plain">根据宠物特征智能推荐</el-tag>
        </div>
        <div class="space-grid">
          <div 
            v-for="space in recommendedSpaces" 
            :key="space.id" 
            class="space-card recommended"
            :class="{ selected: selectedSpace?.id === space.id }"
            @click="selectSpace(space)"
          >
            <div class="space-header">
              <span class="space-no">{{ space.spaceNo }}</span>
              <el-tag size="small" type="success">推荐</el-tag>
            </div>
            <div class="space-type">{{ getSpaceTypeLabel(space.spaceType) }}</div>
            <div class="space-size">{{ space.size }}</div>
            <div class="space-reason">{{ space.recommendReason }}</div>
          </div>
        </div>
      </el-col>

      <!-- 所有可用空间 -->
      <el-col :span="24">
        <div class="section-title">
          <el-icon><Grid /></el-icon>
          <span>所有可用空间</span>
        </div>
        <el-radio-group v-model="selectedType" size="small" style="margin-bottom: 15px;">
          <el-radio-button label="">全部</el-radio-button>
          <el-radio-button label="CAT">猫区</el-radio-button>
          <el-radio-button label="SMALL_DOG">小型犬</el-radio-button>
          <el-radio-button label="LARGE_DOG">大型犬</el-radio-button>
          <el-radio-button label="SOCIAL">社交区</el-radio-button>
          <el-radio-button label="QUIET">安静区</el-radio-button>
        </el-radio-group>
        <div class="space-grid">
          <div 
            v-for="space in filteredSpaces" 
            :key="space.id" 
            class="space-card"
            :class="{ 
              selected: selectedSpace?.id === space.id,
              occupied: space.status === 'OCCUPIED',
              cleaning: space.status === 'CLEANING',
              maintenance: space.status === 'MAINTENANCE'
            }"
            @click="space.status === 'AVAILABLE' && selectSpace(space)"
          >
            <div class="space-header">
              <span class="space-no">{{ space.spaceNo }}</span>
              <el-tag size="small" :type="getStatusType(space.status)">
                {{ getStatusLabel(space.status) }}
              </el-tag>
            </div>
            <div class="space-type">{{ getSpaceTypeLabel(space.spaceType) }}</div>
            <div class="space-size">{{ space.size }}</div>
            <div v-if="space.petName" class="space-pet">
              <el-avatar :size="30" :src="space.petAvatar" />
              <span>{{ space.petName }}</span>
            </div>
          </div>
        </div>
      </el-col>
    </el-row>

    <!-- 已选空间信息 -->
    <el-card v-if="selectedSpace" shadow="never" class="selected-info">
      <template #header>
        <span>已选空间</span>
      </template>
      <el-descriptions :column="3" border>
        <el-descriptions-item label="空间编号">{{ selectedSpace.spaceNo }}</el-descriptions-item>
        <el-descriptions-item label="空间类型">{{ getSpaceTypeLabel(selectedSpace.spaceType) }}</el-descriptions-item>
        <el-descriptions-item label="尺寸">{{ selectedSpace.size }}</el-descriptions-item>
      </el-descriptions>
      <div class="disinfect-confirm" style="margin-top: 15px;">
        <el-checkbox v-model="disinfected">
          已当着主人面完成空间消毒
        </el-checkbox>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'

const props = defineProps({
  spaces: {
    type: Array,
    default: () => []
  },
  petInfo: {
    type: Object,
    default: () => ({})
  },
  modelValue: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['update:modelValue', 'select', 'confirm'])

const selectedType = ref('')
const disinfected = ref(false)

const selectedSpace = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

// 推荐空间
const recommendedSpaces = computed(() => {
  if (!props.petInfo.petType) return []
  
  return props.spaces
    .filter(s => s.status === 'AVAILABLE')
    .map(space => {
      let score = 0
      let reason = ''
      
      // 根据宠物类型匹配
      if (props.petInfo.petType === 'CAT' && space.spaceType === 'CAT') {
        score += 100
        reason = '猫狗分离，适合猫咪'
      } else if (props.petInfo.petType === 'DOG') {
        if (props.petInfo.weight > 20 && space.spaceType === 'LARGE_DOG') {
          score += 100
          reason = '空间宽敞，适合大型犬'
        } else if (props.petInfo.weight <= 10 && space.spaceType === 'SMALL_DOG') {
          score += 100
          reason = '空间适中，适合小型犬'
        } else if (props.petInfo.isAggressive && space.spaceType === 'QUIET') {
          score += 90
          reason = '安静单间，适合性格强势宠物'
        } else if (!props.petInfo.isAggressive && space.spaceType === 'SOCIAL') {
          score += 80
          reason = '社交区，适合活泼好动的宠物'
        }
      }
      
      return { ...space, score, recommendReason: reason }
    })
    .filter(s => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
})

// 过滤后的空间
const filteredSpaces = computed(() => {
  if (!selectedType.value) return props.spaces
  return props.spaces.filter(s => s.spaceType === selectedType.value)
})

function getSpaceTypeLabel(type) {
  const map = {
    'CAT': '猫区',
    'SMALL_DOG': '小型犬区',
    'LARGE_DOG': '大型犬区',
    'SOCIAL': '社交区',
    'QUIET': '安静区/单间'
  }
  return map[type] || type
}

function getStatusType(status) {
  const map = {
    'AVAILABLE': 'success',
    'OCCUPIED': 'info',
    'CLEANING': 'warning',
    'MAINTENANCE': 'danger'
  }
  return map[status] || 'info'
}

function getStatusLabel(status) {
  const map = {
    'AVAILABLE': '空闲',
    'OCCUPIED': '已占用',
    'CLEANING': '清洁中',
    'MAINTENANCE': '维修中'
  }
  return map[status] || status
}

function selectSpace(space) {
  selectedSpace.value = space
  emit('select', space)
}

watch(disinfected, (val) => {
  if (val && selectedSpace.value) {
    emit('confirm', { space: selectedSpace.value, disinfected: true })
  }
})
</script>

<style scoped>
.space-selector {
  padding: 10px 0;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: bold;
  margin-bottom: 15px;
  padding-bottom: 10px;
  border-bottom: 1px solid #e4e7ed;
}

.section-title .el-icon {
  font-size: 18px;
  color: #409eff;
}

.space-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 15px;
  margin-bottom: 20px;
}

.space-card {
  border: 2px solid #dcdfe6;
  border-radius: 8px;
  padding: 12px;
  cursor: pointer;
  transition: all 0.3s;
  background: #fff;
}

.space-card:hover {
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}

.space-card.selected {
  border-color: #409eff;
  background: #ecf5ff;
}

.space-card.recommended {
  border-color: #67c23a;
  background: #f0f9eb;
}

.space-card.occupied {
  border-color: #909399;
  background: #f4f4f5;
  cursor: not-allowed;
  opacity: 0.7;
}

.space-card.cleaning {
  border-color: #e6a23c;
  background: #fdf6ec;
  cursor: not-allowed;
  opacity: 0.7;
}

.space-card.maintenance {
  border-color: #f56c6c;
  background: #fef0f0;
  cursor: not-allowed;
  opacity: 0.7;
}

.space-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.space-no {
  font-weight: bold;
  font-size: 14px;
}

.space-type {
  font-size: 12px;
  color: #606266;
  margin-bottom: 4px;
}

.space-size {
  font-size: 11px;
  color: #909399;
  margin-bottom: 8px;
}

.space-reason {
  font-size: 11px;
  color: #67c23a;
  background: #f0f9eb;
  padding: 4px 8px;
  border-radius: 4px;
}

.space-pet {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
}

.selected-info {
  margin-top: 20px;
}

.disinfect-confirm {
  padding: 10px;
  background: #f5f7fa;
  border-radius: 4px;
}
</style>
