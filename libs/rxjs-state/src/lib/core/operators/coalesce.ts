import {
  MonoTypeOperatorFunction,
  Observable,
  Operator,
  SubscribableOrPromise,
  Subscriber,
  Subscription,
  TeardownLogic
} from 'rxjs';
import { first } from 'rxjs/operators';
import {CoalesceConfig} from '../utils';
import {OuterSubscriber, subscribeToResult, InnerSubscriber} from 'rxjs/internal-compatibility';
import {animationFrames} from '../projections';

export const defaultCoalesceConfig: CoalesceConfig = {
  leading: true,
  trailing: false
};

export const defaultCoalesceDurationSelector = <T>(value: T) => animationFrames();

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
 * @name coalesce
 */
export function coalesce<T>(
    durationSelector: (value: T) => SubscribableOrPromise<any> = defaultCoalesceDurationSelector,
    config: CoalesceConfig = defaultCoalesceConfig): MonoTypeOperatorFunction<T> {
  return (source: Observable<T>) => source.lift(new CoalesceOperator(durationSelector, !!config.leading, !!config.trailing));
}

class CoalesceOperator<T> implements Operator<T, T> {
  constructor(private durationSelector: (value: T) => SubscribableOrPromise<any>,
              private leading: boolean,
              private trailing: boolean) {
  }

  call(subscriber: Subscriber<T>, source: Observable<any>): TeardownLogic {
    return source.subscribe(
      new CoalesceSubscriber(subscriber, this.durationSelector, this.leading, this.trailing)
    );
  }
}

/**
 */
class CoalesceSubscriber<T> extends OuterSubscriber<T, T> {
  private _throttled: Subscription | null | undefined;
  private _nextValue: T | null = null;
  private _lastSentValue: T | null = null;
  private index: number = 0;

  constructor(protected destination: Subscriber<T>,
              private durationSelector: (value: T) => SubscribableOrPromise<number>,
              private _leading: boolean,
              private _trailing: boolean) {
    super(destination);
  }

  protected _next(value: T): void {
    this._nextValue = value;
    if (!this._throttled) {
      if (this._leading) {
        this.sendNextValue();
      }
      try {
        const index = this.index++;
        const duration$ = this.tryDurationSelector(value);
        this.throttle(duration$, value, index);
      } catch (error) {
        this.destination.error(error);
      }
    }
  }

  protected _complete(): void {
    const {_throttled} = this;
    if (!_throttled || _throttled.closed) {
      this.sendNextValue();
      super._complete();
    }
    this.unsubscribe();
  }

  notifyNext(outerValue: T, innerValue: T,
             outerIndex: number, innerIndex: number,
             innerSub: InnerSubscriber<T, T>): void {
    if (this._trailing) {
      this.sendNextValue();
    }
  }

  notifyComplete(innerSub: Subscription): void {
    const destination = this.destination as Subscription;
    destination.remove(innerSub);
    this._throttled = null;
    if (this.isStopped) {
      super._complete();
    }
  }

  private sendNextValue(): void {
    if (this._lastSentValue !== this._nextValue) {
      this.destination.next(this._lastSentValue = this._nextValue);
    }
  }

  private throttle(duration$: SubscribableOrPromise<any>, value: T, index: number): void {
    const innerSubscription = this._throttled;
    if (innerSubscription) {
      innerSubscription.unsubscribe();
    }
    const innerSubscriber = new InnerSubscriber(this, value, index);
    const destination = this.destination as Subscription;
    destination.add(innerSubscriber);
    this._throttled = subscribeToResult(this, (duration$ as Observable<any>).pipe(first()), undefined, undefined, innerSubscriber);
    // The returned subscription will usually be the subscriber that was
    // passed. However, interop subscribers will be wrapped and for
    // unsubscriptions to chain correctly, the wrapper needs to be added, too.
    if (this._throttled !== innerSubscriber) {
      destination.add(this._throttled);
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
}
