import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;

import 'main.dart' show ChurchEvent, apiUrl;

class EventsPage extends StatefulWidget {
  const EventsPage({super.key});
  @override State<EventsPage> createState() => _EventsPageState();
}

class _EventsPageState extends State<EventsPage> {
  List<ChurchEvent> events = [];
  bool loading = true;

  @override void initState() { super.initState(); load(); }

  Future<void> load() async {
    setState(() => loading = true);
    try {
      final response = await http.get(Uri.parse('$apiUrl/events'));
      if (response.statusCode != 200) throw Exception();
      final data = jsonDecode(response.body) as List<dynamic>;
      if (mounted) setState(() => events = data.map((item) => ChurchEvent.fromJson(item as Map<String, dynamic>)).toList());
    } catch (_) {
      if (mounted) setState(() => events = []);
    } finally { if (mounted) setState(() => loading = false); }
  }

  Future<void> add() async {
    final title = TextEditingController();
    final location = TextEditingController();
    final save = await showDialog<bool>(context: context, builder: (context) => AlertDialog(title: const Text('Plan an event'), content: Column(mainAxisSize: MainAxisSize.min, children: [TextField(controller: title, autofocus: true, decoration: const InputDecoration(labelText: 'Event name')), const SizedBox(height: 12), TextField(controller: location, decoration: const InputDecoration(labelText: 'Location (optional)'))]), actions: [TextButton(onPressed: () => Navigator.pop(context), child: const Text('Cancel')), FilledButton(onPressed: () => Navigator.pop(context, true), child: const Text('Create event'))]));
    if (save != true || title.text.trim().isEmpty) return;
    final response = await http.post(Uri.parse('$apiUrl/events'), headers: const {'Content-Type': 'application/json'}, body: jsonEncode({'title': title.text.trim(), 'location': location.text.trim().isEmpty ? null : location.text.trim(), 'starts_at': DateTime.now().toIso8601String()}));
    if (response.statusCode == 201) await load();
  }

  @override
  Widget build(BuildContext context) => Scaffold(
    appBar: AppBar(title: const Text('Church events'), bottom: const PreferredSize(preferredSize: Size.fromHeight(28), child: Align(alignment: Alignment.centerLeft, child: Padding(padding: EdgeInsets.fromLTRB(20, 0, 20, 8), child: Text('Gather, worship, and serve together'))))),
    floatingActionButton: FloatingActionButton.extended(onPressed: add, icon: const Icon(Icons.add), label: const Text('Plan event')),
    body: loading ? const Center(child: CircularProgressIndicator()) : events.isEmpty ? _EmptyEvents(onAdd: add) : RefreshIndicator(onRefresh: load, child: ListView.separated(padding: const EdgeInsets.fromLTRB(16, 8, 16, 96), itemCount: events.length, separatorBuilder: (context, index) => const SizedBox(height: 8), itemBuilder: (context, index) => _EventCard(event: events[index]))),
  );
}

class _EventCard extends StatelessWidget {
  const _EventCard({required this.event});
  final ChurchEvent event;
  @override Widget build(BuildContext context) {
    final date = event.startsAt;
    const months = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];
    return Card(child: Padding(padding: const EdgeInsets.all(14), child: Row(children: [Container(width: 54, padding: const EdgeInsets.symmetric(vertical: 8), decoration: BoxDecoration(color: Theme.of(context).colorScheme.primaryContainer, borderRadius: BorderRadius.circular(12)), child: Column(children: [Text(months[date.month - 1], style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold)), Text('${date.day}', style: const TextStyle(fontSize: 22, fontWeight: FontWeight.bold))])), const SizedBox(width: 14), Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [Text(event.title, style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 16)), const SizedBox(height: 4), Text(event.location ?? 'Church community event', style: TextStyle(color: Theme.of(context).colorScheme.onSurfaceVariant))]))])));
  }
}

class _EmptyEvents extends StatelessWidget {
  const _EmptyEvents({required this.onAdd}); final Future<void> Function() onAdd;
  @override Widget build(BuildContext context) => Center(child: Padding(padding: const EdgeInsets.all(32), child: Column(mainAxisSize: MainAxisSize.min, children: [Icon(Icons.event_available, size: 56, color: Theme.of(context).colorScheme.primary), const SizedBox(height: 16), Text('No events planned yet', style: Theme.of(context).textTheme.titleLarge), const SizedBox(height: 8), const Text('Create a service, fellowship, or ministry event.', textAlign: TextAlign.center), const SizedBox(height: 16), FilledButton.icon(onPressed: onAdd, icon: const Icon(Icons.add), label: const Text('Plan an event'))])));
}
