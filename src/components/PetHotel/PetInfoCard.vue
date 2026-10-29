<template>
  <el-card shadow="hover" class="pet-info-card" :class="cardClass">
    <div class="pet-header">
      <el-avatar :size="avatarSize" :src="pet.avatar || defaultAvatar" />
      <div class="pet-basic">
        <div class="pet-name-row">
          <span class="pet-name">{{ pet.name }}</span>
          <el-tag v-if="showStatus" :type="statusType" size="small">{{ statusLabel }}</el-tag>
        </div>
        <div class="pet-breed">{{ pet.breed }}</div>
        <div class="pet-tags">
          <el-tag v-if="pet.petType === 'DOG'" type="primary" size="small" effect="plain">狗狗</el-tag>
          <el-tag v-else type="success" size="small" effect="plain">猫咪</el-tag>
          <el-tag v-if="pet.gender === 'MALE'" type="info" size="small" effect="plain">公</el-tag>
          <el-tag v-else type="info" size="small" effect="plain">母</el-tag>
          <el-tag v-if="pet.isNeutered" type="warning" size="small" effect="plain">已绝育</el-tag>
        </div>
      </div>
    </div>
    <div class="pet-details" v-if="showDetails">
      <div class="detail-row">
        <span class="detail-label">年龄：</span>
        <span class="detail-value">{{ pet.age }}岁</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">体重：</span>
        <span class="detail-value">{{ pet.weight }}kg</span>
      </div>
      <div class="detail-row" v-if="pet.ownerName">
        <span class="detail-label">主人：</span>
        <span class="detail-value">{{ pet.ownerName }}</span>
      </div>
      <div class="detail-row" v-if="pet.ownerPhone">
        <span class="detail-label">电话：</span>
        <span class="detail-value">{{ pet.ownerPhone }}</span>
      </div>
      <div class="detail-row" v-if="pet.spaceNo">
        <span class="detail-label">空间：</span>
        <span class="detail-value">{{ pet.spaceNo }}</span>
      </div>
      <div class="detail-row" v-if="pet.days !== undefined">
        <span class="detail-label">已住：</span>
        <span class="detail-value">{{ pet.days }}天</span>
      </div>
    </div>
    <div class="pet-personality" v-if="pet.personality">
      <el-divider content-position="left">性格特征</el-divider>
      <p>{{ pet.personality }}</p>
    </div>
    <div class="pet-special" v-if="pet.specialNeeds">
      <el-divider content-position="left">特殊需求</el-divider>
      <p>{{ pet.specialNeeds }}</p>
    </div>
    <div class="pet-actions" v-if="showActions">
      <slot name="actions">
        <el-button type="primary" size="small" round>查看详情</el-button>
      </slot>
    </div>
  </el-card>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  pet: {
    type: Object,
    required: true,
    default: () => ({})
  },
  avatarSize: {
    type: Number,
    default: 60
  },
  showStatus: {
    type: Boolean,
    default: true
  },
  showDetails: {
    type: Boolean,
    default: true
  },
  showActions: {
    type: Boolean,
    default: true
  },
  status: {
    type: String,
    default: 'NORMAL'
  }
})

const defaultAvatar = 'https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png'

const statusType = computed(() => {
  const map = {
    'NORMAL': 'success',
    'ATTENTION': 'warning',
    'ABNORMAL': 'danger',
    'ISOLATION': 'info',
    'PENDING': 'warning',
    'CONFIRMED': 'success',
    'CHECKED_IN': 'primary',
    'COMPLETED': 'info'
  }
  return map[props.status] || 'info'
})

const statusLabel = computed(() => {
  const map = {
    'NORMAL': '正常',
    'ATTENTION': '需关注',
    'ABNORMAL': '异常',
    'ISOLATION': '隔离',
    'PENDING': '待确认',
    'CONFIRMED': '已确认',
    'CHECKED_IN': '已登记',
    'COMPLETED': '已完成'
  }
  return map[props.status] || props.status
})

const cardClass = computed(() => {
  return {
    'status-normal': props.status === 'NORMAL',
    'status-attention': props.status === 'ATTENTION',
    'status-abnormal': props.status === 'ABNORMAL',
    'status-isolation': props.status === 'ISOLATION'
  }
})
</script>

<style scoped>
.pet-info-card {
  transition: all 0.3s;
}

.pet-info-card:hover {
  box-shadow: 0 4px 16px 0 rgba(0, 0, 0, 0.15);
}

.status-normal {
  border-top: 3px solid #67c23a;
}

.status-attention {
  border-top: 3px solid #e6a23c;
}

.status-abnormal {
  border-top: 3px solid #f56c6c;
}

.status-isolation {
  border-top: 3px solid #909399;
}

.pet-header {
  display: flex;
  align-items: flex-start;
  gap: 15px;
  margin-bottom: 15px;
}

.pet-basic {
  flex: 1;
}

.pet-name-row {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 5px;
}

.pet-name {
  font-size: 16px;
  font-weight: bold;
}

.pet-breed {
  font-size: 13px;
  color: #909399;
  margin-bottom: 8px;
}

.pet-tags {
  display: flex;
  gap: 5px;
  flex-wrap: wrap;
}

.pet-details {
  background: #f5f7fa;
  border-radius: 4px;
  padding: 10px;
  margin-bottom: 15px;
}

.detail-row {
  display: flex;
  justify-content: space-between;
  font-size: 13px;
  margin-bottom: 5px;
}

.detail-row:last-child {
  margin-bottom: 0;
}

.detail-label {
  color: #909399;
}

.detail-value {
  color: #606266;
  font-weight: 500;
}

.pet-personality,
.pet-special {
  font-size: 13px;
  color: #606266;
}

.pet-personality p,
.pet-special p {
  margin: 0;
  line-height: 1.6;
}

.pet-actions {
  margin-top: 15px;
  display: flex;
  gap: 10px;
}
</style>
