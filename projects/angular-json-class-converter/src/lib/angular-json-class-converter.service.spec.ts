import { TestBed } from '@angular/core/testing';

import { AngularJsonClassConverterService } from './angular-json-class-converter.service';

describe('AngularJsonClassConverterService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: AngularJsonClassConverterService = TestBed.get(AngularJsonClassConverterService);
    expect(service).toBeTruthy();
  });
});
