import { useState, useEffect } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, Alert } from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/providers/AuthProvider';
import { SUBSCRIPTION_TIERS, getOfferings, purchasePackage } from '@/lib/purchases';

export default function SubscriptionScreen() {
  const { profile, refreshProfile } = useAuth();
  const [selectedTier, setSelectedTier] = useState('pro');
  const [loading, setLoading] = useState(false);
  const [offerings, setOfferings] = useState<any>(null);

  useEffect(() => {
    loadOfferings();
  }, []);

  const loadOfferings = async () => {
    const offering = await getOfferings();
    setOfferings(offering);
  };

  const handlePurchase = async () => {
    if (!offerings) {
      Alert.alert('Error', 'Unable to load subscription options');
      return;
    }

    setLoading(true);
    try {
      const pkg = offerings.availablePackages.find(
        (p: any) => p.identifier === selectedTier
      );

      if (!pkg) {
        throw new Error('Package not found');
      }

      const { customerInfo, error } = await purchasePackage(pkg);

      if (error) {
        throw error;
      }

      if (customerInfo) {
        await refreshProfile();
        Alert.alert('Success', 'Your subscription is now active!', [
          { text: 'OK', onPress: () => router.back() },
        ]);
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to complete purchase');
    } finally {
      setLoading(false);
    }
  };

  const currentTier = profile?.subscription_tier || 'free';

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#0f0a1e', '#1a0f2e', '#0f0a1e']}
        style={StyleSheet.absoluteFill}
      />

      {/* Header */}
      <View style={styles.header}>
        <Pressable style={styles.closeButton} onPress={() => router.back()}>
          <Ionicons name="close" size={24} color="white" />
        </Pressable>
        <Text style={styles.headerTitle}>Upgrade</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero */}
        <Animated.View entering={FadeInDown.delay(100)} style={styles.hero}>
          <LinearGradient
            colors={['#8b5cf6', '#d946ef']}
            style={styles.heroIcon}
          >
            <Ionicons name="diamond" size={40} color="white" />
          </LinearGradient>
          <Text style={styles.heroTitle}>Unlock Your Full Potential</Text>
          <Text style={styles.heroSubtitle}>
            Get unlimited access to all features and create without limits
          </Text>
        </Animated.View>

        {/* Current Plan */}
        {currentTier !== 'free' && (
          <Animated.View entering={FadeInDown.delay(150)} style={styles.currentPlan}>
            <Text style={styles.currentPlanLabel}>Current Plan</Text>
            <Text style={styles.currentPlanValue}>{currentTier}</Text>
          </Animated.View>
        )}

        {/* Plans */}
        <Animated.View entering={FadeInDown.delay(200)}>
          {SUBSCRIPTION_TIERS.map((tier) => (
            <Pressable
              key={tier.id}
              style={[
                styles.planCard,
                selectedTier === tier.id && styles.planCardSelected,
                tier.popular && styles.planCardPopular,
              ]}
              onPress={() => setSelectedTier(tier.id)}
            >
              {tier.popular && (
                <View style={styles.popularBadge}>
                  <Text style={styles.popularBadgeText}>Most Popular</Text>
                </View>
              )}
              <View style={styles.planHeader}>
                <View style={styles.planRadio}>
                  {selectedTier === tier.id && (
                    <View style={styles.planRadioInner} />
                  )}
                </View>
                <View style={styles.planInfo}>
                  <Text style={styles.planName}>{tier.name}</Text>
                  <Text style={styles.planPrice}>{tier.price}</Text>
                </View>
                <View style={styles.planCredits}>
                  <Ionicons name="sparkles" size={16} color="#8b5cf6" />
                  <Text style={styles.planCreditsText}>
                    {tier.credits >= 999999 ? '∞' : tier.credits.toLocaleString()}
                  </Text>
                </View>
              </View>
              <View style={styles.planFeatures}>
                {tier.features.slice(0, 3).map((feature, i) => (
                  <View key={i} style={styles.featureRow}>
                    <Ionicons name="checkmark-circle" size={16} color="#10b981" />
                    <Text style={styles.featureText}>{feature}</Text>
                  </View>
                ))}
              </View>
            </Pressable>
          ))}
        </Animated.View>

        {/* Features Comparison */}
        <Animated.View entering={FadeInDown.delay(300)} style={styles.comparison}>
          <Text style={styles.comparisonTitle}>What's Included</Text>
          <View style={styles.comparisonList}>
            {[
              'Unlimited conversations',
              'All AI personas',
              'HD image generation',
              'Music creation',
              'Video generation',
              'Priority support',
            ].map((feature, index) => (
              <View key={index} style={styles.comparisonItem}>
                <Ionicons name="checkmark" size={20} color="#8b5cf6" />
                <Text style={styles.comparisonText}>{feature}</Text>
              </View>
            ))}
          </View>
        </Animated.View>

        {/* Bottom spacing */}
        <View style={{ height: 120 }} />
      </ScrollView>

      {/* CTA */}
      <View style={styles.ctaContainer}>
        <Pressable
          style={[styles.ctaButton, loading && styles.ctaButtonDisabled]}
          onPress={handlePurchase}
          disabled={loading}
        >
          <LinearGradient
            colors={['#8b5cf6', '#d946ef']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.ctaGradient}
          >
            <Text style={styles.ctaText}>
              {loading ? 'Processing...' : `Subscribe to ${SUBSCRIPTION_TIERS.find(t => t.id === selectedTier)?.name}`}
            </Text>
          </LinearGradient>
        </Pressable>
        <Text style={styles.ctaDisclaimer}>
          Cancel anytime. Terms apply.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 60,
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
  },
  scrollContent: {
    paddingHorizontal: 20,
  },
  hero: {
    alignItems: 'center',
    marginBottom: 32,
  },
  heroIcon: {
    width: 80,
    height: 80,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
  },
  heroSubtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.6)',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 22,
  },
  currentPlan: {
    backgroundColor: 'rgba(139, 92, 246, 0.2)',
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  currentPlanLabel: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.6)',
  },
  currentPlanValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8b5cf6',
    textTransform: 'capitalize',
  },
  planCard: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  planCardSelected: {
    borderColor: '#8b5cf6',
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
  },
  planCardPopular: {
    borderColor: '#d946ef',
  },
  popularBadge: {
    position: 'absolute',
    top: -10,
    right: 16,
    backgroundColor: '#d946ef',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  popularBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'white',
  },
  planHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  planRadio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  planRadioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#8b5cf6',
  },
  planInfo: {
    flex: 1,
  },
  planName: {
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
  },
  planPrice: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.6)',
  },
  planCredits: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(139, 92, 246, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  planCreditsText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8b5cf6',
  },
  planFeatures: {
    gap: 8,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  featureText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
  },
  comparison: {
    marginTop: 24,
  },
  comparisonTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
    marginBottom: 16,
  },
  comparisonList: {
    gap: 12,
  },
  comparisonItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  comparisonText: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
  },
  ctaContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 36,
    backgroundColor: 'rgba(15, 10, 30, 0.95)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  ctaButton: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  ctaButtonDisabled: {
    opacity: 0.6,
  },
  ctaGradient: {
    paddingVertical: 18,
    alignItems: 'center',
  },
  ctaText: {
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
  },
  ctaDisclaimer: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.4)',
    textAlign: 'center',
    marginTop: 12,
  },
});
