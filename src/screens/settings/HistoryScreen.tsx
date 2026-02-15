import React, { useState, useCallback } from 'react';
import { View, FlatList, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useAgreement } from '../../context/AgreementContext';
import { historyService } from '../../services/historyService';
import { HistoryEntry } from '../../types';
import { formatDateTime } from '../../utils/formatters';
import EmptyState from '../../components/common/EmptyState';
import LoadingScreen from '../../components/common/LoadingScreen';
import { COLORS, SPACING, FONT_SIZES } from '../../config/theme';

type EntityType = HistoryEntry['entityType'];

const ENTITY_CONFIG: Record<EntityType, { icon: keyof typeof Ionicons.glyphMap; color: string; label: string }> = {
  minor: { icon: 'people', color: COLORS.info, label: 'Menores' },
  maintenance: { icon: 'wallet', color: COLORS.success, label: 'Manutención' },
  expense: { icon: 'receipt', color: COLORS.warning, label: 'Gastos' },
  calendar: { icon: 'calendar', color: COLORS.primary, label: 'Calendario' },
  authorization: { icon: 'shield-checkmark', color: '#9C27B0', label: 'Autorizaciones' },
  agreement: { icon: 'document-text', color: COLORS.primaryDark, label: 'Acuerdo' },
  chat: { icon: 'chatbubbles', color: '#00BCD4', label: 'Chat' },
};

const FILTER_OPTIONS: { key: EntityType | 'all'; label: string }[] = [
  { key: 'all', label: 'Todos' },
  ...Object.entries(ENTITY_CONFIG).map(([key, val]) => ({ key: key as EntityType, label: val.label })),
];

const HistoryScreen: React.FC = () => {
  const { currentAgreement } = useAgreement();
  const [entries, setEntries] = useState<HistoryEntry[]>([]);
  const [filter, setFilter] = useState<EntityType | 'all'>('all');
  const [loading, setLoading] = useState(true);

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
            {FILTER_OPTIONS.map((t) => {
              const isActive = filter === t.key;
              const chipColor = t.key === 'all' ? COLORS.primary : ENTITY_CONFIG[t.key].color;
              return (
                <TouchableOpacity
                  key={t.key}
                  style={[styles.chip, isActive && { borderColor: chipColor, backgroundColor: chipColor + '10' }]}
                  onPress={() => setFilter(t.key)}
                >
                  {t.key !== 'all' && (
                    <Ionicons
                      name={ENTITY_CONFIG[t.key].icon}
                      size={14}
                      color={isActive ? chipColor : COLORS.textMuted}
                      style={styles.chipIcon}
                    />
                  )}
                  <Text style={[styles.chipText, isActive && { color: chipColor, fontWeight: '600' }]}>{t.label}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        }
        renderItem={renderEntry}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<EmptyState message="Sin historial" icon="📜" />}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  list: { padding: SPACING.md, flexGrow: 1 },
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
    backgroundColor: COLORS.white,
    borderRadius: 10,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    borderLeftWidth: 3,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
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
