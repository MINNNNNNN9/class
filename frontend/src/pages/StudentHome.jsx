import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios' // ⬅️ 加上這行
import MyCourses from '../components/student/MyCourses'
import SearchCourses from '../components/student/SearchCourses'
import CourseSelection from '../components/student/CourseSelection'
import AccountManagement from '../components/student/AccountManagement'

export default function StudentHome() {
  const [activeTab, setActiveTab] = useState('myCourses')
  const navigate = useNavigate()
  
  // 這裡可以從 localStorage 或 context 獲取使用者資訊
  // 之後需要從後端 API 取得真實姓名
  const username = localStorage.getItem('username') || '學生'
  const realName = localStorage.getItem('realName') || username  // 真實姓名

  const handleLogout = async () => {
    try {
      // 先呼叫後端登出 API
      await axios.post('http://localhost:8000/api/logout/', {}, {
        withCredentials: true
      })
    } catch (error) {
      console.error('登出 API 失敗:', error)
    }
    
    // 清除 localStorage
    localStorage.removeItem('username')
    localStorage.removeItem('token')
    localStorage.removeItem('realName')
    
    // 跳轉回登入頁面
    navigate('/')
  }

  const navItems = [
    { id: 'myCourses', label: '我的課表' },
    { id: 'searchCourses', label: '查詢課程' },
    { id: 'courseSelection', label: '預選課系統' },
    { id: 'accountManagement', label: '個人帳號管理' }
  ]

  const renderContent = () => {
    switch (activeTab) {
      case 'myCourses':
        return <MyCourses />
      case 'searchCourses':
        return <SearchCourses />
      case 'courseSelection':
        return <CourseSelection />
      case 'accountManagement':
        return <AccountManagement />
      default:
        return <MyCourses />
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
              歡迎，<span className="text-blue-600 font-bold">{realName}</span>
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
      <nav className="bg-orange-300 shadow-md mb-6">
        <div className="flex">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex-1 py-4 px-6 text-center font-bold text-lg transition-colors ${
                activeTab === item.id
                  ? 'bg-orange-400 text-gray-900'
                  : 'bg-orange-300 text-gray-800 hover:bg-orange-350'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </nav>

      {/* Main Content Area - 移除 padding 讓內容貼合 */}
      <main>
        {renderContent()}
      </main>
    </div>
  )
}