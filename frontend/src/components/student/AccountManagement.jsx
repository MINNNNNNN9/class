import { useState, useEffect } from 'react'
import axios from 'axios'
import { API_ENDPOINTS } from '../../config/api'

export default function AccountManagement() {
  const [userInfo, setUserInfo] = useState(null)
  const [creditSummary, setCreditSummary] = useState(null)
  const [loading, setLoading] = useState(true)

  // 學分要求
  const requirements = {
    general: 28,
    required: 65,
    elective: 35,
    total: 128
  }

  // 從後端獲取資料
  useEffect(() => {
    fetchUserData()
  }, [])

  const fetchUserData = async () => {
    try {
      setLoading(true)
      const response = await axios.get(API_ENDPOINTS.creditSummary, {
        withCredentials: true  // ← 重要：允許傳送 cookie
      })
      
      const data = response.data
      
      setUserInfo(data.user_info)
      setCreditSummary({
        total: data.total_credits,
        semester: data.semester_credits,
      })
      
      setLoading(false)
    } catch (error) {
      console.error('獲取學分資料失敗', error)
      setLoading(false)
    }
  }

  // 計算進度百分比
  const getProgress = (current, total) => {
    return Math.min((current / total) * 100, 100)
  }

  // 單行進度條組件（總學分用）
  const SingleLineProgressBar = ({ data, requirements }) => {
    const generalProgress = getProgress(data.general, requirements.general)
    const electiveProgress = getProgress(data.elective, requirements.elective)
    const requiredProgress = getProgress(data.required, requirements.required)
    
    // 計算每個區塊的寬度百分比
    const generalWidth = (requirements.general / requirements.total) * 100
    const electiveWidth = (requirements.elective / requirements.total) * 100
    const requiredWidth = (requirements.required / requirements.total) * 100
    
    return (
      <div>
        {/* 標籤和數字 */}
        <div className="flex justify-between items-center mb-3">
          <div className="flex gap-6">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-blue-500"></div>
              <span className="text-sm font-medium text-gray-700">通識學分</span>
              <span className="text-lg font-bold text-gray-800">{data.general}/{requirements.general}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-green-500"></div>
              <span className="text-sm font-medium text-gray-700">選修學分</span>
              <span className="text-lg font-bold text-gray-800">{data.elective}/{requirements.elective}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-purple-500"></div>
              <span className="text-sm font-medium text-gray-700">必修學分</span>
              <span className="text-lg font-bold text-gray-800">{data.required}/{requirements.required}</span>
            </div>
          </div>
          <div className="text-2xl font-bold text-gray-800">
            {data.all}/{requirements.total}
          </div>
        </div>
        
        {/* 單行進度條 */}
        <div className="relative w-full h-12 bg-gray-200 rounded-full overflow-hidden flex">
          {/* 通識學分區塊 */}
          <div 
            className="relative h-full"
            style={{ width: `${generalWidth}%` }}
          >
            <div 
              className="h-full bg-gradient-to-r from-blue-400 to-blue-600 transition-all duration-500"
              style={{ width: `${generalProgress}%` }}
            >
              {generalProgress > 10 && (
                <div className="absolute right-2 top-1/2 transform -translate-y-1/2 text-white font-bold">▶</div>
              )}
            </div>
          </div>
          
          {/* 選修學分區塊 */}
          <div 
            className="relative h-full"
            style={{ width: `${electiveWidth}%` }}
          >
            <div 
              className="h-full bg-gradient-to-r from-green-400 to-green-600 transition-all duration-500"
              style={{ width: `${electiveProgress}%` }}
            >
              {electiveProgress > 10 && (
                <div className="absolute right-2 top-1/2 transform -translate-y-1/2 text-white font-bold">▶</div>
              )}
            </div>
          </div>
          
          {/* 必修學分區塊 */}
          <div 
            className="relative h-full"
            style={{ width: `${requiredWidth}%` }}
          >
            <div 
              className="h-full bg-gradient-to-r from-purple-400 to-purple-600 transition-all duration-500"
              style={{ width: `${requiredProgress}%` }}
            >
              {requiredProgress > 10 && (
                <div className="absolute right-2 top-1/2 transform -translate-y-1/2 text-white font-bold">▶</div>
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }

  // 本學期學分顯示（只顯示數字）
  const SemesterCredits = ({ data }) => {
    return (
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-blue-50 rounded-xl p-4 text-center border-2 border-blue-200">
          <div className="text-sm text-gray-600 mb-1">通識學分</div>
          <div className="text-3xl font-bold text-blue-600">{data.general}</div>
        </div>
        <div className="bg-green-50 rounded-xl p-4 text-center border-2 border-green-200">
          <div className="text-sm text-gray-600 mb-1">選修學分</div>
          <div className="text-3xl font-bold text-green-600">{data.elective}</div>
        </div>
        <div className="bg-purple-50 rounded-xl p-4 text-center border-2 border-purple-200">
          <div className="text-sm text-gray-600 mb-1">必修學分</div>
          <div className="text-3xl font-bold text-purple-600">{data.required}</div>
        </div>
        <div className="bg-orange-50 rounded-xl p-4 text-center border-2 border-orange-200">
          <div className="text-sm text-gray-600 mb-1">總學分</div>
          <div className="text-3xl font-bold text-orange-600">{data.all}</div>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-2xl text-gray-600">載入中...</div>
      </div>
    )
  }

  if (!userInfo || !creditSummary) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-2xl text-red-600">無法載入資料</div>
      </div>
    )
  }

  return (
    <div className="bg-gradient-to-br from-green-50 to-blue-50 min-h-screen">
      {/* 主容器 - 貼合導覽列 */}
      <div className="max-w-7xl mx-auto bg-white shadow-2xl">
        
        {/* 頂部裝飾條 */}
        <div className=""></div>
        
        <div className="flex flex-col lg:flex-row">
          
          {/* 左側：個人資訊 */}
          <div className="lg:w-1/3 bg-gradient-to-br from-orange-50 to-yellow-50 p-8 border-r-4 border-orange-200">
            
            {/* 頭像 */}
            <div className="flex justify-center mb-6">
              <div className="w-48 h-48 bg-gray-100 rounded-3xl flex items-center justify-center shadow-lg">
                <span className="text-8xl">🦦</span>
              </div>
            </div>
            
            {/* 個人資訊卡片 */}
            <div className="space-y-4">
              <div className="bg-white rounded-xl p-5 shadow-md">
                <div className="text-sm text-gray-500 mb-1">姓名</div>
                <div className="text-2xl font-bold text-gray-800">{userInfo.real_name}</div>
              </div>
              
              <div className="bg-white rounded-xl p-5 shadow-md">
                <div className="text-sm text-gray-500 mb-1">學號</div>
                <div className="text-2xl font-bold text-gray-800">{userInfo.student_id}</div>
              </div>
              
              <div className="bg-white rounded-xl p-5 shadow-md">
                <div className="text-sm text-gray-500 mb-1">系所</div>
                <div className="text-2xl font-bold text-gray-800">{userInfo.department}</div>
              </div>
              
              <div className="bg-white rounded-xl p-5 shadow-md">
                <div className="text-sm text-gray-500 mb-1">年級</div>
                <div className="text-2xl font-bold text-gray-800">{userInfo.grade}</div>
              </div>
            </div>
          </div>
          
          {/* 右側：學分資訊 */}
          <div className="lg:w-2/3 p-8">
            
            {/* 總學分 */}
            <div className="mb-12">
              <h2 className="text-3xl font-bold text-gray-800 mb-6 flex items-center">
                <span className="text-4xl mr-3">📊</span>
                總學分
              </h2>
              
              <SingleLineProgressBar 
                data={creditSummary.total}
                requirements={requirements}
              />
            </div>
            
            {/* 本學期 */}
            <div>
              <h2 className="text-3xl font-bold text-gray-800 mb-6 flex items-center">
                <span className="text-4xl mr-3">📅</span>
                本學期
              </h2>
              
              <SemesterCredits data={creditSummary.semester} />
            </div>
            
          </div>
        </div>
      </div>
    </div>
  )
}