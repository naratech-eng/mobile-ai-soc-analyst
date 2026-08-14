package com.utiltools.torchlight.recon

import android.content.Context
import android.net.ConnectivityManager
import android.net.NetworkCapabilities
import android.net.wifi.WifiManager
import android.util.Log

/**
 * PoC-only. Self-built benign proof-of-concept, run exclusively in an
 * isolated lab (Genymotion) — never a personal device. Implements
 * ATT&CK Mobile T1422 (System Network Configuration Discovery):
 * https://attack.mitre.org/techniques/T1422/
 *
 * Reads locally-visible network configuration via ConnectivityManager /
 * WifiManager and logs it for lab evidence capture (`adb logcat`).
 */
object NetworkReconCollector {

    private const val TAG = "PoC-T1422-Recon"

    data class NetworkRecon(
        val hasInternet: Boolean,
        val transportType: String,
        val wifiSsid: String?,
        val wifiLinkSpeedMbps: Int?,
        val ipAddress: String?
    )

    fun collect(context: Context): NetworkRecon {
        val connectivityManager =
            context.getSystemService(Context.CONNECTIVITY_SERVICE) as ConnectivityManager
        val activeNetwork = connectivityManager.activeNetwork
        val capabilities = connectivityManager.getNetworkCapabilities(activeNetwork)

        val hasInternet = capabilities?.hasCapability(NetworkCapabilities.NET_CAPABILITY_INTERNET) ?: false
        val transportType = when {
            capabilities == null -> "none"
            capabilities.hasTransport(NetworkCapabilities.TRANSPORT_WIFI) -> "wifi"
            capabilities.hasTransport(NetworkCapabilities.TRANSPORT_CELLULAR) -> "cellular"
            capabilities.hasTransport(NetworkCapabilities.TRANSPORT_ETHERNET) -> "ethernet"
            else -> "other"
        }

        @Suppress("DEPRECATION")
        val wifiManager =
            context.applicationContext.getSystemService(Context.WIFI_SERVICE) as WifiManager
        @Suppress("DEPRECATION")
        val wifiInfo = wifiManager.connectionInfo

        @Suppress("DEPRECATION")
        val ssid = wifiInfo?.ssid?.trim('"')
        @Suppress("DEPRECATION")
        val linkSpeed = wifiInfo?.linkSpeed
        val ipAddress = formatIpAddress(wifiInfo?.ipAddress ?: 0)

        val result = NetworkRecon(
            hasInternet = hasInternet,
            transportType = transportType,
            wifiSsid = ssid,
            wifiLinkSpeedMbps = linkSpeed,
            ipAddress = ipAddress
        )

        Log.i(TAG, "network_recon transport=${result.transportType} " +
                "internet=${result.hasInternet} ssid=${result.wifiSsid} " +
                "link_speed_mbps=${result.wifiLinkSpeedMbps} ip=${result.ipAddress}")

        return result
    }

    private fun formatIpAddress(ip: Int): String {
        if (ip == 0) return "unknown"
        return "${ip and 0xff}.${ip shr 8 and 0xff}.${ip shr 16 and 0xff}.${ip shr 24 and 0xff}"
    }
}
