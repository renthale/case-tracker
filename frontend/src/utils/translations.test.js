import { ar, en } from './translations';

describe('translations', () => {
  const flatten = (obj, prefix = '') =>
    Object.keys(obj).reduce((acc, key) => {
      const fullKey = prefix ? `${prefix}.${key}` : key;
      if (typeof obj[key] === 'object' && obj[key] !== null) {
        Object.assign(acc, flatten(obj[key], fullKey));
      } else {
        acc[fullKey] = obj[key];
      }
      return acc;
    }, {});

  it('portal translations exist and have matching keys in both languages', () => {
    const arPortal = flatten(ar.portal || {});
    const enPortal = flatten(en.portal || {});

    const arKeys = Object.keys(arPortal);
    const enKeys = Object.keys(enPortal);

    expect(arKeys.length).toBeGreaterThan(0);
    expect(enKeys.length).toBeGreaterThan(0);
    expect(arKeys.sort()).toEqual(enKeys.sort());
  });

  it('portal translations have no empty values', () => {
    const arPortal = flatten(ar.portal || {});
    const enPortal = flatten(en.portal || {});

    Object.values(arPortal).forEach((v) => {
      expect(String(v).trim().length).toBeGreaterThan(0);
    });
    Object.values(enPortal).forEach((v) => {
      expect(String(v).trim().length).toBeGreaterThan(0);
    });
  });

  it('main translation objects are complete objects', () => {
    expect(typeof ar).toBe('object');
    expect(typeof en).toBe('object');
    expect(ar.login).toBeTruthy();
    expect(en.login).toBeTruthy();
  });
});
