import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useTranslation } from "react-i18next";
import { RootStackParamList } from "../../navigation/AppNavigator";
import { useAgreement } from "../../context/AgreementContext";

type AgreementSelectionScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "AgreementSelection"
>;

interface Props {
  navigation: AgreementSelectionScreenNavigationProp;
}

const AgreementSelectionScreen: React.FC<Props> = ({ navigation }) => {
  const { t } = useTranslation();
  const { agreements = [] } = useAgreement();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>{t('agreementFlow.appName')}</Text>
        <Text style={styles.subtitle}>{t('agreementFlow.whatToDo')}</Text>

        <TouchableOpacity
          style={styles.button}
          onPress={() => navigation.navigate("CreateAgreement")}
        >
          <Text style={styles.buttonText}>{t('agreementFlow.createNew')}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.buttonSecondary]}
          onPress={() => navigation.navigate("JoinAgreement")}
        >
          <Text style={[styles.buttonText, styles.buttonTextSecondary]}>
            {t('agreementFlow.joinExisting')}
          </Text>
        </TouchableOpacity>

        {agreements.length > 0 && (
          <View style={styles.existingAgreements}>
            <Text style={styles.existingTitle}>{t('agreementFlow.yourAgreements')}</Text>
            {agreements.map((agreement) => (
              <TouchableOpacity
                key={agreement.id}
                style={styles.agreementItem}
                onPress={() => {
                  console.log("Seleccionar acuerdo", agreement.id);
                }}
              >
                <Text style={styles.agreementText}>
                  {t('agreementFlow.agreementModel', { model: agreement.economicModel })}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
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
  title: {
    fontSize: 36,
    fontWeight: "bold",
    color: "#A93D5C",
    textAlign: "center",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    color: "#666",
    textAlign: "center",
    marginBottom: 48,
  },
  button: {
    backgroundColor: "#A93D5C",
    padding: 18,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 16,
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
  existingAgreements: {
    marginTop: 48,
  },
  existingTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 16,
  },
  agreementItem: {
    padding: 16,
    backgroundColor: "#f5f5f5",
    borderRadius: 8,
    marginBottom: 8,
  },
  agreementText: {
    fontSize: 14,
    color: "#333",
  },
});

export default AgreementSelectionScreen;
