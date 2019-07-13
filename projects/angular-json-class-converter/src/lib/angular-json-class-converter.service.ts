import {Inject, Injectable, InjectionToken} from '@angular/core';

export const JsonConverterConfig = new InjectionToken<JsonConverterConfigurationInterface>('JsonConverterConfig');

function getClassNameOutOfObject(classedObject: [(any | any[])], classesMap: Map<string, { new() }>) {
  let foundClassName = null;
  const objConstructor = (Array.isArray(classedObject) ? classedObject[0] : classedObject).constructor;

  const entries = classesMap.entries();
  let entry = entries.next();
  while (!entry.done) {
    if (entry.value[1] === objConstructor) {
      foundClassName = entry.value[0];
      break;
    }
    entry = entries.next();
  }

  return foundClassName;
}

@Injectable({
  providedIn: 'root'
})
export class AngularJsonClassConverterService {

  conversionMap: Map<string, ClassConversionSchema> = new Map<string, ClassConversionSchema>();
  conversionFunctionsMap: Map<string, ((param?: any) => any)> = new Map<string, ((param?: any) => any)>();
  // The classMap is intended only for a typed conversion - we don't have the clazz - so to retrieve it...
  classesMap: Map<string, { new() }> = new Map<string, { new() }>();

  static isArray(object) {
    if (object === Array) {
      return true;
    } else if (typeof Array.isArray === 'function') {
      return Array.isArray(object);
    } else {
      return !!(object instanceof Array);
    }
  }

  static isNotNull(aObject) {
    return aObject != null && aObject !== null && typeof aObject !== 'undefined';
  }

  constructor(
    @Inject(JsonConverterConfig) private aConverterConfiguration: JsonConverterConfigurationInterface) {

    if (aConverterConfiguration.conversionFunctionsMapArray) {
      aConverterConfiguration.conversionFunctionsMapArray.forEach(
        (methodMapEntry: MethodMapEntry) => {
          this.conversionFunctionsMap.set(methodMapEntry.methodName, methodMapEntry.method);
        });
    }
    this.classesMap.set('ClassConversionSchema', ClassConversionSchema);
    if (aConverterConfiguration.classesMapArray) {
      aConverterConfiguration.classesMapArray.forEach(
        (classMapEntry: ClassMapEntry) => {
          this.classesMap.set(classMapEntry.className, classMapEntry.clazz);
        });
    }

    if (aConverterConfiguration.conversionSchema) {
      this.buildConversionsArray(aConverterConfiguration.conversionSchema);
    }
  }

  convertDualRetType<T>(simpleObj: any, className: string): Array<T> | T {
    const retValue = this.convert<T>(simpleObj, className);
    return AngularJsonClassConverterService.isArray(simpleObj) ? retValue : retValue[0];
  }

  convert<T>(simpleObj: any, className: string): Array<T> {
    const retObjectClassArray = new Array<T>();

    if (AngularJsonClassConverterService.isArray(simpleObj)) {
      (simpleObj as Array<any>).forEach(schemaRecord => {
        const schemaItem = this.convertOneObject<T>(schemaRecord, className);
        retObjectClassArray.push(schemaItem);
      });
    } else {
      retObjectClassArray.push(this.convertOneObject(simpleObj, className));
    }

    return retObjectClassArray;
  }

  convertOneObject<T>(simpleObj: any, className: string): T {
    const errorPrefix = 'AngularJsonClassConverterService.convertOneObject ERROR.';

    const objConstructor = this.classesMap.get(className);
    if (!objConstructor) {
      throw new Error(`${errorPrefix} Can not find constructor for className : ${className}`);
    }
    const retObjectClass = new objConstructor();

    let classConversionSchema = this.conversionMap.get(className);
    if (!classConversionSchema) {
      classConversionSchema = this.generateDefaultConversionSchema();
    }

    if (classConversionSchema.iterateAllProperties) {
      Object.keys(retObjectClass).forEach((key) => {
        const propertyValue = simpleObj[key];
        if (AngularJsonClassConverterService.isNotNull(propertyValue)) {
          retObjectClass[key] = propertyValue;
        }
      });
    }

    if (classConversionSchema.hasSpecificConversions()) {
      classConversionSchema.propertyConversionArray.forEach(
        (propertyConversion: PropertyConversion) => {
          const propertyName = propertyConversion.propertyName;
          let jsonPropertyName = propertyConversion.propertyNameInJson;
          if (!jsonPropertyName) {
            jsonPropertyName = propertyName;
          }
          const jsonPropertyValue = this.getJsonPropertyValue(simpleObj, jsonPropertyName);
          if (AngularJsonClassConverterService.isNotNull(jsonPropertyValue)) {
            // If there is a typed conversion
            if (propertyConversion.type) {
              retObjectClass[propertyName] = this.convertDualRetType(jsonPropertyValue, propertyConversion.type);
              // If there is a conversion function to be used
            } else if (propertyConversion.conversionFunctionName && this.conversionFunctionsMap) {
              const conversionFunction =
                this.conversionFunctionsMap.get(propertyConversion.conversionFunctionName);
              if (conversionFunction) {
                retObjectClass[propertyName] = conversionFunction(jsonPropertyValue);
              } else {
                console.error(`Could not find conversion function named : ${propertyConversion.conversionFunctionName}`);
              }

            } else {  // Else - simple conversion
              retObjectClass[propertyName] = jsonPropertyValue;
            }
          }
        });
    }

    return retObjectClass;
  }

