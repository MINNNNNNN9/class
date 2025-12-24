import { useState, useEffect } from 'react'
import axios from 'axios'
import { API_ENDPOINTS } from '../../config/api'
import { useToast } from '../../contexts/ToastContext'

export default function ViewAllCourses({ onEdit }) {
  const [courses, setCourses] = useState([])
  const [filteredCourses, setFilteredCourses] = useState([])
  const [selectedDepartment, setSelectedDepartment] = useState('all')
  const [selectedGrade, setSelectedGrade] = useState('all')
  const [selectedAcademicYear, setSelectedAcademicYear] = useState('all')
  const [selectedSemester, setSelectedSemester] = useState('all')
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const { toast } = useToast()

  const departmentOptions = [
    { value: 'all', label: '所有系所' },
    { value: '資管系', label: '資訊管理系' },
    { value: '護理系', label: '護理系' },
    { value: '健管系', label: '健康事業管理系' }
  ]

  const gradeOptions = [
    { value: 'all', label: '所有年級' },
    { value: '1', label: '一年級' },
    { value: '2', label: '二年級' },
    { value: '3', label: '三年級' },
    { value: '4', label: '四年級' }
  ]

  const academicYearOptions = [
    { value: 'all', label: '所有學年' },
    { value: '114', label: '114 學年度' },
    { value: '113', label: '113 學年度' },
    { value: '112', label: '112 學年度' }
  ]

  const semesterOptions = [
    { value: 'all', label: '所有學期' },
    { value: '1', label: '上學期' },
    { value: '2', label: '下學期' }
  ]

  // 不自動載入課程，等使用者按查詢
  // useEffect(() => {
  //   fetchCourses()
  // }, [])

  const fetchCourses = async () => {
    setLoading(true)
    try {
      // 建立查詢參數
      const params = new URLSearchParams()

      if (selectedAcademicYear !== 'all') {
        params.append('academic_year', selectedAcademicYear)
      }
      if (selectedSemester !== 'all') {
        params.append('semester', selectedSemester)
      }
      if (selectedDepartment !== 'all') {
        params.append('department', selectedDepartment)
      }
      if (selectedGrade !== 'all') {
        params.append('grade_level', selectedGrade)
      }
      if (searchTerm) {
        params.append('keyword', searchTerm)
      }

      // 使用查詢參數去後端搜尋
      const response = await axios.get(`${API_ENDPOINTS.courses}?${params.toString()}`)

      const coursesData = response.data.map(course => {
        // 處理多位教師顯示
        let teacherDisplay = course.teacher_name || '未設定'

        // 如果有協同教師資訊，組合顯示
        if (course.co_teachers && course.co_teachers.length > 0) {
          teacherDisplay = `${course.teacher_name}（主）`
        }

        return {
          ...course,
          teacher_display: teacherDisplay
        }
      })
      setCourses(coursesData)
      setFilteredCourses(coursesData)
    } catch (error) {
      console.error('載入課程失敗:', error)
      toast.error('載入課程失敗，請稍後再試')
    } finally {
      setLoading(false)
    }
  }

  // 手動觸發搜尋
  const handleSearch = () => {
    fetchCourses()
  }

  // 重置篩選
  const handleReset = () => {
    setSelectedDepartment('all')
    setSelectedGrade('all')
    setSelectedAcademicYear('all')
    setSelectedSemester('all')
    setSearchTerm('')
    setCourses([])
    setFilteredCourses([])
  }

  const handleDelete = async (courseId, courseName) => {
    if (!confirm(`確定要刪除課程「${courseName}」嗎？`)) {
      return
    }

    try {
      await axios.delete(API_ENDPOINTS.courseDelete(courseId))
      toast.success('課程刪除成功！')
      fetchCourses()
    } catch (error) {
      console.error('刪除課程失敗:', error)
      toast.error('刪除失敗，請稍後再試')
    }
  }

  const handleEdit = (courseId) => {
    console.log('觸發編輯課程 ID:', courseId)
    if (onEdit) {
      onEdit(courseId)
    }
  }

  const getCourseTypeLabel = (type) => {
    const typeMap = {
      'required': '必修',
      'elective': '選修',
      'general_required': '通識(必修)',
      'general_elective': '通識(選修)',
      'general': '通識' // 保留舊資料相容性
    }
    return typeMap[type] || type
  }

  const getCourseTypeBadge = (type) => {
    const styles = {
      'required': 'bg-red-100 text-red-700',
      'elective': 'bg-blue-100 text-blue-700',
      'general_required': 'bg-purple-100 text-purple-700',
      'general_elective': 'bg-green-100 text-green-700',
      'general': 'bg-green-100 text-green-700' // 保留舊資料相容性
    }
    return styles[type] || 'bg-gray-100 text-gray-700'
  }

  const getWeekdayLabel = (weekday) => {
    const weekdayMap = {
      '1': '星期一', '2': '星期二', '3': '星期三',
      '4': '星期四', '5': '星期五', '6': '星期六', '7': '星期日'
    }
    return weekdayMap[weekday] || weekday
  }

  return (
    <div className="p-6">
      {/* 篩選控制區 */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        {/* 第一排：學年、學期、系所 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          {/* 學年選擇 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              學年
            </label>
            <select
              value={selectedAcademicYear}
              onChange={(e) => setSelectedAcademicYear(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {academicYearOptions.map(year => (
                <option key={year.value} value={year.value}>
                  {year.label}
                </option>
              ))}
            </select>
          </div>

          {/* 學期選擇 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              學期
            </label>
            <select
              value={selectedSemester}
              onChange={(e) => setSelectedSemester(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {semesterOptions.map(sem => (
                <option key={sem.value} value={sem.value}>
                  {sem.label}
                </option>
              ))}
            </select>
          </div>

          {/* 系所選擇 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              系所
            </label>
            <select
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {departmentOptions.map(dept => (
                <option key={dept.value} value={dept.value}>
                  {dept.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* 第二排：年級、搜尋框、按鈕、統計 */}
        <div className="flex flex-wrap gap-4 items-end">
          {/* 年級選擇 */}
          <div className="flex-none w-96">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              學生年級
            </label>
            <select
              value={selectedGrade}
              onChange={(e) => setSelectedGrade(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {gradeOptions.map(grade => (
                <option key={grade.value} value={grade.value}>
                  {grade.label}
                </option>
              ))}
            </select>
          </div>

          {/* 搜尋框 */}
          <div className="flex-1 min-w-[250px]">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              關鍵字
            </label>
            <div className="relative">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="搜尋課程代碼、名稱、教師..."
                className="w-full px-4 py-2.5 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <svg
                className="absolute left-3 top-3 w-5 h-5 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>

          {/* 清空按鈕 */}
          <button
            onClick={handleReset}
            className="px-6 py-2.5 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors flex items-center gap-2 font-medium"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            清空
          </button>

          {/* 查詢按鈕 */}
          <button
            onClick={handleSearch}
            disabled={loading}
            className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 font-medium disabled:bg-blue-400 disabled:cursor-not-allowed"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            {loading ? '查詢中...' : '查詢'}
          </button>

          {/* 統計資訊 */}
          {filteredCourses.length > 0 && (
            <div className="flex items-center gap-2 px-4 py-2.5 bg-blue-50 rounded-lg">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span className="text-sm font-semibold text-blue-700">
                共 {filteredCourses.length} 門課程
              </span>
            </div>
          )}
        </div>
      </div>

      {/* 課程列表 */}
      {loading ? (
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : filteredCourses.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm p-12 text-center">
          <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <h3 className="text-lg font-medium text-gray-900 mb-2">請設定篩選條件後點擊查詢</h3>
          <p className="text-gray-500">選擇學年、學期、系所等條件，然後按下查詢按鈕</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  課程代碼
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  課程名稱
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  類別
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  授課教師
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  系所
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  教室
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  星期
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  節次
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  學分/節數
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  人數
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredCourses.map((course) => (
                <tr key={course.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{course.course_code}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">{course.course_name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getCourseTypeBadge(course.course_type)}`}>
                      {getCourseTypeLabel(course.course_type)}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">
                      {course.teacher_display || course.teacher_name || '未設定'}
                    </div>
                    {course.co_teachers && course.co_teachers.length > 0 && (
                      <div className="text-xs text-gray-500 mt-1">
                        +{course.co_teachers.length} 位協同
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{course.department}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{course.classroom || '未設定'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {getWeekdayLabel(course.weekday)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {course.start_period}-{course.end_period}節
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {course.credits} 學分 / {course.hours} 節
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {course.current_students} / {course.max_students}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    <button
                      className="text-blue-600 hover:text-blue-900 transition-colors"
                      onClick={() => handleEdit(course.id)}
                    >
                      修改
                    </button>
                    <button
                      className="text-red-600 hover:text-red-900 transition-colors"
                      onClick={() => handleDelete(course.id, course.course_name)}
                    >
                      刪除
                    </button>
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