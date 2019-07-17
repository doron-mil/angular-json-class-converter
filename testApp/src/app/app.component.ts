import {Component, OnInit} from '@angular/core';
import {AngularJsonClassConverterService} from 'angular-json-class-converter';

import {ClassA} from './model/classA';

import mockDataArray from '../assets/mock-json-data.json';

const retStringified = (aObject: any): string => `${aObject.constructor.name} ${JSON.stringify(aObject, undefined, 2)}`;

class ConversionItem {
  originalJsonStructure: any;
  convertedClassStructure: ClassA;
  convertedJsonStructure: any;

  static createInstance(originalJsonStructure: any, convertedClassStructure: ClassA, convertedJsonStructure: any) {
    const newConversionItem = new ConversionItem();
    newConversionItem.originalJsonStructure = originalJsonStructure;
    newConversionItem.convertedClassStructure = convertedClassStructure;
    newConversionItem.convertedJsonStructure = convertedJsonStructure;
    return newConversionItem;
  }


  getOriginalJsonStructureStrigified(): string {
    return retStringified(this.originalJsonStructure);
  }

  getConvertedClassStrigified(): string {
    return retStringified(this.convertedClassStructure);
  }

  getConvertedJsonStrigified(): string {
    return retStringified(this.convertedJsonStructure);
  }
}

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  conversionItemsArray: ConversionItem[] = [];


  constructor(private jsonConverterService: AngularJsonClassConverterService) {
  }

  ngOnInit(): void {
    this.conversionItemsArray = [];

    const convertedClassTypeArray = this.jsonConverterService.convert<ClassA>(mockDataArray, 'ClassA');
    const backToJsonConvertedArray = this.jsonConverterService.convertToJson(convertedClassTypeArray as any);

    const jsonMap: Map<number, any> = Array.from(mockDataArray).reduce((previousValue: Map<number, any>, currentValue: any) => {
      return previousValue.set(Number(currentValue.id), currentValue);
    }, new Map<number, any>());

    const convertedJsonMap: Map<number, any> = backToJsonConvertedArray
      .reduce((previousValue: Map<number, any>, currentValue: any) => {
        return previousValue.set(Number(currentValue.id), currentValue);
      }, new Map<number, any>());

    convertedClassTypeArray.forEach(classInst => {
      const originalJsonItem = jsonMap.get(classInst.id);
      const convertedJsonItem = jsonMap.get(classInst.id);

      const conversionItem = ConversionItem.createInstance(originalJsonItem, classInst, convertedJsonItem);

      this.conversionItemsArray.push(conversionItem);
    });
  }
}
