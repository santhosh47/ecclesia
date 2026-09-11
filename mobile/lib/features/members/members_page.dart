import 'package:flutter/material.dart';

import '../../models/member.dart';
import '../../services/api_service.dart';
import 'widgets/member_sheets.dart';

/// Screen displaying the church member directory with search and management actions.
class MembersPage extends StatefulWidget {
  const MembersPage({super.key, this.apiService});

  final ApiService? apiService;

  @override
  State<MembersPage> createState() => _MembersPageState();
}

class _MembersPageState extends State<MembersPage> {
  List<Member> _members = [];
  String _searchQuery = '';
  bool _isLoading = true;
  Object? _loadError;

  late final ApiService _apiService;
  final TextEditingController _searchController = TextEditingController();

  @override
  void initState() {
    super.initState();
    _apiService = widget.apiService ?? ApiService();
    _loadMembers();
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  Future<void> _loadMembers() async {
    if (mounted) {
      setState(() {
        _isLoading = true;
        _loadError = null;
      });
    }
    try {
      final members = await _apiService.getMembers();
      members.sort(_compareMembers);
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

  int _compareMembers(Member first, Member second) {
    final lastNameOrder = first.lastName.compareTo(second.lastName);
    return lastNameOrder != 0
        ? lastNameOrder
        : first.firstName.compareTo(second.firstName);
  }

  List<Member> get _filteredMembers {
    if (_searchQuery.trim().isEmpty) return _members;
    final query = _searchQuery.trim().toLowerCase();
    return _members.where((m) {
      final matchName = m.fullName.toLowerCase().contains(query);
      final matchEmail = m.email?.toLowerCase().contains(query) ?? false;
      final matchPhone = m.phone?.contains(query) ?? false;
      return matchName || matchEmail || matchPhone;
    }).toList();
  }

  Future<void> _showAddMember() async {
    final savedMember = await showModalBottomSheet<Member>(
      context: context,
      isScrollControlled: true,
      builder: (_) => AddMemberSheet(apiService: _apiService),
    );
    if (savedMember != null && mounted) {
      final updatedMembers = [..._members, savedMember]..sort(_compareMembers);
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
      builder: (_) => EditMemberSheet(member: member, apiService: _apiService),
    );
    if (result == null || !mounted) return;

    setState(() {
      if (result.deletedId != null) {
        _members = _members.where((m) => m.id != result.deletedId).toList();
      } else if (result.member != null) {
        _members = _members
            .map((m) => m.id == result.member!.id ? result.member! : m)
            .toList()
          ..sort(_compareMembers);
      }
    });

    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(
          result.deletedId != null ? 'Member deleted.' : 'Member updated.',
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Member directory'),
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(80),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Padding(
                padding: EdgeInsets.fromLTRB(20, 0, 20, 8),
                child: Text(
                  'Your church community',
                  style: TextStyle(fontSize: 13, color: Colors.black54),
                ),
              ),
              Padding(
                padding: const EdgeInsets.fromLTRB(16, 0, 16, 8),
                child: SearchBar(
                  controller: _searchController,
                  hintText: 'Search congregation by name or phone...',
                  leading: const Icon(Icons.search, size: 20),
                  trailing: _searchQuery.isNotEmpty
                      ? [
                          IconButton(
                            icon: const Icon(Icons.clear, size: 18),
                            onPressed: () {
                              _searchController.clear();
                              setState(() => _searchQuery = '');
                            },
                          ),
                        ]
                      : null,
                  elevation: const WidgetStatePropertyAll(0),
                  backgroundColor: WidgetStatePropertyAll(
                    Theme.of(context).colorScheme.surfaceContainerHighest.withValues(alpha: 0.5),
                  ),
                  onChanged: (val) => setState(() => _searchQuery = val),
                ),
              ),
            ],
          ),
        ),
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: _showAddMember,
        icon: const Icon(Icons.person_add),
        label: const Text('Add member'),
      ),
      body: _buildBody(),
    );
  }

  Widget _buildBody() {
    if (_isLoading) {
      return const Center(child: CircularProgressIndicator());
    }

    if (_loadError != null) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(32),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Icon(Icons.cloud_off, size: 48, color: Colors.black45),
              const SizedBox(height: 16),
              Text(
                'Could not reach the server.\n$_loadError',
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 16),
              OutlinedButton.icon(
                onPressed: _loadMembers,
                icon: const Icon(Icons.refresh),
                label: const Text('Try again'),
              ),
            ],
          ),
        ),
      );
    }

    if (_members.isEmpty) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(32),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Icon(Icons.people_outline, size: 56, color: Colors.black38),
              const SizedBox(height: 16),
              Text(
                'No members yet',
                style: Theme.of(context).textTheme.titleLarge,
              ),
              const SizedBox(height: 8),
              const Text(
                'Add the first person to your church directory.',
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 16),
              FilledButton.icon(
                onPressed: _showAddMember,
                icon: const Icon(Icons.person_add),
                label: const Text('Add member'),
              ),
            ],
          ),
        ),
      );
    }

    final displayed = _filteredMembers;
    if (displayed.isEmpty) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(32),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Icon(Icons.search_off, size: 48, color: Colors.black38),
              const SizedBox(height: 16),
              Text(
                'No matching members found',
                style: Theme.of(context).textTheme.titleMedium,
              ),
              const SizedBox(height: 8),
              Text(
                'Try searching for a different name or keyword.',
                style: TextStyle(color: Theme.of(context).colorScheme.outline),
              ),
            ],
          ),
        ),
      );
    }

    return RefreshIndicator(
      onRefresh: _loadMembers,
      child: ListView.separated(
        padding: const EdgeInsets.fromLTRB(16, 8, 16, 96),
        itemCount: displayed.length,
        separatorBuilder: (_, __) => const SizedBox(height: 6),
        itemBuilder: (context, index) {
          final member = displayed[index];
          final initial = member.firstName.isNotEmpty
              ? member.firstName[0].toUpperCase()
              : '?';

          return Card(
            elevation: 0,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(12),
              side: BorderSide(
                color: Theme.of(context).colorScheme.outlineVariant.withValues(alpha: 0.4),
              ),
            ),
            color: Theme.of(context).colorScheme.surface,
            child: ListTile(
              contentPadding:
                  const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
              leading: CircleAvatar(
                backgroundColor:
                    Theme.of(context).colorScheme.primaryContainer,
                child: Text(
                  initial,
                  style: TextStyle(
                    fontWeight: FontWeight.bold,
                    color: Theme.of(context).colorScheme.onPrimaryContainer,
                  ),
                ),
              ),
              title: Text(
                member.fullName,
                style: const TextStyle(fontWeight: FontWeight.w600),
              ),
              subtitle: Text(
                member.email ?? member.phone ?? 'No contact details',
                style: TextStyle(
                  color: Theme.of(context).colorScheme.onSurfaceVariant,
                  fontSize: 13,
                ),
              ),
              trailing: const Icon(Icons.chevron_right, size: 20),
              onTap: () => _showEditMember(member),
            ),
          );
        },
      ),
    );
  }
}
