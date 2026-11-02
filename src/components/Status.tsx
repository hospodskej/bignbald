import { ActivityIndicator, View } from 'react-native';

import { colors } from '@/theme/tokens';
import { Button, Card, T } from './ui';

/** Loading spinner, or a friendly error with a retry button. */
export function Status({ loading, error, onRetry }: { loading: boolean; error: string | null; onRetry?: () => void }) {
  if (loading) {
    return (
      <View style={{ padding: 24, alignItems: 'center' }}>
        <ActivityIndicator color={colors.muted} />
      </View>
    );
  }
  if (!error) return null;
  return (
    <Card>
      <T v="small" color={colors.textDim}>{error}</T>
      {onRetry ? <Button title="Try again" size="sm" variant="outline" color={colors.muted} onPress={onRetry} /> : null}
    </Card>
  );
}
