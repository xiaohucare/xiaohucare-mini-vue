<template>
  <div class="meals-menus-management">
    <!-- 搜索和操作区域 -->
    <el-card class="mb-4" shadow="hover">
      <el-form :model="queryParams" ref="queryFormRef" :inline="true" label-width="80px">
        <el-form-item label="餐次类型" prop="mealType">
          <el-select v-model="queryParams.mealType" placeholder="请选择餐次类型" clearable style="width: 200px">
            <el-option v-for="opt in MEAL_TYPE_OPTIONS" :key="opt.value" :label="opt.label" :value="opt.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="菜名" prop="dishName">
          <el-input
            v-model="queryParams.dishName"
            placeholder="请输入菜名"
            clearable
            style="width: 200px"
            @keyup.enter="handleQuery"
          />
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-select v-model="queryParams.status" placeholder="请选择状态" clearable style="width: 200px">
            <el-option label="正常" :value="1" />
            <el-option label="停用" :value="0" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleQuery" round>
            <el-icon><Search /></el-icon>
            搜索
          </el-button>
          <el-button @click="resetQuery" round>
            <el-icon><Refresh /></el-icon>
            重置
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 操作按钮区域 -->
    <el-card class="mb-4" shadow="hover">
      <el-row :gutter="10" class="mb-2">
        <el-col :span="16">
          <el-button type="primary" @click="handleAdd" round>
            <el-icon><Plus /></el-icon>
            新增菜单
          </el-button>
          <el-button type="success" :disabled="single" @click="handleUpdate" round>
            <el-icon><Edit /></el-icon>
            修改
          </el-button>
          <el-button type="danger" :disabled="multiple" @click="handleDelete" round>
            <el-icon><Delete /></el-icon>
            删除
          </el-button>
          <el-button type="warning" @click="handleExport" round>
            <el-icon><Download /></el-icon>
            导出
          </el-button>
          <el-button type="info" @click="handleBatchAdd" round>
            <el-icon><DocumentCopy /></el-icon>
            批量添加
          </el-button>
        </el-col>
      </el-row>
    </el-card>

    <!-- 数据表格 -->
    <el-card shadow="hover">
      <el-table
        v-loading="loading"
        :data="menusList"
        @selection-change="handleSelectionChange"
        @sort-change="handleSortChange"
      >
        <el-table-column type="selection" width="50" align="center" />
        <el-table-column label="ID" align="center" prop="id" width="80" sortable="custom" />
        <el-table-column label="餐次类型" align="center" prop="mealType" width="110">
          <template #default="scope">
            <el-tag :type="getMealTypeTagType(scope.row.mealType)">
              {{ mealTypeLabel(scope.row.mealType) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="菜名" align="center" prop="dishName" min-width="120" />
        <el-table-column label="菜品图片" align="center" prop="dishImage" width="100">
          <template #default="scope">
            <image-preview v-if="scope.row.dishImage" :src="scope.row.dishImage" :width="60" :height="60" />
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column label="菜品描述" align="center" prop="dishDescription" min-width="150" show-overflow-tooltip />
        <el-table-column label="营养信息" align="center" prop="nutritionInfo" min-width="120" show-overflow-tooltip />
        <el-table-column label="适宜人群" align="center" prop="suitableFor" min-width="120" show-overflow-tooltip />
         <el-table-column prop="status" label="状态" width="80">
          <template #default="{ row }">
            <el-tag :type="row.status ? 'success' : 'danger'">
              {{ row.status ? '正常' : '停用' }}
            </el-tag>
          </template>
       </el-table-column>

        <el-table-column label="创建时间" align="center" prop="createAt" width="160" sortable="custom">
          <template #default="scope">
            <span>{{ parseTime(scope.row.createAt) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" align="center" width="300" class-name="small-padding fixed-width">
          <template #default="scope">
            <el-button
              size="small"
              type="text"
              @click="handleUpdate(scope.row)"
              round
            >
              <el-icon><Edit /></el-icon>
              修改
            </el-button>
            <el-button
              size="small"
              type="text"
              @click="handleDelete(scope.row)"
              round
            >
              <el-icon><Delete /></el-icon>
              删除
            </el-button>
            <el-button
              size="small"
              type="text"
              @click="handleView(scope.row)"
              round
            >
              <el-icon><View /></el-icon>
              详情
            </el-button>
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

    <!-- 添加/修改对话框 -->
    <el-dialog :title="dialog.title" v-model="dialog.visible" width="600px" append-to-body>
      <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
        <el-form-item label="餐次类型" prop="mealType">
          <el-radio-group v-model="form.mealType">
            <el-radio v-for="opt in MEAL_TYPE_OPTIONS" :key="opt.value" :label="opt.value">{{ opt.label }}</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="菜名" prop="dishName">
          <el-input v-model="form.dishName" placeholder="请输入菜名" />
        </el-form-item>
        <el-form-item label="菜品图片" prop="dishImage">
          <image-upload v-model="form.dishImage" :limit="1" />
        </el-form-item>
        <el-form-item label="菜品描述" prop="dishDescription">
          <el-input
            v-model="form.dishDescription"
            type="textarea"
            :rows="3"
            placeholder="请输入菜品描述"
          />
        </el-form-item>
        <el-form-item label="营养信息" prop="nutritionInfo">
          <el-input
            v-model="form.nutritionInfo"
            type="textarea"
            :rows="2"
            placeholder="请输入营养信息"
          />
        </el-form-item>
        <el-form-item label="适宜人群" prop="suitableFor">
          <el-input
            v-model="form.suitableFor"
            type="textarea"
            :rows="2"
            placeholder="请输入适宜人群"
          />
        </el-form-item>
        <el-form-item label="禁忌人群" prop="contraindicatedFor">
          <el-input
            v-model="form.contraindicatedFor"
            type="textarea"
            :rows="2"
            placeholder="请输入禁忌人群"
          />
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-radio-group v-model="form.status">
            <el-radio :label="1">正常</el-radio>
            <el-radio :label="0">停用</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button type="primary" @click="submitForm" round>确 定</el-button>
          <el-button @click="cancel" round>取 消</el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 批量添加对话框 -->
    <el-dialog title="批量添加菜单" v-model="batchDialog.visible" width="800px" append-to-body>
      <el-form ref="batchFormRef" :model="batchForm" label-width="100px">
        <el-form-item label="菜单模板" prop="template">
          <el-table :data="batchForm.template" style="width: 100%">
            <el-table-column label="餐次类型" prop="mealType" width="100">
              <template #default="scope">
                <el-select v-model="scope.row.mealType" placeholder="请选择">
                  <el-option v-for="opt in MEAL_TYPE_OPTIONS" :key="opt.value" :label="opt.label" :value="opt.value" />
                </el-select>
              </template>
            </el-table-column>
            <el-table-column label="菜名" prop="dishName">
              <template #default="scope">
                <el-input v-model="scope.row.dishName" placeholder="请输入菜名" />
              </template>
            </el-table-column>
            <el-table-column label="操作" width="60">
              <template #default="scope">
                <el-button
                  size="small"
                  type="text"
                  @click="removeTemplateRow(scope.$index)"
                  round
                >
                  <el-icon><Delete /></el-icon>
                  删除
                </el-button>
              </template>
            </el-table-column>
          </el-table>
          <el-button type="text" @click="addTemplateRow" round>
            <el-icon><Plus /></el-icon>
            添加菜品
          </el-button>
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button type="primary" @click="submitBatchForm" round>确 定</el-button>
          <el-button @click="batchDialog.visible = false" round>取 消</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { listMealsMenus, addMealsMenu, updateMealsMenu, delMealsMenu, batchAddMealsMenus } from '@/api/meals'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search, Refresh, Plus, Edit, Delete, Download, DocumentCopy, View } from '@element-plus/icons-vue'
import { MEAL_TYPE_OPTIONS, getMealTypeName as mealTypeLabel, getMealTypeTagType } from '@/utils/careEnums'

// 响应式数据
const loading = ref(true)
const ids = ref([])
const single = ref(true)
const multiple = ref(true)
const total = ref(0)
const menusList = ref([])
// 表单验证
const formRef = ref()
const queryParams = reactive({
  pageNum: 1,
  pageSize: 10,
  mealType: null,
  dishName: null,
  status: null
})

const form = reactive({
  id: null,
  mealType: null,
  dishName: '',
  dishImage: '',
  dishDescription: '',
  nutritionInfo: '',
  suitableFor: '',
  contraindicatedFor: '',
  status: 1
})

const rules = reactive({
  mealType: [{ required: true, message: '餐次类型不能为空', trigger: 'change' }],
  dishName: [{ required: true, message: '菜名不能为空', trigger: 'blur' }]
})

const dialog = reactive({
  visible: false,
  title: ''
})

const batchDialog = reactive({
  visible: false
})

const batchForm = reactive({
  template: [
    { mealType: 1, dishName: '' },
    { mealType: 2, dishName: '' },
    { mealType: 3, dishName: '' }
  ]
})

// 方法
const getList = async () => {
  loading.value = true
  try {
    const response = await listMealsMenus(queryParams)
    menusList.value = response.data.list || []
    total.value = response.data.totalCount || 0
  } catch (error) {
    console.error('获取菜单列表失败:', error)
  } finally {
    loading.value = false
  }
}

const handleQuery = () => {
  queryParams.pageNum = 1
  getList()
}

const resetQuery = () => {
  queryFormRef.value?.resetFields()
  handleQuery()
}

const handleSelectionChange = (selection) => {
  ids.value = selection.map(item => item.id)
  single.value = selection.length !== 1
  multiple.value = !selection.length
}

const handleSortChange = (column) => {
  if (column.prop) {
    queryParams.orderByColumn = column.prop
    queryParams.isAsc = column.order === 'ascending' ? 'asc' : 'desc'
    getList()
  }
}

const handleAdd = () => {
  resetForm()
  dialog.visible = true
  dialog.title = '添加菜单'
}

const handleUpdate = (row) => {
  resetForm()
  const menuId = row.id || ids.value[0]
  // 模拟获取菜单详情
  Object.assign(form, row)
  dialog.visible = true
  dialog.title = '修改菜单'
}

const handleDelete = (row) => {
  const menuIds = row.id || ids.value
  ElMessageBox.confirm('是否确认删除菜单编号为"' + menuIds + '"的数据项？', '警告', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    try {
      await delMealsMenu(menuIds)
      getList()
      ElMessage.success('删除成功')
    } catch (error) {
      console.error('删除失败:', error)
    }
  })
}

const handleExport = () => {
  // 导出功能实现
  ElMessage.info('导出功能开发中')
}

const handleBatchAdd = () => {
  batchDialog.visible = true
}


const submitForm = async () => {
  await formRef.value?.validate()
  try {
    if (form.id) {
      await updateMealsMenu(form)
      ElMessage.success('修改成功')
    } else {
      await addMealsMenu(form)
      ElMessage.success('新增成功')
    }
    dialog.visible = false
    getList()
  } catch (error) {
    console.error('操作失败:', error)
  }
}

const submitBatchForm = async () => {
  try {
    await batchAddMealsMenus(batchForm)
    ElMessage.success('批量添加成功')
    batchDialog.visible = false
    getList()
  } catch (error) {
    console.error('批量添加失败:', error)
  }
}

const cancel = () => {
  dialog.visible = false
  resetForm()
}

const resetForm = () => {
  form.id = null
  form.mealType = null
  form.dishName = ''
  form.dishImage = ''
  form.dishDescription = ''
  form.nutritionInfo = ''
  form.suitableFor = ''
  form.contraindicatedFor = ''
  form.status = 1
}

const addTemplateRow = () => {
  batchForm.template.push({ mealType: null, dishName: '' })
}

const removeTemplateRow = (index) => {
  batchForm.template.splice(index, 1)
}

// 餐次类型的选项/名称/标签映射统一维护于 @/utils/careEnums

// 模拟数据
// 生命周期
onMounted(() => {
  getList();
})
</script>

<style scoped>
.meals-menus-management {
  padding: 20px;
}
</style>