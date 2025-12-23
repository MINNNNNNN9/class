import { useState, useEffect } from 'react'
import axios from 'axios'
import { API_ENDPOINTS, apiClient } from '../../config/api'
import { getCsrfToken } from '../../utils/csrf'  // ← 新增這行


// 獲取 CSRF token 的函數
// function getCookie(name) {
//   let cookieValue = null;
//   if (document.cookie && document.cookie !== '') {
//     const cookies = document.cookie.split(';');
//     for (let i = 0; i < cookies.length; i++) {
//       const cookie = cookies[i].trim();
//       if (cookie.substring(0, name.length + 1) === (name + '=')) {
//         cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
//         break;
//       }
//     }
//   }
//   return cookieValue;
// }

export default function ViewAllAccounts() {
  const [accountType, setAccountType] = useState('student') // 'student' or 'teacher'
  const [accounts, setAccounts] = useState([])
  const [loading, setLoading] = useState(false)
  const [editingAccount, setEditingAccount] = useState(null)
  const [editFormData, setEditFormData] = useState({})

  useEffect(() => {
    fetchAccounts()
  }, [accountType])

  const fetchAccounts = async () => {
    setLoading(true)
    try {
      const endpoint = accountType === 'student' ? API_ENDPOINTS.students : API_ENDPOINTS.teachers
      // apiClient 會自動處理 Cookie (withCredentials)
      const response = await apiClient.get(endpoint)
      setAccounts(response.data)
    } catch (error) {
      alert('載入帳號失敗')
    } finally { setLoading(false) }
  }

  const handleDelete = async (accountId, name) => {
    if (!confirm(`確定要刪除嗎？`)) return
    try {
      const url = accountType === 'student' 
        ? API_ENDPOINTS.studentDelete(accountId) 
        : API_ENDPOINTS.teacherDelete(accountId)
      
      // ✅ 攔截器會自動補上 X-CSRFToken Header
      await apiClient.delete(url)
      alert('刪除成功！')
      fetchAccounts()
    } catch (error) {
      alert(error.response?.data?.error || '刪除失敗')
    }
  }

  const handleEditClick = (account) => {
    setEditingAccount(account.id)
    if (accountType === 'student') {
      setEditFormData({
        real_name: account.real_name,
        student_id: account.student_id,
        department: account.department,
        grade: account.grade
      })
    } else {
      setEditFormData({
        real_name: account.real_name,
        office: account.office,
        title: account.title
      })
    }
  }

  const handleEditCancel = () => {
    setEditingAccount(null)
    setEditFormData({})
  }

  const handleEditChange = (e) => {
    const { name, value } = e.target
    setEditFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleEditSave = async (accountId) => {
    try {
      const url = accountType === 'student'
        ? API_ENDPOINTS.studentUpdate(accountId)
        : API_ENDPOINTS.teacherUpdate(accountId)

      // ✅ 攔截器會自動補上 X-CSRFToken Header
      await apiClient.put(url, editFormData)
      alert('修改成功！')
      setEditingAccount(null)
      fetchAccounts()
    } catch (error) {
      alert(error.response?.data?.error || '修改失敗')
    }
  }

  const departmentOptions = [
    { value: '資管系', label: '資訊管理系' },
    { value: '健管系', label: '健康事業管理系' },
    { value: '護理系', label: '護理系' }
  ]

  const gradeOptions = [
    { value: 1, label: '一年級' },
    { value: 2, label: '二年級' },
    { value: 3, label: '三年級' },
    { value: 4, label: '四年級' }
  ]

  const titleOptions = [
    { value: '教授', label: '教授' },
    { value: '副教授', label: '副教授' },
    { value: '助理教授', label: '助理教授' },
    { value: '講師', label: '講師' }
  ]

  return (
    <div className="p-6">
      {/* 標題和身份選擇 */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">查看所有帳號</h2>
        
        <div className="flex items-center gap-2 mb-4">
          <span className="text-sm font-medium text-gray-700">選擇身份：</span>
          <label className="flex items-center cursor-pointer">
            <input
              type="radio"
              name="accountType"
              value="student"
              checked={accountType === 'student'}
              onChange={(e) => setAccountType(e.target.value)}
              className="w-5 h-5 text-blue-600"
            />
            <span className="ml-2 text-base font-medium text-gray-700">學生</span>
          </label>
          <label className="flex items-center cursor-pointer ml-6">
            <input
              type="radio"
              name="accountType"
              value="teacher"
              checked={accountType === 'teacher'}
              onChange={(e) => setAccountType(e.target.value)}
              className="w-5 h-5 text-blue-600"
            />
            <span className="ml-2 text-base font-medium text-gray-700">教師</span>
          </label>
        </div>

        <div className="flex items-center gap-2 px-4 py-2.5 bg-blue-50 rounded-lg w-fit">
          <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          <span className="text-sm font-medium text-blue-700">
            共 {accounts.length} 位{accountType === 'student' ? '學生' : '教師'}
          </span>
        </div>
      </div>

      {/* 帳號列表 */}
      {loading ? (
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : accounts.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm p-12 text-center">
          <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          <h3 className="text-lg font-medium text-gray-900 mb-2">沒有找到帳號</h3>
          <p className="text-gray-500">請先新增帳號</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {accountType === 'student' ? (
                  <>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">學號</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">姓名</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">系所</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">年級</th>
                  </>
                ) : (
                  <>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">姓名</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">帳號</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">職稱</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">研究室</th>
                  </>
                )}
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {accounts.map((account) => (
                <tr key={account.id} className="hover:bg-gray-50 transition-colors">
                  {accountType === 'student' ? (
                    <>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {editingAccount === account.id ? (
                          <input
                            type="text"
                            name="student_id"
                            value={editFormData.student_id}
                            onChange={handleEditChange}
                            className="w-full px-2 py-1 border border-gray-300 rounded"
                          />
                        ) : (
                          <div className="text-sm font-medium text-gray-900">{account.student_id}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {editingAccount === account.id ? (
                          <input
                            type="text"
                            name="real_name"
                            value={editFormData.real_name}
                            onChange={handleEditChange}
                            className="w-full px-2 py-1 border border-gray-300 rounded"
                          />
                        ) : (
                          <div className="text-sm font-medium text-gray-900">{account.real_name}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {editingAccount === account.id ? (
                          <select
                            name="department"
                            value={editFormData.department}
                            onChange={handleEditChange}
                            className="w-full px-2 py-1 border border-gray-300 rounded"
                          >
                            {departmentOptions.map(dept => (
                              <option key={dept.value} value={dept.value}>{dept.label}</option>
                            ))}
                          </select>
                        ) : (
                          <div className="text-sm text-gray-900">{account.department}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {editingAccount === account.id ? (
                          <select
                            name="grade"
                            value={editFormData.grade}
                            onChange={handleEditChange}
                            className="w-full px-2 py-1 border border-gray-300 rounded"
                          >
                            {gradeOptions.map(grade => (
                              <option key={grade.value} value={grade.value}>{grade.label}</option>
                            ))}
                          </select>
                        ) : (
                          <div className="text-sm text-gray-900">{account.grade}年級</div>
                        )}
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {editingAccount === account.id ? (
                          <input
                            type="text"
                            name="real_name"
                            value={editFormData.real_name}
                            onChange={handleEditChange}
                            className="w-full px-2 py-1 border border-gray-300 rounded"
                          />
                        ) : (
                          <div className="text-sm font-medium text-gray-900">{account.real_name}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{account.username}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {editingAccount === account.id ? (
                          <select
                            name="title"
                            value={editFormData.title}
                            onChange={handleEditChange}
                            className="w-full px-2 py-1 border border-gray-300 rounded"
                          >
                            {titleOptions.map(title => (
                              <option key={title.value} value={title.value}>{title.label}</option>
                            ))}
                          </select>
                        ) : (
                          <div className="text-sm text-gray-900">{account.title || '未設定'}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {editingAccount === account.id ? (
                          <input
                            type="text"
                            name="office"
                            value={editFormData.office}
                            onChange={handleEditChange}
                            className="w-full px-2 py-1 border border-gray-300 rounded"
                          />
                        ) : (
                          <div className="text-sm text-gray-900">{account.office || '未設定'}</div>
                        )}
                      </td>
                    </>
                  )}
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    {editingAccount === account.id ? (
                      <>
                        <button 
                          className="text-green-600 hover:text-green-900"
                          onClick={() => handleEditSave(account.id)}
                        >
                          儲存
                        </button>
                        <button 
                          className="text-gray-600 hover:text-gray-900"
                          onClick={handleEditCancel}
                        >
                          取消
                        </button>
                      </>
                    ) : (
                      <>
                        <button 
                          className="text-blue-600 hover:text-blue-900"
                          onClick={() => handleEditClick(account)}
                        >
                          修改
                        </button>
                        <button 
                          className="text-red-600 hover:text-red-900"
                          onClick={() => handleDelete(account.id, account.real_name)}
                        >
                          刪除
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}