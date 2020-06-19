const Alexa = require("ask-sdk-core");
const persistenceAdapter = require("ask-sdk-s3-persistence-adapter");
const birthdayHelper = require("./birthday-helper");

const LoadBirthdayInterceptor = {
  async process(handlerInput) {
    const attributesManager = handlerInput.attributesManager;
    const sessionAttributes =
      (await attributesManager.getPersistentAttributes()) || {};

    const year = sessionAttributes.hasOwnProperty("year")
      ? sessionAttributes.year
      : 0;
    const month = sessionAttributes.hasOwnProperty("month")
      ? sessionAttributes.month
      : 0;
    const day = sessionAttributes.hasOwnProperty("day")
      ? sessionAttributes.day
      : 0;

    if (year && month && day) {
      attributesManager.setSessionAttributes(sessionAttributes);
    }
  },
};

const LaunchRequestHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === "LaunchRequest";
  },
  handle(handlerInput) {
    const speechText = "Olá! Bem-vindo ao Hora do Bolo. Quando você nasceu?";
    const repromptText =
      "Eu nasci em seis de novembro de dois mil e quatorze. E você?";
    return handlerInput.responseBuilder
      .speak(speechText)
      .reprompt(repromptText)
      .getResponse();
  },
};

const HasBirthdayLaunchRequestHandler = {
  canHandle(handlerInput) {
    const attributesManager = handlerInput.attributesManager;
    const sessionAttributes = attributesManager.getSessionAttributes() || {};

    const year = sessionAttributes.hasOwnProperty("year")
      ? sessionAttributes.year
      : 0;
    const month = sessionAttributes.hasOwnProperty("month")
      ? sessionAttributes.month
      : 0;
    const day = sessionAttributes.hasOwnProperty("day")
      ? sessionAttributes.day
      : 0;

    return (
      handlerInput.requestEnvelope.request.type === "LaunchRequest" &&
      year &&
      month &&
      day
    );
  },
  async handle(handlerInput) {
    const serviceClientFactory = handlerInput.serviceClientFactory;
    const deviceId = Alexa.getDeviceId(handlerInput.requestEnvelope);
    const attributesManager = handlerInput.attributesManager;
    const sessionAttributes = attributesManager.getSessionAttributes() || {};

    const year = sessionAttributes.hasOwnProperty("year")
      ? sessionAttributes.year
      : 0;
    const month = sessionAttributes.hasOwnProperty("month")
      ? sessionAttributes.month
      : 0;
    const day = sessionAttributes.hasOwnProperty("day")
      ? sessionAttributes.day
      : 0;

    let userTimeZone;
    try {
      userTimeZone = await serviceClientFactory
        .getUpsServiceClient()
        .getSystemTimeZone(deviceId);
    } catch (error) {
      if (error.name !== "ServiceError") {
        return handlerInput.responseBuilder
          .speak(
            "Desculpe. Houve um problema na conexão. Tente novamente mais tarde."
          )
          .getResponse();
      }
      console.log("error", error.message);
    }

    let result = birthdayHelper.calculate(year, month, day, userTimeZone);
    
    let speakOutput = `Feliz aniversário de ${result.age} anos!`;
    if (!result.isBirthDay) {      
      speakOutput = `Bem-vindo de volta. Faltam ${result.daysToBirthday} dias até seu aniversário.`;
    }

    return handlerInput.responseBuilder.speak(speakOutput).getResponse();
  },
};

