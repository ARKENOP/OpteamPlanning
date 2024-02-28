import { AppComponent } from './app.component';

import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule } from '@angular/forms';

import { SocialLoginModule, SocialAuthServiceConfig } from '@abacritt/angularx-social-login';
import { GoogleLoginProvider, GoogleSigninButtonModule, GoogleInitOptions } from '@abacritt/angularx-social-login';

import { NgbModule, NgbDropdownModule } from '@ng-bootstrap/ng-bootstrap';

import { FullCalendarModule } from '@fullcalendar/angular';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';


const googleLoginOptions: GoogleInitOptions = {
  oneTapEnabled: false,
  scopes: 'https://www.googleapis.com/auth/directory.readonly https://www.googleapis.com/auth/calendar',
};
@NgModule({
  declarations: [AppComponent],
  imports: [
    BrowserModule, 
    HttpClientModule,
    FormsModule,
    SocialLoginModule, 
    GoogleSigninButtonModule,  
    NgbModule, 
    NgbDropdownModule,
    FullCalendarModule],
  providers: [
    {
      provide: 'SocialAuthServiceConfig',
      useValue: {
        autoLogin: false,
        providers: [
          {
            id: GoogleLoginProvider.PROVIDER_ID,
            provider: new GoogleLoginProvider('', googleLoginOptions),
          },
        ],
      } as SocialAuthServiceConfig,
    },
    provideAnimationsAsync(),
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}