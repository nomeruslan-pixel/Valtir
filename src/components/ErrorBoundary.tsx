import React, { Component, ErrorInfo } from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView } from 'react-native';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo });
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <SafeAreaView style={styles.container}>
          <ScrollView contentContainerStyle={styles.scroll}>
            <Text style={styles.title}>Something went wrong!</Text>
            <Text style={styles.errorText}>
              {this.state.error?.toString()}
            </Text>
            <Text style={styles.stackText}>
              {this.state.errorInfo?.componentStack}
            </Text>
          </ScrollView>
        </SafeAreaView>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scroll: {
    padding: 20,
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'red',
    marginBottom: 20,
  },
  errorText: {
    fontSize: 16,
    color: 'black',
    marginBottom: 20,
    fontWeight: 'bold',
  },
  stackText: {
    fontSize: 12,
    color: '#333',
    fontFamily: 'monospace',
  },
});
