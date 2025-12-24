import { useState, useEffect } from 'react'
import axios from 'axios'
import * as XLSX from 'xlsx'
import API_BASE_URL, { API_ENDPOINTS } from '../../config/api'
import { useToast } from '../../contexts/ToastContext'

export default function CreateCourse({ editingCourseId, onSaveComplete }) {
  const [formData, setFormData] = useState({
    course_code: '',
    course_name: '',
    course_type: 'required',
    description: '',
    credits: '2',
    hours: '2',
    academic_year: '114',
    semester: '1',
    department: '資管系',
    grade_level: '1',
    teacher_id: '',  // 主開課教師
    teacher_name: '',      // ← 新增：新教師姓名
    use_new_teacher: false, // ← 新增：是否使用新教師
    co_teachers: [],  // 協同教師 ID 陣列
    classroom: '',
    weekday: '1',
    start_period: '1',
    end_period: '2',
    max_students: '50'
  })

  const [teachers, setTeachers] = useState([])
  const [loading, setLoading] = useState(false)
  const [importLoading, setImportLoading] = useState(false)
  const [importResults, setImportResults] = useState(null)
  const [importDepartment, setImportDepartment] = useState('資管系')
  const [isEditMode, setIsEditMode] = useState(false)
  const { toast } = useToast()

  // 載入教師列表
  useEffect(() => {
    fetchTeachers()
  }, [])

  // 當 editingCourseId 變化時，載入課程資料
  useEffect(() => {
    if (editingCourseId) {
      setIsEditMode(true)
      fetchCourseDetail(editingCourseId)
    } else {
      setIsEditMode(false)
      resetForm()
    }
  }, [editingCourseId])

  const fetchCourseDetail = async (courseId) => {
    try {
      setLoading(true)
      const response = await axios.get(API_ENDPOINTS.courseDetail(courseId))
      setFormData(response.data)
      console.log('載入課程資料成功:', response.data)
    } catch (error) {
      console.error('載入課程資料失敗:', error)
      toast.error('載入課程資料失敗，請稍後再試')
    } finally {
      setLoading(false)
    }
  }

  const fetchTeachers = async () => {
    try {
      const response = await axios.get(API_ENDPOINTS.teachers)
      setTeachers(response.data)
    } catch (error) {
      console.error('載入教師列表失敗:', error)
    }
  }

  const courseTypeOptions = [
    { value: 'required', label: '必修' },
    { value: 'elective', label: '選修' },
    { value: 'general_required', label: '通識(必修)' },
    { value: 'general_elective', label: '通識(選修)' }
  ]

  const semesterOptions = [
    { value: '1', label: '上學期' },
    { value: '2', label: '下學期' }
  ]

  const departmentOptions = [
    { value: '資管系', label: '資訊管理系' },
    { value: '健管系', label: '健康事業管理系' }
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

  const handleTeacherModeToggle = () => {
    setFormData(prev => ({
      ...prev,
      use_new_teacher: !prev.use_new_teacher,
      teacher_id: '',
      teacher_name: ''
    }))
  }

  // 處理協同教師選擇
  const handleCoTeacherToggle = (teacherId) => {
    setFormData(prev => {
      const co_teachers = prev.co_teachers || []
      if (co_teachers.includes(teacherId)) {
        // 移除
        return {
          ...prev,
          co_teachers: co_teachers.filter(id => id !== teacherId)
        }
      } else {
        // 新增
        return {
          ...prev,
          co_teachers: [...co_teachers, teacherId]
        }
      }
    })
  }

  const validateForm = () => {
    if (!formData.course_code.trim()) {
      toast.error('請輸入課程代碼')
      return false
    }
    if (!formData.course_name.trim()) {
      toast.error('請輸入課程名稱')
      return false
    }
    // 修改教師驗證邏輯
    if (!formData.use_new_teacher && !formData.teacher_id) {
      toast.error('請選擇主開課教師')
      return false
    }
    if (formData.use_new_teacher && !formData.teacher_name.trim()) {
      toast.error('請輸入新教師姓名')
      return false
    }
    if (!formData.classroom.trim()) {
      toast.error('請輸入教室')
      return false
    }
    if (parseInt(formData.start_period) > parseInt(formData.end_period)) {
      toast.error('開始節次不能大於結束節次')
      return false
    }
    // 檢查主開課教師不能同時是協同教師（只在使用現有教師時檢查）
    if (!formData.use_new_teacher && formData.co_teachers && formData.co_teachers.includes(parseInt(formData.teacher_id))) {
      toast.error('主開課教師不能同時是協同教師')
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
        teacher_id: formData.use_new_teacher ? null : parseInt(formData.teacher_id),
        teacher_name: formData.use_new_teacher ? formData.teacher_name.trim() : null,
        co_teachers: (formData.co_teachers || []).map(id => parseInt(id))
      }

      if (isEditMode && editingCourseId) {
        // 更新模式
        await axios.put(API_ENDPOINTS.courseUpdate(editingCourseId), submitData)
        toast.success('課程更新成功!')
      } else {
        // 新增模式
        await axios.post(API_ENDPOINTS.coursesCreate, submitData)
        toast.success('課程建立成功!')
      }

      // 呼叫完成回調
      if (onSaveComplete) {
        onSaveComplete()
      } else {
        resetForm()
      }
    } catch (err) {
      console.error('儲存課程錯誤:', err)
      if (err.response?.data?.error) {
        toast.error(`${isEditMode ? '更新' : '建立'}失敗：${err.response.data.error}`)
      } else {
        toast.error(`${isEditMode ? '更新' : '建立'}失敗，請稍後再試`)
      }
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setFormData({
      course_code: '',
      course_name: '',
      course_type: 'required',
      description: '',
      credits: '2',
      hours: '2',
      academic_year: '114',
      semester: '1',
      department: '資管系',
      grade_level: '1',
      teacher_id: '',
      teacher_name: '',
      use_new_teacher: false,
      co_teachers: [],
      classroom: '',
      weekday: '1',
      start_period: '1',
      end_period: '2',
      max_students: '50'
    })
  }

  const handleReset = () => {
    if (confirm('確定要清空表單嗎？')) {
      resetForm()
    }
  }

  const handleCancel = () => {
    if (confirm('確定要取消編輯嗎？未儲存的變更將會遺失。')) {
      if (onSaveComplete) {
        onSaveComplete()
      } else {
        resetForm()
        setIsEditMode(false)
      }
    }
  }

  // 課別名稱對應到課程類型
  const mapCourseType = (courseCategoryName) => {
    const name = String(courseCategoryName).trim()

    if (name.includes('通識必修')) {
      return 'general_required'
    }
    if (name.includes('通識選修')) {
      return 'general_elective'
    }
    if (name.includes('專業必修') || name.includes('必修')) {
      return 'required'
    }
    if (name.includes('專業選修') || name.includes('選修')) {
      return 'elective'
    }
    if (name.includes('通識')) {
      return 'general_elective'
    }

    return 'elective'
  }

  // 星期文字對應到數字
  const mapWeekday = (weekdayText) => {
    const weekdayMap = {
      '1': '1', '一': '1', '星期一': '1',
      '2': '2', '二': '2', '星期二': '2',
      '3': '3', '三': '3', '星期三': '3',
      '4': '4', '四': '4', '星期四': '4',
      '5': '5', '五': '5', '星期五': '5',
      '6': '6', '六': '6', '星期六': '6',
      '7': '7', '日': '7', '星期日': '7'
    }
    return weekdayMap[weekdayText] || '1'
  }

  // 解析節次
  const parsePeriods = (periodText) => {
    if (!periodText) return { start: 1, end: 1 }

    const text = String(periodText).trim()

    if (text.includes(',')) {
      const periods = text.split(',').map(p => parseInt(p.trim())).filter(p => !isNaN(p))
      if (periods.length > 0) {
        return { start: Math.min(...periods), end: Math.max(...periods) }
      }
    }

    if (text.includes('-')) {
      const periods = text.split('-').map(p => parseInt(p.trim())).filter(p => !isNaN(p))
      if (periods.length === 2) {
        return { start: periods[0], end: periods[1] }
      }
    }

    const period = parseInt(text)
    if (!isNaN(period)) {
      return { start: period, end: period }
    }

    return { start: 1, end: 1 }
  }

  // 解析教師名稱（支援頓號分隔）
  const parseTeachers = (teacherText) => {
    if (!teacherText) return []

    // 使用頓號、逗號或分號分割
    const names = teacherText.split(/[、,;]/).map(n => n.trim()).filter(n => n)
    return names
  }

  // 處理 XLSX 檔案匯入
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

      console.log('原始資料:', rawData)
      console.log('總列數:', rawData.length)

      // 判斷檔案格式
      let dataStartRow = 0
      let hasOpeningDeptColumn = false

      // 找到第一行非空的資料（標題行）
      let headerRow = null
      let headerRowIndex = -1

      for (let i = 0; i < Math.min(10, rawData.length); i++) {
        const row = rawData[i]
        if (row && row.some(cell =>
          String(cell).includes('學期') ||
          String(cell).includes('科目中文名稱') ||
          String(cell).includes('授課教師姓名')
        )) {
          headerRow = row
          headerRowIndex = i
          console.log(`偵測到標題在第 ${i + 1} 列`)
          break
        }
      }

      if (headerRow) {
        dataStartRow = headerRowIndex + 1  // 資料從標題的下一行開始

        // 檢查是否有「開課系所」欄位
        if (headerRow.some(cell => String(cell).includes('開課系所'))) {
          hasOpeningDeptColumn = true
          console.log('偵測到有「開課系所」欄位（16 欄格式）')
        } else if (headerRow.length > 20) {
          console.log('偵測到大型檔案格式（31 欄格式）')
        } else {
          console.log('偵測到 15 欄格式')
        }
      } else {
        // 沒找到標題，假設第一行就是資料
        dataStartRow = 0
        console.log('未偵測到標題行，假設第 1 列開始就是資料')
      }

      const dataRows = rawData.slice(dataStartRow)

      console.log(`資料從第 ${dataStartRow + 1} 列開始，共 ${dataRows.length} 筆`)
      console.log(`是否有開課系所欄位: ${hasOpeningDeptColumn}`)

      const results = {
        total: dataRows.length,
        success: 0,
        failed: 0,
        errors: []
      }

      // 逐筆處理課程資料
      for (let i = 0; i < dataRows.length; i++) {
        const row = dataRows[i]

        if (!row || row.length === 0 || !row[0]) {
          continue
        }

        try {
          let semester, courseCode, courseName, teacherText, maxStudents
          let credits, hoursPerWeek, courseCategoryName, classroom
          let weekdayText, periodText, description, gradeLevel, openingDept

          if (dataStartRow === 5 && hasOpeningDeptColumn) {
            // 16 欄格式
            semester = String(row[0] || '').trim()
            openingDept = String(row[2] || '').trim()
            courseCode = String(row[3] || '').trim()
            gradeLevel = parseInt(row[4]) || 1
            courseName = String(row[5] || '').trim()
            teacherText = String(row[6] || '').trim()  // 可能包含多位教師
            maxStudents = parseInt(row[7]) || 50
            credits = parseInt(row[8]) || 2
            hoursPerWeek = parseFloat(row[10]) || 2
            courseCategoryName = String(row[11] || '').trim()
            classroom = String(row[12] || '').trim()
            weekdayText = String(row[13] || '').trim()
            periodText = String(row[14] || '').trim()
            description = String(row[15] || '').trim()
          } else if (dataStartRow === 5 && !hasOpeningDeptColumn && row.length > 20) {
            // 31 欄格式
            semester = String(row[1] || '').trim()
            courseCode = String(row[5] || '').trim()
            gradeLevel = parseInt(row[7]) || 1
            courseName = String(row[9] || '').trim()
            teacherText = String(row[11] || '').trim()  // 可能包含多位教師
            maxStudents = parseInt(row[12]) || 50
            credits = parseInt(row[15]) || 2
            hoursPerWeek = parseFloat(row[17]) || 2
            courseCategoryName = String(row[19] || '').trim()
            classroom = String(row[20] || '').trim()
            weekdayText = String(row[21] || '').trim()
            periodText = String(row[22] || '').trim()
            description = String(row[24] || '').trim()
          } else {
            // 15 欄格式
            semester = String(row[0] || '').trim()
            courseCode = String(row[2] || '').trim()
            gradeLevel = parseInt(row[3]) || 1
            courseName = String(row[4] || '').trim()
            teacherText = String(row[5] || '').trim()  // 可能包含多位教師
            maxStudents = parseInt(row[6]) || 50
            credits = parseInt(row[7]) || 2
            hoursPerWeek = parseFloat(row[9]) || 2
            courseCategoryName = String(row[10] || '').trim()
            classroom = String(row[11] || '').trim()
            weekdayText = String(row[12] || '').trim()
            periodText = String(row[13] || '').trim()
            description = String(row[14] || '').trim()
          }

          const academicYear = semester.substring(0, 3)
          const semesterNum = semester.substring(3, 4)

          // 資料驗證
          if (!courseCode) {
            results.errors.push(`第 ${i + 2} 列：缺少課程代碼`)
            results.failed++
            continue
          }

          if (!courseName) {
            results.errors.push(`第 ${i + 2} 列：缺少課程名稱`)
            results.failed++
            continue
          }

          if (!teacherText) {
            results.errors.push(`第 ${i + 2} 列：缺少教師姓名`)
            results.failed++
            continue
          }

          // 解析教師名稱（支援多位教師，用頓號分隔）
          const teacherNames = parseTeachers(teacherText)
          console.log(`處理第 ${i + 2} 列，教師: ${teacherNames.join('、')}`)

          if (teacherNames.length === 0) {
            results.errors.push(`第 ${i + 2} 列：無法解析教師姓名`)
            results.failed++
            continue
          }

          // 找到所有教師（如果不存在則創建）
          const foundTeachers = []
          const createdTeachers = [] // 記錄新創建的教師

          for (const name of teacherNames) {
            let teacher = teachers.find(t => t.real_name === name)
            if (teacher) {
              foundTeachers.push(teacher)
            } else {
              // 教師不存在，自動創建
              console.log(`自動創建教師: ${name}`)
              try {
                // 生成臨時教師物件（實際創建會在後端完成）
                const newTeacher = {
                  id: `new_${name}`, // 臨時 ID
                  real_name: name,
                  username: `teacher_${name}`,
                  is_new: true // 標記為新教師
                }
                foundTeachers.push(newTeacher)
                createdTeachers.push(name)

                // 也加入 teachers 列表，避免同一個 Excel 中重複創建
                teachers.push(newTeacher)
              } catch (err) {
                results.errors.push(`第 ${i + 2} 列：無法創建教師「${name}」: ${err.message}`)
                results.failed++
                continue
              }
            }
          }

          if (createdTeachers.length > 0) {
            console.log(`第 ${i + 2} 列：自動創建教師 ${createdTeachers.join('、')}`)
          }

          if (foundTeachers.length === 0) {
            results.errors.push(`第 ${i + 2} 列：找不到任何有效教師`)
            results.failed++
            continue
          }

          // 第一位教師為主開課，其餘為協同
          const mainTeacher = foundTeachers[0]

          // 分離協同教師：現有的和新建的
          const coTeacherIds = []
          const coTeacherNames = []

          for (const teacher of foundTeachers.slice(1)) {
            if (teacher.is_new) {
              coTeacherNames.push(teacher.real_name)
            } else {
              coTeacherIds.push(teacher.id)
            }
          }

          console.log(`主開課: ${mainTeacher.real_name}${mainTeacher.is_new ? '(新建)' : ''}, 協同: ${coTeacherIds.length + coTeacherNames.length} 位`)


          // 解析星期和節次
          const weekday = mapWeekday(weekdayText)
          const periods = parsePeriods(periodText)

          // 決定課程系所
          let department = importDepartment

          if (openingDept) {
            department = openingDept
            console.log(`使用 Excel 中的系所: ${department}`)
          } else {
            console.log(`使用選擇的系所: ${department}`)
          }

          // 建立課程資料
          const courseData = {
            course_code: courseCode,
            course_name: courseName,
            course_type: mapCourseType(courseCategoryName),
            description: description,
            credits: credits,
            hours: Math.ceil(hoursPerWeek),
            academic_year: academicYear,
            semester: semesterNum,
            department: department,
            grade_level: gradeLevel,
            // 主教師
            teacher_id: mainTeacher.is_new ? null : mainTeacher.id,
            teacher_name: mainTeacher.is_new ? mainTeacher.real_name : null,
            // 協同教師：分別傳 ID 和姓名
            co_teachers: coTeacherIds,
            co_teacher_names: coTeacherNames,
            classroom: classroom,
            weekday: weekday,
            start_period: periods.start,
            end_period: periods.end,
            max_students: maxStudents
          }

          console.log(`準備建立課程: ${courseName}${mainTeacher.is_new ? ' (將創建新教師: ' + mainTeacher.real_name + ')' : ''}`)

          // 送出到後端
          await axios.post(API_ENDPOINTS.coursesCreate, courseData)
          results.success++
          console.log(`成功建立課程: ${courseName}`)

        } catch (error) {
          console.error(`第 ${i + 2} 列錯誤:`, error)
          results.failed++
          const errorMsg = error.response?.data?.error || error.message
          results.errors.push(`第 ${i + 2} 列（${row[4] || row[5] || '未知課程'}）：${errorMsg}`)
        }
      }

      setImportResults(results)

      if (results.success > 0) {
        toast.success(`匯入完成！成功：${results.success} 筆，失敗：${results.failed} 筆`)
      } else {
        toast.error(`匯入失敗：所有 ${results.failed} 筆資料都未能成功匯入`)
      }

      if (results.success > 0) {
        fetchTeachers()
      }

    } catch (error) {
      console.error('檔案處理錯誤:', error)
      toast.error('檔案處理失敗，請確認檔案格式是否正確: ' + error.message)
    } finally {
      setImportLoading(false)
      e.target.value = ''
    }
  }

  // 取得協同教師的名稱列表
  const getCoTeacherNames = () => {
    if (!formData.co_teachers || formData.co_teachers.length === 0) {
      return '無'
    }
    return formData.co_teachers
      .map(id => {
        const teacher = teachers.find(t => t.id === parseInt(id))
        return teacher ? teacher.real_name : `未知(${id})`
      })
      .join('、')
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      <div className="bg-white rounded-lg shadow-md p-8">
        <div className="flex justify-between items-center mb-6 border-b pb-3">
          <h2 className="text-2xl font-bold text-gray-800">
            {isEditMode ? '修改課程' : '新增課程'}
          </h2>
          {isEditMode && (
            <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-medium">
              編輯模式
            </span>
          )}
        </div>

        {/* Excel 匯入區域 */}
        <div className="mb-8 p-6 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg border-2 border-dashed border-green-300">
          <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
            <svg className="w-6 h-6 mr-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            批次匯入課程（Excel）
          </h3>

          {/* Drag and Drop Zone */}
          <div
            className={`mb-4 p-8 border-2 border-dashed rounded-xl transition-all text-center cursor-pointer
              ${importLoading ? 'bg-gray-100 border-gray-300 cursor-not-allowed' : 'hover:bg-green-50 hover:border-green-400'}
              ${'border-green-300 bg-green-50/50'}
            `}
            onDragOver={(e) => {
              e.preventDefault()
              e.stopPropagation()
              e.currentTarget.classList.add('border-green-500', 'bg-green-100')
            }}
            onDragLeave={(e) => {
              e.preventDefault()
              e.stopPropagation()
              e.currentTarget.classList.remove('border-green-500', 'bg-green-100')
            }}
            onDrop={(e) => {
              e.preventDefault()
              e.stopPropagation()
              e.currentTarget.classList.remove('border-green-500', 'bg-green-100')

              if (importLoading) return

              const files = e.dataTransfer.files
              if (files && files.length > 0) {
                const file = files[0] // Only take the first file
                // Manually trigger handleFileImport with a mock event
                handleFileImport({ target: { files: [file] } })
              }
            }}
            onClick={() => !importLoading && document.getElementById('excel-upload-input').click()}
          >
            <div className="flex flex-col items-center justify-center space-y-3">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
              </div>

              <div className="text-gray-700">
                <span className="font-bold text-lg">拖曳 Excel 檔案至此</span>
                <span className="mx-2 text-gray-400">|</span>
                <span className="text-green-600 hover:text-green-700 font-medium">點擊選擇檔案</span>
              </div>

              <p className="text-sm text-gray-500">
                支援 .xlsx, .xls 格式
              </p>
            </div>

            <input
              id="excel-upload-input"
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileImport}
              disabled={importLoading}
              className="hidden"
            />
          </div>

          {importLoading && (
            <div className="text-center text-green-600 font-medium mb-4 animate-pulse">
              正在處理檔案中，請稍候...
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

        {/* 手動新增表單 */}
        <form onSubmit={handleSubmit}>
          {/* 課程基本資訊 */}
          <div className="space-y-4 mb-6 bg-blue-50 p-4 rounded-lg">
            <h3 className="text-lg font-bold text-gray-700 border-b pb-2">課程基本資訊</h3>

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
                  placeholder="例如：計算機概論"
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
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="請輸入課程描述..."
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
                  placeholder="例如：114"
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

            {/* 主開課教師 */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  主開課教師 <span className="text-red-500">*</span>
                </label>
                <button
                  type="button"
                  onClick={handleTeacherModeToggle}
                  className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1 font-medium transition-colors"
                >
                  {formData.use_new_teacher ? (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      使用現有教師
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                      </svg>
                      新增教師
                    </>
                  )}
                </button>
              </div>

              {formData.use_new_teacher ? (
                // 輸入新教師姓名
                <div>
                  <input
                    type="text"
                    name="teacher_name"
                    value={formData.teacher_name}
                    onChange={handleChange}
                    placeholder="輸入教師姓名（例如：王小明）"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                  />
                  <div className="mt-2 text-xs text-gray-600 bg-blue-50 p-3 rounded-lg border border-blue-200">
                    <div className="flex items-start gap-2">
                      <svg className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <div>
                        <p className="font-medium text-blue-800">系統將自動創建教師帳號</p>
                        <p className="mt-1 text-blue-700">帳號格式：teacher_姓名_隨機編號</p>
                        <p className="mt-1 text-blue-700">密碼將隨機生成並顯示在後台日誌</p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                // 選擇現有教師
                <select
                  name="teacher_id"
                  value={formData.teacher_id}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                >
                  <option value="">請選擇主開課教師</option>
                  {teachers.map(teacher => (
                    <option key={teacher.id} value={teacher.id}>
                      {teacher.real_name} ({teacher.username})
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* 協同教師 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                協同教師（選填，可複選）
              </label>
              <div className="border border-gray-300 rounded-lg p-4 max-h-60 overflow-y-auto bg-white">
                {teachers.length === 0 ? (
                  <p className="text-gray-500 text-sm">沒有可用的教師</p>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    {teachers
                      .filter(t => String(t.id) !== String(formData.teacher_id)) // 排除主開課教師
                      .map(teacher => (
                        <label
                          key={teacher.id}
                          className="flex items-center p-2 hover:bg-gray-50 rounded cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={(formData.co_teachers || []).includes(teacher.id)}
                            onChange={() => handleCoTeacherToggle(teacher.id)}
                            className="mr-2 w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                          />
                          <span className="text-sm text-gray-700">
                            {teacher.real_name} ({teacher.username})
                          </span>
                        </label>
                      ))
                    }
                  </div>
                )}
              </div>
              {formData.co_teachers && formData.co_teachers.length > 0 && (
                <p className="mt-2 text-sm text-gray-600">
                  已選擇 {formData.co_teachers.length} 位協同教師：{getCoTeacherNames()}
                </p>
              )}
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
              {loading ? (isEditMode ? '更新中...' : '建立中...') : (isEditMode ? '更新課程' : '建立課程')}
            </button>
            {isEditMode ? (
              <button
                type="button"
                onClick={handleCancel}
                className="flex-1 bg-gray-500 hover:bg-gray-600 text-white py-3 px-6 rounded-lg font-bold text-lg transition-colors"
              >
                取消編輯
              </button>
            ) : (
              <button
                type="button"
                onClick={handleReset}
                className="flex-1 bg-gray-500 hover:bg-gray-600 text-white py-3 px-6 rounded-lg font-bold text-lg transition-colors"
              >
                清空表單
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  )
}