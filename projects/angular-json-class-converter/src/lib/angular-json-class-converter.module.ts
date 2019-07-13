import {ModuleWithProviders, NgModule} from '@angular/core';
import {
  AngularJsonClassConverterService,
  JsonConverterConfig,
  JsonConverterConfigurationInterface
} from './angular-json-class-converter.service';

@NgModule({
  imports: [  ],
  declarations: []
})
export class AngularJsonClassConverterModule {
  static forRoot(converterConfiguration: JsonConverterConfigurationInterface): ModuleWithProviders {
    return {
      ngModule: AngularJsonClassConverterModule,
      providers: [
        AngularJsonClassConverterService,
        {
          provide: JsonConverterConfig,
          useValue: converterConfiguration
        }
      ]
    };
  }
}
