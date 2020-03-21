import { Component } from '@angular/core';
import {coalesce, CoalesceConfig, defaultCoalesceDurationSelector} from '@rx-state/rxjs-state';
import { range, of, interval } from 'rxjs';
import { animationFrame } from 'rxjs/internal/scheduler/animationFrame';
import { scan, tap, throttle } from 'rxjs/operators';

@Component({
  selector: 'rx-state-root',
  template: `
    <h1>App</h1>
  `
})
export class AppComponent {
  cfg1: CoalesceConfig = {
    leading: true,
    trailing: true
  };

  durationSelector$ = of(1, 2, 3, 4);

  stateChanges$ = range(1, 25)
  // 1, 10
  c = this.stateChanges$
    .pipe(
      scan((acc, curr) => acc + curr, 0),
      // tap(console.log),
      coalesce(defaultCoalesceDurationSelector, this.cfg1),
      // throttle(value => interval(10), this.cfg1)
      )
    .subscribe(console.log);
  /*d = of(3333333, 2, 3, 4)
    .pipe(coalesce())
    .subscribe(console.log);*/
  /*r = of(3333333, 2, 3, 4)
    .pipe(coalesce())
    .subscribe(console.log);
  s = of(3333333, 2, 3, 4)
    .pipe(coalesce())
    .subscribe(console.log);
    */
}



// source: --abcde--------
// start:  --^------------
// first:  --a------------

// source: --abcde--------
// end:    -------^-------
// lase:   ------e--------
// both:   --a---e--------
