import {cold, expectObservable, expectSubscriptions, hot} from '../../../../spec/marble-helpers';
import {coalesce} from '@rx-state/rxjs-state';
import {concat, Observable, of, timer} from 'rxjs';
import {mapTo, mergeMap, throttle} from 'rxjs/operators';

import {marbles} from 'rxjs-marbles/jest';

declare const type: Function;

/** @test {coalesce} */
describe('coalesce operator', () => {
  describe('that mirrors the coalesce behaviour', () => {

    it('original-diagram+lib should simply mirror the source if values are not emitted often enough', marbles((m) => {
      const e1 = m.hot('-a--------b-----c----|');
      const e1subs = '^                    !';
      const e2 = m.cold('----|                ');
      const e2subs = [' ^   !                ',
        '          ^   !       ',
        '                ^   ! '];
      const expected = '-a--------b-----c----|';

      const result = e1.pipe(coalesce(() => e2));

      m.expect(result).toBeObservable(expected);
      m.expect(e1).toHaveSubscriptions(e1subs);
      m.expect(e2).toHaveSubscriptions(e2subs);
    }));
    it('original-diagram+lib+dash should simply mirror the source if values are not emitted often enough 2', marbles((m) => {
      const e1 = m.hot('-a--------b-----c----|');
      const e1subs =           '^--------------------!';
      const e2 = m.cold('----|----------------');
      const e2subs = [        '-^---!-----------------',
        '----------^---!-------',
        '----------------^---!-'];
      const expected = '-a--------b-----c----|';

      const result = e1.pipe(coalesce(() => e2));

      m.expect(result).toBeObservable(expected);
      m.expect(e1).toHaveSubscriptions(e1subs);
      m.expect(e2).toHaveSubscriptions(e2subs);
    }));
    it('original-minimal-adopted should simply mirror the source if values are not emitted often enough', () =>  {
      const e1 =   hot('-a--------b-----c----|');
      const e1subs =   '^                    !';
      const e2 =  cold( '----|                ');
      const e2subs =  [' ^   !                ',
        '          ^   !       ',
        '                ^   ! '];
      const expected = '-a--------b-----c----|';

      const result = ((e1 as unknown) as Observable<string>).pipe(coalesce(() =>  e2));

      expectObservable(result).toBe(expected);
      expectSubscriptions(e1.subscriptions).toBe(e1subs);
      expectSubscriptions(e2.subscriptions).toBe(e2subs);
    });
    it('original-dash-adopted should simply mirror the source if values are not emitted often enough', () =>  {
      const e1 = hot('-a--------b-----c----|');
      const e1subs =           '^--------------------!';
      const e2 = cold('----|----------------');
      const e2subs = [        '-^---!-----------------',
        '----------^---!-------',
        '----------------^---!-'];
      const expected = '-a--------b-----c----|';

      const result = ((e1 as unknown) as Observable<string>).pipe(coalesce(() =>  e2));

      expectObservable(result).toBe(expected);
      expectSubscriptions(e1.subscriptions).toBe(e1subs);
      expectSubscriptions(e2.subscriptions).toBe(e2subs);
    });

    /*
        it('should coalesce with duration Observable using next to close the duration', () => {
          const e1 = hot('-a-xy-----b--x--cxxx-|');
          const e1subs = '^                    !';
          const e2 = cold('----x-y-z            ');
          const e2subs = [' ^   !                ',
            '          ^   !       ',
            '                ^   ! '];
          const expected = '-a--------b-----c----|';

          const result = e1.pipe(coalesce(() => e2));

    it(
      'should pass the trailing values over time',
      marbles(m => {
        const source = m.cold('abcde|');
        m.expect(
          source.pipe(coalesce({ leading: false, trailing: true }))
        ).toBeObservable('v|');
      })
    );
  });

        it('should interrupt source and duration when result is unsubscribed early', () => {
          const e1 = hot('-a-x-y-z-xyz-x-y-z----b--x-x-|');
          const unsub = '              !               ';
          const e1subs = '^             !               ';
          const e2 = cold('------------------|          ');
          const e2subs = ' ^            !               ';
          const expected = '-a-------------               ';

          const result = e1.pipe(coalesce(() => e2));

          expectObservable(result, unsub).toBe(expected);
          expectSubscriptions(e1.subscriptions).toBe(e1subs);
          expectSubscriptions(e2.subscriptions).toBe(e2subs);
        });

        it('should not break unsubscription chains when result is unsubscribed explicitly', () => {
          const e1 = hot('-a-x-y-z-xyz-x-y-z----b--x-x-|');
          const e1subs = '^             !               ';
          const e2 = cold('------------------|          ');
          const e2subs = ' ^            !               ';
          const expected = '-a-------------               ';
          const unsub = '              !               ';

          const result = e1.pipe(
            mergeMap((x: string) => of(x)),
            coalesce(() => e2),
            mergeMap((x: string) => of(x))
          );

          expectObservable(result, unsub).toBe(expected);
          expectSubscriptions(e1.subscriptions).toBe(e1subs);
          expectSubscriptions(e2.subscriptions).toBe(e2subs);
        });

        it('should handle a busy producer emitting a regular repeating sequence', () => {
          const e1 = hot('abcdefabcdefabcdefabcdefa|');
          const e1subs = '^                        !';
          const e2 = cold('-----|                    ');
          const e2subs = ['^    !                    ',
            '      ^    !              ',
            '            ^    !        ',
            '                  ^    !  ',
            '                        ^!'];
          const expected = 'a-----a-----a-----a-----a|';

          const result = e1.pipe(coalesce(() => e2));

          expectObservable(result).toBe(expected);
          expectSubscriptions(e1.subscriptions).toBe(e1subs);
          expectSubscriptions(e2.subscriptions).toBe(e2subs);
        });

        it('should mirror source if durations are always empty', () => {
          const e1 = hot('abcdefabcdefabcdefabcdefa|');
          const e1subs = '^                        !';
          const e2 = cold('|');
          const expected = 'abcdefabcdefabcdefabcdefa|';

          const result = e1.pipe(coalesce(() => e2));

          expectObservable(result).toBe(expected);
          expectSubscriptions(e1.subscriptions).toBe(e1subs);
        });

        it('should take only the first value emitted if duration is a never', () => {
          const e1 = hot('----abcdefabcdefabcdefabcdefa|');
          const e1subs = '^                            !';
          const e2 = cold('-');
          const e2subs = '    ^                        !';
          const expected = '----a------------------------|';

          const result = e1.pipe(coalesce(() => e2));

          expectObservable(result).toBe(expected);
          expectSubscriptions(e1.subscriptions).toBe(e1subs);
          expectSubscriptions(e2.subscriptions).toBe(e2subs);
        });

        it('should unsubscribe duration Observable when source raise error', () => {
          const e1 = hot('----abcdefabcdefabcdefabcdefa#');
          const e1subs = '^                            !';
          const e2 = cold('-');
          const e2subs = '    ^                        !';
          const expected = '----a------------------------#';

          const result = e1.pipe(coalesce(() => e2));

          expectObservable(result).toBe(expected);
          expectSubscriptions(e1.subscriptions).toBe(e1subs);
          expectSubscriptions(e2.subscriptions).toBe(e2subs);
        });

        it('should raise error as soon as just-throw duration is used', () => {
          const e1 = hot('----abcdefabcdefabcdefabcdefa|');
          const e1subs = '^   !                         ';
          const e2 = cold('#');
          const e2subs = '    (^!)                      ';
          const expected = '----(a#)                      ';

          const result = e1.pipe(coalesce(() => e2));

          expectObservable(result).toBe(expected);
          expectSubscriptions(e1.subscriptions).toBe(e1subs);
          expectSubscriptions(e2.subscriptions).toBe(e2subs);
        });

        it('should coalesce using durations of constying lengths', () => {
          const e1 = hot('abcdefabcdabcdefghabca|   ');
          const e1subs = '^                     !   ';
          const e2 = [cold('-----|                    '),
            cold('---|                '),
            cold('-------|        '),
            cold('--|     '),
            cold('----|')];
          const e2subs = ['^    !                    ',
            '      ^  !                ',
            '          ^      !        ',
            '                  ^ !     ',
            '                     ^!   '];
          const expected = 'a-----a---a-------a--a|   ';

          let i = 0;
          const result = e1.pipe(coalesce(() => e2[i++]));

          expectObservable(result).toBe(expected);
          expectSubscriptions(e1.subscriptions).toBe(e1subs);
          for (let j = 0; j < e2.length; j++) {
            expectSubscriptions(e2[j].subscriptions).toBe(e2subs[j]);
          }
        });

        it('should propagate error from duration Observable', () => {
          const e1 = hot('abcdefabcdabcdefghabca|   ');
          const e1subs = '^                !        ';
          const e2 = [cold('-----|                    '),
            cold('---|                '),
            cold('-------#        ')];
          const e2subs = ['^    !                    ',
            '      ^  !                ',
            '          ^      !        '];
          const expected = 'a-----a---a------#        ';

          let i = 0;
          const result = e1.pipe(coalesce(() => e2[i++]));

          expectObservable(result).toBe(expected);
          expectSubscriptions(e1.subscriptions).toBe(e1subs);
          for (let j = 0; j < e2.length; j++) {
            expectSubscriptions(e2[j].subscriptions).toBe(e2subs[j]);
          }
        });

        it('should propagate error thrown from durationSelector function', () => {
          const s1 = hot('--^--x--x--x--x--x--x--e--x--x--x--|');
          const s1Subs = '^                    !';
          const n1 = cold('----|');
          const n1Subs = ['   ^   !                          ',
            '         ^   !                    ',
            '               ^   !              '];
          const exp = '---x-----x-----x-----(e#)';

          let i = 0;
          const result = s1.pipe(coalesce(() => {
            if (i++ === 3) {
              throw new Error('lol');
            }
            return n1;
          }));
          expectObservable(result).toBe(exp, undefined, new Error('lol'));
          expectSubscriptions(s1.subscriptions).toBe(s1Subs);
          expectSubscriptions(n1.subscriptions).toBe(n1Subs);
        });

        it('should complete when source does not emit', () => {
          const e1 = hot('-----|');
          const subs = '^    !';
          const expected = '-----|';

          function durationSelector() {
            return cold('-----|');
          }

          expectObservable(e1.pipe(coalesce(durationSelector))).toBe(expected);
          expectSubscriptions(e1.subscriptions).toBe(subs);
        });

        it('should raise error when source does not emit and raises error', () => {
          const e1 = hot('-----#');
          const subs = '^    !';
          const expected = '-----#';

          function durationSelector() {
            return cold('-----|');
          }

          expectObservable(e1.pipe(coalesce(durationSelector))).toBe(expected);
          expectSubscriptions(e1.subscriptions).toBe(subs);
        });

        it('should handle an empty source', () => {
          const e1 = cold('|');
          const subs = '(^!)';
          const expected = '|';

          function durationSelector() {
            return cold('-----|');
          }

          expectObservable(e1.pipe(coalesce(durationSelector))).toBe(expected);
          expectSubscriptions(e1.subscriptions).toBe(subs);
        });

        it('should handle a never source', () => {
          const e1 = cold('-');
          const subs = '^';
          const expected = '-';

          function durationSelector() {
            return cold('-----|');
          }

          expectObservable(e1.pipe(coalesce(durationSelector))).toBe(expected);
          expectSubscriptions(e1.subscriptions).toBe(subs);
        });

        it('should handle a throw source', () => {
          const e1 = cold('#');
          const subs = '(^!)';
          const expected = '#';

          function durationSelector() {
            return cold('-----|');
          }

          expectObservable(e1.pipe(coalesce(durationSelector))).toBe(expected);
          expectSubscriptions(e1.subscriptions).toBe(subs);
        });

        it('should coalesce by promise resolves', (done: MochaDone) => {
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
              expect(x).to.equal(expected.shift());
            },
            () => {
              done(new Error('should not be called'));
            },
            () => {
              expect(expected.length).to.equal(0);
              done();
            }
          );
        });

        it('should raise error when promise rejects', (done: MochaDone) => {
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
              expect(x).to.equal(expected.shift());
            },
            (err: any) => {
              expect(err).to.be.an('error', 'error');
              expect(expected.length).to.equal(0);
              done();
            },
            () => {
              done(new Error('should not be called'));
            }
          );
        });

        type('should support selectors of the same type', () => {
          let o: Observable<number>;
          let s: Observable<number>;
          let r: Observable<number> = o!.pipe(coalesce((n) => s));
        });

        type('should support selectors of a different type', () => {
          let o: Observable<number>;
          let s: Observable<string>;
          let r: Observable<number> = o!.pipe(coalesce((n) => s));
        });

        describe('coalesce(fn, { leading: true, trailing: true })', () => {
          it('should work for individual values', () => {
            const s1 = hot('-^-x------------------|');
            const s1Subs = '^                    !';
            const n1 = cold('------------------------|');
            const n1Subs = ['  ^                  !'];
            const exp = '--x------------------|';

            const result = s1.pipe(coalesce(() => n1, {leading: true, trailing: true}));
            expectObservable(result).toBe(exp);
            expectSubscriptions(s1.subscriptions).toBe(s1Subs);
            expectSubscriptions(n1.subscriptions).toBe(n1Subs);
          });
        });

        describe('coalesce(fn, { leading: false, trailing: true })', () => {

          it('should work for individual values', () => {
            const s1 = hot('-^-x------------------|');
            const s1Subs = '^                    !';
            const n1 = cold('------------------------|');
            const n1Subs = ['  ^                  !'];
            const exp = '--x------------------|';

            const result = s1.pipe(coalesce(() => n1, {leading: true, trailing: true}));
            expectObservable(result).toBe(exp);
            expectSubscriptions(s1.subscriptions).toBe(s1Subs);
            expectSubscriptions(n1.subscriptions).toBe(n1Subs);
          });
        });

     */
  });
});
