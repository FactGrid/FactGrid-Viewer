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
import { getZoomForXY } from '../../config/map.config';

// Fix Leaflet's default icon path issues with Webpack/Angular
// This must be done at module level to ensure it applies globally and correctly
// before any map instance is created.
const iconDefault = Leaflet.Icon.Default.prototype as any;
delete iconDefault._getIconUrl;

// Use relative paths instead of absolute paths to support deployment in subdirectories
// (e.g., GitHub Pages at /FactGrid-Viewer/)
const getAssetPath = (path: string): string => {
  const base = document.getElementsByTagName('base')[0]?.href || '/';
  return new URL(path, base).href;
};

Leaflet.Icon.Default.mergeOptions({
  iconUrl: getAssetPath('assets/leaflet/marker-icon.svg'),
  iconRetinaUrl: getAssetPath('assets/leaflet/marker-icon-2x.svg'),
  shadowUrl: getAssetPath('assets/leaflet/marker-shadow.svg'),
  iconSize: [32, 48],
  iconAnchor: [16, 48],
  shadowSize: [60, 20],
});

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
      // If map instance already exists, update view immediately
      setTimeout(() => this.updateMapIfPresent(), 0);
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

        Leaflet.marker([this.lat, this.lng]).addTo(map);
        const finalZoom = Number.isFinite(itemLocation.zoom) ? itemLocation.zoom : getZoomForXY(null);
        map.setView(itemLocation.coords, finalZoom);
        // Keep a reference to map so we can update view when route params change (e.g., when DisplayComponent navigates)
        (this as any)._leafletMap = map;
      }
    }, 0);
  }

  // When route params change after map is initialized, update view accordingly
  private updateMapIfPresent(): void {
    try {
      const map: Leaflet.Map | undefined = (this as any)._leafletMap;
      if (!map) return;
      const finalZoom = Number.isFinite(this.zoom) ? this.zoom : getZoomForXY(null);
      map.setView(new Leaflet.LatLng(this.lat, this.lng), finalZoom);
    } catch (e) {
      // ignore
    }
  }

  ngOnDestroy(): void {}
}
