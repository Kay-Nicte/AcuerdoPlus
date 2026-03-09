import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { CalendarEvent } from '../../types';
import { formatDate } from '../../utils/formatters';
import { COLORS, SPACING, FONT_SIZES } from '../../config/theme';
import { useTranslation } from 'react-i18next';
import ApprovalBadge from '../common/ApprovalBadge';

interface EventCardProps {
  event: CalendarEvent;
  onPress: () => void;
}

const EventCard: React.FC<EventCardProps> = ({ event, onPress }) => {
  const { t } = useTranslation();
  return (
    <TouchableOpacity style={styles.card} onPress={onPress}>
      <View style={styles.row}>
        <View style={styles.info}>
          <Text style={styles.title}>{event.title}</Text>
          <Text style={styles.dates}>
            {formatDate(event.startDate)} - {formatDate(event.endDate)}
          </Text>
          {event.isPattern && <Text style={styles.pattern}>{t('eventCard.autoPattern')}</Text>}
        </View>
        {event.approvalStatus && (
          <ApprovalBadge status={event.approvalStatus} />
        )}
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
    marginRight: SPACING.sm,
  },
  title: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.text,
  },
  dates: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  pattern: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.info,
    fontWeight: '600',
    marginTop: 4,
  },
});

export default EventCard;
