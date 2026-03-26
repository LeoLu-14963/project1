// 安旭特智能物流系统 - 业务模块路由
import Layout from '@/layout'

export const axtRoutes = [
  {
    path: '/dashboard',
    component: Layout,
    redirect: '/dashboard/index',
    children: [
      {
        path: 'index',
        component: () => import('@/views/dashboard/index'),
        name: 'Dashboard',
        meta: { title: '系统概览', icon: 'dashboard' }
      }
    ]
  },
  {
    path: '/device',
    component: Layout,
    redirect: '/device/index',
    children: [
      {
        path: 'index',
        component: () => import('@/views/device/index'),
        name: 'Device',
        meta: { title: '设备管理', icon: 'monitor' }
      }
    ]
  },
  {
    path: '/route',
    component: Layout,
    redirect: '/route/index',
    children: [
      {
        path: 'index',
        component: () => import('@/views/route/index'),
        name: 'Route',
        meta: { title: '路线配置', icon: 'guide' }
      }
    ]
  },
  {
    path: '/workorder',
    component: Layout,
    redirect: '/workorder/index',
    children: [
      {
        path: 'index',
        component: () => import('@/views/workorder/index'),
        name: 'Workorder',
        meta: { title: '工单监控', icon: 'clipboard' }
      }
    ]
  },
  {
    path: '/task',
    component: Layout,
    redirect: '/task/index',
    children: [
      {
        path: 'index',
        component: () => import('@/views/task/index'),
        name: 'Task',
        meta: { title: '任务监控', icon: 'list' }
      }
    ]
  }
]
