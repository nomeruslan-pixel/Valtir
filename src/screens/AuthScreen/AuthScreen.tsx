import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { api } from '../../api/client';
import { useAuthStore } from '../../features/auth/store/useAuthStore';
import { useThemeColors } from '../../theme/useThemeColors';

export const AuthScreen = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [loading, setLoading] = useState(false);
  const colors = useThemeColors();
  const setToken = useAuthStore((state) => state.setToken);

  const handleSubmit = async () => {
    if (!email || !password || (!isLogin && !companyName)) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }
    
    setLoading(true);
    try {
      if (isLogin) {
        const formData = new URLSearchParams();
        formData.append('username', email);
        formData.append('password', password);
        
        const response = await api.post('/api/auth/login', formData.toString(), {
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        });
        await setToken(response.data.access_token);
      } else {
        await api.post('/api/auth/register', {
          email,
          password,
          company_name: companyName
        });
        
        const formData = new URLSearchParams();
        formData.append('username', email);
        formData.append('password', password);
        const loginResponse = await api.post('/api/auth/login', formData.toString(), {
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        });
        await setToken(loginResponse.data.access_token);
      }
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.detail || 'Authentication failed. Check your API URL.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.content}>
        <Text style={[styles.title, { color: colors.foreground }]}>
          {isLogin ? 'Welcome Back' : 'Create Account'}
        </Text>
        <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
          {isLogin ? 'Sign in to access your inventory' : 'Set up your company workspace'}
        </Text>

        {!isLogin && (
          <TextInput
            style={[styles.input, { backgroundColor: colors.card, color: colors.foreground, borderColor: colors.border }]}
            placeholder="Company Name"
            placeholderTextColor={colors.mutedForeground}
            value={companyName}
            onChangeText={setCompanyName}
          />
        )}
        
        <TextInput
          style={[styles.input, { backgroundColor: colors.card, color: colors.foreground, borderColor: colors.border }]}
          placeholder="Email"
          placeholderTextColor={colors.mutedForeground}
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
        />
        
        <TextInput
          style={[styles.input, { backgroundColor: colors.card, color: colors.foreground, borderColor: colors.border }]}
          placeholder="Password"
          placeholderTextColor={colors.mutedForeground}
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />

        <TouchableOpacity 
          style={[styles.button, { backgroundColor: colors.primary }]}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={colors.primaryForeground} />
          ) : (
            <Text style={[styles.buttonText, { color: colors.primaryForeground }]}>
              {isLogin ? 'Sign In' : 'Register'}
            </Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => setIsLogin(!isLogin)} style={styles.switchButton}>
          <Text style={[styles.switchText, { color: colors.primary }]}>
            {isLogin ? "Don't have an account? Register" : 'Already have an account? Sign in'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 32,
  },
  input: {
    height: 56,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    marginBottom: 16,
    fontSize: 16,
  },
  button: {
    height: 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  switchButton: {
    marginTop: 24,
    alignItems: 'center',
  },
  switchText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
