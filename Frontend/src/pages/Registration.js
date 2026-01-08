import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { ArrowLeft, ArrowRight, Check } from 'lucide-react';
import './Registration.css';

const Registration = () => {
  const navigate = useNavigate();
  const { register, error, setError } = useApp();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    dateOfBirth: '',
    username: '',
    password: '',
    confirmPassword: '',
    riskAppetite: '',
    experience: '',
    investmentGoal: ''
  });
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    // Clear error for this field
    if (errors[e.target.name]) {
      setErrors({ ...errors, [e.target.name]: '' });
    }
  };

  const validateStep1 = () => {
    const newErrors = {};
    if (!formData.firstName) newErrors.firstName = 'First name is required';
    if (!formData.lastName) newErrors.lastName = 'Last name is required';
    if (!formData.email) newErrors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Email is invalid';
    if (!formData.phone) newErrors.phone = 'Phone is required';
    else if (!/^[0-9]{10}$/.test(formData.phone)) newErrors.phone = 'Phone must be 10 digits';
    return newErrors;
  };

  const validateStep2 = () => {
    const newErrors = {};
    if (!formData.username) newErrors.username = 'Username is required';
    else if (formData.username.length < 4) newErrors.username = 'Username must be at least 4 characters';
    if (!formData.password) newErrors.password = 'Password is required';
    else if (formData.password.length < 8) newErrors.password = 'Password must be at least 8 characters';
    if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = 'Passwords do not match';
    return newErrors;
  };

  const validateStep3 = () => {
    const newErrors = {};
    if (!formData.riskAppetite) newErrors.riskAppetite = 'Risk appetite is required';
    if (!formData.experience) newErrors.experience = 'Experience level is required';
    return newErrors;
  };

  const handleNext = () => {
    let stepErrors = {};
    if (currentStep === 1) stepErrors = validateStep1();
    else if (currentStep === 2) stepErrors = validateStep2();
    else if (currentStep === 3) stepErrors = validateStep3();

    if (Object.keys(stepErrors).length > 0) {
      setErrors(stepErrors);
      return;
    }

    setCurrentStep(currentStep + 1);
  };

  const handleBack = () => {
    setCurrentStep(currentStep - 1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await register(formData);
      navigate('/dashboard');
    } catch (err) {
      console.error('Registration failed:', err);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="form-step">
            <h2>Personal Details</h2>
            <p className="step-description">Let's start with your basic information</p>
            
            <div className="form-group">
              <label>First Name *</label>
              <input
                type="text"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                placeholder="John"
              />
              {errors.firstName && <span className="error">{errors.firstName}</span>}
            </div>

            <div className="form-group">
              <label>Last Name *</label>
              <input
                type="text"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                placeholder="Doe"
              />
              {errors.lastName && <span className="error">{errors.lastName}</span>}
            </div>

            <div className="form-group">
              <label>Email *</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="john.doe@example.com"
              />
              {errors.email && <span className="error">{errors.email}</span>}
            </div>

            <div className="form-group">
              <label>Phone *</label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="9876543210"
              />
              {errors.phone && <span className="error">{errors.phone}</span>}
            </div>

            <div className="form-group">
              <label>Date of Birth</label>
              <input
                type="date"
                name="dateOfBirth"
                value={formData.dateOfBirth}
                onChange={handleChange}
              />
            </div>
          </div>
        );

      case 2:
        return (
          <div className="form-step">
            <h2>Account Security</h2>
            <p className="step-description">Create your login credentials</p>
            
            <div className="form-group">
              <label>Username *</label>
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                placeholder="johndoe123"
              />
              {errors.username && <span className="error">{errors.username}</span>}
            </div>

            <div className="form-group">
              <label>Password *</label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="••••••••"
              />
              {errors.password && <span className="error">{errors.password}</span>}
            </div>

            <div className="form-group">
              <label>Confirm Password *</label>
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="••••••••"
              />
              {errors.confirmPassword && <span className="error">{errors.confirmPassword}</span>}
            </div>
          </div>
        );

      case 3:
        return (
          <div className="form-step">
            <h2>Investment Profile</h2>
            <p className="step-description">Help us understand your investment preferences</p>
            
            <div className="form-group">
              <label>Risk Appetite *</label>
              <select
                name="riskAppetite"
                value={formData.riskAppetite}
                onChange={handleChange}
              >
                <option value="">Select risk appetite</option>
                <option value="low">Low - Conservative investor</option>
                <option value="medium">Medium - Balanced approach</option>
                <option value="high">High - Aggressive investor</option>
              </select>
              {errors.riskAppetite && <span className="error">{errors.riskAppetite}</span>}
            </div>

            <div className="form-group">
              <label>Experience Level *</label>
              <select
                name="experience"
                value={formData.experience}
                onChange={handleChange}
              >
                <option value="">Select experience level</option>
                <option value="beginner">Beginner - New to investing</option>
                <option value="intermediate">Intermediate - Some experience</option>
                <option value="expert">Expert - Experienced investor</option>
              </select>
              {errors.experience && <span className="error">{errors.experience}</span>}
            </div>

            <div className="form-group">
              <label>Investment Goal</label>
              <textarea
                name="investmentGoal"
                value={formData.investmentGoal}
                onChange={handleChange}
                placeholder="What are you investing for? (e.g., retirement, house, education)"
                rows="3"
              />
            </div>
          </div>
        );

      case 4:
        return (
          <div className="form-step review-step">
            <h2>Review & Confirm</h2>
            <p className="step-description">Please review your information before submitting</p>
            
            <div className="review-section">
              <h3>Personal Information</h3>
              <p><strong>Name:</strong> {formData.firstName} {formData.lastName}</p>
              <p><strong>Email:</strong> {formData.email}</p>
              <p><strong>Phone:</strong> {formData.phone}</p>
              {formData.dateOfBirth && <p><strong>DOB:</strong> {formData.dateOfBirth}</p>}
            </div>

            <div className="review-section">
              <h3>Account Details</h3>
              <p><strong>Username:</strong> {formData.username}</p>
            </div>

            <div className="review-section">
              <h3>Investment Profile</h3>
              <p><strong>Risk Appetite:</strong> {formData.riskAppetite}</p>
              <p><strong>Experience:</strong> {formData.experience}</p>
              {formData.investmentGoal && <p><strong>Goal:</strong> {formData.investmentGoal}</p>}
            </div>

            {error && <div className="error-message">{error}</div>}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="registration-page">
      <div className="registration-container">
        <div className="progress-bar">
          {[1, 2, 3, 4].map((step) => (
            <div
              key={step}
              className={`progress-step ${currentStep >= step ? 'active' : ''}`}
            >
              <div className="step-number">
                {currentStep > step ? <Check size={20} /> : step}
              </div>
              <div className="step-label">
                {step === 1 && 'Personal'}
                {step === 2 && 'Security'}
                {step === 3 && 'Profile'}
                {step === 4 && 'Review'}
              </div>
            </div>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="registration-form">
          {renderStep()}

          <div className="form-actions">
            {currentStep > 1 && (
              <button type="button" onClick={handleBack} className="btn-back">
                <ArrowLeft size={20} /> Back
              </button>
            )}
            
            {currentStep < 4 ? (
              <button type="button" onClick={handleNext} className="btn-next">
                Next <ArrowRight size={20} />
              </button>
            ) : (
              <button type="submit" className="btn-submit">
                Complete Registration
              </button>
            )}
          </div>

          <div className="form-footer">
            Already have an account?{' '}
            <button type="button" onClick={() => navigate('/login')} className="link-button">
              Login here
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Registration;