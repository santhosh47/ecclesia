import 'dart:convert';
import 'dart:io';

import '../models/event.dart';
import '../models/member.dart';

/// Cache storage strategy supporting in-memory and local disk persistence.
class OfflineCacheService {
  OfflineCacheService({Directory? storageDir}) : _storageDir = storageDir;

  final Directory? _storageDir;

  List<Member>? _membersMemoryCache;
  DateTime? _membersLastCachedAt;

  List<ChurchEvent>? _eventsMemoryCache;
  DateTime? _eventsLastCachedAt;

  DateTime? get membersLastCachedAt => _membersLastCachedAt;
  DateTime? get eventsLastCachedAt => _eventsLastCachedAt;

  bool get hasCachedMembers =>
      _membersMemoryCache != null && _membersMemoryCache!.isNotEmpty;
  bool get hasCachedEvents =>
      _eventsMemoryCache != null && _eventsMemoryCache!.isNotEmpty;

  File? _getFile(String filename) {
    if (_storageDir == null) return null;
    return File('${_storageDir.path}/$filename');
  }

  /// Store members in memory and on disk.
  Future<void> saveMembers(List<Member> members) async {
    _membersMemoryCache = List.unmodifiable(members);
    _membersLastCachedAt = DateTime.now();

    final file = _getFile('cached_members.json');
    if (file != null) {
      try {
        final jsonStr = jsonEncode(members.map((m) => m.toJson()).toList());
        await file.writeAsString(jsonStr);
      } catch (_) {
        // Disk persistence is best-effort
      }
    }
  }

  /// Retrieve cached members if not expired.
  Future<List<Member>?> getCachedMembers({
    Duration maxAge = const Duration(hours: 24),
  }) async {
    if (_membersMemoryCache != null && _membersLastCachedAt != null) {
      if (DateTime.now().difference(_membersLastCachedAt!) <= maxAge) {
        return _membersMemoryCache;
      }
    }

    final file = _getFile('cached_members.json');
    if (file != null && await file.exists()) {
      try {
        final modified = await file.lastModified();
        if (DateTime.now().difference(modified) <= maxAge) {
          final content = await file.readAsString();
          final data = jsonDecode(content) as List<dynamic>;
          final members = data
              .map((item) => Member.fromJson(item as Map<String, dynamic>))
              .toList();
          _membersMemoryCache = List.unmodifiable(members);
          _membersLastCachedAt = modified;
          return members;
        }
      } catch (_) {
        // Disk read failed, fallback to memory
      }
    }

    return _membersMemoryCache;
  }

  /// Store events in memory and on disk.
  Future<void> saveEvents(List<ChurchEvent> events) async {
    _eventsMemoryCache = List.unmodifiable(events);
    _eventsLastCachedAt = DateTime.now();

    final file = _getFile('cached_events.json');
    if (file != null) {
      try {
        final jsonStr = jsonEncode(events.map((e) => e.toJson()).toList());
        await file.writeAsString(jsonStr);
      } catch (_) {
        // Disk persistence is best-effort
      }
    }
  }

  /// Retrieve cached events if not expired.
  Future<List<ChurchEvent>?> getCachedEvents({
    Duration maxAge = const Duration(hours: 24),
  }) async {
    if (_eventsMemoryCache != null && _eventsLastCachedAt != null) {
      if (DateTime.now().difference(_eventsLastCachedAt!) <= maxAge) {
        return _eventsMemoryCache;
      }
    }

    final file = _getFile('cached_events.json');
    if (file != null && await file.exists()) {
      try {
        final modified = await file.lastModified();
        if (DateTime.now().difference(modified) <= maxAge) {
          final content = await file.readAsString();
          final data = jsonDecode(content) as List<dynamic>;
          final events = data
              .map((item) => ChurchEvent.fromJson(item as Map<String, dynamic>))
              .toList();
          _eventsMemoryCache = List.unmodifiable(events);
          _eventsLastCachedAt = modified;
          return events;
        }
      } catch (_) {
        // Disk read failed, fallback to memory
      }
    }

    return _eventsMemoryCache;
  }

  /// Clear all cached data.
  Future<void> clear() async {
    _membersMemoryCache = null;
    _membersLastCachedAt = null;
    _eventsMemoryCache = null;
    _eventsLastCachedAt = null;

    final membersFile = _getFile('cached_members.json');
    if (membersFile != null && await membersFile.exists()) {
      try {
        await membersFile.delete();
      } catch (_) {}
    }

    final eventsFile = _getFile('cached_events.json');
    if (eventsFile != null && await eventsFile.exists()) {
      try {
        await eventsFile.delete();
      } catch (_) {}
    }
  }
}
