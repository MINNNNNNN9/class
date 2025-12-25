import { useState } from 'react'
import axios from 'axios'
import * as XLSX from 'xlsx'
import { API_ENDPOINTS } from '../../config/api'
import { useToast } from '../../contexts/ToastContext'

export default function RegisterAccount() {
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: '',
    real_name: '',
    role: 'student',
    // 學生專用欄位
    student_id: '',
    department: '',
    grade: '1',
    // 教師專用欄位
    teacher_id: '',
    office: '',
    title: ''
  })

  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [importLoading, setImportLoading] = useState(false)
  const [importResults, setImportResults] = useState(null)
  const { toast } = useToast()

  // 從「身分證字號」擷取後 6 碼（只取數字）
  // 例：A123456789 -> digits=123456789 -> last6=456789
  // 若 Excel 變成純數字或有空白/符號也能處理
  const extractIdLast6FromNationalId = (value) => {
    if (value === null || value === undefined) return ''
    const s = String(value).trim()
    if (!s) return ''
    const digits = s.replace(/\D/g, '') // 只保留數字
    if (!digits) return ''
    return digits.length >= 6 ? digits.slice(-6) : digits.padStart(6, '0')
  }

  // Excel 匯入邏輯
  const handleFileImport = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    setImportLoading(true)
    setImportResults(null)

    try {
      const data = await file.arrayBuffer()
      const workbook = XLSX.read(data)
      const worksheet = workbook.Sheets[workbook.SheetNames[0]]
      const rawData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: null })

      // 偵測標題行
      let headerRow = rawData[0]
      let dataStartRow = 1

      if (!headerRow || !headerRow.some(cell => String(cell).includes('姓名') || String(cell).includes('Name'))) {
        for (let i = 0; i < Math.min(10, rawData.length); i++) {
          if (rawData[i] && rawData[i].some(cell => String(cell).includes('姓名') || String(cell).includes('Name'))) {
            headerRow = rawData[i]
            dataStartRow = i + 1
            break
          }
        }
      }

      const results = { total: 0, success: 0, failed: 0, errors: [] }
      const rows = rawData.slice(dataStartRow)
      results.total = rows.length

      // 欄位映射助手
      const findCol = (keywords) =>
        headerRow
          ? headerRow.findIndex(cell =>
              keywords.some(k => String(cell || '').toLowerCase().includes(k.toLowerCase()))
            )
          : -1

      const colName = findCol(['姓名', 'Real Name', 'Name'])
      const colStudentId = findCol(['學號', 'Student ID'])
      const colTeacherId = findCol(['教師編號', 'Teacher ID', 'Teacher No', 'TID'])
      const colDept = findCol(['系所', 'Department'])
      const colGrade = findCol(['年級', 'Grade'])
      const colOffice = findCol(['研究室', 'Office'])
      const colTitle = findCol(['職稱', 'Title'])
      const colRole = findCol(['身份', 'Role', 'Type', '職別'])

      // 只需要這個：身分證字號（完整）
      const colNationalId = findCol([
        '身分證字號',
        '身分證',
        'National ID',
        'ID Number',
        'ID No',
        'idno',
        'nationalid'
      ])

      for (let i = 0; i < rows.length; i++) {
        const row = rows[i]
        if (!row || row.length === 0 || colName === -1 || !row[colName]) continue

        try {
          const real_name = String(row[colName]).trim()
          let role = 'student'

          // 判斷角色
          if (colRole !== -1 && row[colRole]) {
            const roleVal = String(row[colRole]).toLowerCase()
            if (roleVal.includes('教') || roleVal.includes('teacher')) role = 'teacher'
          } else if (colTeacherId !== -1 && row[colTeacherId]) {
            role = 'teacher'
          }

          // 密碼：從身分證字號取後 6 碼
          if (colNationalId === -1 || !row[colNationalId]) {
            throw new Error('缺少身分證字號（無法擷取後6碼當初始密碼）')
          }
          const idLast6 = extractIdLast6FromNationalId(row[colNationalId])
          if (!idLast6) {
            throw new Error('身分證字號格式不正確（無法擷取後6碼）')
          }

          const submitData = {
            real_name,
            role,
            password: idLast6
          }

          if (role === 'student') {
            submitData.student_id =
              (colStudentId !== -1 && row[colStudentId]) ? String(row[colStudentId]).trim() : ''
            submitData.department =
              (colDept !== -1 && row[colDept]) ? String(row[colDept]).trim() : '資管系'
            submitData.grade =
              (colGrade !== -1 && row[colGrade]) ? parseInt(row[colGrade]) : 1

            if (!submitData.student_id) throw new Error('缺少學號')
          } else {
            submitData.teacher_id =
              (colTeacherId !== -1 && row[colTeacherId])
                ? String(row[colTeacherId]).trim()
                : ((colStudentId !== -1 && row[colStudentId]) ? String(row[colStudentId]).trim() : '')

            submitData.office =
              (colOffice !== -1 && row[colOffice]) ? String(row[colOffice]).trim() : '未設定'
            submitData.title =
              (colTitle !== -1 && row[colTitle]) ? String(row[colTitle]).trim() : '講師'

            if (!submitData.teacher_id) throw new Error('缺少教師編號')
          }

          await axios.post(API_ENDPOINTS.register, submitData)
          results.success++
        } catch (error) {
          results.failed++
          const msg = error.response?.data?.error || error.message
          results.errors.push(`第 ${i + 1} 筆 (${row[colName] || '未知'}): ${msg}`)
        }
      }

      setImportResults(results)
      if (results.success > 0) {
        toast.success(`匯入完成！成功: ${results.success}, 失敗: ${results.failed}`)
      } else {
        toast.error('匯入失敗，請檢查錯誤訊息')
      }
    } catch (err) {
      toast.error('檔案讀取失敗: ' + err.message)
    } finally {
      setImportLoading(false)
      e.target.value = ''
    }
  }

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
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleRoleChange = (e) => {
    const newRole = e.target.value
    setFormData(prev => ({
      ...prev,
      role: newRole,
      ...(newRole === 'student'
        ? { teacher_id: '', office: '', title: '' }
        : { student_id: '', department: '', grade: '1' })
    }))
  }

  const validateForm = () => {
    if (!formData.password) return toast.error('請輸入密碼'), false
    if (formData.password !== formData.confirmPassword) return toast.error('兩次密碼輸入不一致'), false
    if (!formData.real_name.trim()) return toast.error('請輸入真實姓名'), false

    if (formData.role === 'student') {
      if (!formData.student_id.trim()) return toast.error('請輸入學號'), false
      if (!formData.department) return toast.error('請選擇系所'), false
    }

    if (formData.role === 'teacher') {
      if (!formData.teacher_id.trim()) return toast.error('請輸入教師編號'), false
      if (!formData.office.trim()) return toast.error('請輸入研究室'), false
      if (!formData.title) return toast.error('請選擇職稱'), false
    }

    return true
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validateForm()) return

    setLoading(true)
    try {
      const submitData = {
        password: formData.password,
        real_name: formData.real_name,
        role: formData.role
      }

      if (formData.role === 'student') {
        submitData.student_id = formData.student_id
        submitData.department = formData.department
        submitData.grade = parseInt(formData.grade)
      } else {
        submitData.teacher_id = formData.teacher_id
        submitData.office = formData.office
        submitData.title = formData.title
      }

      await axios.post(API_ENDPOINTS.register, submitData)
      toast.success(`${formData.role === 'student' ? '學生' : '教師'}帳號建立成功！`)

      setFormData({
        password: '',
        confirmPassword: '',
        real_name: '',
        role: 'student',
        student_id: '',
        department: '',
        grade: '1',
        teacher_id: '',
        office: '',
        title: ''
      })
    } catch (err) {
      toast.error(err.response?.data?.error ? `註冊失敗：${err.response.data.error}` : '註冊失敗，請稍後再試')
    } finally {
      setLoading(false)
    }
  }

  const handleReset = () => {
    setFormData({
      password: '',
      confirmPassword: '',
      real_name: '',
      role: 'student',
      student_id: '',
      department: '',
      grade: '1',
      teacher_id: '',
      office: '',
      title: ''
    })
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-8">
      <div className="bg-white rounded-lg shadow-md p-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-6 border-b pb-3">新增帳號</h2>

        {/* Excel 匯入區域 */}
        <div className="mb-8 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border-2 border-dashed border-blue-300">
          <h3 className="text-lg font-bold text-gray-800 mb-4">批次匯入帳號（Excel）</h3>

          <div
            className={`mb-4 p-8 border-2 border-dashed rounded-xl transition-all text-center cursor-pointer
              ${importLoading ? 'bg-gray-100 border-gray-300 cursor-not-allowed' : 'hover:bg-blue-50 hover:border-blue-400'}
              ${'border-blue-300 bg-blue-50/50'}
            `}
            onClick={() => !importLoading && document.getElementById('account-excel-upload').click()}
          >
            <div className="text-gray-700">
              <span className="font-bold text-lg">點擊選擇 Excel 檔</span>
              <p className="text-sm text-gray-500 mt-2">
                必備欄位：姓名、身分證字號、學號/教師編號（身份可選，未填預設 student）
              </p>
              <p className="text-sm text-gray-500">
                初始密碼：從「身分證字號」擷取最後 6 碼（只取數字）
              </p>
            </div>

            <input
              id="account-excel-upload"
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileImport}
              disabled={importLoading}
              className="hidden"
            />
          </div>

          {importLoading && (
            <div className="text-center text-blue-600 font-medium mb-4">
              正在建立帳號中，請稍候...
            </div>
          )}

          {importResults && (
            <div className="mt-6">
              <div className={`p-4 rounded-lg ${importResults.failed === 0 ? 'bg-green-100 border-green-300' : 'bg-red-100 border-red-300'} border-2`}>
                <h4 className="font-bold mb-2">匯入結果：</h4>
                <p>總共：{importResults.total} 筆</p>
                <p className="text-green-700">成功：{importResults.success} 筆</p>
                <p className="text-red-700">失敗：{importResults.failed} 筆</p>
              </div>

              {importResults.errors.length > 0 && (
                <div className="mt-4 p-4 bg-red-50 border-2 border-red-200 rounded-lg">
                  <h4 className="font-bold text-red-800 mb-2">錯誤訊息：</h4>
                  <ul className="list-disc list-inside text-sm text-red-700 space-y-1 max-h-60 overflow-y-auto">
                    {importResults.errors.map((error, index) => (
                      <li key={index}>{error}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        {/* 手動建立帳號 */}
        <form onSubmit={handleSubmit}>
          <div className="mb-6 bg-blue-50 p-4 rounded-lg">
            <label className="block text-sm font-bold text-gray-700 mb-2">
              身份類別 <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-6">
              <label className="flex items-center cursor-pointer">
                <input type="radio" name="role" value="student" checked={formData.role === 'student'} onChange={handleRoleChange} className="mr-2 w-4 h-4" />
                <span className="text-gray-700 font-medium">學生</span>
              </label>
              <label className="flex items-center cursor-pointer">
                <input type="radio" name="role" value="teacher" checked={formData.role === 'teacher'} onChange={handleRoleChange} className="mr-2 w-4 h-4" />
                <span className="text-gray-700 font-medium">教師</span>
              </label>
            </div>
          </div>

          <div className="space-y-4 mb-6">
            <h3 className="text-lg font-bold text-gray-700 border-b pb-2">基本資料</h3>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                真實姓名 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="real_name"
                value={formData.real_name}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
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
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  placeholder="請輸入密碼"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500"
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
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                placeholder="請再次輸入密碼"
              />
            </div>
          </div>

          {formData.role === 'student' && (
            <div className="space-y-4 mb-6 bg-green-50 p-4 rounded-lg">
              <h3 className="text-lg font-bold text-gray-700 border-b pb-2">學生資料</h3>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  學號 (將作為登入帳號) <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="student_id"
                  value={formData.student_id}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
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
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="">請選擇系所</option>
                  {departmentOptions.map(dept => (
                    <option key={dept.value} value={dept.value}>{dept.label}</option>
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
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                >
                  {gradeOptions.map(grade => (
                    <option key={grade.value} value={grade.value}>{grade.label}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {formData.role === 'teacher' && (
            <div className="space-y-4 mb-6 bg-purple-50 p-4 rounded-lg">
              <h3 className="text-lg font-bold text-gray-700 border-b pb-2">教師資料</h3>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  教師編號 (將作為登入帳號) <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="teacher_id"
                  value={formData.teacher_id}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  placeholder="例如：T001"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  研究室 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="office"
                  value={formData.office}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
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
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="">請選擇職稱</option>
                  {titleOptions.map(title => (
                    <option key={title.value} value={title.value}>{title.label}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          <div className="flex gap-4 pt-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 px-6 rounded-lg font-bold text-lg disabled:bg-gray-400"
            >
              {loading ? '建立中...' : '建立帳號'}
            </button>
            <button
              type="button"
              onClick={handleReset}
              className="flex-1 bg-gray-500 hover:bg-gray-600 text-white py-3 px-6 rounded-lg font-bold text-lg"
            >
              清空表單
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
