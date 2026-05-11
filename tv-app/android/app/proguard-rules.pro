# React Native
-keep class com.facebook.react.** { *; }
-keep class com.facebook.hermes.** { *; }
-keep class com.facebook.jni.** { *; }
-dontwarn com.facebook.**

# Keep app entry points
-keep class ke.co.gamestop.movies.** { *; }

# Kotlin
-dontwarn kotlin.**
-keep class kotlin.** { *; }

# OkHttp (networking)
-dontwarn okhttp3.**
-dontwarn okio.**

# React Native Video
-keep class com.brentvatne.** { *; }
