package com.focuslock.data.repository

import com.focuslock.data.local.*
import com.focuslock.domain.model.*
import com.focuslock.domain.repository.*
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.flow
import kotlinx.coroutines.flow.map
import java.util.Date
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class UserRepositoryImpl @Inject constructor() : UserRepository {
    // For demonstration, mock user in memory or sync with Firebase Auth / Firestore
    private var currentUser = User(
        id = "test_user_id",
        name = "David",
        username = "david_focused",
        profilePictureUrl = "",
        dailyGoalMinutes = 120,
        focusCoins = 150,
        xp = 750,
        level = 4,
        currentStreak = 5,
        productivityScore = 92
    )

    override fun getUserProfile(userId: String): Flow<User?> = flow {
        emit(currentUser)
    }

    override suspend fun saveUserProfile(user: User) {
        currentUser = user
    }

    override suspend fun updateCoinsAndXp(userId: String, coinsDelta: Int, xpDelta: Int) {
        val currentCoins = currentUser.focusCoins + coinsDelta
        val currentXp = currentUser.xp + xpDelta
        val newLevel = (currentXp / 200) + 1 // Simple leveling math: 200 XP per level
        currentUser = currentUser.copy(
            focusCoins = currentCoins.coerceAtLeast(0),
            xp = currentXp.coerceAtLeast(0),
            level = newLevel
        )
    }

    override suspend fun getLeaderboard(sortBy: String): List<User> {
        return listOf(
            currentUser,
            User(id = "1", name = "Alex", username = "alex_ninja", focusCoins = 320, xp = 2100, level = 11, currentStreak = 12),
            User(id = "2", name = "Sophia", username = "sophia_smart", focusCoins = 180, xp = 1200, level = 7, currentStreak = 8),
            User(id = "3", name = "James", username = "james_dev", focusCoins = 90, xp = 450, level = 3, currentStreak = 2)
        ).sortedByDescending {
            when (sortBy) {
                "Coins" -> it.focusCoins
                "Streak" -> it.currentStreak
                else -> it.xp
            }
        }
    }
}

@Singleton
class AppLockRepositoryImpl @Inject constructor(
    private val appUsageDao: AppUsageDao
) : AppLockRepository {

    override fun getBlockedApps(): Flow<List<BlockedApp>> {
        return appUsageDao.getAllLimits().map { entities ->
            entities.map { it.toDomain() }
        }
    }

    override suspend fun saveBlockedApp(app: BlockedApp) {
        appUsageDao.insertLimit(app.toEntity())
    }

    override suspend fun updateAppUsage(packageName: String, minutesUsed: Int) {
        appUsageDao.updateUsage(packageName, minutesUsed)
        val limitEntity = appUsageDao.getLimitByPackage(packageName)
        if (limitEntity != null && limitEntity.dailyLimitMinutes > 0 && minutesUsed >= limitEntity.dailyLimitMinutes) {
            // Lock the app if limits exceeded
            appUsageDao.insertLimit(limitEntity.copy(isLocked = true, timeUsedTodayMinutes = minutesUsed))
        }
    }

    override suspend fun checkIsAppLocked(packageName: String): Boolean {
        val limit = appUsageDao.getLimitByPackage(packageName)
        return limit?.isLocked ?: false
    }

    private fun AppUsageEntity.toDomain() = BlockedApp(
        packageName = packageName,
        appName = appName,
        dailyLimitMinutes = dailyLimitMinutes,
        timeUsedTodayMinutes = timeUsedTodayMinutes,
        isLocked = isLocked,
        unlockRequirement = UnlockRequirement.valueOf(unlockRequirement),
        coinsToUnlock = coinsToUnlock
    )

    private fun BlockedApp.toEntity() = AppUsageEntity(
        packageName = packageName,
        appName = appName,
        dailyLimitMinutes = dailyLimitMinutes,
        timeUsedTodayMinutes = timeUsedTodayMinutes,
        isLocked = isLocked,
        unlockRequirement = unlockRequirement.name,
        coinsToUnlock = coinsToUnlock
    )
}

@Singleton
class FocusSessionRepositoryImpl @Inject constructor(
    private val focusSessionDao: FocusSessionDao
) : FocusSessionRepository {

    override fun getFocusSessions(): Flow<List<FocusSession>> {
        return focusSessionDao.getAllSessions().map { entities ->
            entities.map { it.toDomain() }
        }
    }

    override suspend fun insertSession(session: FocusSession) {
        focusSessionDao.insertSession(session.toEntity())
    }

    override suspend fun growTree(treeType: String): Flow<Int> = flow {
        // Yield dynamic tree levels based on session counts
        emit(3)
    }

    private fun FocusSessionEntity.toDomain() = FocusSession(
        id = id,
        startTime = Date(timestamp),
        durationMinutes = durationMinutes,
        coinsEarned = coinsEarned,
        xpEarned = xpEarned,
        wasSuccessful = wasSuccessful,
        treeType = treeType
    )

    private fun FocusSession.toEntity() = FocusSessionEntity(
        id = id,
        durationMinutes = durationMinutes,
        coinsEarned = coinsEarned,
        xpEarned = xpEarned,
        wasSuccessful = wasSuccessful,
        treeType = treeType,
        timestamp = startTime.time
    )
}

@Singleton
class LearningRepositoryImpl @Inject constructor() : LearningRepository {
    private val staticQuestions = listOf(
        QuizQuestion("1", "Mathematics", "Easy", "What is 7 multiplied by 8?", listOf("54", "56", "62", "48"), 1, "7 * 8 equals 56."),
        QuizQuestion("2", "Science", "Medium", "What is the chemical symbol for Gold?", listOf("Ag", "Fe", "Au", "Pb"), 2, "Au is derived from the Latin word aurum, representing gold."),
        QuizQuestion("3", "Artificial Intelligence", "Hard", "What does the 'G' stand for in GPT?", listOf("General", "Graded", "Generative", "Global"), 2, "Generative Pre-trained Transformer stands for GPT."),
        QuizQuestion("4", "Finance", "Medium", "What is liquid cash or short-term assets called?", listOf("Liabilities", "Equity", "Liquidity", "Dividends"), 2, "Liquidity describes the ease of converting assets to cash.")
    )

    override suspend fun getQuestionsByCategory(category: String, difficulty: String): List<QuizQuestion> {
        return staticQuestions.filter { it.category == category }
    }

    override suspend fun getRandomQuestion(): QuizQuestion {
        return staticQuestions.random()
    }

    override suspend fun recordQuizPerformance(category: String, isCorrect: Boolean) {
        // Firebase analytics or local room updates
    }
}
