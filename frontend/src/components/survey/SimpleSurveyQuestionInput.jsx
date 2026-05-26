import React from 'react';

export default function SimpleSurveyQuestionInput({ question, value, onChange }) {
  const options = question.options || [];

  if (question.type === 'textarea' || question.type === 'paragraph') {
    return (
      <textarea
        value={value || ''}
        placeholder={question.placeholder || 'Type your answer here...'}
        onChange={(event) => onChange(event.target.value)}
        className="simple-paragraph-input"
        rows={4}
      />
    );
  }

  if (question.type === 'number') {
    return (
      <input
        type="number"
        value={value ?? ''}
        placeholder={question.placeholder || 'Enter a number'}
        onChange={(event) => onChange(event.target.value)}
        className="simple-text-input"
      />
    );
  }

  if (question.type === 'rating') {
    const min = Number(question.config?.min || 1);
    const max = Number(question.config?.max || 5);
    const ratings = Array.from({ length: max - min + 1 }, (_, index) => min + index);

    return (
      <div className="simple-options rating-options">
        {ratings.map((rating) => (
          <label className="simple-option rating-option" key={rating}>
            <input
              type="radio"
              name={question.fieldName}
              value={rating}
              checked={Number(value) === rating}
              onChange={() => onChange(rating)}
            />
            <span className="option-text">{rating}</span>
          </label>
        ))}
      </div>
    );
  }

  if (question.type === 'singleChoice') {
    return (
      <div className="simple-options">
        {options.map((option) => (
          <label className="simple-option" key={option}>
            <input
              type="radio"
              name={question.fieldName}
              value={option}
              checked={value === option}
              onChange={(event) => onChange(event.target.value)}
            />
            <span className="option-text">{option}</span>
          </label>
        ))}
      </div>
    );
  }

  if (question.type === 'multiSelect') {
    const selectedValues = Array.isArray(value) ? value : [];

    return (
      <div className="simple-options">
        {options.map((option) => (
          <label className="simple-option" key={option}>
            <input
              type="checkbox"
              value={option}
              checked={selectedValues.includes(option)}
              onChange={(event) => {
                if (event.target.checked) {
                  onChange([...selectedValues, option]);
                } else {
                  onChange(selectedValues.filter((item) => item !== option));
                }
              }}
            />
            <span className="option-text">{option}</span>
          </label>
        ))}
      </div>
    );
  }

  return (
    <input
      type="text"
      value={value || ''}
      placeholder={question.placeholder || 'Type your answer here...'}
      onChange={(event) => onChange(event.target.value)}
      className="simple-text-input"
    />
  );
}
