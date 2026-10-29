<template>
  <div class="health-check-form">
    <el-form ref="formRef" :model="form" :rules="rules" label-width="120px">
      <el-divider content-position="left">外观检查</el-divider>
      <el-row>
        <el-col :span="12">
          <el-form-item label="精神状态" prop="mentalState">
            <el-select v-model="form.mentalState" placeholder="请选择" style="width: 100%">
              <el-option label="良好" value="GOOD" />
              <el-option label="一般" value="NORMAL" />
              <el-option label="差" value="POOR" />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="毛发状况" prop="coatCondition">
            <el-select v-model="form.coatCondition" placeholder="请选择" style="width: 100%">
              <el-option label="光滑整洁" value="GOOD" />
              <el-option label="一般" value="NORMAL" />
              <el-option label="粗糙/打结" value="POOR" />
            </el-select>
          </el-form-item>
        </el-col>
      </el-row>
      <el-form-item label="外伤检查" prop="injuries">
        <el-input v-model="form.injuries" type="textarea" :rows="2" placeholder="请描述有无外伤，如有请详细说明" />
      </el-form-item>

      <el-divider content-position="left">传染病筛查</el-divider>
      <el-row>
        <el-col :span="12">
          <el-form-item label="体温(°C)" prop="temperature">
            <el-input-number 
              v-model="form.temperature" 
              :min="35" 
              :max="45" 
              :precision="1"
              placeholder="请输入体温"
              style="width: 100%"
              @change="onTemperatureChange"
            />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="体温状态">
            <el-tag v-if="tempStatus === 'normal'" type="success">正常</el-tag>
            <el-tag v-else-if="tempStatus === 'abnormal'" type="danger">异常</el-tag>
            <span v-else style="color: #999">请输入体温</span>
            <span v-if="tempStatus === 'abnormal'" style="color: #f56c6c; margin-left: 10px; font-size: 12px;">
              正常范围：{{ petType === 'CAT' ? '38-39.5' : '38-39' }}°C
            </span>
          </el-form-item>
        </el-col>
      </el-row>
      <el-row>
        <el-col :span="12">
          <el-form-item label="眼鼻分泌物" prop="eyeNoseDischarge">
            <el-select v-model="form.eyeNoseDischarge" placeholder="请选择" style="width: 100%">
              <el-option label="无" value="NONE" />
              <el-option label="少量" value="LIGHT" />
              <el-option label="大量" value="HEAVY" />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="皮肤真菌" prop="skinFungus">
            <el-select v-model="form.skinFungus" placeholder="请选择" style="width: 100%">
              <el-option label="无异常" value="NONE" />
              <el-option label="疑似" value="SUSPECTED" />
              <el-option label="确诊" value="CONFIRMED" />
            </el-select>
          </el-form-item>
        </el-col>
      </el-row>

      <el-divider content-position="left">粪便检查</el-divider>
      <el-form-item label="排便状态" prop="stoolCondition">
        <el-radio-group v-model="form.stoolCondition">
          <el-radio label="NORMAL">正常</el-radio>
          <el-radio label="SOFT">软便</el-radio>
          <el-radio label="DIARRHEA">拉稀</el-radio>
        </el-radio-group>
      </el-form-item>

      <el-divider content-position="left">异常处理</el-divider>
      <el-alert
        v-if="hasAbnormal"
        title="检测到健康异常，建议告知主人终止康养或转至医疗隔离区"
        type="error"
        :closable="false"
        style="margin-bottom: 15px"
      />
      <el-form-item label="处理建议" prop="abnormalAction" v-if="hasAbnormal">
        <el-radio-group v-model="form.abnormalAction">
          <el-radio label="CONTINUE">继续康养</el-radio>
          <el-radio label="REJECT">拒收</el-radio>
          <el-radio label="ISOLATION">转至医疗隔离</el-radio>
        </el-radio-group>
      </el-form-item>

      <el-form-item label="备注" prop="remarks">
        <el-input v-model="form.remarks" type="textarea" :rows="2" placeholder="其他需要记录的健康信息" />
      </el-form-item>
    </el-form>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'

const props = defineProps({
  modelValue: {
    type: Object,
    default: () => ({})
  },
  petType: {
    type: String,
    default: 'DOG'
  }
})

const emit = defineEmits(['update:modelValue', 'abnormal-detected'])

const formRef = ref(null)

const form = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

const rules = {
  mentalState: [{ required: true, message: '请选择精神状态', trigger: 'change' }],
  temperature: [{ required: true, message: '请输入体温', trigger: 'blur' }],
  stoolCondition: [{ required: true, message: '请选择排便状态', trigger: 'change' }]
}

// 体温状态
const tempStatus = computed(() => {
  const temp = form.value.temperature
  if (!temp) return ''
  const minTemp = 38
  const maxTemp = props.petType === 'CAT' ? 39.5 : 39
  return (temp >= minTemp && temp <= maxTemp) ? 'normal' : 'abnormal'
})

// 是否有异常
const hasAbnormal = computed(() => {
  const hasTempAbnormal = tempStatus.value === 'abnormal'
  const hasDischarge = form.value.eyeNoseDischarge === 'HEAVY'
  const hasFungus = form.value.skinFungus === 'CONFIRMED'
  const hasStoolIssue = form.value.stoolCondition === 'DIARRHEA'
  const hasPoorMental = form.value.mentalState === 'POOR'
  
  return hasTempAbnormal || hasDischarge || hasFungus || hasStoolIssue || hasPoorMental
})

// 监听异常变化
watch(hasAbnormal, (newVal) => {
  if (newVal) {
    emit('abnormal-detected', {
      temperature: tempStatus.value === 'abnormal',
      eyeNoseDischarge: form.value.eyeNoseDischarge === 'HEAVY',
      skinFungus: form.value.skinFungus === 'CONFIRMED',
      stoolCondition: form.value.stoolCondition === 'DIARRHEA',
      mentalState: form.value.mentalState === 'POOR'
    })
  }
})

function onTemperatureChange(val) {
  // 体温变化时的处理
}

function validate() {
  return formRef.value?.validate()
}

function reset() {
  formRef.value?.resetFields()
}

defineExpose({
  validate,
  reset,
  hasAbnormal
})
</script>

<style scoped>
.health-check-form {
  padding: 10px 0;
}
</style>
