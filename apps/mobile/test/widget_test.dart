import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:relationship_referee/core/theme/app_theme.dart';

void main() {
  group('AppTheme', () {
    testWidgets('Light theme applies correctly', (WidgetTester tester) async {
      await tester.pumpWidget(
        MaterialApp(
          theme: AppTheme.lightTheme,
          home: const Scaffold(
            body: Center(child: Text('Test')),
          ),
        ),
      );

      expect(find.text('Test'), findsOneWidget);
    });

    testWidgets('Dark theme applies correctly', (WidgetTester tester) async {
      await tester.pumpWidget(
        MaterialApp(
          theme: AppTheme.darkTheme,
          home: const Scaffold(
            body: Center(child: Text('Test')),
          ),
        ),
      );

      expect(find.text('Test'), findsOneWidget);
    });
  });

  group('AppColors', () {
    test('Card colors are defined', () {
      expect(AppColors.greenCard, isNotNull);
      expect(AppColors.yellowCard, isNotNull);
      expect(AppColors.redCard, isNotNull);
    });

    test('Bank colors are defined', () {
      expect(AppColors.bankPositive, isNotNull);
      expect(AppColors.bankNegative, isNotNull);
    });
  });
}
