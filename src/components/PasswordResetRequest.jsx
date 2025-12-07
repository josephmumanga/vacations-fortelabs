import React, { useState } from 'react';
import { api } from '../lib/api';
import { Mail, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { useTranslation } from '../hooks/useTranslation';

const COLORS = {
  primaryRed: '#e42935',
  darkGray: '#494949',
};

export default function PasswordResetRequest({ onSuccess, onBack }) {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const validateEmailDomain = (email) => {
    const allowedDomain = '@forteinnovation.mx';
    return email.toLowerCase().endsWith(allowedDomain.toLowerCase());
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Validate email domain
    if (!validateEmailDomain(email)) {
      setError(t('onlyForteDomain') || 'Only @forteinnovation.mx email addresses are allowed');
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await api.requestPasswordReset(email.trim().toLowerCase());

      if (error) {
        setError(error.message || 'Failed to send password reset link. Please try again.');
        setLoading(false);
        return;
      }

      setSuccess(true);
      setLoading(false);
      
      if (onSuccess) {
        setTimeout(() => onSuccess(), 2000);
      }
    } catch (err) {
      console.error('Password reset request error:', err);
      setError(err.message || 'An unexpected error occurred. Please try again.');
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="space-y-4">
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
          <div className="flex items-start gap-2">
            <CheckCircle size={18} className="mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="font-medium">Password reset link sent!</p>
              <p className="text-sm mt-1">
                Check your email ({email}) for a password reset link. The link will expire in 1 hour.
              </p>
            </div>
          </div>
        </div>
        {onBack && (
          <button
            onClick={onBack}
            className="w-full text-sm text-slate-600 hover:text-slate-800 underline"
          >
            Back to sign in
          </button>
        )}
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          <div className="flex items-start gap-2">
            <AlertCircle size={18} className="mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <span className="text-sm whitespace-pre-line">{error}</span>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-700">
          {t('email') || 'Email'}
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

      <button
        type="submit"
        disabled={loading}
        className="w-full py-3 px-4 text-white font-medium rounded-lg shadow-sm hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        style={{ backgroundColor: COLORS.primaryRed }}
      >
        {loading ? (
          <>
            <Loader2 size={18} className="animate-spin" />
            <span>Sending reset link...</span>
          </>
        ) : (
          <>
            <Mail size={18} />
            <span>Send Reset Link</span>
          </>
        )}
      </button>

      {onBack && (
        <button
          type="button"
          onClick={onBack}
          className="w-full text-sm text-slate-600 hover:text-slate-800 underline"
        >
          Back to sign in
        </button>
      )}
    </form>
  );
}

