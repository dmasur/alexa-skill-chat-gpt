import Alexa from "ask-sdk";

export const CancelSubIntent = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'CancelSubIntent';
    },
    async handle(handlerInput) {
        return handlerInput.responseBuilder
            .addDirective({
                type: "Connections.SendRequest",
                name: "Cancel",
                payload: {
                    InSkillProduct: {
                        productId: "amzn1.adg.product.1552c261-fbce-42eb-900a-779d0923cbeb",
                    }
                },
                token: "amzn1.adg.product.1552c261-fbce-42eb-900a-779d0923cbeb"
            })
            .getResponse();
    },
};