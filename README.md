# angular-json-class-converter

[![npm](https://img.shields.io/npm/v/angular-json-class-converter.svg)](https://npmjs.org/package/angular-json-class-converter)


This package is intended to be used in Angular 2+ application.

The package is utility to help serialize/deserialize JSON objects into/from specific JS/TS classes.

## Installation


    npm i --save angular-json-class-converter json-class-converter


## Configurations

### Adding to app.module

Add to the imports section 

    AngularJsonClassConverterModule.forRoot(jsonConverterConfig),

Where jsonConverterConfig is an object implementing IJsonConverterConfigFactory.
It has to implement only getConfig function that must be exported.
Like this:
    
    export function getConfig(): JsonConverterConfigurationInterface {
      return {
      conversionSchema: <Conversion Schema object>,
      classesMapArray: <Map of classes>,
      conversionFunctionsMapArray: <Map of functions >
      };
    }

    const jsonConverterConfig: IJsonConverterConfigFactory = {getConfig};

#### Conversion Schema object

An object that implements an array of ClassConversionSchemaInterface.
Each item in the array represent a class.

Each conversion receipt consists of:

    {    "className": <Name of class>,
          ["propertyConversionArray": <Array of conversions>]
    }
 
propertyConversionArray is optional. If doesn't exist the module will iterate the members of the 
input JSON and will try to find matching fields in the class.

Each element in "Array of conversions" is constructed of
    
    {   "propertyName": <Name of class property>",
        ["propertyNameInJson": <Name of JSON property>],
        ["conversionFunctionName": <Conversion function name>],
        ["conversionFunctionToJsonName": <Conversion function name>],
        ["type": <Class name>],
    }

Apart from propertyName, all other properties are optional:

- propertyName - Class name to be used for convering to/from. The class name must be mentioned in "classesMapArray" 
- propertyNameInJson - is the name as it appears in the JSON file. Use it if different form "propertyName".
- conversionFunctionName - If needed a special conversion from the value in the JSON to the class property's value.
- conversionFunctionToJsonName - If needed a special conversion from the class property's value to the JSON (when serialize to JSON) .
- type - Class name to be used for convering the value (or values, in case it is an array of values). 
The class name must be mentioned in "classesMapArray".

#### Map of classes

This will hold all the classes needed for serialization/deserialization.

Is an array of objects in the structure :

    {className: '<Name of Class>', clazz: <Class>}
    
Example :

    classesMapArray =  [
      {className: 'Foo', clazz: Foo},
      {className: 'Area', clazz: Area},
    ]
    
#### Map of functions

This will hold all the functions that are needed for special conversion 
( If no function is specified, value will be copied as is)

Is an array of objects in the structure :

    {methodName: '<Name of Method>', method: <Method>}
    
Example :

    functionsMapArray =  [
      {methodName: 'bar', method: bar},
      {methodName: 'dateConversion', method: dateConversion},
    ]

## Using

Inject the converter service in the needed class (service, component...):
    
    export class MyService {
      ...
      constructor(private jsonConverterService: AngularJsonClassConverterService){...}
      ...
    }

When need to convert to class (one or array of objects) use :
    
    const exampleJsonObj = {
      firstProperty : 'foo',
      secondProperty : 'bar',
    };
    const convertedNewClassesArray : MyClass[] = this.jsonConverterService.convert<MyClass>(exampleJsonObj, 'MyClass');
    
If needed only one object, use :

    const convertedNewClass : MyClass = this.jsonConverterService.convertOneObject<MyClass>(exampleJsonObj, 'MyClass');

If needed to convert to json, use (myClassInstance can be an object or array of objects):

    const jsonObject = this.jsonConverterService.convertToJson(myClassInstance);

    
## Further help
It was developed for my own needs .
I made it, because haven't found something similar.
I will see with time goes ,if there is interest and requests regarding this module, I will enhance this module
accordingly. 
Feel free to open bugs and suggestions. You are also welcome to join and contribute.
I have intentions to export the core functionality so other frameworks will be able to use it as well.

This library was generated with Angular CLI version 7.3.8.
