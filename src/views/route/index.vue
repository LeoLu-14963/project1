<template>
  <div class="route-container">
    <!-- 页面标题 -->
    <div class="page-header">
      <div class="header-left">
        <h2>路线配置</h2>
        <p class="text-secondary">配置和管理逻辑搬运路线</p>
      </div>
      <div class="header-right">
        <el-button type="primary" @click="showTemplateDialog = true">
          <el-icon><Download /></el-icon> 下载模板
        </el-button>
        <el-button type="success" @click="showUploadDialog = true">
          <el-icon><Upload /></el-icon> 上传配置
        </el-button>
      </div>
    </div>

    <!-- 操作说明卡片 -->
    <el-row :gutter="20" class="workflow-row">
      <el-col :span="24">
        <el-card class="workflow-card" shadow="hover">
          <template #header>
            <div class="card-header">
              <span><el-icon><Guide /></el-icon> 路线配置流程</span>
            </div>
          </template>
          <el-steps :active="3" finish-status="success" simple>
            <el-step title="下载模板" description="获取JSON或Excel标准模板" />
            <el-step title="编辑配置" description="按需求编辑路线数据" />
            <el-step title="上传" description="上传配置文件" />
            <el-step title="发布生效" description="发布后路线可被工单使用" />
          </el-steps>
        </el-card>
      </el-col>
    </el-row>

    <!-- 配置列表 -->
    <el-card class="config-list-card" shadow="never">
      <template #header>
        <div class="card-header">
          <span><el-icon><Files /></el-icon> 配置列表</span>
          <div class="header-actions">
            <el-button type="primary" @click="handleRefreshConfig">
              <el-icon><Refresh /></el-icon> 刷新
            </el-button>
          </div>
        </div>
      </template>
      <el-table :data="configList" stripe v-loading="configLoading" @row-click="handleSelectConfig" highlight-current-row>
        <el-table-column type="index" width="50" />
        <el-table-column label="配置名称" prop="configName" min-width="150" />
        <el-table-column label="文件名称" prop="fileName" min-width="150" />
        <el-table-column label="配置说明" prop="configDescription" min-width="200" />
        <el-table-column label="线路数量" prop="routeCount" width="100" align="center" />
        <el-table-column label="状态" prop="status" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="row.status === 'published' ? 'success' : 'warning'">
              {{ row.status === 'published' ? '已发布' : '草稿' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="创建人" prop="creator" width="120" />
        <el-table-column label="创建时间" prop="createTime" width="180" />
        <el-table-column label="操作" width="280" fixed="right" align="center">
          <template #default="{ row }">
            <el-button 
              v-if="row.status !== 'published'" 
              type="success" 
              link 
              @click.stop="handlePublishConfig(row)"
            >
              <el-icon><CircleCheck /></el-icon> 发布
            </el-button>
            <el-button 
              v-else 
              type="warning" 
              link 
              @click.stop="handleUnpublishConfig(row)"
            >
              <el-icon><Close /></el-icon> 取消发布
            </el-button>
            <el-button type="primary" link @click.stop="handleDownloadConfig(row)">
              <el-icon><Download /></el-icon> 下载
            </el-button>
            <el-button type="danger" link @click.stop="handleDeleteConfig(row)">
              <el-icon><Delete /></el-icon> 删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 路线列表 -->
    <el-card class="route-list-card" shadow="never" v-if="selectedConfig">
      <template #header>
        <div class="card-header">
          <span>
            <el-icon><MapLocation /></el-icon> 
            路线列表 - {{ selectedConfig.configName }}
            <span v-if="selectedConfig.status === 'published'" class="custom-status-tag success-tag">
              <el-icon><CircleCheck /></el-icon>
              <span>已发布</span>
            </span>
            <span v-else class="custom-status-tag warning-tag">
              <el-icon><Warning /></el-icon>
              <span>草稿（不可用）</span>
            </span>
          </span>
          <div class="header-actions">
            <el-button type="success" @click="handleAddRoute">
              <el-icon><Plus /></el-icon> 新增路线
            </el-button>
            <el-input
              v-model="searchKeyword"
              placeholder="搜索路线名称/编号"
              clearable
              style="width: 220px"
            >
              <template #prefix>
                <el-icon><Search /></el-icon>
              </template>
            </el-input>
            <el-button type="primary" @click="handleRefresh">
              <el-icon><Refresh /></el-icon> 刷新
            </el-button>
          </div>
        </div>
      </template>
      <el-table :data="filteredRoutes" stripe v-loading="loading">
        <el-table-column type="index" width="50" />
        <el-table-column label="路线编号" prop="routeCode" min-width="120" />
        <el-table-column label="路线名称" prop="routeName" min-width="150" />
        <el-table-column label="起点" prop="startPoint" width="120" />
        <el-table-column label="终点" prop="endPoint" width="120" />
        <el-table-column label="子路途数" prop="pathPointCount" width="100" align="center">
          <template #default="{ row }">
            {{ row.pathPoints ? row.pathPoints.length - 1 : 0 }}
          </template>
        </el-table-column>
        <el-table-column label="距离" prop="distance" width="100">
          <template #default="{ row }">
            {{ row.distance }}m
          </template>
        </el-table-column>
        <el-table-column label="状态" prop="status" width="100" align="center">
          <template #default="{ row }">
            <el-tag 
              :type="row.status === 'enabled' ? 'success' : 'info'"
              style="cursor: pointer;"
              @click="handleToggleRouteStatus(row)"
            >
              {{ row.status === 'enabled' ? '已启用' : '已禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="180" fixed="right" align="center">
          <template #default="{ row }">
            <el-button type="primary" link @click="handleViewRoute(row)">
              <el-icon><View /></el-icon> 查看
            </el-button>
            <el-button type="primary" link @click="handleEditRoute(row)">
              <el-icon><Edit /></el-icon> 编辑
            </el-button>
            <el-button type="danger" link @click="handleDeleteRoute(row)">
              <el-icon><Delete /></el-icon> 删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 模板下载对话框 -->
    <el-dialog
      v-model="showTemplateDialog"
      title="下载模板"
      width="500px"
    >
      <div class="template-dialog-content">
        <p class="dialog-tip">请选择需要的模板格式：</p>
        <div class="template-options">
          <div 
            v-for="template in templates" 
            :key="template.id" 
            class="template-option"
            @click="downloadTemplate(template)"
          >
            <div class="template-option-icon">
              <el-icon :size="40" :color="template.type === 'json' ? '#409EFF' : '#67C23A'">
                <Document v-if="template.type === 'json'" />
                <Tickets v-else />
              </el-icon>
            </div>
            <div class="template-option-info">
              <div class="template-option-name">{{ template.name }}</div>
              <div class="template-option-desc">{{ template.description }}</div>
            </div>
            <el-icon class="template-option-arrow"><ArrowRight /></el-icon>
          </div>
        </div>
      </div>
      <template #footer>
        <el-button @click="showTemplateDialog = false">关闭</el-button>
      </template>
    </el-dialog>

    <!-- 配置上传对话框 -->
    <el-dialog
      v-model="showUploadDialog"
      title="上传配置"
      width="600px"
      :close-on-click-modal="false"
    >
      <el-form :model="uploadForm" label-width="80px">
        <el-form-item label="配置名称" required>
          <el-input v-model="uploadForm.configName" placeholder="请输入配置名称" />
        </el-form-item>
        <el-form-item label="配置说明" required>
          <el-input 
            v-model="uploadForm.configDescription" 
            type="textarea" 
            :rows="3"
            placeholder="请输入配置说明（用于识别工厂/车间/区域）" 
          />
        </el-form-item>
        <el-form-item label="选择文件" required>
          <el-upload
            class="route-uploader"
            drag
            action="/api/route/upload"
            :auto-upload="false"
            :on-change="handleFileChange"
            :before-upload="beforeUpload"
            accept=".json,.xlsx,.xls"
            :limit="1"
            :file-list="fileList"
          >
            <el-icon :size="48" color="#409EFF"><Upload /></el-icon>
            <div class="upload-text">
              <em>点击上传</em> 或拖拽文件到此处
            </div>
            <template #tip>
              <div class="upload-tip">
                支持 JSON、Excel 格式文件，文件大小不超过 10MB
              </div>
            </template>
          </el-upload>
        </el-form-item>
      </el-form>

      <!-- 检查结果区域 -->
      <div v-if="checkResult === false" class="check-result">
        <el-alert
          title="配置检查未通过"
          type="error"
          :description="checkMessage"
          show-icon
          :closable="false"
        />
        <div v-if="checkDetails.length > 0" class="check-details">
          <p style="margin-bottom: 8px; font-weight: 600;">问题详情：</p>
          <ul>
            <li v-for="(item, index) in checkDetails" :key="index" class="check-error-item">
              <el-icon><Warning /></el-icon>
              <span>{{ item }}</span>
            </li>
          </ul>
        </div>
      </div>

      <template #footer>
        <el-button @click="handleCancelUpload">取消</el-button>
        <el-button 
          type="primary" 
          @click="handleUpload" 
          :loading="uploading || checking"
          :disabled="!uploadForm.configName || !uploadForm.configDescription || !uploadForm.file"
        >
          <el-icon><Upload /></el-icon> 上传配置
        </el-button>
      </template>
    </el-dialog>

    <!-- 路线详情对话框 -->
    <el-dialog
      v-model="routeDialogVisible"
      title="路线详情"
      width="800px"
      :close-on-click-modal="false"
    >
      <div class="route-detail-container">
        <div class="route-info">
          <el-descriptions :column="2" border>
            <el-descriptions-item label="路线编号">{{ currentRoute.routeCode }}</el-descriptions-item>
            <el-descriptions-item label="路线名称">{{ currentRoute.routeName }}</el-descriptions-item>
            <el-descriptions-item label="起点">{{ currentRoute.startPoint }}</el-descriptions-item>
            <el-descriptions-item label="终点">{{ currentRoute.endPoint }}</el-descriptions-item>
            <el-descriptions-item label="距离">{{ currentRoute.distance }}m</el-descriptions-item
            >
            <el-descriptions-item label="状态">
              <el-tag :type="currentRoute.status === 'enabled' ? 'success' : 'info'">
                {{ currentRoute.status === 'enabled' ? '已启用' : '已禁用' }}
              </el-tag>
            </el-descriptions-item>
          </el-descriptions>
        </div>
        <div class="route-visualization">
          <h4>路线可视化</h4>
          <div class="canvas-container" ref="canvasContainer">
            <canvas ref="routeCanvas" :width="canvasWidth" :height="canvasHeight"></canvas>
          </div>
        </div>
      </div>
      <template #footer>
        <el-button @click="routeDialogVisible = false">关闭</el-button>
      </template>
    </el-dialog>

    <!-- 新增路线对话框 -->
    <el-dialog
      v-model="addRouteDialogVisible"
      title="新增路线"
      width="700px"
      :close-on-click-modal="false"
    >
      <el-form :model="addRouteForm" label-width="100px">
        <el-form-item label="路线编号" required>
          <el-input v-model="addRouteForm.routeCode" placeholder="请输入路线编号" />
        </el-form-item>
        <el-form-item label="路线名称" required>
          <el-input v-model="addRouteForm.routeName" placeholder="请输入路线名称" />
        </el-form-item>
        <el-form-item label="起点" required>
          <el-select v-model="addRouteForm.startPoint" placeholder="请选择起点" style="width: 100%;">
            <el-option 
              v-for="point in locationPoints" 
              :key="point" 
              :label="point" 
              :value="point" 
            />
          </el-select>
        </el-form-item>
        <el-form-item label="途经点">
          <div class="waypoints-container">
            <div v-for="(wp, index) in addRouteForm.waypoints" :key="index" class="waypoint-item">
              <el-select v-model="addRouteForm.waypoints[index]" placeholder="请选择途经点" style="flex: 1;">
                <el-option 
                  v-for="point in locationPoints" 
                  :key="point" 
                  :label="point" 
                  :value="point" 
                />
              </el-select>
              <el-button type="danger" link @click="removeWaypoint(index)">
                <el-icon><Delete /></el-icon>
              </el-button>
            </div>
            <el-button type="primary" link @click="addWaypoint">
              <el-icon><Plus /></el-icon> 添加途经点
            </el-button>
          </div>
        </el-form-item>
        <el-form-item label="终点" required>
          <el-select v-model="addRouteForm.endPoint" placeholder="请选择终点" style="width: 100%;">
            <el-option 
              v-for="point in locationPoints" 
              :key="point" 
              :label="point" 
              :value="point" 
            />
          </el-select>
        </el-form-item>
        <el-form-item label="距离">
          <el-input-number v-model="addRouteForm.distance" :min="1" :max="1000" placeholder="距离(米)" />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="addRouteForm.status" placeholder="请选择状态">
            <el-option label="已启用" value="enabled" />
            <el-option label="已禁用" value="disabled" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="addRouteDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSaveRoute">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Guide, Document, Tickets, Download, Upload, MapLocation,
  Search, Refresh, Edit, Delete, View, Files, ArrowRight,
  CircleCheck, Close, Warning, Plus
} from '@element-plus/icons-vue'

// 对话框控制
const showTemplateDialog = ref(false)
const showUploadDialog = ref(false)
const uploading = ref(false)

// 模板列表
const templates = ref([
  { id: 1, name: 'JSON 格式模板', type: 'json', description: 'JSON格式，包含一个场地所有路线的完整模板', fileName: 'route_template_all.json' },
  { id: 2, name: 'Excel 格式模板', type: 'excel', description: 'Excel格式，包含一个场地所有路线的完整模板', fileName: 'route_template_all.xlsx' }
])

// 搜索关键词
const searchKeyword = ref('')
const loading = ref(false)
const configLoading = ref(false)

// 上传表单
const uploadForm = ref({
  configName: '',
  configDescription: '',
  file: null
})
const fileList = ref([])
const checking = ref(false)
const checkResult = ref(null) // null: 未检查, true: 通过, false: 未通过
const checkMessage = ref('')
const checkDetails = ref([])

// 已上传配置列表
const configList = ref([
  { 
    id: 1, 
    configName: '第一工厂车间A配置', 
    fileName: 'factory_a_route_config.json', 
    configDescription: '第一工厂车间A的AGV路线配置', 
    routeCount: 15, 
    status: 'published',
    creator: '张三', 
    createTime: '2024-01-15 10:30:00' 
  },
  { 
    id: 2, 
    configName: '第二工厂仓库区配置', 
    fileName: 'factory_b_warehouse_config.json', 
    configDescription: '第二工厂仓库区域的输送线路线配置', 
    routeCount: 8, 
    status: 'draft',
    creator: '李四', 
    createTime: '2024-01-14 14:20:00' 
  }
])

// 选中的配置
const selectedConfig = ref(null)

// 路线列表
const routeList = ref([])

// 过滤后的路线列表
const filteredRoutes = computed(() => {
  if (!searchKeyword.value) return routeList.value
  const keyword = searchKeyword.value.toLowerCase()
  return routeList.value.filter(item =>
    item.routeCode.toLowerCase().includes(keyword) ||
    item.routeName.toLowerCase().includes(keyword)
  )
})

// 路线详情对话框
const routeDialogVisible = ref(false)
const currentRoute = ref({})
const routeCanvas = ref(null)
const canvasContainer = ref(null)
const canvasWidth = ref(700)
const canvasHeight = ref(400)

// 点位列表（下拉选择用）
const locationPoints = ref([
  '原料仓A', '原料仓B', '原料仓C',
  '生产线A-01', '生产线A-02', '生产线B-01', '生产线B-02',
  '成品仓C', '成品仓D',
  '出货口D', '出货口E',
  '回收站', '质检区', '包装区'
])

// 新增路线对话框
const addRouteDialogVisible = ref(false)
const addRouteForm = ref({
  routeCode: '',
  routeName: '',
  startPoint: '',
  waypoints: [],
  endPoint: '',
  distance: 100,
  status: 'enabled'
})

// 下载模板
const downloadTemplate = (template) => {
  if (template.type === 'json') {
    const jsonContent = JSON.stringify({
      version: '1.0',
      createTime: new Date().toISOString(),
      siteName: '场地名称',
      description: '配置说明',
      routes: [
        {
          routeCode: 'RT001',
          routeName: '示例路线',
          startPoint: '起点A',
          endPoint: '终点B',
          distance: 100,
          status: 'enabled',
          pathPoints: [
            { x: 50, y: 50 },
            { x: 200, y: 50 },
            { x: 200, y: 200 },
            { x: 400, y: 200 }
          ]
        }
      ]
    }, null, 2)
    const blob = new Blob([jsonContent], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = template.fileName
    a.click()
    URL.revokeObjectURL(url)
  } else {
    ElMessage.info('Excel模板下载功能需要后端支持')
  }
  ElMessage.success(`模板 ${template.name} 下载成功`)
  showTemplateDialog.value = false
}

// 文件上传相关
const handleFileChange = (file) => {
  uploadForm.value.file = file.raw
  fileList.value = [file]
  // 重置检查状态
  checkResult.value = null
  checkMessage.value = ''
  checkDetails.value = []
}

const beforeUpload = (file) => {
  const isSupported = file.type === 'application/json' || 
                     file.name.endsWith('.json') ||
                     file.name.endsWith('.xlsx') ||
                     file.name.endsWith('.xls')
  if (!isSupported) {
    ElMessage.error('仅支持 JSON 或 Excel 格式文件')
    return false
  }
  const isLt10M = file.size / 1024 / 1024 < 10
  if (!isLt10M) {
    ElMessage.error('文件大小不能超过 10MB')
    return false
  }
  return true
}

const handleUpload = async () => {
  if (!uploadForm.value.configName) {
    ElMessage.warning('请输入配置名称')
    return
  }
  if (!uploadForm.value.configDescription) {
    ElMessage.warning('请输入配置说明')
    return
  }
  if (!uploadForm.value.file) {
    ElMessage.warning('请选择文件')
    return
  }

  // 先执行配置检查
  checking.value = true
  checkResult.value = null
  checkMessage.value = ''
  checkDetails.value = []

  try {
    const file = uploadForm.value.file
    const fileName = file.name.toLowerCase()
    const errors = []

    // 1. 检查文件格式
    if (!fileName.endsWith('.json') && !fileName.endsWith('.xlsx') && !fileName.endsWith('.xls')) {
      errors.push('文件格式不支持，请使用 JSON 或 Excel 格式')
    }

    // 2. 检查文件大小
    if (file.size > 10 * 1024 * 1024) {
      errors.push('文件大小超过 10MB 限制')
    }

    // 3. 如果是 JSON 文件，尝试解析并验证内容
    if (fileName.endsWith('.json') && errors.length === 0) {
      try {
        const text = await readFileAsText(file)
        const jsonData = JSON.parse(text)
        
        // 验证必要字段
        if (!jsonData.version) {
          errors.push('配置文件缺少 version 字段')
        }
        if (!jsonData.routes || !Array.isArray(jsonData.routes)) {
          errors.push('配置文件缺少 routes 数组')
        } else if (jsonData.routes.length === 0) {
          errors.push('配置文件中没有路线数据')
        } else {
          // 验证每条路线的必要字段
          jsonData.routes.forEach((route, index) => {
            if (!route.routeCode) {
              errors.push(`第 ${index + 1} 条路线缺少 routeCode 字段`)
            }
            if (!route.routeName) {
              errors.push(`第 ${index + 1} 条路线缺少 routeName 字段`)
            }
            if (!route.startPoint) {
              errors.push(`第 ${index + 1} 条路线缺少 startPoint 字段`)
            }
            if (!route.endPoint) {
              errors.push(`第 ${index + 1} 条路线缺少 endPoint 字段`)
            }
          })
        }
      } catch (e) {
        if (e instanceof SyntaxError) {
          errors.push('JSON 格式错误，请检查文件内容')
        } else {
          errors.push('无法读取文件内容')
        }
      }
    }

    // 随机模拟一些错误（用于演示）
    if (Math.random() > 0.5 && errors.length === 0) {
      errors.push('路线 RT005 的终点位置不存在于场地地图中')
      errors.push('路线 RT012 的距离超过最大限制 (500m)')
    }

    if (errors.length > 0) {
      checkResult.value = false
      checkMessage.value = `发现 ${errors.length} 个问题，请修正后重新上传`
      checkDetails.value = errors
      checking.value = false
      return
    }

    // 检查通过，执行上传
    checkResult.value = true
    checking.value = false
    uploading.value = true

    setTimeout(() => {
      uploading.value = false
      
      // 添加新配置到列表
      const newConfig = {
        id: Date.now(),
        configName: uploadForm.value.configName,
        fileName: uploadForm.value.file.name,
        configDescription: uploadForm.value.configDescription,
        routeCount: Math.floor(Math.random() * 20) + 5,
        status: 'draft',
        creator: '当前用户',
        createTime: new Date().toLocaleString('zh-CN')
      }
      configList.value.unshift(newConfig)
      
      // 重置表单
      uploadForm.value = {
        configName: '',
        configDescription: '',
        file: null
      }
      fileList.value = []
      checkResult.value = null
      checkMessage.value = ''
      checkDetails.value = []
      showUploadDialog.value = false
      
      ElMessage.success('路线配置上传成功')
    }, 1500)

  } catch (error) {
    checking.value = false
    checkResult.value = false
    checkMessage.value = '检查过程中发生错误，请重试'
    checkDetails.value = [error.message]
  }
}

const handleCancelUpload = () => {
  uploadForm.value = {
    configName: '',
    configDescription: '',
    file: null
  }
  fileList.value = []
  checkResult.value = null
  checkMessage.value = ''
  checkDetails.value = []
  showUploadDialog.value = false
}

// 读取文件内容
const readFileAsText = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => resolve(e.target.result)
    reader.onerror = (e) => reject(e)
    reader.readAsText(file)
  })
}

// 配置列表操作
const handleRefreshConfig = () => {
  configLoading.value = true
  setTimeout(() => {
    configLoading.value = false
    ElMessage.success('配置列表已刷新')
  }, 500)
}

const handleSelectConfig = (row) => {
  selectedConfig.value = row
  // 模拟加载该配置的路线数据
  loading.value = true
  setTimeout(() => {
    routeList.value = generateSampleRoutes(row.routeCount)
    loading.value = false
  }, 500)
}

const handlePublishConfig = (row) => {
  ElMessageBox.confirm(
    `确定要发布配置 "${row.configName}" 吗？\n发布后该配置的路线将可以被工单和任务使用。`,
    '发布确认',
    { confirmButtonText: '确定发布', cancelButtonText: '取消', type: 'success' }
  ).then(() => {
    row.status = 'published'
    if (selectedConfig.value && selectedConfig.value.id === row.id) {
      selectedConfig.value.status = 'published'
    }
    ElMessage.success('配置发布成功，现在可以被工单和任务使用了')
  }).catch(() => {})
}

const handleUnpublishConfig = (row) => {
  ElMessageBox.confirm(
    `确定要取消发布配置 "${row.configName}" 吗？\n取消后该配置的路线将不再可用。`,
    '取消发布确认',
    { confirmButtonText: '确定取消', cancelButtonText: '取消', type: 'warning' }
  ).then(() => {
    row.status = 'draft'
    if (selectedConfig.value && selectedConfig.value.id === row.id) {
      selectedConfig.value.status = 'draft'
    }
    ElMessage.success('配置已取消发布')
  }).catch(() => {})
}

const handleDownloadConfig = (row) => {
  ElMessage.info(`下载配置：${row.configName}`)
}

const handleDeleteConfig = (row) => {
  ElMessageBox.confirm(
    `确定要删除配置 "${row.configName}" 吗？此操作不可恢复！`,
    '警告',
    { confirmButtonText: '确定', cancelButtonText: '取消', type: 'danger' }
  ).then(() => {
    const index = configList.value.findIndex(item => item.id === row.id)
    if (index > -1) {
      configList.value.splice(index, 1)
    }
    if (selectedConfig.value && selectedConfig.value.id === row.id) {
      selectedConfig.value = null
      routeList.value = []
    }
    ElMessage.success('配置删除成功')
  }).catch(() => {})
}

// 生成示例路线数据
const generateSampleRoutes = (count) => {
  const routes = []
  
  for (let i = 0; i < count; i++) {
    // 随机选择起点、终点和途经点
    const shuffled = [...locationPoints.value].sort(() => Math.random() - 0.5)
    const waypointCount = Math.floor(Math.random() * 3) // 0-2个途经点
    const fullPoints = shuffled.slice(0, 2 + waypointCount)
    
    routes.push({
      routeCode: `RT${String(i + 1).padStart(3, '0')}`,
      routeName: `${fullPoints[0]}到${fullPoints[fullPoints.length - 1]}`,
      startPoint: fullPoints[0],
      endPoint: fullPoints[fullPoints.length - 1],
      waypoints: fullPoints.slice(1, -1),
      fullPoints: fullPoints,
      distance: Math.floor(Math.random() * 300) + 50,
      status: Math.random() > 0.3 ? 'enabled' : 'disabled',
      pathPoints: generatePathFromPoints(fullPoints)
    })
  }
  return routes
}



// 路线操作
const handleRefresh = () => {
  loading.value = true
  setTimeout(() => {
    loading.value = false
    ElMessage.success('路线列表已刷新')
  }, 500)
}

const handleViewRoute = (row) => {
  currentRoute.value = row
  routeDialogVisible.value = true
  nextTick(() => {
    drawRoute()
  })
}

const handleEditRoute = (row) => {
  ElMessage.info(`编辑路线：${row.routeName}`)
}

const handleToggleRouteStatus = (row) => {
  const newStatus = row.status === 'enabled' ? 'disabled' : 'enabled'
  const actionText = newStatus === 'enabled' ? '启用' : '禁用'
  
  ElMessageBox.confirm(
    `确定要${actionText}路线 "${row.routeName}" 吗？`,
    '提示',
    { confirmButtonText: '确定', cancelButtonText: '取消', type: 'warning' }
  ).then(() => {
    row.status = newStatus
    ElMessage.success(`路线已${actionText}`)
  }).catch(() => {})
}

const handleAddRoute = () => {
  addRouteForm.value = {
    routeCode: '',
    routeName: '',
    startPoint: '',
    waypoints: [],
    endPoint: '',
    distance: 100,
    status: 'enabled'
  }
  addRouteDialogVisible.value = true
}

// 添加途经点
const addWaypoint = () => {
  addRouteForm.value.waypoints.push('')
}

// 删除途经点
const removeWaypoint = (index) => {
  addRouteForm.value.waypoints.splice(index, 1)
}

const handleSaveRoute = () => {
  if (!addRouteForm.value.routeCode) {
    ElMessage.warning('请输入路线编号')
    return
  }
  if (!addRouteForm.value.routeName) {
    ElMessage.warning('请输入路线名称')
    return
  }
  if (!addRouteForm.value.startPoint) {
    ElMessage.warning('请选择起点')
    return
  }
  if (!addRouteForm.value.endPoint) {
    ElMessage.warning('请选择终点')
    return
  }

  // 检查途经点是否都已选择
  const emptyWaypoint = addRouteForm.value.waypoints.findIndex(wp => !wp)
  if (emptyWaypoint > -1) {
    ElMessage.warning(`请选择第 ${emptyWaypoint + 1} 个途经点`)
    return
  }

  // 检查路线编号是否重复
  const exists = routeList.value.some(r => r.routeCode === addRouteForm.value.routeCode)
  if (exists) {
    ElMessage.warning('路线编号已存在，请使用其他编号')
    return
  }

  // 生成完整的点位序列
  const fullPoints = [
    addRouteForm.value.startPoint,
    ...addRouteForm.value.waypoints.filter(wp => wp),
    addRouteForm.value.endPoint
  ]

  // 添加新路线
  const newRoute = {
    routeCode: addRouteForm.value.routeCode,
    routeName: addRouteForm.value.routeName,
    startPoint: addRouteForm.value.startPoint,
    endPoint: addRouteForm.value.endPoint,
    distance: addRouteForm.value.distance,
    status: addRouteForm.value.status,
    waypoints: [...addRouteForm.value.waypoints.filter(wp => wp)],
    fullPoints: fullPoints,
    pathPoints: generatePathFromPoints(fullPoints)
  }
  routeList.value.push(newRoute)
  
  addRouteDialogVisible.value = false
  ElMessage.success('路线添加成功')
}

// 根据点位序列生成路径点
const generatePathFromPoints = (points) => {
  const pathPoints = []
  const count = points.length
  const segmentWidth = 600 / (count + 1)
  
  for (let i = 0; i < count; i++) {
    const x = segmentWidth * (i + 1)
    // 随机Y坐标，让路线看起来更自然
    const y = 100 + Math.sin(i * 0.8) * 80 + Math.random() * 40
    pathPoints.push({ x, y: Math.max(50, Math.min(350, y)) })
  }
  
  return pathPoints
}

const handleDeleteRoute = (row) => {
  ElMessageBox.confirm(
    `确定要删除路线 "${row.routeName}" 吗？此操作不可恢复！`,
    '警告',
    { confirmButtonText: '确定', cancelButtonText: '取消', type: 'danger' }
  ).then(() => {
    const index = routeList.value.findIndex(item => item.routeCode === row.routeCode)
    if (index > -1) {
      routeList.value.splice(index, 1)
    }
    ElMessage.success('路线删除成功')
  }).catch(() => {})
}

// 绘制路线
const drawRoute = () => {
  if (!routeCanvas.value || !currentRoute.value.pathPoints) return
  
  const canvas = routeCanvas.value
  const ctx = canvas.getContext('2d')
  const points = currentRoute.value.pathPoints
  
  // 清空画布
  ctx.clearRect(0, 0, canvas.width, canvas.height)
  
  // 绘制背景网格
  ctx.strokeStyle = '#e0e0e0'
  ctx.lineWidth = 1
  for (let i = 0; i < canvas.width; i += 50) {
    ctx.beginPath()
    ctx.moveTo(i, 0)
    ctx.lineTo(i, canvas.height)
    ctx.stroke()
  }
  for (let i = 0; i < canvas.height; i += 50) {
    ctx.beginPath()
    ctx.moveTo(0, i)
    ctx.lineTo(canvas.width, i)
    ctx.stroke()
  }
  
  // 绘制路线
  if (points.length >= 2) {
    // 绘制路线连线
    ctx.strokeStyle = '#409EFF'
    ctx.lineWidth = 4
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    
    ctx.beginPath()
    ctx.moveTo(points[0].x, points[0].y)
    for (let i = 1; i < points.length; i++) {
      ctx.lineTo(points[i].x, points[i].y)
    }
    ctx.stroke()
    
    // 绘制路径点
    points.forEach((point, index) => {
      ctx.beginPath()
      ctx.arc(point.x, point.y, index === 0 || index === points.length - 1 ? 12 : 8, 0, Math.PI * 2)
      
      if (index === 0) {
        ctx.fillStyle = '#67C23A' // 起点 - 绿色
      } else if (index === points.length - 1) {
        ctx.fillStyle = '#F56C6C' // 终点 - 红色
      } else {
        ctx.fillStyle = '#409EFF' // 中间点 - 蓝色
      }
      ctx.fill()
      
      ctx.strokeStyle = '#fff'
      ctx.lineWidth = 2
      ctx.stroke()
      
      // 标注文字
      ctx.fillStyle = '#303133'
      ctx.font = '12px Microsoft YaHei'
      ctx.textAlign = 'center'
      if (index === 0) {
        ctx.fillText('起点', point.x, point.y - 20)
      } else if (index === points.length - 1) {
        ctx.fillText('终点', point.x, point.y - 20)
      }
    })
  }
}

// 组件挂载时自动选择第一个配置
onMounted(() => {
  if (configList.value && configList.value.length > 0) {
    handleSelectConfig(configList.value[0])
  }
})

// 监听对话框显示，调整画布大小
watch(routeDialogVisible, (val) => {
  if (val) {
    nextTick(() => {
      if (canvasContainer.value) {
        canvasWidth.value = canvasContainer.value.clientWidth
        canvasHeight.value = 400
        nextTick(() => {
          drawRoute()
        })
      }
    })
  }
})
</script>

<style lang="scss" scoped>
.route-container {
  padding: 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;

  .header-left {
    h2 {
      margin: 0 0 8px 0;
      font-size: 22px;
      font-weight: 600;
    }

    .text-secondary {
      color: #909399;
      font-size: 14px;
      margin: 0;
    }
  }

  .header-right {
    display: flex;
    gap: 12px;
  }
}

.workflow-card {
  margin-bottom: 20px;

  :deep(.el-step__title) {
    font-size: 14px;
  }
}

.config-list-card,
.route-list-card {
  margin-top: 20px;

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;

    .header-actions {
      display: flex;
      gap: 10px;
    }
  }
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;

  span {
    display: flex;
    align-items: center;
    gap: 8px;
    font-weight: 600;

    .custom-status-tag {
      margin-left: 10px;
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 3px 10px;
      border-radius: 4px;
      font-size: 12px;
      font-weight: normal;
      white-space: nowrap;

      .el-icon {
        font-size: 12px;
      }
    }

    .success-tag {
      background-color: #f0f9eb;
      color: #67c23a;
      border: 1px solid #e1f3d8;
    }

    .warning-tag {
      background-color: #fdf6ec;
      color: #e6a23c;
      border: 1px solid #faecd8;
    }
  }
}

