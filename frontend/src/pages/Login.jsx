/**
 * SENTINEL — Login Page
 * Firebase Auth login (email/password + Google sign-in).
 */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, googleProvider, firebaseEnabled } from '../firebase/config';

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleEmailLogin = async (e) => {
    e.preventDefault();
    if (!firebaseEnabled) {
      navigate('/dashboard');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const { signInWithEmailAndPassword } = await import('firebase/auth');
      await signInWithEmailAndPassword(auth, email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  };

  const handleGoogleLogin = async () => {
    if (!firebaseEnabled) {
      navigate('/dashboard');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const { signInWithPopup } = await import('firebase/auth');
      await signInWithPopup(auth, googleProvider);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  };

  const handleSkip = () => navigate('/dashboard');

  return (
    <div className="min-h-screen bg-[var(--color-bg-primary)] flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8 animate-fade-in">
          <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-indigo-500 to-red-500 flex items-center justify-center text-4xl font-bold shadow-xl shadow-indigo-500/30">S</div>
          <h1 className="text-3xl font-bold gradient-text mb-1">SENTINEL</h1>
          <p className="text-sm text-[var(--color-text-secondary)]">Staff Authentication</p>
        </div>

        <div className="glass-card p-6 animate-slide-in-up">
          <form onSubmit={handleEmailLogin} className="space-y-3">
            <input id="login-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" className="input-sentinel" />
            <input id="login-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" className="input-sentinel" />
            <button id="login-submit" type="submit" disabled={loading} className="w-full btn-sentinel py-2.5 text-sm font-bold">
              {loading ? '⏳...' : '🔐 Sign In'}
            </button>
          </form>

          <div className="flex items-center gap-3 my-4">
            <div className="flex-1 h-px bg-[var(--color-border-default)]" />
            <span className="text-[10px] text-[var(--color-text-muted)] uppercase">or</span>
            <div className="flex-1 h-px bg-[var(--color-border-default)]" />
          </div>

          <button onClick={handleGoogleLogin} disabled={loading} className="w-full bg-white/5 border border-[var(--color-border-default)] text-[var(--color-text-primary)] py-2.5 rounded-lg text-sm font-semibold hover:bg-white/10 transition cursor-pointer">
            🔵 Sign in with Google
          </button>

          {error && <p className="text-xs text-red-400 mt-3 text-center">{error}</p>}

          {!firebaseEnabled && (
            <div className="mt-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-2 text-center">
              <p className="text-[10px] text-yellow-400">Firebase not configured — auth disabled</p>
            </div>
          )}

          <button onClick={handleSkip} className="w-full mt-3 text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition cursor-pointer py-2">
            Skip Login → Go to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}
