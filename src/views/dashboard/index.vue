<template>
  <div class="dashboard-container">
    <!-- 页面标题 -->
    <div class="page-header">
      <h2>系统概览</h2>
      <p class="text-secondary">实时监控系统运行状态</p>
    </div>

    <!-- 统计卡片区域 -->
    <el-row :gutter="20" class="stat-row">
      <el-col :xs="24" :sm="12" :lg="6">
        <el-card class="stat-card" shadow="hover">
          <div class="stat-icon bg-primary">
            <el-icon><Monitor /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-value">128</div>
            <div class="stat-label">在线设备</div>
          </div>
        </el-card>
      </el-col>
      <el-col :xs="24" :sm="12" :lg="6">
        <el-card class="stat-card" shadow="hover">
          <div class="stat-icon bg-success">
            <el-icon><Checked /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-value">96</div>
            <div class="stat-label">运行正常</div>
          </div>
        </el-card>
      </el-col>
      <el-col :xs="24" :sm="12" :lg="6">
        <el-card class="stat-card" shadow="hover">
          <div class="stat-icon bg-warning">
            <el-icon><Warning /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-value">24</div>
            <div class="stat-label">待处理任务</div>
          </div>
        </el-card>
      </el-col>
      <el-col :xs="24" :sm="12" :lg="6">
        <el-card class="stat-card" shadow="hover">
          <div class="stat-icon bg-danger">
            <el-icon><Bell /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-value">8</div>
            <div class="stat-label">告警信息</div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 任务看板和设备状态 -->
    <el-row :gutter="20" class="content-row">
      <!-- 实时任务看板 -->
      <el-col :xs="24" :lg="14">
        <el-card class="content-card" shadow="hover">
          <template #header>
            <div class="card-header">
              <span><el-icon><List /></el-icon> 实时任务看板</span>
              <el-tag type="success" effect="dark">实时</el-tag>
            </div>
          </template>
          <el-timeline>
            <el-timeline-item
              v-for="(task, index) in recentTasks"
              :key="index"
              :type="task.type"
              :timestamp="task.time"
            >
              <div class="task-item">
                <span class="task-name">{{ task.name }}</span>
                <el-tag size="small" :type="task.statusType">{{ task.status }}</el-tag>
              </div>
            </el-timeline-item>
          </el-timeline>
        </el-card>
      </el-col>

      <!-- 设备状态概览 -->
      <el-col :xs="24" :lg="10">
        <el-card class="content-card" shadow="hover">
          <template #header>
            <div class="card-header">
              <span><el-icon><Cpu /></el-icon> 设备状态概览</span>
              <el-button type="primary" link @click="refreshDeviceStatus">
                <el-icon><Refresh /></el-icon> 刷新
              </el-button>
            </div>
          </template>
          <div class="device-list">
            <div
              v-for="device in deviceList"
              :key="device.id"
              class="device-item"
            >
              <div class="device-info">
                <el-icon :size="20" :class="getDeviceStatusClass(device.status)">
                  <Connection />
                </el-icon>
                <span class="device-name">{{ device.name }}</span>
              </div>
              <el-tag size="small" :type="getDeviceStatusType(device.status)">
                {{ device.statusText }}
              </el-tag>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 告警提示区域 -->
    <el-row :gutter="20" class="alert-row">
      <el-col :span="24">
        <el-card class="alert-card" shadow="hover">
          <template #header>
            <div class="card-header">
              <span><el-icon><WarningFilled /></el-icon> 告警提示</span>
              <el-button type="danger" link @click="markAllRead">
                全部标记为已读
              </el-button>
            </div>
          </template>
          <el-table :data="alertList" stripe style="width: 100%">
            <el-table-column type="index" width="50" />
            <el-table-column prop="level" label="级别" width="100">
              <template #default="{ row }">
                <el-tag :type="row.levelType" effect="dark">{{ row.level }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="content" label="告警内容" min-width="300" />
            <el-table-column prop="source" label="来源" width="150" />
            <el-table-column prop="time" label="时间" width="180" />
            <el-table-column label="操作" width="120" fixed="right">
              <template #default="{ row }">
                <el-button type="primary" link @click="handleAlert(row)">
                  处理
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import {
  Monitor,
  Checked,
  Warning,
  Bell,
  List,
  Cpu,
  Refresh,
  Connection,
  WarningFilled
} from '@element-plus/icons-vue'

// 实时任务数据
const recentTasks = ref([
  { name: '搬运任务 #1024', status: '进行中', statusType: 'warning', time: '2026-03-25 17:20:30', type: 'primary' },
  { name: '设备巡检 #312', status: '已完成', statusType: 'success', time: '2026-03-25 17:15:12', type: 'success' },
  { name: '货物入库 #88', status: '失败', statusType: 'danger', time: '2026-03-25 17:10:45', type: 'danger' },
  { name: '路线优化 #45', status: '已完成', statusType: 'success', time: '2026-03-25 17:05:22', type: 'success' },
  { name: 'AGV充电调度 #12', status: '进行中', statusType: 'warning', time: '2026-03-25 17:00:00', type: 'primary' }
])

// 设备状态数据
const deviceList = ref([
  { id: 1, name: 'AGV-001', status: 'online', statusText: '在线' },
  { id: 2, name: 'AGV-002', status: 'online', statusText: '在线' },
  { id: 3, name: 'AGV-003', status: 'offline', statusText: '离线' },
  { id: 4, name: '堆垛机-01', status: 'online', statusText: '在线' },
  { id: 5, name: '输送线-A', status: 'warning', statusText: '告警' },
  { id: 6, name: '输送线-B', status: 'online', statusText: '在线' }
])

// 告警列表数据
const alertList = ref([
  { level: '紧急', levelType: 'danger', content: 'AGV-003 通讯中断超过5分钟', source: 'AGV调度系统', time: '2026-03-25 17:18:30' },
  { level: '重要', levelType: 'warning', content: '输送线-A 传感器异常', source: '输送线系统', time: '2026-03-25 17:15:22' },
  { level: '一般', levelType: 'info', content: '仓库温度接近上限阈值', source: '环境监控', time: '2026-03-25 17:10:45' },
  { level: '重要', levelType: 'warning', content: '任务 #1024 执行超时', source: '任务调度系统', time: '2026-03-25 17:05:12' }
])

// 获取设备状态样式
const getDeviceStatusClass = (status) => {
  const map = {
    online: 'status-online',
    offline: 'status-offline',
    warning: 'status-warning'
  }
  return map[status] || ''
}

const getDeviceStatusType = (status) => {
  const map = {
    online: 'success',
    offline: 'info',
    warning: 'warning'
  }
  return map[status] || 'info'
}

// 刷新设备状态
const refreshDeviceStatus = () => {
  ElMessage.success('设备状态已刷新')
}

// 标记所有告警已读
const markAllRead = () => {
  alertList.value = []
  ElMessage.success('已全部标记为已读')
}

// 处理告警
const handleAlert = (row) => {
  ElMessage.info(`正在处理告警：${row.content}`)
}

onMounted(() => {
  // 可以在这里添加定时刷新逻辑
})
</script>

<style scoped>
.dashboard-container {
  padding: 20px;
}

.page-header {
  margin-bottom: 24px;
}

.page-header h2 {
  margin: 0 0 8px 0;
  font-size: 24px;
  font-weight: 600;
}

.text-secondary {
  color: #909399;
  margin: 0;
}

.stat-row,
.content-row,
.alert-row {
  margin-bottom: 20px;
}

.stat-card {
  :deep(.el-card__body) {
    display: flex;
    align-items: center;
    padding: 20px;
  }
}

.stat-icon {
  width: 60px;
  height: 60px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
  color: #fff;
  margin-right: 16px;
}

.bg-primary { background: linear-gradient(135deg, #409EFF 0%, #66b1ff 100%); }
.bg-success { background: linear-gradient(135deg, #67C23A 0%, #85ce61 100%); }
.bg-warning { background: linear-gradient(135deg, #E6A23C 0%, #ebb563 100%); }
.bg-danger { background: linear-gradient(135deg, #F56C6C 0%, #f78989 100%); }

.stat-info {
  flex: 1;
}

.stat-value {
  font-size: 28px;
  font-weight: 700;
  color: #303133;
  line-height: 1;
  margin-bottom: 8px;
}

.stat-label {
  font-size: 14px;
  color: #909399;
}

.content-card {
  height: 100%;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-header span {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
}

.task-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.task-name {
  font-weight: 500;
  color: #303133;
}

.device-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.device-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: #f5f7fa;
  border-radius: 8px;
}

.device-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.device-name {
  font-weight: 500;
  color: #303133;
}

.status-online { color: #67C23A; }
.status-offline { color: #909399; }
.status-warning { color: #E6A23C; }

.alert-card {
  :deep(.el-card__body) {
    padding: 0;
  }
}
</style>
