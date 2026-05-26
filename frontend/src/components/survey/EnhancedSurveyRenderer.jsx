import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import SimpleSurveyQuestionInput from './SimpleSurveyQuestionInput';
import '../../styles/components/SimpleSurveyQuestionInput.css';
import '../../styles/components/EnhancedSurveyRenderer.css';
import stripHtml from '../../utils/stripHtml';

export default function EnhancedSurveyRenderer({
  template,
  initialValues = {},
  onSubmit,
  submitButtonText = 'Submit',
  hideSubmit = false,
  showProgress = true,
  autoSave = false,
  questionReviews = {},
  currentQuestion = null,
  totalQuestions = 0,
  currentQuestionIndex = 0,
  questionReviewConfig = {},
  onQuestionReviewChange,
  onPreviousQuestion,
  onNextQuestion,
  questionsLoading = false,
}) {
  const [values, setValues] = useState(initialValues || {});
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDraftSaving, setIsDraftSaving] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const showAllQuestions = false;

  const questions = [...(template.questions || [])].sort(
    (a, b) => Number(a.order || 0) - Number(b.order || 0)
  );

  const requiredQuestions = questions.filter((q) => q.required);
  const answeredRequired = requiredQuestions.filter((q) => {
    const value = values[q.fieldName];
    return (
      value !== undefined &&
      value !== null &&
      value !== '' &&
      (!Array.isArray(value) || value.length > 0)
    );
  });

  const progress =
    requiredQuestions.length > 0 ? (answeredRequired.length / requiredQuestions.length) * 100 : 100;

  // Auto-save functionality
  const saveDraft = useCallback(async () => {
    if (!autoSave || Object.keys(values).length === 0) return;

    setIsDraftSaving(true);
    try {
      localStorage.setItem(`survey-draft-${template._id}`, JSON.stringify(values));
    } catch (_error) {
      localStorage.removeItem(`survey-draft-${template._id}`);
    } finally {
      setIsDraftSaving(false);
    }
  }, [values, template._id, autoSave]);

  // Load draft on mount
  useEffect(() => {
    if (autoSave) {
      try {
        const draft = localStorage.getItem(`survey-draft-${template._id}`);
        if (draft) {
          const draftValues = JSON.parse(draft);
          setValues((prev) => ({ ...prev, ...draftValues }));
        }
      } catch (_error) {
        localStorage.removeItem(`survey-draft-${template._id}`);
      }
    }
  }, [template._id, autoSave]);

  // Auto-save with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      saveDraft();
    }, 2000);

    return () => clearTimeout(timer);
  }, [values, saveDraft]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event) => {
      // Only handle arrow keys when not focused on input elements
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName)) {
        return;
      }

      if ((event.key === 'ArrowLeft' || event.key === 'ArrowUp') && currentStep > 0) {
        event.preventDefault();
        setCurrentStep((prev) => Math.max(0, prev - 1));
      } else if ((event.key === 'ArrowRight' || event.key === 'ArrowDown') && currentStep < questions.length - 1) {
        event.preventDefault();
        setCurrentStep((prev) => Math.min(questions.length - 1, prev + 1));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentStep, questions.length]);

  const updateValue = useCallback(
    (fieldName, value) => {
      setValues((prev) => ({ ...prev, [fieldName]: value }));
      setTouched((prev) => ({ ...prev, [fieldName]: true }));

      // Clear error for this field if it exists
      if (errors[fieldName]) {
        setErrors((prev) => ({ ...prev, [fieldName]: null }));
      }
    },
    [errors]
  );

  const validateField = useCallback(
    (fieldName, value) => {
      const question = questions.find((q) => q.fieldName === fieldName);
      if (!question) return null;

      if (question.required) {
        const isEmptyArray = Array.isArray(value) && value.length === 0;
        const isEmptyValue = value === undefined || value === null || value === '';

        if (isEmptyValue || isEmptyArray) {
          return `${question.label} is required`;
        }
      }

      // Additional validation based on question type
      if (question.type === 'email' && value) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) {
          return 'Please enter a valid email address';
        }
      }

      if (question.type === 'number' && value) {
        const num = Number(value);
        if (isNaN(num)) {
          return 'Please enter a valid number';
        }
      }

      return null;
    },
    [questions]
  );

  const validateForm = useCallback(() => {
    const newErrors = {};
    let isValid = true;

    for (const question of questions) {
      if (question.required) {
        const error = validateField(question.fieldName, values[question.fieldName]);
        if (error) {
          newErrors[question.fieldName] = error;
          isValid = false;
        }
      }
    }

    setErrors(newErrors);
    setTouched(questions.reduce((acc, q) => ({ ...acc, [q.fieldName]: true }), {}));

    return isValid;
  }, [questions, values, validateField]);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (isSubmitting) return;

    if (!validateForm()) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);

    try {
      await onSubmit(values);

      // Clear draft after successful submission
      if (autoSave) {
        localStorage.removeItem(`survey-draft-${template._id}`);
      }
    } catch (error) {
      toast.error(error.message || 'Failed to submit survey');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFieldBlur = useCallback(
    (fieldName) => {
      setTouched((prev) => ({ ...prev, [fieldName]: true }));

      const error = validateField(fieldName, values[fieldName]);
      setErrors((prev) => ({ ...prev, [fieldName]: error }));
    },
    [values, validateField]
  );

  const clearDraft = () => {
    localStorage.removeItem(`survey-draft-${template._id}`);
    setValues({});
    setTouched({});
    setErrors({});
    toast.info('Draft cleared');
  };

  const reviewDifficultyOptions = questionReviewConfig?.difficultyOptions || [
    'Very Easy',
    'Easy',
    'Moderate',
    'Difficult',
    'Very Difficult',
  ];

  const showQuestionReviews =
    template.surveyType === 'postExam' &&
    questionReviewConfig?.enabled &&
    totalQuestions > 0 &&
    currentQuestion;

  return (
    <div className="survey-page">
      {/* Progress Indicator */}
      {showProgress && requiredQuestions.length > 0 && (
        <div className="survey-progress survey-fade-in">
          <div className="survey-progress-bar">
            <div className="survey-progress-fill" style={{ width: `${progress}%` }} />
          </div>
          <div className="survey-progress-text">
            {answeredRequired.length} of {requiredQuestions.length} required questions answered
          </div>
        </div>
      )}

      {/* Survey Header */}
      <div className="card survey-card survey-fade-in">
        <div className="survey-header">
          <h2>{template.title}</h2>
          <div className="survey-type-badge">
            {template.surveyType === 'preExam' ? 'Pre-Exam' : 'Post-Exam'}
          </div>
        </div>

        {/* Draft indicator */}
        {autoSave && Object.keys(values).length > 0 && (
          <div className="survey-draft-indicator">
            <span className="muted">{isDraftSaving ? 'Saving...' : 'Draft saved'}</span>
            <button
              type="button"
              onClick={clearDraft}
              className="text-link"
              style={{ fontSize: '0.875rem' }}
            >
              Clear draft
            </button>
          </div>
        )}
      </div>

      {/* Survey Form */}
      <form onSubmit={handleSubmit} className="survey-form survey-form-step-mode">
        <div className="survey-questions">
          {questions.map((question, index) => {
            if (!showAllQuestions && index !== currentStep) {
              return null;
            }

            const error = touched[question.fieldName] ? errors[question.fieldName] : null;
            const value = values[question.fieldName];

            return (
              <div
                key={question.fieldName}
                className={`survey-question survey-question-step ${question.required ? 'required' : ''} survey-slide-up`}
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="survey-question-header">
                  <label className="survey-question-label">
                    <span className="survey-question-number">Q{index + 1}.</span>
                    <span className="survey-question-text">{stripHtml(question.label)}</span>
                    {question.required && <span className="survey-required-mark">*</span>}
                  </label>
                  {question.helpText && (
                    <div
                      className="question-help-text"
                      dangerouslySetInnerHTML={{
                        __html: question.helpText,
                      }}
                    />
                  )}
                </div>

                <SimpleSurveyQuestionInput
                  question={question}
                  value={value}
                  error={error}
                  onChange={(newValue) => updateValue(question.fieldName, newValue)}
                  onBlur={() => handleFieldBlur(question.fieldName)}
                />

                {error && <div className="survey-field-error">{error}</div>}
              </div>
            );
          })}
        </div>

        {showQuestionReviews && (
          <div className="survey-question-reviews-section">
            <div className="survey-reviews-header card">
              <div className="survey-header">
                <h3>Question-wise Review</h3>
                <p className="muted">
                  Rate the difficulty of each exam question and add optional feedback. You can skip any question.
                </p>
              </div>
            </div>

            {/* Single Question Review - One at a Time */}
            <div className="survey-question-review-card card">
              {questionsLoading ? (
                <div className="review-loading">Loading question...</div>
              ) : currentQuestion ? (
                <>
                  <div className="review-question-header">
                    <span className="review-question-number">Q{currentQuestionIndex + 1}</span>
                    <span className="review-question-text">{stripHtml(currentQuestion.questionText)}</span>
                  </div>

                  <div className="review-form-group">
                    <label className="field-group">
                      <span>Difficulty</span>
                      <select
                        value={questionReviews[currentQuestion._id]?.difficulty || ''}
                        onChange={(event) =>
                          onQuestionReviewChange?.(currentQuestion._id, {
                            difficulty: event.target.value,
                          })
                        }
                      >
                        <option value="">-- Select difficulty (optional) --</option>
                        {reviewDifficultyOptions.map((option) => (
                          <option value={option} key={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    </label>

                    {questionReviewConfig?.allowReviewText !== false && (
                      <label className="field-group">
                        <span>Feedback</span>
                        <textarea
                          rows="2"
                          value={questionReviews[currentQuestion._id]?.reviewText || ''}
                          placeholder="Optional feedback about this question..."
                          onChange={(event) =>
                            onQuestionReviewChange?.(currentQuestion._id, {
                              reviewText: event.target.value,
                            })
                          }
                          className="review-textarea"
                        />
                      </label>
                    )}
                  </div>

                  {/* Navigation Controls for Questions */}
                  <div className="survey-question-navigation" style={{ marginTop: '1.5rem', display: 'flex', gap: '1rem', justifyContent: 'space-between', alignItems: 'center' }}>
                    <button
                      type="button"
                      onClick={onPreviousQuestion}
                      disabled={currentQuestionIndex === 0}
                      className="survey-nav-control prev-button"
                    >
                      ← Previous Question
                    </button>

                    <span className="question-counter" style={{ textAlign: 'center', whiteSpace: 'nowrap' }}>
                      {currentQuestionIndex + 1} of {totalQuestions}
                    </span>

                    <button
                      type="button"
                      onClick={onNextQuestion}
                      disabled={currentQuestionIndex === totalQuestions - 1}
                      className="survey-nav-control next-button"
                    >
                      Next Question →
                    </button>
                  </div>
                </>
              ) : null}
            </div>
          </div>
        )}

        {/* Enhanced Navigation for step-by-step mode */}
        {!showAllQuestions && (
          <div className="survey-enhanced-navigation">
            {/* Step Indicator */}
            <div className="survey-step-indicator">
              <div className="step-dots-container">
                {questions.map((question, index) => {
                  const isCompleted =
                    touched[question.fieldName] &&
                    values[question.fieldName] !== undefined &&
                    values[question.fieldName] !== '';
                  const isCurrent = index === currentStep;
                  const isAccessible = index <= currentStep || isCompleted;

                  return (
                    <button
                      key={question.fieldName}
                      type="button"
                      className={`step-dot ${isCurrent ? 'active' : ''} ${isCompleted ? 'completed' : ''} ${!isAccessible ? 'disabled' : ''}`}
                      onClick={() => isAccessible && setCurrentStep(index)}
                      disabled={!isAccessible}
                      title={`Question ${index + 1}: ${stripHtml(question.label) || question.fieldName}`}
                    >
                      {isCompleted ? (
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                          <path
                            d="M10 3L4.5 8.5L2 6"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      ) : (
                        <span>{index + 1}</span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Step Labels */}
              <div className="step-labels">
                <span className="step-current">
                  Question {currentStep + 1} of {questions.length}
                </span>
                <span className="step-progress">
                  {
                    Object.keys(values).filter(
                      (key) => values[key] !== undefined && values[key] !== ''
                    ).length
                  }{' '}
                  answered
                </span>
              </div>
            </div>

            {/* Navigation Controls */}
            <div className="survey-navigation-controls">
              <button
                type="button"
                onClick={() => setCurrentStep((prev) => Math.max(0, prev - 1))}
                disabled={currentStep === 0}
                className="survey-nav-control prev-button"
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path
                    d="M11 3L5 8L11 13"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <span>Previous</span>
              </button>

              <div className="survey-keyboard-hint">
                <kbd>←</kbd> <kbd>→</kbd> to navigate
              </div>

              <button
                type="button"
                onClick={() => setCurrentStep((prev) => Math.min(questions.length - 1, prev + 1))}
                disabled={currentStep === questions.length - 1}
                className="survey-nav-control next-button"
              >
                <span>Next</span>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path
                    d="M5 3L11 8L5 13"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* Form Actions */}
        {!hideSubmit && (
          <div className="survey-actions">
            {autoSave && (
              <button
                type="button"
                onClick={saveDraft}
                disabled={isDraftSaving}
                className="survey-save-draft"
              >
                {isDraftSaving ? 'Saving...' : 'Save Draft'}
              </button>
            )}

            <button type="submit" disabled={isSubmitting} className="survey-submit">
              {isSubmitting ? 'Submitting...' : submitButtonText}
            </button>
          </div>
        )}
      </form>
    </div>
  );
}
