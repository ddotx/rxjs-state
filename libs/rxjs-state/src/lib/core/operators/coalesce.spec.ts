import { marbles } from 'rxjs-marbles/jest';
import { coalesce } from './coalesce';
import { EMPTY, NEVER } from 'rxjs';

// tslint:disable: no-duplicate-string
describe('coalesce', () => {
  it(
    'should mirror EMPTY',
    marbles(m => {
      const source = EMPTY;
      m.expect(source.pipe(coalesce())).toBeObservable('|');
    })
  );

  it(
    'should mirror NEVER',
    marbles(m => {
      const source = NEVER;
      m.expect(source.pipe(coalesce())).toBeObservable('');
    })
  );

  it(
    'should pass single values',
    marbles(m => {
      const source = m.cold('v|');
      m.expect(source.pipe(coalesce())).toBeObservable('v|');
    })
  );



  fdescribe('for leading config option', () => {

    fit(
      'should NOT pass the leading values if set to false',
      marbles(m => {
        const source = m.cold('abcde|');
        m.expect(source.pipe(coalesce({ leading: false }))).toBeObservable(
          '-----|'
        );
      })
    );

    it(
      'should NOT pass the leading values over time if set to false',
      marbles(m => {
        const source = m.cold('abcde----------abcde|');
        m.expect(source.pipe(coalesce({ leading: false }))).toBeObservable(
          '--------------------|'
        );
      })
    );

    it(
      'should pass the leading values if set to true',
      marbles(m => {
        const source = m.cold('abcde|');
        m.expect(source.pipe(coalesce({ leading: true }))).toBeObservable(
          'a----|'
        );
      })
    );

    it(
      'should pass the leading values over time if set to true',
      marbles(m => {
        const source = m.cold('abcde-----------abcde|');
        m.expect(source.pipe(coalesce({ leading: true }))).toBeObservable(
          'a--------------a----|'
        );
      })
    );
  });

  describe('for trailing config option', () => {
    it(
      'should pass the trailing values if set to true',
      marbles(m => {
        const source = m.cold('abcde|');
        m.expect(
          source.pipe(coalesce({ leading: false, trailing: true }))
        ).toBeObservable('----e|');
      })
    );

    it(
      'should NOT pass the trailing values if set to false',
      marbles(m => {
        const source = m.cold('abcde|');
        m.expect(
          source.pipe(coalesce({ leading: false, trailing: false }))
        ).toBeObservable('|');
      })
    );

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

  describe('for leading and trailing config option', () => {
    it(
      'should pass the leading and trailing values if set to true',
      marbles(m => {
        const source = m.cold('abcde|');
        m.expect(
          source.pipe(coalesce({ leading: false, trailing: false }))
        ).toBeObservable('v|');
      })
    );
    it(
      'should NOT pass leading and trailing values if set to false',
      marbles(m => {
        const source = m.cold('abcde|');
        m.expect(
          source.pipe(coalesce({ leading: false, trailing: false }))
        ).toBeObservable('v|');
      })
    );

    it(
      'should pass leading and trailing values over time',
      marbles(m => {
        const source = m.cold('abcde|');
        m.expect(
          source.pipe(coalesce({ leading: false, trailing: false }))
        ).toBeObservable('v|');
      })
    );
  });
  describe('default config', () => {
    it(
      'should pass only the trailing value of a series of sync emissions',
      marbles(m => {
        const source = m.cold('(abcde|)');
        m.expect(source.pipe(coalesce())).toBeObservable('(----e|)');
      })
    );

    it(
      'should pass only the trailing values over time',
      marbles(m => {
        const source = m.cold('(abcde)200ms()(abcde)|');
        m.expect(source.pipe(coalesce())).toBeObservable('----e200ms----e|');
      })
    );

    it(
      'should pass only one values per tick per subscription',
      marbles(m => {
        const source = m.cold('abcde|');
        m.expect(source.pipe(coalesce())).toBeObservable('---e|');
      })
    );

    it(
      'should pass only one values per tick per subscription',
      marbles(m => {
        const source = m.cold('abcde|');
        m.expect(source.pipe(coalesce())).toBeObservable('---e|');
      })
    );
  });

  describe('with scoping', () => {
    it(
      'subscription',
      marbles(m => {
        // @TODO
      })
    );

    it(
      'operator',
      marbles(m => {
        // @TODO
      })
    );

    it(
      'observable',
      marbles(m => {
        // @TODO
      })
    );

    it(
      'global',
      marbles(m => {
        // @TODO
      })
    );

    it(
      'random object',
      marbles(m => {
        // @TODO
      })
    );
  });

  describe('coalescing', () => {
    it(
      'leading',
      marbles(m => {
        // @TODO
      })
    );

    it(
      'training',
      marbles(m => {
        // @TODO
      })
    );

    it(
      'both',
      marbles(m => {
        // @TODO
      })
    );

    it(
      'sync',
      marbles(m => {
        // @TODO
      })
    );

    it(
      'promise',
      marbles(m => {
        // @TODO
      })
    );

    it(
      'timeout',
      marbles(m => {
        // @TODO
      })
    );

    it(
      'setInterval',
      marbles(m => {
        // @TODO
      })
    );

    it(
      'animationFrame',
      marbles(m => {
        // @TODO
      })
    );
  });
});
