import {animationFrames, CoalesceConfig} from '@rx-state/rxjs-state';
import {TestScheduler} from 'rxjs/internal/testing/TestScheduler';
import {mapTo, mergeMap, mergeMapTo} from 'rxjs/operators';
import {concat, of, timer} from 'rxjs';
import {coalesce} from './coalesce';
import {observableMatcher} from '../../../../spec/observableMatcher';

/** @test {coalesce} */
describe('coalesce operator', () => {
  let testScheduler: TestScheduler;
  let coalesceConfig: CoalesceConfig;

  beforeEach(() => {
    testScheduler = new TestScheduler(observableMatcher);
  });

  describe('tested against all tests from throttle', () => {

    it('should raise error when promise rejects', () => {
      const e1 = concat(of(1),
        timer(10).pipe(mapTo(2)),
        timer(10).pipe(mapTo(3)),
        timer(50).pipe(mapTo(4))
      );
      const expected = [1, 2, 3];
      const error = new Error('error');

      e1.pipe(coalesce((x: number) => {
        if (x === 3) {
          return new Promise((resolve: any, reject: any) => {
            reject(error);
          });
        } else {
          return new Promise((resolve: any) => {
            resolve(42);
          });
        }
      })).subscribe(
        (x: number) => {
          expect(x).toEqual(expected.shift());
        },
        (err: any) => {
          expect(err).toBe('error');
          expect(expected.length).toEqual(0);
        },
        () => {
          throw new Error('should not be called');
        }
      );
    });
    it('should coalesce by promise resolves', () => {
      testScheduler.run(() => {
        const e1 = concat(of(1),
          timer(10).pipe(mapTo(2)),
          timer(10).pipe(mapTo(3)),
          timer(50).pipe(mapTo(4))
        );
        const expected = [1, 2, 3, 4];

        e1.pipe(coalesce(() => {
          return new Promise((resolve: any) => {
            resolve(42);
          });
        })).subscribe(
          (x: number) => {
            expect(x).toEqual(expected.shift());
          },
          () => {
            throw new Error('should not be called');
          },
          () => {
            expect(expected.length).toEqual(0);
          }
        );
      });
    });
    it('should handle a throw source', () => {
      testScheduler.run(({cold, expectObservable, expectSubscriptions}) => {
        const e1 = cold('#     ');
        const subs = '(^!)  ';
        const expected = '#     ';

        function durationSelector() {
          return cold('-----|');
        }

        expectObservable(e1.pipe(coalesce(durationSelector))).toBe(expected);
        expectSubscriptions(e1.subscriptions).toBe(subs);
      });
    });
    it('should handle a never source', () => {
      testScheduler.run(({cold, expectObservable, expectSubscriptions}) => {
        const e1 = cold('-     ');
        const subs = '^     ';
        const expected = '-     ';

        function durationSelector() {
          return cold('-----|');
        }

        expectObservable(e1.pipe(coalesce(durationSelector))).toBe(expected);
        expectSubscriptions(e1.subscriptions).toBe(subs);
      });
    });
    it('should handle an empty source', () => {
      testScheduler.run(({cold, expectObservable, expectSubscriptions}) => {
        const e1 = cold('|     ');
        const subs = '(^!)  ';
        const expected = '|     ';

        function durationSelector() {
          return cold('-----|');
        }

        expectObservable(e1.pipe(coalesce(durationSelector))).toBe(expected);
        expectSubscriptions(e1.subscriptions).toBe(subs);
      });
    });
    it('should raise error when source does not emit and raises error', () => {
      testScheduler.run(({cold, hot, expectObservable, expectSubscriptions}) => {
        const e1 = hot('-----#');
        const subs = '^----!';
        const expected = '-----#';

        function durationSelector() {
          return cold('-----|');
        }

        expectObservable(e1.pipe(coalesce(durationSelector))).toBe(expected);
        expectSubscriptions(e1.subscriptions).toBe(subs);
      });
    });
    it('should complete when source does not emit', () => {
      testScheduler.run(({cold, hot, expectObservable, expectSubscriptions}) => {
        const e1 = hot('-----|');
        const subs = '^----!';
        const expected = '-----|';

        function durationSelector() {
          return cold('-----|');
        }

        expectObservable(e1.pipe(coalesce(durationSelector))).toBe(expected);
        expectSubscriptions(e1.subscriptions).toBe(subs);
      });
    });
    it('should propagate error thrown from durationSelector function', () => {
      testScheduler.run(({cold, hot, expectObservable, expectSubscriptions}) => {
        const s1 = hot('--^--x--x--x--x--x--x--e--x--x--x--|');
        const s1Subs = '^--------------------!              ';
        const n1 = cold('----|                               ');
        const n1Subs = ['---^---!                            ',
          '---------^---!                      ',
          '---------------^---!                '];
        const exp = '---x-----x-----x-----(e#)           ';

        let i = 0;
        const result = s1.pipe(coalesce(() => {
          if (i++ === 3) {
            throw new Error('lol');
          }
          return n1;
        }, {leading: true, trailing: false}));
        expectObservable(result).toBe(exp, undefined, new Error('lol'));
        expectSubscriptions(s1.subscriptions).toBe(s1Subs);
        expectSubscriptions(n1.subscriptions).toBe(n1Subs);
      });
    });
    it('should propagate error from duration Observable', () => {
      testScheduler.run(({cold, hot, expectObservable, expectSubscriptions}) => {
        const e1 = hot('abcdefabcdabcdefghabca|   ');
        const e1subs = '^----------------!        ';
        const e2 = [cold('-----|                    '),
          cold('      ---|                '),
          cold('          -------#        ')];
        const e2subs = ['^----!                    ',
          '------^--!                ',
          '----------^------!        '];
        const expected = 'a-----a---a------#        ';

        let i = 0;
        const result = e1.pipe(coalesce(() => e2[i++], {leading: true, trailing: false}));

        expectObservable(result).toBe(expected);
        expectSubscriptions(e1.subscriptions).toBe(e1subs);
        for (let j = 0; j < e2.length; j++) {
          expectSubscriptions(e2[j].subscriptions).toBe(e2subs[j]);
        }
      });
    });
    it('should coalesce using durations of constying lengths', () => {
      testScheduler.run(({cold, hot, expectObservable, expectSubscriptions}) => {
        const e1 = hot('abcdefabcdabcdefghabca|   ');
        const e1subs = '^---------------------!   ';
        const e2 = [cold('-----|                    '),
          cold('      ---|                '),
          cold('          -------|        '),
          cold('                  --|     '),
          cold('                     ----|')];
        const e2subs = ['^----!                    ',
          '------^--!                ',
          '----------^------!        ',
          '------------------^-!     ',
          '---------------------^!   '];
        const expected = 'a-----a---a-------a--a|   ';

        let i = 0;
        const result = e1.pipe(coalesce(() => e2[i++], {leading: true, trailing: false}));

        expectObservable(result).toBe(expected);
        expectSubscriptions(e1.subscriptions).toBe(e1subs);
        for (let j = 0; j < e2.length; j++) {
          expectSubscriptions(e2[j].subscriptions).toBe(e2subs[j]);
        }
      });
    });
    it('should raise error as soon as just-throw duration is used', () => {
      testScheduler.run(({cold, hot, expectObservable, expectSubscriptions}) => {
        const e1 = hot('----abcdefabcdefabcdefabcdefa|');
        const e1subs = '^---!-------------------------';
        const e2 = cold('#                             ');
        const e2subs = '----(^!)                      ';
        const expected = '----(a#)                      ';

        const result = e1.pipe(coalesce(() => e2, {leading: true, trailing: false}));

        expectObservable(result).toBe(expected);
        expectSubscriptions(e1.subscriptions).toBe(e1subs);
        expectSubscriptions(e2.subscriptions).toBe(e2subs);
      });
    });
    it('should unsubscribe duration Observable when source raise error', () => {
      testScheduler.run(({cold, hot, expectObservable, expectSubscriptions}) => {
        const e1 = hot('----abcdefabcdefabcdefabcdefa#');
        const e1subs = '^----------------------------!';
        const e2 = cold('-                             ');
        const e2subs = '----^------------------------!';
        const expected = '----a------------------------#';

        const result = e1.pipe(coalesce(() => e2, {leading: true, trailing: false}));

        expectObservable(result).toBe(expected);
        expectSubscriptions(e1.subscriptions).toBe(e1subs);
        expectSubscriptions(e2.subscriptions).toBe(e2subs);
      });
    });
    it('should mirror source if durations are always empty', () => {
      testScheduler.run(({cold, hot, expectObservable, expectSubscriptions}) => {
        const e1 = hot('abcdefabcdefabcdefabcdefa|');
        const e1subs = '^------------------------!';
        const e2 = cold('|                         ');
        const expected = 'abcdefabcdefabcdefabcdefa|';

        const result = e1.pipe(coalesce(() => e2, {leading: true, trailing: false}));

        expectObservable(result).toBe(expected);
        expectSubscriptions(e1.subscriptions).toBe(e1subs);
      });
    });
    it('should coalesce with duration Observable using next to close the duration', () => {
      testScheduler.run(({cold, hot, expectObservable, expectSubscriptions}) => {
        const e1 = hot('^a-xy-----b--x--cxxx-|');
        const e1subs = '^--------------------!';
        const e2 = cold('----x-y-z            ');
        const e2subs = ['-^---!                ',
          '----------^---!       ',
          '----------------^---! '];
        const expected = '-a--------b-----c----|';

        const result = e1.pipe(coalesce(() => e2, {leading: true, trailing: false}));

        expectObservable(result).toBe(expected);
        expectSubscriptions(e1.subscriptions).toBe(e1subs);
        expectSubscriptions(e2.subscriptions).toBe(e2subs);
      });
    });
    it('should interrupt source and duration when result is unsubscribed early', () => {
      testScheduler.run(({cold, hot, expectObservable, expectSubscriptions}) => {
        const e1 = hot('-a-x-y-z-xyz-x-y-z----b--x-x-|');
        const unsub = '--------------!               ';
        const e1subs = '^-------------!               ';
        const e2 = cold(' ---------------------|       ');
        const e2subs = '-^------------!               ';
        const expected = '-a-------------               ';

        const result = e1.pipe(coalesce(() => e2, {leading: true, trailing: false}));

        expectObservable(result, unsub).toBe(expected);
        expectSubscriptions(e1.subscriptions).toBe(e1subs);
        expectSubscriptions(e2.subscriptions).toBe(e2subs);
      });
    });
    it('should not break unsubscription chains when result is unsubscribed explicitly', () => {
      testScheduler.run(({cold, hot, expectObservable, expectSubscriptions}) => {
        const e1 = hot('-a-x-y-z-xyz-x-y-z----b--x-x-|');
        const e1subs = '^-------------!               ';
        const e2 = cold('------------------|           ');
        const e2subs = '-^------------!               ';
        const expected = '-a-------------               ';
        const unsub = '--------------!               ';

        const result = e1.pipe(
          mergeMap((x: string) => of(x)),
          coalesce(() => e2, {leading: true, trailing: false}),
          mergeMap((x: string) => of(x))
        );

        expectObservable(result, unsub).toBe(expected);
        expectSubscriptions(e1.subscriptions).toBe(e1subs);
        expectSubscriptions(e2.subscriptions).toBe(e2subs);
      });
    });
    it('should handle a busy producer emitting a regular repeating sequence', () => {
      testScheduler.run(({cold, hot, expectObservable, expectSubscriptions}) => {
        const e1 = hot('abcdefabcdefabcdefabcdefa|');
        const e1subs = '^------------------------!';
        const e2 = cold('-----|                    ');
        const e2subs = ['^----!                    ',
          '------^----!              ',
          '------------^----!        ',
          '------------------^----!  ',
          '------------------------^!'];
        const expected = 'a-----a-----a-----a-----a|';

        const result = e1.pipe(coalesce(() => e2, {leading: true, trailing: false}));

        expectObservable(result).toBe(expected);
        expectSubscriptions(e1.subscriptions).toBe(e1subs);
        expectSubscriptions(e2.subscriptions).toBe(e2subs);
      });
    });

    describe('coalesce(fn, { leading: true, trailing: false })', () => {
      beforeEach(() => {
        coalesceConfig = {
          leading: true,
          trailing: false
        };
      });

      it('should have the right config', () => {
        expect(coalesceConfig.leading).toBe(true);
        expect(coalesceConfig.trailing).toBe(false);
      });

      it('should simply mirror the source if values are not emitted often enough', () => {
        testScheduler.run(({cold, hot, expectObservable, expectSubscriptions}) => {
          const e1 = hot('^a--------b-----c----|');
          const e1subs = '^--------------------!';
          const e2 = cold('----|                 ');
          const e2subs = ['-^---!                ',
            '----------^---!       ',
            '----------------^---! '];
          const expected = '-a--------b-----c----|';

          const result = e1.pipe(coalesce(() => e2, coalesceConfig));

          expectObservable(result).toBe(expected);
          expectSubscriptions(e1.subscriptions).toBe(e1subs);
          expectSubscriptions(e2.subscriptions).toBe(e2subs);
        });
      });

      it('should take only the first value emitted if duration is a never', () => {
        testScheduler.run(({cold, hot, expectObservable, expectSubscriptions}) => {
          const e1 = hot('----abcdefabcdefabcdefabcdefa|');
          const e1subs = '^----------------------------!';
          const e2 = cold('-                             ');
          const e2subs = '----^------------------------!';
          const expected = '----a------------------------|';

          const result = e1.pipe(coalesce(() => e2, coalesceConfig));

          expectObservable(result).toBe(expected);
          expectSubscriptions(e1.subscriptions).toBe(e1subs);
          expectSubscriptions(e2.subscriptions).toBe(e2subs);
        });
      });

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

      it('should work for individual values', () => {
        testScheduler.run(({cold, hot, expectObservable, expectSubscriptions}) => {
          const s1 = hot('-^-x------------------|     ');
          const s1Subs = ' ^--------------------!     ';
          const n1 = cold('   ------------------------|');
          const n1Subs = ['--^------------------!      '];
          const exp = '--x------------------|      ';

          const result = s1.pipe(coalesce(() => n1, coalesceConfig));
          expectObservable(result).toBe(exp);
          expectSubscriptions(s1.subscriptions).toBe(s1Subs);
          expectSubscriptions(n1.subscriptions).toBe(n1Subs);
        });
      });
    });

    describe('coalesce(fn, { leading: false, trailing: true })', () => {

      beforeEach(() => {
        coalesceConfig = {
          leading: false,
          trailing: true
        };
      });

      it('should have the right config', () => {
        expect(coalesceConfig.leading).toBe(false);
        expect(coalesceConfig.trailing).toBe(true);
      });

      it('should work for individual values', () => {
        testScheduler.run(({cold, hot, expectObservable, expectSubscriptions}) => {
          const s1 = hot('-x------------------|     ');
          const s1Subs = '^-------------------!     ';
          const n1 = cold(' -------|                 ');
          const n1Subs = '-^------!                 ';
          const exp = '--------x-----------|     ';

          const result = s1.pipe(coalesce(() => n1, coalesceConfig));
          expectObservable(result).toBe(exp);
          expectSubscriptions(s1.subscriptions).toBe(s1Subs);
          expectSubscriptions(n1.subscriptions).toBe(n1Subs);
        });
      });
    });
  });

  describe('additional logic to make coalescing work', () => {
    let testScheduler: TestScheduler;
    let coalesceConfig: CoalesceConfig;

    beforeEach(() => {
      testScheduler = new TestScheduler(observableMatcher);
    });

    it('should emit last value if source completes before durationSelector', () => {
      testScheduler.run(({cold, expectObservable, expectSubscriptions}) => {
        const s1 = cold('---abcdef---|');
        const s1Subs =  '^-----------!';
        const n1 = cold('   ----------');
        const n1Subs = ['---^--------!'];
        const exp =     '------------(f|)';

        const result = s1.pipe(coalesce(() => n1));
        expectObservable(result).toBe(exp);
        expectSubscriptions(s1.subscriptions).toBe(s1Subs);
        expectSubscriptions(n1.subscriptions).toBe(n1Subs);
      });
    });

    describe('with default config', () => {

      it('should emit last for async values when durationSelector is EMPTY', () => {
        testScheduler.run(({cold, expectObservable, expectSubscriptions}) => {
          const s1 = cold('---abcdef---|');
          const s1Subs = '^-----------!';
          const n1 = cold('   -----|    ');
          const n1Subs = ['---^----!    '];
          const exp = '--------f---|';

          const result = s1.pipe(coalesce(() => n1, coalesceConfig));
          expectObservable(result).toBe(exp);
          expectSubscriptions(s1.subscriptions).toBe(s1Subs);
          expectSubscriptions(n1.subscriptions).toBe(n1Subs);
        });
      });

      it('should emit last delayed for sync values when durationSelector is longer', () => {
        testScheduler.run(({cold, expectObservable, expectSubscriptions}) => {
          const s1 = cold('--(abcdef)--|');
          const s1Subs = '^-----------!';
          const n1 = cold('  --------|  ');
          const n1Subs = ['--^-------!  '];
          const exp = '----------f-|';

          const result = s1.pipe(coalesce(() => n1, coalesceConfig));
          expectObservable(result).toBe(exp);
          expectSubscriptions(s1.subscriptions).toBe(s1Subs);
          expectSubscriptions(n1.subscriptions).toBe(n1Subs);
        });
      });

      it('should emit last for sync values when durationSelector is EMPTY', () => {
        testScheduler.run(({cold, expectObservable, expectSubscriptions}) => {
          const s1 = cold('(abcdef)|');
          const s1Subs = '^-------!';
          const n1 = cold('|        ');
          const n1Subs = ['(^!)     '];
          const exp = '(f)-----|';

          const result = s1.pipe(coalesce(() => n1, coalesceConfig));
          expectObservable(result).toBe(exp);
          expectSubscriptions(s1.subscriptions).toBe(s1Subs);
          expectSubscriptions(n1.subscriptions).toBe(n1Subs);
        });
      });

      it('should emit last for sync values when durationSelector is animationFrames', () => {
        testScheduler.run(({cold, expectObservable}) => {
          const durationSelector = () => animationFrames();
          const s1 = cold('(abcdef)|');
          const exp =     '--------(f|)';

          const result = s1.pipe(coalesce(durationSelector, coalesceConfig));
          expectObservable(result).toBe(exp);
        });
      });

      it('should emit last for multiple sync values when durationSelector is animationFrames', () => {
        const durationSelector = () => animationFrames();
        const e1 = concat(of(1, 2, 3),
          timer(10).pipe(mergeMapTo(of(4, 5, 6))),
          timer(10).pipe(mergeMapTo(of(7, 8, 9))),
          timer(50).pipe(mergeMapTo(of(10, 11, 12)))
        );
        const expected = [3, 6, 9, 12];
        e1.pipe(coalesce(durationSelector)).subscribe(
          (x: number) => {
            expect(x).toEqual(expected.shift()); },
          () =>  {
            throw new Error('should not be called');
          },
          () =>  {
            expect(expected.length).toEqual(0);
          }
        );
      });

    });

    describe('with config { leading: true, trailing: true })', () => {
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
        testScheduler.run(({cold, expectObservable, expectSubscriptions}) => {
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

      it('should emit first and last delayed for sync values when durationSelector is longer', () => {
        testScheduler.run(({cold, expectObservable, expectSubscriptions}) => {
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

      it('should emit first and last for sync values when durationSelector is EMPTY', () => {
        testScheduler.run(({cold, expectObservable, expectSubscriptions}) => {
          const s1 = cold('(abcdef)|');
          const s1Subs = '^-------!';
          const n1 = cold('|        ');
          const n1Subs = ['(^!)     '];
          const exp = '(af)----|';

          const result = s1.pipe(coalesce(() => n1, coalesceConfig));
          expectObservable(result).toBe(exp);
          expectSubscriptions(s1.subscriptions).toBe(s1Subs);
          expectSubscriptions(n1.subscriptions).toBe(n1Subs);
        });
      });

      it('should emit first and last for sync values when durationSelector is animationFrames', () => {
        testScheduler.run(({cold, expectObservable}) => {
          const durationSelector = () => animationFrames();
          const s1 = cold('(abcdef)|');
          const exp =     'a-------(f|)';

          const result = s1.pipe(coalesce(durationSelector, coalesceConfig));
          expectObservable(result).toBe(exp);
        });
      });

      it('should emit first and last for multiple sync values when durationSelector is animationFrames', () => {
        const durationSelector = () => animationFrames();
        const e1 = concat(of(1, 2, 3),
          timer(10).pipe(mergeMapTo(of(4, 5, 6))),
          timer(10).pipe(mergeMapTo(of(7, 8, 9))),
          timer(50).pipe(mergeMapTo(of(10, 11, 12)))
        );
        const expected = [1, 3, 4, 6, 7, 9, 10, 12];
        e1.pipe(coalesce(durationSelector)).subscribe(
          (x: number) => {
            expect(x).toEqual(expected.shift()); },
          () =>  {
            throw new Error('should not be called');
          },
          () =>  {
            expect(expected.length).toEqual(0);
          }
        );
      });

    });

  });

});
