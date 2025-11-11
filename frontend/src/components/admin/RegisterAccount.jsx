import { useState } from 'react'
import axios from 'axios'

export default function RegisterAccount() {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    confirmPassword: '',
    real_name: '',
    role: 'student',
    // 學生專用欄位
    student_id: '',
    department: '',
    grade: '1',
    // 教師專用欄位
    office: '',
    title: ''
  })

  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  const departmentOptions = [
    { value: '資管系', label: '資訊管理系' },
    { value: '健管系', label: '健康管理系' }
  ]

  const gradeOptions = [
    { value: '1', label: '一年級' },
    { value: '2', label: '二年級' },
    { value: '3', label: '三年級' },
    { value: '4', label: '四年級' }
  ]

  const titleOptions = [
    { value: '教授', label: '教授' },
    { value: '副教授', label: '副教授' },
    { value: '助理教授', label: '助理教授' },
    { value: '講師', label: '講師' }
  ]

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleRoleChange = (e) => {
    const newRole = e.target.value
    setFormData(prev => ({
      ...prev,
      role: newRole,
      // 清空對方的專用欄位
      ...(newRole === 'student' ? { office: '', title: '' } : { student_id: '', department: '', grade: '1' })
    }))
  }

  const validateForm = () => {
    if (!formData.username.trim()) {
      alert('請輸入帳號')
      return false
    }
    if (!formData.password) {
      alert('請輸入密碼')
      return false
    }
    if (formData.password !== formData.confirmPassword) {
      alert('兩次密碼輸入不一致')
      return false
    }
    if (!formData.real_name.trim()) {
      alert('請輸入真實姓名')
      return false
    }

    // 學生必填檢查
    if (formData.role === 'student') {
      if (!formData.student_id.trim()) {
        alert('請輸入學號')
        return false
      }
      if (!formData.department) {
        alert('請選擇系所')
        return false
      }
    }

    // 教師必填檢查
    if (formData.role === 'teacher') {
      if (!formData.office.trim()) {
        alert('請輸入研究室')
        return false
      }
      if (!formData.title) {
        alert('請選擇職稱')
        return false
      }
    }

    return true
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) return

    setLoading(true)
    
    try {
      const submitData = {
        username: formData.username,
        password: formData.password,
        real_name: formData.real_name,
        role: formData.role
      }

      // 根據角色添加額外欄位
      if (formData.role === 'student') {
        submitData.student_id = formData.student_id
        submitData.department = formData.department
        submitData.grade = parseInt(formData.grade)
      } else if (formData.role === 'teacher') {
        submitData.office = formData.office
        submitData.title = formData.title
      }

      await axios.post('http://localhost:8000/api/register/', submitData)
      
      alert(`${formData.role === 'student' ? '學生' : '教師'}帳號建立成功！`)
      
      // 清空表單
      setFormData({
        username: '',
        password: '',
        confirmPassword: '',
        real_name: '',
        role: 'student',
        student_id: '',
        department: '',
        grade: '1',
        office: '',
        title: ''
      })
    } catch (err) {
      console.error('註冊錯誤:', err)
      if (err.response?.data?.error) {
        alert(`註冊失敗：${err.response.data.error}`)
      } else {
        alert('註冊失敗，請稍後再試')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleReset = () => {
    setFormData({
      username: '',
      password: '',
      confirmPassword: '',
      real_name: '',
      role: 'student',
      student_id: '',
      department: '',
      grade: '1',
      office: '',
      title: ''
    })
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-8">
      <div className="bg-white rounded-lg shadow-md p-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-6 border-b pb-3">新增帳號</h2>
        
        <form onSubmit={handleSubmit}>
          {/* 身份選擇 */}
          <div className="mb-6 bg-blue-50 p-4 rounded-lg">
            <label className="block text-sm font-bold text-gray-700 mb-2">
              身份類別 <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-6">
              <label className="flex items-center cursor-pointer">
                <input
                  type="radio"
                  name="role"
                  value="student"
                  checked={formData.role === 'student'}
                  onChange={handleRoleChange}
                  className="mr-2 w-4 h-4"
                />
                <span className="text-gray-700 font-medium">學生</span>
              </label>
              <label className="flex items-center cursor-pointer">
                <input
                  type="radio"
                  name="role"
                  value="teacher"
                  checked={formData.role === 'teacher'}
                  onChange={handleRoleChange}
                  className="mr-2 w-4 h-4"
                />
                <span className="text-gray-700 font-medium">教師</span>
              </label>
            </div>
          </div>

          {/* 基本資料 */}
          <div className="space-y-4 mb-6">
            <h3 className="text-lg font-bold text-gray-700 border-b pb-2">基本資料</h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                帳號 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="請輸入登入帳號"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                真實姓名 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="real_name"
                value={formData.real_name}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="請輸入真實姓名"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                密碼 <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="請輸入密碼"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showPassword ? '隱藏' : '顯示'}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                確認密碼 <span className="text-red-500">*</span>
              </label>
              <input
                type={showPassword ? 'text' : 'password'}
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="請再次輸入密碼"
              />
            </div>
          </div>

          {/* 學生專用欄位 */}
          {formData.role === 'student' && (
            <div className="space-y-4 mb-6 bg-green-50 p-4 rounded-lg">
              <h3 className="text-lg font-bold text-gray-700 border-b pb-2">學生資料</h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  學號 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="student_id"
                  value={formData.student_id}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="例如：11012345"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  系所 <span className="text-red-500">*</span>
                </label>
                <select
                  name="department"
                  value={formData.department}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="">請選擇系所</option>
                  {departmentOptions.map(dept => (
                    <option key={dept.value} value={dept.value}>
                      {dept.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  年級 <span className="text-red-500">*</span>
                </label>
                <select
                  name="grade"
                  value={formData.grade}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  {gradeOptions.map(grade => (
                    <option key={grade.value} value={grade.value}>
                      {grade.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* 教師專用欄位 */}
          {formData.role === 'teacher' && (
            <div className="space-y-4 mb-6 bg-purple-50 p-4 rounded-lg">
              <h3 className="text-lg font-bold text-gray-700 border-b pb-2">教師資料</h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  研究室 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="office"
                  value={formData.office}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="例如：A101"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  職稱 <span className="text-red-500">*</span>
                </label>
                <select
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="">請選擇職稱</option>
                  {titleOptions.map(title => (
                    <option key={title.value} value={title.value}>
                      {title.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* 按鈕區 */}
          <div className="flex gap-4 pt-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 px-6 rounded-lg font-bold text-lg transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {loading ? '建立中...' : '建立帳號'}
            </button>
            <button
              type="button"
              onClick={handleReset}
              className="flex-1 bg-gray-500 hover:bg-gray-600 text-white py-3 px-6 rounded-lg font-bold text-lg transition-colors"
            >
              清空表單
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}