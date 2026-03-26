<template>
  <div class="route-container">
    <!-- 页面标题 -->
    <div class="page-header">
      <h2>路线配置</h2>
      <p class="text-secondary">配置和管理逻辑搬运路线</p>
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
          <el-steps :active="2" finish-status="success" simple>
            <el-step title="下载模板" description="获取标准JSON模板" />
            <el-step title="编辑配置" description="按需求编辑路线数据" />
            <el-step title="上传生效" description="验证并发布路线" />
          </el-steps>
        </el-card>
      </el-col>
    </el-row>

    <!-- 模板下载和上传区域 -->
    <el-row :gutter="20" class="upload-row">
      <el-col :xs="24" :lg="12">
        <el-card class="template-card" shadow="hover">
          <template #header>
            <div class="card-header">
              <span><el-icon><Document /></el-icon> 模板下载</span>
            </div>
          </template>
          <div class="template-list">
            <div v-for="template in templates" :key="template.id" class="template-item">
              <div class="template-info">
                <el-icon :size="24" color="#409EFF"><Document /></el-icon>
                <div class="template-detail">
                  <span class="template-name">{{ template.name }}</span>
                  <span class="template-desc">{{ template.description }}</span>
                </div>
              </div>
              <el-button type="primary" link @click="downloadTemplate(template)">
                <el-icon><Download /></el-icon> 下载
              </el-button>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :xs="24" :lg="12">
        <el-card class="upload-card" shadow="hover">
          <template #header>
            <div class="card-header">
              <span><el-icon><Upload /></el-icon> 配置上传</span>
            </div>
          </template>
          <el-upload
            class="route-uploader"
            drag
            action="/api/route/upload"
            :on-success="handleUploadSuccess"
            :on-error="handleUploadError"
            :before-upload="beforeUpload"
            accept=".json"
            multiple
          >
            <el-icon :size="48" color="#409EFF"><Upload /></el-icon>
            <div class="upload-text">
              <em>点击上传</em> 或拖拽文件到此处
            </div>
            <template #tip>
              <div class="upload-tip">
                仅支持 JSON 格式文件，文件大小不超过 10MB
              </div>
            </template>
          </el-upload>
        </el-card>
      </el-col>
    </el-row>

    <!-- 路线列表 -->
    <el-card class="route-list-card" shadow="never">
      <template #header>
        <div class="card-header">
          <span><el-icon><MapLocation /></el-icon> 路线列表</span>
          <div class="header-actions">
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
        <el-table-column label="距离" prop="distance" width="100">
          <template #default="{ row }">
            {{ row.distance }}m
          </template>
        </el-table-column>
        <el-table-column label="状态" prop="status" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="row.status === 'enabled' ? 'success' : 'info'">
              {{ row.status === 'enabled' ? '已启用' : '已禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="180" fixed="right" align="center">
          <template #default="{ row }">
            <el-button type="primary" link @click="handleEditRoute(row)">
              <el-icon><Edit /></el-icon> 编辑
            </el-button>
            <el-button type="primary" link @click="handleToggleStatus(row)">
              {{ row.status === 'enabled' ? '禁用' : '启用' }}
            </el-button>
            <el-button type="danger" link @click="handleDeleteRoute(row)">
              <el-icon><Delete /></el-icon> 删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Guide, Document, Download, Upload, MapLocation,
  Search, Refresh, Edit, Delete
} from '@element-plus/icons-vue'

// 模板列表
const templates = ref([
  { id: 1, name: '标准路线模板.json', description: '包含基础路线配置字段的标准模板', fileName: 'route_template_standard.json' },
  { id: 2, name: 'AGV路线模板.json', description: '专用于AGV小车的路线配置模板', fileName: 'route_template_agv.json' },
  { id: 3, name: '输送线路线模板.json', description: '专用于输送线的路线配置模板', fileName: 'route_template_conveyor.json' }
])

// 搜索关键词
const searchKeyword = ref('')
const loading = ref(false)

// 路线列表
const routeList = ref([
  { routeCode: 'RT001', routeName: '原料区到生产线A', startPoint: '原料仓A', endPoint: '生产线A-01', distance: 120, status: 'enabled' },
  { routeCode: 'RT002', routeName: '成品区到出货口', startPoint: '成品仓B', endPoint: '出货口C', distance: 200, status: 'enabled' },
  { routeCode: 'RT003', routeName: '废料回收路线', startPoint: '废料区', endPoint: '回收站', distance: 80, status: 'disabled' }
])

// 过滤后的路线列表
const filteredRoutes = computed(() => {
  if (!searchKeyword.value) return routeList.value
  const keyword = searchKeyword.value.toLowerCase()
  return routeList.value.filter(item =>
    item.routeCode.toLowerCase().includes(keyword) ||
    item.routeName.toLowerCase().includes(keyword)
  )
})

// 下载模板
const downloadTemplate = (template) => {
  const jsonContent = JSON.stringify({
    version: '1.0',
    createTime: new Date().toISOString(),
    routes: []
  }, null, 2)
  const blob = new Blob([jsonContent], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = template.fileName
  a.click()
  URL.revokeObjectURL(url)
  ElMessage.success(`模板 ${template.name} 下载成功`)
}

// 上传相关
const beforeUpload = (file) => {
  const isJson = file.type === 'application/json' || file.name.endsWith('.json')
  if (!isJson) {
    ElMessage.error('仅支持 JSON 格式文件')
    return false
  }
  const isLt10M = file.size / 1024 / 1024 < 10
  if (!isLt10M) {
    ElMessage.error('文件大小不能超过 10MB')
    return false
  }
  return true
}

const handleUploadSuccess = (response) => {
  ElMessage.success('路线配置上传成功')
  handleRefresh()
}

const handleUploadError = () => {
  ElMessage.error('上传失败，请检查网络连接')
}

// 路线操作
const handleRefresh = () => {
  loading.value = true
  setTimeout(() => {
    loading.value = false
    ElMessage.success('路线列表已刷新')
  }, 500)
}

const handleEditRoute = (row) => {
  ElMessage.info(`编辑路线：${row.routeName}`)
}

const handleToggleStatus = (row) => {
  const action = row.status === 'enabled' ? '禁用' : '启用'
  ElMessageBox.confirm(
    `确定要${action}路线 "${row.routeName}" 吗？`,
    '提示',
    { confirmButtonText: '确定', cancelButtonText: '取消', type: 'warning' }
  ).then(() => {
    row.status = row.status === 'enabled' ? 'disabled' : 'enabled'
    ElMessage.success(`路线已${action}`)
  }).catch(() => {})
}

const handleDeleteRoute = (row) => {
  ElMessageBox.confirm(
    `确定要删除路线 "${row.routeName}" 吗？此操作不可恢复！`,
    '警告',
    { confirmButtonText: '确定', cancelButtonText: '取消', type: 'danger' }
  ).then(() => {
    ElMessage.success('路线删除成功')
  }).catch(() => {})
}
</script>

<style lang="scss" scoped>
.route-container {
  padding: 20px;
}

.page-header {
  margin-bottom: 20px;

  h2 {
    margin: 0 0 8px 0;
    font-size: 22px;
    font-weight: 600;
  }

  .text-secondary {
    color: #909399;
    font-size: 14px;
  }
}

.workflow-card {
  margin-bottom: 20px;

  :deep(.el-step__title) {
    font-size: 14px;
  }
}

.template-card,
.upload-card {
  height: 100%;
}

.template-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.template-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  background: #f5f7fa;
  border-radius: 8px;
  transition: all 0.3s;

  &:hover {
    background: #e4e7ed;
  }
}

.template-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.template-detail {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.template-name {
  font-weight: 600;
  color: #303133;
}

.template-desc {
  font-size: 12px;
  color: #909399;
}

.route-uploader {
  :deep(.el-upload) {
    width: 100%;
  }

  :deep(.el-upload-dragger) {
    width: 100%;
    height: 200px;
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
  }
}
</style>