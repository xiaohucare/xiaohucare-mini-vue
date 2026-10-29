<template>
  <div class="app-container">
    <el-card shadow="never">
      <!-- 搜索区域 -->
      <el-form :model="queryParams" ref="queryForm" :inline="true" label-width="80px">
        <el-form-item label="长者姓名" prop="residentName">
          <el-input
            v-model="queryParams.residentName"
            placeholder="请输入长者姓名"
            clearable
            style="width: 180px"
            @keyup.enter="handleQuery"
          />
        </el-form-item>
        <el-form-item label="家属电话" prop="contactPhone">
          <el-input
            v-model="queryParams.contactPhone"
            placeholder="请输入家属电话"
            clearable
            style="width: 180px"
            @keyup.enter="handleQuery"
          />
        </el-form-item>
        <el-form-item label="房间" prop="roomName">
          <el-input
            v-model="queryParams.roomName"
            placeholder="请输入房间名称"
            clearable
            style="width: 180px"
            @keyup.enter="handleQuery"
          />
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-select v-model="queryParams.status" placeholder="请选择状态" clearable style="width: 180px">
            <el-option label="正常" value="GOOD" />
            <el-option label="需关注" value="NORMAL" />
            <el-option label="异常" value="POOR" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" icon="Search" @click="handleQuery" round>搜索</el-button>
          <el-button icon="Refresh" @click="resetQuery" round>重置</el-button>
        </el-form-item>
      </el-form>

      <!-- 一周日程管理 -->
      <el-card shadow="never" class="mb20">
        <template #header>
          <div class="schedule-header">
            <div class="schedule-title">
              <span>一周日程管理</span>
              <span class="current-time">{{ currentTime }}</span>
            </div>
            <div class="schedule-nav">
              <el-button type="primary" size="small" @click="handleEditSchedule" round>
                <el-icon><Edit /></el-icon>编辑日程
              </el-button>
            </div>
          </div>
        </template>
        
        <!-- 星期导航 -->
        <div class="week-nav">
          <div 
            v-for="(day, index) in weekDays" 
            :key="index"
            class="day-tab"
            :class="{ 
              'active': selectedDayIndex === index,
              'today': day.isToday 
            }"
            @click="selectDay(index)"
          >
            <div class="day-name">{{ day.name }}</div>
            <div class="day-date">{{ day.date }}</div>
            <div class="day-badge" v-if="day.taskCount > 0">{{ day.taskCount }}</div>
          </div>
        </div>

        <!-- 当天日程横向时间轴 -->
        <div class="daily-schedule-horizontal">
          <div class="schedule-timeline">
            <div 
              v-for="(activity, index) in currentDaySchedule" 
              :key="index"
              class="schedule-item"
              :class="{ 'completed': activity.completed, 'current': activity.isCurrent }"
            >
              <div class="time-marker" :style="{ borderColor: activity.color }">
                <div class="time-dot" :style="{ backgroundColor: activity.color }"></div>
                <div class="time-label">{{ activity.time }}</div>
              </div>
              <div class="activity-card" :style="{ borderLeftColor: activity.color }">
                <div class="activity-content">{{ activity.content }}</div>
                <div class="activity-meta">
                  <el-tag size="small" :type="activity.tagType" effect="plain">{{ activity.typeLabel }}</el-tag>
                  <span class="activity-status" v-if="activity.completed">
                    <el-icon><Check /></el-icon>已完成
                  </span>
                  <span class="activity-status current" v-else-if="activity.isCurrent">
                    <el-icon><Loading /></el-icon>进行中
                  </span>
                </div>
                <div class="activity-actions" v-show="false">
                  <el-button 
                    type="primary" 
                    link 
                    size="small" 
                    @click.stop="handleEditScheduleItem(activity)"
                  >
                    <el-icon><Edit /></el-icon>
                  </el-button>
                  <el-button 
                    type="danger" 
                    link 
                    size="small" 
                    @click.stop="handleDeleteScheduleItem(activity)"
                  >
                    <el-icon><Delete /></el-icon>
                  </el-button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </el-card>

      <!-- 在住长者看板 -->
      <div class="boarding-board">
        <h3 class="board-title">在住长者</h3>
        <el-row :gutter="20">
          <el-col :xs="24" :sm="12" :md="8" :lg="6" v-for="resident in boardingList" :key="resident.id">
            <el-card 
              shadow="hover" 
              class="resident-card"
              :class="getResidentCardClass(resident.mentalState)"
            >
              <div class="resident-header">
                <el-avatar :size="60"><el-icon :size="26"><User /></el-icon></el-avatar>
                <div class="resident-info">
                  <div class="resident-name">{{ resident.residentName }}</div>
                  <div class="resident-meta">{{ genderLabel(resident.gender) }} · 照护等级 {{ resident.careLevel || '未评估' }}</div>
                  <div class="resident-days">在住 {{ resident.days }} 天</div>
                </div>
                <el-tag :type="getStatusType(resident.mentalState)" size="small">{{ getStatusLabel(resident.mentalState) }}</el-tag>
              </div>
              <!-- 健康与风险评估标签 -->
              <div class="resident-tags" v-if="resident.healthRiskLevel || resident.allergies || resident.medications || hasRiskWarning(resident)">
                <el-tag v-if="resident.healthRiskLevel === 'ALERT'" type="danger" size="small" effect="dark">
                  <el-icon><WarningFilled /></el-icon> 健康警告
                </el-tag>
                <el-tag v-else-if="resident.healthRiskLevel === 'WATCH'" type="warning" size="small" effect="dark">
                  <el-icon><Warning /></el-icon> 需关注
                </el-tag>
                <el-tag v-else type="success" size="small" effect="plain">
                  <el-icon><CircleCheck /></el-icon> 健康
                </el-tag>
                <el-tag v-if="resident.allergies" type="danger" size="small">过敏: {{ resident.allergies }}</el-tag>
                <el-tag v-if="resident.medications" color="#7b2ff7" size="small" style="color:#fff;border:none;">服药中</el-tag>
                <el-tag v-if="resident.fallRisk === 'HIGH'" type="danger" size="small">高跌倒风险</el-tag>
                <el-tag v-else-if="resident.fallRisk === 'MEDIUM'" type="warning" size="small">跌倒风险</el-tag>
                <el-tag v-if="resident.cognition === 'CONFIRMED'" type="danger" size="small">确诊失智</el-tag>
                <el-tag v-else-if="resident.cognition === 'SUSPECTED'" type="warning" size="small">疑似认知障碍</el-tag>
              </div>
              <div class="resident-details">
                <div class="detail-item">
                  <span class="label">房间：</span>
                  <span>{{ resident.roomName || '未分配' }}{{ resident.bedNo ? ' · ' + resident.bedNo + '床' : '' }}</span>
                </div>
                <div class="detail-item">
                  <span class="label">家属：</span>
                  <span>{{ resident.contactName || '-' }}</span>
                </div>
                <div class="detail-item">
                  <span class="label">电话：</span>
                  <span>{{ resident.contactPhone || '-' }}</span>
                </div>
                <div class="detail-item">
                  <span class="label">膳食：</span>
                  <span>{{ resident.dietType || '未设定' }}</span>
                </div>
                <div class="detail-item">
                  <span class="label">自理能力：</span>
                  <span>{{ selfCareLabel(resident.selfCareAbility) }}</span>
                </div>
                <div class="detail-item">
                  <span class="label">今日护理：</span>
                  <span>{{ resident.todayCareRecords ?? 0 }} 次</span>
                </div>
                <div class="detail-item" v-if="resident.temperature">
                  <span class="label">体温：</span>
                  <span :style="{ color: getTemperatureColor(resident.temperature), fontWeight: 'bold' }">
                    {{ resident.temperature }} °C
                  </span>
                </div>
              </div>
              <div class="resident-actions">
                <el-button type="primary" size="small" @click="handleAddRecord(resident)" round>添加记录</el-button>
                <!-- <el-button type="success" size="small" @click="handleSendMessage(resident)" round>发送消息</el-button> -->
                <el-button type="warning" size="small" @click="handleViewDetail(resident)" round>查看详情</el-button>
                <el-button type="danger" size="small" :disabled="resident.hasCamera != 1" @click="handleOpenVideo(resident)" round>
                  <el-icon><VideoCamera /></el-icon> 视频直播
                </el-button>
              </div>
            </el-card>
          </el-col>
        </el-row>
      </div>
    </el-card>

    <!-- 添加服务记录对话框 -->
    <el-dialog title="添加服务记录" v-model="recordOpen" width="70%" append-to-body>
      <el-form ref="recordFormRef" :model="recordForm" :rules="recordRules" label-width="100px">
        <!-- 服务类型选择 -->
        <el-form-item label="服务类型" prop="serviceType">
          <el-radio-group v-model="recordForm.serviceType" size="large">
            <el-radio-button label="SCHEDULE">日程服务</el-radio-button>
            <el-radio-button label="CHARGE">收费服务</el-radio-button>
          </el-radio-group>
        </el-form-item>

        <!-- 日程服务 -->
        <template v-if="recordForm.serviceType === 'SCHEDULE'">
          <el-form-item label="日程类型" prop="scheduleType">
            <div class="service-type-cards">
              <div 
                v-for="type in scheduleTypes" 
                :key="type.value"
                class="service-type-card"
                :class="{ 'active': recordForm.scheduleType === type.value }"
                @click="recordForm.scheduleType = type.value"
              >
                <el-icon :size="24" :color="recordForm.scheduleType === type.value ? '#fff' : type.color">
                  <component :is="type.icon" />
                </el-icon>
                <div class="type-name">{{ type.label }}</div>
                <div class="type-desc">{{ type.desc }}</div>
              </div>
            </div>
          </el-form-item>

          <!-- 进餐记录 -->
          <template v-if="recordForm.scheduleType === 'FEEDING'">
            <el-form-item label="进餐时间" prop="recordTime">
              <el-time-picker v-model="recordForm.recordTime" format="HH:mm" style="width: 100%" />
            </el-form-item>
            <el-form-item label="膳食" prop="food">
              <el-input v-model="recordForm.food" placeholder="如：普食、软食、流食" />
            </el-form-item>
            <el-form-item label="食量" prop="amount">
              <el-input v-model="recordForm.amount" placeholder="如：100g" />
            </el-form-item>
            <el-form-item label="进食情况" prop="eatingCondition">
              <el-radio-group v-model="recordForm.eatingCondition">
                <el-radio label="GOOD">正常吃完</el-radio>
                <el-radio label="PARTIAL">吃了一部分</el-radio>
                <el-radio label="REFUSED">拒绝进食</el-radio>
              </el-radio-group>
            </el-form-item>
          </template>

          <!-- 活动记录 -->
          <template v-if="recordForm.scheduleType === 'WALK'">
            <el-form-item label="开始时间" prop="startTime">
              <el-time-picker v-model="recordForm.startTime" format="HH:mm" style="width: 100%" />
            </el-form-item>
            <el-form-item label="时长(分钟)" prop="duration">
              <el-input-number v-model="recordForm.duration" :min="1" :max="120" style="width: 100%" />
            </el-form-item>
            <el-form-item label="排便情况" prop="stoolDuringWalk">
              <el-radio-group v-model="recordForm.stoolDuringWalk">
                <el-radio label="YES">有排便</el-radio>
                <el-radio label="NO">未排便</el-radio>
              </el-radio-group>
            </el-form-item>
          </template>

          <!-- 排便记录 -->
          <template v-if="recordForm.scheduleType === 'STOOL'">
            <el-form-item label="时间" prop="recordTime">
              <el-time-picker v-model="recordForm.recordTime" format="HH:mm" style="width: 100%" />
            </el-form-item>
            <el-form-item label="状态" prop="stoolCondition">
              <el-radio-group v-model="recordForm.stoolCondition">
                <el-radio label="NORMAL">正常</el-radio>
                <el-radio label="SOFT">软便</el-radio>
                <el-radio label="DIARRHEA">拉稀</el-radio>
              </el-radio-group>
            </el-form-item>
          </template>

          <!-- 健康观察 -->
          <template v-if="recordForm.scheduleType === 'HEALTH'">
            <el-form-item label="精神状态" prop="mentalState">
              <el-radio-group v-model="recordForm.mentalState">
                <el-radio label="GOOD">良好</el-radio>
                <el-radio label="NORMAL">一般</el-radio>
                <el-radio label="POOR">差</el-radio>
              </el-radio-group>
            </el-form-item>
            <el-form-item label="食欲" prop="appetite">
              <el-radio-group v-model="recordForm.appetite">
                <el-radio label="GOOD">良好</el-radio>
                <el-radio label="NORMAL">一般</el-radio>
                <el-radio label="POOR">差</el-radio>
              </el-radio-group>
            </el-form-item>
            <el-form-item label="异常表现" prop="abnormalSymptoms">
              <el-input v-model="recordForm.abnormalSymptoms" type="textarea" placeholder="如有异常请详细描述" />
            </el-form-item>
          </template>

          <!-- 清洁护理 -->
          <template v-if="recordForm.scheduleType === 'CLEANING'">
            <el-form-item label="护理时间" prop="recordTime">
              <el-time-picker v-model="recordForm.recordTime" format="HH:mm" style="width: 100%" />
            </el-form-item>
            <el-form-item label="护理项目" prop="cleaningItems">
              <el-checkbox-group v-model="recordForm.cleaningItems">
                <el-checkbox label="口腔护理">口腔护理</el-checkbox>
                <el-checkbox label="床上擦浴">床上擦浴</el-checkbox>
                <el-checkbox label="理发剃须">理发剃须</el-checkbox>
                <el-checkbox label="修剪指甲">修剪指甲</el-checkbox>
                <el-checkbox label="更换床单位">更换床单位</el-checkbox>
                <el-checkbox label="翻身拍背">翻身拍背</el-checkbox>
              </el-checkbox-group>
            </el-form-item>
          </template>

          <!-- 文娱活动 -->
          <template v-if="recordForm.scheduleType === 'PLAY'">
            <el-form-item label="互动时间" prop="recordTime">
              <el-time-picker v-model="recordForm.recordTime" format="HH:mm" style="width: 100%" />
            </el-form-item>
            <el-form-item label="互动时长" prop="playDuration">
              <el-input-number v-model="recordForm.playDuration" :min="5" :max="120" style="width: 100%">
                <template #append>分钟</template>
              </el-input-number>
            </el-form-item>
            <el-form-item label="互动内容" prop="playContent">
              <el-input v-model="recordForm.playContent" type="textarea" placeholder="如：下棋、读报、听音乐、聊天、散步等" />
            </el-form-item>
          </template>
        </template>

        <!-- 收费服务 -->
        <template v-if="recordForm.serviceType === 'CHARGE'">
          <el-form-item label="收费项目" prop="chargeItem">
            <el-select v-model="recordForm.chargeItem" placeholder="请选择收费项目" style="width: 100%" @change="onChargeItemChange">
              <el-option-group label="增值服务">
                <el-option label="活动陪护" value="walk" :price="15" />
                <el-option label="营养加餐" value="can_food" :price="12" />
                <el-option label="互动陪伴" value="play" :price="25" />
              </el-option-group>
              <el-option-group label="照护服务">
                <el-option label="基础照护" value="bath_basic" :price="50" />
                <el-option label="专项护理" value="bath_premium" :price="80" />
                <el-option label="康复训练" value="grooming" :price="120" />
              </el-option-group>
              <el-option-group label="医疗护理">
                <el-option label="常用药品" value="deworming" :price="30" />
                <el-option label="紧急医疗处理" value="emergency" :price="50" />
                <el-option label="伤口处理" value="wound" :price="40" />
              </el-option-group>
              <el-option-group label="其他">
                <el-option label="物品损坏赔偿" value="damage" :price="100" />
                <el-option label="特殊护理" value="special_care" :price="60" />
              </el-option-group>
            </el-select>
          </el-form-item>

          <el-form-item label="服务时间" prop="serviceTime">
            <el-date-picker
              v-model="recordForm.serviceTime"
              type="datetime"
              format="YYYY-MM-DD HH:mm"
              placeholder="选择服务时间"
              style="width: 100%"
            />
          </el-form-item>

          <el-form-item label="数量" prop="chargeQuantity">
            <el-input-number v-model="recordForm.chargeQuantity" :min="1" :max="99" style="width: 100%" @change="calculateChargeAmount" />
          </el-form-item>

          <el-form-item label="单价" prop="chargeUnitPrice">
            <el-input-number v-model="recordForm.chargeUnitPrice" :min="0" :precision="2" style="width: 100%">
              <template #append>元</template>
            </el-input-number>
          </el-form-item>

          <el-form-item label="金额合计">
            <div class="charge-total">
              <span class="amount">¥{{ (recordForm.chargeUnitPrice * recordForm.chargeQuantity).toFixed(2) }}</span>
            </div>
          </el-form-item>

          <el-form-item label="计费说明" prop="chargeRemark">
            <el-input v-model="recordForm.chargeRemark" type="textarea" placeholder="请输入计费说明（可选）" />
          </el-form-item>
        </template>

        <el-divider />

        <el-form-item label="备注" prop="remarks">
          <el-input v-model="recordForm.remarks" type="textarea" placeholder="请输入备注" />
        </el-form-item>

        <el-form-item label="照片/视频" prop="mediaUrls">
          <image-upload v-model="recordForm.mediaUrls" :limit="5" />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button type="primary" @click="submitRecord" round>确 定</el-button>
          <el-button @click="recordOpen = false" round>取 消</el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 发送消息对话框 -->
    <el-dialog title="发送消息给家属" v-model="messageOpen" width="500px" append-to-body>
      <el-form ref="messageFormRef" :model="messageForm" :rules="messageRules" label-width="100px">
        <el-form-item label="消息类型" prop="messageType">
          <el-radio-group v-model="messageForm.messageType">
            <el-radio label="TEXT">文字消息</el-radio>
            <el-radio label="PHOTO">照片</el-radio>
            <el-radio label="VIDEO">视频</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="消息内容" prop="content" v-if="messageForm.messageType === 'TEXT'">
          <el-input v-model="messageForm.content" type="textarea" placeholder="请输入消息内容" />
        </el-form-item>
        <el-form-item label="上传文件" prop="mediaUrls" v-if="messageForm.messageType !== 'TEXT'">
          <image-upload v-model="messageForm.mediaUrls" :limit="5" />
        </el-form-item>
        <el-form-item label="使用模板">
          <el-select v-model="messageForm.template" placeholder="选择消息模板" clearable style="width: 100%">
            <el-option label="今日状态良好" value="今天{{residentName}}状态很好，进食、睡眠均正常，请放心！" />
            <el-option label="活动完成" value="{{residentName}}刚刚完成活动/康复锻炼，身体状况良好，精神不错！" />
            <el-option label="进餐完成" value="{{residentName}}刚刚吃完{{diet}}，食欲很好！" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button type="primary" @click="submitMessage" round>发 送</el-button>
          <el-button @click="messageOpen = false" round>取 消</el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 长者详情对话框 -->
    <el-dialog title="康养详情" v-model="detailOpen" width="800px" append-to-body>
      <el-tabs v-model="activeTab">
        <el-tab-pane label="基本信息" name="basic">
          <el-descriptions :column="2" border>
            <el-descriptions-item label="长者姓名">{{ currentResident.residentName }}</el-descriptions-item>
            <el-descriptions-item label="照护等级">{{ currentResident.careLevel || '未评估' }}</el-descriptions-item>
            <el-descriptions-item label="入住日期">{{ currentResident.checkinDate }}</el-descriptions-item>
            <el-descriptions-item label="已住天数">{{ currentResident.days }}天</el-descriptions-item>
            <el-descriptions-item label="房间床位">{{ currentResident.roomName || '未分配' }}{{ currentResident.bedNo ? ' · ' + currentResident.bedNo + '床' : '' }}</el-descriptions-item>
            <el-descriptions-item label="预计退住">{{ currentResident.estimatedCheckout }}</el-descriptions-item>
            <el-descriptions-item label="家属姓名">{{ currentResident.contactName }}</el-descriptions-item>
            <el-descriptions-item label="联系电话">{{ currentResident.contactPhone }}</el-descriptions-item>
          </el-descriptions>
          <!-- 照护与膳食概览 -->
          <el-card shadow="never" class="mt15" v-if="currentResident.dietType || currentResident.selfCareAbility || currentResident.allergies">
            <template #header>
              <span style="font-weight:600;">照护与膳食概览</span>
            </template>
            <div class="feeding-plan">
              <div class="feeding-info-row">
                <div class="feeding-stat">
                  <div class="feeding-stat-value">{{ currentResident.dietType || '-' }}</div>
                  <div class="feeding-stat-label">膳食类型</div>
                </div>
                <div class="feeding-stat">
                  <div class="feeding-stat-value">{{ selfCareLabel(currentResident.selfCareAbility) }}</div>
                  <div class="feeding-stat-label">自理能力</div>
                </div>
                <div class="feeding-stat">
                  <div class="feeding-stat-value">{{ currentResident.todayCareRecords ?? 0 }}</div>
                  <div class="feeding-stat-label">今日护理(次)</div>
                </div>
                <div class="feeding-stat">
                  <el-tag :type="fallRiskType(currentResident.fallRisk)" size="small">
                    {{ fallRiskLabel(currentResident.fallRisk) }}
                  </el-tag>
                  <div class="feeding-stat-label">跌倒风险</div>
                </div>
              </div>
              <div v-if="currentResident.allergies" class="allergy-alert">
                <el-alert :title="'过敏史: ' + currentResident.allergies" type="error" :closable="false" show-icon />
              </div>
            </div>
          </el-card>
        </el-tab-pane>
        <el-tab-pane label="日常记录" name="records">
          <el-timeline>
            <el-timeline-item
              v-for="(record, index) in residentRecords"
              :key="index"
              :type="record.type"
              :timestamp="record.time"
            >
              <div>{{ record.content }}</div>
              <div v-if="record.images" class="record-images">
                <el-image 
                  v-for="(img, idx) in record.images" 
                  :key="idx" 
                  :src="img" 
                  style="width: 80px; height: 80px; margin-right: 8px;"
                  fit="cover"
                />
              </div>
            </el-timeline-item>
          </el-timeline>
        </el-tab-pane>
        <el-tab-pane label="健康档案" name="health">
          <!-- 风险等级展示 -->
          <div class="health-risk-banner" v-if="currentResident.healthRiskLevel">
            <el-alert 
              v-if="currentResident.healthRiskLevel === 'ALERT'"
              title="健康风险: 高" 
              :description="currentResident.riskReasons || '存在健康风险指标'" 
              type="error" 
              :closable="false" 
              show-icon 
            />
            <el-alert 
              v-else-if="currentResident.healthRiskLevel === 'WATCH'"
              title="健康风险: 需关注" 
              :description="currentResident.riskReasons || '部分指标需要关注'" 
              type="warning" 
              :closable="false" 
              show-icon 
            />
            <el-alert 
              v-else
              title="健康状态: 良好" 
              description="各项健康指标正常" 
              type="success" 
              :closable="false" 
              show-icon 
            />
          </div>

          <!-- 健康基础信息 -->
          <el-descriptions :column="2" border class="mt15" title="基础健康信息">
            <el-descriptions-item label="性别">{{ genderLabel(currentResident.gender) }}</el-descriptions-item>
            <el-descriptions-item label="出生日期">
              {{ currentResident.birthDate || '-' }}
              <span v-if="currentResident.birthDate" style="color:#909399;margin-left:8px;">
                ({{ calculateAge(currentResident.birthDate) }})
              </span>
            </el-descriptions-item>
            <el-descriptions-item label="身份证号">{{ currentResident.idCard || '-' }}</el-descriptions-item>
            <el-descriptions-item label="长者编号">{{ currentResident.residentNo || '-' }}</el-descriptions-item>
            <el-descriptions-item label="照护等级">{{ currentResident.careLevel || '未评估' }}</el-descriptions-item>
            <el-descriptions-item label="膳食类型">{{ currentResident.dietType || '-' }}</el-descriptions-item>
            <el-descriptions-item label="过敏史" :span="2">
              <span v-if="currentResident.allergies" style="color:#f56c6c;font-weight:600;">{{ currentResident.allergies }}</span>
              <span v-else style="color:#909399;">无</span>
            </el-descriptions-item>
            <el-descriptions-item label="慢性病史" :span="2">
              <span v-if="currentResident.chronicDiseases" style="color:#e6a23c;font-weight:600;">{{ currentResident.chronicDiseases }}</span>
              <span v-else style="color:#909399;">无</span>
            </el-descriptions-item>
            <el-descriptions-item label="正在用药" :span="2">
              <span v-if="currentResident.medications" style="color:#7b2ff7;font-weight:600;">{{ currentResident.medications }}</span>
              <span v-else style="color:#909399;">无</span>
            </el-descriptions-item>
            <el-descriptions-item label="特殊需求" :span="2">
              <span v-if="currentResident.specialNeeds">{{ currentResident.specialNeeds }}</span>
              <span v-else style="color:#909399;">无</span>
            </el-descriptions-item>
          </el-descriptions>

          <!-- 能力与风险评估 -->
          <div class="behavior-section mt15">
            <h4 style="margin-bottom:12px;">能力与风险评估</h4>
            <el-row :gutter="12">
              <el-col :span="6">
                <div class="behavior-card">
                  <div class="behavior-label">认知状态</div>
                  <div class="behavior-value" :class="getCognitionClass(currentResident.cognition)">
                    {{ cognitionLabel(currentResident.cognition) }}
                  </div>
                </div>
              </el-col>
              <el-col :span="6">
                <div class="behavior-card">
                  <div class="behavior-label">跌倒风险</div>
                  <div class="behavior-value" :class="getFallRiskClass(currentResident.fallRisk)">
                    {{ fallRiskLabel(currentResident.fallRisk) }}
                  </div>
                </div>
              </el-col>
              <el-col :span="6">
                <div class="behavior-card">
                  <div class="behavior-label">自理能力</div>
                  <div class="behavior-value" :class="getSelfCareClass(currentResident.selfCareAbility)">
                    {{ selfCareLabel(currentResident.selfCareAbility) }}
                  </div>
                </div>
              </el-col>
              <el-col :span="6">
                <div class="behavior-card">
                  <div class="behavior-label">压疮风险</div>
                  <div class="behavior-value" :class="getPressureSoreClass(currentResident.pressureSore)">
                    {{ pressureSoreLabel(currentResident.pressureSore) }}
                  </div>
                </div>
              </el-col>
            </el-row>
          </div>

          <!-- 健康监测（可更新） -->
          <el-card shadow="never" class="mt15">
            <template #header>
              <div style="display:flex;justify-content:space-between;align-items:center;">
                <span style="font-weight:600;">健康监测</span>
                <el-button type="primary" size="small" @click="showHealthUpdateDialog" round>更新健康数据</el-button>
              </div>
            </template>
            <el-descriptions :column="2" border>
              <el-descriptions-item label="体温">
                <span v-if="currentResident.temperature" :style="{ color: getTemperatureColor(currentResident.temperature), fontWeight: 'bold' }">
                  {{ currentResident.temperature }} °C
                </span>
                <span v-else style="color:#909399;">未记录</span>
              </el-descriptions-item>
              <el-descriptions-item label="脉搏">
                <span v-if="currentResident.pulse">{{ currentResident.pulse }} 次/分</span>
                <span v-else style="color:#909399;">未记录</span>
              </el-descriptions-item>
              <el-descriptions-item label="血压">
                <span v-if="currentResident.bloodPressureHigh || currentResident.bloodPressureLow">{{ currentResident.bloodPressureHigh || '-' }}/{{ currentResident.bloodPressureLow || '-' }} mmHg</span>
                <span v-else style="color:#909399;">未记录</span>
              </el-descriptions-item>
              <el-descriptions-item label="血氧">
                <span v-if="currentResident.bloodOxygen">{{ currentResident.bloodOxygen }} %</span>
                <span v-else style="color:#909399;">未记录</span>
              </el-descriptions-item>
              <el-descriptions-item label="意识状态">
                <el-tag :type="currentResident.consciousness === 'CLEAR' || !currentResident.consciousness ? 'success' : 'warning'" size="small">
                  {{ consciousnessLabel(currentResident.consciousness) }}
                </el-tag>
              </el-descriptions-item>
              <el-descriptions-item label="精神状态">
                <el-tag :type="getStatusType(currentResident.mentalState)" size="small">{{ getStatusLabel(currentResident.mentalState) }}</el-tag>
              </el-descriptions-item>
            </el-descriptions>
          </el-card>
        </el-tab-pane>

        <el-tab-pane label="物品交接" name="items">
          <!-- 入住物品区 -->
          <h4 style="margin-bottom:12px;">入住携带物品</h4>
          <el-descriptions :column="1" border v-if="currentResident.broughtItems">
            <el-descriptions-item label="带入物品">{{ currentResident.broughtItems }}</el-descriptions-item>
          </el-descriptions>
          <el-empty v-else description="无带入物品记录" :image-size="40" />
          
          <!-- 入住照片 -->
          <div class="items-photos mt15" v-if="currentResident.broughtPhotos || currentResident.checkinPhotos">
            <h4 style="margin-bottom:12px;">入住时照片</h4>
            <div class="photo-gallery">
              <el-image 
                v-for="(img, idx) in parsePhotos(currentResident.broughtPhotos || currentResident.checkinPhotos)" 
                :key="'brought-' + idx"
                :src="img" 
                :preview-src-list="parsePhotos(currentResident.broughtPhotos || currentResident.checkinPhotos)"
                :initial-index="idx"
                style="width:100px;height:100px;margin-right:8px;margin-bottom:8px;border-radius:6px;"
                fit="cover"
              />
            </div>
          </div>

          <el-divider />

          <!-- 退住核对区 -->
          <h4 style="margin-bottom:12px;">退住核对</h4>
          <el-form :model="itemsCheckForm" label-width="100px">
            <el-form-item label="归还物品">
              <el-input v-model="itemsCheckForm.returnedItems" type="textarea" :rows="2" placeholder="请列出归还的物品" />
              <div v-if="currentResident.broughtItems" style="color:#909399;font-size:12px;margin-top:4px;">
                参照入住物品: {{ currentResident.broughtItems }}
              </div>
            </el-form-item>
            <el-form-item label="物品状态">
              <el-radio-group v-model="itemsCheckForm.itemsStatus">
                <el-radio :label="0">完好</el-radio>
                <el-radio :label="1">有损耗</el-radio>
                <el-radio :label="2">有损坏</el-radio>
              </el-radio-group>
            </el-form-item>
            <el-form-item label="物品备注" v-if="itemsCheckForm.itemsStatus > 0">
              <el-input v-model="itemsCheckForm.itemsRemark" type="textarea" placeholder="请说明损耗/损坏情况" />
            </el-form-item>
            <el-form-item label="交接确认">
              <el-switch v-model="itemsCheckForm.itemsConfirmed" :active-value="1" :inactive-value="0" active-text="已与家属核对确认" />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="submitItemsCheck" round>保存交接信息</el-button>
            </el-form-item>
          </el-form>

          <!-- 入住 vs 当前照片对比 -->
          <div class="photo-compare mt15" v-if="currentResident.checkinPhotos && currentResident.checkoutPhotos">
            <h4 style="margin-bottom:12px;">入住 vs 退住照片对比</h4>
            <el-row :gutter="20">
              <el-col :span="12">
                <div class="compare-section">
                  <div class="compare-title">入住时</div>
                  <div class="photo-gallery">
                    <el-image 
                      v-for="(img, idx) in parsePhotos(currentResident.checkinPhotos)" 
                      :key="'checkin-' + idx"
                      :src="img"
                      :preview-src-list="parsePhotos(currentResident.checkinPhotos)"
                      :initial-index="idx"
                      style="width:80px;height:80px;margin:4px;border-radius:4px;"
                      fit="cover"
                    />
                  </div>
                </div>
              </el-col>
              <el-col :span="12">
                <div class="compare-section">
                  <div class="compare-title">退住时</div>
                  <div class="photo-gallery">
                    <el-image 
                      v-for="(img, idx) in parsePhotos(currentResident.checkoutPhotos)" 
                      :key="'checkout-' + idx"
                      :src="img"
                      :preview-src-list="parsePhotos(currentResident.checkoutPhotos)"
                      :initial-index="idx"
                      style="width:80px;height:80px;margin:4px;border-radius:4px;"
                      fit="cover"
                    />
                  </div>
                </div>
              </el-col>
            </el-row>
          </div>
        </el-tab-pane>
      </el-tabs>
      <template #footer>
        <el-button type="danger" @click="handleMarkAbnormal" v-if="currentResident.mentalState !== 'POOR'" round>标记异常</el-button>
        <el-button type="success" @click="handleResolveAbnormal" v-if="currentResident.mentalState === 'POOR'" round>解除异常</el-button>
        <el-button type="warning" @click="handleTransferMedical" v-if="currentResident.mentalState !== 'POOR'" round>转至医疗隔离</el-button>
        <el-button @click="detailOpen = false" round>关 闭</el-button>
      </template>
    </el-dialog>

    <!-- 编辑日程对话框 -->
    <el-dialog 
      :title="editingSchedule ? '编辑日程' : '添加日程'" 
      v-model="scheduleDialogOpen" 
      width="900px" 
      append-to-body
    >
      <el-form ref="scheduleFormRef" :model="scheduleForm" label-width="100px">
        <el-form-item label="安排类型" prop="kind">
          <el-radio-group v-model="scheduleForm.kind" @change="onScheduleKindChange">
            <el-radio :label="0">通用日程</el-radio>
            <el-radio :label="1">特定日程</el-radio>
          </el-radio-group>
          <div style="color: #909399; font-size: 12px; margin-top: 5px">
            通用日程适用于所有周，特定日程仅适用于当前选择的日期
          </div>
        </el-form-item>
        
        <el-form-item label="安排日期" prop="arrangementDate" v-if="scheduleForm.kind === 1">
          <el-date-picker 
            v-model="scheduleForm.arrangementDate" 
            type="date" 
            format="YYYY-MM-DD" 
            value-format="YYYY-MM-DD"
            placeholder="选择日期" 
            style="width: 100%" 
            @change="onScheduleDateChange"
          />
        </el-form-item>
        
        <el-form-item label="星期" prop="week" v-if="scheduleForm.kind === 0">
          <el-select v-model="scheduleForm.week" placeholder="请选择星期" style="width: 100%" @change="onScheduleWeekChange">
            <el-option label="周一" :value="1" />
            <el-option label="周二" :value="2" />
            <el-option label="周三" :value="3" />
            <el-option label="周四" :value="4" />
            <el-option label="周五" :value="5" />
            <el-option label="周六" :value="6" />
            <el-option label="周日" :value="7" />
          </el-select>
        </el-form-item>
        
        <!-- 已排日程列表 -->
        <el-form-item label="已排日程" v-if="scheduleForm.week || (scheduleForm.kind === 1 && scheduleForm.arrangementDate)">
          <div class="existing-schedules">
            <el-empty v-if="existingSchedules.length === 0" description="暂无日程安排" :image-size="60" />
            <div v-else class="schedule-list">
              <div 
                v-for="(item, index) in existingSchedules" 
                :key="item.id || index"
                class="schedule-item-card"
                :class="{ 'editing': editingSchedule && editingSchedule.id === item.id }"
              >
                <div class="schedule-time">{{ item.arrangementTime }}</div>
                <div class="schedule-content">{{ item.content }}</div>
              
                <div class="schedule-actions">
                  <el-button 
                    type="primary" 
                    link 
                    size="small" 
                    @click="handleEditExistingSchedule(item)"
                  >
                    <el-icon><Edit /></el-icon>编辑
                  </el-button>
                  <el-button 
                    type="danger" 
                    link 
                    size="small" 
                    @click="handleDeleteExistingSchedule(item)"
                  >
                    <el-icon><Delete /></el-icon>删除
                  </el-button>
                </div>
              </div>
            </div>
          </div>
        </el-form-item>
        
        <el-divider v-if="scheduleForm.week || (scheduleForm.kind === 1 && scheduleForm.arrangementDate)" />
        
        <el-form-item label="安排时间" prop="arrangementTime">
          <el-time-picker 
            v-model="scheduleForm.arrangementTime" 
            format="HH:mm" 
            :picker-options="{
              start: '05:00',
              step: '00:30',
              end: '23:30'
            }"
            value-format="HH:mm"
            placeholder="选择时间" 
            style="width: 100%" 
          />
        </el-form-item>
        
        <el-form-item label="安排内容" prop="content">
          <el-input 
            v-model="scheduleForm.content" 
            type="textarea" 
            :rows="3" 
            placeholder="请输入日程内容，如：晨间护理、测量体温、协助进餐" 
          />
        </el-form-item>
        
        <el-form-item label="备注" prop="remark">
          <el-input 
            v-model="scheduleForm.remark" 
            type="textarea" 
            :rows="2" 
            placeholder="请输入备注（可选）" 
          />
        </el-form-item>
        
        <el-form-item label="状态" prop="status">
          <el-radio-group v-model="scheduleForm.status">
            <el-radio :label="0">未执行</el-radio>
            <el-radio :label="1">已执行</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      
      <template #footer>
        <div class="dialog-footer">
          <el-button type="primary" @click="submitScheduleForm" round>确 定</el-button>
          <el-button @click="scheduleDialogOpen = false" round>取 消</el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 更新健康数据对话框 -->
    <el-dialog title="更新健康数据" v-model="healthDialogOpen" width="500px" append-to-body>
      <el-form :model="healthForm" label-width="100px">
        <el-form-item label="体温(°C)">
          <el-input-number v-model="healthForm.temperature" :min="34" :max="42" :precision="1" :step="0.1" style="width:100%" />
        </el-form-item>
        <el-form-item label="精神状态">
          <el-radio-group v-model="healthForm.mentalState">
            <el-radio label="GOOD">良好</el-radio>
            <el-radio label="NORMAL">一般</el-radio>
            <el-radio label="POOR">差</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="脉搏(次/分)">
          <el-input-number v-model="healthForm.pulse" :min="30" :max="160" :step="1" style="width:100%" />
        </el-form-item>
        <el-form-item label="血压(mmHg)">
          <div style="display:flex;gap:8px;align-items:center;width:100%">
            <el-input-number v-model="healthForm.bloodPressureHigh" :min="60" :max="260" :step="1" style="flex:1" controls-position="right" />
            <span>/</span>
            <el-input-number v-model="healthForm.bloodPressureLow" :min="30" :max="180" :step="1" style="flex:1" controls-position="right" />
          </div>
        </el-form-item>
        <el-form-item label="血氧(%)">
          <el-input-number v-model="healthForm.bloodOxygen" :min="70" :max="100" :step="1" style="width:100%" />
        </el-form-item>
        <el-form-item label="意识状态">
          <el-radio-group v-model="healthForm.consciousness">
            <el-radio label="CLEAR">清醒</el-radio>
            <el-radio label="DROWSY">嗜睡</el-radio>
            <el-radio label="UNCLEAR">模糊</el-radio>
            <el-radio label="COMA">昏迷</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button type="primary" @click="submitHealthUpdate" round>保存</el-button>
        <el-button @click="healthDialogOpen = false" round>取消</el-button>
      </template>
    </el-dialog>

    <!-- 视频直播对话框 -->
    <el-dialog title="视频直播" v-model="videoDialogOpen" width="900px" append-to-body destroy-on-close @closed="handleVideoDialogClosed">
      <div class="video-container" v-if="videoDialogOpen && currentVideoResident.cameraDeviceId">
        <div class="video-info">
          <span>{{ currentVideoResident.residentName }} - {{ currentVideoResident.roomName }}{{ currentVideoResident.bedNo ? ' · ' + currentVideoResident.bedNo + '床' : '' }}</span>
        </div>
        <Player
          :camera-url="`ezopen://open.ys7.com/${currentVideoResident.cameraDeviceId}/1.hd.live`"
          :access-token="videoAccessToken"
          container-id="boarding-video-player"
          style="height:500px;"
        />
      </div>
      <el-empty v-else description="该房间暂无摄像头" />
      <template #footer>
        <el-button @click="videoDialogOpen = false" round>关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup name="ResidentBoarding">
