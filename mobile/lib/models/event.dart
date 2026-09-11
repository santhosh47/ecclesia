/// Domain model representing a church activity or calendar event.
class ChurchEvent {
  const ChurchEvent({
    required this.id,
    required this.title,
    required this.startsAt,
    this.location,
    this.description,
  });

  final int id;
  final String title;
  final DateTime startsAt;
  final String? location;
  final String? description;

  static const List<String> _months = [
    'JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN',
    'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'
  ];

  /// Short uppercase month abbreviation (e.g. 'OCT').
  String get monthShort => _months[startsAt.month - 1];

  /// Day of the month string.
  String get dayString => '${startsAt.day}';

  factory ChurchEvent.fromJson(Map<String, dynamic> json) => ChurchEvent(
        id: json['id'] as int,
        title: json['title'] as String,
        startsAt: DateTime.parse(json['starts_at'] as String).toLocal(),
        location: json['location'] as String?,
        description: json['description'] as String?,
      );

  Map<String, dynamic> toJson() => {
        'id': id,
        'title': title,
        'starts_at': startsAt.toUtc().toIso8601String(),
        if (location != null) 'location': location,
        if (description != null) 'description': description,
      };

  ChurchEvent copyWith({
    int? id,
    String? title,
    DateTime? startsAt,
    String? location,
    String? description,
  }) =>
      ChurchEvent(
        id: id ?? this.id,
        title: title ?? this.title,
        startsAt: startsAt ?? this.startsAt,
        location: location ?? this.location,
        description: description ?? this.description,
      );
}
