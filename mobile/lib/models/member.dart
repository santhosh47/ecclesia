/// Domain model representing a church congregation member.
class Member {
  const Member({
    required this.id,
    required this.firstName,
    required this.lastName,
    this.email,
    this.phone,
    this.status = 'Active',
  });

  final int id;
  final String firstName;
  final String lastName;
  final String? email;
  final String? phone;
  final String status;

  /// Full concatenated name.
  String get fullName => '$firstName $lastName';

  /// Uppercase initials for profile avatar.
  String get initials {
    final first = firstName.isNotEmpty ? firstName[0].toUpperCase() : '';
    final last = lastName.isNotEmpty ? lastName[0].toUpperCase() : '';
    return '$first$last';
  }

  factory Member.fromJson(Map<String, dynamic> json) => Member(
        id: json['id'] as int,
        firstName: json['first_name'] as String,
        lastName: json['last_name'] as String,
        email: json['email'] as String?,
        phone: json['phone'] as String?,
        status: (json['status'] as String?) ?? 'Active',
      );

  Map<String, dynamic> toJson() => {
        'id': id,
        'first_name': firstName,
        'last_name': lastName,
        if (email != null) 'email': email,
        if (phone != null) 'phone': phone,
        'status': status,
      };

  Member copyWith({
    int? id,
    String? firstName,
    String? lastName,
    String? email,
    String? phone,
    String? status,
  }) =>
      Member(
        id: id ?? this.id,
        firstName: firstName ?? this.firstName,
        lastName: lastName ?? this.lastName,
        email: email ?? this.email,
        phone: phone ?? this.phone,
        status: status ?? this.status,
      );
}

/// Result returned from member edit/delete actions.
class MemberUpdateResult {
  const MemberUpdateResult.updated(this.member) : deletedId = null;
  const MemberUpdateResult.deleted(this.deletedId) : member = null;

  final Member? member;
  final int? deletedId;
}
