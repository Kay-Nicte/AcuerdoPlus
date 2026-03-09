import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { RootStackParamList } from '../../navigation/AppNavigator';
import { useAuth } from '../../context/AuthContext';
import { useAgreement } from '../../context/AgreementContext';
import { subscriptionService } from '../../services/subscriptionService';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'WelcomePremium'>;
  route: RouteProp<RootStackParamList, 'WelcomePremium'>;
};

const WelcomePremiumScreen: React.FC<Props> = ({ navigation, route }) => {
  const { t } = useTranslation();
  const { agreementId } = route.params;
  const { user } = useAuth();
  const { completeOnboarding } = useAgreement();
  const [loading, setLoading] = useState(false);

  const handleActivate = async (plan: 'monthly' | 'quarterly' | 'annual') => {
    try {
      setLoading(true);
      await subscriptionService.activateSubscription(agreementId, user!.uid, plan);
      await completeOnboarding(agreementId);
    } catch (error: any) {
      console.error('Error activando premium:', error);
      await completeOnboarding(agreementId);
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = async () => {
    setLoading(true);
    await completeOnboarding(agreementId);
    setLoading(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Ionicons name="star" size={48} color="#A93D5C" style={{ marginBottom: 12 }} />
          <Text style={styles.title}>{t('agreementFlow.welcomePremium')}</Text>
          <Text style={styles.subtitle}>
            {t('agreementFlow.unlockFeatures')}
          </Text>
        </View>

        <View style={styles.featureList}>
          {[
            { icon: 'clipboard-outline' as const, text: t('subscription.unlimitedMinors') },
            { icon: 'shield-checkmark-outline' as const, text: t('subscription.featureAuthorizations') },
            { icon: 'calendar-outline' as const, text: t('subscription.featurePatterns') },
            { icon: 'document-text-outline' as const, text: t('subscription.featurePdf') },
            { icon: 'chatbubble-ellipses-outline' as const, text: t('subscription.featureSupport') },
          ].map((f, i) => (
            <View key={i} style={styles.featureRow}>
              <Ionicons name={f.icon} size={20} color="#A93D5C" style={{ marginRight: 12 }} />
              <Text style={styles.featureText}>{f.text}</Text>
            </View>
          ))}
        </View>

        <Text style={styles.plansTitle}>{t('subscription.choosePlan')}</Text>

        <TouchableOpacity
          style={[styles.planCard, loading && styles.disabled]}
          onPress={() => handleActivate('monthly')}
          disabled={loading}
        >
          <Text style={styles.planName}>{t('subscription.monthly')}</Text>
          <Text style={styles.planPrice}>{t('subscription.monthlyPrice')}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.planCard, loading && styles.disabled]}
          onPress={() => handleActivate('quarterly')}
          disabled={loading}
        >
          <Text style={styles.planName}>{t('subscription.quarterly')}</Text>
          <Text style={styles.planPrice}>{t('subscription.quarterlyPrice')}</Text>
          <Text style={styles.planSaving}>{t('subscription.save11')}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.planCard, styles.planCardHighlight, loading && styles.disabled]}
          onPress={() => handleActivate('annual')}
          disabled={loading}
        >
          <Text style={[styles.planName, { color: '#fff' }]}>{t('subscription.annual')}</Text>
          <Text style={[styles.planPrice, { color: '#fff' }]}>{t('subscription.annualPrice')}</Text>
          <View style={styles.bestValue}>
            <Text style={styles.bestValueText}>{t('subscription.save57')}</Text>
          </View>
        </TouchableOpacity>

        {loading ? (
          <ActivityIndicator color="#A93D5C" style={{ marginTop: 24 }} />
        ) : (
          <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
            <Text style={styles.skipText}>{t('common.continue')}</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  content: { padding: 24, paddingBottom: 48 },
  header: { alignItems: 'center', marginBottom: 32 },
  star: { fontSize: 48, color: '#A93D5C', marginBottom: 12 },
  title: { fontSize: 26, fontWeight: 'bold', color: '#333', textAlign: 'center' },
  subtitle: { fontSize: 16, color: '#666', textAlign: 'center', marginTop: 8 },
  featureList: { marginBottom: 32 },
  featureRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10 },
  featureIcon: { fontSize: 20, marginRight: 12 },
  featureText: { fontSize: 16, color: '#333' },
  plansTitle: { fontSize: 20, fontWeight: '700', color: '#333', marginBottom: 16 },
  planCard: {
    borderWidth: 2, borderColor: '#ddd', borderRadius: 12, padding: 20,
    alignItems: 'center', marginBottom: 12,
  },
  planCardHighlight: { borderColor: '#A93D5C', backgroundColor: '#A93D5C' },
  planName: { fontSize: 18, fontWeight: '700', color: '#333' },
  planPrice: { fontSize: 22, fontWeight: '700', color: '#A93D5C', marginTop: 4 },
  planSaving: { fontSize: 13, color: '#4CAF50', fontWeight: '600', marginTop: 4 },
  bestValue: {
    backgroundColor: '#4CAF50', paddingHorizontal: 12, paddingVertical: 3,
    borderRadius: 8, marginTop: 8,
  },
  bestValueText: { color: '#fff', fontSize: 13, fontWeight: '600' },
  disabled: { opacity: 0.5 },
  skipButton: { marginTop: 24, alignItems: 'center' },
  skipText: { fontSize: 15, color: '#999' },
});

export default WelcomePremiumScreen;
