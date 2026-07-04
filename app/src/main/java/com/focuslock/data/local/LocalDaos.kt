package com.focuslock.data.local

import androidx.room.*
import kotlinx.coroutines.flow.Flow

@Dao
interface AppUsageDao {
    @Query("SELECT * FROM app_usage_limits")
    fun getAllLimits(): Flow<List<AppUsageEntity>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertLimit(appUsage: AppUsageEntity)

    @Query("UPDATE app_usage_limits SET timeUsedTodayMinutes = :minutes WHERE packageName = :packageName")
    suspend fun updateUsage(packageName: String, minutes: Int)

    @Query("SELECT * FROM app_usage_limits WHERE packageName = :packageName LIMIT 1")
    suspend fun getLimitByPackage(packageName: String): AppUsageEntity?
}

@Dao
interface FocusSessionDao {
    @Query("SELECT * FROM focus_sessions ORDER BY timestamp DESC")
    fun getAllSessions(): Flow<List<FocusSessionEntity>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertSession(session: FocusSessionEntity)
}

@Dao
interface PlannerDao {
    @Query("SELECT * FROM planner_tasks")
    fun getAllTasks(): Flow<List<TaskEntity>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertTask(task: TaskEntity)

    @Query("DELETE FROM planner_tasks WHERE id = :taskId")
    suspend fun deleteTask(taskId: String)
}
