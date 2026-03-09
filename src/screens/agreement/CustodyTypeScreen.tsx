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
import { RouteProp } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import { RootStackParamList } from "../../navigation/AppNavigator";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../../config/firebase";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";

type CustodyTypeScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "CustodyType"
>;

type CustodyTypeScreenRouteProp = RouteProp<RootStackParamList, "CustodyType">;

interface Props {
  navigation: CustodyTypeScreenNavigationProp;
  route: CustodyTypeScreenRouteProp;
}

const CustodyTypeScreen: React.FC<Props> = ({ navigation, route }) => {
  const { t } = useTranslation();
  const { agreementId, inviteCode } = route.params;
  const { userData } = useAuth();
  const { showToast } = useToast();
  const [selectedType, setSelectedType] = useState<
    "shared" | "majority" | "exclusive" | null
  >(null);
  const [loading, setLoading] = useState(false);

  const handleContinue = async () => {
    if (!selectedType) {
      showToast(t('agreementFlow.selectCustodyError'), "error");
      return;
    }

    setLoading(true);
    try {
      const updateData: any = {
        custodyType: selectedType,
      };

      if (selectedType === "majority" && userData) {
        updateData.majorityCustodian = userData.uid;
      } else if (selectedType === "exclusive" && userData) {
        updateData.exclusiveCustodian = userData.uid;
      }

      await updateDoc(doc(db, "agreements", agreementId), updateData);
      navigation.navigate("InvitePartner", { agreementId, inviteCode });
    } catch (error: any) {
      showToast(t('agreementFlow.custodyError'), "error");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>{t('agreementFlow.custodyTitle')}</Text>
        <Text style={styles.subtitle}>
          {t('agreementFlow.custodySubtitle')}
        </Text>

        <TouchableOpacity
          style={[
            styles.custodyCard,
            selectedType === "shared" && styles.custodyCardSelected,
          ]}
          onPress={() => setSelectedType("shared")}
        >
          <View style={styles.custodyHeader}>
            <Text style={styles.custodyTitle}>{t('custodyTypes.shared')}</Text>
            {selectedType === "shared" && (
              <View style={styles.checkmark}>
                <Ionicons name="checkmark" size={16} color="#fff" />
              </View>
            )}
          </View>
          <Text style={styles.custodyDescription}>
            {t('custodyTypes.sharedDesc')}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.custodyCard,
            selectedType === "majority" && styles.custodyCardSelected,
          ]}
          onPress={() => setSelectedType("majority")}
        >
          <View style={styles.custodyHeader}>
            <Text style={styles.custodyTitle}>{t('custodyTypes.majority')}</Text>
            {selectedType === "majority" && (
              <View style={styles.checkmark}>
                <Ionicons name="checkmark" size={16} color="#fff" />
              </View>
            )}
          </View>
          <Text style={styles.custodyDescription}>
            {t('custodyTypes.majorityDesc')}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.custodyCard,
            selectedType === "exclusive" && styles.custodyCardSelected,
          ]}
          onPress={() => setSelectedType("exclusive")}
        >
          <View style={styles.custodyHeader}>
            <Text style={styles.custodyTitle}>{t('custodyTypes.exclusive')}</Text>
            {selectedType === "exclusive" && (
              <View style={styles.checkmark}>
                <Ionicons name="checkmark" size={16} color="#fff" />
              </View>
            )}
          </View>
          <Text style={styles.custodyDescription}>
            {t('custodyTypes.exclusiveDesc')}
          </Text>
        </TouchableOpacity>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.buttonSecondary}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.buttonSecondaryText}>{t('common.back')}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, !selectedType && styles.buttonDisabled]}
            onPress={handleContinue}
            disabled={!selectedType || loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>{t('common.continue')}</Text>
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
  custodyCard: {
    padding: 20,
    borderWidth: 2,
    borderColor: "#ddd",
    borderRadius: 12,
    marginBottom: 16,
  },
  custodyCardSelected: {
    borderColor: "#A93D5C",
    backgroundColor: "#FFF5F7",
  },
  custodyHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  custodyTitle: {
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
  custodyDescription: {
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

export default CustodyTypeScreen;
