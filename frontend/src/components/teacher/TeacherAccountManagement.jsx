import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { API_ENDPOINTS } from '../../config/api'
import { useLanguage } from '../../contexts/LanguageContext'
import { useToast } from '../../contexts/ToastContext'
import ChangePasswordModal from '../ChangePasswordModal'
import { AccountManagementSkeleton } from '../Skeleton'

// 獲取 CSRF token
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

export default function TeacherAccountManagement() {
    const [userInfo, setUserInfo] = useState(null)
    const [avatarUrl, setAvatarUrl] = useState(null)
    const [loading, setLoading] = useState(true)
    const [uploading, setUploading] = useState(false)
    const [error, setError] = useState(null)
    const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false)
    const fileInputRef = useRef(null)
    const navigate = useNavigate()
    const { t } = useLanguage()
    const { toast } = useToast()

    // 從後端獲取資料
    useEffect(() => {
        fetchUserData()
    }, [])

    const fetchUserData = async () => {
        try {
            setLoading(true)
            setError(null)

            const response = await axios.get(API_ENDPOINTS.userProfile, {
                withCredentials: true
            })

            const data = response.data
            setUserInfo(data)
            setAvatarUrl(data.avatar_url)
            setLoading(false)
        } catch (error) {
            console.error('❌ 獲取個人資料失敗:', error)

            if (error.response?.status === 401 || error.response?.status === 403) {
                setError('請重新登入')
                localStorage.clear()
                setTimeout(() => navigate('/'), 2000)
            } else {
                const errorMsg = error.response?.data?.error || error.message || '無法載入資料'
                setError(errorMsg)
            }

            setLoading(false)
        }
    }

    // 處理圖片選擇
    const handleFileSelect = () => {
        fileInputRef.current?.click()
    }

    // 上傳大頭貼
    const handleAvatarUpload = async (event) => {
        const file = event.target.files?.[0]
        if (!file) return

        // 檢查文件類型
        const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
        if (!allowedTypes.includes(file.type)) {
            toast.error('只支援 JPG、PNG、GIF、WebP 格式')
            return
        }

        // 檢查文件大小 (5MB)
        if (file.size > 5 * 1024 * 1024) {
            toast.error('圖片大小不能超過 5MB')
            return
        }

        setUploading(true)
        try {
            const formData = new FormData()
            formData.append('avatar', file)

            const csrfToken = getCookie('csrftoken')

            const response = await axios.post(API_ENDPOINTS.avatarUpload, formData, {
                withCredentials: true,
                headers: {
                    'Content-Type': 'multipart/form-data',
                    'X-CSRFToken': csrfToken
                }
            })

            setAvatarUrl(response.data.avatar_url)
            toast.success(t('account.uploadSuccess'))
        } catch (error) {
            console.error('上傳失敗:', error)
            toast.error(t('account.uploadError') + ': ' + (error.response?.data?.error || error.message))
        } finally {
            setUploading(false)
            if (fileInputRef.current) {
                fileInputRef.current.value = ''
            }
        }
    }

    // 刪除大頭貼
    const handleAvatarDelete = async () => {
        if (!avatarUrl) return

        if (!confirm(t('account.deleteConfirm'))) return

        try {
            const csrfToken = getCookie('csrftoken')

            await axios.delete(API_ENDPOINTS.avatarDelete, {
                withCredentials: true,
                headers: {
                    'X-CSRFToken': csrfToken
                }
            })

            setAvatarUrl(null)
            toast.success(t('account.deleteSuccess'))
        } catch (error) {
            console.error('刪除失敗:', error)
            toast.error(error.response?.data?.error || error.message)
        }
    }

    if (loading) {
        return <AccountManagementSkeleton />
    }

    if (error) {
        return (
            <div className="flex items-center justify-center h-96 dark:text-white">
                <div className="text-center">
                    <div className="text-2xl text-red-600 mb-4">{error}</div>
                </div>
            </div>
        )
    }

    return (
        <div className="bg-gradient-to-br from-green-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 min-h-screen">
            <div className="max-w-4xl mx-auto bg-white dark:bg-gray-800 shadow-2xl transition-colors">
                <div className="flex flex-col md:flex-row">

                    {/* 左側：個人資訊與頭像 */}
                    <div className="md:w-1/2 bg-gradient-to-br from-orange-50 to-yellow-50 dark:from-gray-800 dark:to-gray-700 p-8 border-r-4 border-orange-200 dark:border-gray-600">

                        {/* 頭像區域 */}
                        <div className="flex flex-col items-center mb-6">
                            <div className="relative group cursor-pointer" onClick={handleFileSelect}>
                                <div className="w-48 h-48 bg-gray-100 dark:bg-gray-700 rounded-3xl flex items-center justify-center shadow-lg overflow-hidden border-4 border-white dark:border-gray-600">
                                    {avatarUrl ? (
                                        <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                                    ) : (
                                        <span className="text-8xl">👨‍🏫</span>
                                    )}
                                </div>

                                <div className="absolute inset-0 bg-black/50 rounded-3xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                    <div className="text-center text-white">
                                        <svg className="w-10 h-10 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                                        </svg>
                                        <span className="text-sm font-medium">{uploading ? t('common.loading') : t('account.uploadPhoto')}</span>
                                    </div>
                                </div>

                                {uploading && (
                                    <div className="absolute inset-0 bg-black/50 rounded-3xl flex items-center justify-center">
                                        <div className="w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
                                    </div>
                                )}
                            </div>

                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/jpeg,image/png,image/gif,image/webp"
                                onChange={handleAvatarUpload}
                                className="hidden"
                            />

                            <div className="flex gap-2 mt-4">
                                <button
                                    onClick={handleFileSelect}
                                    disabled={uploading}
                                    className="px-4 py-2 bg-emerald-500 text-white rounded-lg text-sm font-medium hover:bg-emerald-600 transition-colors disabled:opacity-50 shadow-sm"
                                >
                                    📷 {t('account.uploadPhoto')}
                                </button>
                                {avatarUrl && (
                                    <button
                                        onClick={handleAvatarDelete}
                                        disabled={uploading}
                                        className="px-4 py-2 bg-red-500 text-white rounded-lg text-sm font-medium hover:bg-red-600 transition-colors disabled:opacity-50 shadow-sm"
                                    >
                                        🗑️
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* 右側：詳細資料 */}
                    <div className="md:w-1/2 p-8 dark:text-white space-y-6">
                        <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6 border-b pb-2">基本資料</h2>

                        <div className="space-y-4">
                            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 shadow-sm border border-gray-100 dark:border-gray-600">
                                <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">{t('account.name')}</div>
                                <div className="text-xl font-bold text-gray-800 dark:text-white">{userInfo.real_name}</div>
                            </div>

                            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 shadow-sm border border-gray-100 dark:border-gray-600">
                                <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">教師編號</div>
                                <div className="text-xl font-bold text-gray-800 dark:text-white">{userInfo.teacher_id}</div>
                            </div>

                            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 shadow-sm border border-gray-100 dark:border-gray-600">
                                <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">職稱</div>
                                <div className="text-xl font-bold text-gray-800 dark:text-white">{userInfo.title || '未設定'}</div>
                            </div>

                            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 shadow-sm border border-gray-100 dark:border-gray-600">
                                <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">研究室</div>
                                <div className="text-xl font-bold text-gray-800 dark:text-white">{userInfo.office || '未設定'}</div>
                            </div>

                            {/* 修改密碼按鈕 */}
                            <button
                                onClick={() => setIsPasswordModalOpen(true)}
                                className="w-full mt-8 py-3 bg-white dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-600 text-gray-700 dark:text-white rounded-xl font-bold hover:bg-gray-50 dark:hover:bg-gray-600 hover:border-emerald-500 dark:hover:border-emerald-500 transition-all flex items-center justify-center gap-2"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                </svg>
                                {t('account.changePassword')}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <ChangePasswordModal
                isOpen={isPasswordModalOpen}
                onClose={() => setIsPasswordModalOpen(false)}
            />
        </div>
    )
}
