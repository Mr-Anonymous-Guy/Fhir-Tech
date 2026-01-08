/**
 * ABHA Authentication Service
 * Handles ABHA ID authentication with OTP verification
 */

import { toast } from 'sonner';

// Resolve API base URL dynamically
const resolveApiBaseUrl = () => {
    const envBase = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL;
    if (envBase && !envBase.includes("yourdomain.com") && !envBase.startsWith("@")) {
        return envBase.replace(/\/$/, "");
    }

    if (typeof window !== "undefined") {
        const isLocal =
            window.location.hostname === "localhost" ||
            window.location.hostname === "127.0.0.1" ||
            window.location.hostname.startsWith("192.168.") ||
            window.location.hostname === "[::1]";

        if (isLocal && window.location.port !== "3001") {
            return "http://localhost:3001";
        }
    }

    return ""; // Relative path
};

const API_BASE_URL = resolveApiBaseUrl();

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
 * Robust JSON fetch wrapper that handles non-JSON responses gracefully
 */
async function safeJsonFetch(url: string, options: RequestInit) {
    const response = await fetch(url, options);
    const contentType = response.headers.get("content-type");

    // If not JSON, it's likely an HTML error page (404/500)
    if (!contentType || !contentType.includes("application/json")) {
        const text = await response.text();
        const isHtml = text.trim().startsWith('<') || text.includes('The page could not be found');

        if (isHtml) {
            throw new Error(`API returned an HTML error instead of JSON. This usually means the backend server is not running or the route is incorrect. (Status: ${response.status})`);
        }

        throw new Error(`Unexpected response format: ${text.slice(0, 50)}...`);
    }

    const result = await response.json();

    if (!response.ok) {
        throw new Error(result.error || result.message || `API Error (${response.status})`);
    }

    return result;
}

/**
 * Send OTP to the phone number associated with ABHA ID
 */
export const sendAbhaOTP = async (abhaId: string, phoneNumber: string): Promise<{ success: boolean; message: string }> => {
    try {
        const data = await safeJsonFetch(`${API_BASE_URL}/api/auth/abha/send-otp`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ abhaId, phoneNumber }),
        });

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
        const data = await safeJsonFetch(`${API_BASE_URL}/api/auth/abha/verify-otp`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ abhaId, phoneNumber, otp }),
        });

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
        const data = await safeJsonFetch(`${API_BASE_URL}/api/auth/abha/profile/${abhaId}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        });

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
