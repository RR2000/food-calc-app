import { textsFor } from '../i18n';

describe('texts', () => {
  it('Italian for Italian devices, English otherwise', () => {
    expect(textsFor('it-IT').today).toBe('Oggi');
    expect(textsFor('it').today).toBe('Oggi');
    expect(textsFor('en-GB').today).toBe('Today');
    expect(textsFor('de-DE').today).toBe('Today');
    expect(textsFor(undefined).today).toBe('Today');
  });

  it('the two languages have the same texts', () => {
    expect(Object.keys(textsFor('it')).sort()).toEqual(Object.keys(textsFor('en')).sort());
  });
});
