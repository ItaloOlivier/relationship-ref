import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../../core/api/api_service.dart';

class CouplePairingDialog extends ConsumerStatefulWidget {
  const CouplePairingDialog({super.key});

  @override
  ConsumerState<CouplePairingDialog> createState() => _CouplePairingDialogState();
}

class _CouplePairingDialogState extends ConsumerState<CouplePairingDialog> {
  bool _isCreating = true;
  bool _isLoading = false;
  String? _inviteCode;
  String? _error;
  final _codeController = TextEditingController();

  @override
  void dispose() {
    _codeController.dispose();
    super.dispose();
  }

  Future<void> _createCouple() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      final couplesApi = ref.read(couplesApiProvider);
      final result = await couplesApi.createCouple();
      setState(() {
        _inviteCode = result['inviteCode'] as String;
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _error = 'Failed to create couple. Please try again.';
        _isLoading = false;
      });
    }
  }

  Future<void> _joinCouple() async {
    if (_codeController.text.length != 8) {
      setState(() => _error = 'Invite code must be 8 characters');
      return;
    }

    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      final couplesApi = ref.read(couplesApiProvider);
      await couplesApi.joinCouple(_codeController.text.toUpperCase());
      if (mounted) {
        Navigator.of(context).pop(true); // Success
      }
    } catch (e) {
      setState(() {
        _error = 'Invalid invite code. Please check and try again.';
        _isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Dialog(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(
              'Pair with Partner',
              style: Theme.of(context).textTheme.headlineMedium,
            ),
            const SizedBox(height: 8),
            Text(
              'Connect with your partner to start coach sessions together',
              textAlign: TextAlign.center,
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                color: AppColors.textSecondary,
              ),
            ),
            const SizedBox(height: 24),

            // Toggle
            Row(
              children: [
                Expanded(
                  child: _ToggleButton(
                    label: 'Create',
                    isSelected: _isCreating,
                    onTap: () => setState(() => _isCreating = true),
                  ),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: _ToggleButton(
                    label: 'Join',
                    isSelected: !_isCreating,
                    onTap: () => setState(() => _isCreating = false),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 24),

            // Content
            if (_isCreating) _buildCreateContent() else _buildJoinContent(),

            // Error
            if (_error != null) ...[
              const SizedBox(height: 16),
              Text(
                _error!,
                style: TextStyle(color: AppColors.error),
                textAlign: TextAlign.center,
              ),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildCreateContent() {
    if (_inviteCode != null) {
      return Column(
        children: [
          const Icon(
            Icons.check_circle,
            color: AppColors.success,
            size: 48,
          ),
          const SizedBox(height: 16),
          Text(
            'Share this code with your partner:',
            style: Theme.of(context).textTheme.bodyLarge,
          ),
          const SizedBox(height: 16),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
            decoration: BoxDecoration(
              color: AppColors.primary.withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  _inviteCode!,
                  style: const TextStyle(
                    fontSize: 24,
                    fontWeight: FontWeight.bold,
                    letterSpacing: 2,
                  ),
                ),
                const SizedBox(width: 12),
                IconButton(
                  icon: const Icon(Icons.copy),
                  onPressed: () {
                    Clipboard.setData(ClipboardData(text: _inviteCode!));
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(content: Text('Code copied!')),
                    );
                  },
                ),
              ],
            ),
          ),
          const SizedBox(height: 24),
          Text(
            'Waiting for your partner to join...',
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
              color: AppColors.textSecondary,
            ),
          ),
          const SizedBox(height: 16),
          TextButton(
            onPressed: () => Navigator.of(context).pop(),
            child: const Text('Done'),
          ),
        ],
      );
    }

    return Column(
      children: [
        const Icon(
          Icons.link,
          color: AppColors.primary,
          size: 48,
        ),
        const SizedBox(height: 16),
        Text(
          'Create a new couple and get an invite code to share',
          textAlign: TextAlign.center,
          style: Theme.of(context).textTheme.bodyLarge,
        ),
        const SizedBox(height: 24),
        SizedBox(
          width: double.infinity,
          child: ElevatedButton(
            onPressed: _isLoading ? null : _createCouple,
            child: _isLoading
                ? const SizedBox(
                    width: 20,
                    height: 20,
                    child: CircularProgressIndicator(
                      strokeWidth: 2,
                      color: Colors.white,
                    ),
                  )
                : const Text('Create Couple'),
          ),
        ),
      ],
    );
  }

  Widget _buildJoinContent() {
    return Column(
      children: [
        const Icon(
          Icons.group_add,
          color: AppColors.primary,
          size: 48,
        ),
        const SizedBox(height: 16),
        Text(
          'Enter the invite code from your partner',
          textAlign: TextAlign.center,
          style: Theme.of(context).textTheme.bodyLarge,
        ),
        const SizedBox(height: 24),
        TextField(
          controller: _codeController,
          textCapitalization: TextCapitalization.characters,
          maxLength: 8,
          textAlign: TextAlign.center,
          style: const TextStyle(
            fontSize: 20,
            letterSpacing: 4,
            fontWeight: FontWeight.bold,
          ),
          decoration: const InputDecoration(
            hintText: 'ABCD1234',
            counterText: '',
          ),
          inputFormatters: [
            FilteringTextInputFormatter.allow(RegExp(r'[A-Za-z0-9]')),
          ],
        ),
        const SizedBox(height: 24),
        SizedBox(
          width: double.infinity,
          child: ElevatedButton(
            onPressed: _isLoading ? null : _joinCouple,
            child: _isLoading
                ? const SizedBox(
                    width: 20,
                    height: 20,
                    child: CircularProgressIndicator(
                      strokeWidth: 2,
                      color: Colors.white,
                    ),
                  )
                : const Text('Join Couple'),
          ),
        ),
      ],
    );
  }
}

class _ToggleButton extends StatelessWidget {
  final String label;
  final bool isSelected;
  final VoidCallback onTap;

  const _ToggleButton({
    required this.label,
    required this.isSelected,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Material(
      color: isSelected ? AppColors.primary : AppColors.border,
      borderRadius: BorderRadius.circular(8),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(8),
        child: Padding(
          padding: const EdgeInsets.symmetric(vertical: 12),
          child: Center(
            child: Text(
              label,
              style: TextStyle(
                color: isSelected ? Colors.white : AppColors.textSecondary,
                fontWeight: FontWeight.w600,
              ),
            ),
          ),
        ),
      ),
    );
  }
}
