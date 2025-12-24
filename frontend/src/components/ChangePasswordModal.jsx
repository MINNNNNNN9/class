import { useState } from 'react'
import axios from 'axios'
import { API_ENDPOINTS } from '../config/api'
import { useToast } from '../contexts/ToastContext'
import { useLanguage } from '../contexts/LanguageContext'

// 獲取 CSRF token
function getCSRFToken() {
    // 優先從 localStorage 獲取（注意：key 是小寫 csrftoken）
    const token = localStorage.getItem('csrftoken');  // ← 改成小寫
    if (token) {
        console.log('✅ 使用 localStorage 中的 CSRF token');
        return token;
    }
    
    // 備用：從 cookie 獲取（本地開發環境）
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i].trim();
            if (cookie.substring(0, 10) === 'csrftoken=') {
                cookieValue = decodeURIComponent(cookie.substring(10));
                console.log('✅ 使用 cookie 中的 CSRF token');
                break;
            }
        }
    }
    
    if (!cookieValue) {
        console.warn('⚠️ 無法獲取 CSRF token');
    }
    
    return cookieValue;
}

export default function ChangePasswordModal({ isOpen, onClose, isMandatory = false }) {
    const [oldPassword, setOldPassword] = useState('')
    const [newPassword, setNewPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const { toast } = useToast()
    const { t } = useLanguage()

    if (!isOpen) return null

    const handleSubmit = async (e) => {
        e.preventDefault()

        if (newPassword !== confirmPassword) {
            toast.error('新密碼與確認密碼不符')
            return
        }

        if (newPassword.length < 6) {
            toast.warning('密碼長度至少需 6 個字元')
            return
        }

        setLoading(true)
        try {
            const csrfToken = getCSRFToken()
            
            if (!csrfToken) {
                toast.error('無法獲取 CSRF token，請重新登入')
                setLoading(false)
                return
            }

            console.log('發送修改密碼請求...')
            console.log('使用 CSRF token:', csrfToken.substring(0, 20) + '...')
            
            await axios.post(API_ENDPOINTS.changePassword, {
                old_password: oldPassword,
                new_password: newPassword
            }, {
                withCredentials: true,
                headers: {
                    'X-CSRFToken': csrfToken,
                    'Content-Type': 'application/json'
                }
            })

            toast.success('密碼修改成功！')
            onClose()
            setOldPassword('')
            setNewPassword('')
            setConfirmPassword('')

        } catch (error) {
            console.error('修改密碼失敗:', error)
            console.error('錯誤詳情:', error.response?.data)
            
            const errorMsg = error.response?.data?.error 
                || error.response?.data?.detail 
                || '修改密碼失敗'
            
            toast.error(errorMsg)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md p-6 transform transition-all scale-100">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                        {isMandatory ? '請修改密碼 (首次登入強制)' : '修改密碼'}
                    </h3>
                    {!isMandatory && (
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    )}
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {isMandatory && (
                        <div className="bg-yellow-50 text-yellow-800 p-3 rounded-lg text-sm mb-4">
                            為了您的帳號安全，初次登入或管理者重置後，請務必修改您的密碼。
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            舊密碼
                        </label>
                        <input
                            type="password"
                            required
                            className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all"
                            value={oldPassword}
                            onChange={e => setOldPassword(e.target.value)}
                            placeholder={isMandatory ? "預設密碼 (學號/教師編號)" : ""}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            新密碼
                        </label>
                        <input
                            type="password"
                            required
                            className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all"
                            value={newPassword}
                            onChange={e => setNewPassword(e.target.value)}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            確認新密碼
                        </label>
                        <input
                            type="password"
                            required
                            className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all"
                            value={confirmPassword}
                            onChange={e => setConfirmPassword(e.target.value)}
                        />
                    </div>

                    <div className="flex gap-3 pt-4">
                        {!isMandatory && (
                            <button
                                type="button"
                                onClick={onClose}
                                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-medium"
                            >
                                取消
                            </button>
                        )}
                        <button
                            type="submit"
                            disabled={loading}
                            className={`flex-1 px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-lg hover:from-emerald-600 hover:to-teal-700 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg ${isMandatory ? 'w-full' : ''}`}
                        >
                            {loading ? '處理中...' : '確認修改'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}