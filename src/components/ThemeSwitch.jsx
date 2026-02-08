"use client"

import * as React from 'react'
import { Moon, Sun } from 'lucide-react'

export function ThemeSwitch({ className = '' }) {
    const [theme, setTheme] = React.useState('light')

    // Check current theme on component mount
    React.useEffect(() => {
        const savedTheme =
            localStorage.getItem('theme') ||
            (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')

        setTheme(savedTheme)
        document.documentElement.classList.toggle('dark', savedTheme === 'dark')
    }, [])

    // Toggle theme
    const toggleTheme = React.useCallback(() => {
        const newTheme = theme === 'light' ? 'dark' : 'light'
        setTheme(newTheme)
        localStorage.setItem('theme', newTheme)
        document.documentElement.classList.toggle('dark', newTheme === 'dark')
    }, [theme])

    return (
        <button
            onClick={toggleTheme}
            className={`relative flex h-8 w-8 items-center justify-center rounded-full text-[var(--text-color-primary)] hover:opacity-80 transition-opacity overflow-hidden ${className}`}
        >
            <Sun
                className={`absolute h-5 w-5 transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${theme === 'light'
                        ? 'scale-100 translate-y-0 opacity-100 text-orange-500'
                        : 'scale-50 translate-y-5 opacity-0 text-gray-400'
                    }`}
            />
            <Moon
                className={`absolute h-5 w-5 transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${theme === 'dark'
                        ? 'scale-100 translate-y-0 opacity-100 text-white'
                        : 'scale-50 translate-y-5 opacity-0 text-gray-500'
                    }`}
            />
        </button>
    )
}
