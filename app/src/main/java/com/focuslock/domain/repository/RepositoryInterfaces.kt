package com.focuslock.domain.repository

import com.focuslock.domain.model.*
import kotlinx.coroutines.flow.Flow

interface UserRepository {
    fun getUserProfile(userId: String): Flow<User?>
    suspend fun saveUserProfile(user: User)
    suspend fun updateCoinsAndXp(userId: String, coinsDelta: Int, xpDelta: Int)
    suspend fun getLeaderboard(sortBy: String): List<User>
}

interface AppLockRepository {
    fun getBlockedApps(): Flow<List<BlockedApp>>
    suspend fun saveBlockedApp(app: BlockedApp)
    suspend fun updateAppUsage(packageName: String, minutesUsed: Int)
    suspend fun checkIsAppLocked(packageName: String): Boolean
}

interface FocusSessionRepository {
    fun getFocusSessions(): Flow<List<FocusSession>>
    suspend fun insertSession(session: FocusSession)
    suspend fun growTree(treeType: String): Flow<Int> // Returns tree level
}

interface LearningRepository {
    suspend fun getQuestionsByCategory(category: String, difficulty: String): List<QuizQuestion>
    suspend fun getRandomQuestion(): QuizQuestion
    suspend fun recordQuizPerformance(category: String, isCorrect: Boolean)
}
