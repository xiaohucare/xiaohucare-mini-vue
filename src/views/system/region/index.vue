<template>
  <div class="app-container">
    <!-- 搜索区域 -->
    <el-form :model="queryParams" ref="queryRef" :inline="true" v-show="showSearch">
      <el-form-item label="地区名称" prop="name">
        <el-input
          v-model="queryParams.name"
          placeholder="请输入地区名称"
          clearable
          style="width: 200px"
          @keyup.enter="handleQuery"
        />
      </el-form-item>
      <el-form-item>
        <el-button type="primary" icon="Search" @click="handleQuery">搜索</el-button>
        <el-button icon="Refresh" @click="resetQuery">重置</el-button>
      </el-form-item>
    </el-form>

    <!-- 操作按钮 -->
    <el-row :gutter="10" class="mb8">
      <el-col :span="1.5">
        <el-button
          type="primary"
          plain
          icon="Plus"
          @click="handleAdd"
          v-hasPermi="['system:region:add']"
        >新增</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="info"
          plain
          icon="Sort"
          @click="toggleExpandAll"
        >展开/折叠</el-button>
      </el-col>
      <right-toolbar v-model:showSearch="showSearch" @queryTable="getList"></right-toolbar>
    </el-row>

    <!-- 表格区域 -->
    <el-table
      v-if="refreshTable"
      v-loading="loading"
      :data="regionList"
      row-key="id"
      :default-expand-all="isExpandAll"
      :tree-props="{ children: 'children', hasChildren: 'hasChildren' }"
      lazy
      :load="loadNode"
    >
      <el-table-column prop="name" label="地区名称" min-width="260"></el-table-column>
      <el-table-column prop="type" label="类型"  min-width="120">
        <template #default="scope">
          <el-tag v-if="scope.row.type === 1" type="primary">省</el-tag>
          <el-tag v-else-if="scope.row.type === 2" type="success">市</el-tag>
          <el-tag v-else-if="scope.row.type === 3" type="warning">区</el-tag>
          <el-tag v-else type="info">未知</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" align="center" min-width="260" class-name="small-padding fixed-width">
        <template #default="scope">
          <el-button link type="primary" icon="Edit" @click="handleUpdate(scope.row)" v-hasPermi="['system:region:edit']">修改</el-button>
          <el-button link type="primary" icon="Plus" @click="handleAdd(scope.row)" v-hasPermi="['system:region:add']">新增</el-button>
          <el-button v-if="scope.row.parentId != 0" link type="primary" icon="Delete" @click="handleDelete(scope.row)" v-hasPermi="['system:region:remove']">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 添加或修改地区对话框 -->
    <el-dialog :title="title" v-model="open" width="600px" append-to-body>
      <el-form ref="regionRef" :model="form" :rules="rules" label-width="80px">
        <el-row>
          <el-col :span="24" v-if="form.parentId !== 0">
            <el-form-item label="上级地区" prop="parentId">
              <el-tree-select
                v-model="form.parentId"
                :data="regionOptions"
                :props="{ value: 'id', label: 'name', children: 'children' }"
                value-key="id"
                placeholder="选择上级地区"
                check-strictly
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="地区名称" prop="name">
              <el-input v-model="form.name" placeholder="请输入地区名称" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="地区类型" prop="type">
              <el-select v-model="form.type" placeholder="请选择类型" style="width: 100%">
                <el-option label="省" :value="1" />
                <el-option label="市" :value="2" />
                <el-option label="区" :value="3" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="排序">
              <el-input-number v-model="form.orderNum" :min="0" :max="999" style="width: 100%" />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button type="primary" @click="submitForm" :loading="submitLoading">确 定</el-button>
          <el-button @click="cancel">取 消</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup name="Region">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { listRegion, listRegionByParentId, getRegion, addRegion, updateRegion, delRegion } from '@/api/system/region'

const { proxy } = getCurrentInstance()

