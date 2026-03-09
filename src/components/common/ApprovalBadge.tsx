import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, SPACING, FONT_SIZES } from '../../config/theme';
import i18next from 'i18next';

interface ApprovalBadgeProps {
  status: 'pending' | 'approved' | 'rejected' | 'paid';
}

const getLabels = (): Record<string, string> => ({
  pending: i18next.t('approvalBadge.pending'),
  approved: i18next.t('approvalBadge.approved'),
  rejected: i18next.t('approvalBadge.rejected'),
  paid: i18next.t('approvalBadge.paid'),
});

const BADGE_COLORS: Record<string, string> = {
  pending: COLORS.pending,
  approved: COLORS.approved,
  rejected: COLORS.rejected,
  paid: COLORS.paid,
};

const ApprovalBadge: React.FC<ApprovalBadgeProps> = ({ status }) => {
  const LABELS = getLabels();
  return (
    <View style={[styles.badge, { backgroundColor: BADGE_COLORS[status] + '20' }]}>
      <Text style={[styles.text, { color: BADGE_COLORS[status] }]}>
        {LABELS[status]}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: 12,
  },
  text: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '600',
  },
});

export default ApprovalBadge;
