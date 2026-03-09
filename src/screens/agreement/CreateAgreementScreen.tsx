import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useTranslation } from "react-i18next";
import { RootStackParamList } from "../../navigation/AppNavigator";
import { useAgreement } from "../../context/AgreementContext";
import { useToast } from "../../context/ToastContext";

type CreateAgreementScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "CreateAgreement"
>;

interface Props {
  navigation: CreateAgreementScreenNavigationProp;
}

const CreateAgreementScreen: React.FC<Props> = ({ navigation }) => {
  const { t } = useTranslation();
  const [selectedModel, setSelectedModel] = useState<
    "fixed" | "shared" | "mixed" | null
  >(null);
  const [loading, setLoading] = useState(false);
  const { createAgreement } = useAgreement();
  const { showToast } = useToast();

  const handleCreateAgreement = async () => {
    if (!selectedModel) {
      showToast(t('agreementFlow.selectModelError'), "error");
      return;
    }

    setLoading(true);
    try {
      const { agreementId, inviteCode } = await createAgreement(selectedModel);
      navigation.navigate("CustodyType", { agreementId, inviteCode });
    } catch (error: any) {
      showToast(t('agreementFlow.createError'), "error");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>{t('agreementFlow.createTitle')}</Text>
        <Text style={styles.subtitle}>
          {t('agreementFlow.selectModel')}
        </Text>

        <TouchableOpacity
          style={[
            styles.modelCard,
            selectedModel === "fixed" && styles.modelCardSelected,
          ]}
          onPress={() => setSelectedModel("fixed")}
        >
          <View style={styles.modelHeader}>
            <Text style={styles.modelTitle}>{t('agreementFlow.fixedMaintenance')}</Text>
            {selectedModel === "fixed" && (
              <View style={styles.checkmark}>
                <Ionicons name="checkmark" size={16} color="#fff" />
              </View>
            )}
          </View>
          <Text style={styles.modelDescription}>
            {t('agreementFlow.fixedMaintenanceDesc')}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.modelCard,
            selectedModel === "shared" && styles.modelCardSelected,
          ]}
          onPress={() => setSelectedModel("shared")}
        >
          <View style={styles.modelHeader}>
            <Text style={styles.modelTitle}>{t('agreementFlow.expenseSplitting')}</Text>
            {selectedModel === "shared" && (
              <View style={styles.checkmark}>
                <Ionicons name="checkmark" size={16} color="#fff" />
              </View>
            )}
          </View>
          <Text style={styles.modelDescription}>
            {t('agreementFlow.expenseSplittingDesc')}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.modelCard,
            selectedModel === "mixed" && styles.modelCardSelected,
          ]}
          onPress={() => setSelectedModel("mixed")}
        >
          <View style={styles.modelHeader}>
            <Text style={styles.modelTitle}>{t('models.mixed')}</Text>
            {selectedModel === "mixed" && (
              <View style={styles.checkmark}>
                <Ionicons name="checkmark" size={16} color="#fff" />
              </View>
            )}
          </View>
          <Text style={styles.modelDescription}>
            {t('agreementFlow.mixedDesc')}
          </Text>
        </TouchableOpacity>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.buttonSecondary}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.buttonSecondaryText}>{t('common.cancel')}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, !selectedModel && styles.buttonDisabled]}
            onPress={handleCreateAgreement}
            disabled={!selectedModel || loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>{t('agreementFlow.createAgreement')}</Text>
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
  modelCard: {
    padding: 20,
    borderWidth: 2,
    borderColor: "#ddd",
    borderRadius: 12,
    marginBottom: 16,
  },
  modelCardSelected: {
    borderColor: "#A93D5C",
    backgroundColor: "#FFF5F7",
  },
  modelHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  modelTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
  },
  checkmark: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#A93D5C",
    alignItems: "center",
    justifyContent: "center",
  },
  checkmarkText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  modelDescription: {
    fontSize: 14,
    color: "#666",
    lineHeight: 20,
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

export default CreateAgreementScreen;
