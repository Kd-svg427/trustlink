package com.focuslock.data.local

import androidx.room.Database
import androidx.room.RoomDatabase

@Database(
    entities = [
        AppUsageEntity::class,
        FocusSessionEntity::class,
        TaskEntity::class
    ],
    version = 1,
    exportSchema = false
)
abstract class FocusLockDatabase : RoomDatabase() {
    abstract fun appUsageDao(): AppUsageDao
    abstract fun focusSessionDao(): FocusSessionDao
    abstract fun plannerDao(): PlannerDao
}