  convertToJson(classedObject: [any | any[]]): any | Array<any> {
    const className = getClassNameOutOfObject(classedObject, this.classesMap);
    const conversionSchema = this.conversionMap.get(className);

    let retJsonObjectArray = new Array<any>();
    let classedObjectsArray: Array<any>;
    let isArray = false;

    if (conversionSchema && conversionSchema.hasSpecificConversions()) {
      if (AngularJsonClassConverterService.isArray(classedObject)) {
        isArray = true;
        classedObjectsArray = classedObject as Array<any>;
      } else {
        classedObjectsArray = new Array<any>(classedObject);
      }

      classedObjectsArray.forEach(classedObjectItem => {
        retJsonObjectArray.push(this.convertToJsonOneObject(classedObjectItem, conversionSchema));
      });

    } else {
      isArray = true;
      retJsonObjectArray = classedObject;
    }
    return isArray ? retJsonObjectArray : (retJsonObjectArray.length > 0 ? retJsonObjectArray[0] : undefined);
  }

  private convertToJsonOneObject(classedObjectItem: any, conversionSchema: ClassConversionSchema) {
    const retObject = {};

    conversionSchema.propertyConversionArray.forEach(
      (propertyConversion: PropertyConversion) => {
        const propertyName = propertyConversion.propertyName;
        let jsonPropertyName = propertyConversion.propertyNameInJson;
        if (!jsonPropertyName) {
          jsonPropertyName = propertyName;
        }
        const classedObjectValue = classedObjectItem[propertyName];
        if (AngularJsonClassConverterService.isNotNull(classedObjectValue)) {
          let convertedValue = classedObjectValue;
          if (propertyConversion.conversionFunctionToJsonName && this.conversionFunctionsMap) {
            const conversionFunction =
              this.conversionFunctionsMap.get(propertyConversion.conversionFunctionToJsonName);
            convertedValue = conversionFunction(classedObjectValue);
          } else if (propertyConversion.type) {
            convertedValue = this.convertToJson(classedObjectValue);
          }
          this.setJsonPropertyValue(retObject, jsonPropertyName, convertedValue);
        }
      });

    return retObject;
  }

  private generateDefaultConversionSchema() {
    const conversionSchema = new ClassConversionSchema();
    conversionSchema.iterateAllProperties = true;
    return conversionSchema;
  }

  private buildConversionsArray(aClassConversionJsonSchemasArray: ClassConversionSchemaInterface[]) {
    const conversionSchemasArray =
      this.convert<ClassConversionSchema>(aClassConversionJsonSchemasArray, 'ClassConversionSchema');
    conversionSchemasArray.forEach(aClassConversionSchemas => {
      this.conversionMap.set(aClassConversionSchemas.className, aClassConversionSchemas);
    });
  }

  private getJsonPropertyValue(simpleObj: any, jsonPropertyName: string) {
    if (!simpleObj) {
      return simpleObj;
    }
    const indexOfDot = jsonPropertyName.indexOf('.');
    if (indexOfDot >= 0) {
      const firstPart = jsonPropertyName.substr(0, indexOfDot);
      const secondPart = jsonPropertyName.substr(indexOfDot + 1);
      return this.getJsonPropertyValue(simpleObj[firstPart], secondPart);
    } else {
      return simpleObj[jsonPropertyName];
    }

  }

  private setJsonPropertyValue(retObject: any, jsonPropertyName: string, assignedValue: any) {
    const propertiesArray = jsonPropertyName.split('.');
    let objectToAssign = retObject;
    propertiesArray.forEach((property, index) => {
      if (index <= propertiesArray.length - 2) {
        if (!objectToAssign[property]) {
          objectToAssign[property] = {};
        }
        objectToAssign = objectToAssign[property];
      }
    });
    objectToAssign[propertiesArray[propertiesArray.length - 1]] = assignedValue;
  }
}

export interface PropertyConversion {
  propertyName: string;
  type?: string;
  propertyNameInJson?: string;
  conversionFunctionName?: string;
  conversionFunctionToJsonName?: string;
}

export interface ClassConversionSchemaInterface {
  className: string;
  propertyConversionArray: PropertyConversion[];
  iterateAllProperties?: boolean;
}

class ClassConversionSchema implements ClassConversionSchemaInterface {
  className: string;
  propertyConversionArray: PropertyConversion[];
  iterateAllProperties: boolean;

  constructor() {
    this.iterateAllProperties = false;
    this.className = undefined;
    this.propertyConversionArray = undefined;
  }

  hasSpecificConversions(): boolean {
    return this.propertyConversionArray && this.propertyConversionArray.length > 0;
  }
}

export interface MethodMapEntry {
  methodName: string;
  method: (param?: any) => any;
}

export interface ClassMapEntry {
  className: string;
  clazz: { new() };
}

export interface JsonConverterConfigurationInterface {
  conversionSchema?: ClassConversionSchemaInterface[];
  conversionFunctionsMapArray?: MethodMapEntry[];
  classesMapArray?: ClassMapEntry[];
}
