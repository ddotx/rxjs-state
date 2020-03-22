import {
  MonoTypeOperatorFunction,
  Observable,
  Operator,
  SubscribableOrPromise,
  Subscriber,
  Subscription,
  TeardownLogic
} from 'rxjs';
import {CoalesceConfig} from '../utils';
import {OuterSubscriber, subscribeToResult, InnerSubscriber} from 'rxjs/internal-compatibility';

export const defaultCoalesceConfig: CoalesceConfig = {
  leading: false,
  trailing: true
};

/**
 * Emits a value from the source Observable, then ignores subsequent source
 * values for a duration determined by another Observable, then repeats this
 * process.
 *
 * <span class="informal">It's like {@link throttle}, but providing a way to configure scoping.</span>
 *
 * ![](coalesce.png)
 *
 * `coalesce` emits the source Observable values on the output Observable
 * when its internal timer is disabled, and ignores source values when the timer
 * is enabled. Initially, the timer is disabled. As soon as the first source
 * value arrives, it is forwarded to the output Observable, and then the timer
 * is enabled by calling the `durationSelector` function with the source value,
 * which returns the "duration" Observable. When the duration Observable emits a
 * value or completes, the timer is disabled, and this process repeats for the
 * next source value.
 *
 * ## Example
 * Emit clicks at a rate of at most one click per second
 * ```ts
 * import { fromEvent, interval } from 'rxjs';
 * import { coalesce } from 'rxjs/operators';
 *
 * const clicks = fromEvent(document, 'click');
 * const result = clicks.pipe(coalesce(ev => interval(1000)));
 * result.subscribe(x => console.log(x));
 * ```
 *
 * @see {@link audit}
 * @see {@link debounce}
 * @see {@link delayWhen}
 * @see {@link sample}
 * @see {@link throttle}
 * @see {@link throttleTime}
 *
 * @param {function(value: T): SubscribableOrPromise} durationSelector A function
 * that receives a value from the source Observable, for computing the silencing
 * duration for each source value, returned as an Observable or a Promise.
 * @param {Object} config a configuration object to define `leading` and `trailing` behavior. Defaults
 * to `{ leading: true, trailing: false }`.
 * @return {Observable<T>} An Observable that performs the eoalesce operation to
 * limit the rate of emissions from the source.
 * @name coalesce
 */
export function coalesce<T>(durationSelector: (value: T) => SubscribableOrPromise<any>,
                            config: CoalesceConfig = defaultCoalesceConfig): MonoTypeOperatorFunction<T> {
  return (source: Observable<T>) => source.lift(new CoalesceOperator(durationSelector, !!config.leading, !!config.trailing));
}

class CoalesceOperator<T> implements Operator<T, T> {
  constructor(private durationSelector: (value: T) => SubscribableOrPromise<any>,
              private leading: boolean,
              private trailing: boolean) {
  }

  call(subscriber: Subscriber<T>, source: any): TeardownLogic {
    return source.subscribe(
      new CoalesceSubscriber(subscriber, this.durationSelector, this.leading, this.trailing)
    );
  }
}



class CoalesceSubscriber<T, R> extends OuterSubscriber<T, R> {
  private _coalesced: Subscription | null | undefined;
  private _sendValue: T | null = null;
  private _hasValue = false;

  constructor(protected destination: Subscriber<T>,
              private durationSelector: (value: T) => SubscribableOrPromise<number>,
              private _leading: boolean,
              private _trailing: boolean) {
    super(destination);
  }

  protected _next(value: T): void {
    this._hasValue = true;
    this._sendValue = value;

    if (!this._coalesced) {
      this.send();
    }
  }

  private send() {
    const { _hasValue, _sendValue, _leading} = this;
    if (_hasValue) {
      if (_leading) {
        this.destination.next(_sendValue!);
        this._hasValue = false;
        this._sendValue = null;
      }
      this.coalesce(_sendValue!);
    }
  }

  private exhaustLastValue() {
    const {_hasValue, _sendValue} = this;
    if (_hasValue && _sendValue) {
      this.destination.next(_sendValue!);
      this._hasValue = false;
      this._sendValue = null;
    }
  }

  private coalesce(value: T): void {
    const duration = this.tryDurationSelector(value);
    if (!!duration) {
      this.add(this._coalesced = subscribeToResult(this, duration));
    }
  }

  private tryDurationSelector(value: T): SubscribableOrPromise<any> | null {
    try {
      return this.durationSelector(value);
    } catch (err) {
      this.destination.error(err);
      return null;
    }
  }

  private coalescingDone() {
    const { _coalesced, _trailing } = this;
    if (_coalesced) {
      _coalesced.unsubscribe();
    }
    this._coalesced = null;

    if (_trailing) {
      this.exhaustLastValue();
    }
  }

  notifyNext(outerValue: T, innerValue: R,
             outerIndex: number, innerIndex: number,
             innerSub: InnerSubscriber<T, R>): void {
    this.coalescingDone();
  }

  notifyComplete(): void {
    this.coalescingDone();
  }
}
