import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableHighlight,
  ActivityIndicator,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { login } from '@/api/client';

interface Props {
  onSuccess: () => void;
}

export default function LoginScreen({ onSuccess }: Props) {
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const codeRef = useRef<TextInput>(null);

  async function handleLogin() {
    if (!phone.trim() || !code.trim()) {
      setError('Enter your phone number and access code.');
      return;
    }
    setLoading(true);
    setError(null);
    const result = await login(phone.trim(), code.trim());
    setLoading(false);
    if (result.ok) {
      onSuccess();
    } else {
      setError(result.error ?? 'Login failed. Check your credentials.');
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.card}>
        <Text style={styles.logo}>🎬 GameStop Movies</Text>
        <Text style={styles.subtitle}>Sign in to your account</Text>

        <Text style={styles.label}>Phone Number</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. 0712 345 678"
          placeholderTextColor="#555"
          keyboardType="phone-pad"
          value={phone}
          onChangeText={setPhone}
          onSubmitEditing={() => codeRef.current?.focus()}
          returnKeyType="next"
          autoFocus
        />

        <Text style={styles.label}>Access Code</Text>
        <TextInput
          ref={codeRef}
          style={styles.input}
          placeholder="Access code"
          placeholderTextColor="#555"
          secureTextEntry
          autoCapitalize="characters"
          value={code}
          onChangeText={setCode}
          onSubmitEditing={handleLogin}
          returnKeyType="done"
        />

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <TouchableHighlight
          style={styles.btn}
          underlayColor="#cc0000"
          onPress={handleLogin}
          disabled={loading}
          hasTVPreferredFocus
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.btnText}>Sign In</Text>
          )}
        </TouchableHighlight>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    width: 480,
    backgroundColor: '#111',
    borderRadius: 12,
    padding: 48,
  },
  logo: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    color: '#888',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 32,
  },
  label: {
    color: '#ccc',
    fontSize: 14,
    marginBottom: 6,
    marginTop: 16,
  },
  input: {
    backgroundColor: '#1e1e1e',
    color: '#fff',
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 6,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
  },
  error: {
    color: '#e50914',
    fontSize: 14,
    marginTop: 12,
    textAlign: 'center',
  },
  btn: {
    backgroundColor: '#e50914',
    borderRadius: 6,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 28,
  },
  btnText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
  },
});
