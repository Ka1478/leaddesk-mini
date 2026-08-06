import React, { useState } from 'react';
import { ArrowRight, CheckCircle2 } from 'lucide-react';

export default function LandingPage({ setToast }) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    budget: '$5,000 – $20,000',
    message: '',
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const presetBudgets = [
    '$1,000 – $5,000',
    '$5,000 – $20,000',
    '$20,000 – $50,000',
    '$50,000+',
  ];

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Full name is required';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Name must be at least 2 characters';
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim()) {
      newErrors.email = 'Email address is required';
    } else if (!emailRegex.test(formData.email.trim())) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.budget.trim()) {
      newErrors.budget = 'Please enter or select a budget';
    }

    if (!formData.message.trim()) {
      newErrors.message = 'Project message is required';
    } else if (formData.message.trim().length < 10) {
      newErrors.message = 'Message must be at least 10 characters long';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  const selectPresetBudget = (preset) => {
    setFormData((prev) => ({ ...prev, budget: preset }));
    if (errors.budget) {
      setErrors((prev) => ({ ...prev, budget: null }));
    }
  };

  const saveLocalTicket = (ticketData) => {
    try {
      const stored = localStorage.getItem('leaddesk_client_tickets');
      const existing = stored ? JSON.parse(stored) : [];
      existing.unshift(ticketData);
      localStorage.setItem('leaddesk_client_tickets', JSON.stringify(existing));
    } catch (e) {
      console.error('LocalStorage write error:', e);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSuccess(false);

    if (!validateForm()) {
      setToast({ type: 'error', text: 'Please fill in all required ticket fields.' });
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const responseText = await response.text();
      let data = {};
      try {
        data = responseText ? JSON.parse(responseText) : {};
      } catch (parseErr) {
        console.error('Non-JSON response:', responseText);
      }

      if (!response.ok) {
        if (data.errors) {
          setErrors(data.errors);
        }
        throw new Error(data.message || `Server error (${response.status})`);
      }

      if (data.data) {
        saveLocalTicket(data.data);
      }

      setIsSuccess(true);
      setToast({ type: 'success', text: '🎟️ Ticket submitted successfully! It has landed on our desk.' });
      setFormData({
        name: '',
        email: '',
        budget: '$5,000 – $20,000',
        message: '',
      });
      setErrors({});
    } catch (err) {
      setToast({ type: 'error', text: err.message || 'Error submitting ticket.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const dots = Array.from({ length: 26 });

  return (
    <div className="container">
      <div className="hero-layout">
        {/* Left Content Side */}
        <div className="hero-left">
          <div className="eyebrow-tag">NOW TAKING REQUESTS</div>
          <h1 className="hero-heading">
            Tell us what you’re<br />
            building.<br />
            We’ll take it from<br />
            here.
          </h1>
          <p className="hero-description">
            One short ticket is all it takes. Fill it out, and it lands directly on our desk — no forms disappearing into a void.
          </p>

          <hr className="hero-stats-divider" />

          <div className="hero-stats-row">
            <div className="stat-item">
              <div className="stat-header">REPLY TIME</div>
              <div className="stat-body">&lt; 1 business day</div>
            </div>

            <div className="stat-item">
              <div className="stat-header">TICKET FIELDS</div>
              <div className="stat-body">4</div>
            </div>

            <div className="stat-item">
              <div className="stat-header">COST TO ASK</div>
              <div className="stat-body">Free</div>
            </div>
          </div>
        </div>

        {/* Right "INTAKE TICKET" Card Side */}
        <div className="ticket-wrapper">
          <div className="ticket-perforation-header">
            {dots.map((_, i) => (
              <div key={i} className="perforation-notch" />
            ))}
          </div>

          <div className="ticket-card">
            <div className="ticket-header">
              <span className="ticket-title">INTAKE TICKET</span>
              <span className="ticket-number">No. —</span>
            </div>

            {isSuccess && (
              <div 
                style={{
                  background: '#e6f4ea',
                  color: '#137333',
                  padding: '0.8rem 1rem',
                  borderRadius: '8px',
                  marginBottom: '1.25rem',
                  fontSize: '0.88rem',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                }}
              >
                <CheckCircle2 size={18} />
                <span>Ticket submitted! We will reply within 1 business day.</span>
              </div>
            )}

            <form onSubmit={handleSubmit} noValidate>
              {/* Full Name */}
              <div className="ticket-group">
                <label className="ticket-label" htmlFor="name">
                  Full name
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  className={`ticket-input ${errors.name ? 'has-error' : ''}`}
                  placeholder="Jordan Lee"
                  value={formData.name}
                  onChange={handleInputChange}
                />
                {errors.name && <div className="ticket-error">{errors.name}</div>}
              </div>

              {/* Email */}
              <div className="ticket-group">
                <label className="ticket-label" htmlFor="email">
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  className={`ticket-input ${errors.email ? 'has-error' : ''}`}
                  placeholder="jordan@company.com"
                  value={formData.email}
                  onChange={handleInputChange}
                />
                {errors.email && <div className="ticket-error">{errors.email}</div>}
              </div>

              {/* Budget Range */}
              <div className="ticket-group">
                <label className="ticket-label" htmlFor="budget">
                  Budget range
                </label>
                <input
                  type="text"
                  id="budget"
                  name="budget"
                  className={`ticket-input ${errors.budget ? 'has-error' : ''}`}
                  placeholder="e.g. $5,000 – $20,000 or type custom amount..."
                  value={formData.budget}
                  onChange={handleInputChange}
                />
                
                <div className="budget-presets">
                  {presetBudgets.map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      className={`preset-chip ${formData.budget === preset ? 'active' : ''}`}
                      onClick={() => selectPresetBudget(preset)}
                    >
                      {preset}
                    </button>
                  ))}
                </div>

                {errors.budget && <div className="ticket-error">{errors.budget}</div>}
              </div>

              {/* Message */}
              <div className="ticket-group">
                <label className="ticket-label" htmlFor="message">
                  What are you looking to do?
                </label>
                <textarea
                  id="message"
                  name="message"
                  rows="3"
                  className={`ticket-textarea ${errors.message ? 'has-error' : ''}`}
                  placeholder="Tell us a bit about the project..."
                  value={formData.message}
                  onChange={handleInputChange}
                ></textarea>
                {errors.message && <div className="ticket-error">{errors.message}</div>}
              </div>

              <button
                type="submit"
                className="ticket-submit-btn"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  'Submitting Ticket...'
                ) : (
                  <>
                    Submit Ticket <ArrowRight size={16} />
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
