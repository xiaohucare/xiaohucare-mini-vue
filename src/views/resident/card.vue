<template>
  <div class="app-container">
    <!-- 搜索栏 -->
    <el-card shadow="never" class="search-card">
      <el-form :model="queryParams" ref="queryFormRef" :inline="true">
        <el-form-item label="会员卡号" prop="cardNo">
          <el-input v-model="queryParams.cardNo" placeholder="请输入卡号" clearable style="width:160px" @keyup.enter="handleQuery" />
        </el-form-item>
        <el-form-item label="长者姓名" prop="residentName">
          <el-input v-model="queryParams.residentName" placeholder="请输入姓名" clearable style="width:140px" @keyup.enter="handleQuery" />
        </el-form-item>
        <el-form-item label="会员等级" prop="cardLevel">
          <el-select v-model="queryParams.cardLevel" placeholder="全部" clearable style="width:120px">
            <el-option v-for="o in CARD_LEVEL_OPTIONS" :key="o.value" :label="o.label" :value="o.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-select v-model="queryParams.status" placeholder="全部" clearable style="width:110px">
            <el-option label="正常" :value="1" />
            <el-option label="挂失" :value="2" />
            <el-option label="注销" :value="0" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleQuery"><el-icon><Search /></el-icon>搜索</el-button>
          <el-button @click="resetQuery"><el-icon><Refresh /></el-icon>重置</el-button>
        </el-form-item>
      </el-form>

      <div class="toolbar">
        <el-button type="primary" @click="handleOpenCard"><el-icon><Plus /></el-icon>开卡</el-button>
        <el-button @click="openPackageDialog"><el-icon><Setting /></el-icon>套餐设置</el-button>
        <el-tag v-if="scopedResidentName" closable type="warning" effect="plain" @close="clearScope">
          仅显示长者：{{ scopedResidentName }}
        </el-tag>
        <div class="toolbar-right">
          <span>共 <b>{{ total }}</b> 张卡</span>
          <span>本页余额 <b class="balance-text">¥{{ fmt(pageBalance) }}</b></span>
          <span>赠送 <b class="gift-text">¥{{ fmt(pageGift) }}</b></span>
        </div>
      </div>
    </el-card>

    <!-- 会员卡卡片列表 -->
    <div v-loading="loading" class="card-grid">
      <el-card
        v-for="row in cardList"
        :key="row.id"
        shadow="hover"
        class="member-card"
        :class="[`lv-${row.cardLevel}`, { 'is-disabled': row.status !== 1 }]"
      >
        <div class="mc-main">
          <!-- 卡头：卡号 + 等级 + 状态 -->
          <div class="mc-head">
            <span class="mc-no">{{ row.cardNo }}</span>
            <el-tag :type="getCardLevelTag(row.cardLevel)" effect="dark" size="small" round>{{ getCardLevelLabel(row.cardLevel) }}</el-tag>
            <el-tag class="mc-status" :type="getStatusTag(row.status)" effect="plain" size="small" round>{{ getStatusLabel(row.status) }}</el-tag>
          </div>

          <!-- 持卡长者 -->
          <div class="mc-owner">
            <span class="mc-avatar">{{ (row.residentName || '长').charAt(0) }}</span>
            <div class="mc-owner-info">
              <span class="mc-name" :title="row.residentName || ''">{{ row.residentName || '未关联长者' }}</span>
              <span class="mc-phone">
                <el-icon><Phone /></el-icon>{{ row.residentPhone || '无联系电话' }}
              </span>
            </div>
          </div>

          <!-- 余额：左右两边等分，蓝底为主余额、紫底为赠送 -->
          <div class="mc-balance">
            <div class="bal-item bal-item--main">
              <span class="bal-label">卡内余额</span>
              <span class="bal-value bal-value--main balance-text">¥{{ fmt(row.balance) }}</span>
            </div>
            <div class="bal-item bal-item--gift">
              <span class="bal-label">赠送余额</span>
              <span class="bal-value gift-text">¥{{ fmt(row.giftBalance) }}</span>
            </div>
          </div>

          <!-- 累计与开卡日：等宽三列，金额与日期在卡片之间对齐 -->
          <div class="mc-totals">
            <div class="total-item">
              <span class="total-label">累计充值</span>
              <b class="total-value">¥{{ fmt(row.totalRecharge) }}</b>
            </div>
            <div class="total-item">
              <span class="total-label">累计消费</span>
              <b class="total-value">¥{{ fmt(row.totalConsume) }}</b>
            </div>
            <div class="total-item is-date">
              <span class="total-label">开卡</span>
              <b class="total-value">{{ row.openDate || '-' }}</b>
            </div>
          </div>

          <!-- 操作 -->
          <div class="mc-actions">
            <el-button link type="primary" size="small" @click="handleDetail(row)">详情</el-button>
            <el-button link type="success" size="small" :disabled="row.status !== 1" @click="handleRecharge(row)">充值</el-button>
            <el-button link type="warning" size="small" :disabled="row.status !== 1" @click="handleConsume(row)">消费</el-button>
            <el-dropdown class="mc-more" @command="cmd => handleCommand(cmd, row)">
              <el-button link type="primary" size="small">更多<el-icon class="el-icon--right"><ArrowDown /></el-icon></el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="loss" :disabled="row.status !== 1">挂失</el-dropdown-item>
                  <el-dropdown-item command="unloss" :disabled="row.status !== 2">解挂</el-dropdown-item>
                  <el-dropdown-item command="cancel" :disabled="row.status === 0" divided>注销</el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </div>
        </div>
        <!-- 右侧记录入口：点击查看该卡消费记录 -->
        <div class="mc-record" title="查看消费记录" @click.stop="handleRecords(row)">
          <el-icon :size="18"><Tickets /></el-icon>
          <span class="mc-record-text">记录</span>
          <el-icon class="mc-record-arrow"><ArrowRight /></el-icon>
        </div>
      </el-card>
      <el-empty v-if="!loading && !cardList.length" class="grid-empty" description="暂无会员卡，点击「长者开卡」创建" />
    </div>

    <pagination v-show="total > 0" :total="total" v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize" @pagination="getList" />

    <!-- 开卡 -->
    <el-dialog v-model="openDialog" title="长者开卡" width="560px" append-to-body destroy-on-close>
      <el-form ref="openRef" :model="openForm" :rules="openRules" label-width="100px">
        <el-form-item label="选择长者" prop="residentId">
          <div style="display:flex;align-items:center;gap:8px;width:100%">
            <el-select v-model="openForm.residentId" placeholder="输入姓名搜索" filterable remote clearable
              :remote-method="searchResidents" :loading="residentLoading" style="flex:1" @change="onResidentPick">
              <el-option v-for="r in residentOptions" :key="r.id" :label="`${r.name}（${r.phone || '无电话'}）`" :value="r.id" />
            </el-select>
            <el-button type="primary" plain @click="goAddResident"><el-icon><Plus /></el-icon>新增长者</el-button>
          </div>
        </el-form-item>
        <el-form-item label="开卡套餐" prop="packageId">
          <el-select v-model="openForm.packageId" placeholder="请选择套餐" style="width:100%">
            <el-option v-for="p in enabledPackages" :key="p.id" :label="p.name" :value="p.id">
              <div class="pkg-opt"><span>{{ p.name }}</span><span class="amt">¥{{ p.actualAmount }}</span>
                <el-tag v-if="p.giftAmount > 0" type="success" size="small">赠{{ p.giftAmount }}</el-tag></div>
            </el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="套餐详情" v-if="selectedPkg">
          <div class="pkg-detail">
            <div class="row"><span class="lbl">等级</span><el-tag :type="getCardLevelTag(selectedPkg.cardLevel)" effect="dark" size="small">{{ getCardLevelLabel(selectedPkg.cardLevel) }}</el-tag></div>
            <div class="row"><span class="lbl">原始金额</span><span class="strike">¥{{ selectedPkg.originalAmount }}</span></div>
            <div class="row"><span class="lbl">优惠金额</span><span class="disc">-¥{{ selectedPkg.discountAmount }}</span></div>
            <div class="row hl"><span class="lbl">实付金额</span><span class="actual">¥{{ selectedPkg.actualAmount }}</span></div>
            <div class="row" v-if="selectedPkg.giftAmount > 0"><span class="lbl">赠送金额</span><span class="gift-text">+¥{{ selectedPkg.giftAmount }}</span></div>
          </div>
        </el-form-item>
        <el-form-item label="支付方式" prop="payMethod">
          <el-radio-group v-model="openForm.payMethod">
            <el-radio label="wechat">微信</el-radio><el-radio label="alipay">支付宝</el-radio>
            <el-radio label="cash">现金</el-radio><el-radio label="card">银行卡</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="备注"><el-input v-model="openForm.remark" type="textarea" :rows="2" /></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="openDialog = false">取消</el-button>
        <el-button type="primary" :loading="submitLoading" @click="submitOpen">确认开卡</el-button>
      </template>
    </el-dialog>

    <!-- 充值（套餐 / 自定义） -->
    <el-dialog v-model="rechargeDialog" title="会员卡充值" width="540px" append-to-body destroy-on-close>
      <el-form label-width="100px">
        <el-form-item label="会员卡号"><el-input :value="rechargeForm.cardNo" disabled /></el-form-item>
        <el-form-item label="长者姓名"><el-input :value="rechargeForm.residentName" disabled /></el-form-item>
        <el-form-item label="当前余额"><span class="balance-text">¥{{ rechargeForm.currentBalance }}</span></el-form-item>
        <el-form-item label="充值方式">
          <el-radio-group v-model="rechargeForm.mode">
            <el-radio-button label="package">套餐充值</el-radio-button>
            <el-radio-button label="custom">自定义金额</el-radio-button>
          </el-radio-group>
        </el-form-item>
        <template v-if="rechargeForm.mode === 'package'">
          <el-form-item label="充值套餐">
            <el-select v-model="rechargeForm.packageId" placeholder="请选择套餐" style="width:100%">
              <el-option v-for="p in enabledPackages" :key="p.id" :label="p.name" :value="p.id">
                <div class="pkg-opt"><span>{{ p.name }}</span><span class="amt">¥{{ p.actualAmount }}</span>
                  <el-tag v-if="p.giftAmount > 0" type="success" size="small">赠{{ p.giftAmount }}</el-tag></div>
              </el-option>
            </el-select>
          </el-form-item>
          <el-form-item label="套餐详情" v-if="rechargePkg">
            <div class="pkg-detail">
              <div class="row"><span class="lbl">等级</span><el-tag :type="getCardLevelTag(rechargePkg.cardLevel)" effect="dark" size="small">{{ getCardLevelLabel(rechargePkg.cardLevel) }}</el-tag></div>
              <div class="row"><span class="lbl">原始金额</span><span class="strike">¥{{ rechargePkg.originalAmount }}</span></div>
              <div class="row"><span class="lbl">优惠金额</span><span class="disc">-¥{{ rechargePkg.discountAmount }}</span></div>
              <div class="row hl"><span class="lbl">实付金额</span><span class="actual">¥{{ rechargePkg.actualAmount }}</span></div>
              <div class="row" v-if="rechargePkg.giftAmount > 0"><span class="lbl">赠送金额</span><span class="gift-text">+¥{{ rechargePkg.giftAmount }}</span></div>
            </div>
          </el-form-item>
        </template>
        <template v-else>
          <el-form-item label="充值金额"><el-input-number v-model="rechargeForm.amount" :min="0" :precision="2" style="width:200px" /></el-form-item>
          <el-form-item label="赠送金额"><el-input-number v-model="rechargeForm.giftAmount" :min="0" :precision="2" style="width:200px" /></el-form-item>
        </template>
        <el-form-item label="支付方式">
          <el-radio-group v-model="rechargeForm.payMethod">
            <el-radio label="wechat">微信</el-radio><el-radio label="alipay">支付宝</el-radio>
            <el-radio label="cash">现金</el-radio><el-radio label="card">银行卡</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="备注"><el-input v-model="rechargeForm.remark" type="textarea" :rows="2" /></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="rechargeDialog = false">取消</el-button>
        <el-button type="primary" :loading="submitLoading" @click="submitRecharge">确认充值</el-button>
      </template>
    </el-dialog>

    <!-- 消费 -->
    <el-dialog v-model="consumeDialog" title="会员卡消费" width="480px" append-to-body destroy-on-close>
      <el-form ref="consumeRef" :model="consumeForm" :rules="consumeRules" label-width="100px">
        <el-form-item label="会员卡号"><el-input :value="consumeForm.cardNo" disabled /></el-form-item>
        <el-form-item label="长者姓名"><el-input :value="consumeForm.residentName" disabled /></el-form-item>
        <el-form-item label="当前余额">
          <span class="balance-text">¥{{ consumeForm.currentBalance }}</span>
          <span v-if="Number(consumeForm.giftBalance) > 0" class="gift-text" style="margin-left:14px">赠送余额：¥{{ consumeForm.giftBalance }}</span>
        </el-form-item>
        <el-form-item label="消费金额" prop="amount"><el-input-number v-model="consumeForm.amount" :min="0.01" :precision="2" style="width:200px" /></el-form-item>
        <el-form-item label="服务类型" prop="serviceType">
          <el-radio-group v-model="consumeForm.serviceType">
            <el-radio label="care">住养费用</el-radio><el-radio label="care_svc">照护服务</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="使用赠送金">
          <el-switch v-model="consumeForm.useGift" :disabled="Number(consumeForm.giftBalance) <= 0" />
          <span class="form-tip">（可用赠送余额：¥{{ consumeForm.giftBalance }}）</span>
        </el-form-item>
        <el-form-item label="备注"><el-input v-model="consumeForm.remark" type="textarea" :rows="2" /></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="consumeDialog = false">取消</el-button>
        <el-button type="primary" :loading="submitLoading" @click="submitConsume">确认消费</el-button>
      </template>
    </el-dialog>

    <!-- 详情 -->
    <el-dialog v-model="detailDialog" title="会员卡详情" width="640px" append-to-body>
      <el-descriptions :column="2" border>
        <el-descriptions-item label="会员卡号">{{ cardDetail.cardNo }}</el-descriptions-item>
        <el-descriptions-item label="会员等级"><el-tag :type="getCardLevelTag(cardDetail.cardLevel)" effect="dark" size="small">{{ getCardLevelLabel(cardDetail.cardLevel) }}</el-tag></el-descriptions-item>
        <el-descriptions-item label="长者姓名">{{ cardDetail.residentName }}</el-descriptions-item>
        <el-descriptions-item label="手机号">{{ cardDetail.residentPhone }}</el-descriptions-item>
        <el-descriptions-item label="卡内余额"><span class="balance-text">¥{{ fmt(cardDetail.balance) }}</span></el-descriptions-item>
        <el-descriptions-item label="赠送余额"><span class="gift-text">¥{{ fmt(cardDetail.giftBalance) }}</span></el-descriptions-item>
        <el-descriptions-item label="累计充值">¥{{ fmt(cardDetail.totalRecharge) }}</el-descriptions-item>
        <el-descriptions-item label="累计消费">¥{{ fmt(cardDetail.totalConsume) }}</el-descriptions-item>
        <el-descriptions-item label="开卡日期">{{ cardDetail.openDate || '-' }}</el-descriptions-item>
        <el-descriptions-item label="有效期至">{{ cardDetail.expireDate || '永久' }}</el-descriptions-item>
        <el-descriptions-item label="状态"><el-tag :type="getStatusTag(cardDetail.status)" size="small">{{ getStatusLabel(cardDetail.status) }}</el-tag></el-descriptions-item>
        <el-descriptions-item label="开卡方式">{{ getPayLabel(cardDetail.payMethod) }}</el-descriptions-item>
        <el-descriptions-item label="备注" :span="2">{{ cardDetail.remark || '-' }}</el-descriptions-item>
      </el-descriptions>
    </el-dialog>

    <!-- 交易记录抽屉（点击卡片右侧打开） -->
    <el-drawer v-model="recordDrawer" :title="`消费记录 - ${recordRow.cardNo || ''}`" size="860px" destroy-on-close>
      <div class="record-head">
        <div class="record-owner">
          <span class="mc-name">{{ recordRow.residentName || '-' }}</span>
          <span class="mc-phone">{{ recordRow.residentPhone || '-' }}</span>
        </div>
        <div class="record-balances">
          <span>余额 <b class="balance-text">¥{{ fmt(recordRow.balance) }}</b></span>
          <span>赠送 <b class="gift-text">¥{{ fmt(recordRow.giftBalance) }}</b></span>
          <span>共 <b>{{ recordTotal }}</b> 笔</span>
        </div>
      </div>
      <div class="record-filter">
        <el-radio-group v-model="recordQuery.tradeType" size="small" @change="handleRecordTypeChange">
          <el-radio-button v-for="t in RECORD_TYPE_TABS" :key="t.label" :label="t.value">{{ t.label }}</el-radio-button>
        </el-radio-group>
      </div>
      <el-table v-loading="recordLoading" :data="recordList" border size="small">
        <el-table-column label="流水号" prop="tradeNo" min-width="160" align="center" />
        <el-table-column label="类型" prop="tradeType" width="80" align="center">
          <template #default="{ row }"><el-tag :type="getTradeTag(row.tradeType)" size="small">{{ getTradeLabel(row.tradeType) }}</el-tag></template>
        </el-table-column>
        <el-table-column label="服务类型" width="90" align="center">
          <template #default="{ row }">{{ getServiceLabel(row.serviceType) }}</template>
        </el-table-column>
        <el-table-column label="金额" width="100" align="right">
          <template #default="{ row }"><span :class="row.tradeType === 'consume' ? 'expense' : 'income'">{{ row.tradeType === 'consume' ? '-' : '+' }}{{ fmt(row.amount) }}</span></template>
        </el-table-column>
        <el-table-column label="赠送" prop="giftAmount" width="80" align="right">
          <template #default="{ row }">{{ fmt(row.giftAmount) }}</template>
        </el-table-column>
        <el-table-column label="交易前余额" prop="beforeBalance" width="100" align="right"><template #default="{ row }">¥{{ fmt(row.beforeBalance) }}</template></el-table-column>
        <el-table-column label="交易后余额" prop="afterBalance" width="100" align="right"><template #default="{ row }">¥{{ fmt(row.afterBalance) }}</template></el-table-column>
        <el-table-column label="支付方式" width="90" align="center"><template #default="{ row }">{{ getPayLabel(row.payMethod) }}</template></el-table-column>
        <el-table-column label="交易时间" prop="tradeTime" width="120" align="center" />
        <el-table-column label="备注" prop="remark" min-width="120" show-overflow-tooltip />
      </el-table>
      <pagination v-show="recordTotal > 0" :total="recordTotal" v-model:page="recordQuery.pageNum" v-model:limit="recordQuery.pageSize" @pagination="loadRecords" />
    </el-drawer>

    <!-- 套餐设置 -->
    <el-dialog v-model="pkgDialog" title="会员卡套餐设置" width="980px" append-to-body destroy-on-close>
      <div class="pkg-toolbar">
        <el-button type="primary" size="small" @click="handlePkgAdd"><el-icon><Plus /></el-icon>新增套餐</el-button>
        <span class="pkg-tip">启用中的套餐会出现在开卡 / 充值的下拉框中</span>
      </div>
      <el-table v-loading="pkgLoading" :data="pkgList" border size="small" empty-text="暂无套餐">
        <el-table-column label="套餐名称" prop="name" min-width="160" show-overflow-tooltip />
        <el-table-column label="等级" width="90" align="center">
          <template #default="{ row }"><el-tag :type="getCardLevelTag(row.cardLevel)" effect="dark" size="small">{{ getCardLevelLabel(row.cardLevel) }}</el-tag></template>
        </el-table-column>
        <el-table-column label="原始金额" width="100" align="right"><template #default="{ row }">¥{{ fmt(row.originalAmount) }}</template></el-table-column>
        <el-table-column label="优惠" width="90" align="right"><template #default="{ row }"><span class="expense">-¥{{ fmt(row.discountAmount) }}</span></template></el-table-column>
        <el-table-column label="实付" width="100" align="right"><template #default="{ row }"><span class="balance-text">¥{{ fmt(row.actualAmount) }}</span></template></el-table-column>
        <el-table-column label="赠送" width="90" align="right"><template #default="{ row }"><span class="gift-text">¥{{ fmt(row.giftAmount) }}</span></template></el-table-column>
        <el-table-column label="热销" width="70" align="center">
          <template #default="{ row }"><el-tag v-if="row.isHot === 1" type="danger" size="small">热销</el-tag><span v-else class="muted">-</span></template>
        </el-table-column>
        <el-table-column label="排序" prop="sortOrder" width="70" align="center" />
        <el-table-column label="状态" width="80" align="center">
          <template #default="{ row }">
            <el-switch :model-value="row.status === 1" size="small" @change="val => handlePkgStatus(row, val)" />
          </template>
        </el-table-column>
        <el-table-column label="操作" width="120" align="center">
          <template #default="{ row }">
            <el-button link type="primary" size="small" @click="handlePkgEdit(row)">编辑</el-button>
            <el-button link type="danger" size="small" @click="handlePkgDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-dialog>

    <!-- 套餐新增/编辑 -->
    <el-dialog v-model="pkgFormDialog" :title="pkgForm.id ? '编辑套餐' : '新增套餐'" width="560px" append-to-body destroy-on-close>
      <el-form ref="pkgFormRef" :model="pkgForm" :rules="pkgRules" label-width="100px">
        <el-form-item label="套餐名称" prop="name"><el-input v-model="pkgForm.name" placeholder="如：金卡充值套餐A" /></el-form-item>
        <el-form-item label="会员等级" prop="cardLevel">
          <el-select v-model="pkgForm.cardLevel" style="width:100%">
            <el-option v-for="o in CARD_LEVEL_OPTIONS" :key="o.value" :label="o.label" :value="o.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="原始金额" prop="originalAmount">
          <el-input-number v-model="pkgForm.originalAmount" :min="0" :precision="2" style="width:200px" @change="calcActual" />
        </el-form-item>
        <el-form-item label="优惠金额">
          <el-input-number v-model="pkgForm.discountAmount" :min="0" :precision="2" style="width:200px" @change="calcActual" />
        </el-form-item>
        <el-form-item label="实付金额">
          <el-input-number v-model="pkgForm.actualAmount" :min="0" :precision="2" style="width:200px" disabled />
          <span class="form-tip">自动 = 原始金额 - 优惠金额</span>
        </el-form-item>
        <el-form-item label="赠送金额">
          <el-input-number v-model="pkgForm.giftAmount" :min="0" :precision="2" style="width:200px" />
          <span class="form-tip">入账到赠送余额</span>
        </el-form-item>
        <el-form-item label="套餐说明"><el-input v-model="pkgForm.description" type="textarea" :rows="2" placeholder="如：有效期12个月、不可退换" /></el-form-item>
        <el-form-item label="热销推荐"><el-switch v-model="pkgForm.isHot" :active-value="1" :inactive-value="0" /></el-form-item>
        <el-form-item label="排序"><el-input-number v-model="pkgForm.sortOrder" :min="0" :max="999" /></el-form-item>
        <el-form-item label="状态"><el-switch v-model="pkgForm.status" :active-value="1" :inactive-value="0" /></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="pkgFormDialog = false">取消</el-button>
        <el-button type="primary" :loading="submitLoading" @click="submitPkg">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup name="ResidentCard">
