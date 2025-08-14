"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendInspectionNotification = void 0;
const firestore_1 = require("firebase-functions/v2/firestore");
const logger = __importStar(require("firebase-functions/logger"));
const admin = __importStar(require("firebase-admin"));
admin.initializeApp();
// Assume que os tokens FCM dos dispositivos estão armazenados em uma coleção 'fcmTokens'
// com cada documento tendo um campo 'token'.
exports.sendInspectionNotification = (0, firestore_1.onDocumentCreated)("inspections/{inspectionId}", async (event) => {
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
        logger.log(`Enviando notificação para ${tokens.length} dispositivo(s).`);
        const response = await admin.messaging().sendToDevice(tokens, payload);
        logger.log("Resposta do FCM:", response);
        // Limpeza de tokens inválidos (opcional, mas recomendado)
        response.results.forEach((result, index) => {
            const error = result.error;
            if (error) {
                logger.error("Falha ao enviar notificação para", tokens[index], error);
                if (error.code === "messaging/invalid-registration-token" ||
                    error.code === "messaging/registration-token-not-registered") {
                    const invalidToken = tokens[index];
                    const tokenDocRef = tokensSnapshot.docs[index].ref;
                    logger.log(`Removendo token inválido: ${invalidToken}`);
                    tokenDocRef.delete();
                }
            }
        });
    }
    catch (error) {
        logger.error("Erro ao enviar notificação:", error);
    }
});
//# sourceMappingURL=index.js.map