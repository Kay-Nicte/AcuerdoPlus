import React, { createContext, useState, useContext, useCallback, useRef, useEffect } from 'react';
import { Animated, Text, StyleSheet, View, TouchableOpacity, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, FONT_SIZES } from '../config/theme';

type ToastType = 'success' | 'error' | 'info';

interface ToastData {
  message: string;
  type: ToastType;
  id: number;
}

interface ConfirmButton {
  text: string;
  style?: 'default' | 'cancel' | 'destructive';
  onPress?: () => void;
}

interface ConfirmData {
  title: string;
  message: string;
  buttons: ConfirmButton[];
}

interface ToastContextData {
  showToast: (message: string, type?: ToastType) => void;
  showConfirm: (title: string, message: string, buttons: ConfirmButton[]) => void;
}

const ToastContext = createContext<ToastContextData>({} as ToastContextData);

const ICONS: Record<ToastType, keyof typeof Ionicons.glyphMap> = {
  success: 'checkmark-circle',
  error: 'alert-circle',
  info: 'information-circle',
};

const BG_COLORS: Record<ToastType, string> = {
  success: '#1B873F',
  error: '#D1242F',
  info: '#333333',
};

const ToastItem: React.FC<{ toast: ToastData; onDone: () => void }> = ({ toast, onDone }) => {
  const translateY = useRef(new Animated.Value(-80)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(translateY, { toValue: 0, useNativeDriver: true, tension: 80, friction: 10 }),
      Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
    ]).start();

    const timer = setTimeout(() => {
      Animated.parallel([
        Animated.timing(translateY, { toValue: -80, duration: 250, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0, duration: 250, useNativeDriver: true }),
      ]).start(() => onDone());
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <Animated.View
      style={[
        styles.toast,
        { backgroundColor: BG_COLORS[toast.type], transform: [{ translateY }], opacity },
      ]}
    >
      <Ionicons name={ICONS[toast.type]} size={20} color="#fff" />
      <Text style={styles.toastText}>{toast.message}</Text>
    </Animated.View>
  );
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastData[]>([]);
  const [confirm, setConfirm] = useState<ConfirmData | null>(null);
  const counter = useRef(0);

  const showToast = useCallback((message: string, type: ToastType = 'info') => {
    const id = ++counter.current;
    setToasts((prev) => [...prev, { message, type, id }]);
  }, []);

  const removeToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showConfirm = useCallback((title: string, message: string, buttons: ConfirmButton[]) => {
    setConfirm({ title, message, buttons });
  }, []);

  const handleConfirmButton = (button: ConfirmButton) => {
    setConfirm(null);
    button.onPress?.();
  };

  return (
    <ToastContext.Provider value={{ showToast, showConfirm }}>
      {children}
      <View style={styles.container} pointerEvents="none">
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onDone={() => removeToast(toast.id)} />
        ))}
      </View>
      <Modal visible={!!confirm} transparent animationType="fade" onRequestClose={() => setConfirm(null)}>
        <View style={styles.overlay}>
          <View style={styles.confirmCard}>
            <Text style={styles.confirmTitle}>{confirm?.title}</Text>
            <Text style={styles.confirmMessage}>{confirm?.message}</Text>
            <View style={styles.confirmButtons}>
              {confirm?.buttons.map((btn, i) => {
                const isDestructive = btn.style === 'destructive';
                const isCancel = btn.style === 'cancel';
                return (
                  <TouchableOpacity
                    key={i}
                    style={[
                      styles.confirmBtn,
                      isCancel && styles.confirmBtnCancel,
                      isDestructive && styles.confirmBtnDestructive,
                      !isCancel && !isDestructive && styles.confirmBtnDefault,
                    ]}
                    onPress={() => handleConfirmButton(btn)}
                  >
                    <Text
                      style={[
                        styles.confirmBtnText,
                        isCancel && styles.confirmBtnTextCancel,
                        isDestructive && styles.confirmBtnTextDestructive,
                        !isCancel && !isDestructive && styles.confirmBtnTextDefault,
                      ]}
                    >
                      {btn.text}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </View>
      </Modal>
    </ToastContext.Provider>
  );
};

export const useToast = () => useContext(ToastContext);

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 60,
    left: SPACING.md,
    right: SPACING.md,
    zIndex: 9999,
    alignItems: 'center',
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    borderRadius: 12,
    marginBottom: SPACING.xs,
    width: '100%',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  toastText: {
    color: '#fff',
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.lg,
  },
  confirmCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: SPACING.lg,
    width: '100%',
    maxWidth: 340,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
  },
  confirmTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SPACING.sm,
    textAlign: 'center',
  },
  confirmMessage: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginBottom: SPACING.lg,
    textAlign: 'center',
    lineHeight: 20,
  },
  confirmButtons: {
    gap: SPACING.sm,
    marginTop: SPACING.xs,
  },
  confirmBtn: {
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  confirmBtnCancel: {
    backgroundColor: 'transparent',
  },
  confirmBtnDestructive: {
    backgroundColor: COLORS.primary,
  },
  confirmBtnDefault: {
    backgroundColor: COLORS.primary,
  },
  confirmBtnText: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
  },
  confirmBtnTextCancel: {
    color: COLORS.textSecondary,
  },
  confirmBtnTextDestructive: {
    color: COLORS.white,
  },
  confirmBtnTextDefault: {
    color: COLORS.white,
  },
});
