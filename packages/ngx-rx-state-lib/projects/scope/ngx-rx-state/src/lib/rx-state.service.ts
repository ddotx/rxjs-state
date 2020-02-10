import {Injectable} from '@angular/core';
import {State} from "rxjs-state";
import {Subscription} from "rxjs";

@Injectable()
export class RxState<T> extends State<T> {
  subscription = new Subscription();

  constructor() {
    super();
    this.subscription.add(this.subscribe());
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }
}

@Injectable({providedIn: 'root'})
export class RxGlobalState<T> extends State<T> {
  subscription = new Subscription();

  constructor() {
    super();
    this.subscription.add(this.subscribe());
  }

}
