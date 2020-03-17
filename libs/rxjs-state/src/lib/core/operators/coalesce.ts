import {Observable, concat, EMPTY, OperatorFunction, MonoTypeOperatorFunction, defer} from 'rxjs';
import {publish, first,tap,filter, concat as concatWith, share,shareReplay, takeUntil,last, take,withLatestFrom, map, materialize, defaultIfEmpty, switchMap} from 'rxjs/operators';
import {CoalesceConfig, getCoalesceWorkConfig} from '../utils';


export function coalesce<T>(cfg?: CoalesceConfig): MonoTypeOperatorFunction<T> {
  return (o: Observable<T>): Observable<T> => {
    let isFirstEmitted = false;
    const preparedCfg: CoalesceConfig = getCoalesceWorkConfig(cfg);
    const inputComplete$ = o.pipe(materialize());
    const animationFrameFirstEmission$ = animationFrames().pipe(
      shareReplay(), 
      take(1)
      );
    const first$  = o.pipe(first(),defaultIfEmpty(), tap({complete: () => console.info('first$ Complete')}));
    const last$ = o.pipe(takeUntil(animationFrameFirstEmission$), last(), tap({complete: () => console.info('last$ Complete')}));
    return o.pipe(
      filter(() => {
        if (preparedCfg.leading) {
            if (isFirstEmitted) {
              return false;
            }
          isFirstEmitted = true;
          return true
        }
        return true;
      })
    );
  };
}

// @TODO delete when decide for rxjs target version
export interface TimestampProvider {
  now(): number;
}


export function animationFrames(timestampProvider: TimestampProvider = Date) {
  return timestampProvider === Date ? DEFAULT_ANIMATION_FRAMES : animationFramesFactory(timestampProvider);
}

/**
 * Does the work of creating the observable for `animationFrames`.
 * @param timestampProvider The timestamp provider to use to create the observable
 */
function animationFramesFactory(timestampProvider: TimestampProvider) {
  return new Observable<number>(subscriber => {
    let id: number;
    const start = timestampProvider.now();
    const run = () => {
      subscriber.next(timestampProvider.now() - start);
      if (!subscriber.closed) {
        id = requestAnimationFrame(run);
      }
    };
    id = requestAnimationFrame(run);
    return () => cancelAnimationFrame(id);
  });
}

/**
 * In the common case, where `Date` is passed to `animationFrames` as the default,
 * we use this shared observable to reduce overhead.
 */
const DEFAULT_ANIMATION_FRAMES = animationFramesFactory(Date);