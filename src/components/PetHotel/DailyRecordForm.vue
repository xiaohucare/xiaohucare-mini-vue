<template>
  <div class="daily-record-form">
    <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
      <el-form-item label="记录类型" prop="recordType">
        <el-radio-group v-model="form.recordType" @change="onTypeChange">
          <el-radio-button label="FEEDING">
            <el-icon><Food /></el-icon> 喂食
          </el-radio-button>
          <el-radio-button label="WALK">
            <el-icon><Promotion /></el-icon> 遛弯
          </el-radio-button>
          <el-radio-button label="STOOL">
            <el-icon><WarnTriangleFilled /></el-icon> 排便
          </el-radio-button>
          <el-radio-button label="HEALTH">
            <el-icon><FirstAidKit /></el-icon> 健康
          </el-radio-button>
          <el-radio-button label="OTHER">
            <el-icon><More /></el-icon> 其他
          </el-radio-button>
        </el-radio-group>
      </el-form-item>

      <!-- 喂食记录 -->
      <template v-if="form.recordType === 'FEEDING'">
        <el-row>
          <el-col :span="12">
            <el-form-item label="喂食时间" prop="recordTime">
              <el-time-picker 
                v-model="form.recordTime" 
                format="HH:mm" 
                style="width: 100%" 
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="食物类型" prop="foodType">
              <el-select v-model="form.foodType" placeholder="请选择" style="width: 100%">
                <el-option label="主粮" value="MAIN_FOOD" />
                <el-option label="罐头" value="CANNED" />
                <el-option label="零食" value="SNACKS" />
                <el-option label="鲜肉" value="FRESH_MEAT" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row>
          <el-col :span="12">
            <el-form-item label="食物名称" prop="food">
              <el-input v-model="form.food" placeholder="如：皇家狗粮" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="食量" prop="amount">
              <el-input v-model="form.amount" placeholder="如：100g">
                <template #append>g</template>
              </el-input>
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="进食情况" prop="eatingCondition">
          <el-radio-group v-model="form.eatingCondition">
            <el-radio label="GOOD">
              <el-icon><CircleCheck /></el-icon> 正常吃完
            </el-radio>
            <el-radio label="PARTIAL">
              <el-icon><Remove /></el-icon> 吃了一部分
            </el-radio>
            <el-radio label="REFUSED">
              <el-icon><CircleClose /></el-icon> 拒绝进食
            </el-radio>
          </el-radio-group>
        </el-form-item>
      </template>

      <!-- 遛弯记录 -->
      <template v-if="form.recordType === 'WALK'">
        <el-row>
          <el-col :span="12">
            <el-form-item label="开始时间" prop="startTime">
              <el-time-picker 
                v-model="form.startTime" 
                format="HH:mm" 
                style="width: 100%" 
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="时长" prop="duration">
              <el-input-number v-model="form.duration" :min="1" :max="120" style="width: 100%">
                <template #append>分钟</template>
              </el-input-number>
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="排便情况" prop="stoolDuringWalk">
          <el-radio-group v-model="form.stoolDuringWalk">
            <el-radio label="YES">有排便</el-radio>
            <el-radio label="NO">未排便</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="排便状态" v-if="form.stoolDuringWalk === 'YES'">
          <el-radio-group v-model="form.stoolCondition">
            <el-radio label="NORMAL">正常</el-radio>
            <el-radio label="SOFT">软便</el-radio>
            <el-radio label="DIARRHEA">拉稀</el-radio>
          </el-radio-group>
        </el-form-item>
      </template>

      <!-- 排便记录 -->
      <template v-if="form.recordType === 'STOOL'">
        <el-form-item label="时间" prop="recordTime">
          <el-time-picker v-model="form.recordTime" format="HH:mm" style="width: 100%" />
        </el-form-item>
        <el-form-item label="排便状态" prop="stoolCondition">
          <el-radio-group v-model="form.stoolCondition">
            <el-radio label="NORMAL">
              <el-tag type="success" size="small">正常</el-tag>
            </el-radio>
            <el-radio label="SOFT">
              <el-tag type="warning" size="small">软便</el-tag>
            </el-radio>
            <el-radio label="DIARRHEA">
              <el-tag type="danger" size="small">拉稀</el-tag>
            </el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="排便次数" prop="stoolCount">
          <el-input-number v-model="form.stoolCount" :min="1" :max="10" />
        </el-form-item>
      </template>

      <!-- 健康观察 -->
      <template v-if="form.recordType === 'HEALTH'">
        <el-row>
          <el-col :span="12">
            <el-form-item label="精神状态" prop="mentalState">
              <el-select v-model="form.mentalState" placeholder="请选择" style="width: 100%">
                <el-option label="良好" value="GOOD">
                  <el-tag type="success">良好</el-tag>
                </el-option>
                <el-option label="一般" value="NORMAL">
                  <el-tag type="warning">一般</el-tag>
                </el-option>
                <el-option label="差" value="POOR">
                  <el-tag type="danger">差</el-tag>
                </el-option>
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="食欲" prop="appetite">
              <el-select v-model="form.appetite" placeholder="请选择" style="width: 100%">
                <el-option label="良好" value="GOOD" />
                <el-option label="一般" value="NORMAL" />
                <el-option label="差" value="POOR" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="异常表现" prop="abnormalSymptoms">
          <el-checkbox-group v-model="form.abnormalSymptoms">
            <el-checkbox label="VOMITING">呕吐</el-checkbox>
            <el-checkbox label="DIARRHEA">腹泻</el-checkbox>
            <el-checkbox label="LETHARGY">精神萎靡</el-checkbox>
            <el-checkbox label="NO_APPETITE">食欲不振</el-checkbox>
            <el-checkbox label="COUGH">咳嗽</el-checkbox>
            <el-checkbox label="SNEEZE">打喷嚏</el-checkbox>
          </el-checkbox-group>
        </el-form-item>
      </template>

      <!-- 其他记录 -->
      <template v-if="form.recordType === 'OTHER'">
        <el-form-item label="记录标题" prop="title">
          <el-input v-model="form.title" placeholder="请输入记录标题" />
        </el-form-item>
      </template>

      <!-- 通用字段 -->
      <el-form-item label="备注" prop="remarks">
        <el-input 
          v-model="form.remarks" 
          type="textarea" 
          :rows="2" 
          placeholder="请输入备注信息" 
        />
      </el-form-item>

      <el-form-item label="照片/视频" prop="mediaUrls">
        <image-upload v-model="form.mediaUrls" :limit="5" />
      </el-form-item>

      <el-form-item label="发送给主人">
        <el-switch v-model="form.sendToOwner" active-text="是" inactive-text="否" />
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
  }
})

