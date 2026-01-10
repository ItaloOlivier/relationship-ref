import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/api/api_service.dart';
import '../domain/relationship_model.dart';
import '../../session/domain/session_model.dart';

/// Repository for relationship data access
class RelationshipRepository {
  final RelationshipsApi _relationshipsApi;

  RelationshipRepository(this._relationshipsApi);

  /// Get all relationships for current user
  Future<List<Relationship>> getRelationships({bool includeEnded = false}) async {
    final data = await _relationshipsApi.getRelationships(includeEnded: includeEnded);
    return data
        .map((json) => Relationship.fromJson(json as Map<String, dynamic>))
        .toList();
  }

  /// Get a specific relationship by ID
  Future<Relationship> getRelationshipById(String relationshipId) async {
    final data = await _relationshipsApi.getRelationshipById(relationshipId);
    return Relationship.fromJson(data);
  }

  /// Create a new relationship
  Future<Relationship> createRelationship({
    required RelationshipType type,
    String? name,
  }) async {
    final data = await _relationshipsApi.createRelationship(
      type: type.value,
      name: name,
    );
    return Relationship.fromJson(data);
  }

  /// Join an existing relationship via invite code
  Future<Relationship> joinRelationship({
    required String inviteCode,
    MemberRole? role,
  }) async {
    final data = await _relationshipsApi.joinRelationship(
      inviteCode: inviteCode,
      role: role?.value,
    );
    return Relationship.fromJson(data);
  }

  /// Leave a relationship
  Future<void> leaveRelationship(String relationshipId, {String? reason}) async {
    await _relationshipsApi.leaveRelationship(relationshipId, reason: reason);
  }

  /// Update relationship status (pause, resume, end)
  Future<Relationship> updateRelationshipStatus(
    String relationshipId, {
    required RelationshipStatus status,
    String? reason,
  }) async {
    final data = await _relationshipsApi.updateRelationshipStatus(
      relationshipId,
      status: status.value,
      reason: reason,
    );
    return Relationship.fromJson(data);
  }

  /// Get all members of a relationship
  Future<List<RelationshipMember>> getRelationshipMembers(
      String relationshipId) async {
    final data = await _relationshipsApi.getRelationshipMembers(relationshipId);
    return data
        .map((json) =>
            RelationshipMember.fromJson(json as Map<String, dynamic>))
        .toList();
  }

  /// Get all sessions for a relationship
  Future<List<Session>> getRelationshipSessions(String relationshipId) async {
    final data = await _relationshipsApi.getRelationshipSessions(relationshipId);
    return data
        .map((json) => Session.fromJson(json as Map<String, dynamic>))
        .toList();
  }

  /// Get relationship health metrics
  Future<RelationshipHealth> getRelationshipHealth(String relationshipId) async {
    final data = await _relationshipsApi.getRelationshipHealth(relationshipId);
    return RelationshipHealth.fromJson(data);
  }
}

/// Riverpod provider for RelationshipRepository
final relationshipRepositoryProvider = Provider<RelationshipRepository>((ref) {
  final api = ref.watch(relationshipsApiProvider);
  return RelationshipRepository(api);
});

/// Provider for fetching all relationships
final relationshipsProvider = FutureProvider<List<Relationship>>((ref) async {
  final repository = ref.watch(relationshipRepositoryProvider);
  return repository.getRelationships();
});

/// Provider for fetching a specific relationship
final relationshipProvider =
    FutureProvider.family<Relationship, String>((ref, relationshipId) async {
  final repository = ref.watch(relationshipRepositoryProvider);
  return repository.getRelationshipById(relationshipId);
});

/// Provider for fetching relationship health
final relationshipHealthProvider =
    FutureProvider.family<RelationshipHealth, String>((ref, relationshipId) async {
  final repository = ref.watch(relationshipRepositoryProvider);
  return repository.getRelationshipHealth(relationshipId);
});

/// Provider for fetching relationship sessions
final relationshipSessionsProvider =
    FutureProvider.family<List<Session>, String>((ref, relationshipId) async {
  final repository = ref.watch(relationshipRepositoryProvider);
  return repository.getRelationshipSessions(relationshipId);
});