import { ref, reactive, onMounted, onUnmounted, computed, nextTick } from 'vue'
import { getBoardingList, getBoardingDetail, getDailyRecords, addDailyRecord, sendMessageToOwner, markAbnormal, resolveAbnormal, transferToMedical, updateHealthData, updateItemsCheck } from '@/api/care/boarding'
import { getWeekSchedule, getDaySchedule, getGeneralScheduleByWeek,getDayScheduleByDate, updateDailyArrangement, addDailyArrangement,deleteDailyArrangement } from '@/api/care/dailyArrangement'
import { VideoCamera } from '@element-plus/icons-vue'
import Player from '@/components/YsPlayer/Player.vue'

const { proxy } = getCurrentInstance()

const boardingList = ref([])
const loading = ref(true)
const total = ref(0)
const recordOpen = ref(false)
const messageOpen = ref(false)
const detailOpen = ref(false)
const activeTab = ref('basic')
const currentResident = ref({})
const currentTime = ref('')
const residentRecords = ref([])

// 查询参数
const queryParams = reactive({
  pageNum: 1,
  pageSize: 100,
  residentName: undefined,
  contactPhone: undefined,
  roomName: undefined,
  status: undefined
})

// 一周日程管理
const selectedDayIndex = ref(0)
const weekDays = ref([])
const weekScheduleData = ref({}) // 存储一周的日程数据 {1: [], 2: [], ..., 7: []}
const currentDaySchedule = ref([]) // 当前选中日期的日程
const scheduleDialogOpen = ref(false) // 编辑日程对话框
const editingSchedule = ref(null) // 正在编辑的日程
const existingSchedules = ref([]) // 已排日程列表
const scheduleForm = ref({
  id: null,
  kind: 0,
  week: 1,
  arrangementDate: '',
  arrangementTime: '',
  content: '',
  remark: '',
  status: 0
})

