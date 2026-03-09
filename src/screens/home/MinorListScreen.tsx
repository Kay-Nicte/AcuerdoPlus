import React, { useEffect, useState, useCallback } from 'react';
import { View, FlatList, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { useAgreement } from '../../context/AgreementContext';
import { minorService } from '../../services/minorService';
import { Minor } from '../../types';
import MinorCard from '../../components/home/MinorCard';
import EmptyState from '../../components/common/EmptyState';
import LoadingScreen from '../../components/common/LoadingScreen';
import { COLORS, SPACING, FONT_SIZES } from '../../config/theme';

const MinorListScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { t } = useTranslation();
  const { currentAgreement } = useAgreement();
  const [minors, setMinors] = useState<Minor[]>([]);
  const [loading, setLoading] = useState(true);

  const loadMinors = async () => {
    if (!currentAgreement) return;
    try {
      setLoading(true);
      const list = await minorService.getMinors(currentAgreement.id);
      setMinors(list);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadMinors();
    }, [currentAgreement])
  );

  if (loading) return <LoadingScreen />;

  return (
    <View style={styles.container}>
      <FlatList
        data={minors}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <MinorCard
            minor={item}
            onPress={() => navigation.navigate('MinorDetail', { minorId: item.id })}
          />
        )}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<EmptyState message={t('minors.noMinors')} icon="people-outline" />}
      />
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('AddMinor')}
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  list: {
    padding: SPACING.md,
    flexGrow: 1,
  },
  fab: {
    position: 'absolute',
    right: SPACING.lg,
    bottom: SPACING.lg,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  fabText: {
    color: COLORS.white,
    fontSize: 28,
    fontWeight: '300',
    marginTop: -2,
  },
});

export default MinorListScreen;
