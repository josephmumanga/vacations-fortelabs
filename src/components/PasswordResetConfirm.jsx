import React, { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { Key, Loader2, CheckCircle, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { useTranslation } from '../hooks/useTranslation';

const COLORS = {
  primaryRed: '#e42935',
  darkGray: '#494949',
};

export default function PasswordResetConfirm({ token: propToken, onSuccess, onBack }) {
  const { t } = useTranslation();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Get token from prop or URL params
  const urlParams = new URLSearchParams(window.location.search);
  const urlToken = urlParams.get('token');
  const token = propToken || urlToken;

  useEffect(() => {
    if (!token) {
      setError('Invalid reset token. Please request a new password reset link.');
    }
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validate passwords match
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    // Validate password strength
    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await api.confirmPasswordReset(token, newPassword);

      if (error) {
        setError(error.message || 'Failed to reset password. Please try again.');
        setLoading(false);
        return;
      }

      setSuccess(true);
      setLoading(false);
      
      if (onSuccess) {
        setTimeout(() => onSuccess(), 2000);
      }
    } catch (err) {
      console.error('Password reset confirm error:', err);
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
              <p className="font-medium">Password reset successfully!</p>
              <p className="text-sm mt-1">
                Your password has been updated. You can now sign in with your new password.
              </p>
            </div>
          </div>
        </div>
        {onBack && (
          <button
            onClick={onBack}
            className="w-full py-3 px-4 text-white font-medium rounded-lg shadow-sm hover:opacity-90 transition"
            style={{ backgroundColor: COLORS.primaryRed }}
          >
            Go to Sign In
          </button>
        )}
      </div>
    );
  }

  if (!token) {
    return (
      <div className="space-y-4">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          <div className="flex items-start gap-2">
            <AlertCircle size={18} className="mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <span className="text-sm">Invalid reset token. Please request a new password reset link.</span>
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
          New Password
        </label>
        <div className="relative">
          <input
            type={showPassword ? 'text' : 'password'}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="Enter new password"
            required
            minLength={6}
            className="w-full p-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 pr-10"
            disabled={loading}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
        <p className="text-xs text-slate-500">Must be at least 6 characters</p>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-700">
          Confirm Password
        </label>
        <div className="relative">
          <input
            type={showConfirmPassword ? 'text' : 'password'}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Confirm new password"
            required
            minLength={6}
            className="w-full p-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 pr-10"
            disabled={loading}
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
          >
            {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
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
            <span>Resetting password...</span>
          </>
        ) : (
          <>
            <Key size={18} />
            <span>Reset Password</span>
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

