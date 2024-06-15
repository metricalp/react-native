export class Metricalp {
  private static instance: Metricalp;
  private static API_ENDPOINT = 'https://event.metricalp.com';
  private attributes: Record<string, any> = {};
  private screenDurationStartPoint = Date.now();
  private currentScreen = '';

  private constructor() {}

  public static getOrBuildInstance(): Metricalp {
    if (!Metricalp.instance) {
      Metricalp.instance = new Metricalp();
    }

    return Metricalp.instance;
  }

  public static init(
    attributes: Record<string, any>,
    initialScreen?: string,
    eventAttributes: Record<string, any> = {}
  ) {
    const instance = Metricalp.getOrBuildInstance();
    instance.setAttributes(attributes);
    if (!initialScreen) {
      return Promise.resolve(true);
    }

    return Metricalp.screenViewEvent(initialScreen || 'main', eventAttributes);
  }

  public static getInstance() {
    if (!Metricalp.instance) {
      throw new Error(
        'Metricalp not initialized, please call Metricalp.init() first.'
      );
    }
    return Metricalp.instance;
  }

  public setAttributes(attributes: Record<string, any>) {
    this.attributes = attributes;
  }

  public getAttributes() {
    return this.attributes;
  }

  public getCurrentScreen() {
    return this.currentScreen;
  }

  public setCurrentScreen(screen: string) {
    this.currentScreen = screen;
  }

  public setScreenDurationStartPointToNow() {
    this.screenDurationStartPoint = Date.now();
  }

  public static resetAttributes(attributes: Record<string, any>) {
    const instance = Metricalp.getInstance();
    instance.setAttributes(attributes);
  }

  public static updateAttributes(attributes: Record<string, any>) {
    const instance = Metricalp.getInstance();
    const currentAttributes = instance.getAttributes();
    instance.setAttributes({ ...currentAttributes, ...attributes });
  }

  public static getAllAttributes() {
    const instance = Metricalp.getInstance();
    return instance.getAttributes();
  }

  public static sendEvent(
    type: string,
    eventAttributes: Record<string, any>,
    overrideAttributes: Record<string, any> = {}
  ) {
    const instance = Metricalp.getInstance();
    const attributes = { ...instance.getAttributes(), ...overrideAttributes };

    if (!attributes.tid) {
      throw new Error('Metricalp Error: tid not set in Metricalp attributes.');
    }

    if (!attributes.platform) {
      throw new Error(
        'Metricalp Error: platform not set in Metricalp attributes.'
      );
    }

    if (attributes.bypassIpUniqueness && !attributes.uuid) {
      throw new Error(
        'Metricalp Error: when bypassIpUniqueness is true, uuid must be set.'
      );
    }

    return fetch(attributes.endpoint || Metricalp.API_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...eventAttributes,
        type,
        path: eventAttributes.path || '(not-set)',
        metr_collected_via: attributes.platform,
        metr_os_detail: attributes.os || '(not-set)',
        metr_app_detail: attributes.app || '(not-set)',
        metr_user_language: attributes.language || 'unknown-unknown',
        metr_unique_identifier: attributes.uuid || '',
        metr_bypass_ip: attributes.bypassIpUniqueness || false,
        tid: attributes.tid,
      }),
    }).then((response) => {
      if (!response.ok) {
        return false;
      }
      return true;
    });
  }

  public static screenViewEvent(
    path: string,
    eventAttributes: Record<string, any> = {},
    overrideAttributes: Record<string, any> = {}
  ) {
    const instance = Metricalp.getInstance();
    const prevScreen = instance.getCurrentScreen();
    let screenLeaveProps = {};
    if (prevScreen) {
      screenLeaveProps = {
        leave_from_path: prevScreen,
        leave_duration: Date.now() - instance.screenDurationStartPoint,
      };
    }
    instance.setCurrentScreen(path);
    instance.setScreenDurationStartPointToNow();
    return Metricalp.sendEvent(
      'screen_view',
      { path, ...screenLeaveProps, ...eventAttributes },
      overrideAttributes
    );
  }

  public static appLeaveEvent(
    eventAttributes: Record<string, any> = {},
    overrideAttributes: Record<string, any> = {}
  ) {
    const instance = Metricalp.getInstance();
    const prevPath = instance.getCurrentScreen();
    // You can not trigger leave event without a screen view event before it
    if (!prevPath) {
      return Promise.resolve(false);
    }
    const screenDuration = Date.now() - instance.screenDurationStartPoint;
    instance.setScreenDurationStartPointToNow();
    instance.setCurrentScreen('');
    return Metricalp.sendEvent(
      'screen_leave',
      {
        path: prevPath,
        screen_duration: screenDuration,
        ...eventAttributes,
      },
      overrideAttributes
    );
  }

  // @deprecated No more manual session exit event
  public static sessionExitEvent(
    path: string,
    eventAttributes: Record<string, any> = {},
    overrideAttributes: Record<string, any> = {}
  ) {
    return Metricalp.sendEvent(
      'session_exit',
      { path, ...eventAttributes },
      overrideAttributes
    );
  }

  public static customEvent(
    type: string,
    eventAttributes: Record<string, any>,
    overrideAttributes: Record<string, any> = {}
  ) {
    return Metricalp.sendEvent(type, eventAttributes, overrideAttributes);
  }
}
