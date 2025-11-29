import { useState } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, TextInput } from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';

const conversations = [
  {
    id: '1',
    persona: { name: 'Luna', type: 'Companion', color: ['#8b5cf6', '#d946ef'] },
    lastMessage: 'I was just thinking about you! How was your day? 💕',
    timestamp: '2m ago',
    unread: 2,
  },
  {
    id: '2',
    persona: { name: 'Max', type: 'Mentor', color: ['#06b6d4', '#3b82f6'] },
    lastMessage: 'Great progress on your goals this week! Let\'s review...',
    timestamp: '1h ago',
    unread: 0,
  },
  {
    id: '3',
    persona: { name: 'Aria', type: 'Creative', color: ['#f59e0b', '#ef4444'] },
    lastMessage: 'I finished that song we were working on! Want to hear it?',
    timestamp: '3h ago',
    unread: 1,
  },
  {
    id: '4',
    persona: { name: 'Kai', type: 'Strategist', color: ['#10b981', '#06b6d4'] },
    lastMessage: 'Here\'s the analysis you requested for your project.',
    timestamp: 'Yesterday',
    unread: 0,
  },
];

export default function MessagesScreen() {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredConversations = conversations.filter((conv) =>
    conv.persona.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
          <Text style={styles.title}>Messages</Text>
          <Pressable style={styles.newChatButton}>
            <Ionicons name="create-outline" size={24} color="white" />
          </Pressable>
        </Animated.View>

        {/* Search */}
        <Animated.View entering={FadeInDown.delay(200)} style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="rgba(255,255,255,0.4)" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search conversations..."
            placeholderTextColor="rgba(255,255,255,0.4)"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </Animated.View>

        {/* Pinned Section */}
        <Animated.View entering={FadeInDown.delay(300)}>
          <Text style={styles.sectionTitle}>Pinned</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.pinnedScroll}
          >
            {conversations.slice(0, 3).map((conv) => (
              <Pressable
                key={conv.id}
                style={styles.pinnedCard}
                onPress={() => router.push(`/chat/${conv.id}`)}
              >
                <LinearGradient colors={conv.persona.color} style={styles.pinnedAvatar}>
                  <Text style={styles.pinnedInitial}>{conv.persona.name[0]}</Text>
                </LinearGradient>
                <Text style={styles.pinnedName} numberOfLines={1}>
                  {conv.persona.name}
                </Text>
                {conv.unread > 0 && (
                  <View style={styles.pinnedBadge}>
                    <Text style={styles.badgeText}>{conv.unread}</Text>
                  </View>
                )}
              </Pressable>
            ))}
          </ScrollView>
        </Animated.View>

        {/* All Messages */}
        <Animated.View entering={FadeInDown.delay(400)}>
          <Text style={styles.sectionTitle}>All Messages</Text>
          {filteredConversations.map((conv) => (
            <Pressable
              key={conv.id}
              style={styles.conversationRow}
              onPress={() => router.push(`/chat/${conv.id}`)}
            >
              <LinearGradient colors={conv.persona.color} style={styles.avatar}>
                <Text style={styles.avatarInitial}>{conv.persona.name[0]}</Text>
              </LinearGradient>
              <View style={styles.conversationInfo}>
                <View style={styles.conversationHeader}>
                  <Text style={styles.conversationName}>{conv.persona.name}</Text>
                  <Text style={styles.timestamp}>{conv.timestamp}</Text>
                </View>
                <View style={styles.conversationPreview}>
                  <Text
                    style={[
                      styles.lastMessage,
                      conv.unread > 0 && styles.unreadMessage,
                    ]}
                    numberOfLines={1}
                  >
                    {conv.lastMessage}
                  </Text>
                  {conv.unread > 0 && (
                    <View style={styles.unreadBadge}>
                      <Text style={styles.unreadCount}>{conv.unread}</Text>
                    </View>
                  )}
                </View>
              </View>
            </Pressable>
          ))}
        </Animated.View>

        {/* Empty State */}
        {filteredConversations.length === 0 && (
          <View style={styles.emptyState}>
            <Ionicons name="chatbubbles-outline" size={64} color="rgba(255,255,255,0.2)" />
            <Text style={styles.emptyTitle}>No conversations found</Text>
            <Text style={styles.emptySubtitle}>
              Start a new chat to begin your journey
            </Text>
          </View>
        )}

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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
  },
  newChatButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 48,
    marginBottom: 24,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: 'white',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.6)',
    marginBottom: 16,
  },
  pinnedScroll: {
    paddingBottom: 8,
    marginBottom: 24,
  },
  pinnedCard: {
    alignItems: 'center',
    marginRight: 20,
    width: 72,
  },
  pinnedAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  pinnedInitial: {
    fontSize: 22,
    fontWeight: 'bold',
    color: 'white',
  },
  pinnedName: {
    fontSize: 12,
    color: 'white',
    textAlign: 'center',
  },
  pinnedBadge: {
    position: 'absolute',
    top: 0,
    right: 8,
    backgroundColor: '#ef4444',
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: 'white',
  },
  conversationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarInitial: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
  conversationInfo: {
    flex: 1,
  },
  conversationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  conversationName: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  timestamp: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.4)',
  },
  conversationPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  lastMessage: {
    flex: 1,
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.4)',
  },
  unreadMessage: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '500',
  },
  unreadBadge: {
    backgroundColor: '#8b5cf6',
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
    marginLeft: 8,
  },
  unreadCount: {
    fontSize: 12,
    fontWeight: 'bold',
    color: 'white',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
    marginTop: 16,
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.4)',
  },
});
