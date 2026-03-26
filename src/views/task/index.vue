<template>
  <div class="task-container">
    <!-- 页面标题 -->
    <div class="page-header">
      <h2>任务监控</h2>
      <p class="text-secondary">实时监控任务执行进度及完成状态</p>
    </div>

    <!-- 统计卡片 -->
    <el-row :gutter="20" class="stat-row">
      <el-col :xs="24" :sm="12" :lg="4">
        <el-card class="stat-card" shadow="hover">
          <div class="stat-value">324</div>
          <div class="stat-label">今日任务</div>
        </el-card>
      </el-col>
      <el-col :xs="24" :sm="12" :lg="4">
        <el-card class="stat-card" shadow="hover">
          <div class="stat-value text-primary">68</div>
          <div class="stat-label">执行中</div>
        </el-card>
      </el-col>
      <el-col :xs="24" :sm="12" :lg="4">
        <el-card class="stat-card" shadow="hover">
          <div class="stat-value text-success">245</div>
          <div class="stat-label">已完成</div>
        </el-card>
      </el-col>
      <el-col :xs="24" :sm="12" :lg="4">
        <el-card class="stat-card" shadow="hover">
          <div class="stat-value text-danger">11</div>
          <div class="stat-label">失败/异常</div>
        </el-card>
      </el-col>
      <el-col :xs="24" :sm="12" :lg="4">
        <el-card class="stat-card" shadow="hover">
          <div class="stat-value">76%</div>
          <div class="stat-label">成功率</div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 实时任务监控图表 -->
    <el-row :gutter="20" class="chart-row">
      <el-col :xs="24" :lg="16">
        <el-card class="chart-card" shadow="hover">
          <template #header>
            <div class="card-header">
              <span><el-icon><TrendCharts /></el-icon> 任务执行趋势</span>
              <el-radio-group v-model="timeRange" size="small">
                <el-radio-button label="1h">1小时</el-radio-button>
                <el-radio-button label="24h">24小时</el-radio-button>
                <el-radio-button label="7d">7天</el-radio-button>
              </el-radio-group>
            </div>
          </template>
          <div class="chart-placeholder">
            <el-icon :size="48" color="#dcdfe6"><TrendCharts /></el-icon>
            <p>任务执行趋势图表区域</p>
            <span class="chart-hint">可集成 ECharts 展示任务完成率、执行时长等趋势</span>
          </div>
        </el-card>
      </el-col>
      <el-col :xs="24" :lg="8">
        <el-card class="chart-card" shadow="hover">
          <template #header>
            <div class="card-header">
              <span><el-icon><PieChart /></el-icon> 任务状态分布</span>
            </div>
          </template>
          <div class="chart-placeholder">
            <el-icon :size="48" color="#dcdfe6"><PieChart /></el-icon>
            <p>任务状态分布饼图</p>
            <span class="chart-hint">展示待执行/执行中/已完成/异常的比例</span>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 搜索筛选 -->
    <el-card class="search-card" shadow="never">
      <el-form :model="queryParams" ref="queryForm" :inline="true">
        <el-form-item label="任务ID" prop="taskId">
          <el-input v-model="queryParams.taskId" placeholder="请输入任务ID" clearable />
        </el-form-item>
        <el-form-item label="任务类型" prop="taskType">
          <el-select v-model="queryParams.taskType" placeholder="请选择" clearable style="width: 140px">
            <el-option label="搬运任务" value="transport" />
            <el-option label="巡检任务" value="inspect" />
            <el-option label="充电任务" value="charge" />
            <el-option label="维护任务" value="maintain" />
          </el-select>
        </el-form-item>
        <el-form-item label="执行设备" prop="device">
          <el-select v-model="queryParams.device" placeholder="请选择" clearable style="width: 140px">
            <el-option label="AGV-001" value="agv001" />
            <el-option label="AGV-002" value="agv002" />
            <el-option label="AGV-003" value="agv003" />
            <el-option label="堆垛机-01" value="stacker01" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-select v-model="queryParams.status" placeholder="请选择" clearable style="width: 120px">
            <el-option label="待执行" value="pending" />
            <el-option label="执行中" value="running" />
            <el-option label="已完成" value="completed" />
            <el-option label="失败" value="failed" />
            <el-option label="已取消" value="cancelled" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleQuery">
            <el-icon><Search /></el-icon> 搜索
          </el-button>
          <el-button @click="resetQuery">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 任务列表 -->
    <el-card class="table-card" shadow="never">
      <template #header>
        <div class="card-header">
          <span><el-icon><List /></el-icon> 任务列表</span>
          <div class="header-actions">
            <el-button type="success" @click="handleBatchAction('start')">
              <el-icon><VideoPlay /></el-icon> 批量启动
            </el-button>
            <el-button type="warning" @click="handleBatchAction('pause')">
              <el-icon><VideoPause /></el-icon> 批量暂停
            </el-button>
            <el-button type="danger" @click="handleBatchAction('cancel')">
              <el-icon><CircleClose /></el-icon> 批量取消
            </el-button>
            <el-button type="primary" @click="handleExport">
              <el-icon><Download /></el-icon> 导出
            </el-button>
          </div>
        </div>
      </template>
      <el-table :data="taskList" stripe v-loading="loading" @selection-change="handleSelectionChange">
        <el-table-column type="selection" width="55" align="center" />
        <el-table-column label="任务ID" prop="taskId" min-width="130" show-overflow-tooltip />
        <el-table-column label="任务名称" prop="taskName" min-width="150" show-overflow-tooltip />
        <el-table-column label="任务类型" prop="taskType" width="100">
          <template #default="{ row }">
            <el-tag :type="getTaskTypeType(row.taskType)" size="small">
              {{ getTaskTypeText(row.taskType) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="执行设备" prop="deviceName" width="120" />
        <el-table-column label="状态" prop="status" width="90" align="center">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)" effect="dark" size="small">
              {{ getStatusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="进度" prop="progress" width="100">
          <template #default="{ row }">
            <el-progress 
              :percentage="row.progress" 
              :status="row.progress === 100 ? 'success' : ''" 
              :stroke-width="5"
              :show-text="false"
            />
            <span class="progress-text">{{ row.progress }}%</span>
          </template>
        </el-table-column>
        <el-table-column label="开始时间" prop="startTime" width="160" />
        <el-table-column label="预计完成" prop="estimatedEndTime" width="160" />
        <el-table-column label="操作" width="150" fixed="right" align="center">
          <template #default="{ row }">
            <el-button v-if="row.status === 'pending'" type="success" link @click="handleStart(row)">
              <el-icon><VideoPlay /></el-icon>
            </el-button>
            <el-button v-if="row.status === 'running'" type="warning" link @click="handlePause(row)">
              <el-icon><VideoPause /></el-icon>
            </el-button>
            <el-button type="primary" link @click="handleView(row)">
              <el-icon><View /></el-icon>
            </el-button>
            <el-button v-if="row.status !== 'running'" type="danger" link @click="handleDelete(row)">
              <el-icon><Delete /></el-icon>
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  TrendCharts, PieChart, Search, Refresh, List,
  VideoPlay, VideoPause, CircleClose, Download,
  View, Delete
} from '@element-plus/icons-vue'

// 时间范围
const timeRange = ref('24h')
const loading = ref(false)

// 查询参数
const queryParams = ref({
  taskId: '',
  taskType: '',
  device: '',
  status: ''
})

// 选中的任务
const selectedTasks = ref([])

// 任务列表
const taskList = ref([
  {
    taskId: 'TASK20250326001',
    taskName: '原料搬运-A1',
    taskType: 'transport',
    deviceName: 'AGV-001',
    status: 'running',
    progress: 68,
    startTime: '2026-03-26 08:30:00',
    estimatedEndTime: '2026-03-26 09:00:00'
  },
  {
    taskId: 'TASK20250326002',
    taskName: '成品入库-B2',
    taskType: 'transport',
    deviceName: 'AGV-002',
    status: 'completed',
    progress: 100,
    startTime: '2026-03-26 07:15:00',
    estimatedEndTime: '2026-03-26 07:40:00'
  },
  {
    taskId: 'TASK20250326003',
    taskName: '设备巡检-C1',
    taskType: 'inspect',
    deviceName: 'AGV-003',
    status: 'pending',
    progress: 0,
    startTime: '-',
    estimatedEndTime: '2026-03-26 10:00:00'
  },
  {
    taskId: 'TASK20250326004',
    taskName: '废料清理-D2',
    taskType: 'transport',
    deviceName: 'AGV-001',
    status: 'failed',
    progress: 45,
    startTime: '2026-03-26 06:00:00',
    estimatedEndTime: '2026-03-26 06:20:00'
  }
])

// 获取任务类型样式
const getTaskTypeType = (type) => {
  const map = {
    transport: 'primary',
    inspect: 'success',
    charge: 'warning',
    maintain: 'info'
  }
  return map[type] || 'info'
}

const getTaskTypeText = (type) => {
  const map = {
    transport: '搬运',
    inspect: '巡检',
    charge: '充电',
    maintain: '维护'
  }
  return map[type] || type
}

// 获取状态样式
const getStatusType = (status) => {
  const map = {
    pending: 'info',
    running: 'warning',
    completed: 'success',
    failed: 'danger',
    cancelled: 'info'
  }
  return map[status] || 'info'
}

const getStatusText = (status) => {
  const map = {
    pending: '待执行',
    running: '执行中',
    completed: '已完成',
    failed: '失败',
    cancelled: '已取消'
  }
  return map[status] || status
}

// 搜索
const handleQuery = () => {
  loading.value = true
  setTimeout(() => {
    loading.value = false
    ElMessage.success('搜索完成')
  }, 500)
}

const resetQuery = () => {
  queryParams.value = {
    taskId: '',
    taskType: '',
    device: '',
    status: ''
  }
  handleQuery()
}

// 批量操作
const handleSelectionChange = (selection) => {
  selectedTasks.value = selection
}

const handleBatchAction = (action) => {
  if (!selectedTasks.value.length) {
    ElMessage.warning('请先选择任务')
    return
  }
  const actionMap = {
    start: '启动',
    pause: '暂停',
    cancel: '取消'
  }
  ElMessage.success(`已${actionMap[action]} ${selectedTasks.value.length} 个任务`)
}

// 导出
const handleExport = () => {
  ElMessage.success('任务数据导出成功')
}

// 单个任务操作
const handleStart = (row) => {
  row.status = 'running'
  ElMessage.success(`任务 ${row.taskId} 已启动`)
}

const handlePause = (row) => {
  ElMessage.info(`任务 ${row.taskId} 已暂停`)
}

const handleView = (row) => {
  ElMessage.info(`查看任务详情：${row.taskId}`)
}

const handleDelete = (row) => {
  ElMessageBox.confirm(
    `确定要删除任务 "${row.taskName}" 吗？`,
    '警告',
    { confirmButtonText: '确定', cancelButtonText: '取消', type: 'danger' }
  ).then(() => {
    ElMessage.success('任务删除成功')
  }).catch(() => {})
}
</script>

<style lang="scss" scoped>
.task-container {
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

.stat-row {
  margin-bottom: 20px;
}

.stat-card {
  text-align: center;
  padding: 10px;

  .stat-value {
    font-size: 28px;
    font-weight: 700;
    color: #303133;
    margin-bottom: 8px;

    &.text-primary { color: #409EFF; }
    &.text-success { color: #67C23A; }
    &.text-warning { color: #E6A23C; }
    &.text-danger { color: #F56C6C; }
  }

  .stat-label {
    font-size: 14px;
    color: #909399;
  }
}

.chart-row {
  margin-bottom: 20px;
}

.chart-card {
  height: 100%;

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
}

.chart-placeholder {
  height: 280px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: #f5f7fa;
  border-radius: 8px;

  p {
    margin: 12px 0 0 0;
    font-size: 16px;
    color: #606266;
    font-weight: 500;
  }

  .chart-hint {
    margin-top: 8px;
    font-size: 12px;
    color: #909399;
  }
}

.search-card {
  margin-bottom: 20px;
}

.table-card {
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

    .header-actions {
      display: flex;
      gap: 10px;
    }
  }
}

.progress-text {
  display: block;
  text-align: right;
  font-size: 12px;
  color: #606266;
  margin-top: 4px;
}
</style>