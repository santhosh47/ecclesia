import 'dart:async';

import 'api_service.dart';

/// Data model representing a mobile push notification alert for pastors and church staff.
class PastoralPushNotification {
  const PastoralPushNotification({
    required this.id,
    required this.title,
    required this.body,
    this.targetRole = 'pastor',
    this.actionUrl,
    required this.receivedAt,
    this.isRead = false,
  });

  factory PastoralPushNotification.fromJson(Map<String, dynamic> json) {
    return PastoralPushNotification(
      id: json['id'] as String? ?? DateTime.now().millisecondsSinceEpoch.toString(),
      title: json['title'] as String? ?? 'Pastoral Alert',
      body: json['message'] as String? ?? json['body'] as String? ?? '',
      targetRole: json['target_role'] as String? ?? 'pastor',
      actionUrl: json['action_url'] as String?,
      receivedAt: json['received_at'] != null
          ? DateTime.parse(json['received_at'] as String)
          : DateTime.now(),
      isRead: json['is_read'] as bool? ?? false,
    );
  }

  final String id;
  final String title;
  final String body;
  final String targetRole;
  final String? actionUrl;
  final DateTime receivedAt;
  final bool isRead;

  Map<String, dynamic> toJson() => {
        'id': id,
        'title': title,
        'body': body,
        'target_role': targetRole,
        'action_url': actionUrl,
        'received_at': receivedAt.toIso8601String(),
        'is_read': isRead,
      };
}

/// Push notification service orchestrating device token registration and live notification streaming.
class PushNotificationService {
  PushNotificationService({
    ApiService? apiService,
  }) : _apiService = apiService ?? ApiService();

  final ApiService _apiService;
  final StreamController<PastoralPushNotification> _notificationController =
      StreamController<PastoralPushNotification>.broadcast();

  String? _deviceToken;
  bool _isRegistered = false;
  final List<PastoralPushNotification> _inbox = [];

  Stream<PastoralPushNotification> get onNotification =>
      _notificationController.stream;

  List<PastoralPushNotification> get inbox => List.unmodifiable(_inbox);

  String? get deviceToken => _deviceToken;

  bool get isRegistered => _isRegistered;

  /// Initialize device registration and register push token with the Ecclesia backend.
  Future<bool> initialize({String? mockToken, String? authToken}) async {
    _deviceToken = mockToken ?? 'fcm_device_token_${DateTime.now().millisecondsSinceEpoch}';
    final success = await _apiService.registerDeviceToken(
      token: _deviceToken!,
      deviceType: 'android',
      authToken: authToken,
    );
    _isRegistered = success;
    return success;
  }

  /// Dispatch an incoming push notification into the mobile app streams and local inbox.
  void handleIncomingMessage(Map<String, dynamic> payload) {
    final notification = PastoralPushNotification.fromJson(payload);
    _inbox.insert(0, notification);
    _notificationController.add(notification);
  }

  /// Mark all notifications in the local inbox as read.
  void markAllAsRead() {
    for (var i = 0; i < _inbox.length; i++) {
      final n = _inbox[i];
      if (!n.isRead) {
        _inbox[i] = PastoralPushNotification(
          id: n.id,
          title: n.title,
          body: n.body,
          targetRole: n.targetRole,
          actionUrl: n.actionUrl,
          receivedAt: n.receivedAt,
          isRead: true,
        );
      }
    }
  }

  void dispose() {
    _notificationController.close();
  }
}
