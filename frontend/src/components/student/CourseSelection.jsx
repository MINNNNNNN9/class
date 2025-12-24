import { useState, useEffect } from 'react'
import API_BASE_URL from '../../config/api'
import { getCsrfToken } from '../../utils/csrf'
import { useToast } from '../../contexts/ToastContext'



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

export default function CourseSelection() {
  const [courses, setCourses] = useState([])
  const [filterOptions, setFilterOptions] = useState({})
  const [filters, setFilters] = useState({
    keyword: '',
    department: '',
    course_type: '',
    weekdays: [],
    periods: [],
    grade_level: '',
    academic_year: '114',
    show_favorites: false
  })
  const [selectedCourse, setSelectedCourse] = useState(null)
  const [loading, setLoading] = useState(false)
  const [enrolledCourses, setEnrolledCourses] = useState([])
  const [activeTab, setActiveTab] = useState('enrolled')
  const { toast } = useToast()

  // 節次選項（1-14節）
  const periodOptions = Array.from({ length: 14 }, (_, i) => ({
    value: String(i + 1),
    label: `第${i + 1}節`
  }))

  // 獲取篩選選項和已選課程
  useEffect(() => {
    fetchFilterOptions()
    fetchEnrolledCourses()
    // 初次載入時也要搜尋課程，這樣收藏狀態才會正確顯示
    fetchCourses()
  }, [])

  // 當篩選條件改變時自動搜尋（但關鍵字例外）
  useEffect(() => {
    if (!filters.show_favorites) {
      fetchCourses()
    }
  }, [filters.department, filters.course_type, filters.weekdays, filters.periods, filters.grade_level, filters.show_favorites])

  // 當顯示收藏改變時
  useEffect(() => {
    if (filters.show_favorites) {
      fetchFavoriteCourses()
    }
  }, [filters.show_favorites])

  const fetchFilterOptions = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/courses/filter-options/?academic_year=${filters.academic_year}`)
      const data = await response.json()
      setFilterOptions(data)
    } catch (error) {
      console.error('獲取篩選選項失敗:', error)
    }
  }

  const fetchCourses = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()

      // 基本參數
      if (filters.keyword) params.append('keyword', filters.keyword)
      params.append('academic_year', filters.academic_year)
      if (filters.department) params.append('department', filters.department)
      if (filters.course_type) params.append('course_type', filters.course_type)
      if (filters.grade_level) params.append('grade_level', filters.grade_level)

      // 複選星期
      if (filters.weekdays.length > 0) {
        filters.weekdays.forEach(day => params.append('weekdays', day))
      }

      // 複選節次
      if (filters.periods.length > 0) {
        filters.periods.forEach(period => params.append('periods', period))
      }

      const response = await fetch(`${API_BASE_URL}/courses/search/?${params.toString()}`, {
        credentials: 'include'
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      setCourses(data || [])
    } catch (error) {
      console.error('查詢課程失敗:', error)
      toast.error('查詢課程失敗: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const fetchFavoriteCourses = async () => {
    setLoading(true)
    try {
      const response = await fetch(`${API_BASE_URL}/courses/favorites/`, {
        credentials: 'include'
      })

      if (response.ok) {
        const data = await response.json()
        setCourses(data || [])
      } else {
        // toast.warning('請先登入以查看收藏課程') // Silent fail or warning? Maybe warning.
        setCourses([])
      }
    } catch (error) {
      console.error('獲取收藏課程失敗:', error)
      // toast.error('獲取收藏課程失敗，請先登入')
      setCourses([])
    } finally {
      setLoading(false)
    }
  }

  const fetchEnrolledCourses = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/courses/enrolled/?academic_year=${filters.academic_year}&semester=1`, {
        credentials: 'include'
      })

      if (response.ok) {
        const data = await response.json()
        setEnrolledCourses(data || [])
      }
    } catch (error) {
      console.error('獲取已選課程失敗:', error)
    }
  }

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }))
  }

  // 處理複選的切換
  const toggleArrayFilter = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: prev[key].includes(value)
        ? prev[key].filter(v => v !== value)
        : [...prev[key], value]
    }))
  }

  const resetFilters = () => {
    setFilters({
      keyword: '',
      department: '',
      course_type: '',
      weekdays: [],
      periods: [],
      grade_level: '',
      academic_year: '114',
      show_favorites: false
    })
  }

  // 處理搜尋按鈕點擊
  const handleSearch = () => {
    if (!filters.show_favorites) {
      fetchCourses()
    }
  }

  // 處理 Enter 鍵觸發搜尋
  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

  const enrollCourse = async (courseId) => {
    if (!confirm('確定要加選這門課程嗎？')) {
      return
    }

    try {
      const response = await fetch(`${API_BASE_URL}/courses/${courseId}/enroll/`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'X-CSRFToken': getCsrfToken(),
        }
      })

      if (response.ok) {
        const data = await response.json()
        toast.success(data.message)
        // 重新載入課程列表和已選課程
        if (filters.show_favorites) {
          fetchFavoriteCourses()
        } else {
          fetchCourses()
        }
        fetchEnrolledCourses()
      } else {
        const error = await response.json()
        toast.error(error.error || '加選失敗')
      }
    } catch (error) {
      console.error('加選課程失敗:', error)
      toast.error('加選失敗，請先登入')
    }
  }

  const dropCourse = async (courseId) => {
    if (!confirm('確定要退選這門課程嗎？')) {
      return
    }

    try {
      const response = await fetch(`${API_BASE_URL}/courses/${courseId}/drop/`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'X-CSRFToken': getCsrfToken(),
        }
      })

      if (response.ok) {
        const data = await response.json()
        toast.success(data.message)
        // 重新載入課程列表和已選課程
        if (filters.show_favorites) {
          fetchFavoriteCourses()
        } else {
          fetchCourses()
        }
        fetchEnrolledCourses()
      } else {
        const error = await response.json()
        toast.error(error.error || '退選失敗')
      }
    } catch (error) {
      console.error('退選課程失敗:', error)
      toast.error('退選失敗')
    }
  }

  const toggleFavorite = async (courseId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/courses/${courseId}/favorite/`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'X-CSRFToken': getCsrfToken(),
        }
      })

      if (response.ok) {
        const data = await response.json()
        // 更新課程列表中的收藏狀態
        setCourses(prev => prev.map(course =>
          course.id === courseId
            ? { ...course, is_favorited: data.is_favorited }
            : course
        ))
        toast.success(data.message)
      } else {
        const error = await response.json()
        toast.error(error.error || '操作失敗')
      }
    } catch (error) {
      console.error('收藏操作失敗:', error)
      toast.error('操作失敗，請先登入')
    }
  }

  const getCourseTypeColor = (type) => {
    const colors = {
      'required': 'bg-red-100 text-red-800',
      'elective': 'bg-blue-100 text-blue-800',
      'general_required': 'bg-green-100 text-green-800',
      'general_elective': 'bg-yellow-100 text-yellow-800',
      'general': 'bg-green-100 text-green-800',
    }
    return colors[type] || 'bg-gray-100 text-gray-800'
  }

  // 檢查課程是否已選
  const isCourseEnrolled = (courseId) => {
    return enrolledCourses.some(enrolled => enrolled.id === courseId)
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      {/* 分頁切換標籤 */}
      <div className="flex mb-6 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('enrolled')}
          className={`px-6 py-3 font-semibold text-lg transition-colors ${activeTab === 'enrolled'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-500 hover:text-gray-700'
            }`}
        >
          已選課程
        </button>
        <button
          onClick={() => setActiveTab('search')}
          className={`px-6 py-3 font-semibold text-lg transition-colors ${activeTab === 'search'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-500 hover:text-gray-700'
            }`}
        >
          選課
        </button>
      </div>

      {/* 已選課程頁面 */}
      {activeTab === 'enrolled' && (
        <div>
          <h2 className="text-2xl font-bold text-gray-800 mb-6">已選課程</h2>

          {loading ? (
            <div className="text-center py-8">
              <p className="text-gray-500">載入中...</p>
            </div>
          ) : enrolledCourses.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">您還沒有選擇任何課程</p>
            </div>
          ) : (
            <div className="space-y-4">
              {enrolledCourses.map(course => {
                const timeDisplay = course.class_times && course.class_times.length > 0
                  ? course.class_times.map(t => `${t.weekday_display} ${t.start_period}-${t.end_period}節`).join('；')
                  : '未設定'

                return (
                  <div
                    key={course.id}
                    className="bg-blue-50 rounded-lg p-6 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1 grid grid-cols-4 gap-4 items-center">
                        <div>
                          <p className="text-sm text-gray-600 mb-1">課程名稱</p>
                          <p className="font-bold text-gray-800 text-lg">{course.course_name}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600 mb-1">授課教師</p>
                          <p className="text-gray-800">{course.teacher_name}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600 mb-1">上課時間</p>
                          <p className="text-gray-800">{timeDisplay}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600 mb-1">學分</p>
                          <p className="text-gray-800">{course.credits} 學分</p>
                        </div>
                      </div>
                      <div className="ml-6">
                        <button
                          onClick={() => dropCourse(course.id)}
                          className="px-6 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors font-semibold"
                        >
                          退選
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}

              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <p className="text-gray-700">
                  已選課程：<span className="font-bold text-blue-600">{enrolledCourses.length}</span> 門
                  ｜總學分：<span className="font-bold text-blue-600">
                    {enrolledCourses.reduce((sum, course) => sum + course.credits, 0)}
                  </span> 學分
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 選課頁面 */}
      {activeTab === 'search' && (
        <div>
          <h2 className="text-2xl font-bold text-gray-800 mb-6">選課</h2>

          {/* 篩選區域 */}
          <div className="mb-6 p-6 bg-gray-50 rounded-lg space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-700">篩選條件</h3>

              {/* 收藏課程切換 */}
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="show-favorites"
                  checked={filters.show_favorites}
                  onChange={(e) => handleFilterChange('show_favorites', e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                />
                <label htmlFor="show-favorites" className="ml-2 text-sm font-medium text-gray-700 cursor-pointer">
                  只顯示收藏課程
                </label>
              </div>
            </div>

            {!filters.show_favorites && (
              <>
                {/* 第一排：系所、課程類別 */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* 系所 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">系所</label>
                    <select
                      value={filters.department}
                      onChange={(e) => handleFilterChange('department', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">全部</option>
                      {filterOptions.departments?.map(dept => (
                        <option key={dept} value={dept}>{dept}</option>
                      ))}
                    </select>
                  </div>

                  {/* 課程類別 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">課程類別</label>
                    <select
                      value={filters.course_type}
                      onChange={(e) => handleFilterChange('course_type', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">全部</option>
                      {filterOptions.course_types?.map(type => (
                        <option key={type.value} value={type.value}>{type.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* 第二排：建議年級和星期幾 */}
                <div>
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
                    <div className="md:col-span-3">
                      <label className="block text-sm font-medium text-gray-700 mb-2">建議年級</label>
                      <select
                        value={filters.grade_level}
                        onChange={(e) => handleFilterChange('grade_level', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">全部</option>
                        {filterOptions.grades?.map(grade => (
                          <option key={grade.value} value={grade.value}>{grade.label}</option>
                        ))}
                      </select>
                    </div>

                    <div className="md:col-span-9">
                      <label className="block text-sm font-medium text-gray-700 mb-3">星期幾（可複選）</label>
                      <div className="flex flex-wrap gap-2">
                        {filterOptions.weekdays?.map(day => (
                          <button
                            key={day.value}
                            onClick={() => toggleArrayFilter('weekdays', day.value)}
                            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${filters.weekdays.includes(day.value)
                                ? 'bg-blue-600 text-white'
                                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                              }`}
                          >
                            {day.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* 第三排：節次（複選） */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">節次（可複選）</label>
                  <div className="flex flex-wrap gap-2">
                    {periodOptions.map(period => (
                      <button
                        key={period.value}
                        onClick={() => toggleArrayFilter('periods', period.value)}
                        className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${filters.periods.includes(period.value)
                            ? 'bg-green-600 text-white'
                            : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                          }`}
                      >
                        {period.label}
                      </button>
                    ))}
                  </div>
                  {filters.periods.length > 0 && (
                    <p className="text-xs text-gray-500 mt-2">
                      已選擇：{filters.periods.length} 個節次
                    </p>
                  )}
                </div>

                {/* 第四排：關鍵字搜尋、查詢和重置按鈕 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    關鍵字搜尋
                    <span className="text-xs text-gray-500 ml-2">（課程代碼、課程名稱或教師姓名）</span>
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={filters.keyword}
                      onChange={(e) => handleFilterChange('keyword', e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="輸入關鍵字後按 Enter 或點擊查詢按鈕..."
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      onClick={handleSearch}
                      disabled={loading}
                      className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:bg-blue-400"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                      {loading ? '查詢中...' : '查詢'}
                    </button>
                    <button
                      onClick={resetFilters}
                      className="px-6 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors"
                    >
                      重置篩選
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* 課程列表 */}
          {loading ? (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="text-gray-500 mt-2">載入中...</p>
            </div>
          ) : (
            <>
              <div className="mb-4">
                <p className="text-gray-600">
                  {filters.show_favorites ? '收藏課程' : '可選課程'}：
                  <span className="font-semibold text-blue-600 text-lg"> {courses.length}</span> 門
                </p>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">課程代碼</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">課程名稱</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">類別</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">學分</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">教師</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">星期</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">節次</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">教室</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">人數</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">收藏</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">操作</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {courses.map(course => {
                      // 取得教師名稱
                      const getTeacherDisplay = () => {
                        if (!course.teachers || course.teachers.length === 0) {
                          return '未設定'
                        }

                        // 找出主要教師（is_primary_teacher 為 true）
                        const primaryTeacher = course.teachers.find(t => t.is_primary_teacher)
                        const coTeachers = course.teachers.filter(t => !t.is_primary_teacher)

                        if (primaryTeacher && coTeachers.length > 0) {
                          return `${primaryTeacher.name} +${coTeachers.length}位協同`
                        } else if (primaryTeacher) {
                          return primaryTeacher.name
                        } else {
                          // 如果沒有標記主要教師，顯示第一位
                          return course.teachers[0].name + (course.teachers.length > 1 ? ` +${course.teachers.length - 1}位協同` : '')
                        }
                      }

                      const teacherNames = getTeacherDisplay()

                      // 改成分別計算星期和節次
                      const weekdayDisplay = course.class_times && course.class_times.length > 0
                        ? course.class_times.map(t => t.weekday_display).join('、')
                        : '未設定'

                      const periodDisplay = course.class_times && course.class_times.length > 0
                        ? course.class_times.map(t => `${t.start_period}-${t.end_period}節`).join('、')
                        : '未設定'

                      // 取得教室
                      const classroom = course.class_times && course.class_times.length > 0
                        ? course.class_times[0].classroom
                        : '未設定'

                      // 檢查是否已選課
                      const isEnrolled = isCourseEnrolled(course.id)

                      return (
                        <tr key={course.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                            {course.course_code}
                          </td>
                          <td className="px-4 py-3 text-sm">
                            <button
                              onClick={() => setSelectedCourse(course)}
                              className="text-blue-600 hover:text-blue-800 hover:underline font-medium text-left"
                            >
                              {course.course_name}
                            </button>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm">
                            <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getCourseTypeColor(course.course_type)}`}>
                              {course.course_type_display}
                            </span>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                            {course.credits}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                            {teacherNames}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                            {weekdayDisplay}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                            {periodDisplay}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                            {classroom}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                            {course.current_students}/{course.max_students}
                            {course.status === 'full' && <span className="ml-1 text-red-500">(額滿)</span>}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm">
                            <button
                              onClick={() => toggleFavorite(course.id)}
                              className={`text-2xl ${course.is_favorited ? 'text-yellow-500' : 'text-gray-300'} hover:text-yellow-500 transition-colors`}
                              title={course.is_favorited ? '取消收藏' : '加入收藏'}
                            >
                              {course.is_favorited ? '★' : '☆'}
                            </button>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm">
                            {isEnrolled ? (
                              <span className="px-3 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded">
                                已選課
                              </span>
                            ) : (
                              <button
                                onClick={() => enrollCourse(course.id)}
                                disabled={course.status === 'full' || course.status === 'closed'}
                                className={`px-3 py-1 rounded text-xs font-semibold transition-colors ${course.status === 'full' || course.status === 'closed'
                                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                    : 'bg-blue-600 text-white hover:bg-blue-700'
                                  }`}
                              >
                                {course.status === 'full' ? '已額滿' : course.status === 'closed' ? '已停開' : '加選'}
                              </button>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              {courses.length === 0 && (
                <div className="text-center py-12">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="mt-2 text-gray-500">
                    {filters.show_favorites ? '您還沒有收藏任何課程' : '沒有找到符合條件的課程'}
                  </p>
                  {!filters.show_favorites && (
                    <button
                      onClick={resetFilters}
                      className="mt-4 text-blue-600 hover:text-blue-800 text-sm"
                    >
                      清除所有篩選條件
                    </button>
                  )}
                </div>
              )}
            </>
          )}

          {/* 課程詳情彈窗 */}
          {selectedCourse && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-2xl font-bold text-gray-800">
                      {selectedCourse.course_name}
                    </h3>
                    <button
                      onClick={() => setSelectedCourse(null)}
                      className="text-gray-500 hover:text-gray-700 text-2xl"
                    >
                      ×
                    </button>
                  </div>

                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="font-semibold text-gray-700">課程代碼：</span>
                        <span className="text-gray-600">{selectedCourse.course_code}</span>
                      </div>
                      <div>
                        <span className="font-semibold text-gray-700">學分數：</span>
                        <span className="text-gray-600">{selectedCourse.credits} 學分</span>
                      </div>
                      <div>
                        <span className="font-semibold text-gray-700">授課教師：</span>
                        <span className="text-gray-600">
                          {selectedCourse.teachers && selectedCourse.teachers.length > 0
                            ? selectedCourse.teachers.map(t => t.name).join('、')
                            : '未設定'}
                        </span>
                      </div>
                      <div>
                        <span className="font-semibold text-gray-700">課程類別：</span>
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getCourseTypeColor(selectedCourse.course_type)}`}>
                          {selectedCourse.course_type_display}
                        </span>
                      </div>
                      <div>
                        <span className="font-semibold text-gray-700">上課時間：</span>
                        <span className="text-gray-600">
                          {selectedCourse.class_times && selectedCourse.class_times.length > 0
                            ? selectedCourse.class_times.map(t => `${t.weekday_display} ${t.start_period}-${t.end_period}節`).join('；')
                            : '未設定'}
                        </span>
                      </div>
                      <div>
                        <span className="font-semibold text-gray-700">上課教室：</span>
                        <span className="text-gray-600">
                          {selectedCourse.class_times && selectedCourse.class_times.length > 0
                            ? selectedCourse.class_times.map(t => t.classroom).join('、')
                            : '未設定'}
                        </span>
                      </div>
                      <div>
                        <span className="font-semibold text-gray-700">開課系所：</span>
                        <span className="text-gray-600">{selectedCourse.department}</span>
                      </div>
                      <div>
                        <span className="font-semibold text-gray-700">選課人數：</span>
                        <span className="text-gray-600">
                          {selectedCourse.current_students}/{selectedCourse.max_students}
                        </span>
                      </div>
                    </div>

                    <div className="pt-4 border-t">
                      <h4 className="font-semibold text-gray-700 mb-2">課程描述：</h4>
                      <p className="text-gray-600 whitespace-pre-wrap">
                        {selectedCourse.description || '無課程描述'}
                      </p>
                    </div>
                  </div>

                  <div className="mt-6 flex justify-end space-x-3">
                    {!isCourseEnrolled(selectedCourse.id) && selectedCourse.status !== 'full' && selectedCourse.status !== 'closed' && (
                      <button
                        onClick={() => {
                          enrollCourse(selectedCourse.id)
                          setSelectedCourse(null)
                        }}
                        className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                      >
                        加選此課程
                      </button>
                    )}
                    <button
                      onClick={() => setSelectedCourse(null)}
                      className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
                    >
                      關閉
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}