import mongoose, { Schema, Document } from 'mongoose';

// User model with username
export interface IUser extends Document {
  email: string;
  username: string;
  full_name?: string;
  created_at: Date;
  updated_at: Date;
  profile_data?: any;
}

const UserSchema = new Schema<IUser>({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3,
    maxlength: 30
  },
  full_name: {
    type: String,
    trim: true
  },
  profile_data: {
    type: Schema.Types.Mixed
  }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

// FHIR Data model
export interface IFHIRData extends Document {
  user_id: mongoose.Types.ObjectId;
  resource_type: string;
  resource_data: any;
  created_at: Date;
  updated_at: Date;
  metadata?: {
    version?: string;
    tags?: string[];
    source?: string;
  };
}

const FHIRDataSchema = new Schema<IFHIRData>({
  user_id: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  resource_type: {
    type: String,
    required: true,
    enum: ['Patient', 'Observation', 'Condition', 'MedicationRequest', 'DiagnosticReport', 'Encounter', 'AllergyIntolerance', 'Immunization', 'Procedure', 'Organization', 'Practitioner', 'Other']
  },
  resource_data: {
    type: Schema.Types.Mixed,
    required: true
  },
  metadata: {
    version: String,
    tags: [String],
    source: String
  }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

// Patient data model
export interface IPatientData extends Document {
  user_id: mongoose.Types.ObjectId;
  patient_info: {
    name: string;
    age: number;
    gender: string;
    contact: string;
    address?: string;
    emergency_contact?: string;
  };
  medical_history: any[];
  current_medications: any[];
  allergies: any[];
  vital_signs: any[];
  created_at: Date;
  updated_at: Date;
}

const PatientDataSchema = new Schema<IPatientData>({
  user_id: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  patient_info: {
    name: { type: String, required: true },
    age: { type: Number, required: true },
    gender: { type: String, required: true },
    contact: { type: String, required: true },
    address: String,
    emergency_contact: String
  },
  medical_history: [Schema.Types.Mixed],
  current_medications: [Schema.Types.Mixed],
  allergies: [Schema.Types.Mixed],
  vital_signs: [Schema.Types.Mixed]
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

// Export models
export const User = mongoose.model<IUser>('User', UserSchema);
export const FHIRData = mongoose.model<IFHIRData>('FHIRData', FHIRDataSchema);
export const PatientData = mongoose.model<IPatientData>('PatientData', PatientDataSchema);