import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import TeacherAccountManagement from '../components/teacher/TeacherAccountManagement'
import TeacherCourseList from '../components/teacher/TeacherCourseList'
import { API_ENDPOINTS } from '../config/api'
import { useLanguage } from '../contexts/LanguageContext'
import { useToast } from '../contexts/ToastContext'
import LanguageSwitch from '../components/LanguageSwitch'
import ThemeSwitch from '../components/ThemeSwitch'

// 從 cookie 取得 CSRF token
function getCookie(name) {
  const value = `; ${document.cookie}`
  const parts = value.split(`; ${name}=`)
  if (parts.length === 2) return parts.pop().split(';').shift()
}

export default function TeacherHome() {
  const [activeTab, setActiveTab] = useState('accountManagement') // Default to Account Management since My Courses is empty
  const navigate = useNavigate()
  const { t } = useLanguage()
  const { toast } = useToast()

  const username = localStorage.getItem('username') || 'Teacher'
  const realName = localStorage.getItem('realName') || username

  const handleLogout = async () => {
    try {
      const csrfToken = getCookie('csrftoken')

      await axios.post(API_ENDPOINTS.logout, {}, {
        withCredentials: true,
        headers: csrfToken ? {
          'X-CSRFToken': csrfToken
        } : {}
      })
      toast.success(t('common.logout') + ' ' + t('common.success'))
    } catch (error) {
      console.error('登出 API 失敗:', error)
    }

    localStorage.removeItem('username')
    localStorage.removeItem('token')
    localStorage.removeItem('realName')

    navigate('/')
  }

  const navItems = [
    { id: 'myCourses', label: '我的授課' }, // Need i18n key later
    { id: 'accountManagement', label: t('nav.accountManagement') }
  ]

  const renderContent = () => {
    switch (activeTab) {
      case 'myCourses':
        return (
          <div className="max-w-7xl mx-auto p-4 md:p-8 m-4 md:m-8">
            <h2 className="text-2xl font-bold text-gray-700 dark:text-gray-200 mb-6 flex items-center">
              <span className="bg-blue-600 w-2 h-8 mr-3 rounded-full"></span>
              我的授課課程
            </h2>
            <TeacherCourseList />
          </div>
        )
      case 'accountManagement':
        return <TeacherAccountManagement />
      default:
        return <TeacherAccountManagement />
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      {/* Header with Logo */}
      <div className="bg-white dark:bg-gray-800 shadow-sm py-4 px-6 border-b dark:border-gray-700">
        <div className="flex items-center justify-between mb">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-xl">教</span>
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-800 dark:text-gray-100">國立臺北護理健康大學</h1>
              <p className="text-xs text-gray-600 dark:text-gray-400">教師入口網 Information System for Teachers</p>
            </div>
          </div>

          {/* Welcome message and controls */}
          <div className="flex items-center gap-4">
            <ThemeSwitch />
            <LanguageSwitch />
            <span className="text-gray-700 dark:text-gray-300 font-medium hidden md:inline">
              {t('nav.welcome')}，<span className="text-blue-600 dark:text-blue-400 font-bold">{realName}</span>
            </span>
            <button
              onClick={handleLogout}
              className="bg-red-500 hover:bg-red-600 text-white px-4 md:px-6 py-2 rounded-lg font-medium transition-colors shadow-md hover:shadow-lg text-sm md:text-base"
            >
              {t('common.logout')}
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Bar - Scrollable on mobile */}
      <nav className="bg-blue-300 dark:bg-blue-900 shadow-md mb-6 sticky top-0 z-10 transition-colors">
        <div className="flex overflow-x-auto no-scrollbar">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex-1 py-4 px-4 md:px-6 text-center font-bold text-base md:text-lg transition-colors whitespace-nowrap min-w-[100px] ${activeTab === item.id
                ? 'bg-blue-400 dark:bg-blue-800 text-gray-900 dark:text-white'
                : 'bg-blue-300 dark:bg-blue-900 text-gray-800 dark:text-gray-200 hover:bg-blue-200 dark:hover:bg-blue-800'
                }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="dark:text-gray-200">
        {renderContent()}
      </main>
    </div>
  )
}
