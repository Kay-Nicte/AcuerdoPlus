import React, { useState, useCallback } from 'react';
import { View, FlatList, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { useAgreement } from '../../context/AgreementContext';
import { historyService } from '../../services/historyService';
import { HistoryEntry } from '../../types';
import { formatDateTime } from '../../utils/formatters';
import EmptyState from '../../components/common/EmptyState';
import LoadingScreen from '../../components/common/LoadingScreen';
import { COLORS, SPACING, FONT_SIZES } from '../../config/theme';

type EntityType = HistoryEntry['entityType'];

const HistoryScreen: React.FC = () => {
  const { t } = useTranslation();
  const { currentAgreement } = useAgreement();
  const [entries, setEntries] = useState<HistoryEntry[]>([]);
  const [filter, setFilter] = useState<EntityType | 'all'>('all');
  const [loading, setLoading] = useState(true);

  const ENTITY_CONFIG: Record<EntityType, { icon: keyof typeof Ionicons.glyphMap; color: string; label: string }> = {
    minor: { icon: 'people', color: COLORS.info, label: t('history.minors') },
    maintenance: { icon: 'wallet', color: COLORS.success, label: t('history.maintenance') },
    expense: { icon: 'receipt', color: COLORS.warning, label: t('history.expenses') },
    calendar: { icon: 'calendar', color: COLORS.primary, label: t('history.calendar') },
    authorization: { icon: 'shield-checkmark', color: '#9C27B0', label: t('history.authorizations') },
    agreement: { icon: 'document-text', color: COLORS.primaryDark, label: t('history.agreement') },
    chat: { icon: 'chatbubbles', color: '#00BCD4', label: t('history.chat') },
  };

  const FILTER_OPTIONS: { key: EntityType | 'all'; label: string }[] = [
    { key: 'all', label: t('common.all') },
    ...Object.entries(ENTITY_CONFIG).map(([key, val]) => ({ key: key as EntityType, label: val.label })),
  ];

  const loadHistory = async () => {
    if (!currentAgreement) return;
    try {
      setLoading(true);
      const typeFilter = filter === 'all' ? undefined : filter;
      const data = await historyService.getHistory(currentAgreement.id, typeFilter);
      setEntries(data);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(useCallback(() => { loadHistory(); }, [currentAgreement, filter]));

  if (loading) return <LoadingScreen />;

  const renderEntry = ({ item }: { item: HistoryEntry }) => {
    const config = ENTITY_CONFIG[item.entityType];
    return (
      <View style={[styles.entry, { borderLeftColor: config.color }]}>
        <View style={[styles.iconContainer, { backgroundColor: config.color + '15' }]}>
          <Ionicons name={config.icon} size={20} color={config.color} />
        </View>
        <View style={styles.entryContent}>
          <View style={styles.entryHeader}>
            <Text style={styles.action} numberOfLines={2}>{item.action}</Text>
            <View style={[styles.badge, { backgroundColor: config.color + '15' }]}>
              <Text style={[styles.badgeText, { color: config.color }]}>{config.label}</Text>
            </View>
          </View>
          <Text style={styles.meta}>
            {item.performedByName}  ·  {formatDateTime(item.timestamp)}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={entries}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filtersScroll} contentContainerStyle={styles.filtersContent}>
            {FILTER_OPTIONS.map((ft) => {
              const isActive = filter === ft.key;
              const chipColor = ft.key === 'all' ? COLORS.primary : ENTITY_CONFIG[ft.key].color;
              return (
                <TouchableOpacity
                  key={ft.key}
                  style={[styles.chip, isActive && { borderColor: chipColor, backgroundColor: chipColor + '10' }]}
                  onPress={() => setFilter(ft.key)}
                >
                  {ft.key !== 'all' && (
                    <Ionicons
                      name={ENTITY_CONFIG[ft.key].icon}
                      size={14}
                      color={isActive ? chipColor : COLORS.textMuted}
                      style={styles.chipIcon}
                    />
                  )}
                  <Text style={[styles.chipText, isActive && { color: chipColor, fontWeight: '600' }]}>{ft.label}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        }
        renderItem={renderEntry}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<EmptyState message={t('history.empty')} icon="time-outline" />}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  list: { padding: SPACING.md, paddingBottom: 100, flexGrow: 1 },
  filtersScroll: { marginBottom: SPACING.md },
  filtersContent: { gap: SPACING.xs },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.sm,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  chipIcon: { marginRight: 4 },
  chipText: { fontSize: FONT_SIZES.xs, color: COLORS.textSecondary },
  entry: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    borderLeftWidth: 3,
    shadowColor: '#110810',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 12,
    elevation: 3,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.sm,
  },
  entryContent: { flex: 1 },
  entryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  action: { fontSize: FONT_SIZES.sm, color: COLORS.text, fontWeight: '500', flex: 1, marginRight: SPACING.xs },
  badge: {
    paddingVertical: 2,
    paddingHorizontal: SPACING.xs,
    borderRadius: 8,
  },
  badgeText: { fontSize: 10, fontWeight: '700' },
  meta: { fontSize: FONT_SIZES.xs, color: COLORS.textMuted, marginTop: SPACING.xs },
});

export default HistoryScreen;
