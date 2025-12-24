// src/config/api.js
import axios from 'axios'

// 從環境變量獲取 API URL
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'
const baseURL = API_BASE_URL.endsWith('/') ? API_BASE_URL.slice(0, -1) : API_BASE_URL

export default baseURL

// ===== 1. CSRF Token 存取工具 (解決匯出錯誤) =====

/**
 * 儲存 Token 到 localStorage
 */
export const setStoredCsrfToken = (token) => {
  if (token) {
    localStorage.setItem('csrftoken', token)
    console.log('✅ CSRF token 已儲存到 localStorage')
  }
}

/**
 * 清除 localStorage 中的 Token
 */
export const clearStoredCsrfToken = () => {
  localStorage.removeItem('csrftoken')
  console.log('🗑️ CSRF token 已清除')
}

/**
 * 獲取最新的 CSRF Token (優先從 localStorage，次之從 Cookie)
 */
export const getStoredCsrfToken = () => {
  // 1. 優先讀取 localStorage (解決跨網域 Cookie 被阻擋問題)
  const storedToken = localStorage.getItem('csrftoken')
  if (storedToken) return storedToken

  // 2. 備用：讀取 Cookie
  const name = 'csrftoken'
  const cookies = document.cookie.split(';')
  for (let cookie of cookies) {
    const [key, value] = cookie.trim().split('=')
    if (key === name) return decodeURIComponent(value)
  }
  return null
}

// ===== 2. 創建配置好的 axios 實例 =====
export const apiClient = axios.create({
  baseURL: baseURL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  }
})

// ===== 3. 請求攔截器：自動添加 CSRF token =====
apiClient.interceptors.request.use(
  (config) => {
    // 使用我們定義的工具函數獲取 Token
    const csrfToken = getStoredCsrfToken()
    if (csrfToken) {
      config.headers['X-CSRFToken'] = csrfToken
    }
    return config
  },
  (error) => Promise.reject(error)
)

// ===== 4. 響應攔截器：處理錯誤 =====
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 403) {
      console.error('CSRF 驗證失敗，請檢查是否已登入')
    } else if (error.response?.status === 401) {
      console.error('未授權，請重新登入')
    }
    return Promise.reject(error)
  }
)

// ===== 5. API 端點定義 =====
export const API_ENDPOINTS = { // 認證相關
  login: `${baseURL}/login/`,
  logout: `${baseURL}/logout/`,
  register: `${baseURL}/register/`,
  changePassword: `${baseURL}/change-password/`,

  // 課程相關
  courses: `${baseURL}/courses/`,
  searchCourses: `${baseURL}/courses/search/`,
  coursesCreate: `${baseURL}/courses/create/`, // 新增課程
  addCourse: `${baseURL}/courses/create/`, // 修正：統一指向 create
  semesterCourses: `${baseURL}/courses/semester/`,
  myCourses: `${baseURL}/courses/my/`,
  myTeachingCourses: `${baseURL}/courses/my-teaching/`, // 教師授課列表
  historyCourses: `${baseURL}/courses/history/`,
  creditSummary: `${baseURL}/user/credit-summary/`,
  dropCourse: `${baseURL}/courses/drop/`, // 退選
  enrollCourse: `${baseURL}/courses/enroll/`, // 加選

  // 篩選選單
  filterOptions: `${baseURL}/courses/filter-options/`,

  // 管理者相關
  students: `${baseURL}/students/`,
  studentUpdate: (id) => `${baseURL}/students/${id}/update/`,
  studentDelete: (id) => `${baseURL}/students/${id}/delete/`,
  teachers: `${baseURL}/teachers/`,
  teacherUpdate: (id) => `${baseURL}/teachers/${id}/update/`,
  teacherDelete: (id) => `${baseURL}/teachers/${id}/delete/`,
  resetPassword: (id) => `${baseURL}/accounts/${id}/reset-password/`, // 重設密碼

  // 帳號管理
  userProfile: `${API_BASE_URL}/user/profile/`,
  avatar: `${API_BASE_URL}/user/avatar/`,
  avatarUpload: `${API_BASE_URL}/user/avatar/upload/`,
  avatarDelete: `${baseURL}/user/avatar/delete/`,
}