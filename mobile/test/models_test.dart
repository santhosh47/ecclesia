import 'package:flutter_test/flutter_test.dart';

import 'package:ecclesia/models/event.dart';
import 'package:ecclesia/models/member.dart';
import 'package:ecclesia/services/api_service.dart';

void main() {
  group('Member Model', () {
    test('serializes and deserializes correctly', () {
      final json = {
        'id': 101,
        'first_name': 'Grace',
        'last_name': 'Hopper',
        'email': 'grace@example.com',
        'phone': '+1 555-0199',
        'status': 'Active',
      };

      final member = Member.fromJson(json);
      expect(member.id, 101);
      expect(member.firstName, 'Grace');
      expect(member.lastName, 'Hopper');
      expect(member.fullName, 'Grace Hopper');
      expect(member.initials, 'GH');
      expect(member.email, 'grace@example.com');
      expect(member.phone, '+1 555-0199');
      expect(member.status, 'Active');

      final serialized = member.toJson();
      expect(serialized['first_name'], 'Grace');
      expect(serialized['last_name'], 'Hopper');
      expect(serialized['email'], 'grace@example.com');
    });

    test('copyWith updates specified fields', () {
      const original = Member(
        id: 1,
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
      );

      final updated = original.copyWith(firstName: 'Jonathan', phone: '+123456');
      expect(updated.id, 1);
      expect(updated.firstName, 'Jonathan');
      expect(updated.lastName, 'Doe');
      expect(updated.phone, '+123456');
      expect(updated.email, 'john@example.com');
    });

    test('initials handles empty strings safely', () {
      const member = Member(id: 2, firstName: '', lastName: 'Smith');
      expect(member.initials, 'S');
    });

    test('MemberUpdateResult constructors work as expected', () {
      const member = Member(id: 5, firstName: 'Test', lastName: 'User');
      const updateResult = MemberUpdateResult.updated(member);
      expect(updateResult.member, member);
      expect(updateResult.deletedId, isNull);

      const deleteResult = MemberUpdateResult.deleted(5);
      expect(deleteResult.member, isNull);
      expect(deleteResult.deletedId, 5);
    });
  });

  group('ChurchEvent Model', () {
    test('parses and formats dates properly', () {
      final json = {
        'id': 42,
        'title': 'Christmas Eve Service',
        'starts_at': '2026-12-24T10:00:00.000Z',
        'location': 'Sanctuary',
        'description': 'Candlelight service and carols',
      };

      final event = ChurchEvent.fromJson(json);
      expect(event.id, 42);
      expect(event.title, 'Christmas Eve Service');
      expect(event.monthShort, 'DEC');
      expect(event.dayString, '24');
      expect(event.location, 'Sanctuary');
      expect(event.description, 'Candlelight service and carols');

      final outputJson = event.toJson();
      expect(outputJson['title'], 'Christmas Eve Service');
      expect(outputJson['location'], 'Sanctuary');
    });
  });

  group('ApiException', () {
    test('string representation includes status code if provided', () {
      const errWithCode = ApiException('Not Found', 404);
      expect(errWithCode.toString(), contains('404'));
      expect(errWithCode.toString(), contains('Not Found'));

      const errWithoutCode = ApiException('Connection failed');
      expect(errWithoutCode.toString(), 'ApiException: Connection failed');
    });
  });
}
