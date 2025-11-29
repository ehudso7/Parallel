import { View, Text, Pressable, StyleSheet, Dimensions } from 'react-native';
import { Link, router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useAuth } from '@/providers/AuthProvider';
import { useEffect } from 'react';

const { width, height } = Dimensions.get('window');

export default function WelcomeScreen() {
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && user) {
      router.replace('/(tabs)');
    }
  }, [user, loading]);

  if (loading) {
    return (
      <View style={styles.container}>
        <LinearGradient
          colors={['#0f0a1e', '#1a0f2e', '#0f0a1e']}
          style={StyleSheet.absoluteFill}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#0f0a1e', '#1a0f2e', '#0f0a1e']}
        style={StyleSheet.absoluteFill}
      />

      {/* Background orbs */}
      <View style={styles.orbContainer}>
        <LinearGradient
          colors={['rgba(139, 92, 246, 0.3)', 'transparent']}
          style={[styles.orb, { top: -100, left: -100 }]}
        />
        <LinearGradient
          colors={['rgba(217, 70, 239, 0.2)', 'transparent']}
          style={[styles.orb, { bottom: -50, right: -100 }]}
        />
      </View>

      <View style={styles.content}>
        {/* Logo */}
        <Animated.View entering={FadeInDown.delay(200)} style={styles.logoContainer}>
          <LinearGradient
            colors={['#8b5cf6', '#d946ef']}
            style={styles.logoGradient}
          >
            <Text style={styles.logoText}>P</Text>
          </LinearGradient>
        </Animated.View>

        {/* Title */}
        <Animated.View entering={FadeInDown.delay(400)}>
          <Text style={styles.title}>Parallel</Text>
          <Text style={styles.subtitle}>Your AI Multiverse Companion</Text>
        </Animated.View>

        {/* Features */}
        <Animated.View entering={FadeInDown.delay(600)} style={styles.features}>
          <View style={styles.feature}>
            <Text style={styles.featureIcon}>✨</Text>
            <Text style={styles.featureText}>Create AI companions</Text>
          </View>
          <View style={styles.feature}>
            <Text style={styles.featureIcon}>🎨</Text>
            <Text style={styles.featureText}>Generate music, art & videos</Text>
          </View>
          <View style={styles.feature}>
            <Text style={styles.featureIcon}>🌍</Text>
            <Text style={styles.featureText}>Explore parallel worlds</Text>
          </View>
        </Animated.View>

        {/* CTA Buttons */}
        <Animated.View entering={FadeInDown.delay(800)} style={styles.buttons}>
          <Pressable
            style={styles.primaryButton}
            onPress={() => router.push('/(auth)/signup')}
          >
            <LinearGradient
              colors={['#8b5cf6', '#d946ef']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.buttonGradient}
            >
              <Text style={styles.primaryButtonText}>Get Started</Text>
            </LinearGradient>
          </Pressable>

          <Pressable
            style={styles.secondaryButton}
            onPress={() => router.push('/(auth)/login')}
          >
            <Text style={styles.secondaryButtonText}>I already have an account</Text>
          </Pressable>
        </Animated.View>

        {/* Terms */}
        <Animated.View entering={FadeInDown.delay(1000)}>
          <Text style={styles.terms}>
            By continuing, you agree to our{' '}
            <Text style={styles.link}>Terms of Service</Text> and{' '}
            <Text style={styles.link}>Privacy Policy</Text>
          </Text>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  orbContainer: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  orb: {
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: 150,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  logoContainer: {
    marginBottom: 24,
  },
  logoGradient: {
    width: 80,
    height: 80,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoText: {
    fontSize: 40,
    fontWeight: 'bold',
    color: 'white',
  },
  title: {
    fontSize: 42,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 18,
    color: 'rgba(255, 255, 255, 0.6)',
    textAlign: 'center',
    marginTop: 8,
  },
  features: {
    marginTop: 48,
    marginBottom: 48,
    gap: 16,
  },
  feature: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  featureIcon: {
    fontSize: 24,
  },
  featureText: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  buttons: {
    width: '100%',
    gap: 16,
  },
  primaryButton: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  buttonGradient: {
    paddingVertical: 18,
    alignItems: 'center',
  },
  primaryButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
  },
  secondaryButton: {
    paddingVertical: 18,
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  secondaryButtonText: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  terms: {
    marginTop: 32,
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.4)',
    textAlign: 'center',
    lineHeight: 18,
  },
  link: {
    color: '#8b5cf6',
  },
});
