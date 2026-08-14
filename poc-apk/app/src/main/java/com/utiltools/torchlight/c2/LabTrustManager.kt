package com.utiltools.torchlight.c2

import java.security.cert.X509Certificate
import javax.net.ssl.X509TrustManager

/**
 * PoC-only. Trusts the self-signed lab cert used by poc-c2-server so the
 * TLS handshake succeeds without shipping a CA bundle in this throwaway
 * APK. This is intentionally permissive — acceptable ONLY because the PoC
 * runs exclusively in an isolated lab against a server under my own
 * control (never production code, never a real endpoint).
 */
object LabTrustManager : X509TrustManager {
    override fun checkClientTrusted(chain: Array<out X509Certificate>?, authType: String?) = Unit
    override fun checkServerTrusted(chain: Array<out X509Certificate>?, authType: String?) = Unit
    override fun getAcceptedIssuers(): Array<X509Certificate> = arrayOf()
}
