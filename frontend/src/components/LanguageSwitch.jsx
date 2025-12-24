import { useLanguage } from '../contexts/LanguageContext'

export default function LanguageSwitch() {
    const { language, setLanguage } = useLanguage()

    const toggleLanguage = () => {
        setLanguage(prev => prev === 'zh-TW' ? 'en' : 'zh-TW')
    }

    return (
        <button
            onClick={toggleLanguage}
            className="px-3 py-1 rounded-md border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-sm font-medium text-gray-700 dark:text-gray-200"
            title={language === 'zh-TW' ? 'Switch to English' : '切換為繁體中文'}
        >
            {language === 'zh-TW' ? 'EN' : '中文'}
        </button>
    )
}
