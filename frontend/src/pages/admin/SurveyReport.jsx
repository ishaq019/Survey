import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import Loader from '../../components/Loader';
import { fetchSurveyReport } from '../../services/surveyApi';
import { PieDistribution, BarDistribution } from '../../components/survey/SurveyReportCharts';
import { getReturnUrl } from '../../utils/returnUrl';

const toCountsMap = (input) => {
  if (!input) return {};
  if (Array.isArray(input)) {
    return input.reduce((acc, item) => {
      if (!item || item.name === undefined) return acc;
      acc[item.name] = Number(item.value || 0);
      return acc;
    }, {});
  }
  if (typeof input === 'object') return input;
  return {};
};

const cleanQuestionText = (text) => {
  if (!text) return "";
  return String(text).replace(/<\/?p>/gi, "").trim();
};

export default function SurveyReport() {
  const { examId } = useParams();
  const [report, setReport] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    fetchSurveyReport(examId)
      .then((data) => {
        if (!active) return;
        setReport(data);
      })
      .catch((err) => {
        if (!active) return;
        setError(err?.response?.data?.message || 'Failed to load survey report');
      });

    return () => {
      active = false;
    };
  }, [examId]);

  if (!report && !error) return <Loader />;
  if (error)
    return (
      <div className="card">
        <h3>Failed to load report</h3>
        <p className="muted">{error}</p>
      </div>
    );

  // report is the axios response; actual payload is nested under response.data.data
  const payload = report?.data?.data || report?.data || report || {};

  const legacyBefore = payload.beforeSurvey || {};
  const legacyAfter = payload.afterSurvey || {};
  const legacyQuestionReview = payload.questionReviewAnalysis || [];

  const modernPre = payload.pre || {};
  const modernPost = payload.post || {};

  // Exclude non-chartable field types and the internal questionReviews key
  const NON_CHART_TYPES = new Set(['text', 'number', 'textarea', 'email']);
  const SKIP_KEYS = new Set(['questionReviews', 'name', 'age']);

  // Build chart list from a template's question definitions
  const chartsFromTemplate = (template, dataMap) => {
    if (!template?.questions?.length) return [];
    return [...template.questions]
      .sort((a, b) => (a.order || 0) - (b.order || 0))
      .filter((q) => !NON_CHART_TYPES.has(q.type) && !SKIP_KEYS.has(q.fieldName))
      .map((q) => ({
        key: q.fieldName,
        title: q.label,
        data: toCountsMap(dataMap[q.fieldName]?.counts || {}),
      }));
  };

  // Build chart list from raw data keys when no template exists (legacy data)
  const chartsFromDataKeys = (dataMap, legacyMap, keyLabelMap) =>
    Object.entries(keyLabelMap).map(([key, title]) => ({
      key,
      title,
      data: toCountsMap(dataMap[key]?.counts || legacyMap[key] || {}),
    }));

  const preTemplate = (payload.templates || []).find((t) => t.surveyType === 'preExam');
  const postTemplate = (payload.templates || []).find((t) => t.surveyType === 'postExam');

  const preCharts = preTemplate
    ? chartsFromTemplate(preTemplate, modernPre)
    : chartsFromDataKeys(modernPre, legacyBefore, {
        gender: 'Gender Distribution',
        qualification: 'Qualification Distribution',
        learningSources: 'Learning Source',
        learningSource: 'Learning Source',
        syllabusCoverage: 'Syllabus Coverage',
        preparationTime: 'Preparation Time',
        confidence: 'Confidence Level',
        confidenceLevel: 'Confidence Level',
      });

  const postCharts = postTemplate
    ? chartsFromTemplate(postTemplate, modernPost)
    : chartsFromDataKeys(modernPost, legacyAfter, {
        overallDifficulty: 'Overall Difficulty',
        timeSufficient: 'Time Sufficiency',
        questionClarity: 'Question Clarity',
        workAreaUseful: 'Work Area Usefulness',
        difficultParts: 'Difficult Parts',
      });

  // Prefer backend-enriched questionReviewAnalysis, fall back to legacy or raw modernPost data
  const questionReviews = (
    payload.questionReviewAnalysis?.length
      ? payload.questionReviewAnalysis
      : legacyQuestionReview.length
        ? legacyQuestionReview
        : Object.entries(modernPost.questionReviews || {}).map(([questionId, item]) => ({
            questionId,
            questionNo: '—',
            questionText: '(Question text unavailable)',
            totalReviews: item.total || 0,
            difficultyDistribution: Object.entries(item.difficultyCounts || {}).map(
              ([name, value]) => ({ name, value })
            ),
            reviews: item.reviews || [],
          }))
  ).filter((item) => item.totalReviews > 0 || item.difficultyDistribution?.length > 0);

  // Derive counts from the tallied field totals when payload.summary is absent
  const derivedBefore = Object.values(modernPre).reduce(
    (max, f) => Math.max(max, f && typeof f.total === 'number' ? f.total : 0),
    0
  );
  const derivedAfter = Object.values(modernPost)
    .filter((f) => f && typeof f === 'object' && typeof f.total === 'number')
    .reduce((max, f) => Math.max(max, f.total), 0);

  const summary = payload.summary || {
    beforeSurveySubmitted: derivedBefore,
    afterSurveySubmitted: derivedAfter,
  };

  // Prefer backend-extracted writtenFeedback; fall back to legacy array or modernPost counts keys
  const writtenFeedback = payload.writtenFeedback?.length
    ? payload.writtenFeedback
    : legacyAfter.overallFeedback?.length
      ? legacyAfter.overallFeedback
      : Object.keys(modernPost.overallFeedback?.counts || {}).filter(
          (t) => t && t !== 'N/A' && t.trim().length > 0
        );

  const hasPreData = preCharts.some((c) => Object.keys(c.data).length > 0);
  const hasPostData = postCharts.some((c) => Object.keys(c.data).length > 0);

  return (
    <div className="report-layout">
      <div className="page-header">
        <div>
          <p className="eyebrow">Survey Analytics</p>
          <h2>Exam Survey Report</h2>
        </div>
        <a className="text-link" href={getReturnUrl('/admin/exams')}>
          Back to exams
        </a>
      </div>

      {/* Summary Stats */}
      <div className="stat-grid report-stat-grid">
        <div className="stat-card stat-card-accent-primary">
          <div className="stat-card-label">Before Survey Submitted</div>
          <div className="stat-card-value">{summary.beforeSurveySubmitted}</div>
        </div>
        <div className="stat-card stat-card-accent-success">
          <div className="stat-card-label">After Survey Submitted</div>
          <div className="stat-card-value">{summary.afterSurveySubmitted}</div>
        </div>
      </div>

      {/* Before Exam Survey */}
      <div className="card report-section-card">
        <div className="report-section-header">
          <div>
            <p className="eyebrow">Pre-Exam</p>
            <h3>Before Exam Survey Analysis</h3>
          </div>
          <span className="survey-response-count">
            {summary.beforeSurveySubmitted} response{summary.beforeSurveySubmitted !== 1 ? 's' : ''}
          </span>
        </div>

        {hasPreData ? (
          <div className="survey-chart-grid">
            {preCharts.map((chart) => (
              <div className="card survey-chart-card" key={chart.key}>
                <PieDistribution title={chart.title} data={chart.data} />
              </div>
            ))}
          </div>
        ) : (
          <div className="survey-empty-state">
            <p className="muted">No pre-exam survey responses yet.</p>
          </div>
        )}
      </div>

      {/* After Exam Survey */}
      <div className="card report-section-card">
        <div className="report-section-header">
          <div>
            <p className="eyebrow">Post-Exam</p>
            <h3>After Exam Survey Analysis</h3>
          </div>
          <span className="survey-response-count">
            {summary.afterSurveySubmitted} response{summary.afterSurveySubmitted !== 1 ? 's' : ''}
          </span>
        </div>

        {hasPostData ? (
          <div className="survey-chart-grid">
            {postCharts.map((chart) => (
              <div className="card survey-chart-card" key={chart.key}>
                <PieDistribution title={chart.title} data={chart.data} />
              </div>
            ))}
          </div>
        ) : (
          <div className="survey-empty-state">
            <p className="muted">No post-exam survey responses yet.</p>
          </div>
        )}
      </div>

      {/* Written Feedback */}
      <div className="card report-section-card">
        <div className="report-section-header">
          <h3>Overall Written Feedback</h3>
        </div>
        {writtenFeedback.length ? (
          <div className="feedback-list">
            {writtenFeedback.map((feedback, index) => (
              <div className="feedback-item" key={index}>
                <span className="feedback-index">{index + 1}</span>
                <p>{feedback}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="muted">No written feedback submitted.</p>
        )}
      </div>

      {/* Question Reviews */}
      <div className="card report-section-card">
        <div className="report-section-header">
          <h3>Question-wise Review Analysis</h3>
        </div>
        {questionReviews.length ? (
          <div className="table-scroll">
            <table className="question-analysis-table">
              <thead>
                <tr>
                  <th>Question</th>
                  <th>Total Reviews</th>
                  <th>Difficulty Distribution</th>
                  <th>Review Texts</th>
                </tr>
              </thead>
              <tbody>
                {questionReviews.map((item) => (
                  <tr key={item.questionId}>
                    <td>
                      <strong>Q{item.questionNo}</strong>
                      <span className="muted question-cell-text">{cleanQuestionText(item.questionText)}</span>
                    </td>
                    <td>
                      <strong>{item.totalReviews || 0}</strong>
                    </td>
                    <td>
                      {(item.difficultyDistribution || []).length ? (
                        <BarDistribution
                          title=""
                          data={toCountsMap(
                            (item.difficultyDistribution || []).reduce((acc, entry) => {
                              acc[entry.name] = entry.value;
                              return acc;
                            }, {})
                          )}
                        />
                      ) : (
                        <span className="muted">—</span>
                      )}
                    </td>
                    <td>
                      {(item.reviews || []).length ? (
                        <div className="feedback-list-compact">
                          {item.reviews.map((review, i) => (
                            <p className="feedback-item-compact" key={i}>
                              {review}
                            </p>
                          ))}
                        </div>
                      ) : (
                        <span className="muted">No text reviews</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="muted">No question review data available.</p>
        )}
      </div>
    </div>
  );
}
