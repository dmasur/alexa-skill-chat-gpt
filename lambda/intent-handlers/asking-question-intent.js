import Alexa from "ask-sdk";
import AWS from "aws-sdk";
import {ChatGPTAPI} from "chatgpt";
import {getAPIDirective} from "./multi-modal-render.js";

function isProduct(product) {
    return product &&
        product.length > 0;
}

function isEntitled(product) {
    return isProduct(product) &&
        product[0].entitled === 'ENTITLED';
}

export const AskingQuestionIntent = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'AskingQuestionIntent';
    },
    async handle(handlerInput) {
        const sessionAttributes = handlerInput.attributesManager.getSessionAttributes();
        const requestAttributes = handlerInput.attributesManager.getRequestAttributes();
        const question = Alexa.getSlotValue(handlerInput.requestEnvelope, 'user_input');
        sessionAttributes.interaction += 1;

        //Check subscription status
        const locale = handlerInput.requestEnvelope.request.locale;
        const ms = handlerInput.serviceClientFactory.getMonetizationServiceClient();
        const result = await ms.getInSkillProducts(locale);
        const subscription = result.inSkillProducts.filter(record => record.referenceName === 'yearly_subscription');
        if (sessionAttributes.interaction > 5 && !isEntitled(subscription)) {
            return handlerInput.responseBuilder
                .speak(requestAttributes.t('SUBSCRIPTION_UPSELL'))
                .reprompt(requestAttributes.t('CONTINUE_MESSAGE'))
                .getResponse();
        }

        let secretsManager = new AWS.SecretsManager({region: 'us-west-2'});
        const rawApiKey = await secretsManager.getSecretValue({SecretId: "chatgpt/apikey"}).promise();
        const apiKey = rawApiKey.SecretString;
        const api = new ChatGPTAPI({
            apiKey: apiKey
        });
        try {
            const res = await api.sendMessage(question, {
                timeoutMs: 8000
            });
            const response = res.text;
            const aplDirective = getAPIDirective(handlerInput, question, response);
            if (aplDirective != null) {
                return handlerInput.responseBuilder
                    .addDirective(aplDirective)
                    .speak(requestAttributes.t('QUESTION_RESPONSE', response))
                    .reprompt(requestAttributes.t('CONTINUE_MESSAGE'))
                    .getResponse();
            }
            return handlerInput.responseBuilder
                .speak(requestAttributes.t('QUESTION_RESPONSE', response))
                .reprompt(requestAttributes.t('CONTINUE_MESSAGE'))
                .getResponse();
        } catch (error) {
            console.log(error)
            return handlerInput.responseBuilder
                .speak(requestAttributes.t('TIMEOUT_ERROR_MESSAGE'))
                .reprompt(requestAttributes.t('CONTINUE_MESSAGE'))
                .getResponse();
        }
    }
}