const emit = defineEmits(['update:modelValue', 'type-change'])

const formRef = ref(null)

const form = computed({
  get: () => ({
    recordType: 'FEEDING',
    recordTime: new Date(),
    foodType: 'MAIN_FOOD',
    food: '',
    amount: '',
    eatingCondition: 'GOOD',
    startTime: new Date(),
    duration: 30,
    stoolDuringWalk: 'YES',
    stoolCondition: 'NORMAL',
    stoolCount: 1,
    mentalState: 'GOOD',
    appetite: 'GOOD',
    abnormalSymptoms: [],
    title: '',
    remarks: '',
    mediaUrls: [],
    sendToOwner: false,
    ...props.modelValue
  }),
  set: (val) => emit('update:modelValue', val)
})

const rules = {
  recordType: [{ required: true, message: '请选择记录类型', trigger: 'change' }],
  food: [{ required: true, message: '请输入食物名称', trigger: 'blur', condition: () => form.value.recordType === 'FEEDING' }],
  amount: [{ required: true, message: '请输入食量', trigger: 'blur', condition: () => form.value.recordType === 'FEEDING' }]
}

function onTypeChange(type) {
  // 重置特定字段
  emit('type-change', type)
}

function validate() {
  return formRef.value?.validate()
}

function reset() {
  formRef.value?.resetFields()
}

defineExpose({
  validate,
  reset
})
</script>

<style scoped>
.daily-record-form {
  padding: 10px 0;
}

.el-radio-button {
  margin-right: 10px;
}

.el-radio-button:last-child {
  margin-right: 0;
}
</style>
