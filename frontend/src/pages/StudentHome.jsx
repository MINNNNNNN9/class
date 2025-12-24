import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import MyCourses from '../components/student/MyCourses'
import SearchCourses from '../components/student/SearchCourses'
import CourseSelection from '../components/student/CourseSelection'
import AccountManagement from '../components/student/AccountManagement'
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

export default function StudentHome() {
  const [activeTab, setActiveTab] = useState('myCourses')
  const navigate = useNavigate()
  const { t } = useLanguage()
  const { toast } = useToast()

  const username = localStorage.getItem('username') || 'Student'
  const realName = localStorage.getItem('realName') || username

  const handleLogout = async () => {
    try {
      const csrfToken = localStorage.getItem('csrftoken') || getCookie('csrftoken')

      await axios.post(API_ENDPOINTS.logout, {}, {
        withCredentials: true,
        headers: csrfToken ? {
          'X-CSRFToken': csrfToken
        } : {}
      })
      toast.success(t('common.logout') + ' ' + t('common.success').toLowerCase())
    } catch (error) {
      console.error('登出 API 失敗:', error)
    }

    // 清除所有 localStorage
    localStorage.clear()

    navigate('/')
  }

  const navItems = [
    { id: 'myCourses', label: t('nav.myCourses') },
    { id: 'searchCourses', label: t('nav.searchCourses') },
    { id: 'courseSelection', label: t('nav.courseSelection') },
    { id: 'accountManagement', label: t('nav.accountManagement') }
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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      {/* Header with Logo */}
      <div className="bg-white dark:bg-gray-800 shadow-sm py-4 px-6 border-b dark:border-gray-700">
        <div className="flex items-center justify-between mb">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-green-600 rounded-full flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-xl">北</span>
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-800 dark:text-gray-100">國立臺北護理健康大學</h1>
              <p className="text-xs text-gray-600 dark:text-gray-400">National Taipei University of Nursing and Health Sciences</p>
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
      <nav className="bg-orange-300 dark:bg-orange-900 shadow-md mb-6 sticky top-0 z-10 transition-colors">
        <div className="flex overflow-x-auto no-scrollbar">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex-1 py-4 px-4 md:px-6 text-center font-bold text-base md:text-lg transition-colors whitespace-nowrap min-w-[100px] ${activeTab === item.id
                  ? 'bg-orange-400 dark:bg-orange-800 text-gray-900 dark:text-white'
                  : 'bg-orange-300 dark:bg-orange-900 text-gray-800 dark:text-gray-200 hover:bg-orange-200 dark:hover:bg-orange-800'
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