import { createContext, useContext, useState, useEffect } from 'react'

// Translations object (inline for simplicity if file missing, or create separate file)
const i18n = {
    'zh-TW': {
        common: {
            login: '登入',
            logout: '登出',
            success: '成功',
            error: '錯誤',
            loading: '載入中...',
            confirm: '確認',
            cancel: '取消'
        },
        login: {
            title: '選課系統',
            subtitle: '',
            username: '學號 / 職工號',
            password: '密碼',
            usernamePlaceholder: '請輸入學號或職工號',
            passwordPlaceholder: '請輸入密碼',
            loginButton: '登入系統',
            loggingIn: '登入中...',
            emptyFields: '請輸入帳號和密碼',
            loginError: '登入失敗',
            selectRole: '請選擇登入身分',
            announcement: '系統公告',
            instructions: '使用說明',
            footer: '© 2024 國立臺北護理健康大學 教務處註冊組',
            browserHint: '建議使用 Chrome、Edge 或 Firefox 瀏覽器以獲得最佳體驗',
            announcementItems: [
                '114學年度第2學期選課時間表公告',
                '系統維護通知：每週日凌晨 02:00-04:00',
                '請同學務必確認選課結果',
                '如有選課問題請洽教務處註冊組',
                '若您忘記密碼，請於辦公時間至電算中心或撥打校園分機：2220、2225或2226申請新密碼，取得新密碼後也請您在登入信箱後儘速更換密碼。'
            ],
            instructionItems: [
                '帳號為您的學號或職工號',
                '預設密碼為身分證後六碼',
                '首次登入請務必修改密碼',
                '操作完畢後請記得登出'
            ]
        },
        nav: {
            welcome: '歡迎',
            myCourses: '我的課表',
            searchCourses: '課程查詢',
            courseSelection: '加退選',
            accountManagement: '個人帳號管理'
        },
        account: {
            name: '姓名',
            studentId: '學號',
            department: '系所',
            grade: '年級',
            uploadPhoto: '上傳大頭貼',
            deletePhoto: '刪除大頭貼',
            photoHint: '支援 JPG, PNG, GIF, WebP (最大 5MB)',
            uploadSuccess: '大頭貼上傳成功',
            deleteSuccess: '大頭貼已刪除',
            deleteConfirm: '確定要刪除大頭貼嗎？',
            uploadError: '上傳失敗',
            generalCredits: '通識',
            electiveCredits: '選修',
            requiredCredits: '必修',
            totalCredits: '總學分',
            semesterCredits: '本學期學分',
            changePassword: '修改密碼'
        },
        roles: {
            student: '學生',
            teacher: '教師',
            admin: '管理員'
        }
    },
    'en': {
        common: {
            login: 'Login',
            logout: 'Logout',
            success: 'Success',
            error: 'Error',
            loading: 'Loading...',
            confirm: 'Confirm',
            cancel: 'Cancel'
        },
        login: {
            title: 'NTUNHS',
            subtitle: 'Course Selection System',
            username: 'Student/Staff ID',
            password: 'Password',
            usernamePlaceholder: 'Enter ID',
            passwordPlaceholder: 'Enter Password',
            loginButton: 'Sign In',
            loggingIn: 'Signing in...',
            emptyFields: 'Please enter username and password',
            loginError: 'Login failed',
            selectRole: 'Select Role',
            announcement: 'Announcements',
            instructions: 'Instructions',
            footer: '© 2024 NTUNHS Office of Academic Affairs',
            browserHint: 'Chrome, Edge or Firefox recommended',
            announcementItems: [
                '114-2 Semester Course Selection Schedule',
                'System Maintenance: Every Sunday 02:00-04:00',
                'Please verify your course selection results',
                'Contact Academic Affairs for assistance'
            ],
            instructionItems: [
                'Username is your Student or Staff ID',
                'Default password is last 6 digits of ID',
                'Please change password upon first login',
                'Remember to logout after use'
            ]
        },
        nav: {
            welcome: 'Welcome',
            myCourses: 'My Courses',
            searchCourses: 'Search',
            courseSelection: 'Add/Drop',
            accountManagement: 'Account'
        },
        account: {
            name: 'Name',
            studentId: 'ID',
            department: 'Dept',
            grade: 'Grade',
            uploadPhoto: 'Upload Photo',
            deletePhoto: 'Remove Photo',
            photoHint: 'JPG, PNG, GIF, WebP (Max 5MB)',
            uploadSuccess: 'Photo uploaded',
            deleteSuccess: 'Photo removed',
            deleteConfirm: 'Delete photo?',
            uploadError: 'Upload failed',
            generalCredits: 'General',
            electiveCredits: 'Elective',
            requiredCredits: 'Required',
            totalCredits: 'Total Credits',
            semesterCredits: 'Semester Credits',
            changePassword: 'Change Password'
        },
        roles: {
            student: 'Student',
            teacher: 'Teacher',
            admin: 'Admin'
        }
    }
}

const LanguageContext = createContext()

export function LanguageProvider({ children }) {
    const [language, setLanguage] = useState(() => {
        return localStorage.getItem('language') || 'zh-TW'
    })

    useEffect(() => {
        localStorage.setItem('language', language)
        document.documentElement.lang = language
    }, [language])

    const t = (path) => {
        const keys = path.split('.')
        let current = i18n[language]
        for (const key of keys) {
            if (current[key] === undefined) return path
            current = current[key]
        }
        return current
    }

    return (
        <LanguageContext.Provider value={{ language, setLanguage, t }}>
            {children}
        </LanguageContext.Provider>
    )
}

export const useLanguage = () => useContext(LanguageContext)