// 生成一周日期数据
function generateWeekDays() {
  const days = []
  const today = new Date()
  const weekNames = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
  
  for (let i = 0; i < 7; i++) {
    const date = new Date(today)
    date.setDate(today.getDate() - today.getDay() + i)
    
    const isToday = i === today.getDay()
    // week值：1=周一, 2=周二, ..., 7=周日
    const weekValue = i === 0 ? 7 : i
    days.push({
      name: weekNames[i],
      date: `${date.getMonth() + 1}/${date.getDate()}`,
      fullDate: date.toISOString().split('T')[0],
      isToday: isToday,
      weekValue: weekValue,
      taskCount: 0 // 将从API获取
    })
  }
  
  weekDays.value = days
  // 默认选中今天
  selectedDayIndex.value = today.getDay()
}

// 加载一周日程数据
async function loadWeekSchedule() {
  try {
    const res = await getWeekSchedule()
    if (res.data && res.data.length > 0) {
      // 按week分组存储
      const scheduleMap = {}
      res.data.forEach(item => {
        if (!scheduleMap[item.week]) {
          scheduleMap[item.week] = []
        }
        scheduleMap[item.week].push(item)
      })
      weekScheduleData.value = scheduleMap
      
      // 更新每一天的任务数量
      weekDays.value.forEach(day => {
        day.taskCount = (scheduleMap[day.weekValue] || []).length
      })
      
      // 加载当前选中日期的日程
      loadCurrentDaySchedule()
    }
  } catch (error) {
    console.error('加载日程失败:', error)
    // 如果API失败，使用模拟数据
    useMockScheduleData()
  }
}

