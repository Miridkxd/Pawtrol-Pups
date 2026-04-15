import { Component, OnInit, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { IonContent, IonHeader, IonToolbar } from '@ionic/angular/standalone';

declare var google: any;

const ICONS = {
  vet: 'https://maps.google.com/mapfiles/ms/icons/blue-dot.png',
  police: 'https://maps.google.com/mapfiles/ms/icons/red-dot.png',
  user: 'https://maps.google.com/mapfiles/ms/icons/green-dot.png',
  rescuers: 'https://maps.google.com/mapfiles/ms/icons/yellow-dot.png',
};

@Component({
  selector: 'app-maps',
  templateUrl: './maps.page.html',
  styleUrls: ['./maps.page.scss'],
  standalone: true,
  imports: [IonContent, IonHeader, IonToolbar, CommonModule, FormsModule, RouterLink],
})
export class MapsPage implements OnInit, AfterViewInit {
  map: any;
  markers: any[] = [];
  radiusCircle: any = null;
  currentLocation: any;
  radius = 5000;
  currentFilter = 'all';
  onlyOpenNow = false;
  loading = false;
  errorMsg = '';

  ngOnInit() {}

  ngAfterViewInit() {
    this.loadMap();
  }

  loadMap() {
    this.loading = true;
    navigator.geolocation.getCurrentPosition(
      (position) => {
        this.loading = false;
        this.currentLocation = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        this.map = new google.maps.Map(document.getElementById('map'), {
          center: this.currentLocation,
          zoom: 14,
          disableDefaultUI: true,
          zoomControl: true,
        });

        new google.maps.Marker({
          position: this.currentLocation,
          map: this.map,
          title: 'Estás acá',
          icon: ICONS.user,
          zIndex: 999,
        });

        this.drawRadiusCircle();
        this.searchPlaces();
      },
      (err) => {
        this.loading = false;
        this.errorMsg = 'No se pudo obtener tu ubicación. Activá el GPS e intentá de nuevo.';
        console.error(err);
      }
    );
  }

  drawRadiusCircle() {
    if (this.radiusCircle) this.radiusCircle.setMap(null);
    this.radiusCircle = new google.maps.Circle({
      map: this.map,
      center: this.currentLocation,
      radius: this.radius,
      strokeColor: '#A3B39C',
      strokeOpacity: 0.8,
      strokeWeight: 2,
      fillColor: '#A3B39C',
      fillOpacity: 0.1,
    });
  }

  searchPlaces() {
    this.clearMarkers();
    const service = new google.maps.places.PlacesService(this.map);

    if (this.currentFilter === 'vet') {
      this.searchByType(service, ['veterinary_care']);
    } else if (this.currentFilter === 'police') {
      this.searchByType(service, ['police']);
    } else if (this.currentFilter === 'rescuers') {
      this.searchByText(service);
    } else {
      this.searchByType(service, ['veterinary_care', 'police']);
      this.searchByText(service);
    }
  }

  searchByType(service: any, types: string[]) {
    types.forEach((type) => {
      service.nearbySearch(
        { location: this.currentLocation, radius: this.radius, type },
        (results: any, status: any) => {
          if (status === google.maps.places.PlacesServiceStatus.OK && results) {
            results.forEach((place: any) => {
              if (this.onlyOpenNow) {
                service.getDetails(
                  { placeId: place.place_id, fields: ['opening_hours'] },
                  (details: any, detailStatus: any) => {
                    if (detailStatus === google.maps.places.PlacesServiceStatus.OK &&
                        details.opening_hours?.open_now) {
                      this.createMarker(place, service, type);
                    }
                  }
                );
              } else {
                this.createMarker(place, service, type);
              }
            });
          }
        }
      );
    });
  }

  searchByText(service: any) {
    const keywords = [
      'protectora de animales',
      'refugio de animales',
      'rescate animal',
      'animal rescue',
      'animal shelter',
      'sociedad protectora',
    ];
    keywords.forEach((keyword) => {
      service.textSearch(
        {
          location: this.currentLocation,
          radius: this.radius,
          query: keyword,
        },
        (results: any, status: any) => {
          if (status === google.maps.places.PlacesServiceStatus.OK && results) {
            results.forEach((place: any) => {
              const exists = this.markers.some((m) => {
                const pos = m.getPosition();
                return pos.lat() === place.geometry.location.lat() && pos.lng() === place.geometry.location.lng();
              });
              if (!exists) {
                if (this.onlyOpenNow) {
                  service.getDetails(
                    { placeId: place.place_id, fields: ['opening_hours'] },
                    (details: any, detailStatus: any) => {
                      if (detailStatus === google.maps.places.PlacesServiceStatus.OK &&
                          details.opening_hours?.open_now) {
                        this.createMarker(place, service, 'rescuers');
                      }
                    }
                  );
                } else {
                  this.createMarker(place, service, 'rescuers');
                }
              }
            });
          }
        }
      );
    });
  }

  createMarker(place: any, service: any, type: string) {
    let iconUrl: string;
    if (type === 'veterinary_care') iconUrl = ICONS.vet;
    else if (type === 'rescuers') iconUrl = ICONS.rescuers;
    else iconUrl = ICONS.police;

    const marker = new google.maps.Marker({
      position: place.geometry.location,
      map: this.map,
      icon: iconUrl,
      title: place.name,
    });

    const infoWindow = new google.maps.InfoWindow();

    marker.addListener('click', () => {
      service.getDetails(
        {
          placeId: place.place_id,
          fields: [
            'name',
            'formatted_address',
            'rating',
            'opening_hours',
            'formatted_phone_number',
            'website',
            'geometry',
          ],
        },
        (details: any, status: any) => {
          if (status === google.maps.places.PlacesServiceStatus.OK) {
            const distance = this.getDistance(
              this.currentLocation.lat,
              this.currentLocation.lng,
              details.geometry.location.lat(),
              details.geometry.location.lng()
            );
            const phone = details.formatted_phone_number;
            const directionsUrl = `https://www.google.com/maps/dir/?api=1&origin=${this.currentLocation.lat},${this.currentLocation.lng}&destination=${details.geometry.location.lat()},${details.geometry.location.lng()}&travelmode=driving`;

            const content = `
              <div class="custom-info-window">
                <h3>${this.escapeHtml(details.name)}</h3>
                <p class="address">📍 ${this.escapeHtml(details.formatted_address)}</p>
                <p class="distance">📏 A ${distance.toFixed(1)} km</p>
                ${details.rating ? `<p class="rating">⭐ ${details.rating} / 5</p>` : ''}
                ${details.opening_hours?.open_now !== undefined 
                  ? `<p class="hours ${details.opening_hours.open_now ? 'open' : 'closed'}">
                      ${details.opening_hours.open_now ? '🟢 Abierto ahora' : '🔴 Cerrado'}
                     </p>` 
                  : ''}
                <div class="button-group">
                  ${phone 
                    ? `<a href="tel:${phone}" class="action-button call-button">📞 Llamar</a>` 
                    : ''}
                  <a href="${directionsUrl}" target="_blank" class="action-button directions-button">🧭 Cómo llegar</a>
                </div>
                ${details.website 
                  ? `<a href="${details.website}" target="_blank" class="website-link">🌐 Visitar sitio web</a>` 
                  : ''}
              </div>
            `;
            infoWindow.setContent(content);
            infoWindow.open(this.map, marker);
            google.maps.event.trigger(infoWindow, 'domready');
          }
        }
      );
    });

    this.markers.push(marker);
  }

  getDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371;
    const dLat = this.deg2rad(lat2 - lat1);
    const dLon = this.deg2rad(lon2 - lon1);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  deg2rad(deg: number): number {
    return deg * (Math.PI / 180);
  }

  escapeHtml(str: string): string {
    if (!str) return '';
    return str.replace(/[&<>]/g, function(m) {
      if (m === '&') return '&amp;';
      if (m === '<') return '&lt;';
      if (m === '>') return '&gt;';
      return m;
    });
  }

  clearMarkers() {
    this.markers.forEach((m) => m.setMap(null));
    this.markers = [];
  }

  setFilter(filter: string) {
    this.currentFilter = filter;
    this.searchPlaces();
  }

  changeRadius(event: Event) {
    const input = event.target as HTMLInputElement;
    this.radius = +input.value * 1000;
    this.drawRadiusCircle();
    this.searchPlaces();
  }

  toggleOnlyOpen() {
    this.searchPlaces();
  }
} 