import { ref, reactive, computed, onMounted, onActivated, watch, getCurrentInstance } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getResidentCardList, openResidentCard, rechargeResidentCard, consumeResidentCard, toggleResidentCardStatus, getResidentCardConsumeRecords } from '@/api/resident/residentCard'
import { getEnabledPackageList, getCardPackageList, addCardPackage, deleteCardPackage, updatePackageStatus } from '@/api/resident/cardPackage'
import { getResidentOptions } from '@/api/residents'

const { proxy } = getCurrentInstance()
const route = useRoute()
const router = useRouter()

const CARD_LEVEL_OPTIONS = [
  { value: 0, label: '普通卡' }, { value: 1, label: '银卡' }, { value: 2, label: '金卡' }, { value: 3, label: '钻石卡' }
]

const loading = ref(false)
const submitLoading = ref(false)
const cardList = ref([])
const total = ref(0)
const scopedResidentName = ref('')

const queryParams = reactive({
  pageNum: 1, pageSize: 10,
  cardNo: '', residentName: '', cardLevel: undefined, status: undefined, residentId: undefined
})

// ─── 映射 ─────────────────────────────────────────
function fmt(v) { return (Number(v) || 0).toFixed(2) }
function getCardLevelTag(l) { return ({ 0: '', 1: 'info', 2: 'warning', 3: 'danger' })[l] ?? '' }
function getCardLevelLabel(l) { return ({ 0: '普通卡', 1: '银卡', 2: '金卡', 3: '钻石卡' })[l] ?? '未知' }
function getStatusTag(s) { return ({ 1: 'success', 2: 'warning', 0: 'info' })[s] ?? 'info' }
function getStatusLabel(s) { return ({ 1: '正常', 2: '挂失', 0: '注销' })[s] ?? '未知' }
function getTradeLabel(t) { return ({ consume: '消费', recharge: '充值', refund: '退款', open: '开卡' })[t] ?? t }
function getTradeTag(t) { return ({ consume: 'danger', recharge: 'success', refund: 'warning', open: 'primary' })[t] ?? 'info' }
function getServiceLabel(s) { return ({ care: '住养', care_svc: '照护服务' })[s] ?? '-' }
function getPayLabel(p) { return ({ wechat: '微信', alipay: '支付宝', cash: '现金', card: '银行卡' })[p] ?? (p || '-') }

