<template>
  <div class="workorder-container">
    <!-- 页面标题 -->
    <div class="page-header">
      <h2>工单监控</h2>
      <p class="text-secondary">实时监控工单执行进度及完成状态</p>
    </div>

    <!-- 统计卡片 -->
    <el-row :gutter="20" class="stat-row">
      <el-col :xs="24" :sm="12" :lg="4">
        <el-card class="stat-card" shadow="hover">
          <div class="stat-value">156</div>
          <div class="stat-label">今日工单</div>
        </el-card>
      </el-col>
      <el-col :xs="24" :sm="12" :lg="4">
        <el-card class="stat-card" shadow="hover">
          <div class="stat-value text-warning">42</div>
          <div class="stat-label">进行中</div>
        </el-card>
      </el-col>
      <el-col :xs="24" :sm="12" :lg="4">
        <el-card class="stat-card" shadow="hover">
          <div class="stat-value text-success">98</div>
          <div class="stat-label">已完成</div>
        </el-card>
      </el-col>
      <el-col :xs="24" :sm="12" :lg="4">
        <el-card class="stat-card" shadow="hover">
          <div class="stat-value text-danger">6</div>
          <div class="stat-label">异常</div>
        </el-card>
      </el-col>
      <el-col :xs="24" :sm="12" :lg="4">
        <el-card class="stat-card" shadow="hover">
          <div class="stat-value">87%</div>
          <div class="stat-label">完成率</div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 搜索筛选 -->
    <el-card class="search-card" shadow="never">
      <el-form :model="queryParams" ref="queryForm" :inline="true">
        <el-form-item label="工单号" prop="workorderNo">
          <el-input v-model="queryParams.workorderNo" placeholder="请输入工单号" clearable />
        </el-form-item>
        <el-form-item label="设备" prop="device">
          <el-select v-model="queryParams.device" placeholder="请选择" clearable style="width: 150px">
            <el-option label="AGV-001" value="agv001" />
            <el-option label="AGV-002" value="agv002" />
            <el-option label="堆垛机-01" value="stacker01" />
          </el-select>
        </el-form-item>
        <el-form-item label="区域" prop="area">
          <el-select v-model="queryParams.area" placeholder="请选择" clearable style="width: 150px">
            <el-option label="原料区" value="raw" />
            <el-option label="生产区" value="production" />
            <el-option label="成品区" value="finished" />
            <el-option label="出货区" value="shipping" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-select v-model="queryParams.status" placeholder="请选择" clearable style="width: 120px">
            <el-option label="待执行" value="pending" />
            <el-option label="进行中" value="running" />
            <el-option label="已完成" value="completed" />
            <el-option label="异常" value="error" />
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

    <!-- 工单列表 -->
    <el-card class="table-card" shadow="never">
      <template #header>
        <div class="card-header">
          <span><el-icon><List /></el-icon> 工单列表</span>
          <el-button type="primary" @click="handleExport">
            <el-icon><Download /></el-icon> 导出
          </el-button>
        </div>
      </template>
      <el-table :data="workorderList" stripe v-loading="loading">
        <el-table-column type="expand">
          <template #default="{ row }">
            <div class="expand-content">
              <el-descriptions :column="3" border>
                <el-descriptions-item label="工单描述">{{ row.description }}</el-descriptions-item>
                <el-descriptions-item label="执行设备">{{ row.deviceName }}</el-descriptions-item>
                <el-descriptions-item label="执行区域">{{ row.areaName }}</el-descriptions-item>
                <el-descriptions-item label="预计耗时">{{ row.estimatedTime }}分钟</el-descriptions-item>
                <el-descriptions-item label="实际耗时">{{ row.actualTime || '-' }}分钟</el-descriptions-item>
                <el-descriptions-item label="优先级">
                  <el-tag :type="row.priority === 'high' ? 'danger' : row.priority === 'medium' ? 'warning' : 'info'">
                    {{ row.priority === 'high' ? '高' : row.priority === 'medium' ? '中' : '低' }}
                  </el-tag>
                </el-descriptions-item>
              </el-descriptions>
              <div class="progress-section" v-if="row.status === 'running'">
                <span class="progress-label">执行进度：</span>
                <el-progress :percentage="row.progress" :status="row.progress === 100 ? 'success' : ''" />
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column type="index" width="50" />
        <el-table-column label="工单号" prop="workorderNo" min-width="140" show-overflow-tooltip />
        <el-table-column label="工单名称" prop="workorderName" min-width="150" show-overflow-tooltip />
        <el-table-column label="状态" prop="status" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)" effect="dark">
              {{ getStatusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="进度" prop="progress" width="120">
          <template #default="{ row }">
            <el-progress :percentage="row.progress" :status="row.progress === 100 ? 'success' : ''" :stroke-width="6" />
          </template>
        </el-table-column>
        <el-table-column label="创建时间" prop="createTime" width="160" />
        <el-table-column label="操作" width="150" fixed="right" align="center">
          <template #default="{ row }">
            <el-button type="primary" link @click="handleView(row)">详情</el-button>
            <el-button v-if="row.status === 'error'" type="danger" link @click="handleRetry(row)">重试</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { ElMessage } from 'element-plus'
import {
  Guide, Document, Download, Upload, MapLocation,
  Search, Refresh, Edit, Delete, List
} from '@element-plus/icons-vue'

// 查询参数
const queryParams = ref({
  workorderNo: '',
  device: '',
  area: '',
  status: ''
})
const loading = ref(false)
const searchKeyword = ref('')

// 工单列表
const workorderList = ref([
  {
    workorderNo: 'WO20250326001',
    workorderName: '原料搬运任务A',
    status: 'running',
    progress: 65,
    createTime: '2026-03-26 08:30:00',
    description: '将原料从仓库A搬运至生产线B',
    deviceName: 'AGV-001',
    areaName: '原料区→生产区',
    estimatedTime: 30,
    actualTime: 20,
    priority: 'high'
  },
  {
    workorderNo: 'WO20250326002',
    workorderName: '成品入库任务B',
    status: 'completed',
    progress: 100,
    createTime: '2026-03-26 07:15:00',
    description: '将成品从包装线搬运至成品库C',
    deviceName: 'AGV-002',
    areaName: '包装区→成品区',
    estimatedTime: 25,
    actualTime: 22,
    priority: 'medium'
  },
  {
    workorderNo: 'WO20250326003',
    workorderName: '废料清理任务C',
    status: 'error',
    progress: 45,
    createTime: '2026-03-26 06:00:00',
    description: '清理生产线废料并运送至废料区',
    deviceName: 'AGV-003',
    areaName: '生产区→废料区',
    estimatedTime: 20,
    actualTime: null,
    priority: 'low'
  }
])

// 获取状态类型
const getStatusType = (status) => {
  const map = {
    pending: 'info',
    running: 'warning',
    completed: 'success',
    error: 'danger'
  }
  return map[status] || 'info'
}

const getStatusText = (status) => {
  const map = {
    pending: '待执行',
    running: '进行中',
    completed: '已完成',
    error: '异常'
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
    workorderNo: '',
    device: '',
    area: '',
    status: ''
  }
  handleQuery()
}

// 导出
const handleExport = () => {
  ElMessage.success('工单数据导出成功')
}

// 查看详情
const handleView = (row) => {
  ElMessage.info(`查看工单详情：${row.workorderNo}`)
}

// 重试
const handleRetry = (row) => {
  ElMessage.success(`工单 ${row.workorderNo} 已重新提交执行`)
}
</script>

<style lang="scss" scoped>
.workorder-container {
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

    &.text-success { color: #67C23A; }
    &.text-warning { color: #E6A23C; }
    &.text-danger { color: #F56C6C; }
  }

  .stat-label {
    font-size: 14px;
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
  }
}

.expand-content {
  padding: 20px;

  .progress-section {
    margin-top: 20px;
    display: flex;
    align-items: center;
    gap: 12px;

    .progress-label {
      font-weight: 500;
      color: #606266;
      white-space: nowrap;
    }

    :deep(.el-progress) {
      flex: 1;
    }
  }
}
</style>