import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'events_page.dart';

const apiUrl = String.fromEnvironment(
  'API_URL',
  defaultValue: 'http://10.0.2.2:8000/api/v1',
);

void main() => runApp(const EcclesiaApp());

class EcclesiaApp extends StatelessWidget {
  const EcclesiaApp({super.key});

  @override
  Widget build(BuildContext context) => MaterialApp(
        title: 'Ecclesia',
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(seedColor: const Color(0xff1b6654)),
        useMaterial3: true,
        scaffoldBackgroundColor: const Color(0xfff7f8f6),
        appBarTheme: const AppBarTheme(centerTitle: false, backgroundColor: Color(0xfff7f8f6)),
        navigationBarTheme: const NavigationBarThemeData(height: 72),
        inputDecorationTheme: const InputDecorationTheme(border: OutlineInputBorder()),
      ),
        home: const EcclesiaHome(),
      );
}

class EcclesiaHome extends StatefulWidget { const EcclesiaHome({super.key}); @override State<EcclesiaHome> createState() => _EcclesiaHomeState(); }
class _EcclesiaHomeState extends State<EcclesiaHome> {
  var _tab = 0;
  @override Widget build(BuildContext context) => Scaffold(body: IndexedStack(index: _tab, children: const [MembersPage(), EventsPage()]), bottomNavigationBar: NavigationBar(selectedIndex: _tab, onDestinationSelected: (value) => setState(() => _tab = value), destinations: const [NavigationDestination(icon: Icon(Icons.people_outline), selectedIcon: Icon(Icons.people), label: 'Members'), NavigationDestination(icon: Icon(Icons.event_outlined), selectedIcon: Icon(Icons.event), label: 'Events')]));
}

class Member {
  const Member({
    required this.id,
    required this.firstName,
    required this.lastName,
    this.email,
    this.phone,
  });

  final int id;
  final String firstName;
  final String lastName;
  final String? email;
  final String? phone;

  factory Member.fromJson(Map<String, dynamic> json) => Member(
        id: json['id'] as int,
        firstName: json['first_name'] as String,
        lastName: json['last_name'] as String,
        email: json['email'] as String?,
        phone: json['phone'] as String?,
      );
}

class ChurchEvent {
  const ChurchEvent({required this.id, required this.title, required this.startsAt, this.location});
  final int id; final String title; final DateTime startsAt; final String? location;
  factory ChurchEvent.fromJson(Map<String, dynamic> json) => ChurchEvent(id: json['id'] as int, title: json['title'] as String, startsAt: DateTime.parse(json['starts_at'] as String).toLocal(), location: json['location'] as String?);
}

class MemberUpdateResult {
  const MemberUpdateResult.updated(this.member) : deletedId = null;
  const MemberUpdateResult.deleted(this.deletedId) : member = null;

  final Member? member;
  final int? deletedId;
}

class MembersPage extends StatefulWidget {
  const MembersPage({super.key});

  @override
  State<MembersPage> createState() => _MembersPageState();
}

class _MembersPageState extends State<MembersPage> {
  List<Member> _members = [];
  bool _isLoading = true;
  Object? _loadError;

  @override
  void initState() {
    super.initState();
    _loadMembers();
  }

