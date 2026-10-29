<template>
  <div class="app-container">
    <el-page-header @back="goBack" :title="pageTitle" />

    <!-- 预约信息卡片 -->
    <el-card v-if="appointmentInfo.id" shadow="never" class="appointment-card">
      <template #header>
        <div class="card-header">
          <span><el-icon><Calendar /></el-icon> 预约信息</span>
          <el-tag type="primary">{{ appointmentInfo.appointmentNo }}</el-tag>
        </div>
      </template>
      <el-descriptions :column="3" border>
        <el-descriptions-item label="预约单号">{{ appointmentInfo.appointmentNo }}</el-descriptions-item>
        <el-descriptions-item label="预约日期">{{ appointmentInfo.appointmentDate }}</el-descriptions-item>
        <el-descriptions-item label="入住长者">{{ appointmentInfo.residentName }}</el-descriptions-item>
        <el-descriptions-item label="预约人">{{ appointmentInfo.appointerName }}</el-descriptions-item>
        <el-descriptions-item label="预约人电话">{{ appointmentInfo.appointerPhone }}</el-descriptions-item>
        <el-descriptions-item label="预约套餐">
          <el-tag type="success">{{ appointmentInfo.comboName }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="预计住养">{{ appointmentInfo.estimatedDays }} 天</el-descriptions-item>
        <el-descriptions-item label="月均价格">
          <span class="price-highlight">约 ¥{{ ((Number(appointmentInfo.dailyPrice) || 0) * 30).toFixed(2) }}/月</span>
        </el-descriptions-item>
        <el-descriptions-item label="预计金额">
          <span class="price-highlight">¥{{ appointmentInfo.estimatedFee }}</span>
        </el-descriptions-item>
      </el-descriptions>
    </el-card>

    <!-- 登记信息 -->
    <el-card shadow="never" class="form-card">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="120px" class="checkin-form">
        <!-- 一、长者资料 + 健康评估 + 个人物品（单人，平铺） -->
        <div class="form-section">
          <div class="section-title">
            <span class="section-title__no">1</span>
            <span class="section-title__text">入住长者</span>
            <el-radio-group v-model="resident.mode" size="small" class="section-title__switch" @change="handleModeChange">
              <el-radio-button label="select">选择已有</el-radio-button>
              <el-radio-button label="new">新增档案</el-radio-button>
            </el-radio-group>
          </div>

          <!-- 长者基本信息 -->
          <div class="resident-section resident-basic-section">
            <el-row :gutter="20">
              <el-col :xs="24" :lg="12">
                <el-form-item v-if="resident.mode === 'select'" label="选择长者">
                  <el-select
                    v-model="resident.residentId"
                    placeholder="搜索姓名 / 编号，选择长者档案"
                    filterable
                    remote
                    reserve-keyword
                    clearable
                    :remote-method="searchResidents"
                    :loading="residentLoading"
                    style="width: 100%"
                    @change="handleResidentChange"
                  >
                    <el-option v-for="r in residentOptions" :key="r.id" :label="`${r.name}（${r.residentNo || '无编号'}）`" :value="r.id" />
                  </el-select>
                </el-form-item>
                <el-form-item v-else label="长者姓名">
                  <el-input v-model="resident.residentName" placeholder="请输入长者姓名" />
                </el-form-item>
              </el-col>
              <el-col :xs="24" :sm="12" :lg="6">
                <el-form-item label="长者编号">
                  <el-input v-model="resident.residentNo" :placeholder="resident.mode === 'select' ? '选择后自动带入' : '留空自动生成'" :disabled="resident.mode === 'select'" />
                </el-form-item>
              </el-col>
              <el-col :xs="24" :sm="12" :lg="6">
                <el-form-item label="性别">
                  <el-select v-model="resident.gender" placeholder="请选择" :disabled="resident.mode === 'select'" style="width: 100%" clearable>
                    <el-option label="男" :value="1" />
                    <el-option label="女" :value="2" />
                  </el-select>
                </el-form-item>
              </el-col>
            </el-row>
            <!-- 已选长者确认卡：档案字段为灰显，单独展示避免选错人 -->
            <div v-if="resident.mode === 'select' && resident.residentId" class="resident-brief">
              <div class="rb-avatar">{{ (resident.residentName || '?').slice(0, 1) }}</div>
              <div class="rb-main">
                <div class="rb-name">
                  {{ resident.residentName }}
                  <el-tag v-if="resident.gender" size="small" :type="resident.gender === 1 ? 'primary' : 'danger'" effect="plain">{{ resident.gender === 1 ? '男' : '女' }}</el-tag>
                  <el-tag v-if="resident.careLevel" size="small" type="warning" effect="plain">{{ resident.careLevel }}</el-tag>
                </div>
                <div class="rb-meta">
                  <span>{{ resident.residentNo || '无编号' }}</span>
                  <span v-if="residentAge !== null">· {{ residentAge }} 岁</span>
                  <span v-if="resident.phone">· {{ resident.phone }}</span>
                </div>
              </div>
              <el-tag type="success" size="small" effect="plain" round class="rb-flag">已选档案</el-tag>
            </div>
            <el-row :gutter="20">
              <el-col :xs="24" :sm="12" :lg="8">
                <el-form-item label="出生日期">
                  <el-date-picker v-model="resident.birthDate" type="date" value-format="YYYY-MM-DD" placeholder="出生日期" style="width: 100%" :disabled="resident.mode === 'select'" />
                </el-form-item>
              </el-col>
              <el-col :xs="24" :sm="12" :lg="8">
                <el-form-item label="身份证号">
                  <el-input v-model="resident.idCard" placeholder="18 位自动识别生日 / 性别" maxlength="18" :disabled="resident.mode === 'select'" @blur="parseIdCard" />
                </el-form-item>
              </el-col>
              <el-col :xs="24" :sm="12" :lg="8">
                <el-form-item label="联系电话">
                  <el-input v-model="resident.phone" placeholder="联系电话" :disabled="resident.mode === 'select'" />
                </el-form-item>
              </el-col>
            </el-row>
            <!-- 照护等级 / 膳食 / 过敏史：影响套餐筛选与护理安全，常驻可见 -->
            <el-row :gutter="20">
              <el-col :xs="24" :sm="12" :lg="8">
                <el-form-item label="照护等级">
                  <el-select v-model="resident.careLevel" placeholder="请选择" style="width: 100%" clearable>
                    <el-option label="自理" value="自理" />
                    <el-option label="半自理" value="半自理" />
                    <el-option label="失能" value="失能" />
                  </el-select>
                </el-form-item>
              </el-col>
              <el-col :xs="24" :sm="12" :lg="8">
                <el-form-item label="膳食类型">
                  <el-select v-model="resident.dietType" placeholder="请选择" style="width: 100%" clearable>
                    <el-option label="普食" value="普食" />
                    <el-option label="软食" value="软食" />
                    <el-option label="流食" value="流食" />
                    <el-option label="鼻饲" value="鼻饲" />
                    <el-option label="糖尿病膳" value="糖尿病膳" />
                    <el-option label="低盐低脂" value="低盐低脂" />
                  </el-select>
                </el-form-item>
              </el-col>
              <el-col :xs="24" :sm="12" :lg="8">
                <el-form-item label="过敏史">
                  <el-input v-model="resident.allergies" placeholder="药物/食物过敏，无则填无" />
                </el-form-item>
              </el-col>
            </el-row>
            <div class="resident-hint">
              <el-icon><InfoFilled /></el-icon>
              <span v-if="resident.mode === 'new'">提交时将同步创建长者档案，可稍后在「长者档案」补全详细信息</span>
              <span v-else>档案信息自动带入，如需修改请前往「长者档案」</span>
            </div>
          </div>

          <!-- 选填项：健康评估 / 随身物品（默认收起，减少滚动） -->
          <div class="optional-toggle" :class="{ 'is-open': showOptional }" @click="showOptional = !showOptional">
            <span class="optional-toggle__icon-wrap"><el-icon class="optional-toggle__icon"><ArrowDown /></el-icon></span>
            <span class="optional-toggle__label">健康评估 · 随身物品</span>
            <el-tag v-if="optionalFilledCount" size="small" type="success" effect="plain" round>已填 {{ optionalFilledCount }} 项</el-tag>
            <span v-else class="optional-toggle__hint">选填，可跳过</span>
            <span class="optional-toggle__action">{{ showOptional ? '收起' : '展开填写' }}</span>
          </div>

          <!-- 健康评估 -->
          <div class="resident-section" v-show="showOptional">
            <div class="resident-section-title">
              <el-icon><FirstAidKit /></el-icon> 健康评估
            </div>
            <el-row :gutter="20">
               <el-col :xs="24" :sm="12" :lg="6">
                <el-form-item label="精神状态">
                  <el-select v-model="resident.mentalState" placeholder="请选择" style="width: 100%">
                    <el-option label="良好" value="GOOD" />
                    <el-option label="一般" value="NORMAL" />
                    <el-option label="差" value="POOR" />
                  </el-select>
                </el-form-item>
              </el-col>
               <el-col :xs="24" :sm="12" :lg="6">
                <el-form-item label="体温(℃)">
                  <el-input-number v-model="resident.temperature" :min="34" :max="43" :precision="1" style="width: 100%" />
                </el-form-item>
              </el-col>
               <el-col :xs="24" :sm="12" :lg="6">
                <el-form-item label="脉搏(次/分)">
                  <el-input-number v-model="resident.pulse" :min="30" :max="200" style="width: 100%" />
                </el-form-item>
              </el-col>
                <el-col :xs="24" :sm="12" :lg="6">
                <el-form-item label="认知筛查">
                  <el-select v-model="resident.cognition" placeholder="请选择" style="width: 100%" clearable>
                    <el-option label="正常" value="NORMAL" />
                    <el-option label="疑似失智" value="SUSPECTED" />
                    <el-option label="确诊失智" value="CONFIRMED" />
                  </el-select>
                </el-form-item>
              </el-col>
            </el-row>
            <el-row :gutter="20">
              <el-col :xs="24" :sm="12" :lg="6">
                <el-form-item label="收缩压">
                  <el-input-number v-model="resident.bloodPressureHigh" :min="60" :max="260" style="width: 100%" />
                </el-form-item>
              </el-col>
              <el-col :xs="24" :sm="12" :lg="6">
                <el-form-item label="舒张压">
                  <el-input-number v-model="resident.bloodPressureLow" :min="30" :max="160" style="width: 100%" />
                </el-form-item>
              </el-col>
              <el-col :xs="24" :sm="12" :lg="6">
                <el-form-item label="血氧(%)">
                  <el-input-number v-model="resident.bloodOxygen" :min="70" :max="100" style="width: 100%" />
                </el-form-item>
              </el-col>
              <el-col :xs="24" :sm="12" :lg="6">
                <el-form-item label="跌倒风险">
                  <el-select v-model="resident.fallRisk" placeholder="请选择" style="width: 100%" clearable>
                    <el-option label="低" value="LOW" />
                    <el-option label="中" value="MEDIUM" />
                    <el-option label="高" value="HIGH" />
                  </el-select>
                </el-form-item>
              </el-col>
            </el-row>
            <el-form-item label="慢性疾病">
              <el-input v-model="resident.chronicDiseases" type="textarea" :rows="2" placeholder="请输入慢性疾病史" />
            </el-form-item>
            <el-form-item label="在服药物">
              <el-input v-model="resident.medications" type="textarea" :rows="2" placeholder="请输入正在服用的药物及服药时间" />
            </el-form-item>
          </div>

          <!-- 个人物品与照片 -->
          <div class="resident-section" v-show="showOptional">
            <div class="resident-section-title">
              <el-icon><Memo /></el-icon> 个人物品与备注
            </div>
            <el-form-item label="自带物品">
              <el-select v-model="resident.broughtItems" multiple filterable allow-create default-first-option placeholder="请输入或选择自带物品" style="width: 100%">
                <el-option label="衣物" value="衣物" />
                <el-option label="假牙" value="假牙" />
                <el-option label="助听器" value="助听器" />
                <el-option label="老花镜" value="老花镜" />
                <el-option label="药品" value="药品" />
                <el-option label="被褥" value="被褥" />
                <el-option label="其他" value="其他" />
              </el-select>
            </el-form-item>
            <el-form-item label="物品照片">
              <el-upload
                :action="uploadAction"
                list-type="picture-card"
                v-model:file-list="resident.broughtPhotos"
                :on-success="(res, file, fileList) => handlePhotoUploadSuccess(res, file, fileList, 'broughtPhotos')"
                :on-remove="(file, fileList) => handlePhotoRemove(file, fileList, 'broughtPhotos')"
                :limit="10"
                accept="image/*"
              >
                <el-icon><Plus /></el-icon>
              </el-upload>
            </el-form-item>
            <el-form-item label="入住近照">
              <el-upload
                :action="uploadAction"
                list-type="picture-card"
                v-model:file-list="resident.checkinPhotos"
                :on-success="(res, file, fileList) => handlePhotoUploadSuccess(res, file, fileList, 'checkinPhotos')"
                :on-remove="(file, fileList) => handlePhotoRemove(file, fileList, 'checkinPhotos')"
                :limit="10"
                accept="image/*"
              >
                <el-icon><Plus /></el-icon>
              </el-upload>
            </el-form-item>
            <el-form-item label="备注">
              <el-input v-model="resident.remark" type="textarea" :rows="2" placeholder="请输入其他需要备注的信息" />
            </el-form-item>
          </div>
        </div>

        <!-- 二、入住与联系信息 -->
        <div class="form-section">
          <div class="section-title">
            <span class="section-title__no">2</span>
            <span class="section-title__text">入住与联系信息</span>
            <span class="section-title__tip">联系人信息会同步到长者档案</span>
          </div>
          <el-row :gutter="20">
            <el-col :xs="24" :sm="12" :lg="8">
              <el-form-item label="登记编号" prop="checkinNo">
                <el-input v-model="form.checkinNo" placeholder="系统自动生成" disabled />
              </el-form-item>
            </el-col>
            <el-col :xs="24" :sm="12" :lg="8">
              <el-form-item label="登记日期" prop="checkinDate">
                <el-date-picker v-model="form.checkinDate" type="date" placeholder="选择日期" value-format="YYYY-MM-DD" style="width: 100%" />
              </el-form-item>
            </el-col>
          </el-row>
          <el-row>
            <el-col :span="24">
              <el-form-item label="特殊需求" prop="specialNeeds">
                <el-input v-model="form.specialNeeds" type="textarea" :rows="2" placeholder="请输入特殊需求（如用药提醒、特殊饮食、护理要求等）" />
              </el-form-item>
            </el-col>
          </el-row>
          <el-row :gutter="20">
            <el-col :xs="24" :sm="12" :lg="8">
              <el-form-item label="联系姓名">
                <el-input v-model="contactForm.contactName" placeholder="请输入联系人/家属姓名" />
              </el-form-item>
            </el-col>
            <el-col :xs="24" :sm="12" :lg="8">
              <el-form-item label="联系电话">
                <el-input v-model="contactForm.contactPhone" placeholder="请输入联系电话" />
              </el-form-item>
            </el-col>
            <el-col :xs="24" :sm="12" :lg="8">
              <el-form-item label="备用电话">
                <el-input v-model="contactForm.contactPhoneBackup" placeholder="备用联系电话" />
              </el-form-item>
            </el-col>
          </el-row>
        </div>

        <!-- 三、协议确认 -->
        <div class="form-section">
          <div class="section-title">
            <span class="section-title__no">3</span>
            <span class="section-title__text">协议确认</span>
            <span class="section-title__tip">提交前需完成两项确认</span>
          </div>
          <el-form-item prop="agreementSigned">
            <el-checkbox v-model="form.agreementSigned">
              已出示《长者康养服务协议》并解释条款，双方已签署协议
            </el-checkbox>
          </el-form-item>
          <el-form-item prop="medicalAuthorization">
            <el-checkbox v-model="form.medicalAuthorization">
              已获得紧急医疗授权
            </el-checkbox>
          </el-form-item>
        </div>
      </el-form>

      <!-- 右侧栏：本次入住摘要 + 费用预估（宽屏吸顶，窄屏跟随表单末尾） -->
      <aside class="layout-side">
        <div class="side-card">
          <div class="side-card__head">
            <span class="side-card__title"><el-icon><Tickets /></el-icon>本次入住</span>
            <el-tag v-if="resident.comboId" size="small" type="success" effect="plain" round>已选套餐</el-tag>
          </div>

          <div class="side-summary">
            <div class="side-summary__item" :class="{ 'is-empty': !resident.residentName }">
              <el-icon><UserFilled /></el-icon>
              <span>{{ resident.residentName || '未选择长者' }}</span>
            </div>
          </div>

          <div class="side-pick">
             <div class="side-pick__row">
              <span class="side-pick__label">房间/床位</span>
              <div class="pick-box" :class="{ 'is-empty': !resident.bedId }" @click="openSpaceSelector">
                <el-icon class="pick-box__icon"><HomeFilled /></el-icon>
                <span v-if="resident.bedId" class="pick-box__text">{{ resident.roomName || '房间' }}{{ resident.bedNo ? ' · ' + resident.bedNo : '' }}</span>
                <span v-else class="pick-box__empty">点击选择</span>
                <el-button type="primary" link>{{ resident.bedId ? '更换' : '选择' }}</el-button>
              </div>
            </div>
            <div class="side-pick__row">
              <span class="side-pick__label">康养套餐</span>
              <div class="pick-box" :class="{ 'is-empty': !resident.comboId }" @click="pkgDrawerVisible = true">
                <el-icon class="pick-box__icon"><Money /></el-icon>
                <span v-if="resident.comboId" class="pick-box__text">{{ resident.comboName }}</span>
                <span v-else class="pick-box__empty">点击选择套餐</span>
                <el-button type="primary" link>{{ resident.comboId ? '更换' : '选择' }}</el-button>
              </div>
            </div>
            <div class="side-pick__row">
              <span class="side-pick__label">押金</span>
              <el-input-number v-model="resident.deposit" :min="0" :controls="false" />
            </div>
           
          </div>

          <div class="side-divider"></div>

          <div class="side-fee">
            <div class="side-fee__row">
              <span>计费单价</span>
              <b>¥{{ Number(resident.periodPrice || 0).toFixed(2) }}<em>{{ getChargeCycleUnit(resident.chargeCycle) }}</em></b>
            </div>
            <div class="side-fee__row">
              <span>计划时长</span>
              <span class="side-fee__input">
                <el-input-number v-model="planDuration.value" :min="1" size="small" controls-position="right" style="width: 84px" @change="onPlanDurationChange" />
                <el-select v-model="planDuration.unit" size="small" style="width: 82px" @change="onPlanDurationChange">
                  <el-option v-for="opt in durationUnitOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
                </el-select>
              </span>
            </div>
            <div class="side-fee__row">
              <span>康养费</span>
              <b>¥{{ estimateBedFee().toFixed(2) }}</b>
            </div>
          </div>

          <div class="side-total" :class="{ 'is-empty': !resident.comboId }">
            <div class="side-total__head">
              <span class="side-total__label"><el-icon><Wallet /></el-icon>预估合计</span>
              <span class="side-total__deposit">含押金 ¥{{ Number(resident.deposit || 0).toFixed(2) }}</span>
            </div>
            <div class="side-total__amount">
              <span class="side-total__symbol">¥</span>{{ estimateFee() }}
            </div>
          </div>

          <div class="side-note">
            <el-icon><InfoFilled /></el-icon>
            <span v-if="resident.comboId">{{ estimateBreakdownText }}<br />实际按退住日期结算，不满整月按日折算多退少补</span>
            <span v-else>点击上方「康养套餐」选择后，自动带出单价、押金与计费周期</span>
          </div>
          <div class="side-tip">提交后为「登记中」，需在登记列表点「完成」并确认押金支付。</div>

          <div class="side-actions">
            <el-button @click="goBack">取 消</el-button>
            <el-button type="primary" :loading="submitting" @click="submitForm">{{ isEdit ? '保存修改' : '提交登记' }}</el-button>
          </div>
        </div>
      </aside>
    </el-card>

    <!-- 底部操作栏：仅窄屏显示（宽屏由右侧费用栏提供摘要与提交按钮） -->
    <div class="form-footer">
      <div class="footer-summary">
        <span class="fs-item" :class="{ 'is-empty': !resident.residentName }">
          <el-icon><UserFilled /></el-icon>{{ resident.residentName || '未选择长者' }}
        </span>
        <el-divider direction="vertical" />
        <span class="fs-item" :class="{ 'is-empty': !resident.comboId }">
          <el-icon><Money /></el-icon>{{ resident.comboName || '未选套餐' }}
        </span>
        <el-divider direction="vertical" />
        <span class="fs-item" :class="{ 'is-empty': !resident.bedId }">
          <el-icon><HomeFilled /></el-icon>{{ resident.bedId ? `${resident.roomName || '房间'} · ${resident.bedNo}` : '未分配床位' }}
        </span>
        <span class="fs-fee"><span class="fs-fee__label">预估合计</span>¥{{ estimateFee() }}</span>
      </div>
      <div class="footer-actions">
        <el-button @click="goBack">取 消</el-button>
        <el-button type="primary" :loading="submitting" @click="submitForm">{{ isEdit ? '保存修改' : '提交登记' }}</el-button>
      </div>
    </div>

    <!-- 房间/床位选择弹窗 -->
    <el-dialog v-model="spaceDialogVisible" title="选择房间 / 床位" width="900px" append-to-body>
      <el-row :gutter="12" class="bed-filter">
        <el-col :span="6">
          <el-select v-model="spaceFilter.buildingId" placeholder="全部楼栋" clearable style="width:100%" @change="handleBuildingChange">
            <el-option v-for="b in buildings" :key="b.id" :label="b.buildingName" :value="b.id" />
          </el-select>
        </el-col>
        <el-col :span="6">
          <el-select v-model="spaceFilter.floorId" placeholder="全部楼层" clearable style="width:100%" :disabled="!spaceFilter.buildingId" @change="handleFloorChange">
            <el-option v-for="f in floors" :key="f.id" :label="f.floorName || (f.floorNo + 'F')" :value="f.id" />
          </el-select>
        </el-col>
        <el-col :span="6">
          <el-select v-model="spaceFilter.roomId" placeholder="全部房间" clearable style="width:100%" :disabled="!spaceFilter.buildingId" @change="loadAvailableSpaces">
            <el-option v-for="r in rooms" :key="r.id" :label="r.roomName || r.roomNo" :value="r.id" />
          </el-select>
        </el-col>
        <el-col :span="6">
          <el-select v-model="spaceFilter.bedType" placeholder="全部床位类型" clearable style="width:100%" @change="loadAvailableSpaces">
            <el-option label="普通床" :value="1" />
            <el-option label="护理床" :value="2" />
            <el-option label="康复床" :value="3" />
          </el-select>
        </el-col>
      </el-row>
      <div class="space-pick-tip">点击床位即可选定并返回表单</div>
      <el-row :gutter="16" v-loading="spaceLoading">
        <el-col :span="6" v-for="space in availableSpaces" :key="space.id">
          <div class="space-card" @click="pickSpace(space)">
            <div class="space-icon">
              <el-icon :size="32"><HomeFilled /></el-icon>
            </div>
            <div class="space-name">{{ space.bedNo }}</div>
            <div class="space-sub" v-if="roomNameOf(space.roomId)">{{ roomNameOf(space.roomId) }}</div>
            <div class="space-type">{{ {1:'普通床',2:'护理床',3:'康复床'}[space.bedType] || '床位' }}</div>
            <el-tag type="success" size="small">点击选择</el-tag>
          </div>
        </el-col>
      </el-row>
      <el-empty v-if="!spaceLoading && availableSpaces.length === 0" description="暂无空闲床位，请调整筛选条件" />
      <template #footer>
        <el-button @click="spaceDialogVisible = false">取 消</el-button>
      </template>
    </el-dialog>

    <!-- 康养套餐抽屉：右侧栏点「选择」打开，点卡片即选中并关闭 -->
    <el-drawer v-model="pkgDrawerVisible" title="选择康养套餐" size="820px" destroy-on-close>
      <!-- 筛选工具栏：关键字 / 照护等级 / 房型 / 排序 -->
      <div class="pkg-toolbar">
        <el-input v-model="pkgKeyword" placeholder="搜索套餐名称或说明" clearable :prefix-icon="Search" style="width: 200px" />
        <el-select v-model="pkgFilter.careLevel" placeholder="全部照护等级" clearable style="width: 150px">
          <el-option v-for="lv in CARE_LEVEL_OPTIONS" :key="lv.value" :label="'适用：' + lv.label" :value="lv.value" />
        </el-select>
        <el-select v-model="pkgFilter.roomType" placeholder="全部房型" clearable style="width: 130px">
          <el-option v-for="rt in pkgRoomTypeOptions" :key="rt" :label="rt" :value="rt" />
        </el-select>
        <el-select v-model="pkgSort" style="width: 150px">
          <el-option label="推荐优先" value="recommended" />
          <el-option label="月价从低到高" value="monthAsc" />
          <el-option label="月价从高到低" value="monthDesc" />
          <el-option label="人气优先" value="popularity" />
        </el-select>
        <span v-if="pkgSort === 'recommended' && pkgMatchHint" class="pkg-match-hint"><el-icon><Aim /></el-icon>{{ pkgMatchHint }}</span>
        <span class="pkg-toolbar__count">共 {{ sortedPackages.length }} 个套餐</span>
        <el-button v-if="resident.comboId" link type="primary" @click="clearPackage">清除已选</el-button>
      </div>

      <div class="pkg-select-grid">
        <div
          v-for="pkg in sortedPackages"
          :key="pkg.id"
          class="pkg-option"
          :class="{ 'is-active': resident.comboId === pkg.id, 'is-dimmed': pkgGenderMismatch(pkg) }"
          @click="choosePackage(pkg)"
        >
          <span v-if="resident.comboId === pkg.id" class="pkg-option__check"><el-icon><Check /></el-icon></span>
          <div class="pkg-option__name">{{ pkg.comboName }}</div>
          <div class="pkg-option__tags">
            <el-tag v-if="Number(pkg.recommended) === 1" type="danger" size="small" effect="dark">推荐</el-tag>
            <el-tag v-if="pkgFitLevel(pkg) === 2" size="small" type="success" effect="dark">适配</el-tag>
            <el-tag v-if="pkg.roomType" size="small" type="primary" effect="plain">{{ pkg.roomType }}{{ Number(pkg.maxResidents) > 1 ? ' · ' + pkg.maxResidents + '人' : '' }}</el-tag>
            <el-tag v-if="pkg.roomArea" size="small" type="success" effect="plain">{{ pkg.roomArea }}</el-tag>
            <el-tag v-for="lv in splitSuitable(pkg.suitableFor)" :key="lv" size="small" effect="plain">{{ getCareLevelName(lv) }}</el-tag>
            <el-tag v-if="!splitSuitable(pkg.suitableFor).length" size="small" type="info" effect="plain">不限等级</el-tag>
          </div>
          <div class="pkg-option__desc" :title="pkg.description || ''">{{ pkg.description || '暂无套餐说明' }}</div>
          <div class="pkg-option__price">
            <template v-if="Number(pkg.monthPrice) > 0">
              <span class="pkg-option__amount">¥{{ pkg.monthPrice }}</span><span class="pkg-option__unit">/月</span>
            </template>
            <template v-else-if="Number(pkg.yearPrice) > 0">
              <span class="pkg-option__amount">¥{{ pkg.yearPrice }}</span><span class="pkg-option__unit">/年</span>
            </template>
            <span v-else class="pkg-option__unit">年 / 月价未配置</span>
            <span v-if="Number(pkg.monthPrice) > 0 && Number(pkg.yearPrice) > 0" class="pkg-option__year">年付 ¥{{ pkg.yearPrice }}</span>
          </div>
          <div class="pkg-option__meta">
            <span>押金 ¥{{ pkg.depositAmount || 0 }}</span>
            <span>· 人气 {{ pkg.popularity || 0 }}</span>
            <span v-if="pkgGenderMismatch(pkg)" class="pkg-option__warn">· 房型性别要求{{ genderRequiredLabel(pkg.genderRequired) }}</span>
          </div>
          <div class="pkg-option__preview">按当前计划时长 预估康养费 ¥{{ previewPkgFee(pkg) }}</div>
        </div>
        <!-- 历史单据的套餐可能已下架：保留当前套餐展示，避免编辑时看不到已选 -->
        <div
          v-if="resident.comboId && resident.comboName && !packageList.some(p => p.id === resident.comboId)"
          class="pkg-option is-active"
        >
          <div class="pkg-option__name">{{ resident.comboName }}</div>
          <div class="pkg-option__meta"><el-tag size="small" type="info" effect="plain">当前套餐（已不在可选列表）</el-tag></div>
        </div>
      </div>
      <el-empty v-if="!sortedPackages.length && !(resident.comboId && resident.comboName && !packageList.some(p => p.id === resident.comboId))" :description="packageList.length ? '没有符合筛选条件的套餐，请调整关键字或条件' : '暂无可用康养套餐'" :image-size="60" />

      <template #footer>
        <div class="drawer-footer">
          <span class="drawer-footer__hint">点击套餐卡片即可选中并返回表单</span>
          <el-button @click="pkgDrawerVisible = false">关 闭</el-button>
        </div>
      </template>
    </el-drawer>
  </div>
</template>

<script setup name="ResidentCheckinForm">
import { ref, reactive, computed, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Search } from '@element-plus/icons-vue'
import { addCheckin, updateCheckin, getCheckinDetail } from '@/api/care/checkin'
import { getPackageList } from '@/api/care/billing'
import { getAppointmentDetail } from '@/api/care/appointment'
import { listFreeBeds as getAvailableSpaces } from '@/api/care/bed'
import { listAllBuildings } from '@/api/care/building'
import { listFloorByBuilding } from '@/api/care/floor'
import { listRoom } from '@/api/care/room'
import { addResident as createResident, getResidentOptions } from '@/api/residents'
import { getCareLevelName, getChargeCycleUnit, CHARGE_CYCLE, resolveComboPriceByCycle, plannedDays, calcBedFee, decomposeDuration } from '@/utils/careEnums'

const route = useRoute()
const router = useRouter()
const formRef = ref(null)

// 照片上传地址（OSS 上传）
const uploadAction = import.meta.env.VITE_APP_BASE_API + '/common/oss/upload'

// 编辑模式：兼容 query 传参（/eyang/checkin/form?id=xx）与路径参数（/eyang/checkin/form/xx）
const checkinId = route.query.id || route.params.id
const isEdit = computed(() => !!checkinId)
const appointmentId = route.query.appointmentId
// 从长者档案页跳转带入的预选长者（/eyang/checkin/form?residentId=xx&residentName=xx）
const prefillResidentId = route.query.residentId

const pageTitle = computed(() => {
  if (isEdit.value) return '编辑登记'
  if (appointmentId) return '预约转登记'
  return '新增登记'
})

// 预约信息
const appointmentInfo = ref({
  id: null,
  appointmentNo: '',
  appointmentDate: '',
  residentName: '',
  appointerName: '',
  appointerPhone: '',
  comboName: '',
  dailyPrice: 0,
  estimatedFee: 0,
  estimatedDays: 0
})

// 家属/紧急联系人
const contactForm = ref({
  contactName: '',
  contactPhone: '',
  contactPhoneBackup: ''
})
const contactAutoFilled = ref(false)

// 一人一单：当前登记的唯一长者
const resident = reactive(newResidentItem())

const submitting = ref(false)

// 选填项（健康评估 / 随身物品）默认收起，减少滚动
const showOptional = ref(false)
const optionalFilledCount = computed(() => {
  let n = 0
  if (resident.mentalState && resident.mentalState !== 'GOOD') n++
  if (resident.fallRisk && resident.fallRisk !== 'LOW') n++
  if (resident.chronicDiseases) n++
  if (resident.medications) n++
  if (resident.broughtItems?.length) n++
  if (resident.broughtPhotos?.length) n++
  if (resident.checkinPhotos?.length) n++
  if (resident.remark) n++
  return n
})
function expandOptionalIfFilled() { if (optionalFilledCount.value > 0) showOptional.value = true }

// 床位选择
const spaceDialogVisible = ref(false)
const availableSpaces = ref([])
const spaceLoading = ref(false)
const buildings = ref([])
const floors = ref([])
const rooms = ref([])
const allRooms = ref([])
const roomMap = ref({})
const spaceFilter = ref({ buildingId: undefined, floorId: undefined, roomId: undefined, bedType: undefined })

// 长者档案下拉
const residentOptions = ref([])
const residentLoading = ref(false)

// 表单数据（对齐 CheckinEntity 字段）
const form = ref({
  id: undefined,
  checkinNo: '',
  appointmentId: undefined,
  specialNeeds: '',
  checkinDate: new Date().toISOString().split('T')[0],
  checkinStatus: 0,
  operatorName: '',
  remarks: '',
  feeItemList: [],
  agreementSigned: false,
  medicalAuthorization: false
})

// 套餐列表
const packageList = ref([])

// 套餐选择区：关键字 / 照护等级 / 房型 筛选 + 排序
const pkgKeyword = ref('')
const pkgFilter = reactive({ careLevel: undefined, roomType: undefined })
const pkgSort = ref('recommended')

// 套餐可选房型（来自已有套餐，避免写死）
const pkgRoomTypeOptions = computed(() => {
  const set = new Set()
  packageList.value.forEach(p => { if (p.roomType) set.add(p.roomType) })
  return [...set]
})

// suitable_for 为逗号分隔的护理等级编码
function splitSuitable(str) {
  return (str || '').split(',').map(s => s.trim()).filter(s => s !== '')
}

// 套餐与长者性别是否冲突（gender_required：0-不限 1-仅男 2-仅女）
function pkgGenderMismatch(pkg) {
  const need = Number(pkg.genderRequired) || 0
  if (!need) return false
  const g = Number(resident.gender) || 0
  return !!g && g !== need
}
function genderRequiredLabel(v) {
  return Number(v) === 1 ? '限男性' : (Number(v) === 2 ? '限女性' : '不限')
}

// 套餐与长者照护等级的适配度：2-适配 1-不限等级 0-不适用
function pkgFitLevel(pkg) {
  const suits = splitSuitable(pkg.suitableFor)
  if (!suits.length) return 1
  const code = careLevelToInt(resident.careLevel)
  if (!code) return 0
  return suits.some(s => Number(s) === code) ? 2 : 0
}

// 综合适配分：适配等级 > 推荐位 > 性别匹配；性别冲突直接沉底
function pkgFitScore(pkg) {
  let score = pkgFitLevel(pkg) * 10
  if (pkgGenderMismatch(pkg)) score -= 30
  if (Number(pkg.recommended) === 1) score += 3
  if (Number(pkg.genderRequired) && Number(pkg.genderRequired) === Number(resident.gender)) score += 1
  return score
}

// 排序口径提示，让运营看得懂推荐顺序
const pkgMatchHint = computed(() => {
  const parts = []
  if (resident.careLevel) parts.push(resident.careLevel)
  const g = Number(resident.gender)
  if (g) parts.push(g === 1 ? '男' : '女')
  return parts.length ? `已按「${parts.join(' · ')}」优先排序` : ''
})

// 已选长者的年龄（根据出生日期推算）
const residentAge = computed(() => {
  const b = resident.birthDate
  if (!b) return null
  const d = new Date(b)
  if (Number.isNaN(d.getTime())) return null
  const now = new Date()
  let age = now.getFullYear() - d.getFullYear()
  const m = now.getMonth() - d.getMonth()
  if (m < 0 || (m === 0 && now.getDate() < d.getDate())) age--
  return age >= 0 && age < 130 ? age : null
})

const filteredPackages = computed(() => {
  const kw = pkgKeyword.value.trim().toLowerCase()
  const lv = pkgFilter.careLevel
  return packageList.value.filter(p => {
    if (kw) {
      const text = `${p.comboName || ''} ${p.description || ''}`.toLowerCase()
      if (!text.includes(kw)) return false
    }
    if (lv !== '' && lv != null) {
      const suits = splitSuitable(p.suitableFor)
      // 未配置适用等级视为不限
      if (suits.length && !suits.some(s => Number(s) === Number(lv))) return false
    }
    if (pkgFilter.roomType && p.roomType !== pkgFilter.roomType) return false
    return true
  })
})

const SORTERS = {
  recommended: (a, b) => pkgFitScore(b) - pkgFitScore(a) || (Number(b.recommended) || 0) - (Number(a.recommended) || 0) || (Number(b.popularity) || 0) - (Number(a.popularity) || 0),
  popularity: (a, b) => (Number(b.popularity) || 0) - (Number(a.popularity) || 0),
  monthAsc: (a, b) => pkgComparePrice(a) - pkgComparePrice(b),
  monthDesc: (a, b) => pkgComparePrice(b) - pkgComparePrice(a),
}
// 比价基准：优先月价，缺失时回退年价/12、日价×30
function pkgComparePrice(p) {
  const m = Number(p.monthPrice) || 0
  if (m > 0) return m
  const y = Number(p.yearPrice) || 0
  if (y > 0) return y / 12
  return (Number(p.dayPrice) || 0) * 30
}

const sortedPackages = computed(() => [...filteredPackages.value].sort(SORTERS[pkgSort.value] || SORTERS.recommended))

// 卡片试算：按当前计划时长估算该套餐的康养费（不含押金，与结算同口径）
function previewPkgFee(pkg) {
  const days = plannedDays(resident.chargeNum, resident.chargeCycle)
  return calcBedFee(pkg.yearPrice, pkg.monthPrice, pkg.dayPrice, days).toFixed(2)
}

// 清除已选套餐（回到未选状态，便于重新挑选）
function clearPackage() {
  resident.comboId = undefined
  resident.comboName = ''
  resident.periodPrice = 0
  resident.comboYearPrice = 0
  resident.comboMonthPrice = 0
  resident.comboDayPrice = 0
}

// 选定长者（照护等级为字符串）后，自动按该等级筛选适用套餐
watch(() => resident.careLevel, (val) => {
  const code = careLevelToInt(val)
  pkgFilter.careLevel = code ? code : undefined
})

// 校验规则
const rules = {
  checkinDate: [{ required: true, message: '请选择登记日期', trigger: 'change' }],
  agreementSigned: [{
    validator: (rule, value, callback) => {
      if (!value) callback(new Error('请确认已签署协议'))
      else callback()
    },
    trigger: 'change'
  }],
  medicalAuthorization: [{
    validator: (rule, value, callback) => {
      if (!value) callback(new Error('请确认已获得医疗授权'))
      else callback()
    },
    trigger: 'change'
  }]
}

// 创建一条长者登记项（一人一单，字段与后端 CheckinEntity 对齐，提交时拍平）
function newResidentItem() {
  return {
    mode: 'select',
    residentId: undefined,
    residentNo: '',
    residentName: '',
    gender: undefined,
    birthDate: '',
    idCard: '',
    phone: '',
    careLevel: '',
    mentalState: 'GOOD',
    temperature: 36.5,
    pulse: 75,
    bloodPressureHigh: 120,
    bloodPressureLow: 80,
    bloodOxygen: 98,
    fallRisk: 'LOW',
    cognition: 'NORMAL',
    dietType: '普食',
    chronicDiseases: '',
    medications: '',
    allergies: '无',
    broughtItems: [],
    broughtPhotos: [],
    checkinPhotos: [],
    remark: '',
    comboId: undefined,
    comboName: '',
    chargeCycle: CHARGE_CYCLE.MONTH,
    periodPrice: 0,
    chargeNum: 1,
    comboYearPrice: 0,
    comboMonthPrice: 0,
    comboDayPrice: 0,
    deposit: 0,
    bedId: null,
    bedNo: '',
    buildingId: null,
    roomId: null,
    roomName: ''
  }
}

// 重置当前长者登记项
function resetResident() {
  Object.assign(resident, newResidentItem())
}

// 性别：档案为字符串（男/女），实体为整型（1/2）
function genderToInt(g) {
  if (typeof g === 'number') return g
  if (g === '男') return 1
  if (g === '女') return 2
  return 0
}

// 搜索长者档案
async function searchResidents(query) {
  residentLoading.value = true
  try {
    const res = await getResidentOptions(query)
    residentOptions.value = res.data || []
  } catch {
    residentOptions.value = []
  } finally {
    residentLoading.value = false
  }
}

// 载入长者档案选项（保证编辑/预约回显时下拉有对应标签）
function ensureResidentOption(resident) {
  if (!resident || resident.id == null) return
  if (!residentOptions.value.some(r => r.id === resident.id)) {
    residentOptions.value = [...residentOptions.value, resident]
  }
}

// 选择长者后填充档案信息
function handleResidentChange(residentId) {
  const archive = residentOptions.value.find(r => r.id === residentId)
  if (!archive) return
  resident.residentId = archive.id
  resident.residentName = archive.name
  resident.residentNo = archive.residentNo || ''
  resident.gender = genderToInt(archive.gender)
  resident.birthDate = archive.birthDate || ''
  resident.idCard = archive.idCard || ''
  resident.phone = archive.phone || ''
  resident.careLevel = getCareLevelName(archive.careLevel)
  // 带入紧急联系人
  if (!contactForm.value.contactName) {
    contactForm.value.contactName = archive.emergencyContact || ''
    contactForm.value.contactPhone = archive.emergencyPhone || archive.phone || ''
    contactAutoFilled.value = !!(archive.emergencyContact || archive.emergencyPhone)
  }
}

// 加载套餐列表
async function loadPackages() {
  try {
    const res = await getPackageList({ chargeKind: 0, pageSize: 999, enabled: true })
    packageList.value = res.data.list || []
  } catch {
    packageList.value = []
  }
}

// 加载详情（编辑）：一人一单，直接读取登记单本行字段
async function loadDetail() {
  if (!checkinId) return
  try {
    await loadPackages()
    const res = await getCheckinDetail(checkinId)
    if (!res.data) return
    const data = res.data
    form.value = {
      id: data.id,
      checkinNo: data.checkinNo,
      appointmentId: data.appointmentId,
      specialNeeds: data.specialNeeds,
      checkinDate: data.checkinDate,
      checkinStatus: data.checkinStatus ?? 0,
      operatorName: data.operatorName,
      remarks: data.remarks,
      feeItemList: data.feeItemList || [],
      agreementSigned: true,
      medicalAuthorization: true
    }
    contactForm.value.contactName = data.contactName || ''
    contactForm.value.contactPhone = data.contactPhone || ''
    contactForm.value.contactPhoneBackup = data.contactPhoneBackup || ''
    contactAutoFilled.value = false

    const pkg = data.comboId ? packageList.value.find(p => p.id === data.comboId) : null
    ensureResidentOption({ id: data.residentId, name: data.residentName, residentNo: data.residentNo })
    Object.assign(resident, {
      mode: 'select',
      residentId: data.residentId,
      residentNo: data.residentNo || '',
      residentName: data.residentName || '',
      gender: data.gender ?? undefined,
      birthDate: data.birthDate || '',
      idCard: data.idCard || '',
      phone: data.phone || '',
      careLevel: getCareLevelName(data.careLevel),
      mentalState: data.mentalState || 'GOOD',
      temperature: data.temperature ?? 36.5,
      pulse: data.pulse ?? 75,
      bloodPressureHigh: data.bloodPressureHigh ?? 120,
      bloodPressureLow: data.bloodPressureLow ?? 80,
      bloodOxygen: data.bloodOxygen ?? 98,
      fallRisk: data.fallRisk || 'LOW',
      cognition: data.cognition || 'NORMAL',
      dietType: data.dietType || '普食',
      chronicDiseases: data.chronicDiseases || '',
      medications: data.medications || '',
      allergies: data.allergies || '无',
      broughtItems: data.broughtItems ? String(data.broughtItems).split(',').filter(Boolean) : [],
      broughtPhotos: (data.broughtPhotos ? String(data.broughtPhotos).split(',').filter(Boolean) : []).map(url => ({ uid: Date.now() + Math.random(), name: url.split('/').pop(), status: 'success', url })),
      checkinPhotos: (data.checkinPhotos ? String(data.checkinPhotos).split(',').filter(Boolean) : []).map(url => ({ uid: Date.now() + Math.random(), name: url.split('/').pop(), status: 'success', url })),
      remark: data.remarks || '',
      comboId: data.comboId,
      comboName: pkg?.comboName || '',
      chargeCycle: data.chargeCycle ?? pkg?.chargeCycle,
      periodPrice: data.periodPrice ?? 0,
      chargeNum: data.chargeNum ?? 1,
      comboYearPrice: data.comboYearPrice ?? pkg?.yearPrice ?? 0,
      comboMonthPrice: data.comboMonthPrice ?? pkg?.monthPrice ?? 0,
      comboDayPrice: data.comboDayPrice ?? pkg?.dayPrice ?? 0,
      deposit: data.deposit ?? 0,
      bedId: data.bedId,
      bedNo: data.bedNo || '',
      buildingId: data.buildingId,
      roomId: data.roomId,
      roomName: data.roomName || ''
    })
    syncPlanDuration()
    expandOptionalIfFilled()
  } catch {
    ElMessage.warning('加载详情失败')
    await loadPackages()
  }
}

// 从长者档案页跳转带入：预选入住长者（仅新建登记、非编辑/预约转登记时）
async function prefillResident() {
  if (!prefillResidentId || checkinId || appointmentId) return
  await searchResidents('')
  const id = Number(prefillResidentId)
  ensureResidentOption({ id, name: route.query.residentName || '' })
  resident.mode = 'select'
  resident.residentId = id
  resident.residentName = route.query.residentName || ''
  handleResidentChange(id)
}

// 从房间管理页「入住」跳转带入：定位房间并选中指定床位（未指定时取首个空闲床位）
async function prefillRoom() {
  const roomId = Number(route.query.roomId)
  if (!roomId || checkinId || appointmentId) return
  await loadAllRooms()
  const room = roomMap.value[roomId]
  spaceFilter.value.buildingId = room?.buildingId ?? (route.query.buildingId ? Number(route.query.buildingId) : undefined)
  spaceFilter.value.floorId = room?.floorId ?? (route.query.floorId ? Number(route.query.floorId) : undefined)
  spaceFilter.value.roomId = roomId
  await loadAvailableSpaces()
  const bedId = Number(route.query.bedId)
  const bed = (bedId && availableSpaces.value.find(s => Number(s.id) === bedId))
    || availableSpaces.value.find(s => Number(s.roomId) === roomId)
  if (!bed) {
    ElMessage.warning(bedId ? '所选床位已被占用，请手动选择其他床位' : `${route.query.roomName || '该房间'}暂无空闲床位，请手动选择`)
    return
  }
  resident.bedId = bed.id
  resident.bedNo = bed.bedNo
  resident.buildingId = bed.buildingId
  resident.roomId = bed.roomId
  resident.roomName = roomNameOf(bed.roomId) || route.query.roomName || ''
  ElMessage.success(`已分配床位：${resident.roomName} ${bed.bedNo}`)
}

// 加载预约信息
async function loadAppointment() {
  if (!appointmentId) return
  try {
    const res = await getAppointmentDetail(appointmentId)
    if (!res.data) return
    const data = res.data
    appointmentInfo.value = {
      id: data.id,
      appointmentNo: data.appointmentNo,
      appointmentDate: data.appointmentDate,
      residentName: data.residentName,
      appointerName: data.appointerName,
      appointerPhone: data.appointerPhone,
      comboName: data.comboName,
      dailyPrice: data.dailyPrice,
      estimatedFee: data.estimatedFee,
      estimatedDays: data.estimatedDays
    }
    form.value.specialNeeds = data.specialNeeds
    form.value.appointmentId = data.id
    contactForm.value.contactName = data.appointerName || ''
    contactForm.value.contactPhone = data.appointerPhone || ''
    contactAutoFilled.value = !!data.appointerName

    // 预约的入住长者带入
    if (data.residentId) {
      await searchResidents('')
      ensureResidentOption({ id: data.residentId, name: data.residentName })
      resident.residentId = data.residentId
      resident.residentName = data.residentName || ''
      if (data.comboId) {
        resident.comboId = data.comboId
        resident.comboName = data.comboName || ''
      }
      if (data.estimatedDays) applyPlanFromDays(data.estimatedDays)
      handleResidentChange(data.residentId)
      // 预约套餐自动带入计费单价、押金与计费周期
      const pkg = data.comboId ? packageList.value.find(p => p.id === data.comboId) : null
      if (pkg) selectPackage(pkg)
    }
  } catch {
    ElMessage.warning('加载预约信息失败')
  }
}

// 照片上传成功处理
function handlePhotoUploadSuccess(res, file, fileList, fieldName) {
  let uploadedUrl = null
  if (res?.code === 0) {
    if (typeof res.data === 'string') uploadedUrl = res.data
    else if (res.data?.url) uploadedUrl = res.data.url
  }
  if (uploadedUrl) {
    file.url = uploadedUrl
    file.response = res
  }
  resident[fieldName] = fileList.map(f => {
    const url = f.url || (typeof f.response?.data === 'string' ? f.response.data : f.response?.data?.url)
    return { uid: f.uid || Date.now() + Math.random(), name: f.name || (url ? url.split('/').pop() : 'image'), status: 'success', url: url || f.url || '' }
  }).filter(f => f.url)
}

// 照片移除处理
function handlePhotoRemove(file, fileList, fieldName) {
  resident[fieldName] = fileList.map(f => {
    const url = f.url || (typeof f.response?.data === 'string' ? f.response.data : f.response?.data?.url)
    return { uid: f.uid || Date.now() + Math.random(), name: f.name || (url ? url.split('/').pop() : 'image'), status: 'success', url: url || f.url || '' }
  }).filter(f => f.url)
}

// 录入方式切换：新增与选择之间切换时重置对应字段
function handleModeChange(mode) {
  if (mode === 'new') {
    resident.residentId = undefined
    resident.residentNo = ''
    resident.residentName = ''
    resident.gender = undefined
    resident.birthDate = ''
    resident.idCard = ''
    resident.phone = ''
    resident.careLevel = ''
  } else {
    resident.residentName = ''
  }
}

// 新增档案：18 位身份证自动回填出生日期与性别
function parseIdCard() {
  const id = String(resident.idCard || '').trim().toUpperCase()
  resident.idCard = id
  if (resident.mode !== 'new' || !/^\d{17}[\dX]$/.test(id)) return
  const birth = `${id.slice(6, 10)}-${id.slice(10, 12)}-${id.slice(12, 14)}`
  const gender = Number(id.charAt(16)) % 2 === 1 ? 1 : 2
  const changed = resident.birthDate !== birth || resident.gender !== gender
  resident.birthDate = birth
  resident.gender = gender
  if (changed) ElMessage.success('已根据身份证自动识别出生日期与性别')
}

// 长者基础信息校验（提交前）
function validateResidentBasic() {
  if (!resident.residentName) { ElMessage.warning('请填写入住长者姓名（选择档案或新增填写）'); return false }
  if (resident.mode === 'select' && !resident.residentId) { ElMessage.warning('请选择长者档案或切换为新增档案'); return false }
  if (resident.mode === 'new') {
    if (!resident.gender) { ElMessage.warning('请为新增档案的长者选择性别'); return false }
    const id = String(resident.idCard || '').trim()
    if (!id) { ElMessage.warning('请填写长者身份证号（新增档案必填）'); return false }
    if (!/^\d{17}[\dXx]$/.test(id)) { ElMessage.warning('身份证号格式不正确，请检查 18 位号码'); return false }
  }
  const phone = String(resident.phone || '').trim()
  if (phone && !/^1[3-9]\d{9}$/.test(phone)) { ElMessage.warning('联系电话格式不正确，请检查'); return false }
  return true
}

// 表单校验失败时滚到第一个报错项（单页不再分步骤）
function scrollToFirstError() {
  const el = document.querySelector('.checkin-form .el-form-item.is-error')
  if (el && el.scrollIntoView) el.scrollIntoView({ behavior: 'smooth', block: 'center' })
}

// 打开房间/床位选择器
async function openSpaceSelector() {
  spaceDialogVisible.value = true
  spaceFilter.value = { buildingId: undefined, floorId: undefined, roomId: undefined, bedType: undefined }
  floors.value = []
  rooms.value = []
  await loadBuildings()
  await loadAllRooms()
  await loadAvailableSpaces()
}

async function loadBuildings() {
  try {
    const res = await listAllBuildings()
    buildings.value = res.data || []
  } catch {
    buildings.value = []
  }
}

// 加载全部房间（用于房间名称映射与房间下拉）
async function loadAllRooms() {
  try {
    const res = await listRoom({ pageSize: 999 })
    const list = res.data?.list || res.data?.records || (Array.isArray(res.data) ? res.data : [])
    allRooms.value = list
    const map = {}
    list.forEach(r => { map[r.id] = r })
    roomMap.value = map
  } catch {
    allRooms.value = []
  }
}

async function handleBuildingChange(buildingId) {
  spaceFilter.value.floorId = undefined
  spaceFilter.value.roomId = undefined
  floors.value = []
  rooms.value = buildingId ? allRooms.value.filter(r => r.buildingId === buildingId) : []
  if (buildingId) {
    try {
      const res = await listFloorByBuilding(buildingId)
      floors.value = res.data || []
    } catch {
      floors.value = []
    }
  }
  await loadAvailableSpaces()
}

async function handleFloorChange(floorId) {
  spaceFilter.value.roomId = undefined
  rooms.value = floorId
    ? allRooms.value.filter(r => r.floorId === floorId)
    : allRooms.value.filter(r => r.buildingId === spaceFilter.value.buildingId)
  await loadAvailableSpaces()
}

async function loadAvailableSpaces() {
  spaceLoading.value = true
  try {
    const { buildingId, floorId, roomId, bedType } = spaceFilter.value
    const res = await getAvailableSpaces({ buildingId, floorId, roomId, bedType })
    availableSpaces.value = res.data || []
  } catch {
    availableSpaces.value = []
  } finally {
    spaceLoading.value = false
  }
}

function roomNameOf(roomId) {
  const r = roomMap.value[roomId]
  return r ? (r.roomName || r.roomNo || '') : ''
}

// 单击床位即选定并返回表单
function pickSpace(space) {
  resident.bedId = space.id
  resident.bedNo = space.bedNo
  resident.buildingId = space.buildingId
  resident.roomId = space.roomId
  resident.roomName = roomNameOf(space.roomId)
  spaceDialogVisible.value = false
  ElMessage.success(`已分配：${resident.roomName || '房间'} ${space.bedNo}`)
}

// 选择康养套餐（计费周期只按年/月，未指定时默认按月）
function applyComboPrice(pkg) {
  const p = resolveComboPriceByCycle(pkg, resident.chargeCycle ?? CHARGE_CYCLE.MONTH)
  resident.chargeCycle = p.cycle
  resident.periodPrice = p.periodPrice
  resident.comboYearPrice = pkg.yearPrice || 0
  resident.comboMonthPrice = pkg.monthPrice || 0
  resident.comboDayPrice = pkg.dayPrice || 0
}

function selectPackage(pkg) {
  resident.comboId = pkg.id
  resident.comboName = pkg.comboName
  resident.deposit = pkg.depositAmount ?? resident.deposit ?? 0
  applyComboPrice(pkg)
}

// 套餐抽屉：右栏点「选择/更换」打开，点卡片即选中并关闭
const pkgDrawerVisible = ref(false)
function choosePackage(pkg) {
  selectPackage(pkg)
  pkgDrawerVisible.value = false
}

// 计费周期变化时，按新周期从套餐三价重新取周期单价
function reapplyComboPrice() {
  const pkg = packageList.value.find(p => p.id === resident.comboId)
  if (pkg) applyComboPrice(pkg)
}

// 康养费逐段预估（年价×年 + 月价×月 + 日价×天，与后端 ChargeCalcKit.calcBedFee 同口径）
function estimateBedFee() {
  const days = plannedDays(resident.chargeNum, resident.chargeCycle)
  const hasSnapshot = (Number(resident.comboYearPrice) || 0) > 0
      || (Number(resident.comboMonthPrice) || 0) > 0
      || (Number(resident.comboDayPrice) || 0) > 0
  if (hasSnapshot) {
    return calcBedFee(resident.comboYearPrice, resident.comboMonthPrice, resident.comboDayPrice, days)
  }
  return 0
}

// 预估费用 = 康养费逐段 + 押金
function estimateFee() {
  const deposit = Number(resident.deposit) || 0
  return (estimateBedFee() + deposit).toFixed(2)
}

// 计划时长录入：数值→chargeNum，单位（年/月）→chargeCycle
const CYCLE_TO_UNIT = { [CHARGE_CYCLE.YEAR]: 'year', [CHARGE_CYCLE.MONTH]: 'month', [CHARGE_CYCLE.DAY]: 'day' }
const UNIT_TO_CYCLE = { year: CHARGE_CYCLE.YEAR, month: CHARGE_CYCLE.MONTH, day: CHARGE_CYCLE.DAY }
const planDuration = reactive({ value: 1, unit: 'month' })

// 计划时长单位：仅年 / 月；历史按天单据或仅配置日价的套餐补一个选项，避免回显错位
const durationUnitOptions = computed(() => {
  const opts = [{ label: '年', value: 'year' }, { label: '月', value: 'month' }]
  if (Number(resident.chargeCycle) === CHARGE_CYCLE.DAY) opts.push({ label: '天（按日价）', value: 'day' })
  return opts
})

// 周期单位中文（年/月；仅历史按天单据为天）
const cycleUnitLabel = computed(() => {
  const c = Number(resident.chargeCycle)
  if (c === CHARGE_CYCLE.YEAR) return '年'
  if (c === CHARGE_CYCLE.MONTH) return '月'
  return '天'
})

function onPlanDurationChange() {
  resident.chargeNum = Math.max(1, Number(planDuration.value) || 1)
  resident.chargeCycle = UNIT_TO_CYCLE[planDuration.unit] ?? CHARGE_CYCLE.MONTH
  reapplyComboPrice()
}
// 由 resident.chargeNum + chargeCycle 回填计划时长录入控件
function syncPlanDuration() {
  planDuration.value = Number(resident.chargeNum) || 1
  planDuration.unit = CYCLE_TO_UNIT[Number(resident.chargeCycle)] || 'month'
}
// 由「总天数」推导计划时长（预约转登记时 appointment.estimatedDays → chargeNum + chargeCycle）
// 计费只按年/月：满整年按年，其余按月向上取整（不足一月按一月计划，退住时按实际天数多退少补）
function applyPlanFromDays(totalDays) {
  const d = Math.max(1, Number(totalDays) || 1)
  if (d >= 365 && d % 365 === 0) { resident.chargeCycle = CHARGE_CYCLE.YEAR; resident.chargeNum = d / 365 }
  else { resident.chargeCycle = CHARGE_CYCLE.MONTH; resident.chargeNum = Math.max(1, Math.ceil(d / 30)) }
  syncPlanDuration()
}
// 计费拆分说明（右侧费用栏展示）：如「计划 2 月：2月×¥3200」
const estimateBreakdownText = computed(() => {
  const days = plannedDays(resident.chargeNum, resident.chargeCycle)
  const { years, months, days: rem } = decomposeDuration(days)
  const segs = []
  const y = Number(resident.comboYearPrice) || 0
  const m = Number(resident.comboMonthPrice) || 0
  const d = Number(resident.comboDayPrice) || 0
  if (years) segs.push(y > 0 ? `${years}年×¥${y}` : `${years * 12}月`)
  if (months) segs.push(m > 0 ? `${months}月×¥${m}` : `${months * 30}天折算`)
  // 仅历史按天单据会出现不足一月的零头
  if (rem) segs.push(d > 0 ? `零头${rem}天×¥${d}` : `零头${rem}天按日折算`)
  return segs.length ? `计划 ${resident.chargeNum || 0} ${cycleUnitLabel.value}：${segs.join(' + ')}` : ''
})

// 照护等级：入住存字符串，长者档案存数字编码
const CARE_LEVEL_CODE = { '自理': 1, '半自理': 2, '失能': 3 }

function careLevelToInt(level) {
  if (level == null || level === '') return undefined
  if (typeof level === 'number') return level
  return CARE_LEVEL_CODE[level]
}

function joinArr(val) {
  return Array.isArray(val) ? val.filter(Boolean).join(',') : (val || '')
}
function joinFiles(val) {
  if (Array.isArray(val)) return val.map(p => (typeof p === 'string' ? p : p.url || '')).filter(Boolean).join(',')
  return val || ''
}

// 构建提交数据（一人一单：全部拍平到 checkin 对象，不带 checkinResidentVOList）
function buildSubmitData() {
  const r = resident
  return {
    id: form.value.id || undefined,
    appointmentId: form.value.appointmentId || (appointmentId ? Number(appointmentId) : undefined),
    checkinNo: form.value.checkinNo || undefined,
    checkinDate: form.value.checkinDate,
    chargeNum: Number(r.chargeNum) || 1,
    chargeCycle: r.chargeCycle ?? undefined,
    specialNeeds: form.value.specialNeeds,
    remarks: r.remark || form.value.remarks,
    comboId: r.comboId || undefined,
    checkinStatus: form.value.checkinStatus ?? 0,
    // 家属 / 紧急联系人
    contactName: contactForm.value.contactName,
    contactPhone: contactForm.value.contactPhone,
    contactPhoneBackup: contactForm.value.contactPhoneBackup,
    // 入住长者（拍平）
    residentId: r.residentId,
    residentNo: r.residentNo,
    residentName: r.residentName,
    gender: r.gender,
    birthDate: r.birthDate || undefined,
    idCard: r.idCard,
    phone: r.phone,
    careLevel: r.careLevel,
    mentalState: r.mentalState,
    temperature: r.temperature,
    pulse: r.pulse,
    bloodPressureHigh: r.bloodPressureHigh,
    bloodPressureLow: r.bloodPressureLow,
    bloodOxygen: r.bloodOxygen,
    fallRisk: r.fallRisk,
    cognition: r.cognition,
    dietType: r.dietType,
    chronicDiseases: r.chronicDiseases,
    medications: r.medications,
    allergies: r.allergies,
    broughtItems: joinArr(r.broughtItems),
    broughtPhotos: joinFiles(r.broughtPhotos),
    checkinPhotos: joinFiles(r.checkinPhotos),
    // 床位快照
    bedId: r.bedId,
    bedNo: r.bedNo,
    buildingId: r.buildingId || undefined,
    roomId: r.roomId || undefined,
    roomName: r.roomName || undefined,
    // 费用项透传（编辑时保留原有明细）
    feeItemList: form.value.feeItemList || []
  }
}

async function goBack() {
  const dirty = !!resident.residentName || !!resident.comboId || !!resident.bedId
  if (dirty && !submitting.value) {
    const ok = await ElMessageBox.confirm('当前登记内容尚未提交，确认离开？', '提示', {
      confirmButtonText: '离 开',
      cancelButtonText: '继续填写',
      type: 'warning'
    }).catch(() => false)
    if (!ok) return
  }
  router.back()
}

// 校验
function validateCommon() {
  if (!validateResidentBasic()) return false
  if (!resident.comboId) {
    ElMessage.warning('请选择康养套餐')
    return false
  }
  if (!resident.bedId) {
    ElMessage.warning('请分配房间/床位')
    return false
  }
  if (!contactForm.value.contactName || !contactForm.value.contactPhone) {
    ElMessage.warning('请填写联系人姓名与联系电话')
    return false
  }
  return true
}

// 「新增档案」在提交前先落库成长者档案，满足入住登记对 residentId 的要求
async function ensureResidentArchives() {
  if (resident.mode !== 'new' || resident.residentId) return
  try {
    const res = await createResident({
      name: resident.residentName,
      gender: resident.gender === 1 ? '男' : (resident.gender === 2 ? '女' : undefined),
      birthDate: resident.birthDate || undefined,
      idCard: resident.idCard || undefined,
      phone: resident.phone || undefined,
      careLevel: careLevelToInt(resident.careLevel),
      emergencyContact: contactForm.value.contactName || undefined,
      emergencyPhone: contactForm.value.contactPhone || undefined,
      admissionDate: form.value.checkinDate,
      roomId: resident.roomId || undefined,
      bedId: resident.bedId || undefined
    })
    const created = res.data || {}
    if (!created.id) throw new Error('长者档案未返回ID')
    resident.residentId = created.id
    resident.residentNo = created.residentNo || resident.residentNo || ''
    resident.mode = 'select'
    ensureResidentOption({ id: created.id, name: resident.residentName, residentNo: resident.residentNo })
  } catch (error) {
    ElMessage.error(`长者「${resident.residentName}」档案创建失败，请前往「长者档案」新增后重试`)
    throw error
  }
}

// 提交登记
async function submitForm() {
  if (submitting.value) return
  if (!validateCommon()) return
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) { scrollToFirstError(); return }
  // 提交前二次确认，避免误提交
  const tip = `确认为「${resident.residentName}」提交入住登记？套餐：${resident.comboName || '-'}；房间/床位：${resident.roomName || '房间'} · ${resident.bedNo || '-'}；预估费用 ¥${estimateFee()}`
  const ok = await ElMessageBox.confirm(tip, '提交登记确认', {
    confirmButtonText: '确认提交',
    cancelButtonText: '再检查一下',
    type: 'warning'
  }).catch(() => false)
  if (!ok) return
  submitting.value = true
  try {
    await ensureResidentArchives()
    const api = isEdit.value ? updateCheckin : addCheckin
    await api(buildSubmitData())
    ElMessage.success(isEdit.value ? '修改成功' : '登记已提交，请在登记列表完成押金确认')
    router.back()
  } catch (error) {
    console.error('提交失败:', error)
  } finally {
    submitting.value = false
  }
}

