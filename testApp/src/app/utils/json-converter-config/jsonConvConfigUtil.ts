import moment from 'moment';
import {ClassA} from '../../model/classA';
import {ClassB} from '../../model/classB';
import {ClassMapEntry, MethodMapEntry} from 'json-class-converter';

const dateFormat = 'D/M/Y';


const dateConversion = (dateAsStr: string): Date => {
  const date = moment(dateAsStr, dateFormat).toDate();
  return date;
};

const dateToStrDateConversionForJson = (aDate: Date): string => {
  const dateStr = moment(aDate).format(dateFormat);
  return dateStr;
};

export default {
  dateFormat,
  functionsMapArray: [
    {methodName: 'dateConversion', method: dateConversion},
    {methodName: 'dateToStrDateConversionForJson', method: dateToStrDateConversionForJson},
  ] as MethodMapEntry[],
  classesMapArray: [
    {className: 'ClassA', clazz: ClassA},
    {className: 'ClassB', clazz: ClassB},
    ] as ClassMapEntry[]
};
