package com.focuslock

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.viewModels
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.ui.Modifier
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import com.focuslock.ui.screens.*
import com.focuslock.ui.theme.FocusLockTheme
import dagger.hilt.android.AndroidEntryPoint

@AndroidEntryPoint
class MainActivity : ComponentActivity() {

    private val dashboardViewModel: DashboardViewModel by viewModels()
    private val appLockViewModel: AppLockViewModel by viewModels()
    private val learningViewModel: LearningViewModel by viewModels()
    private val forestViewModel: ForestViewModel by viewModels()
    private val aiCoachViewModel: AICoachViewModel by viewModels()

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        
        val showOverlay = intent.getBooleanExtra("SHOW_OVERLAY", false)
        val blockedPackage = intent.getStringExtra("BLOCKED_PACKAGE_NAME") ?: ""

        setContent {
            FocusLockTheme {
                Surface(
                    modifier = Modifier.fillMaxSize(),
                    color = MaterialTheme.colorScheme.background
                ) {
                    if (showOverlay && blockedPackage.isNotEmpty()) {
                        // Render full lock overlay blocker
                        LockOverlayScreen(
                            packageName = blockedPackage,
                            viewModel = learningViewModel,
                            appLockViewModel = appLockViewModel,
                            onUnlockComplete = {
                                finish() // Closes full-overlay activity
                            }
                        )
                    } else {
                        // Primary App Navigation Host
                        val navController = rememberNavController()
                        NavHost(navController = navController, startDestination = "dashboard") {
                            composable("dashboard") {
                                DashboardScreen(navController, dashboardViewModel)
                            }
                            composable("forest") {
                                FocusForestScreen(navController, forestViewModel)
                            }
                            composable("ai_coach") {
                                AICoachScreen(navController, aiCoachViewModel)
                            }
                            composable("lock_settings") {
                                PlaceholderScreen("App Limits & Settings", navController)
                            }
                            composable("learning") {
                                PlaceholderScreen("Learning Center", navController)
                            }
                            composable("pet") {
                                PlaceholderScreen("Virtual Pet", navController)
                            }
                            composable("wallet") {
                                PlaceholderScreen("Focus Wallet", navController)
                            }
                        }
                    }
                }
            }
        }
    }
}
