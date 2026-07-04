package com.focuslock.ui.screens

import androidx.compose.animation.*
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.navigation.NavController
import com.focuslock.domain.model.BlockedApp

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun DashboardScreen(
    navController: NavController,
    viewModel: DashboardViewModel
) {
    val user by viewModel.userState.collectAsState()

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("FocusLock", fontWeight = FontWeight.Bold) },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = MaterialTheme.colorScheme.background
                )
            )
        }
    ) { paddingValues ->
        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
                .background(
                    Brush.verticalGradient(
                        colors = listOf(
                            MaterialTheme.colorScheme.background,
                            MaterialTheme.colorScheme.background.copy(alpha = 0.8f)
                        )
                    )
                )
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            item {
                Text(
                    text = "Good Morning ${user.name} 👋",
                    fontSize = 24.sp,
                    fontWeight = FontWeight.Bold,
                    color = MaterialTheme.colorScheme.primary
                )
            }

            // Stats Cards
            item {
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(24.dp),
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface.copy(alpha = 0.7f))
                ) {
                    Column(
                        modifier = Modifier
                            .padding(20.dp)
                            .fillMaxWidth(),
                        horizontalAlignment = Alignment.CenterHorizontally
                    ) {
                        Text("Remaining Screen Time", fontSize = 14.sp, color = Color.Gray)
                        Spacer(modifier = Modifier.height(8.dp))
                        Text(
                            text = "${user.dailyGoalMinutes - 35} Mins",
                            fontSize = 32.sp,
                            fontWeight = FontWeight.Black,
                            color = MaterialTheme.colorScheme.primary
                        )
                        Spacer(modifier = Modifier.height(8.dp))
                        LinearProgressIndicator(
                            progress = 0.7f,
                            modifier = Modifier
                                .fillMaxWidth()
                                .height(8.dp)
                                .clip(RoundedCornerShape(4.dp)),
                            color = MaterialTheme.colorScheme.secondary
                        )
                    }
                }
            }

            // XP and Focus Coins Grid
            item {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(16.dp)
                ) {
                    Card(
                        modifier = Modifier.weight(1f),
                        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)
                    ) {
                        Column(modifier = Modifier.padding(16.dp)) {
                            Text("Focus Coins", fontSize = 12.sp, color = Color.Gray)
                            Text("🪙 ${user.focusCoins}", fontSize = 20.sp, fontWeight = FontWeight.Bold)
                        }
                    }
                    Card(
                        modifier = Modifier.weight(1f),
                        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)
                    ) {
                        Column(modifier = Modifier.padding(16.dp)) {
                            Text("Current Streak", fontSize = 12.sp, color = Color.Gray)
                            Text("🔥 ${user.currentStreak} Days", fontSize = 20.sp, fontWeight = FontWeight.Bold)
                        }
                    }
                }
            }

            // Quick Actions Title
            item {
                Text("Quick Actions", fontSize = 18.sp, fontWeight = FontWeight.Bold)
            }

            // Quick Actions List
            item {
                Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    val actions = listOf(
                        Triple("Start Focus Session", Icons.Default.Timer, "forest"),
                        Triple("Lock App Settings", Icons.Default.Lock, "lock_settings"),
                        Triple("AI Coach", Icons.Default.Chat, "ai_coach"),
                        Triple("Learning Center", Icons.Default.School, "learning"),
                        Triple("Virtual Pet", Icons.Default.Pets, "pet"),
                        Triple("Focus Wallet", Icons.Default.Wallet, "wallet")
                    )

                    actions.forEach { (title, icon, route) ->
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .clip(RoundedCornerShape(16.dp))
                                .background(MaterialTheme.colorScheme.surface)
                                .clickable { navController.navigate(route) }
                                .padding(16.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Icon(icon, contentDescription = title, tint = MaterialTheme.colorScheme.primary)
                            Spacer(modifier = Modifier.width(16.dp))
                            Text(title, fontWeight = FontWeight.Medium, modifier = Modifier.weight(1f))
                            Icon(Icons.Default.ChevronRight, contentDescription = "Go", tint = Color.Gray)
                        }
                    }
                }
            }
        }
    }
}