// 使用模拟数据（备用）
function useMockScheduleData() {
  const mockSchedule = {
    1: [ // 周一
      { id: 1, week: 1, arrangementTime: '07:30', content: '晨间护理、整理床单位、协助进餐', type: 'primary', typeLabel: '生活照料', color: '#409eff', tagType: 'primary' },
      { id: 2, week: 1, arrangementTime: '09:00', content: '组织户外活动/康复锻炼', type: 'success', typeLabel: '活动', color: '#67c23a', tagType: 'success' }
    ],
    2: [ // 周二
      { id: 3, week: 2, arrangementTime: '07:30', content: '晨间护理、整理床单位、协助进餐', type: 'primary', typeLabel: '生活照料', color: '#409eff', tagType: 'primary' }
    ]
  }
  weekScheduleData.value = mockSchedule
  weekDays.value.forEach(day => {
    day.taskCount = (mockSchedule[day.weekValue] || []).length
  })
  loadCurrentDaySchedule()
}

// 加载当前选中日期的日程
function loadCurrentDaySchedule() {
  const selectedDay = weekDays.value[selectedDayIndex.value]
  if (!selectedDay) return
  
  const weekValue = selectedDay.weekValue
  const scheduleList = weekScheduleData.value[weekValue] || []
  
  // 转换为前端显示格式
  const now = new Date()
  const currentHour = now.getHours()
  const currentMinute = now.getMinutes()
  const currentTimeVal = currentHour * 60 + currentMinute
  
  currentDaySchedule.value = scheduleList.map(item => {
    const [hour, minute] = item.arrangementTime.split(':').map(Number)
    const itemTimeVal = hour * 60 + minute
    
    // 判断是否已完成
    const completed = item.status === 1 || (selectedDay.isToday && itemTimeVal < currentTimeVal)
    // 判断是否当前进行中的任务（前后30分钟内）
    const isCurrent = selectedDay.isToday && Math.abs(itemTimeVal - currentTimeVal) <= 30
    
    // 根据内容判断类型
    let typeLabel = '日程安排'
    let color = '#409eff'
    let tagType = 'primary'
    
    if (item.content.includes('清洁') || item.content.includes('照料')) {
      typeLabel = '生活照料'
      color = '#409eff'
      tagType = 'primary'
    } else if (item.content.includes('散步') || item.content.includes('活动')) {
      typeLabel = '活动'
      color = '#67c23a'
      tagType = 'success'
    } else if (item.content.includes('休息') || item.content.includes('午休')) {
      typeLabel = '休息时间'
      color = '#909399'
      tagType = 'info'
    } else if (item.content.includes('用餐') || item.content.includes('晚餐')) {
      typeLabel = '进餐'
      color = '#67c23a'
      tagType = 'success'
    } else if (item.content.includes('睡前') || item.content.includes('巡视')) {
      typeLabel = '夜间护理'
      color = '#e6a23c'
      tagType = 'warning'
    }
    
    return {
      id: item.id,
      time: item.arrangementTime,
      content: item.content,
      remark: item.remark,
      type: typeLabel,
      typeLabel: typeLabel,
      color: color,
      tagType: tagType,
      completed: completed,
      isCurrent: isCurrent,
      status: item.status,
      rawData: item
    }
  })
}

