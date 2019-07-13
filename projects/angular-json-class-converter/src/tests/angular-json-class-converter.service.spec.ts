import moment from 'moment';
import {TestBed} from '@angular/core/testing';

import {AngularJsonClassConverterModule} from '../lib/angular-json-class-converter.module';

import {
  AngularJsonClassConverterService,
  JsonConverterConfigurationInterface
} from '../lib/angular-json-class-converter.service';

import jsonConvConfigUtil from './data/jsonConvConfigUtil';
import localConversionSchema from './data/conversion-schema.json';
import {ClassA} from './model/classA';

import classAData from './data/mock-json-data.json';

  const jsonConverterConfig: JsonConverterConfigurationInterface = {
  conversionSchema: localConversionSchema,
  conversionFunctionsMapArray: jsonConvConfigUtil.functionsMapArray,
  classesMapArray: jsonConvConfigUtil.classesMapArray
};

describe('AngularJsonClassConverterService', () => {

  let converterService: AngularJsonClassConverterService;
  let classAConvertedArray: Array<ClassA>;
  let jsonMap: Map<number, any>;

  beforeAll(() => {
    TestBed.configureTestingModule({
      imports: [
        AngularJsonClassConverterModule.forRoot(jsonConverterConfig)
      ]
    });

    converterService = TestBed.get(AngularJsonClassConverterService);

    jsonMap = Array.from(classAData).reduce((previousValue: Map<number, any>, currentValue: any) => {
      return previousValue.set(Number(currentValue.id), currentValue);
    }, new Map<number, any>());
  });

  it('converterService should be created', () => {
    expect(converterService).toBeTruthy();
    expect(converterService instanceof AngularJsonClassConverterService).toBeTruthy();
  });

  it('converting class A', () => {
    classAConvertedArray = converterService.convert<ClassA>(classAData, 'ClassA');
    classAConvertedArray.forEach((classA) => {
      expect(classA !== null && classA !== undefined).toBeTruthy();
      expect(classA instanceof ClassA).toBeTruthy();
      expect(classA.getBirthDateDay()).toBeTruthy();
      const fromJsonClassA = jsonMap.get(classA.id);
      expect(fromJsonClassA).toBeTruthy();
      expect(classA.fullName).toEqual(fromJsonClassA.name.full_name);
      expect(moment(classA.birthDate).isSame(moment(fromJsonClassA.date_of_birth, jsonConvConfigUtil.dateFormat))).toBeTruthy();
    });
  });

  it('converting class A back to Json', () => {
    const convertToJson = converterService.convertToJson(classAConvertedArray as any);
    expect(convertToJson instanceof Array).toBeTruthy();
    expect(convertToJson.length).toEqual(jsonMap.size);
    convertToJson.forEach(convertedJsonFromClassA => {
      const fromJsonClassA = jsonMap.get(convertedJsonFromClassA.id);
      if (convertedJsonFromClassA.id === 1) {
      }
      expect(fromJsonClassA).toBeTruthy();
      expect(fromJsonClassA).toEqual(convertedJsonFromClassA);
    });
  });

});
