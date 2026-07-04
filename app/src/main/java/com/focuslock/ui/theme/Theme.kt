package com.focuslock.ui.theme

import android.app.Activity
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.SideEffect
import androidx.compose.ui.graphics.toArgb
import androidx.compose.ui.platform.LocalView

private val DarkColorScheme = darkColorScheme(
    primary = Blue200,
    secondary = Purple200,
    tertiary = Cyan500,
    background = DarkBackground,
    surface = DarkSurface,
    onPrimary = DarkBackground,
    onSecondary = DarkBackground,
    onBackground = LightSurface,
    onSurface = LightSurface
)

private val AmoledColorScheme = darkColorScheme(
    primary = Blue200,
    secondary = Purple200,
    tertiary = Cyan500,
    background = AmoledBackground,
    surface = DarkSurface,
    onPrimary = AmoledBackground,
    onSecondary = AmoledBackground,
    onBackground = LightSurface,
    onSurface = LightSurface
)

private val LightColorScheme = lightColorScheme(
    primary = Blue500,
    secondary = Purple500,
    tertiary = Cyan500,
    background = LightSurface,
    surface = androidx.compose.ui.graphics.Color.White,
    onPrimary = androidx.compose.ui.graphics.Color.White,
    onSecondary = androidx.compose.ui.graphics.Color.White,
    onBackground = DarkBackground,
    onSurface = DarkBackground
)

@Composable
fun FocusLockTheme(
    darkTheme: Boolean = isSystemInDarkTheme(),
    amoledMode: Boolean = false,
    content: @Composable () -> Unit
) {
    val colorScheme = when {
        amoledMode -> AmoledColorScheme
        darkTheme -> DarkColorScheme
        else -> LightColorScheme
    }

    val view = LocalView.current
    if (!view.isInEditMode) {
        SideEffect {
            val window = (view.context as Activity).window
            window.statusBarColor = colorScheme.background.toArgb()
        }
    }

    MaterialTheme(
        colorScheme = colorScheme,
        typography = Typography,
        content = content
    )
}
