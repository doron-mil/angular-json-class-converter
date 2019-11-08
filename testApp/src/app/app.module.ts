import {BrowserModule} from '@angular/platform-browser';
import {NgModule} from '@angular/core';

import {JsonConverterConfigurationInterface} from 'json-class-converter';
import {AngularJsonClassConverterModule, IJsonConverterConfigFactory} from 'angular-json-class-converter';

import {AppComponent} from './app.component';
import jsonConvConfigUtil from './utils/json-converter-config/jsonConvConfigUtil';

import localConversionSchema from '../assets/conversion-schema.json';

export function getConfig(): JsonConverterConfigurationInterface {
  return {
    conversionSchema: localConversionSchema,
    conversionFunctionsMapArray: jsonConvConfigUtil.functionsMapArray,
    classesMapArray: jsonConvConfigUtil.classesMapArray
  };
}

const jsonConverterConfig: IJsonConverterConfigFactory = {getConfig};

@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
    AngularJsonClassConverterModule.forRoot(jsonConverterConfig)
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule {
}