const pageBalance = computed(() => cardList.value.reduce((sum, r) => sum + (Number(r.balance) || 0), 0))
const pageGift = computed(() => cardList.value.reduce((sum, r) => sum + (Number(r.giftBalance) || 0), 0))

// ─── 列表 ─────────────────────────────────────────
async function getList() {
  loading.value = true
  try {
    const res = await getResidentCardList(queryParams)
    cardList.value = res.data?.list || []
    total.value = res.data?.totalCount || 0
  } catch {
    cardList.value = []
    total.value = 0
  } finally {
    loading.value = false
  }
}
function handleQuery() { queryParams.pageNum = 1; getList() }
function resetQuery() {
  queryParams.cardNo = ''
  queryParams.residentName = ''
  queryParams.cardLevel = undefined
  queryParams.status = undefined
  queryParams.residentId = undefined
  scopedResidentName.value = ''
  handleQuery()
}
function clearScope() { queryParams.residentId = undefined; scopedResidentName.value = ''; handleQuery() }

// ─── 套餐数据 ─────────────────────────────────────
const enabledPackages = ref([])
async function refreshEnabledPackages() {
  try { const res = await getEnabledPackageList(); enabledPackages.value = res.data || [] }
  catch { enabledPackages.value = [] }
}

// ─── 长者开卡 ─────────────────────────────────────
const openDialog = ref(false)
const openRef = ref(null)
const residentOptions = ref([])
const residentLoading = ref(false)
const openForm = ref({ residentId: undefined, residentName: '', residentPhone: '', packageId: undefined, payMethod: 'wechat', remark: '' })
const openRules = {
  residentId: [{ required: true, message: '请选择长者', trigger: 'change' }],
  packageId:  [{ required: true, message: '请选择开卡套餐', trigger: 'change' }]
}
const selectedPkg = computed(() => enabledPackages.value.find(p => p.id === openForm.value.packageId))

