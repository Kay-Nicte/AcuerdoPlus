import React, { useState, useCallback } from 'react';
import { View, FlatList, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { useAgreement } from '../../context/AgreementContext';
import { maintenanceService } from '../../services/maintenanceService';
import { minorService } from '../../services/minorService';
import { Maintenance, Minor } from '../../types';
import MaintenanceCard from '../../components/home/MaintenanceCard';
import EmptyState from '../../components/common/EmptyState';
import LoadingScreen from '../../components/common/LoadingScreen';
import { COLORS, SPACING } from '../../config/theme';

const MaintenanceListScreen: React.FC<{ route: any; navigation: any }> = ({ route, navigation }) => {
  const { t } = useTranslation();
  const { currentAgreement } = useAgreement();
  const minorIdFilter = route.params?.minorId;
  const [records, setRecords] = useState<Maintenance[]>([]);
  const [minorsMap, setMinorsMap] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    if (!currentAgreement) return;
    try {
      setLoading(true);
      const [maintenanceList, minorsList] = await Promise.all([
        maintenanceService.getMaintenanceRecords(currentAgreement.id, minorIdFilter),
        minorService.getMinors(currentAgreement.id),
      ]);
      setRecords(maintenanceList);
      const map: Record<string, string> = {};
      minorsList.forEach((m: Minor) => { map[m.id] = m.name; });
      setMinorsMap(map);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(useCallback(() => { loadData(); }, [currentAgreement]));

  if (loading) return <LoadingScreen />;

  return (
    <View style={styles.container}>
      <FlatList
        data={records}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <MaintenanceCard
            maintenance={item}
            minorName={minorsMap[item.minorId]}
            onPress={() => navigation.navigate('MaintenanceDetail', { maintenanceId: item.id })}
          />
        )}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<EmptyState message={t('maintenance.noRecords')} icon="wallet-outline" />}
      />
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('AddMaintenance', { minorId: minorIdFilter })}
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  list: { padding: SPACING.md, paddingBottom: 100, flexGrow: 1 },
  fab: {
    position: 'absolute', right: SPACING.lg, bottom: SPACING.lg,
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center',
    elevation: 3, shadowColor: '#110810', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 12,
  },
  fabText: { color: COLORS.white, fontSize: 28, fontWeight: '300', marginTop: -2 },
});

export default MaintenanceListScreen;