// 响应式数据
const regionList = ref([])
const regionOptions = ref([])
const loading = ref(false)
const showSearch = ref(true)
const open = ref(false)
const title = ref('')
const submitLoading = ref(false)
const refreshTable = ref(true)
const isExpandAll = ref(false)

// 查询参数
const queryParams = ref({
  pageNum: 1,
  pageSize: 100,
  name: undefined,
  parentId: 1  // 默认查询中国下的省份
})

// 表单数据
const initForm = () => ({
  id: undefined,
  parentId: 1,  // 默认parentId为1（中国）
  name: undefined,
  type: 1,
  orderNum: 0
})
const form = ref(initForm())

// 表单校验规则
const rules = {
  name: [{ required: true, message: '地区名称不能为空', trigger: 'blur' }],
  type: [{ required: true, message: '地区类型不能为空', trigger: 'change' }]
}

const queryRef = ref(null)
const regionRef = ref(null)

// 获取地区列表
function getList() {
  loading.value = true
  listRegion(queryParams.value).then(response => {
    const data = response.data
    const list = data.records || data.list || []
    // 为每个节点标记是否有子节点（省和市可能有子节点，区没有）
    list.forEach(item => {
      if (item.type < 3) {
        item.hasChildren = true
      } else {
        item.hasChildren = false
      }
    })
    regionList.value = list
    loading.value = false
  }).catch(() => {
    loading.value = false
  })
}

// 懒加载子节点
function loadNode(row, treeNode, resolve) {
  listRegionByParentId(row.id).then(response => {
    const list = response.data || []
    // 为子节点标记是否有子节点
    list.forEach(item => {
      if (item.type < 3) {
        item.hasChildren = true
      } else {
        item.hasChildren = false
      }
    })
    resolve(list)
  }).catch(() => {
    resolve([])
  })
}

// 获取地区树（用于下拉选择）
function getRegionTree() {
  listRegion({ pageNum: 1, pageSize: 1000 }).then(response => {
    const data = response.data
    const list = data.records || data.list || []
    regionOptions.value = proxy.handleTree(list, 'id', 'parentId')
  })
}

// 搜索按钮操作
function handleQuery() {
  queryParams.value.pageNum = 1
  getList()
}

// 重置按钮操作
function resetQuery() {
  queryRef.value?.resetFields()
  handleQuery()
}

// 新增按钮操作
function handleAdd(row) {
  form.value = initForm()
  if (row && row.id) {
    form.value.parentId = row.id
  }
  getRegionTree()
  open.value = true
  title.value = '添加地区'
}

// 修改按钮操作
function handleUpdate(row) {
  form.value = initForm()
  getRegion(row.id).then(response => {
    form.value = response.data || initForm()
    getRegionTree()
    open.value = true
    title.value = '修改地区'
  })
}

// 提交按钮
function submitForm() {
  regionRef.value?.validate(valid => {
    if (valid) {
      submitLoading.value = true
      if (form.value.id) {
        updateRegion(form.value).then(() => {
          ElMessage.success('修改成功')
          open.value = false
          getList()
        }).finally(() => {
          submitLoading.value = false
        })
      } else {
        addRegion(form.value).then(() => {
          ElMessage.success('新增成功')
          open.value = false
          getList()
        }).finally(() => {
          submitLoading.value = false
        })
      }
    }
  })
}

// 取消按钮
function cancel() {
  open.value = false
}

// 删除按钮操作
function handleDelete(row) {
  ElMessageBox.confirm('是否确认删除地区名称为"' + row.name + '"的数据项？', '警告', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    return delRegion(row.id)
  }).then(() => {
    getList()
    ElMessage.success('删除成功')
  }).catch(() => {})
}

// 展开/折叠操作
function toggleExpandAll() {
  refreshTable.value = false
  isExpandAll.value = !isExpandAll.value
  proxy.$nextTick(() => {
    refreshTable.value = true
  })
}

onMounted(() => {
  getList()
})
</script>
