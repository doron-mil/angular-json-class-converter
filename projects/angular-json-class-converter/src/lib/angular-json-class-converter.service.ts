import {Inject, Injectable, InjectionToken} from '@angular/core';
import {JsonClassConverter, JsonConverterConfigurationInterface} from 'json-class-converter';

export const JsonConverterConfig = new InjectionToken<JsonConverterConfigurationInterface>('JsonConverterConfig');


@Injectable({
  providedIn: 'root'
})
export class AngularJsonClassConverterService {
  private jsonClassConverter: JsonClassConverter;

  constructor(
    @Inject(JsonConverterConfig) private aConverterConfiguration: JsonConverterConfigurationInterface) {
    this.jsonClassConverter = new JsonClassConverter(aConverterConfiguration);
  }

  convert<T>(simpleObj: any, className: string): Array<T> {
    return this.jsonClassConverter.convert<T>(simpleObj, className);
  }

  convertOneObject<T>(simpleObj: any, className: string): T {
    return this.jsonClassConverter.convertOneObject<T>(simpleObj, className);
  }

  convertToJson(classedObject: [any | any[]]): any | Array<any> {
    return this.jsonClassConverter.convertToJson(classedObject);
  }
}
