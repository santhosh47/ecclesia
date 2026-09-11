import 'package:flutter_test/flutter_test.dart';
import 'package:ecclesia/services/push_notification_service.dart';

void main() {
  group('PushNotificationService Unit Tests', () {
    test('PastoralPushNotification serializes and deserializes correctly', () {
      final now = DateTime.now();
      final notification = PastoralPushNotification(
        id: 'notif_123',
        title: 'Consecutive Absence Alert',
        body: 'Sister Mary has missed 2 consecutive services.',
        targetRole: 'pastor',
        actionUrl: '/members?search=Mary',
        receivedAt: now,
      );

      final json = notification.toJson();
      expect(json['id'], 'notif_123');
      expect(json['title'], 'Consecutive Absence Alert');
      expect(json['is_read'], false);

      final reconstructed = PastoralPushNotification.fromJson(json);
      expect(reconstructed.id, 'notif_123');
      expect(reconstructed.title, 'Consecutive Absence Alert');
      expect(reconstructed.body, 'Sister Mary has missed 2 consecutive services.');
      expect(reconstructed.targetRole, 'pastor');
      expect(reconstructed.isRead, false);
    });

    test('Incoming push message triggers stream and updates inbox', () async {
      final service = PushNotificationService();
      expect(service.inbox, isEmpty);

      final receivedList = <PastoralPushNotification>[];
      final subscription = service.onNotification.listen((notif) {
        receivedList.add(notif);
      });

      service.handleIncomingMessage({
        'id': 'push_999',
        'title': 'Urgent Pastoral Need',
        'body': 'Brother John requested prayer and visitation.',
        'target_role': 'pastor',
      });

      await Future.delayed(const Duration(milliseconds: 10));

      expect(receivedList.length, 1);
      expect(receivedList.first.id, 'push_999');
      expect(receivedList.first.title, 'Urgent Pastoral Need');
      expect(service.inbox.length, 1);
      expect(service.inbox.first.isRead, false);

      service.markAllAsRead();
      expect(service.inbox.first.isRead, true);

      await subscription.cancel();
      service.dispose();
    });
  });
}
