import React from 'react';

export default function SurveyQuestionInput({ question, value, onChange }) {
  const options = question.options || [];

  if (question.type === 'text') {
    return (
      <input
        type="text"
        value={value || ''}
        placeholder={question.placeholder || 'Enter your answer'}
        onChange={(event) => onChange(event.target.value)}
      />
    );
  }

  if (question.type === 'number') {
    return (
      <input
        type="number"
        value={value || ''}
        placeholder={question.placeholder || 'Enter number'}
        onChange={(event) => onChange(event.target.value)}
      />
    );
  }

  if (question.type === 'textarea') {
    return (
      <textarea
        rows="4"
        value={value || ''}
        placeholder={question.placeholder || 'Write your answer'}
        onChange={(event) => onChange(event.target.value)}
      />
    );
  }

  if (question.type === 'singleChoice') {
    return (
      <div className="survey-options">
        {options.map((option) => (
          <label className="survey-option" key={option}>
            <input
              type="radio"
              name={question.fieldName}
              value={option}
              checked={value === option}
              onChange={(event) => onChange(event.target.value)}
            />
            {option}
          </label>
        ))}
      </div>
    );
  }

  if (question.type === 'multiSelect') {
    const selectedValues = Array.isArray(value) ? value : [];

    return (
      <div className="survey-options">
        {options.map((option) => (
          <label className="survey-option" key={option}>
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
            {option}
          </label>
        ))}
      </div>
    );
  }

  if (question.type === 'rating') {
    const min = Number(question.config?.min) || 1;
    const max = Number(question.config?.max) || 5;

    const ratings = Array.from({ length: max - min + 1 }, (_, index) => min + index);

    return (
      <div className="survey-options rating-options">
        {ratings.map((rating) => (
          <label className="survey-option" key={rating}>
            <input
              type="radio"
              name={question.fieldName}
              value={rating}
              checked={Number(value) === rating}
              onChange={(event) => onChange(Number(event.target.value))}
            />
            {rating}
          </label>
        ))}
      </div>
    );
  }

  return (
    <input
      type="text"
      value={value || ''}
      placeholder="Enter your answer"
      onChange={(event) => onChange(event.target.value)}
    />
  );
}
