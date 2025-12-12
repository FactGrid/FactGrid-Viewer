import { Injectable, inject } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { RequestService, CommonsImageMetadata } from './request.service';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

/**
 * DisplayMediaService
 * 
 * Service dédié à la gestion des images et médias dans DisplayComponent.
 * Responsabilités :
 * - Préchargement des images (thumbnails + full)
 * - Extraction des captions depuis Commons
 * - Génération des structures pour lightbox/galleries
 * - Conversion URL → File: format
 */
@Injectable({
  providedIn: 'root'
})
export class DisplayMediaService {
  private sanitizer = inject(DomSanitizer);
  private request = inject(RequestService);

  /**
   * Précharge une image en l'ajoutant au DOM via <link rel="preload">
   */
  preloadImage(url: string): void {
    if (!url) return;
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'image';
    link.href = url;
    document.head.appendChild(link);
  }

  /**
   * Ouvre une image dans un nouvel onglet
   */
  openImage(url: string): void {
    if (url) {
      window.open(url, '_blank');
    }
  }

  /**
   * Convertit un tableau de claims P189 en structure de pictures
   * prête pour affichage (thumbnail + full + uniqueKey).
   * Précharge automatiquement les images.
   */
  buildPicturesFromClaims(claimsP189?: any[]): Array<{
    thumbnail: string;
    full: string;
    uniqueKey: string;
    captionVisible?: boolean;
    captionLoading?: boolean;
    captionHtml?: SafeHtml | string | null;
  }> {
    if (!claimsP189 || !Array.isArray(claimsP189)) {
      return [];
    }

    return claimsP189.map((picture, index) => {
      const imageUrl = picture.picture;
      const thumbnailUrl = `${imageUrl}?width=300`;
      
      // Précharger les deux versions
      this.preloadImage(thumbnailUrl);
      this.preloadImage(imageUrl);

      return {
        thumbnail: thumbnailUrl,
        full: imageUrl,
        uniqueKey: imageUrl || `picture-${index}`,
      };
    });
  }

  /**
   * Extrait le nom de fichier File:... depuis une URL Commons
   */
  private filenameFromUrl(url?: string): string | null {
    if (!url) return null;
    try {
      if (/^File:/i.test(url)) return url;
      const u = new URL(url);
      const last = u.pathname.split('/').pop() || '';
      if (!last) return null;
      return `File:${decodeURIComponent(last)}`;
    } catch (e) {
      const last = url.split('/').pop() || url;
      return `File:${decodeURIComponent(last)}`;
    }
  }

  /**
   * Récupère les métadonnées d'une image Commons (caption HTML)
   * Observable qui retourne null si pas de caption ou erreur.
   */
  fetchImageCaption(pictureUrl: string): Observable<SafeHtml | null> {
    const fileName = this.filenameFromUrl(pictureUrl);
    return this.request.getCommonsImageMetadata(fileName || pictureUrl).pipe(
      map((meta: CommonsImageMetadata | null) => {
        if (meta && meta.descriptionHtml) {
          try {
            return this.sanitizer.bypassSecurityTrustHtml(meta.descriptionHtml);
          } catch (e) {
            return meta.descriptionHtml as any;
          }
        }
        return null;
      })
    );
  }

  /**
   * Toggle la visibilité de la caption d'une picture.
   * Si la caption n'est pas encore chargée, déclenche le fetch.
   * Retourne un Observable qui émet quand le toggle est terminé.
   */
  toggleCaptionAsync(picture: any): Observable<void> {
    return new Observable((subscriber) => {
      if (!picture) {
        subscriber.next();
        subscriber.complete();
        return;
      }

      // Si déjà visible et pas en chargement, on cache
      if (picture.captionVisible && !picture.captionLoading) {
        picture.captionVisible = false;
        subscriber.next();
        subscriber.complete();
        return;
      }

      // Si déjà chargée, on toggle juste
      if (picture.captionHtml) {
        picture.captionVisible = !picture.captionVisible;
        subscriber.next();
        subscriber.complete();
        return;
      }

      // Sinon on fetch
      picture.captionLoading = true;
      const candidate = picture.full || picture.thumbnail || picture.uniqueKey;
      
      this.fetchImageCaption(candidate).subscribe({
        next: (html) => {
          picture.captionLoading = false;
          picture.captionHtml = html;
          picture.captionVisible = true;
          subscriber.next();
          subscriber.complete();
        },
        error: () => {
          picture.captionLoading = false;
          picture.captionHtml = null;
          picture.captionVisible = true;
          subscriber.next();
          subscriber.complete();
        }
      });
    });
  }
}
