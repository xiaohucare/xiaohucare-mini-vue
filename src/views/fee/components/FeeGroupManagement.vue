<template>
  <div class="fee-group-management">
    <!-- 搜索和操作区域 -->
    <el-card class="mb-4" shadow="hover">
      <el-form :model="queryParams" ref="queryFormRef" :inline="true" label-width="80px">
        <el-form-item label="套餐名称" prop="groupName">
          <el-input
            v-model="queryParams.groupName"
            placeholder="请输入套餐名称"
            clearable
            style="width: 200px"
            @keyup.enter="handleQuery"
          />
        </el-form-item>
        <el-form-item label="护理等级" prop="careLevel">
          <el-select v-model="queryParams.careLevel" placeholder="请选择护理等级" clearable style="width: 200px">
            <el-option
              v-for="item in careLevelOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="房间类型" prop="roomType">
          <el-select v-model="queryParams.roomType" placeholder="请选择房间类型" clearable style="width: 200px">
            <el-option
              v-for="item in roomTypeOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-select v-model="queryParams.status" placeholder="请选择状态" clearable style="width: 200px">
            <el-option label="启用" :value="1" />
            <el-option label="停用" :value="0" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" icon="search" @click="handleQuery" round>搜索</el-button>
          <el-button icon="refresh" @click="resetQuery" round>重置</el-button>
        </el-form-item>
      </el-form>
      <el-row :gutter="10" class="mb-2">
        <el-col :span="16">
          <el-button type="primary" icon="plus" @click="handleAdd" round>新增</el-button>
          <el-button type="success" icon="edit" :disabled="single" @click="handleUpdate" round>修改</el-button>
          <el-button type="danger" icon="delete" :disabled="multiple" @click="handleDelete" round>删除</el-button>
          <el-button type="warning" icon="download" @click="handleExport" round>导出</el-button>
        </el-col>
      </el-row>
    </el-card>

    <!-- 数据表格 -->
    <el-card shadow="hover">
      <el-table
        v-loading="loading"
        :data="feeGroupList"
        @selection-change="handleSelectionChange"
        @sort-change="handleSortChange"
      >
        <el-table-column type="selection" width="55" align="center" />
        <el-table-column label="套餐ID" align="center" prop="id" width="80" />
        <el-table-column label="套餐名称" align="center" prop="groupName" min-width="150" />
        <el-table-column label="护理等级" align="center" prop="careLevel" width="100">
          <template #default="scope">
            <el-tag :type="getCareLevelTagType(scope.row.careLevel)">
              {{ getCareLevelName(scope.row.careLevel) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="房间类型" align="center" prop="roomType" width="100" />
        <el-table-column label="房间等级" align="center" prop="roomLevel" width="100" />
        <el-table-column label="总价" align="center" prop="totalMoney" width="120">
          <template #default="scope">
            ¥{{ scope.row.totalMoney }}
          </template>
        </el-table-column>
        <el-table-column label="优惠价" align="center" prop="payMoney" width="120">
          <template #default="scope">
            <span style="color: #f56c6c; font-weight: bold;">¥{{ scope.row.payMoney }}</span>
          </template>
        </el-table-column>
        <el-table-column label="描述" align="center" prop="description" min-width="200" show-overflow-tooltip />
        <el-table-column label="状态" align="center" prop="status" width="80">
          <template #default="scope">
            <el-switch
              v-model="scope.row.status"
              :active-value="1"
              :inactive-value="0"
              @change="handleStatusChange(scope.row)"
            />
          </template>
        </el-table-column>
        <el-table-column label="创建时间" align="center" prop="createAt" width="160">
          <template #default="scope">
            <span>{{ parseTime(scope.row.createAt) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" align="center" width="200" class-name="small-padding fixed-width">
          <template #default="scope">
            <el-button
              size="small"
              type="text"
              icon="view"
              @click="handleView(scope.row)"
              round
            >查看</el-button>
            <el-button
              size="small"
              type="text"
              icon="edit"
              @click="handleUpdate(scope.row)"
              round
            >修改</el-button>
            <el-button
              size="small"
              type="text"
              icon="delete"
              @click="handleDelete(scope.row)"
              round
            >删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页组件 -->
      <pagination
        v-show="total > 0"
        :total="total"
        v-model:page="queryParams.pageNum"
        v-model:limit="queryParams.pageSize"
        @pagination="getList"
      />
    </el-card>

    <!-- 添加或修改收费套餐对话框 -->
    <el-dialog :title="title" v-model="open" width="80%" append-to-body>
     
      <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
          <el-card >
         <template #header>
          <div class="card-header">
            <span>收费套餐</span>
             </div>
        </template>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="套餐名称" prop="groupName">
              <el-input v-model="form.groupName" placeholder="请输入套餐名称" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="护理等级" prop="careLevel">
              <el-select v-model="form.careLevel" placeholder="请选择护理等级" style="width: 100%">
                <el-option
                  v-for="item in careLevelOptions"
                  :key="item.value"
                  :label="item.label"
                  :value="item.value"
                />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="房间类型" prop="roomType">
              <el-select v-model="form.roomType" placeholder="请选择房间类型" style="width: 100%">
                <el-option
                  v-for="item in roomTypeOptions"
                  :key="item.value"
                  :label="item.label"
                  :value="item.value"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="房间等级" prop="roomLevel">
              <el-select v-model="form.roomLevel" placeholder="请选择房间等级" style="width: 100%">
                <el-option
                  v-for="item in roomLevelOptions"
                  :key="item.value"
                  :label="item.label"
                  :value="item.value"
                />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="总价" prop="totalMoney">
              <el-input-number
                v-model="form.totalMoney"
                :min="0"
                :precision="2"
                :step="100"
                style="width: 100%"
                placeholder="请输入总价"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="优惠价" prop="payMoney">
              <el-input-number
                v-model="form.payMoney"
                :min="0"
                :precision="2"
                :step="100"
                style="width: 100%"
                placeholder="请输入优惠价"
              />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="描述" prop="description">
          <el-input
            v-model="form.description"
            type="textarea"
            :rows="3"
            placeholder="请输入描述"
          />
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-radio-group v-model="form.status">
            <el-radio :label="1">启用</el-radio>
            <el-radio :label="0">停用</el-radio>
          </el-radio-group>
        </el-form-item>
       </el-card>
      <el-card style="margin-top: 20px;">
         <template #header>
          <div class="card-header">
            <span>包含的收费项目</span>
            <el-button type="primary" icon="plus" @click="handleAddFeeItem" size="small" round style="float: right;">添加收费项目</el-button>
          </div>
        </template>
        <el-table :data="form.itemList" style="width: 100%" size="small">
          <el-table-column label="项目名称" prop="itemName" >
            <template #default="scope">
              <el-select 
                v-model="scope.row.itemName" 
                placeholder="请选择项目" 
                style="width: 100%"
                @change="(val) => handleFeeItemChange(val, scope.row)"
              >
                <el-option
                  v-for="item in itemListOptions"
                  :key="item.id"
                  :label="`${item.itemName} (¥${item.unitPrice}/${item.unit})`"
                  :value="item.itemName"
                  :data-item="item"
                />
              </el-select>
            </template>
          </el-table-column>
          <el-table-column label="项目类型" prop="itemType" >
            <template #default="scope">
              <el-tag :type="getItemTypeTagType(scope.row.itemType)">
                {{ scope.row.itemType }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="单价" prop="unitPrice" >
            <template #default="scope">
              ¥{{ scope.row.unitPrice }}
            </template>
          </el-table-column>
          <el-table-column label="单位" prop="unit" />
          <el-table-column label="数量" prop="quantity" >
            <template #default="scope">
              <el-input-number 
                v-model="scope.row.quantity" 
                :min="1" 
                :precision="0" 
                size="small"
                @change="(val) => handleQuantityChange(val, scope.row)"
              />
            </template>
          </el-table-column>
          <el-table-column label="小计" prop="subtotal" >
            <template #default="scope">
              ¥{{ (scope.row.unitPrice * scope.row.quantity).toFixed(2) }}
            </template>
          </el-table-column>
          <el-table-column label="操作" >
            <template #default="scope">
              <el-button
                type="danger"
                icon="delete"
                size="small"
                @click="handleRemoveFeeItem(scope.$index)"
                circle
              />
            </template>
          </el-table-column>
        </el-table>
      </el-card>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button type="primary" @click="submitForm" round>确 定</el-button>
          <el-button @click="cancel" round>取 消</el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 查看套餐详情对话框 -->
    <el-dialog title="套餐详情" v-model="viewOpen" width="80%" append-to-body>
      <el-descriptions :column="2" border>
        <el-descriptions-item label="套餐名称">{{ viewData.groupName }}</el-descriptions-item>
        <el-descriptions-item label="护理等级">
          <el-tag :type="getCareLevelTagType(viewData.careLevel)">{{ getCareLevelName(viewData.careLevel) }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="房间类型">{{ viewData.roomType }}</el-descriptions-item>
        <el-descriptions-item label="房间等级">{{ viewData.roomLevel }}</el-descriptions-item>
        <el-descriptions-item label="总价">¥{{ viewData.totalMoney }}</el-descriptions-item>
        <el-descriptions-item label="优惠价">
          <span style="color: #f56c6c; font-weight: bold;">¥{{ viewData.payMoney }}</span>
        </el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag :type="viewData.status === 1 ? 'success' : 'danger'">
            {{ viewData.status === 1 ? '启用' : '停用' }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="创建时间">{{ parseTime(viewData.createAt) }}</el-descriptions-item>
        <el-descriptions-item label="描述" :span="2">{{ viewData.description }}</el-descriptions-item>
      </el-descriptions>
      
      <div style="margin-top: 20px;">
        <h4>包含的收费项目</h4>
        <el-table :data="viewData.itemList || []" style="width: 100%" v-if="viewData.itemList && viewData.itemList.length > 0">
          <el-table-column label="项目名称" prop="itemName" />
          <el-table-column label="项目类型" prop="itemType" />
          <el-table-column label="单价" prop="unitPrice">
            <template #default="scope">¥{{ scope.row.unitPrice }}</template>
          </el-table-column>
          <el-table-column label="单位" prop="unit" />
          <el-table-column label="数量" prop="quantity" />
          <el-table-column label="小计" prop="subtotal">
            <template #default="scope">¥{{ (scope.row.unitPrice * scope.row.quantity).toFixed(2) }}</template>
          </el-table-column>
        </el-table>
        <el-empty description="暂无收费项目" v-else />
      </div>
      
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="viewOpen = false" round>关 闭</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getFeeGroupList, addFeeGroup, updateFeeGroup, deleteFeeGroup, getFeeGroupDetail } from '@/api/fee'
import { getFeeItemListTplAll } from '@/api/fee'
import { CARE_LEVEL_OPTIONS as careLevelOptions, getCareLevelName } from '@/utils/careEnums'

// 组件引用
const queryFormRef = ref()
const formRef = ref()

// 响应式数据
const loading = ref(true)
const ids = ref([])
const single = ref(true)
const multiple = ref(true)
const total = ref(0)
const title = ref('')
const open = ref(false)
const viewOpen = ref(false)

// 收费套餐列表
const feeGroupList = ref([])

// 查看数据
const viewData = ref({})

// 收费项目选项
const itemListOptions = ref([])

// 护理等级选项统一维护于 @/utils/careEnums（CARE_LEVEL_OPTIONS：1自理 2半自理 3失能）

const roomTypeOptions = [
  { value: '单人间', label: '单人间' },
  { value: '双人间', label: '双人间' },
  { value: '三人间', label: '三人间' },
  { value: '多人间', label: '多人间' }
]

const roomLevelOptions = [
  { value: '普通', label: '普通' },
  { value: '高级', label: '高级' },
  { value: '豪华', label: '豪华' },
  { value: '豪华+', label: '豪华+' }
]

// 查询参数
const queryParams = reactive({
  pageNum: 1,
  pageSize: 10,
  groupName: undefined,
  careLevel: undefined,
  roomType: undefined,
  status: undefined
})

// 表单数据
const form = reactive({
  id: undefined,
  groupName: '',
  careLevel: '',
  roomType: '',
  roomLevel: '',
  totalMoney: 0,
  payMoney: 0,
  description: '',
  status: 1,
  itemList: [] // 收费项目列表
})

// 表单验证规则
const rules = {
  groupName: [{ required: true, message: '套餐名称不能为空', trigger: 'blur' }],
  careLevel: [{ required: true, message: '护理等级不能为空', trigger: 'change' }],
  roomType: [{ required: true, message: '房间类型不能为空', trigger: 'change' }],
  roomLevel: [{ required: true, message: '房间等级不能为空', trigger: 'change' }],
  totalMoney: [{ required: true, message: '总价不能为空', trigger: 'blur' }],
  payMoney: [{ required: true, message: '优惠价不能为空', trigger: 'blur' }]
}

// 获取护理等级标签样式（兼容数字编码与历史文本）
const getCareLevelTagType = (level) => {
  const name = getCareLevelName(level)
  const levelMap = {
    '自理': 'success',
    '半自理': 'warning',
    '失能': 'danger'
  }
  return levelMap[name] || 'info'
}

// 获取项目类型标签样式
const getItemTypeTagType = (type) => {
  const typeMap = {
    '住宿费': 'primary',
    '餐费': 'success',
    '护理费': 'warning',
    '医疗服务费': 'danger',
    '其他': 'info'
  }
  return typeMap[type] || 'info'
}

// 时间格式化
const parseTime = (time) => {
  if (!time) return ''
  const date = new Date(time)
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
}

// 加载收费项目选项
const loadItemListOptions = async () => {
  try {
    const response = await getFeeItemListTplAll({ pageSize: 100 })
    if (response.code === 200) {
      itemListOptions.value = response.data;
    }
  } catch (error) {
    console.error('加载收费项目选项失败:', error)
    ElMessage.error('加载收费项目选项失败')
  }
}

// 获取收费套餐列表
const getList = async () => {
  loading.value = true
  try {
    const response = await getFeeGroupList(queryParams)
    if (response.code === 200) {
      feeGroupList.value = response.data.list
      total.value = response.data.totalCount
    }
  } catch (error) {
    console.error('获取收费套餐列表失败:', error)
  } finally {
    loading.value = false
  }
}

// 搜索按钮操作
const handleQuery = () => {
  queryParams.pageNum = 1
  getList()
}

// 重置按钮操作
const resetQuery = () => {
  queryFormRef.value.resetFields()
  handleQuery()
}

// 多选框选中数据
const handleSelectionChange = (selection) => {
  ids.value = selection.map(item => item.id)
  single.value = selection.length !== 1
  multiple.value = !selection.length
}

// 排序触发
const handleSortChange = (column) => {
  // 这里可以添加排序逻辑
  console.log('排序:', column)
}

// 状态开关变化
const handleStatusChange = async (row) => {
  try {
    await updateFeeGroup(row)
    ElMessage.success('状态修改成功')
    getList()
  } catch (error) {
    console.error('状态修改失败:', error)
    ElMessage.error('状态修改失败')
    // 恢复原状态
    row.status = row.status === 1 ? 0 : 1
  }
}

// 查看按钮操作
const handleView = async (row) => {
  try {
    const response = await getFeeGroupDetail(row.id)
    if (response.code === 200) {
      viewData.value = response.data
      viewOpen.value = true
    }
  } catch (error) {
    console.error('获取套餐详情失败:', error)
    ElMessage.error('获取套餐详情失败')
  }
}

// 新增按钮操作
const handleAdd = () => {
  resetForm()
  open.value = true
  title.value = '添加收费套餐'
}

// 修改按钮操作
const handleUpdate = async (row) => {
  resetForm()
  try {
    const id = row.id ? row.id : ids.value
    const response = await getFeeGroupDetail(id)
    if (response.code === 200) {
      Object.assign(form, response.data)
      // 初始化itemList数组
      if (!form.itemList) {
        form.itemList = []
      }
      open.value = true
      title.value = '修改收费套餐'
    }
  } catch (error) {
    console.error('获取套餐详情失败:', error)
    ElMessage.error('获取套餐详情失败')
  }
}

// 删除按钮操作
const handleDelete = async (row) => {
  const feeGroupIds = row.id ? [row.id] : ids.value
  if (!feeGroupIds.length) {
    ElMessage.warning('请选择要删除的数据')
    return
  }
  try {
    await ElMessageBox.confirm('是否确认删除选中的数据？', '警告', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })

    // 批量删除
    for (const id of feeGroupIds) {
      await deleteFeeGroup(id)
    }
    ElMessage.success('删除成功')
    getList()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除失败:', error)
      ElMessage.error('删除失败')
    }
  }
}

// 导出按钮操作
const handleExport = () => {
  // 这里可以添加导出逻辑
  ElMessage.info('导出功能待实现')
}

// 添加收费项目
const handleAddFeeItem = () => {
  form.itemList.push({
    itemName: '',
    itemType: '',
    unitPrice: 0,
    unit: '',
    quantity: 1,
    subtotal: 0
  })
}

// 移除收费项目
const handleRemoveFeeItem = (index) => {
  form.itemList.splice(index, 1)
}

// 收费项目选择变化
const handleFeeItemChange = (value, row) => {
  const selectedItem = itemListOptions.value.find(item => item.itemName === value)
  if (selectedItem) {
    row.itemType = selectedItem.itemType
    row.unitPrice = selectedItem.unitPrice
    row.unit = selectedItem.unit
    row.subtotal = (row.unitPrice * row.quantity).toFixed(2)
  }
}

// 数量变化
const handleQuantityChange = (value, row) => {
  row.subtotal = (row.unitPrice * value).toFixed(2)
}

// 表单重置
const resetForm = () => {
  formRef.value?.resetFields()
  Object.assign(form, {
    id: undefined,
    groupName: '',
    careLevel: '',
    roomType: '',
    roomLevel: '',
    totalMoney: 0,
    payMoney: 0,
    description: '',
    status: 1,
    itemList: []
  })
}

// 取消按钮
const cancel = () => {
  open.value = false
  resetForm()
}

// 提交表单
const submitForm = async () => {
  if (!formRef.value) return
  
  await formRef.value.validate(async (valid) => {
    if (valid) {
      try {
        // 验证收费项目
        for (let i = 0; i < form.itemList.length; i++) {
          const item = form.itemList[i]
          if (!item.itemName) {
            ElMessage.error(`第${i + 1}个收费项目未选择`)
            return
          }
        }
        
        // 构造提交数据
        const submitData = {
          ...form,
          itemListList: form.itemList
        }
        
        if (form.id) {
          await updateFeeGroup(submitData)
          ElMessage.success('修改成功')
        } else {
          await addFeeGroup(submitData)
          ElMessage.success('新增成功')
        }
        open.value = false
        getList()
      } catch (error) {
        console.error('操作失败:', error)
        ElMessage.error('操作失败')
      }
    }
  })
}

onMounted(() => {
  getList()
  loadItemListOptions()
})
</script>

<style scoped>
.fee-group-management {
  padding: 0;
}

.mb-4 {
  margin-bottom: 20px;
}

.mb-2 {
  margin-bottom: 10px;
}

.dialog-footer {
  text-align: right;
}
</style>