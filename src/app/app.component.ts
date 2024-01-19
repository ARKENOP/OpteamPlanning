import { SocialAuthService, SocialUser } from '@abacritt/angularx-social-login';
import { GoogleLoginProvider } from '@abacritt/angularx-social-login';
import { HttpClient } from '@angular/common/http';
import { HttpHeaders } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit{

  user!: SocialUser;
  loggedIn?: boolean;
  photoUrl?: string;
  private accessToken = '';
  events: any[] = [];
  primaryCalendarEvents: any[] = [];
  testApiCalendarEvents: any[] = [];
  
  constructor(private authService: SocialAuthService, private httpClient: HttpClient) { }

  ngOnInit() {
    this.authService.authState.subscribe((user) => {
      this.user = user;
      this.loggedIn = (user != null);
      console.log(this.user)
      if (this.loggedIn) {
        this.getAccessToken();
      }
    });
  }

  signOut(): void {
    this.authService.signOut();
    console.log("user signed out")
  }

  getAccessToken(): void {
    this.authService.getAccessToken(GoogleLoginProvider.PROVIDER_ID).then(accessToken => this.accessToken = accessToken);
  }

  getGoogleCalendarData(): void {
    if (!this.accessToken) return;

    this.getPrimaryCalendarData();
    this.getTestApiCalendarData();
  }

  getPrimaryCalendarData(): void {
    if (!this.accessToken) return;
  
    this.httpClient
      .get('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
        headers: { Authorization: `Bearer ${this.accessToken}` },
      })
      .subscribe((events: any) => {
        this.primaryCalendarEvents = events.items;
        console.log('Primary Calendar events', this.primaryCalendarEvents);
      });
  }
  
  getTestApiCalendarData(): void {
    if (!this.accessToken) return;

    const currentDate = new Date().toISOString();

    const oneMonthLater = new Date();
    oneMonthLater.setMonth(oneMonthLater.getMonth() + 1);
    const maxDate = oneMonthLater.toISOString();
  
    this.httpClient
      .get('https://www.googleapis.com/calendar/v3/calendars/7opteam.com_cf275c8a6epu2ofqtrtsd70qbc@group.calendar.google.com/events', {
        headers: { Authorization: `Bearer ${this.accessToken}` },
        params: { timeMin: currentDate, timeMax: maxDate },
      })
      .subscribe((events: any) => {
        this.testApiCalendarEvents = events.items;
        console.log('Vacances du personnel', this.testApiCalendarEvents);
      });
  }
  
  refreshToken(): void {
    this.authService.refreshAccessToken(GoogleLoginProvider.PROVIDER_ID);
  }



  addEventToPrimaryCalendar(): void {
    if (!this.accessToken) return;
  
    const event = {
      summary: 'Nouvel événement',
      description: 'Description de l\'événement',
      start: {
        dateTime: '2024-01-20T10:00:00',
        timeZone: 'Europe/Paris',
      },
      end: {
        dateTime: '2024-01-20T12:00:00',
        timeZone: 'Europe/Paris',
      },
    };
  
    const url = 'https://www.googleapis.com/calendar/v3/calendars/primary/events';
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${this.accessToken}`,
      'Content-Type': 'application/json',
    });
  
    this.httpClient.post(url, event, { headers })
      .subscribe(
        (response) => {
          console.log('Événement ajouté avec succès', response);
          // Mettez à jour votre liste locale d'événements si nécessaire
          this.getPrimaryCalendarData();
        },
        (error) => {
          console.error('Erreur lors de l\'ajout de l\'événement', error);
        }
      );
  }
}