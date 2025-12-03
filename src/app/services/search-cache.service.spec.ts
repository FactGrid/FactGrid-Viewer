import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';

import { SearchCacheService } from './search-cache.service';

describe('SearchCacheService', () => {
  let service: SearchCacheService;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [HttpClientTestingModule] });
    service = TestBed.inject(SearchCacheService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should set and get generic cached items', () => {
    service.setItem('foo::1::subj', { list: [1, 2, 3], title: 't' });
    const v = service.getItem('foo::1::subj');
    expect(v).toBeTruthy();
    expect(v.list.length).toBe(3);
  });

  it('should get by prefix when exact key not provided', () => {
    service.setItem('bar::0::x', { list: [9, 8] });
    const got = service.getItemByPrefix('bar::0::');
    expect(got).toBeTruthy();
    expect(got.list[0]).toBe(9);
  });

  it('should prune expired entries (TTL)', (done) => {
    service.setItem('ttl::1::a', { list: [1] }, 10); // 10ms TTL
    expect(service.getItem('ttl::1::a')).toBeTruthy();
    setTimeout(() => {
      expect(service.getItem('ttl::1::a')).toBeNull();
      done();
    }, 30);
  });

  it('should evict oldest when surpassing maxEntries', () => {
    // use small maxEntries to test eviction
    service.setItem('ev::1::a', { val: 1 }, undefined, 2);
    service.setItem('ev::1::b', { val: 2 }, undefined, 2);
    service.setItem('ev::1::c', { val: 3 }, undefined, 2);
    const a = service.getItem('ev::1::a');
    const b = service.getItem('ev::1::b');
    const c = service.getItem('ev::1::c');
    // oldest (a) should have been evicted
    expect(a).toBeNull();
    expect(b).toBeTruthy();
    expect(c).toBeTruthy();
  });
});
