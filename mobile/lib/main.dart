import 'package:flutter/material.dart';

import 'core/config.dart';
import 'features/events/events_page.dart';
import 'features/members/members_page.dart';

// Backwards-compatible public exports
export 'core/config.dart';
export 'features/events/events_page.dart';
export 'features/members/members_page.dart';
export 'features/members/widgets/member_sheets.dart';
export 'models/event.dart';
export 'models/member.dart';
export 'services/api_service.dart';

/// Legacy constant alias for backwards compatibility.
const apiUrl = AppConfig.apiUrl;

void main() => runApp(const EcclesiaApp());

/// Root application widget configuring theme and navigation.
class EcclesiaApp extends StatelessWidget {
  const EcclesiaApp({super.key});

  @override
  Widget build(BuildContext context) => MaterialApp(
        title: 'Ecclesia',
        debugShowCheckedModeBanner: false,
        theme: ThemeData(
          colorScheme: ColorScheme.fromSeed(
            seedColor: const Color(0xff1b6654),
            brightness: Brightness.light,
          ),
          useMaterial3: true,
          scaffoldBackgroundColor: const Color(0xfff7f8f6),
          appBarTheme: const AppBarTheme(
            centerTitle: false,
            backgroundColor: Color(0xfff7f8f6),
            elevation: 0,
            titleTextStyle: TextStyle(
              fontSize: 20,
              fontWeight: FontWeight.bold,
              color: Color(0xff1b2e28),
            ),
          ),
          cardTheme: CardThemeData(
            elevation: 0,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(12),
            ),
          ),
          navigationBarTheme: NavigationBarThemeData(
            height: 72,
            indicatorColor: const Color(0xff1b6654).withValues(alpha: 0.15),
            labelTextStyle: const WidgetStatePropertyAll(
              TextStyle(fontSize: 12, fontWeight: FontWeight.w600),
            ),
          ),
          inputDecorationTheme: InputDecorationTheme(
            filled: true,
            fillColor: Colors.white,
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(10),
            ),
            contentPadding:
                const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
          ),
        ),
        home: const EcclesiaHome(),
      );
}

/// Home scaffold with bottom navigation switching between congregation directory and events.
class EcclesiaHome extends StatefulWidget {
  const EcclesiaHome({super.key});

  @override
  State<EcclesiaHome> createState() => _EcclesiaHomeState();
}

class _EcclesiaHomeState extends State<EcclesiaHome> {
  int _selectedTab = 0;

  @override
  Widget build(BuildContext context) => Scaffold(
        body: IndexedStack(
          index: _selectedTab,
          children: const [
            MembersPage(),
            EventsPage(),
          ],
        ),
        bottomNavigationBar: NavigationBar(
          selectedIndex: _selectedTab,
          onDestinationSelected: (value) =>
              setState(() => _selectedTab = value),
          destinations: const [
            NavigationDestination(
              icon: Icon(Icons.people_outline),
              selectedIcon: Icon(Icons.people),
              label: 'Members',
            ),
            NavigationDestination(
              icon: Icon(Icons.event_outlined),
              selectedIcon: Icon(Icons.event),
              label: 'Events',
            ),
          ],
        ),
      );
}
