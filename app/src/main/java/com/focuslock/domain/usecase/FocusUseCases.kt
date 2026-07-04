package com.focuslock.domain.usecase

import com.focuslock.domain.model.*
import com.focuslock.domain.repository.*
import kotlinx.coroutines.flow.firstOrNull
import javax.inject.Inject

class CheckAppLockUseCase @Inject constructor(
    private val appLockRepository: AppLockRepository
) {
    suspend operator fun invoke(packageName: String): Boolean {
        return appLockRepository.checkIsAppLocked(packageName)
    }
}

class UnlockAppUseCase @Inject constructor(
    private val appLockRepository: AppLockRepository,
    private val userRepository: UserRepository
) {
    suspend fun unlockWithCoins(userId: String, app: BlockedApp): Boolean {
        val user = userRepository.getUserProfile(userId).firstOrNull() ?: return false
        if (user.focusCoins >= app.coinsToUnlock) {
            userRepository.updateCoinsAndXp(userId, -app.coinsToUnlock, 5)
            // Temporarily lift lock in local repository
            appLockRepository.saveBlockedApp(app.copy(isLocked = false, timeUsedTodayMinutes = 0))
            return true
        }
        return false
    }

    suspend fun unlockWithQuiz(packageName: String) {
        // Find app and lift lock temporarily (e.g. resets daily limit or allows 15 mins)
        val apps = appLockRepository.getBlockedApps().firstOrNull() ?: return
        val app = apps.find { it.packageName == packageName }
        if (app != null) {
            appLockRepository.saveBlockedApp(app.copy(isLocked = false))
        }
    }
}

class GrowForestTreeUseCase @Inject constructor(
    private val focusSessionRepository: FocusSessionRepository,
    private val userRepository: UserRepository
) {
    suspend operator fun invoke(userId: String, durationMinutes: Int, treeType: String): FocusSession {
        // Calculate rewards: 1 Coin per 5 minutes + 10 XP per 5 minutes
        val coins = durationMinutes / 5
        val xp = (durationMinutes / 5) * 10
        
        val session = FocusSession(
            id = java.util.UUID.randomUUID().toString(),
            startTime = java.util.Date(),
            durationMinutes = durationMinutes,
            coinsEarned = coins,
            xpEarned = xp,
            wasSuccessful = true,
            treeType = treeType
        )

        focusSessionRepository.insertSession(session)
        userRepository.updateCoinsAndXp(userId, coins, xp)
        return session
    }
}

class GetAICoachResponseUseCase @Inject constructor() {
    operator fun invoke(userMessage: String, currentStreak: Int, screenTimeMinutes: Int): String {
        val msg = userMessage.lowercase()
        return when {
            msg.contains("hello") || msg.contains("hi") -> {
                "Hello! I am your FocusLock AI Coach. I see your screen time today is $screenTimeMinutes minutes and you have a streak of $currentStreak days! How can I help you optimize your study habits today?"
            }
            msg.contains("streak") -> {
                "Keep going! Your $currentStreak-day streak is amazing. Reaching 7 days unlocks the Golden Spruce tree in your Focus Forest!"
            }
            msg.contains("block") || msg.contains("lock") -> {
                "If you are finding yourself constantly opening social apps, try 'Strict Mode' combined with 'Unlock by Quiz'. Answering 3 quick history questions will build memory and break the habit loop!"
            }
            msg.contains("study") || msg.contains("focus") -> {
                "Research shows that studying in 25-minute Pomodoro blocks with a 5-minute break is highly effective. Let's start a session and grow a Cherry Blossom tree today!"
            }
            else -> {
                "That's interesting. Try mapping out your daily planner. Small improvements lead to massive productivity gains. You have saved an estimated 3 hours this week by locking distracting apps!"
            }
        }
    }
}