// 选择某一天
async function selectDay(index) {
  selectedDayIndex.value = index
  
  // 如果该天的日程还没有加载，尝试加载
  const selectedDay = weekDays.value[index]
  if (selectedDay && !weekScheduleData.value[selectedDay.weekValue]) {
    try {
      // 使用完整日期调用 API
      const res = await getDaySchedule(selectedDay.fullDate)
      if (res.data && res.data.length > 0) {
        weekScheduleData.value[selectedDay.weekValue] = res.data
        selectedDay.taskCount = res.data.length
      }
    } catch (error) {
      console.error('加载日程失败:', error)
    }
  }
  
  loadCurrentDaySchedule()
}

// 编辑日程
function handleEditSchedule() {
  scheduleDialogOpen.value = true
  resetScheduleForm()
}

// 重置日程表单
function resetScheduleForm() {
  const selectedDay = weekDays.value[selectedDayIndex.value]
  scheduleForm.value = {
    id: null,
    kind: 0,
    week: selectedDay ? selectedDay.weekValue : 1,
    arrangementDate: selectedDay ? selectedDay.fullDate : '',
    arrangementTime: '',
    content: '',
    remark: '',
    status: 0
  }
  editingSchedule.value = null
  existingSchedules.value = []

  loadExistingSchedules();
}

// 加载已排日程
async function loadExistingSchedules() {
  try {
    let res
    if (scheduleForm.value.kind === 1 && scheduleForm.value.arrangementDate) {
      // 特定日程：根据日期查询（优先特定，否则通用）
      res = await getDayScheduleByDate(scheduleForm.value.arrangementDate)
    } else if (scheduleForm.value.kind === 0 && scheduleForm.value.week) {
      // 通用日程：从后端获取 kind=0 且 week=指定值的通用日程
      res = await getGeneralScheduleByWeek(scheduleForm.value.week)
    }
    
    if (res && res.data) {
      existingSchedules.value = res.data
    } else {
      existingSchedules.value = []
    }
  } catch (error) {
    console.error('加载已排日程失败:', error)
    existingSchedules.value = []
  }
}

