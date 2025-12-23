import axios from 'axios'

/**
 * 1. 基礎路徑配置
 * 從環境變量獲取 API URL，如果沒有則使用本地開發地址
 */
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'
const baseURL = API_BASE_URL.endsWith('/') ? API_BASE_URL.slice(0, -1) : API_BASE_URL

/**
 * 2. 核心：獲取最新 CSRF Token 的函數
 * 這是你之前在組件中測試「正常運作」的邏輯
 */
function getCsrfTokenFromCookie() {
  let cookieValue = null;
  if (document.cookie && document.cookie !== '') {
    const cookies = document.cookie.split(';');
    for (let i = 0; i < cookies.length; i++) {
      const cookie = cookies[i].trim();
      // 確保名稱與 Django 預設的 'csrftoken' 一致
      if (cookie.substring(0, 10) === ('csrftoken=')) {
        cookieValue = decodeURIComponent(cookie.substring(10));
        break;
      }
    }
  }
  return cookieValue;
}

/**
 * 3. 創建 Axios 實例
 * 啟用 withCredentials 以確保在跨域請求中攜帶 Cookie
 */
export const apiClient = axios.create({
  baseURL: baseURL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  }
})

/**
 * 4. 請求攔截器 (Request Interceptor)
 * 每次發送請求前，自動去 Cookie 抓最新的 Token 並塞入 Header
 */
apiClient.interceptors.request.use(
  (config) => {
    const token = getCsrfTokenFromCookie()
    if (token) {
      // 這裡的大小寫必須與 Django settings.py 中的 CORS_ALLOW_HEADERS 對應
      config.headers['X-CSRFToken'] = token
    }
    return config
  },
  (error) => Promise.reject(error)
)

/**
 * 5. 響應攔截器 (Response Interceptor)
 * 統一處理 403 (CSRF 失敗) 或 401 (未登入) 錯誤
 */
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 403) {
      console.error('❌ CSRF 驗證失敗，請檢查網域信任設定或 Token 是否正確')
    } else if (error.response?.status === 401) {
      console.warn('⚠️ 未授權或 Session 已過期')
    }
    return Promise.reject(error)
  }
)

/**
 * 6. API 端點路徑定義
 */
export const API_ENDPOINTS = {
  // 認證
  login: `${baseURL}/login/`,
  logout: `${baseURL}/logout/`,
  register: `${baseURL}/register/`,
  
  // 課程
  courses: `${baseURL}/courses/`,
  coursesSearch: `${baseURL}/courses/search/`,
  filterOptions: `${baseURL}/courses/filter-options/`,
  enrolledCourses: `${baseURL}/courses/enrolled/`,
  favoriteCourses: `${baseURL}/courses/favorites/`,
  
  // 帳號管理 (學生/教師)
  students: `${baseURL}/students/`,
  teachers: `${baseURL}/teachers/`,
  studentUpdate: (id) => `${baseURL}/students/${id}/update/`,
  studentDelete: (id) => `${baseURL}/students/${id}/delete/`,
  teacherUpdate: (id) => `${baseURL}/teachers/${id}/update/`,
  teacherDelete: (id) => `${baseURL}/teachers/${id}/delete/`,
  
  // 學生個人統計
  creditSummary: `${baseURL}/user/credit-summary/`,
}

export default baseURL