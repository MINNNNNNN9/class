import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import RegisterAccount from '../components/admin/RegisterAccount'
import CreateCourse from '../components/admin/CreateCourse'
import ViewAllCourses from '../components/admin/ViewAllCourses'
import ViewAllAccounts from '../components/admin/ViewAllaccounts'

export default function AdminHome() {
  const [activeTab, setActiveTab] = useState('viewCourses') // 預設為查看課程
  const navigate = useNavigate()
  
  const username = localStorage.getItem('username') || '管理員'
  const realName = localStorage.getItem('realName') || username

  const handleLogout = async () => {
    try {
      await axios.post('http://localhost:8000/api/logout/', {}, {
        withCredentials: true
      })
    } catch (error) {
      console.error('登出 API 失敗:', error)
    }
    
    localStorage.removeItem('username')
    localStorage.removeItem('token')
    localStorage.removeItem('realName')
    
    navigate('/')
  }

  const navItems = [
    { id: 'viewCourses', label: '查看所有課程', category: 'courses' },
    { id: 'createCourse', label: '新增課程', category: 'courses' },
    { id: 'register', label: '新增帳號', category: 'accounts' },
    { id: 'viewAccounts', label: '查看帳號', category: 'accounts' },
  ]

  const renderContent = () => {
    switch (activeTab) {
      case 'viewCourses':
        return <ViewAllCourses />
      case 'createCourse':
        return <CreateCourse />
      case 'register':
        return <RegisterAccount />
      case 'viewAccounts':
        return <ViewAllAccounts />
      default:
        return <ViewAllCourses />
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
              onClick={() => setActiveTab(item.id)}
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