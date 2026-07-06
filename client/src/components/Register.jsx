// client/src/components/Register.jsx

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { User, Mail, Lock, Eye, EyeOff, Loader2 } from 'lucide-react';

// Validation Schema using Zod
const registerSchema = z
  .object({
    name: z.string().min(2, 'Name must be at least 2 characters long').max(50, 'Name must be less than 50 characters'),
    email: z.string().min(1, 'Email is required').email('Please enter a valid email address'),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters long')
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
      .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
      .regex(/[0-9]/, 'Password must contain at least one number')
      .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export default function Register({ onToggleMode }) {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [apiError, setApiError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const { register: signup, googleLogin } = useAuth();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: '', email: '', password: '', confirmPassword: '' },
  });

  const onSubmit = async (data) => {
    setIsLoading(true);
    setApiError('');
    try {
      const { name, email, password } = data;
      const response = await signup({ name, email, password });
      if (response.success) {
        navigate('/dashboard');
      }
    } catch (err) {
      setApiError(err.response?.data?.error || 'Registration failed. Please check details or try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    setIsLoading(true);
    setApiError('');
    try {
      const response = await googleLogin(credentialResponse.credential);
      if (response.success) {
        navigate('/dashboard');
      }
    } catch (err) {
      setApiError(err.response?.data?.error || 'Google Authentication failed.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md animate-fade-in">
      {/* Premium Card Container */}
      <div className="card-premium p-10 space-y-8">
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500/20 to-teal-500/20 border border-amber-500/30 mb-2">
            <User className="h-7 w-7 text-amber-400" />
          </div>
          <h2 className="text-4xl font-bold gradient-teal-gold">
            Create Account
          </h2>
          <p className="text-sm text-slate-400 font-medium">Join IntellectBill AI as Administrator</p>
        </div>

        {/* Error Alert */}
        {apiError && (
          <div className="p-4 rounded-xl border border-red-500/30 bg-red-500/10 text-red-300 text-sm font-medium flex items-start gap-3 animate-pulse">
            <div className="w-1.5 h-1.5 rounded-full bg-red-400 mt-2 flex-shrink-0" />
            {apiError}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {/* Name Field */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-widest">
              Full Name
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <User className="h-5 w-5 text-amber-400/60" />
              </div>
              <input
                type="text"
                placeholder="Jane Doe"
                {...register('name')}
                className={`input-premium pl-12 ${
                  errors.name 
                    ? 'border-red-500/50 focus:ring-red-500/30 focus:border-red-500' 
                    : 'focus:border-teal-500'
                }`}
              />
            </div>
            {errors.name && (
              <p className="text-xs text-red-400 font-medium">{errors.name.message}</p>
            )}
          </div>

          {/* Email Field */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-widest">
              Email Address
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Mail className="h-5 w-5 text-teal-400/60" />
              </div>
              <input
                type="email"
                placeholder="name@company.com"
                {...register('email')}
                className={`input-premium pl-12 ${
                  errors.email 
                    ? 'border-red-500/50 focus:ring-red-500/30 focus:border-red-500' 
                    : 'focus:border-teal-500'
                }`}
              />
            </div>
            {errors.email && (
              <p className="text-xs text-red-400 font-medium">{errors.email.message}</p>
            )}
          </div>

          {/* Password Field */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-widest">
              Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-teal-400/60" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                {...register('password')}
                className={`input-premium pl-12 pr-12 ${
                  errors.password 
                    ? 'border-red-500/50 focus:ring-red-500/30 focus:border-red-500' 
                    : 'focus:border-teal-500'
                }`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-500 hover:text-teal-400 transition-colors"
              >
                {showPassword ? (
                  <EyeOff className="h-5 w-5" />
                ) : (
                  <Eye className="h-5 w-5" />
                )}
              </button>
            </div>
            {errors.password && (
              <p className="text-xs text-red-400 font-medium">{errors.password.message}</p>
            )}
          </div>

          {/* Confirm Password Field */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-widest">
              Confirm Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-teal-400/60" />
              </div>
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder="••••••••"
                {...register('confirmPassword')}
                className={`input-premium pl-12 pr-12 ${
                  errors.confirmPassword 
                    ? 'border-red-500/50 focus:ring-red-500/30 focus:border-red-500' 
                    : 'focus:border-teal-500'
                }`}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-500 hover:text-teal-400 transition-colors"
              >
                {showConfirmPassword ? (
                  <EyeOff className="h-5 w-5" />
                ) : (
                  <Eye className="h-5 w-5" />
                )}
              </button>
            </div>
            {errors.confirmPassword && (
              <p className="text-xs text-red-400 font-medium">{errors.confirmPassword.message}</p>
            )}
          </div>

          {/* Create Account Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full btn-primary mt-8 flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>Creating Account...</span>
              </>
            ) : (
              <span>Create Account</span>
            )}
          </button>
        </form>

        {/* Divider */}
        <div className="divider-premium" />

        {/* Google Sign Up */}
        <div className="space-y-3">
          <p className="text-xs text-slate-400 text-center font-medium">Or register with</p>
          <div className="flex justify-center">
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={() => setApiError('Google registration was cancelled or encountered an error.')}
              theme="filled_dark"
              size="large"
              width="100%"
              shape="rectangular"
            />
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center mt-8">
        <p className="text-sm text-slate-400">
          Already have an account?{' '}
          <button
            onClick={onToggleMode}
            className="font-semibold text-teal-400 hover:text-teal-300 transition-colors focus:outline-none"
          >
            Sign in
          </button>
        </p>
      </div>
    </div>
  );
}