// 安排类型改变
function onScheduleKindChange() {
  const selectedDay = weekDays.value[selectedDayIndex.value]
  if (scheduleForm.value.kind === 1) {
    // 切换到特定日程，设置当前选中的日期
    scheduleForm.value.arrangementDate = selectedDay ? selectedDay.fullDate : ''
    scheduleForm.value.week = undefined
  } else {
    // 切换到通用日程，设置当前选中的星期
    scheduleForm.value.week = selectedDay ? selectedDay.weekValue : 1
    scheduleForm.value.arrangementDate = ''
  }
  existingSchedules.value = []
  loadExistingSchedules()
}

// 日期改变
function onScheduleDateChange() {
  loadExistingSchedules()
}

// 星期改变
function onScheduleWeekChange() {
  loadExistingSchedules()
}

// 编辑已有日程
function handleEditExistingSchedule(item) {
  editingSchedule.value = {
    id: item.id,
    rawData: item
  }
  scheduleForm.value = {
    id: item.id,
    kind: item.kind || 0,
    week: item.week,
    arrangementDate: item.arrangementDate || '',
    arrangementTime: item.arrangementTime,
    content: item.content,
    remark: item.remark || '',
    status: item.status || 0
  }
}
function handleDeleteExistingSchedule(item) {
  proxy.$modal.confirm('确认删除该日程吗？').then(async () => {
    const res = await deleteDailyArrangement(item.id)
    if (res.code === 0) {
      proxy.$modal.msgSuccess('删除成功')
      await loadExistingSchedules()
    }
  }).catch(() => {})
}
// 编辑单条日程
function handleEditScheduleItem(scheduleItem) {
  editingSchedule.value = scheduleItem
  scheduleForm.value = {
    id: scheduleItem.rawData.id,
    kind: scheduleItem.rawData.kind || 0,
    week: scheduleItem.rawData.week,
    arrangementDate: scheduleItem.rawData.arrangementDate || '',
    arrangementTime: scheduleItem.rawData.arrangementTime,
    content: scheduleItem.rawData.content,
    remark: scheduleItem.rawData.remark || '',
    status: scheduleItem.rawData.status || 0
  }
  scheduleDialogOpen.value = true
}

// 删除日程
async function handleDeleteScheduleItem(scheduleItem) {
  try {
    await proxy.$modal.confirm('确认删除该日程安排吗？')
    const res = await deleteDailyArrangement(scheduleItem.rawData.id)
    if (res.code === 0) {
      proxy.$modal.msgSuccess('删除成功')
      await loadWeekSchedule()
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除失败:', error)
    }
  }
}

// 提交日程表单
async function submitScheduleForm() {
  try {
    // 根据安排类型构建提交数据
    const submitData = {
      id: scheduleForm.value.id,
      kind: scheduleForm.value.kind,
      arrangementTime: scheduleForm.value.arrangementTime,
      content: scheduleForm.value.content,
      remark: scheduleForm.value.remark,
      status: scheduleForm.value.status
    }
    
    // 如果是特定日程，传入 arrangementDate
    if (scheduleForm.value.kind === 1) {
      if (!scheduleForm.value.arrangementDate) {
        proxy.$modal.msgError('请选择安排日期')
        return
      }
      submitData.arrangementDate = scheduleForm.value.arrangementDate
    } else {
      // 如果是通用日程，传入 week
      submitData.week = scheduleForm.value.week
    }
    
    let res
    if (scheduleForm.value.id) {
      // 更新
      res = await updateDailyArrangement(submitData)
    } else {
      // 新增
      res = await addDailyArrangement(submitData)
    }
    
    if (res.code === 0) {
      proxy.$modal.msgSuccess(scheduleForm.value.id ? '更新成功' : '添加成功')
      // scheduleDialogOpen.value = false
     loadExistingSchedules();
      // await loadWeekSchedule()
    }
  } catch (error) {
    console.error('保存失败:', error)
    proxy.$modal.msgError('保存失败')
  }
}

// 日程类型卡片数据
const scheduleTypes = [
  { value: 'FEEDING', label: '进餐', icon: 'Food', color: '#e6a23c', desc: '记录进食情况' },
  { value: 'WALK', label: '活动', icon: 'Promotion', color: '#67c23a', desc: '活动与锻炼记录' },
  { value: 'STOOL', label: '排便', icon: 'Timer', color: '#909399', desc: '排便状态记录' },
  { value: 'HEALTH', label: '健康观察', icon: 'FirstAidKit', color: '#f56c6c', desc: '健康状况检查' },
  { value: 'CLEANING', label: '清洁护理', icon: 'Brush', color: '#409eff', desc: '日常护理项目' },
  { value: 'PLAY', label: '文娱活动', icon: 'Basketball', color: '#ff6b9d', desc: '陪伴活动时间' },
  { value: 'OTHER', label: '其他', icon: 'More', color: '#8c8c8c', desc: '其他日常事项' }
]

// 记录表单
const recordForm = ref({
  serviceType: 'SCHEDULE',
  scheduleType: 'FEEDING',
  recordTime: new Date(),
  food: '',
  amount: '',
  eatingCondition: 'GOOD',
  duration: 30,
  stoolDuringWalk: 'YES',
  stoolCondition: 'NORMAL',
  mentalState: 'GOOD',
  appetite: 'GOOD',
  abnormalSymptoms: '',
  cleaningItems: [],
  playDuration: 15,
  playContent: '',
  chargeItem: '',
  serviceTime: new Date(),
  chargeQuantity: 1,
  chargeUnitPrice: 0,
  chargeRemark: '',
  remarks: '',
  mediaUrls: []
})

const recordRules = ref({
  serviceType: [{ required: true, message: '请选择服务类型', trigger: 'change' }],
  scheduleType: [{ required: true, message: '请选择日程类型', trigger: 'change' }],
  chargeItem: [{ required: true, message: '请选择收费项目', trigger: 'change' }]
})

// 收费项目价格映射
const chargeItemPrices = {
  walk: 15,
  can_food: 12,
  play: 25,
  bath_basic: 50,
  bath_premium: 80,
  grooming: 120,
  deworming: 30,
  emergency: 50,
  wound: 40,
  damage: 100,
  special_care: 60
}

// 收费项目变更
function onChargeItemChange(value) {
  const price = chargeItemPrices[value] || 0
  recordForm.value.chargeUnitPrice = price
  calculateChargeAmount()
}

// 计算收费金额
function calculateChargeAmount() {
  // 金额自动计算，由模板中的计算属性处理
}

// 消息表单
const messageForm = ref({
  messageType: 'TEXT',
  content: '',
  mediaUrls: [],
  template: ''
})

const messageRules = ref({
  content: [{ required: true, message: '请输入消息内容', trigger: 'blur' }]
})

// 更新时间
let timeInterval
function updateTime() {
  const now = new Date()
  currentTime.value = now.toLocaleString('zh-CN', { 
    year: 'numeric', 
    month: '2-digit', 
    day: '2-digit', 
    hour: '2-digit', 
    minute: '2-digit', 
    second: '2-digit' 
  })
}

// 获取康养列表
function getList() {
  loading.value = true
  getBoardingList(queryParams).then(response => {
    boardingList.value = response.data || []
    total.value = response.data?.length || 0
    loading.value = false
  }).catch((error) => {
    loading.value = false
    boardingList.value = []
    total.value = 0
    proxy.$modal.msgError('获取康养列表失败')
  })
}

function handleQuery() {
  queryParams.pageNum = 1
  getList()
}

function resetQuery() {
  proxy.resetForm('queryForm')
  handleQuery()
}

function getStatusType(status) {
  const map = {
    'GOOD': 'success',
    'NORMAL': 'warning',
    'POOR': 'danger'
  }
  return map[status] || 'info'
}

function getStatusLabel(status) {
  const map = {
    'GOOD': '正常',
    'NORMAL': '需关注',
    'POOR': '异常'
  }
  return map[status] || status
}

function getResidentCardClass(status) {
  return {
    'resident-normal': status === 'GOOD',
    'resident-attention': status === 'NORMAL',
    'resident-abnormal': status === 'POOR'
  }
}

function handleAddRecord(resident) {
  currentResident.value = resident
  recordForm.value = {
    serviceType: 'SCHEDULE',
    scheduleType: 'FEEDING',
    recordTime: new Date(),
    food: resident.dietType || '',
    amount: '',
    eatingCondition: 'GOOD',
    duration: 30,
    stoolDuringWalk: 'YES',
    stoolCondition: 'NORMAL',
    mentalState: 'GOOD',
    appetite: 'GOOD',
    abnormalSymptoms: '',
    cleaningItems: [],
    playDuration: 15,
    playContent: '',
    chargeItem: '',
    serviceTime: new Date(),
    chargeQuantity: 1,
    chargeUnitPrice: 0,
    chargeRemark: '',
    remarks: '',
    mediaUrls: []
  }
  recordOpen.value = true
}

