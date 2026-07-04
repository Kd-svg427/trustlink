package com.focuslock.ui.screens

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.focuslock.domain.model.*
import com.focuslock.domain.repository.*
import com.focuslock.domain.usecase.*
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class DashboardViewModel @Inject constructor(
    private val userRepository: UserRepository,
    private val appLockRepository: AppLockRepository
) : ViewModel() {

    private val _userState = MutableStateFlow(User())
    val userState: StateFlow<User> = _userState.asStateFlow()

    init {
        viewModelScope.launch {
            userRepository.getUserProfile("test_user_id").collect { user ->
                if (user != null) {
                    _userState.value = user
                }
            }
        }
    }

    fun completeChallenge(coins: Int, xp: Int) {
        viewModelScope.launch {
            userRepository.updateCoinsAndXp("test_user_id", coins, xp)
        }
    }
}

@HiltViewModel
class AppLockViewModel @Inject constructor(
    private val appLockRepository: AppLockRepository,
    private val unlockAppUseCase: UnlockAppUseCase
) : ViewModel() {

    val blockedApps: StateFlow<List<BlockedApp>> = appLockRepository.getBlockedApps()
        .stateIn(viewModelScope, SharingStarted.Lazily, emptyList())

    fun updateUsage(packageName: String, minutes: Int) {
        viewModelScope.launch {
            appLockRepository.updateAppUsage(packageName, minutes)
        }
    }

    fun setLockLimit(packageName: String, appName: String, limitMinutes: Int) {
        viewModelScope.launch {
            val app = BlockedApp(
                packageName = packageName,
                appName = appName,
                dailyLimitMinutes = limitMinutes,
                isLocked = false
            )
            appLockRepository.saveBlockedApp(app)
        }
    }

    fun unlockWithCoins(app: BlockedApp, onComplete: (Boolean) -> Unit) {
        viewModelScope.launch {
            val success = unlockAppUseCase.unlockWithCoins("test_user_id", app)
            onComplete(success)
        }
    }
}

@HiltViewModel
class LearningViewModel @Inject constructor(
    private val learningRepository: LearningRepository,
    private val unlockAppUseCase: UnlockAppUseCase
) : ViewModel() {

    private val _currentQuestion = MutableStateFlow<QuizQuestion?>(null)
    val currentQuestion: StateFlow<QuizQuestion?> = _currentQuestion.asStateFlow()

    private val _selectedAnswerIndex = MutableStateFlow<Int?>(null)
    val selectedAnswerIndex: StateFlow<Int?> = _selectedAnswerIndex.asStateFlow()

    private val _showExplanation = MutableStateFlow(false)
    val showExplanation: StateFlow<Boolean> = _showExplanation.asStateFlow()

    fun loadRandomQuestion() {
        viewModelScope.launch {
            _currentQuestion.value = learningRepository.getRandomQuestion()
            _selectedAnswerIndex.value = null
            _showExplanation.value = false
        }
    }

    fun selectAnswer(index: Int) {
        _selectedAnswerIndex.value = index
        _showExplanation.value = true
        val q = _currentQuestion.value ?: return
        val isCorrect = index == q.correctAnswerIndex
        viewModelScope.launch {
            learningRepository.recordQuizPerformance(q.category, isCorrect)
        }
    }

    fun completeQuizUnlock(packageName: String) {
        viewModelScope.launch {
            unlockAppUseCase.unlockWithQuiz(packageName)
        }
    }
}

@HiltViewModel
class ForestViewModel @Inject constructor(
    private val growForestTreeUseCase: GrowForestTreeUseCase
) : ViewModel() {

    private val _activeSession = MutableStateFlow<FocusSession?>(null)
    val activeSession: StateFlow<FocusSession?> = _activeSession.asStateFlow()

    fun startSession(durationMinutes: Int, treeType: String) {
        viewModelScope.launch {
            val session = growForestTreeUseCase("test_user_id", durationMinutes, treeType)
            _activeSession.value = session
        }
    }

    fun clearSession() {
        _activeSession.value = null
    }
}

@HiltViewModel
class AICoachViewModel @Inject constructor(
    private val getAICoachResponseUseCase: GetAICoachResponseUseCase
) : ViewModel() {

    private val _chatLog = MutableStateFlow<List<Pair<String, Boolean>>>(
        listOf("Hello! I am your AI Coach. How are you feeling today?" to false)
    )
    val chatLog: StateFlow<List<Pair<String, Boolean>>> = _chatLog.asStateFlow()

    fun sendMessage(msg: String, streak: Int, screenTime: Int) {
        val currentLog = _chatLog.value.toMutableList()
        currentLog.add(msg to true) // user message
        _chatLog.value = currentLog

        val reply = getAICoachResponseUseCase(msg, streak, screenTime)
        
        viewModelScope.launch {
            kotlinx.coroutines.delay(800) // Realistic typing delay
            val updatedLog = _chatLog.value.toMutableList()
            updatedLog.add(reply to false) // coach response
            _chatLog.value = updatedLog
        }
    }
}