const CaptureBirthdayIntentHandler = {
  canHandle(handlerInput) {
    return (
      handlerInput.requestEnvelope.request.type === "IntentRequest" &&
      handlerInput.requestEnvelope.request.intent.name ===
        "CaptureBirthdayIntent"
    );
  },
  async handle(handlerInput) {
    const year = handlerInput.requestEnvelope.request.intent.slots.ano.value;
    const month = handlerInput.requestEnvelope.request.intent.slots.mes.value;
    const day = handlerInput.requestEnvelope.request.intent.slots.dia.value;

    const birthdayAttributes = {
      year: year,
      month: month,
      day: day,
    };

    const speechText = `Obrigado. Lembrarei que seu aniversário é em ${day} de ${month} de ${year}.`;

    const attributesManager = handlerInput.attributesManager;
    await attributesManager.setPersistentAttributes(birthdayAttributes);
    await attributesManager.savePersistentAttributes();

    return (
      handlerInput.responseBuilder
        .speak(speechText)
        //.reprompt('add a reprompt if you want to keep the session open for the user to respond')
        .getResponse()
    );
  },
};
const HelpIntentHandler = {
  canHandle(handlerInput) {
    return (
      handlerInput.requestEnvelope.request.type === "IntentRequest" &&
      handlerInput.requestEnvelope.request.intent.name === "AMAZON.HelpIntent"
    );
  },
  handle(handlerInput) {
    const speechText =
      "Você pode informar sua data de aniversário para que eu lembre dela.";

    return handlerInput.responseBuilder
      .speak(speechText)
      .reprompt(speechText)
      .getResponse();
  },
};
const CancelAndStopIntentHandler = {
  canHandle(handlerInput) {
    return (
      handlerInput.requestEnvelope.request.type === "IntentRequest" &&
      (handlerInput.requestEnvelope.request.intent.name ===
        "AMAZON.CancelIntent" ||
        handlerInput.requestEnvelope.request.intent.name ===
          "AMAZON.StopIntent")
    );
  },
  handle(handlerInput) {
    const speechText = "Tchau!";
    return handlerInput.responseBuilder.speak(speechText).getResponse();
  },
};
const SessionEndedRequestHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === "SessionEndedRequest";
  },
  handle(handlerInput) {
    // Any cleanup logic goes here.
    return handlerInput.responseBuilder.getResponse();
  },
};

// The intent reflector is used for interaction model testing and debugging.
// It will simply repeat the intent the user said. You can create custom handlers
// for your intents by defining them above, then also adding them to the request
// handler chain below.
const IntentReflectorHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === "IntentRequest";
  },
  handle(handlerInput) {
    const intentName = handlerInput.requestEnvelope.request.intent.name;
    const speechText = `Você chamou ${intentName}`;

    return (
      handlerInput.responseBuilder
        .speak(speechText)
        //.reprompt('add a reprompt if you want to keep the session open for the user to respond')
        .getResponse()
    );
  },
};

// Generic error handling to capture any syntax or routing errors. If you receive an error
// stating the request handler chain is not found, you have not implemented a handler for
// the intent being invoked or included it in the skill builder below.
const ErrorHandler = {
  canHandle() {
    return true;
  },
  handle(handlerInput, error) {
    console.log(`~~~~ Error handled: ${error.message}`);
    const speechText = `Desculpe, não pude entender. Tente novamente.`;

    return handlerInput.responseBuilder
      .speak(speechText)
      .reprompt(speechText)
      .getResponse();
  },
};

// This handler acts as the entry point for your skill, routing all request and response
// payloads to the handlers above. Make sure any new handlers or interceptors you've
// defined are included below. The order matters - they're processed top to bottom.
exports.handler = Alexa.SkillBuilders.custom()
  .withApiClient(new Alexa.DefaultApiClient())
  .withPersistenceAdapter(
    new persistenceAdapter.S3PersistenceAdapter({
      bucketName: process.env.S3_PERSISTENCE_BUCKET,
    })
  )
  .addRequestHandlers(
    HasBirthdayLaunchRequestHandler,
    LaunchRequestHandler,
    CaptureBirthdayIntentHandler,
    HelpIntentHandler,
    CancelAndStopIntentHandler,
    SessionEndedRequestHandler,
    IntentReflectorHandler
  )
  .addRequestInterceptors(LoadBirthdayInterceptor)
  .addErrorHandlers(ErrorHandler)
  .lambda();
