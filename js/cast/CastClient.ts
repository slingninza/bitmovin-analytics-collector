import {MESSAGE_NAMESPACE} from '../utils/Settings';
import {logger} from '../utils/Logger';

/* global cast */

export class CastClient {
  castSession: any;
  setUp() {
    logger.log('setting up cast session');
    this.castSession = (window as any).cast.framework.CastContext.getInstance().getCurrentSession();
    this.addMessageListener();
  }

  addMessageListener() {
    const applicationMetadata = this.castSession.getApplicationMetadata();
    if (!applicationMetadata || applicationMetadata.namespaces.indexOf(MESSAGE_NAMESPACE) < 0) {
      logger.log('No analytics on chrome cast receiver enabled!');
      return;
    }

    logger.log('adding message listener');
    this.castSession.addMessageListener(MESSAGE_NAMESPACE, (ns: string, message: string) => {
      logger.log('Received: ' + ns + ' ' + message);

      try {
        const receiverMessage = JSON.parse(message);
        this.handleReceiverMessage(receiverMessage);
      } catch (error) {
        logger.error('Message parsing failed ' + message);
      }
    });
  }

  handleReceiverMessage(message: string) {
    logger.log(message);
  }

  sendMessage(message: any) {
    const applicationMetadata = this.castSession.getApplicationMetadata();
    if (!applicationMetadata || applicationMetadata.namespaces.indexOf(MESSAGE_NAMESPACE) < 0) {
      logger.log('No analytics on chrome cast receiver enabled!');
      return;
    }

    logger.log('Sending message: ' + JSON.stringify(message));
    this.castSession.sendMessage(MESSAGE_NAMESPACE, message);
  }
}
