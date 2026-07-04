package com.focuslock

import android.app.Application
import android.app.NotificationChannel
import android.app.NotificationManager
import android.os.Build
import dagger.hilt.android.HiltAndroidApp

@HiltAndroidApp
class FocusLockApp : Application() {
    override fun onCreate() {
        super.onCreate()
        createNotificationChannels()
    }

    private fun createNotificationChannels() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val wellnessChannel = NotificationChannel(
                WELLNESS_CHANNEL_ID,
                "Digital Wellness Notifications",
                NotificationManager.IMPORTANCE_DEFAULT
            ).apply {
                description = "Sends motivational tips, streak reminders, and screen-limit notifications."
            }

            val serviceChannel = NotificationChannel(
                SERVICE_CHANNEL_ID,
                "Focus Lock Background Service",
                NotificationManager.IMPORTANCE_LOW
            ).apply {
                description = "Keeps FocusLock app blocker and widgets running smoothly in the background."
            }

            val manager = getSystemService(NotificationManager::class.java)
            manager.createNotificationChannel(wellnessChannel)
            manager.createNotificationChannel(serviceChannel)
        }
    }

    companion object {
        const val WELLNESS_CHANNEL_ID = "digital_wellness_channel"
        const val SERVICE_CHANNEL_ID = "focus_service_channel"
    }
}
