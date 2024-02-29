import { SingletonStore } from './metricalp-store';

const API_ENDPOINT = 'https://event.metricalp.com';

function sendEvent(type: string, eventAttributes: Record<string, any>) {
  const store = SingletonStore.getStore();
  if (!store) {
    throw new Error('Metricalp Attributes not initialized');
  }
  const attributes = { ...store.getAttributes(), ...eventAttributes };

  if (!attributes.tid) {
    throw new Error('tid not set in Metricalp attributes');
  }

  if (!attributes.platform) {
    throw new Error('platform not set in Metricalp attributes');
  }

  return fetch(attributes.endpoint || API_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      type,
      path: attributes.path || '(not-set)',
      metr_collected_via: attributes.platform,
      metr_os_detail: attributes.os || '(not-set)',
      metr_app_detail: attributes.app || '(not-set)',
      metr_user_language: attributes.language || '(not-set)',
      metr_unique_identifier: attributes.uuid || '(not-set)',
      tid: attributes.tid,
    }),
  }).then((response) => {
    if (!response.ok) {
      return false;
    }
    return true;
  });
}

export function screenViewEvent(path: string) {
  return sendEvent('screen_view', { path });
}

export function sessionExitEvent(path: string) {
  return sendEvent('session_exit', { path });
}

export function customEvent(
  type: string,
  eventAttributes: Record<string, any>
) {
  return sendEvent(type, eventAttributes);
}

export function initMetricalp(attributes: Record<string, any>) {
  SingletonStore.initAttributes(attributes);
  return screenViewEvent(attributes.mainScreen);
}
