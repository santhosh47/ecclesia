/// Application configuration and environment constants.
class AppConfig {
  AppConfig._();

  /// Base URL for the Ecclesia backend REST API.
  static const String apiUrl = String.fromEnvironment(
    'API_URL',
    defaultValue: 'http://10.0.2.2:8000/api/v1',
  );

  /// Network request timeout.
  static const Duration requestTimeout = Duration(seconds: 10);
}
