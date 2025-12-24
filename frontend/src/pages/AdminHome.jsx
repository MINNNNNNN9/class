import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import RegisterAccount from '../components/admin/RegisterAccount'
import CreateCourse from '../components/admin/CreateCourse'
import ViewAllCourses from '../components/admin/ViewAllCourses'
import ViewAllAccounts from '../components/admin/ViewAllaccounts'
import { API_ENDPOINTS } from '../config/api'

export default function AdminHome() {
  const [activeTab, setActiveTab] = useState('viewCourses') // 預設為查看課程
  const [editingCourseId, setEditingCourseId] = useState(null) // 正在編輯的課程 ID
  const navigate = useNavigate()
  
  const username = localStorage.getItem('username') || '管理員'
  const realName = localStorage.getItem('realName') || username

  const handleLogout = async () => {
    try {
      // 從 localStorage 或 cookie 取得 CSRF token
      const getCookie = (name) => {
        const value = `; ${document.cookie}`
        const parts = value.split(`; ${name}=`)
        if (parts.length === 2) return parts.pop().split(';').shift()
      }
      
      const csrfToken = localStorage.getItem('csrftoken') || getCookie('csrftoken')
      
      await axios.post(API_ENDPOINTS.logout, {}, {
        withCredentials: true,
        headers: csrfToken ? {
          'X-CSRFToken': csrfToken
        } : {}
      })
    } catch (error) {
      console.error('登出 API 失敗:', error)
      // 即使 API 失敗也繼續登出流程
    }
    
    // 清除所有 localStorage
    localStorage.clear()
    
    navigate('/')
  }

  const navItems = [
    { id: 'viewCourses', label: '查看所有課程', category: 'courses' },
    { id: 'createCourse', label: '新增課程', category: 'courses' },
    { id: 'register', label: '新增帳號', category: 'accounts' },
    { id: 'viewAccounts', label: '查看帳號', category: 'accounts' },
  ]

  // 處理編輯課程
  const handleEditCourse = (courseId) => {
    console.log('開始編輯課程 ID:', courseId)
    setEditingCourseId(courseId)
    setActiveTab('createCourse')
  }

  // 處理保存完成後
  const handleSaveComplete = () => {
    console.log('課程保存完成，返回課程列表')
    setEditingCourseId(null)
    setActiveTab('viewCourses')
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'viewCourses':
        return <ViewAllCourses onEdit={handleEditCourse} />
      case 'createCourse':
        return <CreateCourse editingCourseId={editingCourseId} onSaveComplete={handleSaveComplete} />
      case 'register':
        return <RegisterAccount />
      case 'viewAccounts':
        return <ViewAllAccounts />
      default:
        return <ViewAllCourses onEdit={handleEditCourse} />
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with Logo */}
      <div className="bg-white shadow-sm py-4 px-6">
        <div className="flex items-center justify-between mb">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-green-600 rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-xl">北</span>
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-800">國立臺北護理健康大學</h1>
              <p className="text-xs text-gray-600">National Taipei University of Nursing and Health Sciences</p>
            </div>
          </div>
          
          {/* Welcome message and Logout button */}
          <div className="flex items-center gap-4">
            <span className="text-gray-700 font-medium">
              歡迎，<span className="text-red-600 font-bold">{realName}</span>
              <span className="ml-2 text-xs bg-red-100 text-red-700 px-2 py-1 rounded">管理員</span>
            </span>
            <button
              onClick={handleLogout}
              className="bg-red-500 hover:bg-red-600 text-white px-6 py-2 rounded-lg font-medium transition-colors shadow-md hover:shadow-lg"
            >
              登出
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Bar */}
      <nav className="bg-blue-300 shadow-md mb-6">
        <div className="flex">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setActiveTab(item.id)
                // 切換分頁時，如果不是去新增課程頁面，則清除編輯狀態
                if (item.id !== 'createCourse') {
                  setEditingCourseId(null)
                }
              }}
              className={`flex-1 py-4 px-6 text-center font-bold text-lg transition-colors ${
                activeTab === item.id
                  ? 'bg-blue-400 text-gray-900'
                  : 'bg-blue-300 text-gray-800 hover:bg-blue-350'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </nav>

      {/* Main Content Area */}
      <main>
        {renderContent()}
      </main>
    </div>
  )
}