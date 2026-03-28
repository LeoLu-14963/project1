<template>
  <div class="device-container">
    <!-- 页面标题 -->
    <div class="page-header">
      <h2>设备管理</h2>
      <p class="text-secondary">管理所有设备信息、状态监控与维护</p>
    </div>

    <!-- 主要内容区域 - 两列布局 -->
    <el-row :gutter="20" class="main-content-row">
      <!-- 左列 - 设备概览 -->
      <el-col :xs="24" :lg="8">
        <!-- 设备概览 -->
        <el-card class="overview-card" shadow="hover">
          <template #header>
            <div class="card-header">
              <span><el-icon><Monitor /></el-icon> 设备概览</span>
              <div class="header-right">
                <span class="monitor-status" :class="{ active: monitoring }">
                  <span class="monitor-dot"></span>
                  {{ monitoring ? '监控中' : '已暂停' }}
                </span>
                <el-button type="primary" link size="small" @click="toggleMonitoring">
                  <el-icon><Refresh /></el-icon> {{ monitoring ? '暂停' : '开始' }}
                </el-button>
              </div>
            </div>
          </template>
          <el-row :gutter="12">
            <el-col :xs="12">
              <div class="stat-item">
                <div class="stat-icon" style="background: #409EFF;">
                  <el-icon :size="20"><Box /></el-icon>
                </div>
                <div class="stat-info">
                  <div class="stat-value">{{ deviceList.length }}</div>
                  <div class="stat-label">设备总数</div>
                </div>
              </div>
            </el-col>
            <el-col :xs="12">
              <div class="stat-item">
                <div class="stat-icon" style="background: #67C23A;">
                  <el-icon :size="20"><CircleCheck /></el-icon>
                </div>
                <div class="stat-info">
                  <div class="stat-value">{{ overviewData.onlineCount }}</div>
                  <div class="stat-label">在线设备</div>
                </div>
              </div>
            </el-col>
            <el-col :xs="12">
              <div class="stat-item">
                <div class="stat-icon" style="background: #E6A23C;">
                  <el-icon :size="20"><Warning /></el-icon>
                </div>
                <div class="stat-info">
                  <div class="stat-value">{{ overviewData.warningCount }}</div>
                  <div class="stat-label">告警设备</div>
                </div>
              </div>
            </el-col>
            <el-col :xs="12">
              <div class="stat-item">
                <div class="stat-icon" style="background: #909399;">
                  <el-icon :size="20"><CircleClose /></el-icon>
                </div>
                <div class="stat-info">
                  <div class="stat-value">{{ overviewData.offlineCount }}</div>
                  <div class="stat-label">离线设备</div>
                </div>
              </div>
            </el-col>
          </el-row>
          
          <!-- 设备类型分布 - 圆环饼图 -->
          <div class="type-chart-container">
            <div class="chart-title">设备类型分布</div>
            <div class="donut-chart">
              <svg width="140" height="140" viewBox="0 0 200 200">
                <circle cx="100" cy="100" r="80" fill="none" stroke="#f0f0f0" stroke-width="30" />
                <g v-for="(segment, index) in chartSegments" :key="index">
                  <circle 
                    cx="100" 
                    cy="100" 
                    r="80" 
                    fill="none" 
                    :stroke="segment.color" 
                    stroke-width="30"
                    :stroke-dasharray="segment.dashArray"
                    :stroke-dashoffset="segment.dashOffset"
                    transform="rotate(-90 100 100)"
                    style="transition: all 0.5s;"
                  />
                </g>
              </svg>
              <div class="chart-center">
                <div class="chart-center-value">{{ deviceList.length }}</div>
                <div class="chart-center-label">设备</div>
              </div>
            </div>
            <div class="chart-legend">
              <div v-for="(stat, index) in typeStats" :key="stat.type" class="legend-item">
                <span class="legend-dot" :style="{ background: getTypeColor(stat.type) }"></span>
                <span class="legend-label">{{ getDeviceTypeText(stat.type) }}</span>
                <span class="legend-count">{{ stat.count }}</span>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>

      <!-- 右列 - 位置可视化 -->
      <el-col :xs="24" :lg="16">
        <el-card class="visual-card" shadow="hover">
          <template #header>
            <div class="card-header">
              <span><el-icon><MapLocation /></el-icon> 位置可视化</span>
            </div>
          </template>
          
          <!-- 楼层/区域切换 Tab -->
          <el-tabs v-model="visualFloor" class="floor-tabs" @tab-change="handleFloorChange">
            <el-tab-pane 
              v-for="floor in floors" 
              :key="floor"
              :label="floor"
              :name="floor"
            />
          </el-tabs>

          <!-- 地图区域 -->
          <div class="map-container">
            <div class="map-legend">
              <div class="legend-item">
                <span class="legend-dot" style="background: #67C23A;"></span>
                <span>在线</span>
              </div>
              <div class="legend-item">
                <span class="legend-dot" style="background: #E6A23C;"></span>
                <span>告警</span>
              </div>
              <div class="legend-item">
                <span class="legend-dot" style="background: #F56C6C;"></span>
                <span>维护中</span>
              </div>
              <div class="legend-item">
                <span class="legend-dot" style="background: #909399;"></span>
                <span>离线</span>
              </div>
            </div>

            <div class="map-area">
              <div class="map-grid">
                <!-- 绘制网格和设备 -->
                <div 
                  v-for="device in currentFloorDevices" 
                  :key="device.deviceCode"
                  class="map-device"
                  :class="`status-${device.status}`"
                  :style="{ left: device.mapX + 'px', top: device.mapY + 'px' }"
                  @click="handleDeviceClick(device)"
                >
                  <div class="device-marker">
                    <div class="marker-inner">{{ getDeviceTypeIcon(device.deviceType) }}</div>
                  </div>
                  <div class="device-label">{{ device.deviceCode }}</div>
                </div>

                <!-- 区域标签 -->
                <div v-for="(area, index) in areas" :key="'area-' + area" class="area-label" :style="getAreaPosition(index)">
                  {{ area }}
                </div>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 搜索筛选区域 -->
    <el-card class="search-card" shadow="never" style="margin-top: 20px;">
      <el-form :model="queryParams" ref="queryForm" :inline="true">
        <el-form-item label="设备编号" prop="deviceCode">
          <el-input
            v-model="queryParams.deviceCode"
            placeholder="请输入设备编号"
            clearable
            @keyup.enter="handleQuery"
          />
        </el-form-item>
        <el-form-item label="设备名称" prop="deviceName">
          <el-input
            v-model="queryParams.deviceName"
            placeholder="请输入设备名称"
            clearable
            @keyup.enter="handleQuery"
          />
        </el-form-item>
        <el-form-item label="设备类型" prop="deviceType">
          <el-select v-model="queryParams.deviceType" placeholder="请选择" clearable>
            <el-option v-for="type in deviceTypes" :key="type.value" :label="type.label" :value="type.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="设备状态" prop="status">
          <el-select v-model="queryParams.status" placeholder="请选择" clearable>
            <el-option label="在线" value="online" />
            <el-option label="离线" value="offline" />
            <el-option label="告警" value="warning" />
            <el-option label="维护中" value="maintenance" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleQuery">
            <el-icon><Search /></el-icon> 搜索
          </el-button>
          <el-button @click="resetQuery">
            <el-icon><Refresh /></el-icon> 重置
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 操作按钮区域 -->
    <div class="table-operations">
      <el-button type="primary" @click="handleAdd">
        <el-icon><Plus /></el-icon> 新增设备
      </el-button>
      <el-button type="warning" @click="handleInspection" :loading="inspecting">
        <el-icon><Refresh /></el-icon> 设备巡检
      </el-button>
      <el-button type="success" @click="handleExport">
        <el-icon><Download /></el-icon> 导出
      </el-button>
      <el-button type="danger" :disabled="selectedDevices.length === 0" @click="handleBatchDelete">
        <el-icon><Delete /></el-icon> 批量删除
      </el-button>
    </div>

    <!-- 数据表格 -->
    <el-card shadow="never">
      <el-table
        v-loading="loading"
        :data="deviceList"
        @selection-change="handleSelectionChange"
        stripe
      >
        <el-table-column type="selection" width="55" align="center" />
        <el-table-column label="设备编号" prop="deviceCode" min-width="120" show-overflow-tooltip />
        <el-table-column label="设备名称" prop="deviceName" min-width="150" show-overflow-tooltip />
        <el-table-column label="设备类型" prop="deviceType" width="120">
          <template #default="{ row }">
            <el-tag :type="getDeviceTypeType(row.deviceType)" size="small">
              {{ getDeviceTypeText(row.deviceType) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="所在区域" prop="area" width="100" />
        <el-table-column label="所在楼层" prop="floor" width="100" />
        <el-table-column label="IP地址" prop="ipAddress" width="140" />
        <el-table-column label="健康状态" prop="healthStatus" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="getHealthType(row.healthStatus)" size="small">
              {{ getHealthText(row.healthStatus) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="状态" prop="status" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)" effect="dark" size="small">
              {{ getStatusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="最后更新" prop="lastUpdateTime" width="160" />
        <el-table-column label="操作" width="200" fixed="right" align="center">
          <template #default="{ row }">
            <el-button type="primary" link @click="handleView(row)">
              <el-icon><View /></el-icon> 详情
            </el-button>
            <el-button type="primary" link @click="handleEdit(row)">
              <el-icon><Edit /></el-icon> 编辑
            </el-button>
            <el-dropdown trigger="click" @command="(cmd) => handleCommand(cmd, row)">
              <el-button type="primary" link>
                <el-icon><MoreFilled /></el-icon> 更多
              </el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="check">
                    <el-icon><Refresh /></el-icon> 检查设备
                  </el-dropdown-item>
                  <el-dropdown-item command="enable" :disabled="row.status === 'online'">
                    <el-icon><CircleCheck /></el-icon> 启用
                  </el-dropdown-item>
                  <el-dropdown-item command="disable" :disabled="row.status === 'offline'">
                    <el-icon><CircleClose /></el-icon> 禁用
                  </el-dropdown-item>
                  <el-dropdown-item divided command="delete" style="color: #f56c6c;">
                    <el-icon><Delete /></el-icon> 删除
                  </el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
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
    </el-card>

    <!-- 新增/编辑对话框 -->
    <el-dialog
      :title="dialogTitle"
      v-model="dialogVisible"
      width="600px"
      append-to-body
    >
      <el-form
        ref="deviceFormRef"
        :model="deviceForm"
        :rules="deviceRules"
        label-width="100px"
      >
        <el-form-item label="设备编号" prop="deviceCode">
          <el-input v-model="deviceForm.deviceCode" placeholder="请输入设备编号" />
        </el-form-item>
        <el-form-item label="设备名称" prop="deviceName">
          <el-input v-model="deviceForm.deviceName" placeholder="请输入设备名称" />
        </el-form-item>
        <el-form-item label="设备类型" prop="deviceType">
          <el-select v-model="deviceForm.deviceType" placeholder="请选择设备类型" style="width: 100%">
            <el-option v-for="type in deviceTypes" :key="type.value" :label="type.label" :value="type.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="所在楼层" prop="floor">
          <el-select v-model="deviceForm.floor" placeholder="请选择楼层" style="width: 100%">
            <el-option v-for="floor in floors" :key="floor" :label="floor" :value="floor" />
          </el-select>
        </el-form-item>
        <el-form-item label="所在区域" prop="area">
          <el-select v-model="deviceForm.area" placeholder="请选择所在区域" style="width: 100%">
            <el-option v-for="area in areas" :key="area" :label="area" :value="area" />
          </el-select>
        </el-form-item>
        <el-form-item label="IP地址" prop="ipAddress">
          <el-input v-model="deviceForm.ipAddress" placeholder="请输入IP地址" />
        </el-form-item>
        <el-form-item label="备注" prop="remark">
          <el-input
            v-model="deviceForm.remark"
            type="textarea"
            :rows="3"
            placeholder="请输入备注信息"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="dialogVisible = false">取 消</el-button>
          <el-button type="primary" @click="submitForm">确 定</el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 详情对话框 -->
    <el-dialog
      title="设备详情"
      v-model="detailVisible"
      width="700px"
      append-to-body
    >
      <el-descriptions :column="2" border v-if="currentDevice">
        <el-descriptions-item label="设备编号">{{ currentDevice.deviceCode }}</el-descriptions-item>
        <el-descriptions-item label="设备名称">{{ currentDevice.deviceName }}</el-descriptions-item>
        <el-descriptions-item label="设备类型">
          <el-tag :type="getDeviceTypeType(currentDevice.deviceType)" size="small">
            {{ getDeviceTypeText(currentDevice.deviceType) }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="所在楼层">{{ currentDevice.floor }}</el-descriptions-item>
        <el-descriptions-item label="所在区域">{{ currentDevice.area }}</el-descriptions-item>
        <el-descriptions-item label="IP地址">{{ currentDevice.ipAddress }}</el-descriptions-item>
        <el-descriptions-item label="健康状态">
          <el-tag :type="getHealthType(currentDevice.healthStatus)" size="small">
            {{ getHealthText(currentDevice.healthStatus) }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="当前状态">
          <el-tag :type="getStatusType(currentDevice.status)" effect="dark" size="small">
            {{ getStatusText(currentDevice.status) }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="最后更新" :span="2">{{ currentDevice.lastUpdateTime }}</el-descriptions-item>
      </el-descriptions>
      <template #footer>
        <el-button @click="detailVisible = false">关 闭</el-button>
      </template>
    </el-dialog>

    <!-- 巡检结果对话框 -->
    <el-dialog
      title="设备巡检结果"
      v-model="inspectionResultVisible"
      width="600px"
    >
      <div v-if="inspectionResult">
        <el-alert
          :title="`巡检完成：${inspectionResult.successCount}/${inspectionResult.totalCount} 台设备正常`"
          :type="inspectionResult.successCount === inspectionResult.totalCount ? 'success' : 'warning'"
          :description="inspectionResult.message"
          show-icon
          :closable="false"
        />
        <div v-if="inspectionResult.details && inspectionResult.details.length > 0" class="inspection-details" style="margin-top: 15px;">
          <p style="margin-bottom: 8px; font-weight: 600;">巡检详情：</p>
          <ul style="max-height: 300px; overflow-y: auto; margin: 0; padding-left: 0; list-style: none;">
            <li v-for="(detail, index) in inspectionResult.details" :key="index" :class="['inspection-detail-item', detail.success ? 'success' : 'fail']">
              <el-icon><CircleCheck v-if="detail.success" /><CircleClose v-else /></el-icon>
              <span>{{ detail.deviceName }}: {{ detail.message }}</span>
            </li>
          </ul>
        </div>
      </div>
      <template #footer>
        <el-button @click="inspectionResultVisible = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Search, Refresh, Plus, Download, Delete,
  View, Edit, MoreFilled, CircleCheck, CircleClose,
  Monitor, Warning, Box, Connection, MapLocation
} from '@element-plus/icons-vue'

// 加载状态
const loading = ref(false)
const monitoring = ref(true)
const monitorTimer = ref(null)

// 设备类型
const deviceTypes = ref([
  { label: '提升机', value: 'elevator' },
  { label: '上下板机', value: 'loader' },
  { label: '货架', value: 'shelf' },
  { label: '传递窗', value: 'passbox' },
  { label: '风淋室', value: 'airshower' },
  { label: '立库', value: 'asrs' },
  { label: 'AGV', value: 'agv' },
  { label: '货架信号灯', value: 'light' }
])

// 楼层列表
const floors = ref(['一楼', '二楼', '三楼', '四楼'])

// 区域列表
const areas = ref(['A区', 'B区', 'C区', 'D区'])

// 当前选中的楼层
const visualFloor = ref('一楼')

// 查询参数
const queryParams = ref({
  pageNum: 1,
  pageSize: 10,
  deviceCode: '',
  deviceName: '',
  deviceType: '',
  status: ''
})

// 分页相关
const total = ref(0)

// 选中的设备
const selectedDevices = ref([])

// 对话框相关
const dialogVisible = ref(false)
const dialogTitle = ref('新增设备')
const detailVisible = ref(false)
const currentDevice = ref(null)
const inspectionResultVisible = ref(false)
const inspectionResult = ref(null)
const inspecting = ref(false)

// 表单相关
const deviceFormRef = ref(null)
const queryForm = ref(null)
const deviceForm = ref({
  deviceCode: '',
  deviceName: '',
  deviceType: '',
  floor: '',
  area: '',
  ipAddress: '',
  remark: ''
})

const deviceRules = {
  deviceCode: [{ required: true, message: '请输入设备编号', trigger: 'blur' }],
  deviceName: [{ required: true, message: '请输入设备名称', trigger: 'blur' }],
  deviceType: [{ required: true, message: '请选择设备类型', trigger: 'change' }],
  floor: [{ required: true, message: '请选择楼层', trigger: 'change' }],
  area: [{ required: true, message: '请选择区域', trigger: 'change' }]
}

// 设备列表
const deviceList = ref([
  {
    deviceCode: 'ELEV-001',
    deviceName: '提升机-01',
    deviceType: 'elevator',
    floor: '一楼',
    area: 'A区',
    ipAddress: '192.168.1.101',
    status: 'online',
    healthStatus: 'healthy',
    lastUpdateTime: '2026-03-26 21:50:00',
    mapX: 80,
    mapY: 80
  },
  {
    deviceCode: 'LOAD-001',
    deviceName: '上下板机-01',
    deviceType: 'loader',
    floor: '一楼',
    area: 'A区',
    ipAddress: '192.168.1.102',
    status: 'online',
    healthStatus: 'healthy',
    lastUpdateTime: '2026-03-26 21:48:00',
    mapX: 200,
    mapY: 80
  },
  {
    deviceCode: 'SHELF-001',
    deviceName: '货架-01',
    deviceType: 'shelf',
    floor: '一楼',
    area: 'B区',
    ipAddress: '192.168.1.201',
    status: 'warning',
    healthStatus: 'warning',
    lastUpdateTime: '2026-03-26 21:30:00',
    mapX: 350,
    mapY: 80
  },
  {
    deviceCode: 'PASS-001',
    deviceName: '传递窗-01',
    deviceType: 'passbox',
    floor: '一楼',
    area: 'B区',
    ipAddress: '192.168.1.202',
    status: 'online',
    healthStatus: 'healthy',
    lastUpdateTime: '2026-03-26 21:52:00',
    mapX: 470,
    mapY: 80
  },
  {
    deviceCode: 'AIR-001',
    deviceName: '风淋室-01',
    deviceType: 'airshower',
    floor: '二楼',
    area: 'C区',
    ipAddress: '192.168.1.301',
    status: 'offline',
    healthStatus: 'unknown',
    lastUpdateTime: '2026-03-26 18:00:00',
    mapX: 80,
    mapY: 200
  },
  {
    deviceCode: 'ASRS-001',
    deviceName: '立库-01',
    deviceType: 'asrs',
    floor: '二楼',
    area: 'C区',
    ipAddress: '192.168.1.302',
    status: 'online',
    healthStatus: 'healthy',
    lastUpdateTime: '2026-03-26 21:55:00',
    mapX: 200,
    mapY: 200
  },
  {
    deviceCode: 'AGV-001',
    deviceName: 'AGV-01',
    deviceType: 'agv',
    floor: '三楼',
    area: 'D区',
    ipAddress: '192.168.1.401',
    status: 'maintenance',
    healthStatus: 'maintenance',
    lastUpdateTime: '2026-03-26 12:00:00',
    mapX: 350,
    mapY: 200
  },
  {
    deviceCode: 'LIGHT-001',
    deviceName: '货架信号灯-01',
    deviceType: 'light',
    floor: '三楼',
    area: 'D区',
    ipAddress: '192.168.1.402',
    status: 'online',
    healthStatus: 'healthy',
    lastUpdateTime: '2026-03-26 21:45:00',
    mapX: 470,
    mapY: 200
  },
  {
    deviceCode: 'ELEV-002',
    deviceName: '提升机-02',
    deviceType: 'elevator',
    floor: '四楼',
    area: 'A区',
    ipAddress: '192.168.1.103',
    status: 'online',
    healthStatus: 'healthy',
    lastUpdateTime: '2026-03-26 21:53:00',
    mapX: 80,
    mapY: 320
  },
  {
    deviceCode: 'LOAD-002',
    deviceName: '上下板机-02',
    deviceType: 'loader',
    floor: '四楼',
    area: 'B区',
    ipAddress: '192.168.1.104',
    status: 'warning',
    healthStatus: 'warning',
    lastUpdateTime: '2026-03-26 21:20:00',
    mapX: 200,
    mapY: 320
  }
])

// 当前楼层设备
const currentFloorDevices = computed(() => {
  return deviceList.value.filter(d => d.floor === visualFloor.value)
})

// 概览数据
const overviewData = computed(() => {
  const online = deviceList.value.filter(d => d.status === 'online').length
  const warning = deviceList.value.filter(d => d.status === 'warning').length
  const offline = deviceList.value.filter(d => d.status === 'offline' || d.status === 'maintenance').length
  return {
    onlineCount: online,
    warningCount: warning,
    offlineCount: offline
  }
})

// 设备类型统计
const typeStats = computed(() => {
  const stats = {}
  deviceList.value.forEach(d => {
    stats[d.deviceType] = (stats[d.deviceType] || 0) + 1
  })
  return Object.keys(stats).map(type => ({
    type,
    count: stats[type]
  }))
})

// 圆环饼图数据
const chartSegments = computed(() => {
  const total = deviceList.value.length
  if (total === 0) return []
  
  const circumference = 2 * Math.PI * 80
  let currentOffset = 0
  
  return typeStats.value.map((stat, index) => {
    const percentage = stat.count / total
    const dashArray = `${percentage * circumference} ${circumference}`
    const dashOffset = currentOffset
    currentOffset -= percentage * circumference
    
    return {
      color: getTypeColor(stat.type),
      dashArray,
      dashOffset
    }
  })
})

// 获取设备类型样式
const getDeviceTypeType = (type) => {
  const map = {
    elevator: 'primary',
    loader: 'success',
    shelf: 'warning',
    passbox: 'danger',
    airshower: 'info',
    asrs: '',
    agv: 'primary',
    light: 'success'
  }
  return map[type] || 'info'
}

const getDeviceTypeText = (type) => {
  const typeItem = deviceTypes.value.find(t => t.value === type)
  return typeItem ? typeItem.label : type
}

const getDeviceTypeIcon = (type) => {
  const map = {
    elevator: '提',
    loader: '上',
    shelf: '货',
    passbox: '传',
    airshower: '风',
    asrs: '立',
    agv: 'A',
    light: '灯'
  }
  return map[type] || '?'
}

// 获取类型颜色
const getTypeColor = (type) => {
  const map = {
    elevator: '#409EFF',
    loader: '#67C23A',
    shelf: '#E6A23C',
    passbox: '#F56C6C',
    airshower: '#909399',
    asrs: '#606266',
    agv: '#409EFF',
    light: '#67C23A'
  }
  return map[type] || '#909399'
}

// 获取区域位置
const getAreaPosition = (index) => {
  const positions = [
    { left: '20px', top: '20px' },
    { left: '290px', top: '20px' },
    { left: '20px', top: '140px' },
    { left: '290px', top: '140px' }
  ]
  return positions[index] || positions[0]
}

// 获取状态样式
const getStatusType = (status) => {
  const map = {
    online: 'success',
    offline: 'info',
    warning: 'warning',
    maintenance: 'danger'
  }
  return map[status] || 'info'
}

const getStatusText = (status) => {
  const map = {
    online: '在线',
    offline: '离线',
    warning: '告警',
    maintenance: '维护中'
  }
  return map[status] || status
}

// 获取健康状态
const getHealthType = (status) => {
  const map = {
    healthy: 'success',
    warning: 'warning',
    unhealthy: 'danger',
    maintenance: 'info',
    unknown: 'info'
  }
  return map[status] || 'info'
}

const getHealthText = (status) => {
  const map = {
    healthy: '健康',
    warning: '亚健康',
    unhealthy: '异常',
    maintenance: '维护中',
    unknown: '未知'
  }
  return map[status] || status
}

// 获取列表
const getList = () => {
  loading.value = true
  setTimeout(() => {
    loading.value = false
    total.value = deviceList.value.length
  }, 500)
}

// 搜索
const handleQuery = () => {
  queryParams.value.pageNum = 1
  getList()
  ElMessage.success('搜索完成')
}

const resetQuery = () => {
  queryParams.value = {
    pageNum: 1,
    pageSize: 10,
    deviceCode: '',
    deviceName: '',
    deviceType: '',
    status: ''
  }
  handleQuery()
}

// 表格选择
const handleSelectionChange = (selection) => {
  selectedDevices.value = selection || []
}

// 新增
const handleAdd = () => {
  dialogTitle.value = '新增设备'
  deviceForm.value = {
    deviceCode: '',
    deviceName: '',
    deviceType: '',
    floor: '',
    area: '',
    ipAddress: '',
    remark: ''
  }
  dialogVisible.value = true
}

// 编辑
const handleEdit = (row) => {
  dialogTitle.value = '编辑设备'
  deviceForm.value = { ...row }
  dialogVisible.value = true
}

// 查看详情
const handleView = (row) => {
  currentDevice.value = row
  detailVisible.value = true
}

// 点击地图上的设备
const handleDeviceClick = (device) => {
  currentDevice.value = device
  detailVisible.value = true
}

// 切换监控
const toggleMonitoring = () => {
  monitoring.value = !monitoring.value
  if (monitoring.value) {
    startMonitoring()
    ElMessage.success('监控已开启')
  } else {
    stopMonitoring()
    ElMessage.info('监控已暂停')
  }
}

// 开始监控
const startMonitoring = () => {
  if (monitorTimer.value) return
  monitorTimer.value = setInterval(() => {
    deviceList.value.forEach(device => {
      if (Math.random() > 0.9) {
        const statuses = ['online', 'online', 'online', 'warning', 'offline']
        device.status = statuses[Math.floor(Math.random() * statuses.length)]
        device.lastUpdateTime = new Date().toLocaleString('zh-CN')
      }
    })
  }, 5000)
}

// 停止监控
const stopMonitoring = () => {
  if (monitorTimer.value) {
    clearInterval(monitorTimer.value)
    monitorTimer.value = null
  }
}

// 楼层切换
const handleFloorChange = () => {
}

// 更多操作
const handleCommand = (command, row) => {
  switch (command) {
    case 'check':
      handleCheckDevice(row)
      break
    case 'enable':
      row.status = 'online'
      row.healthStatus = 'healthy'
      ElMessage.success(`设备 ${row.deviceCode} 已启用`)
      break
    case 'disable':
      row.status = 'offline'
      row.healthStatus = 'unknown'
      ElMessage.success(`设备 ${row.deviceCode} 已禁用`)
      break
    case 'delete':
      handleDelete(row)
      break
  }
}

// 检查单个设备
const handleCheckDevice = async (row) => {
  inspecting.value = true
  await new Promise(resolve => setTimeout(resolve, 1000))
  
  const success = Math.random() > 0.2
  row.healthStatus = success ? 'healthy' : (Math.random() > 0.5 ? 'warning' : 'unhealthy')
  row.lastUpdateTime = new Date().toLocaleString('zh-CN')
  
  inspectionResult.value = {
    successCount: success ? 1 : 0,
    totalCount: 1,
    message: success 
      ? `设备 ${row.deviceName} 响应正常，健康状态已更新` 
      : `设备 ${row.deviceName} 响应异常，请注意检查`,
    details: [{
      deviceName: row.deviceName,
      success,
      message: success ? '响应正常' : '响应异常'
    }]
  }
  inspectionResultVisible.value = true
  inspecting.value = false
}

// 设备巡检（检查所有在线设备）
const handleInspection = async () => {
  const onlineDevices = deviceList.value.filter(d => d.status === 'online')
  if (onlineDevices.length === 0) {
    ElMessage.warning('当前没有在线设备可巡检')
    return
  }

  inspecting.value = true
  inspectionResult.value = null

  await new Promise(resolve => setTimeout(resolve, 2000))

  const details = onlineDevices.map(device => {
    const success = Math.random() > 0.2
    device.healthStatus = success ? 'healthy' : (Math.random() > 0.5 ? 'warning' : 'unhealthy')
    device.lastUpdateTime = new Date().toLocaleString('zh-CN')
    return {
      deviceName: device.deviceName,
      success,
      message: success ? '响应正常' : '响应异常'
    }
  })

  const successCount = details.filter(d => d.success).length
  inspectionResult.value = {
    successCount,
    totalCount: details.length,
    message: `巡检完成：${successCount}/${details.length} 台设备正常`,
    details
  }

  inspectionResultVisible.value = true
  inspecting.value = false
}

// 删除
const handleDelete = (row) => {
  ElMessageBox.confirm(
    `确定要删除设备 "${row.deviceName}" 吗？`,
    '警告',
    { confirmButtonText: '确定', cancelButtonText: '取消', type: 'danger' }
  ).then(() => {
    const index = deviceList.value.findIndex(item => item.deviceCode === row.deviceCode)
    if (index > -1) {
      deviceList.value.splice(index, 1)
    }
    ElMessage.success('删除成功')
  }).catch(() => {})
}

// 批量删除
const handleBatchDelete = () => {
  if (selectedDevices.value.length === 0) {
    ElMessage.warning('请先选择设备')
    return
  }
  ElMessageBox.confirm(
    `确定要删除选中的 ${selectedDevices.value.length} 个设备吗？`,
    '警告',
    { confirmButtonText: '确定', cancelButtonText: '取消', type: 'danger' }
  ).then(() => {
    selectedDevices.value.forEach(item => {
      const index = deviceList.value.findIndex(d => d.deviceCode === item.deviceCode)
      if (index > -1) {
        deviceList.value.splice(index, 1)
      }
    })
    ElMessage.success('批量删除成功')
  }).catch(() => {})
}

// 导出
const handleExport = () => {
  ElMessage.success('设备数据导出成功')
}

// 提交表单
const submitForm = () => {
  deviceFormRef.value?.validate((valid) => {
    if (valid) {
      if (dialogTitle.value === '新增设备') {
        deviceList.value.unshift({
          ...deviceForm.value,
          status: 'offline',
          healthStatus: 'unknown',
          lastUpdateTime: '-',
          mapX: 100 + Math.random() * 400,
          mapY: 100 + Math.random() * 200
        })
        ElMessage.success('新增成功')
      } else {
        const index = deviceList.value.findIndex(item => item.deviceCode === deviceForm.value.deviceCode)
        if (index > -1) {
          deviceList.value[index] = { ...deviceList.value[index], ...deviceForm.value }
        }
        ElMessage.success('修改成功')
      }
      dialogVisible.value = false
    }
  })
}

// 初始化
onMounted(() => {
  getList()
  startMonitoring()
})

// 清理
onUnmounted(() => {
  stopMonitoring()
})
</script>

<style lang="scss" scoped>
.device-container {
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

.main-content-row {
  margin-bottom: 20px;
}

.overview-card,
.visual-card {
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

    .header-right {
      display: flex;
      align-items: center;
      gap: 12px;

      .monitor-status {
        display: flex;
        align-items: center;
        gap: 6px;
        font-size: 12px;
        color: #909399;

        &.active {
          color: #67c23a;

          .monitor-dot {
            background: #67c23a;
            animation: pulse 1.5s infinite;
          }
        }

        .monitor-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #909399;
        }
      }
    }
  }
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px;
  background: #fafafa;
  border-radius: 8px;

  .stat-icon {
    width: 48px;
    height: 48px;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #fff;
    flex-shrink: 0;
  }

  .stat-info {
    .stat-value {
      font-size: 22px;
      font-weight: 700;
      color: #303133;
      line-height: 1.2;
    }

    .stat-label {
      font-size: 12px;
      color: #909399;
      margin-top: 2px;
    }
  }
}

.type-chart-container {
  .chart-title {
    font-weight: 600;
    color: #606266;
    margin-bottom: 15px;
    text-align: center;
  }

  .donut-chart {
    position: relative;
    display: flex;
    justify-content: center;
    margin-bottom: 15px;

    .chart-center {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      text-align: center;

      .chart-center-value {
        font-size: 28px;
        font-weight: 700;
        color: #303133;
      }

      .chart-center-label {
        font-size: 12px;
        color: #909399;
      }
    }
  }

  .chart-legend {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    justify-content: center;

    .legend-item {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 12px;

      .legend-dot {
        width: 10px;
        height: 10px;
        border-radius: 50%;
      }

      .legend-label {
        color: #606266;
      }

      .legend-count {
        color: #909399;
        font-weight: 600;
      }
    }
  }
}

.visual-card {
  .floor-tabs {
    margin-bottom: 15px;

    :deep(.el-tabs__header) {
      margin: 0 0 15px 0;
    }
  }

  .map-container {
    .map-legend {
      display: flex;
      gap: 20px;
      margin-bottom: 15px;
      padding: 10px;
      background: #f5f7fa;
      border-radius: 4px;

      .legend-item {
        display: flex;
        align-items: center;
        gap: 6px;
        font-size: 13px;

        .legend-dot {
          width: 12px;
          height: 12px;
          border-radius: 50%;
        }
      }
    }

    .map-area {
      .map-grid {
        position: relative;
        width: 100%;
        height: 382px;
        background: #fafafa;
        border: 2px solid #e4e7ed;
        border-radius: 8px;
        background-image: 
          linear-gradient(rgba(0,0,0,0.05) 1px, transparent 1px),
          linear-gradient(90deg, rgba(0,0,0,0.05) 1px, transparent 1px);
        background-size: 50px 50px;

        .area-label {
          position: absolute;
          font-size: 14px;
          font-weight: 600;
          color: #909399;
          background: rgba(255,255,255,0.9);
          padding: 4px 12px;
          border-radius: 4px;
        }

        .map-device {
          position: absolute;
          display: flex;
          flex-direction: column;
          align-items: center;
          cursor: pointer;
          transition: all 0.3s;
          z-index: 10;

          &:hover {
            transform: scale(1.1);
            z-index: 20;
          }

          .device-marker {
            width: 40px;
            height: 40px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            border: 3px solid #fff;
            box-shadow: 0 2px 8px rgba(0,0,0,0.2);

            .marker-inner {
              width: 34px;
              height: 34px;
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              color: #fff;
              font-weight: bold;
              font-size: 14px;
            }
          }

          &.status-online .device-marker {
            .marker-inner {
              background: #67c23a;
            }
          }

          &.status-warning .device-marker {
            .marker-inner {
              background: #e6a23c;
            }
          }

          &.status-offline .device-marker,
          &.status-maintenance .device-marker {
            .marker-inner {
              background: #909399;
            }
          }

          &.status-maintenance .device-marker {
            .marker-inner {
              background: #f56c6c;
            }
          }

          .device-label {
            margin-top: 4px;
            font-size: 11px;
            color: #606266;
            background: rgba(255,255,255,0.95);
            padding: 2px 6px;
            border-radius: 4px;
            white-space: nowrap;
          }
        }
      }
    }
  }
}

.search-card {
  margin-bottom: 20px;
}

.table-operations {
  margin-bottom: 15px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.inspection-details {
  .inspection-detail-item {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 4px 0;
    font-size: 13px;

    &.success {
      color: #67c23a;
    }

    &.fail {
      color: #f56c6c;
    }
  }
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.7;
    transform: scale(1.1);
  }
}
</style>
