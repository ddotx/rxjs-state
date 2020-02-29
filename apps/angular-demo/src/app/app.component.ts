import { Component } from '@angular/core';
import {of} from "rxjs";
import {coalesce} from "../../../../libs/rxjs-state/src/lib/core/operators/coalesce";

@Component({
  selector: 'rx-state-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'angular-demo';

  c = of(1,2,3,4).pipe(coalesce()).subscribe(console.log)
  d = of(3333333,2,3,4).pipe(coalesce()).subscribe(console.log)
  r = of(3333333,2,3,4).pipe(coalesce()).subscribe(console.log)
  s = of(3333333,2,3,4).pipe(coalesce()).subscribe(console.log)
}
