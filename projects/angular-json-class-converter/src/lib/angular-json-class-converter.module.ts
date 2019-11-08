import {ModuleWithProviders, NgModule} from '@angular/core';
import {JsonConverterConfigurationInterface} from 'json-class-converter';
import {
  AngularJsonClassConverterService, JsonConverterConfig
} from './angular-json-class-converter.service';

export interface IJsonConverterConfigFactory {
  getConfig: () => JsonConverterConfigurationInterface;
}

@NgModule({
  imports: [],
  declarations: []
})
export class AngularJsonClassConverterModule {
  static forRoot(aConfigFactory: IJsonConverterConfigFactory): ModuleWithProviders {
    return {
      ngModule: AngularJsonClassConverterModule,
      providers: [
        AngularJsonClassConverterService,
        {
          provide: JsonConverterConfig,
          useFactory: aConfigFactory.getConfig
        }
      ]
    };
  }
}
