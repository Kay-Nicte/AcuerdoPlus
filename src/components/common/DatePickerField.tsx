import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Platform, StyleSheet } from 'react-native';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { formatDate, formatMonth, formatDateISO } from '../../utils/formatters';
import { COLORS, SPACING, FONT_SIZES } from '../../config/theme';
import { useTranslation } from 'react-i18next';

interface DatePickerFieldProps {
  label: string;
  value: Date | null;
  onChange: (date: Date) => void;
  mode?: 'date' | 'monthYear';
  placeholder?: string;
  maximumDate?: Date;
  minimumDate?: Date;
}

const DatePickerField: React.FC<DatePickerFieldProps> = ({
  label,
  value,
  onChange,
  mode = 'date',
  placeholder,
  maximumDate,
  minimumDate,
}) => {
  const { t } = useTranslation();
  const effectivePlaceholder = placeholder || t('common.selectDate');
  const [show, setShow] = useState(false);

  const handleChange = (_event: DateTimePickerEvent, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShow(false);
    }
    if (selectedDate) {
      onChange(selectedDate);
      if (Platform.OS === 'ios') {
        // iOS keeps the picker open, close on selection
      }
    }
  };

  const displayValue = () => {
    if (!value) return effectivePlaceholder;
    if (mode === 'monthYear') return formatMonth(value);
    return formatDate(value);
  };

  return (
    <View>
      <Text style={styles.label}>{label}</Text>
      <TouchableOpacity style={styles.field} onPress={() => setShow(true)}>
        <Text style={[styles.fieldText, !value && styles.placeholder]}>
          {displayValue()}
        </Text>
      </TouchableOpacity>
      {show && (
        <View>
          <DateTimePicker
            value={value || new Date()}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={handleChange}
            maximumDate={maximumDate}
            minimumDate={minimumDate}
          />
          {Platform.OS === 'ios' && (
            <TouchableOpacity style={styles.doneButton} onPress={() => setShow(false)}>
              <Text style={styles.doneText}>{t('datePicker.done')}</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  label: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
    marginTop: SPACING.md,
  },
  field: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    padding: SPACING.md,
  },
  fieldText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
  },
  placeholder: {
    color: COLORS.textMuted,
  },
  doneButton: {
    alignSelf: 'flex-end',
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
  },
  doneText: {
    color: COLORS.primary,
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
  },
});

export default DatePickerField;
