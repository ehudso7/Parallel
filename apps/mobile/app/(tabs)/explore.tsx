import { useState } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, TextInput, Dimensions } from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

const categories = [
  { id: 'all', label: 'All', icon: 'apps' },
  { id: 'worlds', label: 'Worlds', icon: 'globe' },
  { id: 'personas', label: 'Personas', icon: 'people' },
  { id: 'music', label: 'Music', icon: 'musical-notes' },
  { id: 'art', label: 'Art', icon: 'color-palette' },
];

const featuredWorlds = [
  { id: '1', name: 'Cyber Tokyo 2089', theme: 'cyberpunk', users: 12500, color: ['#8b5cf6', '#06b6d4'] },
  { id: '2', name: 'Monte Carlo Nights', theme: 'luxury', users: 8300, color: ['#f59e0b', '#ef4444'] },
  { id: '3', name: 'Cosmic Voyager', theme: 'sci-fi', users: 15200, color: ['#3b82f6', '#8b5cf6'] },
  { id: '4', name: 'Medieval Realms', theme: 'fantasy', users: 9800, color: ['#10b981', '#06b6d4'] },
];

const popularPersonas = [
  { id: '1', name: 'Zara', type: 'Companion', rating: 4.9, chats: 250000 },
  { id: '2', name: 'Marcus', type: 'Mentor', rating: 4.8, chats: 180000 },
  { id: '3', name: 'Violet', type: 'Creative', rating: 4.9, chats: 320000 },
  { id: '4', name: 'Kai', type: 'Strategist', rating: 4.7, chats: 150000 },
];

export default function ExploreScreen() {
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

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
          <Text style={styles.title}>Explore</Text>
          <Text style={styles.subtitle}>Discover new worlds and companions</Text>
        </Animated.View>

        {/* Search */}
        <Animated.View entering={FadeInDown.delay(200)} style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="rgba(255,255,255,0.4)" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search worlds, personas, music..."
            placeholderTextColor="rgba(255,255,255,0.4)"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          <Pressable style={styles.filterButton}>
            <Ionicons name="options-outline" size={20} color="white" />
          </Pressable>
        </Animated.View>

        {/* Categories */}
        <Animated.View entering={FadeInDown.delay(300)}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categories}
          >
            {categories.map((category) => (
              <Pressable
                key={category.id}
                style={[
                  styles.categoryPill,
                  activeCategory === category.id && styles.categoryPillActive,
                ]}
                onPress={() => setActiveCategory(category.id)}
              >
                <Ionicons
                  name={category.icon as any}
                  size={16}
                  color={activeCategory === category.id ? 'white' : 'rgba(255,255,255,0.6)'}
                />
                <Text
                  style={[
                    styles.categoryText,
                    activeCategory === category.id && styles.categoryTextActive,
                  ]}
                >
                  {category.label}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </Animated.View>

        {/* Featured Worlds */}
        <Animated.View entering={FadeInDown.delay(400)}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Featured Worlds</Text>
            <Pressable>
              <Text style={styles.seeAll}>See all</Text>
            </Pressable>
          </View>

          <View style={styles.worldsGrid}>
            {featuredWorlds.map((world) => (
              <Pressable
                key={world.id}
                style={styles.worldCard}
                onPress={() => router.push(`/world/${world.id}`)}
              >
                <LinearGradient
                  colors={world.color}
                  style={styles.worldGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <View style={styles.worldBadge}>
                    <Ionicons name="people" size={12} color="white" />
                    <Text style={styles.worldBadgeText}>
                      {(world.users / 1000).toFixed(1)}k
                    </Text>
                  </View>
                  <View style={styles.worldInfo}>
                    <Text style={styles.worldName}>{world.name}</Text>
                    <Text style={styles.worldTheme}>{world.theme}</Text>
                  </View>
                </LinearGradient>
              </Pressable>
            ))}
          </View>
        </Animated.View>

        {/* Popular Personas */}
        <Animated.View entering={FadeInDown.delay(500)}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Popular Personas</Text>
            <Pressable>
              <Text style={styles.seeAll}>See all</Text>
            </Pressable>
          </View>

          {popularPersonas.map((persona, index) => (
            <Pressable
              key={persona.id}
              style={styles.personaRow}
              onPress={() => router.push(`/persona/${persona.id}`)}
            >
              <View style={styles.personaRank}>
                <Text style={styles.rankText}>{index + 1}</Text>
              </View>
              <LinearGradient
                colors={['#8b5cf6', '#d946ef']}
                style={styles.personaAvatar}
              >
                <Text style={styles.personaInitial}>{persona.name[0]}</Text>
              </LinearGradient>
              <View style={styles.personaInfo}>
                <Text style={styles.personaName}>{persona.name}</Text>
                <Text style={styles.personaType}>{persona.type}</Text>
              </View>
              <View style={styles.personaStats}>
                <View style={styles.statRow}>
                  <Ionicons name="star" size={14} color="#f59e0b" />
                  <Text style={styles.statText}>{persona.rating}</Text>
                </View>
                <Text style={styles.chatsText}>
                  {(persona.chats / 1000).toFixed(0)}k chats
                </Text>
              </View>
            </Pressable>
          ))}
        </Animated.View>

        {/* Trending Tags */}
        <Animated.View entering={FadeInDown.delay(600)}>
          <Text style={styles.sectionTitle}>Trending</Text>
          <View style={styles.tagsContainer}>
            {['#romance', '#adventure', '#creative', '#music', '#art', '#sci-fi', '#fantasy'].map((tag) => (
              <Pressable key={tag} style={styles.tag}>
                <Text style={styles.tagText}>{tag}</Text>
              </Pressable>
            ))}
          </View>
        </Animated.View>

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
    marginBottom: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.6)',
    marginTop: 4,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 52,
    marginBottom: 20,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: 'white',
  },
  filterButton: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  categories: {
    paddingBottom: 20,
    gap: 8,
  },
  categoryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    gap: 6,
    marginRight: 8,
  },
  categoryPillActive: {
    backgroundColor: '#8b5cf6',
  },
  categoryText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.6)',
  },
  categoryTextActive: {
    color: 'white',
    fontWeight: '600',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    marginTop: 8,
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
  worldsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  worldCard: {
    width: (width - 52) / 2,
    height: 140,
    borderRadius: 16,
    overflow: 'hidden',
  },
  worldGradient: {
    flex: 1,
    padding: 12,
    justifyContent: 'space-between',
  },
  worldBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  worldBadgeText: {
    fontSize: 12,
    color: 'white',
    fontWeight: '600',
  },
  worldInfo: {},
  worldName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
  },
  worldTheme: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    textTransform: 'capitalize',
  },
  personaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 12,
    marginBottom: 12,
    gap: 12,
  },
  personaRank: {
    width: 24,
    alignItems: 'center',
  },
  rankText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'rgba(255, 255, 255, 0.4)',
  },
  personaAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  personaInitial: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
  personaInfo: {
    flex: 1,
  },
  personaName: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  personaType: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.4)',
  },
  personaStats: {
    alignItems: 'flex-end',
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
  },
  chatsText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.4)',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  tag: {
    backgroundColor: 'rgba(139, 92, 246, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  tagText: {
    fontSize: 14,
    color: '#8b5cf6',
  },
});
