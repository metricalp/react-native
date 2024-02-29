export class SingletonStore {
  private static instance: SingletonStore;
  private attributes: Record<string, any> = {};

  private constructor() {}

  public static getInstance(): SingletonStore {
    if (!SingletonStore.instance) {
      SingletonStore.instance = new SingletonStore();
    }

    return SingletonStore.instance;
  }

  public static initAttributes(attributes: Record<string, any>) {
    const instance = SingletonStore.getInstance();
    instance.setAttributes(attributes);
  }

  public static getStore() {
    return SingletonStore.getInstance();
  }

  public setAttributes(attributes: Record<string, any>) {
    this.attributes = attributes;
  }

  public getAttributes() {
    return this.attributes;
  }
}
