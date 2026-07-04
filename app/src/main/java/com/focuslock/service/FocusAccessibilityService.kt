package com.focuslock.service

import android.accessibilityservice.AccessibilityService
import android.content.Intent
import android.view.accessibility.AccessibilityEvent
import com.focuslock.domain.repository.AppLockRepository
import dagger.hilt.android.AndroidEntryPoint
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.flow.firstOrNull
import kotlinx.coroutines.launch
import javax.inject.Inject

@AndroidEntryPoint
class FocusAccessibilityService : AccessibilityService() {

    @Inject
    lateinit var appLockRepository: AppLockRepository

    private val serviceJob = SupervisorJob()
    private val serviceScope = CoroutineScope(Dispatchers.Main + serviceJob)

    override fun onAccessibilityEvent(event: AccessibilityEvent) {
        if (event.eventType == AccessibilityEvent.TYPE_WINDOW_STATE_CHANGED) {
            val packageName = event.packageName?.toString() ?: return
            
            // Bypass ourselves to prevent infinite redirect loops
            if (packageName == this.packageName) return

            serviceScope.launch {
                val isLocked = appLockRepository.checkIsAppLocked(packageName)
                if (isLocked) {
                    // Redirect the user to the blocker interface
                    redirectToBlockOverlay(packageName)
                }
            }
        }
    }

    private fun redirectToBlockOverlay(packageName: String) {
        val intent = Intent().apply {
            setClassName(this@FocusAccessibilityService.packageName, "com.focuslock.MainActivity")
            addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP)
            putExtra("BLOCKED_PACKAGE_NAME", packageName)
            putExtra("SHOW_OVERLAY", true)
        }
        startActivity(intent)
    }

    override fun onInterrupt() {
        // Handle interruption
    }

    override fun onDestroy() {
        super.onDestroy()
        serviceJob.cancel()
    }
}
