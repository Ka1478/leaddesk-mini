const validateLeadSubmission = (req, res, next) => {
  const { name, email, budget, message } = req.body;
  const errors = {};

  // Name validation
  if (!name || typeof name !== 'string' || !name.trim()) {
    errors.name = 'Name is required';
  } else if (name.trim().length < 2) {
    errors.name = 'Name must be at least 2 characters long';
  } else if (name.trim().length > 100) {
    errors.name = 'Name cannot exceed 100 characters';
  }

  // Email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || typeof email !== 'string' || !email.trim()) {
    errors.email = 'Email address is required';
  } else if (!emailRegex.test(email.trim())) {
    errors.email = 'Please enter a valid email address (e.g. name@domain.com)';
  }

  // Budget validation - allows any custom typed budget string or preset selection
  if (!budget || typeof budget !== 'string' || !budget.trim()) {
    errors.budget = 'Please enter or select a budget';
  } else if (budget.trim().length > 100) {
    errors.budget = 'Budget description cannot exceed 100 characters';
  }

  // Message validation
  if (!message || typeof message !== 'string' || !message.trim()) {
    errors.message = 'Project message is required';
  } else if (message.trim().length < 10) {
    errors.message = 'Message must be at least 10 characters long';
  } else if (message.trim().length > 2000) {
    errors.message = 'Message cannot exceed 2000 characters';
  }

  if (Object.keys(errors).length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Server validation failed',
      errors,
    });
  }

  next();
};

module.exports = { validateLeadSubmission };