onMounted(async () => {
  // 互不依赖的请求并行加载，缩短首屏等待
  await Promise.all([loadPackages(), searchResidents(''), loadAppointment()])
  await loadDetail()
  await prefillResident()
  await prefillRoom()
})

// 已在登记表单页时再次从房间管理页点「入住」：只变 query 不重挂载
watch(() => [route.query.roomId, route.query.bedId], () => { if (route.query.roomId) prefillRoom() })
</script>

<style scoped>
.app-container {
  padding: 20px;
  /* 容器查询参考：按实际内容宽度（与侧边栏折叠无关）决定是否分栏 */
  container-type: inline-size;
}

.form-card {
  margin-top: 20px;
  /* el-card 默认 overflow:hidden，会阻断右侧栏 sticky */
  overflow: visible;
  /* 作为容器查询参考：按卡片实际可用宽度决定是否分栏，不受侧边栏折叠影响 */
  container-type: inline-size;
}
/* 表单主体：默认单列，宽屏切为「左表单 + 右费用栏」 */
.form-card :deep(.el-card__body) {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 20px;
  align-items: start;
}

/* 选填项折叠条 */
.optional-toggle {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 4px 0 16px;
  padding: 10px 14px;
  background: #f7f9fc;
  border: 1px dashed #dcdfe6;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s;
}
.optional-toggle:hover {
  border-color: #409EFF;
  background: #f2f8ff;
}
.optional-toggle__icon-wrap {
  flex: none;
  width: 20px;
  height: 20px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: #e8eef7;
  border-radius: 50%;
  color: #606266;
}
.optional-toggle__icon {
  font-size: 12px;
  transition: transform 0.25s;
}
.optional-toggle.is-open .optional-toggle__icon {
  transform: rotate(180deg);
}
.optional-toggle__label {
  font-size: 13px;
  font-weight: 600;
  color: #1d2129;
}
.optional-toggle__hint {
  font-size: 12px;
  color: #c0c4cc;
}
.optional-toggle__action {
  margin-left: auto;
  font-size: 12px;
  color: #409EFF;
}

