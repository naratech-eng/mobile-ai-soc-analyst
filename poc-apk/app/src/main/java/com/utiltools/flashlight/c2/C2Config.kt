package com.utiltools.flashlight.c2

/**
 * PoC-only. Points at poc-c2-server, my own test infrastructure running
 * on the isolated lab network. Update HOST to the Genymotion host-only
 * adapter IP (or 10.0.2.2 style bridge) before running the demo — never a
 * real/public endpoint.
 */
object C2Config {
    const val HOST = "10.0.3.2" // Genymotion host-only gateway IP (device saw itself as 10.0.3.x)
    const val PORT = 8443
}
