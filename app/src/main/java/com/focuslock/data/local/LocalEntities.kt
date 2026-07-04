package com.focuslock.data.local

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "app_usage_limits")
data class AppUsageEntity(
    @PrimaryKey val packageName: String,
    val appName: String,
    val dailyLimitMinutes: Int,
    val timeUsedTodayMinutes: Int,
    val isLocked: Boolean,
    val unlockRequirement: String,
    val coinsToUnlock: Int
)

@Entity(tableName = "focus_sessions")
data class FocusSessionEntity(
    @PrimaryKey val id: String,
    val durationMinutes: Int,
    val coinsEarned: Int,
    val xpEarned: Int,
    val wasSuccessful: Boolean,
    val treeType: String,
    val timestamp: Long
)

@Entity(tableName = "planner_tasks")
data class TaskEntity(
    @PrimaryKey val id: String,
    val title: String,
    val description: String,
    val deadlineTimestamp: Long,
    val isCompleted: Boolean,
    val category: String
)
