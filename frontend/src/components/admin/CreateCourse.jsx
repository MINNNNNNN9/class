import { useState, useEffect } from 'react'
import axios from 'axios'
import * as XLSX from 'xlsx'

export default function CreateCourse() {
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
    teacher_id: '',
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
  const [importDepartment, setImportDepartment] = useState('資管系') // 匯入時使用的系所

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

  // 課別名稱對應到課程類型
  const mapCourseType = (courseCategoryName) => {
    const name = String(courseCategoryName).trim()
    
    // 優先判斷通識類別（因為更具體）
    if (name.includes('通識必修')) {
      return 'general_required'
    }
    if (name.includes('通識選修')) {
      return 'general_elective'
    }
    
    // 再判斷專業類別
    if (name.includes('專業必修') || name.includes('必修')) {
      return 'required'
    }
    if (name.includes('專業選修') || name.includes('選修')) {
      return 'elective'
    }
    
    // 最後才是一般通識（向後相容）
    if (name.includes('通識')) {
      return 'general_elective' // 預設通識為選修
    }
    
    return 'elective' // 預設為選修
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

  // 解析節次（例如："6,7" 或 "6-7" 或 "6"）
  const parsePeriods = (periodText) => {
    if (!periodText) return { start: 1, end: 1 }
    
    const text = String(periodText).trim()
    
    // 處理逗號分隔（例如："6,7"）
    if (text.includes(',')) {
      const periods = text.split(',').map(p => parseInt(p.trim())).filter(p => !isNaN(p))
      if (periods.length > 0) {
        return { start: Math.min(...periods), end: Math.max(...periods) }
      }
    }
    
    // 處理破折號分隔（例如："6-7"）
    if (text.includes('-')) {
      const periods = text.split('-').map(p => parseInt(p.trim())).filter(p => !isNaN(p))
      if (periods.length === 2) {
        return { start: periods[0], end: periods[1] }
      }
    }
    
    // 單一節次
    const period = parseInt(text)
    if (!isNaN(period)) {
      return { start: period, end: period }
    }
    
    return { start: 1, end: 1 }
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
      
      // 使用 header: 1 來取得陣列格式
      const rawData = XLSX.utils.sheet_to_json(worksheet, { header: 1 })
      
      console.log('原始資料:', rawData)
      console.log('總列數:', rawData.length)
      
      // 判斷檔案格式：檢查第 5 列（索引 4）是否包含標題
      let dataStartRow = 1 // 預設從第 2 列開始（最簡單格式）
      let hasOpeningDeptColumn = false // 是否有「開課系所」欄位
      
      if (rawData.length > 4 && rawData[4]) {
        const fifthRow = rawData[4]
        // 如果第 5 列包含「學期」、「科目中文名稱」等標題文字，表示是新格式
        if (fifthRow.some(cell => 
          String(cell).includes('學期') || 
          String(cell).includes('科目中文名稱') || 
          String(cell).includes('授課教師姓名')
        )) {
          console.log('偵測到標題在第 5 列的格式')
          dataStartRow = 5 // 資料從第 6 列開始（索引 5）
          
          // 檢查是否有「開課系所」欄位
          if (fifthRow.some(cell => String(cell).includes('開課系所'))) {
            hasOpeningDeptColumn = true
            console.log('偵測到有「開課系所」欄位（16 欄格式）')
          } else if (sheet.ncols > 20) {
            console.log('偵測到大型檔案格式（31 欄格式）')
          }
        }
      }
      
      // 跳過標題列
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
        
        // 跳過空白列
        if (!row || row.length === 0 || !row[0]) {
          continue
        }
        
        try {
          // 判斷是哪種格式
          let semester, courseCode, courseName, teacherName, maxStudents
          let credits, hoursPerWeek, courseCategoryName, classroom
          let weekdayText, periodText, description, gradeLevel, openingDept
          
          if (dataStartRow === 5 && hasOpeningDeptColumn) {
            // 格式：16 欄，有「開課系所」欄位
            // 0: 學期, 1: 主開課教師姓名, 2: 開課系所, 3: 核心四碼, 4: 年級
            // 5: 科目中文名稱, 6: 授課教師姓名, 7: 上課人數, 8: 學分數
            // 9: 上課週次, 10: 上課時數/週, 11: 課別名稱, 12: 上課地點
            // 13: 上課星期, 14: 上課節次, 15: 課程中文摘要
            
            semester = String(row[0] || '').trim()
            openingDept = String(row[2] || '').trim()
            courseCode = String(row[3] || '').trim()
            gradeLevel = parseInt(row[4]) || 1
            courseName = String(row[5] || '').trim()
            teacherName = String(row[6] || '').trim()  // 正確位置！
            maxStudents = parseInt(row[7]) || 50
            credits = parseInt(row[8]) || 2
            hoursPerWeek = parseFloat(row[10]) || 2
            courseCategoryName = String(row[11] || '').trim()
            classroom = String(row[12] || '').trim()
            weekdayText = String(row[13] || '').trim()
            periodText = String(row[14] || '').trim()
            description = String(row[15] || '').trim()
          } else if (dataStartRow === 5 && !hasOpeningDeptColumn && row.length > 20) {
            // 格式：31 欄，沒有「開課系所」欄位（大型檔案）
            // 1: 學期, 5: 核心四碼, 7: 年級, 9: 科目中文名稱, 11: 授課教師姓名
            // 12: 上課人數, 15: 學分數, 17: 上課時數/週, 19: 課別名稱
            // 20: 上課地點, 21: 上課星期, 22: 上課節次, 24: 課程中文摘要
            
            semester = String(row[1] || '').trim()
            courseCode = String(row[5] || '').trim()
            gradeLevel = parseInt(row[7]) || 1
            courseName = String(row[9] || '').trim()
            teacherName = String(row[11] || '').trim()
            maxStudents = parseInt(row[12]) || 50
            credits = parseInt(row[15]) || 2
            hoursPerWeek = parseFloat(row[17]) || 2
            courseCategoryName = String(row[19] || '').trim()
            classroom = String(row[20] || '').trim()
            weekdayText = String(row[21] || '').trim()
            periodText = String(row[22] || '').trim()
            description = String(row[24] || '').trim()
          } else {
            // 格式：15 欄，最簡單格式（沒有開課系所）
            // 0: 學期, 2: 核心四碼, 3: 年級, 4: 科目中文名稱, 5: 授課教師姓名
            // 6: 上課人數, 7: 學分數, 9: 上課時數/週, 10: 課別名稱
            // 11: 上課地點, 12: 上課星期, 13: 上課節次, 14: 課程中文摘要
            
            semester = String(row[0] || '').trim()
            courseCode = String(row[2] || '').trim()
            gradeLevel = parseInt(row[3]) || 1
            courseName = String(row[4] || '').trim()
            teacherName = String(row[5] || '').trim()
            maxStudents = parseInt(row[6]) || 50
            credits = parseInt(row[7]) || 2
            hoursPerWeek = parseFloat(row[9]) || 2
            courseCategoryName = String(row[10] || '').trim()
            classroom = String(row[11] || '').trim()
            weekdayText = String(row[12] || '').trim()
            periodText = String(row[13] || '').trim()
            description = String(row[14] || '').trim()
          }
          
          const academicYear = semester.substring(0, 3) // 例如 "1141" -> "114"
          const semesterNum = semester.substring(3, 4) // 例如 "1141" -> "1"

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
          
          if (!teacherName) {
            results.errors.push(`第 ${i + 2} 列：缺少教師姓名`)
            results.failed++
            continue
          }

          console.log(`處理第 ${i + 2} 列，教師姓名: "${teacherName}"`)

          // 找到對應的教師
          const teacher = teachers.find(t => t.real_name === teacherName)
          if (!teacher) {
            results.errors.push(`第 ${i + 2} 列：找不到教師「${teacherName}」，請先建立該教師帳號`)
            results.failed++
            continue
          }

          // 解析星期和節次
          const weekday = mapWeekday(weekdayText)
          const periods = parsePeriods(periodText)

          // 決定課程系所：優先使用 Excel 中的系所，否則使用選擇的系所
          let department = importDepartment // 預設使用選擇的系所
          
          if (openingDept) {
            // 如果 Excel 有「開課系所」欄位，使用該值
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
            teacher_id: teacher.id,
            classroom: classroom,
            weekday: weekday,
            start_period: periods.start,
            end_period: periods.end,
            max_students: maxStudents
          }

          console.log(`準備建立課程: ${courseName}`)

          // 送出到後端
          await axios.post('http://localhost:8000/api/courses/create/', courseData)
          results.success++
          console.log(`成功建立課程: ${courseName}`)

        } catch (error) {
          console.error(`第 ${i + 2} 列錯誤:`, error)
          results.failed++
          const errorMsg = error.response?.data?.error || error.message
          results.errors.push(`第 ${i + 2} 列（${row[4] || '未知課程'}）：${errorMsg}`)
        }
      }

      setImportResults(results)
      
      if (results.success > 0) {
        alert(`匯入完成！\n成功：${results.success} 筆\n失敗：${results.failed} 筆${results.failed > 0 ? '\n\n請查看下方錯誤訊息' : ''}`)
      } else {
        alert(`匯入失敗！所有 ${results.failed} 筆資料都未能成功匯入\n\n請查看下方錯誤訊息`)
      }

      // 重新整理教師列表（以防有新增）
      if (results.success > 0) {
        fetchTeachers()
      }

    } catch (error) {
      console.error('檔案處理錯誤:', error)
      alert('檔案處理失敗，請確認檔案格式是否正確\n\n錯誤訊息：' + error.message)
    } finally {
      setImportLoading(false)
      e.target.value = '' // 清空 input，允許重複選擇同一檔案
    }
  }

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
        
        {/* XLSX 匯入區塊 */}
        <div className="mb-8 bg-gradient-to-r from-indigo-50 to-purple-50 p-6 rounded-lg border-2 border-indigo-200">
          <h3 className="text-lg font-bold text-gray-700 mb-3 flex items-center">
            <svg className="w-6 h-6 mr-2 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            批次匯入課程（XLSX）
          </h3>
          
          <div className="mb-4 text-sm text-gray-600 bg-white p-3 rounded border border-gray-200">
            <p className="font-semibold mb-2">📋 檔案格式說明：</p>
            <p className="mb-1">欄位順序：學期、主開課教師姓名、核心四碼、年級、科目中文名稱、授課教師姓名、上課人數、學分數、上課週次、上課時數/週、課別名稱、上課地點、上課星期、上課節次、課程中文摘要</p>
            <p className="text-xs text-gray-500 mt-2">範例：1141, 蘇美禎, 1041, 1, 性別與健康照護, 蘇美禎, 49, 2, 全18週, 2.00, 專業選修(系所), F412, 5, 6,7, 本課程以性別...</p>
          </div>

          {/* 系所選擇 */}
          <div className="mb-4">
            <label className="block text-sm font-bold text-gray-700 mb-2">
              預設系所（當 Excel 沒有系所欄位時使用）
            </label>
            <select
              value={importDepartment}
              onChange={(e) => setImportDepartment(e.target.value)}
              className="w-full px-4 py-2.5 border-2 border-indigo-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white"
              disabled={importLoading}
            >
              {departmentOptions.map(dept => (
                <option key={dept.value} value={dept.value}>
                  {dept.label}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">
              💡 如果 Excel 有「開課系所」欄位，會優先使用 Excel 中的系所
            </p>
          </div>

          <div className="flex items-center gap-4">
            <label className="flex-1">
              <input
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileImport}
                disabled={importLoading}
                className="hidden"
                id="xlsx-upload"
              />
              <div className="flex items-center justify-center px-6 py-3 bg-indigo-600 text-white rounded-lg font-medium cursor-pointer hover:bg-indigo-700 transition-colors disabled:bg-gray-400">
                {importLoading ? (
                  <>
                    <svg className="animate-spin h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    匯入中...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    選擇 XLSX 檔案匯入
                  </>
                )}
              </div>
            </label>
          </div>

          {/* 匯入結果顯示 */}
          {importResults && (
            <div className="mt-4 p-4 bg-white rounded-lg border border-gray-200">
              <h4 className="font-bold text-gray-700 mb-2">匯入結果：</h4>
              <div className="space-y-1 text-sm">
                <p>總筆數：<span className="font-semibold">{importResults.total}</span></p>
                <p className="text-green-600">成功：<span className="font-semibold">{importResults.success}</span> 筆</p>
                <p className="text-red-600">失敗：<span className="font-semibold">{importResults.failed}</span> 筆</p>
              </div>
              
              {importResults.errors.length > 0 && (
                <div className="mt-3 max-h-40 overflow-y-auto">
                  <p className="font-semibold text-red-600 mb-1">錯誤訊息：</p>
                  <ul className="text-xs text-red-500 space-y-1">
                    {importResults.errors.map((error, idx) => (
                      <li key={idx}>• {error}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="mb-6 border-t-2 border-gray-200 pt-6">
          <h3 className="text-lg font-bold text-gray-700 mb-4">或手動新增單一課程</h3>
        </div>

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