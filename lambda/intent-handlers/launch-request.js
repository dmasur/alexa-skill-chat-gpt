import Alexa from "ask-sdk";

export const LaunchRequest = {
    canHandle(handlerInput) {
        return Alexa.isNewSession(handlerInput.requestEnvelope)
            || Alexa.getRequestType(handlerInput.requestEnvelope) === 'LaunchRequest';
    },
    async handle(handlerInput) {
        const { attributesManager } = handlerInput;
        const requestAttributes = attributesManager.getRequestAttributes();
        // const attributes = await attributesManager.getPersistentAttributes() || {};
        attributesManager.setSessionAttributes({
            interaction: 0
        });

        const speechOutput = requestAttributes.t('LAUNCH_MESSAGE');
        const reprompt = requestAttributes.t('CONTINUE_MESSAGE');

        return handlerInput.responseBuilder
            .speak(speechOutput)
            .reprompt(reprompt)
            .getResponse();
    },
};