  Future<void> _loadMembers() async {
    if (mounted) {
      setState(() {
        _isLoading = true;
        _loadError = null;
      });
    }
    try {
      final response = await http.get(Uri.parse('$apiUrl/members'));
      if (response.statusCode != 200) {
        throw Exception('The server returned ${response.statusCode}.');
      }
      final data = jsonDecode(response.body) as List<dynamic>;
      final members = data
          .map((item) => Member.fromJson(item as Map<String, dynamic>))
          .toList();
      if (mounted) {
        setState(() => _members = members);
      }
    } catch (error) {
      if (mounted) {
        setState(() => _loadError = error);
      }
    } finally {
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  Future<void> _refresh() => _loadMembers();

  Future<void> _showAddMember() async {
    final savedMember = await showModalBottomSheet<Member>(
      context: context,
      isScrollControlled: true,
      builder: (_) => const AddMemberSheet(),
    );
    if (savedMember != null && mounted) {
      final updatedMembers = [..._members, savedMember]
        ..sort((first, second) {
          final lastNameOrder = first.lastName.compareTo(second.lastName);
          return lastNameOrder != 0
              ? lastNameOrder
              : first.firstName.compareTo(second.firstName);
        });
      setState(() => _members = updatedMembers);
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Member added successfully.')),
      );
    }
  }

  Future<void> _showEditMember(Member member) async {
    final result = await showModalBottomSheet<MemberUpdateResult>(
      context: context,
      isScrollControlled: true,
      builder: (_) => EditMemberSheet(member: member),
    );
    if (result == null || !mounted) return;

    setState(() {
      if (result.deletedId != null) {
        _members = _members.where((item) => item.id != result.deletedId).toList();
      } else if (result.member != null) {
        _members = _members
            .map((item) => item.id == result.member!.id ? result.member! : item)
            .toList()
          ..sort(_compareMembers);
      }
    });
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(result.deletedId != null ? 'Member deleted.' : 'Member updated.')),
    );
  }

  int _compareMembers(Member first, Member second) {
    final lastNameOrder = first.lastName.compareTo(second.lastName);
    return lastNameOrder != 0 ? lastNameOrder : first.firstName.compareTo(second.firstName);
  }

  @override
  Widget build(BuildContext context) => Scaffold(
        appBar: AppBar(title: const Text('Member directory'), bottom: const PreferredSize(preferredSize: Size.fromHeight(28), child: Align(alignment: Alignment.centerLeft, child: Padding(padding: EdgeInsets.fromLTRB(20, 0, 20, 8), child: Text('Your church community'))))),
        floatingActionButton: FloatingActionButton.extended(
          onPressed: _showAddMember,
          icon: const Icon(Icons.person_add),
          label: const Text('Add member'),
        ),
        body: _buildBody(),
      );

  Widget _buildBody() {
    if (_isLoading) return const Center(child: CircularProgressIndicator());
    if (_loadError != null) {
      return _MessageView(
        icon: Icons.cloud_off,
        message: 'Could not reach the server.\n$_loadError',
        actionLabel: 'Try again',
        onAction: _refresh,
      );
    }
    if (_members.isEmpty) {
      return _MessageView(
        icon: Icons.people_outline,
        message: 'No members yet.\nAdd the first person to your directory.',
        actionLabel: 'Add member',
        onAction: _showAddMember,
      );
    }
    return RefreshIndicator(
      onRefresh: _refresh,
      child: ListView.separated(
        padding: const EdgeInsets.fromLTRB(16, 8, 16, 96),
        itemCount: _members.length,
        separatorBuilder: (context, index) => const Divider(height: 1),
        itemBuilder: (context, index) {
          final member = _members[index];
          return Card(
            elevation: 0,
            color: Theme.of(context).colorScheme.surface,
            child: ListTile(
              contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
              leading: CircleAvatar(backgroundColor: Theme.of(context).colorScheme.primaryContainer, child: Text(member.firstName.substring(0, 1).toUpperCase())),
              title: Text('${member.firstName} ${member.lastName}', style: const TextStyle(fontWeight: FontWeight.w600)),
              subtitle: Text(member.email ?? member.phone ?? 'No contact details'),
              trailing: const Icon(Icons.chevron_right),
              onTap: () => _showEditMember(member),
            ),
          );
        },
      ),
    );
  }
}

class AddMemberSheet extends StatefulWidget {
  const AddMemberSheet({super.key});

  @override
  State<AddMemberSheet> createState() => _AddMemberSheetState();
}

