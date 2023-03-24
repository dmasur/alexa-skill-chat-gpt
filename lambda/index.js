import {ChatGPTAPI} from 'chatgpt';
import Alexa from 'ask-sdk';
import i18n from 'i18next';
import sprintf from 'i18next-sprintf-postprocessor';
import {languageStringsEnglish} from './languageStrings.js';
import AWS from "aws-sdk";

const languageStrings = {
  'en': languageStringsEnglish
}

const LaunchRequest = {
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

const ExitHandler = {
  canHandle(handlerInput) {
    return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
        && (Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.CancelIntent'
            || Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.StopIntent');
  },
  handle(handlerInput) {
    const requestAttributes = handlerInput.attributesManager.getRequestAttributes();

    return handlerInput.responseBuilder
        .speak(requestAttributes.t('EXIT_MESSAGE'))
        .getResponse();
  },
};

const SessionEndedRequest = {
  canHandle(handlerInput) {
    return Alexa.getRequestType(handlerInput.requestEnvelope) === 'SessionEndedRequest';
  },
  handle(handlerInput) {
    console.log(`Session ended with reason: ${handlerInput.requestEnvelope.request.reason}`);
    return handlerInput.responseBuilder.getResponse();
  },
};

const HelpIntent = {
  canHandle(handlerInput) {
    return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
        && Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.HelpIntent';
  },
  handle(handlerInput) {
    const requestAttributes = handlerInput.attributesManager.getRequestAttributes();

    return handlerInput.responseBuilder
        .speak(requestAttributes.t('HELP_MESSAGE'))
        .reprompt(requestAttributes.t('HELP_REPROMPT'))
        .getResponse();
  },
};

const YesIntent = {
  canHandle(handlerInput) {
    return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
        && Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.YesIntent';
  },
  handle(handlerInput) {
    const { attributesManager } = handlerInput;
    const requestAttributes = attributesManager.getRequestAttributes();

    return handlerInput.responseBuilder
        .speak(requestAttributes.t('YES_MESSAGE'))
        .reprompt(requestAttributes.t('HELP_REPROMPT'))
        .getResponse();
  },
};

const NoIntent = {
  canHandle(handlerInput) {
    return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
        && Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.NoIntent';
  },
  async handle(handlerInput) {
    const { attributesManager } = handlerInput;
    const requestAttributes = attributesManager.getRequestAttributes();

    // attributesManager.setPersistentAttributes(sessionAttributes);
    // await attributesManager.savePersistentAttributes();

    return handlerInput.responseBuilder
        .speak(requestAttributes.t('EXIT_MESSAGE'))
        .getResponse();

  },
};

const UnhandledIntent = {
  canHandle() {
    return true;
  },
  handle(handlerInput) {
    const requestAttributes = handlerInput.attributesManager.getRequestAttributes();

    return handlerInput.responseBuilder
        .speak(requestAttributes.t('CONTINUE_MESSAGE'))
        .reprompt(requestAttributes.t('CONTINUE_MESSAGE'))
        .getResponse();
  },
};

function isProduct(product) {
  return product &&
      product.length > 0;
}

function isEntitled(product) {
  return isProduct(product) &&
      product[0].entitled === 'ENTITLED';
}

const AskingQuestionIntent = {
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
      return handlerInput.responseBuilder
          .speak(requestAttributes.t('QUESTION_RESPONSE', response))
          .reprompt(requestAttributes.t('CONTINUE_MESSAGE'))
          .getResponse();
    } catch (error) {
      return handlerInput.responseBuilder
          .speak(requestAttributes.t('TIMEOUT_ERROR_MESSAGE'))
          .reprompt(requestAttributes.t('CONTINUE_MESSAGE'))
          .getResponse();
    }
  }
}

const BuySubsIntent = {
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

const CancelSubIntent = {
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

const ErrorHandler = {
  canHandle() {
    return true;
  },
  handle(handlerInput, error) {
    console.log(`Error handled: ${error.message}`);
    console.log(`Error stack: ${error.stack}`);
    const requestAttributes = handlerInput.attributesManager.getRequestAttributes();

    return handlerInput.responseBuilder
        .speak(requestAttributes.t('ERROR_MESSAGE'))
        .reprompt(requestAttributes.t('ERROR_MESSAGE'))
        .getResponse();
  },
};

const FallbackHandler = {
  canHandle(handlerInput) {
    // handle fallback intent, yes and no when playing a game
    // for yes and no, will only get here if and not caught by the normal intent handler
    return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
        && (Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.FallbackIntent');
  },
  handle(handlerInput) {
    const { attributesManager } = handlerInput;
    const requestAttributes = attributesManager.getRequestAttributes();

    return handlerInput.responseBuilder
        .speak(requestAttributes.t('FALLBACK_MESSAGE'))
        .reprompt(requestAttributes.t('CONTINUE_MESSAGE'))
        .getResponse();
  },
};

const LocalizationInterceptor = {
  process(handlerInput) {
    const localizationClient = i18n.use(sprintf).init({
      lng: Alexa.getLocale(handlerInput.requestEnvelope),
      resources: languageStrings,
    });
    localizationClient.localize = function localize() {
      const args = arguments;
      const values = [];
      for (let i = 1; i < args.length; i += 1) {
        values.push(args[i]);
      }
      const value = i18n.t(args[0], {
        returnObjects: true,
        postProcess: 'sprintf',
        sprintf: values,
      });
      if (Array.isArray(value)) {
        return value[Math.floor(Math.random() * value.length)];
      }
      return value;
    };
    const attributes = handlerInput.attributesManager.getRequestAttributes();
    attributes.t = function translate(...args) {
      return localizationClient.localize(...args);
    };
  },
};

const skillBuilder = Alexa.SkillBuilders.custom();

export const handler = skillBuilder
    .addRequestHandlers(
        AskingQuestionIntent,
        BuySubsIntent,
        LaunchRequest,
        ExitHandler,
        FallbackHandler,
        SessionEndedRequest,
        HelpIntent,
        YesIntent,
        NoIntent,
        CancelSubIntent,
        UnhandledIntent
    )
    .addRequestInterceptors(LocalizationInterceptor)
    .addErrorHandlers(ErrorHandler)
    .withApiClient(new Alexa.DefaultApiClient())
    .lambda();