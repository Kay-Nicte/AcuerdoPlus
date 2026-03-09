import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Maintenance } from '../../types';
import { formatCurrency, formatMonthLabel } from '../../utils/formatters';
import { COLORS, SPACING, FONT_SIZES } from '../../config/theme';
import ApprovalBadge from '../common/ApprovalBadge';

interface MaintenanceCardProps {
  maintenance: Maintenance;
  minorName?: string;
  onPress: () => void;
}

const MaintenanceCard: React.FC<MaintenanceCardProps> = ({ maintenance, minorName, onPress }) => {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress}>
      <View style={styles.row}>
        <View style={styles.info}>
          <Text style={styles.month}>{formatMonthLabel(maintenance.month)}</Text>
          {minorName && <Text style={styles.minor}>{minorName}</Text>}
          <Text style={styles.amount}>{formatCurrency(maintenance.amount)}</Text>
        </View>
        <ApprovalBadge status={maintenance.status === 'paid' ? 'paid' : 'pending'} />
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  info: {
    flex: 1,
  },
  month: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.text,
  },
  minor: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  amount: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '700',
    color: COLORS.primary,
    marginTop: 4,
  },
});

export default MaintenanceCard;
