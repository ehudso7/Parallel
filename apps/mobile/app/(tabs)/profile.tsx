import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/providers/AuthProvider';

const menuItems = [
  { id: 'subscription', icon: 'diamond', label: 'Subscription', color: '#8b5cf6', route: '/subscription' },
  { id: 'credits', icon: 'sparkles', label: 'Credits & Purchases', color: '#f59e0b', route: '/credits' },
  { id: 'creations', icon: 'images', label: 'My Creations', color: '#06b6d4', route: '/creations' },
  { id: 'personas', icon: 'people', label: 'My Personas', color: '#d946ef', route: '/personas' },
  { id: 'achievements', icon: 'trophy', label: 'Achievements', color: '#10b981', route: '/achievements' },
  { id: 'referrals', icon: 'gift', label: 'Referrals', color: '#ef4444', route: '/referrals' },
];

const settingsItems = [
  { id: 'account', icon: 'person-circle', label: 'Account Settings', route: '/settings/account' },
  { id: 'notifications', icon: 'notifications', label: 'Notifications', route: '/settings/notifications' },
  { id: 'privacy', icon: 'shield-checkmark', label: 'Privacy & Security', route: '/settings/privacy' },
  { id: 'appearance', icon: 'color-palette', label: 'Appearance', route: '/settings/appearance' },
  { id: 'help', icon: 'help-circle', label: 'Help & Support', route: '/settings/help' },
  { id: 'about', icon: 'information-circle', label: 'About', route: '/settings/about' },
];

export default function ProfileScreen() {
  const { user, profile, signOut } = useAuth();

  const stats = [
    { label: 'Streak', value: profile?.current_streak || 0, icon: 'flame', color: '#f59e0b' },
    { label: 'Credits', value: profile?.credits_balance || 0, icon: 'sparkles', color: '#8b5cf6' },
    { label: 'Creations', value: 24, icon: 'images', color: '#06b6d4' },
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
          <LinearGradient
            colors={['#8b5cf6', '#d946ef']}
            style={styles.avatar}
          >
            <Text style={styles.avatarText}>
              {profile?.display_name?.[0] || user?.email?.[0] || '?'}
            </Text>
          </LinearGradient>
          <Text style={styles.name}>{profile?.display_name || 'Anonymous'}</Text>
          <Text style={styles.username}>@{profile?.username || 'user'}</Text>

          {profile?.subscription_tier !== 'free' && (
            <View style={styles.premiumBadge}>
              <Ionicons name="diamond" size={14} color="#8b5cf6" />
              <Text style={styles.premiumText}>{profile?.subscription_tier} Member</Text>
            </View>
          )}
        </Animated.View>

        {/* Stats */}
        <Animated.View entering={FadeInDown.delay(200)} style={styles.statsContainer}>
          {stats.map((stat) => (
            <View key={stat.label} style={styles.statCard}>
              <Ionicons name={stat.icon as any} size={24} color={stat.color} />
              <Text style={styles.statValue}>{stat.value}</Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
            </View>
          ))}
        </Animated.View>

        {/* Menu Items */}
        <Animated.View entering={FadeInDown.delay(300)} style={styles.menuSection}>
          {menuItems.map((item) => (
            <Pressable
              key={item.id}
              style={styles.menuItem}
              onPress={() => router.push(item.route as any)}
            >
              <View style={[styles.menuIcon, { backgroundColor: `${item.color}20` }]}>
                <Ionicons name={item.icon as any} size={20} color={item.color} />
              </View>
              <Text style={styles.menuLabel}>{item.label}</Text>
              <Ionicons name="chevron-forward" size={20} color="rgba(255,255,255,0.3)" />
            </Pressable>
          ))}
        </Animated.View>

        {/* Settings */}
        <Animated.View entering={FadeInDown.delay(400)} style={styles.settingsSection}>
          <Text style={styles.sectionTitle}>Settings</Text>
          {settingsItems.map((item) => (
            <Pressable
              key={item.id}
              style={styles.settingsItem}
              onPress={() => router.push(item.route as any)}
            >
              <Ionicons name={item.icon as any} size={22} color="rgba(255,255,255,0.6)" />
              <Text style={styles.settingsLabel}>{item.label}</Text>
              <Ionicons name="chevron-forward" size={20} color="rgba(255,255,255,0.3)" />
            </Pressable>
          ))}
        </Animated.View>

        {/* Sign Out */}
        <Animated.View entering={FadeInDown.delay(500)}>
          <Pressable style={styles.signOutButton} onPress={signOut}>
            <Ionicons name="log-out-outline" size={22} color="#ef4444" />
            <Text style={styles.signOutText}>Sign Out</Text>
          </Pressable>
        </Animated.View>

        {/* App Version */}
        <Text style={styles.version}>Parallel v1.0.0</Text>

        {/* Bottom spacing */}
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
    alignItems: 'center',
    marginBottom: 24,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarText: {
    fontSize: 40,
    fontWeight: 'bold',
    color: 'white',
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  username: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.4)',
    marginTop: 4,
  },
  premiumBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(139, 92, 246, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginTop: 12,
    gap: 6,
  },
  premiumText: {
    fontSize: 14,
    color: '#8b5cf6',
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.4)',
    marginTop: 4,
  },
  menuSection: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 20,
    padding: 8,
    marginBottom: 24,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 12,
  },
  menuIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuLabel: {
    flex: 1,
    fontSize: 16,
    color: 'white',
  },
  settingsSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.4)',
    marginBottom: 12,
    marginLeft: 4,
  },
  settingsItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
    gap: 12,
  },
  settingsLabel: {
    flex: 1,
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  signOutText: {
    fontSize: 16,
    color: '#ef4444',
    fontWeight: '600',
  },
  version: {
    textAlign: 'center',
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.2)',
    marginTop: 16,
  },
});
