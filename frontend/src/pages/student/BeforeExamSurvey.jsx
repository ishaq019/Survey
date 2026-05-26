import React, { useCallback, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { toast } from 'react-toastify';

import Loader from '../../components/Loader';
import EnhancedSurveyRenderer from '../../components/survey/EnhancedSurveyRenderer';
import { fetchStudentSurvey, submitStudentSurvey } from '../../services/surveyApi';
import { redirectToReturnUrl } from '../../utils/returnUrl';

export default function BeforeExamSurvey() {
  const { examId } = useParams();
  const [surveyData, setSurveyData] = useState(null);
  const [loading, setLoading] = useState(true);

  const continueToExam = useCallback(() => {
    redirectToReturnUrl(`/student/exams/${examId}/attempt`);
  }, [examId]);

  useEffect(() => {
    const loadSurvey = async () => {
      try {
        const res = await fetchStudentSurvey(examId, 'preExam');

        if (res.data?.alreadySubmitted) {
          continueToExam();
          return;
        }

        if (!res.data?.template || !res.data?.template?.questions?.length) {
          toast.info('Pre-exam survey is not configured. Starting exam directly.');
          continueToExam();
          return;
        }

        setSurveyData(res.data);
      } catch (error) {
        toast.error(error.response?.data?.message || 'Failed to load survey');
        continueToExam();
      } finally {
        setLoading(false);
      }
    };

    if (examId) {
      loadSurvey();
    }
  }, [continueToExam, examId]);

  const handleSubmit = async (values) => {
    try {
      const answers = Object.entries(values).map(([fieldName, value]) => ({
        fieldName,
        value,
      }));

      await submitStudentSurvey(examId, 'preExam', {
        surveyType: 'preExam',
        surveyTemplateId: surveyData.template._id,
        answers,
      });

      toast.success('Pre-exam survey submitted');
      continueToExam();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Survey submission failed');
    }
  };

  if (loading) return <Loader />;

  if (!surveyData?.template) {
    return (
      <div className="card">
        <h3>Pre-exam survey unavailable</h3>
        <p className="muted">You can continue to the quiz application.</p>
        <button type="button" onClick={continueToExam}>
          Continue to Exam
        </button>
      </div>
    );
  }

  return (
    <EnhancedSurveyRenderer
      template={surveyData.template}
      submitButtonText="Submit Survey & Start Exam"
      onSubmit={handleSubmit}
      showProgress={true}
      autoSave={true}
    />
  );
}
