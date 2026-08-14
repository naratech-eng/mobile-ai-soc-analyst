package expo.modules.deviceinventory

import android.content.pm.ApplicationInfo
import android.content.pm.PackageInfo
import android.content.pm.PackageManager
import expo.modules.kotlin.exception.Exceptions
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record

class InstalledPackageRecord(
  @Field val packageName: String = "",
  @Field val appLabel: String = "",
  @Field val isSystemApp: Boolean = false,
  @Field val firstInstallTime: Double = 0.0,
  @Field val requestedPermissions: List<String> = emptyList(),
  @Field val grantedPermissions: List<String> = emptyList()
) : Record

class DeviceInventoryModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("DeviceInventory")

    AsyncFunction("getInstalledPackagesAsync") {
      return@AsyncFunction fetchInstalledPackages()
    }
  }

  // getInstalledPackages(int) is deprecated in favor of the PackageInfoFlags
  // overload added in API 33, but the deprecated form still works across all
  // supported API levels and avoids a version-gated code path here.
  @Suppress("DEPRECATION")
  private fun fetchInstalledPackages(): List<InstalledPackageRecord> {
    val context = appContext.reactContext ?: throw Exceptions.ReactContextLost()
    val packageManager = context.packageManager
    val packages = packageManager.getInstalledPackages(PackageManager.GET_PERMISSIONS)

    return packages.map { pkg -> pkg.toRecord(packageManager) }
  }

  private fun PackageInfo.toRecord(packageManager: PackageManager): InstalledPackageRecord {
    val appInfo: ApplicationInfo? = applicationInfo
    val label = try {
      appInfo?.let { packageManager.getApplicationLabel(it).toString() } ?: packageName
    } catch (e: Exception) {
      packageName
    }
    val isSystem = appInfo != null && (appInfo.flags and ApplicationInfo.FLAG_SYSTEM) != 0

    val requested = requestedPermissions?.toList() ?: emptyList()
    val granted = requested.filterIndexed { index, _ ->
      val flags = requestedPermissionsFlags
      flags != null && index < flags.size &&
        (flags[index] and PackageInfo.REQUESTED_PERMISSION_GRANTED) != 0
    }

    return InstalledPackageRecord(
      packageName = packageName,
      appLabel = label,
      isSystemApp = isSystem,
      firstInstallTime = firstInstallTime.toDouble(),
      requestedPermissions = requested,
      grantedPermissions = granted
    )
  }
}
