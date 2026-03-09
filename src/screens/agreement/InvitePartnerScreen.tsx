import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Share,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RouteProp } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import { RootStackParamList } from "../../navigation/AppNavigator";
import * as Clipboard from "expo-clipboard";
import { useToast } from "../../context/ToastContext";

type InvitePartnerScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "InvitePartner"
>;

type InvitePartnerScreenRouteProp = RouteProp<
  RootStackParamList,
  "InvitePartner"
>;

interface Props {
  navigation: InvitePartnerScreenNavigationProp;
  route: InvitePartnerScreenRouteProp;
}

const InvitePartnerScreen: React.FC<Props> = ({ navigation, route }) => {
  const { t } = useTranslation();
  const { agreementId, inviteCode } = route.params;
  const { showToast } = useToast();

  const handleCopyCode = async () => {
    await Clipboard.setStringAsync(inviteCode);
    showToast(t('agreementFlow.codeCopied'), "success");
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: t('agreementFlow.shareText', { code: inviteCode }),
      });
    } catch (error) {
      console.error(error);
    }
  };

  const handleContinue = () => {
    navigation.navigate("WelcomePremium", { agreementId });
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.successIcon}>
          <Ionicons name="checkmark" size={40} color="#4CAF50" />
        </View>

        <Text style={styles.title}>{t('agreementFlow.agreementCreated')}</Text>
        <Text style={styles.subtitle}>
          {t('agreementFlow.shareCodeMsg')}
        </Text>

        <View style={styles.codeContainer}>
          <Text style={styles.codeLabel}>{t('agreementFlow.inviteCode')}</Text>
          <Text style={styles.code}>{inviteCode}</Text>
        </View>

        <TouchableOpacity style={styles.button} onPress={handleCopyCode}>
          <Text style={styles.buttonText}>{t('agreementFlow.copyCode')}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.buttonSecondary]}
          onPress={handleShare}
        >
          <Text style={[styles.buttonText, styles.buttonTextSecondary]}>
            {t('agreementFlow.shareCode')}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.linkButton} onPress={handleContinue}>
          <Text style={styles.linkText}>{t('agreementFlow.continueWithout')}</Text>
        </TouchableOpacity>
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
    justifyContent: "center",
  },
  successIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#E8F5E9",
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
    marginBottom: 24,
  },
  successEmoji: {
    fontSize: 40,
    color: "#4CAF50",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#333",
    textAlign: "center",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginBottom: 48,
  },
  codeContainer: {
    backgroundColor: "#F5F5F5",
    padding: 24,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 24,
  },
  codeLabel: {
    fontSize: 14,
    color: "#666",
    marginBottom: 8,
  },
  code: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#A93D5C",
    letterSpacing: 8,
  },
  button: {
    backgroundColor: "#A93D5C",
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 12,
  },
  buttonSecondary: {
    backgroundColor: "#fff",
    borderWidth: 2,
    borderColor: "#A93D5C",
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  buttonTextSecondary: {
    color: "#A93D5C",
  },
  linkButton: {
    marginTop: 24,
    alignItems: "center",
  },
  linkText: {
    fontSize: 14,
    color: "#999",
  },
});

export default InvitePartnerScreen;
