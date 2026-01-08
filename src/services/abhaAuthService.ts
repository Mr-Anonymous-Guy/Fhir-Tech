/**
 * ABHA Authentication Service
 * Handles ABHA ID authentication with OTP verification
 */

import { toast } from 'sonner';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export interface AbhaSignupData {
    abhaId: string;
    phoneNumber: string;
    otp?: string;
}

export interface AbhaProfile {
    abhaId: string;
    abhaAddress: string;
    name: string;
    gender: string;
    dateOfBirth: string;
    phoneNumber: string;
    email?: string;
}

/**
 * Send OTP to the phone number associated with ABHA ID
 */
export const sendAbhaOTP = async (abhaId: string, phoneNumber: string): Promise<{ success: boolean; message: string }> => {
    try {
        const response = await fetch(`${API_BASE_URL}/api/auth/abha/send-otp`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ abhaId, phoneNumber }),
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Failed to send OTP');
        }

        return {
            success: true,
            message: data.message || 'OTP sent successfully',
        };
    } catch (error) {
        console.error('Send OTP error:', error);
        throw error;
    }
};

/**
 * Verify OTP and create/login user account
 */
export const verifyAbhaOTP = async (abhaId: string, phoneNumber: string, otp: string): Promise<{ user: any; token: string }> => {
    try {
        const response = await fetch(`${API_BASE_URL}/api/auth/abha/verify-otp`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ abhaId, phoneNumber, otp }),
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Invalid OTP');
        }

        return {
            user: data.user,
            token: data.token,
        };
    } catch (error) {
        console.error('Verify OTP error:', error);
        throw error;
    }
};

/**
 * Get ABHA profile details
 */
export const getAbhaProfile = async (abhaId: string): Promise<AbhaProfile> => {
    try {
        const response = await fetch(`${API_BASE_URL}/api/auth/abha/profile/${abhaId}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Failed to fetch ABHA profile');
        }

        return data.profile;
    } catch (error) {
        console.error('Get ABHA profile error:', error);
        throw error;
    }
};

/**
 * Validate ABHA ID format
 */
export const validateAbhaId = (abhaId: string): boolean => {
    // ABHA ID format: 12-3456-7890-1234 (14 digits with hyphens)
    const abhaIdRegex = /^\d{2}-\d{4}-\d{4}-\d{4}$/;
    return abhaIdRegex.test(abhaId);
};

/**
 * Validate phone number format
 */
export const validatePhoneNumber = (phoneNumber: string): boolean => {
    // Indian phone number format: +91 XXXXXXXXXX or XXXXXXXXXX (10 digits)
    const phoneRegex = /^(\+91[\s]?)?[6-9]\d{9}$/;
    return phoneRegex.test(phoneNumber.replace(/\s/g, ''));
};

/**
 * Format ABHA ID with hyphens
 */
export const formatAbhaId = (value: string): string => {
    // Remove all non-digits
    const digits = value.replace(/\D/g, '');

    // Format as XX-XXXX-XXXX-XXXX
    if (digits.length <= 2) return digits;
    if (digits.length <= 6) return `${digits.slice(0, 2)}-${digits.slice(2)}`;
    if (digits.length <= 10) return `${digits.slice(0, 2)}-${digits.slice(2, 6)}-${digits.slice(6)}`;
    return `${digits.slice(0, 2)}-${digits.slice(2, 6)}-${digits.slice(6, 10)}-${digits.slice(10, 14)}`;
};

/**
 * Format phone number with country code
 */
export const formatPhoneNumber = (value: string): string => {
    // Remove all non-digits
    const digits = value.replace(/\D/g, '');

    // Add +91 prefix if not present
    if (digits.length === 10) {
        return `+91 ${digits}`;
    }

    return value;
};
