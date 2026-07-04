package com.focuslock.di

import android.content.Context
import androidx.room.Room
import com.focuslock.data.local.*
import com.focuslock.data.repository.*
import com.focuslock.domain.repository.*
import dagger.Binds
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.android.qualifiers.ApplicationContext
import dagger.hilt.components.SingletonComponent
import javax.inject.Singleton

@Module
@InstallIn(SingletonComponent::class)
abstract class RepositoryModule {

    @Binds
    @Singleton
    abstract fun bindUserRepository(
        userRepositoryImpl: UserRepositoryImpl
    ): UserRepository

    @Binds
    @Singleton
    abstract fun bindAppLockRepository(
        appLockRepositoryImpl: AppLockRepositoryImpl
    ): AppLockRepository

    @Binds
    @Singleton
    abstract fun bindFocusSessionRepository(
        focusSessionRepositoryImpl: FocusSessionRepositoryImpl
    ): FocusSessionRepository

    @Binds
    @Singleton
    abstract fun bindLearningRepository(
        learningRepositoryImpl: LearningRepositoryImpl
    ): LearningRepository
}

@Module
@InstallIn(SingletonComponent::class)
object DatabaseModule {

    @Provides
    @Singleton
    fun provideDatabase(@ApplicationContext context: Context): FocusLockDatabase {
        return Room.databaseBuilder(
            context,
            FocusLockDatabase::class.java,
            "focuslock_db"
        ).fallbackToDestructiveMigration().build()
    }

    @Provides
    fun provideAppUsageDao(database: FocusLockDatabase): AppUsageDao {
        return database.appUsageDao()
    }

    @Provides
    fun provideFocusSessionDao(database: FocusLockDatabase): FocusSessionDao {
        return database.focusSessionDao()
    }

    @Provides
    fun providePlannerDao(database: FocusLockDatabase): PlannerDao {
        return database.plannerDao()
    }
}
