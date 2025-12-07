import React, { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { Loader2, CheckCircle, AlertCircle } from 'lucide-react';

export default function MagicLinkVerify({ token, onSuccess, onError }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const verifyToken = async () => {
      if (!token) {
        setError('Invalid magic link token');
        setLoading(false);
        if (onError) onError('Invalid token');
        return;
      }

      try {
        const { data, error } = await api.verifyMagicLink(token);

        if (error) {
          setError(error.message || 'Failed to verify magic link');
          setLoading(false);
          if (onError) onError(error.message);
          return;
        }

        if (data?.user && data?.profile && data?.token) {
          setLoading(false);
          if (onSuccess) {
            onSuccess({
              user: data.user,
              profile: data.profile,
            });
          }
        } else {
          setError('Invalid response from server');
          setLoading(false);
          if (onError) onError('Invalid response');
        }
      } catch (err) {
        console.error('Magic link verify error:', err);
        setError(err.message || 'An unexpected error occurred');
        setLoading(false);
        if (onError) onError(err.message);
      }
    };

    verifyToken();
  }, [token, onSuccess, onError]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <Loader2 size={32} className="animate-spin mx-auto mb-4" style={{ color: '#e42935' }} />
          <p className="text-slate-600">Verifying magic link...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50" style={{ background: 'linear-gradient(135deg, #1e293b 0%, #e42935 100%)' }}>
        <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertCircle size={18} className="mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="font-medium">Verification Failed</p>
                <p className="text-sm mt-1">{error}</p>
              </div>
            </div>
          </div>
          <button
            onClick={() => window.location.href = '/'}
            className="w-full mt-4 py-3 px-4 text-white font-medium rounded-lg shadow-sm hover:opacity-90 transition"
            style={{ backgroundColor: '#e42935' }}
          >
            Go to Sign In
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="text-center">
        <CheckCircle size={32} className="mx-auto mb-4 text-green-600" />
        <p className="text-slate-600">Magic link verified successfully!</p>
      </div>
    </div>
  );
}

