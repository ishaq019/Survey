import React, { useEffect, useState } from 'react';
import RichTextEditor from '../RichTextEditor';
import '../../styles/components/SurveyFormRedesigned.css';

const QUESTION_TYPES = [
  { value: 'singleChoice', label: 'Multiple Choice', icon: '◉', description: 'Choose one answer' },
  { value: 'multiSelect', label: 'Checkboxes', icon: '☐', description: 'Choose multiple answers' },
  { value: 'text', label: 'Text Box', icon: '✎', description: 'Short answer' },
  { value: 'textarea', label: 'Text Area', icon: '⬚', description: 'Long answer' },
  { value: 'rating', label: 'Star Rating', icon: '★', description: 'Rate from 1 to 5' },
];

const DEFAULT_OPTIONS = {
  singleChoice: ['Option 1', 'Option 2', 'Option 3', 'Option 4'],
  multiSelect: ['Option 1', 'Option 2', 'Option 3', 'Option 4'],
  text: [],
  textarea: [],
  rating: [],
};

const normalizeQuestion = (question, index) => ({
  ...question,
  id: question.id || question._id || question.fieldName || `question_${index}`,
  type: question.type === 'paragraph' ? 'textarea' : question.type,
  options: question.options || [],
  order: Number.isInteger(question.order) ? question.order : index,
  config: question.config || (question.type === 'rating' ? { min: 1, max: 5, step: 1 } : {}),
});

