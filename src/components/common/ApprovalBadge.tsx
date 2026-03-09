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

const BADGE_STYLES: Record<string, { bg: string; fg: string }> = {
  pending: { bg: COLORS.warningBg, fg: COLORS.warning },
  approved: { bg: COLORS.successBg, fg: COLORS.success },
  rejected: { bg: COLORS.error + '15', fg: COLORS.error },
  paid: { bg: COLORS.successBg, fg: COLORS.success },
};

const ApprovalBadge: React.FC<ApprovalBadgeProps> = ({ status }) => {
  const LABELS = getLabels();
  const style = BADGE_STYLES[status];
  return (
    <View style={[styles.badge, { backgroundColor: style.bg }]}>
      <Text style={[styles.text, { color: style.fg }]}>
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
