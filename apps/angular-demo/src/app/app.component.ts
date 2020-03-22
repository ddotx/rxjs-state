import {Component} from '@angular/core';
import {animationFrames, coalesce, CoalesceConfig} from '@rx-state/rxjs-state';
import {EMPTY, of, range} from 'rxjs';
import {scan} from 'rxjs/operators';

export const defaultCoalesceDurationSelector = <T>(value: T) => EMPTY;

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

  stateChanges$ = range(1, 10);
  // 1, 10
  c = this.stateChanges$
    .pipe(
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
