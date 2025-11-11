import { useState } from 'react'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'

export default function LoginPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [roles, setRoles] = useState([])
  const navigate = useNavigate()

  const handleLogin = async () => {
    try {
      const res = await axios.post('http://localhost:8000/api/login/', {
        username, password
      }, {
        withCredentials: true  // ← 重要：接收並儲存 session cookie
      })
      console.log('後端返回的完整數據：', res.data)
      console.log('角色列表：', res.data.roles)
      
      // 儲存使用者資訊到 localStorage
      localStorage.setItem('username', username)
      if (res.data.real_name) {
        localStorage.setItem('realName', res.data.real_name)  // ← 儲存真實姓名
      }
      
      if (res.data.role) {
        navigate(`/${res.data.role}home`)
      } else if (res.data.roles) {
        setRoles(res.data.roles)
      }
    } catch (err) {
      alert('登入失敗')
    }
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
    <div className="fixed inset-0 flex items-center justify-center bg-white p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
        <h2 className="text-3xl font-bold text-center text-gray-800 mb-8">登入</h2>
        
        <div className="space-y-4">
          <input 
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all"
            placeholder="帳號" 
            value={username}
            onChange={e => setUsername(e.target.value)} 
          />
          
          <input 
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all"
            placeholder="密碼" 
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)} 
          />
          
          <button 
            className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-3 rounded-lg font-semibold hover:from-purple-700 hover:to-indigo-700 active:scale-95 transition-all shadow-lg hover:shadow-xl"
            onClick={handleLogin}
          >
            登入
          </button>
        </div>

        {roles.length > 1 && (
          <div className="mt-8 pt-6 border-t-2 border-gray-200">
            <h3 className="text-xl font-semibold text-center text-gray-700 mb-4">選擇身份</h3>
            <div className="flex flex-wrap gap-3 justify-center">
              {roles.map(r => (
                <button 
                  key={r}
                  className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium border-2 border-gray-200 hover:bg-purple-500 hover:text-white hover:border-purple-500 active:scale-95 transition-all"
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