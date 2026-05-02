import { Component } from 'react';
import { AlertTriangle } from 'lucide-react';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error('[ErrorBoundary]', error, info);
  }

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <div className="min-h-screen bg-base-100 flex items-center justify-center p-6">
        <div className="card bg-base-200 border border-error/30 max-w-md w-full">
          <div className="card-body items-center text-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-error/10 flex items-center justify-center">
              <AlertTriangle size={28} className="text-error" />
            </div>
            <div>
              <h2 className="text-lg font-semibold mb-1">Something went wrong</h2>
              <p className="text-sm text-base-content/60">An unexpected error occurred. Reload the page to continue.</p>
            </div>
            {import.meta.env.DEV && (
              <pre className="text-xs text-error/70 bg-base-300 rounded p-3 text-left w-full overflow-auto max-h-32">
                {this.state.error.message}
              </pre>
            )}
            <button onClick={() => window.location.reload()} className="btn btn-primary btn-sm">
              Reload Page
            </button>
          </div>
        </div>
      </div>
    );
  }
}
