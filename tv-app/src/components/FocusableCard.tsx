import React, { useRef, useState } from 'react';
import {
  Animated,
  StyleSheet,
  TouchableHighlight,
  View,
  Text,
  TVFocusGuideView,
} from 'react-native';
import FastImage from 'react-native-fast-image';

interface FocusableCardProps {
  title: string;
  imageUri?: string;
  subtitle?: string;
  width?: number;
  height?: number;
  onPress: () => void;
  onFocus?: () => void;
}

export default function FocusableCard({
  title,
  imageUri,
  subtitle,
  width = 160,
  height = 240,
  onPress,
  onFocus,
}: FocusableCardProps) {
  const [focused, setFocused] = useState(false);
  const scale = useRef(new Animated.Value(1)).current;

  function handleFocus() {
    setFocused(true);
    onFocus?.();
    Animated.spring(scale, { toValue: 1.08, useNativeDriver: true, speed: 20 }).start();
  }

  function handleBlur() {
    setFocused(false);
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 20 }).start();
  }

  return (
    <TVFocusGuideView style={{ marginHorizontal: 6 }}>
      <TouchableHighlight
        onPress={onPress}
        onFocus={handleFocus}
        onBlur={handleBlur}
        underlayColor="transparent"
        hasTVPreferredFocus={false}
      >
        <Animated.View
          style={[
            styles.card,
            { width, height: height + 48 },
            { transform: [{ scale }] },
            focused && styles.cardFocused,
          ]}
        >
          {imageUri ? (
            <FastImage
              source={{ uri: imageUri, priority: FastImage.priority.normal }}
              style={{ width, height }}
              resizeMode={FastImage.resizeMode.cover}
            />
          ) : (
            <View style={[styles.placeholder, { width, height }]}>
              <Text style={styles.placeholderText} numberOfLines={2}>
                {title}
              </Text>
            </View>
          )}
          <View style={styles.info}>
            <Text style={styles.title} numberOfLines={1}>
              {title}
            </Text>
            {subtitle ? (
              <Text style={styles.subtitle} numberOfLines={1}>
                {subtitle}
              </Text>
            ) : null}
          </View>
        </Animated.View>
      </TouchableHighlight>
    </TVFocusGuideView>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#1a1a2e',
  },
  cardFocused: {
    borderWidth: 3,
    borderColor: '#e50914',
  },
  placeholder: {
    backgroundColor: '#2a2a3e',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
  },
  placeholderText: {
    color: '#aaa',
    textAlign: 'center',
    fontSize: 12,
  },
  info: {
    paddingHorizontal: 6,
    paddingTop: 6,
  },
  title: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  subtitle: {
    color: '#888',
    fontSize: 11,
    marginTop: 2,
  },
});
