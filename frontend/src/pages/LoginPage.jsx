import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
// 關鍵：導入封裝好的 apiClient 與端點定義
import { API_ENDPOINTS, apiClient, setStoredCsrfToken } from '../config/api'
import schoolLogo from '../images/maxresdefault.jpg'

export default function LoginPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [roles, setRoles] = useState([])
  const navigate = useNavigate()

  // 組件載入時，先發送一個簡單請求獲取 CSRF Cookie (如果後端有設定)
  useEffect(() => {
    const fetchCSRFToken = async () => {
      try {
        // 使用 apiClient 發送，會自動帶上 Credentials
        await apiClient.get(API_ENDPOINTS.filterOptions)
        console.log('CSRF Cookie 已初始化')
      } catch (error) {
        console.error('初始化 CSRF 失敗:', error)
      }
    }
    fetchCSRFToken()
  }, [])

  const handleLogin = async () => {
    try {
      const res = await apiClient.post(API_ENDPOINTS.login, {
        username,
        password
      })
      
      // ✅ 關鍵：將回傳的 Token 存入 localStorage
      if (res.data.csrfToken) {
        setStoredCsrfToken(res.data.csrfToken)
        console.log('✅ CSRF Token 已更新並儲存')
      }

      const { role, roles: userRoles, real_name } = res.data
      localStorage.setItem('username', username)
      if (real_name) localStorage.setItem('realName', real_name)
      
      // 導向邏輯 ...
      if (role) navigate(`/${role}home`)
      else if (userRoles) setRoles(userRoles)
      
    } catch (err) {
      const message = err.response?.data?.error || '登入失敗'
      alert(message)
    }
  }
  
  const handleKeyPress = (e) => {
    if (e.key === 'Enter') handleLogin()
  }

  const chooseRole = (r) => {
    navigate(`/${r}home`)
  }

  const getRoleDisplayName = (role) => {
    const roleMap = {
      'teacher': '教師',
      'student': '學生',
      'admin': '管理員'
    }
    return roleMap[role] || role
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-white p-4">
      <div className="rounded-3xl shadow-2xl p-10 w-full max-w-md">
        {/* 學校 Logo */}
        <div className="flex justify-center">
          <img 
            src={schoolLogo} 
            alt="學校logo" 
            className="w-64 h-auto object-contain"
          />
        </div>
        
        {/* 登入表單 */}
        <div className="space-y-4">
          <input 
            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all text-gray-800"
            placeholder="帳號" 
            value={username}
            onChange={e => setUsername(e.target.value)}
            onKeyPress={handleKeyPress}
          />
          
          <input 
            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all text-gray-800"
            placeholder="密碼" 
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            onKeyPress={handleKeyPress}
          />
          
          <button 
            className="w-full bg-gradient-to-r from-green-500 to-teal-500 text-white py-3 rounded-lg font-semibold hover:from-green-600 hover:to-teal-600 active:scale-95 transition-all shadow-md hover:shadow-lg"
            onClick={handleLogin}
          >
            登入
          </button>
        </div>

        {/* 角色選擇 */}
        {roles.length > 1 && (
          <div className="mt-8 pt-6 border-t border-gray-200">
            <h3 className="text-lg font-semibold text-center text-gray-700 mb-4">選擇身份</h3>
            <div className="flex flex-wrap gap-3 justify-center">
              {roles.map(r => (
                <button 
                  key={r}
                  className="px-6 py-2 bg-gray-50 text-gray-700 rounded-lg font-medium border border-gray-200 hover:bg-green-500 hover:text-white hover:border-green-500 active:scale-95 transition-all"
                  onClick={() => chooseRole(r)}
                >
                  {getRoleDisplayName(r)}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}