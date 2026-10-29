<template>
  <span :style="{ fontSize: fontSize, fontWeight: fontWeight, color: color }">
    {{ displayValue }}
  </span>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue'

const props = defineProps({
  endVal: {
    type: Number,
    required: true
  },
  decimals: {
    type: Number,
    default: 0
  },
  duration: {
    type: Number,
    default: 1000
  },
  fontSize: {
    type: String,
    default: '16px'
  },
  fontWeight: {
    type: String,
    default: 'normal'
  },
  color: {
    type: String,
    default: '#303133'
  }
})

const displayValue = ref(0)

const countTo = () => {
  const startVal = 0
  const endVal = props.endVal
  const duration = props.duration
  const decimals = props.decimals
  
  const startTime = Date.now()
  
  const updateValue = () => {
    const currentTime = Date.now()
    const progress = Math.min((currentTime - startTime) / duration, 1)
    
    const currentValue = startVal + (endVal - startVal) * progress
    displayValue.value = currentValue.toFixed(decimals)
    
    if (progress < 1) {
      requestAnimationFrame(updateValue)
    }
  }
  
  requestAnimationFrame(updateValue)
}

watch(() => props.endVal, (newVal) => {
  countTo()
})

onMounted(() => {
  countTo()
})
</script>