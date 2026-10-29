<template>
  <div class="app-container">
    <el-card class="demo-card">
      <template #header>
        <div class="card-header">
          <span>公共组件演示页面</span>
        </div>
      </template>
      
      <!-- 按钮组件演示 -->
      <el-divider content-position="left">按钮组件</el-divider>
      <div class="demo-section">
        <el-button type="primary" round>主要按钮</el-button>
        <el-button type="success" round>成功按钮</el-button>
        <el-button type="warning" round>警告按钮</el-button>
        <el-button type="danger" round>危险按钮</el-button>
        <el-button type="info" round>信息按钮</el-button>
        <el-button plain round>朴素按钮</el-button>
        <el-button round>圆角按钮</el-button>
        <el-button :icon="Search" circle />
      </div>

      <!-- 表单组件演示 -->
      <el-divider content-position="left">表单组件</el-divider>
      <div class="demo-section">
        <el-form :model="form" label-width="120px" style="max-width: 600px">
          <el-form-item label="输入框">
            <el-input v-model="form.input" placeholder="请输入内容" />
          </el-form-item>
          <el-form-item label="选择器">
            <el-select v-model="form.select" placeholder="请选择">
              <el-option label="选项一" value="1" />
              <el-option label="选项二" value="2" />
              <el-option label="选项三" value="3" />
            </el-select>
          </el-form-item>
          <el-form-item label="日期选择">
            <el-date-picker
              v-model="form.date"
              type="date"
              placeholder="选择日期"
              style="width: 100%"
            />
          </el-form-item>
          <el-form-item label="开关">
            <el-switch v-model="form.switch" />
          </el-form-item>
          <el-form-item label="单选框">
            <el-radio-group v-model="form.radio">
              <el-radio label="1">选项一</el-radio>
              <el-radio label="2">选项二</el-radio>
            </el-radio-group>
          </el-form-item>
          <el-form-item label="多选框">
            <el-checkbox-group v-model="form.checkbox">
              <el-checkbox label="选项一" name="type" />
              <el-checkbox label="选项二" name="type" />
              <el-checkbox label="选项三" name="type" />
            </el-checkbox-group>
          </el-form-item>
        </el-form>
      </div>

      <!-- 数据展示组件演示 -->
      <el-divider content-position="left">数据展示组件</el-divider>
      <div class="demo-section">
        <el-table :data="tableData" style="width: 100%">
          <el-table-column prop="date" label="日期" width="180" />
          <el-table-column prop="name" label="姓名" width="180" />
          <el-table-column prop="address" label="地址" />
        </el-table>
        
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="100"
          layout="total, sizes, prev, pager, next, jumper"
          style="margin-top: 20px"
        />
      </div>

      <!-- 反馈组件演示 -->
      <el-divider content-position="left">反馈组件</el-divider>
      <div class="demo-section">
        <el-button @click="showMessage" round>显示消息提示</el-button>
        <el-button @click="showConfirm" round>显示确认框</el-button>
        <el-button @click="showLoading" round>显示加载中</el-button>
        <el-button @click="showNotification" round>显示通知</el-button>
      </div>

      <!-- 导航组件演示 -->
      <el-divider content-position="left">导航组件</el-divider>
      <div class="demo-section">
        <el-steps :active="activeStep" finish-status="success">
          <el-step title="步骤 1" description="这是一段描述" />
          <el-step title="步骤 2" description="这是一段描述" />
          <el-step title="步骤 3" description="这是一段描述" />
        </el-steps>
        <div style="margin-top: 20px; text-align: center">
          <el-button @click="prevStep" round>上一步</el-button>
          <el-button type="primary" @click="nextStep" round>下一步</el-button>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { ElMessage, ElMessageBox, ElLoading, ElNotification } from 'element-plus'
import { Search } from '@element-plus/icons-vue'

// 表单数据
const form = reactive({
  input: '',
  select: '',
  date: '',
  switch: false,
  radio: '1',
  checkbox: []
})

// 表格数据
const tableData = ref([
  {
    date: '2016-05-03',
    name: '张三',
    address: '北京市朝阳区'
  },
  {
    date: '2016-05-02',
    name: '李四',
    address: '上海市浦东新区'
  },
  {
    date: '2016-05-04',
    name: '王五',
    address: '深圳市南山区'
  }
])

// 分页数据
const currentPage = ref(1)
const pageSize = ref(10)

// 步骤条数据
const activeStep = ref(0)

// 步骤条方法
const nextStep = () => {
  if (activeStep.value < 2) {
    activeStep.value++
  }
}

const prevStep = () => {
  if (activeStep.value > 0) {
    activeStep.value--
  }
}

// 反馈组件方法
const showMessage = () => {
  ElMessage.success('这是一条成功的消息')
}

const showConfirm = () => {
  ElMessageBox.confirm('确定要执行此操作吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    ElMessage.success('操作成功')
  }).catch(() => {
    ElMessage.info('已取消操作')
  })
}

const showLoading = () => {
  const loading = ElLoading.service({
    lock: true,
    text: '加载中...',
    background: 'rgba(0, 0, 0, 0.7)'
  })
  setTimeout(() => {
    loading.close()
  }, 2000)
}

const showNotification = () => {
  ElNotification.success({
    title: '成功',
    message: '这是一条成功的通知消息',
    duration: 3000
  })
}
</script>

<style lang="scss" scoped>
.demo-card {
  margin: 20px;
  
  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 18px;
    font-weight: bold;
  }
  
  .demo-section {
    margin: 20px 0;
    padding: 20px;
    border: 1px solid #ebeef5;
    border-radius: 4px;
    background-color: #fafafa;
    
    .el-button {
      margin-right: 10px;
      margin-bottom: 10px;
    }
  }
  
  .el-divider {
    margin: 30px 0;
  }
}
</style>