.form-section {
  margin-bottom: 22px;
  padding-bottom: 20px;
  border-bottom: 1px dashed #eef1f5;
}
.form-section:last-of-type {
  border-bottom: none;
  margin-bottom: 0;
  padding-bottom: 0;
}

/* 区块标题：编号徽标 + 标题 + 提示 */
.section-title {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 18px;
  padding-bottom: 12px;
  border-bottom: 1px solid #f2f4f8;
}
.section-title__no {
  flex: none;
  width: 24px;
  height: 24px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  font-weight: 700;
  color: #fff;
  background: linear-gradient(135deg, #409EFF, #79bbff);
  border-radius: 8px;
  box-shadow: 0 2px 6px rgba(64, 158, 255, 0.3);
}
.section-title__text {
  font-size: 16px;
  font-weight: 600;
  color: #1d2129;
}
.section-title__tip {
  font-size: 12px;
  color: #909399;
}
.section-title__switch {
  margin-left: auto;
}

.checkin-form :deep(.el-form-item) {
  margin-bottom: 16px;
}

.form-footer {
  position: sticky;
  bottom: 0;
  z-index: 10;
  display: flex;
  align-items: center;
  gap: 16px;
  margin-top: 16px;
  padding: 12px 16px;
  background: #fff;
  border: 1px solid #ebeef5;
  border-radius: 8px;
  box-shadow: 0 -2px 12px rgba(0, 0, 0, 0.08);
}
.footer-summary {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
  min-width: 0;
  font-size: 13px;
  color: #1d2129;
}
.footer-summary .fs-item {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  max-width: 220px;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}
.footer-summary .fs-item .el-icon { color: #409EFF; }
.footer-summary .fs-item.is-empty { color: #c0c4cc; }
.footer-summary .fs-item.is-empty .el-icon { color: #dcdfe6; }
.footer-summary .fs-fee {
  margin-left: 4px;
  padding: 3px 10px;
  font-size: 16px;
  font-weight: 700;
  color: #f56c6c;
  background: #fef0f0;
  border-radius: 10px;
}
.footer-summary .fs-fee__label {
  margin-right: 6px;
  font-size: 12px;
  font-weight: 400;
  color: #909399;
}
.footer-actions {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-left: auto;
}

/* 预约信息卡片 */
.appointment-card {
  margin-top: 20px;
  margin-bottom: 20px;
  background: linear-gradient(135deg, #e6f7ff 0%, #f0f9ff 100%);
}
.appointment-card .card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.appointment-card .price-highlight {
  color: #f56c6c;
  font-size: 18px;
  font-weight: 700;
}

/* 信息分区 */
.resident-section {
  margin-bottom: 24px;
  padding-bottom: 20px;
  border-bottom: 1px dashed #dcdfe6;
}
.resident-section:last-child {
  border-bottom: none;
  margin-bottom: 0;
  padding-bottom: 0;
}
.resident-basic-section {
  margin-bottom: 0;
  padding-bottom: 0;
  border-bottom: none;
}
.resident-brief {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 18px;
  padding: 12px 14px;
  background: linear-gradient(135deg, #f0f9ff 0%, #f7fbff 100%);
  border: 1px solid #d9ecff;
  border-radius: 10px;
}
.rb-avatar {
  flex: none;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  font-weight: 700;
  color: #fff;
  background: linear-gradient(135deg, #409EFF, #79bbff);
  border-radius: 50%;
}
.rb-main { min-width: 0; }
.rb-name {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 15px;
  font-weight: 600;
  color: #1d2129;
}
.rb-meta {
  margin-top: 4px;
  font-size: 12px;
  color: #909399;
}
.rb-flag {
  margin-left: auto;
  flex: none;
}

/* 档案提示条（替代两个 alert，减少纵向占高） */
.resident-hint {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 4px;
  padding: 8px 12px;
  font-size: 12px;
  color: #909399;
  background: #fafbfc;
  border-radius: 8px;
}
.resident-hint .el-icon {
  color: #409EFF;
  font-size: 14px;
}
.resident-section-title {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  font-weight: 600;
  color: #606266;
  margin-bottom: 16px;
  padding-left: 8px;
  border-left: 3px solid #67C23A;
}

/* 套餐抽屉筛选工具栏 */
.pkg-toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
}
.pkg-toolbar__count {
  margin-left: auto;
  font-size: 12px;
  color: #909399;
}
.pkg-match-hint {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 8px;
  font-size: 12px;
  color: #409EFF;
  background: #ecf5ff;
  border-radius: 10px;
}

/* 康养套餐卡片 */
.pkg-select-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 12px;
}
.pkg-option {
  position: relative;
  padding: 14px 16px;
  background: #fff;
  border: 2px solid #e4e7ed;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.25s;
}
.pkg-option:hover {
  border-color: #409EFF;
  transform: translateY(-2px);
  box-shadow: 0 8px 18px rgba(64, 158, 255, 0.18);
}
.pkg-option.is-active {
  border-color: #409EFF;
  background: linear-gradient(135deg, #ecf5ff 0%, #f7fbff 100%);
  box-shadow: 0 6px 16px rgba(64, 158, 255, 0.16);
}
.pkg-option__check {
  position: absolute;
  top: 10px;
  right: 10px;
  width: 22px;
  height: 22px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  color: #fff;
  background: #409EFF;
  border-radius: 50%;
  box-shadow: 0 2px 6px rgba(64, 158, 255, 0.45);
}
.pkg-option__name {
  font-size: 15px;
  font-weight: 600;
  color: #1d2129;
  margin-bottom: 6px;
  padding-right: 32px;
}
.pkg-option__price {
  display: flex;
  align-items: baseline;
  gap: 4px;
  margin-top: 8px;
}
.pkg-option__amount {
  font-size: 22px;
  font-weight: 700;
  color: #f56c6c;
  line-height: 1.1;
}
.pkg-option__year {
  margin-left: auto;
  font-size: 12px;
  color: #909399;
}
.pkg-option__unit {
  font-size: 12px;
  font-weight: 400;
  color: #909399;
}
.pkg-option__meta {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 8px;
  font-size: 12px;
  color: #909399;
}
.pkg-option__tags {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-bottom: 6px;
}
.pkg-option__desc {
  font-size: 12px;
  color: #86909c;
  line-height: 1.5;
  margin-bottom: 6px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  min-height: 36px;
}
.pkg-option__preview {
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px dashed #e4e7ed;
  font-size: 12px;
  color: #e6a23c;
}
.pkg-option__warn {
  color: #f56c6c;
}
.pkg-option.is-dimmed {
  opacity: .55;
}
.pkg-option.is-dimmed:hover {
  opacity: 1;
}

/* 右侧费用栏（宽屏吸顶，窄屏跟随表单末尾） */
.side-card {
  padding: 16px;
  background: #fff;
  border: 1px solid #eef1f5;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(29, 33, 41, 0.05);
}
.side-card__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 14px;
}
.side-card__title {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 15px;
  font-weight: 600;
  color: #1d2129;
}
.side-card__title .el-icon { color: #409EFF; }

.side-summary { display: flex; flex-direction: column; gap: 6px; }
.side-summary__item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: #1d2129;
}
.side-summary__item .el-icon { flex: none; color: #409EFF; font-size: 14px; }
.side-summary__item span {
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}
.side-summary__item.is-empty { color: #c0c4cc; }
.side-summary__item.is-empty .el-icon { color: #dcdfe6; }

.side-pick { display: flex; flex-direction: column; gap: 10px; margin-top: 14px; }
.side-pick__row { display: flex; align-items: center; gap: 8px; }
.side-pick__label { flex: none; width: 68px; font-size: 13px; color: #606266; white-space: nowrap; }
.side-pick__row .el-input-number { flex: 1; width: auto; min-width: 0; }
.side-pick__row .pick-box { flex: 1; min-width: 0; }

.side-divider { height: 1px; background: #eef1f5; margin: 14px 0; }

.side-fee { display: flex; flex-direction: column; gap: 8px; }
.side-fee__row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  font-size: 13px;
  color: #606266;
}
.side-fee__row b { font-weight: 600; color: #1d2129; }
.side-fee__row b em {
  margin-left: 2px;
  font-style: normal;
  font-size: 12px;
  font-weight: 400;
  color: #909399;
}
.side-fee__input { display: inline-flex; align-items: center; gap: 6px; }

.side-total {
  position: relative;
  margin-top: 14px;
  padding: 14px 16px 14px 18px;
  background: linear-gradient(135deg, #fff6f6 0%, #fffdfd 62%, #fff 100%);
  border: 1px solid #ffe3e3;
  border-radius: 12px;
  overflow: hidden;
}
/* 左侧强调条，把“合计”从普通行里拎出来 */
.side-total::before {
  content: '';
  position: absolute;
  top: 12px;
  bottom: 12px;
  left: 0;
  width: 3px;
  background: linear-gradient(180deg, #f56c6c 0%, #fab6b6 100%);
  border-radius: 0 3px 3px 0;
}
.side-total__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}
.side-total__label {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
  font-weight: 600;
  color: #606266;
}
.side-total__label .el-icon { color: #f56c6c; font-size: 14px; }
.side-total__deposit { font-size: 12px; color: #909399; }
.side-total__amount {
  margin-top: 6px;
  font-size: 28px;
  font-weight: 700;
  line-height: 1.15;
  color: #f56c6c;
  letter-spacing: 0.5px;
  font-variant-numeric: tabular-nums;
}
.side-total__symbol {
  margin-right: 2px;
  font-size: 16px;
  font-weight: 600;
}
/* 未选套餐时金额置灰，避免“¥0.00”看着像已经算好了 */
.side-total.is-empty {
  background: linear-gradient(135deg, #fafbfc 0%, #fff 62%, #fff 100%);
  border-color: #ebeef5;
}
.side-total.is-empty::before { background: #dcdfe6; }
.side-total.is-empty .side-total__label,
.side-total.is-empty .side-total__label .el-icon { color: #909399; }
.side-total.is-empty .side-total__amount { color: #c0c4cc; }

.side-note {
  display: flex;
  gap: 6px;
  margin-top: 12px;
  padding: 8px 10px;
  font-size: 12px;
  line-height: 1.6;
  color: #909399;
  background: #fafbfc;
  border-radius: 8px;
}
.side-note .el-icon { flex: none; margin-top: 2px; color: #409EFF; }
.side-tip { margin-top: 8px; font-size: 12px; line-height: 1.5; color: #909399; }

/* 宽屏时由右侧栏提供提交按钮，窄屏隐藏 */
.side-actions { display: none; gap: 10px; margin-top: 14px; }
.side-actions .el-button { flex: 1; margin-left: 0; }

/* 套餐 / 房间床位 选择框（右栏） */
.pick-box {
  display: flex; align-items: center; gap: 10px;
  width: 100%; min-height: 34px; padding: 4px 12px;
  background: #fff; border: 1px solid #dcdfe6; border-radius: 8px;
  cursor: pointer;
  transition: border-color 0.2s, box-shadow 0.2s;
}
.pick-box:hover { border-color: #409EFF; box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.12); }
.pick-box.is-empty { border-style: dashed; background: #fafbfc; }
.pick-box__icon { flex: none; color: #409EFF; font-size: 16px; }
.pick-box__text {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  font-weight: 600;
  color: #1d2129;
}
.pick-box__empty { flex: 1; color: #c0c4cc;font-size: 12px; }
.pick-box .el-button { margin-left: auto; flex: none; }

/* 抽屉页脚（套餐选择） */
.drawer-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}
.drawer-footer__hint { font-size: 12px; color: #909399; }

/* 床位选择 */
.space-card {
  background: #f7f8fa;
  border-radius: 8px;
  padding: 16px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s;
  border: 2px solid transparent;
  margin-bottom: 16px;
}
.space-card:hover {
  background: #e6f7ff;
  border-color: #409EFF;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(64, 158, 255, 0.18);
}
.space-pick-tip {
  font-size: 12px;
  color: #909399;
  margin-bottom: 12px;
}
.space-icon {
  color: #409EFF;
  margin-bottom: 8px;
}
.space-name {
  font-size: 16px;
  font-weight: 600;
  color: #1d2129;
  margin-bottom: 4px;
}
.space-type {
  font-size: 12px;
  color: #86909c;
  margin-bottom: 8px;
}
.space-sub {
  font-size: 12px;
  color: #409EFF;
  margin-bottom: 4px;
}

/* 宽屏：左右分栏，表单左、费用右常驻（按卡片可用宽度，而非视口） */
@container (min-width: 1100px) {
  .form-card :deep(.el-card__body) {
    grid-template-columns: minmax(0, 1fr) 340px;
    gap: 0 24px;
  }
  .layout-side {
    position: sticky;
    top: 16px;
  }
  .side-actions { display: flex; }
}
/* 底栏与右栏同时机切换：卡片比容器少 2px 边框，阈值 +2px 避免出现无提交按钮的空档 */
@container (min-width: 1102px) {
  .form-footer { display: none; }
}

/* 窄屏适配：表单栅格堆叠、标题提示隐藏、页脚换行 */
@media (max-width: 768px) {
  .app-container { padding: 12px; }
  .section-title__tip { display: none; }
  .section-title__switch { margin-left: auto; }
  .pkg-select-grid { grid-template-columns: 1fr; }
  .form-footer {
    flex-wrap: wrap;
    gap: 10px;
    padding: 10px 12px;
  }
  .footer-summary { width: 100%; }
  .footer-actions { margin-left: 0; width: 100%; justify-content: flex-end; }
}
</style>