async function searchResidents(query) {
  residentLoading.value = true
  try { const res = await getResidentOptions(query); residentOptions.value = res.data || [] }
  finally { residentLoading.value = false }
}
function onResidentPick(id) {
  const r = residentOptions.value.find(x => x.id === id)
  openForm.value.residentName = r?.name || ''
  openForm.value.residentPhone = r?.phone || ''
}
// 待赋值长者：来自长者档案页跳转（?residentId=&residentName=）或档案页回传
const pendingResident = ref(null)

// 把待赋值长者填进开卡表单（选项里没有时临时补一条，保证下拉能显示姓名）
function applyPendingResident() {
  const p = pendingResident.value
  const id = Number(p?.id)
  if (!id) return
  if (!residentOptions.value.find(r => r.id === id)) {
    residentOptions.value = [{ id, name: p.name || '长者', phone: p.phone || '' }, ...residentOptions.value]
  }
  openForm.value.residentId = id
  onResidentPick(id)
  if (p.phone && !openForm.value.residentPhone) openForm.value.residentPhone = p.phone
  pendingResident.value = null
}

async function handleOpenCard() {
  openForm.value = { residentId: undefined, residentName: '', residentPhone: '', packageId: undefined, payMethod: 'wechat', remark: '' }
  if (!enabledPackages.value.length) await refreshEnabledPackages()
  // 开卡以套餐定价，无可用套餐时先引导去配置（待赋值长者保留，配置完再点开卡仍会自动带上）
  if (!enabledPackages.value.length) {
    proxy.$modal.msgWarning('请先在「套餐设置」中添加并启用开卡套餐')
    openPackageDialog()
    return
  }
  await searchResidents('')
  applyPendingResident()
  openDialog.value = true
}

