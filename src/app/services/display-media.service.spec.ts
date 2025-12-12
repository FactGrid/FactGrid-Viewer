import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { DomSanitizer } from '@angular/platform-browser';
import { of, throwError } from 'rxjs';
import { DisplayMediaService } from './display-media.service';
import { RequestService } from './request.service';

describe('DisplayMediaService', () => {
  let service: DisplayMediaService;
  let requestServiceMock: any;
  let sanitizerMock: any;

  beforeEach(() => {
    // Mock RequestService
    requestServiceMock = {
      getCommonsImageMetadata: vi.fn()
    };

    // Mock DomSanitizer
    sanitizerMock = {
      bypassSecurityTrustHtml: vi.fn((html) => html as any)
    };

    TestBed.configureTestingModule({
      providers: [
        DisplayMediaService,
        { provide: RequestService, useValue: requestServiceMock },
        { provide: DomSanitizer, useValue: sanitizerMock }
      ]
    });

    service = TestBed.inject(DisplayMediaService);
  });

  afterEach(() => {
    // Clean up any preload links added to document.head
    document.querySelectorAll('link[rel="preload"][as="image"]').forEach((link) => {
      link.remove();
    });
  });

  describe('preloadImage', () => {
    it('devrait ajouter un élément <link rel="preload"> au DOM', () => {
      const url = 'https://example.com/image.jpg';
      service.preloadImage(url);

      const links = document.querySelectorAll('link[rel="preload"][as="image"]');
      const addedLink = Array.from(links).find((link: any) => link.href === url);
      
      expect(addedLink).toBeDefined();
    });

    it('ne devrait rien faire si url est vide', () => {
      const initialCount = document.querySelectorAll('link[rel="preload"][as="image"]').length;
      service.preloadImage('');
      const finalCount = document.querySelectorAll('link[rel="preload"][as="image"]').length;
      
      expect(finalCount).toBe(initialCount);
    });
  });

  describe('openImage', () => {
    it('devrait ouvrir une nouvelle fenêtre avec l\'URL fournie', () => {
      const windowOpenSpy = vi.spyOn(window, 'open').mockImplementation(() => null);
      const url = 'https://example.com/image.jpg';

      service.openImage(url);

      expect(windowOpenSpy).toHaveBeenCalledWith(url, '_blank');
      windowOpenSpy.mockRestore();
    });

    it('ne devrait rien faire si url est vide', () => {
      const windowOpenSpy = vi.spyOn(window, 'open').mockImplementation(() => null);
      
      service.openImage('');

      expect(windowOpenSpy).not.toHaveBeenCalled();
      windowOpenSpy.mockRestore();
    });
  });

  describe('buildPicturesFromClaims', () => {
    it('devrait convertir claims P189 en tableau de pictures', () => {
      const claims = [
        { picture: 'https://example.com/img1.jpg' },
        { picture: 'https://example.com/img2.jpg' }
      ];

      const pictures = service.buildPicturesFromClaims(claims);

      expect(pictures).toHaveLength(2);
      expect(pictures[0]).toEqual({
        thumbnail: 'https://example.com/img1.jpg?width=300',
        full: 'https://example.com/img1.jpg',
        uniqueKey: 'https://example.com/img1.jpg'
      });
      expect(pictures[1]).toEqual({
        thumbnail: 'https://example.com/img2.jpg?width=300',
        full: 'https://example.com/img2.jpg',
        uniqueKey: 'https://example.com/img2.jpg'
      });
    });

    it('devrait précharger toutes les images (thumbnail + full)', () => {
      const claims = [
        { picture: 'https://example.com/img.jpg' }
      ];

      service.buildPicturesFromClaims(claims);

      const links = document.querySelectorAll('link[rel="preload"][as="image"]');
      const hrefs = Array.from(links).map((link: any) => link.href);

      expect(hrefs).toContain('https://example.com/img.jpg?width=300');
      expect(hrefs).toContain('https://example.com/img.jpg');
    });

    it('devrait retourner tableau vide si claims undefined', () => {
      const pictures = service.buildPicturesFromClaims(undefined);
      expect(pictures).toEqual([]);
    });

    it('devrait retourner tableau vide si claims n\'est pas un tableau', () => {
      const pictures = service.buildPicturesFromClaims({} as any);
      expect(pictures).toEqual([]);
    });

    it('devrait générer uniqueKey avec index si picture.picture manquant', () => {
      const claims = [
        { picture: null }
      ];

      const pictures = service.buildPicturesFromClaims(claims);

      expect(pictures[0].uniqueKey).toBe('picture-0');
    });
  });

  describe('fetchImageCaption', () => {
    it('devrait récupérer et sanitizer la caption HTML', async () => {
      const mockMeta = {
        descriptionHtml: '<p>Test caption</p>'
      };
      requestServiceMock.getCommonsImageMetadata.mockReturnValue(of(mockMeta));
      sanitizerMock.bypassSecurityTrustHtml.mockReturnValue('<p>Test caption</p>');

      const html = await new Promise((resolve) => {
        service.fetchImageCaption('https://example.com/File:Test.jpg').subscribe((html) => {
          resolve(html);
        });
      });
      
      expect(html).toBe('<p>Test caption</p>');
      expect(sanitizerMock.bypassSecurityTrustHtml).toHaveBeenCalledWith('<p>Test caption</p>');
    });

    it('devrait retourner null si pas de descriptionHtml', async () => {
      requestServiceMock.getCommonsImageMetadata.mockReturnValue(of({ descriptionHtml: null }));

      const html = await new Promise((resolve) => {
        service.fetchImageCaption('https://example.com/image.jpg').subscribe((html) => {
          resolve(html);
        });
      });
      
      expect(html).toBeNull();
    });

    it('devrait retourner null si meta est null', async () => {
      requestServiceMock.getCommonsImageMetadata.mockReturnValue(of(null));

      const html = await new Promise((resolve) => {
        service.fetchImageCaption('https://example.com/image.jpg').subscribe((html) => {
          resolve(html);
        });
      });
      
      expect(html).toBeNull();
    });

    it('devrait extraire File: depuis URL avec pathname', async () => {
      requestServiceMock.getCommonsImageMetadata.mockReturnValue(of(null));

      await new Promise<void>((resolve) => {
        service.fetchImageCaption('https://commons.wikimedia.org/wiki/Special:FilePath/Test%20Image.jpg').subscribe(() => {
          expect(requestServiceMock.getCommonsImageMetadata).toHaveBeenCalledWith(
            expect.stringContaining('File:')
          );
          resolve();
        });
      });
    });
  });

  describe('toggleCaptionAsync', () => {
    it('devrait cacher caption si déjà visible et non en chargement', async () => {
      const picture = { captionVisible: true, captionLoading: false };

      await new Promise<void>((resolve) => {
        service.toggleCaptionAsync(picture).subscribe(() => {
          expect(picture.captionVisible).toBe(false);
          resolve();
        });
      });
    });

    it('devrait toggle caption si déjà chargée', async () => {
      const picture = { captionVisible: false, captionHtml: '<p>Cached</p>' };

      await new Promise<void>((resolve) => {
        service.toggleCaptionAsync(picture).subscribe(() => {
          expect(picture.captionVisible).toBe(true);
          resolve();
        });
      });
    });

    it('devrait fetch caption si pas encore chargée', async () => {
      const mockMeta = { descriptionHtml: '<p>New caption</p>' };
      requestServiceMock.getCommonsImageMetadata.mockReturnValue(of(mockMeta));
      sanitizerMock.bypassSecurityTrustHtml.mockReturnValue('<p>New caption</p>');

      const picture: any = { full: 'https://example.com/image.jpg' };

      await new Promise<void>((resolve) => {
        service.toggleCaptionAsync(picture).subscribe(() => {
          expect(picture.captionLoading).toBe(false);
          expect(picture.captionHtml).toBe('<p>New caption</p>');
          expect(picture.captionVisible).toBe(true);
          resolve();
        });
      });
    });

    it('devrait gérer erreur de fetch et afficher caption vide', async () => {
      requestServiceMock.getCommonsImageMetadata.mockReturnValue(throwError(() => new Error('Network error')));

      const picture: any = { full: 'https://example.com/image.jpg' };

      await new Promise<void>((resolve) => {
        service.toggleCaptionAsync(picture).subscribe(() => {
          expect(picture.captionLoading).toBe(false);
          expect(picture.captionHtml).toBeNull();
          expect(picture.captionVisible).toBe(true);
          resolve();
        });
      });
    });

    it('ne devrait rien faire si picture est null', async () => {
      await new Promise<void>((resolve) => {
        service.toggleCaptionAsync(null).subscribe(() => {
          expect(true).toBe(true); // juste vérifier que ça complète sans erreur
          resolve();
        });
      });
    });
  });
});
