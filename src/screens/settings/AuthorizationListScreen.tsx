import React, { useState, useCallback } from 'react';
import { View, FlatList, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { useAgreement } from '../../context/AgreementContext';
import { useSubscription } from '../../context/SubscriptionContext';
import { authorizationService } from '../../services/authorizationService';
import { Authorization } from '../../types';
import ApprovalBadge from '../../components/common/ApprovalBadge';
import EmptyState from '../../components/common/EmptyState';
import LoadingScreen from '../../components/common/LoadingScreen';
import PremiumGate from '../../components/common/PremiumGate';
import { COLORS, SPACING, FONT_SIZES } from '../../config/theme';

const AuthorizationListScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { t } = useTranslation();
  const { currentAgreement } = useAgreement();
  const { isPremium } = useSubscription();
  const [authorizations, setAuthorizations] = useState<Authorization[]>([]);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [loading, setLoading] = useState(true);

  const filterLabels: Record<string, string> = {
    all: t('authz.all'),
    pending: t('authz.pending'),
    approved: t('authz.approved'),
    rejected: t('authz.rejected'),
  };

  const loadData = async () => {
    if (!currentAgreement) return;
    try {
      setLoading(true);
      const statusFilter = filter === 'all' ? undefined : filter;
      const data = await authorizationService.getAuthorizations(currentAgreement.id, statusFilter as any);
      setAuthorizations(data);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(useCallback(() => { loadData(); }, [currentAgreement, filter]));

  if (!isPremium) {
    return (
      <PremiumGate featureName={t('authz.title')} onUpgrade={() => navigation.navigate('Ajustes', { screen: 'Subscription' })}>
        <View />
      </PremiumGate>
    );
  }

  if (loading) return <LoadingScreen />;

  return (
    <View style={styles.container}>
      <FlatList
        data={authorizations}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={
          <View style={styles.filters}>
            {(['all', 'pending', 'approved', 'rejected'] as const).map((f) => (
              <TouchableOpacity key={f} style={[styles.chip, filter === f && styles.chipActive]} onPress={() => setFilter(f)}>
                <Text style={[styles.chipText, filter === f && styles.chipTextActive]}>
                  {filterLabels[f]}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            onPress={() => navigation.navigate('AuthorizationDetail', { authorizationId: item.id })}
          >
            <View style={styles.cardRow}>
              <View style={styles.cardInfo}>
                <Text style={styles.activity}>{item.activity}</Text>
                <Text style={styles.desc} numberOfLines={1}>{item.description}</Text>
              </View>
              <ApprovalBadge status={item.status} />
            </View>
          </TouchableOpacity>
        )}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<EmptyState message={t('authz.empty')} icon="shield-checkmark-outline" />}
      />
      <TouchableOpacity style={styles.fab} onPress={() => navigation.navigate('AddAuthorization')}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  list: { padding: SPACING.md, paddingBottom: 100, flexGrow: 1 },
  filters: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.xs, marginBottom: SPACING.md },
  chip: { paddingVertical: SPACING.xs, paddingHorizontal: SPACING.sm, borderRadius: 16, borderWidth: 1, borderColor: COLORS.border },
  chipActive: { borderColor: COLORS.primary, backgroundColor: COLORS.primaryPale },
  chipText: { fontSize: FONT_SIZES.xs, color: COLORS.textSecondary },
  chipTextActive: { color: COLORS.primary, fontWeight: '600' },
  card: {
    backgroundColor: COLORS.card, borderRadius: 16, padding: SPACING.md, marginBottom: SPACING.sm,
    shadowColor: '#110810', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 12, elevation: 3,
  },
  cardRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardInfo: { flex: 1, marginRight: SPACING.sm },
  activity: { fontSize: FONT_SIZES.md, fontWeight: '600', color: COLORS.text },
  desc: { fontSize: FONT_SIZES.sm, color: COLORS.textSecondary, marginTop: 2 },
  fab: {
    position: 'absolute', right: SPACING.lg, bottom: SPACING.lg,
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center',
    elevation: 4, shadowColor: '#110810', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 8,
  },
  fabText: { color: COLORS.white, fontSize: 28, fontWeight: '300', marginTop: -2 },
});

export default AuthorizationListScreen;
