import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { AppComponent } from './app.component';
import { ReactiveFormsModule } from '@angular/forms';
import { SocialLoginModule, SocialAuthServiceConfig } from '@abacritt/angularx-social-login';
import { GoogleLoginProvider, GoogleSigninButtonModule, GoogleInitOptions } from '@abacritt/angularx-social-login';
import { HttpClientModule } from '@angular/common/http';

const googleLoginOptions: GoogleInitOptions = {
  oneTapEnabled: false,
  scopes: 'https://www.googleapis.com/auth/calendar',
};
@NgModule({
  declarations: [AppComponent],
  imports: [BrowserModule, ReactiveFormsModule, SocialLoginModule, GoogleSigninButtonModule, HttpClientModule],
  providers: [
    {
      provide: 'SocialAuthServiceConfig',
      useValue: {
        autoLogin: false,
        providers: [
          {
            id: GoogleLoginProvider.PROVIDER_ID,
            provider: new GoogleLoginProvider('155162922277-fbm0s0dr0tdovn2i5s382o0eiknitbou.apps.googleusercontent.com', googleLoginOptions),
          },
        ],
      } as SocialAuthServiceConfig,
    },
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}