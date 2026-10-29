<template>
  <div class="energy-unit-tree-container">
    <div class="tree-header" v-if="showHeader">
      <h3>{{ title }}</h3>
      <div class="header-actions" v-if="showActions">
        <el-button
          v-if="showExpandToggle"
          type="text"
          size="small"
          :icon="isExpandAll ? 'ArrowDown' : 'ArrowRight'"
          @click="toggleExpandAll"
          round
        >
          {{ isExpandAll ? "收起全部" : "展开全部" }}
        </el-button>
      </div>
    </div>

    <div class="tree-content">
      <el-tree
        ref="treeRef"
        v-if="refreshTable"
        v-loading="loading"
        :data="energyUnitList"
        :props="{ children: 'children', label: 'groupName' }"
        :default-expand-all="isExpandAll"
        node-key="groupId"
        :expand-on-click-node="false"
        highlight-current
        @node-click="handleNodeClick"
        class="energy-tree"
      >
        <template #default="{ data }">
          <div class="tree-node" v-if="data && data.groupName">
            <span
              class="custom-tag type-tag"
              :class="getGroupTypeTagClass(data.groupType)"
            >
              {{ getGroupTypeName(data.groupType) }}
            </span>
            <span class="node-label">{{ data.groupName }}</span>
            <div class="node-actions" @click.stop v-if="showNodeActions">
              <el-button
                v-if="data.groupType !== 100 && showAddButton"
                type="text"
                size="small"
                icon="Plus"
                v-hasPermi="['device:energyUnit:add']"
                @click="handleAdd(data)"
                round
                >新增</el-button
              >
              <el-button
                v-if="showEditButton"
                type="text"
                size="small"
                icon="Edit"
                v-hasPermi="['device:energyUnit:edit']"
                @click="handleEdit(data)"
                round
                >修改</el-button
              >
              <el-button
                v-if="showDeleteButton"
                type="text"
                size="small"
                icon="Delete"
                v-hasPermi="['device:energyUnit:remove']"
                @click="handleDelete(data)"
                round
                >删除</el-button
              >
            </div>
          </div>
        </template>
      </el-tree>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, nextTick, watch } from "vue";
import { listEnergyUnit } from "@/api/deviceManage/energyUnit";

// Props 定义
const props = defineProps({
  // 是否显示标题栏
  showHeader: {
    type: Boolean,
    default: true,
  },
  // 标题文本
  title: {
    type: String,
    default: "用能单元结构",
  },
  // 是否显示操作按钮
  showActions: {
    type: Boolean,
    default: false,
  },
  // 是否显示展开/收起按钮
  showExpandToggle: {
    type: Boolean,
    default: false,
  },
  // 是否显示节点操作按钮
  showNodeActions: {
    type: Boolean,
    default: false,
  },
  // 是否显示新增按钮
  showAddButton: {
    type: Boolean,
    default: true,
  },
  // 是否显示编辑按钮
  showEditButton: {
    type: Boolean,
    default: true,
  },
  // 是否显示删除按钮
  showDeleteButton: {
    type: Boolean,
    default: true,
  },
  // 是否自动选中第一个节点
  autoSelectFirst: {
    type: Boolean,
    default: true,
  },
  // 是否默认展开所有节点
  defaultExpandAll: {
    type: Boolean,
    default: true,
  },
  // 容器高度
  height: {
    type: String,
    default: "100%",
  },
});

// Emits 定义
const emit = defineEmits([
  "node-click",
  "node-add",
  "node-edit",
  "node-delete",
  "tree-loaded",
]);

// 响应式数据
const energyUnitList = ref([]);
const loading = ref(true);
const refreshTable = ref(true);
const isExpandAll = ref(props.defaultExpandAll);
const treeRef = ref(null);
const selectedNode = ref(null);

// 工具函数
function getGroupTypeName(type) {
  const typeMap = {
    0: "工厂",
    10: "楼栋",
    20: "车间",
    30: "工序",
    100: "设备",
  };
  return typeMap[type] || "未知";
}

function getGroupTypeTagClass(type) {
  const classMap = {
    0: "group-factory",
    10: "group-building",
    20: "group-workshop",
    30: "group-process",
    100: "group-device",
  };
  return classMap[type] || "group-device";
}

// 树相关函数
function handleNodeClick(data) {
  if (!data || !data.groupName) return;

  selectedNode.value = data;
  emit("node-click", data);
}

function handleAdd(data) {
  emit("node-add", data);
}

function handleEdit(data) {
  emit("node-edit", data);
}

function handleDelete(data) {
  emit("node-delete", data);
}

function toggleExpandAll() {
  refreshTable.value = false;
  isExpandAll.value = !isExpandAll.value;
  nextTick(() => {
    refreshTable.value = true;
  });
}

