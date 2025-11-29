import { View, Text, ScrollView, Pressable, StyleSheet, Dimensions } from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

const creationTypes = [
  {
    id: 'persona',
    title: 'AI Companion',
    description: 'Create a custom AI persona to chat with',
    icon: 'person-add',
    gradient: ['#8b5cf6', '#d946ef'],
    credits: 0,
  },
  {
    id: 'image',
    title: 'AI Image',
    description: 'Generate stunning images from text',
    icon: 'image',
    gradient: ['#06b6d4', '#3b82f6'],
    credits: 5,
  },
  {
    id: 'music',
    title: 'AI Music',
    description: 'Create original music tracks',
    icon: 'musical-notes',
    gradient: ['#f59e0b', '#ef4444'],
    credits: 10,
  },
  {
    id: 'video',
    title: 'AI Video',
    description: 'Generate short video clips',
    icon: 'videocam',
    gradient: ['#10b981', '#06b6d4'],
    credits: 25,
  },
];

const templates = [
  { id: '1', title: 'Romantic Partner', type: 'persona', icon: 'heart' },
  { id: '2', title: 'Life Coach', type: 'persona', icon: 'fitness' },
  { id: '3', title: 'Creative Writer', type: 'persona', icon: 'pencil' },
  { id: '4', title: 'Album Cover', type: 'image', icon: 'disc' },
  { id: '5', title: 'Portrait Photo', type: 'image', icon: 'camera' },
  { id: '6', title: 'Lo-Fi Beat', type: 'music', icon: 'headset' },
];

export default function CreateScreen() {
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
          <Text style={styles.title}>Create</Text>
          <Text style={styles.subtitle}>Bring your imagination to life</Text>
        </Animated.View>

        {/* Creation Types */}
        <Animated.View entering={FadeInDown.delay(200)} style={styles.grid}>
          {creationTypes.map((type, index) => (
            <Pressable
              key={type.id}
              style={styles.creationCard}
              onPress={() => router.push(`/create?type=${type.id}`)}
            >
              <LinearGradient
                colors={type.gradient}
                style={styles.creationGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <View style={styles.creationIcon}>
                  <Ionicons name={type.icon as any} size={32} color="white" />
                </View>
                <Text style={styles.creationTitle}>{type.title}</Text>
                <Text style={styles.creationDescription}>{type.description}</Text>
                {type.credits > 0 && (
                  <View style={styles.creditsBadge}>
                    <Ionicons name="sparkles" size={12} color="white" />
                    <Text style={styles.creditsText}>{type.credits}</Text>
                  </View>
                )}
              </LinearGradient>
            </Pressable>
          ))}
        </Animated.View>

        {/* Quick Templates */}
        <Animated.View entering={FadeInDown.delay(300)}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Quick Templates</Text>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.templatesScroll}
          >
            {templates.map((template) => (
              <Pressable key={template.id} style={styles.templateCard}>
                <View style={styles.templateIcon}>
                  <Ionicons name={template.icon as any} size={24} color="#8b5cf6" />
                </View>
                <Text style={styles.templateTitle}>{template.title}</Text>
                <Text style={styles.templateType}>{template.type}</Text>
              </Pressable>
            ))}
          </ScrollView>
        </Animated.View>

        {/* Recent Creations */}
        <Animated.View entering={FadeInDown.delay(400)}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Creations</Text>
            <Pressable>
              <Text style={styles.seeAll}>View all</Text>
            </Pressable>
          </View>

          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}>
              <Ionicons name="sparkles" size={48} color="rgba(255,255,255,0.2)" />
            </View>
            <Text style={styles.emptyTitle}>No creations yet</Text>
            <Text style={styles.emptySubtitle}>
              Start creating to see your work here
            </Text>
          </View>
        </Animated.View>

        {/* Tips */}
        <Animated.View entering={FadeInUp.delay(500)}>
          <View style={styles.tipCard}>
            <View style={styles.tipHeader}>
              <Ionicons name="bulb" size={20} color="#f59e0b" />
              <Text style={styles.tipTitle}>Pro Tip</Text>
            </View>
            <Text style={styles.tipText}>
              Be specific with your prompts! The more details you provide, the better
              results you'll get. Try describing the mood, style, and specific elements
              you want to see.
            </Text>
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
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 32,
  },
  creationCard: {
    width: (width - 52) / 2,
    borderRadius: 20,
    overflow: 'hidden',
  },
  creationGradient: {
    padding: 16,
    height: 160,
    justifyContent: 'space-between',
  },
  creationIcon: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  creationTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
  creationDescription: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  creditsBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  creditsText: {
    fontSize: 12,
    color: 'white',
    fontWeight: '600',
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
  templatesScroll: {
    paddingBottom: 8,
  },
  templateCard: {
    width: 120,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 16,
    marginRight: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  templateIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(139, 92, 246, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  templateTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
  },
  templateType: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.4)',
    textTransform: 'capitalize',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.4)',
  },
  tipCard: {
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.2)',
  },
  tipHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  tipTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#f59e0b',
  },
  tipText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.6)',
    lineHeight: 20,
  },
});
