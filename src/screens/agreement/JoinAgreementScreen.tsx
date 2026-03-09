import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useTranslation } from "react-i18next";
import { RootStackParamList } from "../../navigation/AppNavigator";
import { useAgreement } from "../../context/AgreementContext";
import { useToast } from "../../context/ToastContext";

type JoinAgreementScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "JoinAgreement"
>;

interface Props {
  navigation: JoinAgreementScreenNavigationProp;
}

const JoinAgreementScreen: React.FC<Props> = ({ navigation }) => {
  const { t } = useTranslation();
  const [inviteCode, setInviteCode] = useState("");
  const [loading, setLoading] = useState(false);
  const { joinAgreement } = useAgreement();
  const { showToast } = useToast();

  const handleJoinAgreement = async () => {
    if (!inviteCode.trim()) {
      showToast(t('agreementFlow.enterCode'), "error");
      return;
    }

    setLoading(true);
    try {
      const agreementId = await joinAgreement(inviteCode.toUpperCase());
      showToast(t('agreementFlow.joinSuccess'), "success");
      navigation.navigate("WelcomePremium", { agreementId });
    } catch (error: any) {
      showToast(error.message || t('agreementFlow.joinError'), "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>{t('agreementFlow.joinTitle')}</Text>
        <Text style={styles.subtitle}>
          {t('agreementFlow.joinSubtitle')}
        </Text>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>{t('agreementFlow.inviteCode')}</Text>
          <TextInput
            style={styles.input}
            placeholder={t('agreementFlow.codePlaceholder')}
            value={inviteCode}
            onChangeText={setInviteCode}
            autoCapitalize="characters"
            maxLength={6}
          />
          <Text style={styles.hint}>
            {t('agreementFlow.codeHint')}
          </Text>
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.buttonSecondary}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.buttonSecondaryText}>{t('common.cancel')}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.button,
              (!inviteCode.trim() || loading) && styles.buttonDisabled,
            ]}
            onPress={handleJoinAgreement}
            disabled={!inviteCode.trim() || loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>{t('agreementFlow.join')}</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  content: {
    flex: 1,
    padding: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
    marginBottom: 32,
  },
  inputContainer: {
    marginBottom: 32,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 16,
    fontSize: 18,
    backgroundColor: "#f9f9f9",
    letterSpacing: 4,
    textAlign: "center",
  },
  hint: {
    fontSize: 14,
    color: "#999",
    marginTop: 8,
  },
  buttonContainer: {
    flexDirection: "row",
    marginTop: "auto",
    gap: 12,
  },
  button: {
    flex: 1,
    backgroundColor: "#A93D5C",
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
  },
  buttonDisabled: {
    backgroundColor: "#ccc",
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  buttonSecondary: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#A93D5C",
  },
  buttonSecondaryText: {
    color: "#A93D5C",
    fontSize: 16,
    fontWeight: "600",
  },
});

export default JoinAgreementScreen;
