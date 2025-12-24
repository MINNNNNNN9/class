import { useState, useEffect } from 'react'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'
import schoolLogo from '../images/maxresdefault.jpg'
import { API_ENDPOINTS } from '../config/api'
import { useLanguage } from '../contexts/LanguageContext'
import { useToast } from '../contexts/ToastContext'
import LanguageSwitch from '../components/LanguageSwitch'
import ThemeSwitch from '../components/ThemeSwitch'
import ChangePasswordModal from '../components/ChangePasswordModal'

function getCookie(name) {
  let cookieValue = null;
  if (document.cookie && document.cookie !== '') {
    const cookies = document.cookie.split(';');
    for (let i = 0; i < cookies.length; i++) {
      const cookie = cookies[i].trim();
      if (cookie.substring(0, name.length + 1) === (name + '=')) {
        cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
        break;
      }
    }
  }
  return cookieValue;
}

export default function LoginPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [roles, setRoles] = useState([])
  const [showForceModal, setShowForceModal] = useState(false)
  const [pendingNavigatePath, setPendingNavigatePath] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const navigate = useNavigate()
  const { t } = useLanguage()
  const { toast } = useToast()

  useEffect(() => {
    fetchCSRFToken()
  }, [])

  const fetchCSRFToken = async () => {
    try {
      await axios.get(API_ENDPOINTS.filterOptions, {
        withCredentials: true
      })
    } catch (error) {
      console.error('獲取 CSRF token 失敗:', error)
    }
  }

  const handleLogin = async () => {
    if (!username || !password) {
      toast.warning(t('login.emptyFields'))
      return
    }

    setIsLoading(true)
    try {
      const csrfToken = getCookie('csrftoken')

      const res = await axios.post(API_ENDPOINTS.login, {
        username, password
      }, {
        withCredentials: true,
        headers: csrfToken ? {
          'X-CSRFToken': csrfToken
        } : {}
      })

      localStorage.setItem('username', username)
      if (res.data.real_name) {
        localStorage.setItem('realName', res.data.real_name)
      }

      toast.success(t('common.success'))



      const shouldForce = res.data.force_password_change
      if (shouldForce) {
        setShowForceModal(true)
      }

      if (res.data.role) {
        const path = `/${res.data.role}home`
        if (!shouldForce) navigate(path)
        else setPendingNavigatePath(path)
      } else if (res.data.roles && res.data.roles.length > 0) {
        // 如果只有一個角色但後端沒傳 role 欄位，直接跳轉
        if (res.data.roles.length === 1) {
          const path = `/${res.data.roles[0]}home`
          if (!shouldForce) navigate(path)
          else setPendingNavigatePath(path)
        } else {
          setRoles(res.data.roles)
        }
      } else {
        toast.error('無法識別用戶身份，請聯繫管理員')
        console.error('Login response missing role info:', res.data)
      }
    } catch (err) {
      console.error('登入錯誤:', err)
      toast.error(t('login.loginError') + ': ' + (err.response?.data?.error || err.message))
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleLogin()
    }
  }

  const chooseRole = (r) => {
    navigate(`/${r}home`)
  }

  const getRoleDisplayName = (role) => {
    return t(`roles.${role}`) || role
  }

  const getRoleIcon = (role) => {
    const iconMap = {
      'teacher': '👨‍🏫',
      'student': '🎓',
      'admin': '⚙️'
    }
    return iconMap[role] || '👤'
  }

  const announcementItems = t('login.announcementItems')
  const instructionItems = t('login.instructionItems')

  const handleModalClose = () => {
    setShowForceModal(false)
    if (pendingNavigatePath) {
      navigate(pendingNavigatePath)
    }
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 flex flex-col transition-colors">
      <ChangePasswordModal
        isOpen={showForceModal}
        onClose={handleModalClose}
        isMandatory={true}
      />
      {/* 語言和主題切換按鈕 */}
      <div className="absolute top-4 right-4 z-20 flex gap-2">
        <ThemeSwitch />
        <LanguageSwitch />
      </div>

      {/* 頂部大橫幅 */}
      <div className="w-full bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 shadow-lg relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-96 h-96 bg-white rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2"></div>
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-white rounded-full blur-3xl transform -translate-x-1/2 translate-y-1/2"></div>
        </div>

        <div className="container mx-auto px-6 py-12 relative z-10">
          <div className="flex flex-col items-center">
            <div className="mb-4">
              <img
                src={schoolLogo}
                alt="臺北護理健康大學"
                className="h-32 w-auto object-contain drop-shadow-2xl"
              />
            </div>
            <h1 className="text-4xl font-bold text-white mb-2 drop-shadow-lg text-center">
              {t('login.title')}
            </h1>
            <p className="text-white/90 text-lg text-center">
              {t('login.subtitle')}
            </p>
          </div>
        </div>
      </div>

      {/* 主要內容區 */}
      <div className="flex-1 container mx-auto px-6 py-12">
        <div className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-2 gap-8">

            {/* 左側 - 登入表單 */}
            <div className="bg-white dark:bg-gray-800 rounded-lg border-2 border-gray-200 dark:border-gray-700 p-8 shadow-md">
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-1">{t('common.login')}</h2>
                <div className="w-12 h-1 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full"></div>
              </div>

              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t('login.username')} <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <input
                      type="text"
                      className="w-full pl-10 pr-4 py-2.5 border-2 border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 dark:focus:ring-emerald-800 transition-all placeholder-gray-400 dark:placeholder-gray-500"
                      placeholder={t('login.usernamePlaceholder')}
                      value={username}
                      onChange={e => setUsername(e.target.value)}
                      onKeyPress={handleKeyPress}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t('login.password')} <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    </div>
                    <input
                      type="password"
                      className="w-full pl-10 pr-4 py-2.5 border-2 border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 dark:focus:ring-emerald-800 transition-all placeholder-gray-400 dark:placeholder-gray-500"
                      placeholder={t('login.passwordPlaceholder')}
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      onKeyPress={handleKeyPress}
                    />
                  </div>
                </div>

                <button
                  className={`w-full bg-gradient-to-r from-emerald-600 to-teal-600 text-white py-3 rounded-md font-medium hover:from-emerald-700 hover:to-teal-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 transition-all duration-200 flex items-center justify-center gap-2 shadow-md hover:shadow-lg ${isLoading ? 'opacity-70 cursor-not-allowed' : ''
                    }`}
                  onClick={handleLogin}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      {t('login.loggingIn')}
                    </>
                  ) : (
                    <>
                      {t('login.loginButton')}
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                    </>
                  )}
                </button>

                {roles.length > 1 && (
                  <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">{t('login.selectRole')}：</p>
                    <div className="flex flex-wrap gap-2">
                      {roles.map(r => (
                        <button
                          key={r}
                          className="flex items-center gap-2 px-4 py-2 bg-gray-50 dark:bg-gray-700 border-2 border-gray-300 dark:border-gray-600 rounded-md hover:border-emerald-500 dark:hover:border-emerald-500 hover:bg-emerald-50 dark:hover:bg-gray-600 transition-all text-gray-700 dark:text-gray-200"
                          onClick={() => chooseRole(r)}
                        >
                          <span className="text-lg">{getRoleIcon(r)}</span>
                          <span className="font-medium text-inherit">{getRoleDisplayName(r)}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* 右側 - 系統資訊 */}
            <div className="space-y-6">
              {/* 公告區 */}
              <div className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-gray-800 dark:to-gray-800 rounded-lg border border-emerald-200 dark:border-gray-700 p-6">
                <div className="flex items-start gap-3 mb-4">
                  <div className="flex-shrink-0 w-10 h-10 bg-emerald-500 rounded-full flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-2">{t('login.announcement')}</h3>
                    <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                      {Array.isArray(announcementItems) && announcementItems.map((item, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <span className="text-emerald-500 mt-1">•</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              {/* 使用說明 */}
              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-4 flex items-center gap-2">
                  <svg className="w-5 h-5 text-teal-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                  {t('login.instructions')}
                </h3>
                <div className="space-y-3 text-sm text-gray-600 dark:text-gray-300">
                  {Array.isArray(instructionItems) && instructionItems.map((item, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-6 h-6 bg-teal-100 dark:bg-teal-900 rounded-full flex items-center justify-center text-teal-600 dark:text-teal-300 font-bold text-xs">{index + 1}</div>
                      <p>{item}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 頁尾 */}
      <footer className="bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 py-6 mt-auto">
        <div className="container mx-auto px-6 text-center">
          <p className="text-gray-600 dark:text-gray-400 text-sm">
            {t('login.footer')}
          </p>
          <p className="text-gray-500 dark:text-gray-500 text-xs mt-1">
            {t('login.browserHint')}
          </p>
        </div>
      </footer>
    </div>
  )
}