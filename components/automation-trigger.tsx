'use client'

import { useEffect } from 'react'

export function AutomationTrigger() {
    useEffect(() => {
        // Check if run today
        const lastRun = localStorage.getItem('grain_check_date')
        const today = new Date().toLocaleDateString()

        if (lastRun !== today) {
            console.log("Running Daily Grain Check...")
            fetch('/api/cron/check-grains')
                .then(res => res.json())
                .then(data => {
                    console.log("Grain Check Result:", data)
                    localStorage.setItem('grain_check_date', today)
                })
                .catch(err => console.error("Grain Check Failed:", err))
        }
    }, [])

    return null
}