@Composable
fun LockOverlayScreen(
    packageName: String,
    viewModel: LearningViewModel,
    appLockViewModel: AppLockViewModel,
    onUnlockComplete: () -> Unit
) {
    var step by remember { mutableStateOf("choices") } // choices, quiz, coins, waiting
    val question by viewModel.currentQuestion.collectAsState()
    val explanationShow by viewModel.showExplanation.collectAsState()
    val answerIndex by viewModel.selectedAnswerIndex.collectAsState()

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(Color(0xFF0F172A)),
        contentAlignment = Alignment.Center
    ) {
        Column(
            modifier = Modifier.padding(24.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            Icon(Icons.Default.Lock, contentDescription = "Locked", tint = Color(0xFFEF4444), modifier = Modifier.size(64.dp))
            Text("FocusLock Secured", fontSize = 24.sp, fontWeight = FontWeight.Bold, color = Color.White)
            Text(
                "You have locked access to $packageName. Keep focusing, or select a digital wellness option to unlock temporarily.",
                color = Color.LightGray,
                textAlign = TextAlign.Center,
                fontSize = 14.sp
            )

            Spacer(modifier = Modifier.height(16.dp))

            when (step) {
                "choices" -> {
                    Button(
                        onClick = {
                            viewModel.loadRandomQuestion()
                            step = "quiz"
                        },
                        modifier = Modifier.fillMaxWidth(),
                        colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF2563EB))
                    ) {
                        Text("Unlock by Answering Quiz")
                    }

                    Button(
                        onClick = {
                            step = "coins"
                        },
                        modifier = Modifier.fillMaxWidth(),
                        colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF7C3AED))
                    ) {
                        Text("Unlock with 20 Focus Coins")
                    }

                    Button(
                        onClick = {
                            step = "waiting"
                        },
                        modifier = Modifier.fillMaxWidth(),
                        colors = ButtonDefaults.buttonColors(containerColor = Color.DarkGray)
                    ) {
                        Text("Wait for 60 Second Countdown")
                    }
                }

                "quiz" -> {
                    question?.let { q ->
                        Text(q.questionText, color = Color.White, fontWeight = FontWeight.Bold, fontSize = 18.sp)
                        q.options.forEachIndexed { idx, option ->
                            Button(
                                onClick = { viewModel.selectAnswer(idx) },
                                modifier = Modifier.fillMaxWidth(),
                                colors = ButtonDefaults.buttonColors(
                                    containerColor = if (answerIndex == idx) {
                                        if (idx == q.correctAnswerIndex) Color(0xFF10B981) else Color(0xFFEF4444)
                                    } else Color(0xFF1E293B)
                                )
                            ) {
                                Text(option)
                            }
                        }

                        if (explanationShow) {
                            Text(q.explanation, color = Color.LightGray, fontSize = 12.sp)
                            Spacer(modifier = Modifier.height(8.dp))
                            if (answerIndex == q.correctAnswerIndex) {
                                Button(onClick = {
                                    viewModel.completeQuizUnlock(packageName)
                                    onUnlockComplete()
                                }) {
                                    Text("Proceed to App")
                                }
                            } else {
                                Button(onClick = { step = "choices" }) {
                                    Text("Try Again")
                                }
                            }
                        }
                    }
                }

                "coins" -> {
                    Text("Redeem 20 coins to lift block?", color = Color.White)
                    Row(horizontalArrangement = Arrangement.spacedBy(16.dp)) {
                        Button(onClick = {
                            viewModel.completeQuizUnlock(packageName)
                            onUnlockComplete()
                        }) {
                            Text("Confirm")
                        }
                        Button(onClick = { step = "choices" }) {
                            Text("Cancel")
                        }
                    }
                }

                "waiting" -> {
                    var countdown by remember { mutableStateOf(60) }
                    LaunchedEffect(Unit) {
                        while (countdown > 0) {
                            kotlinx.coroutines.delay(1000)
                            countdown--
                        }
                        viewModel.completeQuizUnlock(packageName)
                        onUnlockComplete()
                    }
                    Text("Unlocking in $countdown seconds...", color = Color.White, fontSize = 20.sp)
                }
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AICoachScreen(
    navController: NavController,
    viewModel: AICoachViewModel
) {
    val chatLog by viewModel.chatLog.collectAsState()
    var userText by remember { mutableStateOf("") }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("AI Focus Coach") },
                navigationIcon = {
                    IconButton(onClick = { navController.popBackStack() }) {
                        Icon(Icons.Default.ArrowBack, contentDescription = "Back")
                    }
                }
            )
        }
    ) { padding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .background(MaterialTheme.colorScheme.background)
        ) {
            LazyColumn(
                modifier = Modifier
                    .weight(1f)
                    .padding(16.dp),
                verticalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                items(chatLog) { (msg, isUser) ->
                    Box(
                        modifier = Modifier.fillMaxWidth(),
                        contentAlignment = if (isUser) Alignment.CenterEnd else Alignment.CenterStart
                    ) {
                        Card(
                            colors = CardDefaults.cardColors(
                                containerColor = if (isUser) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.surface
                            ),
                            shape = RoundedCornerShape(12.dp)
                        ) {
                            Text(msg, modifier = Modifier.padding(12.dp), color = if (isUser) Color.White else Color.Black)
                        }
                    }
                }
            }

            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(8.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                TextField(
                    value = userText,
                    onValueChange = { userText = it },
                    modifier = Modifier.weight(1f),
                    placeholder = { Text("Ask Coach...") }
                )
                Spacer(modifier = Modifier.width(8.dp))
                IconButton(onClick = {
                    if (userText.isNotEmpty()) {
                        viewModel.sendMessage(userText, 5, 45)
                        userText = ""
                    }
                }) {
                    Icon(Icons.Default.Send, contentDescription = "Send")
                }
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun FocusForestScreen(
    navController: NavController,
    viewModel: ForestViewModel
) {
    var duration by remember { mutableStateOf(25) }
    var selectedTree by remember { mutableStateOf("Oak") }
    val activeSession by viewModel.activeSession.collectAsState()

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Focus Forest") },
                navigationIcon = {
                    IconButton(onClick = { navController.popBackStack() }) {
                        Icon(Icons.Default.ArrowBack, contentDescription = "Back")
                    }
                }
            )
        }
    ) { padding ->
        Box(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .background(Brush.verticalGradient(listOf(Color(0xFFE2F1E8), Color(0xFFB5D3C1)))),
            contentAlignment = Alignment.Center
        ) {
            Column(
                horizontalAlignment = Alignment.CenterHorizontally,
                verticalArrangement = Arrangement.spacedBy(16.dp)
            ) {
                if (activeSession == null) {
                    Text("Grow a New Tree", fontSize = 24.sp, fontWeight = FontWeight.Bold, color = Color(0xFF1B3D2F))
                    
                    Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        listOf("Oak", "Pine", "Maple", "Cherry").forEach { tree ->
                            Button(
                                onClick = { selectedTree = tree },
                                colors = ButtonDefaults.buttonColors(
                                    containerColor = if (selectedTree == tree) Color(0xFF1E5F3F) else Color.Gray
                                )
                            ) {
                                Text(tree)
                            }
                        }
                    }

                    Slider(
                        value = duration.toFloat(),
                        onValueChange = { duration = it.toInt() },
                        valueRange = 5f..120f,
                        steps = 23,
                        modifier = Modifier.padding(horizontal = 24.dp)
                    )
                    Text("Focus Duration: $duration Minutes", fontWeight = FontWeight.Bold)

                    Button(
                        onClick = { viewModel.startSession(duration, selectedTree) },
                        colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF1E5F3F))
                    ) {
                        Text("Start Growing")
                    }
                } else {
                    Text("🌳 Growing your $selectedTree Tree...", fontSize = 22.sp, fontWeight = FontWeight.Bold, color = Color(0xFF1B3D2F))
                    Text("Coins & XP will be credited upon completion.", color = Color.DarkGray)
                    
                    Button(onClick = { viewModel.clearSession() }) {
                        Text("Reset Forest")
                    }
                }
            }
        }
    }
}

// Fallback skeleton UI screens for other modules
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun PlaceholderScreen(title: String, navController: NavController) {
    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text(title) },
                navigationIcon = {
                    IconButton(onClick = { navController.popBackStack() }) {
                        Icon(Icons.Default.ArrowBack, contentDescription = "Back")
                    }
                }
            )
        }
    ) { padding ->
        Box(modifier = Modifier.fillMaxSize().padding(padding), contentAlignment = Alignment.Center) {
            Column(horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.spacedBy(8.dp)) {
                Icon(Icons.Default.Settings, contentDescription = title, modifier = Modifier.size(48.dp), tint = Color.Gray)
                Text("$title interface placeholder.", fontSize = 16.sp, color = Color.Gray)
            }
        }
    }
}
