import React, { useState } from 'react';
import { api } from '../lib/api';
import { LogIn, AlertCircle, Loader2 } from 'lucide-react';
import { useTranslation } from '../hooks/useTranslation';
import { useLanguage } from '../contexts/LanguageContext';

const COLORS = {
  primaryRed: '#e42935',
  darkGray: '#494949',
  slateBlue: '#1e293b',
  brightBlue: '#4bb3d4',
};

export default function Auth({ onAuthSuccess }) {
  const { t } = useTranslation();
  const { language, toggleLanguage } = useLanguage();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isSignup, setIsSignup] = useState(false);

  const validateEmailDomain = (email) => {
    const allowedDomain = '@forteinnovation.mx';
    return email.toLowerCase().endsWith(allowedDomain.toLowerCase());
  };

  const handleAuth = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Validate email domain
    if (!validateEmailDomain(email)) {
      setError(t('onlyForteDomain'));
      setLoading(false);
      return;
    }

    try {
      if (isSignup) {
        // Sign up new user
        const name = email === 'centro.id@forteinnovation.mx' ? 'Centro ID' : email.split('@')[0];
        const role = email === 'centro.id@forteinnovation.mx' ? 'Admin' : 'Collaborator';
        
        const { data, error } = await api.signUp(
          email.trim().toLowerCase(),
          password,
          name,
          role
        );

        if (error) {
          // If user already exists, try to sign in instead
          if (error.message && (error.message.includes('already exists') || error.message.includes('already registered'))) {
            setError('User already exists. Please sign in instead.');
            setIsSignup(false);
            setLoading(false);
            return;
          }
          setError(error.message || 'Sign up error');
          setLoading(false);
          return;
        }

        if (data?.user && data?.profile) {
          // After signup, pass profile to onAuthSuccess so App can check if completion is needed
          onAuthSuccess({
            user: data.user,
            profile: data.profile,
          });
          setLoading(false);
          return;
        }
      } else {
        // Sign in existing user
        const { data, error } = await api.signIn(
          email.trim().toLowerCase(),
          password
        );

        if (error) {
          setError(error.message || t('loginError'));
          setLoading(false);
          return;
        }

        if (data?.user && data?.profile) {
          onAuthSuccess({
            user: data.user,
            profile: data.profile,
          });
        } else {
          setError(t('loginError'));
          setLoading(false);
        }
      }
    } catch (err) {
      console.error('Auth error:', err);
      setError(err.message || t('unexpectedError'));
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50" style={{ background: 'linear-gradient(135deg, #1e293b 0%, #e42935 100%)' }}>
      {/* Language Toggle Button */}
      <button
        onClick={toggleLanguage}
        className="fixed top-4 right-4 px-4 py-2 bg-white/90 hover:bg-white rounded-lg shadow-lg text-sm font-medium transition z-50"
        style={{ color: COLORS.darkGray }}
      >
        {language === 'es' ? '🇪🇸 ES' : '🇺🇸 EN'}
      </button>
      
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-32 h-16 mx-auto mb-4 flex items-center justify-center">
            <img 
              src="https://salmon-sea-0b3caa70f.1.azurestaticapps.net/src/fic/Logo-Forte_Full_logo-H.png" 
              alt="FORTE" 
              className="w-full h-full object-contain" 
            />
          </div>
          <h1 className="text-2xl font-bold" style={{ color: COLORS.darkGray }}>
            {t('vacationManagement')}
          </h1>
          <p className="text-sm text-slate-500 mt-2">
            {t('loginWithAccount')}
          </p>
        </div>

        <form onSubmit={handleAuth} className="space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
              <AlertCircle size={18} />
              <span className="text-sm">{error}</span>
            </div>
          )}

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">
              {t('email')}
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="usuario@forteinnovation.mx"
              required
              className="w-full p-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">
              {t('password')}
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="w-full p-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={loading}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 text-white font-medium rounded-lg shadow-sm hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            style={{ backgroundColor: COLORS.primaryRed }}
          >
            {loading ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                <span>{isSignup ? 'Creating account...' : t('signingIn')}</span>
              </>
            ) : (
              <>
                <LogIn size={18} />
                <span>{isSignup ? 'Create Account' : t('signIn')}</span>
              </>
            )}
          </button>
        </form>

        <div className="mt-6 space-y-3">
          <button
            type="button"
            onClick={() => setIsSignup(!isSignup)}
            className="w-full text-sm text-slate-600 hover:text-slate-800 underline"
          >
            {isSignup ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
          </button>
          <p className="text-xs text-slate-500 text-center">
            {t('onlyForteDomain')}
          </p>
        </div>
      </div>
    </div>
  );
}

