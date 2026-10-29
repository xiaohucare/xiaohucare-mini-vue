<template>
  <div class="app-container">
    <!-- 搜索栏 -->
    <el-form :model="queryParams" ref="queryRef" :inline="true" v-show="showSearch" label-width="100px">
      <el-form-item label="文章标题" prop="title">
        <el-input
          v-model="queryParams.title"
          placeholder="请输入文章标题"
          clearable
          style="width: 200px"
          @keyup.enter="handleQuery"
        />
      </el-form-item>
      <el-form-item label="文章分类" prop="category">
        <el-select v-model="queryParams.category" placeholder="请选择分类" clearable>
          <el-option label="门店新闻" value="news" />
          <el-option label="活动报道" value="activity" />
          <el-option label="康养知识" value="knowledge" />
          <el-option label="客户案例" value="case" />
          <el-option label="宣传文章" value="promotion" />
        </el-select>
      </el-form-item>
      <el-form-item label="状态" prop="status">
        <el-select v-model="queryParams.status" placeholder="请选择状态" clearable>
          <el-option label="已发布" :value="1" />
          <el-option label="草稿" :value="0" />
          <el-option label="已下架" :value="2" />
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" icon="Search" @click="handleQuery">搜索</el-button>
        <el-button icon="Refresh" @click="resetQuery">重置</el-button>
      </el-form-item>
    </el-form>

    <!-- 操作按钮 -->
    <el-row :gutter="10" class="mb8">
      <el-col :span="1.5">
        <el-button type="primary" plain icon="Plus" @click="handleAdd" v-hasPermi="['care:article:add']">
          新增文章
        </el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button type="warning" plain icon="Download" @click="handleExport" v-hasPermi="['care:article:export']">
          导出
        </el-button>
      </el-col>
      <right-toolbar v-model:showSearch="showSearch" @queryTable="getList"></right-toolbar>
    </el-row>

    <!-- 文章列表 -->
    <el-table v-loading="loading" :data="articleList" style="width: 100%">
      <el-table-column label="ID" align="center" prop="id" min-width="80" />
      <el-table-column label="封面图" align="center" prop="coverImage" min-width="100">
        <template #default="scope">
          <el-image
            v-if="scope.row.coverImage"
            :src="scope.row.coverImage"
            :preview-src-list="[scope.row.coverImage]"
            style="width: 60px; height: 60px; border-radius: 4px"
            fit="cover"
          />
          <span v-else style="color: #909399">无封面</span>
        </template>
      </el-table-column>
      <el-table-column label="文章标题" align="center" prop="title" min-width="200" show-overflow-tooltip />
      <el-table-column label="分类" align="center" prop="category" min-width="120">
        <template #default="scope">
          <el-tag :type="getCategoryTag(scope.row.category)">
            {{ getCategoryName(scope.row.category) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="作者" align="center" prop="author" min-width="100" />
      <el-table-column label="浏览量" align="center" prop="viewCount" min-width="100" />
      <el-table-column label="点赞数" align="center" prop="likeCount" min-width="100" />
      <el-table-column label="状态" align="center" prop="status" min-width="100">
        <template #default="scope">
          <el-tag :type="getStatusTag(scope.row.status)">
            {{ getStatusName(scope.row.status) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="发布时间" align="center" prop="publishTime" min-width="160" />
      <el-table-column label="创建时间" align="center" prop="createAt" min-width="160" />
      <el-table-column label="操作" align="center" width="280" fixed="right">
        <template #default="scope">
          <el-button link type="primary" icon="View" @click="handleView(scope.row)" v-hasPermi="['care:article:query']">
            查看
          </el-button>
          <el-button link type="primary" icon="Edit" @click="handleEdit(scope.row)" v-hasPermi="['care:article:edit']">
            编辑
          </el-button>
          <el-button 
            link 
            :type="scope.row.status === 1 ? 'warning' : 'success'" 
            :icon="scope.row.status === 1 ? 'Download' : 'Upload'"
            @click="handleToggleStatus(scope.row)" 
            v-hasPermi="['care:article:status']"
          >
            {{ scope.row.status === 1 ? '下架' : '发布' }}
          </el-button>
          <el-button link type="danger" icon="Delete" @click="handleDelete(scope.row)" v-hasPermi="['care:article:remove']">
            删除
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 分页 -->
    <pagination
      v-show="total > 0"
      :total="total"
      v-model:page="queryParams.pageNum"
      v-model:limit="queryParams.pageSize"
      @pagination="getList"
    />

    <!-- 新增/编辑对话框 -->
    <el-dialog :title="dialogTitle" v-model="dialogVisible" width="90%" append-to-body top="5vh">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="130px">
         <el-row :gutter="20">
          <el-col :span="24">
            <el-form-item label="封面图" prop="coverImage">
              <el-upload
                class="cover-uploader"
                :action="uploadUrl"
                :headers="uploadHeaders"
                :show-file-list="false"
                :on-success="handleCoverSuccess"
                :before-upload="beforeCoverUpload"
                accept="image/*"
              >
                <img v-if="form.coverImage" :src="form.coverImage" class="cover-image" />
                <el-icon v-else class="cover-uploader-icon"><Plus /></el-icon>
              </el-upload>
            </el-form-item>
          </el-col>
        </el-row>
      <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item label="文章分类" prop="category">
              <el-select v-model="form.category" placeholder="请选择分类" style="width: 100%">
                <el-option label="门店新闻" value="news" />
                <el-option label="活动报道" value="activity" />
                <el-option label="宠物知识" value="knowledge" />
                <el-option label="客户案例" value="case" />
                <el-option label="宣传文章" value="promotion" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="作者" prop="author">
              <el-input v-model="form.author" placeholder="请输入作者" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="16">
            <el-form-item label="文章标题" prop="title">
              <el-input v-model="form.title" placeholder="请输入文章标题" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="文章摘要" prop="summary">
          <el-input v-model="form.summary" type="textarea" :rows="3" placeholder="请输入文章摘要（选填）" />
        </el-form-item>
        <el-row :gutter="20">
          <el-form-item label="文章内容" prop="content" style="width: 100%">
          <div style="border: 1px solid #ccc; z-index: 10000;width: 100%;">
            <Toolbar
              style="border-bottom: 1px solid #ccc"
              :editor="editorRef"
              :defaultConfig="toolbarConfig"
              mode="default"
            />
            <Editor
              style="height: 500px; overflow-y: hidden;"
              v-model="form.content"
              :defaultConfig="editorConfig"
              mode="default"
              @onCreated="handleCreated"
            />
          </div>
        </el-form-item>
        </el-row>
        <el-form-item label="标签" prop="tags">
          <el-select
            v-model="form.tags"
            multiple
            filterable
            allow-create
            placeholder="请输入标签，回车添加"
            style="width: 100%"
          >
          </el-select>
        </el-form-item>

        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item label="排序" prop="sortOrder">
              <el-input-number v-model="form.sortOrder" :min="0" :max="9999" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="状态" prop="status">
              <el-select v-model="form.status" style="width: 100%">
                <el-option label="草稿" :value="0" />
                <el-option label="已发布" :value="1" />
                <el-option label="已下架" :value="2" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="置顶" prop="isTop">
              <el-switch v-model="form.isTop" :active-value="1" :inactive-value="0" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="备注" prop="remark">
          <el-input v-model="form.remark" type="textarea" :rows="2" placeholder="请输入备注" />
        </el-form-item>

        <el-divider content-position="left">SEO优化</el-divider>

        <el-form-item label="SEO标题" prop="seoTitle">
          <el-input v-model="form.seoTitle" placeholder="留空则使用文章标题" />
          <span style="color: #909399; font-size: 12px;">搜索引擎展示的标题，建议50个字符以内</span>
        </el-form-item>

        <el-form-item label="SEO关键词" prop="seoKeywords">
          <el-input v-model="form.seoKeywords" placeholder="多个关键词用逗号分隔" />
          <span style="color: #909399; font-size: 12px;">建议3-5个关键词，用逗号分隔</span>
        </el-form-item>

        <el-form-item label="SEO描述" prop="seoDescription">
          <el-input v-model="form.seoDescription" type="textarea" :rows="3" placeholder="留空则使用文章摘要" />
          <span style="color: #909399; font-size: 12px;">搜索引擎展示的描述，建议150个字符以内</span>
        </el-form-item>

        <!-- SEO评分 -->
        <el-form-item label="SEO评分">
          <div style="width: 100%">
            <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 8px">
              <div style="flex: 1">
                <el-progress 
                  :percentage="seoScore.score" 
                  :color="seoScoreText.color"
                  :stroke-width="12"
                />
              </div>
              <div :style="{ fontSize: '16px', fontWeight: 'bold', color: seoScoreText.color }">
                {{ seoScore.score }}分 - {{ seoScoreText.text }}
              </div>
            </div>
            <div v-if="seoScore.tips.length > 0" style="color: #E6A23C; font-size: 12px">
              <div v-for="(tip, index) in seoScore.tips" :key="index" style="margin-bottom: 4px">
                <el-icon><WarningFilled /></el-icon>
                {{ tip }}
              </div>
            </div>
          </div>
        </el-form-item>
      </el-form>
      <template #footer>
        <div style="display: flex; justify-content: space-between; align-items: center; width: 100%">
          <div style="display: flex; align-items: center; gap: 16px">
            <!-- 自动保存状态 -->
            <div style="color: #909399; font-size: 12px">
              <span v-if="!form.id && autoSaveStatus" :style="{ color: autoSaveColor }">
                <el-icon v-if="autoSaveStatus === 'saving'" class="is-loading"><Loading /></el-icon>
                <el-icon v-else><SuccessFilled /></el-icon>
                {{ autoSaveText }}
              </span>
            </div>
            <!-- 字数统计 -->
            <div v-if="form.content" style="color: #909399; font-size: 12px">
              <span>字数：{{ contentLength }}</span>
              <span style="margin-left: 8px">图片：{{ imageCount }}张</span>
            </div>
          </div>
          <div style="display: flex; gap: 8px">
            <el-button @click="showPreview = true" v-if="form.content">
              <el-icon><View /></el-icon>
              预览
            </el-button>
            <el-button @click="dialogVisible = false">取消</el-button>
            <el-button type="primary" @click="submitForm" :loading="submitLoading">确定</el-button>
          </div>
        </div>
      </template>
    </el-dialog>

    <!-- 查看文章对话框 -->
    <el-dialog title="文章详情" v-model="viewDialogVisible" width="900px" append-to-body top="5vh">
      <div class="article-view">
        <h1 class="article-title">{{ viewData.title }}</h1>
        <div class="article-meta">
          <span>分类：{{ getCategoryName(viewData.category) }}</span>
          <span>作者：{{ viewData.author }}</span>
          <span>发布时间：{{ viewData.publishTime }}</span>
          <span>浏览量：{{ viewData.viewCount }}</span>
        </div>
        <el-image
          v-if="viewData.coverImage"
          :src="viewData.coverImage"
          style="width: 100%; max-height: 400px; margin: 20px 0"
          fit="contain"
        />
        <div class="article-content" v-html="viewData.content"></div>
      </div>
    </el-dialog>

    <!-- 预览对话框 -->
    <el-dialog title="文章预览" v-model="showPreview" width="900px" append-to-body top="5vh">
      <div class="article-preview">
        <h1 class="preview-title">{{ form.title || '未设置标题' }}</h1>
        <div class="preview-meta">
          <el-tag :type="getCategoryTag(form.category)" size="small">
            {{ getCategoryName(form.category) || '未分类' }}
          </el-tag>
          <span v-if="form.author">作者：{{ form.author }}</span>
        </div>
        <el-image
          v-if="form.coverImage"
          :src="form.coverImage"
          style="width: 100%; max-height: 400px; margin: 20px 0"
          fit="contain"
        />
        <div class="preview-content" v-html="form.content"></div>
        <el-divider />
        <div class="preview-seo">
          <h4>SEO信息</h4>
          <p><strong>SEO标题：</strong>{{ form.seoTitle || form.title || '未设置' }}</p>
          <p><strong>关键词：</strong>{{ form.seoKeywords || '未设置' }}</p>
          <p><strong>描述：</strong>{{ form.seoDescription || form.summary || '未设置' }}</p>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup name="StoreArticle">
import { ref, reactive, computed, shallowRef, onBeforeUnmount, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Loading, SuccessFilled, WarningFilled, View } from '@element-plus/icons-vue'
import '@wangeditor/editor/dist/css/style.css'
import { Editor, Toolbar } from '@wangeditor/editor-for-vue'
import {
  getArticleList,
  submitArticle,
  deleteArticle,
  exportArticle,
  updateArticleStatus
} from '@/api/care/article'

const articleList = ref([])
const loading = ref(true)
const showSearch = ref(true)
const total = ref(0)
const dialogVisible = ref(false)
const viewDialogVisible = ref(false)
const submitLoading = ref(false)
const dialogTitle = ref('')

// 自动保存状态
const autoSaveStatus = ref('') // 'saving' | 'saved' | ''
const autoSaveText = computed(() => {
  if (autoSaveStatus.value === 'saving') return '正在保存草稿...'
  if (autoSaveStatus.value === 'saved') return '草稿已自动保存'
  return ''
})
const autoSaveColor = computed(() => {
  if (autoSaveStatus.value === 'saving') return '#E6A23C'
  if (autoSaveStatus.value === 'saved') return '#67C23A'
  return '#909399'
})

// 字数统计
const contentLength = computed(() => {
  if (!form.content) return 0
  // 去除HTML标签后统计字数
  const text = form.content.replace(/<[^>]+>/g, '')
  return text.length
})

const imageCount = computed(() => {
  if (!form.content) return 0
  const matches = form.content.match(/<img[^>]+>/g)
  return matches ? matches.length : 0
})

// SEO评分
const seoScore = computed(() => {
  let score = 0
  let tips = []
  
  // SEO标题（20分）
  if (form.seoTitle) {
    if (form.seoTitle.length <= 50) {
      score += 20
    } else {
      tips.push('SEO标题建议50个字符以内')
      score += 10
    }
  } else {
    tips.push('建议设置SEO标题')
  }
  
  // SEO关键词（30分）
  if (form.seoKeywords) {
    const keywords = form.seoKeywords.split(',').filter(k => k.trim())
    if (keywords.length >= 3 && keywords.length <= 5) {
      score += 30
    } else if (keywords.length > 0) {
      tips.push('建议设置3-5个关键词')
      score += 15
    }
  } else {
    tips.push('建议设置SEO关键词')
  }
  
  // SEO描述（20分）
  if (form.seoDescription) {
    if (form.seoDescription.length <= 150) {
      score += 20
    } else {
      tips.push('SEO描述建议150个字符以内')
      score += 10
    }
  } else {
    tips.push('建议设置SEO描述')
  }
  
  // 描述包含关键词（15分）
  if (form.seoDescription && form.seoKeywords) {
    const keywords = form.seoKeywords.split(',').filter(k => k.trim())
    const hasKeyword = keywords.some(k => form.seoDescription.includes(k.trim()))
    if (hasKeyword) {
      score += 15
    } else {
      tips.push('SEO描述建议包含关键词')
    }
  }
  
  // 有封面图（15分）
  if (form.coverImage) {
    score += 15
  } else {
    tips.push('建议上传封面图')
  }
  
  return { score, tips }
})

const seoScoreText = computed(() => {
  const score = seoScore.value.score
  if (score >= 80) return { text: '优秀', color: '#67C23A' }
  if (score >= 60) return { text: '良好', color: '#E6A23C' }
  if (score >= 40) return { text: '一般', color: '#F56C6C' }
  return { text: '待优化', color: '#909399' }
})

// 预览对话框
const showPreview = ref(false)

const queryParams = reactive({
  pageNum: 1,
  pageSize: 10,
  title: undefined,
  category: undefined,
  status: undefined
})

const form = reactive({
  id: undefined,
  title: '',
  category: '',
  author: '',
  coverImage: '',
  summary: '',
  content: '',
  tags: [],
  sortOrder: 0,
  status: 0,
  isTop: 0,
  // SEO优化字段
  seoTitle: '',
  seoKeywords: '',
  seoDescription: '',
  remark: ''
})

const viewData = reactive({
  id: undefined,
  title: '',
  category: '',
  author: '',
  coverImage: '',
  publishTime: '',
  viewCount: 0,
  content: ''
})

const rules = {
  title: [{ required: true, message: '请输入文章标题', trigger: 'blur' }],
  category: [{ required: true, message: '请选择文章分类', trigger: 'change' }],
  author: [{ required: true, message: '请输入作者', trigger: 'blur' }],
  content: [{ required: true, message: '请输入文章内容', trigger: 'blur' }]
}

const formRef = ref(null)

// 自动保存草稿相关
let autoSaveTimer = null
const AUTO_SAVE_INTERVAL = 30000 // 30秒

// 富文本编辑器配置
const editorRef = shallowRef()
const toolbarConfig = {
  excludeKeys: ['fullScreen']  // 排除全屏按钮
}
const editorConfig = {
  placeholder: '请输入文章内容...',
  MENU_CONF: {
    uploadImage: {
      server: import.meta.env.VITE_APP_BASE_API + '/common/upload',
      fieldName: 'file',
      maxFileSize: 5 * 1024 * 1024, // 5M
      maxNumberOfFiles: 10,
      allowedFileTypes: ['image/*'],
      headers: {
        Authorization: 'Bearer ' + localStorage.getItem('token')
      },
      customInsert(res, insertFn) {
        // res 即服务端的返回结果
        // 从 res 中找到 url alt href ，然后插入图片
        insertFn(res.data.url, res.data.fileName || '', res.data.url)
      }
    }
  }
}

// 编辑器销毁
const handleCreated = (editor) => {
  editorRef.value = editor
}

onBeforeUnmount(() => {
  const editor = editorRef.value
  if (editor == null) return
  editor.destroy()
  
  // 清理自动保存定时器
  if (autoSaveTimer) {
    clearInterval(autoSaveTimer)
    autoSaveTimer = null
  }
})

/** 启动自动保存 */
function startAutoSave() {
  // 清理旧的定时器
  if (autoSaveTimer) {
    clearInterval(autoSaveTimer)
  }
  
  // 每30秒自动保存草稿
  autoSaveTimer = setInterval(() => {
    // 只在新增文章时保存草稿
    if (form.content && !form.id) {
      try {
        autoSaveStatus.value = 'saving'
        const draftData = {
          title: form.title,
          category: form.category,
          author: form.author,
          coverImage: form.coverImage,
          summary: form.summary,
          content: form.content,
          tags: form.tags,
          seoTitle: form.seoTitle,
          seoKeywords: form.seoKeywords,
          seoDescription: form.seoDescription,
          savedAt: new Date().toISOString()
        }
        localStorage.setItem('article_draft', JSON.stringify(draftData))
        autoSaveStatus.value = 'saved'
        console.log('草稿自动保存成功:', new Date().toLocaleString())
        
        // 3秒后隐藏状态
        setTimeout(() => {
          if (autoSaveStatus.value === 'saved') {
            autoSaveStatus.value = ''
          }
        }, 3000)
      } catch (error) {
        autoSaveStatus.value = ''
        console.error('草稿自动保存失败:', error)
      }
    }
  }, AUTO_SAVE_INTERVAL)
}

/** 停止自动保存 */
function stopAutoSave() {
  if (autoSaveTimer) {
    clearInterval(autoSaveTimer)
    autoSaveTimer = null
  }
}

/** 加载草稿 */
function loadDraft() {
  try {
    const draftStr = localStorage.getItem('article_draft')
    if (draftStr) {
      const draftData = JSON.parse(draftStr)
      // 如果草稿是7天内保存的，提示是否恢复
      const savedAt = new Date(draftData.savedAt)
      const now = new Date()
      const daysDiff = (now - savedAt) / (1000 * 60 * 60 * 24)
      
      if (daysDiff < 7 && draftData.content) {
        ElMessageBox.confirm(
          `发现${Math.floor(daysDiff)}天前保存的草稿，是否恢复？`,
          '提示',
          {
            confirmButtonText: '恢复',
            cancelButtonText: '放弃',
            type: 'info'
          }
        ).then(() => {
          form.title = draftData.title || ''
          form.category = draftData.category || ''
          form.author = draftData.author || ''
          form.coverImage = draftData.coverImage || ''
          form.summary = draftData.summary || ''
          form.content = draftData.content || ''
          form.tags = draftData.tags || []
          form.seoTitle = draftData.seoTitle || ''
          form.seoKeywords = draftData.seoKeywords || ''
          form.seoDescription = draftData.seoDescription || ''
          ElMessage.success('草稿已恢复')
          // 启动自动保存
          startAutoSave()
        }).catch(() => {
          // 放弃草稿
          localStorage.removeItem('article_draft')
          ElMessage.info('已放弃草稿')
          // 启动自动保存
          startAutoSave()
        })
        return
      }
    }
    // 没有草稿或草稿过期，直接启动自动保存
    startAutoSave()
  } catch (error) {
    console.error('加载草稿失败:', error)
    startAutoSave()
  }
}

/** 清除草稿 */
function clearDraft() {
  localStorage.removeItem('article_draft')
  stopAutoSave()
}

// 上传配置
const uploadUrl = computed(() => import.meta.env.VITE_APP_BASE_API + '/common/upload')
const uploadHeaders = computed(() => ({
  Authorization: 'Bearer ' + localStorage.getItem('token')
}))

/** 获取分类标签 */
function getCategoryTag(category) {
  const tags = {
    news: 'primary',
    activity: 'success',
    knowledge: 'warning',
    case: 'info',
    promotion: 'danger'
  }
  return tags[category] || ''
}

/** 获取分类名称 */
function getCategoryName(category) {
  const names = {
    news: '门店新闻',
    activity: '活动报道',
    knowledge: '康养知识',
    case: '客户案例',
    promotion: '宣传文章'
  }
  return names[category] || category
}

/** 获取状态标签 */
function getStatusTag(status) {
  const tags = { 0: 'info', 1: 'success', 2: 'warning' }
  return tags[status] || ''
}

/** 获取状态名称 */
function getStatusName(status) {
  const names = { 0: '草稿', 1: '已发布', 2: '已下架' }
  return names[status] || '未知'
}

/** 查询列表 */
function getList() {
  loading.value = true
  getArticleList(queryParams).then(response => {
    articleList.value = response.data.list || response.data.rows
    total.value = response.data.totalCount || response.data.total
    loading.value = false
  }).catch(() => {
    loading.value = false
  })
}

/** 搜索 */
function handleQuery() {
  queryParams.pageNum = 1
  getList()
}

/** 重置 */
function resetQuery() {
  handleQuery()
}

/** 新增 */
function handleAdd() {
  resetForm()
  dialogTitle.value = '新增文章'
  dialogVisible.value = true
  // 加载草稿
  loadDraft()
}

/** 查看 */
function handleView(row) {
  Object.assign(viewData, row)
  viewDialogVisible.value = true
}

/** 编辑 */
function handleEdit(row) {
  resetForm()
  dialogTitle.value = '编辑文章'
  Object.assign(form, row)
  // 如果tags是字符串，转换为数组
  if (typeof form.tags === 'string') {
    form.tags = form.tags ? form.tags.split(',') : []
  }
  dialogVisible.value = true
}

/** 切换状态 */
function handleToggleStatus(row) {
  const newStatus = row.status === 1 ? 2 : 1
  const action = newStatus === 1 ? '发布' : '下架'
  
  ElMessageBox.confirm(`确认${action}该文章？`, '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    updateArticleStatus({ id: row.id, status: newStatus }).then(response => {
      ElMessage.success(`${action}成功`)
      getList()
    })
  }).catch(() => {})
}

/** 提交 */
function submitForm() {
  formRef.value.validate(valid => {
    if (valid) {
      submitLoading.value = true
      // 如果tags是数组，转换为字符串
      const submitData = { ...form }
      if (Array.isArray(submitData.tags)) {
        submitData.tags = submitData.tags.join(',')
      }
      
      submitArticle(submitData).then(response => {
        ElMessage.success(form.id ? '修改成功' : '新增成功')
        dialogVisible.value = false
        // 发布成功后清除草稿
        if (!form.id) {
          clearDraft()
        }
        getList()
      }).catch(() => {
        submitLoading.value = false
      })
    }
  })
}

/** 删除 */
function handleDelete(row) {
  ElMessageBox.confirm('确认删除该文章？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    deleteArticle(row.id).then(response => {
      ElMessage.success('删除成功')
      getList()
    })
  }).catch(() => {})
}

