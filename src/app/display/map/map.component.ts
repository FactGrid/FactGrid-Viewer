//import { importExpr } from '@angular/compiler/src/output/output_ast';
import {
  Component,
  OnInit,
  Input,
  ChangeDetectorRef,
  inject,
  OnDestroy,
  AfterViewInit,
} from '@angular/core';
import { ActivatedRoute, ParamMap } from '@angular/router';
import { switchMap } from 'rxjs/operators';
import * as Leaflet from 'leaflet';

@Component({
  selector: 'app-map',
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.scss'],
  standalone: true,
})
export class MapComponent implements OnInit, OnDestroy, AfterViewInit {
  private changeDetector = inject(ChangeDetectorRef);
  private route = inject(ActivatedRoute);

  latitude: string;
  longitude: string;
  mapZoom: string;
  lat: number;
  lng: number;
  zoom: number;

  ngOnInit(): void {
    this.route.params.subscribe((params) => {
      let latitude = params['lat'];
      let longitude = params['lng'];
      let zoom = params['z'];
      this.lat = Number(latitude);
      this.lng = Number(longitude);
      this.zoom = Number(zoom);
    });
  }

  ngAfterViewInit(): void {
    // S'assurer que le DOM est prêt
    setTimeout(() => {
      const container = document.getElementById('map');
      if (container) {
        const itemLocation = { coords: new Leaflet.LatLng(this.lat, this.lng), zoom: this.zoom };
        let map = Leaflet.map(container);
        Leaflet.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
        // Fix Leaflet's default icon path issues with Webpack/Angular
        // We delete the default _getIconUrl method so Leaflet doesn't try to guess paths
        // and instead uses the URLs we provide in mergeOptions.
        const iconDefault = Leaflet.Icon.Default.prototype as any;
        delete iconDefault._getIconUrl;

        Leaflet.Icon.Default.mergeOptions({
          iconUrl: '/assets/leaflet/marker-icon.svg',
          iconRetinaUrl: '/assets/leaflet/marker-icon-2x.svg',
          shadowUrl: '/assets/leaflet/marker-shadow.svg',
        });

        Leaflet.marker([this.lat, this.lng]).addTo(map);
        map.setView(itemLocation.coords, itemLocation.zoom);
      }
    }, 0);
  }

  ngOnDestroy(): void {}
}
