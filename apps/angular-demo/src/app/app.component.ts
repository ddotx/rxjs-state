import { Component } from '@angular/core';
import {coalesce, CoalesceConfig} from '@rx-state/rxjs-state';
import {range, of} from 'rxjs';
import {scan, tap} from 'rxjs/operators';

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

  stateChanges$ = range(1, 4);
  // 1, 10
  c = this.stateChanges$
    .pipe(
      tap(console.log),
      scan((acc, curr) => acc + curr, 0),
      coalesce(this.cfg1)
      )
    .subscribe(console.log);
  d = of(3333333, 2, 3, 4)
    .pipe(coalesce())
    .subscribe(console.log);
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
