import {Component} from '@angular/core';
import {coalesce, CoalesceConfig, animationFrames} from '@rx-state/rxjs-state';
import {concat, range, timer} from 'rxjs';
import {filter, tap} from 'rxjs/operators';
import {time} from '../../../../libs/rxjs-state/spec/marble-helpers';

@Component({
  selector: 'rx-state-root',
  template: `
    <h1>App</h1>
    <!-- animationFrames: {{animationFrames$ | async}}<br>-->
    stateChanges$: {{stateChanges$ | async}}<br>
    o1$: {{o1$ | async}}<br>
  `
})
export class AppComponent {
  animationFrames$ = animationFrames();
  cfg1: CoalesceConfig = {
    leading: true,
    trailing: true
  };

  stateChanges$ = concat(range(1, 10),
  //  timer(1000).pipe(filter(v => false))
  );
  // 1, 10
  o1$ = this.stateChanges$
    .pipe(
      coalesce(() => animationFrames(), this.cfg1),
      tap(console.log)
    )
}
