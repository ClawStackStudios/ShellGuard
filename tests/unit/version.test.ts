import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { getAppVersion } from '../../src/server/utils/version.js';

describe('getAppVersion resolver', () => {
  it('returns the ground-truth version matching package.json', () => {
    const pkg = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'package.json'), 'utf8'));
    const ver = getAppVersion();
    expect(ver).toBe(pkg.version);
    expect(ver).toBe('0.0.1.8');
  });

  it('returns a valid semver string format', () => {
    const ver = getAppVersion();
    expect(ver).toMatch(/^\d+\.\d+\.\d+(\.\d+)?$/);
  });
});
