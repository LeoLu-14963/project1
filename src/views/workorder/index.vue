<template>
  <div class="workorder-container">
    <!-- 页面标题 -->
    <div class="page-header">
      <h2>工单管理</h2>
      <p class="text-secondary">工单创建、查看与管理</p>
    </div>

    <!-- 搜索筛选和操作栏 -->
    <el-card class="search-card" shadow="never">
      <el-form :model="queryParams" ref="queryForm" :inline="true">
        <el-form-item label="工单号/物料号" prop="keyword">
          <el-input v-model="queryParams.keyword" placeholder="请输入工单号或物料号" clearable style="width: 220px" />
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-select v-model="queryParams.status" placeholder="请选择" clearable style="width: 120px">
            <el-option label="全部" value="" />
            <el-option label="待执行" value="pending" />
            <el-option label="运输中" value="running" />
            <el-option label="已完成" value="completed" />
            <el-option label="异常" value="error" />
          </el-select>
        </el-form-item>
        <el-form-item label="优先级" prop="priority">
          <el-select v-model="queryParams.priority" placeholder="请选择" clearable style="width: 120px">
            <el-option label="全部" value="" />
            <el-option label="紧急" value="high" />
            <el-option label="普通" value="medium" />
            <el-option label="低" value="low" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleQuery">
            <el-icon><Search /></el-icon> 搜索
          </el-button>
          <el-button @click="handleRefresh">
            <el-icon><Refresh /></el-icon> 刷新
          </el-button>
        </el-form-item>
      </el-form>
      <div class="action-bar">
        <el-radio-group v-model="viewMode" size="small">
          <el-radio-button value="card">
            <el-icon><Grid /></el-icon> 卡片视图
          </el-radio-button>
          <el-radio-button value="list">
            <el-icon><List /></el-icon> 列表视图
          </el-radio-button>
        </el-radio-group>
        <el-button type="primary" @click="handleCreate">
          <el-icon><Plus /></el-icon> 新建工单
        </el-button>
      </div>
    </el-card>

    <!-- 卡片视图 -->
    <div v-if="viewMode === 'card'" class="card-view">
      <el-row :gutter="20">
        <el-col :xs="24" :sm="12" :lg="8" :xl="6" v-for="item in workorderList" :key="item.workorderNo">
          <el-card class="workorder-card" shadow="hover">
            <!-- 卡片头部：工单号和优先级 -->
            <div class="card-header">
              <div class="workorder-no">{{ item.workorderNo }}</div>
              <el-tag :type="getPriorityType(item.priority)" effect="dark" size="small">
                {{ getPriorityText(item.priority) }}
              </el-tag>
            </div>

            <!-- 物料信息 -->
            <div class="material-info">
              <div class="material-name">{{ item.materialName }}</div>
              <el-tag :type="getStatusType(item.status)" effect="light" size="small">
                {{ getStatusText(item.status) }}
              </el-tag>
            </div>

            <!-- 工单详情 -->
            <div class="workorder-details">
              <div class="detail-item">
                <span class="detail-label">数量：</span>
                <span class="detail-value">{{ item.quantity }}{{ item.unit }}</span>
              </div>
            </div>

            <!-- 运输信息 -->
            <div class="transport-info">
              <div class="location-item">
                <el-icon class="location-icon"><Position /></el-icon>
                <span class="location-text">{{ item.startLocation }}</span>
              </div>
              <div class="location-divider"></div>
              <div class="location-item">
                <el-icon class="location-icon"><Promotion /></el-icon>
                <span class="location-text">{{ item.endLocation }}</span>
              </div>
            </div>

            <!-- 预计时间 -->
            <div class="eta-info">
              <el-icon><Clock /></el-icon>
              <span>预计完成：{{ item.estimatedTime }}</span>
            </div>

            <!-- 当前状态和进度条 -->
            <div class="current-status">
              <div class="status-left">
                <div class="status-indicator" :class="item.status"></div>
                <span class="status-text">{{ item.currentStatus }}</span>
              </div>
              <div class="progress-wrapper" v-if="item.status === 'running'">
                <el-progress :percentage="item.progress" :status="item.progress === 100 ? 'success' : ''" :stroke-width="6" :show-text="false" />
              </div>
            </div>

            <!-- 操作按钮 -->
            <div class="card-actions">
              <el-button type="primary" link size="small" @click="handleView(item)">详情</el-button>
              <el-button v-if="item.status === 'error'" type="danger" link size="small" @click="handleRetry(item)">重试</el-button>
              <el-button v-if="item.status === 'pending' || item.status === 'running'" type="info" link size="small" @click="handleCancel(item)">取消</el-button>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <!-- 列表视图 -->
    <div v-else class="list-view">
      <el-card class="table-card" shadow="never">
        <el-table :data="workorderList" stripe v-loading="loading">
          <el-table-column type="index" width="50" />
          <el-table-column label="工单号" prop="workorderNo" min-width="140" show-overflow-tooltip />
          <el-table-column label="物料名称" prop="materialName" min-width="150" show-overflow-tooltip />
          <el-table-column label="优先级" prop="priority" width="90" align="center">
            <template #default="{ row }">
              <el-tag :type="getPriorityType(row.priority)" effect="dark" size="small">
                {{ getPriorityText(row.priority) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="状态" prop="status" width="100" align="center">
            <template #default="{ row }">
              <el-tag :type="getStatusType(row.status)" effect="dark">
                {{ getStatusText(row.status) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="进度" prop="progress" width="150">
            <template #default="{ row }">
              <el-progress :percentage="row.progress" :status="row.progress === 100 ? 'success' : ''" :stroke-width="6" />
            </template>
          </el-table-column>
          <el-table-column label="起点" prop="startLocation" min-width="120" show-overflow-tooltip />
          <el-table-column label="终点" prop="endLocation" min-width="120" show-overflow-tooltip />
          <el-table-column label="预计完成" prop="estimatedTime" width="160" />
          <el-table-column label="操作" width="200" fixed="right" align="center">
            <template #default="{ row }">
              <el-button type="primary" link @click="handleView(row)">详情</el-button>
              <el-button v-if="row.status === 'error'" type="danger" link @click="handleRetry(row)">重试</el-button>
              <el-button v-if="row.status === 'pending' || row.status === 'running'" type="info" link @click="handleCancel(row)">取消</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-card>
    </div>

    <!-- 新建工单对话框 -->
    <el-dialog v-model="createDialogVisible" title="新建工单" width="600px">
      <el-form :model="createForm" ref="createFormRef" :rules="createRules" label-width="100px">
        <el-form-item label="工单号" prop="workorderNo">
          <el-input v-model="createForm.workorderNo" placeholder="请输入工单号" />
        </el-form-item>
        <el-form-item label="物料名称" prop="materialName">
          <el-input v-model="createForm.materialName" placeholder="请输入物料名称" />
        </el-form-item>
        <el-form-item label="优先级" prop="priority">
          <el-select v-model="createForm.priority" placeholder="请选择优先级" style="width: 100%">
            <el-option label="自动" value="auto" />
            <el-option label="紧急" value="high" />
            <el-option label="普通" value="medium" />
            <el-option label="低" value="low" />
          </el-select>
        </el-form-item>
        <el-form-item label="数量" prop="quantity">
          <el-input-number v-model="createForm.quantity" :min="1" />
        </el-form-item>
        <el-form-item label="单位" prop="unit">
          <el-select v-model="createForm.unit" placeholder="请选择单位" style="width: 100%">
            <el-option label="件" value="件" />
            <el-option label="箱" value="箱" />
            <el-option label="托" value="托" />
            <el-option label="个" value="个" />
          </el-select>
        </el-form-item>
        <el-form-item label="起点" prop="startLocation">
          <el-select v-model="createForm.startLocation" placeholder="请选择起点" style="width: 100%">
            <el-option label="原料仓A" value="原料仓A" />
            <el-option label="原料仓B" value="原料仓B" />
            <el-option label="生产线1" value="生产线1" />
            <el-option label="生产线2" value="生产线2" />
            <el-option label="包装线" value="包装线" />
          </el-select>
        </el-form-item>
        <el-form-item label="终点" prop="endLocation">
          <el-select v-model="createForm.endLocation" placeholder="请选择终点" style="width: 100%">
            <el-option label="成品仓A" value="成品仓A" />
            <el-option label="成品仓B" value="成品仓B" />
            <el-option label="生产线1" value="生产线1" />
            <el-option label="生产线2" value="生产线2" />
            <el-option label="出货区" value="出货区" />
          </el-select>
        </el-form-item>
        <el-form-item label="备注" prop="remark">
          <el-input v-model="createForm.remark" type="textarea" :rows="3" placeholder="请输入备注信息" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="createDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmitCreate">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { ElMessage } from 'element-plus'
import {
  Search, Refresh, List, Grid, Plus, Position, Promotion, Clock
} from '@element-plus/icons-vue'

// 视图模式
const viewMode = ref('card')

// 查询参数
const queryParams = ref({
  keyword: '',
  status: '',
  priority: ''
})
const loading = ref(false)

// 新建工单对话框
const createDialogVisible = ref(false)
const createFormRef = ref(null)
const createForm = ref({
  workorderNo: '',
  materialName: '',
  priority: 'auto',
  quantity: 1,
  unit: '件',
  startLocation: '',
  endLocation: '',
  remark: ''
})
const createRules = {
  workorderNo: [{ required: true, message: '请输入工单号', trigger: 'blur' }],
  materialName: [{ required: true, message: '请输入物料名称', trigger: 'blur' }],
  priority: [{ required: true, message: '请选择优先级', trigger: 'change' }],
  startLocation: [{ required: true, message: '请选择起点', trigger: 'change' }],
  endLocation: [{ required: true, message: '请选择终点', trigger: 'change' }]
}

// 工单列表
const workorderList = ref([
  {
    workorderNo: 'WO20260327001',
    materialName: '电子元器件-芯片',
    status: 'running',
    priority: 'high',
    progress: 65,
    quantity: 200,
    unit: '件',
    startLocation: '原料仓A',
    endLocation: '生产线1',
    estimatedTime: '2026-03-27 12:30:00',
    currentStatus: '运输中...'
  },
  {
    workorderNo: 'WO20260327002',
    materialName: 'PCB主板',
    status: 'pending',
    priority: 'auto',
    progress: 0,
    quantity: 50,
    unit: '块',
    startLocation: '原料仓B',
    endLocation: '生产线2',
    estimatedTime: '2026-03-27 13:00:00',
    currentStatus: '等待执行'
  },
  {
    workorderNo: 'WO20260327003',
    materialName: '成品-智能控制器',
    status: 'completed',
    priority: 'medium',
    progress: 100,
    quantity: 100,
    unit: '箱',
    startLocation: '包装线',
    endLocation: '成品仓A',
    estimatedTime: '2026-03-27 11:00:00',
    currentStatus: '已完成'
  },
  {
    workorderNo: 'WO20260327004',
    materialName: '电子元器件-电阻',
    status: 'error',
    priority: 'low',
    progress: 45,
    quantity: 500,
    unit: '个',
    startLocation: '原料仓A',
    endLocation: '生产线1',
    estimatedTime: '2026-03-27 10:00:00',
    currentStatus: '路径受阻'
  },
  {
    workorderNo: 'WO20260327005',
    materialName: '成品-传感器模块',
    status: 'running',
    priority: 'high',
    progress: 80,
    quantity: 80,
    unit: '托',
    startLocation: '生产线2',
    endLocation: '出货区',
    estimatedTime: '2026-03-27 12:45:00',
    currentStatus: '运输中...'
  },
  {
    workorderNo: 'WO20260327006',
    materialName: 'PCB底板',
    status: 'pending',
    priority: 'auto',
    progress: 0,
    quantity: 120,
    unit: '块',
    startLocation: '原料仓B',
    endLocation: '生产线1',
    estimatedTime: '2026-03-27 14:00:00',
    currentStatus: '等待执行'
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
    running: '运输中',
    completed: '已完成',
    error: '异常'
  }
  return map[status] || status
}

// 获取优先级类型
const getPriorityType = (priority) => {
  const map = {
    auto: 'success',
    high: 'danger',
    medium: 'warning',
    low: 'info'
  }
  return map[priority] || 'info'
}

const getPriorityText = (priority) => {
  const map = {
    auto: '自动',
    high: '紧急',
    medium: '普通',
    low: '低'
  }
  return map[priority] || priority
}

// 搜索
const handleQuery = () => {
  loading.value = true
  setTimeout(() => {
    loading.value = false
    ElMessage.success('搜索完成')
  }, 500)
}

// 刷新
const handleRefresh = () => {
  loading.value = true
  setTimeout(() => {
    loading.value = false
    ElMessage.success('刷新成功')
  }, 500)
}

// 新建工单
const handleCreate = () => {
  createForm.value = {
    workorderNo: '',
    materialName: '',
    priority: 'auto',
    quantity: 1,
    unit: '件',
    startLocation: '',
    endLocation: '',
    remark: ''
  }
  createDialogVisible.value = true
}

// 提交新建工单
const handleSubmitCreate = () => {
  createFormRef.value?.validate((valid) => {
    if (valid) {
      const newWorkorder = {
        workorderNo: createForm.value.workorderNo,
        materialName: createForm.value.materialName,
        status: 'pending',
        priority: createForm.value.priority,
        progress: 0,
        quantity: createForm.value.quantity,
        unit: createForm.value.unit,
        startLocation: createForm.value.startLocation,
        endLocation: createForm.value.endLocation,
        estimatedTime: '2026-03-27 15:00:00',
        currentStatus: '等待执行'
      }
      workorderList.value.unshift(newWorkorder)
      createDialogVisible.value = false
      ElMessage.success('工单创建成功')
    }
  })
}

// 查看详情
const handleView = (row) => {
  ElMessage.info(`查看工单详情：${row.workorderNo}`)
}

// 重试
const handleRetry = (row) => {
  row.status = 'running'
  row.currentStatus = '重试中...'
  ElMessage.success(`工单 ${row.workorderNo} 已重新提交执行`)
}

// 取消
const handleCancel = (row) => {
  ElMessage.warning(`工单 ${row.workorderNo} 已取消`)
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

.search-card {
  margin-bottom: 20px;

  .action-bar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 16px;
    padding-top: 16px;
    border-top: 1px solid #EBEEF5;
  }
}

.card-view {
  .workorder-card {
    margin-bottom: 20px;

    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;

      .workorder-no {
        font-size: 16px;
        font-weight: 600;
        color: #303133;
      }
    }

    .material-info {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;

      .material-name {
        font-size: 15px;
        font-weight: 500;
        color: #606266;
      }
    }

    .workorder-details {
      display: flex;
      gap: 20px;
      margin-bottom: 12px;
      padding: 8px 0;
      border-top: 1px solid #F5F7FA;
      border-bottom: 1px solid #F5F7FA;

      .detail-item {
        .detail-label {
          color: #909399;
          font-size: 13px;
        }

        .detail-value {
          color: #303133;
          font-weight: 500;
        }
      }
    }

    .transport-info {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 12px;

      .location-item {
        display: flex;
        align-items: center;
        gap: 6px;
        flex: 1;
        min-width: 0;

        .location-icon {
          color: #409EFF;
          flex-shrink: 0;
        }

        .location-text {
          font-size: 13px;
          color: #606266;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
      }

      .location-divider {
        width: 24px;
        height: 2px;
        background: linear-gradient(90deg, #409EFF, #67C23A);
        border-radius: 1px;
        flex-shrink: 0;
      }
    }

    .eta-info {
      display: flex;
      align-items: center;
      gap: 6px;
      margin-bottom: 12px;
      padding: 8px 12px;
      background: #F5F7FA;
      border-radius: 4px;
      font-size: 13px;
      color: #606266;
    }

    .current-status {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      margin-bottom: 12px;

      .status-left {
        display: flex;
        align-items: center;
        gap: 8px;
        flex-shrink: 0;
      }

      .status-indicator {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        flex-shrink: 0;

        &.pending {
          background: #909399;
        }

        &.running {
          background: #E6A23C;
          animation: pulse 1.5s infinite;
        }

        &.completed {
          background: #67C23A;
        }

        &.error {
          background: #F56C6C;
        }
      }

      .status-text {
        font-size: 13px;
        color: #606266;
        white-space: nowrap;
      }

      .progress-wrapper {
        flex: 1;
        min-width: 0;
      }
    }

    .card-actions {
      display: flex;
      justify-content: flex-end;
      gap: 8px;
      padding-top: 12px;
      border-top: 1px solid #F5F7FA;
    }
  }
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.4;
  }
}

.list-view {
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
}
</style>