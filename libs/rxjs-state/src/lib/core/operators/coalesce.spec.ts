import {TestScheduler} from 'rxjs/internal/testing/TestScheduler';
import {coalesce} from './coalesce.throttle-based';
import {observableMatcher} from '../../../../spec/observableMatcher';
import {animationFrames, CoalesceConfig} from '@rx-state/rxjs-state';
import {take} from 'rxjs/operators';
import {of} from 'rxjs';

/** @test {coalesce} */
describe('coalesce operator additional logic', () => {
  let testScheduler: TestScheduler;
  let coalesceConfig: CoalesceConfig;

  beforeEach(() => {
    testScheduler = new TestScheduler(observableMatcher);
  });

  describe('coalesce(fn, { leading: true, trailing: true })', () => {
    beforeEach(() => {
      coalesceConfig = {
        leading: true,
        trailing: true
      };
    });

    it('should have the right config', () => {
      expect(coalesceConfig.leading).toBe(true);
      expect(coalesceConfig.trailing).toBe(true);
    });

    it('should use right durationSelectors', () => {
      let sync;
      let microRes;
      let syncRes;
      const s1 = of(1);
      const s2 = animationFrames();
      expect(microRes).toBe(undefined);
      expect(sync).toBe(undefined);
      sync = 'test';
      s1.subscribe(n => syncRes = n);
      s2.subscribe(n => microRes = n);
      expect(sync).toBe('test');
      expect(syncRes).toBe(1);
      expect(microRes).toBe(undefined);
      setTimeout(() => {
        expect(microRes).not.toBe(undefined);
      })
    });

    it('should emit first and last for async values when durationSelector is EMPTY', () => {
      testScheduler.run(({ cold, expectObservable, expectSubscriptions }) => {
        const s1 = cold('---abcdef---|');
        const s1Subs = '^-----------!';
        const n1 = cold('   -----|    ');
        const n1Subs = ['---^----!    '];
        const exp = '---a----f---|';

        const result = s1.pipe(coalesce(() => n1, coalesceConfig));
        expectObservable(result).toBe(exp);
        expectSubscriptions(s1.subscriptions).toBe(s1Subs);
        expectSubscriptions(n1.subscriptions).toBe(n1Subs);
      });
    });

    it('should emit first and last for sync values when durationSelector is EMPTY', () => {
      testScheduler.run(({ cold, expectObservable, expectSubscriptions }) => {
        const s1 = cold('--(abcdef)--|');
        const s1Subs = '^-----------!';
        const n1 = cold('  |          ');
        const n1Subs = ['--(^!)       '];
        const exp = '--(af)------|';

        const result = s1.pipe(coalesce(() => n1, coalesceConfig));
        expectObservable(result).toBe(exp);
        expectSubscriptions(s1.subscriptions).toBe(s1Subs);
        expectSubscriptions(n1.subscriptions).toBe(n1Subs);
      });
    });

    it('should emit first and last delayed for sync values when durationSelector is longer', () => {
      testScheduler.run(({ cold, expectObservable, expectSubscriptions }) => {
        const s1 = cold('--(abcdef)--|');
        const s1Subs = '^-----------!';
        const n1 = cold('  --------|  ');
        const n1Subs = ['--^-------!  '];
        const exp = '--a-------f-|';

        const result = s1.pipe(coalesce(() => n1, coalesceConfig));
        expectObservable(result).toBe(exp);
        expectSubscriptions(s1.subscriptions).toBe(s1Subs);
        expectSubscriptions(n1.subscriptions).toBe(n1Subs);
      });
    });

    it('should emit first and last for sync values when durationSelector is animationFrames', () => {
      testScheduler.run(({ cold, expectObservable, expectSubscriptions }) => {
        const durationSelector = () => animationFrames().pipe(take(1));
        const s1 = cold('--(abcdef)--|');
        const s1Subs = '^-----------!';
        const exp = '--(af)------|';

        const result = s1.pipe(coalesce(durationSelector, coalesceConfig));
        expectObservable(result).toBe(exp);
      });


    });
  });
});
