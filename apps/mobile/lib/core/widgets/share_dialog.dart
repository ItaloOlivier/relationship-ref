import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../services/share_service.dart';
import '../theme/app_theme.dart';

/// Dialog for sharing session reports or personality profiles
class ShareDialog extends ConsumerStatefulWidget {
  final String? sessionId; // If null, sharing a profile
  final String title;
  final String description;

  const ShareDialog({
    super.key,
    this.sessionId,
    this.title = 'Share Report',
    this.description = 'Share your Relationship Referee report with others',
  });

  /// Share a session report
  factory ShareDialog.session({
    required String sessionId,
    String? title,
  }) {
    return ShareDialog(
      sessionId: sessionId,
      title: title ?? 'Share Session Report',
      description: 'Share your session analysis with friends, family, or a therapist',
    );
  }

  /// Share a personality profile
  factory ShareDialog.profile({String? title}) {
    return ShareDialog(
      title: title ?? 'Share Personality Profile',
      description: 'Share your personality insights with others',
    );
  }

  @override
  ConsumerState<ShareDialog> createState() => _ShareDialogState();
}

class _ShareDialogState extends ConsumerState<ShareDialog> {
  bool _isLoading = false;
  String? _error;
  ShareLinkResult? _shareLinkResult;

  int _expiryDays = 7;
  bool _anonymize = false;

  @override
  void initState() {
    super.initState();
    _createShareLink();
  }

  Future<void> _createShareLink() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      final shareService = ref.read(shareServiceProvider);
      final result = widget.sessionId != null
          ? await shareService.createSessionShareLink(
              widget.sessionId!,
              expiryDays: _expiryDays,
              anonymize: _anonymize,
            )
          : await shareService.createProfileShareLink(
              expiryDays: _expiryDays,
              anonymize: _anonymize,
            );

