import 'dart:convert';
import 'dart:io';

import 'package:http/http.dart' as http;

import '../core/config.dart';
import '../models/event.dart';
import '../models/member.dart';
import 'cache_service.dart';

/// Exception thrown when an API operation fails.
class ApiException implements Exception {
  const ApiException(this.message, [this.statusCode]);

  final String message;
  final int? statusCode;

  @override
  String toString() =>
      statusCode != null ? 'ApiException ($statusCode): $message' : 'ApiException: $message';
}

/// Service class orchestrating HTTP communications with the Ecclesia backend API with offline cache resilience.
class ApiService {
  ApiService({
    http.Client? client,
    String? baseUrl,
    OfflineCacheService? cacheService,
  })  : _client = client ?? http.Client(),
        _baseUrl = baseUrl ?? AppConfig.apiUrl,
        _cacheService = cacheService ?? OfflineCacheService();

  final http.Client _client;
  final String _baseUrl;
  final OfflineCacheService _cacheService;

  OfflineCacheService get cache => _cacheService;

  static const Map<String, String> _jsonHeaders = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  };

  /// Fetch all church members with offline cache fallback.
  Future<List<Member>> getMembers({bool forceRefresh = false}) async {
    if (!forceRefresh) {
      // If we already have fresh cached members, we can still try online or use cached
    }

    try {
      final response = await _client
          .get(Uri.parse('$_baseUrl/members'))
          .timeout(AppConfig.requestTimeout);

      if (response.statusCode != 200) {
        throw ApiException('Failed to load members', response.statusCode);
      }

      final data = jsonDecode(response.body) as List<dynamic>;
      final members = data
          .map((item) => Member.fromJson(item as Map<String, dynamic>))
          .toList();
      
      // Update cache in background
      await _cacheService.saveMembers(members);
      return members;
    } on SocketException catch (e) {
      final cached = await _cacheService.getCachedMembers();
      if (cached != null && cached.isNotEmpty) {
        return cached;
      }
      throw ApiException('Network unreachable: ${e.message}');
    } on http.ClientException catch (e) {
      final cached = await _cacheService.getCachedMembers();
      if (cached != null && cached.isNotEmpty) {
        return cached;
      }
      throw ApiException('Client error: ${e.message}');
    } catch (e) {
      final cached = await _cacheService.getCachedMembers();
      if (cached != null && cached.isNotEmpty) {
        return cached;
      }
      rethrow;
    }
  }

  /// Create a new church member record.
  Future<Member> createMember({
    required String firstName,
    required String lastName,
    String? email,
    String? phone,
  }) async {
    try {
      final response = await _client
          .post(
            Uri.parse('$_baseUrl/members'),
            headers: _jsonHeaders,
            body: jsonEncode({
              'first_name': firstName.trim(),
              'last_name': lastName.trim(),
              'email': email?.trim().isEmpty ?? true ? null : email!.trim(),
              'phone': phone?.trim().isEmpty ?? true ? null : phone!.trim(),
            }),
          )
          .timeout(AppConfig.requestTimeout);

      if (response.statusCode != 201) {
        throw ApiException('Failed to create member', response.statusCode);
      }

      final created = Member.fromJson(jsonDecode(response.body) as Map<String, dynamic>);
      return created;
    } on SocketException catch (e) {
      throw ApiException('Network unreachable: ${e.message}');
    }
  }

  /// Update an existing member record.
  Future<Member> updateMember({
    required int id,
    required String firstName,
    required String lastName,
    String? email,
    String? phone,
  }) async {
    try {
      final response = await _client
          .patch(
            Uri.parse('$_baseUrl/members/$id'),
            headers: _jsonHeaders,
            body: jsonEncode({
              'first_name': firstName.trim(),
              'last_name': lastName.trim(),
              'email': email?.trim().isEmpty ?? true ? null : email!.trim(),
              'phone': phone?.trim().isEmpty ?? true ? null : phone!.trim(),
            }),
          )
          .timeout(AppConfig.requestTimeout);

      if (response.statusCode != 200) {
        throw ApiException('Failed to update member', response.statusCode);
      }

      final updated = Member.fromJson(jsonDecode(response.body) as Map<String, dynamic>);
      return updated;
    } on SocketException catch (e) {
      throw ApiException('Network unreachable: ${e.message}');
    }
  }

  /// Delete a member record.
  Future<void> deleteMember(int id) async {
    try {
      final response = await _client
          .delete(Uri.parse('$_baseUrl/members/$id'))
          .timeout(AppConfig.requestTimeout);

      if (response.statusCode != 204 && response.statusCode != 200) {
        throw ApiException('Failed to delete member', response.statusCode);
      }
    } on SocketException catch (e) {
      throw ApiException('Network unreachable: ${e.message}');
    }
  }

  /// Fetch all church events with offline cache fallback.
  Future<List<ChurchEvent>> getEvents({bool forceRefresh = false}) async {
    try {
      final response = await _client
          .get(Uri.parse('$_baseUrl/events'))
          .timeout(AppConfig.requestTimeout);

      if (response.statusCode != 200) {
        throw ApiException('Failed to load events', response.statusCode);
      }

      final data = jsonDecode(response.body) as List<dynamic>;
      final events = data
          .map((item) => ChurchEvent.fromJson(item as Map<String, dynamic>))
          .toList();
      
      // Update cache
      await _cacheService.saveEvents(events);
      return events;
    } on SocketException catch (e) {
      final cached = await _cacheService.getCachedEvents();
      if (cached != null && cached.isNotEmpty) {
        return cached;
      }
      throw ApiException('Network unreachable: ${e.message}');
    } on http.ClientException catch (e) {
      final cached = await _cacheService.getCachedEvents();
      if (cached != null && cached.isNotEmpty) {
        return cached;
      }
      throw ApiException('Client error: ${e.message}');
    } catch (e) {
      final cached = await _cacheService.getCachedEvents();
      if (cached != null && cached.isNotEmpty) {
        return cached;
      }
      rethrow;
    }
  }

  /// Create a new church event.
  Future<ChurchEvent> createEvent({
    required String title,
    String? location,
    DateTime? startsAt,
  }) async {
    try {
      final eventTime = startsAt ?? DateTime.now();
      final response = await _client
          .post(
            Uri.parse('$_baseUrl/events'),
            headers: _jsonHeaders,
            body: jsonEncode({
              'title': title.trim(),
              'location': location?.trim().isEmpty ?? true ? null : location!.trim(),
              'starts_at': eventTime.toUtc().toIso8601String(),
            }),
          )
          .timeout(AppConfig.requestTimeout);

      if (response.statusCode != 201) {
        throw ApiException('Failed to create event', response.statusCode);
      }

      return ChurchEvent.fromJson(
          jsonDecode(response.body) as Map<String, dynamic>);
    } on SocketException catch (e) {
      throw ApiException('Network unreachable: ${e.message}');
    }
  }

  /// Retrieve links for Google Calendar, WebCal feed, and direct .ics download.
  Future<Map<String, dynamic>> getCalendarSubscriptionLinks() async {
    try {
      final response = await _client
          .get(Uri.parse('$_baseUrl/church-calendar/subscription-links'))
          .timeout(AppConfig.requestTimeout);
      if (response.statusCode != 200) {
        throw ApiException('Failed to load calendar subscription links', response.statusCode);
      }
      return jsonDecode(response.body) as Map<String, dynamic>;
    } catch (e) {
      return {
        'webcal_url': 'webcal://${Uri.parse(_baseUrl).authority}/api/v1/church-calendar/feed.ics',
        'google_calendar_url': 'https://calendar.google.com/calendar/r?cid=webcal://${Uri.parse(_baseUrl).authority}/api/v1/church-calendar/feed.ics',
        'ics_download_url': '$_baseUrl/church-calendar/export.ics',
        'church_name': 'Ecclesia Church',
      };
    }
  }

  /// Register mobile device push notification token.
  Future<bool> registerDeviceToken({
    required String token,
    String deviceType = 'android',
    String? authToken,
  }) async {
    try {
      final headers = Map<String, String>.from(_jsonHeaders);
      if (authToken != null) {
        headers['Authorization'] = 'Bearer $authToken';
      }
      final response = await _client
          .post(
            Uri.parse('$_baseUrl/notifications/push-subscribe'),
            headers: headers,
            body: jsonEncode({
              'endpoint': token,
              'device_type': deviceType,
            }),
          )
          .timeout(AppConfig.requestTimeout);
      return response.statusCode == 200;
    } catch (e) {
      return false;
    }
  }
}