/** 导出 */
function handleExport() {
  ElMessageBox.confirm('是否确认导出文章数据？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    return exportArticle(queryParams)
  }).then(response => {
    const blob = new Blob([response.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = '文章报道_' + new Date().getTime() + '.xlsx'
    link.click()
    window.URL.revokeObjectURL(url)
    ElMessage.success('导出成功')
  }).catch(() => {})
}

/** 封面图上传成功 */
function handleCoverSuccess(response) {
  form.coverImage = response.data.url || response.data
  ElMessage.success('上传成功')
}

/** 封面图上传前校验 */
function beforeCoverUpload(file) {
  const isImage = file.type.startsWith('image/')
  const isLt2M = file.size / 1024 / 1024 < 2

  if (!isImage) {
    ElMessage.error('只能上传图片文件!')
    return false
  }
  if (!isLt2M) {
    ElMessage.error('图片大小不能超过 2MB!')
    return false
  }
  return true
}

/** 重置表单 */
function resetForm() {
  form.id = undefined
  form.title = ''
  form.category = ''
  form.author = ''
  form.coverImage = ''
  form.summary = ''
  form.content = ''
  form.tags = []
  form.sortOrder = 0
  form.status = 0
  form.isTop = 0
  form.seoTitle = ''
  form.seoKeywords = ''
  form.seoDescription = ''
  form.remark = ''
  // 停止自动保存
  stopAutoSave()
}

getList()
</script>

<style scoped>
.cover-uploader {
  border: 1px dashed #d9d9d9;
  border-radius: 6px;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  width: 150px;
  height: 150px;
}

.cover-uploader:hover {
  border-color: #409eff;
}

.cover-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.cover-uploader-icon {
  font-size: 28px;
  color: #8c939d;
  width: 150px;
  height: 150px;
  line-height: 150px;
  text-align: center;
}

.article-view {
  padding: 20px;
}

.article-title {
  font-size: 24px;
  font-weight: bold;
  margin-bottom: 16px;
  color: #303133;
}

.article-meta {
  display: flex;
  gap: 20px;
  color: #909399;
  font-size: 14px;
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 1px solid #ebeef5;
}

.article-content {
  line-height: 1.8;
  color: #606266;
  font-size: 16px;
  white-space: pre-wrap;
}

.article-preview {
  padding: 20px;
}

.preview-title {
  font-size: 24px;
  font-weight: bold;
  margin-bottom: 16px;
  color: #303133;
}

.preview-meta {
  display: flex;
  gap: 12px;
  align-items: center;
  color: #909399;
  font-size: 14px;
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 1px solid #ebeef5;
}

.preview-content {
  line-height: 1.8;
  color: #606266;
  font-size: 16px;
  min-height: 200px;
}

.preview-content :deep(h1),
.preview-content :deep(h2),
.preview-content :deep(h3),
.preview-content :deep(h4) {
  margin-top: 24px;
  margin-bottom: 16px;
  font-weight: bold;
  color: #303133;
}

.preview-content :deep(p) {
  margin-bottom: 16px;
}

.preview-content :deep(img) {
  max-width: 100%;
  height: auto;
  margin: 16px 0;
}

.preview-content :deep(table) {
  border-collapse: collapse;
  width: 100%;
  margin: 16px 0;
}

.preview-content :deep(table td),
.preview-content :deep(table th) {
  border: 1px solid #ebeef5;
  padding: 8px 12px;
}

.preview-seo {
  background: #f5f7fa;
  padding: 16px;
  border-radius: 4px;
  margin-top: 20px;
}

.preview-seo h4 {
  margin: 0 0 12px 0;
  color: #303133;
  font-size: 16px;
}

.preview-seo p {
  margin: 8px 0;
  color: #606266;
  font-size: 14px;
  line-height: 1.6;
}
</style>
