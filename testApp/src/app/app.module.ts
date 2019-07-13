import {BrowserModule} from '@angular/platform-browser';
import {NgModule} from '@angular/core';

import {AngularJsonClassConverterModule, JsonConverterConfigurationInterface} from 'angular-json-class-converter';

import {AppComponent} from './app.component';
import jsonConvConfigUtil from './utils/json-converter-config/jsonConvConfigUtil';

import localConversionSchema from '../assets/conversion-schema.json';

const jsonConverterConfig: JsonConverterConfigurationInterface = {
  conversionSchema: localConversionSchema,
  conversionFunctionsMapArray: jsonConvConfigUtil.functionsMapArray,
  classesMapArray: jsonConvConfigUtil.classesMapArray
};

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