function submitRecord() {
  proxy.$refs['recordFormRef'].validate(valid => {
    if (valid) {
      // 构建后端需要的数据结构
      let payload = {}
      
      if (recordForm.value.serviceType === 'SCHEDULE') {
        // 日程服务 - 不收费
        const typeLabels = {
          'FEEDING': '进餐',
          'WALK': '活动',
          'STOOL': '排便记录',
          'HEALTH': '健康观察',
          'CLEANING': '清洁护理',
          'PLAY': '文娱活动',
          'OTHER': '其他'
        }
        let itemName = typeLabels[recordForm.value.scheduleType] || '日常记录'
        
        // 补充详情到 itemName
        if (recordForm.value.scheduleType === 'FEEDING') {
          itemName += recordForm.value.food ? `(${recordForm.value.food})` : ''
        } else if (recordForm.value.scheduleType === 'WALK') {
          itemName += recordForm.value.duration ? `(${recordForm.value.duration}分钟)` : ''
        } else if (recordForm.value.scheduleType === 'HEALTH') {
          itemName += recordForm.value.abnormalSymptoms ? `(${recordForm.value.abnormalSymptoms})` : ''
        } else if (recordForm.value.scheduleType === 'CLEANING') {
          itemName += recordForm.value.cleaningItems?.length ? `(${recordForm.value.cleaningItems.join(',')})` : ''
        } else if (recordForm.value.scheduleType === 'PLAY') {
          itemName += recordForm.value.playContent ? `(${recordForm.value.playContent})` : ''
        }
        
        payload = {
          itemName: itemName,
          chargeMode: 1, // 按次
          unitPrice: 0,
          quantity: 1
        }
      } else if (recordForm.value.serviceType === 'CHARGE') {
        // 收费服务
        payload = {
          itemName: recordForm.value.chargeItem || '收费服务',
          chargeMode: 1, // 按次
          unitPrice: recordForm.value.chargeUnitPrice || 0,
          quantity: recordForm.value.chargeQuantity || 1
        }
      }
      
      // 添加备注
      if (recordForm.value.remarks) {
        payload.itemName = payload.itemName + ' - ' + recordForm.value.remarks
      }
      
      addDailyRecord(currentResident.value.id, payload).then(() => {
        proxy.$modal.msgSuccess('记录添加成功')
        recordOpen.value = false
        getList()
      }).catch((error) => {
        proxy.$modal.msgError('记录添加失败：' + (error?.message || '请稍后重试'))
      })
    }
  })
}

function handleSendMessage(resident) {
  currentResident.value = resident
  messageForm.value = {
    messageType: 'TEXT',
    content: '',
    mediaUrls: [],
    template: ''
  }
  messageOpen.value = true
}

function submitMessage() {
  let content = messageForm.value.content
  if (messageForm.value.template) {
    content = messageForm.value.template
      .replace('{{residentName}}', currentResident.value.residentName || '')
      .replace('{{diet}}', currentResident.value.dietType || '普食')
  }
  sendMessageToOwner(currentResident.value.id, { ...messageForm.value, content }).then(() => {
    proxy.$modal.msgSuccess('消息发送成功')
    messageOpen.value = false
  }).catch((error) => {
    proxy.$modal.msgError('消息发送失败：' + (error?.message || '请稍后重试'))
  })
}

async function handleViewDetail(resident) {
  currentResident.value = { ...resident }
  activeTab.value = 'basic'
  detailOpen.value = true

  // 异步获取完整详情
  try {
    const detailRes = await getBoardingDetail(resident.id)
    if (detailRes.data) {
      currentResident.value = { ...currentResident.value, ...detailRes.data }
      // 初始化物品交接表单
      itemsCheckForm.value = {
        returnedItems: detailRes.data.returnedItems || '',
        itemsStatus: detailRes.data.itemsStatus ?? 0,
        itemsRemark: detailRes.data.itemsRemark || '',
        itemsConfirmed: detailRes.data.itemsConfirmed ?? 0
      }
    }
  } catch (e) {
    console.error('获取详情失败:', e)
  }

  // 获取日常记录
  try {
    const res = await getDailyRecords(resident.id)
    residentRecords.value = (res.data || []).map(item => ({
      time: item.createAt,
      content: `${item.itemName}${item.quantity > 1 ? ' x' + item.quantity : ''}`,
      type: item.unitPrice > 0 ? 'warning' : 'primary'
    }))
  } catch (e) {
    residentRecords.value = []
  }
}

function handleMarkAbnormal() {
  proxy.$modal.prompt('请输入异常原因', '标记异常').then(({ value }) => {
    markAbnormal(currentResident.value.id, { reason: value }).then(() => {
      proxy.$modal.msgSuccess('已标记异常')
      currentResident.value.mentalState = 'POOR'
      detailOpen.value = false
      getList()
    }).catch(() => {
      proxy.$modal.msgError('操作失败')
    })
  })
}

function handleResolveAbnormal() {
  proxy.$modal.confirm('确认要解除异常状态吗？').then(() => {
    resolveAbnormal(currentResident.value.id).then(() => {
      proxy.$modal.msgSuccess('异常已解除')
      currentResident.value.mentalState = 'GOOD'
      detailOpen.value = false
      getList()
    }).catch(() => {
      proxy.$modal.msgError('操作失败')
    })
  })
}

function handleTransferMedical() {
  proxy.$modal.prompt('请输入转隔离原因', '转至医疗隔离').then(({ value }) => {
    transferToMedical(currentResident.value.id, { reason: value }).then(() => {
      proxy.$modal.msgSuccess('已转至医疗隔离区')
      currentResident.value.mentalState = 'POOR'
      detailOpen.value = false
      getList()
    }).catch(() => {
      proxy.$modal.msgError('操作失败')
    })
  })
}

function hasRiskWarning(resident) {
  return resident.fallRisk === 'HIGH' || resident.fallRisk === 'MEDIUM' ||
         resident.cognition === 'CONFIRMED' || resident.cognition === 'SUSPECTED' ||
         resident.pressureSore === 'III_IV' || resident.pressureSore === 'I_II'
}

// 健康数据更新
const healthDialogOpen = ref(false)
const healthForm = ref({
  temperature: null,
  mentalState: 'GOOD',
  pulse: null,
  bloodPressureHigh: null,
  bloodPressureLow: null,
  bloodOxygen: null,
  consciousness: 'CLEAR'
})

function showHealthUpdateDialog() {
  healthForm.value = {
    temperature: currentResident.value.temperature || null,
    mentalState: currentResident.value.mentalState || 'GOOD',
    pulse: currentResident.value.pulse || null,
    bloodPressureHigh: currentResident.value.bloodPressureHigh || null,
    bloodPressureLow: currentResident.value.bloodPressureLow || null,
    bloodOxygen: currentResident.value.bloodOxygen || null,
    consciousness: currentResident.value.consciousness || 'CLEAR'
  }
  healthDialogOpen.value = true
}

async function submitHealthUpdate() {
  try {
    await updateHealthData(currentResident.value.id, healthForm.value)
    proxy.$modal.msgSuccess('健康数据更新成功')
    healthDialogOpen.value = false
    Object.assign(currentResident.value, healthForm.value)
    getList()
  } catch (e) {
    proxy.$modal.msgError('更新失败：' + (e?.message || '请稍后重试'))
  }
}

function genderLabel(gender) {
  if (gender === '男') return '男'
  if (gender === '女') return '女'
  const map = { 0: '未知', 1: '男', 2: '女' }
  return map[gender] ?? '未知'
}

function calculateAge(birthday) {
  if (!birthday) return ''
  const birth = new Date(birthday)
  const now = new Date()
  const years = now.getFullYear() - birth.getFullYear()
  return years > 0 ? years + '岁' : '<1岁'
}

function getTemperatureColor(temp) {
  if (!temp) return '#909399'
  // 长者正常体温约 36.0~37.3℃
  if (temp >= 38.0 || temp < 35.0) return '#f56c6c'
  if (temp > 37.3) return '#e6a23c'
  return '#67c23a'
}

function cognitionLabel(v) {
  const map = { NONE: '正常', NORMAL: '正常', SUSPECTED: '疑似认知障碍', CONFIRMED: '确诊失智' }
  return map[v] || (v || '未评估')
}
function getCognitionClass(v) {
  if (v === 'CONFIRMED') return 'behavior-danger'
  if (v === 'SUSPECTED') return 'behavior-warn'
  return 'behavior-safe'
}

function fallRiskLabel(v) {
  const map = { NONE: '低', LOW: '低', MEDIUM: '中', HIGH: '高' }
  return map[v] || (v || '未评估')
}
function fallRiskType(v) {
  if (v === 'HIGH') return 'danger'
  if (v === 'MEDIUM') return 'warning'
  return 'success'
}
function getFallRiskClass(v) {
  if (v === 'HIGH') return 'behavior-danger'
  if (v === 'MEDIUM') return 'behavior-warn'
  return 'behavior-safe'
}

function selfCareLabel(v) {
  const map = { INDEPENDENT: '完全自理', FULL: '完全自理', PARTIAL: '部分自理', SEVERE: '需协助', NONE: '完全不能自理' }
  return map[v] || (v || '未评估')
}
function getSelfCareClass(v) {
  if (v === 'NONE') return 'behavior-danger'
  if (v === 'PARTIAL') return 'behavior-warn'
  return 'behavior-safe'
}

function pressureSoreLabel(v) {
  const map = { NONE: '无', I_II: 'I~II度', III_IV: 'III~IV度' }
  return map[v] || (v || '无')
}
function getPressureSoreClass(v) {
  if (v === 'III_IV') return 'behavior-danger'
  if (v === 'I_II') return 'behavior-warn'
  return 'behavior-safe'
}

function consciousnessLabel(v) {
  const map = { CLEAR: '清醒', DROWSY: '嗜睡', UNCLEAR: '模糊', COMA: '昏迷' }
  return map[v] || (v || '未记录')
}

// 物品交接
const itemsCheckForm = ref({
  returnedItems: '',
  itemsStatus: 0,
  itemsRemark: '',
  itemsConfirmed: 0
})

function parsePhotos(photos) {
  if (!photos) return []
  if (Array.isArray(photos)) return photos
  try {
    const parsed = JSON.parse(photos)
    return Array.isArray(parsed) ? parsed : [photos]
  } catch {
    return photos.split(',').filter(Boolean)
  }
}

async function submitItemsCheck() {
  try {
    await updateItemsCheck(currentResident.value.id, itemsCheckForm.value)
    proxy.$modal.msgSuccess('交接信息保存成功')
    Object.assign(currentResident.value, itemsCheckForm.value)
  } catch (e) {
    proxy.$modal.msgError('保存失败：' + (e?.message || '请稍后重试'))
  }
}

onMounted(() => {
  getList()
  updateTime()
  generateWeekDays()
  loadWeekSchedule() // 加载真实日程数据
  timeInterval = setInterval(updateTime, 1000)
})

onUnmounted(() => {
  if (timeInterval) {
    clearInterval(timeInterval)
  }
})