class _AddMemberSheetState extends State<AddMemberSheet> {
  final _formKey = GlobalKey<FormState>();
  final _firstName = TextEditingController();
  final _lastName = TextEditingController();
  final _email = TextEditingController();
  final _phone = TextEditingController();
  bool _saving = false;

  @override
  void dispose() {
    _firstName.dispose();
    _lastName.dispose();
    _email.dispose();
    _phone.dispose();
    super.dispose();
  }

  Future<void> _save() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _saving = true);
    try {
      final response = await http.post(
        Uri.parse('$apiUrl/members'),
        headers: const {'Content-Type': 'application/json'},
        body: jsonEncode({
          'first_name': _firstName.text.trim(),
          'last_name': _lastName.text.trim(),
          'email': _email.text.trim().isEmpty ? null : _email.text.trim(),
          'phone': _phone.text.trim().isEmpty ? null : _phone.text.trim(),
        }),
      );
      if (response.statusCode != 201) throw Exception('Unable to save this member.');
      final member = Member.fromJson(jsonDecode(response.body) as Map<String, dynamic>);
      if (mounted) Navigator.pop(context, member);
    } catch (error) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(error.toString())));
      }
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final bottomInset = MediaQuery.viewInsetsOf(context).bottom;
    return Padding(
      padding: EdgeInsets.fromLTRB(24, 24, 24, bottomInset + 24),
      child: SafeArea(
        top: false,
        child: Form(
          key: _formKey,
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Text('Add member', style: Theme.of(context).textTheme.headlineSmall),
              const SizedBox(height: 16),
              TextFormField(controller: _firstName, textCapitalization: TextCapitalization.words, decoration: const InputDecoration(labelText: 'First name'), validator: _required),
              TextFormField(controller: _lastName, textCapitalization: TextCapitalization.words, decoration: const InputDecoration(labelText: 'Last name'), validator: _required),
              TextFormField(controller: _email, keyboardType: TextInputType.emailAddress, decoration: const InputDecoration(labelText: 'Email (optional)'), validator: _validateEmail),
              TextFormField(controller: _phone, keyboardType: TextInputType.phone, decoration: const InputDecoration(labelText: 'Phone (optional)')),
              const SizedBox(height: 20),
              FilledButton(
                onPressed: _saving ? null : _save,
                child: _saving
                    ? const SizedBox(height: 20, width: 20, child: CircularProgressIndicator(strokeWidth: 2))
                    : const Text('Save member'),
              ),
            ],
          ),
        ),
      ),
    );
  }

  String? _required(String? value) => value == null || value.trim().isEmpty ? 'This field is required' : null;
  String? _validateEmail(String? value) => value != null && value.isNotEmpty && !value.contains('@') ? 'Enter a valid email address' : null;
}

class EditMemberSheet extends StatefulWidget {
  const EditMemberSheet({required this.member, super.key});

  final Member member;

  @override
  State<EditMemberSheet> createState() => _EditMemberSheetState();
}

class _EditMemberSheetState extends State<EditMemberSheet> {
  final _formKey = GlobalKey<FormState>();
  late final TextEditingController _firstName;
  late final TextEditingController _lastName;
  late final TextEditingController _email;
  late final TextEditingController _phone;
  bool _saving = false;

  @override
  void initState() {
    super.initState();
    _firstName = TextEditingController(text: widget.member.firstName);
    _lastName = TextEditingController(text: widget.member.lastName);
    _email = TextEditingController(text: widget.member.email ?? '');
    _phone = TextEditingController(text: widget.member.phone ?? '');
  }

  @override
  void dispose() {
    _firstName.dispose();
    _lastName.dispose();
    _email.dispose();
    _phone.dispose();
    super.dispose();
  }

