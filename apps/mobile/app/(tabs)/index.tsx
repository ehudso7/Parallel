import { View, Text, ScrollView, Pressable, StyleSheet, Dimensions } from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/providers/AuthProvider';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width * 0.7;

export default function HomeScreen() {
  const { user, profile } = useAuth();

  const personas = [
    { id: '1', name: 'Luna', type: 'Companion', avatar: null, color: ['#8b5cf6', '#d946ef'] },
    { id: '2', name: 'Max', type: 'Mentor', avatar: null, color: ['#06b6d4', '#3b82f6'] },
    { id: '3', name: 'Aria', type: 'Creative', avatar: null, color: ['#f59e0b', '#ef4444'] },
  ];

  const worlds = [
    { id: '1', name: 'Cyber Tokyo', theme: 'cyberpunk', image: null },
    { id: '2', name: 'Monte Carlo', theme: 'luxury', image: null },
    { id: '3', name: 'Space Opera', theme: 'sci-fi', image: null },
  ];

  const quickActions = [
    { id: 'chat', icon: 'chatbubble', label: 'Chat', color: '#8b5cf6' },
    { id: 'create', icon: 'sparkles', label: 'Create', color: '#d946ef' },
    { id: 'music', icon: 'musical-notes', label: 'Music', color: '#06b6d4' },
    { id: 'video', icon: 'videocam', label: 'Video', color: '#f59e0b' },
  ];

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#0f0a1e', '#1a0f2e', '#0f0a1e']}
        style={StyleSheet.absoluteFill}
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <Animated.View entering={FadeInDown.delay(100)} style={styles.header}>
          <View>
            <Text style={styles.greeting}>Welcome back,</Text>
            <Text style={styles.name}>{profile?.display_name || 'Explorer'}</Text>
          </View>
          <Pressable style={styles.notificationButton}>
            <Ionicons name="notifications-outline" size={24} color="white" />
            <View style={styles.notificationDot} />
          </Pressable>
        </Animated.View>

        {/* Credits Banner */}
        <Animated.View entering={FadeInDown.delay(200)}>
          <Pressable onPress={() => router.push('/subscription')}>
            <LinearGradient
              colors={['rgba(139, 92, 246, 0.2)', 'rgba(217, 70, 239, 0.2)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.creditsBanner}
            >
              <View style={styles.creditsInfo}>
                <Ionicons name="sparkles" size={20} color="#8b5cf6" />
                <Text style={styles.creditsText}>
                  {profile?.credits_balance || 0} credits remaining
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="rgba(255,255,255,0.4)" />
            </LinearGradient>
          </Pressable>
        </Animated.View>

        {/* Quick Actions */}
        <Animated.View entering={FadeInDown.delay(300)} style={styles.quickActions}>
          {quickActions.map((action) => (
            <Pressable key={action.id} style={styles.quickAction}>
              <View style={[styles.quickActionIcon, { backgroundColor: `${action.color}20` }]}>
                <Ionicons name={action.icon as any} size={24} color={action.color} />
              </View>
              <Text style={styles.quickActionLabel}>{action.label}</Text>
            </Pressable>
          ))}
        </Animated.View>

        {/* Your Companions */}
        <Animated.View entering={FadeInDown.delay(400)}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Your Companions</Text>
            <Pressable>
              <Text style={styles.seeAll}>See all</Text>
            </Pressable>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalScroll}
          >
            {personas.map((persona, index) => (
              <Pressable
                key={persona.id}
                style={styles.personaCard}
                onPress={() => router.push(`/chat/${persona.id}`)}
              >
                <LinearGradient
                  colors={persona.color}
                  style={styles.personaAvatar}
                >
                  <Text style={styles.personaInitial}>{persona.name[0]}</Text>
                </LinearGradient>
                <Text style={styles.personaName}>{persona.name}</Text>
                <Text style={styles.personaType}>{persona.type}</Text>
              </Pressable>
            ))}

            {/* Add New Persona */}
            <Pressable
              style={styles.addPersonaCard}
              onPress={() => router.push('/create')}
            >
              <View style={styles.addPersonaIcon}>
                <Ionicons name="add" size={32} color="rgba(255,255,255,0.4)" />
              </View>
              <Text style={styles.addPersonaText}>Create New</Text>
            </Pressable>
          </ScrollView>
        </Animated.View>

        {/* Parallel Worlds */}
        <Animated.View entering={FadeInDown.delay(500)}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Parallel Worlds</Text>
            <Pressable>
              <Text style={styles.seeAll}>Explore</Text>
            </Pressable>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalScroll}
            snapToInterval={CARD_WIDTH + 16}
            decelerationRate="fast"
          >
            {worlds.map((world, index) => (
              <Pressable
                key={world.id}
                style={styles.worldCard}
                onPress={() => router.push(`/world/${world.id}`)}
              >
                <LinearGradient
                  colors={['rgba(139, 92, 246, 0.5)', 'rgba(217, 70, 239, 0.3)']}
                  style={styles.worldGradient}
                >
                  <View style={styles.worldContent}>
                    <Text style={styles.worldName}>{world.name}</Text>
                    <Text style={styles.worldTheme}>{world.theme}</Text>
                  </View>
                </LinearGradient>
              </Pressable>
            ))}
          </ScrollView>
        </Animated.View>

        {/* Daily Streak */}
        <Animated.View entering={FadeInDown.delay(600)}>
          <View style={styles.streakCard}>
            <View style={styles.streakHeader}>
              <Ionicons name="flame" size={24} color="#f59e0b" />
              <Text style={styles.streakTitle}>Daily Streak</Text>
            </View>
            <View style={styles.streakContent}>
              <Text style={styles.streakCount}>{profile?.current_streak || 0}</Text>
              <Text style={styles.streakLabel}>days</Text>
            </View>
            <Text style={styles.streakSubtext}>Keep chatting to maintain your streak!</Text>
          </View>
        </Animated.View>

        {/* Bottom spacing for tab bar */}
        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 60,
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  greeting: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.6)',
  },
  name: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
  },
  notificationButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationDot: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ef4444',
  },
  creditsBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.3)',
  },
  creditsInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  creditsText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 32,
  },
  quickAction: {
    alignItems: 'center',
    gap: 8,
  },
  quickActionIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quickActionLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
  seeAll: {
    fontSize: 14,
    color: '#8b5cf6',
  },
  horizontalScroll: {
    paddingRight: 20,
    marginBottom: 32,
  },
  personaCard: {
    alignItems: 'center',
    marginRight: 16,
    width: 80,
  },
  personaAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  personaInitial: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  personaName: {
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
  },
  personaType: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.4)',
  },
  addPersonaCard: {
    alignItems: 'center',
    width: 80,
  },
  addPersonaIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  addPersonaText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.4)',
  },
  worldCard: {
    width: CARD_WIDTH,
    height: 160,
    borderRadius: 20,
    overflow: 'hidden',
    marginRight: 16,
  },
  worldGradient: {
    flex: 1,
    justifyContent: 'flex-end',
    padding: 20,
  },
  worldContent: {},
  worldName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  worldTheme: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.6)',
    textTransform: 'capitalize',
  },
  streakCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  streakHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  streakTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  streakContent: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
    marginBottom: 8,
  },
  streakCount: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#f59e0b',
  },
  streakLabel: {
    fontSize: 20,
    color: 'rgba(255, 255, 255, 0.6)',
  },
  streakSubtext: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.4)',
  },
});
