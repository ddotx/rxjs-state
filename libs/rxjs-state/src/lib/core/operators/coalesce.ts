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
  leading: true,
  trailing: false
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
 * import { throttle } from 'rxjs/operators';
 *
 * const clicks = fromEvent(document, 'click');
 * const result = clicks.pipe(throttle(ev => interval(1000)));
 * result.subscribe(x => console.log(x));
 * ```
 *
 * @see {@link audit}
 * @see {@link debounce}
 * @see {@link delayWhen}
 * @see {@link sample}
 * @see {@link throttleTime}
 *
 * @param {function(value: T): SubscribableOrPromise} durationSelector A function
 * that receives a value from the source Observable, for computing the silencing
 * duration for each source value, returned as an Observable or a Promise.
 * @param {Object} config a configuration object to define `leading` and `trailing` behavior. Defaults
 * to `{ leading: true, trailing: false }`.
 * @return {Observable<T>} An Observable that performs the throttle operation to
 * limit the rate of emissions from the source.
 * @name throttle
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

/**
 */
class CoalesceSubscriber<T, R> extends OuterSubscriber<T, R> {
  private _throttled: Subscription | null | undefined;
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

    if (!this._throttled) {
      if (this._leading) {
        this.send();
      } else {
        this.throttle(value);
      }
    }
  }

  private send() {
    const {_hasValue, _sendValue} = this;
    if (_hasValue) {
      this.destination.next(_sendValue!);
      this.throttle(_sendValue!);
    }
    this._hasValue = false;
    this._sendValue = null;
  }

  private throttle(value: T): void {
    const duration = this.tryDurationSelector(value);
    if (!!duration) {
      this.add(this._throttled = subscribeToResult(this, duration));
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

  private throttlingDone() {
    const {_throttled, _trailing} = this;
    if (_throttled) {
      _throttled.unsubscribe();
    }
    this._throttled = null;

    if (_trailing) {
      this.send();
    }
  }

  notifyNext(outerValue: T, innerValue: R,
             outerIndex: number, innerIndex: number,
             innerSub: InnerSubscriber<T, R>): void {
    this.throttlingDone();
  }

  notifyComplete(): void {
    this.throttlingDone();
  }
}
