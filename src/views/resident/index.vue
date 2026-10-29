<template>
  <div class="app-container">
    <el-alert v-if="pickMode" type="warning" show-icon :closable="false" class="pick-tip"
      title="长者选择模式" description="点击列表行的【选择】按钮选中长者并自动返回，或点击【新增长者】创建后返回。" />
    <!-- 搜索栏 -->
    <el-card shadow="never" class="search-card">
      <el-form :model="queryParams" ref="queryFormRef" :inline="true">
        <el-form-item label="长者姓名" prop="name">
          <el-input v-model="queryParams.name" placeholder="请输入姓名" clearable style="width:150px" @keyup.enter="handleQuery" />
        </el-form-item>
        <el-form-item label="长者编号" prop="residentNo">
          <el-input v-model="queryParams.residentNo" placeholder="请输入编号" clearable style="width:150px" @keyup.enter="handleQuery" />
        </el-form-item>
        <el-form-item label="联系电话" prop="phone">
          <el-input v-model="queryParams.phone" placeholder="请输入电话" clearable style="width:150px" @keyup.enter="handleQuery" />
        </el-form-item>
        <el-form-item label="照护等级" prop="careLevel">
          <el-select v-model="queryParams.careLevel" placeholder="全部" clearable style="width:120px">
            <el-option v-for="o in CARE_LEVEL_OPTIONS" :key="o.value" :label="o.label" :value="o.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="性别" prop="gender">
          <el-select v-model="queryParams.gender" placeholder="全部" clearable style="width:90px">
            <el-option label="男" value="男" />
            <el-option label="女" value="女" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-select v-model="queryParams.status" placeholder="全部" clearable style="width:100px">
            <el-option label="正常" :value="1" />
            <el-option label="停用" :value="0" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleQuery"><el-icon><Search /></el-icon>搜索</el-button>
          <el-button @click="resetQuery"><el-icon><Refresh /></el-icon>重置</el-button>
        </el-form-item>
      </el-form>

      <div class="toolbar">
        <el-button type="primary" @click="handleAdd"><el-icon><Plus /></el-icon>新增长者</el-button>
        <el-button type="danger" plain :disabled="!selectedIds.length" @click="handleBatchDelete">
          <el-icon><Delete /></el-icon>批量删除
        </el-button>
        <el-button plain class="stat-entry" @click="goStat"><el-icon><DataAnalysis /></el-icon>统计分析</el-button>
      </div>
    </el-card>

    <!-- 列表 -->
    <el-card shadow="never">
      <el-table v-loading="loading" :data="list" stripe border @selection-change="handleSelectionChange">
        <el-table-column type="selection" width="50" align="center" />
        <el-table-column label="长者编号" prop="residentNo" min-width="120" align="center" show-overflow-tooltip />
        <el-table-column label="姓名" prop="name" min-width="90" align="center">
          <template #default="{ row }"><span class="res-name" @click="handleUpdate(row)">{{ row.name }}</span></template>
        </el-table-column>
          <el-table-column label="入住日期" prop="admissionDate" width="120" align="center">
          <template #default="{ row }">{{ row.admissionDate || '-' }}</template>
        </el-table-column>
        <el-table-column label="入住状态" prop="checkInStatus" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="getCheckInStatusTagType(row.checkInStatus)" size="small" effect="plain">{{ getCheckInStatusName(row.checkInStatus) || '-' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="房间号" prop="roomNo" width="100" align="center">
          <template #default="{ row }">{{ row.roomNo || '-' }}</template>
        </el-table-column>
        <el-table-column label="床铺号" prop="bedNo" width="100" align="center">
          <template #default="{ row }">{{ row.bedNo || '-' }}</template>
        </el-table-column>
        <el-table-column label="性别" prop="gender" width="60" align="center" />
        <el-table-column label="年龄" width="60" align="center">
          <template #default="{ row }">{{ calcAge(row.birthDate) }}</template>
        </el-table-column>
        <el-table-column label="民族" width="70" align="center">
          <template #default="{ row }">{{ row.nation || '-' }}</template>
        </el-table-column>
        <el-table-column label="联系电话" prop="phone" min-width="120" align="center" />
        <el-table-column label="婚姻状况" width="90" align="center">
          <template #default="{ row }">{{ enumName(MARITAL_STATUS_OPTIONS, row.maritalStatus) || '-' }}</template>
        </el-table-column>
        <el-table-column label="文化程度" width="100" align="center">
          <template #default="{ row }">{{ enumName(EDUCATION_OPTIONS, row.education) || '-' }}</template>
        </el-table-column>
        <el-table-column label="照护等级" prop="careLevel" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="getCareLevelTag(row.careLevel)" size="small" effect="plain">{{ getCareLevelName(row.careLevel) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="自理能力" width="90" align="center">
          <template #default="{ row }">{{ enumName(SELF_CARE_OPTIONS, row.selfCareAbility) || '-' }}</template>
        </el-table-column>
        <el-table-column label="认知状况" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="row.cognitiveStatus === 3 ? 'danger' : row.cognitiveStatus === 2 ? 'warning' : 'success'" size="small" effect="plain">{{ enumName(COGNITIVE_OPTIONS, row.cognitiveStatus) || '-' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="跌倒风险" width="90" align="center">
          <template #default="{ row }">
            <el-tag :type="row.fallRisk === 3 ? 'danger' : row.fallRisk === 2 ? 'warning' : 'info'" size="small" effect="plain">{{ enumName(FALL_RISK_OPTIONS, row.fallRisk) || '-' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="医保类型" width="100" align="center">
          <template #default="{ row }">{{ enumName(MEDICAL_INSURANCE_OPTIONS, row.medicalInsuranceType) || '-' }}</template>
        </el-table-column>
        <el-table-column label="担保人" width="100" align="center" show-overflow-tooltip>
          <template #default="{ row }">{{ row.guarantor || '-' }}</template>
        </el-table-column>
      
        <el-table-column label="状态" prop="status" width="80" align="center">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : 'info'" size="small">{{ row.status === 1 ? '正常' : '停用' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" :width="pickMode ? 100 : 280" align="center" fixed="right">
          <template #default="{ row }">
            <el-button v-if="pickMode" link type="primary" size="small" @click="pick(row)">选择</el-button>
            <div v-else class="op-cell">
              <el-button link type="primary" size="small" @click="handleUpdate(row)"><el-icon><Edit /></el-icon>编辑</el-button>
              <el-button link :type="row.checkInStatus === 1 ? 'warning' : 'info'" size="small" @click="handleProcess(row)"><el-icon><Promotion /></el-icon>{{ row.checkInStatus === 1 ? '办理离开' : '办理登记' }}</el-button>
              <el-button link type="success" size="small" @click="openFamily(row)"><el-icon><User /></el-icon>家属</el-button>
              <el-button link type="warning" size="small" @click="openCardDrawer(row)"><el-icon><CreditCard /></el-icon>收费卡</el-button>
              <el-button link type="primary" size="small" @click="goContracts(row)"><el-icon><Document /></el-icon>关联合同</el-button>
              <el-button link type="danger" size="small" @click="handleDelete(row)"><el-icon><Delete /></el-icon>删除</el-button>
            </div>
          </template>
        </el-table-column>
      </el-table>
      <pagination v-show="total > 0" :total="total" v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize" @pagination="getList" />
    </el-card>

    <!-- 新增/编辑 -->
    <el-dialog v-model="formVisible" :title="formTitle" width="900px" :close-on-click-modal="false" destroy-on-close>
      <el-form :model="form" :rules="formRules" ref="formRef" label-width="96px">
        <el-tabs v-model="activeTab">
          <el-tab-pane label="基础信息" name="basic">
            <el-row :gutter="20">
              <el-col :span="8"><el-form-item label="长者姓名" prop="name"><el-input v-model="form.name" placeholder="请输入姓名" maxlength="20" /></el-form-item></el-col>
              <el-col :span="8"><el-form-item label="长者编号" prop="residentNo"><el-input v-model="form.residentNo" placeholder="留空自动生成" maxlength="30"><template #append><el-button @click="genResidentNo">生成</el-button></template></el-input></el-form-item></el-col>
              <el-col :span="8"><el-form-item label="性别" prop="gender"><el-radio-group v-model="form.gender"><el-radio label="男">男</el-radio><el-radio label="女">女</el-radio></el-radio-group></el-form-item></el-col>
            </el-row>
            <el-row :gutter="20">
              <el-col :span="8"><el-form-item label="身份证号" prop="idCard"><el-input v-model="form.idCard" placeholder="18位自动识别生日/性别" maxlength="18" @blur="parseIdCard" /></el-form-item></el-col>
              <el-col :span="8"><el-form-item label="出生日期" prop="birthDate"><el-date-picker v-model="form.birthDate" type="date" value-format="YYYY-MM-DD" placeholder="请选择" style="width:100%" /></el-form-item></el-col>
              <el-col :span="8"><el-form-item label="联系电话" prop="phone"><el-input v-model="form.phone" placeholder="请输入联系电话" maxlength="20" /></el-form-item></el-col>
            </el-row>
            <el-row :gutter="20">
              <el-col :span="8"><el-form-item label="民族" prop="nation"><el-input v-model="form.nation" placeholder="如：汉族" maxlength="20" /></el-form-item></el-col>
              <el-col :span="8"><el-form-item label="籍贯" prop="nativePlace"><el-input v-model="form.nativePlace" placeholder="请输入籍贯" maxlength="30" /></el-form-item></el-col>
              <el-col :span="8"><el-form-item label="血型" prop="bloodType"><el-select v-model="form.bloodType" placeholder="请选择" clearable style="width:100%"><el-option v-for="b in BLOOD_TYPE_OPTIONS" :key="b" :label="b" :value="b" /></el-select></el-form-item></el-col>
            </el-row>
            <el-row :gutter="20">
              <el-col :span="8"><el-form-item label="婚姻状况" prop="maritalStatus"><el-select v-model="form.maritalStatus" placeholder="请选择" clearable style="width:100%"><el-option v-for="o in MARITAL_STATUS_OPTIONS" :key="o.value" :label="o.label" :value="o.value" /></el-select></el-form-item></el-col>
              <el-col :span="8"><el-form-item label="文化程度" prop="education"><el-select v-model="form.education" placeholder="请选择" clearable style="width:100%"><el-option v-for="o in EDUCATION_OPTIONS" :key="o.value" :label="o.label" :value="o.value" /></el-select></el-form-item></el-col>
              <el-col :span="8"><el-form-item label="政治面貌" prop="politicalStatus"><el-input v-model="form.politicalStatus" placeholder="如：中共党员" maxlength="20" /></el-form-item></el-col>
            </el-row>
            <el-row :gutter="20">
              <el-col :span="8"><el-form-item label="宗教信仰" prop="religion"><el-input v-model="form.religion" placeholder="无 / 佛教等" maxlength="20" /></el-form-item></el-col>
              <el-col :span="16"><el-form-item label="家庭住址" prop="address"><el-input v-model="form.address" placeholder="请输入家庭住址" maxlength="120" /></el-form-item></el-col>
            </el-row>
          </el-tab-pane>

          <el-tab-pane label="健康与照护" name="health">
            <el-row :gutter="20">
              <el-col :span="8"><el-form-item label="照护等级" prop="careLevel"><el-select v-model="form.careLevel" placeholder="请选择" style="width:100%"><el-option v-for="o in CARE_LEVEL_OPTIONS" :key="o.value" :label="o.label" :value="o.value" /></el-select></el-form-item></el-col>
              <el-col :span="8"><el-form-item label="自理能力" prop="selfCareAbility"><el-select v-model="form.selfCareAbility" placeholder="请选择" clearable style="width:100%"><el-option v-for="o in SELF_CARE_OPTIONS" :key="o.value" :label="o.label" :value="o.value" /></el-select></el-form-item></el-col>
              <el-col :span="8"><el-form-item label="认知状况" prop="cognitiveStatus"><el-select v-model="form.cognitiveStatus" placeholder="请选择" clearable style="width:100%"><el-option v-for="o in COGNITIVE_OPTIONS" :key="o.value" :label="o.label" :value="o.value" /></el-select></el-form-item></el-col>
            </el-row>
            <el-row :gutter="20">
              <el-col :span="6"><el-form-item label="身高(cm)" prop="height"><el-input-number v-model="form.height" :min="0" controls-position="right" style="width:100%" /></el-form-item></el-col>
              <el-col :span="6"><el-form-item label="体重(kg)" prop="weight"><el-input-number v-model="form.weight" :min="0" controls-position="right" style="width:100%" /></el-form-item></el-col>
              <el-col :span="6"><el-form-item label="ADL评分" prop="adlScore"><el-input-number v-model="form.adlScore" :min="0" :max="100" controls-position="right" style="width:100%" /></el-form-item></el-col>
              <el-col :span="6"><el-form-item label="跌倒风险" prop="fallRisk"><el-select v-model="form.fallRisk" placeholder="请选择" clearable style="width:100%"><el-option v-for="o in FALL_RISK_OPTIONS" :key="o.value" :label="o.label" :value="o.value" /></el-select></el-form-item></el-col>
            </el-row>
            <el-row :gutter="20">
              <el-col :span="12"><el-form-item label="健康状况" prop="healthStatus"><el-input v-model="form.healthStatus" placeholder="如：高血压，规律服药" maxlength="120" /></el-form-item></el-col>
              <el-col :span="12"><el-form-item label="慢性病" prop="chronicDisease"><el-input v-model="form.chronicDisease" placeholder="如：糖尿病、冠心病" maxlength="120" /></el-form-item></el-col>
            </el-row>
            <el-row :gutter="20">
              <el-col :span="12"><el-form-item label="过敏史" prop="allergyHistory"><el-input v-model="form.allergyHistory" placeholder="如：青霉素过敏" maxlength="120" /></el-form-item></el-col>
              <el-col :span="12"><el-form-item label="用药情况" prop="medication"><el-input v-model="form.medication" placeholder="请输入当前用药" maxlength="120" /></el-form-item></el-col>
            </el-row>
            <el-form-item label="既往病史" prop="medicalHistory"><el-input v-model="form.medicalHistory" type="textarea" :rows="2" placeholder="请输入既往病史" maxlength="200" /></el-form-item>
            <el-form-item label="家族病史" prop="familyHistory"><el-input v-model="form.familyHistory" type="textarea" :rows="2" placeholder="请输入家族病史" maxlength="200" /></el-form-item>
            <el-row :gutter="20">
              <el-col :span="8"><el-form-item label="护理等级" prop="nursingLevel"><el-input v-model="form.nursingLevel" placeholder="如：一级护理" maxlength="20" /></el-form-item></el-col>
              <el-col :span="8"><el-form-item label="膳食类型" prop="dietType"><el-select v-model="form.dietType" placeholder="请选择或输入" clearable filterable allow-create style="width:100%"><el-option v-for="d in DIET_TYPE_OPTIONS" :key="d" :label="d" :value="d" /></el-select></el-form-item></el-col>
              <el-col :span="8"><el-form-item label="特殊饮食" prop="specialDiet"><el-input v-model="form.specialDiet" placeholder="如：低盐低糖" maxlength="60" /></el-form-item></el-col>
            </el-row>
            <el-form-item label="兴趣爱好" prop="hobbies"><el-input v-model="form.hobbies" placeholder="如：书法、下棋" maxlength="120" /></el-form-item>
          </el-tab-pane>

          <el-tab-pane label="医保与经济" name="finance">
            <el-row :gutter="20">
              <el-col :span="8"><el-form-item label="医保类型" prop="medicalInsuranceType"><el-select v-model="form.medicalInsuranceType" placeholder="请选择" clearable style="width:100%"><el-option v-for="o in MEDICAL_INSURANCE_OPTIONS" :key="o.value" :label="o.label" :value="o.value" /></el-select></el-form-item></el-col>
              <el-col :span="8"><el-form-item label="医保卡号" prop="medicalInsuranceNo"><el-input v-model="form.medicalInsuranceNo" placeholder="请输入医保卡号" maxlength="30" /></el-form-item></el-col>
              <el-col :span="8"><el-form-item label="社保卡号" prop="socialSecurityNo"><el-input v-model="form.socialSecurityNo" placeholder="请输入社保卡号" maxlength="30" /></el-form-item></el-col>
            </el-row>
            <el-row :gutter="20">
              <el-col :span="8"><el-form-item label="经济来源" prop="incomeSource"><el-input v-model="form.incomeSource" placeholder="如：退休金、子女供养" maxlength="30" /></el-form-item></el-col>
              <el-col :span="8"><el-form-item label="担保人" prop="guarantor"><el-input v-model="form.guarantor" placeholder="请输入担保人姓名" maxlength="20" /></el-form-item></el-col>
              <el-col :span="8"><el-form-item label="担保人电话" prop="guarantorPhone"><el-input v-model="form.guarantorPhone" placeholder="请输入担保人电话" maxlength="20" /></el-form-item></el-col>
            </el-row>
          </el-tab-pane>

          <el-tab-pane label="联系与备注" name="contact">
            <el-row :gutter="20">
              <el-col :span="8"><el-form-item label="紧急联系人" prop="emergencyContact"><el-input v-model="form.emergencyContact" placeholder="请输入紧急联系人" maxlength="20" /></el-form-item></el-col>
              <el-col :span="8"><el-form-item label="紧急电话" prop="emergencyPhone"><el-input v-model="form.emergencyPhone" placeholder="请输入紧急联系人电话" maxlength="20" /></el-form-item></el-col>
              <el-col :span="8"><el-form-item label="状态" prop="status"><el-radio-group v-model="form.status"><el-radio :label="1">正常</el-radio><el-radio :label="0">停用</el-radio></el-radio-group></el-form-item></el-col>
            </el-row>
            <el-form-item label="备注" prop="remarks"><el-input v-model="form.remarks" type="textarea" :rows="3" placeholder="请输入备注" maxlength="200" show-word-limit /></el-form-item>
          </el-tab-pane>
        </el-tabs>
      </el-form>
      <template #footer>
        <el-button @click="formVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitLoading" @click="submitForm">{{ form.id ? '保存修改' : '确认新增' }}</el-button>
      </template>
    </el-dialog>

    <!-- 办理入口：已改为跳转「入住登记」/「退住交接」页（见操作列「办理」按钮） -->

    <!-- 收费卡抽屉：头部会员卡信息 + 下方消费记录 -->
    <el-drawer v-model="cardDrawerVisible" :title="`收费卡 - ${cardResident.name || ''}`" size="820px" destroy-on-close>
      <div v-loading="cardLoading" class="card-drawer-body">
        <div v-if="residentCard" class="card-hero">
          <div class="hero-top">
            <span class="hero-no"><el-icon><CreditCard /></el-icon>{{ residentCard.cardNo }}</span>
            <span class="hero-tags">
              <el-tag :type="getCardLevelTag(residentCard.cardLevel)" effect="dark" size="small">{{ getCardLevelLabel(residentCard.cardLevel) }}</el-tag>
              <el-tag :type="getCardStatusTag(residentCard.status)" size="small">{{ getCardStatusLabel(residentCard.status) }}</el-tag>
            </span>
          </div>
          <div class="hero-balances">
            <div class="hb"><span class="hb-label">卡内余额</span><span class="hb-value primary">¥{{ fmtMoney(residentCard.balance) }}</span></div>
            <div class="hb"><span class="hb-label">赠送余额</span><span class="hb-value gift">¥{{ fmtMoney(residentCard.giftBalance) }}</span></div>
          </div>
          <div class="hero-meta">
            <span>累计充值 <b>¥{{ fmtMoney(residentCard.totalRecharge) }}</b></span>
            <span>累计消费 <b>¥{{ fmtMoney(residentCard.totalConsume) }}</b></span>
            <span>开卡日期 <b>{{ residentCard.openDate || '-' }}</b></span>
          </div>
        </div>

        <el-empty v-else-if="!cardLoading" description="该长者暂无收费卡">
          <el-button type="primary" @click="goCardPage"><el-icon><Plus /></el-icon>去开卡 / 充值</el-button>
        </el-empty>

        <template v-if="residentCard">
          <div class="record-toolbar">
            <span class="record-title">消费记录</span>
            <el-radio-group v-model="cardRecordQuery.tradeType" size="small" @change="handleCardRecordTypeChange">
              <el-radio-button v-for="t in CARD_RECORD_TABS" :key="t.value" :label="t.value">{{ t.label }}</el-radio-button>
            </el-radio-group>
          </div>
          <el-table v-loading="cardRecordLoading" :data="cardRecordList" stripe border size="small">
            <el-table-column label="类型" prop="tradeType" width="76" align="center">
              <template #default="{ row }"><el-tag :type="getTradeTag(row.tradeType)" size="small">{{ getTradeLabel(row.tradeType) }}</el-tag></template>
            </el-table-column>
            <el-table-column label="金额" width="98" align="right">
              <template #default="{ row }"><span :class="row.tradeType === 'consume' ? 'expense' : 'income'">{{ row.tradeType === 'consume' ? '-' : '+' }}{{ fmtMoney(row.amount) }}</span></template>
            </el-table-column>
            <el-table-column label="赠送" width="86" align="right">
              <template #default="{ row }">{{ fmtMoney(row.giftAmount) }}</template>
            </el-table-column>
            <el-table-column label="交易前余额" width="104" align="right">
              <template #default="{ row }">¥{{ fmtMoney(row.beforeBalance) }}</template>
            </el-table-column>
            <el-table-column label="交易后余额" width="104" align="right">
              <template #default="{ row }">¥{{ fmtMoney(row.afterBalance) }}</template>
            </el-table-column>
            <el-table-column label="支付方式" width="86" align="center">
              <template #default="{ row }">{{ getPayLabel(row.payMethod) }}</template>
            </el-table-column>
            <el-table-column label="交易时间" prop="tradeTime" width="160" align="center" />
            <el-table-column label="备注" prop="remark" min-width="120" show-overflow-tooltip />
            <template #empty><el-empty description="暂无交易记录" /></template>
          </el-table>
          <pagination v-show="cardRecordTotal > 0" :total="cardRecordTotal" v-model:page="cardRecordQuery.pageNum" v-model:limit="cardRecordQuery.pageSize" @pagination="loadCardRecords" />
        </template>
      </div>
    </el-drawer>

    <!-- 家属管理抽屉（不再跳转独立页面） -->
    <el-drawer v-model="familyDrawerVisible" :title="`家属管理 - ${familyResident.name || ''}`" size="720px" destroy-on-close>
      <div class="family-toolbar">
        <el-alert :closable="false" type="info" class="family-resident-tip">
          当前长者：<strong>{{ familyResident.name || '-' }}</strong>
        </el-alert>
        <el-button type="primary" @click="handleFamilyAdd"><el-icon><Plus /></el-icon>新增家属</el-button>
      </div>
      <el-table v-loading="familyLoading" :data="familyList" stripe border>
        <el-table-column label="家属姓名" prop="name" min-width="100" align="center" />
        <el-table-column label="与长者关系" prop="relationship" min-width="100" align="center">
          <template #default="{ row }"><el-tag size="small" effect="plain">{{ row.relationship || '-' }}</el-tag></template>
        </el-table-column>
        <el-table-column label="联系电话" prop="phone" min-width="120" align="center" />
        <el-table-column label="住址" prop="address" min-width="150" show-overflow-tooltip />
        <el-table-column label="紧急联系人" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="row.isEmergencyContact === 1 ? 'danger' : 'info'" size="small">{{ row.isEmergencyContact === 1 ? '是' : '否' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="130" align="center" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" size="small" @click="handleFamilyUpdate(row)"><el-icon><Edit /></el-icon>编辑</el-button>
            <el-button link type="danger" size="small" @click="handleFamilyDelete(row)"><el-icon><Delete /></el-icon>删除</el-button>
          </template>
        </el-table-column>
        <template #empty><el-empty description="该长者暂无家属记录" /></template>
      </el-table>
    </el-drawer>

    <!-- 新增/编辑家属 -->
    <el-dialog v-model="familyFormVisible" :title="familyFormTitle" width="520px" append-to-body :close-on-click-modal="false" destroy-on-close>
      <el-form :model="familyForm" :rules="familyFormRules" ref="familyFormRef" label-width="100px">
        <el-form-item label="家属姓名" prop="name"><el-input v-model="familyForm.name" placeholder="请输入家属姓名" maxlength="20" /></el-form-item>
        <el-form-item label="与长者关系" prop="relationship">
          <el-select v-model="familyForm.relationship" placeholder="请选择或输入" filterable allow-create default-first-option style="width:100%">
            <el-option label="子女" value="子女" />
            <el-option label="配偶" value="配偶" />
            <el-option label="父母" value="父母" />
            <el-option label="兄弟姐妹" value="兄弟姐妹" />
            <el-option label="亲属" value="亲属" />
            <el-option label="其他" value="其他" />
          </el-select>
        </el-form-item>
        <el-form-item label="联系电话" prop="phone"><el-input v-model="familyForm.phone" placeholder="请输入联系电话" maxlength="20" /></el-form-item>
        <el-form-item label="住址" prop="address"><el-input v-model="familyForm.address" placeholder="请输入住址" maxlength="120" /></el-form-item>
        <el-form-item label="紧急联系人" prop="isEmergencyContact"><el-switch v-model="familyForm.isEmergencyContact" :active-value="1" :inactive-value="0" active-text="是" inactive-text="否" /></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="familyFormVisible = false">取消</el-button>
        <el-button type="primary" :loading="familySubmitLoading" @click="submitFamilyForm">{{ familyForm.id ? '保存修改' : '确认新增' }}</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup name="ResidentManage">
import { ref, reactive, onMounted, getCurrentInstance } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { getResidentsList, getResidentDetail, addResident, updateResident, deleteResident, getFamilyMembers, addFamilyMember, updateFamilyMember, deleteFamilyMember } from '@/api/residents'
import { getCheckinList } from '@/api/care/checkin'
import { getCustomerResidentCard, getResidentCardConsumeRecords } from '@/api/resident/residentCard'
import {
  CARE_LEVEL_OPTIONS, getCareLevelName, enumName,
  MARITAL_STATUS_OPTIONS, EDUCATION_OPTIONS, SELF_CARE_OPTIONS, COGNITIVE_OPTIONS,
  FALL_RISK_OPTIONS, MEDICAL_INSURANCE_OPTIONS,
  getCheckInStatusName, getCheckInStatusTagType
} from '@/utils/careEnums'

const { proxy } = getCurrentInstance()
const router = useRouter()
const route = useRoute()

const loading = ref(false)
const list = ref([])
const total = ref(0)
const selectedIds = ref([])

const queryParams = reactive({
  pageNum: 1, pageSize: 10,
  name: '', residentNo: '', phone: '', careLevel: undefined, gender: undefined, status: undefined
})

const formVisible = ref(false)
const formTitle = ref('')
const submitLoading = ref(false)
const activeTab = ref('basic')
const pickMode = ref(false)

const defaultForm = () => ({
  id: undefined,
  // 基础信息
  residentNo: '', name: '', gender: '男', birthDate: '', idCard: '', phone: '', address: '',
  nation: '', nativePlace: '', bloodType: '', maritalStatus: undefined, education: undefined,
  politicalStatus: '', religion: '',
  // 健康与照护
  careLevel: 1, selfCareAbility: undefined, cognitiveStatus: undefined,
  height: undefined, weight: undefined, adlScore: undefined, fallRisk: undefined,
  healthStatus: '', chronicDisease: '', medicalHistory: '', familyHistory: '', allergyHistory: '', medication: '',
  nursingLevel: '', dietType: '', specialDiet: '', hobbies: '',
  // 医保与经济
  medicalInsuranceType: undefined, medicalInsuranceNo: '', socialSecurityNo: '', incomeSource: '',
  guarantor: '', guarantorPhone: '',
  // 联系人与状态
  emergencyContact: '', emergencyPhone: '', remarks: '', status: 1,
  // 入住/离店（由“入住/退住办理”维护，基本信息表单不编辑）
  admissionDate: '', checkInTime: '', checkOutTime: '', roomId: undefined, bedId: undefined,
  checkInType: undefined, checkInReason: '', checkOutReason: '', settlementStatus: undefined,
  checkInStatus: 0, roomNo: '', bedNo: ''
})
const form = ref(defaultForm())

// 入住/退住办理（与基本信息隔离）
const BLOOD_TYPE_OPTIONS = ['A', 'B', 'O', 'AB', '不详']
const DIET_TYPE_OPTIONS = ['普食', '软食', '半流质', '流质', '鼻饲']
// 入住/退住通过「入住登记」表单与「退住交接」单页处理（见操作列「办理」按钮跳转）
const formRules = {
  name:      [{ required: true, message: '长者姓名不能为空', trigger: 'blur' }],
  residentNo:[{ required: true, message: '长者编号不能为空', trigger: 'blur' }],
  idCard:    [{ required: true, message: '身份证号不能为空', trigger: 'blur' }],
  phone:     [{ pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号', trigger: 'blur' }]
}

function getCareLevelTag(level) { const m = { 1: 'success', 2: 'warning', 3: 'danger' }; return m[level] ?? 'info' }

function calcAge(birthDate) {
  if (!birthDate) return '-'
  const b = new Date(birthDate)
  if (isNaN(b.getTime())) return '-'
  const now = new Date()
  let age = now.getFullYear() - b.getFullYear()
  const m = now.getMonth() - b.getMonth()
  if (m < 0 || (m === 0 && now.getDate() < b.getDate())) age--
  return age >= 0 ? age : '-'
}

async function getList() {
  loading.value = true
  try {
    const res = await getResidentsList(queryParams)
    list.value = res.data?.list || []
    total.value = res.data?.totalCount || 0
  } catch {
    list.value = []
    total.value = 0
  } finally {
    loading.value = false
  }
}

function handleQuery() { queryParams.pageNum = 1; getList() }
function resetQuery() {
  queryParams.name = ''
  queryParams.residentNo = ''
  queryParams.phone = ''
  queryParams.careLevel = undefined
  queryParams.gender = undefined
  queryParams.status = undefined
  handleQuery()
}
function handleSelectionChange(sel) { selectedIds.value = sel.map(s => s.id) }

function handleAdd() {
  form.value = defaultForm()
  genResidentNo()
  activeTab.value = 'basic'
  formTitle.value = '新增长者'
  formVisible.value = true
  proxy.$nextTick(() => proxy.$refs.formRef?.clearValidate())
}

// 一键生成长者编号：R + yyyyMMdd + 3位随机
function genResidentNo() {
  const d = new Date()
  const p = (n) => String(n).padStart(2, '0')
  form.value.residentNo = 'R' + d.getFullYear() + p(d.getMonth() + 1) + p(d.getDate()) + p(Math.floor(Math.random() * 1000))
}
// 身份证自动识别：回填出生日期 + 性别
function parseIdCard() {
  const id = (form.value.idCard || '').trim()
  if (!/^\d{17}[\dXx]$/.test(id)) return
  form.value.birthDate = `${id.substr(6, 4)}-${id.substr(10, 2)}-${id.substr(12, 2)}`
  form.value.gender = parseInt(id.charAt(16), 10) % 2 === 1 ? '男' : '女'
}

async function handleUpdate(row) {
  form.value = defaultForm()
  try {
    const res = await getResidentDetail(row.id)
    form.value = { ...defaultForm(), ...(res.data || row) }
  } catch {
    form.value = { ...defaultForm(), ...row }
  }
  formTitle.value = '编辑长者'
  activeTab.value = 'basic'
  formVisible.value = true
  proxy.$nextTick(() => proxy.$refs.formRef?.clearValidate())
}

async function submitForm() {
  const valid = await proxy.$refs.formRef.validate().catch(() => false)
  // 身份证等必填项在「基础信息」页，校验未过时切回该页再提示
  if (!valid) { activeTab.value = 'basic'; return }
  submitLoading.value = true
  const isAdd = !form.value.id
  const pickedName = form.value.name
  try {
    const api = isAdd ? addResident : updateResident
    const res = await api(form.value)
    proxy.$modal.msgSuccess(isAdd ? '新增成功' : '修改成功')
    formVisible.value = false
    // 选择模式下新增长者后，携带新ID返回来源页并自动选中
    if (isAdd && pickMode.value) {
      finishPick(res?.data?.id, pickedName)
      return
    }
    getList()
  } finally {
    submitLoading.value = false
  }
}

// 办理：在住→跳转退住交接单页；否则→跳转入住登记表单（带入当前长者）
function handleProcess(row) {
  if (Number(row.checkInStatus) === 1) doCheckOut(row)
  else goCheckin(row)
}
// 办理登记：跳转入住登记表单，预选当前长者档案
function goCheckin(row) {
  router.push({ path: '/eyang/checkin/form', query: { residentId: row.id, residentName: row.name } })
}
// 关联合同：跳转合同列表，按当前长者精确筛选
function goContracts(row) {
  router.push({ path: '/kh/contract', query: { residentId: row.id, residentName: row.name } })
}
// 统计分析：跳转独立的长者档案统计页
function goStat() {
  router.push('/kh/resident-stat')
}
// 办理离开：定位该长者当前待入住/康养中的入住单，跳转退住交接单页
async function doCheckOut(row) {
  try {
    const res = await getCheckinList({ residentId: row.id, pageNum: 1, pageSize: 10 })
    const orders = (res.data?.list || []).filter(o => Number(o.checkinStatus) === 1 || Number(o.checkinStatus) === 2)
    if (!orders.length) { proxy.$modal.msgWarning('该长者暂无在住的入住单，无法办理离开'); return }
    router.push({ path: '/eyang/checkout/form', query: { id: orders[0].id } })
  } catch {
    proxy.$modal.msgError('查询入住单失败，请稍后重试')
  }
}

function handleDelete(row) {
  proxy.$modal.confirm(`确认删除长者【${row.name}】吗？`).then(() => {
    deleteResident(row.id).then(() => {
      proxy.$modal.msgSuccess('删除成功'); getList()
    })
  }).catch(() => {})
}

function handleBatchDelete() {
  proxy.$modal.confirm(`确认删除选中的 ${selectedIds.value.length} 位长者吗？`).then(() => {
    deleteResident(selectedIds.value).then(() => {
      proxy.$modal.msgSuccess('批量删除成功'); getList()
    })
  }).catch(() => {})
}

// ─── 收费卡（抽屉内看会员卡信息 + 消费记录，不再跳转独立页面） ───
const cardDrawerVisible = ref(false)
const cardLoading = ref(false)
const cardResident = ref({ id: undefined, name: '' })
const residentCard = ref(null)
const cardRecordLoading = ref(false)
const cardRecordList = ref([])
const cardRecordTotal = ref(0)
const cardRecordQuery = reactive({ cardId: undefined, pageNum: 1, pageSize: 10, tradeType: '' })
const CARD_RECORD_TABS = [
  { label: '全部', value: '' },
  { label: '消费', value: 'consume' },
  { label: '充值', value: 'recharge' },
  { label: '开卡', value: 'open' }
]
function fmtMoney(v) { return (Number(v) || 0).toFixed(2) }
function getCardLevelLabel(l) { return ({ 0: '普通卡', 1: '银卡', 2: '金卡', 3: '钻石卡' })[l] ?? '普通卡' }
function getCardLevelTag(l) { return ({ 0: 'info', 1: '', 2: 'warning', 3: 'danger' })[l] ?? 'info' }
function getCardStatusLabel(s) { return ({ 1: '正常', 2: '挂失', 0: '注销' })[s] ?? '未知' }
function getCardStatusTag(s) { return ({ 1: 'success', 2: 'warning', 0: 'info' })[s] ?? 'info' }
function getTradeLabel(t) { return ({ consume: '消费', recharge: '充值', refund: '退款', open: '开卡' })[t] ?? (t || '-') }
function getTradeTag(t) { return ({ consume: 'danger', recharge: 'success', refund: 'warning', open: 'primary' })[t] ?? 'info' }
function getPayLabel(p) { return ({ wechat: '微信', alipay: '支付宝', cash: '现金', card: '银行卡' })[p] ?? (p || '-') }

function openCardDrawer(row) {
  cardResident.value = { id: row.id, name: row.name || '', phone: row.phone || '' }
  residentCard.value = null
  cardRecordList.value = []
  cardRecordTotal.value = 0
  cardRecordQuery.cardId = undefined
  cardRecordQuery.pageNum = 1
  cardRecordQuery.tradeType = ''
  cardDrawerVisible.value = true
  loadResidentCard()
}
async function loadResidentCard() {
  cardLoading.value = true
  try {
    const res = await getCustomerResidentCard(cardResident.value.id)
    residentCard.value = res.data || null
    cardRecordQuery.cardId = residentCard.value?.id
  } catch {
    residentCard.value = null
  } finally {
    cardLoading.value = false
  }
  if (residentCard.value) loadCardRecords()
}
function handleCardRecordTypeChange() { cardRecordQuery.pageNum = 1; loadCardRecords() }
async function loadCardRecords() {
  if (!cardRecordQuery.cardId) { cardRecordList.value = []; cardRecordTotal.value = 0; return }
  cardRecordLoading.value = true
  try {
    const params = { cardId: cardRecordQuery.cardId, pageNum: cardRecordQuery.pageNum, pageSize: cardRecordQuery.pageSize }
    if (cardRecordQuery.tradeType) params.tradeType = cardRecordQuery.tradeType
    const res = await getResidentCardConsumeRecords(params)
    cardRecordList.value = res.data?.list || []
    cardRecordTotal.value = res.data?.totalCount || 0
  } catch {
    cardRecordList.value = []
    cardRecordTotal.value = 0
  } finally {
    cardRecordLoading.value = false
  }
}
// 抽屉内无卡时，去收费卡页开卡 / 充值
function goCardPage() {
  cardDrawerVisible.value = false
  goCard({ id: cardResident.value.id, name: cardResident.value.name, phone: cardResident.value.phone })
}
// 带长者信息跳会员卡页：开卡弹窗自动赋值
function goCard(row) { router.push({ path: '/kh/card', query: { residentId: row.id, residentName: row.name, residentPhone: row.phone } }) }

// ─── 家属管理（抽屉内增删改查，不再跳转独立页面） ───
const familyDrawerVisible = ref(false)
const familyResident = ref({ id: undefined, name: '' })
const familyList = ref([])
const familyLoading = ref(false)
const familyFormVisible = ref(false)
const familyFormTitle = ref('')
const familySubmitLoading = ref(false)
const defaultFamilyForm = () => ({
  id: undefined, residentId: undefined, name: '', relationship: '', phone: '', address: '', isEmergencyContact: 0
})
const familyForm = ref(defaultFamilyForm())
const familyFormRules = {
  name:         [{ required: true, message: '家属姓名不能为空', trigger: 'blur' }],
  relationship: [{ required: true, message: '请选择与长者关系', trigger: 'change' }],
  phone:        [{ pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号', trigger: 'blur' }]
}
function openFamily(row) {
  familyResident.value = { id: row.id, name: row.name }
  familyDrawerVisible.value = true
  loadFamily()
}
async function loadFamily() {
  if (!familyResident.value.id) { familyList.value = []; return }
  familyLoading.value = true
  try {
    const res = await getFamilyMembers(familyResident.value.id)
    familyList.value = res.data || []
  } catch {
    familyList.value = []
  } finally {
    familyLoading.value = false
  }
}
function handleFamilyAdd() {
  familyForm.value = { ...defaultFamilyForm(), residentId: familyResident.value.id }
  familyFormTitle.value = '新增家属'
  familyFormVisible.value = true
  proxy.$nextTick(() => proxy.$refs.familyFormRef?.clearValidate())
}
function handleFamilyUpdate(row) {
  familyForm.value = { ...defaultFamilyForm(), ...row, residentId: familyResident.value.id }
  familyFormTitle.value = '编辑家属'
  familyFormVisible.value = true
  proxy.$nextTick(() => proxy.$refs.familyFormRef?.clearValidate())
}
async function submitFamilyForm() {
  await proxy.$refs.familyFormRef.validate()
  familySubmitLoading.value = true
  try {
    const api = familyForm.value.id ? updateFamilyMember : addFamilyMember
    await api(familyForm.value)
    proxy.$modal.msgSuccess(familyForm.value.id ? '修改成功' : '新增成功')
    familyFormVisible.value = false
    loadFamily()
  } finally {
    familySubmitLoading.value = false
  }
}
function handleFamilyDelete(row) {
  proxy.$modal.confirm(`确认删除家属【${row.name}】吗？`).then(() => {
    deleteFamilyMember(row.id).then(() => {
      proxy.$modal.msgSuccess('删除成功'); loadFamily()
    })
  }).catch(() => {})
}

// ─── 选择模式：向来源页回传所选长者（sessionStorage 交接 + 返回） ───
const PICK_KEY = 'ginkgo_resident_pick'
function pick(row) { finishPick(row.id, row.name, row.phone) }
function finishPick(id, name, phone) {
  if (!id) { proxy.$modal.msgError('未获取到长者ID，请手动选择'); getList(); return }
  try { sessionStorage.setItem(PICK_KEY, JSON.stringify({ id, name, phone, ts: Date.now() })) } catch { /* ignore */ }
  router.back()
}

onMounted(() => {
  pickMode.value = route.query.select === '1'
  getList()
  if (route.query.action === 'add') handleAdd()
})
</script>

<style scoped>
.pick-tip { margin-bottom: 12px; }
.search-card { margin-bottom: 16px; }
.toolbar { display: flex; align-items: center; gap: 8px; margin-top: 12px; padding-top: 12px; border-top: 1px solid #f0f0f0; }
.stat-entry { margin-left: auto; }
.res-name { cursor: pointer; font-weight: 600; color: #409EFF; }
.res-name:hover { text-decoration: underline; }
/* 操作列：两排三列展示，去掉 el-button 相邻默认左边距，交给 grid 控制间距 */
.op-cell { display: grid; grid-template-columns: repeat(3, max-content); justify-content: center; align-items: center; gap: 2px 8px; }
.op-cell :deep(.el-button + .el-button) { margin-left: 0; }
.op-cell :deep(.el-button) { padding: 2px 4px; min-width: 66px; justify-content: center; }
.family-toolbar { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 12px; }
.family-resident-tip { flex: 1; }

/* 收费卡抽屉 */
.card-drawer-body { min-height: 200px; }
.card-hero { background: linear-gradient(135deg, #eef5ff, #f7f4ff); border: 1px solid #e5edff; border-radius: 12px; padding: 16px 18px; margin-bottom: 16px; }
.hero-top { display: flex; align-items: center; justify-content: space-between; }
.hero-no { display: flex; align-items: center; gap: 8px; font-size: 17px; font-weight: 700; color: #1d2129; letter-spacing: .3px; }
.hero-tags { display: flex; align-items: center; gap: 8px; }
.hero-balances { display: flex; gap: 36px; margin-top: 14px; padding: 12px 14px; background: rgba(255, 255, 255, .72); border-radius: 8px; }
.hb { display: flex; flex-direction: column; gap: 4px; }
.hb-label { font-size: 12px; color: #86909c; }
.hb-value { font-size: 21px; font-weight: 700; }
.hb-value.primary { color: #409EFF; }
.hb-value.gift { color: #9747FF; }
.hero-meta { display: flex; flex-wrap: wrap; gap: 18px; margin-top: 12px; font-size: 12px; color: #86909c; }
.hero-meta b { color: #4e5969; }
.record-toolbar { display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px; }
.record-title { font-size: 14px; font-weight: 600; color: #1d2129; }
.income { color: #67C23A; font-weight: 600; }
.expense { color: #F56C6C; font-weight: 600; }
</style>
