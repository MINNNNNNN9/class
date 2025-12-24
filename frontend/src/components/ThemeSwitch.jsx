import { useTheme } from '../contexts/ThemeContext'

export default function ThemeSwitch() {
    const { theme, toggleTheme } = useTheme()

    return (
        <button
            onClick={toggleTheme}
            className="px-3 py-1 rounded-md border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-sm font-medium text-gray-700 dark:text-gray-200"
            title={theme === 'light' ? '切換深色模式' : 'Switch to Light Mode'}
        >
            {theme === 'light' ? '深色' : '淺色'}
        </button>
    )
}
