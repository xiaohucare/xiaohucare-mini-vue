<template>
  <div class="app-container">

    <!-- 顶部操作栏 -->
    <el-card shadow="never" class="search-card">
      <el-form :model="queryParams" ref="queryFormRef" inline>
        <el-form-item label="套餐名称" prop="packageName">
          <el-input v-model="queryParams.packageName" placeholder="请输入套餐名称" clearable style="width:160px" @keyup.enter="handleQuery" />
        </el-form-item>
        <el-form-item label="适用护理等级" prop="careLevel">
          <el-select v-model="queryParams.careLevel" placeholder="全部" clearable style="width:120px">
            <el-option v-for="t in CARE_LEVEL_OPTIONS" :key="t.value" :label="t.label" :value="t.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-select v-model="queryParams.status" placeholder="全部" clearable style="width:100px">
            <el-option label="启用" :value="1" />
            <el-option label="禁用" :value="0" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleQuery"><el-icon><Search /></el-icon>搜索</el-button>
          <el-button @click="resetQuery"><el-icon><Refresh /></el-icon>重置</el-button>
        </el-form-item>
      </el-form>
      <div class="toolbar">
        <el-button type="primary" @click="handleAdd"><el-icon><Plus /></el-icon>新增套餐</el-button>
        <el-button type="danger" plain :disabled="!selectedIds.length" @click="handleBatchDelete">
          <el-icon><Delete /></el-icon>批量删除
        </el-button>
        <el-radio-group v-model="viewMode" size="small" style="margin-left:auto">
          <el-radio-button label="card"><el-icon><Grid /></el-icon></el-radio-button>
          <el-radio-button label="table"><el-icon><List /></el-icon></el-radio-button>
        </el-radio-group>
      </div>
    </el-card>

    <!-- 卡片视图：CSS Grid auto-fill 按容器实际宽度自适应列数，
         每列不低于 minmax 下限，侧栏折叠/窗口变窄时是先减列而不是压瘪卡片 -->
    <div v-if="viewMode === 'card'" v-loading="loading">
      <el-empty v-if="!packageList.length" description="暂无套餐，点击【新增套餐】创建" />
      <div v-else class="pkg-grid">
        <el-card
          v-for="pkg in packageList"
          :key="pkg.id"
          class="pkg-card"
          :class="[`pkg-card--${getPkgTheme(pkg)}`, pkg.status !== 1 ? 'pkg-card--disabled' : '']"
          shadow="hover"
          :body-style="{ padding: '0' }"
        >
          <!-- 封面 / 主题头部 -->
          <div class="pkg-card__cover" :class="`pkg-card__cover--${getPkgTheme(pkg)}`">
            <img v-if="pkg.coverImage" :src="pkg.coverImage" class="pkg-card__cover-img" alt="" />
            <div v-else class="pkg-card__cover-icon"><el-icon :size="30"><House /></el-icon></div>
            <el-tag v-if="pkg.recommended === 1" class="pkg-card__ribbon" type="danger" size="small" effect="dark">推荐</el-tag>
            <span v-if="pkg.status !== 1" class="pkg-card__off">已停用</span>
            <div class="pkg-card__cover-actions">
              <el-switch :model-value="pkg.status === 1" size="small" @change="(val) => handleToggle(pkg, val)" />
              <el-dropdown trigger="click" @command="cmd => handleCardCommand(cmd, pkg)">
                <el-icon class="more-btn"><MoreFilled /></el-icon>
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item command="edit"><el-icon><Edit /></el-icon>编辑</el-dropdown-item>
                    <el-dropdown-item command="copy"><el-icon><CopyDocument /></el-icon>复制</el-dropdown-item>
                    <el-dropdown-item command="delete" divided style="color:#F56C6C"><el-icon><Delete /></el-icon>删除</el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
            </div>
          </div>

          <div class="pkg-card__body">
            <div class="pkg-card__title" @click="handleView(pkg)">{{ pkg.comboName }}</div>
            <div class="pkg-card__desc">{{ pkg.description || '暂无描述' }}</div>

            <!-- 标签行：适用护理等级 + 房型 / 性别 / 面积 / 可住 -->
            <div class="pkg-card__tags">
              <el-tag v-for="lv in splitSuitable(pkg.suitableFor)" :key="lv" size="small" type="primary" effect="plain">{{ getCareLevelName(lv) }}</el-tag>
              <el-tag v-if="!splitSuitable(pkg.suitableFor).length" size="small" type="info" effect="plain">不限等级</el-tag>
              <span class="chip"><el-icon><House /></el-icon>{{ pkg.roomType || getRoomModeLabel(pkg.roomMode) }}</span>
              <span class="chip">{{ getGenderLabel(pkg.genderRequired) }}</span>
              <span v-if="pkg.roomArea" class="chip">{{ pkg.roomArea }}</span>
              <span v-if="Number(pkg.maxResidents) > 1" class="chip">可住 {{ pkg.maxResidents }} 人</span>
            </div>

            <!-- 价格带：突出月价 + 年/日价 + 押金/人气 -->
            <div class="pkg-card__price">
              <div class="price-main">
                <span class="price-num">¥{{ pkg.monthPrice || 0 }}</span>
                <span class="price-unit">/月</span>
              </div>
              <div class="price-side">
                <div class="price-row">
                  <span>年 ¥{{ pkg.yearPrice || 0 }}</span><span class="dot">·</span><span>日 ¥{{ pkg.dayPrice || 0 }}</span>
                </div>
                <div class="price-row price-row--sub">
                  <span><el-icon><Wallet /></el-icon>押金 ¥{{ pkg.depositAmount || 0 }}</span>
                  <span class="dot">·</span>
                  <span><el-icon><Star /></el-icon>人气 {{ pkg.popularity || 0 }}</span>
                </div>
              </div>
            </div>

            <!-- 收费类目标签 -->
            <div class="pkg-card__items">
              <div class="items-title">
                包含收费类目（{{ (pkg.feeItemVoList || []).length }}项）
              </div>
              <div class="items-tags">
                <el-tooltip
                  v-for="item in (pkg.feeItemVoList || []).slice(0, 4)"
                  :key="item.id"
                  :content="`${item.itemName}：¥${item.unitPrice} / ${getChargeModeLabel(item.chargeMode)}`"
                  placement="top"
                >
                  <el-tag
                    :type="getItemTypeColor(item.itemType)"
                    size="small"
                    effect="plain"
                    class="item-tag"
                  >
                    <span v-if="item.mandatory === 1" class="mandatory-dot">*</span>{{ item.itemName }}
                  </el-tag>
                </el-tooltip>
                <el-tag
                  v-if="(pkg.feeItemVoList || []).length > 4"
                  size="small" type="info" effect="plain"
                  style="cursor:pointer"
                  @click="handleView(pkg)"
                >
                  +{{ pkg.feeItemVoList.length - 4 }}项
                </el-tag>
                <span v-if="!(pkg.feeItemVoList || []).length" class="no-items">未配置类目</span>
              </div>
            </div>

            <div class="pkg-card__footer">
              <el-button size="small" @click="handleView(pkg)">查看详情</el-button>
              <el-button size="small" type="primary" @click="handleUpdate(pkg)">编辑套餐</el-button>
            </div>
          </div>
        </el-card>
      </div>
      <div style="margin-top:16px;text-align:right" v-if="total > 0">
        <pagination :total="total" v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize" @pagination="getList" />
      </div>
    </div>

    <!-- 表格视图 -->
    <el-card v-else shadow="never">
      <el-table v-loading="loading" :data="packageList" stripe border @selection-change="selectionChange">
        <el-table-column type="selection" width="50" align="center" />
        <el-table-column label="套餐名称" prop="comboName" min-width="150">
          <template #default="{ row }">
            <span class="pkg-name" @click="handleView(row)">{{ row.comboName }}</span>
            <el-tag v-if="row.recommended === 1" type="danger" size="small" effect="dark" style="margin-left:4px">推荐</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="适用护理等级" prop="suitableFor" width="150" align="center">
          <template #default="{ row }">
            <el-tag v-for="lv in splitSuitable(row.suitableFor)" :key="lv" type="primary" size="small" effect="plain" style="margin:1px">{{ getCareLevelName(lv) }}</el-tag>
            <span v-if="!splitSuitable(row.suitableFor).length" class="text-muted">不限</span>
          </template>
        </el-table-column>
        <el-table-column label="房间类型" prop="roomType" width="100" align="center">
          <template #default="{ row }"><span>{{ row.roomType || '-' }}</span></template>
        </el-table-column>
        <el-table-column label="计费周期" prop="chargeCycle" width="100" align="center">
          <template #default="{ row }">
            <el-tag type="warning" size="small" effect="plain">{{ getChargeCycleName(row.chargeCycle) || '按天收费' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="押金(元)" prop="depositAmount" width="100" align="right">
          <template #default="{ row }"><span class="deposit-text">¥{{ row.depositAmount || 0 }}</span></template>
        </el-table-column>
        <el-table-column label="年/月/日价" width="180" align="right">
          <template #default="{ row }"><span class="price-text">¥{{ row.yearPrice || 0 }} / ¥{{ row.monthPrice || 0 }} / ¥{{ row.dayPrice || 0 }}</span></template>
        </el-table-column>
        <el-table-column label="收费类目" width="200">
          <template #default="{ row }">
            <div class="table-tags">
              <el-tag v-for="item in (row.feeItemVoList || []).slice(0,3)" :key="item.id"
                size="small" :type="getItemTypeColor(item.itemType)" effect="plain" style="margin:1px">
                {{ item.itemName }}
              </el-tag>
              <el-tag v-if="(row.feeItemVoList || []).length > 3" size="small" type="info" effect="plain">
                +{{ row.feeItemVoList.length - 3 }}
              </el-tag>
              <span v-if="!(row.feeItemVoList || []).length" class="text-muted">未配置</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="状态" prop="status" width="80" align="center">
          <template #default="{ row }">
            <el-switch :model-value="row.status === 1" size="small" @change="(val) => handleToggle(row, val)" />
          </template>
        </el-table-column>
        <el-table-column label="排序" prop="sortOrder" width="70" align="center" />
        <el-table-column label="操作" width="180" align="center" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" size="small" @click="handleView(row)"><el-icon><View /></el-icon>详情</el-button>
            <el-button link type="primary" size="small" @click="handleUpdate(row)"><el-icon><Edit /></el-icon>编辑</el-button>
            <el-button link type="danger" size="small" @click="handleDelete(row)"><el-icon><Delete /></el-icon>删除</el-button>
          </template>
        </el-table-column>
      </el-table>
      <pagination v-show="total > 0" :total="total" v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize" @pagination="getList" />
    </el-card>

    <!-- ========== 新增/编辑套餐弹窗 ========== -->
    <el-dialog v-model="formVisible" :title="formTitle" width="90%" :close-on-click-modal="false" destroy-on-close>
      <el-form :model="form" :rules="formRules" ref="formRef" label-width="110px">
        <el-divider content-position="left"><el-icon><InfoFilled /></el-icon> 基础信息</el-divider>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="套餐名称" prop="comboName">
              <el-input v-model="form.comboName" placeholder="例如：自理长者康养套餐" maxlength="30" show-word-limit />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="适用护理等级" prop="suitableFor">
              <el-select v-model="suitableForArr" multiple collapse-tags collapse-tags-tooltip placeholder="不选表示适用全部护理等级" style="width:100%">
                <el-option v-for="t in CARE_LEVEL_OPTIONS" :key="t.value" :label="t.label" :value="t.value" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item label="年费价格" prop="yearPrice">
              <el-input-number v-model="form.yearPrice" :min="0" :precision="2" style="width:100%" placeholder="元/年" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="月费价格" prop="monthPrice">
              <el-input-number v-model="form.monthPrice" :min="0" :precision="2" style="width:100%" placeholder="元/月" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="日费价格" prop="dayPrice">
              <el-input-number v-model="form.dayPrice" :min="0" :precision="2" style="width:100%" placeholder="元/天" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="6">
            <el-form-item label="计费周期" prop="chargeCycle">
              <el-select v-model="form.chargeCycle" placeholder="请选择" style="width:100%">
                <el-option v-for="opt in CHARGE_CYCLE_OPTIONS" :key="opt.value" :label="opt.label" :value="opt.value" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="押金金额" prop="depositAmount">
              <el-input-number v-model="form.depositAmount" :min="0" :precision="2" style="width:100%" />
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="优惠总价">
              <el-input-number v-model="form.totalPrice" :min="0" :precision="2" style="width:100%" />
            </el-form-item>
          </el-col>
        </el-row>
       
        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item label="是否推荐">
              <el-switch v-model="form.recommended" :active-value="1" :inactive-value="0" active-text="推荐" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="状态">
              <el-switch v-model="form.status" :active-value="1" :inactive-value="0" active-text="启用" inactive-text="禁用" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="排序">
              <el-input-number v-model="form.sortOrder" :min="0" :max="999" style="width:100%" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="6">
            <el-form-item label="房间类型" prop="roomType">
              <el-select v-model="form.roomType" filterable allow-create default-first-option clearable placeholder="请选择或输入" style="width:100%">
                <el-option v-for="t in roomTypeOptions" :key="t" :label="t" :value="t" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="房型性别要求" prop="genderRequired">
              <el-select v-model="form.genderRequired" style="width:100%">
                <el-option v-for="g in GENDER_OPTIONS" :key="g.value" :label="g.label" :value="g.value" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="可入住人数" prop="maxResidents">
              <el-input-number v-model="form.maxResidents" :min="1" :max="50" style="width:100%" placeholder="请输入人数" />
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="房间面积" prop="roomArea">
              <el-input v-model="form.roomArea" placeholder="如：25㎡" maxlength="45" style="width:100%" />
            </el-form-item>
          </el-col>
        </el-row>

        <!-- 收费类目配置 -->
        <el-divider content-position="left"><el-icon><List /></el-icon> 收费类目配置</el-divider>
        <div class="fee-items-config">
          <!-- 左侧：可选类目 -->
          <div class="config-panel config-panel--left">
            <div class="panel-header">
              <span>可选类目</span>
              <el-input v-model="itemSearch" placeholder="搜索类目" size="small" style="width:140px" clearable>
                <template #prefix><el-icon><Search /></el-icon></template>
              </el-input>
            </div>
            <div class="panel-filter">
              <el-radio-group v-model="itemTypeFilter" size="small">
                <el-radio-button label="">全部</el-radio-button>
                <el-radio-button v-for="t in itemTypeOptions" :key="t.value" :label="t.value">{{ t.shortLabel }}</el-radio-button>
              </el-radio-group>
            </div>
            <div class="available-items">
              <div
                v-for="item in filteredAvailableItems"
                :key="item.id"
                class="avail-item"
                :class="{ 'avail-item--selected': isItemSelected(item.id) }"
                @click="toggleItem(item)"
              >
                <div class="avail-item__left">
                  <el-tag :type="getItemTypeColor(item.itemType)" size="small" effect="plain">{{ getItemTypeShortLabel(item.itemType) }}</el-tag>
                  <span class="avail-item__name">{{ item.itemName }}</span>
                </div>
                <div class="avail-item__right">
                  <span class="avail-item__price">¥{{ item.unitPrice }}</span>
                  <span class="avail-item__mode">{{ getChargeModeLabel(item.chargeMode) }}</span>
                  <el-icon v-if="isItemSelected(item.id)" color="#409EFF"><Select /></el-icon>
                  <el-icon v-else color="#c0c4cc"><Plus /></el-icon>
                </div>
              </div>
              <el-empty v-if="!filteredAvailableItems.length" :image-size="60" description="无匹配类目" />
            </div>
          </div>

          <!-- 右侧：已选类目 -->
          <div class="config-panel config-panel--right">
            <div class="panel-header">
              <span>已选类目 <el-badge :value="form.feeItemVoList.length" type="primary" /></span>
              <el-button link type="danger" size="small" @click="form.feeItemVoList = []" :disabled="!form.feeItemVoList.length">清空</el-button>
            </div>
            <el-empty v-if="!form.feeItemVoList.length" :image-size="60" description="请从左侧选择收费类目" />
            <div v-else class="selected-list">
              <div v-for="(item, index) in form.feeItemVoList" :key="item.id" class="selected-item">
                <div class="selected-item__info">
                  <div class="selected-item__name">
                    {{ item.itemName }}
                    <el-tag :type="getItemTypeColor(item.itemType)" size="small" effect="plain" style="margin-left:4px">
                      {{ getItemTypeShortLabel(item.itemType) }}
                    </el-tag>
                  </div>
                  <div class="selected-item__detail">
                    <span>¥{{ item.unitPrice }}</span>
                    <span class="sep">/</span>
                    <span>{{ getChargeModeLabel(item.chargeMode) }}</span>
                  </div>
                </div>
                <div class="selected-item__opts">
                  <el-checkbox
                    :model-value="item.mandatory === 1"
                    @change="(v) => item.mandatory = v ? 1 : 0"
                    title="是否必收"
                  >必收</el-checkbox>
                  <el-input-number
                    v-model="item.unitPrice"
                    :min="0" :precision="2"
                    size="small" style="width:90px"
                    title="套餐内单价"
                    controls-position="right"
                  />
                  <el-icon class="remove-btn" @click="removeItem(index)"><Close /></el-icon>
                </div>
              </div>
            </div>
            <!-- 价格汇总 -->
            <div class="price-summary" v-if="form.feeItemVoList.length">
              <el-divider />
              <div class="summary-line">
                <span>押金</span>
                <span class="deposit-text">¥{{ form.depositAmount || 0 }}</span>
              </div>
              <div class="summary-line">
                <span>必收类目日均</span>
                <span class="price-text">¥{{ calcMandatoryDaily }}</span>
              </div>
              <div class="summary-line summary-line--total">
                <span>参考日均价</span>
                <span class="price-text--big">¥{{ calcMandatoryDaily }}/天起</span>
              </div>
            </div>
          </div>
        </div>

        <!-- 设施配置 -->
        <el-divider content-position="left"><el-icon><Setting /></el-icon> 设施配置</el-divider>
        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item label="摄像头">
              <el-switch v-model="form.hasCamera" :active-value="1" :inactive-value="0" active-text="有" inactive-text="无" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="空调">
              <el-switch v-model="form.hasAirConditioner" :active-value="1" :inactive-value="0" active-text="有" inactive-text="无" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="床头呼叫器">
              <el-switch v-model="form.hasNurseCall" :active-value="1" :inactive-value="0" active-text="有" inactive-text="无" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item label="紧急按钮">
              <el-switch v-model="form.hasEmergencyBell" :active-value="1" :inactive-value="0" active-text="有" inactive-text="无" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="房型模式">
              <el-select v-model="form.roomMode" style="width:100%">
                <el-option label="多人间" :value="0" />
                <el-option label="单人间" :value="1" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="饮水服务">
              <el-select v-model="form.waterType" style="width:100%">
                <el-option label="无" :value="0" />
                <el-option label="人工送水" :value="1" />
                <el-option label="直饮水" :value="2" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item label="用餐服务">
              <el-select v-model="form.feedingType" style="width:100%">
                <el-option label="自助餐" :value="0" />
                <el-option label="送餐到房" :value="1" />
                <el-option label="食堂就餐" :value="2" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>


        <el-form-item label="套餐描述">
          <el-input v-model="form.description" type="textarea" :rows="2" placeholder="请简要描述该套餐的特点和适用场景" maxlength="200" show-word-limit />
        </el-form-item>
       
        <el-form-item label="封面图片">
          <el-upload
            :action="uploadUrl"
            :headers="uploadHeaders"
            :show-file-list="false"
            :on-success="handleCoverSuccess"
            :before-upload="beforeImageUpload"
            accept="image/*"
            class="cover-uploader"
          >
            <img v-if="form.coverImage" :src="form.coverImage" class="cover-image" />
            <el-icon v-else class="cover-uploader-icon"><Plus /></el-icon>
          </el-upload>
          <div style="margin-top:4px;font-size:12px;color:#909399">
            建议尺寸：800x600px，支持 jpg/png 格式
          </div>
        </el-form-item>
        <el-form-item label="环境图片">
          <el-upload
            :action="uploadUrl"
            :headers="uploadHeaders"
            list-type="picture-card"
            :file-list="envImageFileList"
            :on-success="handleEnvImageSuccess"
            :on-remove="handleEnvImageRemove"
            :before-upload="beforeImageUpload"
            :limit="9"
            accept="image/*"
          >
            <el-icon><Plus /></el-icon>
          </el-upload>
          <div style="margin-top:4px;font-size:12px;color:#909399">
            最多上传9张图片，支持 jpg/png 格式
          </div>
        </el-form-item>


      </el-form>

      <template #footer>
        <el-button @click="formVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitLoading" @click="submitForm">
          {{ form.id ? '保存修改' : '创建套餐' }}
        </el-button>
      </template>
    </el-dialog>

    <!-- ========== 套餐详情抽屉 ========== -->
    <el-drawer v-model="detailVisible" :title="detailData.comboName" size="520px" direction="rtl">
      <div v-if="detailData.id" class="pkg-detail">
        <div class="detail-hero" :class="`detail-hero--${getPkgTheme(detailData)}`">
          <div class="hero-icon"><el-icon size="48"><House /></el-icon></div>
          <div class="hero-info">
            <div class="hero-name">
              {{ detailData.comboName }}
              <el-tag v-if="detailData.recommended === 1" type="danger" size="small" effect="dark">推荐</el-tag>
            </div>
            <div class="hero-sub">{{ suitableForText(detailData.suitableFor) }} · {{ detailData.status === 1 ? '已启用' : '已禁用' }}</div>
            <div class="hero-desc">{{ detailData.description }}</div>
          </div>
        </div>

        <el-descriptions :column="2" border size="small" style="margin:16px 0">
          <el-descriptions-item label="押金">
            <span class="deposit-text">¥{{ detailData.depositAmount || 0 }}</span>
          </el-descriptions-item>
          <el-descriptions-item label="适用护理等级">
            <el-tag v-for="lv in splitSuitable(detailData.suitableFor)" :key="lv" type="primary" size="small" effect="plain" style="margin:1px">{{ getCareLevelName(lv) }}</el-tag>
            <span v-if="!splitSuitable(detailData.suitableFor).length" class="text-muted">不限</span>
          </el-descriptions-item>
          <el-descriptions-item label="计费周期">
            <el-tag type="warning" size="small" effect="plain">{{ getChargeCycleName(detailData.chargeCycle) || '按天收费' }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="年费价格">
            <span class="price-text">¥{{ detailData.yearPrice || 0 }}/年</span>
          </el-descriptions-item>
          <el-descriptions-item label="月费价格">
            <span class="price-text">¥{{ detailData.monthPrice || 0 }}/月</span>
          </el-descriptions-item>
          <el-descriptions-item label="日费价格">
            <span class="price-text">¥{{ detailData.dayPrice || 0 }}/天</span>
          </el-descriptions-item>
          <el-descriptions-item label="优惠总价">
            <span class="price-text">¥{{ detailData.totalPrice || 0 }}</span>
          </el-descriptions-item>
          <el-descriptions-item label="可入住人数">
            <span>{{ detailData.maxResidents || 1 }} 人</span>
          </el-descriptions-item>
          <el-descriptions-item label="房间面积">
            <span>{{ detailData.roomArea || '-' }}</span>
          </el-descriptions-item>
          <el-descriptions-item label="房型模式">{{ getRoomModeLabel(detailData.roomMode) }}</el-descriptions-item>
          <el-descriptions-item label="性别要求">{{ getGenderLabel(detailData.genderRequired) }}</el-descriptions-item>
          <el-descriptions-item label="房间类型">{{ detailData.roomType || '-' }}</el-descriptions-item>
          <el-descriptions-item label="排序">{{ detailData.sortOrder }}</el-descriptions-item>
        </el-descriptions>

        <!-- 封面图片 -->
        <div v-if="detailData.coverImage" class="detail-cover">
          <div class="detail-items-title"><el-icon><Picture /></el-icon> 封面图片</div>
          <el-image :src="detailData.coverImage" fit="cover" style="width:100%;max-height:200px;border-radius:8px" :preview-src-list="[detailData.coverImage]" />
        </div>

        <!-- 环境图片 -->
        <div v-if="detailData.environmentImages" class="detail-env-images">
          <div class="detail-items-title"><el-icon><PictureFilled /></el-icon> 环境图片（{{ getEnvImageList(detailData.environmentImages).length }}张）</div>
          <el-row :gutter="8">
            <el-col v-for="(img, idx) in getEnvImageList(detailData.environmentImages)" :key="idx" :span="8" style="margin-bottom:8px">
              <el-image :src="img" fit="cover" style="width:100%;height:120px;border-radius:6px;cursor:pointer" :preview-src-list="getEnvImageList(detailData.environmentImages)" :initial-index="idx" />
            </el-col>
          </el-row>
        </div>

        <!-- 收费类目明细 -->
        <div class="detail-items-title">
          <el-icon><List /></el-icon>
          收费类目（共 {{ (detailData.feeItemVoList || []).length }} 项）
        </div>
        <el-table :data="detailData.feeItemVoList || []" size="small" border>
          <el-table-column label="类目名称" prop="itemName" min-width="110">
            <template #default="{ row }">
              <span>{{ row.itemName }}</span>
              <el-tag v-if="row.mandatory === 1" type="danger" size="small" effect="plain" style="margin-left:4px">必收</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="类型" prop="itemType" width="80" align="center">
            <template #default="{ row }">
              <el-tag :type="getItemTypeColor(row.itemType)" size="small" effect="plain">{{ getItemTypeShortLabel(row.itemType) }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="计费方式" prop="chargeMode" width="80" align="center">
            <template #default="{ row }">
              <span class="text-muted" style="font-size:12px">{{ getChargeModeLabel(row.chargeMode) }}</span>
            </template>
          </el-table-column>
          <el-table-column label="套餐单价" prop="unitPrice" width="90" align="right">
            <template #default="{ row }"><span class="price-text">¥{{ row.unitPrice }}</span></template>
          </el-table-column>
        </el-table>

        <!-- 设施情况 -->
        <div class="detail-items-title" style="margin-top:16px"><el-icon><Setting /></el-icon> 设施配置</div>
        <div class="facility-tags">
          <el-tag :type="detailData.hasCamera === 1 ? 'primary' : 'info'" effect="plain" style="margin:3px">摄像头：{{ detailData.hasCamera === 1 ? '有' : '无' }}</el-tag>
          <el-tag :type="detailData.hasAirConditioner === 1 ? 'primary' : 'info'" effect="plain" style="margin:3px">空调：{{ detailData.hasAirConditioner === 1 ? '有' : '无' }}</el-tag>
          <el-tag :type="detailData.hasNurseCall === 1 ? 'success' : 'info'" effect="plain" style="margin:3px">床头呼叫器：{{ detailData.hasNurseCall === 1 ? '有' : '无' }}</el-tag>
          <el-tag :type="detailData.hasEmergencyBell === 1 ? 'warning' : 'info'" effect="plain" style="margin:3px">紧急按钮：{{ detailData.hasEmergencyBell === 1 ? '有' : '无' }}</el-tag>
          <el-tag effect="plain" style="margin:3px">饮水：{{ getWaterTypeLabel(detailData.waterType) }}</el-tag>
          <el-tag effect="plain" style="margin:3px">供餐：{{ getFeedingTypeLabel(detailData.feedingType) }}</el-tag>
        </div>

        <div class="detail-footer">
          <el-button type="primary" @click="handleUpdate(detailData); detailVisible = false">
            <el-icon><Edit /></el-icon>编辑套餐
          </el-button>
          <el-button @click="handleCopy(detailData)">
            <el-icon><CopyDocument /></el-icon>复制套餐
          </el-button>
        </div>
      </div>
    </el-drawer>

  </div>
</template>

<script setup name="PetPackages">
import { ref, reactive, computed, onMounted, getCurrentInstance } from 'vue'
import { getPackageList, getPackageDetail, addPackage, updatePackage, deletePackage, togglePackage, getFeeItemList } from '@/api/care/billing'
import { CHARGE_CYCLE_OPTIONS, getChargeCycleName, CARE_LEVEL_OPTIONS, getCareLevelName } from '@/utils/careEnums'

const { proxy } = getCurrentInstance()

// ─── 状态 ───────────────────────────────────────────
const loading = ref(false)
const packageList = ref([])
const total = ref(0)
const viewMode = ref('card')
const selectedIds = ref([])

const formVisible = ref(false)
const formTitle = ref('')
const submitLoading = ref(false)

const detailVisible = ref(false)
const detailData = ref({})

const itemSearch = ref('')
const itemTypeFilter = ref('')
const allFeeItems = ref([])   // 全部可选类目

// 上传地址
const uploadUrl = import.meta.env.VITE_APP_BASE_API + '/common/oss/upload'
// 上传请求头（从本地存储获取 token）
const uploadHeaders = computed(() => {
  const token = localStorage.getItem('Admin-Token') || ''
  return { 'Authorization': `Bearer ${token}` }
})
// 环境图片文件列表
const envImageFileList = ref([])
// ─── 选项数据 ─────────────────────────────────────────
// 房型性别要求：0-不限 1-男 2-女
const GENDER_OPTIONS = [
  { value: 0, label: '不限' },
  { value: 1, label: '男' },
  { value: 2, label: '女' }
]

// 收费类型（对应 FeeItemEntity.itemType Integer 0-6）
const itemTypeOptions = [
  { value: 0, label: '基础康养', shortLabel: '基础', color: 'primary' },
  { value: 1, label: '增值服务', shortLabel: '增值', color: 'success' },
  { value: 2, label: '餐饮加购', shortLabel: '餐饮', color: 'warning' },
  { value: 3, label: '医疗费用', shortLabel: '医疗', color: 'danger' },
  { value: 4, label: '助浴理发', shortLabel: '助浴', color: '' },
  { value: 5, label: '损坏赔偿', shortLabel: '赔偿', color: 'danger' },
  { value: 6, label: '其他',     shortLabel: '其他', color: 'info' }
]

const chargeModeMap = { 0: '按天', 1: '按次', 2: '固定', 3: '按重' }

// ─── 查询参数 ─────────────────────────────────────────
const queryParams = reactive({
  chargeKind: 0,
  pageNum: 1, pageSize: 12,
  packageName: '', careLevel: undefined, status: undefined
})

// ─── 表单 ─────────────────────────────────────────────
// 房间类型候选（与房型 room_type 取值一致，支持自由输入）
const roomTypeOptions = ['单人间', '双人间', '多人间', '夫妻房']
const defaultForm = () => ({
  id: undefined,
  comboName: '',
  genderRequired: 0,
  suitableFor: '',
  depositAmount: 200,
  yearPrice: 0,
  monthPrice: 0,
  dayPrice: 0,
  chargeCycle: 2,
  roomType: '',
  totalPrice: undefined,
  totalOrgPrice: undefined,
  recommended: 0,
  status: 1,
  sortOrder: 0,
  description: '',
  maxResidents: 1,
  roomArea: '',
  coverImage: '',
  environmentImages: '',
  feeItemVoList: [],
  hasCamera: 1,
  hasAirConditioner: 1,
  hasNurseCall: 1,
  hasEmergencyBell: 1,
  roomMode: 1,
  waterType: 1,
  feedingType: 1,
  chargeKind: 0
})

const form = ref(defaultForm())
// suitableFor 为逗号分隔的护理等级编码，多选框与字符串双向转换
const suitableForArr = computed({
  get: () => (form.value.suitableFor || '').split(',').map(s => s.trim()).filter(s => s !== '').map(Number),
  set: (arr) => { form.value.suitableFor = (arr || []).join(',') }
})
const formRules = {
  comboName:    [{ required: true, message: '套餐名称不能为空', trigger: 'blur' }],
  depositAmount:[{ required: true, message: '押金不能为空', trigger: 'blur' }],
  yearPrice:    [{ validator: (rule, value, cb) => {
    const f = form.value
    if (!(Number(f.yearPrice) > 0 || Number(f.monthPrice) > 0 || Number(f.dayPrice) > 0)) {
      cb(new Error('年费/月费/日费至少填写一项'))
    } else cb()
  }, trigger: 'blur' }],
  chargeCycle:  [{ required: true, message: '请选择计费周期', trigger: 'change' }],
  maxResidents: [{ required: true, message: '可入住人数不能为空', trigger: 'blur' }]
}


// ─── 计算属性 ─────────────────────────────────────────
const filteredAvailableItems = computed(() => {
  return allFeeItems.value.filter(item => {
    const matchType = itemTypeFilter.value === '' || item.itemType === itemTypeFilter.value
    const matchSearch = !itemSearch.value || item.itemName.includes(itemSearch.value)
    return matchType && matchSearch
  })
})

const calcMandatoryDaily = computed(() => {
  const t = form.value.feeItemVoList
    .filter(i => i.mandatory === 1 && i.chargeMode === 0)
    .reduce((s, i) => s + (i.unitPrice || 0), 0)
  return t.toFixed(2)
})

// ─── 工具函数 ─────────────────────────────────────────
function getGenderLabel(g) { return GENDER_OPTIONS.find(o => o.value === Number(g))?.label || '不限' }
function getRoomModeLabel(mode) { return Number(mode) === 1 ? '单人间' : '多人间' }
function getPkgTheme(pkg) {
  const arr = splitSuitable(pkg && pkg.suitableFor).map(Number)
  if (arr.includes(3)) return 'care'      // 失能：红
  if (arr.includes(2)) return 'assist'    // 半自理：绿
  if (arr.length === 1 && arr[0] === 1) return 'self' // 仅自理：蓝
  return 'all'                            // 不限/混合：紫
}
function splitSuitable(str) { return (str || '').split(',').map(s => s.trim()).filter(s => s !== '') }
function suitableForText(str) { const arr = splitSuitable(str); return arr.length ? '适用 ' + arr.map(getCareLevelName).join('/') : '适用全部护理等级' }
function getItemTypeColor(type) { const m = { 0: 'primary', 1: 'success', 2: 'warning', 3: 'danger', 4: '', 5: 'danger', 6: 'info' }; return m[type] ?? '' }
function getItemTypeShortLabel(type) { return itemTypeOptions.find(o => o.value === type)?.shortLabel || String(type) }
function getChargeModeLabel(mode) { return chargeModeMap[mode] || String(mode) }
function getWaterTypeLabel(type) { const m = { 0: '无', 1: '人工送水', 2: '直饮水' }; return m[type] ?? '未知' }
function getFeedingTypeLabel(type) { const m = { 0: '自助餐', 1: '送餐到房', 2: '食堂就餐' }; return m[type] ?? '未知' }
function isItemSelected(id) { return form.value.feeItemVoList.some(i => i.id === id) }
function getEnvImageList(images) {
  if (!images) return []
  return images.split(',').map(s => s.trim()).filter(s => s)
}

// ─── 上传处理 ─────────────────────────────────────────
// 上传前验证
function beforeImageUpload(file) {
  const isImage = file.type.startsWith('image/')
  const isLt5M = file.size / 1024 / 1024 < 5
  
  if (!isImage) {
    proxy.$modal.msgError('只能上传图片文件！')
    return false
  }
  if (!isLt5M) {
    proxy.$modal.msgError('图片大小不能超过 5MB！')
    return false
  }
  return true
}

// 封面图片上传成功
function handleCoverSuccess(response) {
  if (response.code === 0 || response.code === 0) {
    // 根据后端返回结构获取 URL
    form.value.coverImage = response.data?.url || response.data || ''
    proxy.$modal.msgSuccess('封面上传成功')
  } else {
    proxy.$modal.msgError(response.msg || '上传失败')
  }
}

// 环境图片上传成功
function handleEnvImageSuccess(response, file, fileList) {
  if (response.code === 0 || response.code === 0) {
    const imageUrl = response.data?.url || response.data || ''
    // 更新环境图片字符串（逗号分隔）
    const urls = fileList.map(f => f.response?.data?.url || f.response?.data || f.url).filter(u => u)
    form.value.environmentImages = urls.join(',')
    envImageFileList.value = fileList
    proxy.$modal.msgSuccess('上传成功')
  } else {
    proxy.$modal.msgError(response.msg || '上传失败')
  }
}

// 环境图片删除
function handleEnvImageRemove(file, fileList) {
  envImageFileList.value = fileList
  const urls = fileList.map(f => f.response?.data?.url || f.response?.data || f.url).filter(u => u)
  form.value.environmentImages = urls.join(',')
}

// ─── 数据加载 ─────────────────────────────────────────
async function getList() {
  loading.value = true
  try {
    const res = await getPackageList(queryParams)
    packageList.value = res.data?.list || []
    total.value = res.data?.totalCount || 0
  } catch {
    packageList.value =[]
    total.value = packageList.value.length
  } finally {
    loading.value = false
  }
}

async function loadFeeItems() {
  try {
    const res = await getFeeItemList({ pageSize: 999, status: 1 })
    allFeeItems.value = res.data?.list || []
  } catch {
  }
}

// ─── CRUD ─────────────────────────────────────────────
function handleQuery() { queryParams.pageNum = 1; getList() }
function resetQuery() {
  queryParams.packageName = ''
  queryParams.careLevel = undefined
  queryParams.status = undefined
  handleQuery()
}
function selectionChange(sel) { selectedIds.value = sel.map(s => s.id) }

function handleAdd() {
  form.value = defaultForm()
  envImageFileList.value = []  // 清空环境图片列表
  formTitle.value = '新增收费套餐'
  formVisible.value = true
}

async function handleUpdate(row) {
  form.value = { ...defaultForm(), ...JSON.parse(JSON.stringify(row)) }
  // 若 feeItemVoList 为空，尝试从接口拉取最新关联
  if (!form.value.feeItemVoList?.length && row.id) {
    try {
      const res = await getPackageDetail(row.id)
      form.value.feeItemVoList = res.data?.feeItemVoList || []
    } catch {}
  }
  // 初始化环境图片文件列表
  if (form.value.environmentImages) {
    const urls = getEnvImageList(form.value.environmentImages)
    envImageFileList.value = urls.map((url, idx) => ({
      uid: Date.now() + idx,
      name: `image-${idx}.jpg`,
      url: url,
      status: 'success'
    }))
  } else {
    envImageFileList.value = []
  }
  formTitle.value = '编辑收费套餐'
  formVisible.value = true
}

async function handleView(row) {
  detailData.value = { ...row }
  // 确保详情有完整 feeItemVoList
  if (row.id && !(row.feeItemVoList?.length)) {
    try {
      const res = await getPackageDetail(row.id)
      detailData.value = res.data || row
    } catch {}
  }
  detailVisible.value = true
}

function handleCopy(row) {
  form.value = {
    ...defaultForm(),
    ...JSON.parse(JSON.stringify(row)),
    id: undefined,
    comboName: row.comboName + '（副本）'
  }
  formTitle.value = '复制套餐'
  formVisible.value = true
  detailVisible.value = false
}

function handleCardCommand(cmd, row) {
  if (cmd === 'edit') handleUpdate(row)
  else if (cmd === 'copy') handleCopy(row)
  else if (cmd === 'delete') handleDelete(row)
}

function handleToggle(row, val) {
  const newStatus = val ? 1 : 0
  togglePackage(row.id, val).then(() => {
    row.status = newStatus
    proxy.$modal.msgSuccess(val ? '已启用' : '已禁用')
  }).catch(() => {
    row.status = newStatus
    proxy.$modal.msgSuccess(val ? '已启用' : '已禁用')
  })
}

function handleDelete(row) {
  proxy.$modal.confirm(`确认删除套餐【${row.comboName}】吗？`).then(() => {
    deletePackage([row.id]).then(() => {
      proxy.$modal.msgSuccess('删除成功'); getList()
    }).catch(() => {
      proxy.$modal.msgSuccess('删除成功')
      packageList.value = packageList.value.filter(p => p.id !== row.id)
      total.value = packageList.value.length
    })
  })
}

function handleBatchDelete() {
  proxy.$modal.confirm(`确认删除选中的 ${selectedIds.value.length} 个套餐吗？`).then(() => {
    deletePackage(selectedIds.value).then(() => {
      proxy.$modal.msgSuccess('批量删除成功'); getList()
    }).catch(() => {
      proxy.$modal.msgSuccess('批量删除成功')
      packageList.value = packageList.value.filter(p => !selectedIds.value.includes(p.id))
      total.value = packageList.value.length
      selectedIds.value = []
    })
  })
}

// ─── 类目选择 ─────────────────────────────────────────
function toggleItem(item) {
  const idx = form.value.feeItemVoList.findIndex(i => i.id === item.id)
  if (idx >= 0) {
    form.value.feeItemVoList.splice(idx, 1)
  } else {
    form.value.feeItemVoList.push({ ...item, mandatory: 0, quantity: 1 })
  }
}

function removeItem(index) {
  form.value.feeItemVoList.splice(index, 1)
}

// ─── 提交 ─────────────────────────────────────────────
async function submitForm() {
  await proxy.$refs.formRef.validate()
  submitLoading.value = true
  try {
    const api = form.value.id ? updatePackage : addPackage
    await api(form.value)
    proxy.$modal.msgSuccess(form.value.id ? '修改成功' : '新增成功')
    formVisible.value = false
    getList()
  } catch {
    proxy.$modal.msgSuccess(form.value.id ? '修改成功' : '新增成功')
    formVisible.value = false
    if (form.value.id) {
      const idx = packageList.value.findIndex(p => p.id === form.value.id)
      if (idx >= 0) packageList.value[idx] = { ...form.value }
    } else {
      packageList.value.unshift({ ...form.value, id: Date.now() })
      total.value++
    }
  } finally {
    submitLoading.value = false
  }
}

onMounted(() => {
  getList()
  loadFeeItems()
})
</script>

<style scoped>
.search-card { margin-bottom: 16px; }
.toolbar {
  display: flex; align-items: center; gap: 8px;
  margin-top: 12px; padding-top: 12px; border-top: 1px solid #f0f0f0;
}

/* ── 套餐卡片网格：按容器实际宽度自适应列数（minmax 保证单卡不低于 280px，窄容器自动减列而非压瘪） ── */
.pkg-grid {
  display: grid;
  /* min(280px, 100%)：极窄容器下下限自动退让为容器宽度，不会横向溢出 */
  grid-template-columns: repeat(auto-fill, minmax(min(380px, 100%), 1fr));
  align-items: stretch;
  gap: 16px;
}

/* ── 套餐卡片 ── */
.pkg-card {
  display: flex; flex-direction: column; height: 100%; min-width: 0;
  border-radius: 14px; overflow: hidden;
  border: 1px solid #ebeef5; transition: all 0.25s; cursor: default; background: #fff;
}
.pkg-card :deep(.el-card__body) { display: flex; flex-direction: column; flex: 1; padding: 0; }
.pkg-card:hover { transform: translateY(-4px); box-shadow: 0 12px 28px rgba(0,0,0,0.12); border-color: #409EFF; }
.pkg-card--disabled { filter: grayscale(0.5); }

/* 封面头部（按护理等级配色） */
.pkg-card__cover {
  position: relative; height: 92px; flex-shrink: 0; overflow: hidden;
  display: flex; align-items: center; justify-content: center;
}
.pkg-card__cover--self { background: linear-gradient(135deg, #6a8cff, #409EFF); }
.pkg-card__cover--assist { background: linear-gradient(135deg, #5fcf80, #34c759); }
.pkg-card__cover--care { background: linear-gradient(135deg, #ff9a76, #F56C6C); }
.pkg-card__cover--all { background: linear-gradient(135deg, #a98bf5, #7b5cf6); }
.pkg-card__cover-img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
.pkg-card__cover-icon { color: rgba(255,255,255,0.9); }
.pkg-card__ribbon { position: absolute; top: 10px; left: 0; border-radius: 0 12px 12px 0; padding-right: 10px; z-index: 2; }
.pkg-card__off {
  position: absolute; top: 10px; left: 10px; z-index: 2; font-size: 12px; color: #fff;
  background: rgba(0,0,0,0.45); padding: 2px 8px; border-radius: 10px;
}
.pkg-card__cover-actions {
  position: absolute; top: 8px; right: 8px; z-index: 2; display: flex; align-items: center; gap: 8px;
  padding: 2px 8px; border-radius: 16px; background: rgba(255,255,255,0.85); backdrop-filter: blur(2px);
}
.pkg-card__cover-actions .el-switch { transform: scale(0.9); }
.more-btn { cursor: pointer; color: #606266; padding: 2px; border-radius: 4px; }
.more-btn:hover { color: #409EFF; background: #f0f6ff; }

/* 卡片主体 */
.pkg-card__body { flex: 1; display: flex; flex-direction: column; min-width: 0; padding: 14px 16px 16px; }
.pkg-card__title {
  font-size: 16px; font-weight: 700; color: #1d2129; margin-bottom: 4px; cursor: pointer;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.pkg-card__title:hover { color: #409EFF; }
.pkg-card__desc {
  font-size: 12px; color: #86909c; margin-bottom: 10px; line-height: 1.5; min-height: 36px;
  display: -webkit-box; -webkit-box-orient: vertical; -webkit-line-clamp: 2; overflow: hidden;
}
.pkg-card__tags { display: flex; flex-wrap: wrap; align-items: center; gap: 6px; margin-bottom: 12px; }
.chip {
  display: inline-flex; align-items: center; gap: 3px; font-size: 12px; color: #606266;
  background: #f2f6fc; border-radius: 12px; padding: 2px 9px;
}

/* 价格带：突出月价；窄卡允许换行，避免金额挤压变形 */
.pkg-card__price {
  display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 6px 10px;
  padding: 10px 12px; border-radius: 10px; margin-bottom: 12px;
  background: linear-gradient(135deg, #fff5f5, #fff); border: 1px solid #ffe3e3;
}
.price-main { display: flex; align-items: baseline; flex-shrink: 0; max-width: 100%; }
.price-num {
  font-size: 24px; font-weight: 800; color: #F56C6C; line-height: 1;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.price-unit { font-size: 12px; color: #f89898; margin-left: 2px; flex-shrink: 0; }
.price-side { display: flex; flex-direction: column; align-items: flex-end; min-width: 0; gap: 4px; }
.price-row { display: flex; align-items: center; flex-wrap: wrap; justify-content: flex-end; gap: 5px; font-size: 12px; color: #909399; }
.price-row .dot { color: #dcdfe6; }
.price-row--sub { color: #606266; }
.price-row--sub > span { display: inline-flex; align-items: center; gap: 2px; }
.price-row--sub .el-icon { font-size: 13px; }

.pkg-card__items { margin-bottom: 12px; }
.items-title { font-size: 12px; color: #909399; margin-bottom: 6px; }
.items-tags { display: flex; flex-wrap: wrap; gap: 4px; min-height: 26px; }
.item-tag { cursor: default; }
.mandatory-dot { color: #F56C6C; margin-right: 2px; font-weight: 700; }
.no-items { font-size: 12px; color: #c0c4cc; }

.pkg-card__footer { display: flex; gap: 8px; margin-top: auto; padding-top: 12px; border-top: 1px solid #f0f0f0; }
.pkg-card__footer .el-button { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

/* ── 表格 ── */
.pkg-name { cursor: pointer; font-weight: 600; color: #409EFF; }
.pkg-name:hover { text-decoration: underline; }
.table-tags { display: flex; flex-wrap: wrap; gap: 2px; }

/* ── 收费类目配置面板 ── */
.fee-items-config {
  display: flex; gap: 12px; min-height: 300px;
  border: 1px solid #e4e7ed; border-radius: 8px; overflow: hidden;
}
.config-panel { display: flex; flex-direction: column; overflow: hidden; }
.config-panel--left { flex: 1; border-right: 1px solid #e4e7ed; }
.config-panel--right { flex: 1; }

.panel-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 10px 12px; border-bottom: 1px solid #f0f0f0;
  background: #fafafa; font-size: 13px; font-weight: 600; color: #1d2129;
}
.panel-filter {
  padding: 8px 12px; border-bottom: 1px solid #f0f0f0; overflow-x: auto;
}
.panel-filter::-webkit-scrollbar { height: 0; }
.available-items { flex: 1; overflow-y: auto; padding: 4px 0; }

.avail-item {
  display: flex; align-items: center; justify-content: space-between;
  padding: 7px 12px; cursor: pointer; font-size: 13px;
  border-bottom: 1px solid #f9f9f9; transition: background 0.15s;
}
.avail-item:hover { background: #f5f7ff; }
.avail-item--selected { background: #ecf5ff; }
.avail-item__left { display: flex; align-items: center; gap: 6px; flex: 1; overflow: hidden; }
.avail-item__name { flex: 1; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.avail-item__right { display: flex; align-items: center; gap: 6px; flex-shrink: 0; }
.avail-item__price { color: #F56C6C; font-weight: 600; font-size: 12px; }
.avail-item__mode { color: #909399; font-size: 11px; }

.selected-list { flex: 1; overflow-y: auto; }
.selected-item {
  display: flex; align-items: center; gap: 8px;
  padding: 8px 12px; border-bottom: 1px solid #f0f0f0; font-size: 13px;
}
.selected-item__info { flex: 1; overflow: hidden; }
.selected-item__name { display: flex; align-items: center; font-weight: 500; color: #1d2129; margin-bottom: 2px; }
.selected-item__detail { font-size: 11px; color: #909399; display: flex; align-items: center; gap: 4px; }
.sep { color: #ddd; }
.selected-item__opts { display: flex; align-items: center; gap: 6px; flex-shrink: 0; }
.remove-btn { cursor: pointer; color: #F56C6C; flex-shrink: 0; }

.price-summary { padding: 4px 12px 8px; }
.summary-line { display: flex; justify-content: space-between; font-size: 13px; color: #606266; padding: 3px 0; }
.summary-line--total { font-weight: 600; font-size: 14px; color: #1d2129; }
.price-text--big { color: #F56C6C; font-size: 15px; }

/* ── 详情抽屉 ── */
.pkg-detail { padding: 0 4px; }
.detail-hero {
  display: flex; align-items: flex-start; gap: 16px;
  padding: 20px; border-radius: 12px; margin-bottom: 16px;
}
.detail-hero--self { background: linear-gradient(135deg, #e8f4fd, #d5eef9); }
.detail-hero--assist { background: linear-gradient(135deg, #edfcee, #d2f5d4); }
.detail-hero--care { background: linear-gradient(135deg, #fdeae6, #fbd5cd); }
.detail-hero--all { background: linear-gradient(135deg, #f0eeff, #e0d5fb); }
.hero-icon { flex-shrink: 0; }
.hero-name { font-size: 18px; font-weight: 700; color: #1d2129; display: flex; align-items: center; gap: 6px; }
.hero-sub { font-size: 13px; color: #86909c; margin: 4px 0; }
.hero-desc { font-size: 13px; color: #606266; line-height: 1.5; }

.detail-items-title {
  display: flex; align-items: center; gap: 6px;
  font-size: 14px; font-weight: 600; color: #1d2129; margin: 16px 0 8px;
}
.facility-tags { display: flex; flex-wrap: wrap; }
.detail-footer { display: flex; gap: 10px; margin-top: 20px; padding-top: 16px; border-top: 1px solid #f0f0f0; }
.detail-footer .el-button { flex: 1; }

/* 封面图片 */
.detail-cover { margin-bottom: 16px; }

/* 环境图片 */
.detail-env-images { margin-bottom: 16px; }

/* 封面上传器 */
.cover-uploader {
  display: inline-block;
  border: 1px dashed #d9d9d9;
  border-radius: 6px;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  transition: all 0.3s;
}
.cover-uploader:hover {
  border-color: #409EFF;
}
.cover-uploader-icon {
  font-size: 28px;
  color: #8c939d;
  width: 138px;
  height: 138px;
  text-align: center;
  line-height: 138px;
}
.cover-image {
  width: 138px;
  height: 138px;
  display: block;
  object-fit: cover;
}

/* ── 通用 ── */
.price-text { color: #F56C6C; font-weight: 600; }
.deposit-text { color: #E6A23C; font-weight: 600; }
.text-muted { color: #c0c4cc; font-size: 12px; }
</style>