// 路由携带的长者（来自长者档案页「去开卡 / 充值」）
function readRoutePreset() {
  const id = Number(route.query.residentId)
  if (!id) return null
  return { id, name: route.query.residentName || '', phone: route.query.residentPhone || '' }
}
function clearRoutePresetQuery() {
  const q = { ...route.query }
  delete q.residentId
  delete q.residentName
  delete q.residentPhone
  router.replace({ path: route.path, query: q })
}
// 跳转过来带了长者：列表按长者过滤 + 开卡弹窗自动赋值（无可用套餐时先引导配置，长者信息保留）
async function syncFromRoute() {
  const preset = readRoutePreset()
  if (!preset) return false
  queryParams.residentId = preset.id
  queryParams.pageNum = 1
  scopedResidentName.value = preset.name
  pendingResident.value = preset
  getList()
  if (!enabledPackages.value.length) await refreshEnabledPackages()
  if (enabledPackages.value.length) await handleOpenCard()
  // 消费掉 URL 参数，避免 keep-alive 回来时重复弹窗
  clearRoutePresetQuery()
  return true
}
function submitOpen() {
  proxy.$refs.openRef.validate(async valid => {
    if (!valid) return
    const pkg = selectedPkg.value
    submitLoading.value = true
    try {
      await openResidentCard({
        residentId: openForm.value.residentId,
        residentName: openForm.value.residentName,
        residentPhone: openForm.value.residentPhone,
        packageId: openForm.value.packageId,
        openAmount: pkg ? pkg.actualAmount : 0,
        giftBalance: pkg ? pkg.giftAmount : 0,
        payMethod: openForm.value.payMethod,
        remark: openForm.value.remark
      })
      proxy.$modal.msgSuccess('开卡成功（已有有效卡时自动转为套餐充值）')
      openDialog.value = false
      getList()
    } finally { submitLoading.value = false }
  })
}