      setState(() {
        _shareLinkResult = result;
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _error = 'Failed to create share link. Please try again.';
        _isLoading = false;
      });
    }
  }

  Future<void> _copyToClipboard() async {
    if (_shareLinkResult == null) return;

    final shareService = ref.read(shareServiceProvider);
    await shareService.copyToClipboard(_shareLinkResult!.shareUrl);

    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Link copied to clipboard'),
          duration: Duration(seconds: 2),
        ),
      );
    }
  }

  Future<void> _shareViaWhatsApp() async {
    if (_shareLinkResult == null) return;

    final shareService = ref.read(shareServiceProvider);
    final message = widget.sessionId != null
        ? 'Check out my Relationship Referee session report!'
        : 'Check out my Relationship Referee personality profile!';

    final success = await shareService.shareViaWhatsApp(
      _shareLinkResult!.shareUrl,
      message: message,
    );

    if (!success && mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('WhatsApp is not installed'),
          duration: Duration(seconds: 2),
        ),
      );
    }
  }

  Future<void> _shareViaEmail() async {
    if (_shareLinkResult == null) return;

    final shareService = ref.read(shareServiceProvider);
    final subject = widget.sessionId != null
        ? 'My Relationship Referee Session Report'
        : 'My Relationship Referee Personality Profile';

    await shareService.shareViaEmail(
      _shareLinkResult!.shareUrl,
      subject: subject,
    );
  }

  @override
  Widget build(BuildContext context) {
    return Dialog(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // Header
            Row(
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        widget.title,
                        style: Theme.of(context).textTheme.headlineSmall,
                      ),
                      const SizedBox(height: 4),
                      Text(
                        widget.description,
                        style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                          color: AppColors.textSecondary,
                        ),
                      ),
                    ],
                  ),
                ),
                IconButton(
                  icon: const Icon(Icons.close),
                  onPressed: () => Navigator.of(context).pop(),
                ),
              ],
            ),
            const SizedBox(height: 24),

            // Privacy options
            _buildPrivacyOptions(),
            const SizedBox(height: 24),

            // Loading or Share Link
            if (_isLoading)
              const Center(
                child: Padding(
                  padding: EdgeInsets.all(24),
                  child: CircularProgressIndicator(),
                ),
              )
            else if (_error != null)
              _buildError()
            else if (_shareLinkResult != null)
              _buildShareOptions(),
          ],
        ),
      ),
    );
  }

  Widget _buildPrivacyOptions() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Privacy Options',
          style: Theme.of(context).textTheme.titleMedium?.copyWith(
            fontWeight: FontWeight.w600,
          ),
        ),
        const SizedBox(height: 12),

        // Expiry days
        Row(
          children: [
            Icon(Icons.schedule, size: 20, color: AppColors.textSecondary),
            const SizedBox(width: 8),
            Expanded(
              child: Text(
                'Link expires in:',
                style: Theme.of(context).textTheme.bodyMedium,
              ),
            ),
            DropdownButton<int>(
              value: _expiryDays,
              items: const [
                DropdownMenuItem(value: 1, child: Text('1 day')),
                DropdownMenuItem(value: 3, child: Text('3 days')),
                DropdownMenuItem(value: 7, child: Text('7 days')),
                DropdownMenuItem(value: 14, child: Text('14 days')),
                DropdownMenuItem(value: 30, child: Text('30 days')),
              ],
              onChanged: _isLoading
                  ? null
                  : (value) {
                      if (value != null) {
                        setState(() => _expiryDays = value);
                        _createShareLink();
                      }
                    },
            ),
          ],
        ),
        const SizedBox(height: 12),

        // Anonymize option
        Row(
          children: [
            Icon(Icons.visibility_off, size: 20, color: AppColors.textSecondary),
            const SizedBox(width: 8),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Anonymize names',
                    style: Theme.of(context).textTheme.bodyMedium,
                  ),
                  Text(
                    'Replace speaker names with "Partner A" and "Partner B"',
                    style: Theme.of(context).textTheme.bodySmall?.copyWith(
                      color: AppColors.textSecondary,
                    ),
                  ),
                ],
              ),
            ),
            Switch(
              value: _anonymize,
              onChanged: _isLoading
                  ? null
                  : (value) {
                      setState(() => _anonymize = value);
                      _createShareLink();
                    },
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildError() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.error.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Row(
        children: [
          Icon(Icons.error_outline, color: AppColors.error),
          const SizedBox(width: 12),
          Expanded(
            child: Text(
              _error!,
              style: TextStyle(color: AppColors.error),
            ),
          ),
          TextButton(
            onPressed: _createShareLink,
            child: const Text('Retry'),
          ),
        ],
      ),
    );
  }

  Widget _buildShareOptions() {
    final expiryDate = _shareLinkResult!.expiresAt;
    final now = DateTime.now();
    final daysLeft = expiryDate.difference(now).inDays;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        // Expiry info
        Container(
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            color: AppColors.primary.withValues(alpha: 0.1),
            borderRadius: BorderRadius.circular(8),
          ),
          child: Row(
            children: [
              Icon(Icons.info_outline, size: 20, color: AppColors.primary),
              const SizedBox(width: 8),
              Expanded(
                child: Text(
                  'Link expires in $daysLeft ${daysLeft == 1 ? 'day' : 'days'}',
                  style: Theme.of(context).textTheme.bodySmall?.copyWith(
                    color: AppColors.primary,
                  ),
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 16),

        // Share buttons
        _ShareButton(
          icon: Icons.content_copy,
          label: 'Copy Link',
          onPressed: _copyToClipboard,
        ),
        const SizedBox(height: 8),
        _ShareButton(
          icon: Icons.chat,
          label: 'Share via WhatsApp',
          color: const Color(0xFF25D366), // WhatsApp green
          onPressed: _shareViaWhatsApp,
        ),
        const SizedBox(height: 8),
        _ShareButton(
          icon: Icons.email,
          label: 'Share via Email',
          onPressed: _shareViaEmail,
        ),
      ],
    );
  }
}

class _ShareButton extends StatelessWidget {
  final IconData icon;
  final String label;
  final VoidCallback onPressed;
  final Color? color;

  const _ShareButton({
    required this.icon,
    required this.label,
    required this.onPressed,
    this.color,
  });

  @override
  Widget build(BuildContext context) {
    return OutlinedButton(
      onPressed: onPressed,
      style: OutlinedButton.styleFrom(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        side: BorderSide(color: color ?? AppColors.primary),
      ),
      child: Row(
        children: [
          Icon(icon, size: 20, color: color ?? AppColors.primary),
          const SizedBox(width: 12),
          Expanded(
            child: Text(
              label,
              style: TextStyle(color: color ?? AppColors.primary),
            ),
          ),
          Icon(
            Icons.arrow_forward_ios,
            size: 16,
            color: color ?? AppColors.primary,
          ),
        ],
      ),
    );
  }
}