// 加载数据
function loadData() {
  loading.value = true;
  listEnergyUnit()
    .then((response) => {
      const processTreeData = (items) => {
        if (!items || !Array.isArray(items)) return [];
        return items.map((item) => {
          const processedItem = item.data || item;
          if (
            item.children &&
            Array.isArray(item.children) &&
            item.children.length > 0
          ) {
            processedItem.children = processTreeData(item.children);
          }
          return processedItem;
        });
      };

      energyUnitList.value = processTreeData(response.data) || [];
      loading.value = false;

      // 自动选中第一个节点
      if (
        props.autoSelectFirst &&
        energyUnitList.value &&
        energyUnitList.value.length > 0
      ) {
        const firstNode = energyUnitList.value[0];
        selectedNode.value = firstNode;

        // 使用 nextTick 确保 DOM 更新后再设置选中状态
        nextTick(() => {
          if (treeRef.value) {
            treeRef.value.setCurrentKey(firstNode.groupId);
          }
        });

        emit("node-click", firstNode);
      }

      emit("tree-loaded", energyUnitList.value);
    })
    .catch(() => {
      energyUnitList.value = [];
      loading.value = false;
    });
}

// 公开方法
function refresh() {
  loadData();
}

function setCurrentNode(nodeId) {
  if (treeRef.value) {
    treeRef.value.setCurrentKey(nodeId);
  }
}

function getCurrentNode() {
  return selectedNode.value;
}

function getTreeData() {
  return energyUnitList.value;
}

// 监听 props 变化
watch(
  () => props.defaultExpandAll,
  (newVal) => {
    isExpandAll.value = newVal;
  }
);

// 暴露方法给父组件
defineExpose({
  refresh,
  setCurrentNode,
  getCurrentNode,
  getTreeData,
});

// 页面初始化
onMounted(() => {
  loadData();
});
</script>

<style lang="scss" scoped>
.energy-unit-tree-container {
  height: v-bind(height);
  display: flex;
  flex-direction: column;
  background: #ffffff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);

  .tree-header {
    padding: 16px 20px;
    border-bottom: 1px solid #e4e7ed;
    background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
    border-radius: 8px 8px 0 0;
    display: flex;
    justify-content: space-between;
    align-items: center;

    h3 {
      margin: 0;
      color: #2c3e50;
      font-size: 16px;
      font-weight: 600;
    }

    .header-actions {
      display: flex;
      gap: 8px;
    }
  }

  .tree-content {
    flex: 1;
    padding: 16px;
    overflow: hidden;
  }
}

// 树形组件样式
.energy-tree {
  background: #f8f9fa;
  border-radius: 8px;
  padding: 8px;

  :deep(.el-tree-node__content) {
    height: 44px;
    padding: 0 12px;
    border-radius: 8px;
    margin-bottom: 6px;
    transition: all 0.3s ease;
    background: #ffffff;
    border: 1px solid #e9ecef;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);

    &:hover {
      background: linear-gradient(135deg, #e3f2fd 0%, #f0f8ff 100%);
      border: 1px solid #0d4b44;
      box-shadow: 0 2px 8px rgba(79, 218, 202, 0.15);
      transform: translateY(-1px);
    }

    &.is-current {
      background: linear-gradient(135deg, #4fdaca 0%, #32b7cb 100%);
      border-color: #32b7cb;
      color: #ffffff;
      box-shadow: 0 4px 12px rgba(79, 218, 202, 0.3);

      .node-label {
        color: #ffffff;
        font-weight: 600;
      }

      .type-tag {
        background: rgba(255, 255, 255, 0.2) !important;
        color: #ffffff !important;
        border: 1px solid rgba(255, 255, 255, 0.3) !important;
      }
    }
  }

  .tree-node {
    display: flex;
    align-items: center;
    gap: 10px;
    width: 100%;

    .type-tag {
      flex-shrink: 0;
      font-weight: 500;
      font-size: 11px;
      padding: 2px 8px;
      border-radius: 4px;
    }

    .node-label {
      flex: 1;
      font-size: 14px;
      color: #2c3e50;
      font-weight: 500;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .node-actions {
      flex-shrink: 0;
      display: flex;
      gap: 1px;
      opacity: 1;
      transition: all 0.3s ease;

      .el-button {
        padding: 2px 6px !important;
        font-size: 11px !important;
        height: 22px !important;
        min-width: auto !important;
        border-radius: 3px !important;
        font-weight: 500 !important;
        transition: all 0.3s ease !important;

        &.el-button--text {
          color: #16a5b7;
          background: transparent;
          border: none;

          &:hover {
            color: #32b7cb;
            background: rgba(79, 218, 202, 0.1);
          }

          &:active {
            color: #2aa3b8;
            background: rgba(79, 218, 202, 0.2);
          }
        }
      }
    }

    &:hover .node-actions {
      opacity: 1;
    }
  }

  // 树节点展开/收起图标样式
  :deep(.el-tree-node__expand-icon) {
    color: #6c757d;
    font-size: 14px;
    transition: all 0.3s ease;

    &:hover {
      color: #4fdaca;
    }
  }
}

// 不同类型标签的颜色样式 - 统一使用系统色
.custom-tag {
  &.group-factory,
  &.group-building,
  &.group-workshop,
  &.group-process,
  &.group-device {
    background: linear-gradient(135deg, #16a5b7 0%, #0d8a9a 100%);
    color: #ffffff;
    border: 1px solid #16a5b7;
  }
}
</style>