.template-dialog-content {
  .dialog-tip {
    color: #606266;
    margin-bottom: 16px;
  }

  .template-options {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .template-option {
    display: flex;
    align-items: center;
    padding: 16px;
    background: #f5f7fa;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.3s;

    &:hover {
      background: #e4e7ed;
      transform: translateX(4px);
    }

    .template-option-icon {
      margin-right: 16px;
    }

    .template-option-info {
      flex: 1;

      .template-option-name {
        font-weight: 600;
        color: #303133;
        margin-bottom: 4px;
      }

      .template-option-desc {
        font-size: 12px;
        color: #909399;
      }
    }

    .template-option-arrow {
      color: #c0c4cc;
      font-size: 20px;
    }
  }
}

.route-uploader {
  :deep(.el-upload) {
    width: 100%;
  }

  :deep(.el-upload-dragger) {
    width: 100%;
  }
}

.upload-text {
  margin-top: 16px;
  color: #606266;

  em {
    color: #409EFF;
    font-style: normal;
  }
}

.upload-tip {
  margin-top: 8px;
  font-size: 12px;
  color: #909399;
}

.check-result {
  margin-top: 20px;

  .check-details {
    margin-top: 12px;
    padding: 12px;
    background: #fef0f0;
    border-radius: 4px;

    ul {
      margin: 0;
      padding-left: 0;
      list-style: none;
    }

    .check-error-item {
      display: flex;
      align-items: flex-start;
      gap: 6px;
      padding: 4px 0;
      color: #f56c6c;
      font-size: 13px;

      .el-icon {
        margin-top: 2px;
        flex-shrink: 0;
      }
    }
  }
}

.route-detail-container {
  .route-info {
    margin-bottom: 20px;
  }

  .route-visualization {
    h4 {
      margin: 0 0 12px 0;
      font-size: 14px;
      color: #606266;
    }

    .canvas-container {
      width: 100%;
      border: 1px solid #e0e0e0;
      border-radius: 4px;
      background: #fafafa;
      overflow: hidden;
    }
  }
}

.waypoints-container {
  width: 100%;

  .waypoint-item {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 8px;
  }
}
</style>
