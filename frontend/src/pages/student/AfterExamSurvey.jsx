import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { toast } from 'react-toastify';

import Loader from '../../components/Loader';
import EnhancedSurveyRenderer from '../../components/survey/EnhancedSurveyRenderer';
import { fetchStudentSurvey, submitStudentSurvey } from '../../services/surveyApi';
import { redirectToReturnUrl } from '../../utils/returnUrl';

const DEFAULT_DIFFICULTY_OPTIONS = ['Very Easy', 'Easy', 'Moderate', 'Difficult', 'Very Difficult'];

export default function AfterExamSurvey() {
  const { examId } = useParams();
  const [surveyData, setSurveyData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [questionReviews, setQuestionReviews] = useState({});
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [questionsLoading, setQuestionsLoading] = useState(false);

  const goToResult = useCallback(() => {
    redirectToReturnUrl('/result');
  }, []);

  const canRenderPostSurvey = useCallback((payload) => {
    const template = payload?.template;
    const hasTemplateQuestions = Boolean(template?.questions?.length);
    const hasQuestionReview = Boolean(
      template?.questionReviewConfig?.enabled
    );

    return Boolean(template && (hasTemplateQuestions || hasQuestionReview));
  }, []);

  // Load initial survey data
  useEffect(() => {
    const loadSurvey = async () => {
      try {
        // First load: don't fetch questions yet (optional)
        const res = await fetchStudentSurvey(examId, 'postExam', false);

        if (res.data?.alreadySubmitted) {
          goToResult();
          return;
        }

        if (!canRenderPostSurvey(res.data)) {
          toast.info('Post-exam survey is not configured. Opening result.');
          goToResult();
          return;
        }

        setSurveyData(res.data);
        
        // If question review is enabled, set up to fetch questions one at a time
        if (res.data?.questionReviewEnabled) {
          setTotalQuestions(res.data?.totalQuestions || 0);
        }
      } catch (error) {
        toast.error(error.response?.data?.message || 'Failed to load survey');
        goToResult();
      } finally {
        setLoading(false);
      }
    };

    if (examId) {
      loadSurvey();
    }
  }, [canRenderPostSurvey, examId, goToResult]);

  // Load current question when index changes
  useEffect(() => {
    if (
      surveyData?.questionReviewEnabled &&
      currentQuestionIndex < totalQuestions &&
      currentQuestionIndex >= 0
    ) {
      const loadQuestion = async () => {
        setQuestionsLoading(true);
        try {
          const res = await fetchStudentSurvey(examId, 'postExam', true, currentQuestionIndex);
          if (res.data?.examQuestion) {
            setCurrentQuestion(res.data.examQuestion);
          }
        } catch (error) {
          console.error('Failed to load question:', error);
          toast.error('Failed to load next question');
        } finally {
          setQuestionsLoading(false);
        }
      };

      loadQuestion();
    }
  }, [currentQuestionIndex, totalQuestions, surveyData?.questionReviewEnabled, examId]);

  const questionReviewConfig = surveyData?.template?.questionReviewConfig || {};

  const difficultyOptions = useMemo(() => {
    return questionReviewConfig.difficultyOptions?.length
      ? questionReviewConfig.difficultyOptions
      : DEFAULT_DIFFICULTY_OPTIONS;
  }, [questionReviewConfig.difficultyOptions]);

  const updateQuestionReview = (questionId, patch) => {
    setQuestionReviews((old) => ({
      ...old,
      [questionId]: {
        difficulty: '',
        reviewText: '',
        ...(old[questionId] || {}),
        ...patch,
      },
    }));
  };

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex((prev) => prev - 1);
    }
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < totalQuestions - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
    }
  };

  const handleSubmit = async (values) => {
    try {
      const answers = Object.entries(values).map(([fieldName, value]) => ({
        fieldName,
        value,
      }));

      // Build question reviews from collected data
      const questionReviewsPayload = [];
      if (surveyData?.questionReviewEnabled && totalQuestions > 0) {
        // Collect reviews for all questions we have data for
        for (let i = 0; i < totalQuestions; i++) {
          // Fetch each question to get its ID for the payload
          try {
            const res = await fetchStudentSurvey(examId, 'postExam', true, i);
            if (res.data?.examQuestion) {
              const qId = res.data.examQuestion._id;
              questionReviewsPayload.push({
                questionId: qId,
                difficulty: questionReviews[qId]?.difficulty || '',
                reviewText: questionReviews[qId]?.reviewText || '',
              });
            }
          } catch (_e) {
            // Skip if unable to load question
          }
        }
      }

      await submitStudentSurvey(examId, 'postExam', {
        surveyType: 'postExam',
        surveyTemplateId: surveyData.template._id,
        answers,
        questionReviews: questionReviewsPayload,
      });

      toast.success('Post-exam survey submitted');
      goToResult();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Survey submission failed');
    }
  };

  if (loading) return <Loader />;

  if (!surveyData?.template) {
    return (
      <div className="card">
        <h3>Post-exam survey unavailable</h3>
        <p className="muted">You can continue to your result.</p>
        <button type="button" onClick={goToResult}>
          View Result
        </button>
      </div>
    );
  }

  return (
    <>
      <EnhancedSurveyRenderer
        template={surveyData.template}
        submitButtonText="Submit Survey & View Result"
        onSubmit={handleSubmit}
        showProgress={true}
        autoSave={true}
        questionReviews={questionReviews}
        currentQuestion={currentQuestion}
        totalQuestions={totalQuestions}
        currentQuestionIndex={currentQuestionIndex}
        questionReviewConfig={questionReviewConfig}
        onQuestionReviewChange={updateQuestionReview}
        onPreviousQuestion={handlePreviousQuestion}
        onNextQuestion={handleNextQuestion}
        questionsLoading={questionsLoading}
      />
    </>
  );
}
