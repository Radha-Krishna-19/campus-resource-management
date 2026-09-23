import React from 'react';

// Catches render-time crashes anywhere below it and shows a fallback screen
// instead of a blank white page — there was previously no error boundary
// anywhere in the app.
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error('Unhandled render error:', error, info);
  }

  handleReload = () => {
    this.setState({ hasError: false });
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-background flex items-center justify-center px-6">
          <div className="text-center max-w-md">
            <h1 className="text-2xl font-bold text-foreground mb-2">Something went wrong</h1>
            <p className="text-muted-foreground mb-6">
              An unexpected error occurred. Try reloading the page — if it keeps happening, please
              contact support.
            </p>
            <button
              onClick={this.handleReload}
              className="inline-flex items-center justify-center rounded-md bg-amrita text-amrita-foreground px-4 py-2 text-sm font-medium hover:opacity-90 transition-opacity"
            >
              Reload app
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