export default function SimpleSurveyTemplateForm({ template, onSave, saving = false }) {
  const [questions, setQuestions] = useState([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    if (template) {
      setTitle(template.title || 'Survey');
      setDescription(template.description || '');
      setQuestions((template.questions || []).map(normalizeQuestion));
    } else {
      setTitle('Survey');
      setDescription('Please answer the following questions');
      setQuestions([]);
    }
  }, [template]);

  const addQuestion = (type) => {
    const timestamp = Date.now();
    const selectedType = QUESTION_TYPES.find((item) => item.value === type);
    const newQuestion = {
      id: String(timestamp),
      label: `New ${selectedType?.label || 'Question'}`,
      fieldName: `question_${timestamp}`,
      type,
      required: false,
      options: [...DEFAULT_OPTIONS[type]],
      order: questions.length,
      config: type === 'rating' ? { min: 1, max: 5, step: 1 } : {},
    };

    setQuestions([...questions, newQuestion]);
  };

  const updateQuestion = (index, field, value) => {
    const updated = [...questions];
    updated[index] = { ...updated[index], [field]: value };
    setQuestions(updated);
  };

  const updateOption = (questionIndex, optionIndex, value) => {
    const updated = [...questions];
    const options = [...(updated[questionIndex].options || [])];
    options[optionIndex] = value;
    updated[questionIndex] = { ...updated[questionIndex], options };
    setQuestions(updated);
  };

  const addOption = (questionIndex) => {
    const updated = [...questions];
    const options = [...(updated[questionIndex].options || [])];
    options.push(`Option ${options.length + 1}`);
    updated[questionIndex] = { ...updated[questionIndex], options };
    setQuestions(updated);
  };

  const removeOption = (questionIndex, optionIndex) => {
    const updated = [...questions];
    const options = [...(updated[questionIndex].options || [])];
    options.splice(optionIndex, 1);
    updated[questionIndex] = { ...updated[questionIndex], options };
    setQuestions(updated);
  };

  const removeQuestion = (index) => {
    setQuestions(questions.filter((_, questionIndex) => questionIndex !== index));
  };

  const handleDragStart = (event, index) => {
    event.dataTransfer.setData('text/plain', index);
    event.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (event, dropIndex) => {
    event.preventDefault();
    const dragIndex = Number(event.dataTransfer.getData('text/plain'));

    if (dragIndex === dropIndex) return;

    const draggedQuestion = questions[dragIndex];
    const newQuestions = [...questions];
    newQuestions.splice(dragIndex, 1);
    newQuestions.splice(dropIndex, 0, draggedQuestion);

    setQuestions(newQuestions.map((item, index) => ({ ...item, order: index })));
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    const cleanedQuestions = questions.map((item, index) => {
      const question = { ...item };
      delete question.id;

      return {
        ...question,
        type: question.type === 'paragraph' ? 'textarea' : question.type,
        label: question.label || `Question ${index + 1}`,
        fieldName: question.fieldName || `question_${index + 1}`,
        options: ['singleChoice', 'multiSelect'].includes(question.type)
          ? (question.options || []).filter(Boolean)
          : [],
        order: index,
      };
    });

    const updatedTemplate = {
      ...template,
      title,
      description,
      questions: cleanedQuestions,
    };

    onSave(updatedTemplate);
  };

  return (
    <form onSubmit={handleSubmit} className="survey-form-redesigned">
      {/* Survey Header Section */}
      <div className="card survey-header-section">
        <h2>Survey Settings</h2>
        <div className="form-group">
          <label>Survey Title</label>
          <input
            type="text"
            placeholder="e.g., Pre-Exam Feedback"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            className="input-field"
            required
          />
        </div>
        <div className="form-group">
          <label>Description (Optional)</label>
          <textarea
            placeholder="Brief description about this survey..."
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            className="input-field textarea-field"
            rows={2}
          />
        </div>
      </div>

      {/* Add Questions Section */}
      <div className="card add-questions-section">
        <h2>Add Questions</h2>
        <p className="section-hint">Click any question type below to add it</p>
        <div className="question-type-grid">
          {QUESTION_TYPES.map((type) => (
            <button
              key={type.value}
              type="button"
              onClick={() => addQuestion(type.value)}
              className="question-type-card"
              title={type.description}
            >
              <div className="type-icon-large">{type.icon}</div>
              <div className="type-label">{type.label}</div>
              <div className="type-desc">{type.description}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Questions List */}
      <div className="card questions-section">
        <div className="questions-header">
          <h2>Your Questions ({questions.length})</h2>
          {questions.length > 0 && <span className="hint-text">Drag to reorder</span>}
        </div>

        {questions.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📋</div>
            <p className="empty-title">No questions yet</p>
            <p className="empty-text">Add your first question using the types above</p>
          </div>
        ) : (
          <div className="questions-list-new">
            {questions.map((question, index) => {
              const isChoiceType = ['singleChoice', 'multiSelect'].includes(question.type);
              const isRating = question.type === 'rating';
              const typeInfo = QUESTION_TYPES.find((t) => t.value === question.type);

              return (
                <div
                  key={question.id || question.fieldName || index}
                  draggable
                  onDragStart={(event) => handleDragStart(event, index)}
                  onDragOver={handleDragOver}
                  onDrop={(event) => handleDrop(event, index)}
                  className="question-item-card"
                >
                  {/* Question Number and Controls */}
                  <div className="question-number-bar">
                    <div className="question-num-badge">Q{index + 1}</div>
                    <span className="drag-indicator">⋯⋯</span>
                    <div className="question-controls">
                      <span className="type-badge">{typeInfo?.icon}</span>
                      <button
                        type="button"
                        onClick={() => removeQuestion(index)}
                        className="btn-delete"
                        aria-label="Delete question"
                        title="Delete question"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>

                  {/* Question Text Editor */}
                  <div className="question-text-section">
                    <label className="label-small">Question Text</label>
                    <RichTextEditor
                      value={question.label}
                      onChange={(value) => updateQuestion(index, 'label', value)}
                      placeholder="Type your question here..."
                    />
                  </div>

                  {/* Options for Choice Questions */}
                  {isChoiceType && (
                    <div className="options-section">
                      <div className="options-header-bar">
                        <label className="label-small">Answer Options</label>
                        <button
                          type="button"
                          onClick={() => addOption(index)}
                          className="btn-add-option"
                        >
                          + Add Option
                        </button>
                      </div>
                      <div className="options-container">
                        {(question.options || []).map((option, optionIndex) => (
                          <div key={`option-${optionIndex}`} className="option-input-group">
                            <span className="option-number">{optionIndex + 1}.</span>
                            <input
                              type="text"
                              value={option}
                              onChange={(event) =>
                                updateOption(index, optionIndex, event.target.value)
                              }
                              placeholder="Enter option"
                              className="input-field option-field"
                              required
                            />
                            {(question.options || []).length > 2 && (
                              <button
                                type="button"
                                onClick={() => removeOption(index, optionIndex)}
                                className="btn-remove-option"
                                aria-label="Remove option"
                                title="Remove option"
                              >
                                ✕
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Rating Configuration */}
                  {isRating && (
                    <div className="rating-config-section">
                      <label className="label-small">Rating Scale</label>
                      <div className="rating-inputs">
                        <div className="rating-input-group">
                          <label>From</label>
                          <input
                            type="number"
                            min="1"
                            max="10"
                            value={question.config?.min || 1}
                            onChange={(event) =>
                              updateQuestion(index, 'config', {
                                ...(question.config || {}),
                                min: Number(event.target.value),
                              })
                            }
                            className="input-field"
                          />
                        </div>
                        <div className="rating-input-group">
                          <label>To</label>
                          <input
                            type="number"
                            min="2"
                            max="10"
                            value={question.config?.max || 5}
                            onChange={(event) =>
                              updateQuestion(index, 'config', {
                                ...(question.config || {}),
                                max: Number(event.target.value),
                              })
                            }
                            className="input-field"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Required Checkbox */}
                  <div className="required-section">
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={question.required}
                        onChange={(event) =>
                          updateQuestion(index, 'required', event.target.checked)
                        }
                      />
                      <span>Make this question required</span>
                    </label>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Save Button */}
      <div className="save-section">
        <button
          type="submit"
          disabled={saving || questions.length === 0}
          className="btn-save-primary"
        >
          {saving ? 'Saving Survey...' : `Save Survey (${questions.length} Question${questions.length !== 1 ? 's' : ''})`}
        </button>
        {questions.length === 0 && (
          <p className="hint-error">Add at least one question to save</p>
        )}
      </div>
    </form>
  );
}
