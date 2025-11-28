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

export default function CourseSelection() {
  const [courses, setCourses] = useState([])
  const [filterOptions, setFilterOptions] = useState({})
  const [filters, setFilters] = useState({
    department: '',
    semester: '1',
    course_type: '',
    weekday: '',
    grade_level: '',
    academic_year: '114',
    show_favorites: false
  })
  const [selectedCourse, setSelectedCourse] = useState(null)
  const [loading, setLoading] = useState(false)
  const [enrolledCourses, setEnrolledCourses] = useState([])

  // API 基礎 URL
  const API_BASE_URL = 'http://localhost:8000/api'

  // 獲取篩選選項和已選課程
  useEffect(() => {
    fetchFilterOptions()
    fetchEnrolledCourses()
  }, [])

  // 獲取課程列表
  useEffect(() => {
    if (filters.show_favorites) {
      fetchFavoriteCourses()
    } else {
      fetchCourses()
    }
  }, [filters])

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
      Object.keys(filters).forEach(key => {
        if (filters[key] && key !== 'show_favorites') {
          params.append(key, filters[key])
        }
      })
      
      const response = await fetch(`${API_BASE_URL}/courses/search/?${params.toString()}`, {
        credentials: 'include'
      })
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const data = await response.json()
      setCourses(data.courses || [])
    } catch (error) {
      console.error('查詢課程失敗:', error)
      alert('查詢課程失敗: ' + error.message)
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
        setCourses(data.courses || [])
      } else {
        alert('請先登入以查看收藏課程')
        setCourses([])
      }
    } catch (error) {
      console.error('獲取收藏課程失敗:', error)
      alert('獲取收藏課程失敗，請先登入')
      setCourses([])
    } finally {
      setLoading(false)
    }
  }

  const fetchEnrolledCourses = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/courses/enrolled/?academic_year=${filters.academic_year}&semester=${filters.semester}`, {
        credentials: 'include'
      })
      
      if (response.ok) {
        const data = await response.json()
        setEnrolledCourses(data.courses || [])
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

  const resetFilters = () => {
    setFilters({
      department: '',
      semester: '1',
      course_type: '',
      weekday: '',
      grade_level: '',
      academic_year: '113',
      show_favorites: false
    })
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
          'Content-Type': 'application/json',
          'X-CSRFToken': getCookie('csrftoken'),
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        alert(data.message)
        // 重新載入課程列表和已選課程
        if (filters.show_favorites) {
          fetchFavoriteCourses()
        } else {
          fetchCourses()
        }
        fetchEnrolledCourses()
      } else {
        const error = await response.json()
        alert(error.error || '加選失敗')
      }
    } catch (error) {
      console.error('加選課程失敗:', error)
      alert('加選失敗，請先登入')
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
          'Content-Type': 'application/json',
          'X-CSRFToken': getCookie('csrftoken'),
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        alert(data.message)
        // 重新載入課程列表和已選課程
        if (filters.show_favorites) {
          fetchFavoriteCourses()
        } else {
          fetchCourses()
        }
        fetchEnrolledCourses()
      } else {
        const error = await response.json()
        alert(error.error || '退選失敗')
      }
    } catch (error) {
      console.error('退選課程失敗:', error)
      alert('退選失敗')
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
        // 更新課程列表中的收藏狀態
        setCourses(prev => prev.map(course => 
          course.id === courseId 
            ? { ...course, is_favorited: data.is_favorited }
            : course
        ))
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
    }
    return colors[type] || 'bg-gray-100 text-gray-800'
  }

  const getTotalCredits = () => {
    return enrolledCourses.reduce((sum, course) => sum + course.credits, 0)
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">預選課系統</h2>
        <div className="text-right">
          <p className="text-sm text-gray-600">已選課程：{enrolledCourses.length} 門</p>
          <p className="text-sm font-semibold text-blue-600">總學分：{getTotalCredits()} 學分</p>
        </div>
      </div>

      {/* 已選課程區域 */}
      {enrolledCourses.length > 0 && (
        <div className="mb-6 p-4 bg-blue-50 rounded-lg">
          <h3 className="text-lg font-semibold mb-3 text-gray-700">已選課程</h3>
          <div className="space-y-2">
            {enrolledCourses.map(course => (
              <div key={course.id} className="flex justify-between items-center bg-white p-3 rounded-md shadow-sm">
                <div className="flex-1">
                  <span className="font-medium text-gray-800">{course.course_name}</span>
                  <span className="ml-2 text-sm text-gray-600">({course.credits}學分)</span>
                  <span className="ml-2 text-sm text-gray-500">{course.time_display}</span>
                </div>
                <button
                  onClick={() => dropCourse(course.id)}
                  className="px-3 py-1 bg-red-500 text-white text-sm rounded hover:bg-red-600 transition-colors"
                >
                  退選
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* 篩選區域 */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <h3 className="text-lg font-semibold mb-4 text-gray-700">篩選條件</h3>
        
        {/* 顯示收藏課程開關 */}
        <div className="mb-4">
          <label className="flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={filters.show_favorites}
              onChange={(e) => handleFilterChange('show_favorites', e.target.checked)}
              className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
            />
            <span className="ml-2 text-sm font-medium text-gray-700">
              只顯示收藏的課程 ⭐
            </span>
          </label>
        </div>

        {!filters.show_favorites && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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

            {/* 星期幾 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">星期幾</label>
              <select
                value={filters.weekday}
                onChange={(e) => handleFilterChange('weekday', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">全部</option>
                {filterOptions.weekdays?.map(day => (
                  <option key={day.value} value={day.value}>{day.label}</option>
                ))}
              </select>
            </div>

            {/* 年級 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">建議年級</label>
              <select
                value={filters.grade_level}
                onChange={(e) => handleFilterChange('grade_level', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">全部</option>
                {filterOptions.grade_levels?.map(grade => (
                  <option key={grade.value} value={grade.value}>{grade.label}</option>
                ))}
              </select>
            </div>

            {/* 重置按鈕 */}
            <div className="flex items-end">
              <button
                onClick={resetFilters}
                className="w-full px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors"
              >
                重置篩選
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 課程列表 */}
      {loading ? (
        <div className="text-center py-8">
          <p className="text-gray-500">載入中...</p>
        </div>
      ) : (
        <>
          <div className="mb-4">
            <p className="text-gray-600">
              {filters.show_favorites ? '收藏課程' : '可選課程'}：
              <span className="font-semibold"> {courses.length}</span> 門
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
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">時間</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">教室</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">人數</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">收藏</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">操作</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {courses.map(course => (
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
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getCourseTypeColor(course.course_type_value)}`}>
                        {course.course_type}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                      {course.credits}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                      {course.teacher_name}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                      {course.time_display}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                      {course.classroom}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                      {course.current_students}/{course.max_students}
                      {course.is_full && <span className="ml-1 text-red-500">(額滿)</span>}
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
                      {course.is_enrolled ? (
                        <span className="px-3 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded">
                          已選課
                        </span>
                      ) : (
                        <button
                          onClick={() => enrollCourse(course.id)}
                          disabled={course.is_full || course.status_value === 'closed'}
                          className={`px-3 py-1 rounded text-xs font-semibold transition-colors ${
                            course.is_full || course.status_value === 'closed'
                              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                              : 'bg-blue-600 text-white hover:bg-blue-700'
                          }`}
                        >
                          {course.is_full ? '已額滿' : course.status_value === 'closed' ? '已停開' : '加選'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {courses.length === 0 && (
            <div className="text-center py-8">
              <p className="text-gray-500">
                {filters.show_favorites ? '您還沒有收藏任何課程' : '沒有找到符合條件的課程'}
              </p>
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
                    <span className="text-gray-600">{selectedCourse.teacher_name}</span>
                  </div>
                  <div>
                    <span className="font-semibold text-gray-700">課程類別：</span>
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getCourseTypeColor(selectedCourse.course_type_value)}`}>
                      {selectedCourse.course_type}
                    </span>
                  </div>
                  <div>
                    <span className="font-semibold text-gray-700">上課時間：</span>
                    <span className="text-gray-600">{selectedCourse.time_display}</span>
                  </div>
                  <div>
                    <span className="font-semibold text-gray-700">上課教室：</span>
                    <span className="text-gray-600">{selectedCourse.classroom}</span>
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
                {!selectedCourse.is_enrolled && !selectedCourse.is_full && selectedCourse.status_value !== 'closed' && (
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
  )
}