
import {onDocumentCreated} from "firebase-functions/v2/firestore";
import * as logger from "firebase-functions/logger";
import * as admin from "firebase-admin";

admin.initializeApp();

// Assume que os tokens FCM dos dispositivos estão armazenados em uma coleção 'fcmTokens'
// com cada documento tendo um campo 'token'.
export const onNewInspection = onDocumentCreated("inspections/{inspectionId}", async (event) => {
  const snapshot = event.data;
  if (!snapshot) {
    logger.log("Nenhum dado encontrado no evento da inspeção.");
    return;
  }

  const inspectionData = snapshot.data();
  const area = inspectionData.area || "Área não especificada";

  const payload = {
    notification: {
      title: "Nova Inspeção Registrada",
      body: `Uma nova inspeção na área '${area}' foi registrada.`,
      click_action: "/inspections", // Opcional: para onde o usuário é direcionado
    },
  };

  logger.log("Preparando para enviar notificação:", payload);

  try {
    const tokensSnapshot = await admin.firestore().collection("fcmTokens").get();
    if (tokensSnapshot.empty) {
      logger.log("Nenhum token de dispositivo encontrado.");
      return;
    }

    const tokens = tokensSnapshot.docs.map((doc) => doc.data().token);
    logger.log(
      `Enviando notificação para ${tokens.length} dispositivo(s).`,
    );

    const response = await admin.messaging().sendToDevice(tokens, payload);
    logger.log("Resposta do FCM:", response);

    // Limpeza de tokens inválidos (opcional, mas recomendado)
    response.results.forEach((result, index) => {
      const error = result.error;
      if (error) {
        logger.error(
          "Falha ao enviar notificação para",
          tokens[index],
          error,
        );
        if (
          error.code === "messaging/invalid-registration-token" ||
          error.code === "messaging/registration-token-not-registered"
        ) {
          const invalidToken = tokens[index];
          const tokenDocRef = tokensSnapshot.docs[index].ref;
          logger.log(
            `Removendo token inválido: ${invalidToken}`,
          );
          tokenDocRef.delete();
        }
      }
    });
  } catch (error) {
    logger.error("Erro ao enviar notificação:", error);
  }
});
