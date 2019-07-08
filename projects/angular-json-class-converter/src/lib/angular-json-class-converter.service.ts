import {Inject, Injectable, InjectionToken} from '@angular/core';
import {HttpClient} from '@angular/common/http';

export const JsonConverterConfig = new InjectionToken<JsonConverterConfigurationInterface>('JsonConverterConfig');

function getClassNameOutOfObject(classedObject: [(any | any[])], classesMap: Map<string, { new() }>) {
  let foundClassName = null;
  const objConstructor = (Array.isArray(classedObject) ? classedObject[0] : classedObject).constructor;

  const entries = classesMap.entries();
  let entry = entries.next();
  while (!entry.done) {
    if (entry.value[1] === objConstructor) {
      foundClassName = entry.value[0]
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

  conversionSchemaFileName: string;
  conversionMap: { [key: string]: ConversionSchema; } = {};
  conversionFunctionsMap: Map<string, ((any?) => any)> = new Map<string, ((any?) => any)>();
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

  constructor(
    @Inject(JsonConverterConfig) private aConversionSchemaFileName: JsonConverterConfigurationInterface,
    private http: HttpClient
  ) {

    this.conversionSchemaFileName = aConversionSchemaFileName.configurationFilePath;

    if (aConversionSchemaFileName.conversionFunctionsMapArray) {
      aConversionSchemaFileName.conversionFunctionsMapArray.forEach(
        (methodMapEntry: MethodMapEntry) => {
          this.conversionFunctionsMap.set(methodMapEntry.methodName, methodMapEntry.method);
        });
    }
    this.classesMap.set('ConversionSchema', ConversionSchema);
    if (aConversionSchemaFileName.classesMapArray) {
      aConversionSchemaFileName.classesMapArray.forEach(
        (classMapEntry: ClassMapEntry) => {
          this.classesMap.set(classMapEntry.className, classMapEntry.clazz);
        });
    }

    this.http.get(this.conversionSchemaFileName)
      .subscribe(schema => {
        this.buildConversionsArray(schema);
      });
  }

  convert<T>(simpleObj: any, className: string): Array<T> {
    const retObjectClassArray = new Array<T>();

    if (AngularJsonClassConverterService.isArray(simpleObj)) {
      (simpleObj as Array<any>).forEach(schemaRecord => {
        const schemaItem = this.convertOneObject<T>(schemaRecord, className);
        retObjectClassArray.push(schemaItem);
      });
    } else {
      (simpleObj as Array<any>).forEach(simpleObjItem => {
        retObjectClassArray.push(this.convertOneObject(simpleObjItem, className));
      });
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

    let conversionSchema = this.conversionMap[className];

    if (!conversionSchema) {
      conversionSchema = this.generateDefaultConversionSchema();
    }

    if (conversionSchema.iterateAllProperties) {
      Object.keys(retObjectClass).forEach((key) => {
        const propertyValue = simpleObj[key];
        if (propertyValue != null && propertyValue !== null &&
          typeof propertyValue !== 'undefined') {
          retObjectClass[key] = propertyValue;
        }
      });
    }

    if (conversionSchema.hasSpecificConversions()) {
      conversionSchema.propertyConversionArray.forEach(
        (propertyConversion: PropertyConversion) => {
          const propertyName = propertyConversion.propertyName;
          let jsonPropertyName = propertyConversion.propertyNameInJson;
          if (!jsonPropertyName) {
            jsonPropertyName = propertyName;
          }
          const jsonPropertyValue = this.getJsonPropertyValue(simpleObj, jsonPropertyName);
          if (jsonPropertyValue != null && jsonPropertyValue !== null &&
            typeof jsonPropertyValue !== 'undefined') {
            // If there is a typed conversion
            if (propertyConversion.type) {
              retObjectClass[propertyName] = this.convert(jsonPropertyValue, propertyConversion.type);

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
    const conversionSchema = this.conversionMap[className];

    let retJsonObjectArray = new Array<any>();
    let classedObjectsArray: Array<any>;
    let isArray = false;

    if (conversionSchema && conversionSchema.hasSpecificConversions()) {
      if (AngularJsonClassConverterService.isArray(classedObject)) {
        isArray = true;
        classedObjectsArray = <Array<any>>classedObject;
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

  private convertToJsonOneObject(classedObjectItem: any, conversionSchema: ConversionSchema) {
    const retObject = {};

    conversionSchema.propertyConversionArray.forEach(
      (propertyConversion: PropertyConversion) => {
        const propertyName = propertyConversion.propertyName;
        let jsonPropertyName = propertyConversion.propertyNameInJson;
        if (!jsonPropertyName) {
          jsonPropertyName = propertyName;
        }
        const classedObjectValue = classedObjectItem[propertyName];
        let convertedValue = classedObjectValue;
        if (propertyConversion.conversionFunctionToJsonName && this.conversionFunctionsMap) {
          const conversionFunction =
            this.conversionFunctionsMap.get(propertyConversion.conversionFunctionToJsonName);
          convertedValue = conversionFunction(classedObjectValue);
        }
        this.setJsonPropertyValue(retObject, jsonPropertyName, convertedValue);
      });

    return retObject;
  }

  private generateDefaultConversionSchema() {
    const conversionSchema = new ConversionSchema();
    conversionSchema.iterateAllProperties = true;
    return conversionSchema;
  }

  private buildConversionsArray(schema: any) {
    const conversionSchemasArray = this.convert<ConversionSchema>(schema, 'ConversionSchema');
    conversionSchemasArray.forEach(conversionSchemas => {
      this.conversionMap[conversionSchemas.className] = conversionSchemas;
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

class PropertyConversion {
  propertyName: string;
  type?: string;
  propertyNameInJson?: string;
  conversionFunctionName?: string;
  conversionFunctionToJsonName?: string;
}

class ConversionSchema {
  className: string;
  iterateAllProperties: boolean = false;
  propertyConversionArray: PropertyConversion[];

  constructor() {
    this.className = undefined;
    this.propertyConversionArray = undefined;
  }

  hasSpecificConversions(): boolean {
    return this.propertyConversionArray && this.propertyConversionArray.length > 0;
  }
}

export interface MethodMapEntry {
  methodName: string;
  method: (any?) => any;
}

export interface ClassMapEntry {
  className: string;
  clazz: { new() };
}

export interface JsonConverterConfigurationInterface {
  configurationFilePath?: string;
  conversionFunctionsMapArray?: MethodMapEntry[];
  classesMapArray?: ClassMapEntry[];
}
