import { useState, useEffect } from 'react'

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

export default function SearchCourses() {
  const [courses, setCourses] = useState([])
  const [filterOptions, setFilterOptions] = useState({})
  const [filters, setFilters] = useState({
    keyword: '',
    academic_year: '114',
    semester: '',
    department: '',
    course_type: '',
    weekdays: [],
    periods: [],
    grade_level: ''
  })
  const [selectedCourse, setSelectedCourse] = useState(null)
  const [loading, setLoading] = useState(false)

  // 節次選項（1-14節）
  const periodOptions = Array.from({ length: 14 }, (_, i) => ({
    value: String(i + 1),
    label: `第${i + 1}節`
  }))

  const API_BASE_URL = 'http://localhost:8000/api'

  useEffect(() => {
    fetchFilterOptions()
    // 初始載入時執行一次查詢
    fetchCourses()
  }, [])

  // 監聽學年度變化，重新載入選項
  useEffect(() => {
    if (filters.academic_year) {
      fetchFilterOptions()
    }
  }, [filters.academic_year])

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
      
      // 處理一般參數
      if (filters.keyword) params.append('keyword', filters.keyword)
      if (filters.academic_year) params.append('academic_year', filters.academic_year)
      if (filters.semester) params.append('semester', filters.semester)
      if (filters.department) params.append('department', filters.department)
      if (filters.course_type) params.append('course_type', filters.course_type)
      if (filters.grade_level) params.append('grade_level', filters.grade_level)
      
      // 處理複選星期
      if (filters.weekdays.length > 0) {
        filters.weekdays.forEach(day => params.append('weekdays', day))
      }
      
      // 處理複選節次
      if (filters.periods.length > 0) {
        filters.periods.forEach(period => params.append('periods', period))
      }
      
      const response = await fetch(`${API_BASE_URL}/courses/search/?${params.toString()}`)
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const data = await response.json()
      setCourses(data || [])
    } catch (error) {
      console.error('查詢課程失敗:', error)
      alert('查詢課程失敗: ' + error.message)
    } finally {
      setLoading(false)
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
      academic_year: '114',
      semester: '',
      department: '',
      course_type: '',
      weekdays: [],
      periods: [],
      grade_level: ''
    })
  }

  // 處理查詢按鈕點擊
  const handleSearch = () => {
    fetchCourses()
  }

  // 處理 Enter 鍵觸發搜尋
  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      fetchCourses()
    }
  }

  const toggleFavorite = async (courseId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/courses/${courseId}/favorite/`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': getCookie('csrftoken'),
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        setCourses(prev => prev.map(course => 
          course.id === courseId 
            ? { ...course, is_favorited: data.is_favorited }
            : course
        ))
        alert(data.message)
      } else {
        const error = await response.json()
        alert(error.error || '操作失敗')
      }
    } catch (error) {
      console.error('收藏操作失敗:', error)
      alert('操作失敗，請先登入')
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

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">查詢課程</h2>
      
      {/* 篩選區域 */}
      <div className="mb-6 p-6 bg-gray-50 rounded-lg space-y-6">
        <h3 className="text-lg font-semibold text-gray-700 border-b pb-2">篩選條件</h3>
        
        {/* 第一排：基本篩選 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* 學年度 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">學年度</label>
            <select
              value={filters.academic_year}
              onChange={(e) => handleFilterChange('academic_year', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {filterOptions.academic_years?.map(year => (
                <option key={year} value={year}>{year} 學年度</option>
              ))}
            </select>
          </div>

          {/* 學期 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">學期</label>
            <select
              value={filters.semester}
              onChange={(e) => handleFilterChange('semester', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">全部</option>
              {filterOptions.semesters?.map(sem => (
                <option key={sem.value} value={sem.value}>{sem.label}</option>
              ))}
            </select>
          </div>

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

        {/* 第二排：建議年級和星期幾（複選） */}
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
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    filters.weekdays.includes(day.value)
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {day.label}
                </button>
              ))}
            </div>
            {/* {filters.weekdays.length > 0 && (
              <p className="text-xs text-gray-500 mt-2">
                已選擇：{filters.weekdays.length} 天
              </p>
            )} */}
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
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  filters.periods.includes(period.value)
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

        {/* 第四排：關鍵字搜尋 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            關鍵字搜尋
            <span className="text-xs text-gray-500 ml-2">（課程代碼、課程名稱或教師姓名）</span>
          </label>
          <input
            type="text"
            value={filters.keyword}
            onChange={(e) => handleFilterChange('keyword', e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="輸入關鍵字後按 Enter 或點擊查詢按鈕..."
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* 操作按鈕 */}
        <div className="flex justify-end gap-3 pt-4 border-t">
          <button
            onClick={resetFilters}
            className="px-6 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            重置篩選
          </button>
          <button
            onClick={handleSearch}
            disabled={loading}
            className="px-8 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:bg-blue-400 disabled:cursor-not-allowed"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            {loading ? '查詢中...' : '查詢'}
          </button>
        </div>
      </div>

      {/* 課程列表 */}
      {loading ? (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="text-gray-500 mt-2">載入中...</p>
        </div>
      ) : (
        <>
          <div className="mb-4 flex justify-between items-center">
            <p className="text-gray-600">
              共找到 <span className="font-semibold text-blue-600 text-lg">{courses.length}</span> 門課程
            </p>
            {(filters.weekdays.length > 0 || filters.periods.length > 0 || filters.keyword) && (
              <p className="text-sm text-gray-500">
                已套用篩選條件
              </p>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">課程代碼</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">課程名稱</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">開課系所</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">類別</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">學分</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">教師</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">時間</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">教室</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">人數</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">收藏</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {courses.map(course => {
                  const teacherNames = course.teachers && course.teachers.length > 0
                    ? course.teachers.map(t => t.name).join('、')
                    : '未設定'
                  
                  const timeDisplay = course.class_times && course.class_times.length > 0
                    ? course.class_times.map(t => `${t.weekday_display} ${t.start_period}-${t.end_period}節`).join('；')
                    : '未設定'
                  
                  const classroom = course.class_times && course.class_times.length > 0
                    ? course.class_times[0].classroom
                    : '未設定'
                  
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
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                        {course.department}
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
                        {timeDisplay}
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
              <p className="mt-2 text-gray-500">沒有找到符合條件的課程</p>
              <button
                onClick={resetFilters}
                className="mt-4 text-blue-600 hover:text-blue-800 text-sm"
              >
                清除所有篩選條件
              </button>
            </div>
          )}
        </>
      )}

      {/* 課程詳情彈窗（保持不變） */}
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
              
              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setSelectedCourse(null)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  關閉
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}