// ─── 充值（套餐 / 自定义） ────────────────────────
const rechargeDialog = ref(false)
const rechargeForm = ref({})
const rechargePkg = computed(() => enabledPackages.value.find(p => p.id === rechargeForm.value.packageId))
async function handleRecharge(row) {
  if (!enabledPackages.value.length) await refreshEnabledPackages()
  rechargeForm.value = {
    cardId: row.id, cardNo: row.cardNo, residentName: row.residentName,
    currentBalance: fmt(row.balance),
    mode: enabledPackages.value.length ? 'package' : 'custom',
    packageId: undefined,
    amount: 0, giftAmount: 0,
    payMethod: 'wechat', remark: ''
  }
  rechargeDialog.value = true
}
async function submitRecharge() {
  const f = rechargeForm.value
  if (f.mode === 'package' && !f.packageId) { proxy.$modal.msgWarning('请选择充值套餐'); return }
  if (f.mode === 'custom' && !(Number(f.amount) > 0)) { proxy.$modal.msgWarning('请输入充值金额'); return }
  submitLoading.value = true
  try {
    const payload = { cardId: f.cardId, payMethod: f.payMethod, remark: f.remark }
    if (f.mode === 'package') payload.packageId = f.packageId
    else { payload.amount = f.amount; payload.giftAmount = f.giftAmount }
    await rechargeResidentCard(payload)
    proxy.$modal.msgSuccess('充值成功')
    rechargeDialog.value = false
    getList()
  } finally { submitLoading.value = false }
}

// ─── 消费 ─────────────────────────────────────────
const consumeDialog = ref(false)
const consumeRef = ref(null)
const consumeForm = ref({})
const consumeRules = {
  amount:      [{ required: true, type: 'number', min: 0.01, message: '请输入消费金额', trigger: 'blur' }],
  serviceType: [{ required: true, message: '请选择服务类型', trigger: 'change' }]
}
function handleConsume(row) {
  consumeForm.value = {
    cardId: row.id, cardNo: row.cardNo, residentName: row.residentName,
    currentBalance: fmt(row.balance), giftBalance: fmt(row.giftBalance),
    amount: 0, serviceType: 'care', useGift: false, remark: ''
  }
  consumeDialog.value = true
}
function submitConsume() {
  proxy.$refs.consumeRef.validate(async valid => {
    if (!valid) return
    // 与后端一致：赠送余额仅勾选时可用，不允许透支
    const usable = Number(consumeForm.value.useGift
      ? Number(consumeForm.value.currentBalance) + Number(consumeForm.value.giftBalance)
      : consumeForm.value.currentBalance)
    if (Number(consumeForm.value.amount) > usable) {
      proxy.$modal.msgWarning(`可用余额不足，当前可用 ¥${usable.toFixed(2)}`)
      return
    }
    submitLoading.value = true
    try {
      await consumeResidentCard({ cardId: consumeForm.value.cardId, amount: consumeForm.value.amount, useGift: consumeForm.value.useGift, serviceType: consumeForm.value.serviceType, remark: consumeForm.value.remark })
      proxy.$modal.msgSuccess('消费成功'); consumeDialog.value = false; getList()
    } finally { submitLoading.value = false }
  })
}

// ─── 详情 ─────────────────────────────────────────
const detailDialog = ref(false)
const cardDetail = ref({})
function handleDetail(row) { cardDetail.value = { ...row }; detailDialog.value = true }

// ─── 状态操作 ─────────────────────────────────────
function handleCommand(cmd, row) {
  const map = { loss: [2, '挂失'], unloss: [1, '解挂'], cancel: [0, '注销'] }
  const [status, label] = map[cmd]
  const tip = cmd === 'cancel' ? `确认注销会员卡【${row.cardNo}】吗？此操作不可恢复！` : `确认${label}会员卡【${row.cardNo}】吗？`
  proxy.$modal.confirm(tip).then(async () => {
    await toggleResidentCardStatus(row.id, status)
    proxy.$modal.msgSuccess(label + '成功')
    getList()
  }).catch(() => {})
}

