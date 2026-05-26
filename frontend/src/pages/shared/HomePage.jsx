import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { buildAppUrl } from '../../utils/appPaths';
import { getReturnUrl } from '../../utils/returnUrl';
import '../../styles/components/SurveyHome.css';

export default function HomePage() {
  const navigate = useNavigate();
  const [exams, setExams] = useState([]);
  const [selectedExamId, setSelectedExamId] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchExams = async () => {
      try {
        setLoading(true);
        setError('');
        const res = await api.get('/exams');
        const examList = res.data?.data || [];
        setExams(examList);
        if (examList.length > 0) setSelectedExamId(examList[0]._id);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load exams. Check Survey backend and MongoDB URI.');
      } finally {
        setLoading(false);
      }
    };

    fetchExams();
  }, []);

  const filteredExams = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return exams;
    return exams.filter((exam) =>
      [exam.title, exam.name, exam.description].some((value) => String(value || '').toLowerCase().includes(term))
    );
  }, [exams, search]);

  const selectedExam = exams.find((exam) => exam._id === selectedExamId);

  const openPath = (path) => {
    if (!selectedExamId) return;
    navigate(path.replace(':examId', selectedExamId));
  };

  return (
    <div className="survey-home-page">
      <section className="survey-home-hero">
        <div>
          <p className="eyebrow">Survey Center</p>
          <h2>Choose a quiz and manage its surveys</h2>
          <p className="muted">
            Pick a quiz from the dropdown. Then manage survey questions, test the student survey, or open the report.
          </p>
        </div>
        <div className="survey-home-badge">Simple Public Mode</div>
      </section>

      <section className="survey-home-grid">
        <div className="card survey-selector-card">
          <label className="field-group">
            <span>Search Quiz</span>
            <input
              value={search}
              placeholder="Type quiz name here..."
              onChange={(event) => setSearch(event.target.value)}
            />
          </label>

          <label className="field-group">
            <span>Choose Quiz</span>
            {loading ? (
              <div className="skeleton-input" />
            ) : (
              <select value={selectedExamId} onChange={(event) => setSelectedExamId(event.target.value)}>
                {filteredExams.length === 0 ? (
                  <option value="">No quizzes found</option>
                ) : (
                  filteredExams.map((exam) => (
                    <option key={exam._id} value={exam._id}>
                      {exam.title || exam.name || 'Untitled Exam'}
                    </option>
                  ))
                )}
              </select>
            )}
          </label>

          {error && <div className="error">{error}</div>}

          {selectedExam && (
            <div className="selected-exam-card">
              <h3>{selectedExam.title || selectedExam.name}</h3>
              <p>{selectedExam.description || 'No description available.'}</p>
              <div className="selected-exam-meta">
                <span>{selectedExam.status || 'scheduled'}</span>
                <span>{selectedExam.duration || 0} min</span>
                <span>Pre: {selectedExam.surveyConfig?.preExamEnabled ? 'On' : 'Off'}</span>
                <span>Post: {selectedExam.surveyConfig?.postExamEnabled ? 'On' : 'Off'}</span>
              </div>
            </div>
          )}

          <div className="survey-home-actions">
            <button type="button" disabled={!selectedExamId} onClick={() => openPath('/admin/exams/:examId/survey-templates')}>
              Manage Survey Questions
            </button>
            <button type="button" className="secondary-button" disabled={!selectedExamId} onClick={() => openPath('/student/exams/:examId/before-survey')}>
              Preview Before-Quiz Survey
            </button>
            <button type="button" className="secondary-button" disabled={!selectedExamId} onClick={() => openPath('/student/exams/:examId/after-survey')}>
              Preview After-Quiz Survey
            </button>
            <button type="button" className="secondary-button" disabled={!selectedExamId} onClick={() => openPath('/admin/exams/:examId/survey-report')}>
              View Survey Report
            </button>
          </div>
        </div>

        <div className="card integration-card">
          <p className="eyebrow">Quiz App Integration</p>
          <h3>How Quiz App Opens Survey</h3>
          <p className="muted">The Quiz app automatically uses this kind of link. You do not need to paste tokens or login details.</p>
          <pre>{`${buildAppUrl('/student/exams/<examId>/after-survey')}?returnUrl=${encodeURIComponent(
            getReturnUrl('/result')
          )}&participantId=<studentId>`}</pre>
        </div>
      </section>
    </div>
  );
}
