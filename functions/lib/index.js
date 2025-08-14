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
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.onNewInspection = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
admin.initializeApp();
// Assume que os tokens FCM dos dispositivos estão armazenados em uma coleção 'fcmTokens'
// com cada documento tendo um campo 'token'.
exports.onNewInspection = functions.firestore
    .document("inspections/{inspectionId}")
    .onCreate(async (snapshot, _context) => {
    const inspectionData = snapshot.data();
    if (!inspectionData) {
        functions.logger.log("Nenhum dado encontrado na inspeção.");
        return;
    }
    const area = inspectionData.area || "Área não especificada";
    const payload = {
        notification: {
            title: "Nova Inspeção Registrada",
            body: `Uma nova inspeção na área '${area}' foi registrada.`,
            click_action: "/inspections", // Opcional: para onde o usuário é direcionado
        },
    };
    functions.logger.log("Preparando para enviar notificação:", payload);
    try {
        const tokensSnapshot = await admin.firestore().collection("fcmTokens").get();
        if (tokensSnapshot.empty) {
            functions.logger.log("Nenhum token de dispositivo encontrado.");
            return;
        }
        const tokens = tokensSnapshot.docs.map((doc) => doc.data().token);
        functions.logger.log(`Enviando notificação para ${tokens.length} dispositivo(s).`);
        const response = await admin.messaging().sendToDevice(tokens, payload);
        functions.logger.log("Resposta do FCM:", response);
        // Limpeza de tokens inválidos (opcional, mas recomendado)
        response.results.forEach((result, index) => {
            const error = result.error;
            if (error) {
                functions.logger.error("Falha ao enviar notificação para", tokens[index], error);
                if (error.code === "messaging/invalid-registration-token" ||
                    error.code === "messaging/registration-token-not-registered") {
                    const invalidToken = tokens[index];
                    const tokenDocRef = tokensSnapshot.docs[index].ref;
                    functions.logger.log(`Removendo token inválido: ${invalidToken}`);
                    tokenDocRef.delete();
                }
            }
        });
    }
    catch (error) {
        functions.logger.error("Erro ao enviar notificação:", error);
    }
});
//# sourceMappingURL=index.js.map