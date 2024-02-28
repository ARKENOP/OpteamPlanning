import { Component, OnInit, ViewChild, TemplateRef } from '@angular/core';

import { HttpClient } from '@angular/common/http';
import { HttpHeaders } from '@angular/common/http';

import { SocialAuthService, SocialUser } from '@abacritt/angularx-social-login';
import { GoogleLoginProvider } from '@abacritt/angularx-social-login';

import { NgbModal } from '@ng-bootstrap/ng-bootstrap';

import { Calendar, CalendarOptions, EventApi } from '@fullcalendar/core';
import { ResourceInput } from '@fullcalendar/resource';
import resourceTimelinePlugin from '@fullcalendar/resource-timeline';
import listPlugin from '@fullcalendar/list';
import adaptivePlugin from '@fullcalendar/adaptive';
import frLocale from '@fullcalendar/core/locales/fr';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit{
  @ViewChild('modalAddEvent') modalAddEvent!: TemplateRef<any>;

  // Variables pour la connexion Google
  user!: SocialUser; 
  loggedIn?: boolean; 
  photoUrl?: string; 
  private accessToken = ''; 

  // Variables pour le calendrier
  events: any[] = [];
  eventAddedSuccessfully: boolean = false;
  eventAddError: boolean = false;
  testApiCalendarEvents: any[] = []; // TODO : Changer le nom de la variable
  newEvent: any = {
    title: '',
    time: 'allDay',  // Valeur par défault
    start: '',
    end: '',
  };

  // Variables pour Google People API
  peopleData: any[] = [];
  excludeEmails: string[] = [];

  // Variables pour le calendrier FullCalendar
  resources: ResourceInput[] = [];
  calendarInst?: Calendar;
  currentEvents: EventApi[] = [];
  calendarVisible = true;

  // Options pour le calendrier FullCalendar
  calendarOptions: CalendarOptions = {
    schedulerLicenseKey : 'CC-Attribution-NonCommercial-NoDerivatives', // TODO: Changer la clée de licence
    initialView: 'resourceTimelineMonth',
    plugins: [resourceTimelinePlugin, listPlugin, adaptivePlugin], 
    weekends: false,
    timeZone: 'local',
    editable: false,
    slotDuration: {
      "hours": 12
    },
    slotLabelInterval: {
      "hours": 24
    },
    slotLabelFormat: [{
        week: "short",
      },
      {
        weekday: 'narrow',
        day: 'numeric'
      } 
    ],
    navLinks: false,
    height: 'auto',
    nowIndicator: true,
    resourceAreaWidth: '15%',
    headerToolbar: {
      left: 'prev,next today addEvent',
      center: 'title',
      right: 'resourceTimelineMonth,listMonth,refresh',
    },
    customButtons: {
      addEvent: {
        text: 'Ajouter un événement',
        click: () => {
          this.openModal(this.modalAddEvent);
        },
      },
      refresh: {
        text: 'Rafraîchir',
        click: () => {
          this.getGooglePeopleData();
          this.getGoogleCalendarData();
        },
      },
    },
    resourceAreaColumns: [
      {
        field: 'title',
        headerContent: 'Collaborateurs',
      },
    ],
    resources: this.resources,
    eventMouseEnter: (mouseEnterInfo) => {
      mouseEnterInfo.el.style.cursor = 'pointer'; 
    },
    eventClick: (info) => {
      console.log(info.event);
      const eventBackgroundColor = info.event.backgroundColor;
      
      if (eventBackgroundColor.toLowerCase().includes('green')) {
        alert(`Team Connect`);
      } else if (eventBackgroundColor.toLowerCase().includes('blue')) {
        alert(`Jour férié`);
      } else if (eventBackgroundColor.toLowerCase().includes('purple')) {
        alert(`Événement spécial`);
      } else {
        const resourceId = info.event.getResources().map((resource) => resource.id);
        const loggedInUserName = this.user.name;
        if (resourceId.includes(loggedInUserName)) {
          if (confirm("Êtes-vous sûr de vouloir supprimer cet événement ?")) {
            this.deleteEvent(info.event.id);
          }
        } else {
          alert("Vous n'avez pas le droit de supprimer cet événement.");
        }
      }
    },
    locale: frLocale,
  };
  
  constructor(private authService: SocialAuthService, private httpClient: HttpClient, private modalService : NgbModal) {}

  
  ngOnInit() {
    // Initialisation de l'utilisateur google connecté
    this.authService.authState.subscribe((user) => {
      this.user = user;
      this.loggedIn = (user != null);
      console.log(this.user) // TODO: Supprimer cette ligne
      if (this.loggedIn) {
        this.getAccessToken();
        setTimeout(() => {
          this.getGooglePeopleData();
          this.getGoogleCalendarData();
        }, 5000);
      }
    });
  }

  onSubmit(): void {
    // Ajouter un événement au calendrier avec le formulaire
    if (!this.accessToken) return;

    let event;

    if (this.newEvent.title === 'Team Connect') {
      event = {
        summary: 'Team Connect',
        description: 'Team Connect',
        start: {
          date: this.newEvent.start,
          timeZone: 'Europe/Paris',
        },
        end: {
          date: this.newEvent.end,
          timeZone: 'Europe/Paris',
        },
      };
    } else if (this.newEvent.title === 'Evenement special') {
      event = {
        summary: 'Evenement Special',
        description: 'Autre',
        start: {
          date: this.newEvent.start,
          timeZone: 'Europe/Paris',
        },
        end: {
          date: this.newEvent.end,
          timeZone: 'Europe/Paris',
        },
      };
    } else {
    
    const modifiedSummary = `${this.newEvent.title} ${this.user.name}`;

    if (this.newEvent.time === 'allDay') {
      event = {
        summary: modifiedSummary,
        start: {
          date: this.newEvent.start, 
          timeZone: 'Europe/Paris',
        },
        end: {
          date: this.newEvent.end, 
          timeZone: 'Europe/Paris',
        },
      };
    } else {
      let startTime: string;
      let endTime: string;

      if (this.newEvent.time === 'morning') {
        startTime = '00:00:00';
        endTime = '12:00:00';
      } else if (this.newEvent.time === 'afternoon') {
        startTime = '12:00:00';
        endTime = '23:59:59';
      } else {
        startTime = '00:00:00';
        endTime = '00:00:00';
      }

      event = {
        summary: modifiedSummary,
        start: {
          dateTime: `${this.newEvent.start}T${startTime}`,
          timeZone: 'Europe/Paris',
        },
        end: {
          dateTime: `${this.newEvent.end}T${endTime}`,
          timeZone: 'Europe/Paris',
        },
      };
    }}
    this.addEventToTestApiCalendar(event);
  }

  signOut(): void {
    // Déconnexion de l'utilisateur
    this.authService.signOut();
    console.log("user signed out") // TODO: Supprimer cette ligne
  }

  getAccessToken(): void {
    // Récupérer le token d'accès
    this.authService.getAccessToken(GoogleLoginProvider.PROVIDER_ID).then(accessToken => this.accessToken = accessToken);
  }

  refreshToken(): void {
    // Rafraîchir le token d'accès
    this.authService.refreshAccessToken(GoogleLoginProvider.PROVIDER_ID);
  }

  getGoogleCalendarData(): void {
    // Récupérer les données de Google Calendar API
    if (!this.accessToken) return;

    this.getTestApiCalendarData();
  }

  getGooglePeopleData(): void {
    // Récupérer les données de Google People API
    if (!this.accessToken) return;

    const apiKey = ''; // TODO: Changer la clée d'API
    const apiUrl = 'https://people.googleapis.com/v1/people:listDirectoryPeople';
    const readMask = 'names,emailAddresses';
    const directorySourceType = 'DIRECTORY_SOURCE_TYPE_DOMAIN_PROFILE';
    const pageSize = 100;

    const requestUrl = `${apiUrl}?readMask=${readMask}&sources=${directorySourceType}&pageSize=${pageSize}&key=${apiKey}`;

    const headers = new HttpHeaders({
      Authorization: `Bearer ${this.accessToken}`
    });

    this.httpClient
      .get(requestUrl, { headers })
      .subscribe(
        (response: any) => {
          // Exclure les adresses e-mail spécifiques
          this.peopleData = response.people.filter((person: any) => !this.excludeEmails.includes(person.emailAddresses[0]?.value));
          // Créer les ressources pour le calendrier FullCalendar avec le nom des collaborateurs
          this.resources = this.peopleData.map((person: any) => ({
            id: person.names[0]?.displayName || 'N/A',
            title: person.names[0]?.displayName || 'N/A',
          }));
          console.log(this.resources); // TODO: Supprimer cette ligne
          this.calendarOptions.resources = this.resources;
          console.log(response); // TODO: Supprimer cette ligne
        },
        (error) => {
          console.error(error);
        }
      );
  }

    
  getTestApiCalendarData(): void {
    if (!this.accessToken) return;
    
    const calendarUrl = '';

    this.httpClient
      .get(`https://www.googleapis.com/calendar/v3/calendars/${calendarUrl}/events`, {
        headers: { Authorization: `Bearer ${this.accessToken}` },
      })
      .subscribe((events: any) => {
        this.testApiCalendarEvents = events.items;
        
        this.calendarOptions.events = events.items.map((event: any) => {

          // Récupérer le nom du créateur de l'événement et le comparer avec les noms des collaborateurs
          const creatorEmail = event.creator?.email; 
          const matchingPerson = this.peopleData.find((person: any) =>
            person.emailAddresses[0]?.value === creatorEmail
          );
  
          let resourceId = '';
          let backgroundColor = '';
          let gridBackgroundColor = '';
          const eventTitleLowerCase = event.summary?.toLowerCase();
          let allResources: string[] = [];
          if (this.calendarInst) {
            allResources = this.calendarInst.getResources().map((resource) => resource.id);
          }
          // Définir la couleur de l'événement en fonction de son titre
          if (eventTitleLowerCase.includes('présence')) {
            backgroundColor = 'yellow';
            resourceId = matchingPerson ? matchingPerson.names[0]?.displayName : 'N/A';
          } else if (eventTitleLowerCase.includes('repos')) {
            backgroundColor = 'red';
            resourceId = matchingPerson ? matchingPerson.names[0]?.displayName : 'N/A';
          } else if (eventTitleLowerCase.includes('congés')) {
            backgroundColor = 'red';
            resourceId = matchingPerson ? matchingPerson.names[0]?.displayName : 'N/A';
          } else if (eventTitleLowerCase.includes('absence')) {
            backgroundColor = 'red';
            resourceId = matchingPerson ? matchingPerson.names[0]?.displayName : 'N/A';
          } else if (eventTitleLowerCase.includes('formation')) {
            backgroundColor = 'orange';
            resourceId = matchingPerson ? matchingPerson.names[0]?.displayName : 'N/A';
          } else if (eventTitleLowerCase.includes('team connect')) {
            gridBackgroundColor = 'background';
            backgroundColor = 'green';
            resourceId = allResources?.join(',');
          } else if (event.description?.includes('Jour férié')) {
            gridBackgroundColor = 'background';
            backgroundColor = 'blue';
            resourceId = allResources?.join(',');
          } else if (event.description?.includes('Autre')) {
            gridBackgroundColor = 'background';
            backgroundColor = 'purple';
            resourceId = allResources?.join(',');
          }

          return {
            id: event.id,
            title: (eventTitleLowerCase.includes('team connect') || event.description?.includes('Autre') || event.description?.includes('Jour férié')) ? '' : event.summary,
            description: event.description,
            start: event.start.dateTime || event.start.date,
            end: event.end.dateTime || event.end.date,
            resourceId: resourceId,
            backgroundColor: backgroundColor,
            display: gridBackgroundColor,
            textColor: 'black',
          };
        });
  
        console.log('Événements du calendrier', this.calendarOptions.events); // TODO: Supprimer cette ligne
        console.log('Vacances du personnel', this.testApiCalendarEvents); // TODO: Supprimer cette ligne
      });
  }

  addEventToTestApiCalendar(event: any): void {
    // Ajouter un événement au calendrier Google
    if (!this.accessToken) return;
    
    const calendarUrl = '';
    const url = `https://www.googleapis.com/calendar/v3/calendars/${calendarUrl}/events`;
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${this.accessToken}`,
      'Content-Type': 'application/json',
    });
  
    this.httpClient.post(url, event, { headers })
      .subscribe(
        (response) => {
          console.log('Événement ajouté avec succès', response); // TODO: Supprimer cette ligne
          this.eventAddedSuccessfully = true;
          setTimeout(() => {
            this.eventAddedSuccessfully = false;
          }, 5000);
          this.getTestApiCalendarData();
        },
        (error) => {
          console.error('Erreur lors de l\'ajout de l\'événement', error); // TODO: Supprimer cette ligne
          this.eventAddError = true;
          setTimeout(() => {
            this.eventAddError = false;
          }, 5000);
        }
      );
  }

  deleteEvent(eventId: string): void {
    // Supprimer un événement du calendrier Google
    if (!this.accessToken) return;

    const calendarUrl = '';
  
    const url = `https://www.googleapis.com/calendar/v3/calendars/${calendarUrl}/events/${eventId}`;
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${this.accessToken}`,
    });
  
    this.httpClient.delete(url, { headers })
      .subscribe(
        (response) => {
          console.log('Événement supprimé avec succès', response); // TODO: Supprimer cette ligne
          this.getTestApiCalendarData();
        },
        (error) => {
          console.error('Erreur lors de la suppression de l\'événement', error); //TODO : Supprimer cette ligne
        }
      );
  }

  openModal(content: TemplateRef<any>) {
    // Ouvrir la modale pour ajouter un événement
    this.modalService.open(content, { centered: true });
  }
}
