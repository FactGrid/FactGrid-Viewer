import { Injectable } from '@angular/core';
import { RequestService } from './services/request.service';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ResearchProjectService {
  constructor(private request: RequestService) {}

  getResearchProjects(): Observable<any[]> {
    return this.request.getResearchProjects();
  }
}