// ─── 交易记录抽屉 ─────────────────────────────────
const recordDrawer = ref(false)
const recordLoading = ref(false)
const recordList = ref([])
const recordTotal = ref(0)
const recordRow = ref({})
const recordQuery = reactive({ cardId: undefined, pageNum: 1, pageSize: 10, tradeType: '' })
const RECORD_TYPE_TABS = [
  { label: '全部', value: '' },
  { label: '消费', value: 'consume' },
  { label: '充值', value: 'recharge' },
  { label: '开卡', value: 'open' }
]
function handleRecords(row) {
  recordRow.value = row
  recordQuery.cardId = row.id
  recordQuery.pageNum = 1
  recordQuery.tradeType = ''
  recordDrawer.value = true
  loadRecords()
}
function handleRecordTypeChange() { recordQuery.pageNum = 1; loadRecords() }
async function loadRecords() {
  recordLoading.value = true
  try {
    const params = { cardId: recordQuery.cardId, pageNum: recordQuery.pageNum, pageSize: recordQuery.pageSize }
    if (recordQuery.tradeType) params.tradeType = recordQuery.tradeType
    const res = await getResidentCardConsumeRecords(params)
    recordList.value = res.data?.list || []
    recordTotal.value = res.data?.totalCount || 0
  } catch {
    recordList.value = []
    recordTotal.value = 0
  } finally {
    recordLoading.value = false
  }
}

// ─── 套餐管理 ─────────────────────────────────────
const pkgDialog = ref(false)
const pkgLoading = ref(false)
const pkgList = ref([])
const pkgFormDialog = ref(false)
const pkgFormRef = ref(null)
const pkgForm = ref(defaultPkgForm())
const pkgRules = {
  name:           [{ required: true, message: '请输入套餐名称', trigger: 'blur' }],
  cardLevel:      [{ required: true, message: '请选择会员等级', trigger: 'change' }],
  originalAmount: [{ required: true, message: '请输入原始金额', trigger: 'blur' }]
}
function defaultPkgForm() {
  return {
    id: undefined, name: '', cardLevel: 0,
    originalAmount: 0, discountAmount: 0, actualAmount: 0, giftAmount: 0,
    description: '', isHot: 0, sortOrder: 0, status: 1
  }
}
function openPackageDialog() { pkgDialog.value = true; loadPackages() }
async function loadPackages() {
  pkgLoading.value = true
  try {
    const res = await getCardPackageList({ pageNum: 1, pageSize: 200 })
    pkgList.value = res.data?.list || []
  } catch {
    pkgList.value = []
  } finally {
    pkgLoading.value = false
  }
}
function calcActual() {
  const original = Number(pkgForm.value.originalAmount) || 0
  const discount = Number(pkgForm.value.discountAmount) || 0
  pkgForm.value.actualAmount = Math.max(0, original - discount)
}
function handlePkgAdd() { pkgForm.value = defaultPkgForm(); pkgFormDialog.value = true }
function handlePkgEdit(row) { pkgForm.value = { ...defaultPkgForm(), ...row }; pkgFormDialog.value = true }
function submitPkg() {
  proxy.$refs.pkgFormRef.validate(async valid => {
    if (!valid) return
    calcActual()
    submitLoading.value = true
    try {
      await addCardPackage({ ...pkgForm.value })
      proxy.$modal.msgSuccess('保存成功')
      pkgFormDialog.value = false
      loadPackages()
      refreshEnabledPackages()
    } finally { submitLoading.value = false }
  })
}
async function handlePkgStatus(row, val) {
  try {
    await updatePackageStatus(row.id, val ? 1 : 0)
    proxy.$modal.msgSuccess('状态已更新')
    await loadPackages()
    refreshEnabledPackages()
  } catch {
    loadPackages()
  }
}
function handlePkgDelete(row) {
  proxy.$modal.confirm(`确认删除套餐【${row.name}】吗？`).then(async () => {
    await deleteCardPackage(row.id)
    proxy.$modal.msgSuccess('删除成功')
    await loadPackages()
    refreshEnabledPackages()
  }).catch(() => {})
}

onMounted(async () => {
  await refreshEnabledPackages()
  const fromRoute = await syncFromRoute()
  if (!fromRoute) getList()
  consumePick()
})

// 页面已在 tagsView 中时再次从档案页跳转：只改 query 不重挂载，靠监听重新赋值
watch(() => route.query.residentId, v => { if (v) syncFromRoute() })

// 跳转长者档案页（/kh/resident）：自动弹出新增，并处于选择模式（新增/选择后自动返回本页）
function goAddResident() {
  router.push({ path: '/kh/resident', query: { action: 'add', select: '1' } })
}

// 接收档案页回传的所选长者：自动打开开卡弹窗并选中
async function consumePick() {
  let raw = null
  try { raw = sessionStorage.getItem('ginkgo_resident_pick') } catch { return }
  if (!raw) return
  try { sessionStorage.removeItem('ginkgo_resident_pick') } catch { /* ignore */ }
  try {
    const p = JSON.parse(raw)
    if (!p || !p.id) return
    pendingResident.value = { id: Number(p.id), name: p.name || '', phone: p.phone || '' }
    await handleOpenCard()
  } catch { /* ignore */ }
}

// keep-alive 复用场景：再次进入页面时接收回传
onActivated(consumePick)
</script>

