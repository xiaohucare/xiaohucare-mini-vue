<template>
  <div class="meals-package-management">
    <!-- 搜索区域 -->
    <el-card class="mb-4" shadow="hover">
      <el-form :model="queryParams" ref="queryFormRef" :inline="true" label-width="80px">
        <el-form-item label="套餐名称" prop="packageName">
          <el-input
            v-model="queryParams.packageName"
            placeholder="请输入套餐名称"
            clearable
            style="width: 200px"
            @keyup.enter="handleQuery"
          />
        </el-form-item>
        <el-form-item label="餐次类型" prop="mealType">
          <el-select v-model="queryParams.mealType" placeholder="请选择餐次类型" clearable style="width: 200px">
            <el-option v-for="opt in MEAL_TYPE_OPTIONS" :key="opt.value" :label="opt.label" :value="opt.value" />
          </el-select>
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
            新增套餐
          </el-button>
          <el-button type="success" :disabled="single" @click="handleUpdate" round>
            <el-icon><Edit /></el-icon>
            修改
          </el-button>
          <el-button type="danger" :disabled="multiple" @click="handleDelete" round>
            <el-icon><Delete /></el-icon>
            删除
          </el-button>
        </el-col>
      </el-row>
    </el-card>

    <!-- 数据表格 -->
    <el-card shadow="hover">
      <el-table v-loading="loading" :data="packageList" @selection-change="handleSelectionChange">
        <el-table-column type="selection" width="50" align="center" />
        <el-table-column label="ID" align="center" prop="id" width="80" />
        <el-table-column label="套餐图片" align="center" prop="packageImage" width="100">
          <template #default="scope">
            <image-preview v-if="scope.row.packageImage" :src="scope.row.packageImage" :width="60" :height="60" />
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column label="套餐名称" align="center" prop="packageName" min-width="120" />
        <el-table-column label="餐次类型" align="center" prop="mealType" width="100">
          <template #default="scope">
            <el-tag :type="getMealTypeTagType(scope.row.mealType)">{{ mealTypeLabel(scope.row.mealType) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="包含菜品" align="center" min-width="220">
          <template #default="scope">
            <el-tag
              v-for="name in getDishNames(scope.row.menuIds)"
              :key="name"
              size="small"
              class="dish-tag"
            >{{ name }}</el-tag>
            <span v-if="!getDishNames(scope.row.menuIds).length">-</span>
          </template>
        </el-table-column>
        <el-table-column label="价格" align="center" prop="price" width="100">
          <template #default="scope">
            <span>￥{{ scope.row.price }}</span>
          </template>
        </el-table-column>
        <el-table-column label="状态" align="center" prop="status" width="80">
          <template #default="scope">
            <el-tag :type="scope.row.status === 1 ? 'success' : 'danger'">
              {{ scope.row.status === 1 ? '正常' : '停用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" align="center" width="220" class-name="small-padding fixed-width">
          <template #default="scope">
            <el-button size="small" type="text" @click="handleUpdate(scope.row)" round>
              <el-icon><Edit /></el-icon>
              修改
            </el-button>
            <el-button size="small" type="text" @click="handleView(scope.row)" round>
              <el-icon><View /></el-icon>
              详情
            </el-button>
            <el-button size="small" type="text" @click="handleDelete(scope.row)" round>
              <el-icon><Delete /></el-icon>
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <pagination
        v-show="total > 0"
        :total="total"
        v-model:page="queryParams.pageNum"
        v-model:limit="queryParams.pageSize"
        @pagination="getList"
      />
    </el-card>

    <!-- 添加/修改对话框 -->
    <el-dialog :title="dialog.title" v-model="dialog.visible" width="90%" append-to-body>
      <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
        <el-form-item label="套餐名称" prop="packageName">
          <el-input v-model="form.packageName" placeholder="请输入套餐名称" />
        </el-form-item>
        <el-form-item label="餐次类型" prop="mealType">
          <el-radio-group v-model="form.mealType" placeholder="请选择餐次类型" style="width: 100%">
            <el-radio v-for="opt in MEAL_TYPE_OPTIONS" :key="opt.value" :label="opt.value">{{ opt.label }}</el-radio>
          </el-radio-group>
        </el-form-item>
        
        <el-form-item label="套餐图片" prop="packageImage">
          <image-upload v-model="form.packageImage" :limit="1" />
        </el-form-item>
        <el-form-item label="包含菜品" prop="menuIds">
          <div class="menu-select">
            <div class="menu-select__toolbar">
              <span class="menu-select__tip">已选 {{ form.menuIds.length }} / {{ menuOptions.length }}</span>
              <span class="menu-select__ops">
                <el-button link type="primary" @click="selectAllMenus">全选</el-button>
                <el-button link type="info" @click="clearSelectedMenus">清空</el-button>
              </span>
            </div>
            <el-scrollbar v-if="menuOptions.length" max-height="280px">
              <el-checkbox-group v-model="form.menuIds" class="menu-grid">
                <div
                  v-for="item in menuOptions"
                  :key="item.id"
                  class="menu-tile"
                  :class="{ 'is-active': form.menuIds.includes(item.id) }"
                  @click="toggleMenu(item.id)"
                >
                  <el-checkbox :value="item.id" @click.stop>
                    <div class="tile-content">
                      <image-preview v-if="item.dishImage" :src="item.dishImage" :width="56" :height="56" class="tile-img" />
                      <div v-else class="tile-img tile-img--empty">
                        <el-icon><Picture /></el-icon>
                      </div>
                      <div class="tile-info">
                        <span class="tile-name">{{ item.dishName }}</span>
                        <el-tag size="small" :type="getMealTypeTagType(item.mealType)">{{ mealTypeLabel(item.mealType) }}</el-tag>
                      </div>
                    </div>
                  </el-checkbox>
                </div>
              </el-checkbox-group>
            </el-scrollbar>
            <el-empty v-else description="暂无可选菜品" :image-size="60" />
          </div>
        </el-form-item>
        <el-form-item label="套餐价格" prop="price">
          <el-input-number v-model="form.price" :min="0" :precision="2" :step="1" style="width: 200px" />
        </el-form-item>
        <el-form-item label="套餐描述" prop="description">
          <el-input v-model="form.description" type="textarea" :rows="3" placeholder="请输入套餐描述" />
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

    <!-- 详情对话框 -->
    <el-dialog title="套餐详情" v-model="viewDialog.visible" width="600px" append-to-body>
      <el-descriptions :column="1" border>
        <el-descriptions-item label="套餐名称">{{ viewDialog.data.packageName }}</el-descriptions-item>
        <el-descriptions-item label="餐次类型">{{ mealTypeLabel(viewDialog.data.mealType) }}</el-descriptions-item>
        <el-descriptions-item label="套餐图片">
          <image-preview v-if="viewDialog.data.packageImage" :src="viewDialog.data.packageImage" :width="100" :height="100" />
          <span v-else>-</span>
        </el-descriptions-item>
        <el-descriptions-item label="包含菜品">
          <el-tag v-for="name in getDishNames(viewDialog.data.menuIds)" :key="name" class="dish-tag">{{ name }}</el-tag>
          <span v-if="!getDishNames(viewDialog.data.menuIds).length">-</span>
        </el-descriptions-item>
        <el-descriptions-item label="套餐价格">￥{{ viewDialog.data.price }}</el-descriptions-item>
        <el-descriptions-item label="套餐描述">{{ viewDialog.data.description }}</el-descriptions-item>
        <el-descriptions-item label="状态">{{ viewDialog.data.status === 1 ? '正常' : '停用' }}</el-descriptions-item>
      </el-descriptions>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import {
  listMealsPackages,
  addMealsPackage,
  updateMealsPackage,
  delMealsPackage,
  listMealsMenus
} from '@/api/meals'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search, Refresh, Plus, Edit, Delete, View, Picture } from '@element-plus/icons-vue'
import { MEAL_TYPE_OPTIONS, getMealTypeName as mealTypeLabel, getMealTypeTagType } from '@/utils/careEnums'

const loading = ref(false)
const ids = ref([])
const single = ref(true)
const multiple = ref(true)
const total = ref(0)
const packageList = ref([])
const menuOptions = ref([])

const queryFormRef = ref()
const formRef = ref()

const queryParams = reactive({
  pageNum: 1,
  pageSize: 10,
  packageName: null,
  mealType: null,
  status: null
})

const form = reactive({
  id: null,
  packageName: '',
  mealType: null,
  packageImage: '',
  menuIds: [],
  price: 0,
  description: '',
  status: 1
})

const rules = reactive({
  packageName: [{ required: true, message: '套餐名称不能为空', trigger: 'blur' }],
  mealType: [{ required: true, message: '餐次类型不能为空', trigger: 'change' }],
  menuIds: [{ required: true, type: 'array', min: 1, message: '请至少选择一个菜品', trigger: 'change' }]
})

const dialog = reactive({ visible: false, title: '' })
const viewDialog = reactive({ visible: false, data: {} })

// 根据菜单ID列表获取菜品名称
const getDishNames = (menuIds) => {
  if (!menuIds || !menuIds.length) return []
  return menuIds.map(id => {
    const menu = menuOptions.value.find(m => m.id === id)
    return menu ? menu.dishName : `#${id}`
  })
}

const getList = async () => {
  loading.value = true
  try {
    const response = await listMealsPackages(queryParams)
    packageList.value = response.data.list || []
    total.value = response.data.totalCount || 0
  } catch (error) {
    console.error('获取套餐列表失败:', error)
  } finally {
    loading.value = false
  }
}

// 加载可选菜品（菜单）列表，用于套餐组合
const loadMenuOptions = async () => {
  try {
    const response = await listMealsMenus({ pageNum: 1, pageSize: 1000, status: 1 })
    menuOptions.value = response.data.list || []
  } catch (error) {
    console.error('获取菜单选项失败:', error)
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

const handleAdd = () => {
  resetForm()
  dialog.visible = true
  dialog.title = '添加套餐'
}

const handleUpdate = (row) => {
  resetForm()
  const data = row.id ? row : packageList.value.find(p => p.id === ids.value[0])
  Object.assign(form, { ...data, menuIds: data.menuIds ? [...data.menuIds] : [] })
  dialog.visible = true
  dialog.title = '修改套餐'
}

const handleView = (row) => {
  viewDialog.data = { ...row, menuIds: row.menuIds || [] }
  viewDialog.visible = true
}

const handleDelete = (row) => {
  const packageIds = row.id || ids.value
  ElMessageBox.confirm('是否确认删除套餐编号为"' + packageIds + '"的数据项？', '警告', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    try {
      await delMealsPackage(packageIds)
      getList()
      ElMessage.success('删除成功')
    } catch (error) {
      console.error('删除失败:', error)
    }
  }).catch(() => {})
}

const submitForm = async () => {
  await formRef.value?.validate()
  try {
    if (form.id) {
      await updateMealsPackage(form)
      ElMessage.success('修改成功')
    } else {
      await addMealsPackage(form)
      ElMessage.success('新增成功')
    }
    dialog.visible = false
    getList()
  } catch (error) {
    console.error('操作失败:', error)
  }
}

const cancel = () => {
  dialog.visible = false
  resetForm()
}

const resetForm = () => {
  form.id = null
  form.packageName = ''
  form.mealType = null
  form.packageImage = ''
  form.menuIds = []
  form.price = 0
  form.description = ''
  form.status = 1
}

// 切换单个菜品的勾选状态（卡片整体可点击）
const toggleMenu = (id) => {
  const idx = form.menuIds.indexOf(id)
  if (idx > -1) {
    form.menuIds.splice(idx, 1)
  } else {
    form.menuIds.push(id)
  }
}

// 全选所有菜品
const selectAllMenus = () => {
  form.menuIds = menuOptions.value.map(item => item.id)
}

// 清空已选菜品
const clearSelectedMenus = () => {
  form.menuIds = []
}

// 餐次类型的选项/名称/标签映射统一维护于 @/utils/careEnums

onMounted(() => {
  loadMenuOptions()
  getList()
})
</script>

<style scoped>
.meals-package-management {
  padding: 20px;
}

.dish-tag {
  margin: 2px 4px 2px 0;
}

/* 包含菜品：卡片平铺勾选 */
.menu-select {
  width: 100%;
  border: 1px solid #dcdfe6;
  border-radius: 6px;
  padding: 8px 10px;
}

.menu-select__toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.menu-select__tip {
  font-size: 13px;
  color: #909399;
}

.menu-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
}

.menu-tile {
  border: 1px solid #e4e7ed;
  border-radius: 6px;
  padding: 6px 8px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.menu-tile:hover {
  border-color: #c6e2ff;
  background: #f5f9ff;
}

.menu-tile.is-active {
  border-color: #409eff;
  background: #ecf5ff;
}

.menu-tile :deep(.el-checkbox) {
  height: auto;
  margin-right: 0;
}

.menu-tile :deep(.el-checkbox__label) {
  width: 100%;
  padding-left: 8px;
}

.tile-content {
  display: flex;
  align-items: center;
  gap: 8px;
}

.tile-img {
  width: 56px;
  height: 56px;
  border-radius: 4px;
  overflow: hidden;
  flex-shrink: 0;
}

.tile-img--empty {
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f5f7fa;
  color: #c0c4cc;
  font-size: 22px;
}

.tile-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
  overflow: hidden;
}

.tile-name {
  font-size: 14px;
  color: #303133;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

@media (max-width: 768px) {
  .menu-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
