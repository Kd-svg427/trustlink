package com.focuslock.domain.model

import java.util.Date

data class User(
    val id: String = "",
    val name: String = "",
    val username: String = "",
    val profilePictureUrl: String = "",
    val country: String = "US",
    val preferredCurrency: String = "USD",
    val language: String = "en",
    val isStudent: Boolean = true,
    val dailyGoalMinutes: Int = 120,
    val bio: String = "",
    val focusCoins: Int = 0,
    val xp: Int = 0,
    val level: Int = 1,
    val currentStreak: Int = 0,
    val productivityScore: Int = 100
)

data class BlockedApp(
    val packageName: String,
    val appName: String,
    val dailyLimitMinutes: Int = 0, // 0 means no limit set yet
    val timeUsedTodayMinutes: Int = 0,
    val isLocked: Boolean = false,
    val lockScheduleJson: String = "", // Holds weekly lock times
    val unlockRequirement: UnlockRequirement = UnlockRequirement.NONE,
    val coinsToUnlock: Int = 20
)

enum class UnlockRequirement {
    NONE,
    QUIZ,
    PUZZLE,
    FOCUS_COINS,
    WAIT_TIMER
}

data class FocusSession(
    val id: String = "",
    val startTime: Date = Date(),
    val durationMinutes: Int = 0,
    val coinsEarned: Int = 0,
    val xpEarned: Int = 0,
    val wasSuccessful: Boolean = true,
    val treeType: String = "Oak",
    val moodBefore: String = "Neutral",
    val moodAfter: String = "Neutral"
)

data class QuizQuestion(
    val id: String,
    val category: String,
    val difficulty: String, // Easy, Medium, Hard, Expert
    val questionText: String,
    val options: List<String>,
    val correctAnswerIndex: Int,
    val explanation: String
)

data class PlannerTask(
    val id: String = "",
    val title: String,
    val description: String = "",
    val deadline: Date = Date(),
    val isCompleted: Boolean = false,
    val category: String = "Study" // Homework, Study, Notes
)

data class Pet(
    val id: String = "",
    val name: String = "Buddy",
    val type: String = "Cat", // Cat, Dog, Rabbit
    val level: Int = 1,
    val xp: Int = 0,
    val foodLevel: Int = 80, // 0 - 100
    val happinessLevel: Int = 80, // 0 - 100
    val unlockedAccessories: List<String> = emptyList(),
    val equippedAccessory: String = ""
)
