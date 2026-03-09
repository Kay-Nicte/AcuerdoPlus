import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, Alert, Image, StyleSheet, ScrollView } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { authorizationService } from '../../services/authorizationService';
import { minorService } from '../../services/minorService';
import { authService } from '../../services/authService';
import { Authorization } from '../../types';
import ApprovalBadge from '../../components/common/ApprovalBadge';
import LoadingScreen from '../../components/common/LoadingScreen';
import { COLORS, SPACING, FONT_SIZES } from '../../config/theme';

const AuthorizationDetailScreen: React.FC<{ route: any; navigation: any }> = ({ route, navigation }) => {
  const { t } = useTranslation();
  const { authorizationId } = route.params;
  const { user, userData } = useAuth();
  const { showToast } = useToast();
  const [auth, setAuth] = useState<Authorization | null>(null);
  const [minorName, setMinorName] = useState('');
  const [memberStatuses, setMemberStatuses] = useState<{ name: string; status: boolean | null }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadData(); }, [authorizationId]);

  const loadData = async () => {
    try {
      const data = await authorizationService.getAuthorization(authorizationId);
      setAuth(data);
      if (data) {
        const minor = await minorService.getMinor(data.minorId);
        if (minor) setMinorName(minor.name);

        const statuses: { name: string; status: boolean | null }[] = [];
        for (const [uid, val] of Object.entries(data.authorizations)) {
          const u = await authService.getUserData(uid);
          statuses.push({ name: u?.displayName || uid, status: val });
        }
        setMemberStatuses(statuses);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRespond = async (approved: boolean) => {
    if (!auth || !user) return;
    try {
      await authorizationService.respond(auth.id, user.uid, userData?.displayName || 'Usuario', approved);
      loadData();
    } catch (error: any) {
      showToast(error.message, 'error');
    }
  };

  const handleRequestRevoke = async () => {
    if (!auth || !user) return;
    const isSecondVote = auth.revocationRequestedBy && auth.revocationRequestedBy !== user.uid;
    const message = isSecondVote
      ? t('authz.revokeConfirmOther')
      : t('authz.revokeConfirmSelf');

    Alert.alert(t('authz.revoke'), message, [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: isSecondVote ? t('authz.confirmRevocation') : t('authz.requestRevocation'),
        style: 'destructive',
        onPress: async () => {
          try {
            await authorizationService.requestRevoke(auth.id, user.uid, userData?.displayName || 'Usuario');
            loadData();
          } catch (error: any) {
            showToast(error.message, 'error');
          }
        },
      },
    ]);
  };

  const handleCancelRevoke = async () => {
    if (!auth || !user) return;
    try {
      await authorizationService.cancelRevoke(auth.id, user.uid, userData?.displayName || 'Usuario');
      loadData();
    } catch (error: any) {
      showToast(error.message, 'error');
    }
  };

  if (loading) return <LoadingScreen />;
  if (!auth) return <Text style={{ padding: SPACING.lg }}>{t('authz.title')}</Text>;

  const myVote = auth.authorizations[user?.uid || ''];
  const canRespond = myVote === null && auth.status === 'pending';
  const canRevoke = auth.status === 'approved' && !auth.revokedAt;
  const myRevocationPending = auth.revocationRequestedBy === user?.uid;
  const otherRevocationPending = auth.revocationRequestedBy && auth.revocationRequestedBy !== user?.uid;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.title}>{auth.activity}</Text>
        <ApprovalBadge status={auth.status} />
      </View>

      <Text style={styles.description}>{auth.description}</Text>

      <View style={styles.infoCard}>
        <View style={styles.row}>
          <Text style={styles.label}>{t('authz.minor')}</Text>
          <Text style={styles.value}>{minorName}</Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>{t('authz.title')}</Text>
      {memberStatuses.map((m, i) => (
        <View key={i} style={styles.memberRow}>
          <Text style={styles.memberName}>{m.name}</Text>
          <Text style={[styles.memberStatus, {
            color: m.status === true ? COLORS.success : m.status === false ? COLORS.error : COLORS.warning,
          }]}>
            {m.status === true ? t('authz.approved') : m.status === false ? t('authz.rejected') : t('authz.pending')}
          </Text>
        </View>
      ))}

      {auth.documentUrls.length > 0 && (
        <View style={{ marginTop: SPACING.lg }}>
          <Text style={styles.sectionTitle}>{t('authz.title')}</Text>
          {auth.documentUrls.map((url, i) => (
            <Image key={i} source={{ uri: url }} style={styles.docImage} resizeMode="contain" />
          ))}
        </View>
      )}

      {canRespond && (
        <View style={styles.actions}>
          <TouchableOpacity style={styles.approveBtn} onPress={() => handleRespond(true)}>
            <Text style={styles.actionText}>{t('authz.approved')}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.rejectBtn} onPress={() => handleRespond(false)}>
            <Text style={styles.actionText}>{t('authz.rejected')}</Text>
          </TouchableOpacity>
        </View>
      )}

      {canRevoke && !myRevocationPending && (
        <TouchableOpacity style={styles.revokeBtn} onPress={handleRequestRevoke}>
          <Text style={styles.revokeText}>
            {otherRevocationPending ? t('authz.confirmRevocation') : t('authz.requestRevocation')}
          </Text>
        </TouchableOpacity>
      )}

      {otherRevocationPending && !myRevocationPending && (
        <Text style={styles.revocationNote}>
          {t('authz.revokeConfirmOther')}
        </Text>
      )}

      {myRevocationPending && (
        <View>
          <Text style={styles.revocationNote}>
            {t('authz.revokeConfirmSelf')}
          </Text>
          <TouchableOpacity style={styles.cancelRevokeBtn} onPress={handleCancelRevoke}>
            <Text style={styles.cancelRevokeText}>{t('common.cancel')}</Text>
          </TouchableOpacity>
        </View>
      )}

      {auth.status === 'approved' && !auth.addedToCalendar && !auth.revokedAt && (
        <TouchableOpacity
          style={styles.calendarBtn}
          onPress={() => {
            navigation.navigate('Calendario', {
              screen: 'AddEvent',
              params: {
                authorizationId: auth.id,
                prefillTitle: auth.activity,
                prefillMinorId: auth.minorId,
              },
            });
          }}
        >
          <Text style={styles.calendarBtnText}>{t('calendar.newEvent')}</Text>
        </TouchableOpacity>
      )}

      {auth.addedToCalendar && (
        <Text style={styles.calendarNote}>{t('calendar.title')}</Text>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: SPACING.lg, paddingTop: SPACING.xl },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.sm },
  title: { fontSize: FONT_SIZES.xl, fontWeight: 'bold', color: COLORS.text, flex: 1, marginRight: SPACING.sm },
  description: { fontSize: FONT_SIZES.md, color: COLORS.textSecondary, marginBottom: SPACING.lg },
  infoCard: { backgroundColor: COLORS.backgroundSecondary, borderRadius: 12, padding: SPACING.md, marginBottom: SPACING.lg },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: SPACING.sm },
  label: { fontSize: FONT_SIZES.sm, color: COLORS.textSecondary },
  value: { fontSize: FONT_SIZES.sm, fontWeight: '600', color: COLORS.text },
  sectionTitle: { fontSize: FONT_SIZES.lg, fontWeight: '700', color: COLORS.text, marginBottom: SPACING.sm },
  memberRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: SPACING.sm, borderBottomWidth: 1, borderBottomColor: COLORS.borderLight },
  memberName: { fontSize: FONT_SIZES.md, color: COLORS.text },
  memberStatus: { fontSize: FONT_SIZES.sm, fontWeight: '600' },
  docImage: { width: '100%', height: 150, borderRadius: 8, backgroundColor: COLORS.backgroundSecondary, marginBottom: SPACING.sm },
  actions: { flexDirection: 'row', gap: SPACING.md, marginTop: SPACING.lg },
  approveBtn: { flex: 1, backgroundColor: COLORS.success, padding: SPACING.md, borderRadius: 8, alignItems: 'center' },
  rejectBtn: { flex: 1, backgroundColor: COLORS.error, padding: SPACING.md, borderRadius: 8, alignItems: 'center' },
  actionText: { color: COLORS.white, fontSize: FONT_SIZES.md, fontWeight: '600' },
  revokeBtn: { backgroundColor: COLORS.error + '10', padding: SPACING.md, borderRadius: 8, alignItems: 'center', marginTop: SPACING.lg },
  revokeText: { color: COLORS.error, fontSize: FONT_SIZES.md, fontWeight: '600' },
  revocationNote: { fontSize: FONT_SIZES.sm, color: COLORS.warning, textAlign: 'center', marginTop: SPACING.md, fontStyle: 'italic' },
  cancelRevokeBtn: { padding: SPACING.md, borderRadius: 8, alignItems: 'center', marginTop: SPACING.sm },
  cancelRevokeText: { color: COLORS.textMuted, fontSize: FONT_SIZES.sm },
  calendarBtn: { backgroundColor: COLORS.info + '15', padding: SPACING.md, borderRadius: 8, alignItems: 'center', marginTop: SPACING.lg },
  calendarBtnText: { color: COLORS.info, fontSize: FONT_SIZES.md, fontWeight: '600' },
  calendarNote: { fontSize: FONT_SIZES.sm, color: COLORS.success, textAlign: 'center', marginTop: SPACING.lg, fontStyle: 'italic' },
});

export default AuthorizationDetailScreen;