<style scoped>
.search-card { margin-bottom: 16px; }
.toolbar { display: flex; align-items: center; gap: 12px; margin-top: 12px; padding-top: 12px; border-top: 1px solid #f0f0f0; }
.toolbar-right { margin-left: auto; display: flex; align-items: center; gap: 16px; color: #86909c; font-size: 13px; }
.toolbar-right b { color: #1d2129; }
.balance-text { color: #409EFF; font-weight: 600; }
.gift-text { color: #9747FF; font-weight: 600; }
.income { color: #67C23A; font-weight: 600; }
.expense { color: #F56C6C; font-weight: 600; }
.muted { color: #c0c4cc; }

/* 卡片网格 */
.card-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(380px, 1fr)); gap: 16px; margin-bottom: 16px; }
.grid-empty { grid-column: 1 / -1; }

/* 会员卡：顶部等级色条 + 抬升悬停 */
.member-card {
  position: relative; border-radius: 14px; border: 1px solid #ebeef5;
  overflow: hidden; transition: transform .25s, box-shadow .25s;
}
.member-card::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 3px; z-index: 2; background: #d3d8e0; }
.member-card.lv-1::before { background: linear-gradient(90deg, #8ea2c6, #c6d3e8); }
.member-card.lv-2::before { background: linear-gradient(90deg, #e6a23c, #f6d08a); }
.member-card.lv-3::before { background: linear-gradient(90deg, #7b61ff, #b6a6ff); }
.member-card :deep(.el-card__body) { padding: 0; position: relative; height: 100%; }
.member-card:hover { transform: translateY(-3px); box-shadow: 0 12px 26px rgba(64, 158, 255, .16); }
.member-card.is-disabled { opacity: .72; }
.mc-main { display: flex; flex-direction: column; height: 100%; padding: 18px 18px 12px; padding-right: 68px; }

/* 卡头 */
.mc-head { display: flex; align-items: center; gap: 8px; }
.mc-no { font-family: 'SF Mono', Menlo, Consolas, monospace; font-size: 15px; font-weight: 700; letter-spacing: 1px; color: #1d2129; }
.mc-status { margin-left: auto; }

/* 持卡长者 */
.mc-owner { display: flex; align-items: center; gap: 10px; margin-top: 14px; }
.mc-avatar {
  flex: none; width: 36px; height: 36px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  background: linear-gradient(135deg, #eaf2ff, #d5e4ff); color: #2f6bff;
  font-size: 15px; font-weight: 700;
  box-shadow: 0 0 0 2px #fff, 0 2px 8px rgba(47, 107, 255, .18);
}
.mc-owner-info { display: flex; flex-direction: column; gap: 3px; min-width: 0; }
.mc-name {
  overflow: hidden; white-space: nowrap; text-overflow: ellipsis;
  font-size: 15px; font-weight: 600; color: #1d2129; line-height: 1.2;
}
.mc-phone { display: inline-flex; align-items: center; gap: 4px; font-size: 12px; color: #86909c; }
.mc-phone .el-icon { font-size: 12px; color: #a8abb2; }

/* 余额：一个容器切成左右两半，各自淡底，分摊两种金额 */
.mc-balance {
  display: grid; grid-template-columns: 1fr 1fr;
  margin-top: 14px; overflow: hidden;
  background: #fff; border: 1px solid #ebeff6; border-radius: 12px;
}
.bal-item { display: flex; flex-direction: column; gap: 3px; min-width: 0; padding: 12px 14px;    text-align: center; }
.bal-item--main { background: linear-gradient(90deg, #edf5ff 0%, #f8fbff 100%); }
.bal-item--gift { background: linear-gradient(90deg, #f6f1ff 0%, #fdfbff 100%); }
.bal-label { font-size: 12px; color: #86909c; }
.bal-value {
  overflow: hidden; white-space: nowrap; text-overflow: ellipsis;
  font-size: 18px; line-height: 1.15; font-variant-numeric: tabular-nums;
}
.bal-value--main { font-size: 22px; font-weight: 700; }

/* 累计与开卡日：标签在上、金额在下，窄卡不会被挤成省略号 */
.mc-totals {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr)) auto;
  align-items: start;
  gap: 0 10px;
  margin-top: 12px;
  padding-top: 10px;
  border-top: 1px solid #f2f4f8;
  padding-bottom: 10px;
}
.total-item { display: flex; flex-direction: column; gap: 3px; min-width: 0; }
.total-label { font-size: 12px; color: #86909c; line-height: 1.2;    text-align: center; }
.total-value {
  min-width: 0;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  font-size: 14px;
  font-weight: 600;
  line-height: 1.2;
  color: #1d2129;
  font-variant-numeric: tabular-nums;
      text-align: center;
}
.total-item.is-date { justify-self: end; }
.total-item.is-date .total-value { font-weight: 500; color: #4e5969; }

/* 操作 */
.mc-actions { display: flex; align-items: center; margin-top: auto; padding-top: 10px; border-top: 1px dashed #ebeef5; }
.mc-actions :deep(.el-button + .el-button) { margin-left: 2px; }
.mc-more { margin-left: auto; }

/* 右侧记录入口 */
.mc-record {
  position: absolute; top: 0; right: 0; bottom: 0; width: 54px;
  display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 6px;
  cursor: pointer; color: #409EFF; background: linear-gradient(180deg, #f2f7ff, #e8f1ff);
  border-left: 1px solid #ebeef5;
  transition: all .2s;
}
.mc-record:hover { background: #dbeafe; color: #1d4ed8; }
.mc-record-text { font-size: 12px; }
.mc-record-arrow { font-size: 12px; }

/* 弹窗内套餐展示 */
.pkg-opt { display: flex; align-items: center; gap: 10px; width: 100%; }
.pkg-opt .amt { margin-left: auto; color: #409EFF; font-weight: 600; }
.pkg-detail { background: #f7f8fa; border-radius: 8px; padding: 10px 14px; width: 100%; }
.pkg-detail .row { display: flex; align-items: center; padding: 4px 0; }
.pkg-detail .lbl { color: #86909c; width: 80px; }
.pkg-detail .strike { color: #909399; text-decoration: line-through; }
.pkg-detail .disc { color: #F56C6C; }
.pkg-detail .hl { background: #e8f4ff; margin: 4px -14px; padding: 6px 14px; }
.pkg-detail .actual { color: #409EFF; font-weight: 700; font-size: 16px; }
.form-tip { color: #909399; font-size: 12px; margin-left: 8px; }

/* 套餐管理 */
.pkg-toolbar { display: flex; align-items: center; gap: 12px; margin-bottom: 12px; }
.pkg-tip { color: #909399; font-size: 12px; }

/* 记录抽屉 */
.record-head { display: flex; align-items: center; justify-content: space-between; padding: 12px 16px; background: #f7f9fc; border-radius: 8px; margin-bottom: 12px; }
.record-owner { display: flex; align-items: center; gap: 10px; }
.record-balances { display: flex; align-items: center; gap: 18px; font-size: 13px; color: #86909c; }
.record-filter { margin-bottom: 12px; }
</style>
