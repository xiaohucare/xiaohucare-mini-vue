<template>
  <div class="time-filter">
    <el-radio-group v-model="activeTab" @change="handleChange">
      <el-radio-button label="day">日</el-radio-button>
      <el-radio-button label="month">月</el-radio-button>
      <el-radio-button label="year">年</el-radio-button>
    </el-radio-group>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'

const props = defineProps({
  modelValue: {
    type: String,
    default: 'day'
  }
})

const emit = defineEmits(['update:modelValue', 'change'])

const activeTab = ref(props.modelValue)

const handleChange = (value) => {
  emit('update:modelValue', value)
  emit('change', value)
}

watch(() => props.modelValue, (newVal) => {
  activeTab.value = newVal
})
</script>

<style scoped>
.time-filter {
  display: inline-flex;
}

:deep(.el-radio-button__inner) {
  padding: 8px 16px;
  font-size: 14px;
}
</style>