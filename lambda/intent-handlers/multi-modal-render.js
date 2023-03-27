import Alexa from 'ask-sdk';

const DOCUMENT_ID = "VisualizeResponseText";

// "headerAttributionImage": "https://d2o906d8ln7ui1.cloudfront.net/images/response_builder/logo-world-of-plants-2.png",
const datasource = {
    "simpleTextTemplateData": {
        "type": "object",
        "properties": {
            "backgroundImage": "https://d2o906d8ln7ui1.cloudfront.net/images/response_builder/background-green.png",
            "foregroundImageLocation": "left",
            "foregroundImageSource": "https://d2s5tydsfac9v4.cloudfront.net/chat-gpt-108.png",
            "headerTitle": "ChatGPT Response",
            "headerSubtitle": "",
            "hintText": "Try, \"Jarvis, what is chat gpt\"",
            "primaryText": "",
            "textAlignment": "start",
            "titleText": "User Input"
        }
    }
};

const createDirectivePayload = (aplDocumentId, dataSources = {}, tokenId = "documentToken") => {
    return {
        type: "Alexa.Presentation.APL.RenderDocument",
        token: tokenId,
        document: {
            type: "Link",
            src: "doc://alexa/apl/documents/" + aplDocumentId
        },
        datasources: dataSources
    }
};

export function getAPIDirective(handlerInput, userInputText, responseText) {
    if (Alexa.getSupportedInterfaces(handlerInput.requestEnvelope)['Alexa.Presentation.APL']) {
        datasource.simpleTextTemplateData.properties.titleText = userInputText;
        datasource.simpleTextTemplateData.properties.primaryText = responseText;
        return createDirectivePayload(DOCUMENT_ID, datasource);
    }
    return null;
}