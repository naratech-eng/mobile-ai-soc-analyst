package com.utiltools.flashlight.persistence

import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.Service
import android.content.Intent
import android.os.Build
import android.os.IBinder
import android.util.Log
import androidx.core.app.NotificationCompat

/**
 * PoC-only, bonus technique. Self-built benign proof-of-concept, isolated
 * lab only. Implements ATT&CK Mobile T1541 (Foreground Persistence):
 * https://attack.mitre.org/techniques/T1541/
 *
 * Abuses a foreground service (with a benign-looking "Flashlight running"
 * notification) to keep the process alive in the background, resisting
 * normal task-kill/backgrounding. Evidence: `adb shell dumpsys activity
 * services` shows the service; the notification is visible on-device.
 */
class ForegroundPersistenceService : Service() {

    companion object {
        private const val TAG = "PoC-T1541-Persistence"
        private const val CHANNEL_ID = "flashlight_util_channel"
        private const val NOTIFICATION_ID = 1001
    }

    override fun onBind(intent: Intent?): IBinder? = null

    override fun onCreate() {
        super.onCreate()
        createNotificationChannel()
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        val notification = NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("Flashlight Util")
            .setContentText("Running")
            .setSmallIcon(android.R.drawable.ic_lock_idle_alarm)
            .setOngoing(true)
            .build()

        startForeground(NOTIFICATION_ID, notification)
        Log.i(TAG, "foreground_service_started")
        return START_STICKY
    }

    override fun onDestroy() {
        Log.i(TAG, "foreground_service_stopped")
        super.onDestroy()
    }

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return
        val channel = NotificationChannel(
            CHANNEL_ID,
            "Flashlight Util",
            NotificationManager.IMPORTANCE_MIN
        )
        val manager = getSystemService(NotificationManager::class.java)
        manager?.createNotificationChannel(channel)
    }
}
