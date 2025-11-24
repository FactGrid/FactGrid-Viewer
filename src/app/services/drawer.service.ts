import { Injectable } from '@angular/core';
import { BehaviorSubject, Subject } from 'rxjs';

export type DrawerCommand = 'toggle' | 'open' | 'close';

@Injectable({ providedIn: 'root' })
export class DrawerService {
  private commandsSubject = new Subject<DrawerCommand>();
  commands$ = this.commandsSubject.asObservable();

  private stateSubject = new BehaviorSubject<boolean>(false);
  state$ = this.stateSubject.asObservable();

  toggle() {
    this.commandsSubject.next('toggle');
  }
  open() {
    this.commandsSubject.next('open');
  }
  close() {
    this.commandsSubject.next('close');
  }

  /** Internal: update the known state (called by the drawer host) */
  setState(opened: boolean) {
    this.stateSubject.next(!!opened);
  }
}
