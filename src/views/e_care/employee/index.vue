<template>
  <div class="app-container">
    <el-form :model="queryParams" ref="queryRef" :inline="true" v-show="showSearch" label-width="68px">
      <el-form-item label="员工姓名" prop="name">
        <el-input
          v-model="queryParams.name"
          placeholder="请输入员工姓名"
          clearable
          @keyup.enter="handleQuery"
        />
      </el-form-item>
      <el-form-item label="员工等级" prop="level">
        <el-select v-model="queryParams.level" placeholder="请选择等级" clearable>
          <el-option label="初级" :value="1" />
          <el-option label="中级" :value="2" />
          <el-option label="高级" :value="3" />
          <el-option label="特级" :value="4" />
        </el-select>
      </el-form-item>
      <el-form-item label="员工状态" prop="employeeStatus">
        <el-select v-model="queryParams.employeeStatus" placeholder="请选择状态" clearable>
          <el-option label="待入职" :value="0" />
          <el-option label="在职" :value="1" />
          <el-option label="试用期" :value="2" />
          <el-option label="实习" :value="3" />
          <el-option label="离职" :value="10" />
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" icon="Search" @click="handleQuery">搜索</el-button>
        <el-button icon="Refresh" @click="resetQuery">重置</el-button>
      </el-form-item>
    </el-form>

    <el-row :gutter="10" class="mb8">
      <el-col :span="1.5">
        <el-button type="primary" plain icon="Plus" @click="handleAdd" v-hasPermi="['care:employee:add']">新增</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button type="success" plain icon="Edit" :disabled="single" @click="handleUpdate" v-hasPermi="['care:employee:edit']">修改</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button type="danger" plain icon="Delete" :disabled="multiple" @click="handleDelete" v-hasPermi="['care:employee:remove']">删除</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button type="warning" plain icon="Download" @click="handleExport" v-hasPermi="['care:employee:export']">导出</el-button>
      </el-col>
      <right-toolbar v-model:showSearch="showSearch" @queryTable="getList"></right-toolbar>
    </el-row>

    <el-table v-loading="loading" :data="employeeList" @selection-change="handleSelectionChange">
      <el-table-column type="selection" width="55" align="center" />
      <el-table-column label="员工编号" align="center" prop="employeeNo" width="120" />
      <el-table-column label="姓名" align="center" prop="name" min-width="100" />
      <el-table-column label="性别" align="center" prop="gender" width="80">
        <template #default="scope">
          <span>{{ scope.row.gender === 1 ? '男' : scope.row.gender === 2 ? '女' : '未知' }}</span>
        </template>
      </el-table-column>
      <el-table-column label="联系电话" align="center" prop="phone" width="130" />
      <el-table-column label="服务岗位" align="center" prop="position" min-width="110" />
      <el-table-column label="等级" align="center" prop="level" width="90">
        <template #default="scope">
          <el-tag :type="getLevelType(scope.row.level)">
            {{ getLevelName(scope.row.level) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="服务能力" align="center" width="190">
        <template #default="scope">
          <el-tag v-if="scope.row.isCare === 1" size="small" type="success">康养照护</el-tag>
          <el-tag v-if="scope.row.isRehab === 1" size="small" type="primary">康复服务</el-tag>
          <el-tag v-if="scope.row.isSales === 1" size="small" type="warning">商品销售</el-tag>
          <span v-if="!scope.row.isCare && !scope.row.isRehab && !scope.row.isSales" style="color:#c0c4cc">-</span>
        </template>
      </el-table-column>
      <el-table-column label="累计服务" align="center" prop="totalOrders" width="100" />
      <el-table-column label="累计服务费" align="center" prop="totalAmount" width="120">
        <template #default="scope">¥{{ scope.row.totalAmount }}</template>
      </el-table-column>
      <el-table-column label="家属评分" align="center" prop="rating" width="130">
        <template #default="scope">
          <el-rate v-model="scope.row.rating" disabled :max="5" />
        </template>
      </el-table-column>
      <el-table-column label="员工状态" align="center" prop="employeeStatus" width="100">
        <template #default="scope">
          <el-tag :type="getStatusType(scope.row.employeeStatus)">
            {{ getStatusName(scope.row.employeeStatus) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="入职日期" align="center" prop="hireDate" width="120" />
      <el-table-column label="操作" align="center" class-name="small-padding fixed-width" width="280" fixed="right">
        <template #default="scope">
          <el-button link type="primary" icon="View" @click="handleView(scope.row)">详情</el-button>
          <el-button link type="primary" icon="Edit" @click="handleUpdate(scope.row)" v-hasPermi="['care:employee:edit']">修改</el-button>
          <el-button 
            v-if="scope.row.employeeStatus == 0" 
            link 
            type="success" 
            icon="CircleCheck" 
            @click="handleHire(scope.row)" 
            v-hasPermi="['care:employee:hire']">
            办理入职
          </el-button>
          <el-button 
            v-if="scope.row.employeeStatus >= 1 && scope.row.employeeStatus < 10" 
            link 
            type="danger" 
            icon="CircleClose" 
            @click="handleLeave(scope.row)" 
            v-hasPermi="['care:employee:leave']">
            办理离职
          </el-button>
          <el-button link type="primary" icon="Delete" @click="handleDelete(scope.row)" v-hasPermi="['care:employee:remove']">删除</el-button>
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

    <!-- 添加或修改员工对话框 -->
    <el-dialog :title="title" v-model="open" width="900px" append-to-body>
      <el-form ref="employeeRef" :model="form" :rules="rules" label-width="130px">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="员工编号" prop="employeeNo">
              <el-input v-model="form.employeeNo" placeholder="请输入员工编号" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="姓名" prop="name">
              <el-input v-model="form.name" placeholder="请输入姓名" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="性别" prop="gender">
              <el-select v-model="form.gender" placeholder="请选择性别">
                <el-option label="男" :value="1" />
                <el-option label="女" :value="2" />
                <el-option label="未知" :value="0" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="联系电话" prop="phone">
              <el-input v-model="form.phone" placeholder="请输入联系电话" />
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="身份证号" prop="idCard">
              <el-input v-model="form.idCard" placeholder="请输入身份证号" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="出生日期" prop="birthday">
              <el-date-picker v-model="form.birthday" type="date" placeholder="选择日期" value-format="YYYY-MM-DD" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="家庭住址" prop="address">
              <el-input v-model="form.address" placeholder="请输入家庭住址" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="微信号" prop="wechat">
              <el-input v-model="form.wechat" placeholder="请输入微信号" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="邮箱" prop="email">
              <el-input v-model="form.email" placeholder="请输入邮箱" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="服务岗位" prop="position">
              <el-input v-model="form.position" placeholder="例如：护理员、康复师、营养师、社工、护士长" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="等级" prop="level">
              <el-select v-model="form.level" placeholder="请选择等级">
                <el-option label="初级" :value="1" />
                <el-option label="中级" :value="2" />
                <el-option label="高级" :value="3" />
                <el-option label="特级" :value="4" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="服务能力" prop="serviceTypes">
          <el-checkbox-group v-model="form.serviceTypes">
            <el-checkbox label="is_care">康养照护</el-checkbox>
            <el-checkbox label="is_rehab">康复服务</el-checkbox>
            <el-checkbox label="is_sales">商品销售</el-checkbox>
          </el-checkbox-group>
        </el-form-item>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="每日服务上限" prop="maxDaily">
              <el-input-number v-model="form.maxDaily" :min="1" :max="20" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="启用状态" prop="enabled">
              <el-switch v-model="form.enabled" :active-value="1" :inactive-value="0" active-text="启用" inactive-text="禁用" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="专长技能" prop="skillList">
          <div class="skills-container">
            <el-tag
              v-for="(skill, index) in form.skillList"
              :key="index"
              closable
              :disable-transitions="false"
              @close="handleCloseSkill(index)"
              class="skill-tag"
            >
              {{ skill }}
            </el-tag>
            <el-input
              v-if="skillInputVisible"
              ref="skillInputRef"
              v-model="skillInputValue"
              class="skill-input"
              size="small"
              @keyup.enter="handleInputConfirm"
              @blur="handleInputConfirm"
            />
            <el-button v-else class="button-new-tag" size="small" @click="showSkillInput">
              + 新增技能
            </el-button>
          </div>
          <div class="skill-presets">
            <span class="preset-label">常用技能：</span>
            <el-tag
              v-for="preset in skillPresets"
              :key="preset"
              size="small"
              effect="plain"
              @click="addPresetSkill(preset)"
              class="preset-tag"
            >
              {{ preset }}
            </el-tag>
          </div>
        </el-form-item>
         <el-row :gutter="20">
          <el-col :span="12">
        <el-form-item label="紧急联系人" prop="emergencyContact">
          <el-input v-model="form.emergencyContact" placeholder="请输入紧急联系人" />
        </el-form-item>
        </el-col>
        <el-col :span="12">
           <el-form-item label="紧急联系电话" prop="emergencyPhone">
          <el-input v-model="form.emergencyPhone" placeholder="请输入紧急联系电话" />
        </el-form-item>
        </el-col>
        </el-row>
        <el-form-item label="家庭住址" prop="address">
          <el-input v-model="form.address" type="textarea" :rows="2" placeholder="请输入家庭住址" />
        </el-form-item>
        <el-form-item label="备注" prop="remark">
          <el-input v-model="form.remark" type="textarea" :rows="2" placeholder="请输入备注" />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button type="primary" @click="submitForm">确 定</el-button>
          <el-button @click="cancel">取 消</el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 办理入职对话框 -->
    <el-dialog title="办理入职" v-model="hireDialogVisible" width="800px" append-to-body>
      <el-form ref="hireRef" :model="hireForm" :rules="hireRules" label-width="120px">
        <el-form-item label="员工姓名">
          <el-input v-model="hireForm.name" disabled />
        </el-form-item>
        <el-form-item label="入职日期" prop="hireDate">
          <el-date-picker 
            v-model="hireForm.hireDate" 
            type="date" 
            placeholder="选择入职日期" 
            value-format="YYYY-MM-DD"
            style="width: 100%" />
        </el-form-item>
         <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="服务岗位" prop="position">
              <el-input v-model="hireForm.position" placeholder="例如：护理员、康复师、营养师、社工" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="等级" prop="level">
              <el-select v-model="hireForm.level" placeholder="请选择等级">
                <el-option label="初级" :value="1" />
                <el-option label="中级" :value="2" />
                <el-option label="高级" :value="3" />
                <el-option label="特级" :value="4" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="入职文件" prop="hireFile">
          <el-upload
            class="hire-file-uploader"
            :action="uploadUrl"
            :headers="uploadHeaders"
            :file-list="hireForm.hireFileList"
            :on-success="handleHireFileSuccess"
            :on-remove="handleHireFileRemove"
            :before-upload="beforeHireFileUpload"
            multiple
            :limit="5">
            <el-button type="primary" icon="Plus">上传文件</el-button>
            <template #tip>
              <div class="el-upload__tip">
                支持上传多个文件，单个文件不超过10MB，最多5个文件
              </div>
            </template>
          </el-upload>
        </el-form-item>

       
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="开户银行" prop="bankName">
              <el-input v-model="hireForm.bankName" placeholder="请输入开户银行" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="银行账号" prop="bankAccount">
              <el-input v-model="hireForm.bankAccount" placeholder="请输入银行账号" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="基本工资" prop="baseSalary">
              <el-input-number v-model="hireForm.baseSalary" :precision="2" :min="0" :step="100" style="width: 100%" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="推荐人" prop="hireReferee">
              <el-input v-model="hireForm.hireReferee" placeholder="请输入推荐人" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="推荐人原因" prop="hireRefereeReason">
              <el-input v-model="hireForm.hireRefereeReason" placeholder="请输入推荐人原因" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="24">
            <el-form-item label="备注">
              <el-input v-model="hireForm.remark" type="textarea" :rows="3" placeholder="可选：入职备注" />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="hireDialogVisible = false">取 消</el-button>
          <el-button type="primary" @click="submitHire" :loading="hireLoading">确 定</el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 办理离职对话框 -->
    <el-dialog title="办理离职" v-model="leaveDialogVisible" width="600px" append-to-body>
      <el-form ref="leaveRef" :model="leaveForm" :rules="leaveRules" label-width="120px">
        <el-form-item label="员工姓名">
          <el-input v-model="leaveForm.name" disabled />
        </el-form-item>
        <el-form-item label="离职日期" prop="leaveDate">
          <el-date-picker 
            v-model="leaveForm.leaveDate" 
            type="date" 
            placeholder="选择离职日期" 
            value-format="YYYY-MM-DD"
            style="width: 100%" />
        </el-form-item>
        <el-form-item label="离职文件" prop="leaveFile">
          <el-upload
            class="leave-file-uploader"
            :action="uploadUrl"
            :headers="uploadHeaders"
            :file-list="leaveForm.leaveFileList"
            :on-success="handleLeaveFileSuccess"
            :on-remove="handleLeaveFileRemove"
            :before-upload="beforeLeaveFileUpload"
            multiple
            :limit="5">
            <el-button type="primary" icon="Plus">上传文件</el-button>
            <template #tip>
              <div class="el-upload__tip">
                支持上传多个文件，单个文件不超过10MB，最多5个文件
              </div>
            </template>
          </el-upload>
        </el-form-item>
        <el-form-item label="离职原因" prop="leaveReason">
          <el-input v-model="leaveForm.leaveReason" type="textarea" :rows="3" placeholder="请输入离职原因" />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="leaveDialogVisible = false">取 消</el-button>
          <el-button type="primary" @click="submitLeave" :loading="leaveLoading">确 定</el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 员工详情对话框 -->
    <el-dialog title="员工详情" v-model="detailDialogVisible" width="900px" append-to-body>
      <el-descriptions :column="2" border>
        <el-descriptions-item label="员工编号">{{ detailData.employeeNo }}</el-descriptions-item>
        <el-descriptions-item label="姓名">{{ detailData.name }}</el-descriptions-item>
        <el-descriptions-item label="性别">
          {{ detailData.gender === 1 ? '男' : detailData.gender === 2 ? '女' : '未知' }}
        </el-descriptions-item>
        <el-descriptions-item label="联系电话">{{ detailData.phone }}</el-descriptions-item>
        <el-descriptions-item label="身份证号">{{ detailData.idCard || '-' }}</el-descriptions-item>
        <el-descriptions-item label="出生日期">{{ detailData.birthday || '-' }}</el-descriptions-item>
        <el-descriptions-item label="微信号">{{ detailData.wechat || '-' }}</el-descriptions-item>
        <el-descriptions-item label="邮箱">{{ detailData.email || '-' }}</el-descriptions-item>
        <el-descriptions-item label="服务岗位">{{ detailData.position || '-' }}</el-descriptions-item>
        <el-descriptions-item label="等级">
          <el-tag :type="getLevelType(detailData.level)">{{ getLevelName(detailData.level) }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="员工状态">
          <el-tag :type="getStatusType(detailData.employeeStatus)">{{ getStatusName(detailData.employeeStatus) }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="入职日期">{{ detailData.hireDate || '-' }}</el-descriptions-item>
        <el-descriptions-item label="离职日期">{{ detailData.leaveDate || '-' }}</el-descriptions-item>
        <el-descriptions-item label="基本工资">¥{{ detailData.baseSalary || '0.00' }}</el-descriptions-item>
        <el-descriptions-item label="提成比例">{{ detailData.commissionRate || '0' }}%</el-descriptions-item>
        <el-descriptions-item label="累计服务">{{ detailData.totalOrders || 0 }}</el-descriptions-item>
        <el-descriptions-item label="累计服务费">¥{{ detailData.totalAmount || '0.00' }}</el-descriptions-item>
        <el-descriptions-item label="家属评分">
          <el-rate v-model="detailData.rating" disabled :max="5" />
        </el-descriptions-item>
        <el-descriptions-item label="每日服务上限">{{ detailData.maxDaily || 0 }}</el-descriptions-item>
        <el-descriptions-item label="服务能力">
          <el-tag v-if="detailData.isCare === 1" size="small" type="success">康养照护</el-tag>
          <el-tag v-if="detailData.isRehab === 1" size="small" type="primary">康复服务</el-tag>
          <el-tag v-if="detailData.isSales === 1" size="small" type="warning">商品销售</el-tag>
          <span v-if="!detailData.isCare && !detailData.isRehab && !detailData.isSales">-</span>
        </el-descriptions-item>
        <el-descriptions-item label="专长技能" :span="2">
          <template v-if="detailData.skillList && detailData.skillList.length > 0">
            <el-tag v-for="(skill, index) in detailData.skillList" :key="index" size="small" style="margin-right: 8px;">
              {{ skill }}
            </el-tag>
          </template>
          <span v-else>-</span>
        </el-descriptions-item>
        <el-descriptions-item label="紧急联系人">{{ detailData.emergencyContact || '-' }}</el-descriptions-item>
        <el-descriptions-item label="紧急联系电话">{{ detailData.emergencyPhone || '-' }}</el-descriptions-item>
        <el-descriptions-item label="家庭住址" :span="2">{{ detailData.address || '-' }}</el-descriptions-item>
        <el-descriptions-item label="开户银行">{{ detailData.bankName || '-' }}</el-descriptions-item>
        <el-descriptions-item label="银行账号">{{ detailData.bankAccount || '-' }}</el-descriptions-item>
        <el-descriptions-item label="推荐人">{{ detailData.hireReferee || '-' }}</el-descriptions-item>
        <el-descriptions-item label="推荐原因">{{ detailData.hireRefereeReason || '-' }}</el-descriptions-item>
        <el-descriptions-item label="入职文件" :span="2">
          <template v-if="detailData.hireFile">
            <div v-for="(file, index) in detailData.hireFile.split(',')" :key="index" style="margin-bottom: 8px;">
              <el-link :href="file" target="_blank" type="primary">查看文件 {{ index + 1 }}</el-link>
            </div>
          </template>
          <span v-else>-</span>
        </el-descriptions-item>
        <el-descriptions-item label="离职文件" :span="2">
          <template v-if="detailData.leaveFile">
            <div v-for="(file, index) in detailData.leaveFile.split(',')" :key="index" style="margin-bottom: 8px;">
              <el-link :href="file" target="_blank" type="primary">查看文件 {{ index + 1 }}</el-link>
            </div>
          </template>
          <span v-else>-</span>
        </el-descriptions-item>
        <el-descriptions-item label="离职原因" :span="2">{{ detailData.leaveReason || '-' }}</el-descriptions-item>
        <el-descriptions-item label="备注" :span="2">{{ detailData.remark || '-' }}</el-descriptions-item>
        <el-descriptions-item label="创建时间">{{ detailData.createAt || '-' }}</el-descriptions-item>
        <el-descriptions-item label="更新时间">{{ detailData.updateAt || '-' }}</el-descriptions-item>
      </el-descriptions>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="detailDialogVisible = false">关 闭</el-button>
        </div>
      </template>
    </el-dialog>

  </div>
</template>

<script setup name="Employee">
import { ref, reactive, nextTick, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import { getEmployeeList, getEmployeeDetail, submitEmployee, deleteEmployee, exportEmployee, hireEmployee, leaveEmployee } from '@/api/care/employee'
import { getToken } from '@/utils/auth'

const { proxy } = getCurrentInstance()

// OSS上传配置
const uploadUrl = import.meta.env.VITE_APP_BASE_API + '/common/oss/upload'
const uploadHeaders = computed(() => ({
  Authorization: 'Bearer ' + getToken()
}))

const employeeList = ref([])
const open = ref(false)
const loading = ref(true)
const showSearch = ref(true)
const ids = ref([])
const single = ref(true)
const multiple = ref(true)
const total = ref(0)
const title = ref('')

// 入职/离职对话框
const hireDialogVisible = ref(false)
const leaveDialogVisible = ref(false)
const hireLoading = ref(false)
const leaveLoading = ref(false)

// 员工详情对话框
const detailDialogVisible = ref(false)
const detailData = reactive({})

const hireForm = reactive({
  id: undefined,
  name: '',
  hireDate: '',
  hireFile: '',
  hireFileList: [], // 文件列表
  hireReferee: '',
  hireRefereeReason: '',
  bankName: '',
  bankAccount: '',
  baseSalary: 0,
  remark: ''
})

const leaveForm = reactive({
  id: undefined,
  name: '',
  leaveDate: '',
  leaveFile: '',
  leaveFileList: [], // 文件列表
  leaveReason: ''
})

const hireRules = {
  hireDate: [{ required: true, message: '入职日期不能为空', trigger: 'change' }]
}
const leaveRules = {
  leaveDate: [{ required: true, message: '离职日期不能为空', trigger: 'change' }],
  leaveReason: [{ required: true, message: '离职原因不能为空', trigger: 'blur' }]
}

const data = reactive({
  form: {},
  queryParams: {
    pageNum: 1,
    pageSize: 10,
    name: undefined,
    level: undefined,
    employeeStatus: undefined
  },
  rules: {
    employeeNo: [{ required: true, message: '员工编号不能为空', trigger: 'blur' }],
    name: [{ required: true, message: '姓名不能为空', trigger: 'blur' }],
    phone: [{ required: true, message: '联系电话不能为空', trigger: 'blur' }],
    gender: [{ required: true, message: '性别不能为空', trigger: 'change' }],
    level: [{ required: true, message: '等级不能为空', trigger: 'change' }]
  }
})

const { queryParams, form, rules } = toRefs(data)

/** 查询等级类型 */
function getLevelType(level) {
  const types = { 1: 'info', 2: '', 3: 'success', 4: 'warning' }
  return types[level] || ''
}

/** 查询等级名称 */
function getLevelName(level) {
  const names = { 1: '初级', 2: '中级', 3: '高级', 4: '特级' }
  return names[level] || '未知'
}

/** 查询状态类型 */
function getStatusType(status) {
  const types = { 
    0: 'info',      // 待入职 - 灰色
    1: 'success',   // 在职 - 绿色
    2: '',          // 试用期 - 蓝色
    3: 'warning',   // 实习 - 橙色
    10: 'danger'    // 离职 - 红色
  }
  return types[status] || 'info'
}

/** 查询状态名称 */
function getStatusName(status) {
  const names = { 
    0: '待入职', 
    1: '在职', 
    2: '试用期', 
    3: '实习', 
    10: '离职' 
  }
  return names[status] || '未知'
}

/** 技能标签相关 */
const skillInputVisible = ref(false)
const skillInputValue = ref('')
const skillInputRef = ref(null)

// 康养中心常用岗位技能预设
const skillPresets = [
  '生活照护', '翻身叩背', '压疮预防', '鼻饲护理', '导尿护理',
  '血糖监测', '血压监测', '用药管理', '康复训练', '轮椅转移',
  '认知症照护', '跌倒防范', '急救处理', '心理疏导', '营养配餐'
]

/** 显示技能输入框 */
function showSkillInput() {
  skillInputVisible.value = true
  nextTick(() => {
    skillInputRef.value?.focus()
  })
}

/** 确认添加技能 */
function handleInputConfirm() {
  const value = skillInputValue.value.trim()
  if (value) {
    if (!form.value.skillList) {
      form.value.skillList = []
    }
    if (!form.value.skillList.includes(value)) {
      form.value.skillList.push(value)
    } else {
      ElMessage.warning('该技能已添加')
    }
  }
  skillInputVisible.value = false
  skillInputValue.value = ''
}

/** 删除技能 */
function handleCloseSkill(index) {
  form.value.skillList.splice(index, 1)
}

/** 添加预设技能 */
function addPresetSkill(skill) {
  if (!form.value.skillList) {
    form.value.skillList = []
  }
  if (!form.value.skillList.includes(skill)) {
    form.value.skillList.push(skill)
  } else {
    ElMessage.warning('该技能已添加')
  }
}

/** 查询员工列表 */
function getList() {
  loading.value = true
  getEmployeeList(queryParams.value).then(response => {
    employeeList.value = response.data.list;
    total.value = response.data.totalCount;
    loading.value = false
  }).catch(() => {
    loading.value = false
  })
}

/** 搜索按钮操作 */
function handleQuery() {
  queryParams.value.pageNum = 1
  getList()
}

/** 重置按钮操作 */
function resetQuery() {
  proxy.resetForm('queryRef')
  handleQuery()
}

/** 多选框选中数据 */
function handleSelectionChange(selection) {
  ids.value = selection.map(item => item.id)
  single.value = selection.length !== 1
  multiple.value = !selection.length
}

/** 新增按钮操作 */
function handleAdd() {
  reset()
  open.value = true
  title.value = '添加员工'
}

/** 查看详情 */
function handleView(row) {
  getEmployeeDetail(row.id).then(response => {
    const employee = response.data
    
    // 将数据复制到 detailData
    Object.assign(detailData, employee)
    
    // 将逗号分隔的skills字符串转换为数组
    if (employee.skills) {
      detailData.skillList = employee.skills.split(',').filter(s => s.trim())
    } else {
      detailData.skillList = []
    }
    
    detailDialogVisible.value = true
  }).catch(() => {
    ElMessage.error('获取员工详情失败')
  })
}

/** 修改按钮操作 */
function handleUpdate(row) {
  reset()
  const id = row.id || ids.value[0]
  getEmployeeDetail(id).then(response => {
    form.value = response.data
    // 将独立服务能力字段转换为 serviceTypes 数组
    form.value.serviceTypes = []
    if (form.value.isCare === 1) form.value.serviceTypes.push('is_care')
    if (form.value.isRehab === 1) form.value.serviceTypes.push('is_rehab')
    if (form.value.isSales === 1) form.value.serviceTypes.push('is_sales')
    
    // 将逗号分隔的skills字符串转换为数组
    form.value.skillList = form.value.skills ? form.value.skills.split(',').filter(s => s.trim()) : []
    
    open.value = true
    title.value = '修改员工'
  })
}

/** 删除按钮操作 */
function handleDelete(row) {
  const employeeIds = row.id || ids.value
  ElMessageBox.confirm('是否确认删除员工编号为"' + employeeIds + '"的数据项？', '警告', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    return deleteEmployee(employeeIds)
  }).then(() => {
    ElMessage.success('删除成功')
    getList()
  }).catch(() => {})
}

/** 导出按钮操作 */
function handleExport() {
  ElMessageBox.confirm('是否确认导出员工数据？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    return exportEmployee(queryParams.value)
  }).then(response => {
    const blob = new Blob([response.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = '员工数据_' + new Date().getTime() + '.xlsx'
    link.click()
    window.URL.revokeObjectURL(url)
    ElMessage.success('导出成功')
  }).catch(() => {})
}

/** 办理入职 */
function handleHire(row) {
  // 获取当天日期，格式：YYYY-MM-DD
  const today = new Date()
  const year = today.getFullYear()
  const month = String(today.getMonth() + 1).padStart(2, '0')
  const day = String(today.getDate()).padStart(2, '0')
  const todayStr = `${year}-${month}-${day}`
  
  // 使用 Object.assign 将 row 的数据复制到 hireForm
  Object.assign(hireForm, {
    id: row.id,
    name: row.name,
    hireDate: todayStr, // 默认当天
    hireFile: '',
    hireFileList: [],
    hireReferee: row.hireReferee || '',
    hireRefereeReason: row.hireRefereeReason || '',
    bankName: row.bankName || '',
    bankAccount: row.bankAccount || '',
    baseSalary: row.baseSalary || 0,
    level: row.level || 2,
    position: row.position || '',
    remark: ''
  })
  
  hireDialogVisible.value = true
}

/** 入职文件上传前验证 */
function beforeHireFileUpload(file) {
  const isLt10M = file.size / 1024 / 1024 < 10
  if (!isLt10M) {
    ElMessage.error('文件大小不能超过 10MB!')
    return false
  }
  return true
}

/** 入职文件上传成功 */
function handleHireFileSuccess(response, file, fileList) {
  if (response.code === 200) {
    hireForm.hireFileList = fileList
    // 将文件URL拼接成逗号分隔的字符串
    hireForm.hireFile = fileList.map(f => f.url || f.response.data).join(',')
    ElMessage.success('文件上传成功')
  } else {
    ElMessage.error(response.msg || '文件上传失败')
  }
}

/** 入职文件删除 */
function handleHireFileRemove(file, fileList) {
  hireForm.hireFileList = fileList
  hireForm.hireFile = fileList.map(f => f.url || f.response?.data).join(',')
}

/** 提交入职 */
function submitHire() {
  proxy.$refs.hireRef.validate(valid => {
    if (valid) {
      hireLoading.value = true
      hireEmployee(hireForm).then(() => {
        ElMessage.success('入职办理成功')
        hireDialogVisible.value = false
        getList()
      }).catch(() => {
        hireLoading.value = false
      })
    }
  })
}

/** 办理离职 */
function handleLeave(row) {
  // 获取当天日期，格式：YYYY-MM-DD
  const today = new Date()
  const year = today.getFullYear()
  const month = String(today.getMonth() + 1).padStart(2, '0')
  const day = String(today.getDate()).padStart(2, '0')
  const todayStr = `${year}-${month}-${day}`
  
  leaveForm.id = row.id
  leaveForm.name = row.name
  leaveForm.leaveDate = todayStr // 默认当天
  leaveForm.leaveFile = ''
  leaveForm.leaveFileList = []
  leaveForm.leaveReason = ''
  leaveDialogVisible.value = true
}

/** 离职文件上传前验证 */
function beforeLeaveFileUpload(file) {
  const isLt10M = file.size / 1024 / 1024 < 10
  if (!isLt10M) {
    ElMessage.error('文件大小不能超过 10MB!')
    return false
  }
  return true
}

/** 离职文件上传成功 */
function handleLeaveFileSuccess(response, file, fileList) {
  if (response.code === 200) {
    leaveForm.leaveFileList = fileList
    // 将文件URL拼接成逗号分隔的字符串
    leaveForm.leaveFile = fileList.map(f => f.url || f.response.data).join(',')
    ElMessage.success('文件上传成功')
  } else {
    ElMessage.error(response.msg || '文件上传失败')
  }
}

/** 离职文件删除 */
function handleLeaveFileRemove(file, fileList) {
  leaveForm.leaveFileList = fileList
  leaveForm.leaveFile = fileList.map(f => f.url || f.response?.data).join(',')
}

/** 提交离职 */
function submitLeave() {
  proxy.$refs.leaveRef.validate(valid => {
    if (valid) {
      leaveLoading.value = true
      leaveEmployee({
        id: leaveForm.id,
        leaveDate: leaveForm.leaveDate,
        leaveFile: leaveForm.leaveFile,
        leaveReason: leaveForm.leaveReason
      }).then(() => {
        ElMessage.success('离职办理成功')
        leaveDialogVisible.value = false
        getList()
      }).catch(() => {
        leaveLoading.value = false
      })
    }
  })
}

/** 提交按钮 */
function submitForm() {
  proxy.$refs.employeeRef.validate(valid => {
    if (valid) {
      // 将 serviceTypes 回写为后端实体字段（isCare / isRehab / isSales）
      form.value.isCare = form.value.serviceTypes?.includes('is_care') ? 1 : 0
      form.value.isRehab = form.value.serviceTypes?.includes('is_rehab') ? 1 : 0
      form.value.isSales = form.value.serviceTypes?.includes('is_sales') ? 1 : 0
      
      // 将技能数组转换为逗号分隔的字符串
      form.value.skills = form.value.skillList?.join(',') || ''
      
      // 设置员工状态为待入职
      form.value.employeeStatus = 0
      
      submitEmployee(form.value).then(() => {
        ElMessage.success(form.value.id ? '修改成功' : '新增成功')
        open.value = false
        getList()
      })
    }
  })
}

/** 取消按钮 */
function cancel() {
  open.value = false
  reset()
}

/** 表单重置 */
function reset() {
  form.value = {
    id: undefined,
    employeeNo: undefined,
    name: undefined,
    gender: 0,
    idCard: undefined,
    birthday: undefined,
    phone: undefined,
    emergencyContact: undefined,
    emergencyPhone: undefined,
    position: undefined,
    level: 2,
    serviceTypes: [],
    isCare: 0,
    isRehab: 0,
    isSales: 0,
    maxDaily: 8,
    enabled: 1,
    skills: undefined,
    skillList: [],
    address: undefined,
    remark: undefined
  }
  // 重置技能输入状态
  skillInputVisible.value = false
  skillInputValue.value = ''
  proxy.resetForm('employeeRef')
}

getList()
</script>

<style scoped lang="scss">
.skills-container {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
  min-height: 32px;
  padding: 4px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  background-color: #fff;

  .skill-tag {
    margin: 0;
  }

  .skill-input {
    width: 120px;
    margin-left: 4px;
  }

  .button-new-tag {
    margin-left: 4px;
    height: 24px;
    line-height: 22px;
    padding: 0 8px;
  }
}

.skill-presets {
  margin-top: 8px;
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px;

  .preset-label {
    font-size: 12px;
    color: #909399;
    margin-right: 4px;
  }

  .preset-tag {
    cursor: pointer;
    transition: all 0.3s;

    &:hover {
      background-color: #ecf5ff;
      border-color: #409eff;
      color: #409eff;
    }
  }
}

// 入职/离职文件上传样式
.hire-file-uploader,
.leave-file-uploader {
  :deep(.el-upload-list) {
    margin-top: 8px;
  }

  :deep(.el-upload__tip) {
    color: #909399;
    font-size: 12px;
    margin-top: 8px;
    line-height: 1.5;
  }
}
</style>
