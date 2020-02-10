import {Component, OnDestroy} from '@angular/core';
import {Subscription} from "rxjs";
import {RxState} from "@scope/ngx-rx-state";
import {map} from "rxjs/operators";
import {select} from "rxjs-state";

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  providers: [RxState]
})
export class AppComponent implements OnDestroy {

  title = 'ngx-rx-state-lib';

  subscription = new Subscription();

  sliceKey$ = this.s.select('t');
  sliceMap$ = this.s.$.pipe(select(map(s =>  s.t)));
  sliceOpKey$ = this.s.$.pipe(select('t'));


  constructor(private s: RxState<{t: number}>) {
      this.s.setState({t: 42})
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

}
