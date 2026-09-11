import 'dart:io';

import 'package:ecclesia/models/event.dart';
import 'package:ecclesia/models/member.dart';
import 'package:ecclesia/services/api_service.dart';
import 'package:ecclesia/services/cache_service.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart' as http;

class FailingHttpClient extends http.BaseClient {
  @override
  Future<http.StreamedResponse> send(http.BaseRequest request) {
    throw const SocketException('No internet connection');
  }
}

void main() {
  group('OfflineCacheService Unit Tests', () {
    late OfflineCacheService cacheService;

    setUp(() {
      cacheService = OfflineCacheService();
    });

    test('saves and retrieves members from cache', () async {
      final members = [
        const Member(id: 1, firstName: 'Grace', lastName: 'Hopper', status: 'Active'),
        const Member(id: 2, firstName: 'Alan', lastName: 'Turing', status: 'Active'),
      ];

      expect(cacheService.hasCachedMembers, isFalse);
      await cacheService.saveMembers(members);
      expect(cacheService.hasCachedMembers, isTrue);

      final cached = await cacheService.getCachedMembers();
      expect(cached, isNotNull);
      expect(cached!.length, equals(2));
      expect(cached.first.firstName, equals('Grace'));
      expect(cacheService.membersLastCachedAt, isNotNull);
    });

    test('saves and retrieves events from cache', () async {
      final events = [
        ChurchEvent(
          id: 1,
          title: 'Easter Sunday Vigil',
          startsAt: DateTime(2026, 4, 5, 6, 0),
          location: 'Main Sanctuary',
        ),
      ];

      expect(cacheService.hasCachedEvents, isFalse);
      await cacheService.saveEvents(events);
      expect(cacheService.hasCachedEvents, isTrue);

      final cached = await cacheService.getCachedEvents();
      expect(cached, isNotNull);
      expect(cached!.length, equals(1));
      expect(cached.first.title, equals('Easter Sunday Vigil'));
      expect(cacheService.eventsLastCachedAt, isNotNull);
    });

    test('clears cached members and events', () async {
      await cacheService.saveMembers([
        const Member(id: 10, firstName: 'John', lastName: 'Wesley'),
      ]);
      expect(cacheService.hasCachedMembers, isTrue);

      await cacheService.clear();
      expect(cacheService.hasCachedMembers, isFalse);
      final cached = await cacheService.getCachedMembers();
      expect(cached, isNull);
    });
  });

  group('ApiService Offline Fallback Tests', () {
    test('returns cached members when network is unreachable', () async {
      final cacheService = OfflineCacheService();
      final seededMembers = [
        const Member(id: 42, firstName: 'Timothy', lastName: 'Keller', status: 'Active'),
      ];
      await cacheService.saveMembers(seededMembers);

      final apiService = ApiService(
        client: FailingHttpClient(),
        cacheService: cacheService,
      );

      final members = await apiService.getMembers();
      expect(members.length, equals(1));
      expect(members.first.firstName, equals('Timothy'));
    });

    test('returns cached events when network is unreachable', () async {
      final cacheService = OfflineCacheService();
      final seededEvents = [
        ChurchEvent(
          id: 99,
          title: 'Pentecost Prayer Vigil',
          startsAt: DateTime(2026, 5, 24, 18, 0),
        ),
      ];
      await cacheService.saveEvents(seededEvents);

      final apiService = ApiService(
        client: FailingHttpClient(),
        cacheService: cacheService,
      );

      final events = await apiService.getEvents();
      expect(events.length, equals(1));
      expect(events.first.title, equals('Pentecost Prayer Vigil'));
    });

    test('throws ApiException when network fails and cache is empty', () async {
      final cacheService = OfflineCacheService();
      final apiService = ApiService(
        client: FailingHttpClient(),
        cacheService: cacheService,
      );

      expect(() => apiService.getMembers(), throwsA(isA<ApiException>()));
      expect(() => apiService.getEvents(), throwsA(isA<ApiException>()));
    });
  });
}
