import { useState, useEffect } from 'react'
import axios from 'axios'

export default function CreateCourse() {
  const [formData, setFormData] = useState({
    course_code: '',
    course_name: '',
    course_type: 'required',
    description: '',
    credits: '2',
    hours: '2',
    academic_year: '113',
    semester: '1',
    department: '資管系',
    grade_level: '1',
    teacher_id: '',
    classroom: '',
    weekday: '1',
    start_period: '1',
    end_period: '2',
    max_students: '50'
  })

  const [teachers, setTeachers] = useState([])
  const [loading, setLoading] = useState(false)

  // 載入教師列表
  useEffect(() => {
    fetchTeachers()
  }, [])

  const fetchTeachers = async () => {
    try {
      const response = await axios.get('http://localhost:8000/api/teachers/')
      setTeachers(response.data)
    } catch (error) {
      console.error('載入教師列表失敗:', error)
    }
  }

  const courseTypeOptions = [
    { value: 'required', label: '必修' },
    { value: 'elective', label: '選修' },
    { value: 'general', label: '通識' }
  ]

  const semesterOptions = [
    { value: '1', label: '上學期' },
    { value: '2', label: '下學期' }
  ]

  const departmentOptions = [
    { value: '資管系', label: '資訊管理系' },
    { value: '建管系', label: '建築管理系' }
  ]

  const gradeOptions = [
    { value: '1', label: '一年級' },
    { value: '2', label: '二年級' },
    { value: '3', label: '三年級' },
    { value: '4', label: '四年級' }
  ]

  const weekdayOptions = [
    { value: '1', label: '星期一' },
    { value: '2', label: '星期二' },
    { value: '3', label: '星期三' },
    { value: '4', label: '星期四' },
    { value: '5', label: '星期五' },
    { value: '6', label: '星期六' },
    { value: '7', label: '星期日' }
  ]

  const periodOptions = Array.from({ length: 14 }, (_, i) => ({
    value: String(i + 1),
    label: `第 ${i + 1} 節`
  }))

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const validateForm = () => {
    if (!formData.course_code.trim()) {
      alert('請輸入課程代碼')
      return false
    }
    if (!formData.course_name.trim()) {
      alert('請輸入課程名稱')
      return false
    }
    if (!formData.teacher_id) {
      alert('請選擇授課教師')
      return false
    }
    if (!formData.classroom.trim()) {
      alert('請輸入教室')
      return false
    }
    if (parseInt(formData.start_period) > parseInt(formData.end_period)) {
      alert('開始節次不能大於結束節次')
      return false
    }
    return true
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) return

    setLoading(true)
    
    try {
      const submitData = {
        ...formData,
        credits: parseInt(formData.credits),
        hours: parseInt(formData.hours),
        grade_level: parseInt(formData.grade_level),
        start_period: parseInt(formData.start_period),
        end_period: parseInt(formData.end_period),
        max_students: parseInt(formData.max_students),
        teacher_id: parseInt(formData.teacher_id)
      }

      await axios.post('http://localhost:8000/api/courses/create/', submitData)
      
      alert('課程建立成功！')
      
      // 清空表單
      setFormData({
        course_code: '',
        course_name: '',
        course_type: 'required',
        description: '',
        credits: '2',
        hours: '2',
        academic_year: '113',
        semester: '1',
        department: '資管系',
        grade_level: '1',
        teacher_id: '',
        classroom: '',
        weekday: '1',
        start_period: '1',
        end_period: '2',
        max_students: '50'
      })
    } catch (err) {
      console.error('建立課程錯誤:', err)
      if (err.response?.data?.error) {
        alert(`建立失敗：${err.response.data.error}`)
      } else {
        alert('建立失敗，請稍後再試')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleReset = () => {
    setFormData({
      course_code: '',
      course_name: '',
      course_type: 'required',
      description: '',
      credits: '2',
      hours: '2',
      academic_year: '113',
      semester: '1',
      department: '資管系',
      grade_level: '1',
      teacher_id: '',
      classroom: '',
      weekday: '1',
      start_period: '1',
      end_period: '2',
      max_students: '50'
    })
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      <div className="bg-white rounded-lg shadow-md p-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-6 border-b pb-3">新增課程</h2>
        
        <form onSubmit={handleSubmit}>
          {/* 基本資料 */}
          <div className="space-y-4 mb-6">
            <h3 className="text-lg font-bold text-gray-700 border-b pb-2">基本資料</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  課程代碼 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="course_code"
                  value={formData.course_code}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="例如：CS101"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  課程名稱 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="course_name"
                  value={formData.course_name}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="請輸入課程名稱"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                課程描述
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows="3"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="請輸入課程描述（選填）"
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  課程類別 <span className="text-red-500">*</span>
                </label>
                <select
                  name="course_type"
                  value={formData.course_type}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {courseTypeOptions.map(type => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  學分數 <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  name="credits"
                  value={formData.credits}
                  onChange={handleChange}
                  min="1"
                  max="10"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  課程節數 <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  name="hours"
                  value={formData.hours}
                  onChange={handleChange}
                  min="1"
                  max="10"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* 開課資訊 */}
          <div className="space-y-4 mb-6 bg-yellow-50 p-4 rounded-lg">
            <h3 className="text-lg font-bold text-gray-700 border-b pb-2">開課資訊</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  學年度 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="academic_year"
                  value={formData.academic_year}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                  placeholder="例如：113"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  學期 <span className="text-red-500">*</span>
                </label>
                <select
                  name="semester"
                  value={formData.semester}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                >
                  {semesterOptions.map(sem => (
                    <option key={sem.value} value={sem.value}>
                      {sem.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  開課系所 <span className="text-red-500">*</span>
                </label>
                <select
                  name="department"
                  value={formData.department}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                >
                  {departmentOptions.map(dept => (
                    <option key={dept.value} value={dept.value}>
                      {dept.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  建議修課年級 <span className="text-red-500">*</span>
                </label>
                <select
                  name="grade_level"
                  value={formData.grade_level}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                >
                  {gradeOptions.map(grade => (
                    <option key={grade.value} value={grade.value}>
                      {grade.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                授課教師 <span className="text-red-500">*</span>
              </label>
              <select
                name="teacher_id"
                value={formData.teacher_id}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
              >
                <option value="">請選擇教師</option>
                {teachers.map(teacher => (
                  <option key={teacher.id} value={teacher.id}>
                    {teacher.real_name} ({teacher.username})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* 上課時間與地點 */}
          <div className="space-y-4 mb-6 bg-green-50 p-4 rounded-lg">
            <h3 className="text-lg font-bold text-gray-700 border-b pb-2">上課時間與地點</h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                教室 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="classroom"
                value={formData.classroom}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="例如：A101"
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  星期幾 <span className="text-red-500">*</span>
                </label>
                <select
                  name="weekday"
                  value={formData.weekday}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  {weekdayOptions.map(day => (
                    <option key={day.value} value={day.value}>
                      {day.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  開始節次 <span className="text-red-500">*</span>
                </label>
                <select
                  name="start_period"
                  value={formData.start_period}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  {periodOptions.map(period => (
                    <option key={period.value} value={period.value}>
                      {period.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  結束節次 <span className="text-red-500">*</span>
                </label>
                <select
                  name="end_period"
                  value={formData.end_period}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  {periodOptions.map(period => (
                    <option key={period.value} value={period.value}>
                      {period.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* 選課人數 */}
          <div className="space-y-4 mb-6 bg-purple-50 p-4 rounded-lg">
            <h3 className="text-lg font-bold text-gray-700 border-b pb-2">選課人數</h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                人數上限 <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                name="max_students"
                value={formData.max_students}
                onChange={handleChange}
                min="1"
                max="200"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* 按鈕區 */}
          <div className="flex gap-4 pt-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 px-6 rounded-lg font-bold text-lg transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {loading ? '建立中...' : '建立課程'}
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