  Future<void> _save() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _saving = true);
    try {
      final response = await http.patch(
        Uri.parse('$apiUrl/members/${widget.member.id}'),
        headers: const {'Content-Type': 'application/json'},
        body: jsonEncode({
          'first_name': _firstName.text.trim(),
          'last_name': _lastName.text.trim(),
          'email': _email.text.trim().isEmpty ? null : _email.text.trim(),
          'phone': _phone.text.trim().isEmpty ? null : _phone.text.trim(),
        }),
      );
      if (response.statusCode != 200) throw Exception('Unable to save changes.');
      final member = Member.fromJson(jsonDecode(response.body) as Map<String, dynamic>);
      if (mounted) Navigator.pop(context, MemberUpdateResult.updated(member));
    } catch (error) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(error.toString())));
      }
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  Future<void> _delete() async {
    final confirmed = await showDialog<bool>(
          context: context,
          builder: (dialogContext) => AlertDialog(
            title: const Text('Delete member?'),
            content: const Text('This permanently removes the member from the directory.'),
            actions: [
              TextButton(onPressed: () => Navigator.pop(dialogContext, false), child: const Text('Cancel')),
              FilledButton(onPressed: () => Navigator.pop(dialogContext, true), child: const Text('Delete')),
            ],
          ),
        ) ??
        false;
    if (!confirmed) return;

    setState(() => _saving = true);
    try {
      final response = await http.delete(Uri.parse('$apiUrl/members/${widget.member.id}'));
      if (response.statusCode != 204) throw Exception('Unable to delete this member.');
      if (mounted) Navigator.pop(context, MemberUpdateResult.deleted(widget.member.id));
    } catch (error) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(error.toString())));
      }
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final bottomInset = MediaQuery.viewInsetsOf(context).bottom;
    return Padding(
      padding: EdgeInsets.fromLTRB(24, 24, 24, bottomInset + 24),
      child: SafeArea(
        top: false,
        child: Form(
          key: _formKey,
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Text('Member details', style: Theme.of(context).textTheme.headlineSmall),
              const SizedBox(height: 16),
              TextFormField(controller: _firstName, textCapitalization: TextCapitalization.words, decoration: const InputDecoration(labelText: 'First name'), validator: _required),
              TextFormField(controller: _lastName, textCapitalization: TextCapitalization.words, decoration: const InputDecoration(labelText: 'Last name'), validator: _required),
              TextFormField(controller: _email, keyboardType: TextInputType.emailAddress, decoration: const InputDecoration(labelText: 'Email (optional)'), validator: _validateEmail),
              TextFormField(controller: _phone, keyboardType: TextInputType.phone, decoration: const InputDecoration(labelText: 'Phone (optional)')),
              const SizedBox(height: 20),
              FilledButton(
                onPressed: _saving ? null : _save,
                child: _saving ? const SizedBox(height: 20, width: 20, child: CircularProgressIndicator(strokeWidth: 2)) : const Text('Save changes'),
              ),
              const SizedBox(height: 8),
              TextButton.icon(
                onPressed: _saving ? null : _delete,
                icon: const Icon(Icons.delete_outline),
                label: const Text('Delete member'),
                style: TextButton.styleFrom(foregroundColor: Theme.of(context).colorScheme.error),
              ),
            ],
          ),
        ),
      ),
    );
  }

  String? _required(String? value) => value == null || value.trim().isEmpty ? 'This field is required' : null;
  String? _validateEmail(String? value) => value != null && value.isNotEmpty && !value.contains('@') ? 'Enter a valid email address' : null;
}

class _MessageView extends StatelessWidget {
  const _MessageView({required this.icon, required this.message, required this.actionLabel, required this.onAction});

  final IconData icon;
  final String message;
  final String actionLabel;
  final Future<void> Function() onAction;

  @override
  Widget build(BuildContext context) => Center(
        child: Padding(
          padding: const EdgeInsets.all(32),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(icon, size: 48),
              const SizedBox(height: 16),
              Text(message, textAlign: TextAlign.center),
              const SizedBox(height: 12),
              OutlinedButton(onPressed: onAction, child: Text(actionLabel)),
            ],
          ),
        ),
      );
}
