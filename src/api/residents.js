import request from '@/utils/request'
import { set } from 'nprogress';
// 老人基本信息管理
export function getResidentsList(params) {
  return request({
            url: "/intra/resident/resident/browse",
            method: "get",
            params: params,
        });
}

// 长者档案统计分析（概况 + 各维度分布 + 近 N 个月趋势）
export function getResidentOverview(trendMonths = 12) {
  return request({
            url: "/intra/resident/resident/overview",
            method: "get",
            params: { trendMonths },
        });
}

export function getResidentDetail(id) {
  return request({
              url: "/intra/resident/resident/detail/" + id,
              method: "get",
          });
}

export function addResident(data) {
  return request({
             url: "/intra/resident/resident/submit",
             method: "post",
             data,
         });
}

export function updateResident(data) {
   return request({
             url: "/intra/resident/resident/submit",
             method: "post",
             data,
         });
}

export function deleteResident(id) {
  return request({
            url: "/intra/resident/resident/delete",
            method: "delete",
            data: Array.isArray(id) ? id : [id]
        });
}

// 全量/模糊长者列表（下拉选择器用，返回 R<List> -> res.data 为数组）
export function getResidentOptions(name) {
  return request({
            url: "/intra/resident/resident/list",
            method: "get",
            params: { name }
        });
}
// 生成健康档案模拟数据
function generateHealthRecord(residentId) {
  const bloodTypes = ['A型', 'B型', 'O型', 'AB型']
  const examDate = new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000)
 const record ={
    id: residentId,
    nursingHomeId: 1,
    residentId: residentId,
    height: (150 + Math.random() * 30).toFixed(1), // 150-180cm
    weight: (45 + Math.random() * 30).toFixed(1), // 45-75kg
    bloodType: bloodTypes[Math.floor(Math.random() * bloodTypes.length)],
    medicalHistory: getRandomMedicalHistory(),
    allergyHistory: getRandomAllergyHistory(),
    familyMedicalHistory: getRandomFamilyMedicalHistory(),
    physicalExamDate: examDate.toISOString().split('T')[0],
    physicalExamResult: getRandomExamResult(),
    lastUpdateDate: new Date().toISOString().split('T')[0],
    createAt: new Date().toISOString(),
    updateAt: new Date().toISOString()
  };

  
  return record;
}

function getRandomMedicalHistory() {
  const histories = [
    '高血压病史10年，规律服药控制',
    '糖尿病史5年，饮食控制良好',
    '冠心病史8年，定期复查',
    '无重大疾病史',
    '轻度关节炎，天气变化时不适',
    '慢性支气管炎，冬季易发作'
  ]
  return histories[Math.floor(Math.random() * histories.length)]
}

function getRandomAllergyHistory() {
  const allergies = [
    '青霉素过敏',
    '海鲜过敏',
    '花粉过敏',
    '无过敏史',
    '酒精过敏',
    '尘螨过敏'
  ]
  return allergies[Math.floor(Math.random() * allergies.length)]
}

function getRandomFamilyMedicalHistory() {
  const familyHistories = [
    '父亲高血压，母亲糖尿病',
    '无家族遗传病史',
    '祖父冠心病，祖母高血压',
    '母亲乳腺癌史',
    '父亲肺癌史',
    '家族有糖尿病史'
  ]
  return familyHistories[Math.floor(Math.random() * familyHistories.length)]
}

function getRandomExamResult() {
  const results = [
    '体检结果正常，各项指标在正常范围内',
    '血压偏高，建议定期监测',
    '血糖偏高，建议饮食控制',
    '心电图正常，血脂稍高',
    '肝功能正常，肾功能正常',
    '骨密度偏低，建议补钙'
  ]
  return results[Math.floor(Math.random() * results.length)]
}






// 家属信息管理
export function getFamilyMembers(residentId) {
 return request({
          url: "/intra/resident/residentfamilymember/listByResidentId",
          method: "get",
          params: {residentId:residentId},
      });
}
export function addFamilyMember(data) {
  return request({
    url: '/intra/resident/residentfamilymember/submit',
    method: 'post',
    data
  })
}

export function updateFamilyMember(data) {
  return request({
    url: '/intra/resident/residentfamilymember/submit',
    method: 'post',
    data
  })
}

export function deleteFamilyMember(id) {
  return request({
              url: "/intra/resident/residentfamilymember/delete",
              method: "delete",
              data: Array.isArray(id) ? id : [id]
          });
}


// 老人健康档案管理
export function listHealthRecordByResidentId(residentId) {
 return request({
          url: "/intra/resident/residenthealthrecord/listByResidentId",
          method: "get",
          params: {residentId:residentId},
      });
}
export function getHealthRecordDetail(id) {
  return request({
              url: "/intra/resident/residenthealthrecord/detail/" + id,
              method: "get",
          });
}
export function addHealthRecord(data) {
  return request({
    url: '/intra/resident/residenthealthrecord/submit',
    method: 'post',
    data
  })
}

export function updateHealthRecord(data) {
  return request({
    url: '/intra/resident/residenthealthrecord/submit',
    method: 'post',
    data
  })
}

export function deleteHealthRecord(id) {
  return request({
              url: "/intra/resident/residenthealthrecord/delete",
              method: "delete",
              data: Array.isArray(id) ? id : [id]
          });
}