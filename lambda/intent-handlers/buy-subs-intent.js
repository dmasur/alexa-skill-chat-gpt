import Alexa from "ask-sdk";

export const BuySubsIntent = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'BuySubsIntent';
    },
    async handle(handlerInput) {
        return handlerInput.responseBuilder
            .addDirective({
                type: "Connections.SendRequest",
                name: "Buy",
                payload: {
                    InSkillProduct: {
                        productId: "amzn1.adg.product.1552c261-fbce-42eb-900a-779d0923cbeb",
                    }
                },
                token: "amzn1.adg.product.1552c261-fbce-42eb-900a-779d0923cbeb"
            })
            .getResponse();
    }
}