// ==================== 视频直播 ====================
const videoDialogOpen = ref(false)
const currentVideoResident = ref({})
// 萤石云 accessToken（从环境变量 VITE_YS_ACCESS_TOKEN 读取）
const videoAccessToken = import.meta.env.VITE_YS_ACCESS_TOKEN || ''

function handleOpenVideo(resident) {
  currentVideoResident.value = resident
  videoDialogOpen.value = true
}

function handleVideoDialogClosed() {
  currentVideoResident.value = {}
}
</script>

<style scoped>
.app-container {
  padding: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.current-time {
  font-size: 14px;
  color: #909399;
}

.boarding-board {
  margin-top: 20px;
}

.board-title {
  margin-bottom: 20px;
  padding-bottom: 10px;
  border-bottom: 2px solid #e4e7ed;
}

.resident-card {
  margin-bottom: 10px;
  transition: all 0.3s;
  /* 使用 flex 布局，让内容区可以拉伸 */
  display: flex;
  flex-direction: column;
  height: 100%;
}

.resident-card:hover {
  box-shadow: 0 4px 16px 0 rgba(0, 0, 0, 0.15);
}

.resident-normal {
  border-top: 4px solid #67c23a;
}

.resident-attention {
  border-top: 4px solid #e6a23c;
}

.resident-abnormal {
  border-top: 4px solid #f56c6c;
}

.resident-isolation {
  border-top: 4px solid #909399;
}

.resident-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 15px;
}

.resident-info {
  flex: 1;
}

.resident-name {
  font-size: 16px;
  font-weight: bold;
}

.resident-meta {
  font-size: 12px;
  color: #909399;
}

.resident-days {
  font-size: 12px;
  color: #409eff;
}

.resident-details {
  /* 占据剩余空间，将操作按钮推到底部 */
  flex: 1;
  margin-bottom: 15px;
}

.detail-item {
  display: flex;
  justify-content: space-between;
  font-size: 13px;
  margin-bottom: 8px;
}

.detail-item .label {
  color: #909399;
}

.resident-actions {
  display: flex;
  justify-content: space-between;
  gap: 8px;
  /* 固定在卡片底部 */
  margin-top: auto;
  padding-top: 15px;
  border-top: 1px solid #ebeef5;
}

.record-images {
  margin-top: 10px;
}

/* 收费金额样式 */
.charge-total {
  padding: 10px 15px;
  background: #f0f9eb;
  border-radius: 4px;
  border-left: 4px solid #67c23a;
}

.charge-total .amount {
  font-size: 20px;
  font-weight: bold;
  color: #67c23a;
}

/* 服务类型卡片样式 */
.service-type-cards {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 12px;
}

.service-type-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 16px 12px;
  background: #fff;
  border: 2px solid #e4e7ed;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s;
  text-align: center;
}

.service-type-card:hover {
  border-color: #c6e2ff;
  background: #f5f7fa;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.service-type-card.active {
  background: #409eff;
  border-color: #409eff;
  color: #fff;
  box-shadow: 0 4px 16px rgba(64, 158, 255, 0.3);
}

.service-type-card .type-name {
  font-size: 14px;
  font-weight: 600;
  margin-top: 8px;
  margin-bottom: 4px;
}

.service-type-card .type-desc {
  font-size: 12px;
  opacity: 0.7;
  line-height: 1.3;
}

.service-type-card.active .type-desc {
  opacity: 0.9;
}

/* 响应式适配 */
@media (max-width: 768px) {
  .service-type-cards {
    grid-template-columns: repeat(3, 1fr);
  }
  
  .service-type-card {
    padding: 12px 8px;
  }
  
  .service-type-card .type-desc {
    display: none;
  }
}

/* 一周日程管理样式 */
.schedule-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.schedule-title {
  display: flex;
  align-items: center;
  gap: 15px;
}

.current-time {
  font-size: 14px;
  color: #909399;
}

/* 星期导航 */
.week-nav {
  display: flex;
  gap: 8px;
  margin-bottom: 20px;
  padding: 10px;
  background: #f5f7fa;
  border-radius: 8px;
}

.day-tab {
  flex: 1;
  text-align: center;
  padding: 12px 8px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s;
  position: relative;
  background: #fff;
  border: 2px solid transparent;
}

.day-tab:hover {
  background: #ecf5ff;
}

.day-tab.active {
  background: #409eff;
  color: #fff;
  box-shadow: 0 2px 12px rgba(64, 158, 255, 0.3);
}

.day-tab.today {
  border-color: #67c23a;
}

.day-tab.today:not(.active) {
  background: #f0f9eb;
}

.day-name {
  font-size: 14px;
  font-weight: 500;
  margin-bottom: 4px;
}

.day-date {
  font-size: 12px;
  opacity: 0.8;
}

.day-badge {
  position: absolute;
  top: 4px;
  right: 4px;
  min-width: 18px;
  height: 18px;
  line-height: 18px;
  text-align: center;
  background: #f56c6c;
  color: #fff;
  border-radius: 9px;
  font-size: 11px;
  padding: 0 5px;
}

.day-tab.active .day-badge {
  background: #fff;
  color: #409eff;
}

/* 横向日程时间轴 */
.daily-schedule-horizontal {
  overflow-x: auto;
  padding: 10px 0;
}

.schedule-timeline {
  display: flex;
  gap: 16px;
  min-width: max-content;
}

.schedule-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 160px;
  position: relative;
}

.schedule-item:not(:last-child)::after {
  content: '';
  position: absolute;
  top: 15px;
  right: -16px;
  width: 16px;
  height: 2px;
  background: #e4e7ed;
}

.schedule-item.completed::after {
  background: #67c23a;
}

.time-marker {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 12px;
  position: relative;
}

.time-dot {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  border: 3px solid #fff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  z-index: 1;
}

.time-label {
  margin-top: 8px;
  font-size: 13px;
  font-weight: 600;
  color: #606266;
}

.activity-card {
  background: #fff;
  border: 1px solid #e4e7ed;
  border-left-width: 4px;
  border-radius: 8px;
  padding: 12px;
  width: 100%;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);
  transition: all 0.3s;
}

.schedule-item:hover .activity-card {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}

.schedule-item.completed .activity-card {
  opacity: 0.7;
  background: #f5f7fa;
}

.schedule-item.current .activity-card {
  box-shadow: 0 0 0 2px #409eff, 0 4px 16px rgba(64, 158, 255, 0.2);
}

.activity-content {
  font-size: 13px;
  color: #303133;
  line-height: 1.5;
  margin-bottom: 10px;
  min-height: 40px;
}

.activity-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.activity-actions {
  display: flex;
  gap: 8px;
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px dashed #e4e7ed;
  opacity: 0;
  transition: opacity 0.3s;
}

.activity-card:hover .activity-actions {
  opacity: 1;
}

.activity-status {
  font-size: 12px;
  color: #67c23a;
  display: flex;
  align-items: center;
  gap: 4px;
}

.activity-status.current {
  color: #409eff;
}

/* 编辑日程对话框样式 */
.existing-schedules {
  width: 100%;
  min-height: 80px;
  max-height: 300px;
  overflow-y: auto;
}

.schedule-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.schedule-item-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  background: #f5f7fa;
  border: 1px solid #e4e7ed;
  border-radius: 6px;
  transition: all 0.3s;
}

.schedule-item-card:hover {
  background: #ecf5ff;
  border-color: #b3d8ff;
}

.schedule-item-card.editing {
  background: #ecf5ff;
  border-color: #409eff;
  box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.2);
}

.schedule-time {
  min-width: 60px;
  font-size: 14px;
  font-weight: 600;
  color: #409eff;
}

.schedule-content {
  flex: 1;
  font-size: 13px;
  color: #303133;
  line-height: 1.5;
}

.schedule-actions {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
}

/* 响应式适配 */
@media (max-width: 1200px) {
  .schedule-timeline {
    gap: 12px;
  }
  
  .schedule-item {
    min-width: 140px;
  }
}

@media (max-width: 768px) {
  .week-nav {
    flex-wrap: wrap;
  }
  
  .day-tab {
    flex: 0 0 calc(14.28% - 8px);
    min-width: 60px;
    padding: 8px 4px;
  }
  
  .day-name {
    font-size: 12px;
  }
  
  .day-date {
    font-size: 10px;
  }
}

/* 长者标签区样式 */
.resident-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 12px;
}

/* 照护与膳食概览样式 */
.mt15 { margin-top: 15px; }

.feeding-plan .feeding-info-row {
  display: flex;
  gap: 20px;
  margin-bottom: 15px;
}

.feeding-stat {
  text-align: center;
  flex: 1;
}

.feeding-stat-value {
  font-size: 20px;
  font-weight: 700;
  color: #303133;
  margin-bottom: 4px;
}

.feeding-stat-label {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
}

.allergy-alert {
  margin-bottom: 15px;
}

.feeding-progress {
  margin-top: 10px;
}

.feeding-progress .progress-label {
  font-size: 13px;
  color: #606266;
  margin-bottom: 8px;
  display: block;
}

/* 健康档案 */
.health-risk-banner { margin-bottom: 15px; }

.behavior-section .behavior-card {
  text-align: center;
  padding: 15px 10px;
  background: #f5f7fa;
  border-radius: 8px;
  border: 1px solid #e4e7ed;
}

.behavior-label {
  font-size: 12px;
  color: #909399;
  margin-bottom: 8px;
}

.behavior-value {
  font-size: 16px;
  font-weight: 600;
}

.behavior-safe { color: #67c23a; }
.behavior-warn { color: #e6a23c; }
.behavior-danger { color: #f56c6c; }

/* 物品交接 */
.photo-gallery {
  display: flex;
  flex-wrap: wrap;
}

.compare-section {
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  padding: 12px;
}

.compare-title {
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 10px;
  color: #606266;
}

/* 视频直播 */
.video-container {
  background: #000;
  border-radius: 8px;
  overflow: hidden;
}

.video-info {
  padding: 10px 15px;
  background: #303133;
  color: #fff;
  font-size: 14px;
}
</style>
