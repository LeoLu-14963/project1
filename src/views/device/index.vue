<template>
  <div class="device-container">
    <!-- 页面标题 -->
    <div class="page-header">
      <h2>设备管理</h2>
      <p class="text-secondary">管理所有设备信息、状态监控与维护</p>
    </div>

    <!-- 搜索筛选区域 -->
    <el-card class="search-card" shadow="never">
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
            <el-option label="AGV小车" value="agv" />
            <el-option label="堆垛机" value="stacker" />
            <el-option label="输送线" value="conveyor" />
            <el-option label="机械臂" value="robot" />
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
            <el-tag :type="getDeviceTypeType(row.deviceType)">
              {{ getDeviceTypeText(row.deviceType) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="IP地址" prop="ipAddress" width="140" />
        <el-table-column label="状态" prop="status" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)" effect="dark">
              {{ getStatusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="最后在线" prop="lastOnlineTime" width="160" />
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
            <el-option label="AGV小车" value="agv" />
            <el-option label="堆垛机" value="stacker" />
            <el-option label="输送线" value="conveyor" />
            <el-option label="机械臂" value="robot" />
          </el-select>
        </el-form-item>
        <el-form-item label="IP地址" prop="ipAddress">
          <el-input v-model="deviceForm.ipAddress" placeholder="请输入IP地址" />
        </el-form-item>
        <el-form-item label="所在区域" prop="area">
          <el-input v-model="deviceForm.area" placeholder="请输入所在区域" />
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
          <el-tag :type="getDeviceTypeType(currentDevice.deviceType)">
            {{ getDeviceTypeText(currentDevice.deviceType) }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="IP地址">{{ currentDevice.ipAddress }}</el-descriptions-item>
        <el-descriptions-item label="当前状态">
          <el-tag :type="getStatusType(currentDevice.status)" effect="dark">
            {{ getStatusText(currentDevice.status) }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="最后在线">{{ currentDevice.lastOnlineTime }}</el-descriptions-item>
      </el-descriptions>
      <template #footer>
        <el-button @click="detailVisible = false">关 闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Search, Refresh, Plus, Download, Delete,
  View, Edit, MoreFilled, CircleCheck, CircleClose
} from '@element-plus/icons-vue'

// 加载状态
const loading = ref(false)

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

// 表单相关
const deviceFormRef = ref(null)
const queryForm = ref(null)
const deviceForm = ref({
  deviceCode: '',
  deviceName: '',
  deviceType: '',
  ipAddress: '',
  area: '',
  remark: ''
})

const deviceRules = {
  deviceCode: [{ required: true, message: '请输入设备编号', trigger: 'blur' }],
  deviceName: [{ required: true, message: '请输入设备名称', trigger: 'blur' }],
  deviceType: [{ required: true, message: '请选择设备类型', trigger: 'change' }]
}

// 设备列表
const deviceList = ref([
  {
    deviceCode: 'AGV-001',
    deviceName: 'AGV小车-01',
    deviceType: 'agv',
    ipAddress: '192.168.1.101',
    status: 'online',
    lastOnlineTime: '2026-03-26 21:50:00',
    area: 'A区'
  },
  {
    deviceCode: 'AGV-002',
    deviceName: 'AGV小车-02',
    deviceType: 'agv',
    ipAddress: '192.168.1.102',
    status: 'online',
    lastOnlineTime: '2026-03-26 21:48:00',
    area: 'A区'
  },
  {
    deviceCode: 'STK-001',
    deviceName: '堆垛机-01',
    deviceType: 'stacker',
    ipAddress: '192.168.1.201',
    status: 'warning',
    lastOnlineTime: '2026-03-26 21:30:00',
    area: 'B区'
  },
  {
    deviceCode: 'CON-001',
    deviceName: '输送线-01',
    deviceType: 'conveyor',
    ipAddress: '192.168.1.301',
    status: 'offline',
    lastOnlineTime: '2026-03-26 18:00:00',
    area: 'C区'
  },
  {
    deviceCode: 'ROB-001',
    deviceName: '机械臂-01',
    deviceType: 'robot',
    ipAddress: '192.168.1.401',
    status: 'maintenance',
    lastOnlineTime: '2026-03-26 12:00:00',
    area: 'D区'
  }
])

// 获取设备类型样式
const getDeviceTypeType = (type) => {
  const map = {
    agv: 'primary',
    stacker: 'success',
    conveyor: 'warning',
    robot: 'danger'
  }
  return map[type] || 'info'
}

const getDeviceTypeText = (type) => {
  const map = {
    agv: 'AGV小车',
    stacker: '堆垛机',
    conveyor: '输送线',
    robot: '机械臂'
  }
  return map[type] || type
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
    ipAddress: '',
    area: '',
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

// 更多操作
const handleCommand = (command, row) => {
  switch (command) {
    case 'enable':
      row.status = 'online'
      ElMessage.success(`设备 ${row.deviceCode} 已启用`)
      break
    case 'disable':
      row.status = 'offline'
      ElMessage.success(`设备 ${row.deviceCode} 已禁用`)
      break
    case 'delete':
      handleDelete(row)
      break
  }
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
          lastOnlineTime: '-'
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
getList()
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

.search-card {
  margin-bottom: 20px;
}

.table-operations {
  margin-bottom: 15px;
}

.task-item {
  display: flex;
  justify-content: space-between;
  align-items: center;

  .task-name {
    font-weight: 500;
  }
}

.device-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.device-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  background: #f5f7fa;
  border-radius: 6px;

  .device-info {
    display: flex;
    align-items: center;
    gap: 10px;

    .device-name {
      font-weight: 500;
    }
  }
}

.status-online { color: #67C23A; }
.status-offline { color: #909399; }
.status-warning { color: #E6A23C; }
</style>
